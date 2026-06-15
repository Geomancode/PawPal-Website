# Diff Baseline: Round 11 Footer Utility Endcap

Status: Complete
Date: 2026-06-12
Owner: Codex

Round 11 diff attribution will compare final changes against these hashes and snapshots, not against the full dirty working tree.

## Baseline Hashes

| File | SHA-256 Before Round 11 | Status before Round 11 |
| --- | --- | --- |
| `src/components/Footer.tsx` | `4330c9e92efc76133cc4171e46d35609ebc1ef119e31ce941afb07383d834fb8` | Modified before Round 11 (` M`) |
| `src/app/globals.css` | `74ed0a9ba6f814b455c3d2daa98e4ad5fccd102756215860f15bf84886ee5d49` | Modified before Round 11 (` M`) |
| `src/lib/site.ts` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | Untracked before Round 11 (`??`) |
| `src/components/PawPalLogo.tsx` | `beae75adf80fb8c255cf81905983891bd5c3a9462faab61d827932a04d0971e1` | Clean before Round 11 |

## Snapshot Paths

- `evidence/baseline/Footer.tsx.txt`
- `evidence/baseline/globals.css.txt`
- `evidence/baseline/site.ts.txt`
- `evidence/baseline/PawPalLogo.tsx.txt`

## Attribution Rules

- `Footer.tsx` is the primary implementation file.
- `globals.css` may only receive footer-scoped selectors.
- `site.ts` and `PawPalLogo.tsx` are read-only unless a blocker is approved by all four leads.
- No other application source file is approved for Round 11 implementation.
