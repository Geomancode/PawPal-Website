import { readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const targets = [
  "src/app/profile/ProfileWorkspaceView.tsx",
  "src/app/admin/reports/ReportsClientParts.tsx",
  "src/app/[locale]/(streamed)/admin/park-risks/page.tsx",
  "src/app/[locale]/(streamed)/store/page.tsx",
  "src/app/[locale]/(streamed)/store/checkout/page.tsx",
];

// Every allowlist item must carry a local, line-specific reason. This batch
// intentionally resolves every hit, so the exact expected allowlist is empty.
const allowlist = new Map([]);

const numericUtilityPattern =
  /(^|[\s"])(-?(?:m[trblxy]?|p[trblxy]?|gap(?:-[xy])?|space-[xy]|w|h|min-w|max-w|min-h|max-h)-(?:[1-9][0-9]*(?:\.[0-9]+)?|px))(?=[^A-Za-z0-9_.-]|$)/g;

const observed = new Map();

for (const file of targets) {
  const source = await readFile(path.join(repoRoot, file), "utf8");
  source.split(/\r?\n/).forEach((line, index) => {
    numericUtilityPattern.lastIndex = 0;
    let match;
    let occurrence = 0;
    while ((match = numericUtilityPattern.exec(line)) !== null) {
      occurrence += 1;
      const token = match[2];
      const key = `${file}:${index + 1}:${occurrence}:${token}`;
      observed.set(key, line.trim());
    }
  });
}

const failures = [];
for (const [key, line] of observed) {
  if (!allowlist.has(key)) failures.push(`Unexpected numeric utility ${key}: ${line}`);
}
for (const [key, reason] of allowlist) {
  if (!observed.has(key)) failures.push(`Stale allowlist entry ${key}: ${reason}`);
  if (!String(reason).trim()) failures.push(`Allowlist entry ${key} has no reason.`);
}

if (failures.length > 0) {
  console.error("Token hotspot contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Token hotspot contract check passed.");
console.log(`Scanned ${targets.length} hotspot files with the P4E1f de-noised numeric utility regex.`);
console.log(`Observed ${observed.size} numeric utility hits; exact allowlist size ${allowlist.size}.`);
console.log("Natural zero/full/screen utilities remain outside the debt regex.");
