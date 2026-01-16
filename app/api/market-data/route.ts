import { NextResponse } from 'next/server';

const COIN_ORDER = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'ripple', symbol: 'XRP' },
  { id: 'cardano', symbol: 'ADA' },
  { id: 'dogecoin', symbol: 'DOGE' },
  { id: 'chainlink', symbol: 'LINK' },
  { id: 'polkadot', symbol: 'DOT' },
  { id: 'polygon', symbol: 'MATIC' },
  { id: 'avalanche-2', symbol: 'AVAX' },
];

export async function GET() {
  try {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      ids: COIN_ORDER.map(c => c.id).join(','),
      order: 'market_cap_desc',
      per_page: COIN_ORDER.length.toString(),
      page: '1',
      sparkline: 'false',
      price_change_percentage: '24h',
    });

    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params}`);

    if (!response.ok) {
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch from CoinGecko' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
