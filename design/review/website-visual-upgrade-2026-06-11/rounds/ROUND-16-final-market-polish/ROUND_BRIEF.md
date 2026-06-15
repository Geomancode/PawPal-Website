# Round 16 Brief - Final Market Polish

Date: 2026-06-14

## Goal

Resolve the repeated launch-risk note that the mobile PWA install prompt competes with first-viewport route CTAs on Home, Store, and Help.

## Scope

- Primary file: `src/components/PwaRuntime.tsx`.
- Evidence route smoke: `/`, `/store`, `/help` at 390x844.
- Reuse the strict CDP matrix script from Round 15 after the implementation change.

## Non-Goals

- No service worker behavior change.
- No manifest, cache, offline, update, or install API change.
- No homepage, store, help, nav, footer, auth, payment, Supabase, or API implementation changes.

## Acceptance Target

- Install offer does not appear in immediate mobile first viewport smoke.
- Install offer can still appear after a delay when the browser provides `beforeinstallprompt`.
- Users can dismiss the install offer for the session.
- Offline and update-ready notices continue to render immediately when relevant.
- `npm run lint`, `npm run build`, and strict CDP matrix pass.
