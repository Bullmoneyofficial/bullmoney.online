"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy-load the v3 loader to avoid pulling it into every page's initial bundle
const TradingUnlockLoader = dynamic(
  () => import("@/components/MultiStepLoaderv3Simple"),
  { ssr: false }
);

// Auth/session keys to NEVER clear during cache wipe
const AUTH_PRESERVE_PREFIXES = [
  'bullmoney_session',
  'bullmoney_pagemode_completed',
  'bullmoney_loader_completed',
  'bullmoney_telegram_confirmed',
  'bullmoney_muted',
  'bullmoney_xm_redirect_done',
  'bullmoney_user',
  'bullmoney_auth',
  'bullmoney_login',
  'bullmoney_token',
  'bullmoney_recruit_auth',
  'bullmoney_draft',
  'bullmoney_user_preferences',
  'bullmoney_theme_settings',
  'bullmoney-theme',
  'user_theme_id',
  'bullmoney_analytics_id',
  'bullmoney_tracking_session',
  'bullmoney_app_version',
  'supabase.auth.token',
  'sb-',
];

// Pages that have their OWN v3 loader logic — skip the global one
const PAGES_WITH_OWN_LOADER = ['/', '/desktop'];

/**
 * GlobalV3Loader — Shows the v3 simple loader on a random ~20% of reloads
 * across ALL pages (store, games, design, etc.)
 *
 * Also handles the 5-reload cache clear (preserving auth).
 *
 * Mounted once in LayoutProviders so it covers every route.
 */
export default function GlobalV3Loader() {
  const pathname = usePathname();
  const [showLoader, setShowLoader] = useState(false);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pages that already handle their own v3 loader
    if (PAGES_WITH_OWN_LOADER.includes(pathname)) {
      setDecided(true);
      return;
    }

    // Only show for returning users who have completed pagemode
    const hasCompletedPagemode = localStorage.getItem('bullmoney_pagemode_completed');
    const hasSession = localStorage.getItem('bullmoney_session');
    if (!hasCompletedPagemode && !hasSession) {
      setDecided(true);
      return;
    }

    // Check if we already decided for this page load (prevent re-rolls on re-renders)
    const alreadyDecidedKey = 'bullmoney_global_v3_decided';
    const alreadyDecided = sessionStorage.getItem(alreadyDecidedKey);
    if (alreadyDecided === pathname) {
      // Already decided for this navigation — check if it was a "show"
      const shouldShow = sessionStorage.getItem('bullmoney_global_v3_show') === 'true';
      if (shouldShow) setShowLoader(true);
      setDecided(true);
      return;
    }

    // ===== Session refresh counter & cache clear =====
    try {
      const sessionCountKey = 'bullmoney_global_refresh_count';
      const sessionCount = Number(sessionStorage.getItem(sessionCountKey) || '0') + 1;
      sessionStorage.setItem(sessionCountKey, String(sessionCount));

      // After 5 reloads in a session → clear non-auth localStorage
      if (sessionCount >= 5) {
        const keysToKeep: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (AUTH_PRESERVE_PREFIXES.some(prefix => key === prefix || key.startsWith(prefix))) {
            keysToKeep[key] = localStorage.getItem(key) || '';
          }
        }
        localStorage.clear();
        Object.entries(keysToKeep).forEach(([k, v]) => localStorage.setItem(k, v));
        sessionStorage.setItem(sessionCountKey, '0');
        console.log('[GlobalV3] 5+ reloads — cleared cache (auth preserved)');
      }
    } catch (e) {
      console.warn('[GlobalV3] Cache clear failed', e);
    }

    // ===== ~20% random chance to show v3 loader =====
    const roll = Math.random();
    const shouldShow = roll < 0.20;
    console.log(`[GlobalV3] Roll: ${roll.toFixed(3)} on ${pathname} → ${shouldShow ? 'SHOW' : 'skip'}`);

    // Remember decision so re-renders don't re-roll
    sessionStorage.setItem(alreadyDecidedKey, pathname);
    sessionStorage.setItem('bullmoney_global_v3_show', String(shouldShow));

    if (shouldShow) {
      setShowLoader(true);
    }

    setDecided(true);
  }, [pathname]);

  const handleFinished = useCallback(() => {
    setShowLoader(false);
  }, []);

  if (!decided || !showLoader) return null;

  return (
    <div
      className="fixed inset-0 bg-black"
      style={{ zIndex: 99999 }}
    >
      <TradingUnlockLoader onFinished={handleFinished} />
    </div>
  );
}
