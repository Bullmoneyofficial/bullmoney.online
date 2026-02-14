"use client";

import { useState, useEffect, useRef, useCallback, startTransition, useDeferredValue, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
import { useLazyUnifiedPerformance, useLazyComponentTracking, useLazyCrashTracker, useLazyBigDeviceScrollOptimizer } from "@/lib/lazyPerformanceHooks";
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


// ═══════════════════════════════════════════════════════════════════
// WhiteboardCanvas Component - Click to Activate (prevents scroll snapping)
// ═══════════════════════════════════════════════════════════════════
function WhiteboardCanvas({ isMobile }: { isMobile: boolean }) {
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleActivate = () => {
    setIsActive(true);
  };
  
  // Prevent iframe from causing auto-scroll on load
  useEffect(() => {
    if (containerRef.current) {
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      const container = containerRef.current;
      container.addEventListener('scroll', preventScroll, { passive: false });
      container.addEventListener('focus', preventScroll, { passive: false });
      
      return () => {
        container.removeEventListener('scroll', preventScroll);
        container.removeEventListener('focus', preventScroll);
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={isMobile ? "flex-shrink-0 mt-4" : "flex-shrink-0 mt-8"}
      data-whiteboard-container
      style={{
        scrollMarginTop: '100vh',
        contain: 'layout style paint',
      }}
    >
      <div
        className={isMobile
          ? "w-full border-t border-white/15 overflow-hidden"
          : "mx-auto w-full max-w-[1800px] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden"}
        style={isMobile ? {
          background: '#000000',
          scrollMarginTop: '100vh',
        } : {
          background: 'linear-gradient(180deg, rgba(7,7,7,0.98), rgba(0,0,0,1))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          scrollMarginTop: '100vh',
        }}
      >
        {!isMobile && (
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-white/10">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55">Notes & Whiteboard</p>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
              Trader Notes & Whiteboard Page
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl">
              Use this page to map setups, annotate chart ideas, plan risk, and track post-trade lessons in one focused workspace built for traders.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Pre-market plan",
                "Trade setup mapping",
                "Risk/reward scenarios",
                "Session notes",
                "Post-trade review",
                "Weekly playbook",
              ].map((useCase) => (
                <span
                  key={useCase}
                  className="inline-flex items-center rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.08em] text-white/90"
                >
                  {useCase}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                href="/design"
                prefetch={true}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                Open Full Notes Studio
              </Link>
              <a
                href="https://excalidraw.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                Open Whiteboard In New Tab
              </a>
            </div>
          </div>
        )}

        <div
          style={{
            height: isMobile ? 'min(50vh, 400px)' : 'min(60vh, 700px)',
            minHeight: isMobile ? '280px' : 'min(40vh, 480px)',
            background: '#ffffff',
            position: 'relative',
          }}
        >
          {/* Click to activate overlay - prevents scroll snap and touch interference */}
          {!isActive && (
            <div
              onClick={handleActivate}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                cursor: 'pointer',
                pointerEvents: 'auto',
                touchAction: 'none',
                background: 'rgba(0, 0, 0, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(1px)',
                transition: 'all 0.2s ease',
              }}
              className="hover:bg-black/5"
            >
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  color: 'white',
                  padding: isMobile ? '12px 24px' : '16px 32px',
                  borderRadius: '999px',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {isMobile ? 'Tap to Enable' : 'Click to Enable Whiteboard'}
              </div>
            </div>
          )}
          
          {/* Iframe with interaction disabled by default */}
          <iframe
            src="https://excalidraw.com"
            title="App Design Canvas"
            className={isActive ? 'active' : ''}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              pointerEvents: isActive ? 'auto' : 'none',
              touchAction: isActive ? 'auto' : 'none',
              WebkitOverflowScrolling: isActive ? 'touch' : undefined,
              scrollMarginTop: '100vh',
              contain: 'strict',
            }}
            loading="lazy"
            tabIndex={isActive ? 0 : -1}
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={(e) => {
              // Prevent iframe from stealing focus and scrolling page
              if (!isActive) {
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  iframe.blur();
                  // Prevent any scroll behavior
                  if (iframe.contentWindow) {
                    try {
                      iframe.contentWindow.scroll = () => {};
                    } catch {}
                  }
                } catch {}
              }
            }}
            onFocus={(e) => {
              // Prevent focus from scrolling page
              if (!isActive) {
                e.preventDefault();
                (e.target as HTMLIFrameElement).blur();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════

// Legacy flag placeholder to satisfy stale client bundles that may reference it during Fast Refresh.

function HomeContent() {
  const { optimizeSection } = useLazyBigDeviceScrollOptimizer();
  const isHydrated = useHydrated();
  
  // ✅ HYDRATION OPTIMIZED: Start with safe defaults that match SSR
  // useEffect will check localStorage on client mount
  // This ensures SSR hydration works correctly in production
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'telegram' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Use unified performance for tracking (lazy-loaded to avoid 2,861 lines at compile time)
  const { 
    deviceTier, 
    registerComponent, 
    unregisterComponent,
    averageFps,
    shimmerQuality,
    preloadQueue,
    unloadQueue 
  } = useLazyUnifiedPerformance();
  
  // Crash tracking for the main page
  const { trackClick, trackError, trackCustom } = useLazyComponentTracking('page');
  const { trackPerformanceWarning } = useLazyCrashTracker();

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
          overflowY: 'auto', 
          overflowX: 'hidden',
          height: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y pan-x',
          scrollBehavior: 'auto',
          willChange: 'scroll-position',
          contain: 'layout style paint'
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
                paddingTop: 'calc(110px + env(safe-area-inset-top, 0px))',
                paddingBottom: '12px',
              } : {
                minHeight: 'auto',
                height: 'auto',
                paddingTop: '120px',
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

              {/* Canvas/Whiteboard integrated into hero */}
              <WhiteboardCanvas isMobile={isMobile} />

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

              {/* Community Signals section within hero */}
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
                          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55">Community Hub</p>
                          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                            Community Signals
                          </h2>
                          <p className="mt-2 text-sm sm:text-base text-white/70 max-w-3xl">
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
                          className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                        >
                          <BullMoneyCommunity />
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

export function HomePageClient() {
  return (
    <>
      <HomeContent />
    </>
  );
}

export default HomePageClient;
