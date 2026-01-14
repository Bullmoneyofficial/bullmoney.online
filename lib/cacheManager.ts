/**
 * Cache Manager - Version-Based Cache Invalidation System
 *
 * Handles cache invalidation on app updates to prevent stale data issues.
 * Integrates with DeviceMonitor to adjust caching strategy for low-end devices.
 *
 * Features:
 * - Automatic version detection and comparison
 * - Smart cache invalidation based on version changes
 * - Device-aware storage limits
 * - Graceful migration of preserved data
 */

import {
  APP_VERSION,
  BUILD_TIMESTAMP,
  VERSION_CONFIG,
  PRESERVED_KEYS,
  VOLATILE_KEYS,
  MAJOR_UPDATE_CLEAR_KEYS,
} from './appVersion';

import { detectSafari, initSafariOptimizations, checkSafariStaleBuild, safariForceReload } from './safariOptimizations';

// Storage keys used by CacheManager
const STORAGE_KEYS = {
  APP_VERSION: 'bullmoney_app_version',
  BUILD_TIMESTAMP: 'bullmoney_build_timestamp',
  LAST_CACHE_CLEAR: 'bullmoney_last_cache_clear',
  DEVICE_TIER: 'bullmoney_device_tier',
  STORAGE_QUOTA: 'bullmoney_storage_quota',
  MIGRATION_COMPLETED: 'bullmoney_migration_completed',
};

export type DeviceTier = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

export interface DeviceCapabilities {
  tier: DeviceTier;
  memory: number;         // Device memory in GB
  cores: number;          // CPU cores
  isHighRefresh: boolean; // 90Hz+ display
  hasDiscreteGPU: boolean;
  storageQuota: number;   // Recommended storage limit in KB
}

export interface CacheStatus {
  isStale: boolean;
  currentVersion: string;
  storedVersion: string | null;
  requiresFullClear: boolean;
  deviceTier: DeviceTier;
  lastCacheClear: string | null;
}

/**
 * Detect device capabilities for storage optimization
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      tier: 'medium',
      memory: 4,
      cores: 4,
      isHighRefresh: false,
      hasDiscreteGPU: false,
      storageQuota: 2048, // 2MB default
    };
  }

  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const ua = navigator.userAgent.toLowerCase();

  // Check for high refresh rate
  const isHighRefresh =
    'refreshRate' in screen && (screen as any).refreshRate >= 90;

  // Detect GPU capabilities
  let hasDiscreteGPU = false;
  let isAppleSilicon = false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl
          .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          .toLowerCase();
        hasDiscreteGPU =
          renderer.includes('nvidia') ||
          renderer.includes('geforce') ||
          renderer.includes('radeon') ||
          renderer.includes('amd') ||
          renderer.includes('rtx') ||
          renderer.includes('gtx');
        isAppleSilicon =
          renderer.includes('apple') &&
          (renderer.includes('gpu') || /m[1-9]/.test(renderer));
      }
    }
  } catch (e) {
    // WebGL not available
  }

  // Determine device tier
  let tier: DeviceTier;
  let storageQuota: number;

  if (isAppleSilicon || (hasDiscreteGPU && memory >= 16 && cores >= 8)) {
    tier = 'ultra';
    storageQuota = 10240; // 10MB for ultra devices
  } else if (memory >= 8 && cores >= 4) {
    tier = 'high';
    storageQuota = 5120; // 5MB for high-end
  } else if (memory >= 4 && cores >= 2) {
    tier = 'medium';
    storageQuota = 2048; // 2MB for medium
  } else if (memory >= 2) {
    tier = 'low';
    storageQuota = 1024; // 1MB for low-end
  } else {
    tier = 'minimal';
    storageQuota = 512; // 512KB for minimal
  }

  // Reduce quota for mobile devices
  const isMobile = /mobi|android|iphone|ipad/i.test(ua);
  if (isMobile) {
    storageQuota = Math.min(storageQuota, 2048);
  }

  return {
    tier,
    memory,
    cores,
    isHighRefresh,
    hasDiscreteGPU,
    storageQuota,
  };
}

/**
 * Compare semantic versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((n) => parseInt(n, 10));
  const partsB = b.split('.').map((n) => parseInt(n, 10));

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Check if version is a major update (first number changed)
 */
function isMajorUpdate(oldVersion: string, newVersion: string): boolean {
  const oldMajor = parseInt(oldVersion.split('.')[0], 10);
  const newMajor = parseInt(newVersion.split('.')[0], 10);
  return newMajor > oldMajor;
}

/**
 * Get cache status - compare stored version with current
 */
