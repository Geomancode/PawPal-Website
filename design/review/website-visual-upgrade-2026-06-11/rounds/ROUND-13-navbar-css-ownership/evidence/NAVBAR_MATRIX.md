# Navbar Runtime Matrix

Source: `round13_nav_results.json`

## Routes And Viewports

Routes checked:

- `/`
- `/store`
- `/help`
- `/auth`
- `/globe`

Viewports checked:

- `390x844`
- `768x1024`
- `1280x720`
- `1440x900`

Result: 20/20 PASS for non-empty render, no framework overlay, no horizontal overflow, nav rendered, and no page errors.

## Globe Compact Nav

`/globe` compact nav passed at all four viewport sizes.

- `390x844`: top 12, left 12, width 366, height 50.
- `768x1024`: top 12, left 16, width 736, height 58.
- `1280x720`: top 12, left 16, width 1248, height 58.
- `1440x900`: top 12, left 16, width 1408, height 58.

Headless Chrome reports WebGL context creation errors on `/globe`; this affects the map canvas/fallback path, not the compact Navbar placement. Follow-up: Round 14.

## Mobile Menu

Result: PASS.

- Panel rendered: yes.
- Close button visible: yes.
- Links: Home `/`, Globe `/globe`, About Us `/about`, Store `/store`, Login `/auth`.
- Visible menu link heights: 44-48px.
- Close returns to open button state.

## Focus

Result: PASS.

- Keyboard focus reached the PawPal home link.
- Focus outline: solid, 3px, `rgba(74, 144, 217, 0.34)`.
- Screenshot: `screenshots/nav-home-1280x720-focus-keyboard.png`.

## Dark And Reduced Motion

Dark-mode media emulation:

- `/`: dark media matched, no overflow, nav rendered.
- `/globe`: dark media matched, no overflow, compact nav rendered.

Reduced-motion media emulation:

- `/`: reduced-motion media matched, no overflow.
- `/globe`: reduced-motion media matched, no overflow.
