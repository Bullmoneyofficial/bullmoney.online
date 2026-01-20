/**
 * Browser Compatibility & FPS Integration
 * 
 * Handles:
 * - Browser-specific FPS measurement quirks
 * - Fallback strategies for unsupported APIs
 * - Cross-device measurement adaptation
 * - Performance observer integration
 */

import {
  FpsMeasurementEngine,
  FpsMeasurementConfig,
  FrameMetrics,
} from './FpsMeasurement';

// ============================================================================
// BROWSER DETECTION & CAPABILITIES
// ============================================================================

export interface BrowserCapabilities {
  supportsHighResTimer: boolean;
  supportsPerformanceObserver: boolean;
  supportsSchedulerAPI: boolean;
  supportsIdle: boolean;
  isSafari: boolean;
  isMobileSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  version: number;
  devicePixelRatio: number;
  platformMemory: number;
  cpuCores: number;
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  const ua = navigator.userAgent.toLowerCase();
  const nav = navigator as any;

  return {
    supportsHighResTimer:
      typeof performance !== 'undefined' &&
      typeof performance.now === 'function' &&
      performance.now() > 0,
    supportsPerformanceObserver:
      typeof PerformanceObserver !== 'undefined',
    supportsSchedulerAPI: 'scheduler' in window && 'yield' in (window as any).scheduler,
    supportsIdle: 'requestIdleCallback' in window,
    isSafari: /^((?!chrome|android).)*safari/.test(ua),
    isMobileSafari:
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    isChrome: /chrome|chromium|crios/.test(ua),
    isFirefox: /firefox|fxios/.test(ua),
    isEdge: /edg/.test(ua),
    version: parseInt(ua.match(/version\/(\d+)/)?.[1] || '0'),
    devicePixelRatio: window.devicePixelRatio || 1,
    platformMemory: nav.deviceMemory || 8,
    cpuCores: nav.hardwareConcurrency || 4,
  };
}

// ============================================================================
// MEASUREMENT STRATEGY SELECTION
// ============================================================================

/**
 * Determine optimal measurement configuration based on device
 */
export function selectOptimalMeasurementConfig(
  capabilities: BrowserCapabilities,
  isLowBattery: boolean = false
): Partial<FpsMeasurementConfig> {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth < 1024;
  const isLowEnd =
    capabilities.platformMemory < 4 || capabilities.cpuCores < 2;

  // Base config
  let config: Partial<FpsMeasurementConfig> = {
    useDeltaTiming: true,
    usePerformanceObserver: capabilities.supportsPerformanceObserver,
    safariHacks: capabilities.isSafari,
    mobileSafariHacks: capabilities.isMobileSafari,
  };

  if (isLowBattery) {
    // Battery saver: coarser measurements
    config = {
      ...config,
      windowSize: 60,
      updateInterval: 2000,
      adaptiveSampling: true,
      batteryOptimized: true,
    };
  } else if (isLowEnd) {
    // Low-end device: less overhead
    config = {
      ...config,
      windowSize: 60,
      updateInterval: 1500,
      adaptiveSampling: true,
      batteryOptimized: false,
    };
  } else if (isMobile) {
    // Mobile: balanced
    config = {
      ...config,
      windowSize: 90,
      updateInterval: 1000,
      adaptiveSampling: true,
      batteryOptimized: true,
    };
  } else if (isTablet) {
    // Tablet: good quality
    config = {
      ...config,
      windowSize: 120,
      updateInterval: 1000,
      adaptiveSampling: false,
      batteryOptimized: false,
    };
  } else {
    // Desktop: high precision
    config = {
      ...config,
      windowSize: 240,
      updateInterval: 500,
      adaptiveSampling: false,
      batteryOptimized: false,
    };
  }

  return config;
}

// ============================================================================
// METRICS INTERPRETATION & RECOMMENDATIONS
// ============================================================================

export interface FpsRecommendation {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendedQualityLevel: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
  issues: string[];
  recommendations: string[];
  priority: number; // 0-1, higher = more urgent action
}

/**
 * Analyze FPS metrics and provide recommendations
 */
