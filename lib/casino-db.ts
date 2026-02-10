import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client for casino API routes
export const casinoDb = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// Casino User helpers
// ============================================

export async function getCasinoUser(userId: number) {
  const { data } = await casinoDb
    .from('casino_users')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function getCasinoUserByToken(token: string) {
  const { data } = await casinoDb
    .from('casino_users')
    .select('*')
    .eq('unique_id', token)
    .single();
  return data;
}

export async function updateBalance(userId: number, newBalance: number) {
  await casinoDb
    .from('casino_users')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function getSettings() {
  const { data } = await casinoDb
    .from('casino_settings')
    .select('*')
    .eq('id', 1)
    .single();
  return data;
}

// ============================================
// Auth: extract casino user from request cookie/header
// ============================================

export function getCasinoToken(request: Request): string | null {
  // Check Authorization header first
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  
  // Check cookie
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/casino_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function authenticateCasinoUser(request: Request) {
  const token = getCasinoToken(request);
  if (!token) return null;
  return getCasinoUserByToken(token);
}

// ============================================
// Profit tracking
// ============================================

export async function addProfit(game: string, amount: number) {
  await casinoDb.from('casino_profit').insert({
    game,
    sum: amount,
    created_at: new Date().toISOString(),
  });
}

// ============================================
// JSON response helpers
// ============================================

export function jsonOk(data: Record<string, unknown>) {
  return Response.json({ success: true, data });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message, success: false }, { status });
}
