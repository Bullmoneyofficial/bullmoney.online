"use client";

import React, { ReactNode, useEffect, useRef } from 'react';
import { LenisProvider } from '@/lib/smoothScroll';
import { usePerformanceInit, usePerformanceCSSSync } from '@/hooks/usePerformanceInit';
import { detectBrowser } from '@/lib/browserDetection';

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
 * Desktop FPS Optimizer Hook v2
 * Advanced FPS monitoring with granular shimmer quality control
 * Dynamically adjusts animation complexity when FPS drops
 */
function useDesktopFPSOptimizer() {
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const qualityLevelRef = useRef<'high' | 'medium' | 'low'>('high');
  const shimmerQualityRef = useRef<'high' | 'medium' | 'low' | 'disabled'>('high');
  const lastUpdateTimeRef = useRef(0); // Prevent rapid switching
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return; // Desktop only
    
    let animationId: number;
    
    const measureAndOptimize = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        const currentFps = Math.round(frameCountRef.current * 1000 / elapsed);
        fpsHistoryRef.current.push(currentFps);
        
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        const root = document.documentElement;
        
        // Only update if 500ms has passed since last update - prevents thrashing
        const timeSinceLastUpdate = performance.now() - lastUpdateTimeRef.current;
        if (timeSinceLastUpdate < 500) {
          frameCountRef.current = 0;
          lastTimeRef.current = now;
          animationId = requestAnimationFrame(measureAndOptimize);
          return;
        }
        
        // Clear all shimmer quality classes first
        root.classList.remove('shimmer-quality-high', 'shimmer-quality-medium', 'shimmer-quality-low', 'shimmer-quality-disabled');
        
        // Critical FPS - disable most animations
        if (avgFps < 20) {
          if (shimmerQualityRef.current !== 'disabled') {
            shimmerQualityRef.current = 'disabled';
            root.classList.add('shimmer-quality-disabled', 'reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.1');
            lastUpdateTimeRef.current = performance.now();
            console.warn(`🔴 FPS critical (${Math.round(avgFps)}fps) - shimmers DISABLED`);
          }
        }
        // Low FPS - minimal shimmer animations
        else if (avgFps < 35) {
          if (shimmerQualityRef.current !== 'low') {
            shimmerQualityRef.current = 'low';
            qualityLevelRef.current = 'low';
            root.classList.add('shimmer-quality-low', 'reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.3');
            lastUpdateTimeRef.current = performance.now();
            console.warn(`⚠️ FPS low (${Math.round(avgFps)}fps) - shimmer quality LOW`);
          }
        }
        // Medium FPS - slow down shimmers
        else if (avgFps < 50) {
          if (shimmerQualityRef.current !== 'medium') {
            shimmerQualityRef.current = 'medium';
            qualityLevelRef.current = 'medium';
            root.classList.add('shimmer-quality-medium', 'reduce-blur');
            root.classList.remove('reduce-animations', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.7');
            lastUpdateTimeRef.current = performance.now();
            console.log(`⚡ FPS medium (${Math.round(avgFps)}fps) - shimmer quality MEDIUM`);
          }
        }
        // Good FPS - full quality
        else {
          if (shimmerQualityRef.current !== 'high') {
            shimmerQualityRef.current = 'high';
            qualityLevelRef.current = 'high';
            root.classList.add('shimmer-quality-high');
            root.classList.remove('reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '1');
            lastUpdateTimeRef.current = performance.now();
            console.log(`✅ FPS good (${Math.round(avgFps)}fps) - shimmer quality HIGH`);
          }
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(measureAndOptimize);
    };
    
    // Wait 5 seconds for page to fully load and settle before starting optimization
    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(measureAndOptimize);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);
}

/**
 * Scroll-aware animation pauser
 * Pauses heavy animations during scroll for better performance
 */
function useScrollAwareAnimations() {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
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
  
  // Detect device type and capabilities on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Check for in-app browsers - disable heavy features
      const browserInfo = detectBrowser();
      setIsInAppBrowser(browserInfo.isInAppBrowser);
      
      if (browserInfo.isInAppBrowser) {
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
  
  // Initialize performance monitoring
  usePerformanceInit();
  
  // Sync performance state to CSS
  usePerformanceCSSSync();

  // Desktop-only mouse scrolling - prevent keyboard scrolling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMobile) return;
    
    const preventKeyScroll = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable ||
                          target.closest('[contenteditable="true"]');
      
      // Allow in input fields
      if (isInputField) return;
      
      // Prevent scroll keys on desktop
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];
      
      if (scrollKeys.includes(e.code) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', preventKeyScroll, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', preventKeyScroll);
    };
  }, [isMobile]);

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
  // IMPORTANT: Disable Lenis on mobile and in-app browsers - use native scroll for best touch experience
  const shouldUseSmoothScroll = enableSmoothScroll && !isMobile && !isInAppBrowser;
  
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
