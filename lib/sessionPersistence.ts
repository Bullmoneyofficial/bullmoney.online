/**
 * Session Persistence Layer
 * 
 * Provides REDUNDANT auth storage across localStorage, sessionStorage, and cookies.
 * Ensures user sessions survive:
 * - Page reloads
 * - Cache clearing / version updates
 * - Navigation between app sections (store, account, etc.)
 * - localStorage corruption or quota errors
 * 
 * Storage priority: localStorage → sessionStorage → cookie
 * All three are kept in sync. If one is lost, the others restore it.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const RECRUIT_AUTH_KEY = 'bullmoney_recruit_auth';
const SESSION_KEY = 'bullmoney_session';
const PAGEMODE_COMPLETED_KEY = 'bullmoney_pagemode_completed';
const COOKIE_AUTH_KEY = 'bm_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

interface SessionData {
  recruitId: string;
  email: string;
  timestamp?: number;
  mt5Id?: string;
  isVip?: boolean;
}

// ============================================================================
// COOKIE HELPERS
// ============================================================================

function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  if (typeof document === 'undefined') return;
  try {
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
  } catch (e) {
    // Cookie storage might be disabled
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, ...rest] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(rest.join('='));
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; path=/; max-age=0`;
  } catch (e) {
    // Ignore
  }
}

// ============================================================================
// SAFE STORAGE HELPERS
// ============================================================================

function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSetItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch (e) {
    // Quota exceeded or storage disabled
  }
}

function safeRemoveItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch (e) {
    // Ignore
  }
}

// ============================================================================
// CORE API
// ============================================================================

/**
 * Save session to ALL storage layers (localStorage, sessionStorage, cookie).
 * Call this after successful login.
 */
export function persistSession(data: SessionData): void {
  if (typeof window === 'undefined') return;

  const recruitAuthPayload = JSON.stringify({
    recruitId: data.recruitId,
    email: data.email,
  });

  const sessionPayload = JSON.stringify({
    id: data.recruitId,
    email: data.email,
    timestamp: data.timestamp || Date.now(),
    ...(data.mt5Id ? { mt5_id: data.mt5Id } : {}),
    ...(typeof data.isVip === 'boolean' ? { is_vip: data.isVip } : {}),
  });

  // 1) localStorage (primary)
  safeSetItem(localStorage, RECRUIT_AUTH_KEY, recruitAuthPayload);
  safeSetItem(localStorage, SESSION_KEY, sessionPayload);
  safeSetItem(localStorage, PAGEMODE_COMPLETED_KEY, 'true');

  // 2) sessionStorage (survives reload within tab)
  safeSetItem(sessionStorage, RECRUIT_AUTH_KEY, recruitAuthPayload);
  safeSetItem(sessionStorage, SESSION_KEY, sessionPayload);

  // 3) Cookie (survives everything, 90-day expiry)
  setCookie(COOKIE_AUTH_KEY, recruitAuthPayload);
}

/**
 * Load session from the best available storage layer.
 * Tries: localStorage → sessionStorage → cookie.
 * Automatically repairs missing layers from the found one.
 */
export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null;

  let found: SessionData | null = null;
  let source: string | null = null;

  // 1) Try localStorage (primary)
  const fromLocal = safeGetItem(localStorage, RECRUIT_AUTH_KEY);
  if (fromLocal) {
    try {
      const parsed = JSON.parse(fromLocal);
      if (parsed.recruitId && parsed.email) {
        found = { recruitId: parsed.recruitId, email: parsed.email };
        source = 'localStorage';
      }
    } catch (e) { /* corrupted */ }
  }

  // 2) Try localStorage session key (pagemode format)
  if (!found) {
    const fromSession = safeGetItem(localStorage, SESSION_KEY);
    if (fromSession) {
      try {
        const parsed = JSON.parse(fromSession);
        if ((parsed.id || parsed.recruitId) && parsed.email) {
          found = {
            recruitId: parsed.id || parsed.recruitId,
            email: parsed.email,
            timestamp: parsed.timestamp,
          };
          source = 'localStorage-session';
        }
      } catch (e) { /* corrupted */ }
    }
  }

  // 3) Try sessionStorage
  if (!found) {
    const fromSessionStorage = safeGetItem(sessionStorage, RECRUIT_AUTH_KEY);
    if (fromSessionStorage) {
      try {
        const parsed = JSON.parse(fromSessionStorage);
        if (parsed.recruitId && parsed.email) {
          found = { recruitId: parsed.recruitId, email: parsed.email };
          source = 'sessionStorage';
        }
      } catch (e) { /* corrupted */ }
    }
  }

  // 4) Try cookie (last resort)
  if (!found) {
    const fromCookie = getCookie(COOKIE_AUTH_KEY);
    if (fromCookie) {
      try {
        const parsed = JSON.parse(fromCookie);
        if (parsed.recruitId && parsed.email) {
          found = { recruitId: parsed.recruitId, email: parsed.email };
          source = 'cookie';
        }
      } catch (e) { /* corrupted */ }
    }
  }

  // If found from a non-primary source, repair all layers
  if (found && source !== 'localStorage') {
    console.log(`[SessionPersistence] Recovered session from ${source}, repairing all layers`);
    persistSession(found);
  }

  return found;
}

/**
 * Clear session from ALL storage layers.
 * Call this on sign out.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  // localStorage
  safeRemoveItem(localStorage, RECRUIT_AUTH_KEY);
  safeRemoveItem(localStorage, SESSION_KEY);
  safeRemoveItem(localStorage, PAGEMODE_COMPLETED_KEY);

  // sessionStorage
  safeRemoveItem(sessionStorage, RECRUIT_AUTH_KEY);
  safeRemoveItem(sessionStorage, SESSION_KEY);

  // Cookie
  removeCookie(COOKIE_AUTH_KEY);
}

/**
 * Check if any session data exists (fast check, no Supabase call).
 */
export function hasSession(): boolean {
  if (typeof window === 'undefined') return false;
  return loadSession() !== null;
}

/**
 * Re-sync all storage layers from localStorage.
 * Call this periodically or after auth context loads to keep layers in sync.
 */
export function syncSessionLayers(): void {
  const data = loadSession();
  if (data) {
    persistSession(data);
  }
}
