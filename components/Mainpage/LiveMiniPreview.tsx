"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Wifi, WifiOff, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { detectBrowser } from '@/lib/browserDetection';

// --- 1. SMART ASSET DETECTION SYSTEM ---

type AssetType = 'CRYPTO' | 'STOCK' | 'METAL';

interface AssetInfo {
    symbol: string;
    type: AssetType;
    base: number;
    label: string;
    decimals: number;
}

// Define the comprehensive mapping for names, symbols, and properties
const ASSET_MAPPINGS: Record<string, { symbol: string, type: AssetType, base: number, decimals: number }> = {
    // CRYPTOS (Real-time via Binance)
    'btc': { symbol: 'BTCUSDT', type: 'CRYPTO', base: 60000, decimals: 2 },
    'bitcoin': { symbol: 'BTCUSDT', type: 'CRYPTO', base: 60000, decimals: 2 },
    'eth': { symbol: 'ETHUSDT', type: 'CRYPTO', base: 3000, decimals: 2 },
    'ethereum': { symbol: 'ETHUSDT', type: 'CRYPTO', base: 3000, decimals: 2 },
    'sol': { symbol: 'SOLUSDT', type: 'CRYPTO', base: 150, decimals: 2 },
    'solana': { symbol: 'SOLUSDT', type: 'CRYPTO', base: 150, decimals: 2 },
    'xrp': { symbol: 'XRPUSDT', type: 'CRYPTO', base: 0.5, decimals: 4 },
    'ripple': { symbol: 'XRPUSDT', type: 'CRYPTO', base: 0.5, decimals: 4 },
    'ltc': { symbol: 'LTCUSDT', type: 'CRYPTO', base: 80, decimals: 2 },
    'litecoin': { symbol: 'LTCUSDT', type: 'CRYPTO', base: 80, decimals: 2 },
    'doge': { symbol: 'DOGEUSDT', type: 'CRYPTO', base: 0.15, decimals: 4 },
    'cardano': { symbol: 'ADAUSDT', type: 'CRYPTO', base: 0.45, decimals: 4 },
    'ada': { symbol: 'ADAUSDT', type: 'CRYPTO', base: 0.45, decimals: 4 },
    
    // METALS (Simulated Realism)
    'gold': { symbol: 'XAUUSD', type: 'METAL', base: 2030, decimals: 2 },
    'xau': { symbol: 'XAUUSD', type: 'METAL', base: 2030, decimals: 2 },
    'silver': { symbol: 'XAGUSD', type: 'METAL', base: 22.50, decimals: 3 },
    
    // STOCKS (Simulated Realism)
    'tsla': { symbol: 'TSLA', type: 'STOCK', base: 240, decimals: 2 },
    'tesla': { symbol: 'TSLA', type: 'STOCK', base: 240, decimals: 2 },
    'aapl': { symbol: 'AAPL', type: 'STOCK', base: 195, decimals: 2 },
    'apple': { symbol: 'AAPL', type: 'STOCK', base: 195, decimals: 2 },
};

const getAssetInfo = (themeName: string): AssetInfo => {
    const text = themeName.toLowerCase();
    
    // 1. Iterate through the map to find a match in the theme name (prioritizing full names)
    const matches = Object.entries(ASSET_MAPPINGS)
        .filter(([key, _info]) => text.includes(key));
    
    // Find the best match: the longest keyword is usually the most specific
    const bestMatch = matches.sort((a, b) => b[0].length - a[0].length)[0];

    if (bestMatch) {
        const [keyword, info] = bestMatch;
        return { 
            symbol: info.symbol, 
            type: info.type, 
            base: info.base, 
            label: keyword.toUpperCase(), 
            decimals: info.decimals 
        };
    }

    // 2. Default Fallback (BTC)
    const defaultInfo = ASSET_MAPPINGS['btc'];
    if (!defaultInfo) {
        return { symbol: 'BTCUSDT', type: 'CRYPTO', base: 60000, label: 'BTC', decimals: 2 };
    }
    return {
        symbol: defaultInfo.symbol,
        type: defaultInfo.type,
        base: defaultInfo.base,
        label: 'BTC',
        decimals: defaultInfo.decimals
    };
};

// --- 2. DATA HOOK ---

