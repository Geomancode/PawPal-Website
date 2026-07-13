import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(repoRoot, "src");
const iconModulePath = "src/components/icons/PawIcon.tsx";

const semanticIconMap = {
  info: "Info",
  success: "CheckCircle2",
  warning: "TriangleAlert",
  critical: "AlertCircle",
  empty: "Inbox",
  live: "Radio",
  close: "X",
  menu: "Menu",
  forward: "ArrowRight",
  home: "Home",
  map: "Map",
  account: "UserCircle",
  logout: "LogOut",
  retry: "RotateCcw",
  mail: "Mail",
  nfcScan: "ScanLine",
  appLink: "Smartphone",
  check: "Check",
  cart: "ShoppingBag",
  star: "Star",
  health: "HeartPulse",
  shield: "ShieldCheck",
  spinner: "Loader2",
  search: "Search",
  shipping: "Truck",
  save: "Save",
  package: "Package",
  receipt: "Receipt",
  back: "ArrowLeft",
  add: "Plus",
  sparkle: "Sparkles",
  subtract: "Minus",
  refresh: "RefreshCw",
  packageAdd: "PackagePlus",
  location: "MapPin",
  secure: "Lock",
  payment: "CreditCard",
  imageAdd: "ImagePlus",
  upload: "UploadCloud",
  externalLink: "ExternalLink",
  delete: "Trash2",
  dumbbell: "Dumbbell",
  tags: "Tags",
  crown: "Crown",
  filters: "SlidersHorizontal",
  clock: "Clock",
  basket: "ShoppingCart",
  bone: "Bone",
  chevronUp: "ChevronUp",
  chevronRight: "ChevronRight",
  chevronDown: "ChevronDown",
  navigate: "Navigation",
  humidity: "Droplets",
  wind: "Wind",
  dog: "Dog",
  offline: "WifiOff",
  snow: "CloudSnow",
  community: "Users",
  rain: "CloudRain",
  temperature: "Thermometer",
  storm: "CloudLightning",
  sun: "Sun",
  fog: "CloudFog",
  shop: "Store",
  cloud: "Cloud",
  route: "Route",
  chevronLeft: "ChevronLeft",
  paw: "PawPrint",
  confirm: "CheckCircle",
  chat: "MessageCircle",
  assistant: "Bot",
  privacy: "LockKeyhole",
  guide: "BookOpen",
  support: "LifeBuoy",
  care: "HeartHandshake",
  language: "Languages",
  footprints: "Footprints",
  fileApproved: "FileCheck2",
  document: "FileText",
  dismiss: "XCircle",
  edit: "Edit3",
  profile: "UserCircle2",
  download: "Download",
  safetyAlert: "ShieldAlert",
  checklist: "ClipboardList",
  safety: "Shield",
  calendar: "Calendar",
  addCircle: "PlusCircle",
  notifyActive: "BellRing",
  nfc: "Nfc",
  notifyOff: "BellOff",
  comment: "MessageSquare",
  notify: "Bell",
  globe: "Globe2",
  ban: "Ban",
  award: "Award",
  locationPinned: "MapPinned",
  verified: "BadgeCheck",
  commentWarning: "MessageSquareWarning",
  schedule: "Clock3",
  phone: "Phone",
  cookie: "Cookie",
  receiptDetail: "ReceiptText",
  database: "Database",
  legal: "Scale",
  show: "Eye",
  share: "Share2",
  hide: "EyeOff",
  emergency: "Siren",
  flag: "Flag",
  thumbsUp: "ThumbsUp",
  world: "Globe",
  user: "User",
  education: "GraduationCap",
  person: "UserRound",
  partnership: "Handshake",
  people: "UsersRound",
  heart: "Heart",
  energy: "Zap",
};

