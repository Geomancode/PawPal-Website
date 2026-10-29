import type { CartItem, Product } from "@/app/store/storeData";

// Keep the existing key/array format so carts saved before this fix still load.
export const CART_KEY = "pawpal_cart";
const EMPTY_CART: CartItem[] = [];
let cachedRaw: string | null | undefined;
let cachedCart = EMPTY_CART;
const listeners = new Set<() => void>();
const warned = new Set<string>();

function warnOnce(operation: string) {
  if (warned.has(operation)) return;
  warned.add(operation);
  console.warn(`Cart storage ${operation}; this tab can still use its in-memory cart.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 &&
    typeof value.name === "string" && typeof value.description === "string" &&
    typeof value.image === "string" &&
    typeof value.price === "number" && Number.isFinite(value.price) && value.price >= 0 &&
    typeof value.rating === "number" && Number.isFinite(value.rating) &&
    typeof value.reviewCount === "number" && Number.isSafeInteger(value.reviewCount) &&
    typeof value.inStock === "boolean" &&
    typeof value.category === "string" && ["all", "food", "toys", "accessories", "health"].includes(value.category) &&
    (value.imageUrl === undefined || typeof value.imageUrl === "string") &&
    (value.currency === undefined || typeof value.currency === "string");
}

export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return EMPTY_CART;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    warnOnce("contains invalid JSON");
    return EMPTY_CART;
  }
  if (!Array.isArray(value)) return EMPTY_CART;
  const seen = new Set<string>();
  return value.filter((item): item is CartItem => {
    if (!isRecord(item) || !isProduct(item.product) ||
      typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 || !Number.isFinite(item.product.price * item.quantity) ||
      seen.has(item.product.id)) return false;
    seen.add(item.product.id);
    return true;
  });
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    // useSyncExternalStore requires referentially stable snapshots. Reading is
    // deliberately side-effect free: hydration must never save an empty cart.
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedCart = parseCart(raw);
    }
  } catch {
    warnOnce("is unavailable");
  }
  return cachedCart;
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  // Read first so a failed write can retain the new in-memory value until the
  // persisted value actually changes (rather than reverting on the next read).
  loadCart();
  const raw = JSON.stringify(items);
  try {
    window.localStorage.setItem(CART_KEY, raw);
    cachedRaw = raw;
  } catch {
    warnOnce("could not be saved");
  }
  cachedCart = items;
  listeners.forEach((listener) => listener());
}

export function updateCart(update: CartItem[] | ((current: CartItem[]) => CartItem[])) {
  // Take the latest storage value at the time of the click, including another
  // tab's preceding edit. Simultaneous tab writes remain last-write-wins.
  saveCart(typeof update === "function" ? update(loadCart()) : update);
}

function onStorage(event: StorageEvent) {
  if (event.key !== CART_KEY && event.key !== null) return;
  try {
    if (event.storageArea !== window.localStorage) return;
  } catch {
    warnOnce("is unavailable");
    return;
  }
  // Read current storage instead of an event's potentially older newValue.
  listeners.forEach((listener) => listener());
}

export function subscribeToCart(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getServerCartSnapshot(): null {
  return null;
}

export function getEmptyCart(): CartItem[] {
  return EMPTY_CART;
}
