"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { 
  TrendingUp, 
  Coins, 
  Zap, 
  Activity, 
  BarChart3,
  Target,
  Gauge,
  Sparkles,
  Radio,
  DollarSign,
  Flame,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONFIG ---
const ASSETS = {
  BTC: { 
    id: "BTC", 
    symbol: "BINANCE:BTCUSDT", 
    name: "BITCOIN", 
    icon: "₿", 
    color: "#3b82f6",
    gradient: "from-blue-500 via-cyan-400 to-blue-600"
  },
  ETH: { 
    id: "ETH", 
    symbol: "BINANCE:ETHUSDT", 
    name: "ETHEREUM", 
    icon: "Ξ", 
    color: "#06b6d4",
    gradient: "from-cyan-500 via-blue-400 to-cyan-600"
  },
  XRP: { 
    id: "XRP", 
    symbol: "BINANCE:XRPUSDT", 
    name: "RIPPLE", 
    icon: "✕", 
    color: "#0ea5e9",
    gradient: "from-sky-500 via-blue-400 to-sky-600"
  },
  SOL: {
    id: "SOL",
    symbol: "BINANCE:SOLUSDT",
    name: "SOLANA",
    icon: "◎",
    color: "#14b8a6",
    gradient: "from-teal-500 via-cyan-400 to-teal-600"
  }
};

type AssetKey = keyof typeof ASSETS;

// Market phases
type MarketPhase = "accumulation" | "markup" | "distribution" | "markdown";

interface MarketState {
  phase: MarketPhase;
  volatility: number;
  momentum: number;
  volume: number;
}

// --- PARTICLE SYSTEM ---
const Particle = ({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) => {
  const randomAngle = Math.random() * Math.PI * 2;
  const randomDistance = 50 + Math.random() * 100;
  const endX = x + Math.cos(randomAngle) * randomDistance;
  const endY = y + Math.sin(randomAngle) * randomDistance;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}`,
      }}
      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      animate={{
        opacity: 0,
        scale: 0,
        x: endX - x,
        y: endY - y,
      }}
      transition={{
        duration: 1 + Math.random() * 0.5,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
};

const ParticleExplosion = ({ active, color = "#3b82f6" }: { active: boolean; color?: string }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return undefined;
    const container = containerRef.current;

    const interval = setInterval(() => {
      const rect = container.getBoundingClientRect();
      const newParticles = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        delay: Math.random() * 0.2,
      }));
      setParticles(prev => [...prev.slice(-20), ...newParticles]);
    }, 200);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} color={color} delay={p.delay} />
      ))}
    </div>
  );
};

// --- COMPONENT: ANIMATED BORDER ---
const AnimatedBorder = ({ 
  children, 
  className = "",
  glowColor = "#3b82f6"
}: { 
  children: React.ReactNode, 
  className?: string,
  glowColor?: string
}) => {
  return (
    <div className={cn("relative p-[2px] overflow-hidden rounded-3xl", className)}>
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-200%] opacity-80"
        style={{
          background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, ${glowColor} 50%, transparent 100%)`
        }}
      />
      <div className="relative h-full w-full bg-[#0a0a0a] rounded-3xl overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// --- AUDIO ENGINE ---
const useAudioEngine = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playTick = (frequency: number = 800, duration: number = 0.05) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + duration);
  };

  const playSuccess = () => {
    initAudio();
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;

    // Triple chord success sound
    [800, 1000, 1200].forEach((freq, i) => {
      const osc = audioCtxRef.current!.createOscillator();
      const gain = audioCtxRef.current!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(audioCtxRef.current!.destination);
      
      osc.start(now + i * 0.05);
      osc.stop(now + 0.6);
    });
  };

  const playAlert = () => {
    initAudio();
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(400, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + 0.3);
  };

  return { playTick, playSuccess, playAlert };
};

