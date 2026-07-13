import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1j6b");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };
const baseProductionEnv = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
};

const cases = [
  {
    name: "home-light-375",
    route: "/",
    colorScheme: "light",
    selector: ".homepage-hero-headline",
    variable: ["--home-hero-globe-diameter-fallback", "min(90vw, 420px)"],
  },
  {
    name: "globe-fallback-dark-375",
    route: "/globe",
    colorScheme: "dark",
    selector: ".globe-fallback-stage",
    forceGlobeFallback: true,
    variable: ["--globe-fallback-stage-padding-fluid", "5vw"],
  },
  {
    name: "legal-terms-light-375",
    route: "/terms",
    colorScheme: "light",
    selector: ".legal-page-shell",
    variable: ["--legal-hero-padding-range", "clamp(1.5rem, 4vw, 2.75rem)"],
  },
  {
    name: "about-light-375",
    route: "/about",
    colorScheme: "light",
    selector: ".about-hero-copy",
    variable: ["--legal-about-system-icon-size", "2.75rem"],
  },
  {
    name: "help-light-375",
    route: "/help",
    colorScheme: "light",
    selector: ".support-hero-copy",
    variable: ["--support-card-icon-size", "2.75rem"],
  },
  {
    name: "auth-light-375",
    route: "/auth",
    colorScheme: "light",
    selector: ".auth-card",
    variable: ["--auth-visual-panel-min-height", "37rem"],
  },
  {
    name: "store-light-375",
    route: "/store",
    colorScheme: "light",
    selector: ".store-product-media",
    variable: ["--commerce-product-preview-size", "min(11.5rem, 62vw)"],
  },
  {
    name: "tag-fixture-dark-375",
    route: "/tag/p4e1j6b-production-fixture",
    colorScheme: "dark",
    selector: ".tag-rescue-panel",
    variable: ["--tag-info-tile-min-height", "4.2rem"],
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBuild(productionEnv) {
  console.log("Building the production bundle for route CSS screenshots...");
  await new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: repoRoot,
      env: productionEnv,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Production build failed with code ${code ?? "null"} / signal ${signal ?? "none"}.`));
    });
  });
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function findPort(preferred) {
  for (let port = preferred; port < preferred + 20; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free localhost port found from ${preferred} to ${preferred + 19}.`);
}

async function startSupabaseFixtureServer(port) {
  const pet = {
    id: "p4e1j6b-production-fixture",
    name: "Luna",
    breed: "Golden Retriever",
    age: 4,
    avatar_url: null,
    social_traits: {
      social_tags: ["Friendly", "Good with kids"],
      health_badges: ["Vaccinated"],
    },
    blood_type: "DEA 1.1+",
    owner_contact: "+32 470 12 34 56",
    created_at: "2024-03-16T10:00:00.000Z",
    owner_id: "p4e1j6b-production-owner",
  };
  const owner = {
    display_name: "Alex Morgan",
    username: "alex_and_luna",
    avatar_url: null,
  };
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url || "/", `http://127.0.0.1:${port}`).pathname;
    let body;
    if (pathname.endsWith("/rest/v1/pets")) body = pet;
    else if (pathname.endsWith("/rest/v1/profiles")) body = owner;
    else body = [];
    response.writeHead(200, {
      "content-type": "application/json",
      "content-range": "0-0/1",
    });
    response.end(JSON.stringify(body));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  console.log(`Supabase production fixture listening on http://127.0.0.1:${port}.`);
  return server;
}

