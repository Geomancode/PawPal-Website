# Diff Baseline: Round 12 Footer CSS Ownership Extraction

Status: Complete
Date: 2026-06-12
Owner: Codex

Round 12 diff attribution will compare final changes against these hashes and snapshots, not against the full dirty working tree.

## Baseline Hashes

| File | SHA-256 Before Round 12 | Status before Round 12 |
| --- | --- | --- |
| `src/components/Footer.tsx` | `8bfde1c8666aa2dc6cfe840db33f14c298343384e6a2a9faddc1c1c044892d1f` | Modified before Round 12 (` M`) |
| `src/app/globals.css` | `c2ecf788450c691d4febd990624bb1114c661fbbe17a9b8f3e48a21cc4db6609` | Modified before Round 12 (` M`) |
| `src/components/Footer.module.css` | `ABSENT` | Absent before Round 12 |
| `src/lib/site.ts` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | Untracked before Round 12 (`??`) |
| `src/components/PawPalLogo.tsx` | `beae75adf80fb8c255cf81905983891bd5c3a9462faab61d827932a04d0971e1` | Clean before Round 12 |

## Snapshot Paths

- `evidence/baseline/Footer.tsx.txt`
- `evidence/baseline/globals.css.txt`
- `evidence/baseline/site.ts.txt`
- `evidence/baseline/PawPalLogo.tsx.txt`

## Attribution Rules

- `Footer.tsx` and the new `Footer.module.css` are the primary implementation files.
- `globals.css` may only remove Footer-owned selectors extracted into the CSS module.
- `site.ts`, `PawPalLogo.tsx`, `ConditionalFooter.tsx`, and route files are read-only unless a blocker is approved by all four leads.
- No other application source file is approved for Round 12 implementation.
