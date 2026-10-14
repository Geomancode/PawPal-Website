import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const srcRoot = path.join(repoRoot, "src");
const uiRoot = path.join(srcRoot, "components", "ui");
const defaultSizeUtility = /(^|[^A-Za-z0-9_-])text-(xs|sm|base|lg|xl|[2-9]xl)(?=[^A-Za-z0-9_-]|$)/g;
const arbitraryFontSizeUtility = /text-\[[^\]]*(?:rem|px|clamp)[^\]]*\]/g;
const marketingHeroUtility = /\btext-paw-web-marketing-hero\b/g;
const closureRouteFiles = [
  "src/components/HomeClientParts.tsx",
  "src/app/[locale]/(streamed)/auth/page.tsx",
  "src/app/[locale]/not-found.tsx",
  "src/components/GlobeFullPage.tsx",
  "src/app/store/ProductVisual.tsx",
];
const migratedRouteFiles = [
  "src/app/profile/ProfileWorkspaceView.tsx",
  "src/app/[locale]/(streamed)/admin/park-risks/page.tsx",
  "src/app/[locale]/(streamed)/store/checkout/page.tsx",
  "src/app/[locale]/(streamed)/store/page.tsx",
  "src/app/admin/reports/ReportsClientParts.tsx",
  "src/app/[locale]/(streamed)/store/orders/page.tsx",
  "src/app/tag/[id]/TagPageClient.tsx",
  "src/app/[locale]/(streamed)/about/page.tsx",
  "src/app/[locale]/(streamed)/store/admin/page.tsx",
  "src/components/ChatBubble.tsx",
  "src/app/[locale]/(streamed)/store/success/page.tsx",
  "src/components/Navbar.tsx",
  "src/app/user/[id]/UserPageClient.tsx",
  "src/app/[locale]/(streamed)/help/page.tsx",
  "src/components/Footer.tsx",
  "src/app/post/[id]/PostPageClient.tsx",
  "src/components/PwaRuntime.tsx",
  "src/components/GlobeTutorial.tsx",
  "src/components/ChatBottomSheet.tsx",
  "src/app/[locale]/(streamed)/privacy/page.tsx",
  "src/app/[locale]/(streamed)/terms/page.tsx",
  "src/app/[locale]/(streamed)/guidelines/page.tsx",
  "src/app/group/[id]/GroupPageClient.tsx",
  "src/components/CookieConsentBanner.tsx",
  "src/app/profile/PushSubscriptionSettings.tsx",
  "src/components/PublicRouteError.tsx",
  "src/app/[locale]/(streamed)/globe/page.tsx",
  "src/app/global-error.tsx",
  "src/components/WeatherTicker.tsx",
  ...closureRouteFiles,
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function tsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [absolutePath] : [];
  }));
  return nested.flat().sort();
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function collectOffenders(source, filePath, pattern) {
  return [...source.matchAll(pattern)].map(
    (match) => `${filePath}:${lineNumber(source, match.index)} (${match[0].trim()})`,
  );
}

function ruleBodies(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...source.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "g"))]
    .map((match) => match[1]);
}

function assertRuleHasNoFontSize(source, selector, filePath) {
  const bodies = ruleBodies(source, selector);
  assert(bodies.length > 0, `${filePath} must retain the ${selector} layout rule.`);
  assert(
    bodies.every((body) => !/\bfont-size\s*:/.test(body)),
    `${filePath} ${selector} must not declare font-size.`,
  );
}

async function assertUiUtilities() {
  const offenders = [];
  for (const filePath of await tsxFiles(uiRoot)) {
    const source = await readFile(filePath, "utf8");
    offenders.push(...collectOffenders(source, path.relative(repoRoot, filePath), defaultSizeUtility));
  }
  assert(
    offenders.length === 0,
    `Default Tailwind font-size utilities remain in shared UI:\n${offenders.join("\n")}`,
  );
  console.log("PASS ui typography: no default Tailwind font-size utilities in src/components/ui/*.tsx");
}

