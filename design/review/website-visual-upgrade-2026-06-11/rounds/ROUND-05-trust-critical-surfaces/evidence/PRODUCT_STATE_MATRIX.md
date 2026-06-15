# Product State Matrix: Round 05

Date: 2026-06-11

| Route / state | User-facing explanation | Primary or recovery CTA | Reason to trust | Evidence |
| --- | --- | --- | --- | --- |
| `/auth` sign-in | Account access is for profiles, tags, and orders. | Sign In | Email account access only; private owner details. | Runtime: after screenshots and auth interaction. |
| `/auth` sign-up | One account covers pet safety and orders. | Create Account | Same trust panel; no unsupported social login promise. | Runtime: `interaction-auth-signup-390x844.png`. |
| `/auth` validation error | Password rules are shown without submitting real credentials. | Correct form fields | Error is local client validation. | Runtime: `interaction-auth-error-390x844.png`. |
| `/profile` logged out | User is redirected to account entry. | Sign In | Auth trust panel is visible after redirect. | Runtime: `/profile` after capture. |
| `/profile` authenticated | Profile interior remains outside runtime verification because no local authenticated session exists. | Existing profile actions unchanged. | Source hash unchanged from pre-round snapshot. | Source audit fallback. |
| `/tag/[id]` invalid/missing | App not-found says the route may be old, private, or missing a valid ID. | Back home; Shop smart tags | Scanned-tag recovery guidance visible. | Runtime: `/tag/sample-id` after capture and CTA interaction. |
| `/tag/[id]` valid finder | Contact owner remains the valid finder primary CTA. | Contact owner now | Privacy-first safety profile. | Source hash unchanged; no local valid tag sample available. |
| `/tag/[id]` private/hidden contact | Owner contact hidden state remains available in `TagPageClient`. | Open in app; Get a PawPal tag | Privacy-first safety profile. | Source hash unchanged; runtime sample unavailable. |
| `/store/checkout` empty cart | Empty cart redirects to Store. | Store product discovery, Cart, Orders | Secure checkout proof remains in Store first viewport. | Runtime: `/store/checkout` after capture. |
| `/store/checkout` cart-present form | Checkout form and Stripe submit contract unchanged. | Review Order; Pay with Stripe | Existing Stripe-secured summary unchanged. | Source hash unchanged; no checkout form visual change. |
| `/store/orders` empty/history | Orders appear only after Stripe-confirmed purchases. | Browse Products | Delivery and payment status explanation. | Runtime: after screenshots and CTA interaction. |
| `/store/success` missing session | Payment cannot be verified without a Stripe session. | Back to Store; View Orders | Page alone cannot create a charge or order. | Runtime: after screenshots and CTA interaction. |
| `/store/success` payment success | Payment confirmed state remains source-compatible. | View My Orders; Continue Shopping | Paid via Stripe and receipt messaging unchanged. | Source audit fallback. |
| `/store/success` subscription success | Plan activated state remains source-compatible. | Manage Plans; Continue Shopping | Refresh-plan guidance unchanged. | Source audit fallback. |
| `/store/success` loading | Confirmation loading state remains source-compatible. | None while loading | Payment is being confirmed. | Source audit fallback. |
