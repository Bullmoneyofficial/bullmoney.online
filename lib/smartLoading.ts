/**
 * Smart Loading System
 * Makes the app feel instant with progressive enhancement
 */

import { detectBrowser } from './browserDetection';

interface ConnectionInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  saveData: boolean;
  downlink: number;
}

interface DeviceCapability {
  memory: number;
  cores: number;
  isMobile: boolean;
  isLowEnd: boolean;
  isInAppBrowser: boolean;
  quality: 'high' | 'medium' | 'low' | 'disabled';
}

class SmartLoadingManager {
  private connection: Partial<ConnectionInfo>;
  private device: DeviceCapability;
  private loadQueue: Map<string, number> = new Map();
  private activeRequests: Set<string> = new Set();
  private maxConcurrentRequests = 3;

  constructor() {
    this.connection = this.detectConnection();
    this.device = this.detectDevice();
  }

  private detectConnection(): Partial<ConnectionInfo> {
    if (typeof navigator === 'undefined') return {};

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      effectiveType: conn?.effectiveType || '4g',
      saveData: conn?.saveData || false,
      downlink: conn?.downlink || 10,
    };
  }

  private detectDevice(): DeviceCapability {
    if (typeof navigator === 'undefined') {
      return {
        memory: 4,
        cores: 4,
        isMobile: false,
        isLowEnd: false,
        isInAppBrowser: false,
        quality: 'high',
      };
    }

    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Check for in-app browsers that can't handle heavy content
    const browserInfo = detectBrowser();
    const isInAppBrowser = browserInfo.isInAppBrowser;
    
    // UPDATED 2026: Apple devices and Instagram get full experience
    const hasApplePremiumExperience = browserInfo.hasApplePremiumExperience;
    const isInstagram = browserInfo.isInstagram;
    const hasPremiumExperience = hasApplePremiumExperience || isInstagram;

    const isLowEnd = memory < 4 || cores < 4 || this.connection.effectiveType === '2g' || this.connection.effectiveType === 'slow-2g';

    // Determine quality level - Apple devices and Instagram always get 'high'
    let quality: 'high' | 'medium' | 'low' | 'disabled' = 'high';
    if (hasPremiumExperience) {
      // Apple devices and Instagram get HIGH quality always
      quality = 'high';
    } else if (isInAppBrowser || !browserInfo.canHandle3D) {
      quality = 'disabled';
    } else if (isLowEnd || this.connection.saveData) {
      quality = 'low';
    } else if (isMobile || this.connection.effectiveType === '3g' || memory < 6) {
      quality = 'medium';
    }

    return { memory, cores, isMobile, isLowEnd, isInAppBrowser, quality };
  }

  /**
   * Get recommended quality for Spline scenes
   */
  getSplineQuality(): 'high' | 'medium' | 'low' | 'disabled' {
    return this.device.quality;
  }

  /**
   * Should load full Spline or use static preview?
   */
  shouldLoadSpline(): boolean {
    if (this.device.isInAppBrowser || this.device.quality === 'disabled') return false;
    if (this.connection.saveData) return false;
    if (this.device.quality === 'low') return false;
    return true;
  }

  /**
   * Smart preloading based on connection and device
   */
  shouldPreload(): boolean {
    if (this.connection.saveData) return false;
    if (this.connection.effectiveType === '2g' || this.connection.effectiveType === 'slow-2g') return false;
    if (this.device.isLowEnd) return false;
    return true;
  }

  /**
   * Get delay before loading based on priority
   */
  getLoadDelay(priority: 'critical' | 'high' | 'medium' | 'low'): number {
    const delays = {
      critical: 0,
      high: this.device.isMobile ? 100 : 0,
      medium: this.device.isMobile ? 300 : 100,
      low: this.device.isMobile ? 1000 : 300,
    };

    return delays[priority];
  }

  /**
   * Priority-based loading queue
   */
  async loadWithPriority(url: string, priority: number = 1, onProgress?: (progress: number) => void): Promise<Blob> {
    // Add to queue
    this.loadQueue.set(url, priority);

    // Wait if too many concurrent requests
    while (this.activeRequests.size >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Mark as active
    this.activeRequests.add(url);
    this.loadQueue.delete(url);

    try {
      const response = await fetch(url);
      const total = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();

      if (!reader) throw new Error('No reader');

      let received = 0;
      const chunks: BlobPart[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value as BlobPart);
        received += value.length;

        if (onProgress && total) {
          onProgress(Math.round((received / total) * 100));
        }
      }

      const blob = new Blob(chunks);
      return blob;
    } finally {
      this.activeRequests.delete(url);
    }
  }

  /**
   * Cancel pending requests
   */
  cancelPendingRequests() {
    this.loadQueue.clear();
  }

  /**
   * Get device info
   */
  getDeviceInfo(): DeviceCapability {
    return this.device;
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): Partial<ConnectionInfo> {
    return this.connection;
  }

  /**
   * Refresh connection/device detection
   */
  refresh() {
    this.connection = this.detectConnection();
    this.device = this.detectDevice();
  }
}

// Singleton instance
export const smartLoader = new SmartLoadingManager();

/**
 * Hook to use smart loading
 */
export function useSmartLoading() {
  if (typeof window === 'undefined') {
    return {
      quality: 'high' as const,
      shouldLoadSpline: true,
      shouldPreload: false,
      isMobile: false,
      isLowEnd: false,
      isInAppBrowser: false,
    };
  }

  const info = smartLoader.getDeviceInfo();
  const conn = smartLoader.getConnectionInfo();

  return {
    quality: info.quality,
    shouldLoadSpline: smartLoader.shouldLoadSpline(),
    shouldPreload: smartLoader.shouldPreload(),
    isMobile: info.isMobile,
    isLowEnd: info.isLowEnd,
    isInAppBrowser: info.isInAppBrowser,
    connection: conn.effectiveType,
    saveData: conn.saveData,
  };
}
