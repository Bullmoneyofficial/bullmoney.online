import { NextResponse } from 'next/server';

type SlotGame = {
  id: string;
  name: string;
  provider: string;
  rtp: number;
  volatility: 'Low' | 'Medium' | 'High';
  minBet: number;
  maxBet: number;
  thumbnail: string;
  demoUrl: string;
  tags: string[];
};

const FREE_SLOTS: SlotGame[] = [
  {
    id: 'bull-fruit-mania',
    name: 'Bull Fruit Mania',
    provider: 'Bull Studio',
    rtp: 96.2,
    volatility: 'Low',
    minBet: 0.1,
    maxBet: 100,
    thumbnail: '/v2/slots/bull-fruit-mania.svg',
    demoUrl: '/games/slots?play=bull-fruit-mania',
    tags: ['classic', 'fruit', '3-reel'],
  },
  {
    id: 'crypto-pharaoh',
    name: 'Crypto Pharaoh',
    provider: 'Bull Studio',
    rtp: 96.5,
    volatility: 'Medium',
    minBet: 0.2,
    maxBet: 150,
    thumbnail: '/v2/slots/crypto-pharaoh.svg',
    demoUrl: '/games/slots?play=crypto-pharaoh',
    tags: ['egypt', 'wilds', 'free-spins'],
  },
  {
    id: 'moon-spin-x',
    name: 'Moon Spin X',
    provider: 'Bull Studio',
    rtp: 97.0,
    volatility: 'High',
    minBet: 0.2,
    maxBet: 200,
    thumbnail: '/v2/slots/moon-spin-x.svg',
    demoUrl: '/games/slots?play=moon-spin-x',
    tags: ['space', 'multiplier', 'bonus-buy'],
  },
  {
    id: 'diamond-rush-ways',
    name: 'Diamond Rush Ways',
    provider: 'Bull Studio',
    rtp: 96.8,
    volatility: 'Medium',
    minBet: 0.1,
    maxBet: 120,
    thumbnail: '/v2/slots/diamond-rush-ways.svg',
    demoUrl: '/games/slots?play=diamond-rush-ways',
    tags: ['ways', 'cascading', 'gems'],
  },
  {
    id: 'lucky-7s-deluxe',
    name: 'Lucky 7s Deluxe',
    provider: 'Bull Studio',
    rtp: 95.9,
    volatility: 'Low',
    minBet: 0.1,
    maxBet: 80,
    thumbnail: '/v2/slots/lucky-7s-deluxe.svg',
    demoUrl: '/games/slots?play=lucky-7s-deluxe',
    tags: ['classic', '7s', 'jackpot'],
  },
  {
    id: 'neon-wild-grid',
    name: 'Neon Wild Grid',
    provider: 'Bull Studio',
    rtp: 96.6,
    volatility: 'High',
    minBet: 0.25,
    maxBet: 250,
    thumbnail: '/v2/slots/neon-wild-grid.svg',
    demoUrl: '/games/slots?play=neon-wild-grid',
    tags: ['neon', 'cluster', 'wilds'],
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'free-demo-slots',
    total: FREE_SLOTS.length,
    games: FREE_SLOTS,
  });
}
