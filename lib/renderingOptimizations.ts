"use client";

/**
 * Rendering Optimizations - M1 Mac & Desktop Performance
 * 
 * Aggressive optimization strategies:
 * 1. Frame skipping for expensive operations (shimmers, animations)
 * 2. Render scheduling with requestIdleCallback
 * 3. Image lazy loading with native API
 * 4. CSS containment to limit repaints
 * 5. GPU acceleration hints
 * 6. Batch DOM updates
 * 7. Viewport-based visibility detection
 */

import { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// FRAME SKIPPING UTILITIES
// ============================================================================

/**
 * Skip rendering on certain frames to maintain 60fps
 * Useful for expensive animations that don't need to update every frame
 * 
 * Example: Show shimmer every 2 frames (30fps) while maintaining 60fps visuals
 */
export class FrameSkipper {
  private frameCount = 0;
  private skipInterval: number;

  constructor(skipEveryNFrames: number = 2) {
    this.skipInterval = skipEveryNFrames;
  }

  shouldRender(): boolean {
    const should = this.frameCount % this.skipInterval === 0;
    this.frameCount++;
    return should;
  }

  reset(): void {
    this.frameCount = 0;
  }
}

// ============================================================================
// RENDERING CONTEXT MANAGER
// ============================================================================

/**
 * Manager for coordinating expensive rendering operations
 * Prevents multiple expensive renders in the same frame
 */
export class RenderScheduler {
  private pendingWorks: Set<string> = new Set();
  private frameDeadline = 0;
  private TARGET_FRAME_TIME = 5; // 5ms out of 16.67ms budget for JS

  /**
   * Schedule work for next frame
   * Yields if frame time budget is exceeded
   */
  scheduleWork(
    id: string,
    work: () => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    return new Promise((resolve) => {
      const executeWork = () => {
        const startTime = performance.now();
        work();
        const duration = performance.now() - startTime;

        if (duration > this.TARGET_FRAME_TIME) {
          console.warn(`[RenderScheduler] Work "${id}" took ${duration}ms (budget: ${this.TARGET_FRAME_TIME}ms)`);
        }

        this.pendingWorks.delete(id);
        resolve();
      };

      if (priority === 'high') {
        // High priority: run immediately
        executeWork();
      } else {
        const browserScheduler = typeof globalThis !== 'undefined'
          ? (globalThis as any).scheduler
          : undefined;

        if (browserScheduler && typeof browserScheduler.yield === 'function') {
          // Use scheduler.yield if available (Chrome 94+)
          browserScheduler.yield().then(executeWork);
        } else {
          // Fallback: use requestIdleCallback or requestAnimationFrame
          if ('requestIdleCallback' in window) {
            requestIdleCallback(executeWork);
          } else {
            requestAnimationFrame(executeWork);
          }
        }
      }

      this.pendingWorks.add(id);
    });
  }

  hasPendingWork(): boolean {
    return this.pendingWorks.size > 0;
  }
}

// Global scheduler instance
export const renderScheduler = new RenderScheduler();

// ============================================================================
// RENDERING OPTIMIZATION HOOKS
// ============================================================================

/**
 * Hook to implement frame skipping in components
 * 
 * Usage:
 * const skip = useFrameSkipping(2); // Skip every 2 frames
 * if (!skip.shouldRender()) return null; // Don't render on skipped frames
 */
export function useFrameSkipping(skipEveryNFrames: number = 2) {
  const skipperRef = useRef(new FrameSkipper(skipEveryNFrames));

  return {
    shouldRender: () => skipperRef.current.shouldRender(),
    reset: () => skipperRef.current.reset(),
  };
}

/**
 * Hook to defer expensive operations to when browser is idle
 */
export function useDeferredWork() {
  const performWork = useCallback((
    work: () => void,
    id: string = 'deferred-work',
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    return renderScheduler.scheduleWork(id, work, priority);
  }, []);

  return { performWork };
}

/**
 * Optimize rendering by batching DOM updates
 */
export function useBatchedUpdates() {
  const pendingUpdatesRef = useRef<Map<string, () => void>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batch = useCallback((id: string, update: () => void) => {
    pendingUpdatesRef.current.set(id, update);

    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Flush on next frame
    timeoutRef.current = setTimeout(() => {
      const updates = Array.from(pendingUpdatesRef.current.values());
      pendingUpdatesRef.current.clear();

      // Batch all updates together
      updates.forEach((update) => update());
    }, 0);
  }, []);

  return { batch };
}

/**
 * Intersection Observer for lazy loading and visibility detection
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  callback: (isVisible: boolean) => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, options]);
}

// ============================================================================
// CSS OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Inject CSS optimizations for performance
 * - GPU acceleration
 * - Content containment
 * - Transform-only animations
 */
export function injectRenderingOptimizations() {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = `
    /* ========================================
       GPU ACCELERATION HINTS
       ======================================== */
    
    /* Enable GPU acceleration for all animations */
    * {
      /* Use transform instead of position properties */
      /* Components should use transform: translateX/Y instead of left/top */
    }
    
    /* High-refresh animations get hardware acceleration */
    @supports (animation-timeline: auto) {
      .animated-element {
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
    }
    
    /* ========================================
       PAINT AND LAYOUT CONTAINMENT
       ======================================== */
    
    /* Limit repaints to specific areas */
    [data-contain] {
      contain: layout style paint;
    }
    
    /* Shimmer containers - isolate paint */
    [data-shimmer] {
      contain: paint;
      will-change: auto;
    }
    
    /* Navbar - frequently updated, needs containment */
    nav {
      contain: layout style paint;
      will-change: transform;
    }
    
    /* ========================================
       REDUCE REFLOWS
       ======================================== */
    
    /* Use transform for animations instead of layout-affecting properties */
    .slide-animation {
      transform: translateX(var(--slide-x, 0px));
    }
    
    .fade-animation {
      opacity: var(--fade-opacity, 1);
    }
    
    /* ========================================
       IMAGE OPTIMIZATION
       ======================================== */
    
    img {
      /* Enable lazy loading by default */
      loading: lazy;
      /* Reduce repaints when images load */
      content-visibility: auto;
    }
    
    /* ========================================
       SCROLL OPTIMIZATION
       ======================================== */
    
    html {
      scroll-behavior: auto; /* Disable smooth scroll - use JS RAF instead */
    }
    
    /* Optimize scroll containers */
    [data-scroll-container] {
      contain: layout style paint;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      will-change: scroll-position;
    }
    
    /* ========================================
       ANIMATION OPTIMIZATION
       ======================================== */
    
    /* Prefer CSS animations (GPU accelerated) over JS */
    @keyframes gpu-fade {
      from { opacity: 0; transform: translateZ(0); }
      to { opacity: 1; transform: translateZ(0); }
    }
    
    /* Reduce shimmer animation complexity */
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .shimmer-animated {
      animation: shimmer 2s infinite;
      will-change: transform;
    }
    
    /* ========================================
       MOBILE OPTIMIZATIONS
       ======================================== */
    
    @media (max-width: 768px) {
      /* Reduce effects on mobile */
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Hardware acceleration for touch scrolling */
      body {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Reduce blur on mobile */
      .blur-effect {
        filter: blur(0px) !important;
      }
    }
    
    /* ========================================
       REDUCE BLUR (M1 Mac Performance)
       ======================================== */
    
    /* Disable expensive blur effects */
    .backdrop-blur {
      backdrop-filter: none !important;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .blur {
      filter: none !important;
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    /* Use simpler effects instead */
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  `;

  document.head.appendChild(style);
}

// ============================================================================
// PERFORMANCE MARKERS
// ============================================================================

/**
 * Mark performance-critical sections
 * Use with DevTools Performance tab
 */
export function markRenderStart(label: string) {
  if ('performance' in window) {
    performance.mark(`${label}-start`);
  }
}

export function markRenderEnd(label: string) {
  if ('performance' in window) {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
    } catch (e) {
      // Measurement already exists
    }
  }
}

export function measureRenderTime(label: string, fn: () => void) {
  markRenderStart(label);
  fn();
  markRenderEnd(label);
}
