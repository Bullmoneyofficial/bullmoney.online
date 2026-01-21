"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { detectBrowser } from '@/lib/browserDetection';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useVelocity,
  AnimatePresence,
  useWillChange,
  useAnimation,
  useAnimationFrame,
} from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2, X, Play, ArrowRight, Volume2, VolumeX, Copy, Check } from "lucide-react";

// ✅ SPLINE PRELOADER
import { useSplinePreload, useEnsureSplineViewer } from '@/hooks/useSplinePreload';
import { DISCORD_STAGE_FEATURED_VIDEOS } from "@/components/TradingQuickAccess";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

const SPLINE_VIEWER_SCRIPT_SRC = "https://unpkg.com/@splinetool/viewer@1.12.36/build/spline-viewer.js";

// ============================================================================
// TYPES
// ============================================================================

type HeroSplineSource = {
  runtimeUrl: string;
  viewerUrl: string;
  preferViewer?: boolean;
};

type HeroSplineSceneConfig = HeroSplineSource & {
  id: string;
  label: string;
  weight: number;
};

// ============================================================================
// SPLINE SCENES CONFIG
// ============================================================================

const HERO_SPLINE_SCENES: readonly HeroSplineSceneConfig[] = [
  {
    id: "timefold",
    label: "Timefold Odyssey",
    runtimeUrl: "https://prod.spline.design/S-nBNkFCGU9KbFxY/scene.splinecode",
    viewerUrl: "https://my.spline.design/timefoldodyssey-s3vKRBOk0ESLxu0qgZIB1IOD/",
    preferViewer: true,
    weight: 35,
  },
  {
    id: "nexbot",
    label: "Nexbot Vanguard",
    runtimeUrl: "https://prod.spline.design/iWLVJpgyHSJpuCnD/scene.splinecode",
    viewerUrl: "https://my.spline.design/nexbotrobotcharacterconcept-pJvW8Dq4jVXayg6xUDiM8nPp/",
    preferViewer: true,
    weight: 35,
  },
  {
    id: "followers-focus",
    label: "100 Followers Focus",
    runtimeUrl: "https://prod.spline.design/IomoYEa50DmuiTXE/scene.splinecode",
    viewerUrl: "https://my.spline.design/100followersfocus-55tpQJYDbng5lAQ3P1tq5abx/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "loading-bar",
    label: "The Loading Bar",
    runtimeUrl: "https://prod.spline.design/TOPNo0pcBjY8u6Ls/scene.splinecode",
    viewerUrl: "https://my.spline.design/theloadingbarvertical-J0jRfhBsRDUAUKzNRxMvZXak/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "cannon",
    label: "Cannon Dynamics",
    runtimeUrl: "https://prod.spline.design/C0mBZel0m7zXQaoD/scene.splinecode",
    viewerUrl: "https://my.spline.design/cannon-vOk1Cc5VyFBvcSq1ozXuhK1n/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "xgamer",
    label: "XGamer Flux",
    runtimeUrl: "https://prod.spline.design/1HGlyIYtYszh-B-r/scene.splinecode",
    viewerUrl: "https://my.spline.design/xgamer-RZ9X6L57SHESs7L04p6IDisA/",
    preferViewer: true,
    weight: 6,
  },
  {
    id: "r4xbot",
    label: "R4X Bot Sentinel",
    runtimeUrl: "https://prod.spline.design/G3yn-KsfkIAbK2Mz/scene.splinecode",
    viewerUrl: "https://my.spline.design/r4xbot-2RZeOpfgJ0Vr36G9Jd9EHlFB/",
    preferViewer: true,
    weight: 6,
  },
] as const;

const HERO_SPLINE_BLOCK_SIZE = 5;
const HERO_SPLINE_STORAGE_KEY = "heroSplineCycleIndex";
const HERO_SPLINE_LEGACY_KEY = "heroSplineReloadCount";
const HERO_SPLINE_DEFAULT_INDEX = 0;

// ============================================================================
// TICKER DATA - Real-time prices from APIs
// ============================================================================

type TickerItem = {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
};

const DEFAULT_TICKER_DATA: TickerItem[] = [
  { symbol: 'BTC', price: '102,500', change: '+2.4%', positive: true },
  { symbol: 'ETH', price: '3,850', change: '+1.8%', positive: true },
  { symbol: 'SOL', price: '198.42', change: '-0.5%', positive: false },
  { symbol: 'XAU', price: '2,726.80', change: '+0.3%', positive: true },
  { symbol: 'XRP', price: '2.42', change: '+1.2%', positive: true },
  { symbol: 'ADA', price: '0.89', change: '+0.9%', positive: true },
  { symbol: 'DOGE', price: '0.32', change: '+1.2%', positive: true },
  { symbol: 'LINK', price: '22.50', change: '+3.1%', positive: true },
];

// Hook to fetch real prices from Binance and other sources
const useRealTimePrices = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>(DEFAULT_TICKER_DATA);
  const lastPricesRef = useRef<Record<string, number>>({});
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchPrices = async () => {
      if (!isMountedRef.current) return;
      
      try {
        // Fetch from multiple sources in parallel
        const [binanceRes, marketDataRes, livePricesRes] = await Promise.allSettled([
          fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","LINKUSDT"]'),
          fetch('/api/market-data'),
          fetch('/api/prices/live')
        ]);

        const newPrices: Record<string, number> = {};
        const updatedTicker: TickerItem[] = [...DEFAULT_TICKER_DATA];

        // Parse Binance data
        if (binanceRes.status === 'fulfilled' && binanceRes.value.ok) {
          const binanceData = await binanceRes.value.json();
          binanceData.forEach((item: { symbol: string; price: string }) => {
            const sym = item.symbol.replace('USDT', '');
            newPrices[sym] = parseFloat(item.price);
          });
        }

        // Parse live prices (gold/BTC)
        if (livePricesRes.status === 'fulfilled' && livePricesRes.value.ok) {
          const liveData = await livePricesRes.value.json();
          if (liveData.xauusd) newPrices['XAU'] = parseFloat(liveData.xauusd);
          if (liveData.btcusd) newPrices['BTC'] = parseFloat(liveData.btcusd);
        }

        // Update ticker with real prices and calculate changes
        updatedTicker.forEach((item, index) => {
          const newPrice = newPrices[item.symbol];
          if (newPrice) {
            const lastPrice = lastPricesRef.current[item.symbol] || newPrice;
            const changePercent = ((newPrice - lastPrice) / lastPrice) * 100;
            const isPositive = changePercent >= 0;
            
            updatedTicker[index] = {
              symbol: item.symbol,
              price: newPrice >= 1000 ? newPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) 
                     : newPrice >= 1 ? newPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                     : newPrice.toFixed(4),
              change: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
              positive: isPositive
            };
          }
        });

        // Update ref (not state) to prevent re-renders
        lastPricesRef.current = newPrices;
        
        if (isMountedRef.current) {
          setTickerData(updatedTicker);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000); // Update every 5 seconds
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []); // Empty deps - refs don't cause re-renders

  return tickerData;
};

// ============================================================================
// SPLINE SCHEDULING UTILITIES
// ============================================================================

const createHeroSplineSchedule = (scenes: readonly HeroSplineSceneConfig[]): HeroSplineSceneConfig[] => {
  if (!scenes.length) return [];
  const normalizedScenes = scenes.map((scene) => ({
    scene,
    remaining: Number.isFinite(scene.weight) ? Math.max(1, Math.round(scene.weight)) : 1,
  }));
  const totalSlots = normalizedScenes.reduce((sum, entry) => sum + entry.remaining, 0);
  if (totalSlots <= 0) return [scenes[0]];
  const schedule: HeroSplineSceneConfig[] = [];
  let remaining = totalSlots;
  while (remaining > 0) {
    for (const entry of normalizedScenes) {
      if (entry.remaining > 0) {
        schedule.push(entry.scene);
        entry.remaining -= 1;
        remaining -= 1;
      }
    }
  }
  return schedule;
};

const HERO_SPLINE_SCHEDULE = createHeroSplineSchedule(HERO_SPLINE_SCENES);
const HERO_SPLINE_CYCLE_LENGTH = Math.max(HERO_SPLINE_SCHEDULE.length, 1);

