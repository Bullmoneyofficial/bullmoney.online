"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import { ArrowUpRight, LockOpen, Zap, TrendingUp, Sparkles, Rocket, Star, Trophy, Flame, Diamond, Moon, Target, Dumbbell, CheckCircle2, CircleDollarSign, BarChart3, Activity } from "lucide-react";
import Image from "next/image";

// --- IMPORT UNIFIED SHIMMER SYSTEM FOR FPS-AWARE ANIMATIONS ---
import { useOptimizedShimmer } from "@/components/ui/UnifiedShimmer";

// --- TYPES ---
type AssetKey = "BTC" | "ETH" | "SOL";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  iconType?: ParticleIcon;
}

interface LoaderProps {
  onFinished?: () => void;
}

// --- UTILS ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

// Particle icon types for animated burst
const PARTICLE_ICONS = ["rocket", "dollar", "chart", "zap", "flame", "diamond", "moon", "sparkle"] as const;
type ParticleIcon = typeof PARTICLE_ICONS[number];

// --- CONFIG ---
const ASSETS: Record<AssetKey, { id: string; symbol: string; icon: string; color: string }> = {
  BTC: { id: "BTC", symbol: "BINANCE:BTCUSDT", icon: "₿", color: "#F7931A" },
  ETH: { id: "ETH", symbol: "BINANCE:ETHUSDT", icon: "Ξ", color: "#627EEA" },
  SOL: { id: "SOL", symbol: "BINANCE:SOLUSDT", icon: "◎", color: "#14F195" },
};

// --- LIVE PRICE HOOK (ENABLED FOR ALL DEVICES) ---
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const lastPriceRef = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const controller = new AbortController();
    let pollId: ReturnType<typeof setInterval> | null = null;
    
    const initPriceUpdates = async () => {
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

        // Initial fetch
        await fetchTicker();
        
        // Poll every 2 seconds as fallback
        pollId = setInterval(fetchTicker, 2000);

        // WebSocket enabled for ALL devices - try to connect
        if ('WebSocket' in window) {
          try {
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
            
            ws.onerror = () => {
              console.log('[Price] WebSocket error, falling back to polling');
              if (ws) {
                ws.close();
                ws = null;
              }
            };
            
            ws.onmessage = (event) => {
              const now = Date.now();
              if (now - lastUpdateRef.current > 100) {
                try {
                  const data = JSON.parse(event.data);
                  const nextPrice = parseFloat(data.p);
                  if (!Number.isNaN(nextPrice)) {
                    lastPriceRef.current = nextPrice;
                    setPrice(nextPrice);
                    lastUpdateRef.current = now;
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            };
          } catch (e) {
            console.log('[Price] WebSocket not available, using polling only');
          }
        }
      } catch (e) {
        console.error('[Price] Init failed:', e);
      }
    };
    
    initPriceUpdates();
    
    return () => {
      controller.abort();
      if (pollId) clearInterval(pollId);
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    };
  }, [assetKey]);

  return { price };
};

