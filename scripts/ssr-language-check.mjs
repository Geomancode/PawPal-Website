#!/usr/bin/env node
// Source-only SSR check. No browser, hydration, redirects, assets, or server startup.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const locales = ["en", "de", "fr", "nl", "zh"];
const MAX_BYTES = 4 * 1024 * 1024;
const TIMEOUT_MS = 15_000;
const requiredKeys = [
  "homeMetadataTitle", "homeMetadataDescription", "homeHeroLineOne",
  "homeHeroLineTwo", "homeHeroDescription", "authMetadataTitle",
  "authMetadataDescription", "authHeroTitle", "authHeroCopy",
  "storeMetadataTitle", "storeMetadataDescription", "storeHeroTitlePrefix",
  "storeHeroTitleHighlight", "storeHeroCopy",
];
const digest = (value) => createHash("sha256").update(value).digest("hex");
export const normalizeText = (value) => value.replace(/\s+/gu, " ").trim();

// This is deliberately not URL normalization: aliases, DNS and extra URL parts fail.
export function validateOrigin(value) {
  if (typeof value !== "string" || !/^http:\/\/127\.0\.0\.1:3\d{3}$/.test(value) || value.trim() !== value) {
    throw new Error("origin must be literal http://127.0.0.1:3000–3999 without any suffix");
  }
  return value;
}

function unwrap(node) {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) {
    node = node.expression;
  }
  return node;
}

export function parseCatalog(source, locale) {
  if (!locales.includes(locale)) throw new Error("unsupported catalog locale");
  const ast = ts.createSourceFile(`${locale}.ts`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (ast.parseDiagnostics.length) throw new Error(`${locale}: catalog parse error`);
  const declarations = ast.statements.filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .filter((item) => ts.isIdentifier(item.name) && item.name.text === `${locale}Messages`);
  if (declarations.length !== 1 || !declarations[0].initializer) {
    throw new Error(`${locale}: exactly one catalog declaration required`);
  }
  const object = unwrap(declarations[0].initializer);
  if (!ts.isObjectLiteralExpression(object)) throw new Error(`${locale}: static catalog object required`);
  const catalog = Object.create(null);
  for (const item of object.properties) {
    if (!ts.isPropertyAssignment(item) || !(ts.isIdentifier(item.name) || ts.isStringLiteral(item.name))) {
      throw new Error(`${locale}: explicit catalog properties required`);
    }
    const key = item.name.text;
    const value = unwrap(item.initializer);
    if (Object.hasOwn(catalog, key) || !(ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))) {
      throw new Error(`${locale}: duplicate key or non-static catalog value`);
    }
    catalog[key] = value.text;
  }
  for (const key of requiredKeys) {
    if (typeof catalog[key] !== "string" || !normalizeText(catalog[key])) {
      throw new Error(`${locale}: required nonempty key missing: ${key}`);
    }
  }
  return catalog;
}

export async function loadCatalogs(root = repositoryRoot) {
  const catalogs = {};
  const hashes = {};
  for (const locale of locales) {
    const bytes = await readFile(join(root, "src", "i18n", "messages", `${locale}.ts`));
    catalogs[locale] = parseCatalog(bytes.toString("utf8"), locale);
    hashes[locale] = digest(bytes);
  }
  return { catalogs, hashes };
}

export function makeCases(catalogs) {
  return locales.flatMap((locale) => ["home", "auth", "store"].map((page) => {
    const m = catalogs[locale];
    const prefix = locale === "en" ? "" : `/${locale}`;
    return {
      id: `${locale}-${page}`,
      path: page === "home" ? prefix || "/" : `${prefix}/${page}`,
      locale,
      page,
      title: page === "home" ? m.homeMetadataTitle : `${m[`${page}MetadataTitle`]} | PawPal`,
      description: m[`${page}MetadataDescription`],
      heading: page === "home" ? `${m.homeHeroLineOne} ${m.homeHeroLineTwo}`
        : page === "auth" ? m.authHeroTitle : `${m.storeHeroTitlePrefix} ${m.storeHeroTitleHighlight}`,
      copy: page === "home" ? m.homeHeroDescription : m[`${page}HeroCopy`],
    };
  }));
}

