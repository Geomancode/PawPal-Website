# Round 08 Brief: Help Support Pathways

Status: Revised for four-lead approval
Date: 2026-06-11
Owner: Codex

## Goal

Make `/help` a faster, calmer support-routing surface: users should immediately understand where to go for NFC/tag issues, account/community issues, store/order issues, and urgent pet safety situations without adding support backend behavior, new policy promises, or broad shared-system changes.

## Approved Scope Requested

Primary runtime route:

- `/help`

Allowed implementation files:

- `src/app/help/page.tsx`
- `src/app/globals.css`, only for selectors scoped to Help/support-page layout and only if Tailwind utility changes are not enough.

Conditional implementation files, requiring explicit evidence in final diff attribution:

- `src/app/help/layout.tsx`, only for Help route-local metadata text if needed; no route behavior changes. App/global metadata, manifest, robots, sitemap, service worker, PWA, deploy, or config metadata changes are not allowed and require amended four-lead approval.
- `src/components/ui/StatusMessage.tsx`, only if an existing accessible status primitive is needed for the urgent-safety/support-note state.
- `src/components/ui/AppDeepLinkButton.tsx`, only if Help adds an app-deep-link support action and the existing primitive needs an accessibility-only fix.

Any need to touch Navbar, Footer, other routes, package/config/env/deploy/PWA files, API routes, Supabase, Stripe, auth, map, weather, database, or service worker files blocks implementation and requires amended four-lead approval.

## Non-Goals

- No support ticket backend, contact form, CRM integration, email target change, automation, notification, or data capture.
- No legal/privacy/support commitment changes beyond clarifying existing user guidance.
- No auth, Supabase, Stripe, API, payment, cart, order, profile, tag data, map, weather, geolocation, deployment, env, CI, manifest, service worker, sitemap, robots, metadata, package, or dependency changes.
- No new visual assets.
- No new landing-page hero, decorative blobs, doodle system, or broad route-family refactor.
- No changes to `/about`, `/privacy`, `/terms`, `/store`, `/auth`, `/globe`, or `/tag/[id]` unless an approved smoke-only validation reveals a blocker that triggers reapproval.

## Routes Affected

Primary evidence route:

- `/help`

Smoke routes only if `globals.css` or shared primitives change:

- `/`
- `/store`
- `/auth`
- `/about`
- `/privacy`
- `/terms`

## Primary User Scenario

A visitor has a concrete issue and needs the fastest safe next step: scan/tag recovery guidance, account/community support, store/order help, or an urgent pet safety situation. The first viewport must route them without forcing them through a decorative marketing layout.

## Primary CTA / Conversion Path

Primary action:

- Contact PawPal support via the existing support email.

Secondary task paths:

- Open Globe for local/map context.
- Shop or replace a PawPal tag if the issue is tag-related.
- Identify what context to include in a support request without exposing unnecessary data.

## First-Viewport Product Goal

At 390x844 and 1280x720, `/help` must show:

- Route purpose: support and safety routing.
- Primary contact action.
- At least the first support lane or a compact lane selector.
- Urgent pet safety guidance that says local services come first before PawPal support.

## Trust / Safety States In Scope

- Urgent pet issue guidance.
- NFC/tag scan issue guidance.
- Account/community issue guidance.
- Store/order issue guidance.
- Privacy-conscious support-context guidance.

## Product Tradeoffs And Unresolved Risks

- Help should be clearer without implying 24/7 emergency response or stronger support SLAs than the product supports.
- Store/order guidance can reference the store path, but it must not alter commerce behavior.
- Urgent safety language must remain careful: local services first, PawPal as support/community context.
- This round does not solve valid-tag sample data gaps from earlier evidence; that should be a separate data-fixture or real-sample QA round if needed.

## Risk Level

Low to Medium.

The primary file is a static route. Risk rises if global CSS or shared UI primitives are touched.

## Required Evidence

- Pre-round snapshots for all approved and conditional files before source implementation.
- `DIFF_BASELINE.md` and `evidence/PRE_IMPLEMENTATION_BASELINE.md` must record current SHA-256 hashes and dirty/untracked state for all approved and conditional files.
- Final `DIFF_ATTRIBUTION.md` must attribute Round 08 changes only against the Round 08 snapshots, not against the full dirty working tree.
- Baseline Browser or Playwright evidence for `/help` at 390x844, 768x1024, 1280x720, and 1440x900.
- After evidence for `/help` at the same viewports.
- Light, dark, and reduced-motion evidence.
- Dark-mode runtime proof is mandatory. Final evidence must record `matchMedia('(prefers-color-scheme: dark)').matches`, computed `color-scheme`, body background, PawPal page token value, or an equivalent computed proof. Screenshots alone cannot satisfy dark-mode evidence. If tooling cannot provide proof, record a tooling blocker/fallback with owner and follow-up.
- URL/title, meaningful render, no framework overlay, console warn/error classification, hydration warning status, horizontal overflow status.
- First-viewport matrix showing route purpose, primary action, support lane, and urgent-safety guidance visibility at 390x844 and 1280x720.
- Interaction checks:
  - Contact support mail link is visible and focusable.
  - Open Globe link routes to `/globe`.
  - Tag/store-related support path routes only to existing store/tag-safe destinations.
  - Keyboard focus order reaches primary actions and support lanes.
- Accessibility notes for headings, landmarks, link labels, focus states, and urgent guidance semantics.
- Product support-path matrix covering lane purpose, user question, next action, trust/safety wording, and copy commitment risk.
- Source-diff audit proving no protected product/data/API behavior changed.
- If `globals.css` changes, smoke routes `/`, `/store`, `/auth`, `/about`, `/privacy`, and `/terms` must include URL/title, meaningful render, overlay status, console warn/error classification, hydration status, horizontal overflow status, light/dark/reduced-motion coverage, and screenshot/JSON evidence.
- If `StatusMessage.tsx` or `AppDeepLinkButton.tsx` changes, final evidence must include a shared primitive ownership/diff note and smoke coverage for actual consuming routes, at minimum `/tag/sample-id` and `/store/checkout`, proving tag rescue/deep-link/status and checkout status behavior did not regress. This shared-primitive smoke evidence must explicitly record URL/title, meaningful render, overlay status, console warn/error classification, hydration status, horizontal overflow status, light/dark/reduced-motion coverage, and screenshot/JSON evidence.
- `npm run lint`.
- `npm run build`.

## Acceptance Criteria

- Help first viewport is task-led, not another oversized decorative hero.
- Support lanes are scannable on mobile and desktop.
- Urgent safety guidance is visible, calm, and does not overpromise PawPal emergency response.
- No horizontal overflow at 390x844, 768x1024, 1280x720, or 1440x900.
- No relevant app console warnings/errors or hydration warnings after implementation.
- Dark mode remains readable for primary action, support lanes, and urgent guidance.
- No protected product/data/API/build/deploy boundary changes.

## Reviewers

- QA: Linnaeus
- Product: Plato
- Engineering: McClintock
- Design: Laplace
