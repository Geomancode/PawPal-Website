import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1j3");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };
const semanticTypeSizes = {
  "text-paw-type-caption": "12px",
  "text-paw-type-body": "15px",
  "text-paw-type-h3": "18px",
  "text-paw-type-h2": "22px",
  "text-paw-type-h1": "28px",
  "text-paw-type-display": "34px",
};

const cases = [
  {
    name: "orders-expanded-light-en-375",
    route: "/store/orders",
    colorScheme: "light",
    selector: ".orders-hero-panel",
    expectedText: "My Orders",
    interaction: "expand-order",
    fullPage: false,
  },
  {
    name: "tag-fixture-light-en-375",
    route: "/tag/p2w2-tag-contact-visible",
    colorScheme: "light",
    selector: ".tag-rescue-panel",
    expectedText: "Help",
    fullPage: false,
  },
  {
    name: "about-light-en-375",
    route: "/about",
    colorScheme: "light",
    selector: ".about-hero-copy",
    expectedText: "A connected safety layer",
    fullPage: false,
  },
  {
    name: "store-admin-light-en-375",
    route: "/store/admin",
    colorScheme: "light",
    selector: ".admin-page-shell",
    expectedText: "Product catalog",
    fullPage: false,
  },
  {
    name: "globe-chat-bubbles-light-en-375",
    route: "/globe",
    colorScheme: "light",
    selector: ".globe-chat-sheet-expanded .whitespace-pre-wrap",
    expectedText: "PawPal Globe",
    interaction: "send-chat",
    fullPage: false,
  },
  {
    name: "success-light-en-375",
    route: "/store/success",
    colorScheme: "light",
    selector: ".success-card-upgraded",
    expectedText: "Payment successful",
    fullPage: false,
  },
  {
    name: "tag-fixture-dark-en-375",
    route: "/tag/p2w2-tag-dark",
    colorScheme: "dark",
    selector: ".tag-rescue-panel",
    expectedText: "Help",
    fullPage: false,
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
  const preferred = Number(process.env.P4E1J3_PORT || 3333);
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
    }),
  );
}

async function prepareCase(page, definition) {
  if (definition.interaction === "expand-order") {
    const orderToggle = page.locator(".order-card-upgraded button[aria-expanded]").first();
    await orderToggle.waitFor({ state: "visible", timeout: 30000 });
    await orderToggle.click();
    await page.locator(".order-card-upgraded button[aria-expanded='true']").waitFor({
      state: "visible",
      timeout: 15000,
    });
  }

  if (definition.interaction === "send-chat") {
    const input = page.locator("#globe-search");
    await input.fill("veterinarian near me");
    await input.press("Enter");
    await page.locator(".globe-chat-sheet-expanded .whitespace-pre-wrap").waitFor({
      state: "visible",
      timeout: 15000,
    });
    await input.fill("Ask PawPal");
  }
}

async function assertSemanticTypeAndLayout(page, definition) {
  const result = await page.evaluate((expectedSizes) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const counts = {};
    const fontMismatches = [];
    const responsiveOverrides = [];
    const clippedText = [];
    let exactTypeMatches = 0;
    const allowedSizes = new Set(Object.values(expectedSizes));

    for (const [token, expectedSize] of Object.entries(expectedSizes)) {
      const elements = [...document.getElementsByClassName(token)].filter(visible);
      counts[token] = elements.length;
      for (const element of elements) {
        const style = getComputedStyle(element);
        const text = element.textContent?.trim().replace(/\s+/g, " ") ?? "";
        if (style.fontSize === expectedSize) {
          exactTypeMatches += 1;
        } else if (allowedSizes.has(style.fontSize)) {
          responsiveOverrides.push(`${token}: ${style.fontSize} (${text.slice(0, 80)})`);
        } else {
          fontMismatches.push(`${token}: ${style.fontSize} (${text.slice(0, 80)})`);
        }

        const clipsHorizontally =
          element.scrollWidth > element.clientWidth + 1 && ["hidden", "clip"].includes(style.overflowX);
        const clipsVertically =
          element.scrollHeight > element.clientHeight + 1 && ["hidden", "clip"].includes(style.overflowY);
        const deliberateClamp =
          (style.webkitLineClamp !== "none" && style.webkitLineClamp !== "") ||
          style.textOverflow === "ellipsis" ||
          element.classList.contains("truncate");
        if (text && !deliberateClamp && (clipsHorizontally || clipsVertically)) {
          clippedText.push(`${token}: ${text.slice(0, 100)}`);
        }
      }
    }

    return {
      counts,
      fontMismatches,
      responsiveOverrides,
      clippedText,
      exactTypeMatches,
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      bodyTextLength: document.body.innerText.trim().length,
    };
  }, semanticTypeSizes);

  if (result.viewportWidth !== viewport.width) {
    throw new Error(`${definition.name} expected ${viewport.width}px, got ${result.viewportWidth}px.`);
  }
  if (result.scrollWidth > result.viewportWidth + 1) {
    throw new Error(
      `${definition.name} has horizontal overflow (${result.scrollWidth} > ${result.viewportWidth}).`,
    );
  }
  if (result.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (result.bodyTextLength < 50) {
    throw new Error(`${definition.name} rendered no meaningful content.`);
  }
  const semanticNodeCount = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
  if (semanticNodeCount < 3 || result.exactTypeMatches < 3) {
    throw new Error(
      `${definition.name} rendered only ${semanticNodeCount} semantic nodes / ${result.exactTypeMatches} exact sizes.`,
    );
  }
  if (result.fontMismatches.length > 0) {
    throw new Error(`${definition.name} semantic font-size mismatches:\n${result.fontMismatches.join("\n")}`);
  }
  if (result.clippedText.length > 0) {
    throw new Error(`${definition.name} clipped semantic text:\n${result.clippedText.join("\n")}`);
  }

  return { ...result, semanticNodeCount };
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
  await page.waitForFunction(
    (expectedText) => document.body.innerText.includes(expectedText),
    definition.expectedText,
    { timeout: 30000 },
  );
  await prepareCase(page, definition);
  await page.waitForTimeout(750);

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

  const layoutResult = await assertSemanticTypeAndLayout(page, definition);
  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: definition.fullPage,
    animations: "disabled",
  });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 10 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${viewport.width}px ${definition.colorScheme}; ` +
      `${layoutResult.semanticNodeCount} semantic type nodes verified ` +
      `(${layoutResult.exactTypeMatches} exact utility sizes, ${layoutResult.responsiveOverrides.length} semantic responsive overrides); ` +
      "no overflow, clipping, overlay, or console errors.",
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
    console.log(`Captured ${cases.length} verified 375px type-hotspot screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
