# Round 07 Brief: Shared Visual System And Dark Mode Hardening

Status: Revised for four-lead approval
Date: 2026-06-11
Owner: Codex

## Goal

Harden the shared visual system after the route-level upgrades: reduce dark-mode ambiguity, normalize shared UI primitives, and fix hydration/noise risks from motion surfaces without changing product, data, auth, payment, map, or deployment behavior.

## Approved Scope

Primary runtime routes for evidence:

- `/`
- `/store`
- `/auth`
- `/tag/sample-id`
- `/store/checkout`
- `/globe`

Allowed implementation files:

- `src/app/globals.css`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/StatusMessage.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ProductCard.tsx`
- `src/components/ui/AppDeepLinkButton.tsx`
- `src/components/ui/NfcIdentityCard.tsx`

Conditional implementation files, only if needed to resolve shared visual-system or motion/dark-mode evidence failures:

- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/HomeClientParts.tsx`
- `src/app/store/page.tsx`
- `src/app/store/checkout/page.tsx`
- `src/app/auth/page.tsx`
- `src/app/tag/[id]/TagPageClient.tsx`
- `src/components/GlobeFullPage.tsx`
- `src/components/WeatherTicker.tsx`

## Non-Goals

- No route redesigns or first-viewport layout rewrites beyond what is needed to fix shared dark-mode/motion/primitive issues.
- No Store product discovery changes, Homepage hero content changes, Globe HUD redesign, Auth form workflow changes, Checkout flow changes, or Tag rescue behavior changes.
- No Supabase, Stripe, auth/session, API, AI, map-search, weather-fetch, cart, order, database, env, deployment, CI, manifest, service worker, sitemap, robots, package, or dependency changes.
- No new visual assets.
- No broad `globals.css` extraction/refactor in this round.
- No new design tokens unless a token is required to replace duplicated raw dark-mode values and is documented in evidence.

## Stop And Reapproval Rules

Implementation must pause and request amended four-lead approval if any of these occur:

- Any file outside the approved or conditional file lists needs to change.
- Any package, lockfile, build-system, config, env, deploy, CI, manifest, service worker, sitemap, robots, or metadata file needs to change.
- Any route/product behavior change is required to solve a visual issue.
- Any accepted dark-mode limitation would leave a primary CTA, input, error, rescue action, checkout action, map control, or nav/menu item unreadable or inaccessible.

## Routes Affected

Primary evidence routes:

- `/`
- `/store`
- `/auth`
- `/tag/sample-id`
- `/store/checkout`
- `/globe`

Smoke routes if Navbar/Footer/shared primitives change:

- `/about`
- `/privacy`
- `/terms`
- `/store/orders`
- `/store/success`

## Primary User Scenario

A user browsing PawPal in normal, reduced-motion, or dark-mode system settings should see the same route purpose and controls without hydration warnings, low-contrast text, invisible buttons, or one-off white surfaces that break the product's visual consistency.

## First-Viewport Product Goal

At 390x844 and 1280x720, each primary route must still show:

- The route's main purpose.
- Its primary CTA or task control.
- A readable surface hierarchy in light and dark schemes.

## Trust / Safety States In Scope

- Signed-out account access via `/auth`.
- Missing sample tag state via `/tag/sample-id`.
- Empty checkout/default checkout state via `/store/checkout`.
- Globe map loading/loaded visual shell via `/globe`.
- Home and Store public product discovery surfaces.

## Baseline Findings

Raw baseline assets:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-baseline-browser-results.json`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-baseline-playwright-results.json`

Browser light-mode baseline:

- 12/12 route/viewport checks passed.
- Current relevant warn/error logs: 0.
- Horizontal overflow: 0.

Playwright light/dark screenshot baseline:

- 24 screenshots captured.
- 15/24 passed the automated screenshot/log gate.
- 9/24 failed due to console warnings/errors, not horizontal overflow.
- `/` and `/store` failed in both light and dark at 390x844 and 1280x720.
- `/store/checkout` failed in dark at 1280x720.
- `/auth`, `/tag/sample-id`, and `/globe` passed the automated gate, but visual inspection showed dark-mode ambiguity still needs design review.

Observed baseline risks:

