import type { normalizeShipping } from "@/lib/checkoutShipping";

// The browser keeps only a random attempt ID and a SHA-256 request digest.
// Shipping details never enter this storage. A network retry reuses the ID;
// a new purchase after confirmed completion receives a new one.
const STORAGE_KEY = "pawpal.checkout-attempts.v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Attempts = Record<string, string>;

function readAttempts(storage: Storage): Attempts {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid checkout attempt storage");
  for (const [digest, id] of Object.entries(value)) {
    if (!/^[a-f0-9]{64}$/.test(digest) || typeof id !== "string" || !UUID.test(id)) {
      throw new Error("Invalid checkout attempt storage");
    }
  }
  return value as Attempts;
}

export async function checkoutAttemptId(payload: {
  items: { id: string; quantity: number }[];
  shipping: NonNullable<ReturnType<typeof normalizeShipping>>;
  locale: string;
}, storage: Storage = window.sessionStorage, cryptography: Crypto = window.crypto): Promise<string> {
  const quantities = new Map<string, number>();
  for (const item of payload.items) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  const canonical = JSON.stringify({
    items: [...quantities].sort(([a], [b]) => a.localeCompare(b)),
    shipping: Object.entries(payload.shipping).sort(([a], [b]) => a.localeCompare(b)),
    locale: payload.locale,
  });
  const hash = await cryptography.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const digest = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  // Read after hashing so two clicks cannot overwrite a newly saved attempt.
  const attempts = readAttempts(storage);
  if (attempts[digest]) return attempts[digest];
  if (Object.keys(attempts).length >= 100) throw new Error("Too many unresolved checkout attempts");
  const id = cryptography.randomUUID();
  attempts[digest] = id;
  storage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  return id;
}

export function finishCheckoutAttempt(id: unknown, storage: Storage = window.sessionStorage) {
  if (typeof id !== "string" || !UUID.test(id)) return;
  const attempts = readAttempts(storage);
  for (const [digest, storedId] of Object.entries(attempts)) {
    if (storedId === id) delete attempts[digest];
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}
