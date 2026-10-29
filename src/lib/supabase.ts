import { createClient } from "@supabase/supabase-js";
import { lazySupabaseClient, requirePublicSupabaseConfiguration } from "@/lib/supabaseConfiguration";
export { getSupabaseConfigurationError } from "@/lib/supabaseConfiguration";

export const supabase = lazySupabaseClient(() => {
  const { url, key } = requirePublicSupabaseConfiguration();
  return createClient(url, key);
});
