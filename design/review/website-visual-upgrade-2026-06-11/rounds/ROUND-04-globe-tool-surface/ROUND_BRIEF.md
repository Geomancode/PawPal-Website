# Round 04 Brief: Globe Tool Surface

Status: Approved for implementation
Date: 2026-06-11
Owner: Codex

## Goal

Execute the next approved visual upgrade slice from `WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md`: make `/globe` feel like a dedicated full-screen map tool with calmer HUD hierarchy, less visual competition, and better mobile/desktop control ergonomics.

## Proposed Scope

- Treat `/globe` as a map/tool surface rather than a standard marketing page with many overlapping overlays.
- Compact or route-specialize the global navigation on `/globe` so it does not dominate the map tool.
- Reduce the visual weight of the full-width weather strip and keep it from feeling like a second header.
- Convert the current vertical layer pill stack into a compact, predictable map toolbar or segmented control.
- Reposition or compact the `Nearby needs` panel so it does not compete with map controls and markers.
- Move or simplify the status strip so it does not sit on top of map controls, chat, or browser safe areas.
- Keep the chat sheet available, but make its peek/expanded states coexist with map controls.
- Make the tutorial overlay/card usable on mobile and desktop without masking key controls or nav in a jarring way.
- Define or reuse map HUD styling in a bounded way: panel opacity, border, compact typography, icon sizing, safe-area spacing.
- Preserve existing map markers, data fetching, AI search, weather fetching, tutorial step logic, and chat behavior.

## Non-Goals

- No MapLibre initialization rewrite.
- No map data, marker data, marker popup, geolocation, weather API, AI chat/search, Supabase, Stripe, auth, database, or API behavior changes.
- No home hero Globe changes.
- No Store, Checkout, Orders, Auth, Profile, Tag, About, Help, Legal, Footer, PWA/service worker, manifest, sitemap, robots, deployment, environment, dependency, or package changes.
- No broad `globals.css` cleanup outside explicitly approved map/HUD selectors.
- No new image generation or asset replacement.
- No redesign of non-Globe pages.

## Routes Affected

Implementation route:

- `/globe`

Verification routes:

- `/globe`
- `/` only as a smoke check if `Navbar.tsx` changes.
- `/store` only as a smoke check if `Navbar.tsx` changes.

## Files Expected To Change

Expected implementation files:

- `src/components/GlobeFullPage.tsx`
- `src/components/WeatherTicker.tsx`
- `src/components/ChatBottomSheet.tsx`
- `src/components/GlobeTutorial.tsx`
- `src/components/Navbar.tsx`
- `src/app/globe/page.tsx`
- `src/app/globe/layout.tsx`
- `src/app/globals.css`, limited to existing or newly grouped Globe/map HUD selectors only.

