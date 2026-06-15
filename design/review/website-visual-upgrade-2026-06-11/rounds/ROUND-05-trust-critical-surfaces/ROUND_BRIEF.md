# Round 05 Brief: Trust-Critical Surfaces

Status: Revised for four-lead approval
Date: 2026-06-11
Owner: Codex

## Goal

Improve the trust-critical public and unauthenticated surfaces so account entry, rescue-link failure states, checkout/order status, and payment status feel reliable, compact, and state-specific rather than generic or overly spacious.

## Approved Scope

Implementation may improve visual layout, copy hierarchy, empty/error/loading states, and accessibility affordances for:

- `/auth`
- `/profile` unauthenticated redirect path only, unless a valid local authenticated session is already available.
- `/tag/[id]` public finder/not-found state and `TagPageClient` visual structure.
- `/store/checkout` checkout shell, empty-cart redirect evidence, and form/review visual hierarchy reachable through normal Store UI.
- `/store/orders` empty/history surface.
- `/store/success` success, subscription, loading, and missing-session error surfaces.

Allowed implementation files:

- `src/app/auth/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/tag/[id]/TagPageClient.tsx`
- `src/app/tag/[id]/page.tsx`
- `src/app/store/checkout/page.tsx`
- `src/app/store/orders/page.tsx`
- `src/app/store/success/page.tsx`
- `src/app/globals.css`, only grouped trust/auth/profile/tag/commerce/status selectors.
- `src/app/layout.tsx`, only if needed for the official `data-scroll-behavior="smooth"` attribute that resolves the current Next.js smooth-scroll warning.

## Non-Goals

- No auth provider, Supabase client, session, sign-in, sign-up, profile creation, pet creation, or protected data behavior changes.
- No Stripe API, checkout API, session API, webhook, payment, cart persistence, or order persistence behavior changes.
- No database migrations, RLS/policy changes, environment variables, dependency changes, deployment/CI changes, or service-worker/PWA manifest changes.
- No redesign of Store product discovery already completed in Round 02.
- No authenticated Profile interior changes unless a verifiable authenticated state exists in the current Browser session.
- No new image assets.

## Routes Affected

Primary runtime routes:

- `/auth`
- `/profile`
- `/tag/sample-id`
- `/store/checkout`
- `/store/orders`
- `/store/success`

Additional interaction route if checkout form evidence is needed:

- `/store`

## Files Expected To Change

Expected:

- `src/app/auth/page.tsx`
- `src/app/tag/[id]/TagPageClient.tsx`
- `src/app/store/checkout/page.tsx`
- `src/app/store/orders/page.tsx`
- `src/app/store/success/page.tsx`
- `src/app/globals.css`

Conditional:

- `src/app/layout.tsx`, only for `data-scroll-behavior="smooth"`.
- `src/app/profile/page.tsx`, only for unauthenticated/loading/error trust-state polish or if authenticated evidence becomes available.
- `src/app/tag/[id]/page.tsx`, only for not-found metadata/state presentation; no data-fetch contract changes.

## Per-File Behavior Boundary Checklist

Final source-diff evidence must confirm these behavior contracts remain unchanged:

| File | Protected behavior contract |
| --- | --- |
| `src/app/auth/page.tsx` | No changes to `useAuth`, `signIn`, `signUp`, redirect destinations, validation semantics, or submitted credential fields. |
| `src/app/profile/page.tsx` | No changes to auth redirect logic, Supabase table names, selected fields, insert/update payloads, or protected profile/pet behavior. |
| `src/app/tag/[id]/page.tsx` | No changes to Supabase tables, selected public fields, `eq("id", id)`, owner lookup, `notFound()` behavior, or metadata data contract. |
| `src/app/tag/[id]/TagPageClient.tsx` | No changes to `owner_contact` exposure rules, `mailto:` / `tel:` derivation, deep-link target, or valid finder CTA semantics. |
| `src/app/store/checkout/page.tsx` | No changes to `loadCart`, empty-cart redirect, `/api/checkout` URL/method/body fields, Stripe redirect assignment, or cart/shipping data semantics. |
| `src/app/store/orders/page.tsx` | No changes to order persistence/source behavior or recovery route semantics. |
| `src/app/store/success/page.tsx` | No changes to `session_id` handling, `/api/checkout/session` URL, order save/cart clear conditions, subscription success logic, or recovery routes. |
| `src/app/globals.css` | Selector-level diff limited to trust/auth/profile/tag/commerce/status selectors; no tokens, resets, global helpers, dark-mode compatibility regressions, or unrelated route selectors. |
| `src/app/layout.tsx` | If changed, diff must be only `data-scroll-behavior="smooth"` on the official root element and nothing else. |

## Primary User Scenario

A visitor reaches a trust-sensitive moment: signing in, scanning a bad/expired tag link, checking order/payment status, or trying checkout/orders without enough context. The UI should quickly explain what happened, what is safe, and what the next trusted action is.

## Primary CTA / Conversion Path

