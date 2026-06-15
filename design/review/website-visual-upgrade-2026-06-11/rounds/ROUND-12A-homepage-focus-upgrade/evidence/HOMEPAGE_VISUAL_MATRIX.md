# Homepage Visual Matrix: Round 12A

Date: 2026-06-12
Base URL: `http://localhost:3001`
Source: `homepage-visual-matrix-results.json`

## Summary

| Area | Result |
| --- | --- |
| Total matrix cases | 10 |
| Passed cases | 10 |
| Relevant console warnings/errors | 0 |
| Hydration warnings | 0 |
| Page errors | 0 |
| Framework overlays | 0 |
| Horizontal overflow | 0 |
| Critical first-viewport overlap | 0 failing cases |
| Proof-band first-viewport hint | Present in all matrix cases |
| Screenshots | 10 matrix screenshots plus 1 interaction screenshot |

## Route Coverage

| Case | Result | Proof hint visible | Notes |
| --- | --- | ---: | --- |
| 390x844 light | Pass | 27px | Mobile hero, CTAs, globe, tag, and next proof hint fit without horizontal overflow. |
| 768x1024 light | Pass | 132px | Tablet composition stable. |
| 1280x720 light | Pass | 79px | Desktop first viewport shows hero plus next proof band hint. |
| 1440x900 light | Pass | 118px | Wide composition stable. |
| 390x844 dark | Pass | 27px | Dark runtime proof recorded. |
| 768x1024 dark | Pass | 132px | Dark tablet composition stable. |
| 1280x720 dark | Pass | 79px | Dark desktop composition stable. |
| 1440x900 dark | Pass | 118px | Dark wide composition stable. |
| 390x844 reduced motion | Pass | 27px | Reduced-motion runtime proof recorded. |
| 1280x720 reduced motion | Pass | 79px | Reduced-motion desktop proof recorded. |

## Dark Mode Runtime Proof

Representative dark cases covered mobile and desktop.

| Signal | Result |
| --- | --- |
| `matchMedia('(prefers-color-scheme: dark)')` | `true` in dark-mode cases. |
| Computed `color-scheme` | `dark`. |
| Body background | `rgb(21, 29, 34)`. |
| Homepage hero background | `linear-gradient(rgb(21, 29, 34) 0%, rgb(21, 29, 34) 58%, rgb(29, 39, 45) 100%)`. |
| Hero tag background | Dark component gradient recorded in JSON. |

## Reduced Motion Runtime Proof

Representative reduced-motion cases covered 390x844 and 1280x720.

| Signal | Result |
| --- | --- |
| `matchMedia('(prefers-reduced-motion: reduce)')` | `true` in reduced-motion cases. |
| Active CSS animations | 0 on measured Homepage cases. |
| Extra animated hero hint | Removed from active route composition. |
| Legacy floating hero cards | Removed from active route composition. |
| Critical overlap | False in reduced-motion cases. |
