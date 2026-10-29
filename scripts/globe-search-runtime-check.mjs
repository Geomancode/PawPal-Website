import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(repoRoot, "..", "..");
const evidenceDir = process.env.P5_02_EVIDENCE_DIR || path.join(rootDir, "evidence", "P5-02");
const port = 3131;
const externalBaseUrl = process.env.P5_02_TEST_BASE_URL;
const baseUrl = externalBaseUrl || `http://127.0.0.1:${port}`;
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname), "Fixtures only run against localhost");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3MxZ5wAAAABJRU5ErkJggg==",
  "base64",
);

function isPortFree() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

function startDevServer() {
  const child = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => process.stdout.write(`[dev] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[dev] ${chunk}`));
  return child;
}

async function stopDevServer(child) {
  if (!child || child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

async function waitForServer(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/globe`, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${baseUrl}: ${String(lastError)}`);
}

async function installFixtures(page, onSearch) {
  await page.route("**/rest/v1/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "content-range": "0-0/0" },
    body: "[]",
  }));
  await page.route("https://nominatim.openstreetmap.org/reverse?**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ address: { city: "Brussels" } }),
  }));
  await page.route("https://api.open-meteo.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      current: {
        temperature_2m: 19,
        apparent_temperature: 18,
        wind_speed_10m: 8,
        relative_humidity_2m: 61,
        weather_code: 1,
      },
      daily: { precipitation_probability_max: [10], uv_index_max: [4] },
    }),
  }));
  await page.route("https://basemaps.cartocdn.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/png",
    body: transparentPng,
  }));
  await page.route("**/api/map-search", async (route) => {
    const requestBody = route.request().postDataJSON();
    onSearch(requestBody);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [{
          originalName: "Brussels Vet Fixture",
          lat: 50.8503,
          lng: 4.3517,
          zoom: 13,
          relevance: "likely",
          source: "google",
          rating: 4.8,
        }],
      }),
    });
  });
}

async function verifyPageShell(page) {
  await page.goto(`${baseUrl}/globe`, { waitUntil: "domcontentloaded" });
  assert.equal(page.url(), `${baseUrl}/globe`);
  assert.match(await page.title(), /Live Pet Globe/i);
  await page.locator("#globe-map").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("#globe-search").waitFor({ state: "visible", timeout: 30000 });
  const nextPortalText = await page.locator("nextjs-portal").evaluateAll((portals) =>
    portals.map((portal) => portal.shadowRoot?.textContent || portal.textContent || "").join("\n"),
  );
  assert.doesNotMatch(nextPortalText, /Build Error|Runtime Error|Unhandled Runtime Error/i);
}

