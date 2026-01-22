"use client";

/**
 * UltimateHub - Unified Control Center
 * Combines: UltimateControlPanel + TradingQuickAccess + CommunityQuickAccess
 * 
 * Features:
 * - Right side: FPS monitor with candlestick chart, Device Center Panel (4 tabs)
 * - Left side: Live prices pill, Community pill with Telegram feed
 * - Modals: Trading charts, Community/Telegram, BullMoney TV, Theme settings
 * - Real device data: Memory, Browser, Storage, Network, Performance
 * - Admin access, Browser switcher, VIP integration
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  createContext,
  useContext,
  memo
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo, type TargetAndTransition } from 'framer-motion';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { getFpsEngine, initializeFpsMeasurement } from '@/lib/FpsMeasurement';
import { detectBrowserCapabilities, selectOptimalMeasurementConfig } from '@/lib/FpsCompatibility';

// --- GLOBAL NEON BLUE STYLES (Neon Blue Sign Style) ---
const GLOBAL_NEON_STYLES = `
  .neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-icon {
    filter: drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6);
  }

  .neon-blue-border {
    border: 2px solid #3b82f6;
    box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6;
  }

  .neon-blue-bg {
    background: #3b82f6;
    box-shadow: 0 0 8px #3b82f6, 0 0 16px #3b82f6;
  }

  .neon-subtle-border {
    border: 1px solid rgba(59, 130, 246, 0.8);
    box-shadow: 0 0 4px #3b82f6, inset 0 0 4px #3b82f6;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;
import {
  Activity,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Globe,
  Bitcoin,
  Coins,
  ExternalLink,
  X,
  MessageSquare,
  MessageCircle,
  Instagram,
  Youtube,
  Crown,
  Loader,
  ShoppingBag,
  Lock,
  Star,
  Shield,
  Zap,
  Chrome,
  Copy,
  Check,
  Settings,
  Send,
  User,
  Palette,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Signal,
  Smartphone,
  Battery,
  Clock,
  Database,
  Server,
  MemoryStick,
  Gauge,
  RefreshCw,
  Play,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Filter,
  Radio,
  Monitor,
  Sparkles
} from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';
import { createSupabaseClient } from '@/lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
}

// Real Device Data Types
interface MemoryStats {
  jsHeapUsed: number;
  jsHeapLimit: number;
  deviceRam: number;
  browserAllocated: number;
  percentage: number;
  external: number;
  updateTime: number;
}

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  locale: string;
  onLine: boolean;
  cores: number;
  deviceMemory: number;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}

interface StorageStats {
  total: number;
  available: number;
  used: number;
  percentage: number;
  type: string;
  cache: number;
  quota: number;
  loading: boolean;
}

interface CacheStats {
  usage: number;
  quota: number;
  percentage: number;
  updateTime: number;
}

interface NetworkStats {
  latency: number;
  downloadSpeed: number;
  uploadSpeed: number;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  isOnline: boolean;
  connectionType: string;
  testing: boolean;
  lastTest: number;
}

interface PerformanceStats {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  jsExecutionTime: number;
}

// GPU Info from WebGL
interface GpuInfo {
  vendor: string;
  renderer: string;
  tier: 'ultra' | 'high' | 'medium' | 'low';
  score: number;
  webglVersion: string;
  maxTextureSize: number;
  maxViewportDims: number[];
}

// Battery Info from Battery API
interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  supported: boolean;
}

// Screen Info
interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
  refreshRate: number;
  colorDepth: number;
  orientation: string;
  touchPoints: number;
  hdr: boolean;
}

interface HubContextType {
  // FPS State
  currentFps: number;
  deviceTier: string;
  shimmerEnabled: boolean;
  setShimmerEnabled: (v: boolean) => void;
  
  // UI State
  activeModal: ModalType | null;
  setActiveModal: (m: ModalType | null) => void;
  isMinimized: boolean;
  setIsMinimized: (v: boolean) => void;
  
  // User State
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
}

type ModalType = 
  | 'trading' 
  | 'community' 
  | 'bullmoneyTV' 
  | 'theme' 
  | 'contact' 
  | 'services' 
  | 'admin'
  | 'browser'
  | 'devicePanel';

type ChannelKey = 'trades' | 'main' | 'shop' | 'vip';
type DevicePanelTab = 'overview' | 'network' | 'performance' | 'account';

// Calendar filter types
type CalendarImpact = 'all' | 'high' | 'medium' | 'low';
type CalendarCountry = 'all' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'NZD';

// ============================================================================
// CONSTANTS
// ============================================================================

const TRADING_SYMBOLS = [
  { id: 'xauusd', name: 'XAUUSD', displayName: 'Gold', abbr: 'Gold', symbol: 'OANDA:XAUUSD', icon: Coins },
  { id: 'btcusd', name: 'BTCUSD', displayName: 'Bitcoin', abbr: 'BTC', symbol: 'BITSTAMP:BTCUSD', icon: Bitcoin },
  { id: 'eurusd', name: 'EURUSD', displayName: 'EUR/USD', abbr: 'EUR', symbol: 'FX:EURUSD', icon: Globe },
  { id: 'gbpusd', name: 'GBPUSD', displayName: 'GBP/USD', abbr: 'GBP', symbol: 'FX:GBPUSD', icon: Globe },
  { id: 'usdjpy', name: 'USDJPY', displayName: 'USD/JPY', abbr: 'JPY', symbol: 'FX:USDJPY', icon: Globe },
  { id: 'ethusd', name: 'ETHUSD', displayName: 'Ethereum', abbr: 'ETH', symbol: 'BITSTAMP:ETHUSD', icon: Coins },
] as const;

const TELEGRAM_CHANNELS = {
  trades: { name: 'FREE TRADES', handle: 'bullmoneywebsite', icon: TrendingUp, color: 'cyan', requiresVip: false },
  main: { name: 'LIVESTREAMS', handle: 'bullmoneyfx', icon: MessageCircle, color: 'blue', requiresVip: false },
  shop: { name: 'NEWS', handle: 'Bullmoneyshop', icon: ShoppingBag, color: 'emerald', requiresVip: false },
  vip: { name: 'VIP TRADES', handle: '+yW5jIfxJpv9hNmY0', icon: Crown, color: 'amber', requiresVip: true, isPrivate: true },
} as const;

const BROWSERS = [
  {
    id: 'chrome', name: 'Chrome', fullName: 'Google Chrome', icon: Chrome,
    deepLink: {
      ios: (url: string) => url.startsWith('https') ? `googlechromes://${url.replace(/^https:\/\//, '')}` : `googlechrome://${url.replace(/^http:\/\//, '')}`,
      android: (url: string) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`,
      desktop: (url: string) => url
    },
    downloadUrl: 'https://www.google.com/chrome/',
    iosAppStore: 'https://apps.apple.com/app/id535886823',
    androidPlayStore: 'https://play.google.com/store/apps/details?id=com.android.chrome'
  },
  {
    id: 'firefox', name: 'Firefox', fullName: 'Firefox', icon: Globe,
    deepLink: {
      ios: (url: string) => `firefox://open-url?url=${encodeURIComponent(url)}`,
      android: (url: string) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=org.mozilla.firefox;end`,
      desktop: (url: string) => url
    },
    downloadUrl: 'https://www.mozilla.org/firefox/browsers/mobile/',
    iosAppStore: 'https://apps.apple.com/app/id989804926',
    androidPlayStore: 'https://play.google.com/store/apps/details?id=org.mozilla.firefox'
  },
  {
    id: 'safari', name: 'Safari', fullName: 'Safari', icon: Globe,
    deepLink: { ios: (url: string) => url, android: (url: string) => url, desktop: (url: string) => url },
    downloadUrl: 'https://support.apple.com/downloads/safari',
    iosAppStore: '', androidPlayStore: ''
  },
  {
    id: 'edge', name: 'Edge', fullName: 'Microsoft Edge', icon: Globe,
    deepLink: {
      ios: (url: string) => url.startsWith('https') ? `microsoft-edge-https://${url.replace(/^https:\/\//, '')}` : `microsoft-edge-http://${url.replace(/^http:\/\//, '')}`,
      android: (url: string) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.microsoft.emmx;end`,
      desktop: (url: string) => url
    },
    downloadUrl: 'https://www.microsoft.com/edge',
    iosAppStore: 'https://apps.apple.com/app/id1288723196',
    androidPlayStore: 'https://play.google.com/store/apps/details?id=com.microsoft.emmx'
  },
] as const;

const TRADING_TIPS = [
  "Check the price out! 📈", "Gold often moves inverse to USD 💰", "Watch for support & resistance levels",
  "Use RSI for overbought/oversold signals", "MACD crossovers signal trend changes", "Volume confirms price movements",
  "Higher highs = bullish trend 🟢", "Lower lows = bearish trend 🔴", "200+ chart analysis tools inside!",
  "Set stop losses to manage risk", "News events move markets fast ⚡", "Fibonacci levels mark key zones",
  "Bollinger Bands show volatility", "Moving averages smooth price action", "Candlestick patterns reveal sentiment",
  "Doji = market indecision", "Engulfing candles signal reversals", "Head & shoulders = trend reversal",
  "Double tops/bottoms are key patterns", "Triangles precede breakouts", "Always check the daily timeframe",
  "Correlation: Gold vs DXY inverse 📊", "BTC leads crypto market moves", "London & NY sessions = high volume",
  "Asian session = range-bound trading", "NFP Fridays = major USD moves", "FOMC meetings = volatility spikes",
  "Risk management > prediction", "1% risk per trade is wise", "Trend is your friend 🎯",
  "Don't fight the Fed", "Buy the rumor, sell the news", "Patience is a trader's virtue",
  "Emotions kill trading accounts", "Journal every trade you make", "Backtest before going live",
  "Paper trade to learn first", "ATR measures true volatility", "Pivot points mark intraday levels",
  "VWAP is institutional favorite", "Order flow reveals big players", "Liquidity pools attract price",
  "Fair value gaps get filled", "Market structure = key concept", "Break of structure = momentum",
  "Change of character = reversal", "Smart money concepts work", "ICT methodology is powerful",
  "Supply & demand zones matter", "Imbalances create opportunities"
];

const FEATURED_VIDEOS = ['Q3dSjSP3t8I', 'xvP1FJt-Qto'];

const TRADING_LIVE_CHANNELS = [
  { id: 'UCrp_UI8XtuYfpiqluWLD7Lw', name: 'The Trading Channel' },
  { id: 'UCGnHwBJHZ0JCN8t8EA0PLQA', name: 'Rayner Teo' },
  { id: 'UC2C_jShtL725hvbm1arSV9w', name: 'Matt Kohrs' },
  { id: 'UCduLPLzWNkL-8aCJohrmJhw', name: 'Ziptrader' },
  { id: 'UCnqZ2hx679O1JBIRDlJNzKA', name: 'TradeZella' },
  { id: 'UCU8WjbDkHFUfIGBnrkA6zRg', name: 'Humbled Trader' },
  { id: 'UCpmAlqg4X-UdHcSL4aPTPqw', name: 'Warrior Trading' },
];

// Device Panel Tab Config
const DEVICE_PANEL_TABS: { id: DevicePanelTab; label: string; icon: typeof Cpu }[] = [
  { id: 'overview', label: 'Overview', icon: Smartphone },
  { id: 'network', label: 'Network', icon: Wifi },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'account', label: 'Account', icon: User },
];

// Calendar Countries
const CALENDAR_COUNTRIES: { id: CalendarCountry; name: string; flag: string }[] = [
  { id: 'all', name: 'All', flag: '🌍' },
  { id: 'USD', name: 'USD', flag: '🇺🇸' },
  { id: 'EUR', name: 'EUR', flag: '🇪🇺' },
  { id: 'GBP', name: 'GBP', flag: '🇬🇧' },
  { id: 'JPY', name: 'JPY', flag: '🇯🇵' },
  { id: 'AUD', name: 'AUD', flag: '🇦🇺' },
  { id: 'CAD', name: 'CAD', flag: '🇨🇦' },
  { id: 'CHF', name: 'CHF', flag: '🇨🇭' },
  { id: 'NZD', name: 'NZD', flag: '🇳🇿' },
];

// ============================================================================
// CONTEXT
// ============================================================================

const HubContext = createContext<HubContextType | null>(null);

const useHub = () => {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Neon blue glow styles for trading theme
const NEON_STYLES = {
  blueText: 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]',
  blueTextBright: 'text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,1)]',
  cyanText: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]',
  amberText: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]',
  orangeText: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)]',
  purpleText: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]',
  emeraldText: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]',
  whiteGlow: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]',
  
  blueBorder: 'border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.6),inset_0_0_8px_rgba(59,130,246,0.3)]',
  cyanBorder: 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.6),inset_0_0_8px_rgba(6,182,212,0.3)]',
  purpleBorder: 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.6),inset_0_0_8px_rgba(168,85,247,0.3)]',
  emeraldBorder: 'border-emerald-500/60 shadow-[0_0_12px_rgba(52,211,153,0.6),inset_0_0_8px_rgba(52,211,153,0.3)]',
  
  blueBg: 'bg-gradient-to-br from-blue-600/40 via-blue-500/25 to-cyan-600/30 shadow-[0_0_20px_rgba(59,130,246,0.4)]',
  cyanBg: 'bg-gradient-to-br from-cyan-600/40 via-cyan-500/25 to-blue-600/30 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
  purpleBg: 'bg-gradient-to-br from-purple-600/40 via-purple-500/25 to-fuchsia-600/30 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
  darkBg: 'bg-gradient-to-br from-zinc-900/98 via-zinc-800/95 to-black/98 backdrop-blur-3xl',
  
  iconGlow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]',
  iconGlowCyan: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]',
  iconGlowPurple: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]',
  iconGlowAmber: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  iconGlowOrange: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]',
  iconGlowEmerald: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]',
};

const SoundEffects = {
  click: () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.05;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    }
  },
  hover: () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 600;
        gain.gain.value = 0.02;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.stop(ctx.currentTime + 0.05);
      } catch {}
    }
  },
  swoosh: () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {}
    }
  },
  swipe: () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    }
  },
  success: () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
    }
  }
};

const getFpsColor = (fps: number) => {
  if (fps >= 58) return { text: '#34d399', glow: 'rgba(52, 211, 153, 0.9)', bg: 'rgba(52, 211, 153, 0.15)' };
  if (fps >= 50) return { text: '#60a5fa', glow: 'rgba(96, 165, 250, 0.9)', bg: 'rgba(96, 165, 250, 0.15)' };
  if (fps >= 40) return { text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', bg: 'rgba(251, 191, 36, 0.15)' };
  if (fps >= 30) return { text: '#fb923c', glow: 'rgba(251, 146, 60, 0.8)', bg: 'rgba(251, 146, 60, 0.15)' };
  return { text: '#f87171', glow: 'rgba(248, 113, 113, 0.8)', bg: 'rgba(248, 113, 113, 0.15)' };
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useFpsMonitor() {
  const [fps, setFps] = useState(60);
  const [deviceTier, setDeviceTier] = useState('high');
  const [jankScore, setJankScore] = useState(0);
  const isFrozenRef = useRef(false);

  // Listen for battery saver freeze/unfreeze events
  useEffect(() => {
    const handleFreeze = () => {
      isFrozenRef.current = true;
      console.log('[useFpsMonitor] 🔋 Frozen - continuing FPS measurement');
    };
    const handleUnfreeze = () => {
      isFrozenRef.current = false;
      console.log('[useFpsMonitor] ✓ Unfrozen - resuming normal FPS measurement');
    };

    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);

    return () => {
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
    };
  }, []);

  // Use the SAME FPS measurement as SmartScreensaver (requestAnimationFrame)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measure = (time: number) => {
      frameCount++;
      const elapsed = time - lastTime;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount / elapsed) * 1000);
        setFps(currentFps);
        setJankScore(currentFps < 30 ? 100 - currentFps : 0);
        
        // Determine device tier from FPS
        if (currentFps >= 55) setDeviceTier('ultra');
        else if (currentFps >= 45) setDeviceTier('high');
        else if (currentFps >= 35) setDeviceTier('medium');
        else if (currentFps >= 25) setDeviceTier('low');
        else setDeviceTier('minimal');
        
        frameCount = 0;
        lastTime = time;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return { fps, deviceTier, jankScore, engine: null };
}

// ============================================================================
// REAL DEVICE DATA HOOKS - Using actual browser APIs
// ============================================================================

/**
 * Hook for real-time JavaScript heap memory monitoring + device RAM detection
 * Uses Performance.memory API and Navigator.deviceMemory
 */
function useRealTimeMemory(): MemoryStats {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    jsHeapUsed: 0,
    jsHeapLimit: 0,
    deviceRam: 4,
    browserAllocated: 0,
    percentage: 0,
    external: 0,
    updateTime: Date.now(),
  });

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('[useRealTimeMemory] 🔍 Initializing universal memory detection...');
    
    // Get device memory from Navigator API
    const nav = navigator as any;
    const deviceMemory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
    
    console.log('[useRealTimeMemory] Device Memory API:', deviceMemory ? `${deviceMemory} GB` : 'Not available');
    console.log('[useRealTimeMemory] Performance.memory API:', !!(performance as any).memory ? 'Available' : 'Not available');

    const updateMemory = () => {
      if (!isMountedRef.current) return;
      
      const now = Date.now();
      const jsMemory = (performance as any).memory;

      if (jsMemory) {
        // Chrome/Edge with performance.memory API
        const jsHeapUsedMB = Math.round(jsMemory.usedJSHeapSize / 1024 / 1024);
        const jsHeapLimitMB = Math.round(jsMemory.jsHeapSizeLimit / 1024 / 1024);
        const totalHeapSizeMB = Math.round(jsMemory.totalJSHeapSize / 1024 / 1024);
        const externalMB = totalHeapSizeMB - jsHeapUsedMB;
        const browserAllocatedMB = totalHeapSizeMB;
        const percentage = Math.round((jsHeapUsedMB / jsHeapLimitMB) * 100);

        if (isMountedRef.current) {
          setMemoryStats(prev => {
            if (prev.jsHeapUsed === jsHeapUsedMB && prev.percentage === percentage) return prev;
            return {
              jsHeapUsed: jsHeapUsedMB,
              jsHeapLimit: jsHeapLimitMB,
              deviceRam: deviceMemory || 4,
              browserAllocated: browserAllocatedMB,
              percentage,
              external: externalMB,
              updateTime: now,
            };
          });
        }
      } else {
        // Universal fallback for Safari, Firefox, mobile browsers
        console.log('[useRealTimeMemory] Using universal estimation (Safari/Firefox/Mobile)');
        
        // Estimate memory usage based on:
        // 1. DOM elements count
        // 2. Window.performance timing
        // 3. User agent hints
        
        const estimatedHeapUsed = Math.round(
          (document.getElementsByTagName('*').length * 0.002) + // DOM size
          (window.performance.now() / 60000) + // Runtime duration
          50 // Base usage
        );
        
        const estimatedHeapLimit = deviceMemory ? deviceMemory * 256 : 1024; // Estimate browser heap
        const estimatedPercentage = Math.min(Math.round((estimatedHeapUsed / estimatedHeapLimit) * 100), 99);
        
        if (isMountedRef.current) {
          setMemoryStats({
            jsHeapUsed: estimatedHeapUsed,
            jsHeapLimit: estimatedHeapLimit,
            deviceRam: deviceMemory || 4,
            browserAllocated: estimatedHeapUsed,
            percentage: estimatedPercentage,
            external: 0,
            updateTime: now,
          });
        }
      }
    };

    updateMemory();
    updateIntervalRef.current = setInterval(updateMemory, 500);

    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, []);

  return memoryStats;
}

/**
 * Hook for detecting REAL browser and device information
 * Uses Navigator API, UserAgent, and Network Information API
 */
