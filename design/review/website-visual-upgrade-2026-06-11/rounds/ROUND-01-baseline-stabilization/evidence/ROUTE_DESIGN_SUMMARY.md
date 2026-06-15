# Round 01 Route Design Summary

Date: 2026-06-11
Status: Complete

This table is the design-lead comparison sheet for future rounds. It summarizes the first-viewport signal, route character, decoration load, and hierarchy conflict for every baseline route.

## Route Summary Table

| Route | Route character | First-viewport core signal / CTA | Decoration load | Visual hierarchy conflict | Next design implication |
| --- | --- | --- | --- | --- | --- |
| `/` | Marketing/editorial | Mobile H1 at `top: 201`; `Open Live Map` at `top: 803`; `Shop Smart Tags` at `top: 863`; globe canvas at `top: 1284`. | High | Core product proof is below the first mobile viewport; signal rail and copy consume the opening space before the globe appears. | Compact the hero and bring map/globe proof into the mobile first viewport. |
| `/store` | Commerce | Mobile search at `top: 517`; category filters at `top: 1037`; first visible `Add` action at `top: 1647`. | High | Commerce action is delayed by a tall marketing header and trust-card stack. | Convert to compact commerce header and move filters/products up. |
| `/globe` | Tool/map | Desktop map renders immediately; nearby panel, weather strip, layer controls, nav, and map controls share the first viewport. | Medium-high | Map is dominant but several HUD layers compete for attention. | Move toward a dedicated map shell with calmer, grouped controls. |
| `/auth` | Trust/safety account | Auth route renders non-empty form/account entry content. | Medium | Account entry shares the broader decorative site language rather than a calmer trust-first surface. | Keep form immediate and reduce decorative account-page framing in later trust round. |
| `/profile` | Trust/safety account | Signed-out `/profile` redirects to `/auth`. | Medium | Redirect is non-blank, but Profile itself cannot be visually judged without auth/session state. | Preserve redirect; later validate signed-in profile task regions separately. |
| `/about` | Marketing/editorial | About page renders with no runtime blocker. | Medium-high | About still appears aligned with the repeated marketing hero/card language. | Shift toward quieter editorial proof and fewer repeated decorative motifs. |
| `/tag/sample-id` | Trust/safety rescue | Invalid tag route shows H1 at `top: 307`; `Back home` at `top: 545`; `Shop smart tags` at `top: 605`. | Medium | Invalid state is calm, but it is not a real emergency/finder state. | Later validate real valid-tag rescue state with contact visible/hidden sample data. |
| `/store/checkout` | Commerce checkout | Empty-session route redirects to `/store`. | High via Store redirect | Checkout-specific empty/cart state is not visible in this baseline. | Later verify checkout with cart/session data before visual checkout changes. |
| `/store/orders` | Commerce account/orders | `My Orders` at `top: 313`; `Browse Products` at `top: 725`. | Low-medium | Empty state has a clear next step, but content sits low in the first viewport. | Keep clear recovery action; tighten vertical rhythm if touched. |
| `/store/success` | Commerce confirmation | Missing-session state shows `We could not verify this payment` at `top: 524`; `Back to Store` at `top: 648`. | Low-medium | Message is clear but vertically delayed by top spacing. | Preserve recoverability; tighten confirmation/error state spacing if touched. |

## Cross-Route Design Notes

- Home and Store remain the highest-priority first-viewport fixes.
- Globe should be treated as a tool surface, not another marketing page.
- Auth/Profile/Tag should converge on calmer trust/safety density.
- Store checkout/success/orders need state-specific validation before deeper commerce changes.
- Dark-mode and reduced-motion visual checks remain follow-up items because Round 01 tooling could not emulate those media states.

