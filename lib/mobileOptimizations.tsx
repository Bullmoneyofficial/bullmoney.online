// ============================================================================
// MOBILE OPTIMIZATION UTILITIES
// Comprehensive mobile performance & cross-browser compatibility
// ============================================================================

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  supportsTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isLandscape: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    supportsTouch: false,
    screenWidth: 1920,
    screenHeight: 1080,
    devicePixelRatio: 1,
    isLandscape: true,
  });

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Device type detection
      const isMobile = width < 768 || /iPhone|iPod|Android.*Mobile/i.test(ua);
      const isTablet = !isMobile && (width < 1024 || /iPad|Android(?!.*Mobile)/i.test(ua));
      const isDesktop = !isMobile && !isTablet;

      // OS detection
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);

      // Browser detection
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
      const isFirefox = /Firefox/.test(ua);

      // Touch support
      const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isFirefox,
        supportsTouch,
        screenWidth: width,
        screenHeight: height,
        devicePixelRatio: window.devicePixelRatio || 1,
        isLandscape: width > height,
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return deviceInfo;
}

// ============================================================================
// LAZY LOADING FOR IMAGES
// ============================================================================

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E',
  threshold = 0.1,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentSrc(src);
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src, threshold]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt || "Image"}
      className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      loading="lazy"
      {...props}
    />
  );
};

// ============================================================================
// TOUCH FEEDBACK COMPONENT
// ============================================================================

interface TouchFeedbackProps {
  children: React.ReactNode;
  onTap?: () => void;
  hapticFeedback?: boolean;
  soundFeedback?: boolean;
  className?: string;
  activeScale?: number;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  onTap,
  hapticFeedback = true,
  soundFeedback: _soundFeedback = false,
  className = '',
  activeScale = 0.95,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (onTap) onTap();
  }, [onTap]);

  return (
    <div
      className={`${className} transition-transform duration-100 ${isPressed ? `scale-${Math.floor(activeScale * 100)}` : 'scale-100'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      style={{
        transform: isPressed ? `scale(${activeScale})` : 'scale(1)',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// PULL TO REFRESH
// ============================================================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  maxPullDown?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  maxPullDown = 150,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing || !e.touches[0]) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.min(currentY - startY.current, maxPullDown);

      if (distance > 0) {
        setPullDistance(distance);
      }
    },
    [isRefreshing, maxPullDown]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate([20, 10, 20]);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance * 0.5}px)`,
        transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
      }}
    >
      {pullDistance > threshold && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      {children}
    </div>
  );
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // BUG FIX #28: Feature detection for PerformanceObserver
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('[PerformanceMonitoring] PerformanceObserver API not supported');
      return;
    }

    // BUG FIX #27: Track all resources for proper cleanup
    let loadHandler: (() => void) | null = null;
    let observer: PerformanceObserver | null = null;
    let clsObserver: PerformanceObserver | null = null;

    try {
      // Monitor First Contentful Paint (FCP)
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}: ${entry.startTime}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    } catch (error) {
      console.warn('[PerformanceMonitoring] Failed to create paint observer:', error);
    }

    // Monitor Cumulative Layout Shift (CLS)
    let clsScore = 0;
    try {
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('[PerformanceMonitoring] Failed to create layout-shift observer:', error);
    }

    // Log performance metrics after page load
    loadHandler = () => {
      setTimeout(() => {
        try {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            console.log('Performance Metrics:', {
              'DNS Lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
              'TCP Connection': perfData.connectEnd - perfData.connectStart,
              'TTFB': perfData.responseStart - perfData.requestStart,
              'DOM Load': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              'Page Load': perfData.loadEventEnd - perfData.loadEventStart,
              'CLS Score': clsScore.toFixed(4),
            });
          }
        } catch (e) {
          console.warn('[PerformanceMonitoring] Error logging metrics:', e);
        }
      }, 0);
    };

    window.addEventListener('load', loadHandler);

    // BUG FIX #27 ENHANCED: Comprehensive cleanup with null checks
    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (clsObserver) {
        clsObserver.disconnect();
        clsObserver = null;
      }
      if (loadHandler) {
        window.removeEventListener('load', loadHandler);
        loadHandler = null;
      }
    };
  }, []);
}

// ============================================================================
// VIEWPORT MANAGER (iOS Safari fix)
// ============================================================================

export function useViewportFix() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // iOS Safari viewport height fix
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const metaViewport = document.querySelector('meta[name=viewport]');
      if (metaViewport) {
        metaViewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        );
      }
    }

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}

// ============================================================================
// NETWORK DETECTION
// ============================================================================

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    const updateConnectionType = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    updateOnlineStatus();
    updateConnectionType();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
}

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('2xl');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < breakpoints.sm) setBreakpoint('xs');
      else if (width < breakpoints.md) setBreakpoint('sm');
      else if (width < breakpoints.lg) setBreakpoint('md');
      else if (width < breakpoints.xl) setBreakpoint('lg');
      else if (width < breakpoints['2xl']) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// ============================================================================
// SAFE AREA INSETS (for notched devices)
// ============================================================================

export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);

    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}
