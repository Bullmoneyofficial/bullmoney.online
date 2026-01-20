"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Zap, 
  Target, 
  Timer, 
  BarChart3,
  ArrowUpRight,
  ChevronUp,
  Fingerprint,
  Eye,
  Grip,
  RotateCcw,
  RefreshCw,
  MousePointer2,
  Volume2,
  Smartphone,
  Circle,
  Waves,
  ArrowRight,
  ArrowLeft,
  Hash,
  Repeat,
  Sparkles,
  Heart,
  Star,
  Compass,
  Move,
  RotateCw,
  Maximize2,
  Minimize2,
  Hand,
  Gauge,
  Radio,
  Navigation,
  FlipVertical,
  Sun,
  Keyboard,
  Music,
  Gamepad2,
  ArrowUp,
  ArrowDown,
  Monitor,
  Mouse,
  ScrollText,
  GripHorizontal,
  ZoomIn,
  Footprints,
  Sun as Brightness,
  Layers,
  type LucideIcon
} from "lucide-react";

// Pinch icon fallback since lucide doesn't have one
const PinchZoomIcon = ZoomIn;

// ============================================================================
// NEON BLUE GLOW THEME - OLED BLACK BACKGROUND (MATCHING CHARTNEWS #3b82f6)
// ============================================================================
const NEON_BLUE = "#3b82f6";
const NEON_BLUE_RGB = "59, 130, 246";

const NEON_STYLES = `
  @keyframes ring-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes candlestick-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  @keyframes price-ticker {
    0% { transform: translateY(100%); opacity: 0; }
    10% { transform: translateY(0); opacity: 1; }
    90% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-100%); opacity: 0; }
  }

  @keyframes confetti-fall {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @keyframes confetti-sway {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(20px); }
  }

  @keyframes combo-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
  }

  @keyframes streak-glow {
    0%, 100% { box-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6; }
    50% { box-shadow: 0 0 15px #3b82f6, 0 0 30px #3b82f6, 0 0 45px #3b82f6; }
  }

  @keyframes achievement-pop {
    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
    60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  @keyframes float-up {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
  }

  @keyframes rainbow-shift {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }

  @keyframes electric-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  @keyframes bounce-in {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .neon-text {
    color: #fff;
    text-shadow: 
      0 0 4px #fff,
      0 0 8px #fff,
      0 0 12px #3b82f6,
      0 0 20px #3b82f6;
  }

  .neon-border {
    border: 2px solid #3b82f6;
    border-radius: 9999px;
    box-shadow: 
      0 0 4px #3b82f6,
      0 0 8px #3b82f6,
      0 0 16px #3b82f6,
      inset 0 0 4px rgba(59, 130, 246, 0.3);
  }

  .neon-icon {
    color: #3b82f6;
    filter: drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6);
  }

  .candlestick {
    animation: candlestick-bounce 1s ease-in-out infinite;
  }

  .combo-active {
    animation: combo-pulse 0.5s ease-in-out infinite;
  }

  .streak-glow {
    animation: streak-glow 1s ease-in-out infinite;
  }

  .rainbow-text {
    animation: rainbow-shift 3s linear infinite;
  }

  .shimmer-bg {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }
`;

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; left: number; color: string }> = ({ delay, left, color }) => (
  <div
    className="fixed pointer-events-none"
    style={{
      left: `${left}%`,
      top: -20,
      width: 10,
      height: 10,
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      animation: `confetti-fall ${2 + Math.random() * 2}s linear ${delay}s forwards`,
      zIndex: 100,
    }}
  />
);

// Achievement badge component
const AchievementBadge: React.FC<{ icon: React.ReactNode; label: string; show: boolean }> = ({ icon, label, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(0, 0, 0, 0.9))',
          border: '2px solid #3b82f6',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
        }}
        initial={{ x: 100, opacity: 0, scale: 0.5 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 100, opacity: 0, scale: 0.5 }}
        transition={{ type: 'spring', bounce: 0.5 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-blue-400 font-medium">ACHIEVEMENT</p>
          <p className="text-white font-bold">{label}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Floating score popup
const FloatingScore: React.FC<{ value: string; x: number; y: number; id: number }> = ({ value, x, y }) => (
  <motion.div
    className="fixed pointer-events-none font-bold text-xl"
    style={{
      left: x,
      top: y,
      color: '#3b82f6',
      textShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6',
      zIndex: 60,
    }}
    initial={{ opacity: 1, y: 0, scale: 1 }}
    animate={{ opacity: 0, y: -60, scale: 1.5 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
  >
    {value}
  </motion.div>
);

// ============================================================================
// TYPES & CONFIG
// ============================================================================
type AssetKey = "BTC" | "ETH" | "SOL";
type InteractionMode = 
  | "hold" | "swipe" | "tap" | "rotate" | "pattern" | "shake" | "doubleTap" 
  | "longPress" | "zigzag" | "pulse" | "breath" | "spiral" | "circle" | "scratch"
  | "morse" | "alternate" | "countdown" | "corners" | "infinity" | "slider"
  | "tripleTap" | "speedTap" | "tilt" | "flip" | "compass" | "proximity"
  // New Desktop keyboard modes
  | "konami" | "typeWord" | "piano" | "wasd" | "arrows" | "spaceMash" | "altTab"
  // New Desktop mouse modes  
  | "doubleClick" | "rightClick" | "scrollWheel" | "dragDrop" | "hoverZone"
  // New Mobile sensor modes
  | "faceDown" | "lightSensor" | "stepCounter" | "squeeze" | "multiTouch" | "pinchZoom";

interface LoaderProps {
  onFinished?: () => void;
}

const ASSETS: Record<AssetKey, { symbol: string; icon: string; color: string }> = {
  BTC: { symbol: "BINANCE:BTCUSDT", icon: "₿", color: "#F7931A" },
  ETH: { symbol: "BINANCE:ETHUSDT", icon: "Ξ", color: "#627EEA" },
  SOL: { symbol: "BINANCE:SOLUSDT", icon: "◎", color: "#14F195" },
};

// Detect mobile device
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};

// Check if running in Instagram/Facebook in-app browser
const isInAppBrowser = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor;
  return /FBAN|FBAV|Instagram|FB_IAB|FB4A|FBIOS|WebView/i.test(ua);
};

// Check if device motion/orientation is supported and available
const checkSensorSupport = () => {
  const hasMotion = typeof DeviceMotionEvent !== 'undefined';
  const hasOrientation = typeof DeviceOrientationEvent !== 'undefined';
  const needsPermission = hasMotion && typeof (DeviceMotionEvent as any)?.requestPermission === 'function';
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || location.protocol === 'https:');
  const inApp = isInAppBrowser();
  
  return {
    motion: hasMotion && isSecure && !inApp,
    orientation: hasOrientation && isSecure && !inApp,
    needsPermission,
    isSecure,
    isInAppBrowser: inApp,
  };
};

interface InteractionModeConfig { 
  mode: InteractionMode; 
  icon: React.ComponentType<{ className?: string; size?: number }>; 
  label: string; 
  instruction: string;
  tradingMetaphor: string;
  mobileOnly?: boolean; // Only show on mobile devices
  desktopOnly?: boolean; // Only show on desktop devices
}

const INTERACTION_MODES: InteractionModeConfig[] = [
  // ===== UNIVERSAL MODES (work on all devices) =====
  { 
    mode: "hold", 
    icon: Fingerprint, 
    label: "HOLD", 
    instruction: "Hold to unlock",
    tradingMetaphor: "Diamond hands hold through volatility"
  },
  { 
    mode: "swipe", 
    icon: ChevronUp, 
    label: "SWIPE", 
    instruction: "Swipe up to unlock",
    tradingMetaphor: "Ride the uptrend to profits"
  },
  { 
    mode: "tap", 
    icon: Target, 
    label: "TAP", 
    instruction: "Tap rapidly to unlock",
    tradingMetaphor: "Consistent action builds wealth"
  },
  { 
    mode: "rotate", 
    icon: RotateCcw, 
    label: "ROTATE", 
    instruction: "Rotate clockwise to unlock",
    tradingMetaphor: "Markets cycle - patience wins"
  },
  { 
    mode: "pattern", 
    icon: Grip, 
    label: "PATTERN", 
    instruction: "Draw a Z pattern",
    tradingMetaphor: "Read the charts, follow the trend"
  },
  { 
    mode: "doubleTap", 
    icon: MousePointer2, 
    label: "DOUBLE TAP", 
    instruction: "Double tap quickly",
    tradingMetaphor: "Confirm your conviction before entry"
  },
  { 
    mode: "longPress", 
    icon: Timer, 
    label: "LONG PRESS", 
    instruction: "Press and hold for 3 seconds",
    tradingMetaphor: "Time in the market beats timing"
  },
  { 
    mode: "zigzag", 
    icon: Waves, 
    label: "ZIGZAG", 
    instruction: "Swipe left-right-left",
    tradingMetaphor: "Navigate the market's waves"
  },
  { 
    mode: "pulse", 
    icon: Circle, 
    label: "PULSE", 
    instruction: "Tap to the rhythm",
    tradingMetaphor: "Feel the market's heartbeat"
  },
  { 
    mode: "breath", 
    icon: Volume2, 
    label: "BREATHE", 
    instruction: "Hold, release, hold, release",
    tradingMetaphor: "Stay calm in chaos"
  },
  { 
    mode: "spiral", 
    icon: RotateCw, 
    label: "SPIRAL", 
    instruction: "Draw a spiral inward",
    tradingMetaphor: "Focus narrows toward profit"
  },
  { 
    mode: "circle", 
    icon: Circle, 
    label: "CIRCLE", 
    instruction: "Draw a complete circle",
    tradingMetaphor: "Complete the cycle, reap rewards"
  },
  { 
    mode: "scratch", 
    icon: Hand, 
    label: "SCRATCH", 
    instruction: "Scratch the center rapidly",
    tradingMetaphor: "Uncover hidden opportunities"
  },
  { 
    mode: "morse", 
    icon: Radio, 
    label: "MORSE", 
    instruction: "Tap: short-short-long",
    tradingMetaphor: "Signal your intent clearly"
  },
  { 
    mode: "alternate", 
    icon: Repeat, 
    label: "ALTERNATE", 
    instruction: "Tap left and right sides",
    tradingMetaphor: "Balance risk and reward"
  },
  { 
    mode: "countdown", 
    icon: Gauge, 
    label: "COUNTDOWN", 
    instruction: "Hold until countdown ends",
    tradingMetaphor: "Patience is the key to timing"
  },
  { 
    mode: "corners", 
    icon: Maximize2, 
    label: "CORNERS", 
    instruction: "Tap all four corners",
    tradingMetaphor: "Cover all your bases"
  },
  { 
    mode: "infinity", 
    icon: Repeat, 
    label: "INFINITY", 
    instruction: "Draw a figure-8 pattern",
    tradingMetaphor: "Infinite possibilities await"
  },
  { 
    mode: "slider", 
    icon: ArrowRight, 
    label: "SLIDE", 
    instruction: "Slide from left to right",
    tradingMetaphor: "Smooth entry, smooth profits"
  },
  { 
    mode: "tripleTap", 
    icon: Hash, 
    label: "TRIPLE TAP", 
    instruction: "Triple tap quickly",
    tradingMetaphor: "Third time's the charm"
  },
  { 
    mode: "speedTap", 
    icon: Zap, 
    label: "SPEED TAP", 
    instruction: "Tap 20 times in 5 seconds",
    tradingMetaphor: "Speed execution wins in volatile markets"
  },
  
  // ===== MOBILE-ONLY MODES =====
  { 
    mode: "shake", 
    icon: RefreshCw, 
    label: "SHAKE", 
    instruction: "Shake your device",
    tradingMetaphor: "Shake off fear and doubt",
    mobileOnly: true
  },
  { 
    mode: "tilt", 
    icon: Navigation, 
    label: "TILT", 
    instruction: "Tilt device forward and back",
    tradingMetaphor: "Adjust your perspective"
  },
  { 
    mode: "flip", 
    icon: FlipVertical, 
    label: "FLIP", 
    instruction: "Flip device face down and back",
    tradingMetaphor: "Sometimes you need to walk away",
    mobileOnly: true
  },
  { 
    mode: "compass", 
    icon: Compass, 
    label: "COMPASS", 
    instruction: "Rotate device to face North",
    tradingMetaphor: "Find your true direction",
    mobileOnly: true
  },
  { 
    mode: "proximity", 
    icon: Eye, 
    label: "PROXIMITY", 
    instruction: "Cover and uncover the screen",
    tradingMetaphor: "Know when to look away",
    mobileOnly: true
  },
  
  // ===== DESKTOP KEYBOARD MODES =====
  { 
    mode: "konami", 
    icon: Gamepad2, 
    label: "KONAMI CODE", 
    instruction: "↑↑↓↓←→←→BA",
    tradingMetaphor: "Legends know the secret moves",
    desktopOnly: true
  },
  { 
    mode: "typeWord", 
    icon: Keyboard, 
    label: "TYPE IT", 
    instruction: "Type 'BULLMONEY'",
    tradingMetaphor: "Spell out your success",
    desktopOnly: true
  },
  { 
    mode: "piano", 
    icon: Music, 
    label: "PIANO", 
    instruction: "Play: A S D F G",
    tradingMetaphor: "Trading is an art form",
    desktopOnly: true
  },
  { 
    mode: "wasd", 
    icon: Gamepad2, 
    label: "GAMER", 
    instruction: "Press W A S D in order",
    tradingMetaphor: "Navigate the markets like a pro",
    desktopOnly: true
  },
  { 
    mode: "arrows", 
    icon: Move, 
    label: "ARROWS", 
    instruction: "↑→↓← in sequence",
    tradingMetaphor: "Direction matters in trading",
    desktopOnly: true
  },
  { 
    mode: "spaceMash", 
    icon: Keyboard, 
    label: "SPACE MASH", 
    instruction: "Mash SPACEBAR 15 times",
    tradingMetaphor: "Sometimes you gotta go full send",
    desktopOnly: true
  },
  { 
    mode: "altTab", 
    icon: Monitor, 
    label: "ALT+TAB", 
    instruction: "Press Ctrl+B 3 times",
    tradingMetaphor: "Bulls always come back",
    desktopOnly: true
  },
  
  // ===== DESKTOP MOUSE MODES =====
  { 
    mode: "doubleClick", 
    icon: Mouse, 
    label: "DOUBLE CLICK", 
    instruction: "Double-click 5 times",
    tradingMetaphor: "Confirm before you commit",
    desktopOnly: true
  },
  { 
    mode: "rightClick", 
    icon: Mouse, 
    label: "RIGHT CLICK", 
    instruction: "Right-click the center 3 times",
    tradingMetaphor: "Explore all your options",
    desktopOnly: true
  },
  { 
    mode: "scrollWheel", 
    icon: ScrollText, 
    label: "SCROLL", 
    instruction: "Scroll up to unlock",
    tradingMetaphor: "Scroll through the charts",
    desktopOnly: true
  },
  { 
    mode: "dragDrop", 
    icon: GripHorizontal, 
    label: "DRAG & DROP", 
    instruction: "Drag the coin to the vault",
    tradingMetaphor: "Secure your profits",
    desktopOnly: true
  },
  { 
    mode: "hoverZone", 
    icon: Target, 
    label: "HOVER", 
    instruction: "Hover over all 4 zones",
    tradingMetaphor: "Scout the territory first",
    desktopOnly: true
  },
  
  // ===== MORE MOBILE SENSOR MODES =====
  { 
    mode: "faceDown", 
    icon: Smartphone, 
    label: "FACE DOWN", 
    instruction: "Place phone face-down for 2s",
    tradingMetaphor: "Step away and let it cook",
    mobileOnly: true
  },
  { 
    mode: "lightSensor", 
    icon: Sun, 
    label: "LIGHT", 
    instruction: "Cover camera, then expose to light",
    tradingMetaphor: "From darkness comes opportunity",
    mobileOnly: true
  },
  { 
    mode: "stepCounter", 
    icon: Footprints, 
    label: "WALK", 
    instruction: "Take 5 steps",
    tradingMetaphor: "Every journey starts with a step",
    mobileOnly: true
  },
  { 
    mode: "squeeze", 
    icon: Hand, 
    label: "SQUEEZE", 
    instruction: "Squeeze both sides of phone",
    tradingMetaphor: "Apply pressure for results",
    mobileOnly: true
  },
  { 
    mode: "multiTouch", 
    icon: Layers, 
    label: "MULTI-TOUCH", 
    instruction: "Use 3 fingers at once",
    tradingMetaphor: "Diversify your approach",
    mobileOnly: true
  },
  { 
    mode: "pinchZoom", 
    icon: ZoomIn, 
    label: "PINCH ZOOM", 
    instruction: "Pinch in and out 3 times",
    tradingMetaphor: "Zoom out to see the bigger picture",
    mobileOnly: true
  },
];

const TRADING_QUOTES = [
  "Patience is the trader's greatest asset",
  "Those who can't wait can't win",
  "Discipline unlocks profits",
  "Master yourself, master the market",
  "Quick fingers lose money, patient minds make it",
];

// Encouraging messages that appear at different progress levels
const ENCOURAGEMENT_MESSAGES: Record<number, string[]> = {
  25: ["Nice start!", "You're getting it!", "Keep going!", "That's the spirit!"],
  50: ["Halfway there!", "You're crushing it!", "Almost there!", "Looking good!"],
  75: ["So close!", "Final stretch!", "You've got this!", "Don't stop now!"],
  90: ["ALMOST!", "Just a bit more!", "Victory is near!", "FINISH STRONG!"],
};

// ============================================================================
// UTILS
// ============================================================================
const formatPrice = (value: number) =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(" ");

// ============================================================================
// LIVE PRICE HOOK - FAST POLLING
// ============================================================================
const useLivePrice = (assetKey: AssetKey) => {
  const [price, setPrice] = useState<number>(0);
  const [change24h, setChange24h] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    let pollId: ReturnType<typeof setInterval> | null = null;
    
    const fetchPrice = async () => {
      try {
        const symbolParts = ASSETS[assetKey].symbol.split(":");
        const symbol = symbolParts[1]?.toUpperCase();
        if (!symbol) return;

        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const p = parseFloat(data.lastPrice);
        const change = parseFloat(data.priceChangePercent);
        if (!Number.isNaN(p)) setPrice(p);
        if (!Number.isNaN(change)) setChange24h(change);
      } catch {
        // Silently fail
      }
    };

    fetchPrice();
    pollId = setInterval(fetchPrice, 3000); // Poll every 3 seconds

    return () => {
      controller.abort();
      if (pollId) clearInterval(pollId);
    };
  }, [assetKey]);

  return { price, change24h };
};

