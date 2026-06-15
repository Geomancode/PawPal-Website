# Diff Attribution: Round 07

Status: Approved by four leads
Date: 2026-06-11

This file attributes only differences between the Round 07 pre-implementation snapshots and the current source files. It does not use the full git diff as the source of truth because the working tree contains changes from earlier rounds.

## Files Changed Since Round 07 Snapshot

| File | Round 07 Reason | Boundary Result |
| --- | --- | --- |
| `src/app/globals.css` | Replace the final dark-mode reset with dark-mode page, panel, nav, footer, auth, tag, legal, checkout, and deep-route surface overrides. | Visual/CSS only. No route, data, API, package, config, env, deploy, CI, manifest, service worker, sitemap, robots, or metadata behavior. |
| `src/components/HomeClientParts.tsx` | Replace Framer `useReducedMotion()` with native `useSyncExternalStore`/`matchMedia`, remove hidden initial frames, and replace white surfaces with semantic PawPal tokens. | Visual/motion only. Home CTAs and hrefs remain unchanged. |
| `src/app/page.tsx` | Replace route-level `bg-white`/white gradient usage with `bg-paw-page` and `via-paw-panel`. | Visual token only. Route structure and CTAs unchanged. |
| `src/app/store/page.tsx` | Replace Framer `useReducedMotion()` with native reduced-motion store, remove hidden initial frames, and tokenise white surfaces. | Visual/motion only. Cart, product filtering, checkout href, admin/orders routes, and subscription checkout payload preserved. |
| `src/app/store/checkout/page.tsx` | Add native reduced-motion store and route step transitions through a reduced-motion-safe helper. | Visual/motion only. Checkout fetch URL, method, headers, item body, shipping body, and redirect behavior preserved. |
| `src/app/auth/page.tsx` | Remove page-level motion wrappers and animated banner wrappers that could render dim under reduced-motion/dark screenshots. | Visual/motion only. Auth form state, `handleSubmit`, `signIn`, `signUp`, and `/profile` redirects preserved. |
| `src/app/tag/[id]/TagPageClient.tsx` | Remove the page-level `motion.main` entrance wrapper that could capture a faded frame. | Visual/motion only. Pet/owner data display, contact href selection, deep link, and store fallback preserved. |

## Snapshotted Files Unchanged In Round 07

The following approved or conditional files were snapshotted and compared, but their source content did not change in Round 07:

- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/GlobeFullPage.tsx`
- `src/components/WeatherTicker.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/StatusMessage.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ProductCard.tsx`
- `src/components/ui/AppDeepLinkButton.tsx`
- `src/components/ui/NfcIdentityCard.tsx`

## Protected Behavior Confirmation

| Protected Area | Confirmation |
| --- | --- |
| Auth handlers | `handleSubmit`, `signIn`, `signUp`, login/signup state, email/password state, and `/profile` redirects are present and were not changed by the Round 07 diff. |
| Router destinations | Round 07 did not change Home CTA hrefs, Store checkout href, Store admin/orders destinations, checkout return-to-store route, tag app fallback, or tag store fallback. |
| Checkout fetch URL/method/body | `fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: ..., shipping }) })` is preserved. |
| Subscription checkout fetch URL/method/body | `fetch("/api/subscriptions/checkout", { method: "POST", ... body: JSON.stringify({ tier, userId, email, source }) })` is preserved. |
| Cart/order logic | `loadCart`, `saveCart`, `addToCart`, `updateQuantity`, and `removeItem` behavior is preserved. |
| Tag rescue data handling | Pet social traits, contact href selection (`mailto:` or `tel:`), contact icon selection, app deep link, and store fallback are preserved. |
| MapLibre behavior | `src/components/GlobeFullPage.tsx` did not change in Round 07; MapLibre initialization, raster source, layer, center, zoom, pitch, navigation control, markers, and geolocation behavior are preserved. |
| WeatherTicker fetch/parsing | `src/components/WeatherTicker.tsx` did not change in Round 07; Nominatim and Open-Meteo URLs, params, JSON parsing, and weather field mapping are preserved. |
| Package/config/deploy boundary | No package, lockfile, build-system, config, env, deploy, CI, manifest, service worker, sitemap, robots, or metadata file was changed by Round 07. |

## Validation Linkage

- Lint: PASS.
- Build: PASS.
- Primary Playwright route matrix: PASS 24/24.
- Smoke Playwright route matrix: PASS 20/20.
- Interaction/accessibility matrix: PASS 5/5.
- Relevant app logs: 0.
- Hydration logs: 0.
- Dark-emulation proof failures: 0.
