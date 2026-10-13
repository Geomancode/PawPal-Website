// Exercise the real generator/NextResponse adapter without opening any socket.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
// Match Next's Node runtime bootstrap before importing framework test helpers.
require("next/dist/server/node-environment-baseline");
const { unstable_doesMiddlewareMatch: matcherMatches } = require("next/experimental/testing/server");
const { NextRequest } = require("next/server");
const cache = new Map();
let locale = "en";
function moduleAt(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  const result = {};
  cache.set(filename, result);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  function localRequire(id) {
    if (id === "next/server") return require(id);
    if (id === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (id === "next/link") return { __esModule: true, default: "a" };
    if (id === "@/i18n/I18nProvider") return { useI18n: () => ({ path: (p) => locale === "en" ? p : `/${locale}${p === "/" ? "" : p}` }) };
    if (id === "@/i18n/useRouteTranslations") return { useRouteTranslations: () => ({ loader: null, t: (key) => key }) };
    if (id.startsWith("@/components/")) return { __esModule: true, default: id, buttonClassName: () => "existing-button" };
    assert(id.startsWith("."), `Unexpected import: ${id}`);
    const base = path.resolve(path.dirname(filename), id);
    const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    assert(resolved, `Unresolved import: ${id}`);
    return moduleAt(path.relative(root, resolved));
  }
  vm.runInNewContext(code, { exports: result, require: localRequire, process: { env: { NODE_ENV: "production" } } }, { filename });
  return result;
}
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS ${label}`); }
const doc = moduleAt("src/lib/notFoundDocument.ts");
const adapter = moduleAt("src/proxy.ts");
const known = moduleAt("src/lib/siteRouteRegistry.ts");
const assertHeaders = (response) => {
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal(response.headers.get("location"), null);
};
for (const language of ["en", "de", "fr", "nl", "zh"]) {
  const messages = moduleAt(`src/i18n/messages/${language}.ts`)[`${language}Messages`];
  const html = await doc.getNotFoundDocument(language);
  await check(`${language}: complete document, existing localized copy, one semantic heading/head`, () => {
    assert(html.startsWith("<!doctype html>"));
    assert(html.includes(`<html lang="${language}">`));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.equal((html.match(/<title>/g) || []).length, 1);
    assert.equal((html.match(/name="description"/g) || []).length, 1);
    assert(html.includes(messages.notFoundTitle.replaceAll("'", "&#39;")));
    assert(html.includes('name="robots" content="noindex, nofollow"'));
    assert(html.includes('src="/pawpal_logo_horizontal.svg"'));
    assert(html.includes('href="/pawpal-not-found.css"'));
    assert(!/<script\b|__next|https?:\/\//i.test(html));
  });
  await check(`${language}: exactly two fixed local recovery links`, () => {
    assert.deepEqual(Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"/g), (m) => m[1]), language === "en" ? ["/", "/store"] : [`/${language}`, `/${language}/store`]);
  });
  const pathname = `/${language}/synthetic-unknown`;
  await check(`${language}: actual matcher covers unknown before rendering`, () => assert(matcherMatches({ config: adapter.config, url: pathname })));
  for (const method of ["GET", "HEAD"]) await check(`${language}: real proxy ${method} honest 404 with correct body`, async () => {
    const response = await adapter.proxy(new NextRequest(`http://127.0.0.1${pathname}?next=%3Cscript%3E`, { method }));
    assertHeaders(response);
    assert.equal(await response.text(), method === "HEAD" ? "" : html);
  });
  await check(`${language}: RSC/prefetch does not fabricate Flight or accept header locale`, async () => {
    const response = await adapter.proxy(new NextRequest(`http://127.0.0.1${pathname}?_rsc=synthetic`, { headers: { RSC: "1", "Next-Router-Prefetch": "1", "Accept-Language": "outside", Accept: "text/x-component" } }));
    assertHeaders(response);
    assert.equal(await response.text(), html);
  });
  await check(`${language}: actual resource-not-found component keeps recovery locale`, () => {
    locale = language;
    const tree = moduleAt("src/app/[locale]/not-found.tsx").default();
    const hrefs = [];
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (node.type === "a") hrefs.push(node.props.href);
      visit(node.props?.children);
    }
    visit(tree);
    assert.deepEqual(hrefs, language === "en" ? ["/", "/store"] : [`/${language}`, `/${language}/store`]);
  });
}
await check("unsupported locale and malicious pathname have fixed English content", async () => {
  const expected = await doc.getNotFoundDocument("en");
  for (const pathname of ["/xx", "/%3Cscript%3E", "/unknown?next=https%3A%2F%2Foutside.invalid"]) {
    const response = await adapter.proxy(new NextRequest(`http://127.0.0.1${pathname}`));
    assertHeaders(response);
    assert.equal(await response.text(), expected);
  }
});
await check("all dictionary interpolations escape hostile text including head", () => {
  const en = moduleAt("src/i18n/messages/en.ts").enMessages;
  const hostile = '<img src=x onerror="bad()">&\'test';
  const messages = { ...en };
  for (const key of Object.keys(messages).filter((k) => k.startsWith("notFound"))) messages[key] = hostile;
  const html = doc.renderNotFoundDocument("fr", messages);
  assert(!html.includes(hostile));
  assert(!html.includes("<img src=x"));
  assert(html.includes("&lt;img src=x onerror=&quot;bad()&quot;&gt;&amp;&#39;test"));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
});
await check("known API/framework/resource/admin/dynamic routes return framework continuation", async () => {
  for (const pathname of ["/api/not-a-real-handler", "/_next/static/synthetic.js", "/robots.txt", "/sitemap.xml", "/pawpal-not-found.css", "/.well-known/apple-app-site-association", ...known.sitePageRoutes.filter((p) => p !== "/dev/state-panel").map((p) => p.replace(":id", "synthetic.id"))]) {
    const response = await adapter.proxy(new NextRequest(`http://127.0.0.1${pathname}`));
    assert.equal(response.headers.get("x-middleware-next"), "1", pathname);
    assert.equal(response.status, 200, pathname);
  }
});
await check("production dev page is intercepted for default and localized URLs", async () => {
  for (const pathname of ["/dev/state-panel", "/en/dev/state-panel", "/fr/dev/state-panel", "/dev/state-panel/extra"]) {
    assert(matcherMatches({ config: adapter.config, url: pathname }));
    assertHeaders(await adapter.proxy(new NextRequest(`http://127.0.0.1${pathname}`)));
  }
});
console.log(`Not-found document contracts passed: ${count}. HTTP server status, RSC-to-MPA and visual UI still require runtime verification.`);
