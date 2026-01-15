"use client";

/**
 * OptimizedWrapper - Global Performance Optimization Component
 *
 * A React wrapper that provides FPS-aware rendering and device-tier optimizations.
 * Use this to wrap heavy components that need performance optimization.
 *
 * Features:
 * - Intersection Observer for lazy loading
 * - FPS-aware quality degradation
 * - Device tier awareness from CacheManager
 * - Automatic animation pausing during scroll
 * - Memory-efficient unmounting when off-screen
 *
 * Usage:
 * ```tsx
 * <OptimizedWrapper
 *   lazyLoad
 *   onLowFPS="reduce-quality"
 *   placeholder={<ShimmerSpinner />}
 * >
 *   <HeavyComponent />
 * </OptimizedWrapper>
 * ```
 */

import React, {
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
  CSSProperties,
} from 'react';
import { useCacheContext, useDeviceTier } from './CacheManagerProvider';

// Quality levels for adaptive rendering
export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

// Behavior when FPS drops
export type LowFPSBehavior =
  | 'reduce-quality'  // Reduce animation quality
  | 'pause-animations' // Pause all animations
  | 'hide'            // Hide component entirely
  | 'none';           // No action

interface OptimizedWrapperProps {
  children: ReactNode;

  // Lazy loading options
  lazyLoad?: boolean;
  rootMargin?: string; // IntersectionObserver margin (e.g., '200px')
  threshold?: number;  // Visibility threshold (0-1)

  // Performance options
  onLowFPS?: LowFPSBehavior;
  minFPS?: number;            // FPS threshold for triggering low FPS behavior
  unmountWhenHidden?: boolean; // Unmount children when not visible
  keepAliveTime?: number;     // Time in ms to keep mounted after leaving viewport

  // Placeholders
  placeholder?: ReactNode;
  loadingPlaceholder?: ReactNode;

  // Device tier restrictions
  disableOn?: ('minimal' | 'low')[]; // Disable on specific device tiers
  fallback?: ReactNode;              // Fallback for disabled devices

  // Styling
  className?: string;
  style?: CSSProperties;
  containerStyle?: CSSProperties;

  // Callbacks
  onVisible?: () => void;
  onHidden?: () => void;
  onQualityChange?: (quality: QualityLevel) => void;
}

// FPS monitoring hook
function useFPSMonitor(enabled: boolean, threshold: number) {
  const [isLowFPS, setIsLowFPS] = useState(false);
  const [currentFPS, setCurrentFPS] = useState(60);
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let animationId: number;
    let running = true;

    const measure = () => {
      if (!running) return;

      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        fpsHistoryRef.current.push(fps);

        if (fpsHistoryRef.current.length > 5) {
          fpsHistoryRef.current.shift();
        }

        const avgFps =
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) /
          fpsHistoryRef.current.length;

        setCurrentFPS(Math.round(avgFps));
        setIsLowFPS(avgFps < threshold);

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(measure);
    };

    // Delay start to let page settle
    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(measure);
    }, 3000);

    return () => {
      running = false;
      clearTimeout(timeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [enabled, threshold]);

  return { isLowFPS, currentFPS };
}

