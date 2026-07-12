import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");

function source(file) {
  return readFileSync(join(repositoryRoot, file), "utf8");
}

const files = {
  panel: source("src/components/ui/StatePanel.tsx"),
  barrel: source("src/components/ui/index.ts"),
  loading: source("src/app/loading.tsx"),
  error: source("src/app/error.tsx"),
  profile: source("src/app/profile/page.tsx"),
  store: source("src/app/store/page.tsx"),
  harness: source("src/app/dev/state-panel/page.tsx"),
};

const failures = [];

function requireMatch(file, pattern, message) {
  if (!pattern.test(files[file])) failures.push(message);
}

function rejectMatch(file, pattern, message) {
  if (pattern.test(files[file])) failures.push(message);
}

requireMatch("panel", /StatePanelState\s*=\s*"loading"\s*\|\s*"empty"\s*\|\s*"error"/, "StatePanel must expose one loading | empty | error state union.");
requireMatch("panel", /state:\s*StatePanelState/, "StatePanel must require the single state prop.");
requireMatch("panel", /state === "error" \? "alert"/, "Error state must resolve to role=alert.");
requireMatch("panel", /state === "loading" \? "status"/, "Loading state must resolve to role=status.");
requireMatch("panel", /aria-busy=\{state === "loading" \? true : undefined\}/, "Loading state must expose aria-busy.");
requireMatch("panel", /className="loading-panel"/, "The branded loading-panel implementation must live in StatePanel.");
requireMatch("barrel", /export \{ default as StatePanel \} from "\.\/StatePanel";/, "StatePanel must be exported from the UI barrel.");

for (const route of ["loading", "error"]) {
  requireMatch(route, /import \{[^}]*StatePanel[^}]*\} from "@\/components\/ui";/s, `src/app/${route}.tsx must import StatePanel.`);
  requireMatch(route, /<StatePanel\b/, `src/app/${route}.tsx must render StatePanel.`);
}
rejectMatch("loading", /loading-panel/, "Root loading must not duplicate the loading-panel implementation.");
requireMatch("loading", /\{loader\}/, "Root loading must preserve the route translation loader.");
requireMatch("loading", /t\("pwaLoadingLabel"\)/, "Root loading must preserve pwaLoadingLabel.");
requireMatch("error", /reportError\(error,/, "Root error must preserve reportError.");
requireMatch("error", /onClick=\{reset\}/, "Root error must preserve reset retry behavior.");
requireMatch("error", /rootErrorPageTitle/, "Root error must preserve its existing title key.");
requireMatch("error", /rootErrorFallbackDescription/, "Root error must preserve its existing fallback key.");
requireMatch("error", /rootErrorTryAgain/, "Root error must preserve its existing retry key.");

rejectMatch("profile", /<Loader2\b/, "Profile full-screen loading must not use a bare Loader2.");
rejectMatch("profile", /paw-danger/, "Profile must use critical semantic tokens, not paw-danger.");
requireMatch("profile", /<StatePanel\s+state="loading"/, "Profile loading must use StatePanel.");
requireMatch("profile", /<StatePanel\s+state="error"/, "Profile unavailable must use StatePanel.");

// Contract boundary: full-screen loading/empty/error states use StatePanel;
// embedded subscription banners continue to use StatusMessage.
requireMatch("store", /<StatusMessage\s+tone="critical"\s+variant="compact">\s*\{error\}\s*<\/StatusMessage>/s, "Store subscription error must use compact critical StatusMessage.");
requireMatch("harness", /process\.env\.NODE_ENV !== "development"\) notFound\(\)/, "The state panel harness must return notFound outside development.");

if (failures.length > 0) {
  console.error("State contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("State contract check passed.");
console.log("Verified StatePanel state/role/loading-brand contract and barrel export.");
console.log("Verified root loading/error, Profile full-screen states, Store banner, and dev-only harness boundaries.");
