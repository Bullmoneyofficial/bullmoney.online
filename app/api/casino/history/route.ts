import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, jsonOk, jsonError } from '@/lib/casino-db';

export async function GET(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  if (!user) return jsonError('Not authenticated', 401);

  const url = new URL(request.url);
  const game = url.searchParams.get('game') || 'all';

  const results: Record<string, any[]> = {};

  if (game === 'all' || game === 'dice') {
    const { data } = await casinoDb
      .from('casino_dice')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(50);
    results.dice = data || [];
  }

  if (game === 'all' || game === 'mines') {
    const { data } = await casinoDb
      .from('casino_mines')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(50);
    results.mines = data || [];
  }

  if (game === 'all' || game === 'crash') {
    const { data } = await casinoDb
      .from('casino_crash_bets')
      .select('*, casino_crash(multiplier)')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(50);
    results.crash = data || [];
  }

  if (game === 'all' || game === 'wheel') {
    const { data } = await casinoDb
      .from('casino_wheel_bets')
      .select('*, casino_wheel(winner_color)')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(50);
    results.wheel = data || [];
  }

  if (game === 'all' || game === 'jackpot') {
    const { data } = await casinoDb
      .from('casino_jackpot_bets')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(50);
    results.jackpot = data || [];
  }

  return jsonOk(results);
}
