import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = process.env.PAWPAL_SW_EVIDENCE_DIR || await fs.mkdtemp(path.join(os.tmpdir(), "pawpal-sw-"));
await fs.mkdir(out, { recursive: true });
const sw = await fs.readFile(path.join(root, "public/sw.js"));
const offline = await fs.readFile(path.join(root, "public/offline.html"));
const marker = "SYNTHETIC PRIVATE ACCOUNT A";
const legacy = "pawpal-shell-v7-next-primitives";
const current = "pawpal-public-v2";
const checks = [];
const consoleEvents = [];
const errors = [];
let browser;
let server;
let useLegacy = true;
const assetHeaders = new Map();
const html = (title, body) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:18px system-ui;padding:24px;line-height:1.5}button{font:inherit;padding:14px}h1{font-size:28px}</style><h1>${title}</h1>${body}</html>`;
function check(name, actual, expected = true) {
  assert.deepEqual(actual, expected, name);
  checks.push({ name, passed: true });
  console.log(`PASS ${name}`);
}
async function cached(page, url) {
  return page.evaluate(async ({ url, current }) => !!(await (await caches.open(current)).match(url)), { url, current });
}
try {
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://fixture");
    if (url.pathname === "/sw.js") {
      res.writeHead(200, { "Content-Type": "application/javascript", "Cache-Control": "no-store" });
      res.end(useLegacy ? `self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));` : sw);
      return;
    }
    if (url.pathname === "/login" || url.pathname === "/logout") {
      res.writeHead(200, { "Set-Cookie": url.pathname === "/login" ? "qa_session=A; Path=/; SameSite=Lax" : "qa_session=; Path=/; Max-Age=0", "Cache-Control": "no-store" });
      res.end("ok");
      return;
    }
    if (url.pathname === "/offline.html") {
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "public, max-age=3600" });
      res.end(offline);
      return;
    }
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/assets/") || ["/manifest.webmanifest", "/images/app-mockup.png"].includes(url.pathname)) {
      const headers = assetHeaders.get(url.pathname) || {};
      if (headers.redirect) {
        res.writeHead(302, { Location: "/profile" }); res.end(); return;
      }
      const svg = url.pathname.endsWith(".svg");
      res.writeHead(headers.status || 200, { "Content-Type": svg ? "image/svg+xml" : "application/javascript", "Cache-Control": "public, max-age=3600", ...headers });
      res.end(svg ? '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="20" fill="#76c7b8"/></svg>' : (headers["Cache-Control"]?.includes("private") ? marker : "/* public build asset */"));
      return;
    }
    const signedIn = req.headers.cookie?.includes("qa_session=A");
    if (url.pathname === "/api/me") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "private, no-store" });
      res.end(JSON.stringify({ fixture: marker })); return;
    }
    res.writeHead(signedIn ? 200 : 401, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": url.pathname === "/" ? "public, max-age=3600" : "private, no-store" });
    res.end(html(signedIn ? "Synthetic protected page" : "Synthetic sign-in required", signedIn ? `<p>${marker}</p><p>Isolated fixture using the actual PawPal Service Worker.</p><button id="logout">Sign out</button><script>document.querySelector('#logout').onclick=async()=>{await fetch('/logout',{method:'POST'});navigator.serviceWorker.controller.postMessage({type:'CLEAR_AUTH_CACHE'});document.body.innerHTML='<h1>Signed out</h1>';};</script>` : "<p>Synthetic account only. No personal data.</p>"));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  for (const width of [375, 1440]) {
    useLegacy = true;
    assetHeaders.clear();
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "allow" });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleEvents.push({ width, type: m.type(), text: m.text() }); });
    await page.goto(base);
    await page.evaluate(async ({ legacy, marker }) => {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const cache = await caches.open(legacy);
      await cache.put("/profile", new Response(marker, { headers: { "Cache-Control": "private, no-store" } }));
      await (await caches.open("unrelated-cache")).put("/unrelated", new Response("retain"));
    }, { legacy, marker });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    useLegacy = false;
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    let migrated = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      migrated = await page.evaluate(async ({ legacy, current }) => {
        const names = await caches.keys();
        return !names.includes(legacy) && names.includes(current);
      }, { legacy, current });
      if (migrated) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    check(`${width}: migration completed before assertions`, migrated);
    check(`${width}: old private cache removed on active-worker upgrade`, await page.evaluate(async (legacy) => !(await caches.keys()).includes(legacy), legacy));
    check(`${width}: unrelated cache preserved`, await page.evaluate(async () => (await caches.keys()).includes("unrelated-cache")));
    await page.evaluate(() => fetch("/login", { method: "POST" }));
    for (const route of ["/", "/profile", "/de/profile", "/admin/reports", "/checkout", "/auth/callback?code=synthetic"]) {
      await page.goto(base + route);
      check(`${width}: ${route} online private fixture visible`, (await page.locator("body").innerText()).includes(marker));
      check(`${width}: ${route} never enters shared cache`, await cached(page, route), false);
    }
    await page.evaluate(() => fetch("/api/me"));
    check(`${width}: API never cached`, await cached(page, "/api/me"), false);
    for (const [suffix, headers] of Object.entries({ private: { "Cache-Control": "private, max-age=3600" }, nostore: { "Cache-Control": "no-store" }, vary: { Vary: "Cookie" }, html: { "Content-Type": "text/html" }, redirect: { redirect: true }, failure: { status: 403 } })) {
      const url = `/_next/static/${suffix}.js`;
      assetHeaders.set(url, headers);
      await page.evaluate((url) => fetch(url), url);
      check(`${width}: ${suffix} asset response rejected`, await cached(page, url), false);
    }
    const publicPath = "/_next/static/public.js";
    await page.evaluate((url) => fetch(url), publicPath);
    check(`${width}: explicit public build asset cached`, await cached(page, publicPath));
    assetHeaders.set(publicPath, { "Cache-Control": "private, no-store" });
    const changed = await page.evaluate((url) => fetch(url).then((r) => r.text()), publicPath);
    check(`${width}: network-private response replaces stale cache hit`, changed.includes(marker));
    check(`${width}: previously cached asset removed when private`, await cached(page, publicPath), false);
    assetHeaders.delete(publicPath);
    await page.evaluate((url) => fetch(url), publicPath);
    for (const [name, options] of [["authorization", { headers: { Authorization: "Bearer synthetic" } }], ["no-store request", { cache: "no-store" }]]) {
      const url = `/_next/static/${name.split(" ")[0]}.js`;
      await page.evaluate(({ url, options }) => fetch(url, options), { url, options });
      check(`${width}: ${name} cannot populate cache`, await cached(page, url), false);
    }
    await page.evaluate(() => fetch("/_next/static/query.js?account=A"));
    check(`${width}: query variant not cached`, await cached(page, "/_next/static/query.js?account=A"), false);
    await page.goto(base + "/profile");
    await page.screenshot({ path: path.join(out, `online-private-${width}.png`) });
    await page.locator("#logout").click();
    await page.getByRole("heading", { name: "Signed out" }).waitFor();
    check(`${width}: actual synthetic logout removed cookie`, (await context.cookies()).length, 0);
    await context.setOffline(true);
    await page.goto(base + "/de/profile");
    check(`${width}: offline protected route shows generic page`, await page.title(), "PawPal is offline");
    check(`${width}: logout offline revisit reveals no private marker`, (await page.locator("body").innerText()).includes(marker), false);
    check(`${width}: visible offline message`, await page.getByRole("heading", { name: "You are offline" }).isVisible());
    await page.screenshot({ path: path.join(out, `offline-after-logout-${width}.png`) });
    const publicOffline = await page.evaluate((url) => fetch(url).then((r) => r.text()), publicPath);
    check(`${width}: public static bytes remain available offline`, publicOffline, "/* public build asset */");
    const bypass = await page.evaluate(async (url) => {
      try { await fetch(url, { headers: { Authorization: "Bearer synthetic" } }); return false; } catch { return true; }
    }, publicPath);
    check(`${width}: authenticated request cannot reuse public cache while offline`, bypass);
    await page.evaluate(async ({ current, marker }) => (await caches.open(current)).put("/_next/static/poison.js", new Response(marker, { headers: { "Cache-Control": "private, no-store", "Content-Type": "application/javascript" } })), { current, marker });
    const poison = await page.evaluate(async () => {
      try { await fetch("/_next/static/poison.js"); return false; } catch { return true; }
    });
    check(`${width}: unsafe preexisting response cannot bypass offline cache guard`, poison);
    check(`${width}: unsafe cached response evicted`, await cached(page, "/_next/static/poison.js"), false);
    await page.evaluate(async ({ current, marker }) => (await caches.open(current)).put("/offline.html", new Response(marker, { headers: { "Cache-Control": "private, no-store", "Content-Type": "text/html" } })), { current, marker });
    const fallback = await page.goto(base + "/profile");
    check(`${width}: unsafe offline document uses uncached generic fallback`, fallback.status(), 503);
    check(`${width}: generic fallback has no private bytes`, (await page.locator("body").innerText()).includes(marker), false);
    await context.close();
  }
  check("no uncaught page errors", errors.length, 0);
} catch (error) {
  errors.push(error.stack);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await fs.writeFile(path.join(out, "results.json"), JSON.stringify({ browserPath: "Browser plugin not available; existing Playwright", scope: "Actual production sw.js and offline.html; isolated synthetic HTML/cookie authentication, not real PawPal auth/data", checks, errors, consoleEvents, consoleExplanation: "401/403 and intentional offline network failures are expected in rejection controls", passed: errors.length === 0 }, null, 2));
  console.log(`Service Worker checks: ${checks.length}; evidence: ${out}`);
  if (errors.length) console.error(errors.join("\n"));
}
