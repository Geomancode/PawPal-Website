# Acceptance Gates

Status: Active
Date: 2026-06-11

These gates apply to every round. Each gate must be marked `PASS`, `CONDITIONAL`, `BLOCKED`, or `N/A` in the relevant role acceptance file.

## Global Gates

| Gate | Primary owner | Required evidence |
| --- | --- | --- |
| Scope gate | Product | Round brief, changed files, non-goals |
| User journey gate | Product | Affected route flow notes, CTA priority notes |
| Trust and safety gate | Product | Messaging and state notes |
| Runtime render gate | QA | Browser page checks, screenshot paths, console notes |
| Responsive runtime gate | QA | 390/768/1280/1440 defect records where relevant |
| Responsive visual composition gate | Design | 390/768/1280/1440 composition notes where relevant |
| Accessibility gate | QA | Focus, contrast notes, keyboard/touch-state notes |
| Visual hierarchy gate | Design | Before/after screenshots, first-viewport measurements |
| First-viewport hierarchy gate | Design | Mobile and desktop core-action position notes |
| Brand/design-system gate | Design | Token/component/style notes |
| Route character gate | Design | Marketing, Commerce, Trust/Safety, or Tool/Map classification notes |
| Decoration gate | Design | Rationale for kept or added decoration |
| Dark-mode visual quality gate | Design | Dark-mode screenshots or explicit unaffected note |
| Motion behavior gate | QA | Runtime motion and reduced-motion behavior check |
| Motion visual quality gate | Design | Motion taste, duration/easing notes, visual completeness |
| Architecture gate | Engineering | Files changed, boundary notes |
| Build gate | Engineering | `npm run lint`, `npm run build`, or blocker note |
| Dependency/build-system gate | Engineering | Dependency, config, package, bundler, or build-system change notes |
| Performance gate | Engineering | Bundle/runtime risk notes |
| Permission/data gate | Engineering | Auth, payment, database, API, deployment boundary notes |
| Environment/deployment gate | Engineering | Environment variable, deploy, CI, and production-boundary notes |
| Evidence gate | QA | Evidence folder completeness |
| Four-signature gate | Implementer | `SIGNOFF_RECORD.md` |

## Signature States

`通过`: The lead approves the round for their domain.

`有条件通过`: The lead approves only if all listed conditions are recorded with owner and target round. These conditions must not hide a blocker.

`不通过`: The lead blocks the next round. The implementer must resolve or rescope before continuing.

`未提交`: No valid response yet. The next round is blocked.

## Four-Signature Rule

The next implementation round may start only when:

- QA is `通过`, or `有条件通过` with accepted conditions.
- Product is `通过`, or `有条件通过` with accepted conditions.
- Engineering is `通过`, or `有条件通过` with accepted conditions.
- Design is `通过`, or `有条件通过` with accepted conditions.

Any `不通过` or `未提交` blocks the next round.

## Evidence Naming

Evidence files should use stable names:

```text
evidence/
  before-home-390.png
  after-home-390.png
  browser-check-home.md
  command-results.md
  responsive-table.md
  console-log-notes.md
```

Round 00 is governance-only, so it may include documentation evidence instead of screenshots.

## Non-Documentation Round Requirements

From Round 01 onward:

- QA evidence must explicitly record URL/title, non-empty render, no blocking overlay, console errors/warnings, 390/768/1280/1440 breakpoints, screenshot paths, interaction steps, keyboard focus, reduced-motion behavior, dark-mode coverage, and key states. "Checked" is not enough.
- Product evidence must explicitly record primary user scenario, primary CTA or conversion path, first-viewport product goal, trust/safety state coverage, product tradeoffs, and unresolved product risks.
- Engineering evidence must explicitly record dependency, build-system, database, API, deployment, and environment-variable boundaries.
- `npm run lint` and `npm run build` must be executed for non-documentation rounds unless a blocker is recorded with owner and follow-up round.
- Design evidence must explicitly record route character, responsive visual composition, first-viewport hierarchy, dark-mode visual quality, and motion/reduced-motion behavior.
