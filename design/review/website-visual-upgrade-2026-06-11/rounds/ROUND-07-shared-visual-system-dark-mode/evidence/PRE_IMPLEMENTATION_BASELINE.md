# Pre-Implementation Baseline: Round 07

Date: 2026-06-11
Status: Captured before implementation

## Scope

Round 07 targets shared visual-system hardening, reduced-motion/hydration warnings, and dark-mode readability evidence across:

- `/`
- `/store`
- `/auth`
- `/tag/sample-id`
- `/store/checkout`
- `/globe`

## Source Snapshots

Snapshots are stored in this `evidence/` directory. SHA-256 values are listed in `DIFF_BASELINE.md`.

Snapshot categories:

- Shared CSS and UI primitives.
- Navbar/Footer conditional shared surfaces.
- Primary route files for Home, Store, Auth, Tag sample, Checkout, and Globe evidence.

## Browser Baseline

Raw file:
`design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-baseline-browser-results.json`

Summary:

- Total checks: 12.
- Passed checks: 12.
- Failed checks: 0.
- Current relevant warn/error logs: 0.
- Horizontal overflow: 0.

## Light/Dark Screenshot Baseline

Raw file:
`design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-baseline-playwright-results.json`

Summary:

- Total screenshots: 24.
- Passed screenshots: 15.
- Failed screenshots: 9.
- Relevant captured logs: 18.

Failure distribution:

| Route | Baseline result |
| --- | --- |
| `/` | 0/4 screenshot checks passed; reduced-motion warning and hydration mismatch logs present. |
| `/store` | 0/4 screenshot checks passed; reduced-motion warning and hydration mismatch logs present. |
| `/auth` | 4/4 automated screenshot checks passed; dark screenshot still visually low-contrast and needs design review. |
| `/tag/sample-id` | 4/4 automated screenshot checks passed. |
| `/store/checkout` | 3/4 screenshot checks passed; dark desktop hydration mismatch log present. |
| `/globe` | 4/4 automated screenshot checks passed. |

## Baseline Screenshot Files

Screenshot files follow:

`baseline-{light|dark}-{route-slug}-{viewport}.png`

Examples:

- `baseline-dark-home-390x844.png`
- `baseline-dark-store-390x844.png`
- `baseline-dark-auth-390x844.png`
- `baseline-dark-checkout-1280x720.png`

## Implementation Lock

No implementation has begun. Round 07 remains blocked until all four leads approve the brief.

