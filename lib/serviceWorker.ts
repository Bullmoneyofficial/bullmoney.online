/**
 * Service Worker Registration and Management
 * Smart registration based on device capabilities
 */

export interface ServiceWorkerConfig {
  enabled: boolean;
  updateInterval?: number; // ms
  scope?: string;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Register the service worker
   */
  async register(config: ServiceWorkerConfig = { enabled: true }): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[SW Manager] Service workers not supported');
      return false;
    }

    if (!config.enabled) {
      console.log('[SW Manager] Service worker disabled by config');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: config.scope || '/'
      });

      console.log('[SW Manager] Service worker registered:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        console.log('[SW Manager] Update found, installing new version...');

        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW Manager] New version available, will activate on next page load');
            // Optionally notify user about update
            this.notifyUpdate();
          }
        });
      });

      // Check for updates periodically
      if (config.updateInterval) {
        this.updateCheckInterval = setInterval(() => {
          this.registration?.update();
        }, config.updateInterval);
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage);

      return true;
    } catch (error) {
      console.error('[SW Manager] Registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      console.warn('[SW Manager] No service worker registered');
      return false;
    }

    try {
      const success = await this.registration.unregister();
      if (success) {
        console.log('[SW Manager] Service worker unregistered');
        this.cleanup();
      }
      return success;
    } catch (error) {
      console.error('[SW Manager] Unregister failed:', error);
      return false;
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: any): Promise<any> {
    if (!this.registration?.active) {
      console.warn('[SW Manager] No active service worker');
      return null;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Preload Spline scene via service worker
   */
  async preloadSpline(url: string, priority: 'critical' | 'high' | 'normal' = 'normal'): Promise<boolean> {
    try {
      const result = await this.sendMessage({
        type: 'CACHE_SPLINE',
        url,
        priority
      });
      return result?.success ?? false;
    } catch (error) {
      console.error('[SW Manager] Preload failed:', error);
      return false;
    }
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName?: string): Promise<boolean> {
    try {
      const result = await this.sendMessage({
        type: 'CLEAR_CACHE',
        cacheName
      });
      return result?.success ?? false;
    } catch (error) {
      console.error('[SW Manager] Clear cache failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker immediately
   */
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  /**
   * Check if service worker is active
   */
  isActive(): boolean {
    return !!this.registration?.active;
  }

  /**
   * Get registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  private handleMessage = (event: MessageEvent) => {
    console.log('[SW Manager] Message from service worker:', event.data);
    // Handle messages from service worker
    // Can be extended for specific use cases
  };

  private notifyUpdate() {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('swUpdate', {
      detail: { registration: this.registration }
    }));
  }

  private cleanup() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    navigator.serviceWorker.removeEventListener('message', this.handleMessage);
    this.registration = null;
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

/**
 * Initialize service worker with smart defaults
 */
export async function initServiceWorker(deviceProfile?: {
  isMobile: boolean;
  isWebView: boolean;
  prefersReducedData: boolean;
}): Promise<boolean> {
  // Disable in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SW Manager] Skipping in development mode');
    return false;
  }

  const config: ServiceWorkerConfig = {
    enabled: true,
    updateInterval: deviceProfile?.prefersReducedData ? 60 * 60 * 1000 : 30 * 60 * 1000, // 1hr vs 30min
  };

  return swManager.register(config);
}

export default swManager;