Expected documentation/evidence files:

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-04-globe-tool-surface/*`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-04-globe-tool-surface/*`

Stop rule:

If implementation requires touching `src/components/Globe.tsx`, `src/components/GlobeComponent.tsx`, `src/lib/fetchQuests.ts`, `src/lib/fetchPlaces.ts`, `src/app/api/*`, Supabase/Stripe/auth/payment/database/config/dependency/deployment files, Store/Auth/Profile/Tag/About/Help/Legal/Footer files, or image assets, the implementer must stop and request brief amendment plus four-lead approval before continuing.

## Primary User Scenario

A visitor opens `/globe` to explore local pet places, missions, weather, and map search. They should immediately perceive a serious interactive map tool, not a page where nav, tutorial, weather, layer pills, nearby cards, status strips, and chat all compete at the same priority.

## Current Baseline

Captured on 2026-06-11:

- Baseline screenshots:
  - `globe-baseline-mobile-390x844.png`
  - `globe-baseline-tablet-768x1024.png`
  - `globe-baseline-desktop-1280x720.png`
  - `globe-baseline-desktop-1440x900.png`
- Browser baseline raw data:
  - `round04-globe-baseline-browser-results.json`
  - `round04-globe-baseline-tablet-browser-results.json`
- New warning/error logs during baseline run: `0`.
- Visible framework overlay: none.
- Horizontal overflow: `0`.
- Map canvas present: true.

Baseline visual issues:

- Tutorial card and fixed global nav compete in the first desktop viewport.
- Weather strip reads as a full-width dark header over the map.
- Layer controls are a vertical pill stack, separated from other map controls.
- `Nearby needs` panel has high visual weight and covers map content on mobile and desktop.
- Status strip sits near bottom controls and safe areas.
- Mobile first viewport stacks tutorial, weather, layer pills, nearby card, map controls, and chat in a crowded way.

## Target Outcome

Mobile `390x844`:

- Map remains the dominant visible surface.
- Global nav or map header is compact enough that the tool surface feels primary.
- Tutorial state is readable without hiding the layer controls and core map context.
- Weather context is visible or accessible without a heavy full-width dark band.
- Layer controls and nearby panel do not visually collide.
- Chat peek state remains reachable without hiding MapLibre controls or status content.
- No horizontal overflow.

Desktop `1280x720` and `1440x900`:

- Map canvas fills the working area and stays visually primary.
- Navigation/header, weather, nearby, layers, status, tutorial, and chat have clear hierarchy.
- Layer controls feel like a map toolbar/segmented control, not detached marketing pills.
- Status and chat do not overlap MapLibre controls or safe areas.
- Tutorial overlay feels intentionally anchored and does not mask the nav/header awkwardly.
- No visible framework overlay and no new console warnings/errors.

## Trust / Safety States In Scope

- Location-denied fallback remains visible and understandable.
- Offline/nearby-data issue states remain visible when present.
- Weather loading/state remains available.
- Layer toggles remain clear, enabled, and reversible.
- Chat sheet remains discoverable and closable.
- Tutorial remains dismissible and navigable.

## Product Tradeoffs And Unresolved Risks

- This round prioritizes tool clarity over showing every status/hint simultaneously.
- Some current panels may become compact, grouped, or less visually prominent.
- Browser may not allow real location permission; Ghent fallback state is acceptable evidence.
- External map/weather tile/network behavior may vary; this round must not attempt to fix data availability by changing APIs.
- Existing worktree contains pre-existing dirty source/config changes; Round 04 attribution is limited to changes made after `DIFF_BASELINE.md` and the pre-implementation snapshots.

## Risk Level

Medium-high. `/globe` is a real interactive map surface with MapLibre, weather, data fetching, chat, tutorial, and route-specific navigation. The implementation must stay visual/layout-oriented and avoid behavior rewrites.

## Required Evidence

- Command results:
  - `npm run lint`
  - `npm run build`
- Browser checks:
  - URL/title.
  - Non-empty render.
  - Blocking overlay status.
  - Console errors/warnings filtered to the final run.
  - Map canvas presence.
  - No horizontal overflow.
  - Layer toggle interaction for Missions and Places.
  - Chat peek open/close or expand/collapse state.
  - Tutorial next/skip or dismiss behavior.
- Screenshots:
  - Baseline screenshots from this brief.
  - After screenshots for `/globe` at 390x844, 768x1024, 1280x720, and 1440x900.
  - After screenshots for tutorial state and chat expanded state.
- `/` and `/store` nav smoke screenshots only if `Navbar.tsx` changes.
- If `Navbar.tsx` changes, `/` and `/store` smoke evidence must include URL/title, non-empty render, visible framework overlay status, timestamp-filtered console warn/error count, horizontal overflow, and screenshots only when layout appears affected.
- Responsive measurements:
  - Header/nav height.
  - Weather control top/height.
  - Nearby panel top/height.
  - Layer control top/height.
  - Status strip visibility/position.
  - Chat peek height.
  - MapLibre control bounds.
  - Any control overlap pairs.
- Accessibility notes:
  - Keyboard/focusability evidence for layer controls, chat input/control, tutorial buttons, and route nav if touched.
  - Reduced-motion behavior or source evidence for touched animations.
  - Dark-mode visual/source evidence or explicit Browser blocker.
- Known risks:
  - Existing dirty worktree attribution.
  - Any inability to test real location permission, external weather/tile requests, or WebGL pixel sampling.
  - Any deviation from approved implementation boundaries.
- Engineering source-diff audit:
  - Confirm `GlobeFullPage.tsx` did not change MapLibre initialization, map style/source/layer definitions, `fetchQuests` / `fetchPlaces` call parameters, geolocation behavior, marker creation, or popup data behavior. If any of these must change, stop for brief amendment.
  - Confirm `WeatherTicker.tsx` did not change weather/geocoding fetch URLs, query parameters, request method, or response parsing. If any of these must change, stop for brief amendment.
  - Confirm `ChatBottomSheet.tsx` did not change `/api/map-search`, `/api/ai-agent`, request method/body/auth headers, SSE parsing, or tool-result marker behavior. If any of these must change, stop for brief amendment.
  - Provide a selector-level `globals.css` diff audit showing only Globe/map/HUD/chat/weather/tutorial selectors changed; no tokens, reset/global helpers, dark-mode compatibility, or unrelated route selectors.
  - If `Navbar.tsx` changes, provide evidence that changes are `/globe` route-specialized and do not alter ordinary route nav links, auth/session controls, sign-out behavior, or non-Globe layout behavior.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace

## Exit Criteria

- Four leads approve this Round 04 brief.
- Implementation stays inside approved scope.
- Final diff is attributable against the Round 04 pre-implementation snapshots.
- Lint/build pass or blocker is accepted.
- Browser evidence confirms Globe tool-surface targets.
- Four leads review Round 04 evidence and sign the final record.

## Brief Approval Result

Approved by all four leads:

- QA / Linnaeus: 通过
- Product / Plato: 通过
- Engineering / McClintock: 通过
- Design / Laplace: 通过
