# PawPal Homepage Upgrade Review and Plan

Date: 2026-06-13

Scope: current website homepage at `/`, with supporting navigation, footer, home visual components, icon language, and motion/performance behavior.

This document is a review and execution plan only. It does not change production behavior.

## Review Method

- Used the Build Web Apps frontend testing/debugging workflow.
- Ran the local Next dev server at `http://localhost:3001` because port `3000` was already occupied.
- Opened the homepage in the in-app Browser and checked page identity, DOM content, console health, desktop structure, and mobile navigation behavior.
- Delegated three read-only review agents with non-overlapping scopes:
  - Function chain and preservation review.
  - Layout, typography, visual hierarchy, and icon review.
  - Motion, transition, performance, and regression protection review.

## Browser Evidence

- Page identity: `http://localhost:3001/`
- Page title: `Pet Safety Map, Smart Tags, and Local Pet Community`
- Console health: no `error` or `warn` entries during desktop and mobile checks.
- Desktop DOM content rendered with meaningful app content, including navigation, H1, primary CTAs, proof band, workflow section, showcase, final CTA, and footer.
- Home WebGL canvas rendered in the DOM as `1024 x 1024`, styled to `512px x 512px`.
- Mobile viewport checked at `390 x 844`.
- Mobile menu button resolved uniquely, opened correctly, exposed Home, Globe, About Us, Store, and Login links, and produced no horizontal overflow.
- Browser screenshot capture timed out twice with `Page.captureScreenshot`, including a cropped mobile attempt. Treat this as an evidence-capture and possible WebGL/GPU performance risk to resolve before final visual signoff.

## Current Homepage Map

Primary files:

- `src/app/page.tsx`: homepage route, metadata, and section composition.
- `src/components/HomeClientParts.tsx`: client-side homepage pieces, Framer Motion wrappers, CTAs, globe container, proof band, flow, showcase, and final CTA.
- `src/components/Navbar.tsx`: global navigation, logged-in/logged-out states, mobile menu, account menu.
- `src/components/Footer.tsx` and `src/components/Footer.module.css`: footer links and brand/contact surface.
- `src/components/Globe.tsx`, `src/components/GlobeComponent.tsx`, `src/components/GlobeStaticPreview.tsx`: dynamic globe and fallback preview.
- `src/app/globals.css`: global tokens, navigation styles, homepage styles, legacy hero styles, animation utilities, dark mode, reduced-motion rules.
- `src/app/layout.tsx`: metadata, JSON-LD, providers, skip link, navbar, footer, and main landmark.

Current homepage sections:

- Fixed navigation with Home, Globe, About Us, Store, Login/Profile.
- Hero: PawPal headline, product description, `Open Live Map` CTA, `Shop Smart Tags` CTA, live globe.
- Proof band: Walk map, Smart tag, Local help.
- Workflow: Walk & Explore, Protect & Connect, Community & Care.
- App showcase: app mockup plus Live map, Finder profile, Local help.
- Final CTA: repeat `Open Live Map` and `Shop Smart Tags`.
- Footer: product, company, support, Belgium pilot contact links.

## Review Findings

### Functionality

Strengths:

- Core CTA routes are clear and repeated: `/globe` and `/store`.
- Homepage metadata and canonical are present.
- Navigation correctly distinguishes logged-out vs logged-in structure in code.
- `/globe` and `/store` have meaningful fallback behavior according to source review: location fallback, Supabase/demo catalog fallback, local cart, checkout path, and PWA shell coverage.

Risks:

- No explicit analytics instrumentation for homepage CTA conversion.
- `Shop Smart Tags` promises a focused smart-tag outcome, while store fallback catalog may show general pet products when Supabase is unavailable.
- `/globe` depends on location, MapLibre tiles, Supabase, weather/search/AI services; homepage upgrade acceptance must cover degraded states.
- PWA service worker caches `/`, `/globe`, and `/store`; visual or asset upgrades need cache-version consideration.
- No project-owned homepage E2E or smoke script exists in `package.json`.

