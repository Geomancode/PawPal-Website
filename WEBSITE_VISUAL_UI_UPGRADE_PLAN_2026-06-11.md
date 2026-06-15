# PawPal Website Visual/UI Upgrade Plan

Status: planning only, not executed  
Date: 2026-06-11  
Scope: `PawPal-Website/` visual layout, UI hierarchy, responsive behavior, and design-system cleanup  
Primary sources: live local audit, `DESIGN.md`, `UI_UX_UPGRADE_PLAN.md`, `src/app/globals.css`, key website routes

## 1. Audit Method

This review used the `Build Web Apps` frontend testing/debugging workflow and a design-review lens, but stopped at planning as requested.

Checked surfaces:

- `/` homepage at desktop 1280x720 and mobile 390x844.
- `/store` at desktop 1280x720 and mobile 390x844.
- `/globe` at desktop 1280x720.
- `/profile`, which redirects to `/auth` for signed-out users.
- `/about` desktop first viewport.
- `src/app/tag/[id]` source code for NFC finder page structure. A real tag page was not visually tested because no valid pet id/sample data was available.

Runtime notes:

- The existing repo dev server on port `3000` was locked/unresponsive, so a temporary copy was launched from `/private/tmp/geopet-web-visual-audit` on `http://localhost:3002` with `next dev --webpack`.
- Desktop and mobile Browser screenshots were inspected during the audit but not committed.
- No UI implementation changes were made.

Key static evidence:

- `src/app/globals.css` is 2,420 lines and contains route-specific visual systems, compatibility styles, dark-mode overrides, page panels, globe HUD, auth/profile/tag styles, and repeated decorative patterns.
- High-impact pages are large and visually dense: `HomeClientParts.tsx` 671 lines, `store/page.tsx` 888 lines, `profile/page.tsx` 738 lines.
- Search showed frequent use of gradients, `rounded-full`, decorative grid overlays, doodles, custom shadows, glass panels, uppercase tracking labels, and raw `rgba`/hex values outside the token layer.

## 2. Executive Diagnosis

The website already has a solid brand foundation: Paw Blue is restored, reusable UI primitives exist, the globe/map asset is meaningful, and the store has real product imagery. The main issue is not a missing design system; it is visual over-composition.

The current site often reads like several high-energy marketing prototypes stacked together:

- Large hero sections delay the product itself.
- Multiple surfaces reuse the same formula: small label, huge gradient headline, grid background, right-side card/panel, soft shadows.
- Trust/safety workflows use decorative chrome even where speed and clarity should dominate.
- Mobile first viewports are too tall before core content appears.
- Full-screen map UI competes with global navigation, weather strip, nearby panel, layer controls, tutorial, and chat surfaces.

The upgrade should move PawPal toward a calmer product-led website: fewer decorative layers, stronger real product evidence, denser but clearer mobile layouts, and route-specific priorities.

## 3. Highest Priority Findings

### P0. Mobile First Viewport Is Too Tall

Homepage mobile:

- First hero section height measured about 1,660px at 390x844.
- The globe/product visual started around `top: 1209px`, so the core visual asset is below the first full viewport.
- The first viewport shows headline, body, signal rail, and CTA, but not the map/globe product moment.

Store mobile:

- Hero section height measured about 896px.
- Category section started around `top: 977px`.
- First product card started around `top: 1255px`, so the commerce page shows no product card in the first viewport.
- Floating cart button appears before product discovery, which can feel premature.

Upgrade direction:

- Set route-specific mobile viewport budgets.
- Homepage mobile should show headline, one primary CTA, and a partial globe/product visual within the first viewport.
- Store mobile should show headline, search, categories, and the top of the first product card within the first viewport.

### P0. Store Conversion Content Is Pushed Too Far Down

Desktop Store is clean but has excessive vertical whitespace. Product cards are below the fold at both desktop and mobile sizes.

Upgrade direction:

- Convert Store hero into a compact commerce header.
- Keep promises/trust proof, but reduce them from three tall cards to a tight inline trust row or one collapsible assurance strip.
- Move product grid, sort/filter, and first product image up.
- Consider sticky filter/search behavior after scroll, but keep first viewport lightweight.