const getStoredHeroSplineIndex = (): number => {
  if (typeof window === "undefined") return HERO_SPLINE_DEFAULT_INDEX;
  try {
    if (window.localStorage.getItem(HERO_SPLINE_LEGACY_KEY) !== null) {
      window.localStorage.removeItem(HERO_SPLINE_LEGACY_KEY);
    }
    const storedValue = window.localStorage.getItem(HERO_SPLINE_STORAGE_KEY);
    const parsedValue = storedValue ? parseInt(storedValue, 10) : Number.NaN;
    if (Number.isInteger(parsedValue) && parsedValue >= 0 && parsedValue < HERO_SPLINE_CYCLE_LENGTH) {
      return parsedValue;
    }
    window.localStorage.setItem(HERO_SPLINE_STORAGE_KEY, String(HERO_SPLINE_DEFAULT_INDEX));
    return HERO_SPLINE_DEFAULT_INDEX;
  } catch (error) {
    return HERO_SPLINE_DEFAULT_INDEX;
  }
};

const setStoredHeroSplineIndex = (index: number) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HERO_SPLINE_STORAGE_KEY, String(index));
  } catch (error) {}
};

const sceneFromIndex = (index: number): HeroSplineSceneConfig => {
  if (!HERO_SPLINE_SCHEDULE.length) return HERO_SPLINE_SCENES[0]!;
  const normalizedIndex = index % HERO_SPLINE_CYCLE_LENGTH;
  return HERO_SPLINE_SCHEDULE[normalizedIndex] ?? HERO_SPLINE_SCHEDULE[0]!;
};

const blockStepFromIndex = (index: number): number => (index % HERO_SPLINE_BLOCK_SIZE) + 1;

type HeroSplineResolution = { scene: HeroSplineSceneConfig; blockStep: number };

const resolveHeroSplineScene = (options?: { advance?: boolean }): HeroSplineResolution => {
  if (typeof window === "undefined") return { scene: HERO_SPLINE_SCENES[0]!, blockStep: 1 };
  const currentIndex = getStoredHeroSplineIndex();
  if (options?.advance !== false) {
    const nextIndex = (currentIndex + 1) % HERO_SPLINE_CYCLE_LENGTH;
    setStoredHeroSplineIndex(nextIndex);
  }
  return { scene: sceneFromIndex(currentIndex), blockStep: blockStepFromIndex(currentIndex) };
};

const useHeroSplineSource = () => {
  const [resolution, setResolution] = useState(() => resolveHeroSplineScene());
  const advanceScene = useCallback((reason?: string) => {
    const nextResolution = resolveHeroSplineScene();
    setResolution(nextResolution);
  }, []);
  const setSceneById = useCallback((sceneId: string, reason?: string) => {
    const scheduledScene = HERO_SPLINE_SCHEDULE.find((scene) => scene.id === sceneId);
    const fallbackScene = HERO_SPLINE_SCENES.find((scene) => scene.id === sceneId);
    const selectedScene = scheduledScene ?? fallbackScene ?? HERO_SPLINE_SCENES[0];
    if (!selectedScene) return;
    const scheduleIndex = HERO_SPLINE_SCHEDULE.findIndex((scene) => scene.id === selectedScene.id);
    if (scheduleIndex >= 0) {
      const nextIndex = (scheduleIndex + 1) % HERO_SPLINE_CYCLE_LENGTH;
      setStoredHeroSplineIndex(nextIndex);
    }
    const blockStep = scheduleIndex >= 0 ? blockStepFromIndex(scheduleIndex) : 1;
    setResolution({ scene: selectedScene, blockStep });
  }, []);
  return {
    scene: resolution.scene.id,
    label: resolution.scene.label,
    blockStep: resolution.blockStep,
    source: resolution.scene,
    advanceScene,
    setSceneById,
  } as const;
};

// ============================================================================
// DECLARE SPLINE-VIEWER
// ============================================================================

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        url: string;
        loading?: "lazy" | "eager";
        "events-target"?: string;
      };
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const normalizeYouTubeId = (input: string): string | null => {
  if (!input) return null;
  if (!input.includes('http')) return input;
  try {
    const url = new URL(input);
    const paramId = url.searchParams.get('v');
    if (paramId) return paramId;
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.pop() || null;
  } catch {
    return null;
  }
};

// ============================================================================
// HOOKS
// ============================================================================

const useSplineViewerScript = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.customElements?.get("spline-viewer")) {
      setReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-spline-viewer]');
    if (existing) {
      if (existing.dataset.loaded === "true") {
        setReady(true);
        return;
      }
      const handleExistingLoad = () => setReady(true);
      existing.addEventListener("load", handleExistingLoad);
      return () => existing.removeEventListener("load", handleExistingLoad);
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = SPLINE_VIEWER_SCRIPT_SRC;
    script.async = true;
    script.dataset.splineViewer = "true";
    const handleLoad = () => {
      script.dataset.loaded = "true";
      setReady(true);
    };
    script.addEventListener("load", handleLoad);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", handleLoad);
  }, []);
  return ready;
};

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  
  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      // Throttle to ~60fps to prevent excessive re-renders
      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;
      
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({ x: ev.clientX, y: ev.clientY });
      });
    };
    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  return mousePosition;
};

const useMouseTrail = (length: number = 10) => {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTrail(prev => {
        const newPoint = { x: e.clientX, y: e.clientY, id: idRef.current++ };
        return [...prev.slice(-(length - 1)), newPoint];
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [length]);
  return trail;
};

const useGeoLocation = () => {
  const [location, setLocation] = useState<{ city: string; country: string; timezone: string; ip: string } | null>(null);
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setLocation({ 
        city: data.city || 'Unknown', 
        country: data.country_name || '',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        ip: data.ip || ''
      }))
      .catch(() => setLocation({
        city: 'Unknown',
        country: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ip: ''
      }));
  }, []);
  return location;
};

// Hook to get real device info
const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<{
    browser: string;
    os: string;
    device: string;
    screenRes: string;
    language: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Detect device type
    if (/Mobi|Android/i.test(ua)) device = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

    setDeviceInfo({
      browser,
      os,
      device,
      screenRes: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || 'en-US'
    });
  }, []);

  return deviceInfo;
};

// Hook for real local time
const useLocalTime = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return { time, date };
};

const useKeyboardShortcuts = (shortcuts: { key: string; callback: () => void }[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ key, callback }) => {
        if (e.key.toLowerCase() === key.toLowerCase() && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const activeElement = document.activeElement;
          if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
            callback();
          }
        }
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

const useKonamiCode = (callback: () => void) => {
  const [keys, setKeys] = useState<string[]>([]);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => [...prev.slice(-9), e.code]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (keys.length === 10 && keys.every((key, i) => key === konamiCode[i])) {
      callback();
      setKeys([]);
    }
  }, [keys, callback]);
};

// ============================================================================
// CATEGORY A: GLASS & VOID ATMOSPHERE COMPONENTS
// ============================================================================

const PerspectiveGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '500px' }}>
    <div
      className="absolute w-[200%] h-[200%] left-[-50%]"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        transform: 'rotateX(60deg)',
        transformOrigin: 'center top',
        top: '60%',
      }}
    />
  </div>
);

const VignetteOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
);

const NoiseTexture = () => (
  <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
);

const SpotlightTracking = ({ mouseX, mouseY, skipHeavyEffects = false }: { mouseX: number; mouseY: number; skipHeavyEffects?: boolean }) => (
  <motion.div
    className="absolute pointer-events-none z-5"
    style={{ width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', x: mouseX - 300, y: mouseY - 300, filter: skipHeavyEffects ? 'none' : 'blur(40px)' }}
  />
);

const OrbitalParticles = () => {
  const particles = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-full bg-blue-500/30" style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, opacity: 0.5 }} />
      ))}
    </div>
  );
};

const AuroraBorealis = ({ skipHeavyEffects = false }: { skipHeavyEffects?: boolean }) => (
  <div className="absolute bottom-0 left-0 w-[60%] h-[60%] pointer-events-none opacity-30"
    style={{ background: 'radial-gradient(ellipse at bottom left, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.2) 40%, transparent 70%)', filter: skipHeavyEffects ? 'none' : 'blur(80px)' }} />
);

const Scanlines = () => (
  <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />
);

