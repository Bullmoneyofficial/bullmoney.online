"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
  useVelocity,
} from "framer-motion";
import { ArrowUpRight, Zap, Minimize2, Activity } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONFIG ---
const ASSETS = {
  BTC: { id: "BTC", symbol: "BINANCE:BTCUSDT", icon: "₿" },
  ETH: { id: "ETH", symbol: "BINANCE:ETHUSDT", icon: "Ξ" },
};
type AssetKey = keyof typeof ASSETS;

// --- COMPONENT: MOVING BORDER ---
const MovingBorder = ({ 
  children, 
  duration = 1.5, 
  rx = "rounded-2xl", 
  className = "",
  containerClassName = "" 
}: { 
  children: React.ReactNode, 
  duration?: number, 
  rx?: string,
  className?: string,
  containerClassName?: string
}) => {
  return (
    <div className={cn("relative p-[1px] overflow-hidden group", rx, containerClassName)}>
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#0000_50%,#3b82f6_100%)] opacity-100 will-change-transform"
      />
      <div className={cn("relative h-full w-full bg-[#020617] overflow-hidden", rx, className)}>
        {children}
      </div>
    </div>
  );
};

// --- HOOKS ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const symbol = ASSETS[assetKey].symbol.split(":")[1].toLowerCase();
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 50) { 
          const data = JSON.parse(event.data);
          setPrice(parseFloat(data.p));
          lastUpdateRef.current = now;
        }
      };
    } catch (e) { console.error(e); }
    return () => { if (ws) ws.close(); };
  }, [assetKey]);

  return { price };
};

const useMouseVelocity = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 400 });
  const velocity = useTransform(
    [useVelocity(smoothX), useVelocity(smoothY)],
    ([latestX, latestY]: number[]) => Math.sqrt(latestX ** 2 + latestY ** 2)
  );
  return { x, y, velocity };
};

// --- TRADINGVIEW WIDGET ---
const TradingViewWidget = ({ assetKey, id, isBackground = false }: { assetKey: AssetKey; id: string; isBackground?: boolean; }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const container = document.createElement("div");
    Object.assign(container.style, { height: "100%", width: "100%" });
    container.id = id; 
    containerRef.current.appendChild(container);
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    
    const baseConfig = {
      autosize: true,
      symbol: ASSETS[assetKey].symbol,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(2, 6, 23, 1)",
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      hide_volume: true,
    };

    const config = isBackground ? {
      ...baseConfig,
      gridLineColor: "rgba(30, 58, 138, 0.05)",
      scaleFontColor: "rgba(134, 137, 147, 0)",
      upColor: "#3b82f6", 
      downColor: "#1e1e1e", 
    } : {
      ...baseConfig,
      hide_legend: false,
      gridLineColor: "rgba(255, 255, 255, 0.02)",
    };

    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);
  }, [assetKey, id, isBackground]);

  return <div ref={containerRef} className="w-full h-full" />;
};

const ReactiveLiquidLogo = ({ src }: { src: string }) => {
  const { x, y, velocity } = useMouseVelocity();
  const baseFreq = useTransform(useSpring(useTransform(velocity, [0, 1000], [0, 0.1]), { stiffness: 200, damping: 20 }), [0, 0.1], [0, 0.05]);
  return (
    <div className="relative w-16 h-16 flex items-center justify-center z-40" onMouseMove={(e) => { x.set(e.clientX); y.set(e.clientY); }}>
      <svg style={{ position: "absolute", width: 0, height: 0 }}><defs><filter id="liquid-distort-mini"><motion.feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves="2" result="noise" /><motion.feDisplacementMap in="SourceGraphic" in2="noise" scale="15" /></filter></defs></svg>
      <motion.div className="w-full h-full flex items-center justify-center" style={{ filter: "url(#liquid-distort-mini)" }}>
          <img src={src} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
      </motion.div>
    </div>
  );
};

// --- PROPS INTERFACE UPDATE ---
interface QuickGateProps {
  children?: React.ReactNode; // FIX: Made optional
  onUnlock?: () => void;
  onFinished?: () => void;    // FIX: Added alias to solve type error
}

