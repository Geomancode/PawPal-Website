# Visual Upgrade Execution Plan

Status: Complete, final market signoff approved by QA, Product, Engineering, and Design
Date: 2026-06-12

This file turns the visual audit into an executable multi-round workflow. The full audit and upgrade strategy remains in [WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md](../../../WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md).

## North Star

Upgrade PawPal from a visually busy, repeated hero/card pattern into a route-aware, trustworthy product experience:

- Home: clearer product story and faster mobile access to the globe/map value.
- Store: more commerce-like, product-forward, and scannable.
- Globe: more tool-like, calmer HUD hierarchy, fewer decorative conflicts.
- Profile/Auth: more trustworthy account workflow, less generic marketing layout.
- About: calmer brand proof instead of another decorative hero page.
- Shared design system: fewer route-specific hacks in `globals.css`, more reusable primitives.

## Round Strategy

### Round 00: Workflow Setup

Goal: Establish role boundaries, gates, templates, and signoff mechanics.

Status: Complete, four-lead approved.

Allowed changes:

- Create control-room documentation.
- Create acceptance templates.
- Create Round 00 records.

Blocked changes:

- No UI implementation.
- No source-code refactor.
- No build-system, auth, payment, database, or deployment changes.

### Round 01: Baseline Stabilization

Goal: Capture a stable visual/runtime baseline before implementation.

Completed scope:

- 10 routes x 4 viewports captured.
- Baseline measurements recorded for Home and Store first viewports.
- Console/overlay/overflow status recorded.
- Redirect behavior recorded for `/profile` and `/store/checkout`.

Exit condition:

- Four leads approved the final evidence.

### Round 02: Store First Viewport

Goal: Make Store product discovery and purchase path visible earlier without backend/payment/data changes.

Completed scope:

- Compact Store commerce header.
- Search, trust proof, filters, product count, cart access, and first product card moved upward.
- Empty floating cart removed until cart content exists.
- Store Framer Motion reduced-motion handling added.
- Search/category/details/add/cart/orders/checkout interactions verified.

Exit condition:

- Four leads approved the final evidence.

### Round 03: Homepage First Viewport

Goal: Make the Homepage first viewport communicate the product-led pet safety map/smart tag value earlier, especially on mobile.

Completed scope:

- Mobile hero spacing compressed.
- Primary and secondary CTAs moved above secondary signals/badges.
- Globe/map product proof moved into the 390x844 first viewport.
- Desktop floating callouts reduced to no more than two first-viewport callouts.
- Touched Homepage Framer Motion surfaces now respect `useReducedMotion`.

Exit condition:

- Four leads approved the final evidence.

### Round 04: Globe Tool Surface

Goal: Make the globe/map feel like a serious interactive tool with calmer overlays.

Completed scope:

- Fixed full-viewport Globe shell and route-specialized compact Globe navigation.
- Repositioned weather, nearby needs, layer toggles, status strip, map controls, and chat peek state.
- Added quiet weather unavailable state for external API failures.
- Improved chat focus expand/close affordances.
- Improved tutorial safe placement and close accessibility.
- Verified `/globe` at 390, 768, 1280, and 1440 widths.
- Verified layer toggles, chat expand/close, tutorial Next/Skip, and Navbar smoke on `/` and `/store`.

Exit condition:

- Four leads approved the final evidence.

### Round 05: Auth, Profile, Tag, Checkout Trust Surfaces

Goal: Improve trust-critical flows with reliable layouts and states.

Completed scope:

- Auth trust framing and accessibility polish.
- Orders empty-state trust copy.
- Success missing-session status clarity and recovery actions.
- Smooth-scroll redirect warning fix.
- Source-boundary audit for Profile, Tag, Checkout, auth, Stripe, Supabase, cart, and session behavior.
- Browser validation for `/auth`, `/profile`, `/tag/sample-id`, `/store/checkout`, `/store/orders`, and `/store/success`.

Exit condition:

