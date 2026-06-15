# Browser Verification: Round 02 Store First Viewport

Date: 2026-06-11
Owner: Codex
Browser path: Build Web Apps Browser plugin, in-app browser
Target URL: `http://localhost:3000/store`

## Flow Under Test

The flow under test is: `/store` -> search/category/product actions -> product details, add-to-cart, cart drawer, and checkout route remain usable while Store product discovery appears earlier in the first viewport.

## Final Viewport Measurements

Source: `design/assets/review/website-visual-upgrade-2026-06-11/round-02-store-first-viewport/store-after-measurements.json`

| Viewport | Search top | Filter label top | First category top | Product card top | Details top | Add top | Console new logs | Overlay | Overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 390x844 | 344 | 513 | 541 | 619 | 1007 | 1007 | 0 | No | No |
| 768x1024 | 302 | 497 | 525 | 661 | 1050 | 1050 | 0 | No | No |
| 1280x720 | 313 | 488 | 516 | 602 | 955 | 955 | 0 | No | No |
| 1440x900 | 313 | 488 | 516 | 602 | 955 | 955 | 0 | No | No |

## Baseline Comparison

Round 01 baseline at 390x844:

- Search top: `517`
- Category filters top: `1037`
- First Add top: `1647`

Round 02 final at 390x844:

- Search top: `344` (`-173`)
- First category chip top: `541` (`-496` against category baseline)
- First product card top: `619`
- First Add top: `1007` (`-640`)

Round 01 desktop baseline at 1280x720:

- Search top: `427`
- Category top: `725`
- Product row not visible in first viewport.

Round 02 final at 1280x720:

- Search top: `313`
- First category chip top: `516`
- First product card top: `602`, visible inside the 720px viewport.

## Interaction Results

Source: `design/assets/review/website-visual-upgrade-2026-06-11/round-02-store-first-viewport/store-interaction-results.json`

| Interaction | Result | Evidence |
| --- | --- | --- |
| Search | PASS | Search input count `1`; entering `tag` changed product count from `4 products` to `1 product`. |
| Category filter | PASS | `Food & Treats` button count `1`; selecting it changed visible result count to `0 products`; resetting `All Products` restored `4 products`. |
| Details drawer | PASS | First `Details` opened a dialog with `PawPal Smart ID Tag` details; close button count `1`; close returned dialog to `null`. |
| Add to cart | PASS | First `Add` changed cart text to `Cart (1)` and made checkout link visible. |
| Cart drawer | PASS | Cart drawer showed item, subtotal, shipping, total, and `Proceed to Checkout`; proceed button count `1`. |
| Orders route | PASS | `/store/orders` rendered with content and stayed on `/store/orders`. |
| Checkout route | PASS | With cart state present, `/store/checkout` rendered checkout content and stayed on `/store/checkout`. |

## Console And Overlay

- Final clean viewport capture: `newLogCount: 0`.
- Final clean interaction capture: `logs: []`.
- Blocking framework overlay: not present.
- Horizontal overflow: not present across all final viewports.

## Accessibility And Media Notes

- Keyboard/focus static evidence passed: search input, first category button, Cart, Details, and Add all have `tabIndex: 0`, are not disabled, and global `focus-visible` CSS is present.
- Browser CUA Tab key did not advance `document.activeElement` in this environment. This is recorded as a Browser tooling limitation in `store-interaction-results.json`; static focusability and focus-ring evidence were used instead.
- Reduced-motion support was added in `src/app/store/page.tsx` through `useReducedMotion` for Store Framer Motion entry, layout, hover, tap, floating-cart, toast, product-card, subscription-card, and cart-item animations. Global CSS also contains `prefers-reduced-motion`.
- The Browser viewport capability does not expose media emulation for `prefers-reduced-motion` or `prefers-color-scheme`; runtime media query values were `false` in the current environment.
- Dark-scheme source audit found project-level `prefers-color-scheme` CSS, including a later block that forces light tokens under dark scheme. No Store-specific dark-mode code was added in this round.

