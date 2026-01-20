"use client";

import React, { useEffect, useState, useRef } from 'react';

// ==========================================
// MOBILE PERFORMANCE OPTIMIZER
// ==========================================

/**
 * Mobile optimization utilities for heavy components
 * Handles memory management, frame rate optimization, and resource loading
 */

export interface MobileOptimizationConfig {
  /** Reduce animation complexity on mobile */
  simplifyAnimations?: boolean;
  /** Limit particle count on mobile */
  reduceParticles?: boolean;
  /** Lower image quality on mobile */
  compressImages?: boolean;
  /** Disable expensive effects */
  disableEffects?: boolean;
  /** Throttle scroll events */
  throttleScroll?: boolean;
  /** Debounce resize events */
  debounceResize?: boolean;
}

const DEFAULT_MOBILE_CONFIG: MobileOptimizationConfig = {
  simplifyAnimations: true,
  reduceParticles: true,
  compressImages: true,
  disableEffects: false,
  throttleScroll: true,
  debounceResize: true,
};

/**
 * Hook to detect device capabilities and apply optimizations
 */
export const useMobileOptimization = (config: MobileOptimizationConfig = {}) => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isLowEnd: false,
    hasReducedMotion: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    connectionType: 'unknown' as string,
    saveData: false,
  });

  const finalConfig = { ...DEFAULT_MOBILE_CONFIG, ...config };

  useEffect(() => {
    const updateDeviceInfo = () => {
      const isMobile = window.innerWidth < 768;
      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Detect low-end devices
      const isLowEnd =
        // @ts-ignore
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
        // @ts-ignore
        (navigator.deviceMemory && navigator.deviceMemory < 4) ||
        isMobile;

      // Detect connection type
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const connectionType = connection?.effectiveType || 'unknown';
      const saveData = connection?.saveData || false;

      setDeviceInfo({
        isMobile,
        isLowEnd,
        hasReducedMotion,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        connectionType,
        saveData,
      });
    };

    updateDeviceInfo();

    const handleResize = finalConfig.debounceResize
      ? debounce(updateDeviceInfo, 300)
      : updateDeviceInfo;

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [finalConfig.debounceResize]);

  // Calculate optimization levels
  const optimizationLevel = {
    shouldSimplifyAnimations:
      deviceInfo.isMobile && finalConfig.simplifyAnimations ||
      deviceInfo.hasReducedMotion ||
      deviceInfo.isLowEnd,

    shouldReduceParticles:
      deviceInfo.isMobile && finalConfig.reduceParticles ||
      deviceInfo.isLowEnd,

    shouldCompressImages:
      deviceInfo.isMobile && finalConfig.compressImages ||
      deviceInfo.saveData ||
      deviceInfo.connectionType === 'slow-2g' ||
      deviceInfo.connectionType === '2g',

    shouldDisableEffects:
      finalConfig.disableEffects ||
      deviceInfo.isLowEnd ||
      deviceInfo.hasReducedMotion,

    particleCount: deviceInfo.isLowEnd ? 15 : deviceInfo.isMobile ? 30 : 100,
    imageQuality: deviceInfo.saveData ? 'low' : deviceInfo.isMobile ? 'medium' : 'high',
    animationDuration: deviceInfo.hasReducedMotion ? 0.01 : deviceInfo.isMobile ? 0.3 : 0.6,
    fps: deviceInfo.isLowEnd ? 30 : 60,
  };

  return {
    deviceInfo,
    optimizationLevel,
    isMobile: deviceInfo.isMobile,
    isLowEnd: deviceInfo.isLowEnd,
    shouldOptimize: deviceInfo.isMobile || deviceInfo.isLowEnd,
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function for resize events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Request Idle Callback wrapper for non-critical tasks
 */
export const scheduleIdleTask = (callback: () => void, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    // @ts-ignore
    return requestIdleCallback(callback, { timeout });
  } else {
    return setTimeout(callback, 1);
  }
};

/**
 * Cancel idle callback
 */
export const cancelIdleTask = (handle: number) => {
  if ('cancelIdleCallback' in window) {
    // @ts-ignore
    cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
};

/**
 * Image loading strategy based on device
 */
export const getOptimizedImageProps = (
  src: string,
  deviceInfo: ReturnType<typeof useMobileOptimization>['deviceInfo']
) => {
  const quality = deviceInfo.saveData ? 50 : deviceInfo.isMobile ? 75 : 90;

  // Add image optimization query params if your CDN supports it
  const optimizedSrc = src.includes('?')
    ? `${src}&q=${quality}`
    : `${src}?q=${quality}`;

  return {
    src: optimizedSrc,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    // Use smaller sizes on mobile
    sizes: deviceInfo.isMobile
      ? '(max-width: 768px) 100vw, 768px'
      : '(max-width: 1200px) 100vw, 1200px',
  };
};

/**
 * Force garbage collection (if available) after heavy operations
 */
export const suggestGarbageCollection = () => {
  // @ts-ignore - gc is available in some environments
  if (typeof window !== 'undefined' && window.gc) {
    try {
      // @ts-ignore
      window.gc();
    } catch (e) {
      console.warn('GC not available');
    }
  }
};

/**
 * Cleanup unused resources
 */
export const cleanupResources = () => {
  // Clear any stored data that's no longer needed
  if (typeof window !== 'undefined') {
    // Clear old cache entries
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('old') || name.includes('temp')) {
            caches.delete(name);
          }
        });
      });
    }

    // Suggest garbage collection
    scheduleIdleTask(() => {
      suggestGarbageCollection();
    }, 5000);
  }
};

