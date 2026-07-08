# P2W1 Website Gap Report

Date: 2026-07-08  
Repo: `/Users/nuemann/Desktop/GeoPet/PawPal-Website`  
Branch: `task/p2w1`  
Scope: read-only website audit against the App PetCompass/P2F4 baseline. No product code, style, config, or assets were changed.

## Evidence

Captured with Playwright Chromium against `next dev -p 3101`.

- Viewport screenshots: `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/screenshots/` - 84 files.
- Full-page screenshots: `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/screenshots/full/` - 84 files.
- Meta JSON: `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/meta/` - 84 page files plus `capture-summary.json`.
- Contact sheets:
  - `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/contact-sheets/desktop-1440__light.png`
  - `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/contact-sheets/mobile-390__light.png`
  - `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/contact-sheets/desktop-1440__dark.png`
  - `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/contact-sheets/mobile-390__dark.png`
- Capture log: `/Users/nuemann/Desktop/GeoPet/evidence/P2W1/capture.log`

Coverage: 21 page routes x 2 widths (`1440x1000`, `390x844`) x light/dark. The site supports dark mode through `prefers-color-scheme`, so both schemes were captured. API routes were inventoried but not screenshotted.

## App Baseline Used

The comparison baseline is:

- Workspace design source: `/Users/nuemann/Desktop/GeoPet/DESIGN.md`.
- PetCompass V2 system: `/Users/nuemann/Desktop/GeoPet/design/next-ui/PETCOMPASS_V2_UIUX_SYSTEM.md`.
- Surface map: `/Users/nuemann/Desktop/GeoPet/design/next-ui/screens/PETCOMPASS_V2_SURFACE_MAPPING.md`.
- Semantic tokens: `/Users/nuemann/Desktop/GeoPet/design/next-ui/tokens/pet-compass-v2.tokens.json`.
- App tokens: `/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart`.
- App P2F4 visual completion evidence:
  - `/Users/nuemann/Desktop/GeoPet/PawPal/docs/design/p2f4-audit-r4.md`: 57 screenshots reviewed, zero new findings.
  - `/Users/nuemann/Desktop/GeoPet/PawPal/docs/design/p2f4-audit-r5.md`: edge/spacing recheck; explicit rule that card groups, action rows, and summary controls must not touch the screen boundary unless intentionally full-bleed media/map/camera/cropper UI.
  - `/Users/nuemann/Desktop/GeoPet/evidence/P2F4/round4/screenshots/`

Baseline summary: App now treats page gutters as a first-class quality gate, uses Paw Blue/Mint/Warm Orange semantic tokens, keeps regular cards around 12/16px radius, reserves larger sheet/hero radii for special surfaces, and gives empty/loading/error states designed surfaces instead of fallback text.

## Route And Component Inventory

Page routes from `src/app/**/page.tsx`:

