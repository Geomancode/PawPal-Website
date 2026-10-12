import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for use in Server Components and Route Handlers.
 *
 * The shared client uses the public key without a user session, for public
 * reads such as the NFC tag page. Authenticated routes must verify their JWT
 * and create a request-local client below so RLS sees the caller's identity.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ctmoljqcjjmgdcsbyfdi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Ynl0XnP2w86t-JRnCQM7Bw_6JFC8_tm";

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Server-side: no need to persist sessions
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** A request-local client: RLS reads use the same JWT that the route verified. */
export function createUserScopedSupabaseClient(accessToken: string) {
  if (!accessToken.trim()) throw new Error("A verified access token is required");
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