// --- AUDIO ENGINE (CINEMATIC V2 - ENABLED FOR ALL DEVICES) ---
const useAudioEngine = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const subOscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const subGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const isPlayingRef = useRef(false);
  const lastStartTimeRef = useRef(0);
  const isDisabledRef = useRef(false);

  // Audio is now enabled for ALL browsers and devices
  // Only disable if AudioContext is truly unavailable
  useEffect(() => {
    // Check if AudioContext exists at all
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      isDisabledRef.current = true;
      console.log('[Audio] AudioContext not available in this browser');
    }
  }, []);

  const initAudio = useCallback(() => {
    // Skip if disabled
    if (isDisabledRef.current) return null;
    
    if (!audioCtxRef.current) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = AudioContextClass ? new AudioContextClass() : null;
      } catch (e) {
        console.log('[Audio] AudioContext creation failed');
        isDisabledRef.current = true;
        return null;
      }
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }, []);

  const startEngine = useCallback(() => {
    // Skip if disabled
    if (isDisabledRef.current) return;
    
    // Prevent rapid restart glitches - minimum 100ms between starts
    const now = Date.now();
    if (now - lastStartTimeRef.current < 100) return;
    lastStartTimeRef.current = now;
    
    // Don't restart if already playing
    if (isPlayingRef.current) return;
    
    const ctx = initAudio();
    if (!ctx) return;

    isPlayingRef.current = true;

    try {
      if (!oscillatorRef.current) {
        // Main engine oscillator - richer tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.value = 800;
        filter.Q.value = 2;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        filterRef.current = filter;

        // Sub-bass oscillator for depth
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();

        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(40, ctx.currentTime);

        subGain.gain.setValueAtTime(0, ctx.currentTime);
        subGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.2);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        subOsc.start();

        subOscRef.current = subOsc;
        subGainRef.current = subGain;

        // Quick boot-up blip (shorter, snappier)
        const bootOsc = ctx.createOscillator();
        const bootGain = ctx.createGain();

        bootOsc.type = "square";
        bootOsc.frequency.setValueAtTime(400, ctx.currentTime);
        bootOsc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

        bootGain.gain.setValueAtTime(0.08, ctx.currentTime);
        bootGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        bootOsc.connect(bootGain);
        bootGain.connect(ctx.destination);

        bootOsc.start();
        bootOsc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.log('[Audio] Start engine failed:', e);
    }
  }, [initAudio]);

  const updateEngine = useCallback((progress: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !oscillatorRef.current || !gainNodeRef.current || !filterRef.current) return;
    if (!isPlayingRef.current) return;

    const now = ctx.currentTime;
    
    // Main frequency ramps up with progress - snappier response
    const baseFreq = 80;
    const addedFreq = (progress / 100) * 400;
    oscillatorRef.current.frequency.setTargetAtTime(baseFreq + addedFreq, now, 0.05);

    // Filter opens up as progress increases
    const filterFreq = 800 + (progress / 100) * 2500;
    filterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.08);

    // Sub oscillator pitch rises slightly
    if (subOscRef.current) {
      subOscRef.current.frequency.setTargetAtTime(40 + (progress / 100) * 40, now, 0.1);
    }

    // Intensity increases at higher progress
    if (progress > 50) {
      const intensity = ((progress - 50) / 50) * 0.03;
      gainNodeRef.current.gain.setTargetAtTime(0.04 + intensity, now, 0.05);
    }

    // Dramatic buildup near completion
    if (progress > 85) {
      const urgency = ((progress - 85) / 15);
      if (subGainRef.current) {
        subGainRef.current.gain.setTargetAtTime(0.06 + urgency * 0.05, now, 0.03);
      }
      filterRef.current.Q.setTargetAtTime(2 + urgency * 3, now, 0.05);
    }
  }, []);

  const stopEngine = useCallback(() => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    
    const ctx = audioCtxRef.current;
    const gainNode = gainNodeRef.current;
    const subGain = subGainRef.current;
    
    if (ctx) {
      const now = ctx.currentTime;
      
      // Quick fade out to prevent clicks
      if (gainNode) {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(0, now, 0.05);
      }
      if (subGain) {
        subGain.gain.cancelScheduledValues(now);
        subGain.gain.setTargetAtTime(0, now, 0.08);
      }

      setTimeout(() => {
        try {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
          }
          if (subOscRef.current) {
            subOscRef.current.stop();
            subOscRef.current.disconnect();
            subOscRef.current = null;
          }
          gainNodeRef.current = null;
          subGainRef.current = null;
          filterRef.current = null;
        } catch (e) {
          // Ignore errors from already stopped oscillators
        }
      }, 150);
    }
  }, []);

  const playSuccess = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Layered success chord - snappier, punchier
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const delay = i * 0.02; // Faster cascade
      const volume = 0.1 - (i * 0.015);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gain.gain.setValueAtTime(volume, now + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + (i * 0.05));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + 0.5 + (i * 0.05));
    });

    // Quick shimmer/sparkle effect
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    const shimmerFilter = ctx.createBiquadFilter();

    shimmerOsc.type = "sine";
    shimmerOsc.frequency.setValueAtTime(2500, now);
    shimmerOsc.frequency.exponentialRampToValueAtTime(5000, now + 0.05);
    shimmerOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.2);

    shimmerFilter.type = "bandpass";
    shimmerFilter.frequency.value = 3500;
    shimmerFilter.Q.value = 4;

    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.04, now + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    shimmerOsc.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    shimmerOsc.start(now);
    shimmerOsc.stop(now + 0.3);

    // Quick confirmation thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();

    thud.type = "sine";
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    thudGain.gain.setValueAtTime(0.15, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    thud.start(now);
    thud.stop(now + 0.12);
  }, [initAudio]);

  return { startEngine, updateEngine, stopEngine, playSuccess };
};

