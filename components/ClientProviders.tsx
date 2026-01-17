"use client";

import dynamic from "next/dynamic";
import { ReactNode, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
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
const AudioWidget = dynamic(() => import("@/components/audio-widget/AudioWidget"), { ssr: false });
const AutoRefreshPrompt = dynamic(
  () => import("@/components/AutoRefreshPrompt").then((mod) => ({ default: mod.AutoRefreshPrompt })),
  { ssr: false }
);
const FooterComponent = dynamic(
  () => import("@/components/Mainpage/footer").then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

// Bull Feed modals - lazy loaded
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((mod) => ({ default: mod.AuthModal })),
  { ssr: false }
);
const BullFeedModal = dynamic(
  () => import("@/components/bull-feed/BullFeedModal").then((mod) => ({ default: mod.BullFeedModal })),
  { ssr: false }
);
const PostComposer = dynamic(
  () => import("@/components/composer/PostComposer").then((mod) => ({ default: mod.PostComposer })),
  { ssr: false }
);
const EnhancedAnalysisModal = dynamic(
  () => import("@/components/analysis-enhanced/EnhancedAnalysisModal").then((mod) => ({ default: mod.EnhancedAnalysisModal })),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
  modal?: ReactNode;
}

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
              
              {/* Bull Feed Modals */}
              <AuthModal />
              <BullFeedModal />
              <PostComposer />
              <EnhancedAnalysisModal />
            </PerformanceProvider>
          </FpsOptimizerProvider>
        </CrashTrackerProvider>
      </UnifiedPerformanceProvider>
    </AuthProvider>
  );
}

export { FooterComponent as Footer };
