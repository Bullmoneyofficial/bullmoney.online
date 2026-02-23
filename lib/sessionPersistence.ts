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

// ============================================================================
// IP-BASED SESSION API (Server-side persistence via Vercel/Supabase)
// ============================================================================

interface IPSessionResponse {
  success: boolean;
  hasSession?: boolean;
  recruit?: {
    id: string;
    email: string;
    mt5_id?: string;
    is_vip?: boolean;
    affiliate_code?: string;
    social_handle?: string;
    status?: string;
    commission_balance?: number;
    image_url?: string;
  };
  error?: string;
}

/**
 * Generate a device fingerprint based on browser characteristics.
 * This stays consistent across incognito/regular mode on the same device.
 */
function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  
  try {
    const components = [
      // Screen characteristics
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      window.devicePixelRatio || 1,
      
      // Time zone
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Language
      navigator.language,
      navigator.languages?.join(',') || '',
      
      // Platform
      navigator.platform,
      
      // Hardware concurrency (CPU cores)
      navigator.hardwareConcurrency || 0,
      
      // User agent
      navigator.userAgent,
      
      // Touch support
      'ontouchstart' in window ? 'touch' : 'no-touch',
      navigator.maxTouchPoints || 0,
      
      // WebGL renderer (GPU info)
      getWebGLRenderer(),
    ];
    
    // Create a hash from all components
    const fingerprint = components.join('|');
    return simpleHash(fingerprint);
  } catch (e) {
    // Fallback to user agent only
    return simpleHash(navigator.userAgent || 'unknown');
  }
}

/**
 * Get WebGL renderer info (identifies GPU)
 */
function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
    }
  } catch (e) {
    // WebGL not available
  }
  return 'no-webgl';
}

/**
 * Simple hash function for fingerprinting
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and pad to ensure consistent length
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Add a second hash for more uniqueness
  let hash2 = 5381;
  for (let i = 0; i < str.length; i++) {
    hash2 = ((hash2 << 5) + hash2) + str.charCodeAt(i);
  }
  return hex + Math.abs(hash2).toString(16).padStart(8, '0');
}

// Cache the device ID to avoid regenerating on every call
let cachedDeviceId: string | null = null;

function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  cachedDeviceId = generateDeviceFingerprint();
  return cachedDeviceId;
}

/**
 * Check for an existing device-based session on the server.
 * Uses device fingerprint for identification (works in incognito, across networks).
 */

/**
 * Check for an existing device-based session on the server.
 * Uses device fingerprint for identification (works in incognito, across networks).
 */
export async function checkIPSession(): Promise<IPSessionResponse> {
  if (typeof window === 'undefined') {
    return { success: false, hasSession: false };
  }

  try {
    const deviceId = getDeviceId();
    const response = await fetch('/api/recruit-auth/ip-session', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      // Include credentials so cookies are sent (helps with some proxy setups)
      credentials: 'same-origin',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[IPSession] Check failed:', error);
    return { success: false, hasSession: false, error: 'Network error' };
  }
}

/**
 * Store a new device-based session on the server.
 * Call this after successful login/registration.
 */
export async function saveIPSession(recruitId: string, email: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const deviceId = getDeviceId();
    const response = await fetch('/api/recruit-auth/ip-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      credentials: 'same-origin',
      body: JSON.stringify({ recruitId, email }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('[IPSession] Session saved for device');
      return true;
    }
    console.warn('[IPSession] Failed to save:', data.error);
    return false;
  } catch (error) {
    console.error('[IPSession] Save failed:', error);
    return false;
  }
}

/**
 * Clear the device-based session on the server (logout).
 */
export async function clearIPSession(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const deviceId = getDeviceId();
    const response = await fetch('/api/recruit-auth/ip-session', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      credentials: 'same-origin',
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('[IPSession] Clear failed:', error);
    return false;
  }
}

/**
 * Full session restoration: tries IP-based session first, then falls back to local storage.
 * Returns the session data if found, null otherwise.
 */
export async function restoreSession(): Promise<SessionData | null> {
  // First, try IP-based session (server-side, most reliable)
  try {
    const ipResult = await checkIPSession();
    if (ipResult.success && ipResult.hasSession && ipResult.recruit) {
      const sessionData: SessionData = {
        recruitId: ipResult.recruit.id,
        email: ipResult.recruit.email,
        mt5Id: ipResult.recruit.mt5_id,
        isVip: ipResult.recruit.is_vip,
        timestamp: Date.now(),
      };
      // Also sync to local storage for faster subsequent loads
      persistSession(sessionData);
      console.log('[SessionPersistence] Restored from IP session');
      return sessionData;
    }
  } catch (e) {
    console.warn('[SessionPersistence] IP session check failed, trying local storage');
  }

  // Fall back to local storage
  const localSession = loadSession();
  if (localSession) {
    console.log('[SessionPersistence] Restored from local storage');
    return localSession;
  }

  return null;
}

/**
 * Complete login persistence: saves to both IP-based and local storage.
 * Call this after successful login.
 */
export async function persistFullSession(data: SessionData): Promise<void> {
  // Save to local storage (immediate, works offline)
  persistSession(data);

  // Save to IP-based session (server-side, survives cache clears)
  await saveIPSession(data.recruitId, data.email);
}

/**
 * Complete logout: clears both IP-based and local storage sessions.
 */
export async function clearFullSession(): Promise<void> {
  // Clear local storage
  clearSession();

  // Clear IP-based session
  await clearIPSession();
}
