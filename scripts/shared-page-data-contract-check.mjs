import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

// These columns come from the migrations, not from the visual route fixtures.
const columns = {
  profiles: new Set(["id", "display_name", "username", "avatar_url"]),
  pets: new Set(["id", "name", "breed", "birth_date", "avatar_url", "social_traits", "blood_type", "owner_contact", "created_at", "owner_id"]),
  post_images: new Set(["url", "sort_order"]),
};
const notFound = new Error("NEXT_NOT_FOUND");
const calls = [];
let rows;
const supabase = {
  from(table) {
    calls.push(table);
    const query = {
      select(selection) {
        if (selection !== "*") {
          for (const column of selection.split(",").map((value) => value.trim())) {
            assert.ok(columns[table]?.has(column), `${table}.${column} is not a migrated column`);
          }
        }
        return query;
      },
      eq() { return query; },
      maybeSingle() { return Promise.resolve({ data: rows[table] ?? null, error: null }); },
      order() { return Promise.resolve({ data: rows[table] ?? [], error: null }); },
    };
    return query;
  },
};

function load(relativePath) {
  const filename = path.resolve(relativePath);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(id) {
      if (id === "@/lib/supabaseServer") return { supabaseServer: supabase };
      if (id === "next/navigation") return { notFound: () => { throw notFound; } };
      if (id === "@/app/metadata") return { publicPageMetadata: (value) => value };
      if (id === "@/lib/p2w2DynamicRouteFixtures") {
        return { loadP2W2PostFixture: async () => null, loadP2W2TagFixture: async () => null };
      }
      if (id === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      if (id.endsWith("PageClient")) return { default: id };
      if (id.startsWith("@/lib/")) return load(`src/lib/${id.slice(6)}.ts`);
      throw new Error(`Unexpected import: ${id}`);
    },
  }, { filename });
  return exports;
}

const props = { params: Promise.resolve({ id: "contract-id" }) };
const postPage = load("src/app/[locale]/post/[id]/page.tsx");
const tagPage = load("src/app/[locale]/tag/[id]/page.tsx");
rows = {
  posts: { id: "contract-id", author_id: "owner", content: "Public post content" },
  profiles: { display_name: "Public author", username: "author", avatar_url: null },
  post_images: [{ url: "/pet.png", sort_order: 0 }],
};
assert.equal((await postPage.default(props)).props.profile.display_name, "Public author");
assert.equal((await postPage.generateMetadata(props)).description, "Public post content");
rows.profiles = null;
rows.post_images = [];
assert.equal((await postPage.default(props)).props.profile, null);

rows = {
  pets: { id: "contract-id", name: "Public pet", owner_id: "owner", birth_date: "2020-01-01" },
  profiles: { display_name: "Public owner", username: "owner", avatar_url: null },
};
assert.equal(typeof (await tagPage.default(props)).props.pet.age, "number");
assert.match((await tagPage.generateMetadata(props)).description, /Public pet.*Public owner/);
rows.pets.birth_date = null;
rows.profiles = null;
const incompletePet = (await tagPage.default(props)).props;
assert.equal(incompletePet.pet.age, null);
assert.equal(incompletePet.owner, null);

// RLS filters absent/private records to null; never fetch related data afterward.
for (const [page, table] of [[postPage, "posts"], [tagPage, "pets"]]) {
  rows = {};
  calls.length = 0;
  await assert.rejects(page.default(props), (error) => error === notFound);
  assert.deepEqual(calls, [table]);
  const metadata = await page.generateMetadata(props);
  assert.ok(!JSON.stringify(metadata).includes("Public owner"));
  assert.ok(!JSON.stringify(metadata).includes("Public post content"));
}

const { getPetAgeYears } = load("src/lib/petAge.ts");
const now = new Date("2026-10-12T15:00:00Z");
for (const [birthDate, expected] of [
  ["2020-10-12", 6], ["2020-10-13", 5], ["2020-10-11", 6],
  ["2026-10-12", 0], ["2026-10-13", null], ["2027-01-01", null],
  [null, null], [undefined, null], ["", null], ["invalid", null],
  ["2023-02-29", null], ["2020-13-01", null],
]) assert.equal(getPetAgeYears(birthDate, now), expected, String(birthDate));
assert.equal(getPetAgeYears("2024-02-29", new Date("2025-02-28T23:59:59Z")), 0);
assert.equal(getPetAgeYears("2024-02-29", new Date("2025-03-01T00:00:00Z")), 1);
assert.equal(getPetAgeYears("2020-10-12", new Date("2026-10-12T00:05:00+02:00")), 5);
assert.equal(getPetAgeYears("2020-10-12", new Date("invalid")), null);
console.log("Shared page data contract passed: migrated fields, metadata, absent/private guards, nullable data, and calendar age boundaries.");
