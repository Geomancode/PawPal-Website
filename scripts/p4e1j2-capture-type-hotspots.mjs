import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1j2");
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
    name: "profile-light-en-375",
    route: "/profile",
    colorScheme: "light",
    locale: "en-US",
    selector: ".profile-page-shell",
    expectedText: "Profile readiness",
  },
  {
    name: "admin-reports-light-en-375",
    route: "/admin/reports",
    colorScheme: "light",
    locale: "en-US",
    selector: ".admin-page-shell",
    expectedText: "Moderation reports",
  },
  {
    name: "admin-park-risks-light-en-375",
    route: "/admin/park-risks",
    colorScheme: "light",
    locale: "en-US",
    selector: ".admin-page-shell",
    expectedText: "Risk review queue",
  },
  {
    name: "checkout-light-en-375",
    route: "/store/checkout",
    colorScheme: "light",
    locale: "en-US",
    selector: ".commerce-page-shell",
    expectedText: "Secure checkout",
  },
  {
    name: "store-light-en-375",
    route: "/store",
    colorScheme: "light",
    locale: "en-US",
    selector: "#main-content h1",
    expectedText: "Smart tags and walk gear for",
  },
  {
    name: "checkout-light-de-375",
    route: "/de/store/checkout",
    colorScheme: "light",
    locale: "de-DE",
    selector: ".commerce-page-shell",
    expectedText: "Sicherer Checkout",
  },
  {
    name: "profile-dark-en-375",
    route: "/profile",
    colorScheme: "dark",
    locale: "en-US",
    selector: ".profile-page-shell",
    expectedText: "Profile readiness",
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
  const preferred = Number(process.env.P4E1J2_PORT || 3332);
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
    let exactTypeMatches = 0;
    const clippedText = [];
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
      exactTypeMatches,
      clippedText,
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
  if (Object.values(result.counts).reduce((sum, count) => sum + count, 0) < 3) {
    throw new Error(`${definition.name} rendered fewer than three visible semantic type tokens.`);
  }
  if (result.exactTypeMatches < 3) {
    throw new Error(`${definition.name} rendered fewer than three exact semantic utility sizes.`);
  }
  if (result.fontMismatches.length > 0) {
    throw new Error(`${definition.name} semantic font-size mismatches:\n${result.fontMismatches.join("\n")}`);
  }
  if (result.clippedText.length > 0) {
    throw new Error(`${definition.name} clipped semantic text:\n${result.clippedText.join("\n")}`);
  }

  return result;
}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: definition.locale,
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
  await page.waitForFunction(
    (expectedText) => document.body.innerText.includes(expectedText),
    definition.expectedText,
    { timeout: 30000 },
  );
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
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 10 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${viewport.width}px ${definition.colorScheme}; ` +
      `${Object.values(layoutResult.counts).reduce((sum, count) => sum + count, 0)} semantic type nodes verified ` +
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
    browser = await chromium.launch({ headless: true });
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
