# PetCompass V2 Website QA

Date: 2026-06-27
Branch: ui/petcompass-v2-website
Scope: Next.js website visual and UX upgrade only.

## Surfaces Covered

- Home page
- Public Pet Profile / NFC tag profile
- Store page
- Checkout
- Order Success / pairing handoff
- Globe / map-related public experience
- Account/Profile web fallback and Auth fallback

## Validation

- PASS `npm.cmd run lint`
- PASS `npm.cmd run test:home-contract`
- PASS `npm.cmd run build`
- PASS `git diff --check`
- PASS browser smoke for `/`, `/store`, `/store/success`, `/globe`, `/auth`, `/tag/nonexistent-petcompass-qa`
- NOTE `/store/checkout` redirects to `/store` with an empty cart; checkout screenshots were captured with a local Playwright-only seeded cart.
- NOTE `/profile` redirects to `/auth` while logged out; authenticated profile requires a signed-in manual pass.

## Guardrails

- No API files were changed.
- No Stripe webhook or checkout API behavior was changed.
- No NFC route semantics were changed.
- No map data fetching contract was changed.
- Visual states avoid implying smart tag verification, live location, lost status, or pairing unless data is present.

