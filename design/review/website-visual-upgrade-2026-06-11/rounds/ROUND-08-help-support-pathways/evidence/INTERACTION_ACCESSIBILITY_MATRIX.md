# Interaction And Accessibility Matrix: Round 08

Status: Final evidence captured
Date: 2026-06-11

Authoritative JSON:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-08-help-support-pathways/round08-after-interaction-accessibility-results.json`

## Environment

- Route: `/help`
- Viewport: 390x844
- Scheme: dark
- Reduced motion: reduce
- Relevant app logs: 0
- Hydration logs: 0

## Interaction Results

| Interaction | Result |
| --- | --- |
| Primary contact `mailto:hello@pawpal.be` visible | PASS |
| Support card email `mailto:hello@pawpal.be` visible | PASS |
| Store support paths visible (`View store`, `Shop or replace a tag`) | PASS |
| `Open Globe` navigates to `/globe` | PASS |
| `View store` navigates to `/store` | PASS |
| Keyboard focus reaches contact, globe, and store actions | PASS |

## Accessibility Notes

- Help retains a single route-level `h1`.
- Link text is descriptive for contact, globe, store, tag replacement, and email support actions.
- Focus traversal reaches meaningful Help actions.
- No shared primitive source changed in Round 08.
