import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");

const sharedComponentFiles = [
  "src/components/ui/Button.tsx",
  "src/components/ui/Badge.tsx",
  "src/components/ui/Card.tsx",
  "src/components/ui/StatusMessage.tsx",
];

const literalAllowlist = [
  {
    file: "src/app/admin/park-risks/page.tsx",
    line: '<QueueMetric label={t("adminParkRisksReadyMetric")} value={counts.ready_for_review} tone="danger" />',
    reason: "QueueMetric keeps its local tone vocabulary until the E1j closeout batch.",
  },
  {
    file: "src/app/admin/reports/ReportsClientParts.tsx",
    line: '<QueueMetric label={t("adminReportsUsers")} value={counts.user} tone="danger" />',
    reason: "QueueMetric keeps its local tone vocabulary until the E1j closeout batch.",
  },
  {
    file: "src/app/tag/[id]/TagPageClient.tsx",
    line: '<InfoTile label={t("tagPageBloodLabel")} value={pet.blood_type ?? t("tagPageNotListed")} icon={Droplets} tone="danger" />',
    reason: "InfoTile keeps its local tone vocabulary until the E1j closeout batch.",
  },
];

function tsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const failures = [];

for (const file of sharedComponentFiles) {
  const source = readFileSync(join(repositoryRoot, file), "utf8");
  const forbidden = source.match(/\b(?:danger|destructive)\b/g) ?? [];
  if (forbidden.length > 0) {
    failures.push(`${file} contains forbidden shared tone literals: ${forbidden.join(", ")}`);
  }
}

const literalPattern = /\b(?:tone|variant)="(?:danger|destructive)"/g;
const actualLiterals = [];
for (const filePath of tsxFiles(join(repositoryRoot, "src"))) {
  const file = relative(repositoryRoot, filePath).split("\\").join("/");
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const matches = line.match(literalPattern) ?? [];
    for (const match of matches) {
      actualLiterals.push({ file, line: line.trim(), lineNumber: index + 1, match });
    }
  });
}

const unusedAllowlist = new Set(literalAllowlist);
for (const actual of actualLiterals) {
  const allowed = literalAllowlist.find(
    (entry) => entry.file === actual.file && entry.line === actual.line,
  );
  if (allowed) {
    unusedAllowlist.delete(allowed);
  } else {
    failures.push(
      `${actual.file}:${actual.lineNumber} has unapproved ${actual.match}: ${actual.line}`,
    );
  }
}

for (const entry of unusedAllowlist) {
  failures.push(`Allowlist entry is missing: ${entry.file}: ${entry.line} (${entry.reason})`);
}

if (failures.length > 0) {
  console.error("Tone contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Tone contract check passed.");
console.log("Shared components expose no danger/destructive literals.");
console.log(`Verified ${actualLiterals.length} explicit local-tone allowlist entries:`);
for (const entry of literalAllowlist) {
  console.log(`- ${entry.file}: ${entry.reason}`);
}
