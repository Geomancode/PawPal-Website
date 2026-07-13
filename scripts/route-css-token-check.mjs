import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routesRoot = path.join(repoRoot, "src/app/styles/routes");
const rawDimensionPattern = /-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|vh|vw)\b/g;

const paintGeometryProperties = new Set([
  "box-shadow",
  "text-shadow",
  "filter",
  "backdrop-filter",
  "background",
  "background-image",
  "background-size",
  "background-position",
  "mask",
  "mask-image",
  "mask-size",
  "mask-position",
]);

const borderHairlineProperties = new Set([
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-block",
  "border-block-start",
  "border-block-end",
  "border-inline",
  "border-inline-start",
  "border-inline-end",
  "border-width",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-block-width",
  "border-block-start-width",
  "border-block-end-width",
  "border-inline-width",
  "border-inline-start-width",
  "border-inline-end-width",
]);

// Key format: file:line:occurrence:raw-value. Every exception has a
// declaration-specific reason tied to that exact declaration.
const allowlist = new Map([
  [
    "src/app/styles/routes/home.css:427:1:6px",
    "The phone mockup uses a 6px chassis frame as illustration geometry, not layout spacing.",
  ],
  [
    "src/app/styles/routes/home.css:749:1:2px",
    "The product-tag connector uses a 2px drawn stroke that is intentionally heavier than a hairline.",
  ],
  [
    "src/app/styles/routes/home.css:1260:1:2px",
    "The static globe orbit uses a 2px illustrated path so it remains distinct from surrounding hairlines.",
  ],
  [
    "src/app/styles/routes/home.css:1439:1:2px",
    "The workflow route marker uses a 2px outline as part of the marker illustration.",
  ],
]);

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

async function discoverCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await discoverCssFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(entryPath);
  }
  return files;
}

function inspectCss(source, file) {
  const root = postcss.parse(source, { from: file });
  const observed = new Map();

  root.walkDecls((declaration) => {
    const property = declaration.prop.toLowerCase();
    if (property.startsWith("--") || paintGeometryProperties.has(property)) return;

    rawDimensionPattern.lastIndex = 0;
    let match;
    let occurrence = 0;
    while ((match = rawDimensionPattern.exec(declaration.value)) !== null) {
      occurrence += 1;
      const rawValue = match[0];
      if (rawValue === "0px") continue;
      if (borderHairlineProperties.has(property) && rawValue === "1px") continue;

      const line = declaration.source?.start?.line;
      if (!line) throw new Error(`PostCSS did not provide a source line for ${file} ${property}.`);
      const key = `${file}:${line}:${occurrence}:${rawValue}`;
      if (observed.has(key)) throw new Error(`Duplicate route CSS contract key ${key}.`);
      observed.set(key, {
        property,
        value: declaration.value,
      });
    }
  });

  return observed;
}

function assertSelfTest(condition, message) {
  if (!condition) throw new Error(`Route CSS token contract self-test failed: ${message}`);
}

function runSelfTest() {
  const syntheticCss = `
.mixed { padding: 12px var(--x); }
.fallback { width: var(--fake, 420px); }
.paint {
  box-shadow:
    0 2px 4px var(--shadow-color);
}
.hairline { border: 1px solid var(--border-color); }
.thick { border: 2px solid var(--border-color); }
:root { --def: 24px; }
.zero { padding-bottom: env(safe-area-inset-bottom, 0px); }
`;
  const observed = inspectCss(syntheticCss, "self-test.css");
  const hits = [...observed.entries()];

  assertSelfTest(
    hits.some(([key, hit]) => key.endsWith(":1:12px") && hit.property === "padding"),
    "mixed declarations must expose raw dimensions before var() references.",
  );
  assertSelfTest(
    hits.some(([key, hit]) => key.endsWith(":1:420px") && hit.property === "width"),
    "var() fallback dimensions must be scanned.",
  );
  assertSelfTest(
    hits.some(([key, hit]) => key.endsWith(":1:2px") && hit.property === "border"),
    "2px borders must not receive the hairline exemption.",
  );
  assertSelfTest(
    !hits.some(([, hit]) => hit.property === "box-shadow"),
    "multiline box-shadow declarations must receive the exact-property paint exemption.",
  );
  assertSelfTest(
    !hits.some(([key]) => key.endsWith(":1:1px")),
    "1px borders must receive the hairline exemption.",
  );
  assertSelfTest(
    !hits.some(([key]) => key.endsWith(":1:24px")),
    "custom property definitions must be skipped.",
  );
  assertSelfTest(
    !hits.some(([key]) => key.endsWith(":1:0px")),
    "exact 0px fallback values must receive the zero exemption.",
  );
  assertSelfTest(hits.length === 3, `expected exactly 3 synthetic hits, observed ${hits.length}.`);

  console.log("Route CSS token contract self-test passed (8 assertions).");
}

async function scanRepository() {
  const targets = await discoverCssFiles(routesRoot);
  const observed = new Map();

  for (const target of targets) {
    const file = toRepoPath(target);
    const source = await readFile(target, "utf8");
    for (const [key, hit] of inspectCss(source, file)) observed.set(key, hit);
  }

  const failures = [];
  for (const [key, hit] of observed) {
    if (!allowlist.has(key)) {
      failures.push(`Unexpected route CSS raw dimension ${key} (${hit.property}: ${hit.value})`);
    }
  }
  for (const [key, reason] of allowlist) {
    if (!observed.has(key)) failures.push(`Stale allowlist entry ${key}: ${reason}`);
    if (!String(reason).trim()) failures.push(`Allowlist entry ${key} has no reason.`);
  }

  if (failures.length > 0) {
    console.error("Route CSS token contract check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log("Route CSS token contract check passed.");
  console.log(`Dynamically scanned ${targets.length} route CSS files with PostCSS AST.`);
  console.log(`Observed ${observed.size} non-exempt raw dimension hits; exact allowlist size ${allowlist.size}.`);
  console.log("Allowlist stale-entry and non-empty-reason assertions passed.");
}

try {
  runSelfTest();
  if (!process.argv.includes("--self-test")) await scanRepository();
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
}
