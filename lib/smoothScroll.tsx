"use client";

import { useEffect, useRef, useCallback, createContext, useContext, ReactNode, useState } from 'react';
import Lenis from 'lenis';
import { usePerformanceStore } from '@/stores/performanceStore';
import { detectBrowser } from '@/lib/browserDetection';

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
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  
  const { updateScroll, refreshRate, isProMotion } = usePerformanceStore();

  // Initialize Lenis with 120Hz optimizations for DESKTOP
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for in-app browsers - UPDATED 2026: All browsers get full Lenis experience
    const browserInfo = detectBrowser();
    const hasApplePremiumExperience = browserInfo.hasApplePremiumExperience || false;
    const isInstagram = browserInfo.isInstagram || false;
    
    // UPDATED 2026: All devices and in-app browsers get full Lenis experience
    console.log('[Lenis] Enabled for all browsers:', browserInfo.browserName);
    
    if (hasApplePremiumExperience || isInstagram) {
      console.log('[Lenis] Enabled for premium experience:', browserInfo.browserName, '(Apple:', hasApplePremiumExperience, ', Instagram:', isInstagram, ')');
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (prefersReducedMotion) {
      console.log('[Lenis] Disabled due to prefers-reduced-motion');
      return;
    }

    const isMobile = window.innerWidth < 768;
    
    // UPDATED 2026: Enable Lenis on mobile for premium smooth scroll experience
    if (isMobile) {
      console.log('[Lenis] Enabled on mobile for smooth scroll experience');
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
    
    const mobileLerp = 0.12;
    const mobileDuration = 0.9;

    const appliedLerp = options.lerp ?? (isMobile ? mobileLerp : lerp);
    const appliedDuration = options.duration ?? (isMobile ? mobileDuration : duration);

    console.log('[Lenis] Scroll initialized:', {
      device: isMobile ? 'mobile' : 'desktop',
      isAppleSilicon,
      isHighEndDesktop,
      isHighRefreshDesktop,
      lerp: appliedLerp,
      duration: appliedDuration
    });

    // FIXED 2026: Big display mouse wheel scroll improvements
    // Higher wheelMultiplier = more responsive scrolling with mouse wheel
    // Lower lerp = smoother but can feel "laggy" on big displays
    const isBigDisplay = window.innerWidth >= 1440 || window.innerHeight >= 900;
    const adjustedWheelMultiplier = isBigDisplay ? 1.5 : (isHighEndDesktop ? 1.0 : 1.2);
    const adjustedLerp = isBigDisplay ? 0.1 : appliedLerp; // Higher lerp for more responsive feel

    // Lenis option surface varies by version; keep config flexible.
    // FIXED: Improved wheel and trackpad handling for better desktop scrolling
    const lenisContent = document.querySelector('[data-lenis-content]') as HTMLElement | null;
    const lenisOptions: any = {
      lerp: adjustedLerp, // FIXED: Use adjusted lerp for big displays
      duration: isBigDisplay ? 0.6 : appliedDuration, // Shorter duration for snappier feel
      smoothWheel: options.smoothWheel ?? true, // Always smooth wheel on desktop
      wheelMultiplier: options.wheelMultiplier ?? adjustedWheelMultiplier, // FIXED: Higher multiplier for big displays
      touchMultiplier: options.touchMultiplier ?? (isMobile ? 1.2 : 1.8), // FIXED: Higher trackpad sensitivity
      infinite: options.infinite ?? false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',

      // Desktop: enhanced trackpad support
      // FIXED: Enable smooth touch for trackpad gestures on desktop
      smoothTouch: !isMobile,
      syncTouch: false,
      syncTouchLerp: 0.12, // FIXED: Higher for better trackpad/mouse response

      // FIXED: Allow normal overscroll behavior
      overscroll: true,

      // Use RAF for 120Hz synchronization
      autoRaf: false, // We handle RAF manually for precise timing

      // FIXED: Ensure wheel events are captured
      wrapper: window,
      content: lenisContent ?? document.documentElement,
    };

    lenisRef.current = new Lenis(lenisOptions);
    setLenisInstance(lenisRef.current);

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
      setLenisInstance(null);
    };
  }, [options, updateScroll, isProMotion]);

  // Scroll to target with smooth animation
  const scrollTo = useCallback((
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; easing?: (t: number) => number }
  ) => {
    if (!lenisRef.current) {
      // Fallback for when Lenis is not available
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else if (typeof target === 'string') {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    try {
      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.duration ?? 1.5,
        easing: options?.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))), // Smooth ease-out
      });
    } catch (e) {
      // Fallback if Lenis scrollTo fails
      console.warn('[Lenis] scrollTo failed, falling back to native scroll:', e);
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      }
    }
  }, []);

  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance, scrollTo, stop, start }}>
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
