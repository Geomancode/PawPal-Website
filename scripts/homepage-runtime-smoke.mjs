import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1440", width: 1440, height: 1000 },
];
const colorSchemes = ["light", "dark"];
const evidenceDir = process.env.P2W2_HOME_SMOKE_EVIDENCE_DIR || "";
const providedBaseUrl = process.env.P2W2_HOME_SMOKE_BASE_URL || "";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findPort() {
  const preferredPort = Number(process.env.P2W2_HOME_SMOKE_PORT || 3102);
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free localhost port found from ${preferredPort} to ${preferredPort + 19}.`);
}

async function waitForServer(baseUrl, timeoutMs = 120000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
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
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => process.stdout.write(`[dev] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[dev] ${chunk}`));
  child.once("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      process.stderr.write(`[dev] exited with code ${code}\n`);
    } else if (signal) {
      process.stderr.write(`[dev] exited with signal ${signal}\n`);
    }
  });

  return child;
}

async function stopDevServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}

function serializeError(error) {
  return String(error?.stack || error?.message || error).slice(0, 1200);
}

async function inspectHomepage(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || "1") > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const selectors = [
      "[data-testid='home-globe']",
      ".globe-static-preview",
      ".hero-globe-shell-upgraded",
      ".hero-product-tag",
    ];
    const candidates = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector)).map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          visible: isVisible(element),
        };
      }),
    );
    const overlayText = Array.from(
      document.querySelectorAll("nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast]"),
    )
      .filter(isVisible)
      .map((element) => element.textContent || "")
      .join(" ");

    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll("h1")).map((element) =>
        (element.textContent || "").replace(/\s+/g, " ").trim(),
      ),
      hasFrameworkOverlay: /Unhandled Runtime Error|Build Error|Runtime Error|Application error/i.test(overlayText),
      globeState: document.querySelector("[data-testid='home-globe']")?.getAttribute("data-globe-state") ?? null,
      visualCandidates: candidates,
      hasFirstViewportProductVisual: candidates.some(
        (item) =>
          item.visible &&
          item.width >= 80 &&
          item.height >= 80 &&
          item.top < window.innerHeight &&
          item.bottom > 0,
      ),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

async function runCase(browser, baseUrl, viewport, colorScheme) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    locale: "en-US",
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => pageErrors.push(serializeError(error)));
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text().slice(0, 800));
    }
  });

  const caseName = `home__${viewport.name}__${colorScheme}`;
  let responseStatus = null;
  let navigationError = null;
  let pageMeta = null;

  try {
    const response = await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    responseStatus = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(3500);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 10000 });
    pageMeta = await inspectHomepage(page);
  } catch (error) {
    navigationError = serializeError(error);
  }

  if (evidenceDir) {
    await mkdir(path.join(evidenceDir, "after"), { recursive: true });
    await mkdir(path.join(evidenceDir, "meta"), { recursive: true });
    await page.screenshot({
      path: path.join(evidenceDir, "after", `${caseName}.png`),
      fullPage: false,
    });
    await writeFile(
      path.join(evidenceDir, "meta", `${caseName}.json`),
      JSON.stringify(
        {
          route: "/",
          viewport,
          colorScheme,
          responseStatus,
          navigationError,
          pageErrors,
          consoleErrors,
          page: pageMeta,
        },
        null,
        2,
      ),
    );
  }

  await context.close();

  const failures = [];
  if (navigationError) failures.push(`navigation failed: ${navigationError}`);
  if (responseStatus !== 200) failures.push(`expected HTTP 200, got ${responseStatus}`);
  if (pageErrors.length > 0) failures.push(`expected zero page errors, got ${pageErrors.length}`);
  if (pageMeta?.hasFrameworkOverlay) failures.push("framework error overlay was visible");
  if (!pageMeta?.h1?.some((text) => text.includes("PawPal pet safety"))) {
    failures.push("homepage H1 was not visible");
  }
  if (viewport.name === "mobile-390" && !pageMeta?.hasFirstViewportProductVisual) {
    failures.push("mobile first viewport did not contain the globe/product visual");
  }

  return {
    caseName,
    failures,
    responseStatus,
    pageErrors,
    consoleErrors,
    pageMeta,
  };
}

let devServer = null;
let browser = null;

try {
  const port = providedBaseUrl ? null : await findPort();
  const baseUrl = providedBaseUrl || `http://127.0.0.1:${port}`;

  if (!providedBaseUrl) {
    devServer = startDevServer(port);
    await waitForServer(baseUrl);
  } else {
    await waitForServer(baseUrl, 30000);
  }

  console.log(`Homepage runtime smoke base URL: ${baseUrl}`);
  if (evidenceDir) console.log(`Evidence output: ${evidenceDir}`);

  browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of viewports) {
    for (const colorScheme of colorSchemes) {
      const result = await runCase(browser, baseUrl, viewport, colorScheme);
      results.push(result);
      const status = result.failures.length === 0 ? "PASS" : "FAIL";
      console.log(
        `${status} ${result.caseName} status=${result.responseStatus} ` +
          `pageErrors=${result.pageErrors.length} consoleErrors=${result.consoleErrors.length} ` +
          `globeState=${result.pageMeta?.globeState ?? "unknown"}`,
      );
      for (const failure of result.failures) {
        console.log(`  - ${failure}`);
      }
      for (const pageError of result.pageErrors) {
        console.log(`  pageerror: ${pageError}`);
      }
    }
  }

  const failed = results.filter((result) => result.failures.length > 0);
  if (failed.length > 0) {
    console.error(`Homepage runtime smoke failed: ${failed.length}/${results.length} cases failed.`);
    process.exitCode = 1;
  } else {
    console.log(`Homepage runtime smoke passed: ${results.length}/${results.length} cases passed with zero page errors.`);
  }
} finally {
  if (browser) await browser.close();
  await stopDevServer(devServer);
}
