import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Singleton instance for browser client - prevents multiple GoTrueClient instances
let browserClient: SupabaseClient | null = null;

/**
 * Get or create a Supabase client safe for client-side code (singleton pattern).
 * This prevents the "Multiple GoTrueClient instances" warning.
 */
export function createSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (browserClient) {
    return browserClient;
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn('Supabase public env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Creating client with empty credentials (will fail at runtime).');
    // Create a client anyway to satisfy runtime/TS expectations; operations will error if envs are truly missing.
    browserClient = createClient(SUPABASE_URL || "", SUPABASE_ANON || "");
    return browserClient;
  }
  
  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON);
  return browserClient;
}

// Export the singleton directly for convenience
export const supabase = createSupabaseClient();

/**
 * Create a Supabase client for server-side usage. Will throw if required env is missing.
 */
export function createServerSupabase(): SupabaseClient {
  const key = SUPABASE_SERVICE || SUPABASE_ANON;
  if (!SUPABASE_URL || !key) {
    throw new Error('Missing Supabase env for server client. Ensure SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is set.');
  }
  return createClient(SUPABASE_URL, key!);
}

// Optional: singleton server client (only if env present)
export const serverSupabase: SupabaseClient | null = (() => {
  try {
    return createServerSupabase();
  } catch (e) {
    return null;
  }
})();
