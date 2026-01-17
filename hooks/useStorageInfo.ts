"use client";

import { useState, useEffect } from 'react';

interface StorageStats {
  total: number; // GB
  available: number; // GB
  used: number; // GB
  percentage: number; // 0-100
  type: string; // SSD, HDD, etc.
  cache: number; // MB - App cache usage
  quota: number; // MB - Cache quota
  loading: boolean;
}

/**
 * Hook for detecting storage space
 */
export function useStorageInfo(): StorageStats {
  const [storageStats, setStorageStats] = useState<StorageStats>({
    total: 64,
    available: 32,
    used: 32,
    percentage: 50,
    type: 'Detecting...',
    cache: 0,
    quota: 0,
    loading: true,
  });

  useEffect(() => {
    const detectStorage = async () => {
      try {
        // Try Storage API
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const quota = estimate.quota || 0;
          const usage = estimate.usage || 0;

          // Estimate total storage (quota is typically a portion of free space)
          const estimatedTotal = Math.round((quota / 0.6) / 1024 / 1024 / 1024);
          const available = Math.round((quota - usage) / 1024 / 1024 / 1024);
          const used = Math.round(usage / 1024 / 1024 / 1024);
          const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

          const cacheUsageMB = Math.round((usage / 1024 / 1024) * 100) / 100;
          const cacheQuotaMB = Math.round((quota / 1024 / 1024) * 100) / 100;

          // Detect storage type
          let type = 'Storage';
          const totalGB = Math.max(estimatedTotal, 64);
          if (totalGB >= 512) {
            type = 'NVMe SSD';
          } else if (totalGB >= 256) {
            type = 'SSD';
          } else if (totalGB >= 128) {
            type = 'SSD/Flash';
          }

          setStorageStats({
            total: Math.max(totalGB, 64),
            available: Math.max(available, 1),
            used: Math.max(used, 1),
            percentage,
            type,
            cache: cacheUsageMB,
            quota: cacheQuotaMB,
            loading: false,
          });
        } else {
          setStorageStats(prev => ({
            ...prev,
            type: 'API Unavailable',
            loading: false,
          }));
        }
      } catch (error) {
        console.warn('[useStorageInfo] Storage detection failed:', error);
        setStorageStats(prev => ({
          ...prev,
          type: 'Error detecting',
          loading: false,
        }));
      }
    };

    detectStorage();
  }, []);

  return storageStats;
}
