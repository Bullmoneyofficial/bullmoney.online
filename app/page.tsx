"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { detectBrowser } from "@/lib/browserDetection";
import { trackEvent, BullMoneyAnalytics } from "@/lib/analytics";

// iPhone Glass Styles - Black and White Theme
const GLASS_STYLES = `
  html, body, #__next {
    background: #000000;
  }

  .page-surface {
    background: #000000;
  }

  @keyframes glass-shimmer {
    0%, 100% { 
      opacity: 0.95;
    }
    50% { 
      opacity: 1;
    }
  }

  .glass-text {
    color: #ffffff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .glass-text-dark {
    color: #1a1a1a;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.1);
  }

  .glass-text-gray {
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .glass-border {
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.9);
    color: #000000;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .glass-button:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
  { ssr: false }
);

const BullMoneyPromoScroll = dynamic(
  () => import("@/components/BullMoneyPromoScroll"),
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
import { HeroScrollDemo } from "@/components/HeroScrollDemo";

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
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { useUIState } from "@/contexts/UIStateContext";
import { DISCORD_STAGE_FEATURED_VIDEOS } from "@/components/TradingQuickAccess";

const HiddenYoutubePlayer = dynamic(
  () => import("@/components/Mainpage/HiddenYoutubePlayer"),
  { ssr: false }
);

// ✅ FOOTER - Only rendered on home page (removed from layout)
const FooterComponent = dynamic(
  () => import("@/components/Mainpage/footer").then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";
import Link from "next/link";
import YouTubeVideoEmbed from "@/components/YouTubeVideoEmbed";
import MobileDiscordHero from "@/components/MobileDiscordHero";

import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

// Import Spline modals from separate file
import {
  type RemoteSplineMeta,
  DRAGGABLE_SPLIT_SCENES,
  ADDITIONAL_SPLINE_PAGES,
  R4X_BOT_SCENE,
  ALL_REMOTE_SPLINES,
  RemoteSceneModal,
  SplitSceneModal,
  RemoteSplineShowcase,
  SplitExperienceCard,
  DraggableSplitExperience,
  OrbSplineLauncher,
  AllScenesModal,
} from "@/components/SplineModals";

// Legacy flag placeholder to satisfy stale client bundles that may reference it during Fast Refresh.
const desktopHeroVariant = "spline";

// Import loaders - lazy
const PageMode = dynamic(
  () => import("@/components/REGISTER USERS/pagemode"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

// ✅ NEW INTERACTIVE LOADER - Neon blue trading unlock experience (v3 Simple)
const TradingUnlockLoader = dynamic(
  () => import("@/components/MultiStepLoaderv3Simple"),
  { 
    ssr: false, 
    loading: () => <MinimalFallback />,
  }
);

// ✅ 3D SOLAR SYSTEM - Interactive space experience
const SolarSystemGame = dynamic(
  () => import("@/components/SolarSystemGame"),
  { 
    ssr: false, 
    loading: () => <ContentSkeleton lines={6} />,
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

function DesktopHeroFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <div className="w-full max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-4">
        <p
          className="font-mono text-[10px] tracking-[0.2em] uppercase glass-text-gray"
        >
          EST. 2024 • TRADING MENTORSHIP
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight glass-text">
          Master <span className="glass-text">trading</span> with us
        </h1>
        <p className="text-sm md:text-base max-w-3xl glass-text-gray">
          Live trade calls, daily analysis, funded trader mentorship. Join 10,000+ traders learning forex, gold & crypto.
        </p>
        <div className="mt-4 inline-flex items-center gap-3">
          <span className="px-6 py-3 rounded-full text-sm font-bold glass-button">
            Loading your experience…
          </span>
        </div>
      </div>
    </div>
  );
}

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
        overscrollBehavior: 'auto',
      }}
    >
      {!hasLoadedOnce && !isInView && (
        <div className="absolute inset-0 bg-transparent rounded-xl overflow-hidden backdrop-blur-sm" style={{ minHeight: '300px', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <ShimmerRadialGlow color="white" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="white" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}

      {shouldShowSpline && (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <ShimmerRadialGlow color="white" intensity="medium" />
            <ShimmerLine color="white" />
            <ShimmerSpinner size={40} color="white" />
          </div>
        }>
          <div
            className="absolute inset-0 pointer-events-auto transition-opacity duration-300"
            style={{
              touchAction: 'manipulation',
              opacity: isPaused ? 0 : 1,
              visibility: isPaused ? 'hidden' : 'visible',
              willChange: isPaused ? 'auto' : 'transform',
              transform: 'translateZ(0)',
            }}
          >
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black rounded-xl overflow-hidden">
          <ShimmerLine color="white" speed="slow" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="white" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}
    </div>
  );
}

function HomeContent() {
  const { optimizeSection } = useBigDeviceScrollOptimizer();
  
  // Start uninitialized - useEffect will check localStorage on client mount
  // This ensures SSR hydration works correctly in production
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopHeroReady, setDesktopHeroReady] = useState(false);
  const [allowHeavyDesktop, setAllowHeavyDesktop] = useState(false);
  // Legacy flag retained for older bundles; default keeps desktop on 3D hero.
  const desktopHeroVariant = 'spline';
  const useDesktopVideoVariant = desktopHeroVariant === 'spline';
  const { shouldRender: allowMobileLazyRender } = useMobileLazyRender(240);
  const { masterMuted } = useAudioSettings();
  const [isMuted, setIsMuted] = useState(false);
  const [activeRemoteScene, setActiveRemoteScene] = useState<RemoteSplineMeta | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isAllScenesModalOpen, setIsAllScenesModalOpen] = useState(false);
  const splinePreloadRanRef = useRef(false);
  const { setLoaderv2Open, setV2Unlocked, devSkipPageModeAndLoader, setDevSkipPageModeAndLoader, openDiscordStageModal, openAccountManagerModal } = useUIState();

  // Check for Account Manager query parameter and open modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openAccountManager') === 'true') {
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        // Open Account Manager modal after a short delay to ensure everything is loaded
        setTimeout(() => {
          openAccountManagerModal();
        }, 500);
      }
    }
  }, [openAccountManagerModal]);

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
  const canRenderHeavyDesktop = !isMobile && allowHeavyDesktop;
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
      registerComponentRef.current('ticker', 7);
      trackCustomRef.current('content_loaded', { deviceTier, shimmerQuality });
      
      if (typeof window !== 'undefined' && window.innerWidth >= 1440) {
        setTimeout(() => {
          optimizeSectionRef.current('hero');
          optimizeSectionRef.current('experience');
          optimizeSectionRef.current('features');
        }, 100);
      }
    }
    return () => {
      if (componentsRegisteredRef.current) {
        componentsRegisteredRef.current = false;
        unregisterComponentRef.current('hero');
        unregisterComponentRef.current('features');
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
    if (typeof window === 'undefined') return;
    if (isMobile || currentView !== 'content') {
      setAllowHeavyDesktop(false);
      return;
    }

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setAllowHeavyDesktop(true);
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        (window as any).cancelIdleCallback(id);
      };
    }

    const timeout = setTimeout(enable, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isMobile, currentView]);

  useEffect(() => {
    setLoaderv2Open(currentView === 'loader');
    return () => setLoaderv2Open(false);
  }, [currentView, setLoaderv2Open]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = activeRemoteScene || isSplitModalOpen || isAllScenesModalOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeRemoteScene, isSplitModalOpen, isAllScenesModalOpen]);

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
    // MultiStepLoaderv3Simple should ONLY show after pagemode has been completed at least once
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
          <ShimmerRadialGlow color="white" intensity="low" />
          <ShimmerSpinner size={48} color="white" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GLASS_STYLES}</style>
      
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
          <main className="min-h-screen flex flex-col w-full page-surface px-4 sm:px-6 lg:px-10" data-allow-scroll data-scrollable data-content data-theme-aware style={{ overflow: 'visible', height: 'auto' }}>
            <div id="top" />

            <section
              id="hero"
              className={isMobile
                ? "w-full full-bleed flex items-end justify-center overflow-hidden relative px-2 sm:px-4"
                : "w-full full-bleed viewport-full relative px-2 sm:px-4"}
              style={isMobile ? {
                // Fill from under navbar+static helper to bottom of viewport
                // This ensures content stretches to fill on taller screens
                height: 'calc(100dvh - env(safe-area-inset-bottom, 0px))',
                paddingTop: 'calc(110px + env(safe-area-inset-top, 0px))',
                paddingBottom: '12px',
                display: 'flex',
                flexDirection: 'column' as const,
              } : {
                minHeight: '100vh',
              }}
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

            {/* BullMoney Promo Scroll Section - Mobile Only */}
            {isMobile && (
              <section
                id="bullmoney-promo"
                className="w-full full-bleed"
                data-allow-scroll
                data-content
                data-theme-aware
              >
                {canRenderMobileSections ? <BullMoneyPromoScroll /> : <MinimalFallback />}
              </section>
            )}

            <section
              id="features"
              className="w-full full-bleed viewport-full px-2 sm:px-4"
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
                className="w-full full-bleed bg-black" 
                data-allow-scroll 
                data-content 
                data-theme-aware 
                style={{ backgroundColor: '#000000' }}
              >
                {/* Orb with Launch Button - Full Screen */}
                <OrbSplineLauncher onOpenScenes={() => setIsAllScenesModalOpen(true)} />
              </section>
            )}

            {/* 🌌 3D SOLAR SYSTEM - Mobile Only */}
            {isMobile && (
              <section
                id="solar-system"
                className="w-full full-bleed"
                data-allow-scroll
                data-content
                data-theme-aware
              >
                <Suspense fallback={<ContentSkeleton lines={6} />}>
                  <SolarSystemGame />
                </Suspense>
              </section>
            )}

            {/* Mobile-only Testimonials Section */}
            {canRenderMobileSections && (
              <section id="testimonials" className="w-full max-w-5xl mx-auto px-4 py-12 md:hidden" data-allow-scroll data-content data-theme-aware style={{ touchAction: 'pan-y' }}>
                <div className="relative text-center mb-6">
                  <h2 className="text-lg font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #ffffff), white)', filter: 'drop-shadow(0 0 15px rgba(var(--accent-rgb, 255, 255, 255), 0.5))' }}>
                    What Traders Say
                  </h2>
                  <div className="flex justify-center gap-1 mt-3">
                    <ShimmerDot color="white" delay={0} />
                    <ShimmerDot color="white" delay={0.2} />
                    <ShimmerDot color="white" delay={0.4} />
                  </div>
                </div>
                
                <div className="relative rounded-2xl overflow-hidden">
                  <ShimmerBorder color="white" intensity="low" speed="slow" />
                  
                  <div className="relative z-10 bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
                    <Suspense fallback={<LoadingSkeleton variant="card" height={320} />}>
                      <TestimonialsCarousel />
                    </Suspense>
                  </div>
                </div>
              </section>
            )}

            {canRenderMobileSections && (
              <section id="ticker" className="w-full px-2 sm:px-4" data-allow-scroll data-footer data-theme-aware>
                <LiveMarketTicker />
              </section>
            )}

            {/* ✅ FOOTER - Only on home page */}
            <FooterComponent />
          </main>

          {canRenderHeavyDesktop && theme.youtubeId && (
            <HiddenYoutubePlayer
              videoId={theme.youtubeId}
              isPlaying={!isMuted && !masterMuted}
              volume={!isMuted && !masterMuted ? 15 : 0}
            />
          )}

          {canRenderHeavyDesktop && (
            <SplitSceneModal open={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} />
          )}
          {canRenderHeavyDesktop && (
            <RemoteSceneModal scene={activeRemoteScene} onClose={() => setActiveRemoteScene(null)} />
          )}
          {canRenderHeavyDesktop && (
            <AllScenesModal 
              open={isAllScenesModalOpen} 
              onClose={() => setIsAllScenesModalOpen(false)}
              onSelectScene={setActiveRemoteScene}
            />
          )}
        </>
      )}
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
