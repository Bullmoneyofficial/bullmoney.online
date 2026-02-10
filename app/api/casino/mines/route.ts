import { NextRequest } from 'next/server';
import { casinoDb, authenticateCasinoUser, updateBalance, addProfit, jsonOk, jsonError } from '@/lib/casino-db';

// Coefficient table (bombs-1 indexed, step indexed)
const COEFS: number[][] = [
  [],
  [1.09,1.19,1.3,1.43,1.58,1.75,1.96,2.21,2.5,2.86,3.3,3.85,4.55,5.45,6.67,8.33,10.71,14.29,20,30,50,100,300],
  [1.14,1.3,1.49,1.73,2.02,2.37,2.82,3.38,4.11,5.05,6.32,8.04,10.45,13.94,19.17,27.38,41.07,65.71,115,230,575,2300],
  [1.19,1.43,1.73,2.11,2.61,3.26,4.13,5.32,6.95,9.27,12.64,17.69,25.56,38.33,60.24,100.4,180.71,361.43,843.33,2530,12650],
  [1.25,1.58,2.02,2.61,3.43,4.57,6.2,8.59,12.16,17.69,26.54,41.28,67.08,115,210.83,421.67,948.75,2530,8855,53130],
  [1.32,1.75,2.37,3.26,4.57,6.53,9.54,14.31,22.12,35.38,58.97,103.21,191.67,383.33,843.33,2108.33],
  [1.39,1.96,2.82,4.13,6.2,9.54,15.1,24.72,42.02,74.7,140.06,280.13,606.94,1456.67,4005.83,13352.78],
  [1.47,2.21,3.38,5.32,8.59,14.31,24.72,44.49,84.04,168.08,360.16,840.38,2185,6555,24035,120175,1081575],
  [1.56,2.5,4.11,6.95,12.16,22.12,42.02,84.04,178.58,408.19,1020.47,2857.31,9286.25,37145,204297.5,2042975],
  [1.67,2.86,5.05,9.27,17.69,35.38,74.7,168.08,408.19,1088.5,3265.49,11429.23,49526.67,297160,3268760],
  [1.79,3.3,6.32,12.64,26.54,58.97,140.06,360.16,1020.47,3265.49,12245.6,57146.15,371450,4457400],
  [1.92,3.85,8.04,17.69,41.28,103.21,280.13,840.38,2857.31,11429.23,57146.15,400023.08,5200300],
  [2.08,4.55,10.45,25.56,67.08,191.67,606.94,2185,9286.25,49526.67,371450,5200300],
  [2.27,5.45,13.94,38.33,115,383.33,1456.67,6555,37145,297160,4457400],
  [2.5,6.67,19.17,60.24,210.83,843.33,4005.83,24035,204297.5,3268760],
  [2.78,8.33,27.38,100.4,421.67,2108.33,13352.78,120175,2042975],
  [3.13,10.71,41.07,180.71,948.75,6325,60087.5,1081575],
  [3.57,14.29,65.71,361.43,2530,25300,480700],
  [4.17,20,115,843.33,8855,177100],
  [5,30,230,2530,53130],
  [6.25,50,575,12650],
  [8.33,100,2300],
  [12.5,300],
  [25],
];

function generateBombs(count: number): number[] {
  const bombs: number[] = [];
  while (bombs.length < count) {
    const n = Math.floor(Math.random() * 25) + 1;
    if (!bombs.includes(n)) bombs.push(n);
  }
  return bombs;
}

// POST /api/casino/mines/create
export async function POST(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  if (!user) return jsonError('Not authenticated', 401);

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'create';
  const body = await request.json().catch(() => ({}));

  if (action === 'create') return handleCreate(user, body);
  if (action === 'open') return handleOpen(user, body);
  if (action === 'take') return handleTake(user);
  if (action === 'get') return handleGet(user);
  
  return jsonError('Invalid action');
}

