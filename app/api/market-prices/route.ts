import { NextResponse } from 'next/server';

const COIN_IDS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'ripple', symbol: 'XRP' },
  { id: 'cardano', symbol: 'ADA' },
  { id: 'dogecoin', symbol: 'DOGE' },
  { id: 'chainlink', symbol: 'LINK' },
  { id: 'polkadot', symbol: 'DOT' },
  { id: 'avalanche-2', symbol: 'AVAX' },
  { id: 'matic-network', symbol: 'MATIC' },
];

const FALLBACK_CRYPTO: Record<string, { price: number; change: number }> = {
  BTC: { price: 97000, change: 2.5 },
  ETH: { price: 3300, change: 3.2 },
  SOL: { price: 190, change: 5.1 },
  XRP: { price: 0.62, change: 1.8 },
  ADA: { price: 0.45, change: -0.5 },
  DOGE: { price: 0.08, change: 1.2 },
  LINK: { price: 15, change: 2.1 },
  DOT: { price: 7.5, change: 0.9 },
  AVAX: { price: 38, change: 3.5 },
  MATIC: { price: 0.85, change: 1.5 },
};

const FALLBACK_METALS: Record<string, { price: number; change: number }> = {
  XAU: { price: 2650, change: 0.5 },
  XAG: { price: 31, change: 0.8 },
  XPT: { price: 980, change: -0.3 },
  XPD: { price: 1050, change: 0.2 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showCrypto = searchParams.get('crypto') !== 'false';
  const showMetals = searchParams.get('metals') !== 'false';

  const results: any = {};

  // Fetch crypto prices
  if (showCrypto) {
    try {
      const coinIds = COIN_IDS.map(c => c.id).join(',');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const cryptoRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      clearTimeout(timeoutId);

      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        results.crypto = cryptoData;
      } else {
        console.warn('CoinGecko API returned non-OK status:', cryptoRes.status);
        results.crypto = 'fallback';
      }
    } catch (error) {
      console.warn('CoinGecko API fetch failed:', error);
      results.crypto = 'fallback';
    }
  }

  // Fetch metal prices
  if (showMetals) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const metalsRes = await fetch('https://api.metals.live/v1/spot', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);

      if (metalsRes.ok) {
        const metalsData = await metalsRes.json();
        results.metals = metalsData;
      } else {
        results.metals = 'fallback';
      }
    } catch (error) {
      console.warn('Metals API fetch failed:', error);
      results.metals = 'fallback';
    }
  }

  // Return fallback data if needed
  if (results.crypto === 'fallback') {
    const fallbackCrypto: any = {};
    COIN_IDS.forEach(coin => {
      const data = FALLBACK_CRYPTO[coin.symbol];
      fallbackCrypto[coin.id] = {
        usd: data.price,
        usd_24h_change: data.change,
      };
    });
    results.crypto = fallbackCrypto;
  }

  if (results.metals === 'fallback') {
    results.metals = [
      {
        gold: FALLBACK_METALS.XAU.price,
        silver: FALLBACK_METALS.XAG.price,
        platinum: FALLBACK_METALS.XPT.price,
        palladium: FALLBACK_METALS.XPD.price,
      }
    ];
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
