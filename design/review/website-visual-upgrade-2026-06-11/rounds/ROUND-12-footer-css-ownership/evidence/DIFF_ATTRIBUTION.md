# Diff Attribution: Round 12 Footer CSS Ownership Extraction

Date: 2026-06-12
Owner: Codex

Round 12 attribution is measured against `DIFF_BASELINE.md` and `evidence/baseline/*`, not against the full dirty Git worktree.

## Files Changed In Scope

| File | Round 12 Attribution |
| --- | --- |
| `src/components/Footer.tsx` | Imports `Footer.module.css` and replaces global `footer-*` class hooks with module class references. Public copy, links, mailto targets, semantics, and Tailwind utilities remain preserved. |
| `src/components/Footer.module.css` | New component-owned CSS module containing the extracted Round 11 Footer visual, interaction, dark-mode, and reduced-motion rules. |
| `src/app/globals.css` | Removed only the extracted Footer-owned selectors from the base and dark-mode areas. |
| `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-12-footer-css-ownership/**` | Added this round's brief, baseline, evidence, screenshots, and signoff records. |

## Files Explicitly Not Changed

| File | Baseline SHA-256 | Final SHA-256 | Status |
| --- | --- | --- | --- |
| `src/lib/site.ts` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | Unchanged from Round 12 baseline. |
| `src/components/PawPalLogo.tsx` | `beae75adf80fb8c255cf81905983891bd5c3a9462faab61d827932a04d0971e1` | `beae75adf80fb8c255cf81905983891bd5c3a9462faab61d827932a04d0971e1` | Unchanged from Round 12 baseline. |

## Final Hashes

| File | SHA-256 After Round 12 |
| --- | --- |
| `src/components/Footer.tsx` | `b5fb15babaab88d996ff6d5fbda3a6c078905ac9ef51c53047de3f53f6a9ab35` |
| `src/components/Footer.module.css` | `2f71b3d441bbaa0b9eeb2fa998a1ae454f4d2b6b996e74891108ec80f03eb5f2` |
| `src/app/globals.css` | `69233b19a9db4fe9d72fa0c14ada782aa0145376112ced1462df83e40e38c283` |
| `round12_footer_css_evidence.cjs` | `12b7e494b2a66b7aeb12dbb9b4018a2c5c37f04cbb8565882274e453027345fe` |
| `footer-css-evidence-summary.json` | `e0e7101f077eb40fb7bd6024cbc9994a059b7df5d72d21f5154cc4beefae2726` |

## Scoped Diff Proof

- `src/components/Footer.module.css` was absent before Round 12 and is new after the round.
- `src/app/globals.css` diff contains only removal of the prior Footer-owned selectors:
  - `.footer-visual`
  - `.footer-main`
  - `.footer-nav-heading`
  - `.footer-link-list`
  - `.footer-link`
  - `.footer-email-link`
  - `.footer-action-link`
  - `.footer-contact-block`
  - `.footer-bottom`
- Runtime evidence confirms generated `Footer-module__...` classes are present and legacy `footer-*` runtime classes are absent.
