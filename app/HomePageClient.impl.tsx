"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

// ✅ HYDRATION OPTIMIZATION: Deferred state utilities
import {
  useHydrated,
  useIdleCallback,
} from "@/hooks/useHydrationOptimization";
import { usePerformanceMonitor, useWebVitals } from "@/hooks/usePerformanceMonitor";

// ✅ PERF: Heavy systems lazy-loaded — not in critical compile chain
// UnifiedPerformanceSystem (1,641 lines), CrashTracker (1,008 lines),
// bigDeviceScrollOptimizer (212 lines) = 2,861 fewer lines at compile time
import {
  useLazyUnifiedPerformance,
  useLazyBigDeviceScrollOptimizer,
} from "@/lib/lazyPerformanceHooks";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { useUIState } from "@/contexts/UIStateHook";
import type { HeroMode } from "@/hooks/useHeroMode";

// ── Extracted modules ─────────────────────────────────────────
import { safeGetLocal } from "./HomePageClient/constants";
import {
  StoreHeader,
  LazyShowcaseScroll,
  LazyAudioEngine,
  HomePagePerformanceSystems,
} from "./HomePageClient/dynamicComponents";
import { useScrollSetup } from "./HomePageClient/hooks/useScrollSetup";
import { useViewportDetect } from "./HomePageClient/hooks/useViewportDetect";
import { useSplinePreload } from "./HomePageClient/hooks/useSplinePreload";
import { HeroSection } from "./HomePageClient/sections/HeroSection";

// ── Types ─────────────────────────────────────────────────────
// ✅ LAZY: forceEnableScrolling (342 lines) loaded via import() in useScrollSetup

// Legacy placeholder — satisfies stale client bundles that may reference
// HERO_MODE_CACHE_KEY during Fast Refresh.
const _HERO_MODE_CACHE_KEY_UNUSED = "hero_main_mode_v1";
void _HERO_MODE_CACHE_KEY_UNUSED;

// ✅ CLEANED: SplineModals (RemoteSceneModal, SplitSceneModal, AllScenesModal,
// OrbSplineLauncher) removed from original — never rendered.
// Legacy flag placeholder to satisfy stale client bundles during Fast Refresh.

type HomePageClientProps = {
  initialView?: "pagemode" | "loader" | "telegram" | "content";
  skipInit?: boolean;
};

