import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertStripeTestMode,
  createStripeIdempotencyKey,
  getStripeSecretKey,
} from "../src/lib/stripeGuard.ts";

const checks = [];

function pass(message) {
  checks.push({ ok: true, message });
}

function check(message, fn) {
  try {
    fn();
    pass(message);
  } catch (error) {
    checks.push({
      ok: false,
      message: `${message}: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

const liveSecretPrefix = `${["sk", "live"].join("_")}_`;
const livePublishablePrefix = `${["pk", "live"].join("_")}_`;

check("Guard allows Stripe test secret keys.", () => {
  assert.doesNotThrow(() =>
    assertStripeTestMode({ STRIPE_SECRET_KEY: "sk_test_contract" }),
  );
});

check("Guard rejects Stripe live secret keys.", () => {
  assert.throws(
    () => assertStripeTestMode({ STRIPE_SECRET_KEY: `${liveSecretPrefix}contract` }),
    /test mode only/,
  );
});

check("Guard rejects Stripe live publishable keys.", () => {
  assert.throws(
    () =>
      assertStripeTestMode({
        STRIPE_SECRET_KEY: "sk_test_contract",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: `${livePublishablePrefix}contract`,
      }),
    /test mode only/,
  );
});

check("Missing Stripe secret still uses the existing not-configured error.", () => {
  assert.doesNotThrow(() => assertStripeTestMode({}));
  assert.throws(() => getStripeSecretKey({}), /STRIPE_SECRET_KEY is not configured/);
});

check("Stripe idempotency keys are stable and namespace-scoped.", () => {
  const left = createStripeIdempotencyKey("store-checkout", {
    b: 2,
    a: [{ z: "same", y: undefined }],
  });
  const right = createStripeIdempotencyKey("store-checkout", {
    a: [{ z: "same" }],
    b: 2,
  });
  const other = createStripeIdempotencyKey("subscription-checkout", {
    a: [{ z: "same" }],
    b: 2,
  });

  assert.equal(left, right);
  assert.notEqual(left, other);
  assert.match(left, /^store-checkout-[a-f0-9]{48}$/);
});

const [
  storeCheckoutRoute,
  subscriptionCheckoutRoute,
  checkoutSessionRoute,
  webhookRoute,
] = await Promise.all([
  readFile(new URL("../src/app/api/checkout/route.ts", import.meta.url), "utf8"),
  readFile(
    new URL("../src/app/api/subscriptions/checkout/route.ts", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/app/api/checkout/session/route.ts", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url),
    "utf8",
  ),
]);

check("Store checkout route calls the Stripe test-mode guard.", () => {
  assert.match(storeCheckoutRoute, /assertStripeTestMode\(\)/);
  assert.match(storeCheckoutRoute, /getStripeSecretKey\(\)/);
});

check("Subscription checkout route calls the Stripe test-mode guard.", () => {
  assert.match(subscriptionCheckoutRoute, /assertStripeTestMode\(\)/);
  assert.match(subscriptionCheckoutRoute, /getStripeSecretKey\(\)/);
});

check("Checkout session retrieval route calls the Stripe test-mode guard.", () => {
  assert.match(checkoutSessionRoute, /assertStripeTestMode\(\)/);
  assert.match(checkoutSessionRoute, /getStripeSecretKey\(\)/);
});

check("Checkout session creation passes Stripe idempotency keys.", () => {
  assert.match(storeCheckoutRoute, /createStripeIdempotencyKey\("store-checkout"/);
  assert.match(subscriptionCheckoutRoute, /createStripeIdempotencyKey\("subscription-checkout"/);
  assert.match(storeCheckoutRoute, /\{\s*idempotencyKey\s*\}/);
  assert.match(subscriptionCheckoutRoute, /\{\s*idempotencyKey\s*\}/);
});

check("Webhook route verifies Stripe signatures before processing.", () => {
  assert.match(webhookRoute, /stripe\.webhooks\.constructEvent\(await req\.text\(\), signature, secret\)/);
  assert.match(webhookRoute, /Missing Stripe signature[\s\S]*status:\s*400/);
  assert.match(webhookRoute, /catch \(err\)[\s\S]*status:\s*400/);
});

for (const result of checks) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.message}`);
}

const failed = checks.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
