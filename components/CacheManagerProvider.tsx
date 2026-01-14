"use client";

/**
 * CacheManagerProvider
 *
 * Client-side wrapper that initializes the cache manager on app startup.
 * Handles version-based cache invalidation to prevent stale UI issues.
 *
 * Features:
 * - Runs cache invalidation check on first render
 * - Exposes device tier through context
 * - Dispatches events for cache status changes
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  initializeCacheManager,
  getCacheStatus,
  getStorageStats,
  forceFullCacheClear,
  clearBrowserCaches,
  detectStaleBuild,
  APP_VERSION,
  DeviceTier,
  DeviceCapabilities,
} from '@/lib/cacheManager';

interface CacheManagerContextValue {
  isReady: boolean;
  cacheCleared: boolean;
  isFirstVisit: boolean;
  deviceTier: DeviceTier;
  capabilities: DeviceCapabilities | null;
  appVersion: string;
  storageUsed: number;
  storageQuota: number;
  isSafari: boolean;
  forceClearCache: () => void;
}

const CacheManagerContext = createContext<CacheManagerContextValue>({
  isReady: false,
  cacheCleared: false,
  isFirstVisit: false,
  deviceTier: 'medium',
  capabilities: null,
  appVersion: APP_VERSION,
  storageUsed: 0,
  storageQuota: 2048,
  isSafari: false,
  forceClearCache: () => {},
});

export const useCacheContext = () => useContext(CacheManagerContext);

interface CacheManagerProviderProps {
  children: ReactNode;
}

export function CacheManagerProvider({ children }: CacheManagerProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('medium');
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [storageStats, setStorageStats] = useState({ used: 0, quota: 2048 });
  const [isSafari, setIsSafari] = useState(false);

  // Initialize cache manager on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for stale build first (mismatched chunk files)
    const isStale = detectStaleBuild();
    if (isStale) {
      console.log('[CacheManagerProvider] Stale build detected - clearing browser caches...');
      clearBrowserCaches().then(() => {
        console.log('[CacheManagerProvider] Browser caches cleared, reloading...');
        // Force reload to get fresh assets
        window.location.reload();
      });
      return; // Don't continue initialization, we're reloading
    }

    // Run initialization
    const result = initializeCacheManager();

    setCacheCleared(result.cacheCleared);
    setIsFirstVisit(result.isFirstVisit);
    setDeviceTier(result.deviceTier);
    setCapabilities(result.capabilities);
    setIsSafari(result.isSafari || false);

    // Get storage stats
    const stats = getStorageStats();
    setStorageStats({ used: stats.used, quota: stats.quota });

    // Mark as ready
    setIsReady(true);

    // Log status
    console.log(`[CacheManagerProvider] Initialized v${APP_VERSION}`);
    console.log(`[CacheManagerProvider] Device: ${result.deviceTier}, Storage: ${stats.used}/${stats.quota}KB`);

    if (result.cacheCleared) {
      console.log('[CacheManagerProvider] Cache was cleared - fresh state');

      // Dispatch event for components that need to know
      window.dispatchEvent(new CustomEvent('bullmoney-cache-cleared', {
        detail: { appVersion: APP_VERSION, deviceTier: result.deviceTier }
      }));
    }

    // Set CSS custom properties for device tier
    const root = document.documentElement;
    root.setAttribute('data-device-tier', result.deviceTier);
    root.style.setProperty('--device-tier', result.deviceTier);

    // Add device tier class for CSS targeting
    root.classList.remove('device-ultra', 'device-high', 'device-medium', 'device-low', 'device-minimal');
    root.classList.add(`device-${result.deviceTier}`);

    // Listen for chunk load errors (404s on JS files)
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message?.includes('Loading chunk') || event.message?.includes('ChunkLoadError')) {
        console.error('[CacheManagerProvider] Chunk load error detected, clearing caches...');
        clearBrowserCaches().then(() => {
          window.location.reload();
        });
      }
    };

    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);

  }, []);

  // Force clear cache action
  const forceClearCache = useCallback(() => {
    forceFullCacheClear();
    setCacheCleared(true);

    const stats = getStorageStats();
    setStorageStats({ used: stats.used, quota: stats.quota });

    // Dispatch event
    window.dispatchEvent(new CustomEvent('bullmoney-cache-force-cleared'));
  }, []);

  const value: CacheManagerContextValue = {
    isReady,
    cacheCleared,
    isFirstVisit,
    deviceTier,
    capabilities,
    appVersion: APP_VERSION,
    storageUsed: storageStats.used,
    storageQuota: storageStats.quota,
    isSafari,
    forceClearCache,
  };

  return (
    <CacheManagerContext.Provider value={value}>
      {children}
    </CacheManagerContext.Provider>
  );
}

/**
 * useDeviceTier Hook
 *
 * Simplified hook for components that only need device tier info.
 */
export function useDeviceTier(): {
  tier: DeviceTier;
  isHighEnd: boolean;
  isLowEnd: boolean;
} {
  const { deviceTier } = useCacheContext();

  return {
    tier: deviceTier,
    isHighEnd: deviceTier === 'ultra' || deviceTier === 'high',
    isLowEnd: deviceTier === 'low' || deviceTier === 'minimal',
  };
}

export default CacheManagerProvider;
