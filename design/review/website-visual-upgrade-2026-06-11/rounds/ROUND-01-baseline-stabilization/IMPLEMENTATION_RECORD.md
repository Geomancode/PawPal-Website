# Round 01 Implementation Record: Baseline Stabilization

Status: Approved
Date: 2026-06-11
Owner: Codex

## Summary

Round 01 brief was approved by QA, Product, Engineering, and Design. Baseline evidence capture is complete.

## Changes Made

- Captured 40 official baseline screenshots: 10 routes x 4 viewports.
- Captured merged browser metrics in `baseline-results.json`.
- Captured per-route fragments in `part-*.json`.
- Wrote human-readable evidence reports:
  - `evidence/COMMAND_RESULTS.md`
  - `evidence/SCREENSHOT_INDEX.md`
  - `evidence/BASELINE_REPORT.md`
  - `evidence/ROUTE_DESIGN_SUMMARY.md`
- Updated this implementation record for final review.

No source implementation files were changed.

## Evidence Location

- Screenshot and raw JSON directory: `design/assets/review/website-visual-upgrade-2026-06-11/round-01-baseline/`
- Round evidence reports: `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-01-baseline-stabilization/evidence/`

## Route Checks

| Route | Desktop screenshot | Mobile screenshot | Console notes | Status |
| --- | --- | --- | --- | --- |
| `/` | `home-1280x720.png` | `home-390x844.png` | 0 warn/error | Complete |
| `/store` | `store-1280x720.png` | `store-390x844.png` | 0 warn/error | Complete |
| `/globe` | `globe-1280x720.png` | `globe-390x844.png` | 0 warn/error | Complete |
| `/auth` | `auth-1280x720.png` | `auth-390x844.png` | 0 warn/error | Complete |
| `/profile` | `profile-1280x720.png` | `profile-390x844.png` | 0 warn/error | Complete; redirects to `/auth` |
| `/about` | `about-1280x720.png` | `about-390x844.png` | 0 warn/error | Complete |
| `/tag/sample-id` | `tag-sample-id-1280x720.png` | `tag-sample-id-390x844.png` | 0 warn/error | Complete; invalid sample route |
| `/store/checkout` | `store-checkout-1280x720.png` | `store-checkout-390x844.png` | 0 warn/error | Complete; redirects to `/store` |
| `/store/orders` | `store-orders-1280x720.png` | `store-orders-390x844.png` | 0 warn/error | Complete |
| `/store/success` | `store-success-1280x720.png` | `store-success-390x844.png` | 0 warn/error | Complete |

## Commands

Preview availability:

```bash
curl -I --max-time 5 http://localhost:3000
```

Result: `HTTP/1.1 200 OK`.

`npm run lint`: N/A. Baseline-evidence/non-implementation round.

`npm run build`: N/A. Baseline-evidence/non-implementation round.

## Browser Runtime Notes

- Browser evidence captured through the in-app Browser.
- Official screenshot count: 40.
- Viewports captured for every route: 390x844, 768x1024, 1280x720, 1440x900.
- Console `warn`/`warning`/`error` count: 0.
- Blocking overlay count: 0.
- Overlay detector note: raw JSON matched an empty `nextjs-portal` and reports `blockingOverlay: true`, but `overlayText` is empty, screenshots show no visible blocker, and console warn/error count is 0. Round 01 treats this as a detector false positive.
- Horizontal overflow count: 0.
- `/profile` signed-out redirect confirmed: final URL `/auth`.
- `/store/checkout` empty-session redirect confirmed: final URL `/store`.

Key first-viewport measurements:

- Home mobile: `Open Live Map` at `top: 803`, `Shop Smart Tags` at `top: 863`, globe canvas at `top: 1284`.
- Store mobile: search at `top: 517`, category filters at `top: 1037`, first visible `Add` action at `top: 1647`.
- Tag sample mobile: not-found H1 at `top: 307`, `Back home` at `top: 545`, `Shop smart tags` at `top: 605`.

## Accessibility Notes

- Visible focusable controls were enumerated in `baseline-results.json`.
- Browser `TAB` key smoke checks left focus on `body` for all 40 captures, so keyboard traversal is inconclusive in Round 01.
- Dark-mode screenshots were not captured because the Browser viewport capability does not expose color-scheme emulation. Current `prefers-color-scheme` values were recorded.
- Reduced-motion emulation was not captured because the Browser capability does not expose `prefers-reduced-motion` emulation. Current `matchMedia` values were recorded.

Follow-up: run dedicated keyboard, dark-mode, and reduced-motion verification in the first implementation verification round that touches each route.

## Known Risks

- `/tag/sample-id` is not a valid real tag and only captures the current invalid/missing-data state.
- Checkout cannot be fully validated without cart/session/payment state; `/store/checkout` redirects to `/store` in this baseline.
- Keyboard traversal, dark mode, and reduced-motion behavior require follow-up tooling or route-specific verification.
- This round captures problems but intentionally does not fix them.
- The repo has pre-existing dirty source/config files outside Round 01. Round 01 covers only the plan/control/evidence files; Round 02 must record a changed-files baseline before implementation.

## Final Review Result

QA, Product, Engineering, and Design all returned final `通过` with no remaining conditions.

Round 02 may proceed to brief creation. Round 02 implementation remains blocked until its own brief receives four-lead approval.
