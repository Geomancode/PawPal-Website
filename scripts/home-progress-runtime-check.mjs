import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.HOME_PROGRESS_BASE_URL || "http://127.0.0.1:3226";
const origin = new URL(base);
assert.ok(["127.0.0.1", "localhost"].includes(origin.hostname), "A local fixture site is required");
const out = process.env.HOME_PROGRESS_EVIDENCE_DIR;
if (out) await fs.mkdir(out, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true });

// Progress tests use a genuinely active same-origin worker, rather than making
// unrelated network quiescence a prerequisite. First-install behavior is covered
// by the separate service-worker suite; no product registration is bypassed there.
async function loadProgressHomepage(page) {
  const setup = await page.goto(new URL("/offline.html", base).href, { waitUntil: "domcontentloaded", timeout: 15000 });
  assert.equal(setup.status(), 200, "same-origin static worker setup page responds");
  await page.evaluate(() => {
    window.__pawpalProgressWorker = { registered: false, error: null };
    navigator.serviceWorker.register("/sw.js").then(
      () => { window.__pawpalProgressWorker.registered = true; },
      (error) => { window.__pawpalProgressWorker.error = String(error); },
    );
  });
  await page.waitForFunction(() => {
    const setup = window.__pawpalProgressWorker;
    const worker = navigator.serviceWorker.controller;
    return setup.error !== null || (setup.registered && worker?.state === "activated"
      && worker.scriptURL === new URL("/sw.js", location.origin).href);
  }, undefined, { timeout: 15000 });
  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { ...window.__pawpalProgressWorker, controller: navigator.serviceWorker.controller?.scriptURL,
      active: registration?.active?.scriptURL, state: registration?.active?.state, scope: registration?.scope };
  });
  assert.equal(worker.error, null, "worker setup must not fail");
  assert.equal(worker.active, new URL("/sw.js", base).href, "exact same-origin active worker");
  assert.equal(worker.controller, worker.active, "setup page actually controlled");
  assert.equal(worker.state, "activated");
  assert.equal(worker.scope, new URL("/", base).href);
  const response = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(() => document.fonts.status === "loaded"
    && document.querySelector("h1")?.getBoundingClientRect().height > 0
    && document.querySelector(".scroll-progress") !== null, undefined, { timeout: 15000 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL), worker.controller,
    "homepage retains the already-active worker");
  return { response, worker };
}

async function progressMatches(page, expected) {
  await page.waitForFunction((expected) => {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return false;
    const range = document.documentElement.scrollHeight - innerHeight;
    const position = range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0;
    const scale = new DOMMatrixReadOnly(getComputedStyle(bar).transform).a;
    const rect = bar.getBoundingClientRect();
    const style = getComputedStyle(bar);
    const isTopLayer = style.opacity === "1" && style.visibility === "visible" && style.backgroundImage !== "none"
      && rect.top === 0 && rect.left === 0 && rect.height > 0
      && (scale === 0 || document.elementFromPoint(Math.min(8, rect.width / 2), rect.height / 2) === bar);
    return isTopLayer && Math.abs(scale - position) < 0.003 && (expected === null || Math.abs(position - expected) < 0.003);
  }, expected, { timeout: 5000 });
  return page.evaluate(() => {
    const bar = document.querySelector(".scroll-progress");
    const rect = bar.getBoundingClientRect();
    return {
      scale: new DOMMatrixReadOnly(getComputedStyle(bar).transform).a,
      scrollY, range: document.documentElement.scrollHeight - innerHeight,
      top: rect.top, left: rect.left, width: rect.width, height: rect.height,
      parentIsBody: bar.parentElement === document.body,
      hitIsProgress: rect.width > 0 && document.elementFromPoint(Math.min(8, rect.width / 2), rect.height / 2) === bar,
    };
  });
}

