"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HomePageShell from "./HomePageShell";
import { useUIState } from "@/contexts/UIStateHook";

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

const PageMode = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.PageMode })),
  { ssr: false, loading: () => <HomePageShell /> }
);

const TradingUnlockLoader = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.TradingUnlockLoader })),
  { ssr: false, loading: () => <HomePageShell /> }
);

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
  const [hasMounted, setHasMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<HomeView>("pagemode");

  const { setLoaderv2Open, setV2Unlocked } = useUIState();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Keep global loader state in sync with the controller view.
  useEffect(() => {
    setLoaderv2Open(currentView === "loader");
    return () => setLoaderv2Open(false);
  }, [currentView, setLoaderv2Open]);

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
      setCurrentView("pagemode");
      setIsInitialized(true);
    };

    window.addEventListener("bullmoney_force_pagemode", handler);
    return () => window.removeEventListener("bullmoney_force_pagemode", handler);
  }, []);

  // Determine initial view based on localStorage/session.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const forcePagemodeLogin = safeGetLocal(PAGEMODE_FORCE_LOGIN_KEY);
    if (forcePagemodeLogin === "true") {
      safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
      setCurrentView("pagemode");
      setIsInitialized(true);
      return;
    }

    const hasSession = safeGetLocal("bullmoney_session");
    const hasCompletedPagemode = safeGetLocal("bullmoney_pagemode_completed");
    const hasCompletedLoader = safeGetLocal("bullmoney_loader_completed");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");

    const now = Date.now();
    let shouldForceLoader = false;
    const forceReasons: string[] = [];
    let shouldResetPagemode = false;

    // Refresh/session-based loader triggers
    try {
      const sessionCountKey = "bullmoney_refresh_count";
      const refreshTimesKey = "bullmoney_refresh_times";
      const rapidShownKey = "bullmoney_refresh_rapid_last";

      const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

      // Session refresh counter
      const sessionCount = Number(safeGetSession(sessionCountKey) || "0") + 1;
      safeSetSession(sessionCountKey, String(sessionCount));

      if (sessionCount > 15) {
        shouldResetPagemode = true;
        forceReasons.push(`refresh_over_15_${sessionCount}`);
      }

      // Track refresh timestamps for rapid-refresh detection (2-minute window)
      const rawTimes = safeGetSession(refreshTimesKey);
      const parsedTimes = JSON.parse(rawTimes || "[]");
      const times = Array.isArray(parsedTimes) ? parsedTimes : [];
      const recentTimes = (times as number[]).filter(t => now - t <= 120000);
      recentTimes.push(now);
      safeSetSession(refreshTimesKey, JSON.stringify(recentTimes));

      const lastRapidShown = Number(safeGetSession(rapidShownKey) || "0");
      const rapidCooldownMs = 120000;
      if (recentTimes.length >= 3 && now - lastRapidShown >= rapidCooldownMs) {
        shouldForceLoader = true;
        forceReasons.push("rapid_refresh_3_in_2min");
        safeSetSession(rapidShownKey, String(now));
      }
    } catch {
      // ignore
    }

    // Daily 23:59:50 TTL trigger
    try {
      const dailyKey = "bullmoney_loader_daily_last";
      const lastDaily = Number(safeGetLocal(dailyKey) || "0");
      const target = new Date(now);
      target.setHours(23, 59, 50, 0);
      const targetTime = target.getTime();

      if (now >= targetTime && lastDaily < targetTime) {
        shouldForceLoader = true;
        forceReasons.push("daily_23_59_50");
        safeSetLocal(dailyKey, String(targetTime));
      }
    } catch {
      // ignore
    }

    // Match the existing HomePageClient behavior
    if (shouldResetPagemode) {
      try {
        safeRemoveLocal("bullmoney_pagemode_completed");
      } catch {}
      setCurrentView("pagemode");
    } else if (!hasCompletedPagemode && !hasSession) {
      setCurrentView("pagemode");
    } else if (hasCompletedLoader === "true") {
      if (hasCompletedTelegram === "true") {
        setV2Unlocked(true);
        setCurrentView("content");
      } else {
        setCurrentView("telegram");
      }
    } else if (shouldForceLoader && (hasSession || hasCompletedPagemode === "true")) {
      setCurrentView("loader");
    } else if (hasSession || hasCompletedPagemode === "true") {
      setCurrentView("loader");
    } else {
      setCurrentView("pagemode");
    }

    // Keep log parity for debugging in production.
    // eslint-disable-next-line no-console
    console.log("[Page] Session check:", {
      hasSession: !!hasSession,
      hasCompletedPagemode,
      hasCompletedLoader,
      shouldForceLoader,
      shouldResetPagemode,
      forceReasons,
    });

    setIsInitialized(true);
  }, [setV2Unlocked]);

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

    const hasCompletedLoader = safeGetLocal("bullmoney_loader_completed");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    if (hasCompletedLoader === "true") {
      if (hasCompletedTelegram === "true") {
        setV2Unlocked(true);
        setCurrentView("content");
      } else {
        setCurrentView("telegram");
      }
      return;
    }

    setCurrentView("loader");
  }, [setV2Unlocked]);

  const handleLoaderComplete = useCallback(() => {
    safeSetLocal("bullmoney_loader_completed", "true");

    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    if (hasCompletedTelegram === "true") {
      setV2Unlocked(true);
      setCurrentView("content");
      return;
    }

    setCurrentView("telegram");
  }, [setV2Unlocked]);

  const handleTelegramUnlock = useCallback(() => {
    safeSetLocal("bullmoney_loader_completed", "true");
    safeSetLocal("bullmoney_telegram_confirmed", "true");
    setV2Unlocked(true);
    setCurrentView("content");
  }, [setV2Unlocked]);

  if (!hasMounted) return <HomePageShell />;
  if (!isInitialized) return <HomePageShell />;

  return (
    <Suspense fallback={<HomePageShell />}>
      {currentView === "pagemode" && (
        <div className="fixed inset-0 z-99999 bg-black">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === "loader" && (
        <div className="fixed inset-0 z-99999 bg-black">
          <TradingUnlockLoader onFinished={handleLoaderComplete} />
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
