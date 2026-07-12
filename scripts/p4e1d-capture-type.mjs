import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1d");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const viewport = { width: 375, height: 812 };
const harnessCases = ["loading", "empty", "error"].flatMap((state) =>
  ["light", "dark"].map((colorScheme) => ({
    kind: "harness",
    name: `harness-${state}-${colorScheme}-375`,
    path: "/dev/state-panel",
    state,
    colorScheme,
    locale: "en-US",
  })),
);
const localeCases = [
  { locale: "de", prefix: "/de" },
  { locale: "en", prefix: "" },
  { locale: "fr", prefix: "/fr" },
  { locale: "nl", prefix: "/nl" },
  { locale: "zh", prefix: "/zh" },
].flatMap(({ locale, prefix }) => [
  {
    kind: "route",
    name: `home-${locale}-375`,
    path: prefix || "/",
    colorScheme: "light",
    locale,
  },
  {
    kind: "route",
    name: `auth-${locale}-375`,
    path: `${prefix}/auth`,
    colorScheme: "light",
    locale,
  },
]);
const cases = [...harnessCases, ...localeCases];

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
  const preferred = Number(process.env.P4E1D_PORT || 3132);
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
    ["run", "dev", "--", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)],
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
  const fontResponses = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (/\.(woff2?|ttf)(?:\?|$)/i.test(response.url())) {
      fontResponses.push({ url: response.url(), status: response.status() });
    }
  });

  const response = await page.goto(`${baseUrl}${definition.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 15000 });
  await page.waitForTimeout(750);

  let captureTarget = page.locator("body");
  if (definition.kind === "harness") {
    await page.evaluate((state) => {
      for (const element of document.querySelectorAll("[data-harness-case]")) {
        element.toggleAttribute("hidden", element.getAttribute("data-harness-case") !== state);
      }
    }, definition.state);
    const harnessTarget = page.locator(`[data-harness-case='${definition.state}']`);
    captureTarget = harnessTarget.locator(`[data-state-panel-state='${definition.state}']`);
    await captureTarget.waitFor({ state: "visible", timeout: 15000 });
    const role = await captureTarget.getAttribute("role");
    const expectedRole = definition.state === "error"
      ? "alert"
      : definition.state === "loading"
        ? "status"
        : null;
    if (role !== expectedRole) {
      throw new Error(`${definition.name} expected role ${expectedRole}, got ${role}.`);
    }
  } else {
    const mainContent = page.locator("#main-content");
    await mainContent.waitFor({ state: "visible", timeout: 15000 });
    if ((await mainContent.innerText()).trim().length < 20) {
      throw new Error(`${definition.name} did not render meaningful main content.`);
    }
  }

  const explicitlyLoadedFontFaces = await page.evaluate(async () => {
    const loaded = await document.fonts.load('15px "Nunito Sans"', "PawPal");
    await document.fonts.ready;
    return loaded.length;
  });
  await page.waitForTimeout(300);

  if (!response?.ok()) throw new Error(`${definition.name} returned ${response?.status()}.`);
  if (!(await page.title())) throw new Error(`${definition.name} has an empty document title.`);
  if (pageErrors.length > 0) {
    throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  }
  if (consoleErrors.length > 0) {
    throw new Error(`${definition.name} console errors:\n${consoleErrors.join("\n")}`);
  }
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  const metrics = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const loadedFonts = Array.from(document.fonts)
      .filter((font) => font.status === "loaded")
      .map((font) => font.family);
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      fontVariable: bodyStyle.getPropertyValue("--font-nunito-sans").trim(),
      bodyFontFamily: bodyStyle.fontFamily,
      fontStatus: document.fonts.status,
      loadedFonts,
    };
  });
  if (metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${definition.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.viewportWidth}).`);
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (!metrics.fontVariable || metrics.fontStatus !== "loaded" || explicitlyLoadedFontFaces < 1) {
    throw new Error(`${definition.name} did not resolve and load --font-nunito-sans.`);
  }
  if (!metrics.bodyFontFamily.toLowerCase().includes("nunito")) {
    throw new Error(`${definition.name} body does not consume Nunito Sans: ${metrics.bodyFontFamily}`);
  }
  if (!metrics.loadedFonts.some((family) => family.toLowerCase().includes("nunito"))) {
    throw new Error(`${definition.name} has no loaded Nunito font face: ${metrics.loadedFonts.join(", ")}`);
  }
  if (!fontResponses.some(({ status }) => status >= 200 && status < 400)) {
    throw new Error(`${definition.name} did not receive a successful self-hosted font response.`);
  }

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: "disabled",
  });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 10 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }

  const result = {
    name: definition.name,
    path: definition.path,
    title: await page.title(),
    screenshotBytes: screenshotStat.size,
    metrics,
    fontResponses,
  };
  console.log(`${definition.name}: ${screenshotStat.size} bytes; ${metrics.bodyFontFamily}`);
  await context.close();
  return result;
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
    const results = [];
    for (const definition of cases) {
      results.push(await captureCase(browser, baseUrl, definition));
    }
    await writeFile(
      path.join(evidenceRoot, "capture-summary.json"),
      `${JSON.stringify({ baseUrl, viewport, cases: results }, null, 2)}\n`,
    );
    console.log(`Captured ${results.length} verified screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    await stopDevServer(devServer, port);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
