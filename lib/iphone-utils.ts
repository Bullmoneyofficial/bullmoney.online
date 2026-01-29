/**
 * iPhone Detection and Optimization Utilities
 * 
 * Provides helpers for detecting iPhone models, capabilities,
 * and optimizing content delivery based on device tier.
 */

export interface iPhoneInfo {
  isIPhone: boolean;
  model: string;
  tier: 'low' | 'medium' | 'high';
  isLowPowerMode: boolean;
  supportsProMotion: boolean;
  screenSize: {
    width: number;
    height: number;
  };
}

/**
 * Detect if the current device is an iPhone
 */
export const isIPhone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detect if the current device is an iPad
 */
export const isIPad = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Detect if running in iOS Safari
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
};

/**
 * Detect iPhone model based on screen dimensions
 */
export const getIPhoneModel = (): string => {
  if (typeof window === 'undefined') return 'Unknown';
  if (!isIPhone()) return 'Not an iPhone';
  
  const width = window.screen.width;
  const height = window.screen.height;
  const ratio = window.devicePixelRatio;
  
  // iPhone 16 Pro Max
  if (width === 430 && height === 932 && ratio === 3) return 'iPhone 16 Pro Max';
  
  // iPhone 16 Pro
  if (width === 393 && height === 852 && ratio === 3) return 'iPhone 16 Pro';
  
  // iPhone 16 / 15
  if (width === 393 && height === 852 && ratio === 3) return 'iPhone 16';
  
  // iPhone 15 Pro Max / 14 Pro Max
  if (width === 430 && height === 932) return 'iPhone 15 Pro Max';
  
  // iPhone 14 Plus
  if (width === 428 && height === 926) return 'iPhone 14 Plus';
  
  // iPhone 14 Pro / 13 Pro
  if (width === 390 && height === 844 && ratio === 3) return 'iPhone 14 Pro';
  
  // iPhone 14 / 13 / 12
  if (width === 390 && height === 844) return 'iPhone 14';
  
  // iPhone 13 mini / 12 mini
  if (width === 375 && height === 812 && ratio === 3) return 'iPhone 13 mini';
  
  // iPhone SE (3rd gen)
  if (width === 375 && height === 667 && ratio === 2) return 'iPhone SE';
  
  // iPhone 11 Pro Max / XS Max
  if (width === 414 && height === 896 && ratio === 3) return 'iPhone 11 Pro Max';
  
  // iPhone 11 / XR
  if (width === 414 && height === 896 && ratio === 2) return 'iPhone 11';
  
  // iPhone X / XS / 11 Pro
  if (width === 375 && height === 812 && ratio === 3) return 'iPhone X';
  
  // iPhone 8 Plus / 7 Plus / 6s Plus
  if (width === 414 && height === 736 && ratio === 3) return 'iPhone 8 Plus';
  
  // iPhone 8 / 7 / 6s
  if (width === 375 && height === 667 && ratio === 2) return 'iPhone 8';
  
  return 'iPhone (Unknown Model)';
};

/**
 * Get iPhone performance tier
 * - low: iPhone SE, 8, X (older models)
 * - medium: iPhone 11, 12, 13
 * - high: iPhone 14, 15, 16 Pro models
 */
export const getIPhoneTier = (): 'low' | 'medium' | 'high' => {
  if (typeof window === 'undefined') return 'high';
  
  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory;
  if (memory) {
    if (memory < 4) return 'low';
    if (memory < 6) return 'medium';
    return 'high';
  }
  
  // Check CPU cores
  const cores = navigator.hardwareConcurrency;
  if (cores) {
    if (cores < 6) return 'low';
    if (cores < 8) return 'medium';
    return 'high';
  }
  
  // Fallback: Check screen size (newer = larger)
  const width = window.screen.width;
  if (width >= 393) return 'high'; // iPhone 14+
  if (width >= 375) return 'medium'; // iPhone 11+
  return 'low';
};

/**
 * Detect if iOS Low Power Mode is likely enabled
 */
export const isLowPowerMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for reduced motion preference (often enabled in low power mode)
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  
  // Check for low refresh rate (60Hz in low power mode vs 120Hz ProMotion)
  const hasLowRefresh = 
    (window.screen as any).refreshRate && 
    (window.screen as any).refreshRate < 90;
  
  return prefersReducedMotion || hasLowRefresh;
};