| Route | Source | Screenshot evidence |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | `evidence/P2W1/screenshots/01-home__desktop-1440__light.png`, `01-home__mobile-390__light.png`; dark variants use `__dark`. |
| `/about` | `src/app/about/page.tsx` | `02-about__desktop-1440__light.png`, `02-about__mobile-390__light.png`; dark variants captured. |
| `/globe` | `src/app/globe/page.tsx` | `03-globe__desktop-1440__light.png`, `03-globe__mobile-390__light.png`; dark variants captured. |
| `/auth` | `src/app/auth/page.tsx` | `04-auth__desktop-1440__light.png`, `04-auth__mobile-390__light.png`; dark variants captured. |
| `/profile` | `src/app/profile/page.tsx` | `05-profile__desktop-1440__light.png`, `05-profile__mobile-390__light.png`; redirects to `/auth` while signed out. |
| `/store` | `src/app/store/page.tsx` | `06-store__desktop-1440__light.png`, `06-store__mobile-390__light.png`; dark variants captured. |
| `/store/checkout` | `src/app/store/checkout/page.tsx` | `07-store-checkout__desktop-1440__light.png`, `07-store-checkout__mobile-390__light.png`; cart seeded in localStorage. |
| `/store/orders` | `src/app/store/orders/page.tsx` | `08-store-orders__desktop-1440__light.png`, `08-store-orders__mobile-390__light.png`; order seeded in localStorage. |
| `/store/success` | `src/app/store/success/page.tsx` | `09-store-success__desktop-1440__light.png`, `09-store-success__mobile-390__light.png`; no session-id error state. |
| `/store/admin` | `src/app/store/admin/page.tsx` | `10-store-admin__desktop-1440__light.png`, `10-store-admin__mobile-390__light.png`; signed-out state. |
| `/admin/park-risks` | `src/app/admin/park-risks/page.tsx` | `11-admin-park-risks__desktop-1440__light.png`, `11-admin-park-risks__mobile-390__light.png`; signed-out state. |
| `/admin/reports` | `src/app/admin/reports/page.tsx` | `12-admin-reports__desktop-1440__light.png`, `12-admin-reports__mobile-390__light.png`; redirects to `/auth?next=/admin/reports`. |
| `/help` | `src/app/help/page.tsx` | `13-help__desktop-1440__light.png`, `13-help__mobile-390__light.png`; dark variants captured. |
| `/guidelines` | `src/app/guidelines/page.tsx` | `14-guidelines__desktop-1440__light.png`, `14-guidelines__mobile-390__light.png`; dark variants captured. |
| `/privacy` | `src/app/privacy/page.tsx` | `15-privacy__desktop-1440__light.png`, `15-privacy__mobile-390__light.png`; dark variants captured. |
| `/terms` | `src/app/terms/page.tsx` | `16-terms__desktop-1440__light.png`, `16-terms__mobile-390__light.png`; dark variants captured. |
| `/post/[id]` | `src/app/post/[id]/page.tsx` | `17-post-sample__desktop-1440__light.png`, `17-post-sample__mobile-390__light.png`; sample id renders not-found. |
| `/group/[id]` | `src/app/group/[id]/page.tsx` | `18-group-sample__desktop-1440__light.png`, `18-group-sample__mobile-390__light.png`; sample id renders not-found. |
| `/user/[id]` | `src/app/user/[id]/page.tsx` | `19-user-sample__desktop-1440__light.png`, `19-user-sample__mobile-390__light.png`; sample id renders not-found. |
| `/pet/[id]` | `src/app/pet/[id]/page.tsx` | `20-pet-alias-sample__desktop-1440__light.png`, `20-pet-alias-sample__mobile-390__light.png`; redirects to `/tag/[id]`, sample id renders not-found. |
| `/tag/[id]` | `src/app/tag/[id]/page.tsx`, `TagPageClient.tsx` | `21-tag-sample__desktop-1440__light.png`, `21-tag-sample__mobile-390__light.png`; sample id renders not-found. |

API routes:

`/api/ai-agent`, `/api/checkout`, `/api/checkout/session`, `/api/health`, `/api/map-search`, `/api/push/send`, `/api/push/subscribe`, `/api/search`, `/api/stripe/webhook`, `/api/subscriptions/checkout`.

Shared components:

- Site shell and global components: `Navbar`, `Footer`, `ConditionalFooter`, `PawPalLogo`, `CookieConsentBanner`, `Providers`, `AuthProvider`, `PwaRuntime`, `ConsoleWarningFilter`.
- Product/map/chat components: `HomeClientParts`, `Globe`, `GlobeComponent`, `GlobeFullPage`, `GlobeStaticPreview`, `GlobeTutorial`, `WeatherTicker`, `ChatBottomSheet`, `ChatBubble`, `PetDoodles`.
- UI primitives: `AppDeepLinkButton`, `Badge`, `Button`, `Card`, `CheckoutStep`, `EmptyState`, `Input`, `NfcIdentityCard`, `PageShell`, `ProductCard`, `ProfileStat`, `Sheet`, `StatusMessage`.

## Overall Verdict

The website is materially closer to the App baseline than the old 2026-06-11 plan described. Homepage and Store first viewports are no longer the biggest blockers: on 390px mobile, the homepage product globe begins around `top=496`, and the first Store product media begins around `top=624`, both inside the 844px viewport.

The remaining gap is system quality, not basic visual polish. The site uses the right PawPal palette and generally good page gutters, but it still has large route-specific CSS, over-carded layouts, inconsistent semantic structure, unverified dynamic data states, and a homepage runtime color parsing error from the WebGL/globe stack.

Severity key:

- P1: should be fixed before website redesign implementation is accepted.
- P2: should be included in the next visual/system cleanup batch.
- P3: polish or documentation follow-up.

## 留白铁律

Status: mostly pass, with one low-severity exception.

Evidence:

- No horizontal overflow was detected in all 84 captures.
- Primary page content on mobile uses visible gutters; no main card group or action row touched both viewport edges.
- Full-bleed surfaces are intentional where expected: Globe/map, page shell bands, not-found background sections.
- Cookie consent banner is the only repeated edge-hit in the automated scan. On mobile it sits around `left=29`, `right=5`; it does not overflow, but the right gutter is tighter than the user's stated standard. Severity P3 because it is a transient banner, not page content.

