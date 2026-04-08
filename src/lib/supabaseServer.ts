import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for use in Server Components and Route Handlers.
 *
 * This uses the service role or anon key directly (no cookie-based auth),
 * which is appropriate for public data reads like the NFC tag page.
 *
 * For authenticated server-side operations, consider using @supabase/ssr
 * with cookie-based session management.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Server-side: no need to persist sessions
    persistSession: false,
    autoRefreshToken: false,
  },
});
