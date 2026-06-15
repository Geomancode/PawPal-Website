# Footer Visual Matrix: Round 11

Date: 2026-06-12
Base URL: `http://localhost:3001`
Source: `footer-visual-matrix-results.json`

## Summary

| Area | Result |
| --- | --- |
| Total matrix cases | 38 |
| Passed cases | 38 |
| Relevant console warnings/errors | 0 |
| Hydration warnings | 0 |
| Page errors | 0 |
| Framework overlays | 0 |
| Horizontal overflow | 0 |
| Screenshots | 38 matrix screenshots plus 1 interaction screenshot |

## Route Coverage

| Route | Cases | Result | Footer Status | Viewports | Modes | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `/` | 8 | Pass | Rendered | 390x844, 768x1024, 1280x720, 1440x900 | light, dark, reduced | 3 known benign WebGL `ReadPixels` warnings recorded as non-Footer noise. |
| `/store` | 8 | Pass | Rendered | 390x844, 768x1024, 1280x720, 1440x900 | light, dark, reduced | No relevant console/page errors. |
| `/help` | 6 | Pass | Rendered | 390x844, 768x1024, 1280x720, 1440x900 | light, dark | No relevant console/page errors. |
| `/privacy` | 8 | Pass | Rendered | 390x844, 768x1024, 1280x720, 1440x900 | light, dark, reduced | No relevant console/page errors. |
| `/globe` | 4 | Pass | N/A | 390x844, 768x1024, 1280x720, 1440x900 | light | Full-screen map shell intentionally hides the global Footer via `ConditionalFooter`. |
| `/profile` | 4 | Pass | Rendered after redirect | 390x844, 768x1024, 1280x720, 1440x900 | light | Redirected to `/auth` as expected for signed-out state. |

## Dark Mode Runtime Proof

Representative dark cases covered `/`, `/store`, `/help`, and `/privacy` at 390x844 and 1280x720.

| Signal | Result |
| --- | --- |
| `matchMedia('(prefers-color-scheme: dark)')` | `true` in dark-mode cases. |
| Computed root/body color scheme | `dark`. |
| Body background | `rgb(21, 29, 34)`. |
| Footer background | `linear-gradient(rgb(21, 29, 34) 0%, rgba(29, 39, 45, 0.96) 100%)`. |
| Footer border | `rgba(201, 216, 230, 0.16)`. |

## Reduced Motion Runtime Proof

Representative reduced-motion cases covered `/`, `/store`, and `/privacy` at 390x844 and 1280x720.

| Signal | Result |
| --- | --- |
| `matchMedia('(prefers-reduced-motion: reduce)')` | `true` in reduced-motion cases. |
| Footer render | Present on all reduced-motion representative routes. |
| Footer-specific motion | Footer link/action transition duration is reduced by the footer-scoped reduced-motion rule. |
