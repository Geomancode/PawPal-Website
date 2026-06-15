# Round 03 Implementation Record: Homepage First Viewport

Status: Approved
Date: 2026-06-11
Owner: Codex

## Summary

Round 03 implemented the approved Homepage first-viewport slice. The mobile hero now prioritizes the H1, product promise, `Open Live Map`, `Shop Smart Tags`, and the first visible globe proof before secondary signal/badge content. Desktop globe proof remains visible with no more than two first-viewport floating callouts.

## Changes Made

- `src/app/page.tsx`
  - Reduced mobile hero top/inner spacing.
  - Removed the mobile fixed hero min-height that pushed the globe below the first viewport.
  - Reordered the hero so both CTAs appear before secondary signal/badge proof.
  - Hid the signal rail below `sm` and badge row below `md`.
- `src/components/HomeClientParts.tsx`
  - Added `useReducedMotion` handling for touched Homepage Framer Motion surfaces.
  - Added shared `enterMotion` helper for consistent reduced-motion branching.
  - Reduced mobile `GlobeSection` minimum height with responsive clamp sizing.
  - Removed the extra `Ghent Pilot` and `Lost mode` globe callouts from the hero DOM, leaving route/NFC proof as the visible desktop callout set.

## Evidence Location

- `DIFF_BASELINE.md`
- `evidence/PRE_IMPLEMENTATION_BASELINE.md`
- `evidence/home-page.pre-round03.tsx.snapshot`
- `evidence/HomeClientParts.pre-round03.tsx.snapshot`
- `evidence/COMMAND_RESULTS.md`
- `evidence/BROWSER_VERIFICATION.md`
- `evidence/SCREENSHOT_INDEX.md`
- `evidence/DIFF_ATTRIBUTION.md`
- `FINAL_REVIEW_PACKET.md`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-03-homepage-first-viewport/`

## Commands

| Command | Result |
| --- | --- |
| `curl -I http://localhost:3000` | PASS, HTTP 200 |
| `npm run lint` | PASS |
| `npm run build` | PASS |

## Browser Runtime Notes

- Browser/IAB available and used.
- Flow under test: `/` loads -> Homepage first viewport renders -> hero CTAs navigate to `/globe` and `/store`.
- Official Browser results saved in `round03-browser-results.json` and `round03-cta-results.json`.
- Four homepage screenshots captured at `390x844`, `768x1024`, `1280x720`, and `1440x900`.
- CTA target screenshots captured for `/globe` and `/store` at `390x844`.
- Browser log API retained two historical messages from an earlier Store route; Round 03 evidence filters logs by this run's timestamp, with `newLogCount: 0`.

## Accessibility Notes

- Hero CTAs are native anchors with `href="/globe"` and `href="/store"`, no custom role override, no positive `tabIndex`, and focus-visible outline classes.
- Global focus-visible styling exists for anchors/buttons in `src/app/globals.css`.
- Touched motion surfaces use Framer Motion `useReducedMotion`; global CSS also disables selected animations under `prefers-reduced-motion: reduce`.
- Browser media emulation for dark/reduced-motion was not available. Dark-mode evidence is source-audited: global CSS contains a later `prefers-color-scheme: dark` override that forces light PawPal tokens and `color-scheme: light`.

## Known Risks

- `src/app/page.tsx` and `src/components/HomeClientParts.tsx` were already dirty before Round 03.
- Browser could not directly sample WebGL/canvas pixels. Evidence uses DOM canvas presence, visible canvas bounds, and viewport screenshots.
- Browser media emulation for dark/reduced-motion was unavailable; behavior is source-audited.
- Homepage includes an embedded Globe; Round 03 did not touch Globe internals.

## Final Review Result

Approved by all four leads:

- QA / Linnaeus: 通过
- Product / Plato: 通过
- Engineering / McClintock: 通过
- Design / Laplace: 通过