// ============================================================================
// HAPTIC FEEDBACK - VIBRATION API
// ============================================================================
const useHaptics = () => {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently fail
      }
    }
  }, []);

  // Light tap - quick feedback
  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  
  // Medium tap - standard interaction
  const mediumTap = useCallback(() => vibrate(25), [vibrate]);
  
  // Heavy tap - important actions
  const heavyTap = useCallback(() => vibrate(50), [vibrate]);
  
  // Double pulse - confirmations
  const doublePulse = useCallback(() => vibrate([30, 50, 30]), [vibrate]);
  
  // Success pattern - completion
  const successPattern = useCallback(() => vibrate([50, 100, 50, 100, 100]), [vibrate]);
  
  // Error/warning pattern
  const errorPattern = useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  
  // Rhythm pattern for pulse mode
  const rhythmPulse = useCallback(() => vibrate([20, 80, 20]), [vibrate]);
  
  // Shake pattern
  const shakePattern = useCallback(() => vibrate([15, 30, 15, 30, 15]), [vibrate]);

  return { 
    lightTap, 
    mediumTap, 
    heavyTap, 
    doublePulse, 
    successPattern, 
    errorPattern, 
    rhythmPulse,
    shakePattern,
    vibrate 
  };
};

// ============================================================================
// AUDIO ENGINE - ENHANCED WITH MORE SOUNDS
// ============================================================================
const useAudioEngine = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = AudioContextClass ? new AudioContextClass() : null;
      } catch {
        return null;
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx?.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }, []);

  // Standard tick sound
  const playTick = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }, [initAudio]);

  // Higher pitch tick for taps
  const playTap = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }, [initAudio]);

  // Swipe whoosh sound
  const playSwipe = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }, [initAudio]);

  // Key press sound (keyboard modes)
  const playKey = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }, [initAudio]);

  // Piano note sound
  const playNote = useCallback((noteIndex: number) => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // C major scale frequencies
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00];
    const freq = notes[noteIndex % notes.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }, [initAudio]);

  // Scroll/slide sound
  const playSlide = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(500, now + 0.05);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }, [initAudio]);

  // Shake rattle sound
  const playShake = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Create noise-like effect
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(200 + Math.random() * 400, now + i * 0.02);

      gain.gain.setValueAtTime(0.03, now + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.02);
      osc.stop(now + i * 0.02 + 0.04);
    }
  }, [initAudio]);

  // Click sound for buttons
  const playClick = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.02);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }, [initAudio]);

  // Completion success sound
  const playSuccess = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const delay = i * 0.04;
      const volume = 0.12 - (i * 0.02);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + 0.6);
    });
  }, [initAudio]);

  return { 
    playTick, 
    playTap, 
    playSwipe, 
    playKey, 
    playNote, 
    playSlide, 
    playShake, 
    playClick, 
    playSuccess 
  };
};

// ============================================================================
// COMBINED FEEDBACK SYSTEM (AUDIO + HAPTICS)
// ============================================================================
const useFeedback = () => {
  const audio = useAudioEngine();
  const haptics = useHaptics();
  
  // Tick feedback - general progress
  const tickFeedback = useCallback(() => {
    audio.playTick();
    haptics.lightTap();
  }, [audio, haptics]);
  
  // Tap feedback - button presses, taps
  const tapFeedback = useCallback(() => {
    audio.playTap();
    haptics.mediumTap();
  }, [audio, haptics]);
  
  // Swipe feedback - swipe actions
  const swipeFeedback = useCallback(() => {
    audio.playSwipe();
    haptics.mediumTap();
  }, [audio, haptics]);
  
  // Key feedback - keyboard presses
  const keyFeedback = useCallback(() => {
    audio.playKey();
    haptics.lightTap();
  }, [audio, haptics]);
  
  // Piano note feedback
  const noteFeedback = useCallback((noteIndex: number) => {
    audio.playNote(noteIndex);
    haptics.mediumTap();
  }, [audio, haptics]);
  
  // Slide feedback - slider, scroll
  const slideFeedback = useCallback(() => {
    audio.playSlide();
    haptics.lightTap();
  }, [audio, haptics]);
  
  // Shake feedback
  const shakeFeedback = useCallback(() => {
    audio.playShake();
    haptics.shakePattern();
  }, [audio, haptics]);
  
  // Click feedback - double click, right click
  const clickFeedback = useCallback(() => {
    audio.playClick();
    haptics.heavyTap();
  }, [audio, haptics]);
  
  // Success feedback - completion
  const successFeedback = useCallback(() => {
    audio.playSuccess();
    haptics.successPattern();
  }, [audio, haptics]);
  
  // Rhythm feedback - pulse mode
  const rhythmFeedback = useCallback(() => {
    audio.playTick();
    haptics.rhythmPulse();
  }, [audio, haptics]);
  
  // Double pulse feedback - confirmations
  const doublePulseFeedback = useCallback(() => {
    audio.playTap();
    haptics.doublePulse();
  }, [audio, haptics]);
  
  // Hold feedback - long press start
  const holdFeedback = useCallback(() => {
    audio.playTick();
    haptics.heavyTap();
  }, [audio, haptics]);
  
  return {
    tickFeedback,
    tapFeedback,
    swipeFeedback,
    keyFeedback,
    noteFeedback,
    slideFeedback,
    shakeFeedback,
    clickFeedback,
    successFeedback,
    rhythmFeedback,
    doublePulseFeedback,
    holdFeedback,
    // Also expose raw functions
    audio,
    haptics
  };
};

