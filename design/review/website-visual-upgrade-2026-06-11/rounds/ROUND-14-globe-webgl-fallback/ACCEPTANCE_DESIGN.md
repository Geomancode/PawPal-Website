# Design Acceptance

Round: 14 Globe WebGL Fallback Hardening  
Reviewer: Design Lead / Laplace  
Status: 有条件通过

## Design Scope

Design owns visual hierarchy, route fit, responsive composition, spacing, overlap, typography, and market-ready polish of the fallback state.

## Evidence Reviewed

- `evidence/screenshots/fallback-globe-390x844.png`
- `evidence/screenshots/fallback-globe-768x1024.png`
- `evidence/screenshots/fallback-globe-1280x720.png`
- `evidence/screenshots/fallback-globe-1440x900.png`
- `evidence/screenshots/normal-globe-1280x720-delayed.png`

## Design Findings

- The fallback reads as a deliberate Globe route state, not a generic error card.
- Mobile copy and actions fit without overlapping the compact Navbar or static preview.
- Desktop composition preserves the approved full-screen Globe atmosphere.
- Fallback CTA hierarchy is clear: retry first, commerce/help paths secondary.
- Mobile action hit areas are 44px.
- Static preview labels are legible and do not collide with the main copy.

## Design Decision

有条件通过.

Condition:

- Owner: Design Lead / Laplace
- Target follow-up round: Round 15 Globe Live-State Visual Polish
- Required follow-up: Review and polish normal `/globe` live-state overlay density, weather ticker clipping, and first-visit tutorial pressure.

This condition does not block Round 14 fallback approval because fallback itself meets the design bar.