- Four leads approved the final evidence.

### Round 06: About and Cross-Route Polish

Goal: Finish visual consistency and route character without introducing new decoration.

Completed scope:

- Revised brief approved by QA, Product, Engineering, and Design.
- Implementation and final evidence approved by QA, Product, Engineering, and Design.
- Browser after matrix: 16/16 PASS.
- Playwright fallback after screenshots: 16/16 PASS.
- About page calm proof narrative.
- Privacy and Terms document hierarchy and anchor navigation.
- Product copy cleanup to avoid unsupported market metrics or stronger privacy/legal claims.
- Final responsive, interaction, console, overflow, and screenshot evidence.

Exit condition:

- Four leads approved the final evidence.

### Round 07: Shared Visual System And Dark Mode Hardening

Goal: Harden shared UI primitives, dark-mode readability, and motion/hydration behavior after route-level upgrades.

Completed scope:

- Revised brief approved by QA, Product, Engineering, and Design before implementation.
- Pre-round file snapshots prepared and used for final diff attribution.
- Dark-mode page, panel, nav, footer, auth, tag, legal, store, checkout, and deep-route surface hardening added in scoped CSS.
- Home, Store, and Checkout reduced-motion warning sources removed and hidden/low-opacity initial frames stabilized.
- Auth and Tag page-level entrance motion removed to prevent faded reduced-motion/dark screenshots.
- Primary Playwright matrix: 24/24 PASS.
- Smoke Playwright matrix: 20/20 PASS.
- Interaction/accessibility matrix: 5/5 PASS.
- `npm run lint` and `npm run build` PASS.
- Final evidence approved by QA, Product, Engineering, and Design.

Exit condition:

- Four leads approved the final evidence.

### Round 08: Help Support Pathways

Goal: Make `/help` a faster, calmer support-routing surface without adding support backend behavior, new policy promises, or broad shared-system changes.

Completed scope:

- Round 08 folder created.
- Revised brief approved by QA, Product, Engineering, and Design.
- Pre-implementation snapshots captured.
- `/help` reframed as a task-led support-routing surface.
- Store/order support lane added alongside NFC/tag, account/community, and urgent safety.
- First viewport now shows route purpose, primary contact, support lane panel, Store/order lane, and urgent `Local services first` guidance.
- `npm run lint` and `npm run build` PASS.
- `/help` after matrix: 8/8 PASS.
- `/help` interaction/accessibility matrix: 6/6 PASS.
- Final evidence approved by QA, Product, Engineering, and Design.

Implemented scope:

- Primary route: `/help`.
- Allowed files: `src/app/help/page.tsx`; `src/app/globals.css` only for scoped Help/support selectors if needed.
- Conditional files: `src/app/help/layout.tsx`, `src/components/ui/StatusMessage.tsx`, `src/components/ui/AppDeepLinkButton.tsx` only under the constraints in `ROUND_BRIEF.md`.

Exit condition:

- Four leads approve the final evidence after implementation.

### Round 09: NFC Finder Emergency States

Goal: Make `/tag/[id]` an emergency-first finder page when a PawPal NFC tag is scanned, without changing lookup, privacy, auth, Supabase, or tag ownership behavior.

Completed scope:

- Round 09 revised brief approved by QA, Product, Engineering, and Design before implementation.
- Pre-implementation file snapshots and hashes captured.
- `/tag/[id]` reframed around pet identity, owner contact, local-services-first guidance, and quick care facts.
- Hidden owner contact, missing care/personality/achievement data, long text, email contact, and phone contact states made explicit and visually stable.
- App deep-link and Store CTAs retained as secondary actions below the rescue path.
- Missing-tag metadata now returns non-indexable missing/private metadata while the actual page still uses the existing 404 path.
- Scoped `.tag-*` CSS tightened for mobile, dark mode, and long-token resilience.
- Temporary route-local fixture states used for evidence only and removed before final build.
- `npm run lint` and `npm run build` PASS.
- Valid finder matrix: 12/12 PASS.
- Edge-state matrix: 24/24 PASS.
- Production `/tag/sample-id` smoke: 12/12 PASS.
- Cross-route globals smoke: 18/18 PASS.
- Interaction/accessibility checks: 4/4 PASS.
- Final evidence approved by QA, Product, Engineering, and Design.

