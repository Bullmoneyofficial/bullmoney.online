import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, updateBalance, addProfit, jsonOk, jsonError } from '@/lib/casino-db';

// POST /api/casino/dice/bet
export async function POST(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  if (!user) return jsonError('Not authenticated', 401);
  if (user.ban === 1) return jsonError('Account banned');

  const body = await request.json();
  const bet = parseFloat(body.bet);
  const percent = parseFloat(body.percent);
  const type = body.type; // 'min' or 'max'

  if (!bet || bet < 1) return jsonError('Minimum bet is 1');
  if (bet > user.balance) return jsonError('Insufficient balance');
  if (percent < 1 || percent > 90) return jsonError('Chance must be 1-90%');

  const random = Math.floor(Math.random() * 999999);
  const edge = Math.floor((percent / 100) * 999999);

  let win = false;
  if (type === 'min') {
    win = random <= edge;
  } else {
    win = random >= (999999 - edge);
  }

  const coef = parseFloat((100 / percent).toFixed(2));
  let newBalance: number;
  let winAmount = 0;

  if (win) {
    winAmount = parseFloat((bet * coef).toFixed(2));
    newBalance = parseFloat((user.balance - bet + winAmount).toFixed(2));
  } else {
    newBalance = parseFloat((user.balance - bet).toFixed(2));
  }

  await updateBalance(user.id, newBalance);

  // Record game
  await casinoDb.from('casino_dice').insert({
    user_id: user.id,
    bet,
    coef: win ? coef : 0,
    type,
    win: win ? winAmount : 0,
  });

  // Track profit
  if (!win) {
    await addProfit('dice', bet);
  } else {
    await addProfit('dice', -(winAmount - bet));
  }

  if (win) {
    return jsonOk({
      type: 'success',
      out: 'win',
      cash: winAmount,
      balance: newBalance,
      random,
    });
  }

  return jsonOk({
    type: 'success',
    out: 'lose',
    balance: newBalance,
    random,
    msg: `Rolled ${random}`,
  });
}
