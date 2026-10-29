import { createClient } from "@supabase/supabase-js";
import { requireSupabaseUrl, SupabaseConfigurationError } from "@/lib/supabaseConfiguration";

export function getSupabaseAdmin() {
  const url = requireSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new SupabaseConfigurationError();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