Implemented scope:

- Primary route: `/tag/[id]`.
- Source files changed: `src/app/tag/[id]/TagPageClient.tsx`, `src/app/tag/[id]/page.tsx`, `src/app/globals.css`.
- Protected/shared files confirmed unchanged: `src/app/not-found.tsx`, `src/components/ui/StatusMessage.tsx`, `src/components/ui/AppDeepLinkButton.tsx`.

Exit condition:

- Four leads approved the final evidence after implementation.

### Round 10: Profile Task Readiness

Goal: Make `/profile` a clearer owner account workspace for profile readiness, pet safety records, install status, and add/manage pet tasks without changing auth, Supabase, PWA, API, database, payment, deployment, or environment behavior.

Completed scope:

- Round 10 revised brief approved by QA, Product, Engineering, and Design before implementation.
- Pre-implementation file snapshots and hashes captured.
- `/profile` refactored into a data/behavior container plus route-local `ProfileWorkspaceView` presentation module.
- Owner profile, trust/readiness, install state, pet records, add-pet form, NFC/contact status, and public tag links reorganized into a task-readiness workspace.
- Route-local profile motion wrappers removed to stabilize reduced-motion hydration.
- Mobile 390x844 first viewport reworked after Design blocked the first final review; ready state now shows owner identity, readiness, install action, and add/manage path, and add state shows the form entry.
- Temporary signed-in fixture route used for evidence only and removed before final build.
- Final Playwright matrix from `http://localhost:3001` production preview: 62/62 PASS.
- Final interaction matrix: PASS.
- `npm run lint` and `npm run build` PASS after fixture removal.
- Final evidence approved by QA, Product, Engineering, and Design.

Implemented scope:

- Primary route: `/profile`.
- Source files changed: `src/app/profile/page.tsx`, `src/app/profile/ProfileWorkspaceView.tsx`, `src/app/globals.css`.
- Protected/shared primitives confirmed unchanged: `src/components/ui/StatusMessage.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`.

Exit condition:

- Four leads approved the final evidence after implementation.

### Round 11: Footer Utility Endcap

Goal: Make the global Footer a calmer, more useful utility endcap without turning it into another hero-like surface.

Status: Complete, four-lead approved.

Completed scope:

- Round 11 brief approved by QA, Product, Engineering, and Design before implementation.
- Pre-implementation file snapshots and hashes captured.
- `src/components/Footer.tsx` converted into a calmer utility endcap with explicit Footer label, Footer navigation landmark, preserved links/mailto targets, and 44px link/action hit areas.
- `src/app/globals.css` updated only in footer-scoped base, dark-mode, and reduced-motion selectors.
- `/globe` explicitly recorded as Footer N/A because `ConditionalFooter` hides the global Footer on the full-screen map shell.
- `/profile` signed-out redirect to `/auth` covered in the smoke matrix.
- Browser smoke on `http://127.0.0.1:3001/` passed.
- Final Playwright matrix from `http://localhost:3001` production preview: 38/38 PASS.
- Final interaction/accessibility matrix: PASS.
- `npm run lint` and `npm run build` PASS.
- Final evidence approved by QA, Product, Engineering, and Design.

Implemented scope:

- Primary component: `src/components/Footer.tsx`.
- Conditional CSS: `src/app/globals.css`, footer-scoped selectors only.
- Read-only files confirmed unchanged from baseline: `src/lib/site.ts`, `src/components/PawPalLogo.tsx`.

Blocked changes:

