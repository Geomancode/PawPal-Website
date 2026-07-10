import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const evidenceDir =
  process.env.P3GB3_HOME_RUNTIME_EVIDENCE_DIR ||
  process.env.P2W2_HOME_SMOKE_EVIDENCE_DIR ||
  "";
const providedBaseUrl =
  process.env.P3GB3_HOME_RUNTIME_BASE_URL ||
  process.env.P2W2_HOME_SMOKE_BASE_URL ||
  "";
const selectedCaseName = process.env.P3GB3_HOME_RUNTIME_CASE || "";
const injectConsoleError = process.env.P3GB3_INJECT_CONSOLE_ERROR === "1";

const FRONT_POST_ID = "p3gb3-test-front";
const BACK_POST_ID = "p3gb3-test-antipode";

// TEST FIXTURE ONLY. Every API response below is intercepted in Playwright and
// never reads or writes live PawPal community data.
const READY_FIXTURE = [
  {
    id: FRONT_POST_ID,
    display_lat: 0,
    display_lng: 0,
    region_key: "p3-front",
    location_label: "Front fixture",
    category: "custom",
    pin_icon: "paw",
    snippet: "P3GB3 front-facing browser fixture",
    like_count: 4,
    comment_count: 2,
    created_at: "2026-07-10T08:00:00.000Z",
    expires_at: null,
  },
  {
    id: BACK_POST_ID,
    display_lat: 0,
    display_lng: 180,
    region_key: "p3-back",
    location_label: "Antipode fixture",
    category: "custom",
    pin_icon: "paw",
    snippet: "P3GB3 back-facing browser fixture",
    like_count: 3,
    comment_count: 1,
    created_at: "2026-07-10T08:00:00.000Z",
    expires_at: null,
  },
  {
    id: "p3gb3-test-east",
    display_lat: 18,
    display_lng: 24,
    region_key: "p3-east",
    location_label: "East fixture",
    category: "social",
    pin_icon: "social",
    snippet: "P3GB3 supporting browser fixture",
    like_count: 2,
    comment_count: 1,
    created_at: "2026-07-10T08:00:00.000Z",
    expires_at: null,
  },
];

const runtimeCases = [
  {
    name: "normal-motion-ready",
    colorScheme: "light",
    reducedMotion: "no-preference",
    apiMode: "ready",
    expectedPostsState: "ready",
  },
  {
    name: "reduced-motion-ready",
    colorScheme: "dark",
    reducedMotion: "reduce",
    apiMode: "ready",
    expectedPostsState: "ready",
  },
  {
    name: "empty-200",
    colorScheme: "light",
    reducedMotion: "no-preference",
    apiMode: "empty",
    expectedPostsState: "empty",
  },
  {
    name: "error-503",
    colorScheme: "dark",
    reducedMotion: "no-preference",
    apiMode: "error",
    expectedPostsState: "error",
  },
  {
    name: "no-webgl-fallback",
    colorScheme: "light",
    reducedMotion: "no-preference",
    apiMode: "ready",
    disableWebGL: true,
  },
];

const requiredLocaleKeys = [
  "homeGlobeRegionLabel",
  "homeGlobeLoadingPreviewLabel",
  "homeGlobeStaticPreviewLabel",
  "homeGlobeEmptyLabel",
  "homeGlobeErrorLabel",
  "homeGlobePostLinkLabel",
  "homeGlobeLikesLabel",
  "homeGlobeCommentsLabel",
  "homeGlobeSnippetFallback",
];

