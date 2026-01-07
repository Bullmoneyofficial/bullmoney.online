"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MarketData {
  symbol: string;
  price: string;
  change: number;
  isUp: boolean;
}

export const LiveMarketTicker: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: 'BTC', price: '$98,432', change: 4.2, isUp: true },
    { symbol: 'ETH', price: '$3,842', change: 2.8, isUp: true },
    { symbol: 'SOL', price: '$142', change: 6.1, isUp: true },
    { symbol: 'XRP', price: '$0.58', change: -1.2, isUp: false },
    { symbol: 'ADA', price: '$0.42', change: 3.5, isUp: true },
    { symbol: 'DOGE', price: '$0.08', change: -0.8, isUp: false },
    { symbol: 'LINK', price: '$18.24', change: 5.3, isUp: true },
    { symbol: 'DOT', price: '$8.92', change: 1.7, isUp: true },
    { symbol: 'MATIC', price: '$0.92', change: -2.1, isUp: false },
    { symbol: 'AVAX', price: '$42.18', change: 7.2, isUp: true },
  ]);
  const [flashingSymbols, setFlashingSymbols] = useState<Set<string>>(new Set());

  // Simulate live price updates with realistic market behavior
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(coin => {
        // More volatile updates - markets move fast!
        const volatility = Math.abs(coin.change) > 5 ? 0.8 : 0.4; // High movers stay volatile
        const randomChange = (Math.random() - 0.48) * volatility; // Slight upward bias for FOMO
        const newChange = Math.round((coin.change + randomChange) * 10) / 10;

        // Clamp to realistic ranges (-15% to +20%)
        const clampedChange = Math.max(-15, Math.min(20, newChange));

        // Flash effect for significant changes (>0.5% difference)
        if (Math.abs(clampedChange - coin.change) > 0.5) {
          setFlashingSymbols(prev => new Set(prev).add(coin.symbol));
          setTimeout(() => {
            setFlashingSymbols(prev => {
              const newSet = new Set(prev);
              newSet.delete(coin.symbol);
              return newSet;
            });
          }, 500);
        }

        return {
          ...coin,
          change: clampedChange,
          isUp: clampedChange > 0,
        };
      }));
    }, 2000); // Faster updates for urgency (2s instead of 3s)

    return () => clearInterval(interval);
  }, []);

  // Duplicate the data for seamless loop
  const duplicatedData = [...marketData, ...marketData];

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black border-b border-white/10 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
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
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
            LIVE MARKETS
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <motion.div
            className="flex gap-6"
            animate={{
              x: [0, -50 * marketData.length],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {duplicatedData.map((coin, index) => {
              const isFlashing = flashingSymbols.has(coin.symbol);
              return (
                <motion.div
                  key={`${coin.symbol}-${index}`}
                  className={`flex items-center gap-2 shrink-0 px-2 py-1 rounded-lg transition-all ${
                    isFlashing
                      ? coin.isUp
                        ? 'bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                        : 'bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                      : ''
                  }`}
                  animate={isFlashing ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
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
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {coin.isUp ? '▲' : '▼'} {Math.abs(coin.change)}%
                  </motion.span>
                  {coin.isUp && Math.abs(coin.change) > 5 && (
                    <motion.span
                      className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold border border-orange-500/30"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🔥 HOT
                    </motion.span>
                  )}
                  {!coin.isUp && Math.abs(coin.change) > 5 && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-500/30">
                      📉 DUMP
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Trade now CTA */}
        <div className="ml-4 shrink-0">
          <motion.button
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/40 text-xs font-bold text-green-400 hover:from-green-500/30 hover:to-blue-500/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            TRADE NOW →
          </motion.button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
    </div>
  );
};
