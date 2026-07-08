# PawPal OG/Twitter Metadata Audit

Spec: 035 — Web OG 标签全覆盖审计与修复
Audit date: 2026-07-07
Canonical metadata base: `https://www.pawpal.be`

## Public Static Routes

| Route | Baseline title/description | Baseline OG/Twitter state | Fix | Disposition |
|---|---|---|---|---|
| `/` | Page-specific title and description existed. | Relied on root OG image `/images/app-mockup.png` at 1024x1024; no page-level OG URL/Twitter image. | Added full page metadata through `publicPageMetadata`, canonical `/`, page-specific OG/Twitter title/description/url, shared 1200x630 image. | Covered by `tool/og-verify.mjs`. |
| `/globe` | Page-specific title and description existed. | No page-level OG/Twitter fields; inherited generic root metadata. | Added full page metadata, canonical `/globe`, page-specific OG/Twitter fields, shared safe image. | Covered by `tool/og-verify.mjs`. |
| `/store` | Page-specific title and description existed. | No page-level OG/Twitter fields; checkout/order children inherited store metadata. | Added full store metadata and added noindex metadata to checkout/orders/success/admin children. | Covered by `tool/og-verify.mjs`. |
| `/about` | Page-specific title and description existed. | No page-level OG/Twitter fields; inherited generic root metadata. | Added full page metadata, canonical `/about`, page-specific OG/Twitter fields, shared safe image. | Covered by `tool/og-verify.mjs`. |
| `/help` | Page-specific title and description existed. | No page-level OG/Twitter fields; inherited generic root metadata. | Added full page metadata, canonical `/help`, page-specific OG/Twitter fields, shared safe image. | Covered by `tool/og-verify.mjs`. |
| `/privacy` | Page-specific title and description existed. | No page-level OG/Twitter fields; inherited generic root metadata. | Added full legal-page metadata, canonical `/privacy`, page-specific OG/Twitter fields, shared safe image. | Covered by `tool/og-verify.mjs`. |
| `/terms` | Page-specific title and description existed. | No page-level OG/Twitter fields; inherited generic root metadata. | Added full legal-page metadata, canonical `/terms`, page-specific OG/Twitter fields, shared safe image. | Covered by `tool/og-verify.mjs`. |
| `/guidelines` | Page-specific title and description existed. | No page-level OG/Twitter fields; inherited generic root metadata. | Added full legal/community metadata, canonical `/guidelines`, page-specific OG/Twitter fields, shared safe image. | Covered by `tool/og-verify.mjs`. |

## Public Dynamic Templates

| Route template | Baseline state | Fix | Disposition |
|---|---|---|---|
| `/post/[id]` | Dynamic title/description existed, but `og:image` used user-uploaded post images when present. | Switched to `publicPageMetadata`; keeps dynamic description and URL, uses shared safe image. | Source-checked by `tool/og-verify.mjs`; runtime route depends on database IDs. |
| `/group/[id]` | Dynamic title/description existed, but `og:image` used group avatar when present. | Switched to `publicPageMetadata`; keeps group title/description and URL, uses shared safe image. | Source-checked by `tool/og-verify.mjs`; runtime route depends on database IDs. |
| `/user/[id]` | Dynamic title/description existed, but `og:image` used user avatar when present. | Switched to `publicPageMetadata`; keeps profile title/description and URL, uses shared safe image. | Source-checked by `tool/og-verify.mjs`; runtime route depends on database IDs. |
| `/tag/[id]` | Dynamic title/description existed, but `og:image` used pet avatar when present. | Switched to `publicPageMetadata`; keeps pet safety title/description and URL, uses shared safe image. | Source-checked by `tool/og-verify.mjs`; runtime route depends on database IDs. |
| `/pet/[id]` | Redirect alias to `/tag/[id]`. | No separate OG target; route continues redirecting to audited tag template. | Source-checked by `tool/og-verify.mjs`. |

## Non-Public / Excluded Routes

| Route | Reason | Disposition |
|---|---|---|
| `/auth` | Login/signup flow, not a public landing/share target. | Added noindex metadata. |
| `/profile` | Authenticated account workspace. | Added noindex metadata. |
| `/store/checkout` | Payment flow with user/cart data. | Added noindex metadata. |
| `/store/orders` | Device-local order history. | Added noindex metadata. |
| `/store/success` | Checkout callback/status page. | Added noindex metadata. |
| `/store/admin` | Admin commerce surface. | Added noindex metadata. |
| `/admin/*` | Admin/moderation surfaces, already disallowed by robots. | Added admin layout noindex fallback; existing report-page noindex remains. |
| `/api/*` | API routes, not HTML share targets. | Excluded; already disallowed by robots. |

## Shared OG Image

Asset: `public/images/pawpal-og.jpg`

- Dimensions: 1200x630.
- Size: 64KB on disk after generation.
- Content safety: brand name, product value proposition, generic app/tag illustration, and `pawpal.be` only. No real names, email addresses, user avatars, pet photos, addresses, or account data.
