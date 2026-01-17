"use client";

import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Advanced scroll optimization hook for iPhone/Instagram performance
 * 
 * Features:
 * - RAF-based throttling (60fps cap)
 * - Viewport visibility tracking
 * - Memory management via state
 * - Passive event listeners
 * - Component lifecycle awareness
 * 
 * Usage:
 * const { isScrolling, scrollDirection, scrollY, registerElement } = useScrollOptimization();
 */

interface ScrollOptimizationConfig {
  throttleMs?: number;
  enableVisibilityTracking?: boolean;
  enableMemoryOptimizations?: boolean;
}

export function useScrollOptimization(config: ScrollOptimizationConfig = {}) {
  const {
    throttleMs = 16.67, // ~60fps
    enableVisibilityTracking = true,
    enableMemoryOptimizations = true,
  } = config;

  // Scroll state
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'idle'>('idle');
  
  // Viewport tracking state
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [offscreenElements, setOffscreenElements] = useState<Set<string>>(new Set());

  // Refs for high-frequency data (no re-renders)
  const lastScrollY = useRef(0);
  const lastThrottleTime = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const elementRefsMap = useRef<Map<string, IntersectionObserver>>(new Map());
  const visibleElementsRef = useRef<Set<string>>(new Set());
  const isScrollingRef = useRef(false);

  // Scroll event handler with RAF throttling
  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      
      // RAF-based throttling: only process if enough time has passed
      if (now - lastThrottleTime.current < throttleMs) {
        return;
      }

      lastThrottleTime.current = now;

      // Use RAF to batch the state update
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Update state only if scroll position changed
        if (currentScrollY !== lastScrollY.current) {
          // Determine scroll direction
          if (currentScrollY > lastScrollY.current) {
            setScrollDirection('down');
          } else if (currentScrollY < lastScrollY.current) {
            setScrollDirection('up');
          }
          
          setScrollY(currentScrollY);
          lastScrollY.current = currentScrollY;
        }

        // Mark as scrolling
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          setIsScrolling(true);
          document.documentElement.classList.add('is-scrolling');
        }

        // Debounce scroll end
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
          setIsScrolling(false);
          setScrollDirection('idle');
          document.documentElement.classList.remove('is-scrolling');
        }, 150); // Detect scroll stop after 150ms of inactivity

        rafRef.current = null;
      });
    };

    // Use passive listener for scroll - critical for mobile performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [throttleMs]);

  // Register element for visibility tracking
  const registerElement = useCallback((elementId: string, element: HTMLElement | null, onVisibilityChange?: (isVisible: boolean) => void) => {
    if (!enableVisibilityTracking || !element) return;

    // Clean up existing observer for this element
    const existingObserver = elementRefsMap.current.get(elementId);
    if (existingObserver) {
      existingObserver.disconnect();
      elementRefsMap.current.delete(elementId);
    }

    // Create intersection observer with optimized options for mobile
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible
            visibleElementsRef.current.add(elementId);
            setVisibleElements(new Set(visibleElementsRef.current));
            setOffscreenElements((prev) => {
              const next = new Set(prev);
              next.delete(elementId);
              return next;
            });
            onVisibilityChange?.(true);
          } else {
            // Element is hidden
            visibleElementsRef.current.delete(elementId);
            setVisibleElements(new Set(visibleElementsRef.current));
            setOffscreenElements((prev) => new Set(prev).add(elementId));
            onVisibilityChange?.(false);
          }
        });
      },
      {
        root: null,
        // Aggressive preload: start loading content before it enters viewport
        rootMargin: '300px 0px 300px 0px', // Adjust for device performance
        threshold: [0, 0.25, 0.75, 1],
      }
    );

    observer.observe(element);
    elementRefsMap.current.set(elementId, observer);

    // Return cleanup function
    return () => {
      observer.disconnect();
      elementRefsMap.current.delete(elementId);
      visibleElementsRef.current.delete(elementId);
    };
  }, [enableVisibilityTracking]);

  // Unregister element
  const unregisterElement = useCallback((elementId: string) => {
    const observer = elementRefsMap.current.get(elementId);
    if (observer) {
      observer.disconnect();
      elementRefsMap.current.delete(elementId);
    }
    visibleElementsRef.current.delete(elementId);
    setVisibleElements(new Set(visibleElementsRef.current));
  }, []);

  // Check if element is visible
  const isElementVisible = useCallback((elementId: string): boolean => {
    return visibleElementsRef.current.has(elementId);
  }, []);

  // Get scroll progress (0-1)
  const scrollProgress = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? window.scrollY / docHeight : 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all observers
      elementRefsMap.current.forEach((observer) => observer.disconnect());
      elementRefsMap.current.clear();
    };
  }, []);

  return {
    // State
    scrollY,
    isScrolling,
    scrollDirection,
    visibleElements,
    offscreenElements,
    
    // Methods
    registerElement,
    unregisterElement,
    isElementVisible,
    scrollProgress,
    
    // Refs for direct access (no re-render)
    scrollYRef: lastScrollY,
    isScrollingRef,
  };
}

/**
 * Simplified hook for just scroll direction detection
 * Lighter weight than useScrollOptimization
 */
export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down' | 'idle'>('idle');
  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY > lastScrollY.current) {
          setDirection('down');
        } else if (currentY < lastScrollY.current) {
          setDirection('up');
        }
        lastScrollY.current = currentY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return direction;
}

/**
 * Hook for throttled scroll with configurable threshold
 * Best for performance-critical scroll handlers
 */
export function useThrottledScrollPosition(throttleMs: number = 16.67) {
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const lastUpdateTime = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();

      // Only update if enough time has passed
      if (now - lastUpdateTime.current >= throttleMs) {
        lastUpdateTime.current = now;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (currentY !== lastScrollY.current) {
            setScrollY(currentY);
            lastScrollY.current = currentY;
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [throttleMs]);

  return scrollY;
}
