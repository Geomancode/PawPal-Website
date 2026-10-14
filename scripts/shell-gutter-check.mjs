import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const srcRoot = path.join(repoRoot, "src");
const semanticGutter = /\bpx-paw-md\b.*\bsm:px-paw-xl\b.*\blg:px-paw-xxl\b/;
const shellMarker = /page-shell|min-h-screen|min-h-\[100dvh\]/;
const rawHorizontalPadding = /\bpx-[0-9]/;

const targets = [
  { file: "src/app/[locale]/(streamed)/auth/page.tsx", anchor: "auth-page-shell" },
  { file: "src/app/global-error.tsx", anchor: "deep-page-shell flex min-h-[100dvh]" },
  { file: "src/app/[locale]/not-found.tsx", anchor: "deep-page-shell min-h-[100dvh]" },
  { file: "src/app/group/[id]/GroupPageClient.tsx", anchor: "deep-page-shell bg-paw-page" },
  { file: "src/app/post/[id]/PostPageClient.tsx", anchor: "bg-paw-page px-paw-md pb-10" },
  { file: "src/app/profile/ProfileWorkspaceView.tsx", anchor: "mx-auto max-w-6xl" },
  { file: "src/app/[locale]/(streamed)/page.tsx", anchor: "grid min-w-0 max-w-7xl" },
  { file: "src/app/[locale]/(streamed)/dev/state-panel/page.tsx", anchor: "deep-page-shell min-h-[100dvh] bg-paw-page" },
  { file: "src/app/[locale]/(streamed)/store/success/page.tsx", anchor: "commerce-page-shell success-status-shell" },
  { file: "src/app/tag/[id]/TagPageClient.tsx", anchor: "relative min-h-[100dvh] overflow-hidden" },
  { file: "src/components/PublicRouteError.tsx", anchor: "deep-page-shell flex min-h-[100dvh]" },
  { file: "src/components/ui/StatePanel.tsx", anchor: "deep-page-shell flex min-h-[100dvh]" },
];

const toolShellAllowlist = new Map([
  [
    "src/app/[locale]/(streamed)/globe/page.tsx",
    "The globe loading shell is a fixed-purpose full-screen tool surface, not a content page gutter.",
  ],
  [
    "src/components/GlobeFullPage.tsx",
    "The interactive globe is a fixed full-screen canvas whose controls own their local spacing.",
  ],
]);

async function tsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(filePath);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [filePath] : [];
  }));
  return nested.flat().sort();
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

const failures = [];
const sources = new Map();
const scannedFiles = await tsxFiles(srcRoot);

for (const filePath of scannedFiles) {
  const file = relativePath(filePath);
  const source = await readFile(filePath, "utf8");
  sources.set(file, source);

  if (toolShellAllowlist.has(file)) continue;

  source.split(/\r?\n/).forEach((line, index) => {
    if (shellMarker.test(line) && rawHorizontalPadding.test(line)) {
      failures.push(`${file}:${index + 1} shell line contains raw horizontal padding: ${line.trim()}`);
    }
  });
}

for (const { file, anchor } of targets) {
  const source = sources.get(file);
  if (!source) {
    failures.push(`${file} is missing from the shell-gutter target manifest.`);
    continue;
  }

  const targetLines = source
    .split(/\r?\n/)
    .filter((line) => line.includes(anchor));
  if (targetLines.length !== 1) {
    failures.push(`${file} must contain exactly one page-gutter target matching ${JSON.stringify(anchor)}; found ${targetLines.length}.`);
  } else if (!semanticGutter.test(targetLines[0])) {
    failures.push(`${file} target line must contain the complete semantic page-gutter ladder.`);
  }
}

for (const [file, reason] of toolShellAllowlist) {
  if (!sources.has(file)) failures.push(`Tool-shell allowlist entry is missing: ${file} (${reason})`);
}

if (failures.length > 0) {
  console.error("Shell gutter contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Shell gutter contract check passed.");
console.log(`Scanned all ${scannedFiles.length} TSX files under src/.`);
console.log(`Verified ${targets.length} page-level containers use px-paw-md sm:px-paw-xl lg:px-paw-xxl.`);
console.log("Verified target shell lines contain no raw px-N utilities.");
console.log("Full-screen tool-shell allowlist:");
for (const [file, reason] of toolShellAllowlist) console.log(`- ${file}: ${reason}`);