// --- HOOKS ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [change24h, setChange24h] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const lastPriceRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const controller = new AbortController();
    let pollId: ReturnType<typeof setInterval> | null = null;
    lastPriceRef.current = 0;
    lastUpdateRef.current = 0;

    const symbolParts = ASSETS[assetKey].symbol.split(":");
    const symbol = symbolParts[1]?.toLowerCase();
    const symbolUpper = symbolParts[1]?.toUpperCase();
    if (!symbol || !symbolUpper) return;

    const applyPrice = (currentPrice: number) => {
      if (!Number.isFinite(currentPrice)) return;
      const prev = lastPriceRef.current || currentPrice;
      setPrevPrice(prev);
      setPrice(currentPrice);
      lastPriceRef.current = currentPrice;
      lastUpdateRef.current = Date.now();
    };

    const fetchTicker = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbolUpper}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const currentPrice = parseFloat(data.lastPrice ?? data.price);
        const changePct = parseFloat(data.priceChangePercent ?? data.priceChange24h ?? data.priceChange ?? "0");
        applyPrice(currentPrice);
        if (Number.isFinite(changePct)) setChange24h(changePct);
      } catch (err) {
        if (!controller.signal.aborted) console.error("Initial price fetch failed", err);
      }
    };

    fetchTicker();
    pollId = setInterval(fetchTicker, 2000);

    try {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 100) {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.p);
          applyPrice(currentPrice);
        }
      };
    } catch (e) {
      console.error("WS Error", e);
    }
    
    return () => { 
      controller.abort();
      if (pollId) clearInterval(pollId);
      if (ws) ws.close(); 
    };
  }, [assetKey]);

  return { price, prevPrice, change24h };
};

const useMarketState = (price: number, prevPrice: number): MarketState => {
  const [state, setState] = useState<MarketState>({
    phase: "accumulation",
    volatility: 0,
    momentum: 0,
    volume: 0
  });

  const priceHistoryRef = useRef<number[]>([]);
  const volatilityWindowRef = useRef<number[]>([]);

  useEffect(() => {
    if (price === 0) return;

    priceHistoryRef.current.push(price);
    if (priceHistoryRef.current.length > 50) {
      priceHistoryRef.current.shift();
    }

    const priceDiff = price - prevPrice;
    volatilityWindowRef.current.push(Math.abs(priceDiff));
    if (volatilityWindowRef.current.length > 20) {
      volatilityWindowRef.current.shift();
    }

    const avgVolatility = volatilityWindowRef.current.reduce((a, b) => a + b, 0) / volatilityWindowRef.current.length;
    const momentum = priceHistoryRef.current.length > 10
      ? ((price - (priceHistoryRef.current[priceHistoryRef.current.length - 10] ?? price)) / price) * 100
      : 0;

    let phase: MarketPhase = "accumulation";
    if (momentum > 0.1) phase = "markup";
    else if (momentum < -0.1) phase = "markdown";
    else if (avgVolatility > price * 0.0001) phase = "distribution";

    setState({
      phase,
      volatility: Math.min(avgVolatility / (price * 0.0001) * 100, 100),
      momentum: Math.max(-100, Math.min(100, momentum * 10)),
      volume: Math.random() * 100 // Simulated volume activity
    });
  }, [price, prevPrice]);

  return state;
};

// --- TRADINGVIEW WIDGET ---
const TradingViewWidget = ({ 
  assetKey, 
  id,
  minimal = false 
}: { 
  assetKey: AssetKey; 
  id: string;
  minimal?: boolean;
}) => {
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
    
    const config = {
      autosize: true,
      symbol: ASSETS[assetKey].symbol,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: true,
      hide_legend: minimal,
      save_image: false,
      hide_volume: minimal,
      backgroundColor: "rgba(10, 10, 10, 1)",
      gridLineColor: minimal ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
      scaleFontColor: minimal ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.5)",
    };

    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);
  }, [assetKey, id, minimal]);

  return <div ref={containerRef} className="w-full h-full" />;
};