const ReflectiveBorder = ({ children, className, skipHeavyEffects = false }: { children: React.ReactNode; className?: string; skipHeavyEffects?: boolean }) => (
  <div className={cn("relative p-[1px] rounded-2xl overflow-hidden", className)}>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), rgba(255,255,255,0.3), rgba(59, 130, 246, 0.5), transparent)' }} />
    <div className={cn("relative bg-black/80 rounded-2xl", !skipHeavyEffects && "backdrop-blur-xl")}>{children}</div>
  </div>
);

const DepthLayers = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05]">
    <pre className="text-xs text-blue-500/50 font-mono whitespace-pre-wrap blur-[2px] p-8">
{`const analyzeMarket = async (data) => {
  const signals = await processSignals(data);
  const momentum = calculateMomentum(signals);
  if (momentum > THRESHOLD) return { action: 'BUY', confidence: 0.94 };
  return optimizePosition(signals);
};`}
    </pre>
  </div>
);

const CornerAccents = () => (
  <>
    <div className="absolute top-4 left-4 text-blue-500/30 text-2xl font-light">[</div>
    <div className="absolute top-4 right-4 text-blue-500/30 text-2xl font-light">]</div>
    <div className="absolute bottom-4 left-4 text-blue-500/30 text-2xl font-light">[</div>
    <div className="absolute bottom-4 right-4 text-blue-500/30 text-2xl font-light">]</div>
  </>
);

const VerticalText = ({ skipHeavyEffects = false }: { skipHeavyEffects?: boolean }) => (
  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden xl:block">
    <p 
      className="text-3xl font-black tracking-[0.15em]" 
      style={{ 
        writingMode: 'vertical-rl', 
        textOrientation: 'mixed', 
        color: '#60a5fa',
        textShadow: skipHeavyEffects ? 'none' : `
          0 0 5px #60a5fa,
          0 0 10px #60a5fa,
          0 0 20px #3b82f6,
          0 0 40px #3b82f6,
          0 0 60px #2563eb,
          0 0 80px #2563eb
        `,
      }}
    >
      BULLMONEY
    </p>
  </div>
);

const MorphingShape = ({ skipHeavyEffects = false }: { skipHeavyEffects?: boolean }) => (
  <div className={cn("absolute right-[10%] top-[20%] w-64 h-64 bg-blue-500/10 pointer-events-none", !skipHeavyEffects && "blur-3xl")}
    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />
);

const CursorTrail = ({ trail }: { trail: { x: number; y: number; id: number }[] }) => (
  <div className="fixed inset-0 pointer-events-none z-[9997]">
    {trail.map((point, i) => (
      <motion.div
        key={point.id}
        className="absolute w-2 h-2 bg-blue-500/40 rounded-full"
        style={{ left: point.x, top: point.y, translateX: '-50%', translateY: '-50%' }}
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    ))}
  </div>
);

const BlurGraduation = () => (
  <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-40"
    style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,1) 100%)', backdropFilter: 'blur(0px)', maskImage: 'linear-gradient(to bottom, transparent, black)' }} />
);

const CurtainReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div className="relative overflow-hidden">
    <motion.div
      className="absolute inset-0 bg-black z-10"
      initial={{ scaleX: 1 }}
      animate={{ scaleX: 0 }}
      transition={{ duration: 1.2, delay, ease: [0.76, 0, 0.24, 1] }}
      style={{ transformOrigin: 'right' }}
    />
    {children}
  </motion.div>
);

const WelcomeLocation = ({ location }: { location: { city: string; country: string } | null }) => (
  location ? (
    <motion.div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2 }}
    >
      <span className="text-purple-400">📍</span>
      <span className="text-white/60">Welcome, Trader from</span>
      <span className="text-purple-400 font-medium">{location.city}</span>
    </motion.div>
  ) : null
);

const KeybindHint = ({ keyChar, label }: { keyChar: string; label: string }) => (
  <span className="inline-flex items-center gap-1 text-xs text-white/30">
    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px]">{keyChar}</kbd>
    <span>{label}</span>
  </span>
);

const Tooltip = ({ children, content, skipHeavyEffects = false }: { children: React.ReactNode; content: React.ReactNode; skipHeavyEffects?: boolean }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className={cn("absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/90 border border-white/10 whitespace-nowrap z-50", !skipHeavyEffects && "backdrop-blur-xl")}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfitCalculator = () => {
  const [investment, setInvestment] = useState(1000);
  const projectedReturn = useMemo(() => Math.round(investment * 1.47), [investment]);
  return (
    <GlassCard className="p-4 w-full">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Profit Calculator</p>
      <div className="flex flex-col sm:flex-row items-stretch gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-xs text-white/60 mb-2 block">Investment ($)</label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>$100</span>
            <span className="text-white font-mono">${investment.toLocaleString()}</span>
            <span>$10,000</span>
          </div>
        </div>
        <div className="flex-shrink-0 sm:pl-4 sm:border-l border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 flex flex-col justify-center min-w-[140px]">
          <p className="text-xs text-white/40">Monthly Return</p>
          <motion.p
            key={projectedReturn}
            className="text-xl sm:text-2xl font-bold text-green-400 font-mono"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            ${projectedReturn.toLocaleString()}
          </motion.p>
          <p className="text-xs text-green-400/60">+47% avg.</p>
        </div>
      </div>
    </GlassCard>
  );
};

const CardStack = ({ children }: { children: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 bg-blue-500/5 rounded-2xl border border-blue-500/10"
        animate={{ x: isHovered ? -16 : -8, y: isHovered ? -16 : -8, scale: isHovered ? 0.95 : 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      <motion.div
        className="absolute inset-0 bg-blue-500/10 rounded-2xl border border-blue-500/20"
        animate={{ x: isHovered ? -8 : -4, y: isHovered ? -8 : -4, scale: isHovered ? 0.97 : 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      <motion.div className="relative" animate={{ scale: isHovered ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
        {children}
      </motion.div>
    </motion.div>
  );
};

const GravityMode = ({ active, children }: { active: boolean; children: React.ReactNode }) => {
  const controls = useAnimation();
  useEffect(() => {
    if (active) {
      controls.start({ y: 500, rotate: Math.random() * 30 - 15, transition: { type: 'spring', stiffness: 50, damping: 10 } });
    } else {
      controls.start({ y: 0, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } });
    }
  }, [active, controls]);
  return <motion.div animate={controls}>{children}</motion.div>;
};

const FloatingCoins = () => {
  const coins = ['$', '€', '£', '₿', '¥'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {coins.map((coin, i) => (
        <div key={i} className="absolute text-4xl text-blue-500/10 font-bold" style={{ left: `${20 + i * 15}%`, top: `${20 + i * 10}%`, opacity: 0.15 }}>{coin}</div>
      ))}
    </div>
  );
};

const CandlestickDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className={cn("absolute w-2 rounded-sm", i % 2 === 0 ? 'bg-green-500/30' : 'bg-red-500/30')}
        style={{ left: `${10 + i * 10}%`, height: `${20 + (i % 5) * 10}%`, bottom: `${(i % 4) * 15}%`, opacity: 0.3 }} />
    ))}
  </div>
);

const GraphOverlay = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
    <motion.path d="M0,400 Q200,300 400,350 T800,250 T1200,300 T1600,200 T2000,250" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2"
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, ease: 'easeInOut' }} />
  </svg>
);

// ============================================================================
// CATEGORY B: TYPOGRAPHY EFFECTS
// ============================================================================

const DecryptionText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState(() => text.split('').map(() => '$'));
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ$%&@#';
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iterationRef = useRef(0);
  const isMountedRef = useRef(true);
  const textRef = useRef(text);
  
  useEffect(() => {
    isMountedRef.current = true;
    textRef.current = text;
    iterationRef.current = 0;
    
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Set initial display
    setDisplayText(text.split('').map(() => '$'));
    
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      intervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        
        const iteration = iterationRef.current;
        const currentText = textRef.current;
        
        if (iteration >= currentText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        
        const newText = currentText.split('').map((char, i) => 
          i < iteration ? currentText[i] : chars[Math.floor(Math.random() * chars.length)]
        );
        setDisplayText(newText);
        iterationRef.current += 1/3;
      }, 30);
    }, delay * 1000);
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, delay]);
  
  return <span className={className}>{displayText.join('')}</span>;
};

