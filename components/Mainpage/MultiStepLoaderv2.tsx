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

// --- COMPONENT: MOVING BORDER (Mobile Optimized) ---
const MovingBorder = ({
  children,
  duration = 0.8,
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
        style={{ transform: "translateZ(0)" }}
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
        // Increased throttling from 50ms to 150ms for mobile performance
        if (now - lastUpdateRef.current > 150) {
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
  // Reduced stiffness for smoother mobile performance
  const smoothX = useSpring(x, { damping: 40, stiffness: 250 });
  const smoothY = useSpring(y, { damping: 40, stiffness: 250 });
  const velocity = useTransform(
    [useVelocity(smoothX), useVelocity(smoothY)],
    ([latestX, latestY]: number[]) => Math.sqrt(latestX ** 2 + latestY ** 2)
  );
  return { x, y, velocity };
};

// --- AUDIO ENGINE (Web Audio API) ---
// This generates sound mathematically so it cannot be blocked by 404s or CORS
const useAudioEngine = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      // @ts-ignore - Handle Safari/Webkit
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const startEngine = () => {
    initAudio();
    if (!audioCtxRef.current) return;
    
    // Create oscillator if it doesn't exist
    if (!oscillatorRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        
        // Low pass filter to make it sound muffled/cool
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1000;

        osc.type = "sawtooth"; // "Buzzy" sound like an engine
        osc.frequency.setValueAtTime(100, audioCtxRef.current.currentTime); // Start low pitch
        
        gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.1); // Fade in

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        
        osc.start();
        
        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
    }
  };

  const updateEngine = (progress: number) => {
    if (!audioCtxRef.current || !oscillatorRef.current || !gainNodeRef.current) return;
    
    // Map progress (0-100) to Frequency (Pitch)
    // 0% = 80Hz, 100% = 400Hz
    const baseFreq = 80;
    const addedFreq = (progress / 100) * 320; 
    const now = audioCtxRef.current.currentTime;
    
    oscillatorRef.current.frequency.setTargetAtTime(baseFreq + addedFreq, now, 0.1);
    
    // Add some jitter/wobble at high speeds
    if (progress > 80) {
        gainNodeRef.current.gain.setTargetAtTime(0.1 + (Math.random() * 0.05), now, 0.1);
    }
  };

  const stopEngine = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        // Fade out nicely
        gainNodeRef.current.gain.setTargetAtTime(0, now, 0.1);
        
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
    initAudio();
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + 0.5);
  };

  return { startEngine, updateEngine, stopEngine, playSuccess };
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const { x, y, velocity } = useMouseVelocity();
  const baseFreq = useTransform(
    useSpring(useTransform(velocity, [0, 1000], [0, 0.1]), { stiffness: 150, damping: 25 }),
    [0, 0.1],
    [0, isMobile ? 0.02 : 0.05]
  );

  return (
    <div className="relative w-16 h-16 flex items-center justify-center z-40" onMouseMove={(e) => { if (!isMobile) { x.set(e.clientX); y.set(e.clientY); } }}>
      {!isMobile && (
        <svg style={{ position: "absolute", width: 0, height: 0 }}><defs><filter id="liquid-distort-mini"><motion.feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves="2" result="noise" /><motion.feDisplacementMap in="SourceGraphic" in2="noise" scale="15" /></filter></defs></svg>
      )}
      <motion.div className="w-full h-full flex items-center justify-center" style={{ filter: isMobile ? "none" : "url(#liquid-distort-mini)" }}>
          <img src={src} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" onError={(e) => e.currentTarget.src = "https://cryptologos.cc/logos/bitcoin-btc-logo.png"} />
      </motion.div>
    </div>
  );
};

// --- MINI GAME COMPONENTS ---
interface Obstacle {
  id: number;
  x: number;
  type: 'cactus' | 'bird';
}

