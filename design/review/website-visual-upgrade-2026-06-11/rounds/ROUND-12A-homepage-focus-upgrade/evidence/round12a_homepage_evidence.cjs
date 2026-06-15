/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/private/tmp/round10-pw-runtime/node_modules/playwright");

const baseUrl = process.env.ROUND12A_BASE_URL || "http://localhost:3001";
const evidenceDir = __dirname;
const screenshotDir = path.join(evidenceDir, "screenshots");

fs.mkdirSync(screenshotDir, { recursive: true });

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 720 },
  { name: "wide", width: 1440, height: 900 },
];

const cases = [
  ...viewports.map((viewport) => ({ ...viewport, colorScheme: "light", reducedMotion: "no-preference" })),
  ...viewports.map((viewport) => ({ ...viewport, colorScheme: "dark", reducedMotion: "no-preference" })),
  { ...viewports[0], colorScheme: "light", reducedMotion: "reduce" },
  { ...viewports[2], colorScheme: "light", reducedMotion: "reduce" },
];

function slugFor(testCase) {
  return `${testCase.name}-${testCase.width}x${testCase.height}-${testCase.colorScheme}-${testCase.reducedMotion}`;
}

function isKnownBenignConsole(message) {
  return /GPU stall due to ReadPixels|WebGL warning/i.test(message);
}

function relevantConsole(logs) {
  return logs.filter((entry) => !isKnownBenignConsole(entry.message));
}

async function collectPageMetrics(page) {
  return page.evaluate(() => {
    const rectOf = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        top: Math.round(r.top),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
      };
    };

    const allRects = (selector) => [...document.querySelectorAll(selector)].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        selector,
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        top: Math.round(r.top),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
      };
    });

    const intersectArea = (a, b) => {
      if (!a || !b) return 0;
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y;
    };

    const h1 = rectOf("h1");
    const desc = rectOf("main section p");
    const globe = rectOf(".hero-globe-shell-upgraded");
    const tag = rectOf(".hero-product-tag");
    const proof = rectOf(".homepage-proof-grid");
    const hero = rectOf("main section");
    const ctaRects = allRects('main a[href="/globe"], main a[href="/store"]');
    const criticalText = [h1, desc, ...ctaRects];
    const visualRects = [globe, tag];
    const criticalOverlapAreas = [];
    criticalText.forEach((a, i) => {
      visualRects.forEach((b, j) => {
        criticalOverlapAreas.push({ textIndex: i, visualIndex: j, area: intersectArea(a, b) });
      });
    });

    const visibleProofPx = proof
      ? Math.max(0, Math.min(window.innerHeight, proof.bottom) - Math.max(0, proof.top))
      : 0;

    const computed = {
      colorScheme: getComputedStyle(document.documentElement).colorScheme || getComputedStyle(document.body).colorScheme,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      homeHeroBackground: getComputedStyle(document.querySelector(".home-hero-field") || document.body).backgroundImage,
      proofBackground: getComputedStyle(document.querySelector(".homepage-proof-grid") || document.body).backgroundColor,
      heroTagBackground: getComputedStyle(document.querySelector(".hero-product-tag") || document.body).backgroundImage,
    };

    const reducedMotionSignals = {
      activeCssAnimations: document.getAnimations ? document.getAnimations().filter((animation) => animation.playState === "running").length : null,
      heroCardsRemoved: document.querySelectorAll(".hero-globe-card").length === 0,
      animatedHintRemoved: document.querySelectorAll(".hero-globe-hint-upgraded").length === 0,
      criticalTransitionDurations: [
        ...document.querySelectorAll('main a[href="/globe"], main a[href="/store"], .hero-product-tag, .homepage-flow-step'),
      ].slice(0, 8).map((el) => getComputedStyle(el).transitionDuration),
    };

    const heroLinks = [...document.querySelectorAll('main a[href="/globe"], main a[href="/store"]')].map((link) => {
      const r = link.getBoundingClientRect();
      return {
        text: (link.textContent || "").trim().replace(/\s+/g, " "),
        href: link.getAttribute("href"),
        height: Math.round(r.height),
        width: Math.round(r.width),
      };
    });

    return {
      url: location.href,
      title: document.title,
      nonEmptyRender: !!document.body.innerText.trim(),
      bodyTextLength: document.body.innerText.length,
      frameworkOverlay: /Next\.js|Unhandled Runtime Error|Build Error|Application error/i.test(document.body.innerText),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      headingText: document.querySelector("h1")?.textContent?.trim() || "",
      headingCount: document.querySelectorAll("h1").length,
      hero,
      proof,
      proofVisiblePx: Math.round(visibleProofPx),
      h1,
      desc,
      globe,
      tag,
      heroLinks,
      proofItems: document.querySelectorAll(".homepage-proof-item").length,
      flowSteps: document.querySelectorAll(".homepage-flow-step").length,
      showcasePresent: !!document.querySelector(".homepage-showcase"),
      legacyHeroCards: document.querySelectorAll(".hero-globe-card").length,
      readinessCards: document.querySelectorAll(".readiness-card").length,
      phoneScreenCards: document.querySelectorAll(".phone-screen-card").length,
      criticalOverlapAreas,
      criticalOverlap: criticalOverlapAreas.some((item) => item.area > 4),
      matchMediaDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      matchMediaReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      computed,
      reducedMotionSignals,
    };
  });
}

