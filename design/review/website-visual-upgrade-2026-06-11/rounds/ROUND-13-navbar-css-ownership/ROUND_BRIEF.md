# Round Brief: Round 13 Navbar CSS Ownership Extraction

Round: 13  
Status: Implemented, conditional four-lead approved  
Date: 2026-06-14  
Owner: Codex

## Goal

Continue the global CSS ownership cleanup by moving active Navbar-owned selectors from `src/app/globals.css` into a component-owned `src/components/Navbar.module.css`, with no intended visual, route, product, auth, or interaction behavior change.

This is a CSS ownership and maintainability round, not a redesign round.

## Why This Round

The source visual upgrade plan flags `globals.css` as too broad. Round 12 proved the extraction pattern with Footer-owned selectors. Navbar is the next safe component because:

- Active selectors are clearly component-owned: `.site-nav`, `.site-nav-map`, `.nav-link-pill`, and `.nav-mobile-panel`.
- Navbar appears on all primary public routes, so the extraction provides meaningful regression coverage.
- Globe uses a route-specialized compact nav state that should remain unchanged.
- The current global file also contains unused legacy `.nav-account-*` selectors that are not referenced by source files and can be removed as dead Navbar-era CSS after verification.

## Approved Scope

Allowed source changes after brief approval:

- `src/components/Navbar.tsx`
  - Import `Navbar.module.css`.
  - Replace active global Navbar class hooks with CSS module class references.
  - Preserve all existing nav links, auth logic, dropdown behavior, mobile menu behavior, motion behavior, route conditions, and CTA destinations.
- `src/components/Navbar.module.css`
  - New file containing active Navbar-owned visual selectors extracted from `globals.css`.
  - Include Navbar-owned dark-mode selectors and route-specialized Globe nav state.
- `src/app/globals.css`
  - Remove only the extracted active Navbar selectors and unused legacy `.nav-account-*` selectors.
  - Keep all non-Navbar global, route, hero, store, profile, tag, footer, map HUD, auth, legal, and homepage styles untouched.
- Round 13 evidence and review records.

Read-only unless all four leads reapprove:

- `src/components/PawPalLogo.tsx`
- `src/components/Footer.tsx`
- `src/components/Footer.module.css`
- `src/lib/site.ts`
- Routes under `src/app/**` other than `src/app/globals.css`
- `package.json`, lockfiles, config files, deployment files, service worker, manifest, sitemap, robots, auth/data/payment/API code.

## Explicit Non-Goals

- No visual redesign of the Navbar.
- No copy, route, link, CTA, auth, login, sign-out, profile menu, mobile menu, SEO, metadata, sitemap, manifest, service worker, analytics, or deployment changes.
- No auth, Supabase, Stripe, API, database, map engine, AI, CI, package, dependency, build-system, or environment changes.
- No broad `globals.css` cleanup beyond Navbar-owned selectors and verified unused legacy `.nav-account-*` selectors.
- No CSS-module migration for Home, Store, Profile, Tag, Globe HUD, Help, Legal, Auth, Checkout, or shared UI primitives in this round.

## Design Intent

Rendered Navbar should look materially identical before and after extraction:

- Standard route nav keeps current height, blur, border, shadow, active pill, hover, focus, and mobile panel treatment.
- `/globe` keeps the approved compact floating map nav state.
- Dark mode keeps current nav contrast and panel readability.
- Reduced-motion behavior remains controlled by the existing `useReducedMotionPreference()` logic.
- Mobile menu remains full-width below the nav and does not introduce overlap or horizontal overflow.

## Product Intent

User journeys remain unchanged:

- Visitors can navigate Home, Globe, About Us, Store, and Auth.
- Signed-in users keep Profile access and account dropdown behavior.
- Mobile users keep the hamburger menu path.
- Globe remains a tool surface with compact navigation.

## Engineering Intent

- Reduce global CSS ownership by extracting component-owned nav selectors.
- Keep the change reviewable and reversible.
- Remove confirmed unused legacy nav account styles only after source search proves no references outside `globals.css`.
- Avoid new dependencies, design tokens, runtime state, or component abstractions.

## Required Evidence Before Final Signoff

- `npm run lint`
- `npm run build`
- Source search evidence:
  - active Navbar selectors extracted
  - `.nav-account-*` has no source references outside `globals.css` before removal
  - no non-Navbar selectors removed
- Browser or fallback rendered smoke on current preview:
  - `/`, `/store`, `/help`, `/auth`, `/globe`
  - URL/title
  - non-empty render
  - no framework overlay
  - relevant console warnings/errors
  - no horizontal overflow
  - nav rendered
  - `/globe` compact nav state rendered
- Responsive Navbar matrix:
  - 390x844
  - 768x1024
  - 1280x720
  - 1440x900
- Interaction/accessibility evidence:
  - desktop nav links have expected hrefs
  - mobile hamburger opens/closes menu
  - mobile menu links are visible and at least 44px high
  - login/profile area remains reachable
  - focus-visible remains visible
- Dark-mode evidence:
  - representative standard route nav
  - `/globe` compact nav
- Reduced-motion evidence:
  - representative nav render with `prefers-reduced-motion: reduce`
- Diff attribution:
  - `Navbar.module.css` is new
  - `Navbar.tsx` only maps classes to the module
  - `globals.css` removals are Navbar-owned only

## Acceptance Gates By Role

QA:

- Runtime render, responsive behavior, mobile menu, console/overlay/overflow, and accessibility evidence pass.

Product:

- Navigation journey, route access, auth entry, account/profile path, and Globe tool entry remain unchanged.

Engineering:

- CSS ownership migration is scoped, maintainable, reversible, and does not touch protected data/build/dependency boundaries.

Design:

- Visual output has no material drift from the approved Navbar appearance, including dark mode and Globe compact nav.

## Stop Conditions

- Any nav link destination changes.
- Mobile menu stops opening, closing, or showing links.
- `/globe` loses compact nav placement.
- Navbar visual output materially changes without new approval.
- A non-Navbar global selector is removed or altered as part of the extraction.
- `npm run lint`, `npm run build`, or required rendered evidence fails without an accepted blocker.
