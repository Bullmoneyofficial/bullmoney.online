"use client";

import { useState, useEffect, useRef, useCallback, startTransition, useDeferredValue, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
// ✅ HYDRATION OPTIMIZATION: Import deferred state utilities
import { useHydrated, useIdleCallback } from "@/hooks/useHydrationOptimization";
// ✅ LAZY-LOADED: These modules are only used in useEffect callbacks,
// so we use dynamic import() to avoid adding them to the compile-time module graph.
// browserDetection (309 lines), glassStyles (62 lines), prefetchHelper (170 lines)
// = 541 fewer lines in the critical compile chain

// Store Header replaces default navbar on app page
const StoreHeader = dynamic(() => import("@/components/store/StoreHeader").then(mod => ({ default: mod.StoreHeader })), { ssr: false }) as any;

// ✅ LOADING FALLBACKS - Mobile-optimized loading states
import {
  HeroSkeleton,
  MinimalFallback,
} from "@/components/MobileLazyLoadingFallback";

// ==========================================
// ✅ PERFORMANCE OPTIMIZED: Centralized dynamic imports
// ==========================================
import {
  HeroDesktop as DiscordDesktopHero,
  MetaTraderQuotes,
  Features,
  BullMoneyCommunity,
  BreakingNewsTicker,
  FooterComponent,
  PageMode,
  TradingUnlockLoader,
  TestimonialsCarousel,
  BrokerSignupSectionDark,
} from "@/components/home/dynamicImports";

// ✅ SHIMMER: Only 2 of 7 exports were used — inline them instead of importing 1,561-line module
// Eliminated: ShimmerBorder, ShimmerLine, ShimmerDot, ShimmerFloat, ShimmerContainer (all unused)
const ShimmerSpinner = ({ size = 48, color = "white" }: { size?: number; color?: string }) => (
  <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTop: `2px solid ${color}`, borderRadius: '50%', animation: 'bm-spin 0.8s linear infinite' }} />
);
const ShimmerRadialGlow = ({ color = "white", intensity = "low" }: { color?: string; intensity?: string }) => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${color}${intensity === 'low' ? '0a' : '1a'} 0%, transparent 70%)` }} />
);

// ✅ PERF: Heavy systems lazy-loaded — not needed for compile or first paint
// UnifiedPerformanceSystem (1,641 lines), CrashTracker (1,008 lines), bigDeviceScrollOptimizer (212 lines)
// = 2,861 fewer lines in the critical compile chain
import { useLazyUnifiedPerformance, useLazyBigDeviceScrollOptimizer } from "@/lib/lazyPerformanceHooks";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { useUIState } from "@/contexts/UIStateHook";
// ✅ LAZY: forceEnableScrolling (342 lines) loaded via import() in useEffect below
import type { HeroMode } from "@/hooks/useHeroMode";



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

// ✅ LAZY: useAudioEngine (359 lines) + useShowcaseScroll (461+134 lines) converted to lazy effect components
// They are side-effect-only hooks (no return values used), so rendering as components defers their module resolution
const LazyShowcaseScroll = dynamic(() => import("@/hooks/useShowcaseScroll").then(mod => ({
  default: function ShowcaseScrollEffect(props: { startDelay: number; enabled: boolean; pageId: string; persistInSession: boolean }) {
    mod.useShowcaseScroll(props);
    return null;
  }
})), { ssr: false });

const LazyAudioEngine = dynamic(() => import("@/app/hooks/useAudioEngine").then(mod => ({
  default: function AudioEngineEffect({ enabled, mode }: { enabled: boolean; mode: 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT' }) {
    mod.useAudioEngine(enabled, mode);
    return null;
  }
})), { ssr: false });

const HomePagePerformanceSystems = dynamic(
  () => import("./HomePagePerformanceSystems"),
  { ssr: false }
);

// Lazy load heavy components that aren't needed immediately
const DiscordMobileHero = dynamic(
  () => import("@/components/MobileDiscordHero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

const TelegramUnlockScreen = dynamic(
  () => import("@/components/REGISTER USERS/TelegramConfirmationResponsive").then(mod => ({
    default: mod.TelegramConfirmationResponsive,
  })),
  { ssr: false, loading: () => <MinimalFallback /> }
);


// ✅ CLEANED: SplineModals (RemoteSceneModal, SplitSceneModal, AllScenesModal, OrbSplineLauncher) removed — never rendered


// Legacy flag placeholder to satisfy stale client bundles that may reference it during Fast Refresh.

type HomePageClientProps = {
  initialView?: 'pagemode' | 'loader' | 'telegram' | 'content';
  skipInit?: boolean;
};

function HomeContent({ initialView = 'pagemode', skipInit = false }: HomePageClientProps) {
  const { optimizeSection } = useLazyBigDeviceScrollOptimizer();
  const isHydrated = useHydrated();
  
  // ✅ HYDRATION OPTIMIZED: Start with safe defaults that match SSR
  // useEffect will check localStorage on client mount
  // This ensures SSR hydration works correctly in production
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'telegram' | 'content'>(initialView);
  const [isInitialized, setIsInitialized] = useState(skipInit);
  // ✅ HYDRATION OPTIMIZED: Initialize as false to match server render
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [desktopHeroReady, setDesktopHeroReady] = useState(false);
  const [allowHeavyDesktop, setAllowHeavyDesktop] = useState(false);
  const [appHeroMode, setAppHeroMode] = useState<HeroMode>('trader');
  const appRouter = useRouter();

  // Navigate to the appropriate page when hero mode changes
  const handleAppHeroModeChange = useCallback((mode: HeroMode) => {
    if (mode === 'design') {
      appRouter.push('/design');
    } else if (mode === 'store') {
      appRouter.push('/store');
    } else {
      setAppHeroMode(mode);
    }
  }, [appRouter]);

  // Legacy flag retained for older bundles; default keeps desktop on 3D hero.
  const desktopHeroVariant = 'spline';
  const useDesktopVideoVariant = desktopHeroVariant === 'spline';
  const { shouldRender: allowMobileLazyRender } = useMobileLazyRender(240);
  const { masterMuted } = useAudioSettings();
  const [isMuted, setIsMuted] = useState(false);
  const [featuredVideos, setFeaturedVideos] = useState<any[]>([]);
  const [allRemoteSplines, setAllRemoteSplines] = useState<any[]>([]);
  const splinePreloadRanRef = useRef(false);
  const { setLoaderv2Open, setV2Unlocked, devSkipPageModeAndLoader, setDevSkipPageModeAndLoader, openDiscordStageModal, openAccountManagerModal } = useUIState();

  // Showcase scroll — lazy-loaded as effect component (461+134 lines deferred)
  // Rendered as <LazyShowcaseScroll /> in JSX below

  // ✅ HYDRATION OPTIMIZED: Defer analytics + prefetch to after hydration and idle time
  useIdleCallback(() => {
    import("@/lib/prefetchHelper").then(({ deferAnalytics, smartPrefetch }) => {
      deferAnalytics(() => {
        import("@/lib/analytics").then(() => {
          console.log('[Performance] Analytics loaded after page interaction');
        });
      });
      smartPrefetch([
        { href: '/store', options: { priority: 'low' } },
        { href: '/trading-showcase', options: { priority: 'low' } },
        { href: '/community', options: { priority: 'low' } },
        { href: '/course', options: { priority: 'low' } },
      ]);
    });
  }, { timeout: 3000, enabled: isHydrated });

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

    // Safety: clear residual splash sway class on route entry
    root.classList.remove('bm-sway', 'bm-sway-safe');
    body.classList.remove('bm-sway', 'bm-sway-safe');
    
    // NOTE: Don't remove drunk scroll here - it's used by showcase scroll animation
    // forceScrollEnabler will handle cleanup when showcase is not active
    
    root.classList.add('home-active');
    body.classList.add('home-page-body');
    root.setAttribute('data-app-page', 'true');
    body.setAttribute('data-app-page', 'true');
    
    // Force enable scrolling (lazy-loaded: 342 lines)
    let cleanup: (() => void) | undefined;
    import("@/lib/forceScrollEnabler").then(mod => {
      cleanup = mod.forceEnableScrolling();
    });
    
    return () => {
      root.classList.remove('home-active');
      body.classList.remove('home-page-body');
      root.removeAttribute('data-app-page');
      body.removeAttribute('data-app-page');
      cleanup?.();
    };
  }, []);

  // Prevent browser from auto-restoring scroll position on page load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let previousRestoration: string | undefined;
    if ('scrollRestoration' in window.history) {
      previousRestoration = (window.history as any).scrollRestoration;
      (window.history as any).scrollRestoration = 'manual';
    }

    // Start at top of page
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', pathname + search);
    window.scrollTo({ top: 0, behavior: 'auto' });

    return () => {
      if (previousRestoration !== undefined && 'scrollRestoration' in window.history) {
        (window.history as any).scrollRestoration = previousRestoration;
      }
    };
  }, []);

  // Use unified performance for tracking (lazy-loaded to avoid 2,861 lines at compile time)
  const { 
    deviceTier, 
    registerComponent, 
    unregisterComponent,
    shimmerQuality
  } = useLazyUnifiedPerformance();

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
  // ✅ Audio engine rendered as lazy component below: <LazyAudioEngine />
  const audioEngineEnabled = hasMounted && !isMuted;
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
    containIntrinsicSize: 'auto 900px',
    contain: 'layout paint style',
  };
  
  useEffect(() => {
    if (currentView !== 'content') {
      setSequenceStage(0);
      return;
    }

    // ✅ HYDRATION OPTIMIZED: Mount all stages immediately using startTransition
    // This marks the update as non-urgent so it doesn't block interactions
    startTransition(() => {
      setSequenceStage(5);
    });
  }, [currentView]);
  
  const componentsRegisteredRef = useRef(false);
  // Store callback refs to avoid dependency changes triggering cleanup
  const registerComponentRef = useRef(registerComponent);
  const unregisterComponentRef = useRef(unregisterComponent);
  const optimizeSectionRef = useRef(optimizeSection);

  // Keep refs updated
  useEffect(() => {
    registerComponentRef.current = registerComponent;
    unregisterComponentRef.current = unregisterComponent;
    optimizeSectionRef.current = optimizeSection;
  });
  
  // Register main content components - only depends on currentView
  useEffect(() => {
    if (currentView === 'content' && !componentsRegisteredRef.current) {
      componentsRegisteredRef.current = true;
      registerComponentRef.current('hero', 9);
      registerComponentRef.current('features', 5);
      registerComponentRef.current('ticker', 7);
      
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
        const { detectBrowser } = await import("@/lib/browserDetection");
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

  // Listen for forced pagemode event (dispatched when user clicks sign-in on StoreHeader while already on '/')
  useEffect(() => {
    const handler = () => {
      const loginViewFlag = safeGetLocal('bullmoney_pagemode_login_view');
      // Ensure pagemode login view flag is set if it was stored before dispatch
      if (loginViewFlag !== 'true') {
        try { localStorage.setItem('bullmoney_pagemode_login_view', 'true'); } catch {}
      }
      setCurrentView('pagemode');
      setIsInitialized(true);
    };
    window.addEventListener('bullmoney_force_pagemode', handler);
    return () => window.removeEventListener('bullmoney_force_pagemode', handler);
  }, []);

  // Check localStorage on client mount to determine the correct view
  // This runs once on mount and sets the view based on user's previous progress
  useEffect(() => {
    if (skipInit) return;
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

    // ===== Simple random v3 loader on reload =====
    try {
      const sessionCountKey = "bullmoney_refresh_count";

      // Session refresh counter
      const sessionCount = Number(safeGetSession(sessionCountKey) || "0") + 1;
      safeSetSession(sessionCountKey, String(sessionCount));

      // After 5 reloads in a session, clear non-auth caches
      if (sessionCount >= 5) {
        const AUTH_PRESERVE_KEYS = [
          'bullmoney_session', 'bullmoney_pagemode_completed',
          'bullmoney_loader_completed', 'bullmoney_telegram_confirmed',
          'bullmoney_muted', 'bullmoney_xm_redirect_done',
          'supabase.auth.token', 'sb-', 'bullmoney_user',
          'bullmoney_auth', 'bullmoney_login', 'bullmoney_token',
        ];
        const keysToKeep: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (AUTH_PRESERVE_KEYS.some(pk => key === pk || key.startsWith(pk))) {
            keysToKeep[key] = localStorage.getItem(key) || '';
          }
        }
        localStorage.clear();
        Object.entries(keysToKeep).forEach(([k, v]) => localStorage.setItem(k, v));
        safeSetSession(sessionCountKey, "0");
        console.log('[Page] 5+ reloads - cleared cache (auth preserved)');
      }

      // ~20% random chance to show v3 loader on reload
      if (Math.random() < 0.20) {
        shouldForceLoader = true;
        forceReasons.push('random_20_percent');
      }
    } catch (error) {
      console.warn('[Page] Refresh trigger check failed', error);
    }

    console.log('[Page] Session check:', { hasSession: !!hasSession, hasCompletedPagemode, hasCompletedLoader, shouldForceLoader, forceReasons });

    // CRITICAL: Pagemode/welcome screen MUST always show first
    // MultiStepLoaderv3Simple shows randomly on ~20% of reloads for returning users
    if (!hasCompletedPagemode && !hasSession) {
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
      // Random v3 loader trigger (~20% chance on reload)
      console.log('[Page] Random v3 loader trigger');
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
  }, [skipInit, setV2Unlocked]);

  useEffect(() => {
    setHasMounted(true);

    // --- Consolidated viewport listeners (was 2 separate effects) ---
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const ultraWideMq = window.matchMedia('(min-width: 1980px)');
    setIsDesktop(desktopMq.matches);
    setIsUltraWide(ultraWideMq.matches);

    const updateDesktop = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    const updateUltraWide = (event: MediaQueryListEvent) => setIsUltraWide(event.matches);

    window.addEventListener('resize', checkMobile);
    desktopMq.addEventListener('change', updateDesktop);
    ultraWideMq.addEventListener('change', updateUltraWide);

    return () => {
      window.removeEventListener('resize', checkMobile);
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
      const normalizedRedirectPath = redirectPath === '/store/account' ? '/store' : redirectPath;
      safeRemoveLocal(PAGEMODE_REDIRECT_PATH_KEY);
      safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
      window.location.assign(normalizedRedirectPath);
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
    // Open broker signups in background tabs for new users — user stays on Bull Money
    const alreadyRedirected = safeGetLocal('bullmoney_xm_redirect_done');
    if (alreadyRedirected !== 'true') {
      try {
        navigator.clipboard.writeText('X3R7P').catch(() => {});
      } catch {}
      const xmTab = window.open('https://affs.click/t5wni', '_blank');
      try { xmTab?.blur(); window.focus(); } catch {}
      setTimeout(() => {
        const vTab = window.open('https://vigco.co/iQbe2u', '_blank');
        try { vTab?.blur(); window.focus(); } catch {}
      }, 600);
      safeSetLocal('bullmoney_xm_redirect_done', 'true');
    }
    // Show the real Bull Money home page
    setV2Unlocked(true);
    setCurrentView('content');
  }, [setV2Unlocked]);

  // Lazy-load GLASS_STYLES to avoid compiling glassStyles module at startup
  const [glassStyles, setGlassStyles] = useState('');
  useEffect(() => {
    import("@/styles/glassStyles").then(mod => setGlassStyles(mod.GLASS_STYLES));
  }, []);

  if (!isInitialized) {
    return (
      <>
        <style jsx global>{`
          @keyframes bm-spin { to { transform: rotate(360deg) } }
          nav, footer, header {
            opacity: 0 !important;
            pointer-events: none !important;
            position: fixed !important;
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
      <style>{glassStyles}</style>

      {/* Defer heavy tracking until content is visible */}
      {currentView === 'content' && (
        <HomePagePerformanceSystems enabled={true} pageView={currentView} />
      )}
      
      {/* ✅ Lazy effect components — defers 1,296 lines from initial compile */}
      <LazyShowcaseScroll
        startDelay={currentView === 'content' ? 1200 : 99999}
        enabled={currentView === 'content'}
        pageId="home"
        persistInSession={false}
      />
      <LazyAudioEngine enabled={audioEngineEnabled} mode="MECHANICAL" />
      
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
        <div className="relative min-h-screen w-full" style={{ 
          overflowY: 'visible', 
          overflowX: 'hidden',
          height: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y pan-x',
          scrollBehavior: 'auto',
        }}>
          {/* Store Header as main navigation (Design/Trader toggle on app page) */}
          <StoreHeader heroModeOverride={appHeroMode} onHeroModeChangeOverride={handleAppHeroModeChange} />

          {appHeroMode === 'trader' && (
            <style>{`
              /* CRITICAL: Top-level scroll fix - MUST be first */
              html, body {
                overflow-y: auto !important;
                overflow-x: hidden !important;
                height: auto !important;
                min-height: 100vh !important;
                touch-action: pan-y pan-x !important;
                position: relative !important;
                scroll-behavior: auto !important;
              }
              
              /* iOS-specific scroll fixes */
              @supports (-webkit-touch-callout: none) {
                html, body {
                  -webkit-overflow-scrolling: touch !important;
                }
              }
              
              /* MOBILE FIX: Ensure scrolling works on mobile */
              @media (max-width: 767px) {
                body, html {
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                  -webkit-overflow-scrolling: touch !important;
                  touch-action: pan-y pan-x !important;
                }
              }
              
              /* DESKTOP FIX: Ensure scrolling works on desktop */
              @media (min-width: 768px) {
                body, html {
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                }
                #hero {
                  height: auto !important;
                  max-height: none !important;
                  overflow-y: visible !important;
                }
              }
              
              #hero .cycling-bg-layer,
              #hero .cycling-bg-item,
              #hero .cycling-bg-item.active {
                pointer-events: none !important;
                touch-action: pan-y pan-x !important;
              }
              #hero .cycling-bg-layer canvas,
              #hero .cycling-bg-item canvas {
                pointer-events: auto !important;
              }
              #hero .hero-wrapper {
                overflow: visible !important;
                overflow-x: hidden !important;
                touch-action: pan-y pan-x !important;
              }
              #hero .hero-content-overlay {
                pointer-events: none;
                touch-action: pan-y pan-x !important;
              }
              #hero .hero-content-overlay > * {
                pointer-events: auto;
              }
            `}</style>
          )}

          {appHeroMode === 'trader' && (
            <section
              id="hero"
              className={isMobile
                ? "w-full full-bleed flex flex-col overflow-x-hidden overflow-y-visible relative px-2 sm:px-4"
                : "w-full full-bleed flex flex-col overflow-x-hidden overflow-y-visible relative px-2 sm:px-4"}
              style={isMobile ? {
                minHeight: 'auto',
                height: 'auto',
                paddingTop: 'calc(52px + env(safe-area-inset-top, 0px))',
                paddingBottom: '12px',
              } : {
                minHeight: 'auto',
                height: 'auto',
                paddingTop: '52px',
                paddingBottom: '40px',
              }}
              data-canvas-section="true"
              data-allow-scroll
              data-content
              data-theme-aware
            >
              {/* Hero Content */}
              <div className={isMobile ? "flex-shrink-0" : "flex-shrink-0"}>
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
              </div>

              {/* Broker Signup section within hero — above community */}
              <div style={{ flexShrink: 0, marginTop: isMobile ? 24 : 48 }}>
                {hasMounted && showStage2 && (
                    <BrokerSignupSectionDark />
                )}
              </div>

              {/* Community Signals section within hero */}
              <div data-apple-section-wrapper style={{ flexShrink: 0, marginTop: isMobile ? 24 : 48, contentVisibility: 'visible', contain: 'none' }}>
                {hasMounted && showStage2 && (
                    <div
                      style={isMobile ? {
                        width: '100%',
                        borderTop: '1px solid rgba(255,255,255,0.15)',
                        overflow: 'hidden',
                        background: '#000000',
                      } : {
                        margin: '0 auto',
                        width: '100%',
                        maxWidth: 1800,
                        borderRadius: 24,
                        border: '1px solid rgba(255,255,255,0.15)',
                        overflow: 'hidden',
                        background: 'linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                      }}
                    >
                      {!isMobile && (
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(255,255,255,0.55)' }}>Community Hub</p>
                          <h2 style={{ marginTop: 8, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff' }}>
                            Community Signals
                          </h2>
                          <p style={{ marginTop: 8, fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.7)', maxWidth: 768 }}>
                            Connect with the BullMoney trading community and access real-time signals and market insights.
                          </p>
                        </div>
                      )}

                      <div
                        style={{
                          height: isMobile ? 'min(50vh, 400px)' : 'min(60vh, 700px)',
                          minHeight: isMobile ? '280px' : 'min(40vh, 480px)',
                          background: '#ffffff',
                        }}
                      >
                        <div
                          style={{ height: '100%', overflowX: 'auto', overflowY: 'hidden', touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
                        >
                          <BullMoneyCommunity />
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Market Quotes section within hero */}
              <div data-apple-section-wrapper className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}>
                {hasMounted && showStage2 && (
                  <div style={deferredSectionStyle}>
                    <div
                      className={isMobile
                        ? "w-full border-t border-white/15 overflow-hidden"
                        : "mx-auto w-full max-w-[1800px] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden"}
                      style={isMobile ? {
                        background: '#000000',
                      } : {
                        background: 'linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                      }}
                    >
                      {!isMobile && (
                        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/10">
                          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55">Live Market Data</p>
                          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                            Market Quotes
                          </h2>
                          <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl">
                            Real-time quotes and market data to keep you informed on price movements and trading opportunities.
                          </p>
                        </div>
                      )}

                      <div
                        style={{
                          height: isMobile ? 'min(35vh, 280px)' : 'min(50vh, 500px)',
                          minHeight: isMobile ? '200px' : '300px',
                          background: '#0a0a0a',
                        }}
                      >
                        <div
                          className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                        >
                          <MetaTraderQuotes embedded />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Breaking News section within hero */}
              <div data-apple-section-wrapper className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}>
                {hasMounted && showStage2 && (
                  <div style={deferredSectionStyle}>
                    <div
                      className={isMobile
                        ? "w-full border-t border-white/15 overflow-hidden"
                        : "mx-auto w-full max-w-[1800px] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden"}
                      style={isMobile ? {
                        background: '#000000',
                      } : {
                        background: 'linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                      }}
                    >
                      {!isMobile && (
                        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/10">
                          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55">Market News</p>
                          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                            Breaking News
                          </h2>
                          <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl">
                            Stay updated with the latest market-moving news and financial headlines from around the world.
                          </p>
                        </div>
                      )}

                      <div
                        style={{
                          background: '#000000',
                        }}
                      >
                        <div
                          className="w-full"
                        >
                          <BreakingNewsTicker />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Features section within hero */}
              <div data-apple-section-wrapper className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}>
                {hasMounted && showStage2 && (
                  <div style={deferredSectionStyle}>
                    <FeaturesComponent />
                  </div>
                )}
              </div>

              {/* Testimonials section within hero */}
              <div className={isMobile ? "flex-shrink-0 mt-6" : "flex-shrink-0 mt-12"}>
                {hasMounted && showStage3 && (
                  <div style={deferredSectionStyle}>
                    <TestimonialsCarousel />
                  </div>
                )}
              </div>

              {/* Footer section within hero */}
              <div className={isMobile ? "flex-shrink-0 mt-8" : "flex-shrink-0 mt-16"}>
                {hasMounted && showStage4 && (
                  <div style={deferredSectionStyle}>
                    <FooterComponent />
                  </div>
                )}
              </div>
            </section>
          )}



          {/* Store page is isolated under /store. Keep home content only here. */}
        </div>
      )}
    </>
  );
}

export function HomePageClient(props: HomePageClientProps = {}) {
  return (
    <>
      <HomeContent {...props} />
    </>
  );
}

export default HomePageClient;
