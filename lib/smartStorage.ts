/**
 * Smart Storage Utility
 * Handles localStorage, sessionStorage, and WebView storage intelligently
 * based on device/browser capabilities with fallback strategies
 */

export type StorageStrategy = 'localStorage' | 'sessionStorage' | 'memory' | 'webview';

interface StorageConfig {
  strategy: StorageStrategy;
  prefix: string;
  ttl?: number; // Time to live in milliseconds
}

// In-memory fallback for when storage APIs are unavailable
const memoryStorage = new Map<string, { value: string; expires?: number }>();

/**
 * Detect the best storage strategy for the current environment
 */
export const detectStorageStrategy = (): StorageStrategy => {
  if (typeof window === 'undefined') return 'memory';

  const ua = navigator.userAgent || '';
  const isWebView = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);

  // WebView browsers often have localStorage disabled or restricted
  if (isWebView) {
    // Try to detect if we're in a WebView with special storage
    if ((window as any).webkit?.messageHandlers) {
      return 'webview';
    }
    // Fall back to sessionStorage for in-app browsers (more reliable)
    return 'sessionStorage';
  }

  // Test if localStorage is available and working
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return 'localStorage';
  } catch (e) {
    // localStorage blocked or unavailable
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return 'sessionStorage';
    } catch (e) {
      // Both storage APIs failed, use memory
      return 'memory';
    }
  }
};

class SmartStorage {
  private strategy: StorageStrategy;
  private prefix: string;
  private defaultTTL?: number;

  constructor(config?: Partial<StorageConfig>) {
    this.strategy = config?.strategy || detectStorageStrategy();
    this.prefix = config?.prefix || 'bullmoney_';
    this.defaultTTL = config?.ttl;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    try {
      if (this.strategy === 'localStorage') {
        return localStorage;
      } else if (this.strategy === 'sessionStorage') {
        return sessionStorage;
      }
    } catch (e) {
      console.warn('[SmartStorage] Storage API unavailable:', e);
    }
    return null;
  }

  /**
   * Set a value in storage with optional TTL
   */
  set(key: string, value: any, ttl?: number): boolean {
    const fullKey = this.getKey(key);
    const expires = ttl || this.defaultTTL;

    const data = {
      value: typeof value === 'string' ? value : JSON.stringify(value),
      expires: expires ? Date.now() + expires : undefined,
      timestamp: Date.now()
    };

    try {
      if (this.strategy === 'webview') {
        // Try WebView message handler
        if ((window as any).webkit?.messageHandlers?.storage) {
          (window as any).webkit.messageHandlers.storage.postMessage({
            action: 'set',
            key: fullKey,
            value: JSON.stringify(data)
          });
          return true;
        }
        // Fallback to sessionStorage
        this.strategy = 'sessionStorage';
      }

      const storage = this.getStorage();
      if (storage) {
        storage.setItem(fullKey, JSON.stringify(data));
        return true;
      }

      // Fallback to memory storage
      memoryStorage.set(fullKey, data);
      return true;
    } catch (e) {
      console.warn('[SmartStorage] Failed to set value:', e);
      // Last resort: memory storage
      memoryStorage.set(fullKey, data);
      return false;
    }
  }

  /**
   * Get a value from storage, respecting TTL
   */
  get<T = any>(key: string, defaultValue?: T): T | null {
    const fullKey = this.getKey(key);

    try {
      if (this.strategy === 'webview') {
        // Note: WebView get is synchronous fallback only
        // Real WebView should use async messaging
        this.strategy = 'sessionStorage';
      }

      const storage = this.getStorage();
      let rawData: string | null = null;

      if (storage) {
        rawData = storage.getItem(fullKey);
      } else {
        const memData = memoryStorage.get(fullKey);
        rawData = memData ? JSON.stringify(memData) : null;
      }

      if (!rawData) {
        return defaultValue !== undefined ? defaultValue : null;
      }

      const data = JSON.parse(rawData);

      // Check if expired
      if (data.expires && Date.now() > data.expires) {
        this.remove(key);
        return defaultValue !== undefined ? defaultValue : null;
      }

      // Try to parse JSON values
      try {
        return JSON.parse(data.value);
      } catch {
        return data.value;
      }
    } catch (e) {
      console.warn('[SmartStorage] Failed to get value:', e);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  /**
   * Remove a value from storage
   */
  remove(key: string): void {
    const fullKey = this.getKey(key);

    try {
      if (this.strategy === 'webview') {
        if ((window as any).webkit?.messageHandlers?.storage) {
          (window as any).webkit.messageHandlers.storage.postMessage({
            action: 'remove',
            key: fullKey
          });
          return;
        }
        this.strategy = 'sessionStorage';
      }

      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(fullKey);
      }
      memoryStorage.delete(fullKey);
    } catch (e) {
      console.warn('[SmartStorage] Failed to remove value:', e);
    }
  }

  /**
   * Clear all values with the current prefix
   */
  clear(): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => storage.removeItem(key));
      }

      // Clear memory storage
      for (const key of memoryStorage.keys()) {
        if (key.startsWith(this.prefix)) {
          memoryStorage.delete(key);
        }
      }
    } catch (e) {
      console.warn('[SmartStorage] Failed to clear storage:', e);
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get storage info for debugging
   */
  getInfo() {
    return {
      strategy: this.strategy,
      prefix: this.prefix,
      isAvailable: this.getStorage() !== null || this.strategy === 'memory'
    };
  }
}

// Export singleton instances for different use cases
export const userStorage = new SmartStorage({
  prefix: 'bullmoney_user_',
  ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
});

export const sessionPrefs = new SmartStorage({
  strategy: 'sessionStorage',
  prefix: 'bullmoney_session_'
});

export const devicePrefs = new SmartStorage({
  prefix: 'bullmoney_device_',
  ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
});

export default SmartStorage;
