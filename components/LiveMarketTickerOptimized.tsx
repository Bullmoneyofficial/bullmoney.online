"use client";

import React, { useEffect, useRef, useCallback, memo } from 'react';

/**
 * High-Performance Market Ticker - 120Hz Optimized
 * 
 * Key optimizations:
 * 1. Uses CSS animations instead of Framer Motion
 * 2. Updates prices via direct DOM manipulation (useRef)
 * 3. Zero React re-renders for price changes
 * 4. GPU-accelerated ticker scrolling
 * 5. Integrated with FPS optimizer via shimmer-quality-* CSS classes
 */

// FPS-aware ticker styles injected once
const TickerStyles = () => (
  <style jsx global>{`
    /* GPU hints for ticker animation */
    .ticker-track {
      animation: ticker-scroll 40s linear infinite;
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    @keyframes ticker-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    
    /* FPS-aware quality control */
    html.shimmer-quality-low .ticker-track {
      animation-duration: 60s;
    }
    
    html.shimmer-quality-disabled .ticker-track {
      animation: none !important;
    }
    
    html.is-scrolling .ticker-track {
      animation-play-state: paused;
    }
    
    /* Pulse indicator GPU optimization */
    .animate-pulse-gpu {
      animation: pulse-gpu 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      will-change: opacity;
    }
    
    @keyframes pulse-gpu {
      0%, 100% { 
        opacity: 0.4;
        filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
      }
      50% { 
        opacity: 1;
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
      }
    }
    
    html.shimmer-quality-low .animate-pulse-gpu,
    html.shimmer-quality-disabled .animate-pulse-gpu {
      animation: none;
      opacity: 1;
      filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
    }
  `}</style>
);

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

// Memoized ticker item - never re-renders
const TickerItem = memo(function TickerItem({ 
  symbol, 
  itemRef 
}: { 
  symbol: string;
  itemRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={itemRef}
      data-symbol={symbol}
      className="ticker-item flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg min-w-[150px] transition-[background,box-shadow] duration-200"
    >
      <span className="text-xs font-bold text-white/80 font-mono">{symbol}</span>
      <span className="ticker-price text-xs text-white/60 font-mono">—</span>
      <span className="ticker-change text-xs font-bold font-mono text-white">▲ 0%</span>
    </div>
  );
});

// Live pulse indicator - CSS only animation
const LiveIndicator = memo(function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 mr-4 shrink-0 hidden sm:flex">
      <div className="w-2 h-2 rounded-full bg-white animate-pulse-gpu" />
      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
        LIVE
      </span>
    </div>
  );
});

export const LiveMarketTickerOptimized: React.FC = memo(function LiveMarketTickerOptimized() {
  // Refs to DOM elements for direct manipulation (ZERO re-renders)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const priceDataRef = useRef<Map<string, MarketData>>(new Map());
  const flashTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // Store ref callback
  const setItemRef = useCallback((symbol: string) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(symbol, el);
    }
  }, []);
  
  // Direct DOM update - NO React re-render
  const updatePriceDOM = useCallback((symbol: string, data: MarketData, shouldFlash: boolean) => {
    const el = itemRefs.current.get(symbol);
    if (!el) return;
    
    const priceEl = el.querySelector('.ticker-price') as HTMLElement;
    const changeEl = el.querySelector('.ticker-change') as HTMLElement;
    
    if (priceEl) {
      priceEl.textContent = data.price;
    }
    
    if (changeEl) {
      const arrow = data.isUp ? '▲' : '▼';
      changeEl.textContent = `${arrow} ${Math.abs(data.change).toFixed(2)}%`;
      changeEl.className = `ticker-change text-xs font-bold font-mono ${data.isUp ? 'text-white' : 'text-red-400'}`;
    }
    
    // Flash effect via class toggle
    if (shouldFlash) {
      const flashClass = data.isUp 
        ? 'bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
        : 'bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
      
      el.classList.add(...flashClass.split(' '));
      
      // Clear existing timeout
      const existingTimeout = flashTimeoutsRef.current.get(symbol);
      if (existingTimeout) clearTimeout(existingTimeout);
      
      // Remove flash after duration
      const timeout = setTimeout(() => {
        el.classList.remove(...flashClass.split(' '));
        flashTimeoutsRef.current.delete(symbol);
      }, FLASH_DURATION);
      
      flashTimeoutsRef.current.set(symbol, timeout);
    }
  }, []);
  
  // Fetch and update prices - all DOM manipulation, no state
  useEffect(() => {
    let isCancelled = false;
    let hasFetchedOnce = false;
    
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data');
        if (!response.ok || isCancelled) return;

        const payload: CoinGeckoMarketResponse[] = await response.json();
        if (isCancelled) return;

        // Process each coin
        COIN_ORDER.forEach((coin) => {
          const result = payload.find((entry) => entry.id === coin.id);
          if (!result) {
            // Silently skip coins not in API response - this is expected behavior
            // when API returns partial data or coin ID doesn't match
            return;
          }
          const currentPrice = result.current_price;
          const changeValue = result.price_change_percentage_24h ?? 0;
          
          const newData: MarketData = {
            symbol: coin.symbol,
            price: typeof currentPrice === 'number' ? formatUsdPrice(currentPrice) : '—',
            change: Number(changeValue.toFixed(2)),
            isUp: changeValue >= 0,
          };
          
          // Check if should flash
          const prevData = priceDataRef.current.get(coin.symbol);
          const shouldFlash = hasFetchedOnce && prevData && 
            Math.abs(newData.change - prevData.change) > 0.5;
          
          // Store new data
          priceDataRef.current.set(coin.symbol, newData);
          
          // Update DOM directly
          updatePriceDOM(coin.symbol, newData, shouldFlash ?? false);
        });

        hasFetchedOnce = true;
      } catch (error) {
        console.error('Failed to fetch market data', error);
      }
    };

    // Initial fetch
    fetchMarketData();
    
    // Polling interval
    const intervalId = setInterval(fetchMarketData, PRICE_REFRESH_INTERVAL);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      flashTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [updatePriceDOM]);

  return (
    <>
      <TickerStyles />
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full overflow-hidden bg-linear-to-r from-black via-gray-900 to-black border-t border-white/10 shadow-2xl transform translateZ-0">
      {/* Background pattern - static, no animation */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-white/50 to-transparent" />

      {/* Ticker content */}
      <div className="relative flex items-center h-10 px-4">
        <LiveIndicator />

        {/* CSS-animated ticker - NO Framer Motion */}
        <div className="ticker-container flex-1 overflow-hidden relative">
          {/* Fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-gray-900 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling track - CSS animation */}
          <div className="ticker-track flex gap-6">
            {/* First set */}
            {COIN_ORDER.map((coin) => (
              <TickerItem 
                key={`a-${coin.symbol}`}
                symbol={coin.symbol}
                itemRef={setItemRef(coin.symbol)}
              />
            ))}
            {/* Duplicate for seamless loop */}
            {COIN_ORDER.map((coin) => (
              <TickerItem 
                key={`b-${coin.symbol}`}
                symbol={coin.symbol}
                itemRef={() => {}} // Second set doesn't need refs
              />
            ))}
          </div>
        </div>

        {/* Trade CTA */}
        <div className="ml-4 shrink-0 hidden md:flex">
          <button className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-colors">
            TRADE
          </button>
        </div>
      </div>
    </div>
    </>
  );
});

export default LiveMarketTickerOptimized;
