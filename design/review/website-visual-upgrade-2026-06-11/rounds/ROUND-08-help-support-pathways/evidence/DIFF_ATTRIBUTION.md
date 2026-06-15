# Diff Attribution: Round 08

Status: Approved by four leads
Date: 2026-06-11

This file attributes only differences between the Round 08 pre-implementation snapshots and the current source files.

## Files Changed Since Round 08 Snapshot

| File | Round 08 Reason | Boundary Result |
| --- | --- | --- |
| `src/app/help/page.tsx` | Reframe Help as support-routing, add Store/order lane, make route panel more task-led, add explicit next-step links, and tighten privacy-conscious support context copy. | Static route visual/content hierarchy only. Existing `mailto:hello@pawpal.be`, `/globe`, and `/store` destinations are used. No backend, data, auth, payment, map, weather, package, config, deploy, PWA, metadata, or shared primitive behavior changed. |

## Snapshotted Files Unchanged In Round 08

- `src/app/globals.css`
- `src/app/help/layout.tsx`
- `src/components/ui/StatusMessage.tsx`
- `src/components/ui/AppDeepLinkButton.tsx`

Because these files did not change, the conditional global-CSS smoke requirement and shared-primitive consumer smoke requirement were not triggered.

## Protected Behavior Confirmation

| Protected Area | Confirmation |
| --- | --- |
| Support email | Existing `mailto:hello@pawpal.be` remains the support contact target. |
| Route destinations | Round 08 uses existing `/globe` and `/store` routes only. |
| Metadata | `src/app/help/layout.tsx` did not change. |
| Shared primitives | `StatusMessage.tsx` and `AppDeepLinkButton.tsx` did not change. |
| Global CSS | `globals.css` did not change. |
| Product/data/API boundaries | No auth, Supabase, Stripe, API, payment, cart, order, profile, tag data, map, weather, geolocation, database, env, deploy, CI, manifest, service worker, sitemap, robots, package, or dependency file changed. |

## Validation Linkage

- Lint: PASS.
- Build: PASS.
- Help after matrix: PASS 8/8.
- Interaction/accessibility matrix: PASS 6/6.
- Relevant app logs: 0.
- Hydration logs: 0.
- Dark proof failures: 0.
- First-viewport failures: 0.
