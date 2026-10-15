import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { chromium } from "playwright";

const base = process.env.CART_RUNTIME_BASE_URL || "http://127.0.0.1:3223";
const parsedBase = new URL(base);
assert.ok(["127.0.0.1", "localhost"].includes(parsedBase.hostname), "Local test server required");
const output = process.env.CART_RUNTIME_EVIDENCE_DIR;
const fixture = process.env.CART_RUNTIME_FIXTURE === "1";
const env = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/i18n/messages/en.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, env);
const t = env.exports.enMessages;
const product = "Organic Salmon Bites";
const results = [];
if (output) fs.mkdirSync(path.join(output, "screenshots"), { recursive: true });
const browser = await chromium.launch({ headless: true });
const wait = async (fn, description) => {
  for (let i = 0; i < 80; i++) {
    if (await fn()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(description);
};
const persisted = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("pawpal_cart") || "[]"));
async function cart(page) {
  if (!(await page.getByRole("dialog").isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /^Cart/ }).click();
  }
  return page.getByRole("dialog");
}
async function quantity(page, expected) {
  const value = page.getByRole("button", { name: `${t.storeIncreasePrefix} ${product}`, exact: true }).locator("..").locator("span");
  await wait(async () => await value.textContent().catch(() => "") === String(expected), `Rendered quantity should be ${expected}`);
}
async function add(page) {
  await page.goto(base + "/store");
  await page.getByPlaceholder(t.storeSearchPlaceholder).fill("Salmon");
  const cookies = page.getByRole("button", { name: "Essential only", exact: true });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole("button", { name: t.storeAddButton, exact: true }).click();
  await cart(page);
}
async function run(name, width, execute, expectedWarning, authenticated = true) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, locale: "en-US", reducedMotion: "reduce", serviceWorkers: "allow" });
  // The confirmed product rule now requires sign-in before the shipping form.
  // This ephemeral browser fixture exercises client auth state only; it cannot
  // authorize a server purchase (all mutations remain blocked below).
  const user = { id: "b1500000-0000-4000-8000-000000000099", email: "cart-runtime@example.invalid", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-10-15T00:00:00Z" };
  let syntheticBearer = null;
  const fixtureSupabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").origin;
  if (authenticated) {
    const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").hostname.split(".")[0];
    const key = process.env.CART_RUNTIME_AUTH_STORAGE_KEY || `sb-${project}-auth-token`;
    const exp = Math.floor(Date.now()/1000)+86400;
    const token = [Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url"),Buffer.from(JSON.stringify({sub:user.id,role:"authenticated",exp})).toString("base64url"),"synthetic-not-valid-signature"].join(".");
    syntheticBearer = `Bearer ${token}`;
    await context.addInitScript(({key,session,baseOrigin}) => {
      if (location.origin !== baseOrigin) return;
      if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify(session));
    }, {key,baseOrigin:parsedBase.origin,session:{access_token:token,refresh_token:"synthetic-unused",token_type:"bearer",expires_at:exp,expires_in:86400,user}});
  }
  const errors = [], blocked = [], mutations = [], catalogReads = [], readonlyAdminRequests = [];
  await context.route("**/*", async (route) => {
    const request = route.request(); const url = new URL(request.url());
    if (authenticated && request.method()==="GET" && url.pathname==="/auth/v1/user") {
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(user)});
    }
    if (fixture && url.pathname === "/rest/v1/products") {
      catalogReads.push(url.pathname);
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    }
    // This RPC reads membership despite using POST; all other writes stay denied.
    if (fixture && authenticated && request.method() === "POST" && url.origin === fixtureSupabaseOrigin &&
        url.pathname === "/rest/v1/rpc/is_store_admin" && request.headers().authorization === syntheticBearer) {
      assert.deepEqual(request.postDataJSON(), {}, "Membership fixture accepts no caller parameters");
      readonlyAdminRequests.push({ method: request.method(), origin: url.origin, pathname: url.pathname });
      return route.fulfill({ status: 200, contentType: "application/json", body: "false" });
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      mutations.push({ method: request.method(), origin: url.origin, pathname: url.pathname });
      return route.abort();
    }
    if (!(["127.0.0.1", "localhost"].includes(url.hostname) && [parsedBase.port, "54321"].includes(url.port))) {
      blocked.push(url.origin + url.pathname); return route.abort();
    }
    if (url.pathname === "/rest/v1/products") catalogReads.push(url.pathname);
    return route.continue();
  });
  context.on("page", (page) => {
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => errors.push({ type: "runtime", text: error.message }));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) errors.push({ type: message.type(), text: message.text() });
    });
  });
  const page = await context.newPage();
  const result = { name, width, checks: [], captures: [] };
  const check = (label, passed) => { result.checks.push({ label, passed: Boolean(passed) }); assert.ok(passed, label); };
  const capture = async (label, target = page) => {
    // PawIcon is lazy-loaded; wait for the actual quantity glyph instead of
    // recording its deliberately empty Suspense fallback as the settled UI.
    const increase = target.getByRole("button", { name: `${t.storeIncreasePrefix} ${product}`, exact: true });
    if (await increase.isVisible().catch(() => false)) await increase.locator("svg path").waitFor();
    const meta = { label, url: target.url(), title: await target.title(), h1: await target.locator("h1:visible").allTextContents(), allDomH1Count: await target.locator("h1").count(),
      body: await target.locator("body").innerText(),
      layout: await target.evaluate(() => ({ viewport: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })),
      frameworkOverlay: await target.locator("nextjs-portal").count() };
    if (output) {
      meta.screenshot = `screenshots/${name}-${label}.png`;
      await target.screenshot({ path: path.join(output, meta.screenshot), fullPage: false });
    }
    result.captures.push(meta);
    check(`${label}: meaningful page with one h1`, meta.body.length > 100 && meta.h1.length === 1);
    check(`${label}: no framework overlay`, meta.frameworkOverlay === 0);
    check(`${label}: no horizontal overflow`, meta.layout.scroll <= meta.layout.viewport);
    const expectedTitle = new URL(meta.url).pathname === "/store/checkout" ? "Checkout" : "Store | PawPal";
    check(`${label}: expected title and local route`, meta.title === expectedTitle && meta.url.startsWith(base + "/store"));
  };
  try {
    await execute(page, context, check, capture);
    check("catalogue fixture was exercised", !fixture || catalogReads.length > 0);
    check("actual service worker registered", await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length > 0));
    check("read-only membership fixture was exercised", !fixture || !authenticated || readonlyAdminRequests.length > 0);
    check("no write/payment requests", mutations.length === 0);
    const unexpected = errors.filter((error) => !(expectedWarning && error.type === "warning" && error.text.includes(expectedWarning)));
    check("no unexplained runtime/console errors", unexpected.length === 0);
    result.passed = true;
  } catch (error) {
    result.passed = false; result.error = error.message;
    await capture("failure").catch((captureError) => { result.captureError = captureError.message; });
  } finally {
    result.errors = errors; result.blockedExternalRequests = blocked; result.blockedMutations = mutations; result.catalogReads = catalogReads; result.readonlyAdminRequests = readonlyAdminRequests;
    results.push(result);
    if (output) fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ base, browser: "Browser plugin not available; existing Playwright Chromium", catalog: fixture ? "CI empty catalogue response fixture; built-in test catalogue" : "Actual local Supabase catalogue request and product fallback", results }, null, 2));
    console.log(JSON.stringify({ name, passed: result.passed, checks: result.checks, error: result.error }));
    await context.close();
  }
}
try {
  for (const width of [375, 1440]) {
    await run(`cart-persistence-${width}`, width, async (page, context, check, capture) => {
      await add(page); await quantity(page, 1);
      await page.getByRole("button", { name: `${t.storeIncreasePrefix} ${product}`, exact: true }).click();
      await quantity(page, 2); check("add and increase persist two", (await persisted(page))[0]?.quantity === 2);
      await capture("before-refresh");
      await page.reload(); await cart(page); await quantity(page, 2);
      check("refresh preserves quantity two", (await persisted(page))[0]?.quantity === 2);
      await capture("after-refresh");
      await page.getByRole("link", { name: t.storeProceedToCheckout, exact: true }).click();
      await page.getByRole("heading", { name: t.checkoutShippingInformation, exact: true }).waitFor();
      check("checkout receives same quantity", await page.getByText(`${t.checkoutQuantityPrefix} 2`, { exact: true }).isVisible());
      await page.reload(); await page.getByText(`${t.checkoutQuantityPrefix} 2`, { exact: true }).waitFor();
      await capture("checkout-refreshed");
      await page.goBack(); await page.waitForURL(base + "/store"); await cart(page); await quantity(page, 2);
      check("browser back preserves cart", (await persisted(page))[0]?.quantity === 2);
      await page.getByRole("link", { name: t.storeProceedToCheckout, exact: true }).click();
      await page.getByRole("heading", { name: t.checkoutShippingInformation, exact: true }).waitFor();
      await page.getByRole("button", { name: t.checkoutBackToStore, exact: true }).click();
      await page.waitForURL(base + "/store"); await cart(page); await quantity(page, 2);
      await capture("checkout-return");
      await page.getByRole("button", { name: `${t.storeDecreasePrefix} ${product}`, exact: true }).click();
      await quantity(page, 1); check("decrease saves one", (await persisted(page))[0]?.quantity === 1);
      await page.getByRole("button", { name: `${t.storeRemovePrefix} ${product}`, exact: true }).click();
      await page.getByText(t.storeCartEmptyTitle, { exact: true }).waitFor();
      await page.reload(); await cart(page); await page.getByText(t.storeCartEmptyTitle, { exact: true }).waitFor();
      check("explicit removal survives refresh", (await persisted(page)).length === 0); await capture("removed-refreshed");
      await page.goto(base + "/store/checkout"); await page.waitForURL(base + "/store");
      check("empty checkout returns to store", new URL(page.url()).pathname === "/store");
      // A fresh document in the same browser profile also sees the saved empty cart.
      const second = await context.newPage(); await second.goto(base + "/store"); await cart(second);
      await second.getByText(t.storeCartEmptyTitle, { exact: true }).waitFor();
      check("new tab retains explicit empty cart", (await persisted(second)).length === 0);
    });
  }
  await run("guest-checkout-requires-login", 375, async (page, context, check, capture) => {
    await add(page); await page.goto(base + "/store/checkout");
    await page.getByRole("heading", {name:t.storeSignInRequiredTitle,exact:true}).waitFor();
    check("guest cannot access shipping details", await page.getByRole("heading", {name:t.checkoutShippingInformation,exact:true}).count()===0);
    check("guest cart survives auth gate", (await persisted(page))[0]?.quantity===1);
    await capture("sign-in-required");
  }, undefined, false);
  await run("cross-tab-cart", 1440, async (page, context, check, capture) => {
    await add(page); const peer = await context.newPage(); await peer.setViewportSize({ width: 375, height: 900 });
    await peer.goto(base + "/store"); await cart(peer); await quantity(peer, 1);
    await peer.getByRole("button", { name: `${t.storeIncreasePrefix} ${product}`, exact: true }).click();
    await quantity(peer, 2); await quantity(page, 2); check("another tab's edit is rendered", (await persisted(page))[0]?.quantity === 2);
    await capture("peer-updated", peer);
    const checkout = await context.newPage(); await checkout.goto(base + "/store/checkout");
    await checkout.getByText(`${t.checkoutQuantityPrefix} 2`, { exact: true }).waitFor();
    await page.getByRole("button", { name: `${t.storeRemovePrefix} ${product}`, exact: true }).click();
    await peer.getByText(t.storeCartEmptyTitle, { exact: true }).waitFor(); await checkout.waitForURL(base + "/store");
    check("other tab removal empties peer and leaves stale checkout", (await persisted(peer)).length === 0);
    await capture("peer-empty", peer);
  });
  for (const [label, raw] of [["invalid-json", "broken"], ["wrong-shape", '{"quantity":2}']]) {
    await run(`corrupt-${label}`, 375, async (page, context, check, capture) => {
      await context.addInitScript((value) => {
        if (!sessionStorage.getItem("cart-corruption-seeded")) {
          localStorage.setItem("pawpal_cart", value); sessionStorage.setItem("cart-corruption-seeded", "yes");
        }
      }, raw);
      await page.goto(base + "/store"); await cart(page); await page.getByText(t.storeCartEmptyTitle, { exact: true }).waitFor();
      check("corrupt stored value is not rewritten during initialization", await page.evaluate(() => localStorage.getItem("pawpal_cart")) === raw);
      await capture("safe-empty");
      await add(page); await quantity(page, 1); await page.reload(); await cart(page); await quantity(page, 1);
      check("normal add repairs cart and persists", (await persisted(page))[0]?.quantity === 1); await capture("recovered");
    }, "Cart storage contains invalid JSON");
  }
  await run("storage-write-denied", 375, async (page, context, check, capture) => {
    await context.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "pawpal_cart") throw new DOMException("Synthetic quota denial", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await add(page); await quantity(page, 1);
    await page.getByRole("button", { name: `${t.storeIncreasePrefix} ${product}`, exact: true }).click(); await quantity(page, 2);
    check("quota failure keeps current tab usable", await page.evaluate(() => localStorage.getItem("pawpal_cart")) === null);
    await capture("memory-cart");
  }, "Cart storage could not be saved");
} finally {
  await browser.close();
}
const failed = results.filter((result) => !result.passed);
console.log(`Cart runtime: ${results.length - failed.length}/${results.length} scenarios passed; no checkout submission or Stripe calls.`);
if (failed.length) process.exitCode = 1;