Conclusion: the App P2F4 spacing rule has largely transferred to the website. P2W2 should preserve this and avoid regressions when simplifying page sections.

## Cross-Page Findings

| ID | Severity | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| W1-F01 | P1 | Homepage throws a runtime `PolishedError: Couldn't parse the color string` in every light/dark desktop/mobile capture. | `meta/01-home__*.json`; dev server log also records `[browser] Uncaught Error`. Likely surface: `src/components/GlobeComponent.tsx` color token plumbing around CSS-derived globe color values. | Harden `GlobeComponent` color parsing to pass concrete hex/rgb values to globe/polished consumers; add a homepage screenshot smoke test that fails on page errors. |
| W1-F02 | P1 | Dynamic public/share routes were not actually validated in populated states. Sample `/post`, `/group`, `/user`, `/pet`, `/tag` all render the not-found page in local capture. | `17-*` through `21-*` screenshots and meta; H1 is `This PawPal route is not available.` | Provide deterministic local fixture IDs or fixture mode for public share/tag pages, especially `/tag/[id]` emergency contact-visible/contact-hidden states. |
| W1-F03 | P1 | `/auth` has two visible `h1`s, and signed-out `/profile` and `/admin/reports` inherit the same duplicate-H1 state through redirect. | `meta/04-auth__mobile-390__light.json`, `05-profile`, `12-admin-reports`; H1 list is `One login...` and `Welcome Back`. | Keep one page-level `h1`; demote the form title to `h2`/heading text while preserving visual hierarchy. |
| W1-F04 | P1 | Global CSS remains too broad for a stable design system: `src/app/globals.css` is 3,838 lines and owns tokens plus route-specific home/globe/commerce/tag/auth/loading/legal classes. | `wc -l src/app/globals.css`; class families such as `home-hero-field`, `commerce-page-shell`, `tag-rescue-panel`, `auth-card`, `hero-map-grid`. | Split route-family styling into shared primitives or colocated modules; keep `globals.css` to tokens, resets, typography, focus, and narrow global helpers. |
| W1-F05 | P2 | Shared `Card` defaults to `rounded-paw-next-card` (24px) for ordinary cards, while PetCompass guidance reserves 24px for sheets/large mobile surfaces and prefers 12/16/20px by role. | `src/components/ui/Card.tsx`; visible cards across Auth, About, Help, Legal, Not Found. | Define card variants: compact 12px, panel 16px, hero 20px, sheet 24px. Migrate pages by role rather than using one radius everywhere. |
| W1-F06 | P2 | Many pages are visually correct but over-carded: white/cream cards inside white/cream panels repeat across About, Auth, Help, Legal, and admin sign-in states. | Contact sheets, especially `mobile-390__light.png` and `desktop-1440__light.png`. | Simplify secondary pages into quieter full-width text bands and fewer repeated cards; reserve cards for repeated items, modals, and framed tools. |
| W1-F07 | P2 | Dark mode works, but relies on a large compatibility layer and low-separation panel stacks. | Dark contact sheets; `globals.css` dark sections and route-specific overrides. | Move dark decisions into tokenized primitives; then delete broad compatibility selectors only after screenshots pass. |
| W1-F08 | P2 | Website i18n is effectively absent. UI copy is English-only even though App l10n is clean and About copy claims 5-language readiness. | No `next-intl`, locale folders, dictionaries, or route locale structure found in `src`; screenshots are all English. | Decide whether Website P2W2 should add i18n foundation or explicitly mark website as English-only until launch. |
| W1-F09 | P2 | Store and checkout are much improved, but still duplicate local field/stepper/card recipes instead of consuming a single App-aligned primitive system. | `src/app/store/checkout/page.tsx`, `src/app/store/page.tsx`, `src/components/ui/*`. | Normalize Button/Card/Input/Badge/Sheet first, then migrate commerce route-local controls. |
| W1-F10 | P3 | Cookie banner right gutter is tighter than the stated whitespace standard on mobile. | Mobile meta edge hits: cookie banner right around 5px. | Give the banner symmetric mobile inset, e.g. 16px both sides or `inset-x-paw-md`. |

## Page-By-Page Gap List

