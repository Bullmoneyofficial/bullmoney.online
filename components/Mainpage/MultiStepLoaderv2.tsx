"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, Zap, TrendingUp, Sparkles } from "lucide-react";

// --- UTILS ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

// --- CONFIG ---
const ASSETS = {
  BTC: { id: "BTC", symbol: "BINANCE:BTCUSDT", icon: "₿", color: "#F7931A" },
  ETH: { id: "ETH", symbol: "BINANCE:ETHUSDT", icon: "Ξ", color: "#627EEA" },
  SOL: { id: "SOL", symbol: "BINANCE:SOLUSDT", icon: "◎", color: "#14F195" },
};
type AssetKey = keyof typeof ASSETS;

type LoaderProps = {
  onFinished?: () => void;
  theme?: unknown;
};

// --- ANIMATED BORDER ---
const MovingBorder = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className="relative p-[2px] overflow-hidden rounded-3xl group">
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-200%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#3b82f6_50%,transparent_100%)]"
        style={{ willChange: "transform" }}
      />
      <div className={cn("relative h-full w-full bg-slate-950 rounded-3xl", className)}>
        {children}
      </div>
    </div>
  );
};

// --- LIVE PRICE HOOK ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const symbolParts = ASSETS[assetKey].symbol.split(":");
      const symbol = symbolParts[1]?.toLowerCase();
      if (!symbol) return;
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 100) {
          const data = JSON.parse(event.data);
          setPrice(parseFloat(data.p));
          lastUpdateRef.current = now;
        }
      };
    } catch (e) {
      console.error(e);
    }
    return () => {
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
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = AudioContext ? new AudioContext() : null;
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

// --- PARTICLES ---
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// --- MAIN COMPONENT ---
export default function EnhancedQuickGate({ onFinished }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showTip, setShowTip] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const { price: realPrice } = useLivePrice(selectedAsset);
  const [displayPrice, setDisplayPrice] = useState(0);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const glow = useMotionValue(0);
  const glowSpring = useSpring(glow, { stiffness: 200, damping: 25 });
  
  const requestRef = useRef<number>();
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFinishedRef = useRef(false);
  const basePriceRef = useRef(0);
  const particleIdRef = useRef(0);

  const { startEngine, updateEngine, stopEngine, playSuccess } = useAudioEngine();

  useEffect(() => {
    if (!isHolding && realPrice > 0) {
      basePriceRef.current = realPrice;
      setDisplayPrice(realPrice);
    }
  }, [realPrice, isHolding]);

  useEffect(() => {
    if (isCompleted) return;

    if (isHolding) {
      startEngine();
      setShowTip(false);
    } else {
      stopEngine();
    }

    return () => stopEngine();
  }, [isHolding, isCompleted]);

  const finishLoader = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setGateVisible(false);
    onFinished?.();
  }, [onFinished]);

  const createParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 2,
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
        // Faster progression - completes in ~2 seconds of holding
        const boost = prev > 70 ? 4.5 : prev > 40 ? 3.5 : 2.5;
        next = Math.min(prev + boost, 100);

        updateEngine(next);

        // Scale effect
        scale.set(1 + (next / 100) * 0.15);
        glow.set(next / 100);

        // Shake effect
        const shakeAmount = (next / 100) * 6;
        shakeX.set((Math.random() - 0.5) * shakeAmount);
        shakeY.set((Math.random() - 0.5) * shakeAmount);

        // Price pump effect
        const pumpMultiplier = Math.pow(next * 0.01, 2.5) * 5000;
        setDisplayPrice(basePriceRef.current + pumpMultiplier);

        // Haptic feedback
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          if (next > 80 && Math.random() < 0.4) navigator.vibrate(10);
        }
      } else {
        shakeX.set(0);
        shakeY.set(0);
        scale.set(1);
        glow.set(0);
        next = Math.max(prev - 8, 0);
        if (basePriceRef.current > 0) setDisplayPrice(basePriceRef.current);
      }

      if (next >= 100 && !isCompleted) {
        setIsCompleted(true);
        stopEngine();
        playSuccess();
        scale.set(1.2);

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        completionTimeoutRef.current = setTimeout(finishLoader, 800);
        return 100;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [finishLoader, isCompleted, isHolding, playSuccess, scale, shakeX, shakeY, stopEngine, updateEngine, glow]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, []);

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
          }))
          .filter((p) => p.y < 400)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  // Tip animation
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted) return;
    
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

  const glowColor = useTransform(glowSpring, [0, 1], ["rgba(59, 130, 246, 0)", "rgba(59, 130, 246, 0.6)"]);

  return (
    <>
      <AnimatePresence>
        {gateVisible && (
          <motion.div
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white overflow-hidden"
          >
            {/* Animated Background Grid */}
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
                className="w-full h-full"
                style={{
                  backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
                  backgroundSize: "50px 50px",
                }}
              />
            </div>

            {/* Radial Gradient Glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${glowColor.get()}, transparent 70%)`,
              }}
            />

            {/* Asset Selector */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-6 md:top-8 z-50 flex gap-2"
            >
              {Object.entries(ASSETS).map(([key, asset]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAsset(key as AssetKey)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold border-2 transition-all backdrop-blur-sm",
                    key === selectedAsset
                      ? "bg-blue-500/30 text-white border-blue-400 shadow-lg shadow-blue-500/50"
                      : "text-slate-400 border-slate-700 hover:border-slate-600"
                  )}
                >
                  <span className="mr-1">{asset.icon}</span>
                  {asset.id}
                </motion.button>
              ))}
            </motion.div>

            {/* Main Content */}
            <motion.div
              style={{ x: shakeX, y: shakeY, scale }}
              className="relative z-30 flex flex-col items-center gap-6 w-full max-w-lg px-6"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <motion.div
                  animate={{
                    boxShadow: isHolding
                      ? "0 0 60px rgba(59, 130, 246, 0.8), 0 0 120px rgba(59, 130, 246, 0.4)"
                      : "0 0 30px rgba(59, 130, 246, 0.5)",
                  }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-4xl font-bold"
                >
                  {ASSETS[selectedAsset].icon}
                </motion.div>
                {isHolding && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-4 border-blue-400"
                  />
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
                  }}
                  className="text-4xl md:text-6xl font-black tracking-tighter font-mono"
                  style={{
                    textShadow: isHolding ? "0 0 20px rgba(59, 130, 246, 0.8)" : "none",
                  }}
                >
                  ${(displayPrice || realPrice).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                        <Image src="/BULL.svg" alt="BullMoney logo" width={20} height={20} className="rounded-full" />
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

              {/* Interactive Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative w-full max-w-md h-24 cursor-pointer select-none"
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onTouchCancel={handleInteractionEnd}
              >
                <MovingBorder>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="relative h-full w-full flex items-center justify-center overflow-hidden"
                  >
                    {/* Progress Fill */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500"
                      style={{
                        transformOrigin: "left",
                        transform: `scaleX(${progress / 100})`,
                      }}
                    />

                    {/* Shimmer Effect */}
                    {isHolding && (
                      <motion.div
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ width: "50%" }}
                      />
                    )}

                    {/* Button Content */}
                    <div className="relative z-10 flex items-center gap-3">
                      <motion.span
                        animate={{
                          scale: isHolding ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: isHolding ? Infinity : 0,
                        }}
                        className="text-2xl md:text-3xl font-black tracking-tighter"
                        style={{
                          color: progress > 50 ? "#000000" : "#ffffff",
                          textShadow: progress > 50 ? "none" : "0 2px 10px rgba(0,0,0,0.5)",
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
                            color: progress > 50 ? "#000000" : "#ffffff",
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-2 left-4 right-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                </MovingBorder>

                {/* Particles */}
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute pointer-events-none"
                    style={{
                      left: p.x,
                      top: p.y,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Helper Tip */}
              <AnimatePresence>
                {showTip && progress === 0 && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700"
                  >
                    <Zap className="w-3 h-3 text-yellow-400" />
                    Hold the button to access the website
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Completion Effect */}
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: [0, 1, 0] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Content After Gate */}
      <AnimatePresence>
        {!gateVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8"
          >
            <div className="text-center text-white flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-xl"
              >
                <Image src="/BULL.svg" alt="BullMoney logo" width={80} height={80} priority className="drop-shadow-lg" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-black"
              >
                Welcome to BullMoney
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-300"
              >
                You've successfully accessed the site
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
