# Round 02 Implementation Record: Store First Viewport

Status: Approved
Date: 2026-06-11
Owner: Codex

## Summary

Round 02 compacted `/store` from a landing-style hero into a commerce-first product discovery surface. Search, trust proof, category filters, product count, cart access, and the first product card now appear substantially earlier on mobile and desktop without touching checkout, orders, store data, APIs, dependencies, or shared UI components.

## Changes Made

- Replaced the tall Store hero with a compact commerce header.
- Removed Store-only decorative doodles and the large `PawPal Shop` pill from the first viewport.
- Added category Lucide icons and compact trust-proof data in `src/app/store/page.tsx`.
- Converted trust proof into a compact mobile strip while retaining desktop copy.
- Converted mobile category filters into a horizontal chip row.
- Reduced product-grid spacing and moved product count/cart/order controls upward.
- Replaced the empty floating cart button with an inline Cart affordance; floating checkout appears only after cart content exists.
- Added `useReducedMotion` handling for Store Framer Motion entry/layout/hover/tap/toast/cart animations.
- Preserved product data, catalog fallback, details drawer, cart drawer, orders route, checkout route, and subscription upgrade behavior.

## Evidence Location

- `evidence/COMMAND_RESULTS.md`
- `evidence/BROWSER_VERIFICATION.md`
- `evidence/SCREENSHOT_INDEX.md`
- `evidence/DIFF_ATTRIBUTION.md`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-02-store-first-viewport/`

## Commands

- `npm run lint`: PASS
- `npm run build`: PASS
- `npm run dev`: running at `http://localhost:3000`

## Browser Runtime Notes

- Browser plugin used for final verification.
- Final viewport capture `newLogCount: 0`.
- Final interaction capture `logs: []`.
- No blocking framework overlay detected.
- No horizontal overflow detected across 390x844, 768x1024, 1280x720, and 1440x900.
- The dev server was restarted once to clear a stale hot-update hydration mismatch from an intermediate pass.

## Accessibility Notes

- Store Framer Motion animations now respect `useReducedMotion`.
- Global `prefers-reduced-motion` CSS exists.
- Global `focus-visible` CSS exists.
- Browser CUA Tab key did not advance `document.activeElement`; static keyboard evidence confirms primary controls are focusable and enabled.
- Browser viewport capability did not expose dark/reduced-motion media emulation. Runtime media query values were recorded; source audit evidence is included in `BROWSER_VERIFICATION.md`.

## Known Risks

- Existing dirty worktree recorded in `DIFF_BASELINE.md`.
- Implementation is expected to touch `src/app/store/page.tsx`; this file already had pre-existing modifications before Round 02.
- Dark-mode runtime could not be forced in the Browser environment; project-level CSS currently forces light tokens in a later dark-scheme media block.
- Mobile category chips use horizontal scrolling to keep product cards in the first viewport.

## Final Review Result

Approved by all four leads:

- QA / Linnaeus: 通过
- Product / Plato: 通过
- Engineering / McClintock: 通过
- Design / Laplace: 通过
