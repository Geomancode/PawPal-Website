import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helperPath = path.join(repoRoot, "src/lib/cartoBasemap.ts");
const componentPath = path.join(repoRoot, "src/components/GlobeFullPage.tsx");
const [helperSource, componentSource] = await Promise.all([
  readFile(helperPath, "utf8"),
  readFile(componentPath, "utf8"),
]);
const compile = (source, fileName) => ts.transpileModule(source, {
  fileName,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helperCode = compile(helperSource, helperPath);
let count = 0;
function check(label, run) {
  run();
  console.log(`PASS ${++count} ${label}`);
}

// Never forward the host process/env, network APIs, or credentials into the VM.
function tileUrl(fixtureKey) {
  const env = fixtureKey === undefined ? {} : { NEXT_PUBLIC_CARTO_API_KEY: fixtureKey };
  const context = { exports: {}, process: { env } };
  vm.runInNewContext(helperCode, context, { filename: helperPath, timeout: 1000 });
  assert.equal(typeof context.exports.getCartoRasterTileUrl, "function");
  return context.exports.getCartoRasterTileUrl();
}

for (const [label, value] of [
  ["missing", undefined], ["empty", ""], ["whitespace-only", " \t\r\n "],
]) {
  check(`${label} key refuses to construct an anonymous tile URL`, () => {
    assert.equal(tileUrl(value), null);
  });
}

const tileTemplate = "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";
for (const [label, fixtureKey] of [
  ["trimmed synthetic key", "  synthetic-carto-fixture  "],
  ["reserved query and fragment characters", " \tfixture&?=+/#% value\n "],
]) {
  check(`${label} stays in exactly one encoded key parameter`, () => {
    const result = tileUrl(fixtureKey);
    const trimmed = fixtureKey.trim();
    assert.ok(result === `${tileTemplate}?key=${encodeURIComponent(trimmed)}`,
      "tile template must preserve coordinates and encode the complete key");
    const parsed = new URL(result.replaceAll(/\{[zxy]\}/g, "1"));
    assert.equal(parsed.origin, "https://basemaps.cartocdn.com");
    assert.equal(parsed.pathname, "/rastertiles/voyager/1/1/1@2x.png");
    assert.equal(parsed.username, "");
    assert.equal(parsed.password, "");
    assert.equal(parsed.hash, "");
    assert.deepEqual([...parsed.searchParams.keys()], ["key"]);
    assert.ok(parsed.searchParams.get("key") === trimmed, "encoding must round-trip without splitting the key");
  });
}

check("Next.js can statically substitute the public build-time environment value", () => {
  assert.match(helperSource, /process\.env\.NEXT_PUBLIC_CARTO_API_KEY\b/);
});

const component = ts.createSourceFile(componentPath, componentSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function descendants(node, predicate) {
  const matches = [];
  const visit = (current) => {
    if (predicate(current)) matches.push(current);
    ts.forEachChild(current, visit);
  };
  visit(node);
  return matches;
}
const text = (node) => node.getText(component);
const namedCalls = (node, name) => descendants(node,
  (candidate) => ts.isCallExpression(candidate) && text(candidate.expression) === name);
function evaluateExpression(expression, value) {
  const context = { exports: {}, CARTO_TILE_URL: value };
  vm.runInNewContext(compile(`exports.result = (${text(expression)});`, "component-wiring.ts"), context,
    { timeout: 1000 });
  return context.exports.result;
}

check("the map imports and uses the production URL helper", () => {
  assert.ok(component.statements.some((statement) => ts.isImportDeclaration(statement)
    && statement.moduleSpecifier.text === "@/lib/cartoBasemap"
    && statement.importClause?.namedBindings
    && ts.isNamedImports(statement.importClause.namedBindings)
    && statement.importClause.namedBindings.elements.some((binding) => binding.name.text === "getCartoRasterTileUrl")));
  const [declaration] = descendants(component, (node) => ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name) && node.name.text === "CARTO_TILE_URL");
  assert.ok(declaration?.initializer && ts.isCallExpression(declaration.initializer));
  assert.equal(text(declaration.initializer.expression), "getCartoRasterTileUrl");
  assert.equal(declaration.initializer.arguments.length, 0);
});

check("initial render and retry retain the existing fallback while the key is absent", () => {
  const [state] = descendants(component, (node) => ts.isVariableDeclaration(node)
    && ts.isArrayBindingPattern(node.name)
    && node.name.elements.some((element) => ts.isBindingElement(element)
      && ts.isIdentifier(element.name) && element.name.text === "mapUnavailableReason"));
  assert.ok(state?.initializer && ts.isCallExpression(state.initializer));
  assert.equal(text(state.initializer.expression), "useState");
  const [retry] = descendants(component, (node) => ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name) && node.name.text === "handleRetryMap");
  assert.ok(retry?.initializer);
  const setters = namedCalls(retry.initializer, "setMapUnavailableReason");
  assert.equal(setters.length, 1);
  for (const expression of [state.initializer.arguments[0], setters[0].arguments[0]]) {
    assert.ok(expression);
    assert.equal(evaluateExpression(expression, null), "globeLiveMapStartError");
    assert.equal(evaluateExpression(expression, tileUrl("synthetic-carto-fixture")), null);
  }
});

check("MapLibre initialization exits before any map construction without an authorized URL", () => {
  const constructors = descendants(component, (node) => ts.isNewExpression(node)
    && text(node.expression) === "maplibregl.Map");
  assert.equal(constructors.length, 1);
  const [effect] = namedCalls(component, "useEffect").filter((call) =>
    call.pos < constructors[0].pos && call.end > constructors[0].end);
  const callback = effect?.arguments[0];
  assert.ok(callback && ts.isArrowFunction(callback) && ts.isBlock(callback.body));
  const [guard] = callback.body.statements.filter((statement) => ts.isIfStatement(statement)
    && text(statement.expression).replaceAll(/\s/g, "") === "!CARTO_TILE_URL");
  assert.ok(guard && guard.end < constructors[0].pos, "key refusal must precede the map constructor");
  assert.ok(ts.isBlock(guard.thenStatement));
  const calls = namedCalls(guard.thenStatement, "enterMapFallback");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].arguments[0]?.text, "globeLiveMapStartError");
  assert.ok(guard.thenStatement.statements.some((statement) => ts.isReturnStatement(statement)),
    "the missing-key branch must stop initialization");
  const tileProperties = descendants(constructors[0], (node) => ts.isPropertyAssignment(node)
    && text(node.name) === "tiles");
  assert.equal(tileProperties.length, 1);
  const tiles = tileProperties[0].initializer;
  assert.ok(ts.isArrayLiteralExpression(tiles));
  assert.equal(tiles.elements.length, 1);
  assert.equal(text(tiles.elements[0]), "CARTO_TILE_URL");
  assert.ok(!componentSource.includes("basemaps.cartocdn.com/rastertiles"),
    "the component must not bypass the helper with an anonymous tile endpoint");
});

console.log(`PASS ${count}/${count}; real helper and component wiring; synthetic environment only; no network calls.`);
