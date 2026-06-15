# Browser Verification: Round 05

Date: 2026-06-11
Tooling: Browser/IAB
Target: `http://localhost:3000`

The flow under test is: trust-critical entry route -> state-specific explanation and recovery action -> rendered result without console, overlay, or overflow regressions.

## Route Results

| Route key | Requested route | Final URL behavior | Viewports | Logs | Overlay | Overflow |
| --- | --- | --- | --- | ---: | --- | ---: |
| `auth` | `/auth` | `/auth` | 390, 768, 1280, 1440 | 0 | none | 0 |
| `profile` | `/profile` | Redirects to `/auth` when unauthenticated | 390, 768, 1280, 1440 | 0 | none | 0 |
| `tag-sample-id` | `/tag/sample-id` | Renders app not-found recovery state | 390, 768, 1280, 1440 | 0 | none | 0 |
| `checkout` | `/store/checkout` | Redirects to `/store` when cart is empty | 390, 768, 1280, 1440 | 0 | none | 0 |
| `orders` | `/store/orders` | `/store/orders` empty/history state | 390, 768, 1280, 1440 | 0 | none | 0 |
| `success` | `/store/success` | `/store/success` missing-session state | 390, 768, 1280, 1440 | 0 | none | 0 |

## First-Viewport State Clarity

| Route key | 390x844 | 1280x720 |
| --- | --- | --- |
| `auth` | State, Sign In CTA, email-account trust panel visible. | Account story, form, Sign In CTA, trust panel visible. |
| `profile` | Redirect lands on Auth state with Sign In CTA and trust panel visible. | Redirect lands on Auth state with Sign In CTA and trust panel visible. |
| `tag-sample-id` | Not-found explanation, Back home, Shop smart tags, scanned-tag guidance visible. | Same state and recovery actions visible. |
| `checkout` | Empty cart redirects to Store; Store header, search, secure checkout proof, Cart/Orders controls visible. | Empty cart redirects to Store with commerce header and controls visible. |
| `orders` | My Orders, 0 orders, no-orders state, Browse Products CTA, Stripe-confirmed explanation visible. | Same empty/history recovery state visible. |
| `success` | Checkout status, missing-session explanation, no-charge trust copy, Back to Store and View Orders visible. | Same status card visible with corrected desktop width. |

## Interaction Results

| Interaction | Result | Evidence |
| --- | --- | --- |
| Auth sign-up toggle | PASS | `interaction-auth-signup-390x844.png` |
| Auth password visibility | PASS | `passwordTypeAfterShow: "text"` in `round05-interaction-results.json` |
| Auth validation error | PASS | `errorVisible: true`; `interaction-auth-error-390x844.png` |
| Orders empty CTA | PASS | Browse Products reaches `/store`; `interaction-orders-browse-store-390x844.png` |
| Success missing-session CTA | PASS | View Orders reaches `/store/orders`; `interaction-success-view-orders-390x844.png` |
| Tag invalid-link CTA | PASS | Shop smart tags reaches `/store`; `interaction-tag-shop-smart-tags-390x844.png` |

## Accessibility Notes

- Auth toggle buttons now expose `aria-pressed`.
- Auth fields now have `htmlFor` / `id` label wiring.
- Auth error and success banners expose `role="alert"` and `role="status"`.
- Auth form references active error/success banners with `aria-describedby`.
- Password visibility control keeps a state-specific `aria-label`.
- Recovery actions are reachable as buttons or links with visible text.

## Dark Mode And Reduced Motion

Browser/IAB did not provide a color-scheme or reduced-motion emulation capability in this run.

Source evidence:

- Existing `@media (prefers-color-scheme: dark)` block preserves the app's intentional light PawPal palette.
- Existing `@media (prefers-reduced-motion: reduce)` disables decorative CSS animations and smooth scrolling.
- Round 05 did not add new keyframes, new Framer Motion surfaces, or new dark-mode-specific selectors.

Runtime limitation:

- Dark-mode and reduced-motion were not separately emulated in Browser. Final acceptance should treat this as source-level evidence plus no new animation/dark-mode expansion in this round.
