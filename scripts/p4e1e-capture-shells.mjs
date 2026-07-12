import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1e");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };

const cases = [
  { name: "home-hero-light-375", route: "/", colorScheme: "light", selector: "#main-content > div > section:first-of-type > div.mx-auto" },
  { name: "home-hero-dark-375", route: "/", colorScheme: "dark", selector: "#main-content > div > section:first-of-type > div.mx-auto" },
  { name: "auth-light-375", route: "/auth", colorScheme: "light", selector: ".auth-page-shell" },
  { name: "group-fixture-light-375", route: "/group/p2w2-group-populated", colorScheme: "light", selector: ".deep-page-shell" },
  { name: "post-fixture-light-375", route: "/post/p2w2-post-populated", colorScheme: "light", selector: "#main-content > section" },
  { name: "profile-fixture-light-375", route: "/profile", colorScheme: "light", selector: ".profile-page-shell > .max-w-6xl" },
  { name: "not-found-light-375", route: "/p4e1e-not-found", colorScheme: "light", selector: ".deep-page-shell", expectedStatus: 404 },
  { name: "not-found-dark-375", route: "/p4e1e-not-found-dark", colorScheme: "dark", selector: ".deep-page-shell", expectedStatus: 404 },
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
  const preferred = Number(process.env.P4E1E_PORT || 3133);
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
        P2W2_DYNAMIC_ROUTE_FIXTURES: "1",
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

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: "en-US",
  });
  await context.addInitScript(() => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
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
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(750);

  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 15000 });

  const expectedStatus = definition.expectedStatus ?? 200;
  if (response?.status() !== expectedStatus) {
    throw new Error(`${definition.name} returned ${response?.status()}, expected ${expectedStatus}.`);
  }
  const relevantConsoleErrors = consoleErrors.filter(
    (message) => !(expectedStatus === 404 && /status of 404 \(Not Found\)/.test(message)),
  );
  if (!(await page.title())) throw new Error(`${definition.name} has an empty document title.`);
  if (pageErrors.length > 0) throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  if (relevantConsoleErrors.length > 0) {
    throw new Error(`${definition.name} console errors:\n${relevantConsoleErrors.join("\n")}`);
  }
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  const metrics = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const style = getComputedStyle(element);
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      bodyTextLength: document.body.innerText.trim().length,
    };
  }, definition.selector);
  if (!metrics) throw new Error(`${definition.name} gutter target is missing.`);
  if (metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${definition.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.viewportWidth}).`);
  }
  if (metrics.paddingLeft !== "16px" || metrics.paddingRight !== "16px") {
    throw new Error(`${definition.name} expected 16px mobile gutters, got ${metrics.paddingLeft}/${metrics.paddingRight}.`);
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (metrics.bodyTextLength < 20) throw new Error(`${definition.name} rendered no meaningful content.`);

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 10 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(`${definition.name}: ${screenshotStat.size} bytes; gutters ${metrics.paddingLeft}/${metrics.paddingRight}; no overflow`);
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
    console.log(`Captured ${cases.length} verified 375px screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
