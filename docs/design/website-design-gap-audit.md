# Website vs App Next UI Design Gap Audit

Scope: read-only audit for P2C1. The target report path and five required questions are defined in `/Users/nuemann/Desktop/GeoPet/specs/P2C1-website-design-gap-audit.md:15-23`. The App baseline is PetCompass V2 / Next UI with warm cream canvas, rounded cards, tactile depth buttons, tone-on-soft color pairs, and WCAG-AA foreground contract per `/Users/nuemann/Desktop/GeoPet/specs/P2C1-website-design-gap-audit.md:9`.

No source, style, or config files were changed by this audit.

## 1. Website Design System Inventory

### Centralized tokens

- Tailwind is v4 via `@tailwindcss/postcss`; the PostCSS config only registers that plugin, so the theme is CSS-driven, not `tailwind.config.*` driven (`postcss.config.mjs:1-7`, `package.json:31`, `package.json:37`).
- Website tokens are centralized mainly in `src/app/globals.css` under `@theme` (`src/app/globals.css:3-64`). The app shell applies the resulting page and text tokens globally (`src/app/layout.tsx:123-136`).
- The palette already carries many App hex values: blue `#4A90D9`, teal/mint `#76C7B8`, yellow `#FFCD38`, coral `#F28C44`, cream `#FFF8EA`, warm panel `#FFFDF4`, ink `#3A2F2A`, body `#5F514A`, and soft surfaces (`src/app/globals.css:10-25`).
- The App baseline uses Nunito as the application text theme (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:14-18`) with locale fallbacks (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:148-156`). Website `--font-sans` is Apple/System/Segoe, while `--font-brand` only includes Nunito Sans as a fallback (`src/app/globals.css:4-7`). This is a visible type-language mismatch.

### Token conflicts and omissions

