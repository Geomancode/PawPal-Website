/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { chromium } = require("/private/tmp/round10-pw-runtime/node_modules/playwright");

const baseUrl = process.env.ROUND11_BASE_URL || "http://localhost:3001";
const evidenceDir = __dirname;
const screenshotDir = path.join(evidenceDir, "screenshots");

fs.mkdirSync(screenshotDir, { recursive: true });

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1440x900", width: 1440, height: 900 },
];

const modes = {
  light: { name: "light", colorScheme: "light", reducedMotion: "no-preference" },
  dark: { name: "dark", colorScheme: "dark", reducedMotion: "no-preference" },
  reduced: { name: "reduced", colorScheme: "light", reducedMotion: "reduce" },
};

const routes = [
  { name: "home", path: "/", footerExpected: true, expectedText: "PawPal pet safety" },
  { name: "store", path: "/store", footerExpected: true, expectedText: "Start with PawPal NFC safety tags" },
  { name: "help", path: "/help", footerExpected: true, expectedText: "Help" },
  { name: "privacy", path: "/privacy", footerExpected: true, expectedText: "Privacy" },
  { name: "globe", path: "/globe", footerExpected: false, expectedText: "PawPal Globe", nAReason: "Full-screen map shell intentionally hides the global footer via ConditionalFooter." },
  { name: "profile-auth-redirect", path: "/profile", footerExpected: true, expectedText: "Welcome Back", waitForAuthRedirect: true },
];

const expectedFooterLinks = [
  { text: "hello@pawpal.be", href: "mailto:hello@pawpal.be" },
  { text: "Globe Map", href: "/globe" },
  { text: "NFC Safety Tag", href: "/store" },
  { text: "AI Assistant", href: "/globe" },
  { text: "Community", href: "/globe" },
  { text: "About Us", href: "/about" },
  { text: "Store", href: "/store" },
  { text: "Help Center", href: "/help" },
  { text: "Privacy Policy", href: "/privacy" },
  { text: "Terms of Service", href: "/terms" },
  { text: "Contact", href: "mailto:hello@pawpal.be" },
  { text: "Contact PawPal", href: "mailto:hello@pawpal.be?subject=PawPal%20partnership" },
];

