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

// --- GLOBAL TEXT STYLE FOR DARK BLUE CHROME EFFECT ---
const CHROME_TEXT_STYLE = {
  // Dark Blue Gradient (Light Blue -> Royal Blue -> Deep Navy)
  background: "linear-gradient(180deg, #60A5FA 0%, #2563EB 50%, #0F172A 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  // Enhanced Shimmer/Neon Effect (Deep Blue Glow)
  filter: "drop-shadow(0 0 10px rgba(29, 78, 216, 0.8))", // Blue-700 glow
  textShadow: "0 0 5px rgba(96, 165, 250, 0.3), 0 0 15px rgba(30, 64, 175, 0.5)",
};

// --- GLOBAL ASSET CONFIGURATION (Fixed to BTC) ---
const ASSETS = {
  BTC: {
    id: "BTC",
    symbol: "BINANCE:BTCUSDT", // For TradingView Chart
    name: "BITCOIN",
    sub: "BTC / USDT",
    icon: "₿",
    bgColor: "#1e3a8a", // Dark Blue
    isCrypto: true,
  },
};
type AssetKey = keyof typeof ASSETS;

// --- 1. OPTIMIZED: LIVE PRICE HOOK (THROTTLED) ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    if (assetKey === "BTC") {
      ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

      ws.onmessage = (event) => {
        const now = Date.now();
        // OPTIMIZATION: Throttle to 500ms to save CPU
        if (now - lastUpdateRef.current > 500) {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.p);
          setPrevPrice((prev) => (prev === 0 ? currentPrice : price));
          setPrice(currentPrice);
          lastUpdateRef.current = now;
        }
      };
    }

    return () => {
      if (ws) ws.close();
    };
  }, [assetKey, price]);

  return { price, prevPrice };
};

// --- 2. OPTIMIZED: MOUSE VELOCITY (PURE MOTION VALUES) ---
const useMouseVelocity = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const smoothX = useSpring(x, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 400 });

  const xVelocity = useVelocity(smoothX);
  const yVelocity = useVelocity(smoothY);

  const velocity = useTransform(
    [xVelocity, yVelocity],
    // FIX: Type explicit to prevent 'unknown' error
    ([latestX, latestY]: number[]) => Math.sqrt(latestX ** 2 + latestY ** 2)
  );

  return { x, y, velocity };
};

// --- 3. TRADINGVIEW CHART BACKGROUND (Advanced Chart) ---
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
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
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
      hide_volume: false,
      // --- DEEP BLUE BACKGROUND & GRID ---
      backgroundColor: "rgba(2, 6, 23, 1)", // Very dark slate/blue (Slate-950)
      gridLineColor: "rgba(30, 58, 138, 0.2)", // Subtle dark blue grid
      scaleFontColor: "rgba(134, 137, 147, 0)",
      // --- BLUE AND WHITE CANDLES ---
      upColor: "#2563EB", // Royal Blue for UP
      downColor: "#FFFFFF", // White for DOWN
      borderUpColor: "#2563EB",
      borderDownColor: "#FFFFFF",
      wickUpColor: "#2563EB",
      wickDownColor: "#FFFFFF",
    });
    container.appendChild(script);

    return () => {
      if (currentRef) currentRef.innerHTML = "";
    };
  }, [assetKey, asset.symbol]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Dark Blue Tint Overlay */}
      <div className="absolute inset-0 bg-blue-950/20 z-10 mix-blend-overlay" />
      {/* Increased opacity and contrast for chrome effect */}
      <div
        ref={containerRef}
        className="w-full h-full opacity-70 grayscale-[5%] contrast-125 scale-110 will-change-transform"
      />
    </div>
  );
});
TradingViewBackground.displayName = "TradingViewBackground";

