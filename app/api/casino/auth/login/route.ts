import { NextRequest } from 'next/server';
import { casinoDb, jsonOk, jsonError } from '@/lib/casino-db';

// POST /api/casino/auth/login
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) return jsonError('All fields required');

  const { data: user } = await casinoDb
    .from('casino_users')
    .select('*')
    .eq('username', email)
    .eq('password', password)
    .single();

  if (!user) return jsonError('Invalid credentials!');
  if (user.ban === 1) return jsonError('Account is banned');

  const response = Response.json({ success: true, user: { id: user.id, username: user.username, balance: user.balance, avatar: user.avatar, rank: user.rank, unique_id: user.unique_id, admin: user.admin } });
  // Set cookie
  const headers = new Headers(response.headers);
  headers.set('Set-Cookie', `casino_token=${user.unique_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return new Response(response.body, { status: 200, headers });
}