const useMarketStream = (themeName: string, isUnavailable: boolean) => {
    const asset = useMemo(() => getAssetInfo(themeName), [themeName]);
    const [price, setPrice] = useState<number>(asset.base || 0);
    const [prevPrice, setPrevPrice] = useState<number>(asset.base || 0);
    const [history, setHistory] = useState<number[]>([]);
    const [connected, setConnected] = useState(false);
    
    const lastYRef = useRef<number>(45); 

    useEffect(() => {
        if (isUnavailable) return;
        
        // Reset state on theme change
        setHistory([]); 
        setConnected(false);

        let ws: WebSocket | null = null;
        let interval: NodeJS.Timeout | null = null;
        let currentPrice = asset.base;
        setPrice(currentPrice);

        const updateData = (newPrice: number) => {
             setPrice(p => { 
                // Only update prevPrice if the price has actually changed (prevents flicker on initial load)
                if (p !== newPrice) setPrevPrice(p); 
                return newPrice; 
             });
             setHistory(prev => {
                const next = [...prev, newPrice];
                return next.length > 50 ? next.slice(1) : next; // Keep a max of 50 data points
             });
        };

        // Check browser capabilities for WebSocket
        const browserInfo = detectBrowser();
        const canUseWebSocket = browserInfo.canHandleWebSocket;

        if (asset.type === 'CRYPTO' && canUseWebSocket) {
            // Real Binance Stream
            try {
                ws = new WebSocket(`wss://stream.binance.com:9443/ws/${asset.symbol.toLowerCase()}@trade`);
                ws.onopen = () => setConnected(true);
                ws.onclose = () => setConnected(false);
                ws.onerror = () => {
                    setConnected(false);
                    // Fall back to simulation on WebSocket error
                    interval = setInterval(() => {
                        const volatility = 0.0003;
                        const change = currentPrice * volatility * (Math.random() - 0.5);
                        currentPrice += change;
                        updateData(currentPrice);
                    }, 1000);
                };
                ws.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        updateData(parseFloat(data.p));
                    } catch (err) {
                        // Silent fail on parse error
                    }
                };
            } catch (e) {
                // WebSocket creation failed - use simulation
                console.log('[LiveMiniPreview] WebSocket unavailable, using simulation');
                setConnected(true);
                updateData(currentPrice);
                interval = setInterval(() => {
                    const volatility = 0.0003;
                    const change = currentPrice * volatility * (Math.random() - 0.5);
                    currentPrice += change;
                    updateData(currentPrice);
                }, 1000);
            }
        } else {
            // Simulated Data (Stocks/Metals or in-app browsers)
            setConnected(true);
            updateData(currentPrice);

            interval = setInterval(() => {
                const volatility = asset.type === 'METAL' ? 0.0002 : 0.0005;
                const change = currentPrice * volatility * (Math.random() - 0.5);
                currentPrice += change;
                updateData(currentPrice);
            }, 1000);
        }

        return () => {
            if (ws) {
                try {
                    ws.close();
                } catch (e) {
                    // Silent fail
                }
            }
            if (interval) clearInterval(interval);
        };
    }, [asset.symbol, asset.type, asset.base, isUnavailable]);

    return { price, prevPrice, history, connected, label: asset.label, decimals: asset.decimals, symbol: asset.symbol, lastYRef };
};


// --- 3. COMPONENT (Visuals) ---

