"use client";

import { useEffect, useRef, useCallback, createContext, useContext, ReactNode } from 'react';
import Lenis from 'lenis';
import { usePerformanceStore } from '@/stores/performanceStore';

// ============================================================================
// LENIS SMOOTH SCROLL CONTEXT - Luxury 120Hz Scrolling
// ============================================================================

interface LenisContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => void;
  stop: () => void;
  start: () => void;
}

const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useLenis = () => useContext(LenisContext);

interface LenisProviderProps {
  children: ReactNode;
  options?: {
    lerp?: number;
    duration?: number;
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
    infinite?: boolean;
  };
}

/**
 * Lenis Smooth Scroll Provider
 * 
 * Provides butter-smooth scrolling optimized for 120Hz displays
 * Uses RAF for perfect frame synchronization
 * 
 * IMPORTANT: If scrolling feels blocked, check that Lenis is not
 * interfering with native scroll. We use syncTouch: false on mobile.
 */
export function LenisProvider({ children, options = {} }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  
  const { updateScroll, refreshRate, isProMotion } = usePerformanceStore();

  // Initialize Lenis with 120Hz optimizations
  useEffect(() => {
    // Skip Lenis on mobile to avoid scroll blocking
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      console.log('[Lenis] Disabled on mobile for native scroll performance');
      return;
    }
    
    // Detect refresh rate for optimal lerp
    const lerp = isProMotion ? 0.06 : 0.08; // Lower lerp = smoother
    
    lenisRef.current = new Lenis({
      lerp: options.lerp ?? lerp,
      duration: options.duration ?? 1.0, // Faster for 120Hz
      smoothWheel: options.smoothWheel ?? true,
      wheelMultiplier: options.wheelMultiplier ?? 0.8, // Less aggressive
      touchMultiplier: options.touchMultiplier ?? 1.5,
      infinite: options.infinite ?? false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      // CRITICAL: Don't override native touch scrolling
      syncTouch: false,
      // Don't sync touch to smooth - use native
      syncTouchLerp: 1,
    });

    // Track scroll metrics for performance monitoring
    let lastScrollY = 0;
    let lastTime = performance.now();
    let scrollDirection: 'up' | 'down' | 'idle' = 'idle';

    lenisRef.current.on('scroll', ({ scroll, limit, velocity, direction, progress }: any) => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      
      // Calculate velocity
      const scrollVelocity = deltaTime > 0 
        ? Math.abs(scroll - lastScrollY) / deltaTime * 1000 
        : 0;
      
      // Determine direction
      if (scroll > lastScrollY + 1) scrollDirection = 'down';
      else if (scroll < lastScrollY - 1) scrollDirection = 'up';
      
      // Update store with scroll metrics (transient update)
      updateScroll({
        scrollY: scroll,
        scrollVelocity,
        scrollDirection,
        isScrolling: Math.abs(velocity) > 0.01,
        scrollProgress: progress,
      });

      lastScrollY = scroll;
      lastTime = now;
    });

    // RAF loop synchronized with display refresh rate
    const animate = (time: number) => {
      lenisRef.current?.raf(time);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [options, updateScroll, isProMotion]);

  // Scroll to target with smooth animation
  const scrollTo = useCallback((
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number }
  ) => {
    lenisRef.current?.scrollTo(target, {
      offset: options?.offset ?? 0,
      duration: options?.duration ?? 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth ease-out
    });
  }, []);

  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current, scrollTo, stop, start }}>
      {children}
    </LenisContext.Provider>
  );
}

// ============================================================================
// SCROLL HOOKS - For Components
// ============================================================================

/**
 * Hook to get current scroll position (re-renders on change)
 */
export function useScrollPosition() {
  return usePerformanceStore((s) => s.scroll.scrollY);
}

/**
 * Hook to check if currently scrolling
 */
export function useIsScrolling() {
  return usePerformanceStore((s) => s.scroll.isScrolling);
}

/**
 * Hook to get scroll progress (0-1)
 */
export function useScrollProgress() {
  return usePerformanceStore((s) => s.scroll.scrollProgress);
}

/**
 * Hook to get scroll direction
 */
export function useScrollDirection() {
  return usePerformanceStore((s) => s.scroll.scrollDirection);
}
