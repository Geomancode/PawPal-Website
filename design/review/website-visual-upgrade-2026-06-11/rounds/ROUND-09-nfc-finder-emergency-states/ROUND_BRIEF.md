# Round 09 Brief: NFC Finder Emergency States

Status: Revised for four-lead approval
Date: 2026-06-11
Owner: Codex

## Goal

Make scanned PawPal tag pages faster to understand under stress. A finder who opens `/tag/[id]` should immediately see the pet, the safest next action, the owner's public-contact state, and critical care facts without fighting decorative layout, secondary marketing CTAs, or fragile wrapping.

## Approved Scope Requested

Primary runtime route:

- `/tag/[id]`

Runtime smoke route available without private data:

- `/tag/sample-id`, current not-found path for missing or invalid tag data.

Allowed implementation files:

- `src/app/tag/[id]/TagPageClient.tsx`
- `src/app/globals.css`, only for selectors scoped to the existing tag/finder page classes and only if Tailwind utility changes are not enough.

Conditional implementation files, requiring explicit evidence in final diff attribution:

- `src/app/tag/[id]/page.tsx`, only for route-local metadata wording or non-behavioral public-copy clarification. Supabase query shape, table names, filters, `notFound()` behavior, and owner/profile fetch behavior are not allowed to change.
- `src/app/not-found.tsx`, only if the missing-tag scan guidance must be clarified after QA confirms `/tag/sample-id` evidence is insufficient. Generic not-found behavior, navigation destinations, and global route behavior may not change.
- `src/components/ui/StatusMessage.tsx`, only if an existing accessible status primitive blocks the hidden-contact or urgent-guidance state.
- `src/components/ui/AppDeepLinkButton.tsx`, only if the existing primitive blocks tag page accessibility and shared smoke routes are added.

Any need to touch Navbar, Footer, other routes, package/config/env/deploy/PWA files, API routes, Supabase schema, Stripe, auth/session behavior, map, weather, database, service worker, sitemap, robots, manifest, or dependencies blocks implementation and requires amended four-lead approval.

## Non-Goals

- No fake public sample tag, committed demo route, hard-coded pet data, Supabase seed/migration, auth bypass, or production-data change.
- No change to tag lookup behavior, Supabase query semantics, owner privacy rules, deep-link scheme, or contact URL construction beyond presentation/accessibility.
- No emergency-response promise, 24/7 SLA, medical advice, legal guarantee, or stronger safety claim than the product can support.
- No new visual assets, new illustration system, decorative blobs, doodles, or broad shared-design refactor.
- No redesign of Store, Help, Auth, Profile, Globe, Home, About, Legal, Checkout, Orders, or global navigation.
- No package, dependency, build-system, deploy, CI, manifest, service worker, sitemap, robots, env, or config changes.

## Routes Affected

Primary evidence route:

- `/tag/[id]` valid finder page, if a valid local/public tag ID is available.

Required fallback/smoke route:

- `/tag/sample-id`, current missing-tag/not-found behavior.

Smoke routes if `globals.css` or shared primitives change:

- `/auth`
- `/store/checkout`
- `/help`

Smoke routes if `src/app/not-found.tsx` changes:

- `/tag/sample-id`
- `/definitely-missing-round-09`

## Primary User Scenario

A stranger scans a PawPal NFC or QR tag and needs to help a pet get home. They may be outside, anxious, on mobile, and short on time. The first viewport must prioritize the safe return action and the minimum trusted facts needed to act.

## Primary CTA / Conversion Path

Primary action when public contact exists:

- `Contact owner now`.

Primary state when public contact is hidden:

- A clear, calm hidden-contact status that explains the profile is available but direct contact is not public.

Secondary actions:

- Open this tag in PawPal.
- Get a PawPal tag.

Secondary actions must remain visually subordinate to rescue/contact guidance.

## First-Viewport Product Goal

At 390x844 and 1280x720, the valid `/tag/[id]` state must show:

- Scanned-tag/finder context.
- Pet identity with avatar or resilient no-avatar fallback.
- Primary contact CTA if `owner_contact` exists, or hidden-contact status if it does not.
- Privacy/safety framing that does not overpromise.
- At least the most critical pet facts: breed, age, blood/care status, or their explicit not-listed states.

At 390x844 and 1280x720, `/tag/sample-id` must remain a clear missing-tag recovery path with no framework overlay, no horizontal overflow, and no misleading fake-pet content.

## Trust / Safety States In Scope

- Contact visible: email and phone presentation remain accessible and tappable.
- Contact hidden: no dead CTA; visible status explains privacy state.
- Missing avatar: no broken image, stable fallback.
- Long pet name and long breed: no clipping, overflow, or unusable first viewport.
- No health tags or no social tags: empty sections do not collapse into ambiguity.
- Missing owner profile or missing owner display name: fallback owner label remains truthful.
- Blood type not listed and age not listed: explicit not-listed states remain readable.
- Mobile dark mode and reduced motion.
- Missing/invalid tag ID via `/tag/sample-id`.

## Real-Data Evidence Constraint

The current audit recorded that no valid local/public tag ID was available for visual testing. Round 09 must not solve that by changing production behavior or creating a public fake sample tag.

Evidence order:

1. Prefer a real valid local tag ID if one is already available through existing app data without changing auth, database, policies, or seeds.
2. If no valid tag ID is available, use source-diff evidence plus a non-committed test fixture or temporary harness only for screenshots of `TagPageClient` states. Any temporary harness must be removed before final source diff attribution and must not change production routes.
3. If neither real data nor a removable fixture is feasible, record a QA-owned blocker with a follow-up data-fixture round. This round may still improve source code only if all four leads accept the evidence limitation before implementation.