### P0. Trust/Safety Pages Need Less Decoration

NFC finder pages are the highest-trust path. The current `TagPageClient` structure is directionally right, but it still uses map-grid decoration, multiple detail cards, chips, and secondary CTAs near the rescue action.

Upgrade direction:

- Treat `/tag/[id]` as an emergency-first page, not a marketing page.
- Top priority: pet photo/name, "Contact owner now", owner-controlled privacy state, critical care details.
- Secondary details should be scannable below the primary rescue action.
- Add real-data screenshot QA for contact visible, contact hidden, missing avatar, long pet name, long breed, no health tags, and mobile dark mode.

### P1. Homepage Has Too Many Competing Signals

Desktop homepage has strong pieces, but the hero contains headline, body, signal rail, two CTAs, WebGL globe, orbit ring, and multiple floating cards. The visible DOM found 15 hero/readiness/workflow card-like elements and many gradient/grid/decorative elements.

Upgrade direction:

- Make the globe/map the single hero proof object.
- Keep at most 1-2 supporting callouts in the first viewport.
- Move secondary metrics and badges below the hero.
- Replace repeated card grids with a clearer product story: Walk -> Tag -> Finder -> Community/AI.

### P1. About/Auth/Profile Reuse the Same Template Too Often

About, Auth, Profile, Store, legal/support surfaces all share variations of:

- eyebrow label,
- oversized headline,
- grid background,
- rounded card/panel,
- soft blue/teal gradient,
- decorative doodles.

Upgrade direction:

- Define route families:
  - Marketing/editorial: homepage, about.
  - Transactional: store, checkout.
  - Trust/safety: tag, auth, profile.
  - Tool/map: globe.
- Give each family its own density, section rhythm, and allowed decorative motifs.

### P1. Globe Needs A Dedicated App Shell

The map is the strongest real product surface, but desktop `/globe` stacks global nav, weather strip, nearby HUD, right-side layer pills, map controls, status strip, tutorial, and chat.

Upgrade direction:

- Use a dedicated full-screen map shell.
- Collapse global nav into a smaller map header or floating brand/control cluster.
- Convert weather to a compact status chip or bottom sheet trigger.
- Move layer controls into a stable segmented control or map toolbar.
- Keep Nearby needs visible, but make it collapsible on small screens.
- Audit z-index and tap targets with the chat sheet and tutorial enabled.

### P1. Global CSS Needs Ownership Boundaries

`globals.css` is doing too much. It contains tokens, compatibility styles, route-specific layouts, dark-mode patches, map HUD styles, auth/profile/tag/page visuals, decorative animations, and component styling.

Upgrade direction:

- Keep only tokens, resets, typography defaults, focus styles, and truly global helpers in `globals.css`.
- Move route-specific visual classes near their routes or into shared UI primitives.
- Remove compatibility `!important` dark-mode patches only after each route is tokenized and screenshot-tested.
- Add a "no new route-specific class in globals without reason" rule.

### P1. Dark Mode Is Not Yet A First-Class Visual System

Dark mode is partly supported by token overrides and partly by broad compatibility selectors for `.bg-white`, `.text-gray-*`, `.border-gray-*`, and shadows.

Upgrade direction:

- Convert remaining page surfaces to semantic `paw-*` tokens.
- Replace compatibility overrides with explicit component variants.
- Validate homepage, store, auth, tag, globe overlays, checkout, and orders in dark mode.

## 4. Proposed Visual Direction

Use "PawPal Blue Product Utility" as the website direction:

- Paw Blue remains the brand/action anchor.
- Mint Teal is reserved for safety, verified, successful, and mapped-place states.
- Warm Orange is a small accent for community, missions, offers, and warmth, not a hero-gradient default.
- White/near-white surfaces should dominate public marketing and commerce.
- Real product evidence should replace generic decoration: map screenshots, product photography, app screens, NFC tag assets, and finder page examples.
- Pet warmth comes from copy, product imagery, and small details, not frequent doodles or decorative cards.

Do not make the site flatter or sterile. The goal is sharper hierarchy: fewer motifs used more deliberately.

## 5. Route Upgrade Plan

### 5.1 Homepage

