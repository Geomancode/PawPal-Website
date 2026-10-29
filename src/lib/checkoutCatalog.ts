export class CheckoutCatalogError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
  }
}
export type CheckoutQuantity = { id: string; quantity: number };
export type CatalogProduct = {
  id: string; name: string; price: number | string; currency: string;
  published: boolean; in_stock: boolean; stock_quantity: number;
};
export function checkoutQuantities(input: unknown): CheckoutQuantity[] {
  if (!Array.isArray(input) || !input.length || input.length > 100) {
    throw new CheckoutCatalogError("Invalid cart", 400, "invalid_cart");
  }
  const quantities = new Map<string, number>();
  for (const item of input) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" ||
      !item.id.trim() || item.id !== item.id.trim() || item.id.length > 128 ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new CheckoutCatalogError("Invalid product or quantity", 400, "invalid_cart");
    }
    const quantity = (quantities.get(item.id) || 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new CheckoutCatalogError("Invalid quantity", 400, "invalid_cart");
    quantities.set(item.id, quantity);
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

export function catalogLineItems(items: CheckoutQuantity[], products: CatalogProduct[]) {
  const catalog = new Map(products.map((product) => [product.id, product]));
  return items.map(({ id, quantity }) => {
    const product = catalog.get(id);
    if (!product || product.published !== true || product.in_stock !== true ||
      !Number.isSafeInteger(product.stock_quantity) || product.stock_quantity < quantity) {
      throw new CheckoutCatalogError("A product is unavailable or its stock has changed", 409, "cart_changed");
    }
    // This checkout displays EUR and has an EUR shipping rate/payment-method set.
    // Reject other catalog currencies instead of silently charging the wrong unit.
    if (typeof product.currency !== "string" || product.currency.toUpperCase() !== "EUR" ||
      typeof product.name !== "string" || !product.name.trim()) {
      throw new CheckoutCatalogError("Unsupported catalog price or currency", 409, "cart_changed");
    }
    const decimal = String(product.price);
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(decimal)) {
      throw new CheckoutCatalogError("Invalid catalog price", 409, "cart_changed");
    }
    const [whole, fraction = ""] = decimal.split(".");
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (cents <= 0 || !Number.isSafeInteger(cents * quantity)) {
      throw new CheckoutCatalogError("Invalid catalog amount", 409, "cart_changed");
    }
    return {
      price_data: { currency: "eur", product_data: { name: product.name, metadata: { product_id: id } }, unit_amount: cents },
      quantity,
    };
  });
}
