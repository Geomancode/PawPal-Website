#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const ROOT = process.cwd();
const ROUND_DIR = path.join(
  ROOT,
  "design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-15-globe-market-readiness"
);
const EVIDENCE_DIR = path.join(ROUND_DIR, "evidence");
const SCREENSHOT_DIR = path.join(EVIDENCE_DIR, "screenshots");
const MATRIX_PATH = path.join(EVIDENCE_DIR, "round15_assertion_matrix.json");
const BASE_URL = process.env.PAWPAL_TEST_URL || "http://localhost:3000";
const CHROME_PATH =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CdpClient {
  constructor(wsEndpoint) {
    this.wsEndpoint = wsEndpoint;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = [];
    this.diagnosticsBySession = new Map();
  }

  async open() {
    this.socket = new WebSocket(this.wsEndpoint);
    this.socket.on("message", (data) => this.handleMessage(data));
    await new Promise((resolve, reject) => {
      this.socket.once("open", resolve);
      this.socket.once("error", reject);
    });
  }

  handleMessage(data) {
    const message = JSON.parse(data.toString());
    if (message.sessionId && this.diagnosticsBySession.has(message.sessionId)) {
      const diagnostics = this.diagnosticsBySession.get(message.sessionId);
      if (message.method === "Runtime.exceptionThrown") {
        diagnostics.runtimeExceptions.push(message.params || {});
      }
      if (message.method === "Runtime.consoleAPICalled") {
        const type = message.params?.type || "";
        if (type === "error" || type === "warning" || type === "warn") {
          diagnostics.consoleEntries.push(message.params || {});
        }
      }
      if (message.method === "Log.entryAdded") {
        const entry = message.params?.entry || {};
        if (entry.level === "error" || entry.level === "warning") {
          diagnostics.consoleEntries.push(entry);
        }
      }
      if (message.method === "Network.loadingFailed") {
        const params = message.params || {};
        if (!params.canceled) diagnostics.networkFailures.push(params);
      }
    }

    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject, timeout } = this.pending.get(message.id);
      clearTimeout(timeout);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
      } else {
        resolve(message.result || {});
      }
      return;
    }

    for (let index = 0; index < this.eventWaiters.length; index += 1) {
      const waiter = this.eventWaiters[index];
      if (
        waiter.method === message.method &&
        (!waiter.sessionId || waiter.sessionId === message.sessionId)
      ) {
        clearTimeout(waiter.timeout);
        this.eventWaiters.splice(index, 1);
        waiter.resolve(message.params || {});
        return;
      }
    }
  }

  send(method, params = {}, sessionId, timeoutMs = 15000) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
    });
    this.socket.send(JSON.stringify(payload));
    return promise;
  }

  waitEvent(method, sessionId, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.eventWaiters.findIndex((waiter) => waiter.resolve === resolve);
        if (index >= 0) this.eventWaiters.splice(index, 1);
        reject(new Error(`CDP event timeout: ${method}`));
      }, timeoutMs);
      this.eventWaiters.push({ method, sessionId, resolve, timeout });
    });
  }

  close() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
      this.socket.terminate();
    }
  }

  registerDiagnostics(sessionId) {
    this.diagnosticsBySession.set(sessionId, {
      consoleEntries: [],
      runtimeExceptions: [],
      networkFailures: [],
    });
  }

  diagnostics(sessionId) {
    return this.diagnosticsBySession.get(sessionId) || {
      consoleEntries: [],
      runtimeExceptions: [],
      networkFailures: [],
    };
  }
}

async function launchChrome() {
  const userDataDir = path.join(
    os.tmpdir(),
    `pawpal-round15-cdp-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  await fs.mkdir(userDataDir, { recursive: true });

  const child = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-extensions",
      "--hide-scrollbars",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  const stderrLines = [];
  const wsEndpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for Chrome DevTools endpoint"));
    }, 10000);

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrLines.push(text);
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });

    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Chrome exited before CDP startup with code ${code}, signal ${signal}. ${stderrLines.join("").slice(-1200)}`
        )
      );
    });
  });

  return { child, userDataDir, wsEndpoint };
}

