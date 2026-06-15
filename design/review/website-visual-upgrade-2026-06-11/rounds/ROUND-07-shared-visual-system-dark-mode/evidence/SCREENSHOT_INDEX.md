# Screenshot Index: Round 07

Status: Final screenshot evidence captured
Date: 2026-06-11

Assets directory:

- `design/assets/review/website-visual-upgrade-2026-06-11/round-07-shared-visual-system-dark-mode/`

## Primary Routes

Primary after screenshots cover 6 routes x 2 viewports x 2 schemes = 24 screenshots.

Routes:

- `/` -> `home`
- `/store` -> `store`
- `/auth` -> `auth`
- `/tag/sample-id` -> `tag-sample-id`
- `/store/checkout` -> `checkout`
- `/globe` -> `globe`

Naming pattern:

- `after-light-{routeName}-390x844.png`
- `after-light-{routeName}-1280x720.png`
- `after-dark-{routeName}-390x844.png`
- `after-dark-{routeName}-1280x720.png`

Authoritative JSON:

- `round07-after-playwright-results.json`

## Smoke Routes

Smoke after screenshots cover 5 routes x 2 viewports x 2 schemes = 20 screenshots.

Routes:

- `/about` -> `about`
- `/privacy` -> `privacy`
- `/terms` -> `terms`
- `/store/orders` -> `store-orders`
- `/store/success` -> `store-success`

Naming pattern:

- `after-smoke-light-{routeName}-390x844.png`
- `after-smoke-light-{routeName}-1280x720.png`
- `after-smoke-dark-{routeName}-390x844.png`
- `after-smoke-dark-{routeName}-1280x720.png`

Authoritative JSON:

- `round07-after-smoke-playwright-results.json`

## Visual Notes

- Dark screenshots for Home, Store, Auth, Tag fallback, Checkout, and Globe all render on the intended dark PawPal page surface.
- Auth and Tag no longer rely on page-level entrance opacity during reduced-motion screenshots.
- Home, Store, and Checkout motion surfaces no longer begin from hidden/low-opacity initial states under the final validation setup.
