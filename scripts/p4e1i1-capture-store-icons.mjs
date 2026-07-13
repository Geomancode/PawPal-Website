import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1i1");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };

const cases = [
  {
    name: "store-light-375",
    route: "/store",
    colorScheme: "light",
    selector: "#main-content h1",
    requiredGlyphs: ["search", "sliders-horizontal", "shopping-cart", "shield-check"],
  },
  {
    name: "store-dark-375",
    route: "/store",
    colorScheme: "dark",
    selector: "#main-content h1",
    requiredGlyphs: ["search", "sliders-horizontal", "shopping-cart", "shield-check"],
  },
  {
    name: "orders-expanded-light-375",
    route: "/store/orders",
    colorScheme: "light",
    selector: ".order-card-upgraded",
    interaction: "expand-order",
    requiredGlyphs: ["package", "truck", "shopping-bag", "map-pin", "credit-card"],
  },
  {
    name: "checkout-shipping-light-375",
    route: "/store/checkout",
    colorScheme: "light",
    selector: ".commerce-page-shell",
    requiredGlyphs: ["map-pin", "package", "credit-card", "truck", "shield-check"],
  },
  {
    name: "checkout-review-light-375",
    route: "/store/checkout",
    colorScheme: "light",
    selector: ".commerce-page-shell",
    interaction: "advance-checkout",
    requiredGlyphs: ["package", "map-pin", "lock", "external-link", "shield-check"],
  },
  {
    name: "success-confirmed-light-375",
    route: "/store/success",
    colorScheme: "light",
    selector: ".success-card-upgraded",
    requiredGlyphs: ["circle-check", "receipt", "package", "arrow-right"],
  },
  {
    name: "store-admin-light-375",
    route: "/store/admin",
    colorScheme: "light",
    selector: ".admin-page-shell",
    requiredGlyphs: ["package-plus", "image-plus", "cloud-upload", "refresh-cw"],
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
  const preferred = Number(process.env.P4E1I1_PORT || 3158);
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

async function prepareCase(page, definition) {
  if (definition.interaction === "expand-order") {
    const orderToggle = page.locator(".order-card-upgraded button[aria-expanded]").first();
    await orderToggle.click();
    if ((await orderToggle.getAttribute("aria-expanded")) !== "true") {
      throw new Error(`${definition.name} did not expand the fixture order.`);
    }
  }

  if (definition.interaction === "advance-checkout") {
    const reviewButton = page.locator("button:has(.lucide-arrow-right)").first();
    await reviewButton.click();
    await page.locator(".lucide-external-link").first().waitFor({
      state: "visible",
      timeout: 15000,
    });
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
  const consoleWarnings = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning") consoleWarnings.push(message.text());
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
  const title = await page.title();
  if (response?.status() !== 200) {
    throw new Error(`${definition.name} returned ${response?.status()}, expected 200.`);
  }
  if (!title) throw new Error(`${definition.name} has an empty document title.`);
  if (pageErrors.length > 0) {
    throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  }
  if (consoleErrors.length > 0) {
    throw new Error(`${definition.name} console errors:\n${consoleErrors.join("\n")}`);
  }
  if (consoleWarnings.length > 0) {
    throw new Error(`${definition.name} console warnings:\n${consoleWarnings.join("\n")}`);
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
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  const interaction = definition.interaction ? `; interaction ${definition.interaction} verified` : "";
  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${title}; 375px; ` +
      `${definition.requiredGlyphs.length} expected glyphs visible; meaningful DOM; ` +
      `no overflow/overlay/console error or warning${interaction}.`,
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
    console.log(`Captured ${cases.length} verified 375px Store-family screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