const SlotMachineNumber = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    valueRef.current = value;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Handle edge cases
    if (value <= 0) {
      setDisplayValue(0);
      return;
    }
    
    let current = 0;
    const end = value;
    const steps = Math.min(50, end); // Max 50 steps
    const increment = Math.max(1, Math.ceil(end / steps));
    const intervalMs = Math.max(20, (duration * 1000) / steps);
    
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      
      current += increment;
      if (current >= end) {
        setDisplayValue(end);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setDisplayValue(current);
      }
    }, intervalMs);
    
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, duration]);
  
  return <span className="font-mono tabular-nums">{displayValue.toLocaleString()}</span>;
};

const StaggeredReveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay + i * 0.1 }}>{word}</motion.span>
      ))}
    </span>
  );
};

const MaskedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div>
    <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>
  </div>
);

const DataAnnotation = ({ text, position }: { text: string; position: 'top' | 'bottom' }) => (
  <motion.div className={cn("absolute left-0 flex items-center gap-2 text-[10px] font-mono text-blue-400/60 tracking-widest", position === 'top' ? '-top-6' : '-bottom-6')}
    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}>
    <span className="w-8 h-px bg-blue-500/30" />{text}
  </motion.div>
);

// ============================================================================
// CATEGORY C: BUTTONS & INTERACTIONS
// ============================================================================

const LevitatingButton = ({ children, onClick, className, sound, skipHeavyEffects = false }: { children: React.ReactNode; onClick?: () => void; className?: string; sound?: () => void; skipHeavyEffects?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() }]);
    sound?.(); onClick?.();
    setTimeout(() => setRipples(prev => prev.slice(1)), 1000);
  };
  return (
    <motion.button className={cn("relative overflow-hidden px-8 py-4 rounded-full font-semibold text-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-400/30", className)}
      animate={skipHeavyEffects ? {} : { y: [0, -8, 0] }} transition={skipHeavyEffects ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={skipHeavyEffects ? {} : { scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)} onClick={handleClick}>
      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ transform: 'skewX(-20deg)' }}
        animate={skipHeavyEffects ? {} : { x: ['-200%', '200%'] }} transition={skipHeavyEffects ? {} : { duration: 3, repeat: Infinity, repeatDelay: 2 }} />
      <motion.div className="absolute inset-0 bg-blue-400" initial={{ y: '100%' }} animate={{ y: isHovered ? '0%' : '100%' }} transition={{ duration: 0.3 }} />
      {ripples.map(r => <motion.span key={r.id} className="absolute rounded-full bg-blue-300/50" style={{ left: r.x, top: r.y }}
        initial={{ width: 0, height: 0, x: 0, y: 0 }} animate={{ width: 300, height: 300, x: -150, y: -150, opacity: 0 }} transition={{ duration: 0.6 }} />)}
      <motion.span className="relative z-10 flex items-center gap-2" animate={skipHeavyEffects ? {} : { scale: [1, 1.03, 1] }} transition={skipHeavyEffects ? {} : { duration: 2, repeat: Infinity }}>
        {children}<motion.span animate={{ x: isHovered ? [0, 5, -20, 0] : 0 }} transition={{ duration: 0.4 }}><ArrowRight className="w-5 h-5" /></motion.span>
      </motion.span>
    </motion.button>
  );
};

const NeonBorderButton = ({ children, onClick, className, skipHeavyEffects = false }: { children: React.ReactNode; onClick?: () => void; className?: string; skipHeavyEffects?: boolean }) => (
  <motion.button className={cn("relative px-6 py-3 rounded-full font-semibold bg-transparent text-white border border-blue-500/50 hover:border-blue-400 transition-all duration-300", !skipHeavyEffects && "hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]", className)}
    whileHover={skipHeavyEffects ? {} : { scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}>{children}</motion.button>
);

const GlassButton = ({ children, onClick, className, skipHeavyEffects = false }: { children: React.ReactNode; onClick?: () => void; className?: string; skipHeavyEffects?: boolean }) => (
  <motion.button className={cn("relative px-6 py-3 rounded-full font-semibold bg-white/5 text-white border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300", !skipHeavyEffects && "backdrop-blur-xl", className)}
    whileHover={skipHeavyEffects ? {} : { scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}>{children}</motion.button>
);

const MagneticButton = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.2);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.2);
  };
  return (
    <motion.div ref={ref} className={className} style={{ x, y }} onMouseMove={handleMouseMove} onMouseLeave={() => { x.set(0); y.set(0); }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}>{children}</motion.div>
  );
};

const TiltButton = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ rotateX: -y / 10, rotateY: x / 10 });
  };
  return (
    <motion.button
      ref={ref}
      className={cn("relative px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold transform-gpu", className)}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0 })}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

const DraggableButton = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const constraintsRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={constraintsRef} className="relative">
      <motion.button
        className={cn("relative cursor-grab active:cursor-grabbing", className)}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        whileDrag={{ scale: 1.1, zIndex: 100 }}
        onClick={onClick}
      >
        {children}
      </motion.button>
    </div>
  );
};

// ============================================================================
// CATEGORY D: TRADING-SPECIFIC VISUALS
// ============================================================================

const LiveTickerTape = ({ tickerData, skipHeavyEffects = false }: { tickerData: TickerItem[]; skipHeavyEffects?: boolean }) => {
  const tickerRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    
    let animationId: number;
    let position = 0;
    const speed = 0.1; // pixels per frame - much slower for readability
    
    const animate = () => {
      position -= speed;
      const halfWidth = ticker.scrollWidth / 2;
      
      // Reset seamlessly when first half is scrolled
      if (Math.abs(position) >= halfWidth) {
        position = 0;
      }
      
      ticker.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [tickerData]);
  
  return (
    <div 
      className="w-full overflow-hidden bg-black rounded-lg sm:rounded-xl"
      style={{ 
        border: '2px solid rgba(59, 130, 246, 0.6)',
        boxShadow: skipHeavyEffects ? 'none' : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.2), inset 0 0 15px rgba(59, 130, 246, 0.1)',
      }}
    >
      <div 
        ref={tickerRef}
        className="flex whitespace-nowrap py-2"
        style={{ willChange: 'transform' }}
      >
        {[...tickerData, ...tickerData].map((item, i) => (
          <span key={i} className="mx-8 flex items-center gap-2 text-sm font-mono">
            <span style={{ color: '#60a5fa', textShadow: skipHeavyEffects ? 'none' : '0 0 5px #60a5fa, 0 0 10px #3b82f6' }}>{item.symbol}</span>
            <span style={{ color: '#fff', textShadow: skipHeavyEffects ? 'none' : '0 0 5px #fff, 0 0 10px #93c5fd' }}>${item.price}</span>
            <span style={{ 
              color: item.positive ? '#4ade80' : '#f87171', 
              textShadow: skipHeavyEffects ? 'none' : (item.positive ? '0 0 5px #4ade80, 0 0 10px #22c55e' : '0 0 5px #f87171, 0 0 10px #ef4444')
            }}>{item.change}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const BullPulse = () => (
  <svg className="absolute left-0 right-0 h-8 top-1/2 -translate-y-1/2 opacity-20" preserveAspectRatio="none">
    <motion.path d="M0,20 L50,20 L60,5 L70,35 L80,15 L90,25 L100,20 L150,20 L160,5 L170,35 L180,15 L190,25 L200,20 L250,20"
      fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1] }} transition={{ duration: 2, repeat: Infinity }} />
  </svg>
);

const LiveUserCount = () => {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 30) + 10); // Start between 10-40
  useEffect(() => { 
    const interval = setInterval(() => {
      setCount(prev => {
        // Random walk with bounds 1-50
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newCount = prev + change;
        return Math.max(1, Math.min(50, newCount));
      });
    }, 4000 + Math.random() * 3000); // Random interval 4-7 seconds
    return () => clearInterval(interval); 
  }, []);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-green-400 font-mono">{count}</span>
      <span className="text-white/60">online</span>
    </span>
  );
};

const ExecutionSpeed = () => (
  <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /><span className="text-blue-400">12ms</span><span className="text-white/40">Execution</span>
  </motion.div>
);

// ============================================================================
// CATEGORY E: GLASS COMPONENTS
// ============================================================================

