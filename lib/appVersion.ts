/**
 * App Version Configuration
 *
 * This file contains the application version used for cache invalidation.
 * Update APP_VERSION whenever you deploy changes that require clearing
 * user caches to prevent stale data issues.
 *
 * Version Format: MAJOR.MINOR.PATCH-BUILD
 * - MAJOR: Breaking changes that require full cache clear
 * - MINOR: Feature updates that may need partial cache refresh
 * - PATCH: Bug fixes (usually don't need cache clear)
 * - BUILD: Build timestamp for deployments
 * 
 * IMPORTANT: Caching DISABLED as of v3.1.0 - Service worker now uses
 * network-first strategy for all requests. Only essential user data saved.
 */

// Build-time version - update this on each deployment that needs cache invalidation
// BUMPED: 2026-01-20 - Disabled service worker caching for fresher content
export const APP_VERSION = '3.1.0';

// Build timestamp - automatically set at build time
export const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString();

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
