"use client";

import { useRef, useCallback, useEffect } from 'react';

/**
 * High-Performance RAF Hook - 120Hz Optimized
 * 
 * This hook provides a requestAnimationFrame loop that:
 * 1. Automatically syncs to display refresh rate
 * 2. Respects frame budget
 * 3. Provides delta time for smooth animations
 * 4. Cleans up properly on unmount
 */

interface RAFCallbackParams {
  time: number;          // Current timestamp from RAF
  delta: number;         // Time since last frame (ms)
  frameCount: number;    // Total frames rendered
}

type RAFCallback = (params: RAFCallbackParams) => void;

export function useRAF(callback: RAFCallback, active: boolean = true) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const callbackRef = useRef<RAFCallback>(callback);

  // Keep callback ref up to date without causing re-subscribe
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;

    const animate = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16.67;
      lastTimeRef.current = time;
      frameCountRef.current++;

      callbackRef.current({
        time,
        delta,
        frameCount: frameCountRef.current,
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  return { stop };
}

/**
 * Throttled Scroll Handler - For 120Hz scroll effects
 * 
 * Uses passive event listener and throttles to RAF for smooth performance
 */
export function useThrottledScroll(
  callback: (scrollY: number, direction: 'up' | 'down') => void,
  active: boolean = true
) {
  const lastScrollY = useRef(0);
  const rafPending = useRef(false);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const handleScroll = () => {
      if (rafPending.current) return;
      rafPending.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const direction = currentY > lastScrollY.current ? 'down' : 'up';
        
        callback(currentY, direction);
        
        lastScrollY.current = currentY;
        rafPending.current = false;
      });
    };

    // CRITICAL: Use passive listener for 120Hz scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [callback, active]);
}

/**
 * Throttled Resize Handler - Debounced for performance
 */
export function useThrottledResize(
  callback: (width: number, height: number) => void,
  delay: number = 100
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        callback(window.innerWidth, window.innerHeight);
      }, delay);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [callback, delay]);
}

/**
 * Direct DOM Updater - For zero-latency price updates
 * 
 * Returns a function that updates DOM elements directly without React state
 */
export function useDOMUpdater<T>(
  selector: string,
  formatter: (value: T) => string
) {
  const elementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      elementRef.current = document.querySelector(selector);
    }
  }, [selector]);

  const update = useCallback((value: T) => {
    if (elementRef.current) {
      elementRef.current.textContent = formatter(value);
    }
  }, [formatter]);

  return update;
}

/**
 * Intersection Observer Hook - For visibility-based optimization
 * 
 * Returns isVisible state and ref to attach to element
 */
export function useVisibility(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(false);
  
  // Use callback ref pattern for proper cleanup
  const setRef = useCallback((element: Element | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (element) {
      observerRef.current = new IntersectionObserver(([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      }, {
        rootMargin: '100px',
        threshold: 0,
        ...options,
      });
      
      observerRef.current.observe(element);
    }
    
    elementRef.current = element;
  }, [options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [setRef, isVisibleRef.current];
}
