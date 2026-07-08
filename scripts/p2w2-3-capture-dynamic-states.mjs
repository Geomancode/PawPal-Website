import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = "/Users/nuemann/Desktop/GeoPet/PawPal-Website";
const evidenceRoot = "/Users/nuemann/Desktop/GeoPet/evidence/P2W2-3";
const require = createRequire(path.join(repoRoot, "package.json"));
const { chromium } = require("playwright");

const baseUrl = process.env.P2W2_BASE_URL ?? "http://localhost:3102";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
];

const states = [
  {
    slug: "tag-contact-visible",
    label: "Tag contact visible",
    route: "/tag/p2w2-tag-contact-visible",
    scheme: "light",
  },
  {
    slug: "tag-contact-hidden",
    label: "Tag contact hidden",
    route: "/tag/p2w2-tag-contact-hidden",
    scheme: "light",
  },
  {
    slug: "tag-missing-avatar",
    label: "Tag missing avatar",
    route: "/tag/p2w2-tag-missing-avatar",
    scheme: "light",
  },
  {
    slug: "tag-long-name",
    label: "Tag long pet name",
    route: "/tag/p2w2-tag-long-name",
    scheme: "light",
  },
  {
    slug: "tag-long-breed",
    label: "Tag long breed",
    route: "/tag/p2w2-tag-long-breed",
    scheme: "light",
  },
  {
    slug: "tag-no-health-notes",
    label: "Tag no health notes",
    route: "/tag/p2w2-tag-no-health-notes",
    scheme: "light",
  },
  {
    slug: "tag-dark",
    label: "Tag dark mode",
    route: "/tag/p2w2-tag-dark",
    scheme: "dark",
  },
  {
    slug: "post-populated",
    label: "Post populated",
    route: "/post/p2w2-post-populated",
    scheme: "light",
  },
  {
    slug: "group-populated",
    label: "Group populated",
    route: "/group/p2w2-group-populated",
    scheme: "light",
  },
  {
    slug: "user-populated",
    label: "User populated",
    route: "/user/p2w2-user-populated",
    scheme: "light",
  },
  {
    slug: "pet-alias-populated",
    label: "Pet alias populated",
    route: "/pet/p2w2-pet-populated",
    scheme: "light",
  },
];

async function ensureDirs() {
  for (const dir of ["screenshots", "screenshots/full", "meta"]) {
    await fs.mkdir(path.join(evidenceRoot, dir), { recursive: true });
  }
}

function visibleText(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function captureState(browser, state, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: state.scheme,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    locale: "en-US",
  });
  await context.addInitScript(() => {
    window.localStorage.setItem("pawpal-consent-v1", "essential");
  });

  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push({
        type: message.type(),
        text: message.text().slice(0, 500),
      });
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error.stack || error.message || error).slice(0, 1000));
  });

  let responseStatus = null;
  let navigationError = null;
  try {
    const response = await page.goto(`${baseUrl}${state.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    responseStatus = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
  } catch (error) {
    navigationError = String(error.stack || error.message || error);
  }

  const fileBase = `${state.slug}__${viewport.name}__${state.scheme}`;
  const screenshotPath = path.join(evidenceRoot, "screenshots", `${fileBase}.png`);
  const fullScreenshotPath = path.join(
    evidenceRoot,
    "screenshots",
    "full",
    `${fileBase}__full.png`,
  );

  await page.screenshot({ path: screenshotPath, fullPage: false });
  await page.screenshot({ path: fullScreenshotPath, fullPage: true });

  const pageMeta = await page.evaluate(() => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    const h1 = Array.from(document.querySelectorAll("h1")).map((el) =>
      normalize(el.textContent),
    );
    const h2 = Array.from(document.querySelectorAll("h2")).map((el) =>
      normalize(el.textContent),
    );
    const bodyText = normalize(document.body.textContent).slice(0, 1200);
    const mainText = normalize(
      document.querySelector("main")?.textContent || document.body.textContent,
    ).slice(0, 1200);
    const devPortalText = normalize(document.querySelector("nextjs-portal")?.textContent);
    const frameworkOverlay = Boolean(
      document.querySelector("[data-nextjs-dialog]") ||
        /Unhandled Runtime Error|Build Error|Application error|Next\.js/i.test(devPortalText),
    );
    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const edgeSelector = [
      "main",
      "article",
      "aside",
      "section",
      "button",
      "a",
      "[class*='card']",
      "[class*='Card']",
      "[class*='panel']",
      "[class*='Panel']",
    ].join(",");
    const edgeHits = Array.from(document.querySelectorAll(edgeSelector))
      .filter(isVisible)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const className = typeof el.className === "string" ? el.className : "";
        return {
          tag: el.tagName.toLowerCase(),
          className: className.slice(0, 180),
          text: normalize(el.textContent).slice(0, 120),
          left: Math.round(rect.left),
          right: Math.round(window.innerWidth - rect.right),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => {
        const touchesEdge = item.left < 8 || item.right < 8;
        const nearFullBleed = item.width >= window.innerWidth - 2;
        return touchesEdge && !nearFullBleed;
      })
      .slice(0, 60);

    return {
      title: document.title,
      finalUrl: window.location.href,
      h1,
      h2,
      bodyText,
      mainText,
      frameworkOverlay,
      devPortalText,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      },
      edgeHits,
    };
  });

  const output = {
    slug: state.slug,
    label: state.label,
    route: state.route,
    scheme: state.scheme,
    viewport,
    responseStatus,
    navigationError,
    screenshot: screenshotPath,
    fullPageScreenshot: fullScreenshotPath,
    consoleMessages,
    pageErrors,
    page: pageMeta,
  };

  await fs.writeFile(
    path.join(evidenceRoot, "meta", `${fileBase}.json`),
    JSON.stringify(output, null, 2),
  );

  await context.close();
  return output;
}

async function main() {
  await ensureDirs();

  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const state of states) {
      for (const viewport of viewports) {
        const result = await captureState(browser, state, viewport);
        results.push(result);
        console.log(
          [
            state.scheme,
            viewport.name,
            state.route,
            "->",
            result.responseStatus,
            visibleText(result.page.h1.join(" | ")),
          ].join(" "),
        );
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => {
    return (
      result.navigationError ||
      result.responseStatus == null ||
      result.responseStatus >= 400 ||
      result.page.h1.length === 0 ||
      result.page.frameworkOverlay ||
      result.page.scroll.hasHorizontalOverflow ||
      result.pageErrors.length > 0
    );
  });

  await fs.writeFile(
    path.join(evidenceRoot, "meta", "capture-summary.json"),
    JSON.stringify(
      {
        baseUrl,
        capturedAt: new Date().toISOString(),
        states,
        viewports,
        results,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) {
    console.error(`Capture completed with ${failures.length} failing state(s).`);
    process.exit(1);
  }

  console.log(`Captured ${results.length} screenshots into ${evidenceRoot}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
