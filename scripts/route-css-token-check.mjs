import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  "src/app/styles/routes/home.css",
  "src/app/styles/routes/responsive.css",
  "src/app/styles/routes/globe.css",
  "src/app/styles/routes/home-responsive.css",
  "src/app/styles/routes/profile.css",
];

// Key format: file:line:occurrence:raw-value. Every exception must include a
// declaration-specific reason. This value-preserving batch needs no exception.
const allowlist = new Map([]);

const rawDimensionPattern = /-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|vh|vw)\b/g;
const observed = new Map();

for (const file of targets) {
  const source = await readFile(path.join(repoRoot, file), "utf8");
  source.split(/\r?\n/).forEach((line, index) => {
    if (/@media|@supports/.test(line) || /var\(--/.test(line) || /^\s*--/.test(line)) return;
    rawDimensionPattern.lastIndex = 0;
    let match;
    let occurrence = 0;
    while ((match = rawDimensionPattern.exec(line)) !== null) {
      occurrence += 1;
      const key = `${file}:${index + 1}:${occurrence}:${match[0]}`;
      observed.set(key, line.trim());
    }
  });
}

const failures = [];
for (const [key, line] of observed) {
  if (!allowlist.has(key)) failures.push(`Unexpected route CSS raw dimension ${key}: ${line}`);
}
for (const [key, reason] of allowlist) {
  if (!observed.has(key)) failures.push(`Stale allowlist entry ${key}: ${reason}`);
  if (!String(reason).trim()) failures.push(`Allowlist entry ${key} has no reason.`);
}

if (failures.length > 0) {
  console.error("Route CSS token contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Route CSS token contract check passed.");
console.log(`Scanned ${targets.length} TOP5 route CSS files with the P4E1g de-noised dimension regex.`);
console.log(`Observed ${observed.size} raw dimension hits; exact allowlist size ${allowlist.size}.`);
console.log("Allowlist stale-entry and non-empty-reason assertions passed.");
