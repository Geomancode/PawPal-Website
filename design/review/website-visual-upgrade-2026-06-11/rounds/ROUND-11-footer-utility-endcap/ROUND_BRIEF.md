# Round 11 Brief: Footer Utility Endcap

Status: Draft
Date: 2026-06-12
Owner: Codex

## Goal

Make the global Footer a calmer, more useful utility endcap across the site, aligned with the original plan's Phase 5 guidance: "Footer should stay calm and useful; avoid turning it into another hero-like surface."

The Footer should help users complete secondary tasks without adding another large promotional section: navigate product/support/legal links, contact PawPal, and understand the Belgium/EU operating context.

## Approved Scope

Pending four-lead approval.

Proposed implementation scope:

- Refine `src/components/Footer.tsx` hierarchy, link grouping, contact affordance, bottom legal row, and mobile layout.
- Use only footer-scoped selectors in `src/app/globals.css` if existing utility classes are not enough.
- Preserve current public links and mailto behavior unless Product explicitly approves a label-only copy adjustment.
- Keep PawPalLogo usage, siteConfig email, and existing route hrefs intact.
- Verify Footer on several representative pages because it is globally rendered.

## Non-Goals

- No auth, Supabase, Stripe, API, database, map, AI, deployment, CI, package, or environment changes.
- No new route, sitemap, manifest, service worker, or metadata changes.
- No broad `globals.css` cleanup outside footer-scoped selectors.
- No new product claims, unsupported metrics, social links, newsletter signup, tracking, or external integrations.
- No changes to Navbar, page hero sections, store cart, globe HUD, profile data, tag data, or checkout behavior.

## Routes Affected

The Footer is global. Evidence should cover representative route families:

- `/`
- `/store`
- `/globe`
- `/help`
- `/privacy`
- `/profile` signed-out redirect to `/auth`, if easy to verify

## Files Expected To Change

Approved only after brief signoff:

- `src/components/Footer.tsx`
- `src/app/globals.css`, footer-scoped selectors only

Conditional review-only files:

- `src/lib/site.ts`, only if evidence reveals a current siteConfig inconsistency; otherwise read-only.
- `src/components/PawPalLogo.tsx`, read-only unless all four leads approve a specific logo rendering defect.

Round records:

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-11-footer-utility-endcap/**`

## Primary User Scenario

A user reaches the end of a route and needs a quiet way to continue: open the live map, shop NFC tags, get help, review privacy/terms, or contact PawPal.

## Primary CTA / Conversion Path

Primary utility path:

- Contact PawPal through the existing email address.

Secondary paths:

- Product: Globe Map, NFC Safety Tag, Store.
- Support/legal: Help Center, Privacy Policy, Terms of Service.

## First-Viewport Product Goal

Not applicable; this is a footer/end-of-page round. Instead, the footer viewport goal is:

- On mobile and desktop, the footer should fit as a compact utility endcap with clear link groups, no oversized hero-like panel, no horizontal overflow, and no buried legal/contact information.

## Trust / Safety States In Scope

- Footer link clarity for support/legal routes.
- Contact email affordance and partnership/contact path.
- Dark-mode readability where the footer appears.
- Long text and mobile wrapping resilience.

## Product Tradeoffs And Unresolved Risks

- Footer changes affect every route, so QA must smoke multiple route families even if only one component changes.
- Compacting the footer improves utility but may reduce promotional warmth; Design owns whether the remaining brand character is sufficient.
- Existing worktree has many dirty/untracked files from prior rounds; Engineering must use Round11 baseline hashes for attribution.

## Risk Level

Medium

Reasons:

- Footer is global and visible across routes.
- Implementation should be small, but regression surface is broad.
- No behavior or backend changes are expected.

## Required Evidence

- Command results: `npm run lint`, `npm run build`.
- Browser first where practical; Playwright fallback allowed if Browser lacks viewport/dark-mode coverage or existing preview cache is stale.
- Footer smoke matrix: 390x844, 768x1024, 1280x720, 1440x900.
- Required routes: `/`, `/store`, `/help`, `/privacy`.
- Additional route handling: include `/globe`, or record an explicit N/A if the Footer is intentionally not rendered on the map/tool shell; include `/profile -> /auth` if practical, or record an explicit reason if not validated.
- Per matrix case, record URL/title, non-empty render, framework overlay status, console warn/error entries, hydration warning status, horizontal overflow, screenshot path, and JSON result.
- Dark-mode proof may not be screenshot-only. It must include runtime proof such as `matchMedia('(prefers-color-scheme: dark)')`, computed `color-scheme`, body colors, and footer colors on representative footer routes.
- Reduced-motion proof must record `matchMedia('(prefers-reduced-motion: reduce)')` and either confirm the Footer is unaffected or document a clear N/A reason.
- Interaction/accessibility matrix: verify footer link hrefs/mailto, keyboard focus path, focus-visible behavior, `contentinfo` landmark, accessible link names, and mobile tap targets.
- Screenshots: footer screenshots for the required matrix, including mobile and desktop states.
- Runtime smoke: page identity, non-empty render, no framework overlay, no relevant console/page errors.
- Responsive measurements: no horizontal overflow at 390 and no footer text clipping/overlap at all required breakpoints.
- Known risks and diff attribution against `DIFF_BASELINE.md`.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