export const LiveMiniPreview = ({ 
  themeName = "Bitcoin Orange", 
  color = "#F7931A", 
  isUnavailable = false 
}: { 
  themeName?: string, 
  color?: string, 
  isUnavailable?: boolean 
}) => {
  
  const { price, prevPrice, history, connected, label, decimals, symbol, lastYRef } = useMarketStream(themeName, isUnavailable);
  const isUp = price >= prevPrice;
  // Use price / prevPrice to ensure no division by zero if prevPrice is 0
  const priceChangePercent = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
  
  // Sparkline SVG Logic & Path Generation
  const { path, areaPath } = useMemo(() => {
    if (history.length < 2) return { path: "", areaPath: "M0,50 L100,50 Z" };

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 0.0001;
    
    let linePath = "M";
    let lastYPos = 45;

    history.forEach((p, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 45 - ((p - min) / range * 40); 
      linePath += `${x},${y} `;
      if (i === history.length - 1) {
          lastYPos = y;
      }
    });
    
    const areaPath = `${linePath} L100,50 L0,50 Z`;
    lastYRef.current = lastYPos;

    return { path: linePath, areaPath };
  }, [history, lastYRef]);

  // Dynamic colors for the Order Book simulation
  const mainFlowColor = isUp ? 'text-white' : 'text-red-400';
  const altFlowColor = isUp ? 'text-red-400' : 'text-white';
  const orderBookColor = isUp ? 'bg-white/10' : 'bg-red-600/10';

  return (
    <div 
      className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans select-none border border-gray-900 transition-all duration-300" 
      style={{ '--theme-c': color } as React.CSSProperties}
    >
      
      {/* --- Header Bar --- */}
      <div className="h-5 w-full border-b border-white/5 flex items-center justify-between px-2 bg-black/40 z-20">
         <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${connected ? 'bg-[var(--theme-c)] animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-[8px] font-bold text-gray-300 tracking-wider uppercase">
               {label} <span className="text-gray-600">/</span> {symbol.includes('USDT') ? 'USDT' : 'USD'}
            </span>
         </div>
         <div className="scale-75">{connected ? <Wifi size={8} className="text-white/40"/> : <WifiOff size={8} className="text-red-500/50"/>}</div>
      </div>

      {/* --- Main Chart Area (Hero) --- */}
      <div className="h-28 relative w-full flex flex-col justify-end p-2 overflow-hidden bg-linear-to-b from-white/[0.02] to-transparent">
         
         {/* Price Overlay */}
         <div className="absolute top-2 left-2 z-10">
            <div className="text-lg font-bold text-white tabular-nums tracking-tighter" style={{ textShadow: `0 0 10px ${color}60` }}>
                {price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            </div>
            <div className={`text-[8px] font-mono flex items-center gap-0.5 ${isUp ? 'text-white' : 'text-red-400'}`}>
                {isUp ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                {priceChangePercent.toFixed(2)}%
            </div>
         </div>

         {/* Chart SVG */}
         <div className="absolute inset-0 pointer-events-none opacity-80">
             <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                 <defs>
                    <linearGradient id={`g-${symbol}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                 </defs>
                 
                 {/* Area Fill */}
                 <path d={areaPath} fill={`url(#g-${symbol})`} className="transition-[d] duration-300 ease-linear" />
                 
                 {/* Stroke Line */}
                 <path 
                    d={path} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="1.2" 
                    filter="url(#glow)"
                    vectorEffect="non-scaling-stroke"
                    className="transition-[d] duration-300 ease-linear"
                 />
             </svg>
             
             {/* Final Glowing Ticker Dot */}
             <div 
                className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{ 
                    // 100% of container height (28 units). lastY is in 0-50 space.
                    top: `calc(100% * (${lastYRef.current} / 50))`, 
                    right: '0%', 
                    backgroundColor: color,
                    boxShadow: `0 0 5px ${color}`,
                    opacity: connected ? 1 : 0.5
                }}
             />
         </div>
      </div>

      {/* --- Bottom Data Grid --- */}
      <div className="flex-1 border-t border-white/5 grid grid-cols-2">
         
         {/* Metadata Box */}
         <div className="p-2 flex flex-col justify-end border-r border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--theme-c),_transparent)]" />
             
             <div className="relative z-10">
                 <div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-1">{themeName}</div>
                 <div className="text-[9px] text-gray-300 font-mono">24H Vol: {(Math.random() * 10).toFixed(1)}B</div>
                 <div className="h-0.5 w-10 bg-gray-800 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-white/50" style={{ width: '60%' }} />
                 </div>
             </div>
         </div>

         {/* Order Flow Simulation */}
         <div className="relative flex flex-col p-1 gap-[1px] overflow-hidden" style={{ backgroundColor: orderBookColor }}>
            <div className="text-[6px] text-gray-600 uppercase flex items-center gap-1 mb-0.5 pl-1">
                <Activity size={6} /> Order Book Stream
            </div>
            {/* Generating fake order flow based on current price */}
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between text-[7px] px-1 opacity-80">
                    <span className={i % 2 === 0 ? mainFlowColor : altFlowColor}>
                        {(price + (Math.random() * (price * 0.001) * (i%2 ? 1 : -1))).toFixed(decimals)}
                    </span>
                    <span className="text-gray-500">{(Math.random() * 2).toFixed(4)}</span>
                </div>
            ))}
         </div>

      </div>
    </div>
  );
};