/**
 * App Version Configuration - AUTO-VERSIONING
 *
 * VERSION IS NOW AUTOMATIC - No manual bumping needed!
 * 
 * On every build/deploy, a unique version is generated from the build timestamp.
 * This ensures users always get fresh content after each deploy while
 * preserving their login sessions and preferences.
 *
 * HOW IT WORKS:
 * - BUILD_TIMESTAMP is set at build time via next.config.mjs
 * - APP_VERSION is derived from the timestamp (unique per build)
 * - On user visit, if their stored version ≠ current version → clear stale caches
 * - Auth/preferences are ALWAYS preserved (see PRESERVED_KEYS below)
 */

// Build timestamp - automatically set at build time by Next.js
// Falls back to current time in dev mode
export const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString();

// AUTO-GENERATED VERSION based on build timestamp
// This changes automatically on every deploy - no manual bumping needed!
export const APP_VERSION = `auto-${BUILD_TIMESTAMP.replace(/[^0-9]/g, '').slice(0, 14)}`;

// Version configuration
export interface VersionConfig {
  version: string;
  buildTimestamp: string;
  requiresFullCacheClear: boolean;
  compatibleVersions: string[]; // Previous versions that don't need full clear
}

export const VERSION_CONFIG: VersionConfig = {
  version: APP_VERSION,
  buildTimestamp: BUILD_TIMESTAMP,
  requiresFullCacheClear: true, // ENABLED: Force full cache clear for all users
  compatibleVersions: [], // CLEARED: No compatible versions - everyone gets fresh state
};

// Storage keys that should be PRESERVED across cache clears
// These survive version updates and cache invalidation - NEVER CLEARED
export const PRESERVED_KEYS = [
  // ===== AUTH & LOGIN (CRITICAL - keeps user logged in) =====
  'bullmoney_session',           // Pagemode login session
  'bullmoney_recruit_auth',      // Recruit auth session
  'bullmoney_tracking_session',  // Tracking session ID
  'bullmoney_pagemode_completed', // User has completed pagemode (skip on return)
  'bullmoney_draft',             // Partial registration progress
  
  // ===== USER PREFERENCES =====
  'bullmoney_user_preferences',
  'bullmoney_theme_settings',
  'bullmoney-theme',
  'user_theme_id',
  'has_seen_theme_onboarding',   // Theme helper shown
  
  // ===== ANALYTICS & TRACKING =====
  'bullmoney_analytics_id',
  
  // ===== DEVICE DETECTION (saves re-computation) =====
  'bullmoney_device_tier',
  'bullmoney_storage_quota',
  'bullmoney_build_id',          // Build tracking
  
  // ===== SOUND PREFERENCES =====
  'bullmoney_muted',
  'bullmoney_sound_profile',
  
  // ===== USER IDENTITY =====
  'bullmoney_xm_user',
];

// Supabase auth keys - ALWAYS preserved (handled separately, not bullmoney_ prefixed)
export const SUPABASE_PRESERVED_PATTERNS = [
  'sb-', // Supabase session tokens
  'supabase.auth', // Supabase auth state
];

// Storage keys that should always be cleared on version mismatch
// These are volatile/cached data that can become stale
export const VOLATILE_KEYS = [
  'bullmoney_spline_cache',      // 3D scene cache
  'bullmoney_image_cache',       // Image cache
  'bullmoney_api_cache',         // API response cache
  'bullmoney_playlist_cache',    // Playlist cache
  'bullmoney_component_cache',   // Component state cache
];

// Prefixes for keys that should always be cleared (stale content)
export const VOLATILE_PREFIXES = [
  'bullmoney_cache_',       // Any cache keys
  'bullmoney_temp_',        // Temporary data
];

// Keys to clear on major version updates only
export const MAJOR_UPDATE_CLEAR_KEYS = [
  ...VOLATILE_KEYS,
];
