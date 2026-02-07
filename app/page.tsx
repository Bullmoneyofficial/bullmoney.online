"use client";

import { Suspense, useState, useEffect, useRef, useCallback, lazy } from "react";
import dynamic from "next/dynamic";
import { detectBrowser } from "@/lib/browserDetection";
import { GLASS_STYLES } from "@/styles/glassStyles";
import { deferAnalytics, smartPrefetch } from "@/lib/prefetchHelper";

// ✅ MOBILE DETECTION - Conditional lazy loading for mobile optimization
import { isMobileDevice } from "@/lib/mobileDetection";

// ✅ LOADING FALLBACKS - Mobile-optimized loading states
import {
  HeroSkeleton,
  MinimalFallback,
  ContentSkeleton,
  CardSkeleton,
} from "@/components/MobileLazyLoadingFallback";

// ==========================================
// ✅ PERFORMANCE OPTIMIZED: Centralized dynamic imports
// ==========================================
import {
  Hero,
  HeroDesktop,
  MetaTraderQuotes,
  BullMoneyPromoScroll,
  Features,
  TradingViewDashboard,
  HeroScrollDemo,
  SplineSkeleton,
  LoadingSkeleton,
  LiveMarketTicker,
  TradingQuickAccess,
  HiddenYoutubePlayer,
  FooterComponent,
  PageMode,
  TradingUnlockLoader,
  DraggableSplit,
  SplineScene,
  TestimonialsCarousel,
  CookieConsent,
  AppSupportButton,
} from "@/components/home/dynamicImports";

// UNIFIED SHIMMER SYSTEM - These are lightweight CSS animations, safe to import statically
import {
  ShimmerBorder,
  ShimmerLine,
  ShimmerSpinner,
  ShimmerDot,
  ShimmerFloat,
  ShimmerRadialGlow,
  ShimmerContainer
} from "@/components/ui/UnifiedShimmer";

import { useCacheContext } from "@/components/CacheManagerProvider";
import { useUnifiedPerformance, useVisibility, useObserver, useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking, useCrashTracker } from "@/lib/CrashTracker";
import { useScrollOptimization } from "@/hooks/useScrollOptimization";
import { useBigDeviceScrollOptimizer } from "@/lib/bigDeviceScrollOptimizer";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { useUIState } from "@/contexts/UIStateContext";

// Features skeleton fallback (inline for faster load)
const FeaturesSkeleton = () => (
  <div className="w-full h-100 bg-linear-to-b from-black to-zinc-900/50 animate-pulse rounded-xl" />
);

import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";
import Link from "next/link";

