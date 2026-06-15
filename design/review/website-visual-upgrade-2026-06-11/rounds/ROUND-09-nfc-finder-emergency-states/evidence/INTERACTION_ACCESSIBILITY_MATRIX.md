# Interaction Accessibility Matrix: Round 09 NFC Finder Emergency States

Status: PASS
Date: 2026-06-11

Evidence source: `interaction-accessibility-checks.json`

| Check | Result | Notes |
| --- | --- | --- |
| Phone contact visible | PASS | `Contact owner now` href is `tel:+32470123456`; focus order reaches contact before deep link and Store action. |
| Email contact visible | PASS | `Contact owner now` href is `mailto:avery.finder-support@example.com`; focus order reaches contact before deep link and Store action. |
| Hidden contact | PASS | Hidden-contact status is visible; no misleading `Contact owner now` CTA exists. |
| Store route | PASS | Clicking `Get a PawPal tag` routes to `/store`. |

Accessibility notes:

- Primary contact is a real anchor with `mailto:` or `tel:` href.
- Hidden contact uses existing `StatusMessage` semantics.
- Missing avatar fallback is an icon with decorative `aria-hidden` inside the profile image frame.
- Secondary actions remain anchors and are later in DOM/focus order than the primary rescue/contact state.
- No external `tel:`, `mailto:`, or `pawpal://` action was clicked during validation.
