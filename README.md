# PawPal Website

PawPal Website is the public web surface for PawPal: pet safety profiles, NFC tag finder pages, the community map, app-share previews, and the PawPal store.

## Stack

- Next.js App Router
- React
- Tailwind CSS v4
- Framer Motion
- MapLibre GL
- Supabase
- Stripe Checkout
- Service worker and web manifest for install/offline support

## Local Development

Install dependencies from this directory:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Gates

Run these before shipping web changes:

```bash
npm run lint
npm run build
```

Useful smoke routes:

- `/`
- `/globe`
- `/store`
- `/store/checkout`
- `/store/orders`
- `/about`
- `/help`
- `/privacy`
- `/terms`
- `/tag/[id]`
- `/user/[id]`
- `/group/[id]`
- `/post/[id]`

## Environment

Copy `.env.example` to `.env.local` for local development and fill in local sandbox values. The example file lists every environment variable referenced by `src/`, including whether it is public, required, and where it comes from.

Keep production secrets out of the repository. `NEXT_PUBLIC_` values are exposed to browser code; server-only values such as `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` must not use that prefix. Stripe remains test-mode only in the current deployment policy.

For Vercel Preview/Production setup, health checks, and rollback steps, see [docs/DEPLOY.md](docs/DEPLOY.md).

## Design System

Follow `DESIGN.md` and `design/tokens/pawpal.tokens.json`.

The site uses Paw Blue as the primary action color, Warm Orange as the accent, and Mint Teal for trust/success moments. Prefer existing PawPal primitives in `src/components/ui` and keep rounded corners, focus states, shadows, and status messages consistent.

## Public Surfaces

- Home: communicates the loop between pet safety map, NFC tags, local community, and the app.
- Globe: renders the community map and gracefully falls back when location, tiles, or live data fail.
- Store: supports catalog fallback, cart persistence, Stripe checkout, and order history.
- Tag finder pages: prioritize emergency owner contact and privacy-first pet details.
- Share pages: route app deep links through a web fallback for user, group, and post shares.

## PWA Notes

`public/sw.js` caches the app shell and serves `/offline.html` for unavailable HTML requests. `PwaRuntime` registers the service worker and shows lightweight UI for offline mode, pending updates, and install prompts.

After changing `public/sw.js`, test both a clean install and an update from an already-open tab.
