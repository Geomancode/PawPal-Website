# Profile Visual Matrix: Round 10 Profile Task Readiness

Date: 2026-06-11
Owner: Codex

Machine-readable results:

- `evidence/profile-visual-matrix-results.json`
- `evidence/profile-evidence-summary.json`

## Summary

| Area | Result |
| --- | --- |
| Total visual cases | 62 |
| Passing visual cases | 62 |
| Failures | 0 |
| Screenshots | 62 matrix screenshots plus 1 interaction screenshot |
| Relevant console/page errors | 0 |
| Known benign development noise | 0 in final production-preview run |
| Final base URL | `http://localhost:3001` |

## Matrix Coverage

| Case group | Paths | Viewports | Modes |
| --- | --- | --- | --- |
| Signed-out production redirect | `/profile` to `/auth` | 390x844, 768x1024, 1280x720, 1440x900 | light, dark, reduced |
| Signed-in ready fixture | `/round10-profile-fixture/ready` | 390x844, 768x1024, 1280x720, 1440x900 | light, dark, reduced |
| Signed-in state fixtures | `empty`, `long`, `edit`, `add`, `installed` | 390x844, 1280x720 | light, dark |
| Shared CSS smoke | `/auth`, `/tag/sample-id`, `/store/checkout` | 390x844, 1280x720 | light, dark, reduced |

## Known Benign Noise Classification

The JSON keeps raw events and classifies known development noise separately:

- Auth/checkout caret-color hydration mismatch from headless/dev input rendering.
- Tag not-found development `Performance.measure` timestamp noise.

No known benign or relevant console/page events remained in the final `http://localhost:3001` production-preview run.

## Design Rework Evidence

After Design flagged the 390x844 first viewport, the mobile profile rules were tightened and the matrix was regenerated:

- `fixture-ready-light-390x844.png` now shows owner identity, readiness rows, install action, and `Add another pet`.
- `fixture-add-light-390x844.png` now shows `My Pets`, `Cancel`, and the add-pet form beginning with `Pet Name *`.
- Light, dark, and reduced ready-state mobile screenshots were regenerated from the same 3001 production preview.

## Representative Screenshots

- `evidence/screenshots/fixture-ready-light-390x844.png`
- `evidence/screenshots/fixture-add-light-390x844.png`
- `evidence/screenshots/fixture-ready-dark-1280x720.png`
- `evidence/screenshots/fixture-ready-reduced-1440x900.png`
- `evidence/screenshots/fixture-empty-light-390x844.png`
- `evidence/screenshots/fixture-long-dark-1280x720.png`
- `evidence/screenshots/profile-signed-out-redirect-light-390x844.png`
- `evidence/screenshots/smoke-auth-dark-1280x720.png`
- `evidence/screenshots/smoke-store-checkout-reduced-390x844.png`