// --- 4. CUSTOM "DARK BLUE CHROME" LIVE HEADER ---
const LiveChromeHeader = memo(({ assetKey }: { assetKey: AssetKey }) => {
  const asset = ASSETS[assetKey];
  const { price, prevPrice } = useLivePrice(assetKey);

  const isUp = price >= prevPrice;
  const colorClass = isUp ? "text-[#2563EB]" : "text-white";

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
      transition={{ delay: 0.2, duration: 0.6 }}
      className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-5 md:p-8 w-full max-w-[100vw]"
    >
      {/* LEFT: Asset Identity with DARK BLUE CHROME Text */}
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500/20"
            style={{ backgroundColor: asset.bgColor }}
          >
            <span className="text-sm md:text-base font-bold text-white">
              {asset.icon}
            </span>
          </div>
          <div>
            {/* THE CHROME TEXT EFFECT: Asset Name */}
            <h2
              className="text-2xl md:text-3xl font-black tracking-tighter italic leading-none"
              style={CHROME_TEXT_STYLE}
            >
              {asset.name}
            </h2>
            {/* THE CHROME TEXT EFFECT: Sub Text */}
            <span
              className="text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-100"
              style={{
                ...CHROME_TEXT_STYLE,
                filter: "drop-shadow(0 0 5px rgba(30, 58, 138, 0.6))",
                textShadow: "none",
              }}
            >
              {asset.sub}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Price with ENHANCED DARK BLUE CHROME Digits */}
      <div className="flex flex-col items-end">
        <div
          className="text-2xl md:text-3xl font-mono font-bold tracking-tight leading-none tabular-nums"
          style={CHROME_TEXT_STYLE}
        >
          {price === 0 ? "LOADING..." : priceFormatted}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {/* Status Dot: Blue vs White */}
          <span
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isUp ? "bg-[#2563EB]" : "bg-white"
            )}
          />
          <span
            className={cn(
              "text-xs md:text-sm font-mono font-medium",
              colorClass
            )}
          >
            LIVE
          </span>
        </div>
      </div>
    </motion.div>
  );
});
LiveChromeHeader.displayName = "LiveChromeHeader";

// --- 5. REACTIVE LIQUID LOGO (MOBILE OPTIMIZED) ---
const ReactiveLiquidLogo = ({ src }: { src: string }) => {
  const { x, y, velocity } = useMouseVelocity();

  // Optimization: Map velocity to distortion using pure transforms
  const targetDistortion = useTransform(velocity, [0, 1000], [0, 0.04]);
  const smoothDistortion = useSpring(targetDistortion, { stiffness: 200, damping: 25 });
  const baseFreq = useTransform(smoothDistortion, [0, 0.04], [0, 0.05]);

  // Unified handler for mouse, touch, and pointer events
  const handleMove = (
    e: React.MouseEvent | React.TouchEvent | React.PointerEvent
  ) => {
    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // @ts-ignore
      clientX = e.clientX;
      // @ts-ignore
      clientY = e.clientY;
    }
    x.set(clientX);
    y.set(clientY);
  };

  const handleReset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      // CRITICAL: touch-none prevents scroll on mobile dragging
      className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center z-50 perspective-[1000px] touch-none"
      
      // Events
      onMouseMove={handleMove}
      onMouseLeave={handleReset}
      onTouchStart={handleMove}
      onTouchMove={handleMove}
      onTouchEnd={handleReset}
      onTouchCancel={handleReset}
      onPointerMove={handleMove}
    >
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="velocity-liquid">
            <motion.feTurbulence
              type="fractalNoise"
              baseFrequency={baseFreq}
              numOctaves="2"
              result="noise"
            />
            <motion.feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="25"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <motion.div
        className="relative w-full h-full cursor-pointer will-change-transform select-none"
        // Dark Blue Drop Shadow
        style={{
          filter:
            "url(#velocity-liquid) drop-shadow(0 0 20px rgba(37, 99, 235, 0.4))",
        }}
      >
        <img
          src={src}
          alt="BullMoney Logo"
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </motion.div>
    </div>
  );
};

// --- 6. ENCRYPTED TEXT (OPTIMIZED) ---
const CHARS = "ABCDEF0123456789!@#$%^&*";

interface EncryptedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const EncryptedText = memo(({ text, className, style }: EncryptedTextProps) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let iter = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((letter, index) => {
            if (index < iter) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (iter >= text.length) clearInterval(interval);
      iter += 1 / 3;
    }, 40); // Slower update for performance
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
});
EncryptedText.displayName = "EncryptedText";

