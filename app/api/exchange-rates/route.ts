import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// LIVE EXCHANGE RATES API
// Fetches live FOREX + CRYPTO rates from free APIs, returns rates relative to USD
// Multiple fallback providers for reliability
// ============================================================================

type RatesCache = {
  rates: Record<string, number>;
  fetchedAt: number;
};

let cachedRates: RatesCache | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute — live prices

// ── FOREX PROVIDERS ─────────────────────────────────────────────────────────

// Provider 1: exchangerate-api.com (free, no key needed for USD base)
async function fetchFromExchangeRateApi(signal: AbortSignal): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'BullMoney/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result === 'success' && data.rates) {
      return data.rates;
    }
    return null;
  } catch {
    return null;
  }
}

// Provider 2: frankfurter.app (ECB data, free, no key)
async function fetchFromFrankfurter(signal: AbortSignal): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'BullMoney/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.rates) {
      return { USD: 1, ...data.rates };
    }
    return null;
  } catch {
    return null;
  }
}

// Provider 3: fawazahmed0's currency API (free, GitHub-hosted)
async function fetchFromFawaz(signal: AbortSignal): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
      signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.usd) {
      const rates: Record<string, number> = {};
      for (const [key, val] of Object.entries(data.usd)) {
        if (typeof val === 'number') {
          rates[key.toUpperCase()] = val;
        }
      }
      return rates;
    }
    return null;
  } catch {
    return null;
  }
}

// ── CRYPTO PROVIDERS ────────────────────────────────────────────────────────

// Map our crypto codes to CoinGecko IDs
const CRYPTO_TO_COINGECKO: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  BNB: 'binancecoin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  LTC: 'litecoin',
};

const COINGECKO_IDS = Object.values(CRYPTO_TO_COINGECKO).join(',');

// CoinGecko free API — returns USD price per coin, we invert to get "coins per USD"
async function fetchCryptoFromCoinGecko(signal: AbortSignal): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd`,
      { signal, cache: 'no-store', headers: { 'User-Agent': 'BullMoney/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rates: Record<string, number> = {};
    for (const [code, geckoId] of Object.entries(CRYPTO_TO_COINGECKO)) {
      const usdPrice = data[geckoId]?.usd;
      if (typeof usdPrice === 'number' && usdPrice > 0) {
        rates[code] = 1 / usdPrice; // Invert: coins per 1 USD
      }
    }
    return Object.keys(rates).length > 0 ? rates : null;
  } catch {
    return null;
  }
}

// Fallback: CoinCap free API
async function fetchCryptoFromCoinCap(signal: AbortSignal): Promise<Record<string, number> | null> {
  try {
    // CoinCap uses lowercase IDs
    const CRYPTO_TO_COINCAP: Record<string, string> = {
      BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'xrp',
      BNB: 'binance-coin', ADA: 'cardano', DOGE: 'dogecoin',
      AVAX: 'avalanche', DOT: 'polkadot', MATIC: 'polygon', LINK: 'chainlink', LTC: 'litecoin',
    };
    const ids = Object.values(CRYPTO_TO_COINCAP).join(',');
    const res = await fetch(`https://api.coincap.io/v2/assets?ids=${ids}`, {
      signal, cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return null;

    const rates: Record<string, number> = {};
    const idToCode = Object.fromEntries(
      Object.entries(CRYPTO_TO_COINCAP).map(([code, id]) => [id, code])
    );
    for (const asset of data.data) {
      const code = idToCode[asset.id];
      const price = parseFloat(asset.priceUsd);
      if (code && price > 0) {
        rates[code] = 1 / price;
      }
    }
    return Object.keys(rates).length > 0 ? rates : null;
  } catch {
    return null;
  }
}

// ── COMBINED FETCH ──────────────────────────────────────────────────────────

async function fetchLiveRates(): Promise<Record<string, number>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    // Fetch forex and crypto in parallel
    const [forexRates, cryptoRates] = await Promise.all([
      fetchForexRates(controller.signal),
      fetchCryptoRates(controller.signal),
    ]);

    return { ...forexRates, ...cryptoRates };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchForexRates(signal: AbortSignal): Promise<Record<string, number>> {
  const providers = [fetchFromExchangeRateApi, fetchFromFrankfurter, fetchFromFawaz];
  for (const provider of providers) {
    const rates = await provider(signal);
    if (rates && Object.keys(rates).length > 10) {
      return rates;
    }
  }
  return {};
}

async function fetchCryptoRates(signal: AbortSignal): Promise<Record<string, number>> {
  const providers = [fetchCryptoFromCoinGecko, fetchCryptoFromCoinCap];
  for (const provider of providers) {
    const rates = await provider(signal);
    if (rates && Object.keys(rates).length > 0) {
      return rates;
    }
  }
  return {};
}

export async function GET() {
  try {
    // Return cached rates if still fresh
    if (cachedRates && Date.now() - cachedRates.fetchedAt < CACHE_TTL) {
      return NextResponse.json({
        rates: cachedRates.rates,
        cached: true,
        age: Math.round((Date.now() - cachedRates.fetchedAt) / 1000),
      });
    }

    const rates = await fetchLiveRates();
    
    if (Object.keys(rates).length > 10) {
      cachedRates = { rates, fetchedAt: Date.now() };
      return NextResponse.json({
        rates,
        cached: false,
        age: 0,
      });
    }

    // If fetch failed but we have stale cache, return it
    if (cachedRates) {
      return NextResponse.json({
        rates: cachedRates.rates,
        cached: true,
        stale: true,
        age: Math.round((Date.now() - cachedRates.fetchedAt) / 1000),
      });
    }

    // No data at all
    return NextResponse.json({ rates: {}, error: 'No rates available' }, { status: 503 });
  } catch (err) {
    console.error('[exchange-rates] Error:', err);
    return NextResponse.json({ rates: {}, error: 'Failed to fetch rates' }, { status: 500 });
  }
}
