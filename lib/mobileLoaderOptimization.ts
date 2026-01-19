/**
 * Mobile Loader Optimization - Defers heavy loader components on mobile
 * Reduces initial paint time and improves FPS on low-end devices
 */

import React from 'react';
import { isMobileDevice, getDeviceType } from './mobileDetection';

interface LoaderDeferConfig {
  enabled: boolean;
  delay?: number;
  useIdleCallback?: boolean;
  useIntersectionObserver?: boolean;
}

/**
 * Check if loader should be deferred on mobile
 */
export const shouldDeferLoaderOnMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return isMobileDevice();
};

/**
 * Get optimal delay for mobile loader based on device performance
 */
export const getLoaderDeferDelay = (): number => {
  if (typeof window === 'undefined') return 0;

  const deviceType = getDeviceType();
  const connection = (navigator as any).connection;

  // Check for slow 3G/4G connections
  const isSlowConnection = connection && 
    (connection.effectiveType === '3g' || connection.effectiveType === '4g' && connection.saveData);

  switch (deviceType) {
    case 'mobile':
      // Defer longer on mobile with slow connection
      return isSlowConnection ? 2500 : 1500;
    case 'tablet':
      return isSlowConnection ? 1500 : 800;
    default:
      return 0; // Don't defer on desktop
  }
};

/**
 * Defer callback handler for mobile loader
 */
export const scheduleLoaderOnMobile = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') {
    callback();
    return () => {};
  }

  if (!shouldDeferLoaderOnMobile()) {
    callback();
    return () => {};
  }

  const delay = getLoaderDeferDelay();
  let timeoutId: NodeJS.Timeout;

  if ('requestIdleCallback' in window) {
    // Prefer requestIdleCallback for better performance
    const idleCallbackId = (window as any).requestIdleCallback(
      () => {
        // Still add small delay to ensure page is interactive first
        timeoutId = setTimeout(callback, 100);
      },
      { timeout: delay + 500 }
    );

    return () => {
      (window as any).cancelIdleCallback(idleCallbackId);
      clearTimeout(timeoutId);
    };
  } else {
    // Fallback to setTimeout
    timeoutId = setTimeout(callback, delay);
    return () => clearTimeout(timeoutId);
  }
};

/**
 * Monitor memory usage to decide if loader should be deferred further
 */
export const getMemoryBasedLoaderDelay = (): number => {
  if (typeof navigator === 'undefined' || !(navigator as any).deviceMemory) {
    return getLoaderDeferDelay();
  }

  const deviceMemory = (navigator as any).deviceMemory;
  
  // deviceMemory is in GB
  if (deviceMemory <= 2) {
    return 3000; // Aggressive deferral for low-memory devices
  } else if (deviceMemory <= 4) {
    return 2000; // Moderate deferral
  } else {
    return 1000; // Minimal deferral for high-memory devices
  }
};

/**
 * Get optimal settings for multi-step loader on mobile
 */
export const getMobileLoaderConfig = () => {
  const isMobile = shouldDeferLoaderOnMobile();
  
  return {
    isMobile,
    deferDelay: getMemoryBasedLoaderDelay(),
    shouldRenderInPortal: isMobile, // Render in portal on mobile to reduce main thread work
    reduceAnimations: isMobile, // Reduce framer-motion complexity
    skipMultiStep: false, // Still show loader, just optimized
  };
};
