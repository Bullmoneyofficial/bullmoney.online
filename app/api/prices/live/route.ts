import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const REQUEST_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'BullMoneyHub/1.0 (+https://newbullmoney.com)',
  'Accept-Encoding': 'gzip, deflate'
};

type Provider = {
  name: string;
  fetch: (signal: AbortSignal) => Promise<number | null>;
  timeoutMs?: number;
};

// Create fetch options with proper Node.js configuration
const createFetchOptions = (extraHeaders: Record<string, string> = {}) => ({
  cache: 'no-store' as const,
  headers: {
    ...REQUEST_HEADERS,
    ...extraHeaders
  },
  next: { revalidate: 0 }
});

type PriceResult = { price: number | null; source: string };

type PricesCache = {
  btc: number | null;
  gold: number | null;
  sources: { btc: string; gold: string };
  fetchedAt: number;
};

let lastGoodPrices: PricesCache | null = null;
let pricesInFlight: Promise<PricesCache> | null = null;
const PRICE_CACHE_TTL = 2500; // 2.5s, matches 3s UI polling without hammering providers

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
    fetch: async (signal) => {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('Binance fetch failed');
      const data = await res.json();
      return Number(data.price) || null;
    }
  },
  {
    name: 'coinbase',
    fetch: async (signal) => {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('Coinbase fetch failed');
      const data = await res.json();
      return Number(data?.data?.amount) || null;
    }
  },
  {
    name: 'coincap',
    fetch: async (signal) => {
      const res = await fetch('https://api.coincap.io/v2/assets/bitcoin', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('CoinCap fetch failed');
      const data = await res.json();
      return Number(data?.data?.priceUsd) || null;
    }
  }
];

const goldProviders: Provider[] = [
  {
    name: 'goldprice.org',
    fetch: async (signal) => {
      const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('GoldPrice.org fetch failed');
      const data = await res.json();
      const goldPrice = data.items?.[0]?.xauPrice || data.xauPrice;
      return toNumber(goldPrice);
    }
  },
  {
    name: 'coingecko_paxg',
    fetch: async (signal) => {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('CoinGecko fetch failed');
      const data = await res.json();
      const price = data?.['pax-gold']?.usd;
      return toNumber(price);
    }
  },
  {
    name: 'exchangerate.host',
    fetch: async (signal) => {
      const res = await fetch('https://api.exchangerate.host/latest?base=XAU&symbols=USD', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('ExchangeRate.host fetch failed');
      const data = await res.json();
      const usd = data?.rates?.USD;
      return usd ? Number(usd) : null;
    }
  },
  {
    name: 'financialmodelingprep',
    fetch: async (signal) => {
      const res = await fetch('https://financialmodelingprep.com/api/v3/quote/XAUUSD?apikey=demo', {
        ...createFetchOptions(),
        signal
      });
      if (!res.ok) throw new Error('FMP fetch failed');
      const data = await res.json();
      const price = data?.[0]?.price ?? data?.[0]?.priceUsd;
      return toNumber(price);
    }
  }
];

async function resolvePrice(providers: Provider[], validator: (price: number | null) => boolean): Promise<PriceResult> {
  const controllers: AbortController[] = [];
  const timeouts: NodeJS.Timeout[] = [];

  const attempts = providers.map((provider) => {
    return new Promise<PriceResult>((resolve, reject) => {
      const controller = new AbortController();
      controllers.push(controller);
      const timeoutMs = provider.timeoutMs ?? 2800;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      timeouts.push(timeout);

      provider.fetch(controller.signal)
        .then((price) => {
          if (validator(price)) {
            resolve({ price: price as number, source: provider.name });
          } else {
            reject(new Error('Invalid price'));
          }
        })
        .catch((error) => {
          const message = error?.message ?? '';
          const name = error?.name ?? '';
          const cause = error?.cause as { code?: string } | undefined;
          const isAbort = name === 'AbortError' || message === 'Invalid price';
          const isDns = cause?.code === 'ENOTFOUND';
          if (!isAbort && !isDns && process.env.PRICES_DEBUG === 'true') {
            console.warn(`[prices] ${provider.name} failed`, error);
          }
          reject(error);
        });
    });
  });

  try {
    return await Promise.any(attempts);
  } catch {
    return { price: null, source: 'fallback' };
  } finally {
    controllers.forEach((controller) => controller.abort());
    timeouts.forEach((timeout) => clearTimeout(timeout));
  }
}

async function fetchPricesFresh(): Promise<PricesCache> {
  const [btc, gold] = await Promise.all([
    resolvePrice(btcProviders, isValidBtc),
    resolvePrice(goldProviders, isValidGold)
  ]);

  const now = Date.now();
  const next: PricesCache = {
    btc: lastGoodPrices?.btc ?? null,
    gold: lastGoodPrices?.gold ?? null,
    sources: {
      btc: lastGoodPrices?.sources.btc ?? 'fallback',
      gold: lastGoodPrices?.sources.gold ?? 'fallback'
    },
    fetchedAt: now
  };

  if (btc.price) {
    next.btc = btc.price;
    next.sources.btc = btc.source;
  }
  if (gold.price) {
    next.gold = gold.price;
    next.sources.gold = gold.source;
  }

  lastGoodPrices = next;
  return next;
}

export async function GET() {
  try {
    const now = Date.now();
    if (lastGoodPrices && now - lastGoodPrices.fetchedAt < PRICE_CACHE_TTL) {
      return NextResponse.json({
        xauusd: lastGoodPrices.gold ? lastGoodPrices.gold.toFixed(2) : '--',
        btcusd: lastGoodPrices.btc ? Math.round(lastGoodPrices.btc).toString() : '--',
        timestamp: new Date(lastGoodPrices.fetchedAt).toISOString(),
        updateFrequency: '3s',
        sources: lastGoodPrices.sources,
        cached: true
      }, {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=2',
          'Content-Type': 'application/json',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store'
        }
      });
    }

    if (!pricesInFlight) {
      pricesInFlight = fetchPricesFresh().finally(() => {
        pricesInFlight = null;
      });
    }

    const latest = await pricesInFlight;

    const response = {
      xauusd: latest.gold ? latest.gold.toFixed(2) : '--',
      btcusd: latest.btc ? Math.round(latest.btc).toString() : '--',
      timestamp: new Date(latest.fetchedAt).toISOString(),
      updateFrequency: '3s',
      sources: latest.sources
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
    if (lastGoodPrices) {
      return NextResponse.json({
        xauusd: lastGoodPrices.gold ? lastGoodPrices.gold.toFixed(2) : '--',
        btcusd: lastGoodPrices.btc ? Math.round(lastGoodPrices.btc).toString() : '--',
        timestamp: new Date(lastGoodPrices.fetchedAt).toISOString(),
        updateFrequency: '3s',
        sources: lastGoodPrices.sources,
        cached: true,
        error: true
      }, {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=1, stale-while-revalidate=2',
          'Content-Type': 'application/json'
        }
      });
    }
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