function slug(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function isKnownBenignConsole(message) {
  const text = message.text || "";
  return (
    text.includes('caret-color:"transparent"') ||
    text.includes("You have Reduced Motion enabled on your device") ||
    (text.includes("GL Driver Message") && text.includes("GPU stall due to ReadPixels"))
  );
}

function buildCases() {
  const cases = [];

  for (const route of routes) {
    for (const viewport of viewports) {
      cases.push({ route, viewport, mode: modes.light, purpose: "required-route-breakpoint-smoke" });
    }
  }

  for (const route of routes.filter((item) => ["/", "/store", "/help", "/privacy"].includes(item.path))) {
    for (const viewport of [viewports[0], viewports[2]]) {
      cases.push({ route, viewport, mode: modes.dark, purpose: "dark-mode-runtime-proof" });
    }
  }

  for (const route of routes.filter((item) => ["/", "/store", "/privacy"].includes(item.path))) {
    for (const viewport of [viewports[0], viewports[2]]) {
      cases.push({ route, viewport, mode: modes.reduced, purpose: "reduced-motion-runtime-proof" });
    }
  }

  return cases;
}

async function waitForRoute(page, item) {
  await page.goto(`${baseUrl}${item.route.path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (item.route.waitForAuthRedirect) {
    await page.waitForURL("**/auth", { timeout: 10000 }).catch(() => undefined);
  }
  await page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => undefined);
  await page.waitForFunction(
    (expectedText) => document.body.innerText.includes(expectedText),
    item.route.expectedText,
    { timeout: 8000 },
  ).catch(() => undefined);
}

async function inspectPage(page, item) {
  return page.evaluate(
    ({ expectedLinks, expectedText, footerExpected, globeNAReason }) => {
      const root = document.documentElement;
      const body = document.body;
      const footer = document.querySelector("footer");
      const bodyText = body.innerText || "";
      const bodyStyle = window.getComputedStyle(body);
      const rootStyle = window.getComputedStyle(root);
      const origin = window.location.origin;
      const footerLinkNodes = footer ? Array.from(footer.querySelectorAll("a")) : [];
      const footerLinks = footerLinkNodes.map((link) => {
        const rect = link.getBoundingClientRect();
        const computed = window.getComputedStyle(link);
        return {
          text: (link.textContent || "").replace(/\s+/g, " ").trim(),
          href: link.getAttribute("href") || "",
          absoluteHref: link.href,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          display: computed.display,
          alignItems: computed.alignItems,
        };
      });
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      const footerStyle = footer ? window.getComputedStyle(footer) : null;
      const footerVisible = Boolean(
        footer &&
        footerRect &&
        footerRect.width > 0 &&
        footerRect.height > 0 &&
        footerStyle &&
        footerStyle.display !== "none" &&
        footerStyle.visibility !== "hidden",
      );
      const minTapHeight = footerLinks.length ? Math.min(...footerLinks.map((link) => link.height)) : null;
      const minTapWidth = footerLinks.length ? Math.min(...footerLinks.map((link) => link.width)) : null;
      const linkExpectations = expectedLinks.map((expected) => {
        const matching = footerLinks.find((link) => {
          if (link.text !== expected.text) return false;
          if (expected.href.startsWith("mailto:")) return link.href === expected.href || link.absoluteHref === expected.href;
          try {
            return new URL(link.absoluteHref).pathname === expected.href;
          } catch {
            return link.href === expected.href || link.absoluteHref === `${origin}${expected.href}`;
          }
        });
        return { ...expected, found: Boolean(matching), actualHref: matching ? matching.href : null };
      });

      return {
        url: window.location.href,
        title: document.title,
        bodyChars: bodyText.length,
        expectedTextFound: bodyText.includes(expectedText),
        frameworkOverlay: /Unhandled Runtime Error|Build Error|Hydration failed|Next\.js.*error/i.test(bodyText),
        horizontalOverflow: root.scrollWidth > window.innerWidth + 1,
        scrollWidth: root.scrollWidth,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        darkMatches: window.matchMedia("(prefers-color-scheme: dark)").matches,
        reducedMotionMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        rootColorScheme: rootStyle.colorScheme,
        bodyColorScheme: bodyStyle.colorScheme,
        bodyBackground: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        footerExpected,
        footerFound: Boolean(footer),
        footerStatus: footer
          ? "rendered"
          : footerExpected
            ? "missing"
            : `N/A: ${globeNAReason}`,
        footerVisible,
        footerRect: footerRect
          ? {
              width: Math.round(footerRect.width),
              height: Math.round(footerRect.height),
              top: Math.round(footerRect.top),
              bottom: Math.round(footerRect.bottom),
            }
          : null,
        footerColors: footerStyle
          ? {
              background: footerStyle.background,
              color: footerStyle.color,
              borderTopColor: footerStyle.borderTopColor,
            }
          : null,
        contentinfoCount: document.querySelectorAll("footer").length,
        footerHeading: document.querySelector("#footer-heading")?.textContent?.trim() || null,
        footerTextSample: footer ? footer.innerText.replace(/\s+/g, " ").trim().slice(0, 260) : null,
        footerLinkCount: footerLinks.length,
        footerLinks,
        linkExpectations,
        allExpectedLinksFound: footer ? linkExpectations.every((item) => item.found) : !footerExpected,
        minTapHeight,
        minTapWidth,
        tapTargetsPass: footer ? footerLinks.every((link) => link.height >= 43 && link.width >= 44) : !footerExpected,
      };
    },
    {
      expectedLinks: expectedFooterLinks,
      expectedText: item.route.expectedText,
      footerExpected: item.route.footerExpected,
      globeNAReason: item.route.nAReason || "",
    },
  );
}

async function captureCase(browser, item) {
  const context = await browser.newContext({
    viewport: { width: item.viewport.width, height: item.viewport.height },
    colorScheme: item.mode.colorScheme,
    reducedMotion: item.mode.reducedMotion,
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (["warning", "error", "warn"].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));

  await waitForRoute(page, item);
  const footerCount = await page.locator("footer").count();
  if (footerCount > 0) {
    await page.locator("footer").scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => undefined);
  }
  await page.waitForTimeout(300);
  let inspection = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      inspection = await inspectPage(page, item);
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      await page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(500);
    }
  }
  const screenshotName = `${slug(item.purpose)}-${slug(item.route.name)}-${item.mode.name}-${item.viewport.name}.png`;
  const screenshotPath = path.join(screenshotDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const knownBenignConsoleMessages = consoleMessages.filter(isKnownBenignConsole);
  const relevantConsoleMessages = consoleMessages.filter((message) => !isKnownBenignConsole(message));
  const hydrationWarnings = relevantConsoleMessages.filter((message) => /hydration|hydrated|did not match/i.test(message.text));
  const footerPass = item.route.footerExpected
    ? inspection.footerFound &&
      inspection.footerVisible &&
      inspection.footerLinkCount === expectedFooterLinks.length &&
      inspection.allExpectedLinksFound &&
      inspection.tapTargetsPass &&
      inspection.contentinfoCount >= 1 &&
      inspection.footerHeading === "PawPal site footer"
    : !inspection.footerFound;
  const pass =
    inspection.bodyChars > 120 &&
    inspection.expectedTextFound &&
    footerPass &&
    !inspection.frameworkOverlay &&
    !inspection.horizontalOverflow &&
    relevantConsoleMessages.length === 0 &&
    pageErrors.length === 0 &&
    hydrationWarnings.length === 0;

  await context.close();

  return {
    purpose: item.purpose,
    route: item.route.name,
    path: item.route.path,
    finalUrl: inspection.url,
    viewport: item.viewport.name,
    mode: item.mode.name,
    screenshotPath,
    consoleMessages,
    knownBenignConsoleMessages,
    relevantConsoleMessages,
    hydrationWarnings,
    pageErrors,
    pass,
    footerPass,
    inspection,
  };
}

async function runMatrix() {
  const browser = await chromium.launch({ headless: true });
  const cases = buildCases();
  const results = [];
  for (const item of cases) {
    results.push(await captureCase(browser, item));
  }
  await browser.close();
  fs.writeFileSync(path.join(evidenceDir, "footer-visual-matrix-results.json"), JSON.stringify(results, null, 2));
  return results;
}

async function runInteractionAccessibility() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (["warning", "error", "warn"].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => Boolean(document.querySelector("footer")), null, { timeout: 8000 });
  await page.evaluate(() => document.querySelector("footer")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(300);

  const staticMetrics = await page.evaluate((expectedLinks) => {
    const footer = document.querySelector("footer");
    const origin = window.location.origin;
    if (!footer) return { footerFound: false };
    const links = Array.from(footer.querySelectorAll("a")).map((link) => {
      const rect = link.getBoundingClientRect();
      return {
        text: (link.textContent || "").replace(/\s+/g, " ").trim(),
        href: link.getAttribute("href") || "",
        absoluteHref: link.href,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        accessibleNamePresent: Boolean((link.textContent || "").replace(/\s+/g, " ").trim()),
      };
    });
    const linkExpectations = expectedLinks.map((expected) => {
      const matching = links.find((link) => {
        if (link.text !== expected.text) return false;
        if (expected.href.startsWith("mailto:")) return link.href === expected.href || link.absoluteHref === expected.href;
        try {
          return new URL(link.absoluteHref).pathname === expected.href;
        } catch {
          return link.href === expected.href || link.absoluteHref === `${origin}${expected.href}`;
        }
      });
      return { ...expected, found: Boolean(matching), actualHref: matching ? matching.href : null };
    });
    return {
      footerFound: true,
      contentinfoCount: document.querySelectorAll("footer").length,
      heading: document.querySelector("#footer-heading")?.textContent?.trim() || null,
      links,
      linkExpectations,
      allExpectedLinksFound: linkExpectations.every((item) => item.found),
      allAccessibleNamesPresent: links.every((link) => link.accessibleNamePresent),
      allTapTargetsPass: links.every((link) => link.height >= 43 && link.width >= 44),
      mailtoLinks: links.filter((link) => link.href.startsWith("mailto:")),
    };
  }, expectedFooterLinks);

  await page.evaluate(() => {
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
  });

  const focusPath = [];
  const seenFocusKeys = new Set();
  for (let index = 0; index < 160; index++) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return null;
      const footer = element.closest("footer");
      const style = window.getComputedStyle(element);
      return {
        inFooter: Boolean(footer),
        tagName: element.tagName.toLowerCase(),
        text: (element.textContent || "").replace(/\s+/g, " ").trim(),
        href: element.getAttribute("href"),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        focusVisible: element.matches(":focus-visible"),
      };
    });
    if (active?.inFooter) {
      const key = `${active.text}|${active.href}`;
      if (!seenFocusKeys.has(key)) {
        seenFocusKeys.add(key);
        focusPath.push(active);
      }
      if (focusPath.length >= expectedFooterLinks.length) break;
    }
  }

  await page.screenshot({ path: path.join(screenshotDir, "interaction-accessibility-footer-focus.png"), fullPage: false });
  await context.close();
  await browser.close();

  const knownBenignConsoleMessages = consoleMessages.filter(isKnownBenignConsole);
  const relevantConsoleMessages = consoleMessages.filter((message) => !isKnownBenignConsole(message));
  const hydrationWarnings = relevantConsoleMessages.filter((message) => /hydration|hydrated|did not match/i.test(message.text));
  const focusPathPass =
    focusPath.length === expectedFooterLinks.length &&
    focusPath.every((item) => item.focusVisible && item.outlineStyle !== "none" && item.outlineWidth !== "0px");
  const pass =
    Boolean(staticMetrics.footerFound) &&
    staticMetrics.contentinfoCount >= 1 &&
    staticMetrics.heading === "PawPal site footer" &&
    staticMetrics.allExpectedLinksFound &&
    staticMetrics.allAccessibleNamesPresent &&
    staticMetrics.allTapTargetsPass &&
    staticMetrics.mailtoLinks.length >= 3 &&
    focusPathPass &&
    relevantConsoleMessages.length === 0 &&
    pageErrors.length === 0 &&
    hydrationWarnings.length === 0;

  const result = {
    pass,
    focusPathPass,
    staticMetrics,
    focusPath,
    consoleMessages,
    knownBenignConsoleMessages,
    relevantConsoleMessages,
    hydrationWarnings,
    pageErrors,
  };

  fs.writeFileSync(path.join(evidenceDir, "footer-interaction-accessibility-results.json"), JSON.stringify(result, null, 2));
  return result;
}

(async () => {
  const matrixPath = path.join(evidenceDir, "footer-visual-matrix-results.json");
  const interactionsOnly = process.argv.includes("--interactions-only");
  const matrix = interactionsOnly && fs.existsSync(matrixPath)
    ? JSON.parse(fs.readFileSync(matrixPath, "utf8"))
    : await runMatrix();
  const interactions = await runInteractionAccessibility();
  const summary = {
    baseUrl,
    matrixTotal: matrix.length,
    matrixPassed: matrix.filter((item) => item.pass).length,
    interactionPassed: interactions.pass,
    failures: matrix.filter((item) => !item.pass).map((item) => ({
      purpose: item.purpose,
      route: item.route,
      path: item.path,
      finalUrl: item.finalUrl,
      viewport: item.viewport,
      mode: item.mode,
      footerPass: item.footerPass,
      consoleMessages: item.consoleMessages,
      relevantConsoleMessages: item.relevantConsoleMessages,
      hydrationWarnings: item.hydrationWarnings,
      pageErrors: item.pageErrors,
      inspection: item.inspection,
      screenshotPath: item.screenshotPath,
    })),
    interactionFailures: interactions.pass
      ? []
      : {
          focusPathPass: interactions.focusPathPass,
          staticMetrics: interactions.staticMetrics,
          focusPath: interactions.focusPath,
          relevantConsoleMessages: interactions.relevantConsoleMessages,
          hydrationWarnings: interactions.hydrationWarnings,
          pageErrors: interactions.pageErrors,
        },
  };
  fs.writeFileSync(path.join(evidenceDir, "footer-evidence-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
