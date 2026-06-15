# Diff Baseline: Round 12A Homepage Focus Upgrade

Date: 2026-06-12
Owner: Codex

Round 12A attribution must be measured against these hashes and `evidence/baseline/*`, not against the full dirty Git worktree.

## Baseline Hashes

| File | SHA-256 | Git status at baseline |
| --- | --- | --- |
| `src/app/page.tsx` | `ecff9836ffb914c8e83d2d37012a4c6d1f0f0c8ef065455fb3cba1595c4797c9` | ` M` |
| `src/components/HomeClientParts.tsx` | `2cac1d1876444157dd6b3875c1e26ce107bd053ab4b10eb42344e5c00fe04051` | ` M` |
| `src/app/globals.css` | `69233b19a9db4fe9d72fa0c14ada782aa0145376112ced1462df83e40e38c283` | ` M` |
| `design/review/website-visual-upgrade-2026-06-11/PLAN.md` | `250cfa139762db686b3343007e1b58429027ebdfa91a74481539e3421f82b4a0` | `??` |
| `design/review/website-visual-upgrade-2026-06-11/README.md` | `7a729886d25d90f29bb301798446d9cf56c35db70d20befb8910ac1ded7a01a0` | `??` |

## Protected Read-Only Boundary Hashes

These files are dirty or untracked before Round 12A and are protected by the brief. They must remain unchanged unless all four leads reapprove scope.

| File | SHA-256 | Git status at baseline |
| --- | --- | --- |
| `src/components/Globe.tsx` | `c92e7872f5c328c90e05e09a8dc16a094ebdcc6add40eb5e6a207ee7e1681773` | ` M` |
| `src/components/GlobeStaticPreview.tsx` | `cedddd4b0c55e9ef63d97c129de34448247592cf1b24f8b883476600b4940914` | `??` |
| `src/components/Navbar.tsx` | `aed94cdc44cc2096a616e429b4dc49f60ea18bae06cb6c283dfc9dd59597cb9c` | ` M` |
| `src/components/Footer.tsx` | `b5fb15babaab88d996ff6d5fbda3a6c078905ac9ef51c53047de3f53f6a9ab35` | ` M` |
| `src/lib/site.ts` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | `??` |
| `public/sw.js` | `fe730d81fb1f2773ec4754a964cb107e06980eba5ca34938195faebfb4ad7819` | ` M` |
| `src/app/robots.ts` | `3b7136aac3508ae6d74c408e1b97aa2dfdeae4624fcdf04b8848741abdfd3781` | `??` |
| `src/app/sitemap.ts` | `57a85f98fa3fa27e2b612e9f1d38b3ed45fbaa042479965a176f43efc7c7bee4` | `??` |

## Baseline Snapshots

- `evidence/baseline/page.tsx.txt`
- `evidence/baseline/HomeClientParts.tsx.txt`
- `evidence/baseline/globals.css.txt`
- `evidence/baseline/PLAN.md.txt`
- `evidence/baseline/README.md.txt`
- `evidence/baseline/Globe.tsx.txt`
- `evidence/baseline/GlobeStaticPreview.tsx.txt`
- `evidence/baseline/Navbar.tsx.txt`
- `evidence/baseline/Footer.tsx.txt`
- `evidence/baseline/site.ts.txt`
- `evidence/baseline/sw.js.txt`
- `evidence/baseline/robots.ts.txt`
- `evidence/baseline/sitemap.ts.txt`

## Attribution Rules

- In-scope source changes: `src/app/page.tsx`, `src/components/HomeClientParts.tsx`, and Homepage-scoped selectors in `src/app/globals.css`.
- In-scope records: this Round 12A folder and control-room `README.md` / `PLAN.md` status entries.
- Protected read-only boundary files listed above must be hash-checked in final evidence to prove Round 12A did not touch them.
- Any change outside this list requires all four leads to reapprove scope before implementation continues.
