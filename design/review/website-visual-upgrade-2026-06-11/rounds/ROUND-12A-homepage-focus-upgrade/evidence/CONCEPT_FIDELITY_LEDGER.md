# Concept Fidelity Ledger: Round 12A Homepage Focus Upgrade

Date: 2026-06-12
Concept: `evidence/concepts/homepage-focus-concept.png`
Rendered reference: `evidence/screenshots/home-desktop-1280x720-light-no-preference.png`

## Comparison Points

| Area | Concept evidence | Implementation evidence | Result |
| --- | --- | --- | --- |
| First-viewport hierarchy | Large headline, short copy, two CTAs, one product visual, next proof band visible. | Browser and matrix screenshots show the same hierarchy; proof band visible at 1280x720 and 390x844. | Pass |
| Deduplication | Three proof pillars, no repeated badge/card grid in hero. | Active route has `proofItems: 3`, `legacyHeroCards: 0`, `readinessCards: 0`, `phoneScreenCards: 0`. | Pass |
| Product visual | One clean globe/map visual plus smart tag cue. | Existing live Globe remains, with one CSS tag visual and no floating info cards. | Pass with implementation-native adaptation |
| Section rhythm | Hero, proof band, flow, showcase, final CTA. | `page.tsx` active route follows this sequence. | Pass |
| Layout/no overlap | No crowded floating overlays. | Matrix reports `criticalOverlap: false` in all cases. | Pass |
| Palette | True white/light blue, PawPal blue, soft teal, restrained orange. | Existing PawPal tokens preserved; backgrounds simplified and dark mode supported. | Pass |
| Typography | Strong but readable hero type and compact UI labels. | Mobile h1 compressed after Browser review; CTAs and proof text fit. | Pass |

## Intentional Deviations

- The concept uses a polished static globe/map render with a tag. The implementation keeps the existing interactive Globe component to preserve current product behavior and scope boundaries.
- The concept shows full top navigation inside the mockup. Navbar source was protected and unchanged; the existing site Navbar remains.

## Above-The-Fold Copy Diff

Allowed/expected copy appears in the implementation:

- `PawPal pet safety for every walk`
- `Built in Belgium, PawPal connects live walks, smart finder profiles, and local pet help in one calm product surface.`
- `Open Live Map`
- `Shop Smart Tags`

No new hero eyebrow, kicker, badge, fake metric, or unsupported product claim was added.
