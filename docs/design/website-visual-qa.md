# PawPal Website Visual QA - P2-C Batch 5

Date: 2026-07-07

## Scope

- Branch: `task/p2c5`
- Evidence directory: `evidence/p2c5/`
- Capture tool: Playwright Chromium, 1440x1000 viewport, full page screenshots.
- Capture settings: `prefers-reduced-motion: reduce`; seeded `pawpal-consent-v1=essential` so the cookie banner does not cover the page body/footer.
- In-app Browser note: the Browser plugin backend was unavailable in this session (`agent.browsers.list()` returned no browsers), so Playwright was used for evidence.

## Residual Style Cleanup

- Removed old bypasses and dead compatibility styles:
  - legacy `body::after` pet-doodle wallpaper with embedded color values.
  - old generic dark-mode compatibility remaps for `.bg-white`, `.bg-gray-*`, `.text-gray-*`, and `.shadow-*`.
  - old soft-tone foreground compatibility remaps after component classes were migrated to `text-paw-on-*-soft`.
- Routed remaining source styles through the token layer:
  - component inline shadows, overlays, marker styles, globe atmosphere, footer/navbar CSS, and popup font/shadow values now use PawPal variables or token classes.
  - token-only primitives added for inverse ink, shadow ink, and globe canvas.
- Residual scan result:
  - post-token `globals.css` scan has no `hex/rgb/rgba` literals after the token definition area.
  - component/page source scan has no old generic Tailwind color classes or old soft-tone foreground combos.
  - full `src` literal scan only reports token definitions and shadow variables inside `src/app/globals.css`.

## Page Verdicts

| Route / state | Screenshot | Verdict | Severity | Notes |
| --- | --- | --- | --- | --- |
| Home - light | `home-light.png` | OK | None | Cream surface, rounded cards, flow section, app showcase, CTA, and footer render consistently after reduced-motion capture. |
| Home - dark | `home-dark.png` | Blemish | Low | Layout and contrast are OK. The app mockup asset keeps a white matte inside the dark showcase, which reads as a minor asset-mode mismatch. |
| About | `about-light.png` | OK | None | Long page, ecosystem cards, timeline, CTA, and footer have consistent spacing and readable contrast. |
| Store - light | `store-light.png` | OK | None | Product cards, category pills, search, cart links, and footer align correctly; no button clipping in final capture. |
| Store - dark | `store-dark.png` | OK | None | Dark token layer is consistent; product cards and action buttons remain readable. |
| Auth | `auth-light.png` | OK | None | Login form, segmented control, feature cards, and footer are aligned and readable. |
| Globe | `globe-light.png` | Blemish | Medium | The page falls back to static map preview with "Live map rendering is unavailable in this browser." Visual fallback is coherent, but the live globe/map state was not verified. |
| Group sample | `group-sample.png` | Blemish | Medium | `/group/sample` resolves to the site 404/fallback in this local environment. The fallback is visually OK, but a real group detail state was not captured. |
| Checkout before payment | `checkout-light.png` | OK | None | Shipping step and order summary render before payment; no overflow after using a real cart item shape. Disabled review button is readable enough for its disabled state. |
| Guidelines | `guidelines-light.png` | OK | None | Hero, tabs, cards, and footer are consistent with the cream/depth system. |
| 404 | `not-found-light.png` | OK | None | 404 fallback is polished, readable, and matches the site shell. |
| Admin reports login wall | `admin-reports-login.png` | OK | None | Unauthenticated `/admin/reports` reaches the login wall via `/auth?next=/admin/reports`; login state is visually consistent. |

## Not Fully Captured

- Real group detail state: not captured. `/group/sample` has no matching local data and resolves to the 404 fallback.
- Live globe/map state: not captured. Chromium evidence rendered the designed static fallback instead of the live map.
