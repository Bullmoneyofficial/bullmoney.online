"use client";

import React, { ReactNode, useEffect, useRef } from 'react';
import { LenisProvider } from '@/lib/smoothScroll';
import { usePerformanceInit, usePerformanceCSSSync } from '@/hooks/usePerformanceInit';
import { detectBrowser } from '@/lib/browserDetection';
import { detectSafari, applySafariCSSFixes, applySafariMemoryOptimizations } from '@/lib/safariOptimizations';

// ============================================================================
// PERFORMANCE PROVIDER - Wraps App with 120Hz Optimizations
// ============================================================================

interface PerformanceProviderProps {
  children: ReactNode;
  enableSmoothScroll?: boolean;
  enableMobileSmoothScroll?: boolean;
  smoothScrollOptions?: {
    lerp?: number;
    duration?: number;
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
  };
}

/**
 * Desktop FPS Optimizer Hook v3 - OPTIMIZED for better performance
 * Uses longer intervals to reduce CPU overhead while still adapting quality
 */
function useDesktopFPSOptimizer() {
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const shimmerQualityRef = useRef<'high' | 'medium' | 'low' | 'disabled'>('high');
  const lastUpdateTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return; // Desktop only

    const measureAndOptimize = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      // OPTIMIZED: Update every 3 seconds instead of 1 second to reduce overhead
      if (elapsed >= 3000) {
        const currentFps = Math.round(frameCountRef.current * 1000 / elapsed);
        fpsHistoryRef.current.push(currentFps);

        if (fpsHistoryRef.current.length > 5) {
          fpsHistoryRef.current.shift();
        }

        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        const root = document.documentElement;

        // Only update quality if 5 seconds passed - prevents thrashing
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
        if (timeSinceLastUpdate >= 5000) {
          // Clear existing classes
          root.classList.remove('shimmer-quality-high', 'shimmer-quality-medium', 'shimmer-quality-low', 'shimmer-quality-disabled');

          // Adaptive quality based on FPS
          if (avgFps < 20 && shimmerQualityRef.current !== 'disabled') {
            shimmerQualityRef.current = 'disabled';
            root.classList.add('shimmer-quality-disabled', 'reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.1');
            lastUpdateTimeRef.current = now;
          } else if (avgFps < 35 && shimmerQualityRef.current !== 'low') {
            shimmerQualityRef.current = 'low';
            root.classList.add('shimmer-quality-low', 'reduce-animations', 'reduce-blur');
            root.style.setProperty('--animation-duration-multiplier', '0.3');
            lastUpdateTimeRef.current = now;
          } else if (avgFps < 50 && shimmerQualityRef.current !== 'medium') {
            shimmerQualityRef.current = 'medium';
            root.classList.add('shimmer-quality-medium');
            root.classList.remove('reduce-animations', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.7');
            lastUpdateTimeRef.current = now;
          } else if (avgFps >= 55 && shimmerQualityRef.current !== 'high') {
            shimmerQualityRef.current = 'high';
            root.classList.add('shimmer-quality-high');
            root.classList.remove('reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '1');
            lastUpdateTimeRef.current = now;
          }
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(measureAndOptimize);
    };

    // Wait 8 seconds for page to fully load before monitoring
    const timeout = setTimeout(() => {
      rafIdRef.current = requestAnimationFrame(measureAndOptimize);
    }, 8000);

    return () => {
      clearTimeout(timeout);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);
}

/**
 * Scroll-aware animation pauser
 * Pauses heavy animations during scroll for better performance
 */
function useScrollAwareAnimations() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return; // Desktop only
    
    const handleScroll = () => {
      document.documentElement.classList.add('is-scrolling');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        document.documentElement.classList.remove('is-scrolling');
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}

/**
 * Performance Provider Component
 * 
 * Initializes:
 * - 120Hz display detection
 * - FPS monitoring
 * - CSS custom property sync
 * - Lenis smooth scroll (DESKTOP ONLY - disabled on mobile for native scroll)
 * 
 * Usage:
 * ```tsx
 * <PerformanceProvider enableSmoothScroll>
 *   <App />
 * </PerformanceProvider>
 * ```
 */
export function PerformanceProvider({ 
  children, 
  enableSmoothScroll = true,
  enableMobileSmoothScroll = true,
  smoothScrollOptions = {}
}: PerformanceProviderProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHighEndDesktop, setIsHighEndDesktop] = React.useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = React.useState(false);
  const [lenisFailed, setLenisFailed] = React.useState(false);
  // Force native scroll on desktop to avoid stacking-context side effects from Lenis
  const [forceNativeScroll, setForceNativeScroll] = React.useState(false);
  
  // Detect device type and capabilities on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Check for in-app browsers - disable heavy features
      const browserInfo = detectBrowser();
      setIsInAppBrowser(browserInfo.isInAppBrowser);
      
      // UPDATED 2026: Detect Apple devices and Instagram for premium experience
      const ua = navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/i.test(ua) || /macintosh|mac os x/i.test(ua);
      const isInstagram = ua.includes('instagram') || ua.includes('ig_');
      const hasPremiumExperience = isAppleDevice || isInstagram;
      
      // Initialize Safari-specific optimizations
      const safariInfo = detectSafari();
      if (safariInfo.isSafari) {
        applySafariCSSFixes();
        applySafariMemoryOptimizations();
        console.log('[PerformanceProvider] Safari optimizations applied');
        
        // Safari on mobile needs extra careful handling - but Apple devices still get premium
        if (safariInfo.isMobileSafari && !isAppleDevice) {
          console.log('[PerformanceProvider] Mobile Safari detected - enabling conservative mode');
          setIsHighEndDesktop(false);
          return;
        }
      }
      
      // UPDATED 2026: Apple devices and Instagram get premium experience regardless of browser
      if (hasPremiumExperience) {
        console.log('[PerformanceProvider] Premium experience enabled for:', isAppleDevice ? 'Apple device' : 'Instagram');
        setIsHighEndDesktop(true);
        
        // Add appropriate premium classes to both html and body
        if (isAppleDevice) {
          document.documentElement.classList.add('apple-premium', 'high-performance');
          document.body?.classList.add('apple-premium', 'high-performance');
        }
        if (isInstagram) {
          document.documentElement.classList.add('instagram-premium', 'high-performance');
          document.body?.classList.add('instagram-premium', 'high-performance');
        }
        // Continue with detection but don't return early
      }
      
      if (browserInfo.isInAppBrowser && !hasPremiumExperience) {
        console.log('[PerformanceProvider] In-app browser detected:', browserInfo.browserName);
        console.log('[PerformanceProvider] Disabling heavy features for stability');
        setIsHighEndDesktop(false);
        return;
      }
      
      // Detect high-end desktop (Apple Silicon, high-spec PCs)
      if (!mobile) {
        const memory = (navigator as any).deviceMemory || 8;
        const cores = navigator.hardwareConcurrency || 4;
        const ua = navigator.userAgent.toLowerCase();
        const isMac = /macintosh|mac os x/i.test(ua);
        
        // Apple Silicon detection
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
        
        // High-end desktop: Apple Silicon OR 8GB+ RAM with 4+ cores
        const highEnd = isAppleSilicon || (isMac && cores >= 8) || (memory >= 8 && cores >= 4);
        setIsHighEndDesktop(highEnd);
        
        // Apply desktop-specific optimizations
        if (highEnd) {
          document.documentElement.classList.add('desktop-optimized', 'high-performance');
          console.log('[PerformanceProvider] 🖥️ High-end desktop detected, enabling optimizations');
        }
      }
    }
  }, []);

  // Desktop-only: disable Lenis smoothing so fixed/modals stay pinned to viewport
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateScrollMode = () => {
      setForceNativeScroll(window.innerWidth >= 1024);
    };

    updateScrollMode();
    window.addEventListener('resize', updateScrollMode, { passive: true });

    return () => window.removeEventListener('resize', updateScrollMode);
  }, []);

  React.useEffect(() => {
    if (isMobile && lenisFailed) {
      setLenisFailed(false);
    }
  }, [isMobile, lenisFailed]);
  
  // Initialize performance monitoring
  usePerformanceInit();
  
  // Sync performance state to CSS
  usePerformanceCSSSync();

  // NOTE: Keyboard scrolling is now ALLOWED on desktop
  // Users should be able to use arrow keys, space, page up/down to scroll normally

  // Set up performance observers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Report long tasks that exceed frame budget
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // 50ms = potential frame drop
              console.warn('[Performance] Long task detected:', {
                duration: `${entry.duration.toFixed(2)}ms`,
                startTime: entry.startTime,
              });
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        
        return () => longTaskObserver.disconnect();
      } catch (e) {
        // Long task API not supported
      }
    }
  }, []);

  // Wrap with Lenis if smooth scroll is enabled.
  // IMPORTANT: Disable Lenis on mobile and non-premium in-app browsers
  // UPDATED 2026: Apple devices and Instagram get smooth scroll even in in-app browser
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAppleDevice = /iphone|ipad|ipod/i.test(ua) || /macintosh|mac os x/i.test(ua);
  const isInstagram = ua.includes('instagram') || ua.includes('ig_');
  const hasPremiumExperience = isAppleDevice || isInstagram;
  
  const shouldUseSmoothScroll = enableSmoothScroll && !isMobile && !forceNativeScroll && (!isInAppBrowser || hasPremiumExperience) && !lenisFailed;

  React.useEffect(() => {
    if (!shouldUseSmoothScroll) {
      return;
    }

    const scrollingElement = document.scrollingElement || document.documentElement;
    let failureCount = 0;
    let rafId: number | null = null;

    const handleWheel = (event: WheelEvent) => {
      const maxScrollable = scrollingElement.scrollHeight - scrollingElement.clientHeight;
      if (maxScrollable <= 4) {
        return;
      }

      const start = scrollingElement.scrollTop;
      const atTop = start <= 1;
      const atBottom = start >= maxScrollable - 1;

      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
        failureCount = 0;
        return;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const delta = Math.abs(scrollingElement.scrollTop - start);
        if (delta < 0.5) {
          failureCount += 1;
          if (failureCount >= 3 && !lenisFailed) {
            console.warn('[PerformanceProvider] Lenis failed to move after wheel input, falling back to native scroll.');
            setLenisFailed(true);
          }
        } else {
          failureCount = 0;
        }
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [shouldUseSmoothScroll, lenisFailed]);
  
  if (shouldUseSmoothScroll) {
    return (
      <LenisProvider options={smoothScrollOptions}>
        <PerformanceOptimizer>
          {children}
        </PerformanceOptimizer>
      </LenisProvider>
    );
  }

  return (
    <PerformanceOptimizer>
      {children}
    </PerformanceOptimizer>
  );
}

/**
 * Performance Optimizer - Applies runtime optimizations
 */
function PerformanceOptimizer({ children }: { children: ReactNode }) {
  // Enable FPS optimizer on desktop
  useDesktopFPSOptimizer();
  
  // Enable scroll-aware animation pausing
  useScrollAwareAnimations();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inject scroll-aware CSS
    const styleId = 'perf-optimizer-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* FPS Optimizer - Quality Reduction Classes */
        html.reduce-animations * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        
        html.reduce-animations .shimmer-spin,
        html.reduce-animations .shimmer-line,
        html.reduce-animations .shimmer-pulse {
          animation: none !important;
        }
        
        html.reduce-blur {
          --blur-amount: 4px !important;
        }
        
        html.reduce-blur .backdrop-blur-2xl,
        html.reduce-blur .backdrop-blur-xl,
        html.reduce-blur .backdrop-blur-lg {
          backdrop-filter: blur(4px) !important;
        }
        
        html.reduce-shadows * {
          box-shadow: none !important;
        }
        
        /* Scroll Performance - Pause animations while scrolling */
        html.is-scrolling .shimmer-spin,
        html.is-scrolling .shimmer-line,
        html.is-scrolling .shimmer-pulse,
        html.is-scrolling .shimmer-glow,
        html.is-scrolling .page-spin,
        html.is-scrolling .page-shimmer-ltr {
          animation-play-state: paused !important;
        }
        
        html.is-scrolling canvas {
          pointer-events: none;
        }
        
        /* Reduce GPU load during scroll */
        html.is-scrolling .spline-container canvas,
        html.is-scrolling [data-spline] canvas {
          filter: blur(1px);
          opacity: 0.95;
          transition: filter 0.1s, opacity 0.1s;
        }
      `;
      document.head.appendChild(style);
    }

    // Request high priority rendering
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
      console.log('[Performance] Using Scheduler API for priority rendering');
    }

    // Optimize Intersection Observer for 120Hz
    const prefetchLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const link = entry.target as HTMLAnchorElement;
              const href = link.getAttribute('href');
              
              // Prefetch on hover intent
              if (href && !document.querySelector(`link[href="${href}"]`)) {
                const prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = href;
                document.head.appendChild(prefetch);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );

      links.forEach((link) => observer.observe(link));
      
      return () => observer.disconnect();
    };

    // Delay prefetch to after initial render
    const timeoutId = setTimeout(prefetchLinks, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return <>{children}</>;
}

// ============================================================================
// FPS DISPLAY COMPONENT (Development Only)
// ============================================================================

interface FPSCounterProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function FPSCounter({ 
  show = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}: FPSCounterProps) {
  const [fps, setFps] = React.useState(60);
  const [isLow, setIsLow] = React.useState(false);

  useEffect(() => {
    if (!show) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measure = (time: number) => {
      frameCount++;
      const elapsed = time - lastTime;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount / elapsed) * 1000);
        setFps(currentFps);
        setIsLow(currentFps < 50);
        frameCount = 0;
        lastTime = time;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [show]);

  if (!show) return null;

  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        backgroundColor: isLow ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
        color: 'white',
        zIndex: 99999,
        pointerEvents: 'none',
        transform: 'translateZ(0)',
      }}
    >
      {fps} FPS
    </div>
  );
}
