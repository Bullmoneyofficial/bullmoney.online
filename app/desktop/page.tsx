"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { detectBrowser } from "@/lib/browserDetection";
import { trackEvent, BullMoneyAnalytics } from "@/lib/analytics";

// ==========================================
// DESKTOP-ONLY VERSION - 1K to 8K SCREEN SUPPORT
// Auto-detects desktop and redirects mobile users
// ==========================================

// LAZY-LOAD HEAVY COMPONENTS FOR FAST INITIAL COMPILE
const HeroDesktop = dynamic(() => import("@/components/HeroDesktop"), { ssr: false }) as any;
const CTA = dynamic(() => import("@/components/Chartnews"), { ssr: false }) as any;
import { Features } from "@/components/features";

// UNIFIED SHIMMER SYSTEM
import {
  ShimmerBorder,
  ShimmerLine,
  ShimmerSpinner,
  ShimmerDot,
  ShimmerFloat,
  ShimmerRadialGlow,
  ShimmerContainer
} from "@/components/ui/UnifiedShimmer";
import { SplineSkeleton, LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useCacheContext } from "@/components/CacheManagerProvider";
import { useUnifiedPerformance, useVisibility, useObserver, useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking, useCrashTracker } from "@/lib/CrashTracker";
import { useBigDeviceScrollOptimizer } from "@/lib/bigDeviceScrollOptimizer";

// Desktop-optimized ticker
const LiveMarketTicker = dynamic(() => import("@/components/LiveMarketTickerOptimized").then(mod => ({ default: mod.LiveMarketTickerOptimized })), { ssr: false }) as any;
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useUIState } from "@/contexts/UIStateContext";
const HiddenYoutubePlayer = dynamic(() => import("@/components/Mainpage/HiddenYoutubePlayer"), { ssr: false }) as any;
import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";

// Import dev utilities
import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

// Desktop-only keyboard navigation
const DesktopKeyNavigator = dynamic(() => import("@/components/navigation/DesktopKeyNavigator"), { ssr: false }) as any;

// Import loaders
const PageMode = dynamic(() => import("@/components/REGISTER USERS/pagemode"), { ssr: false }) as any;
const TradingUnlockLoader = dynamic(() => import("@/components/MultiStepLoaderv3Simple"), { ssr: false }) as any;

// Lazy imports for 3D components - Desktop optimized
const DraggableSplit = dynamic(() => import('@/components/DraggableSplit'), { ssr: false }) as any;
const SplineScene = dynamic(() => import('@/components/SplineScene'), { ssr: false }) as any;
const TestimonialsCarousel = dynamic(() => import('@/components/Testimonial').then(mod => ({ default: mod.TestimonialsCarousel })), { ssr: false }) as any;

// ==========================================
// DESKTOP SCREEN SIZE DETECTION CONSTANTS
// Supports 1K (1024px) to 8K (7680px) displays
// ==========================================
const DESKTOP_MIN_WIDTH = 1024;  // Minimum desktop width (1K)
const DESKTOP_8K_WIDTH = 7680;   // 8K UHD resolution
const DESKTOP_4K_WIDTH = 3840;   // 4K UHD resolution
const DESKTOP_2K_WIDTH = 2560;   // 2K QHD resolution
const DESKTOP_FHD_WIDTH = 1920;  // Full HD resolution

