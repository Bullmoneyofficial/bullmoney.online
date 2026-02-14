"use client";

import { ReactNode, Suspense, useState, useEffect, startTransition } from "react";
import dynamic from "next/dynamic";

// ============================================================================
// AppProviders — single consolidated wrapper to reduce layout.tsx module graph
// ============================================================================
// Light providers (small, needed for first render): imported statically
// Heavy providers (large, deferred safely): imported with dynamic()
// ============================================================================

// ── LIGHT PROVIDERS (static imports — <300 lines each) ────────────────────
import { ThemeProvider } from "@/context/providers";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { ViewportStateProvider } from "@/contexts/ViewportStateContext";
import { RecruitAuthProvider } from "@/contexts/RecruitAuthContext";
import { ShopProvider } from "@/components/ShopContext";

// FPSCounter: dev-only, loaded lazily to avoid compiling PerformanceProvider.tsx (997 lines)
// + deviceMonitor.ts (2737 lines) + browserDetection + safariOptimizations = ~4000 lines
const FPSCounter = dynamic(
  () => import("@/components/PerformanceProvider").then(m => ({ default: m.FPSCounter })),
  { ssr: false }
);

// ── HEAVY PROVIDERS (dynamic imports — avoid pulling in large module graphs) ─
// GlobalThemeProvider: 418 lines + theme-data (972 lines) + smartStorage (270 lines) = ~1,660 lines
const GlobalThemeProvider = dynamic(
  () => import("@/contexts/GlobalThemeProvider").then(m => ({ default: m.GlobalThemeProvider })),
  { ssr: true }
);

// ThemesContext: 3,478 lines — deferred but SSR-safe (renders children immediately)
const ThemesProvider = dynamic(
  () => import("@/contexts/ThemesContext").then(m => ({ default: m.ThemesProvider })),
  { ssr: true }
);

// StudioContext: 436 lines + Supabase SDK
const StudioProvider = dynamic(
  () => import("@/context/StudioContext").then(m => ({ default: m.StudioProvider })),
  { ssr: true }
);

// AudioSettingsProvider: 586 lines + audio chain
const AudioSettingsProvider = dynamic(
  () => import("@/contexts/AudioSettingsProvider").then(m => ({ default: m.AudioSettingsProvider })),
  { ssr: true }
);

// SmartScreensaver: 969 lines + framer-motion + FPS measurement libs
const SmartScreensaverProvider = dynamic(
  () => import("@/components/SmartScreensaver").then(m => ({ default: m.SmartScreensaverProvider })),
  { ssr: false }
);

interface AppProvidersProps {
  children: ReactNode;
}

// ✅ HYDRATION SAFE: All providers render on both server and client
// Heavy providers use dynamic() with ssr:true to defer module loading
// FPSCounter and SmartScreensaver are client-only (ssr: false)
export function AppProviders({ children }: AppProvidersProps) {
  const [showDeferred, setShowDeferred] = useState(false);
  
  useEffect(() => {
    // Enable deferred components during idle time
    const enableDeferred = () => {
      startTransition(() => {
        setShowDeferred(true);
      });
    };
    
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(enableDeferred, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timeout = setTimeout(enableDeferred, 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ThemesProvider>
        <GlobalThemeProvider>
          <ViewportStateProvider>
            <MobileMenuProvider>
              <RecruitAuthProvider>
                <AudioSettingsProvider>
                  <StudioProvider>
                    <ShopProvider>
                      {/* SmartScreensaver deferred to idle time (ssr: false prevents hydration mismatch) */}
                      {showDeferred ? (
                        <SmartScreensaverProvider>
                          {children}
                          {/* Dev FPS overlay */}
                          <FPSCounter show={process.env.NODE_ENV === 'development'} position="bottom-right" />
                        </SmartScreensaverProvider>
                      ) : (
                        children
                      )}
                    </ShopProvider>
                  </StudioProvider>
                </AudioSettingsProvider>
              </RecruitAuthProvider>
            </MobileMenuProvider>
          </ViewportStateProvider>
        </GlobalThemeProvider>
      </ThemesProvider>
    </ThemeProvider>
  );
}
