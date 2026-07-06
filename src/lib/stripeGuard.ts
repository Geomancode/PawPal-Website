import { createHash } from "node:crypto";

type StripeGuardEnv = Readonly<Record<string, string | undefined>>;

const STRIPE_KEY_ENV_NAMES = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const;

const LIVE_KEY_PREFIXES = [
  `${["sk", "live"].join("_")}_`,
  `${["pk", "live"].join("_")}_`,
] as const;

const LIVE_KEY_ERROR =
  "Production Stripe keys are disabled; this project is test mode only. 生产密钥被禁用，本项目仅测试模式。";

export function assertStripeTestMode(env: StripeGuardEnv = process.env) {
  for (const name of STRIPE_KEY_ENV_NAMES) {
    const value = env[name]?.trim();
    if (!value) continue;

    if (LIVE_KEY_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      throw new Error(`${LIVE_KEY_ERROR} (${name})`);
    }
  }
}

export function getStripeSecretKey(env: StripeGuardEnv = process.env) {
  assertStripeTestMode(env);
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
}

export function createStripeIdempotencyKey(namespace: string, payload: unknown) {
  const safeNamespace =
    namespace.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 48) || "stripe";
  const digest = createHash("sha256")
    .update(JSON.stringify(stableValue(payload)))
    .digest("hex")
    .slice(0, 48);

  return `${safeNamespace}-${digest}`;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const child = (value as Record<string, unknown>)[key];
        if (child !== undefined) acc[key] = stableValue(child);
        return acc;
      }, {});
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  return value;
}
