"use client";

import Cookies from 'js-cookie';

// Cookie consent categories
export type CookieCategory = 'essential' | 'functional' | 'analytics' | 'marketing';

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const CONSENT_COOKIE = 'bullmoney-cookie-consent';
const PAGE_LOAD_COOKIE = 'bullmoney-page-loads';
const COOKIE_EXPIRY = 365; // days

// Map every known cookie to a consent category
const COOKIE_CATEGORY_MAP: Record<string, CookieCategory> = {
  // Essential – always allowed
  'bullmoney-cookie-consent': 'essential',
  'bullmoney-page-loads': 'essential',
  'bm_auth': 'essential',

  // Functional
  'googtrans': 'functional',
  'bm_detected_locale': 'functional',

  // Analytics (Vercel Analytics sets _va / _vercel*)
  '_va': 'analytics',
  '_vercel': 'analytics',

  // Marketing – none currently, but placeholders for future
  '_fbp': 'marketing',
  '_gcl_au': 'marketing',
};

// localStorage keys tied to each consent category
const LOCAL_STORAGE_CATEGORY_MAP: Record<string, CookieCategory> = {
  'bm_analytics_count': 'analytics',
  'bm_analytics_month': 'analytics',
  'bullmoney_perf_debug': 'functional',
  'bullmoney_offline_events': 'functional',
  'store_show_theme_picker': 'functional',
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  timestamp: 0,
};

/**
 * Custom event fired whenever consent changes (components can listen)
 */
export const CONSENT_CHANGE_EVENT = 'bullmoney:consent-change';

function dispatchConsentChange(prefs: CookiePreferences) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CONSENT_CHANGE_EVENT, { detail: prefs })
    );
  }
}

/**
 * Get stored cookie preferences
 */
export function getConsentPreferences(): CookiePreferences | null {
  try {
    const raw = Cookies.get(CONSENT_COOKIE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    // Essential is always true
    parsed.essential = true;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Remove all cookies that belong to a given category
 */
function purgeCategory(category: CookieCategory): void {
  // Remove mapped cookies
  for (const [name, cat] of Object.entries(COOKIE_CATEGORY_MAP)) {
    if (cat === category) {
      Cookies.remove(name, { path: '/' });
      // Also try domain-level removal (for third-party cookies)
      Cookies.remove(name, { path: '/', domain: window.location.hostname });
    }
  }

  // Remove partial-match cookies (e.g. _vercel_xxx, _ga_xxx)
  const allCookies = document.cookie.split(';');
  for (const c of allCookies) {
    const name = c.split('=')[0].trim();
    if (
      (category === 'analytics' && /^_vercel|^_va|^_ga|^_gid|^_gat/.test(name)) ||
      (category === 'marketing' && /^_fbp|^_fbc|^_gcl|^_uet/.test(name))
    ) {
      Cookies.remove(name, { path: '/' });
      Cookies.remove(name, { path: '/', domain: window.location.hostname });
    }
  }

  // Remove mapped localStorage keys
  for (const [key, cat] of Object.entries(LOCAL_STORAGE_CATEGORY_MAP)) {
    if (cat === category) {
      try { localStorage.removeItem(key); } catch { /* noop */ }
    }
  }
}

/**
 * Enforce preferences: purge cookies for any declined category
 */
function enforcePreferences(prefs: CookiePreferences): void {
  const categories: CookieCategory[] = ['functional', 'analytics', 'marketing'];
  for (const cat of categories) {
    if (!prefs[cat]) {
      purgeCategory(cat);
    }
  }
}

/**
 * Save cookie preferences
 */
export function saveConsentPreferences(prefs: Partial<CookiePreferences>): void {
  const full: CookiePreferences = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    essential: true, // Always true
    timestamp: Date.now(),
  };
  Cookies.set(CONSENT_COOKIE, JSON.stringify(full), {
    expires: COOKIE_EXPIRY,
    sameSite: 'lax',
    path: '/',
  });

  // Mirror to localStorage for AutoTranslateProvider compatibility
  if (full.functional || full.analytics || full.marketing) {
    localStorage.setItem('bullmoney-cookie-consent', 'accepted');
  } else {
    localStorage.setItem('bullmoney-cookie-consent', 'declined');
  }

  // Purge real cookies for any declined category
  enforcePreferences(full);

  // Notify listeners (analytics wrapper, translate provider, etc.)
  dispatchConsentChange(full);
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  saveConsentPreferences({
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Decline all optional cookies (essential stays on)
 */
export function declineOptionalCookies(): void {
  saveConsentPreferences({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });
}

/**
 * Check if consent has been given for a specific category
 */
export function isConsentGiven(category: CookieCategory): boolean {
  const prefs = getConsentPreferences();
  if (!prefs) return category === 'essential';
  return prefs[category] ?? false;
}

/**
 * Check if the consent banner has ever been interacted with
 */
export function hasConsentBeenGiven(): boolean {
  return getConsentPreferences() !== null;
}

/**
 * Track page loads and determine if banner should show.
 * Shows on first load (no consent yet) and every 5 loads after consent.
 */
export function shouldShowBanner(): boolean {
  // Always show if no consent given yet
  if (!hasConsentBeenGiven()) return true;

  // Track page loads
  const raw = Cookies.get(PAGE_LOAD_COOKIE);
  const count = raw ? parseInt(raw, 10) : 0;
  const next = count + 1;

  Cookies.set(PAGE_LOAD_COOKIE, String(next), {
    expires: COOKIE_EXPIRY,
    sameSite: 'lax',
    path: '/',
  });

  // Show every 5 loads
  return next % 5 === 0;
}

/**
 * Reset page load counter (call after user interacts with banner)
 */
export function resetPageLoadCounter(): void {
  Cookies.set(PAGE_LOAD_COOKIE, '0', {
    expires: COOKIE_EXPIRY,
    sameSite: 'lax',
    path: '/',
  });
}
