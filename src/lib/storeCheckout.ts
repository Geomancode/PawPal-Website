import { createHash } from "node:crypto";
import type Stripe from "stripe";
import type { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CheckoutCatalogError, type CheckoutQuantity } from "@/lib/checkoutCatalog";
import type { normalizeShipping } from "@/lib/checkoutShipping";
import type { Locale } from "@/i18n/locales";

export type CheckoutPayload = {
  shipping: NonNullable<ReturnType<typeof normalizeShipping>>;
  locale: Locale;
  base_url: string;
};
export type StoreCheckout = {
  attempt_id: string;
  owner_id: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  request_sha256: string;
  state: "held" | "paid" | "released";
  created_at: string;
  expires_at: string;
  create_started_at: string | null;
  session_id: string | null;
  session_url: string | null;
  total_cents: number;
  currency: string;
  checkout_payload: CheckoutPayload;
  items: { product_id: string; name: string; unit_amount: number; quantity: number }[];
};
type Admin = Pick<ReturnType<typeof getSupabaseAdmin>, "rpc">;
const ATTEMPT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCheckoutAttempt(value: unknown): string {
  if (typeof value !== "string" || !ATTEMPT_ID.test(value)) {
    throw new CheckoutCatalogError("A checkout attempt is required", 400, "invalid_cart");
  }
  return value.toLowerCase();
}

export function checkoutRequestHash(items: CheckoutQuantity[], payload: CheckoutPayload, ownerId: string) {
  return createHash("sha256").update(JSON.stringify({
    owner_id: ownerId,
    items: items.map(({ id, quantity }) => ({ product_id: id, quantity })).sort((a, b) => a.product_id.localeCompare(b.product_id)),
    shipping: Object.entries(payload.shipping).sort(([a], [b]) => a.localeCompare(b)),
    locale: payload.locale,
    base_url: payload.base_url,
  })).digest("hex");
}

export async function checkoutRpc(admin: Admin, name: string, args: Record<string, unknown>): Promise<StoreCheckout> {
  const { data, error } = await admin.rpc(name, args);
  if (error) {
    // Database messages are fixed machine codes, never expose payload/SQL text.
    const code = String(error.message);
    if (code.includes("out_of_stock") || code.includes("catalog_invalid") || code.includes("total_overflow")) throw new CheckoutCatalogError("Product availability changed", 409, "cart_changed");
    if (code.includes("attempt_conflict") || code.includes("owner_mismatch")) throw new CheckoutCatalogError("Checkout request changed", 409, "invalid_cart");
    if (code.includes("create_window_elapsed")) throw new CheckoutCatalogError("Checkout has ended", 409, "reservation_ended");
    if (code.includes("recovery_requires_review") || code.includes("provider_request_may_exist")) throw new CheckoutCatalogError("Checkout needs verification", 409, "reservation_pending");
    if (code.includes("invalid_")) throw new CheckoutCatalogError("Invalid checkout request", 400, "invalid_cart");
    throw new CheckoutCatalogError("Checkout inventory is unavailable", 503, "catalog_unavailable");
  }
  if (!data || !ATTEMPT_ID.test(data.attempt_id) || !/^[a-f0-9]{64}$/.test(data.request_sha256) ||
      !["held", "paid", "released"].includes(data.state) || !Array.isArray(data.items) || !data.items.length ||
      !Number.isSafeInteger(data.total_cents) || data.total_cents <= 0 || data.currency !== "EUR") {
    throw new CheckoutCatalogError("Invalid checkout reservation", 503, "catalog_unavailable");
  }
  if (![data.subtotal_cents, data.shipping_cents, data.tax_cents].every((value) => Number.isSafeInteger(value) && value >= 0) ||
      data.total_cents !== data.subtotal_cents + data.shipping_cents + data.tax_cents) {
    throw new CheckoutCatalogError("Invalid frozen checkout amount", 503, "catalog_unavailable");
  }
  return data as StoreCheckout;
}

