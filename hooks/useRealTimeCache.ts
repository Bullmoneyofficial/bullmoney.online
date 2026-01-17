"use client";

import { useState, useEffect, useRef } from 'react';

interface CacheStats {
  usage: number; // MB
  quota: number; // MB
  percentage: number; // 0-100
  updateTime: number;
}

/**
 * Hook for real-time app cache usage monitoring
 * Tracks IndexedDB, Service Worker, and other app storage
 */
export function useRealTimeCache(): CacheStats {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    usage: 0,
    quota: 0,
    percentage: 0,
    updateTime: Date.now(),
  });

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateCache = async () => {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const quota = estimate.quota || 0;
          const usage = estimate.usage || 0;

          const usageMB = Math.round((usage / 1024 / 1024) * 100) / 100;
          const quotaMB = Math.round((quota / 1024 / 1024) * 100) / 100;
          const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

          setCacheStats({
            usage: usageMB,
            quota: quotaMB,
            percentage,
            updateTime: Date.now(),
          });
        }
      } catch (error) {
        console.warn('[useRealTimeCache] Cache detection failed:', error);
      }
    };

    // Initial update
    updateCache();

    // Update every 1 second for real-time tracking
    updateIntervalRef.current = setInterval(updateCache, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return cacheStats;
}
