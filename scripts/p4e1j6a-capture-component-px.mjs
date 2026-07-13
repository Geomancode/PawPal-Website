import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceRoot = path.resolve(repoRoot, "..", "evidence", "P4E1j6a");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const viewport = { width: 375, height: 812 };
const productionEnv = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
};

const cases = [
  {
    name: "home-light-375",
    route: "/",
    colorScheme: "light",
    selector: ".homepage-hero-headline",
  },
  {
    name: "store-cart-light-375",
    route: "/store",
    colorScheme: "light",
    selector: "main .pt-paw-web-shell-top",
    paddingTop: "112px",
    interaction: "add-cart",
    assertion: "store",
  },
  {
    name: "checkout-light-375",
    route: "/store/checkout",
    colorScheme: "light",
    selector: ".commerce-page-shell",
    paddingTop: "112px",
  },
  {
    name: "profile-light-375",
    route: "/profile",
    colorScheme: "light",
    selector: ".profile-page-shell",
    paddingTop: "80px",
    assertion: "profile",
  },
  {
    name: "profile-dark-375",
    route: "/profile",
    colorScheme: "dark",
    selector: ".profile-page-shell",
    paddingTop: "80px",
    assertion: "profile",
  },
  {
    name: "admin-reports-light-375",
    route: "/admin/reports",
    colorScheme: "light",
    selector: ".admin-page-shell",
    paddingTop: "128px",
    javaScriptEnabled: false,
  },
  {
    name: "admin-park-risks-light-375",
    route: "/admin/park-risks",
    colorScheme: "light",
    selector: ".admin-page-shell",
    paddingTop: "128px",
  },
  {
    name: "about-light-375",
    route: "/about",
    colorScheme: "light",
    selector: ".about-hero-copy",
  },
  {
    name: "help-light-375",
    route: "/help",
    colorScheme: "light",
    selector: ".support-hero-copy",
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBuild() {
  console.log("Building the production bundle for component-px screenshots...");
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

async function findPort() {
  const preferred = Number(process.env.P4E1J6A_PORT || 3366);
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

function startProductionServer(port) {
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
  await context.route("**/rest/v1/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/profiles")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "p4e1j6a-profile-owner",
          username: "alex_and_luna",
          display_name: "Alex Morgan",
          avatar_url: null,
          bio: "Pet parent, weekend walker, and PawPal community member.",
          language_pref: "en",
          location_city: "Ghent",
          trust_level: 3,
          paw_points: 480,
          is_verified: true,
          created_at: "2024-03-15T10:00:00.000Z",
        }),
      });
    }
    if (pathname.endsWith("/pets")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "p4e1j6a-pet-luna",
            owner_id: "p4e1j6a-profile-owner",
            name: "Luna",
            species_group: "canine",
            breed: "Golden Retriever",
            birth_date: "2021-04-12",
            avatar_url: null,
            social_traits: {
              social_tags: ["Friendly", "Good with Kids"],
              health_badges: ["Fully Vaccinated"],
            },
            blood_type: "DEA 1.1+",
            owner_contact: "+32 470 12 34 56",
            nfc_tag_uid: "P4E1J6A-NFC-LUNA",
            created_at: "2024-03-16T10:00:00.000Z",
          },
        ]),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: "[]",
    });
  });
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
}

async function runCaseAssertion(page, definition) {
  if (definition.assertion === "store") {
    const compactIcon = page.locator(".h-paw-web-icon-compact").first();
    await compactIcon.waitFor({ state: "visible", timeout: 30000 });
    const iconSize = await compactIcon.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.width, style.height];
    });
    if (iconSize[0] !== "14px" || iconSize[1] !== "14px") {
      throw new Error(`${definition.name} expected a 14px compact icon, got ${iconSize.join("/")}.`);
    }
    const floatingCart = page.locator('a[href="/store/checkout"][aria-label]').last();
    await floatingCart.waitFor({ state: "visible", timeout: 15000 });
    const cartSize = await floatingCart.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return [rect.width, rect.height];
    });
    if (cartSize[0] !== 64 || cartSize[1] !== 64) {
      throw new Error(`${definition.name} expected the floating cart at 64px square, got ${cartSize.join("x")}.`);
    }
  }

  if (definition.assertion === "profile") {
    const avatar = page.locator(".profile-avatar").first();
    const metadataIcon = page.locator(".profile-meta-chip svg").first();
    await avatar.waitFor({ state: "visible", timeout: 30000 });
    await metadataIcon.waitFor({ state: "visible", timeout: 30000 });
    const values = await Promise.all([
      avatar.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return [rect.width, rect.height];
      }),
      metadataIcon.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.width, style.height];
      }),
    ]);
    if (values[0][0] !== 52 || values[0][1] !== 52 || values[1][0] !== "14px" || values[1][1] !== "14px") {
      throw new Error(`${definition.name} avatar/icon geometry mismatch: ${JSON.stringify(values)}.`);
    }
  }

}

