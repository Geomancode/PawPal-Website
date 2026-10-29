// Local structure and real React server markup only; no server or network access.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const localeRoot = path.join(root, "src/app/[locale]");
const require = createRequire(import.meta.url);
const publicRecords = new Set(["/post/[id]", "/group/[id]", "/tag/[id]", "/user/[id]"]);
const failures = [];
let checks = 0;
function check(label, fn) {
  checks++;
  try { fn(); console.log(`PASS ${label}`); }
  catch (error) { failures.push(label); console.error(`FAIL ${label}: ${error.message}`); }
}
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? files(p) : [p];
  });
}
const pages = files(localeRoot).filter((p) => path.basename(p) === "page.tsx");
const publicPath = (p) => "/" + path.relative(localeRoot, path.dirname(p)).split(path.sep).filter((part) => part && !/^\([^/]+\)$/.test(part)).join("/");
check("23 unique public page shapes survive physical route grouping", () => {
  assert.equal(pages.length, 23);
  assert.equal(new Set(pages.map(publicPath)).size, 23);
});
check("locale root does not flush a loading fallback before resource existence is known", () => {
  assert(!fs.existsSync(path.join(localeRoot, "loading.tsx")));
});
for (const page of pages) {
  const route = publicPath(page);
  const ancestors = [];
  for (let dir = path.dirname(page); dir.startsWith(localeRoot); dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "loading.tsx"))) ancestors.push(path.relative(localeRoot, dir));
  }
  check(`${route}: intended loading ownership`, () => {
    if (publicRecords.has(route)) assert.deepEqual(ancestors, []);
    else assert(ancestors.includes("(streamed)"), `Missing shared loading boundary: ${ancestors}`);
  });
}
check("all four public resource pages retain their original owning paths", () => {
  for (const route of publicRecords) assert(fs.existsSync(path.join(localeRoot, route, "page.tsx")));
});
check("streamed loading keeps translated accessible StatePanel", () => {
  const source = fs.readFileSync(path.join(localeRoot, "(streamed)/loading.tsx"), "utf8");
  assert(source.includes('<StatePanel state="loading" title={t("pwaLoadingLabel")}'));
  assert(source.includes("{loader}"));
});
check("admin keeps its own loading, dynamic rendering and cookies boundary", () => {
  assert(fs.existsSync(path.join(localeRoot, "(streamed)/admin/reports/loading.tsx")));
  const source = fs.readFileSync(path.join(localeRoot, "(streamed)/admin/reports/page.tsx"), "utf8");
  assert(source.includes('dynamic = "force-dynamic"'));
  assert(source.includes("await cookies()"));
});

function moduleAt(relative, imports = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  const requireModule = (id) => Object.hasOwn(imports, id) ? imports[id] : require(id);
  vm.runInNewContext(code, { exports, require: requireModule }, { filename });
  return exports;
}
const escaped = (text) => renderToStaticMarkup(React.createElement("span", null, text)).slice(6, -7);
for (const locale of ["en", "de", "fr", "nl", "zh"]) check(`${locale}: real shared store hero server-renders one title and existing copy`, () => {
  const { default: StoreHero } = moduleAt("src/app/store/StoreHero.tsx");
  const messages = moduleAt(`src/i18n/messages/${locale}.ts`)[`${locale}Messages`];
  for (const reducedMotion of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(StoreHero, {
      t: (key) => messages[key], shouldReduceMotion: reducedMotion,
    }));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    for (const key of ["storeHeroTitlePrefix", "storeHeroTitleHighlight", "storeHeroCopy"]) assert(html.includes(escaped(messages[key])));
    assert(!/opacity:0|display:none|visibility:hidden/.test(html));
    assert(!html.includes("<script"));
  }
});
check("store suspense uses the same hero and an explicit accessible loading status", () => {
  const filename = path.join(localeRoot, "(streamed)/store/page.tsx");
  const source = fs.readFileSync(filename, "utf8");
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let fallback;
  let heroUses = 0;
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "StoreHero") heroUses++;
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === "Suspense") {
      fallback = node.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText(ast) === "fallback")?.initializer?.getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(heroUses, 2, "One shared hero in normal content and one in the mutually exclusive fallback");
  assert(fallback?.includes("<StoreHero t={t}"));
  assert(fallback.includes('role="status"'));
  assert(fallback.includes('aria-busy="true"'));
  assert(fallback.includes('t("storeLoading")'));
  assert(source.includes('const searchParams = useSearchParams()'));
  assert(source.includes('searchParams.get("intent") === "ai-upgrade"'));
});
// Render actual hero functions with real React + Framer Motion. Only unrelated
// integrations and the translation context are replaced; no animation stub can
// conceal an invisible initial state. CSS/browser visibility remains a runtime gate.
function heroParent(element, headline) {
  if (!React.isValidElement(element)) return null;
  const children = React.Children.toArray(element.props.children);
  if (children.some((child) => React.isValidElement(child) && child.type === headline)) return element;
  return children.map((child) => heroParent(child, headline)).find(Boolean) ?? null;
}
for (const locale of ["en", "de", "fr", "nl", "zh"]) {
  const messages = moduleAt(`src/i18n/messages/${locale}.ts`)[`${locale}Messages`];
  const localizedPath = (route) => (locale === "en" ? "" : `/${locale}`) + route;
  const parts = moduleAt("src/components/HomeClientParts.tsx", {
    "@/components/Globe": { __esModule: true, default: () => null },
    "next/image": { __esModule: true, default: () => null },
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "@/components/icons/PawIcon": { __esModule: true, default: () => null },
    "@/components/ui": { buttonClassName: () => "synthetic-button", Card: "div", CardContent: "div" },
    "@/i18n/I18nProvider": { useI18n: () => ({ t: (key) => messages[key], path: localizedPath }) },
  });
  const page = moduleAt("src/app/[locale]/(streamed)/page.tsx", {
    "@/app/metadata": {},
    "@/i18n/serverMessages": { getServerMessages: async () => ({ locale, messages }) },
    "@/components/HomeClientParts": parts,
    "@/components/ui": { Card: "div" },
  });
  const tree = await page.default({ params: Promise.resolve({ locale }) });
  check(`${locale}: actual home hero ancestor server-renders visible title, copy and both local links`, () => {
    const hero = heroParent(tree, parts.AnimatedHeadline);
    assert(hero, "The real page must keep its headline, description and actions in a common hero");
    const html = renderToStaticMarkup(hero);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    for (const key of ["homeHeroLineOne", "homeHeroLineTwo", "homeHeroDescription", "homeCtaOpenLiveMap", "homeCtaShopSmartTags"]) assert(html.includes(escaped(messages[key])));
    for (const route of ["/globe", "/store"]) assert(html.includes(`href="${localizedPath(route)}"`));
    assert(!/opacity:0(?:[;"}]|$)|display:none|visibility:hidden/.test(html), "Hero cannot require client animation to become visible");
  });
  for (const name of ["HeroDescription", "HeroCTA"]) check(`${locale}: ${name} has a visible server initial state`, () => {
    const html = renderToStaticMarkup(React.createElement(parts[name]));
    assert(!/opacity:0(?:[;"}]|$)|display:none|visibility:hidden/.test(html));
  });
}
console.log(`Streaming boundary contracts: ${checks - failures.length}/${checks} passed. No HTTP status, browser hydration, backend or payment success is claimed.`);
if (failures.length) process.exitCode = 1;
