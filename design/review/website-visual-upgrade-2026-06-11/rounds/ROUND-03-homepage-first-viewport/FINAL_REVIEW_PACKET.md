# Final Review Packet: Round 03 Homepage First Viewport

Status: Approved
Date: 2026-06-11
Owner: Codex

## Implementation Summary

Round 03 changed only the two approved implementation files:

- `src/app/page.tsx`
- `src/components/HomeClientParts.tsx`

The Homepage first viewport now brings the product-led journey forward:

- Mobile H1, product promise, and both CTAs appear earlier.
- Mobile secondary hero signal/badge proof no longer pushes the globe below the first viewport.
- Globe proof begins inside the 390x844 first viewport.
- Desktop globe remains prominent with at most two floating proof callouts.
- Touched Framer Motion surfaces now respect `useReducedMotion`.

## Required Checks

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Browser final new warn/error logs | PASS, `0` |
| Blocking overlay | PASS, none visible |
| Horizontal overflow | PASS, none |
| Homepage non-empty render | PASS |
| Homepage globe proof | PASS, visible canvas node and screenshots |
| `Open Live Map` CTA | PASS, reaches `/globe` |
| `Shop Smart Tags` CTA | PASS, reaches `/store` |

## Key Measurements

| Viewport | H1 top | Open Live Map top | Shop Smart Tags top | Canvas top | Canvas visible height | Floating callouts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Baseline 390x844 | 201 | 803 | 863 | 1284 | 0 | Not applicable |
| Final 390x844 | 181 | 553 | 613 | 714 | 130 | 0 |
| Final 768x1024 | 181 | 411 | 411 | 764 | 260 | 0 |
| Final 1280x720 | 242 | 536 | 536 | 258 | 462 | 1 |
| Final 1440x900 | 201 | 578 | 578 | 225 | 605 | 2 |

## Evidence Files

- `IMPLEMENTATION_RECORD.md`
- `evidence/COMMAND_RESULTS.md`
- `evidence/BROWSER_VERIFICATION.md`
- `evidence/SCREENSHOT_INDEX.md`
- `evidence/DIFF_ATTRIBUTION.md`
- `ACCEPTANCE_QA.md`
- `ACCEPTANCE_PRODUCT.md`
- `ACCEPTANCE_ENGINEERING.md`
- `ACCEPTANCE_DESIGN.md`
- `SIGNOFF_RECORD.md`

Screenshots and raw JSON:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-03-homepage-first-viewport/`

## Known Review Notes

- Browser could not directly sample WebGL/canvas pixels. Evidence uses canvas DOM presence, viewport bounds, and screenshots.
- Browser could not force reduced-motion or dark media settings. Reduced-motion support is source-audited through `useReducedMotion`; dark behavior is source-audited in global CSS and currently resolves to forced-light tokens.
- Browser retained two historical log entries from earlier Store browsing. Official evidence filters by Round 03 run timestamp; new warn/error logs are `0`.
- Round 03 received all four final signatures. Round 04 remains blocked until its own brief receives four `通过` signatures.

## Final Signatures

| Role | Agent | Status | Conditions |
| --- | --- | --- | --- |
| QA | Linnaeus | 通过 | None |
| Product | Plato | 通过 | None |
| Engineering | McClintock | 通过 | None |
| Design | Laplace | 通过 | None |
