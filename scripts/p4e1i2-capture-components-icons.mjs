import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const serverRoot = process.env.P4E1I2_SERVER_ROOT
  ? path.resolve(process.env.P4E1I2_SERVER_ROOT)
  : repoRoot;
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1i2");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };

const cases = [
  {
    name: "home-first-viewport-light-375",
    route: "/",
    colorScheme: "light",
    selector: "#main-content h1",
    requiredGlyphs: ["arrow-right", "store"],
  },
  {
    name: "home-first-viewport-dark-375",
    route: "/",
    colorScheme: "dark",
    selector: "#main-content h1",
    requiredGlyphs: ["arrow-right", "store"],
  },
  {
    name: "globe-weather-light-375",
    route: "/globe",
    colorScheme: "light",
    selector: ".globe-weather-bar",
    requiredGlyphs: ["map-pin", "thermometer", "wind", "droplets", "cloud-rain", "sun", "dog"],
  },
  {
    name: "globe-layers-light-375",
    route: "/globe",
    colorScheme: "light",
    selector: "#globe-layers",
    requiredGlyphs: ["paw-print", "map-pin", "message-circle"],
  },
  {
    name: "globe-chat-expanded-light-375",
    route: "/globe",
    colorScheme: "light",
    selector: ".globe-chat-sheet-expanded",
    interaction: "expand-chat",
    requiredGlyphs: ["sparkles", "x", "search"],
  },
  {
    name: "globe-chat-bubble-light-375",
    route: "/globe",
    colorScheme: "light",
    selector: ".globe-chat-sheet-expanded",
    interaction: "send-chat",
    requiredGlyphs: ["sparkles", "x", "search"],
  },
  {
    name: "cookie-banner-light-375",
    route: "/",
    colorScheme: "light",
    selector: "[aria-describedby='cookie-consent-description']",
    showConsentBanner: true,
    requiredGlyphs: ["circle-check", "shield-check"],
  },
  {
    name: "empty-state-store-search-light-375",
    route: "/store",
    colorScheme: "light",
    selector: "h3:has-text('No products found')",
    interaction: "empty-store-search",
    requiredGlyphs: ["search"],
  },
  {
    name: "public-route-error-light-375",
    route: "/post/not-a-uuid",
    colorScheme: "light",
    selector: "[data-testid='public-route-error']",
    expectedStatus: 200,
    allowExpectedRouteError: true,
    requiredGlyphs: ["rotate-ccw", "circle-alert"],
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function findPort() {
  const preferred = Number(process.env.P4E1I2_PORT || 3278);
  for (let port = preferred; port < preferred + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free localhost port found from ${preferred} to ${preferred + 19}.`);
}

async function waitForServer(baseUrl, timeoutMs = 120000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${baseUrl}: ${String(lastError)}`);
}

function startDevServer(port) {
  const child = spawn(
    "npm",
    ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: serverRoot,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES: "1",
        P2W2_DYNAMIC_ROUTE_FIXTURES: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));
  return child;
}

function signalServer(child, signal) {
  if (!child?.pid || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

async function stopDevServer(child, port) {
  if (!child) return;
  signalServer(child, "SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000),
  ]);
  if (!(await isPortFree(port))) {
    signalServer(child, "SIGKILL");
    await delay(500);
  }
  if (!(await isPortFree(port))) {
    throw new Error(`Dev server still owns port ${port} after shutdown.`);
  }
  console.log(`Dev server stopped; port ${port} is free.`);
}

async function installDeterministicRoutes(context) {
  await context.route("**/nominatim.openstreetmap.org/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ address: { city: "Ghent" } }),
    });
  });
  await context.route("**/api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        current: {
          temperature_2m: 18,
          apparent_temperature: 17,
          wind_speed_10m: 12,
          relative_humidity_2m: 64,
          weather_code: 61,
        },
        daily: { precipitation_probability_max: [35], uv_index_max: [4] },
      }),
    });
  });
  await context.route("**/rest/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: "[]",
    });
  });
  await context.route("**/api/map-search", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            originalName: "PawPal Veterinary Clinic",
            localizedName: "PawPal Veterinary Clinic",
            lat: 51.05,
            lng: 3.72,
            zoom: 13,
            relevance: "high",
            source: "place",
            rating: 4.8,
          },
        ],
      }),
    });
  });
}

async function prepareCase(page, definition) {
  if (definition.interaction === "expand-chat") {
    await page.locator("#globe-search").focus();
    await page.locator(".globe-chat-sheet-expanded").waitFor({ state: "visible" });
  }

  if (definition.interaction === "send-chat") {
    const input = page.locator("#globe-search");
    await input.fill("veterinarian near me");
    await input.press("Enter");
    await page.locator(".globe-chat-sheet-expanded .whitespace-pre-wrap").waitFor({
      state: "visible",
      timeout: 15000,
    });
  }

  if (definition.interaction === "empty-store-search") {
    await page.getByPlaceholder("Search products...").fill("p4e1i2-no-match");
    await page.getByText("No products found", { exact: true }).waitFor({
      state: "visible",
      timeout: 15000,
    });
  }

}

