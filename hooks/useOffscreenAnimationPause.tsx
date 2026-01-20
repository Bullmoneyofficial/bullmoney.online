"use client";

/**
 * Off-Screen Animation Pause Hook - 2026 Performance Enhancement
 * 
 * Automatically pauses animations for elements not visible in viewport.
 * This saves significant CPU/GPU resources by not running animations
 * that users can't see anyway.
 * 
 * Usage:
 * 1. useOffscreenAnimationPause() - Auto-monitors all sections
 * 2. useOffscreenPause(ref) - Monitor specific element
 * 3. OffscreenPauseProvider - Wrap app for global monitoring
 */

import React, { useEffect, useRef, useCallback, useState, ReactNode } from 'react';

// ============================================================================
// GLOBAL OFF-SCREEN DETECTION SYSTEM
// ============================================================================

// Shared observer for all elements
let globalObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, (isVisible: boolean) => void>();

/**
 * Initialize the global IntersectionObserver
 * Uses a generous rootMargin to start animations slightly before visible
 */
function initGlobalObserver() {
  if (typeof window === 'undefined') return;
  if (globalObserver) return;

  globalObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const callback = observedElements.get(entry.target);
        if (callback) {
          callback(entry.isIntersecting);
        }
        
        // Set data attribute for CSS-based pausing
        if (entry.target instanceof HTMLElement) {
          entry.target.dataset.offscreen = entry.isIntersecting ? 'false' : 'true';
        }
      });
    },
    {
      // Start animations 200px before entering viewport
      rootMargin: '200px 0px 200px 0px',
      threshold: 0,
    }
  );
}

/**
 * Register an element for off-screen detection
 */
function observeElement(element: Element, callback?: (isVisible: boolean) => void) {
  initGlobalObserver();
  
  if (!globalObserver) return () => {};
  
  const cb = callback || (() => {});
  observedElements.set(element, cb);
  globalObserver.observe(element);
  
  return () => {
    globalObserver?.unobserve(element);
    observedElements.delete(element);
    if (element instanceof HTMLElement) {
      delete element.dataset.offscreen;
    }
  };
}

// ============================================================================
// HOOK: Monitor specific element
// ============================================================================

/**
 * Hook to pause animations for a specific element when off-screen
 * 
 * @param options Configuration options
 * @returns ref to attach to element, isVisible state
 * 
 * @example
 * const { ref, isVisible } = useOffscreenPause<HTMLDivElement>();
 * return <div ref={ref}>Content that pauses when off-screen</div>
 */
export function useOffscreenPause<T extends HTMLElement>(options?: {
  /** Custom callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean) => void;
  /** Pause RAF-based animations (call returned pause/resume functions) */
  controlRAF?: boolean;
}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(true);
  const rafPausedRef = useRef(false);
  
  const handleVisibilityChange = useCallback((visible: boolean) => {
    setIsVisible(visible);
    rafPausedRef.current = !visible;
    options?.onVisibilityChange?.(visible);
  }, [options]);
  
  useEffect(() => {
    if (!ref.current) return;
    
    return observeElement(ref.current, handleVisibilityChange);
  }, [handleVisibilityChange]);
  
  // For RAF-controlled animations
  const shouldAnimate = useCallback(() => {
    return !rafPausedRef.current;
  }, []);
  
  return { ref, isVisible, shouldAnimate };
}

// ============================================================================
// HOOK: Auto-monitor all sections
// ============================================================================

/**
 * Hook that automatically monitors all sections/articles for off-screen detection
 * Call once at app level to enable global off-screen animation pausing
 */
export function useOffscreenAnimationPause() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    initGlobalObserver();
    
    // Query all animatable sections
    const selectors = [
      'section',
      'article',
      '[data-animate]',
      '[class*="animate-"]',
      '.content-section',
      '[data-spline]',
      '.spline-container',
    ];
    
    const elements = document.querySelectorAll(selectors.join(', '));
    const cleanups: (() => void)[] = [];
    
    elements.forEach((element) => {
      const cleanup = observeElement(element);
      cleanups.push(cleanup);
    });
    
    // Also observe dynamically added elements
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if the node or its children match our selectors
            selectors.forEach((selector) => {
              if (node.matches?.(selector)) {
                const cleanup = observeElement(node);
                cleanups.push(cleanup);
              }
              node.querySelectorAll?.(selector).forEach((child) => {
                const cleanup = observeElement(child);
                cleanups.push(cleanup);
              });
            });
          }
        });
      });
    });
    
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      mutationObserver.disconnect();
    };
  }, []);
}

// ============================================================================
// COMPONENT: Provider for global off-screen monitoring
// ============================================================================

export function OffscreenAnimationController({ children }: { children: React.ReactNode }) {
  useOffscreenAnimationPause();
  return <>{children}</>;
}

// ============================================================================
// UTILITY: Pause RAF loop when off-screen
// ============================================================================

/**
 * Create a RAF loop that automatically pauses when element is off-screen
 * 
 * @param element The element to monitor
 * @param callback The animation callback
 * @returns start/stop functions
 */
export function createVisibilityAwareRAF(
  element: HTMLElement,
  callback: (deltaTime: number) => void
) {
  let rafId: number | null = null;
  let lastTime = 0;
  let isVisible = true;
  let isRunning = false;
  
  const cleanup = observeElement(element, (visible) => {
    isVisible = visible;
    if (visible && isRunning && rafId === null) {
      // Resume animation
      lastTime = performance.now();
      loop(lastTime);
    }
  });
  
  const loop = (time: number) => {
    if (!isRunning || !isVisible) {
      rafId = null;
      return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    callback(deltaTime);
    
    rafId = requestAnimationFrame(loop);
  };
  
  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = performance.now();
      if (isVisible) {
        loop(lastTime);
      }
    },
    stop: () => {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    cleanup: () => {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cleanup();
    },
  };
}

export default useOffscreenAnimationPause;
