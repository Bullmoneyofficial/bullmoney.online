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
import { Lock, ArrowUpRight, Coins, Zap, Activity, Minimize2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONFIG ---
const ASSETS = {
  BTC: { id: "BTC", symbol: "BINANCE:BTCUSDT", name: "BITCOIN", icon: "₿", color: "#3b82f6" },
  ETH: { id: "ETH", symbol: "BINANCE:ETHUSDT", name: "ETHEREUM", icon: "Ξ", color: "#60a5fa" },
  XRP: { id: "XRP", symbol: "BINANCE:XRPUSDT", name: "RIPPLE", icon: "✕", color: "#93c5fd" },
};

type AssetKey = keyof typeof ASSETS;

// --- COMPONENT: MOVING BORDER ---
const MovingBorder = ({ 
  children, 
  duration = 3, 
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

// --- AUDIO ENGINE (Web Audio API) ---
// Generates sound mathematically. No 404s, no latency.
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

        osc.type = "sawtooth"; // "Buzzy" sound like an energy charge
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
    const baseFreq = 80;
    const addedFreq = (progress / 100) * 400; // Higher pitch range for BullMoney
    const now = audioCtxRef.current.currentTime;
    
    oscillatorRef.current.frequency.setTargetAtTime(baseFreq + addedFreq, now, 0.1);
    
    // Add some jitter/wobble at high speeds to simulate volatility
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

    // High tech "Order Filled" sound
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + 0.6);
  };

  return { startEngine, updateEngine, stopEngine, playSuccess };
};