// --- REACTIVE LOGO ---
const ReactiveLogo = ({ isActive }: { isActive: boolean }) => {
  const { x, y } = { x: useMotionValue(0), y: useMotionValue(0) };
  const smoothX = useSpring(x, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(smoothY, [-300, 300], [15, -15]);
  const rotateY = useTransform(smoothX, [-300, 300], [-15, 15]);

  return (
    <motion.div 
      className="relative w-32 h-32 flex items-center justify-center cursor-pointer"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      animate={isActive ? {
        scale: [1, 1.1, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4), transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={{
          scale: isActive ? [1, 1.5, 1] : 1,
          opacity: isActive ? [0.5, 0.8, 0.5] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <img 
        src="/favicon.svg" 
        alt="BullMoney" 
        className="w-full h-full object-contain relative z-10"
        style={{
          filter: "drop-shadow(0 0 30px rgba(59, 130, 246, 0.8))",
          transform: "translateZ(50px)",
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = 'w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center';
            fallback.innerHTML = '<svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/></svg>';
            parent.appendChild(fallback);
          }
        }}
      />
    </motion.div>
  );
};

// --- ACHIEVEMENT NOTIFICATION ---
const AchievementNotification = ({ achievement }: { achievement: { id: string; title: string; timestamp: number } }) => {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="relative mb-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 border border-blue-400/50 shadow-lg shadow-blue-500/50 backdrop-blur-xl max-w-[90vw] sm:max-w-xs"
    >
      <motion.div
        className="text-xs sm:text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 0.3,
          repeat: 2,
        }}
      >
        {achievement.title}
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3, ease: "linear" }}
        style={{ transformOrigin: "left" }}
      />
    </motion.div>
  );
};