function serializeError(error) {
  return String(error?.stack || error?.message || error).slice(0, 1600);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function verifyLocaleKeys() {
  const locales = ["de", "en", "fr", "nl", "zh"];
  const failures = [];

  for (const locale of locales) {
    const source = await readFile(
      path.join(repoRoot, "src", "i18n", "messages", `${locale}.ts`),
      "utf8",
    );
    const missing = requiredLocaleKeys.filter(
      (key) => !new RegExp(`\\b${escapeRegExp(key)}\\s*:`).test(source),
    );
    if (missing.length > 0) failures.push(`${locale}: ${missing.join(", ")}`);
  }

  if (failures.length > 0) {
    throw new Error(`Five-locale globe key contract failed: ${failures.join("; ")}`);
  }
  console.log(
    `PASS five-locale key contract: ${requiredLocaleKeys.length} explicit keys in de/en/fr/nl/zh.`,
  );
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findPort() {
  const preferredPort = Number(process.env.P3GB3_HOME_RUNTIME_PORT || 3102);
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free localhost port found from ${preferredPort} to ${preferredPort + 19}.`);
}

async function waitForHttp(baseUrl, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let retryDelayMs = 40;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    retryDelayMs = Math.min(Math.ceil(retryDelayMs * 1.6), 1000);
  }

  throw new Error(`Timed out waiting for ${baseUrl}: ${String(lastError)}`);
}

function startDevServer(port) {
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
  child.once("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      process.stderr.write(`[dev] exited with code ${code}\n`);
    } else if (signal && signal !== "SIGTERM") {
      process.stderr.write(`[dev] exited with signal ${signal}\n`);
    }
  });

  return child;
}

async function stopDevServer(child) {
  if (!child || child.exitCode !== null) return;

  await new Promise((resolve) => {
    const killTimer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 5000);
    child.once("exit", () => {
      clearTimeout(killTimer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

function fixtureResponse(apiMode) {
  if (apiMode === "error") {
    return {
      appStatus: 503,
      transportStatus: 200,
      body: JSON.stringify({ error: "P3GB3 intercepted test fixture: service unavailable" }),
    };
  }
  return {
    appStatus: 200,
    transportStatus: 200,
    body: JSON.stringify(apiMode === "empty" ? [] : READY_FIXTURE),
  };
}

async function inspectHomepage(page) {
  return page.evaluate(
    ({ frontPostId, backPostId }) => {
      const isVisible = (element) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity || "1") > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const globe = document.querySelector("[data-testid='home-globe']");
      const markers = globe ? Array.from(globe.querySelectorAll("[data-home-globe-marker='true']")) : [];
      const findMarker = (postId) => markers.find((marker) => marker.dataset.postId === postId);
      const markerMeta = (marker) => {
        if (!marker) return null;
        const visual = marker.querySelector(".home-globe-marker-visual");
        const style = visual ? window.getComputedStyle(visual) : null;
        return {
          ariaHidden: marker.getAttribute("aria-hidden"),
          href: marker.href,
          inert: marker.inert,
          pointerEvents: window.getComputedStyle(marker).pointerEvents,
          tabIndex: marker.tabIndex,
          visible: isVisible(marker),
          animationName: style?.animationName ?? null,
          transform: style?.transform ?? null,
          transitionDuration: style?.transitionDuration ?? null,
        };
      };
      const overlayText = Array.from(
        document.querySelectorAll("nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast]"),
      )
        .filter(isVisible)
        .map((element) => element.textContent || "")
        .join(" ");

      return {
        canvasCount: globe?.querySelectorAll("canvas").length ?? 0,
        frontMarker: markerMeta(findMarker(frontPostId)),
        backMarker: markerMeta(findMarker(backPostId)),
        globeState: globe?.getAttribute("data-globe-state") ?? null,
        postsState: globe?.getAttribute("data-posts-state") ?? null,
        webglState: globe?.getAttribute("data-webgl") ?? null,
        markerCount: markers.length,
        markerCountAttribute: Number(globe?.getAttribute("data-marker-count") ?? -1),
        postLinkCount: globe?.querySelectorAll("a[href*='/post/']").length ?? 0,
        staticPreviewVisible: isVisible(globe?.querySelector(".home-globe-static-preview")),
        statusText: globe?.querySelector(".home-globe-posts-status")?.textContent?.trim() ?? "",
        h1: Array.from(document.querySelectorAll("h1")).map((element) =>
          (element.textContent || "").replace(/\s+/g, " ").trim(),
        ),
        hasFrameworkOverlay: /Unhandled Runtime Error|Build Error|Runtime Error|Application error/i.test(
          overlayText,
        ),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    },
    { frontPostId: FRONT_POST_ID, backPostId: BACK_POST_ID },
  );
}

function transitionIsDisabled(value) {
  return Boolean(
    value &&
      value
        .split(",")
        .map((part) => Number.parseFloat(part))
        .every((duration) => duration === 0),
  );
}

function addCommonFailures(result, failures) {
  const { pageMeta } = result;
  if (result.navigationError) failures.push(`navigation failed: ${result.navigationError}`);
  if (result.responseStatus !== 200) failures.push(`expected HTTP 200, got ${result.responseStatus}`);
  if (result.pageErrors.length > 0) {
    failures.push(`console zero-error gate: expected zero pageerror/unhandled rejection, got ${result.pageErrors.length}`);
  }
  if (result.consoleErrors.length > 0) {
    failures.push(`console zero-error gate: expected zero console.error, got ${result.consoleErrors.length}`);
  }
  if (pageMeta?.hasFrameworkOverlay) failures.push("framework error overlay was visible");
  if (!pageMeta?.h1?.some(Boolean)) failures.push("homepage H1 was not visible");
  if ((pageMeta?.scrollWidth ?? Number.POSITIVE_INFINITY) > (pageMeta?.viewportWidth ?? 0)) {
    failures.push(
      `375px overflow gate failed: scrollWidth=${pageMeta?.scrollWidth} viewportWidth=${pageMeta?.viewportWidth}`,
    );
  }
}

function addStateFailures(runtimeCase, result, failures) {
  const pageMeta = result.pageMeta;
  if (!pageMeta) return;

  if (runtimeCase.disableWebGL) {
    if (pageMeta.globeState !== "fallback") failures.push(`expected fallback globe, got ${pageMeta.globeState}`);
    if (pageMeta.webglState !== "unavailable") failures.push(`expected unavailable WebGL, got ${pageMeta.webglState}`);
    if (!pageMeta.staticPreviewVisible) failures.push("static preview was not visible without WebGL");
    if (result.apiRequestCount !== 0) failures.push(`expected zero API requests, got ${result.apiRequestCount}`);
    if (pageMeta.markerCount !== 0) failures.push(`expected zero live pins, got ${pageMeta.markerCount}`);
    if (pageMeta.postLinkCount !== 0) failures.push(`expected zero post links, got ${pageMeta.postLinkCount}`);
    return;
  }

  if (pageMeta.postsState !== runtimeCase.expectedPostsState) {
    failures.push(`expected posts state ${runtimeCase.expectedPostsState}, got ${pageMeta.postsState}`);
  }
  if (pageMeta.canvasCount < 1) failures.push("WebGL globe canvas was not present");
  if (result.apiRequestCount !== 1) failures.push(`expected exactly one intercepted API request, got ${result.apiRequestCount}`);

  if (runtimeCase.apiMode === "ready") {
    if (pageMeta.markerCount < 1 || pageMeta.markerCount > 12) {
      failures.push(`expected 1..12 live pins, got ${pageMeta.markerCount}`);
    }
    if (pageMeta.markerCountAttribute !== pageMeta.markerCount) {
      failures.push(
        `marker count hook mismatch: data-marker-count=${pageMeta.markerCountAttribute}, DOM=${pageMeta.markerCount}`,
      );
    }
    if (
      !pageMeta.frontMarker ||
      pageMeta.frontMarker.ariaHidden !== "false" ||
      pageMeta.frontMarker.tabIndex !== 0 ||
      pageMeta.frontMarker.pointerEvents === "none" ||
      pageMeta.frontMarker.inert
    ) {
      failures.push("front fixture pin was not interactive");
    }
    if (pageMeta.frontMarker) {
      const pathname = new URL(pageMeta.frontMarker.href).pathname;
      if (pathname !== `/post/${FRONT_POST_ID}`) {
        failures.push(`front fixture link was not locale-aware default route: ${pathname}`);
      }
    }
    if (
      !pageMeta.backMarker ||
      pageMeta.backMarker.ariaHidden !== "true" ||
      pageMeta.backMarker.tabIndex !== -1 ||
      pageMeta.backMarker.pointerEvents !== "none" ||
      !pageMeta.backMarker.inert
    ) {
      failures.push("antipode fixture pin was not fully hidden from interaction/accessibility");
    }
  } else {
    if (pageMeta.markerCount !== 0) failures.push(`expected zero live pins, got ${pageMeta.markerCount}`);
    if (pageMeta.postLinkCount !== 0) failures.push(`expected zero post links, got ${pageMeta.postLinkCount}`);
  }

  if (runtimeCase.reducedMotion === "reduce") {
    if (pageMeta.globeState !== "paused") failures.push(`expected paused globe, got ${pageMeta.globeState}`);
    if (!pageMeta.frontMarker) failures.push("front fixture pin was missing under reduced motion");
    if (pageMeta.frontMarker?.animationName !== "none") {
      failures.push(`reduced-motion pulse animation was ${pageMeta.frontMarker?.animationName}`);
    }
    if (pageMeta.frontMarker?.transform !== "none") {
      failures.push(`reduced-motion transform was ${pageMeta.frontMarker?.transform}`);
    }
    if (!transitionIsDisabled(pageMeta.frontMarker?.transitionDuration)) {
      failures.push(`reduced-motion transition duration was ${pageMeta.frontMarker?.transitionDuration}`);
    }
  } else if (runtimeCase.apiMode === "ready" && pageMeta.globeState !== "animated") {
    failures.push(`normal-motion globe was not animated: ${pageMeta.globeState}`);
  }
}

async function runCase(browser, baseUrl, runtimeCase) {
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    colorScheme: runtimeCase.colorScheme,
    reducedMotion: runtimeCase.reducedMotion,
    deviceScaleFactor: 1,
    locale: "en-US",
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  let apiRequestCount = 0;

  page.on("pageerror", (error) => pageErrors.push(serializeError(error)));
  page.on("console", (message) => {
    // Deliberately no whitelist: GPU notices are warnings in supported Chromium.
    // Every console.error is a hard failure, including the opt-in self-test below.
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 1200));
  });

  if (runtimeCase.disableWebGL) {
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        if (/^(webgl2?|experimental-webgl)$/i.test(String(type))) return null;
        return originalGetContext.call(this, type, ...args);
      };
    });
  }

  if (runtimeCase.apiMode === "error") {
    await page.addInitScript(() => {
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const response = await nativeFetch(...args);
        const requestUrl = new URL(
          typeof args[0] === "string" || args[0] instanceof URL ? args[0] : args[0].url,
          window.location.href,
        );
        if (
          requestUrl.pathname === "/api/home-globe-posts" &&
          response.headers.get("x-p3gb3-test-status") === "503"
        ) {
          // Chromium reports intercepted HTTP 503 resources as console.error before
          // application code handles them. Keep the transport clean and synthesize
          // the same Response status for the client. The Route Handler's real 503
          // transport is covered separately by test:home-globe-contract.
          return new Response(await response.text(), {
            status: 503,
            statusText: "Service Unavailable",
            headers: response.headers,
          });
        }
        return response;
      };
    });
  }

  if (injectConsoleError && runtimeCase.name === "normal-motion-ready") {
    await page.addInitScript(() => {
      console.error("P3GB3 intentional console.error hard-gate self-test");
    });
  }

  await page.route("**/api/home-globe-posts", async (route) => {
    apiRequestCount += 1;
    const fixture = fixtureResponse(runtimeCase.apiMode);
    await route.fulfill({
      status: fixture.transportStatus,
      contentType: "application/json; charset=utf-8",
      headers: {
        "cache-control": "no-store",
        "x-p3gb3-test-fixture": "true",
        "x-p3gb3-test-status": String(fixture.appStatus),
      },
      body: fixture.body,
    });
  });

  let responseStatus = null;
  let navigationError = null;
  let pageMeta = null;

  try {
    const response = await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    responseStatus = response?.status() ?? null;

    const globe = page.locator("[data-testid='home-globe']");
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
    await globe.waitFor({ state: "attached", timeout: 15000 });
    await globe.scrollIntoViewIfNeeded({ timeout: 15000 });

    if (runtimeCase.disableWebGL) {
      await page.waitForFunction(
        () => document.querySelector("[data-testid='home-globe']")?.getAttribute("data-globe-state") === "fallback",
        undefined,
        { timeout: 30000 },
      );
    } else {
      await page.waitForFunction(
        (expectedState) =>
          document.querySelector("[data-testid='home-globe']")?.getAttribute("data-posts-state") === expectedState,
        runtimeCase.expectedPostsState,
        { timeout: 60000 },
      );
      if (runtimeCase.apiMode === "ready") {
        await page.waitForFunction(
          (postId) => {
            const marker = Array.from(
              document.querySelectorAll("[data-home-globe-marker='true']"),
            ).find((element) => element.getAttribute("data-post-id") === postId);
            return marker?.getAttribute("aria-hidden") === "false";
          },
          FRONT_POST_ID,
          { timeout: 30000 },
        );
      }
    }

    pageMeta = await inspectHomepage(page);
  } catch (error) {
    navigationError = serializeError(error);
  }

  const result = {
    caseName: runtimeCase.name,
    responseStatus,
    navigationError,
    pageErrors,
    consoleErrors,
    apiRequestCount,
    pageMeta,
    failures: [],
  };
  addCommonFailures(result, result.failures);
  addStateFailures(runtimeCase, result, result.failures);

  if (evidenceDir) {
    await mkdir(path.join(evidenceDir, "screenshots"), { recursive: true });
    await mkdir(path.join(evidenceDir, "runtime-meta"), { recursive: true });
    await page.screenshot({
      path: path.join(evidenceDir, "screenshots", `${runtimeCase.name}-375.png`),
      fullPage: false,
    });
    await writeFile(
      path.join(evidenceDir, "runtime-meta", `${runtimeCase.name}.json`),
      `${JSON.stringify({ runtimeCase, ...result }, null, 2)}\n`,
    );
  }

  await context.close();
  return result;
}

let devServer = null;
let browser = null;

try {
  await verifyLocaleKeys();

  const selectedCases = selectedCaseName
    ? runtimeCases.filter((runtimeCase) => runtimeCase.name === selectedCaseName)
    : runtimeCases;
  if (selectedCases.length === 0) {
    throw new Error(
      `Unknown P3GB3_HOME_RUNTIME_CASE=${selectedCaseName}. Expected one of: ${runtimeCases
        .map((runtimeCase) => runtimeCase.name)
        .join(", ")}`,
    );
  }

  const port = providedBaseUrl ? null : await findPort();
  const baseUrl = providedBaseUrl || `http://127.0.0.1:${port}`;

  if (!providedBaseUrl) devServer = startDevServer(port);
  await waitForHttp(baseUrl, providedBaseUrl ? 60000 : 120000);

  console.log(`Homepage five-state runtime base URL: ${baseUrl}`);
  console.log(`Viewport hard gate: ${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}`);
  console.log("Fixture policy: Playwright-intercepted test data only; no live community API access.");
  if (evidenceDir) console.log(`Evidence output: ${evidenceDir}`);
  if (injectConsoleError) console.log("SELF-TEST: intentional console.error injection enabled.");

  browser = await chromium.launch({
    headless: true,
    args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  const results = [];
  for (const runtimeCase of selectedCases) {
    const result = await runCase(browser, baseUrl, runtimeCase);
    results.push(result);
    const status = result.failures.length === 0 ? "PASS" : "FAIL";
    console.log(
      `${status} ${result.caseName} status=${result.responseStatus} ` +
        `posts=${result.pageMeta?.postsState ?? "unknown"} globe=${result.pageMeta?.globeState ?? "unknown"} ` +
        `markers=${result.pageMeta?.markerCount ?? "unknown"} apiRequests=${result.apiRequestCount} ` +
        `scroll=${result.pageMeta?.scrollWidth ?? "unknown"}/${result.pageMeta?.viewportWidth ?? "unknown"} ` +
        `pageErrors=${result.pageErrors.length} consoleErrors=${result.consoleErrors.length}`,
    );
    for (const failure of result.failures) console.log(`  - ${failure}`);
    for (const pageError of result.pageErrors) console.log(`  pageerror: ${pageError}`);
    for (const consoleError of result.consoleErrors) console.log(`  console.error: ${consoleError}`);
  }

  const failed = results.filter((result) => result.failures.length > 0);
  if (failed.length > 0) {
    console.error(`Homepage five-state runtime gate failed: ${failed.length}/${results.length} cases failed.`);
    process.exitCode = 1;
  } else {
    console.log(
      `Homepage five-state runtime gate passed: ${results.length}/${results.length} cases passed ` +
        "with zero console.error, pageerror, unhandled rejection, and 375px overflow.",
    );
  }
} finally {
  if (browser) await browser.close();
  await stopDevServer(devServer);
}
