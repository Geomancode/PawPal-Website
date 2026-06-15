# Round 06 Brief: About And Cross-Route Polish

Status: Revised for four-lead approval
Date: 2026-06-11
Owner: Codex

## Goal

Finish the public informational layer so PawPal feels consistent, calm, and trustworthy across About, Help, legal pages, and shared navigation/footer surfaces without adding new decoration or changing product/data behavior.

## Approved Scope

Implementation may improve visual layout, copy hierarchy, first-viewport clarity, responsive spacing, accessibility affordances, and shared information-page consistency for:

- `/about`
- `/help`
- `/privacy`
- `/terms`

Cross-route smoke coverage may include:

- `/`
- `/store`
- `/auth`
- `/globe`

Allowed implementation files:

- `src/app/about/page.tsx`
- `src/app/help/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/globals.css`, only grouped informational/legal/about/help/footer/nav polish selectors.

Conditional implementation files:

- `src/components/Footer.tsx`, only if footer visual hierarchy or link grouping must be adjusted across informational pages.
- `src/components/ConditionalFooter.tsx`, only if route inclusion/exclusion causes a visual inconsistency; no routing behavior expansion without explicit evidence.
- `src/components/Navbar.tsx`, only for tiny cross-route visual consistency issues; no link/auth/globe route behavior changes.

## Shared Component Boundary Checklist

Final source-diff evidence must confirm these contracts if shared files change:

| File | Protected behavior contract |
| --- | --- |
| `src/components/Footer.tsx` | If changed, footer link `href`s, `mailto:` targets, and `siteConfig.email` usage remain unchanged unless explicitly listed as a reviewed route/link change. |
| `src/components/ConditionalFooter.tsx` | If changed, `HIDE_ON` and route inclusion/exclusion behavior remain unchanged, or exact route behavior changes and smoke evidence are recorded. |
| `src/components/Navbar.tsx` | If changed, no changes to `NAV_LINKS`, `PROFILE_LINK`, auth/session/sign-out flow, active route logic, mobile menu behavior, or existing `/globe` specialization behavior. |
| `src/app/globals.css` | Selector-level diff limited to about/help/privacy/terms/footer/nav polish selectors; no token, reset, global helper, dark-mode compatibility, or unrelated route selector changes. |

If Playwright is used again for screenshots, final evidence must record it as a tooling fallback using existing installed tooling, with no package or dependency change.

## Non-Goals

- No auth, Supabase, Stripe, API, payment, cart, order, profile, tag, map, weather, or geolocation behavior changes.
- No PWA, manifest, service worker, sitemap, robots, metadata, env, dependency, database, deployment, CI, or build-system changes.
- No new image assets.
- No new marketing landing page or decorative hero system.
- No Store product discovery, Globe tool surface, Auth/Profile/Checkout/Orders/Success redesign.
- No global color-token overhaul.

## Routes Affected

Primary runtime routes:

- `/about`
- `/help`
- `/privacy`
- `/terms`

Smoke routes if shared components change:

- `/`
- `/store`
- `/auth`
- `/globe`

## Primary User Scenario

A visitor is evaluating PawPal before trusting the product: they read the About page, look for help, or check legal/privacy details. The UI should make the product purpose, support path, and trust posture clear without feeling like another oversized marketing hero.

## First-Viewport Product Goal

At 390x844 and 1280x720, each primary route must show:

- Current route purpose.
- The most useful next action or section path.
- A trust or clarity signal appropriate to the page.

## Visual Acceptance Criteria

- Use restrained PawPal brand primitives already present in the app.
- About should feel like product proof and company context, not a duplicated landing-page hero.
- Help should surface support pathways and scan-friendly route choices quickly.
- Privacy and Terms should read as clear documents with calm hierarchy and accessible anchors or sections.
- Do not add decorative blobs, new doodles, gradient orbs, stock-like imagery, or nested cards.
- Text must not overlap, clip, or push primary state/actions out of the first viewport.
- Shared nav/footer changes must remain consistent with completed Rounds 02-05.
- About must not keep using a large marketing hero plus metric cards as the primary visual logic; it should shift toward product proof and company context.
- Help first viewport must prioritize support paths and action entry points over explanatory decoration.
- Privacy and Terms should read like scannable documents; body rhythm, readable line width, and section/anchor clarity matter more than visual novelty.

## Product Information Matrix Requirement

Final evidence must include a matrix for `/about`, `/help`, `/privacy`, and `/terms` with:

- Route purpose.
- User's primary question on that route.
- First-viewport next action or section path.
- Trust or clarity signal.
- Key CTA/link availability.
- Any copy changes to metrics, privacy/legal commitments, or support commitments.

Do not add unsourced metrics or stronger legal/privacy/support promises than the current product and policy text support.

## Required Evidence

- Pre-round snapshots for all expected and conditional files.
- Baseline screenshots and JSON for `/about`, `/help`, `/privacy`, `/terms` at 390, 768, 1280, and 1440 widths.
- After DOM/log/overflow JSON and after screenshots for `/about`, `/help`, `/privacy`, `/terms` at 390, 768, 1280, and 1440 widths.
- If Browser/IAB screenshot capture still times out, use the user-approved Playwright screenshot fallback for screenshots, while retaining Browser/IAB for DOM/log/URL/title/overlay/overflow evidence; record the fallback reason.
- If shared components change, after smoke screenshots for `/`, `/store`, `/auth`, and `/globe` at mobile and desktop widths.
- If shared components change, smoke routes `/`, `/store`, `/auth`, and `/globe` must also include URL/title, meaningful render, visible overlay, timestamp-filtered console warn/error logs, and horizontal overflow at mobile and desktop widths.
- `npm run lint`.
- `npm run build`.
- Browser checks for affected routes: URL/title, meaningful render, visible framework overlay, timestamp-filtered console warn/error logs, horizontal overflow, first-viewport route purpose/action/trust clarity.
- First-viewport design measurements for each primary route at 390x844 and 1280x720, recording whether route purpose, primary next action or section path, and trust/clarity signal are visible.
- Interaction checks:
  - Help route/support CTAs.
  - Legal page section or link navigation if legal pages are changed.
  - Footer/nav link smoke if shared components change.
- Accessibility notes for headings, landmarks, links, focusable controls, and document sections.
- Privacy/Terms document-readability evidence: body max-width, heading hierarchy, section/anchor scannability, and mobile long-paragraph pressure.
- Product information matrix covering route purpose, user question, next action/section path, trust/clarity signal, key CTA/link availability, and commitment/metric copy changes.
- Dark-mode and reduced-motion evidence or recorded Browser tooling limitation.
- Source-diff audit proving no protected product/data/API behavior changed.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
