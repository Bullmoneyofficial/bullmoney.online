"use client";

import dynamic from "next/dynamic";
import { ReactNode, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIStateProvider } from "@/contexts/UIStateContext";

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
      <UIStateProvider>
        <UnifiedPerformanceProvider startDelay={2000}>
          <CrashTrackerProvider>
            <FpsOptimizerProvider enableMonitoring={true} monitoringInterval={500} startDelay={1000}>
              <PerformanceProvider enableSmoothScroll={true}>
                <FpsMonitor show={false} />
                <ClientCursor />
                <AudioWidget />
                <AutoRefreshPrompt />
                {modal}
                <main 
                  className="theme-filter-wrapper min-h-screen"
                  style={{ 
                    filter: 'var(--theme-filter, none)',
                    transition: 'filter 0.5s ease-in-out',
                    touchAction: 'pan-y',
                    overflowY: 'visible'
                  }}
                  data-allow-scroll
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
      </UIStateProvider>
    </AuthProvider>
  );
}

export { FooterComponent as Footer };
