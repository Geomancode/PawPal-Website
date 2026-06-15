# Accessibility And Focus Matrix: Round 07

Status: Final evidence captured
Date: 2026-06-11

Authoritative JSON:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-after-interaction-accessibility-results.json`

## Environment

- Scheme: dark
- Reduced motion: reduce
- Relevant app logs: 0
- Hydration logs: 0

## Focus Evidence

Focus evidence was captured for:

| Route | Evidence |
| --- | --- |
| `/` | Skip link, logo link, primary nav links show visible `outline-style: solid` and `outline-width: 3px`. |
| `/store` | Skip link, logo link, primary nav links show visible `outline-style: solid` and `outline-width: 3px`. |
| `/auth` | Skip link, logo link, primary nav links show visible `outline-style: solid` and `outline-width: 3px`; email input accepts keyboard text. |
| `/tag/sample-id` | Skip link, logo link, primary nav links show visible `outline-style: solid` and `outline-width: 3px`; rescue/contact links remain visible in dark mode. |
| `/store/checkout` | Skip link, logo link, primary nav links show visible `outline-style: solid` and `outline-width: 3px`; disabled checkout state remains visibly distinct. |
| `/globe` | Skip link, logo link, primary nav links show visible `outline-style: solid` and `outline-width: 3px`. |

## Interaction Results

| Interaction | Result |
| --- | --- |
| Store search accepts typed text | PASS |
| Store category filter clickable | PASS |
| Store product action buttons remain visible after filtering | PASS |
| Auth visible email field accepts text | PASS |
| Checkout disabled state then review step | PASS |

## Disabled And Status State Evidence

- Disabled button evidence captured with visible opacity and readable text color.
- Checkout can advance to review after required fields are entered.
- Auth error/success containers retain `role="alert"` and `role="status"` in source after motion wrappers were removed.

## Scope Note

Shared primitive source files were snapshotted but not changed in this round. Focus evidence still includes nav and primary-route controls because global dark-mode and route-level motion changes affect their rendered states.