| Route | Severity | Current conclusion | Main gaps |
| --- | --- | --- | --- |
| `/` | P1 | First viewport now aligns with PetCompass better: product globe appears in mobile first viewport and CTA copy is clear. | Runtime `PolishedError`; page still uses decorative map/grid/orbit field and downstream card-heavy storytelling. |
| `/about` | P2 | Stronger than old plan; first viewport is readable and not edge-tight. | Mobile full page is very long (`scrollHeight=8483`); many repeated card sections make it feel like a second homepage instead of a quiet credibility page. |
| `/globe` | P2 | Full-screen tool intent is present; nav is compact; no overflow. | Capture shows static/fallback wording: `Map preview is still ready`. Live map/globe state was not verified in this audit. HUD hierarchy still needs a dedicated map-shell QA pass. |
| `/auth` | P1 | Form is polished, gutters are good, dark mode works. | Duplicate `h1`; decorative/marketing panel competes with form; card nesting is heavier than App auth surfaces. |
| `/profile` | P1 | Signed-out redirect is visually stable. | Auth duplicate-H1 applies; signed-in profile workspace was not captured without credentials. |
| `/store` | P2 | Major old P0 fixed: first product media starts at about `top=624` on mobile. | Store still reads as cards inside a commerce shell, with local filters and floating cart controls that need primitive normalization. |
| `/store/checkout` | P2 | Checkout can render with seeded cart; no overflow; payment error path not triggered. | Local stepper/fields duplicate primitive styling; mobile page is long (`scrollHeight=3452`); needs stricter checkout trust hierarchy. |
| `/store/orders` | P2 | Seeded order history renders on desktop/mobile; empty/history state exists through local storage. | Needs signed-in/real order state validation and primitive cleanup. |
| `/store/success` | P2 | No-session error state is clear and safe. | Payment-confirmed state was not verified because no real Stripe session was available. |
| `/store/admin` | P2 | Signed-out state is stable and not edge-tight. | Admin signed-in catalog state was not captured. |
| `/admin/park-risks` | P2 | Signed-out state is stable and has a clear return path. | Admin queue/form state not captured without credentials; operational route should still inherit shared primitives. |
| `/admin/reports` | P1 | Redirect to auth is stable. | Inherits duplicate auth `h1`; moderation queue state not captured without credentials. |
| `/help` | P2 | Clear support routes and good first-viewport spacing. | Card-heavy secondary page; route cards can become quieter and denser. |
| `/guidelines` | P2 | Clear headings, no overflow, dark mode works. | Similar legal/support card pattern repeats heavily; tabs/cards can be simplified. |
| `/privacy` | P2 | Clear privacy language and good gutters. | Repeated card columns; long mobile scroll; no localization. |
| `/terms` | P2 | Clear legal content and footer visible in desktop full-page contact sheet. | Same legal-page simplification opportunity; mobile page still uses stacked cards for every point. |
| `/post/[id]` | P1 | Not-found fallback is polished. | Real post share state not validated. |
| `/group/[id]` | P1 | Not-found fallback is polished. | Real group invite state not validated. |
| `/user/[id]` | P1 | Not-found fallback is polished. | Real public user profile state not validated; source uses a blue-to-coral gradient header that needs PetCompass alignment review. |
| `/pet/[id]` | P1 | Alias redirects to `/tag/[id]`; fallback is polished. | Real pet/tag alias state not validated. |
| `/tag/[id]` | P1 | Not-found fallback is polished. Source layout is emergency-first and directionally aligned. | Contact-visible, contact-hidden, missing avatar, long pet name, long breed, no health notes, and dark real-data states were not validated. |

## 2026-06-11 Upgrade Plan Status

Source: `WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md`.

| Old item | P2W1 status | Notes |
| --- | --- | --- |
| Mobile homepage first viewport too tall | Mostly completed | Product/globe visual now begins around `top=496` on 390px mobile, inside first viewport. Still keep a hint of next content visible during future edits. |
| Store products pushed below fold | Mostly completed | First product media now begins around `top=624` on 390px mobile. Old P0 is no longer valid as stated. |
| NFC finder page needs real edge-state QA | Still valid | `/tag/[id]` source is emergency-first, but no real tag sample was available. This remains a P1 validation gap. |
| Homepage has too many competing signals | Partially valid | Hero is calmer than old plan, but home still uses orbit/grid/decorative product field and throws a runtime color error. |
| About/Auth/Profile reuse same template | Still valid, lower severity | Pages are consistent and polished, but secondary pages still overuse cards/panels and route-family rhythm is not distinct enough. |
| Globe needs dedicated app shell | Partially valid | Navigation is now compact and full-screen, but live map state was not verified and fallback still shows several HUD controls/callouts. |
| Global CSS ownership boundaries | Still valid | `globals.css` is 3,838 lines and owns many route classes. |
| Dark mode not first-class | Partially valid | Dark screenshots are coherent, but implementation still relies on broad route/global overrides and low-separation dark cards. |
| Phase 0 screenshot baseline | Completed for P2W1 | 21 routes x 2 widths x light/dark captured in `/evidence/P2W1/`. |
| Phase 2 first viewport fixes | Mostly completed | Home/Store first viewport metrics now pass the old acceptance direction. |
| Phase 4 trust/account surfaces | Still valid | Auth duplicate-H1 and tag real-data state gap remain. |
| Phase 5 secondary pages/footer | Still valid | Help/Guidelines/Privacy/Terms/About are polished but too card-heavy for quiet support/legal surfaces. |

