import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

// Opt-in integration smoke: real CARTO traffic, never fixtures or business writes.
// This intentionally is not part of CI. A successful HTTP image response alone
// is insufficient: CARTO can return an API KEY REQUIRED diagnostic PNG with 200.
const base = new URL(process.env.CARTO_MAP_BASE_URL || "http://127.0.0.1:3179");
assert.ok(["http:", "https:"].includes(base.protocol), "Base URL must use HTTP(S)");
assert.ok(!base.username && !base.password, "Base URL must not contain credentials");
const target = new URL("/globe", base.origin).toString();
const evidenceRoot = process.env.CARTO_MAP_EVIDENCE_DIR
  ? path.resolve(process.env.CARTO_MAP_EVIDENCE_DIR)
  : await mkdtemp(path.join(os.tmpdir(), "pawpal-carto-live-"));
const out = path.join(evidenceRoot, new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"));
await mkdir(out, { recursive: true });
const diagnosticHash = "69be4aecf9f814ba45d585801a5aa41e79b16fc88eafec5b1954a9f06a69e6be";
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const results = [];

function safeUrl(raw) {
  try { const url = new URL(raw); return url.origin + url.pathname; }
  catch { return "[non-url]"; }
}

function safeText(value) {
  return String(value)
    .replace(/https?:\/\/[^\s"'<>]+/g, safeUrl)
    .replace(/([?&][\w-]+=)[^&\s"'<>]+/g, "$1[redacted]");
}

async function waitUntil(predicate, message, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(message);
}

async function boundedBody(response) {
  let timer;
  try {
    return await Promise.race([
      response.body(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Tile PNG body did not finish within 15 seconds")), 15000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function verifySamples(samples, phase) {
  assert.ok(samples.length >= 3, `${phase}: need three different tile coordinates`);
  assert.ok(new Set(samples.map((sample) => sample.url)).size >= 3, `${phase}: coordinates must differ`);
  for (const sample of samples) {
    assert.equal(sample.status, 200, `${phase}: CARTO tile HTTP status`);
    assert.match(sample.contentType, /^image\/png(?:;|$)/i, `${phase}: tile content type`);
    assert.ok(sample.apiKeyPresent, `${phase}: CARTO API key must be present (value is never recorded)`);
    assert.notEqual(sample.sha256, diagnosticHash, `${phase}: known 2049-byte API KEY REQUIRED diagnostic PNG`);
    assert.deepEqual(sample.dimensions, { width: sample.retina ? 512 : 256, height: sample.retina ? 512 : 256 }, `${phase}: decoded PNG header dimensions`);
  }
  assert.ok(new Set(samples.map((sample) => sample.sha256)).size >= 2, `${phase}: distinct urban coordinates must not all return the same image`);
}

let browser;
try {
  browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    const record = { viewport, target, passed: false, pageErrors: [], console: [], refusedMutations: [], failedRequests: [], tiles: [], samples: [], actions: [] };
    const context = await browser.newContext({ viewport, locale: "en", reducedMotion: "reduce" });
    // Continue all real reads. Refuse unexpected writes; never fulfill a response.
    await context.route("**/*", (route) => {
      const request = route.request();
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
        record.refusedMutations.push({ method: request.method(), url: safeUrl(request.url()) });
        return route.abort("blockedbyclient");
      }
      return route.continue();
    });
    const page = await context.newPage();
    let phase = "initial", lastNavigation = Date.now(), sequence = 0;
    const sampledCoordinates = { initial: new Set(), zoom: new Set() };
    const attempts = { initial: 0, zoom: 0 };
    const pending = new Set();
    let coordinatesBeforeZoom = new Set();
    page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) lastNavigation = Date.now(); });
    page.on("pageerror", (error) => record.pageErrors.push(safeText(error.message)));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) record.console.push({ type: message.type(), text: safeText(message.text()) });
    });
    page.on("requestfailed", (request) => record.failedRequests.push({ url: safeUrl(request.url()), error: safeText(request.failure()?.errorText || "") }));
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (!/(^|\.)cartocdn\.com$/.test(url.hostname)) return;
      const coordinates = url.pathname.match(/\/(\d+)\/(\d+)\/(\d+)(@2x)?\.png$/);
      if (!coordinates) return;
      const item = {
        phase, url: safeUrl(response.url()), status: response.status(),
        contentType: response.headers()["content-type"] || "",
        apiKeyPresent: [...url.searchParams].some(([name, value]) => /^(api_?key|key)$/i.test(name) && value.length > 0),
        z: Number(coordinates[1]), x: Number(coordinates[2]), y: Number(coordinates[3]), retina: Boolean(coordinates[4]),
      };
      record.tiles.push(item);
      if (phase === "zoom" && coordinatesBeforeZoom.has(item.url)) return;
      const capturedPhase = phase;
      const seen = sampledCoordinates[capturedPhase];
      if (seen.has(item.url) || seen.size >= 4 || attempts[capturedPhase] >= 16) return;
      seen.add(item.url);
      attempts[capturedPhase] += 1;
      const sampleId = ++sequence;
      const capture = (async () => {
        try {
          const body = await boundedBody(response);
          assert.ok(body.length >= 24 && body.subarray(0, 8).equals(pngSignature), "Tile body must contain a PNG header");
          const sample = {
            ...item, bytes: body.length, sha256: createHash("sha256").update(body).digest("hex"),
            dimensions: { width: body.readUInt32BE(16), height: body.readUInt32BE(20) },
            screenshot: path.join(out, `tile-${viewport.width}-${capturedPhase}-${sampleId}.png`),
          };
          await writeFile(sample.screenshot, body);
          record.samples.push(sample);
        } catch (error) {
          item.bodyCaptureError = safeText(error.message);
          seen.delete(item.url);
        }
      })();
      pending.add(capture);
      void capture.finally(() => pending.delete(capture));
    });
    try {
      record.httpStatus = (await page.goto(target, { waitUntil: "load", timeout: 60000 })).status();
      assert.equal(record.httpStatus, 200, "Map page HTTP status");
      // A first production PWA controllerchange reload can replace the document.
      // Development has no worker, so wait on the real document/navigation state.
      await waitUntil(async () => {
        const ready = await page.evaluate(() => document.readyState === "complete").catch((error) => {
          if (/Execution context was destroyed/.test(error.message)) return false;
          throw error;
        });
        return ready && Date.now() - lastNavigation >= 2500;
      }, "Map navigation did not settle within 30 seconds");
      await page.locator("#globe-map canvas.maplibregl-canvas").waitFor({ state: "visible", timeout: 30000 });
      await waitUntil(() => record.samples.filter((sample) => sample.phase === "initial").length >= 3, "Three real initial CARTO PNG samples were not captured");
      const consent = page.getByRole("button", { name: "Essential only", exact: true });
      if (await consent.isVisible()) {
        await consent.click();
        record.actions.push("Dismissed consent with Essential only in this fresh browser context");
      }
      const closeTutorial = page.getByRole("button", { name: "Close globe tutorial", exact: true });
      if (await closeTutorial.isVisible()) await closeTutorial.click();
      await page.waitForTimeout(1000);
      record.initialScreenshot = path.join(out, `map-${viewport.width}-initial.png`);
      await page.screenshot({ path: record.initialScreenshot });
      record.tilesBeforeZoom = record.tiles.length;
      coordinatesBeforeZoom = new Set(record.tiles.map((tile) => tile.url));
      const maximumInitialZ = Math.max(...record.tiles.map((tile) => tile.z));
      phase = "zoom";
      await page.locator("button.maplibregl-ctrl-zoom-in").click();
      record.actions.push("Clicked the real Zoom in control once");
      await waitUntil(() => record.samples.filter((sample) => sample.phase === "zoom").length >= 3, "Zoom did not load three new real CARTO PNG coordinates");
      await page.waitForTimeout(1000);
      if (await closeTutorial.isVisible()) await closeTutorial.click();
      record.zoomScreenshot = path.join(out, `map-${viewport.width}-zoom.png`);
      await page.screenshot({ path: record.zoomScreenshot });
      await Promise.allSettled([...pending]);
      record.tilesAfterZoom = record.tiles.length;
      record.title = await page.title();
      record.h1 = await page.locator("h1").allTextContents();
      record.canvas = await page.locator("#globe-map canvas.maplibregl-canvas").boundingBox();
      assert.equal(new URL(page.url()).pathname, "/globe", "Page identity");
      assert.ok(record.title.includes("PawPal") && !/404|not found/i.test(record.title), "Meaningful map title");
      assert.equal(record.h1.length, 1, "Exactly one DOM h1");
      verifySamples(record.samples.filter((sample) => sample.phase === "initial"), "initial");
      verifySamples(record.samples.filter((sample) => sample.phase === "zoom"), "zoom");
      assert.ok(record.samples.some((sample) => sample.phase === "zoom" && sample.z > maximumInitialZ), "Zoom must fetch tiles at a higher zoom level");
      assert.ok(record.tiles.every((tile) => tile.status === 200), "All observed CARTO tile responses must succeed");
      assert.equal(record.pageErrors.length, 0, "No page errors");
      assert.equal(record.console.filter((message) => message.type === "error").length, 0, "No console errors");
      assert.equal(record.refusedMutations.length, 0, "No business-write requests");
      record.passed = true;
    } catch (error) {
      record.error = safeText(error.stack || error.message);
      record.failureScreenshot = path.join(out, `map-${viewport.width}-failure.png`);
      await page.screenshot({ path: record.failureScreenshot }).catch((captureError) => { record.screenshotError = safeText(captureError.message); });
    } finally {
      await Promise.allSettled([...pending]);
      await context.close();
      results.push(record);
      await writeFile(path.join(out, `map-${viewport.width}.json`), JSON.stringify(record, null, 2) + "\n");
      console.log(`${record.passed ? "PASS" : "FAIL"} ${viewport.width}x${viewport.height}: ${record.tiles.length} real tile responses, ${record.samples.length} PNG samples`);
      if (record.error) console.log(record.error);
    }
  }
} catch (error) {
  results.push({ passed: false, error: safeText(error.stack || error.message) });
} finally {
  if (browser) await browser.close();
  const result = {
    target, passed: results.length === 2 && results.every((record) => record.passed), results,
    scope: "Real CARTO raster images in the real /globe page at phone/desktop sizes, followed by one zoom. Review saved screenshots for visible streets before claiming visual acceptance.",
    boundaries: "No mocked responses, login, AI searches, chats, checkout or business writes. Logged URLs contain no query or fragment; API key values are never recorded.",
  };
  await writeFile(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(`CARTO live-map evidence: ${out}`);
  if (!result.passed) process.exitCode = 1;
}
