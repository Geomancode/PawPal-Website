/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { chromium } = require("/private/tmp/round10-pw-runtime/node_modules/playwright");

const baseUrl = process.env.ROUND10_BASE_URL || "http://localhost:3000";
const evidenceDir = __dirname;
const screenshotDir = path.join(evidenceDir, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1440x900", width: 1440, height: 900 },
];

const modes = [
  { name: "light", colorScheme: "light", reducedMotion: "no-preference" },
  { name: "dark", colorScheme: "dark", reducedMotion: "no-preference" },
  { name: "reduced", colorScheme: "light", reducedMotion: "reduce" },
];

function slug(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isKnownBenignConsole(message) {
  const text = message.text || "";
  return (
    text.includes('caret-color:"transparent"') ||
    text.includes("You have Reduced Motion enabled on your device")
  );
}

function isKnownBenignPageError(message) {
  const text = String(message || "");
  return (
    text.includes("Failed to execute 'measure' on 'Performance'") &&
    text.includes("TagPage") &&
    text.includes("negative time stamp")
  );
}

async function waitForExpectedText(page, expectedTexts) {
  if (expectedTexts.length === 0) return;
  await page.waitForFunction(
    (texts) => {
      const normalizedBodyText = document.body.innerText.replace(/\s+/g, " ").trim().toLowerCase();
      return texts.every((text) => normalizedBodyText.includes(String(text).replace(/\s+/g, " ").trim().toLowerCase()));
    },
    expectedTexts,
    { timeout: 7000 },
  ).catch(() => undefined);
}

async function clickUntil(page, locator, predicate) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await locator.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(600);
    if (await predicate().catch(() => false)) return true;
  }
  return false;
}

async function visibleTextInViewport(page, text) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.evaluate((needle) => {
        const lower = needle.toLowerCase();
        return Array.from(document.querySelectorAll("body *")).some((element) => {
          const content = element.textContent || "";
          if (!content.toLowerCase().includes(lower)) return false;
          const style = window.getComputedStyle(element);
          if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
        });
      }, text);
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(400);
    }
  }
  return false;
}

async function inspect(page, expectedTexts) {
  let bodyText = "";
  let metrics = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      bodyText = await page.locator("body").innerText({ timeout: 8000 }).catch(() => "");
      metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const bodyStyle = window.getComputedStyle(document.body);
        return {
          url: window.location.href,
          title: document.title,
          bodyChars: document.body.innerText.length,
          horizontalOverflow: root.scrollWidth > window.innerWidth + 1,
          scrollWidth: root.scrollWidth,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          colorScheme: bodyStyle.colorScheme,
          bodyBackground: bodyStyle.backgroundColor,
          darkMatches: window.matchMedia("(prefers-color-scheme: dark)").matches,
          reducedMotionMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          pawPageToken: bodyStyle.getPropertyValue("--color-paw-page").trim(),
        };
      });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(500);
    }
  }
  const firstViewport = {};
  for (const text of expectedTexts) firstViewport[text] = await visibleTextInViewport(page, text);
  const normalizedBodyText = normalizeText(bodyText);
  const expectedInBody = expectedTexts.every((text) => normalizedBodyText.includes(normalizeText(text)));
  const expectedInFirstViewport = expectedTexts.every((text) => firstViewport[text]);
  return {
    ...metrics,
    meaningfulRender: metrics.bodyChars > 180 && (expectedInBody || expectedInFirstViewport),
    expectedInBody,
    expectedInFirstViewport,
    frameworkOverlay: /Unhandled Runtime Error|Build Error|Hydration failed|Next\.js.*error/i.test(bodyText),
    loadingShell: /pawpal is loading/i.test(normalizedBodyText),
    textSample: normalizedBodyText.slice(0, 240),
    firstViewport,
  };
}

