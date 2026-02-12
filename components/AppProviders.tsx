"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

// ============================================================================
// AppProviders — single consolidated wrapper to reduce layout.tsx module graph
// ============================================================================
// Light providers (small, needed for first render): imported statically
// Heavy providers (large, deferred safely): imported with dynamic()
// ============================================================================

// ── LIGHT PROVIDERS (static imports — <300 lines each) ────────────────────
import { ThemeProvider } from "@/context/providers";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
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

export function AppProviders({ children }: AppProvidersProps) {
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
                      <SmartScreensaverProvider>
                        {children}
                        {/* Dev FPS overlay — fixed, always visible on all pages including mobile */}
                        <FPSCounter show={process.env.NODE_ENV === 'development'} position="bottom-right" />
                      </SmartScreensaverProvider>
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
