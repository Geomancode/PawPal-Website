import type { CartItem, Order } from "@/app/store/storeData";

export interface CheckoutSession {
  id: string;
  mode: string | null;
  status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  line_items: { name: string; quantity: number; amount: number }[];
}

export function isPaidSession(session: CheckoutSession, requestedId: string): boolean {
  return session.id === requestedId && session.status === "paid" &&
    (session.mode === "payment" || session.mode === "subscription") &&
    Number.isSafeInteger(session.amount_total) && session.amount_total >= 0;
}

export function checkoutOrderId(sessionId: string): string {
  return `PP-${sessionId}`;
}

// A return URL is repeatable. Only the verified payment's matching current cart
// may be consumed, and a saved receipt prevents a refresh from consuming a new cart.
export function recordPaidCheckout(session: CheckoutSession, requestedId: string, ports: {
  loadCart: () => CartItem[];
  loadOrders: () => Order[];
  saveOrder: (order: Order) => boolean | void;
  saveCart: (cart: CartItem[]) => void;
}): boolean {
  if (!isPaidSession(session, requestedId) || session.mode !== "payment" ||
    session.metadata?.intent === "ai-upgrade") return false;
  const id = checkoutOrderId(session.id);
  if (ports.loadOrders().some((order) => order.id === id)) return false;
  const cart = ports.loadCart();
  const items = session.line_items;
  if (!Array.isArray(items) || !cart.length || cart.length !== items.length) return false;
  const remaining = [...items];
  for (const item of cart) {
    const index = remaining.findIndex((paidItem) =>
      paidItem.name === item.product.name && paidItem.quantity === item.quantity &&
      paidItem.amount === Math.round(item.product.price * 100) * item.quantity &&
      (item.product.currency || "eur").toLowerCase() === session.currency.toLowerCase());
    if (index < 0) return false;
    remaining.splice(index, 1);
  }
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const saved = ports.saveOrder({
    id, items: cart,
    shipping: {
      fullName: session.metadata?.shipping_name || "", email: session.customer_email || "",
      address: session.metadata?.shipping_address || "", city: session.metadata?.shipping_city || "",
      zipCode: session.metadata?.shipping_zip || "", country: session.metadata?.shipping_country || "",
      phone: session.metadata?.shipping_phone || "",
    },
    payment: { last4: "Stripe", brand: "Stripe Checkout" }, subtotal,
    shippingCost: 0, tax: subtotal * 0.21, total: session.amount_total / 100,
    status: "processing", createdAt: new Date().toISOString(),
  });
  if (saved === false) return false;
  // A failed receipt write throws above; never erase the cart in that case.
  ports.saveCart([]);
  return true;
}
