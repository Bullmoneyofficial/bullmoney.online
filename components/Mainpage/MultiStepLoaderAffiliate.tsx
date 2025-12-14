"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
  useVelocity,
  MotionValue
} from "framer-motion";
import { cn } from "@/lib/utils";
// ADJUST THIS PATH IF NEEDED:
import GhostLoaderCursor from "@/components/Mainpage/GhostCursor";

// --- CYBER BLUE-PURPLE CHROME STYLE ---
const CYBER_CHROME_STYLE = {
  background: "linear-gradient(180deg, #38BDF8 0%, #8B5CF6 50%, #4C1D95 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  filter: "drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))",
  textShadow: "0 0 5px rgba(56, 189, 248, 0.3), 0 0 15px rgba(109, 40, 217, 0.5)",
};

// --- GLOBAL ASSET CONFIGURATION ---
const ASSETS = {
  BTC: {
    id: "BTC",
    symbol: "BINANCE:BTCUSDT",
    name: "BITCOIN",
    sub: "BTC / USDT",
    icon: "₿",
    bgColor: "#312e81",
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
        // OPTIMIZATION: Only update React state every 500ms max to prevent UI thread blocking
        if (now - lastUpdateRef.current > 500) {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.p);
          
          setPrevPrice((prev) => (prev === 0 ? currentPrice : price)); // Compare against current rendered price
          setPrice(currentPrice);
          lastUpdateRef.current = now;
        }
      };
    }
    return () => {
      if (ws) ws.close();
    };
  }, [assetKey, price]); // Added price to dependency to ensure correct prevPrice logic if needed

  return { price, prevPrice };
};

// --- 2. OPTIMIZED: MOUSE VELOCITY (PURE MOTION VALUES) ---
const useMouseVelocity = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth out the mouse movement slightly before calculating velocity
  const smoothX = useSpring(x, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 400 });

  const xVelocity = useVelocity(smoothX);
  const yVelocity = useVelocity(smoothY);

  // Combine X and Y velocity into a single scalar MotionValue
  const velocity = useTransform(
    [xVelocity, yVelocity],
    // FIX: Explicitly type the incoming array as numbers
    ([latestX, latestY]: number[]) => Math.sqrt(latestX ** 2 + latestY ** 2)
  );

  return { x, y, velocity };
};

// --- 3. TRADINGVIEW CHART BACKGROUND (MEMOIZED) ---
const TradingViewBackground = memo(({ assetKey }: { assetKey: AssetKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const asset = ASSETS[assetKey];

  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;

    const widgetId = "tv_bg_" + Math.random().toString(36).substring(7);
    currentRef.innerHTML = ""; // Clear previous

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
      hide_volume: false,
      backgroundColor: "rgba(3, 7, 18, 1)",
      gridLineColor: "rgba(109, 40, 217, 0.2)",
      scaleFontColor: "rgba(134, 137, 147, 0)",
      upColor: "#38BDF8",
      downColor: "#FFFFFF",
      borderUpColor: "#38BDF8",
      borderDownColor: "#FFFFFF",
      wickUpColor: "#38BDF8",
      wickDownColor: "#FFFFFF",
    });
    
    container.appendChild(script);

    // Cleanup to prevent memory leaks
    return () => {
      if (currentRef) currentRef.innerHTML = "";
    };
  }, [asset.symbol]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[#1e0030]/20 z-10 mix-blend-overlay" />
      <div
        ref={containerRef}
        className="w-full h-full opacity-60 grayscale-[5%] contrast-125 scale-110 will-change-transform"
      />
    </div>
  );
});
TradingViewBackground.displayName = "TradingViewBackground";

