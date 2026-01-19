/**
 * Spline Scene Preloader - Optimizes Spline scene load times
 * Preloads scene files and Spline viewer script for faster rendering
 */

const SPLINE_VIEWER_SCRIPT = "https://unpkg.com/@splinetool/viewer@1.12.36/build/spline-viewer.js";

// Track preloaded scenes to avoid duplicate requests
const preloadedScenes = new Set<string>();

/**
 * Preload a Spline scene file
 * Downloads the scene.splinecode file to browser cache
 */
export const preloadSplineScene = (runtimeUrl: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  
  // Avoid duplicate preloads
  if (preloadedScenes.has(runtimeUrl)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = runtimeUrl;
    link.crossOrigin = 'anonymous';
    
    link.onload = () => {
      preloadedScenes.add(runtimeUrl);
      resolve();
    };
    
    link.onerror = () => {
      // Still mark as attempted to avoid repeated failures
      preloadedScenes.add(runtimeUrl);
      resolve();
    };
    
    document.head.appendChild(link);
  });
};

/**
 * Preload multiple Spline scenes
 */
export const preloadSplineScenes = (runtimeUrls: string[]): Promise<void[]> => {
  return Promise.all(runtimeUrls.map(preloadSplineScene));
};

/**
 * Preload the Spline viewer script
 * Loads the JavaScript library required to render Spline scenes
 */
export const preloadSplineViewer = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  
  // Check if already loaded
  if ((window as any).spline !== undefined) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SPLINE_VIEWER_SCRIPT;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = () => {
      // Still resolve to not block app
      resolve();
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Prefetch Spline resources - Quick DNS/connection setup
 */
export const prefetchSplineResources = (): void => {
  if (typeof document === 'undefined') return;

  // DNS Prefetch
  ['spline.design', 'unpkg.com', 'prod.spline.design', 'my.spline.design'].forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `https://${domain}`;
    document.head.appendChild(link);
  });
};

/**
 * Initialize Spline preloading system
 * Call once on app startup
 */
export const initializeSplinePreloader = (sceneUrls: string[]): void => {
  if (typeof window === 'undefined') return;

  // Prefetch DNS records immediately
  prefetchSplineResources();

  // Preload viewer script on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadSplineViewer().catch(() => {});
    });
  } else {
    setTimeout(() => {
      preloadSplineViewer().catch(() => {});
    }, 2000);
  }

  // Preload scene files on idle callback
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadSplineScenes(sceneUrls).catch(() => {});
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      preloadSplineScenes(sceneUrls).catch(() => {});
    }, 3000);
  }
};

/**
 * Quick preload - synchronous prefetch for critical scenes
 */
export const quickPreloadSplineScene = (runtimeUrl: string): void => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = runtimeUrl;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

/**
 * Get Spline viewer script URL
 */
export const getSplineViewerUrl = (): string => {
  return SPLINE_VIEWER_SCRIPT;
};

/**
 * Check if Spline viewer is loaded
 */
export const isSplineViewerLoaded = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window as any).spline !== undefined;
};
