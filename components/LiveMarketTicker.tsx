"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MarketData {
  symbol: string;
  price: string;
  change: number;
  isUp: boolean;
}

type CoinGeckoMarketResponse = {
  id: string;
  symbol: string;
  current_price?: number;
  price_change_percentage_24h?: number;
};

const PRICE_REFRESH_INTERVAL = 15000;
const FLASH_DURATION = 650;
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

const baseTickerData: MarketData[] = COIN_ORDER.map((coin) => ({
  symbol: coin.symbol,
  price: '—',
  change: 0,
  isUp: true,
}));

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const smallUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 6,
});

const formatUsdPrice = (value: number) =>
  Math.abs(value) < 0.01 ? smallUsdFormatter.format(value) : usdFormatter.format(value);

export const LiveMarketTicker: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>(baseTickerData);
  const [flashingSymbols, setFlashingSymbols] = useState<Set<string>>(new Set());
  const [, setErrorMessage] = useState<string | null>(null);

  const marketDataRef = useRef<MarketData[]>(baseTickerData);
  const flashTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const hasFetchedOnceRef = useRef(false);

  const triggerFlash = useCallback((symbols: string[]) => {
    if (!symbols.length) return;

    setFlashingSymbols((prev) => {
      const next = new Set(prev);
      symbols.forEach((symbol) => next.add(symbol));
      return next;
    });

    symbols.forEach((symbol) => {
      if (flashTimeoutsRef.current[symbol]) {
        clearTimeout(flashTimeoutsRef.current[symbol]);
      }

      flashTimeoutsRef.current[symbol] = setTimeout(() => {
        setFlashingSymbols((prev) => {
          const next = new Set(prev);
          next.delete(symbol);
          return next;
        });
        delete flashTimeoutsRef.current[symbol];
      }, FLASH_DURATION);
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchMarketData = async () => {
      try {
        const params = new URLSearchParams({
          vs_currency: 'usd',
          ids: COIN_ORDER.map((coin) => coin.id).join(','),
          order: 'market_cap_desc',
          per_page: COIN_ORDER.length.toString(),
          page: '1',
          sparkline: 'false',
          price_change_percentage: '24h',
        });

        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params}`);

        if (!response.ok) {
          throw new Error(`Market request failed with ${response.status}`);
        }

        const payload: CoinGeckoMarketResponse[] = await response.json();
        if (isCancelled) return;

        const nextData: MarketData[] = COIN_ORDER.map((coin) => {
          const result = payload.find((entry) => entry.id === coin.id);
          const currentPrice =
            typeof result?.current_price === 'number' ? result.current_price : undefined;
          const changeValue = result?.price_change_percentage_24h ?? 0;
          const roundedChange = Number(changeValue.toFixed(2));
          const symbol = result?.symbol?.toUpperCase() ?? coin.symbol;
          return {
            symbol,
            price:
              typeof currentPrice === 'number'
                ? formatUsdPrice(currentPrice)
                : baseTickerData.find((base) => base.symbol === coin.symbol)?.price ?? '—',
            change: roundedChange,
            isUp: roundedChange >= 0,
          };
        });

        if (isCancelled) return;

        const symbolsToFlash: string[] = [];
        if (hasFetchedOnceRef.current) {
          nextData.forEach((nextCoin) => {
            const prevCoin = marketDataRef.current.find((item) => item.symbol === nextCoin.symbol);
            if (prevCoin && Math.abs(nextCoin.change - prevCoin.change) > 0.5) {
              symbolsToFlash.push(nextCoin.symbol);
            }
          });
        }

        marketDataRef.current = nextData;
        setMarketData(nextData);
        setErrorMessage(null);

        if (symbolsToFlash.length) {
          triggerFlash(symbolsToFlash);
        }

        if (!hasFetchedOnceRef.current) {
          hasFetchedOnceRef.current = true;
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('Failed to fetch market data', error);
        setErrorMessage('Live data unavailable');
      }
    };

    fetchMarketData();
    const intervalId = setInterval(fetchMarketData, PRICE_REFRESH_INTERVAL);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      Object.values(flashTimeoutsRef.current).forEach(clearTimeout);
    };
  }, [triggerFlash]);

  // Duplicate data for the loop
  const duplicatedData = [...marketData, ...marketData];

  return (
    // FIX APPLIED HERE:
    // Changed 'relative' to 'fixed bottom-0 left-0 z-50'
    // This pins it to the bottom of the viewport
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black border-t border-white/10 shadow-2xl backdrop-blur-sm">
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

      {/* Ticker content */}
      <div className="relative flex items-center h-10 px-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 mr-4 shrink-0 hidden sm:flex">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
            LIVE
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative mask-linear-fade">
          <motion.div
            className="flex gap-8" // Increased gap for better readability
            animate={{
              // Adjusted calculation to be roughly 200px per item to prevent visual jumping
              x: [0, -200 * marketData.length], 
            }}
            transition={{
              duration: 40, // Slowed down slightly for readability
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {duplicatedData.map((coin, index) => {
              const isFlashing = flashingSymbols.has(coin.symbol);
              return (
                <motion.div
                  key={`${coin.symbol}-${index}`}
                  className={`flex items-center gap-2 shrink-0 px-2 py-1 rounded-lg transition-all min-w-[140px] ${
                    isFlashing
                      ? coin.isUp
                        ? 'bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                        : 'bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                      : ''
                  }`}
                >
                  <span className="text-xs font-bold text-white/80 font-mono">
                    {coin.symbol}
                  </span>
                  <span className="text-xs text-white/60 font-mono">
                    {coin.price}
                  </span>
                  <motion.span
                    className={`text-xs font-bold font-mono ${
                      coin.isUp ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {coin.isUp ? '▲' : '▼'} {Math.abs(coin.change)}%
                  </motion.span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Trade now CTA - Hidden on very small screens to save space */}
        <div className="ml-4 shrink-0 hidden md:flex flex-col items-end gap-1">
          <button
            className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-all"
          >
            TRADE
          </button>
        </div>
      </div>
    </div>
  );
};