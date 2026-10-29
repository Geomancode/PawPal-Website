import type { CartItem } from "@/app/store/storeData";

export interface CheckoutSession {
  id: string;
  owner_id?: string;
  mode: string | null;
  status: string;
  customer_email: string;
  amount_total: number;
  amount_subtotal?: number;
  shipping_cents?: number;
  tax_cents?: number;
  currency: string;
  metadata: Record<string, string>;
  line_items: { product_id?: string; name: string; quantity: number; amount: number }[];
}

export function isPaidSession(session: CheckoutSession, requestedId: string): boolean {
  return session.id === requestedId && session.status === "paid" &&
    (session.mode === "payment" || session.mode === "subscription") &&
    Number.isSafeInteger(session.amount_total) && session.amount_total >= 0;
}

export function checkoutOrderId(sessionId: string): string {
  return `PP-${sessionId}`;
}

/** The backend owns receipts. A return URL may only consume this account/tab's
 * still-pending matching attempt; a later identical cart must survive replay. */
export function recordPaidCheckout(session: CheckoutSession, requestedId: string, ports: {
  ownerId: string;
  ownsAttempt: (id: unknown) => boolean;
  finishAttempt: (id: unknown) => void;
  loadCart: () => CartItem[];
  saveCart: (cart: CartItem[]) => void;
}): boolean {
  if (!ports.ownerId || session.owner_id !== ports.ownerId ||
      !isPaidSession(session, requestedId) || session.mode !== "payment" ||
      session.metadata?.intent === "ai-upgrade" ||
      !ports.ownsAttempt(session.metadata?.checkout_attempt_id)) return false;
  const cart = ports.loadCart();
  const items = session.line_items;
  const remaining = Array.isArray(items) ? [...items] : [];
  let matches = cart.length > 0 && cart.length === remaining.length;
  for (const item of cart) {
    const index = remaining.findIndex((paidItem) =>
      paidItem.product_id === item.product.id && paidItem.name === item.product.name && paidItem.quantity === item.quantity &&
      paidItem.amount === Math.round(item.product.price * 100) * item.quantity &&
      (item.product.currency || "eur").toLowerCase() === session.currency.toLowerCase());
    if (index < 0) { matches = false; break; }
    remaining.splice(index, 1);
  }
  // Persist the consumed identity first. If storage fails, retain the cart.
  // A changed cart still consumes the old attempt, never a future same-price cart.
  ports.finishAttempt(session.metadata?.checkout_attempt_id);
  if (!matches) return false;
  ports.saveCart([]);
  return true;
}
