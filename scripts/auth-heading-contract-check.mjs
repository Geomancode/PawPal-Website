import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const evidenceDir = process.env.P2W2_AUTH_H1_EVIDENCE_DIR || "";
const providedBaseUrl = process.env.P2W2_AUTH_H1_BASE_URL || "";

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1440", width: 1440, height: 1000 },
];

const routes = [
  { slug: "auth", path: "/auth", expectAuthUrl: false },
  { slug: "profile", path: "/profile", expectAuthUrl: true },
  { slug: "admin-reports", path: "/admin/reports", expectAuthUrl: true },
];

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
  const preferredPort = Number(process.env.P2W2_AUTH_H1_PORT || 3122);
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

async function inspectPage(page) {
  return page.evaluate(() => {
    const headings = (selector) =>
      Array.from(document.querySelectorAll(selector)).map((element) =>
        (element.textContent || "").replace(/\s+/g, " ").trim(),
      );
    const overlayText = Array.from(
      document.querySelectorAll("nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast]"),
    )
      .map((element) => element.textContent || "")
      .join(" ");

    return {
      title: document.title,
      finalUrl: window.location.href,
      h1: headings("h1"),
      h2: headings("h2"),
      hasFrameworkOverlay: /Unhandled Runtime Error|Build Error|Runtime Error|Application error/i.test(overlayText),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

async function runCase(browser, baseUrl, route, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "light",
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

  const caseName = `${route.slug}__${viewport.name}__light`;
  let responseStatus = null;
  let navigationError = null;
  let pageMeta = null;

  try {
    const response = await page.goto(`${baseUrl}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    responseStatus = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    if (route.expectAuthUrl) {
      await page.waitForURL(/\/auth(?:\?|$)/, { timeout: 15000 }).catch(() => {});
    }
    await page.waitForFunction(() => document.querySelectorAll("h1").length > 0, null, { timeout: 10000 });
    await page.waitForTimeout(500);
    pageMeta = await inspectPage(page);
  } catch (error) {
    navigationError = serializeError(error);
  }

  if (evidenceDir) {
    await mkdir(path.join(evidenceDir, "after"), { recursive: true });
    await mkdir(path.join(evidenceDir, "meta"), { recursive: true });
    if (route.path === "/auth") {
      await page.screenshot({
        path: path.join(evidenceDir, "after", `${caseName}__after.png`),
        fullPage: false,
      });
    }
    await writeFile(
      path.join(evidenceDir, "meta", `${caseName}.json`),
      JSON.stringify(
        {
          route: route.path,
          viewport,
          colorScheme: "light",
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
  if (responseStatus === null || responseStatus >= 400) {
    failures.push(`expected HTTP status below 400, got ${responseStatus}`);
  }
  if (pageErrors.length > 0) failures.push(`expected zero page errors, got ${pageErrors.length}`);
  if (consoleErrors.length > 0) failures.push(`expected zero console errors, got ${consoleErrors.length}`);
  if (pageMeta?.hasFrameworkOverlay) failures.push("framework error overlay was visible");
  if (pageMeta?.h1?.length !== 1) {
    failures.push(`expected exactly one h1, got ${pageMeta?.h1?.length ?? "unknown"}: ${JSON.stringify(pageMeta?.h1 ?? [])}`);
  }
  if (!pageMeta?.h1?.[0]?.includes("One login for walks")) {
    failures.push(`expected auth page-level h1, got ${JSON.stringify(pageMeta?.h1 ?? [])}`);
  }
  if (route.expectAuthUrl && !pageMeta?.finalUrl?.includes("/auth")) {
    failures.push(`expected signed-out redirect to /auth, got ${pageMeta?.finalUrl ?? "unknown"}`);
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

  console.log(`Auth heading contract base URL: ${baseUrl}`);
  if (evidenceDir) console.log(`Evidence output: ${evidenceDir}`);

  browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of routes) {
    for (const viewport of viewports) {
      const result = await runCase(browser, baseUrl, route, viewport);
      results.push(result);
      const status = result.failures.length === 0 ? "PASS" : "FAIL";
      console.log(
        `${status} ${result.caseName} status=${result.responseStatus} ` +
          `h1=${JSON.stringify(result.pageMeta?.h1 ?? [])} finalUrl=${result.pageMeta?.finalUrl ?? "unknown"}`,
      );
      for (const failure of result.failures) {
        console.log(`  - ${failure}`);
      }
      for (const pageError of result.pageErrors) {
        console.log(`  pageerror: ${pageError}`);
      }
      for (const consoleError of result.consoleErrors) {
        console.log(`  console-error: ${consoleError}`);
      }
    }
  }

  const failed = results.filter((result) => result.failures.length > 0);
  if (failed.length > 0) {
    console.error(`Auth heading contract failed: ${failed.length}/${results.length} cases failed.`);
    process.exitCode = 1;
  } else {
    console.log(`Auth heading contract passed: ${results.length}/${results.length} cases passed.`);
  }
} finally {
  if (browser) await browser.close();
  await stopDevServer(devServer);
}
