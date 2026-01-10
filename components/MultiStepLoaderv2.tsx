"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import { ArrowUpRight, Zap, TrendingUp, Sparkles } from "lucide-react";

// --- TYPES ---
type AssetKey = "BTC" | "ETH" | "SOL";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LoaderProps {
  onFinished?: () => void;
}

// --- UTILS ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

// --- CONFIG ---
const ASSETS: Record<AssetKey, { id: string; symbol: string; icon: string; color: string }> = {
  BTC: { id: "BTC", symbol: "BINANCE:BTCUSDT", icon: "₿", color: "#F7931A" },
  ETH: { id: "ETH", symbol: "BINANCE:ETHUSDT", icon: "Ξ", color: "#627EEA" },
  SOL: { id: "SOL", symbol: "BINANCE:SOLUSDT", icon: "◎", color: "#14F195" },
};

// --- LIVE PRICE HOOK ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const lastPriceRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const controller = new AbortController();
    let pollId: ReturnType<typeof setInterval> | null = null;
    
    try {
      const symbolParts = ASSETS[assetKey].symbol.split(":");
      const symbol = symbolParts[1]?.toLowerCase();
      const symbolUpper = symbolParts[1]?.toUpperCase();
      if (!symbol || !symbolUpper) return;

      const fetchTicker = async () => {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbolUpper}`, { signal: controller.signal });
          if (!res.ok) return;
          const data = await res.json();
          const p = parseFloat(data.price);
          if (!Number.isNaN(p)) {
            lastPriceRef.current = p;
            setPrice(p);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            console.error("Initial price fetch failed", err);
          }
        }
      };

      fetchTicker();
      pollId = setInterval(fetchTicker, 2000);

      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 100) {
          const data = JSON.parse(event.data);
          const nextPrice = parseFloat(data.p);
          if (!Number.isNaN(nextPrice)) {
            lastPriceRef.current = nextPrice;
            setPrice(nextPrice);
            lastUpdateRef.current = now;
          }
        }
      };
    } catch (e) {
      console.error(e);
    }
    
    return () => {
      controller.abort();
      if (pollId) clearInterval(pollId);
      if (ws) ws.close();
    };
  }, [assetKey]);

  return { price };
};

// --- AUDIO ENGINE ---
const useAudioEngine = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = AudioContextClass ? new AudioContextClass() : null;
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  };

  const startEngine = () => {
    const ctx = initAudio();
    if (!ctx) return;

    if (!oscillatorRef.current) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.value = 1200;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
    }
  };

  const updateEngine = (progress: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !oscillatorRef.current || !gainNodeRef.current) return;

    const baseFreq = 120;
    const addedFreq = (progress / 100) * 380;
    const now = ctx.currentTime;

    oscillatorRef.current.frequency.setTargetAtTime(baseFreq + addedFreq, now, 0.08);

    if (progress > 70) {
      gainNodeRef.current.gain.setTargetAtTime(0.08 + Math.random() * 0.04, now, 0.1);
    }
  };

  const stopEngine = () => {
    const ctx = audioCtxRef.current;
    const gainNode = gainNodeRef.current;
    if (gainNode && ctx) {
      const now = ctx.currentTime;
      gainNode.gain.setTargetAtTime(0, now, 0.15);

      setTimeout(() => {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
        }
      }, 200);
    }
  };

  const playSuccess = () => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.4);
  };

  return { startEngine, updateEngine, stopEngine, playSuccess };
};

// --- MAIN COMPONENT ---
export default function EnhancedQuickGate({ onFinished }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showTip, setShowTip] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const { price: realPrice } = useLivePrice(selectedAsset);
  const [displayPrice, setDisplayPrice] = useState(0);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const iconRotate = useMotionValue(0);
  
  const requestRef = useRef<number>();
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFinishedRef = useRef(false);
  const particleIdRef = useRef(0);
  const isCompletingRef = useRef(false);

  const { startEngine, updateEngine, stopEngine, playSuccess } = useAudioEngine();

  useEffect(() => {
    if (realPrice > 0) {
      setDisplayPrice(realPrice);
    }
  }, [realPrice]);

  useEffect(() => {
    if (isCompleted) return;

    if (isHolding) {
      startEngine();
      setShowTip(false);
    } else {
      stopEngine();
    }

    return () => stopEngine();
  }, [isHolding, isCompleted, startEngine, stopEngine]);

  const finishLoader = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setShowContent(true);
    onFinished?.();
  }, [onFinished]);

  const createParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4 - 3,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const animate = useCallback(() => {
    if (isCompleted) {
      shakeX.set(0);
      shakeY.set(0);
      return;
    }

    setProgress((prev) => {
      let next = prev;

      if (isHolding) {
        // Only increment if we haven't completed yet
        if (!isCompletingRef.current) {
          const boost = prev > 70 ? 4.5 : prev > 40 ? 3.5 : 2.5;
          next = Math.min(prev + boost, 100);

          updateEngine(next);

          scale.set(1 + (next / 100) * 0.2);
          iconRotate.set((next / 100) * 360);

          const shakeAmount = (next / 100) * 8;
          shakeX.set((Math.random() - 0.5) * shakeAmount);
          shakeY.set((Math.random() - 0.5) * shakeAmount);

          if (typeof navigator !== "undefined" && navigator.vibrate) {
            if (next > 80 && Math.random() < 0.4) navigator.vibrate(10);
          }

          // CRITICAL: Only trigger completion when EXACTLY at 100 AND still holding
          if (next >= 100 && isHolding) {
            isCompletingRef.current = true;
            setIsCompleted(true);
            stopEngine();
            playSuccess();
            scale.set(1.3);

            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }

            completionTimeoutRef.current = setTimeout(() => {
              setGateVisible(false);
              setTimeout(finishLoader, 300);
            }, 800);
            return 100;
          }
        } else {
          // Already completing, maintain at 100
          return 100;
        }
      } else {
        // Not holding - drain progress and reset completion flag
        shakeX.set(0);
        shakeY.set(0);
        scale.set(1);
        iconRotate.set(0);
        
        // Drain progress aggressively
        next = Math.max(prev - 12, 0);
        
        // Reset completion flag if we drop below 100
        if (next < 100) {
          isCompletingRef.current = false;
        }
      }
      
      return next;
    });

    if (!isCompleted) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [finishLoader, isCompleted, isHolding, playSuccess, scale, shakeX, shakeY, stopEngine, updateEngine, iconRotate]);

  useEffect(() => {
    if (!isCompleted) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate, isCompleted]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3,
          }))
          .filter((p) => p.y < 500)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted) return;
    
    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-no-hold]")) {
      return;
    }

    setIsHolding(true);
    
    let x = 0, y = 0;
    if ('touches' in e) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    createParticles(x, y);
  };

  const handleInteractionEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    setIsHolding(false);
  };

  return (
    <>
      <AnimatePresence>
        {gateVisible && (
          <motion.div
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
            style={{ isolation: 'isolate' }}
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd}
          >
            {/* Trading Chart Background */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <motion.div
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-full h-full absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)`,
                  backgroundSize: "50px 50px",
                }}
              />
            </div>

            {/* Trading Ticker Tape */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900/80 backdrop-blur-sm border-b border-blue-500/20 overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "0%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex items-center h-full gap-8 whitespace-nowrap text-xs font-mono"
              >
                {[...Array(3)].map((_, i) => (
                  <React.Fragment key={i}>
                    <span className="text-green-400">BTC/USD +2.45%</span>
                    <span className="text-red-400">ETH/USD -1.23%</span>
                    <span className="text-green-400">SOL/USD +5.67%</span>
                    <span className="text-green-400">BNB/USD +3.21%</span>
                    <span className="text-red-400">ADA/USD -0.89%</span>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>

            {/* Radial Gradient Glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.1) 40%, transparent 70%)`,
              }}
              animate={{
                opacity: isHolding ? 1 : 0.5,
                scale: isHolding ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Floating Trading Indicators */}
            <motion.div
              className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-green-500/5 blur-3xl pointer-events-none"
              animate={{
                x: [0, 80, 0],
                y: [0, -40, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"
              animate={{
                x: [0, -60, 0],
                y: [0, 50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Asset Selector */}
            <div className="fixed top-0 left-0 right-0 z-[100000] pointer-events-none flex justify-center pt-6 md:pt-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 pointer-events-auto"
                data-no-hold
              >
                {Object.entries(ASSETS).map(([key, asset]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAsset(key as AssetKey);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedAsset(key as AssetKey);
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-black border-2 transition-all backdrop-blur-md min-w-[52px] min-h-[52px] flex items-center gap-1.5 shadow-lg relative overflow-hidden",
                      key === selectedAsset
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-blue-300 shadow-blue-500/50"
                        : "bg-slate-800/80 text-slate-300 border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/80"
                    )}
                    style={{
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {key === selectedAsset && (
                      <motion.div
                        layoutId="activeAsset"
                        className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="text-lg relative z-10">{asset.icon}</span>
                    <span className="relative z-10">{asset.id}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Main Content */}
            <motion.div
              style={{ x: shakeX, y: shakeY, scale }}
              className="relative z-30 flex flex-col items-center gap-6 w-full max-w-lg px-6 pb-16"
            >
              {/* Holdable Asset Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative select-none"
              >
                {/* Progress Ring */}
                <svg className="absolute inset-[-16px] w-[128px] h-[128px] -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * progress) / 100}
                    style={{
                      filter: isHolding ? "drop-shadow(0 0 8px rgba(59,130,246,0.8))" : "none",
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                <motion.div
                  animate={{
                    boxShadow: isHolding
                      ? "0 0 60px rgba(59, 130, 246, 0.8), 0 0 120px rgba(59, 130, 246, 0.4)"
                      : "0 0 40px rgba(59, 130, 246, 0.6)",
                  }}
                  style={{ rotate: iconRotate }}
                  className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-5xl font-bold"
                >
                  {ASSETS[selectedAsset].icon}
                </motion.div>
                
                {/* Pulse Rings */}
                {isHolding && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-[-8px] rounded-full border-4 border-blue-400"
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="absolute inset-[-12px] rounded-full border-4 border-cyan-400"
                    />
                  </>
                )}
              </motion.div>

              {/* Price Display */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center w-full"
              >
                <motion.div
                  animate={{
                    color: isHolding ? "#60a5fa" : "#ffffff",
                    scale: isHolding ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    scale: { duration: 0.5, repeat: isHolding ? Infinity : 0 }
                  }}
                  className="text-4xl md:text-6xl font-black tracking-tighter font-mono"
                  style={{
                    textShadow: isHolding ? "0 0 30px rgba(59, 130, 246, 1)" : "0 2px 20px rgba(0,0,0,0.8)",
                  }}
                >
                  {displayPrice > 0 || realPrice > 0
                    ? `$${(displayPrice > 0 ? displayPrice : realPrice).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "--"}
                </motion.div>

                {/* Status Text */}
                <div className="h-8 mt-2 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="completed"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 20 }}
                        className="text-sm font-bold text-green-400 flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        ACCESS GRANTED
                      </motion.div>
                    ) : isHolding ? (
                      <motion.div
                        key="holding"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="text-xs font-bold text-blue-400 flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                        PUMPING...
                      </motion.div>
                    ) : progress > 0 ? (
                      <motion.div
                        key="releasing"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="text-xs font-medium text-slate-400"
                      >
                        Keep holding!
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Progress Display */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-md flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 text-2xl md:text-3xl font-black tracking-tighter">
                  <motion.span
                    animate={{
                      scale: isHolding ? [1, 1.08, 1] : 1,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: isHolding ? Infinity : 0,
                    }}
                    style={{
                      color: progress > 50 ? "#60a5fa" : "#ffffff",
                      textShadow: progress > 50 ? "0 0 20px rgba(59,130,246,0.7)" : "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {progress === 0 ? "HOLD TO ENTER" : progress >= 100 ? "LAUNCHING" : `${Math.floor(progress)}%`}
                  </motion.span>
                  <motion.div
                    animate={{
                      rotate: isHolding ? 360 : 0,
                      x: isHolding ? 5 : 0,
                      y: isHolding ? -5 : 0,
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    }}
                  >
                    <ArrowUpRight
                      className="w-7 h-7"
                      style={{
                        color: progress > 50 ? "#60a5fa" : "#ffffff",
                      }}
                    />
                  </motion.div>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 relative"
                    style={{ width: `${progress}%` }}
                  >
                    {isHolding && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Particles */}
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: p.x,
                    top: p.y,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </motion.div>
              ))}

              {/* Helper Tip */}
              <AnimatePresence>
                {showTip && progress === 0 && (
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    className="pointer-events-none mt-6 flex items-center gap-2 text-xs text-white/95 bg-gradient-to-r from-blue-500/90 via-cyan-400/90 to-blue-600/90 px-5 py-2.5 rounded-full border border-white/40 shadow-[0_0_30px_rgba(59,130,246,0.9)] backdrop-blur-sm"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-200 drop-shadow" />
                    Press and hold anywhere until 100% to access the website
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Completion Effect */}
            {isCompleted && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 3, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 0] }}
                  transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                  className="absolute w-full h-full flex items-center justify-center pointer-events-none"
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: Math.cos((i / 12) * Math.PI * 2) * 150,
                        y: Math.sin((i / 12) * Math.PI * 2) * 150,
                      }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="absolute w-3 h-3 bg-blue-400 rounded-full"
                    />
                  ))}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Content After Gate */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8"
          >
            <div className="text-center text-white flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/30 flex items-center justify-center shadow-2xl shadow-blue-500/50"
              >
                <Sparkles className="w-20 h-20 text-blue-400" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
              >
                Welcome to BullMoney
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-slate-300 max-w-md"
              >
                You&apos;ve successfully accessed the site. Your {ASSETS[selectedAsset].id} is ready to pump!
              </motion.p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="mt-4 flex gap-2"
              >
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm font-bold text-blue-300">
                  {ASSETS[selectedAsset].icon} {ASSETS[selectedAsset].id}
                </div>
                <div className="px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full text-sm font-bold text-green-300">
                  ✓ Connected
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}