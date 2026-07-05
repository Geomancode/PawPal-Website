# Spec 026 Performance Budget

## Targets

- Feed first screen: under 3s on a 4G device.
- Core API P95: under 500ms.
- Images: first-viewport critical images use preload/priority; non-critical images lazy-load; large images declare `sizes`.

## API Latency Probe

Probe file: `scripts/perf-probe.mjs`

Run with the dev server already started:

```bash
PERF_BASE_URL=http://localhost:3000 node scripts/perf-probe.mjs
```

Config:

- `PERF_BASE_URL`: defaults to `http://localhost:3000`.
- `PERF_PROBE_SAMPLES`: defaults to `7`.
- `PERF_BUDGET_MS`: defaults to `500`.
- `PERF_PROBE_TIMEOUT_MS`: defaults to `10000`.

Endpoints measured:

- `GET /api/health`
- `POST /api/search` with `{ "query": "dog park", "limit": 5 }`

The probe prints status counts, response bytes, P50, P95, and max latency. It fails on 5xx responses or P95 greater than or equal to the configured budget.

## Image Audit

First viewport priority:

- `src/components/Navbar.tsx` passes `priority` to the logo icon via `PawPalLogo`.
- `src/app/auth/page.tsx` uses priority for the first-viewport auth logo.
- `src/components/HomeClientParts.tsx` uses priority for the homepage app mockup.
- Shared entry pages use priority for their primary visual: post hero image, group avatar, user avatar, and tag rescue pet avatar.

Lazy loading:

- `PawPalLogo` defaults to `loading="lazy"` unless `priority` is explicitly passed.
- Homepage feature showcase screenshots are lazy-loaded.
- Shared post author avatars, user pet avatars, admin report avatars, admin media thumbnails, store detail images, and about-team photos are lazy-loaded.

Sizes:

- Existing `next/image` usages include fixed or responsive `sizes` values for homepage screenshots, app mockup, shared post hero images, avatars, admin thumbnails, and store detail images.

Known follow-up:

- User-generated remote images currently remain `unoptimized` because `next.config.ts` does not define stable `images.remotePatterns` for all uploaded media domains. Removing `unoptimized` should be paired with a canonical Supabase image transformation/thumbnail URL strategy and explicit remote patterns.
- Device-level Feed first-screen timing on 4G is not covered by this website probe and needs a separate browser/device run.
