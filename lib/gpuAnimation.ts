"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePerformanceStore } from '@/stores/performanceStore';

// ============================================================================
// GPU ANIMATION UTILITIES - 120Hz Optimized
// ============================================================================

/**
 * Frame Budget for 120Hz: 8.33ms
 * Frame Budget for 60Hz: 16.67ms
 * 
 * All animations must complete within the frame budget
 * to prevent dropped frames and maintain smooth motion
 */

export interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  fps?: number;
}

// Optimized easing functions (computed once)
export const Easing = {
  // Standard easings
  linear: (t: number) => t,
  
  // Quadratic
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // Cubic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Exponential (smooth for 120Hz)
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  
  // Spring-like (perfect for UI)
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Smooth deceleration (best for scrolling)
  smoothstep: (t: number) => t * t * (3 - 2 * t),
} as const;

/**
 * GPU-accelerated animation using RAF
 * Only animates transform and opacity (GPU-composited properties)
 */
export function useGPUAnimation() {
  const rafRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const { refreshRate } = usePerformanceStore();
  
  const animate = useCallback((
    element: HTMLElement,
    keyframes: {
      transform?: { from: string; to: string };
      opacity?: { from: number; to: number };
    },
    options: AnimationOptions = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      const {
        duration = 300,
        easing = Easing.easeOutCubic,
        onUpdate,
        onComplete,
        fps = refreshRate
      } = options;
      
      const frameInterval = 1000 / fps;
      let startTime: number | null = null;
      let lastFrameTime = 0;
      
      // Promote element to GPU layer
      element.style.willChange = 'transform, opacity';
      
      isAnimatingRef.current = true;
      
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        
        // Frame rate limiting for consistent animation
        if (timestamp - lastFrameTime < frameInterval * 0.8) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        lastFrameTime = timestamp;
        
        const elapsed = timestamp - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const progress = easing(rawProgress);
        
        // Apply GPU-only transforms
        if (keyframes.transform) {
          // Interpolate transform values
          element.style.transform = interpolateTransform(
            keyframes.transform.from,
            keyframes.transform.to,
            progress
          );
        }
        
        if (keyframes.opacity !== undefined) {
          element.style.opacity = String(
            keyframes.opacity.from + 
            (keyframes.opacity.to - keyframes.opacity.from) * progress
          );
        }
        
        onUpdate?.(progress);
        
        if (rawProgress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          // Animation complete - remove will-change to free GPU memory
          element.style.willChange = 'auto';
          isAnimatingRef.current = false;
          onComplete?.();
          resolve();
        }
      };
      
      rafRef.current = requestAnimationFrame(step);
    });
  }, [refreshRate]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  return { animate, isAnimating: isAnimatingRef.current };
}

/**
 * Interpolate between transform strings
 */
function interpolateTransform(from: string, to: string, progress: number): string {
  // Parse transform values
  const fromValues = parseTransform(from);
  const toValues = parseTransform(to);
  
  const result: string[] = [];
  
  // Interpolate each transform function
  for (const key of Object.keys(toValues)) {
    const fromVal = fromValues[key] ?? getDefaultTransformValue(key);
    const toVal = toValues[key];
    
    if (Array.isArray(toVal)) {
      // Handle functions with multiple values (e.g., translate3d)
      const interpolated = toVal.map((v, i) => {
        const fromV = Array.isArray(fromVal) ? fromVal[i] : 0;
        return fromV + (v - fromV) * progress;
      });
      result.push(`${key}(${interpolated.join(', ')})`);
    } else if (typeof toVal === 'number') {
      const fromNum = typeof fromVal === 'number' ? fromVal : 0;
      const interpolated = fromNum + (toVal - fromNum) * progress;
      result.push(`${key}(${interpolated})`);
    }
  }
  
  return result.join(' ') || 'none';
}

/**
 * Parse transform string into object
 */
function parseTransform(transform: string): Record<string, number | number[]> {
  const result: Record<string, number | number[]> = {};
  
  const regex = /(\w+)\(([^)]+)\)/g;
  let match;
  
  while ((match = regex.exec(transform)) !== null) {
    const [, fn, values] = match;
    const nums = values.split(',').map(v => parseFloat(v.trim()) || 0);
    result[fn] = nums.length === 1 ? nums[0] : nums;
  }
  
  return result;
}

/**
 * Get default transform value
 */
function getDefaultTransformValue(fn: string): number | number[] {
  switch (fn) {
    case 'translateX':
    case 'translateY':
    case 'translateZ':
      return 0;
    case 'translate3d':
      return [0, 0, 0];
    case 'scale':
    case 'scaleX':
    case 'scaleY':
      return 1;
    case 'scale3d':
      return [1, 1, 1];
    case 'rotate':
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
      return 0;
    default:
      return 0;
  }
}

// ============================================================================
// SCROLL-LINKED ANIMATIONS (GPU-Only)
// ============================================================================

export interface ScrollAnimationConfig {
  target: HTMLElement | null;
  start: number; // scroll position to start (px or viewport %)
  end: number;   // scroll position to end
  transform?: {
    from: string;
    to: string;
  };
  opacity?: {
    from: number;
    to: number;
  };
}

/**
 * Hook for scroll-linked GPU animations
 * Uses transient scroll values for zero re-renders
 */
export function useScrollAnimation(config: ScrollAnimationConfig) {
  const rafRef = useRef<number>(0);
  
  useEffect(() => {
    const { target, start, end, transform, opacity } = config;
    if (!target) return;
    
    // Promote to GPU layer
    target.style.willChange = 'transform, opacity';
    
    // Use Zustand's getState() for transient updates (no re-render)
    const unsubscribe = usePerformanceStore.subscribe(
      (state) => state._transientScrollY,
      (scrollY) => {
        // Calculate progress based on scroll position
        const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
        
        // Apply GPU-only properties
        if (transform) {
          target.style.transform = interpolateTransform(
            transform.from,
            transform.to,
            progress
          );
        }
        
        if (opacity) {
          target.style.opacity = String(
            opacity.from + (opacity.to - opacity.from) * progress
          );
        }
      }
    );
    
    return () => {
      unsubscribe();
      target.style.willChange = 'auto';
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config]);
}
