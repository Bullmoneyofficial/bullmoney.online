"use client";

import { useEffect, useState, useRef } from 'react';
import { useDeviceProfile } from './deviceProfile';
import { initServiceWorker, swManager } from './serviceWorker';
import { userStorage, devicePrefs } from './smartStorage';

/**
 * All-in-one hook for smart optimizations
 * Handles service worker, storage, device detection, and preloading
 */
export function useOptimizations(config?: {
  enableServiceWorker?: boolean;
  preloadScenes?: string[];
  criticalScenes?: string[];
}) {
  const deviceProfile = useDeviceProfile();
  const [isReady, setIsReady] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      console.log('[Optimizations] Initializing...');

      // 1. Initialize service worker
      if (config?.enableServiceWorker !== false) {
        const swSuccess = await initServiceWorker(deviceProfile);
        setServiceWorkerReady(swSuccess);

        if (swSuccess) {
          console.log('[Optimizations] Service worker ready');

          // 2. Preload critical scenes
          if (config?.criticalScenes?.length) {
            config.criticalScenes.forEach(scene => {
              swManager.preloadSpline(scene, 'critical');
            });
          }

          // 3. Preload other scenes (lower priority)
          if (config?.preloadScenes?.length) {
            setTimeout(() => {
              config.preloadScenes?.forEach(scene => {
                swManager.preloadSpline(scene, 'normal');
              });
            }, 2000); // Wait 2s before preloading non-critical
          }
        }
      }

      // 4. Save device profile for analytics
      devicePrefs.set('last_device_profile', deviceProfile);
      devicePrefs.set('last_visit', new Date().toISOString());

      setIsReady(true);
      console.log('[Optimizations] Ready!', { deviceProfile, serviceWorkerReady });
    };

    init();
  }, [deviceProfile, config?.enableServiceWorker]);

  return {
    deviceProfile,
    isReady,
    serviceWorkerReady,
    storage: {
      user: userStorage,
      device: devicePrefs
    },
    swManager
  };
}

/**
 * Hook for managing scroll with optimization
 */
export function useOptimizedScroll(containerRef: React.RefObject<HTMLElement>) {
  const [scrollY, setScrollY] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        setScrollY(scrollTop);
        setScrollPercentage(Math.min(Math.max(percentage, 0), 100));
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef]);

  return { scrollY, scrollPercentage };
}

/**
 * Hook for theme persistence with smart storage
 */
export function usePersistedTheme(defaultTheme: string = 'default') {
  const [theme, setThemeState] = useState(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load theme from storage
    const savedTheme = userStorage.get('theme', defaultTheme) as string;
    setThemeState(savedTheme);
    setIsLoaded(true);
  }, [defaultTheme]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    userStorage.set('theme', newTheme);
  };

  return { theme, setTheme, isLoaded };
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferencesState] = useState({
    splineEnabled: true,
    reducedMotion: false,
    volume: 0.7,
    autoplay: false
  });

  useEffect(() => {
    // Load preferences
    const saved = userStorage.get('preferences', preferences) as typeof preferences;
    setPreferencesState(saved);
  }, []);

  const updatePreference = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferencesState(updated);
    userStorage.set('preferences', updated);
  };

  const setPreferences = (newPrefs: Partial<typeof preferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferencesState(updated);
    userStorage.set('preferences', updated);
  };

  return {
    preferences,
    updatePreference,
    setPreferences
  };
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad(options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, options]);

  return { ref: targetRef, isVisible, hasLoaded };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    loadTime: 0,
    firstPaint: 0,
    firstContentfulPaint: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Get load metrics
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

    setMetrics({
      fps: 60, // Will be updated by FPS counter if needed
      loadTime: perfData?.loadEventEnd - perfData?.fetchStart || 0,
      firstPaint: firstPaint?.startTime || 0,
      firstContentfulPaint: firstContentfulPaint?.startTime || 0
    });

    // Optional: FPS monitoring
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime >= lastTime + 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps: currentFPS }));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    const rafId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return metrics;
}

export default useOptimizations;
