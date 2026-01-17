"use client";

/**
 * Ultra FPS Optimization Hooks - 2026 Performance Enhancement
 * 
 * These hooks provide maximum FPS optimization by:
 * 1. Detecting scroll state and pausing animations
 * 2. Using page visibility API to pause when tab is hidden
 * 3. Providing frame-budget aware animation triggers
 * 4. Detecting reduced motion preferences
 * 5. Managing will-change lifecycle
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// ============================================================================
// SCROLL STATE DETECTION - Pause animations during scroll
// ============================================================================

let isScrolling = false;
let scrollTimeout: NodeJS.Timeout | null = null;
const scrollListeners = new Set<(scrolling: boolean) => void>();

function initScrollDetection() {
  if (typeof window === 'undefined') return;
  
  // Already initialized
  if ((window as any).__scrollDetectionInit) return;
  (window as any).__scrollDetectionInit = true;
  
  const handleScroll = () => {
    if (!isScrolling) {
      isScrolling = true;
      document.documentElement.classList.add('is-scrolling');
      scrollListeners.forEach(cb => cb(true));
    }
    
    if (scrollTimeout) clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      document.documentElement.classList.remove('is-scrolling');
      scrollListeners.forEach(cb => cb(false));
    }, 150); // 150ms debounce
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Hook to detect scroll state - pause expensive animations during scroll
 */
export function useScrollState() {
  const [scrolling, setScrolling] = useState(false);
  
  useEffect(() => {
    initScrollDetection();
    
    scrollListeners.add(setScrolling);
    return () => {
      scrollListeners.delete(setScrolling);
    };
  }, []);
  
  return scrolling;
}

// ============================================================================
// PAGE VISIBILITY - Pause everything when tab is hidden
// ============================================================================

let pageVisible = true;
const visibilityListeners = new Set<(visible: boolean) => void>();

function initVisibilityDetection() {
  if (typeof document === 'undefined') return;
  
  if ((window as any).__visibilityDetectionInit) return;
  (window as any).__visibilityDetectionInit = true;
  
  const handleVisibilityChange = () => {
    pageVisible = document.visibilityState === 'visible';
    
    if (pageVisible) {
      document.documentElement.classList.remove('page-hidden');
    } else {
      document.documentElement.classList.add('page-hidden');
    }
    
    visibilityListeners.forEach(cb => cb(pageVisible));
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Hook to detect page visibility - pause all animations when hidden
 */
export function usePageVisibility() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    initVisibilityDetection();
    
    // Set initial state
    if (typeof document !== 'undefined') {
      setVisible(document.visibilityState === 'visible');
    }
    
    visibilityListeners.add(setVisible);
    return () => {
      visibilityListeners.delete(setVisible);
    };
  }, []);
  
  return visible;
}

// ============================================================================
// INTERACTION STATE - Simplify UI during active interaction
// ============================================================================

let isInteracting = false;
let interactionTimeout: NodeJS.Timeout | null = null;
const interactionListeners = new Set<(interacting: boolean) => void>();

function initInteractionDetection() {
  if (typeof window === 'undefined') return;
  
  if ((window as any).__interactionDetectionInit) return;
  (window as any).__interactionDetectionInit = true;
  
  const handleInteractionStart = () => {
    if (!isInteracting) {
      isInteracting = true;
      document.documentElement.classList.add('is-interacting');
      interactionListeners.forEach(cb => cb(true));
    }
    
    if (interactionTimeout) clearTimeout(interactionTimeout);
    
    interactionTimeout = setTimeout(() => {
      isInteracting = false;
      document.documentElement.classList.remove('is-interacting');
      interactionListeners.forEach(cb => cb(false));
    }, 100);
  };
  
  window.addEventListener('pointerdown', handleInteractionStart, { passive: true });
  window.addEventListener('pointermove', handleInteractionStart, { passive: true });
  window.addEventListener('touchstart', handleInteractionStart, { passive: true });
  window.addEventListener('touchmove', handleInteractionStart, { passive: true });
}

/**
 * Hook to detect active interaction
 */
export function useInteractionState() {
  const [interacting, setInteracting] = useState(false);
  
  useEffect(() => {
    initInteractionDetection();
    
    interactionListeners.add(setInteracting);
    return () => {
      interactionListeners.delete(setInteracting);
    };
  }, []);
  
  return interacting;
}

// ============================================================================
// FRAME BUDGET AWARE RENDERING
// ============================================================================

const FRAME_BUDGET_MS = 16.67; // 60fps target
const SAFE_BUDGET_MS = 8; // Leave 8ms for browser work

