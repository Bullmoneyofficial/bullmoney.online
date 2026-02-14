/**
 * ✅ HYDRATION OPTIMIZATION HOOKS
 * 
 * These hooks help defer non-critical work to after hydration completes,
 * reducing Time to Interactive (TTI) and improving Core Web Vitals.
 */

import { useState, useEffect, useCallback, useRef, startTransition, useDeferredValue } from 'react';

// Track global hydration state
let hydrationComplete = false;
const hydrationListeners = new Set<() => void>();

// Call this after hydration completes (e.g., in a root useEffect)
export const markHydrationComplete = () => {
  hydrationComplete = true;
  hydrationListeners.forEach(listener => listener());
  hydrationListeners.clear();
};

/**
 * Returns true only after React hydration is complete.
 * Use this to defer rendering of non-critical content.
 */
export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(hydrationComplete);

  useEffect(() => {
    if (hydrationComplete) {
      setIsHydrated(true);
      return;
    }

    const listener = () => setIsHydrated(true);
    hydrationListeners.add(listener);

    // Also set on mount if we're client-side
    setIsHydrated(true);
    markHydrationComplete();

    return () => {
      hydrationListeners.delete(listener);
    };
  }, []);

  return isHydrated;
}

/**
 * Defers a value until after hydration, preventing hydration mismatches
 * and reducing initial JS execution time.
 */
export function useHydratedValue<T>(serverValue: T, clientValue: T): T {
  const isHydrated = useHydrated();
  return isHydrated ? clientValue : serverValue;
}

/**
 * Returns a function that batches state updates using React 18's startTransition,
 * marking them as non-urgent so they don't block user interactions.
 */
export function useDeferredUpdate<T>(
  setter: React.Dispatch<React.SetStateAction<T>>
): (value: T | ((prev: T) => T)) => void {
  return useCallback(
    (value: T | ((prev: T) => T)) => {
      startTransition(() => {
        setter(value);
      });
    },
    [setter]
  );
}

/**
 * Similar to useState but defers updates using startTransition.
 * Use for state that updates frequently but doesn't need immediate visual feedback.
 */
export function useDeferredState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);
  const deferredSetter = useDeferredUpdate(setState);
  return [state, deferredSetter];
}

/**
 * Combines useDeferredValue with a debounce for search/filter inputs.
 * This provides smooth typing while deferring expensive re-renders.
 */
export function useSearchOptimized(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const deferredValue = useDeferredValue(value);
  const isPending = value !== deferredValue;

  return {
    value,
    deferredValue,
    isPending,
    onChange: setValue,
  };
}

/**
 * Delays expensive computation until after hydration and idle time.
 * Perfect for analytics, prefetching, or background tasks.
 */
export function useIdleCallback(
  callback: () => void,
  options: { timeout?: number; enabled?: boolean } = {}
) {
  const { timeout = 2000, enabled = true } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const execute = () => {
      if (!cancelled) {
        callbackRef.current();
      }
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(execute, { timeout });
      return () => {
        cancelled = true;
        (window as any).cancelIdleCallback(id);
      };
    } else {
      const id = setTimeout(execute, timeout);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }
  }, [enabled, timeout]);
}

/**
 * Progressive hydration wrapper - renders children only after conditions are met.
 * Use for below-the-fold content or heavy components.
 */
export function useProgressiveHydration(options: {
  delay?: number;
  whenVisible?: boolean;
  whenIdle?: boolean;
} = {}) {
  const { delay = 0, whenVisible = false, whenIdle = false } = options;
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const enable = () => {
      if (!cancelled) {
        startTransition(() => {
          setShouldRender(true);
        });
      }
    };

    // Delay-based activation
    if (delay > 0 && !whenVisible && !whenIdle) {
      const timeout = setTimeout(enable, delay);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }

    // Idle-based activation
    if (whenIdle) {
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(enable, { timeout: delay || 2000 });
        return () => {
          cancelled = true;
          (window as any).cancelIdleCallback(id);
        };
      } else {
        const timeout = setTimeout(enable, delay || 100);
        return () => {
          cancelled = true;
          clearTimeout(timeout);
        };
      }
    }

    // Intersection observer for whenVisible
    if (whenVisible && ref.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            enable();
            observer.disconnect();
          }
        },
        { rootMargin: '200px' }
      );
      observer.observe(ref.current);
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }

    // Default: enable immediately
    enable();
  }, [delay, whenVisible, whenIdle]);

  return { shouldRender, ref };
}

/**
 * Batch multiple async operations and execute them during idle time.
 * Useful for prefetching resources without blocking the main thread.
 */
export function useBatchedIdleWork() {
  const queueRef = useRef<Array<() => Promise<void> | void>>([]);
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    const processNext = () => {
      const task = queueRef.current.shift();
      if (!task) {
        processingRef.current = false;
        return;
      }

      const runTask = async () => {
        try {
          await task();
        } catch (e) {
          console.warn('[BatchedIdleWork] Task failed:', e);
        }

        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(processNext, { timeout: 1000 });
        } else {
          setTimeout(processNext, 16);
        }
      };

      runTask();
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(processNext, { timeout: 1000 });
    } else {
      setTimeout(processNext, 16);
    }
  }, []);

  const addTask = useCallback(
    (task: () => Promise<void> | void) => {
      queueRef.current.push(task);
      processQueue();
    },
    [processQueue]
  );

  return { addTask };
}

/**
 * Measure and report hydration time for debugging.
 * Only logs in development mode.
 */
export function useHydrationTiming(componentName: string) {
  const startTime = useRef(typeof performance !== 'undefined' ? performance.now() : 0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      if (duration > 50) {
        console.log(`[Hydration] ${componentName}: ${duration.toFixed(2)}ms`);
      }
    }
  }, [componentName]);
}

/**
 * Preload critical resources during idle time.
 * Returns a function to trigger preloading.
 */
export function useResourcePreloader() {
  const preloadedRef = useRef(new Set<string>());

  const preload = useCallback((resources: Array<{ href: string; as: string; crossOrigin?: boolean }>) => {
    resources.forEach(({ href, as, crossOrigin }) => {
      if (preloadedRef.current.has(href)) return;
      preloadedRef.current.add(href);

      const link = document.createElement('link');
      link.rel = as === 'document' ? 'prefetch' : 'preload';
      link.as = as;
      link.href = href;
      if (crossOrigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, []);

  return { preload };
}
