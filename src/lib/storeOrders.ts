import type { Order } from "@/app/store/storeData";

export interface StoreOrder {
  id: string;
  attempt_id: string;
  session_id: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  items: { product_id: string; name: string; unit_amount: number; quantity: number }[];
  shipping: Order["shipping"];
  paid_at: string;
}
export interface StoreOrdersPage {
  items: StoreOrder[];
  next_cursor: { paid_at: string; id: string } | null;
  has_more: boolean;
}

/** Render frozen paid-order data. Catalog edits and browser prices cannot rewrite it. */
export function storeOrderForDisplay(order: StoreOrder): Order {
  return {
    id: `PP-${order.session_id}`,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      product: { id: item.product_id, name: item.name, price: item.unit_amount / 100,
        currency: order.currency, description: "", image: "📦", category: "all",
        rating: 0, reviewCount: 0, inStock: false },
    })),
    shipping: order.shipping,
    payment: { brand: "Stripe Checkout", last4: "" },
    subtotal: order.subtotal_cents / 100, shippingCost: order.shipping_cents / 100,
    tax: order.tax_cents / 100, total: order.total_cents / 100,
    status: "processing", createdAt: order.paid_at,
  };
}