export function validateReceipt(receipt, { origin, hashes, sourceCommit, now = Date.now() }) {
  validateOrigin(origin);
  if (!receipt || receipt.schemaVersion !== 1 || receipt.purpose !== "web16-ssr-language-isolated") {
    throw new Error("isolation receipt schema/purpose mismatch");
  }
  if (receipt.origin !== origin || validateOrigin(receipt.backendOrigin) === origin) {
    throw new Error("receipt must identify this origin and a distinct loopback mock");
  }
  if (receipt.backendMode !== "loopback-mock-only"
    || receipt.environmentSource !== "synthetic-only-no-workspace-env"
    || receipt.outboundPolicy !== "deny-nonloopback") {
    throw new Error("receipt does not attest required server isolation");
  }
  const created = Date.parse(receipt.createdAt);
  if (!Number.isFinite(created) || typeof receipt.createdAt !== "string"
    || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(receipt.createdAt)
    || created > now || now - created > 2 * 60 * 60 * 1000) {
    throw new Error("receipt must be UTC, not future-dated, and at most two hours old");
  }
  if (!Number.isSafeInteger(receipt.serverPid) || receipt.serverPid <= 1) {
    throw new Error("receipt server PID missing");
  }
  if (!/^[a-f0-9]{40}$/.test(sourceCommit) || receipt.sourceCommit !== sourceCommit) {
    throw new Error("receipt source commit differs from checkout");
  }
  if (!receipt.catalogSha256 || Object.keys(receipt.catalogSha256).sort().join() !== [...locales].sort().join()
    || locales.some((locale) => !/^[a-f0-9]{64}$/.test(hashes[locale]) || receipt.catalogSha256[locale] !== hashes[locale])) {
    throw new Error("receipt catalog hashes differ from local expectations");
  }
  // Receipt fields attest startup controls; they cannot enforce the server's outgoing traffic.
  return true;
}

function entities(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, token) => {
    if (token[0] !== "#") return named[token.toLowerCase()];
    const code = token[1].toLowerCase() === "x" ? parseInt(token.slice(2), 16) : parseInt(token.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : whole;
  });
}

const voidTags = new Set("area base br col embed hr img input link meta param source track wbr".split(" "));
const blockTags = new Set("address article aside blockquote br div footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p section table td th tr ul".split(" "));
const rawTags = new Set(["script", "style", "textarea", "title", "iframe", "noembed", "xmp", "noframes", "noscript"]);
const ignoredTags = new Set(["script", "style", "template", "noscript", "textarea", "svg", "math", "iframe", "noembed", "xmp", "noframes"]);

