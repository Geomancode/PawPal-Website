# Final Evidence Summary

Round: 14 Globe WebGL Fallback Hardening  
Date: 2026-06-14  
Status: Ready for four-lead review

## What Was Proved

The Round 13 shared condition is resolved: `/globe` no longer reaches the global app error panel when WebGL is unavailable in the validation environment. It remains inside a route-local Globe fallback state with a static preview and safe next actions.

## Matrix Result

Chrome/CDP matrix: 9/9 PASS

| Case | Result | Key Proof |
| --- | --- | --- |
| `fallback-globe-390x844` | PASS | Fallback visible, no global error, no overflow, 44px mobile actions |
| `fallback-globe-768x1024` | PASS | Fallback visible, no global error, no overflow |
| `fallback-globe-1280x720` | PASS | Fallback visible, no global error, retry remains safe |
| `fallback-globe-1440x900` | PASS | Fallback visible, no global error, no overflow |
| `normal-globe-390x844` | PASS | Live map container present, no fallback, no global error |
| `normal-globe-1280x720` | PASS | Live map container present, no fallback, no global error |
| `smoke-home-390x844` | PASS | Nav present, no global error, no overflow |
| `smoke-store-390x844` | PASS | Nav present, no global error, no overflow |
| `smoke-help-390x844` | PASS | Nav present, no global error, no overflow |

## Interaction Proof

`Try live map` was clicked in the WebGL-unavailable simulation at:

- 390x844
- 1280x720

After the click:

- fallback remained visible
- global error panel remained absent
- horizontal overflow remained absent

## Visual Proof

Screenshots are stored in `evidence/screenshots/`.

Most important review images:

- `fallback-globe-390x844.png`
- `fallback-globe-1280x720.png`
- `normal-globe-1280x720-delayed.png`

Manual image inspection:

- Mobile fallback copy fits without overlapping the Navbar or preview.
- Desktop fallback composition is intentional and not an error-card surface.
- Fallback buttons have clear visual hierarchy and safe destinations.
- Normal live Globe still renders the approved full-screen map shell.

## Browser Method

Primary rendered validation used Browser/IAB for normal `/globe` smoke. WebGL-unavailable simulation used Chrome/CDP because Browser/IAB does not expose a pre-navigation WebGL context override.

## Residual Risk

Real GPU-driver failures can differ from a simulated `getContext` failure. The implementation mitigates this by covering three layers:

- WebGL precheck before MapLibre construction.
- `try/catch` around MapLibre construction.
- MapLibre `error` event handling for WebGL/context/canvas/GPU messages.
