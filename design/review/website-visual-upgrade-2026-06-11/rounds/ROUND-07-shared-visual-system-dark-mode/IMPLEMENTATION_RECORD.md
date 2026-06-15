# Round 07 Implementation Record: Shared Visual System And Dark Mode Hardening

Status: Complete, four-lead approved
Date: 2026-06-11
Owner: Codex

## Summary

Round 07 implementation is complete within the approved scope. The work hardened dark-mode surfaces, removed reduced-motion warning sources from affected motion surfaces, and stabilized first-render opacity for the primary visual routes without changing product, data, auth, checkout, map, weather, deployment, package, or config behavior.

## Changes Made

- Replaced the final dark-mode reset in `src/app/globals.css` with actual dark-mode surface, navigation, footer, auth, tag, legal, store, checkout, and deep-route overrides.
- Replaced Framer `useReducedMotion()` calls in `src/components/HomeClientParts.tsx` and `src/app/store/page.tsx` with a native `matchMedia("(prefers-reduced-motion: reduce)")` store via `useSyncExternalStore`.
- Added the same reduced-motion store to `src/app/store/checkout/page.tsx` and routed checkout step transitions through a reduced-motion-safe helper.
- Changed reduced-motion-sensitive motion surfaces on Home, Store, and Checkout to avoid hidden/low-opacity initial frames during reduced-motion capture.
- Replaced several route-level `bg-white`, `from-white`, and `via-white` surfaces with semantic PawPal panel/page tokens on Home and Store.
- Removed page-level entry motion wrappers from `src/app/auth/page.tsx` and `src/app/tag/[id]/TagPageClient.tsx` so dark/reduced-motion screenshots do not capture the routes in a faded entrance state.

## Evidence Location

- `ROUND_BRIEF.md`
- `DIFF_BASELINE.md`
- `evidence/PRE_IMPLEMENTATION_BASELINE.md`
- `FINAL_REVIEW_PACKET.md`
- `evidence/FINAL_EVIDENCE_SUMMARY.md`
- `evidence/SCREENSHOT_INDEX.md`
- `evidence/ACCESSIBILITY_FOCUS_MATRIX.md`
- `evidence/PRODUCT_ROUTE_PRESERVATION_MATRIX.md`
- `evidence/DIFF_ATTRIBUTION.md`
- Pre-round file snapshots in `evidence/`
- Baseline and after-validation JSON/screenshots in `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/`

## Commands

- `npm run lint` - PASS
- `npm run build` - PASS
- Browser path was attempted first per Build Web Apps workflow; fallback to Playwright was used after Browser evidence write/interaction instability and explicit user permission.
- Playwright primary light/dark/reduced-motion matrix - PASS 24/24.
- Playwright smoke light/dark/reduced-motion matrix - PASS 20/20.
- Playwright interaction/accessibility matrix - PASS 5/5.

## Baseline Notes

- Browser light-mode baseline: 12/12 PASS, current relevant logs 0.
- Playwright light/dark screenshot baseline: 15/24 PASS, 9 failures from app warnings/errors.
- Visual dark-mode ambiguity was observed on Home, Store, Auth, and Checkout screenshots.

## Final Review Result

Approved by QA, Product, Engineering, and Design. Round 07 is complete. Round 08 may be briefed, but implementation remains blocked until a new four-lead brief approval is recorded.