- Home and Store emit Framer Motion reduced-motion warnings under reduced-motion screenshot capture.
- Home, Store, and Checkout can emit hydration mismatch warnings from motion/client attributes.
- Dark-mode screenshot requests still compute `colorScheme: light` and keep white body surfaces, so dark mode is not a first-class visual system.
- Dark Auth baseline visually appears low-contrast/faded despite passing automated log/overflow checks.
- Several shared surfaces still depend on raw `bg-white`, `bg-white/*`, hard-coded shadow rgba values, and broad dark-mode compatibility selectors.

## Product Tradeoffs And Unresolved Risks

- A true dark theme for every route may be too broad for one round; Round 07 should prioritize readable shared primitives and the specific baseline failures.
- Reduced-motion warnings may require changing Framer Motion usage patterns in Home/Store/Checkout, which touches user-visible animation behavior but not product logic.
- Dark-mode compatibility selectors in `globals.css` should not be removed wholesale until after route screenshots pass.
- Some map/WebGL warnings may be browser/GPU-specific; they should be recorded separately from app warnings if they occur.

## Risk Level

Medium.

This round touches shared primitives and possibly Home/Store motion surfaces. It is not allowed to change product behavior, route content strategy, or backend/data contracts.

## Required Evidence

- Pre-round snapshots and SHA-256 list for all expected and conditional files.
- Baseline Browser JSON for primary routes at 390x844 and 1280x720.
- Baseline light/dark screenshots for primary routes at 390x844 and 1280x720.
- After Browser JSON for primary routes at 390x844 and 1280x720.
- After light/dark screenshots for primary routes at 390x844 and 1280x720.
- If Navbar/Footer/shared primitives change, smoke Browser JSON and light/dark screenshots for `/about`, `/privacy`, `/terms`, `/store/orders`, and `/store/success` at 390x844 and 1280x720.
- `npm run lint`.
- `npm run build`.
- Console-log matrix distinguishing app warnings/errors from expected Browser/GPU/tooling warnings.
- Hydration warning matrix for Home, Store, and Checkout before/after.
- Reduced-motion evidence for Home, Store, and Checkout.
- Dark-mode readability evidence for Home, Store, Auth, Tag sample, Checkout, and Globe.
- Dark-mode emulation proof using `matchMedia('(prefers-color-scheme: dark)').matches` or equivalent computed evidence. If tooling still reports `colorScheme: light`, screenshots alone cannot be treated as passing dark-mode evidence.
- Accessibility/focus evidence for every changed shared primitive and affected primary route:
  - Keyboard focusability.
  - `focus-visible` styling.
  - Accessible names or labels for buttons, links, inputs, and status messages.
  - Disabled, loading, and error states remain visually distinguishable in light, dark, and reduced-motion settings.
  - If Navbar/Footer/shared primitives change, smoke routes `/about`, `/privacy`, `/terms`, `/store/orders`, and `/store/success` must include the same focus and accessibility evidence.
- Product route-preservation matrix covering `/`, `/store`, `/auth`, `/tag/sample-id`, `/store/checkout`, `/globe`, plus smoke routes if shared nav/footer/primitives change. For each route, record:
  - Route purpose.
  - Primary CTA or task control.
  - Trust or recovery state.
  - Whether commerce/account/rescue/map behavior is unchanged.
  - Whether product commitments or copy changed.
  - Whether light/dark/reduced-motion evidence keeps the route usable.
- Component ownership matrix for each changed shared primitive.
- Source-diff audit proving no protected product/data/API behavior changed.
- `DIFF_ATTRIBUTION` must prove any touched conditional file is limited to visual, dark-mode, motion, or hydration work only. It must explicitly confirm no changes to:
  - Auth handlers.
  - Router destinations.
  - Checkout fetch URL, method, or body.
  - Cart/order logic.
  - Tag rescue data handling.
  - MapLibre initialization, style, source, layer, or geolocation behavior.
  - WeatherTicker fetch URL, params, or parsing.

## Acceptance Criteria

- No current relevant app console warnings/errors on primary routes after implementation.
- No hydration mismatch warnings on Home, Store, or Checkout under the final validation setup.
- No horizontal overflow at 390x844 or 1280x720.
- Dark-mode screenshots must not show low-contrast primary controls, invisible button text, or unintended disabled-looking forms.
- Shared primitive changes must improve route consistency without flattening route character from Rounds 02-06.
- Any remaining dark-mode limitation must have an explicit owner, reason, and follow-up round.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
