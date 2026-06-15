# Valid Finder State Matrix: Round 09 NFC Finder Emergency States

Status: PASS
Date: 2026-06-11

## Default Valid State

Route used during temporary harness validation: `/round09-fixture/phone`

| Requirement | Result |
| --- | --- |
| 390x844, 768x1024, 1280x720, 1440x900 | PASS |
| Light, dark, reduced-motion | PASS |
| Meaningful render | 12/12 |
| Visible framework overlay | 0/12 |
| Horizontal overflow | 0/12 |
| Console warn/error logs | 0 |
| Page errors | 0 |
| Phone contact href | `tel:+32470123456` |
| Deep link href | `pawpal://tag/round09-fixture` |
| Store href | `/store` |

Key screenshots:

- `screenshots/after-valid-default-phone-light-390x844.png`
- `screenshots/after-valid-default-phone-dark-390x844.png`
- `screenshots/after-valid-default-phone-light-1280x720.png`
- `screenshots/after-valid-default-phone-dark-1280x720.png`

Evidence consistency note:

- `after-round09-playwright-results.json` reports `metrics.firstViewport.petIdentity=false` for fixture rows because the script used a single-line regex and the heading wraps across lines.
- The visible screenshots above show `Help Milo get home.` in the first viewport at 390x844 and 1280x720.
- This is a detector false negative, not a runtime or visual failure.

## Edge States

| State | Viewports | Modes | Result | Notes |
| --- | --- | --- | --- | --- |
| Email contact | 390x844, 1280x720 | light/dark/reduced | PASS | `mailto:avery.finder-support@example.com` |
| Hidden contact | 390x844, 1280x720 | light/dark/reduced | PASS | No `Contact owner now` CTA. |
| Long text | 390x844, 1280x720 | light/dark/reduced | PASS | No horizontal overflow. |
| Empty/missing data | 390x844, 1280x720 | light/dark/reduced | PASS | Missing avatar, missing owner, null breed/age/blood, empty sections all render explicit states. |

Rollup:

- Edge states: 24/24 meaningful render.
- Visible framework overlays: 0.
- Horizontal overflow failures: 0.
- Console warn/error logs: 0.
- Page errors: 0.
- Pet identity detector false negative is handled by screenshot evidence:
  - `screenshots/after-edge-long-light-390x844.png`
  - `screenshots/after-edge-long-light-1280x720.png`

## Missing Tag Fallback

Development server:

- `/tag/sample-id` meaningful render: 12/12.
- Visible framework overlay: 0/12.
- Horizontal overflow: 0/12.
- Console warn/error logs: 0.
- Development server can intermittently emit the Next performance-measurement page error recorded in `COMMAND_RESULTS.md`.

Production smoke:

- `next start -p 3001` `/tag/sample-id`: 12/12 meaningful render.
- Console warn/error logs: 0.
- Page errors: 0.
- Horizontal overflow: 0.
- Dark proof: 4/12 dark-mode checks had `matchDark: true`.
- Reduced-motion proof: 4/12 reduced checks had `matchReducedMotion: true`.