const migratedFiles = [
  "src/app/error.tsx",
  "src/app/not-found.tsx",
  "src/components/Footer.tsx",
  "src/components/Navbar.tsx",
  "src/components/ui/AppDeepLinkButton.tsx",
  "src/components/ui/CheckoutStep.tsx",
  "src/components/ui/NfcIdentityCard.tsx",
  "src/components/ui/ProductCard.tsx",
  "src/components/ui/Sheet.tsx",
  "src/components/ui/StatePanel.tsx",
  "src/components/ui/StatusMessage.tsx",
  "src/app/store/admin/page.tsx",
  "src/app/store/checkout/page.tsx",
  "src/app/store/orders/page.tsx",
  "src/app/store/page.tsx",
  "src/app/store/success/page.tsx",
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
  "src/app/admin/park-risks/page.tsx",
  "src/app/admin/reports/ReportsClientParts.tsx",
  "src/app/profile/ProfileWorkspaceView.tsx",
  "src/app/profile/PushSubscriptionSettings.tsx",
  "src/app/globe/page.tsx",
  "src/app/dev/state-panel/page.tsx",
  "src/app/about/page.tsx",
  "src/app/auth/page.tsx",
  "src/app/global-error.tsx",
  "src/app/group/[id]/GroupPageClient.tsx",
  "src/app/guidelines/page.tsx",
  "src/app/help/page.tsx",
  "src/app/post/[id]/PostPageClient.tsx",
  "src/app/privacy/page.tsx",
  "src/app/tag/[id]/TagPageClient.tsx",
  "src/app/terms/page.tsx",
  "src/app/user/[id]/UserPageClient.tsx",
];

// Explicit migration debt. This set is bidirectional: adding or removing a direct
// lucide-react import requires updating the list in the same governance change.
const pendingFiles = [];

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const directLucideImport = /\bfrom\s*["']lucide-react["']/;

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
  if (unexpected.length > 0 || missing.length > 0) {
    fail(
      `${label} differs from its contract` +
        `${unexpected.length ? `\n  unexpected: ${unexpected.join(", ")}` : ""}` +
        `${missing.length ? `\n  missing: ${missing.join(", ")}` : ""}`,
    );
  }
}

const sourceFiles = await walk(srcRoot);
const directImportFiles = [];
for (const filePath of sourceFiles) {
  const source = await readFile(filePath, "utf8");
  if (directLucideImport.test(source)) directImportFiles.push(relativePath(filePath));
}
directImportFiles.sort();

const iconLayerImports = directImportFiles.filter((filePath) =>
  filePath.startsWith("src/components/icons/"),
);
const actualPendingFiles = directImportFiles.filter(
  (filePath) => !filePath.startsWith("src/components/icons/"),
);

compareExactSet("semantic icon layer imports", iconLayerImports, [iconModulePath]);
compareExactSet("pending direct-import files", actualPendingFiles, pendingFiles);

const migratedRegressions = migratedFiles.filter((filePath) => directImportFiles.includes(filePath));
if (migratedRegressions.length > 0) {
  fail(`migrated files import lucide-react directly: ${migratedRegressions.join(", ")}`);
}

const iconModuleSource = await readFile(path.join(repoRoot, iconModulePath), "utf8");
const mapStart = iconModuleSource.indexOf("const semanticIconMap = {");
const mapEndMarker = "} satisfies Record<PawIconName, LucideIcon>;";
const mapEnd = iconModuleSource.indexOf(mapEndMarker, mapStart);
if (mapStart === -1 || mapEnd === -1) {
  fail("could not locate semanticIconMap in PawIcon.tsx");
} else {
  const mapSource = iconModuleSource.slice(mapStart, mapEnd);
  const actualSemanticMap = Object.fromEntries(
    [...mapSource.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):\s*([A-Za-z][A-Za-z0-9]*),$/gm)].map(
      ([, semanticName, glyphName]) => [semanticName, glyphName],
    ),
  );
  compareExactSet(
    "semantic icon names",
    Object.keys(actualSemanticMap),
    Object.keys(semanticIconMap),
  );
  for (const [semanticName, glyphName] of Object.entries(semanticIconMap)) {
    if (actualSemanticMap[semanticName] !== glyphName) {
      fail(
        `semantic mapping ${semanticName} must use ${glyphName}, got ${String(actualSemanticMap[semanticName])}`,
      );
    }
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(
  `icon contract PASS: 119 fixed semantic mappings; 43 migrated files; ` +
    `${pendingFiles.length} exact pending files; ${directImportFiles.length} total direct-import files.`,
);
