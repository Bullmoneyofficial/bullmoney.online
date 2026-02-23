"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HomePageShell from "./HomePageShell";
import { useUIState } from "@/contexts/UIStateHook";
import { useDevSkipShortcut } from "@/hooks/useDevSkipShortcut";

type HomeView = "pagemode" | "loader" | "telegram" | "content";

const PAGEMODE_FORCE_LOGIN_KEY = "bullmoney_pagemode_force_login";
const PAGEMODE_REDIRECT_PATH_KEY = "bullmoney_pagemode_redirect_path";

const safeGetLocal = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetLocal = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeRemoveLocal = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const safeGetSession = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetSession = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

// IMPORTANT: Import PageMode directly.
// Importing the aboveFold re-export barrel forces extra modules into the chunk.
const PageMode = dynamic(() => import("@/components/REGISTER USERS/pagemode"), {
  ssr: false,
  loading: () => <HomePageShell />,
});

// NOTE: Loader step removed for PageMode flow (go straight to Telegram/content)

const TelegramUnlockScreen = dynamic(
  () => import("@/components/REGISTER USERS/TelegramConfirmationResponsive").then(mod => ({
    default: mod.TelegramConfirmationResponsive,
  })),
  { ssr: false, loading: () => <HomePageShell /> }
);

const HomePageClient = dynamic(
  () => import("./HomePageClient").then(m => ({ default: m.HomePageClient })),
  { ssr: false, loading: () => <HomePageShell /> }
);

export function HomePageController() {
  const [{ currentView, shouldUnlock }, setViewState] = useState<{
    currentView: Exclude<HomeView, "loader">;
    shouldUnlock: boolean;
  }>(() => {
    // Synchronous init so desktop doesn't sit on <HomePageShell /> waiting for effects.
    try {
      const forcePagemodeLogin = safeGetLocal(PAGEMODE_FORCE_LOGIN_KEY);
      if (forcePagemodeLogin === "true") {
        safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
        return { currentView: "pagemode", shouldUnlock: false };
      }

      const hasSession = safeGetLocal("bullmoney_session");
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

      if (!hasCompletedPagemode && !hasSession) {
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

  // Dev keyboard shortcut to skip pagemode and loader (works even before content mounts)
  useDevSkipShortcut(() => {
    setDevSkipPageModeAndLoader(true);
    setV2Unlocked(true);
    setViewState({ currentView: "content", shouldUnlock: true });
  });

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
    <Suspense fallback={<HomePageShell />}>
      {currentView === "pagemode" && (
        <div className="fixed inset-0 z-99999 bg-black">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === "telegram" && (
        <div className="fixed inset-0 z-99999 bg-black">
          <TelegramUnlockScreen
            onUnlock={handleTelegramUnlock}
            onConfirmationClicked={() => undefined}
            isXM={false}
            neonIconClass="neon-blue-icon"
          />
        </div>
      )}

      {currentView === "content" && <HomePageClient initialView="content" skipInit={true} />}
    </Suspense>
  );
}

export default HomePageController;
