"use client";

import { Suspense, useState, useEffect, useRef, useCallback, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { detectBrowser } from "@/lib/browserDetection";
import { GLASS_STYLES } from "@/styles/glassStyles";
import { deferAnalytics, smartPrefetch } from "@/lib/prefetchHelper";

// Store Header replaces default navbar on app page
const StoreHeader = dynamic(() => import("@/components/store/StoreHeader").then(mod => ({ default: mod.StoreHeader })), { ssr: false }) as any;

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
  HeroDesktop as DiscordDesktopHero,
  MetaTraderQuotes,
  BullMoneyPromoScroll,
  Features,
  TradingViewDashboard,
  BullMoneyCommunity,
  BreakingNewsTicker,
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
import { userStorage } from "@/lib/smartStorage";
import { useHeroMode } from "@/hooks/useHeroMode";

// Features skeleton fallback (inline for faster load)
const FeaturesSkeleton = () => (
  <div className="w-full h-100 bg-linear-to-b from-black to-zinc-900/50 animate-pulse rounded-xl" />
);

const HERO_MODE_CACHE_KEY = "hero_main_mode_v1";
const HERO_MODE_CACHE_TTL = 1000 * 60 * 60 * 24;

const safeGetLocal = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetLocal = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be blocked in in-app/private modes
  }
};

const safeRemoveLocal = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be blocked in in-app/private modes
  }
};

const safeGetSession = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetSession = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage may be blocked in in-app/private modes
  }
};

const PAGEMODE_FORCE_LOGIN_KEY = "bullmoney_pagemode_force_login";
const PAGEMODE_REDIRECT_PATH_KEY = "bullmoney_pagemode_redirect_path";

function DeferredRender({
  children,
  fallback,
  rootMargin = "260px",
  minDelayMs = 0,
  idle = true,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minDelayMs?: number;
  idle?: boolean;
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    let observer: IntersectionObserver | null = null;

    const activate = () => {
      if (!cancelled) setShouldRender(true);
    };

    if (minDelayMs > 0) {
      timeoutId = setTimeout(activate, minDelayMs);
    }

    if (idle && typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(activate, { timeout: 2000 });
    }

    if (typeof IntersectionObserver !== "undefined" && hostRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) activate();
        },
        { rootMargin }
      );
      observer.observe(hostRef.current);
    } else if (!idle) {
      activate();
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (observer) observer.disconnect();
    };
  }, [shouldRender, rootMargin, minDelayMs, idle]);

  return <div ref={hostRef}>{shouldRender ? children : fallback ?? null}</div>;
}

import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";
import Link from "next/link";
import { StoreMemoryProvider } from "./store/StoreMemoryContext";

