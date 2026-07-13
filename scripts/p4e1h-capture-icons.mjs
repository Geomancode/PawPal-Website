import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1h");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };

const cases = [
  {
    name: "home-light-375",
    route: "/",
    colorScheme: "light",
    selector: "#main-content",
    requiredSelectors: ["nav", "footer", "footer svg"],
  },
  {
    name: "home-dark-375",
    route: "/",
    colorScheme: "dark",
    selector: "#main-content",
    requiredSelectors: ["nav", "footer", "footer svg"],
  },
  {
    name: "navbar-menu-open-light-375",
    route: "/",
    colorScheme: "light",
    selector: "#pawpal-mobile-navigation",
    interaction: "open-navbar",
    iconSelector: '[aria-controls="pawpal-mobile-navigation"] svg',
    fullPage: false,
  },
  {
    name: "not-found-light-375",
    route: "/p4e1h-not-found-proof",
    colorScheme: "light",
    selector: ".not-found-panel",
    expectedStatus: 404,
    requiredSelectors: [".not-found-panel svg"],
  },
  {
    name: "store-product-card-light-375",
    route: "/store",
    colorScheme: "light",
    selector: ".store-product-media",
    requiredSelectors: [".store-product-media", ".store-product-media ~ * svg"],
    iconSelector: ".store-product-media ~ * svg",
  },
  {
    name: "checkout-step-light-375",
    route: "/store/checkout",
    colorScheme: "light",
    selector: ".commerce-page-shell",
    requiredSelectors: [".commerce-page-shell svg"],
  },
  {
    name: "state-panel-loading-light-375",
    route: "/dev/state-panel",
    colorScheme: "light",
    selector: "[data-state-panel-state='loading']",
    harnessCase: "loading",
  },
  {
    name: "state-panel-empty-light-375",
    route: "/dev/state-panel",
    colorScheme: "light",
    selector: "[data-state-panel-state='empty']",
    harnessCase: "empty",
  },
  {
    name: "state-panel-error-light-375",
    route: "/dev/state-panel",
    colorScheme: "light",
    selector: "[data-state-panel-state='error']",
    harnessCase: "error",
  },
  {
    name: "status-message-critical-light-375",
    route: "/dev/state-panel",
    colorScheme: "light",
    selector: "[data-capture-target='store-subscription-error']",
    harnessCase: "store-subscription-error",
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
  const preferred = Number(process.env.P4E1H_PORT || 3143);
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

async function prepareCase(page, definition) {
  if (definition.harnessCase) {
    await page.evaluate((harnessCase) => {
      for (const element of document.querySelectorAll("[data-harness-case]")) {
        element.toggleAttribute(
          "hidden",
          element.getAttribute("data-harness-case") !== harnessCase,
        );
      }
    }, definition.harnessCase);
  }

  if (definition.interaction === "open-navbar") {
    const menuButton = page.locator('[aria-controls="pawpal-mobile-navigation"]');
    await menuButton.click();
    if ((await menuButton.getAttribute("aria-expanded")) !== "true") {
      throw new Error(`${definition.name} did not set aria-expanded=true.`);
    }
  }
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
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState("load");
  await page.waitForTimeout(900);
  await prepareCase(page, definition);
  await page.waitForTimeout(600);

  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 30000 });
  const expectedStatus = definition.expectedStatus ?? 200;
  if (response?.status() !== expectedStatus) {
    throw new Error(`${definition.name} returned ${response?.status()}, expected ${expectedStatus}.`);
  }
  const relevantConsoleErrors = consoleErrors.filter(
    (message) => !(expectedStatus === 404 && /404 \(Not Found\)/.test(message)),
  );
  const title = await page.title();
  if (!title) throw new Error(`${definition.name} has an empty document title.`);
  if (pageErrors.length > 0) throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  if (relevantConsoleErrors.length > 0) {
    throw new Error(`${definition.name} console errors:\n${relevantConsoleErrors.join("\n")}`);
  }
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  for (const selector of definition.requiredSelectors ?? []) {
    await page.locator(selector).first().waitFor({ state: "visible", timeout: 15000 });
  }
  const iconSelector = definition.iconSelector ?? `${definition.selector} svg`;
  if ((await page.locator(iconSelector).count()) === 0) {
    throw new Error(`${definition.name} target contains no rendered icon SVG.`);
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
  if (metrics.bodyTextLength < 20) throw new Error(`${definition.name} rendered no meaningful content.`);

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: definition.fullPage ?? true,
    animations: "disabled",
  });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${title}; 375px; ` +
      "meaningful DOM; icon SVG present; no overflow/overlay/console error.",
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
    browser = await chromium.launch({ headless: true });
    for (const definition of cases) await captureCase(browser, baseUrl, definition);
    console.log(`Captured ${cases.length} verified 375px icon-contract screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
