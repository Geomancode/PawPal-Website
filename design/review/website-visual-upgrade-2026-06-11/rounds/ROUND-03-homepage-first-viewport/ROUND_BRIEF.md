# Round 03 Brief: Homepage First Viewport

Status: Approved for implementation
Date: 2026-06-11
Owner: Codex

## Goal

Execute the next approved visual upgrade slice from `WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md`: refactor the Homepage first viewport so the PawPal product proof, especially the live map/globe value, appears earlier on mobile while preserving the primary CTA path and avoiding cross-route or backend behavior changes.

## Approved Scope

- Compact the Homepage hero opening rhythm on `/`.
- Bring at least part of the globe/map product visual into the first 390x844 viewport.
- Keep `Open Live Map` and `Shop Smart Tags` as the primary CTA pair.
- Reduce or move secondary hero signals/badges that currently push the globe below the first viewport.
- Reduce desktop hero callout density if needed, keeping no more than two first-viewport floating proof callouts.
- Keep the hero route character marketing/editorial, but make it product-led rather than decoration-led.
- Add or preserve reduced-motion handling for touched Homepage Framer Motion animations where practical inside the approved files.

## Non-Goals

- No Store changes.
- No Globe engine, map behavior, weather, chat, tutorial, layer control, or `Globe.tsx` implementation changes.
- No Auth, Profile, Tag, About, Help, Legal, Footer, Checkout, Orders, Admin, API, Stripe, Supabase, database, AI, map-search, service worker, manifest, deployment, environment, dependency, package, or build-system changes.
- No broad `globals.css` cleanup in this round.
- No new asset generation or product data.
- No redesign of downstream homepage sections unless a tiny spacing adjustment is required to avoid first-viewport collision.

## Routes Affected

Implementation route:

- `/`

Verification routes:

- `/`
- `/globe`
- `/store`

`/globe` and `/store` are verification-only because the Homepage primary CTAs link there.

## Files Expected To Change

Expected implementation files:

- `src/app/page.tsx`
- `src/components/HomeClientParts.tsx`

Expected documentation/evidence files:

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-03-homepage-first-viewport/*`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-03-homepage-first-viewport/*`

Stop rule:

If implementation requires touching `src/app/globals.css`, `src/components/Globe.tsx`, `src/components/GlobeFullPage.tsx`, `src/components/Navbar.tsx`, shared UI components, Store files, Auth/Profile/Tag/About/Help/Legal/Footer files, API/payment/database/auth/deployment/config/dependency files, or image assets, the implementer must stop and request brief amendment plus four-lead approval before continuing.

## Primary User Scenario

A first-time visitor opens `/` on mobile to understand what PawPal is. Within the first mobile viewport, they should see the safety/map promise, access the live map CTA, and see concrete map/globe product proof without scrolling through several marketing signals first.

## Primary CTA / Conversion Path

Primary path:

1. Open `/`.
2. Understand PawPal as a pet safety map + smart tag product.
3. Tap `Open Live Map` to reach `/globe`.

Secondary path:

1. Open `/`.
2. Tap `Shop Smart Tags` to reach `/store`.

## First-Viewport Product Goal

Round 01 baseline at 390x844:

- H1 top: `201`.
- `Open Live Map` top: `803`.
- `Shop Smart Tags` top: `863`.
- Globe canvas top: `1284`.

Round 03 target at 390x844:

- H1 remains visible in the first viewport.
- `Open Live Map` begins before roughly `top: 620`.
- `Shop Smart Tags` begins before roughly `top: 680`, or remains immediately adjacent/stacked with the primary CTA in the same CTA group.
- Globe/map product visual begins before roughly `top: 820`; partial visibility at the bottom of the first viewport is acceptable if the visual is recognizable.
- Signal rail/badges must not push the product proof below the first viewport.
- No horizontal overflow at 390.

Desktop target at 1280x720:

- Globe/map visual remains visible and framed in the first viewport.
- No more than two floating hero callouts are visible in the desktop first viewport.
- Primary CTA group remains clear and not visually secondary to badges.

## Trust / Safety States In Scope

- Homepage safety promise remains credible and visible.
- `Open Live Map` and `Shop Smart Tags` remain reachable and visually legible.
- Existing nav/header behavior remains unchanged.
- Globe rendering on Homepage must remain nonblank.

## Product Tradeoffs And Unresolved Risks

- This round prioritizes mobile first-viewport product proof over showing every trust badge above the fold.
- Some secondary proof badges may move below the hero or compress into a lighter row.
- The full interactive Globe component may be heavy in the mobile hero; implementation should avoid changing the Globe internals and instead adjust framing/positioning.
- Browser could not emulate dark/reduced-motion in earlier rounds; source and runtime evidence must be recorded explicitly.
- Existing worktree contains pre-existing dirty source/config changes; Round 03 attribution is limited to changes made after `DIFF_BASELINE.md` and the pre-implementation snapshots.

## Risk Level

Medium. The round touches the public homepage first impression and an interactive globe embed, but the intended change is limited to Homepage layout/composition and avoids data/payment/auth behavior.

## Required Evidence

- Command results:
  - `npm run lint`
  - `npm run build`
- Browser checks:
  - URL/title.
  - Non-empty render.
  - Blocking overlay status.
  - Console errors/warnings.
  - `/` CTA interactions: `Open Live Map` reaches `/globe`; `Shop Smart Tags` reaches `/store`.
  - Homepage globe/map proof is nonblank.
- Screenshots:
  - Before evidence from Round 01.
  - After screenshots for `/` at 390x844, 768x1024, 1280x720, and 1440x900.
  - After screenshots for `/globe` and `/store` only if CTA route behavior appears affected.
- Responsive measurements:
  - H1 top.
  - `Open Live Map` top.
  - `Shop Smart Tags` top.
  - Globe/map visual top and visible area.
  - Desktop visible floating hero callout count.
- Accessibility notes:
  - Keyboard/focusability evidence for CTA links.
  - Reduced-motion behavior for touched Homepage Framer Motion animations.
  - Dark-mode visual/source evidence or explicit Browser blocker.
- Known risks:
  - Existing dirty worktree attribution.
  - Any inability to test real WebGL/canvas pixels or media emulation.
  - Any deviation from the two-file implementation boundary.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace

## Exit Criteria

- Four leads approve this Round 03 brief.
- Implementation stays inside approved scope.
- Final diff is attributable against the Round 03 pre-implementation snapshots.
- Lint/build pass or blocker is accepted.
- Browser evidence confirms Homepage first-viewport targets.
- Four leads review Round 03 evidence and sign the final record.

## Brief Approval Result

Approved by all four leads:

- QA / Linnaeus: 通过
- Product / Plato: 通过
- Engineering / McClintock: 通过
- Design / Laplace: 通过
