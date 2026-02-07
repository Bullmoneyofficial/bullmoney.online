import { NextResponse } from 'next/server';
import { ALL_INSTRUMENTS, Instrument, INSTRUMENT_MAP } from '@/lib/quotes/instruments';

// ─── In-memory cache ─────────────────────────────────────────
interface CachedData {
  rates: Record<string, number>; // USD-based rates  { EUR: 0.92, GBP: 0.79, ... }
  metals: Record<string, number>; // { XAU: 2650, XAG: 31.5, XPT: 980, XPD: 1050 }
  indices: Record<string, number>; // { US100: 21500, US30: 42000, ... }
  dailyOpens: Record<string, number>; // Cached opens per symbol
  dailyHighs: Record<string, number>;
  dailyLows: Record<string, number>;
  ts: number;
}

let cache: CachedData | null = null;
const CACHE_TTL = 30_000; // 30 seconds

// ─── Fetch forex rates from Frankfurter API (ECB, free) ─────
async function fetchForexRates(): Promise<Record<string, number>> {
  try {
    // Collect all unique currencies needed
    const currencies = new Set<string>();
    ALL_INSTRUMENTS
      .filter((i) => i.type === 'forex')
      .forEach((i) => {
        if (i.forexBase && i.forexBase !== 'USD') currencies.add(i.forexBase);
        if (i.forexQuote && i.forexQuote !== 'USD') currencies.add(i.forexQuote);
      });

    const currencyList = Array.from(currencies).join(',');
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${currencyList}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error('Frankfurter API error');
    const data = await res.json();
    // data.rates = { EUR: 0.92, GBP: 0.79, JPY: 149.5, ... } (all relative to 1 USD)
    return data.rates as Record<string, number>;
  } catch (e) {
    console.error('[live-quotes] Forex fetch error:', e);
    return {};
  }
}

// ─── Fetch metal prices ─────────────────────────────────────
async function fetchMetalPrices(): Promise<Record<string, number>> {
  // Try primary: goldprice.org endpoint
  try {
    const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });
    if (res.ok) {
      const data = await res.json();
      // data.items[0] has xauPrice, xagPrice, etc.
      if (data?.items?.[0]) {
        const item = data.items[0];
        return {
          XAU: item.xauPrice ?? 0,
          XAG: item.xagPrice ?? 0,
          XPT: item.xptPrice ?? 0,
          XPD: item.xpdPrice ?? 0,
        };
      }
    }
  } catch {}

  // Fallback: try Binance PAXG (gold proxy) and derive others
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT'
    );
    if (res.ok) {
      const data = await res.json();
      const goldPrice = parseFloat(data.lastPrice);
      // Use typical ratios for other metals
      return {
        XAU: goldPrice,
        XAG: goldPrice / 82, // Gold/Silver ratio ~82
        XPT: goldPrice * 0.37, // Platinum ~37% of gold
        XPD: goldPrice * 0.38, // Palladium ~38% of gold
      };
    }
  } catch {}

  return {};
}

// ─── Fetch index prices (Yahoo Finance) ───────────────────
async function fetchIndexPrices(): Promise<Record<string, number>> {
  const indexInstruments = ALL_INSTRUMENTS.filter((i) => i.type === 'index' && i.indexId);
  if (indexInstruments.length === 0) return {};

  const results: Record<string, number> = {};

  // Fetch from Yahoo Finance chart API for each index
  const fetches = indexInstruments.map(async (inst) => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${inst.indexId}?interval=1d&range=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
          },
          next: { revalidate: 30 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          results[inst.symbol] = meta.regularMarketPrice;
        }
      }
    } catch {}
  });

  await Promise.all(fetches);

  // Fallback: use typical values for common indices if fetch failed
  const fallbacks: Record<string, number> = {
    US100: 21500,
    US30: 42800,
    US500: 5950,
    DE40: 19200,
    UK100: 8100,
    JP225: 38500,
  };

  for (const inst of indexInstruments) {
    if (!results[inst.symbol] && fallbacks[inst.symbol]) {
      results[inst.symbol] = fallbacks[inst.symbol];
    }
  }

  return results;
}

