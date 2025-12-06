import { createClient } from "@supabase/supabase-js";

/**
 * Safe Supabase client creator.
 * It won't crash the build if env vars are missing (e.g., during Vercel prerender).
 */
export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

 if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}


  return createClient(supabaseUrl, supabaseAnonKey);
};
