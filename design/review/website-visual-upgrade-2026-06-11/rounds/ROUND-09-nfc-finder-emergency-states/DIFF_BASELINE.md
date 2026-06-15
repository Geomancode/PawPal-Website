# Diff Baseline: Round 09 NFC Finder Emergency States

Status: Captured
Date: 2026-06-11
Owner: Codex

## Purpose

This file will record pre-implementation SHA-256 hashes and dirty/untracked state for every approved or conditional source file before Round 09 implementation starts.

Round 09 final diff attribution must compare against these snapshots, not against the full dirty working tree.

## Approved And Conditional Files To Snapshot

Approved:

- `src/app/tag/[id]/TagPageClient.tsx`
- `src/app/globals.css`

Conditional:

- `src/app/tag/[id]/page.tsx`
- `src/app/not-found.tsx`
- `src/components/ui/StatusMessage.tsx`
- `src/components/ui/AppDeepLinkButton.tsx`

## Snapshot Status

Captured before Round 09 source implementation. Implementation may begin after this baseline and `evidence/PRE_IMPLEMENTATION_BASELINE.md` are both present.

## Git Dirty / Untracked State At Baseline

```text
 M src/app/globals.css
 M src/app/tag/[id]/TagPageClient.tsx
 M src/app/tag/[id]/page.tsx
?? design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-09-nfc-finder-emergency-states/
?? src/app/not-found.tsx
?? src/components/ui/AppDeepLinkButton.tsx
?? src/components/ui/StatusMessage.tsx
```

The source files above already had dirty or untracked state before Round 09 implementation. Final diff attribution must compare against the snapshot files below.

## Source Hashes At Baseline

| File | SHA-256 |
| --- | --- |
| `src/app/tag/[id]/TagPageClient.tsx` | `91abf9870bf2ae80e2c073b2a9d9b543ad3c7f2cd8d2be444da8083df21ec054` |
| `src/app/globals.css` | `0602ca8f2335e34f4ec531a9e54f4072cbce5d2a866938aeb2b18c75ce18840a` |
| `src/app/tag/[id]/page.tsx` | `3a279d70d8f045f400636c867a8cf8c48c024124a596a59677f2c1daa864088c` |
| `src/app/not-found.tsx` | `e89e77941b437aba6a0cdd959dd62585e3d3477538e70bf74779e662bbbd4755` |
| `src/components/ui/StatusMessage.tsx` | `c1928f79f24aab42b5e660ddf054753f622f0af70d0ddba8c8d8c7ca47b7a736` |
| `src/components/ui/AppDeepLinkButton.tsx` | `2636049f455fa3a6858a4ae39232e6aa23efc4ec98008f1ee5857e734ca67406` |

## Snapshot Files

| Source | Snapshot |
| --- | --- |
| `src/app/tag/[id]/TagPageClient.tsx` | `evidence/snapshots/src_app_tag_id_TagPageClient.tsx.txt` |
| `src/app/globals.css` | `evidence/snapshots/src_app_globals.css` |
| `src/app/tag/[id]/page.tsx` | `evidence/snapshots/src_app_tag_id_page.tsx.txt` |
| `src/app/not-found.tsx` | `evidence/snapshots/src_app_not-found.tsx` |
| `src/components/ui/StatusMessage.tsx` | `evidence/snapshots/src_components_ui_StatusMessage.tsx.txt` |
| `src/components/ui/AppDeepLinkButton.tsx` | `evidence/snapshots/src_components_ui_AppDeepLinkButton.tsx.txt` |
