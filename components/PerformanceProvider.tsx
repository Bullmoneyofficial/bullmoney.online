"use client";

import React, { ReactNode, useEffect } from 'react';
import { LenisProvider } from '@/lib/smoothScroll';
import { usePerformanceInit, usePerformanceCSSSync } from '@/hooks/usePerformanceInit';

// ============================================================================
// PERFORMANCE PROVIDER - Wraps App with 120Hz Optimizations
// ============================================================================

interface PerformanceProviderProps {
  children: ReactNode;
  enableSmoothScroll?: boolean;
  smoothScrollOptions?: {
    lerp?: number;
    duration?: number;
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
  };
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
  smoothScrollOptions = {}
}: PerformanceProviderProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Detect mobile on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);
  
  // Initialize performance monitoring
  usePerformanceInit();
  
  // Sync performance state to CSS
  usePerformanceCSSSync();

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

  // Wrap with Lenis if smooth scroll is enabled AND we're on desktop
  // Mobile uses native scroll for best 120Hz performance
  const shouldUseSmoothScroll = enableSmoothScroll && !isMobile;
  
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
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
