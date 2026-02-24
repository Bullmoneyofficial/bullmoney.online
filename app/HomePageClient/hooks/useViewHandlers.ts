import { useCallback } from "react";
import {
  safeGetLocal,
  safeSetLocal,
  safeRemoveLocal,
  PAGEMODE_FORCE_LOGIN_KEY,
  PAGEMODE_REDIRECT_PATH_KEY,
} from "../constants";

// ============================================================
// useViewHandlers — Onboarding flow transition handlers
//
// Returns stable callbacks (via useCallback) for:
//  • handlePageModeUnlock  — called when PageMode screen completes
//  • handleLoaderComplete  — called when TradingUnlockLoader finishes
//  • handleTelegramUnlock  — called when TelegramConfirmation confirms
// ============================================================

type ViewType = "pagemode" | "loader" | "telegram" | "content";

interface UseViewHandlersParams {
  setCurrentView: (view: ViewType) => void;
  setV2Unlocked: (v: boolean) => void;
}

export interface ViewHandlers {
  handlePageModeUnlock: () => void;
  handleLoaderComplete: () => void;
  handleTelegramUnlock: () => void;
}

export function useViewHandlers({
  setCurrentView,
  setV2Unlocked,
}: UseViewHandlersParams): ViewHandlers {
  // ── PageMode completed ────────────────────────────────────
  const handlePageModeUnlock = useCallback(() => {
    // Mark pagemode as completed so user skips it on reload
    safeSetLocal("bullmoney_pagemode_completed", "true");
    console.log(
      "[Page] Pagemode completed, checking if should skip to content or show loader"
    );

    const redirectPath = safeGetLocal(PAGEMODE_REDIRECT_PATH_KEY);
    if (redirectPath) {
      const normalizedRedirectPath =
        redirectPath === "/store/account" ? "/store" : redirectPath;
      safeRemoveLocal(PAGEMODE_REDIRECT_PATH_KEY);
      safeRemoveLocal(PAGEMODE_FORCE_LOGIN_KEY);
      window.location.assign(normalizedRedirectPath);
      return;
    }

    // If loader was already completed, skip directly to content
    const hasCompletedLoader = safeGetLocal("bullmoney_loader_completed");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    if (hasCompletedLoader === "true") {
      if (hasCompletedTelegram === "true") {
        console.log(
          "[Page] Loader + telegram already completed, skipping to content"
        );
        setV2Unlocked(true);
        setCurrentView("content");
      } else {
        console.log("[Page] Loader completed, showing telegram confirmation");
        setCurrentView("telegram");
      }
      return;
    }

    console.log("[Page] Moving to V3 loader");
    setCurrentView("loader");
  }, [setCurrentView, setV2Unlocked]);

  // ── Vault (v3 loader) completed ───────────────────────────
  const handleLoaderComplete = useCallback(() => {
    console.log("[Page] V3 completed - moving to telegram confirmation");
    safeSetLocal("bullmoney_loader_completed", "true");
    const hasCompletedTelegram = safeGetLocal("bullmoney_telegram_confirmed");
    if (hasCompletedTelegram === "true") {
      setV2Unlocked(true);
      setCurrentView("content");
      return;
    }
    setCurrentView("telegram");
  }, [setCurrentView, setV2Unlocked]);

  // ── Telegram confirmation completed ───────────────────────
  const handleTelegramUnlock = useCallback(() => {
    safeSetLocal("bullmoney_loader_completed", "true");
    safeSetLocal("bullmoney_telegram_confirmed", "true");

    // Open broker signups in background tabs for new users — user stays on Bull Money
    const alreadyRedirected = safeGetLocal("bullmoney_xm_redirect_done");
    if (alreadyRedirected !== "true") {
      try {
        navigator.clipboard.writeText("X3R7P").catch(() => {});
      } catch {}
      const xmTab = window.open("https://affs.click/t5wni", "_blank");
      try {
        xmTab?.blur();
        window.focus();
      } catch {}
      setTimeout(() => {
        const vTab = window.open("https://vigco.co/iQbe2u", "_blank");
        try {
          vTab?.blur();
          window.focus();
        } catch {}
      }, 600);
      safeSetLocal("bullmoney_xm_redirect_done", "true");
    }

    // Show the real Bull Money home page
    setV2Unlocked(true);
    setCurrentView("content");
  }, [setCurrentView, setV2Unlocked]);

  return { handlePageModeUnlock, handleLoaderComplete, handleTelegramUnlock };
}
