/**
 * useVersionedCache Hook
 * 
 * A React hook that provides version-aware caching for components.
 * Automatically clears stale data when app version changes.
 * 
 * Features:
 * - Automatic cache invalidation on version mismatch
 * - Device tier aware storage limits
 * - Safari-specific cache handling
 * - Session-based fresh data detection
 * 
 * Usage:
 * ```tsx
 * const { data, setData, isStale, clearCache } = useVersionedCache('my-component-data');
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCacheContext } from '@/components/CacheManagerProvider';
import { APP_VERSION } from '@/lib/appVersion';

interface VersionedCacheOptions<T> {
  /** Default value if cache is empty */
  defaultValue?: T;
  /** Time to live in milliseconds (0 = no expiry) */
  ttl?: number;
  /** Whether to persist across sessions (localStorage) or just current session (sessionStorage) */
  persist?: boolean;
  /** Custom serializer */
  serialize?: (value: T) => string;
  /** Custom deserializer */
  deserialize?: (value: string) => T;
}

interface VersionedCacheResult<T> {
  data: T | null;
  setData: (value: T) => void;
  clearCache: () => void;
  isStale: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface CacheEntry<T> {
  value: T;
  version: string;
  timestamp: number;
  deviceTier: string;
}

export function useVersionedCache<T = any>(
  key: string,
  options: VersionedCacheOptions<T> = {}
): VersionedCacheResult<T> {
  const {
    defaultValue,
    ttl = 0,
    persist = true,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const { cacheCleared, deviceTier, isReady, isSafari } = useCacheContext();
  const [data, setDataState] = useState<T | null>(defaultValue ?? null);
  const [isStale, setIsStale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const initializedRef = useRef(false);

  const storageKey = `bullmoney_vcache_${key}`;
  const storage = persist ? localStorage : sessionStorage;

  // Load data from storage
  const loadFromStorage = useCallback((): T | null => {
    if (typeof window === 'undefined') return defaultValue ?? null;

    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return defaultValue ?? null;

      const entry: CacheEntry<T> = deserialize(raw);

      // Check version - if different, data is stale
      if (entry.version !== APP_VERSION) {
        console.log(`[useVersionedCache] Cache stale for ${key}: ${entry.version} -> ${APP_VERSION}`);
        setIsStale(true);
        storage.removeItem(storageKey);
        return defaultValue ?? null;
      }

      // Check TTL if set
      if (ttl > 0) {
        const age = Date.now() - entry.timestamp;
        if (age > ttl) {
          console.log(`[useVersionedCache] Cache expired for ${key}: ${age}ms > ${ttl}ms`);
          setIsStale(true);
          storage.removeItem(storageKey);
          return defaultValue ?? null;
        }
      }

      setLastUpdated(new Date(entry.timestamp));
      setIsStale(false);
      return entry.value;
    } catch (e) {
      console.warn(`[useVersionedCache] Failed to load ${key}:`, e);
      storage.removeItem(storageKey);
      return defaultValue ?? null;
    }
  }, [key, storageKey, storage, ttl, defaultValue, deserialize]);

  // Save data to storage
  const saveToStorage = useCallback(
    (value: T) => {
      if (typeof window === 'undefined') return;

      try {
        const entry: CacheEntry<T> = {
          value,
          version: APP_VERSION,
          timestamp: Date.now(),
          deviceTier,
        };

        storage.setItem(storageKey, serialize(entry));
        setLastUpdated(new Date(entry.timestamp));
        setIsStale(false);
      } catch (e) {
        console.warn(`[useVersionedCache] Failed to save ${key}:`, e);
        // Storage might be full - try to clear old entries
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.log(`[useVersionedCache] Storage quota exceeded, clearing old entries...`);
          clearOldEntries();
        }
      }
    },
    [key, storageKey, storage, deviceTier, serialize]
  );

  // Clear old cache entries to make room
  const clearOldEntries = useCallback(() => {
    if (typeof window === 'undefined') return;

    const entries: { key: string; timestamp: number }[] = [];

    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith('bullmoney_vcache_')) {
        try {
          const raw = storage.getItem(k);
          if (raw) {
            const entry = JSON.parse(raw);
            entries.push({ key: k, timestamp: entry.timestamp || 0 });
          }
        } catch (e) {
          // Invalid entry, remove it
          storage.removeItem(k);
        }
      }
    }

    // Sort by age (oldest first) and remove the oldest 50%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length / 2);
    for (let i = 0; i < toRemove; i++) {
      storage.removeItem(entries[i].key);
    }

    console.log(`[useVersionedCache] Cleared ${toRemove} old cache entries`);
  }, [storage]);

  // Set data and persist
  const setData = useCallback(
    (value: T) => {
      setDataState(value);
      saveToStorage(value);
    },
    [saveToStorage]
  );

  // Clear this cache entry
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    storage.removeItem(storageKey);
    setDataState(defaultValue ?? null);
    setIsStale(true);
    setLastUpdated(null);
  }, [storage, storageKey, defaultValue]);

  // Initialize on mount
  useEffect(() => {
    if (initializedRef.current) return;
    if (!isReady) return;

    initializedRef.current = true;

    // If cache was just cleared globally, don't load stale data
    if (cacheCleared) {
      console.log(`[useVersionedCache] Global cache cleared, starting fresh for ${key}`);
      setDataState(defaultValue ?? null);
      setIsStale(true);
      setIsLoading(false);
      return;
    }

    const loadedData = loadFromStorage();
    setDataState(loadedData);
    setIsLoading(false);
  }, [isReady, cacheCleared, loadFromStorage, defaultValue, key]);

  // Listen for cache clear events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCacheClear = () => {
      console.log(`[useVersionedCache] Cache clear event received for ${key}`);
      clearCache();
    };

    window.addEventListener('bullmoney-cache-cleared', handleCacheClear);
    window.addEventListener('bullmoney-cache-force-cleared', handleCacheClear);

    return () => {
      window.removeEventListener('bullmoney-cache-cleared', handleCacheClear);
      window.removeEventListener('bullmoney-cache-force-cleared', handleCacheClear);
    };
  }, [clearCache, key]);

  return {
    data,
    setData,
    clearCache,
    isStale,
    isLoading,
    lastUpdated,
  };
}

/**
 * Simple version-aware localStorage helper
 * Use this for one-off storage operations without the full hook
 */
export function getVersionedItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const storageKey = `bullmoney_vcache_${key}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    if (entry.version !== APP_VERSION) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return entry.value;
  } catch (e) {
    return null;
  }
}

export function setVersionedItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = `bullmoney_vcache_${key}`;
    const entry: CacheEntry<T> = {
      value,
      version: APP_VERSION,
      timestamp: Date.now(),
      deviceTier: 'unknown',
    };
    localStorage.setItem(storageKey, JSON.stringify(entry));
  } catch (e) {
    console.warn(`[VersionedCache] Failed to set ${key}:`, e);
  }
}

export function removeVersionedItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`bullmoney_vcache_${key}`);
}

export default useVersionedCache;