Goal: make the first viewport communicate "pet safety map + smart tag ecosystem" faster.

Recommended changes:

- Reduce hero mobile height by moving the signal rail below CTAs or making it horizontal/scrollable.
- Bring the globe preview into the first mobile viewport, even if partial.
- Replace 4-5 floating globe cards with one anchored product callout and one small safety badge.
- Reduce repeated downstream card grids; use alternating bands with real screenshots or product frames.
- Keep CTA pair: primary "Open Live Map", secondary "Shop Smart Tags".
- Add a concise product journey section with fewer cards and stronger visual continuity.

Acceptance:

- Mobile 390x844 shows hero headline, primary CTA, and at least part of the globe/map visual.
- Desktop first viewport has no more than two floating hero callouts.
- No horizontal overflow at 390, 768, 1280, and 1440 widths.

### 5.2 Store

Goal: make it feel like a commerce surface, not a landing page before a commerce surface.

Recommended changes:

- Collapse hero into a compact shop header.
- Put product cards above the fold on desktop and near the first viewport on mobile.
- Convert promise cards into a single trust strip or smaller inline row.
- Make search + category filters visually stable and close to products.
- Reconsider cart FAB on empty cart; it should be less dominant before a product is added.
- Keep product cards image-led and reduce hover-only polish that does not matter on mobile.

Acceptance:

- First mobile product card begins before roughly `top: 900px`.
- Desktop first viewport includes the first row or top edge of products.
- Empty cart floating action does not obscure promise cards or product cards.

### 5.3 Globe

Goal: treat Globe as a full-screen tool.

Recommended changes:

- Add a map-specific shell that can hide/reduce standard nav height.
- Convert layer buttons from pill stacks to a compact segmented/map-control group.
- Collapse WeatherTicker into a single status affordance unless expanded.
- Move status strip away from map controls and bottom browser/safe areas.
- Define map HUD component tokens: panel opacity, border, compact typography, icon size, safe-area spacing.
- Test chat sheet, tutorial overlay, map controls, and weather state together.

Acceptance:

- Map remains the dominant surface.
- HUD controls do not overlap important map controls at desktop and mobile.
- Weather fetch failures render as quiet UI state, not console noise.

### 5.4 Auth and Profile

Goal: keep account entry trustworthy, fast, and form-focused.

Recommended changes:

- Keep the split layout on desktop, but reduce the left visual card's decorative grid intensity.
- On mobile, prioritize the form immediately after nav.
- Align Auth, Profile, and Tag around trust/safety semantics rather than generic marketing panels.
- Replace excessive chips with structured rows where repeated data is expected.
- For Profile, separate "owner profile", "pet identity", and "NFC readiness" as task regions.

Acceptance:

- Signed-out `/profile -> /auth` never appears visually blank.
- Mobile auth form is reachable without excessive scroll.
- Form controls use shared `Input`, `Button`, and `StatusMessage` where practical.

### 5.5 NFC Finder Page

Goal: make scanned tag pages fast to understand under stress.

Recommended changes:

- Build a dedicated emergency-first layout.
- Primary CTA remains "Contact owner now" and should be visually dominant.
- Keep privacy notice adjacent to contact state.
- Critical pet attributes should appear as dense rows, not decorative tiles when screen space is tight.
- Add edge-case states:
  - hidden contact,
  - missing pet image,
  - long multilingual pet names,
  - no health badges,
  - owner missing,
  - blood type/care notes present.

Acceptance:

- At 390x844, contact action is visible in the first viewport when contact exists.
- Hidden-contact state is obvious and reassuring.
- Page remains legible in dark mode and at increased text size.

### 5.6 About, Help, Legal, Footer

Goal: make secondary pages credible and quiet.

Recommended changes:

- About should feel editorial and founder/product credible, not like a duplicate homepage.
- Reduce metric tiles unless backed by source notes.
- Reduce repeated doodles and gradient labels.
- Help/legal pages should prioritize scanning, anchors, and task links.
- Footer should stay calm and useful; avoid turning it into another hero-like surface.

Acceptance:

- About desktop first viewport has one clear story and one supporting visual system, not multiple competing card groups.
- Help/legal pages pass mobile scan tests with headings, anchors, and clear support paths.