export function reservedLineItems(reservation: StoreCheckout): Stripe.Checkout.SessionCreateParams.LineItem[] {
  let total = 0;
  const ids = new Set<string>();
  const lines = reservation.items.map((item) => {
    if (!item.product_id || ids.has(item.product_id) || !item.name?.trim() ||
        !Number.isSafeInteger(item.unit_amount) || item.unit_amount <= 0 ||
        !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new Error("Invalid frozen checkout item");
    ids.add(item.product_id);
    total += item.unit_amount * item.quantity;
    return { price_data: { currency: "eur", product_data: { name: item.name, metadata: { product_id: item.product_id } }, unit_amount: item.unit_amount }, quantity: item.quantity };
  });
  if (lines.length > 100 || !Number.isSafeInteger(total) || total !== reservation.subtotal_cents) throw new Error("Invalid frozen checkout total");
  return lines;
}

// This reads Stripe again. Event payloads and browser return values never decide
// whether stock is released or sold. A completed but unpaid payment stays held.
export async function reconcileStoreCheckout(stripe: Stripe, admin: Admin, sessionId: string, event?: { id: string; type: string }) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
  if (session.mode !== "payment" || session.metadata?.intent !== "store-order" || !session.metadata.checkout_attempt_id) return null;
  const attemptId = validateCheckoutAttempt(session.metadata.checkout_attempt_id);
  let reservation = await checkoutRpc(admin, "get_store_checkout", { p_attempt_id: attemptId });
  if (session.livemode !== false || session.id !== sessionId || session.client_reference_id !== attemptId ||
      session.metadata.checkout_request_sha256 !== reservation.request_sha256 ||
      session.amount_total !== reservation.total_cents || session.currency?.toUpperCase() !== reservation.currency ||
      (reservation.session_id && reservation.session_id !== session.id)) throw new Error("Checkout session binding mismatch");
  if (session.amount_subtotal !== reservation.subtotal_cents ||
      session.total_details?.amount_shipping !== reservation.shipping_cents ||
      session.total_details?.amount_tax !== reservation.tax_cents ||
      session.total_details?.amount_discount !== 0 ||
      (session.shipping_cost?.amount_total ?? 0) !== reservation.shipping_cents) {
    throw new Error("Checkout shipping/tax binding mismatch");
  }
  const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ["data.price.product"] });
  if (lines.has_more || lines.data.length !== reservation.items.length) throw new Error("Checkout item count mismatch");
  const expected = new Map(reservation.items.map((item) => [item.product_id, item]));
  for (const line of lines.data) {
    const product = line.price?.product;
    const id = product && typeof product !== "string" && !product.deleted ? product.metadata.product_id : undefined;
    const item = id ? expected.get(id) : undefined;
    if (!item || line.quantity !== item.quantity || line.price?.unit_amount !== item.unit_amount ||
        line.amount_total !== item.unit_amount * item.quantity || line.currency?.toUpperCase() !== reservation.currency ||
        line.description !== item.name) throw new Error("Checkout item mismatch");
    expected.delete(item.product_id);
  }
  const intent = session.payment_intent;
  if (intent && typeof intent !== "string" &&
      (intent.livemode !== false || intent.amount !== reservation.total_cents || intent.currency.toUpperCase() !== reservation.currency)) {
    throw new Error("Checkout payment binding mismatch");
  }
  reservation = await checkoutRpc(admin, "bind_store_checkout", {
    p_attempt_id: attemptId, p_session_id: session.id, p_session_url: session.url,
  });
  reservation = await checkoutRpc(admin, "observe_store_checkout", {
    p_attempt_id: attemptId, p_session_id: session.id, p_event_id: event?.id ?? null,
    p_event_type: event?.type ?? null,
    p_session_status: session.status, p_payment_status: session.payment_status,
    p_amount_total: session.amount_total, p_currency: session.currency?.toUpperCase(),
    p_payment_intent_id: typeof intent === "string" ? intent : intent?.id ?? null,
    p_payment_intent_status: intent && typeof intent !== "string" ? intent.status : null,
  });
  return { reservation, session: { ...session, line_items: lines } };
}

export async function reconcileDueStoreCheckouts(stripe: Stripe, admin: Admin, productIds: string[]) {
  const { data, error } = await admin.rpc("list_due_store_checkouts", { p_product_ids: productIds, p_limit: 5 });
  if (error || !Array.isArray(data) || data.length > 5) throw new Error("Due checkouts could not be read");
  for (const entry of data) {
    if (!entry || typeof entry.session_id !== "string") throw new Error("Invalid due checkout");
    await reconcileStoreCheckout(stripe, admin, entry.session_id);
  }
}
