import type { ShippingInfo } from "@/app/store/storeData";

export const shippingFields = ["fullName", "email", "address", "city", "zipCode", "country", "phone"] as const;
export function normalizeShipping(value: unknown): ShippingInfo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const result = {} as ShippingInfo;
  for (const field of shippingFields) {
    if (typeof input[field] !== "string" || !input[field].trim()) return null;
    result[field] = input[field].trim();
  }
  return /^\S+@\S+\.\S+$/.test(result.email) ? result : null;
}
