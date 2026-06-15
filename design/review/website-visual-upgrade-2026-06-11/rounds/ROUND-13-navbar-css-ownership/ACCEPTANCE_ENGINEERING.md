# Engineering Acceptance

Lead: Engineering / McClintock  
Status: 有条件通过

## Gates

- Architecture gate: PASS.
- CSS ownership gate: PASS.
- Build gate: PASS.
- Dependency/build-system gate: PASS; no dependency or build-system changes.
- Permission/data gate: PASS; no auth, API, database, Stripe, Supabase, deploy, or env behavior changed.
- Performance gate: PASS; component CSS extraction should not materially affect bundle/runtime risk.

## Engineering Notes

`Navbar.module.css` now owns active Navbar visual selectors. `globals.css` no longer contains `site-nav`, `nav-link-pill`, `nav-mobile-panel`, or legacy `nav-account` selectors.

The `PwaRuntime.tsx` change is accepted as an incidental QA blocker fix because it only corrects fixed container sizing and does not affect PWA logic.

## Condition

Add a robust `/globe` WebGL fallback so renderer failures do not surface as an app error panel. Owner: Engineering. Target: Round 14.