try {
  for (const width of [375, 1440]) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion, serviceWorkers: "allow" });
      const failures = [], unexpectedRequests = [];
      await context.route("**/*", async (route) => {
        const request = route.request(); const url = new URL(request.url());
        if (request.method() !== "GET" || url.origin !== origin.origin) {
          unexpectedRequests.push({ method: request.method(), origin: url.origin, pathname: url.pathname });
          return route.abort();
        }
        if (url.pathname === "/api/home-globe-posts") return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return route.continue();
      });
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          if (String(type).includes("webgl")) return null;
          return original.call(this, type, ...args);
        };
        localStorage.setItem("pawpal-consent-v1", "essential");
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => failures.push(e.message));
      page.on("console", (m) => { if (["error", "warning"].includes(m.type())) failures.push(m.text()); });
      const result = { width, reducedMotion, checks: [], states: [], screenshots: [] };
      const check = (label, condition) => { result.checks.push({ label, passed: Boolean(condition) }); assert.ok(condition, label); };
      const capture = async (label) => {
        if (!out) return;
        // Existing in-view opacity transitions take up to 0.7s; capture their
        // settled visual result, while the progress assertions remain immediate.
        await page.waitForTimeout(900);
        const filename = `progress-${width}-${reducedMotion}-${label}.png`;
        await page.screenshot({ path: path.join(out, filename) }); result.screenshots.push(filename);
      };
      try {
        const { response, worker } = await loadProgressHomepage(page);
        result.readiness = { mode: "real-same-origin-worker-warmed", worker };
        check("homepage HTTP 200 and URL", response.status() === 200 && page.url() === base + "/");
        check("homepage title", (await page.title()).includes("PawPal"));
        check("one visible meaningful headline", await page.locator("h1:visible").count() === 1 && (await page.locator("h1:visible").innerText()).includes("PawPal"));
        check("no framework overlay", await page.locator("nextjs-portal, [data-nextjs-dialog]").count() === 0);
        const cookie = page.getByRole("button", { name: "Essential only", exact: true });
        if (await cookie.isVisible()) await cookie.click();
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); });
        result.states.push({ label: "top", ...await progressMatches(page, 0) });
        check("decorative bar hidden from accessibility", await page.locator(".scroll-progress").getAttribute("aria-hidden") === "true");
        await capture("top");
        if (width === 375) {
          const menu = page.locator('button[aria-controls="pawpal-mobile-navigation"]');
          await menu.click();
          check("mobile menu opens", await menu.getAttribute("aria-expanded") === "true");
          await page.keyboard.press("Escape");
          await page.waitForFunction(() => document.activeElement?.getAttribute("aria-controls") === "pawpal-mobile-navigation");
          check("Escape restores menu focus", await menu.evaluate((el) => el === document.activeElement));
        }
        await page.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2));
        result.states.push({ label: "middle", ...await progressMatches(page, 0.5) });
        await capture("middle");
        await page.setViewportSize({ width, height: 700 });
        result.states.push({ label: "viewport-resize", ...await progressMatches(page, null) });
        await page.evaluate(() => { const block = document.createElement("div"); block.id = "qa-height-change"; block.style.height = "700px"; document.body.appendChild(block); });
        result.states.push({ label: "document-resize", ...await progressMatches(page, null) });
        await page.evaluate(() => { document.getElementById("qa-height-change").remove(); scrollTo(0, document.documentElement.scrollHeight); });
        result.states.push({ label: "bottom", ...await progressMatches(page, 1) });
        await capture("bottom");
        await page.evaluate(() => scrollTo(0, 0));
        await progressMatches(page, 0);
        if (width === 375) await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
        await page.locator("nav").first().getByRole("link", { name: "About Us", exact: true }).filter({ visible: true }).click();
        await page.waitForURL(base + "/about");
        check("route leaves homepage", await page.locator(".scroll-progress").count() === 0);
        await page.goBack();
        await page.waitForURL(base + "/");
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); });
        result.states.push({ label: "return", ...await progressMatches(page, 0) });
        check("no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        check("no outside or write request", unexpectedRequests.length === 0);
        check("no runtime/console errors", failures.length === 0);
        result.passed = true;
      } catch (error) { result.passed = false; result.error = error.stack; await capture("failure").catch(() => undefined); }
      finally {
        result.errors = failures; result.unexpectedRequests = unexpectedRequests; results.push(result); await context.close();
        if (out) await fs.writeFile(path.join(out, "results.json"), JSON.stringify({ base, results }, null, 2));
        console.log(JSON.stringify(result));
      }
    }
  }
} finally { await browser.close(); }
assert.ok(results.length === 4 && results.every(r => r.passed), "All viewport and motion progress cases must pass");
