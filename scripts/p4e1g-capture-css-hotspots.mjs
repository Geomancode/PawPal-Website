import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1g");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const cases = [
  { name: "home-light-375", route: "/", colorScheme: "light", viewport: { width: 375, height: 812 }, selector: "#main-content", interaction: "open-globe" },
  { name: "home-dark-375", route: "/", colorScheme: "dark", viewport: { width: 375, height: 812 }, selector: "#main-content" },
  { name: "globe-light-375", route: "/globe", colorScheme: "light", viewport: { width: 375, height: 812 }, selector: ".globe-fallback-stage", forceGlobeFallback: true },
  { name: "globe-dark-375", route: "/globe", colorScheme: "dark", viewport: { width: 375, height: 812 }, selector: ".globe-fallback-stage", forceGlobeFallback: true },
  { name: "profile-light-375", route: "/profile", colorScheme: "light", viewport: { width: 375, height: 812 }, selector: ".profile-page-shell" },
  { name: "profile-dark-375", route: "/profile", colorScheme: "dark", viewport: { width: 375, height: 812 }, selector: ".profile-page-shell" },
  { name: "home-light-768", route: "/", colorScheme: "light", viewport: { width: 768, height: 1024 }, selector: "#main-content" },
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
  const preferred = Number(process.env.P4E1G_PORT || 3142);
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
  if (!(await isPortFree(port))) throw new Error(`Dev server still owns port ${port} after shutdown.`);
  console.log(`Dev server stopped; port ${port} is free.`);
}

async function forceGlobeFallback(context) {
  await context.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
}

async function exerciseOpenGlobe(page, baseUrl, name) {
  const globeLink = page.locator('a[href="/globe"]:visible').first();
  await globeLink.waitFor({ state: "visible", timeout: 15000 });
  await globeLink.click();
  await page.waitForURL(`${baseUrl}/globe`, { timeout: 30000 });
  await page.locator(".globe-fallback-stage").waitFor({ state: "visible", timeout: 30000 });
  console.log(`${name}: interaction / -> Globe CTA -> /globe fallback passed.`);
}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport: definition.viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: "en-US",
  });
  await context.addInitScript(() => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
  });
  if (definition.forceGlobeFallback || definition.interaction === "open-globe") {
    await forceGlobeFallback(context);
  }

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
  await page.waitForTimeout(900);

  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 30000 });
  if (response?.status() !== 200) throw new Error(`${definition.name} returned ${response?.status()}, expected 200.`);
  const title = await page.title();
  if (!title) throw new Error(`${definition.name} has an empty document title.`);
  if (pageErrors.length > 0) throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  if (consoleErrors.length > 0) throw new Error(`${definition.name} console errors:\n${consoleErrors.join("\n")}`);
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    bodyTextLength: document.body.innerText.trim().length,
  }));
  if (metrics.viewportWidth !== definition.viewport.width) {
    throw new Error(`${definition.name} expected ${definition.viewport.width}px, got ${metrics.viewportWidth}px.`);
  }
  if (metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${definition.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.viewportWidth}).`);
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (metrics.bodyTextLength < 50) throw new Error(`${definition.name} rendered no meaningful content.`);

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 10 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${title}; ${metrics.viewportWidth}px; no overflow/overlay/console error.`,
  );
  if (definition.interaction === "open-globe") await exerciseOpenGlobe(page, baseUrl, definition.name);
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
    browser = await chromium.launch({ headless: true });
    for (const definition of cases) await captureCase(browser, baseUrl, definition);
    console.log(`Captured ${cases.length} verified P4E1g screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