- `--color-paw-primary-contrast` is currently `#4A90D9`, the same as primary, rather than a foreground/on-primary color (`src/app/globals.css:34-38`). App action buttons use `PawPalColors.accentInk` `#0F172A` as the foreground on primary/accent buttons (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:53-58`, `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:67-73`).
- App Next UI has a distinct green token `#58CC02` for care/positive action and dark `#7BE833` (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:216`, `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:247`). Website has success/trust teal but no central `green`/`duoCareGreen` token in `@theme` (`src/app/globals.css:28-57`).
- App Next UI has explicit tone-on-soft foreground tokens such as `onBlueSoft #0B4A7D`, `onGreenSoft #2F5C00`, `onCoralSoft #7A3E0E`, `onYellowSoft #654D00`, `onMintSoft #155E54`, and `onCriticalSoft #7A1E1E` (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:226-239`). Website exposes soft backgrounds but generally uses the base color as the soft foreground in badges/status components (`src/components/ui/Badge.tsx:4-14`, `src/components/ui/StatusMessage.tsx:13-37`), which creates contrast failures.
- Radius tokens are compressed on the website: `--radius-paw-sm 0.5rem`, `--radius-paw-md 0.5rem`, `--radius-paw-lg 0.75rem` (`src/app/globals.css:58-60`). App core radius has xs/sm/md/lg/xl/full at 6/8/12/16/20/999 (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart:186-205`) and Next UI Material cards use 24px (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:36-47`).
- Website shadows are named but not App-equivalent tactile depth: panel/action/trust shadows use custom rgba values (`src/app/globals.css:61-63`), while App Next UI carries `depth 5`, `depthPressed 1`, and strong shadow `#1F000000` light / `#57000000` dark with blur 30 and y 14 (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:236-240`, `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:267-271`).

### Scattered hardcoding

- `globals.css` is doing double duty as token layer and component/page stylesheet, including large page-specific blocks, animation classes, compatibility overrides, and dark-mode overrides (`src/app/globals.css:281-349`, `src/app/globals.css:3281-3495`).
- Navigation and footer carry their own CSS module color, blur, shadow, and dark-mode rules (`src/components/Navbar.module.css:1-14`, `src/components/Navbar.module.css:72-100`, `src/components/Footer.module.css:1-5`, `src/components/Footer.module.css:84-110`).
- The Globe popup bypasses tokens with inline DOM styles and `system-ui` font (`src/components/GlobeFullPage.tsx:171-197`). The global error page uses hardcoded colors and 8px radius instead of PawPal tokens (`src/app/global-error.tsx:24-39`).
- Auth and legacy decorative elements use floating pet doodles (`src/app/auth/page.tsx:79-83`, `src/components/PetDoodles.tsx:3-8`), which is more illustrative than the App's restrained, tactile PetCompass surface language.

### App Token Correspondence Table

| # | App token / role | Exact App value | Website current | Target CSS/Tailwind mapping |
|---:|---|---|---|---|
| 1 | Next cream light | `#FFF8EA` | `--color-paw-page #FFF8EA` | keep as `--color-paw-page` |
| 2 | Next cream dark | `#141A20` | dark page `#141A20` | keep as dark `--color-paw-page` |
| 3 | Next blue light | `#4A90D9` | `--color-paw-primary #4A90D9` | keep as `--color-paw-blue` and `--color-paw-primary` |
| 4 | Next blue dark | `#74B8EA` | dark primary `#74B8EA` | keep as dark primary |
| 5 | Next green light | `#58CC02` | missing central green | add `--color-paw-green` |
| 6 | Next green dark | `#7BE833` | missing central green dark | add dark `--color-paw-green` |
| 7 | Next coral light | `#F28C44` | `--color-paw-accent #F28C44` | keep as `--color-paw-coral` and accent |
| 8 | Next coral dark | `#F7A160` | dark accent `#F7A160` | keep as dark accent |
| 9 | Next yellow light | `#FFCD38` | `--color-paw-yellow #FFCD38` | promote to semantic yellow |
| 10 | Next yellow dark | `#FFCD38` | dark warning currently `#FFD95C` | align dark yellow to `#FFCD38` |
| 11 | Next mint light | `#76C7B8` | `--color-paw-trust #76C7B8` | keep as mint/trust |
| 12 | Next mint dark | `#8DD8CC` | dark trust `#8DD8CC` | keep as dark mint/trust |
| 13 | Next critical light | `#C83A3A` | `--color-paw-critical #C83A3A` | keep as critical |
| 14 | Next critical dark | `#FF8A8A` | dark critical `#FF8A8A` | keep as dark critical |
| 15 | Next onBlue | `#0F172A` | action buttons use `text-paw-accent-ink` | add explicit `--color-paw-on-blue` |
| 16 | Next onGreen | `#0F172A` | missing | add `--color-paw-on-green` |
| 17 | Next onCoral | `#0F172A` | action buttons use `text-paw-accent-ink` | add `--color-paw-on-coral` |
| 18 | Next onYellow | `#0F172A` | missing | add `--color-paw-on-yellow` |
| 19 | Next onMint | `#0F172A` | missing | add `--color-paw-on-mint` |
| 20 | Next onCritical | `#FFFFFF` | danger button uses white | add `--color-paw-on-critical` |
| 21 | Next onBlueSoft light | `#0B4A7D` | missing | add `--color-paw-on-blue-soft` |
| 22 | Next onGreenSoft light | `#2F5C00` | missing | add `--color-paw-on-green-soft` |
| 23 | Next onCoralSoft light | `#7A3E0E` | missing | add `--color-paw-on-coral-soft` |
| 24 | Next onYellowSoft light | `#654D00` | missing | add `--color-paw-on-yellow-soft` |
| 25 | Next onMintSoft light | `#155E54` | missing | add `--color-paw-on-mint-soft` |
| 26 | Next onCriticalSoft light | `#7A1E1E` | missing | add `--color-paw-on-critical-soft` |
| 27 | Next onBlueSoft dark | `#FFFFFF` | missing | add dark `--color-paw-on-blue-soft` |
| 28 | Next onGreenSoft dark | `#FFFFFF` | missing | add dark `--color-paw-on-green-soft` |
| 29 | Next onCoralSoft dark | `#FFFFFF` | missing | add dark `--color-paw-on-coral-soft` |
| 30 | Next onYellowSoft dark | `#FFFFFF` | missing | add dark `--color-paw-on-yellow-soft` |
| 31 | Next onMintSoft dark | `#FFFFFF` | missing | add dark `--color-paw-on-mint-soft` |
| 32 | Next onCriticalSoft dark | `#FFFFFF` | missing | add dark `--color-paw-on-critical-soft` |
| 33 | Core primarySoft light | `#EAF4FC` | `--color-paw-primary-soft #EAF4FC` | keep |
| 34 | Core duoCareGreenSoft light | `#D7FFB8` | missing | add `--color-paw-green-soft` |
| 35 | Core accentSoft light | `#FFF0E7` | `--color-paw-accent-soft #FFF0E7` | keep |
| 36 | Core warningSoft light | `#FFF8DC` | `--color-paw-warning-soft #FFF8DC` | keep |
| 37 | Core trustSoft light | `#E9F8F5` | `--color-paw-trust-soft #E9F8F5` | keep |
| 38 | Core criticalSoft light | `#FFECEC` | `--color-paw-critical-soft #FFECEC` | keep |
| 39 | Scheme surface light | `#FFF8EA` | page `#FFF8EA` | map to page/canvas |
| 40 | Scheme surface dark | `#1B232A` | dark panel/page mix | add semantic surface |
| 41 | Scheme surfaceContainerLowest light | `#FFFFFF` | panel `#FFFFFF` | keep panel |
| 42 | Scheme surfaceContainerLowest dark | `#141A20` | dark page `#141A20` | keep canvas |
| 43 | Scheme surfaceContainerLow light | `#FFFFFF` | panel `#FFFFFF` | keep panel-low |
| 44 | Scheme surfaceContainerLow dark | `#1D272D` | dark panel `#1D272D` | keep dark panel |
| 45 | Scheme surfaceContainer light | `#FFFDF4` | warm panel `#FFFDF4` | keep warm surface |
| 46 | Scheme surfaceContainer dark | `#243139` | dark subtle `#243139` | keep dark subtle |
| 47 | Scheme outlineVariant light | `#EADFD1` | `--color-paw-border #EADFD1` | keep as outline variant |
| 48 | Scheme outlineVariant dark | `#42635D` | dark border `#42635D` | keep dark outline |
| 49 | Core textStrong light | `#3A2F2A` | `--color-paw-ink #3A2F2A` | keep |
| 50 | Scheme onSurface dark | `#FFFFFF` | dark ink `#FFFFFF` | keep |
| 51 | Core textBody light | `#5F514A` | `--color-paw-body #5F514A` | keep |
| 52 | Scheme onSurfaceVariant dark | `#E4D7CF` | dark body `#E4D7CF` | keep |
| 53 | Core textMuted light | `#8F6A56` | `--color-paw-muted #8F6A56` | keep |
| 54 | Dark muted/danger surface role | `#B9917D` | dark muted/danger `#B9917D` | keep as muted only |
| 55 | Core accentInk | `#0F172A` | `--color-paw-accent-ink #0F172A` | keep and reuse as on-action |
| 56 | Core danger | `#8F6A56` | `--color-paw-danger #8F6A56` | keep for neutral brown, not destructive critical |
| 57 | Core dangerSoft | `#F6EEE9` | `--color-paw-danger-soft #F6EEE9` | keep for neutral brown soft |
| 58 | Core borderSubtle | `#D7E7E4` | `--color-paw-border-strong #D7E7E4` | rename to borderSubtle or keep alias |
| 59 | Core lightWarmCanvas | `#FFFDF4` | `--color-paw-surface-warm #FFFDF4` | keep |
| 60 | Core darkCanvas | `#151D22` | dark page uses `#141A20` | decide canvas alias vs Next cream dark |
| 61 | Spacing xxs | `4px` | no semantic spacing token | add `--spacing-paw-xxs` |
| 62 | Spacing xs | `8px` | no semantic spacing token | add `--spacing-paw-xs` |
| 63 | Spacing sm | `12px` | no semantic spacing token | add `--spacing-paw-sm` |
| 64 | Spacing md | `16px` | no semantic spacing token | add `--spacing-paw-md` |
| 65 | Spacing lg | `20px` | no semantic spacing token | add `--spacing-paw-lg` |
| 66 | Spacing xl | `24px` | no semantic spacing token | add `--spacing-paw-xl` |
| 67 | Spacing xxl | `32px` | no semantic spacing token | add `--spacing-paw-xxl` |
| 68 | Spacing xxxl | `40px` | no semantic spacing token | add `--spacing-paw-xxxl` |
| 69 | Minimum tap target | `44px` | button sizes vary, icon `40px` | enforce min interactive target |
| 70 | Radius xs | `6px` | missing | add `--radius-paw-xs` |
| 71 | Radius sm | `8px` | sm `8px` | keep |
| 72 | Radius md | `12px` | md currently `8px` | align md to `12px` |
| 73 | Radius lg | `16px` | lg currently `12px` | align lg to `16px` |
| 74 | Radius xl | `20px` | missing | add `--radius-paw-xl` |
| 75 | Radius full | `999px` | ad hoc `rounded-full` | add semantic pill/full token |
| 76 | Core control radius | `8px` | buttons use md `8px` | keep control small only |
| 77 | Core card radius | `12px` | Card uses lg `12px` | keep low-level card option |
| 78 | Core panel radius | `16px` | missing semantic panel radius | add panel token |
| 79 | Core sheet radius | `20px` | Sheet uses lg `12px` | align sheets to `20px` |
| 80 | Next CardTheme radius | `24px` | main Card `12px` | add Next card radius for high-emphasis cards |
| 81 | Next button min size | `48x50px` | Button `h-9/h-11/h-12`, icon `40px` | align primary actions to 50px high |
| 82 | Next button padding | `22px x 14px` | Button px `3/4/5` and heights | add size recipe |
| 83 | Next Chip radius | `999px` | Badge `rounded-paw-sm` | align chips/badges to pill |
| 84 | Type display | `34px` | page-specific large text | add semantic type token |
| 85 | Type h1 | `28px` | page-specific Tailwind sizes | add semantic type token |
| 86 | Type h2 | `22px` | page-specific Tailwind sizes | add semantic type token |
| 87 | Type h3 | `18px` | page-specific Tailwind sizes | add semantic type token |
| 88 | Type body | `15px` | base `16px` browser default / Tailwind classes | decide web body scale intentionally |
| 89 | Type caption | `12px` | page-specific small text | add semantic type token |
| 90 | Type metric | `32px` | ad hoc metric sizes | add semantic metric token |
| 91 | Motion fast | `120ms` | mixed `150/200/300/700ms` | add motion token |
| 92 | Motion normal | `180ms` | mixed transitions | add motion token |
| 93 | Motion slow | `280ms` | mixed transitions | add motion token |
| 94 | Next strongShadow light | `#1F000000`, blur `30`, y `14` | action shadow rgba blue/orange | add depth shadow token |
| 95 | Next strongShadow dark | `#57000000`, blur `30`, y `14` | dark shadows patched globally | add dark depth shadow token |
| 96 | Next depth | `5` | hover translate/shadows ad hoc | add `--depth-paw-raised` |
| 97 | Next depthPressed | `1` | active states ad hoc or absent | add `--depth-paw-pressed` |
| 98 | Core control shadow | black alpha `0.14` light / `0.34` dark, blur `12`, y `4` | `shadow-paw-action` is color-specific | add neutral control shadow |
| 99 | Core panel shadow | black alpha `0.08` light / `0.30` dark, blur `24`, y `10` | `shadow-paw-panel` alpha `.08`, blur `48`, y `18` | align panel shadow |
| 100 | Core floating shadow | color alpha `0.24`, blur `18`, y `8` | scattered floating shadows | add floating shadow recipe |

Primary App evidence for rows 1-60: `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:125-144`, `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:212-271`, and `/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart:3-164`. Spacing, radius, type, motion, and shadow evidence: `/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart:168-263`. Component recipe evidence: `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:36-86`.

## 2. Page List And Visual State

| Route / state | Files | Current visual state | Gap level |
|---|---|---|---|
| `/` | `src/app/page.tsx:28-83`, `src/components/HomeClientParts.tsx:124-169`, `src/components/HomeClientParts.tsx:206-249` | Warm page, PawPal tokens, rounded panels, strong CTAs. Also uses marketing hero composition, large gradients, app showcase and badges. | Medium. Palette is close; component depth/radius/type and CTA recipes need App parity. |
| `/about` | `src/app/about/page.tsx:86-112`, `src/app/about/page.tsx:184-223`, `src/app/about/page.tsx:225-263` | Tokenized page with panels, value cards, timeline, team cards, emoji chips. | Medium-high. Warm language exists, but page has many bespoke sections and illustrative emoji styling. |
| `/auth` | `src/app/auth/page.tsx:79-119`, `src/app/auth/page.tsx:134-174`, `src/app/auth/page.tsx:178-293` | Tokenized auth card, segmented toggle, input fields, trust panel, floating doodles. | Medium. Form basics are close; doodles and local auth styling diverge from Next UI restraint. |
| `/globe` | `src/app/globe/page.tsx:6-24`, `src/components/GlobeFullPage.tsx:639-738`, `src/components/GlobeFullPage.tsx:171-197` | Full-screen dark map, floating panels, inline popup styling. | High. Product surface is intentionally immersive, but typography, popup surface, control recipes, and color layering are not Next UI-consistent. |
| `/group/[id]` | `src/app/group/[id]/page.tsx:60-104` | Simple warm card, app deep-link CTA. | Low-medium. Mostly tokenized; should inherit fixed Button/Card recipes. |
| `/guidelines` | `src/app/guidelines/page.tsx:51-117` | Legal shell, warm cards, soft navigation chips. | Low-medium. Tokenized, but depends on global legal classes instead of shared primitives. |
| `/help` | `src/app/help/page.tsx:58-168` | Support shell, route cards, contact band. | Medium. Uses page-specific classes and custom support card styling. |
| `/pet/[id]` | `src/app/pet/[id]/page.tsx:7-10` | Redirects to tag page. | No visual surface beyond redirect. |
| `/post/[id]` | `src/app/post/[id]/page.tsx:84-169` | Share preview card with app deep-link button. | Low-medium. Warm and simple; should inherit fixed primitives. |
| `/privacy` | `src/app/privacy/page.tsx:70-150` | Legal shell and info cards. | Low-medium. Same legal-class consolidation issue as guidelines. |
| `/profile` | `src/app/profile/ProfileWorkspaceView.tsx:299-357`, `src/app/profile/ProfileWorkspaceView.tsx:386-397`, `src/app/profile/ProfileWorkspaceView.tsx:490-586` | Workspace dashboard with cards, forms, pet cards, action panels. | Medium. Good token usage, but many local form/card arrangements should converge on NextCard/NextButton primitives. |
| `/store` | `src/app/store/page.tsx:26-38`, `src/app/store/page.tsx:256-309`, `src/app/store/page.tsx:832-849` | Uses UI primitives, product cards, drawer, floating cart. | Medium. Closest shared-component area; needs App button/chip/card radius/depth and fewer local wrappers. |
| `/store/checkout` | `src/app/store/checkout/page.tsx:57-100`, `src/app/store/checkout/page.tsx:210-296`, `src/app/store/checkout/page.tsx:351-355` | Local checkout stepper, local field component, cards, payment CTA. | Medium-high. Duplicates Input/Button/Card recipes instead of shared Next primitives. |
| `/store/orders` | `src/app/store/orders/page.tsx` | Orders route present in app tree; follows store domain styling. | Medium. Should be migrated with commerce batch and shared primitives. |
| `/store/success` | `src/app/store/success/page.tsx` | Success route present in app tree; expected confirmation surface. | Medium. Should inherit StatusMessage/NextCard and success tone-on-soft contracts. |
| `/store/admin` | `src/app/store/admin/page.tsx:332-394`, `src/app/store/admin/page.tsx:395-557` | Admin catalog UI uses PageShell/Card/Button plus local fields and preview cards. | Medium. Admin backend can be exempt from marketing brand unification, but not from token/accessibility primitives. |
| `/tag/[id]` | `src/app/tag/[id]/TagPageClient.tsx:71-143`, `src/app/tag/[id]/TagPageClient.tsx:145-241`, `src/app/tag/[id]/TagPageClient.tsx:247-320` | Emergency/rescue tag page with warm panels, tone cards, contact CTA, info tiles. | Low-medium. Conceptually closest to App utility surfaces; needs tone-on-soft foreground and shared card/action recipes. |
| `/terms` | `src/app/terms/page.tsx:35-102` | Legal shell and policy cards. | Low-medium. Same legal class consolidation issue. |
| `/user/[id]` | `src/app/user/[id]/page.tsx:80-189`, `src/app/user/[id]/page.tsx:194-198` | Public profile preview with blue-to-coral gradient header and stats. | Medium-high. Gradient hero is outside Next UI's softer card/tone language. |
| `/admin/reports` | `src/app/admin/reports/page.tsx:71-102`, `src/app/admin/reports/ReportsClientParts.tsx:204-235`, `src/app/admin/reports/ReportsClientParts.tsx:345-520` | Operational admin queue with PageShell, Cards, Badges, dialog. | Medium. Admin backend is exempt from brand-heavy unification, but should consume corrected primitives and contrast tokens. |
| `/admin/park-risks` | `src/app/admin/park-risks/page.tsx:594-819`, `src/app/admin/park-risks/page.tsx:822-867` | Operational queue/forms with PageShell/Card/Button plus local filter buttons. | Medium. Same admin exemption, same primitive/token cleanup need. |
| Global loading/error/not-found | `src/app/loading.tsx:5-17`, `src/app/error.tsx:23-35`, `src/app/not-found.tsx:7-72`, `src/app/global-error.tsx:24-39` | Loading/error/not-found mostly tokenized except global-error hardcoded colors/radius. | High for `global-error`; otherwise low-medium. |

Overall visual state: the website already adopted much of the App color vocabulary and warm surface direction, but it is not yet a single design system. The largest gaps are token semantics, radius/depth, tone-on-soft foregrounds, font baseline, and scattered page/component styling.

## 3. Component Layer Gaps

| Component area | Evidence | Current state | Gap to App NextButton / NextCard / NextChip |
|---|---|---|---|
| Button | `src/components/ui/Button.tsx:13-32`, `src/components/ui/Button.tsx:44-54`; App button recipes at `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:53-80` | Shared variants exist, but radius is `rounded-paw-md`, heights vary, and no explicit depth/pressed depth token exists. | Needs pill radius `999`, min 50px primary actions, 22x14 padding, accentInk foreground, and tactile pressed/raised states. |
| Card | `src/components/ui/Card.tsx:4-13`; App CardTheme at `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:36-47` | Shared card exists with `rounded-paw-lg`, border, panel bg, shadow. | Website card is 12px; App Next card is 24px with outlineVariant and subdued shadow. Need semantic low-card vs NextCard distinction. |
| Badge / Chip | `src/components/ui/Badge.tsx:4-24`; App chip at `/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:82-86` | Badges use soft backgrounds but base colors as foreground and `rounded-paw-sm`. | Needs pill `999` and `on*Soft` foreground tokens. |
| Status messages | `src/components/ui/StatusMessage.tsx:13-37`, `src/components/ui/StatusMessage.tsx:58-65` | Similar tone-on-soft pattern to Badge. | Same foreground contrast issue; should use on-soft tokens and common tone recipes. |
| Input/forms | `src/components/ui/Input.tsx:31-79`, `src/app/store/checkout/page.tsx:82-100`, `src/app/admin/park-risks/page.tsx:701-817` | Shared Input exists, but checkout/admin still duplicate local field, select, textarea styling. | Consolidate form fields into shared recipes after token fix. |
| Sheet/drawer | `src/components/ui/Sheet.tsx:21-57`, `src/app/store/page.tsx:311-431` | Useful shared Sheet exists, but radius is 12px top sheet and shadow does not map to App sheet/panel tokens. | Align sheet radius to 20px and panel shadow recipe. |
| Nav/footer | `src/components/Navbar.tsx:84-129`, `src/components/Navbar.module.css:1-14`, `src/components/Footer.tsx:31-89`, `src/components/Footer.module.css:1-5` | Component logic is centralized, visual styling still split into CSS modules and hardcoded glass rules. | Move to tokenized surface/outline/depth recipes and reduce special hardcoded glass. |
| Logo | `src/components/PawPalLogo.tsx:25-33`, `src/components/PawPalLogo.tsx:67-82` | Adaptive logo asset is centralized. | Low gap; keep as brand anchor. |
| Product cards | `src/components/ui/ProductCard.tsx:41-105`, `src/app/store/ProductVisual.tsx:23-27` | Store uses shared card patterns and media visual component. | Medium gap from App card radius/depth and chip/button rules. |
| Chat/map UI | `src/components/ChatBottomSheet.tsx:518-532`, `src/components/ChatBubble.tsx:60-82`, `src/components/GlobeTutorial.tsx:129-230` | Many inline or highly local styles, rounded-full/rounded-2xl, emoji/text-heavy tutorial surfaces. | Needs a dedicated Next surface recipe for bottom sheets, bubbles, tool cards, and tutorial cards. |
| Decorative doodles | `src/components/PetDoodles.tsx:3-8`, `src/app/auth/page.tsx:79-83` | Decorative floating SVG layer. | Strong style-language mismatch unless deliberately retained for a small marketing-only moment. |

Component conclusion: the website has enough primitive coverage to migrate incrementally, but the primitives do not yet encode the App's contract. Correct the primitives before page rewrites, otherwise every page migration will repeat local radius, contrast, and shadow decisions.

## 4. Accessibility, Contrast, Focus, And Dark Mode

### Contrast findings

Contrast ratios were calculated against WCAG 2.x thresholds: 4.5:1 for normal text, 3:1 for large text and non-text UI.

| Pair | Ratio | Result | Implication |
|---|---:|---|---|
| `#3A2F2A` on `#FFF8EA` | 12.26 | AA normal | Body strong text is safe. |
| `#5F514A` on `#FFF8EA` | 7.19 | AA normal | Body text is safe. |
| `#8F6A56` on `#FFF8EA` | 4.55 | AA normal | Muted brown barely passes normal text. |
| `#4A90D9` on `#FFF8EA` | 3.16 | AA large only | Primary blue should not be normal-size body/link text on cream without darker foreground. |
| `#0F172A` on `#4A90D9` | 5.34 | AA normal | App action foreground is correct. |
| `#FFFFFF` on `#4A90D9` | 3.34 | AA large only | White-on-primary should not be used for normal button text. |
| `#76C7B8` on `#E9F8F5` | 1.81 | Fail | Current trust soft foreground pattern fails. |
| `#155E54` on `#E9F8F5` | 6.96 | AA normal | App `onMintSoft` fixes it. |
| `#F28C44` on `#FFF0E7` | 2.19 | Fail | Current accent soft foreground pattern fails. |
| `#7A3E0E` on `#FFF0E7` | 7.48 | AA normal | App `onCoralSoft` fixes it. |
| `#F28C44` on `#FFF8DC` | 2.29 | Fail | Current warning foreground pattern fails. |
| `#654D00` on `#FFF8DC` | 7.54 | AA normal | App `onYellowSoft` fixes it. |
| `#8F6A56` on `#F6EEE9` | 4.20 | AA large only | Danger/brown soft text is not safe for normal-size copy. |
| `#C83A3A` on `#FFECEC` | 4.48 | Borderline/fails strict AA normal | Use App `onCriticalSoft #7A1E1E` for normal text. |
| `#FFFFFF` on `#C83A3A` | 5.09 | AA normal | Critical solid action text is safe. |
| `#E4D7CF` on `#1D272D` | 10.81 | AA normal | Dark body text on dark panel is safe. |
| `#FFFFFF` on `#1D272D` | 15.21 | AA normal | Dark strong text is safe. |

### Focus and interaction

- Global skip link and focus ring are present (`src/app/globals.css:112-137`). Shared Button includes focus-visible ring and disabled states (`src/components/ui/Button.tsx:44-54`). Footer links also define focus-visible outline (`src/components/Footer.module.css:60-65`).
- Reduced-motion handling exists in homepage animation helpers (`src/components/HomeClientParts.tsx:25-58`) and Globe rendering (`src/components/GlobeComponent.tsx:85-105`).
- Main risk: focus styling is not consistently tokenized across CSS modules, inline map controls, Globe tutorial, and page-local buttons. After token consolidation, focus rings should use one high-contrast App-compatible ring token.

### Dark mode

- Website defines dark tokens in `globals.css` (`src/app/globals.css:170-207`) and declares `color-scheme: dark` there (`src/app/globals.css:206`), while light root declares `color-scheme: light` (`src/app/globals.css:73`).
- There are broad dark-mode compatibility overrides for common Tailwind classes (`src/app/globals.css:242-278`) and a very large page/component override block (`src/app/globals.css:3281-3495`). This makes dark mode operational but brittle: it patches existing classes instead of enforcing App token roles at component boundaries.
- App dark tokens are explicit in `PawPalNextTokens.dark` (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:243-271`) and core color helpers (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart:54-104`). Website should mirror that role table instead of relying on broad `!important` overrides.

Accessibility conclusion: core page text is mostly safe, action button foregrounds are directionally correct, but tone-on-soft badges/status/chips fail without App `on*Soft` foreground tokens. Dark mode exists but should be rebuilt around token roles and shared primitives.

## 5. Unified Scheme And Batch Plan

### Unified scheme

Use the 100-row token table above as the implementation map. The highest-leverage mapping is:

- App `PawPalNextTokens` colors become first-class CSS variables for `blue`, `green`, `coral`, `yellow`, `mint`, `critical`, every `on*`, and every `on*Soft` role (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/next_ui/theme/next_ui_theme.dart:212-271`).
- App core tokens provide the lower-level primitives for spacing, radius, type, motion, shadow, border, and text roles (`/Users/nuemann/Desktop/GeoPet/PawPal/lib/core/theme/pawpal_tokens.dart:168-263`).
- Website `@theme` remains the right integration point for Tailwind v4 (`src/app/globals.css:3-64`), but it should stop being the only place for page-specific styling. Shared components should own recipes; pages should compose them.

### Suggested independent batches

| Batch | Scope | Acceptance target | Depends on |
|---|---|---|---|
| Batch 2 - Token/global foundation | Add App role tokens to `globals.css`/Tailwind v4 `@theme`; fix `primary-contrast`; add green, on-action, on-soft, radius, spacing, type, motion, depth/shadow; align dark token roles; keep visual diff minimal. | Token table roles exist; no broken pages; contrast table pairs pass using new vars. | None |
| Batch 3 - Shared primitives | Update Button, Card, Badge/Chip, StatusMessage, Input, Sheet, PageShell, ProductCard, Nav/Footer recipes to consume Batch 2 tokens. | NextButton/NextCard/NextChip equivalents exist and are documented in component code; no page migration required yet. | Batch 2 |
| Batch 4 - Per-page migration | Migrate `/`, `/about`, auth, legal/help, profile/tag/public share pages, store/checkout, and Globe surfaces to shared primitives. Admin pages only adopt primitives and contrast fixes, not marketing-level brand unification. | Each route uses primitives for actions/cards/chips/forms; page-specific CSS shrinks; admin remains operational and restrained. | Batch 3 |
| Batch 5 - Cleanup and verification | Remove obsolete hardcoded colors/radii/shadows, broad dark `!important` patches where no longer needed, decorative doodles outside approved marketing surfaces, and duplicate field/button classes. Add visual/a11y checks. | Diff removes dead style paths; light/dark screenshots and contrast checks pass. | Batch 4 |

## Tail Summary

### Five-question conclusion summary

| Required question | Conclusion |
|---|---|
| 1. Website design system inventory | Website has a real `@theme` token base and many matching hex values, but lacks App role completeness: green, on-action, on-soft, full radius ladder, spacing/type/motion/depth, and consistent Nunito baseline. Styling is partly centralized and partly scattered across globals, CSS modules, inline styles, and page-local classes. |
| 2. Page list and visual state | Most routes are warm/token-aware. Closest to App: tag, legal, group/post, store primitives. Biggest gaps: Globe, global-error, checkout/admin local forms, homepage/about marketing sections, public user gradient header. Admin backend should be exempt from brand-heavy unification but still inherit primitives and contrast fixes. |
| 3. Component layer | Shared primitives exist, which makes migration feasible. They do not yet encode App NextButton/NextCard/NextChip semantics for pill buttons, 24px high-emphasis cards, 999 chips, pressed depth, and tone-on-soft foregrounds. |
| 4. Accessibility | Body text passes AA; App action foreground `#0F172A` on primary passes. Current soft badges/status foregrounds fail for trust/accent/warning and are borderline for critical. Focus exists but should be tokenized consistently. Dark mode works through broad overrides rather than App role parity. |
| 5. Unified scheme | Keep Tailwind v4 CSS `@theme`, add the 100 mapped App roles, then migrate primitives before page rewrites. Batch order: token/global foundation, shared primitives, per-page migration, cleanup/verification. |

### Token correspondence table row count

100 rows.

### Suggested batch plan

Batch 2 token/global foundation -> Batch 3 shared primitives -> Batch 4 per-page migration with admin exemption for brand-heavy treatment -> Batch 5 cleanup and verification.

### Git command output note

This committed report cannot self-contain the future commit hash produced after it is written. The final delivery response should paste the actual post-commit output for:

```bash
git log --oneline -1
git status --short
```
