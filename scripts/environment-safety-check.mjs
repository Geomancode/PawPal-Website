// Controlled production-module/installed-SDK checks. No HTTP server or external request.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  if (!["--source", "--overlay", "--group"].includes(process.argv[i]) || !process.argv[i + 1]) throw new Error("Invalid probe argument");
  options.set(process.argv[i], process.argv[i + 1]);
}
const source = path.resolve(options.get("--source") ?? path.join(import.meta.dirname, ".."));
const overlay = options.has("--overlay") ? path.resolve(options.get("--overlay")) : null;
const group = options.get("--group") ?? "all";
assert(["all", "config", "reporting", "health", "ci"].includes(group), "Unknown group");
const nativeRequire = createRequire(path.join(source, "package.json"));
const ts = nativeRequire("typescript");
const sdk = nativeRequire("@supabase/supabase-js");
const inputs = new Map();
const cases = [];
const unexpected = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { unexpected.push("unintercepted-global-fetch"); throw new Error("External transport is disabled"); };
const deadline = setTimeout(() => {
  console.error(JSON.stringify({ passed: false, reason: "probe deadline exceeded" }));
  process.exit(2);
}, 45000);
const quiet = { log() {}, warn() {}, error() {}, debug() {} };
function sourceFile(rel) {
  const candidate = overlay && path.join(overlay, rel);
  const filename = candidate && fs.existsSync(candidate) ? candidate : path.join(source, rel);
  const text = fs.readFileSync(filename, "utf8");
  inputs.set(rel, createHash("sha256").update(text).digest("hex"));
  return { filename, text };
}
function test(name, fn) {
  return Promise.resolve().then(fn).then(() => cases.push({ name, passed: true }), (error) => {
    // Assertions can contain the synthetic canaries. Do not print their messages/values.
    cases.push({ name, passed: false, errorType: error?.name ?? "UnknownError" });
  });
}
function framework() {
  const states = [], effects = [], cleanups = [];
  let cursor = 0;
  const hooks = {
    createContext: () => ({ Provider: "provider" }), useContext: () => null,
    useState(value) { const i = cursor++; if (!(i in states)) states[i] = typeof value === "function" ? value() : value; return [states[i], next => { states[i] = next; }]; },
    useEffect(effect) { effects.push(effect); },
    useRef(value) { return { current: value }; },
  };
  return { hooks, states, render(fn, props) { cursor = 0; return fn(props); },
    async mount() { for (const effect of effects.splice(0)) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } await new Promise(resolve => setImmediate(resolve)); },
    dispose() { for (const cleanup of cleanups.splice(0)) cleanup(); },
  };
}
function runtime(env = {}, transport = async () => { throw new Error("No request expected"); }, sentry = () => {}) {
  const cache = new Map(), clients = [], creations = [], requests = [], logs = [], timers = new Set();
  const activeRequests = new Set();
  const react = framework();
  let closeCalled = false;
  const sdkAdapter = { ...sdk, createClient(url, key, supplied = {}) {
    creations.push({ url, key, options: supplied });
    const client = sdk.createClient(url, key, { ...supplied,
      global: { ...supplied.global, fetch: async (input, init = {}) => {
        const request = new Request(input, init);
        requests.push({ url: request.url, method: request.method, headers: request.headers });
        // Retain the Request and its internal abort controller until fetch settles.
        activeRequests.add(request);
        try {
          return await transport(request);
        } finally {
          activeRequests.delete(request);
        }
      } },
    });
    clients.push(client); return client;
  } };
  const timerSet = (callback, delay, ...args) => {
    const handle = setTimeout(() => { timers.delete(handle); callback(...args); }, delay);
    timers.add(handle); return handle;
  };
  const timerClear = handle => { timers.delete(handle); clearTimeout(handle); };
  function load(rel, append = "") {
    if (cache.has(rel)) return cache.get(rel);
    const { filename, text } = sourceFile(rel);
    const mod = { exports: {} }; cache.set(rel, mod.exports);
    const js = ts.transpileModule(text + append, { fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const require = name => {
      if (name === "@supabase/supabase-js") return sdkAdapter;
      if (name === "@sentry/nextjs") return { captureException: sentry };
      if (name === "react") return react.hooks;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/image") return { default: "image" };
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name.startsWith("@/lib/")) return load("src/lib/" + name.slice(6) + ".ts");
      if (name === "@/i18n/locales") return load("src/i18n/locales.ts");
      if (name === "./types" && rel === "src/app/admin/reports/server.ts") return load("src/app/admin/reports/types.ts");
      throw new Error("Unexpected module dependency");
    };
    vm.runInNewContext(js, { module: mod, exports: mod.exports, require, process: { env },
      URL, Headers, Request, Response, AbortController, AbortSignal, DOMException, Error, Date, Map,
      setTimeout: timerSet, clearTimeout: timerClear, queueMicrotask,
      console: { ...quiet, error: (...items) => logs.push(items) },
      document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
    }, { filename });
    cache.set(rel, mod.exports); return mod.exports;
  }
  return { load, env, creations, requests, logs, react, timers,
    async close() {
      if (closeCalled) return;
      closeCalled = true; react.dispose();
      for (const client of clients) await client.auth.stopAutoRefresh();
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      assert.equal(activeRequests.size, 0, "Synthetic fetch still in flight at close");
    },
  };
}
const publicConfig = () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://n16-synthetic.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-public-key" });
const configCases = [
  ["missing", {}], ["blank", { NEXT_PUBLIC_SUPABASE_URL: "  ", NEXT_PUBLIC_SUPABASE_ANON_KEY: " \t" }],
  ["URL-only", { NEXT_PUBLIC_SUPABASE_URL: publicConfig().NEXT_PUBLIC_SUPABASE_URL }],
  ["key-only", { NEXT_PUBLIC_SUPABASE_ANON_KEY: publicConfig().NEXT_PUBLIC_SUPABASE_ANON_KEY }],
  ["invalid-URL", { ...publicConfig(), NEXT_PUBLIC_SUPABASE_URL: "not a URL" }],
];
function isConfigurationError(error) { return error?.name === "SupabaseConfigurationError" && error?.code === "supabase_configuration_unavailable"; }
async function configTests() {
  for (const [name, config] of configCases) {
    await test(`config/${name}: import safe, browser/server/scoped reject before SDK`, async () => {
      const r = runtime(config);
      try {
        const browser = r.load("src/lib/supabase.ts"), server = r.load("src/lib/supabaseServer.ts");
        assert.equal(r.creations.length, 0);
        assert.throws(() => browser.supabase.from("places"), isConfigurationError);
        assert.throws(() => server.supabaseServer.from("places"), isConfigurationError);
        assert.throws(() => server.createUserScopedSupabaseClient("synthetic-verified-token"), isConfigurationError);
        assert.equal(r.creations.length, 0); assert.equal(r.requests.length, 0);
      } finally { await r.close(); }
    });
  }
  for (const [name, config] of [["missing", {}], ["URL-only", { NEXT_PUBLIC_SUPABASE_URL: publicConfig().NEXT_PUBLIC_SUPABASE_URL }], ["secret-only", { SUPABASE_SERVICE_ROLE_KEY: "synthetic-admin" }], ["blank-secret", { ...publicConfig(), SUPABASE_SERVICE_ROLE_KEY: " " }]]) {
    await test(`config/admin-${name}: no SDK and no network`, async () => {
      const r = runtime(config);
      try { const admin = r.load("src/lib/supabaseAdmin.ts"); assert.equal(r.creations.length, 0); assert.throws(admin.getSupabaseAdmin); assert.equal(r.creations.length, 0); assert.equal(r.requests.length, 0); }
      finally { await r.close(); }
    });
  }
  await test("config/reports factory: missing, partial and whitespace fail before SDK", async () => {
    for (const [, config] of configCases) {
      const r = runtime(config);
      try {
        const { createReportsSupabaseClient } = r.load("src/app/admin/reports/server.ts");
        assert.throws(() => createReportsSupabaseClient("synthetic-verified-token"));
        assert.equal(r.creations.length, 0); assert.equal(r.requests.length, 0);
      } finally { await r.close(); }
    }
  });
  await test("config/positive: actual SDK request scopes and lazy singleton", async () => {
    const r = runtime({ ...publicConfig(), SUPABASE_SERVICE_ROLE_KEY: "synthetic-admin" }, request => {
      const url = new URL(request.url);
      if (url.origin !== publicConfig().NEXT_PUBLIC_SUPABASE_URL || url.pathname !== "/rest/v1/places" || request.method !== "GET") { unexpected.push("positive-unknown-request"); throw new Error("Unexpected request"); }
      return Response.json([]);
    });
    try {
      const { supabaseServer, createUserScopedSupabaseClient } = r.load("src/lib/supabaseServer.ts");
      const { supabase } = r.load("src/lib/supabase.ts");
      const { getSupabaseAdmin } = r.load("src/lib/supabaseAdmin.ts");
      assert.equal(r.creations.length, 0);
      for (const client of [supabaseServer, supabaseServer, supabase, createUserScopedSupabaseClient("synthetic-verified-token"), getSupabaseAdmin()]) {
        assert.equal((await client.from("places").select("id")).error, null);
      }
      assert.equal(r.creations.length, 4); assert.equal(r.requests.length, 5);
      assert.deepEqual(r.requests.map(r => r.headers.get("authorization")), ["Bearer synthetic-public-key", "Bearer synthetic-public-key", "Bearer synthetic-public-key", "Bearer synthetic-verified-token", "Bearer synthetic-admin"]);
      for (const c of r.creations.filter(c => c.options.auth)) { assert.equal(c.options.auth.persistSession, false); assert.equal(c.options.auth.autoRefreshToken, false); assert.equal(c.options.auth.detectSessionInUrl, false); }
    } finally { await r.close(); }
  });
  await test("config/recovery: failed lazy initialization can use later corrected server config", async () => {
    const r = runtime({});
    try {
      const { supabaseServer } = r.load("src/lib/supabaseServer.ts");
      assert.throws(() => supabaseServer.auth, isConfigurationError);
      Object.assign(r.env, publicConfig()); assert.equal(typeof supabaseServer.auth.getUser, "function");
      assert.equal(r.creations.length, 1); assert.equal(r.requests.length, 0);
    } finally { await r.close(); }
  });
  await test("config/AuthProvider: guest resolves and sign-in/up reject without unhandled effect", async () => {
    const r = runtime({});
    try {
      const { AuthProvider } = r.load("src/components/AuthProvider.tsx");
      const rendered = r.react.render(AuthProvider, { children: null }); await r.react.mount();
      const actions = rendered.props.value;
      assert.equal(r.react.states[1].loading, false); assert.equal(r.react.states[1].session, null);
      assert.match((await actions.signIn("qa@example.invalid", "synthetic")).error, /not configured/);
      const signup = await actions.signUp("qa@example.invalid", "synthetic"); assert.match(signup.error, /not configured/); assert.equal(signup.needsConfirm, false);
      await actions.signOut(); assert.equal(r.creations.length, 0); assert.equal(r.requests.length, 0);
    } finally { await r.close(); }
  });
  await test("config/private-image: missing config publishes unavailable without SDK/effect crash", async () => {
    const r = runtime({});
    try {
      const { PrivatePetMediaImage } = r.load("src/components/PetMediaImage.tsx", "\nexport { PrivatePetMediaImage };\n");
      const src = "https://n16-synthetic.invalid/storage/v1/object/authenticated/pet-media/synthetic.png";
      r.react.render(PrivatePetMediaImage, { src, alt: "synthetic" }); await r.react.mount();
      assert.equal(r.react.states[0].failed, true); assert.equal(r.react.states[0].url, null);
      assert.equal(r.creations.length, 0); assert.equal(r.requests.length, 0);
    } finally { await r.close(); }
  });
}

function serialized(value) {
  return JSON.stringify(value, (_key, item) => item instanceof Error ? { name: item.name, message: item.message, stack: item.stack, cause: item.cause } : item);
}
async function reportingTests() {
  const canaries = ["N16_BEARER_CANARY", "N16_ACCESS_CANARY", "N16_REFRESH_CANARY", "N16_SIGNED_CANARY", "N16_CONTEXT_CANARY", "N16_CAUSE_CANARY"];
  function fixtureError() {
    const error = new Error(`Request failed Authorization: Bearer ${canaries[0]}\naccess_token=${canaries[1]} refresh_token=${canaries[2]}`);
    error.stack = `Error: request failed\n  at https://n16-synthetic.invalid/object?signature=${canaries[3]}#${canaries[3]}`;
    error.cause = { password: canaries[5] };
    return error;
  }
  for (const mode of ["local", "sentry", "reporting-failure"]) {
    await test(`reporting/${mode}: all explicit outputs redact tokens, stack URLs and context`, async () => {
      const captured = [];
      const r = runtime(mode === "local" ? {} : { SENTRY_DSN: "synthetic-configured" }, undefined, (error, options) => {
        captured.push({ error, options });
        if (mode === "reporting-failure") throw fixtureError();
      });
      try {
        r.load("src/lib/errorReporting.ts").reportError(fixtureError(), { route: "/api/health", refresh_token: canaries[4], detail: `https://n16-synthetic.invalid/path?token=${canaries[3]}` });
        assert(mode === "local" ? r.logs.length === 1 : captured.length === 1);
        if (mode === "reporting-failure") assert.equal(r.logs.length, 1);
        const output = serialized({ logs: r.logs, captured });
        for (const canary of canaries) assert(!output.includes(canary));
        assert(output.includes("Request failed")); assert(output.includes("/api/health"));
      } finally { await r.close(); }
    });
  }
  await test("reporting/unknown structured error, credentials and ordinary diagnostic", async () => {
    const r = runtime({});
    try {
      const { reportError } = r.load("src/lib/errorReporting.ts");
      reportError({ message: "database unavailable", nested: { access_token: "N16_NESTED_CANARY" } }, { route: "/api/health", detail: "Cookie: session=N16_COOKIE_CANARY" });
      reportError(new Error("ordinary database unavailable"), { route: "/api/health", attempt: 2 });
      const output = serialized(r.logs); assert(!output.includes("N16_NESTED_CANARY")); assert(!output.includes("N16_COOKIE_CANARY")); assert(output.includes("database unavailable")); assert(output.includes('"attempt":2'));
    } finally { await r.close(); }
  });
  await test("reporting/nested cyclic runtime values remain safe and retain diagnostic context", async () => {
    const r = runtime({});
    try {
      const problem = { message: "cyclic database unavailable", nested: { password: "N16_CYCLIC_CANARY" } };
      problem.self = problem;
      r.load("src/lib/errorReporting.ts").reportError(problem, { route: "/api/health", detail: problem });
      const output = serialized(r.logs);
      assert.equal(r.logs.length, 1); assert(!output.includes("N16_CYCLIC_CANARY"));
      assert(output.includes("cyclic database unavailable")); assert(output.includes("/api/health"));
    } finally { await r.close(); }
  });
  await test("reporting/hostile error and context getters cannot escape or leak cyclic canaries", async () => {
    for (const target of ["message", "stack", "context", "sentry-failure"]) {
      const canary = "N16_HOSTILE_GETTER_CYCLIC_CANARY";
      const cyclic = { token: canary }; cyclic.self = cyclic;
      let reads = 0, sentryCalls = 0;
      const hostile = new Error("synthetic hostile error");
      Object.defineProperty(hostile, target === "stack" ? "stack" : "message", {
        configurable: true,
        get() { reads++; throw cyclic; },
      });
      const context = { route: "/api/health", detail: cyclic };
      if (target === "context") Object.defineProperty(context, "getter", {
        enumerable: true, get() { reads++; throw cyclic; },
      });
      const r = runtime(target === "sentry-failure" ? { SENTRY_DSN: "synthetic-configured" } : {}, undefined, () => {
        sentryCalls++; throw hostile;
      });
      try {
        const { reportError } = r.load("src/lib/errorReporting.ts");
        const problem = target === "message" || target === "stack" ? hostile : new Error("ordinary diagnostic");
        assert.doesNotThrow(() => reportError(problem, context));
        assert.equal(reads, target === "sentry-failure" ? 0 : 1);
        assert.equal(sentryCalls, target === "sentry-failure" ? 1 : 0);
        assert.equal(r.logs.length, 1);
        const output = serialized(r.logs);
        assert(output.includes("ErrorReportingFailure"));
        assert(!output.includes(canary)); assert(!output.includes("/api/health"));
      } finally { await r.close(); }
    }
  });
}

async function healthTests() {
  await test("health/actual SDK: 200, DB error 503, abort 503, recovery 200 and cleared timer", async () => {
    let mode = "ok", aborts = 0;
    const r = runtime(publicConfig(), async request => {
      const url = new URL(request.url);
      if (url.origin !== publicConfig().NEXT_PUBLIC_SUPABASE_URL || url.pathname !== "/rest/v1/places" || request.method !== "HEAD" || url.searchParams.get("select") !== "id" || url.searchParams.get("limit") !== "1") { unexpected.push("health-unknown-request"); throw new Error("Unknown health request"); }
      if (mode === "error") return new Response(null, { status: 503 });
      if (mode === "timeout") return new Promise((_resolve, reject) => {
        const abort = () => { aborts++; reject(new DOMException("Synthetic transport aborted", "AbortError")); };
        if (request.signal.aborted) abort(); else request.signal.addEventListener("abort", abort, { once: true });
      });
      return new Response(null, { status: 200, headers: { "content-range": "*/0" } });
    });
    try {
      const { GET } = r.load("src/app/api/health/route.ts");
      for (const next of ["ok", "error", "timeout", "ok"]) {
        mode = next; const start = performance.now(); const response = await GET(); const body = await response.json();
        assert.equal(response.status, next === "ok" ? 200 : 503);
        assert.equal(body.status, next === "ok" ? "ok" : "degraded");
        assert.equal(body.checks.supabase, next === "ok" ? "ok" : "down");
        assert.deepEqual(Object.keys(body).sort(), ["checks", "status", "timestamp"]);
        assert.equal(r.timers.size, 0);
        if (next === "timeout") assert(performance.now() - start >= 2800 && performance.now() - start < 8000);
      }
      assert.equal(aborts, 1); assert.equal(r.requests.length, 4);
    } finally { await r.close(); }
  });
  await test("health/missing configuration: imports safely and returns degraded without network", async () => {
    const r = runtime({});
    try {
      const response = await r.load("src/app/api/health/route.ts").GET();
      assert.equal(response.status, 503); assert.equal((await response.json()).checks.supabase, "down");
      assert.equal(r.creations.length, 0); assert.equal(r.requests.length, 0); assert.equal(r.timers.size, 0);
    } finally { await r.close(); }
  });
}

function workflowScript(text, name) {
  const marker = `      - name: ${name}\n`;
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const block = text.slice(start + marker.length).split(/\n      - name:/)[0];
  const single = /^        run: (?!\|)(.+)$/m.exec(block);
  if (single) return single[1];
  const lines = block.split("\n"); const run = lines.indexOf("        run: |");
  if (run < 0) throw new Error("Unsupported workflow run block");
  return lines.slice(run + 1).filter(line => line.startsWith("          ")).map(line => line.slice(10)).join("\n");
}
async function ciTests() {
  const workflow = sourceFile(".github/workflows/quality-gate.yml").text;
  for (const kind of ["secret", "raw-rest", "clean"]) {
    await test(`ci/${kind}: actual workflow scan exit and no matching source in stdout/stderr`, async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pawpal-n16-scan-"));
      const canary = kind === "secret" ? "sk_test_N16_SYNTHETIC_CANARY_123" : "https://n16-synthetic.supabase.co/rest/v1/private?token=N16_SYNTHETIC_CANARY";
      try {
        fs.mkdirSync(path.join(dir, "src")); fs.mkdirSync(path.join(dir, "scripts"));
        fs.writeFileSync(path.join(dir, "src/fixture.ts"), kind === "clean" ? "export const value = 1;\n" : `export const value = ${JSON.stringify(canary)};\n`);
        let script = workflowScript(workflow, "Source safety scan (metadata only)");
        if (script) fs.writeFileSync(path.join(dir, "scripts/source-safety-scan.mjs"), sourceFile("scripts/source-safety-scan.mjs").text);
        else script = workflowScript(workflow, kind === "raw-rest" ? "Check for raw REST URL usage" : "Check for exposed secrets");
        assert(script);
        const result = spawnSync("/bin/sh", ["-c", script], { cwd: dir, encoding: "utf8", timeout: 5000, env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin` } });
        assert.equal(result.status, kind === "clean" ? 0 : 1);
        assert(!((result.stdout ?? "") + (result.stderr ?? "")).includes(canary));
        if (kind !== "clean") assert((result.stdout ?? "").includes("fixture.ts"));
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    });
  }
  await test("ci/environment gate wired and optional Sentry build variable documented", async () => {
    assert(workflow.includes("run: node scripts/environment-safety-check.mjs"));
    const example = sourceFile(".env.example").text;
    assert(/^SENTRY_AUTH_TOKEN=$/m.test(example));
    assert(!/^NEXT_PUBLIC_SENTRY_AUTH_TOKEN=/m.test(example));
  });
}

try {
  if (group === "all" || group === "config") await configTests();
  if (group === "all" || group === "reporting") await reportingTests();
  if (group === "all" || group === "health") await healthTests();
  if (group === "all" || group === "ci") await ciTests();
  assert.equal(unexpected.length, 0, "Unexpected global/SDK requests");
} catch (error) {
  cases.push({ name: "harness", passed: false, errorType: error?.name ?? "UnknownError" });
} finally {
  clearTimeout(deadline); globalThis.fetch = originalFetch;
}
const passed = cases.length > 0 && cases.every(c => c.passed) && unexpected.length === 0;
console.log(JSON.stringify({ passed, group, cases, unexpectedRequestCount: unexpected.length,
  transport: "actual installed Supabase SDK with closed synthetic fetch; no live backend/browser claim",
  sourceSHA256: Object.fromEntries([...inputs.entries()].sort()),
}, null, 2));
process.exitCode = passed ? 0 : 1;
