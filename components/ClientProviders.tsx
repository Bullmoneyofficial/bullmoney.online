"use client";

import dynamic from "next/dynamic";
import { ReactNode, Suspense, memo } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useUIState } from "@/contexts/UIStateContext";
// RecruitAuthProvider is now in layout.tsx to wrap Navbar
// REMOVED: UIStateProvider - already provided by MobileMenuProvider in layout.tsx

// Theme overlay for global filter effects
const ThemeOverlay = dynamic(
  () => import("@/components/ThemeOverlay").then((mod) => ({ default: mod.ThemeOverlay })),
  { ssr: false }
);

// Lazy load performance providers for faster initial compile
const PerformanceProvider = dynamic(
  () => import("@/components/PerformanceProvider").then((mod) => ({ default: mod.PerformanceProvider })),
  { ssr: false }
);

const FPSCounter = dynamic(
  () => import("@/components/PerformanceProvider").then((mod) => ({ default: mod.FPSCounter })),
  { ssr: false }
);

const FpsOptimizerProvider = dynamic(
  () => import("@/lib/FpsOptimizer").then((mod) => ({ default: mod.FpsOptimizerProvider })),
  { ssr: false }
);

const UnifiedPerformanceProvider = dynamic(
  () => import("@/lib/UnifiedPerformanceSystem").then((mod) => ({ default: mod.UnifiedPerformanceProvider })),
  { ssr: false }
);

const CrashTrackerProvider = dynamic(
  () => import("@/lib/CrashTracker").then((mod) => ({ default: mod.CrashTrackerProvider })),
  { ssr: false }
);

const FpsMonitor = dynamic(() => import("@/components/FpsMonitor"), { ssr: false });
const ClientCursor = dynamic(() => import("@/components/ClientCursor"), { ssr: false });
// AudioWidget stays loaded - NOT lazy unmounted - for audio persistence
const AudioWidget = dynamic(() => import("@/components/audio-widget/AudioWidget"), { ssr: false });
const AutoRefreshPrompt = dynamic(
  () => import("@/components/AutoRefreshPrompt").then((mod) => ({ default: mod.AutoRefreshPrompt })),
  { ssr: false }
);
const FooterComponent = dynamic(
  () => import("@/components/Mainpage/footer").then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

// SMART MOUNT: Import lazy modal wrappers (mount/unmount with zero cost when closed)
import {
  LazyAuthModal,
  LazyBullFeedModal,
  LazyPostComposerModal,
  LazyAnalysisModal,
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
  return (
    <AuthProvider>
      {/* NOTE: UIStateProvider is already provided by MobileMenuProvider in layout.tsx */}
      {/* NOTE: RecruitAuthProvider is now in layout.tsx to wrap Navbar */}
      <UnifiedPerformanceProvider startDelay={2000}>
        <CrashTrackerProvider>
          <FpsOptimizerProvider enableMonitoring={true} monitoringInterval={500} startDelay={1000}>
            <PerformanceProvider enableSmoothScroll={true}>
              <FpsMonitor show={false} />
              <ClientCursor />
              {/* AudioWidget stays mounted - NOT lazy unmounted - for audio persistence */}
              <AudioWidget />
              <AutoRefreshPrompt />
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
                - touchAction: pan-y allows vertical scroll
                - overflowY: visible prevents scroll context issues
              */}
              <main 
                className="min-h-screen"
                style={{ 
                  // Filter is now applied via ThemeOverlay and CSS ::before
                  // No direct filter here to avoid scroll issues
                  touchAction: 'pan-y',
                  overflowY: 'visible',
                  // Ensure proper stacking
                  position: 'relative',
                  zIndex: 1,
                }}
                data-allow-scroll
                data-scrollable
              >
                {children}
              </main>
              <FooterComponent />
              <FPSCounter />
              
              {/* 
                SMART MOUNT GLOBAL MODALS v3.0:
                - ZERO cost when closed (completely unmounted)
                - Mounts ONLY when opened
                - Delayed unmount allows exit animations
                - EXCEPTION: AudioWidget stays mounted for audio persistence
              */}
              <LazyGlobalModals />
            </PerformanceProvider>
          </FpsOptimizerProvider>
        </CrashTrackerProvider>
      </UnifiedPerformanceProvider>
    </AuthProvider>
  );
}

export { FooterComponent as Footer };
