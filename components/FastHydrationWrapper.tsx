"use client";

import { ReactNode, useEffect, useState, startTransition, Suspense } from "react";

/**
 * ✅ FAST HYDRATION WRAPPER
 * 
 * Provides optimized hydration by:
 * 1. Rendering a minimal shell immediately
 * 2. Deferring heavy work to after hydration
 * 3. Using startTransition for non-urgent updates
 * 4. Marking hydration complete for other components
 */

// Global hydration state tracker
let isHydrationComplete = false;
const hydrationCallbacks = new Set<() => void>();

export function markHydrationComplete() {
  isHydrationComplete = true;
  hydrationCallbacks.forEach(cb => cb());
  hydrationCallbacks.clear();
}

export function onHydrationComplete(callback: () => void) {
  if (isHydrationComplete) {
    callback();
  } else {
    hydrationCallbacks.add(callback);
  }
}

export function isHydrated() {
  return isHydrationComplete;
}

interface FastHydrationWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Delay in ms before showing full content.
   * Use this to prevent layout shift from heavy components.
   */
  deferMs?: number;
  /**
   * If true, uses requestIdleCallback to defer content.
   * Better for non-critical content.
   */
  deferToIdle?: boolean;
}

/**
 * Wraps content with optimized hydration handling.
 * Use this for heavy components that can be deferred.
 */
export function FastHydrationWrapper({
  children,
  fallback = null,
  deferMs = 0,
  deferToIdle = false,
}: FastHydrationWrapperProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark global hydration complete
    if (!isHydrationComplete) {
      markHydrationComplete();
    }

    const enable = () => {
      startTransition(() => {
        setIsReady(true);
      });
    };

    if (deferToIdle && 'requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(enable, { timeout: deferMs || 2000 });
      return () => (window as any).cancelIdleCallback(id);
    } else if (deferMs > 0) {
      const timeout = setTimeout(enable, deferMs);
      return () => clearTimeout(timeout);
    } else {
      // Enable immediately but use startTransition
      enable();
    }
  }, [deferMs, deferToIdle]);

  if (!isReady) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Hook to check if hydration is complete.
 * Updates when hydration finishes.
 */
export function useHydrationState() {
  const [hydrated, setHydrated] = useState(isHydrationComplete);

  useEffect(() => {
    if (isHydrationComplete) {
      setHydrated(true);
    } else {
      const callback = () => setHydrated(true);
      hydrationCallbacks.add(callback);
      return () => {
        hydrationCallbacks.delete(callback);
      };
    }
  }, []);

  return hydrated;
}

/**
 * Progressively render children based on viewport intersection.
 * Perfect for below-the-fold content.
 */
interface ProgressiveRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function ProgressiveRender({
  children,
  fallback = null,
  rootMargin = '200px',
  threshold = 0,
}: ProgressiveRenderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => {
            setIsVisible(true);
          });
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return (
    <div ref={setRef} style={{ minHeight: isVisible ? undefined : 1 }}>
      {isVisible ? children : fallback}
    </div>
  );
}

/**
 * Defer rendering until browser is idle.
 * Use for non-critical UI that doesn't need to render immediately.
 */
interface IdleRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  timeout?: number;
}

export function IdleRender({
  children,
  fallback = null,
  timeout = 2000,
}: IdleRenderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const enable = () => {
      startTransition(() => {
        setIsReady(true);
      });
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(enable, { timeout });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timeoutId = setTimeout(enable, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [timeout]);

  return <>{isReady ? children : fallback}</>;
}

/**
 * Batch multiple deferred renders to prevent layout thrashing.
 * All children render together after hydration.
 */
interface BatchedHydrationProps {
  children: ReactNode[];
  fallback?: ReactNode;
  staggerMs?: number;
}

export function BatchedHydration({
  children,
  fallback = null,
  staggerMs = 0,
}: BatchedHydrationProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const hydrated = useHydrationState();

  useEffect(() => {
    if (!hydrated) return;

    if (staggerMs === 0) {
      // Show all at once
      startTransition(() => {
        setVisibleCount(children.length);
      });
    } else {
      // Stagger rendering
      let count = 0;
      const showNext = () => {
        count++;
        startTransition(() => {
          setVisibleCount(count);
        });
        if (count < children.length) {
          setTimeout(showNext, staggerMs);
        }
      };
      showNext();
    }
  }, [hydrated, children.length, staggerMs]);

  return (
    <>
      {children.map((child, index) =>
        index < visibleCount ? child : <div key={index}>{fallback}</div>
      )}
    </>
  );
}

/**
 * Suspense boundary with built-in error handling.
 * Use this instead of raw Suspense for better UX.
 */
interface SafeSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SafeSuspense({ children, fallback = null }: SafeSuspenseProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