export function analyzeFpsMetrics(metrics: FrameMetrics): FpsRecommendation {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let priority = 0;
  let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' =
    'excellent';
  let recommendedQualityLevel: 'ultra' | 'high' | 'medium' | 'low' | 'minimal' =
    'high';

  // Reliability check
  if (!metrics.isReliable) {
    issues.push('Insufficient measurement samples');
    recommendations.push('Run for longer to get accurate metrics');
    return {
      quality: 'fair',
      recommendedQualityLevel: 'high',
      issues,
      recommendations,
      priority: 0.2,
    };
  }

  // FPS analysis
  const fps = metrics.averageFps;
  if (fps < 20) {
    quality = 'critical';
    recommendedQualityLevel = 'minimal';
    issues.push(`Critical FPS: ${fps}`);
    recommendations.push('Reduce animation complexity significantly');
    recommendations.push('Disable 3D rendering or reduce polygon count');
    recommendations.push('Reduce particle effects and shaders');
    priority = 1;
  } else if (fps < 30) {
    quality = 'poor';
    recommendedQualityLevel = 'low';
    issues.push(`Poor FPS: ${fps}`);
    recommendations.push('Reduce visual effects quality');
    recommendations.push('Consider disabling animations');
    priority = 0.8;
  } else if (fps < 45) {
    quality = 'fair';
    recommendedQualityLevel = 'medium';
    issues.push(`Suboptimal FPS: ${fps}`);
    recommendations.push('Reduce shader complexity');
    priority = 0.5;
  } else if (fps < 55) {
    quality = 'good';
    recommendedQualityLevel = 'high';
    issues.push(`Below 60 FPS target: ${fps}`);
    recommendations.push('Minor optimizations could help');
    priority = 0.2;
  }

  // Jank detection
  if (metrics.jankScore > 0.3) {
    issues.push(
      `High jank score: ${(metrics.jankScore * 100).toFixed(1)}%`
    );
    if (metrics.isGpuBound) {
      recommendations.push('GPU is bottleneck - reduce visual complexity');
      recommendations.push('Lower texture quality or resolution');
    } else if (metrics.isCpuBound) {
      recommendations.push('CPU is bottleneck - reduce JavaScript workload');
      recommendations.push('Optimize component rendering or offload to Web Worker');
    }
  }

  // Frame time consistency
  if (metrics.frameTimeStdDev > 5) {
    issues.push(
      `Inconsistent frame times: σ=${metrics.frameTimeStdDev.toFixed(2)}ms`
    );
    recommendations.push('Frame time is highly variable');
    recommendations.push('Check for intermittent heavy operations');
    recommendations.push(
      'Use performance profiler to identify frame time spikes'
    );
  }

  // P95/P99 analysis
  const jankThreshold = 16.67; // 60fps threshold
  if (metrics.p95FrameTime > jankThreshold * 2) {
    issues.push(
      `P95 frame time high: ${metrics.p95FrameTime.toFixed(2)}ms`
    );
    recommendations.push('Some frames are significantly slower than average');
    recommendations.push('Investigate garbage collection or memory pressure');
  }

  // Dropped frames
  if (metrics.droppedFrames > 5) {
    issues.push(`${metrics.droppedFrames} dropped frames detected`);
    if (!recommendations.includes('Reduce visual effects quality')) {
      recommendations.push('Reduce visual effects');
    }
  }

  return {
    quality,
    recommendedQualityLevel,
    issues,
    recommendations,
    priority,
  };
}

// ============================================================================
// FRAME TIME DIAGNOSTICS
// ============================================================================

/**
 * Detailed frame analysis for debugging
 */
export interface FrameDiagnostics {
  category: 'smooth' | 'stuttering' | 'jank_spikes' | 'consistently_slow';
  description: string;
  diagnosis: string;
  nextSteps: string[];
}

