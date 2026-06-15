# Round 01 Baseline Report

Date: 2026-06-11
Status: Complete
Base URL: `http://localhost:3000`

## Summary

Round 01 captured the current rendered baseline before visual implementation work.

- Routes checked: 10
- Viewports per route: 4
- Official screenshots: 40
- Console warnings/errors captured by Browser dev logs: 0
- Horizontal overflow detected: 0 routes/viewports
- Source implementation changes: none

## Evidence Location

Screenshots and raw JSON:

`design/assets/review/website-visual-upgrade-2026-06-11/round-01-baseline/`

Human-readable evidence:

- `COMMAND_RESULTS.md`
- `SCREENSHOT_INDEX.md`
- `BASELINE_REPORT.md`
- `ROUTE_DESIGN_SUMMARY.md`

## Key Baseline Findings

| Area | Baseline observation | Upgrade implication |
| --- | --- | --- |
| Home mobile | H1 starts at `top: 201`; `Open Live Map` starts at `top: 803`; `Shop Smart Tags` starts at `top: 863`; globe canvas starts at `top: 1284`. | Homepage mobile still fails the desired first-viewport product proof target. |
| Home desktop | Globe canvas is visible in the first viewport at `top: 258`, size `538x538`. | Desktop hero has useful product proof, but mobile composition needs priority. |
| Store mobile | Search starts at `top: 517`; category filters start at `top: 1037`; first visible `Add` action starts at `top: 1647`. | Store product discovery and purchase actions are far below the first viewport. |
| Store desktop | Search starts at `top: 427`; category filters start at `top: 725`, just below a 720px viewport; first product action was not visible in the first viewport sample. | Store desktop also needs a more compact commerce header. |
| Globe desktop | Map is visible and dominant, but nav, weather strip, nearby panel, layer buttons, and map controls compete in the same first viewport. | Future Globe round should preserve map dominance while reducing HUD competition. |
| Profile | `/profile` redirects to `http://localhost:3000/auth` when signed out. | Signed-out redirect works and should remain visually non-blank after auth/profile changes. |
| Checkout | `/store/checkout` redirects to `http://localhost:3000/store` in this empty-session baseline. | Checkout path needs later state-specific verification with cart/session data. |
| Orders | `/store/orders` renders an empty orders state with `Browse Products` at mobile `top: 725`. | Empty commerce state has a next step; visual density can be reviewed later. |
| Success | `/store/success` renders `We could not verify this payment` with `Back to Store`. | Missing session state is clear and recoverable. |
| Tag sample | `/tag/sample-id` renders the branded not-found route; `Back home` and `Shop smart tags` appear in the first mobile viewport. | Invalid/missing tag state is calm, but real valid-tag rescue states still need sample data. |

## Route State Table

| Requested route | Final URL at 390 | Page title | Route character | Notes |
| --- | --- | --- | --- | --- |
| `/` | `/` | `Pet Safety Map, Smart Tags, and Local Pet Community` | Marketing/editorial | Mobile product visual is below first viewport. |
| `/store` | `/store` | `Store | PawPal` | Commerce | Product discovery starts too low. |
| `/globe` | `/globe` | `Live Pet Globe | PawPal` | Tool/map | Map renders; HUD density is visually high. |
| `/auth` | `/auth` | `PawPal | Pet Safety Map, Smart Tags, and Local Pet Community` | Trust/safety account | Form route renders non-empty. |
| `/profile` | `/auth` | `PawPal | Pet Safety Map, Smart Tags, and Local Pet Community` | Trust/safety account | Signed-out redirect confirmed. |
| `/about` | `/about` | `About | PawPal` | Marketing/editorial | No runtime blocker captured. |
| `/tag/sample-id` | `/tag/sample-id` | `PawPal | Pet Safety Map, Smart Tags, and Local Pet Community` | Trust/safety rescue | Invalid sample route renders not-found state. |
| `/store/checkout` | `/store` | `Store | PawPal` | Commerce checkout | Empty-session checkout redirects to store. |
| `/store/orders` | `/store/orders` | `Store | PawPal` | Commerce account/orders | Empty orders state renders with next step. |
| `/store/success` | `/store/success` | `Store | PawPal` | Commerce confirmation | Missing session state renders recoverable message. |

## Console And Runtime

Browser dev logs captured no `warn`, `warning`, or `error` entries during the baseline route sweeps.

Overlay field note:

- `baseline-results.json` records `blockingOverlay: true` for all 40 captures because the detector matched an empty `nextjs-portal` element.
- `overlayText` is empty for all 40 captures.
- Screenshots show no visible blocking framework overlay.
- Console warn/error count is 0.
- Round 01 therefore treats this as a detector false positive, not an actual blocking overlay.

No horizontal overflow was detected at 390, 768, 1280, or 1440 for the captured route set.

## Accessibility And Tooling Limits

Keyboard focus:

- Visible focusable controls were enumerated in `baseline-results.json`.
- Browser `TAB` key smoke checks left focus on `body` for all 40 captures, so keyboard traversal is marked inconclusive in Round 01.
- Follow-up: run a dedicated keyboard QA pass in the first implementation verification round that touches each route.

Dark mode:

- The Browser viewport capability used in this round does not expose color-scheme emulation.
- Current `prefers-color-scheme` values were recorded in `baseline-results.json`.
- No separate dark-mode screenshots were captured in Round 01.
- Follow-up: capture dark-mode screenshots in the first implementation verification round that touches each route.

Reduced motion:

- The Browser capability used in this round does not expose `prefers-reduced-motion` emulation.
- Current `matchMedia('(prefers-reduced-motion: reduce)')` values were recorded in `baseline-results.json`.
- No separate reduced-motion behavior emulation was captured in Round 01.
- Follow-up: verify reduced-motion behavior in the first implementation verification round that touches each route.

## Boundaries

This round changed only documentation and evidence files.

Untouched:

- Source UI implementation
- CSS/components
- Dependencies/packages
- Build system/config
- Environment variables
- API/database
- Auth/payment
- Stripe/Supabase
- CI/deployment

## Worktree Baseline Note

The repository already had dirty source/config files outside Round 01 before this evidence package was finalized. Round 01 acceptance covers only the newly created/updated planning and evidence artifacts:

- `WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md`
- `design/review/website-visual-upgrade-2026-06-11/`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-01-baseline/`

Round 02 must start by recording a changed-files/diff baseline so existing unrelated worktree changes are not attributed to the next implementation round.
