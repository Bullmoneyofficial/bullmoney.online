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
 * IMPORTANT: This version was updated on 2026-01-14 to force cache clear
 * for Safari and all browsers due to build/caching issues.
 */

// Build-time version - update this on each deployment that needs cache invalidation
// BUMPED: 2026-01-14 - Force full cache clear for Safari fix and performance optimization
export const APP_VERSION = '3.0.0';

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

// Storage keys that should be preserved across cache clears
export const PRESERVED_KEYS = [
  'bullmoney_user_preferences', // User-specific settings that should persist
  'bullmoney_analytics_id',     // Analytics tracking ID
];

// Storage keys that should always be cleared on version mismatch
export const VOLATILE_KEYS = [
  'bullmoney_theme_settings',
  'bullmoney-theme',
  'user_theme_id',
  'bullmoney_session',
  'bullmoney_muted',
  'bullmoney_sound_profile',
  'bullmoney_xm_user',
];

// Keys to clear on major version updates only
export const MAJOR_UPDATE_CLEAR_KEYS = [
  ...VOLATILE_KEYS,
  'bullmoney_device_',     // Device-specific caches (prefix match)
  'bullmoney_session_',    // Session data (prefix match)
];