const GlassCard = ({ children, className, skipHeavyEffects = false }: { children: React.ReactNode; className?: string; skipHeavyEffects?: boolean }) => (
  <div className={cn("relative rounded-2xl overflow-hidden bg-white/5 border border-white/10", !skipHeavyEffects && "backdrop-blur-[20px] backdrop-saturate-[180%] shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]", className)}>
    <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none"><div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20" /></div>
    {children}
  </div>
);

const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
  <GlassCard className="p-4">
    <div className="flex items-center justify-between mb-2"><span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>{icon}</div>
    <p className="text-2xl font-bold text-white font-mono">{typeof value === 'number' ? <SlotMachineNumber value={value} /> : value}</p>
  </GlassCard>
);

// ============================================================================
// CATEGORY F: MOTION & PHYSICS
// ============================================================================

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 origin-left z-[100]" style={{ scaleX }} />;
};

const RubberBandEntry = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15, delay }}>{children}</motion.div>
);

const VelocitySkewText = ({ children }: { children: React.ReactNode }) => {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skewX = useTransform(scrollVelocity, [-1000, 0, 1000], [-5, 0, 5]);
  const smoothSkew = useSpring(skewX, { stiffness: 100, damping: 30 });
  return <motion.div style={{ skewX: smoothSkew }}>{children}</motion.div>;
};

// ============================================================================
// CATEGORY G: SPLINE COMPONENTS
// ============================================================================

const SplineSceneEmbed = React.memo(({ preferViewer, runtimeUrl, viewerUrl }: { preferViewer: boolean; runtimeUrl: string; viewerUrl: string }) => {
  const viewerReady = useSplineViewerScript();
  const [forceIframeFallback, setForceIframeFallback] = useState(false);
  const [isBatterySaving, setIsBatterySaving] = useState(false); // NEW: Battery saver state
  
  // BATTERY SAVER - Stop rendering when screensaver is active
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFreeze = () => {
      console.log('[HeroDesktop SplineSceneEmbed] 🔋 Battery saver active');
      setIsBatterySaving(true);
    };
    
    const handleUnfreeze = () => {
      console.log('[HeroDesktop SplineSceneEmbed] ⚡ Battery saver off');
      setIsBatterySaving(false);
    };
    
    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);
    window.addEventListener('bullmoney-spline-dispose', handleFreeze);
    window.addEventListener('bullmoney-spline-restore', handleUnfreeze);
    
    return () => {
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
      window.removeEventListener('bullmoney-spline-dispose', handleFreeze);
      window.removeEventListener('bullmoney-spline-restore', handleUnfreeze);
    };
  }, []);
  
  useEffect(() => { setForceIframeFallback(false); }, [runtimeUrl]);
  
  useEffect(() => {
    if (!preferViewer || typeof window === "undefined") return;
    const handleViewerError = (event: ErrorEvent) => {
      if (event?.message?.includes("Data read, but end of buffer not reached") && event?.filename?.includes("@splinetool/viewer")) {
        setForceIframeFallback(true);
      }
    };
    window.addEventListener("error", handleViewerError);
    return () => window.removeEventListener("error", handleViewerError);
  }, [preferViewer, runtimeUrl]);
  
  const shouldUseViewer = preferViewer && viewerReady && !forceIframeFallback;
  
  // BATTERY SAVER: Don't render Spline when saving battery
  if (isBatterySaving) {
    return (
      <div 
        className="spline-viewport-fill" 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          overflow: "hidden", 
          zIndex: 0,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔋</div>
          <div>Battery Saver Active</div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="spline-viewport-fill" 
      style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        overflow: "hidden", 
        zIndex: 0,
        transform: 'translate3d(0,0,0)',
        willChange: 'transform',
      }}
    >
      {shouldUseViewer ? (
        // @ts-ignore
        <spline-viewer 
          url={runtimeUrl} 
          loading="lazy" 
          events-target="global" 
          style={{ 
            width: '100%', 
            height: '100%', 
            border: "none", 
            background: "transparent",
            display: 'block',
          }} 
        />
      ) : (
        <div className="spline-iframe-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          <iframe 
            src={viewerUrl} 
            title="BullMoney hero scene" 
            frameBorder="0" 
            allow="fullscreen; autoplay; xr-spatial-tracking" 
            loading="lazy"
            style={{ 
              width: '100%', 
              height: 'calc(100% + 60px)', 
              position: "absolute", 
              top: 0, 
              left: 0, 
              border: "none",
              display: 'block',
              marginBottom: '-60px',
            }} 
          />
        </div>
      )}
    </div>
  );
});
SplineSceneEmbed.displayName = "SplineSceneEmbed";

const HeroVideoEmbed = ({ videoId, muted }: { videoId: string; muted: boolean }) => {
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: muted ? '1' : '0',
      controls: '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      loop: '1',
      playlist: videoId,
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, muted]);

  return (
    <iframe
      key={embedUrl}
      src={embedUrl}
      title="Featured trading video"
      className="absolute inset-0 w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      frameBorder="0"
      loading="lazy"
      style={{ backgroundColor: 'black' }}
    />
  );
};

const SplineLoadingPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black">
    <motion.div className="w-24 h-24 border-2 border-blue-500/50" animate={{ rotateY: 360, rotateX: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d' }} />
  </div>
);

const SceneGlitchOverlay = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div className="absolute inset-0 z-50 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
        <div className="absolute inset-0 bg-blue-500/20" /><div className="absolute inset-0 bg-red-500/10 translate-x-1" /><div className="absolute inset-0 bg-green-500/10 -translate-x-1" />
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// CATEGORY H: MICRO-DETAILS
// ============================================================================

const CustomCursor = () => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => { cursorX.set(e.clientX); cursorY.set(e.clientY); };
    const handleHoverStart = () => setIsHovering(true);
    const handleHoverEnd = () => setIsHovering(false);
    window.addEventListener('mousemove', moveCursor);
    document.querySelectorAll('button, a').forEach(el => { el.addEventListener('mouseenter', handleHoverStart); el.addEventListener('mouseleave', handleHoverEnd); });
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.querySelectorAll('button, a').forEach(el => { el.removeEventListener('mouseenter', handleHoverStart); el.removeEventListener('mouseleave', handleHoverEnd); });
    };
  }, [cursorX, cursorY]);
  return (
    <>
      <motion.div className="fixed top-0 left-0 w-4 h-4 border-2 border-blue-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }} animate={{ scale: isHovering ? 1.5 : 1 }} />
      <motion.div className="fixed top-0 left-0 w-8 h-8 bg-blue-500/20 rounded-full pointer-events-none z-[9998] blur-sm"
        style={{ x: useSpring(cursorX, { stiffness: 100, damping: 20 }), y: useSpring(cursorY, { stiffness: 100, damping: 20 }), translateX: '-50%', translateY: '-50%' }} />
    </>
  );
};

const LocalClock = ({ timezone }: { timezone?: string }) => {
  const [time, setTime] = useState('');
  const [tz, setTz] = useState('LOCAL');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      if (timezone) {
        // Extract short timezone name (e.g., "America/New_York" -> "EST")
        const tzAbbr = timezone.split('/').pop()?.replace(/_/g, ' ') || 'LOCAL';
        setTz(tzAbbr.length > 6 ? tzAbbr.slice(0, 6) : tzAbbr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);
  
  return <div className="font-mono text-xs text-white/40"><span className="text-blue-400">{tz}</span> {time}</div>;
};

const SystemStatus = ({ deviceInfo }: { deviceInfo?: { browser: string; os: string; device: string } | null }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    <span className="text-white/40 font-mono">{deviceInfo?.os || 'System'}:</span>
    <span className="text-green-400 font-mono">{deviceInfo?.browser || 'Online'}</span>
  </div>
);

const CopyToClipboard = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">{copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}</button>;
};

// ============================================================================
// CATEGORY I: AUDIO
// ============================================================================

const useAudioEffects = (enabled: boolean) => {
  const audioContext = useRef<AudioContext | null>(null);
  const initAudio = useCallback(() => {
    if (!audioContext.current && typeof window !== 'undefined') audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext.current;
  }, []);
  const playClick = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  }, [enabled, initAudio]);
  const playHover = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  }, [enabled, initAudio]);
  const playWhoosh = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth'; filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  }, [enabled, initAudio]);
  const playSuccess = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
      osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  }, [enabled, initAudio]);
  const playTyping = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
  }, [enabled, initAudio]);
  const playBassDrop = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  }, [enabled, initAudio]);
  const playStartup = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    // BIOS-style boot sequence
    const frequencies = [440, 554.37, 659.25, 880];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.1);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.1);
    });
  }, [enabled, initAudio]);
  const playBuzz = useCallback(() => {
    if (!enabled) return;
    const ctx = initAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  }, [enabled, initAudio]);
  return { playClick, playHover, playWhoosh, playSuccess, playTyping, playBassDrop, playStartup, playBuzz };
};

