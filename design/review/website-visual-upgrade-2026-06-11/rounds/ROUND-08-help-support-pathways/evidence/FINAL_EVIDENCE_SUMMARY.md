# Final Evidence Summary: Round 08

Status: Approved by four leads
Date: 2026-06-11
Base URL: `http://localhost:3000`

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | PASS | ESLint completed without errors. |
| `npm run build` | PASS | Next.js production build compiled, type-checked, collected page data, and generated 26 static pages. |

## Browser / Playwright Path

- Browser tooling had previously shown repo-write and interaction instability, and the user allowed Playwright fallback.
- Final evidence used bundled Playwright/Chromium without changing project dependencies.
- Chromium launch required escalated execution because macOS sandboxing blocked browser process startup.

## Baseline

Baseline assets:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-08-help-support-pathways/round08-baseline-help-results.json`
- `baseline-{light|dark}-help-{390x844|768x1024|1280x720|1440x900}.png`

Baseline note:

- Baseline page rendered with status 200, meaningful text, relevant logs 0, hydration logs 0, overflow 0, and dark proof failures 0.
- Initial baseline script treated an empty Next dev `nextjs-portal` as an overlay, so its automated pass count is not used as final quality status.

## Final Matrix

| Matrix | Routes | Viewports | Schemes | Reduced Motion | Result |
| --- | --- | --- | --- | --- | --- |
| Help after matrix | `/help` | 390x844, 768x1024, 1280x720, 1440x900 | light, dark | reduce | PASS 8/8 |
| Help interaction/accessibility | `/help`, `/globe`, `/store` navigation checks | 390x844 | dark | reduce | PASS 6/6 |

Final JSON:

- `round08-after-help-results.json`
- `round08-after-interaction-accessibility-results.json`

Final counts:

- After matrix: 8/8 pass; relevant logs 0; hydration logs 0; overflow 0; dark proof failures 0; first-viewport failures 0.
- Interaction/accessibility: 6/6 pass; relevant logs 0; hydration logs 0.

## Dark-Mode Proof

Dark entries record:

- `prefersDark: true`
- dark computed color-scheme/body background evidence
- `pawPage: "#151d22"`

Dark proof failures: 0.

## Triggered Smoke Requirements

- `globals.css` did not change against the Round 08 snapshot, so cross-route smoke from global CSS was not triggered.
- `StatusMessage.tsx` and `AppDeepLinkButton.tsx` did not change against the Round 08 snapshots, so shared-primitive consumer smoke for `/tag/sample-id` and `/store/checkout` was not triggered.
