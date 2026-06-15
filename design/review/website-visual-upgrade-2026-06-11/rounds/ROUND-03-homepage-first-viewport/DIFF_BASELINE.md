# Diff Baseline: Round 03 Homepage First Viewport

Date: 2026-06-11
Owner: Codex

## Purpose

Record the dirty worktree and homepage file state before Round 03 implementation. Round 03 attribution must compare against the snapshots in `evidence/`, not against `HEAD`, because the repository already contains pre-existing user/generated changes.

## Expected Implementation Files

- `src/app/page.tsx`
- `src/components/HomeClientParts.tsx`

## Pre-Implementation Snapshot Files

| Source file | Snapshot | SHA-256 |
| --- | --- | --- |
| `src/app/page.tsx` | `evidence/home-page.pre-round03.tsx.snapshot` | `eed3f37cedcd3fa71f5142974c9be6e4a1807e7d1f1f4b73b48a5bcae0e8c364` |
| `src/components/HomeClientParts.tsx` | `evidence/HomeClientParts.pre-round03.tsx.snapshot` | `894f5c17ab7b6f01887111ac0e449cd780ebdd74cadbe4386cb2c1b8db14014f` |

## Existing Homepage Dirty Diff Against HEAD

Before Round 03 implementation, the two expected implementation files were already dirty relative to `HEAD`:

| File | Insertions | Deletions |
| --- | ---: | ---: |
| `src/app/page.tsx` | 10 | 5 |
| `src/components/HomeClientParts.tsx` | 187 | 53 |

Stat summary:

`2 files changed, 197 insertions(+), 58 deletions(-)`

## Full Worktree Note

The broader worktree remains dirty from earlier/user/generated work. Round 03 must not revert unrelated files and must not attribute pre-existing changes to this round.

Known dirty areas before Round 03 include:

- Multiple route files under `src/app/`
- `src/app/globals.css`
- `src/components/`
- planning/evidence assets
- public/offline/service worker/manifest changes

## Stop Rule

If implementation needs files outside `src/app/page.tsx` and `src/components/HomeClientParts.tsx`, pause and request an amended brief plus four-lead approval.

