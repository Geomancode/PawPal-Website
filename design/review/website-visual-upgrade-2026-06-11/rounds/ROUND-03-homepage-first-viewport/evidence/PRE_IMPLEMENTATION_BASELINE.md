# Pre-Implementation Baseline: Round 03 Homepage First Viewport

Date: 2026-06-11
Owner: Codex

## Snapshot Purpose

These snapshots freeze the approved Round 03 implementation files before any Round 03 code edits. Final attribution must compare implementation files against these snapshots.

## Snapshots

| Source file | Snapshot | SHA-256 |
| --- | --- | --- |
| `src/app/page.tsx` | `home-page.pre-round03.tsx.snapshot` | `eed3f37cedcd3fa71f5142974c9be6e4a1807e7d1f1f4b73b48a5bcae0e8c364` |
| `src/components/HomeClientParts.tsx` | `HomeClientParts.pre-round03.tsx.snapshot` | `894f5c17ab7b6f01887111ac0e449cd780ebdd74cadbe4386cb2c1b8db14014f` |

## Round 01 Homepage Baseline Measurements

From `ROUND-01-baseline-stabilization/evidence/BASELINE_REPORT.md`:

- Mobile 390x844:
  - H1 top: `201`.
  - `Open Live Map` top: `803`.
  - `Shop Smart Tags` top: `863`.
  - Globe canvas top: `1284`.
- Desktop 1280x720:
  - Globe canvas visible in first viewport at `top: 258`, size `538x538`.

## Round 03 Target Summary

- Move the primary CTA group upward.
- Bring the globe/map visual into or partially into the first mobile viewport.
- Keep desktop product proof visible.
- Reduce first-viewport floating callouts to no more than two on desktop.