function evaluateCase(testCase, metrics, logs, pageErrors, screenshotPath) {
  const hydrationWarnings = logs.filter((entry) => /hydration|did not match|server rendered/i.test(entry.message));
  const relevantLogs = relevantConsole(logs);
  const heroLinks = metrics.heroLinks || [];
  const firstGlobe = heroLinks.find((link) => link.href === "/globe");
  const firstStore = heroLinks.find((link) => link.href === "/store");

  const failures = [];
  if (!metrics.url.startsWith(baseUrl)) failures.push("URL mismatch");
  if (!metrics.title) failures.push("Missing title");
  if (!metrics.nonEmptyRender) failures.push("Blank render");
  if (metrics.frameworkOverlay) failures.push("Framework overlay");
  if (relevantLogs.length) failures.push("Relevant console warnings/errors");
  if (hydrationWarnings.length) failures.push("Hydration warnings");
  if (pageErrors.length) failures.push("Page errors");
  if (metrics.horizontalOverflow) failures.push("Horizontal overflow");
  if (metrics.headingCount !== 1) failures.push("Expected exactly one h1");
  if (!/PawPal pet safety/i.test(metrics.headingText)) failures.push("Unexpected h1");
  if (!firstGlobe || firstGlobe.text !== "Open Live Map") failures.push("Primary CTA missing");
  if (!firstStore || firstStore.text !== "Shop Smart Tags") failures.push("Secondary CTA missing");
  if (firstGlobe && firstGlobe.height < 44) failures.push("Primary CTA tap target below 44px");
  if (firstStore && firstStore.height < 44) failures.push("Secondary CTA tap target below 44px");
  if (metrics.proofItems !== 3) failures.push("Expected 3 proof items");
  if (metrics.flowSteps !== 3) failures.push("Expected 3 flow steps");
  if (!metrics.showcasePresent) failures.push("Showcase missing");
  if (metrics.legacyHeroCards !== 0) failures.push("Legacy hero floating cards still present");
  if (metrics.readinessCards !== 0) failures.push("Readiness cards still present");
  if (metrics.phoneScreenCards !== 0) failures.push("Phone card grid still present");
  if (metrics.criticalOverlap) failures.push("Critical text/control overlaps product visual");
  if (metrics.proofVisiblePx <= 0) failures.push("Next section proof band not visible in first viewport");
  if (testCase.colorScheme === "dark" && !metrics.matchMediaDark) failures.push("Dark matchMedia false");
  if (testCase.reducedMotion === "reduce" && !metrics.matchMediaReduced) failures.push("Reduced-motion matchMedia false");

  return {
    ...testCase,
    slug: slugFor(testCase),
    screenshotPath,
    pass: failures.length === 0,
    failures,
    relevantConsoleWarningsErrors: relevantLogs,
    knownBenignConsoleMessages: logs.filter((entry) => isKnownBenignConsole(entry.message)),
    hydrationWarnings,
    pageErrors,
    metrics,
  };
}