// ============================================================================
// CANDLESTICK COMPONENT
// ============================================================================
const CandlestickBars: React.FC<{ progress: number }> = ({ progress }) => {
  // Using consistent #3b82f6 (#3b82f6) color scheme with opacity variations
  const bars = [
    { delay: 0.1, color: progress > 20 ? "#3b82f6" : "rgba(59, 130, 246, 0.3)", height: 24 },
    { delay: 0.2, color: progress > 40 ? "#3b82f6" : "rgba(59, 130, 246, 0.3)", height: 36 },
    { delay: 0.1, color: progress > 60 ? "#3b82f6" : "rgba(59, 130, 246, 0.3)", height: 28 },
    { delay: 0.3, color: progress > 80 ? "#3b82f6" : "rgba(59, 130, 246, 0.3)", height: 32 },
  ];

  return (
    <div className="flex items-end justify-center gap-1 h-16">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="flex flex-col items-center"
          style={{
            animation: `candlestick-bounce 1s ease-in-out infinite ${bar.delay}s`,
          }}
        >
          <div
            className="w-0.5 rounded-full transition-all duration-300"
            style={{
              height: 6,
              backgroundColor: bar.color,
              boxShadow: `0 0 6px ${bar.color}`,
            }}
          />
          <div
            className="w-2 rounded-sm transition-all duration-500"
            style={{
              height: bar.height * (0.5 + progress / 200),
              backgroundColor: bar.color,
              boxShadow: `0 0 10px ${bar.color}, 0 0 20px ${bar.color}`,
            }}
          />
          <div
            className="w-0.5 rounded-full transition-all duration-300"
            style={{
              height: 6,
              backgroundColor: bar.color,
              boxShadow: `0 0 6px ${bar.color}`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// BACKGROUND CANDLESTICKS
// ============================================================================
const BackgroundCandlesticks: React.FC = () => {
  // Generate random candlestick data for background - larger and more spread out
  const candlesticks = useMemo(() => {
    const sticks = [];
    for (let i = 0; i < 20; i++) {
      const isGreen = Math.random() > 0.45;
      const bodyHeight = 60 + Math.random() * 150; // Larger bodies (60-210px)
      const wickTop = 15 + Math.random() * 50; // Larger wicks
      const wickBottom = 15 + Math.random() * 50;
      const delay = Math.random() * 2;
      const xPos = (i / 20) * 100;
      const yOffset = Math.random() * 100 - 50; // More vertical spread
      
      sticks.push({
        id: i,
        isGreen,
        bodyHeight,
        wickTop,
        wickBottom,
        delay,
        xPos,
        yOffset,
      });
    }
    return sticks;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.08 }}>
      <div className="absolute inset-0 flex items-center">
        {candlesticks.map((stick) => (
          <div
            key={stick.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${stick.xPos}%`,
              top: `calc(50% + ${stick.yOffset}px)`,
              transform: 'translateY(-50%)',
              animation: `candlestick-bounce ${1.5 + stick.delay}s ease-in-out infinite ${stick.delay}s`,
            }}
          >
            {/* Top wick */}
            <div
              className="rounded-full"
              style={{
                width: 3,
                height: stick.wickTop,
                backgroundColor: "#3b82f6",
              }}
            />
            {/* Body */}
            <div
              className="rounded-sm"
              style={{
                width: 12, // Wider bodies
                height: stick.bodyHeight,
                backgroundColor: "#3b82f6",
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
              }}
            />
            {/* Bottom wick */}
            <div
              className="rounded-full"
              style={{
                width: 3,
                height: stick.wickBottom,
                backgroundColor: "#3b82f6",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// NEON RING PROGRESS
// ============================================================================
const NeonRing: React.FC<{ progress: number; size: number }> = ({ progress, size }) => {
  const circumference = 2 * Math.PI * (size / 2 - 4);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="absolute"
      style={{ 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%) rotate(-90deg)" 
      }}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        stroke="rgba(59, 130, 246, 0.1)"
        strokeWidth="3"
        fill="none"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        stroke="url(#neonGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{
          transition: "stroke-dashoffset 0.15s ease-out",
          filter: "drop-shadow(0 0 6px #3b82f6) drop-shadow(0 0 12px #3b82f6)",
        }}
      />
      <defs>
        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#fff" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ============================================================================
// MAIN LOADER COMPONENT
// ============================================================================
export default function TradingUnlockLoader({ onFinished }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [quote, setQuote] = useState(TRADING_QUOTES[0]);
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("BTC");
  const [isMobile, setIsMobile] = useState(false);
  const [sensorSupport, setSensorSupport] = useState<{
    motion: boolean;
    orientation: boolean;
    needsPermission: boolean;
    isSecure: boolean;
    isInAppBrowser: boolean;
  }>({ motion: false, orientation: false, needsPermission: false, isSecure: true, isInAppBrowser: false });
  const [sensorPermissionGranted, setSensorPermissionGranted] = useState(false);
  
  // Sensor-based modes that need device motion/orientation
  const SENSOR_MODES: InteractionMode[] = ['shake', 'tilt', 'flip', 'compass', 'faceDown', 'stepCounter'];
  
  // Filter modes based on device type and sensor support
  const availableModes = useMemo(() => {
    let modes: InteractionModeConfig[];
    
    if (isMobile) {
      // Mobile: include mobile-only and universal, exclude desktop-only
      modes = INTERACTION_MODES.filter(mode => !mode.desktopOnly);
      
      // If sensors not supported (in-app browser, insecure context), filter out sensor modes
      if (!sensorSupport.motion || !sensorSupport.orientation || sensorSupport.isInAppBrowser) {
        modes = modes.filter(mode => !SENSOR_MODES.includes(mode.mode));
      }
    } else {
      // Desktop: include desktop-only and universal, exclude mobile-only
      modes = INTERACTION_MODES.filter(mode => !mode.mobileOnly);
    }
    
    return modes;
  }, [isMobile, sensorSupport]);
  
  // Randomly select interaction mode on mount (from available modes)
  const [currentModeIndex, setCurrentModeIndex] = useState(0);
  
  // Initialize mode after device detection and sensor check
  useEffect(() => {
    const mobile = isMobileDevice();
    const sensors = checkSensorSupport();
    setIsMobile(mobile);
    setSensorSupport(sensors);
    
    // Filter modes based on capabilities
    let modes: InteractionModeConfig[];
    if (mobile) {
      modes = INTERACTION_MODES.filter(m => !m.desktopOnly);
      if (!sensors.motion || !sensors.orientation || sensors.isInAppBrowser) {
        modes = modes.filter(m => !SENSOR_MODES.includes(m.mode));
      }
    } else {
      modes = INTERACTION_MODES.filter(m => !m.mobileOnly);
    }
    
    setCurrentModeIndex(Math.floor(Math.random() * modes.length));
  }, []);
  
  const currentMode = availableModes[currentModeIndex] || availableModes[0];
  
  // Interaction states
  const [isHolding, setIsHolding] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [patternPoints, setPatternPoints] = useState<{ x: number; y: number }[]>([]);
  const [shakeCount, setShakeCount] = useState(0);
  
  // New interaction states
  const [lastTapTime, setLastTapTime] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [zigzagDirection, setZigzagDirection] = useState<"left" | "right" | null>(null);
  const [zigzagCount, setZigzagCount] = useState(0);
  const [pulseTaps, setPulseTaps] = useState<number[]>([]);
  const [breathPhase, setBreathPhase] = useState<"hold" | "release">("hold");
  const [breathCount, setBreathCount] = useState(0);
  
  // Additional states for new interactions
  const [morseTaps, setMorseTaps] = useState<("short" | "long")[]>([]);
  const [alternateSide, setAlternateSide] = useState<"left" | "right" | null>(null);
  const [alternateCount, setAlternateCount] = useState(0);
  const [cornersHit, setCornersHit] = useState<Set<string>>(new Set());
  const [sliderProgress, setSliderProgress] = useState(0);
  const [countdownValue, setCountdownValue] = useState(5);
  const [speedTapCount, setSpeedTapCount] = useState(0);
  const [speedTapStartTime, setSpeedTapStartTime] = useState(0);
  const [tripleTapTimes, setTripleTapTimes] = useState<number[]>([]);
  const [scratchArea, setScratchArea] = useState<Set<string>>(new Set());
  
  // Mobile sensor states
  const [tiltProgress, setTiltProgress] = useState(0);
  const [flipState, setFlipState] = useState<"normal" | "flipped" | "returned">("normal");
  const [compassHeading, setCompassHeading] = useState(0);
  const [proximityTriggered, setProximityTriggered] = useState(0);
  
  // Desktop keyboard/mouse states
  const [konamiSequence, setKonamiSequence] = useState<string[]>([]);
  const [typedWord, setTypedWord] = useState("");
  const [pianoSequence, setPianoSequence] = useState<string[]>([]);
  const [wasdSequence, setWasdSequence] = useState<string[]>([]);
  const [arrowSequence, setArrowSequence] = useState<string[]>([]);
  const [spaceCount, setSpaceCount] = useState(0);
  const [ctrlBCount, setCtrlBCount] = useState(0);
  const [doubleClickCount, setDoubleClickCount] = useState(0);
  const [rightClickCount, setRightClickCount] = useState(0);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
  const [dragComplete, setDragComplete] = useState(false);
  const [hoverZones, setHoverZones] = useState<Set<string>>(new Set());
  
  // More mobile sensor states
  const [faceDownTimer, setFaceDownTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [faceDownProgress, setFaceDownProgress] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  const [pinchCount, setPinchCount] = useState(0);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  
  // Visual feedback states
  const [cursorPos, setCursorPos] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [trailPoints, setTrailPoints] = useState<{x: number, y: number, id: number}[]>([]);
  const [tapRipples, setTapRipples] = useState<{x: number, y: number, id: number}[]>([]);
  const [deviceTilt, setDeviceTilt] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [keyPressVisuals, setKeyPressVisuals] = useState<{key: string, id: number}[]>([]);
  const [scrollPulse, setScrollPulse] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // ===== COMBO & GAMIFICATION SYSTEM =====
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [streakActive, setStreakActive] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [floatingScores, setFloatingScores] = useState<{value: string, x: number, y: number, id: number}[]>([]);
  const floatingScoreIdRef = useRef(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ===== ACHIEVEMENT SYSTEM =====
  const [achievements, setAchievements] = useState<Set<string>>(new Set());
  const [showAchievement, setShowAchievement] = useState<{icon: React.ReactNode, label: string} | null>(null);
  
  // ===== CONFETTI CELEBRATION =====
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<{id: number, left: number, color: string, delay: number}[]>([]);
  
  // ===== POWER-UP STATES =====
  const [isPowerUpActive, setIsPowerUpActive] = useState(false);
  const [powerUpType, setPowerUpType] = useState<'speed' | 'multiplier' | 'magnet' | null>(null);
  
  // ===== MILESTONE CELEBRATIONS =====
  const [milestoneReached, setMilestoneReached] = useState<number | null>(null);
  const [encouragementText, setEncouragementText] = useState<string | null>(null);
  const lastMilestoneRef = useRef(0);
  
  // Retry/Failure states
  const [failureCount, setFailureCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_TIMEOUT = 180000; // 3 minutes of no progress (2-5 min range)
  const WARNING_TIMEOUT = 150000; // Show warning at 2.5 minutes

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastRotationRef = useRef(0);
  const lastShakeRef = useRef({ x: 0, y: 0, z: 0 });
  const completedRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const morseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const morseTapStartRef = useRef(0);
  const trailIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const keyVisualIdRef = useRef(0);

  const { price, change24h } = useLivePrice(selectedAsset);
  const feedback = useFeedback();
  const { tickFeedback, tapFeedback, swipeFeedback, keyFeedback, noteFeedback, slideFeedback, shakeFeedback, clickFeedback, successFeedback, rhythmFeedback, doublePulseFeedback, holdFeedback } = feedback;
  
  // Also keep individual access for specific use cases
  const { playTick, playSuccess } = feedback.audio;
  const { lightTap, mediumTap, heavyTap, doublePulse, successPattern, rhythmPulse, shakePattern } = feedback.haptics;
  
  // Spring animations
  const progressSpring = useSpring(0, { stiffness: 100, damping: 20 });
  const scaleSpring = useSpring(1, { stiffness: 200, damping: 25 });

  // Inject styles
  useEffect(() => {
    const styleId = 'neon-loader-v3-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = NEON_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (gateVisible) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [gateVisible]);

  // Update spring when progress changes
  useEffect(() => {
    progressSpring.set(progress);
  }, [progress, progressSpring]);

  // Rotate quote periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(TRADING_QUOTES[Math.floor(Math.random() * TRADING_QUOTES.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // RETRY/FAILURE HANDLING SYSTEM
  // ============================================================================
  
  // Track activity and detect inactivity timeout
  useEffect(() => {
    // Clear any existing timeouts
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Don't set timeout if already completed or showing retry
    if (progress >= 100 || showRetryButton || isUnlocked) {
      setInactivityWarning(false);
      return;
    }
    
    // Set warning timeout (shows before retry button)
    warningTimeoutRef.current = setTimeout(() => {
      if (hasInteractedRef.current && progress < 100 && progress > 0) {
        setInactivityWarning(true);
      }
    }, WARNING_TIMEOUT);
    
    // Set full inactivity timeout
    inactivityTimeoutRef.current = setTimeout(() => {
      // Only trigger if user has started interacting but stopped making progress
      if (hasInteractedRef.current && progress < 100 && progress > 0) {
        setIsTimedOut(true);
        setShowRetryButton(true);
        setInactivityWarning(false);
      } else if (!hasInteractedRef.current && progress === 0) {
        // User never started - also show retry after longer timeout
        setIsTimedOut(true);
        setShowRetryButton(true);
        setInactivityWarning(false);
      }
    }, INACTIVITY_TIMEOUT);
    
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [progress, showRetryButton, isUnlocked, lastInteractionTime]);

  // Update last interaction time when progress changes
  useEffect(() => {
    if (progress > 0) {
      setLastInteractionTime(Date.now());
      setIsTimedOut(false);
      setShowRetryButton(false);
      setInactivityWarning(false);
    }
  }, [progress]);

  // Detect failure (progress drops significantly or resets)
  const lastProgressRef = useRef(0);
  useEffect(() => {
    // If progress dropped by more than 30% from peak, consider it a failure hint
    if (lastProgressRef.current > 30 && progress < lastProgressRef.current - 30 && progress < 100) {
      // Progress dropped significantly - might be failing
    }
    lastProgressRef.current = Math.max(lastProgressRef.current, progress);
  }, [progress]);

  // Reset interaction state for retry
  const resetInteractionState = useCallback(() => {
    setProgress(0);
    setIsHolding(false);
    setTapCount(0);
    setSwipeProgress(0);
    setRotationAngle(0);
    setPatternPoints([]);
    setShakeCount(0);
    setLastTapTime(0);
    setZigzagDirection(null);
    setZigzagCount(0);
    setPulseTaps([]);
    setBreathPhase("hold");
    setBreathCount(0);
    setMorseTaps([]);
    setAlternateSide(null);
    setAlternateCount(0);
    setCornersHit(new Set());
    setSliderProgress(0);
    setCountdownValue(5);
    setSpeedTapCount(0);
    setSpeedTapStartTime(0);
    setTripleTapTimes([]);
    setScratchArea(new Set());
    setTiltProgress(0);
    setFlipState("normal");
    setCompassHeading(0);
    setProximityTriggered(0);
    setKonamiSequence([]);
    setTypedWord("");
    setPianoSequence([]);
    setWasdSequence([]);
    setArrowSequence([]);
    setSpaceCount(0);
    setCtrlBCount(0);
    setDoubleClickCount(0);
    setRightClickCount(0);
    setScrollAmount(0);
    setDragStartPos(null);
    setDragComplete(false);
    setHoverZones(new Set());
    setFaceDownProgress(0);
    setStepCount(0);
    setTouchCount(0);
    setPinchCount(0);
    lastProgressRef.current = 0;
    hasInteractedRef.current = false;
    setLastInteractionTime(Date.now());
  }, []);

  // Handle retry button click
  const handleRetry = useCallback(() => {
    const newFailureCount = failureCount + 1;
    setFailureCount(newFailureCount);
    setShowRetryButton(false);
    setIsTimedOut(false);
    
    // If failed twice, auto-unlock
    if (newFailureCount >= 2) {
      completedRef.current = true;
      setIsUnlocked(true);
      successFeedback();
      
      setTimeout(() => {
        setGateVisible(false);
        onFinished?.();
      }, 1000);
    } else {
      // Reset and try same interaction again
      resetInteractionState();
      tapFeedback(); // Feedback for retry
    }
  }, [failureCount, onFinished, resetInteractionState, successFeedback, tapFeedback]);

  // ============================================================================
  // VISUAL FEEDBACK HELPERS
  // ============================================================================
  
  // Add tap ripple effect
  const addTapRipple = useCallback((x: number, y: number) => {
    const id = rippleIdRef.current++;
    setTapRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setTapRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  // Add trail point for drag interactions
  const addTrailPoint = useCallback((x: number, y: number) => {
    const id = trailIdRef.current++;
    setTrailPoints(prev => [...prev.slice(-15), { x, y, id }]);
  }, []);

  // Clear old trail points periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTrailPoints(prev => prev.slice(-10));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Add key press visual
  const addKeyVisual = useCallback((key: string) => {
    const id = keyVisualIdRef.current++;
    setKeyPressVisuals(prev => [...prev.slice(-5), { key, id }]);
    setTimeout(() => {
      setKeyPressVisuals(prev => prev.filter(k => k.id !== id));
    }, 500);
  }, []);

  // ===== COMBO SYSTEM =====
  const triggerComboAction = useCallback((x?: number, y?: number) => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTime;
    
    // Combo window: 1.5 seconds between actions
    if (timeSinceLastAction < 1500 && lastActionTime > 0) {
      setComboCount(prev => {
        const newCount = prev + 1;
        // Update multiplier based on combo
        const newMultiplier = Math.min(1 + Math.floor(newCount / 3) * 0.5, 5);
        setComboMultiplier(newMultiplier);
        setStreakActive(true);
        
        // Add floating score
        if (x !== undefined && y !== undefined) {
          const scoreId = floatingScoreIdRef.current++;
          const scoreValue = newMultiplier > 1 ? `+${Math.floor(newMultiplier * 10)}` : '+10';
          setFloatingScores(prev => [...prev.slice(-5), { value: scoreValue, x, y, id: scoreId }]);
          setTimeout(() => {
            setFloatingScores(prev => prev.filter(s => s.id !== scoreId));
          }, 800);
        }
        
        // Milestone combos trigger achievements
        if (newCount === 5 && !achievements.has('combo5')) {
          unlockAchievement('combo5', <Zap size={20} className="text-white" />, 'Combo x5!');
        } else if (newCount === 10 && !achievements.has('combo10')) {
          unlockAchievement('combo10', <Star size={20} className="text-white" />, 'Combo Master!');
        } else if (newCount === 20 && !achievements.has('combo20')) {
          unlockAchievement('combo20', <Sparkles size={20} className="text-white" />, 'LEGENDARY!');
        }
        
        return newCount;
      });
    } else {
      // Reset combo
      setComboCount(1);
      setComboMultiplier(1);
      setStreakActive(false);
    }
    
    setLastActionTime(now);
    
    // Reset combo timeout
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
    }
    comboTimeoutRef.current = setTimeout(() => {
      setStreakActive(false);
      setComboCount(0);
      setComboMultiplier(1);
    }, 2000);
    
    // Update total score
    setTotalScore(prev => prev + Math.floor(10 * comboMultiplier));
  }, [lastActionTime, comboMultiplier, achievements]);

  // ===== ACHIEVEMENT SYSTEM =====
  const unlockAchievement = useCallback((id: string, icon: React.ReactNode, label: string) => {
    setAchievements(prev => {
      if (prev.has(id)) return prev;
      const newSet = new Set(prev);
      newSet.add(id);
      
      // Show achievement popup
      setShowAchievement({ icon, label });
      feedback.audio.playSuccess();
      feedback.haptics.successPattern();
      
      setTimeout(() => setShowAchievement(null), 3000);
      
      return newSet;
    });
  }, [feedback]);

  // ===== CONFETTI EXPLOSION =====
  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8', '#818cf8', '#a5b4fc'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setConfettiParticles(particles);
    
    setTimeout(() => {
      setShowConfetti(false);
      setConfettiParticles([]);
    }, 4000);
  }, []);

  // ===== MILESTONE CELEBRATIONS =====
  const checkMilestone = useCallback((currentProgress: number) => {
    const milestones = [25, 50, 75, 90];
    for (const milestone of milestones) {
      if (currentProgress >= milestone && lastMilestoneRef.current < milestone) {
        lastMilestoneRef.current = milestone;
        setMilestoneReached(milestone);
        feedback.audio.playTap();
        feedback.haptics.doublePulse();
        
        // Show random encouragement message
        const messages = ENCOURAGEMENT_MESSAGES[milestone];
        if (messages) {
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          setEncouragementText(randomMessage);
          setTimeout(() => setEncouragementText(null), 2000);
        }
        
        // Small celebration for milestones
        setTimeout(() => setMilestoneReached(null), 1500);
        
        // Achievement for first milestone
        if (milestone === 25 && !achievements.has('first25')) {
          unlockAchievement('first25', <TrendingUp size={20} className="text-white" />, 'Quarter Way!');
        } else if (milestone === 50 && !achievements.has('halfway')) {
          unlockAchievement('halfway', <Target size={20} className="text-white" />, 'Halfway There!');
        } else if (milestone === 75 && !achievements.has('almostThere')) {
          unlockAchievement('almostThere', <Star size={20} className="text-white" />, 'Almost There!');
        }
        break;
      }
    }
  }, [feedback, achievements, unlockAchievement]);

  // Check completion - triggers confetti and final achievements
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;
      successFeedback(); // Audio + Haptic
      setIsUnlocked(true);
      
      // 🎉 CELEBRATION TIME!
      triggerConfetti();
      
      // Final achievement based on performance
      if (comboCount >= 10) {
        unlockAchievement('perfectRun', <Star size={20} className="text-white" />, 'Perfect Run!');
      } else if (totalScore >= 200) {
        unlockAchievement('highScore', <TrendingUp size={20} className="text-white" />, 'High Scorer!');
      }
      
      setTimeout(() => {
        setGateVisible(false);
        onFinished?.();
      }, 2000);
    }
  }, [progress, onFinished, successFeedback, triggerConfetti, comboCount, totalScore, unlockAchievement]);

  // Check milestones on progress change
  useEffect(() => {
    if (progress > 0 && progress < 100) {
      checkMilestone(progress);
    }
  }, [progress, checkMilestone]);

  // Handle device tilt for visual feedback
  useEffect(() => {
    if (!isMobile) return;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta || 0; // Front-back tilt
      const gamma = e.gamma || 0; // Left-right tilt
      // Clamp and normalize tilt values for visual effect
      setDeviceTilt({
        x: Math.max(-15, Math.min(15, gamma / 3)),
        y: Math.max(-15, Math.min(15, beta / 3))
      });
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isMobile]);

  // Shake intensity decay
  useEffect(() => {
    if (shakeIntensity > 0) {
      const timeout = setTimeout(() => {
        setShakeIntensity(prev => Math.max(0, prev - 2));
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [shakeIntensity]);

  // ============================================================================
  // INTERACTION HANDLERS
  // ============================================================================
  
  // HOLD MODE
  const handleHoldStart = useCallback(() => {
    if (currentMode.mode !== "hold") return;
    setIsHolding(true);
    hasInteractedRef.current = true;
    scaleSpring.set(0.95);
    
    holdIntervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + 2, 100);
        if (next % 10 === 0) playTick();
        return next;
      });
    }, 100);
  }, [currentMode.mode, playTick, scaleSpring]);

  const handleHoldEnd = useCallback(() => {
    setIsHolding(false);
    scaleSpring.set(1);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    // Progress decays slowly when not holding
    if (progress < 100 && progress > 0) {
      const decay = setInterval(() => {
        setProgress(p => {
          if (p <= 0) {
            clearInterval(decay);
            return 0;
          }
          return Math.max(p - 0.5, 0);
        });
      }, 50);
      setTimeout(() => clearInterval(decay), 2000);
    }
  }, [progress, scaleSpring]);

  // TAP MODE - Enhanced with combo system
  const handleTap = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "tap") return;
    hasInteractedRef.current = true;
    
    // Get tap position for visual effects
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (e) {
      if ('touches' in e && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ('clientX' in e) {
        x = e.clientX;
        y = e.clientY;
      }
    }
    
    // Trigger combo system
    triggerComboAction(x, y);
    addTapRipple(x, y);
    
    setTapCount(c => c + 1);
    // Progress boost based on combo multiplier!
    const progressGain = Math.floor(2 * comboMultiplier);
    setProgress(p => Math.min(p + progressGain, 100));
    playTick();
    
    // Enhanced scale animation based on combo
    const scaleAmount = streakActive ? 0.85 : 0.9;
    scaleSpring.set(scaleAmount);
    setTimeout(() => scaleSpring.set(1), 100);
  }, [currentMode.mode, playTick, scaleSpring, triggerComboAction, addTapRipple, comboMultiplier, streakActive]);

  // SWIPE MODE (touch + mouse)
  const handlePointerStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartRef.current = { x: clientX, y: clientY };
    isDraggingRef.current = true;
  }, []);

  const handleSwipeMove = useCallback((clientX: number, clientY: number) => {
    if (currentMode.mode !== "swipe" || !touchStartRef.current || !isDraggingRef.current) return;
    hasInteractedRef.current = true;
    
    const deltaY = touchStartRef.current.y - clientY;
    const swipePercent = Math.min(Math.max(deltaY / 200 * 100, 0), 100);
    setSwipeProgress(swipePercent);
    setProgress(swipePercent);
  }, [currentMode.mode]);

  // Legacy touch handlers for compatibility
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handlePointerStart(e);
  }, [handlePointerStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleSwipeMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleSwipeMove]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    isDraggingRef.current = false;
    if (currentMode.mode === "swipe" && progress < 100) {
      setSwipeProgress(0);
      setProgress(0);
    }
  }, [currentMode.mode, progress]);

  // Mouse handlers for desktop
  const handleMouseStart = useCallback((e: React.MouseEvent) => {
    handlePointerStart(e);
  }, [handlePointerStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    handleSwipeMove(e.clientX, e.clientY);
  }, [handleSwipeMove]);

  const handleMouseEnd = useCallback(() => {
    touchStartRef.current = null;
    isDraggingRef.current = false;
    if (currentMode.mode === "swipe" && progress < 100) {
      setSwipeProgress(0);
      setProgress(0);
    }
  }, [currentMode.mode, progress]);

  // ROTATE MODE
  const handleRotateMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "rotate" || !containerRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const normalizedAngle = angle < 0 ? angle + 360 : angle;
    
    // Track clockwise rotation
    const diff = normalizedAngle - lastRotationRef.current;
    if (diff > 0 && diff < 180) {
      setRotationAngle(a => a + diff);
      setProgress(p => Math.min(p + diff / 10, 100));
      if (Math.floor(rotationAngle / 45) < Math.floor((rotationAngle + diff) / 45)) {
        playTick();
      }
    }
    lastRotationRef.current = normalizedAngle;
  }, [currentMode.mode, playTick, rotationAngle]);

  // PATTERN MODE (Z pattern) - supports touch and mouse
  const handlePatternPoint = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "pattern") return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setPatternPoints(points => {
      const newPoints = [...points, { x, y }];
      
      // Check for Z pattern (simplified: 4 key points)
      if (newPoints.length >= 4) {
        const first = newPoints[0];
        const second = newPoints[Math.floor(newPoints.length / 3)];
        const third = newPoints[Math.floor(newPoints.length * 2 / 3)];
        const last = newPoints[newPoints.length - 1];

        // Z pattern: top-left → top-right → bottom-left → bottom-right
        const isZ = 
          first.x < second.x && // Moving right
          second.x > third.x && second.y < third.y && // Diagonal down-left
          third.x < last.x; // Moving right again

        if (isZ) {
          setProgress(100);
          playTick();
        } else {
          setProgress(p => Math.min(p + 5, 90));
        }
      }
      
      return newPoints.slice(-20); // Keep last 20 points
    });
  }, [currentMode.mode, playTick]);

  // SHAKE MODE - Device motion for mobile, rapid mouse movement for desktop
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const shakeDetectorRef = useRef<number[]>([]);
  
  // Desktop shake alternative: rapid mouse movements
  const handleShakeMouseMove = useCallback((e: React.MouseEvent) => {
    if (currentMode.mode !== "shake") return;
    
    const deltaX = Math.abs(e.clientX - lastMousePosRef.current.x);
    const deltaY = Math.abs(e.clientY - lastMousePosRef.current.y);
    const movement = deltaX + deltaY;
    
    // Track rapid movements
    const now = Date.now();
    shakeDetectorRef.current.push(now);
    shakeDetectorRef.current = shakeDetectorRef.current.filter(t => now - t < 500);
    
    // If mouse moved quickly (>50px) and we have several movements in short time
    if (movement > 50 && shakeDetectorRef.current.length > 3) {
      hasInteractedRef.current = true;
      setShakeCount(c => c + 1);
      setShakeIntensity(10); // Trigger visual shake
      setProgress(p => Math.min(p + 3, 100));
      playTick();
      shakeDetectorRef.current = []; // Reset after counting
    }
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [currentMode.mode, playTick]);

  useEffect(() => {
    if (currentMode.mode !== "shake" || typeof window === "undefined") return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const threshold = 15;

      const deltaX = Math.abs(x - lastShakeRef.current.x);
      const deltaY = Math.abs(y - lastShakeRef.current.y);
      const deltaZ = Math.abs(z - lastShakeRef.current.z);

      if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
        hasInteractedRef.current = true;
        setShakeCount(c => c + 1);
        setShakeIntensity(12); // Trigger visual shake
        setProgress(p => Math.min(p + 3, 100));
        playTick();
      }

      lastShakeRef.current = { x, y, z };
    };

    // Request permission for iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [currentMode.mode, playTick]);

  // DOUBLE TAP MODE
  const handleDoubleTap = useCallback(() => {
    if (currentMode.mode !== "doubleTap") return;
    const now = Date.now();
    
    if (now - lastTapTime < 400) {
      // Valid double tap
      hasInteractedRef.current = true;
      setProgress(p => Math.min(p + 10, 100));
      playTick();
      scaleSpring.set(0.85);
      setTimeout(() => scaleSpring.set(1), 150);
      setLastTapTime(0); // Reset for next double tap
    } else {
      setLastTapTime(now);
    }
  }, [currentMode.mode, lastTapTime, playTick, scaleSpring]);

  // LONG PRESS MODE
  const handleLongPressStart = useCallback(() => {
    if (currentMode.mode !== "longPress") return;
    hasInteractedRef.current = true;
    setIsHolding(true);
    scaleSpring.set(0.95);
    
    // Start 3-second timer
    const timer = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + (100 / 30), 100); // 3 seconds = 30 intervals at 100ms
        if (Math.floor(next / 10) > Math.floor(p / 10)) playTick();
        return next;
      });
    }, 100);
    
    setLongPressTimer(timer);
  }, [currentMode.mode, playTick, scaleSpring]);

  const handleLongPressEnd = useCallback(() => {
    if (currentMode.mode !== "longPress") return;
    setIsHolding(false);
    scaleSpring.set(1);
    
    if (longPressTimer) {
      clearInterval(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset if not complete
    if (progress < 100) {
      setProgress(0);
    }
  }, [currentMode.mode, longPressTimer, progress, scaleSpring]);

  // ZIGZAG MODE - supports touch and mouse
  const handleZigzagMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "zigzag" || !touchStartRef.current) return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - touchStartRef.current.x;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? "right" : "left";
      
      // Check if direction changed
      if (zigzagDirection && direction !== zigzagDirection) {
        setZigzagCount(c => {
          const newCount = c + 1;
          playTick();
          // Need 6 direction changes (left-right-left-right-left-right)
          setProgress(Math.min((newCount / 6) * 100, 100));
          return newCount;
        });
      }
      
      setZigzagDirection(direction);
      touchStartRef.current = { x: clientX, y: clientY };
    }
  }, [currentMode.mode, playTick, zigzagDirection]);

  // PULSE MODE (rhythm tapping)
  const handlePulseTap = useCallback(() => {
    if (currentMode.mode !== "pulse") return;
    hasInteractedRef.current = true;
    
    const now = Date.now();
    setPulseTaps(taps => {
      const newTaps = [...taps, now].slice(-5); // Keep last 5 taps
      
      if (newTaps.length >= 3) {
        // Check if taps are rhythmic (consistent intervals ~500ms ± 150ms)
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const isRhythmic = intervals.every(i => 
          i > 350 && i < 800 && Math.abs(i - avgInterval) < 200
        );
        
        if (isRhythmic) {
          playTick();
          setProgress(p => Math.min(p + 8, 100));
          scaleSpring.set(0.9);
          setTimeout(() => scaleSpring.set(1), 100);
        }
      }
      
      return newTaps;
    });
  }, [currentMode.mode, playTick, scaleSpring]);

  // BREATH MODE (hold-release-hold-release)
  const handleBreathStart = useCallback(() => {
    if (currentMode.mode !== "breath") return;
    hasInteractedRef.current = true;
    
    if (breathPhase === "hold") {
      setIsHolding(true);
      scaleSpring.set(0.95);
    }
  }, [currentMode.mode, breathPhase, scaleSpring]);

  const handleBreathEnd = useCallback(() => {
    if (currentMode.mode !== "breath") return;
    setIsHolding(false);
    scaleSpring.set(1);
    
    if (breathPhase === "hold") {
      setBreathPhase("release");
      setBreathCount(c => {
        const newCount = c + 1;
        playTick();
        // Need 4 complete cycles (8 phases)
        setProgress(Math.min((newCount / 8) * 100, 100));
        return newCount;
      });
    } else {
      setBreathPhase("hold");
      setBreathCount(c => {
        const newCount = c + 1;
        playTick();
        setProgress(Math.min((newCount / 8) * 100, 100));
        return newCount;
      });
    }
  }, [currentMode.mode, breathPhase, playTick, scaleSpring]);

  // ============================================================================
  // NEW INTERACTION HANDLERS
  // ============================================================================

  // SPIRAL MODE - draw inward spiral
  const handleSpiralMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "spiral") return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));
    const maxDistance = Math.min(rect.width, rect.height) / 2;
    
    // Progress increases as you get closer to center
    const newProgress = Math.max(0, Math.min(100, (1 - distance / maxDistance) * 100));
    if (newProgress > progress) {
      setProgress(newProgress);
      if (Math.floor(newProgress / 10) > Math.floor(progress / 10)) playTick();
    }
  }, [currentMode.mode, progress, playTick]);

  // CIRCLE MODE - draw complete circle
  const [circleAnglesCovered, setCircleAnglesCovered] = useState<Set<number>>(new Set());
  const handleCircleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "circle") return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const normalizedAngle = Math.floor((angle < 0 ? angle + 360 : angle) / 30); // 12 sectors
    
    setCircleAnglesCovered(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(normalizedAngle)) {
        newSet.add(normalizedAngle);
        playTick();
        setProgress((newSet.size / 12) * 100);
      }
      return newSet;
    });
  }, [currentMode.mode, playTick]);

  // SCRATCH MODE - scratch the center area
  const handleScratchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "scratch") return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Create grid of 5x5 = 25 cells in center area
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const areaSize = 150;
    
    const relX = clientX - (centerX - areaSize / 2);
    const relY = clientY - (centerY - areaSize / 2);
    
    if (relX >= 0 && relX < areaSize && relY >= 0 && relY < areaSize) {
      const cellX = Math.floor(relX / (areaSize / 5));
      const cellY = Math.floor(relY / (areaSize / 5));
      const cellKey = `${cellX}-${cellY}`;
      
      setScratchArea(prev => {
        const newSet = new Set(prev);
        if (!newSet.has(cellKey)) {
          newSet.add(cellKey);
          if (newSet.size % 3 === 0) playTick();
          setProgress((newSet.size / 25) * 100);
        }
        return newSet;
      });
    }
  }, [currentMode.mode, playTick]);

  // MORSE MODE - short-short-long pattern
  const handleMorseStart = useCallback(() => {
    if (currentMode.mode !== "morse") return;
    hasInteractedRef.current = true;
    morseTapStartRef.current = Date.now();
    setIsHolding(true);
    scaleSpring.set(0.95);
  }, [currentMode.mode, scaleSpring]);

  const handleMorseEnd = useCallback(() => {
    if (currentMode.mode !== "morse") return;
    setIsHolding(false);
    scaleSpring.set(1);
    
    const duration = Date.now() - morseTapStartRef.current;
    const tapType: "short" | "long" = duration > 400 ? "long" : "short";
    
    setMorseTaps(prev => {
      const newTaps = [...prev, tapType].slice(-3);
      playTick();
      
      // Check for pattern: short-short-long
      if (newTaps.length === 3) {
        if (newTaps[0] === "short" && newTaps[1] === "short" && newTaps[2] === "long") {
          setProgress(p => Math.min(p + 34, 100));
        }
        return []; // Reset after checking
      }
      return newTaps;
    });
  }, [currentMode.mode, playTick, scaleSpring]);

  // ALTERNATE MODE - tap left and right sides
  const handleAlternateTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "alternate") return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? 
      (e as React.TouchEvent).touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches?.[0]?.clientX :
      (e as React.MouseEvent).clientX;
    const centerX = rect.left + rect.width / 2;
    const side = clientX < centerX ? "left" : "right";
    
    if (alternateSide !== side) {
      setAlternateSide(side);
      setAlternateCount(c => {
        const newCount = c + 1;
        playTick();
        setProgress(Math.min((newCount / 10) * 100, 100));
        return newCount;
      });
      scaleSpring.set(0.9);
      setTimeout(() => scaleSpring.set(1), 100);
    }
  }, [currentMode.mode, alternateSide, playTick, scaleSpring]);

  // COUNTDOWN MODE - hold until countdown ends
  const [countdownTimer, setCountdownTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const handleCountdownStart = useCallback(() => {
    if (currentMode.mode !== "countdown") return;
    hasInteractedRef.current = true;
    setIsHolding(true);
    scaleSpring.set(0.95);
    setCountdownValue(5);
    
    const timer = setInterval(() => {
      setCountdownValue(v => {
        if (v <= 1) {
          setProgress(100);
          playTick();
          return 0;
        }
        playTick();
        setProgress(((5 - v + 1) / 5) * 100);
        return v - 1;
      });
    }, 1000);
    
    setCountdownTimer(timer);
  }, [currentMode.mode, playTick, scaleSpring]);

  const handleCountdownEnd = useCallback(() => {
    if (currentMode.mode !== "countdown") return;
    setIsHolding(false);
    scaleSpring.set(1);
    
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    
    if (progress < 100) {
      setCountdownValue(5);
      setProgress(0);
    }
  }, [currentMode.mode, countdownTimer, progress, scaleSpring]);

  // CORNERS MODE - tap all 4 corners
  const handleCornerTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "corners") return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? 
      (e as React.TouchEvent).touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches?.[0]?.clientX :
      (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? 
      (e as React.TouchEvent).touches[0]?.clientY ?? (e as React.TouchEvent).changedTouches?.[0]?.clientY :
      (e as React.MouseEvent).clientY;
    
    const cornerSize = 100;
    let corner = "";
    
    if (clientX < rect.left + cornerSize && clientY < rect.top + cornerSize) corner = "tl";
    else if (clientX > rect.right - cornerSize && clientY < rect.top + cornerSize) corner = "tr";
    else if (clientX < rect.left + cornerSize && clientY > rect.bottom - cornerSize) corner = "bl";
    else if (clientX > rect.right - cornerSize && clientY > rect.bottom - cornerSize) corner = "br";
    
    if (corner && !cornersHit.has(corner)) {
      setCornersHit(prev => {
        const newSet = new Set(prev);
        newSet.add(corner);
        playTick();
        setProgress((newSet.size / 4) * 100);
        return newSet;
      });
      scaleSpring.set(0.9);
      setTimeout(() => scaleSpring.set(1), 100);
    }
  }, [currentMode.mode, cornersHit, playTick, scaleSpring]);

  // INFINITY MODE - draw figure-8
  const [infinityPhase, setInfinityPhase] = useState(0); // 0-3: 4 quadrants of figure-8
  const handleInfinityMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "infinity") return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Determine quadrant
    const isLeft = clientX < centerX;
    const isTop = clientY < centerY;
    let quadrant = 0;
    if (isLeft && isTop) quadrant = 0;
    else if (!isLeft && isTop) quadrant = 1;
    else if (!isLeft && !isTop) quadrant = 2;
    else quadrant = 3;
    
    // Must visit quadrants in order: 0->1->2->3->0->3->2->1 (figure 8)
    const expectedSequence = [0, 1, 2, 3, 0, 3, 2, 1];
    if (quadrant === expectedSequence[infinityPhase]) {
      setInfinityPhase(p => {
        const next = p + 1;
        playTick();
        setProgress((next / 8) * 100);
        if (next >= 8) return 0;
        return next;
      });
    }
  }, [currentMode.mode, infinityPhase, playTick]);

  // SLIDER MODE - drag from left to right
  const handleSliderMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (currentMode.mode !== "slider" || !touchStartRef.current) return;
    if ('touches' in e === false && !isDraggingRef.current) return;
    hasInteractedRef.current = true;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startX = rect.left + 50; // Start area
    const endX = rect.right - 50; // End area
    
    const prog = Math.min(100, Math.max(0, ((clientX - startX) / (endX - startX)) * 100));
    setSliderProgress(prog);
    setProgress(prog);
    if (Math.floor(prog / 20) > Math.floor(sliderProgress / 20)) playTick();
  }, [currentMode.mode, sliderProgress, playTick]);

  // TRIPLE TAP MODE
  const handleTripleTap = useCallback(() => {
    if (currentMode.mode !== "tripleTap") return;
    const now = Date.now();
    
    setTripleTapTimes(prev => {
      const newTimes = [...prev, now].filter(t => now - t < 600);
      
      if (newTimes.length >= 3) {
        hasInteractedRef.current = true;
        setProgress(p => Math.min(p + 15, 100));
        playTick();
        scaleSpring.set(0.85);
        setTimeout(() => scaleSpring.set(1), 150);
        return [];
      }
      return newTimes;
    });
  }, [currentMode.mode, playTick, scaleSpring]);

  // SPEED TAP MODE - 20 taps in 5 seconds with combo bonuses
  const handleSpeedTap = useCallback(() => {
    if (currentMode.mode !== "speedTap") return;
    const now = Date.now();
    
    if (speedTapStartTime === 0 || now - speedTapStartTime > 5000) {
      // Starting fresh
      setSpeedTapStartTime(now);
      setSpeedTapCount(1);
      setProgress(5);
      triggerComboAction();
    } else {
      setSpeedTapCount(c => {
        const newCount = c + 1;
        hasInteractedRef.current = true;
        
        // Apply combo multiplier for faster progress!
        const baseProgress = (newCount / 20) * 100;
        const bonusProgress = streakActive ? baseProgress * 1.2 : baseProgress;
        setProgress(Math.min(bonusProgress, 100));
        
        // More frequent feedback at higher speeds
        if (newCount % 3 === 0) {
          playTick();
          triggerComboAction();
        }
        
        // Achievement for completing in under 3 seconds
        if (newCount >= 20 && !achievements.has('speedDemon')) {
          const timeElapsed = now - speedTapStartTime;
          if (timeElapsed < 3000) {
            unlockAchievement('speedDemon', <Zap size={20} className="text-white" />, 'Speed Demon!');
          }
        }
        
        return newCount;
      });
    }
    
    // Enhanced visual feedback - more intense at higher counts
    const intensity = Math.min(0.92 - (speedTapCount * 0.002), 0.85);
    scaleSpring.set(intensity);
    setShakeIntensity(Math.min(speedTapCount / 3, 8));
    setTimeout(() => scaleSpring.set(1), 50);
  }, [currentMode.mode, speedTapStartTime, playTick, scaleSpring, speedTapCount, triggerComboAction, streakActive, achievements, unlockAchievement]);

  // ============================================================================
  // MOBILE-ONLY SENSOR HANDLERS
  // ============================================================================

  // TILT MODE - device orientation
  useEffect(() => {
    if (currentMode.mode !== "tilt" || !isMobile) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0; // Front-back tilt (-180 to 180)
      hasInteractedRef.current = true;
      
      // Progress based on tilting forward (positive beta)
      const tiltAmount = Math.max(0, Math.min(beta, 45)) / 45;
      setTiltProgress(tiltAmount * 100);
      setProgress(tiltAmount * 100);
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [currentMode.mode, isMobile]);

  // FLIP MODE - flip device face down and back
  useEffect(() => {
    if (currentMode.mode !== "flip" || !isMobile) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // Left-right tilt
      const beta = e.beta ?? 0; // Front-back tilt
      hasInteractedRef.current = true;
      
      // Detect face-down position (beta close to 180 or -180)
      const isFaceDown = Math.abs(beta) > 140;
      
      if (flipState === "normal" && isFaceDown) {
        setFlipState("flipped");
        playTick();
        setProgress(50);
      } else if (flipState === "flipped" && !isFaceDown && Math.abs(beta) < 40) {
        setFlipState("returned");
        playTick();
        setProgress(100);
      }
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [currentMode.mode, isMobile, flipState, playTick]);

  // COMPASS MODE - rotate to face north
  useEffect(() => {
    if (currentMode.mode !== "compass" || !isMobile) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const alpha = e.alpha ?? 0; // Compass heading (0-360)
      hasInteractedRef.current = true;
      setCompassHeading(alpha);
      
      // Progress when facing north (alpha close to 0 or 360)
      const northness = Math.max(0, 1 - Math.min(alpha, 360 - alpha) / 30);
      setProgress(northness * 100);
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [currentMode.mode, isMobile]);

  // PROXIMITY MODE - cover/uncover screen (simulated with rapid light change via ambient light or touch)
  const handleProximityTap = useCallback(() => {
    if (currentMode.mode !== "proximity") return;
    hasInteractedRef.current = true;
    
    setProximityTriggered(c => {
      const newCount = c + 1;
      playTick();
      setProgress(Math.min((newCount / 6) * 100, 100));
      return newCount;
    });
    scaleSpring.set(0.9);
    setTimeout(() => scaleSpring.set(1), 100);
  }, [currentMode.mode, playTick, scaleSpring]);

  // ============================================================================
  // DESKTOP KEYBOARD MODES
  // ============================================================================
  
  // KONAMI CODE: ↑↑↓↓←→←→BA
  const KONAMI_CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];
  
  useEffect(() => {
    if (currentMode.mode !== "konami") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      hasInteractedRef.current = true;
      const key = e.code;
      // Show visual for arrow keys and letters
      const keyLabel = key.replace('Arrow', '').replace('Key', '');
      addKeyVisual(keyLabel === 'Up' ? '↑' : keyLabel === 'Down' ? '↓' : keyLabel === 'Left' ? '←' : keyLabel === 'Right' ? '→' : keyLabel);
      
      setKonamiSequence(prev => {
        const newSeq = [...prev, key];
        // Check if last keys match Konami code
        const startIdx = newSeq.length - KONAMI_CODE.length;
        if (startIdx >= 0) {
          const match = KONAMI_CODE.every((k, i) => newSeq[startIdx + i] === k);
          if (match) {
            setProgress(100);
            playTick();
            return [];
          }
        }
        // Show partial progress
        let matchCount = 0;
        for (let i = 0; i < Math.min(newSeq.length, KONAMI_CODE.length); i++) {
          if (newSeq[newSeq.length - 1 - i] === KONAMI_CODE[KONAMI_CODE.length - 1 - i]) {
            matchCount++;
          } else break;
        }
        // Backwards check for partial match
        const partialMatch = KONAMI_CODE.slice(0, newSeq.length).every((k, i) => k === newSeq[i]);
        if (partialMatch) {
          setProgress((newSeq.length / KONAMI_CODE.length) * 100);
          playTick();
        } else {
          setProgress(0);
          return [];
        }
        return newSeq.slice(-15);
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick]);

  // TYPE WORD MODE: Type "BULLMONEY"
  const TARGET_WORD = "BULLMONEY";
  
  useEffect(() => {
    if (currentMode.mode !== "typeWord") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      hasInteractedRef.current = true;
      const key = e.key.toUpperCase();
      
      if (key.length === 1 && /[A-Z]/.test(key)) {
        addKeyVisual(key);
        setTypedWord(prev => {
          const newWord = prev + key;
          // Check if matches target so far
          if (TARGET_WORD.startsWith(newWord)) {
            playTick();
            setProgress((newWord.length / TARGET_WORD.length) * 100);
            if (newWord === TARGET_WORD) {
              return TARGET_WORD;
            }
            return newWord;
          } else {
            setProgress(0);
            return "";
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick]);

  // PIANO MODE: Press A S D F G in sequence
  const PIANO_KEYS = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG"];
  
  useEffect(() => {
    if (currentMode.mode !== "piano") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      hasInteractedRef.current = true;
      const key = e.code;
      
      if (PIANO_KEYS.includes(key)) {
        addKeyVisual(key.replace('Key', ''));
        setPianoSequence(prev => {
          const nextExpected = PIANO_KEYS[prev.length];
          if (key === nextExpected) {
            playTick();
            const newSeq = [...prev, key];
            setProgress((newSeq.length / PIANO_KEYS.length) * 100);
            if (newSeq.length === PIANO_KEYS.length) {
              return [];
            }
            return newSeq;
          } else {
            setProgress(0);
            return [];
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick]);

  // WASD MODE: W A S D in order
  const WASD_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD"];
  
  useEffect(() => {
    if (currentMode.mode !== "wasd") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      hasInteractedRef.current = true;
      const key = e.code;
      
      if (WASD_KEYS.includes(key)) {
        addKeyVisual(key.replace('Key', ''));
        setWasdSequence(prev => {
          const nextExpected = WASD_KEYS[prev.length];
          if (key === nextExpected) {
            playTick();
            const newSeq = [...prev, key];
            setProgress((newSeq.length / WASD_KEYS.length) * 100);
            if (newSeq.length === WASD_KEYS.length) {
              return [];
            }
            return newSeq;
          } else {
            setProgress(0);
            return [];
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick]);

  // ARROW MODE: ↑→↓←
  const ARROW_KEYS = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
  
  useEffect(() => {
    if (currentMode.mode !== "arrows") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      hasInteractedRef.current = true;
      const key = e.code;
      
      if (ARROW_KEYS.includes(key)) {
        e.preventDefault();
        const arrow = key === 'ArrowUp' ? '↑' : key === 'ArrowRight' ? '→' : key === 'ArrowDown' ? '↓' : '←';
        addKeyVisual(arrow);
        setArrowSequence(prev => {
          const nextExpected = ARROW_KEYS[prev.length];
          if (key === nextExpected) {
            playTick();
            const newSeq = [...prev, key];
            setProgress((newSeq.length / ARROW_KEYS.length) * 100);
            if (newSeq.length === ARROW_KEYS.length) {
              return [];
            }
            return newSeq;
          } else {
            setProgress(0);
            return [];
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick]);

  // SPACE MASH MODE: Mash space 15 times
  useEffect(() => {
    if (currentMode.mode !== "spaceMash") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        hasInteractedRef.current = true;
        addKeyVisual("SPACE");
        setSpaceCount(prev => {
          const newCount = prev + 1;
          playTick();
          scaleSpring.set(0.9);
          setShakeIntensity(8);
          setTimeout(() => scaleSpring.set(1), 50);
          setProgress(Math.min((newCount / 15) * 100, 100));
          return newCount;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick, scaleSpring, addKeyVisual]);

  // CTRL+B MODE (Bulls!): Press Ctrl+B 3 times
  useEffect(() => {
    if (currentMode.mode !== "altTab") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyB") {
        e.preventDefault();
        hasInteractedRef.current = true;
        addKeyVisual("Ctrl+B");
        setCtrlBCount(prev => {
          const newCount = prev + 1;
          playTick();
          setProgress(Math.min((newCount / 3) * 100, 100));
          return newCount;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode.mode, playTick, addKeyVisual]);

  // ============================================================================
  // DESKTOP MOUSE MODES
  // ============================================================================

  // DOUBLE CLICK MODE
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (currentMode.mode !== "doubleClick") return;
    hasInteractedRef.current = true;
    addTapRipple(e.clientX, e.clientY);
    setDoubleClickCount(prev => {
      const newCount = prev + 1;
      playTick();
      scaleSpring.set(0.85);
      setTimeout(() => scaleSpring.set(1), 150);
      setProgress(Math.min((newCount / 5) * 100, 100));
      return newCount;
    });
  }, [currentMode.mode, playTick, scaleSpring, addTapRipple]);

  // RIGHT CLICK MODE
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    if (currentMode.mode !== "rightClick") return;
    e.preventDefault();
    hasInteractedRef.current = true;
    addTapRipple(e.clientX, e.clientY);
    setRightClickCount(prev => {
      const newCount = prev + 1;
      playTick();
      scaleSpring.set(0.9);
      setTimeout(() => scaleSpring.set(1), 100);
      setProgress(Math.min((newCount / 3) * 100, 100));
      return newCount;
    });
  }, [currentMode.mode, playTick, scaleSpring, addTapRipple]);

  // SCROLL WHEEL MODE
  useEffect(() => {
    if (currentMode.mode !== "scrollWheel") return;
    
    const handleWheel = (e: WheelEvent) => {
      hasInteractedRef.current = true;
      // Scroll up (negative deltaY) adds progress
      if (e.deltaY < 0) {
        setScrollPulse(1);
        setTimeout(() => setScrollPulse(0), 200);
        setScrollAmount(prev => {
          const newAmount = prev + Math.abs(e.deltaY);
          playTick();
          setProgress(Math.min((newAmount / 500) * 100, 100));
          return newAmount;
        });
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentMode.mode, playTick]);

  // HOVER ZONE MODE
  const handleHoverZone = useCallback((zone: string) => {
    if (currentMode.mode !== "hoverZone") return;
    hasInteractedRef.current = true;
    setHoverZones(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(zone)) {
        newSet.add(zone);
        playTick();
        setProgress((newSet.size / 4) * 100);
      }
      return newSet;
    });
  }, [currentMode.mode, playTick]);

  // DRAG & DROP MODE - Drag a coin to a vault
  const handleDragDropStart = useCallback((e: React.MouseEvent) => {
    if (currentMode.mode !== "dragDrop") return;
    hasInteractedRef.current = true;
    setDragStartPos({ x: e.clientX, y: e.clientY });
  }, [currentMode.mode]);

  const handleDragDropMove = useCallback((e: React.MouseEvent) => {
    if (currentMode.mode !== "dragDrop" || !dragStartPos) return;
    // Check if dragged to the vault area (bottom center)
    const vaultArea = {
      x: window.innerWidth / 2,
      y: window.innerHeight - 150,
      radius: 80
    };
    const distance = Math.hypot(e.clientX - vaultArea.x, e.clientY - vaultArea.y);
    if (distance < vaultArea.radius) {
      setDragComplete(true);
      setProgress(100);
      playTick();
    }
  }, [currentMode.mode, dragStartPos, playTick]);

  // ============================================================================
  // ADDITIONAL MOBILE SENSOR MODES
  // ============================================================================

  // FACE DOWN MODE
  useEffect(() => {
    if (currentMode.mode !== "faceDown" || !isMobile) return;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta || 0; // -180 to 180 (front-back tilt)
      
      // Phone is face down when beta is close to 180 or -180
      const isFaceDown = Math.abs(Math.abs(beta) - 180) < 30;
      
      if (isFaceDown && !faceDownTimer) {
        hasInteractedRef.current = true;
        const timer = setInterval(() => {
          setFaceDownProgress(p => {
            const newP = p + 5;
            if (newP >= 100) {
              setProgress(100);
              playTick();
            } else {
              setProgress(newP);
            }
            return Math.min(newP, 100);
          });
        }, 100);
        setFaceDownTimer(timer);
      } else if (!isFaceDown && faceDownTimer) {
        clearInterval(faceDownTimer);
        setFaceDownTimer(null);
        if (faceDownProgress < 100) {
          setFaceDownProgress(0);
          setProgress(0);
        }
      }
    };
    
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (faceDownTimer) clearInterval(faceDownTimer);
    };
  }, [currentMode.mode, isMobile, faceDownTimer, faceDownProgress, playTick]);

  // STEP COUNTER MODE (uses accelerometer to detect steps)
  useEffect(() => {
    if (currentMode.mode !== "stepCounter" || !isMobile) return;
    
    let lastY = 0;
    let lastPeakTime = 0;
    
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc?.y) return;
      
      const now = Date.now();
      const y = acc.y;
      
      // Detect step as significant y-axis change (peak detection)
      if (y > lastY + 3 && now - lastPeakTime > 300) {
        hasInteractedRef.current = true;
        lastPeakTime = now;
        setStepCount(prev => {
          const newCount = prev + 1;
          playTick();
          setProgress(Math.min((newCount / 5) * 100, 100));
          return newCount;
        });
      }
      
      lastY = y;
    };
    
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }
    
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [currentMode.mode, isMobile, playTick]);

  // MULTI-TOUCH MODE
  const handleMultiTouch = useCallback((e: React.TouchEvent) => {
    if (currentMode.mode !== "multiTouch") return;
    
    if (e.touches.length >= 3) {
      hasInteractedRef.current = true;
      setTouchCount(prev => {
        const newCount = prev + 1;
        playTick();
        setProgress(Math.min((newCount / 3) * 100, 100));
        return newCount;
      });
    }
  }, [currentMode.mode, playTick]);

  // PINCH ZOOM MODE
  const handlePinchMove = useCallback((e: React.TouchEvent) => {
    if (currentMode.mode !== "pinchZoom") return;
    if (e.touches.length < 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (lastPinchDistance > 0) {
      const diff = Math.abs(distance - lastPinchDistance);
      if (diff > 50) {
        hasInteractedRef.current = true;
        setPinchCount(prev => {
          const newCount = prev + 1;
          playTick();
          setProgress(Math.min((newCount / 6) * 100, 100));
          return newCount;
        });
        setLastPinchDistance(distance);
      }
    } else {
      setLastPinchDistance(distance);
    }
  }, [currentMode.mode, lastPinchDistance, playTick]);

  // SQUEEZE MODE (detect pressure on edges via touch area)
  const handleSqueeze = useCallback((e: React.TouchEvent) => {
    if (currentMode.mode !== "squeeze") return;
    
    // Check if touches are on opposite edges
    const touches = Array.from(e.touches);
    if (touches.length >= 2) {
      const xs = touches.map(t => t.clientX);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const screenWidth = window.innerWidth;
      
      // Touches on opposite sides of screen
      if (minX < screenWidth * 0.2 && maxX > screenWidth * 0.8) {
        hasInteractedRef.current = true;
        setProgress(100);
        playTick();
      }
    }
  }, [currentMode.mode, playTick]);

  // LIGHT SENSOR MODE (ambient light API)
  useEffect(() => {
    if (currentMode.mode !== "lightSensor" || !isMobile) return;
    
    // Fallback: use camera if available or touch simulation
    let wasDark = false;
    
    // Try ambient light sensor
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          const lux = sensor.illuminance;
          hasInteractedRef.current = true;
          
          if (lux < 10) {
            wasDark = true;
            setProgress(50);
          } else if (wasDark && lux > 100) {
            setProgress(100);
            playTick();
          }
        });
        sensor.start();
        return () => sensor.stop();
      } catch {
        // Sensor not available
      }
    }
    
    // Fallback: use touch taps like proximity
    return undefined;
  }, [currentMode.mode, isMobile, playTick]);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!gateVisible) return null;

  // Combined touch/pointer handlers based on current mode
  const handleInteractionStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Set drag start point for mouse/touch
    if ('touches' in e) {
      handleTouchStart(e);
    } else {
      handleMouseStart(e);
    }
    
    // Mode-specific start handlers
    if (currentMode.mode === "hold") handleHoldStart();
    else if (currentMode.mode === "longPress") handleLongPressStart();
    else if (currentMode.mode === "breath") handleBreathStart();
    else if (currentMode.mode === "morse") handleMorseStart();
    else if (currentMode.mode === "countdown") handleCountdownStart();
  };

  const handleInteractionEnd = () => {
    // Reset drag state
    if (isDraggingRef.current) {
      handleMouseEnd();
    }
    handleTouchEnd();
    
    // Mode-specific end handlers  
    if (currentMode.mode === "hold") handleHoldEnd();
    else if (currentMode.mode === "longPress") handleLongPressEnd();
    else if (currentMode.mode === "breath") handleBreathEnd();
    else if (currentMode.mode === "morse") handleMorseEnd();
    else if (currentMode.mode === "countdown") handleCountdownEnd();
  };

  const handleInteractionMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      handleTouchMove(e);
      handlePatternPoint(e);
      handleZigzagMove(e);
    } else {
      // Desktop mouse handling
      handleMouseMove(e);
      handlePatternPoint(e);
      handleZigzagMove(e);
      handleShakeMouseMove(e); // Desktop shake alternative
    }
    handleRotateMove(e);
    handleSpiralMove(e);
    handleCircleMove(e);
    handleScratchMove(e);
    handleInfinityMove(e);
    handleSliderMove(e);
    
    // Mobile-specific move handlers
    if ('touches' in e) {
      handlePinchMove(e);
      handleSqueeze(e);
    }
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Add ripple visual feedback on any click/tap
    const clientX = 'touches' in e ? e.changedTouches?.[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.changedTouches?.[0]?.clientY || 0 : e.clientY;
    addTapRipple(clientX, clientY);
    
    // Trigger combo system for all tap-based interactions
    if (['tap', 'doubleTap', 'pulse', 'tripleTap', 'speedTap'].includes(currentMode.mode)) {
      triggerComboAction(clientX, clientY);
    }
    
    if (currentMode.mode === "tap") handleTap(e);
    else if (currentMode.mode === "doubleTap") handleDoubleTap();
    else if (currentMode.mode === "pulse") handlePulseTap();
    else if (currentMode.mode === "alternate") handleAlternateTap(e);
    else if (currentMode.mode === "corners") handleCornerTap(e);
    else if (currentMode.mode === "tripleTap") handleTripleTap();
    else if (currentMode.mode === "speedTap") handleSpeedTap();
    else if (currentMode.mode === "proximity") handleProximityTap();
    else if (currentMode.mode === "lightSensor") handleProximityTap(); // Fallback
  };

  // Track cursor/touch position and add trail
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    setCursorPos({ x: clientX, y: clientY });
    
    // Add trail for drag-type interactions
    if (isDraggingRef.current || ['swipe', 'pattern', 'zigzag', 'spiral', 'circle', 'scratch', 'infinity', 'slider', 'dragDrop'].includes(currentMode.mode)) {
      addTrailPoint(clientX, clientY);
    }
    
    handleInteractionMove(e);
  };

  // Touch-specific handlers for mobile modes
  const handleTouchStartMobile = (e: React.TouchEvent) => {
    handleInteractionStart(e);
    handleMultiTouch(e);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden"
        style={{ 
          backgroundColor: "#000", 
          cursor: "pointer",
          // Apply device tilt effect (iPhone-like parallax)
          transform: isMobile ? `perspective(1000px) rotateX(${deviceTilt.y}deg) rotateY(${-deviceTilt.x}deg)` : undefined,
          transition: "transform 0.1s ease-out",
          minHeight: "100dvh", // Use dynamic viewport height
        }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          // Shake effect
          x: shakeIntensity > 0 ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity/2, 0] : 0,
        }}
        transition={{ x: { duration: 0.3 } }}
        exit={{ opacity: 0 }}
        onTouchStart={handleTouchStartMobile}
        onTouchMove={handlePointerMove}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseMove={handlePointerMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleRightClick}
      >
        {/* Background Candlesticks */}
        <BackgroundCandlesticks />

        {/* ===== CONFETTI CELEBRATION ===== */}
        {showConfetti && confettiParticles.map(particle => (
          <ConfettiParticle
            key={particle.id}
            delay={particle.delay}
            left={particle.left}
            color={particle.color}
          />
        ))}

        {/* ===== ACHIEVEMENT POPUP ===== */}
        <AchievementBadge
          icon={showAchievement?.icon}
          label={showAchievement?.label || ''}
          show={!!showAchievement}
        />

        {/* ===== FLOATING SCORE POPUPS ===== */}
        {floatingScores.map(score => (
          <FloatingScore
            key={score.id}
            value={score.value}
            x={score.x}
            y={score.y}
            id={score.id}
          />
        ))}

        {/* ===== COMBO COUNTER DISPLAY ===== */}
        <AnimatePresence>
          {streakActive && comboCount > 1 && !isUnlocked && (
            <motion.div
              className="fixed top-4 left-4 z-50 flex flex-col items-center"
              initial={{ scale: 0, opacity: 0, x: -50 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: -50 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <div 
                className="relative px-4 py-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(0, 0, 0, 0.8))',
                  border: '2px solid #3b82f6',
                  boxShadow: streakActive ? '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.3)' : '0 0 10px #3b82f6',
                }}
              >
                {/* Electric effect on high combos */}
                {comboCount >= 5 && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)',
                        animation: 'shimmer 1s linear infinite',
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-2 relative">
                  <motion.div
                    animate={{ 
                      rotate: comboCount >= 10 ? [0, 360] : 0,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 0.5, repeat: Infinity },
                    }}
                  >
                    <Zap 
                      size={24} 
                      style={{ 
                        color: comboCount >= 10 ? '#60a5fa' : '#3b82f6',
                        filter: `drop-shadow(0 0 ${Math.min(comboCount * 2, 20)}px #3b82f6)`,
                      }} 
                    />
                  </motion.div>
                  <div className="text-center">
                    <motion.p 
                      className="text-2xl font-black text-white"
                      style={{ 
                        textShadow: '0 0 10px #3b82f6',
                      }}
                      key={comboCount}
                      initial={{ scale: 1.5, y: -10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', bounce: 0.6 }}
                    >
                      x{comboCount}
                    </motion.p>
                    <p className="text-[10px] font-medium" style={{ color: '#3b82f6' }}>
                      {comboMultiplier > 1 ? `${comboMultiplier.toFixed(1)}x MULTI` : 'COMBO'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Combo tier indicator */}
              {comboCount >= 5 && (
                <motion.div
                  className="mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {comboCount >= 20 ? (
                    <>
                      <Sparkles size={14} style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 4px #60a5fa)' }} />
                      <span className="text-xs font-bold" style={{ color: '#60a5fa', textShadow: '0 0 10px #60a5fa' }}>LEGENDARY</span>
                    </>
                  ) : comboCount >= 10 ? (
                    <>
                      <Zap size={14} style={{ color: '#3b82f6', filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                      <span className="text-xs font-bold" style={{ color: '#3b82f6', textShadow: '0 0 10px #3b82f6' }}>ON FIRE</span>
                    </>
                  ) : (
                    <>
                      <Star size={14} style={{ color: '#3b82f6', filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                      <span className="text-xs font-bold" style={{ color: '#3b82f6', textShadow: '0 0 10px #3b82f6' }}>NICE</span>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== MILESTONE CELEBRATION ===== */}
        <AnimatePresence>
          {milestoneReached && (
            <motion.div
              className="fixed inset-0 pointer-events-none flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', bounce: 0.6 }}
              >
                <p 
                  className="text-6xl sm:text-8xl font-black"
                  style={{
                    color: '#3b82f6',
                    textShadow: '0 0 30px #3b82f6, 0 0 60px #3b82f6, 0 0 90px rgba(59, 130, 246, 0.5)',
                  }}
                >
                  {milestoneReached}%
                </p>
                <motion.p
                  className="text-lg sm:text-xl font-bold text-white mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {milestoneReached === 25 ? 'Quarter Way!' : milestoneReached === 50 ? 'Halfway There!' : milestoneReached === 90 ? 'ALMOST!' : 'Almost There!'}
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== ENCOURAGEMENT TEXT POPUP ===== */}
        <AnimatePresence>
          {encouragementText && !milestoneReached && (
            <motion.div
              className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <p 
                className="text-xl sm:text-2xl font-bold text-center px-4"
                style={{
                  color: '#fff',
                  textShadow: '0 0 15px #3b82f6, 0 0 30px #3b82f6, 0 0 45px rgba(59, 130, 246, 0.5)',
                }}
              >
                {encouragementText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== SCORE DISPLAY (Top Right) ===== */}
        {totalScore > 0 && !isUnlocked && (
          <motion.div
            className="fixed top-4 right-4 z-40 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-blue-400 font-medium">SCORE</p>
            <motion.p 
              className="text-lg font-bold text-white"
              key={totalScore}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {totalScore.toLocaleString()}
            </motion.p>
          </motion.div>
        )}

        {/* ===== VISUAL FEEDBACK ELEMENTS ===== */}
        
        {/* Tap Ripples - expanding circles on click/tap */}
        {tapRipples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 100, height: 100, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                border: "2px solid #3b82f6",
                boxShadow: "0 0 20px #3b82f6, inset 0 0 10px rgba(59, 130, 246, 0.3)",
              }}
            />
          </motion.div>
        ))}

        {/* Drag Trail - glowing dots following cursor */}
        {trailPoints.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            <defs>
              <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {trailPoints.length > 1 && (
              <motion.path
                d={`M ${trailPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                stroke="url(#trailGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: "drop-shadow(0 0 6px #3b82f6)",
                }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.1 }}
              />
            )}
            {/* Trail dots */}
            {trailPoints.slice(-8).map((point, i) => (
              <motion.circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={2 + i * 0.5}
                fill="#3b82f6"
                style={{
                  filter: "drop-shadow(0 0 4px #3b82f6)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.3 + i * 0.1, scale: 1 }}
                exit={{ opacity: 0 }}
              />
            ))}
          </svg>
        )}

        {/* Cursor glow for desktop */}
        {!isMobile && cursorPos.x > 0 && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              transform: "translate(-50%, -50%)",
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
              filter: "blur(5px)",
            }}
            animate={{
              scale: isDraggingRef.current ? 1.5 : 1,
            }}
            transition={{ duration: 0.15 }}
          />
        )}

        {/* Key Press Visuals - floating key indicators */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 100 }}>
          <AnimatePresence>
            {keyPressVisuals.map((kp, i) => (
              <motion.div
                key={kp.id}
                className="absolute px-3 py-2 rounded-lg font-bold text-sm"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.3)",
                  border: "2px solid #3b82f6",
                  boxShadow: "0 0 15px #3b82f6",
                  color: "#fff",
                  left: `${i * 10 - 20}px`,
                }}
                initial={{ y: 0, opacity: 1, scale: 1.2 }}
                animate={{ y: -50, opacity: 0, scale: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {kp.key}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Scroll Pulse Effect */}
        {currentMode.mode === "scrollWheel" && scrollPulse > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, rgba(59, 130, 246, ${scrollPulse * 0.1}) 0%, transparent 50%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        {/* Hold/Press visual feedback ring */}
        {isHolding && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 250,
              height: 250,
              borderRadius: "50%",
              border: "3px solid rgba(59, 130, 246, 0.5)",
              boxShadow: "0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 40px rgba(59, 130, 246, 0.2)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Live Price Ticker - Compact */}
        <motion.div
          className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-10"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 sm:gap-3"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.15)",
            }}
          >
            {/* Asset selector - smaller buttons */}
            <div className="flex gap-1">
              {(Object.keys(ASSETS) as AssetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedAsset(key)}
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all",
                    selectedAsset === key && "scale-110"
                  )}
                  style={{
                    backgroundColor: selectedAsset === key ? "rgba(59, 130, 246, 0.2)" : "transparent",
                    border: `1px solid ${selectedAsset === key ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    color: selectedAsset === key ? "#fff" : "#3b82f6",
                    boxShadow: selectedAsset === key ? "0 0 8px #3b82f6" : "none",
                  }}
                >
                  {ASSETS[key].icon}
                </button>
              ))}
            </div>

            {/* Price display - compact */}
            <div className="flex items-center gap-2">
              <span 
                className="text-sm font-bold neon-text"
                style={{ 
                  fontFamily: "monospace",
                  textShadow: "0 0 8px #fff, 0 0 15px #3b82f6",
                }}
              >
                {price > 0 ? formatPrice(price) : "..."}
              </span>
              <span 
                className="text-xs flex items-center"
                style={{ color: change24h >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {change24h >= 0 ? <TrendingUp size={10} /> : <ArrowUpRight size={10} className="rotate-90" />}
                {change24h.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Main Unlock Circle - hide when unlocked */}
        {!isUnlocked && (
          <motion.div
            className="relative flex items-center justify-center flex-shrink-0"
            style={{ 
              scale: scaleSpring,
              marginTop: "clamp(1rem, 5vh, 3rem)", // Responsive margin
              marginBottom: "clamp(0.5rem, 2vh, 1rem)",
            }}
          >
            {/* Outer glow ring */}
            <div 
              className="absolute w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
                animation: isHolding ? "none" : "ring-rotate 10s linear infinite",
              }}
            />

            {/* Progress ring */}
            <NeonRing progress={progress} size={160} />

            {/* Inactivity Warning Indicator */}
            <AnimatePresence>
              {inactivityWarning && !showRetryButton && (
                <motion.div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(59, 130, 246, 0.5)",
                    boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Timer size={14} style={{ color: "#60a5fa" }} />
                  </motion.div>
                  <span className="text-xs font-medium" style={{ color: "#60a5fa" }}>
                    Keep going!
                  </span>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Center button */}
          <motion.button
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1 sm:gap-2 neon-border"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              borderRadius: "9999px",
              aspectRatio: "1 / 1",
            }}
            onPointerDown={() => {
              if (currentMode.mode === "hold") handleHoldStart();
              else if (currentMode.mode === "longPress") handleLongPressStart();
              else if (currentMode.mode === "breath") handleBreathStart();
            }}
            onPointerUp={() => {
              if (currentMode.mode === "hold") handleHoldEnd();
              else if (currentMode.mode === "longPress") handleLongPressEnd();
              else if (currentMode.mode === "breath") handleBreathEnd();
            }}
            onPointerLeave={() => {
              if (currentMode.mode === "hold") handleHoldEnd();
              else if (currentMode.mode === "longPress") handleLongPressEnd();
            }}
            onClick={() => {
              if (currentMode.mode === "tap") handleTap();
              else if (currentMode.mode === "doubleTap") handleDoubleTap();
              else if (currentMode.mode === "pulse") handlePulseTap();
            }}
            whileTap={["tap", "doubleTap", "pulse"].includes(currentMode.mode) ? { scale: 0.9 } : undefined}
          >
            {/* Icon - only show when not unlocked */}
            {!isUnlocked && (
              <div 
                className="neon-icon"
                style={{
                  color: "#3b82f6",
                  filter: "drop-shadow(0 0 8px #3b82f6) drop-shadow(0 0 15px #3b82f6)",
                }}
              >
                <currentMode.icon size={36} />
              </div>
            )}

            {/* Progress text - only show when not unlocked */}
            {!isUnlocked && (
              <span 
                className="text-xl font-bold neon-text"
                style={{ 
                  fontFamily: "monospace",
                  textShadow: "0 0 10px #fff, 0 0 20px #3b82f6",
                }}
              >
                {Math.round(progress)}%
              </span>
            )}
          </motion.button>

          {/* SUCCESS OVERLAY - Beautiful unlock screen with Bull Logo */}
          <AnimatePresence>
            {isUnlocked && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-[100]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: '#3b82f6',
                        boxShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -100, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>

                {/* Radiating rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {[1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute rounded-full"
                      style={{
                        width: 150 + ring * 80,
                        height: 150 + ring * 80,
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        boxShadow: `0 0 ${20 + ring * 10}px rgba(59, 130, 246, 0.1)`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [1, 1.2, 1], 
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: ring * 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* Main content container */}
                <motion.div
                  className="relative flex flex-col items-center gap-6 z-10"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                >
                  {/* Bull Logo with neon glow */}
                  <motion.div
                    className="relative"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {/* Glow backdrop */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        transform: 'scale(2)',
                      }}
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1.8, 2.2, 1.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                    
                    {/* Bull SVG Logo */}
                    <motion.img
                      src="/BULL.svg"
                      alt="Bull Money"
                      className="relative z-10"
                      style={{
                        width: 120,
                        height: 120,
                        filter: 'drop-shadow(0 0 15px #3b82f6) drop-shadow(0 0 30px #3b82f6) drop-shadow(0 0 45px rgba(59, 130, 246, 0.5))',
                      }}
                      animate={{
                        filter: [
                          'drop-shadow(0 0 15px #3b82f6) drop-shadow(0 0 30px #3b82f6) drop-shadow(0 0 45px rgba(59, 130, 246, 0.5))',
                          'drop-shadow(0 0 25px #3b82f6) drop-shadow(0 0 50px #3b82f6) drop-shadow(0 0 75px rgba(59, 130, 246, 0.7))',
                          'drop-shadow(0 0 15px #3b82f6) drop-shadow(0 0 30px #3b82f6) drop-shadow(0 0 45px rgba(59, 130, 246, 0.5))',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </motion.div>

                  {/* Success Text */}
                  <motion.div
                    className="text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.h2
                      className="text-3xl md:text-4xl font-bold mb-2"
                      style={{
                        color: '#fff',
                        textShadow: '0 0 10px #fff, 0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 60px rgba(59, 130, 246, 0.5)',
                      }}
                      animate={{
                        textShadow: [
                          '0 0 10px #fff, 0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 60px rgba(59, 130, 246, 0.5)',
                          '0 0 15px #fff, 0 0 30px #3b82f6, 0 0 60px #3b82f6, 0 0 90px rgba(59, 130, 246, 0.7)',
                          '0 0 10px #fff, 0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 60px rgba(59, 130, 246, 0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ACCESS GRANTED
                    </motion.h2>
                    <motion.p
                      className="text-lg mb-4"
                      style={{
                        color: '#3b82f6',
                        textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                      }}
                    >
                      Welcome to Bull Money
                    </motion.p>
                    
                    {/* Performance Summary */}
                    {totalScore > 0 && (
                      <motion.div
                        className="flex flex-wrap gap-3 justify-center items-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        {/* Final Score */}
                        <div 
                          className="px-4 py-2 rounded-lg flex items-center gap-2"
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                          }}
                        >
                          <Star size={16} className="text-blue-400" />
                          <span className="text-white font-bold">{totalScore}</span>
                          <span className="text-blue-400 text-sm">pts</span>
                        </div>
                        
                        {/* Max Combo */}
                        {comboCount > 1 && (
                          <div 
                            className="px-4 py-2 rounded-lg flex items-center gap-2"
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                            }}
                          >
                            <Zap size={16} className="text-blue-400" />
                            <span className="text-white font-bold">x{comboCount}</span>
                            <span className="text-blue-400 text-sm">combo</span>
                          </div>
                        )}
                        
                        {/* Achievements count */}
                        {achievements.size > 0 && (
                          <div 
                            className="px-4 py-2 rounded-lg flex items-center gap-2"
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                            }}
                          >
                            <Heart size={16} className="text-blue-400" />
                            <span className="text-white font-bold">{achievements.size}</span>
                            <span className="text-blue-400 text-sm">{achievements.size === 1 ? 'badge' : 'badges'}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Loading indicator */}
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        )}

        {/* Instruction text - hide when unlocked */}
        {!isUnlocked && (
          <motion.div
            className="mt-4 sm:mt-8 md:mt-12 text-center px-4 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p 
              className="text-base sm:text-lg md:text-xl font-bold mb-2 neon-text"
              style={{
                textShadow: "0 0 10px #fff, 0 0 20px #3b82f6, 0 0 40px #3b82f6",
              }}
            >
              {currentMode.mode === "breath" 
                ? `${currentMode.instruction} (${breathPhase === "hold" ? "HOLD" : "RELEASE"})` 
                : currentMode.instruction}
            </p>
            <p 
              className="text-xs sm:text-sm opacity-70"
              style={{ color: "#3b82f6" }}
            >
              {currentMode.tradingMetaphor}
            </p>
          </motion.div>
        )}

        {/* Trading wisdom quote - patience metaphors - hide when unlocked */}
        {!isUnlocked && (
          <motion.div
            className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p 
              className="text-center text-[10px] sm:text-xs italic"
              style={{ 
                color: "rgba(59, 130, 246, 0.5)",
                textShadow: "0 0 5px rgba(59, 130, 246, 0.3)",
              }}
            >
              &ldquo;{quote}&rdquo;
            </p>
          </motion.div>
        )}

        {/* RETRY BUTTON - Shows on timeout or failure */}
        <AnimatePresence>
          {showRetryButton && !isUnlocked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            >
              <motion.div
                className="flex flex-col items-center gap-4 p-8 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0.9))",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.05)",
                }}
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
              >
                {/* Timeout/Failure message */}
                <div className="text-center">
                  <p 
                    className="text-lg font-bold mb-2"
                    style={{ 
                      color: "#3b82f6",
                      textShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                    }}
                  >
                    {isTimedOut ? "Taking too long?" : "Need another try?"}
                  </p>
                  <p className="text-sm opacity-70" style={{ color: "#94a3b8" }}>
                    {failureCount === 0 
                      ? "Don't worry, try again!" 
                      : "One more attempt available"}
                  </p>
                </div>

                {/* Attempt indicator */}
                <div className="flex gap-2">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full transition-all"
                      style={{
                        backgroundColor: i < failureCount ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.3)",
                        boxShadow: i < failureCount ? "0 0 10px rgba(239, 68, 68, 0.5)" : "0 0 5px rgba(59, 130, 246, 0.2)",
                      }}
                    />
                  ))}
                </div>

                {/* Retry button */}
                <motion.button
                  onClick={handleRetry}
                  className="px-8 py-3 rounded-xl font-bold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(59, 130, 246, 0.5)",
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(59, 130, 246, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw size={18} />
                    {failureCount >= 1 ? "Enter Site" : "Try Again"}
                  </span>
                </motion.button>

                {/* Skip button for first failure */}
                {failureCount === 0 && (
                  <motion.button
                    onClick={() => {
                      // Skip directly to site
                      setFailureCount(2);
                      completedRef.current = true;
                      setIsUnlocked(true);
                      successFeedback();
                      setTimeout(() => {
                        setGateVisible(false);
                        onFinished?.();
                      }, 800);
                    }}
                    className="text-xs underline opacity-50 hover:opacity-80 transition-opacity"
                    style={{ color: "#64748b" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Skip interaction
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pattern trail visualization */}
        {currentMode.mode === "pattern" && patternPoints.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            <motion.path
              d={`M ${patternPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              stroke="#3b82f6"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: "drop-shadow(0 0 5px #3b82f6) drop-shadow(0 0 10px #3b82f6)",
              }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.1 }}
            />
          </svg>
        )}

        {/* Shake indicator */}
        {currentMode.mode === "shake" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-4xl font-bold neon-text">
              {shakeCount}
            </p>
            <p className="text-xs" style={{ color: "#3b82f6" }}>shakes</p>
            <p className="text-xs mt-1 opacity-50" style={{ color: "#3b82f6" }}>
              Mobile: shake device • Desktop: move mouse rapidly
            </p>
          </motion.div>
        )}

        {/* Tap counter */}
        {currentMode.mode === "tap" && tapCount > 0 && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <p className="text-4xl font-bold neon-text">
              {tapCount}
            </p>
            <p className="text-xs" style={{ color: "#3b82f6" }}>taps</p>
          </motion.div>
        )}

        {/* Rotation indicator with visual rotating ring */}
        {currentMode.mode === "rotate" && (
          <>
            <motion.div
              className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-2 rounded-full flex items-center justify-center relative"
                style={{
                  border: "3px dashed rgba(59, 130, 246, 0.5)",
                }}
                animate={{ rotate: rotationAngle }}
              >
                <div 
                  className="absolute w-3 h-3 rounded-full -top-1"
                  style={{ 
                    backgroundColor: "#3b82f6",
                    boxShadow: "0 0 10px #3b82f6, 0 0 20px #3b82f6" 
                  }}
                />
                <RefreshCw size={32} style={{ color: "#3b82f6" }} />
              </motion.div>
              <p className="text-4xl font-bold neon-text">
                {Math.floor(rotationAngle)}°
              </p>
              <p className="text-xs" style={{ color: "#3b82f6" }}>rotation</p>
            </motion.div>
          </>
        )}

        {/* Zigzag indicator with animated direction arrows */}
        {currentMode.mode === "zigzag" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-center gap-4 mb-2">
              <motion.div
                animate={{ 
                  x: zigzagDirection === "left" ? [-5, 0] : [0, -5],
                  opacity: zigzagDirection === "left" ? 1 : 0.3
                }}
                transition={{ duration: 0.2 }}
              >
                <ArrowLeft size={32} style={{ color: "#3b82f6" }} />
              </motion.div>
              <motion.div
                animate={{ 
                  x: zigzagDirection === "right" ? [5, 0] : [0, 5],
                  opacity: zigzagDirection === "right" ? 1 : 0.3
                }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight size={32} style={{ color: "#3b82f6" }} />
              </motion.div>
            </div>
            <p className="text-4xl font-bold neon-text">
              {zigzagCount}/6
            </p>
            <p className="text-xs" style={{ color: "#3b82f6" }}>
              {zigzagDirection ? `→ Now go ${zigzagDirection === "right" ? "LEFT" : "RIGHT"}` : "Swipe left or right"}
            </p>
          </motion.div>
        )}

        {/* Pulse rhythm indicator - Enhanced with visual beat guide */}
        {currentMode.mode === "pulse" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Pulsing beat guide */}
            <motion.div
              className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center relative"
              style={{
                border: '3px solid rgba(59, 130, 246, 0.5)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Inner pulse ring - shows timing */}
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{
                  border: '2px solid #3b82f6',
                  boxShadow: '0 0 15px #3b82f6, inset 0 0 15px rgba(59, 130, 246, 0.3)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 0.5, // 500ms rhythm
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <Heart 
                size={28} 
                className="relative z-10"
                style={{ 
                  color: '#3b82f6',
                  filter: 'drop-shadow(0 0 8px #3b82f6)',
                }} 
              />
            </motion.div>
            
            {/* Beat indicator dots */}
            <div className="flex gap-2 justify-center mb-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: pulseTaps.length > i ? "#3b82f6" : "rgba(59, 130, 246, 0.3)",
                    boxShadow: pulseTaps.length > i ? "0 0 10px #3b82f6" : "none",
                  }}
                  animate={pulseTaps.length === i + 1 ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: "#3b82f6" }}>
              Tap with the pulse!
            </p>
            <p className="text-[10px] mt-1" style={{ color: "rgba(59, 130, 246, 0.6)" }}>
              Stay in rhythm for bonus points
            </p>
          </motion.div>
        )}

        {/* Breath phase indicator */}
        {currentMode.mode === "breath" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isHolding ? "rgba(59, 130, 246, 0.3)" : "transparent",
                border: `2px solid ${isHolding ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                boxShadow: isHolding ? "0 0 20px #3b82f6" : "none",
              }}
              animate={isHolding ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isHolding ? Infinity : 0 }}
            >
              <span className="text-lg" style={{ color: "#3b82f6" }}>
                {breathPhase === "hold" ? "⬇" : "⬆"}
              </span>
            </motion.div>
            <p className="text-2xl font-bold neon-text">{breathCount}/8</p>
            <p className="text-xs" style={{ color: "#3b82f6" }}>cycles</p>
          </motion.div>
        )}

        {/* Long press timer */}
        {currentMode.mode === "longPress" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isHolding ? "rgba(59, 130, 246, 0.2)" : "transparent",
                border: `3px solid ${isHolding ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                boxShadow: isHolding ? "0 0 30px #3b82f6, inset 0 0 20px rgba(59, 130, 246, 0.3)" : "none",
              }}
            >
              <span className="text-2xl font-bold neon-text">{Math.ceil((100 - progress) / 33.3) || 0}s</span>
            </motion.div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>{isHolding ? "Keep holding..." : "Press and hold"}</p>
          </motion.div>
        )}

        {/* Double tap hint */}
        {currentMode.mode === "doubleTap" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-4 justify-center mb-2">
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: lastTapTime ? "rgba(59, 130, 246, 0.3)" : "transparent",
                  border: "2px solid rgba(59, 130, 246, 0.5)",
                  boxShadow: lastTapTime ? "0 0 10px #3b82f6" : "none",
                }}
                animate={lastTapTime ? { scale: [1, 1.2, 1] } : {}}
              >
                <span style={{ color: "#3b82f6" }}>1</span>
              </motion.div>
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "transparent",
                  border: "2px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <span style={{ color: "rgba(59, 130, 246, 0.5)" }}>2</span>
              </motion.div>
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Double tap quickly!</p>
          </motion.div>
        )}

        {/* Triple tap hint */}
        {currentMode.mode === "tripleTap" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-3 justify-center mb-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: tripleTapTimes.length >= i ? "rgba(59, 130, 246, 0.3)" : "transparent",
                    border: `2px solid ${tripleTapTimes.length >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: tripleTapTimes.length >= i ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <span style={{ color: tripleTapTimes.length >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.5)" }}>{i}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Triple tap quickly!</p>
          </motion.div>
        )}

        {/* Speed tap indicator */}
        {currentMode.mode === "speedTap" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-5xl font-bold neon-text">{speedTapCount}</p>
            <p className="text-sm" style={{ color: "#3b82f6" }}>/20 taps</p>
            {speedTapStartTime > 0 && (
              <p className="text-xs mt-1" style={{ color: "rgba(59, 130, 246, 0.7)" }}>
                {Math.max(0, 5 - Math.floor((Date.now() - speedTapStartTime) / 1000))}s remaining
              </p>
            )}
          </motion.div>
        )}

        {/* Morse code indicator */}
        {currentMode.mode === "morse" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-3 justify-center mb-3">
              {["short", "short", "long"].map((expected, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center"
                  style={{
                    width: expected === "long" ? 40 : 20,
                    height: 20,
                    backgroundColor: morseTaps[i] === expected ? "#3b82f6" : "rgba(59, 130, 246, 0.2)",
                    borderRadius: 4,
                    boxShadow: morseTaps[i] === expected ? "0 0 10px #3b82f6" : "none",
                  }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>
              {isHolding ? "Release for short, keep holding for long..." : "Tap: • • —"}
            </p>
          </motion.div>
        )}

        {/* Alternate sides indicator */}
        {currentMode.mode === "alternate" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-8 justify-center mb-2">
              <motion.div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: alternateSide === "left" ? "rgba(59, 130, 246, 0.3)" : "transparent",
                  border: `2px solid ${alternateSide === "left" ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                  boxShadow: alternateSide === "left" ? "0 0 15px #3b82f6" : "none",
                }}
                animate={alternateSide === "left" ? { scale: [1, 1.1, 1] } : {}}
              >
                <ArrowLeft size={24} style={{ color: "#3b82f6" }} />
              </motion.div>
              <motion.div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: alternateSide === "right" ? "rgba(59, 130, 246, 0.3)" : "transparent",
                  border: `2px solid ${alternateSide === "right" ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                  boxShadow: alternateSide === "right" ? "0 0 15px #3b82f6" : "none",
                }}
                animate={alternateSide === "right" ? { scale: [1, 1.1, 1] } : {}}
              >
                <ArrowRight size={24} style={{ color: "#3b82f6" }} />
              </motion.div>
            </div>
            <p className="text-xl font-bold neon-text">{alternateCount}/10</p>
          </motion.div>
        )}

        {/* Corners indicator */}
        {currentMode.mode === "corners" && (
          <>
            {["tl", "tr", "bl", "br"].map((corner) => (
              <motion.div
                key={corner}
                className="absolute w-16 h-16 rounded-lg flex items-center justify-center"
                style={{
                  top: corner.includes("t") ? 80 : "auto",
                  bottom: corner.includes("b") ? 150 : "auto",
                  left: corner.includes("l") ? 20 : "auto",
                  right: corner.includes("r") ? 20 : "auto",
                  backgroundColor: cornersHit.has(corner) ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                  border: `2px solid ${cornersHit.has(corner) ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                  boxShadow: cornersHit.has(corner) ? "0 0 20px #3b82f6" : "none",
                }}
                animate={cornersHit.has(corner) ? { scale: [1, 1.2, 1] } : {}}
              >
                <Target size={24} style={{ color: cornersHit.has(corner) ? "#3b82f6" : "rgba(59, 130, 246, 0.3)" }} />
              </motion.div>
            ))}
          </>
        )}

        {/* Countdown indicator */}
        {currentMode.mode === "countdown" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-24 h-24 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isHolding ? "rgba(59, 130, 246, 0.2)" : "transparent",
                border: `4px solid ${isHolding ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                boxShadow: isHolding ? "0 0 40px #3b82f6" : "none",
              }}
              animate={isHolding ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-4xl font-bold neon-text">{countdownValue}</span>
            </motion.div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>{isHolding ? "Keep holding..." : "Press and hold"}</p>
          </motion.div>
        )}

        {/* Slider indicator */}
        {currentMode.mode === "slider" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 w-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="relative h-4 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(59, 130, 246, 0.2)", border: "2px solid rgba(59, 130, 246, 0.3)" }}
            >
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{ 
                  width: `${sliderProgress}%`,
                  backgroundColor: "#3b82f6",
                  boxShadow: "0 0 15px #3b82f6",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <ArrowRight size={16} style={{ color: "#3b82f6" }} />
              <span className="text-xs" style={{ color: "#3b82f6" }}>Drag right →</span>
            </div>
          </motion.div>
        )}

        {/* Spiral/Circle visual guide */}
        {(currentMode.mode === "spiral" || currentMode.mode === "circle") && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{
                border: `3px dashed rgba(59, 130, 246, 0.5)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6", boxShadow: "0 0 10px #3b82f6" }} />
            </motion.div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>
              {currentMode.mode === "spiral" ? "Draw inward spiral" : `${Math.round(progress)}% complete`}
            </p>
          </motion.div>
        )}

        {/* Scratch area visual */}
        {currentMode.mode === "scratch" && (
          <motion.div
            className="absolute top-28 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="w-36 h-36 grid grid-cols-5 gap-0.5 p-1 rounded-lg"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", border: "2px solid rgba(59, 130, 246, 0.3)" }}
            >
              {Array.from({ length: 25 }).map((_, i) => {
                const x = i % 5;
                const y = Math.floor(i / 5);
                const key = `${x}-${y}`;
                return (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{
                      backgroundColor: scratchArea.has(key) ? "transparent" : "rgba(59, 130, 246, 0.3)",
                      boxShadow: scratchArea.has(key) ? "none" : "inset 0 0 5px rgba(59, 130, 246, 0.5)",
                    }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "#3b82f6" }}>Scratch to reveal!</p>
          </motion.div>
        )}

        {/* Infinity/Figure-8 guide */}
        {currentMode.mode === "infinity" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-2" style={{ color: "#3b82f6", textShadow: "0 0 10px #3b82f6" }}>∞</div>
            <p className="text-xl font-bold neon-text">{infinityPhase}/8</p>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Draw figure-8 pattern</p>
          </motion.div>
        )}

        {/* Mobile-only: Tilt indicator */}
        {currentMode.mode === "tilt" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-2"
              animate={{ rotateX: tiltProgress * 0.45 }}
            >
              <Smartphone size={64} style={{ color: "#3b82f6" }} />
            </motion.div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Tilt device forward</p>
          </motion.div>
        )}

        {/* Mobile-only: Flip indicator */}
        {currentMode.mode === "flip" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-4 justify-center mb-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: flipState !== "normal" ? "rgba(59, 130, 246, 0.3)" : "transparent",
                  border: `2px solid ${flipState !== "normal" ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                }}
              >
                <FlipVertical size={20} style={{ color: "#3b82f6" }} />
              </div>
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: flipState === "returned" ? "rgba(59, 130, 246, 0.3)" : "transparent",
                  border: `2px solid ${flipState === "returned" ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                }}
              >
                <Smartphone size={20} style={{ color: "#3b82f6" }} />
              </div>
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>
              {flipState === "normal" ? "Flip face down" : flipState === "flipped" ? "Now flip back up" : "Complete!"}
            </p>
          </motion.div>
        )}

        {/* Mobile-only: Compass indicator */}
        {currentMode.mode === "compass" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center"
              style={{
                border: "3px solid rgba(59, 130, 246, 0.5)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
              animate={{ rotate: -compassHeading }}
            >
              <Navigation size={32} style={{ color: "#3b82f6", transform: "rotate(-45deg)" }} />
            </motion.div>
            <p className="text-lg font-bold neon-text">N</p>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Rotate to face North</p>
          </motion.div>
        )}

        {/* Mobile-only: Proximity indicator */}
        {currentMode.mode === "proximity" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-2 justify-center mb-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: proximityTriggered >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.2)",
                    boxShadow: proximityTriggered >= i ? "0 0 10px #3b82f6" : "none",
                  }}
                />
              ))}
            </div>
            <Eye size={32} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>
              {isMobile ? "Cover and uncover screen" : "Tap the center"}
            </p>
          </motion.div>
        )}

        {/* ===== DESKTOP KEYBOARD MODE INDICATORS ===== */}

        {/* Konami Code indicator */}
        {currentMode.mode === "konami" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-1 justify-center mb-3 flex-wrap max-w-xs">
              {["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"].map((key, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: konamiSequence.length > i ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${konamiSequence.length > i ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: konamiSequence.length > i ? "0 0 10px #3b82f6" : "none",
                    color: konamiSequence.length > i ? "#3b82f6" : "rgba(59, 130, 246, 0.5)",
                  }}
                  animate={konamiSequence.length === i + 1 ? { scale: [1, 1.2, 1] } : {}}
                >
                  {key}
                </motion.div>
              ))}
            </div>
            <Gamepad2 size={24} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>Enter the legendary code!</p>
          </motion.div>
        )}

        {/* Type Word indicator */}
        {currentMode.mode === "typeWord" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-1 justify-center mb-3">
              {TARGET_WORD.split("").map((char, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-10 rounded flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: typedWord.length > i ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${typedWord.length > i ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: typedWord.length > i ? "0 0 10px #3b82f6" : "none",
                    color: typedWord.length > i ? "#fff" : "rgba(59, 130, 246, 0.5)",
                  }}
                  animate={typedWord.length === i + 1 ? { scale: [1, 1.1, 1] } : {}}
                >
                  {typedWord.length > i ? typedWord[i] : char}
                </motion.div>
              ))}
            </div>
            <Keyboard size={24} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>Type it out!</p>
          </motion.div>
        )}

        {/* Piano Mode indicator */}
        {currentMode.mode === "piano" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex justify-center mb-3">
              {["A", "S", "D", "F", "G"].map((key, i) => (
                <motion.div
                  key={i}
                  className="w-10 h-16 rounded-b flex items-end justify-center pb-2 text-sm font-bold mx-0.5"
                  style={{
                    backgroundColor: pianoSequence.length > i ? "#3b82f6" : "#fff",
                    border: "2px solid rgba(59, 130, 246, 0.5)",
                    boxShadow: pianoSequence.length > i ? "0 0 15px #3b82f6" : "inset 0 -5px 10px rgba(0,0,0,0.1)",
                    color: pianoSequence.length > i ? "#fff" : "#333",
                  }}
                  animate={pianoSequence.length === i + 1 ? { y: [0, 5, 0] } : {}}
                >
                  {key}
                </motion.div>
              ))}
            </div>
            <Music size={24} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>Play the melody!</p>
          </motion.div>
        )}

        {/* WASD indicator */}
        {currentMode.mode === "wasd" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="grid gap-1 mb-3">
              <div className="flex justify-center">
                <motion.div
                  className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: wasdSequence.includes("KeyW") ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${wasdSequence.includes("KeyW") ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: wasdSequence.includes("KeyW") ? "0 0 10px #3b82f6" : "none",
                    color: wasdSequence.includes("KeyW") ? "#fff" : "rgba(59, 130, 246, 0.5)",
                  }}
                >
                  W
                </motion.div>
              </div>
              <div className="flex justify-center gap-1">
                {["A", "S", "D"].map((key) => (
                  <motion.div
                    key={key}
                    className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold"
                    style={{
                      backgroundColor: wasdSequence.includes(`Key${key}`) ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                      border: `2px solid ${wasdSequence.includes(`Key${key}`) ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                      boxShadow: wasdSequence.includes(`Key${key}`) ? "0 0 10px #3b82f6" : "none",
                      color: wasdSequence.includes(`Key${key}`) ? "#fff" : "rgba(59, 130, 246, 0.5)",
                    }}
                  >
                    {key}
                  </motion.div>
                ))}
              </div>
            </div>
            <Gamepad2 size={24} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>Press in order: W → A → S → D</p>
          </motion.div>
        )}

        {/* Arrow Keys indicator */}
        {currentMode.mode === "arrows" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="grid gap-1 mb-3">
              <div className="flex justify-center">
                <motion.div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: arrowSequence.includes("ArrowUp") ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${arrowSequence.includes("ArrowUp") ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: arrowSequence.includes("ArrowUp") ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <ArrowUp size={20} style={{ color: arrowSequence.includes("ArrowUp") ? "#3b82f6" : "rgba(59, 130, 246, 0.5)" }} />
                </motion.div>
              </div>
              <div className="flex justify-center gap-1">
                <motion.div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: arrowSequence.includes("ArrowLeft") ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${arrowSequence.includes("ArrowLeft") ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: arrowSequence.includes("ArrowLeft") ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <ArrowLeft size={20} style={{ color: arrowSequence.includes("ArrowLeft") ? "#3b82f6" : "rgba(59, 130, 246, 0.5)" }} />
                </motion.div>
                <motion.div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: arrowSequence.includes("ArrowDown") ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${arrowSequence.includes("ArrowDown") ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: arrowSequence.includes("ArrowDown") ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <ArrowDown size={20} style={{ color: arrowSequence.includes("ArrowDown") ? "#3b82f6" : "rgba(59, 130, 246, 0.5)" }} />
                </motion.div>
                <motion.div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: arrowSequence.includes("ArrowRight") ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                    border: `2px solid ${arrowSequence.includes("ArrowRight") ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: arrowSequence.includes("ArrowRight") ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <ArrowRight size={20} style={{ color: arrowSequence.includes("ArrowRight") ? "#3b82f6" : "rgba(59, 130, 246, 0.5)" }} />
                </motion.div>
              </div>
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>↑ → ↓ ← in sequence</p>
          </motion.div>
        )}

        {/* Space Mash indicator */}
        {currentMode.mode === "spaceMash" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-48 h-12 mx-auto mb-3 rounded flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                border: `3px solid #3b82f6`,
                boxShadow: spaceCount > 0 ? "0 0 20px #3b82f6" : "none",
              }}
              animate={spaceCount > 0 ? { scale: [1, 0.95, 1] } : {}}
              transition={{ duration: 0.1 }}
            >
              <span style={{ color: "#3b82f6" }}>SPACE</span>
            </motion.div>
            <p className="text-4xl font-bold neon-text">{spaceCount}/15</p>
            <p className="text-xs mt-2" style={{ color: "#3b82f6" }}>MASH THAT SPACEBAR!</p>
          </motion.div>
        )}

        {/* Ctrl+B indicator */}
        {currentMode.mode === "altTab" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-2 justify-center mb-3">
              <div
                className="px-4 py-2 rounded text-sm font-bold"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid #3b82f6",
                  color: "#3b82f6",
                }}
              >
                Ctrl
              </div>
              <span className="text-2xl" style={{ color: "#3b82f6" }}>+</span>
              <div
                className="px-4 py-2 rounded text-sm font-bold"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  border: "2px solid #3b82f6",
                  color: "#3b82f6",
                }}
              >
                B
              </div>
            </div>
            <div className="flex gap-2 justify-center mb-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-6 h-6 rounded-full"
                  style={{
                    backgroundColor: ctrlBCount >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.2)",
                    boxShadow: ctrlBCount >= i ? "0 0 10px #3b82f6" : "none",
                  }}
                  animate={ctrlBCount === i ? { scale: [1, 1.3, 1] } : {}}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Bulls always come back! (Cmd+B on Mac)</p>
          </motion.div>
        )}

        {/* ===== DESKTOP MOUSE MODE INDICATORS ===== */}

        {/* Double Click indicator */}
        {currentMode.mode === "doubleClick" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Mouse size={48} className="mx-auto mb-3" style={{ color: "#3b82f6" }} />
            <div className="flex gap-2 justify-center mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: doubleClickCount >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.2)",
                    boxShadow: doubleClickCount >= i ? "0 0 10px #3b82f6" : "none",
                  }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Double-click 5 times!</p>
          </motion.div>
        )}

        {/* Right Click indicator */}
        {currentMode.mode === "rightClick" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Mouse size={48} className="mx-auto mb-3" style={{ color: "#3b82f6" }} />
            <div className="flex gap-2 justify-center mb-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: rightClickCount >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.2)",
                    boxShadow: rightClickCount >= i ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <span style={{ color: rightClickCount >= i ? "#fff" : "rgba(59, 130, 246, 0.5)", fontSize: 12 }}>{i}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Right-click 3 times!</p>
          </motion.div>
        )}

        {/* Scroll Wheel indicator */}
        {currentMode.mode === "scrollWheel" && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-8 h-16 mx-auto mb-3 rounded-full relative"
              style={{
                border: "3px solid #3b82f6",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <motion.div
                className="absolute w-2 h-4 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  backgroundColor: "#3b82f6",
                  boxShadow: "0 0 10px #3b82f6",
                  top: `${Math.max(4, 40 - scrollAmount / 15)}px`,
                }}
              />
            </motion.div>
            <ScrollText size={24} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>Scroll up to unlock!</p>
          </motion.div>
        )}

        {/* Drag & Drop indicator */}
        {currentMode.mode === "dragDrop" && (
          <>
            {/* Draggable coin */}
            <motion.div
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                top: 150,
                left: "50%",
                transform: "translateX(-50%)",
              }}
              drag
              dragConstraints={containerRef}
              onDragStart={(e) => handleDragDropStart(e as unknown as React.MouseEvent)}
              onDrag={(e) => handleDragDropMove(e as unknown as React.MouseEvent)}
              animate={dragComplete ? { scale: 0, opacity: 0 } : {}}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.3)",
                  border: "3px solid #3b82f6",
                  boxShadow: "0 0 20px #3b82f6",
                }}
              >
                💰
              </div>
            </motion.div>
            
            {/* Vault target */}
            <motion.div
              className="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div
                className="w-24 h-20 rounded-lg flex items-center justify-center text-3xl"
                style={{
                  backgroundColor: dragComplete ? "rgba(59, 130, 246, 0.5)" : "rgba(0, 0, 0, 0.5)",
                  border: `3px dashed ${dragComplete ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                  boxShadow: dragComplete ? "0 0 30px #3b82f6" : "none",
                }}
              >
                🏦
              </div>
              <p className="text-xs mt-2" style={{ color: "#3b82f6" }}>
                {dragComplete ? "Secured!" : "Drop here"}
              </p>
            </motion.div>
          </>
        )}

        {/* Hover Zone indicator */}
        {currentMode.mode === "hoverZone" && (
          <>
            {[
              { zone: "tl", label: "1", top: 100, left: 40 },
              { zone: "tr", label: "2", top: 100, right: 40 },
              { zone: "bl", label: "3", bottom: 180, left: 40 },
              { zone: "br", label: "4", bottom: 180, right: 40 },
            ].map(({ zone, label, ...pos }) => (
              <motion.div
                key={zone}
                className="absolute w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold"
                style={{
                  ...pos,
                  backgroundColor: hoverZones.has(zone) ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                  border: `3px solid ${hoverZones.has(zone) ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                  boxShadow: hoverZones.has(zone) ? "0 0 20px #3b82f6" : "none",
                  color: hoverZones.has(zone) ? "#3b82f6" : "rgba(59, 130, 246, 0.5)",
                }}
                onMouseEnter={() => handleHoverZone(zone)}
                animate={hoverZones.has(zone) ? { scale: [1, 1.1, 1] } : {}}
              >
                {label}
              </motion.div>
            ))}
          </>
        )}

        {/* ===== ADDITIONAL MOBILE SENSOR INDICATORS ===== */}

        {/* Face Down indicator */}
        {currentMode.mode === "faceDown" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-24 mx-auto mb-3 rounded-xl"
              style={{
                backgroundColor: faceDownProgress > 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.5)",
                border: "3px solid #3b82f6",
                boxShadow: faceDownProgress > 0 ? "0 0 20px #3b82f6" : "none",
              }}
              animate={{ rotateX: faceDownProgress > 0 ? 180 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Smartphone size={32} style={{ color: "#3b82f6" }} />
              </div>
            </motion.div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Place phone face-down</p>
          </motion.div>
        )}

        {/* Step Counter indicator */}
        {currentMode.mode === "stepCounter" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Footprints size={48} className="mx-auto mb-3" style={{ color: "#3b82f6" }} />
            <p className="text-4xl font-bold neon-text">{stepCount}/5</p>
            <p className="text-xs mt-2" style={{ color: "#3b82f6" }}>Walk with your phone!</p>
          </motion.div>
        )}

        {/* Multi-Touch indicator */}
        {currentMode.mode === "multiTouch" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-2 justify-center mb-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: touchCount >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.2)",
                    border: `2px solid ${touchCount >= i ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
                    boxShadow: touchCount >= i ? "0 0 10px #3b82f6" : "none",
                  }}
                >
                  <Hand size={20} style={{ color: touchCount >= i ? "#fff" : "rgba(59, 130, 246, 0.5)" }} />
                </motion.div>
              ))}
            </div>
            <Layers size={24} className="mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs" style={{ color: "#3b82f6" }}>Use 3 fingers at once!</p>
          </motion.div>
        )}

        {/* Pinch Zoom indicator */}
        {currentMode.mode === "pinchZoom" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{
                border: "3px dashed #3b82f6",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ZoomIn size={32} style={{ color: "#3b82f6" }} />
            </motion.div>
            <p className="text-2xl font-bold neon-text">{pinchCount}/6</p>
            <p className="text-xs mt-2" style={{ color: "#3b82f6" }}>Pinch in and out!</p>
          </motion.div>
        )}

        {/* Squeeze indicator */}
        {currentMode.mode === "squeeze" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-center gap-4 mb-3">
              <motion.div
                animate={{ x: [-5, 0, -5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Hand size={32} style={{ color: "#3b82f6", transform: "scaleX(-1)" }} />
              </motion.div>
              <div
                className="w-12 h-20 rounded-lg"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  border: "3px solid #3b82f6",
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)",
                }}
              />
              <motion.div
                animate={{ x: [5, 0, 5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Hand size={32} style={{ color: "#3b82f6" }} />
              </motion.div>
            </div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Squeeze both sides!</p>
          </motion.div>
        )}

        {/* Light Sensor indicator */}
        {currentMode.mode === "lightSensor" && isMobile && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sun size={48} className="mx-auto mb-3" style={{ color: "#3b82f6" }} />
            </motion.div>
            <p className="text-xs" style={{ color: "#3b82f6" }}>Cover camera, then expose to light</p>
            <p className="text-xs mt-1 opacity-50" style={{ color: "#3b82f6" }}>(or tap to simulate)</p>
          </motion.div>
        )}

        {/* Success overlay */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
            >
              <motion.div
                className="flex flex-col items-center gap-6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    border: "3px solid #3b82f6",
                    boxShadow: "0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 60px #3b82f6",
                  }}
                >
                  <Unlock size={48} style={{ color: "#3b82f6" }} />
                </div>
                
                <h2 
                  className="text-3xl font-bold neon-text"
                  style={{
                    textShadow: "0 0 10px #fff, 0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 80px #3b82f6",
                  }}
                >
                  UNLOCKED
                </h2>
                
                <p 
                  className="text-sm"
                  style={{ color: "rgba(59, 130, 246, 0.7)" }}
                >
                  Welcome to Bull Money
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
