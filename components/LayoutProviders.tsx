"use client";

import dynamic from "next/dynamic";
import { Suspense, ReactNode, useEffect, useState, useRef, startTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { markHydrationComplete } from "@/components/FastHydrationWrapper";

// ✅ LAZY-LOADED: SEO/analytics/audio deferred to avoid blocking first paint
const ScrollSciFiAudio = dynamic(
  () => import("@/components/ScrollSciFiAudio").then(mod => ({ default: mod.ScrollSciFiAudio })),
  { ssr: false }
);

const WebVitalsEnhanced = dynamic(
  () => import("@/components/WebVitalsEnhanced"),
  { ssr: false }
);

const AllSEOSchemas = dynamic(
  () => import("@/components/SEOSchemas"),
  { ssr: false }
);

const AdvancedSEO = dynamic(
  () => import("@/components/AdvancedSEO"),
  { ssr: false }
);

const GoogleSEOBoost = dynamic(
  () => import("@/components/GoogleSEOBoost"),
  { ssr: false }
);

const MemoryBoostClient = dynamic(
  () => import("@/components/MemoryBoostClient"),
  { ssr: false }
);

const HreflangMeta = dynamic(
  () => import("@/components/HreflangMeta").then((mod) => ({ default: mod.HreflangMeta })),
  { ssr: false }
);

// ✅ PERF: VercelAnalytics lazy-loaded to avoid compile-time weight
const VercelAnalyticsWrapper = dynamic(
  () => import("@/components/VercelAnalyticsWrapper"),
  { ssr: false }
);

// ✅ OFF-SCREEN ANIMATION CONTROLLER - Pauses animations we can't see
const OffscreenAnimationController = dynamic(
  () => import("@/hooks/useOffscreenAnimationPause").then(mod => ({ default: mod.OffscreenAnimationController })),
  { ssr: false }
);

// ✅ LOADING FALLBACKS - Mobile optimized
import {
  NavbarSkeleton,
  MinimalFallback,
} from "@/components/MobileLazyLoadingFallback";

// ✅ LAZY LOADED: Performance components
const ClientProviders = dynamic(
  () => import("@/components/ClientProviders").then(mod => ({ default: mod.ClientProviders })),
  { ssr: false }
);

const ShimmerStylesProvider = dynamic(
  () => import("@/components/ui/UnifiedShimmer").then(mod => ({ default: mod.ShimmerStylesProvider })),
  { ssr: false }
);

const CacheManagerProvider = dynamic(
  () => import("@/components/CacheManagerProvider"),
  { ssr: false }
);

// ✅ ULTIMATE HUB - Unified component replacing TradingQuickAccess, CommunityQuickAccess, UltimateControlPanel
// Contains: Left side pills (Trading, Community, TV) + Right side FPS pill with Device Center Panel
const UltimateHub = dynamic(
  () => import("@/components/UltimateHub").then(mod => ({ default: mod.UltimateHub })),
  { ssr: false }
);

const AppSupportButton = dynamic(
  () => import("@/components/shop/StoreSupportButton").then(mod => ({ default: mod.AppSupportButton })),
  { ssr: false }
);

// ✅ NAVBAR - Lazy load for mobile (named export)
const Navbar = dynamic(
  () => import("@/components/navbar").then(mod => ({ default: mod.Navbar })),
  { ssr: false, loading: () => <NavbarSkeleton /> }
);

// ✅ StoreHeader - Used for standalone (installed) home screen app navigation
const StoreHeader = dynamic(
  () => import("@/components/store/StoreHeader").then(mod => ({ default: mod.StoreHeader })),
  { ssr: false }
);


// 🔔 NOTIFICATION PERMISSION MODAL - Shows IMMEDIATELY on first load asking for push notifications
// Using eager loading to ensure it appears before anything else
const NotificationPermissionModal = dynamic(
  () => import("@/components/NotificationPermissionModal").then(mod => mod.NotificationPermissionModal),
  { ssr: false, loading: () => null }
);

const CookieConsent = dynamic(
  () => import("@/components/CookieConsent"),
  { ssr: false, loading: () => null }
);

// ✅ GLOBAL V3 LOADER - Shows randomly on ~20% of reloads across ALL pages
const GlobalV3Loader = dynamic(
  () => import("@/components/GlobalV3Loader"),
  { ssr: false, loading: () => null }
);

// ThemesPanel needs both ThemesProvider (from AppProviders) AND UIStateProvider (from ClientProviders)
const ThemesPanel = dynamic(
  () => import("@/contexts/ThemesContext").then(m => ({ default: m.ThemesPanel })),
  { ssr: false }
);

interface LayoutProvidersProps {
  children: ReactNode;
  modal?: ReactNode;
}

/**
 * LayoutProviders - Client-side wrapper for dynamic components in root layout
 * Handles all lazy-loaded providers and components with ssr: false
 * 
 * ✅ HYDRATION OPTIMIZED: Progressive mounting stages
 */
export function LayoutProviders({ children, modal }: LayoutProvidersProps) {
  // Only defer navbar/UltimateHub on mobile to avoid blocking first paint
  const { isMobile: isMobileViewport, shouldRender: allowMobileLazy } = useMobileLazyRender(220);
  const [supportReady, setSupportReady] = useState(false);
  
  // Check if we're on store pages, casino pages, desktop page, design page, or app page - hide navbar (replaced with StoreHeader)
  const pathname = usePathname();
  const isStorePage = pathname.startsWith('/store') || pathname.startsWith('/games') || pathname.startsWith('/design');
  const isGamesPage = pathname.startsWith('/games');
  const isDesktopPage = pathname === '/desktop';
  const isAppPage = pathname === '/';

  // When launched from the home screen (standalone), prefer StoreHeader across the app.
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      try {
        const standalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true;
        setIsStandaloneApp(Boolean(standalone));
      } catch {
        setIsStandaloneApp(false);
      }
    };
    compute();
    try {
      const mq = window.matchMedia('(display-mode: standalone)');
      const onChange = () => compute();
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
      else if (typeof (mq as any).addListener === 'function') (mq as any).addListener(onChange);
      return () => {
        if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
        else if (typeof (mq as any).removeListener === 'function') (mq as any).removeListener(onChange);
      };
    } catch {
      return;
    }
  }, []);
  
  // Global Ultimate Hub visibility - controlled by toggle in navbar & store header
  // Default OFF to prevent heavy component from loading and blocking page render
  const [showUltimateHub, setShowUltimateHub] = useState(false);
  // ✅ HYDRATION OPTIMIZED: Progressive mount stages
  // Stage 0: Initial (SSR match)
  // Stage 1: Hydration complete - show children
  // Stage 2: Interactive - show navbar
  // Stage 3: Idle - show extras (SEO, analytics, etc.)
  const [mountStage, setMountStage] = useState(0);
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readLocalFlag = () => {
        try {
          return window.localStorage.getItem('store_show_ultimate_hub');
        } catch {
          return null;
        }
      };

      const stored = readLocalFlag();
      // Default to false (hidden) — only show when user explicitly enabled it
      setShowUltimateHub(stored === 'true');

      // Listen for changes
      const handleStorageChange = (event: Event) => {
        // Use event detail when available for immediate sync
        const detailValue = (event as CustomEvent<boolean>).detail;
        if (typeof detailValue === 'boolean') {
          setShowUltimateHub(detailValue);
          return;
        }
        const nextStored = readLocalFlag();
        setShowUltimateHub(nextStored === 'true');
      };
      window.addEventListener('store_ultimate_hub_toggle', handleStorageChange);
      return () => window.removeEventListener('store_ultimate_hub_toggle', handleStorageChange);
    }
  }, []);

  // Global scroll safety net (desktop wheel/trackpad + stale modal/menu locks).
  // Kept as a dynamic import to avoid pulling the utility into the critical path.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cleanup: undefined | (() => void);

    import('@/lib/forceScrollEnabler')
      .then((mod) => {
        if (typeof mod.forceEnableScrolling === 'function') {
          cleanup = mod.forceEnableScrolling();
        }
      })
      .catch(() => {
        // Ignore — scrolling will still work on most browsers; this is a safety net.
      });

    return () => {
      try {
        cleanup?.();
      } catch {
        // Ignore
      }
    };
  }, []);

  // ✅ HYDRATION OPTIMIZED: Progressive mount stages
  const mountStageInitialized = useRef(false);
  useEffect(() => {
    if (mountStageInitialized.current) return;
    mountStageInitialized.current = true;
    
    // Mark global hydration complete
    markHydrationComplete();
    
    // Stage 1: Show children immediately (sync, no delay)
    setMountStage(1);
    
    // Stage 2: Show navbar after a microtask (non-blocking)
    queueMicrotask(() => {
      startTransition(() => {
        setMountStage(2);
      });
    });
    
    // Stage 3: Show extras during idle time
    const enableExtras = () => {
      startTransition(() => {
        setMountStage(3);
      });
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(enableExtras, { timeout: 1500 });
    } else {
      setTimeout(enableExtras, 300);
    }
    
    // ✅ PERF: Initialize resource preloading during idle time
    import('@/lib/resourcePreloading').then(mod => mod.initResourcePreloading());
  }, []);  

  useEffect(() => {
    if (typeof window === "undefined") return;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const activate = () => setSupportReady(true);
    if ("requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(activate, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(activate, 350);
    }
    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkSplash = () => {
      const splashEl = document.getElementById('bm-splash');
      const finished = !splashEl || splashEl.classList.contains('hide') || (window as any).__BM_SPLASH_FINISHED__ === true;
      setIsSplashFinished(finished);
    };

    checkSplash();

    const onSplashFinished = () => setIsSplashFinished(true);
    window.addEventListener('bm-splash-finished', onSplashFinished);

    let observer: MutationObserver | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    if (typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver(() => checkSplash());
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    } else {
      // Fallback for older/embedded browsers without MutationObserver support.
      pollTimer = setInterval(checkSplash, 300);
    }

    return () => {
      window.removeEventListener('bm-splash-finished', onSplashFinished);
      if (observer) observer.disconnect();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  const canShowNavbar = mountStage >= 1;
  const canShowChildren = mountStage >= 2;
  const canShowUltimateHub = mountStage >= 2;
  const canShowCursor = mountStage >= 3;
  const canShowSupport = canShowUltimateHub && supportReady && isSplashFinished;

  // Dev-only guard to avoid crash when React tries to remove nodes that were already moved/removed by imperative code
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalRemoveChild = Node.prototype.removeChild;

    const safeRemoveChild: typeof Node.prototype.removeChild = function patchedRemoveChild<T extends Node>(this: Node, child: T): T {
      // If the child was already detached (e.g., moved by a 3rd-party script), skip removal to prevent a NotFoundError
      if (!child || child.parentNode !== this) {
        console.warn("[LayoutProviders] Skipped removeChild for detached node", { parent: this, child });
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    Node.prototype.removeChild = safeRemoveChild;

    return () => {
      Node.prototype.removeChild = originalRemoveChild;
    };
  }, []);

  return (
    <>
        <CookieConsent />

        {/* ✅ GLOBAL V3 LOADER - Random ~20% chance on reload across all pages */}
        <GlobalV3Loader />

        {/* 🔔 NOTIFICATION PERMISSION MODAL - FIRST! Shows immediately on first load 
          Must be rendered FIRST to appear ABOVE everything including welcome screens */}
        <NotificationPermissionModal />
      
      <ScrollSciFiAudio />
      {/* Global Shimmer Styles - ensures all shimmers are synchronized */}
      <ShimmerStylesProvider />
      
      {/* Cache Manager - Handles version-based cache invalidation */}
      <CacheManagerProvider>
        {/* Navbar rendered outside ClientProviders for fixed positioning - HIDDEN on store, desktop & app pages */}
        {canShowNavbar && (allowMobileLazy || !isMobileViewport) && (
          isStandaloneApp
            ? (!isStorePage && !isDesktopPage && !isAppPage && <StoreHeader />)
            : (!isStorePage && !isDesktopPage && !isAppPage && <Navbar />)
        )}
        
        {/* ✅ ULTIMATE HUB - All-in-one unified component - Controlled by toggle
            - Left side: Trading pill (prices), Community pill (Telegram), TV pill
            - Right side: FPS pill with Device Center Panel (4 tabs: Overview, Network, Performance, Account)
            - All real device data from browser APIs */}
        {canShowUltimateHub && showUltimateHub && (allowMobileLazy || !isMobileViewport) && <UltimateHub />}

        {/* ✅ SUPPORT BUTTON - Global floating support widget (hidden on games pages) */}
        {canShowSupport && !isStorePage && <AppSupportButton />}
        {canShowSupport && isStorePage && !isGamesPage && typeof document !== "undefined" && createPortal(
          <AppSupportButton />,
          document.body
        )}
        
        {/* ✅ LAZY LOADED: All performance providers bundled */}
        {canShowChildren ? (
          <ClientProviders modal={modal} splashFinished={isSplashFinished}>
            {/* ✅ OFF-SCREEN ANIMATION PAUSE - Saves CPU by pausing invisible animations */}
            {/* SKIPPED on store pages — its global MutationObserver + IntersectionObserver
                causes a mutation storm with StoreLayoutClient's own overlay-hiding logic */}
            {isStorePage ? (
              <div className="page-full">{children}</div>
            ) : (
              <OffscreenAnimationController>
                <div className="page-full">
                  {children}
                </div>
              </OffscreenAnimationController>
            )}
          </ClientProviders>
        ) : (
          <MinimalFallback />
        )}
      </CacheManagerProvider>

      {/* ✅ VERCEL TRACKING - Enhanced Analytics & Speed Insights */}
      <VercelAnalyticsWrapper />
      {/* Temporarily disabled due to WeakMap error - TODO: Fix useSearchParams issue */}
      {/* <Suspense fallback={null}>
        <WebVitalsEnhanced />
      </Suspense> */}

      {/* ✅ SEO STRUCTURED DATA - Deferred to idle for faster first paint */}
      {canShowCursor && (
        <Suspense fallback={null}>
          <MemoryBoostClient />
          <HreflangMeta />
          <AllSEOSchemas />
          <AdvancedSEO />
          <GoogleSEOBoost />
        </Suspense>
      )}

      {/* Unified Themes Panel (Colors + Effects) */}
      <ThemesPanel />
      
    </>
  );
}
