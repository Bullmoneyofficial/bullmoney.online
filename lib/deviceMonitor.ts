/**
 * Device Monitor - Comprehensive System Information
 *
 * Provides real-time device metrics:
 * - Network speed (live measurement)
 * - Device specs (GPU, CPU, RAM)
 * - IP address and location
 * - Performance metrics (FPS, memory)
 * - Battery status
 * - Connection quality
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceInfo {
  // Device Hardware
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    model: string;
    manufacturer: string;
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
  };

  // Performance
  performance: {
    cpu: {
      cores: number;
      architecture: string;
    };
    gpu: {
      vendor: string;
      renderer: string;
      tier: 'high' | 'medium' | 'low';
    };
    memory: {
      total: number; // GB
      used: number; // MB
      limit: number; // MB
      percentage: number;
    };
  };

  // Network
  network: {
    type: string;
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    downlink: number; // Mbps
    rtt: number; // ms
    saveData: boolean;
    ip: string;
    location: string;
    isp: string;
  };

  // Battery
  battery: {
    level: number; // 0-100
    charging: boolean;
    chargingTime: number; // minutes
    dischargingTime: number; // minutes
  };

  // Screen
  screen: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    pixelRatio: number;
    colorDepth: number;
    touchSupport: boolean;
  };

  // Live Metrics
  live: {
    fps: number;
    frameTime: number; // ms
    networkSpeed: number; // Mbps (measured)
    latency: number; // ms
    timestamp: number;
  };
}

// ============================================================================
// DEVICE MONITOR CLASS
// ============================================================================

class DeviceMonitor {
  private info: Partial<DeviceInfo> = {};
  private fps = 0;
  private frameCount = 0;
  private lastFrameTime = 0;
  private networkSpeed = 0;
  private latency = 0;
  private battery: any = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize all monitors
   */
  async initialize(): Promise<void> {
    console.log('[DeviceMonitor] Initializing...');

    await Promise.all([
      this.detectDevice(),
      this.detectPerformance(),
      this.detectNetwork(),
      this.detectBattery(),
      this.detectScreen()
    ]);

    // Start live monitoring
    this.startFPSMonitoring();
    this.startNetworkSpeedTest();

    console.log('[DeviceMonitor] Ready');
  }

  /**
   * Detect device information
   */
  private async detectDevice(): Promise<void> {
    const ua = navigator.userAgent;

    // Device type
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/iPhone|iPod/.test(ua)) {
      type = 'mobile';
    } else if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
      type = 'tablet';
    } else if (/Android/.test(ua)) {
      type = 'mobile';
    }

    // OS detection
    let os = 'Unknown';
    let osVersion = '';

    if (/Windows NT ([\d.]+)/.test(ua)) {
      os = 'Windows';
      osVersion = RegExp.$1;
    } else if (/Mac OS X ([\d_]+)/.test(ua)) {
      os = 'macOS';
      osVersion = RegExp.$1.replace(/_/g, '.');
    } else if (/Android ([\d.]+)/.test(ua)) {
      os = 'Android';
      osVersion = RegExp.$1;
    } else if (/iPhone OS ([\d_]+)/.test(ua)) {
      os = 'iOS';
      osVersion = RegExp.$1.replace(/_/g, '.');
    } else if (/Linux/.test(ua)) {
      os = 'Linux';
    }

    // Browser detection
    let browser = 'Unknown';
    let browserVersion = '';

    if (/Chrome\/([\d.]+)/.test(ua) && !/Edge/.test(ua)) {
      browser = 'Chrome';
      browserVersion = RegExp.$1;
    } else if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua)) {
      browser = 'Safari';
      browserVersion = RegExp.$1;
    } else if (/Firefox\/([\d.]+)/.test(ua)) {
      browser = 'Firefox';
      browserVersion = RegExp.$1;
    } else if (/Edg\/([\d.]+)/.test(ua)) {
      browser = 'Edge';
      browserVersion = RegExp.$1;
    }

    // Device model/manufacturer
    let model = 'Unknown';
    let manufacturer = 'Unknown';

    if (/iPhone/.test(ua)) {
      manufacturer = 'Apple';
      model = 'iPhone';
    } else if (/iPad/.test(ua)) {
      manufacturer = 'Apple';
      model = 'iPad';
    } else if (/Macintosh/.test(ua)) {
      manufacturer = 'Apple';
      model = 'Mac';
    } else if (/Android/.test(ua)) {
      if (/Samsung/.test(ua)) {
        manufacturer = 'Samsung';
      } else if (/Pixel/.test(ua)) {
        manufacturer = 'Google';
        model = 'Pixel';
      }
    }

    this.info.device = {
      type,
      model,
      manufacturer,
      os,
      osVersion,
      browser,
      browserVersion
    };
  }

  /**
   * Detect performance capabilities
   */
  private async detectPerformance(): Promise<void> {
    // CPU
    const cores = navigator.hardwareConcurrency || 2;
    const architecture = /x86_64|x64|amd64|x86-64/.test(navigator.userAgent.toLowerCase()) ? 'x64' : 'unknown';

    // GPU
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    let vendor = 'Unknown';
    let renderer = 'Unknown';
    let tier: 'high' | 'medium' | 'low' = 'medium';

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        // Determine GPU tier
        if (/Apple GPU|Mali-G7|Adreno 6|Adreno 7|RTX|RX|Radeon/.test(renderer)) {
          tier = 'high';
        } else if (/Mali-G5|Adreno 5|Intel/.test(renderer)) {
          tier = 'medium';
        } else {
          tier = 'low';
        }
      }
    }

    // Memory
    const memory = (navigator as any).deviceMemory || 4;
    const jsMemory = (performance as any).memory;

    let used = 0;
    let limit = 0;
    let percentage = 0;

    if (jsMemory) {
      used = Math.round(jsMemory.usedJSHeapSize / 1024 / 1024);
      limit = Math.round(jsMemory.jsHeapSizeLimit / 1024 / 1024);
      percentage = Math.round((used / limit) * 100);
    }

    this.info.performance = {
      cpu: { cores, architecture },
      gpu: { vendor, renderer, tier },
      memory: { total: memory, used, limit, percentage }
    };
  }

  /**
   * Detect network information
   */
  private async detectNetwork(): Promise<void> {
    const connection = (navigator as any).connection || {};

    const type = connection.type || 'unknown';
    const effectiveType = connection.effectiveType || '4g';
    const downlink = connection.downlink || 0;
    const rtt = connection.rtt || 0;
    const saveData = connection.saveData || false;

    // Get IP and location
    let ip = 'Unknown';
    let location = 'Unknown';
    let isp = 'Unknown';

    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      ip = data.ip || 'Unknown';
      location = `${data.city || ''}, ${data.country_name || ''}`.trim();
      isp = data.org || 'Unknown';
    } catch (error) {
      console.warn('[DeviceMonitor] Failed to fetch IP info');
    }

    this.info.network = {
      type,
      effectiveType,
      downlink,
      rtt,
      saveData,
      ip,
      location,
      isp
    };
  }

  /**
   * Detect battery status
   */
  private async detectBattery(): Promise<void> {
    try {
      const battery = await (navigator as any).getBattery?.();
      this.battery = battery;

      if (battery) {
        this.info.battery = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime === Infinity ? -1 : Math.round(battery.chargingTime / 60),
          dischargingTime: battery.dischargingTime === Infinity ? -1 : Math.round(battery.dischargingTime / 60)
        };

        // Update on changes
        battery.addEventListener('levelchange', () => this.updateBattery());
        battery.addEventListener('chargingchange', () => this.updateBattery());
      } else {
        this.info.battery = {
          level: -1,
          charging: false,
          chargingTime: -1,
          dischargingTime: -1
        };
      }
    } catch (error) {
      this.info.battery = {
        level: -1,
        charging: false,
        chargingTime: -1,
        dischargingTime: -1
      };
    }
  }

  /**
   * Update battery info
   */
  private updateBattery(): void {
    if (this.battery && this.info.battery) {
      this.info.battery.level = Math.round(this.battery.level * 100);
      this.info.battery.charging = this.battery.charging;
      this.info.battery.chargingTime = this.battery.chargingTime === Infinity ? -1 : Math.round(this.battery.chargingTime / 60);
      this.info.battery.dischargingTime = this.battery.dischargingTime === Infinity ? -1 : Math.round(this.battery.dischargingTime / 60);
    }
  }

  /**
   * Detect screen information
   */
  private detectScreen(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const pixelRatio = window.devicePixelRatio || 1;
    const colorDepth = screen.colorDepth || 24;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.info.screen = {
      width,
      height,
      orientation,
      pixelRatio,
      colorDepth,
      touchSupport
    };

    // Update on resize
    window.addEventListener('resize', () => {
      if (this.info.screen) {
        this.info.screen.width = window.innerWidth;
        this.info.screen.height = window.innerHeight;
        this.info.screen.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      }
    });
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();

    const measureFPS = (timestamp: number) => {
      this.frameCount++;

      // Update every second
      if (timestamp - lastTime >= 1000) {
        this.fps = Math.round(this.frameCount);
        this.frameCount = 0;
        lastTime = timestamp;

        // Update live metrics
        if (this.info.live) {
          this.info.live.fps = this.fps;
          this.info.live.frameTime = 1000 / Math.max(this.fps, 1);
        }
      }

      this.lastFrameTime = timestamp;
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Start network speed test
   */
  private async startNetworkSpeedTest(): Promise<void> {
    // Test every 30 seconds
    const test = async () => {
      try {
        // Download a small file to measure speed
        const testUrl = 'https://www.google.com/favicon.ico?' + Date.now();
        const startTime = performance.now();

        const response = await fetch(testUrl, { cache: 'no-store' });
        const blob = await response.blob();

        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const sizeMB = blob.size / 1024 / 1024;
        const speedMbps = (sizeMB * 8) / duration;

        this.networkSpeed = Math.round(speedMbps * 100) / 100;

        // Measure latency
        const pingStart = performance.now();
        await fetch(testUrl, { method: 'HEAD', cache: 'no-store' });
        this.latency = Math.round(performance.now() - pingStart);

      } catch (error) {
        console.warn('[DeviceMonitor] Network test failed');
      }
    };

    // Initial test
    await test();

    // Periodic tests
    setInterval(test, 30000);
  }

  /**
   * Get complete device info
   */
  getInfo(): DeviceInfo {
    return {
      ...this.info,
      live: {
        fps: this.fps,
        frameTime: 1000 / Math.max(this.fps, 1),
        networkSpeed: this.networkSpeed,
        latency: this.latency,
        timestamp: Date.now()
      }
    } as DeviceInfo;
  }

  /**
   * Get formatted info for display
   */
  getFormattedInfo(): Record<string, any> {
    const info = this.getInfo();

    return {
      // Device
      'Device Type': info.device.type.toUpperCase(),
      'Model': info.device.model,
      'Manufacturer': info.device.manufacturer,
      'OS': `${info.device.os} ${info.device.osVersion}`,
      'Browser': `${info.device.browser} ${info.device.browserVersion}`,

      // Performance
      'CPU Cores': info.performance.cpu.cores,
      'GPU': info.performance.gpu.renderer,
      'GPU Tier': info.performance.gpu.tier.toUpperCase(),
      'RAM': `${info.performance.memory.total}GB`,
      'Memory Used': `${info.performance.memory.used}MB / ${info.performance.memory.limit}MB (${info.performance.memory.percentage}%)`,

      // Network
      'IP Address': info.network.ip,
      'Location': info.network.location,
      'ISP': info.network.isp,
      'Connection': info.network.effectiveType.toUpperCase(),
      'Network Type': info.network.type,
      'Downlink': `${info.network.downlink} Mbps`,
      'RTT': `${info.network.rtt}ms`,
      'Data Saver': info.network.saveData ? 'ON' : 'OFF',

      // Battery
      'Battery': info.battery.level >= 0 ? `${info.battery.level}%` : 'Unknown',
      'Charging': info.battery.charging ? 'Yes' : 'No',

      // Screen
      'Resolution': `${info.screen.width}x${info.screen.height}`,
      'Pixel Ratio': `${info.screen.pixelRatio}x`,
      'Orientation': info.screen.orientation.toUpperCase(),
      'Touch Support': info.screen.touchSupport ? 'Yes' : 'No',

      // Live
      'FPS': info.live.fps,
      'Frame Time': `${info.live.frameTime.toFixed(2)}ms`,
      'Network Speed': `${info.live.networkSpeed} Mbps`,
      'Latency': `${info.live.latency}ms`
    };
  }

  /**
   * Get data consumption stats
   */
  getDataUsage(): {
    sessionBytes: number;
    sessionMB: string;
    totalBytes: number;
    totalMB: string;
    totalGB: string;
  } {
    // Try to get real resource timing data
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      try {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const totalBytes = resources.reduce((sum, entry) => {
          const size = (entry as any).encodedBodySize || (entry as any).decodedBodySize || 0;
          return sum + size;
        }, 0);

        // Get stored total from localStorage
        const stored = localStorage.getItem('bm_data_total');
        const storedTotal = stored ? parseInt(stored, 10) : 0;
        const newTotal = storedTotal + totalBytes;

        // Update localStorage
        localStorage.setItem('bm_data_total', newTotal.toString());

        return {
          sessionBytes: totalBytes,
          sessionMB: (totalBytes / 1024 / 1024).toFixed(2),
          totalBytes: newTotal,
          totalMB: (newTotal / 1024 / 1024).toFixed(2),
          totalGB: (newTotal / 1024 / 1024 / 1024).toFixed(3)
        };
      } catch (error) {
        console.warn('[DeviceMonitor] Failed to get data usage:', error);
      }
    }

    // Fallback
    return {
      sessionBytes: 0,
      sessionMB: '0.00',
      totalBytes: 0,
      totalMB: '0.00',
      totalGB: '0.000'
    };
  }

  /**
   * Reset total data usage
   */
  resetDataUsage(): void {
    localStorage.removeItem('bm_data_total');
    console.log('[DeviceMonitor] Data usage reset');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    pageLoad: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
  } {
    const metrics = {
      pageLoad: 0,
      domContentLoaded: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      timeToInteractive: 0
    };

    try {
      // Navigation Timing
      if (performance.timing) {
        const timing = performance.timing;
        metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
        metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      }

      // Paint Timing
      if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry: any) => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        // LCP
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          metrics.largestContentfulPaint = (lcpEntries[lcpEntries.length - 1] as any).startTime;
        }

        // TTI (estimate using domInteractive)
        if (performance.timing) {
          metrics.timeToInteractive = performance.timing.domInteractive - performance.timing.navigationStart;
        }
      }
    } catch (error) {
      console.warn('[DeviceMonitor] Failed to get performance metrics:', error);
    }

    return metrics;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const deviceMonitor = new DeviceMonitor();

// Global access
if (typeof window !== 'undefined') {
  (window as any).deviceMonitor = deviceMonitor;
}
