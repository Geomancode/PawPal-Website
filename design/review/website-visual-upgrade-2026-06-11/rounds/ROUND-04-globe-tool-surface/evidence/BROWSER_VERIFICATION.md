# Browser Verification: Round 04 Globe Tool Surface

Date: 2026-06-11
Tooling: Browser/IAB
Primary URL: `http://localhost:3000/globe`

## Flow Under Test

`/globe` loads -> map canvas and Globe HUD render -> layer toggles update map markers -> chat sheet expands/collapses -> tutorial advances/dismisses -> `/` and `/store` still render after Navbar changes.

## Globe Page Health

| Viewport | URL | Title | Meaningful render | Map canvas | Visible overlay | New logs | Overflow X | Control overlaps |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| 390x844 | `/globe` | `Live Pet Globe \| PawPal` | PASS | PASS | none | 0 | 0 | 0 |
| 768x1024 | `/globe` | `Live Pet Globe \| PawPal` | PASS | PASS | none | 0 | 0 | 0 |
| 1280x720 | `/globe` | `Live Pet Globe \| PawPal` | PASS | PASS | none | 0 | 0 | 0 |
| 1440x900 | `/globe` | `Live Pet Globe \| PawPal` | PASS | PASS | none | 0 | 0 | 0 |

## Final Globe Measurements

| Viewport | Nav | Weather | Nearby | Layers | Chat | Status | Map controls |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 390x844 | `12,12 366x50` | `12,71 366x49` | `12,222 320x136` | `245,130 133x89` | `12,760 304x68` | hidden | `165,615 213x141` |
| 768x1024 | `16,12 736x58` | `12,71 744x49` | `12,222 320x136` | `623,130 133x89` | `12,940 682x68` | hidden | `543,795 213x141` |
| 1280x720 | `16,12 1248x58` | `288,76 704x49` | `16,134 320x136` | `1024,76 240x49` | `384,636 512x68` | `16,593 320x41` | `1055,495 213x141` |
| 1440x900 | `16,12 1408x58` | `368,76 704x49` | `16,134 320x136` | `1184,76 240x49` | `464,816 512x68` | `16,773 320x41` | `1215,675 213x141` |

All measurements are `x,y width x height` from Browser runtime JSON.

## Interaction Evidence

| Interaction | Result | Evidence |
| --- | --- | --- |
| Layer toggles | PASS | `Missions` off -> active class removed; `Places` off -> marker count changed from `15` to `0`; both restored -> marker count returned to `15`. |
| Chat sheet | PASS | Search input focus expanded chat from `68px` peek to `288px` half; `Close search panel` returned it to `68px`; new logs `0`. |
| Tutorial | PASS | Fresh local origin showed `Welcome to the Globe!`; `Next` advanced to `AI-Powered Search`; `Skip` dismissed the card. |

Tutorial validation used `http://127.0.0.1:3000/globe` as a fresh local origin because the Browser runtime page scope did not expose writable `localStorage` for resetting the previously dismissed tutorial on `localhost`.

## Navbar Smoke Evidence

| Route | Viewport | URL | Title | Meaningful render | Visible overlay | New logs | Overflow X |
| --- | --- | --- | --- | --- | --- | ---: | ---: |
| `/` | 1280x720 | `http://localhost:3000/` | `Pet Safety Map, Smart Tags, and Local Pet Community` | PASS | none | 0 | 0 |
| `/store` | 1280x720 | `http://localhost:3000/store` | `Store \| PawPal` | PASS | none | 0 | 0 |
| `/` | 390x844 | `http://localhost:3000/` | `Pet Safety Map, Smart Tags, and Local Pet Community` | PASS | none | 0 | 0 |
| `/store` | 390x844 | `http://localhost:3000/store` | `Store \| PawPal` | PASS | none | 0 | 0 |

## Accessibility And Focus Evidence

- Layer controls are native buttons.
- Chat input has `id="globe-search"` and `aria-label="Search or ask PawPal AI on the globe"`.
- Chat close control is reachable by accessible name `Close search panel`.
- Tutorial close control has accessible name `Close globe tutorial`.
- Global `:focus-visible` styling remains present in `src/app/globals.css`.

## Known Limits

- Browser did not grant actual geolocation permission; the app fallback state was verified.
- Browser could not force every media preference mode from this runtime. Round 04 source changes do not add new dark-mode branches or new keyframe animation contracts.
- External weather API availability is not guaranteed during local validation; the component now degrades to a quiet unavailable state without console errors.
