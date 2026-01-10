"use client";

import { useState, useEffect } from 'react';

export function useSplineCache(url: string) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let localUrl: string | null = null; // We use a local var to track for cleanup

    const cacheSpline = async () => {
      if (!url) {
        setIsLoading(false);
        return;
      }

      try {
        const cache = await caches.open('bullmoney-spline-assets-v1');
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          if (active) {
            const objectUrl = URL.createObjectURL(blob);
            localUrl = objectUrl; // Track for cleanup
            setCachedUrl(objectUrl);
            setIsLoading(false);
          }
        } else {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Network response was not ok');
          
          cache.put(url, response.clone());
          
          const blob = await response.blob();
          if (active) {
            const objectUrl = URL.createObjectURL(blob);
            localUrl = objectUrl; // Track for cleanup
            setCachedUrl(objectUrl);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Spline caching failed, falling back to network url:", error);
        if (active) {
          setCachedUrl(url);
          setIsLoading(false);
        }
      }
    };

    cacheSpline();

    // Cleanup to prevent memory leaks when component unmounts or url changes
    return () => {
      active = false;
      if (localUrl && localUrl.startsWith('blob:')) {
         URL.revokeObjectURL(localUrl);
      }
    };
  }, [url]);

  return { sceneUrl: cachedUrl, isLoading };
}