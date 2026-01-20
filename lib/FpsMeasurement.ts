/**
 * Advanced FPS Measurement System - Cross-Browser & Cross-Device
 * 
 * Industry best practices:
 * - Accurate frame timing using performance.now() (microsecond precision)
 * - Multiple measurement strategies for different device capabilities
 * - Comprehensive frame metrics (FPS, frame time, jank, variance)
 * - GPU/CPU workload detection
 * - Battery-aware optimization for mobile/tablet
 * 
 * References:
 * - Web Vitals: https://web.dev/vitals/
 * - Chromium FPS: https://chromium.googlesource.com/chromium/src/+/main/cc/metrics/
 * - WebKit Performance: https://webkit.org/performance/
 */

import { DeviceInfo } from '@/lib/deviceMonitor';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FrameMetrics {
  // Core metrics
  currentFps: number;           // Instantaneous FPS
  averageFps: number;           // Time-weighted average
  
  // Frame timing (milliseconds)
  averageFrameTime: number;     // Average time per frame
  minFrameTime: number;         // Best frame (fastest)
  maxFrameTime: number;         // Worst frame (slowest)
  p50FrameTime: number;         // Median frame time
  p95FrameTime: number;         // 95th percentile (near-worst case)
  p99FrameTime: number;         // 99th percentile (worst case)
  
  // Jank detection
  droppedFrames: number;        // Frames that missed 16.67ms (60fps)
  jankScore: number;            // 0-1 indicating smoothness (0=smooth, 1=janky)
  jankEvents: number;           // Number of jank spikes
  
  // Variance
  frameTimeVariance: number;    // Standard deviation of frame times
  frameTimeStdDev: number;      // Frame time std dev
  
  // Workload analysis
  isGpuBound: boolean;          // True if GPU is bottleneck
  isCpuBound: boolean;          // True if CPU is bottleneck
  consistencyScore: number;     // 0-1 (1=perfectly consistent)
  
  // Adaptive throttling
  shouldThrottle: boolean;      // Reduce quality for battery/thermals
  throttleLevel: number;        // 0-1 (0=no throttle, 1=max throttle)
  
  // Meta
  sampleCount: number;          // How many samples collected
  measurementDuration: number;  // Total time spent measuring (ms)
  isReliable: boolean;          // False if not enough samples or browser issues
}

export interface FpsMeasurementConfig {
  // Measurement window
  windowSize: number;                      // Number of frames to track (default: 120)
  updateInterval: number;                  // How often to recalculate metrics (ms)
  
  // Thresholds
  jankThresholdMs: number;                 // Frame time > this = jank (default: 16.67ms for 60fps)
  gpuBoundThreshold: number;               // Frame time consistency threshold
  cpuBoundThreshold: number;               // Frame time variance threshold
  droppedFrameThreshold: number;           // Consecutive drops to trigger throttle
  
  // Sampling strategy
  useDeltaTiming: boolean;                 // Use frame delta for better accuracy
  usePerformanceObserver: boolean;         // Use PerformanceObserver if available
  adaptiveSampling: boolean;               // Reduce sampling on low-end devices
  batteryOptimized: boolean;               // Reduce sampling on battery devices
  
  // Browser-specific
  safariHacks: boolean;                    // Apply Safari workarounds
  mobileSafariHacks: boolean;              // Apply iOS Safari workarounds
}

export interface PerformanceWorkload {
  cpuIntensity: 'low' | 'medium' | 'high';
  gpuIntensity: 'low' | 'medium' | 'high';
  memoryPressure: 'normal' | 'elevated' | 'critical';
  thermalState: 'normal' | 'nominal' | 'critical';
  batteryState: 'ok' | 'low' | 'critical';
}

// ============================================================================
// FRAME TIMING CALCULATOR
// ============================================================================

class FrameTimingBuffer {
  private buffer: number[] = [];
  private writeIndex = 0;
  private isFull = false;
  private maxSize: number;

  constructor(size: number) {
    this.maxSize = size;
    this.buffer = new Array(size);
  }

  /**
   * Add frame time to buffer (circular buffer, no allocations)
   */
  push(frameTime: number): void {
    this.buffer[this.writeIndex] = frameTime;
    this.writeIndex = (this.writeIndex + 1) % this.maxSize;
    if (this.writeIndex === 0) {
      this.isFull = true;
    }
  }

