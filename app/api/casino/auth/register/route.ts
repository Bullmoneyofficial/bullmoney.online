import { NextRequest } from 'next/server';
import { casinoDb, jsonOk, jsonError } from '@/lib/casino-db';
import crypto from 'crypto';

// POST /api/casino/auth/register
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) return jsonError('All fields required');
  if (password.length < 8) return jsonError('Password must be at least 8 characters');

  const { data: existing } = await casinoDb
    .from('casino_users')
    .select('id')
    .eq('username', email)
    .single();

  if (existing) return jsonError('Email already taken!');

  const uniqueId = crypto.randomBytes(4).toString('hex');
  const refCode = crypto.randomBytes(5).toString('hex');
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

  const { data: user, error } = await casinoDb
    .from('casino_users')
    .insert({
      username: email,
      password,
      avatar: '/casino-assets/images/profile.jpg',
      ip,
      unique_id: uniqueId,
      ref_code: refCode,
      balance: 0,
    })
    .select()
    .single();

  if (error) return jsonError('Registration failed');

  const response = Response.json({ success: true, user: { id: user.id, username: user.username, balance: user.balance, avatar: user.avatar, rank: user.rank, unique_id: user.unique_id, admin: user.admin } });
  const headers = new Headers(response.headers);
  headers.set('Set-Cookie', `casino_token=${user.unique_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return new Response(response.body, { status: 200, headers });
}