function parseTag(raw) {
  const match = /^([a-zA-Z][\w:-]*)/.exec(raw);
  if (!match) throw new Error("unrecognized opening tag");
  const tag = match[1].toLowerCase();
  const attrs = Object.create(null);
  let position = match[0].length;
  let selfClosing = false;
  while (position < raw.length) {
    const rest = raw.slice(position);
    const whitespace = /^\s+/.exec(rest);
    if (whitespace) { position += whitespace[0].length; continue; }
    if (rest === "/") { selfClosing = true; break; }
    const attr = /^([^\s=<>/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/.exec(rest);
    if (!attr) throw new Error("unrecognized attribute syntax");
    const key = attr[1].toLowerCase();
    if (Object.hasOwn(attrs, key)) throw new Error("duplicate HTML attribute");
    attrs[key] = entities(attr[2] ?? attr[3] ?? attr[4] ?? "");
    position += attr[0].length;
  }
  return { tag, attrs, selfClosing };
}

// A conservative source tokenizer for React's explicit closing tags, not a DOM or CSS engine.
// No JavaScript is evaluated. Hidden/inert content cannot satisfy copy/metadata checks.
export function parseHtml(html) {
  if (typeof html !== "string" || Buffer.byteLength(html) > MAX_BYTES) throw new Error("HTML size/type limit");
  const output = { htmlLangs: [], titles: [], descriptions: [], mains: [], headings: [] };
  const boundaries = new Set();
  const segments = new Set();
  const gluePairs = [];
  const stack = [];
  let index = 0;
  function append(text) {
    if (!text || stack.at(-1)?.hidden) return;
    for (const frame of stack) {
      if (frame.record) frame.record.text += text;
    }
  }
  while (index < html.length) {
    const rawFrame = stack.at(-1);
    if (rawFrame && rawTags.has(rawFrame.tag)) {
      const endPattern = new RegExp(`</${rawFrame.tag}\\s*>`, "ig");
      endPattern.lastIndex = index;
      const end = endPattern.exec(html);
      if (!end) throw new Error(`unclosed ${rawFrame.tag}`);
      const rawText = html.slice(index, end.index);
      if (rawFrame.tag === "title") append(entities(rawText));
      if (rawFrame.tag === "script") {
        // Recognition only, never execution or reconstruction of React's streaming protocol.
        for (const pair of rawText.matchAll(/\$RC\(\s*["'](B:[\w-]+)["']\s*,\s*["'](S:[\w-]+)["']\s*\)/g)) {
          gluePairs.push([pair[1], pair[2]]);
        }
      }
      stack.pop();
      index = endPattern.lastIndex;
      continue;
    }
    if (html.startsWith("<!--", index)) {
      const end = html.indexOf("-->", index + 4);
      if (end < 0) throw new Error("unclosed HTML comment");
      index = end + 3;
      continue;
    }
    if (html[index] !== "<") {
      const end = html.indexOf("<", index);
      append(entities(html.slice(index, end < 0 ? html.length : end)));
      index = end < 0 ? html.length : end;
      continue;
    }
    let end = index + 1;
    let quote = null;
    for (; end < html.length; end++) {
      if (quote) { if (html[end] === quote) quote = null; }
      else if (html[end] === '"' || html[end] === "'") quote = html[end];
      else if (html[end] === ">") break;
    }
    if (end === html.length) throw new Error("unterminated HTML tag");
    const raw = html.slice(index + 1, end);
    index = end + 1;
    if (/^!doctype\s+html\s*$/i.test(raw)) continue;
    if (raw.startsWith("/")) {
      const close = /^\/([\w:-]+)\s*$/.exec(raw);
      if (!close || stack.at(-1)?.tag !== close[1].toLowerCase()) throw new Error("unbalanced explicit HTML tags");
      if (blockTags.has(stack.at(-1).tag)) append(" ");
      stack.pop();
      continue;
    }
    const { tag, attrs, selfClosing } = parseTag(raw);
    if (tag === "plaintext") throw new Error("plaintext source cannot be safely interpreted as document markup");
    if (tag === "template" && /^B:[\w-]+$/.test(attrs.id ?? "")) boundaries.add(attrs.id);
    if (Object.hasOwn(attrs, "hidden") && /^S:[\w-]+$/.test(attrs.id ?? "")) segments.add(attrs.id);
    if (blockTags.has(tag)) append(" ");
    const hidden = Boolean(stack.at(-1)?.hidden || ignoredTags.has(tag)
      || Object.hasOwn(attrs, "hidden") || Object.hasOwn(attrs, "inert") || attrs["aria-hidden"]?.toLowerCase() === "true"
      || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:!important)?\s*(?:;|$)/i.test(attrs.style ?? ""));
    const frame = { tag, hidden };
    const inHead = stack.some((item) => item.tag === "head");
    const inMain = stack.some((item) => item.tag === "main" && !item.hidden);
    if (!hidden) {
      if (tag === "html") output.htmlLangs.push(attrs.lang ?? null);
      if (tag === "title") {
        frame.record = { text: "", inHead };
        output.titles.push(frame.record);
      }
      if (tag === "meta" && attrs.name?.toLowerCase() === "description") {
        output.descriptions.push({ text: attrs.content ?? "", inHead });
      }
      if (tag === "main") {
        frame.record = { text: "" };
        output.mains.push(frame.record);
      }
      if (tag === "h1") {
        frame.record = { text: "", inMain };
        output.headings.push(frame.record);
      }
    }
    if (!voidTags.has(tag)) {
      // HTML non-void self-closing syntax is only valid for ignored SVG/MathML here.
      if (selfClosing && !hidden) throw new Error("self-closing non-void HTML tag");
      if (!selfClosing) stack.push(frame);
    }
  }
  if (stack.length) throw new Error("unclosed HTML elements");
  for (const group of [output.titles, output.descriptions, output.mains, output.headings]) {
    for (const item of group) item.text = normalizeText(item.text);
  }
  output.streaming = {
    recognizedCompletionPairs: gluePairs.filter(([boundary, segment]) => boundaries.has(boundary) && segments.has(segment)).length,
    reconstructionPerformed: false,
  };
  return output;
}

export function evaluateHtml(html, expected) {
  let actual;
  try { actual = parseHtml(html); }
  catch (error) { return { passed: false, status: "failed", checks: { parse: false }, parseError: error.message }; }
  const checks = {
    parse: true,
    lang: actual.htmlLangs.length === 1 && actual.htmlLangs[0] === expected.locale,
    title: actual.titles.length === 1 && actual.titles[0].inHead && actual.titles[0].text === normalizeText(expected.title),
    description: actual.descriptions.length === 1 && actual.descriptions[0].inHead
      && actual.descriptions[0].text === normalizeText(expected.description),
    main: actual.mains.length === 1,
    heading: actual.headings.length === 1 && actual.headings[0].inMain
      && actual.headings[0].text === normalizeText(expected.heading),
    copy: actual.mains.length === 1 && actual.mains[0].text.includes(normalizeText(expected.copy)),
  };
  const metadataPassed = [checks.lang, checks.title, checks.description].every(Boolean);
  const bodyUnresolved = actual.streaming.recognizedCompletionPairs > 0
    && ![checks.main, checks.heading, checks.copy].every(Boolean);
  if (bodyUnresolved) {
    // $RC moves server-rendered segments; it is not client retranslation/hydration.
    // This checker cannot decide the final main text until that protocol is reconstructed.
    checks.main = null;
    checks.heading = null;
    checks.copy = null;
  }
  const status = !metadataPassed || (!bodyUnresolved && !Object.values(checks).every(Boolean)) ? "failed"
    : bodyUnresolved ? "inconclusive" : "passed";
  return { passed: status === "passed", status, metadataPassed, bodyUnresolved, checks, actual,
    ...(bodyUnresolved ? { bodyReason: "Recognized React server-stream completion; main/copy not assessed without segment reconstruction. This is not evidence of an SSR language failure." } : {}) };
}

export function validateResponse(status, headers) {
  if (status !== 200) throw new Error(`HTTP status ${status}; redirects are never followed`);
  if (!/^text\/html(?:\s*;|$)/i.test(headers["content-type"] ?? "")) throw new Error("response is not HTML");
  if (headers["content-encoding"] && headers["content-encoding"] !== "identity") throw new Error("unexpected compressed response");
  const type = headers["content-type"];
  if (/charset\s*=/i.test(type) && !/charset\s*=\s*["']?utf-8["']?(?:\s*;|\s*$)/i.test(type)) {
    throw new Error("non-UTF-8 HTML response");
  }
}

async function getInitialHtml(origin, path) {
  validateOrigin(origin);
  if (!/^\/(?:|auth|store|(?:de|fr|nl|zh)(?:\/(?:auth|store))?)$/.test(path)) throw new Error("route outside fixed matrix");
  return new Promise((resolveResponse, reject) => {
    let settled = false;
    const timer = setTimeout(() => request.destroy(new Error("total request timeout")), TIMEOUT_MS);
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolveResponse(value);
    };
    const request = http.request({
      hostname: "127.0.0.1", port: Number(new URL(origin).port),
      path, method: "GET", agent: false,
      headers: { Accept: "text/html", "Accept-Encoding": "identity", "User-Agent": "PawPal-SSR-language-check/1" },
    }, (response) => {
      const chunks = [];
      let size = 0;
      // Read the response even on a language/HTTP failure, preserving bounded original bytes.
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) request.destroy(new Error("response exceeded HTML size limit"));
        else chunks.push(chunk);
      });
      response.on("error", (error) => finish(error));
      response.on("end", () => finish(null, { status: response.statusCode, headers: response.headers, bytes: Buffer.concat(chunks) }));
    });
    request.on("socket", (socket) => socket.once("connect", () => {
      if (socket.remoteAddress !== "127.0.0.1") request.destroy(new Error("non-loopback remote endpoint"));
    }));
    request.on("error", (error) => finish(error));
    request.end();
  });
}

function options(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!["--base", "--receipt", "--out"].includes(args[i]) || !args[i + 1] || Object.hasOwn(result, args[i])) {
      throw new Error("usage: node scripts/ssr-language-check.mjs --base ORIGIN --receipt FILE --out NEW_DIRECTORY");
    }
    result[args[i]] = args[i + 1];
  }
  if (Object.keys(result).length !== 3) throw new Error("--base, --receipt and --out are all required");
  return result;
}

