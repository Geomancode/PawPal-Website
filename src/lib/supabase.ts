import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ctmoljqcjjmgdcsbyfdi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Ynl0XnP2w86t-JRnCQM7Bw_6JFC8_tm";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
