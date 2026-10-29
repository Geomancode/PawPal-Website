import assert from "node:assert/strict";
import test from "node:test";
import {
  attachHttpStatus, summarizeResults, evaluateHtml, loadCatalogs, makeCases, parseCatalog, parseHtml,
  validateOrigin, validateReceipt, validateResponse,
} from "./ssr-language-check.mjs";

// Pure source/contract fixtures only. No listeners, servers, HTTP requests or subprocesses.
const { catalogs, hashes } = await loadCatalogs();
const cases = makeCases(catalogs);
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function document(expected, { body, lang = expected.locale, head } = {}) {
  return `<!DOCTYPE html><html lang="${lang}"><head>${head ?? `<title>${escape(expected.title)}</title><meta name="description" content="${escape(expected.description)}">`}</head><body><main>${body ?? `<h1>${escape(expected.heading)}</h1><p>${escape(expected.copy)}</p>`}</main></body></html>`;
}

test("fixed matrix preserves three default English routes and all four locale prefixes", () => {
  assert.equal(cases.length, 15);
  assert.deepEqual(cases.slice(0, 3).map((item) => item.path), ["/", "/auth", "/store"]);
  assert.equal(new Set(cases.map((item) => item.path)).size, 15);
  for (const locale of ["de", "fr", "nl", "zh"]) {
    assert.deepEqual(cases.filter((item) => item.locale === locale).map((item) => item.path),
      [`/${locale}`, `/${locale}/auth`, `/${locale}/store`]);
  }
});

for (const expected of cases) {
  test(`eligible server HTML matches exact ${expected.id} catalog contract`, () => {
    assert.equal(evaluateHtml(document(expected), expected).passed, true);
  });
}

test("English HTML for non-English URL fails language, metadata, heading and copy", () => {
  const expected = cases.find((item) => item.id === "fr-auth");
  const result = evaluateHtml(document(cases.find((item) => item.id === "en-auth")), expected);
  for (const key of ["lang", "title", "description", "heading", "copy"]) assert.equal(result.checks[key], false, key);
});

test("changing html lang alone cannot fix English SSR content", () => {
  const expected = cases.find((item) => item.id === "de-home");
  const result = evaluateHtml(document(cases[0], { lang: "de" }), expected);
  assert.equal(result.checks.lang, true);
  assert.equal(result.checks.heading, false);
  assert.equal(result.checks.copy, false);
  assert.equal(result.passed, false);
});

for (const wrapper of [
  (text) => `<script>self.__next_f.push(${JSON.stringify(text)})</script>`,
  (text) => `<!-- ${text} -->`,
  (text) => `<template>${text}</template>`,
  (text) => `<noscript>${text}</noscript>`,
  (text) => `<div hidden>${text}</div>`,
  (text) => `<div inert>${text}</div>`,
  (text) => `<div aria-hidden="true">${text}</div>`,
  (text) => `<div style="display: none !important">${text}</div>`,
  (text) => `<div style="visibility:hidden">${text}</div>`,
]) {
  test(`inert/hidden/script translations cannot substitute for SSR copy: ${wrapper("sample").slice(0, 45)}`, () => {
    const expected = cases.find((item) => item.id === "nl-store");
    const hidden = `<h1>${escape(expected.heading)}</h1><p>${escape(expected.copy)}</p>`;
    const result = evaluateHtml(document(expected, { body: `<p>Loading</p>${wrapper(hidden)}` }), expected);
    assert.equal(result.checks.heading, false);
    assert.equal(result.checks.copy, false);
    assert.equal(result.passed, false);
  });
}

test("loading fallback plus translated RSC payload still fails the store content requirement", () => {
  const expected = cases.find((item) => item.id === "en-store");
  const body = `<p>${catalogs.en.storeLoading}</p><script>${JSON.stringify({ h1: expected.heading, copy: expected.copy })}</script>`;
  assert.equal(evaluateHtml(document(expected, { body }), expected).passed, false);
});

test("recognized React server-stream completion leaves body unassessed, not failed or falsely passed", () => {
  const expected = cases.find((item) => item.id === "fr-store");
  const body = `<!--$?--><template id="B:0"></template><p>Loading</p><!--/$--><div hidden id="S:0"><h1>${escape(expected.heading)}</h1><p>${escape(expected.copy)}</p></div><script>$RC("B:0","S:0")</script>`;
  const result = evaluateHtml(document(expected, { body }), expected);
  assert.equal(result.checks.title, true);
  assert.equal(result.checks.heading, null);
  assert.equal(result.checks.copy, null);
  assert.equal(result.metadataPassed, true);
  assert.equal(result.status, "inconclusive");
  assert.equal(result.passed, false);
  assert.equal(result.actual.streaming.reconstructionPerformed, false);
});

