# Round 15 Implementation Record - Globe Market Readiness

Date: 2026-06-14

## Scope

Round 15 clears the conditional Round 14 requirements for `/globe` only:

- QA: keyboard focus, reduced motion, dark mode, post-init WebGL failure, and loaded-state smoke evidence.
- Engineering: MapLibre animation cleanup, guarded RAF loops, and post-init WebGL context-loss fallback.
- Design: normal live-state overlay density, weather ticker clipping, and tutorial pressure.

Evidence-only smoke also covers `/`, `/store`, and `/help`.

## Source Changes

- `src/components/GlobeFullPage.tsx`
  - Added a single `enterMapFallback` path for live-map failure state.
  - Guarded MapLibre animation frames with `active` and `mapRef.current === map` checks.
  - Tracked and canceled scheduled RAF callbacks during cleanup.
  - Added canvas-level `webglcontextlost` and `webglcontextcreationerror` listeners.
  - Added ownership guards to geolocation callbacks, `style.load`, drag handlers, zoom handlers, and spin/inertia paths.
  - Kept map teardown resilient when MapLibre is already tearing down after context failure.

- `src/components/ChatBottomSheet.tsx`
  - Rechecked `mapRef.current` after dynamic imports and before marker/flyTo work so stale maps are not touched after fallback or unmount.

- `src/components/WeatherTicker.tsx`
  - Replaced the moving ticker presentation with a static, bounded weather item row.
  - Preserved city, weather condition, temperature, wind, humidity, rain, UV, and walk advice.

- `src/components/GlobeTutorial.tsx`
  - Delayed first-time tutorial pressure from 2 seconds to 12 seconds.
  - Reduced overlay opacity from `0.55` to `0.38`.

- `src/app/globals.css`
  - Added bounded static weather-row layout rules.
  - Added mobile hiding rules for lower-priority weather items and suffixes.
  - Kept fallback actions at a 44px minimum target height on mobile.
  - Tightened live `/globe` overlay pressure by reducing nearby panel height and chat peek width.

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-15-globe-market-readiness/evidence/round15_cdp_verify.js`
  - Added a repeatable Chrome/CDP validation script for live, fallback, accessibility preference, and route smoke evidence.
  - Upgraded live `/globe` checks to wait for map tiles, weather items, and markers before screenshot capture.
  - Added console/runtime/network diagnostics to the matrix gate.

## Key Code References

- WebGL precheck and fallback view: `src/components/GlobeFullPage.tsx:60`
- Fallback action links and retry button: `src/components/GlobeFullPage.tsx:83`
- Unified fallback state setter: `src/components/GlobeFullPage.tsx:302`
- Guarded map ownership, RAF lifecycle, geolocation, style-load, and cleanup: `src/components/GlobeFullPage.tsx:362`
- Post-init WebGL event listeners: `src/components/GlobeFullPage.tsx:385`
- Chat marker/flyTo async guards: `src/components/ChatBottomSheet.tsx:178`
- Static weather item model and render: `src/components/WeatherTicker.tsx:205`
- Tutorial delay and lighter overlay: `src/components/GlobeTutorial.tsx:8`
- Fallback and weather CSS: `src/app/globals.css:2272`
- Mobile fallback and weather CSS: `src/app/globals.css:2984`

## Non-Goals

- No auth, Supabase, Stripe, checkout, service worker, manifest, sitemap, robots, API, dependency, or deployment changes.
- No homepage, store, profile, tag, legal, navbar, or footer implementation changes.
- No Round 13/14 source rollback.

## Known Notes

- The in-app Browser screenshot API timed out on the live WebGL canvas, so screenshot evidence is supplied by the repeatable CDP script.
- The in-app Browser still supplied page identity, DOM health, console health, and interaction proof.
- The final CDP live `/globe` pass confirms loaded map tiles, weather items, markers, no clipping, and no runtime/console/network failures.