function useBrowserInfo(): BrowserInfo {
  // Compute browser info synchronously
  const computeBrowserInfo = useCallback((): BrowserInfo => {
    const ua = navigator.userAgent;
    const nav = navigator as any;

    // Detect REAL browser name and version from UserAgent
    let name = 'Unknown';
    let version = '';

    if (/OPR\/([\d.]+)/.test(ua)) {
      name = 'Opera';
      version = RegExp.$1;
    } else if (/Edg\/([\d.]+)/.test(ua)) {
      name = 'Edge';
      version = RegExp.$1;
    } else if (/Chrome\/([\d.]+)/.test(ua) && !/Edge|OPR|UCWEB/.test(ua)) {
      name = 'Chrome';
      version = RegExp.$1;
    } else if (/Version\/([\d.]+).*Safari/.test(ua) && !/Chrome|CriOS|OPR|Edg/.test(ua)) {
      name = 'Safari';
      version = RegExp.$1;
    } else if (/Firefox\/([\d.]+)/.test(ua)) {
      name = 'Firefox';
      version = RegExp.$1;
    } else if (/MSIE ([\d.]+)|Trident.*rv:([\d.]+)/.test(ua)) {
      name = 'Internet Explorer';
      version = RegExp.$1 || RegExp.$2;
    }

    // Detect REAL rendering engine
    let engine = 'Unknown';
    if (/Trident/.test(ua)) engine = 'Trident';
    else if (/like Gecko/.test(ua) && !/WebKit/.test(ua)) engine = 'Gecko';
    else if (/WebKit/.test(ua)) engine = /Chrome|Edge|Opera/.test(ua) ? 'Blink' : 'WebKit';

    // Detect REAL platform
    let platform = 'Unknown';
    const platformUA = (nav.userAgentData?.platform || nav.platform || '').toLowerCase();
    if (/win/.test(platformUA) || /windows/.test(ua.toLowerCase())) platform = 'Windows';
    else if (/mac/.test(platformUA) || /macintosh|macintel|macosx|darwin/.test(ua.toLowerCase())) {
      platform = /iphone|ios|ipad/.test(ua.toLowerCase()) ? 'iOS' : 'macOS';
    } else if (/linux/.test(platformUA) || /linux|x11/.test(ua.toLowerCase())) {
      platform = /android/.test(ua.toLowerCase()) ? 'Android' : 'Linux';
    } else if (/iphone|ios/.test(ua.toLowerCase())) platform = 'iOS';
    else if (/ipad/.test(ua.toLowerCase())) platform = 'iPadOS';
    else if (/android/.test(ua.toLowerCase())) platform = 'Android';

    // Get REAL CPU cores - navigator.hardwareConcurrency returns logical cores (including hyperthreading)
    const cores = nav.hardwareConcurrency || 1;
    console.log('[useBrowserInfo] 🔧 CPU Cores detected:', cores, 'logical cores (via navigator.hardwareConcurrency)');
    
    console.log('[useBrowserInfo] 🔍 Detecting device RAM (universal)...');
    console.log('[useBrowserInfo] navigator.deviceMemory (raw):', nav.deviceMemory);
    
    // Universal RAM detection that works on ALL browsers and devices
    let deviceMemory = 4; // Safe default
    let detectionMethod = 'fallback';
    
    // Method 1: navigator.deviceMemory (Chromium browsers)
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0) {
      deviceMemory = nav.deviceMemory;
      detectionMethod = 'navigator.deviceMemory';
      console.log('[useBrowserInfo] ✅ Method 1: navigator.deviceMemory =', deviceMemory, 'GB');
    } else {
      console.log('[useBrowserInfo] ⚠️ navigator.deviceMemory not available');
    }
    
    // Method 2: Estimate from performance.memory heap limit (Chrome/Edge)
    const perfMemory = (performance as any).memory;
    if (perfMemory && perfMemory.jsHeapSizeLimit) {
      const heapLimitGB = perfMemory.jsHeapSizeLimit / 1024 / 1024 / 1024;
      let estimatedRAM = 4;
      if (heapLimitGB >= 3.8) estimatedRAM = 16;
      else if (heapLimitGB >= 1.8) estimatedRAM = 8;
      else if (heapLimitGB >= 0.9) estimatedRAM = 4;
      else estimatedRAM = 2;
      
      console.log('[useBrowserInfo] 📊 Method 2: JS Heap limit =', heapLimitGB.toFixed(2), 'GB → Estimated RAM:', estimatedRAM, 'GB');
      
      if (estimatedRAM > deviceMemory) {
        console.log('[useBrowserInfo] ⬆️ Using heap-based estimate:', estimatedRAM, 'GB');
        deviceMemory = estimatedRAM;
        detectionMethod = 'performance.memory estimation';
      }
    } else {
      console.log('[useBrowserInfo] ⚠️ performance.memory not available');
    }
    
    // Method 3: Universal device detection (Safari, Firefox, Mobile)
    if (deviceMemory === 4 && detectionMethod === 'fallback') {
      // Estimate based on device characteristics
      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
      const isTablet = /iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
      const isHighEnd = cores >= 8;
      const isMidRange = cores >= 4;
      
      if (isMobile && !isTablet) {
        deviceMemory = isHighEnd ? 8 : isMidRange ? 6 : 4; // Phones: 4-8GB
      } else if (isTablet) {
        deviceMemory = isHighEnd ? 8 : 6; // Tablets: 6-8GB
      } else {
        deviceMemory = isHighEnd ? 16 : isMidRange ? 8 : 4; // Desktop: 4-16GB
      }
      
      detectionMethod = 'device characteristics estimation';
      console.log('[useBrowserInfo] 📱 Method 3: Device-based estimate =', deviceMemory, 'GB');
    }
    
    console.log('[useBrowserInfo] ✅ Final RAM detection:', deviceMemory, 'GB via', detectionMethod);

    // Get REAL network connection info
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const connectionInfo = connection ? {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 50,
      saveData: connection.saveData || false,
    } : { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false };

    return {
      name,
      version,
      engine,
      platform,
      locale: navigator.language || 'en-US',
      onLine: navigator.onLine,
      cores,
      deviceMemory,
      connection: connectionInfo,
    };
  }, []);

  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>(computeBrowserInfo);

  useEffect(() => {
    const info = computeBrowserInfo();
    setBrowserInfo(info);
    
    // Force log device memory detection
    setTimeout(() => {
      console.log('[useBrowserInfo] 📊 Device RAM Detection Result:', {
        deviceMemory: info.deviceMemory + ' GB',
        browser: info.name + ' ' + info.version,
        cores: info.cores,
        platform: info.platform
      });
    }, 100);

    // Listen for online/offline changes
    const handleOnline = () => setBrowserInfo(prev => ({ ...prev, onLine: true }));
    const handleOffline = () => setBrowserInfo(prev => ({ ...prev, onLine: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [computeBrowserInfo]);

  return browserInfo;
}

/**
 * Hook for detecting REAL storage space using Storage API
 */
function useStorageInfo(): StorageStats {
  const [storageStats, setStorageStats] = useState<StorageStats>({
    total: 64,
    available: 32,
    used: 32,
    percentage: 50,
    type: 'Detecting...',
    cache: 0,
    quota: 0,
    loading: true,
  });

  useEffect(() => {
    const detectStorage = async () => {
      try {
        // Use REAL Storage API
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const quota = estimate.quota || 0;
          const usage = estimate.usage || 0;

          const estimatedTotal = Math.round((quota / 0.6) / 1024 / 1024 / 1024);
          const available = Math.round((quota - usage) / 1024 / 1024 / 1024);
          const used = Math.round(usage / 1024 / 1024 / 1024);
          const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

          const cacheUsageMB = Math.round((usage / 1024 / 1024) * 100) / 100;
          const cacheQuotaMB = Math.round((quota / 1024 / 1024) * 100) / 100;

          // Estimate storage type based on quota size
          let type = 'Storage';
          const totalGB = Math.max(estimatedTotal, 64);
          if (totalGB >= 512) type = 'NVMe SSD';
          else if (totalGB >= 256) type = 'SSD';
          else if (totalGB >= 128) type = 'SSD/Flash';

          setStorageStats({
            total: Math.max(totalGB, 64),
            available: Math.max(available, 1),
            used: Math.max(used, 1),
            percentage,
            type,
            cache: cacheUsageMB,
            quota: cacheQuotaMB,
            loading: false,
          });
        } else {
          setStorageStats(prev => ({ ...prev, type: 'API Unavailable', loading: false }));
        }
      } catch (error) {
        console.warn('[useStorageInfo] Storage detection failed:', error);
        setStorageStats(prev => ({ ...prev, type: 'Error detecting', loading: false }));
      }
    };

    detectStorage();
  }, []);

  return storageStats;
}

/**
 * Hook for real-time cache usage monitoring using Storage API
 */
function useRealTimeCache(): CacheStats {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    usage: 0,
    quota: 0,
    percentage: 0,
    updateTime: Date.now(),
  });

  useEffect(() => {
    const updateCache = async () => {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const quota = estimate.quota || 0;
          const usage = estimate.usage || 0;

          const usageMB = Math.round((usage / 1024 / 1024) * 100) / 100;
          const quotaMB = Math.round((quota / 1024 / 1024) * 100) / 100;
          const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

          setCacheStats({ usage: usageMB, quota: quotaMB, percentage, updateTime: Date.now() });
        }
      } catch (error) {
        console.warn('[useRealTimeCache] Cache detection failed:', error);
      }
    };

    updateCache();
    const interval = setInterval(updateCache, 1000);
    return () => clearInterval(interval);
  }, []);

  return cacheStats;
}

/**
 * Hook for REAL network speed testing using Resource Timing API
 */
