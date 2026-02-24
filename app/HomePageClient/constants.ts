// ============================================================
// HomePageClient — Constants & Safe Storage Utilities
// ============================================================

export const HERO_MODE_CACHE_KEY = "hero_main_mode_v1";
export const HERO_MODE_CACHE_TTL = 1000 * 60 * 60 * 24;

export const PAGEMODE_FORCE_LOGIN_KEY = "bullmoney_pagemode_force_login";
export const PAGEMODE_REDIRECT_PATH_KEY = "bullmoney_pagemode_redirect_path";

// --------------- localStorage ---------------

export const safeGetLocal = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetLocal = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be blocked in in-app/private modes
  }
};

export const safeRemoveLocal = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be blocked in in-app/private modes
  }
};

// --------------- sessionStorage ---------------

export const safeGetSession = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetSession = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage may be blocked in in-app/private modes
  }
};
