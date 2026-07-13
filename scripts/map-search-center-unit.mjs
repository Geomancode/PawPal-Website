import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routePath = path.join(repoRoot, "src", "app", "api", "map-search", "route.ts");
const routeSource = await readFile(routePath, "utf8");
const routeSourceWithTestExports = `${routeSource}\nexport { FALLBACK_CENTER_GHENT, resolveSearchCenter };\n`;
const transpiledRoute = ts.transpileModule(routeSourceWithTestExports, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: routePath,
}).outputText;

const routeModule = { exports: {} };
const routeRequire = (specifier) => {
  if (specifier === "next/server") {
    return { NextResponse: { json: () => ({}) } };
  }
  if (specifier === "@/lib/errorReporting") {
    return { reportError: () => {} };
  }
  if (specifier === "@/lib/supabaseServer") {
    return { supabaseServer: {} };
  }
  throw new Error(`Unexpected route dependency in unit harness: ${specifier}`);
};

vm.runInNewContext(
  transpiledRoute,
  {
    module: routeModule,
    exports: routeModule.exports,
    require: routeRequire,
    process,
    console,
    fetch,
    AbortSignal,
    Headers,
    Map,
    Date,
    setTimeout,
    clearTimeout,
  },
  { filename: routePath },
);

const { FALLBACK_CENTER_GHENT, resolveSearchCenter } = routeModule.exports;
assert.equal(typeof resolveSearchCenter, "function");

const coordinates = (center) => ({ lat: center.lat, lng: center.lng });
const vercelHeaders = (lat, lng) => new Headers({
  "x-vercel-ip-latitude": lat,
  "x-vercel-ip-longitude": lng,
});

assert.deepEqual(
  coordinates(resolveSearchCenter({ lat: 51.2, lng: 4.4 }, new Headers())),
  { lat: 51.2, lng: 4.4 },
  "valid body coordinates take priority",
);

assert.deepEqual(
  coordinates(resolveSearchCenter({}, vercelHeaders("48.85", "2.35"))),
  { lat: 48.85, lng: 2.35 },
  "Vercel geo headers are used when the body has no coordinates",
);

assert.deepEqual(
  coordinates(resolveSearchCenter({}, new Headers())),
  coordinates(FALLBACK_CENTER_GHENT),
  "Ghent is the final fallback when body and headers are absent",
);

assert.deepEqual(
  coordinates(resolveSearchCenter({ lat: Number.NaN, lng: 4.4 }, vercelHeaders("48.85", "2.35"))),
  { lat: 48.85, lng: 2.35 },
  "NaN body coordinates fall through to geo headers",
);

assert.deepEqual(
  coordinates(resolveSearchCenter({ lat: 91, lng: 181 }, vercelHeaders("48.85", "2.35"))),
  { lat: 48.85, lng: 2.35 },
  "out-of-range body coordinates fall through to geo headers",
);

assert.deepEqual(
  coordinates(resolveSearchCenter({ lat: "51.2", lng: "4.4" }, vercelHeaders("200", "2.35"))),
  coordinates(FALLBACK_CENTER_GHENT),
  "non-numeric body values and invalid headers fall through to the final fallback",
);

console.log("map-search center unit checks passed");