// --- 4. LIVE HEADER ---
const LiveChromeHeader = memo(({ assetKey }: { assetKey: AssetKey }) => {
  const asset = ASSETS[assetKey];
  const { price, prevPrice } = useLivePrice(assetKey);

  const isUp = price >= prevPrice;
  const colorClass = isUp ? "text-[#38BDF8]" : "text-white";

  const priceFormatted = useMemo(() => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [price]);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-5 md:p-8 w-full max-w-[100vw]"
    >
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-sky-500/30"
            style={{ backgroundColor: asset.bgColor }}
          >
            <span className="text-sm md:text-base font-bold text-white">
              {asset.icon}
            </span>
          </div>
          <div>
            <h2
              className="text-2xl md:text-3xl font-black tracking-tighter italic leading-none"
              style={CYBER_CHROME_STYLE}
            >
              {asset.name}
            </h2>
            <span
              className="text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-100"
              style={{
                ...CYBER_CHROME_STYLE,
                filter: "drop-shadow(0 0 5px rgba(30, 58, 138, 0.6))",
                textShadow: "none",
              }}
            >
              {asset.sub}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div
          className="text-2xl md:text-3xl font-mono font-bold tracking-tight leading-none tabular-nums"
          style={CYBER_CHROME_STYLE}
        >
          {price === 0 ? "LOADING..." : priceFormatted}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isUp ? "bg-[#38BDF8]" : "bg-white"
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
  
  // Transform velocity directly to distortion amount
  const targetDistortion = useTransform(velocity, [0, 1000], [0, 0.04]);
  const smoothDistortion = useSpring(targetDistortion, { stiffness: 200, damping: 25 });
  const baseFreq = useTransform(smoothDistortion, [0, 0.04], [0, 0.05]);

  // Unified handler for Mouse and Touch
  const handleMove = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    let clientX, clientY;
    
    // Check if it's a touch event
    if ('touches' in e) {
       // If no touches (e.g. touchend), exit
       if (e.touches.length === 0) return; 
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       // Mouse or Pointer
       // @ts-ignore
       clientX = e.clientX;
       // @ts-ignore
       clientY = e.clientY;
    }
    
    x.set(clientX);
    y.set(clientY);
  };

  const handleReset = () => {
      // Snap distortion back to 0 when interaction ends
      x.set(0); 
      y.set(0); // Optional: Reset position if you want it to center, or leave as is
      // We rely on velocity going to 0 naturally, but we can force the spring if needed
  };

  return (
    <div
      // CRITICAL FOR MOBILE: 'touch-none' prevents the page from scrolling while dragging the logo
      className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center z-50 perspective-[1000px] touch-none"
      
      // Desktop / Mouse
      onMouseMove={handleMove}
      onMouseLeave={handleReset}
      
      // Mobile / Touch
      onTouchStart={handleMove}
      onTouchMove={handleMove}
      onTouchEnd={handleReset}     // Finger lifted
      onTouchCancel={handleReset}  // Phone call / system interruption
      
      // Modern Pointer API (Catch-all for Stylus/Hybrid)
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
        style={{
          filter: "url(#velocity-liquid) drop-shadow(0 0 25px rgba(139, 92, 246, 0.5))",
        }}
      >
        <img
          src={src}
          alt="BullMoney Logo"
          // 'select-none' prevents blue highlight box on tap in Android/iOS
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
    // Slowed down slightly (40ms) to reduce CPU load without losing effect
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
    }, 40);
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
    
    // Step Interval
    const stepInterval = setInterval(() => {
        setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
    }, stepDuration);

    // Progress Interval - Optimization: Reduce fps of counter slightly if needed
    // but 30ms is usually fine for a counter.
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
          // FIX 2: Increased Z-Index to maximum to overlay navbar
          className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#030712] overflow-hidden cursor-none font-sans h-[100dvh] w-screen"
        >
          {/* A. Background Layers */}
          <GhostLoaderCursor />
          <TradingViewBackground assetKey={selectedAsset} />

          {/* Blue-Purple Vignette Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(55,48,163,0.2)_0%,#030712_100%)] z-10 pointer-events-none" />

          {/* B. Header */}
          <LiveChromeHeader assetKey={selectedAsset} />

          {/* C. Main Content */}
          {/* FIX 3: ADDED pb-24 md:pb-32 (Pushes content up on mobile) */}
          <div className="relative z-20 flex flex-col items-center justify-center p-4 w-full h-full pb-24 md:pb-32">
            {/* 1. LIQUID LOGO */}
            <div className="mb-4 md:mb-6 relative z-50">
              <ReactiveLiquidLogo src="/favicon.svg" />
            </div>

            {/* 2. CHROME TEXT (AFFILIATE) */}
            <div className="relative text-center mb-8 md:mb-12">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-sky-100 via-violet-500 to-indigo-900 drop-shadow-[0_0_35px_rgba(139,92,246,0.6)] relative z-10">
                AFFILIATE
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-300/40 to-transparent w-full h-full skew-x-12 animate-shine opacity-60 pointer-events-none mix-blend-overlay" />
              </h1>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-indigo-900 to-transparent absolute top-full left-0 right-0 opacity-30 scale-y-[-0.6] blur-[2px] pointer-events-none">
                AFFILIATE
              </h1>
            </div>

            {/* 4. FOOTER: SONAR & DATA */}
            <div className="relative w-full max-w-[400px] flex flex-col items-center justify-center">
              {/* 3D Sonar Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] flex items-center justify-center pointer-events-none [transform:perspective(800px)_rotateX(75deg)]">
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{
                      width: "100px",
                      height: "100px",
                      opacity: 0,
                      border: "1px solid #6366F1",
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
                    className="absolute rounded-full border-indigo-600/60 shadow-[0_0_30px_rgba(109,40,217,0.4)] bg-indigo-900/5 will-change-transform"
                  />
                ))}
              </div>

              {/* Percentage Readout */}
              <div className="relative z-30 flex flex-col items-center mb-6">
                <div
                  className="text-6xl md:text-8xl font-mono font-bold mb-2 tabular-nums tracking-tighter"
                  style={CYBER_CHROME_STYLE}
                >
                  {Math.floor(progress).toString().padStart(2, "0")}
                  <span
                    className="text-2xl md:text-3xl align-top ml-1"
                    style={{
                      ...CYBER_CHROME_STYLE,
                      filter: "none",
                      textShadow: "none",
                    }}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="relative z-30 flex items-center justify-center bg-indigo-950/60 backdrop-blur-xl px-6 py-2 md:px-8 md:py-3 rounded-full border border-sky-500/30 shadow-[0_4px_30px_rgba(109,40,217,0.3)]">
                <span className="relative flex h-2 w-2 md:h-3 md:w-3 mr-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-violet-600 shadow-[0_0_10px_#8B5CF6]"></span>
                </span>
                <EncryptedText
                  text={
                    loadingStates[currentStep]?.text ||
                    "INITIALIZING AFFILIATE PROTOCOLS"
                  }
                  className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold"
                  style={CYBER_CHROME_STYLE}
                />
              </div>
            </div>
          </div>

          <style jsx global>{`
            /* *** FIX 2: Global Style for Scroll Lock *** */
            .loader-active {
              overflow: hidden !important; /* Disables all scrolling */
              height: 100vh !important; /* Locks height to viewport */
              width: 100vw !important; /* Locks width to viewport */
            }
            /* ****************************************** */
            
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};