async function stopSupabaseFixtureServer(server, port) {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (!(await isPortFree(port))) throw new Error(`Supabase fixture still owns port ${port} after shutdown.`);
  console.log(`Supabase production fixture stopped; port ${port} is free.`);
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

function startProductionServer(port, productionEnv) {
  const child = spawn(
    "npm",
    ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      detached: process.platform !== "win32",
      env: productionEnv,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => process.stdout.write(`[production] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[production] ${chunk}`));
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

async function stopProductionServer(child, port) {
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
    throw new Error(`Production server still owns port ${port} after shutdown.`);
  }
  console.log(`Production server stopped; port ${port} is free.`);
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
  await context.route("**/api/home-globe-posts**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
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
  await context.route("**/api/map-search", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [] }) }),
  );
}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: "en-US",
  });
  await installDeterministicRoutes(context);
  await context.addInitScript(({ forceGlobeFallback }) => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
    window.localStorage.setItem("pawpal_globe_tutorial_done", "1");
    if (forceGlobeFallback) {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return originalGetContext.call(this, type, ...args);
      };
    }
  }, { forceGlobeFallback: Boolean(definition.forceGlobeFallback) });

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
  const target = page.locator(definition.selector).first();
  await target.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(500);

  if (response?.status() !== 200) throw new Error(`${definition.name} returned ${response?.status()}, expected 200.`);
  if (!(await page.title())) throw new Error(`${definition.name} has an empty document title.`);
  if (new URL(page.url()).pathname !== definition.route) {
    throw new Error(`${definition.name} navigated to ${page.url()} instead of ${definition.route}.`);
  }
  if (pageErrors.length > 0) throw new Error(`${definition.name} page errors:\n${pageErrors.join("\n")}`);
  if (consoleErrors.length > 0) throw new Error(`${definition.name} console errors:\n${consoleErrors.join("\n")}`);
  if (await page.locator("[data-nextjs-dialog-overlay]").count()) {
    throw new Error(`${definition.name} rendered a Next.js error overlay.`);
  }

  const metrics = await page.evaluate(([variableName]) => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    bodyTextLength: document.body.innerText.trim().length,
    h1Count: document.querySelectorAll("h1").length,
    variableValue: getComputedStyle(document.documentElement).getPropertyValue(variableName).trim(),
  }), definition.variable);
  if (metrics.viewportWidth !== viewport.width || metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${definition.name} viewport/overflow mismatch: ${JSON.stringify(metrics)}.`);
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (metrics.bodyTextLength < 50 || metrics.h1Count !== 1) {
    throw new Error(`${definition.name} rendered insufficient content or an invalid h1 count: ${JSON.stringify(metrics)}.`);
  }
  const serializedVariableValue = metrics.variableValue.replace(/\s+/g, "");
  const expectedVariableValue = definition.variable[1].replace(/\s+/g, "");
  if (serializedVariableValue !== expectedVariableValue) {
    throw new Error(`${definition.name} expected ${definition.variable.join(" = ")}, got ${metrics.variableValue}.`);
  }

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }
  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; 375px ${definition.colorScheme}; ` +
      `${definition.variable.join("=")}; no overflow/overlay/console errors.`,
  );
  await context.close();
}

async function main() {
  await mkdir(evidenceRoot, { recursive: true });
  const fixturePort = await findPort(Number(process.env.P4E1J6B_SUPABASE_FIXTURE_PORT || 3374));
  const fixtureServer = await startSupabaseFixtureServer(fixturePort);
  const productionEnv = {
    ...baseProductionEnv,
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fixturePort}`,
  };
  let port;
  let server;
  let browser;

  try {
    await runBuild(productionEnv);
    port = await findPort(Number(process.env.P4E1J6B_PORT || 3376));
    const baseUrl = `http://127.0.0.1:${port}`;
    server = startProductionServer(port, productionEnv);
    await waitForServer(baseUrl);
    browser = await chromium.launch({
      headless: true,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    });
    for (const definition of cases) await captureCase(browser, baseUrl, definition);
    console.log(`Captured ${cases.length} verified production screenshots in ${evidenceRoot}.`);
  } finally {
    await browser?.close();
    if (server) await stopProductionServer(server, port);
    await stopSupabaseFixtureServer(fixtureServer, fixturePort);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
