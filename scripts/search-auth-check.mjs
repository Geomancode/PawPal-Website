import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

// Real route/NextRequest/NextResponse and Supabase SDK; all HTTP is synthetic.
// No server, real credentials, provider calls, disk sessions or environment file.
const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}
const root = path.resolve(option("--root", path.resolve(import.meta.dirname, "..")));
const routeFile = path.resolve(option("--route", path.join(root, "src/app/api/search/route.ts")));
const red = args.includes("--expect-red");
const require = createRequire(path.join(root, "package.json"));
require("next/dist/server/node-environment-baseline");
const next = require("next/server");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");
const ids = { A: "11111111-1111-4111-8111-111111111111", B: "22222222-2222-4222-8222-222222222222" };
const origin = "http://search-fixture.invalid";
const originalFetch = globalThis.fetch;
const activeFixtures = [];
const json = (value, status = 200) => Response.json(value, { status });
const profile = (actor, changes = {}) => ({
  id: ids[actor], display_name: actor, username: actor, avatar_url: null, location_city: null,
  bio: null, trust_level: 1, paw_points: 0, is_verified: false, created_at: "2026-01-01T00:00:00Z",
  custom_badge: null, profile_tags: [], language_pref: "en", updated_at: "2026-01-01T00:00:00Z",
  home_address: null, pet_preferences: null, subscription_tier: "basic",
  subscription_expires_at: "2099-01-01T00:00:00Z", quick_actions: [], banned_at: null,
  ...changes,
});

