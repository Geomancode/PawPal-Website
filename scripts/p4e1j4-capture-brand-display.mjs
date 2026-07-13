import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1j4");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const cases = [
  {
    name: "home-hero-light-375",
    route: "/",
    colorScheme: "light",
    viewport: { width: 375, height: 812 },
    selector: ".homepage-hero-headline",
    heroFontSize: 44,
    heroLineHeight: 1.03,
  },
  {
    name: "home-hero-dark-375",
    route: "/",
    colorScheme: "dark",
    viewport: { width: 375, height: 812 },
    selector: ".homepage-hero-headline",
    heroFontSize: 44,
    heroLineHeight: 1.03,
  },
  {
    name: "home-hero-light-640",
    route: "/",
    colorScheme: "light",
    viewport: { width: 640, height: 900 },
    selector: ".homepage-hero-headline",
    heroFontSize: 60,
    heroLineHeight: 1.02,
  },
  {
    name: "home-hero-light-1024",
    route: "/",
    colorScheme: "light",
    viewport: { width: 1024, height: 900 },
    selector: ".homepage-hero-headline",
    heroFontSize: 71.2,
    heroLineHeight: 1.02,
  },
  {
    name: "home-hero-light-1280",
    route: "/",
    colorScheme: "light",
    viewport: { width: 1280, height: 900 },
    selector: ".homepage-hero-headline",
    heroFontSize: 74.4,
    heroLineHeight: 1.02,
  },
  {
    name: "auth-signup-light-375",
    route: "/auth",
    colorScheme: "light",
    viewport: { width: 375, height: 812 },
    selector: ".auth-card",
    interaction: "auth-signup",
    fullPage: true,
  },
  {
    name: "auth-display-light-1280",
    route: "/auth",
    colorScheme: "light",
    viewport: { width: 1280, height: 900 },
    selector: ".auth-visual-panel h1",
    expectedType: { selector: ".auth-visual-panel h1", fontSize: 34 },
  },
  {
    name: "not-found-display-light-375",
    route: "/p4e1j4-not-found-proof",
    colorScheme: "light",
    viewport: { width: 375, height: 812 },
    selector: "main h1",
    expectedStatus: 404,
    expectedType: { selector: "main h1", fontSize: 34 },
    fullPage: true,
  },
  {
    name: "globe-fallback-display-light-375",
    route: "/globe",
    colorScheme: "light",
    viewport: { width: 375, height: 812 },
    selector: ".globe-fallback-stage",
    forceGlobeFallback: true,
    expectedType: { selector: ".globe-fallback-title", fontSize: 34 },
  },
  {
    name: "store-product-lg-light-375",
    route: "/store",
    colorScheme: "light",
    viewport: { width: 375, height: 812 },
    selector: '.product-visual[data-size="lg"] .product-visual-glyph',
    interaction: "store-product-lg",
    expectedGlyph: { size: "lg", fontSize: 72 },
  },
  {
    name: "store-cart-md-light-375",
    route: "/store",
    colorScheme: "light",
    viewport: { width: 375, height: 812 },
    selector: '.product-visual[data-size="md"] .product-visual-glyph',
    interaction: "store-cart-md",
    expectedGlyph: { size: "md", fontSize: 30 },
  },
  {
    name: "store-product-lg-dark-375",
    route: "/store",
    colorScheme: "dark",
    viewport: { width: 375, height: 812 },
    selector: '.product-visual[data-size="lg"] .product-visual-glyph',
    interaction: "store-product-lg",
    expectedGlyph: { size: "lg", fontSize: 72 },
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nearlyEqual(actual, expected, tolerance = 0.08) {
  return Math.abs(actual - expected) <= tolerance;
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
  const preferred = Number(process.env.P4E1J4_PORT || 3344);
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
          weather_code: 1,
        },
        daily: { precipitation_probability_max: [10], uv_index_max: [4] },
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
  await context.route("**/api/map-search", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    }),
  );
  await context.route("**/api/home-globe-posts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    }),
  );
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

async function prepareCase(page, definition) {
  if (definition.heroFontSize) {
    await page.waitForFunction(() => {
      const globe = document.querySelector('[data-testid="home-globe"]');
      return globe?.getAttribute("data-webgl") === "available";
    }, undefined, { timeout: 30000 });
    await page.waitForFunction(() => {
      const globe = document.querySelector('[data-testid="home-globe"]');
      return globe?.getAttribute("data-posts-state") === "empty";
    }, undefined, { timeout: 30000 });
    await page.locator('[data-testid="home-globe"] canvas').waitFor({
      state: "visible",
      timeout: 30000,
    });
    await page.waitForTimeout(500);
  }

  if (definition.interaction === "auth-signup") {
    const signupTab = page.locator(".auth-mode-tab").nth(1);
    await signupTab.click();
    if ((await signupTab.getAttribute("aria-pressed")) !== "true") {
      throw new Error(`${definition.name} did not activate the sign-up tab.`);
    }
    await page.locator("#auth-confirm-password").waitFor({ state: "visible", timeout: 15000 });
  }

  if (definition.interaction === "store-product-lg") {
    const product = page.locator('.product-visual[data-size="lg"] .product-visual-glyph').first();
    await product.waitFor({ state: "visible", timeout: 30000 });
    await product.scrollIntoViewIfNeeded();
  }

  if (definition.interaction === "store-cart-md") {
    const addButton = page.getByRole("button", { name: "Add", exact: true }).first();
    await addButton.waitFor({ state: "visible", timeout: 30000 });
    await addButton.click();
    const cartButton = page.getByRole("button", { name: /Cart \(1\)/ }).first();
    await cartButton.waitFor({ state: "visible", timeout: 15000 });
    await cartButton.click();
    await page.locator('.product-visual[data-size="md"] .product-visual-glyph').first()
      .waitFor({ state: "visible", timeout: 15000 });
  }
}

