import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "node_modules/maplibre-gl/dist");
const out = process.env.PAWPAL_MAP_EVIDENCE_DIR || await fs.mkdtemp(path.join(os.tmpdir(), "pawpal-map-"));
await fs.mkdir(out, { recursive: true });
const checks = [];
const errors = [];
// Execute the actual component's capability gate, including the WebGL1-only
// case. This guards the v6 minimum requirement independently of the test GPU.
const component = await fs.readFile(path.join(root, "src/components/GlobeFullPage.tsx"), "utf8");
const gate = component.slice(component.indexOf("function hasUsableWebGL():"), component.indexOf("function GlobeFallbackView("));
assert.ok(gate.includes("function hasUsableWebGL"));
const executable = ts.transpile(gate) + "hasUsableWebGL()";
for (const webgl2 of [false, true]) {
  const attempts = [];
  const context = { getExtension: () => ({ loseContext: () => undefined }) };
  const result = vm.runInNewContext(executable, { document: { createElement: () => ({ getContext: (name) => { attempts.push(name); return name === "webgl2" ? (webgl2 ? context : null) : context; } }) } });
  assert.equal(result, webgl2);
  assert.deepEqual(attempts, ["webgl2"]);
  checks.push({ capabilityGate: webgl2 ? "WebGL2 supported" : "WebGL1 only falls back", passed: true });
}
let browser;
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://fixture").pathname;
  const name = path.basename(pathname);
  if (pathname === `/dist/${name}` && /^maplibre-gl[\w.-]*\.(mjs|css)$/.test(name)) {
    res.writeHead(200, { "Content-Type": name.endsWith("css") ? "text/css" : "text/javascript" });
    res.end(await fs.readFile(path.join(dist, name))); return;
  }
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MapLibre security fixture</title><link rel="stylesheet" href="/dist/maplibre-gl.css"><style>body{margin:0;font:16px system-ui}h1,p{margin:16px}#map{height:70vh}.maplibregl-popup-content{color:#142a25}</style><h1>Map compatibility check</h1><p>Synthetic map. No location or outside services.</p><div id="map"></div><script type="module">
    import * as maplibregl from '/dist/maplibre-gl.mjs';
    window.mapErrors = [];
    const map = new maplibregl.Map({container:'map',attributionControl:false,center:[0,0],zoom:2,pitch:30,style:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#d9eee5'}}]}});
    window.map = map;
    map.on('error',e=>window.mapErrors.push(e.error.message));
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.AttributionControl({compact:false,customAttribution:'<details open onload="window.__unsafe=1" ontoggle="window.__unsafe=2">Synthetic attribution</details>'}));
    map.on('load',()=>{
      const body=document.createElement('p');body.textContent='Synthetic marker';
      new maplibregl.Marker().setLngLat([0,0]).setPopup(new maplibregl.Popup().setDOMContent(body)).addTo(map).togglePopup();
      map.easeTo({zoom:3,duration:0});
      window.loaded=true;
    });
  </script></html>`);
});
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const unexpected = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (request) => { if (!request.url().startsWith(`http://127.0.0.1:${server.address().port}/`)) unexpected.push(request.url()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => window.loaded === true);
    assert.equal(await page.title(), "MapLibre security fixture");
    assert.equal(await page.getByText("Synthetic marker", { exact: true }).isVisible(), true);
    const state = await page.evaluate(() => ({ zoom: window.map.getZoom(), mapErrors: window.mapErrors, executed: window.__unsafe || 0,
      unsafeAttributes: [...document.querySelectorAll('.maplibregl-ctrl-attrib-inner *')].flatMap((element) => [...element.attributes].filter((attr) => attr.name.startsWith('on')).map((attr) => attr.name)),
    }));
    assert.equal(state.zoom, 3);
    assert.deepEqual(state.mapErrors, []);
    assert.equal(state.executed, 0);
    assert.deepEqual(state.unsafeAttributes, []);
    assert.deepEqual(unexpected, []);
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.waitForFunction(() => window.map.getZoom() >= 3.9);
    await page.screenshot({ path: path.join(out, `maplibre-${width}.png`) });
    await page.evaluate(() => window.map.remove());
    checks.push({ width, namespaceImport: true, webgl2Map: true, markerPopup: true, cameraControl: true, attributionSanitized: true, externalRequests: unexpected.length, state });
    await page.close();
  }
  assert.deepEqual(errors, []);
} catch (error) {
  errors.push(error.stack); process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  const result = { checks, errors, passed: errors.length === 0, scope: "Installed MapLibre ESM + real Chromium WebGL2 with local synthetic style; not full PawPal map or real external tile providers" };
  await fs.writeFile(path.join(out, "results.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
