import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

// Real SDK and product modules; every HTTP request is synthetic and allowlisted.
// This is a contract test, not a claim of database RLS or browser validation.
const origin = "http://profile-contract.invalid";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const M = "33333333-3333-4333-8333-333333333333";
const basic = (id = A) => ({ id, display_name: `Name ${id}`, username: `user_${id}`, avatar_url: null, location_city: "" });
const publicRow = (id = A) => ({ ...basic(id), bio: "Public biography", trust_level: 1, paw_points: 7, is_verified: false, created_at: "2026-01-01T00:00:00Z", custom_badge: null, profile_tags: [] });
const ownRow = (id = A) => ({ ...publicRow(id), language_pref: "en", updated_at: "2026-01-01T00:00:00Z", home_address: "PRIVATE_ADDRESS_SENTINEL", pet_preferences: "PRIVATE_PREFERENCES_SENTINEL", subscription_tier: "basic", subscription_expires_at: "2099-01-01T00:00:00Z", quick_actions: [], banned_at: null });
const envelope = (visibility, id = A) => ({ visibility, profile: visibility === "private" ? basic(id) : visibility === "public" ? publicRow(id) : ownRow(id) });
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });
const plain = (value) => JSON.parse(JSON.stringify(value));
const calls = [];
const rejected = [];
let handler;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  try {
    assert.equal(url.origin, origin);
    assert.equal(url.hash, "");
    const body = request.method === "POST" || request.method === "PATCH" ? await request.clone().json() : null;
    const call = { request, url, body };
    calls.push(call);
    return await handler(call);
  } catch (error) {
    rejected.push({ method: request.method, path: url.pathname });
    throw error;
  }
};
function moduleAt(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const context = { exports: {}, require: (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import ${name}`);
    return dependencies[name];
  }, process: { env: { NEXT_PUBLIC_SUPABASE_URL: origin, NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon" } } };
  vm.runInNewContext(code, context, { filename: file });
  return context.exports;
}
const makeClient = (token = "synthetic-A") => createClient(origin, "synthetic-anon", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
});
function rpc(call, name, body) {
  assert.equal(call.request.method, "POST");
  assert.equal(call.url.pathname, `/rest/v1/rpc/${name}`);
  assert.equal(call.url.search, "");
  assert.deepEqual(call.body, body);
}
let count = 0;
async function check(label, run) {
  calls.length = 0;
  rejected.length = 0;
  await run();
  assert.deepEqual(rejected, [], "unknown requests must fail");
  console.log(`PASS ${++count} ${label}`);
}
try {
  const views = moduleAt("src/lib/profileViews.ts");
  const client = makeClient();
  await check("public projection contains only page display fields and one RPC", async () => {
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(envelope("public")); };
    const value = await views.getPublicProfileView(client, A);
    assert.equal(value.isPublic, true);
    assert.deepEqual(Object.keys(value.profile).sort(), ["id", "display_name", "username", "avatar_url", "location_city", "bio", "paw_points", "is_verified"].sort());
    assert.equal(calls.length, 1);
  });
  await check("private basic identity and empty city never fall back to address", async () => {
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: B }); return json(envelope("private", B)); };
    const value = await views.getPublicProfileView(client, B);
    assert.equal(value.isPublic, false);
    assert.deepEqual(plain(value.profile), basic(B));
    assert.equal(value.profile.location_city, "");
  });
  await check("missing profile stays null with no direct read", async () => {
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(null); };
    assert.equal(await views.getPublicProfileView(client, A), null);
    assert.equal(calls.length, 1);
  });
  await check("false, boolean, unknown, malformed and mismatched envelopes fail closed", async () => {
    for (const data of [false, true, {}, [], { visibility: "future", profile: basic() }, envelope("public", B), { visibility: "private", profile: { ...basic(), home_address: "PRIVATE" } }, { ...envelope("public"), unexpected: true }]) {
      handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(data); };
      await assert.rejects(views.getPublicProfileView(client, A), /Invalid profile view response/);
    }
  });
  await check("public consumer rejects self/admin responses and private fields in public envelope", async () => {
    for (const data of [envelope("self"), envelope("admin"), { visibility: "public", profile: ownRow() }]) {
      handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(data); };
      await assert.rejects(views.getPublicProfileView(client, A), /Invalid profile view response/);
    }
  });
  await check("RPC denial propagates without REST fallback", async () => {
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json({ code: "42501", message: "Synthetic permission denial" }, 403); };
    await assert.rejects(views.getPublicProfileView(client, A), (error) => error.code === "42501");
    assert.equal(calls.length, 1);
  });
  await check("own profile requires exact self identity and carries request JWT", async () => {
    handler = (call) => {
      rpc(call, "get_profile_view", { p_user_id: A });
      assert.equal(call.request.headers.get("Authorization"), "Bearer synthetic-A");
      return json(envelope("self"));
    };
    assert.equal((await views.getOwnProfile(client, A)).home_address, "PRIVATE_ADDRESS_SENTINEL");
    for (const data of [envelope("admin"), envelope("public"), envelope("self", B)]) {
      handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(data); };
      await assert.rejects(views.getOwnProfile(client, A), /Invalid profile view response/);
    }
  });
  const identity = { id: A, username: "synthetic_new", display_name: "Synthetic new" };
  function creationTransport(createStatus, after) {
    let reads = 0;
    return (call) => {
      if (call.url.pathname.endsWith("/rpc/get_profile_view")) {
        rpc(call, "get_profile_view", { p_user_id: A });
        return json(++reads === 1 ? null : after);
      }
      assert.equal(call.url.pathname, "/rest/v1/profiles");
      assert.equal(call.request.method, "POST");
      assert.equal(call.url.search, "");
      assert.deepEqual(call.body, identity);
      assert.ok(!String(call.request.headers.get("prefer")).includes("resolution="));
      assert.ok(!String(call.request.headers.get("prefer")).includes("return=representation"));
      return createStatus === 201 ? new Response(null, { status: 201 }) : json({ code: String(createStatus), message: "Synthetic creation conflict" }, createStatus === "23505" ? 409 : 403);
    };
  }
  await check("existing own profile is read without any insert or default overwrites", async () => {
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(envelope("self")); };
    assert.equal((await views.loadOrCreateOwnProfile(client, identity)).id, A);
    assert.equal(calls.length, 1);
  });
  await check("missing own profile minimal INSERT then authoritative RPC readback", async () => {
    handler = creationTransport(201, envelope("self"));
    assert.equal((await views.loadOrCreateOwnProfile(client, identity)).id, A);
    assert.equal(calls.length, 3);
  });
  await check("23505 race reads existing same-owner data without overwriting", async () => {
    handler = creationTransport("23505", { visibility: "self", profile: { ...ownRow(), display_name: "Concurrent writer", paw_points: 87 } });
    const value = await views.loadOrCreateOwnProfile(client, identity);
    assert.equal(value.display_name, "Concurrent writer");
    assert.equal(value.paw_points, 87);
    assert.equal(calls.filter((call) => call.request.method === "POST" && call.url.pathname.endsWith("/profiles")).length, 1);
  });
  await check("conflict without same-owner row does not fabricate successful creation", async () => {
    handler = creationTransport("23505", null);
    await assert.rejects(views.loadOrCreateOwnProfile(client, identity), /could not be confirmed/);
    handler = creationTransport("23505", envelope("public"));
    await assert.rejects(views.loadOrCreateOwnProfile(client, identity), /Invalid profile view response/);
  });
  await check("nonunique creation errors do not retry or read back", async () => {
    handler = creationTransport("42501", envelope("self"));
    await assert.rejects(views.loadOrCreateOwnProfile(client, identity), (error) => error.code === "42501");
    assert.equal(calls.length, 2);
  });
  await check("batch requests deduplicate and chunk at 100, accepting omitted and reordered rows", async () => {
    const ids = Array.from({ length: 205 }, (_, index) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`);
    const sizes = [];
    handler = (call) => {
      const requested = call.body.p_user_ids;
      rpc(call, "get_profile_views", { p_user_ids: requested });
      assert.ok(requested.length <= 100);
      sizes.push(requested.length);
      return json(requested.filter((id) => id !== ids[50]).reverse().map((id) => envelope("admin", id)));
    };
    const result = await views.getProfileViews(client, [...ids, ids[0]]);
    assert.deepEqual(sizes, [100, 100, 5]);
    assert.equal(result.length, 204);
    const byId = new Map(result.map((view) => [view.profile.id, view.profile]));
    assert.equal(byId.get(ids[204]).id, ids[204]);
    assert.equal(byId.has(ids[50]), false);
    calls.length = 0;
    assert.equal((await views.getProfileViews(client, [])).length, 0);
    assert.equal(calls.length, 0);
  });
  await check("batch duplicate, foreign id, null and malformed rows fail closed", async () => {
    for (const data of [null, [envelope("admin", B)], [envelope("admin"), envelope("admin")], [null], [envelope("unknown")]]) {
      handler = (call) => { rpc(call, "get_profile_views", { p_user_ids: [A] }); return json(data); };
      await assert.rejects(views.getProfileViews(client, [A]), /Invalid profile view response/);
    }
  });
  const missing = new Error("NOT_FOUND");
  const page = moduleAt("src/app/[locale]/user/[id]/page.tsx", {
    "@/lib/supabaseServer": { supabaseServer: makeClient("synthetic-anon") }, "@/lib/profileViews": views,
    "next/navigation": { notFound: () => { throw missing; } }, "@/app/metadata": { publicPageMetadata: (data) => data },
    "@/lib/p2w2DynamicRouteFixtures": { loadP2W2UserFixture: async () => null },
    "@/i18n/serverMessages": { getServerMessages: async () => ({ locale: "fr", messages: { tagPageOwnerNotPublic: "Profil du propriétaire non public" } }) },
    "@/app/user/[id]/UserPageClient": { default: "UserPageClient" },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
  });
  const params = (id = A) => ({ params: Promise.resolve({ id, locale: "fr" }) });
  await check("actual private page and metadata use basic identity with no pets or activity requests", async () => {
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: B }); assert.equal(call.request.headers.get("Authorization"), "Bearer synthetic-anon"); return json(envelope("private", B)); };
    const rendered = (await page.default(params(B))).props;
    assert.deepEqual(plain(rendered.profile), basic(B));
    assert.equal(rendered.isPublic, false);
    assert.deepEqual(plain(rendered.pets), []);
    const metadata = await page.generateMetadata(params(B));
    assert.equal(metadata.description, "Profil du propriétaire non public");
    assert.equal(metadata.locale, "fr");
    assert.equal(calls.length, 2);
    assert.ok(!JSON.stringify([rendered, metadata]).includes("PRIVATE_"));
  });
  await check("actual public page and metadata project only display fields, with public pets and count", async () => {
    handler = (call) => {
      assert.equal(call.request.headers.get("Authorization"), "Bearer synthetic-anon");
      if (call.url.pathname.endsWith("/rpc/get_profile_view")) { rpc(call, "get_profile_view", { p_user_id: A }); return json(envelope("public")); }
      assert.equal(call.request.method, "GET");
      if (call.url.pathname === "/rest/v1/pets") {
        assert.deepEqual(Object.fromEntries(call.url.searchParams), { select: "id,name,species_group,breed,avatar_url", owner_id: `eq.${A}`, is_public: "eq.true", limit: "4" });
        return json([{ id: B, name: "Public pet" }]);
      }
      assert.equal(call.url.pathname, "/rest/v1/posts");
      assert.deepEqual(Object.fromEntries(call.url.searchParams), { select: "id", user_id: `eq.${A}`, limit: "200" });
      return json([{ id: B }]);
    };
    const rendered = (await page.default(params())).props;
    const metadata = await page.generateMetadata(params());
    assert.equal(rendered.isPublic, true);
    assert.equal(rendered.postCount, 1);
    assert.equal(rendered.pets[0].name, "Public pet");
    assert.equal(metadata.description, "Public biography");
    for (const field of ["home_address", "pet_preferences", "subscription_tier", "profile_tags", "trust_level", "created_at"]) assert.equal(Object.hasOwn(rendered.profile, field), false);
    assert.equal(calls.length, 6);
  });
  await check("actual page and metadata reject RPC errors/invalid envelopes before related data", async () => {
    for (const data of [false, { visibility: "private", profile: { ...basic(), bio: "PRIVATE_BIO" } }]) {
      handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(data); };
      await assert.rejects(page.default(params()), /Invalid profile view response/);
      await assert.rejects(page.generateMetadata(params()), /Invalid profile view response/);
    }
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json({ code: "42501", message: "Synthetic denial" }, 403); };
    await assert.rejects(page.default(params()), (error) => error.code === "42501");
    await assert.rejects(page.generateMetadata(params()), (error) => error.code === "42501");
    handler = (call) => { rpc(call, "get_profile_view", { p_user_id: A }); return json(null); };
    await assert.rejects(page.default(params()), (error) => error === missing);
    assert.ok(!JSON.stringify(await page.generateMetadata(params())).includes("PRIVATE"));
  });
  const locales = moduleAt("src/i18n/locales.ts");
  const admin = moduleAt("src/app/admin/reports/server.ts", {
    "@supabase/supabase-js": { createClient }, "@/i18n/locales": locales, "@/lib/profileViews": views,
    "./types": moduleAt("src/app/admin/reports/types.ts"),
  });
  let adminVisibility = "admin";
  handler = (call) => {
    assert.equal(call.request.headers.get("Authorization"), "Bearer synthetic-M");
    if (call.url.pathname === "/auth/v1/user") {
      assert.equal(call.request.method, "GET"); assert.equal(call.url.search, "");
      return json({ id: M, aud: "authenticated", role: "authenticated" });
    }
    if (call.url.pathname.endsWith("/rpc/is_pawpal_admin")) { rpc(call, "is_pawpal_admin", {}); return json(true); }
    if (call.url.pathname.endsWith("/rpc/get_profile_views")) {
      rpc(call, "get_profile_views", { p_user_ids: [A, B] });
      return json([envelope(adminVisibility, B), envelope(adminVisibility, A)]);
    }
    assert.equal(call.request.method, "GET"); assert.equal(call.url.pathname, "/rest/v1/reports");
    assert.deepEqual(Object.fromEntries(call.url.searchParams), { select: "id,reporter_id,reported_user_id,reason,target_type,target_id,created_at", status: "eq.pending", order: "created_at.desc", offset: "0", limit: "20" });
    return json([{ id: "report", reporter_id: A, reported_user_id: B, reason: "Synthetic", target_type: "user", target_id: B, created_at: "2026-01-01T00:00:00Z" }], 200, { "Content-Range": "0-0/1" });
  };
  await check("actual admin hydration uses verified JWT and maps reordered RPC rows by id", async () => {
    const result = await admin.loadPendingReports("synthetic-M", 1);
    assert.equal(result.kind, "ready");
    assert.equal(result.viewerId, M);
    assert.equal(result.payload.reports[0].reporter.id, A);
    assert.equal(result.payload.reports[0].reportedUser.id, B);
    assert.equal(result.payload.reports[0].target.profile.id, B);
    assert.ok(!JSON.stringify(result).includes("PRIVATE_"));
    assert.equal(calls.filter((call) => call.url.pathname === "/rest/v1/profiles").length, 0);
  });
  await check("admin role downgrade or basic-only profile response cannot yield ready data", async () => {
    adminVisibility = "private";
    const result = await admin.loadPendingReports("synthetic-M", 1);
    assert.equal(result.kind, "error");
    assert.equal(Object.hasOwn(result, "payload"), false);
  });
  console.log(`PASS ${count}/${count}; product RPC consumers with real SDK and strict synthetic transport; no database, browser, AI or billing invoked.`);
} finally {
  globalThis.fetch = originalFetch;
}
