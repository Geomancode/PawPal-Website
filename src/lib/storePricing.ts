// Display estimates use integer cents. The server independently freezes prices
// from the catalog; browser totals never authorize a charge.
export const STORE_FREE_SHIPPING_THRESHOLD_CENTS = 5000;
export const STORE_SHIPPING_FEE_CENTS = 599;

export function storeShippingCents(subtotalCents: number): number {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("Invalid store subtotal");
  }
  return subtotalCents === 0 || subtotalCents >= STORE_FREE_SHIPPING_THRESHOLD_CENTS
    ? 0 : STORE_SHIPPING_FEE_CENTS;
}

export function storePriceCents(price: number): number | null {
  const decimal = String(price);
  if (!Number.isFinite(price) || !/^\d{1,8}(\.\d{1,2})?$/.test(decimal)) return null;
  const [whole, fraction = ""] = decimal.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents > 0 && Number.isSafeInteger(cents) ? cents : null;
}

export function storeCartTotals(items: ReadonlyArray<{
  product: { price: number }; quantity: number;
}>): { valid: boolean; subtotalCents: number; shippingCents: number; totalCents: number } {
  const invalid = { valid: false, subtotalCents: 0, shippingCents: 0, totalCents: 0 };
  let subtotalCents = 0;
  for (const item of items) {
    const unitCents = storePriceCents(item.product.price);
    if (unitCents === null || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return invalid;
    subtotalCents += unitCents * item.quantity;
    if (!Number.isSafeInteger(subtotalCents)) return invalid;
  }
  const shippingCents = storeShippingCents(subtotalCents);
  const totalCents = subtotalCents + shippingCents;
  if (!Number.isSafeInteger(totalCents)) return invalid;
  return { valid: true, subtotalCents, shippingCents, totalCents };
}
