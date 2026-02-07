import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton instance for browser client
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Create or get the Supabase client for client-side usage
 * This prevents multiple GoTrueClient instances warning
 */
export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return browserClient;
}

// Export the singleton client
export const supabase = createClient();