async function assertMigratedRouteUtilities() {
  assert(
    migratedRouteFiles.length === 34,
    `migratedRouteFiles must contain exactly 34 entries; found ${migratedRouteFiles.length}.`,
  );
  for (const requiredFile of closureRouteFiles) {
    assert(
      migratedRouteFiles.includes(requiredFile),
      `migratedRouteFiles must include ${requiredFile}.`,
    );
  }

  const offenders = [];
  for (const relativeFilePath of migratedRouteFiles) {
    const source = await readFile(path.join(repoRoot, relativeFilePath), "utf8");
    offenders.push(...collectOffenders(source, relativeFilePath, defaultSizeUtility));
  }
  assert(
    offenders.length === 0,
    `Default Tailwind font-size utilities remain in migrated routes:\n${offenders.join("\n")}`,
  );
  console.log("PASS migrated route typography: 34 exact members contain no default Tailwind font-size utilities");
}

async function assertSitewideTypeUtilities() {
  const defaultOffenders = [];
  const arbitraryOffenders = [];
  for (const absolutePath of await tsxFiles(srcRoot)) {
    const relativePath = path.relative(repoRoot, absolutePath);
    const source = await readFile(absolutePath, "utf8");
    defaultOffenders.push(...collectOffenders(source, relativePath, defaultSizeUtility));
    arbitraryOffenders.push(...collectOffenders(source, relativePath, arbitraryFontSizeUtility));
  }
  assert(
    defaultOffenders.length === 0,
    `Default Tailwind font-size utilities remain in src/**/*.tsx:\n${defaultOffenders.join("\n")}`,
  );
  assert(
    arbitraryOffenders.length === 0,
    `Arbitrary font-size utilities remain in src/**/*.tsx:\n${arbitraryOffenders.join("\n")}`,
  );
  console.log("PASS sitewide typography: src/**/*.tsx has zero default or arbitrary font-size utilities");
}

async function assertMarketingHeroContract() {
  const occurrences = [];
  for (const absolutePath of await tsxFiles(srcRoot)) {
    const relativePath = path.relative(repoRoot, absolutePath);
    const source = await readFile(absolutePath, "utf8");
    occurrences.push(...collectOffenders(source, relativePath, marketingHeroUtility));
  }
  assert(
    occurrences.length === 1,
    `text-paw-web-marketing-hero must appear exactly once in src/**/*.tsx:\n${occurrences.join("\n")}`,
  );
  assert(
    occurrences[0].startsWith("src/components/HomeClientParts.tsx:"),
    "text-paw-web-marketing-hero is restricted to HomeClientParts.tsx.",
  );

  const home = await readFile(path.join(repoRoot, closureRouteFiles[0]), "utf8");
  const homeHero = home.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? "";
  assert(
    homeHero.includes("homepage-hero-headline") && homeHero.includes("text-paw-web-marketing-hero"),
    "HomeClientParts hero H1 must own text-paw-web-marketing-hero.",
  );
  for (const forbiddenFile of closureRouteFiles.slice(1, 4)) {
    const source = await readFile(path.join(repoRoot, forbiddenFile), "utf8");
    assert(
      !source.includes("text-paw-web-marketing-hero"),
      `${forbiddenFile} must not use the Web marketing hero token.`,
    );
  }

  const tokens = await readFile(path.join(repoRoot, "src/app/styles/tokens.css"), "utf8");
  const sizes = [...tokens.matchAll(/--text-paw-web-marketing-hero:\s*([^;]+);/g)]
    .map((match) => match[1].trim());
  const lineHeights = [...tokens.matchAll(/--text-paw-web-marketing-hero--line-height:\s*([^;]+);/g)]
    .map((match) => match[1].trim());
  assert(
    JSON.stringify(sizes) === JSON.stringify(["2.75rem", "3.75rem", "4.45rem", "4.65rem"]),
    `Marketing hero sizes must be 2.75/3.75/4.45/4.65rem; found ${sizes.join(", ")}.`,
  );
  assert(
    JSON.stringify(lineHeights) === JSON.stringify(["1.03", "1.02", "1.02", "1.02"]),
    `Marketing hero line-heights must be 1.03/1.02/1.02/1.02; found ${lineHeights.join(", ")}.`,
  );
  for (const [breakpoint, size] of [["640", "3.75rem"], ["1024", "4.45rem"], ["1280", "4.65rem"]]) {
    const mediaContract = new RegExp(
      `@media\\s*\\(min-width:\\s*${breakpoint}px\\)[\\s\\S]*?` +
      `--text-paw-web-marketing-hero:\\s*${size.replace(".", "\\.")}\\s*;[\\s\\S]*?` +
      "--text-paw-web-marketing-hero--line-height:\\s*1\\.02\\s*;",
    );
    assert(mediaContract.test(tokens), `tokens.css is missing the exact ${breakpoint}px marketing hero contract.`);
  }
  console.log("PASS marketing hero: one Home H1 use and exact 44/60/71.2/74.4px token ladder");
}

