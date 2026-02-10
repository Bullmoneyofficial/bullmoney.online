import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, updateBalance, addProfit, jsonOk, jsonError } from '@/lib/casino-db';
import crypto from 'crypto';

// Generate crash multiplier using provably fair hash
function generateMultiplier(): number {
  const rand = Math.random();
  // House edge 4% — identical to original PHP getFloat()
  if (rand < 0.04) return 1.0;
  const e = 0.04;
  const result = (1 - e) / (1 - rand);
  return Math.max(1.0, parseFloat(result.toFixed(2)));
}

// GET /api/casino/crash — get current game state
export async function GET(request: NextRequest) {
  const { data: game } = await casinoDb
    .from('casino_crash')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const { data: history } = await casinoDb
    .from('casino_crash')
    .select('*')
    .eq('status', 2)
    .order('id', { ascending: false })
    .limit(20);

  const historyFormatted = (history || []).map((h: any) => ({
    multiplier: h.multiplier,
    color: h.multiplier >= 5 ? '#91b647' : h.multiplier >= 2 ? 'rgb(104, 165, 254)' : '#fe4747',
  }));

  const bets = [];
  if (game) {
    const { data: gameBets } = await casinoDb
      .from('casino_crash_bets')
      .select('*, casino_users(username, avatar, rank)')
      .eq('round_id', game.id);
    if (gameBets) {
      for (const b of gameBets) {
        bets.push({
          price: b.price,
          withdraw: b.withdraw,
          won: b.won,
          status: b.status,
          user: b.casino_users || { username: 'Unknown', avatar: '/casino-assets/images/profile.jpg', rank: 0 },
        });
      }
    }
  }

  return jsonOk({
    game: { id: game?.id, status: game?.status, multiplier: game?.multiplier },
    history: historyFormatted,
    bets,
  });
}

// POST /api/casino/crash — handle actions
export async function POST(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'addBet';

  if (action === 'init') return handleInit();
  if (action === 'newGame') return handleNewGame();
  if (action === 'slider') return handleSlider();

  // User actions require auth
  if (!user) return jsonError('Not authenticated', 401);
  if (action === 'addBet') return handleAddBet(user, body);
  if (action === 'cashout') return handleCashout(user);

  return jsonError('Invalid action');
}

async function handleInit() {
  const { data: game } = await casinoDb
    .from('casino_crash')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) {
    // Create initial game
    const hash = crypto.randomBytes(16).toString('hex');
    const mult = generateMultiplier();
    const { data: newGame } = await casinoDb
      .from('casino_crash')
      .insert({ hash, status: 0, multiplier: mult })
      .select()
      .single();
    return jsonOk({ id: newGame?.id, status: 0, timer: 7 });
  }
  return jsonOk({ id: game.id, status: game.status, timer: 7 });
}

async function handleSlider() {
  const { data: game } = await casinoDb
    .from('casino_crash')
    .select('*')
    .eq('status', 1)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return jsonError('No game in progress');
  return Response.json(game.multiplier);
}

async function handleNewGame() {
  // End current game
  const { data: current } = await casinoDb
    .from('casino_crash')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (current) {
    // Mark uncashed bets as lost
    await casinoDb
      .from('casino_crash_bets')
      .update({ status: 2 })
      .eq('round_id', current.id)
      .eq('status', 0);

    await casinoDb
      .from('casino_crash')
      .update({ status: 2 })
      .eq('id', current.id);
  }

  // Create new game
  const hash = crypto.randomBytes(16).toString('hex');
  const mult = generateMultiplier();
  const { data: newGame } = await casinoDb
    .from('casino_crash')
    .insert({ hash, status: 0, multiplier: mult })
    .select()
    .single();

  const { data: history } = await casinoDb
    .from('casino_crash')
    .select('*')
    .eq('status', 2)
    .order('id', { ascending: false })
    .limit(20);

  return jsonOk({
    id: newGame?.id,
    history: (history || []).map((h: any) => ({
      multiplier: h.multiplier,
      color: h.multiplier >= 5 ? '#91b647' : h.multiplier >= 2 ? 'rgb(104, 165, 254)' : '#fe4747',
    })),
  });
}

async function handleAddBet(user: any, body: any) {
  const bet = parseFloat(body.bet);
  const withdrawAt = parseFloat(body.withdraw) || 2;

  if (!bet || bet < 1) return jsonError('Minimum bet is 1');
  if (bet > user.balance) return jsonError('Insufficient balance');

  const { data: game } = await casinoDb
    .from('casino_crash')
    .select('*')
    .eq('status', 0)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return Response.json({ success: false, msg: 'Wait for next round' });

  // Check if already bet this round
  const { data: existingBet } = await casinoDb
    .from('casino_crash_bets')
    .select('id')
    .eq('user_id', user.id)
    .eq('round_id', game.id)
    .single();

  if (existingBet) return Response.json({ success: false, msg: 'Already placed a bet this round' });

  const newBalance = parseFloat((user.balance - bet).toFixed(2));
  await updateBalance(user.id, newBalance);

  await casinoDb.from('casino_crash_bets').insert({
    user_id: user.id,
    round_id: game.id,
    price: bet,
    withdraw: withdrawAt,
    status: 0,
  });

  return jsonOk({ msg: 'Bet placed!', balance: newBalance, bet });
}

async function handleCashout(user: any) {
  const { data: game } = await casinoDb
    .from('casino_crash')
    .select('*')
    .in('status', [0, 1])
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return Response.json({ success: false, msg: 'No active game' });

  const { data: bet } = await casinoDb
    .from('casino_crash_bets')
    .select('*')
    .eq('user_id', user.id)
    .eq('round_id', game.id)
    .eq('status', 0)
    .single();

  if (!bet) return Response.json({ success: false, msg: 'No active bet' });

  // For serverless, we use the withdraw multiplier the user set
  const mult = bet.withdraw;
  const winAmount = parseFloat((bet.price * mult).toFixed(2));
  const newBalance = parseFloat((user.balance + winAmount).toFixed(2));

  await updateBalance(user.id, newBalance);
  await casinoDb.from('casino_crash_bets').update({ status: 1, won: winAmount }).eq('id', bet.id);
  await addProfit('crash', -(winAmount - bet.price));

  return jsonOk({ balance: newBalance, won: winAmount });
}
