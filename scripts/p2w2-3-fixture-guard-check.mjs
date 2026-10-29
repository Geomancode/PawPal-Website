import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const checks = [
  {
    file: "src/lib/p2w2DynamicRouteFixtures.ts",
    patterns: [
      "P2W2_DYNAMIC_ROUTE_FIXTURES",
      "process.env.NODE_ENV === \"production\"",
      "return false",
      "readP2W2DynamicRouteFixtureData",
    ],
  },
  {
    file: "src/app/[locale]/tag/[id]/page.tsx",
    patterns: ["loadP2W2TagFixture", "if (fixture) return fixture"],
  },
  {
    file: "src/app/[locale]/post/[id]/page.tsx",
    patterns: ["loadP2W2PostFixture", "if (fixture) return fixture"],
  },
  {
    file: "src/app/[locale]/group/[id]/page.tsx",
    patterns: ["loadP2W2GroupFixture", "if (fixture) return fixture"],
  },
  {
    file: "src/app/[locale]/user/[id]/page.tsx",
    patterns: ["loadP2W2UserFixture", "if (fixture) return { ...fixture, isPublic: true }"],
  },
  {
    file: "src/lib/fixtures/p2w2-dynamic-route-fixtures.json",
    patterns: [
      "p2w2-tag-contact-visible",
      "p2w2-tag-contact-hidden",
      "p2w2-tag-missing-avatar",
      "p2w2-tag-long-name",
      "p2w2-tag-long-breed",
      "p2w2-tag-no-health-notes",
      "p2w2-tag-dark",
      "p2w2-post-populated",
      "p2w2-group-populated",
      "p2w2-user-populated",
      "p2w2-pet-populated",
    ],
  },
];

for (const check of checks) {
  const content = fs.readFileSync(path.join(repoRoot, check.file), "utf8");
  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      throw new Error(`${check.file} is missing required fixture guard pattern: ${pattern}`);
    }
  }
}

const routeFiles = [
  "src/app/[locale]/tag/[id]/page.tsx",
  "src/app/[locale]/post/[id]/page.tsx",
  "src/app/[locale]/group/[id]/page.tsx",
  "src/app/[locale]/user/[id]/page.tsx",
  "src/app/[locale]/(streamed)/pet/[id]/page.tsx",
];

for (const routeFile of routeFiles) {
  const content = fs.readFileSync(path.join(repoRoot, routeFile), "utf8");
  if (content.includes("p2w2-dynamic-route-fixtures.json")) {
    throw new Error(`${routeFile} must not statically import the fixture JSON file`);
  }
}

console.log("P2W2-3 fixture guard contract passed.");
