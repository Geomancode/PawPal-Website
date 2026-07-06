# Payment Testing

PawPal payments must remain in Stripe test mode. Do not enable production mode
for this project, and do not paste live-mode Stripe keys into local, preview, or
production-like environments.

## Required Environment

Use only Stripe Dashboard test-mode values:

```bash
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_test_replace_me
STRIPE_BASIC_PRICE_ID=price_test_basic_monthly_replace_me
STRIPE_PRO_PRICE_ID=price_test_pro_monthly_replace_me
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

The payment guard rejects Stripe secret keys that start with `sk_` + `live_`
and publishable keys that start with `pk_` + `live_`. That includes
`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Test Cards

Use Stripe test cards only:

| Scenario | Card | Expiry | CVC | ZIP |
| --- | --- | --- | --- | --- |
| Successful card payment | `4242 4242 4242 4242` | Any future date | Any 3 digits | Any |
| Requires authentication | `4000 0025 0000 3155` | Any future date | Any 3 digits | Any |
| Card declined | `4000 0000 0000 9995` | Any future date | Any 3 digits | Any |

Do not use real cards for checkout, subscription, or webhook testing.

## Store Checkout E2E

1. Start the website with test-mode environment values:

   ```bash
   npm run dev
   ```

2. Open `/store`, add a product, and submit checkout.
3. Confirm the browser redirects to Stripe Checkout in test mode.
4. Pay with `4242 4242 4242 4242`.
5. Confirm the success redirect returns to:

   ```text
   /store/success?session_id={CHECKOUT_SESSION_ID}
   ```

6. Re-submit the same checkout payload quickly or through browser retry. The API
   sends a deterministic Stripe `idempotencyKey`, so Stripe should not create a
   second charge for the same request body within its idempotency window.

## Subscription Checkout E2E

1. Sign in or provide a valid PawPal account id.
2. Trigger Basic or Pro upgrade checkout from the store upgrade flow.
3. Pay with a Stripe test card.
4. Confirm the success redirect includes:

   ```text
   /store/success?intent=subscription&tier={tier}&session_id={CHECKOUT_SESSION_ID}
   ```

5. Confirm the subscription webhook updates `billing_subscriptions` and the
   profile subscription tier after a signed `checkout.session.completed` or
   `customer.subscription.updated` event.

## Webhook Verification

Use the Stripe CLI in test mode:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed test webhook secret into `STRIPE_WEBHOOK_SECRET`, then trigger:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

The webhook endpoint must call Stripe `constructEvent` with
`STRIPE_WEBHOOK_SECRET`. Requests without `Stripe-Signature`, or with an invalid
signature, return HTTP 400 and are not processed.

## Guard Contract

Run the no-dependency payment guard contract before shipping:

```bash
npm run test:payment-guard
```

This checks:

- test-mode secret keys are allowed;
- live-mode secret and publishable key prefixes are rejected;
- missing `STRIPE_SECRET_KEY` still returns the existing not-configured error;
- checkout session creation passes Stripe idempotency keys;
- webhook signature verification remains wired before processing.

## Never Enable Live Mode

This project is blocked from Stripe production mode by product policy. If any
environment contains a live-mode Stripe key, remove it immediately and replace
it with a Stripe Dashboard test-mode value. Do not bypass the guard for demos,
preview deployments, or manual testing.
