# Diff Attribution: Round 04 Globe Tool Surface

Date: 2026-06-11
Baseline: pre-round snapshots in `evidence/`

## Changed After Round 04 Baseline

| File | Diff stat vs pre-round snapshot | Attribution |
| --- | ---: | --- |
| `src/components/GlobeFullPage.tsx` | 10 lines | Route shell and HUD class wiring only. |
| `src/components/WeatherTicker.tsx` | 20 lines | Weather bar class wiring plus quiet unavailable state. |
| `src/components/ChatBottomSheet.tsx` | 12 lines | Globe search id/aria, focus-to-expand, close/collapse accessible names, sheet class wiring. |
| `src/components/GlobeTutorial.tsx` | 16 lines | Tooltip class, close accessible name, safe tooltip placement for full-map target. |
| `src/components/Navbar.tsx` | 19 lines | `/globe` route specialization and compact nav sizing. |
| `src/app/globals.css` | 146 lines | Globe/nav/HUD/chat/weather/tutorial/map-control selectors. |

## Unchanged Against Round 04 Snapshots

| File | Result |
| --- | --- |
| `src/app/globe/page.tsx` | Unchanged; SHA still `875ecd04e6a03c690954ed6565dd15cf329c781b72918330ca14c409361b01be`. |
| `src/app/globe/layout.tsx` | Unchanged; SHA still `e4cc229ec33cf4b1fb26873de29d6812dca2b226e00f5cb16f2ab7280e40e16c`. |

## Source Boundary Audit

### MapLibre, Map Data, And Markers

`src/components/GlobeFullPage.tsx` changes are in rendered class names and HUD presentation around lines 433-518. No changes were made to:

- MapLibre constructor options, style, sources, layers, controls, projection, or sky setup.
- `fetchQuests` / `fetchPlaces` arguments.
- Geolocation options or fallback location logic.
- Marker creation logic, marker colors/data, popup content, or marker add/remove behavior.

### Weather And Geocoding

`src/components/WeatherTicker.tsx` keeps the same weather and geocoding fetch URLs, query parameters, method, and response parsing at lines 89-114. Round 04 only adds `weatherIssue` state and a quiet fallback UI at lines 72, 86, 115-117, and 185-207.

### Chat APIs And Streaming

`src/components/ChatBottomSheet.tsx` changes do not alter `/api/map-search`, `/api/ai-agent`, request methods, bodies, auth headers, SSE parsing, tool-result handling, map fly-to behavior, or search marker creation. Round 04 only changes presentation and interaction affordances at lines 511-515, 535-548, 577-590, and 684-692.

### Tutorial

`src/components/GlobeTutorial.tsx` keeps the same storage key, step sequence, dismissal behavior, and progress behavior. Round 04 adds a class name, close accessible name, and safe placement for large targets at lines 172, 192, and 239-247.

### Navbar

`src/components/Navbar.tsx` adds `isGlobeRoute` and specializes only the visual nav class, height, logo sizing, and desktop gap for `/globe` at lines 30, 57-79. Link destinations, active-route detection, auth loading, account menu, sign-out flow, and mobile menu behavior are not changed.

Because `Navbar.tsx` changed, `/` and `/store` smoke checks were run and passed at desktop and mobile sizes.

### Global CSS

Round 04 CSS additions are in:

- `site-nav` and `site-nav-map` selectors at lines 263-320.
- Globe tool-surface selectors at lines 2185-2310.
- Mobile Globe overrides at lines 2407-2430.

No Round 04 CSS changes were made to tokens, resets, dark-mode token overrides, payment/store/auth/profile/legal route selectors, dependency config, database config, or API code.

## Out Of Scope Files

Round 04 did not edit:

- `src/components/Globe.tsx`
- `src/components/GlobeComponent.tsx`
- `src/lib/fetchQuests.ts`
- `src/lib/fetchPlaces.ts`
- `src/app/api/*`
- Supabase, Stripe, auth, payment, database, dependency, deployment, image asset, Store/Auth/Profile/Tag/About/Help/Legal/Footer files
