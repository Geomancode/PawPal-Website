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

The site expects Supabase and Stripe configuration through environment variables. Keep production secrets out of the repository and configure them in the deploy platform.

Common variables used by the website:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Check the API route or integration you are changing for any additional required variables.

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