async function stopChrome(runtime) {
  runtime.client?.close();
  if (runtime.child && !runtime.child.killed) {
    runtime.child.kill("SIGTERM");
    setTimeout(() => {
      if (!runtime.child.killed) runtime.child.kill("SIGKILL");
    }, 1500).unref();
  }
  try {
    await fs.rm(runtime.userDataDir, { recursive: true, force: true, maxRetries: 4, retryDelay: 200 });
  } catch {
    // macOS can keep Chrome profile files open briefly after SIGTERM.
  }
}

async function createPage(client, viewport, mediaFeatures = []) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });

  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Network.enable", {}, sessionId);
  await client.send("Log.enable", {}, sessionId);
  await client.send("Page.enable", {}, sessionId);
  await client.send("Page.setLifecycleEventsEnabled", { enabled: true }, sessionId);
  client.registerDiagnostics(sessionId);
  await client.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor || 1,
      mobile: viewport.width <= 500,
    },
    sessionId
  );
  if (mediaFeatures.length) {
    await client.send("Emulation.setEmulatedMedia", { features: mediaFeatures }, sessionId);
  }

  return { targetId, sessionId };
}

async function closePage(client, targetId) {
  try {
    await client.send("Target.closeTarget", { targetId }, undefined, 3000);
  } catch {
    // Continue so one stubborn target cannot hide the matrix result.
  }
}

async function evaluate(client, sessionId, expression, timeoutMs = 12000) {
  const result = await client.send(
    "Runtime.evaluate",
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    },
    sessionId,
    timeoutMs
  );
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result?.value;
}

async function gotoPage(client, sessionId, url) {
  const load = client.waitEvent("Page.loadEventFired", sessionId, 15000).catch(() => null);
  await client.send("Page.navigate", { url }, sessionId);
  await load;
  await sleep(550);
}

async function waitFor(client, sessionId, expression, timeoutMs = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await evaluate(client, sessionId, expression, 5000).catch(() => false);
    if (value) return true;
    await sleep(150);
  }
  return false;
}

async function installWebGLFallbackOverride(client, sessionId) {
  await client.send(
    "Page.addScriptToEvaluateOnNewDocument",
    {
      source: `
        (() => {
          const originalGetContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            const name = String(type || "").toLowerCase();
            if (name === "webgl" || name === "experimental-webgl" || name === "webgl2") {
              return null;
            }
            return originalGetContext.call(this, type, attributes);
          };
        })();
      `,
    },
    sessionId
  );
}

