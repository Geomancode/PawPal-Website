# Diff Attribution: Round 10 Profile Task Readiness

Date: 2026-06-11
Owner: Codex

This attribution compares Round 10 work against `DIFF_BASELINE.md` and the baseline snapshots under `evidence/baseline/`.

## Final Hashes

| File | Final SHA-256 | Round 10 attribution |
| --- | --- | --- |
| `src/app/profile/page.tsx` | `5da4ed8c8b2f2884a93fca3e618a9bbcc1f4d1708658d0bc89d1aec49d4b149d` | Refactored into data/auth/persistence container; behavior preserved. |
| `src/app/profile/ProfileWorkspaceView.tsx` | `5549d607bceb1a85585dfa7c07102337e7c88951c67606cb1e6fb6a3c6bfe993` | New route-local non-page presentation module; includes add-mode root class for mobile evidence layout. |
| `src/app/globals.css` | `74ed0a9ba6f814b455c3d2daa98e4ad5fccd102756215860f15bf84886ee5d49` | Profile-scoped workspace/readiness/pet-card styles added within an already dirty file, plus mobile first-viewport rework after Design review. |
| `src/components/ui/StatusMessage.tsx` | `c1928f79f24aab42b5e660ddf054753f622f0af70d0ddba8c8d8c7ca47b7a736` | Unchanged in Round 10. |
| `src/components/ui/Button.tsx` | `f786856a95f8ae9217736fe765d33bbc8f96b730669fc764f69415cd555059bf` | Unchanged in Round 10. |
| `src/components/ui/Input.tsx` | `6998df9e6b0f9401774c3e843b2c9ef90a553f4ac26bfc896973908e18d21114` | Unchanged in Round 10. |

## Behavior Boundary Audit

Preserved in `src/app/profile/page.tsx`:

- Unauthenticated redirect remains `if (!authLoading && !user) router.push("/auth")`.
- Profile fetch remains `supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()`.
- Missing profile fallback remains an upsert with `onConflict: "id"`.
- Pet fetch remains `supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })`.
- Profile save remains `.from("profiles").update({ display_name, bio, location_city }).eq("id", user.id)`.
- Pet create remains `.from("pets").insert({ owner_id, name, species_group, breed, blood_type, owner_contact, social_traits }).select("*").single()`.
- PWA events remain `beforeinstallprompt` and `appinstalled`.
- Install fallback still instructs the user to use the browser menu when no prompt is available.
- Public tag links remain `/tag/${pet.id}`.
- The add-mode root class only affects route-local presentation styling; it does not alter add-pet persistence or validation behavior.

Not changed in Round 10:

- AuthProvider.
- Supabase schema, policies, migrations, or API routes.
- Payment/Stripe code.
- Deployment, CI, environment variables, or package dependencies.
- Shared UI primitives listed above.

## Temporary Files

Temporary harness route:

- Added during evidence: `src/app/round10-profile-fixture/[state]/page.tsx`.
- Removed before final build and final signoff.