async function assertHeroRegression(page, definition) {
  const metrics = await page.locator(".homepage-hero-headline").evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const lineOne = element.querySelector("span:first-of-type")?.getBoundingClientRect();
    const lineTwo = element.querySelector("span:last-of-type")?.getBoundingClientRect();
    return {
      className: element.className,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      overflowX: style.overflowX,
      lineOneTop: lineOne?.top ?? null,
      lineOneRight: lineOne?.right ?? null,
      lineTwoTop: lineTwo?.top ?? null,
      lineTwoRight: lineTwo?.right ?? null,
    };
  });
  const expectedLineHeight = definition.heroFontSize * definition.heroLineHeight;
  if (!metrics.className.includes("text-paw-web-marketing-hero")) {
    throw new Error(`${definition.name} hero does not use text-paw-web-marketing-hero.`);
  }
  if (!nearlyEqual(metrics.fontSize, definition.heroFontSize)) {
    throw new Error(`${definition.name} hero font-size ${metrics.fontSize}px != ${definition.heroFontSize}px.`);
  }
  if (!nearlyEqual(metrics.lineHeight, expectedLineHeight, 0.12)) {
    throw new Error(`${definition.name} hero line-height ${metrics.lineHeight}px != ${expectedLineHeight}px.`);
  }
  if (metrics.left < -1 || metrics.right > definition.viewport.width + 1) {
    throw new Error(`${definition.name} hero escapes the viewport (${metrics.left}..${metrics.right}).`);
  }
  if (
    metrics.scrollWidth > metrics.clientWidth + 1 &&
    ["hidden", "clip"].includes(metrics.overflowX)
  ) {
    throw new Error(`${definition.name} hero text clips horizontally.`);
  }
  if (metrics.lineOneTop === null || metrics.lineTwoTop === null || metrics.lineTwoTop <= metrics.lineOneTop) {
    throw new Error(`${definition.name} hero must preserve the two-line composition.`);
  }
  if (
    metrics.lineOneRight === null ||
    metrics.lineTwoRight === null ||
    metrics.lineOneRight > definition.viewport.width + 1 ||
    metrics.lineTwoRight > definition.viewport.width + 1
  ) {
    throw new Error(`${definition.name} hero line content escapes the viewport.`);
  }
  return {
    ...metrics,
    expectedFontSize: definition.heroFontSize,
    expectedLineHeight,
  };
}

async function assertExpectedType(page, definition) {
  if (!definition.expectedType) return null;
  const result = await page.locator(definition.expectedType.selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      left: rect.left,
      right: rect.right,
      className: element.className,
    };
  });
  if (!nearlyEqual(result.fontSize, definition.expectedType.fontSize)) {
    throw new Error(
      `${definition.name} ${definition.expectedType.selector} font-size ` +
      `${result.fontSize}px != ${definition.expectedType.fontSize}px.`,
    );
  }
  return result;
}

async function assertFallbackBody(page, definition) {
  if (!definition.forceGlobeFallback) return null;
  const result = await page.locator(".globe-fallback-body").evaluate((element) => ({
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
    className: element.className,
  }));
  if (!nearlyEqual(result.fontSize, 15)) {
    throw new Error(`${definition.name} fallback body font-size ${result.fontSize}px != 15px.`);
  }
  return result;
}

