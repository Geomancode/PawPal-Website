# Round Brief: Round 12A Homepage Focus Upgrade

Round: 12A, Pre-Round 13
Status: Approved
Date: 2026-06-12
Owner: Codex

## Goal

Before starting Round 13, perform one focused Homepage upgrade using the established four-lead workflow:

- Deduplicate repeated Homepage elements and repeated proof/feature messages.
- Optimize layout and responsive composition so Homepage elements do not overlap or compete.
- Make the Homepage feel simpler, more spacious, and more premium, with the primary product value clearly emphasized.

This is a Homepage visual/product hierarchy round, not a broad site redesign.

## Why This Round

The current Homepage has strong product material but too many repeated signals competing for attention:

- Hero signal rail, hero badges, globe floating cards, trust marquee, readiness cards, workflow cards, feature rows, app showcase tiles, and final CTA repeat similar ideas.
- The hero globe and floating overlays create elevated overlap risk, especially at mobile and tablet widths.
- The page can feel more complex than the product story requires.

This round should make the Homepage calmer and more decisive before the next numbered round begins.

## Approved Scope

Allowed source changes after brief approval:

- `src/app/page.tsx`
  - Reorder, remove, or simplify Homepage sections.
  - Keep the route as the Homepage and preserve metadata intent.
- `src/components/HomeClientParts.tsx`
  - Simplify Homepage components.
  - Remove duplicated Homepage-only proof blocks or merge them into fewer stronger components.
  - Simplify hero supporting elements and globe overlays.
  - Preserve functional CTA destinations.
- `src/app/globals.css`
  - Homepage-scoped CSS only, especially `.home-*`, `.hero-*`, `.readiness-*`, `.workflow-*`, `.feature-*`, and related Homepage selectors.
  - Remove or neutralize CSS for Homepage elements removed in this round only when safe.
- Round 12A evidence and review records.
- Image Gen concept evidence for the Homepage visual direction, unless Image Gen is unavailable; any fallback must be recorded.

Read-only unless all four leads reapprove:

- `src/components/Globe.tsx`
- `src/components/GlobeStaticPreview.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/lib/site.ts`
- Routes under `src/app/**` other than `src/app/page.tsx`
- `package.json`, lockfiles, config files, deployment files, service worker, manifest, sitemap, robots, auth/data/payment/API code.

## Explicit Non-Goals

- No route additions or route removals.
- No auth, Supabase, Stripe, API, database, map engine, AI, deployment, CI, package, dependency, build-system, service worker, manifest, sitemap, robots, or environment-variable changes.
- No changes to `/globe`, `/store`, `/profile`, `/tag/[id]`, `/help`, legal pages, Navbar, or Footer behavior.
- No new product claims, fake metrics, unsupported market claims, newsletter flows, analytics, or external integrations.
- No broad global CSS cleanup outside Homepage-owned selectors.
- No CSS-module migration unless Engineering explicitly reapproves it in this brief.

## Design Direction

Target route character: minimal, spacious, premium product Homepage.

Required visual direction:

- One clear first-viewport focal point: PawPal as pet safety map + smart tag product.
- A simpler hero: headline, short support copy, primary CTA, secondary CTA, and one clear product visual.
- Fewer badges, chips, floating cards, and repeated proof rows.
- The globe should remain a product signal but must not cause overlapping cards or crowded decorative layers.
- More whitespace and calmer section rhythm.
- Repeated ideas should be merged into fewer stronger sections.
- Cards must not be nested or multiplied as filler.
- No decorative orbs, generic marketing badges, hero eyebrow/kicker/pill labels, or extra gradient decoration.
- Dark mode must remain coherent.
- Reduced motion must remain stable.

## Product Intent

Primary user scenario:

1. A visitor lands on `/`.
2. They immediately understand PawPal's core value: safer walks through a live map and smart pet safety tags.
3. They can choose the primary action, `Open Live Map`, or the secondary action, `Shop Smart Tags`, without being distracted by repeated proof blocks.
4. Down-page content reinforces the same story without repeating the same elements.

Primary CTA / conversion path:

- Primary: `/globe` via `Open Live Map`.
- Secondary: `/store` via `Shop Smart Tags`.

First-viewport product goal:

- At 390x844 and 1280x720, the hero should show a readable headline, support copy, primary CTA, secondary CTA, and a non-overlapping product visual or its clear top portion.

## Engineering Intent

- Keep the implementation route-local and reviewable.
- Prefer deleting or simplifying duplicate markup over adding new abstractions.
- Reuse existing components and tokens where practical.
- Keep the Globe component itself unchanged.
- Avoid dependency and build-system changes.
- Keep existing motion infrastructure but reduce nonessential animated surfaces.

## Required Concept Step

Because this is a visual Homepage upgrade and the Build Web Apps workflow is active:

- Generate a Homepage visual concept before coding.
- The concept must show the complete Homepage rhythm or enough coordinated section concepts to guide implementation.
- The concept must be minimal, spacious, product-led, and avoid duplicated card grids.
- Record the concept in `evidence/concepts/` or document why a local path is unavailable.
- Use the concept as implementation direction without inventing unrelated sections or claims.

## Required Evidence Before Final Signoff

Browser must be used first where practical. Playwright fallback is allowed only for matrix automation or if Browser viewport/dark-mode coverage is insufficient.

Required checks:

- `npm run lint`
- `npm run build`
- Browser smoke on `http://localhost:3001/` or current production preview:
  - URL/title
  - non-empty render
  - no framework overlay
  - relevant console warnings/errors
  - hydration warnings
  - page errors
  - horizontal overflow
  - screenshot evidence
- Homepage responsive matrix:
  - `/` at 390x844, 768x1024, 1280x720, 1440x900
  - light mode and dark mode
  - reduced-motion at representative mobile and desktop widths
- Dark-mode runtime proof must record more than screenshots:
  - `matchMedia('(prefers-color-scheme: dark)').matches`
  - computed `color-scheme`, body background, and at least one relevant Homepage hero/surface background or equivalent computed color signal
- Reduced-motion runtime proof must record more than screenshots:
  - `matchMedia('(prefers-reduced-motion: reduce)').matches`
  - at least one representative Homepage motion/control signal proving reduced-motion mode is active or motion is suppressed
- Required per-case evidence fields:
  - URL and title
  - non-empty render
  - no framework overlay
  - relevant console warnings/errors
  - hydration warnings
  - page errors
  - horizontal overflow
  - first-viewport overlap/clipping status
  - dark/reduced-motion runtime signal when the case uses those media settings
  - screenshot path
  - JSON result
- Interaction/accessibility:
  - primary CTA href `/globe`
  - secondary CTA href `/store`
  - keyboard focus path through Homepage hero CTAs and visible primary navigation targets
  - focus-visible proof
  - heading structure
  - mobile tap targets
- Design evidence:
  - before/after screenshots
  - concept-to-implementation fidelity ledger
  - deduplication ledger
  - first-viewport hierarchy notes
  - responsive no-overlap notes
  - dark-mode visual quality
  - reduced-motion visual completeness
- Product evidence:
  - primary user scenario
  - CTA priority
  - repeated elements removed or merged
  - unresolved product risks
- Engineering evidence:
  - source-diff attribution against `DIFF_BASELINE.md`
  - dependency/config/data/auth/payment/API/deployment/env boundaries
  - performance/bundle risk

## Risk Level

Medium.

Reason: The route is public and visually central; the allowed implementation surface is still narrow and route-local.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