## 6. Design-System Workstreams

### Tokens

- Keep `design/tokens/pawpal.tokens.json`, `DESIGN.md`, and `globals.css` synchronized.
- Add semantic tokens for map HUD, commerce, rescue/finder, and form surfaces if needed.
- Avoid new raw `rgba`, hard-coded hex, and arbitrary shadows in route files unless documented.

### Components

Prioritize these shared component families:

- `SiteHero`: route-family variants for marketing, commerce, trust, and tool entry.
- `TrustStrip`: compact assurance row replacing repeated promise cards.
- `MapHudPanel`, `MapLayerControl`, `MapStatusChip`.
- `FinderActionPanel` for NFC rescue pages.
- `CommerceHeader`, `CategoryFilter`, `CartAction`.
- `FormPanel`, `SegmentedControl`, `InfoRow`, `DataChip`.

### Visual Motifs

Allowed motifs should be explicit:

- Map grid: only on map/product-context surfaces, at lower opacity.
- Doodles: limited to secondary warmth moments, not every route hero.
- Gradient text: reserved for one or two brand moments, not default route headings.
- Rounded-full: only for avatars, true circular controls, status dots, or compact tags where pill semantics are real.

## 7. Execution Sequence

Do not implement until this plan is approved.

### Phase 0. Baseline Stabilization

- Resolve current dev-server lock on port `3000`.
- Capture fresh desktop/mobile screenshots for `/`, `/store`, `/globe`, `/auth`, `/about`, `/tag/[sample-id]`, `/store/checkout`, `/store/orders`, `/store/success`.
- Save evidence under `design/assets/review/website-visual-upgrade-2026-06-11/`.
- Record console warnings/errors per route.

### Phase 1. Design-System Cleanup

- Extract route-specific CSS out of `globals.css`.
- Define route-family layout primitives.
- Normalize button/chip/radius usage to `DESIGN.md`.
- Reduce compatibility dark-mode overrides only after route screenshots pass.

### Phase 2. First Viewport Fixes

- Redesign homepage hero desktop/mobile.
- Redesign store header and product discovery area.
- Re-test 390, 768, 1280, and 1440 widths.

### Phase 3. Product Tool Surfaces

- Refactor Globe shell and HUD.
- Validate WeatherTicker failure/loading/success states.
- Test tutorial + chat + layer controls together.

### Phase 4. Trust and Account Surfaces

- Redesign `/auth`, `/profile`, and `/tag/[id]` around trust workflows.
- Add real NFC tag sample-data QA.
- Validate long strings and dark mode.

### Phase 5. Secondary Pages and Final Polish

- Quiet down About, Help, Legal, Footer.
- Run full screenshot sweep and interaction smoke checks.
- Update `DESIGN.md` and `UI_UX_UPGRADE_PLAN.md` if the approved direction changes canonical rules.

## 8. QA Gates Before Any Visual Upgrade Ships

- `npm run lint`
- `npm run build`
- Browser checks for page identity, not blank, no framework overlay, no relevant console errors.
- Desktop and mobile screenshots for each changed route.
- No horizontal overflow at 390px.
- Reduced-motion check for decorative and Framer Motion animations.
- Dark-mode screenshots for Home, Store, Auth, Tag, Globe overlays, Checkout.
- Text scaling and long-string checks for English, Dutch, French, German, and Chinese where relevant.
- Keyboard focus pass for nav, store filters, cart, auth form, finder CTA, globe layer controls.

## 9. Non-Goals For This Plan

- No database, auth, Stripe, Supabase, AI, or map-search behavior changes.
- No new brand palette.
- No full rebuild of the website framework.
- No design implementation in this planning pass.

## 10. Recommended First Implementation Batch

When approved, start with the highest visible impact and lowest backend risk:

1. Stabilize baseline screenshots and dev server.
2. Refactor Store first viewport so products appear earlier.
3. Refactor Homepage mobile hero so the globe/product visual appears in the first viewport.
4. Extract shared compact trust strip and route hero primitives.

This sequence gives PawPal immediate visual improvement while keeping the implementation reversible and easy to review.
