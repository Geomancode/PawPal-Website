# Round Brief: Round 12 Footer CSS Ownership Extraction

Round: 12
Status: Approved and implemented
Date: 2026-06-12
Owner: Codex

## Goal

Pilot the global CSS ownership cleanup from the source plan by moving the completed Round 11 Footer visual rules out of `src/app/globals.css` and into a component-owned `src/components/Footer.module.css`, with no intended visual, product, route, data, or interaction behavior change.

This is a CSS ownership round, not a redesign round.

## Why This Round

The source plan flags `globals.css` as too broad and recommends moving route/component-specific visual classes out of the global file. Round 11 left a clean, self-contained `.footer-*` block that is a safe pilot for this cleanup because:

- The Footer already has passing visual and accessibility evidence.
- Its custom selectors are clearly component-owned.
- The route exposure is broad enough to prove the approach, but the code surface is small.

## Proposed Scope

Allowed source changes after brief approval:

- `src/components/Footer.tsx`
  - Import `Footer.module.css`.
  - Replace global `.footer-*` class hooks with CSS module class references.
  - Preserve existing Tailwind utility classes, public links, mailto targets, copy, and layout semantics.
- `src/components/Footer.module.css`
  - New file containing the extracted Footer-owned CSS from Round 11.
  - Include Footer-owned dark-mode and reduced-motion rules.
- `src/app/globals.css`
  - Remove only the extracted Footer-owned selectors from the base and dark-mode areas.
  - Keep all non-Footer global, route, nav, hero, tag, profile, store, auth, and map styles untouched.
- Round 12 evidence and review records.

Read-only unless all four leads reapprove:

- `src/lib/site.ts`
- `src/components/PawPalLogo.tsx`
- `src/components/ConditionalFooter.tsx`
- Route files under `src/app/**`

## Explicit Non-Goals

- No visual redesign of the Footer.
- No copy, link, mailto, route, SEO, metadata, sitemap, manifest, service worker, analytics, or newsletter changes.
- No auth, Supabase, Stripe, API, database, map, AI, deployment, CI, package, dependency, build-system, or environment changes.
- No broad `globals.css` cleanup beyond the extracted Footer-owned selectors.
- No CSS-module migration for Navbar, Home, Store, Profile, Tag, Globe, Help, Legal, Auth, or Checkout in this round.
- No changes to Round 11 evidence semantics except referencing it as baseline context.

## Design Intent

The rendered Footer should look materially identical to the approved Round 11 Footer:

- Calm utility endcap.
- No decorative grid pseudo-element.
- Footer link/action hit areas remain 44px minimum.
- Footer navigation landmark and screen-reader heading remain.
- Footer dark mode remains visually aligned with the approved Round 11 output.
- Focus-visible and hover states remain visible and Footer-scoped.

## Engineering Intent

- Establish a reversible, small CSS-module pattern for component-owned visual rules.
- Reduce `globals.css` component-specific ownership without touching unrelated global route systems.
- Keep the extraction reviewable by ensuring selector names and behavior map directly from Round 11.
- Do not introduce CSS Modules elsewhere until this pilot passes.

## Required Evidence Before Final Signoff

Browser must be used first where practical. Playwright fallback is allowed only for matrix automation or if Browser viewport/dark-mode coverage is insufficient.

Required checks:

- `npm run lint`
- `npm run build`
- Browser smoke on `http://localhost:3001/` or current production preview:
  - URL/title
  - Footer rendered
  - no blank shell
  - no framework overlay
  - no relevant console warnings/errors
  - hydration warning status
  - page error status
  - no horizontal overflow
  - minimum Footer link/action height remains 44px
- Responsive Footer matrix at 390x844, 768x1024, 1280x720, 1440x900 for:
  - `/`
  - `/store`
  - `/help`
  - `/privacy`
  - `/profile -> /auth`
  - `/globe` explicit N/A if Footer remains intentionally hidden
- Each responsive Footer matrix case must explicitly record:
  - URL/title
  - non-empty render
  - Footer rendered or `/globe` explicit N/A
  - framework overlay status
  - relevant console warnings/errors
  - hydration warnings
  - page errors
  - horizontal overflow
  - screenshot path
  - JSON result
- Dark-mode runtime proof on representative Footer routes:
  - `matchMedia('(prefers-color-scheme: dark)')`
  - computed root/body color scheme
  - body colors
  - footer colors
- Reduced-motion proof:
  - `matchMedia('(prefers-reduced-motion: reduce)')`
  - Footer interaction transitions remain reduced or unaffected
- Interaction/accessibility evidence:
  - expected Footer links and mailto targets
  - keyboard focus path
  - focus-visible proof
  - native Footer/contentinfo landmark
  - accessible link names
  - mobile tap targets
- Diff attribution:
  - prove `Footer.module.css` is new
  - prove `globals.css` removals are footer-scoped only
  - prove read-only files remain unchanged if inspected

## Acceptance Gates By Role

QA:

- Runtime render remains stable across required routes and breakpoints.
- Console/hydration/overlay/overflow evidence is complete.
- Interaction/accessibility evidence matches or exceeds Round 11.

Product:

- User journey, Footer links, support/legal/contact continuity, and route purpose remain unchanged.
- No unsupported new claim or product behavior is introduced.

Engineering:

- CSS ownership migration is scoped, reversible, and maintainable.
- No dependency/build-system/data/auth/payment/API/env/deploy boundary is touched.
- `globals.css` removal is limited to Footer-owned selectors.

Design:

- Visual output has no material drift from Round 11.
- Footer hierarchy, density, dark-mode quality, spacing, radius, and interaction-state visuals remain approved.

## Stop Conditions

- Any route loses Footer where it should render.
- `/globe` behavior changes from the approved full-screen Footer N/A behavior.
- Footer visual output materially changes without a new design approval.
- Any global selector outside Footer scope is changed as part of implementation.
- `npm run lint`, `npm run build`, or the required rendered evidence fails without an explicit accepted blocker.