// Visibility observer hook
function useVisibilityObserver(
  ref: React.RefObject<HTMLElement | null>,
  options: { rootMargin: string; threshold: number; enabled: boolean }
) {
  const [isVisible, setIsVisible] = useState(!options.enabled);
  const [hasBeenVisible, setHasBeenVisible] = useState(!options.enabled);

  useEffect(() => {
    if (!options.enabled || !ref.current) {
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      },
      {
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options.rootMargin, options.threshold, options.enabled]);

  return { isVisible, hasBeenVisible };
}

function OptimizedWrapperComponent({
  children,
  lazyLoad = false,
  rootMargin = '200px',
  threshold = 0,
  onLowFPS = 'none',
  minFPS = 30,
  unmountWhenHidden = false,
  keepAliveTime = 2000,
  placeholder,
  loadingPlaceholder,
  disableOn = [],
  fallback,
  className = '',
  style,
  containerStyle,
  onVisible,
  onHidden,
  onQualityChange,
}: OptimizedWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { deviceTier } = useCacheContext();
  const { isLowEnd, isHighEnd } = useDeviceTier();
  const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if disabled for this device tier
  const isDisabled = disableOn.includes(deviceTier as 'minimal' | 'low');

  // Visibility tracking
  const { isVisible, hasBeenVisible } = useVisibilityObserver(containerRef, {
    rootMargin,
    threshold,
    enabled: lazyLoad,
  });

  // FPS monitoring (only when component is visible)
  const { isLowFPS, currentFPS } = useFPSMonitor(
    onLowFPS !== 'none' && isVisible,
    minFPS
  );

  // Track mounted state for delayed unmount
  const [isMounted, setIsMounted] = useState(!lazyLoad);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      // Cancel any pending unmount
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
        unmountTimeoutRef.current = null;
      }
      setIsMounted(true);
      onVisible?.();
    } else {
      onHidden?.();
      if (unmountWhenHidden) {
        // Delay unmount to prevent flicker
        unmountTimeoutRef.current = setTimeout(() => {
          setIsMounted(false);
        }, keepAliveTime);
      }
    }

    return () => {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
    };
  }, [isVisible, unmountWhenHidden, keepAliveTime, onVisible, onHidden]);

  // Calculate quality level based on FPS and device tier
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('high');

  useEffect(() => {
    let quality: QualityLevel;

    if (isLowFPS && onLowFPS === 'reduce-quality') {
      quality = currentFPS < 20 ? 'minimal' : 'low';
    } else if (deviceTier === 'ultra') {
      quality = 'ultra';
    } else if (deviceTier === 'high') {
      quality = 'high';
    } else if (deviceTier === 'medium') {
      quality = 'medium';
    } else {
      quality = 'low';
    }

    if (quality !== qualityLevel) {
      setQualityLevel(quality);
      onQualityChange?.(quality);
    }
  }, [isLowFPS, currentFPS, deviceTier, onLowFPS, qualityLevel, onQualityChange]);

  // Apply low FPS behavior
  const getLowFPSStyles = useCallback((): CSSProperties => {
    if (!isLowFPS) return {};

    switch (onLowFPS) {
      case 'pause-animations':
        return { animationPlayState: 'paused' };
      case 'hide':
        return { opacity: 0, visibility: 'hidden' };
      case 'reduce-quality':
        return { filter: 'blur(1px)', opacity: 0.95 };
      default:
        return {};
    }
  }, [isLowFPS, onLowFPS]);

  // Disabled fallback
  if (isDisabled) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
        data-optimized="disabled"
        data-device-tier={deviceTier}
      >
        {fallback || placeholder || null}
      </div>
    );
  }

  // Not yet visible (lazy loading)
  if (lazyLoad && !hasBeenVisible) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ ...containerStyle, minHeight: '100px' }}
        data-optimized="pending"
        data-device-tier={deviceTier}
      >
        {loadingPlaceholder || placeholder || null}
      </div>
    );
  }

  // Visible or was visible
  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      data-optimized="active"
      data-quality={qualityLevel}
      data-device-tier={deviceTier}
      data-visible={isVisible}
    >
      {isMounted ? (
        <div
          style={{ ...style, ...getLowFPSStyles() }}
          className={`optimized-content quality-${qualityLevel}`}
        >
          {children}
        </div>
      ) : (
        placeholder || null
      )}
    </div>
  );
}

export const OptimizedWrapper = memo(OptimizedWrapperComponent);

/**
 * withOptimization HOC
 *
 * Higher-order component for wrapping any component with optimization features.
 *
 * Usage:
 * ```tsx
 * const OptimizedNavbar = withOptimization(Navbar, {
 *   lazyLoad: false,
 *   onLowFPS: 'reduce-quality',
 * });
 * ```
 */
export function withOptimization<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  optimizationOptions: Omit<OptimizedWrapperProps, 'children'>
) {
  const OptimizedComponent = (props: P) => (
    <OptimizedWrapper {...optimizationOptions}>
      <WrappedComponent {...props} />
    </OptimizedWrapper>
  );

  OptimizedComponent.displayName = `Optimized(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return memo(OptimizedComponent);
}

/**
 * useOptimizedRendering Hook
 *
 * Hook for components that need to manage their own optimization.
 *
 * Usage:
 * ```tsx
 * const { shouldRender, quality, isVisible } = useOptimizedRendering({
 *   lazyLoad: true,
 *   ref: containerRef,
 * });
 * ```
 */
export function useOptimizedRendering(options: {
  lazyLoad?: boolean;
  ref?: React.RefObject<HTMLElement>;
  fpsThreshold?: number;
}) {
  const { deviceTier } = useCacheContext();
  const { isLowEnd, isHighEnd } = useDeviceTier();
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [isVisible, setIsVisible] = useState(!options.lazyLoad);

  // Simple device-based quality
  useEffect(() => {
    if (deviceTier === 'ultra') setQuality('ultra');
    else if (deviceTier === 'high') setQuality('high');
    else if (deviceTier === 'medium') setQuality('medium');
    else setQuality('low');
  }, [deviceTier]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!options.lazyLoad || !options.ref?.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '200px' }
    );

    observer.observe(options.ref.current);
    return () => observer.disconnect();
  }, [options.lazyLoad, options.ref]);

  return {
    shouldRender: isVisible,
    quality,
    isVisible,
    deviceTier,
    isLowEnd,
    isHighEnd,
  };
}

export default OptimizedWrapper;
