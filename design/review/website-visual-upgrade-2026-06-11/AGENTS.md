# Agent Roster and Responsibility Boundaries

Status: Active
Date: 2026-06-11

This file defines the exact responsibility boundaries for the four lead agents and the implementer. The intent is to avoid both overlap-driven confusion and responsibility gaps.

## Roster

| Role | Agent | Agent ID | Primary authority |
| --- | --- | --- | --- |
| QA Lead | Linnaeus | `019eb645-d447-7232-8ed4-a69ee9464645` | Runtime quality, regression, evidence completeness |
| Product Lead | Plato | `019eb645-d4f9-7833-9f93-a12a8d20b85b` | User value, journey clarity, conversion and trust outcomes |
| Engineering Lead | McClintock | `019eb645-d65b-7e12-b643-2dfec225adbb` | Architecture, code quality, build safety, maintainability |
| Design Lead | Laplace | `019eb645-d808-7f50-a440-4e2034cbb9a6` | Visual system, layout, hierarchy, brand expression |
| Plan Implementer | Codex | Current thread | Execution, file stewardship, evidence packaging, signoff routing |

## Boundary Rules

1. Each domain has exactly one primary decision owner.
2. Other leads may flag cross-domain risks, but they must route the final decision to the primary owner.
3. A lead may block only the gate they own.
4. A cross-domain issue must be recorded in both the flagging lead's acceptance file and the primary owner's file.
5. The implementer may not treat silence as approval.
6. The implementer may not start the next round until all four signatures are recorded.
7. No lead may expand the approved round scope without a new round brief.
8. No lead may request unrelated refactors, data changes, auth/payment changes, or deployment changes unless the current round explicitly includes them.
9. If a topic appears to have no owner, Engineering owns the first classification step and must assign it to the correct primary owner before work continues.
10. If two leads disagree, the implementer records the conflict and pauses the next round until the user or primary owner resolves it.
11. Each row in the responsibility matrix has exactly one accountable owner. If a topic needs two kinds of judgment, it must be split into two rows instead of sharing ownership.

## RACI Matrix

Legend:

- A: Accountable final gate owner.
- R: Responsible evidence producer or implementation owner.
- C: Consulted reviewer.
- I: Informed.

| Area | QA | Product | Engineering | Design | Implementer |
| --- | --- | --- | --- | --- | --- |
| Round scope and non-goals | C | A | C | C | R |
| User journey and task priority | C | A | I | C | R |
| Conversion path clarity | C | A | I | C | R |
| Trust and safety messaging | C | A | C | C | R |
| Visual hierarchy | C | C | I | A | R |
| Brand tokens and visual language | I | C | C | A | R |
| Route-specific character | C | C | I | A | R |
| Responsive runtime defects | A | C | C | C | R |
| Responsive visual composition | C | C | C | A | R |
| Browser runtime validation | A | C | C | C | R |
| Console errors and visual blockers | A | I | C | C | R |
| Build, lint, type, and test health | C | I | A | I | R |
| Component boundaries and CSS architecture | C | I | A | C | R |
| Performance and bundle risk | C | C | A | I | R |
| Accessibility compliance evidence | A | C | C | C | R |
| Accessibility visual quality | C | C | C | A | R |
| Interaction behavior | A | C | C | C | R |
| Interaction visual states | C | C | C | A | R |
| Empty/loading/error runtime behavior | A | C | C | C | R |
| Empty/loading/error visual presentation | C | C | C | A | R |
| Dark-mode runtime defects | A | C | C | C | R |
| Dark-mode visual quality | C | C | C | A | R |
| Motion and reduced-motion behavior | A | C | C | C | R |
| Motion visual taste | C | C | C | A | R |
| Data/auth/payment permission boundaries | C | C | A | I | R |
| Evidence folder completeness | A | C | C | C | R |
| Final signoff record | C | C | C | C | A/R |

No row may contain two `A` entries. If a future concern does not fit a row, the implementer must add a new row with exactly one accountable owner before the next round starts.

## QA Lead Boundary

QA owns whether the changed site actually works when rendered.

QA may judge:

- Browser render success.
- Breakpoints and viewport defects.
- Console errors.
- Visual regressions that block usage.
- Interaction failures.
- Accessibility evidence completeness.
- Missing screenshots or missing test records.
- Broken states: empty, loading, error, long text, no image, unauthenticated, weather failure, checkout/order states.

QA may not judge as final owner:

- Whether the product strategy is right.
- Whether the visual style is on brand.
- Whether the code architecture is maintainable.

If QA sees those issues, QA records them as cross-domain flags.

## Product Lead Boundary

Product owns whether the work improves the intended user and business outcome.

Product may judge:

- User task clarity.
- Route purpose.
- CTA priority.
- Store shopping path clarity.
- Trust and safety narrative.
- Conversion or rescue-flow risk.
- Whether the round solves the approved problem.
- Whether tradeoffs are acceptable for users.

Product may not judge as final owner:

- Pixel-level visual taste.
- Build architecture.
- Exact browser defect classification.

If Product sees those issues, Product records them as cross-domain flags.

## Engineering Lead Boundary

Engineering owns whether the implementation is safe, maintainable, and technically bounded.

Engineering may judge:

- Files touched and architecture boundaries.
- Component design and CSS ownership.
- Build/lint/test result interpretation.
- Performance risk.
- Dependency and library usage.
- Auth, Supabase, Stripe, data, permission, and deployment boundaries.
- Whether the code change is reversible and reviewable.

Engineering may not judge as final owner:

- Brand expression.
- Product-market or conversion priority.
- Runtime visual polish unless it reveals technical breakage.

If Engineering sees those issues, Engineering records them as cross-domain flags.

## Design Lead Boundary

Design owns whether the experience is visually coherent, brand-aligned, and route-appropriate.

Design may judge:

- Visual hierarchy.
- Spacing, density, alignment, and composition.
- Brand token usage.
- Typography, radius, shadows, icons, and image direction.
- Route character.
- Decoration reduction.
- Dark-mode visual quality.
- Motion taste and reduced-motion visual completeness.
- Interaction state visual quality.

Design may not judge as final owner:

- Build correctness.
- Product conversion tradeoffs.
- Runtime defect severity outside visual impact.

If Design sees those issues, Design records them as cross-domain flags.

## Implementer Boundary

The implementer owns execution and records, not unilateral acceptance.

The implementer must:

- Keep this folder current.
- Create each round folder before implementation.
- Keep changes inside approved scope.
- Produce evidence and acceptance files.
- Route deliverables to all four leads.
- Record signatures exactly.
- Stop at blockers.

The implementer must not:

- Mark a lead as approved without an explicit response.
- Start a new round after a blocker.
- Hide known issues.
- Expand scope because a change looks convenient.
- Revert unrelated user work.
