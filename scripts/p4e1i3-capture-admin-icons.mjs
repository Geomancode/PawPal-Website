import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1i3");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };

const cases = [
  {
    name: "admin-reports-light-375",
    route: "/admin/reports",
    colorScheme: "light",
    selector: ".admin-page-shell",
    requiredGlyphs: ["shield-check", "refresh-cw", "circle-check", "trash-2", "ban", "file-text", "message-square", "circle-user-round"],
    fullPage: true,
  },
  {
    name: "admin-park-risks-light-375",
    route: "/admin/park-risks",
    colorScheme: "light",
    selector: ".admin-page-shell",
    requiredGlyphs: ["shield-check", "refresh-cw", "clipboard-list", "circle-plus", "map-pin"],
    fullPage: true,
  },
  {
    name: "profile-workspace-light-375",
    route: "/profile",
    colorScheme: "light",
    selector: ".profile-page-shell",
    requiredGlyphs: ["shield", "pen-line", "download", "paw-print"],
    fullPage: true,
  },
  {
    name: "push-subscription-light-375",
    route: "/profile",
    colorScheme: "light",
    selector: "[data-testid='push-settings']",
    requiredGlyphs: ["bell"],
    requiredAnyGlyphs: ["bell-ring", "shield-alert", "wifi-off", "circle-check-big", "bell-off"],
    prepare: "push-reachable",
    fullPage: false,
  },
  {
    name: "globe-light-375",
    route: "/globe",
    colorScheme: "light",
    selector: ".globe-page-shell",
    requiredGlyphs: ["map-pin", "thermometer", "wind", "droplets", "dog"],
    fullPage: false,
  },
  {
    name: "dev-state-panel-light-375",
    route: "/dev/state-panel",
    colorScheme: "light",
    selector: "[data-harness-case='error']",
    requiredGlyphs: ["rotate-ccw"],
    prepare: "error-harness",
    fullPage: false,
  },
  {
    name: "profile-workspace-dark-375",
    route: "/profile",
    colorScheme: "dark",
    selector: ".profile-page-shell",
    requiredGlyphs: ["shield", "pen-line", "download", "paw-print"],
    fullPage: true,
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
  const preferred = Number(process.env.P4E1I3_PORT || 3293);
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
    ["run", "dev", "--", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES: "1",
        NEXT_PUBLIC_P3B1G2H_ADMIN_FIXTURES: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => process.stdout.write(`[dev] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[dev] ${chunk}`));
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
  await context.route("**/nominatim.openstreetmap.org/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ address: { city: "Ghent" } }),
    }),
  );
  await context.route("**/api.open-meteo.com/**", (route) =>
    route.fulfill({
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
    }),
  );
  await context.route("**/rest/v1/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: "[]",
    }),
  );
}

async function prepareCase(page, definition) {
  if (definition.prepare === "push-reachable") {
    await page.waitForFunction(() => {
      const target = document.querySelector("[data-testid='push-settings']");
      return target && target.getAttribute("data-push-state") !== "checking";
    }, null, { timeout: 15000 });
    const state = await page.locator(definition.selector).getAttribute("data-push-state");
    if (!["available", "denied", "unsupported", "enabled", "error"].includes(state ?? "")) {
      throw new Error(`${definition.name} expected a reachable terminal state, got ${state}.`);
    }
  }
  if (definition.prepare === "error-harness") {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll("[data-harness-case]")) {
        element.toggleAttribute("hidden", element.getAttribute("data-harness-case") !== "error");
      }
    });
  }
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
  await context.addInitScript(() => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
    window.localStorage.setItem("pawpal_globe_tutorial_done", "1");
  });

  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto(`${baseUrl}${definition.route}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  await prepareCase(page, definition);

  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 30000 });
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  if (response?.status() !== 200) {
    throw new Error(`${definition.name} returned ${response?.status()}, expected 200.`);
  }
  if (!(await page.title())) throw new Error(`${definition.name} has an empty document title.`);
  if (pageErrors.length > 0) throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  if (consoleErrors.length > 0) {
    throw new Error(`${definition.name} console errors:\n${consoleErrors.join("\n")}`);
  }
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  for (const glyph of definition.requiredGlyphs) {
    const icon = page.locator(`.lucide-${glyph}:visible`).first();
    await icon.waitFor({ state: "visible", timeout: 15000 });
    const box = await icon.boundingBox();
    if (!box || box.width <= 0 || box.height <= 0) {
      throw new Error(`${definition.name} glyph ${glyph} has no visible dimensions.`);
    }
  }
  if (definition.requiredAnyGlyphs) {
    const visibleStateGlyphs = [];
    for (const glyph of definition.requiredAnyGlyphs) {
      if (await page.locator(`.lucide-${glyph}:visible`).count()) visibleStateGlyphs.push(glyph);
    }
    if (visibleStateGlyphs.length === 0) {
      throw new Error(
        `${definition.name} has none of the expected state glyphs: ${definition.requiredAnyGlyphs.join(", ")}.`,
      );
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
    throw new Error(`${definition.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.viewportWidth}).`);
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (metrics.bodyTextLength < 20) {
    throw new Error(`${definition.name} rendered no meaningful content.`);
  }

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: definition.fullPage,
    animations: "disabled",
  });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${await page.title()}; 375px; ` +
      `${definition.requiredGlyphs.length} expected glyphs visible; meaningful DOM; ` +
      "no overflow/overlay/console errors.",
  );
  await context.close();
}

async function main() {
  await mkdir(evidenceRoot, { recursive: true });
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
    console.log(`Captured ${cases.length} verified 375px route-family icon screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