const collectChecksExpression = `
(() => {
  const bodyText = document.body?.innerText || "";
  const doc = document.documentElement;
  const fallback = document.querySelector(".globe-fallback-stage");
  const fallbackActions = [...document.querySelectorAll(".globe-fallback-actions button, .globe-fallback-actions a")].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      label: element.textContent.trim(),
      tag: element.tagName.toLowerCase(),
      height: Math.round(rect.height),
      width: Math.round(rect.width),
      focusable: !element.disabled && element.tabIndex !== -1,
    };
  });
  const weather = document.querySelector(".globe-weather-bar");
  const weatherItems = [...document.querySelectorAll(".globe-weather-item")].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent.trim(),
      visible: rect.width > 0 && rect.height > 0,
      right: Math.round(rect.right),
      left: Math.round(rect.left),
    };
  });
  const weatherBox = weather ? weather.getBoundingClientRect() : null;
  const tileResourceCount = performance
    .getEntriesByType("resource")
    .filter((entry) => String(entry.name || "").includes("basemaps.cartocdn.com") && entry.responseEnd > 0)
    .length;
  const markerCount = document.querySelectorAll(".maplibregl-marker").length;
  return {
    url: location.href,
    title: document.title,
    bodyLength: bodyText.length,
    textSample: bodyText.slice(0, 700),
    fallbackVisible: Boolean(fallback) || bodyText.includes("Map preview is still ready"),
    mapContainerPresent: Boolean(document.querySelector("#globe-map")),
    canvasPresent: document.querySelectorAll("canvas").length,
    hasGlobalErrorPanel: /Application error|This page could not be found|Internal Server Error|Unhandled Runtime Error/i.test(bodyText),
    hasFrameworkOverlayText: Boolean(document.querySelector("[data-nextjs-dialog], nextjs-portal")) || /Next\\.js|Webpack|Turbopack|Unhandled Runtime Error/i.test(bodyText),
    horizontalOverflow: doc.scrollWidth > window.innerWidth + 2,
    viewport: { width: window.innerWidth, height: window.innerHeight, scrollWidth: doc.scrollWidth },
    fallbackActionCount: fallbackActions.length,
    fallbackActions,
    fallbackMinActionHeight: fallbackActions.length ? Math.min(...fallbackActions.map((item) => item.height)) : 0,
    reducedMotionMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    darkModeMatches: matchMedia("(prefers-color-scheme: dark)").matches,
    tileResourceCount,
    markerCount,
    weather: weatherBox ? {
      visible: weatherBox.width > 0 && weatherBox.height > 0,
      width: Math.round(weatherBox.width),
      height: Math.round(weatherBox.height),
      itemCount: weatherItems.length,
      visibleItemCount: weatherItems.filter((item) => item.visible).length,
      clippedRight: weatherItems.some((item) => item.visible && item.right > Math.round(weatherBox.right) + 1),
      clippedLeft: weatherItems.some((item) => item.visible && item.left < Math.round(weatherBox.left) - 1),
    } : null,
  };
})()
`;

async function collectChecks(client, sessionId) {
  return evaluate(client, sessionId, collectChecksExpression);
}

async function captureScreenshot(client, sessionId, name) {
  const targetPath = path.join(SCREENSHOT_DIR, name);
  try {
    const result = await client.send(
      "Page.captureScreenshot",
      { format: "png", fromSurface: true },
      sessionId,
      10000
    );
    await fs.writeFile(targetPath, Buffer.from(result.data, "base64"));
    return targetPath;
  } catch (error) {
    return { error: error.message, targetPath };
  }
}

function passBase(checks) {
  return (
    checks.bodyLength > 80 &&
    !checks.hasGlobalErrorPanel &&
    !checks.hasFrameworkOverlayText &&
    !checks.horizontalOverflow
  );
}

function passLive(checks) {
  return (
    passBase(checks) &&
    !checks.fallbackVisible &&
    checks.mapContainerPresent &&
    checks.canvasPresent > 0 &&
    checks.weather?.visible &&
    checks.weather?.itemCount >= 3 &&
    checks.weather?.visibleItemCount > 0 &&
    checks.tileResourceCount > 0 &&
    checks.markerCount > 0 &&
    !checks.weather?.clippedLeft &&
    !checks.weather?.clippedRight
  );
}

function passFallback(checks) {
  return (
    passBase(checks) &&
    checks.fallbackVisible &&
    checks.fallbackActionCount >= 3 &&
    checks.fallbackMinActionHeight >= 44
  );
}

