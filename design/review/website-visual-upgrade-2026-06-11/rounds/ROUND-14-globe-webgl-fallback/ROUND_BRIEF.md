# Round Brief: Round 14 Globe WebGL Fallback Hardening

Round: 14  
Status: Proposed  
Date: 2026-06-14  
Owner: Codex

## Goal

Resolve the shared Round 13 condition: `/globe` must remain a stable, usable, market-ready page when WebGL or MapLibre initialization is unavailable. Users should see a calm route-local fallback with useful Globe context and available actions, not the global app error page.

This is a resilience and user-experience hardening round, not a Globe redesign round.

## Why This Round

Round 13 validation showed that headless Chrome can fail WebGL context creation for `/globe`. The compact Navbar still rendered correctly, but MapLibre initialization escalated into the global app error page:

- User-visible issue: `PawPal could not load this page`.
- Likely trigger: WebGL context creation fails before MapLibre completes initialization.
- Market risk: visitors on restricted devices, privacy-hardened browsers, GPU-denied sessions, or automation previews can hit a hard error instead of a graceful map fallback.

## Approved Scope

Allowed source changes after brief approval:

- `src/components/GlobeFullPage.tsx`
  - Detect WebGL support before creating the MapLibre map.
  - Catch MapLibre construction failures and convert them into route-local fallback state.
  - Keep existing weather, nearby needs, layer toggle, status, chat, and tutorial behavior intact when the live map is available.
  - Avoid rendering map-dependent controls that cannot work when the map is unavailable.
- `src/components/GlobeStaticPreview.tsx`
  - Reuse or lightly extend the existing static preview for a full-page fallback state.
  - Do not turn the preview into a new marketing section.
- `src/app/globals.css`
  - Add or adjust only Globe fallback-scoped selectors.
- Round 14 evidence and review records.

Conditional file:

- `src/app/globe/page.tsx`
  - Only if the dynamic loading/fallback boundary must be tightened.

Read-only unless all four leads reapprove:

- `src/components/Navbar.tsx`
- `src/components/Navbar.module.css`
- `src/components/Footer.tsx`
- `src/components/Footer.module.css`
- `src/app/page.tsx`
- `src/components/HomeClientParts.tsx`
- Store, Profile, Tag, Help, Auth, Legal, API, auth, Supabase, Stripe, service worker, manifest, sitemap, robots, package, lockfile, deployment, and environment files.

## Explicit Non-Goals

- No map provider replacement.
- No dependency installation or package update.
- No API, data model, Supabase, AI, auth, Stripe, checkout, deployment, CI, or environment change.
- No Homepage, Store, Profile, Tag, Help, Auth, Legal, Navbar, or Footer visual changes.
- No new unsupported product claims or fake live data.
- No broad global CSS cleanup outside Globe fallback selectors.

## Product Intent

- `/globe` remains a valid entry point even without WebGL.
- The fallback explains that the live map is temporarily unavailable without sounding broken or technical.
- Users still have meaningful next actions: retry, visit Store smart tags, and contact local/help pathways where appropriate.
- Existing live Globe users should see no regression when WebGL works.

## Engineering Intent

- Treat WebGL unavailability as expected runtime state, not as an app-level exception.
- Keep the fallback route-local and easy to reason about.
- Preserve existing map lifecycle cleanup.
- Avoid SSR/client hydration drift.
- Keep map-dependent child components from invoking map APIs when no map exists.

## Design Intent

- Replace the current hard error panel with a dark, Globe-native fallback that feels intentionally part of the product.
- Keep the approved full-screen Globe atmosphere, compact nav, and calm HUD language.
- Do not introduce overlap with the Navbar, weather area, or chat controls.
- Fallback text must be short, legible, and non-alarmist.

## Required Evidence Before Final Signoff

- `npm run lint`
- `npm run build`
- Rendered `/globe` checks at:
  - 390x844
  - 768x1024
  - 1280x720
  - 1440x900
- WebGL-unavailable simulation evidence:
  - route renders non-empty content
  - no global app error panel
  - no framework overlay
  - no horizontal overflow
  - fallback content is visible
  - retry control is visible and safe
- Normal `/globe` smoke when possible:
  - compact nav remains visible
  - live map path still attempts to initialize
  - fallback does not alter other routes
- Cross-route smoke for `/`, `/store`, and `/help`.
- Console observations with relevant errors explained.
- Screenshot evidence for fallback desktop and mobile states.
- Four role acceptance files.
- Final signoff record.

## Acceptance Gates By Role

QA:

- `/globe` no longer reaches the global app error panel when WebGL is unavailable or MapLibre construction fails.
- Responsive, overflow, console, and framework-overlay checks pass or have accepted blockers.

Product:

- Users can understand the state and continue a useful PawPal journey.
- No new claim, feature promise, or dead-end CTA is introduced.

Engineering:

- The fallback path is localized, maintainable, and does not touch protected boundaries.
- Map cleanup and map-dependent components remain safe.

Design:

- The fallback looks deliberate, calm, and aligned with the approved Globe surface.
- No overlap, cramped copy, prototype-looking placeholders, or visually harsh error treatment remains.

## Stop Conditions

- `/globe` still shows the global app error page in WebGL-unavailable validation.
- Live-map path is broken in normal preview without an accepted blocker.
- A protected route, data, auth, payment, dependency, deployment, or shared navigation/footer boundary is touched.
- The fallback introduces unsupported claims or fake live metrics.
- `npm run lint`, `npm run build`, or required rendered evidence fails without an accepted blocker.
