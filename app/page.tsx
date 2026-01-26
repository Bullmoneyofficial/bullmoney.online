"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { detectBrowser } from "@/lib/browserDetection";
import { trackEvent, BullMoneyAnalytics } from "@/lib/analytics";

// Neon Blue Styles
const NEON_STYLES = `
  @keyframes neon-pulse {
    0%, 100% { 
      text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #3b82f6, 0 0 12px #3b82f6;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow {
    0%, 100% { 
      box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6;
    }
    50% { 
      box-shadow: 0 0 6px #3b82f6, 0 0 12px #3b82f6, inset 0 0 6px #3b82f6;
    }
  }

  .neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
    animation: neon-pulse 2s ease-in-out infinite;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-blue-border {
    border: 2px solid #3b82f6;
    box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6;
  }
`;

// ✅ MOBILE DETECTION - Conditional lazy loading for mobile optimization
import { isMobileDevice } from "@/lib/mobileDetection";

// ✅ LOADING FALLBACKS - Mobile-optimized loading states
import {
  HeroSkeleton,
  FeaturesSkeleton,
  MinimalFallback,
  ContentSkeleton,
  CardSkeleton,
} from "@/components/MobileLazyLoadingFallback";

// ==========================================
// ✅ MOBILE-OPTIMIZED LAZY LOADING - All components lazy loaded for mobile performance
// ==========================================
const Hero = dynamic(
  () => import("@/components/hero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

// Desktop-optimized Hero with new layout
const HeroDesktop = dynamic(
  () => import("@/components/HeroDesktop"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

const CTA = dynamic(
  () => import("@/components/Chartnews"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

import { Features } from "@/components/features";

// UNIFIED SHIMMER SYSTEM - Import from single source
import {
  ShimmerBorder,
  ShimmerLine,
  ShimmerSpinner,
  ShimmerDot,
  ShimmerFloat,
  ShimmerRadialGlow,
  ShimmerContainer
} from "@/components/ui/UnifiedShimmer";

const SplineSkeleton = dynamic(
  () => import("@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.SplineSkeleton })),
  { ssr: true }
);

const LoadingSkeleton = dynamic(
  () => import("@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.LoadingSkeleton })),
  { ssr: true }
);

import { useCacheContext } from "@/components/CacheManagerProvider";
import { useUnifiedPerformance, useVisibility, useObserver, useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking, useCrashTracker } from "@/lib/CrashTracker";
import { useScrollOptimization } from "@/hooks/useScrollOptimization";
import { useBigDeviceScrollOptimizer } from "@/lib/bigDeviceScrollOptimizer";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
const FeaturesLazy = dynamic(
  () => import("@/components/features").then(mod => ({ default: mod.Features })),
  { ssr: false, loading: () => <FeaturesSkeleton /> }
);

// Use optimized ticker for 120Hz performance - lazy load
const LiveMarketTicker = dynamic(
  () => import("@/components/LiveMarketTickerOptimized").then(mod => ({ default: mod.LiveMarketTickerOptimized })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useUIState } from "@/contexts/UIStateContext";
import { DISCORD_STAGE_FEATURED_VIDEOS } from "@/components/TradingQuickAccess";

const HiddenYoutubePlayer = dynamic(
  () => import("@/components/Mainpage/HiddenYoutubePlayer"),
  { ssr: false }
);

import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";
import Link from "next/link";

// Import dev utilities
import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

// Legacy flag placeholder to satisfy stale client bundles that may reference it during Fast Refresh.
const desktopHeroVariant = "spline";

// Import loaders - lazy
const PageMode = dynamic(
  () => import("@/components/REGISTER USERS/pagemode"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

// ✅ NEW INTERACTIVE LOADER - Neon blue trading unlock experience
const TradingUnlockLoader = dynamic(
  () => import("@/components/MultiStepLoaderv3"),
  { 
    ssr: false, 
    loading: () => <MinimalFallback />,
  }
);

// Lazy imports for heavy 3D components - LOADED IMMEDIATELY for better scene performance
const DraggableSplit = dynamic(
  () => import('@/components/DraggableSplit'),
  { ssr: true, loading: () => <ContentSkeleton lines={5} /> }
);

const SplineScene = dynamic(
  () => import('@/components/SplineScene'),
  { ssr: true, loading: () => <ContentSkeleton lines={4} /> }
);

const TestimonialsCarousel = dynamic(
  () => import('@/components/Testimonial').then(mod => ({ default: mod.TestimonialsCarousel })),
  { ssr: true, loading: () => <CardSkeleton /> }
);

// Simple mobile-friendly YouTube embed wrapper for Discord modal videos
const normalizeYouTubeId = (input: string) => {
  if (!input) return 'Q3dSjSP3t8I';
  if (!input.includes('http')) return input;
  try {
    const u = new URL(input);
    if (u.searchParams.get('v')) return u.searchParams.get('v') as string;
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.pop() || 'Q3dSjSP3t8I';
  } catch {
    return input;
  }
};

function MobileDiscordHero({ sources, onOpenModal, variant = 'mobile' }: { sources: string[]; onOpenModal: () => void; variant?: 'mobile' | 'desktop' }) {
  const [index, setIndex] = useState(0);
  const videoId = normalizeYouTubeId(sources[index] || sources[0] || 'Q3dSjSP3t8I');
  const embed = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}&playsinline=1`;

  // Responsive container: auto-adjusts from smallest (320px) to largest mobile views
  // On mobile, content fills entire available space from top to bottom
  const containerClass = variant === 'mobile'
    ? "w-full max-w-5xl mx-auto px-2 xs:px-3 sm:px-4 h-full flex flex-col"
    : "w-full max-w-6xl mx-auto px-6 py-12 sm:py-16 min-h-[70vh] flex items-center";

  const cardMarginTop = variant === 'mobile' ? '' : 'mt-0';

  return (
    <div className={containerClass} data-theme-aware>
      <div className={`relative isolate overflow-hidden rounded-2xl xs:rounded-3xl border border-blue-500/40 bg-gradient-to-b from-[#050915]/90 via-[#050915]/95 to-black shadow-[0_0_30px_rgba(59,130,246,0.25)] backdrop-blur-xl p-3 xs:p-4 sm:p-5 md:p-8 flex flex-col gap-2 xs:gap-3 sm:gap-4 ${cardMarginTop} w-full h-full`}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.14), transparent 40%), radial-gradient(circle at 80% 10%, rgba(147,197,253,0.12), transparent 35%)' }} />
        <div className="absolute -inset-px rounded-2xl xs:rounded-3xl border border-blue-500/20 blur-[1px] pointer-events-none" />

      <div className="flex flex-col gap-1 xs:gap-2 text-center flex-shrink-0">
        <p
          className="font-mono text-[8px] xs:text-[9px] sm:text-[10px] tracking-[0.12em] xs:tracking-[0.15em] sm:tracking-[0.18em] uppercase"
          style={{
            color: '#60a5fa',
            textShadow: '0 0 5px #60a5fa, 0 0 10px #60a5fa, 0 0 20px #3b82f6, 0 0 40px #3b82f6',
          }}
        >
          EST. 2024 • TRADING EXCELLENCE
        </p>
        <div className="space-y-0.5 xs:space-y-1">
          <span
            className="block text-[clamp(1.4rem,6vw,3rem)] font-sans font-semibold tracking-tight leading-tight"
            style={{
              color: '#fff',
              textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #93c5fd, 0 0 40px #60a5fa, 0 0 60px #3b82f6',
            }}
          >
            The path to
          </span>
          <span
            className="block text-[clamp(1.6rem,7vw,3.6rem)] font-serif italic leading-tight"
            style={{
              color: '#3b82f6',
              textShadow: '0 0 5px #3b82f6, 0 0 15px #3b82f6, 0 0 30px #2563eb, 0 0 50px #1d4ed8, 0 0 70px #1e40af',
            }}
          >
            consistent profit
          </span>
        </div>
        <p
          className="text-xs xs:text-sm sm:text-base leading-relaxed max-w-2xl mx-auto px-1"
          style={{
            color: 'rgba(147, 197, 253, 0.82)',
            textShadow: '0 0 5px rgba(147, 197, 253, 0.5), 0 0 10px rgba(96, 165, 250, 0.3)',
          }}
        >
          Tap into live trade ideas, callouts, and coaching with 10,000+ traders. Join the community that shares real-time setups, risk plans, and recap videos so you can trade with confidence.
        </p>
      </div>

      <div className="relative rounded-xl xs:rounded-2xl overflow-hidden border border-blue-500/40 bg-black shadow-[0_0_18px_rgba(59,130,246,0.3)] flex-1 min-h-[120px]">
        <div className="relative w-full h-full">
          <iframe
            key={embed}
            src={embed}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title="BullMoney Discord Video"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 xs:p-3 bg-black/60 backdrop-blur">
          <button
            onClick={() => setIndex((prev) => (prev - 1 + sources.length) % sources.length)}
            className="px-2 xs:px-3 py-1 text-[10px] xs:text-xs font-semibold rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            Prev
          </button>
          <span className="text-white/80 text-[10px] xs:text-xs font-bold">
            {index + 1} / {Math.max(1, sources.length)}
          </span>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % sources.length)}
            className="px-2 xs:px-3 py-1 text-[10px] xs:text-xs font-semibold rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link
          href="https://t.me/addlist/gg09afc4lp45YjQ0"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-3 xs:px-4 py-1.5 xs:py-2 rounded-full border border-white/25 text-white font-semibold text-[10px] xs:text-xs sm:text-sm hover:bg-white/5"
        >
          Join Free Community
        </Link>
      </div>
      </div>
    </div>
  );
}

type RemoteSplineMeta = {
  id: string;
  title: string;
  subtitle?: string;
  viewer: string;
  runtime: string;
  accent?: string;
  badge?: string;
  aspectRatio?: string;
};

const DRAGGABLE_SPLIT_SCENES: Record<'glassCurtain' | 'orbScroll', RemoteSplineMeta> = {
  glassCurtain: {
    id: 'glassCurtain',
    runtime: "https://prod.spline.design/pERFMZP1PEeizk2N/scene.splinecode",
    viewer: "https://my.spline.design/glasscurtain-a6oJvU7009VpSevqPvEeVyI7/",
    title: "Market Depth Analyzer",
    subtitle: "Dual-chart order book monitoring",
    accent: '#38bdf8',
    aspectRatio: '4 / 3'
  },
  orbScroll: {
    id: 'orbScroll',
    runtime: "https://prod.spline.design/QfpAnXg8I-cL9KnC/scene.splinecode",
    viewer: "https://my.spline.design/orbscrolltriggerforhero-cukhAyxazfE0BSBUcFrD8NBf/",
    title: "Price Action Indicator",
    subtitle: "Real-time volatility tracking",
    accent: '#a855f7',
    aspectRatio: '4 / 3'
  }
};

const ADDITIONAL_SPLINE_PAGES: RemoteSplineMeta[] = [
  {
    id: 'followers-focus',
    title: 'Liquidity Scanner',
    subtitle: 'Live trading signal detection network',
    viewer: 'https://my.spline.design/100followersfocus-55tpQJYDbng5lAQ3P1tq5abx/',
    runtime: 'https://prod.spline.design/IomoYEa50DmuiTXE/scene.splinecode',
    accent: '#22d3ee',
    badge: 'Live Trading',
    aspectRatio: '16 / 9'
  },
  {
    id: 'loading-bar-vertical',
    title: 'Portfolio Progress Tracker',
    subtitle: 'Vertical growth momentum visualization',
    viewer: 'https://my.spline.design/theloadingbarvertical-J0jRfhBsRDUAUKzNRxMvZXak/',
    runtime: 'https://prod.spline.design/TOPNo0pcBjY8u6Ls/scene.splinecode',
    accent: '#fbbf24',
    badge: 'Portfolio',
    aspectRatio: '9 / 16'
  },
  {
    id: 'cannon-lab',
    title: 'Launch Momentum Engine',
    subtitle: 'Breakout detection and entry signals',
    viewer: 'https://my.spline.design/cannon-vOk1Cc5VyFBvcSq1ozXuhK1n/',
    runtime: 'https://prod.spline.design/C0mBZel0m7zXQaoD/scene.splinecode',
    accent: '#f472b6',
    badge: 'Advanced',
    aspectRatio: '16 / 9'
  },
  {
    id: 'x-gamer',
    title: 'Trading Arena Dashboard',
    subtitle: 'Multi-asset performance battle station',
    viewer: 'https://my.spline.design/xgamer-RZ9X6L57SHESs7L04p6IDisA/',
    runtime: 'https://prod.spline.design/1HGlyIYtYszh-B-r/scene.splinecode',
    accent: '#4ade80',
    badge: 'Competitive',
    aspectRatio: '16 / 9'
  }
];

const R4X_BOT_SCENE: RemoteSplineMeta = {
  id: 'r4x-bot',
  title: 'Market Scout AI Bot',
  subtitle: 'Autonomous trading opportunity analyzer',
  viewer: 'https://my.spline.design/r4xbot-2RZeOpfgJ0Vr36G9Jd9EHlFB/',
  runtime: 'https://prod.spline.design/G3yn-KsfkIAbK2Mz/scene.splinecode',
  accent: '#60a5fa',
  badge: 'AI Trading',
  aspectRatio: '16 / 9'
};

const ALL_REMOTE_SPLINES: RemoteSplineMeta[] = [
  ...(Object.values(DRAGGABLE_SPLIT_SCENES) as RemoteSplineMeta[]),
  ...ADDITIONAL_SPLINE_PAGES,
  R4X_BOT_SCENE,
];

// --- SMART CONTAINER: Handles Preloading & FPS Saving ---
function LazySplineContainer({ scene }: { scene: string }) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const [fpsMonitorActive, setFpsMonitorActive] = useState(false);
  const [emergencyFallback, setEmergencyFallback] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mobileSplineSettings, setMobileSplineSettings] = useState({ targetFPS: 60, maxDpr: 1.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceCheckDone = useRef(false);
  const fpsHistory = useRef<number[]>([]);
  const performanceCheckInterval = useRef<any>(null);

  // Use unified observer pool instead of individual IntersectionObserver
  const { observe, deviceTier, averageFps } = useUnifiedPerformance();

  // MOBILE CRASH FIX: Detect mobile and set conservative settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|mobile/i.test(ua);
    const memory = (navigator as any).deviceMemory || 4;
    const isLowEnd = isMobile && (memory < 3 || window.innerWidth < 375);
    
    setIsMobileDevice(isMobile);
    setMobileSplineSettings({
      targetFPS: isLowEnd ? 24 : (isMobile ? 30 : 60),
      maxDpr: isLowEnd ? 0.75 : (isMobile ? 1.0 : 1.5),
    });
    
    if (isMobile) {
      console.log('[LazySpline] Mobile device detected - using crash-safe settings');
    }
  }, []);

  // HERO SPLINE: ALWAYS RENDERS ON ALL DEVICES - NO RESTRICTIONS
  // Target: 50ms load time with zero lag (with mobile safety)
  useEffect(() => {
    if (deviceCheckDone.current) return;
    deviceCheckDone.current = true;

    console.log('[LazySpline] HERO MODE: Enabled on ALL devices' + (isMobileDevice ? ' (MOBILE SAFE)' : ''));
    setCanRender(true);
    
    // Ultra-aggressive preloading for 50ms target
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/scene1.splinecode';
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      fetch('/scene1.splinecode', { 
        method: 'GET', 
        mode: 'cors',
        cache: 'force-cache',
        priority: 'high'
      } as any).catch(() => {});
    }
  }, []);

  // Performance monitoring for marginal devices
  useEffect(() => {
    if (!fpsMonitorActive || !hasLoadedOnce) return;

    const monitorPerformance = () => {
      fpsHistory.current.push(averageFps);
      
      if (fpsHistory.current.length > 30) {
        fpsHistory.current.shift();
      }

      if (fpsHistory.current.length >= 10) {
        const recentAvg = fpsHistory.current.slice(-10).reduce((a, b) => a + b) / 10;
        
        if (recentAvg < 15 && !emergencyFallback) {
          console.warn('[LazySpline] Emergency fallback triggered due to poor performance:', recentAvg);
          setEmergencyFallback(true);
        }
      }
    };

    performanceCheckInterval.current = setInterval(monitorPerformance, 100);

    return () => {
      if (performanceCheckInterval.current) {
        clearInterval(performanceCheckInterval.current);
      }
    };
  }, [fpsMonitorActive, hasLoadedOnce, averageFps, emergencyFallback]);

  // Use shared observer pool for visibility detection
  useEffect(() => {
    if (!containerRef.current || !canRender) return;

    return observe(containerRef.current, (isIntersecting) => {
      setIsInView(isIntersecting);
      if (isIntersecting && !hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }, { rootMargin: deviceTier === 'ultra' || deviceTier === 'high' ? '1400px' : deviceTier === 'medium' ? '1100px' : '600px' });
  }, [observe, hasLoadedOnce, canRender, deviceTier]);

  const shouldShowSpline = true;
  const isPaused = false;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative isolate overflow-hidden rounded-xl spline-container"
      data-spline-scene
      data-hero-mode="true"
      style={{
        contain: 'layout style',
        touchAction: 'pan-y',
        position: 'relative',
        minHeight: '300px',
        height: '100%',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
      }}
    >
      {!hasLoadedOnce && !isInView && (
        <div className="absolute inset-0 bg-transparent rounded-xl overflow-hidden backdrop-blur-sm" style={{ minHeight: '300px', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <ShimmerRadialGlow color="blue" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="blue" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}

      {shouldShowSpline && (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <ShimmerRadialGlow color="blue" intensity="medium" />
            <ShimmerLine color="blue" />
            <ShimmerSpinner size={40} color="blue" />
          </div>
        }>
          <div
            className="absolute inset-0 pointer-events-none md:pointer-events-auto transition-opacity duration-300"
            style={{
              touchAction: 'pan-y',
              opacity: isPaused ? 0 : 1,
              visibility: isPaused ? 'hidden' : 'visible',
              willChange: isPaused ? 'auto' : 'transform',
            }}
          >
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black rounded-xl overflow-hidden">
          <ShimmerLine color="blue" speed="slow" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="blue" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}
    </div>
  );
}

function RemoteSplineFrame({ viewerSrc, sceneSrc, title }: { viewerSrc: string; sceneSrc: string; title: string }) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <LazySplineContainer scene={sceneSrc} />;
  }

  return (
    <div className="w-full h-full relative bg-black">
      <iframe
        src={viewerSrc}
        title={title}
        loading="lazy"
        allow="fullscreen; autoplay; xr-spatial-tracking"
        allowFullScreen
        className="w-full h-full border-0 bg-transparent"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}

function RemoteSplineShowcase({ scene, onOpen }: { scene: RemoteSplineMeta; onOpen: (scene: RemoteSplineMeta) => void }) {
  const blueAccent = '#3b82f6';

  return (
    <div
      className="group relative rounded-3xl p-6 md:p-8 flex flex-col gap-4 overflow-hidden cursor-pointer bg-black neon-blue-border transition-all duration-300 hover:brightness-110"
      onClick={() => onOpen(scene)}
    >
      <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-bold">
        <span className="neon-blue-text">▪</span>
        <span className="neon-blue-text">{scene.id}</span>
        {scene.badge && (
          <span
            className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold bg-black neon-blue-border neon-blue-text"
          >
            {scene.badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-xl md:text-2xl font-bold neon-white-text">
          {scene.title}
        </h3>
        {scene.subtitle && (
          <p className="text-sm mt-2 neon-blue-text">
            {scene.subtitle}
          </p>
        )}
      </div>
      <div className="flex-1" />
      <button
        onClick={() => onOpen(scene)}
        className="relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold neon-white-text bg-blue-600 neon-blue-border transition-all duration-300 hover:brightness-110"
        style={{
          background: '#3b82f6',
          boxShadow: '0 0 8px #3b82f6, 0 0 16px #3b82f6',
        }}
      >
        <span>Launch Scene</span>
        <span>→</span>
      </button>
    </div>
  );
}

function DraggableSplitExperience({ style }: { style?: CSSProperties } = {}) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden spline-container"
      style={{
        height: '800px',
        minHeight: '500px',
        contain: 'strict',
        ...style,
      }}
    >
      <ShimmerBorder color="blue" intensity="low" speed="normal" />
      <div className="relative z-10 w-full h-full bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
        <ShimmerLine color="blue" className="z-20" />
        <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
          <DraggableSplit>
            <RemoteSplineFrame
              viewerSrc={DRAGGABLE_SPLIT_SCENES.glassCurtain.viewer}
              sceneSrc={DRAGGABLE_SPLIT_SCENES.glassCurtain.runtime}
              title={DRAGGABLE_SPLIT_SCENES.glassCurtain.title}
            />
            <RemoteSplineFrame
              viewerSrc={DRAGGABLE_SPLIT_SCENES.orbScroll.viewer}
              sceneSrc={DRAGGABLE_SPLIT_SCENES.orbScroll.runtime}
              title={DRAGGABLE_SPLIT_SCENES.orbScroll.title}
            />
          </DraggableSplit>
        </Suspense>
      </div>
    </div>
  );
}

function SplitExperienceCard({ onOpen }: { onOpen: () => void }) {
  const blueAccent = '#3b82f6';
  return (
    <div
      className="relative rounded-3xl p-6 md:p-8 flex flex-col gap-4 overflow-hidden group cursor-pointer bg-black neon-blue-border transition-all duration-300 hover:brightness-110"
      onClick={onOpen}
    >
      <span className="relative text-xs uppercase tracking-[0.3em] font-bold neon-blue-text">▪ Dual Chart Monitor</span>
      <h3 className="relative text-xl md:text-2xl font-bold neon-white-text">Trading Split View</h3>
      <p className="relative text-sm neon-blue-text">
        Compare real-time charts side-by-side with advanced trading controls and instant execution.
      </p>
      <div className="flex-1" />
      <button
        onClick={onOpen}
        className="relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold neon-white-text transition-all duration-300 hover:brightness-110"
        style={{
          background: '#3b82f6',
          boxShadow: '0 0 8px #3b82f6, 0 0 16px #3b82f6',
        }}
      >
        <span>Launch Trading View</span>
        <span>→</span>
      </button>
    </div>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  accent = 'var(--accent-color, #3b82f6)',
  subtitle,
  children,
  contentAspectRatio = '16 / 9',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentAspectRatio?: string | null;
}) {
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalNode(document.body);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const evaluate = () => setIsCompact(window.innerWidth < 640);
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  if (!open || !portalNode) return null;

  const blueAccent = '#3b82f6';

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${isCompact ? 'max-w-sm' : 'max-w-6xl'} h-[90vh] md:h-[85vh] min-h-0 overflow-hidden rounded-3xl neon-blue-border bg-black`}
        style={{
          boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6',
          animation: 'neon-glow 2s ease-in-out infinite',
        }}
      >
        <div
          className="relative z-10 flex items-start justify-between gap-4 p-4 sm:p-6 border-b shrink-0"
          style={{ borderColor: blueAccent }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-bold neon-blue-text">
              ▪ Interactive Terminal
            </p>
            <h3 className="text-2xl font-bold mt-2 neon-white-text" style={{ textShadow: '0 0 4px #ffffff, 0 0 8px #ffffff' }}>
              {title}
            </h3>
            {subtitle && <p className="text-sm mt-1 neon-blue-text">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2.5 neon-white-text neon-blue-border bg-black transition-all hover:brightness-110 inline-flex h-10 w-10 items-center justify-center"
            aria-label="Close modal"
          >
            <span className="text-white">✕</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 p-3 sm:p-6 overflow-hidden flex items-center justify-center relative z-10">
          <div
            className="w-full h-full rounded-xl overflow-hidden neon-blue-border bg-black"
            style={{
              boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6',
              ...(contentAspectRatio
                ? {
                    aspectRatio: contentAspectRatio,
                    width: '100%',
                    maxWidth: isCompact ? 'min(80vw, 420px)' : '90vw',
                  }
                : {
                    minHeight: '100%',
                    height: '100%',
                    width: '100%',
                  }),
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    portalNode
  );
}

function RemoteSceneModal({ scene, onClose }: { scene: RemoteSplineMeta | null; onClose: () => void }) {
  if (!scene) return null;

  return (
    <ModalShell
      open={!!scene}
      onClose={onClose}
      title={scene.title}
      subtitle={scene.subtitle}
      accent={scene.accent}
      contentAspectRatio={scene.aspectRatio ?? '16 / 9'}
    >
      <div className="w-full h-full">
        <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
          <RemoteSplineFrame viewerSrc={scene.viewer} sceneSrc={scene.runtime} title={scene.title} />
        </Suspense>
      </div>
    </ModalShell>
  );
}

function SplitSceneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Interactive Split Lab"
      subtitle="Dual-scene comparison"
      accent="#38bdf8"
      contentAspectRatio="4 / 3"
    >
      <DraggableSplitExperience style={{ height: '100%', minHeight: '0px' }} />
    </ModalShell>
  );
}

function HomeContent() {
  const { optimizeSection } = useBigDeviceScrollOptimizer();
  
  // Start uninitialized - useEffect will check localStorage on client mount
  // This ensures SSR hydration works correctly in production
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Legacy flag retained for older bundles; default keeps desktop on 3D hero.
  const desktopHeroVariant = 'spline';
  const useDesktopVideoVariant = desktopHeroVariant === 'spline';
  const { shouldRender: allowMobileLazyRender } = useMobileLazyRender(240);
  const [isMuted, setIsMuted] = useState(false);
  const [activeRemoteScene, setActiveRemoteScene] = useState<RemoteSplineMeta | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const splinePreloadRanRef = useRef(false);
  const { setLoaderv2Open, setV2Unlocked, devSkipPageModeAndLoader, setDevSkipPageModeAndLoader, openDiscordStageModal } = useUIState();

  // Dev keyboard shortcut to skip pagemode and loader
  useDevSkipShortcut(() => {
    setDevSkipPageModeAndLoader(true);
    setCurrentView('content');
    setV2Unlocked(true);
  });

  // Use unified performance for tracking
  const { 
    deviceTier, 
    registerComponent, 
    unregisterComponent,
    averageFps,
    shimmerQuality,
    preloadQueue,
    unloadQueue 
  } = useUnifiedPerformance();
  
  // Crash tracking for the main page
  const { trackClick, trackError, trackCustom } = useComponentTracking('page');
  const { trackPerformanceWarning } = useCrashTracker();

  // Use global theme context
  const { activeThemeId, activeTheme, setAppLoading } = useGlobalTheme();
  
  // Fallback theme lookup
  const theme = activeTheme || ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  useAudioEngine(!isMuted, 'MECHANICAL');
  const canRenderMobileSections = !isMobile || allowMobileLazyRender;
  const canRenderHeavyDesktop = !isMobile;
  const FeaturesComponent = isMobile ? FeaturesLazy : Features;
  
  // Track FPS drops
  useEffect(() => {
    if (averageFps < 25 && currentView === 'content') {
      trackPerformanceWarning('page', averageFps, `FPS dropped to ${averageFps}`);
    }
  }, [averageFps, currentView, trackPerformanceWarning]);
  
  // Smart preloading based on usage patterns
  useEffect(() => {
    if (preloadQueue.length > 0) {
      console.log('[Page] Preload suggestions:', preloadQueue);
    }
    if (unloadQueue.length > 0) {
      console.log('[Page] Unload suggestions:', unloadQueue);
    }
  }, [preloadQueue, unloadQueue]);
  
  const componentsRegisteredRef = useRef(false);
  // Store callback refs to avoid dependency changes triggering cleanup
  const registerComponentRef = useRef(registerComponent);
  const unregisterComponentRef = useRef(unregisterComponent);
  const trackCustomRef = useRef(trackCustom);
  const optimizeSectionRef = useRef(optimizeSection);

  // Keep refs updated
  useEffect(() => {
    registerComponentRef.current = registerComponent;
    unregisterComponentRef.current = unregisterComponent;
    trackCustomRef.current = trackCustom;
    optimizeSectionRef.current = optimizeSection;
  });
  
  // Register main content components - only depends on currentView
  useEffect(() => {
    if (currentView === 'content' && !componentsRegisteredRef.current) {
      componentsRegisteredRef.current = true;
      registerComponentRef.current('hero', 9);
      registerComponentRef.current('features', 5);
      registerComponentRef.current('chartnews', 6);
      registerComponentRef.current('ticker', 7);
      trackCustomRef.current('content_loaded', { deviceTier, shimmerQuality });
      
      if (typeof window !== 'undefined' && window.innerWidth >= 1440) {
        setTimeout(() => {
          optimizeSectionRef.current('hero');
          optimizeSectionRef.current('experience');
          optimizeSectionRef.current('cta');
          optimizeSectionRef.current('features');
        }, 100);
      }
    }
    return () => {
      if (componentsRegisteredRef.current) {
        componentsRegisteredRef.current = false;
        unregisterComponentRef.current('hero');
        unregisterComponentRef.current('features');
        unregisterComponentRef.current('chartnews');
        unregisterComponentRef.current('ticker');
      }
    };
  }, [currentView, deviceTier, shimmerQuality]);
  
  useEffect(() => {
    if (currentView === 'content') {
      setAppLoading(false);
    } else {
      setAppLoading(true);
    }
  }, [currentView, setAppLoading]);

  useEffect(() => {
    setLoaderv2Open(currentView === 'loader');
    return () => setLoaderv2Open(false);
  }, [currentView, setLoaderv2Open]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = activeRemoteScene || isSplitModalOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeRemoteScene, isSplitModalOpen]);

  // Load muted preference
  useEffect(() => {
    const savedMuted = localStorage.getItem('bullmoney_muted');
    if (savedMuted === 'true') setIsMuted(true);
  }, []);

  // STEALTH PRE-LOADER - Preload Spline during pagemode
  useEffect(() => {
    const preloadSplineEngine = async () => {
      try {
        const browserInfo = detectBrowser();
        if (browserInfo.isInAppBrowser || !browserInfo.canHandle3D) return;
        if (splinePreloadRanRef.current) return;

        if (deviceTier === 'low' || deviceTier === 'minimal') return;
        if (typeof window !== 'undefined' && window.innerWidth < 768) return;

        splinePreloadRanRef.current = true;

        await Promise.allSettled([
          import('@splinetool/runtime'),
          import('@/components/SplineScene'),
          import('@/components/DraggableSplit'),
          import('@/lib/spline-wrapper'),
        ]);

        const preloadResource = (href: string, as: HTMLLinkElement['as'] = 'fetch') => {
          if (typeof document === 'undefined') return;
          const selector = `link[rel="preload"][href="${href}"]`;
          if (document.querySelector(selector)) return;
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = as;
          link.href = href;
          if (as === 'fetch' || as === 'document') {
            link.crossOrigin = 'anonymous';
          }
          document.head.appendChild(link);
        };
        ALL_REMOTE_SPLINES.forEach(scene => {
          preloadResource(scene.viewer, 'document');
          preloadResource(scene.runtime);
        });

        console.log('[Page] Spline runtime + scenes preloaded during', currentView);
      } catch (e) {
        console.warn("Preload failed", e);
      }
    };
    preloadSplineEngine();
  }, [deviceTier, currentView]);

  // Check localStorage on client mount to determine the correct view
  // This runs once on mount and sets the view based on user's previous progress
  useEffect(() => {
    const hasSession = localStorage.getItem("bullmoney_session");
    const hasCompletedPagemode = localStorage.getItem("bullmoney_pagemode_completed");
    const hasCompletedLoader = localStorage.getItem("bullmoney_loader_completed");

    const now = Date.now();
    let shouldForceLoader = false;
    const forceReasons: string[] = [];
    let shouldResetPagemode = false;

    // ===== Refresh/session-based loader triggers =====
    try {
      const sessionCountKey = "bullmoney_refresh_count";
      const refreshTimesKey = "bullmoney_refresh_times";
      const showProbability = 0.35;
      const rapidShownKey = "bullmoney_refresh_rapid_last";

      const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const buildShowIndices = () => {
        const showCount = getRandomInt(2, 4);
        const set = new Set<number>();
        while (set.size < showCount) {
          set.add(getRandomInt(1, 10));
        }
        return Array.from(set);
      };

      // Session refresh counter
      const sessionCount = Number(sessionStorage.getItem(sessionCountKey) || "0") + 1;
      sessionStorage.setItem(sessionCountKey, String(sessionCount));

      // If user refreshes more than 15 times in this session,
      // force the welcome/pagemode screen to show again.
      if (sessionCount > 15) {
        shouldResetPagemode = true;
        forceReasons.push(`refresh_over_15_${sessionCount}`);
      }

      // Track refresh timestamps for rapid-refresh detection (2-minute window)
      const rawTimes = sessionStorage.getItem(refreshTimesKey);
      const parsedTimes = JSON.parse(rawTimes || "[]");
      const times = Array.isArray(parsedTimes) ? parsedTimes : [];
      const recentTimes = (times as number[]).filter(t => now - t <= 120000);
      recentTimes.push(now);
      sessionStorage.setItem(refreshTimesKey, JSON.stringify(recentTimes));

      const lastRapidShown = Number(sessionStorage.getItem(rapidShownKey) || "0");
      const rapidCooldownMs = 120000;
      if (recentTimes.length >= 3 && now - lastRapidShown >= rapidCooldownMs) {
        shouldForceLoader = true;
        forceReasons.push("rapid_refresh_3_in_2min");
        sessionStorage.setItem(rapidShownKey, String(now));
      }

      // Randomized probability: show 35% of refreshes
      if (Math.random() < showProbability) {
        shouldForceLoader = true;
        forceReasons.push("random_refresh_35_percent");
      }
    } catch (error) {
      console.warn('[Page] Refresh trigger check failed', error);
    }

    // ===== Daily 23:59:50 TTL trigger =====
    try {
      const dailyKey = "bullmoney_loader_daily_last";
      const lastDaily = Number(localStorage.getItem(dailyKey) || "0");
      const target = new Date(now);
      target.setHours(23, 59, 50, 0);
      const targetTime = target.getTime();

      if (now >= targetTime && lastDaily < targetTime) {
        shouldForceLoader = true;
        forceReasons.push("daily_23_59_50");
        localStorage.setItem(dailyKey, String(targetTime));
      }
    } catch (error) {
      console.warn('[Page] Daily trigger check failed', error);
    }

    console.log('[Page] Session check:', { hasSession: !!hasSession, hasCompletedPagemode, hasCompletedLoader, shouldForceLoader, shouldResetPagemode, forceReasons });

    // CRITICAL: Pagemode/welcome screen MUST always show first
    // MultiStepLoaderv3 should ONLY show after pagemode has been completed at least once
    // Additionally: if the user refreshes the page more than 10 times
    // in a single session, re-show the pagemode welcome experience.
    if (shouldResetPagemode) {
      try {
        localStorage.removeItem("bullmoney_pagemode_completed");
      } catch {
        // Ignore storage errors; still fall back to pagemode view
      }
      console.log('[Page] Refresh count > 10 - re-showing pagemode welcome');
      setCurrentView('pagemode');
    } else if (!hasCompletedPagemode && !hasSession) {
      // First time visitor - always show pagemode welcome screen first
      console.log('[Page] First time visitor - showing pagemode');
      setCurrentView('pagemode');
    } else if (hasCompletedLoader === "true") {
      // User has completed both pagemode AND loader before
      // Skip directly to content (no loader needed)
      console.log('[Page] Loader already completed - skipping to content');
      setV2Unlocked(true);
      setCurrentView('content');
    } else if (shouldForceLoader && (hasSession || hasCompletedPagemode === "true")) {
      // Only force loader if user has already completed pagemode
      console.log('[Page] Forcing loader due to refresh policy (pagemode already completed)');
      setCurrentView('loader');
    } else if (hasSession || hasCompletedPagemode === "true") {
      // User completed pagemode but not loader yet - show loader
      console.log('[Page] Skipping to loader - session/pagemode previously completed');
      setCurrentView('loader');
    } else {
      // Fallback - show pagemode
      console.log('[Page] Fallback - showing pagemode');
      setCurrentView('pagemode');
    }
    setIsInitialized(true);
  }, []);

  // Mobile Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePageModeUnlock = () => {
    // Mark pagemode as completed so user skips it on reload
    localStorage.setItem("bullmoney_pagemode_completed", "true");
    console.log('[Page] Pagemode completed, checking if should skip to content or show loader');
    
    // If loader was already completed, skip directly to content
    const hasCompletedLoader = localStorage.getItem("bullmoney_loader_completed");
    if (hasCompletedLoader === "true") {
      console.log('[Page] Loader already completed, skipping to content');
      setV2Unlocked(true);
      setCurrentView('content');
    } else {
      console.log('[Page] Moving to V3 loader');
      setCurrentView('loader');
    }
  };

  // Called when user completes the vault
  const handleLoaderComplete = useCallback(() => {
    // Check if this is the first time completing V3 loader
    const hasCompletedV3Before = localStorage.getItem("bullmoney_v3_completed_once");
    
    if (!hasCompletedV3Before) {
      // First time - show pagemode loader celebration before content
      console.log('[Page] First V3 completion - showing pagemode celebration loader');
      localStorage.setItem("bullmoney_v3_completed_once", "true");
      localStorage.setItem("bullmoney_show_celebration_loader", "true");
      setCurrentView('pagemode');
    } else {
      // Not first time - go directly to content
      console.log('[Page] V3 completed - going to content');
      localStorage.setItem("bullmoney_loader_completed", "true");
      setV2Unlocked(true);
      setCurrentView('content');
    }
  }, [setV2Unlocked]);

  // Mobile Loader Deferral
  useEffect(() => {
    if (isMobile && currentView === 'loader' && typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(() => {
          console.log('[Page] Mobile loader deferred with requestIdleCallback');
        }, { timeout: 1000 });
        return () => (window as any).cancelIdleCallback(id);
      }
    }
  }, [isMobile, currentView]);

  if (!isInitialized) {
    return (
      <>
        <style jsx global>{`
          nav, footer, header {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
          <ShimmerRadialGlow color="blue" intensity="low" />
          <ShimmerSpinner size={48} color="blue" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{NEON_STYLES}</style>
      
      {currentView === 'pagemode' && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === 'loader' && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <TradingUnlockLoader 
            onFinished={handleLoaderComplete}
          />
        </div>
      )}

      {currentView === 'content' && (
        <>
          <main className="min-h-screen flex flex-col w-full" data-allow-scroll data-scrollable data-content data-theme-aware style={{ overflow: 'visible', height: 'auto' }}>
            <div id="top" />

            <section
              id="hero"
              className={isMobile
                ? "w-full full-bleed flex items-end justify-center overflow-hidden"
                : "w-full full-bleed viewport-full"}
              style={isMobile ? {
                // Fill from under navbar+static helper to bottom of viewport
                // This ensures content stretches to fill on taller screens
                height: 'calc(100dvh - env(safe-area-inset-bottom, 0px))',
                paddingTop: 'calc(110px + env(safe-area-inset-top, 0px))',
                paddingBottom: '12px',
                display: 'flex',
                flexDirection: 'column' as const,
              } : undefined}
              data-allow-scroll
              data-content
              data-theme-aware
            >
              {isMobile ? (
                canRenderMobileSections ? (
                  <MobileDiscordHero
                    sources={DISCORD_STAGE_FEATURED_VIDEOS}
                    onOpenModal={openDiscordStageModal}
                    variant="mobile"
                  />
                ) : (
                  <HeroSkeleton />
                )
              ) : (
                <HeroDesktop />
              )}
            </section>

            <section
              id="cta"
              className="w-full full-bleed viewport-full"
              style={isMobile ? { minHeight: '70dvh' } : undefined}
              data-allow-scroll
              data-content
              data-theme-aware
            >
              {canRenderMobileSections ? <CTA /> : <MinimalFallback />}
            </section>

            <section
              id="features"
              className="w-full full-bleed viewport-full"
              style={isMobile ? { minHeight: '80dvh' } : undefined}
              data-allow-scroll
              data-content
              data-theme-aware
            >
              {canRenderMobileSections ? <FeaturesComponent /> : <FeaturesSkeleton />}
            </section>

            {canRenderHeavyDesktop && (
              <section 
                id="experience" 
                className="w-full max-w-7xl mx-auto px-4 py-12 md:py-16" 
                data-allow-scroll 
                data-content 
                data-theme-aware 
              >
                <div className="relative text-center mb-8" style={{ minHeight: '80px' }}>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight neon-blue-text">
                    TRADING TOOLS & ANALYTICS
                  </h2>
                  <p className="text-sm mt-4 neon-blue-text max-w-2xl mx-auto">Advanced market intelligence platforms covering real-time data and interactive visualizations.</p>
                  <div className="flex justify-center mt-4">
                    <div className="w-24 h-[2px] neon-blue-border" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SplitExperienceCard onOpen={() => setIsSplitModalOpen(true)} />
                  {ADDITIONAL_SPLINE_PAGES.map(scene => (
                    <RemoteSplineShowcase key={scene.id} scene={scene} onOpen={setActiveRemoteScene} />
                  ))}
                </div>
              </section>
            )}

            {canRenderHeavyDesktop && (
              <section
                id="r4x-bot"
                className="w-full full-bleed viewport-full mx-auto px-4 pb-16"
                data-allow-scroll
                data-content
                data-theme-aware
              >
                <div className="relative text-center mb-8 flex flex-col items-center gap-3" style={{ minHeight: '70px' }}>
                  <p className="text-xs uppercase tracking-[0.3em] font-bold neon-blue-text">
                    ▪ AI-Powered Trading
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black neon-white-text">{R4X_BOT_SCENE.title}</h2>
                  {R4X_BOT_SCENE.subtitle && (
                    <p className="text-sm neon-blue-text">{R4X_BOT_SCENE.subtitle}</p>
                  )}
                  <button
                    onClick={() => setActiveRemoteScene(R4X_BOT_SCENE)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold neon-white-text transition-all hover:brightness-110"
                    style={{ 
                      background: '#3b82f6',
                      boxShadow: '0 0 8px #3b82f6, 0 0 16px #3b82f6'
                    }}
                  >
                    <span>Launch AI Bot View</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="relative rounded-3xl overflow-hidden neon-blue-border bg-black">
                  <div className="w-full" style={{ aspectRatio: R4X_BOT_SCENE.aspectRatio ?? '16 / 9' }}>
                    <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
                      <RemoteSplineFrame viewerSrc={R4X_BOT_SCENE.viewer} sceneSrc={R4X_BOT_SCENE.runtime} title={R4X_BOT_SCENE.title} />
                    </Suspense>
                  </div>
                </div>
              </section>
            )}

            {/* Mobile-only Testimonials Section */}
            {canRenderMobileSections && (
              <section id="testimonials" className="w-full max-w-5xl mx-auto px-4 py-12 md:hidden" data-allow-scroll data-content data-theme-aware style={{ touchAction: 'pan-y' }}>
                <div className="relative text-center mb-6">
                  <h2 className="text-lg font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #3b82f6), white)', filter: 'drop-shadow(0 0 15px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}>
                    What Traders Say
                  </h2>
                  <div className="flex justify-center gap-1 mt-3">
                    <ShimmerDot color="blue" delay={0} />
                    <ShimmerDot color="blue" delay={0.2} />
                    <ShimmerDot color="blue" delay={0.4} />
                  </div>
                </div>
                
                <div className="relative rounded-2xl overflow-hidden">
                  <ShimmerBorder color="blue" intensity="low" speed="slow" />
                  
                  <div className="relative z-10 bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
                    <Suspense fallback={<LoadingSkeleton variant="card" height={320} />}>
                      <TestimonialsCarousel />
                    </Suspense>
                  </div>
                </div>
              </section>
            )}

            {canRenderMobileSections && (
              <section id="ticker" className="w-full" data-allow-scroll data-footer data-theme-aware>
                <LiveMarketTicker />
              </section>
            )}
          </main>

          {canRenderHeavyDesktop && theme.youtubeId && (
            <HiddenYoutubePlayer
              videoId={theme.youtubeId}
              isPlaying={!isMuted}
              volume={!isMuted ? 15 : 0}
            />
          )}

          {canRenderHeavyDesktop && (
            <SplitSceneModal open={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} />
          )}
          {canRenderHeavyDesktop && (
            <RemoteSceneModal scene={activeRemoteScene} onClose={() => setActiveRemoteScene(null)} />
          )}
        </>
      )}
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