// Lazy load heavy components that aren't needed immediately
const DiscordMobileHero = dynamic(
  () => import("@/components/MobileDiscordHero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

// ✅ SECTION IMPORTS - All page sections in one file for easier editing
const ToastProvider = dynamic(
  () => import("./PageSections").then(mod => mod.ToastProvider),
  { ssr: false, loading: () => null }
);

const TelegramSection = dynamic(
  () => import("./PageSections").then(mod => mod.TelegramSection),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const QuotesSection = dynamic(
  () => import("./PageSections").then(mod => mod.QuotesSection),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const BreakingNewsSection = dynamic(
  () => import("./PageSections").then(mod => mod.BreakingNewsSection),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const TelegramUnlockScreen = dynamic(
  () => import("@/components/REGISTER USERS/TelegramConfirmationResponsive").then(mod => ({
    default: mod.TelegramConfirmationResponsive,
  })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const StorePageContent = dynamic(
  () => import("./store/page"),
  { ssr: false, loading: () => <ContentSkeleton lines={6} /> }
);

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
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'telegram' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [desktopHeroReady, setDesktopHeroReady] = useState(false);
  const [allowHeavyDesktop, setAllowHeavyDesktop] = useState(false);
  const { heroMode: mainHeroMode, setHeroMode: setMainHeroMode } = useHeroMode();
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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('home-active');
    body.classList.add('home-page-body');
    return () => {
      root.classList.remove('home-active');
      body.classList.remove('home-page-body');
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSmallDesktop = window.innerWidth <= 1200 && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isSmallDesktop) return;

    let rafId: number | null = null;
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 1) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      const start = document.scrollingElement?.scrollTop ?? window.scrollY;
      rafId = requestAnimationFrame(() => {
        const current = document.scrollingElement?.scrollTop ?? window.scrollY;
        if (Math.abs(current - start) < 1) {
          window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
        }
        rafId = null;
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Hero mode is now managed by useHeroMode hook
  }, []);

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
  const canRenderHeavyDesktop = !isMobile && allowHeavyDesktop && isDesktop;
  // Use single dynamic Features component for all devices
  const FeaturesComponent = Features;
  const [sequenceStage, setSequenceStage] = useState(0);
  const showStage1 = currentView === 'content' && sequenceStage >= 1;
  const showStage2 = currentView === 'content' && sequenceStage >= 2;
  const showStage3 = currentView === 'content' && sequenceStage >= 3;
  const showStage4 = currentView === 'content' && sequenceStage >= 4;
  const showStage5 = currentView === 'content' && sequenceStage >= 5;
  const deferredSectionStyle: CSSProperties = {
    contentVisibility: 'auto',
    containIntrinsicSize: '900px',
    contain: 'layout paint',
  };
  
  // Track FPS drops
  useEffect(() => {
    if (averageFps < 25 && currentView === 'content') {
      trackPerformanceWarning('page', averageFps, `FPS dropped to ${averageFps}`);
    }
  }, [averageFps, currentView, trackPerformanceWarning]);

  useEffect(() => {
    if (currentView !== 'content') {
      setSequenceStage(0);
      return;
    }

    // Mount all stages immediately - no staggered delays
    setSequenceStage(5);
  }, [currentView]);
  
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
    const savedMuted = safeGetLocal('bullmoney_muted');
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
        const safeForSplinePreload = !browserInfo.isInAppBrowser
          && browserInfo.canHandle3D
          && !browserInfo.shouldReduceAnimations
          && !browserInfo.isLowMemoryDevice
          && !browserInfo.isUltraLowMemoryDevice
          && !browserInfo.shouldDisableSpline;
        if (!safeForSplinePreload) return;
        if (splinePreloadRanRef.current) return;

        if (deviceTier === 'low' || deviceTier === 'minimal') return;
        if (typeof window !== 'undefined' && window.innerWidth < 1024) return;

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
    
    const canPreloadSpline = currentView === 'content' && canRenderHeavyDesktop && sequenceStage >= 3;

    // Only run preload when content is active and the heavy section is about to appear
    if (canPreloadSpline) {
      preloadSplineEngine();
    }
  }, [deviceTier, currentView, canRenderHeavyDesktop, isMobile, allRemoteSplines, sequenceStage]);

  // Check localStorage on client mount to determine the correct view
  // This runs once on mount and sets the view based on user's previous progress
  useEffect(() => {
    const forcePagemodeLogin = safeGetLocal(PAGEMODE_FORCE_LOGIN_KEY);
    if (forcePagemodeLogin === "true") {
      safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
      setCurrentView('pagemode');
      setIsInitialized(true);
      return;
    }

    const hasSession = safeGetLocal("bullmoney_session");
    const hasCompletedPagemode = safeGetLocal("bullmoney_pagemode_completed");
    const hasCompletedLoader = safeGetLocal("bullmoney_loader_completed");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");

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
      const sessionCount = Number(safeGetSession(sessionCountKey) || "0") + 1;
      safeSetSession(sessionCountKey, String(sessionCount));

      // If user refreshes more than 15 times in this session,
      // force the welcome/pagemode screen to show again.
      if (sessionCount > 15) {
        shouldResetPagemode = true;
        forceReasons.push(`refresh_over_15_${sessionCount}`);
      }

      // Track refresh timestamps for rapid-refresh detection (2-minute window)
      const rawTimes = safeGetSession(refreshTimesKey);
      const parsedTimes = JSON.parse(rawTimes || "[]");
      const times = Array.isArray(parsedTimes) ? parsedTimes : [];
      const recentTimes = (times as number[]).filter(t => now - t <= 120000);
      recentTimes.push(now);
      safeSetSession(refreshTimesKey, JSON.stringify(recentTimes));

      const lastRapidShown = Number(safeGetSession(rapidShownKey) || "0");
      const rapidCooldownMs = 120000;
      if (recentTimes.length >= 3 && now - lastRapidShown >= rapidCooldownMs) {
        shouldForceLoader = true;
        forceReasons.push("rapid_refresh_3_in_2min");
        safeSetSession(rapidShownKey, String(now));
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
      const lastDaily = Number(safeGetLocal(dailyKey) || "0");
      const target = new Date(now);
      target.setHours(23, 59, 50, 0);
      const targetTime = target.getTime();

      if (now >= targetTime && lastDaily < targetTime) {
        shouldForceLoader = true;
        forceReasons.push("daily_23_59_50");
        safeSetLocal(dailyKey, String(targetTime));
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
        safeRemoveLocal("bullmoney_pagemode_completed");
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
      if (hasCompletedTelegram === "true") {
        console.log('[Page] Loader + telegram already completed - skipping to content');
        setV2Unlocked(true);
        setCurrentView('content');
      } else {
        console.log('[Page] Loader completed, telegram pending - showing telegram step');
        setCurrentView('telegram');
      }
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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Mobile Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const ultraWideMq = window.matchMedia('(min-width: 1980px)');
    const updateDesktop = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    const updateUltraWide = (event: MediaQueryListEvent) => setIsUltraWide(event.matches);

    setIsDesktop(desktopMq.matches);
    setIsUltraWide(ultraWideMq.matches);

    desktopMq.addEventListener('change', updateDesktop);
    ultraWideMq.addEventListener('change', updateUltraWide);

    return () => {
      desktopMq.removeEventListener('change', updateDesktop);
      ultraWideMq.removeEventListener('change', updateUltraWide);
    };
  }, []);

  const handlePageModeUnlock = () => {
    // Mark pagemode as completed so user skips it on reload
    safeSetLocal("bullmoney_pagemode_completed", "true");
    console.log('[Page] Pagemode completed, checking if should skip to content or show loader');

    const redirectPath = safeGetLocal(PAGEMODE_REDIRECT_PATH_KEY);
    if (redirectPath) {
      safeRemoveLocal(PAGEMODE_REDIRECT_PATH_KEY);
      safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
      window.location.assign(redirectPath);
      return;
    }
    
    // If loader was already completed, skip directly to content
    const hasCompletedLoader = safeGetLocal("bullmoney_loader_completed");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    if (hasCompletedLoader === "true") {
      if (hasCompletedTelegram === "true") {
        console.log('[Page] Loader + telegram already completed, skipping to content');
        setV2Unlocked(true);
        setCurrentView('content');
      } else {
        console.log('[Page] Loader completed, showing telegram confirmation');
        setCurrentView('telegram');
      }
      return;
    }

    console.log('[Page] Moving to V3 loader');
    setCurrentView('loader');
  };

  // Called when user completes the vault
  const handleLoaderComplete = useCallback(() => {
    console.log('[Page] V3 completed - moving to telegram confirmation');
    safeSetLocal("bullmoney_loader_completed", "true");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    if (hasCompletedTelegram === "true") {
      setV2Unlocked(true);
      setCurrentView('content');
      return;
    }
    setCurrentView('telegram');
  }, [setV2Unlocked]);

  const handleTelegramUnlock = useCallback(() => {
    safeSetLocal("bullmoney_loader_completed", "true");
    safeSetLocal("bullmoney_telegram_confirmed", "true");
    setV2Unlocked(true);
    setCurrentView('content');
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

      {currentView === 'telegram' && (
        <div className="fixed inset-0 z-99999 bg-black">
          <TelegramUnlockScreen
            onUnlock={handleTelegramUnlock}
            onConfirmationClicked={() => undefined}
            isXM={false}
            neonIconClass="neon-blue-icon"
          />
        </div>
      )}

      {currentView === 'content' && (
        <div className="relative min-h-screen w-full">
          {/* Store Header as main navigation (includes unified Store/Trader toggle) */}
          <StoreHeader />

          {mainHeroMode === 'trader' && (
            <style>{`
              #hero .spline-container,
              #hero [data-spline],
              #hero canvas,
              #hero spline-viewer,
              #hero iframe[src*="spline"] {
                pointer-events: none !important;
                touch-action: pan-y !important;
              }
            `}</style>
          )}

          {mainHeroMode === 'trader' && (
            <section
              id="hero"
              className={isMobile
                ? "w-full full-bleed flex items-end justify-center overflow-hidden relative px-2 sm:px-4"
                : "w-full full-bleed viewport-full relative px-2 sm:px-4"}
              style={isMobile ? {
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
              {!hasMounted ? (
                <HeroSkeleton />
              ) : isMobile ? (
                canRenderMobileSections ? (
                  <DiscordMobileHero
                    sources={featuredVideos}
                    onOpenModal={openDiscordStageModal}
                    variant="mobile"
                  />
                ) : (
                  <HeroSkeleton />
                )
              ) : (
                <DiscordDesktopHero />
              )}
            </section>
          )}

          <div className="mainpage-store-shell" data-hero-mode={mainHeroMode}>
            <StoreMemoryProvider>
              {hasMounted ? (
                <StorePageContent routeBase="/" syncUrl={false} showProductSections={mainHeroMode === 'store'} />
              ) : (
                <ContentSkeleton lines={6} />
              )}
            </StoreMemoryProvider>
          </div>

          {mainHeroMode === 'trader' && (
            <style>{`
              .mainpage-store-shell [data-store-hero] {
                display: none !important;
              }
            `}</style>
          )}
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <>
      <HomeContent />
    </>
  );
}
