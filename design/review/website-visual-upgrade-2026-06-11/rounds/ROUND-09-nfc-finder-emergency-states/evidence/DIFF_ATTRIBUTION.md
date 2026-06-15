# Diff Attribution: Round 09 NFC Finder Emergency States

Status: Complete
Date: 2026-06-11

## Baseline Method

Diff attribution compares current files against the Round 09 snapshots in `evidence/snapshots/`, not against the full dirty working tree.

## Hashes

| File | Baseline SHA-256 | Current SHA-256 | Round 09 status |
| --- | --- | --- | --- |
| `src/app/tag/[id]/TagPageClient.tsx` | `91abf9870bf2ae80e2c073b2a9d9b543ad3c7f2cd8d2be444da8083df21ec054` | `edc73080756b44065a517af627c028c60712d28a2c90fc031d21865138c9a53e` | Changed |
| `src/app/globals.css` | `0602ca8f2335e34f4ec531a9e54f4072cbce5d2a866938aeb2b18c75ce18840a` | `afa53dca548372707a67f52d75ce4d04b80e3cd0c59e1e25ba7af118c06936bd` | Changed |
| `src/app/tag/[id]/page.tsx` | `3a279d70d8f045f400636c867a8cf8c48c024124a596a59677f2c1daa864088c` | `914f8eb152b5a540da6cd8435627ad2be00db687f3a1bbaa4cf58cda3baa2c9b` | Changed |
| `src/app/not-found.tsx` | `e89e77941b437aba6a0cdd959dd62585e3d3477538e70bf74779e662bbbd4755` | `e89e77941b437aba6a0cdd959dd62585e3d3477538e70bf74779e662bbbd4755` | Unchanged |
| `src/components/ui/StatusMessage.tsx` | `c1928f79f24aab42b5e660ddf054753f622f0af70d0ddba8c8d8c7ca47b7a736` | `c1928f79f24aab42b5e660ddf054753f622f0af70d0ddba8c8d8c7ca47b7a736` | Unchanged |
| `src/components/ui/AppDeepLinkButton.tsx` | `2636049f455fa3a6858a4ae39232e6aa23efc4ec98008f1ee5857e734ca67406` | `2636049f455fa3a6858a4ae39232e6aa23efc4ec98008f1ee5857e734ca67406` | Unchanged |

## Source Change Attribution

`src/app/tag/[id]/TagPageClient.tsx`:

- Removed `PetDoodles` decorations.
- Reframed the rescue panel as scanned-tag context plus pet identity.
- Kept `Contact owner now` as the primary contact CTA when `owner_contact` exists.
- Kept hidden-contact state via existing `StatusMessage`.
- Added quick facts for breed, age, blood, and care to the rescue first viewport.
- Added explicit empty states for health, personality, and achievements.
- Preserved `mailto:`, `tel:`, `pawpal://tag/${pet.id}`, and `/store` destinations.

`src/app/globals.css`:

- Adjusted only existing `.tag-rescue-panel`, `.tag-detail-card`, `.tag-info-tile`, and `.tag-chip` rules.
- Reduced mobile rescue-panel minimum height.
- Added desktop-only rescue-panel min-height.
- Added tag chip max-width and wrapping.
- No global token, navbar, auth, store, checkout, help, map, weather, service worker, manifest, robots, sitemap, package, or dependency changes.

`src/app/tag/[id]/page.tsx`:

- Changed only missing-tag `generateMetadata()` fallback.
- The Supabase query table, selected fields, filters, and `.maybeSingle()` calls are unchanged.
- The owner/profile fetch table, selected fields, filter, and `.maybeSingle()` call are unchanged.
- The actual `TagPage()` route still calls `notFound()` when `loadTagPet(id)` returns null.
- Contact construction remains exclusively in `TagPageClient` and was not moved into data loading.
- Privacy and tag lookup behavior are unchanged.

## Protected Boundary Audit

No changes to:

- Supabase schema, policies, migrations, or seeds.
- Auth/session behavior.
- Stripe/payment/cart/order logic.
- API routes.
- Map, weather, geolocation, or globe logic.
- Package files, lockfiles, dependency versions, build config, env, CI, deploy, manifest, service worker, sitemap, or robots.
- Shared primitives `StatusMessage` and `AppDeepLinkButton`.

## Temporary Harness Removal Proof

Final `find src/app -path '*round09*' -print` returned no output.

Final `npm run build` route table contains `/tag/[id]` and does not contain `round09-fixture` or `__round09-tag-fixture`.