export function getCacheStatus(): CacheStatus {
  if (typeof window === 'undefined') {
    return {
      isStale: false,
      currentVersion: APP_VERSION,
      storedVersion: null,
      requiresFullClear: false,
      deviceTier: 'medium',
      lastCacheClear: null,
    };
  }

  const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
  const lastCacheClear = localStorage.getItem(STORAGE_KEYS.LAST_CACHE_CLEAR);
  const storedDeviceTier = localStorage.getItem(STORAGE_KEYS.DEVICE_TIER) as DeviceTier | null;

  // Detect current device tier
  const capabilities = detectDeviceCapabilities();
  const deviceTier = storedDeviceTier || capabilities.tier;

  // No stored version means first visit or cleared storage
  if (!storedVersion) {
    return {
      isStale: false,
      currentVersion: APP_VERSION,
      storedVersion: null,
      requiresFullClear: false,
      deviceTier,
      lastCacheClear,
    };
  }

  // Check if version is newer
  const comparison = compareVersions(APP_VERSION, storedVersion);
  const isStale = comparison > 0;

  // Determine if full clear is needed
  let requiresFullClear = false;
  if (isStale) {
    // Check if compatible version
    const isCompatible = VERSION_CONFIG.compatibleVersions.includes(storedVersion);
    // Major update always requires full clear
    const majorUpdate = isMajorUpdate(storedVersion, APP_VERSION);

    requiresFullClear =
      VERSION_CONFIG.requiresFullCacheClear || majorUpdate || !isCompatible;
  }

  return {
    isStale,
    currentVersion: APP_VERSION,
    storedVersion,
    requiresFullClear,
    deviceTier,
    lastCacheClear,
  };
}

/**
 * Clear volatile storage keys (used on any version update)
 */
