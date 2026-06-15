# Diff Attribution: Round 12A Homepage Focus Upgrade

Date: 2026-06-12
Owner: Codex

Round 12A attribution is measured against `DIFF_BASELINE.md` and `evidence/baseline/*`, not against the full dirty Git worktree.

## Files Changed In Scope

| File | Round 12A Attribution |
| --- | --- |
| `src/app/page.tsx` | Simplifies active Homepage section order: hero, proof band, workflow, single showcase, final CTA. Removes active render of duplicated hero badges/signals, readiness panel, and separate feature grid. |
| `src/components/HomeClientParts.tsx` | Simplifies hero copy, replaces hero floating info cards with one product tag visual, reduces proof items to three, lightens workflow, and converts showcase to one calm app/tag section. |
| `src/app/globals.css` | Adds/updates Homepage-scoped selectors for reduced visual density, stable hero sizing, proof/workflow/showcase layout, mobile no-overlap behavior, dark-mode support, and final CTA styling. |
| `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-12A-homepage-focus-upgrade/**` | Adds this round's brief, baseline, concept, evidence, screenshots, and review records. |
| `design/review/website-visual-upgrade-2026-06-11/PLAN.md` | Adds Round 12A control-room entry and status. |
| `design/review/website-visual-upgrade-2026-06-11/README.md` | Adds Round 12A folder to the control-room map and status. |

## Files Explicitly Not Changed From Round 12A Baseline

| File | Baseline SHA-256 | Final SHA-256 | Status |
| --- | --- | --- | --- |
| `src/components/Globe.tsx` | `c92e7872f5c328c90e05e09a8dc16a094ebdcc6add40eb5e6a207ee7e1681773` | `c92e7872f5c328c90e05e09a8dc16a094ebdcc6add40eb5e6a207ee7e1681773` | Unchanged from Round 12A baseline. |
| `src/components/GlobeStaticPreview.tsx` | `cedddd4b0c55e9ef63d97c129de34448247592cf1b24f8b883476600b4940914` | `cedddd4b0c55e9ef63d97c129de34448247592cf1b24f8b883476600b4940914` | Unchanged from Round 12A baseline. |
| `src/components/Navbar.tsx` | `aed94cdc44cc2096a616e429b4dc49f60ea18bae06cb6c283dfc9dd59597cb9c` | `aed94cdc44cc2096a616e429b4dc49f60ea18bae06cb6c283dfc9dd59597cb9c` | Unchanged from Round 12A baseline. |
| `src/components/Footer.tsx` | `b5fb15babaab88d996ff6d5fbda3a6c078905ac9ef51c53047de3f53f6a9ab35` | `b5fb15babaab88d996ff6d5fbda3a6c078905ac9ef51c53047de3f53f6a9ab35` | Unchanged from Round 12A baseline. |
| `src/lib/site.ts` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | `bdd66c96f5c43dff9472632a024b4b98661d53eeb157c174abe4a521a149b632` | Unchanged from Round 12A baseline. |
| `public/sw.js` | `fe730d81fb1f2773ec4754a964cb107e06980eba5ca34938195faebfb4ad7819` | `fe730d81fb1f2773ec4754a964cb107e06980eba5ca34938195faebfb4ad7819` | Unchanged from Round 12A baseline. |
| `src/app/robots.ts` | `3b7136aac3508ae6d74c408e1b97aa2dfdeae4624fcdf04b8848741abdfd3781` | `3b7136aac3508ae6d74c408e1b97aa2dfdeae4624fcdf04b8848741abdfd3781` | Unchanged from Round 12A baseline. |
| `src/app/sitemap.ts` | `57a85f98fa3fa27e2b612e9f1d38b3ed45fbaa042479965a176f43efc7c7bee4` | `57a85f98fa3fa27e2b612e9f1d38b3ed45fbaa042479965a176f43efc7c7bee4` | Unchanged from Round 12A baseline. |

## Final Hashes

| File | SHA-256 After Round 12A |
| --- | --- |
| `src/app/page.tsx` | `ef4533414b7ce0b0f8b84972c1db148b82d61b1b1effe62d714e775f39f94149` |
| `src/components/HomeClientParts.tsx` | `e6de5dd5d87edbb4978fef768ce995067bb943905e252be6174abb1ec1ee84a9` |
| `src/app/globals.css` | `5fd0cc216d2460d57586d209a3b5b2a9e3f2f680905e993a172b18a6168ef2b8` |
| `round12a_homepage_evidence.cjs` | `4af4c2d18da751442cabac20def66325d018f7769839677baebf569a3b485359` |
| `homepage-evidence-summary.json` | `2478c5575e55d5fb0b279e48216209374049fcabd79ef417498fd22d6f665ea8` |
