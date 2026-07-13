import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const uiRoot = path.join(repoRoot, "src", "components", "ui");
const defaultSizeUtility = /(^|[^A-Za-z0-9_-])text-(xs|sm|base|lg|xl|[2-9]xl)(?=[^A-Za-z0-9_-]|$)/g;
const migratedRouteFiles = [
  "src/app/profile/ProfileWorkspaceView.tsx",
  "src/app/admin/park-risks/page.tsx",
  "src/app/store/checkout/page.tsx",
  "src/app/store/page.tsx",
  "src/app/admin/reports/ReportsClientParts.tsx",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function tsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [absolutePath] : [];
  }));
  return nested.flat().sort();
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

async function assertUiUtilities() {
  const offenders = [];
  for (const filePath of await tsxFiles(uiRoot)) {
    const source = await readFile(filePath, "utf8");
    for (const match of source.matchAll(defaultSizeUtility)) {
      offenders.push(
        `${path.relative(repoRoot, filePath)}:${lineNumber(source, match.index)} (${match[0].trim()})`,
      );
    }
  }
  assert(
    offenders.length === 0,
    `Default Tailwind font-size utilities remain in shared UI:\n${offenders.join("\n")}`,
  );
  console.log("PASS ui typography: no default Tailwind font-size utilities in src/components/ui/*.tsx");
}

async function assertMigratedRouteUtilities() {
  assert(
    migratedRouteFiles.length >= 5,
    "migratedRouteFiles lost required coverage; removing a migrated route entry is stale.",
  );
  const offenders = [];
  for (const relativeFilePath of migratedRouteFiles) {
    const source = await readFile(path.join(repoRoot, relativeFilePath), "utf8");
    for (const match of source.matchAll(defaultSizeUtility)) {
      offenders.push(
        `${relativeFilePath}:${lineNumber(source, match.index)} (${match[0].trim()})`,
      );
    }
  }
  assert(
    offenders.length === 0,
    `Default Tailwind font-size utilities remain in migrated routes:\n${offenders.join("\n")}`,
  );
  console.log(
    `PASS migrated route typography: ${migratedRouteFiles.length} files contain no default Tailwind font-size utilities`,
  );
}

async function assertFontLoader() {
  const layout = await readFile(path.join(repoRoot, "src", "app", "layout.tsx"), "utf8");
  assert(
    /import\s+\{\s*Nunito_Sans\s*\}\s+from\s+["']next\/font\/google["']/.test(layout),
    "src/app/layout.tsx must import Nunito_Sans from next/font/google.",
  );
  const binding = layout.match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*Nunito_Sans\s*\(/)?.[1];
  assert(binding, "src/app/layout.tsx must instantiate Nunito_Sans.");
  assert(
    /variable:\s*["']--font-nunito-sans["']/.test(layout),
    "Nunito_Sans must expose --font-nunito-sans.",
  );
  const htmlTag = layout.match(/<html[\s\S]*?>/)?.[0] ?? "";
  assert(
    htmlTag.includes(`${binding}.variable`),
    `The <html> className must bind ${binding}.variable.`,
  );
  console.log("PASS font loader: next/font/google Nunito_Sans variable is bound on <html>");
}

async function assertTokenBinding() {
  const tokens = await readFile(path.join(repoRoot, "src", "app", "styles", "tokens.css"), "utf8");
  assert(
    /--font-sans:\s*var\(--font-nunito-sans\)/.test(tokens),
    "tokens.css --font-sans must start with var(--font-nunito-sans).",
  );
  console.log("PASS font token: --font-sans references --font-nunito-sans");
}

await assertMigratedRouteUtilities();
await assertUiUtilities();
await assertFontLoader();
await assertTokenBinding();
console.log("Typography/font contract passed.");