function HomeContent({
  initialView = "content",
  skipInit = true,
}: HomePageClientProps) {
  // Performance monitoring
  const { logRender } = usePerformanceMonitor('HomePageClient');
  useWebVitals();
  
  const { optimizeSection } = useLazyBigDeviceScrollOptimizer();
  const isHydrated = useHydrated();

  // HomePageController owns onboarding; HomePageClient renders content only.
  // Keep these props for backward-compat with any stale client bundles.
  void initialView;
  void skipInit;
  const currentView: "content" = "content";

  // ── View state ───────────────────────────────────────────
  // ✅ HYDRATION OPTIMIZED: safe defaults match SSR; client fills in via effects
  // ── Viewport detection ────────────────────────────────────
  // All four booleans default false (SSR-safe). Populated after mount.
  // isUltraWide retained for future layout branches (matches original)
  const { hasMounted, isMobile, isDesktop, isUltraWide: _isUltraWide } = useViewportDetect();

  // ── Hero mode / navigation ────────────────────────────────
  const [allowHeavyDesktop, setAllowHeavyDesktop] = useState(false);
  const [appHeroMode, setAppHeroMode] = useState<HeroMode>("trader");
  const appRouter = useRouter();

  // Navigate to the appropriate page when hero mode changes
  const handleAppHeroModeChange = useCallback(
    (mode: HeroMode) => {
      if (mode === "design") {
        appRouter.push("/design");
      } else if (mode === "store") {
        appRouter.push("/store");
      } else {
        setAppHeroMode(mode);
      }
    },
    [appRouter]
  );

  const { shouldRender: allowMobileLazyRender } = useMobileLazyRender(240);
  // masterMuted consumed by context; local isMuted mirrors persisted preference
  useAudioSettings(); // side-effect: keeps AudioSettings context alive for children
  const [isMuted, setIsMuted] = useState(false);
  const [featuredVideos, setFeaturedVideos] = useState<any[]>([]);
  const [allRemoteSplines, setAllRemoteSplines] = useState<any[]>([]);
  const { openDiscordStageModal, openAccountManagerModal } = useUIState();

  // ── Setup ────────────────────────────────────────────────
  // Scroll lock recovery + scroll-to-top — delegated to hook
  useScrollSetup();

  // ── Analytics + prefetch (deferred to idle) ───────────────
  // ✅ HYDRATION OPTIMIZED: only fires after hydration and idle time
  useIdleCallback(
    () => {
      import("@/lib/prefetchHelper").then(({ deferAnalytics, smartPrefetch }) => {
        deferAnalytics(() => {
          import("@/lib/analytics").then(() => {
            console.log("[Performance] Analytics loaded after page interaction");
          });
        });
        smartPrefetch([
          { href: "/store", options: { priority: "low" } },
          { href: "/trading-showcase", options: { priority: "low" } },
          { href: "/community", options: { priority: "low" } },
          { href: "/course", options: { priority: "low" } },
        ]);
      });
    },
    { timeout: 3000, enabled: isHydrated }
  );

  // Check for Account Manager query parameter and open modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("openAccountManager") === "true") {
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(() => {
          openAccountManagerModal();
        }, 500);
      }
    }
  }, [openAccountManagerModal]);

  // ── Performance tracking ──────────────────────────────────
  // Lazy-loaded to keep 2,861 lines out of the critical compile chain
  const {
    deviceTier,
    registerComponent,
    unregisterComponent,
    shimmerQuality,
  } = useLazyUnifiedPerformance();

  const { activeThemeId, activeTheme, setAppLoading } = useGlobalTheme();

  // Fallback theme lookup — lazy-load theme data only when needed
  const [theme, setTheme] = useState(activeTheme);
  useEffect(() => {
    if (!activeTheme && !theme) {
      import("@/constants/theme-data").then(({ ALL_THEMES }) => {
        setTheme(ALL_THEMES.find((t) => t.id === activeThemeId) || ALL_THEMES[0]);
      });
    } else if (activeTheme) {
      setTheme(activeTheme);
    }
  }, [activeTheme, activeThemeId, theme]);

  // ── Computed flags ────────────────────────────────────────
  // ✅ Audio engine rendered as lazy component: <LazyAudioEngine />
  const audioEngineEnabled = hasMounted && !isMuted;
  const canRenderMobileSections = !isMobile || allowMobileLazyRender;
  const canRenderHeavyDesktop = !isMobile && allowHeavyDesktop && isDesktop;

  // ── Section sequencing ────────────────────────────────────
  const [sequenceStage, setSequenceStage] = useState(0);
  const showStage2 = currentView === "content" && sequenceStage >= 2;
  const showStage3 = currentView === "content" && sequenceStage >= 3;
  const showStage4 = currentView === "content" && sequenceStage >= 4;

  const deferredSectionStyle: CSSProperties = {
    contentVisibility: "auto",
    containIntrinsicSize: "auto 900px",
    contain: "layout paint style",
  };

  // ✅ HYDRATION OPTIMIZED: all stages via startTransition — non-urgent, won't block interactions
  useEffect(() => {
    startTransition(() => {
      setSequenceStage(5);
    });
  }, []);

  // ── Component registration refs ───────────────────────────
  // Stable refs prevent effect re-runs when callbacks change identity
  const componentsRegisteredRef = useRef(false);
  const registerComponentRef = useRef(registerComponent);
  const unregisterComponentRef = useRef(unregisterComponent);
  const optimizeSectionRef = useRef(optimizeSection);

  useEffect(() => {
    registerComponentRef.current = registerComponent;
    unregisterComponentRef.current = unregisterComponent;
    optimizeSectionRef.current = optimizeSection;
  });

  useEffect(() => {
    if (!componentsRegisteredRef.current) {
      componentsRegisteredRef.current = true;
      registerComponentRef.current("hero", 9);
      registerComponentRef.current("features", 5);
      registerComponentRef.current("ticker", 7);

      if (typeof window !== "undefined" && window.innerWidth >= 1440) {
        setTimeout(() => {
          optimizeSectionRef.current("hero");
          optimizeSectionRef.current("experience");
          optimizeSectionRef.current("features");
        }, 100);
      }
    }
    return () => {
      if (componentsRegisteredRef.current) {
        componentsRegisteredRef.current = false;
        unregisterComponentRef.current("hero");
        unregisterComponentRef.current("features");
        unregisterComponentRef.current("ticker");
      }
    };
  }, [deviceTier, shimmerQuality]);

  useEffect(() => {
    setAppLoading(false);
  }, [setAppLoading]);

  // Gate heavy desktop content behind requestIdleCallback (or 1.2s fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isMobile) {
      setAllowHeavyDesktop(false);
      return;
    }
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setAllowHeavyDesktop(true);
    };
    if ("requestIdleCallback" in window) {
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
  }, [isMobile]);

  // Restore muted preference from localStorage
  useEffect(() => {
    if (safeGetLocal("bullmoney_muted") === "true") setIsMuted(true);
  }, []);

  // Lazy-load featured videos only when mobile content is active
  useEffect(() => {
    if (
      isMobile &&
      canRenderMobileSections &&
      featuredVideos.length === 0
    ) {
      import("@/components/TradingQuickAccess").then((mod) => {
        setFeaturedVideos(mod.DISCORD_STAGE_FEATURED_VIDEOS || []);
      });
    }
  }, [isMobile, canRenderMobileSections, featuredVideos.length]);

  // Lazy-load Spline scene list only when heavy desktop path is active
  useEffect(() => {
    if (canRenderHeavyDesktop && allRemoteSplines.length === 0) {
      import("@/components/SplineModals").then((mod) => {
        setAllRemoteSplines(mod.ALL_REMOTE_SPLINES || []);
      });
    }
  }, [canRenderHeavyDesktop, allRemoteSplines.length]);

  // ── Spline runtime preload — delegated to hook ───────────
  useSplinePreload({
    deviceTier,
    currentView,
    canRenderHeavyDesktop,
    isMobile,
    allRemoteSplines,
    sequenceStage,
  });

  // Lazy-load GLASS_STYLES to avoid compiling glassStyles module at startup
  const [glassStyles, setGlassStyles] = useState("");
  useEffect(() => {
    import("@/styles/glassStyles").then((mod) =>
      setGlassStyles(mod.GLASS_STYLES)
    );
  }, []);

  // ── Main render ────────────────────────────────────────────
  return (
    <>
      <style>{glassStyles}</style>

      <HomePagePerformanceSystems enabled={true} pageView={currentView} />

      {/* ✅ Lazy effect components — defers 1,296 lines from initial compile */}
      <LazyShowcaseScroll
        startDelay={1200}
        enabled={true}
        pageId="home"
        persistInSession={false}
      />
      <LazyAudioEngine enabled={audioEngineEnabled} mode="MECHANICAL" />

      <div
        className="relative min-h-screen w-full"
        style={{
          overflowY: "visible",
          overflowX: "hidden",
          height: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y pan-x",
          scrollBehavior: "auto",
        }}
      >
        <StoreHeader heroModeOverride={appHeroMode} onHeroModeChangeOverride={handleAppHeroModeChange} />

        {appHeroMode === "trader" && (
          <HeroSection
            isMobile={isMobile}
            hasMounted={hasMounted}
            showStage2={showStage2}
            showStage3={showStage3}
            showStage4={showStage4}
            canRenderMobileSections={canRenderMobileSections}
            featuredVideos={featuredVideos}
            deferredSectionStyle={deferredSectionStyle}
            openDiscordStageModal={openDiscordStageModal}
          />
        )}
      </div>
    </>
  );
}

export function HomePageClient(props: HomePageClientProps = {}) {
  return <HomeContent {...props} />;
}

export default HomePageClient;
