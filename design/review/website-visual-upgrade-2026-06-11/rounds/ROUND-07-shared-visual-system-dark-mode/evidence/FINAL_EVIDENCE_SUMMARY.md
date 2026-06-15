# Final Evidence Summary: Round 07

Status: Approved by four leads
Date: 2026-06-11
Base URL: `http://localhost:3000`

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | PASS | ESLint completed without errors. |
| `npm run build` | PASS | Next.js production build compiled, type-checked, collected page data, and generated 26 static pages. |

## Browser Path And Fallback

Build Web Apps testing workflow was followed with Browser first.

- Browser baseline worked for light-mode route checks and produced 0 relevant logs and 0 horizontal overflow findings.
- Browser after-validation was not used as the authoritative final evidence because repo JSON writing hit `EPERM` and the interaction click loop later timed out.
- The user explicitly allowed fallback, so Playwright was used for the final durable evidence.
- Browser instability is treated as a tooling limitation, not as an app failure.

## Playwright Final Matrix

| Matrix | Routes | Viewports | Schemes | Reduced Motion | Result |
| --- | --- | --- | --- | --- | --- |
| Primary | `/`, `/store`, `/auth`, `/tag/sample-id`, `/store/checkout`, `/globe` | 390x844, 1280x720 | light, dark | reduce | PASS 24/24 |
| Smoke | `/about`, `/privacy`, `/terms`, `/store/orders`, `/store/success` | 390x844, 1280x720 | light, dark | reduce | PASS 20/20 |
| Interaction/accessibility | `/store`, `/auth`, `/store/checkout` plus focus evidence across all primary routes | dark | dark | reduce | PASS 5/5 |

Final summary JSON:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-after-summary.json`
- Primary: 24/24 pass, relevant logs 0, hydration logs 0, overflow 0, dark proof failures 0.
- Smoke: 20/20 pass, relevant logs 0, hydration logs 0, overflow 0, dark proof failures 0.
- Interaction: 5/5 pass, relevant logs 0, hydration logs 0.

## Dark-Mode Proof

Every dark primary and smoke entry records:

- `prefersDark: true`
- `htmlColorScheme: "dark"`
- `bodyColorScheme: "dark"`
- `bodyBg: "rgb(21, 29, 34)"`
- `pawPage: "#151d22"`

Dark-emulation failures: 0.

## Console And Hydration

- Relevant app console warnings/errors: 0.
- Hydration warnings: 0.
- Raw logs may include GPU/browser warnings or a Next/dev Performance API warning observed around dynamic TagPage timing. These were classified as tooling/browser warnings, not app warnings, and retained in raw JSON with `relevant: false`.
- Code search found no app-owned `performance.measure` implementation added by Round 07.

## Interaction Evidence

Interaction/accessibility JSON:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/round07-after-interaction-accessibility-results.json`

Passed interactions:

- Store search accepts typed text.
- Store category filter is clickable.
- Store product action buttons remain visible after filtering.
- Auth email field accepts typed text.
- Checkout disabled state and review step remain visually and functionally reachable.

## Remaining Limitations

- Browser final evidence is not authoritative because of Browser tooling instability; Playwright is the accepted fallback for this round.
- No real Stripe, Supabase, or external weather/network transaction was executed in final validation; protected behavior was preserved by source-diff attribution and build/runtime checks.
