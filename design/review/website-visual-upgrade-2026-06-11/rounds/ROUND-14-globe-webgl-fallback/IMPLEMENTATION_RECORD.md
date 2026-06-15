# Implementation Record

Round: 14 Globe WebGL Fallback Hardening  
Date: 2026-06-14  
Status: Implemented, pending independent four-lead signoff  
Owner: Codex

## User-Facing Change

`/globe` now treats WebGL or MapLibre startup failure as a supported runtime state. Instead of escalating to the global app error page, the route stays inside the full-screen Globe shell and shows a calm static map preview with three safe actions:

- `Try live map`
- `Shop smart tags`
- `Local help`

Normal WebGL-capable sessions still render the live MapLibre Globe route.

## Source Changes

- `src/components/GlobeFullPage.tsx`
  - Added WebGL capability detection before MapLibre construction.
  - Wrapped MapLibre construction in a recoverable `try/catch`.
  - Converts WebGL/context/canvas/GPU-related MapLibre error events into route-local fallback state.
  - Pauses initial nearby-data refresh while the live map is unavailable.
  - Splits render output between live-map controls and fallback-only UI so map-dependent controls do not appear when no map exists.
- `src/components/GlobeStaticPreview.tsx`
  - Added optional `className`, `statusLabel`, and `pulseStatus` props.
  - Preserved the default `Loading live globe` behavior used by existing loading surfaces.
- `src/app/globals.css`
  - Added scoped `.globe-fallback-*` desktop and mobile styles.
  - Mobile fallback actions now preserve 44px hit areas.
- `design/review/website-visual-upgrade-2026-06-11/PLAN.md`
  - Recorded Round 13 conditional completion and opened Round 14.
- Round 14 evidence and review files.

## Boundaries Preserved

No changes were made to auth, Supabase, Stripe, APIs, checkout, service worker, manifest, sitemap, robots, package/dependency files, deployment, environment settings, Homepage, Store, Profile, Tag, Help, Legal, Navbar, or Footer code as part of Round 14.

## Important References

- Fallback component and WebGL helpers: `src/components/GlobeFullPage.tsx:46`
- MapLibre precheck and catch path: `src/components/GlobeFullPage.tsx:316`
- Fallback/live render split: `src/components/GlobeFullPage.tsx:547`
- Static preview props: `src/components/GlobeStaticPreview.tsx:3`
- Fallback desktop CSS: `src/app/globals.css:2272`
- Fallback mobile CSS: `src/app/globals.css:2941`

## Verification Summary

- `npm run lint`: PASS
- `npm run build`: PASS
- Browser/IAB normal `/globe` smoke: PASS
- Chrome/CDP matrix: 9/9 PASS
- WebGL-unavailable simulation: PASS at 390x844, 768x1024, 1280x720, and 1440x900
- Normal `/globe` smoke: PASS at 390x844 and 1280x720
- Cross-route smoke: PASS for `/`, `/store`, and `/help` at 390x844
- Fallback retry interaction: PASS at 390x844 and 1280x720

## Evidence Files

- `evidence/round14_cdp_matrix.json`
- `evidence/screenshots/fallback-globe-390x844.png`
- `evidence/screenshots/fallback-globe-768x1024.png`
- `evidence/screenshots/fallback-globe-1280x720.png`
- `evidence/screenshots/fallback-globe-1440x900.png`
- `evidence/screenshots/normal-globe-390x844.png`
- `evidence/screenshots/normal-globe-1280x720.png`
- `evidence/screenshots/normal-globe-1280x720-delayed.png`
- `evidence/screenshots/smoke-home-390x844.png`
- `evidence/screenshots/smoke-store-390x844.png`
- `evidence/screenshots/smoke-help-390x844.png`

## Known Residual Risk

The CDP WebGL-unavailable check uses a pre-navigation `HTMLCanvasElement.getContext` override to simulate unsupported WebGL. This validates the application-level fallback path. It does not prove every possible GPU-driver failure mode, but the implementation also catches MapLibre construction exceptions and WebGL/context-related MapLibre error events.