export function diagnoseFps(metrics: FrameMetrics): FrameDiagnostics {
  const fps = metrics.averageFps;
  const variance = metrics.frameTimeVariance;
  const p95 = metrics.p95FrameTime;
  const avgTime = metrics.averageFrameTime;
  const consistency = metrics.consistencyScore;

  // Smooth performance
  if (fps >= 55 && variance < 1 && consistency > 0.9) {
    return {
      category: 'smooth',
      description: 'Performance is smooth and consistent',
      diagnosis: `Excellent FPS (${fps}), minimal variance (${variance.toFixed(2)}ms)`,
      nextSteps: ['Monitor for regressions', 'No action needed'],
    };
  }

  // Consistently slow
  const jankThresholdMs = 16.67; // 60fps threshold
  if (
    variance < 2 &&
    avgTime > jankThresholdMs &&
    consistency > 0.85
  ) {
    return {
      category: 'consistently_slow',
      description:
        'Frame rate is consistently below target but stable',
      diagnosis: `GPU-bound: ${avgTime.toFixed(2)}ms per frame, consistent timing indicates GPU bottleneck`,
      nextSteps: [
        'Reduce shader complexity',
        'Lower texture resolution',
        'Reduce draw calls',
        'Profile GPU with browser DevTools',
      ],
    };
  }

  // Jank spikes
  if (
    fps >= 45 &&
    p95 > avgTime * 2 &&
    metrics.jankEvents > 0
  ) {
    return {
      category: 'jank_spikes',
      description:
        'Occasional frame drops or stalls',
      diagnosis: `Intermittent CPU spikes: P95=${p95.toFixed(2)}ms vs avg=${avgTime.toFixed(2)}ms`,
      nextSteps: [
        'Profile with Chrome DevTools Performance tab',
        'Check for: GC pauses, layout thrashing, heavy operations',
        'Consider debouncing resize/scroll handlers',
        'Offload heavy work to Web Workers',
      ],
    };
  }

  // Stuttering
  if (consistency < 0.7 && variance > 3) {
    return {
      category: 'stuttering',
      description:
        'Frame time is highly variable, causing visible stuttering',
      diagnosis: `High variance (${variance.toFixed(2)}ms, σ=${metrics.frameTimeStdDev.toFixed(2)}ms), consistency=${consistency.toFixed(2)}`,
      nextSteps: [
        'Identify frame time spikes with profiler',
        'Check for memory pressure or GC',
        'Verify no sync XHR or blocking I/O',
        'Profile animation frame handlers',
      ],
    };
  }

  // Default: performance issue
  return {
    category: 'jank_spikes',
    description:
      'Performance is below acceptable levels',
    diagnosis: `FPS=${fps}, variance=${variance.toFixed(2)}ms, consistency=${consistency.toFixed(2)}`,
    nextSteps: [
      'Profile with browser DevTools',
      'Start with largest optimizations first',
      'Measure and verify each optimization',
    ],
  };
}

// ============================================================================
// REAL-TIME MONITORING HELPERS
// ============================================================================

/**
 * Format FPS metrics for display
 */
export function formatFpsMetrics(metrics: FrameMetrics): Record<string, string> {
  return {
    FPS: `${metrics.averageFps}`,
    'Frame Time': `${metrics.averageFrameTime.toFixed(2)}ms`,
    'P50': `${metrics.p50FrameTime.toFixed(2)}ms`,
    'P95': `${metrics.p95FrameTime.toFixed(2)}ms`,
    'P99': `${metrics.p99FrameTime.toFixed(2)}ms`,
    'Variance': `${metrics.frameTimeVariance.toFixed(2)}ms`,
    'Jank Score': `${(metrics.jankScore * 100).toFixed(1)}%`,
    'Dropped': `${metrics.droppedFrames}`,
    'Bottleneck': metrics.isGpuBound ? 'GPU' : metrics.isCpuBound ? 'CPU' : 'OK',
    'Status': metrics.isReliable ? '✓' : '⚠ Low sample count',
  };
}

/**
 * Determine if metrics indicate a problem
 */
export function hasPerformanceIssues(metrics: FrameMetrics): boolean {
  return (
    metrics.averageFps < 50 ||
    metrics.jankScore > 0.2 ||
    metrics.frameTimeStdDev > 5 ||
    metrics.droppedFrames > 3
  );
}

/**
 * Track FPS trends over time
 */
export class FpsTrendTracker {
  private history: FrameMetrics[] = [];
  private maxHistoryLength = 60; // Keep last 60 measurements

  recordMetrics(metrics: FrameMetrics): void {
    this.history.push({ ...metrics });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Check if FPS is improving or degrading
   */
  getTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.history.length < 10) return 'stable';

    const recent = this.history.slice(-10);
    const older = this.history.slice(-20, -10);

    const recentAvg =
      recent.reduce((s, m) => s + m.averageFps, 0) / recent.length;
    const olderAvg =
      older.length > 0
        ? older.reduce((s, m) => s + m.averageFps, 0) / older.length
        : recentAvg;

    const threshold = 2; // 2 FPS difference to be significant
    if (recentAvg > olderAvg + threshold) return 'improving';
    if (recentAvg < olderAvg - threshold) return 'degrading';
    return 'stable';
  }

  /**
   * Get FPS statistics over history
   */
  getStatistics(): {
    minFps: number;
    maxFps: number;
    avgFps: number;
    stableFps: boolean;
  } {
    if (this.history.length === 0) {
      return { minFps: 0, maxFps: 0, avgFps: 0, stableFps: true };
    }

    const fps = this.history.map((m) => m.averageFps);
    const minFps = Math.min(...fps);
    const maxFps = Math.max(...fps);
    const avgFps = Math.round(
      fps.reduce((a, b) => a + b, 0) / fps.length
    );

    // Stable if max-min < 10%
    const stableFps = maxFps - minFps < maxFps * 0.1;

    return { minFps, maxFps, avgFps, stableFps };
  }

  clear(): void {
    this.history = [];
  }
}
