import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

// PRIORITIZE SERVICE KEY:
// We try to use the Service Role Key first (for API routes/Admin actions).
// If not found, we fall back to the Anon Key (for client-side read-only).
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

const usingPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (usingPlaceholder) {
  console.warn("Supabase env vars missing. Using placeholder client for build/runtime safety.");
}

// Create a single instance
export const supabase = createClient(supabaseUrl, supabaseKey);