const MiniGame = ({ isActive, onScore }: { isActive: boolean; onScore: (score: number) => void }) => {
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(3);
  const gameRef = useRef<number>(0);
  const obstacleIdRef = useRef(0);

  const jump = useCallback(() => {
    if (!isJumping && isActive) {
      setIsJumping(true);
      setPlayerY(-80);
      setTimeout(() => {
        setPlayerY(0);
        setTimeout(() => setIsJumping(false), 100);
      }, 400);
    }
  }, [isJumping, isActive]);

  useEffect(() => {
    if (!isActive) {
      setObstacles([]);
      setScore(0);
      setGameSpeed(3);
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, jump]);

  useEffect(() => {
    if (!isActive) return;

    const gameLoop = setInterval(() => {
      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - gameSpeed }))
          .filter(obs => obs.x > -50);

        // Check collision
        const playerBox = { x: 50, y: playerY, width: 30, height: 30 };
        const collision = newObstacles.some(obs => {
          const obsBox = { x: obs.x, y: obs.type === 'bird' ? -40 : 0, width: 20, height: 20 };
          return playerBox.x < obsBox.x + obsBox.width &&
                 playerBox.x + playerBox.width > obsBox.x &&
                 playerBox.y < obsBox.y + obsBox.height &&
                 playerBox.y + playerBox.height > obsBox.y;
        });

        if (collision) {
          onScore(score);
          return [];
        }

        // Add new obstacles
        if (Math.random() < 0.02) {
          newObstacles.push({
            id: obstacleIdRef.current++,
            x: 300,
            type: Math.random() > 0.7 ? 'bird' : 'cactus'
          });
        }

        return newObstacles;
      });

      setScore(prev => prev + 1);
      setGameSpeed(prev => Math.min(prev + 0.001, 8));
    }, 16);

    gameRef.current = gameLoop as unknown as number;
    return () => clearInterval(gameLoop);
  }, [isActive, playerY, score, gameSpeed, onScore]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      <div className="relative w-full h-32 flex items-end">
        {/* Ground line */}
        <div className="absolute bottom-8 left-0 right-0 h-[2px] bg-blue-500/30" />

        {/* Player (Bull) */}
        <motion.div
          animate={{ y: playerY }}
          className="absolute bottom-8 left-12 text-2xl pointer-events-auto cursor-pointer"
          onClick={jump}
        >
          🐂
        </motion.div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <motion.div
            key={obs.id}
            style={{ left: obs.x }}
            className={`absolute text-xl ${obs.type === 'bird' ? 'bottom-16' : 'bottom-8'}`}
          >
            {obs.type === 'bird' ? '🦅' : '🌵'}
          </motion.div>
        ))}

        {/* Score */}
        <div className="absolute top-2 right-4 text-xs font-mono text-blue-400">
          SCORE: {Math.floor(score / 10)}
        </div>
      </div>
    </div>
  );
};

interface QuickGateProps {
  children?: React.ReactNode; 
  onUnlock?: () => void;
  onFinished?: () => void;
}