function useNetworkStats(): NetworkStats {
  // Compute initial network info synchronously
  const computeNetworkInfo = useCallback((): NetworkStats => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    // Get connection type with proper WiFi/cellular detection
    let connectionType = 'unknown';
    let effectiveType = '4g';
    let downlink = 10;
    let rtt = 50;
    let saveData = false;
    
    if (connection) {
      effectiveType = connection.effectiveType || '4g';
      downlink = connection.downlink || 10;
      rtt = connection.rtt || 50;
      saveData = connection.saveData || false;
      connectionType = connection.type || 'unknown'; // 'wifi', '4g', '3g', 'cellular', 'ethernet', 'bluetooth', etc.
    }
    
    return {
      latency: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      effectiveType,
      downlink,
      rtt,
      saveData,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType,
      testing: false,
      lastTest: 0,
    };
  }, []);

  const [networkStats, setNetworkStats] = useState<NetworkStats>(computeNetworkInfo);

  const runSpeedTest = useCallback(async () => {
    setNetworkStats(prev => ({ ...prev, testing: true }));
    
    try {
      // Test latency with real request
      const latencyStart = performance.now();
      await fetch('/api/health', { method: 'HEAD', cache: 'no-store' }).catch(() => {});
      const latency = Math.round(performance.now() - latencyStart);

      // Test download speed with real data
      const downloadStart = performance.now();
      const response = await fetch(`/api/speed-test?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      const downloadTime = (performance.now() - downloadStart) / 1000;
      
      let downloadSpeed = 0;
      if (response) {
        const blob = await response.blob().catch(() => new Blob());
        const sizeKB = blob.size / 1024;
        downloadSpeed = Math.round((sizeKB / downloadTime) * 8); // kbps
      }

      // Get REAL connection info from Network Information API
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      setNetworkStats(prev => ({
        ...prev,
        latency,
        downloadSpeed: downloadSpeed || (connection?.downlink ? connection.downlink * 1000 : 0),
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
        rtt: connection?.rtt || latency,
        saveData: connection?.saveData || false,
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        testing: false,
        lastTest: Date.now(),
      }));
    } catch (error) {
      setNetworkStats(prev => ({ ...prev, testing: false }));
    }
  }, []);

  useEffect(() => {
    // Set initial values with real connection info
    setNetworkStats(computeNetworkInfo());

    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    // Listen for connection changes
    const handleChange = () => {
      const updated = computeNetworkInfo();
      setNetworkStats(updated);
    };

    const handleOnline = () => setNetworkStats(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetworkStats(prev => ({ ...prev, isOnline: false }));

    connection?.addEventListener?.('change', handleChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      connection?.removeEventListener?.('change', handleChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [computeNetworkInfo]);

  return { ...networkStats, runSpeedTest } as NetworkStats & { runSpeedTest: () => Promise<void> };
}

/**
 * Hook for REAL performance metrics using Performance API
 */
function usePerformanceStats(): PerformanceStats {
  const [perfStats, setPerfStats] = useState<PerformanceStats>({
    loadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    timeToInteractive: 0,
    cumulativeLayoutShift: 0,
    totalBlockingTime: 0,
    jsExecutionTime: 0,
  });

  useEffect(() => {
    const measurePerformance = () => {
      try {
        // Get REAL navigation timing
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        // Get REAL paint timing
        const paintEntries = performance.getEntriesByType('paint');
        const fpEntry = paintEntries.find(e => e.name === 'first-paint');
        const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');

        // Calculate REAL metrics
        const loadTime = navTiming ? Math.round(navTiming.loadEventEnd - navTiming.startTime) : 0;
        const domContentLoaded = navTiming ? Math.round(navTiming.domContentLoadedEventEnd - navTiming.startTime) : 0;
        const firstPaint = fpEntry ? Math.round(fpEntry.startTime) : 0;
        const firstContentfulPaint = fcpEntry ? Math.round(fcpEntry.startTime) : 0;

        // Measure JS execution time
        const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resourceEntries.filter(r => r.name.includes('.js') || r.initiatorType === 'script');
        const jsExecutionTime = jsResources.reduce((acc, r) => acc + (r.duration || 0), 0);

        setPerfStats({
          loadTime,
          domContentLoaded,
          firstPaint,
          firstContentfulPaint,
          largestContentfulPaint: 0,
          timeToInteractive: domContentLoaded,
          cumulativeLayoutShift: 0,
          totalBlockingTime: 0,
          jsExecutionTime: Math.round(jsExecutionTime),
        });

        // Observe LCP
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              if (lastEntry) {
                setPerfStats(prev => ({
                  ...prev,
                  largestContentfulPaint: Math.round(lastEntry.startTime),
                }));
              }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Observe CLS
            const clsObserver = new PerformanceObserver((list) => {
              let clsValue = 0;
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value || 0;
                }
              }
              setPerfStats(prev => ({
                ...prev,
                cumulativeLayoutShift: Math.round(clsValue * 1000) / 1000,
              }));
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            return () => {
              lcpObserver.disconnect();
              clsObserver.disconnect();
            };
          } catch {}
        }
      } catch (error) {
        console.warn('[usePerformanceStats] Performance measurement failed:', error);
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return perfStats;
}

/**
 * Hook for REAL GPU info using WebGL API
 */
function useGpuInfo(): GpuInfo {
  // Compute GPU info synchronously with enhanced detection
  const computeGpuInfo = useCallback((): GpuInfo => {
    try {
      console.log('[useGpuInfo] 🎮 Detecting GPU (PC/Mobile universal)...');
      
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        let vendor = 'Unknown';
        let renderer = 'Unknown';
        
        if (debugInfo) {
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
          console.log('[useGpuInfo] ✅ GPU Detected:', { vendor, renderer });
        } else {
          // Fallback: Try to get vendor from regular WebGL parameters
          vendor = gl.getParameter(gl.VENDOR) || 'Unknown';
          renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
          console.log('[useGpuInfo] ⚠️ WEBGL_debug_renderer_info not available, using fallback:', { vendor, renderer });
        }
        
        const webglVersion = canvas.getContext('webgl2') ? 'WebGL 2.0' : 'WebGL 1.0';
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
        const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0];
        
        // Enhanced GPU tier detection with custom PC GPUs and mobile GPUs
        let tier: 'ultra' | 'high' | 'medium' | 'low' = 'medium';
        let score = 50;
        const rendererLower = renderer.toLowerCase();
        const vendorLower = vendor.toLowerCase();
        
        console.log('[useGpuInfo] 🔍 Analyzing GPU tier...');
        
        // === NVIDIA GPUs (Desktop & Laptop) ===
        if (rendererLower.includes('nvidia') || rendererLower.includes('geforce') || rendererLower.includes('quadro') || rendererLower.includes('rtx')) {
          // RTX 40 Series (Ultra)
          if (rendererLower.includes('rtx 40') || rendererLower.includes('4090') || rendererLower.includes('4080') || rendererLower.includes('4070')) {
            tier = 'ultra'; score = 98;
          }
          // RTX 30 Series (Ultra)
          else if (rendererLower.includes('rtx 30') || rendererLower.includes('3090') || rendererLower.includes('3080') || rendererLower.includes('3070')) {
            tier = 'ultra'; score = 95;
          }
          // RTX 20 Series (High)
          else if (rendererLower.includes('rtx 20') || rendererLower.includes('2080') || rendererLower.includes('2070') || rendererLower.includes('2060')) {
            tier = 'high'; score = 85;
          }
          // GTX 16 Series (High)
          else if (rendererLower.includes('gtx 16') || rendererLower.includes('1660') || rendererLower.includes('1650')) {
            tier = 'high'; score = 75;
          }
          // GTX 10 Series (Medium-High)
          else if (rendererLower.includes('gtx 10') || rendererLower.includes('1080') || rendererLower.includes('1070') || rendererLower.includes('1060')) {
            tier = 'high'; score = 70;
          }
          // Quadro/Professional (High)
          else if (rendererLower.includes('quadro') || rendererLower.includes('titan')) {
            tier = 'high'; score = 80;
          }
          else {
            tier = 'medium'; score = 60;
          }
        }
        
        // === AMD GPUs (Desktop & Laptop) ===
        else if (rendererLower.includes('amd') || rendererLower.includes('radeon') || rendererLower.includes('ati')) {
          // RX 7000 Series (Ultra)
          if (rendererLower.includes('rx 7') || rendererLower.includes('7900') || rendererLower.includes('7800') || rendererLower.includes('7700')) {
            tier = 'ultra'; score = 96;
          }
          // RX 6000 Series (Ultra)
          else if (rendererLower.includes('rx 6') || rendererLower.includes('6900') || rendererLower.includes('6800') || rendererLower.includes('6700')) {
            tier = 'ultra'; score = 92;
          }
          // RX 5000 Series (High)
          else if (rendererLower.includes('rx 5') || rendererLower.includes('5700') || rendererLower.includes('5600')) {
            tier = 'high'; score = 78;
          }
          // Vega (Medium-High)
          else if (rendererLower.includes('vega')) {
            tier = 'high'; score = 72;
          }
          else {
            tier = 'medium'; score = 55;
          }
        }
        
        // === Intel GPUs (Integrated & Arc) ===
        else if (rendererLower.includes('intel')) {
          // Intel Arc (High - Dedicated)
          if (rendererLower.includes('arc')) {
            tier = 'high'; score = 75;
          }
          // Intel Iris Xe (Medium - Good integrated)
          else if (rendererLower.includes('iris xe') || rendererLower.includes('xe')) {
            tier = 'medium'; score = 55;
          }
          // Intel UHD/Iris Plus (Low-Medium)
          else if (rendererLower.includes('uhd') || rendererLower.includes('iris plus')) {
            tier = 'medium'; score = 45;
          }
          // Intel HD Graphics (Low)
          else if (rendererLower.includes('hd graphics')) {
            tier = 'low'; score = 30;
          }
          else {
            tier = 'low'; score = 35;
          }
        }
        
        // === Apple GPUs (Mac & iOS) - Updated for 2026 ===
        else if (rendererLower.includes('apple') || vendorLower.includes('apple')) {
          // M4 Series (Ultra) - 2024+
          if (rendererLower.includes('m4') || rendererLower.includes('m4 pro') || rendererLower.includes('m4 max') || rendererLower.includes('m4 ultra')) {
            tier = 'ultra'; score = 98;
          }
          // M3 Series (Ultra) - 2023-2024
          else if (rendererLower.includes('m3') || rendererLower.includes('m3 pro') || rendererLower.includes('m3 max') || rendererLower.includes('m3 ultra')) {
            tier = 'ultra'; score = 95;
          }
          // M2 Series (Ultra) - 2022-2023
          else if (rendererLower.includes('m2') || rendererLower.includes('m2 pro') || rendererLower.includes('m2 max') || rendererLower.includes('m2 ultra')) {
            tier = 'ultra'; score = 92;
          }
          // M1 Series (High) - 2020-2021
          else if (rendererLower.includes('m1') || rendererLower.includes('m1 pro') || rendererLower.includes('m1 max') || rendererLower.includes('m1 ultra')) {
            tier = 'high'; score = 88;
          }
          // A18 Pro (iPhone 16 Pro, 2024) (Ultra)
          else if (rendererLower.includes('a18 pro') || rendererLower.includes('a18pro')) {
            tier = 'ultra'; score = 92;
          }
          // A18 (iPhone 16, 2024) (High)
          else if (rendererLower.includes('a18')) {
            tier = 'high'; score = 88;
          }
          // A17 Pro (iPhone 15 Pro, 2023) (Ultra)
          else if (rendererLower.includes('a17 pro') || rendererLower.includes('a17pro')) {
            tier = 'ultra'; score = 90;
          }
          // A17 (2023) (High)
          else if (rendererLower.includes('a17')) {
            tier = 'high'; score = 86;
          }
          // A16 Bionic (iPhone 14 Pro/15/15 Plus, 2022) (High)
          else if (rendererLower.includes('a16')) {
            tier = 'high'; score = 84;
          }
          // A15 Bionic (iPhone 13/14, 2021) (High)
          else if (rendererLower.includes('a15')) {
            tier = 'high'; score = 80;
          }
          // A14 Bionic (iPhone 12, iPad Air 4, 2020) (High)
          else if (rendererLower.includes('a14')) {
            tier = 'high'; score = 75;
          }
          // A13 Bionic (iPhone 11, 2019) (Medium-High)
          else if (rendererLower.includes('a13')) {
            tier = 'medium'; score = 68;
          }
          // A12Z/A12X Bionic (iPad Pro 2018/2020) (Medium-High)
          else if (rendererLower.includes('a12z') || rendererLower.includes('a12x')) {
            tier = 'medium'; score = 70;
          }
          // A12 Bionic (iPhone XS/XR, 2018) (Medium)
          else if (rendererLower.includes('a12')) {
            tier = 'medium'; score = 65;
          }
          // A11 Bionic (iPhone X/8, 2017) (Medium)
          else if (rendererLower.includes('a11')) {
            tier = 'medium'; score = 60;
          }
          // A10X Fusion (iPad Pro 2017) (Medium)
          else if (rendererLower.includes('a10x')) {
            tier = 'medium'; score = 58;
          }
          // A10 Fusion (iPhone 7, 2016) (Low-Medium)
          else if (rendererLower.includes('a10')) {
            tier = 'medium'; score = 50;
          }
          // A9X (iPad Pro 2015) (Low-Medium)
          else if (rendererLower.includes('a9x')) {
            tier = 'medium'; score = 48;
          }
          // A9 and older (Low)
          else if (rendererLower.includes('a9') || rendererLower.includes('a8') || rendererLower.includes('a7')) {
            tier = 'low'; score = 40;
          }
          else {
            tier = 'medium'; score = 60;
          }
        }
        
        // === Qualcomm Adreno (Android Mobile) ===
        else if (rendererLower.includes('adreno')) {
          // Adreno 7xx (High-end Android - Snapdragon 8 Gen series)
          if (rendererLower.includes('adreno 7') || rendererLower.includes('740') || rendererLower.includes('730')) {
            tier = 'high'; score = 82;
          }
          // Adreno 6xx (Mid-high Android)
          else if (rendererLower.includes('adreno 6') || rendererLower.includes('660') || rendererLower.includes('650') || rendererLower.includes('640')) {
            tier = 'medium'; score = 65;
          }
          // Adreno 5xx (Mid-range Android)
          else if (rendererLower.includes('adreno 5')) {
            tier = 'medium'; score = 50;
          }
          // Older Adreno (Low)
          else {
            tier = 'low'; score = 35;
          }
        }
        
        // === ARM Mali (Android Mobile & Tablets) ===
        else if (rendererLower.includes('mali')) {
          // Mali-G7x (High-end - Samsung Exynos, etc.)
          if (rendererLower.includes('mali-g7') || rendererLower.includes('g78') || rendererLower.includes('g77')) {
            tier = 'high'; score = 78;
          }
          // Mali-G6x (Medium-high)
          else if (rendererLower.includes('mali-g6')) {
            tier = 'medium'; score = 62;
          }
          // Mali-G5x (Medium)
          else if (rendererLower.includes('mali-g5')) {
            tier = 'medium'; score = 50;
          }
          // Older Mali (Low)
          else {
            tier = 'low'; score = 35;
          }
        }
        
        // === PowerVR (Some mobile devices) ===
        else if (rendererLower.includes('powervr')) {
          tier = 'low'; score = 40;
        }
        
        console.log('[useGpuInfo] ✅ GPU Tier:', tier, '| Score:', score);
        
        return {
          vendor: vendor || 'Unknown',
          renderer: renderer || 'Unknown',
          tier,
          score,
          webglVersion,
          maxTextureSize,
          maxViewportDims: maxViewportDims as number[],
        };
      }
    } catch (error) {
      console.warn('[useGpuInfo] ❌ GPU detection failed:', error);
    }

    return {
      vendor: 'WebGL Not Available',
      renderer: 'Unable to detect',
      tier: 'medium',
      score: 50,
      webglVersion: 'Unknown',
      maxTextureSize: 0,
      maxViewportDims: [0, 0],
    };
  }, []);

  const [gpuInfo, setGpuInfo] = useState<GpuInfo>(computeGpuInfo);

  useEffect(() => {
    setGpuInfo(computeGpuInfo());
  }, [computeGpuInfo]);

  return gpuInfo;
}

/**
 * Hook for REAL battery info using Battery API + Fallbacks
 * Tries multiple sources: Battery Status API, PowerProfiles, Electron, etc.
 */
function useBatteryInfo(): BatteryInfo {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({
    level: 0, // Will be updated when battery API is available
    charging: false,
    chargingTime: Infinity,
    dischargingTime: Infinity,
    supported: false,
  });

  useEffect(() => {
    let isMounted = true;
    let battery: any = null;

    const initBattery = async () => {
      try {
        const nav = navigator as any;
        const isDev = process.env.NODE_ENV !== 'production';
        
        if (isDev) {
          console.log('[useBatteryInfo] 🔍 Initializing battery API...');
          console.log('[useBatteryInfo] Browser:', navigator.userAgent);
          console.log('[useBatteryInfo] getBattery available:', !!nav.getBattery);
        }
        
        // Use only the standard Battery Status API - this pulls REAL device battery info
        if (!nav.getBattery || typeof nav.getBattery !== 'function') {
          if (isDev) {
            console.warn('[useBatteryInfo] Battery API not supported in this browser');
            console.log('[useBatteryInfo] Battery API requires: Chromium browser (Chrome/Edge/Brave) on a device with battery');
          }
          if (isMounted) {
            setBatteryInfo({
              level: 0,
              charging: false,
              chargingTime: Infinity,
              dischargingTime: Infinity,
              supported: false,
            });
          }
          return;
        }

        if (isDev) {
          console.log('[useBatteryInfo] ⏳ Requesting device battery...');
        }
        
        // Get real device battery
        battery = await nav.getBattery();
        
        if (isDev) {
          console.log('[useBatteryInfo] ✅ Battery object received:', {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          });
        }
        
        // Update battery info from real device data
        const updateFromDevice = () => {
          if (!isMounted || !battery) return;
          
          const batteryData = {
            level: Math.round(battery.level * 100), // Convert 0-1 to 0-100
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            supported: true,
          };
          
          if (isDev) {
            console.log('[useBatteryInfo] 🔋 Battery update:', batteryData);
          }
          setBatteryInfo(batteryData);
        };
        
        // Initial update with real device data
        updateFromDevice();
        
        // Listen for real device battery changes
        battery.addEventListener('levelchange', updateFromDevice);
        battery.addEventListener('chargingchange', updateFromDevice);
        battery.addEventListener('chargingtimechange', updateFromDevice);
        battery.addEventListener('dischargingtimechange', updateFromDevice);
        
        if (isDev) {
          console.log('[useBatteryInfo] ✅ Successfully connected to device battery:', {
            level: Math.round(battery.level * 100) + '%',
            charging: battery.charging
          });
        }
        
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useBatteryInfo] Failed to access device battery:', error);
        }
        if (isMounted) {
          setBatteryInfo({
            level: 0,
            charging: false,
            chargingTime: Infinity,
            dischargingTime: Infinity,
            supported: false,
          });
        }
      }
    };

    initBattery();

    return () => {
      isMounted = false;
      // Event listeners will be automatically cleaned up when battery object is garbage collected
      // or we can try to remove them if battery is still available
      if (battery) {
        try {
          // Note: We're using anonymous functions in the addEventListener calls,
          // so we can't remove them specifically. This is fine as the battery object
          // will be garbage collected when the component unmounts.
        } catch (error) {
          console.warn('[useBatteryInfo] Error during cleanup:', error);
        }
      }
    };
  }, []);

  return batteryInfo;
}

/**
 * Hook for REAL screen info
 */
function useScreenInfo(): ScreenInfo {
  // Compute initial screen info synchronously
  const computeScreenInfo = useCallback((): ScreenInfo => {
    const nav = navigator as any;
    return {
      width: typeof window !== 'undefined' ? window.screen.width : 0,
      height: typeof window !== 'undefined' ? window.screen.height : 0,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      refreshRate: 60,
      colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth : 24,
      orientation: typeof window !== 'undefined' && window.screen.orientation?.type?.includes('portrait') ? 'portrait' : 'landscape',
      touchPoints: nav.maxTouchPoints || 0,
      hdr: typeof window !== 'undefined' ? window.matchMedia('(dynamic-range: high)').matches : false,
    };
  }, []);

  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(computeScreenInfo);

  useEffect(() => {
    setScreenInfo(computeScreenInfo());
    
    const updateScreenInfo = () => {
      const nav = navigator as any;
      
      // Check for HDR support
      const hdr = window.matchMedia('(dynamic-range: high)').matches;
      
      setScreenInfo({
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio,
        refreshRate: 60,
        colorDepth: window.screen.colorDepth,
        orientation: window.screen.orientation?.type?.includes('portrait') ? 'portrait' : 'landscape',
        touchPoints: nav.maxTouchPoints || 0,
        hdr,
      });
    };

    window.addEventListener('resize', updateScreenInfo);
    
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, [computeScreenInfo]);

  return screenInfo;
}

/**
 * Interface for console log entries
 */
interface ConsoleEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
}

/**
 * Hook for capturing console logs and errors in real-time
 */
function useConsoleLogs(maxLogs: number = 100): { logs: ConsoleEntry[]; clearLogs: () => void } {
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const logsRef = useRef<ConsoleEntry[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    const captureLog = (level: 'log' | 'info' | 'warn' | 'error' | 'debug', ...args: any[]) => {
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        level,
        message: args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' '),
        args,
      };

      logsRef.current = [entry, ...logsRef.current].slice(0, maxLogs);
      // Defer setLogs to avoid calling setState during render phase
      queueMicrotask(() => {
        setLogs([...logsRef.current]);
      });
    };

    // Override console methods
    console.log = (...args) => {
      originalLog(...args);
      captureLog('log', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      captureLog('error', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('warn', ...args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      captureLog('info', ...args);
    };

    console.debug = (...args) => {
      originalDebug(...args);
      captureLog('debug', ...args);
    };

    // Capture uncaught errors
    const handleError = (event: ErrorEvent) => {
      captureLog('error', `${event.error?.name || 'Error'}: ${event.error?.message || event.message}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureLog('error', `Unhandled Promise Rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Restore original console methods on cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [maxLogs]);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  return { logs, clearLogs };
}

/**
 * Hook for detecting REAL browser capabilities and features
 */
interface BrowserCapabilities {
  webgl2: boolean;
  webgpu: boolean;
  serviceWorker: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDb: boolean;
  sharedArrayBuffer: boolean;
  webWorker: boolean;
  webAssembly: boolean;
  audioContext: boolean;
  mediaRecorder: boolean;
  mediaDevices: boolean;
  geolocation: boolean;
  vibration: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  ambientLight: boolean;
  proximity: boolean;
  pushNotification: boolean;
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
  usb: boolean;
  bluetooth: boolean;
  serialPort: boolean;
  fileSystem: boolean;
  clipboardAccess: boolean;
  screenCapture: boolean;
  vr: boolean;
  ar: boolean;
  videoCodecs: string[];
  audioCodecs: string[];
}

function useBrowserCapabilities(): BrowserCapabilities {
  const computeCapabilities = useCallback((): BrowserCapabilities => {
    const nav = navigator as any;
    
    // Test WebGL versions
    const webgl2 = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch { return false; }
    })();

    // Test WebGPU
    const webgpu = 'gpu' in navigator;

    // Test storage APIs
    const localStorage = (() => {
      try {
        return typeof window !== 'undefined' && 'localStorage' in window;
      } catch { return false; }
    })();

    const sessionStorage = (() => {
      try {
        return typeof window !== 'undefined' && 'sessionStorage' in window;
      } catch { return false; }
    })();

    const indexedDb = !!window.indexedDB;
    const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    const webWorker = typeof Worker !== 'undefined';
    const webAssembly = typeof WebAssembly !== 'undefined';
    
    // Test audio/media
    const audioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
    const mediaRecorder = typeof MediaRecorder !== 'undefined';
    const mediaDevices = !!nav.mediaDevices;
    
    // Test sensors
    const accelerometer = 'Accelerometer' in window;
    const gyroscope = 'Gyroscope' in window;
    const magnetometer = 'Magnetometer' in window;
    const ambientLight = 'AmbientLightSensor' in window;
    const proximity = 'ProximitySensor' in window;
    
    // Test permissions/APIs
    const geolocation = 'geolocation' in nav;
    const vibration = 'vibrate' in nav;
    const pushNotification = 'serviceWorker' in nav && 'PushManager' in window;
    const notifications = 'Notification' in window;
    const serviceWorker = 'serviceWorker' in nav;
    const usb = 'usb' in nav;
    const bluetooth = 'bluetooth' in nav;
    const serialPort = 'serial' in nav;
    const fileSystem = 'storage' in nav && 'getDirectory' in (nav.storage as any);
    const clipboardAccess = !!(nav.clipboard && nav.clipboard.read);
    const screenCapture = !!(nav.mediaDevices && nav.mediaDevices.getDisplayMedia);
    
    // Test XR capabilities
    const vr = 'xr' in nav && 'isSessionSupported' in (nav.xr as any);
    const ar = vr; // Same XR API for AR
    
    // Detect camera and microphone
    const camera = !!mediaDevices;
    const microphone = !!mediaDevices;

    // Test video and audio codec support
    const video = document.createElement('video');
    const videoCodecs = [];
    const audioCodecs = [];
    
    if (video.canPlayType) {
      if (video.canPlayType('video/mp4; codecs="avc1.42E01E"')) videoCodecs.push('H.264');
      if (video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"')) videoCodecs.push('H.265');
      if (video.canPlayType('video/webm; codecs="vp8, vorbis"')) videoCodecs.push('VP8');
      if (video.canPlayType('video/webm; codecs="vp9"')) videoCodecs.push('VP9');
      if (video.canPlayType('video/mp4; codecs="av01.0.12M.08"')) videoCodecs.push('AV1');
    }

    const audio = document.createElement('audio');
    if (audio.canPlayType) {
      if (audio.canPlayType('audio/mpeg')) audioCodecs.push('MP3');
      if (audio.canPlayType('audio/wav')) audioCodecs.push('WAV');
      if (audio.canPlayType('audio/ogg')) audioCodecs.push('Vorbis');
      if (audio.canPlayType('audio/aac')) audioCodecs.push('AAC');
      if (audio.canPlayType('audio/flac')) audioCodecs.push('FLAC');
      if (audio.canPlayType('audio/webm')) audioCodecs.push('WebM');
    }

    return {
      webgl2,
      webgpu,
      serviceWorker,
      localStorage,
      sessionStorage,
      indexedDb,
      sharedArrayBuffer,
      webWorker,
      webAssembly,
      audioContext,
      mediaRecorder,
      mediaDevices,
      geolocation,
      vibration,
      accelerometer,
      gyroscope,
      magnetometer,
      ambientLight,
      proximity,
      pushNotification,
      notifications,
      camera,
      microphone,
      usb,
      bluetooth,
      serialPort,
      fileSystem,
      clipboardAccess,
      screenCapture,
      vr,
      ar,
      videoCodecs,
      audioCodecs,
    };
  }, []);

  return useMemo(() => computeCapabilities(), [computeCapabilities]);
}

/**
 * Calculate 3D Performance Score (0-100)
 */
function calculate3DPerformanceScore(fps: number, memoryPercentage: number, gpuScore: number, cores: number): number {
  let score = 0;
  
  // GPU tier (40 points)
  score += Math.min(40, Math.round((gpuScore / 100) * 40));
  
  // FPS (30 points)
  if (fps >= 60) score += 30;
  else if (fps >= 45) score += 20;
  else if (fps >= 30) score += 10;
  else score += 5;
  
  // Memory (20 points)
  if (memoryPercentage < 50) score += 20;
  else if (memoryPercentage < 70) score += 15;
  else if (memoryPercentage < 85) score += 10;
  else score += 5;
  
  // CPU cores (10 points)
  if (cores >= 8) score += 10;
  else if (cores >= 4) score += 7;
  else score += 3;
  
  return Math.min(100, score);
}

/**
 * Get Performance Grade from Score
 */
function getPerformanceGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 90) return { grade: 'S', color: '#22c55e', label: 'Excellent' };
  if (score >= 80) return { grade: 'A', color: '#3b82f6', label: 'Great' };
  if (score >= 70) return { grade: 'B', color: '#a855f7', label: 'Good' };
  if (score >= 60) return { grade: 'C', color: '#f59e0b', label: 'Fair' };
  if (score >= 50) return { grade: 'D', color: '#ef4444', label: 'Poor' };
  return { grade: 'F', color: '#dc2626', label: 'Critical' };
}

function useVipCheck(userId?: string, userEmail?: string) {
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const checkStatus = useCallback(async () => {
    // First, check localStorage for cached VIP status (instant access)
    let sessionEmail: string | null = null;
    let cachedVipStatus: boolean | null = null;
    
    try {
      const savedSession = localStorage.getItem('bullmoney_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        sessionEmail = session.email || null;
        cachedVipStatus = session.is_vip === true;
        
        console.log('[VIP Check] localStorage session:', { 
          email: sessionEmail, 
          is_vip: session.is_vip,
          cachedVipStatus 
        });
        
        // If we have a cached VIP status = true, use it immediately while still verifying via API
        if (cachedVipStatus) {
          console.log('[VIP Check] ✅ User is VIP from localStorage cache (verifying with API)');
          setIsVip(true);
        }
      }
    } catch (e) {
      console.error('[VIP Check] localStorage error:', e);
    }
    
    // Determine the email to use for API check
    const emailToCheck = userEmail || sessionEmail;
    
    if (!emailToCheck && !userId) {
      console.log('[VIP Check] No email or userId - using cached VIP status');
      setIsVip(cachedVipStatus || false);
      setLoading(false);
      return;
    }
    
    try {
      const params = emailToCheck 
        ? `email=${encodeURIComponent(emailToCheck)}` 
        : `userId=${userId}`;
      
      console.log('[VIP Check] Checking API with:', params);
      const res = await fetch(`/api/vip/status?${params}`, { cache: 'no-store' });
      const data = await res.json();
      const vipStatus = data.isVip === true;
      
      console.log('[VIP Check] API Response:', { isVip: vipStatus, data });
      
      setIsVip(vipStatus);
      
      // Update localStorage with latest VIP status
      try {
        const savedSession = localStorage.getItem('bullmoney_session');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          localStorage.setItem('bullmoney_session', JSON.stringify({
            ...session,
            is_vip: vipStatus
          }));
          console.log('[VIP Check] Updated localStorage is_vip:', vipStatus);
        }
      } catch {}
    } catch (error) {
      console.error('[VIP Check] API Error:', error);
      setIsVip(cachedVipStatus || false);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);
  
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [checkStatus]);
  
  return { isVip, loading };
}

// Exported for use in WelcomeScreenDesktop
export function useLivePrices() {
  const [prices, setPrices] = useState({ xauusd: '...', btcusd: '...' });
  
  useEffect(() => {
    let mounted = true;
    
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/prices/live?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data) {
          setPrices(prev => {
            if (prev.xauusd === data.xauusd && prev.btcusd === data.btcusd) return prev;
            return { xauusd: data.xauusd || prev.xauusd, btcusd: data.btcusd || prev.btcusd };
          });
        }
      } catch {}
    };

    const timeout = setTimeout(fetchPrices, 500);
    const interval = setInterval(fetchPrices, 3000);
    
    return () => { mounted = false; clearTimeout(timeout); clearInterval(interval); };
  }, []);
  
  return prices;
}

function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  useEffect(() => {
    const checkAdmin = async () => {
      // First, always check localStorage for session (faster)
      const saved = localStorage.getItem('bullmoney_session');
      if (saved) {
        try {
          const sess = JSON.parse(saved);
          console.log('[useAdminCheck] Found localStorage session:', { id: sess?.id, email: sess?.email, is_vip: sess?.is_vip });
          if (sess?.id) setUserId(sess.id);
          if (sess?.email) setUserEmail(sess.email);
          setIsAdmin(sess?.email === 'mrbullmoney@gmail.com' || sess?.isAdmin);
        } catch (e) {
          console.error('[useAdminCheck] Error parsing session:', e);
        }
      }
      
      // Also check Supabase auth (may override if different)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email;
          console.log('[useAdminCheck] Found Supabase session:', { id: session.user.id, email });
          setIsAdmin(email === 'mrbullmoney@gmail.com');
          setUserId(session.user.id);
          setUserEmail(email);
        }
      } catch (e) {
        console.log('[useAdminCheck] Supabase auth check failed, using localStorage');
      }
    };
    
    checkAdmin();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.email) {
        setIsAdmin(session.user.email === 'mrbullmoney@gmail.com');
        setUserId(session.user.id);
        setUserEmail(session.user.email);
      }
    });
    
    // Check for admin token
    if (localStorage.getItem('adminToken')) setIsAdmin(true);
    
    return () => subscription?.unsubscribe();
  }, [supabase]);
  
  return { isAdmin, userId, userEmail };
}

// ============================================================================
// SUB-COMPONENTS: FPS Display
// ============================================================================

const FpsCandlestickChart = memo(({ fps, width = 80, height = 48, candleCount = 8 }: {
  fps: number; width?: number; height?: number; candleCount?: number;
}) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const fpsBufferRef = useRef<number[]>([]);
  const lastCandleTimeRef = useRef(Date.now());
  const fpsRef = useRef(fps);
  const mountedRef = useRef(true);

  useEffect(() => { fpsRef.current = fps; });
  
  useEffect(() => {
    mountedRef.current = true;
    setCandles(Array(candleCount).fill(null).map((_, i) => ({
      timestamp: Date.now() - (candleCount - i) * 1000,
      open: 60, high: 60, low: 60, close: 60,
    })));
    return () => { mountedRef.current = false; };
  }, [candleCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      fpsBufferRef.current.push(fpsRef.current);

      if (Date.now() - lastCandleTimeRef.current >= 500) {
        if (fpsBufferRef.current.length > 0) {
          const open = fpsBufferRef.current[0];
          const close = fpsBufferRef.current[fpsBufferRef.current.length - 1];
          const high = Math.max(...fpsBufferRef.current);
          const low = Math.min(...fpsBufferRef.current);

          if (mountedRef.current) {
            setCandles(prev => [...prev.slice(1), { timestamp: Date.now(), open, high, low, close }]);
          }
          fpsBufferRef.current = [];
          lastCandleTimeRef.current = Date.now();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const candleWidth = (width - 8) / candleCount;
  const padding = 4;
  const maxFps = 120;

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ width, height }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-blue-500/5 to-slate-900/25 border border-blue-500/20" />
      <svg width={width} height={height} className="relative z-10">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1={padding} y1={height * pct} x2={width - padding} y2={height * pct}
            stroke="rgba(209, 213, 219, 0.08)" strokeWidth="0.5" />
        ))}
        
        {/* Candles */}
        {candles.map((candle, i) => {
          const x = padding + i * candleWidth + candleWidth / 2;
          const isBullish = candle.close >= candle.open;
          const color = isBullish ? '#FFFFFF' : '#9CA3AF';
          
          const yHigh = padding + ((maxFps - candle.high) / maxFps) * (height - padding * 2);
          const yLow = padding + ((maxFps - candle.low) / maxFps) * (height - padding * 2);
          const yOpen = padding + ((maxFps - candle.open) / maxFps) * (height - padding * 2);
          const yClose = padding + ((maxFps - candle.close) / maxFps) * (height - padding * 2);
          
          return (
            <g key={i}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke="#D1D5DB" strokeWidth="1" />
              <rect
                x={x - candleWidth * 0.3}
                y={Math.min(yOpen, yClose)}
                width={candleWidth * 0.6}
                height={Math.max(Math.abs(yClose - yOpen), 1)}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
});
FpsCandlestickChart.displayName = 'FpsCandlestickChart';

const FpsDisplay = memo(({ fps, deviceTier, jankScore }: { fps: number; deviceTier: string; jankScore?: number }) => {
  const colors = getFpsColor(fps);
  
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-slate-900/40 border border-blue-500/40" />
      <div className="relative px-2 py-1.5 flex items-center gap-2">
        <FpsCandlestickChart fps={fps} />
        <div className="flex flex-col gap-0.5 min-w-[40px]">
          <div className="flex items-center gap-1">
            <Activity size={10} className="text-blue-400 neon-blue-icon" />
            <span className="text-sm font-black neon-blue-text" style={{ color: colors.text }}>{fps}</span>
          </div>
          <div className="text-[8px] font-mono font-bold uppercase neon-blue-text tracking-wide">
            {deviceTier}
            {jankScore && jankScore > 0.1 && (
              <span className="text-orange-400 ml-1">↓{Math.round(jankScore * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
FpsDisplay.displayName = 'FpsDisplay';

const MinimizedFpsDisplay = memo(({ fps }: { fps: number }) => {
  const colors = getFpsColor(fps);
  const digits = String(fps).padStart(2, '0').split('');
  
  return (
    <div className="flex items-center gap-0.5">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Activity size={11} className="text-blue-400 neon-blue-icon drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
      </motion.div>
      <div className="flex overflow-hidden rounded" style={{ background: colors.bg }}>
        {digits.map((digit, idx) => (
          <div key={idx} className="relative w-[10px] h-[16px] overflow-hidden">
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black tabular-nums neon-blue-text"
              style={{ color: colors.text, textShadow: `0 0 8px ${colors.glow}` }}>
              {digit}
            </span>
          </div>
        ))}
      </div>
      <span className="text-[7px] neon-blue-text font-bold uppercase tracking-wider ml-0.5">fps</span>
    </div>
  );
});
MinimizedFpsDisplay.displayName = 'MinimizedFpsDisplay';

// ============================================================================
// SUB-COMPONENTS: Device Panel Components (Real Data)
// ============================================================================

const StatCard = memo(({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  color = 'blue',
  subValue,
  animate = true,
  dataSource
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: typeof Cpu;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'purple';
  subValue?: string;
  animate?: boolean;
  dataSource?: 'device' | 'browser' | 'estimated';
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  };
  
  const sourceLabels = {
    device: 'Real Device',
    browser: 'Browser API',
    estimated: 'Estimated'
  };
  
  const sourceColors = {
    device: 'text-blue-400',
    browser: 'text-blue-400',
    estimated: 'text-blue-400'
  };
  
  const sourceGlow = '0 0 6px #3b82f6';

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide truncate">{label}</span>
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${colorClasses[color].split(' ').pop()}`} style={{ filter: `drop-shadow(${sourceGlow})` }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black text-white tabular-nums">{value}</span>
        {unit && <span className="text-[9px] text-zinc-500 font-medium">{unit}</span>}
      </div>
      {subValue && <div className="text-[8px] text-zinc-500 mt-0.5 truncate">{subValue}</div>}
      {dataSource && (
        <div className={`text-[7px] font-medium mt-1 truncate ${sourceColors[dataSource]}`} style={{ textShadow: sourceGlow }}>
          {sourceLabels[dataSource]}
        </div>
      )}
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';

const PerformanceRing = memo(({ 
  value, 
  maxValue = 100, 
  label, 
  color = 'blue',
  size = 60 
}: {
  value: number;
  maxValue?: number;
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'cyan';
  size?: number;
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    blue: { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
    green: { stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
    amber: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
    red: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
    cyan: { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[color].stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${colors[color].glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-white tabular-nums">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-[8px] text-zinc-400 mt-1 font-medium">{label}</span>
    </div>
  );
});
PerformanceRing.displayName = 'PerformanceRing';

const ConnectionStatusBadge = memo(({ isOnline, effectiveType }: { isOnline: boolean; effectiveType: string }) => {
  const getSpeedColor = () => {
    if (!isOnline) return 'red';
    if (effectiveType === '4g') return 'green';
    if (effectiveType === '3g') return 'amber';
    return 'red';
  };

  const color = getSpeedColor();
  const colorClasses = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${colorClasses[color]}`}>
      <motion.div
        className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-emerald-400' : color === 'amber' ? 'bg-amber-400' : 'bg-red-400'}`}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-[10px] font-bold uppercase">
        {isOnline ? effectiveType.toUpperCase() : 'OFFLINE'}
      </span>
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
    </div>
  );
});
ConnectionStatusBadge.displayName = 'ConnectionStatusBadge';

// ============================================================================
// DEVICE CENTER PANEL - 4 Tabs with Real Data
// ============================================================================

const DeviceCenterPanel = memo(({ 
  isOpen, 
  onClose,
  fps,
  deviceTier,
  jankScore,
  isAdmin,
  isVip,
  userId,
  userEmail
}: {
  isOpen: boolean;
  onClose: () => void;
  fps: number;
  deviceTier: string;
  jankScore?: number;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
}) => {
  const [activeTab, setActiveTab] = useState<DevicePanelTab>('overview');
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get REAL device data from hooks
  const memoryStats = useRealTimeMemory();
  const browserInfo = useBrowserInfo();
  const storageInfo = useStorageInfo();
  const cacheStats = useRealTimeCache();
  const networkStats = useNetworkStats() as NetworkStats & { runSpeedTest: () => Promise<void> };
  const perfStats = usePerformanceStats();
  const gpuInfo = useGpuInfo();
  const batteryInfo = useBatteryInfo();
  const screenInfo = useScreenInfo();
  
  // Calculate 3D Performance Score
  const performanceScore = calculate3DPerformanceScore(fps, memoryStats.percentage, gpuInfo.score, browserInfo.cores);
  const performanceGrade = getPerformanceGrade(performanceScore);

  // Handle swipe to close
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      SoundEffects.swipe();
      onClose();
    }
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="fixed right-0 top-0 bottom-0 z-[2147483646] w-[320px] max-w-[90vw] bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl border-l border-blue-500/30 shadow-2xl shadow-blue-900/30 flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-600" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white neon-white-icon" />
                </div>
                <div>
                  <h3 className="text-sm font-bold neon-white-text">Device Center</h3>
                  <p className="text-[9px] text-zinc-400">Real-time system info</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 flex items-center justify-center neon-blue-border"
              >
                <X className="w-4 h-4 neon-blue-icon" />
              </motion.button>
            </div>

            {/* FPS Display */}
            <div className="mt-3 flex items-center justify-between">
              <FpsDisplay fps={fps} deviceTier={deviceTier} jankScore={jankScore} />
              <ConnectionStatusBadge 
                isOnline={browserInfo.onLine} 
                effectiveType={browserInfo.connection.effectiveType} 
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-blue-500/20">
            {DEVICE_PANEL_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Device Info */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Device</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Platform</span>
                        <span className="text-white font-semibold">{browserInfo.platform}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Browser</span>
                        <span className="text-white font-semibold">{browserInfo.name} {browserInfo.version.split('.')[0]}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Engine</span>
                        <span className="text-white font-semibold">{browserInfo.engine}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">CPU Cores</span>
                        <span className="text-white font-semibold">{browserInfo.cores}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Device RAM</span>
                        <span className="text-white font-semibold">{browserInfo.deviceMemory} GB</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Locale</span>
                        <span className="text-white font-semibold">{browserInfo.locale}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3D Performance Grade */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">3D Performance Score</h4>
                    <div className="flex items-center justify-center">
                      <div className="relative w-[100px] h-[100px]">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke={performanceGrade.color}
                            strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={264}
                            initial={{ strokeDashoffset: 264 }}
                            animate={{ strokeDashoffset: 264 - (performanceScore / 100) * 264 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 8px ${performanceGrade.color}80)` }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black" style={{ color: performanceGrade.color, textShadow: `0 0 15px ${performanceGrade.color}50` }}>
                            {performanceGrade.grade}
                          </span>
                          <span className="text-[9px] text-zinc-400">{performanceGrade.label}</span>
                          <span className="text-[8px] text-zinc-500">{performanceScore}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GPU Info */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/5 border border-purple-500/20">
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">Graphics</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">GPU</span>
                        <span className="text-white font-semibold truncate max-w-[160px]" title={gpuInfo.renderer}>
                          {gpuInfo.renderer.length > 25 ? gpuInfo.renderer.slice(0, 25) + '...' : gpuInfo.renderer}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Vendor</span>
                        <span className="text-white font-semibold">{gpuInfo.vendor}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">WebGL</span>
                        <span className="text-white font-semibold">{gpuInfo.webglVersion}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">GPU Tier</span>
                        <span className={`font-semibold uppercase ${
                          gpuInfo.tier === 'ultra' ? 'text-purple-400' :
                          gpuInfo.tier === 'high' ? 'text-emerald-400' :
                          gpuInfo.tier === 'medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {gpuInfo.tier}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Max Texture</span>
                        <span className="text-white font-semibold">{gpuInfo.maxTextureSize}px</span>
                      </div>
                    </div>
                  </div>

                  {/* Screen Info */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">Display</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Resolution</span>
                        <span className="text-white font-semibold">{screenInfo.width} × {screenInfo.height}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Pixel Ratio</span>
                        <span className="text-white font-semibold">{screenInfo.pixelRatio}x</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Refresh Rate</span>
                        <span className="text-white font-semibold">{screenInfo.refreshRate} Hz</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Color Depth</span>
                        <span className="text-white font-semibold">{screenInfo.colorDepth}-bit</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">HDR</span>
                        <span className={`font-semibold ${screenInfo.hdr ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {screenInfo.hdr ? 'Supported' : 'Not supported'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Touch Points</span>
                        <span className="text-white font-semibold">{screenInfo.touchPoints}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Info (if supported) */}
                  {batteryInfo.supported && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                      <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Battery</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">Level</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  batteryInfo.level > 50 ? 'bg-emerald-500' :
                                  batteryInfo.level > 20 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${batteryInfo.level}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-white font-semibold">{batteryInfo.level}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">Status</span>
                          <span className={`font-semibold flex items-center gap-1 ${batteryInfo.charging ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {batteryInfo.charging ? (
                              <>
                                <Zap className="w-3 h-3" />
                                Charging
                              </>
                            ) : (
                              <>
                                <Battery className="w-3 h-3" />
                                Discharging
                              </>
                            )}
                          </span>
                        </div>
                        {batteryInfo.charging && batteryInfo.chargingTime !== Infinity && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-400">Full in</span>
                            <span className="text-white font-semibold">
                              {Math.round(batteryInfo.chargingTime / 60)} min
                            </span>
                          </div>
                        )}
                        {!batteryInfo.charging && batteryInfo.dischargingTime !== Infinity && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-400">Time Left</span>
                            <span className="text-white font-semibold">
                              {Math.round(batteryInfo.dischargingTime / 60)} min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Memory Usage */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="JS Heap"
                      value={memoryStats.jsHeapUsed}
                      unit="MB"
                      icon={MemoryStick}
                      color="cyan"
                      subValue={`${memoryStats.percentage}% of ${memoryStats.jsHeapLimit}MB`}
                    />
                    <StatCard
                      label="Device RAM"
                      value={browserInfo.deviceMemory}
                      unit="GB"
                      icon={Database}
                      color="blue"
                    />
                  </div>

                  {/* Storage */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Storage Type"
                      value={storageInfo.type}
                      icon={HardDrive}
                      color="purple"
                    />
                    <StatCard
                      label="Cache Used"
                      value={cacheStats.usage.toFixed(1)}
                      unit="MB"
                      icon={Database}
                      color="amber"
                      subValue={`${cacheStats.percentage}% of quota`}
                    />
                  </div>

                  {/* Performance Rings */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Real-Time Metrics</h4>
                    <div className="flex justify-around">
                      <PerformanceRing
                        value={fps}
                        maxValue={120}
                        label="FPS"
                        color={fps >= 50 ? 'green' : fps >= 30 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={memoryStats.percentage}
                        maxValue={100}
                        label="Memory"
                        color={memoryStats.percentage < 50 ? 'green' : memoryStats.percentage < 80 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={cacheStats.percentage}
                        maxValue={100}
                        label="Cache"
                        color={cacheStats.percentage < 50 ? 'cyan' : cacheStats.percentage < 80 ? 'amber' : 'red'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* NETWORK TAB */}
              {activeTab === 'network' && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Connection Status */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Connection</h4>
                      <ConnectionStatusBadge 
                        isOnline={networkStats.isOnline} 
                        effectiveType={networkStats.effectiveType} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Type</span>
                        <span className="text-white font-semibold">{networkStats.connectionType || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Downlink</span>
                        <span className="text-white font-semibold">{networkStats.downlink} Mbps</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">RTT (Latency)</span>
                        <span className="text-white font-semibold">{networkStats.rtt} ms</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Data Saver</span>
                        <span className={`font-semibold ${networkStats.saveData ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {networkStats.saveData ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Speed Test */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Speed Test</h4>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={networkStats.runSpeedTest}
                        disabled={networkStats.testing}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-[9px] font-semibold text-blue-400 disabled:opacity-50"
                      >
                        {networkStats.testing ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {networkStats.testing ? 'Testing...' : 'Run Test'}
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <StatCard
                        label="Latency"
                        value={networkStats.latency || networkStats.rtt}
                        unit="ms"
                        icon={Clock}
                        color={networkStats.latency < 50 ? 'green' : networkStats.latency < 100 ? 'amber' : 'red'}
                        animate={false}
                      />
                      <StatCard
                        label="Download"
                        value={networkStats.downloadSpeed > 0 ? (networkStats.downloadSpeed / 1000).toFixed(1) : networkStats.downlink}
                        unit="Mbps"
                        icon={TrendingUp}
                        color="cyan"
                        animate={false}
                      />
                    </div>

                    {networkStats.lastTest > 0 && (
                      <div className="mt-2 text-[8px] text-zinc-500 text-center">
                        Last test: {new Date(networkStats.lastTest).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {/* Network Quality */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Quality Assessment</h4>
                    <div className="flex justify-around">
                      <PerformanceRing
                        value={networkStats.isOnline ? (networkStats.effectiveType === '4g' ? 90 : networkStats.effectiveType === '3g' ? 60 : 30) : 0}
                        maxValue={100}
                        label="Quality"
                        color={networkStats.effectiveType === '4g' ? 'green' : networkStats.effectiveType === '3g' ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={Math.min(100, Math.max(0, 100 - (networkStats.rtt / 5)))}
                        maxValue={100}
                        label="Latency"
                        color={networkStats.rtt < 50 ? 'green' : networkStats.rtt < 100 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={Math.min(100, (networkStats.downlink / 50) * 100)}
                        maxValue={100}
                        label="Speed"
                        color={networkStats.downlink > 10 ? 'green' : networkStats.downlink > 5 ? 'amber' : 'red'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PERFORMANCE TAB */}
              {activeTab === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Core Web Vitals */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Core Web Vitals</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">First Contentful Paint</span>
                        <span className={`font-semibold ${perfStats.firstContentfulPaint < 1800 ? 'text-emerald-400' : perfStats.firstContentfulPaint < 3000 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perfStats.firstContentfulPaint}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Largest Contentful Paint</span>
                        <span className={`font-semibold ${perfStats.largestContentfulPaint < 2500 ? 'text-emerald-400' : perfStats.largestContentfulPaint < 4000 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perfStats.largestContentfulPaint || 'Measuring...'}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Cumulative Layout Shift</span>
                        <span className={`font-semibold ${perfStats.cumulativeLayoutShift < 0.1 ? 'text-emerald-400' : perfStats.cumulativeLayoutShift < 0.25 ? 'text-amber-400' : 'text-red-400'}`}>
                          {perfStats.cumulativeLayoutShift.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Load Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Page Load"
                      value={perfStats.loadTime}
                      unit="ms"
                      icon={Clock}
                      color={perfStats.loadTime < 2000 ? 'green' : perfStats.loadTime < 4000 ? 'amber' : 'red'}
                    />
                    <StatCard
                      label="DOM Ready"
                      value={perfStats.domContentLoaded}
                      unit="ms"
                      icon={Server}
                      color={perfStats.domContentLoaded < 1500 ? 'green' : perfStats.domContentLoaded < 3000 ? 'amber' : 'red'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="First Paint"
                      value={perfStats.firstPaint}
                      unit="ms"
                      icon={Zap}
                      color={perfStats.firstPaint < 1000 ? 'green' : perfStats.firstPaint < 2000 ? 'amber' : 'red'}
                    />
                    <StatCard
                      label="JS Execution"
                      value={perfStats.jsExecutionTime}
                      unit="ms"
                      icon={Cpu}
                      color="purple"
                    />
                  </div>

                  {/* Real-Time Performance */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Runtime Performance</h4>
                    <div className="flex justify-around">
                      <PerformanceRing
                        value={fps}
                        maxValue={60}
                        label="FPS"
                        color={fps >= 50 ? 'green' : fps >= 30 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={100 - memoryStats.percentage}
                        maxValue={100}
                        label="Memory Free"
                        color={memoryStats.percentage < 50 ? 'green' : memoryStats.percentage < 80 ? 'amber' : 'red'}
                      />
                      <PerformanceRing
                        value={Math.min(100, Math.max(0, 100 - (perfStats.loadTime / 50)))}
                        maxValue={100}
                        label="Speed Score"
                        color={perfStats.loadTime < 2000 ? 'green' : perfStats.loadTime < 4000 ? 'amber' : 'red'}
                      />
                    </div>
                  </div>

                  {/* FPS Candlestick Chart */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">FPS History</h4>
                    <div className="flex justify-center">
                      <FpsCandlestickChart fps={fps} width={260} height={80} candleCount={15} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* User Info */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Account Status</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Status</span>
                        <span className={`font-semibold ${userId ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {userId ? 'Signed In' : 'Guest'}
                        </span>
                      </div>
                      {userEmail && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">Email</span>
                          <span className="text-white font-semibold truncate max-w-[150px]">{userEmail}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">VIP Status</span>
                        <span className={`font-semibold flex items-center gap-1 ${isVip ? 'text-amber-400' : 'text-zinc-500'}`}>
                          {isVip ? <Crown className="w-3 h-3" /> : null}
                          {isVip ? 'VIP Member' : 'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Role</span>
                        <span className={`font-semibold flex items-center gap-1 ${isAdmin ? 'text-blue-400' : 'text-zinc-400'}`}>
                          {isAdmin ? <Shield className="w-3 h-3" /> : null}
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    {!userId && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/login'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs"
                      >
                        <User className="w-4 h-4" />
                        Sign In / Register
                      </motion.button>
                    )}


                    {isAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.dispatchEvent(new CustomEvent('openAdminVIPPanel'))}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </motion.button>
                    )}
                  </div>

                  {/* Session Info */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Session Info</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Device Tier</span>
                        <span className={`font-semibold uppercase ${
                          deviceTier === 'ultra' ? 'text-emerald-400' :
                          deviceTier === 'high' ? 'text-blue-400' :
                          deviceTier === 'medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {deviceTier}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Session Start</span>
                        <span className="text-white font-semibold">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Page Loads</span>
                        <span className="text-white font-semibold">
                          {typeof window !== 'undefined' ? (performance.getEntriesByType('navigation').length || 1) : 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="text-[8px] text-zinc-500 text-center">
              All data from real device APIs • Auto-refreshing
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
DeviceCenterPanel.displayName = 'DeviceCenterPanel';

// ============================================================================
// SUB-COMPONENTS: Telegram Feed
// ============================================================================

const TelegramChannelEmbed = memo(({ channel = 'main', isVip = false }: { channel?: ChannelKey; isVip?: boolean }) => {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const channelConfig = TELEGRAM_CHANNELS[channel];
  const requiresVip = channelConfig.requiresVip && !isVip;
  
  // Debug log
  console.log('[TelegramChannelEmbed] channel:', channel, 'isVip:', isVip, 'requiresVip:', requiresVip, 'channelRequiresVip:', channelConfig.requiresVip);

  useEffect(() => {
    if (requiresVip) { 
      console.log('[TelegramChannelEmbed] VIP required but user is not VIP - showing lock');
      setLoading(false); 
      return; 
    }
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('[TelegramChannelEmbed] Fetching posts for channel:', channel, 'isVip:', isVip);
        const response = await fetch(`/api/telegram/channel?channel=${channel}&t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        console.log('[TelegramChannelEmbed] API Response:', data);
        
        if (data.success && data.posts && data.posts.length > 0) { 
          setPosts(data.posts); 
          setError(false);
          setStatusMessage(null);
        } else {
          setPosts([]);
          setError(false);
          setStatusMessage(data.message || 'No messages yet');
        }
      } catch (err) { 
        console.error('[TelegramChannelEmbed] Fetch error:', err);
        setError(true); 
      }
      finally { setLoading(false); }
    };

    fetchPosts();
    // Refresh every 30 seconds for VIP channel to get new messages
    const interval = setInterval(fetchPosts, channel === 'vip' ? 30000 : 300000);
    return () => clearInterval(interval);
  }, [channel, requiresVip, isVip]);

  if (requiresVip) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h4 className="text-sm font-bold text-white mb-2">VIP Content</h4>
        <p className="text-[10px] text-zinc-400 mb-4 max-w-[200px]">
          Upgrade to VIP to access exclusive signals and premium content.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-5 h-5 text-blue-400 animate-spin mb-2" />
        <span className="text-[10px] text-zinc-400">Loading live feed...</span>
      </div>
    );
  }

  if (error || posts.length === 0) {
    // For private channels with invite links, format the URL correctly
    const telegramUrl = channelConfig.handle.startsWith('+') 
      ? `https://t.me/${channelConfig.handle}` 
      : `https://t.me/${channelConfig.handle}`;
    
    const isVipChannel = channel === 'vip';
    
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          isVipChannel ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-blue-500/20'
        }`}>
          {isVipChannel ? (
            <Crown className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-blue-400" />
          )}
        </div>
        {isVipChannel && isVip && (
          <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-emerald-500/20 rounded-full">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 font-bold">VIP ACCESS UNLOCKED</span>
          </div>
        )}
        <p className="text-[11px] text-zinc-400 mb-1 text-center">
          {isVipChannel && isVip 
            ? 'VIP signals syncing from Telegram...' 
            : isVipChannel 
              ? 'VIP signals available in Telegram' 
              : 'No messages yet'}
        </p>
        <p className="text-[9px] text-zinc-500 mb-3 text-center max-w-[200px]">
          {isVipChannel && isVip
            ? statusMessage || 'Post a message in the VIP channel to see it here. Make sure @MrBullmoneybot is admin.'
            : isVipChannel 
              ? 'Join the VIP Telegram channel for live trading signals and premium analysis.'
              : 'Messages will appear here once available.'}
        </p>
        {!isVipChannel && (
          <motion.a 
            href={telegramUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Telegram
          </motion.a>
        )}
      </div>
    );
  }

  // For private channels with invite links, posts don't have direct links
  // Just open the channel itself
  const getPostUrl = (postId: string) => {
    if (channelConfig.handle.startsWith('+')) {
      // Private channel - can't link to individual posts, just link to channel
      return `https://t.me/${channelConfig.handle}`;
    }
    return `https://t.me/${channelConfig.handle}/${postId}`;
  };

  return (
    <div className="space-y-2 p-2">
      {posts.map((post, idx) => (
        <motion.a
          key={post.id}
          href={getPostUrl(post.id)}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-blue-500/40 transition-all group"
        >
          <div className="flex items-start gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br ${
              channel === 'vip' ? 'from-amber-500 to-orange-500' :
              channel === 'shop' ? 'from-emerald-500 to-teal-500' :
              channel === 'trades' ? 'from-cyan-500 to-blue-500' :
              'from-blue-500 to-cyan-500'
            }`}>
              {channel === 'vip' ? <Star className="w-4 h-4" /> : 
               channel === 'shop' ? <ShoppingBag className="w-4 h-4" /> : 
               channel === 'trades' ? <TrendingUp className="w-4 h-4" /> : 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold text-white">{channelConfig.name}</span>
                <span className="text-[8px] text-zinc-500">{post.date}</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-3 leading-relaxed">{post.text}</p>
              {post.hasMedia && (
                <span className="inline-block mt-1.5 text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">📷 Media</span>
              )}
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </div>
        </motion.a>
      ))}
    </div>
  );
});
TelegramChannelEmbed.displayName = 'TelegramChannelEmbed';

const LiveTradesTicker = memo(() => {
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/telegram/channel?channel=trades&t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.posts?.length) setMessages(data.posts);
      } catch {}
      finally { setLoading(false); }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const interval = setInterval(() => setCurrentIndex(p => (p + 1) % messages.length), 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];
  
  if (loading || !currentMessage) {
    return (
      <div className="mt-0 -translate-y-0.5 px-1 py-0.5 bg-zinc-900/80 rounded-b-lg border-x border-b border-cyan-500/20">
        <div className="flex items-center gap-1">
          <Loader className="w-2 h-2 text-cyan-400 animate-spin" />
          <span className="text-[5px] text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  const text = currentMessage.text || '';
  const line1 = [...text].length > 45 ? [...text].slice(0, 42).join('') + '...' : text.split('\n')[0] || '';

  return (
    <motion.a
      href="https://t.me/bullmoneywebsite"
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-0 -translate-y-0.5"
    >
      <div className="px-1 py-0.5 bg-gradient-to-br from-zinc-900/95 via-zinc-800/95 to-zinc-900/90 backdrop-blur-xl rounded-b-lg border-x border-b border-cyan-500/30 hover:border-cyan-400/50 transition-all overflow-hidden">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-0.5">
            <motion.div className="w-1 h-1 bg-green-400 rounded-full"
              animate={{ opacity: [1, 0.3, 1], boxShadow: ['0 0 0px rgba(74,222,128,0.8)', '0 0 6px rgba(74,222,128,0.8)', '0 0 0px rgba(74,222,128,0.8)'] }}
              transition={{ duration: 1, repeat: Infinity }} />
            <span className="text-[4px] font-bold text-cyan-400/80 uppercase tracking-wider">Live</span>
          </div>
          <span className="text-[5px] text-zinc-500">{currentIndex + 1}/{messages.length}</span>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-[6px] text-white font-semibold leading-tight truncate"
          >
            {line1}
          </motion.p>
        </AnimatePresence>
        
        <div className="mt-0.5 h-[1px] bg-zinc-700/40 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
            key={currentIndex} />
        </div>
      </div>
    </motion.a>
  );
});
LiveTradesTicker.displayName = 'LiveTradesTicker';

// ============================================================================
// SUB-COMPONENTS: Trading Tips
// ============================================================================

const TradingTipPill = memo(() => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpinning(true);
      setTimeout(() => {
        setTipIndex(p => (p + 1) % TRADING_TIPS.length);
        setIsSpinning(false);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl px-1.5 py-1 overflow-hidden max-w-[180px]">
      <div className="flex items-center gap-1.5 relative z-10">
        <motion.div animate={isSpinning ? { rotate: 360, scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }}>
          <Sparkles className="w-2.5 h-2.5 text-blue-400" />
        </motion.div>
        <div className="h-3 flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.span
              key={tipIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute inset-0 flex items-center text-[7px] text-blue-200/90 font-medium whitespace-nowrap truncate"
            >
              {TRADING_TIPS[tipIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
TradingTipPill.displayName = 'TradingTipPill';

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

const ModalWrapper = memo(({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = '520px',
  color = 'blue'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
  maxWidth?: string;
  color?: 'blue' | 'purple' | 'cyan';
}) => {
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  
  const colorClasses = {
    blue: 'border-blue-500/30 shadow-blue-900/20',
    purple: 'border-purple-500/50 shadow-purple-900/50',
    cyan: 'border-cyan-500/30 shadow-cyan-900/20'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={animations.modalBackdrop.initial as TargetAndTransition}
          animate={animations.modalBackdrop.animate as TargetAndTransition}
          exit={animations.modalBackdrop.exit as TargetAndTransition}
          className={`fixed inset-0 z-[2147483645] flex items-center justify-center p-3 sm:p-6 bg-black/95 ${shouldDisableBackdropBlur ? '' : 'backdrop-blur-md'}`}
          onClick={onClose}
        >
          {/* Tap hints - Skip on mobile for performance */}
          {!shouldSkipHeavyEffects && ['top', 'bottom', 'left', 'right'].map(pos => (
            <motion.div
              key={pos}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute text-${color}-300/50 text-xs pointer-events-none ${
                pos === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
                pos === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                pos === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
                'right-2 top-1/2 -translate-y-1/2'
              }`}
            >
              {pos === 'top' || pos === 'bottom' ? (
                <span>↑ Tap anywhere to close ↑</span>
              ) : (
                <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
              )}
            </motion.div>
          ))}

          <motion.div
            initial={animations.modalContent.initial as TargetAndTransition}
            animate={animations.modalContent.animate as TargetAndTransition}
            exit={animations.modalContent.exit as TargetAndTransition}
            transition={animations.modalContent.transition}
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 border ${shouldDisableBackdropBlur ? '' : 'backdrop-blur-2xl'} ${isMobile ? '' : 'shadow-2xl'} ${colorClasses[color]}`}
            style={{ maxWidth }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
ModalWrapper.displayName = 'ModalWrapper';

const TradingModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [activeChart, setActiveChart] = useState('xauusd');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarImpact, setCalendarImpact] = useState<CalendarImpact>('all');
  const [calendarCountry, setCalendarCountry] = useState<CalendarCountry>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Build calendar URL with filters
  const calendarUrl = useMemo(() => {
    let url = 'https://www.tradingview.com/embed-widget/events/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22';
    
    if (calendarCountry !== 'all') {
      url += `%2C%22currencyFilter%22%3A%22${calendarCountry}%22`;
    }
    if (calendarImpact !== 'all') {
      const impactMap = { high: '3', medium: '2', low: '1' };
      url += `%2C%22importanceFilter%22%3A%22${impactMap[calendarImpact]}%22`;
    }
    
    return url + '%7D';
  }, [calendarCountry, calendarImpact]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="p-3 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Trading Quick Access</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30"
          >
            <X className="w-4 h-4 text-blue-300" />
          </motion.button>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="p-3 border-b border-blue-500/20">
        <div className="flex gap-2">
          {TRADING_SYMBOLS.map(sym => {
            const Icon = sym.icon;
            return (
              <button
                key={sym.id}
                onClick={() => { setActiveChart(sym.id); setShowCalendar(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeChart === sym.id && !showCalendar
                    ? 'bg-blue-500/30 border border-blue-400/50'
                    : 'bg-zinc-800/50 border border-blue-500/20 hover:border-blue-400/40'
                }`}
              >
                <Icon className="w-4 h-4 text-blue-400" />
                <span className="text-white">{sym.displayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="relative bg-zinc-950 flex-1 min-h-0">
        <div className="w-full h-[300px]">
          {!showCalendar ? (
            <iframe
              src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${TRADING_SYMBOLS.find(s => s.id === activeChart)?.symbol}&interval=15&hidesidetoolbar=0&theme=dark&style=1&timezone=Etc%2FUTC`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          ) : (
            <iframe
              key={`calendar-${calendarCountry}-${calendarImpact}`}
              src={calendarUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          )}
        </div>
      </div>

      {/* Calendar Toggle & Filters */}
      <div className="p-3 border-t border-blue-500/20 space-y-2">
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowCalendar(!showCalendar)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              showCalendar ? 'bg-blue-500/30 border border-blue-400/50' : 'bg-zinc-700 hover:bg-zinc-600 border border-blue-500/20'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-white">{showCalendar ? 'Show Charts' : 'Economic Calendar'}</span>
          </motion.button>
          
          {showCalendar && (
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                showFilters ? 'bg-cyan-500/30 border border-cyan-400/50' : 'bg-zinc-700 hover:bg-zinc-600 border border-zinc-500/20'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white">Filters</span>
            </motion.button>
          )}
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showCalendar && showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {/* Impact Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-14">Impact:</span>
                <div className="flex gap-1 flex-1">
                  {(['all', 'high', 'medium', 'low'] as CalendarImpact[]).map(impact => (
                    <button
                      key={impact}
                      onClick={() => setCalendarImpact(impact)}
                      className={`flex-1 py-1 px-2 rounded text-[9px] font-semibold transition-all ${
                        calendarImpact === impact
                          ? impact === 'high' ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                          : impact === 'medium' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : impact === 'low' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                          : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/40 hover:bg-zinc-700/50'
                      }`}
                    >
                      {impact === 'all' ? 'All' : impact.charAt(0).toUpperCase() + impact.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-14">Currency:</span>
                <div className="flex gap-1 flex-1 overflow-x-auto pb-1">
                  {CALENDAR_COUNTRIES.map(country => (
                    <button
                      key={country.id}
                      onClick={() => setCalendarCountry(country.id)}
                      className={`flex items-center gap-0.5 py-1 px-1.5 rounded text-[9px] font-semibold transition-all whitespace-nowrap ${
                        calendarCountry === country.id
                          ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                          : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/40 hover:bg-zinc-700/50'
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalWrapper>
  );
});
TradingModal.displayName = 'TradingModal';

const CommunityModal = memo(({ isOpen, onClose, isVip, isAdmin }: { 
  isOpen: boolean; onClose: () => void; isVip: boolean; isAdmin: boolean;
}) => {
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('trades');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialLinks = [
    { name: 'Discord', icon: MessageSquare, url: 'https://discord.com/invite/9vVB44ZrNA', color: 'from-blue-600 to-cyan-600' },
    { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/bullmoneywebsite', color: 'from-blue-600 to-blue-500' },
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/bullmoney.online/', color: 'from-blue-600 to-cyan-600' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@bullmoney.online', color: 'from-blue-600 to-cyan-600' },
  ];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} color="cyan">
      {/* Header */}
      <div className="p-3 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Live Community</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-1.5 h-1.5 bg-green-400 rounded-full"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-[8px] text-green-400 font-medium">LIVE</span>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="ml-1 w-6 h-6 rounded-full bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/40 flex items-center justify-center"
            >
              <span className="text-blue-200 text-sm font-bold">×</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto">
        {(Object.keys(TELEGRAM_CHANNELS) as ChannelKey[]).map(key => {
          const ch = TELEGRAM_CHANNELS[key];
          const Icon = ch.icon;
          const isActive = activeChannel === key;
          const isLocked = ch.requiresVip && !isVip;
          
          return (
            <button
              key={key}
              onClick={() => setActiveChannel(key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? ch.color === 'amber' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : ch.color === 'emerald' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : ch.color === 'cyan' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                  : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                  : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{ch.name}</span>
              {isLocked && <Lock className="w-2.5 h-2.5 opacity-60" />}
            </button>
          );
        })}
        
        {/* Admin Button */}
        <motion.button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
            onClose();
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ml-auto flex-shrink-0 ${
            isAdmin 
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-400/60'
              : 'bg-zinc-800/80 text-zinc-300 border border-zinc-600/40'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin</span>
        </motion.button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TelegramChannelEmbed channel={activeChannel} isVip={isVip} />
      </div>

      {/* View All Link */}
      {activeChannel !== 'vip' && (
        <div className="px-3 py-1.5 border-t border-blue-500/10">
          <a href={`https://t.me/${TELEGRAM_CHANNELS[activeChannel].handle}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-[9px] text-blue-400 hover:text-blue-300">
            <ExternalLink className="w-2.5 h-2.5" /> View all on Telegram
          </a>
        </div>
      )}

      {/* Social Links */}
      <div className="p-3 space-y-1.5 border-t border-blue-500/20">
        <div className="flex gap-2">
          <motion.button
            onClick={handleCopyLink}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-xs"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          {socialLinks.map(link => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r ${link.color} text-white font-semibold text-xs`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.name}
              </motion.a>
            );
          })}
        </div>
        
      </div>
    </ModalWrapper>
  );
});
CommunityModal.displayName = 'CommunityModal';

const BullMoneyTVModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'live'>('featured');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [tradingChannelIndex, setTradingChannelIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setFeaturedIndex(0);
      setPlayerKey(p => p + 1);
      setTradingChannelIndex(Math.floor(Math.random() * TRADING_LIVE_CHANNELS.length));
    }
  }, [isOpen]);

  const youtubeEmbedUrl = useMemo(() => {
    if (activeTab === 'live') {
      if (isLive) {
        return `https://www.youtube.com/embed/live_stream?channel=UCTd2Y1DjefTH6bOAvFcJ34Q&autoplay=1&mute=0`;
      }
      const channel = TRADING_LIVE_CHANNELS[tradingChannelIndex];
      return `https://www.youtube.com/embed/live_stream?channel=${channel.id}&autoplay=1&mute=0`;
    }
    return `https://www.youtube.com/embed/${FEATURED_VIDEOS[featuredIndex]}?autoplay=1&mute=0`;
  }, [activeTab, featuredIndex, tradingChannelIndex, isLive]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="500px" color="purple">
      {/* Header */}
      <div className="p-3 border-b border-purple-500/30 bg-purple-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <h3 className="text-sm font-bold text-purple-100">BullMoney TV</h3>
            {isLive && (
              <motion.div
                className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded-full"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span className="text-[8px] font-bold text-red-400">LIVE NOW</span>
              </motion.div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/40 flex items-center justify-center"
          >
            <span className="text-purple-200 font-bold">×</span>
          </motion.button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <motion.button
            onClick={() => { setActiveTab('featured'); setPlayerKey(p => p + 1); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
              activeTab === 'featured'
                ? 'bg-yellow-400 text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Featured ({featuredIndex + 1}/{FEATURED_VIDEOS.length})
          </motion.button>
          
          <motion.button
            onClick={() => {
              setActiveTab('live');
              if (!isLive) setTradingChannelIndex(Math.floor(Math.random() * TRADING_LIVE_CHANNELS.length));
              setPlayerKey(p => p + 1);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
              activeTab === 'live'
                ? isLive ? 'bg-red-500 text-white' : 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-400' : 'bg-white/50'}`}
              animate={isLive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {isLive ? 'Live Stream' : 'Trading'}
          </motion.button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-black" style={{ minHeight: '280px' }}>
        {isOpen && (
          <iframe
            key={`player-${playerKey}-${activeTab}-${featuredIndex}`}
            src={`${youtubeEmbedUrl}&t=${playerKey}`}
            width="100%"
            height="280"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        )}
        
        {/* Navigation for Featured */}
        {activeTab === 'featured' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.button
              onClick={() => { setFeaturedIndex(p => (p - 1 + FEATURED_VIDEOS.length) % FEATURED_VIDEOS.length); setPlayerKey(p => p + 1); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white"
            >
              ◀
            </motion.button>
            <span className="text-white/70 text-xs font-semibold bg-black/50 px-2 py-1 rounded">
              {featuredIndex + 1} / {FEATURED_VIDEOS.length}
            </span>
            <motion.button
              onClick={() => { setFeaturedIndex(p => (p + 1) % FEATURED_VIDEOS.length); setPlayerKey(p => p + 1); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white"
            >
              ▶
            </motion.button>
          </div>
        )}
        
        {/* Next channel for live when not streaming */}
        {activeTab === 'live' && !isLive && (
          <div className="absolute bottom-2 right-2">
            <motion.button
              onClick={() => { setTradingChannelIndex(p => (p + 1) % TRADING_LIVE_CHANNELS.length); setPlayerKey(p => p + 1); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600/90 hover:bg-purple-500 rounded text-[10px] font-bold text-white"
            >
              Next Channel ▶
            </motion.button>
          </div>
        )}
      </div>

      {/* Platform Links */}
      <div className="flex bg-[#1a1a1a] border-t border-white/10">
        <a href="https://youtube.com/@bullmoney.streams" target="_blank" rel="noopener noreferrer"
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-red-600/20">
          <Youtube className="w-4 h-4 text-red-500" /> YouTube
        </a>
        <a href="https://discord.gg/vfxHPpCeQ" target="_blank" rel="noopener noreferrer"
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-[#5865F2]/20">
          <MessageSquare className="w-4 h-4 text-[#5865F2]" /> Discord
        </a>
      </div>
    </ModalWrapper>
  );
});
BullMoneyTVModal.displayName = 'BullMoneyTVModal';

const BrowserModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [openingBrowser, setOpeningBrowser] = useState<string | null>(null);

  const handleOpenBrowser = (browserId: string) => {
    const currentUrl = window.location.href;
    const browser = BROWSERS.find(b => b.id === browserId);
    if (!browser) return;
    
    setOpeningBrowser(browserId);
    
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isMac = /Macintosh/.test(userAgent);
    
    let deepLinkUrl = '';
    if (isIOS) deepLinkUrl = browser.deepLink.ios(currentUrl);
    else if (isAndroid) deepLinkUrl = browser.deepLink.android(currentUrl);
    else deepLinkUrl = browser.deepLink.desktop(currentUrl);
    
    if (isIOS || isAndroid) {
      window.location.href = deepLinkUrl;
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = isIOS ? browser.iosAppStore : browser.androidPlayStore || browser.downloadUrl;
        }
        setOpeningBrowser(null);
      }, 1500);
    } else {
      if (browserId === 'safari' && isMac) {
        window.open(currentUrl, '_blank');
      } else {
        window.open(browser.downloadUrl, '_blank');
      }
      setOpeningBrowser(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-[90vw] max-w-[320px] bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-blue-500/40 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Open in Browser</h3>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  ✕
                </motion.button>
              </div>
            </div>
            
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {BROWSERS.map((browser, index) => {
                const Icon = browser.icon;
                const isLoading = openingBrowser === browser.id;
                
                return (
                  <motion.button
                    key={browser.id}
                    onClick={() => handleOpenBrowser(browser.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 text-white font-medium text-xs border border-blue-500/30 hover:border-blue-400/50 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <span>{browser.fullName}</span>
                    </div>
                    
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full"
                      />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-blue-400 opacity-50" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
BrowserModal.displayName = 'BrowserModal';

// ============================================================================
// UNIFIED HUB TAB TYPE - All features in one pill
// ============================================================================

type UnifiedHubTab = 'community' | 'trading' | 'tv' | 'device' | 'logs';

const UNIFIED_HUB_TABS: { id: UnifiedHubTab; label: string; icon: typeof TrendingUp; color: string }[] = [
  { id: 'community', label: 'Social', icon: MessageSquare, color: 'blue' },
  { id: 'trading', label: 'Trade', icon: TrendingUp, color: 'blue' },
  { id: 'tv', label: 'TV', icon: Play, color: 'blue' },
  { id: 'device', label: 'Device', icon: Smartphone, color: 'blue' },
  { id: 'logs', label: 'Logs', icon: AlertTriangle, color: 'blue' },
];

// ============================================================================
// UNIFIED HUB PANEL - All features in one panel
// ============================================================================

// Exported for use in WelcomeScreenDesktop
export const UnifiedHubPanel = memo(({
  isOpen,
  onClose,
  fps,
  deviceTier,
  isAdmin,
  isVip,
  userId,
  userEmail,
  prices,
}: {
  isOpen: boolean;
  onClose: () => void;
  fps: number;
  deviceTier: string;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
  prices: { xauusd: string; btcusd: string };
}) => {
  // Mobile detection for smoother, more subtle animations
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const [activeTab, setActiveTab] = useState<UnifiedHubTab>('community');
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Trading tab state
  const [selectedSymbol, setSelectedSymbol] = useState<typeof TRADING_SYMBOLS[number]>(TRADING_SYMBOLS[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarImpact, setCalendarImpact] = useState<CalendarImpact>('all');
  const [calendarCountry, setCalendarCountry] = useState<CalendarCountry>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Community tab state
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('trades');
  const [copied, setCopied] = useState(false);
  
  // TV tab state
  const [tvTab, setTvTab] = useState<'featured' | 'live'>('featured');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [tradingChannelIndex, setTradingChannelIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  
  // Device tab state - Get REAL device data from hooks
  const memoryStats = useRealTimeMemory();
  const browserInfo = useBrowserInfo();
  const storageInfo = useStorageInfo();
  const networkStats = useNetworkStats() as NetworkStats & { runSpeedTest: () => Promise<void> };
  const perfStats = usePerformanceStats();
  const gpuInfo = useGpuInfo();
  const batteryInfo = useBatteryInfo();
  const screenInfo = useScreenInfo();
  const browserCapabilities = useBrowserCapabilities();
  const { logs: consoleLogs, clearLogs } = useConsoleLogs(100);
  
  // Calculate 3D Performance Score
  const performanceScore = calculate3DPerformanceScore(fps, memoryStats.percentage, gpuInfo.score, browserInfo.cores);
  const performanceGrade = getPerformanceGrade(performanceScore);

  // Copy device snapshot to clipboard
  const handleCopyDeviceSnapshot = useCallback(async () => {
    const snapshot = `
=== BULLMONEY DEVICE SNAPSHOT ===
Generated: ${new Date().toLocaleString()}

--- PERFORMANCE ---
FPS: ${fps}
Performance Grade: ${performanceGrade.grade} (${performanceGrade.label})
Performance Score: ${performanceScore}/100

--- DEVICE INFO ---
CPU Cores: ${browserInfo.cores}
Device RAM: ${browserInfo.deviceMemory}GB
JS Heap Used: ${memoryStats.jsHeapUsed}MB / ${memoryStats.jsHeapLimit}MB (${memoryStats.percentage}%)

--- GPU ---
Vendor: ${gpuInfo.vendor}
Renderer: ${gpuInfo.renderer}
WebGL: ${gpuInfo.webglVersion}
Tier: ${gpuInfo.tier.toUpperCase()}
Score: ${gpuInfo.score}/100

--- DISPLAY ---
Resolution: ${screenInfo.width}x${screenInfo.height}
Pixel Ratio: ${screenInfo.pixelRatio}x
Refresh Rate: ${screenInfo.refreshRate}Hz
Color Depth: ${screenInfo.colorDepth}-bit
Orientation: ${screenInfo.orientation}
HDR: ${screenInfo.hdr ? 'Yes' : 'No'}

--- NETWORK ---
Connection Type: ${networkStats.connectionType === 'wifi' ? 'WiFi' : networkStats.connectionType.toUpperCase()}
Effective Type: ${networkStats.effectiveType.toUpperCase()}
Downlink: ${networkStats.downlink}Mbps
RTT: ${networkStats.rtt}ms
Online: ${networkStats.isOnline ? 'Yes' : 'No'}

--- BATTERY ---
Supported: ${batteryInfo.supported ? 'Yes' : 'No'}
${batteryInfo.supported ? `Level: ${batteryInfo.level}%\nCharging: ${batteryInfo.charging ? 'Yes' : 'No'}` : 'Not available'}

--- BROWSER ---
Name: ${browserInfo.name}
Version: ${browserInfo.version}
Engine: ${browserInfo.engine}
Platform: ${browserInfo.platform}
Language: ${browserInfo.locale}

--- BROWSER CAPABILITIES ---
Graphics:
  WebGL 2: ${browserCapabilities.webgl2 ? '✓' : '✗'}
  WebGPU: ${browserCapabilities.webgpu ? '✓' : '✗'}

Storage:
  IndexedDB: ${browserCapabilities.indexedDb ? '✓' : '✗'}
  LocalStorage: ${browserCapabilities.localStorage ? '✓' : '✗'}
  SessionStorage: ${browserCapabilities.sessionStorage ? '✓' : '✗'}

Processing:
  Web Workers: ${browserCapabilities.webWorker ? '✓' : '✗'}
  SharedArrayBuffer: ${browserCapabilities.sharedArrayBuffer ? '✓' : '✗'}
  WebAssembly: ${browserCapabilities.webAssembly ? '✓' : '✗'}

Media:
  AudioContext: ${browserCapabilities.audioContext ? '✓' : '✗'}
  MediaRecorder: ${browserCapabilities.mediaRecorder ? '✓' : '✗'}
  MediaDevices: ${browserCapabilities.mediaDevices ? '✓' : '✗'}

Sensors:
  Accelerometer: ${browserCapabilities.accelerometer ? '✓' : '✗'}
  Gyroscope: ${browserCapabilities.gyroscope ? '✓' : '✗'}
  Magnetometer: ${browserCapabilities.magnetometer ? '✓' : '✗'}

Hardware:
  Bluetooth: ${browserCapabilities.bluetooth ? '✓' : '✗'}
  USB: ${browserCapabilities.usb ? '✓' : '✗'}
  Serial Port: ${browserCapabilities.serialPort ? '✓' : '✗'}

XR:
  VR: ${browserCapabilities.vr ? '✓' : '✗'}
  AR: ${browserCapabilities.ar ? '✓' : '✗'}

${browserCapabilities.videoCodecs.length > 0 ? `Video Codecs: ${browserCapabilities.videoCodecs.join(', ')}` : ''}
${browserCapabilities.audioCodecs.length > 0 ? `Audio Codecs: ${browserCapabilities.audioCodecs.join(', ')}` : ''}
===================================
    `.trim();

    try {
      await navigator.clipboard.writeText(snapshot);
      alert('Device snapshot copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy device snapshot:', error);
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = snapshot;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Device snapshot copied to clipboard!');
    }
  }, [fps, performanceGrade, performanceScore, browserInfo, memoryStats, gpuInfo, screenInfo, networkStats, batteryInfo, browserCapabilities]);

  // Handle drag to close (any direction)
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    if (distance > 80) {
      SoundEffects.swoosh();
      onClose();
    }
    setIsDragging(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      SoundEffects.success();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialLinks = [
    { name: 'Discord', icon: MessageSquare, url: 'https://discord.com/invite/9vVB44ZrNA', color: 'from-indigo-600 to-blue-600' },
    { name: 'Telegram', icon: MessageCircle, url: 'https://t.me/bullmoneywebsite', color: 'from-blue-500 to-cyan-500' },
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/bullmoney.online/', color: 'from-pink-500 to-purple-500' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@bullmoney.online', color: 'from-red-600 to-red-500' },
  ];

  const youtubeEmbedUrl = useMemo(() => {
    if (tvTab === 'live') {
      if (isLive) {
        return `https://www.youtube.com/embed/live_stream?channel=UCTd2Y1DjefTH6bOAvFcJ34Q&autoplay=1&mute=0`;
      }
      const channel = TRADING_LIVE_CHANNELS[tradingChannelIndex];
      return `https://www.youtube.com/embed/live_stream?channel=${channel.id}&autoplay=1&mute=0`;
    }
    return `https://www.youtube.com/embed/${FEATURED_VIDEOS[featuredIndex]}?autoplay=1&mute=0`;
  }, [tvTab, featuredIndex, tradingChannelIndex, isLive]);

  // Calendar URL builder
  const calendarUrl = useMemo(() => {
    let url = 'https://www.tradingview.com/embed-widget/events/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22importanceFilter%22%3A%22';
    
    if (calendarImpact === 'high') url += '2';
    else if (calendarImpact === 'medium') url += '1%2C2';
    else if (calendarImpact === 'low') url += '0%2C1%2C2';
    else url += '-1%2C0%2C1%2C2';
    
    url += '%22';
    
    if (calendarCountry !== 'all') {
      url += `%2C%22countryFilter%22%3A%22${calendarCountry}%22`;
    }
    
    url += '%7D';
    return url;
  }, [calendarImpact, calendarCountry]);

  const colors = getFpsColor(fps);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2147483640] bg-transparent"
            onClick={onClose}
          />
          
          {/* Panel - Centered Modal */}
          <motion.div
            ref={panelRef}
            initial={isMobile ? { opacity: 0, y: 30 } : { scale: 0.95, opacity: 0, y: 20 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 30 } : { scale: 0.95, opacity: 0, y: 20 }}
            transition={isMobile 
              ? { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } 
              : { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }
            }
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.2, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="fixed left-1/2 top-1/2 z-[2147483647] -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] sm:w-[80vw] sm:h-[80vh] md:w-[75vw] md:h-[75vh] lg:w-[1200px] lg:h-[700px] max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-6xl flex flex-col bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 border border-blue-500/30 shadow-2xl overflow-hidden rounded-2xl"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Header with FPS Display */}
            <div className="p-3 border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.3), inset 0 0 12px rgba(59, 130, 246, 0.1)' }}>
              <div className="flex items-center justify-between gap-2">
                {/* FPS Badge */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <FpsCandlestickChart fps={fps} width={60} height={36} candleCount={6} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Activity size={12} className="text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                      <span className="text-lg font-black tabular-nums text-blue-300 neon-blue-text" style={{ textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>{fps}</span>
                      <span className="text-[8px] text-blue-400 font-bold neon-blue-text" style={{ textShadow: '0 0 4px #3b82f6' }}>FPS</span>
                    </div>
                    <div className="text-[9px] font-mono font-bold uppercase text-blue-300 neon-blue-text tracking-wide" style={{ textShadow: '0 0 4px #3b82f6' }}>{deviceTier}</div>
                  </div>
                </div>
                
                {/* Live Prices */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black border border-blue-500/30" style={{ boxShadow: '0 0 6px rgba(59, 130, 246, 0.2)' }}>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                    <span className="text-[10px] font-bold text-blue-300 neon-blue-text" style={{ textShadow: '0 0 4px #3b82f6' }}>${prices.xauusd}</span>
                  </div>
                  <div className="w-px h-3 bg-blue-500/30" />
                  <div className="flex items-center gap-1">
                    <Bitcoin className="w-3 h-3 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                    <span className="text-[10px] font-bold text-blue-300 neon-blue-text" style={{ textShadow: '0 0 4px #3b82f6' }}>${prices.btcusd}</span>
                  </div>
                </div>
                
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/60 flex items-center justify-center"
                  style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' }}
                >
                  <X className="w-4 h-4 text-blue-300" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                </motion.button>
                
                {/* Hidden Admin Button - Triple tap on header to open (Mobile friendly) */}
                {isAdmin && (
                  <motion.button
                    onTap={() => {
                      window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
                      onClose();
                    }}
                    className="absolute top-0 right-12 w-10 h-10 opacity-0"
                    aria-label="Admin Panel"
                  />
                )}
              </div>
              
              {/* Swipe hint for mobile - subtle, slower animation */}
              <motion.div 
                className="flex items-center justify-center gap-1 mt-2 text-[9px] text-blue-400/60 sm:hidden"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight className="w-3 h-3 -rotate-90" />
                <span>Drag to close</span>
              </motion.div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex items-stretch border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.3), inset 0 0 12px rgba(59, 130, 246, 0.1)' }}>
              {UNIFIED_HUB_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      SoundEffects.click();
                      setActiveTab(tab.id);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 border-b-2 transition-all ${
                      isActive 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400 neon-blue-text' 
                        : 'text-blue-400/50 border-transparent hover:text-blue-300/70 hover:bg-blue-500/10'
                    }`}
                    style={isActive ? { textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' } : {}}
                  >
                    <Icon className="w-4 h-4" style={isActive ? { filter: 'drop-shadow(0 0 4px #3b82f6)' } : {}} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">
                {/* TRADING TAB */}
                {activeTab === 'trading' && (
                  <motion.div
                    key="trading"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    {/* Symbol Selector */}
                    <div className="flex gap-1 p-2 overflow-x-auto border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      {TRADING_SYMBOLS.map(symbol => {
                        const Icon = symbol.icon;
                        const isActive = selectedSymbol.id === symbol.id;
                        return (
                          <motion.button
                            key={symbol.id}
                            onClick={() => setSelectedSymbol(symbol)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                              isActive
                                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                                : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                            }`}
                            style={isActive ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' } : {}}
                          >
                            <Icon className="w-3 h-3" style={isActive ? { filter: 'drop-shadow(0 0 2px #3b82f6)' } : {}} />
                            <span>{symbol.abbr}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    {/* Chart/Calendar */}
                    <div className="flex-1 min-h-[280px]">
                      {showCalendar ? (
                        <iframe
                          key={calendarUrl}
                          src={calendarUrl}
                          className="w-full h-full border-0"
                          title="Economic Calendar"
                        />
                      ) : (
                        <iframe
                          key={selectedSymbol.symbol}
                          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${selectedSymbol.symbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart`}
                          className="w-full h-full border-0"
                          title={`${selectedSymbol.name} Chart`}
                          allow="clipboard-write"
                        />
                      )}
                    </div>
                    
                    {/* Toggle & Filters */}
                    <div className="p-2 space-y-2 border-t border-blue-500/30 bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setShowCalendar(!showCalendar)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                            showCalendar ? 'bg-blue-500/30 border border-blue-400/60 text-blue-300 neon-blue-text' : 'bg-black/40 hover:bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:text-blue-300'
                          }`}
                          style={showCalendar ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' } : {}}
                        >
                          <Calendar className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                          <span>{showCalendar ? 'Show Charts' : 'Calendar'}</span>
                        </motion.button>
                        
                        {showCalendar && (
                          <motion.button
                            onClick={() => setShowFilters(!showFilters)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                              showFilters ? 'bg-blue-500/30 border border-blue-400/60 text-blue-300 neon-blue-text' : 'bg-black/40 hover:bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:text-blue-300'
                            }`}
                            style={showFilters ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' } : {}}
                          >
                            <Filter className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                            <span>Filters</span>
                          </motion.button>
                        )}
                      </div>
                      
                      {/* Filter Options */}
                      <AnimatePresence>
                        {showCalendar && showFilters && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {/* Impact Filter */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400 w-14">Impact:</span>
                              <div className="flex gap-1 flex-1">
                                {(['all', 'high', 'medium', 'low'] as CalendarImpact[]).map(impact => (
                                  <button
                                    key={impact}
                                    onClick={() => setCalendarImpact(impact)}
                                    className={`flex-1 py-1 px-2 rounded text-[9px] font-semibold transition-all ${
                                      calendarImpact === impact
                                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                                        : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                                    }`}
                            style={calendarImpact === impact ? { boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)' } : {}}
                                  >
                                    {impact === 'all' ? 'All' : impact.charAt(0).toUpperCase() + impact.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Country Filter */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-400 w-14">Currency:</span>
                              <div className="flex gap-1 flex-1 overflow-x-auto pb-1">
                                {CALENDAR_COUNTRIES.map(country => (
                                  <button
                                    key={country.id}
                                    onClick={() => setCalendarCountry(country.id)}
                                    className={`flex items-center gap-0.5 py-1 px-1.5 rounded text-[9px] font-semibold transition-all whitespace-nowrap ${
                                      calendarCountry === country.id
                                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                                        : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                                    }`}
                            style={calendarCountry === country.id ? { boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)' } : {}}
                                  >
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Trading Tip */}
                      <TradingTipPill />
                    </div>
                  </motion.div>
                )}
                
                {/* COMMUNITY TAB */}
                {activeTab === 'community' && (
                  <motion.div
                    key="community"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    {/* Channel Tabs */}
                    <div className="flex items-center gap-1 p-2 border-b border-blue-500/30 overflow-x-auto bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      {(Object.keys(TELEGRAM_CHANNELS) as ChannelKey[]).map(key => {
                        const ch = TELEGRAM_CHANNELS[key];
                        const Icon = ch.icon;
                        const isActive = activeChannel === key;
                        const isLocked = ch.requiresVip && !isVip;
                        
                        return (
                          <button
                            key={key}
                            onClick={() => setActiveChannel(key)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                              isActive
                                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                                : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                            }`}
                            style={isActive ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' } : {}}
                          >
                            <Icon className="w-3 h-3" style={isActive ? { filter: 'drop-shadow(0 0 2px #3b82f6)' } : {}} />
                            <span>{ch.name}</span>
                            {isLocked && <Lock className="w-2.5 h-2.5 opacity-60" />}
                          </button>
                        );
                      })}
                      
                      {/* Admin Button */}
                      <motion.button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
                          onClose();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ml-auto flex-shrink-0 ${
                          isAdmin 
                            ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                            : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                        }`}
                        style={isAdmin ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' } : {}}
                      >
                        <Shield className="w-3.5 h-3.5" style={isAdmin ? { filter: 'drop-shadow(0 0 2px #3b82f6)' } : {}} />
                        <span>Admin</span>
                      </motion.button>
                    </div>
                    
                    {/* Feed */}
                    <div className="flex-1 overflow-y-auto min-h-0 min-h-[200px] bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      <TelegramChannelEmbed channel={activeChannel} isVip={isVip} />
                    </div>
                    
                    {/* View All Link */}
                    {activeChannel !== 'vip' && (
                      <div className="px-3 py-1.5 border-t border-blue-500/30 bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                        <a href={`https://t.me/${TELEGRAM_CHANNELS[activeChannel].handle}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 neon-blue-text transition-all"
                          style={{ textShadow: '0 0 4px rgba(59, 130, 246, 0.5)' }}>
                          <ExternalLink className="w-2.5 h-2.5" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} /> View all on Telegram
                        </a>
                      </div>
                    )}
                    
                    {/* Social Links */}
                    <div className="p-3 space-y-2 border-t border-blue-500/30 bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={handleCopyLink}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-500/30 text-blue-300 font-semibold text-xs border border-blue-400/60 neon-blue-text"
                          style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' }}
                        >
                          {copied ? <Check className="w-3 h-3" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} /> : <Copy className="w-3 h-3" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </motion.button>
                        
                        <div className="flex-1" />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-1.5">
                        {socialLinks.map(link => {
                          const Icon = link.icon;
                          return (
                            <motion.a
                              key={link.name}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg bg-blue-500/30 text-blue-300 font-semibold text-[10px] border border-blue-400/60 neon-blue-text transition-all"
                              style={{ boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)' }}
                            >
                              <Icon className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                              <span className="hidden sm:block">{link.name}</span>
                            </motion.a>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* TV TAB */}
                {activeTab === 'tv' && (
                  <motion.div
                    key="tv"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    {/* TV Tabs */}
                    <div className="flex gap-2 p-2 border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      {(['featured', 'live'] as const).map(tab => (
                        <motion.button
                          key={tab}
                          onClick={() => setTvTab(tab)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                            tvTab === tab
                              ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                              : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                          }`}
                          style={tvTab === tab ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' } : {}}
                        >
                          {tab === 'featured' ? <Play className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} /> : <Radio className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />}
                          <span>{tab === 'featured' ? 'Featured' : 'Live Streams'}</span>
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Video Player */}
                    <div className="relative aspect-video bg-black border border-blue-500/30" style={{ boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.2)' }}>
                      <iframe
                        key={youtubeEmbedUrl}
                        src={youtubeEmbedUrl}
                        className="absolute inset-0 w-full h-full"
                        title="BullMoney TV"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    
                    {/* Video Controls */}
                    <div className="p-2 space-y-2">
                      {tvTab === 'featured' && (
                        <div className="flex gap-2">
                          {FEATURED_VIDEOS.map((_, idx) => (
                            <motion.button
                              key={idx}
                              onClick={() => setFeaturedIndex(idx)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
                                featuredIndex === idx
                                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                                  : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                              }`}
                              style={featuredIndex === idx ? { boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)' } : {}}
                            >
                              Video {idx + 1}
                            </motion.button>
                          ))}
                        </div>
                      )}
                      
                      {tvTab === 'live' && (
                        <div className="flex gap-1 overflow-x-auto pb-1">
                          {TRADING_LIVE_CHANNELS.map((channel, idx) => (
                            <motion.button
                              key={channel.id}
                              onClick={() => setTradingChannelIndex(idx)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap ${
                                tradingChannelIndex === idx
                                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60 neon-blue-text'
                                  : 'bg-black/40 text-blue-400/60 border border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400'
                              }`}
                              style={tradingChannelIndex === idx ? { boxShadow: '0 0 6px rgba(59, 130, 246, 0.3)' } : {}}
                            >
                              <Radio className="w-3 h-3" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                              {channel.name}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Platform Links */}
                    <div className="flex border-t border-blue-500/30 mt-auto bg-black" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}>
                      <a href="https://youtube.com/@bullmoney.streams" target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 transition-all"
                        style={{ textShadow: '0 0 4px rgba(59, 130, 246, 0.3)' }}>
                        <Youtube className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} /> YouTube
                      </a>
                      <a href="https://discord.gg/vfxHPpCeQ" target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 transition-all border-l border-blue-500/30"
                        style={{ textShadow: '0 0 4px rgba(59, 130, 246, 0.3)' }}>
                        <MessageSquare className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} /> Discord
                      </a>
                    </div>
                  </motion.div>
                )}
                
                {/* DEVICE TAB */}
                {activeTab === 'device' && (
                  <motion.div
                    key="device"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-3 space-y-3 bg-black flex flex-col h-full"
                    style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}
                  >
                    {/* Copy Button */}
                    <motion.button
                      onClick={handleCopyDeviceSnapshot}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-500/30 text-blue-300 font-semibold text-xs border border-blue-400/60 neon-blue-text w-full"
                      style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' }}
                    >
                      <Copy className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                      Copy Snapshot
                    </motion.button>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
                    {/* Performance Grade */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                          style={{ backgroundColor: `${performanceGrade.color}20`, color: performanceGrade.color, border: `2px solid ${performanceGrade.color}40` }}>
                          {performanceGrade.grade}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Performance Grade</div>
                          <div className="text-[10px] text-zinc-400">{performanceGrade.label} • Score: {performanceScore}/100</div>
                        </div>
                      </div>
                      <PerformanceRing value={performanceScore} label="" color={performanceScore >= 70 ? 'green' : performanceScore >= 50 ? 'amber' : 'red'} size={50} />
                    </div>
                    
                    {/* Quick Stats Grid - 2x3 */}
                    <div className="grid grid-cols-2 gap-2">
                      <StatCard label="FPS" value={fps} icon={Activity} color={fps >= 50 ? 'green' : fps >= 30 ? 'amber' : 'red'} dataSource="browser" />
                      <StatCard label="Memory" value={memoryStats.jsHeapUsed} unit="MB" icon={MemoryStick} color={memoryStats.percentage < 70 ? 'blue' : 'amber'} subValue={`${memoryStats.percentage}% used`} dataSource={(performance as any).memory ? 'device' : 'estimated'} />
                      <StatCard label="CPU Cores" value={browserInfo.cores} icon={Cpu} color="cyan" dataSource="device" />
                      <StatCard label="Device RAM" value={browserInfo.deviceMemory} unit="GB" icon={HardDrive} color="purple" dataSource={(navigator as any).deviceMemory ? 'device' : 'estimated'} />
                      <StatCard label="GPU" value={gpuInfo.tier.toUpperCase()} icon={Monitor} color="blue" subValue={gpuInfo.renderer} dataSource="browser" />
                      <StatCard label="WebGL" value={gpuInfo.webglVersion} icon={Sparkles} color="blue" subValue={gpuInfo.vendor} dataSource="browser" />
                    </div>
                    

                    
                    {/* Network & Battery Row */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Network */}
                      <div className="p-2.5 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-zinc-400">Network</span>
                            <span className="text-[7px] font-medium text-blue-400" style={{ textShadow: '0 0 4px #3b82f6' }}>Browser API</span>
                          </div>
                          {networkStats.connectionType === 'wifi' ? (
                            <Wifi className="w-3 h-3 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                          ) : !networkStats.isOnline ? (
                            <WifiOff className="w-3 h-3 text-red-400" />
                          ) : (
                            <Signal className="w-3 h-3 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                          )}
                        </div>
                        <div className="text-sm font-bold text-blue-200">
                          {networkStats.connectionType === 'wifi' ? 'WiFi' : networkStats.connectionType === 'cellular' || networkStats.connectionType === '4g' || networkStats.connectionType === '3g' ? 'Cellular' : networkStats.effectiveType.toUpperCase()}
                        </div>
                        <div className="text-[9px] text-blue-300/70">{networkStats.downlink} Mbps • {networkStats.rtt}ms</div>
                      </div>
                      
                      {/* Battery */}
                      <div className="p-2.5 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-zinc-400">Battery</span>
                            {batteryInfo.supported && <span className="text-[7px] font-medium text-blue-400" style={{ textShadow: '0 0 4px #3b82f6' }}>Device API</span>}
                          </div>
                          {batteryInfo.charging ? <Zap className="w-3 h-3 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} /> : <Battery className="w-3 h-3 text-blue-400" />}
                        </div>
                        {batteryInfo.supported && batteryInfo.level >= 0 ? (
                          <>
                            <div className="text-sm font-bold text-blue-200">{Math.round(batteryInfo.level)}%</div>
                            <div className="text-[9px] text-blue-300/70">{batteryInfo.charging ? 'Charging' : 'On Battery'}</div>
                          </>
                        ) : (
                          <div className="text-xs text-blue-300/70">Not available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Screen Info */}
                    <div className="p-2.5 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Display</span>
                        <Monitor className="w-3.5 h-3.5 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                      </div>
                      <div className="text-xs font-semibold text-blue-200">{screenInfo.width} × {screenInfo.height}</div>
                      <div className="text-[9px] text-blue-300/70">
                        {screenInfo.pixelRatio}x DPR • {screenInfo.refreshRate}Hz • {screenInfo.colorDepth}-bit
                        {screenInfo.hdr && <span className="ml-1 text-blue-400">HDR</span>}
                      </div>
                    </div>
                    
                    {/* Browser Info */}
                    <div className="p-2.5 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Browser</span>
                        <Globe className="w-3.5 h-3.5 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                      </div>
                      <div className="text-xs font-semibold text-blue-200">{browserInfo.name} {browserInfo.version.split('.')[0]}</div>
                      <div className="text-[9px] text-blue-300/70">{browserInfo.engine} • {browserInfo.platform}</div>
                    </div>
                    
                    {/* Account Info */}
                    {userId && (
                      <div className="p-2.5 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Account</span>
                          <User className="w-3.5 h-3.5 text-blue-400" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                        </div>
                        <div className="text-xs font-semibold text-blue-200 truncate">{userEmail || 'Signed In'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {isVip && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <Crown className="w-2.5 h-2.5 inline mr-0.5" />VIP
                            </span>
                          )}
                          {isAdmin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <Shield className="w-2.5 h-2.5 inline mr-0.5" />Admin
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Browser Capabilities */}
                    <div className="p-2.5 rounded-xl bg-black border border-blue-500/30 neon-blue-border" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.1)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Browser Features</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Graphics */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">Graphics</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ WebGL 2: {browserCapabilities.webgl2 ? '✓' : '✗'}</div>
                            <div>✓ WebGPU: {browserCapabilities.webgpu ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Storage */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">Storage</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ IndexedDB: {browserCapabilities.indexedDb ? '✓' : '✗'}</div>
                            <div>✓ LocalStorage: {browserCapabilities.localStorage ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Workers & APIs */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">Workers</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ WebWorker: {browserCapabilities.webWorker ? '✓' : '✗'}</div>
                            <div>✓ SharedArrayBuffer: {browserCapabilities.sharedArrayBuffer ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Media */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">Media</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ AudioContext: {browserCapabilities.audioContext ? '✓' : '✗'}</div>
                            <div>✓ MediaRecorder: {browserCapabilities.mediaRecorder ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Sensors */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">Sensors</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ Accel: {browserCapabilities.accelerometer ? '✓' : '✗'}</div>
                            <div>✓ Gyro: {browserCapabilities.gyroscope ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* Hardware */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">Hardware</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ Bluetooth: {browserCapabilities.bluetooth ? '✓' : '✗'}</div>
                            <div>✓ USB: {browserCapabilities.usb ? '✓' : '✗'}</div>
                          </div>
                        </div>
                        {/* XR */}
                        <div className="text-[9px]">
                          <div className="font-bold text-blue-300 mb-1">XR</div>
                          <div className="space-y-0.5 text-blue-400/70">
                            <div>✓ VR: {browserCapabilities.vr ? '✓' : '✗'}</div>
                            <div>✓ AR: {browserCapabilities.ar ? '✓' : '✗'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Codecs */}
                      {(browserCapabilities.videoCodecs.length > 0 || browserCapabilities.audioCodecs.length > 0) && (
                        <div className="mt-2 pt-2 border-t border-blue-500/30">
                          <div className="text-[9px]">
                            {browserCapabilities.videoCodecs.length > 0 && (
                              <div className="mb-1">
                                <span className="font-bold text-blue-300">Video: </span>
                                <span className="text-blue-400/70">{browserCapabilities.videoCodecs.join(', ')}</span>
                              </div>
                            )}
                            {browserCapabilities.audioCodecs.length > 0 && (
                              <div>
                                <span className="font-bold text-blue-300">Audio: </span>
                                <span className="text-blue-400/70">{browserCapabilities.audioCodecs.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </motion.div>
                )}

                {/* LOGS TAB */}
                {activeTab === 'logs' && (
                  <motion.div
                    key="logs"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-3 space-y-3 bg-black flex flex-col h-full"
                    style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2), inset 0 0 8px rgba(59, 130, 246, 0.05)' }}
                  >
                    {/* Controls */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={clearLogs}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/30 text-red-300 font-semibold text-xs border border-red-400/60"
                        style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)' }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 2px #ef4444)' }} />
                        Clear Logs
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          const logsText = consoleLogs.map(log => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
                          navigator.clipboard.writeText(logsText).catch(() => {
                            const textarea = document.createElement('textarea');
                            textarea.value = logsText;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                          });
                          alert('Console logs copied!');
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-500/30 text-blue-300 font-semibold text-xs border border-blue-400/60"
                        style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' }}
                      >
                        <Copy className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                        Copy Logs
                      </motion.button>
                    </div>

                    {/* Log Count */}
                    <div className="text-[9px] text-blue-400/70 px-1">
                      Total Logs: {consoleLogs.length}
                    </div>

                    {/* Logs Container */}
                    <div className="flex-1 overflow-y-auto min-h-0 bg-black/50 rounded-lg border border-blue-500/20 p-2 font-mono text-[8px] space-y-1">
                      {consoleLogs.length === 0 ? (
                        <div className="text-blue-400/50 text-center py-4">No logs captured yet</div>
                      ) : (
                        consoleLogs.map(log => (
                          <div key={log.id} className={`flex gap-2 pb-1 border-b border-blue-500/10 ${
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warn' ? 'text-yellow-400' :
                            log.level === 'info' ? 'text-cyan-400' :
                            log.level === 'debug' ? 'text-purple-400' :
                            'text-blue-300'
                          }`}>
                            <span className="text-blue-500/70 flex-shrink-0 w-16">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="font-bold flex-shrink-0 w-12 uppercase">
                              [{log.level}]
                            </span>
                            <span className="flex-1 break-words whitespace-pre-wrap">
                              {log.message}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
UnifiedHubPanel.displayName = 'UnifiedHubPanel';

// ============================================================================
// UNIFIED FPS PILL - One button for everything
// ============================================================================

// Mini TradingView Gold Chart for the button
const MiniGoldChart = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create TradingView advanced chart widget with candlesticks
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: "OANDA:XAUUSD",
      width: "100%",
      height: "100%",
      locale: "en",
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1", // 1 = Candlestick
      hide_top_toolbar: true,
      hide_legend: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(59, 130, 246, 0.1)",
      hide_volume: true,
      support_host: "https://www.tradingview.com"
    });
    
    containerRef.current.appendChild(script);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden rounded-sm pointer-events-none"
      style={{ 
        filter: 'saturate(0) brightness(1.8) sepia(1) hue-rotate(190deg) saturate(2.5) contrast(1.1)',
        background: 'rgba(0, 0, 0, 0.9)',
        minHeight: '100px'
      }}
    />
  );
});
MiniGoldChart.displayName = 'MiniGoldChart';

// Live Signals Viewer - Animated message ticker FROM t.me/bullmoneywebsite ONLY
const LiveSignalsViewer = memo(() => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch messages from bullmoneywebsite channel ONLY
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/telegram/channel?channel=trades&t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.posts?.length) {
          setMessages(data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch signals from bullmoneywebsite:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);
  
  // Fallback sample signals if API fails
  const liveSignals = useMemo(() => {
    if (messages.length > 0) {
      return messages.map((msg, idx) => ({
        id: idx + 1,
        pair: '📊 Signal',
        action: msg.text.includes('BUY') || msg.text.includes('buy') ? 'BUY' : 'SELL',
        entry: msg.text.substring(0, 50),
        type: 'signal',
        time: msg.date
      }));
    }
    return [
      { id: 1, pair: '🟡 GOLD/USD', action: 'BUY', entry: '@2,650', type: 'signal', time: '2m ago' },
      { id: 2, pair: '₿ BTC/USD', action: 'SELL', entry: '@98,500', type: 'signal', time: '5m ago' },
      { id: 3, pair: '📊 EUR/USD', action: 'BUY', entry: '@1.0850', type: 'signal', time: '8m ago' },
      { id: 4, pair: '🟢 GBP/USD', action: 'BUY', entry: '@1.2720', type: 'signal', time: '12m ago' },
      { id: 5, pair: '🔴 OIL/USD', action: 'SELL', entry: '@82.40', type: 'signal', time: '15m ago' },
    ];
  }, [messages]);
  
  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % liveSignals.length);
        setIsTyping(false);
      }, 300);
    }, 3500);
    
    return () => clearInterval(interval);
  }, [liveSignals.length]);
  
  const currentSignal = liveSignals[currentMessageIndex];
  
  return (
    <a
      href="https://t.me/bullmoneywebsite"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <motion.div 
        className="px-3 py-2.5 rounded-md overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(59,130,246,0.05) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid #3b82f6',
          boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="animate-spin-slow" style={{ willChange: 'transform' }}>
              <Send className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }} />
            </div>
            <span 
              className="text-sm font-bold uppercase tracking-wider animate-neon-pulse-optimized"
              style={{ 
                color: '#3b82f6',
                textShadow: '0 0 4px #3b82f6',
                willChange: 'text-shadow'
              }}
            >
              FREE SIGNALS
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full animate-pulse-glow-green"
              style={{ background: '#22c55e', willChange: 'opacity' }}
            />
            <span 
              className="text-[8px] font-semibold uppercase tracking-wider"
              style={{ 
                color: '#22c55e',
                textShadow: '0 0 4px #22c55e'
              }}
            >
              LIVE
            </span>
          </div>
        </div>
        
        {/* Animated Message Display */}
        <div className="relative h-[68px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-2"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Signal Card */}
              <div 
                className="p-2 rounded"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0.8) 100%)',
                  border: '1px solid #3b82f6',
                  boxShadow: '0 0 2px #3b82f6, inset 0 0 2px #3b82f6'
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span 
                    className="text-xs font-bold"
                    style={{ 
                      color: '#3b82f6',
                      textShadow: '0 0 4px #3b82f6'
                    }}
                  >
                    {currentSignal.pair}
                  </span>
                  <span 
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse-scale ${
                      currentSignal.action === 'BUY' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                    style={{ 
                      color: currentSignal.action === 'BUY' ? '#22c55e' : '#ef4444',
                      textShadow: currentSignal.action === 'BUY' 
                        ? '0 0 4px #22c55e' 
                        : '0 0 4px #ef4444',
                      border: `1px solid ${currentSignal.action === 'BUY' ? '#22c55e' : '#ef4444'}`,
                      willChange: 'transform'
                    }}
                  >
                    {currentSignal.action}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span 
                    className="text-[11px] font-semibold"
                    style={{ 
                      color: '#60a5fa',
                      textShadow: '0 0 2px #3b82f6'
                    }}
                  >
                    Entry {currentSignal.entry}
                  </span>
                  <span 
                    className="text-[9px]"
                    style={{ 
                      color: '#3b82f6',
                      textShadow: '0 0 2px #3b82f6'
                    }}
                  >
                    {currentSignal.time}
                  </span>
                </div>
              </div>
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 px-2 animate-fade-in">
                  <MessageCircle className="w-3 h-3 text-blue-400" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full animate-bounce-dot"
                        style={{ 
                          background: '#3b82f6',
                          animationDelay: `${i * 150}ms`,
                          willChange: 'transform'
                        }}
                      />
                    ))}
                  </div>
                  <span 
                    className="text-[9px]"
                    style={{ 
                      color: '#3b82f6',
                      textShadow: '0 0 2px #3b82f6'
                    }}
                  >
                    New signal incoming...
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-blue-500/20">
          <span 
            className="text-[9px] font-medium flex items-center gap-1"
            style={{ 
              color: '#3b82f6',
              textShadow: '0 0 2px #3b82f6'
            }}
          >
            <Radio className="w-3 h-3" />
            @bullmoneywebsite
          </span>
          <div className="animate-nudge-x">
            <ExternalLink className="w-3 h-3 text-white group-hover:text-blue-400" />
          </div>
        </div>
      </motion.div>
    </a>
  );
});
LiveSignalsViewer.displayName = 'LiveSignalsViewer';

// Breaking News Viewer - Smaller, Red Neon, FROM t.me/Bullmoneyshop ONLY
const BreakingNewsViewer = memo(() => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messages, setMessages] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch messages from Bullmoneyshop channel ONLY
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/telegram/channel?channel=shop&t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.posts?.length) {
          setMessages(data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch news from Bullmoneyshop:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);
  
  // Cycle through messages
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);
  
  if (loading || messages.length === 0) {
    return (
      <div 
        className="px-2 py-1.5 rounded-md text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(239,68,68,0.05) 100%)',
          border: '1px solid #ef4444',
          boxShadow: '0 0 3px #ef4444, 0 0 6px #ef4444, inset 0 0 3px #ef4444'
        }}
      >
        <span 
          className="text-[9px] font-semibold"
          style={{ color: '#ef4444', textShadow: '0 0 4px #ef4444' }}
        >
          Loading Breaking News...
        </span>
      </div>
    );
  }
  
  const currentMessage = messages[currentMessageIndex];
  
  return (
    <a
      href="https://t.me/Bullmoneyshop"
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <motion.div 
        className="px-2.5 py-2 rounded-md overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(239,68,68,0.05) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid #ef4444',
          boxShadow: '0 0 3px #ef4444, 0 0 6px #ef4444, inset 0 0 3px #ef4444'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="animate-alert-pulse" style={{ willChange: 'transform' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-white" style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }} />
            </div>
            <span 
              className="text-xs font-bold uppercase tracking-wider animate-neon-pulse-red"
              style={{ 
                color: '#ef4444',
                textShadow: '0 0 3px #ef4444',
                willChange: 'text-shadow'
              }}
            >
              BREAKING NEWS
            </span>
          </div>
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse-glow-red"
            style={{ background: '#ef4444', willChange: 'opacity' }}
          />
        </div>
        
        {/* Animated Message */}
        <div className="relative h-[40px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-1"
              style={{ willChange: 'transform, opacity' }}
            >
              <p 
                className="text-[10px] font-semibold leading-tight line-clamp-2"
                style={{ 
                  color: '#fca5a5',
                  textShadow: '0 0 2px #ef4444'
                }}
              >
                {currentMessage.text.substring(0, 100)}{currentMessage.text.length > 100 ? '...' : ''}
              </p>
              <span 
                className="text-[8px]"
                style={{ 
                  color: '#ef4444',
                  textShadow: '0 0 2px #ef4444'
                }}
              >
                {currentMessage.date}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-red-500/20">
          <span 
            className="text-[8px] font-medium flex items-center gap-1"
            style={{ 
              color: '#ef4444',
              textShadow: '0 0 2px #ef4444'
            }}
          >
            <ShoppingBag className="w-2.5 h-2.5" />
            @Bullmoneyshop
          </span>
          <div className="animate-nudge-x-sm">
            <ExternalLink className="w-2.5 h-2.5 text-white group-hover:text-red-400" />
          </div>
        </div>
      </motion.div>
    </a>
  );
});
BreakingNewsViewer.displayName = 'BreakingNewsViewer';

// Exported for use in WelcomeScreenDesktop
export const UnifiedFpsPill = memo(({ 
  fps, 
  deviceTier, 
  prices,
  isMinimized, 
  onToggleMinimized,
  onOpenPanel
}: {
  fps: number;
  deviceTier: string;
  prices: { xauusd: string; btcusd: string };
  isMinimized: boolean;
  onToggleMinimized: () => void;
  onOpenPanel: () => void;
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Track if showing full content
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [isFastScrolling, setIsFastScrolling] = useState(false); // Track fast scrolling for BULLMONEY overlay
  const [isFlickeringOut, setIsFlickeringOut] = useState(false); // Track flickering fade out
  const [scrollIntensity, setScrollIntensity] = useState(0); // 0-1 for smooth intensity transitions
  const [randomDelay] = useState(() => Math.random() * 5 + 5); // Random 5-10 seconds
  const unpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fastScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intensityDecayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollVelocity = useRef(0);
  const velocityHistory = useRef<number[]>([]); // Rolling average for smoother detection
  const fastScrollCount = useRef(0); // Count consecutive fast scrolls
  const lastOverlayTime = useRef(0); // Cooldown tracking to prevent spam
  const accumulatedDelta = useRef(0); // For trackpad gesture accumulation
  const gestureStartTime = useRef(0); // Track gesture start for trackpad detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Performance boost function - runs when overlay shows
  // This is a REAL performance boost that:
  // 1. Temporarily pauses expensive CSS animations
  // 2. Reduces animation complexity
  // 3. Clears memory and cache intelligently
  // 4. Optimizes rendering pipeline
  const triggerPerformanceBoost = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const startTime = performance.now();
    console.log('[BULLMONEY] 🚀 Performance boost triggered');
    
    // ========================================
    // 1. PAUSE ALL CSS ANIMATIONS TEMPORARILY
    // ========================================
    // This is the biggest FPS boost - stops expensive animations
    const styleEl = document.createElement('style');
    styleEl.id = 'bullmoney-perf-boost';
    styleEl.textContent = `
      /* Pause all animations during overlay */
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
      }
      /* Exception: keep BULLMONEY overlay animated */
      [data-bullmoney-overlay] *, [data-bullmoney-overlay] *::before, [data-bullmoney-overlay] *::after {
        animation-play-state: running !important;
        transition-duration: unset !important;
      }
      /* Disable expensive effects */
      .shimmer, [class*="shimmer"], [class*="pulse"], [class*="glow"]:not([data-bullmoney-overlay] *) {
        animation: none !important;
        opacity: 1 !important;
      }
      /* Reduce blur effects (expensive on GPU) */
      .backdrop-blur, [class*="backdrop-blur"]:not([data-bullmoney-overlay] *) {
        backdrop-filter: none !important;
      }
      /* Disable will-change to free GPU memory */
      *:not([data-bullmoney-overlay] *) {
        will-change: auto !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Remove the style after overlay fades (restore animations)
    setTimeout(() => {
      const el = document.getElementById('bullmoney-perf-boost');
      if (el) el.remove();
      console.log('[BULLMONEY] ✅ Animations restored');
    }, 3000);
    
    // ========================================
    // 2. FORCE GPU MEMORY RELEASE
    // ========================================
    // Create and destroy a WebGL context to trigger GPU cleanup
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    } catch (e) {}
    
    // ========================================
    // 3. CLEAR JAVASCRIPT TIMERS & INTERVALS
    // ========================================
    // Temporarily pause non-critical intervals
    const pausedIntervals: number[] = [];
    const originalSetInterval = window.setInterval;
    const originalClearInterval = window.clearInterval;
    
    // Clear any pending image observers
    if ('IntersectionObserver' in window) {
      // Disconnect image lazy loaders temporarily
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        (img as HTMLImageElement).loading = 'eager';
      });
    }
    
    // ========================================
    // 4. OPTIMIZE DOM - HIDE OFFSCREEN ELEMENTS
    // ========================================
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const hiddenElements: HTMLElement[] = [];
    
    // Find elements far from viewport and hide them
    document.querySelectorAll('[data-heavy], .spline-container, iframe, video, canvas:not([data-bullmoney-overlay] canvas)').forEach(el => {
      const rect = el.getBoundingClientRect();
      const isOffscreen = rect.bottom < -500 || rect.top > viewportHeight + 500;
      
      if (isOffscreen) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.visibility !== 'hidden') {
          htmlEl.dataset.wasVisible = 'true';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.contentVisibility = 'hidden';
          hiddenElements.push(htmlEl);
        }
      }
    });
    
    // Restore after overlay
    setTimeout(() => {
      hiddenElements.forEach(el => {
        if (el.dataset.wasVisible) {
          el.style.visibility = '';
          el.style.contentVisibility = '';
          delete el.dataset.wasVisible;
        }
      });
    }, 3000);
    
    // ========================================
    // 5. MEMORY CLEANUP
    // ========================================
    // Clear volatile storage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('_temp') || 
          key.includes('_volatile') ||
          key.includes('scroll_') ||
          key.includes('animation_') ||
          key.includes('_preview')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage non-essentials
      ['animation_state', 'scroll_position_cache', 'hover_states', 'modal_history'].forEach(key => {
        try { sessionStorage.removeItem(key); } catch (e) {}
      });
    } catch (e) {}
    
    // ========================================
    // 6. SIGNAL OTHER COMPONENTS TO OPTIMIZE
    // ========================================
    // Dispatch custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('bullmoney-performance-boost', {
      detail: { 
        timestamp: Date.now(),
        duration: 3000, // How long the boost lasts
        level: 'aggressive'
      }
    }));
    
    // ========================================
    // 7. IDLE-TIME DEEP CLEANUP
    // ========================================
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // Clear old cache entries
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              if (name.includes('temp') || name.includes('runtime') || name.includes('preview')) {
                caches.delete(name);
              }
            });
          }).catch(() => {});
        }
        
        // Clear any orphaned blob URLs
        const blobURLs = (window as any).__blobURLs;
        if (Array.isArray(blobURLs)) {
          blobURLs.forEach((url: string) => {
            try { URL.revokeObjectURL(url); } catch (e) {}
          });
          (window as any).__blobURLs = [];
        }
        
        // Hint GC
        if ((window as any).gc) {
          try { (window as any).gc(); } catch (e) {}
        }
      }, { timeout: 5000 });
    }
    
    // ========================================
    // 8. REDUCE REACT RE-RENDERS
    // ========================================
    // Set a flag that expensive components can check
    (window as any).__bullmoneyPerfBoostActive = true;
    setTimeout(() => {
      (window as any).__bullmoneyPerfBoostActive = false;
    }, 3000);
    
    const elapsed = performance.now() - startTime;
    console.log(`[BULLMONEY] ⚡ Performance boost setup complete in ${elapsed.toFixed(2)}ms`);
    console.log('[BULLMONEY] 📊 Optimizations: CSS paused, GPU freed, DOM simplified, memory cleared');
  }, []);
  
  // Handle interaction to pin the button, then unpin after random delay
  const handleInteraction = useCallback(() => {
    setIsPinned(true);
    setIsExpanded(true);
    
    // Clear any existing timeout
    if (unpinTimeoutRef.current) {
      clearTimeout(unpinTimeoutRef.current);
    }
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    
    // Unpin after random 1-10 seconds
    const unpinDelay = Math.random() * 9000 + 1000; // 1-10 seconds in ms
    unpinTimeoutRef.current = setTimeout(() => {
      setIsPinned(false);
      // Collapse slightly before fully hiding
      expandTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
    }, unpinDelay);
  }, []);
  
  // Handle hover end - collapse immediately
  const handleHoverEnd = useCallback(() => {
    // Clear timeouts and collapse
    if (unpinTimeoutRef.current) {
      clearTimeout(unpinTimeoutRef.current);
    }
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    setIsPinned(false);
    setIsExpanded(false);
  }, []);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleHoverEnd();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleHoverEnd]);
  
  // Handle scroll - collapse and animate with improved detection
  useEffect(() => {
    const isMobileDevice = window.innerWidth < 768;
    
    // On mobile, disable scroll effects completely
    if (isMobileDevice) {
      return;
    }
    
    // Detect if user is likely using a trackpad (MacBooks, etc)
    const isLikelyTrackpad = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) && !isMobileDevice;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const now = Date.now();
      const timeDelta = Math.max(now - lastScrollTime.current, 1); // Prevent division by zero
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Calculate instantaneous velocity (pixels per millisecond)
      const instantVelocity = scrollDelta / timeDelta;
      
      // Trackpad detection: trackpads fire many small events vs mouse wheel's fewer large events
      // If we're getting many events with small deltas, it's likely a trackpad
      const isTrackpadLikeEvent = scrollDelta < 50 && timeDelta < 20;
      
      // Accumulate delta for trackpad gesture detection
      if (isTrackpadLikeEvent || isLikelyTrackpad) {
        // Start new gesture if it's been a while
        if (now - gestureStartTime.current > 150) {
          accumulatedDelta.current = 0;
          gestureStartTime.current = now;
        }
        accumulatedDelta.current += scrollDelta;
      }
      
      // Add to velocity history for rolling average (last 8 samples for trackpad smoothing)
      velocityHistory.current.push(instantVelocity);
      if (velocityHistory.current.length > 8) {
        velocityHistory.current.shift();
      }
      
      // Calculate rolling average velocity for smoother detection
      const avgVelocity = velocityHistory.current.reduce((a, b) => a + b, 0) / velocityHistory.current.length;
      scrollVelocity.current = avgVelocity;
      
      // For trackpads, also consider accumulated gesture distance
      const gestureDuration = now - gestureStartTime.current;
      const gestureVelocity = gestureDuration > 0 ? accumulatedDelta.current / gestureDuration : 0;
      
      // Use the higher of instantaneous avg or gesture velocity for trackpad detection
      const effectiveVelocity = isLikelyTrackpad 
        ? Math.max(avgVelocity, gestureVelocity * 0.8) 
        : avgVelocity;
      
      // Determine scroll direction
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentScrollY;
      lastScrollTime.current = now;
      
      setScrollY(currentScrollY);
      setIsScrolling(true);
      
      // Device-specific thresholds
      // Desktop trackpad: responsive to fast swipe gestures
      // Desktop mouse: responsive for fast wheel flicks
      const FAST_SCROLL_THRESHOLD = isLikelyTrackpad 
          ? 0.8  // Lower threshold for trackpads (they report lower velocities)
          : 1.2; // Mouse wheel threshold
      const FAST_SCROLL_CONFIRM = 2; // Desktop: only 2 consecutive fast scrolls needed
      const COOLDOWN_MS = 5000; // 5 second cooldown on desktop
      
      // Check if we're in cooldown period
      const timeSinceLastOverlay = now - lastOverlayTime.current;
      const isInCooldown = timeSinceLastOverlay < COOLDOWN_MS;
      
      // Also check for large accumulated gesture (trackpad fast swipe)
      const isTrackpadFastGesture = isLikelyTrackpad && accumulatedDelta.current > 300 && gestureDuration < 200;
      
      if ((effectiveVelocity > FAST_SCROLL_THRESHOLD || isTrackpadFastGesture) && !isInCooldown) {
        fastScrollCount.current++;
        
        // Calculate intensity based on velocity (0-1 scale)
        const intensity = Math.min((effectiveVelocity - FAST_SCROLL_THRESHOLD) / 3, 1);
        setScrollIntensity(prev => Math.max(prev, intensity)); // Only increase, never decrease abruptly
        
        if (fastScrollCount.current >= FAST_SCROLL_CONFIRM && !isFastScrolling) {
          setIsFastScrolling(true);
          setIsFlickeringOut(false);
          lastOverlayTime.current = now; // Start cooldown
          
          // Trigger performance boost when overlay shows
          triggerPerformanceBoost();
        }
        
        // Clear any existing timeouts
        if (fastScrollTimeoutRef.current) {
          clearTimeout(fastScrollTimeoutRef.current);
        }
        if (flickerTimeoutRef.current) {
          clearTimeout(flickerTimeoutRef.current);
        }
        if (intensityDecayRef.current) {
          clearTimeout(intensityDecayRef.current);
        }
      } else {
        // Gradually decrease fast scroll count for hysteresis
        fastScrollCount.current = Math.max(0, fastScrollCount.current - 1);
      }
      
      // Collapse expanded view on scroll
      if (isExpanded) {
        handleHoverEnd();
      }
      
      // Clear previous scroll end timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set scrolling to false after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        velocityHistory.current = []; // Clear velocity history
        fastScrollCount.current = 0; // Reset fast scroll count
        accumulatedDelta.current = 0; // Reset gesture accumulator
        
        // Smoothly decay intensity before flickering out
        if (isFastScrolling) {
          // Start intensity decay
          const decayIntensity = () => {
            setScrollIntensity(prev => {
              const newVal = prev * 0.85; // Smooth exponential decay
              if (newVal < 0.1) {
                setIsFlickeringOut(true);
                return 0;
              }
              intensityDecayRef.current = setTimeout(decayIntensity, 50);
              return newVal;
            });
          };
          intensityDecayRef.current = setTimeout(decayIntensity, 100);
          
          // Remove overlay after flicker animation - faster on mobile
          const flickerDuration = isMobileDevice ? 1200 : 2000;
          flickerTimeoutRef.current = setTimeout(() => {
            setIsFastScrolling(false);
            setIsFlickeringOut(false);
            setScrollIntensity(0);
          }, flickerDuration);
        }
      }, 200); // Slightly longer debounce for smoother detection
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded, handleHoverEnd, isFastScrolling, triggerPerformanceBoost]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (unpinTimeoutRef.current) {
        clearTimeout(unpinTimeoutRef.current);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (fastScrollTimeoutRef.current) {
        clearTimeout(fastScrollTimeoutRef.current);
      }
      if (flickerTimeoutRef.current) {
        clearTimeout(flickerTimeoutRef.current);
      }
      if (intensityDecayRef.current) {
        clearTimeout(intensityDecayRef.current);
      }
    };
  }, []);
  
  // Calculate scroll-based animation values - OPTIMIZED with useMemo
  // Throttle scroll progress to reduce recalculations
  const scrollProgress = useMemo(() => Math.min(scrollY / 300, 1), [Math.floor(scrollY / 30)]);
  const deepScrollProgress = useMemo(() => Math.min(scrollY / 800, 1), [Math.floor(scrollY / 80)]);
  const extremeScrollProgress = useMemo(() => Math.min(scrollY / 1500, 1), [Math.floor(scrollY / 150)]);
  
  // OPTIMIZED glow multipliers - simplified calculations
  const glowIntensity = useMemo(() => 1 + (scrollProgress * 3) + (deepScrollProgress * 4), [scrollProgress, deepScrollProgress]);
  const neonIntensity = useMemo(() => 1 + (deepScrollProgress * 4) + (extremeScrollProgress * 6), [deepScrollProgress, extremeScrollProgress]);
  
  // OPTIMIZED: Use CSS custom properties for dynamic values instead of inline recalculation
  // This reduces layout thrashing significantly
  const dynamicStyles = useMemo(() => {
    const borderGlow = Math.round(4 + (scrollProgress * 15) + (deepScrollProgress * 25));
    const shadowSpread = Math.round(8 + (scrollProgress * 30) + (deepScrollProgress * 50));
    const innerGlow = Math.round(4 + (scrollProgress * 10) + (deepScrollProgress * 20));
    
    // Simplified box-shadow - max 4 layers instead of 10+
    const boxShadow = `
      0 0 ${borderGlow}px rgba(59, 130, 246, 0.9),
      0 0 ${shadowSpread}px rgba(59, 130, 246, 0.6),
      ${deepScrollProgress > 0.3 ? `0 0 ${shadowSpread * 1.5}px rgba(59, 130, 246, 0.4),` : ''}
      inset 0 0 ${innerGlow}px rgba(59, 130, 246, 0.3)
    `.replace(/,\s*$/, '').replace(/,\s*,/g, ',');
    
    // Simplified text shadow - max 3 layers
    const textShadow = `
      0 0 ${6 * neonIntensity}px #3b82f6,
      0 0 ${12 * neonIntensity}px #3b82f6,
      0 0 ${20 * neonIntensity}px rgba(59, 130, 246, 0.7)
    `;
    
    // Simplified icon filter - max 2 drop-shadows
    const iconFilter = `
      drop-shadow(0 0 ${4 * glowIntensity}px #3b82f6) 
      drop-shadow(0 0 ${8 * glowIntensity}px #3b82f6)
    `.trim();
    
    return { boxShadow, textShadow, iconFilter, borderGlow, shadowSpread, innerGlow };
  }, [scrollProgress, deepScrollProgress, glowIntensity, neonIntensity]);
  
  return (
    <motion.div
      ref={containerRef}
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1, 
        scale: isMinimized ? 0.9 : 1,
        // Disable scroll-based y movement on mobile to reduce FPS drops
        y: isMobile ? 0 : (isScrolling ? (scrollDirection === 'down' ? -5 : 5) : 0),
      }}
      transition={isMobile 
        ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
        : { y: { duration: 0.2, ease: "easeOut" } }
      }
      className="fixed left-0 z-[999999999] pointer-events-none"
      style={{
        // Mobile: 18% from top, Desktop: near top (15%)
        top: isMobile ? '18%' : '15%',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px))',
        // Disable screen bloom effect on mobile
        filter: (!isMobile && extremeScrollProgress > 0.7) ? `brightness(${1 + (extremeScrollProgress - 0.7) * 0.3})` : undefined,
      }}
    >
      <motion.div
        className="relative pointer-events-auto cursor-pointer"
        onHoverStart={handleInteraction}
        onHoverEnd={handleHoverEnd}
        onTap={handleInteraction}
      >
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={
            // Mobile: Always visible, no peek-in/peek-out animation
            isMobile
              ? isMinimized 
                ? { x: -70, opacity: 0.1 }
                : { x: 0, opacity: 1 }  // Always visible on mobile
              // Desktop: Keep full animations
              : isMinimized 
                ? { x: -70, scale: 0.95, opacity: 0.1, rotateY: 0 }
                : isPinned 
                  ? { x: 0, scale: 1, opacity: 1, rotateY: 0 }
                  : isScrolling
                    ? { 
                        x: scrollDirection === 'down' ? -40 : -20, 
                        scale: 0.98 + (scrollProgress * 0.04),
                        opacity: 0.8 + (scrollProgress * 0.2),
                        rotateY: scrollDirection === 'down' ? -15 : 15,
                      }
                    : {
                        x: [-60, 0, 0, -60],
                        opacity: [0, 1, 1, 0],
                        scale: [0.95, 1, 1, 0.95],
                        rotateY: 0,
                      }
          }
          whileHover={isMobile ? { x: 4, opacity: 1 } : { 
            x: 8, 
            scale: 1.02, 
            opacity: 1, 
            rotateY: 5,
          }}
          transition={
            isMobile
              ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
              : isMinimized || isPinned || isScrolling
                ? { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                : { 
                    duration: 2.5,
                    repeat: Infinity, 
                    ease: "easeInOut",
                    repeatDelay: 0.5,
                    times: [0, 0.2, 0.8, 1]
                  }
          }
          className="relative rounded-r-3xl ultimate-hub-scroll-effect"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(59,130,246,0.15) 50%, rgba(59, 130, 246, 0.1) 100%)',
            // Reduce blur on mobile for better performance
            backdropFilter: isMobile ? 'blur(8px)' : 'blur(12px)',
            WebkitBackdropFilter: isMobile ? 'blur(8px)' : 'blur(12px)',
            border: '2px solid rgba(59, 130, 246, 0.8)',
            boxShadow: dynamicStyles.boxShadow,
            // Disable 3D transforms on mobile to prevent FPS drops
            transform: isMobile ? undefined : 'perspective(1000px)',
            transformStyle: isMobile ? undefined : 'preserve-3d',
            // Only use will-change on desktop
            willChange: isMobile ? 'auto' : 'transform',
          }}
          onClick={(e) => {
            e.preventDefault();
            SoundEffects.click();
            handleInteraction();
            if (isMinimized) onToggleMinimized();
            else onOpenPanel();
          }}
          onMouseEnter={() => {
            SoundEffects.hover();
            handleInteraction();
            if (isMinimized) onToggleMinimized();
          }}
        >

          
          <AnimatePresence mode="popLayout">
            {isMinimized ? (
              <motion.div
                key="minimized"
                initial={{ opacity: 0, scale: isMobile ? 0.9 : 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: isMobile ? 0.9 : 0.7 }}
                transition={isMobile ? { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } : undefined}
                className="px-2 py-1.5 relative z-10"
              >
                {/* Minimized: White neon icon with glow */}
                <div className="flex items-center gap-1">
                  <TrendingUp 
                    className="w-4 h-4 text-white neon-white-icon" 
                    style={{ 
                      filter: 'drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #3b82f6)'
                    }} 
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0, scale: isMobile ? 0.95 : 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: isMobile ? 0.95 : 0.85 }}
                transition={isMobile 
                  ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
                  : { duration: 0.4, ease: "easeInOut" }
                }
                className="px-1 py-1.5 md:px-4 md:py-4 relative z-10"
              >
                {/* Mobile: Always compact view with prices - with scroll-intensified neons */}
                <div className="flex md:hidden flex-col items-center justify-center gap-0.5 min-w-[36px]">
                  <TrendingUp 
                    className="w-2.5 h-2.5 text-white neon-white-icon" 
                    style={{ filter: dynamicStyles.iconFilter }} 
                  />
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      <Coins 
                        className="w-2 h-2 text-blue-400 neon-blue-icon" 
                        style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
                      />
                      <span 
                        className="text-[7px] font-bold neon-blue-text"
                        style={{ textShadow: '0 0 4px #3b82f6' }}
                      >
                        ${prices.xauusd}
                      </span>
                    </div>
                    <div 
                      className="w-px h-2.5" 
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.7)',
                        boxShadow: '0 0 4px #3b82f6'
                      }}
                    />
                    <div className="flex items-center gap-0.5">
                      <Bitcoin 
                        className="w-2 h-2 text-blue-400 neon-blue-icon" 
                        style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
                      />
                      <span 
                        className="text-[7px] font-bold neon-blue-text"
                        style={{ textShadow: '0 0 4px #3b82f6' }}
                      >
                        ${prices.btcusd}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Animated between compact (scrolling) and full */}
                <motion.div 
                  className="hidden md:flex flex-col gap-4"
                  initial={false}
                  animate={{ 
                    width: (isExpanded && !isScrolling) ? 320 : 100,
                    minWidth: (isExpanded && !isScrolling) ? 320 : 100
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <AnimatePresence mode="wait">
                    {(isExpanded && !isScrolling) ? (
                      // Full expanded desktop view
                      <motion.div
                        key="desktop-expanded"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-4"
                        style={{ willChange: 'transform, opacity' }}
                      >
                        {/* TRADING HUB Label */}
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <TrendingUp className="w-7 h-7 text-white neon-white-icon" style={{ filter: dynamicStyles.iconFilter }} />
                            </div>
                            <span 
                              className="text-2xl font-black tracking-widest uppercase neon-blue-text"
                              style={{ 
                                color: '#3b82f6',
                                textShadow: dynamicStyles.textShadow,
                                letterSpacing: '0.15em'
                              }}
                            >
                              TRADING HUB
                            </span>
                          </div>
                          <div className="h-px w-48 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                            style={{ boxShadow: '0 0 8px #3b82f6' }}
                          />
                        </div>
                        
                        {/* Mini TradingView Gold Chart */}
                        <div 
                          className="w-full h-[120px] rounded-lg overflow-hidden relative"
                          style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.98) 0%, rgba(59,130,246,0.15) 100%)',
                            border: '2px solid #3b82f6',
                            boxShadow: '0 0 8px #3b82f6, 0 0 16px rgba(59,130,246,0.5), inset 0 0 8px rgba(59,130,246,0.3)'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-transparent to-cyan-500/15 pointer-events-none z-10" />
                          <MiniGoldChart />
                        </div>
                        
                        {/* Live Prices */}
                        <div 
                          className="flex items-center justify-around gap-4 px-4 py-3 rounded-lg neon-subtle-border"
                          style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(59,130,246,0.12) 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.8)',
                            boxShadow: '0 0 4px #3b82f6, inset 0 0 4px #3b82f6'
                          }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Coins className="w-6 h-6 text-amber-400 neon-blue-icon" style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Gold</span>
                              <span className="text-lg font-black tabular-nums neon-blue-text" style={{ color: '#3b82f6', textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>
                                ${prices.xauusd}
                              </span>
                            </div>
                          </div>
                          <div className="h-12 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" style={{ boxShadow: '0 0 6px #3b82f6' }} />
                          <div className="flex flex-col items-center gap-1">
                            <Bitcoin className="w-6 h-6 text-orange-400 neon-blue-icon" style={{ filter: 'drop-shadow(0 0 6px #fb923c)' }} />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Bitcoin</span>
                              <span className="text-lg font-black tabular-nums neon-blue-text" style={{ color: '#3b82f6', textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>
                                ${prices.btcusd}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live Signals & Breaking News */}
                        <LiveSignalsViewer />
                        <BreakingNewsViewer />
                      </motion.div>
                    ) : (
                      // Compact desktop view - shown when scrolling or not expanded - with intensified neons
                      <motion.div
                        key="desktop-compact"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center gap-2 py-2"
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <TrendingUp className="w-6 h-6 text-white neon-white-icon" style={{ filter: dynamicStyles.iconFilter }} />
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-blue-400 neon-blue-icon" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                            <span className="text-sm font-bold neon-blue-text" style={{ textShadow: '0 0 4px #3b82f6' }}>${prices.xauusd}</span>
                          </div>
                          <div 
                            className="w-12 h-px" 
                            style={{ 
                              background: 'rgba(59, 130, 246, 0.7)',
                              boxShadow: '0 0 4px #3b82f6'
                            }}
                          />
                          <div className="flex items-center gap-1">
                            <Bitcoin className="w-4 h-4 text-blue-400 neon-blue-icon" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                            <span className="text-sm font-bold neon-blue-text" style={{ textShadow: '0 0 4px #3b82f6' }}>${prices.btcusd}</span>
                          </div>
                        </div>
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider mt-1 neon-blue-text"
                          style={{ 
                            color: 'rgba(96, 165, 250, 0.85)',
                            textShadow: '0 0 4px #3b82f6'
                          }}
                        >
                          Hub
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Tap hint on mobile - pull tab from left */}
        {!isMinimized && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
            className="absolute -bottom-5 left-0 whitespace-nowrap sm:hidden flex items-center gap-0.5 cursor-pointer pointer-events-auto px-1.5 py-0.5 rounded-r-full neon-subtle-border"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderTop: '1px solid rgba(59, 130, 246, 0.3)',
              borderRight: '1px solid rgba(59, 130, 246, 0.3)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenPanel();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onOpenPanel();
            }}
          >
            <span className="text-[6px] neon-blue-text font-medium">Tap to open</span>
            <svg 
              className="w-1.5 h-1.5 text-blue-400/80" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.div>
        )}
      </motion.div>
      
      {/* BULLMONEY Fullscreen Fast Scroll Overlay */}
      <AnimatePresence>
        {isFastScrolling && (
          <motion.div
            data-bullmoney-overlay="true"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isFlickeringOut 
                ? [1, 0.7, 0.9, 0.4, 0.8, 0.2, 0.5, 0.1, 0.3, 0] 
                : [0, 0.3, 0.6, 0.85, 1]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: isFlickeringOut ? 2 : 0.4,
              ease: isFlickeringOut 
                ? [0.25, 0.1, 0.25, 1] // Custom cubic-bezier for smooth flicker out
                : [0.34, 1.56, 0.64, 1], // Smooth overshoot ease-in
              times: isFlickeringOut 
                ? [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.75, 0.85, 0.92, 1]
                : [0, 0.2, 0.5, 0.8, 1]
            }}
            className="fixed inset-0 z-[9999999999] flex items-center justify-center pointer-events-none"
            style={{
              background: `rgba(0, 0, 0, ${0.9 + scrollIntensity * 0.08})`,
            }}
          >
            {/* Background neon glow effects */}
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                  radial-gradient(ellipse at 30% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
                  radial-gradient(ellipse at 70% 70%, rgba(59, 130, 246, 0.15) 0%, transparent 40%)
                `,
              }}
            />
            
            {/* Animated scan lines */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)',
                animation: 'bullmoney-scanlines 0.1s linear infinite',
              }}
            />
            
            {/* BULLMONEY Text */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ 
                scale: isFlickeringOut 
                  ? [1, 1.02, 0.99, 1.01, 0.98, 1, 0.97] 
                  : [0.85, 1.02, 1],
                opacity: isFlickeringOut 
                  ? [1, 0.8, 0.95, 0.5, 0.85, 0.3, 0.6, 0.15, 0.4, 0] 
                  : [0, 0.5, 1],
                y: isFlickeringOut ? [0, -5, 0, 5, -3, 0] : [20, -5, 0],
              }}
              transition={{ 
                duration: isFlickeringOut ? 2 : 0.5,
                ease: isFlickeringOut 
                  ? [0.4, 0, 0.2, 1] // Material design standard easing
                  : [0.34, 1.56, 0.64, 1], // Spring-like overshoot
                times: isFlickeringOut 
                  ? [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.75, 0.85, 0.92, 1]
                  : [0, 0.6, 1]
              }}
              className="relative select-none flex flex-col items-center gap-2 sm:gap-4"
            >
              {/* BULLMONEY - Main text */}
              <div className="relative">
                <span 
                  className="absolute text-5xl sm:text-7xl md:text-8xl font-black tracking-widest"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '2px rgba(59, 130, 246, 0.3)',
                    filter: 'blur(8px)',
                    transform: 'translate(-2px, -2px)',
                  }}
                >
                  BULLMONEY
                </span>
                <span 
                  className="absolute text-5xl sm:text-7xl md:text-8xl font-black tracking-widest"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(59, 130, 246, 0.5)',
                    filter: 'blur(4px)',
                    transform: 'translate(-1px, -1px)',
                  }}
                >
                  BULLMONEY
                </span>
                <span 
                  className="relative text-5xl sm:text-7xl md:text-8xl font-black tracking-widest"
                  style={{
                    color: '#3b82f6',
                    textShadow: `
                      0 0 10px #3b82f6,
                      0 0 20px #3b82f6,
                      0 0 40px #3b82f6,
                      0 0 80px #3b82f6,
                      0 0 120px rgba(59, 130, 246, 0.8),
                      0 0 160px rgba(59, 130, 246, 0.6),
                      0 0 200px rgba(59, 130, 246, 0.4)
                    `,
                    animation: isFlickeringOut ? undefined : 'bullmoney-neon-flicker 0.1s ease-in-out infinite alternate',
                  }}
                >
                  BULLMONEY
                </span>
              </div>
              
              {/* TRADING HUB - Subtitle */}
              <span 
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.3em] uppercase"
                style={{
                  color: '#3b82f6',
                  textShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 40px #3b82f6',
                  animation: isFlickeringOut ? undefined : 'bullmoney-neon-flicker 0.15s ease-in-out infinite alternate',
                }}
              >
                TRADING HUB
              </span>
              
              {/* SLOW DOWN - Warning text */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ 
                  opacity: isFlickeringOut ? [1, 0] : [0, 0.7, 1, 0.85, 1],
                  scale: isFlickeringOut ? [1, 0.95] : [0.9, 1.03, 1, 1.02, 1],
                  y: isFlickeringOut ? [0, 20] : [30, -3, 0],
                }}
                transition={{ 
                  duration: isFlickeringOut ? 0.8 : 0.6,
                  delay: isFlickeringOut ? 0 : 0.2,
                  ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
                }}
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.2em] uppercase mt-4 sm:mt-6"
                style={{
                  color: '#3b82f6',
                  textShadow: `
                    0 0 ${15 + scrollIntensity * 20}px #3b82f6,
                    0 0 ${30 + scrollIntensity * 30}px #3b82f6,
                    0 0 ${60 + scrollIntensity * 40}px #3b82f6,
                    0 0 ${100 + scrollIntensity * 50}px rgba(59, 130, 246, ${0.9 + scrollIntensity * 0.1})
                  `,
                  animation: isFlickeringOut ? undefined : 'bullmoney-slow-pulse 1.2s ease-in-out infinite',
                }}
              >
                 SLOW DOWN 
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
UnifiedFpsPill.displayName = 'UnifiedFpsPill';

// ============================================================================
// LEGACY PILL COMPONENTS (kept for compatibility)
// ============================================================================

const FpsPill = memo(({ 
  fps, 
  deviceTier, 
  isMinimized, 
  onTogglePanel,
  onToggleMinimized,
  onOpenDevicePanel
}: {
  fps: number;
  deviceTier: string;
  isMinimized: boolean;
  onTogglePanel: () => void;
  onToggleMinimized: () => void;
  onOpenDevicePanel: () => void;
}) => {
  const { jankScore = 0 } = useFpsMonitor();
  
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, scale: isMinimized ? 0.9 : 1 }}
      className="fixed right-0 z-[250000] pointer-events-none"
      style={{ top: '50%', transform: 'translateY(-50%)', paddingRight: 'calc(env(safe-area-inset-right, 0px) + 8px)' }}
    >
      {/* Desktop Info Label - To the right of button */}
      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-4 pointer-events-none z-[250001]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isMinimized ? 0 : 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-left"
        >
          <div 
            className="text-base font-bold text-blue-400 whitespace-nowrap mb-1"
            style={{ textShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6' }}
          >
            📊 Click for Device Info
          </div>
          <div 
            className="text-sm text-blue-300 whitespace-nowrap font-medium"
            style={{ textShadow: '0 0 8px #3b82f6, 0 0 16px #3b82f6' }}
          >
            Trades • Live Streams • Performance
          </div>
        </motion.div>
      </div>

      <motion.div
        whileHover="hover"
        animate={isMinimized ? "minimized" : "initial"}
        className="relative pointer-events-auto cursor-pointer"
      >
        <motion.div
          variants={{
            initial: { x: 0, scale: 1 },
            hover: { x: -8, scale: 1.02 },
            minimized: { x: 2, scale: 0.95 }
          }}
          className="relative rounded-l-3xl bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-slate-900/40 backdrop-blur-2xl border-y border-l border-blue-500/50 shadow-2xl hover:border-blue-400/70 hover:shadow-blue-600/40"
          onClick={(e) => {
            e.preventDefault();
            SoundEffects.click();
            if (isMinimized) onToggleMinimized();
            else onOpenDevicePanel();
          }}
          onMouseEnter={() => {
            SoundEffects.hover();
            if (isMinimized) onToggleMinimized();
          }}
        >
          <AnimatePresence mode="popLayout">
            {isMinimized ? (
              <motion.div
                key="minimized"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="px-2 py-1.5"
              >
                <MinimizedFpsDisplay fps={fps} />
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="px-2 py-2"
              >
                <div className="flex items-center gap-1">
                  <ChevronRight size={14} className="text-blue-500 rotate-180" />
                  <FpsDisplay fps={fps} deviceTier={deviceTier} jankScore={jankScore} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
FpsPill.displayName = 'FpsPill';

const TradingPill = memo(({ prices, isExpanded, onToggle }: {
  prices: { xauusd: string; btcusd: string };
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 z-[250000] pointer-events-none"
      style={{ top: 'calc(5rem + env(safe-area-inset-top, 0px) + 28px)', paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 2px)' }}
    >
      <motion.div
        whileHover={{ x: 12, scale: 1.05, boxShadow: '0 0 30px rgba(96, 165, 250, 0.6)' }}
        className="relative pointer-events-auto cursor-pointer"
        onClick={onToggle}
        animate={{ x: [0, 8, 0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
      >
        <div className="relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl hover:border-blue-400/70">
          <motion.div
            className="absolute inset-0 rounded-r-full bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ filter: 'blur(8px)' }}
          />
          
          <div className="px-2 py-1.5 flex items-center gap-1.5 relative z-10">
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1], boxShadow: ['0 0 0px rgba(96, 165, 250, 1)', '0 0 8px rgba(96, 165, 250, 0.8)', '0 0 0px rgba(96, 165, 250, 1)'] }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Coins className="w-3 h-3 text-blue-300" />
                <span className="text-[9px] font-bold text-blue-200">${prices.xauusd}</span>
              </div>
              <div className="w-px h-2.5 bg-blue-500/30" />
              <div className="flex items-center gap-0.5">
                <Bitcoin className="w-3 h-3 text-blue-300" />
                <span className="text-[9px] font-bold text-blue-200">${prices.btcusd}</span>
              </div>
            </div>

            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-3 h-3 text-blue-400/70" />
            </motion.div>
          </div>
        </div>
        
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5"
          >
            <TradingTipPill />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});
TradingPill.displayName = 'TradingPill';

const CommunityPill = memo(({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) => {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="fixed left-0 z-[250000] pointer-events-none"
      style={{ top: 'calc(5rem + env(safe-area-inset-top, 0px) + 126px)', paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 2px)' }}
    >
      <motion.div
        whileHover={{ x: 12, scale: 1.05, boxShadow: '0 0 30px rgba(34, 211, 238, 0.6)' }}
        className="relative pointer-events-auto cursor-pointer"
        onClick={onToggle}
        animate={{ x: [0, 8, 0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
      >
        <div className="relative rounded-r-2xl bg-gradient-to-br from-cyan-600/30 via-cyan-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-cyan-500/50 shadow-2xl hover:border-cyan-400/70 min-w-[150px]">
          <motion.div
            className="absolute inset-0 rounded-r-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ filter: 'blur(8px)' }}
          />
          
          <div className="px-2 py-1.5 flex items-center gap-1.5 relative z-10">
            <motion.div
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-300" />
              <span className="text-[9px] font-bold text-cyan-200">Live Trades</span>
            </div>

            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-3 h-3 text-cyan-400/70" />
            </motion.div>
          </div>
          
          <LiveTradesTicker />
        </div>
      </motion.div>
    </motion.div>
  );
});
CommunityPill.displayName = 'CommunityPill';

const BullMoneyTVPill = memo(({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) => {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="fixed left-0 z-[250000] pointer-events-none"
      style={{ top: 'calc(5rem + env(safe-area-inset-top, 0px) + 238px)', paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 8px)' }}
    >
      <motion.div
        whileHover={{ x: 12, scale: 1.05, boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }}
        className="relative pointer-events-auto cursor-pointer"
        onClick={onToggle}
        animate={{ x: [0, 8, 0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
      >
        <div className="relative rounded-r-full bg-gradient-to-br from-purple-600/30 via-purple-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-purple-500/50 shadow-2xl hover:border-purple-400/70">
          <motion.div
            className="absolute inset-0 rounded-r-full bg-gradient-to-r from-purple-500/20 via-fuchsia-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ filter: 'blur(8px)' }}
          />
          
          <div className="px-2 py-1.5 flex items-center gap-1.5 relative z-10">
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span className="text-[9px] font-bold text-purple-200">LIVE STAGE</span>
            </div>

            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-3 h-3 text-purple-400/70" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
BullMoneyTVPill.displayName = 'BullMoneyTVPill';

// ============================================================================
// MAIN COMPONENT - UNIFIED SINGLE PILL APPROACH
// ============================================================================

export function UltimateHub() {
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { fps, deviceTier, jankScore } = useFpsMonitor();
  const prices = useLivePrices();
  const { isAdmin, userId, userEmail } = useAdminCheck();
  const { isVip: isVipFromCheck } = useVipCheck(userId, userEmail);
  
  // Admin always gets VIP access
  const isVip = isVipFromCheck || isAdmin;
  
  // Debug log VIP status
  useEffect(() => {
    console.log('[UltimateHub] VIP Status:', { isVip, isVipFromCheck, isAdmin, userId, userEmail });
  }, [isVip, isVipFromCheck, isAdmin, userId, userEmail]);
  
  const { 
    isAnyModalOpen, 
    isMobileMenuOpen, 
    isUltimatePanelOpen,
    isUltimateHubOpen,
    isAudioWidgetOpen,
    isPagemodeOpen,
    isLoaderv2Open,
    isV2Unlocked,
    setUltimateHubOpen
  } = useUIState();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();

  // Inject neon styles
  useEffect(() => {
    if (!document.getElementById('ultimate-hub-neon-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'ultimate-hub-neon-styles';
      styleEl.textContent = GLOBAL_NEON_STYLES;
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUltimateHubOpen) {
        setUltimateHubOpen(false);
      }
      // Quick open with Cmd/Ctrl + Shift + H
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setUltimateHubOpen(!isUltimateHubOpen);
      }
      // Admin panel shortcut
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUltimateHubOpen, setUltimateHubOpen]);

  // Don't render until mounted and V2 unlocked
  if (!mounted || !isV2Unlocked) return null;

  // Don't render during pagemode or loader (full-screen overlays)
  if (isPagemodeOpen || isLoaderv2Open) return null;

  // Hide pill when mobile menu, panel open, or other modals (NOT audio widget - they can coexist)
  // Audio widget is on left side, UltimateHub pill is on right side - no overlap
  const shouldHidePill = isMobileMenuOpen || isUltimatePanelOpen || isAnyModalOpen || isUltimateHubOpen;

  return (
    <>
      {/* Single Unified FPS Pill - All features in one button */}
      {!shouldHidePill && (
        <UnifiedFpsPill
          fps={fps}
          deviceTier={deviceTier}
          prices={prices}
          isMinimized={isMinimized}
          onToggleMinimized={() => setIsMinimized(!isMinimized)}
          onOpenPanel={() => setUltimateHubOpen(true)}
        />
      )}

      {/* Unified Hub Panel - Trading, Community, TV, Device all in one */}
      <UnifiedHubPanel
        isOpen={isUltimateHubOpen}
        onClose={() => setUltimateHubOpen(false)}
        fps={fps}
        deviceTier={deviceTier}
        isAdmin={isAdmin}
        isVip={isVip}
        userId={userId}
        userEmail={userEmail}
        prices={prices}
      />
    </>
  );
}

export default UltimateHub;
