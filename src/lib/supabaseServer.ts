import { createClient } from "@supabase/supabase-js";
import { lazySupabaseClient, requirePublicSupabaseConfiguration } from "@/lib/supabaseConfiguration";

/** Public reads only. Authenticated reads must use the request-local client. */
export const supabaseServer = lazySupabaseClient(() => {
  const { url, key } = requirePublicSupabaseConfiguration();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
});

/** RLS reads use the same JWT that the route verified. */
export function createUserScopedSupabaseClient(accessToken: string) {
  if (!accessToken.trim()) throw new Error("A verified access token is required");
  const { url, key } = requirePublicSupabaseConfiguration();
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
