# Round 02 Diff Baseline

Status: Captured before Round 02 implementation
Date: 2026-06-11

Purpose:

Record the current dirty worktree before Round 02 code changes. Existing source/config changes outside Round 02 must not be attributed to this implementation round.

## Current Dirty Worktree Summary

`git diff --stat` before Round 02 implementation:

```text
README.md                          |   97 ++-
public/manifest.webmanifest        |   31 +-
public/sw.js                       |   54 +-
src/app/about/page.tsx             |   45 +-
src/app/auth/page.tsx              |   59 +-
src/app/globals.css                | 1313 +++++++++++++++++++++++++++++++++++-
src/app/globe/page.tsx             |   17 +-
src/app/group/[id]/page.tsx        |   11 +-
src/app/help/page.tsx              |  136 +++-
src/app/layout.tsx                 |   93 ++-
src/app/page.tsx                   |   15 +-
src/app/post/[id]/page.tsx         |   11 +-
src/app/privacy/page.tsx           |   73 +-
src/app/profile/page.tsx           |   38 +-
src/app/store/admin/page.tsx       |   23 +-
src/app/store/checkout/page.tsx    |   71 +-
src/app/store/orders/page.tsx      |   13 +-
src/app/store/page.tsx             |  104 ++-
src/app/store/success/page.tsx     |   10 +-
src/app/tag/[id]/TagPageClient.tsx |  327 +++++----
src/app/tag/[id]/page.tsx          |   45 +-
src/app/terms/page.tsx             |   71 +-
src/app/user/[id]/page.tsx         |    8 +-
src/components/Footer.tsx          |   59 +-
src/components/Globe.tsx           |    7 +-
src/components/GlobeFullPage.tsx   |   90 ++-
src/components/HomeClientParts.tsx |  240 +++++--
src/components/Navbar.tsx          |   29 +-
src/components/PwaRuntime.tsx      |  181 ++++-
src/components/ui/ProductCard.tsx  |   18 +-
src/components/ui/index.ts         |    2 +
31 files changed, 2784 insertions(+), 507 deletions(-)
```

## Existing Modified Files

```text
M README.md
M public/manifest.webmanifest
M public/sw.js
M src/app/about/page.tsx
M src/app/auth/page.tsx
M src/app/globals.css
M src/app/globe/page.tsx
M src/app/group/[id]/page.tsx
M src/app/help/page.tsx
M src/app/layout.tsx
M src/app/page.tsx
M src/app/post/[id]/page.tsx
M src/app/privacy/page.tsx
M src/app/profile/page.tsx
M src/app/store/admin/page.tsx
M src/app/store/checkout/page.tsx
M src/app/store/orders/page.tsx
M src/app/store/page.tsx
M src/app/store/success/page.tsx
M src/app/tag/[id]/TagPageClient.tsx
M src/app/tag/[id]/page.tsx
M src/app/terms/page.tsx
M src/app/user/[id]/page.tsx
M src/components/Footer.tsx
M src/components/Globe.tsx
M src/components/GlobeFullPage.tsx
M src/components/HomeClientParts.tsx
M src/components/Navbar.tsx
M src/components/PwaRuntime.tsx
M src/components/ui/ProductCard.tsx
M src/components/ui/index.ts
```

## Existing Untracked Files

```text
WEBSITE_VISUAL_UI_UPGRADE_PLAN_2026-06-11.md
design/assets/
design/review/website-visual-upgrade-2026-06-11/
public/offline.html
src/app/about/layout.tsx
src/app/error.tsx
src/app/globe/layout.tsx
src/app/help/layout.tsx
src/app/loading.tsx
src/app/not-found.tsx
src/app/privacy/layout.tsx
src/app/robots.ts
src/app/sitemap.ts
src/app/store/layout.tsx
src/app/terms/layout.tsx
src/components/GlobeStaticPreview.tsx
src/components/ui/AppDeepLinkButton.tsx
src/components/ui/StatusMessage.tsx
src/lib/site.ts
```

## Round 02 Attribution Rule

Round 02 implementation may attribute only changes made after this baseline and approved in `ROUND_BRIEF.md`.

Approved implementation file:

- `src/app/store/page.tsx`

Precise store-page pre-implementation snapshot:

- `evidence/store-page.pre-round02.tsx.snapshot`
- SHA-256: `0e650e9f353ec22cc950cec2e7c0e2c275e26182e5a27ff5d0357946658bacfc`

Approved documentation/evidence path:

- `design/review/website-visual-upgrade-2026-06-11/rounds/ROUND-02-store-first-viewport/`
- `design/assets/review/website-visual-upgrade-2026-06-11/round-02-store-first-viewport/`

If Round 02 needs any additional implementation file, the implementer must stop and request a brief amendment plus four-lead approval.