async function captureCase(browser, baseUrl, definition) {
  const context = await browser.newContext({
    viewport,
    colorScheme: definition.colorScheme,
    reducedMotion: "reduce",
    locale: "en-US",
    javaScriptEnabled: definition.javaScriptEnabled ?? true,
  });
  await installDeterministicRoutes(context);
  await context.addInitScript(({ withProfileSession }) => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
    window.localStorage.setItem("pawpal_globe_tutorial_done", "1");
    window.localStorage.setItem("pawpal_cart", JSON.stringify([{
      product: {
        id: "f1",
        name: "Organic Salmon Bites",
        description: "Wild-caught salmon treats packed with Omega-3 for a shiny coat.",
        price: 14.99,
        category: "food",
        image: "🐟",
        rating: 4.8,
        reviewCount: 342,
        badge: "Best Seller",
        inStock: true,
      },
      quantity: 1,
    }]));
    if (withProfileSession) {
      const accessToken = crypto.randomUUID();
      const refreshToken = crypto.randomUUID();
      window.localStorage.setItem("sb-ctmoljqcjjmgdcsbyfdi-auth-token", JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        expires_at: 4102444800,
        token_type: "bearer",
        user: {
          id: "p4e1j6a-profile-owner",
          aud: "authenticated",
          role: "authenticated",
          email: "alex.fixture@example.com",
          email_confirmed_at: "2024-03-15T10:00:00.000Z",
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: { display_name: "Alex Morgan" },
          created_at: "2024-03-15T10:00:00.000Z",
        },
      }));
    }
  }, { withProfileSession: definition.assertion === "profile" });

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

  if (definition.interaction === "add-cart") {
    const addButton = page.getByRole("button", { name: "Add", exact: true }).first();
    await addButton.waitFor({ state: "visible", timeout: 30000 });
    await addButton.click();
  }

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

  const metrics = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const main = document.querySelector("main");
    const mainStyle = getComputedStyle(main);
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      colorSchemeDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      bodyTextLength: document.body.innerText.trim().length,
      mainZIndex: mainStyle.zIndex,
      mainHasZ20: main.classList.contains("z-20"),
      tokens: {
        shellTop: rootStyle.getPropertyValue("--spacing-paw-web-shell-top").trim(),
        compactIcon: rootStyle.getPropertyValue("--spacing-paw-web-icon-compact").trim(),
        micro: rootStyle.getPropertyValue("--spacing-paw-web-micro").trim(),
      },
    };
  });
  if (metrics.viewportWidth !== viewport.width || metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${definition.name} viewport/overflow mismatch: ${JSON.stringify(metrics)}.`);
  }
  if (metrics.colorSchemeDark !== (definition.colorScheme === "dark")) {
    throw new Error(`${definition.name} did not apply ${definition.colorScheme} color scheme.`);
  }
  if (metrics.bodyTextLength < 50 || !metrics.mainHasZ20) {
    throw new Error(`${definition.name} rendered insufficient content or lost the required z-20 class: ${JSON.stringify(metrics)}.`);
  }
  if (JSON.stringify(metrics.tokens) !== JSON.stringify({ shellTop: "112px", compactIcon: "14px", micro: "6px" })) {
    throw new Error(`${definition.name} token values changed: ${JSON.stringify(metrics.tokens)}.`);
  }
  if (definition.paddingTop) {
    const paddingTop = await target.evaluate((element) => getComputedStyle(element).paddingTop);
    if (paddingTop !== definition.paddingTop) {
      throw new Error(`${definition.name} expected padding-top ${definition.paddingTop}, got ${paddingTop}.`);
    }
  }

  await runCaseAssertion(page, definition);

  const screenshotPath = path.join(evidenceRoot, `${definition.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  const screenshotStat = await stat(screenshotPath);
  if (screenshotStat.size <= 8 * 1024) {
    throw new Error(`${definition.name} screenshot is only ${screenshotStat.size} bytes.`);
  }
  console.log(
    `${definition.name}: ${screenshotStat.size} bytes; ${await page.title()}; ` +
      `375px ${definition.colorScheme}; tokens 112px/14px/6px; no overflow/overlay/console errors.`,
  );
  await context.close();
}

await mkdir(evidenceRoot, { recursive: true });
await runBuild();
const port = await findPort();
const baseUrl = `http://127.0.0.1:${port}`;
const server = startProductionServer(port);
let browser;

try {
  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true });
  for (const definition of cases) await captureCase(browser, baseUrl, definition);
  console.log(`Captured ${cases.length} production screenshots in ${evidenceRoot}.`);
} finally {
  await browser?.close();
  await stopProductionServer(server, port);
}
