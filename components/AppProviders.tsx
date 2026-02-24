"use client";

import { ReactNode, useEffect, useState, startTransition } from "react";
import dynamic from "next/dynamic";

// ============================================================================
// AppProviders — consolidated wrapper to reduce layout module graph
//
// IMPORTANT:
// - Keep small/critical providers static.
// - Keep very heavy providers behind dynamic() + idle gating.
// - Children must render immediately (no loading fallbacks that blank the app).
// ============================================================================

// ── LIGHT PROVIDERS (static imports) ─────────────────────────────────────────
import { ThemeProvider } from "@/context/providers";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { ViewportStateProvider } from "@/contexts/ViewportStateContext";
import { RecruitAuthProvider } from "@/contexts/RecruitAuthContext";
import { ShopProvider } from "@/components/ShopContext";

// These providers are required by many client hooks during initial render.
// They must be present synchronously (their hooks throw if missing).
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import { ThemesProvider } from "@/contexts/ThemesContext";
import { StudioProvider } from "@/context/StudioContext";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsProvider";

// ── DEFERRED (idle-only) ────────────────────────────────────────────────────
const GlobalAnimationPauseProvider = dynamic(
  () =>
    import("@/components/GlobalAnimationPauseProvider").then((m) => ({
      default: m.GlobalAnimationPauseProvider,
    })),
  { ssr: false }
);

const SmartScreensaverProvider = dynamic(
  () => import("@/components/SmartScreensaver").then((m) => ({ default: m.SmartScreensaverProvider })),
  { ssr: false }
);

const FPSCounter = dynamic(
  () => import("@/components/PerformanceProvider").then((m) => ({ default: m.FPSCounter })),
  { ssr: false }
);

export function AppProviders({ children }: { children: ReactNode }) {
  const [showDeferred, setShowDeferred] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const enableDeferred = () => {
      startTransition(() => setShowDeferred(true));
    };

    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(enableDeferred, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }

    const t = setTimeout(enableDeferred, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ThemesProvider>
        <GlobalThemeProvider>
          <ViewportStateProvider>
            <MobileMenuProvider>
              <RecruitAuthProvider>
                <AudioSettingsProvider>
                  <StudioProvider>
                    <ShopProvider>
                      {showDeferred ? (
                        <GlobalAnimationPauseProvider idleTimeout={60000}>
                          <SmartScreensaverProvider>
                            {children}
                            <FPSCounter show={process.env.NODE_ENV === "development"} position="bottom-right" />
                          </SmartScreensaverProvider>
                        </GlobalAnimationPauseProvider>
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

export default AppProviders;
