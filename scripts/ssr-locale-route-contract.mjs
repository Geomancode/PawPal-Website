// Local module contracts only: no browser, server, request or external dependency.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const { resolveTitle } = createRequire(import.meta.url)("next/dist/lib/metadata/resolvers/resolve-title.js");
const root = path.resolve(import.meta.dirname, "..");
const cache = new Map();
const notFound = Symbol("NEXT_NOT_FOUND");
function moduleAt(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const result = {};
  cache.set(filename, result);
  function requireModule(id) {
    if (id === "server-only") return {};
    if (id === "next/navigation") return { notFound() { throw notFound; } };
    if (id === "@sentry/nextjs/config") return { withSentryConfig: (config) => config };
    if (id === "next/font/google") return { Nunito_Sans: () => ({ variable: "synthetic-font" }) };
    if (id === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (id.endsWith(".css")) return {};
    if (id.startsWith("@/components/") || id === "@/i18n/I18nProvider") return { default: id, I18nProvider: id, LocalizedSkipLink: id };
    const resolved = id.startsWith("@/") ? path.join(root, "src", id.slice(2)) : path.resolve(path.dirname(filename), id);
    for (const suffix of ["", ".ts", ".tsx", "/index.ts"]) {
      const candidate = resolved + suffix;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return moduleAt(path.relative(root, candidate));
    }
    throw new Error(`Unexpected module import: ${id}`);
  }
  vm.runInNewContext(code, { exports: result, require: requireModule, URL, process: { env: { CI: "true" } } }, { filename });
  return result;
}
let checked = 0;
function check(label, fn) { fn(); checked++; console.log(`PASS ${label}`); }
const config = moduleAt("next.config.ts").default;
const rewrites = await config.rewrites();
const expected = ["/", "/about", "/admin/park-risks", "/admin/reports", "/auth", "/companion", "/dev/state-panel", "/globe", "/group/:id", "/guidelines", "/help", "/pet/:id", "/post/:id", "/privacy", "/profile", "/store", "/store/admin", "/store/checkout", "/store/orders", "/store/success", "/tag/:id", "/terms", "/user/:id"].sort();
check("exact 23 default UI routes only", () => assert.deepEqual(Array.from(rewrites.beforeFiles, (r) => r.source).sort(), expected));
check("all rewrites retain English internal segment exactly once", () => assert(rewrites.beforeFiles.every((r) => r.destination === (r.source === "/" ? "/en" : `/en${r.source}`))));
check("no afterFiles or wildcard fallback", () => assert.equal(rewrites.afterFiles.length + rewrites.fallback.length, 0));
check("no prefix stripping or API/static/dev-subtree wildcard", () => assert(rewrites.beforeFiles.every((r) => !r.source.includes("*") && !r.source.startsWith("/:locale") && !r.source.startsWith("/api") && !r.source.startsWith("/_next"))));
const redirect = await config.redirects();
check("internal English aliases canonicalize to existing URLs", () => assert.deepEqual(JSON.parse(JSON.stringify(redirect)), [{ source: "/en", destination: "/", permanent: true }, { source: "/en/:path+", destination: "/:path+", permanent: true }]));
const server = moduleAt("src/i18n/serverMessages.ts");
const layout = moduleAt("src/app/[locale]/layout.tsx");
const companion = moduleAt("src/app/[locale]/(streamed)/companion/layout.tsx");
const targets = { home: moduleAt("src/app/[locale]/(streamed)/page.tsx"), auth: moduleAt("src/app/[locale]/(streamed)/auth/layout.tsx"), store: moduleAt("src/app/[locale]/(streamed)/store/layout.tsx") };
check("root statically enumerates exactly five languages", () => assert.deepEqual(Array.from(layout.generateStaticParams(), (r) => r.locale).sort(), ["de", "en", "fr", "nl", "zh"]));
for (const locale of ["en", "de", "fr", "nl", "zh"]) {
  const { messages } = await server.getServerMessages(locale);
  const props = { params: Promise.resolve({ locale }), children: "synthetic-child" };
  const doc = await layout.default(props);
  check(`${locale}: root html language and font preserved`, () => { assert.equal(doc.type, "html"); assert.equal(doc.props.lang, locale); assert.equal(doc.props.className, "synthetic-font"); });
  const companionMetadata = await companion.generateMetadata(props);
  check(`${locale}/companion: private localized metadata is present on first render`, () => {
    assert.equal(companionMetadata.title, messages.companionTitle);
    assert.equal(companionMetadata.description, messages.companionIntro);
    assert.equal(companionMetadata.alternates.canonical, `${locale === "en" ? "" : `/${locale}`}/companion`);
    assert.equal(companionMetadata.robots.index, false);
    assert.equal(companionMetadata.robots.follow, false);
  });
  const rootMetadata = await layout.generateMetadata(props);
  check(`${locale}: root server metadata uses same catalog`, () => { assert.equal(rootMetadata.title.default, messages.siteTitle); assert.equal(rootMetadata.description, messages.siteDescription); });
  for (const [name, page] of Object.entries(targets)) {
    const metadata = await page.generateMetadata(props);
    check(`${locale}/${name}: Next title resolution and public social titles avoid duplicate branding`, () => {
      const expectedTitle = name === "home" ? messages.homeMetadataTitle : `${messages[`${name}MetadataTitle`]} | PawPal`;
      assert.equal(resolveTitle(metadata.title, rootMetadata.title.template).absolute, expectedTitle);
      if (name !== "auth") {
        assert.equal(metadata.openGraph.title, expectedTitle);
        assert.equal(metadata.twitter.title, expectedTitle);
      }
    });
    check(`${locale}/${name}: exact server title and description`, () => {
      if (name === "home") assert.equal(metadata.title.absolute, messages.homeMetadataTitle);
      else assert.equal(metadata.title, messages[`${name}MetadataTitle`]);
      assert.equal(metadata.description, messages[`${name}MetadataDescription`]);
    });
    check(`${locale}/${name}: public canonical has exactly one locale`, () => assert.equal(metadata.alternates.canonical, (locale === "en" ? "" : `/${locale}`) + (name === "home" ? (locale === "en" ? "/" : "") : `/${name}`)));
    if (name === "auth") check(`${locale}/auth: private robots preserved`, () => { assert.equal(metadata.robots.index, false); assert.equal(metadata.robots.follow, false); });
  }
}
for (const value of ["", "xx", "EN", "en/../fr", "__proto__"]) {
  let rejected = false;
  try { await server.getServerMessages(value); } catch (error) { rejected = error === notFound; }
  check(`unsupported locale ${JSON.stringify(value)} rejected`, () => assert(rejected));
}
check("server-only dictionaries never collected in client shared barrel", () => {
  const s = fs.readFileSync(path.join(root, "src/i18n/messages/index.ts"), "utf8");
  for (const locale of ["de", "fr", "nl", "zh"]) assert(!s.includes(`./${locale}`));
  assert(fs.readFileSync(path.join(root, "src/i18n/serverMessages.ts"), "utf8").startsWith('import "server-only";'));
});
check("admin dynamic and cookie access retained", () => {
  const s = fs.readFileSync(path.join(root, "src/app/[locale]/(streamed)/admin/reports/page.tsx"), "utf8");
  assert(s.includes('export const dynamic = "force-dynamic"'));
  assert(s.includes("await cookies()"));
  assert(!fs.readFileSync(path.join(root, "src/app/[locale]/layout.tsx"), "utf8").includes("force-static"));
});
console.log(`Locale route contract passed: ${checked} checks. These module contracts do not prove HTTP routing or React streaming.`);
