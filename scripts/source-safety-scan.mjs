import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Keep the existing CI checks, but never print the matched source or credential.
const rules = [
  ["raw-supabase-rest", /supabase\.co\/rest\/v1/],
  ["possible-server-secret", /sk_live_[A-Za-z0-9_]+|sk_test_[A-Za-z0-9_]+|sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
];

export function scanSourceFiles(root) {
  const findings = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Source scan refuses symlinks");
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        fs.readFileSync(filename, "utf8").split(/\r?\n/).forEach((line, index) => {
          for (const [rule, pattern] of rules) if (pattern.test(line)) {
            findings.push({ path: path.relative(root, filename), line: index + 1, rule });
          }
        });
      }
    }
  }
  visit(root);
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, "../src"));
    const findings = scanSourceFiles(root);
    console.log(JSON.stringify({ passed: findings.length === 0, findings }));
    process.exitCode = findings.length === 0 ? 0 : 1;
  } catch {
    console.error("Source safety scan could not complete; no source content was printed.");
    process.exitCode = 2;
  }
}