const MuteToggle = ({ muted, onToggle }: { muted: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="relative p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
    {muted ? <VolumeX className="w-5 h-5 text-white/40" /> : (
      <><Volume2 className="w-5 h-5 text-blue-400" />
        <div className="absolute -top-1 -right-1 flex gap-[2px]">
          {[...Array(3)].map((_, i) => <motion.div key={i} className="w-[2px] bg-blue-400 rounded-full" animate={{ height: [4, 8, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />)}
        </div>
      </>
    )}
  </button>
);

// ============================================================================
// CATEGORY J: OVER THE TOP
// ============================================================================

const Confetti = ({ active }: { active: boolean }) => {
  const particles = useMemo(() => Array.from({ length: 100 }, (_, i) => ({ id: i, x: Math.random() * 100, color: i % 2 === 0 ? '#3b82f6' : '#1e3a8a', delay: Math.random() * 0.5, rotation: Math.random() * 360 })), []);
  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div key={p.id} className="absolute w-3 h-3" style={{ left: `${p.x}%`, backgroundColor: p.color, rotate: p.rotation }}
              initial={{ y: -20, opacity: 1 }} animate={{ y: '100vh', opacity: 0, rotate: p.rotation + 720 }} exit={{ opacity: 0 }} transition={{ duration: 3, delay: p.delay, ease: 'easeOut' }} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

const WarpSpeed = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div className="fixed inset-0 z-[9999] bg-black pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{ left: `${50 + (Math.random() - 0.5) * 100}%`, top: `${50 + (Math.random() - 0.5) * 100}%` }}
            animate={{ x: (Math.random() - 0.5) * 2000, y: (Math.random() - 0.5) * 2000, width: [1, 100], opacity: [1, 0] }} transition={{ duration: 1, ease: 'easeIn' }} />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

const GodModeOverlay = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div className="fixed inset-0 z-[9998] pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-yellow-500/20" />
        <motion.div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-500 text-black font-bold rounded-full" initial={{ y: -50 }} animate={{ y: 0 }}>🏆 GOD MODE ACTIVATED</motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// CONTEXT IMPORTS
// ============================================================================

import { useHeroSceneModalUI, useUIState as useGlobalUIState } from "@/contexts/UIStateContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import HiddenYoutubePlayer from "@/components/Mainpage/HiddenYoutubePlayer";
import { ALL_THEMES } from "@/constants/theme-data";
import type { SoundProfile } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";

// ============================================================================
// MAIN HERO DESKTOP COMPONENT
// ============================================================================

const HeroDesktop = () => {
  // Mobile performance optimization
  const { shouldSkipHeavyEffects, shouldDisableBackdropBlur, shouldDisableBoxShadows } = useMobilePerformance();
  
  const sceneUrls = useMemo(() => HERO_SPLINE_SCENES.map(s => s.runtimeUrl), []);
  useSplinePreload({ sceneUrls, priority: 'high', delay: 0 });
  useEnsureSplineViewer();
  
  const mousePosition = useMousePosition();
  const mouseTrail = useMouseTrail(15);
  const geoLocation = useGeoLocation();
  const deviceInfo = useDeviceInfo();
  const tickerData = useRealTimePrices();
  const { isAnyModalOpen, activeComponent } = useGlobalUIState();
  const { scene: heroSplineScene, label: heroSplineSceneLabel, source: heroSplineSource, advanceScene: advanceHeroSplineScene, setSceneById: setHeroSplineSceneManually } = useHeroSplineSource();
  const { isOpen: isHeroSceneModalOpen, setIsOpen: setHeroSceneModalOpen } = useHeroSceneModalUI();
  
  const [scenePreviewId, setScenePreviewId] = useState(heroSplineScene);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isUIHovered, setIsUIHovered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWarp, setShowWarp] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [gravityMode, setGravityMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [hasPlayedStartup, setHasPlayedStartup] = useState(false);
  const [isSplineFullscreen, setIsSplineFullscreen] = useState(false);
  const heroVideoIds = useMemo(() => DISCORD_STAGE_FEATURED_VIDEOS.map((src) => normalizeYouTubeId(src)).filter(Boolean) as string[], []);
  const [heroMediaMode, setHeroMediaMode] = useState<'spline' | 'video'>(() => (heroVideoIds.length && Math.random() < 0.5 ? 'video' : 'spline'));
  const [activeVideoIndex, setActiveVideoIndex] = useState(() => (heroVideoIds.length ? Math.floor(Math.random() * heroVideoIds.length) : 0));
  const activeVideoId = heroMediaMode === 'video' && heroVideoIds.length
    ? heroVideoIds[(activeVideoIndex % heroVideoIds.length + heroVideoIds.length) % heroVideoIds.length]
    : null;

  useEffect(() => {
    if (!heroVideoIds.length && heroMediaMode === 'video') {
      setHeroMediaMode('spline');
    }
  }, [heroVideoIds.length, heroMediaMode]);

  const cycleHeroMedia = useCallback((reason: string = 'auto') => {
    const shouldShowVideo = heroVideoIds.length > 0 && Math.random() < 0.5;
    if (shouldShowVideo) {
      setHeroMediaMode('video');
      setActiveVideoIndex(Math.floor(Math.random() * heroVideoIds.length));
    } else {
      setHeroMediaMode('spline');
      advanceHeroSplineScene(reason);
    }
  }, [heroVideoIds.length, advanceHeroSplineScene]);
  
  const { playClick, playHover, playWhoosh, playSuccess, playTyping, playBassDrop, playStartup, playBuzz } = useAudioEffects(audioEnabled);
  useKonamiCode(() => { setGodMode(true); playSuccess(); setTimeout(() => setGodMode(false), 10000); });

  // Navigate to previous spline scene
  const goToPreviousScene = useCallback(() => {
    if (heroMediaMode === 'video' && heroVideoIds.length) {
      setHeroMediaMode('video');
      setActiveVideoIndex((prev) => (prev - 1 + heroVideoIds.length) % heroVideoIds.length);
      playWhoosh();
      return;
    }
    const currentIndex = HERO_SPLINE_SCENES.findIndex(s => s.id === heroSplineScene);
    const prevIndex = currentIndex <= 0 ? HERO_SPLINE_SCENES.length - 1 : currentIndex - 1;
    const prevScene = HERO_SPLINE_SCENES[prevIndex];
    setHeroMediaMode('spline');
    setIsGlitching(true);
    playWhoosh();
    setTimeout(() => {
      setHeroSplineSceneManually(prevScene.id, 'keyboard-nav');
      setIsGlitching(false);
    }, 150);
  }, [heroMediaMode, heroVideoIds.length, heroSplineScene, setHeroSplineSceneManually, playWhoosh]);

  // Navigate to next spline scene
  const goToNextScene = useCallback(() => {
    if (heroMediaMode === 'video' && heroVideoIds.length) {
      setHeroMediaMode('video');
      setActiveVideoIndex((prev) => (prev + 1) % heroVideoIds.length);
      playWhoosh();
      return;
    }
    const currentIndex = HERO_SPLINE_SCENES.findIndex(s => s.id === heroSplineScene);
    const nextIndex = (currentIndex + 1) % HERO_SPLINE_SCENES.length;
    const nextScene = HERO_SPLINE_SCENES[nextIndex];
    setHeroMediaMode('spline');
    setIsGlitching(true);
    playWhoosh();
    setTimeout(() => {
      setHeroSplineSceneManually(nextScene.id, 'keyboard-nav');
      setIsGlitching(false);
    }, 150);
  }, [heroMediaMode, heroVideoIds.length, heroSplineScene, setHeroSplineSceneManually, playWhoosh]);

  // Keyboard shortcuts - added arrow keys for spline navigation
  useKeyboardShortcuts([
    { key: 's', callback: () => { playClick(); handleOpenScenePicker(); } },
    { key: 'g', callback: () => { playBuzz(); setGravityMode(prev => !prev); } },
    { key: 'm', callback: () => setAudioEnabled(prev => !prev) },
    { key: 'arrowleft', callback: goToPreviousScene },
    { key: 'arrowright', callback: goToNextScene },
    { key: '[', callback: goToPreviousScene },
    { key: ']', callback: goToNextScene },
  ]);

  // Play startup sound on first load
  useEffect(() => {
    if (!hasPlayedStartup && audioEnabled) {
      const timer = setTimeout(() => { playStartup(); setHasPlayedStartup(true); }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedStartup, audioEnabled, playStartup]);

  // Play bass drop when button appears
  useEffect(() => {
    if (splineLoaded && audioEnabled) {
      const timer = setTimeout(() => playBassDrop(), 1500);
      return () => clearTimeout(timer);
    }
  }, [splineLoaded, audioEnabled, playBassDrop]);

  const uiStateModalChangeInitRef = useRef(false);
  useEffect(() => { if (typeof window === "undefined") return; const interval = window.setInterval(() => cycleHeroMedia("interval"), 120000); return () => window.clearInterval(interval); }, [cycleHeroMedia]);
  useEffect(() => { if (!uiStateModalChangeInitRef.current) { uiStateModalChangeInitRef.current = true; return; } cycleHeroMedia("ui-state-change"); }, [isAnyModalOpen, activeComponent, cycleHeroMedia]);

  const { activeThemeId, accentColor } = useGlobalTheme();
  const [isMuted, setIsMuted] = useState(false);
  const [currentSound, setCurrentSound] = useState<SoundProfile>('MECHANICAL');
  const audioProfile = currentSound === 'MECHANICAL' || currentSound === 'SOROS' || currentSound === 'SCI-FI' || currentSound === 'SILENT' ? currentSound : 'MECHANICAL';
  useAudioEngine(!isMuted, audioProfile);

  useEffect(() => {
    const savedSound = localStorage.getItem('bullmoney_sound_profile') as SoundProfile | null;
    const savedMuted = localStorage.getItem('bullmoney_muted');
    if (savedSound) setCurrentSound(savedSound);
    if (savedMuted === 'true') setIsMuted(true);
  }, []);

  const currentTheme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  const isVideoMode = heroMediaMode === 'video' && !!activeVideoId;
  const mediaLabel = isVideoMode
    ? `Featured Video ${activeVideoIndex + 1}/${heroVideoIds.length || 1}`
    : heroSplineSceneLabel;
  const mediaBadge = isVideoMode ? 'VIDEO' : 'SPLINE';
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  useEffect(() => { const calcSize = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight }); calcSize(); window.addEventListener('resize', calcSize); return () => window.removeEventListener('resize', calcSize); }, []);
  useEffect(() => { const timer = setTimeout(() => setSplineLoaded(true), 2000); return () => clearTimeout(timer); }, [heroSplineScene]);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const horizontalScroll = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const splineScrollProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [scrollProgressValue, setScrollProgressValue] = useState(0);
  useEffect(() => {
    const unsubscribe = splineScrollProgress.on('change', (v) => setScrollProgressValue(v));
    return () => unsubscribe();
  }, [splineScrollProgress]);

  const handleOpenScenePicker = useCallback(() => {
    setHeroMediaMode('spline');
    setScenePreviewId(heroSplineScene);
    setHeroSceneModalOpen(true);
    playWhoosh();
  }, [heroSplineScene, setHeroSceneModalOpen, playWhoosh]);
  const previewScene = useMemo(() => HERO_SPLINE_SCENES.find((s) => s.id === scenePreviewId) ?? heroSplineSource, [scenePreviewId, heroSplineSource]);
  useEffect(() => { setScenePreviewId(heroSplineScene); }, [heroSplineScene]);
  const handleSceneSelect = useCallback((sceneId: string) => {
    if (!sceneId) return;
    setHeroMediaMode('spline');
    setIsGlitching(true); playClick();
    setTimeout(() => { setHeroSplineSceneManually(sceneId, "user-select"); setScenePreviewId(sceneId); setHeroSceneModalOpen(false); setIsGlitching(false); }, 300);
  }, [setHeroSplineSceneManually, setHeroSceneModalOpen, playClick]);
  const handleGetStarted = () => { playClick(); setShowConfetti(true); setShowWarp(true); setTimeout(() => { setShowConfetti(false); setShowWarp(false); window.location.href = '/VIP'; }, 1500); };

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .animate-shimmer { animation: shimmer 3s linear infinite; }
        ::selection { background: #22d3ee; color: #000; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #60a5fa; }
        .hero-section { cursor: none; }
        .hero-section button, .hero-section a { cursor: none; }
        .metallic-text {
          background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 25%, #a0a0a0 50%, #d0d0d0 75%, #9090a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .breathing-text { animation: breathe 2s ease-in-out infinite; }
        .glass-morphism-2 {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
      `}</style>

      {/* Removed: CustomCursor, CursorTrail, ScrollProgressBar for performance */}
      {/* Removed: Confetti, WarpSpeed, GodModeOverlay for performance */}
      {currentTheme?.youtubeId && <HiddenYoutubePlayer videoId={currentTheme.youtubeId} isPlaying={!isMuted} volume={isMuted ? 0 : 15} />}

      <div ref={ref} className="relative min-h-[100dvh] h-[100dvh] bg-black overflow-hidden hero-section" data-allow-scroll data-content data-theme-aware data-hero>
        {/* Removed all background animations for cleaner look */}
        <VignetteOverlay />



        <GravityMode active={gravityMode}>
          <motion.div className="relative z-20 pt-[12vh] sm:pt-[18vh] lg:pt-[20vh]" style={{ x: horizontalScroll }} onMouseEnter={() => setIsUIHovered(true)} onMouseLeave={() => setIsUIHovered(false)}>
            <div className="px-4 sm:px-6 lg:px-12 w-full sm:max-w-7xl mx-auto min-h-auto sm:min-h-[calc(100dvh-18vh)] lg:h-[calc(100dvh-20vh)] flex flex-col justify-start lg:justify-center">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8 items-center lg:items-center">
                <div className="lg:col-span-6 relative order-1 lg:order-1 mb-2 lg:mb-0 text-center lg:text-left">
                  <VelocitySkewText>
                    <MaskedText delay={0.2}>
                      <p 
                        className="font-mono text-[10px] sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-1 sm:mb-4"
                        style={{
                          color: '#60a5fa',
                          textShadow: shouldSkipHeavyEffects ? 'none' : `0 0 5px #60a5fa, 0 0 10px #60a5fa, 0 0 20px #3b82f6, 0 0 40px #3b82f6`,
                        }}
                      >
                        EST. 2024 • TRADING EXCELLENCE
                      </p>
                    </MaskedText>
                    <MaskedText delay={0.4}>
                      <h1 className="relative">
                        <span 
                          className="block text-[clamp(2rem,5vw,4.5rem)] font-sans font-normal tracking-tight leading-tight"
                          style={{
                            color: '#fff',
                            textShadow: shouldSkipHeavyEffects ? 'none' : `0 0 5px #fff, 0 0 10px #fff, 0 0 20px #93c5fd, 0 0 40px #60a5fa, 0 0 60px #3b82f6`,
                          }}
                        >
                          The path to
                        </span>
                        <span 
                          className="block text-[clamp(2.25rem,6vw,5.5rem)] font-serif italic mt-1 sm:mt-2 leading-tight"
                          style={{ 
                            color: '#3b82f6',
                            textShadow: shouldSkipHeavyEffects ? 'none' : `0 0 5px #3b82f6, 0 0 15px #3b82f6, 0 0 30px #2563eb, 0 0 50px #1d4ed8, 0 0 70px #1e40af`,
                          }}
                        >
                          consistent profit
                        </span>
                      </h1>
                    </MaskedText>
                  </VelocitySkewText>
                  <p 
                    className="mt-2 sm:mt-6 text-xs sm:text-base md:text-lg max-w-md leading-relaxed hidden sm:block mx-auto lg:mx-0"
                    style={{
                      color: 'rgba(147, 197, 253, 0.8)',
                      textShadow: shouldSkipHeavyEffects ? 'none' : `0 0 5px rgba(147, 197, 253, 0.5), 0 0 10px rgba(96, 165, 250, 0.3)`,
                    }}
                  >
                    Join <span className="font-semibold" style={{ color: '#fff', textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 5px #fff, 0 0 10px #93c5fd' }}>500+</span> profitable traders. Real-time Trades, expert analysis, and a community built for success.
                  </p>
                </div>

                <div className="lg:col-span-6 order-2 lg:order-2 mt-12 lg:mt-0">
                  <div className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-[4/3] max-h-[40vh] sm:max-h-[40vh] lg:max-h-[60vh] rounded-xl sm:rounded-2xl overflow-hidden bg-black border-2 border-blue-500/60" style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : '0 0 10px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1)' }}>
                    {isVideoMode && activeVideoId ? (
                      <HeroVideoEmbed videoId={activeVideoId} muted={isMuted} />
                    ) : (
                      <SplineSceneEmbed 
                        key={heroSplineScene} 
                        preferViewer={heroSplineSource.preferViewer !== false} 
                        runtimeUrl={heroSplineSource.runtimeUrl} 
                        viewerUrl={heroSplineSource.viewerUrl} 
                      />
                    )}
                    
                    {/* Bottom navigation overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10">
                      <div className="flex items-center justify-between">
                        <motion.button 
                          onClick={goToPreviousScene} 
                          className="p-1.5 sm:p-2 rounded-lg bg-black/50 border border-blue-500/50 transition-colors"
                          style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 10px rgba(59, 130, 246, 0.2)' }}
                          whileHover={shouldSkipHeavyEffects ? {} : { boxShadow: '0 0 15px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.3)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-xs sm:text-sm" style={{ color: '#60a5fa', textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 5px #60a5fa, 0 0 10px #3b82f6' }}>←</span>
                        </motion.button>
                        <motion.button 
                          onClick={() => { setIsSplineFullscreen(true); playClick(); }} 
                          className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/50 border border-blue-500/50 transition-colors flex items-center gap-1.5 sm:gap-2"
                          style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 10px rgba(59, 130, 246, 0.2)' }}
                          whileHover={shouldSkipHeavyEffects ? {} : { boxShadow: '0 0 15px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.3)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500 animate-pulse" style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : '0 0 5px #3b82f6, 0 0 10px #3b82f6' }} />
                          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-blue-300/80">{mediaBadge}</span>
                          <span className="text-xs sm:text-sm font-mono truncate max-w-[120px] sm:max-w-none" style={{ color: '#60a5fa', textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 5px #60a5fa, 0 0 10px #3b82f6' }}>{mediaLabel}</span>
                        </motion.button>
                        <motion.button 
                          onClick={goToNextScene} 
                          className="p-1.5 sm:p-2 rounded-lg bg-black/50 border border-blue-500/50 transition-colors"
                          style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 10px rgba(59, 130, 246, 0.2)' }}
                          whileHover={shouldSkipHeavyEffects ? {} : { boxShadow: '0 0 15px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.3)' }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-xs sm:text-sm" style={{ color: '#60a5fa', textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 5px #60a5fa, 0 0 10px #3b82f6' }}>→</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  {/* Live ticker under spline */}
                  <div className="w-full mt-2">
                    <LiveTickerTape tickerData={tickerData} skipHeavyEffects={shouldSkipHeavyEffects} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </GravityMode>
      </div>

      <AnimatePresence>
        {isHeroSceneModalOpen && (
          <motion.div className={cn("fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 py-6", !shouldSkipHeavyEffects && "backdrop-blur-sm")}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setHeroSceneModalOpen(false); playWhoosh(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={cn("relative w-full max-w-4xl bg-neutral-950/90 text-white border border-white/10 rounded-3xl shadow-2xl overflow-hidden", !shouldSkipHeavyEffects && "backdrop-blur-xl")} onClick={(e) => e.stopPropagation()}>
              <ReflectiveBorder className="rounded-3xl" skipHeavyEffects={shouldSkipHeavyEffects}>
                <div className="p-1">
                  <div className="flex flex-col lg:flex-row">
                    <div className="w-full lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-white/10 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto">
                      <h3 className="text-lg font-semibold tracking-wide uppercase text-white/70 mb-4">Select Scene</h3>
                      <div className="space-y-2">
                        {HERO_SPLINE_SCENES.map((scene) => (
                          <motion.button key={scene.id} onClick={() => setScenePreviewId(scene.id)} onHoverStart={playHover}
                            className={cn('w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                              scenePreviewId === scene.id ? 'bg-blue-500/20 text-white border-blue-500/50' : 'bg-white/5 text-white/80 border-white/10 hover:border-blue-500/30',
                              scenePreviewId === scene.id && !shouldSkipHeavyEffects && 'shadow-[0_0_20px_rgba(59,130,246,0.3)]')}
                            whileHover={shouldSkipHeavyEffects ? {} : { x: 4 }}>
                            <div><p className="font-semibold text-sm">{scene.label}</p><p className="text-xs text-white/40 font-mono">{scene.id}</p></div>
                            {scenePreviewId === scene.id && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="w-full lg:w-1/2 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div><p className="text-xs uppercase text-white/40 tracking-[0.3em]">Previewing</p><p className="text-lg font-semibold">{previewScene?.label}</p></div>
                        <div className="flex gap-2">
                          <motion.button onClick={() => handleSceneSelect(scenePreviewId)} className="px-4 py-2 rounded-full bg-blue-500 text-white font-semibold text-sm hover:bg-blue-400 transition-colors" whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }} whileTap={{ scale: 0.95 }}>Set Scene</motion.button>
                          <motion.button onClick={() => { setHeroSceneModalOpen(false); playWhoosh(); }} className="px-4 py-2 rounded-full border border-white/20 text-sm hover:bg-white/10 transition-colors" whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }} whileTap={{ scale: 0.95 }}>Close</motion.button>
                        </div>
                      </div>
                      <div className="relative flex-1 min-h-[300px] rounded-2xl bg-black border border-white/10 overflow-hidden">
                        <SplineSceneEmbed key={scenePreviewId} preferViewer={previewScene?.preferViewer !== false} runtimeUrl={previewScene?.runtimeUrl || heroSplineSource.runtimeUrl} viewerUrl={previewScene?.viewerUrl || heroSplineSource.viewerUrl} />
                      </div>
                    </div>
                  </div>
                </div>
              </ReflectiveBorder>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Spline Modal */}
      <AnimatePresence>
        {isSplineFullscreen && (
          <motion.div 
            className="fixed inset-2 sm:inset-4 top-16 sm:top-20 z-[9999] bg-black rounded-xl sm:rounded-2xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 20, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
          >
            {/* Fullscreen Spline or Video */}
            <div className="absolute inset-0">
              {isVideoMode && activeVideoId ? (
                <HeroVideoEmbed videoId={activeVideoId} muted={isMuted} />
              ) : (
                <SplineSceneEmbed 
                  key={`fullscreen-${heroSplineScene}`} 
                  preferViewer={heroSplineSource.preferViewer !== false} 
                  runtimeUrl={heroSplineSource.runtimeUrl} 
                  viewerUrl={heroSplineSource.viewerUrl} 
                />
              )}
            </div>
            
            {/* Top bar with scene name and controls */}
            <motion.div 
              className="absolute top-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-b from-black/80 to-transparent z-10"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-white font-mono text-sm sm:text-lg truncate max-w-[150px] sm:max-w-none">{mediaLabel}</span>
                </div>
                <motion.button 
                  onClick={() => { setIsSplineFullscreen(false); playWhoosh(); }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2"
                  whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>✕</span>
                  <span className="hidden sm:inline">Close</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Bottom navigation */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent z-10"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
                <motion.button 
                  onClick={() => { goToPreviousScene(); playClick(); }}
                  className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                  whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-base sm:text-lg">←</span>
                </motion.button>
                <motion.button 
                  onClick={() => { setHeroMediaMode('spline'); handleOpenScenePicker(); setIsSplineFullscreen(false); }}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 text-sm sm:text-base font-medium transition-colors"
                  whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="hidden sm:inline">Browse Scenes</span>
                  <span className="sm:hidden">Scenes</span>
                </motion.button>
                <motion.button 
                  onClick={() => { goToNextScene(); playClick(); }}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                  whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-lg">→</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeroDesktop;
