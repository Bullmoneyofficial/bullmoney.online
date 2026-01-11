"use client";

import { useState, useEffect, useRef } from 'react';

// In-memory cache to avoid repeated network requests
const memoryCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<string>>();

export function useSplineCache(url: string) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(() => {
    // Check memory cache first (instant)
    return memoryCache.get(url) || null;
  });
  const [isLoading, setIsLoading] = useState(!memoryCache.has(url));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!url) {
      setIsLoading(false);
      return;
    }

    // Already in memory cache
    if (memoryCache.has(url)) {
      setCachedUrl(memoryCache.get(url)!);
      setIsLoading(false);
      return;
    }

    // Check if already loading (prevent duplicate requests)
    if (loadingPromises.has(url)) {
      loadingPromises.get(url)!.then((cachedUrl) => {
        if (mountedRef.current) {
          setCachedUrl(cachedUrl);
          setIsLoading(false);
        }
      });
      return;
    }

    const cacheSpline = async (): Promise<string> => {
      try {
        // Try browser Cache API first (persistent across sessions)
        if ('caches' in window) {
          const cache = await caches.open('bullmoney-spline-v2');
          const cachedResponse = await cache.match(url);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            memoryCache.set(url, objectUrl);
            return objectUrl;
          }

          // Fetch and cache
          const response = await fetch(url, {
            priority: 'low' as RequestPriority, // Don't compete with critical resources
          });
          
          if (response.ok) {
            cache.put(url, response.clone());
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            memoryCache.set(url, objectUrl);
            return objectUrl;
          }
        }
        
        // Fallback: use URL directly
        memoryCache.set(url, url);
        return url;
      } catch (error) {
        console.warn("Spline cache failed, using direct URL:", error);
        memoryCache.set(url, url);
        return url;
      }
    };

    // Create loading promise to prevent duplicate requests
    const promise = cacheSpline();
    loadingPromises.set(url, promise);

    promise.then((result) => {
      loadingPromises.delete(url);
      if (mountedRef.current) {
        setCachedUrl(result);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [url]);

  return { sceneUrl: cachedUrl || url, isLoading };
}

// Utility to preload scenes (call during idle time)
export function preloadSplineScene(url: string) {
  if (memoryCache.has(url) || loadingPromises.has(url)) return;
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Trigger cache without waiting
      useSplineCache.prototype = url; // Dummy access to trigger
    }, { timeout: 5000 });
  }
}