async function assertExpectedGlyph(page, definition) {
  if (!definition.expectedGlyph) return null;
  const selector = `.product-visual[data-size="${definition.expectedGlyph.size}"] .product-visual-glyph`;
  const result = await page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const frame = element.closest(".product-visual")?.getBoundingClientRect();
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      frameWidth: frame?.width ?? 0,
      frameHeight: frame?.height ?? 0,
    };
  });
  if (!nearlyEqual(result.fontSize, definition.expectedGlyph.fontSize)) {
    throw new Error(`${definition.name} glyph font-size ${result.fontSize}px != ${definition.expectedGlyph.fontSize}px.`);
  }
  if (!nearlyEqual(result.lineHeight, definition.expectedGlyph.fontSize, 0.12)) {
    throw new Error(`${definition.name} glyph line-height ${result.lineHeight}px must equal its font-size.`);
  }
  if (result.frameWidth <= 0 || result.frameHeight <= 0) {
    throw new Error(`${definition.name} glyph frame has no visible dimensions.`);
  }
  return result;
}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport: definition.viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: definition.heroFontSize ? "no-preference" : "reduce",
    locale: "en-US",
    geolocation: { latitude: 51.05, longitude: 3.72 },
    permissions: ["geolocation"],
  });
  await installDeterministicRoutes(context);
  await context.addInitScript(() => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
    window.localStorage.setItem("pawpal_globe_tutorial_done", "1");
    window.localStorage.removeItem("pawpal_cart");
  });
  if (definition.forceGlobeFallback) await forceGlobeFallback(context);

  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const browserDiagnostics = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));
  page.on("console", (message) => {
    if (message.type() === "error") {
      const error = message.text();
      if (
        definition.expectedStatus === 404 &&
        /^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/.test(error)
      ) {
        browserDiagnostics.push(error);
      } else {
        consoleErrors.push(error);
      }
    }
    if (message.type() === "warning") {
      const warning = message.text();
      if (
        /GL Driver Message .*GPU stall due to ReadPixels/.test(warning) ||
        /^The resource .* was preloaded using link preload but not used within a few seconds/.test(warning)
      ) {
        browserDiagnostics.push(warning);
      } else {
        consoleWarnings.push(warning);
      }
    }
  });

  try {
    const response = await page.goto(`${baseUrl}${definition.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(750);
    await prepareCase(page, definition);
    await page.waitForTimeout(300);

    const target = page.locator(definition.selector).first();
    await target.waitFor({ state: "visible", timeout: 30000 });
    const expectedStatus = definition.expectedStatus ?? 200;
    if (response?.status() !== expectedStatus) {
      throw new Error(`${definition.name} returned ${response?.status()}, expected ${expectedStatus}.`);
    }
    const title = await page.title();
    if (!title) throw new Error(`${definition.name} has an empty document title.`);
    if (pageErrors.length > 0) throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
    if (consoleErrors.length > 0) throw new Error(`${definition.name} console errors:\n${consoleErrors.join("\n")}`);
    if (consoleWarnings.length > 0) throw new Error(`${definition.name} console warnings:\n${consoleWarnings.join("\n")}`);
    if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
      throw new Error(`${definition.name} rendered a Next.js error overlay.`);
    }

    const pageMetrics = await page.evaluate(() => ({
      url: window.location.href,
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      bodyTextLength: document.body.innerText.trim().length,
    }));
    if (pageMetrics.viewportWidth !== definition.viewport.width) {
      throw new Error(`${definition.name} expected ${definition.viewport.width}px, got ${pageMetrics.viewportWidth}px.`);
    }
    if (pageMetrics.scrollWidth > pageMetrics.viewportWidth + 1) {
      throw new Error(
        `${definition.name} has horizontal overflow (${pageMetrics.scrollWidth} > ${pageMetrics.viewportWidth}).`,
      );
    }
    if (pageMetrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
      throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
    }
    if (pageMetrics.bodyTextLength < 50) throw new Error(`${definition.name} rendered no meaningful content.`);

    const hero = definition.heroFontSize ? await assertHeroRegression(page, definition) : null;
    const type = await assertExpectedType(page, definition);
    const fallbackBody = await assertFallbackBody(page, definition);
    const glyph = await assertExpectedGlyph(page, definition);

    const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: definition.fullPage ?? false,
      animations: "disabled",
    });
    const screenshotStat = await stat(screenshotPath);
    if (screenshotStat.size <= 10 * 1024) {
      throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
    }

    const evidence = {
      name: definition.name,
      route: definition.route,
      title,
      status: response?.status(),
      viewport: definition.viewport,
      colorScheme: definition.colorScheme,
      screenshotBytes: screenshotStat.size,
      interaction: definition.interaction ?? null,
      page: pageMetrics,
      hero,
      type,
      fallbackBody,
      glyph,
      browserDiagnostics,
    };
    console.log(
      `${definition.name}: ${screenshotStat.size} bytes; ${title}; ` +
      `${definition.viewport.width}x${definition.viewport.height} ${definition.colorScheme}; ` +
      "meaningful DOM; no overflow/overlay/app console error or warning; numeric display contract passed" +
      `${browserDiagnostics.length > 0 ? `; ${browserDiagnostics.length} browser/network diagnostics recorded` : ""}.`,
    );
    return evidence;
  } finally {
    await context.close();
  }
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
    const requestedCase = process.env.P4E1J4_CASE;
    const captureCases = requestedCase
      ? cases.filter((definition) => definition.name === requestedCase)
      : cases;
    if (captureCases.length === 0) {
      throw new Error(`Unknown P4E1J4_CASE: ${requestedCase}`);
    }
    const results = [];
    for (const definition of captureCases) {
      results.push(await captureCase(browser, baseUrl, definition));
    }
    await writeFile(
      path.join(evidenceRoot, "visual-metrics.json"),
      `${JSON.stringify({ baseUrl, cases: results }, null, 2)}\n`,
      "utf8",
    );
    console.log(`Captured ${results.length} verified P4E1j4 screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
