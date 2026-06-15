# Design Measurements: Round 06

Date: 2026-06-11
Status: PASS

Raw measurement source:
`design/assets/review/website-visual-upgrade-2026-06-11/round-06-about-cross-route-polish/round06-after-browser-results.json`

## First-Viewport Measurements

| Route | Viewport | H1 bounds | Primary panel bounds | Section path bounds | Result |
| --- | --- | --- | --- | --- | --- |
| `/about` | 390x844 | top `181`, bottom `361`, width `311` | hero top `96`, bottom `675`, width `358` | product system starts in next visible band | PASS |
| `/about` | 1280x720 | top `226`, bottom `406`, width `493` | hero top `96`, bottom `680`, width `575` | product system panel visible beside hero | PASS |
| `/help` | 390x844 | top `166`, bottom `246`, width `358` | support route panel visible in first viewport | n/a | PASS |
| `/help` | 1280x720 | top `166`, bottom `286`, width `708` | support route panel visible beside hero | n/a | PASS |
| `/privacy` | 390x844 | top `191`, bottom `311`, width `308` | hero top `112`, bottom `808`, width `358` | nav top `832`, width `358` | PASS |
| `/privacy` | 1280x720 | top `207`, bottom `327`, width `622` | hero top `112`, bottom `444`, width `1120` | nav top `468`, width `960` | PASS |
| `/terms` | 390x844 | top `191`, bottom `311`, width `308` | hero top `112`, bottom `780`, width `358` | nav top `804`, width `358` | PASS |
| `/terms` | 1280x720 | top `207`, bottom `387`, width `622` | hero top `112`, bottom `504`, width `1120` | nav top `528`, width `960` | PASS |

## Visual QA Notes

- About now uses a two-column product proof/system layout on desktop and stacked proof-to-system progression on mobile.
- About no longer uses decorative pet doodles or unsupported market-stat tiles as the first visual argument.
- Help remains source-unchanged and continues to prioritize support pathways in the first viewport.
- Privacy and Terms use anchor navigation and three section cards so legal content is scannable without adding decorative imagery.
- No nested card stacks were introduced.
- No decorative blobs, gradient orbs, new doodles, stock images, or new assets were introduced.
- Text wrapping was visually inspected on updated screenshots for 390x844 and 1280x720.

## Document Readability

| Route | Evidence | Result |
| --- | --- | --- |
| `/privacy` | H1, short intro, three trust rows, anchor nav, and three section cards; mobile long paragraphs stay inside `358px` content width. | PASS |
| `/terms` | H1, short intro, three legal trust rows, anchor nav, and three section cards; mobile long paragraphs stay inside `358px` content width. | PASS |

