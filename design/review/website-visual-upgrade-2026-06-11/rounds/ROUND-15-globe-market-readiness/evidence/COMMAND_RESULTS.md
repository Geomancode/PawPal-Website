# Round 15 Command Results

Date: 2026-06-14

## Quality Gates

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | PASS | ESLint completed with no errors after lifecycle guard and evidence script updates. |
| `npm run build` | PASS | Next.js production build compiled and generated 26 static pages successfully after lifecycle guard updates. |
| `node design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-15-globe-market-readiness/evidence/round15_cdp_verify.js` | PASS | 11/11 strict CDP assertions passed; live cases wait for tiles, weather, and markers; diagnostics are clean. |

## Browser Evidence

| Check | Result | Notes |
| --- | --- | --- |
| In-app Browser `/globe` page identity | PASS | URL `http://localhost:3000/globe`, title `Live Pet Globe \| PawPal`. |
| In-app Browser blank-page/framework-overlay check | PASS | DOM contained `PawPal Globe`; no framework overlay or global error. |
| In-app Browser console health | PASS | No relevant warning or error logs. |
| In-app Browser interaction proof | PASS | `Missions` layer toggle changed from active to inactive after click. |
| In-app Browser screenshot | BLOCKED | `Page.captureScreenshot` timed out on live WebGL canvas; CDP screenshots are used as visual evidence. |

## CDP Matrix Summary

Source: `round15_assertion_matrix.json`

| Test | Result |
| --- | --- |
| `live-globe-390x844` | PASS |
| `live-globe-1280x720` | PASS |
| `fallback-globe-390x844` | PASS |
| `fallback-globe-1280x720` | PASS |
| `post-init-context-loss` | PASS |
| `fallback-keyboard-focus` | PASS |
| `fallback-dark-mode` | PASS |
| `fallback-reduced-motion` | PASS |
| `loaded-home-390x844` | PASS |
| `loaded-store-390x844` | PASS |
| `loaded-help-390x844` | PASS |

Post-init context loss trigger:

- `dispatched`: `true`
- `method`: `WEBGL_lose_context`
- `canvasCount`: `1`

Loaded live `/globe` health:

- `live-globe-390x844`: 12 tile resources, 15 markers, 8 weather items, 3 visible mobile-priority weather items, 0 console entries, 0 runtime exceptions, 0 network failures.
- `live-globe-1280x720`: 25 tile resources, 15 markers, 8 visible weather items, 0 console entries, 0 runtime exceptions, 0 network failures.

## Environment Notes

- `localhost:3000` preview was running from the production start server.
- Running headless Chrome/CDP inside the sandbox aborted with `SIGABRT`; the fixed verification script was run with approved elevated execution.
