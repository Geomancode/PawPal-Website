# Diff Attribution: Round 05

Date: 2026-06-11

The worktree was already dirty before Round 05. Attribution below compares current files to the pre-round snapshots in `evidence/`.

## Files Changed In Round 05

| File | Round 05 change |
| --- | --- |
| `src/app/layout.tsx` | Added only `data-scroll-behavior="smooth"` to `<html lang="en">`. |
| `src/app/auth/page.tsx` | Tightened account copy, added form accessibility wiring, removed unconnected social-login visual buttons, and added email-account trust panel. |
| `src/app/store/orders/page.tsx` | Made empty order state explicitly Stripe-confirmed and applied `orders-empty-state` styling hook. |
| `src/app/store/success/page.tsx` | Improved missing-session status card, added no-charge explanation, added View Orders recovery action, and constrained success copy width. |
| `src/app/globals.css` | Added scoped auth/order/success selectors and changed `success-card-upgraded` from forced max-width to width-only so page max-width utilities work. |

## Files Confirmed Unchanged From Pre-Round Snapshots

| File | Current SHA-256 |
| --- | --- |
| `src/app/profile/page.tsx` | `c42b85fd44cfc5aec387cb1c65426f0c0c976fb1b1d2dac08ee82d988711cba2` |
| `src/app/tag/[id]/TagPageClient.tsx` | `005f519bf5a674908536e01109f9b607651d38654389c012866561dab6e55f1c` |
| `src/app/tag/[id]/page.tsx` | `3a279d70d8f045f400636c867a8cf8c48c024124a596a59677f2c1daa864088c` |
| `src/app/store/checkout/page.tsx` | `e98556e58dbb5855acddd44bf3754ea9da58d3e622112e3a038ebec3e6faa17c` |

## Protected Behavior Checklist

| Contract | Result |
| --- | --- |
| `auth/page.tsx`: no changes to `useAuth`, `signIn`, `signUp`, redirect destinations, validation semantics, or submitted credential fields. | PASS |
| `profile/page.tsx`: no changes to auth redirect logic, Supabase table names, selected fields, insert/update payloads, or protected profile/pet behavior. | PASS, file unchanged. |
| `tag/[id]/page.tsx`: no changes to Supabase tables, selected public fields, `eq("id", id)`, owner lookup, `notFound()` behavior, or metadata contract. | PASS, file unchanged. |
| `TagPageClient.tsx`: no changes to contact exposure, `mailto:` / `tel:` derivation, deep-link target, or valid finder CTA semantics. | PASS, file unchanged. |
| `store/checkout/page.tsx`: no changes to `loadCart`, empty-cart redirect, `/api/checkout`, Stripe redirect, or shipping/cart semantics. | PASS, file unchanged. |
| `store/orders/page.tsx`: no changes to order persistence/source behavior or recovery route semantics. | PASS; CTA still routes to `/store`. |
| `store/success/page.tsx`: no changes to `session_id`, `/api/checkout/session`, order save/cart clear conditions, subscription success logic, or existing recovery routes. | PASS; added secondary View Orders recovery for error state only. |
| `globals.css`: selector-level diff limited to auth/order/success trust selectors and width correction. | PASS |
| `layout.tsx`: diff is only `data-scroll-behavior="smooth"`. | PASS |
