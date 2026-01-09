/**
 * Performance Monitor - 2025 Edition
 *
 * Uses modern browser APIs:
 * - Performance Observer API
 * - Web Vitals (CLS, FID, LCP, FCP, TTFB)
 * - Long Tasks API
 * - Memory API
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetrics {
  // Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom metrics
  splineLoadTime?: number;
  totalLoadTime?: number;
  memoryUsage?: number;
  longTasks?: number;

  // Device info
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connection: string;
  gpu?: string;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  warnings: string[];
  score: number; // 0-100
}

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private warnings: string[] = [];
  private observers: PerformanceObserver[] = [];

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (typeof window === 'undefined') return;

    console.log('[PerformanceMonitor] Initializing...');

    // Detect device type
    this.metrics.deviceType = this.detectDeviceType();
    this.metrics.connection = this.getConnectionType();

    // Setup observers
    this.observeWebVitals();
    this.observeLongTasks();
    this.observeResources();
    this.observeMemory();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.generateReport();
      }
    });

    console.log('[PerformanceMonitor] Ready');
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals(): void {
    // LCP - Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;

        if (this.metrics.lcp > 2500) {
          this.warnings.push(`LCP is slow: ${this.metrics.lcp.toFixed(0)}ms (target: <2500ms)`);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('[PerformanceMonitor] LCP observer not supported');
    }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;

          if (this.metrics.fid > 100) {
            this.warnings.push(`FID is slow: ${this.metrics.fid.toFixed(0)}ms (target: <100ms)`);
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('[PerformanceMonitor] FID observer not supported');
    }

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;

        if (clsValue > 0.1) {
          this.warnings.push(`CLS is high: ${clsValue.toFixed(3)} (target: <0.1)`);
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('[PerformanceMonitor] CLS observer not supported');
    }

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;

            if (entry.startTime > 1800) {
              this.warnings.push(`FCP is slow: ${entry.startTime.toFixed(0)}ms (target: <1800ms)`);
            }
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('[PerformanceMonitor] FCP observer not supported');
    }

    // TTFB - Time to First Byte
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
      if (navigationEntry) {
        this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;

        if (this.metrics.ttfb > 600) {
          this.warnings.push(`TTFB is slow: ${this.metrics.ttfb.toFixed(0)}ms (target: <600ms)`);
        }
      }
    } catch (e) {
      console.warn('[PerformanceMonitor] TTFB not available');
    }
  }

  /**
   * Observe long tasks that block the main thread
   */
  private observeLongTasks(): void {
    try {
      let longTaskCount = 0;
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        longTaskCount += entries.length;
        this.metrics.longTasks = longTaskCount;

        if (longTaskCount > 10) {
          this.warnings.push(`Many long tasks detected: ${longTaskCount} (may cause jank)`);
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('[PerformanceMonitor] Long Task observer not supported');
    }
  }

  /**
   * Observe resource loading (including Spline scenes)
   */
  private observeResources(): void {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // Track Spline scene loads
          if (entry.name.includes('.splinecode')) {
            const loadTime = entry.responseEnd - entry.startTime;
            this.metrics.splineLoadTime = loadTime;

            console.log(`[PerformanceMonitor] Spline load: ${loadTime.toFixed(0)}ms`);

            if (loadTime > 3000) {
              this.warnings.push(`Spline scene loaded slowly: ${loadTime.toFixed(0)}ms`);
            }
          }
        });
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('[PerformanceMonitor] Resource observer not supported');
    }
  }

  /**
   * Monitor memory usage
   */
  private observeMemory(): void {
    if (typeof window === 'undefined') return;

    // Check periodically
    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        this.metrics.memoryUsage = usedMB;

        const percentUsed = (usedMB / totalMB) * 100;
        if (percentUsed > 90) {
          this.warnings.push(`High memory usage: ${usedMB.toFixed(0)}MB / ${totalMB.toFixed(0)}MB`);
        }

        console.log(`[PerformanceMonitor] Memory: ${usedMB.toFixed(0)}MB / ${totalMB.toFixed(0)}MB (${percentUsed.toFixed(0)}%)`);
      }
    };

    // Check every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory();
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;
    const width = window.innerWidth;

    if (/iPhone|iPod/.test(ua) || (width < 768 && /Mobile/.test(ua))) {
      return 'mobile';
    } else if (/iPad/.test(ua) || (width >= 768 && width < 1024)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    return connection?.effectiveType || '4g';
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculateScore(): number {
    let score = 100;

    // Deduct points for slow metrics
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      score -= Math.min(20, (this.metrics.lcp - 2500) / 100);
    }
    if (this.metrics.fid && this.metrics.fid > 100) {
      score -= Math.min(15, (this.metrics.fid - 100) / 10);
    }
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      score -= Math.min(15, (this.metrics.cls - 0.1) * 100);
    }
    if (this.metrics.fcp && this.metrics.fcp > 1800) {
      score -= Math.min(15, (this.metrics.fcp - 1800) / 100);
    }
    if (this.metrics.ttfb && this.metrics.ttfb > 600) {
      score -= Math.min(10, (this.metrics.ttfb - 600) / 50);
    }
    if (this.metrics.longTasks && this.metrics.longTasks > 5) {
      score -= Math.min(15, this.metrics.longTasks - 5);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: this.metrics as PerformanceMetrics,
      warnings: [...this.warnings],
      score: this.calculateScore()
    };

    console.log('[PerformanceMonitor] Report:', report);

    // Send to analytics if available
    if ((window as any).gtag) {
      (window as any).gtag('event', 'performance_report', {
        score: report.score,
        device_type: this.metrics.deviceType,
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls
      });
    }

    return report;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get warnings
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Mark a custom event
   */
  mark(name: string): void {
    try {
      performance.mark(name);
    } catch (e) {
      console.warn('[PerformanceMonitor] Failed to mark:', name);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const entries = performance.getEntriesByName(name, 'measure');
      return entries.length > 0 ? entries[entries.length - 1].duration : null;
    } catch (e) {
      console.warn('[PerformanceMonitor] Failed to measure:', name);
      return null;
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  performanceMonitor.initialize();
}

// Export utility hook for React
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

// React import for hook
import React from 'react';