// --- 7. MAIN LOADER COMPONENT ---
export interface LoadingState {
  text: string;
}
interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading: boolean;
  duration?: number;
}

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
}: MultiStepLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const selectedAsset: AssetKey = "BTC";
  
  // *** FIX 1: Scroll Lock Logic ***
  useEffect(() => {
    if (loading) {
      document.body.classList.add("loader-active");
    } else {
      document.body.classList.remove("loader-active");
    }
    // Cleanup function to ensure the class is removed when component unmounts
    return () => {
      document.body.classList.remove("loader-active");
    };
  }, [loading]);
  // *****************************

  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }
    const totalSteps = loadingStates.length;
    const stepDuration = duration;
    
    const stepInterval = setInterval(
      () => setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev)),
      stepDuration
    );

    const updateFrequency = 30;
    const increment = 100 / ((totalSteps * stepDuration) / updateFrequency);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(prev + increment, 100);
      });
    }, updateFrequency);
    
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading, loadingStates.length, duration]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(15px)", scale: 1.05 }}
          transition={{ duration: 0.8 }}
          // Background changed to very dark slate/black to match dark blue theme
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] overflow-hidden cursor-none font-sans h-[100dvh] w-screen"
        >
          {/* A. Background Layers */}
          <GhostLoaderCursor />
          <TradingViewBackground assetKey={selectedAsset} />

          {/* Dark Blue Vignette Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.3)_0%,#020617_100%)] z-10 pointer-events-none" />

          {/* B. Header Overlay (LIVE & CUSTOM CHROME) */}
          <LiveChromeHeader assetKey={selectedAsset} />

          {/* C. Main Center Content */}
          <div className="relative z-20 flex flex-col items-center justify-center p-4 w-full h-full">
            {/* 1. LIQUID LOGO */}
            <div className="mb-4 md:mb-6 relative z-50">
              <ReactiveLiquidLogo src="/favicon.svg" />
            </div>

            {/* 2. CHROME TEXT (BULLMONEY) - UPDATED TO BLUE GRADIENTS */}
            <div className="relative text-center mb-8 md:mb-12">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-blue-100 via-blue-600 to-blue-900 drop-shadow-[0_0_30px_rgba(37,99,235,0.5)] relative z-10">
                BULLMONEY FREE
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/40 to-transparent w-full h-full skew-x-12 animate-shine opacity-50 pointer-events-none mix-blend-overlay" />
              </h1>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-blue-800 to-transparent absolute top-full left-0 right-0 opacity-20 scale-y-[-0.6] blur-[2px] pointer-events-none">
                BULLMONEY FREE
              </h1>
            </div>

            {/* 4. FOOTER: SONAR & DATA */}
            <div className="relative w-full max-w-[400px] flex flex-col items-center justify-center">
              {/* 3D Sonar Rings - Changed to Dark Blue/Indigo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] flex items-center justify-center pointer-events-none [transform:perspective(800px)_rotateX(75deg)]">
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{
                      width: "100px",
                      height: "100px",
                      opacity: 0,
                      border: "1px solid #1E40AF",
                    }}
                    animate={{
                      width: ["100px", "600px"],
                      height: ["100px", "600px"],
                      opacity: [0.5, 0],
                      borderWidth: ["3px", "0px"],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: ring * 0.6,
                      ease: "easeOut",
                    }}
                    // Blue-700/80 border, Blue-900/5 bg
                    className="absolute rounded-full border-blue-700/80 shadow-[0_0_30px_rgba(29,78,216,0.3)] bg-blue-900/5 will-change-transform"
                  />
                ))}
              </div>

              {/* Percentage Readout (Applied Dark Blue Chrome Style) */}
              <div className="relative z-30 flex flex-col items-center mb-6">
                <div
                  className="text-6xl md:text-8xl font-mono font-bold mb-2 tabular-nums tracking-tighter"
                  style={CHROME_TEXT_STYLE}
                >
                  {Math.floor(progress).toString().padStart(2, "0")}
                  <span
                    className="text-2xl md:text-3xl align-top ml-1"
                    style={{
                      ...CHROME_TEXT_STYLE,
                      filter: "none",
                      textShadow: "none",
                    }}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Status Pill (Applied Dark Blue Chrome Style) */}
              <div className="relative z-30 flex items-center justify-center bg-blue-950/60 backdrop-blur-xl px-6 py-2 md:px-8 md:py-3 rounded-full border border-blue-500/30 shadow-[0_4px_30px_rgba(29,78,216,0.2)]">
                <span className="relative flex h-2 w-2 md:h-3 md:w-3 mr-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-blue-500 shadow-[0_0_10px_#2563EB]"></span>
                </span>
                <EncryptedText
                  text={
                    loadingStates[currentStep]?.text || "INITIALIZING PROTOCOLS"
                  }
                  className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold"
                  style={CHROME_TEXT_STYLE}
                />
              </div>
            </div>
          </div>

          {/* *** FIX 2: Added Global Style for Scroll Lock *** */}
          <style jsx global>{`
            .loader-active {
              overflow: hidden !important; /* Disables all scrolling */
              height: 100vh !important; /* Locks height to viewport */
              width: 100vw !important; /* Locks width to viewport */
            }

            @keyframes shine {
              0% {
                transform: translateX(-100%) skewX(-12deg);
              }
              15%,
              100% {
                transform: translateX(200%) skewX(-12deg);
              }
            }
            .animate-shine {
              animation: shine 3.5s infinite linear;
            }
          `}</style>
          {/* ********************************************* */}
        </motion.div>
      )}
    </AnimatePresence>
  );
};