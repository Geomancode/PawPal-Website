# Diff Attribution: Round 11 Footer Utility Endcap

Date: 2026-06-12
Owner: Codex

Round 11 attribution is measured against `DIFF_BASELINE.md` and `evidence/baseline/*`, not against the full dirty Git worktree.

## Files Changed In Scope

| File | Round 11 Attribution |
| --- | --- |
| `src/components/Footer.tsx` | Added the `contentinfo` label target, converted the link groups into a footer navigation landmark, introduced Footer-only classes, increased link/action hit areas to 44px, and kept existing public links/mailto targets. |
| `src/app/globals.css` | Replaced the decorative Footer grid/dual gradient with a calmer utility surface; added only `.footer-*` selectors plus footer dark/reduced-motion rules. |
| `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-11-footer-utility-endcap/**` | Added this round's implementation, evidence, screenshots, and signoff records. |

## Files Explicitly Not Changed

| File | Baseline SHA-256 | Final SHA-256 | Status |
| --- | --- | --- | --- |
| `src/lib/site.ts` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | Unchanged from Round 11 baseline. |
| `src/components/PawPalLogo.tsx` | `beae75adf80fb8c255cf81905983891bd5c3a9462faab61d827932a04d0971e1` | `beae75adf80fb8c255cf81905983891bd5c3a9462faab61d827932a04d0971e1` | Unchanged from Round 11 baseline. |

## Final Hashes

| File | SHA-256 After Round 11 |
| --- | --- |
| `src/components/Footer.tsx` | `8bfde1c8666aa2dc6cfe840db33f14c298343384e6a2a9faddc1c1c044892d1f` |
| `src/app/globals.css` | `c2ecf788450c691d4febd990624bb1114c661fbbe17a9b8f3e48a21cc4db6609` |
| `round11_footer_evidence.cjs` | `aa89a543afa6158d11ba2ccf14cd726a1f869879efa4e921672d1eda71dda1bb` |
| `footer-evidence-summary.json` | `e0e7101f077eb40fb7bd6024cbc9994a059b7df5d72d21f5154cc4beefae2726` |

## Scoped Diff Summary

- `Footer.tsx`: structural Footer-only changes; no route, auth, store, map, API, database, package, or environment changes.
- `globals.css`: two footer-scoped regions changed: the base `.footer-*` block and the dark-mode `.footer-*` overrides.
- Existing dirty worktree changes outside this scope remain unattributed to Round 11.
