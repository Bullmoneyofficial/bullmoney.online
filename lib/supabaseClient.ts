import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// PRIORITIZE SERVICE KEY:
// We try to use the Service Role Key first (for API routes/Admin actions).
// If not found, we fall back to the Anon Key (for client-side read-only).
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables. Check .env.local");
}

// Create a single instance
export const supabase = createClient(supabaseUrl, supabaseKey);