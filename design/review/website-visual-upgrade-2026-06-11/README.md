# PawPal Website Visual Upgrade Control Room

Status: Active, Round 12A complete
Date: 2026-06-12
Implementer: Codex
Current preview: http://localhost:3001

This folder is the control room for the PawPal website visual/UI upgrade. It records the plan, role boundaries, per-round evidence, acceptance files, and four-lead signoff history.

No UI implementation round may begin until the previous round has a completed signoff record from QA, Product, Engineering, and Design.

## Source Plan

- Canonical visual upgrade plan: [WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md](../../../WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md)
- Project design system reference: [DESIGN.md](../../../../DESIGN.md)

## Directory Map

```text
website-visual-upgrade-2026-06-11/
  README.md
  PLAN.md
  AGENTS.md
  GATES.md
  templates/
    ROUND_BRIEF.md
    ACCEPTANCE_QA.md
    ACCEPTANCE_PRODUCT.md
    ACCEPTANCE_ENGINEERING.md
    ACCEPTANCE_DESIGN.md
    SIGNOFF_RECORD.md
  rounds/
    ROUND-00-workflow-setup/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-01-baseline-stabilization/
      ROUND_BRIEF.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-02-store-first-viewport/
      ROUND_BRIEF.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-03-homepage-first-viewport/
      ROUND_BRIEF.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-04-globe-tool-surface/
      ROUND_BRIEF.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-05-trust-critical-surfaces/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-06-about-cross-route-polish/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-07-shared-visual-system-dark-mode/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-08-help-support-pathways/
      ROUND_BRIEF.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-09-nfc-finder-emergency-states/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-10-profile-task-readiness/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      FINAL_REVIEW_PACKET.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-11-footer-utility-endcap/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-12-footer-css-ownership/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
    ROUND-12A-homepage-focus-upgrade/
      ROUND_BRIEF.md
      DIFF_BASELINE.md
      IMPLEMENTATION_RECORD.md
      ACCEPTANCE_QA.md
      ACCEPTANCE_PRODUCT.md
      ACCEPTANCE_ENGINEERING.md
      ACCEPTANCE_DESIGN.md
      SIGNOFF_RECORD.md
      evidence/
```

## Workflow Contract

1. The implementer proposes one scoped round.
2. The implementer creates a round folder from the templates.
3. The implementer performs only the approved changes for that round.
4. The implementer captures evidence: code summary, command results, browser checks, screenshots, responsive measurements, known risks.
5. The implementer produces four role-specific acceptance files.
6. QA, Product, Engineering, and Design each review only their assigned domain.
7. The implementer updates `SIGNOFF_RECORD.md`.
8. The next round is blocked unless all four leads return `通过`, or `有条件通过` with explicit owner, condition, and follow-up round.

Any `不通过` blocks the next round.

## Authority Model

The four leads are reviewers and gate owners. Codex remains the implementation owner and file steward. Reviewer agents may request changes, flag risks, and block their own gate, but they do not edit implementation files during this workflow unless the user explicitly changes the model.

All agents remain inside the current workspace, sandbox, plugin, and approval constraints. No agent may expand permissions, touch production data, or change unrelated files as part of this workflow.