/**
 * Monitor performance and adjust settings dynamically
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    isOverloaded: false,
  });
  const isFrozenRef = useRef(false);

  useEffect(() => {
    // Listen for battery saver freeze/unfreeze events
    const handleFreeze = () => {
      isFrozenRef.current = true;
    };
    const handleUnfreeze = () => {
      isFrozenRef.current = false;
    };

    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);

    return () => {
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
    };
  }, []);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      // CRITICAL FIX: Keep RAF alive during battery saver freeze
      if (isFrozenRef.current) {
        try {
          document.documentElement.style.setProperty('--fps-monitor-mobile-active', '1');
        } catch (e) {}
      }

      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        // @ts-ignore
        const memory = performance.memory
          // @ts-ignore
          ? Math.round(performance.memory.usedJSHeapSize / 1048576)
          : 0;

        const isOverloaded = fps < 30;

        setMetrics({ fps, memory, isOverloaded });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return metrics;
};

/**
 * Optimize Spline scene loading on mobile
 */
export const getSplineOptimizations = (
  isMobile: boolean,
  isLowEnd: boolean
) => {
  return {
    // Reduce quality on mobile
    quality: isLowEnd ? 'low' : isMobile ? 'medium' : 'high',
    // Lower resolution
    scale: isLowEnd ? 0.5 : isMobile ? 0.75 : 1,
    // Disable shadows on low-end
    enableShadows: !isLowEnd,
    // Reduce anti-aliasing
    antialias: !isLowEnd,
    // Lower pixel ratio
    pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    // Disable ambient occlusion on mobile
    enableAO: !isMobile && !isLowEnd,
  };
};

/**
 * Preload critical resources
 */
export const preloadCriticalResources = (resources: string[]) => {
  if (typeof window === 'undefined') return;

  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';

    // Determine resource type
    if (resource.endsWith('.woff2') || resource.endsWith('.woff')) {
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    } else if (resource.endsWith('.jpg') || resource.endsWith('.png') || resource.endsWith('.webp')) {
      link.as = 'image';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    }

    link.href = resource;
    document.head.appendChild(link);
  });
};

/**
 * Viewport-based resource priority
 */
export const useViewportPriority = (elementRef: React.RefObject<HTMLElement>) => {
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('low');

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Visible
            setPriority('high');
          } else if (entry.boundingClientRect.top > 0 && entry.boundingClientRect.top < window.innerHeight * 2) {
            // Near viewport
            setPriority('medium');
          } else {
            // Far from viewport
            setPriority('low');
          }
        });
      },
      {
        rootMargin: '100% 0px 100% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return priority;
};