- No auth, Supabase, Stripe, API, database, map, AI, deployment, CI, package, or environment changes.
- No broad global CSS cleanup outside footer-scoped selectors.
- No new routes, sitemap, manifest, service worker, metadata, analytics, newsletter, or external integrations.

Exit condition:

- Four leads approved the final evidence after implementation.

### Round 12: Footer CSS Ownership Extraction

Goal: Pilot the global CSS ownership cleanup by moving the approved Round 11 Footer-owned selectors from `globals.css` into a component-owned `Footer.module.css`, with no intended visual or product behavior change.

Status: Complete, four-lead approved.

Completed scope:

- Round 12 brief approved by QA, Product, Engineering, and Design before implementation.
- Pre-implementation file snapshots and hashes captured.
- Added `src/components/Footer.module.css` for the extracted Round 11 Footer-owned visual, interaction, dark-mode, and reduced-motion rules.
- Updated `src/components/Footer.tsx` to use CSS module class references.
- Removed only extracted Footer-owned selectors from `src/app/globals.css`.
- Confirmed `src/lib/site.ts` and `src/components/PawPalLogo.tsx` unchanged from the Round 12 baseline.
- Browser-first smoke on `http://127.0.0.1:3001/` passed.
- Final Footer CSS visual matrix from `http://localhost:3001` production preview: 38/38 PASS.
- Final interaction/accessibility matrix: PASS.
- `npm run lint` and `npm run build` PASS.
- Final evidence approved by QA, Product, Engineering, and Design.

Implemented scope:

- Primary component: `src/components/Footer.tsx`.
- New component CSS module: `src/components/Footer.module.css`.
- Conditional CSS cleanup: `src/app/globals.css`, extracted Footer-owned selectors only.
- Read-only files confirmed unchanged from baseline: `src/lib/site.ts`, `src/components/PawPalLogo.tsx`.

Blocked changes:

- No visual redesign, copy, link, route, auth, Supabase, Stripe, API, database, map, AI, deployment, CI, package, dependency, build-system, or environment changes.
- No broad global CSS cleanup beyond the extracted Footer-owned selectors.
- No CSS-module migration for any other component or route.

Exit condition:

- Four leads approved the final evidence after implementation.

### Round 12A: Homepage Focus Upgrade

Goal: Before starting Round 13, simplify the Homepage by deduplicating repeated elements, stabilizing responsive layout, avoiding overlap, and making the first impression more minimal, spacious, and product-focused.

Status: Complete, four-lead approved.

Proposed scope:

- Primary route: `/`.
- Source files allowed after brief approval: `src/app/page.tsx`, `src/components/HomeClientParts.tsx`, and Homepage-scoped selectors in `src/app/globals.css`.
- Required design concept step: Image Gen Homepage concept evidence before coding under the Build Web Apps workflow.

Blocked changes:

- No auth, Supabase, Stripe, API, database, map engine, AI, deployment, CI, package, dependency, build-system, service worker, manifest, sitemap, robots, or environment changes.
- No changes to `/globe`, `/store`, `/profile`, `/tag/[id]`, `/help`, legal pages, Navbar, Footer, or shared route behavior.
- No broad global CSS cleanup outside Homepage-owned selectors.
- No unsupported product claims, fake metrics, newsletter flows, analytics, or external integrations.

Completed scope:

- Round 12A brief approved by QA, Product, Engineering, and Design before implementation.
- Image Gen Homepage concept evidence generated.
- Active Homepage route simplified to hero, proof band, workflow, single showcase, and final CTA.
- Repeated active Homepage surfaces removed or merged: hero signal rail, hero badges, readiness panel, separate feature grid, four-phone grid, and hero floating info cards.
- Browser-first smoke passed.
- Homepage visual matrix: 10/10 PASS.
- Interaction/accessibility matrix: PASS.
- `npm run lint` and `npm run build` PASS.
- Final evidence approved by QA, Product, Engineering, and Design.

Exit condition:

- Four leads approved the final evidence after implementation.

### Round 13: Navbar CSS Ownership Extraction

