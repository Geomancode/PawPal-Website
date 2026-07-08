# P2W2-3 Dynamic Fixture Harness Report

Date: 2026-07-08  
Repo: `/Users/nuemann/Desktop/GeoPet/PawPal-Website`  
Branch: `task/p2w2-3`  
Evidence root: `/Users/nuemann/Desktop/GeoPet/evidence/P2W2-3`

## Fixture Mechanism

Dynamic public routes now have a local-only fixture path for deterministic visual QA:

- `/tag/[id]`
- `/post/[id]`
- `/group/[id]`
- `/user/[id]`
- `/pet/[id]` through its existing redirect to `/tag/[id]`

Enable locally with:

```bash
P2W2_DYNAMIC_ROUTE_FIXTURES=1 npm run dev -- -p 3102
```

Capture evidence with:

```bash
P2W2_BASE_URL=http://localhost:3102 npm run capture:p2w2-3
```

Safety guard:

- Default is off. If `P2W2_DYNAMIC_ROUTE_FIXTURES` is absent, routes use the existing Supabase loading path.
- The flag is server-only, not `NEXT_PUBLIC_*`.
- `src/lib/p2w2DynamicRouteFixtures.ts` returns `false` immediately when `process.env.NODE_ENV === "production"`.
- The fixture JSON is read from disk only after the dev-only guard passes.
- Production data loading behavior is otherwise unchanged.

Runtime default-off check:

- Request: `http://localhost:3102/tag/p2w2-tag-contact-visible`
- Env: no `P2W2_DYNAMIC_ROUTE_FIXTURES`
- Result: rendered existing not-found content, not fixture content (`This PawPal route is not available`).

## Fixture IDs

| Route | Fixture ID | State |
| --- | --- | --- |
| `/tag/[id]` | `p2w2-tag-contact-visible` | Contact visible |
| `/tag/[id]` | `p2w2-tag-contact-hidden` | Contact hidden |
| `/tag/[id]` | `p2w2-tag-missing-avatar` | Missing pet avatar |
| `/tag/[id]` | `p2w2-tag-long-name` | Long pet name |
| `/tag/[id]` | `p2w2-tag-long-breed` | Long breed |
| `/tag/[id]` | `p2w2-tag-no-health-notes` | No health badges |
| `/tag/[id]` | `p2w2-tag-dark` | Dark color scheme |
| `/post/[id]` | `p2w2-post-populated` | Populated post |
| `/group/[id]` | `p2w2-group-populated` | Populated group |
| `/user/[id]` | `p2w2-user-populated` | Populated user |
| `/pet/[id]` | `p2w2-pet-populated` | Pet alias to populated tag |

## Screenshot Evidence

All states were captured at `1440x1000` and `390x844`. Light mode is the primary set; the tag dark state was captured in dark mode. The capture script set `pawpal-consent-v1=essential` in localStorage so the sitewide cookie banner would not obscure route-specific evidence.

| State | Route | Scheme | Desktop screenshot | Mobile screenshot |
| --- | --- | --- | --- | --- |
| Contact visible | `/tag/p2w2-tag-contact-visible` | light | `screenshots/tag-contact-visible__desktop-1440__light.png` | `screenshots/tag-contact-visible__mobile-390__light.png` |
| Contact hidden | `/tag/p2w2-tag-contact-hidden` | light | `screenshots/tag-contact-hidden__desktop-1440__light.png` | `screenshots/tag-contact-hidden__mobile-390__light.png` |
| Missing avatar | `/tag/p2w2-tag-missing-avatar` | light | `screenshots/tag-missing-avatar__desktop-1440__light.png` | `screenshots/tag-missing-avatar__mobile-390__light.png` |
| Long pet name | `/tag/p2w2-tag-long-name` | light | `screenshots/tag-long-name__desktop-1440__light.png` | `screenshots/tag-long-name__mobile-390__light.png` |
| Long breed | `/tag/p2w2-tag-long-breed` | light | `screenshots/tag-long-breed__desktop-1440__light.png` | `screenshots/tag-long-breed__mobile-390__light.png` |
| No health notes | `/tag/p2w2-tag-no-health-notes` | light | `screenshots/tag-no-health-notes__desktop-1440__light.png` | `screenshots/tag-no-health-notes__mobile-390__light.png` |
| Dark tag | `/tag/p2w2-tag-dark` | dark | `screenshots/tag-dark__desktop-1440__dark.png` | `screenshots/tag-dark__mobile-390__dark.png` |
| Populated post | `/post/p2w2-post-populated` | light | `screenshots/post-populated__desktop-1440__light.png` | `screenshots/post-populated__mobile-390__light.png` |
| Populated group | `/group/p2w2-group-populated` | light | `screenshots/group-populated__desktop-1440__light.png` | `screenshots/group-populated__mobile-390__light.png` |
| Populated user | `/user/p2w2-user-populated` | light | `screenshots/user-populated__desktop-1440__light.png` | `screenshots/user-populated__mobile-390__light.png` |
| Pet alias populated | `/pet/p2w2-pet-populated` | light | `screenshots/pet-alias-populated__desktop-1440__light.png` | `screenshots/pet-alias-populated__mobile-390__light.png` |

