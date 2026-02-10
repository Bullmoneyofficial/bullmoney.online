import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, updateBalance, getSettings, jsonOk, jsonError } from '@/lib/casino-db';

// GET - get user profile data
export async function GET(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  if (!user) return jsonError('Not authenticated', 401);

  return jsonOk({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance,
    avatar: user.avatar,
    ref_code: user.ref_code,
    unique_id: user.unique_id,
    tg_id: user.tg_id,
    tg_bonus_used: user.tg_bonus_used,
    bonus_at: user.bonus_at,
    created_at: user.created_at,
  });
}

// POST - handle user actions
export async function POST(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  if (!user) return jsonError('Not authenticated', 401);
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'bonus') return handleBonus(user);
  if (action === 'promo') return handlePromo(user, body);
  if (action === 'updateProfile') return handleUpdateProfile(user, body);
  if (action === 'balance') return jsonOk({ balance: user.balance });

  return jsonError('Invalid action');
}

async function handleBonus(user: any) {
  const settings = await getSettings();
  const bonusAmount = settings?.bonus_amount ?? 100;
  const bonusInterval = settings?.bonus_time ?? 300; // seconds

  if (user.bonus_at) {
    const lastBonus = new Date(user.bonus_at).getTime();
    const now = Date.now();
    const secondsSince = (now - lastBonus) / 1000;
    if (secondsSince < bonusInterval) {
      const remaining = Math.ceil(bonusInterval - secondsSince);
      return jsonError(`Bonus available in ${remaining} seconds`);
    }
  }

  const newBalance = parseFloat((user.balance + bonusAmount).toFixed(2));
  await updateBalance(user.id, newBalance);
  await casinoDb.from('casino_users').update({
    bonus_at: new Date().toISOString(),
  }).eq('id', user.id);

  return jsonOk({ balance: newBalance, amount: bonusAmount });
}

async function handlePromo(user: any, body: any) {
  const code = body.code?.trim();
  if (!code) return jsonError('Enter a promo code');

  const { data: promo } = await casinoDb
    .from('casino_promocodes')
    .select('*')
    .eq('code', code)
    .single();

  if (!promo) return jsonError('Invalid promo code');
  if (promo.count_uses <= 0) return jsonError('Promo code expired');

  // Check if already used
  const { data: used } = await casinoDb
    .from('casino_promo_log')
    .select('id')
    .eq('user_id', user.id)
    .eq('promo_id', promo.id)
    .single();

  if (used) return jsonError('You already used this code');

  const amount = promo.amount || 0;
  const newBalance = parseFloat((user.balance + amount).toFixed(2));
  await updateBalance(user.id, newBalance);

  // Record use
  await casinoDb.from('casino_promo_log').insert({
    user_id: user.id,
    promo_id: promo.id,
  });

  // Decrement uses
  await casinoDb.from('casino_promocodes').update({
    count_uses: promo.count_uses - 1,
  }).eq('id', promo.id);

  return jsonOk({ balance: newBalance, amount });
}

async function handleUpdateProfile(user: any, body: any) {
  const updates: Record<string, any> = {};
  if (body.username) updates.username = body.username.slice(0, 32);
  if (body.avatar) updates.avatar = body.avatar;

  if (Object.keys(updates).length === 0) return jsonError('Nothing to update');

  await casinoDb.from('casino_users').update(updates).eq('id', user.id);
  return jsonOk({ success: true });
}
