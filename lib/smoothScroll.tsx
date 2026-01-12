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
 * ENHANCED: Now optimized for both mobile AND desktop high-refresh displays
 * including Apple Silicon Macs with ProMotion
 */
export function LenisProvider({ children, options = {} }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  
  const { updateScroll, refreshRate, isProMotion } = usePerformanceStore();

  // Initialize Lenis with 120Hz optimizations for DESKTOP
  useEffect(() => {
    // Skip Lenis on mobile to avoid scroll blocking
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      console.log('[Lenis] Disabled on mobile for native scroll performance');
      return;
    }
    
    // ENHANCED: Detect high-end desktop for optimal settings
    const ua = navigator.userAgent.toLowerCase();
    const isMac = /macintosh|mac os x/i.test(ua);
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 8;
    
    // Detect Apple Silicon
    let isAppleSilicon = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          isAppleSilicon = renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer));
        }
      }
    } catch (e) {}
    
    // High-end desktop detection
    const isHighEndDesktop = isAppleSilicon || (isMac && cores >= 8) || (memory >= 16 && cores >= 8);
    const isHighRefreshDesktop = isProMotion || isAppleSilicon || window.screen.width >= 2560;
    
    // Optimized lerp based on device capability
    // Lower lerp = smoother but more latency, higher = more responsive
    let lerp = 0.08; // Default for 60Hz
    if (isHighRefreshDesktop) {
      lerp = 0.05; // Ultra-smooth for 120Hz+ displays
    } else if (isProMotion) {
      lerp = 0.06;
    }
    
    // Optimized duration based on refresh rate
    const duration = isHighRefreshDesktop ? 0.8 : 1.0;
    
    console.log('[Lenis] Desktop scroll initialized:', {
      isAppleSilicon,
      isHighEndDesktop,
      isHighRefreshDesktop,
      lerp,
      duration
    });
    
    lenisRef.current = new Lenis({
      lerp: options.lerp ?? lerp,
      duration: options.duration ?? duration,
      smoothWheel: options.smoothWheel ?? true,
      wheelMultiplier: options.wheelMultiplier ?? (isHighEndDesktop ? 0.7 : 0.8),
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
