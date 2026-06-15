# Diff Attribution: Round 03 Homepage First Viewport

Date: 2026-06-11
Owner: Codex

## Baseline

Round 03 captured pre-implementation snapshots before code edits:

- `evidence/home-page.pre-round03.tsx.snapshot`
- `evidence/HomeClientParts.pre-round03.tsx.snapshot`

The implementation attribution below compares current files against those snapshots, not against `HEAD`, because the worktree already contained unrelated/pre-existing dirty changes before Round 03 began.

## Implementation Files Changed

| File | Round 03 attribution |
| --- | --- |
| `src/app/page.tsx` | Homepage hero spacing, mobile min-height removal, CTA order, signal/badge responsive visibility. |
| `src/components/HomeClientParts.tsx` | Reduced-motion branching, globe minimum-height clamp, removal of extra globe callouts, cleanup of unused callout icons. |

## `src/app/page.tsx`

Round 03 changed the first viewport composition only:

- Hero section changed from `pt-24` to `pt-20` on mobile.
- Mobile `min-h-[650px]` was removed from the hero grid.
- Mobile grid spacing was compressed from larger gaps/padding to `gap-4`, `px-4`, `pb-6`, and `pt-5`.
- CTA group now appears before `HeroSignalRail` and `HeroBadges`.
- `HeroSignalRail` is hidden below `sm`.
- `HeroBadges` is hidden below `md`.

No new route, data, API, auth, payment, dependency, or Globe-engine behavior was added in this file.

## `src/components/HomeClientParts.tsx`

Round 03 changed touched Homepage client components:

- Added `useReducedMotion` import and `enterMotion(...)` helper.
- Updated `FadeIn`, `FadeInView`, `HeroDescription`, `HeroCTA`, `HeroSignalRail`, `HeroBadges`, `GlobeSection`, and the globe hint animation to respect reduced motion.
- Changed `GlobeSection` from fixed mobile `min-h-[500px]`/desktop `lg:min-h-[610px]` to a responsive `clamp(385px, 72vw, 610px)` inline minimum height.
- Removed `Ghent Pilot` and `Lost mode` globe callout DOM blocks so global CSS cannot force them visible.
- Removed unused `MapPin` and `PawPrint` icon imports.

No changes were made to `src/components/Globe.tsx`, `src/components/GlobeFullPage.tsx`, `src/app/globals.css`, shared UI components, Store files, Auth/Profile/Tag/About/Help/Legal/Footer files, APIs, payment, database, deployment, environment, dependencies, or generated assets.

## Evidence That Scope Held

- `npm run lint`: PASS.
- `npm run build`: PASS.
- Browser final viewport evidence: PASS.
- Desktop floating callouts after fix:
  - 1280x720: `1`.
  - 1440x900: `2`.
- Mobile first viewport after fix:
  - `Open Live Map` top: `553`.
  - `Shop Smart Tags` top: `613`.
  - Globe canvas top: `714`.
