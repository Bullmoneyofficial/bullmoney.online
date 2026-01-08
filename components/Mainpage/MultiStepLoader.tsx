"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
  useVelocity,
} from "framer-motion";
import { cn } from "@/lib/utils";
// ADJUST THIS PATH IF NEEDED:
import GhostLoaderCursor from "@/components/Mainpage/GhostCursor";

// --- GLOBAL ASSET CONFIGURATION ---
const ASSETS = {
  BTC: {
    id: "BTC",
    symbol: "BINANCE:BTCUSDT",
    name: "BITCOIN",
    sub: "BTC / USDT",
    icon: "₿",
    color: "#F7931A", 
  },
  ETH: {
    id: "ETH",
    symbol: "BINANCE:ETHUSDT",
    name: "ETHEREUM",
    sub: "ETH / USDT",
    icon: "Ξ",
    color: "#627EEA",
  },
  SOL: {
    id: "SOL",
    symbol: "BINANCE:SOLUSDT",
    name: "SOLANA",
    sub: "SOL / USDT",
    icon: "◎",
    color: "#14F195",
  },
};

type AssetKey = keyof typeof ASSETS;

// --- 1. OPTIMIZED: LIVE PRICE HOOK ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const lastPriceRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    lastPriceRef.current = 0;
    lastUpdateRef.current = 0;
    setPrice(0);
    setPrevPrice(0);
    const symbolParts = ASSETS[assetKey].symbol.split(":");
    const symbol = symbolParts[1]?.toLowerCase(); // e.g., btcusdt
    if (!symbol) return;
    
    // Binance stream endpoint
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);

    ws.onmessage = (event) => {
      const now = Date.now();
      // Throttle updates to 500ms
      if (now - lastUpdateRef.current > 500) {
        const data = JSON.parse(event.data);
        const currentPrice = parseFloat(data.p);
        setPrevPrice(lastPriceRef.current);
        setPrice(currentPrice);
        lastPriceRef.current = currentPrice;
        lastUpdateRef.current = now;
      }
    };

    return () => {
      if (ws) ws.close();
    };
  }, [assetKey]);

  return { price, prevPrice };
};

// --- 2. OPTIMIZED: MOUSE VELOCITY ---
const useMouseVelocity = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const smoothX = useSpring(x, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 400 });

  const xVelocity = useVelocity(smoothX);
  const yVelocity = useVelocity(smoothY);

  const velocity = useTransform(
    [xVelocity, yVelocity],
    ([latestX, latestY]: number[]) => Math.sqrt((latestX ?? 0) ** 2 + (latestY ?? 0) ** 2)
  );

  return { x, y, velocity };
};

// --- 3. TRADINGVIEW CHART BACKGROUND ---
const TradingViewBackground = memo(({ assetKey }: { assetKey: AssetKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const asset = ASSETS[assetKey];

  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;

    const widgetId = "tv_bg_" + Math.random().toString(36).substring(7);
    currentRef.innerHTML = "";

    const container = document.createElement("div");
    container.id = widgetId;
    container.style.height = "100%";
    container.style.width = "100%";
    currentRef.appendChild(container);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: asset.symbol,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      calendar: false,
      hide_volume: true,
      backgroundColor: "rgba(2, 6, 23, 1)", 
      gridLineColor: "rgba(30, 58, 138, 0.1)",
      scaleFontColor: "rgba(134, 137, 147, 0)",
      upColor: "#2563EB", 
      downColor: "#FFFFFF", 
      borderUpColor: "#2563EB",
      borderDownColor: "#FFFFFF",
      wickUpColor: "#2563EB",
      wickDownColor: "#FFFFFF",
    });
    container.appendChild(script);

    return () => {
      if (currentRef) currentRef.innerHTML = "";
    };
  }, [assetKey]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-blue-950/20 z-10 mix-blend-overlay" />
      <div
        ref={containerRef}
        className="w-full h-full opacity-60 grayscale-[20%] contrast-125 scale-110"
      />
    </div>
  );
});
TradingViewBackground.displayName = "TradingViewBackground";

