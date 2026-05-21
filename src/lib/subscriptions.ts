export type SubscriptionTier = "free" | "basic" | "pro";

export interface SubscriptionPlan {
  tier: Exclude<SubscriptionTier, "free">;
  name: string;
  summary: string;
  monthlyPrice: number;
  stripePriceEnv: string;
  highlight?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<
  Exclude<SubscriptionTier, "free">,
  SubscriptionPlan
> = {
  basic: {
    tier: "basic",
    name: "Basic",
    summary: "Unlock PawPal AI chat and everyday care tools.",
    monthlyPrice: Number(process.env.NEXT_PUBLIC_BASIC_MONTHLY_EUR ?? 6.99),
    stripePriceEnv: "STRIPE_BASIC_PRICE_ID",
    highlight: true,
    features: [
      "Pet companion AI chat",
      "Food, breed, vet, and product tools",
      "AI tool cards with map and store actions",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    summary: "Priority AI plus future advanced pet insights.",
    monthlyPrice: Number(process.env.NEXT_PUBLIC_PRO_MONTHLY_EUR ?? 12.99),
    stripePriceEnv: "STRIPE_PRO_PRICE_ID",
    features: [
      "Everything in Basic",
      "Priority access for upcoming AI features",
      "Future Walk, safety, and multi-pet premium tools",
    ],
  },
};

export function normalizeTier(value: unknown): SubscriptionTier {
  if (value === "basic" || value === "pro") return value;
  return "free";
}

export function paidTierFromValue(
  value: unknown,
): Exclude<SubscriptionTier, "free"> | null {
  const tier = normalizeTier(value);
  return tier === "basic" || tier === "pro" ? tier : null;
}

export function isEntitlementActive(expiresAt: string | null | undefined) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export function hasAiAccess(row: {
  subscription_tier?: string | null;
  subscription_expires_at?: string | null;
}) {
  const tier = normalizeTier(row.subscription_tier);
  return tier !== "free" && isEntitlementActive(row.subscription_expires_at);
}

export function hasProAccess(row: {
  subscription_tier?: string | null;
  subscription_expires_at?: string | null;
}) {
  const tier = normalizeTier(row.subscription_tier);
  return tier === "pro" && isEntitlementActive(row.subscription_expires_at);
}

export function tierFromStripePrice(priceId?: string | null): SubscriptionTier {
  if (!priceId) return "free";
  if (process.env.STRIPE_BASIC_PRICE_ID === priceId) return "basic";
  if (process.env.STRIPE_PRO_PRICE_ID === priceId) return "pro";
  return "free";
}
