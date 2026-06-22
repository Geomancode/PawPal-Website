import { access, readFile } from "node:fs/promises";

const checks = [];

function expect(condition, message) {
  checks.push({ ok: Boolean(condition), message });
}

function hasRouteLink(source, href, label) {
  const pattern = new RegExp(`<Link[^>]+href=["']${href}["'][\\s\\S]*?${label}`);
  return pattern.test(source);
}

const [
  home,
  navbar,
  footer,
  manifestText,
  serviceWorker,
  pwaRuntime,
  globeComponent,
  mapMarker,
  weatherTicker,
  globalStyles,
] = await Promise.all([
  readFile(new URL("../src/components/HomeClientParts.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/Navbar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/Footer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  readFile(new URL("../src/components/PwaRuntime.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/GlobeComponent.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/createPawPalMapMarkerElement.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/WeatherTicker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
]);

const manifest = JSON.parse(manifestText);
const shortcutUrls = new Set((manifest.shortcuts ?? []).map((shortcut) => shortcut.url));

expect(
  home.includes('aria-label="PawPal pet safety for every walk"') &&
    home.includes("PawPal pet safety") &&
    home.includes("for every walk"),
  "Homepage H1 keeps the readable product headline.",
);
expect(hasRouteLink(home, "/globe", "Open Live Map"), "Hero keeps Open Live Map -> /globe.");
expect(hasRouteLink(home, "/store", "Shop Smart Tags"), "Hero keeps Shop Smart Tags -> /store.");
expect(navbar.includes('{ href: "/", label: "Home" }'), "Navbar keeps Home link.");
expect(navbar.includes('{ href: "/globe", label: "Globe" }'), "Navbar keeps Globe link.");
expect(navbar.includes('{ href: "/about", label: "About Us" }'), "Navbar keeps About Us link.");
expect(navbar.includes('{ href: "/store", label: "Store" }'), "Navbar keeps Store link.");
expect(navbar.includes('href="/auth"') && navbar.includes("Login"), "Navbar keeps logged-out Login entry.");
expect(navbar.includes('href="/profile"') && navbar.includes("Profile"), "Navbar keeps logged-in Profile entry.");
expect(footer.includes('{ label: "Globe Map", href: "/globe" }'), "Footer keeps Globe Map link.");
expect(footer.includes('{ label: "NFC Safety Tag", href: "/store" }'), "Footer keeps NFC Safety Tag link.");
expect(footer.includes('{ label: "Help Center", href: "/help" }'), "Footer keeps Help Center link.");
expect(manifest.start_url === "/", "PWA manifest keeps homepage start_url.");
expect(shortcutUrls.has("/globe"), "PWA manifest keeps globe shortcut.");
expect(shortcutUrls.has("/store"), "PWA manifest keeps store shortcut.");
expect(shortcutUrls.has("/profile"), "PWA manifest keeps profile shortcut.");
expect(serviceWorker.includes("pawpal-shell-v5-no-global-install-banner"), "Service worker cache name was bumped for the homepage upgrade.");
expect(
  serviceWorker.includes("navigationPreload") && serviceWorker.includes("preloadResponse"),
  "Service worker uses navigation preload for fresher document responses.",
);
expect(
  pwaRuntime.includes('process.env.NODE_ENV === "development"') &&
    pwaRuntime.includes("getRegistrations()") &&
    pwaRuntime.includes('key.startsWith("pawpal-shell-")'),
  "PWA runtime unregisters PawPal service workers and caches during local development.",
);
expect(
  globeComponent.includes("preserveDrawingBuffer: true") && globeComponent.includes("rendererConfig={GLOBE_RENDERER_CONFIG}"),
  "Homepage globe keeps screenshot-friendly renderer configuration.",
);
expect(
  globeComponent.includes('data-testid="home-globe"') && globeComponent.includes("data-globe-state"),
  "Homepage globe exposes runtime state for browser smoke tests.",
);
expect(
  globeComponent.includes("isInView") && globeComponent.includes("isDocumentVisible") && globeComponent.includes("shouldAnimateGlobe"),
  "Homepage globe animation remains gated by viewport, visibility, and reduced-motion state.",
);

const rootStyleBlock = mapMarker.match(/root\.style\.cssText = `([\s\S]*?)`;/)?.[1] ?? "";
expect(
  !/position\s*:/.test(rootStyleBlock) && mapMarker.includes("className = \"pawpal-map-marker__visual\""),
  "Map markers leave root positioning to MapLibre and keep layout on the inner visual layer.",
);
expect(
  weatherTicker.includes("globe-weather-label") &&
    !weatherTicker.includes('className="truncate"') &&
    !globalStyles.includes(".globe-weather-item:nth-child(n + 4)"),
  "Globe weather HUD keeps labels readable and does not hide later weather fields.",
);

const routeFiles = [
  "../src/app/page.tsx",
  "../src/app/globe/page.tsx",
  "../src/app/store/page.tsx",
  "../src/app/about/page.tsx",
  "../src/app/auth/page.tsx",
  "../src/app/help/page.tsx",
  "../src/app/privacy/page.tsx",
  "../src/app/terms/page.tsx",
];

await Promise.all(
  routeFiles.map(async (routeFile) => {
    try {
      await access(new URL(routeFile, import.meta.url));
      expect(true, `Route file exists: ${routeFile.replace("../", "")}.`);
    } catch {
      expect(false, `Route file exists: ${routeFile.replace("../", "")}.`);
    }
  }),
);

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.message}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