Must preserve:

- Homepage canonical and metadata.
- `Open Live Map -> /globe`.
- `Shop Smart Tags -> /store`.
- Logged-out navigation: Home, Globe, About Us, Store, Login.
- Logged-in navigation: Profile/account menu and sign-out flow back to `/`.
- `/globe` client-only map loading and Ghent fallback.
- `/store` Supabase-first catalog, demo fallback, search query support, cart localStorage, checkout flow.
- PWA shortcuts and cache coverage for `/`, `/globe`, and `/store`.

### Layout And Typography

Strengths:

- The current page structure is understandable and restrained: hero, proof, flow, showcase, final CTA.
- The page already uses PawPal tokens heavily.
- Prior visual matrix artifacts indicate multiple breakpoints can pass without horizontal overflow.

Risks:

- `HomeClientParts.tsx` uses `hero-headline`, while old `.hero-headline` rules in `globals.css` still apply at desktop widths. This can force an outdated right-aligned, width-limited headline and cause awkward line breaks such as `for every / walk`.
- Browser text extraction reads the H1 as `PawPal pet safetyfor every walk`; visually this is likely separated by block spans, but accessible/programmatic text should still contain a space.
- Filled CTA white text on `#4A90D9` is below the normal-text AA contrast target.
- Several navigation targets are 36-40px high; upgrade target should be at least 44px without making the nav feel bloated.
- Global CSS contains legacy hero, bento, marquee, and decorative classes that are not all used by the current homepage.

### Icon Design

Strengths:

- Lucide is used consistently as the main icon language.
- Map, Footprints, ShieldCheck, HeartHandshake, ScanLine, Store, Users, and Bot fit most homepage concepts.

Risks:

- `Radio` is used for NFC/smart-tag concepts in several places. It reads more like live signal or broadcast than tag scan.
- Logo variant strategy is not responsive to dark surfaces: Navbar and Footer currently use `variant="light"` while dark logo assets exist.
- Some image assets may have misleading extensions according to previous visual review notes; asset MIME correctness should be verified before final optimization.

### Motion And Dynamic Transitions

Strengths:

- Framer Motion is already centralized in the homepage client file.
- A reduced-motion media-query hook exists.
- Globe is dynamically imported with a static preview fallback.
- Globe cleanup disposes cloud texture/materials and clears timers/RAF.

Risks:

- `FadeIn` and `FadeInView` use `initial={false}` and visible animate targets, so several "entry" motions are effectively no-ops.
- Reduced-motion coverage is incomplete across Navbar motion, scroll progress spring, Tailwind `animate-*` utilities, WebGL auto-rotation, and cloud RAF.
- `GlobeComponent` uses document/window capture listeners with non-passive wheel/touch handling to block zoom; this can affect scroll responsiveness and mobile gesture boundaries.
- WebGL is loaded on the homepage first viewport and continues RAF work after mount.
- Browser screenshot capture timeout suggests evidence tooling and WebGL/rendering cost need attention before shipping a visual upgrade.

## Upgrade Principles

1. Preserve routes and existing behavior before improving appearance.
2. Add regression checks before high-risk visual or motion edits.
3. Treat `/globe` and `/store` as protected downstream products, not decorative links.
4. Keep the homepage as a usable product surface, not a marketing-only page.
5. Use the existing token system and Lucide icon library unless a custom NFC/tag glyph is explicitly approved.
6. Make reduced-motion a real product contract, including WebGL behavior.
7. Remove or isolate legacy CSS before adding more homepage styling.

## Agent Operating Model

The upgrade should use agents with strict ownership boundaries. Production code edits should be serialized through a single implementation owner to avoid overlapping changes in shared files like `HomeClientParts.tsx` and `globals.css`.