// --- MAIN COMPONENT ---
export default function QuickGate({ children, onUnlock, onFinished }: QuickGateProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const { price: realPrice } = useLivePrice(selectedAsset);
  const [displayPrice, setDisplayPrice] = useState(0);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const requestRef = useRef<number>();
  const basePriceRef = useRef(0);
  const particleIdRef = useRef(0);

  // Use the custom synthesized audio hook
  const { startEngine, updateEngine, stopEngine, playSuccess } = useAudioEngine();

  const handleGameScore = useCallback((score: number) => {
    setGameScore(score);
    if (score > bestScore) setBestScore(score);
  }, [bestScore]);

  useEffect(() => {
    if (!isHolding && realPrice > 0) {
      basePriceRef.current = realPrice;
      setDisplayPrice(realPrice);
    }
  }, [realPrice, isHolding]);

  // Handle Hold Start/Stop for Audio
  useEffect(() => {
    if (isCompleted) return;
    
    if (isHolding) {
        startEngine();
    } else {
        stopEngine();
    }
    // Cleanup on unmount
    return () => stopEngine();
  }, [isHolding, isCompleted]);

  // --- TURBO PHYSICS ENGINE (Optimized for 60fps) ---
  const animate = useCallback(() => {
    if (isCompleted) { shakeX.set(0); shakeY.set(0); return; }

    setProgress((prev) => {
      let next = prev;

      if (isHolding) {
        // Faster boost values for quicker completion
        const boost = prev > 80 ? 35.0 : prev > 50 ? 15.0 : 5.0;
        next = Math.min(prev + boost, 100);

        // Update synthesized pitch based on progress
        updateEngine(next);

        // Reduced shake amplitude for better mobile performance
        const shakeAmplitude = (next > 20) ? (next / 100) * 8 : 0;
        if (shakeAmplitude > 0) {
            shakeX.set((Math.random() - 0.5) * shakeAmplitude * 2);
            shakeY.set((Math.random() - 0.5) * shakeAmplitude * 2);
        }

        const parabolicPump = Math.pow(next * 0.01, 3) * 10000;
        setDisplayPrice(basePriceRef.current + parabolicPump);

        // Reduced vibration frequency for better battery
        if (typeof navigator !== "undefined" && navigator.vibrate) {
             if (next > 90 && Math.random() < 0.3) navigator.vibrate(8);
        }

      } else {
        shakeX.set(0); shakeY.set(0);
        next = Math.max(prev - 12, 0);
        if (basePriceRef.current > 0) setDisplayPrice(basePriceRef.current);
      }

      if (next >= 100) {
        setIsCompleted(true);
        stopEngine();
        playSuccess();

        if (navigator.vibrate) navigator.vibrate(150);

        setTimeout(() => {
            setGateVisible(false);
            setShowTerminal(true);
            if (onUnlock) onUnlock();
            if (onFinished) onFinished();
        }, 300);

        return 100;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [isHolding, isCompleted, displayPrice, shakeX, shakeY, onUnlock, onFinished, updateEngine, stopEngine, playSuccess]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <>
       {children && <div className="relative z-0 min-h-screen w-full">{children}</div>}

       <AnimatePresence>
         {isCompleted && gateVisible && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[100] bg-blue-500/20 mix-blend-overlay pointer-events-none"
            />
         )}
       </AnimatePresence>

       <AnimatePresence>
       {gateVisible && (
           <motion.div
             exit={{ opacity: 0, scale: 1.05 }}
             transition={{ duration: 0.3 }}
             className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#020617] text-white overflow-hidden"
           >
                {/* Background Chart - Reduced opacity on mobile for better performance */}
                <div className="absolute inset-0 z-0 opacity-10 md:opacity-20 scale-110 pointer-events-none grayscale will-change-transform">
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
                <motion.div style={{ x: shakeX, y: shakeY }} className="relative z-30 flex flex-col items-center gap-4 w-full max-w-2xl px-4">
                    <ReactiveLiquidLogo src="/favicon.svg" />

                    <div className="flex flex-col items-center w-full">
                        <div className={cn("text-3xl md:text-5xl font-mono font-bold tracking-tighter transition-all duration-75 will-change-transform", isHolding ? "text-blue-400 scale-105" : "text-white")}>
                            ${(displayPrice || realPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="h-8 mt-1 flex items-center justify-center gap-4">
                            {isHolding ? (
                              <div className="text-[10px] font-bold text-blue-400 animate-pulse flex items-center gap-1"><Zap size={10} /> ACCELERATING</div>
                            ) : bestScore > 0 ? (
                              <div className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">🏆 BEST: {Math.floor(bestScore / 10)}</div>
                            ) : null}
                        </div>
                    </div>

                    {/* Mini Game Area - Always Active */}
                    <div className="relative w-full h-32 bg-black/20 rounded-xl border border-blue-500/20 overflow-hidden mb-2">
                        <MiniGame isActive={true} onScore={handleGameScore} />
                        <div className="absolute top-2 left-4 text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                          🎮 PLAY WHILE LOADING
                        </div>

                        {/* Particle Effects */}
                        {particles.map(p => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 1, scale: 0, x: p.x, y: p.y }}
                            animate={{ opacity: 0, scale: 2, y: p.y - 50 }}
                            transition={{ duration: 0.6 }}
                            className="absolute text-blue-400 text-xs pointer-events-none"
                          >
                            +{Math.floor(progress / 10)}
                          </motion.div>
                        ))}
                    </div>

                    {/* Bigger Interactive Button */}
                    <div className="relative w-full max-w-md h-20 cursor-pointer touch-none select-none active:scale-[0.98] transition-all"
                         onMouseDown={() => {
                           if (!isCompleted) {
                             setIsHolding(true);
                             setParticles(prev => [...prev, { id: particleIdRef.current++, x: Math.random() * 200, y: 40 }]);
                           }
                         }}
                         onMouseUp={() => setIsHolding(false)}
                         onMouseLeave={() => setIsHolding(false)}
                         onTouchStart={(e) => {
                           e.preventDefault();
                           if (!isCompleted) {
                             setIsHolding(true);
                             setParticles(prev => [...prev, { id: particleIdRef.current++, x: Math.random() * 200, y: 40 }]);
                           }
                         }}
                         onTouchEnd={(e) => { e.preventDefault(); setIsHolding(false); }}
                         onTouchCancel={(e) => { e.preventDefault(); setIsHolding(false); }}
                    >
                        <MovingBorder rx="rounded-2xl" duration={0.8} className="bg-gradient-to-br from-[#0b1221] to-[#1e293b]">
                            <div className="relative h-full w-full flex items-center justify-center gap-3 z-10 overflow-hidden">
                                {/* Animated background fill */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 origin-left will-change-transform"
                                  animate={{
                                    backgroundPosition: isHolding ? ['0% 50%', '100% 50%'] : '0% 50%',
                                  }}
                                  transition={{
                                    backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' }
                                  }}
                                  style={{
                                    transform: `scaleX(${progress / 100})`,
                                    backgroundSize: '200% 100%'
                                  }}
                                />

                                {/* Glow effect when holding */}
                                {isHolding && (
                                  <motion.div
                                    className="absolute inset-0 bg-blue-400/30"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  />
                                )}

                                {/* Button text */}
                                <div className="relative z-10 font-black italic tracking-tighter text-xl flex items-center gap-3 mix-blend-difference">
                                  <span className={cn("transition-all duration-150", isHolding && "scale-110")}>
                                    {progress === 0 ? "HOLD TO MOON" : progress >= 100 ? "🚀 MOONED!" : `${Math.floor(progress)}%`}
                                  </span>
                                  <ArrowUpRight className={cn("w-6 h-6 transition-all duration-150", isHolding && "translate-x-2 -translate-y-2 rotate-45 scale-125")} />
                                </div>

                                {/* Progress indicator */}
                                <div className="absolute bottom-1 left-4 right-4 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                    style={{ width: `${progress}%` }}
                                  />
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
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-4 right-4 z-50 w-[min(300px,calc(100vw-2rem))] h-[350px] max-h-[50vh] bg-[#0b1221] border border-blue-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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