/**
 * Check if device supports ProMotion (120Hz)
 */
export const supportsProMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const refreshRate = (window.screen as any).refreshRate;
  return refreshRate && refreshRate >= 120;
};

/**
 * Get comprehensive iPhone information
 */
export const getIPhoneInfo = (): iPhoneInfo => {
  return {
    isIPhone: isIPhone(),
    model: getIPhoneModel(),
    tier: getIPhoneTier(),
    isLowPowerMode: isLowPowerMode(),
    supportsProMotion: supportsProMotion(),
    screenSize: {
      width: typeof window !== 'undefined' ? window.screen.width : 0,
      height: typeof window !== 'undefined' ? window.screen.height : 0,
    },
  };
};

/**
 * Check if device has notch or Dynamic Island
 */
export const hasNotch = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for safe area insets
  const computedStyle = getComputedStyle(document.documentElement);
  const safeAreaTop = computedStyle.getPropertyValue('env(safe-area-inset-top)');
  
  return safeAreaTop !== '' && parseInt(safeAreaTop) > 20;
};

/**
 * Get optimal image quality based on device tier
 */
export const getOptimalImageQuality = (): number => {
  const tier = getIPhoneTier();
  const isLowPower = isLowPowerMode();
  
  if (isLowPower) return 70;
  
  switch (tier) {
    case 'low':
      return 75;
    case 'medium':
      return 80;
    case 'high':
      return 85;
    default:
      return 80;
  }
};

/**
 * Check if should use reduced quality for performance
 */
export const shouldReduceQuality = (): boolean => {
  return getIPhoneTier() === 'low' || isLowPowerMode();
};

/**
 * Check if should disable heavy animations
 */
export const shouldDisableAnimations = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    isLowPowerMode() ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

/**
 * Get optimal video quality based on device
 */
export const getOptimalVideoQuality = (): '480p' | '720p' | '1080p' => {
  const tier = getIPhoneTier();
  const isLowPower = isLowPowerMode();
  
  if (isLowPower || tier === 'low') return '480p';
  if (tier === 'medium') return '720p';
  return '1080p';
};

/**
 * Check if should lazy load 3D content
 */
export const shouldLazy3D = (): boolean => {
  const tier = getIPhoneTier();
  return tier === 'low' || isLowPowerMode();
};

/**
 * Get optimal polling interval for real-time updates
 */
export const getOptimalPollingInterval = (): number => {
  const tier = getIPhoneTier();
  const isLowPower = isLowPowerMode();
  
  if (isLowPower) return 10000; // 10 seconds
  
  switch (tier) {
    case 'low':
      return 5000; // 5 seconds
    case 'medium':
      return 3000; // 3 seconds
    case 'high':
      return 1000; // 1 second
    default:
      return 3000;
  }
};

/**
 * Check if device is in landscape mode
 */
export const isLandscape = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * Get safe area insets
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
};

/**
 * Detect if keyboard is visible (iOS)
 */
export const isKeyboardVisible = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.visualViewport
    ? window.visualViewport.height < window.innerHeight
    : false;
};

/**
 * Get connection speed
 */
export const getConnectionSpeed = (): 'slow' | 'medium' | 'fast' => {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return 'medium';
  }
  
  const connection = (navigator as any).connection;
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g') return 'medium';
  return 'slow';
};

/**
 * Check if should preload resources
 */
export const shouldPreload = (): boolean => {
  const speed = getConnectionSpeed();
  const tier = getIPhoneTier();
  
  return speed === 'fast' && (tier === 'high' || tier === 'medium');
};

/**
 * Get optimal number of items to render per page
 */
export const getOptimalPageSize = (): number => {
  const tier = getIPhoneTier();
  
  switch (tier) {
    case 'low':
      return 10;
    case 'medium':
      return 20;
    case 'high':
      return 30;
    default:
      return 20;
  }
};

/**
 * Check if running as PWA
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

/**
 * Vibrate device (haptic feedback)
 */
export const hapticFeedback = (pattern: number | number[] = 10): void => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * Request idle callback with fallback
 */
export const requestIdleCallback = (callback: () => void, timeout = 2000): void => {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
};

/**
 * Debounce function optimized for mobile
 */
export const mobileDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait = 150
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function optimized for mobile
 */
export const mobileThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit = 100
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