// --- MAIN COMPONENT ---
export default function EnhancedQuickGate({ onFinished }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false); // Shows "Access Website" button
  const [vaultOpening, setVaultOpening] = useState(false); // Vault door animation state
  const [gateVisible, setGateVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showTip, setShowTip] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const { price: realPrice } = useLivePrice(selectedAsset);
  const [displayPrice, setDisplayPrice] = useState(0);
  
  // --- FPS-AWARE SHIMMER SETTINGS ---
  const shimmerSettings = useOptimizedShimmer();
  // Calculate shimmer duration based on FPS tier (slower = less CPU usage)
  const shimmerDuration = useMemo(() => {
    switch (shimmerSettings.speed) {
      case 'slow': return 3.5; // Slow for low FPS
      case 'normal': return 2.8; // Default smooth shimmer
      case 'fast': return 2.2; // Normal speed
      default: return 2.8;
    }
  }, [shimmerSettings.speed]);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const iconRotate = useMotionValue(0);
  
  const requestRef = useRef<number | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFinishedRef = useRef(false);
  const particleIdRef = useRef(0);
  const isCompletingRef = useRef(false);
  const isHoldingRef = useRef(false); // Ref to track holding state for RAF loop
  const isMountedRef = useRef(false); // Track if component has mounted
  const hasUserInteractedRef = useRef(false); // CRITICAL: Only allow progress after first user touch
  const animationStartedRef = useRef(false); // CRITICAL: Animation loop only starts after first interaction
  const animateFnRef = useRef<(() => void) | null>(null); // Store animate function for stable reference

  const { startEngine, updateEngine, stopEngine, playSuccess } = useAudioEngine();

  // Initialize refs on mount - ensure clean state
  useEffect(() => {
    isMountedRef.current = true;
    isHoldingRef.current = false;
    hasUserInteractedRef.current = false;
    isCompletingRef.current = false;
    hasFinishedRef.current = false;
    animationStartedRef.current = false; // CRITICAL: Don't auto-start animation
    
    // Cancel any existing animation frames
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    return () => {
      isMountedRef.current = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (realPrice > 0) {
      setDisplayPrice(realPrice);
    }
  }, [realPrice]);

  useEffect(() => {
    if (isCompleted) return;

    // Keep ref in sync with state
    isHoldingRef.current = isHolding;

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

  // Handle vault access button click - triggers vault opening animation
  const handleVaultAccess = useCallback(() => {
    if (vaultOpening || hasFinishedRef.current) return;
    setVaultOpening(true);
    
    // Play a satisfying "vault opening" sound
    playSuccess();
    
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 100, 50, 150]);
    }
    
    // Vault door animation duration before revealing content
    setTimeout(() => {
      setGateVisible(false);
      setTimeout(finishLoader, 300);
    }, 800);
  }, [vaultOpening, playSuccess, finishLoader]);

  const createParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 6 - 4,
        iconType: PARTICLE_ICONS[Math.floor(Math.random() * PARTICLE_ICONS.length)],
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Helper to render particle icon - now theme-aware
  const renderParticleIcon = (iconType: ParticleIcon) => {
    const iconClass = "w-5 h-5 theme-accent";
    const iconStyle = { color: 'var(--accent-color, #60a5fa)' };
    switch (iconType) {
      case "rocket": return <Rocket className={iconClass} style={iconStyle} />;
      case "dollar": return <CircleDollarSign className={iconClass} style={iconStyle} />;
      case "chart": return <BarChart3 className={iconClass} style={iconStyle} />;
      case "zap": return <Zap className={iconClass} style={iconStyle} />;
      case "flame": return <Flame className={iconClass} style={iconStyle} />;
      case "diamond": return <Diamond className={iconClass} style={iconStyle} />;
      case "moon": return <Moon className={iconClass} style={iconStyle} />;
      case "sparkle": return <Sparkles className={iconClass} style={iconStyle} />;
      default: return <Star className={iconClass} style={iconStyle} />;
    }
  };

  const animate = useCallback(() => {
    // HARD LOCK: Never run if component unmounted or user never interacted
    if (!isMountedRef.current || !hasUserInteractedRef.current) {
      return; // Don't even schedule next frame
    }
    
    if (isCompleted) {
      shakeX.set(0);
      shakeY.set(0);
      return;
    }

    setProgress((prev) => {
      // TRIPLE LOCK: Block ALL progress if user hasn't interacted
      if (!hasUserInteractedRef.current || !isMountedRef.current) {
        return 0;
      }
      
      let next = prev;
      
      // Use ref to get current holding state (avoids stale closure)
      const holding = isHoldingRef.current;

      // CRITICAL: Only advance progress if user is ACTIVELY holding right now
      if (holding && hasUserInteractedRef.current) {
        // Only increment if we haven't completed yet - SNAPPIER PROGRESS
        if (!isCompletingRef.current) {
          // Much faster boost values for snappy feel
          const boost = prev > 70 ? 7 : prev > 40 ? 5.5 : 4;
          next = Math.min(prev + boost, 100);

          updateEngine(next);

          scale.set(1 + (next / 100) * 0.25);
          iconRotate.set((next / 100) * 720); // Double spin

          const shakeAmount = (next / 100) * 10;
          shakeX.set((Math.random() - 0.5) * shakeAmount);
          shakeY.set((Math.random() - 0.5) * shakeAmount);

          if (typeof navigator !== "undefined" && navigator.vibrate) {
            if (next > 70 && Math.random() < 0.5) navigator.vibrate(8);
          }

          // CRITICAL: Only trigger completion when progress reaches EXACTLY 100 AND still holding
          // Triple-check all conditions to prevent premature unlock
          if (next >= 100 && holding && !isCompletingRef.current && !hasFinishedRef.current && hasUserInteractedRef.current) {
            // Lock in completion state immediately
            isCompletingRef.current = true;
            
            // Use RAF to ensure state is fully committed before proceeding
            requestAnimationFrame(() => {
              setIsCompleted(true);
              stopEngine();
              playSuccess();
              scale.set(1.4);

              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([80, 40, 80]);
              }

              // Show vault unlocked state with "Access Website" button
              // User must tap button to enter site
              completionTimeoutRef.current = setTimeout(() => {
                setVaultUnlocked(true);
              }, 400);
            });
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
        
        // Drain progress even faster
        next = Math.max(prev - 16, 0);
        
        // Only reset completion flag if we drop significantly below 100
        // This prevents glitch from rapid release/hold at 100%
        if (next < 95) {
          isCompletingRef.current = false;
        }
      }
      
      return next;
    });

    // Only continue animation if user has interacted and not completed
    if (!isCompleted && hasUserInteractedRef.current && isMountedRef.current) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [finishLoader, isCompleted, playSuccess, scale, shakeX, shakeY, stopEngine, updateEngine, iconRotate]);

  // Keep animate function ref updated
  useEffect(() => {
    animateFnRef.current = animate;
  }, [animate]);

  // CRITICAL: Do NOT auto-start animation on mount
  // Animation only starts when user first interacts (see handleInteractionStart)
  useEffect(() => {
    // Cleanup only - DO NOT START ANIMATION HERE
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

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
    // Block all interaction once completion has started
    if (isCompleted || isCompletingRef.current || hasFinishedRef.current) return;
    
    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-no-hold]")) {
      return;
    }

    // Mark that user has interacted - this unlocks progress advancement
    hasUserInteractedRef.current = true;
    isHoldingRef.current = true; // Update ref immediately
    setIsHolding(true);
    
    // CRITICAL: Start animation loop ONLY on first user interaction
    if (!animationStartedRef.current && animateFnRef.current) {
      animationStartedRef.current = true;
      requestRef.current = requestAnimationFrame(animateFnRef.current);
    }
    
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
    // Don't allow release to affect state once completing
    if (isCompletingRef.current || hasFinishedRef.current) return;
    isHoldingRef.current = false; // Update ref immediately
    setIsHolding(false);
  };

  return (
    <>
      <AnimatePresence>
        {gateVisible && (
          <motion.div
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#000000] text-white overflow-hidden"
            style={{ isolation: 'isolate' }}
            onMouseDown={!vaultUnlocked ? handleInteractionStart : undefined}
            onMouseUp={!vaultUnlocked ? handleInteractionEnd : undefined}
            onMouseLeave={!vaultUnlocked ? handleInteractionEnd : undefined}
            onTouchStart={!vaultUnlocked ? handleInteractionStart : undefined}
            onTouchEnd={!vaultUnlocked ? handleInteractionEnd : undefined}
            onTouchCancel={!vaultUnlocked ? handleInteractionEnd : undefined}
          >
            {/* ═══════════════════════════════════════════════════════════════════
                VAULT DOOR OVERLAY - Appears when vault is opening
                Split door effect that slides apart to reveal content
                ═══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
              {vaultOpening && (
                <>
                  {/* Left vault door */}
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-100%" }}
                    transition={{ duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
                    className="fixed inset-y-0 left-0 w-1/2 bg-[#000000] z-[99999999] border-r-4"
                    style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)' }}
                  >
                    {/* Vault door details - left */}
                    <div className="absolute inset-0 flex items-center justify-end pr-8">
                      <motion.div
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                        style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)' }}
                      >
                        <div className="w-16 h-16 rounded-full border-2" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.4)' }} />
                      </motion.div>
                    </div>
                    {/* Horizontal bars */}
                    <div className="absolute right-4 top-1/4 w-12 h-1 rounded" style={{ background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.5)' }} />
                    <div className="absolute right-4 bottom-1/4 w-12 h-1 rounded" style={{ background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.5)' }} />
                  </motion.div>
                  
                  {/* Right vault door */}
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
                    className="fixed inset-y-0 right-0 w-1/2 bg-[#000000] z-[99999999] border-l-4"
                    style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)' }}
                  >
                    {/* Vault door details - right */}
                    <div className="absolute inset-0 flex items-center justify-start pl-8">
                      <motion.div
                        initial={{ opacity: 1, scale: 1, rotate: 0 }}
                        animate={{ opacity: 0, scale: 0.8, rotate: -180 }}
                        transition={{ duration: 0.5 }}
                        className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                        style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)' }}
                      >
                        <div className="w-16 h-16 rounded-full border-2" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.4)' }} />
                      </motion.div>
                    </div>
                    {/* Horizontal bars */}
                    <div className="absolute left-4 top-1/4 w-12 h-1 rounded" style={{ background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.5)' }} />
                    <div className="absolute left-4 bottom-1/4 w-12 h-1 rounded" style={{ background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.5)' }} />
                  </motion.div>
                  
                  {/* Center light beam effect */}
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: [0, 1, 0.8] }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="fixed inset-y-0 left-1/2 w-2 -translate-x-1/2 z-[999999999]"
                    style={{ background: 'linear-gradient(to bottom, transparent, rgba(var(--accent-rgb, 59, 130, 246), 0.8), transparent)' }}
                  />
                </>
              )}
            </AnimatePresence>
            {/* Trading Chart Background - Theme-aware accent grid - ENHANCED */}
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
                  backgroundImage: `linear-gradient(rgba(var(--accent-rgb, 59, 130, 246), 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb, 59, 130, 246), 0.3) 1px, transparent 1px)`,
                  backgroundSize: "50px 50px",
                }}
              />
            </div>
            
            {/* Navbar-style shimmer overlay - LEFT TO RIGHT (FPS-aware) - SMOOTHER */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to right, transparent, rgba(var(--accent-rgb, 59, 130, 246), 0.3), transparent)` }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: shimmerDuration * 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              />
            </div>

            {/* Trading Ticker Tape - Pure Black with theme accent border and shimmer */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-[#000000] overflow-hidden z-40" style={{ borderBottom: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)', boxShadow: '0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.4)' }}>
              {/* Left to right shimmer on ticker (FPS-aware) - SMOOTHER */}
              <motion.div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to right, transparent, rgba(var(--accent-rgb, 59, 130, 246), 0.4), transparent)` }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: shimmerDuration * 1.2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                animate={{ x: ["-100%", "0%"] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="flex items-center h-full gap-8 whitespace-nowrap text-xs font-mono relative z-10"
              >
                {[...Array(3)].map((_, i) => (
                  <React.Fragment key={i}>
                    <span className="text-blue-400 flex items-center gap-1"><span className="text-green-400">▲</span> BTC/USD +2.45%</span>
                    <span className="text-blue-300/70 flex items-center gap-1"><span className="text-red-400">▼</span> ETH/USD -1.23%</span>
                    <span className="text-blue-400 flex items-center gap-1"><span className="text-green-400">▲</span> SOL/USD +5.67%</span>
                    <span className="text-blue-400 flex items-center gap-1"><span className="text-green-400">▲</span> BNB/USD +3.21%</span>
                    <span className="text-blue-300/70 flex items-center gap-1"><span className="text-red-400">▼</span> ADA/USD -0.89%</span>
                    <span className="text-yellow-400 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> BULLMONEY LIVE</span>
                    <span className="text-yellow-400 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> BULLMONEY LIVE</span>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>

            {/* Radial Gradient Glow - Pure blue, subtle */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(var(--accent-rgb, 59, 130, 246), 0.2), rgba(var(--accent-rgb, 59, 130, 246), 0.08) 40%, transparent 70%)`,
              }}
              animate={{
                opacity: isHolding ? 0.8 : 0.4,
              }}
              transition={{ duration: 0.4 }}
            />

            {/* ═══════════════════════════════════════════════════════════════════
                MINIMAL FLOATING ORBS - Static glow, subtle drift only
                - No scale, no rotate, no shape changes
                - Just gentle position drift for ambient atmosphere
                - Theme-aware colors
                ═══════════════════════════════════════════════════════════════════ */}
            
            {/* Large ambient orb - top left */}
            <motion.div
              className="absolute w-80 h-80 rounded-full pointer-events-none"
              style={{
                top: '10%',
                left: '5%',
                background: `radial-gradient(circle at 40% 40%, rgba(var(--accent-rgb, 59, 130, 246), 0.12), transparent 60%)`,
                filter: 'blur(60px)',
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, 20, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Medium orb - bottom right */}
            <motion.div
              className="absolute w-64 h-64 rounded-full pointer-events-none"
              style={{
                bottom: '15%',
                right: '10%',
                background: `radial-gradient(circle at 50% 50%, rgba(var(--accent-rgb, 59, 130, 246), 0.1), transparent 55%)`,
                filter: 'blur(50px)',
              }}
              animate={{
                x: [0, -25, 0],
                y: [0, -15, 0],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Small accent orb - center right */}
            <motion.div
              className="absolute w-48 h-48 rounded-full pointer-events-none"
              style={{
                top: '40%',
                right: '20%',
                background: `radial-gradient(circle, rgba(var(--accent-rgb, 59, 130, 246), 0.15), transparent 50%)`,
                filter: 'blur(40px)',
              }}
              animate={{
                x: [0, -20, 0],
                y: [0, 25, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Tiny accent orb - bottom left */}
            <motion.div
              className="absolute w-32 h-32 rounded-full pointer-events-none"
              style={{
                bottom: '30%',
                left: '25%',
                background: `radial-gradient(circle, rgba(var(--accent-rgb, 59, 130, 246), 0.18), transparent 50%)`,
                filter: 'blur(30px)',
              }}
              animate={{
                x: [0, 15, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Asset Selector - positioned below live ticker, lowered z-index to not overlap icon */}
            <div className="absolute top-14 sm:top-16 left-0 right-0 z-20 pointer-events-none flex justify-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-1.5 sm:gap-2 pointer-events-auto"
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
                      "px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-black border-2 transition-all min-w-[44px] min-h-[44px] sm:min-w-[52px] sm:min-h-[52px] flex items-center gap-1 sm:gap-1.5 shadow-lg relative overflow-hidden",
                      key === selectedAsset
                        ? "bg-black text-blue-300 border-blue-500/90 shadow-[0_0_35px_rgba(59,130,246,0.7)]"
                        : "bg-black text-blue-200 border-blue-500/50 hover:border-blue-400/80 hover:bg-black"
                    )}
                    style={{
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {key === selectedAsset && (
                      <>
                        {/* Blue shimmer LEFT TO RIGHT like navbar (FPS-aware) */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/70 to-transparent z-0 rounded-full"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: shimmerDuration * 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                          layoutId="activeAsset"
                          className="absolute inset-[1px] bg-black rounded-full z-[1]"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      </>
                    )}
                    <span
                      className="text-lg relative z-10 leading-none"
                      style={{
                        color: asset.color,
                        textShadow: "0 0 12px rgba(0,0,0,0.45)",
                        fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Sans Symbols 2", "Noto Sans Symbols", "Arial Unicode MS", sans-serif',
                      }}
                    >
                      {asset.icon}
                    </span>
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
                      ? "0 0 60px rgba(59, 130, 246, 0.9), 0 0 120px rgba(59, 130, 246, 0.5)"
                      : "0 0 40px rgba(59, 130, 246, 0.6)",
                  }}
                  style={{ rotate: iconRotate }}
                  className="relative w-24 h-24 rounded-full bg-black border-2 border-blue-500/50 flex items-center justify-center text-5xl font-bold shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]"
                >
                  <span
                    className="relative z-10 leading-none"
                    style={{
                      color: ASSETS[selectedAsset].color,
                      textShadow: "0 0 16px rgba(0,0,0,0.6)",
                      fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Sans Symbols 2", "Noto Sans Symbols", "Arial Unicode MS", sans-serif',
                    }}
                  >
                    {ASSETS[selectedAsset].icon}
                  </span>
                </motion.div>
                
                {/* Pulse Rings - Blue theme */}
                {isHolding && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-[-8px] rounded-full border-2 border-blue-500"
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="absolute inset-[-12px] rounded-full border-2 border-blue-400/60"
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
                <div className="min-h-[40px] mt-2 flex flex-col items-center justify-center gap-3">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="completed"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 20 }}
                        className="text-sm font-bold text-green-400 flex items-center gap-2"
                      >
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                          <Trophy className="w-5 h-5" />
                        </motion.div>
                        {vaultUnlocked ? "VAULT UNLOCKED" : "ACCESS GRANTED"}
                      </motion.div>
                    ) : isHolding ? (
                      <motion.div
                        key="holding"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="text-xs font-bold text-blue-400 flex items-center gap-2"
                      >
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>
                          <Rocket className="w-4 h-4" />
                        </motion.div>
                        {progress > 70 ? (
                          <span className="flex items-center gap-1">ALMOST THERE <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3, repeat: Infinity }}><Flame className="w-4 h-4 text-orange-400" /></motion.span></span>
                        ) : progress > 40 ? (
                          <span className="flex items-center gap-1">KEEP GOING <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.4, repeat: Infinity }}><Dumbbell className="w-4 h-4" /></motion.span></span>
                        ) : (
                          <span className="flex items-center gap-1">PUMPING <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 0.3, repeat: Infinity }}><TrendingUp className="w-4 h-4" /></motion.span></span>
                        )}
                      </motion.div>
                    ) : progress > 0 ? (
                      <motion.div
                        key="releasing"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="text-xs font-medium text-yellow-400 flex items-center gap-2"
                      >
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.2, repeat: Infinity }}>
                          <Zap className="w-4 h-4" />
                        </motion.div>
                        <span className="flex items-center gap-1">Don&apos;t let go! <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5, repeat: Infinity }}><Diamond className="w-4 h-4 text-cyan-400" /></motion.span></span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  
                  {/* ═══════════════════════════════════════════════════════════════════
                      ACCESS WEBSITE BUTTON - Appears after vault is unlocked
                      Tap to open the vault doors and enter the site
                      ═══════════════════════════════════════════════════════════════════ */}
                  <AnimatePresence>
                    {vaultUnlocked && !vaultOpening && (
                      <motion.button
                        key="access-button"
                        initial={{ scale: 0, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: -10, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={handleVaultAccess}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="relative mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 min-h-[44px] rounded-full font-extrabold text-[11px] sm:text-sm uppercase tracking-[0.2em] overflow-hidden group"
                        style={{
                          background: 'linear-gradient(180deg, rgba(2,6,23,0.98) 0%, rgba(2,6,23,0.9) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          boxShadow: '0 0 25px rgba(59,130,246,0.55), inset 0 0 18px rgba(59,130,246,0.15)',
                          color: '#93c5fd',
                        }}
                        whileHover={{ scale: 1.03, boxShadow: '0 0 45px rgba(59,130,246,0.8), inset 0 0 26px rgba(59,130,246,0.25)' }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {/* Animated shimmer sweep */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/25 to-transparent"
                          animate={{ x: ["-160%", "160%"] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                        />
                        
                        {/* Pulsing glow ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ border: '1px solid rgba(59, 130, 246, 0.45)' }}
                          animate={{ 
                            scale: [1, 1.06, 1],
                            opacity: [0.4, 0.85, 0.4],
                          }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        
                        {/* Button content */}
                        <span className="relative z-10 flex items-center gap-2">
                          <motion.span
                            className="text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <LockOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          </motion.span>
                          Tap / Click to Unlock
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </motion.span>
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Progress Display - Hide when vault is unlocked - Hide when vault is unlocked */}
              <AnimatePresence>
              {!vaultUnlocked && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-md flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 text-2xl md:text-3xl font-black tracking-tighter">
                  <motion.span
                    animate={{
                      scale: isHolding ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: isHolding ? Infinity : 0,
                    }}
                    style={{
                      color: progress > 50 ? "#60a5fa" : "#ffffff",
                      textShadow: progress > 50 ? "0 0 25px rgba(59,130,246,0.8)" : "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {progress === 0 ? "HOLD TO PUMP" : progress >= 100 ? "TO THE MOON" : `${Math.floor(progress)}%`}
                  </motion.span>
                  <motion.div
                    animate={{
                      rotate: isHolding ? 360 : 0,
                      x: isHolding ? 8 : 0,
                      y: isHolding ? -8 : 0,
                    }}
                    transition={{
                      rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                    }}
                  >
                    <Rocket
                      className="w-7 h-7"
                      style={{
                        color: progress > 50 ? "#60a5fa" : "#ffffff",
                      }}
                    />
                  </motion.div>
                </div>
                <div className="w-full h-2.5 bg-[#000000] border border-blue-500/50 rounded-full overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.3)]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 relative"
                    style={{ width: `${progress}%` }}
                  >
                    {isHolding && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: shimmerDuration * 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>
              )}
              </AnimatePresence>

              {/* Animated Icon Particles */}
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, scale: 1, rotate: 0 }}
                  animate={{ opacity: 0, scale: 0.5, rotate: 180 }}
                  transition={{ duration: 0.8 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: p.x,
                    top: p.y,
                  }}
                >
                  {renderParticleIcon(p.iconType || "sparkle")}
                </motion.div>
              ))}

              {/* Helper Tip - Navbar style - SMOOTHER */}
              <AnimatePresence>
                {showTip && progress === 0 && (
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    className="pointer-events-none mt-6 flex items-center gap-2 text-xs text-blue-50 bg-[#000000] px-5 py-2.5 rounded-full border border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.4)] relative overflow-hidden"
                  >
                    {/* Left to right shimmer (FPS-aware) - SMOOTHER */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: shimmerDuration * 1.4, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Pulse indicator */}
                    <div className="relative flex h-2 w-2 shrink-0 z-10">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </div>
                    <span className="relative z-10 flex items-center gap-1 font-medium"><Diamond className="w-3 h-3" /> Hold anywhere until 100% <Rocket className="w-3 h-3" /></span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Completion Effect - Snappy burst */}
            {isCompleted && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: [0, 0.9, 0] }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-blue-500/40 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 0] }}
                  transition={{ duration: 0.4, times: [0, 0.5, 1] }}
                  className="absolute w-full h-full flex items-center justify-center pointer-events-none"
                >
                  {/* Burst of animated icons */}
                  {[Rocket, CircleDollarSign, BarChart3, Zap, Flame, Diamond, Moon, Sparkles, Target, Dumbbell, Trophy, Star].map((Icon, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        x: Math.cos((i / 12) * Math.PI * 2) * 180,
                        y: Math.sin((i / 12) * Math.PI * 2) * 180,
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 0.6, delay: i * 0.03 }}
                      className="absolute"
                    >
                      <Icon className="w-8 h-8 text-blue-400" />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Content After Gate - Pure Black/Blue navbar theme */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-[#000000] flex items-center justify-center p-8 relative overflow-hidden"
          >
            {/* Blue shimmer background - LEFT TO RIGHT (FPS-aware) - SMOOTHER */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: shimmerDuration * 3, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
              />
            </div>
            
            <div className="text-center text-white flex flex-col items-center gap-4 relative z-10">
              {/* BullMoney Logo */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                {/* Glow effect behind logo - subtle */}
                <div className="absolute inset-[-20px] bg-blue-500/30 rounded-full blur-2xl" />
                <div className="relative w-32 h-32 rounded-full bg-[#000000] border border-blue-500/60 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] overflow-hidden">
                  {/* Left to right shimmer on logo container (FPS-aware) - SMOOTHER */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: shimmerDuration * 1.2, repeat: Infinity, ease: "linear" }}
                  />
                  <Image
                    src="/BULL.svg"
                    alt="BullMoney Logo"
                    width={80}
                    height={80}
                    className="object-contain relative z-10"
                  />
                </div>
                {/* Celebration icons around logo */}
                {[Rocket, CircleDollarSign, TrendingUp, Zap].map((Icon, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      x: Math.cos((i / 4) * Math.PI * 2) * 80,
                      y: Math.sin((i / 4) * Math.PI * 2) * 80,
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ 
                      delay: 0.2 + i * 0.1, 
                      scale: { type: "spring", stiffness: 200, damping: 10 },
                      opacity: { duration: 0.3 },
                      x: { type: "spring", stiffness: 200, damping: 15 },
                      y: { type: "spring", stiffness: 200, damping: 15 },
                      rotate: { repeat: Infinity, duration: 1, ease: "easeInOut" } 
                    }}
                    className="absolute"
                    style={{ left: "50%", top: "50%" }}
                  >
                    <Icon className="w-6 h-6 text-blue-400" />
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="text-5xl font-black bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent"
              >
                Welcome to BullMoney
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-blue-100/80 max-w-md"
              >
                You&apos;ve successfully accessed the site. Your {ASSETS[selectedAsset].id} is ready to pump!
              </motion.p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                className="mt-4 flex gap-2"
              >
                <div className="px-4 py-2 bg-[#000000] border border-blue-500/60 rounded-full text-sm font-bold text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.4)] relative overflow-hidden">
                  {/* Shimmer effect (FPS-aware) - SMOOTHER */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: shimmerDuration * 1.2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                  />
                  <span className="relative z-10">{ASSETS[selectedAsset].icon} {ASSETS[selectedAsset].id}</span>
                </div>
                <div className="px-4 py-2 bg-[#000000] border border-green-500/60 rounded-full text-sm font-bold text-green-200 shadow-[0_0_18px_rgba(34,197,94,0.4)]">
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
