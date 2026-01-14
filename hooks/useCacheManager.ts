"use client";

/**
 * useCacheManager Hook
 *
 * React hook for integrating cache management into components.
 * Handles version-based cache invalidation on app startup.
 *
 * Usage:
 * ```tsx
 * // In a root component (e.g., layout or main page)
 * const { isReady, cacheCleared, deviceTier } = useCacheManager();
 *
 * if (!isReady) return <LoadingScreen />;
 * if (cacheCleared) {
 *   // Optionally show a "Welcome back" message or reload state
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initializeCacheManager,
  getCacheStatus,
  getStorageStats,
  forceFullCacheClear,
  APP_VERSION,
  DeviceTier,
  DeviceCapabilities,
  CacheStatus,
} from '@/lib/cacheManager';

export interface UseCacheManagerResult {
  // State
  isReady: boolean;
  cacheCleared: boolean;
  isFirstVisit: boolean;
  deviceTier: DeviceTier;
  capabilities: DeviceCapabilities | null;
  appVersion: string;

  // Storage stats
  storageUsed: number;    // KB
  storageQuota: number;   // KB
  storageItems: number;

  // Actions
  forceClearCache: () => void;
  getStatus: () => CacheStatus;
  refreshStats: () => void;
}

export function useCacheManager(): UseCacheManagerResult {
  const [isReady, setIsReady] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('medium');
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [storageStats, setStorageStats] = useState({ used: 0, quota: 2048, items: 0 });

  // Initialize on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const result = initializeCacheManager();

    setCacheCleared(result.cacheCleared);
    setIsFirstVisit(result.isFirstVisit);
    setDeviceTier(result.deviceTier);
    setCapabilities(result.capabilities);
    setIsReady(true);

    // Get initial storage stats
    const stats = getStorageStats();
    setStorageStats({
      used: stats.used,
      quota: stats.quota,
      items: stats.items,
    });

    // Log initialization
    if (result.cacheCleared) {
      console.log('[useCacheManager] Cache was cleared due to version update');
    }

    // Dispatch custom event for other parts of the app to react
    window.dispatchEvent(
      new CustomEvent('bullmoney-cache-initialized', {
        detail: {
          cacheCleared: result.cacheCleared,
          isFirstVisit: result.isFirstVisit,
          deviceTier: result.deviceTier,
          appVersion: APP_VERSION,
        },
      })
    );
  }, []);

  // Force clear cache action
  const forceClearCache = useCallback(() => {
    forceFullCacheClear();
    setCacheCleared(true);

    // Refresh stats
    const stats = getStorageStats();
    setStorageStats({
      used: stats.used,
      quota: stats.quota,
      items: stats.items,
    });

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent('bullmoney-cache-cleared', {
        detail: { appVersion: APP_VERSION },
      })
    );
  }, []);

  // Get current status
  const getStatus = useCallback(() => {
    return getCacheStatus();
  }, []);

  // Refresh storage stats
  const refreshStats = useCallback(() => {
    const stats = getStorageStats();
    setStorageStats({
      used: stats.used,
      quota: stats.quota,
      items: stats.items,
    });
  }, []);

  return {
    isReady,
    cacheCleared,
    isFirstVisit,
    deviceTier,
    capabilities,
    appVersion: APP_VERSION,
    storageUsed: storageStats.used,
    storageQuota: storageStats.quota,
    storageItems: storageStats.items,
    forceClearCache,
    getStatus,
    refreshStats,
  };
}

/**
 * useDeviceTier Hook
 *
 * Simplified hook that just provides device tier information.
 * Useful for components that only need to know device capabilities.
 */
export function useDeviceTier(): {
  tier: DeviceTier;
  isHighEnd: boolean;
  isLowEnd: boolean;
  isReady: boolean;
} {
  const [tier, setTier] = useState<DeviceTier>('medium');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTier = localStorage.getItem('bullmoney_device_tier') as DeviceTier | null;
    if (storedTier) {
      setTier(storedTier);
    } else {
      // Use cache manager to detect
      const result = initializeCacheManager();
      setTier(result.deviceTier);
    }
    setIsReady(true);
  }, []);

  return {
    tier,
    isHighEnd: tier === 'ultra' || tier === 'high',
    isLowEnd: tier === 'low' || tier === 'minimal',
    isReady,
  };
}

export default useCacheManager;
