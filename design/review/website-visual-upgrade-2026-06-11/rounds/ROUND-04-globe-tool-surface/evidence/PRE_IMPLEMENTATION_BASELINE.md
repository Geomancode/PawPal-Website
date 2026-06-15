# Pre-Implementation Baseline: Round 04 Globe Tool Surface

Date: 2026-06-11

## Snapshot Coverage

Round 04 captured snapshots for all files that the brief may allow implementation to touch:

- `src/app/globe/page.tsx`
- `src/app/globe/layout.tsx`
- `src/components/GlobeFullPage.tsx`
- `src/components/WeatherTicker.tsx`
- `src/components/ChatBottomSheet.tsx`
- `src/components/GlobeTutorial.tsx`
- `src/components/Navbar.tsx`
- `src/app/globals.css`

## Browser Baseline

Browser/IAB loaded `/globe` at:

- 390x844
- 768x1024
- 1280x720
- 1440x900

Results:

- Page title: `Live Pet Globe | PawPal`.
- Meaningful render: true.
- Visible framework overlay: false.
- Horizontal overflow: `0`.
- Map canvas present: true.
- New warning/error logs during baseline capture: `0`.

## Baseline Issues To Address

- `/globe` still carries the full fixed global navigation treatment.
- Tutorial overlay and nav compete on desktop.
- Weather is a full-width dark strip and feels like another header.
- Layer controls are visually detached from other map controls.
- Nearby card has high visual weight and covers map context.
- Bottom status strip competes with lower map controls and chat/safe-area space.
- Mobile first viewport shows too many simultaneous overlays.
- Tablet first viewport shows the same nav/tutorial/weather/HUD competition before desktop layout has enough room.

## Baseline Assets

Stored in:

`design/assets/review/website-visual-upgrade-2026-06-11/round-04-globe-tool-surface/`

Baseline files now include:

- `globe-baseline-mobile-390x844.png`
- `globe-baseline-tablet-768x1024.png`
- `globe-baseline-desktop-1280x720.png`
- `globe-baseline-desktop-1440x900.png`
- `round04-globe-baseline-browser-results.json`
- `round04-globe-baseline-tablet-browser-results.json`
