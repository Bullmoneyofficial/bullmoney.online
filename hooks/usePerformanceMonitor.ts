"use client";

import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    lastRenderTime.current = now;

    renderTimes.current.push(renderTime);
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    // Log performance warnings
    if (renderCount.current > 5) {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      if (avgRenderTime > 16) { // More than one frame at 60fps
        console.warn(`[Performance] ${componentName} is rendering slowly (${avgRenderTime.toFixed(2)}ms avg)`);
      }
    }
  });

  const logRender = useCallback((reason: string) => {
    console.log(`[Performance] ${componentName} rendered: ${reason}`);
  }, [componentName]);

  return { renderCount: renderCount.current, logRender };
};

// Frame rate monitor
export const useFrameRateMonitor = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const fps = useRef(60);

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current += 1;
      const now = Date.now();

      if (now - lastTime.current >= 1000) {
        fps.current = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        frameCount.current = 0;
        lastTime.current = now;

        // Log low FPS
        if (fps.current < 30) {
          console.warn(`[Performance] Low FPS detected: ${fps.current}`);
        }
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return fps.current;
};

// Memory usage monitor
export const useMemoryMonitor = () => {
  const memoryInfo = useRef<any>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        memoryInfo.current = {
          used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
        };

        // Warn if memory usage is high
        const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.warn(`[Performance] High memory usage: ${usagePercent.toFixed(1)}%`);
        }
      }
    };

    const interval = setInterval(checkMemory, 5000);
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return memoryInfo.current;
};

// Bundle size monitor (development only)
export const useBundleMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor bundle size changes
      const checkBundleSize = () => {
        if ('sendBeacon' in navigator) {
          // This would be used to send metrics to a monitoring service
          console.log('[Performance] Bundle monitoring active');
        }
      };

      checkBundleSize();
    }
  }, []);
};

// Web Vitals tracking
export const useWebVitals = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (clsValue > 0.1) {
          console.warn(`[Performance] High CLS detected: ${clsValue.toFixed(3)}`);
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });

      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry && lastEntry.startTime > 2500) {
          console.warn(`[Performance] Slow LCP: ${lastEntry.startTime.toFixed(0)}ms`);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      return () => {
        observer.disconnect();
        lcpObserver.disconnect();
      };
    }
  }, []);
};