async function runCase(browser, testCase) {
  const context = await browser.newContext({
    viewport: { width: testCase.width, height: testCase.height },
    colorScheme: testCase.colorScheme,
    reducedMotion: testCase.reducedMotion,
  });
  const page = await context.newPage();
  const logs = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (["warning", "warn", "error"].includes(message.type())) {
      logs.push({ type: message.type(), message: message.text(), location: message.location() });
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push({ message: error.message, stack: error.stack });
  });

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.getByRole("heading", { name: "PawPal pet safety for every walk" }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(2200);

  const metrics = await collectPageMetrics(page);
  const screenshotPath = path.join(screenshotDir, `home-${slugFor(testCase)}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return evaluateCase(testCase, metrics, logs, pageErrors, screenshotPath);
}

async function runInteraction(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const logs = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (["warning", "warn", "error"].includes(message.type())) {
      logs.push({ type: message.type(), message: message.text(), location: message.location() });
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push({ message: error.message, stack: error.stack });
  });

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.getByRole("heading", { name: "PawPal pet safety for every walk" }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(2200);

  const links = await page.evaluate(() => [...document.querySelectorAll("main a")].map((link) => ({
    text: (link.textContent || "").trim().replace(/\s+/g, " "),
    href: link.getAttribute("href"),
    ariaLabel: link.getAttribute("aria-label"),
    height: Math.round(link.getBoundingClientRect().height),
  })));

  const focusPath = [];
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    focusPath.push(await page.evaluate(() => {
      const el = document.activeElement;
      const r = el?.getBoundingClientRect();
      return {
        tag: el?.tagName.toLowerCase(),
        text: (el?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
        href: el?.getAttribute?.("href") || null,
        focusVisible: el ? el.matches(":focus-visible") : false,
        outlineWidth: el ? getComputedStyle(el).outlineWidth : null,
        height: r ? Math.round(r.height) : null,
      };
    }));
  }

  const screenshotPath = path.join(screenshotDir, "home-interaction-focus-mobile-reduced.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  const heroLinks = links.filter((link) => link.href === "/globe" || link.href === "/store");
  const primary = heroLinks.find((link) => link.href === "/globe" && link.text === "Open Live Map");
  const secondary = heroLinks.find((link) => link.href === "/store" && link.text === "Shop Smart Tags");
  const failures = [];
  if (!primary) failures.push("Primary CTA href/text missing");
  if (!secondary) failures.push("Secondary CTA href/text missing");
  if (primary && primary.height < 44) failures.push("Primary CTA tap target below 44px");
  if (secondary && secondary.height < 44) failures.push("Secondary CTA tap target below 44px");
  if (!focusPath.some((item) => item.href === "/globe" && item.focusVisible)) failures.push("Primary CTA not reached with focus-visible in first tab pass");
  if (!focusPath.some((item) => item.href === "/store" && item.focusVisible)) failures.push("Secondary CTA not reached with focus-visible in first tab pass");
  if (relevantConsole(logs).length) failures.push("Relevant console warnings/errors during interaction");
  if (pageErrors.length) failures.push("Page errors during interaction");

  return {
    pass: failures.length === 0,
    failures,
    screenshotPath,
    links,
    focusPath,
    relevantConsoleWarningsErrors: relevantConsole(logs),
    knownBenignConsoleMessages: logs.filter((entry) => isKnownBenignConsole(entry.message)),
    pageErrors,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const matrix = [];
  for (const testCase of cases) {
    matrix.push(await runCase(browser, testCase));
  }
  const interaction = await runInteraction(browser);
  await browser.close();

  const summary = {
    baseUrl,
    matrixTotal: matrix.length,
    matrixPassed: matrix.filter((item) => item.pass).length,
    interactionPassed: interaction.pass,
    failures: matrix.filter((item) => !item.pass).map((item) => ({ slug: item.slug, failures: item.failures })),
    interactionFailures: interaction.failures,
    screenshots: matrix.map((item) => item.screenshotPath).concat(interaction.screenshotPath),
  };

  fs.writeFileSync(path.join(evidenceDir, "homepage-visual-matrix-results.json"), JSON.stringify(matrix, null, 2));
  fs.writeFileSync(path.join(evidenceDir, "homepage-interaction-accessibility-results.json"), JSON.stringify(interaction, null, 2));
  fs.writeFileSync(path.join(evidenceDir, "homepage-evidence-summary.json"), JSON.stringify(summary, null, 2));

  console.log(JSON.stringify(summary, null, 2));
  if (summary.matrixPassed !== summary.matrixTotal || !summary.interactionPassed) {
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