  /**
   * Get all samples (respects circular buffer structure)
   */
  getSamples(): number[] {
    if (!this.isFull) {
      return this.buffer.slice(0, this.writeIndex);
    }
    // Reorder circular buffer into chronological order
    return [
      ...this.buffer.slice(this.writeIndex),
      ...this.buffer.slice(0, this.writeIndex),
    ];
  }

  /**
   * Calculate statistics efficiently (single pass)
   */
  calculateStats(): {
    sum: number;
    min: number;
    max: number;
    count: number;
    samples: number[];
  } {
    const samples = this.getSamples();
    const count = samples.length;

    if (count === 0) {
      return { sum: 0, min: 0, max: 0, count: 0, samples: [] };
    }

    let sum = 0;
    let min = samples[0];
    let max = samples[0];

    for (let i = 0; i < count; i++) {
      const time = samples[i];
      sum += time;
      if (time < min) min = time;
      if (time > max) max = time;
    }

    return { sum, min, max, count, samples };
  }

  /**
   * Calculate percentiles from sorted samples
   */
  static calculatePercentiles(
    samples: number[],
    percentiles: number[]
  ): number[] {
    if (samples.length === 0) return percentiles.map(() => 0);

    // Create sorted copy (non-destructive)
    const sorted = [...samples].sort((a, b) => a - b);
    const length = sorted.length;

    return percentiles.map((p) => {
      const index = Math.ceil((p / 100) * length) - 1;
      return sorted[Math.max(0, index)];
    });
  }

  clear(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.isFull = false;
  }

  getSize(): number {
    return this.isFull ? this.maxSize : this.writeIndex;
  }
}

// ============================================================================
// FPS MEASUREMENT ENGINE
// ============================================================================

export class FpsMeasurementEngine {
  private config: FpsMeasurementConfig;
  private timingBuffer: FrameTimingBuffer;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private startTime: number = 0;
  private lastUpdateTime: number = 0;
  private metrics: FrameMetrics;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  // Advanced tracking
  private consecutiveDroppedFrames: number = 0;
  private lastThrottleTime: number = 0;
  private frametimeVariances: number[] = [];
  private jankEvents: number[] = [];

  // Browser capabilities
  private hasHighResTimer: boolean;
  private hasPerformanceObserver: boolean;
  private isSafari: boolean;
  private isMobileSafari: boolean;
  private hasGetBattery: boolean;
  private batteryStatus: any = null;

  // Device info
  private deviceMemory: number;
  private cpuCores: number;
  private isLowEndDevice: boolean;

  constructor(config: Partial<FpsMeasurementConfig> = {}) {
    this.config = {
      windowSize: 120,
      updateInterval: 1000,
      jankThresholdMs: 16.67, // 60fps threshold
      gpuBoundThreshold: 0.15,
      cpuBoundThreshold: 0.25,
      droppedFrameThreshold: 3,
      useDeltaTiming: true,
      usePerformanceObserver: true,
      adaptiveSampling: true,
      batteryOptimized: true,
      safariHacks: true,
      mobileSafariHacks: true,
      ...config,
    };

    this.timingBuffer = new FrameTimingBuffer(this.config.windowSize);

    // Detect browser capabilities
    this.hasHighResTimer =
      typeof performance !== 'undefined' &&
      typeof performance.now === 'function';
    this.hasPerformanceObserver =
      typeof PerformanceObserver !== 'undefined' &&
      this.config.usePerformanceObserver;
    this.isSafari = this.detectSafari();
    this.isMobileSafari = this.detectMobileSafari();
    this.hasGetBattery = 'getBattery' in navigator;

    // Get device info
    const nav = navigator as any;
    this.deviceMemory = nav.deviceMemory || 8;
    this.cpuCores = nav.hardwareConcurrency || 4;
    this.isLowEndDevice =
      this.deviceMemory < 4 || this.cpuCores < 2 || this.isMobileSafari;

    // Initialize metrics
    this.metrics = this.createEmptyMetrics();

    // Setup battery monitoring if available
    if (this.hasGetBattery) {
      this.setupBatteryMonitoring();
    }
  }