function relevantMessages(messages, definition) {
  if (!definition.allowExpectedRouteError) return messages;
  return messages.filter(
    (message) =>
      !/not-a-uuid|invalid input syntax|public-route-error-boundary|500 \(Internal Server Error\)|An error occurred in the Server Components render|\[error-report\]/i.test(message),
  );
}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: "en-US",
    geolocation: { latitude: 51.05, longitude: 3.72 },
    permissions: ["geolocation"],
  });
  await installDeterministicRoutes(context);
  await context.addInitScript(({ showConsentBanner, showTutorial }) => {
    if (!showConsentBanner) window.localStorage.setItem("pawpal-consent-v1", "essential");
    if (!showTutorial) window.localStorage.setItem("pawpal_globe_tutorial_done", "1");
  }, {
    showConsentBanner: Boolean(definition.showConsentBanner),
    showTutorial: Boolean(definition.showTutorial),
  });

  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const httpErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));
  page.on("console", (message) => {
    const location = message.location().url ? ` @ ${message.location().url}` : "";
    if (message.type() === "error") consoleErrors.push(`${message.text()}${location}`);
    if (message.type() === "warning") consoleWarnings.push(`${message.text()}${location}`);
  });
  page.on("response", (pageResponse) => {
    if (pageResponse.status() >= 400) {
      httpErrors.push(`${pageResponse.status()} ${pageResponse.url()}`);
    }
  });

  const response = await page.goto(`${baseUrl}${definition.route}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  await prepareCase(page, definition);
  await page.waitForTimeout(500);

  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 30000 });
  await target.scrollIntoViewIfNeeded();
  const expectedStatus = definition.expectedStatus ?? 200;
  if (response?.status() !== expectedStatus) {
    throw new Error(`${definition.name} returned ${response?.status()}, expected ${expectedStatus}.`);
  }
  const title = (await page.title()) ||
    (definition.allowExpectedRouteError ? "Public route error boundary" : "");
  if (!title) throw new Error(`${definition.name} has an empty document title.`);
  const unexpectedPageErrors = relevantMessages(pageErrors, definition);
  const unexpectedConsoleErrors = relevantMessages(consoleErrors, definition);
  const unexpectedConsoleWarnings = relevantMessages(consoleWarnings, definition).filter(
    (message) => !/GL Driver Message.*GPU stall due to ReadPixels/i.test(message),
  );
  const unexpectedHttpErrors = relevantMessages(httpErrors, definition);
  if (unexpectedPageErrors.length > 0) {
    throw new Error(`${definition.name} page errors:\n${unexpectedPageErrors.join("\n")}`);
  }
  if (unexpectedConsoleErrors.length > 0) {
    throw new Error(`${definition.name} console errors:\n${unexpectedConsoleErrors.join("\n")}`);
  }
  if (unexpectedConsoleWarnings.length > 0) {
    throw new Error(`${definition.name} console warnings:\n${unexpectedConsoleWarnings.join("\n")}`);
  }
  if (unexpectedHttpErrors.length > 0) {
    throw new Error(`${definition.name} HTTP errors:\n${unexpectedHttpErrors.join("\n")}`);
  }
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  for (const glyph of definition.requiredGlyphs) {
    const icon = page.locator(`.lucide-${glyph}`).first();
    await icon.waitFor({ state: "visible", timeout: 15000 });
    const box = await icon.boundingBox();
    if (!box || box.width <= 0 || box.height <= 0) {
      throw new Error(`${definition.name} glyph ${glyph} has no visible dimensions.`);
    }
  }

  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    bodyTextLength: document.body.innerText.trim().length,
  }));
  if (metrics.viewportWidth !== viewport.width) {
    throw new Error(`${definition.name} expected ${viewport.width}px, got ${metrics.viewportWidth}px.`);
  }
  if (metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(
      `${definition.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.viewportWidth}).`,
    );
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (metrics.bodyTextLength < 20) {
    throw new Error(`${definition.name} rendered no meaningful content.`);
  }

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  const interaction = definition.interaction ? `; interaction ${definition.interaction} verified` : "";
  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${title}; 375px; ` +
      `${definition.requiredGlyphs.length} expected glyphs visible; meaningful DOM; ` +
      `no overflow/overlay/unexpected console issue${interaction}.`,
  );
  await context.close();
}

async function main() {
  await mkdir(evidenceRoot, { recursive: true });
  console.log(`Starting capture server from ${serverRoot}.`);
  const port = await findPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const devServer = startDevServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({
      headless: true,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    });
    for (const definition of cases) await captureCase(browser, baseUrl, definition);
    console.log(
      `Captured ${cases.length} verified 375px components-family icon screenshots in ${evidenceRoot}.`,
    );
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
