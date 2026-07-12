import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1c");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const cases = [
  ...["loading", "empty", "error"].flatMap((state) =>
    ["light", "dark"].map((colorScheme) => ({
      name: `${state}-mobile-${colorScheme}`,
      harnessCase: state,
      state,
      colorScheme,
      viewport: { width: 375, height: 812 },
    })),
  ),
  {
    name: "loading-desktop-light",
    harnessCase: "loading",
    state: "loading",
    colorScheme: "light",
    viewport: { width: 1440, height: 960 },
  },
  {
    name: "error-desktop-dark",
    harnessCase: "error",
    state: "error",
    colorScheme: "dark",
    viewport: { width: 1440, height: 960 },
  },
  {
    name: "profile-unavailable-critical",
    harnessCase: "profile-unavailable",
    state: "error",
    colorScheme: "light",
    viewport: { width: 1280, height: 900 },
    selector: "[data-capture-target='profile-unavailable']",
    expectedTone: "critical",
  },
  {
    name: "store-subscription-error-component",
    harnessCase: "store-subscription-error",
    colorScheme: "dark",
    viewport: { width: 1280, height: 900 },
    selector: "[data-capture-target='store-subscription-error']",
    expectedStatusMessage: true,
    deviceScaleFactor: 2,
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
  const preferred = Number(process.env.P4E1C_PORT || 3131);
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
      const response = await fetch(`${baseUrl}/dev/state-panel`);
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
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      detached: process.platform !== "win32",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
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

async function captureCase(browser, baseUrl, captureCaseDefinition) {
  const context = await browser.newContext({
    viewport: captureCaseDefinition.viewport,
    colorScheme: captureCaseDefinition.colorScheme,
    reducedMotion: "reduce",
    deviceScaleFactor: captureCaseDefinition.deviceScaleFactor ?? 1,
    locale: "en-US",
  });
  await context.addInitScript(() => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));

  const response = await page.goto(`${baseUrl}/dev/state-panel`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.evaluate((harnessCase) => {
    for (const element of document.querySelectorAll("[data-harness-case]")) {
      element.toggleAttribute("hidden", element.getAttribute("data-harness-case") !== harnessCase);
    }
  }, captureCaseDefinition.harnessCase);
  const harnessTarget = page.locator(`[data-harness-case='${captureCaseDefinition.harnessCase}']`);
  const captureTarget = captureCaseDefinition.selector
    ? page.locator(captureCaseDefinition.selector)
    : harnessTarget.locator("[data-state-panel-state]");
  await captureTarget.waitFor({
    state: "visible",
    timeout: 15000,
  });
  await page.waitForTimeout(400);

  if (!response?.ok()) throw new Error(`${captureCaseDefinition.name} returned ${response?.status()}.`);
  if (pageErrors.length > 0) throw new Error(`${captureCaseDefinition.name} page errors: ${pageErrors.join("\n")}`);

  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  if (metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${captureCaseDefinition.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.viewportWidth}).`);
  }
  if (metrics.dark !== (captureCaseDefinition.colorScheme === "dark")) {
    throw new Error(`${captureCaseDefinition.name} did not apply ${captureCaseDefinition.colorScheme} color scheme.`);
  }

  if (captureCaseDefinition.state) {
    const panel = harnessTarget.locator(`[data-state-panel-state='${captureCaseDefinition.state}']`);
    const role = await panel.getAttribute("role");
    const expectedRole = captureCaseDefinition.state === "error"
      ? "alert"
      : captureCaseDefinition.state === "loading"
        ? "status"
        : null;
    if (role !== expectedRole) {
      throw new Error(`${captureCaseDefinition.name} expected role ${expectedRole}, got ${role}.`);
    }
    if (captureCaseDefinition.state === "loading" && (await panel.getAttribute("aria-busy")) !== "true") {
      throw new Error(`${captureCaseDefinition.name} loading panel is missing aria-busy=true.`);
    }
  }

  if (captureCaseDefinition.expectedTone) {
    const tone = await harnessTarget.locator("[data-state-panel-state]").getAttribute("data-state-panel-tone");
    if (tone !== captureCaseDefinition.expectedTone) {
      throw new Error(`${captureCaseDefinition.name} expected ${captureCaseDefinition.expectedTone} tone, got ${tone}.`);
    }
  }
  if (captureCaseDefinition.expectedStatusMessage) {
    const role = await page.locator(captureCaseDefinition.selector).locator("[role='alert']").getAttribute("role");
    if (role !== "alert") throw new Error(`${captureCaseDefinition.name} must render an alert StatusMessage.`);
  }

  const screenshotPath = path.join(evidenceRoot, `${captureCaseDefinition.name}.png`);
  await page.locator(captureCaseDefinition.selector ?? "body").screenshot({
    path: screenshotPath,
    animations: "disabled",
  });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 10 * 1024) {
    throw new Error(`${captureCaseDefinition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(`${captureCaseDefinition.name}: ${screenshotStat.size} bytes`);
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
    for (const captureCaseDefinition of cases) {
      await captureCase(browser, baseUrl, captureCaseDefinition);
    }
    console.log(`Captured ${cases.length} verified screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
