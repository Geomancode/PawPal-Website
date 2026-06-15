# Round 10 Brief: Profile Task Readiness

Status: Revised for four-lead approval
Date: 2026-06-11
Owner: Codex

## Goal

Make `/profile` feel like a task-focused owner workspace instead of another decorative marketing profile page. A signed-in owner should quickly understand account status, pet safety readiness, app install state, and the next useful action without losing existing edit, install, add-pet, or tag-page behavior.

## Approved Scope Requested

Primary runtime route:

- `/profile`

Unauthenticated redirect smoke route:

- `/profile -> /auth`

Allowed implementation files:

- `src/app/profile/page.tsx`
- `src/app/globals.css`, only for selectors scoped to existing or new profile-only classes and only if route-local Tailwind utility changes are not enough.

Conditional implementation files, requiring explicit evidence in final diff attribution:

- `src/components/ui/StatusMessage.tsx`, only if an existing accessible status primitive blocks route-local profile error or empty states.
- `src/components/ui/Button.tsx`, only if current shared button behavior blocks accessible profile actions and shared smoke routes are added.
- `src/components/ui/Input.tsx`, only if current shared input behavior blocks accessible profile edit/add-pet fields and shared smoke routes are added.

Any need to touch AuthProvider, Supabase client setup, database schema, profile or pet query semantics, auth/session behavior, store, checkout, map, weather, API routes, package/config/env/deploy/PWA files, service worker, sitemap, robots, manifest, dependencies, Navbar, Footer, or public profile routes blocks implementation and requires amended four-lead approval.

## Non-Goals

- No database, Supabase schema, RLS, seed, migration, policy, API, auth/session, payment, map, weather, package, dependency, build-system, deploy, CI, manifest, service worker, sitemap, robots, env, or config changes.
- No redesign of `/auth`, `/tag/[id]`, `/store`, `/globe`, Home, About, Help, Legal, Checkout, Orders, public user/pet/group/post routes, Navbar, or Footer.
- No new feature promise such as veterinary verification, emergency dispatch, medical advice, 24/7 support, automatic NFC provisioning, or guaranteed data recovery.
- No change to profile creation, pet creation, profile save, PWA install prompt handling, tag-page link destinations, or owner-contact persistence semantics.
- No fake signed-in production account, committed auth bypass, local storage spoof in source, or demo data committed to app routes.
- No broad design-system refactor or global CSS cleanup outside profile-scoped selectors.

## Routes Affected

Primary evidence route:

- `/profile` signed-in state, if an existing local authenticated session is available.

Required fallback/smoke routes:

- `/profile` signed-out redirect to `/auth`.
- `/auth` after redirect.

Smoke routes if `globals.css` changes:

- `/auth`
- `/tag/sample-id`
- `/store/checkout`

Smoke routes if shared UI primitives change:

- `/auth`
- `/help`
- `/store/checkout`
- `/tag/sample-id`

## Primary User Scenario

An owner signs in and visits `/profile` to manage their PawPal account, pets, app install readiness, and NFC/finder preparedness. They may be checking what is missing before putting a tag on a pet, adding a first pet, or editing contact/profile context.

## Primary CTA / Conversion Path

Primary action when the owner has pets:

- `Add Pet` remains available but should not obscure the status/readiness overview.

Primary action when the owner has no pets:

- A clear empty-state action to add the first pet.

Secondary actions:

- `Edit Profile`.
- `Install PawPal`.
- Per-pet public tag page link.

Secondary actions must remain accessible and visually subordinate to the owner workspace/readiness hierarchy.

## First-Viewport Product Goal

At 390x844 and 1280x720, the signed-in `/profile` state should show:

- Owner identity or truthful fallback.
- Account trust/status summary.
- Pet count/readiness summary.
- Install state or install action.
- A visible path to add or manage pets.
- Clear separation between owner details, pet safety readiness, and pet records.

At 390x844 and 1280x720, signed-out `/profile` must redirect to `/auth` without a blank-looking screen, framework overlay, or horizontal overflow.

## Trust / Safety States In Scope

- Loading state.
- Profile unavailable/error state.
- Signed-out redirect.
- No pets.
- One or more pets.
- Pet with NFC tag.
- Pet without NFC tag.
- Missing pet avatar.
- Long owner display name, long username, long pet name, long breed/contact strings.
- Profile edit mode.
- Add-pet form open.
- Add-pet form validation for missing pet name.
- Install available, install unavailable, installed, and install-status message where browser support allows.
- Mobile dark mode and reduced motion.

## Evidence Constraint

Round 10 must not create a committed fake account, auth bypass, or production demo route. Evidence order:

1. Prefer an existing local authenticated browser session if available without changing source, database, policies, or seeds.
2. If no signed-in session is available, use signed-out `/profile -> /auth` evidence plus source-diff evidence for signed-in layout changes.
3. If profile states require rendered validation and no real session is available, use a temporary non-committed route-local harness for screenshots of the profile client states only after Engineering and QA accept the mechanism. Before any harness is created, the implementer must record a harness request describing path, mechanism, state mapping, expected screenshots/JSON, removal plan, and protected-boundary proof. The harness must be removed before final diff attribution.
4. If none of the above is feasible, record a QA-owned blocker and do not claim signed-in runtime coverage.

## Product Tradeoffs And Unresolved Risks