async function capture(browser, item) {
  const context = await browser.newContext({
    viewport: { width: item.viewport.width, height: item.viewport.height },
    colorScheme: item.mode.colorScheme,
    reducedMotion: item.mode.reducedMotion,
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (["warning", "error", "warn"].includes(msg.type())) consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
  await page.goto(`${baseUrl}${item.path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (item.waitForAuthRedirect) await page.waitForURL("**/auth", { timeout: 8000 }).catch(() => undefined);
  await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
  let inspection = null;
  let attempts = 0;
  for (attempts = 1; attempts <= 3; attempts++) {
    await waitForExpectedText(page, item.expectedTexts);
    await page.waitForTimeout(900);
    inspection = await inspect(page, item.expectedTexts);
    if (inspection.meaningfulRender || !inspection.loadingShell || attempts === 3) break;
    await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => undefined);
    if (item.waitForAuthRedirect) await page.waitForURL("**/auth", { timeout: 8000 }).catch(() => undefined);
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
  }
  const screenshotName = `${slug(item.name)}-${item.mode.name}-${item.viewport.name}.png`;
  const screenshotPath = path.join(screenshotDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const knownBenignConsoleMessages = consoleMessages.filter(isKnownBenignConsole);
  const relevantConsoleMessages = consoleMessages.filter((message) => !isKnownBenignConsole(message));
  const knownBenignPageErrors = pageErrors.filter(isKnownBenignPageError);
  const relevantPageErrors = pageErrors.filter((message) => !isKnownBenignPageError(message));
  await context.close();
  return {
    name: item.name,
    path: item.path,
    viewport: item.viewport.name,
    mode: item.mode.name,
    screenshotPath,
    attempts,
    consoleMessages,
    knownBenignConsoleMessages,
    relevantConsoleMessages,
    pageErrors,
    knownBenignPageErrors,
    relevantPageErrors,
    pass: inspection.meaningfulRender && !inspection.frameworkOverlay && !inspection.horizontalOverflow && relevantConsoleMessages.length === 0 && relevantPageErrors.length === 0,
    inspection,
  };
}

async function runMatrix() {
  const browser = await chromium.launch({ headless: true });
  const cases = [];
  for (const viewport of viewports) {
    for (const mode of modes) {
      cases.push({ name: "profile-signed-out-redirect", path: "/profile", viewport, mode, waitForAuthRedirect: true, expectedTexts: ["Welcome Back", "Sign In"] });
      cases.push({ name: "fixture-ready", path: "/round10-profile-fixture/ready", viewport, mode, expectedTexts: ["Profile readiness", "Pet safety status", "Luna"] });
    }
  }
  for (const state of ["empty", "long", "edit", "add", "installed"]) {
    for (const viewport of [viewports[0], viewports[2]]) {
      for (const mode of [modes[0], modes[1]]) {
        const expectedTexts = state === "empty" || state === "add"
          ? ["Profile readiness", "Add your first pet profile"]
          : state === "edit"
            ? ["Profile readiness", "Display Name"]
            : state === "installed"
              ? ["Profile readiness", "Installed"]
              : ["Profile readiness", "Avery Walker With An Extremely Long Household Profile Name"];
        cases.push({ name: `fixture-${state}`, path: `/round10-profile-fixture/${state}`, viewport, mode, expectedTexts });
      }
    }
  }
  for (const smoke of [
    { name: "smoke-auth", path: "/auth", expectedTexts: ["Welcome Back", "Sign In"] },
    { name: "smoke-tag-sample", path: "/tag/sample-id", expectedTexts: ["Page not found", "This PawPal route is not available"] },
    { name: "smoke-store-checkout", path: "/store/checkout", expectedTexts: ["Secure checkout"] },
  ]) {
    for (const viewport of [viewports[0], viewports[2]]) {
      for (const mode of modes) cases.push({ ...smoke, viewport, mode });
    }
  }
  const results = [];
  for (const item of cases) results.push(await capture(browser, item));
  await browser.close();
  fs.writeFileSync(path.join(evidenceDir, "profile-visual-matrix-results.json"), JSON.stringify(results, null, 2));
  return results;
}

async function runInteractions() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (["warning", "error", "warn"].includes(msg.type())) consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
  await page.goto(`${baseUrl}/round10-profile-fixture/ready`, { waitUntil: "domcontentloaded", timeout: 20000 });
  let interactionLoadAttempts = 0;
  for (interactionLoadAttempts = 1; interactionLoadAttempts <= 3; interactionLoadAttempts++) {
    await waitForExpectedText(page, ["Profile readiness", "Luna", "Edit Profile"]);
    await page.waitForTimeout(700);
    if (await page.getByRole("button", { name: "Edit Profile" }).count() === 1) break;
    if (interactionLoadAttempts < 3) {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => undefined);
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined);
    }
  }
  const editButton = page.getByRole("button", { name: "Edit Profile" });
  const editCount = await editButton.count();
  if (editCount !== 1) throw new Error(`Expected one Edit Profile button, found ${editCount}`);
  const editVisible = await clickUntil(page, editButton, () => page.locator("#profile-edit-name").isVisible());
  const cancelButton = page.getByRole("button", { name: "Cancel" });
  const cancelCount = await cancelButton.count();
  if (cancelCount < 1) throw new Error(`Expected at least one Cancel button, found ${cancelCount}`);
  await clickUntil(page, cancelButton.first(), () => page.getByRole("button", { name: "Edit Profile" }).isVisible());
  const editClosed = await page.getByRole("button", { name: "Edit Profile" }).isVisible();
  const addButton = page.getByRole("button", { name: "Add Pet" });
  const addCount = await addButton.count();
  if (addCount !== 1) throw new Error(`Expected one Add Pet button, found ${addCount}`);
  const petNameVisible = await clickUntil(page, addButton, () => page.getByLabel("Pet Name *", { exact: true }).isVisible());
  const submitButton = page.getByRole("button", { name: "Add Pet" });
  const submitEnabled = await submitButton.isEnabled();
  const dogButton = page.getByRole("button", { name: /Dog/ }).first();
  await dogButton.click({ force: true });
  const friendlyButton = page.getByRole("button", { name: /Friendly/ }).first();
  await friendlyButton.click({ force: true });
  const friendlyPressed = await friendlyButton.getAttribute("aria-pressed");
  const tagLinkHref = await page.locator('a[href="/tag/round10-luna"]').getAttribute("href");
  const installButton = page.getByRole("button", { name: "Install" });
  await installButton.click({ force: true });
  await page.waitForFunction(
    () => document.body.innerText.includes("Add to Home Screen"),
    null,
    { timeout: 5000 },
  ).catch(() => undefined);
  const installStatusVisible = (await page.locator("body").innerText({ timeout: 3000 })).includes("Add to Home Screen");
  await page.screenshot({ path: path.join(screenshotDir, "interaction-ready-after-add-form.png"), fullPage: false });
  await context.close();
  await browser.close();
  const knownBenignConsoleMessages = consoleMessages.filter(isKnownBenignConsole);
  const relevantConsoleMessages = consoleMessages.filter((message) => !isKnownBenignConsole(message));
  const knownBenignPageErrors = pageErrors.filter(isKnownBenignPageError);
  const relevantPageErrors = pageErrors.filter((message) => !isKnownBenignPageError(message));
  const result = {
    editCount,
    editVisible,
    editClosed,
    addCount,
    petNameVisible,
    submitEnabled,
    friendlyPressed,
    tagLinkHref,
    installStatusVisible,
    interactionLoadAttempts,
    consoleMessages,
    knownBenignConsoleMessages,
    relevantConsoleMessages,
    pageErrors,
    knownBenignPageErrors,
    relevantPageErrors,
    pass: editCount === 1 && editVisible && editClosed && addCount === 1 && petNameVisible && !submitEnabled && friendlyPressed === "true" && tagLinkHref === "/tag/round10-luna" && installStatusVisible && relevantConsoleMessages.length === 0 && relevantPageErrors.length === 0,
  };
  fs.writeFileSync(path.join(evidenceDir, "profile-interaction-results.json"), JSON.stringify(result, null, 2));
  return result;
}

(async () => {
  const interactionsOnly = process.argv.includes("--interactions-only");
  const matrixPath = path.join(evidenceDir, "profile-visual-matrix-results.json");
  const matrix = interactionsOnly && fs.existsSync(matrixPath)
    ? JSON.parse(fs.readFileSync(matrixPath, "utf8"))
    : await runMatrix();
  const interactions = await runInteractions();
  const summary = {
    matrixTotal: matrix.length,
    matrixPassed: matrix.filter((item) => item.pass).length,
    interactionPassed: interactions.pass,
    failures: matrix.filter((item) => !item.pass).map((item) => ({
      name: item.name,
      viewport: item.viewport,
      mode: item.mode,
      path: item.path,
      consoleMessages: item.consoleMessages,
      knownBenignConsoleMessages: item.knownBenignConsoleMessages,
      relevantConsoleMessages: item.relevantConsoleMessages,
      pageErrors: item.pageErrors,
      knownBenignPageErrors: item.knownBenignPageErrors,
      relevantPageErrors: item.relevantPageErrors,
      inspection: item.inspection,
      screenshotPath: item.screenshotPath,
    })),
  };
  fs.writeFileSync(path.join(evidenceDir, "profile-evidence-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