// --- COMBO DISPLAY ---
const ComboDisplay = ({ combo, maxCombo }: { combo: number; maxCombo: number }) => {
  if (combo === 0) return null;

  const getComboColor = (c: number) => {
    if (c >= 50) return "from-purple-500 via-pink-500 to-red-500";
    if (c >= 30) return "from-orange-500 via-red-500 to-pink-500";
    if (c >= 15) return "from-yellow-500 via-orange-500 to-red-500";
    return "from-blue-500 via-cyan-500 to-blue-600";
  };

  const getComboText = (c: number) => {
    if (c >= 50) return "LEGENDARY!!!";
    if (c >= 30) return "GODLIKE!!";
    if (c >= 15) return "DOMINATING!";
    if (c >= 10) return "ON FIRE!";
    return "COMBO!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      className="absolute top-16 sm:top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 px-4"
    >
      <motion.div
        className="relative px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-black/80 border-2 backdrop-blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          borderColor: ["#3b82f6", "#60a5fa", "#3b82f6"],
        }}
        transition={{
          scale: { duration: 0.3, repeat: Infinity },
          borderColor: { duration: 1, repeat: Infinity },
        }}
      >
        <motion.div
          className={cn(
            "text-3xl sm:text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r",
            getComboColor(combo)
          )}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
          }}
        >
          {combo}x
        </motion.div>
        <motion.div
          className="text-[10px] sm:text-xs md:text-sm font-bold text-white uppercase tracking-wider text-center"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        >
          {getComboText(combo)}
        </motion.div>
        {maxCombo > combo && (
          <div className="text-[9px] sm:text-[10px] text-slate-400 text-center mt-1">
            Best: {maxCombo}x
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// --- MARKET INDICATOR ---
const MarketIndicator = ({ label, value, icon: Icon, trend, isActive }: { 
  label: string; 
  value: string | number; 
  icon: any;
  trend?: "up" | "down" | "neutral";
  isActive?: boolean;
}) => {
  const trendColor = trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-blue-400";
  
  return (
    <motion.div 
      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: isActive ? [0, -1, 1, -1, 0] : 0,
        scale: isActive ? [1, 1.02, 1] : 1,
      }}
      transition={{ 
        duration: 0.3,
        x: { repeat: Infinity, duration: 0.15 },
        scale: { repeat: Infinity, duration: 0.5 },
      }}
    >
      <motion.div 
        className={cn("p-1.5 sm:p-2 rounded-lg bg-white/10", trendColor)}
        animate={isActive ? {
          rotate: [0, -5, 5, -5, 0],
        } : {}}
        transition={{
          duration: 0.3,
          repeat: Infinity,
        }}
      >
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate">{label}</div>
        <motion.div 
          className={cn("text-xs sm:text-sm font-bold tabular-nums truncate", trendColor)}
          animate={isActive ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 0.2,
            repeat: Infinity,
          }}
        >
          {value}
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- PRICE TARGET SYSTEM ---
const PriceTargetSystem = ({
  currentPrice,
  targetPrice,
  progress,
  assetKey,
  isActive,
  change24h,
  volatility,
  momentum,
}: {
  currentPrice: number;
  targetPrice: number;
  progress: number;
  assetKey: AssetKey;
  isActive?: boolean;
  change24h: number;
  volatility: number;
  momentum: number;
}) => {
  const distance = currentPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
  const asset = ASSETS[assetKey];

  return (
    <AnimatedBorder glowColor={asset.color} className="w-full">
      <motion.div 
        className="p-4 sm:p-6 space-y-3 sm:space-y-4"
        animate={isActive ? {
          x: [0, -2, 2, -2, 0],
          y: [0, -1, 1, -1, 0],
        } : {}}
        transition={{
          duration: 0.2,
          repeat: Infinity,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isActive ? {
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </motion.div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Price Target
            </span>
          </div>
          <motion.div 
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30"
            animate={isActive ? {
              scale: [1, 1.05, 1],
              borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.6)", "rgba(59, 130, 246, 0.3)"],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          >
            <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-bold text-blue-400">ACTIVE</span>
          </motion.div>
        </div>

        {/* Compact market stats */}
        <div className="flex flex-wrap gap-2 mt-2">
          <motion.div
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-slate-200"
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span>{`${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}% 24h`}</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-slate-200"
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.35, repeat: Infinity, delay: 0.1 }}
          >
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>{`${volatility.toFixed(0)}% Volatility`}</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-slate-200"
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
          >
            <BarChart3 className="w-3 h-3 text-blue-300" />
            <span>{`${momentum >= 0 ? "+" : ""}${momentum.toFixed(1)} Momentum`}</span>
          </motion.div>
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current</div>
            <motion.div 
              className="text-lg sm:text-2xl font-bold text-white tabular-nums"
              animate={isActive ? {
                scale: [1, 1.03, 1],
                color: ["#ffffff", "#3b82f6", "#ffffff"],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
            >
              {currentPrice > 0
                ? `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </motion.div>
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Target</div>
            <motion.div 
              className={cn(
                "text-lg sm:text-2xl font-bold tabular-nums",
                progress > 50 ? "text-green-400" : "text-blue-400"
              )}
              animate={isActive ? {
                scale: [1, 1.05, 1],
                y: [0, -2, 0],
              } : {}}
              transition={{
                duration: 0.25,
                repeat: Infinity,
              }}
            >
              {targetPrice > 0
                ? `$${targetPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </motion.div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-slate-400">Distance to Target</span>
            <motion.span 
              className={cn(
                "font-bold tabular-nums",
                distance > 0 ? "text-green-400" : "text-red-400"
              )}
              animate={isActive ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.2,
                repeat: Infinity,
              }}
            >
              {currentPrice > 0 && targetPrice > 0 ? `${distance > 0 ? "+" : ""}${distance.toFixed(2)}%` : "--"}
            </motion.span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                `bg-gradient-to-r ${asset.gradient}`
              )}
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(progress, 100)}%`,
                opacity: isActive ? [1, 0.8, 1] : 1,
              }}
              transition={{ 
                width: { duration: 0.5, ease: "easeOut" },
                opacity: { duration: 0.3, repeat: Infinity },
              }}
            />
            {/* Enhanced shimmer effect */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: isActive ? 0.8 : 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ width: "50%" }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <motion.div 
            className="text-center p-2 rounded-lg bg-white/5"
            animate={isActive ? {
              scale: [1, 1.02, 1],
              backgroundColor: ["rgba(255, 255, 255, 0.05)", "rgba(59, 130, 246, 0.1)", "rgba(255, 255, 255, 0.05)"],
            } : {}}
            transition={{
              duration: 0.4,
              repeat: Infinity,
            }}
          >
            <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Orders</div>
            <motion.div 
              className="text-base sm:text-lg font-bold text-white tabular-nums"
              animate={isActive ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
            >
              {Math.floor(progress * 12.5)}
            </motion.div>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg bg-white/5"
            animate={isActive ? {
              scale: [1, 1.02, 1],
              backgroundColor: ["rgba(255, 255, 255, 0.05)", "rgba(59, 130, 246, 0.1)", "rgba(255, 255, 255, 0.05)"],
            } : {}}
            transition={{
              duration: 0.35,
              repeat: Infinity,
              delay: 0.1,
            }}
          >
            <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Power</div>
            <motion.div 
              className="text-base sm:text-lg font-bold text-blue-400 tabular-nums"
              animate={isActive ? {
                scale: [1, 1.15, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
            >
              {progress.toFixed(0)}%
            </motion.div>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg bg-white/5"
            animate={isActive ? {
              scale: [1, 1.02, 1],
              backgroundColor: ["rgba(255, 255, 255, 0.05)", "rgba(6, 182, 212, 0.1)", "rgba(255, 255, 255, 0.05)"],
            } : {}}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              delay: 0.2,
            }}
          >
            <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Phase</div>
            <motion.div 
              className="text-base sm:text-lg font-bold text-cyan-400"
              animate={isActive ? {
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
              transition={{
                duration: 0.4,
                repeat: Infinity,
              }}
            >
              {progress < 25 ? "I" : progress < 50 ? "II" : progress < 75 ? "III" : "IV"}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatedBorder>
  );
};

// --- TRADING ACTION BUTTON ---
const TradingActionButton = ({
  phase,
  progress,
  onPress,
  onRelease,
  isActive,
}: {
  phase: number;
  progress: number;
  onPress: () => void;
  onRelease: () => void;
  isActive: boolean;
}) => {
  const actions = [
    { label: "BUY THE DIP", icon: TrendingUp, color: "from-blue-500 to-cyan-600" },
    { label: "ACCUMULATE", icon: Coins, color: "from-cyan-500 to-blue-600" },
    { label: "LONG SQUEEZE", icon: Zap, color: "from-blue-600 to-indigo-600" },
    { label: "TO THE MOON", icon: Flame, color: "from-indigo-600 to-purple-600" },
  ];

  const currentAction = actions[Math.min(phase, actions.length - 1)];
  const Icon = currentAction?.icon || TrendingUp;

  return (
    <motion.div
      className="relative w-full"
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onTouchEnd={onRelease}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatedBorder glowColor={isActive ? "#3b82f6" : "#333"} className="cursor-pointer">
        <div className="relative h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8 overflow-hidden">
          {/* Progress fill */}
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-100",
              currentAction?.color || "from-blue-500 to-cyan-600"
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.1, ease: "linear" }}
            style={{ transformOrigin: "left" }}
          />

          {/* Enhanced shimmer effect */}
          {isActive && (
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.3,
                }}
              />
            </>
          )}

          {/* Content */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3 mix-blend-difference text-white">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">
                Trading Action
              </div>
              <div className="text-base sm:text-xl font-black tracking-tight">
                {currentAction?.label || "TRADE"}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 mix-blend-difference text-white">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black tabular-nums">{progress.toFixed(0)}%</div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">
                POWER
              </div>
            </div>
            <motion.div
              animate={isActive ? {
                rotate: 360,
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Gauge className="w-6 h-6 sm:w-8 sm:h-8" />
            </motion.div>
          </div>
        </div>
      </AnimatedBorder>

      {/* Glow effect */}
      <motion.div
        className={cn(
          "absolute -inset-1 rounded-3xl blur-2xl opacity-0 transition-opacity duration-300 -z-10",
          `bg-gradient-to-r ${currentAction?.color || "from-blue-500 to-cyan-600"}`
        )}
        animate={{
          opacity: isActive ? 0.6 : 0,
          scale: isActive ? 1.1 : 1,
        }}
      />
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export default function BullMoneyGate({ 
  children, 
  onUnlock 
}: { 
  children?: React.ReactNode; 
  onUnlock?: () => void;
}) {
  // Gate state
  const [gateVisible, setGateVisible] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Add CSS for better mobile performance
  useEffect(() => {
    // Prevent pull-to-refresh on mobile
    const preventPull = (e: TouchEvent) => {
      if (gateVisible) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventPull, { passive: false });
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    return () => {
      document.removeEventListener('touchmove', preventPull);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [gateVisible]);

  // Trading state
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isTrading, setIsTrading] = useState(false);
  const [boostActive, setBoostActive] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Double tap boost
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      setBoostActive(true);
      playSuccess();
      if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
      setTimeout(() => setBoostActive(false), 3000);
    }
    lastTapRef.current = now;
  };

  const handleHoldStart = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted) return;
    const target = (e?.target as HTMLElement | undefined);
    if (target && target.closest('[data-hold-ignore]')) return;
    if (e && 'touches' in e) e.preventDefault();
    setIsTrading(true);
  }, [isCompleted]);

  const handleHoldEnd = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e && 'touches' in e) e.preventDefault();
    setIsTrading(false);
  }, []);

  // Market data
  const { price: realPrice, prevPrice, change24h } = useLivePrice(selectedAsset);
  const marketState = useMarketState(realPrice, prevPrice);
  const [targetPrice, setTargetPrice] = useState(0);

  // Audio
  const { playTick, playSuccess, playAlert } = useAudioEngine();

  // Combo system
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const comboTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isTrading) {
      interval = setInterval(() => {
        setCombo(prev => {
          const newCombo = prev + 1;
          setMaxCombo(max => Math.max(max, newCombo));
          return newCombo;
        });
      }, 500);

      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    } else {
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = undefined;
      }
    };
  }, [isTrading]);

  // Achievement system
  const [achievements, setAchievements] = useState<Array<{ id: string; title: string; timestamp: number }>>([]);
  const achievementsShownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkAchievements = () => {
      const newAchievements: Array<{ id: string; title: string }> = [];
      
      if (progress >= 25 && !achievementsShownRef.current.has('phase1')) {
        newAchievements.push({ id: 'phase1', title: '🎯 Phase I Complete!' });
      }
      if (progress >= 50 && !achievementsShownRef.current.has('phase2')) {
        newAchievements.push({ id: 'phase2', title: '⚡ Phase II Complete!' });
      }
      if (progress >= 75 && !achievementsShownRef.current.has('phase3')) {
        newAchievements.push({ id: 'phase3', title: '🔥 Phase III Complete!' });
      }
      if (combo >= 20 && !achievementsShownRef.current.has('combo20')) {
        newAchievements.push({ id: 'combo20', title: '💫 Combo Master!' });
      }
      if (combo >= 50 && !achievementsShownRef.current.has('combo50')) {
        newAchievements.push({ id: 'combo50', title: '👑 Combo Legend!' });
      }

      newAchievements.forEach(ach => {
        achievementsShownRef.current.add(ach.id);
        setAchievements(prev => [...prev, { ...ach, timestamp: Date.now() }]);
        playSuccess();
        if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 50]);
      });
    };

    checkAchievements();
  }, [progress, combo, playSuccess]);

  // Clean up old achievements
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAchievements(prev => prev.filter(a => now - a.timestamp < 3000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Animation
  const requestRef = useRef<number>();
  const lastPhaseRef = useRef(0);
  const lastTickRef = useRef(0);

  // Initialize target price
  useEffect(() => {
    if (realPrice > 0 && targetPrice === 0) {
      const multiplier = selectedAsset === 'BTC' ? 1.05 : selectedAsset === 'ETH' ? 1.08 : selectedAsset === 'SOL' ? 1.12 : 1.10;
      setTargetPrice(realPrice * multiplier);
    }
  }, [realPrice, targetPrice, selectedAsset]);

  // Reset on asset change
  useEffect(() => {
    setProgress(0);
    setPhase(0);
    setTargetPrice(0);
    setIsCompleted(false);
  }, [selectedAsset]);

  // Main animation loop
  const animate = useCallback(() => {
    if (isCompleted) return;

    setProgress((prev) => {
      let next = prev;

      if (isTrading) {
        // Accelerating progress based on market momentum
        const baseSpeed = 0.8;
        const momentumBoost = Math.abs(marketState.momentum) * 0.1;
        const phaseBoost = phase * 0.3;
        const doubleTapBoost = boostActive ? 2.0 : 1.0; // 2x speed when boosted
        const speed = (baseSpeed + momentumBoost + phaseBoost) * doubleTapBoost;
        
        next = Math.min(prev + speed, 100);

        // Phase transitions
        const newPhase = Math.floor(next / 25);
        if (newPhase > lastPhaseRef.current) {
          lastPhaseRef.current = newPhase;
          setPhase(newPhase);
          playAlert();
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          
          // Flash effect on phase complete
          const flash = document.createElement('div');
          flash.className = 'fixed inset-0 z-[90] pointer-events-none bg-blue-400';
          flash.style.opacity = '0.3';
          document.body.appendChild(flash);
          setTimeout(() => {
            flash.style.transition = 'opacity 0.3s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
          }, 50);
        }

        // Tick sounds
        const now = Date.now();
        if (now - lastTickRef.current > 100) {
          playTick(800 + next * 5, 0.05);
          lastTickRef.current = now;
        }

        // Enhanced continuous haptic feedback
        if (navigator.vibrate) {
          // More intense continuous vibration
          if (Math.random() < 0.8) {
            const intensity = Math.min(next, 100);
            navigator.vibrate(Math.floor(10 + (intensity / 100) * 20));
          }
        }

      } else {
        // Decay when not trading
        next = Math.max(prev - 2, 0);
      }

      // Completion
      if (next >= 100) {
        setIsCompleted(true);
        playSuccess();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

        setTimeout(() => {
          setGateVisible(false);
          setShowTerminal(true);
          if (onUnlock) onUnlock();
        }, 1000);

        return 100;
      }

      return next;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [isTrading, isCompleted, marketState, phase, playTick, playAlert, playSuccess, onUnlock]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <>
      {/* Main content (behind gate) */}
      <div className="relative z-0 min-h-screen w-full">
        {children}
      </div>

      {/* Transition effects */}
      <AnimatePresence>
        {isCompleted && gateVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-gradient-to-b from-blue-500 via-cyan-400 to-white pointer-events-none"
          />
        )}
        {!gateVisible && showTerminal && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeIn" }}
            className="fixed inset-0 z-[100] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Gate */}
      <AnimatePresence>
        {gateVisible && (
          <motion.div
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[60] h-[100dvh] w-screen bg-[#0a0a0a] text-white overflow-hidden select-none touch-none safe-area-inset"
            data-loader="hold-unlock"
            data-tap-anywhere
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onTouchCancel={handleHoldEnd}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {/* Background chart */}
            <div className="absolute inset-0 z-0 opacity-10">
              <TradingViewWidget assetKey={selectedAsset} id="tv-bg" minimal={true} />
            </div>

            {/* CRT Scan Lines Effect */}
            <div className="absolute inset-0 z-[5] pointer-events-none">
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)",
                }}
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent"
                animate={{
                  y: ["-100%", "200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)] z-10" />

            {/* Particle System */}
            <ParticleExplosion active={isTrading && progress > 50} color="#3b82f6" />

            {/* Combo Display */}
            <AnimatePresence>
              {combo > 5 && <ComboDisplay combo={combo} maxCombo={maxCombo} />}
            </AnimatePresence>

            {/* Achievement Notifications */}
            <div className="fixed top-20 sm:top-4 right-2 sm:right-4 z-50 flex flex-col items-end max-w-[calc(100vw-1rem)]">
              <AnimatePresence>
                {achievements.map(achievement => (
                  <AchievementNotification key={achievement.timestamp} achievement={achievement} />
                ))}
              </AnimatePresence>
            </div>

            {/* Asset selector */}
            <div className="absolute top-4 sm:top-6 left-0 right-0 z-[100] flex justify-center px-2">
              <div
                className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 assist-selector"
                data-hold-ignore
                data-interactive
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{ pointerEvents: 'auto' }}
              >
                {Object.entries(ASSETS).map(([key, asset]) => (
                  <motion.button
                    key={key}
                    onClick={() => !isTrading && setSelectedAsset(key as AssetKey)}
                    className={cn(
                      "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all min-w-[44px] min-h-[44px]",
                      key === selectedAsset
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isTrading}
                    style={{
                      pointerEvents: 'auto',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span className="text-sm sm:text-lg">{asset.icon}</span>
                    <span className="hidden xs:inline sm:inline">{asset.id}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Main content */}
            <motion.div
              className="relative z-30 flex flex-col items-center justify-center min-h-full w-full px-4 md:px-8 pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 md:pb-8 overflow-y-auto"
              style={{ willChange: 'transform, opacity' }}
              animate={isCompleted ? {
                scale: 0.8,
                opacity: 0,
                filter: "blur(20px)",
              } : isTrading ? {
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
                x: [0, -3, 3, -3, 3, -2, 2, 0],
                y: [0, -2, 2, -2, 2, -1, 1, 0],
              } : {
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
              }}
              transition={isTrading ? { 
                duration: 0.15,
                repeat: Infinity,
                ease: "easeInOut"
              } : { 
                duration: 0.6, 
                ease: "easeInOut" 
              }}
            >
              {/* Logo */}
              <motion.div
                className="mb-3 md:mb-4"
                animate={{
                  y: isTrading ? [0, -5, 0] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ReactiveLogo isActive={isTrading} />
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-1 md:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500"
                animate={{
                  backgroundPosition: ["0%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 100%",
                }}
              >
                BULLMONEY
              </motion.h1>

              <p className="text-xs sm:text-sm text-slate-400 mb-6 md:mb-8 font-medium">
                High-Frequency Trading Interface
              </p>

              {/* Main trading interface */}
              <div className="w-full max-w-2xl space-y-4 md:space-y-5">
                {/* Market indicator (condensed) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <MarketIndicator
                    label="Price"
                    value={realPrice > 0 ? `$${realPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "--"}
                    icon={DollarSign}
                    trend={realPrice > prevPrice ? "up" : realPrice < prevPrice ? "down" : "neutral"}
                    isActive={isTrading}
                  />
                </div>

                {/* Price target */}
                <PriceTargetSystem
                  currentPrice={realPrice}
                  targetPrice={targetPrice}
                  progress={progress}
                  assetKey={selectedAsset}
                  isActive={isTrading}
                  change24h={change24h}
                  volatility={marketState.volatility}
                  momentum={marketState.momentum}
                />

                {/* Trading action button */}
                <div 
                  className="relative touch-manipulation" 
                  onClick={handleTap}
                  style={{ touchAction: 'manipulation' }}
                >
                  <TradingActionButton
                    phase={phase}
                    progress={progress}
                    onPress={handleHoldStart}
                    onRelease={handleHoldEnd}
                    isActive={isTrading}
                  />
                  
                  {/* Boost Indicator */}
                  <AnimatePresence>
                    {boostActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 whitespace-nowrap"
                      >
                        <motion.div
                          className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 sm:gap-2"
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 0.3,
                            repeat: Infinity,
                          }}
                        >
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                          <span>2X BOOST!</span>
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Status message */}
                <AnimatePresence>
                  {isTrading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold"
                    >
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" />
                      <span className="text-blue-400">
                        {progress < 25 && "Accumulating positions..."}
                        {progress >= 25 && progress < 50 && "Building momentum..."}
                        {progress >= 50 && progress < 75 && "Breakout imminent..."}
                        {progress >= 75 && progress < 100 && "MOONING! 🚀"}
                      </span>
                    </motion.div>
                  )}
                  {!isTrading && progress > 0 && progress < 100 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-400"
                    >
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Hold anywhere to continue trading</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom hint */}
              <AnimatePresence>
                {progress === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: 0.4 }}
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28 flex flex-col items-center gap-1.5"
                  >
                    <motion.div
                      className="relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/15 border border-blue-400/40 backdrop-blur-sm shadow-[0_0_18px_rgba(59,130,246,0.4)]"
                      animate={{
                        boxShadow: [
                          "0 0 10px rgba(59, 130, 246, 0.3)",
                          "0 0 18px rgba(59, 130, 246, 0.5)",
                          "0 0 10px rgba(59, 130, 246, 0.3)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <p className="text-[11px] sm:text-xs font-semibold text-white text-center whitespace-nowrap">
                        Hold anywhere to unlock
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      >
                        
                      </motion.div>
                      <span className="uppercase tracking-wider font-bold">Press & Hold</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal window */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-2 sm:bottom-4 md:bottom-6 right-2 sm:right-4 md:right-6 left-2 sm:left-auto z-50 w-auto sm:w-[400px] md:w-[500px] h-[70vh] sm:h-[550px] md:h-[600px] max-h-[calc(100vh-5rem)] bg-[#0b1221]/95 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/40 flex flex-col overflow-hidden"
          >
            {/* Terminal header */}
            <div className="h-12 sm:h-14 md:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <div>
                  <div className="text-xs sm:text-sm font-black text-white">ACCESS GRANTED</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider">
                    BullMoney Terminal v2.0
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] sm:text-xs font-bold text-green-400">LIVE</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 relative bg-[#0a0a0a]">
              <TradingViewWidget assetKey={selectedAsset} id="tv-terminal" minimal={false} />
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(10,10,10,0.8)]" />
            </div>

            {/* Terminal footer */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-gradient-to-t from-blue-500/5 to-transparent space-y-2 sm:space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Total P&L</div>
                  <div className="text-base sm:text-lg font-bold text-green-400">+{(progress * 47.3).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Max Combo</div>
                  <div className="text-base sm:text-lg font-bold text-cyan-400">{maxCombo}x</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Trades</div>
                  <div className="text-base sm:text-lg font-bold text-white">{Math.floor(progress * 12.5)}</div>
                </div>
              </div>
              <button
                onClick={() => setShowTerminal(false)}
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
              >
                <span>MINIMIZE TERMINAL</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