/**
 * Hook to track if we're within frame budget
 * Only trigger expensive operations when budget allows
 */
export function useFrameBudget() {
  const frameStartRef = useRef(0);
  const budgetExceededRef = useRef(false);
  
  const startFrame = useCallback(() => {
    frameStartRef.current = performance.now();
    budgetExceededRef.current = false;
  }, []);
  
  const checkBudget = useCallback(() => {
    const elapsed = performance.now() - frameStartRef.current;
    budgetExceededRef.current = elapsed > SAFE_BUDGET_MS;
    return !budgetExceededRef.current;
  }, []);
  
  const getRemainingBudget = useCallback(() => {
    const elapsed = performance.now() - frameStartRef.current;
    return Math.max(0, SAFE_BUDGET_MS - elapsed);
  }, []);
  
  return {
    startFrame,
    checkBudget,
    getRemainingBudget,
    isExceeded: () => budgetExceededRef.current,
  };
}

// ============================================================================
// WILL-CHANGE LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Hook to properly manage will-change for animations
 * Adds will-change before animation, removes after
 */
export function useWillChange<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  
  const prepareAnimation = useCallback((properties: string[] = ['transform', 'opacity']) => {
    if (ref.current) {
      ref.current.style.willChange = properties.join(', ');
    }
  }, []);
  
  const completeAnimation = useCallback(() => {
    if (ref.current) {
      ref.current.style.willChange = 'auto';
    }
  }, []);
  
  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (ref.current) {
        ref.current.style.willChange = 'auto';
      }
    };
  }, []);
  
  return { ref, prepareAnimation, completeAnimation };
}

// ============================================================================
// REDUCED MOTION PREFERENCE
// ============================================================================

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}

// ============================================================================
// COMBINED ULTRA OPTIMIZATION HOOK
// ============================================================================

/**
 * Master hook that combines all optimization states
 * Use this for components that need comprehensive FPS optimization
 */
export function useUltraFpsOptimization() {
  const isScrolling = useScrollState();
  const isPageVisible = usePageVisibility();
  const isInteracting = useInteractionState();
  const prefersReducedMotion = useReducedMotion();
  const frameBudget = useFrameBudget();
  
  // Compute if animations should be enabled
  const shouldAnimate = useMemo(() => {
    // Never animate if user prefers reduced motion
    if (prefersReducedMotion) return false;
    
    // Never animate if page is hidden
    if (!isPageVisible) return false;
    
    // Pause during scroll for smoother scrolling
    if (isScrolling) return false;
    
    return true;
  }, [prefersReducedMotion, isPageVisible, isScrolling]);
  
  // Compute if expensive effects should render
  const shouldRenderExpensiveEffects = useMemo(() => {
    if (!shouldAnimate) return false;
    if (isInteracting) return false;
    return true;
  }, [shouldAnimate, isInteracting]);
  
  return {
    isScrolling,
    isPageVisible,
    isInteracting,
    prefersReducedMotion,
    shouldAnimate,
    shouldRenderExpensiveEffects,
    frameBudget,
  };
}

// ============================================================================
// RAF-BASED ANIMATION CONTROLLER
// ============================================================================

/**
 * Hook for RAF-based animations with automatic pause/resume
 */
export function useOptimizedAnimation(
  callback: (deltaTime: number) => void,
  enabled: boolean = true
) {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isScrolling = useScrollState();
  const isPageVisible = usePageVisibility();
  
  const shouldRun = enabled && isPageVisible && !isScrolling;
  
  useEffect(() => {
    if (!shouldRun) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      callback(deltaTime);
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [shouldRun, callback]);
}

// ============================================================================
// THROTTLED CALLBACK HOOK
// ============================================================================

/**
 * Hook that throttles callbacks to maintain target FPS
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  targetFps: number = 60
): T {
  const lastCallRef = useRef(0);
  const minInterval = 1000 / targetFps;
  
  const throttled = useCallback((...args: Parameters<T>) => {
    const now = performance.now();
    
    if (now - lastCallRef.current >= minInterval) {
      lastCallRef.current = now;
      return callback(...args);
    }
  }, [callback, minInterval]) as T;
  
  return throttled;
}

// ============================================================================
// DEBOUNCED RESIZE HANDLER
// ============================================================================

/**
 * Hook for debounced resize handling - prevents layout thrashing
 */
export function useDebouncedResize(
  callback: (width: number, height: number) => void,
  delay: number = 150
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        callback(window.innerWidth, window.innerHeight);
      }, delay);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial call
    callback(window.innerWidth, window.innerHeight);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [callback, delay]);
}

export default useUltraFpsOptimization;
