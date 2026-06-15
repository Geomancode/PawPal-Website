# Round 02 Brief: Store First Viewport

Status: Approved for implementation
Date: 2026-06-11
Owner: Codex

## Goal

Execute the first implementation step from `WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md`: refactor the Store first viewport so product discovery and the purchase path appear earlier, while keeping the change narrow, reversible, and free of backend/payment/data side effects.

## Approved Scope

- Compact the `/store` hero into a commerce header rather than a landing-page hero.
- Move search, trust proof, category filters, product count, and first product cards upward.
- Reduce or remove decorative doodles/grid intensity in the Store opening viewport.
- Convert the three tall promise cards into a tighter trust strip or compact inline assurance row.
- Reduce the dominance of the empty-cart floating button before a user has added an item.
- Preserve existing product data, cart state, catalog fallback behavior, product details drawer, cart drawer, order links, and checkout routing.

## Non-Goals

- No Homepage changes.
- No Globe, Auth, Profile, Tag, About, Orders, Checkout, Success, Admin, Help, Legal, or Footer redesign.
- No Stripe, Supabase, auth, API, database, AI, map-search, service worker, manifest, deployment, environment, dependency, package, or build-system changes.
- No new product data.
- No checkout purchase, login, payment submission, or external side effect.
- No broad `globals.css` cleanup in this round.

## Routes Affected

Implementation route:

- `/store`

Verification routes:

- `/store`
- `/store/orders`
- `/store/checkout`

## Files Expected To Change

Expected implementation file:

- `src/app/store/page.tsx`

Expected documentation/evidence files:

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-02-store-first-viewport/*`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-02-store-first-viewport/*`

Stop rule:

If implementation requires touching `src/app/globals.css`, `src/components/ui/ProductCard.tsx`, store data, checkout, orders, auth, API, Stripe, Supabase, config, dependencies, or deployment files, the implementer must stop and request brief amendment plus four-lead approval before continuing.

## Primary User Scenario

A visitor opens `/store` to find smart tags or pet gear. Within the first mobile viewport they should understand the store purpose, search/filter products, and see the product discovery path without scrolling through a marketing-style hero and multiple promise cards.

## Primary CTA / Conversion Path

Primary path:

1. Open `/store`.
2. Search or choose a category.
3. See product cards earlier.
4. Tap `Add` or `Details`.
5. Cart/checkout path remains unchanged.

## First-Viewport Product Goal

Baseline at 390x844:

- Search starts at `top: 517`.
- Category filters start at `top: 1037`.
- First visible `Add` action starts at `top: 1647`.

Round 02 target at 390x844:

- Search remains visible in the first viewport.
- Category filters begin before roughly `top: 760`.
- First product card begins before roughly `top: 900`.
- Empty cart affordance does not obscure trust proof, filters, or product cards.
- First `Add` or equivalent purchase action after implementation must be measured and clearly higher than the Round 01 baseline.
- After a user adds a product, the cart/checkout entry must remain obvious and usable.

Desktop target at 1280x720:

- Category filters and product count are visible in the first viewport.
- The first product row or top edge of product cards is visible in the first viewport.

## Trust / Safety States In Scope

- Store trust proof remains visible but becomes compact.
- Catalog fallback warning remains available.
- Empty cart state remains reachable through the cart drawer when relevant.
- No checkout/payment/auth behavior changes.

## Product Tradeoffs And Unresolved Risks

- This round prioritizes commerce density over marketing warmth on `/store`.
- The empty cart floating action may be visually reduced or hidden until cart content exists; reviewers must confirm this is acceptable.
- Dark mode, keyboard focus, and reduced-motion checks must be run after implementation because Round 01 could not emulate them.
- Existing worktree contains pre-existing dirty source/config changes; Round 02 attribution is limited to changes made after `DIFF_BASELINE.md`.
- `src/app/store/page.tsx` has a precise pre-implementation snapshot at `evidence/store-page.pre-round02.tsx.snapshot`; final Round 02 attribution must compare against that snapshot.

## Risk Level

Medium. The change touches a user-facing commerce page but is intended to stay within one route component and avoid payment/data behavior.

## Required Evidence

- Command results:
  - `npm run lint`
  - `npm run build`
- Browser checks:
  - URL/title.
  - Non-empty render.
  - Blocking overlay status.
  - Console errors/warnings.
  - `/store` interactions: search, category filter, details drawer, add-to-cart, cart drawer, checkout link visibility.
- Screenshots:
  - Before evidence from Round 01.
  - After screenshots for `/store` at 390x844, 768x1024, 1280x720, and 1440x900.
  - After screenshots for `/store/orders` and `/store/checkout` if routing/recovery state appears affected.
- Responsive measurements:
  - Search top, category/filter top, first product card top, first `Details` action top, first `Add` action top.
  - Explicit before/after comparison for the first `Add` or equivalent purchase action.
- Accessibility notes:
  - Keyboard focus pass for search, category filters, product action, cart affordance, details drawer close.
  - Reduced-motion behavior for Store animations.
  - Dark-mode visual check for Store.
  - Because this is the first implementation round touching `/store`, keyboard, dark-mode, and reduced-motion may not be deferred as generic future work. If the in-app Browser cannot emulate a required media state, use an alternative verification method and record the method. If no alternative is available, record a blocker for reviewer decision.
- Known risks:
  - Existing dirty worktree attribution.
  - Any inability to test checkout/session states.
  - Any deviation from the one-file implementation boundary.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace

## Exit Criteria

- Four leads approve this Round 02 brief.
- Implementation stays inside approved scope.
- Store page final diff is attributable against `evidence/store-page.pre-round02.tsx.snapshot`.
- Lint/build pass or blocker is accepted.
- Browser evidence confirms Store first-viewport targets.
- Four leads review Round 02 evidence and sign the final record.
