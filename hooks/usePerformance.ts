"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

/**
 * Debounce hook - prevents excessive function calls
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook - limits function calls to once per interval
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastRan.current);

      if (remaining <= 0) {
        callback(...args);
        lastRan.current = now;
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
          timeoutRef.current = null;
        }, remaining);
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Optimized resize observer with debouncing
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  callback: (entry: ResizeObserverEntry) => void,
  delay: number = 100
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (entries[0]) {
          callbackRef.current(entries[0]);
        }
      }, delay);
    });

    observer.observe(element);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [ref, delay]);
}

/**
 * Intersection observer with lazy loading support
 */
export function useLazyLoad(
  options: IntersectionObserverInit = { rootMargin: '200px', threshold: 0 }
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasLoaded) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        setHasLoaded(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options, hasLoaded]);

  return { ref, isVisible, hasLoaded };
}

/**
 * RAF-based animation frame hook for smooth animations
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, active: boolean = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [active]);
}

/**
 * Detect if device prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Detect device capabilities for adaptive rendering
 */
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isLowEnd: false,
    isMobile: false,
    hasTouch: false,
    connectionSpeed: 'fast' as 'slow' | 'medium' | 'fast',
    deviceMemory: 8,
    hardwareConcurrency: 4,
  });

  useEffect(() => {
    const nav = navigator as any;
    
    // Device detection
    const isMobile = window.innerWidth < 768;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const deviceMemory = nav.deviceMemory || 4;
    const hardwareConcurrency = nav.hardwareConcurrency || 4;
    
    // Connection speed
    let connectionSpeed: 'slow' | 'medium' | 'fast' = 'fast';
    if (nav.connection) {
      const effectiveType = nav.connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        connectionSpeed = 'slow';
      } else if (effectiveType === '3g') {
        connectionSpeed = 'medium';
      }
    }
    
    // Low-end device detection
    const isLowEnd = deviceMemory < 4 || hardwareConcurrency < 4 || connectionSpeed === 'slow';
    
    setCapabilities({
      isLowEnd,
      isMobile,
      hasTouch,
      connectionSpeed,
      deviceMemory,
      hardwareConcurrency,
    });
  }, []);

  return capabilities;
}

/**
 * Optimized scroll listener with passive events
 */
export function useScrollPosition(throttleMs: number = 100) {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollPosition = () => {
      const currentScrollY = window.scrollY;
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [throttleMs]);

  return { scrollY, scrollDirection };
}

/**
 * Memoized stable callback that doesn't cause re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Idle callback for non-critical operations
 */
export function useIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(callback, options);
      return () => (window as any).cancelIdleCallback(id);
    } else {
      // Fallback for Safari
      const id = setTimeout(callback, 1);
      return () => clearTimeout(id);
    }
  }, [callback, options]);
}