## Product Tradeoffs And Unresolved Risks

- Emergency-first hierarchy may reduce marketing emphasis on app downloads and tag shopping; this is acceptable only if rescue/contact clarity improves.
- Hidden-contact privacy must be clear without implying PawPal can reveal private owner information.
- Critical care details must be dense and useful without inventing medical certainty from missing data.
- Real valid-tag runtime evidence may remain blocked by absent local data; the round must not use fake production behavior to hide that gap.

## Risk Level

Medium.

The primary implementation file is route-local, but the route is trust-critical and has data-state complexity. Risk rises if `globals.css`, `page.tsx`, not-found handling, or shared primitives are touched.

## Required Evidence

- Pre-round snapshots for all approved and conditional files before source implementation.
- `DIFF_BASELINE.md` and `evidence/PRE_IMPLEMENTATION_BASELINE.md` must record current SHA-256 hashes and dirty/untracked state for all approved and conditional files.
- Final `DIFF_ATTRIBUTION.md` must attribute Round 09 changes only against the Round 09 snapshots, not against the full dirty working tree.
- Data availability note: valid tag ID found, fixture/harness used and removed, or blocker accepted.
- Before/after evidence for `/tag/sample-id` at 390x844, 768x1024, 1280x720, and 1440x900.
- Valid finder-state evidence for contact visible, contact hidden, missing avatar, long pet name/breed, no health tags, missing owner display name, and mobile dark mode. Use real route evidence if available; otherwise use the approved non-committed fixture/harness evidence.
- Valid finder-state responsive evidence must include 390x844, 768x1024, 1280x720, and 1440x900 for the contact-visible/default valid state. For each viewport, record URL or fixture entry point, meaningful render, framework-overlay status, console warn/error classification, hydration warning status, horizontal overflow status, dark proof, light/dark/reduced-motion coverage, and screenshot/JSON file names.
- Valid finder edge states must include at minimum 390x844 and 1280x720 for contact hidden, missing avatar, long pet name/breed, no health tags, and missing owner display name.
- If a non-committed fixture or temporary harness is used, final evidence must record the harness path, mechanism, state mapping, screenshot/JSON file names, and removal proof. Final diff attribution must prove no test harness, fake route, hard-coded tag data, seed/migration, auth bypass, Supabase policy/schema change, package/config change, or production behavior change remains.
- Light, dark, and reduced-motion evidence.
- Dark-mode runtime proof is mandatory. Final evidence must record `matchMedia('(prefers-color-scheme: dark)').matches`, computed `color-scheme`, body background, PawPal page token value, or an equivalent computed proof. Screenshots alone cannot satisfy dark-mode evidence.
- URL/title, meaningful render, no framework overlay, console warn/error classification, hydration warning status, horizontal overflow status.
- First-viewport matrix showing scanned-tag context, pet identity, contact/hidden-contact state, privacy note, and critical details visibility at 390x844 and 1280x720.
- Interaction checks:
  - Contact email link uses `mailto:` and is visible/focusable when contact is an email.
  - Contact phone link uses `tel:` and is visible/focusable when contact is a phone number.
  - Hidden-contact state has no misleading contact CTA.
  - `Open this tag in PawPal` remains focusable and retains existing fallback behavior.
  - `Get a PawPal tag` routes to `/store`.
  - Keyboard focus order reaches primary rescue/contact state before secondary marketing actions.
- Accessibility notes for headings, landmarks, link labels, focus states, image/fallback semantics, and status-message semantics.
- Product state matrix covering visible contact, hidden contact, no avatar, long text, missing health/social data, missing owner, and missing/invalid tag.
- Source-diff audit proving no protected product/data/API behavior changed.
- If `globals.css` changes, smoke routes `/auth`, `/store/checkout`, and `/help` must include URL/title, meaningful render, overlay status, console warn/error classification, hydration status, horizontal overflow status, light/dark/reduced-motion coverage, and screenshot/JSON evidence.
- If `StatusMessage.tsx` or `AppDeepLinkButton.tsx` changes, final evidence must include a shared primitive ownership/diff note and smoke coverage for actual consuming routes, at minimum `/tag/sample-id`, `/store/checkout`, and `/help`. Shared-primitive smoke must explicitly record URL/title, meaningful render, overlay status, console warn/error classification, hydration status, horizontal overflow status, light/dark/reduced-motion coverage, and screenshot/JSON file names.
- If `src/app/tag/[id]/page.tsx` changes, source-diff audit must explicitly prove Supabase query shape/table/filter, `notFound()` behavior, owner/profile fetch behavior, tag lookup/privacy behavior, and contact construction behavior did not change.
- `npm run lint`.
- `npm run build`.

## Acceptance Criteria

- Valid tag first viewport is emergency-first, not a decorative or marketing-led page.
- Primary contact/hidden-contact state is visible, understandable, keyboard reachable, and visually dominant.
- Critical pet facts are dense, readable, and honest about missing data.
- Secondary app/store CTAs are still available but clearly subordinate.
- No horizontal overflow at 390x844, 768x1024, 1280x720, or 1440x900.
- No relevant app console warnings/errors or hydration warnings after implementation.
- Dark mode remains readable for rescue panel, detail rows, status states, and secondary actions.
- No protected product/data/API/build/deploy boundary changes.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