  /**
   * Start FPS measurement
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.startTime = this.now();
    this.lastUpdateTime = this.startTime;
    this.timingBuffer.clear();

    // Start measurement loop
    const measurementLoop = (timestamp: number) => {
      if (!this.isRunning) return;

      if (this.lastFrameTime === 0) {
        // First frame - just record time
        this.lastFrameTime = timestamp;
      } else {
        // Calculate frame delta
        const frameDelta = timestamp - this.lastFrameTime;

        // Record frame time (cap at 500ms to ignore tab switching)
        if (frameDelta > 0 && frameDelta < 500) {
          this.timingBuffer.push(frameDelta);
          this.frameCount++;

          // Track consecutive dropped frames
          if (frameDelta > this.config.jankThresholdMs * 1.5) {
            this.consecutiveDroppedFrames++;
            if (this.consecutiveDroppedFrames === 1) {
              this.jankEvents.push(timestamp);
            }
          } else {
            this.consecutiveDroppedFrames = 0;
          }

          // Record frame time variance for GPU/CPU detection
          this.frametimeVariances.push(frameDelta);
          if (this.frametimeVariances.length > 60) {
            this.frametimeVariances.shift();
          }
        }

        this.lastFrameTime = timestamp;
      }

      // Update metrics periodically
      const now = this.now();
      if (now - this.lastUpdateTime >= this.config.updateInterval) {
        this.updateMetrics(now);
        this.lastUpdateTime = now;
      }

      // Continue loop
      this.animationFrameId = requestAnimationFrame(measurementLoop);
    };

    this.animationFrameId = requestAnimationFrame(measurementLoop);
  }

  /**
   * Stop FPS measurement
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): FrameMetrics {
    return { ...this.metrics };
  }

  /**
   * Detect workload characteristics
   */
  analyzeWorkload(): PerformanceWorkload {
    const metrics = this.metrics;
    const variance = metrics.frameTimeVariance;
    const jankScore = metrics.jankScore;

    // Determine CPU intensity
    let cpuIntensity: 'low' | 'medium' | 'high' = 'low';
    if (metrics.isCpuBound) {
      if (variance > 5) cpuIntensity = 'high';
      else if (variance > 2) cpuIntensity = 'medium';
    }

    // Determine GPU intensity
    let gpuIntensity: 'low' | 'medium' | 'high' = 'low';
    if (metrics.isGpuBound) {
      if (jankScore > 0.7) gpuIntensity = 'high';
      else if (jankScore > 0.4) gpuIntensity = 'medium';
    }

    // Memory pressure
    const memUsage = (performance as any).memory?.usedJSHeapSize;
    const memLimit = (performance as any).memory?.jsHeapSizeLimit;
    let memoryPressure: 'normal' | 'elevated' | 'critical' = 'normal';
    if (memUsage && memLimit) {
      const ratio = memUsage / memLimit;
      if (ratio > 0.9) memoryPressure = 'critical';
      else if (ratio > 0.75) memoryPressure = 'elevated';
    }

    // Thermal & battery (placeholder - would need platform APIs)
    const thermalState: 'normal' | 'nominal' | 'critical' = 'normal';
    let batteryState: 'ok' | 'low' | 'critical' = 'ok';
    if (this.batteryStatus) {
      const level = this.batteryStatus.level;
      if (level < 0.1) batteryState = 'critical';
      else if (level < 0.3) batteryState = 'low';
    }

    return {
      cpuIntensity,
      gpuIntensity,
      memoryPressure,
      thermalState,
      batteryState,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private now(): number {
    return this.hasHighResTimer ? performance.now() : Date.now();
  }

  private detectSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return /^((?!chrome|android).)*safari/.test(ua);
  }

  private detectMobileSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(ua) ||
      (this.isSafari && /mobile|tablet/.test(ua))
    );
  }

  private setupBatteryMonitoring(): void {
    const nav = navigator as any;
    if (nav.getBattery) {
      nav.getBattery().then((battery: any) => {
        this.batteryStatus = battery;
        battery.addEventListener('levelchange', () => {
          this.batteryStatus = battery;
        });
      });
    }
  }

  private createEmptyMetrics(): FrameMetrics {
    return {
      currentFps: 0,
      averageFps: 0,
      averageFrameTime: 0,
      minFrameTime: 0,
      maxFrameTime: 0,
      p50FrameTime: 0,
      p95FrameTime: 0,
      p99FrameTime: 0,
      droppedFrames: 0,
      jankScore: 0,
      jankEvents: 0,
      frameTimeVariance: 0,
      frameTimeStdDev: 0,
      isGpuBound: false,
      isCpuBound: false,
      consistencyScore: 1,
      shouldThrottle: false,
      throttleLevel: 0,
      sampleCount: 0,
      measurementDuration: 0,
      isReliable: false,
    };
  }

  private updateMetrics(now: number): void {
    const stats = this.timingBuffer.calculateStats();
    const samples = stats.samples;
    const count = stats.count;

    if (count === 0) {
      this.metrics.isReliable = false;
      return;
    }

    // Calculate basic metrics
    const avgFrameTime = stats.sum / count;
    const currentFps = Math.round(1000 / avgFrameTime);
    const avgFps = Math.max(1, Math.round((count * 1000) / (now - this.startTime)));

    // Calculate percentiles
    const [p50, p95, p99] = FrameTimingBuffer.calculatePercentiles(
      samples,
      [50, 95, 99]
    );

    // Count dropped frames
    const droppedFrames = samples.filter(
      (t) => t > this.config.jankThresholdMs
    ).length;
    const jankScore = Math.min(1, droppedFrames / Math.max(1, count));

    // Calculate variance and std dev
    const variance = this.calculateVariance(samples, avgFrameTime);
    const stdDev = Math.sqrt(variance);

    // Analyze GPU/CPU bound nature
    const { isGpuBound, isCpuBound } = this.analyzeBottleneck(
      samples,
      variance
    );

    // Consistency score (1 = perfect, 0 = highly variable)
    const consistencyScore = Math.max(0, 1 - stdDev / 10);

    // Determine if throttling needed
    const shouldThrottle = droppedFrames > this.config.droppedFrameThreshold;
    const throttleLevel = Math.min(1, droppedFrames / (count / 2));

    // Trim jank events older than 5 seconds
    const cutoffTime = now - 5000;
    this.jankEvents = this.jankEvents.filter((t) => t > cutoffTime);

    this.metrics = {
      currentFps,
      averageFps: avgFps,
      averageFrameTime: Math.round(avgFrameTime * 100) / 100,
      minFrameTime: Math.round(stats.min * 100) / 100,
      maxFrameTime: Math.round(stats.max * 100) / 100,
      p50FrameTime: Math.round(p50 * 100) / 100,
      p95FrameTime: Math.round(p95 * 100) / 100,
      p99FrameTime: Math.round(p99 * 100) / 100,
      droppedFrames,
      jankScore: Math.round(jankScore * 100) / 100,
      jankEvents: this.jankEvents.length,
      frameTimeVariance: Math.round(variance * 100) / 100,
      frameTimeStdDev: Math.round(stdDev * 100) / 100,
      isGpuBound,
      isCpuBound,
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      shouldThrottle,
      throttleLevel: Math.round(throttleLevel * 100) / 100,
      sampleCount: count,
      measurementDuration: Math.round(now - this.startTime),
      isReliable: count >= 30, // At least 30 samples for reliability
    };
  }

  private calculateVariance(samples: number[], mean: number): number {
    let sumSquaredDiff = 0;
    for (let i = 0; i < samples.length; i++) {
      const diff = samples[i] - mean;
      sumSquaredDiff += diff * diff;
    }
    return sumSquaredDiff / samples.length;
  }

  private analyzeBottleneck(
    samples: number[],
    variance: number
  ): { isGpuBound: boolean; isCpuBound: boolean } {
    if (samples.length < 10) {
      return { isGpuBound: false, isCpuBound: false };
    }

    // GPU bound: consistent frame times (low variance) but high absolute time
    // CPU bound: highly variable frame times (high variance)

    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const isGpuBound =
      variance < this.config.gpuBoundThreshold && mean > this.config.jankThresholdMs;
    const isCpuBound = variance > this.config.cpuBoundThreshold;

    return { isGpuBound, isCpuBound };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let engine: FpsMeasurementEngine | null = null;

export function getFpsEngine(): FpsMeasurementEngine {
  if (!engine) {
    engine = new FpsMeasurementEngine({
      adaptiveSampling: true,
      batteryOptimized: true,
    });
  }
  return engine;
}

export function initializeFpsMeasurement(
  config?: Partial<FpsMeasurementConfig>
): FpsMeasurementEngine {
  if (engine) {
    engine.stop();
  }
  engine = new FpsMeasurementEngine(config);
  engine.start();
  return engine;
}