Additional evidence:

- Full-page screenshots: `screenshots/full/`
- Per-screenshot metadata: `meta/*.json`
- Summary: `meta/capture-summary.json`

## Automated QA Summary

`meta/capture-summary.json` reports:

- 22 rendered screenshot states.
- 0 capture failures.
- 0 page errors.
- 0 relevant console errors or warnings.
- 0 horizontal overflow cases.
- 0 edge-hit findings after hiding the sitewide consent banner.
- Production build grep found no fixture sample IDs and no fixture JSON filename under `.next/server` or `.next/static`.

## Per-State Visual Conclusions

| State | Conclusion |
| --- | --- |
| Contact visible | Pass. Primary contact CTA is visible in the first viewport; no overflow. Visual note: tag page remains card-heavy and mobile first viewport only hints at the next detail card. |
| Contact hidden | Pass. Hidden-contact warning appears instead of contact CTA and does not expose private contact data; no overflow. |
| Missing avatar | Pass. Pet avatar fallback renders correctly; no layout collapse. |
| Long pet name | Pass. Long name wraps without clipping or horizontal overflow. Visual note: H1 consumes much of the 390px first viewport. |
| Long breed | Pass. Long breed wraps without overflow. Visual note: mini fact grid becomes uneven, with the adjacent Age tile inheriting a tall row. |
| No health notes | Pass. Care fallback and empty health section render without errors. |
| Dark tag | Pass. Dark mode renders the tag surface without overflow or console errors. Visual note: warning panel uses a heavy brown/yellow treatment that should be reviewed in a future dark-mode primitive pass. |
| Populated post | Pass functionally. Visual issue: post content starts under the fixed navbar and the hero image is visibly clipped at the top on desktop and mobile. |
| Populated group | Pass functionally. Visual note: first card sits tight to the fixed navbar, with less top breathing room than the tag route. |
| Populated user | Pass functionally. Visual note: profile header begins directly under the fixed navbar, again less top breathing room than tag. |
| Pet alias populated | Pass. `/pet/[id]` redirects to the populated tag fixture and renders the expected tag page. |

## Visual Findings

| ID | Severity | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| P2W2-3-V01 | P2 | Populated share routes lack a consistent fixed-nav top buffer. `/post/[id]` is the clearest case: the hero image begins under the navbar and is clipped in both 1440 and 390 captures. `/group/[id]` and `/user/[id]` also begin tight to the navbar compared with `/tag/[id]`, which uses `pt-24`. | `post-populated__desktop-1440__light.png`, `post-populated__mobile-390__light.png`, `group-populated__mobile-390__light.png`, `user-populated__mobile-390__light.png` | Future visual task should normalize public share route shells under the fixed navbar. Not changed in this task. |
| P2W2-3-V02 | P3 | Tag page is stable but card-heavy. The emergency CTA is clear, but mobile first viewport mostly shows the rescue card and only a partial hint of details. | `tag-contact-visible__mobile-390__light.png`, `tag-contact-hidden__mobile-390__light.png` | Future tag/NFC visual pass can tighten the emergency surface while preserving privacy and action hierarchy. Not changed in this task. |
| P2W2-3-V03 | P3 | Long breed values make the mini fact grid visually uneven because the neighboring tile inherits the tall row. No overflow occurs. | `tag-long-breed__mobile-390__light.png` | Future component pass can let mini facts stack or use more flexible row sizing on narrow screens. Not changed in this task. |
| P2W2-3-V04 | P3 | Dark tag warning surface is readable but visually heavy, with brown/yellow emphasis stronger than the surrounding dark token system. | `tag-dark__mobile-390__dark.png`, `tag-dark__desktop-1440__dark.png` | Future dark-mode primitive pass should tune warning surfaces. Not changed in this task. |

## Limits

- This harness does not add production sample routes or production mock APIs.
- Fixture data intentionally exists only for local deterministic rendering.
- Visual findings above were recorded only; no visual, style, or component fixes were made.
