import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, updateBalance, addProfit, jsonOk, jsonError } from '@/lib/casino-db';

const COLOR_MULTIPLIERS: Record<string, number> = {
  black: 2,
  yellow: 3,
  red: 5,
  green: 50,
};

// Wheel rotation degrees per color (matching original getColor lookup table)
const COLOR_ROTATIONS: Record<string, number[]> = {
  black: [7, 31, 55, 79, 103, 127, 151, 175, 199, 223, 247, 271, 295, 319, 343],
  yellow: [19, 67, 91, 139, 163, 211, 235, 283, 307, 355],
  red: [43, 115, 187, 259, 331],
  green: [368],
};

function pickWinnerColor(bets: any[]): string {
  // Calculate total for each color
  const colorTotals: Record<string, number> = { black: 0, yellow: 0, red: 0, green: 0 };
  for (const bet of bets) {
    colorTotals[bet.color] = (colorTotals[bet.color] || 0) + bet.price;
  }

  // House advantage: pick color with least money bet
  let minColor = 'black';
  let minAmount = Infinity;
  for (const [color, amount] of Object.entries(colorTotals)) {
    if (amount < minAmount) {
      minAmount = amount;
      minColor = color;
    }
  }

  // 70% chance house-favored color wins, 30% random
  if (Math.random() < 0.7 && bets.length > 0) return minColor;

  const colors = ['black', 'black', 'black', 'yellow', 'yellow', 'red', 'green'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRotationForColor(color: string): number {
  const rotations = COLOR_ROTATIONS[color];
  const base = rotations[Math.floor(Math.random() * rotations.length)];
  return 360 * 5 + base; // 5 full spins + landing
}

// GET /api/casino/wheel — get current wheel state
export async function GET() {
  const { data: game } = await casinoDb
    .from('casino_wheel')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const { data: history } = await casinoDb
    .from('casino_wheel')
    .select('*')
    .neq('winner_color', '')
    .order('id', { ascending: false })
    .limit(50);

  // Get bets for current game
  const colorBank = { black: 0, yellow: 0, red: 0, green: 0 };
  const bets: any[] = [];
  if (game) {
    const { data: gameBets } = await casinoDb
      .from('casino_wheel_bets')
      .select('*, casino_users(username, avatar)')
      .eq('game_id', game.id);
    if (gameBets) {
      for (const b of gameBets) {
        colorBank[b.color as keyof typeof colorBank] += b.price;
        bets.push(b);
      }
    }
  }

  return jsonOk({
    game: { id: game?.id, status: game?.status },
    history: (history || []).map((h: any) => h.winner_color),
    bank: [colorBank.black, colorBank.yellow, colorBank.red, colorBank.green],
    bets,
  });
}

// POST /api/casino/wheel — handle actions
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'bet') {
    const user = await authenticateCasinoUser(request);
    if (!user) return jsonError('Not authenticated', 401);
    return handleBet(user, body);
  }
  if (action === 'spin') return handleSpin();
  if (action === 'result') return handleResult(body);

  return jsonError('Invalid action');
}

async function handleBet(user: any, body: any) {
  const color = body.color;
  const bet = parseFloat(body.bet);

  if (!bet || bet < 1) return jsonError('Minimum bet is 1');
  if (bet > user.balance) return jsonError('Insufficient balance');
  if (!COLOR_MULTIPLIERS[color]) return jsonError('Invalid color');

  const { data: game } = await casinoDb
    .from('casino_wheel')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game || game.status !== 0) return jsonError('Bets closed, wait for next round');

  const newBalance = parseFloat((user.balance - bet).toFixed(2));
  await updateBalance(user.id, newBalance);

  // Check if user already bet this color in this game
  const { data: existing } = await casinoDb
    .from('casino_wheel_bets')
    .select('*')
    .eq('user_id', user.id)
    .eq('game_id', game.id)
    .eq('color', color)
    .single();

  if (existing) {
    await casinoDb.from('casino_wheel_bets').update({
      price: existing.price + bet,
    }).eq('id', existing.id);
  } else {
    await casinoDb.from('casino_wheel_bets').insert({
      user_id: user.id,
      game_id: game.id,
      price: bet,
      color,
      balance: newBalance,
    });
  }

  // Update game bank
  await casinoDb.from('casino_wheel').update({
    price: (game.price || 0) + bet,
  }).eq('id', game.id);

  return jsonOk({ balance: newBalance });
}

async function handleSpin() {
  const { data: game } = await casinoDb
    .from('casino_wheel')
    .select('*')
    .eq('status', 0)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return jsonError('No active game');

  // Get all bets
  const { data: bets } = await casinoDb
    .from('casino_wheel_bets')
    .select('*')
    .eq('game_id', game.id);

  const winnerColor = pickWinnerColor(bets || []);
  const rotation = getRotationForColor(winnerColor);

  // Update game with winner
  await casinoDb.from('casino_wheel').update({
    status: 1,
    winner_color: winnerColor,
  }).eq('id', game.id);

  return jsonOk({ color: winnerColor, rotation, gameId: game.id });
}

async function handleResult(body: any) {
  const gameId = body.gameId;
  if (!gameId) return jsonError('Missing gameId');

  const { data: game } = await casinoDb
    .from('casino_wheel')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game || !game.winner_color) return jsonError('Game not found');

  const multiplier = COLOR_MULTIPLIERS[game.winner_color] || 0;

  // Get winning bets
  const { data: winningBets } = await casinoDb
    .from('casino_wheel_bets')
    .select('*')
    .eq('game_id', gameId)
    .eq('color', game.winner_color);

  // Pay winners
  for (const bet of winningBets || []) {
    const winAmount = parseFloat((bet.price * multiplier).toFixed(2));
    const { data: user } = await casinoDb.from('casino_users').select('balance').eq('id', bet.user_id).single();
    if (user) {
      await updateBalance(bet.user_id, parseFloat((user.balance + winAmount).toFixed(2)));
      await casinoDb.from('casino_wheel_bets').update({ win: 1, win_sum: winAmount }).eq('id', bet.id);
    }
  }

  // Mark game complete
  await casinoDb.from('casino_wheel').update({ status: 2 }).eq('id', gameId);

  // Create new game
  await casinoDb.from('casino_wheel').insert({ status: 0, winner_color: '', price: 0 });

  return jsonOk({ winner_color: game.winner_color, multiplier });
}
