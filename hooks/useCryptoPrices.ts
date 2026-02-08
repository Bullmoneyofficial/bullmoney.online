'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// USE CRYPTO PRICES - Live crypto price fetching via CoinGecko free API
// Returns prices in USD, auto-refreshes every 30 seconds
// ============================================================================

interface CryptoPrices {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface UseCryptoPricesReturn {
  prices: CryptoPrices;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  refresh: () => Promise<void>;
  getPrice: (coin: string) => number | null;
  convertUsdToCrypto: (usdAmount: number, coin: string) => number | null;
}

// Map our coin codes to CoinGecko IDs
const COIN_TO_GECKO: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  LTC: 'litecoin',
};

const GECKO_TO_COIN: Record<string, string> = Object.fromEntries(
  Object.entries(COIN_TO_GECKO).map(([k, v]) => [v, k])
);

const GECKO_IDS = Object.values(COIN_TO_GECKO).join(',');

// Cache prices globally so multiple components share data
let cachedPrices: CryptoPrices = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 20_000; // 20 seconds

async function fetchPrices(): Promise<CryptoPrices> {
  // Return cache if fresh
  if (Date.now() - cacheTimestamp < CACHE_DURATION && Object.keys(cachedPrices).length > 0) {
    return cachedPrices;
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${GECKO_IDS}&vs_currencies=usd&include_24hr_change=true`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) {
      // Try fallback to our own exchange-rates API
      const fallbackRes = await fetch('/api/exchange-rates');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const prices: CryptoPrices = {};
        if (data.rates) {
          for (const [coin, geckoId] of Object.entries(COIN_TO_GECKO)) {
            if (data.rates[coin]) {
              // Our API stores rates as USD-to-crypto, so invert for price
              prices[geckoId] = { usd: 1 / data.rates[coin] };
            }
          }
        }
        cachedPrices = prices;
        cacheTimestamp = Date.now();
        return prices;
      }
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();
    cachedPrices = data;
    cacheTimestamp = Date.now();
    return data;
  } catch (err) {
    // Return stale cache if available
    if (Object.keys(cachedPrices).length > 0) {
      return cachedPrices;
    }
    throw err;
  }
}

export function useCryptoPrices(autoRefreshMs = 30_000): UseCryptoPricesReturn {
  const [prices, setPrices] = useState<CryptoPrices>(cachedPrices);
  const [loading, setLoading] = useState(Object.keys(cachedPrices).length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(cacheTimestamp);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPrices();
      setPrices(data);
      setLastUpdated(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    
    if (autoRefreshMs > 0) {
      const interval = setInterval(refresh, autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefreshMs]);

  const getPrice = useCallback(
    (coin: string): number | null => {
      const geckoId = COIN_TO_GECKO[coin.toUpperCase()];
      if (!geckoId) return null;
      return prices[geckoId]?.usd ?? null;
    },
    [prices]
  );

  const convertUsdToCrypto = useCallback(
    (usdAmount: number, coin: string): number | null => {
      const price = getPrice(coin);
      if (!price || price === 0) return null;
      return usdAmount / price;
    },
    [getPrice]
  );

  return { prices, loading, error, lastUpdated, refresh, getPrice, convertUsdToCrypto };
}