function fixture(options = {}) {
  const calls = [];
  const violations = [];
  const clock = { now: Date.parse("2026-10-17T00:00:00Z") };
  class FixtureDate extends Date { static now() { return clock.now; } }
  const handleRequest = async (input, init) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    if (url.origin === "https://generativelanguage.googleapis.com") {
      assert.equal(req.method, "POST");
      assert.equal(url.pathname, "/v1beta/models/gemini-2.5-flash:generateContent");
      assert.equal(url.search, "?key=synthetic-unused-provider-key");
      const body = await req.json();
      assert.equal(body.generationConfig.maxOutputTokens, 600);
      const prompt = body.contents[0].parts[0].text;
      assert.equal(typeof prompt, "string");
      const classify = prompt.includes("Classify the user's intent");
      calls.push({ kind: "model", classify });
      const text = classify ? JSON.stringify({ intent: options.intent ?? "general", keywords: options.keywords ?? "dog park", language: "en" }) : "Synthetic answer";
      return json({ candidates: [{ content: { parts: [{ text }] } }] });
    }
    assert.equal(url.origin, origin, `Unexpected network destination: ${url.origin}`);
    const authorization = req.headers.get("authorization");
    const actor = ["Bearer synthetic-A", "Bearer synthetic-A-rotated"].includes(authorization) ? "A" : authorization === "Bearer synthetic-B" ? "B" : null;
    assert.equal(req.headers.get("apikey"), "synthetic-anon-key");
    if (url.pathname === "/auth/v1/user") {
      assert.equal(req.method, "GET");
      calls.push({ kind: "auth", actor });
      return actor ? json({ id: ids[actor], aud: "authenticated", role: "authenticated", email: `${actor}@example.invalid` }) : json({ message: "Invalid session" }, 401);
    }
    if (url.pathname === "/rest/v1/rpc/get_profile_view") {
      assert.equal(req.method, "POST");
      assert.equal(url.search, "");
      assert.ok(actor, "profile read must use the verified JWT");
      assert.deepEqual(await req.json(), { p_user_id: ids[actor] });
      calls.push({ kind: "profile", actor });
      if (options.profileFailure) return json({ message: "Synthetic denied", code: "42501" }, 403);
      if (options.profileNull) return json(null);
      return json({ visibility: options.visibility ?? "self", profile: profile(actor, options.profileChanges) });
    }
    if (["/rest/v1/quests", "/rest/v1/places"].includes(url.pathname)) {
      assert.equal(req.method, "GET");
      assert.equal(actor, null, "public search must not mutate the shared anonymous client");
      const table = url.pathname.split("/").at(-1);
      assert.equal(url.searchParams.get("select"), table === "places" ? "id,name,place_type,lat,lng,city,rating_avg" : "id,title,quest_type,status,reward_type,lat,lng");
      const filter = url.searchParams.get("or");
      assert.ok(filter && filter.includes(".ilike.%"));
      assert.ok(!filter.includes("\\") && !filter.includes("_%"));
      calls.push({ kind: "public_search", table, filter, offset: url.searchParams.get("offset"), limit: url.searchParams.get("limit") });
      return json(table === "places" ? [{ id: "place-1", name: "Synthetic park", place_type: "park", lat: 51, lng: 3, city: "Fixture", rating_avg: 4 }] : [{ id: "quest-1", title: "Synthetic mission", quest_type: "walk", status: "open", reward_type: "points", lat: 51, lng: 3 }]);
    }
    throw new Error(`Unexpected synthetic request: ${req.method} ${url.pathname}`);
  };
  const transport = async (...input) => {
    try { return await handleRequest(...input); }
    catch (error) {
      violations.push(error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
  globalThis.fetch = transport;
  const cache = new Map();
  const aliases = new Map([
    ["@/lib/supabaseServer", "src/lib/supabaseServer.ts"],
    ["@/lib/supabaseConfiguration", "src/lib/supabaseConfiguration.ts"],
    ["@/lib/searchQuery", "src/lib/searchQuery.ts"],
    ["@/lib/subscriptions", "src/lib/subscriptions.ts"],
    ["@/lib/profileViews", "src/lib/profileViews.ts"],
  ]);
  function moduleAt(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const result = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file, reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    assert.equal(result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0, `TypeScript syntax: ${file}`);
    vm.runInNewContext(result.outputText, {
      exports,
      require: (name) => {
        if (name === "next/server") return next;
        if (name === "@supabase/supabase-js") return { createClient };
        assert.ok(aliases.has(name), `Unexpected dependency ${name}`);
        return moduleAt(path.join(root, aliases.get(name)));
      },
      process: { env: { NEXT_PUBLIC_SUPABASE_URL: origin, NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon-key", GEMINI_API_KEY: "synthetic-unused-provider-key" } },
      fetch: transport, console, Response, Request, Headers, URL, Date: FixtureDate,
    }, { filename: file });
    return exports;
  }
  const route = moduleAt(routeFile);
  const count = (kind) => calls.filter((c) => c.kind === kind).length;
  async function post(body = { query: "hello" }, token = "synthetic-A", extraHeaders = {}) {
    const request = new next.NextRequest(`${origin}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
      body: typeof body === "object" || body === null ? JSON.stringify(body) : body,
    });
    const response = await route.POST(request);
    return { response, body: await response.json() };
  }
  const result = { calls, clock, count, post, violations };
  activeFixtures.push(result);
  return result;
}

let checks = 0;
async function check(label, fn) {
  await fn();
  for (const fixture of activeFixtures) assert.deepEqual(fixture.violations, [], "strict transport violations cannot be hidden by product catch");
  checks++;
  console.log(`${red ? "RED-CONFIRMED" : "PASS"} ${checks} ${label}`);
}
function privateResponse(response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("vary"), "Authorization");
}
async function rejection(f, body, token, status, headers) {
  const before = f.count("model");
  const result = await f.post(body, token, headers);
  assert.equal(result.response.status, status);
  assert.equal(f.count("model"), before, "rejected request must not call model");
  assert.equal(f.count("public_search"), 0);
  for (const id of Object.values(ids)) assert.equal(JSON.stringify(result.body).includes(id), false);
  privateResponse(result.response);
  return result;
}

try {
  if (red) {
    await check("old anonymous POST consumes two model calls without checking identity", async () => {
      const f = fixture(); const r = await f.post({ query: "hello" }, null);
      assert.equal(r.response.status, 200); assert.equal(f.count("model"), 2);
      assert.equal(f.count("auth"), 0); assert.equal(f.count("profile"), 0);
    });
    await check("old forged bearer and overlong query still consume model calls", async () => {
      const f = fixture(); const r = await f.post({ query: "x".repeat(1201) }, "forged");
      assert.equal(r.response.status, 200); assert.equal(f.count("model"), 2); assert.equal(f.count("auth"), 0);
    });
    await check("old 20 anonymous requests produce 40 model calls with no rate rejection", async () => {
      const f = fixture();
      const statuses = [];
      for (let i = 0; i < 20; i++) statuses.push((await f.post({ query: "hello" }, null)).response.status);
      assert.deepEqual(statuses, Array(20).fill(200)); assert.equal(f.count("model"), 40);
    });
    console.log(`Confirmed ${checks} existing WEB-08 red cases; this is not a product pass.`);
  } else {
    await check("anonymous, malformed bearer and forged sessions reject before models/private reads", async () => {
      for (const token of [null, "forged", "synthetic-A extra"]) {
        const f = fixture(); await rejection(f, { query: "hello" }, token, 401);
        assert.equal(f.count("profile"), 0);
      }
    });
    await check("invalid JSON, null/array/scalar bodies and invalid queries reject before Auth or models", async () => {
      for (const body of ["{bad", null, [], "42", "true", '"query"', {}, { query: null }, { query: 1 }, { query: "  " }]) {
        const f = fixture(); await rejection(f, body, "synthetic-A", 400); assert.equal(f.count("auth"), 0);
      }
    });
    await check("1201 ASCII and 601 emoji reject before Auth/model; 1200-unit boundaries work", async () => {
      for (const query of ["x".repeat(1201), "🐾".repeat(601)]) {
        const f = fixture(); await rejection(f, { query }, "synthetic-A", 413); assert.equal(f.count("auth"), 0);
      }
      for (const query of ["x".repeat(1200), "🐾".repeat(600)]) {
        const f = fixture(); const r = await f.post({ query }); assert.equal(r.response.status, 200); assert.equal(f.count("model"), 2);
      }
    });
    await check("free, expired, missing/invalid expiry and unknown plans deny paid AI", async () => {
      for (const profileChanges of [
        { subscription_tier: "free" }, { subscription_tier: "unknown" },
        { subscription_expires_at: "2020-01-01T00:00:00Z" }, { subscription_expires_at: null },
        { subscription_expires_at: "" }, { subscription_expires_at: "not-a-date" },
      ]) {
        const f = fixture({ profileChanges }); await rejection(f, { query: "hello" }, "synthetic-A", 402);
        assert.equal(f.count("auth"), 1); assert.equal(f.count("profile"), 1);
      }
    });
    await check("failed/missing/cross-owner/admin profile envelopes cannot grant AI", async () => {
      for (const options of [{ profileFailure: true }, { profileNull: true }, { profileChanges: { id: ids.B } }, { visibility: "admin" }]) {
        const f = fixture(options); await rejection(f, { query: "hello", user_id: ids.B, subscription_tier: "pro" }, "synthetic-A", 402);
      }
    });
    await check("active Basic and Pro run real verified same-JWT profile pipeline then bounded models", async () => {
      for (const subscription_tier of ["basic", "pro"]) {
        const f = fixture({ profileChanges: { subscription_tier } }); const r = await f.post();
        assert.equal(r.response.status, 200); assert.equal(r.body.aiMessage, "Synthetic answer");
        assert.equal(f.count("model"), 2); assert.deepEqual(f.calls.slice(0, 2).map((c) => c.kind), ["auth", "profile"]);
        privateResponse(r.response);
      }
    });
    await check("valid subscribers retain public places/missions search and bounded pagination", async () => {
      for (const intent of ["search_places", "search_missions"]) {
        const f = fixture({ intent }); const r = await f.post({ query: "dog park", limit: 2, page: 3 });
        assert.equal(r.response.status, 200); assert.equal(r.body.results.length, 1); assert.equal(r.body.intent, intent);
        assert.deepEqual(r.body.pagination, { limit: 2, offset: 4, page: 3 });
        assert.equal(f.count("model"), 1); assert.equal(f.count("public_search"), 1);
        assert.equal(f.calls.at(-1).offset, "4"); assert.equal(f.calls.at(-1).limit, "2");
      }
    });
    await check("sanitizer-only query remains empty but cannot bypass authentication", async () => {
      const anonymous = fixture(); await rejection(anonymous, { query: "%_{}" }, null, 401);
      const f = fixture(); const r = await f.post({ query: "%_{}" });
      assert.equal(r.response.status, 200); assert.equal(r.body.intent, "empty"); assert.equal(f.count("model"), 0);
    });
    await check("authenticated query sanitization reaches the actual SDK with the safe filter", async () => {
      for (const [query, safe] of [["a,b_%", "ab"], ["中文名", "中文名"]]) {
        const f = fixture({ intent: "search_places", keywords: query }); const r = await f.post({ query });
        assert.equal(r.response.status, 200); assert.equal(r.body.results.length, 1);
        assert.equal(f.calls.at(-1).filter, `(name.ilike.%${safe}%,place_type.ilike.%${safe}%,city.ilike.%${safe}%)`);
      }
    });
    await check("18-request boundary is per verified account, token/IP changes do not reset it", async () => {
      const f = fixture();
      for (let i = 0; i < 18; i++) assert.equal((await f.post()).response.status, 200);
      assert.equal(f.count("model"), 36);
      await rejection(f, { query: "hello" }, "synthetic-A-rotated", 429, { "x-forwarded-for": "203.0.113.99" });
      assert.equal((await f.post({ query: "hello" }, "synthetic-B")).response.status, 200);
      f.clock.now += 59_999;
      await rejection(f, { query: "hello" }, "synthetic-A", 429);
      f.clock.now += 1;
      assert.equal((await f.post()).response.status, 200); assert.equal(f.count("model"), 40);
    });
    await check("19 concurrent same-account requests admit 18 and reject one before model", async () => {
      const f = fixture(); const results = await Promise.all(Array.from({ length: 19 }, () => f.post()));
      assert.equal(results.filter((r) => r.response.status === 200).length, 18);
      assert.equal(results.filter((r) => r.response.status === 429).length, 1); assert.equal(f.count("model"), 36);
    });
    console.log(`PASS ${checks}/${checks}; actual route + NextRequest + SDK, synthetic HTTP/provider, no real Auth/RLS/provider billing or distributed quota claim.`);
  }
} finally { globalThis.fetch = originalFetch; }
