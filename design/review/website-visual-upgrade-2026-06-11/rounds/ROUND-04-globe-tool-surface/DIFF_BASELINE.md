# Diff Baseline: Round 04 Globe Tool Surface

Status: Captured before Round 04 implementation
Date: 2026-06-11
Owner: Codex

## Worktree Note

The worktree was already dirty before Round 04. Round 04 attribution must compare implementation changes against the pre-round snapshots in this folder, not against `HEAD`.

Pre-round status for likely implementation files:

```text
 M src/app/globals.css
 M src/app/globe/page.tsx
 M src/components/GlobeFullPage.tsx
 M src/components/Navbar.tsx
?? src/app/globe/layout.tsx
```

Pre-round diff stat for already dirty Globe-related files:

```text
src/app/globals.css              | 1313 +++++++++++++++++++++++++++++++++++++-
src/app/globe/page.tsx           |   17 +-
src/components/GlobeFullPage.tsx |   90 ++-
```

`src/components/Navbar.tsx` was also already dirty before Round 04 and has been snapshotted.

## Pre-Implementation Snapshots

| Snapshot | SHA-256 |
| --- | --- |
| `evidence/globe-page.pre-round04.tsx.snapshot` | `875ecd04e6a03c690954ed6565dd15cf329c781b72918330ca14c409361b01be` |
| `evidence/globe-layout.pre-round04.tsx.snapshot` | `e4cc229ec33cf4b1fb26873de29d6812dca2b226e00f5cb16f2ab7280e40e16c` |
| `evidence/GlobeFullPage.pre-round04.tsx.snapshot` | `e4e6e731fc5cbf005dd056e7edf12fcd2cbee9d69d31c1f67c262b57300e5c74` |
| `evidence/WeatherTicker.pre-round04.tsx.snapshot` | `bd304153166d6b254cf784a40ffb44c8fc2f448d2efc794688ea0d77ccb4efa2` |
| `evidence/ChatBottomSheet.pre-round04.tsx.snapshot` | `010e0f3f6eef33a5979571b191ab69760998166d2c4068c5d4f608d5f2d738ee` |
| `evidence/GlobeTutorial.pre-round04.tsx.snapshot` | `d31be486b96df3147d504879e3391186d03c3f214dc8522c50e8c5ad7e139ef8` |
| `evidence/Navbar.pre-round04.tsx.snapshot` | `7e0fbbba1a5d879ab82180f301d4c5cc4a9ce3c4554f4bb2b4ecd37f92276dee` |
| `evidence/globals.pre-round04.css.snapshot` | `8f00dc5c0e77e80d51b9767d1ab56e404b513044a38d21af5934bcb834fb4710` |

## Browser Baseline

Assets directory:

`design/assets/review/website-visual-upgrade-2026-06-11/round-04-globe-tool-surface/`

Baseline files:

- `globe-baseline-mobile-390x844.png`
- `globe-baseline-tablet-768x1024.png`
- `globe-baseline-desktop-1280x720.png`
- `globe-baseline-desktop-1440x900.png`
- `round04-globe-baseline-browser-results.json`
- `round04-globe-baseline-tablet-browser-results.json`

Baseline Browser facts:

| Viewport | New logs | Overlay | Overflow | Map canvas | Noted visible issue |
| --- | ---: | --- | ---: | --- | --- |
| 390x844 | 0 | none | 0 | present | Tutorial/weather/layers/nearby/map controls compete vertically. |
| 768x1024 | 0 | none | 0 | present | Tutorial/nav/weather/nearby/layers compete in tablet first viewport. |
| 1280x720 | 0 | none | 0 | present | Tutorial/global nav/weather/nearby/layers/status all compete with map. |
| 1440x900 | 0 | none | 0 | present | Same hierarchy issue at larger desktop. |

## Attribution Rule

Final Round 04 diff attribution must list only changes after these snapshots. Pre-existing dirty changes must not be claimed as Round 04 implementation unless they are modified again during Round 04.
