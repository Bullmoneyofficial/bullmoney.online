"use client";

import dynamic from "next/dynamic";
import { ReactNode, Suspense, memo, useEffect, useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUIState } from "@/contexts/UIStateContext";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { MobilePerformanceProvider } from "@/contexts/MobilePerformanceProvider";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";
import { SoundProvider } from "@/contexts/SoundContext";

// ✅ LOADING FALLBACKS - Mobile optimized
import { MinimalFallback } from "@/components/MobileLazyLoadingFallback";

// ✅ PERFORMANCE PROVIDER - Monitors FPS and device tier with built-in FPS monitor
import PerformanceProvider from "@/lib/performanceSystem";

// CRITICAL: Import FPS scroll optimizer for pause-during-scroll behavior
const FpsScrollOptimizer = dynamic(
  () => import("@/components/FpsScrollOptimizer").then((mod) => ({ default: mod.FpsScrollOptimizer })),
  { ssr: false }
);

// ✅ MOBILE-OPTIMIZED LAZY LOADING - All heavy components lazy loaded
// Admin Panel Provider (lazy loaded)
const AdminVIPPanelProvider = dynamic(
  () => import("@/components/AdminVIPPanelProvider").then((mod) => ({ default: mod.AdminVIPPanelProvider })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

// Admin Button (only visible for mrbullmoney@gmail.com)
const AdminButton = dynamic(
  () => import("@/components/AdminButton"),
  { ssr: false }
);

// Theme overlay for global filter effects
const ThemeOverlay = dynamic(
  () => import("@/components/ThemeOverlay").then((mod) => ({ default: mod.ThemeOverlay })),
  { ssr: false }
);

// ✅ MOBILE-OPTIMIZED LAZY LOADING - All heavy components lazy loaded
// Admin Panel Provider (lazy loaded)
const AudioWidget = dynamic(
  () => import("@/components/audio-widget/AudioWidget"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const AutoRefreshPrompt = dynamic(
  () => import("@/components/AutoRefreshPrompt").then((mod) => ({ default: mod.AutoRefreshPrompt })),
  { ssr: false }
);

// NOTE: Footer removed from layout - now only in page.tsx

// SMART MOUNT: Import lazy modal wrappers (mount/unmount with zero cost when closed)
import {
  LazyAuthModal,
  LazyBullFeedModal,
  LazyPostComposerModal,
  LazyAnalysisModal,
  LazyChartNewsModal,
  LazyLiveStreamModal,
  LazyProductsModal,
  LazyServicesModal,
} from "@/components/LazyUIComponents";

interface ClientProvidersProps {
  children: ReactNode;
  modal?: ReactNode;
}

/**
 * LazyGlobalModals - SMART MOUNT system for all global modals
 * 
 * PERFORMANCE: "Closed = Unmounted = Zero Cost"
 * 
 * These modals follow the smart mount pattern:
 * - ZERO rendering until first opened
 * - Complete unmount when closed (frees all memory)
 * - Delayed unmount allows exit animations
 * - No React reconciliation for closed modals
 * 
 * EXCEPTION: AudioWidget is NOT included - it persists for audio playback
 */
const LazyGlobalModals = memo(function LazyGlobalModals() {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    isBullFeedModalOpen,
    setBullFeedModalOpen,
    isPostComposerModalOpen,
    setPostComposerModalOpen,
    isAnalysisModalOpen,
    setAnalysisModalOpen,
    isChartNewsOpen,
    setChartNewsOpen,
    isLiveStreamModalOpen,
    setLiveStreamModalOpen,
    isProductsModalOpen,
    setProductsModalOpen,
    isServicesModalOpen,
    setServicesModalOpen,
  } = useUIState();

  return (
    <>
      {/* Auth Modal - mounts only when opened, unmounts when closed */}
      <LazyAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      
      {/* Bull Feed Modal - mounts only when opened, unmounts when closed */}
      <LazyBullFeedModal 
        isOpen={isBullFeedModalOpen} 
        onClose={() => setBullFeedModalOpen(false)} 
      />
      
      {/* Post Composer Modal - mounts only when opened, unmounts when closed */}
      <LazyPostComposerModal 
        isOpen={isPostComposerModalOpen} 
        onClose={() => setPostComposerModalOpen(false)} 
      />
      
      {/* Analysis Modal - mounts only when opened, unmounts when closed */}
      <LazyAnalysisModal 
        isOpen={isAnalysisModalOpen} 
        onClose={() => setAnalysisModalOpen(false)} 
      />
      
      {/* Chart News Modal - mounts only when opened, unmounts when closed */}
      <LazyChartNewsModal 
        isOpen={isChartNewsOpen} 
        onClose={() => setChartNewsOpen(false)} 
      />
      
      {/* Live Stream Modal - mounts only when opened, unmounts when closed */}
      <LazyLiveStreamModal 
        isOpen={isLiveStreamModalOpen} 
        onClose={() => setLiveStreamModalOpen(false)} 
      />
      
      {/* Products Modal - mounts only when opened, unmounts when closed */}
      <LazyProductsModal 
        isOpen={isProductsModalOpen} 
        onClose={() => setProductsModalOpen(false)} 
      />
      
      {/* Services Modal - mounts only when opened, unmounts when closed */}
      <LazyServicesModal 
        isOpen={isServicesModalOpen} 
        onClose={() => setServicesModalOpen(false)} 
      />
    </>
  );
});

export function ClientProviders({ children, modal }: ClientProvidersProps) {
  const { isMobile: isMobileViewport, shouldRender: allowMobileLazy } = useMobileLazyRender(240);
  const allowMobileComponents = allowMobileLazy || !isMobileViewport;
  const { masterMuted } = useAudioSettings();
  const { isAudioWidgetOpen } = useUIState();
  const [audioWidgetReady, setAudioWidgetReady] = useState(false);

  useEffect(() => {
    if (!isAudioWidgetOpen) return;
    if (!audioWidgetReady) setAudioWidgetReady(true);
  }, [isAudioWidgetOpen, audioWidgetReady]);

  // ====================================================================
  // STORE PAGE FAST PATH — Skip ALL heavy performance providers.
  // The store brings its own StoreMemoryContext for section-level perf.
  // Skipping these removes:
  //   • 3 concurrent requestAnimationFrame loops
  //   • ~5 setInterval timers (incl. 30s network speed test)
  //   • ThemeOverlay that fights with StoreLayoutClient
  //   • FPS counter, crash tracker, scroll optimizer
  // Result: store renders in < 1s instead of 5-10s.
  // ====================================================================
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isStorePage = pathname.startsWith('/store');

  // Global media mute handler (applies to any stray audio/video tags on page/layout)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const media = Array.from(document.querySelectorAll<HTMLMediaElement>("audio, video"));
    media.forEach(el => {
      if (masterMuted) {
        if (!el.dataset.prevVolume) el.dataset.prevVolume = String(el.volume ?? 1);
        el.muted = true;
      } else {
        el.muted = false;
        if (el.dataset.prevVolume) {
          const v = Number(el.dataset.prevVolume);
          if (!Number.isNaN(v)) el.volume = v;
        }
      }
    });
  }, [masterMuted]);

  // ==================================================================
  // STORE FAST PATH: Minimal provider tree — no RAF loops, no FPS
  // monitors, no speed tests, no theme overlay fights.
  // ==================================================================
  if (isStorePage) {
    return (
      <PerformanceProvider showFPS={false}>
        <ErrorBoundary>
          <MobilePerformanceProvider>
            <SoundProvider enabled={!masterMuted} volume={0.4}>
              <AuthProvider>
                {allowMobileComponents && audioWidgetReady && <AudioWidget />}
                {modal}
                <div data-lenis-content data-store-lenis>
                  <main
                    className="min-h-screen"
                    style={{
                      touchAction: 'auto',
                      overflow: 'visible',
                      position: 'relative',
                      zIndex: 'auto' as any,
                      height: 'auto',
                      isolation: 'auto',
                      contain: 'none',
                    }}
                    data-allow-scroll
                    data-scrollable
                  >
                    {children}
                  </main>
                </div>
              </AuthProvider>
            </SoundProvider>
          </MobilePerformanceProvider>
        </ErrorBoundary>
      </PerformanceProvider>
    );
  }

  return (
    <PerformanceProvider showFPS={false}>
      <ErrorBoundary>
        <MobilePerformanceProvider>
          <SoundProvider enabled={!masterMuted} volume={0.4}>
            <AuthProvider>
            {/* NOTE: UIStateProvider is already provided by MobileMenuProvider in layout.tsx */}
            {/* NOTE: RecruitAuthProvider is now in layout.tsx to wrap Navbar */}

            {/* CRITICAL: FPS Scroll Optimizer - pauses animations during scroll */}
            <FpsScrollOptimizer />
      
          {/* 
            PERFORMANCE FIX: Removed 4 nested performance monitoring providers.
            CrashTrackerProvider, FpsOptimizerProvider, PerformanceProvider, and 
            UnifiedPerformanceProvider were running 3 concurrent RAF loops + ~5 setInterval 
            timers (including a 30s network speed test). FpsMonitor was hidden (show={false}) 
            but still consuming CPU. These monitoring tools were ironically the biggest 
            source of performance drain. Kept FpsScrollOptimizer as it pauses animations
            during scroll which is genuinely useful.
          */}
              {/* NOTE: ClientCursor moved to LayoutProviders - rendered LAST in DOM */}
              {/* AudioWidget stays mounted - NOT lazy unmounted - for audio persistence */}
              {allowMobileComponents && audioWidgetReady && <AudioWidget />}
              {allowMobileComponents && <AutoRefreshPrompt />}
              {modal}
              
              {/* 
                THEME OVERLAY v2.0:
                - Applied as sibling, not wrapper
                - Uses pointer-events:none - doesn't block scroll
                - Works with all browsers including Safari/iOS
              */}
              <ThemeOverlay enableFilter={true} />
              
              {/* 
                MAIN CONTENT:
                - Uses CSS variable for filter (set by GlobalThemeProvider)
                - touchAction: auto allows all scroll interactions
                - overflowY: visible prevents scroll context issues
                - CRITICAL: No height constraints to allow natural scrolling
                - DESKTOP FIX: isolation: auto prevents z-index stacking context issues
              */}
              <div data-lenis-content>
                <main 
                  className="min-h-screen"
                  style={{ 
                    touchAction: 'auto',
                    overflow: 'visible',
                    position: 'relative',
                    zIndex: 1,
                    height: 'auto',
                    isolation: 'auto',
                    contain: 'none',
                  }}
                  data-allow-scroll
                  data-scrollable
                >
                  {children}
                </main>
              </div>
              
              {/* 
                SMART MOUNT GLOBAL MODALS v3.0:
                - ZERO cost when closed (completely unmounted)
                - Mounts ONLY when opened
                - Delayed unmount allows exit animations
                - EXCEPTION: AudioWidget stays mounted for audio persistence
              */}
              {allowMobileComponents && <LazyGlobalModals />}
              
              {/* Admin components - only mount after idle to avoid blocking main content */}
              <Suspense fallback={null}>
                <AdminVIPPanelProvider />
                <AdminButton />
              </Suspense>
          </AuthProvider>
        </SoundProvider>
      </MobilePerformanceProvider>
      </ErrorBoundary>
    </PerformanceProvider>
  );
}

// Footer export removed - now only in page.tsx
