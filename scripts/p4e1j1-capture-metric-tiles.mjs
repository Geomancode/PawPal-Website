import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1j1");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };

const cases = [
  {
    name: "admin-reports-light-375",
    route: "/admin/reports",
    colorScheme: "light",
    selector: ".admin-page-shell",
    metricCount: 4,
    criticalBadge: "Users",
    upgradedCards: true,
  },
  {
    name: "admin-park-risks-light-375",
    route: "/admin/park-risks",
    colorScheme: "light",
    selector: ".admin-page-shell",
    metricCount: 5,
    criticalBadge: "Ready",
  },
  {
    name: "tag-fixture-light-375",
    route: "/tag/p2w2-tag-contact-visible",
    colorScheme: "light",
    selector: ".tag-rescue-panel",
    criticalInfoTile: true,
  },
  {
    name: "tag-fixture-dark-375",
    route: "/tag/p2w2-tag-dark",
    colorScheme: "dark",
    selector: ".tag-rescue-panel",
    criticalInfoTile: true,
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
  const preferred = Number(process.env.P4E1J1_PORT || 3331);
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
        NEXT_PUBLIC_P3B1G2H_ADMIN_FIXTURES: "1",
        P2W2_DYNAMIC_ROUTE_FIXTURES: "1",
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
  await context.route("**/rest/v1/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: "[]",
    }),
  );
}

async function assertMetricTiles(page, definition) {
  const grid = page.locator(".admin-page-shell .grid.grid-cols-2.gap-paw-sm").first();
  await grid.waitFor({ state: "visible", timeout: 30000 });
  const cards = grid.locator(":scope > div");
  const cardCount = await cards.count();
  if (cardCount !== definition.metricCount) {
    throw new Error(`${definition.name} expected ${definition.metricCount} metric cards, got ${cardCount}.`);
  }

  const labelFontSize = await cards.first().locator("p").first().evaluate(
    (element) => getComputedStyle(element).fontSize,
  );
  const valueFontSize = await cards.first().locator("p").nth(1).evaluate(
    (element) => getComputedStyle(element).fontSize,
  );
  if (labelFontSize !== "12px" || valueFontSize !== "22px") {
    throw new Error(
      `${definition.name} expected MetricTile type sizes 12px/22px, got ${labelFontSize}/${valueFontSize}.`,
    );
  }

  const criticalBadge = grid.locator("span.bg-paw-critical-soft");
  if ((await criticalBadge.count()) !== 1) {
    throw new Error(`${definition.name} expected exactly one critical MetricTile badge.`);
  }
  if ((await criticalBadge.textContent())?.trim() !== definition.criticalBadge) {
    throw new Error(`${definition.name} critical badge copy did not match ${definition.criticalBadge}.`);
  }

  if (definition.upgradedCards) {
    const upgradedCardCount = await grid.locator(":scope > .admin-card-upgraded").count();
    if (upgradedCardCount !== definition.metricCount) {
      throw new Error(
        `${definition.name} expected ${definition.metricCount} upgraded metric cards, got ${upgradedCardCount}.`,
      );
    }
  }
}

async function assertCriticalInfoTile(page, definition) {
  const tile = page.locator(".tag-info-tile-critical");
  await tile.waitFor({ state: "visible", timeout: 30000 });
  if ((await tile.count()) !== 1) {
    throw new Error(`${definition.name} expected exactly one critical tag info tile.`);
  }
  const text = (await tile.innerText()).trim();
  if (!text.includes("Blood") || !text.includes("DEA 1.1+")) {
    throw new Error(`${definition.name} critical tag info tile has unexpected copy: ${text}`);
  }
}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: "en-US",
  });
  await installDeterministicRoutes(context);
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
  await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 15000 });
  await page.waitForTimeout(1000);

  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 30000 });

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

  if (definition.metricCount) await assertMetricTiles(page, definition);
  if (definition.criticalInfoTile) await assertCriticalInfoTile(page, definition);

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
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  const assertion = definition.metricCount
    ? `${definition.metricCount} MetricTiles at 12px/22px with one critical badge`
    : "one visible critical InfoTile";
  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${await page.title()}; ` +
      `375px ${definition.colorScheme}; ${assertion}; no overflow/overlay/console errors.`,
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
    console.log(`Captured ${cases.length} verified 375px MetricTile/InfoTile screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
