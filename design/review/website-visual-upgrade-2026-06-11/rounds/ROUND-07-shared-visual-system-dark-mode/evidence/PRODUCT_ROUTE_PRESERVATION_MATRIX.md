# Product Route-Preservation Matrix: Round 07

Status: Approved by four leads
Date: 2026-06-11

## Primary Routes

| Route | Route Purpose | Primary CTA Or Task Control | Trust / Recovery State | Behavior Preserved | Product Copy Changed In Round 07 | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Public product introduction for PawPal safety, tags, and walking intelligence. | `Open Live Globe`, `Shop Smart Tags`, and later repeated app/store CTAs. | Public trust proof and safety positioning remain visible. | Yes. CTA hrefs remain `/globe` and `/store`; no product logic changed. | No. Round 07 only changed visual tokens and motion behavior. | Primary matrix PASS 4/4 route captures. |
| `/store` | Product discovery and cart entry. | Search, category filters, product add/details actions, checkout link. | Secure checkout promise and cart drawer remain visible. | Yes. Cart load/save, add/update/remove, admin/orders routes, subscription checkout endpoint, and checkout href are preserved. | No Round 07 product promise change. | Primary matrix PASS 4/4 captures; interactions PASS. |
| `/auth` | Signed-out account access. | Email/password form, login/signup switch, submit button. | Error and success messages remain semantically exposed. | Yes. `signIn`, `signUp`, redirect to `/profile`, input state, and form submit behavior are preserved. | No. | Primary matrix PASS 4/4 captures; auth typing PASS. |
| `/tag/sample-id` | Missing/sample tag rescue profile fallback. | Contact owner when available, app deep link, shop tag fallback. | Missing contact/info panels remain readable in dark mode. | Yes. Pet/owner data display, `mailto:`/`tel:` contact selection, deep link, and store fallback href are preserved. | No. | Primary matrix PASS 4/4 captures. |
| `/store/checkout` | Cart checkout shipping, review, and Stripe handoff. | Shipping form, continue to review, Stripe checkout button. | Empty/default redirect and disabled review state remain distinct. | Yes. `/api/checkout` URL, POST method, JSON body structure, cart loading, and return-to-store route are preserved. | No. | Primary matrix PASS 4/4 captures; checkout interaction PASS. |
| `/globe` | Live map shell for nearby safety, places, quests, and weather context. | Map controls/search/weather shell. | Map loading/loaded shell remains legible. | Yes. MapLibre source/style/layer/geolocation and WeatherTicker fetch/parsing files were not changed in Round 07. | No. | Primary matrix PASS 4/4 captures. |

## Smoke Routes

Smoke coverage was required because global dark-mode CSS affects nav/footer and deep-route panels.

| Route | Route Purpose | Primary CTA Or Task Control | Trust / Recovery State | Behavior Preserved | Product Copy Changed In Round 07 | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `/about` | Brand and product context. | Internal navigation and page CTAs. | Company/product trust narrative remains readable. | Yes. Source not changed in Round 07. | No. | Smoke matrix PASS 4/4 captures. |
| `/privacy` | Privacy policy. | Legal navigation. | Legal text and section navigation remain readable. | Yes. Source not changed in Round 07. | No. | Smoke matrix PASS 4/4 captures. |
| `/terms` | Terms of service. | Legal navigation. | Legal text and section navigation remain readable. | Yes. Source not changed in Round 07. | No. | Smoke matrix PASS 4/4 captures. |
| `/store/orders` | Store order lookup/history surface. | Order/status controls. | Order trust surface remains readable. | Yes. Source not changed in Round 07. | No. | Smoke matrix PASS 4/4 captures. |
| `/store/success` | Store checkout success surface. | Post-checkout continuation controls. | Success confirmation surface remains readable. | Yes. Source not changed in Round 07. | No. | Smoke matrix PASS 4/4 captures. |

## Product Decision

Round 07 is a visual-system hardening round. It does not introduce a new product promise, new journey, new payment behavior, new auth behavior, new map behavior, or new rescue behavior.