// --- 4. HEADER WITH SHIMMER BUTTONS ---
const LiveChromeHeader = memo(({ 
  currentAsset, 
  setAsset 
}: { 
  currentAsset: AssetKey; 
  setAsset: (k: AssetKey) => void; 
}) => {
  const { price, prevPrice } = useLivePrice(currentAsset);
  const isUp = price >= prevPrice;

  const priceFormatted = useMemo(
    () =>
      price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [price]
  );

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-5 md:p-8 w-full max-w-[100vw] pointer-events-auto"
    >
      {/* LEFT: Asset Buttons */}
      <div className="flex gap-4">
        {Object.entries(ASSETS).map(([key, asset]) => {
          const isActive = key === currentAsset;
          return (
            <button
              key={key}
              onClick={() => setAsset(key as AssetKey)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border backdrop-blur-md cursor-pointer",
                isActive 
                  ? "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                  : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
              )}
            >
              <div 
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  isActive ? "text-white scale-110" : "text-white/50 grayscale"
                )}
                style={{ backgroundColor: isActive ? asset.color : "#333" }}
              >
                {asset.icon}
              </div>
              
              <div className="flex flex-col items-start">
                <span className={cn(
                  "text-xs font-bold leading-none transition-all",
                  isActive ? "animate-text-shimmer" : "text-neutral-500"
                )}>
                  {asset.name}
                </span>
                {isActive && (
                   <span className="text-[8px] text-blue-200/50 leading-none tracking-widest mt-0.5">
                     VIEWING
                   </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* RIGHT: Live Price */}
      <div className="flex flex-col items-end">
        <div className="text-2xl md:text-3xl font-mono font-black tracking-tight leading-none tabular-nums animate-text-shimmer">
          {price === 0 ? "LOADING..." : priceFormatted}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isUp ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span className="text-xs md:text-sm font-mono font-bold text-white/50 tracking-widest">
            USD PRICE
          </span>
        </div>
      </div>
    </motion.div>
  );
});
LiveChromeHeader.displayName = "LiveChromeHeader";

// --- 5. REACTIVE LIQUID LOGO ---
const ReactiveLiquidLogo = ({ src }: { src: string }) => {
  const { x, y, velocity } = useMouseVelocity();
  const targetDistortion = useTransform(velocity, [0, 1000], [0, 0.04]);
  const smoothDistortion = useSpring(targetDistortion, { stiffness: 200, damping: 25 });
  const baseFreq = useTransform(smoothDistortion, [0, 0.04], [0, 0.05]);

  const handleMove = (e: any) => {
    let clientX, clientY;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    x.set(clientX);
    y.set(clientY);
  };
  
  const handleReset = () => { x.set(0); y.set(0); };

  return (
    <div
      className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center z-50 perspective-[1000px] touch-none"
      onMouseMove={handleMove}
      onMouseLeave={handleReset}
      onTouchStart={handleMove}
      onTouchMove={handleMove}
      onTouchEnd={handleReset}
    >
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="velocity-liquid">
            <motion.feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves="2" result="noise" />
            <motion.feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <motion.div
        className="relative w-full h-full cursor-pointer will-change-transform select-none"
        style={{ filter: "url(#velocity-liquid) drop-shadow(0 0 20px rgba(37, 99, 235, 0.4))" }}
      >
        <img src={src} alt="Logo" className="w-full h-full object-contain select-none pointer-events-none" draggable={false} />
      </motion.div>
    </div>
  );
};

// --- 6. ENCRYPTED TEXT ---
const CHARS = "ABCDEF0123456789!@#$%^&*";
const EncryptedText = memo(({ text, className }: { text: string; className?: string }) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let iter = 0;
    const interval = setInterval(() => {
      setDisplay(
        text.split("").map((_letter, index) => {
            if (index < iter) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join("")
      );
      if (iter >= text.length) clearInterval(interval);
      iter += 1 / 3;
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span className={className}>{display}</span>;
});
EncryptedText.displayName = "EncryptedText";

// --- 7. MAIN COMPONENT ---
export interface LoadingState { text: string; }
const TARGET_DURATION_MS = 6000; 

export const MultiStepLoader = ({ loadingStates, loading }: { loadingStates: LoadingState[]; loading: boolean; }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  
  // Scroll Lock
  useEffect(() => {
    if (loading) document.body.classList.add("loader-active");
    else document.body.classList.remove("loader-active");
    return () => document.body.classList.remove("loader-active");
  }, [loading]);

  // Audio Logic
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (loading) {
      audioRef.current = new Audio("/modals.mp3");
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(() => {}); // Autoplay handling
      const timer = setTimeout(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      }, 4800);
      return () => clearTimeout(timer);
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      return undefined;
    }
  }, [loading]);

  // Loader Logic
  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }
    const totalSteps = loadingStates.length;
    const stepDuration = TARGET_DURATION_MS / totalSteps; 
    
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
    }, stepDuration);

    const updateFrequency = 30;
    const increment = (100 / TARGET_DURATION_MS) * updateFrequency; 
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + increment));
    }, updateFrequency);
    
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading, loadingStates.length]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(15px)", scale: 1.05 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] overflow-hidden cursor-none font-sans h-[100dvh] w-screen"
        >
          {/* Custom CSS for Shimmer */}
          <style jsx global>{`
            .loader-active { overflow: hidden !important; height: 100vh; width: 100vw; }
            
            @keyframes text-shimmer {
              0% { background-position: 0% 50%; }
              100% { background-position: -200% 50%; }
            }

            .animate-text-shimmer {
              /* Premium Grey to White to Indigo Gradient */
              background: linear-gradient(
                110deg, 
                #64748b 20%,   
                #ffffff 48%,   
                #818cf8 52%,   
                #64748b 80%    
              );
              background-size: 200% auto;
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              color: transparent;
              animation: text-shimmer 3s linear infinite;
            }
          `}</style>

          <GhostLoaderCursor />
          <TradingViewBackground assetKey={selectedAsset} />
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.3)_0%,#020617_100%)] z-10 pointer-events-none" />

          {/* Interactive Header with Buttons */}
          <LiveChromeHeader currentAsset={selectedAsset} setAsset={setSelectedAsset} />

          {/* Main Content */}
          <div className="relative z-20 flex flex-col items-center justify-center p-4 w-full h-full pointer-events-none">
            
            <div className="mb-6 md:mb-10 relative z-50 pointer-events-auto">
              <ReactiveLiquidLogo src="/favicon.svg" />
            </div>

            <div className="relative text-center mb-8 md:mb-12">
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter animate-text-shimmer drop-shadow-2xl">
                BULLMONEY
              </h1>
              <span className="block text-sm md:text-lg tracking-[0.5em] text-blue-500/50 uppercase font-bold mt-2">
                Premium Gateway
              </span>
            </div>

            <div className="relative w-full max-w-[400px] flex flex-col items-center justify-center">
              {/* Sonar Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] flex items-center justify-center pointer-events-none [transform:perspective(800px)_rotateX(75deg)]">
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{ width: "100px", height: "100px", opacity: 0, border: "1px solid #1E40AF" }}
                    animate={{ width: ["100px", "600px"], height: ["100px", "600px"], opacity: [0.5, 0], borderWidth: ["3px", "0px"] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: ring * 0.6, ease: "easeOut" }}
                    className="absolute rounded-full border-blue-600/50 shadow-[0_0_30px_rgba(37,99,235,0.2)] bg-blue-900/5"
                  />
                ))}
              </div>

              {/* Shimmering Percentage */}
              <div className="relative z-30 flex flex-col items-center mb-6">
                <div className="text-6xl md:text-8xl font-mono font-bold mb-2 tabular-nums tracking-tighter animate-text-shimmer">
                  {Math.floor(progress).toString().padStart(2, "0")}%
                </div>
              </div>

              {/* Status Pill */}
              <div className="relative z-30 flex items-center justify-center bg-black/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 shadow-2xl">
                <span className="relative flex h-2 w-2 md:h-3 md:w-3 mr-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-indigo-500"></span>
                </span>
                <EncryptedText
                  text={loadingStates[currentStep]?.text || "INITIALIZING"}
                  className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-white/80"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
