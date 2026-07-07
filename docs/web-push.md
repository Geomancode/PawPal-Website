# Web Push

PawPal Website uses standards-based VAPID Web Push. It does not depend on Firebase.

## Environment

Generate VAPID keys locally:

```bash
npx web-push generate-vapid-keys
```

Set these values in `.env.local` for local work and in the deployment environment for production:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:ops@example.com
PUSH_WEBHOOK_SECRET=...
```

Do not commit real private keys or webhook secrets.

## Subscription Flow

Authenticated users manage browser push from `/profile`.

The browser requests notification permission, subscribes through `/sw.js`, and posts the subscription to `/api/push/subscribe` with the current Supabase access token. The route verifies that user session and upserts `public.web_push_subscriptions` by endpoint.

Disabling push unsubscribes the browser endpoint and deletes the matching row for the authenticated user.

## Send API

`POST /api/push/send` is designed for trusted server/webhook callers.

Required header:

```http
x-push-secret: <PUSH_WEBHOOK_SECRET>
```

Body:

```json
{
  "userId": "00000000-0000-0000-0000-000000000000",
  "title": "New PawPal alert",
  "body": "You have a new notification.",
  "url": "/profile"
}
```

The route sends the payload to every stored endpoint for `userId`. Expired endpoints that return `404` or `410` are deleted automatically.

## Supabase Webhook Wiring

Configure this at deploy time in the Supabase dashboard:

1. Open Database Webhooks.
2. Create a webhook on `public.notifications`.
3. Set the event to `INSERT`.
4. Set the method to `POST`.
5. Set the target URL to `https://<website-domain>/api/push/send`.
6. Add header `x-push-secret: <PUSH_WEBHOOK_SECRET>`.
7. Map the inserted row into the send body. Use `record.user_id` for `userId`, a short notification title, a readable body, and the PawPal destination URL.

The database webhook is intentionally not created by migration because each deployment owns its website domain and secret rotation policy.