// ─── Calculate forex cross rate ──────────────────────────────
function crossRate(
  base: string,
  quote: string,
  usdRates: Record<string, number>
): number | null {
  // usdRates has: 1 USD = X units of each currency
  // We want: 1 BASE = ? QUOTE

  if (base === 'USD') {
    // USDJPY = usdRates['JPY']
    return usdRates[quote] ?? null;
  }
  if (quote === 'USD') {
    // EURUSD = 1 / usdRates['EUR']
    const r = usdRates[base];
    return r ? 1 / r : null;
  }
  // Cross: EURGBP = (1/usdRates['EUR']) / (1/usdRates['GBP']) = usdRates['GBP'] / usdRates['EUR']
  const rBase = usdRates[base];
  const rQuote = usdRates[quote];
  if (rBase && rQuote) return rQuote / rBase;
  return null;
}

// ─── Apply realistic spread ─────────────────────────────────
function applySpread(
  mid: number,
  instrument: Instrument
): { bid: number; ask: number } {
  const halfSpread =
    (instrument.defaultSpreadPips / 2) / Math.pow(10, instrument.digits);
  return {
    bid: mid - halfSpread,
    ask: mid + halfSpread,
  };
}

// ─── Add micro-variation for realism ─────────────────────────
function microVary(price: number, digits: number): number {
  const pip = 1 / Math.pow(10, digits);
  const jitter = (Math.random() - 0.5) * 2 * pip; // ±1 pip
  return price + jitter;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/live-quotes?symbols=EURUSD,GBPUSD,XAUUSD,...
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || '';
  const requestedSymbols = symbolsParam.split(',').filter(Boolean);

  // ── Refresh cache if stale ──────────────────────────────
  const now = Date.now();
  if (!cache || now - cache.ts > CACHE_TTL) {
    const [rates, metals, indices] = await Promise.all([
      fetchForexRates(),
      fetchMetalPrices(),
      fetchIndexPrices(),
    ]);

    // Preserve daily opens/highs/lows or initialize
    const dailyOpens = cache?.dailyOpens ?? {};
    const dailyHighs = cache?.dailyHighs ?? {};
    const dailyLows = cache?.dailyLows ?? {};

    cache = { rates, metals, indices, dailyOpens, dailyHighs, dailyLows, ts: now };
  }

  // ── Build response ──────────────────────────────────────
  const result: Record<
    string,
    {
      bid: number;
      ask: number;
      open: number;
      high: number;
      low: number;
      volume: number;
      change: number;
      changePercent: number;
    }
  > = {};

  for (const sym of requestedSymbols) {
    const instrument = INSTRUMENT_MAP.get(sym);
    if (!instrument) continue;

    let mid: number | null = null;

    if (instrument.type === 'forex') {
      mid = crossRate(
        instrument.forexBase!,
        instrument.forexQuote!,
        cache.rates
      );
    } else if (instrument.type === 'metal' && instrument.metalId) {
      mid = cache.metals[instrument.metalId] ?? null;
    } else if (instrument.type === 'index') {
      mid = cache.indices[sym] ?? null;
    }

    if (mid === null || mid <= 0) continue;

    // Add micro-variation for realistic ticking
    mid = microVary(mid, instrument.digits);

    const { bid, ask } = applySpread(mid, instrument);

    // Track daily open / high / low
    if (!cache.dailyOpens[sym]) {
      cache.dailyOpens[sym] = mid;
    }
    if (!cache.dailyHighs[sym] || mid > cache.dailyHighs[sym]) {
      cache.dailyHighs[sym] = mid;
    }
    if (!cache.dailyLows[sym] || mid < cache.dailyLows[sym]) {
      cache.dailyLows[sym] = mid;
    }

    const open = cache.dailyOpens[sym];
    const change = mid - open;
    const changePercent = open !== 0 ? (change / open) * 100 : 0;

    // Simulate realistic volume
    const baseVolume =
      instrument.type === 'metal' ? 5000 + Math.random() * 3000
        : instrument.type === 'index' ? 50000 + Math.random() * 30000
        : 10000 + Math.random() * 20000;

    result[sym] = {
      bid: parseFloat(bid.toFixed(instrument.digits)),
      ask: parseFloat(ask.toFixed(instrument.digits)),
      open: parseFloat(open.toFixed(instrument.digits)),
      high: parseFloat(cache.dailyHighs[sym].toFixed(instrument.digits)),
      low: parseFloat(cache.dailyLows[sym].toFixed(instrument.digits)),
      volume: Math.round(baseVolume),
      change: parseFloat(change.toFixed(instrument.digits)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