// --- HOOKS ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const symbol = ASSETS[assetKey].symbol.split(":")[1].toLowerCase();
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 100) { 
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.p);
          setPrevPrice((prev) => (prev === 0 ? currentPrice : price));
          setPrice(currentPrice);
          lastUpdateRef.current = now;
        }
      };
    } catch (e) {
      console.error("WS Error", e);
    }
    return () => { if (ws) ws.close(); };
  }, [assetKey, price]);

  return { price, prevPrice };
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
const TradingViewWidget = ({ 
  assetKey, 
  id,
  isBackground = false 
}: { 
  assetKey: AssetKey; 
  id: string;
  isBackground?: boolean;
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
    
    const config = isBackground ? {
      autosize: true,
      symbol: ASSETS[assetKey].symbol,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      hide_volume: true,
      backgroundColor: "rgba(2, 6, 23, 1)", 
      gridLineColor: "rgba(30, 58, 138, 0.05)",
      scaleFontColor: "rgba(134, 137, 147, 0)",
      upColor: "#3b82f6", 
      downColor: "#1e1e1e", 
      wickUpColor: "#3b82f6",
      wickDownColor: "#1e1e1e",
    } : {
      autosize: true,
      symbol: ASSETS[assetKey].symbol,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1", 
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_legend: false,
      save_image: false,
      backgroundColor: "rgba(2, 6, 23, 1)",
      gridLineColor: "rgba(255, 255, 255, 0.02)",
      hide_volume: true,
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
    <div className="relative w-24 h-24 flex items-center justify-center z-40" onMouseMove={(e) => { x.set(e.clientX); y.set(e.clientY); }}>
      <svg style={{ position: "absolute", width: 0, height: 0 }}><defs><filter id="liquid-distort"><motion.feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves="2" result="noise" /><motion.feDisplacementMap in="SourceGraphic" in2="noise" scale="20" /></filter></defs></svg>
      <motion.div className="w-full h-full flex items-center justify-center" style={{ filter: "url(#liquid-distort)" }}>
          <img src={src} alt="BullMoney" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden'); }} />
          <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900 rounded-full border border-blue-400/30 shadow-[0_0_40px_rgba(37,99,235,0.6)]"><Coins className="w-10 h-10 text-white" /></div>
      </motion.div>
    </div>
  );
};

// --- MAIN OVERLAY COMPONENT ---
export default function BullMoneyGate({ children, onUnlock }: { children?: React.ReactNode, onUnlock?: () => void }) {
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

  // Use the synthesized Audio Hook
  const { startEngine, updateEngine, stopEngine, playSuccess } = useAudioEngine();

  useEffect(() => {
    if (!isHolding && realPrice > 0) {
      basePriceRef.current = realPrice;
      setDisplayPrice(realPrice);
    }
  }, [realPrice, isHolding]);

  // Audio Control Effect
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

  const animate = useCallback(() => {
    if (isCompleted) {
        shakeX.set(0); shakeY.set(0); 
        return;
    }

    setProgress((prev) => {
      let next = prev;
      
      if (isHolding) {
        const boost = prev > 90 ? 8.0 : prev > 80 ? 4.0 : prev > 50 ? 1.5 : 0.6; 
        next = Math.min(prev + boost, 100);

        // Update synthesized pitch based on progress
        updateEngine(next);

        if (typeof navigator !== "undefined" && navigator.vibrate) {
            const intensity = next / 100;
            if (Math.random() < intensity * 0.9) navigator.vibrate(5 + (intensity * 40)); 
        }

        const shakeAmplitude = (next > 10) ? (next / 100) * 25 : 0; 
        if (shakeAmplitude > 0) {
            shakeX.set((Math.random() - 0.5) * shakeAmplitude * 2);
            shakeY.set((Math.random() - 0.5) * shakeAmplitude * 2);
        } else {
            shakeX.set(0); shakeY.set(0);
        }

        const pumpMultiplier = selectedAsset === 'BTC' ? 500 : selectedAsset === 'ETH' ? 50 : 5;
        const parabolicPump = Math.pow(next * 0.01, 3) * pumpMultiplier * 100;
        const noise = Math.random() * (pumpMultiplier * 0.5);
        
        setDisplayPrice(basePriceRef.current + parabolicPump + noise);

      } else {
        shakeX.set(0); shakeY.set(0);
        next = Math.max(prev - 3, 0); 
        if (basePriceRef.current > 0) {
           const decayPrice = displayPrice - (displayPrice - basePriceRef.current) * 0.15;
           setDisplayPrice(decayPrice);
        }
      }

      if (next >= 100) {
        setIsCompleted(true);
        stopEngine(); // Cut the continuous engine sound
        playSuccess(); // Play the synthesized "Success" sound
        
        if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 500]); 
        
        setTimeout(() => {
            setGateVisible(false); 
            setShowTerminal(true); 
            if (onUnlock) onUnlock(); 
        }, 500); 
        
        return 100;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [isHolding, isCompleted, selectedAsset, displayPrice, shakeX, shakeY, onUnlock, updateEngine, stopEngine, playSuccess]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <>
       <div className="relative z-0 min-h-screen w-full">
         {children}
       </div>

       <AnimatePresence>
         {isCompleted && gateVisible && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }} 
                className="fixed inset-0 z-[100] bg-white pointer-events-none"
            />
         )}
         {!gateVisible && showTerminal && (
            <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: "easeIn" }}
                className="fixed inset-0 z-[100] bg-white pointer-events-none"
            />
         )}
       </AnimatePresence>

       <AnimatePresence>
       {gateVisible && (
           <motion.div 
             exit={{ opacity: 0 }}
             transition={{ duration: 0 }} 
             className="fixed inset-0 z-[60] h-[100dvh] w-screen bg-[#020617] text-white overflow-hidden font-sans select-none touch-none"
           >
                <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-8 w-full">
                    <div className="flex items-center gap-2">
                        {Object.entries(ASSETS).map(([key, asset]) => (
                            <button key={key} onClick={() => setSelectedAsset(key as AssetKey)} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all border", key === selectedAsset ? "bg-[#1e293b] text-white border-blue-500/50" : "text-slate-500 border-transparent")}>
                                {asset.icon} {asset.id}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 grayscale-[50%] scale-125">
                     <TradingViewWidget assetKey={selectedAsset} id="tv-bg" isBackground={true} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent z-10" />

                <motion.div 
                    style={{ x: shakeX, y: shakeY }}
                    animate={isCompleted ? { 
                        scale: 3, 
                        opacity: 0, 
                        filter: "blur(20px)" 
                    } : { 
                        scale: 1, 
                        opacity: 1 
                    }}
                    transition={{ duration: 0.4 }}
                    className="relative z-30 flex flex-col items-center justify-center h-full w-full px-6 pt-20"
                >
                    <div className="mb-4"><ReactiveLiquidLogo src="/favicon.svg" /></div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-12 text-center text-white drop-shadow-2xl">BULLMONEY</h1>
                    
                    <div className="w-full max-w-sm flex flex-col items-center gap-6">
                        <MovingBorder rx="rounded-[2rem]" duration={4} className="bg-gradient-to-br from-[#0f172a] via-[#020617] to-black">
                            <div className="relative w-full p-8 flex flex-col items-center">
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />
                                <div className="flex flex-col items-center relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_#60a5fa] transition-colors", isHolding ? "bg-white" : "bg-blue-400")} />
                                        <span className="text-[10px] font-bold text-blue-200/50 tracking-[0.2em]">{ASSETS[selectedAsset].id}/USD TARGET</span>
                                    </div>
                                    <div className={cn("text-5xl md:text-6xl font-mono font-bold tabular-nums tracking-tighter transition-all duration-100", isHolding ? "text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.8)] scale-110" : "text-white")}>
                                        ${(displayPrice || realPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="h-4 mt-2">
                                        {isHolding && (
                                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-xs font-bold text-blue-400">
                                                <Zap className="w-3 h-3 text-white fill-white animate-pulse" />
                                                <span className="text-blue-100 animate-pulse">GOD CANDLE DETECTED</span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </MovingBorder>

                        <div className="relative w-full h-24 group cursor-pointer touch-manipulation mt-4" onMouseDown={() => !isCompleted && setIsHolding(true)} onMouseUp={() => setIsHolding(false)} onMouseLeave={() => setIsHolding(false)} onTouchStart={(e) => { e.preventDefault(); !isCompleted && setIsHolding(true); }} onTouchEnd={() => setIsHolding(false)}>
                            <MovingBorder rx="rounded-2xl" duration={2} className="bg-[#0b1221]">
                                <div className="relative h-full w-full flex items-center justify-between px-8 z-10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-500 to-white opacity-100 transition-transform duration-75 ease-linear origin-left" style={{ transform: `scaleX(${progress / 100})` }} />
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                    <div className="relative z-10 flex flex-col mix-blend-difference text-white">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1">ACCESS</span>
                                        <span className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                                            HOLD TO ENTER <ArrowUpRight className={cn("w-5 h-5 transition-transform duration-300", isHolding && "translate-x-1 -translate-y-1")} />
                                        </span>
                                    </div>
                                    <div className={cn("relative z-10 w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300", isHolding ? "bg-white/90 text-blue-900 border-white scale-110" : "bg-[#1e293b] border-white/5 text-slate-600")}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                </div>
                            </MovingBorder>
                            <div className={cn("absolute -inset-1 bg-blue-500 rounded-2xl blur-xl opacity-0 transition-all duration-100 -z-10", isHolding && "opacity-80 scale-105")} />
                        </div>
                        <p className={cn("text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-500 text-center -mt-2", isHolding ? "text-blue-300 opacity-100" : "text-slate-700 opacity-0")}>{isHolding ? "SQUEEZING SHORTS..." : ""}</p>
                    </div>
                </motion.div>
           </motion.div>
       )}
       </AnimatePresence>

       <AnimatePresence>
         {showTerminal && (
            <motion.div 
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-4 right-4 z-50 w-[90vw] md:w-[400px] h-[500px] bg-[#0b1221]/95 backdrop-blur-xl border border-blue-500/20 rounded-3xl shadow-2xl shadow-blue-900/40 flex flex-col overflow-hidden"
            >
                <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white tracking-widest">BM TERMINAL</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                            <span className="text-[10px] font-bold text-green-400">LIVE</span>
                         </div>
                    </div>
                </div>

                <div className="flex-1 relative bg-[#020617]">
                    <TradingViewWidget assetKey={selectedAsset} id="tv-widget" isBackground={false} />
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(2,6,23,1)]" />
                </div>

                <div className="p-4 bg-[#0b1221] border-t border-white/5">
                    <button 
                        onClick={() => setShowTerminal(false)}
                        className="w-full h-12 bg-white hover:bg-blue-50 text-black rounded-xl font-black italic tracking-tighter flex items-center justify-center gap-2 transition-colors"
                    >
                        <span>CLOSE TERMINAL</span>
                        <Minimize2 className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
         )}
       </AnimatePresence>
    </>
  );
}