// --- SMART CONTAINER: Desktop-optimized Spline loading ---
function LazySplineContainer({ scene }: { scene: string }) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceCheckDone = useRef(false);

  const { observe, deviceTier, averageFps } = useUnifiedPerformance();

  // Desktop-optimized settings - no mobile restrictions
  useEffect(() => {
    if (deviceCheckDone.current) return;
    deviceCheckDone.current = true;

    console.log('[DesktopSpline] Desktop mode enabled - full quality');
    setCanRender(true);
    
    // Aggressive preloading for desktop
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

  // Use shared observer pool for visibility detection
  useEffect(() => {
    if (!containerRef.current || !canRender) return;

    return observe(containerRef.current, (isIntersecting: boolean) => {
      setIsInView(isIntersecting);
      if (isIntersecting && !hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }, { rootMargin: deviceTier === 'ultra' || deviceTier === 'high' ? '1400px' : '1100px' });
  }, [observe, hasLoadedOnce, canRender, deviceTier]);

  const shouldShowSpline = true;
  const isPaused = false;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative isolate overflow-hidden rounded-xl spline-container"
      data-spline-scene
      data-desktop-mode="true"
      data-interactive="true"
      style={{
        contain: 'layout style',
        position: 'relative',
        minHeight: '300px',
        height: '100%',
        touchAction: 'manipulation',
        pointerEvents: 'auto',
        cursor: 'grab',
      }}
    >
      {!hasLoadedOnce && !isInView && (
        <div className="absolute inset-0 bg-transparent rounded-xl overflow-hidden" style={{ minHeight: '300px', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <ShimmerRadialGlow color="blue" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="blue" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}

      {shouldShowSpline && (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <ShimmerRadialGlow color="blue" intensity="medium" />
            <ShimmerLine color="blue" />
            <ShimmerSpinner size={40} color="blue" />
          </div>
        }>
          <div
            className="absolute inset-0 pointer-events-auto transition-opacity duration-300"
            style={{
              opacity: isPaused ? 0 : 1,
              visibility: isPaused ? 'hidden' : 'visible',
              willChange: isPaused ? 'auto' : 'transform',
              touchAction: 'manipulation',
              cursor: 'grab',
            }}
          >
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      )}
    </div>
  );
}

// ==========================================
// DESKTOP SCREEN SIZE UTILITIES
// ==========================================
function getScreenCategory(width: number): string {
  if (width >= DESKTOP_8K_WIDTH) return '8K';
  if (width >= DESKTOP_4K_WIDTH) return '4K';
  if (width >= DESKTOP_2K_WIDTH) return '2K';
  if (width >= DESKTOP_FHD_WIDTH) return 'FHD';
  if (width >= DESKTOP_MIN_WIDTH) return 'HD';
  return 'mobile'; // Should never reach here in desktop version
}

function DesktopHomeContent() {
  const router = useRouter();
  const { optimizeSection } = useBigDeviceScrollOptimizer();
  
  // Start uninitialized - useEffect will check localStorage on client mount
  // This ensures SSR hydration works correctly in production
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [screenCategory, setScreenCategory] = useState<string>('FHD');
  const [isDesktop, setIsDesktop] = useState(true);
  const splinePreloadRanRef = useRef(false);
  const { setLoaderv2Open, setV2Unlocked, devSkipPageModeAndLoader, setDevSkipPageModeAndLoader } = useUIState();

  // Dev keyboard shortcut to skip pagemode and loader
  useDevSkipShortcut(() => {
    setDevSkipPageModeAndLoader(true);
    setCurrentView('content');
    setV2Unlocked(true);
  });

  const { 
    deviceTier, 
    registerComponent, 
    unregisterComponent,
    averageFps,
    shimmerQuality,
    preloadQueue,
    unloadQueue 
  } = useUnifiedPerformance();
  
  const { trackClick, trackError, trackCustom } = useComponentTracking('page');
  const { trackPerformanceWarning } = useCrashTracker();

  const { activeThemeId, activeTheme, setAppLoading } = useGlobalTheme();
  const theme = activeTheme || ALL_THEMES.find((t: any) => t.id === activeThemeId) || ALL_THEMES[0];
  useAudioEngine(!isMuted, 'MECHANICAL');

  // ==========================================
  // DESKTOP DETECTION & REDIRECT
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDesktop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isDesktopScreen = width >= DESKTOP_MIN_WIDTH;
      
      setIsDesktop(isDesktopScreen);
      setScreenCategory(getScreenCategory(width));
      
      // Add desktop classes to HTML element
      const html = document.documentElement;
      html.classList.add('desktop-only-mode');
      html.setAttribute('data-screen-category', getScreenCategory(width));
      html.setAttribute('data-desktop-width', String(width));
      html.setAttribute('data-desktop-height', String(height));
      
      // Log screen info for debugging
      console.log(`[DesktopPage] Screen: ${width}x${height} (${getScreenCategory(width)})`);
      
      // Redirect mobile users to main page
      if (!isDesktopScreen) {
        console.log('[DesktopPage] Mobile detected, redirecting to main page...');
        router.push('/');
        return false;
      }
      
      return true;
    };

    const isValid = checkDesktop();
    if (!isValid) return;

    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [router]);

  // Track FPS drops
  useEffect(() => {
    if (averageFps < 25 && currentView === 'content') {
      trackPerformanceWarning('page', averageFps, `FPS dropped to ${averageFps}`);
    }
  }, [averageFps, currentView, trackPerformanceWarning]);

  // Track if components are registered
  const componentsRegisteredRef = useRef(false);

  useEffect(() => {
    if (currentView === 'content' && !componentsRegisteredRef.current) {
      componentsRegisteredRef.current = true;
      registerComponent('hero', 9);
      registerComponent('features', 5);
      registerComponent('chartnews', 6);
      registerComponent('ticker', 7);
      trackCustom('desktop_content_loaded', { deviceTier, shimmerQuality, screenCategory });
      
      // Apply big device scroll optimizations
      setTimeout(() => {
        optimizeSection('hero');
        optimizeSection('experience');
        optimizeSection('cta');
        optimizeSection('features');
      }, 100);
    }
    return () => {
      if (componentsRegisteredRef.current) {
        componentsRegisteredRef.current = false;
        unregisterComponent('hero');
        unregisterComponent('features');
        unregisterComponent('chartnews');
        unregisterComponent('ticker');
      }
    };
  }, [currentView, screenCategory]);

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
    const savedMuted = localStorage.getItem('bullmoney_muted');
    if (savedMuted === 'true') setIsMuted(true);
  }, []);

  // Spline preloading for desktop
  useEffect(() => {
    const preloadSplineEngine = async () => {
      try {
        const browserInfo = detectBrowser();
        if (browserInfo.isInAppBrowser || !browserInfo.canHandle3D) return;
        if (splinePreloadRanRef.current) return;

        splinePreloadRanRef.current = true;

        await Promise.allSettled([
          import('@splinetool/runtime'),
          import('@/components/SplineScene'),
          import('@/components/DraggableSplit'),
          import('@/lib/spline-wrapper'),
        ]);

        const preloadFetch = (href: string) => {
          if (typeof document === 'undefined') return;
          const existing = document.querySelector(`link[rel="preload"][as="fetch"][href="${href}"]`);
          if (existing) return;
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'fetch';
          link.href = href;
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        };
        preloadFetch('/scene3.splinecode');
        preloadFetch('/scene4.splinecode');

        console.log('[DesktopPage] Spline runtime + scenes preloaded');
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
      console.warn('[Desktop] Refresh trigger check failed', error);
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
      console.warn('[Desktop] Daily trigger check failed', error);
    }

    console.log('[Desktop] Session check:', { hasSession: !!hasSession, hasCompletedPagemode, hasCompletedLoader, shouldForceLoader, forceReasons });

    if (shouldForceLoader) {
      console.log('[Desktop] Forcing loader due to refresh policy');
      setCurrentView('loader');
    } else if (hasCompletedLoader === "true") {
      // Skip directly to content if user has completed the full flow before
      console.log('[Desktop] Skipping to content - loader previously completed');
      setV2Unlocked(true);
      setCurrentView('content');
    } else if (hasSession || hasCompletedPagemode === "true") {
      // Skip pagemode if user has session OR has ever completed pagemode
      console.log('[Desktop] Skipping to loader - session/pagemode previously completed');
      setCurrentView('loader');
    } else {
      // First time visitor - show pagemode
      console.log('[Desktop] First time visitor - showing pagemode');
      setCurrentView('pagemode');
    }
    setIsInitialized(true);
  }, []);

  const handlePageModeUnlock = () => {
    // Mark pagemode as completed so user skips it on reload
    localStorage.setItem("bullmoney_pagemode_completed", "true");
    console.log('[Desktop] Pagemode completed, moving to loader');
    setCurrentView('loader');
  };

  const handleLoaderComplete = useCallback(() => {
    // Mark loader as completed so user skips directly to content on reload
    localStorage.setItem("bullmoney_loader_completed", "true");
    setV2Unlocked(true);
    setCurrentView('content');
  }, [setV2Unlocked]);

  if (!isInitialized || !isDesktop) {
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
      {currentView === 'pagemode' && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === 'loader' && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <TradingUnlockLoader onFinished={handleLoaderComplete} />
        </div>
      )}

      {currentView === 'content' && (
        <>
          {/* Desktop Screen Category Indicator */}
          <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-medium bg-black/50 border border-blue-500/30 text-blue-400">
            Desktop {screenCategory}
          </div>

          <main className="min-h-screen flex flex-col w-full" data-allow-scroll data-scrollable data-content data-theme-aware data-desktop-only style={{ overflow: 'visible', height: 'auto' }}>
            <div id="top" />

            <section id="hero" className="w-full" data-allow-scroll data-content data-theme-aware>
              <HeroDesktop />
            </section>

            <section id="cta" className="w-full" data-allow-scroll data-content data-theme-aware>
              <CTA />
            </section>

            <section id="features" className="w-full" data-allow-scroll data-content data-theme-aware>
              <Features />
            </section>

            {/* 3D Spline Section - Desktop full quality */}
            <section 
              id="experience" 
              className="w-full max-w-7xl mx-auto px-4 py-16" 
              data-allow-scroll 
              data-content 
              data-theme-aware 
              style={{ 
                minHeight: '1000px',
                contain: 'layout style',
                overflow: 'visible',
              }}
            >
              <div className="relative text-center mb-8" style={{ minHeight: '80px' }}>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #3b82f6), white)', filter: 'drop-shadow(0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}>
                  Interactive 3D Experience
                </h2>
                <p className="text-xs mt-2 uppercase tracking-widest font-medium" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)' }}>Drag to explore</p>
                <div className="flex justify-center mt-4">
                  <div className="w-24 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--accent-color, #3b82f6), transparent)' }} />
                </div>
              </div>
              
              <div 
                className="relative w-full rounded-2xl overflow-hidden spline-container" 
                data-spline-scene
                style={{ 
                  height: '800px', 
                  minHeight: '800px',
                  maxHeight: '800px',
                  contain: 'strict',
                  contentVisibility: 'auto',
                  containIntrinsicSize: '800px',
                }}
              >
                <ShimmerBorder color="blue" intensity="low" speed="normal" />
                
                <div className="relative z-10 w-full h-full bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
                  <ShimmerLine color="blue" className="z-20" />
                  
                  <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '800px', minHeight: '800px' }} />}>
                    <DraggableSplit>
                      <LazySplineContainer scene="/scene4.splinecode" />
                      <LazySplineContainer scene="/scene3.splinecode" />
                    </DraggableSplit>
                  </Suspense>
                </div>
              </div>
            </section>

            {/* Desktop Testimonials Section */}
            <section id="testimonials" className="w-full max-w-6xl mx-auto px-4 py-12" data-allow-scroll data-content data-theme-aware>
              <div className="relative text-center mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #3b82f6), white)', filter: 'drop-shadow(0 0 15px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}>
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

            <section id="ticker" className="w-full" data-allow-scroll data-footer data-theme-aware>
              <LiveMarketTicker />
            </section>
          </main>

          <DesktopKeyNavigator />

          {theme.youtubeId && (
            <HiddenYoutubePlayer
              videoId={theme.youtubeId}
              isPlaying={!isMuted}
              volume={isMuted ? 0 : 15}
            />
          )}
        </>
      )}
    </>
  );
}

export default function DesktopHome() {
  return <DesktopHomeContent />;
}
