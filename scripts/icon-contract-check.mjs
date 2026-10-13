import { execFile as execFileCallback } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(repoRoot, "src");
const iconModulePath = "src/components/icons/PawIcon.tsx";
const generatedModulePath = "src/components/icons/material-glyphs.generated.tsx";
const generatorPath = "scripts/generate-material-glyphs.mjs";

const migratedFiles = [
  "src/app/[locale]/error.tsx",
  "src/app/[locale]/not-found.tsx",
  "src/components/Footer.tsx",
  "src/components/Navbar.tsx",
  "src/components/ui/AppDeepLinkButton.tsx",
  "src/components/ui/CheckoutStep.tsx",
  "src/components/ui/NfcIdentityCard.tsx",
  "src/components/ui/ProductCard.tsx",
  "src/components/ui/Sheet.tsx",
  "src/components/ui/StatePanel.tsx",
  "src/components/ui/StatusMessage.tsx",
  "src/app/[locale]/store/admin/page.tsx",
  "src/app/[locale]/store/checkout/page.tsx",
  "src/app/[locale]/store/orders/page.tsx",
  "src/app/[locale]/store/page.tsx",
  "src/app/[locale]/store/success/page.tsx",
  "src/components/GlobeTutorial.tsx",
  "src/components/CookieConsentBanner.tsx",
  "src/components/ChatBubble.tsx",
  "src/components/GlobeStaticPreview.tsx",
  "src/components/HomeClientParts.tsx",
  "src/components/PublicRouteError.tsx",
  "src/components/ChatBottomSheet.tsx",
  "src/components/GlobeFullPage.tsx",
  "src/components/WeatherTicker.tsx",
  "src/components/ui/EmptyState.tsx",
  "src/app/[locale]/admin/park-risks/page.tsx",
  "src/app/admin/reports/ReportsClientParts.tsx",
  "src/app/profile/ProfileWorkspaceView.tsx",
  "src/app/profile/PushSubscriptionSettings.tsx",
  "src/app/[locale]/globe/page.tsx",
  "src/app/[locale]/dev/state-panel/page.tsx",
  "src/app/[locale]/about/page.tsx",
  "src/app/[locale]/auth/page.tsx",
  "src/app/global-error.tsx",
  "src/app/group/[id]/GroupPageClient.tsx",
  "src/app/[locale]/guidelines/page.tsx",
  "src/app/[locale]/help/page.tsx",
  "src/app/post/[id]/PostPageClient.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/tag/[id]/TagPageClient.tsx",
  "src/app/[locale]/terms/page.tsx",
  "src/app/user/[id]/UserPageClient.tsx",
];

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);

function fail(message) {
  console.error(`icon contract FAIL: ${message}`);
  process.exitCode = 1;
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(entryPath);
      return sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

function compareExactSet(label, actualValues, expectedValues) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const unexpected = [...actual].filter((value) => !expected.has(value)).sort();
  const missing = [...expected].filter((value) => !actual.has(value)).sort();
  if (unexpected.length > 0 || missing.length > 0 || actual.size !== actualValues.length) {
    fail(
      `${label} differs from its contract` +
        `${unexpected.length ? `\n  unexpected: ${unexpected.join(", ")}` : ""}` +
        `${missing.length ? `\n  missing: ${missing.join(", ")}` : ""}` +
        `${actual.size !== actualValues.length ? "\n  duplicate values found" : ""}`,
    );
  }
}

const generatedAbsolutePath = path.join(repoRoot, generatedModulePath);
let generatedBefore;
try {
  generatedBefore = await readFile(generatedAbsolutePath, "utf8");
  await execFile(process.execPath, [path.join(repoRoot, generatorPath)], { cwd: repoRoot });
  const generatedAfter = await readFile(generatedAbsolutePath, "utf8");
  if (generatedAfter !== generatedBefore) {
    fail(`${generatedModulePath} drifted when ${generatorPath} was rerun`);
  }
} catch (error) {
  const details = [error?.message, error?.stdout, error?.stderr].filter(Boolean).join("\n");
  fail(`could not run deterministic glyph generation\n${details}`);
}

