# QA Acceptance

Lead: QA / Linnaeus  
Status: 有条件通过

## Gates

- Runtime render gate: PASS for 20/20 Navbar matrix cases.
- Responsive runtime gate: PASS at 390, 768, 1280, and 1440 widths.
- Console/overlay/overflow gate: PASS for Navbar extraction after PWA overflow fix.
- Interaction gate: PASS for mobile hamburger open/close and menu links.
- Accessibility gate: PASS for 44px menu links and visible keyboard focus.
- Evidence gate: PASS with JSON, screenshots, command results, and diff attribution.

## Condition

`/globe` emits a WebGL context creation error in headless Chrome and can show an app-level error panel. This is outside Navbar ownership but blocks final market-readiness. Owner: Engineering + QA. Target: Round 14.
