# Pre-Implementation Baseline: Round 05 Trust-Critical Surfaces

Date: 2026-06-11
Tooling: Browser/IAB

## Captured Routes

| Key | Requested route | Final URL behavior | Viewports |
| --- | --- | --- | --- |
| `auth` | `/auth` | `/auth` | 390x844, 768x1024, 1280x720, 1440x900 |
| `profile` | `/profile` | Redirects to `/auth` when unauthenticated | 390x844, 768x1024, 1280x720, 1440x900 |
| `tag-sample-id` | `/tag/sample-id` | Renders app not-found state | 390x844, 768x1024, 1280x720, 1440x900 |
| `checkout` | `/store/checkout` | Redirects to `/store` when cart is empty | 390x844, 768x1024, 1280x720, 1440x900 |
| `orders` | `/store/orders` | `/store/orders` | 390x844, 768x1024, 1280x720, 1440x900 |
| `success` | `/store/success` | `/store/success` missing-session state | 390x844, 768x1024, 1280x720, 1440x900 |

## Health Summary

| Route key | Meaningful render | Visible overlay | Overflow X | New logs |
| --- | --- | --- | ---: | ---: |
| `auth` | PASS | none | 0 | 0 |
| `profile` | PASS | none | 0 | 1 warning per viewport |
| `tag-sample-id` | PASS | none | 0 | 0 |
| `checkout` | PASS | none | 0 | 1 warning per viewport |
| `orders` | PASS | none | 0 | 0 |
| `success` | PASS | none | 0 | 0 |

The `profile` and `checkout` warnings are the same Next.js message: `Detected scroll-behavior: smooth on the <html> element... add data-scroll-behavior="smooth"`.

## Baseline Assets

Screenshots and raw JSON are in:

`design/assets/review/website-visual-upgrade-2026-06-11/round-05-trust-critical-surfaces/`

Raw JSON:

- `round05-baseline-results.json`

## Baseline Notes

- No implementation code has been changed for Round 05 yet.
- Profile authenticated interior is not validated because no authenticated Browser state is available.
- Checkout form state is not yet validated because empty cart redirects to Store; future evidence must use normal Store UI to create a cart if checkout form visuals change.
