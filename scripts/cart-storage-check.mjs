import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(fs.readFileSync("src/lib/cartStorage.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const item = (id = "first", quantity = 2) => ({ product: {
  id, name: "Synthetic cart item", description: "Cart regression fixture", price: 14.99,
  category: "food", image: "🐟", rating: 4, reviewCount: 3, inStock: true,
}, quantity });
function create(initial, server = false) {
  let raw = initial ?? null;
  let writes = 0;
  let readBlocked = false;
  let writeBlocked = false;
  const warnings = [];
  const handlers = new Set();
  const storage = {
    getItem() { if (readBlocked) throw new Error("SecurityError"); return raw; },
    setItem(key, value) {
      if (writeBlocked) throw new Error("QuotaExceededError");
      assert.equal(key, "pawpal_cart"); raw = value; writes++;
    },
  };
  const context = { exports: {}, console: { warn: (value) => warnings.push(value) } };
  if (!server) context.window = {
    localStorage: storage,
    addEventListener: (name, handler) => { assert.equal(name, "storage"); handlers.add(handler); },
    removeEventListener: (name, handler) => { assert.equal(name, "storage"); handlers.delete(handler); },
  };
  vm.runInNewContext(source, context);
  return { api: context.exports, warnings, handlers,
    raw: () => raw, writes: () => writes,
    external(value, key = "pawpal_cart", area = storage) {
      raw = value; for (const handler of handlers) handler({ key, storageArea: area });
    },
    blockRead: () => { readBlocked = true; }, blockWrite: () => { writeBlocked = true; },
  };
}
let cases = 0;
function check(name, run) { run(); cases++; console.log(`PASS ${name}`); }
check("SSR never reads or writes browser state", () => {
  const { api } = create(null, true);
  assert.equal(api.getServerCartSnapshot(), null);
  assert.equal(api.loadCart().length, 0);
  api.saveCart([item()]);
  assert.equal(api.loadCart().length, 0);
});
check("legacy saved cart loads with a stable snapshot and zero initialization writes", () => {
  const raw = JSON.stringify([item()]); const t = create(raw);
  const first = t.api.loadCart();
  assert.equal(first[0].quantity, 2); assert.equal(t.api.loadCart(), first);
  assert.equal(t.raw(), raw); assert.equal(t.writes(), 0);
});
check("invalid JSON and non-array storage do not crash or overwrite persisted data", () => {
  for (const raw of ["broken", "null", "42", "{}", '"text"']) {
    const t = create(raw); assert.equal(t.api.loadCart().length, 0);
    assert.equal(t.writes(), 0); assert.equal(t.raw(), raw);
  }
});
check("malformed rows and quantities are ignored while valid rows survive", () => {
  const rows = [null, {}, { product: null, quantity: 1 }, item("zero", 0),
    item("negative", -1), item("fraction", 1.5), item("unsafe", 1e20),
    { ...item("price"), product: { ...item().product, price: "14" } },
    { ...item("category"), product: { ...item().product, category: { toString: null, valueOf: null } } }, item(), item()];
  const t = create(JSON.stringify(rows));
  assert.equal(t.api.loadCart().length, 1); assert.equal(t.api.loadCart()[0].product.id, "first");
  assert.equal(t.writes(), 0);
});
check("explicit changes persist synchronously and notify same-tab readers", () => {
  const t = create(); let notifications = 0;
  const stop = t.api.subscribeToCart(() => { notifications++; });
  t.api.updateCart(() => [item()]);
  assert.equal(JSON.parse(t.raw())[0].quantity, 2); assert.equal(notifications, 1);
  t.api.saveCart([]); assert.equal(t.raw(), "[]"); assert.equal(notifications, 2);
  stop(); assert.equal(t.handlers.size, 0);
});
check("the next edit reads another tab's latest storage instead of stale state", () => {
  const t = create(JSON.stringify([item()])); t.api.loadCart();
  t.external(JSON.stringify([item("peer", 4)]));
  t.api.updateCart((cart) => [...cart, item("local", 1)]);
  assert.equal(JSON.parse(t.raw()).map((row) => row.product.id).join(","), "peer,local");
});
check("storage changes and clears notify without write-back loops", () => {
  const t = create(JSON.stringify([item()])); let notifications = 0;
  const stop = t.api.subscribeToCart(() => { notifications++; t.api.loadCart(); });
  t.external(JSON.stringify([item("peer", 3)]));
  assert.equal(t.api.loadCart()[0].quantity, 3);
  t.external(null, null); assert.equal(t.api.loadCart().length, 0);
  assert.equal(notifications, 2); assert.equal(t.writes(), 0);
  t.external(null, "unrelated"); t.external(null, "pawpal_cart", {});
  assert.equal(notifications, 2); stop();
});
check("denied reads and quota failures retain a usable in-memory cart", () => {
  for (const block of ["blockRead", "blockWrite"]) {
    const t = create(JSON.stringify([item()])); t.api.loadCart(); t[block]();
    t.api.updateCart(() => [item("new", 3)]);
    assert.equal(t.api.loadCart()[0].product.id, "new");
    t.api.updateCart((cart) => [{ ...cart[0], quantity: 4 }]);
    assert.equal(t.api.loadCart()[0].quantity, 4);
    assert.ok(t.warnings.length > 0);
  }
});
check("a persisted clear from another tab supersedes an unsaved in-memory edit", () => {
  const t = create(JSON.stringify([item()])); t.api.loadCart(); t.blockWrite();
  t.api.updateCart(() => [item("new")]); t.external(null, null);
  assert.equal(t.api.loadCart().length, 0);
});
console.log(`Cart storage regression passed: ${cases} independent cases; no network or payments.`);