test("streaming body uncertainty cannot excuse wrong document language or metadata", () => {
  const expected = cases.find((item) => item.id === "fr-store");
  const body = '<template id="B:0"></template><div hidden id="S:0">Content</div><script>$RC("B:0","S:0")</script>';
  const result = evaluateHtml(document(expected, { lang: "en", body }), expected);
  assert.equal(result.bodyUnresolved, true);
  assert.equal(result.checks.lang, false);
  assert.equal(result.status, "failed");
});

for (const tag of ["iframe", "noembed", "xmp", "noframes"]) {
  test(`${tag} raw text cannot masquerade as document heading/copy`, () => {
    const expected = cases[0];
    const body = `<${tag}><h1>${escape(expected.heading)}</h1><p>${escape(expected.copy)}</p></${tag}>`;
    const result = evaluateHtml(document(expected, { body }), expected);
    assert.equal(result.checks.heading, false);
    assert.equal(result.checks.copy, false);
  });
}

test("server-completed Suspense comments around eligible markup do not hide valid SSR copy", () => {
  const expected = cases.find((item) => item.id === "zh-store");
  const body = `<!--$--><h1>${escape(expected.heading)}</h1><p>${escape(expected.copy)}</p><!--/$-->`;
  assert.equal(evaluateHtml(document(expected, { body }), expected).passed, true);
});

test("metadata inside script or outside head cannot stand in for actual head metadata", () => {
  const expected = cases[0];
  const metadata = `<title>${escape(expected.title)}</title><meta name="description" content="${escape(expected.description)}">`;
  const scriptOnly = evaluateHtml(document(expected, { head: `<script>${JSON.stringify(metadata)}</script>` }), expected);
  assert.equal(scriptOnly.checks.title, false);
  assert.equal(scriptOnly.checks.description, false);
  const outside = evaluateHtml(document(expected, { head: "", body: `${metadata}<h1>${expected.heading}</h1><p>${expected.copy}</p>` }), expected);
  assert.equal(outside.checks.title, false);
  assert.equal(outside.checks.description, false);
});

test("duplicate head metadata, duplicate h1, duplicate main and duplicate html all fail", () => {
  const expected = cases[0];
  for (const [from, to] of [
    ["</title>", `</title><title>${escape(expected.title)}</title>`],
    ["</head>", `<meta name="description" content="${escape(expected.description)}"></head>`],
    ["</h1>", `</h1><h1>${escape(expected.heading)}</h1>`],
    ["</main>", "</main><main></main>"],
    ["</body>", '</body><html lang="en"></html>'],
  ]) assert.equal(evaluateHtml(document(expected).replace(from, to), expected).passed, false);
});

test("tokenizer handles quoted >, case, entities and inline spans without evaluating code", () => {
  const expected = { locale: "en", title: "A & B", description: 'quoted " > value', heading: "One two", copy: "Café & 茶" };
  const html = '<!DOCTYPE html><HTML LANG="en"><HEAD><TITLE>A &amp; B</TITLE><META NAME="description" CONTENT="quoted &quot; > value"></HEAD><BODY><MAIN><h1><span>One</span> <span>two</span></h1><p>Caf&#233; &amp; &#x8336;</p><svg><title>Icon title</title><path d="M0 0"/></svg></MAIN></BODY></HTML>';
  assert.equal(evaluateHtml(html, expected).passed, true);
});

test("responsive CSS class is source content; checker never claims computed visibility", () => {
  const expected = cases[1];
  const body = `<aside class="hidden lg:block"><h1>${escape(expected.heading)}</h1><p>${escape(expected.copy)}</p></aside>`;
  assert.equal(evaluateHtml(document(expected, { body }), expected).passed, true);
});

test("truncated, malformed and duplicate attributes fail closed", () => {
  for (const html of ['<html lang="en"><head>', '<html lang="en" lang="fr"></html>', '<html><main></html>', '<html><!-- unfinished', '<html><plaintext><main></main></plaintext></html>']) {
    assert.throws(() => parseHtml(html));
    assert.equal(evaluateHtml(html, cases[0]).passed, false);
  }
});

test("script raw text with HTML-looking tags never contributes headings", () => {
  const expected = cases[0];
  const html = document(expected).replace("</main>", '<script>const x = "<h1>Extra</h1>"; if (1 > 0) {}</script></main>');
  assert.equal(evaluateHtml(html, expected).passed, true);
});