async function runSearchCase(browser, { name, geolocationGranted }) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    geolocation: geolocationGranted ? { latitude: 50.85, longitude: 4.35 } : undefined,
    permissions: geolocationGranted ? ["geolocation"] : [],
  });
  await context.addInitScript(({ denyGeolocation }) => {
    localStorage.setItem("pawpal_globe_tutorial_done", "1");
    if (denyGeolocation) {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition(_success, error) {
            setTimeout(() => error?.({ code: 1, message: "Denied by P5-02 fixture" }), 0);
          },
        },
      });
    }
  }, { denyGeolocation: !geolocationGranted });

  const page = await context.newPage();
  const consoleProblems = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleProblems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));

  let resolveSearch;
  const searchRequest = new Promise((resolve) => { resolveSearch = resolve; });
  await installFixtures(page, resolveSearch);

  try {
    const [, worker] = await Promise.all([
      verifyPageShell(page),
      page.waitForEvent("worker", {
        predicate: (worker) => worker.url().includes("maplibre-gl-worker"),
        timeout: 30000,
      }),
    ]);
    await page.locator("#globe-map canvas.maplibregl-canvas").waitFor({ state: "visible" });
    assert.equal(new URL(worker.url()).origin, new URL(baseUrl).origin, "MapLibre worker must be served by this build");
    assert.equal(await worker.evaluate(async () => {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        if (self.worker?.actor) return true;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      return false;
    }), true, "MapLibre worker must finish initialization");
    if (geolocationGranted) {
      await page.getByText(/50\.850, 4\.350/).waitFor({ timeout: 30000 });
    } else {
      await page.getByText(/location|locatie|standort|位置/i).first().waitFor({ timeout: 30000 });
    }

    const input = page.locator("#globe-search");
    await input.fill("vet near me");
    await input.press("Enter");
    const body = await Promise.race([
      searchRequest,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Map search request was not observed")), 15000)),
    ]);

    assert.equal(body.query, "vet near me");
    if (geolocationGranted) {
      assert.ok(Math.abs(body.lat - 50.85) <= 0.01, `expected latitude 50.85, received ${body.lat}`);
      assert.ok(Math.abs(body.lng - 4.35) <= 0.01, `expected longitude 4.35, received ${body.lng}`);
    } else {
      assert.equal(Object.hasOwn(body, "lat"), false, "denied geolocation must omit latitude");
      assert.equal(Object.hasOwn(body, "lng"), false, "denied geolocation must omit longitude");
    }

    await page.getByText("Brussels Vet Fixture").last().waitFor({ timeout: 15000 });
    await page.waitForFunction(
      () => (document.querySelector(".globe-chat-sheet")?.getBoundingClientRect().height || 0) > 300,
    );
    await page.screenshot({
      path: path.join(evidenceDir, `globe-search-${name}.png`),
      fullPage: false,
    });

    assert.deepEqual(pageErrors, [], `page errors in ${name}:\n${pageErrors.join("\n")}`);
    // Chromium's software renderer emits this diagnostic while screenshots read
    // pixels. Keep it in evidence, as the existing component capture tests do.
    const driverDiagnostic = /^warning: \[\.WebGL-[^\]]+\]GL Driver Message .*GPU stall due to ReadPixels(?: \(this message will no longer repeat\))?$/;
    const driverDiagnostics = consoleProblems.filter((entry) => driverDiagnostic.test(entry));
    for (const diagnostic of driverDiagnostics) console.log(`GPU diagnostic (${name}): ${diagnostic}`);
    const relevantConsoleProblems = consoleProblems.filter(
      (entry) =>
        !driverDiagnostic.test(entry) &&
        !(
          entry.includes("was preloaded using link preload but not used") &&
          entry.includes("pawpal_logo_horizontal")
        ),
    );
    assert.deepEqual(
      relevantConsoleProblems,
      [],
      `console warnings/errors in ${name}:\n${relevantConsoleProblems.join("\n")}`,
    );
    console.log(`PASS ${name}: ${JSON.stringify(body)}`);
  } finally {
    await context.close();
  }
}

async function runWebGL2UnavailableCase(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.addInitScript(() => {
    localStorage.setItem("pawpal_globe_tutorial_done", "1");
    localStorage.setItem("pawpal-consent-v1", "essential");
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl2") return null;
      return original.call(this, type, ...args);
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await installFixtures(page, () => {});
  try {
    await page.goto(`${baseUrl}/globe`, { waitUntil: "domcontentloaded" });
    await page.locator("#globe-fallback-title").waitFor({ state: "visible" });
    assert.equal(await page.locator("canvas.maplibregl-canvas").count(), 0);
    await page.locator(".globe-fallback-action-primary").click();
    await page.locator("#globe-fallback-title").waitFor({ state: "visible" });
    assert.deepEqual(errors, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "fallback fits mobile viewport");
    await page.screenshot({ path: path.join(evidenceDir, "globe-webgl2-unavailable-mobile.png"), fullPage: true });
    console.log("PASS WebGL2 unavailable: mobile fallback and retry remain usable without initializing MapLibre");
  } finally {
    await context.close();
  }
}

if (!externalBaseUrl) assert.equal(await isPortFree(), true, `Port ${port} must be free; runtime checks never use an alternate port.`);
await mkdir(evidenceDir, { recursive: true });

const devServer = externalBaseUrl ? null : startDevServer();
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    args: ["--enable-webgl", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  await runSearchCase(browser, { name: "brussels-granted", geolocationGranted: true });
  await runSearchCase(browser, { name: "location-denied", geolocationGranted: false });
  await runWebGL2UnavailableCase(browser);
  console.log(`Globe search runtime checks passed at ${baseUrl}`);
} finally {
  await browser?.close();
  await stopDevServer(devServer);
}
