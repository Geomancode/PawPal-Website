# Round 04 Implementation Record: Globe Tool Surface

Status: Approved
Date: 2026-06-11
Owner: Codex

## Summary

Round 04 upgraded the `/globe` tool surface after brief approval from QA, Product, Engineering, and Design. The implementation keeps the map/data/API contracts intact and concentrates the visual work on the Globe shell, HUD placement, weather bar, chat sheet, tutorial placement, and route-specialized Globe navigation.

## Changes Made

- Added a fixed full-viewport Globe shell and moved HUD placement into grouped Globe selectors.
- Repositioned weather, nearby needs, layer toggles, status strip, map controls, and chat peek state so they no longer collide across 390, 768, 1280, and 1440 viewports.
- Added a compact `/globe` nav presentation while preserving ordinary nav behavior for non-Globe routes.
- Added a quiet WeatherTicker unavailable state when external weather APIs fail, without changing weather/geocoding URLs, methods, parameters, or response parsing.
- Improved chat sheet interaction by expanding from peek when the search input receives focus and adding explicit accessible names to sheet controls.
- Improved tutorial placement for full-map targets and added a close-button accessible name.

## Evidence Location

- `DIFF_BASELINE.md`
- `evidence/PRE_IMPLEMENTATION_BASELINE.md`
- Pre-round file snapshots in `evidence/`
- Baseline screenshots and raw JSON in `design/assets/review/website-visual-upgrade-2026-06-11/round-04-globe-tool-surface/`
- Final screenshots and raw JSON in `design/assets/review/website-visual-upgrade-2026-06-11/round-04-globe-tool-surface/`
- `evidence/COMMAND_RESULTS.md`
- `evidence/BROWSER_VERIFICATION.md`
- `evidence/SCREENSHOT_INDEX.md`
- `evidence/DIFF_ATTRIBUTION.md`

## Commands

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run build` | PASS |

## Browser Runtime Notes

Browser/IAB verification completed for `/globe` at 390x844, 768x1024, 1280x720, and 1440x900. Additional interaction checks covered layer toggles, chat focus expand/close, and tutorial Next/Skip. Because `Navbar.tsx` changed, `/` and `/store` smoke checks were also run at desktop and mobile sizes.

## Accessibility Notes

- Layer toggles remain native buttons.
- Chat search input has `aria-label="Search or ask PawPal AI on the globe"`.
- Chat close/collapse controls now have explicit accessible names.
- Tutorial close control now has an explicit accessible name.
- Global focus-visible styling remains in `src/app/globals.css`.

## Known Risks

- Relevant Globe files were already dirty before Round 04.
- `/globe` combines map rendering, data fetching, weather, tutorial, chat, and global nav.
- Browser did not grant location permission; evidence uses the app's Ghent fallback state.
- Browser cannot force every OS/browser media mode from this runtime. Round 04 did not introduce new route-level theme behavior and did not add new keyframe animation contracts.

## Final Review Result

Approved by QA, Product, Engineering, and Design.
