# Implementation Record: Round 12A Homepage Focus Upgrade

Status: Complete, four-lead approved
Date: 2026-06-12
Owner: Codex

Implementation is complete within the approved `ROUND_BRIEF.md` scope. QA, Product, Engineering, and Design approved the final evidence.

## Proposed Scope

- `src/app/page.tsx`
- `src/components/HomeClientParts.tsx`
- `src/app/globals.css`, Homepage-scoped selectors only
- Round evidence and review records

## Files Changed

- `src/app/page.tsx`
- `src/components/HomeClientParts.tsx`
- `src/app/globals.css`, Homepage-scoped selectors only
- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-12A-homepage-focus-upgrade/**`
- `design/review/website-visual-upgrade-2026-06-11/PLAN.md`
- `design/review/website-visual-upgrade-2026-06-11/README.md`

## Implementation Notes

- Generated and saved Homepage concept evidence at `evidence/concepts/homepage-focus-concept.png`.
- Removed repeated Homepage surfaces from active route composition: hero signal rail, hero badges, readiness panel, separate feature grid, four phone-card grid, and old hero floating info cards.
- Reworked the active Homepage rhythm to: hero, three-item proof band, three-step flow, single app/tag showcase, final CTA band.
- Preserved primary `/globe` CTA and secondary `/store` CTA.
- Kept implementation inside approved Homepage files and Homepage-scoped CSS.
- Did not change Globe, Navbar, Footer, site config, service worker, manifest, sitemap, robots, auth, payment, database, API, deployment, package, dependency, or build-system behavior.

## Validation

- Browser-first smoke on `http://127.0.0.1:3001/`: pass.
- `npm run lint`: pass.
- `npm run build`: pass.
- Homepage visual matrix: 10/10 pass.
- Interaction/accessibility matrix: pass.
- Screenshots: 11 PNGs under `evidence/screenshots/`.
- Relevant console warnings/errors: 0.
- Hydration warnings: 0.
- Page errors: 0.
- Framework overlays: 0.
- Horizontal overflow: 0.
- First-viewport critical overlap: 0 failing cases.
- Proof-band next-section hint visible in all 10 matrix cases.
- Dark-mode runtime proof recorded with `matchMedia`, computed `color-scheme`, body background, and Homepage surface backgrounds.
- Reduced-motion runtime proof recorded with `matchMedia`, active CSS animation count, and removed animated/floating hero surfaces.

## Known Risks

- Homepage has several repeated proof/feature surfaces, so deletions must preserve the core product journey.
- Hero globe and floating overlays can overlap on mobile/tablet; responsive evidence must explicitly prove no overlap or clipping.
- Current worktree is dirty before Round 12A; final attribution must use `DIFF_BASELINE.md`.
- Visual concepting is required before coding by the Build Web Apps workflow.
- Browser runtime could not write screenshots directly into the workspace due permission restrictions; Browser-first smoke was still performed, and Playwright generated the persisted screenshot matrix.
- The live Globe remains visually animated as the existing product visual; Round 12A removed extra animated hint/floating cards and verified reduced-motion media signals.

## Final Evidence Submitted

- `evidence/FINAL_EVIDENCE_SUMMARY.md`
- `evidence/COMMAND_RESULTS.md`
- `evidence/DIFF_ATTRIBUTION.md`
- `evidence/HOMEPAGE_DEDUPLICATION_LEDGER.md`
- `evidence/HOMEPAGE_VISUAL_MATRIX.md`
- `evidence/INTERACTION_ACCESSIBILITY_MATRIX.md`
- `evidence/CONCEPT_FIDELITY_LEDGER.md`
- `evidence/SCREENSHOT_INDEX.md`
- `evidence/homepage-visual-matrix-results.json`
- `evidence/homepage-interaction-accessibility-results.json`
- `evidence/homepage-evidence-summary.json`