// --- MAIN COMPONENT ---
export default function QuickGate({ children, onUnlock, onFinished }: QuickGateProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const { price: realPrice } = useLivePrice(selectedAsset);
  const [displayPrice, setDisplayPrice] = useState(0);
  
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const requestRef = useRef<number>();
  const basePriceRef = useRef(0);

  useEffect(() => {
    if (!isHolding && realPrice > 0) {
      basePriceRef.current = realPrice;
      setDisplayPrice(realPrice);
    }
  }, [realPrice, isHolding]);

  // --- TURBO PHYSICS ENGINE ---
  const animate = useCallback(() => {
    if (isCompleted) { shakeX.set(0); shakeY.set(0); return; }

    setProgress((prev) => {
      let next = prev;
      
      if (isHolding) {
        const boost = prev > 80 ? 25.0 : prev > 50 ? 10.0 : 3.5; 
        next = Math.min(prev + boost, 100);

        const shakeAmplitude = (next > 20) ? (next / 100) * 15 : 0; 
        if (shakeAmplitude > 0) {
            shakeX.set((Math.random() - 0.5) * shakeAmplitude * 2);
            shakeY.set((Math.random() - 0.5) * shakeAmplitude * 2);
        }

        const parabolicPump = Math.pow(next * 0.01, 3) * 10000;
        setDisplayPrice(basePriceRef.current + parabolicPump);

        if (typeof navigator !== "undefined" && navigator.vibrate) {
             if (Math.random() < next/100) navigator.vibrate(10);
        }

      } else {
        shakeX.set(0); shakeY.set(0);
        next = Math.max(prev - 10, 0); 
        if (basePriceRef.current > 0) setDisplayPrice(basePriceRef.current);
      }

      if (next >= 100) {
        setIsCompleted(true);
        if (navigator.vibrate) navigator.vibrate(200);
        
        setTimeout(() => {
            setGateVisible(false);
            setShowTerminal(true);
            // FIX: Call whichever prop was passed
            if (onUnlock) onUnlock(); 
            if (onFinished) onFinished();
        }, 200); 
        
        return 100;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [isHolding, isCompleted, displayPrice, shakeX, shakeY, onUnlock, onFinished]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <>
       {/* REAL CONTENT (Rendered if children exist) */}
       {children && <div className="relative z-0 min-h-screen w-full">{children}</div>}

       {/* FLASHBANG */}
       <AnimatePresence>
         {isCompleted && gateVisible && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} 
                className="fixed inset-0 z-[100] bg-blue-500/20 mix-blend-overlay pointer-events-none"
            />
         )}
       </AnimatePresence>

       {/* THE QUICK GATE */}
       <AnimatePresence>
       {gateVisible && (
           <motion.div 
             exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
             transition={{ duration: 0.3 }}
             className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#020617] text-white overflow-hidden"
           >
                {/* Background Chart */}
                <div className="absolute inset-0 z-0 opacity-20 scale-110 pointer-events-none grayscale">
                     <TradingViewWidget assetKey={selectedAsset} id="tv-bg-quick" isBackground={true} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent z-10" />

                {/* Asset Selector */}
                <div className="absolute top-8 z-50 flex gap-2">
                    {Object.entries(ASSETS).map(([key, asset]) => (
                        <button key={key} onClick={() => setSelectedAsset(key as AssetKey)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all", key === selectedAsset ? "bg-blue-900/50 text-white border-blue-500" : "text-slate-500 border-transparent")}>
                            {asset.id}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <motion.div style={{ x: shakeX, y: shakeY }} className="relative z-30 flex flex-col items-center gap-6">
                    <ReactiveLiquidLogo src="/favicon.svg" />
                    
                    <div className="flex flex-col items-center">
                        <div className={cn("text-5xl font-mono font-bold tracking-tighter transition-all duration-75", isHolding ? "text-blue-400 scale-105" : "text-white")}>
                            ${(displayPrice || realPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="h-6 mt-1 flex items-center justify-center">
                            {isHolding && <div className="text-[10px] font-bold text-blue-400 animate-pulse flex items-center gap-1"><Zap size={10} /> ACCELERATING</div>}
                        </div>
                    </div>

                    {/* Quick Button */}
                    <div className="relative w-64 h-16 cursor-pointer touch-none" 
                         onMouseDown={() => !isCompleted && setIsHolding(true)} 
                         onMouseUp={() => setIsHolding(false)} 
                         onMouseLeave={() => setIsHolding(false)}
                         onTouchStart={(e) => { e.preventDefault(); !isCompleted && setIsHolding(true); }} 
                         onTouchEnd={() => setIsHolding(false)}
                    >
                        <MovingBorder rx="rounded-xl" duration={1} className="bg-[#0b1221]">
                            <div className="relative h-full w-full flex items-center justify-center gap-3 z-10">
                                <div className="absolute inset-0 bg-blue-600 transition-transform duration-75 ease-linear origin-left" style={{ transform: `scaleX(${progress / 100})` }} />
                                <div className="relative z-10 font-bold italic tracking-tighter flex items-center gap-2 mix-blend-difference">
                                    HOLD FAST <ArrowUpRight className={cn("w-4 h-4 transition-transform", isHolding && "translate-x-1 -translate-y-1")} />
                                </div>
                            </div>
                        </MovingBorder>
                    </div>
                </motion.div>
           </motion.div>
       )}
       </AnimatePresence>

       {/* MINI TERMINAL (Post-Load) */}
       <AnimatePresence>
         {showTerminal && (
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="fixed bottom-4 right-4 z-50 w-[300px] h-[350px] bg-[#0b1221] border border-blue-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 tracking-widest"><Activity size={12} /> QUICK VIEW</div>
                    <button onClick={() => setShowTerminal(false)} className="text-slate-500 hover:text-white"><Minimize2 size={14} /></button>
                </div>
                <div className="flex-1 relative bg-[#020617]">
                    <TradingViewWidget assetKey={selectedAsset} id="tv-widget-quick" isBackground={false} />
                </div>
            </motion.div>
         )}
       </AnimatePresence>
    </>
  );
}