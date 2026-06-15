# Round Brief: Round 15 Globe Market Readiness Sweep

Round: 15  
Status: Proposed  
Date: 2026-06-14  
Owner: Codex

## Goal

Clear the Round 14 QA, Engineering, and Design conditions so `/globe` can move from conditionally accepted fallback hardening toward real-market readiness.

This round is a targeted Globe resilience and polish round. It is not a sitewide redesign.

## Conditions To Clear

QA / Linnaeus:

- Add `/globe` fallback keyboard tab/focus evidence.
- Add fallback reduced-motion runtime evidence.
- Add fallback dark-mode runtime evidence.
- Re-run `/`, `/store`, and `/help` smoke after meaningful loaded-state signals.

Engineering / McClintock:

- Explicitly cancel or guard MapLibre RAF loops.
- Add removed guards to spin/inertia/wheel animation paths.
- Cover post-init WebGL context loss and context creation error canvas events.
- Validate live map created first, then entering route-local fallback.

Design / Laplace:

- Review/polish normal `/globe` live-state overlay density.
- Fix weather ticker clipping.
- Reduce first-visit tutorial pressure where it competes with the live tool surface.

## Approved Scope

Allowed source changes:

- `src/components/GlobeFullPage.tsx`
- `src/components/WeatherTicker.tsx`
- `src/components/GlobeTutorial.tsx`
- `src/app/globals.css`, Globe-scoped selectors only
- Round 15 evidence and review records

Evidence-only routes:

- `/`
- `/store`
- `/help`

Read-only unless all four leads reapprove:

- Navbar, Footer, Homepage implementation, Store implementation, Profile, Tag, Help implementation, Legal, Auth, Checkout, API, auth, Supabase, Stripe, service worker, manifest, sitemap, robots, package, lockfile, deployment, and environment files.

## Explicit Non-Goals

- No new map provider.
- No dependency installation or package update.
- No backend, database, payment, auth, AI, or environment change.
- No new product claims or fake live metrics.
- No broad global CSS cleanup.
- No full Globe redesign beyond overlay density, weather clipping, tutorial pressure, and resilience.

## Product Intent

- Preserve the live Globe as the primary `/globe` experience.
- Preserve the Round 14 fallback journey.
- Make first-time and constrained-device users less likely to see a crowded, broken, or confusing surface.

## Engineering Intent

- Make all animation loops safe to stop.
- Prevent map callbacks from touching a removed map after fallback/unmount.
- Treat post-init WebGL context loss as recoverable route state.
- Keep changes localized and testable.

## Design Intent

- Keep the full-screen map feeling like a tool rather than a stack of floating panels.
- Prevent weather ticker text clipping.
- Keep tutorial available without dominating the first viewport.
- Preserve compact Globe Navbar and map controls.

## Required Evidence Before Final Signoff

- `npm run lint`
- `npm run build`
- `/globe` normal live matrix:
  - 390x844
  - 1280x720
- `/globe` WebGL-unavailable fallback matrix:
  - 390x844
  - 1280x720
- Post-init WebGL context-loss validation:
  - live map/container appears first
  - context loss is triggered or simulated after init
  - route-local fallback appears
  - no global app error
  - no runaway runtime/console errors
- Keyboard/focus validation on fallback actions.
- Dark-mode fallback validation.
- Reduced-motion fallback validation.
- Loaded-state smoke for `/`, `/store`, and `/help`.
- Screenshot evidence for live Globe and fallback states.
- Four acceptance files and final signoff record.

## Stop Conditions

- Post-init context loss still reaches global app error.
- Any RAF loop continues to throw after map removal/fallback.
- Weather ticker clipping remains visible in evidence.
- Tutorial still blocks the Globe first viewport in a way Design rejects.
- Build/lint/browser evidence fails without an accepted blocker.