- Making the profile more task-oriented may reduce decorative brand warmth; this is acceptable if account/pet readiness becomes clearer.
- The route currently mixes owner identity, gamified trust/paw points, install prompt, and pet management. This round should clarify priority without inventing backend readiness fields.
- Signed-in runtime evidence may be limited by local auth availability. The round must be honest about evidence gaps.
- The PWA install prompt is browser-dependent, so install-state evidence may need DOM/state and manual notes rather than a fully reproducible browser prompt.

## Risk Level

Medium.

The primary implementation file is route-local, but `/profile` owns authenticated account and pet creation behavior. Risk rises if `globals.css`, shared UI primitives, auth redirects, Supabase writes, or PWA install handling are touched.

## Required Evidence

- Pre-round snapshots for all approved and conditional files before source implementation.
- `DIFF_BASELINE.md` and `evidence/PRE_IMPLEMENTATION_BASELINE.md` must record current SHA-256 hashes and dirty/untracked state for all approved and conditional files.
- Final `DIFF_ATTRIBUTION.md` must attribute Round 10 changes only against the Round 10 snapshots, not against the full dirty working tree.
- Auth availability note: existing signed-in session used, temporary harness used and removed, or signed-in runtime blocker accepted.
- Before/after evidence for `/profile` signed-out redirect to `/auth` at 390x844, 768x1024, 1280x720, and 1440x900.
- Signed-in profile state evidence if a valid authenticated session or approved temporary harness is available.
- Signed-in or harness responsive evidence must include 390x844, 768x1024, 1280x720, and 1440x900 for the default owner workspace state. For each viewport, record URL or harness entry point, meaningful render, framework-overlay status, console warn/error classification, hydration warning status, horizontal overflow status, dark proof, light/dark/reduced-motion coverage, and screenshot/JSON file names.
- State evidence for no pets, pets with/without NFC, profile edit mode, add-pet form open, long strings, missing avatars, and install status where feasible.
- If a temporary harness is used, final evidence must record harness path, mechanism, state mapping, screenshot/JSON file names, and removal proof. Final diff attribution must prove no test harness, fake auth route, hard-coded production account, seed/migration, auth bypass, Supabase policy/schema change, package/config change, or production behavior change remains.
- Light, dark, and reduced-motion evidence.
- Dark-mode runtime proof is mandatory. Final evidence must record `matchMedia('(prefers-color-scheme: dark)').matches`, computed `color-scheme`, body background, PawPal page token value, or an equivalent computed proof. Screenshots alone cannot satisfy dark-mode evidence.
- URL/title, meaningful render, no framework overlay, console warn/error classification, hydration warning status, horizontal overflow status.
- First-viewport matrix showing owner identity, trust/status summary, pet/readiness summary, install state/action, and add/manage-pet path visibility at 390x844 and 1280x720 where signed-in/harness evidence is available.
- Interaction checks:
  - `Edit Profile` opens edit mode and `Cancel` exits without save.
  - `Save` remains disabled or shows loading only during existing save behavior; no data mutation is attempted in test unless explicitly approved.
  - `Add Pet` opens and closes the add-pet form.
  - Add-pet submit remains disabled when pet name is empty.
  - Species, personality, and health toggles remain keyboard reachable.
  - Per-pet tag page link remains focusable and points to `/tag/{pet.id}`.
  - `Install` preserves existing browser-dependent behavior and status messaging.
  - Keyboard focus reaches primary profile/pet actions in a logical order.
- Accessibility notes for headings, landmarks, labels, button names, link labels, focus states, image/fallback semantics, status/error semantics, and form grouping.
- Product state matrix covering signed-out redirect, loading, profile error, no pets, pet list, pet NFC/no-NFC, edit mode, add-pet form, long strings, missing avatars, and install status.
- Source-diff audit proving no protected product/data/API/auth/PWA behavior changed.
- If `globals.css` changes, smoke routes `/auth`, `/tag/sample-id`, and `/store/checkout` must include URL/title, meaningful render, overlay status, console warn/error classification, hydration status, horizontal overflow status, light/dark/reduced-motion coverage, and screenshot/JSON evidence.
- If shared UI primitives change, final evidence must include a shared primitive ownership/diff note and smoke coverage for actual consuming routes, at minimum `/auth`, `/help`, `/store/checkout`, and `/tag/sample-id`. For each route, record URL/title, meaningful render, framework-overlay status, console warn/error classification, hydration warning status, horizontal overflow status, light/dark/reduced-motion coverage, and screenshot/JSON evidence.
- Final source-diff audit must explicitly prove the following profile behaviors did not change: auth redirect, profile fetch/create/update semantics, pet fetch/insert semantics, `owner_contact` persistence, per-pet tag-link construction, and PWA install prompt handling.
- `npm run lint`.
- `npm run build`.

## Acceptance Criteria

- `/profile` reads as a focused owner workspace, not a decorative marketing profile page.
- First viewport prioritizes owner identity, pet/readiness status, install status/action, and pet management path.
- Existing edit profile, install prompt, add-pet, pet trait toggle, and per-pet tag-link behaviors are preserved.
- Empty, loading, error, long-string, missing-avatar, no-pet, and pet-list states remain clear.
- No horizontal overflow at 390x844, 768x1024, 1280x720, or 1440x900.
- No relevant app console warnings/errors or hydration warnings after implementation.
- Dark mode remains readable for account summary, readiness panels, pet cards, forms, and status states.
- No protected product/data/API/auth/PWA/build/deploy boundary changes.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