Goal: Continue global CSS ownership cleanup by moving active Navbar-owned selectors from `globals.css` into `src/components/Navbar.module.css`, with no intended visual, route, product, auth, or interaction behavior change.

Status: Conditional complete, four-lead approved with one shared Round 14 condition.

Completed scope:

- Added `src/components/Navbar.module.css` for extracted active Navbar-owned visual, interaction, dark-mode, and Globe compact-nav rules.
- Updated `src/components/Navbar.tsx` to use CSS module class references while preserving existing nav links, auth entry, account path, mobile menu behavior, route conditions, and reduced-motion behavior.
- Removed only extracted Navbar-owned selectors and verified unused legacy `.nav-account-*` selectors from `src/app/globals.css`.
- Preserved protected files: `src/components/PawPalLogo.tsx`, `src/components/Footer.tsx`, `src/components/Footer.module.css`, and `src/lib/site.ts`.
- Fixed an incidental market-blocking mobile overflow in `src/components/PwaRuntime.tsx` caused by the fixed PWA banner width on 390px viewports.
- `npm run lint` and `npm run build` PASS.
- Responsive Navbar matrix across `/`, `/store`, `/help`, `/auth`, and `/globe`: PASS after the PWA overflow fix.
- Mobile menu, desktop focus, dark mode, reduced motion, and compact Globe nav evidence captured.

Accepted condition:

- Round 14 must resolve the `/globe` WebGL fallback/error-panel risk so users without usable WebGL see a stable route-local fallback instead of the global app error page.

Implemented scope:

- Primary component: `src/components/Navbar.tsx`.
- New component CSS module: `src/components/Navbar.module.css`.
- Conditional CSS cleanup: `src/app/globals.css`, extracted Navbar-owned selectors only.
- Incidental overflow fix: `src/components/PwaRuntime.tsx`.

Exit condition:

- Four leads approved the final evidence with the shared Round 14 condition recorded in `ROUND-13-navbar-css-ownership/SIGNOFF_RECORD.md`.

### Round 14: Globe WebGL Fallback Hardening

Goal: Make `/globe` market-ready when WebGL or MapLibre initialization fails by keeping users inside a stable route-local fallback experience instead of the global error page.

Status: Complete after Round 15 follow-up signoff.

Proposed scope:

- Primary route: `/globe`.
- Allowed source files: `src/components/GlobeFullPage.tsx`, `src/components/GlobeStaticPreview.tsx`, `src/app/globals.css`, and Round 14 evidence records.
- Conditional file: `src/app/globe/page.tsx` only if the dynamic loading/fallback boundary must be tightened.

Blocked changes:

- No map data model, Supabase, Stripe, auth, API, AI, checkout, service worker, manifest, sitemap, robots, dependency, build-system, deployment, or environment changes.
- No Homepage, Store, Profile, Tag, Help, Legal, Navbar, Footer, or global redesign work.
- No new user-facing product claims beyond describing fallback/unavailable map state.

Completed scope:

- Added route-local `/globe` fallback when WebGL is unavailable before MapLibre startup.
- Added MapLibre construction catch and WebGL/context/canvas/GPU error-event conversion to fallback state.
- Added full-screen Globe-native static fallback with retry, Store, and Help actions.
- Extended `GlobeStaticPreview` with optional state props while preserving default behavior.
- Chrome/CDP matrix: 9/9 PASS.
- Browser/IAB normal `/globe` smoke: PASS.
- `npm run lint` and `npm run build` PASS.
- Product lead approved without condition.
- QA, Engineering, and Design approved with Round 15 follow-up conditions.

Accepted conditions assigned to Round 15:

- QA: add fallback keyboard/focus, reduced-motion, dark-mode, and loaded-state cross-route smoke evidence.
- Engineering: harden MapLibre live-map RAF cleanup and post-init WebGL context-loss fallback validation.
- Design: polish normal `/globe` live-state overlay density, weather ticker clipping, and tutorial pressure.

