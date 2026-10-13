import { access, readFile } from "node:fs/promises";

const checks = [];

function expect(condition, message) {
  checks.push({ ok: Boolean(condition), message });
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
  enMessages,
  nextConfig,
  routing,
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
  readFile(new URL("../src/i18n/messages/en.ts", import.meta.url), "utf8"),
  readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/i18n/routing.ts", import.meta.url), "utf8"),
]);

const manifest = JSON.parse(manifestText);
const shortcutUrls = new Set((manifest.shortcuts ?? []).map((shortcut) => shortcut.url));

expect(
  enMessages.includes("homeHeroAriaLabel: \"PawPal pet safety for every walk\"") &&
    enMessages.includes("homeHeroLineOne: \"PawPal pet safety\"") &&
    enMessages.includes("homeHeroLineTwo: \"for every walk\"") &&
    home.includes('t("homeHeroAriaLabel")') &&
    home.includes('t("homeHeroLineOne")') &&
    home.includes('t("homeHeroLineTwo")'),
  "Homepage H1 keeps the readable product headline through the English dictionary.",
);
expect(
  home.includes('href={path("/globe")}') &&
    home.includes('t("homeCtaOpenLiveMap")') &&
    enMessages.includes("homeCtaOpenLiveMap: \"Open Live Map\""),
  "Hero keeps Open Live Map -> /globe through locale-aware routing.",
);
expect(
  home.includes('href={path("/store")}') &&
    home.includes('t("homeCtaShopSmartTags")') &&
    enMessages.includes("homeCtaShopSmartTags: \"Shop Smart Tags\""),
  "Hero keeps Shop Smart Tags -> /store through locale-aware routing.",
);
expect(navbar.includes('{ href: "/", label: t("navHome") }') && enMessages.includes('navHome: "Home"'), "Navbar keeps Home link.");
expect(navbar.includes('{ href: "/globe", label: t("navGlobe") }') && enMessages.includes('navGlobe: "Globe"'), "Navbar keeps Globe link.");
expect(navbar.includes('{ href: "/about", label: t("navAboutUs") }') && enMessages.includes('navAboutUs: "About Us"'), "Navbar keeps About Us link.");
expect(navbar.includes('{ href: "/store", label: t("navStore") }') && enMessages.includes('navStore: "Store"'), "Navbar keeps Store link.");
expect(navbar.includes('href={path("/auth")}') && enMessages.includes('navLogin: "Login"'), "Navbar keeps logged-out Login entry.");
expect(navbar.includes('{ href: "/profile", label: t("navProfile") }') && enMessages.includes('navProfile: "Profile"'), "Navbar keeps logged-in Profile entry.");
expect(footer.includes('{ label: t("footerGlobeMap"), href: "/globe" }') && enMessages.includes('footerGlobeMap: "Globe Map"'), "Footer keeps Globe Map link.");
expect(footer.includes('{ label: t("footerNfcSafetyTag"), href: "/store" }') && enMessages.includes('footerNfcSafetyTag: "NFC Safety Tag"'), "Footer keeps NFC Safety Tag link.");
expect(footer.includes('{ label: t("footerHelpCenter"), href: "/help" }') && enMessages.includes('footerHelpCenter: "Help Center"'), "Footer keeps Help Center link.");
expect(
  routing.includes("locale === defaultLocale") &&
    routing.includes("return path") &&
    nextConfig.includes("async rewrites()") &&
    nextConfig.includes("defaultUiRoutes") &&
    nextConfig.includes('destination: source === "/" ? "/en" : `/en${source}`'),
  "Locale routing keeps default-locale links unprefixed and rewrites only explicit unprefixed UI routes; non-default locales retain their segment.",
);
expect(manifest.start_url === "/", "PWA manifest keeps homepage start_url.");
expect(shortcutUrls.has("/globe"), "PWA manifest keeps globe shortcut.");
expect(shortcutUrls.has("/store"), "PWA manifest keeps store shortcut.");
expect(shortcutUrls.has("/profile"), "PWA manifest keeps profile shortcut.");
expect(serviceWorker.includes("pawpal-public-v1") && serviceWorker.includes("LEGACY_CACHE_PREFIX"), "Service worker uses the public-only cache and migrates legacy shell caches.");
expect(
  serviceWorker.includes("navigationPreload.disable()") && serviceWorker.includes('fetch(request, { cache: "no-store" })'),
  "Service worker bypasses HTTP preload caching for document responses.",
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
  "../src/app/[locale]/page.tsx",
  "../src/app/[locale]/globe/page.tsx",
  "../src/app/[locale]/store/page.tsx",
  "../src/app/[locale]/about/page.tsx",
  "../src/app/[locale]/auth/page.tsx",
  "../src/app/[locale]/help/page.tsx",
  "../src/app/[locale]/privacy/page.tsx",
  "../src/app/[locale]/terms/page.tsx",
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
