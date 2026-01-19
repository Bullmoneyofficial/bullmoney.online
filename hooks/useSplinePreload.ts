/**
 * useSplinePreload - Hook to manage Spline scene preloading
 * Optimizes Spline 3D scene load times
 */

import { useEffect, useCallback } from 'react';
import { preloadSplineScene, preloadSplineViewer, prefetchSplineResources, isSplineViewerLoaded } from '@/lib/SplinePreloader';

interface UseSplinePreloadOptions {
  sceneUrls?: string[];
  priority?: 'high' | 'medium' | 'low';
  delay?: number;
}

export const useSplinePreload = (options: UseSplinePreloadOptions = {}) => {
  const {
    sceneUrls = [],
    priority = 'medium',
    delay = 0,
  } = options;

  // Preload scenes
  useEffect(() => {
    const preload = async () => {
      // Prefetch DNS immediately
      prefetchSplineResources();

      // Preload viewer script
      if (!isSplineViewerLoaded()) {
        await preloadSplineViewer();
      }

      // Preload scenes based on priority
      if (sceneUrls.length > 0) {
        const urls = priority === 'high'
          ? sceneUrls // Load all immediately
          : priority === 'medium'
          ? sceneUrls.slice(0, 2) // Load first 2 only
          : sceneUrls.slice(0, 1); // Load first one only

        await Promise.all(
          urls.map(url => preloadSplineScene(url).catch(() => {}))
        );
      }
    };

    if (delay > 0) {
      const timer = setTimeout(preload, delay);
      return () => clearTimeout(timer);
    } else {
      preload();
    }
  }, [sceneUrls, priority, delay]);

  // Return preload function for manual triggering
  const manualPreload = useCallback(
    (url: string) => preloadSplineScene(url),
    []
  );

  return { preload: manualPreload };
};

/**
 * Hook to preload a single Spline scene
 */
export const useSplineScenePreload = (runtimeUrl?: string, enabled = true) => {
  useEffect(() => {
    if (!enabled || !runtimeUrl) return;

    preloadSplineScene(runtimeUrl).catch(() => {});
  }, [runtimeUrl, enabled]);
};

/**
 * Hook to ensure Spline viewer is loaded
 */
export const useEnsureSplineViewer = () => {
  useEffect(() => {
    if (!isSplineViewerLoaded()) {
      preloadSplineViewer().catch(() => {});
    }
  }, []);
};
