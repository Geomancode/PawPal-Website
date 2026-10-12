import type { Product } from "@/app/store/storeData";

export function cartQuantityLimit(product: Product): number {
  if (!product.inStock || product.published === false) return 0;
  // Legacy/demo carts have no stock field. The server always rechecks real stock.
  if (product.stockQuantity === undefined) return Number.MAX_SAFE_INTEGER;
  return Number.isSafeInteger(product.stockQuantity) && product.stockQuantity >= 0
    ? product.stockQuantity : 0;
}
