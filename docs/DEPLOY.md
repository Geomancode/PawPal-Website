# PawPal Website Deployment

PawPal Website deploys on Vercel. The deployment path is automatic: merge to `main`, Vercel pulls the repository, installs dependencies, runs `npm run build`, and publishes the new Production deployment.

Do not run a manual production deploy for normal changes. Use Vercel Preview deployments for branch validation, then merge the approved pull request into `main`.

## Environments

| Environment | Config source | Deploy trigger | Notes |
|---|---|---|---|
| Local dev | `.env.local` copied from `.env.example` | `npm run dev` | Keep `.env.local` untracked and use only sandbox/test credentials. |
| Preview | Vercel Project Settings > Environment Variables > Preview | Pushes to non-main branches or pull requests | Use Supabase staging/dev projects and Stripe test mode. |
| Production | Vercel Project Settings > Environment Variables > Production | Merge to `main` | Use production Supabase values, but keep Stripe in test mode until launch approval changes that policy. |

`NEXT_PUBLIC_` values are exposed to the browser bundle. Server-only secrets such as `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` must not be duplicated with a `NEXT_PUBLIC_` prefix.

## Environment Variables

Use `.env.example` as the complete local template. Configure the same keys in Vercel for Preview and Production.

| Variable | Scope | Required | Source |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public client/server | Yes | Supabase Dashboard > Project Settings > API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client/server | Yes | Supabase Dashboard > Project Settings > API anon/publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only secret | Yes | Supabase Dashboard service role key. Never expose to client code. |
| `GEMINI_API_KEY` | Server-only secret | Yes | Google AI Studio Gemini API key. |
| `GOOGLE_PLACES_API_KEY` | Server-only secret | Yes | Google Cloud Console Places API key. |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Public client key | Yes | Google Cloud Console browser-restricted Maps key. |
| `NEXT_PUBLIC_BASE_URL` | Public client/server | Yes | Local URL, Preview URL, or production site URL used by checkout redirects. |
| `STRIPE_SECRET_KEY` | Server-only secret | Yes | Stripe test mode secret key, `sk_test_...` only. |
| `STRIPE_WEBHOOK_SECRET` | Server-only secret | Yes | Stripe test mode webhook signing secret, `whsec_test...` only. |
| `STRIPE_BASIC_PRICE_ID` | Server-only config | Yes | Stripe test mode Basic monthly price ID. |
| `STRIPE_PRO_PRICE_ID` | Server-only config | Yes | Stripe test mode Pro monthly price ID. |
| `NEXT_PUBLIC_BASIC_MONTHLY_EUR` | Public display config | Yes | Product pricing value matching the Basic Stripe test price. |
| `NEXT_PUBLIC_PRO_MONTHLY_EUR` | Public display config | Yes | Product pricing value matching the Pro Stripe test price. |
| `SENTRY_DSN` | Server-side observability config | No | Sentry project DSN. Leave unset until Sentry is enabled. |
| `NODE_ENV` | Runtime | Yes | Set automatically by Next.js/Vercel. Do not override in Vercel unless debugging a platform issue. |

Stripe is sandbox-only in this project state. Do not add production-mode Stripe keys or production-mode price values to Vercel, `.env.local`, or documentation until launch requirements explicitly change.

## Vercel Setup

1. Import the `PawPal-Website` repository into Vercel.
2. Keep the framework preset as Next.js.
3. Let `vercel.json` provide `installCommand` and `buildCommand`; the build command must stay `npm run build`.
4. Add every variable listed above to Vercel Project Settings > Environment Variables.
5. Configure Preview and Production values separately. Preview should point at staging/dev services; Production should point at production services.
6. Confirm pull requests receive Preview deployments before merging.
7. Merge to `main` only after the branch passes review and local `npm run build`.

## Post-Deploy Health Check

After Vercel publishes a Preview or Production deployment, verify the health endpoint:

```bash
curl -fsS https://<deployment-url>/api/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "checks": {
    "supabase": "ok"
  }
}
```

If the endpoint returns HTTP 503 or `"status": "degraded"`, check the Supabase URL/key pair, service availability, table access for `places`, and Vercel environment selection for that deployment.

## Rollback

Use Vercel's deployment history for rollback:

1. Open the Vercel project.
2. Go to Deployments.
3. Select the last known-good deployment.
4. Use Promote to Production or the rollback action shown by Vercel.
5. Run the `/api/health` check against the restored production URL.

If rollback was caused by environment variables, fix the Preview and Production variable sets before re-promoting a newer deployment.
