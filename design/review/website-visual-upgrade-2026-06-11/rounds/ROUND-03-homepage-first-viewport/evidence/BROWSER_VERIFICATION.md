# Browser Verification: Round 03 Homepage First Viewport

Date: 2026-06-11
Tooling: Browser/IAB
URL: `http://localhost:3000`

## Flow Under Test

`/` loads -> Homepage first viewport renders -> `Open Live Map` navigates to `/globe` -> `Shop Smart Tags` navigates to `/store`.

## Page Health

| Check | Result | Evidence |
| --- | --- | --- |
| Page identity | PASS | Title: `Pet Safety Map, Smart Tags, and Local Pet Community`. |
| Non-empty render | PASS | Browser `meaningfulText: true` across all four Homepage viewports. |
| Framework overlay | PASS | `hasVisibleFrameworkOverlay: false` across all four Homepage viewports and CTA target routes. |
| Console health | PASS | `newLogCount: 0` for Homepage viewport run and CTA interaction run. |
| Horizontal overflow | PASS | `horizontalOverflowPx: 0` across all four Homepage viewports. |
| Globe proof | PASS | Canvas node present; canvas visible in first viewport at all measured sizes. |
| CTA interaction | PASS | `Open Live Map` reached `/globe`; `Shop Smart Tags` reached `/store`. |

Note: Browser log API retained two historical messages from earlier browsing. Round 03 verification filters logs by the run start timestamp; no new warnings/errors occurred during the official Homepage or CTA runs.

## Responsive Measurements

| Viewport | H1 top | Open Live Map top | Shop Smart Tags top | Globe section top | Canvas top | Canvas visible height | Floating callouts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 390x844 | 181 | 553 | 613 | 697 | 714 | 130 | 0 |
| 768x1024 | 181 | 411 | 411 | 682 | 764 | 260 | 0 |
| 1280x720 | 242 | 536 | 536 | 222 | 258 | 462 | 1 |
| 1440x900 | 201 | 578 | 578 | 222 | 225 | 605 | 2 |

## CTA Route Evidence

| Action | Start top | Click point | Final URL | Final title | Overlay |
| --- | ---: | --- | --- | --- | --- |
| `Open Live Map` | 553 | `(191, 577)` | `http://localhost:3000/globe` | `Live Pet Globe \| PawPal` | 0 |
| `Shop Smart Tags` | 613 | `(191, 637)` | `http://localhost:3000/store` | `Store \| PawPal` | 0 |

## Keyboard And Focus Evidence

The two hero CTAs are native anchors:

| CTA | Tag | href | role override | tabIndex | Focus-visible class |
| --- | --- | --- | --- | --- | --- |
| `Open Live Map` | `A` | `/globe` | none | none | yes |
| `Shop Smart Tags` | `A` | `/store` | none | none | yes |

Global focus evidence:

- `src/app/globals.css` defines `:where(a, button, input, select, textarea):focus-visible`.
- Round 03 did not replace links with div/buttons or add positive tab order.

## Motion And Theme Evidence

- Touched Homepage Framer Motion surfaces now use `useReducedMotion` in `src/components/HomeClientParts.tsx`.
- `enterMotion` returns instant transitions when reduced motion is requested.
- Existing global CSS disables selected animations under `@media (prefers-reduced-motion: reduce)`.
- Browser could not force dark/reduced-motion media settings. Source audit found a later `@media (prefers-color-scheme: dark)` block in `src/app/globals.css` that forces light PawPal tokens and `color-scheme: light`; this preserves the current forced-light web presentation.

## Known Limits

- Browser could not directly sample WebGL/canvas pixels. The final evidence uses canvas DOM presence, first-viewport bounds, and screenshots.
- Historical Browser logs are retained by the runtime; official evidence uses timestamp-filtered `newLogCount`.
