# Diff Attribution

## New File

- `src/components/Navbar.module.css`

## Source Files Changed

- `src/components/Navbar.tsx`
  - Added CSS module import.
  - Replaced active global nav class hooks with module class references.
  - Preserved nav link data, auth logic, dropdown behavior, mobile menu behavior, route checks, and reduced-motion logic.

- `src/app/globals.css`
  - Removed active Navbar-owned selectors that moved to `Navbar.module.css`.
  - Removed unused legacy `.nav-account-*` selectors.
  - No remaining `site-nav`, `nav-link-pill`, `nav-mobile-panel`, or `nav-account` selectors are found under `src/`.

- `src/components/PwaRuntime.tsx`
  - Fixed discovered mobile overflow by changing the fixed banner container from `inset-x-4 mx-auto max-w-xl` to centered `left-1/2 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2`.
  - No PWA install/update/offline logic changed.

## Read-Only Boundary

Hashes were recorded for protected files. These remained unchanged in this round:

- `src/components/PawPalLogo.tsx`
- `src/components/Footer.tsx`
- `src/components/Footer.module.css`
- `src/lib/site.ts`

## Selector Search

`rg -n "site-nav|nav-link-pill|nav-mobile-panel|nav-account" src` returns no matches after extraction because active selectors now use CSS-module local names.