| Agent | Owns | May edit | Must not edit | Output |
| --- | --- | --- | --- | --- |
| Coordinator | Scope, sequencing, merge order, risk gates, final signoff | Documentation and integration notes | Product code without explicit implementation phase | Master checklist, decision log, signoff |
| Function Guard Agent | CTA routes, nav states, downstream route invariants, PWA/cache invariants | Tests/evidence files only, such as `tests/homepage/*` if created | Visual CSS, icons, motion implementation | Function-preservation matrix and smoke tests |
| Visual System Agent | Typography, layout, contrast, touch-target spec, icon semantics, logo strategy | Design spec/evidence files only | Route logic, CTA hrefs, motion runtime | Visual spec, icon replacement matrix, contrast/touch acceptance |
| Motion Performance Agent | Motion policy, reduced-motion contract, WebGL pause strategy, listener/RAF risks | Motion spec/evidence files only, or `GlobeComponent.tsx` only if assigned in a separate implementation slice | Copy, routes, visual hierarchy, icon decisions | Motion policy and performance acceptance |
| Homepage Implementation Agent | Final production edits after specs are accepted | `src/app/page.tsx`, `src/components/HomeClientParts.tsx`, `src/app/globals.css`, and any explicitly approved nav/logo files | Test ownership and signoff evidence | Production patch with file list and migration notes |
| Regression Review Agent | Independent verification after implementation | Evidence files only | Production files | Browser matrix, console log report, issue list |

Coverage check:

- Function protection: Function Guard Agent.
- Visual hierarchy and icon quality: Visual System Agent.
- Motion and performance: Motion Performance Agent.
- Shared production files: Homepage Implementation Agent.
- Final verification: Regression Review Agent.
- Scope control and conflict prevention: Coordinator.

No responsibility is intentionally left uncovered. Shared files are not jointly edited by multiple agents; spec agents produce inputs, the implementation agent applies production changes.

## Upgrade Roadmap

### Phase 0 - Baseline Lock

Goal: freeze what already works before improving it.

Actions:

- Record current route map and protected behavior matrix.
- Add or formalize homepage smoke checks for `/`, `/globe`, and `/store`.
- Confirm current PWA cache names and update behavior.
- Capture desktop and mobile evidence with an alternative screenshot path if Browser capture still times out.

Exit criteria:

- `npm run lint` passes.
- `npm run build` passes.
- Homepage loads with no console errors/warnings.
- Mobile nav opens and closes.
- Primary CTA links still resolve to `/globe` and `/store`.

### Phase 1 - Functional Guardrails

Goal: make sure visual work cannot silently break product behavior.

Actions:

- Add homepage smoke coverage for:
  - H1 present.
  - `Open Live Map` href remains `/globe`.
  - `Shop Smart Tags` href remains `/store`.
  - Mobile menu exposes the expected links.
  - Footer support links still resolve or mailto correctly.
- Add route-level downstream smoke:
  - `/globe` loads without SSR map failure.
  - `/store` loads with catalog or fallback catalog.
- Add a PWA/cache note for any homepage asset rename.

Exit criteria:

- Functional smoke is green before visual edits begin.
- No homepage copy, CTA href, auth-state, store, checkout, or globe behavior is changed by this phase.

### Phase 2 - CSS And Layout Stabilization

Goal: remove stale layout interference and fix first-order typography issues.

Actions:

- Rename or retire legacy `.hero-*` rules that no longer match the current homepage structure.
- Ensure `hero-headline` is controlled only by the current homepage component or a clearly scoped current selector.
- Add a real accessible/programmatic space in the H1 between `safety` and `for every walk`.
- Keep first viewport showing hero plus a hint of the proof band across desktop and mobile.
- Verify no text overlap, clipped buttons, or horizontal overflow at 390, 768, 1280, and 1440 widths.

Exit criteria:

- No isolated word break in `for every walk` at 1440.
- DOM/programmatic H1 includes a readable space.
- No horizontal overflow at tested widths.
- Protected route smoke remains green.

### Phase 3 - Visual And Icon Upgrade

Goal: improve polish without changing meaning.

Actions:

- Increase filled CTA contrast by using a darker primary button background or a dedicated contrast token.
- Normalize nav and account/menu target heights to at least 44px where touch interaction is likely.
- Replace NFC/smart-tag uses of `Radio` with `ScanLine` or an approved NFC/tag glyph; keep `Radio` for live signal/loading only.
- Define dark-surface logo strategy for Navbar/Footer and validate contrast.
- Audit public images for correct MIME/extension and update references only with cache/version planning.

Exit criteria:

- CTA contrast reaches at least 4.5:1 for normal-size button text.
- Icon semantics are consistent across homepage.
- Nav/footer logo remains readable in light and dark modes.
- No CTA routes or downstream store/globe behavior changes.

### Phase 4 - Motion And WebGL Hardening

Goal: make motion intentional, accessible, and cheaper.

Actions:

- Decide whether homepage entry motion should be real or removed. Avoid no-op motion wrappers.
- Create one motion policy used by Framer, CSS animations, Tailwind animation utilities, and WebGL behavior.
- In reduced-motion:
  - Disable entry/exit transforms.
  - Disable CSS keyframe animation.
  - Disable scroll-progress spring motion or make it instant.
  - Stop globe auto-rotation and cloud RAF.
  - Remove spinner/pulse loops where possible.
- Pause globe RAF and auto-rotation when offscreen or document is hidden.
- Revisit document/window capture listeners and confine gesture prevention to the globe container where possible.

Exit criteria:

- Reduced-motion matrix shows no active CSS animations on homepage.
- Globe does not auto-rotate in reduced-motion.
- Page scroll remains normal outside the globe.
- Screenshot/evidence capture no longer times out, or a documented alternative capture path exists.

### Phase 5 - Regression And Signoff

Goal: verify the upgrade did not trade product behavior for polish.

Required matrix:

- Viewports: 390, 768, 1280, 1440.
- Modes: light, dark, reduced-motion.
- States: mobile nav closed/open, desktop first viewport, scrolled page.
- Routes: `/`, `/globe`, `/store`.

Checks:

- Page identity and metadata remain correct.
- No blank page or framework overlay.
- No relevant console errors/warnings.
- No horizontal overflow.
- H1 line breaks are professional.
- CTA routes and footer links remain correct.
- Mobile menu opens, closes, and does not trap scroll.
- Globe fallback and WebGL render path remain available.
- Reduced-motion has no unapproved loops or transforms.

## Acceptance Checklist

- [ ] Protected behavior matrix completed before implementation.
- [ ] Agent write scopes confirmed before any production edits.
- [ ] Lint green.
- [ ] Build green.
- [ ] Homepage smoke green.
- [ ] `/globe` smoke green.
- [ ] `/store` smoke green.
- [ ] 390/768/1280/1440 visual matrix green.
- [ ] Light/dark/reduced-motion matrix green.
- [ ] CTA contrast verified at or above 4.5:1.
- [ ] Touch targets verified at or above 44px where applicable.
- [ ] NFC/smart-tag icon language unified.
- [ ] Browser screenshot capture issue resolved or explicitly replaced by stable evidence tooling.
- [ ] PWA cache/version implications reviewed.

## Immediate Next Steps

1. Let the Function Guard Agent create the protected behavior matrix and proposed smoke tests.
2. Let the Visual System Agent create a one-page visual/icon spec with exact target selectors and icon replacements.
3. Let the Motion Performance Agent create a motion policy with reduced-motion and WebGL pause rules.
4. Have the Coordinator approve shared-file ownership.
5. Let the Homepage Implementation Agent apply production changes in one controlled slice.
6. Let the Regression Review Agent verify the full matrix and record evidence.

## Execution Record

Date: 2026-06-13

Implemented scope:

- Added a project-owned homepage contract check at `scripts/homepage-contract-check.mjs` and exposed it through `npm run test:home-contract`.
- Protected key homepage behavior: readable H1, `/globe` and `/store` CTAs, nav/footer destinations, manifest shortcuts, and core route file presence.
- Reworked homepage headline classing so current homepage typography is not captured by legacy `.hero-headline` rules.
- Preserved homepage CTA destinations while improving the primary CTA contrast token.
- Replaced broadcast-style `Radio` smart-tag visuals with `ScanLine` for clearer NFC/tag semantics.
- Raised nav touch target heights toward the 44px target.
- Added adaptive logo handling for light/dark surfaces in the navbar and footer.
- Extended reduced-motion handling across homepage Framer entry motion, scroll progress, navbar/menu transitions, and globe rotation/cloud animation.
- Paused globe animation when reduced motion is requested, when the globe is out of view, or when the document is hidden.

Agent responsibility record:

- Coordinator/Main thread: owned implementation, integration, build/lint/test verification, and Browser desktop smoke.
- Volta: read-only function guard review; checked protected route/link/state expectations and recommended contract-test coverage.
- Beauvoir: read-only CSS/visual conflict review; identified the legacy `.hero-headline` conflict and scoped CSS cleanup targets.

Responsibility boundaries:

- No subagent edited production files.
- Function guard work and CSS/visual review were intentionally read-only and non-overlapping.
- Main thread owned all write changes to avoid shared-file merge risk.

Verification completed:

- `npm run test:home-contract` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Desktop Browser smoke passed at `http://localhost:3001/?homepage-upgrade=20260613` with no console errors, no horizontal overflow, preserved CTA links, readable H1 text, 44px desktop nav targets, and upgraded primary CTA contrast.

Known verification limits:

- The in-app Browser served stale PWA-cached homepage content at `/` until a query-string cache bypass was used.
- Browser screenshot capture continued to time out around the WebGL homepage path, so screenshot evidence remains a tooling/performance follow-up.
- The Browser viewport override did not take effect during the final mobile pass; mobile behavior is covered by source, CSS, lint, build, and the earlier pre-upgrade mobile smoke, but final mobile runtime verification still needs a stable viewport-capable browser run.

## Continuation Upgrade Record

Date: 2026-06-14

Implemented scope:

- Bumped the service worker cache namespace to `pawpal-shell-v4-homepage-upgrade`.
- Enabled service worker navigation preload so HTML navigations can prefer fresher network responses before falling back to cache.
- Limited runtime caching to document requests and static asset destinations instead of responding to every same-origin GET request.
- Added local-development PWA cleanup in `PwaRuntime`: Next dev sessions unregister PawPal service workers and delete `pawpal-shell-*` caches instead of serving stale app shells.
- Updated PWA update/install actions to use the higher-contrast primary token and 44px button height.
- Added screenshot-friendly Globe renderer configuration with `preserveDrawingBuffer`.
- Added `data-testid="home-globe"` and `data-globe-state`/motion visibility attributes so browser smoke tests can assert Globe runtime state without relying only on screenshots.
- Extended `npm run test:home-contract` to protect PWA cache/version behavior, local dev cache cleanup, and Globe screenshot/state contracts.

Verification target for this continuation:

- `npm run test:home-contract`
- `npm run lint`
- `npm run build`
- Browser desktop smoke for fresh `/` loading without query-string cache bypass.
- Browser or fallback runtime check for Globe state attributes and mobile navigation.

Verification completed:

- `npm run test:home-contract` passed with PWA and Globe continuation checks.
- `npm run lint` passed with no warnings after adding the development-mode dependency to the PWA runtime effect.
- `npm run build` passed and prerendered the expected static routes.
- Browser desktop smoke passed at `http://localhost:3001/` without query-string cache bypass.
- Browser screenshot capture succeeded for the WebGL homepage first viewport.
- Browser mobile smoke passed at `390 x 844`: mobile nav button resolved uniquely, menu opened, Home/Globe/About Us/Store/Login were visible, touch heights were at least 44px for menu actions, and horizontal overflow remained `0`.
- Temporary screenshots were saved outside the repo at `/private/tmp/pawpal-home-desktop-20260614.png` and `/private/tmp/pawpal-home-mobile-menu-20260614.png`.
