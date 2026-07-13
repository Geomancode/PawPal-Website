import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roundedGlyphRoot = path.join(
  repoRoot,
  "node_modules",
  "@material-symbols",
  "svg-400",
  "rounded",
);
const outputPath = path.join(
  repoRoot,
  "src",
  "components",
  "icons",
  "material-glyphs.generated.tsx",
);

// Single source of truth for PawPal semantics -> Material Symbols Rounded glyphs.
const semanticGlyphMap = {
  info: "info",
  success: "check_circle",
  warning: "warning",
  critical: "error",
  empty: "inbox",
  live: "sensors",
  close: "close",
  menu: "menu",
  forward: "arrow_forward",
  home: "home",
  map: "map",
  account: "account_circle",
  logout: "logout",
  retry: "replay",
  mail: "mail",
  nfcScan: "contactless",
  appLink: "mobile_2",
  check: "check",
  cart: "shopping_bag",
  star: "star",
  health: "ecg_heart",
  shield: "verified_user",
  spinner: "progress_activity",
  search: "search",
  shipping: "local_shipping",
  save: "save",
  package: "package_2",
  receipt: "receipt",
  back: "arrow_back",
  add: "add",
  sparkle: "stars_2",
  subtract: "remove",
  refresh: "refresh",
  packageAdd: "add_box",
  location: "location_on",
  secure: "lock",
  payment: "credit_card",
  imageAdd: "add_photo_alternate",
  upload: "cloud_upload",
  externalLink: "open_in_new",
  delete: "delete",
  dumbbell: "fitness_center",
  tags: "sell",
  crown: "crown",
  filters: "tune",
  clock: "schedule",
  basket: "shopping_cart",
  bone: "pet_supplies",
  chevronUp: "keyboard_arrow_up",
  chevronRight: "chevron_right",
  chevronDown: "keyboard_arrow_down",
  navigate: "navigation",
  humidity: "humidity_percentage",
  wind: "air",
  dog: "sound_detection_dog_barking",
  offline: "wifi_off",
  snow: "weather_snowy",
  community: "group",
  rain: "rainy",
  temperature: "device_thermostat",
  storm: "thunderstorm",
  sun: "sunny",
  fog: "foggy",
  shop: "storefront",
  cloud: "cloud",
  route: "route",
  chevronLeft: "chevron_left",
  paw: "pets",
  confirm: "check_circle",
  chat: "chat_bubble",
  assistant: "smart_toy",
  privacy: "shield_lock",
  guide: "menu_book",
  support: "support",
  care: "volunteer_activism",
  language: "translate",
  footprints: "footprint",
  fileApproved: "task",
  document: "description",
  dismiss: "cancel",
  edit: "edit",
  profile: "account_circle",
  download: "download",
  safetyAlert: "gpp_maybe",
  checklist: "checklist",
  safety: "shield",
  calendar: "calendar_month",
  addCircle: "add_circle",
  notifyActive: "notifications_active",
  nfc: "nfc",
  notifyOff: "notifications_off",
  comment: "chat",
  notify: "notifications",
  globe: "public",
  ban: "block",
  award: "workspace_premium",
  locationPinned: "pin_drop",
  verified: "verified",
  commentWarning: "feedback",
  schedule: "schedule",
  phone: "call",
  cookie: "cookie",
  receiptDetail: "receipt_long",
  database: "database",
  legal: "balance",
  show: "visibility",
  share: "share",
  hide: "visibility_off",
  emergency: "e911_emergency",
  flag: "flag",
  thumbsUp: "thumb_up",
  world: "globe",
  user: "person",
  education: "school",
  person: "person",
  partnership: "handshake",
  people: "groups",
  heart: "favorite",
  energy: "bolt",
};

async function loadGlyph(symbolName) {
  const filePath = path.join(roundedGlyphRoot, `${symbolName}-fill.svg`);
  try {
    const source = await readFile(filePath, "utf8");
    if (!source.includes('viewBox="0 -960 960 960"')) {
      throw new Error(`unexpected viewBox in ${filePath}`);
    }
    const paths = [...source.matchAll(/<path\s+[^>]*d="([^"]+)"[^>]*\/?\s*>/g)];
    if (paths.length !== 1) {
      throw new Error(`expected exactly one path in ${filePath}, found ${paths.length}`);
    }
    return paths[0][1];
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const sortedMappings = Object.entries(semanticGlyphMap).sort(([left], [right]) =>
  left.localeCompare(right),
);
const symbolNames = [...new Set(sortedMappings.map(([, symbolName]) => symbolName))].sort();
const pathBySymbol = new Map();
const missingSymbols = [];

for (const symbolName of symbolNames) {
  const pathData = await loadGlyph(symbolName);
  if (pathData === null) {
    missingSymbols.push(symbolName);
  } else {
    pathBySymbol.set(symbolName, pathData);
  }
}

if (missingSymbols.length > 0) {
  console.error("material glyph generation failed: missing rounded fill SVGs");
  for (const symbolName of missingSymbols) {
    console.error(`- ${symbolName}: rounded/${symbolName}-fill.svg`);
  }
  process.exit(1);
}

const symbolIndex = new Map(symbolNames.map((symbolName, index) => [symbolName, index]));
const pathEntries = symbolNames.map(
  (symbolName) => `  ${JSON.stringify(pathBySymbol.get(symbolName))},`,
);

const mapEntries = sortedMappings.map(
  ([semanticName, symbolName]) =>
    `  ${semanticName}: glyphComponents[${symbolIndex.get(symbolName)}],`,
);

const output = `// Generated by scripts/generate-material-glyphs.mjs. Do not edit manually.
import type { ComponentPropsWithoutRef, ComponentType } from "react";

export type MaterialGlyphProps = ComponentPropsWithoutRef<"svg">;
export type MaterialGlyphComponent = ComponentType<MaterialGlyphProps>;

function createMaterialGlyph(pathData: string): MaterialGlyphComponent {
  return function MaterialGlyph(props: MaterialGlyphProps) {
    return (
      <svg
        viewBox="0 -960 960 960"
        width={24}
        height={24}
        fill="currentColor"
        {...props}
      >
        <path d={pathData} />
      </svg>
    );
  };
}

const glyphPaths = [
${pathEntries.join("\n")}
] as const;

const glyphComponents = glyphPaths.map(createMaterialGlyph);

export const materialGlyphs = {
${mapEntries.join("\n")}
} satisfies Record<string, MaterialGlyphComponent>;
`;

await writeFile(outputPath, output, "utf8");
console.log(
  `generated ${sortedMappings.length} semantic mappings from ${symbolNames.length} rounded fill glyphs`,
);
