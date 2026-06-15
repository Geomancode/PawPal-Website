# Command Results: Round 09 NFC Finder Emergency States

Status: PASS
Date: 2026-06-11

## Static Checks

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | PASS | Final run after temporary fixture removal. |
| `npm run build` | PASS | Final run after temporary fixture removal; route table contains `/tag/[id]` and no fixture route. |

## Browser / Playwright Evidence

Browser plugin status:

- Browser connection succeeded.
- Browser file writing failed with `EPERM` when trying to persist screenshots/JSON into the workspace.
- Playwright fallback was used for persisted evidence, under the previously approved fallback approach.

Playwright evidence:

| Evidence | Result | File |
| --- | --- | --- |
| `/tag/sample-id` before matrix | PASS render/overflow/overlay, with known dev `performance.measure` noise | `before-tag-sample-playwright-results.json` |
| Valid finder and edge states after matrix | PASS 48/48 meaningful render, 0 overlay, 0 overflow, 0 console logs | `after-round09-playwright-results.json` |
| `/tag/sample-id` production smoke | PASS 12/12, 0 console logs, 0 page errors | `production-tag-sample-results.json` |
| Globals smoke routes | PASS 18/18 | `globals-smoke-results.json` |
| Interaction/accessibility checks | PASS 4/4 | `interaction-accessibility-checks.json` |

## Production Smoke Server

- Started temporary `next start -p 3001` after successful build.
- Captured `production-tag-sample-results.json`.
- Stopped PID `73706`.
- Confirmed `curl -I http://localhost:3001/tag/sample-id` fails after shutdown.

## Known Tooling Noise

Development-server `/tag/sample-id` checks can intermittently emit:

```text
Failed to execute 'measure' on 'Performance': '​TagPage' cannot have a negative time stamp.
```

This was not present in valid fixture states, globals smoke routes, or production `/tag/sample-id` smoke. It is recorded as a dev-server performance-measurement noise item, not a final runtime blocker.
