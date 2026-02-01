import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const REQUEST_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'BullMoneyHub/1.0 (+https://newbullmoney.com)'
};

type Provider = {
  name: string;
  fetch: () => Promise<number | null>;
  timeoutMs?: number;
};

const withTimeout = async <T>(fn: () => Promise<T>, timeoutMs: number = 4000) => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  );
  return Promise.race([fn(), timeout]);
};

const isValidBtc = (price: number | null) => typeof price === 'number' && price > 10000 && price < 500000;
const isValidGold = (price: number | null) => typeof price === 'number' && price > 1200 && price < 10000;

const toNumber = (value: any) => {
  const num = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(num) ? num : null;
};

const parseMetalsLive = (data: any) => {
  if (!data) return null;
  // metals.live returns an array; each element can be [timestamp, price] or an object
  const first = Array.isArray(data) ? data[0] : data;
  if (Array.isArray(first) && first.length > 1) return toNumber(first[1]);
  if (typeof first === 'number' || typeof first === 'string') return toNumber(first);
  if (first && typeof first === 'object') {
    return toNumber(first.ask ?? first.bid ?? first.price ?? first.gold);
  }
  return null;
};

const btcProviders: Provider[] = [
  {
    name: 'binance',
    fetch: async () => {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('Binance fetch failed');
      const data = await res.json();
      return Number(data.price) || null;
    }
  },
  {
    name: 'coinbase',
    fetch: async () => {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('Coinbase fetch failed');
      const data = await res.json();
      return Number(data?.data?.amount) || null;
    }
  },
  {
    name: 'coincap',
    fetch: async () => {
      const res = await fetch('https://api.coincap.io/v2/assets/bitcoin', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('CoinCap fetch failed');
      const data = await res.json();
      return Number(data?.data?.priceUsd) || null;
    }
  }
];

const goldProviders: Provider[] = [
  {
    name: 'metals.live',
    fetch: async () => {
      const res = await fetch('https://api.metals.live/v1/spot/gold', {
        cache: 'no-store',
        headers: {
          ...REQUEST_HEADERS,
          Referer: 'https://newbullmoney.com'
        },
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('Metals.live fetch failed');
      const data = await res.json();
      return parseMetalsLive(data);
    }
  },
  {
    name: 'goldprice.org',
    fetch: async () => {
      const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('GoldPrice.org fetch failed');
      const data = await res.json();
      const goldPrice = data.items?.[0]?.xauPrice || data.xauPrice;
      return toNumber(goldPrice);
    }
  },
  {
    name: 'exchangerate.host',
    fetch: async () => {
      const res = await fetch('https://api.exchangerate.host/latest?base=XAU&symbols=USD', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('ExchangeRate.host fetch failed');
      const data = await res.json();
      const usd = data?.rates?.USD;
      return usd ? Number(usd) : null;
    }
  },
  {
    name: 'coingecko_paxg',
    fetch: async () => {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('CoinGecko fetch failed');
      const data = await res.json();
      const price = data?.['pax-gold']?.usd;
      return toNumber(price);
    }
  },
  {
    name: 'financialmodelingprep',
    fetch: async () => {
      const res = await fetch('https://financialmodelingprep.com/api/v3/quote/XAUUSD?apikey=demo', {
        cache: 'no-store',
        headers: REQUEST_HEADERS,
        next: { revalidate: 0 }
      });
      if (!res.ok) throw new Error('FMP fetch failed');
      const data = await res.json();
      const price = data?.[0]?.price ?? data?.[0]?.priceUsd;
      return toNumber(price);
    }
  }
];

async function resolvePrice(providers: Provider[], validator: (price: number | null) => boolean) {
  for (const provider of providers) {
    try {
      const price = await withTimeout(provider.fetch, provider.timeoutMs ?? 3500);
      if (validator(price)) return { price: price as number, source: provider.name };
    } catch (error) {
      console.warn(`[prices] ${provider.name} failed`, error);
    }
  }
  return { price: null, source: 'fallback' as const };
}

export async function GET() {
  try {
    const [btc, gold] = await Promise.all([
      resolvePrice(btcProviders, isValidBtc),
      resolvePrice(goldProviders, isValidGold)
    ]);

    const timestamp = Date.now();

    const response = {
      xauusd: gold.price ? gold.price.toFixed(2) : '--',
      btcusd: btc.price ? Math.round(btc.price).toString() : '--',
      timestamp: new Date(timestamp).toISOString(),
      updateFrequency: '3s',
      sources: {
        btc: btc.source,
        gold: gold.source
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=2',
        'Content-Type': 'application/json',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Price fetch error:', error);
    return NextResponse.json({
      xauusd: '--',
      btcusd: '--',
      timestamp: new Date().toISOString(),
      updateFrequency: '3s',
      sources: {
        btc: 'error-fallback',
        gold: 'error-fallback'
      },
      error: true
    }, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=2',
        'Content-Type': 'application/json'
      }
    });
  }
}