## P2-W2 Task Split Suggestions

1. Homepage runtime and Globe color hardening.  
Goal: remove the `PolishedError` from homepage captures and keep the Globe/home hero visual stable in light/dark. Involves `src/components/GlobeComponent.tsx`, `src/components/HomeClientParts.tsx`, and possibly the token read helper in the same component. Estimated size: small. Acceptance: `node`/Playwright smoke for `/` at 390 and 1440 in light/dark records zero page errors; screenshots still show the globe/product visual inside the mobile first viewport.

2. Auth semantic structure and signed-out shell cleanup.  
Goal: make `/auth`, signed-out `/profile`, and `/admin/reports` expose one `h1` while preserving visual hierarchy. Involves `src/app/auth/page.tsx` and any shared sign-in panel text/components. Estimated size: small. Acceptance: Playwright meta reports exactly one `h1` for `/auth`, `/profile`, and `/admin/reports`; visual screenshots remain unchanged except heading semantics.

3. Public dynamic fixture and Tag edge-state audit harness.  
Goal: make `/tag/[id]`, `/pet/[id]`, `/post/[id]`, `/group/[id]`, and `/user/[id]` auditable without production data. Involves dynamic route loaders and a documented local fixture strategy, preferably guarded so production data truth is not compromised. Estimated size: medium. Acceptance: screenshots cover tag contact-visible, contact-hidden, missing avatar, long name, no health notes, and one populated post/group/user state at 390 and 1440.

4. Primitive radius/depth normalization.  
Goal: align `Button`, `Card`, `Badge`, `StatusMessage`, `Input`, and `Sheet` with PetCompass roles instead of one-size-fits-all 24px cards and pill-heavy controls. Involves `src/components/ui/*`, `src/app/globals.css`, and a small migration in high-traffic pages. Estimated size: medium. Acceptance: shared components expose role variants; home/store/auth/help screenshots do not regress; no product code outside agreed routes changes.

5. Global CSS ownership pass.  
Goal: reduce `globals.css` responsibility to tokens, reset, focus, typography, and narrow helpers; move route-family classes into components or modules. Involves `src/app/globals.css`, `HomeClientParts`, Globe components, commerce route styles, auth/tag/legal helpers. Estimated size: medium. Acceptance: `globals.css` route-specific class count drops materially; screenshots for all changed routes pass light/dark 390/1440.

6. Secondary pages simplification.  
Goal: make About/Help/Guidelines/Privacy/Terms credible and quiet instead of card-heavy. Involves `src/app/about/page.tsx`, `src/app/help/page.tsx`, `src/app/guidelines/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, plus shared legal/support sections if useful. Estimated size: medium. Acceptance: each page keeps one `h1`, good gutters, fewer repeated cards, and mobile scroll is shortened where content allows.

7. Dark mode primitive pass.  
Goal: make dark mode first-class through component tokens rather than broad compatibility overrides. Involves `src/app/globals.css`, `src/components/ui/*`, Navbar/Footer modules, and Globe/Auth/Store surfaces. Estimated size: medium. Acceptance: dark contact sheets show clear panel separation; no broad new `.bg-*` compatibility selectors are added; contrast-sensitive soft tone text uses matching `on-*-soft` roles.

8. Website i18n decision/foundation.  
Goal: decide whether the website follows the App's multilingual standard now or explicitly remains English-only for launch. Involves route architecture, metadata, nav/footer/legal copy, and possibly a lightweight dictionary setup. Estimated size: medium if foundation-only, large if full translation. Acceptance: documented decision; if implemented, nav/footer/home/store/auth metadata have locale-aware strings and language routing does not break screenshots.

## Verification Notes And Limits

- Dev server was stopped after capture; `lsof -i :3101 -sTCP:LISTEN` returned no listener.
- No horizontal overflow was detected in all captured states.
- Checkout and orders were seeded through browser localStorage only for screenshots; no product code or backend data was changed.
- Signed-in profile, admin, populated dynamic share pages, live payment success, and real tag public profile states were not verified because the audit did not use credentials or production fixture IDs.
- The Browser plugin was not used; Playwright was used as the project-approved equivalent screenshot tool.
