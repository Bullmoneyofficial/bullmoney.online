"use client";

import { Suspense, useCallback, useEffect, useState, lazy } from "react";

import { useUIState } from "@/contexts/UIStateHook";
import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";
import { loadSession, persistSession } from "@/lib/sessionPersistence";
import {
  safeGetLocal,
  safeSetLocal,
  safeRemoveLocal,
  safeGetSession,
  safeSetSession,
  PAGEMODE_FORCE_LOGIN_KEY,
  PAGEMODE_REDIRECT_PATH_KEY,
} from "./HomePageClient/constants";

type HomeView = "pagemode" | "loader" | "telegram" | "content";

// 🚀 COMPILATION SPEED: Move dynamic imports INSIDE component to truly defer compilation
// These heavy components are now only imported when actually needed, not during initial analysis

export function HomePageController() {
  // 🚀 COMPILATION SPEED: Lazy load heavy components only when needed
  const [PageMode, setPageMode] = useState<React.ComponentType<any> | null>(null);
  const [TelegramUnlockScreen, setTelegramUnlockScreen] = useState<React.ComponentType<any> | null>(null);
  const [HomePageClient, setHomePageClient] = useState<React.ComponentType<any> | null>(null);

  const [{ currentView, shouldUnlock }, setViewState] = useState<{
    currentView: Exclude<HomeView, "loader">;
    shouldUnlock: boolean;
  }>(() => {
    // Synchronous init so desktop doesn't sit on <HomePageShell /> waiting for effects.
    try {
      // DEV TOOL: ?dev_reset=1 wipes all auth flags and forces the registration flow.
      // Use this in incognito to test the unauthenticated experience without the
      // device-fingerprint IP session auto-logging you back in.
      if (typeof window !== "undefined") {
        const devReset = new URLSearchParams(window.location.search).get("dev_reset");
        if (devReset === "1") {
          // Clear every auth/onboarding key so the page behaves like a fresh visitor.
          const keysToRemove = [
            "bullmoney_recruit_auth",
            "bullmoney_session",
            "bullmoney_pagemode_completed",
            "bullmoney_telegram_confirmed",
            "bullmoney_loader_completed",
            "bullmoney_loader_daily_last",
            "bullmoney_pagemode_login_view",
            "bullmoney_draft",
          ];
          keysToRemove.forEach((k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (_) {} });
          // Signal pagemode to skip the IP-session auto-login for this tab session.
          try { sessionStorage.setItem("bm_dev_skip_ip_session", "1"); } catch (_) {}
          // NOTE: URL cleanup (?dev_reset=1 removal) happens in a useEffect below —
          // history.replaceState cannot be called during render.
          return { currentView: "pagemode", shouldUnlock: false };
        }
      }

      const forcePagemodeLogin = safeGetLocal(PAGEMODE_FORCE_LOGIN_KEY);
      if (forcePagemodeLogin === "true") {
        safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
        return { currentView: "pagemode", shouldUnlock: false };
      }

      // CRITICAL: Use loadSession() to recover from cookies/sessionStorage when localStorage is cleared
      // This prevents users from having to re-sign in after cache clears
      const recoveredSession = loadSession();
      const hasSession = recoveredSession !== null;
      
      // If session was recovered from backup (cookie/sessionStorage), repair localStorage flags too
      if (recoveredSession && !safeGetLocal("bullmoney_session")) {
        console.log('[HomePageController] Session recovered from backup storage, repairing localStorage');
        persistSession(recoveredSession);
        safeSetLocal("bullmoney_pagemode_completed", "true");
      }

      // Fast-path: if a valid session exists, skip pagemode/telegram entirely
      if (hasSession) {
        safeSetLocal("bullmoney_pagemode_completed", "true");
        safeSetLocal("bullmoney_telegram_confirmed", "true");
        safeSetLocal("bullmoney_loader_completed", "true");
        return { currentView: "content", shouldUnlock: true };
      }
      
      const hasCompletedPagemode = safeGetLocal("bullmoney_pagemode_completed");
      const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");

      const now = Date.now();
      let shouldResetPagemode = false;

      try {
        const sessionCountKey = "bullmoney_refresh_count";
        const refreshTimesKey = "bullmoney_refresh_times";
        const rapidShownKey = "bullmoney_refresh_rapid_last";

        const sessionCount = Number(safeGetSession(sessionCountKey) || "0") + 1;
        safeSetSession(sessionCountKey, String(sessionCount));
        if (sessionCount > 15) {
          shouldResetPagemode = true;
        }

        const rawTimes = safeGetSession(refreshTimesKey);
        const parsedTimes = JSON.parse(rawTimes || "[]");
        const times = Array.isArray(parsedTimes) ? parsedTimes : [];
        const recentTimes = (times as number[]).filter((t) => now - t <= 120000);
        recentTimes.push(now);
        safeSetSession(refreshTimesKey, JSON.stringify(recentTimes));

        const lastRapidShown = Number(safeGetSession(rapidShownKey) || "0");
        const rapidCooldownMs = 120000;
        if (recentTimes.length >= 3 && now - lastRapidShown >= rapidCooldownMs) {
          safeSetSession(rapidShownKey, String(now));
        }
      } catch {
        // ignore
      }

      try {
        const dailyKey = "bullmoney_loader_daily_last";
        const lastDaily = Number(safeGetLocal(dailyKey) || "0");
        const target = new Date(now);
        target.setHours(23, 59, 50, 0);
        const targetTime = target.getTime();
        if (now >= targetTime && lastDaily < targetTime) {
          safeSetLocal(dailyKey, String(targetTime));
        }
      } catch {
        // ignore
      }

      if (shouldResetPagemode) {
        safeRemoveLocal("bullmoney_pagemode_completed");
        return { currentView: "pagemode", shouldUnlock: false };
      }

      // Always require pagemode if there is no valid session, regardless of stale localStorage flags.
      // This prevents stale bullmoney_pagemode_completed from skipping straight to telegram.
      if (!hasSession) {
        return { currentView: "pagemode", shouldUnlock: false };
      }

      // Loader step removed; keep storage key parity.
      safeSetLocal("bullmoney_loader_completed", "true");

      if (hasCompletedTelegram === "true") {
        return { currentView: "content", shouldUnlock: true };
      }

      return { currentView: "telegram", shouldUnlock: false };
    } catch {
      return { currentView: "pagemode", shouldUnlock: false };
    }
  });

  const { setLoaderv2Open, setV2Unlocked, setDevSkipPageModeAndLoader } = useUIState();

  // Apply initial unlock state once.
  useEffect(() => {
    if (shouldUnlock) setV2Unlocked(true);
  }, [shouldUnlock, setV2Unlocked]);

  // Strip ?dev_reset=1 from the URL after mount (can't do it during render).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev_reset") === "1") {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  // Dev keyboard shortcut to skip pagemode and loader (works even before content mounts)
  useDevSkipShortcut(() => {
    setDevSkipPageModeAndLoader(true);
    setV2Unlocked(true);
    setViewState({ currentView: "content", shouldUnlock: true });
  });

  // 🚀 COMPILATION SPEED: Lazy load components only when needed
  useEffect(() => {
    if (currentView === "pagemode" && !PageMode) {
      import("@/components/signups/pagemode").then(mod => setPageMode(() => mod.default));
    }
  }, [currentView, PageMode]);

  useEffect(() => {
    if (currentView === "telegram" && !TelegramUnlockScreen) {
      import("@/components/signups/TelegramConfirmationResponsive").then(mod =>
        setTelegramUnlockScreen(() => mod.TelegramConfirmationResponsive)
      );
    }
  }, [currentView, TelegramUnlockScreen]);

  useEffect(() => {
    if (currentView === "content" && !HomePageClient) {
      import("./HomePageClient").then(mod => setHomePageClient(() => mod.HomePageClient));
    }
  }, [currentView, HomePageClient]);

  // Ensure global loader state stays closed (loader step removed).
  useEffect(() => {
    setLoaderv2Open(false);
    return () => setLoaderv2Open(false);
  }, [setLoaderv2Open]);

  // Listen for forced pagemode event (dispatched when user clicks sign-in while already on '/').
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      const loginViewFlag = safeGetLocal("bullmoney_pagemode_login_view");
      if (loginViewFlag !== "true") {
        try {
          localStorage.setItem("bullmoney_pagemode_login_view", "true");
        } catch {}
      }
      setViewState({ currentView: "pagemode", shouldUnlock: false });
    };

    window.addEventListener("bullmoney_force_pagemode", handler);
    return () => window.removeEventListener("bullmoney_force_pagemode", handler);
  }, []);

  const handlePageModeUnlock = useCallback(() => {
    safeSetLocal("bullmoney_pagemode_completed", "true");

    const redirectPath = safeGetLocal(PAGEMODE_REDIRECT_PATH_KEY);
    if (redirectPath) {
      const normalizedRedirectPath = redirectPath === "/store/account" ? "/store" : redirectPath;
      safeRemoveLocal(PAGEMODE_REDIRECT_PATH_KEY);
      safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
      window.location.assign(normalizedRedirectPath);
      return;
    }

    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    safeSetLocal("bullmoney_loader_completed", "true");
    if (hasCompletedTelegram === "true") {
      setV2Unlocked(true);
      setViewState({ currentView: "content", shouldUnlock: true });
      return;
    }

    setViewState({ currentView: "telegram", shouldUnlock: false });
  }, [setV2Unlocked]);

  const handleTelegramUnlock = useCallback(() => {
    safeSetLocal("bullmoney_loader_completed", "true");
    safeSetLocal("bullmoney_telegram_confirmed", "true");
    setV2Unlocked(true);
    setViewState({ currentView: "content", shouldUnlock: true });
  }, [setV2Unlocked]);

  return (
    <Suspense fallback={null}>
      {currentView === "pagemode" && (
        <div className="fixed inset-0 z-99999 bg-black">
          {PageMode ? (
            <PageMode onUnlock={handlePageModeUnlock} />
          ) : (
            // Loading state while component loads
            <div className="flex items-center justify-center text-white text-sm tracking-tight">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Preparing access…</span>
              </div>
            </div>
          )}
        </div>
      )}

      {currentView === "telegram" && (
        <div className="fixed inset-0 z-99999 bg-black">
          {TelegramUnlockScreen ? (
            <TelegramUnlockScreen
              onUnlock={handleTelegramUnlock}
              onConfirmationClicked={() => undefined}
              isXM={false}
              neonIconClass="neon-blue-icon"
            />
          ) : (
            <div className="flex items-center justify-center text-white text-sm">
              <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            </div>
          )}
        </div>
      )}

      {currentView === "content" && (
        HomePageClient ? (
          <HomePageClient initialView="content" skipInit={true} />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
          </div>
        )
      )}
    </Suspense>
  );
}

export default HomePageController;