const sourceFiles = await walk(srcRoot);
const noLegacyGlyphScanPaths = [
  ...sourceFiles,
  path.join(repoRoot, "package.json"),
  path.join(repoRoot, "package-lock.json"),
];
const legacyGlyphMatches = [];
for (const filePath of noLegacyGlyphScanPaths) {
  const source = await readFile(filePath, "utf8");
  if (/lucide/i.test(source)) legacyGlyphMatches.push(relativePath(filePath));
}
if (legacyGlyphMatches.length > 0) {
  fail(`legacy glyph dependency remains in: ${legacyGlyphMatches.sort().join(", ")}`);
}

const missingMigratedFiles = [];
for (const migratedFile of migratedFiles) {
  try {
    await readFile(path.join(repoRoot, migratedFile), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") missingMigratedFiles.push(migratedFile);
    else throw error;
  }
}
if (missingMigratedFiles.length > 0) {
  fail(`migrated icon files disappeared: ${missingMigratedFiles.join(", ")}`);
}

const iconModuleSource = await readFile(path.join(repoRoot, iconModulePath), "utf8");
const generatedModuleSource = await readFile(generatedAbsolutePath, "utf8");
const iconImports = [...iconModuleSource.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map(
  ([, moduleName]) => moduleName,
);
compareExactSet("PawIcon imports", iconImports, ["react", "./material-glyphs.generated"]);
if (
  !iconModuleSource.includes(
    'import type { MaterialGlyphComponent } from "./material-glyphs.generated";',
  )
) {
  fail("PawIcon must import its glyph component type from material-glyphs.generated");
}
if (!iconModuleSource.includes("export type PawIconComponent = MaterialGlyphComponent;")) {
  fail("PawIconComponent must use the generated component type");
}
if (
  !iconModuleSource.includes(
    'const materialGlyphModule = import("./material-glyphs.generated");',
  ) ||
  !iconModuleSource.includes("default: materialGlyphs[name]") ||
  !iconModuleSource.includes("const semanticIconMap = new Proxy(")
) {
  fail("PawIcon semantic map must be backed only by deferred generated materialGlyphs");
}

const generatedConsumers = [];
for (const filePath of sourceFiles) {
  if (filePath === generatedAbsolutePath) continue;
  const source = await readFile(filePath, "utf8");
  if (source.includes("material-glyphs.generated")) {
    generatedConsumers.push(relativePath(filePath));
  }
}
compareExactSet("generated glyph consumers", generatedConsumers, [iconModulePath]);

const unionStart = iconModuleSource.indexOf("export type PawIconName =");
const unionEnd = iconModuleSource.indexOf(";", unionStart);
if (unionStart === -1 || unionEnd === -1) {
  fail("could not locate PawIconName union");
}
const unionNames = [...iconModuleSource.slice(unionStart, unionEnd).matchAll(/\|\s*"([^"]+)"/g)].map(
  ([, semanticName]) => semanticName,
);

const generatedMapStart = generatedModuleSource.indexOf("export const materialGlyphs = {");
const generatedMapEnd = generatedModuleSource.indexOf(
  "} satisfies Record<string, MaterialGlyphComponent>;",
  generatedMapStart,
);
if (generatedMapStart === -1 || generatedMapEnd === -1) {
  fail("could not locate generated materialGlyphs map");
}
const generatedNames = [
  ...generatedModuleSource
    .slice(generatedMapStart, generatedMapEnd)
    .matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):\s*glyphComponents\[\d+\],$/gm),
].map(([, semanticName]) => semanticName);

compareExactSet("semantic icon names", generatedNames, unionNames);
if (unionNames.length !== 119) {
  fail(`expected 119 semantic icon names, found ${unionNames.length}`);
}

const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const materialVersion = packageJson.devDependencies?.["@material-symbols/svg-400"];
if (!/^\d+\.\d+\.\d+$/.test(materialVersion ?? "")) {
  fail("@material-symbols/svg-400 must be an exact pinned devDependency");
}
if (packageJson.scripts?.["generate:glyphs"] !== "node scripts/generate-material-glyphs.mjs") {
  fail("generate:glyphs script is missing or incorrect");
}

if (process.exitCode) process.exit(process.exitCode);
console.log(
  `icon contract PASS: 119 fixed semantic mappings; ${migratedFiles.length} migrated files; ` +
    "0 legacy glyph matches; deterministic rounded fill generation.",
);