async function handleCreate(user: any, body: any) {
  const bomb = parseInt(body.bomb) || 3;
  const bet = parseFloat(body.bet);

  if (!bet || bet < 1) return jsonError('Minimum bet is 1');
  if (bet > user.balance) return jsonError('Insufficient balance');
  if (bomb < 2 || bomb > 24) return jsonError('Bombs must be 2-24');

  // Check for existing active game
  const { data: existing } = await casinoDb
    .from('casino_mines')
    .select('*')
    .eq('user_id', user.id)
    .eq('on_off', 1)
    .single();
  if (existing) return jsonError('Finish current game first');

  const bombs = generateBombs(bomb);
  const canOpen = Array.from({ length: 25 }, (_, i) => i + 1).filter(n => !bombs.includes(n));
  const newBalance = parseFloat((user.balance - bet).toFixed(2));

  await updateBalance(user.id, newBalance);

  await casinoDb.from('casino_mines').insert({
    user_id: user.id,
    bombs: bomb,
    bet,
    mines: JSON.stringify(bombs),
    click: JSON.stringify([]),
    on_off: 1,
    result: 0,
    step: 0,
    win: 0,
    can_open: JSON.stringify(canOpen),
  });

  return jsonOk({ msg: 'Game started!', balance: newBalance });
}

async function handleOpen(user: any, body: any) {
  const openCell = parseInt(body.open);

  const { data: game } = await casinoDb
    .from('casino_mines')
    .select('*')
    .eq('user_id', user.id)
    .eq('on_off', 1)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return jsonError('No active game', 400);

  const mines: number[] = JSON.parse(game.mines);
  const clicks: number[] = JSON.parse(game.click);
  const canOpen: number[] = JSON.parse(game.can_open);

  if (clicks.includes(openCell)) return Response.json({ error: true, noend: 1, msg: 'Already opened' });

  // Hit a bomb
  if (mines.includes(openCell)) {
    await casinoDb.from('casino_mines').update({ on_off: 0, click: JSON.stringify([...clicks, openCell]) }).eq('id', game.id);
    await addProfit('mines', game.bet);
    return Response.json({ error: true, msg: 'BOOM! You lost', bombs: mines });
  }

  // Safe cell
  const newClicks = [...clicks, openCell];
  const step = newClicks.length;
  const coefArr = COEFS[game.bombs - 1] || [];
  const coef = coefArr[step - 1] || 1;
  const winAmount = parseFloat((game.bet * coef).toFixed(2));

  await casinoDb.from('casino_mines').update({
    click: JSON.stringify(newClicks),
    step,
    result: winAmount,
  }).eq('id', game.id);

  // Auto-win if all safe cells opened
  if (step >= canOpen.length) {
    const newBalance = parseFloat((user.balance + winAmount).toFixed(2));
    await updateBalance(user.id, newBalance);
    await casinoDb.from('casino_mines').update({ on_off: 0, win: winAmount }).eq('id', game.id);
    return jsonOk({ step, coef: winAmount, msg: 'You won!', balance: newBalance, bombs: mines, autoWin: true });
  }

  return jsonOk({ step, coef: winAmount });
}

async function handleTake(user: any) {
  const { data: game } = await casinoDb
    .from('casino_mines')
    .select('*')
    .eq('user_id', user.id)
    .eq('on_off', 1)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return jsonError('No active game');

  const clicks: number[] = JSON.parse(game.click);
  if (clicks.length === 0) return jsonError('Open at least one cell first');

  const mines: number[] = JSON.parse(game.mines);
  const coefArr = COEFS[game.bombs - 1] || [];
  const coef = coefArr[clicks.length - 1] || 1;
  const winAmount = parseFloat((game.bet * coef).toFixed(2));
  const newBalance = parseFloat((user.balance + winAmount).toFixed(2));

  await updateBalance(user.id, newBalance);
  await casinoDb.from('casino_mines').update({ on_off: 0, win: winAmount }).eq('id', game.id);
  await addProfit('mines', -(winAmount - game.bet));

  return jsonOk({ msg: `Cashed out ${winAmount}!`, balance: newBalance, bombs: mines });
}

async function handleGet(user: any) {
  const { data: game } = await casinoDb
    .from('casino_mines')
    .select('*')
    .eq('user_id', user.id)
    .eq('on_off', 1)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!game) return Response.json({ error: true, msg: 'No active game' });

  const clicks: number[] = JSON.parse(game.click);
  const coefArr = COEFS[game.bombs - 1] || [];
  const coef = clicks.length > 0 ? (game.bet * (coefArr[clicks.length - 1] || 1)).toFixed(2) : '0.00';

  return jsonOk({ status: 1, click: clicks, coef, bombs: game.bombs });
}