// Lazy load heavy components that aren't needed immediately
const MobileDiscordHero = dynamic(
  () => import("@/components/MobileDiscordHero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

// Lazy load Spline modals - only loaded when actually opened
const SplineModals = dynamic(
  () => import("@/components/SplineModals").then(mod => ({
    default: () => null // This will be replaced with actual exports
  })),
  { ssr: false }
);

import type { RemoteSplineMeta } from "@/components/SplineModals";

// Lazy load individual modal components
const RemoteSceneModal = dynamic(
  () => import("@/components/SplineModals").then(mod => ({ default: mod.RemoteSceneModal })),
  { ssr: false }
);

const SplitSceneModal = dynamic(
  () => import("@/components/SplineModals").then(mod => ({ default: mod.SplitSceneModal })),
  { ssr: false }
);

const AllScenesModal = dynamic(
  () => import("@/components/SplineModals").then(mod => ({ default: mod.AllScenesModal })),
  { ssr: false }
);

const OrbSplineLauncher = dynamic(
  () => import("@/components/SplineModals").then(mod => ({ default: mod.OrbSplineLauncher })),
  { ssr: false }
);

// Import Spline utility components
import { DesktopHeroFallback, LazySplineContainer } from "@/components/home/SplineComponents";

// Legacy flag placeholder to satisfy stale client bundles that may reference it during Fast Refresh.
const desktopHeroVariant = "spline";

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
  const [featuredVideos, setFeaturedVideos] = useState<any[]>([]);
  const [allRemoteSplines, setAllRemoteSplines] = useState<any[]>([]);
  const splinePreloadRanRef = useRef(false);
  const { setLoaderv2Open, setV2Unlocked, devSkipPageModeAndLoader, setDevSkipPageModeAndLoader, openDiscordStageModal, openAccountManagerModal } = useUIState();

  // Defer analytics initialization until after page is interactive
  useEffect(() => {
    deferAnalytics(() => {
      import("@/lib/analytics").then(({ trackEvent, BullMoneyAnalytics }) => {
        // Analytics is now loaded and ready
        console.log('[Performance] Analytics loaded after page interaction');
      });
    });

    // Smart prefetch likely navigation routes after initial load
    smartPrefetch([
      { href: '/store', options: { priority: 'low' } },
      { href: '/trading-showcase', options: { priority: 'low' } },
      { href: '/community', options: { priority: 'low' } },
      { href: '/course', options: { priority: 'low' } },
    ]);
  }, []);

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
  
  // Fallback theme lookup - lazy load theme data only when needed
  const [theme, setTheme] = useState(activeTheme);
  
  useEffect(() => {
    if (!activeTheme && !theme) {
      import("@/constants/theme-data").then(({ ALL_THEMES }) => {
        setTheme(ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0]);
      });
    } else if (activeTheme) {
      setTheme(activeTheme);
    }
  }, [activeTheme, activeThemeId, theme]);
  useAudioEngine(!isMuted, 'MECHANICAL');
  const canRenderMobileSections = !isMobile || allowMobileLazyRender;
  const canRenderHeavyDesktop = !isMobile && allowHeavyDesktop;
  // Use single dynamic Features component for all devices
  const FeaturesComponent = Features;
  
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

  // Lazy load featured videos data only when needed
  useEffect(() => {
    if (isMobile && currentView === 'content' && canRenderMobileSections && featuredVideos.length === 0) {
      import("@/components/TradingQuickAccess").then(mod => {
        setFeaturedVideos(mod.DISCORD_STAGE_FEATURED_VIDEOS || []);
      });
    }
  }, [isMobile, currentView, canRenderMobileSections, featuredVideos.length]);

  // Lazy load Spline data only when needed
  useEffect(() => {
    if (canRenderHeavyDesktop && allRemoteSplines.length === 0) {
      import("@/components/SplineModals").then(mod => {
        setAllRemoteSplines(mod.ALL_REMOTE_SPLINES || []);
      });
    }
  }, [canRenderHeavyDesktop, allRemoteSplines.length]);

  // OPTIMIZED PRELOADER - Lighter and deferred
  useEffect(() => {
    const preloadSplineEngine = async () => {
      try {
        const browserInfo = detectBrowser();
        if (browserInfo.isInAppBrowser || !browserInfo.canHandle3D) return;
        if (splinePreloadRanRef.current) return;

        if (deviceTier === 'low' || deviceTier === 'minimal') return;
        if (typeof window !== 'undefined' && window.innerWidth < 768) return;

        splinePreloadRanRef.current = true;

        // Only preload Spline runtime, defer scene loading
        await Promise.allSettled([
          import('@splinetool/runtime'),
          import('@/lib/spline-wrapper'),
        ]);

        // Preload scenes only if we have the data and on idle
        if (allRemoteSplines.length > 0 && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            const preloadResource = (href: string, as: HTMLLinkElement['as'] = 'fetch') => {
              if (typeof document === 'undefined') return;
              const selector = `link[rel=\"preload\"][href=\"${href}\"]`;
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
            allRemoteSplines.forEach(scene => {
              preloadResource(scene.viewer, 'document');
              preloadResource(scene.runtime);
            });
          }, { timeout: 3000 });
        }

        console.log('[Page] Spline runtime preloaded during', currentView);
      } catch (e) {
        console.warn("Preload failed", e);
      }
    };
    
    // Only run preload when we're ready and have desktop capabilities
    if (canRenderHeavyDesktop || (currentView === 'pagemode' && !isMobile)) {
      preloadSplineEngine();
    }
  }, [deviceTier, currentView, canRenderHeavyDesktop, isMobile, allRemoteSplines]);

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
        <div className="fixed inset-0 z-99999 bg-black flex items-center justify-center">
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
        <div className="fixed inset-0 z-99999 bg-black">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === 'loader' && (
        <div className="fixed inset-0 z-99999 bg-black">
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
                    sources={featuredVideos}
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

            {/* MetaTrader Quotes Section */}
            <section
              id="metatrader-quotes"
              className="w-full full-bleed"
              data-allow-scroll
              data-content
              data-theme-aware
            >
              <MetaTraderQuotes embedded />
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

            {/* TradingView Dashboard - Full replica below features */}
            <section
              id="tradingview-dashboard"
              className="w-full full-bleed px-2 sm:px-4 lg:px-6"
              data-allow-scroll
              data-content
              data-theme-aware
            >
              <TradingViewDashboard />
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

          {canRenderHeavyDesktop && theme?.youtubeId && (
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
  return (
    <>
      <HomeContent />
      <CookieConsent />
      <AppSupportButton />
    </>
  );
}