export function attachHttpStatus(result, httpStatus) {
  return { ...result, httpStatus };
}

export function summarizeResults(results) {
  const passed = results.length === 15 && results.every((item) => item.passed);
  const status = results.some((item) => item.status === "failed") ? "failed"
    : results.some((item) => item.status === "inconclusive") ? "inconclusive"
      : passed ? "passed" : "failed";
  return { passed, status, exitCode: status === "passed" ? 0 : status === "inconclusive" ? 2 : 1 };
}

async function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    console.log("node scripts/ssr-language-check.mjs --base http://127.0.0.1:PORT --receipt ISOLATION.json --out NEW_DIRECTORY\nOnly ports 3000–3999; fresh isolation receipt required. Performs 15 fixed HTML GETs, no hydration.");
    return;
  }
  const config = options(args);
  const origin = validateOrigin(config["--base"]);
  const receiptBytes = await readFile(resolve(config["--receipt"]));
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  const { catalogs, hashes } = await loadCatalogs();
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim();
  validateReceipt(receipt, { origin, hashes, sourceCommit });
  process.kill(receipt.serverPid, 0); // Liveness only; never starts, signals, or stops the server.
  const output = resolve(config["--out"]);
  await mkdir(output, { recursive: false, mode: 0o700 }); // Refuse reuse/overwrite of an earlier run.
  const startedAt = new Date().toISOString();
  const results = [];
  for (const expected of makeCases(catalogs)) {
    const start = performance.now();
    try {
      const response = await getInitialHtml(origin, expected.path);
      const htmlFile = `${expected.id}.html`;
      await writeFile(join(output, htmlFile), response.bytes, { flag: "wx", mode: 0o600 });
      let result;
      try {
        validateResponse(response.status, response.headers);
        const html = new TextDecoder("utf-8", { fatal: true }).decode(response.bytes);
        result = evaluateHtml(html, expected);
      } catch (error) { result = { passed: false, status: "failed", transportError: error.message }; }
      results.push({ expected, ...attachHttpStatus(result, response.status), htmlFile,
        bytes: response.bytes.length, sha256: digest(response.bytes), elapsedMs: Math.round(performance.now() - start) });
    } catch (error) {
      results.push({ expected, passed: false, status: "failed", transportError: error.message, elapsedMs: Math.round(performance.now() - start) });
    }
  }
  const summary = summarizeResults(results);
  const report = {
    schemaVersion: 1, scope: "initial-html-only", origin, startedAt, endedAt: new Date().toISOString(),
    sourceCommit, catalogSha256: hashes, isolationReceiptSha256: digest(receiptBytes), serverPid: receipt.serverPid,
    ...summary,
    metadataPassedCases: results.filter((item) => item.metadataPassed).length,
    bodyUnresolvedCases: results.filter((item) => item.bodyUnresolved).length,
    results,
    limits: ["No browser JavaScript or hydration executed.", "No computed CSS, screenshot, login or shopping flow tested.",
      "Head metadata and eligible main source text only; hidden/inert/script payloads are excluded.",
      "Recognized React server-stream completion may leave body checks inconclusive; glue is not hydration and no product failure is inferred from that limitation.",
      "Receipt attests server isolation; this process restricts only its own requests.",
      "Source commit/catalog hashes do not independently prove which build the live server is serving."],
  };
  await writeFile(join(output, "results.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(`${report.status}: metadata ${report.metadataPassedCases}/15; full source cases ${results.filter((item) => item.passed).length}/15; unresolved streaming body ${report.bodyUnresolvedCases}; evidence: ${join(output, "results.json")}`);
  process.exitCode = report.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`SSR check refused or failed: ${error.message}`);
    process.exitCode = 1;
  });
}
