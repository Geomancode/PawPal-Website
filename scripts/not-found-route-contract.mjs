// Pure module contracts: no server, browser, request, credentials or new dependency.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const cache = new Map();
function moduleAt(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  const result = {};
  cache.set(filename, result);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  function localRequire(id) {
    if (id === "@sentry/nextjs") return { withSentryConfig: (config) => config };
    assert(id.startsWith("."), `Unexpected import: ${id}`);
    const base = path.resolve(path.dirname(filename), id);
    const resolved = [base, `${base}.ts`, `${base}.json`].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    assert(resolved, `Unresolved import: ${id}`);
    return moduleAt(path.relative(root, resolved));
  }
  vm.runInNewContext(code, { exports: result, require: localRequire, process: { env: { CI: "true" } } }, { filename });
  return result;
}
let count = 0;
function check(label, fn) { fn(); count++; console.log(`PASS ${label}`); }
const plain = (value) => JSON.parse(JSON.stringify(value));
const { classifyPageRequest: classify } = moduleAt("src/lib/pageRequestPolicy.ts");
const { sitePageRoutes, developmentOnlyPageRoutes } = moduleAt("src/lib/siteRouteRegistry.ts");
const files = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const p = path.join(directory, entry.name);
  return entry.isDirectory() ? files(p) : [p];
});
const localeRoot = path.join(root, "src/app/[locale]");
const actualPages = files(localeRoot).filter((p) => /\/page\.[jt]sx?$/.test(p)).map((p) => {
  const rel = path.relative(localeRoot, path.dirname(p));
  return rel ? `/${rel.replaceAll("[id]", ":id")}` : "/";
}).sort();
check("shared registry exactly matches all 22 real page shapes", () => {
  assert.equal(actualPages.length, 22);
  assert.equal(new Set(sitePageRoutes).size, sitePageRoutes.length);
  assert.deepEqual(Array.from(sitePageRoutes).sort(), actualPages);
});
const rewrites = await moduleAt("next.config.ts").default.rewrites();
check("same registry supplies exact existing default rewrites", () => {
  assert.deepEqual(plain(rewrites.beforeFiles), Array.from(sitePageRoutes, (source) => ({ source, destination: source === "/" ? "/en" : `/en${source}` })));
  assert.equal(rewrites.afterFiles.length + rewrites.fallback.length, 0);
});
const assets = moduleAt("src/lib/publicAssetPaths.json");
const actualAssets = files(path.join(root, "public")).map((p) => `/${path.relative(path.join(root, "public"), p)}`).sort();
check("public resource manifest exactly matches files including well-known", () => {
  assert.equal(new Set(assets).size, assets.length);
  assert.deepEqual(assets, actualAssets);
  assert(assets.includes("/.well-known/apple-app-site-association"));
  assert(assets.includes("/pawpal-not-found.css"));
});
for (const asset of assets) check(`exact asset passes: ${asset}`, () => assert.deepEqual(plain(classify(asset)), { kind: "pass", reason: "asset" }));
for (const prefix of ["", "/en", "/de", "/fr", "/nl", "/zh"]) {
  for (const shape of sitePageRoutes) {
    const pathname = `${prefix}${shape === "/" ? "" : shape.replace(":id", "synthetic-id")}` || "/";
    check(`${pathname}: registered page or production-closed dev`, () => {
      assert.equal(classify(pathname).kind, developmentOnlyPageRoutes.includes(shape) ? "not-found" : "pass");
      assert.equal(classify(pathname, true).kind, "pass");
    });
  }
  const locale = prefix.slice(1) || "en";
  for (const suffix of ["/no-such-page", "/store/no-such-page", "/admin/no-such-page", "/missing.png", "/post/id/extra", "/dev/state-panel/extra"]) {
    check(`${prefix}${suffix}: unknown path retains language`, () => assert.deepEqual(plain(classify(prefix + suffix)), { kind: "not-found", locale }));
  }
  check(`${prefix}/auth/: one trailing slash is equivalent`, () => assert.equal(classify(`${prefix}/auth/`).kind, "pass"));
}
for (const pathname of ["/api", "/api/no-such-handler", "/api/posts", "/_next", "/_next/static/absent.js", "/_next/image"]) {
  check(`${pathname}: API/framework left to its owning router`, () => assert.equal(classify(pathname).kind, "pass"));
}
for (const pathname of ["/apiary", "/_nextish", "/fr/api/no-such-handler", "/fr/_next/static/absent.js", "/xx", "/xx/auth", "/FR/auth", "/enough", "/fr/robots.txt", "/assets/unknown.svg", "/unknown.js", "/en/en/auth"]) {
  check(`${pathname}: no broad resource or locale bypass`, () => assert.equal(classify(pathname).kind, "not-found"));
}
for (const pathname of ["/robots.txt", "/sitemap.xml"]) check(`${pathname}: exact metadata route preserved`, () => assert.deepEqual(plain(classify(pathname)), { kind: "pass", reason: "metadata" }));
for (const id of ["a.b", "a%20b", "%E7%8C%AB", "caf%C3%A9", "a%2Eb", "%252F", "a%3Fb%23c"]) {
  check(`encoded/dotted single ID ${id} is not classified as a resource`, () => assert.deepEqual(plain(classify(`/fr/post/${id}`)), { kind: "pass", reason: "page" }));
}
for (const pathname of ["/post/", "/post//id", "/post/%2F", "/post/a%2fb", "/post/%5C", "/post/%00", "/post/%7f", "/post/%", "/post/%GG", "/post/%E0%A4", "/post/.", "/post/..", "/post/%2e", "/post/%2e%2e", "//auth", "/auth//", "/auth?x=1", "/auth#hash", "https://outside.invalid/auth", "/fr/%61uth", "/%66r/auth"]) {
  check(`${pathname}: malformed/structurally ambiguous path rejected`, () => assert.equal(classify(pathname).kind, "not-found"));
}
check("query and hash do not influence pathname classification", () => {
  const url = new URL("http://127.0.0.1/fr/unknown?next=https://outside.invalid/#%3Cscript%3E");
  assert.deepEqual(plain(classify(url.pathname)), { kind: "not-found", locale: "fr" });
});
check("existing valid admin pages remain permission-owned", () => {
  for (const route of ["/admin/reports", "/admin/park-risks", "/store/admin"]) assert.equal(classify(route).kind, "pass");
  const reports = fs.readFileSync(path.join(localeRoot, "admin/reports/page.tsx"), "utf8");
  assert(reports.includes('dynamic = "force-dynamic"'));
  assert(reports.includes("await cookies()"));
});
check("registry and document contracts stay mandatory in package and CI", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.scripts["test:not-found-contract"], "node scripts/not-found-route-contract.mjs && node scripts/not-found-document-contract.mjs");
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/quality-gate.yml"), "utf8");
  assert(workflow.includes("- name: Unknown-page status and registry drift contract gates\n        run: npm run test:not-found-contract"));
});
console.log(`Not-found route contracts passed: ${count}. No HTTP status, UI or real record lookup is claimed.`);
