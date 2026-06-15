# Diff Baseline: Round 05 Trust-Critical Surfaces

Status: Captured before Round 05 implementation
Date: 2026-06-11
Owner: Codex

## Worktree Note

The worktree was already dirty before Round 05. Round 05 attribution must compare implementation changes against the pre-round snapshots in this folder, not against `HEAD`.

## Pre-Implementation Snapshots

| Snapshot | SHA-256 |
| --- | --- |
| `evidence/auth-page.pre-round05.tsx.snapshot` | `13d2e09398b4f55fe63af9766b6febf233545084d7600fc09e775a83bfe47d7f` |
| `evidence/profile-page.pre-round05.tsx.snapshot` | `c42b85fd44cfc5aec387cb1c65426f0c0c976fb1b1d2dac08ee82d988711cba2` |
| `evidence/TagPageClient.pre-round05.tsx.snapshot` | `005f519bf5a674908536e01109f9b607651d38654389c012866561dab6e55f1c` |
| `evidence/tag-page.pre-round05.tsx.snapshot` | `3a279d70d8f045f400636c867a8cf8c48c024124a596a59677f2c1daa864088c` |
| `evidence/store-checkout-page.pre-round05.tsx.snapshot` | `e98556e58dbb5855acddd44bf3754ea9da58d3e622112e3a038ebec3e6faa17c` |
| `evidence/store-orders-page.pre-round05.tsx.snapshot` | `9e961829fe7b266c994ab7d6bc9b9d25dd2101ae387ade23cb76646624eda0b5` |
| `evidence/store-success-page.pre-round05.tsx.snapshot` | `8e2030985cc7baaef649811c1ae821ad86d137ac6670b4ae7f3b35124f395746` |
| `evidence/root-layout.pre-round05.tsx.snapshot` | `c74791ddca310d63bc7d1a8d58d69d0cbd8536136fee6bf175d1e4f9366d6b84` |
| `evidence/globals.pre-round05.css.snapshot` | `be0b54ce3fce571fcfd1e4ad7f8d91561c2cdd4cd5c1ad067004d04a6cfd8ac5` |

## Browser Baseline

Assets directory:

`design/assets/review/website-visual-upgrade-2026-06-11/round-05-trust-critical-surfaces/`

Baseline files:

- `baseline-auth-*.png`
- `baseline-profile-*.png`
- `baseline-tag-sample-id-*.png`
- `baseline-checkout-*.png`
- `baseline-orders-*.png`
- `baseline-success-*.png`
- `round05-baseline-results.json`

## Baseline Facts

| Route key | Current URL behavior | New logs | Overlay | Overflow X | Notes |
| --- | --- | ---: | --- | ---: | --- |
| `auth` | stays `/auth` | 0 | none | 0 | Auth is already strong; mobile is form-first, desktop is split trust/form. |
| `profile` | redirects to `/auth` when logged out | 1 warning per viewport | none | 0 | Warning is Next.js smooth-scroll guidance during redirect. |
| `tag-sample-id` | stays `/tag/sample-id` but renders not-found | 0 | none | 0 | Invalid tag recovery state visible. |
| `checkout` | redirects to `/store` when cart is empty | 1 warning per viewport | none | 0 | Warning is Next.js smooth-scroll guidance during redirect. |
| `orders` | stays `/store/orders` | 0 | none | 0 | Empty/history state visible. |
| `success` | stays `/store/success` | 0 | none | 0 | Missing-session error state visible. |

## Attribution Rule

Final Round 05 diff attribution must list only changes after these snapshots. Pre-existing dirty changes must not be claimed as Round 05 implementation unless modified again during Round 05.