test("only canonical literal loopback test ports are accepted", () => {
  assert.equal(validateOrigin("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  assert.equal(validateOrigin("http://127.0.0.1:3999"), "http://127.0.0.1:3999");
  for (const value of ["https://127.0.0.1:3000", "http://localhost:3000", "http://127.1:3000", "http://2130706433:3000",
    "http://[::1]:3000", "http://127.0.0.1:54321", "http://127.0.0.1:18100", "http://192.168.1.101:3000",
    "http://example.com:3000", "http://user:pass@127.0.0.1:3000", "http://127.0.0.1:3000/", "http://127.0.0.1:3000?x=1",
    "http://127.0.0.1:3000#x", "http://127.0.0.1:3000\n", "http://127.0.0.1:03000", undefined]) assert.throws(() => validateOrigin(value));
});

const now = Date.parse("2026-10-13T20:00:00.000Z");
const context = { origin: "http://127.0.0.1:3100", hashes, sourceCommit: "bff10523fd1d16c5f08c445f4523cda4aef5b635", now };
const receipt = {
  schemaVersion: 1, purpose: "web16-ssr-language-isolated", origin: context.origin,
  backendOrigin: "http://127.0.0.1:3101", backendMode: "loopback-mock-only",
  environmentSource: "synthetic-only-no-workspace-env", outboundPolicy: "deny-nonloopback",
  serverPid: 12345, createdAt: "2026-10-13T19:59:00.000Z", sourceCommit: context.sourceCommit, catalogSha256: hashes,
};

test("fresh matching isolation receipt passes pure validation; no PID or network is touched", () => {
  assert.equal(validateReceipt(receipt, context), true);
});

test("missing, stale, future, foreign, unisolated and stale-catalog receipts refuse before connection", () => {
  for (const changed of [
    { schemaVersion: 2 }, { purpose: "other" }, { origin: "http://127.0.0.1:3102" },
    { backendOrigin: context.origin }, { backendOrigin: "http://192.168.1.101:54321" },
    { backendMode: "real" }, { environmentSource: "workspace-env" }, { outboundPolicy: "allow" },
    { createdAt: "2026-10-13T17:00:00.000Z" }, { createdAt: "2026-10-13T20:00:01.000Z" },
    { createdAt: "not-a-date" }, { serverPid: 0 }, { sourceCommit: "0".repeat(40) },
    { catalogSha256: { ...hashes, fr: "0".repeat(64) } }, { catalogSha256: {} },
  ]) assert.throws(() => validateReceipt({ ...receipt, ...changed }, context));
  assert.throws(() => validateReceipt(null, context));
});

test("redirects, non-HTML, compression and incompatible charset cannot pass as language success", () => {
  assert.doesNotThrow(() => validateResponse(200, { "content-type": "text/html; charset=utf-8" }));
  for (const status of [301, 302, 307, 308, 401, 404, 500]) {
    assert.throws(() => validateResponse(status, { "content-type": "text/html", location: "https://example.com" }));
  }
  assert.throws(() => validateResponse(200, { "content-type": "application/json" }));
  assert.throws(() => validateResponse(200, { "content-type": "text/html; charset=iso-8859-1" }));
  assert.throws(() => validateResponse(200, { "content-type": "text/html", "content-encoding": "gzip" }));
});

test("catalog AST reader rejects dynamic expressions, duplicate keys, spread and missing keys", () => {
  for (const source of ['export const enMessages = getMessages();', 'export const enMessages = { a: "a", a: "b" };',
    'export const enMessages = { ...other };', 'export const enMessages = { homeMetadataTitle: process.env.TITLE };',
    'export const enMessages = {};']) assert.throws(() => parseCatalog(source, "en"));
});


test("HTTP 200 cannot overwrite failed metadata or produce a successful exit", () => {
  const expected = cases.find((item) => item.id === "de-auth");
  const wrong = evaluateHtml(document(cases.find((item) => item.id === "en-auth")), expected);
  const recorded = attachHttpStatus(wrong, 200);
  assert.equal(recorded.status, "failed");
  assert.equal(recorded.httpStatus, 200);
  assert.deepEqual(summarizeResults(Array.from({ length: 15 }, () => recorded)),
    { passed: false, status: "failed", exitCode: 1 });
});

test("HTTP 200 preserves recognized streaming inconclusive and exit two", () => {
  const expected = cases[0];
  const body = '<!--$?--><template id="B:0"></template><p>Loading</p><!--/$-->'
    + '<div hidden id="S:0"><h1>' + expected.heading + '</h1><p>' + expected.copy + '</p></div>'
    + '<script>$RC("B:0","S:0")</script>';
  const recorded = attachHttpStatus(evaluateHtml(document(expected, { body }), expected), 200);
  assert.equal(recorded.status, "inconclusive");
  assert.equal(recorded.httpStatus, 200);
  assert.deepEqual(summarizeResults(Array.from({ length: 15 }, () => recorded)),
    { passed: false, status: "inconclusive", exitCode: 2 });
});

test("only fifteen passing cases produce exit zero; incomplete set fails", () => {
  const records = cases.map((expected) => attachHttpStatus(evaluateHtml(document(expected), expected), 200));
  assert.deepEqual(summarizeResults(records), { passed: true, status: "passed", exitCode: 0 });
  assert.deepEqual(summarizeResults(records.slice(1)), { passed: false, status: "failed", exitCode: 1 });
});