async function assertSemanticBindings() {
  const home = await readFile(path.join(repoRoot, "src/components/HomeClientParts.tsx"), "utf8");
  const auth = await readFile(path.join(repoRoot, "src/app/[locale]/(streamed)/auth/page.tsx"), "utf8");
  const notFound = await readFile(path.join(repoRoot, "src/app/[locale]/not-found.tsx"), "utf8");
  const globe = await readFile(path.join(repoRoot, "src/components/GlobeFullPage.tsx"), "utf8");

  const counter = home.match(/export function AnimatedCounter[\s\S]*?export function ProductFlow/)?.[0] ?? "";
  assert(
    counter.includes("text-paw-type-metric"),
    "Home AnimatedCounter statistic must use text-paw-type-metric.",
  );
  assert(
    [...home.matchAll(/<h2[^>]*className="[^"]*text-paw-type-h1[^"]*md:text-paw-type-display[^"]*"/g)].length === 2,
    "HomeClientParts must contain exactly two section H2 bindings from h1 to display.",
  );
  assert(
    /<h1[^>]*className="[^"]*text-paw-type-display[^"]*"/.test(auth),
    "Auth H1 must use text-paw-type-display.",
  );
  assert(
    /<h1[^>]*className="[^"]*text-paw-type-display[^"]*"/.test(notFound),
    "Not-found H1 must use text-paw-type-display.",
  );
  assert(
    /id="globe-fallback-title"[^>]*className="[^"]*text-paw-type-display[^"]*"/.test(globe),
    "Globe fallback title must use text-paw-type-display.",
  );
  assert(
    /className="globe-fallback-body[^"]*text-paw-type-body[^"]*"/.test(globe),
    "Globe fallback body must use text-paw-type-body.",
  );
  console.log("PASS semantic bindings: metric, Home section H2, Auth/404/fallback hierarchy is exact");
}

async function assertCssSingleSource() {
  const homeResponsivePath = "src/app/styles/routes/home-responsive.css";
  const responsivePath = "src/app/styles/routes/responsive.css";
  const homeResponsive = await readFile(path.join(repoRoot, homeResponsivePath), "utf8");
  const responsive = await readFile(path.join(repoRoot, responsivePath), "utf8");
  assert(
    !homeResponsive.includes("--home-responsive-homepage-hero-headline-font-size"),
    `${homeResponsivePath} must not retain the retired hero font-size variable.`,
  );
  assertRuleHasNoFontSize(homeResponsive, ".homepage-hero-headline", homeResponsivePath);
  assertRuleHasNoFontSize(responsive, ".globe-fallback-title", responsivePath);
  assertRuleHasNoFontSize(responsive, ".globe-fallback-body", responsivePath);
  console.log("PASS CSS ownership: hero and globe fallback rules contain no font-size override");
}

async function assertProductVisualContract() {
  const componentPath = "src/app/store/ProductVisual.tsx";
  const cssPath = "src/app/styles/routes/commerce-products.css";
  const component = await readFile(path.join(repoRoot, componentPath), "utf8");
  const css = await readFile(path.join(repoRoot, cssPath), "utf8");

  assert(!defaultSizeUtility.test(component), `${componentPath} must not contain default font-size utilities.`);
  defaultSizeUtility.lastIndex = 0;
  assert(!arbitraryFontSizeUtility.test(component), `${componentPath} must not contain arbitrary font-size utilities.`);
  arbitraryFontSizeUtility.lastIndex = 0;
  assert(component.includes('"product-visual relative flex'), `${componentPath} must expose the product-visual frame class.`);
  assert((component.match(/data-size=\{size\}/g) ?? []).length === 2, `${componentPath} must bind data-size on both outer branches.`);
  assert(component.includes('className="product-visual-glyph drop-shadow-sm"'), `${componentPath} must isolate the emoji glyph class.`);
  assert(!component.includes("glyphSize"), `${componentPath} must not add a glyphSize prop.`);

  for (const [size, value] of [["sm", "24px"], ["md", "30px"], ["lg", "72px"]]) {
    const selector = `.product-visual[data-size="${size}"]`;
    const bodies = ruleBodies(css, selector);
    assert(bodies.length === 1, `${cssPath} must define ${selector} exactly once.`);
    assert(
      new RegExp(`--product-visual-glyph-size:\\s*${value}\\s*;`).test(bodies[0]),
      `${selector} must bind --product-visual-glyph-size to ${value}.`,
    );
  }
  const glyphBodies = ruleBodies(css, ".product-visual-glyph");
  assert(glyphBodies.length === 1, `${cssPath} must define .product-visual-glyph exactly once.`);
  assert(
    /font-size:\s*var\(--product-visual-glyph-size\)\s*;/.test(glyphBodies[0]) &&
      /line-height:\s*1\s*;/.test(glyphBodies[0]),
    ".product-visual-glyph must use the scoped size variable and line-height: 1.",
  );
  console.log("PASS ProductVisual glyph: scoped 24/30/72px emoji sizes and data-size contract");
}

async function assertFontLoader() {
  const layout = await readFile(path.join(repoRoot, "src", "app", "[locale]", "layout.tsx"), "utf8");
  assert(
    /import\s+\{\s*Nunito_Sans\s*\}\s+from\s+["']next\/font\/google["']/.test(layout),
    "src/app/[locale]/layout.tsx must import Nunito_Sans from next/font/google.",
  );
  const binding = layout.match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*Nunito_Sans\s*\(/)?.[1];
  assert(binding, "src/app/[locale]/layout.tsx must instantiate Nunito_Sans.");
  assert(
    /variable:\s*["']--font-nunito-sans["']/.test(layout),
    "Nunito_Sans must expose --font-nunito-sans.",
  );
  const htmlTag = layout.match(/<html[\s\S]*?>/)?.[0] ?? "";
  assert(
    htmlTag.includes(`${binding}.variable`),
    `The <html> className must bind ${binding}.variable.`,
  );
  console.log("PASS font loader: next/font/google Nunito_Sans variable is bound on <html>");
}

async function assertTokenBinding() {
  const tokens = await readFile(path.join(repoRoot, "src", "app", "styles", "tokens.css"), "utf8");
  assert(
    /--font-sans:\s*var\(--font-nunito-sans\)/.test(tokens),
    "tokens.css --font-sans must start with var(--font-nunito-sans).",
  );
  console.log("PASS font token: --font-sans references --font-nunito-sans");
}

await assertMigratedRouteUtilities();
await assertSitewideTypeUtilities();
await assertUiUtilities();
await assertMarketingHeroContract();
await assertSemanticBindings();
await assertCssSingleSource();
await assertProductVisualContract();
await assertFontLoader();
await assertTokenBinding();
console.log("Typography/font contract passed.");
