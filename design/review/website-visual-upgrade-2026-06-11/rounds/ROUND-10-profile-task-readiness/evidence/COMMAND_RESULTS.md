# Command Results: Round 10 Profile Task Readiness

Date: 2026-06-11
Owner: Codex

## Final Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint completed after implementation and after harness removal. |
| `npm run build` | Pass | Next.js production build completed after harness removal. |
| `find src/app -path '*round10*' -print` | Pass | No output after deleting temporary harness file and empty directories. |
| `ROUND10_BASE_URL=http://localhost:3001 node design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-10-profile-task-readiness/evidence/round10_profile_evidence.cjs` | Pass | Full Playwright matrix generated 62/62 passing visual cases from production preview after design rework. |
| `node design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-10-profile-task-readiness/evidence/round10_profile_evidence.cjs --interactions-only` | Pass | Used before design rework to refresh interaction evidence; final full 3001 run also includes passing interaction evidence. |

## Final Build Route Table Check

The final `npm run build` route table includes `/profile` and does not include `/round10-profile-fixture/[state]`.

## Tooling Notes

- Playwright was not a project dependency, so a temporary runtime was installed under `/private/tmp/round10-pw-runtime` after approval.
- The evidence script accepts `ROUND10_BASE_URL`; final evidence used `http://localhost:3001` because the existing `localhost:3000` dev preview had a stale CSS cache.
- The evidence script stores raw console/page errors and also classifies known benign development-environment noise into separate fields.
- Browser plugin smoke preceded Playwright use for the known local target.
