# Round 01 Brief: Baseline Stabilization

Status: Approved for evidence capture
Date: 2026-06-11
Owner: Codex

## Goal

Execute Phase 0 from `WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md`: stabilize the local preview baseline, capture current rendered evidence, and record console/runtime observations before any visual implementation begins.

## Approved Scope

- Verify current preview availability on `http://localhost:3000`.
- Capture current baseline screenshots and runtime notes for key routes.
- Save evidence under `design/assets/review/website-visual-upgrade-2026-06-11/round-01-baseline/`.
- Record console errors/warnings per checked route.
- Record page identity, title, non-empty render, blocking overlay status, and viewport notes.
- Create Round 01 acceptance files and final signoff record after evidence is captured.

## Non-Goals

- No UI implementation changes.
- No CSS/component refactor.
- No dependency, package, build-system, environment, CI, deployment, API, database, auth, Stripe, Supabase, AI, or map-search changes.
- No attempt to create fake production data.
- No checkout purchase, login, payment submission, or external side effect.

## Routes Affected

No routes are modified. Routes inspected:

- `/`
- `/store`
- `/globe`
- `/auth`
- `/profile`
- `/about`
- `/tag/sample-id`
- `/store/checkout`
- `/store/orders`
- `/store/success`

## Files Expected To Change

Documentation and evidence only:

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-01-baseline-stabilization/*`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-01-baseline/*`

## Primary User Scenario

Baseline observation of the current PawPal public website and core trust/commerce/tool routes before visual upgrade work.

## Primary CTA / Conversion Path

No conversion path will be modified. Baseline checks will note visible primary CTAs on Home, Store, Auth, Tag, and Globe where present.

## First-Viewport Product Goal

Measure whether current first viewports expose the intended core product signal:

- Home: pet safety map + smart tag ecosystem.
- Store: product discovery.
- Globe: interactive map/tool surface.
- Auth/Profile path: trustworthy account entry.
- Tag: emergency/finder action if route renders usable content.

## Trust / Safety States In Scope

- Signed-out `/profile -> /auth` redirect must be checked directly and recorded separately from `/auth`.
- `/tag/sample-id` may render not-found or missing-data state; this must be recorded rather than forced.
- Store checkout/orders/success may render empty, redirect, or unavailable states; these must be recorded without side effects.

## Product Tradeoffs And Unresolved Risks

- A real NFC tag id is not available. The sample tag route is used only to capture the current missing/invalid-data state.
- Checkout and order routes may require cart/auth/session state. The baseline records the current unauthenticated/empty-session behavior.
- This round may produce evidence of problems but will not fix them.

## Risk Level

Low. Browser/evidence-only round with documentation updates.

## Required Evidence

- Command results:
  - Preview availability check.
  - `npm run lint` and `npm run build` are N/A only because this is a baseline-evidence/non-implementation round. If any source, CSS, component, dependency, config, environment, API, database, auth, payment, Stripe, Supabase, CI, or deployment change occurs, lint/build become mandatory and Engineering review must restart.
- Browser checks:
  - URL/title.
  - Non-empty render.
  - Blocking overlay status.
  - Console errors/warnings.
- Screenshots:
  - Desktop and mobile screenshots for listed routes where render succeeds.
- Responsive measurements:
  - 390x844, 768x1024, 1280x720, and 1440x900 for every listed route where render succeeds.
  - If a route cannot be fully captured or a state is unreachable, record the route-specific reason rather than omitting it.
- Accessibility notes:
  - Keyboard focus smoke check for visible primary controls where practical.
  - Reduced-motion behavior and dark-mode state per route. If either cannot be captured, record the exact reason, impact, and follow-up round.
- Known risks:
  - Route-specific blockers, auth/session limits, missing sample data.

## Additional Required Baseline Fields

For each listed route, record:

- Route character classification.
- URL and title.
- Redirect behavior, if any.
- Non-empty render status.
- Blocking overlay status.
- Console errors/warnings.
- Screenshot paths for 390, 768, 1280, and 1440.
- First-viewport core signal, primary CTA, or core visual position.
- Basic interaction and keyboard focus notes for visible primary controls.
- Dark-mode visual quality.
- Motion and reduced-motion behavior.
- Current decoration load and visual hierarchy conflicts.
- State limitation or data limitation, if any.

Product-specific notes:

- Home: whether `Open Live Map` and `Shop Smart Tags` are clear.
- Store: whether product discovery and purchase path enter the first viewport.
- Globe: whether the map is dominant and controls interfere with use.
- Auth/Profile: whether signed-out account entry is trustworthy and not blank.
- Tag sample: whether invalid/missing-data state is clear and not alarming.
- Checkout/Orders/Success: whether empty-session or unauthenticated state has a clear next step.

Engineering-specific notes:

- Preview startup or availability command and result.
- Actual URL visited for each route.
- Whether any dev-server/port handling was needed.
- Confirmation that this round changed only evidence and round documentation.
- Confirmation that dependency, build-system, database, API, deployment, env, auth, payment, Stripe, and Supabase boundaries were untouched.
- Browser console errors grouped by route and marked as pre-existing baseline observations, not introduced by this round.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace

## Exit Criteria

- Four leads approve this Round 01 brief.
- Evidence capture completes.
- Four leads review Round 01 evidence and sign the final record.
- Only after final Round 01 signoff may Round 02 implementation planning begin.