Exit condition:

- Round 14 conditionally accepted. Round 15 is required before final market-ready signoff.

### Round 15: Globe Market Readiness Sweep

Goal: Clear Round 14 QA, Engineering, and Design conditions so `/globe` can receive final market-ready signoff.

Status: Complete, four-lead approved.

Proposed scope:

- Primary route: `/globe`.
- Allowed source files: `src/components/GlobeFullPage.tsx`, `src/components/WeatherTicker.tsx`, `src/components/GlobeTutorial.tsx`, `src/app/globals.css`, and Round 15 evidence records.
- Conditional evidence-only routes: `/`, `/store`, `/help`.

Required work:

- Harden MapLibre animation lifecycle by guarding/canceling RAF loops and wheel RAF.
- Listen for post-init canvas `webglcontextlost` and `webglcontextcreationerror` events and route them to fallback.
- Reduce normal live `/globe` first-visit overlay pressure.
- Fix weather ticker clipping in normal live `/globe`.
- Add QA evidence for keyboard focus, reduced motion, dark mode, post-init context loss, and loaded-state cross-route smoke.

Completed scope:

- Guarded MapLibre RAF, geolocation, `style.load`, drag/zoom/touch, inertia, spin, and cleanup paths with current-map ownership checks.
- Guarded ChatBottomSheet marker/flyTo work across async boundaries.
- Added post-init WebGL context-loss validation via `WEBGL_lose_context`.
- Replaced the moving weather ticker with a static bounded weather row.
- Delayed/lowered the tutorial overlay pressure.
- Added strict CDP evidence requiring loaded tiles, weather items, markers, and clean console/runtime/network diagnostics.
- Refreshed live/fallback screenshots and cross-route mobile smoke screenshots.
- `npm run lint`, `npm run build`, and strict CDP matrix all PASS.

Blocked changes:

- No auth, Supabase, Stripe, API, AI, checkout, service worker, manifest, sitemap, robots, dependency, build-system, deployment, or environment changes.
- No Homepage, Store, Profile, Tag, Help, Legal, Navbar, or Footer implementation changes beyond evidence-only smoke.

Exit condition:

- Met. QA, Product, Engineering, and Design provided final Round 15 PASS signoff. A small Round 16 market-polish pass was added afterward to resolve the repeated PWA install-prompt launch-risk note.

### Round 16: Final Market Polish

Goal: Resolve the final repeated launch-risk note that the mobile PWA install prompt competes with first-viewport route CTAs.

Status: Complete, final app-level market signoff approved.

Scope:

- Primary file: `src/components/PwaRuntime.tsx`.
- Evidence routes: `/`, `/store`, `/help` at 390x844.
- Reuse strict CDP matrix after implementation.

Completed scope:

- Delayed the install offer by 45 seconds after `beforeinstallprompt`.
- Added a `Later` session dismissal.
- Kept offline and update-ready notices immediate.
- Verified mobile Home/Store/Help smoke no longer shows `Install PawPal`.
- `npm run lint`, `npm run build`, and strict CDP matrix all PASS.

Exit condition:

- Met. QA, Product, Engineering, and Design provided final app-level market signoff.


## Per-Round Required Evidence

Every implementation round after Round 00 must include:

- Scope and non-goals.
- Files changed.
- Before/after screenshots for affected routes at 390, 768, 1280, and 1440 widths when relevant.
- First-viewport measurements for affected key routes.
- Browser console observations.
- Interaction checks for affected controls.
- Accessibility notes.
- Build/lint result, or explicit blocker.
- Known risks and debt.
- Four role acceptance files.
- Final signoff record.

## Stop Rules

The implementer must stop before the next round if:

- Any lead returns `不通过`.
- A `有条件通过` lacks an owner, condition, or target follow-up round.
- Evidence is missing for a route that changed.
- The implementation touched an unapproved boundary.
- Build/lint/browser verification fails without an accepted blocker record.