- `/auth`: Sign in / Sign up remains the primary action.
- `/tag/[id]`: Contact owner remains primary when a valid pet exists; for invalid links, return home or shop smart tags remain recovery actions.
- `/store/checkout`: Continue checkout remains primary when cart exists; empty cart should return users to Store without confusion.
- `/store/orders`: Browse Products remains the empty-state recovery action.
- `/store/success`: Back to Store, View My Orders, or Manage Plans remain state-appropriate recovery actions.

## First-Viewport Product Goal

Each affected route must show the current state, trusted next step, and reason-to-trust in the first viewport at 390x844 and 1280x720. Secondary explanatory content may sit below.

## Trust / Safety States In Scope

- Auth: login/signup, validation error, success confirmation, password visibility.
- Profile: unauthenticated redirect to Auth; loading/unavailable states if source-touched.
- Tag: invalid/private/missing tag fallback and valid finder page source audit.
- Checkout: empty-cart redirect; shipping form/review visual hierarchy if reached through Store UI.
- Orders: empty order state.
- Success: loading, missing-session error, payment success, subscription success.

## Product State Matrix Requirement

Final evidence must include a route/state matrix with:

- Current state.
- User-facing explanation.
- First-viewport primary CTA or recovery CTA.
- Reason-to-trust visible in the first viewport.
- Runtime evidence status, or source-audit fallback when runtime data is unavailable.

Required matrix coverage:

- `/auth`: sign-in, sign-up, validation error, password visibility.
- `/profile`: unauthenticated redirect to Auth; authenticated states only if a verifiable local session exists.
- `/tag/[id]`: valid finder, invalid/missing, private/hidden contact, and missing owner/contact. If no valid local tag sample exists, final evidence must say so and use source/state audit for valid finder behavior.
- `/store/checkout`: cart-present checkout path when reachable through normal Store UI, plus empty-cart recovery.
- `/store/orders`: empty/history recovery.
- `/store/success`: loading, missing `session_id`, payment success, and subscription success.

## Visual Acceptance Criteria

- Do not add doodles, marketing hero sections, strong decorative gradients, unnecessary floating cards, or new image assets.
- Each first viewport must prioritize current state, next trusted action, and safety/trust explanation.
- Buttons, state badges, errors, empty states, and recovery actions must use existing PawPal token, radius, typography, and icon language.
- Layout compression must not cause text overlap, clipped CTAs, horizontal overflow, hidden error states, or state explanations pushed below the first viewport.
- If `TagPageClient` changes and no valid finder runtime sample exists, Design and Product evidence may cover only invalid/private/missing states at runtime plus source-level valid finder structure. Final evidence must not claim a valid rescue page was visually runtime-verified unless it was.

## Product Tradeoffs And Unresolved Risks

- Logged-in Profile visual validation is blocked unless an authenticated session is available locally.
- Checkout form state requires a cart created through Store UI because Browser page evaluation cannot write localStorage directly.
- `/tag/sample-id` currently resolves to the app not-found surface, not a valid pet finder page.
- Current baseline logs include the Next.js smooth-scroll warning after redirecting `/profile` and `/store/checkout`; the brief allows the minimal official attribute fix.

## Risk Level

Medium. The visual scope touches trust-critical routes, but the brief explicitly blocks auth/payment/API/data behavior changes.

## Required Evidence

- Pre-round snapshots for all expected implementation files.
- Baseline screenshots and JSON for `/auth`, `/profile`, `/tag/sample-id`, `/store/checkout`, `/store/orders`, `/store/success` at 390, 768, 1280, and 1440 widths.
- After screenshots and after JSON for every affected primary route at 390, 768, 1280, and 1440 widths.
- `npm run lint`.
- `npm run build`.
- Browser checks for affected routes: URL/title, meaningful render, visible framework overlay, timestamp-filtered console warn/error logs, horizontal overflow, first-viewport state clarity.
- First-viewport measurements at 390x844 and 1280x720 for each affected route, recording whether current state, trusted next action, and reason-to-trust are visible and where they appear.
- Interaction checks:
  - Auth sign-in/sign-up toggle and password visibility.
  - Auth validation error without submitting real credentials.
  - Store UI path to checkout if checkout form is changed.
  - Orders empty recovery CTA.
  - Success missing-session recovery CTA.
  - Tag invalid-link recovery CTA.
- Dark-mode and reduced-motion evidence for every touched surface. If Browser tooling cannot simulate either mode, final evidence must record the limitation, impact, and follow-up path.
- Accessibility notes for forms/buttons, error messages, and recovery actions.
- Source-diff audit proving auth/Supabase/Stripe/API/cart/order/session behavior is unchanged.
- If `src/app/layout.tsx` changes, prove it is only `data-scroll-behavior="smooth"`.
- If `src/app/layout.tsx` changes for the smooth-scroll warning, verify whether the `/profile` redirect and `/store/checkout` empty-cart redirect warnings disappear; if not, record why.
- If `TagPageClient` changes, verify valid finder/contact-owner behavior with a local sample when available. If unavailable, record the limitation and provide source-diff audit proving contact/privacy/recovery behavior is unchanged.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