async function runCase(client, testCase) {
  const page = await createPage(client, testCase.viewport, testCase.mediaFeatures || []);
  let screenshot = null;
  let checks = null;
  let extra = {};

  try {
    if (testCase.webglUnavailableBeforeLoad) {
      await installWebGLFallbackOverride(client, page.sessionId);
    }

    await gotoPage(client, page.sessionId, `${BASE_URL}${testCase.path}`);
    if (testCase.expectFallback) {
      await waitFor(client, page.sessionId, `Boolean(document.querySelector(".globe-fallback-stage"))`, 7000);
    } else if (testCase.path === "/globe") {
      await waitFor(
        client,
        page.sessionId,
        `Boolean(document.querySelector("#globe-map canvas, .maplibregl-canvas, .globe-fallback-stage"))`,
        8000
      );
      if (testCase.expectLive) {
        await waitFor(
          client,
          page.sessionId,
          `
          (() => {
            const weatherReady = document.querySelectorAll(".globe-weather-item").length >= 3;
            const markersReady = document.querySelectorAll(".maplibregl-marker").length > 0;
            const tileReady = performance
              .getEntriesByType("resource")
              .some((entry) => String(entry.name || "").includes("basemaps.cartocdn.com") && entry.responseEnd > 0);
            return weatherReady && tileReady && markersReady;
          })()
          `,
          15000
        );
        await sleep(2200);
      }
    } else {
      await waitFor(client, page.sessionId, `(document.body?.innerText || "").length > 100`, 7000);
    }

    if (testCase.postInitContextLoss) {
      const before = await collectChecks(client, page.sessionId);
      const trigger = await evaluate(
        client,
        page.sessionId,
        `
        (() => {
          const canvases = [...document.querySelectorAll("canvas")].filter((canvas) => {
            const rect = canvas.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          for (const canvas of canvases) {
            for (const type of ["webgl2", "webgl", "experimental-webgl"]) {
              try {
                const context = canvas.getContext(type);
                const extension = context?.getExtension?.("WEBGL_lose_context");
                if (extension) {
                  extension.loseContext();
                  return { dispatched: true, method: "WEBGL_lose_context", canvasCount: canvases.length };
                }
              } catch {}
            }
          }
          const canvas = canvases[0];
          if (!canvas) return { dispatched: false, method: "none", canvasCount: 0 };
          const event = typeof WebGLContextEvent === "function"
            ? new WebGLContextEvent("webglcontextlost", { bubbles: true, cancelable: true, statusMessage: "round15 synthetic context loss" })
            : new Event("webglcontextlost", { bubbles: true, cancelable: true });
          const dispatched = canvas.dispatchEvent(event);
          return { dispatched, method: "webglcontextlost-event", canvasCount: canvases.length };
        })()
        `
      );
      await waitFor(client, page.sessionId, `Boolean(document.querySelector(".globe-fallback-stage"))`, 7000);
      const after = await collectChecks(client, page.sessionId);
      extra = { before, trigger, after };
    }

    if (testCase.keyboardFocus) {
      const focusResult = await evaluate(
        client,
        page.sessionId,
        `
        (() => {
          const actions = [...document.querySelectorAll(".globe-fallback-actions button, .globe-fallback-actions a")];
          if (actions.length < 3) return { pass: false, count: actions.length };
          actions[0].focus();
          const firstFocused = document.activeElement === actions[0];
          actions[1].focus();
          const secondFocused = document.activeElement === actions[1];
          actions[2].focus();
          const thirdFocused = document.activeElement === actions[2];
          return {
            pass: firstFocused && secondFocused && thirdFocused,
            count: actions.length,
            labels: actions.map((action) => action.textContent.trim()),
          };
        })()
        `
      );
      extra = { ...extra, focusResult };
    }

    checks = testCase.postInitContextLoss ? extra.after : await collectChecks(client, page.sessionId);
    const diagnostics = client.diagnostics(page.sessionId);

    if (testCase.screenshot) {
      screenshot = await captureScreenshot(client, page.sessionId, testCase.screenshot);
    }

    let pass = passBase(checks);
    if (testCase.expectLive) pass = passLive(checks);
    if (testCase.expectFallback) pass = passFallback(checks);
    if (testCase.postInitContextLoss) {
      pass = Boolean(extra.trigger?.dispatched) && passFallback(checks);
    }
    if (testCase.keyboardFocus) {
      pass = pass && Boolean(extra.focusResult?.pass);
    }
    if (testCase.expectDarkMode) {
      pass = pass && checks.darkModeMatches;
    }
    if (testCase.expectReducedMotion) {
      pass = pass && checks.reducedMotionMatches;
    }
    pass =
      pass &&
      diagnostics.consoleEntries.length === 0 &&
      diagnostics.runtimeExceptions.length === 0 &&
      diagnostics.networkFailures.length === 0;

    return {
      name: testCase.name,
      path: testCase.path,
      viewport: testCase.viewport,
      pass,
      checks,
      extra,
      diagnostics,
      screenshot,
    };
  } catch (error) {
    return {
      name: testCase.name,
      path: testCase.path,
      viewport: testCase.viewport,
      pass: false,
      error: error.message,
      checks,
      extra,
      screenshot,
    };
  } finally {
    await closePage(client, page.targetId);
  }
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const tests = [
    {
      name: "live-globe-390x844",
      path: "/globe",
      viewport: { width: 390, height: 844 },
      expectLive: true,
      screenshot: "round15-live-globe-390x844.png",
    },
    {
      name: "live-globe-1280x720",
      path: "/globe",
      viewport: { width: 1280, height: 720 },
      expectLive: true,
      screenshot: "round15-live-globe-1280x720.png",
    },
    {
      name: "fallback-globe-390x844",
      path: "/globe",
      viewport: { width: 390, height: 844 },
      webglUnavailableBeforeLoad: true,
      expectFallback: true,
      screenshot: "round15-fallback-globe-390x844.png",
    },
    {
      name: "fallback-globe-1280x720",
      path: "/globe",
      viewport: { width: 1280, height: 720 },
      webglUnavailableBeforeLoad: true,
      expectFallback: true,
      screenshot: "round15-fallback-globe-1280x720.png",
    },
    {
      name: "post-init-context-loss",
      path: "/globe",
      viewport: { width: 1280, height: 720 },
      expectFallback: true,
      postInitContextLoss: true,
      screenshot: "round15-post-init-context-loss-1280x720.png",
    },
    {
      name: "fallback-keyboard-focus",
      path: "/globe",
      viewport: { width: 390, height: 844 },
      webglUnavailableBeforeLoad: true,
      expectFallback: true,
      keyboardFocus: true,
    },
    {
      name: "fallback-dark-mode",
      path: "/globe",
      viewport: { width: 390, height: 844 },
      webglUnavailableBeforeLoad: true,
      expectFallback: true,
      expectDarkMode: true,
      mediaFeatures: [{ name: "prefers-color-scheme", value: "dark" }],
      screenshot: "round15-fallback-dark-mode-390x844.png",
    },
    {
      name: "fallback-reduced-motion",
      path: "/globe",
      viewport: { width: 390, height: 844 },
      webglUnavailableBeforeLoad: true,
      expectFallback: true,
      expectReducedMotion: true,
      mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
    },
    {
      name: "loaded-home-390x844",
      path: "/",
      viewport: { width: 390, height: 844 },
      screenshot: "round15-loaded-home-390x844.png",
    },
    {
      name: "loaded-store-390x844",
      path: "/store",
      viewport: { width: 390, height: 844 },
      screenshot: "round15-loaded-store-390x844.png",
    },
    {
      name: "loaded-help-390x844",
      path: "/help",
      viewport: { width: 390, height: 844 },
      screenshot: "round15-loaded-help-390x844.png",
    },
  ];

  const runtime = await launchChrome();
  const client = new CdpClient(runtime.wsEndpoint);
  runtime.client = client;
  await client.open();

  const results = [];
  try {
    for (const testCase of tests) {
      process.stdout.write(`Running ${testCase.name} ... `);
      const result = await runCase(client, testCase);
      results.push(result);
      process.stdout.write(`${result.pass ? "PASS" : "FAIL"}\n`);
    }
  } finally {
    await stopChrome(runtime);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    total: results.length,
    passed: results.filter((result) => result.pass).length,
    failed: results.filter((result) => !result.pass).map((result) => result.name),
    tests: tests.map((testCase) => testCase.name),
    results,
  };
  await fs.writeFile(MATRIX_PATH, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ total: summary.total, passed: summary.passed, failed: summary.failed }, null, 2));

  if (summary.failed.length) {
    process.exitCode = 1;
  }
  process.exit(summary.failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
