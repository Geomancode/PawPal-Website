# Diff Baseline: Round 10 Profile Task Readiness

Status: Complete
Date: 2026-06-11
Owner: Codex

This file must be populated before implementation begins. Round 10 diff attribution will compare final source changes against these snapshots and hashes, not against the full dirty working tree.

## Files To Snapshot

Approved implementation files:

- `src/app/profile/page.tsx`
- `src/app/profile/ProfileWorkspaceView.tsx`, new route-local non-page presentation module, absent before Round 10 implementation.
- `src/app/globals.css`

Conditional files:

- `src/components/ui/StatusMessage.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`

## Baseline Hashes

| File | SHA-256 Before Round 10 | Dirty/untracked status before Round 10 |
| --- | --- | --- |
| `src/app/profile/page.tsx` | `c42b85fd44cfc5aec387cb1c65426f0c0c976fb1b1d2dac08ee82d988711cba2` | Modified before Round 10 implementation (` M`) |
| `src/app/profile/ProfileWorkspaceView.tsx` | N/A | Absent before Round 10 implementation |
| `src/app/globals.css` | `afa53dca548372707a67f52d75ce4d04b80e3cd0c59e1e25ba7af118c06936bd` | Modified before Round 10 implementation (` M`) |
| `src/components/ui/StatusMessage.tsx` | `c1928f79f24aab42b5e660ddf054753f622f0af70d0ddba8c8d8c7ca47b7a736` | Untracked before Round 10 implementation (`??`) |
| `src/components/ui/Button.tsx` | `f786856a95f8ae9217736fe765d33bbc8f96b730669fc764f69415cd555059bf` | Clean before Round 10 implementation |
| `src/components/ui/Input.tsx` | `6998df9e6b0f9401774c3e843b2c9ef90a553f4ac26bfc896973908e18d21114` | Clean before Round 10 implementation |

## Snapshot Paths

Snapshots are stored under `evidence/baseline/` with `.txt` suffixes to prevent Next.js route compilation:

- `evidence/baseline/profile-page.tsx.txt`
- `src/app/profile/ProfileWorkspaceView.tsx` was absent before Round 10 implementation, so no source snapshot exists.
- `evidence/baseline/globals.css.txt`
- `evidence/baseline/StatusMessage.tsx.txt`
- `evidence/baseline/Button.tsx.txt`
- `evidence/baseline/Input.tsx.txt`