function clearVolatileStorage(): void {
  VOLATILE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[CacheManager] Failed to remove ${key}:`, e);
    }
  });
}

/**
 * Clear all caches except preserved keys (used on major updates)
 */
function clearAllCaches(): void {
  const preserved = new Map<string, string>();

  // Backup preserved keys
  PRESERVED_KEYS.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        preserved.set(key, value);
      }
    } catch (e) {
      // Ignore
    }
  });

  // Clear all BullMoney-related keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bullmoney')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  });

  // Restore preserved keys
  preserved.forEach((value, key) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  });

  // Also clear sessionStorage
  try {
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('bullmoney')) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (e) {
    // sessionStorage might not be available
  }
}

/**
 * Enforce storage quota for device tier
 */
function enforceStorageQuota(quota: number): void {
  try {
    let totalSize = 0;
    const items: { key: string; size: number; timestamp: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bullmoney')) {
        const value = localStorage.getItem(key) || '';
        const size = (key.length + value.length) * 2; // UTF-16 = 2 bytes per char
        totalSize += size;

        // Try to extract timestamp from value
        let timestamp = Date.now();
        try {
          const parsed = JSON.parse(value);
          if (parsed.timestamp) timestamp = parsed.timestamp;
          if (parsed.savedAt) timestamp = parsed.savedAt;
        } catch (e) {
          // Not JSON, use current time
        }

        items.push({ key, size, timestamp });
      }
    }

    // If over quota, remove oldest items first
    if (totalSize > quota * 1024) {
      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      let removed = 0;
      for (const item of items) {
        // Don't remove essential keys
        if (
          PRESERVED_KEYS.includes(item.key) ||
          item.key === STORAGE_KEYS.APP_VERSION
        ) {
          continue;
        }

        localStorage.removeItem(item.key);
        removed += item.size;

        // Stop when under quota
        if (totalSize - removed <= quota * 1024) {
          break;
        }
      }

      console.log(
        `[CacheManager] Enforced storage quota: removed ${Math.round(removed / 1024)}KB`
      );
    }
  } catch (e) {
    console.warn('[CacheManager] Failed to enforce storage quota:', e);
  }
}

/**
 * Initialize cache manager - call this on app startup
 * Returns true if cache was cleared (app should reload critical state)
 */
export function initializeCacheManager(): {
  cacheCleared: boolean;
  isFirstVisit: boolean;
  deviceTier: DeviceTier;
  capabilities: DeviceCapabilities;
  isSafari: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      cacheCleared: false,
      isFirstVisit: true,
      deviceTier: 'medium',
      capabilities: detectDeviceCapabilities(),
      isSafari: false,
    };
  }

  // Initialize Safari optimizations early
  const safariInfo = initSafariOptimizations();
  
  // Check for Safari stale build and force reload if needed
  if (safariInfo.isSafari && checkSafariStaleBuild()) {
    console.log('[CacheManager] Safari stale build detected, forcing reload...');
    safariForceReload();
    return {
      cacheCleared: true,
      isFirstVisit: false,
      deviceTier: 'medium',
      capabilities: detectDeviceCapabilities(),
      isSafari: true,
    };
  }

  const status = getCacheStatus();
  const capabilities = detectDeviceCapabilities();
  let cacheCleared = false;

  console.log(
    `[CacheManager] Version check: current=${status.currentVersion}, stored=${status.storedVersion}`
  );
  console.log(`[CacheManager] Device tier: ${capabilities.tier}`);
  if (safariInfo.isSafari) {
    console.log(`[CacheManager] Safari v${safariInfo.safariVersion} detected (iOS: ${safariInfo.iosVersion})`);
  }

  // Handle version mismatch
  if (status.isStale) {
    console.log(
      `[CacheManager] Version update detected: ${status.storedVersion} -> ${status.currentVersion}`
    );

    if (status.requiresFullClear) {
      console.log('[CacheManager] Performing full cache clear...');
      clearAllCaches();
      // Also clear browser caches for Safari
      if (safariInfo.isSafari) {
        clearBrowserCaches();
      }
    } else {
      console.log('[CacheManager] Performing volatile cache clear...');
      clearVolatileStorage();
    }

    cacheCleared = true;
  }

  // First visit - just enforce quota
  const isFirstVisit = !status.storedVersion;
  if (isFirstVisit) {
    console.log('[CacheManager] First visit detected');
  }

  // Update stored version and device info
  try {
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
    localStorage.setItem(STORAGE_KEYS.BUILD_TIMESTAMP, BUILD_TIMESTAMP);
    localStorage.setItem(STORAGE_KEYS.DEVICE_TIER, capabilities.tier);
    localStorage.setItem(
      STORAGE_KEYS.STORAGE_QUOTA,
      capabilities.storageQuota.toString()
    );

    if (cacheCleared) {
      localStorage.setItem(
        STORAGE_KEYS.LAST_CACHE_CLEAR,
        new Date().toISOString()
      );
    }
  } catch (e) {
    console.warn('[CacheManager] Failed to update version info:', e);
  }

  // Enforce storage quota based on device capabilities
  enforceStorageQuota(capabilities.storageQuota);

  return {
    cacheCleared,
    isFirstVisit,
    deviceTier: capabilities.tier,
    capabilities,
    isSafari: safariInfo.isSafari,
  };
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  used: number;
  quota: number;
  items: number;
  deviceTier: DeviceTier;
} {
  if (typeof window === 'undefined') {
    return { used: 0, quota: 2048, items: 0, deviceTier: 'medium' };
  }

  let used = 0;
  let items = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bullmoney')) {
      const value = localStorage.getItem(key) || '';
      used += (key.length + value.length) * 2;
      items++;
    }
  }

  const storedQuota = localStorage.getItem(STORAGE_KEYS.STORAGE_QUOTA);
  const quota = storedQuota
    ? parseInt(storedQuota, 10)
    : detectDeviceCapabilities().storageQuota;

  const deviceTier =
    (localStorage.getItem(STORAGE_KEYS.DEVICE_TIER) as DeviceTier) || 'medium';

  return {
    used: Math.round(used / 1024), // KB
    quota,
    items,
    deviceTier,
  };
}

/**
 * Force clear all caches (for debugging/admin use)
 */
export function forceFullCacheClear(): void {
  if (typeof window === 'undefined') return;

  console.log('[CacheManager] Force clearing all caches...');
  clearAllCaches();

  // Update cache clear timestamp
  try {
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
    localStorage.setItem(
      STORAGE_KEYS.LAST_CACHE_CLEAR,
      new Date().toISOString()
    );
  } catch (e) {
    // Ignore
  }
}

/**
 * Clear browser HTTP cache and service workers
 * Call this when you detect stale assets (404s on chunk files)
 */
export async function clearBrowserCaches(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  let cleared = false;

  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[CacheManager] Unregistered service worker:', registration.scope);
      }
      cleared = true;
    }

    // 2. Clear Cache Storage API (used by service workers)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('[CacheManager] Deleted cache:', cacheName);
      }
      cleared = true;
    }

    console.log('[CacheManager] Browser caches cleared');
  } catch (e) {
    console.warn('[CacheManager] Failed to clear browser caches:', e);
  }

  return cleared;
}

/**
 * Detect if we're getting 404s on Next.js chunks (stale cache)
 * Returns true if a hard reload is needed
 */
export function detectStaleBuild(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if the build ID in the page matches what we expect
  const buildId = (window as any).__NEXT_DATA__?.buildId;
  const storedBuildId = localStorage.getItem('bullmoney_build_id');

  if (storedBuildId && buildId && storedBuildId !== buildId) {
    console.log('[CacheManager] Build ID mismatch detected:', storedBuildId, '->', buildId);
    localStorage.setItem('bullmoney_build_id', buildId);
    return true;
  }

  if (buildId && !storedBuildId) {
    localStorage.setItem('bullmoney_build_id', buildId);
  }

  return false;
}

/**
 * Force a hard reload to get fresh assets
 */
export function forceHardReload(): void {
  if (typeof window === 'undefined') return;

  // Clear caches first
  clearBrowserCaches().then(() => {
    // Force reload bypassing cache
    window.location.reload();
  });
}

// Export for use in hooks
export { APP_VERSION, BUILD_TIMESTAMP };
