import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, updateBalance, addProfit, jsonOk, jsonError } from '@/lib/casino-db';

// GET /api/casino/jackpot — get current jackpot state
export async function GET() {
  const { data: game } = await casinoDb
    .from('casino_jackpot')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const { data: history } = await casinoDb
    .from('casino_jackpot')
    .select('*, casino_users(username, avatar)')
    .not('winner_id', 'is', null)
    .order('id', { ascending: false })
    .limit(50);

  let bets: any[] = [];
  let totalBank = 0;
  if (game) {
    const { data: gameBets } = await casinoDb
      .from('casino_jackpot_bets')
      .select('*, casino_users(username, avatar)')
      .eq('game_id', game.id)
      .order('id', { ascending: true });
    bets = gameBets || [];
    totalBank = bets.reduce((sum: number, b: any) => sum + b.price, 0);
  }

  // Build slider data (chance per user)
  const userTotals: Record<string, { username: string; avatar: string; total: number; color: string }> = {};
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
  let colorIdx = 0;
  for (const bet of bets) {
    const uid = String(bet.user_id);
    if (!userTotals[uid]) {
      userTotals[uid] = {
        username: bet.casino_users?.username || 'Unknown',
        avatar: bet.casino_users?.avatar || '/casino-assets/images/profile.jpg',
        total: 0,
        color: colors[colorIdx++ % colors.length],
      };
    }
    userTotals[uid].total += bet.price;
  }

  const slider = Object.entries(userTotals).map(([uid, data]) => ({
    user_id: uid,
    username: data.username,
    avatar: data.avatar,
    amount: data.total,
    chance: totalBank > 0 ? parseFloat(((data.total / totalBank) * 100).toFixed(2)) : 0,
    color: data.color,
  }));

  return jsonOk({
    game: { id: game?.id, status: game?.status },
    bank: totalBank,
    bets,
    slider,
    history: (history || []).map((h: any) => ({
      id: h.id,
      winner: h.casino_users?.username,
      bank: h.bank,
    })),
  });
}

// POST /api/casino/jackpot — handle actions
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'bet') {
    const user = await authenticateCasinoUser(request);
    if (!user) return jsonError('Not authenticated', 401);
    return handleBet(user, body);
  }
  if (action === 'draw') return handleDraw();

  return jsonError('Invalid action');
}

async function handleBet(user: any, body: any) {
  const bet = parseFloat(body.bet);
  if (!bet || bet < 1) return jsonError('Minimum bet is 1');
  if (bet > user.balance) return jsonError('Insufficient balance');

  const { data: game } = await casinoDb
    .from('casino_jackpot')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game || game.status !== 0) return jsonError('Game not accepting bets');

  const newBalance = parseFloat((user.balance - bet).toFixed(2));
  await updateBalance(user.id, newBalance);

  // Generate tickets
  const { data: lastBet } = await casinoDb
    .from('casino_jackpot_bets')
    .select('to_ticket')
    .eq('game_id', game.id)
    .order('to_ticket', { ascending: false })
    .limit(1)
    .single();

  const fromTicket = lastBet ? lastBet.to_ticket + 1 : 1;
  const ticketCount = Math.max(1, Math.floor(bet));
  const toTicket = fromTicket + ticketCount - 1;

  await casinoDb.from('casino_jackpot_bets').insert({
    user_id: user.id,
    game_id: game.id,
    price: bet,
    from_ticket: fromTicket,
    to_ticket: toTicket,
    balance: newBalance,
  });

  // Update game bank
  await casinoDb.from('casino_jackpot').update({
    bank: (game.bank || 0) + bet,
  }).eq('id', game.id);

  return jsonOk({ balance: newBalance, from: fromTicket, to: toTicket });
}

async function handleDraw() {
  const { data: game } = await casinoDb
    .from('casino_jackpot')
    .select('*')
    .eq('status', 0)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return jsonError('No active game');

  // Get all bets
  const { data: bets } = await casinoDb
    .from('casino_jackpot_bets')
    .select('*')
    .eq('game_id', game.id);

  if (!bets || bets.length === 0) return jsonError('No bets placed');

  // Get unique users
  const userIds = [...new Set(bets.map((b: any) => b.user_id))];
  if (userIds.length < 2) return jsonError('Need at least 2 players');

  // Find max ticket
  const maxTicket = Math.max(...bets.map((b: any) => b.to_ticket));
  const winningTicket = Math.floor(Math.random() * maxTicket) + 1;

  // Find winner
  const winnerBet = bets.find(
    (b: any) => winningTicket >= b.from_ticket && winningTicket <= b.to_ticket
  );
  const winnerId = winnerBet?.user_id;

  if (!winnerId) return jsonError('Failed to determine winner');

  // Calculate winnings (5% house cut)
  const totalBank = bets.reduce((sum: number, b: any) => sum + b.price, 0);
  const houseCut = parseFloat((totalBank * 0.05).toFixed(2));
  const winAmount = parseFloat((totalBank - houseCut).toFixed(2));

  // Pay winner
  const { data: winner } = await casinoDb.from('casino_users').select('balance').eq('id', winnerId).single();
  if (winner) {
    await updateBalance(winnerId, parseFloat((winner.balance + winAmount).toFixed(2)));
  }

  // Record profit
  await addProfit('jackpot', houseCut);

  // Build slider position (degrees for animation)
  let winnerChance = 0;
  const userBetTotals: Record<string, number> = {};
  for (const b of bets) {
    userBetTotals[b.user_id] = (userBetTotals[b.user_id] || 0) + b.price;
  }
  winnerChance = (userBetTotals[winnerId] / totalBank) * 100;

  // Calculate slider rotation
  let offset = 0;
  for (const [uid, total] of Object.entries(userBetTotals)) {
    const pct = (total / totalBank) * 100;
    if (String(uid) === String(winnerId)) {
      offset += pct / 2;
      break;
    }
    offset += pct;
  }
  const sliderDeg = 360 * 5 + (offset / 100) * 360;

  // Update game
  await casinoDb.from('casino_jackpot').update({
    status: 1,
    winner_id: winnerId,
    winner_ticket: winningTicket,
    bank: totalBank,
  }).eq('id', game.id);

  // Create new game
  await casinoDb.from('casino_jackpot').insert({ status: 0, bank: 0 });

  return jsonOk({
    winner_id: winnerId,
    winning_ticket: winningTicket,
    total_bank: totalBank,
    win_amount: winAmount,
    slider_deg: sliderDeg,
    chance: winnerChance,
  });
}
