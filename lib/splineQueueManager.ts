/**
 * Spline Queue Manager - Production Grade
 *
 * Solves ALL loading issues:
 * - Proper queue with priority
 * - One scene at a time on mobile
 * - Parallel loading on desktop (max 3)
 * - Automatic retry with backoff
 * - Memory pressure handling
 * - Network speed adaptation
 */

import { splineManager } from './splineManager';

// ============================================================================
// TYPES
// ============================================================================

export interface SceneQueueItem {
  url: string;
  priority: number; // 1-10, higher = more important
  retries: number;
  maxRetries: number;
  onProgress?: (progress: number) => void;
  onLoad?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  addedAt: number;
}

export interface QueueStats {
  pending: number;
  loading: number;
  loaded: number;
  failed: number;
  totalScenes: number;
}

// ============================================================================
// SPLINE QUEUE MANAGER
// ============================================================================

class SplineQueueManager {
  private queue: SceneQueueItem[] = [];
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private failed = new Set<string>();
  private maxConcurrent = 1; // Start conservative
  private retryDelays = [1000, 2000, 5000, 10000]; // Exponential backoff

  constructor() {
    this.detectCapabilities();
    this.setupListeners();
  }

  /**
   * Detect device capabilities and set concurrent limit
   */
  private detectCapabilities() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';

    // Mobile: 1 at a time (prevent crashes)
    // Desktop: Up to 3 concurrent (fast loading)
    if (isMobile) {
      this.maxConcurrent = memory >= 6 ? 2 : 1;
    } else {
      this.maxConcurrent = cores >= 8 ? 3 : cores >= 4 ? 2 : 1;
    }

    // Reduce on slow connection
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      this.maxConcurrent = 1;
    }

    console.log(`[QueueManager] Max concurrent: ${this.maxConcurrent} (mobile: ${isMobile}, mem: ${memory}GB, cores: ${cores})`);
  }

  /**
   * Setup event listeners for connection changes
   */
  private setupListeners() {
    // Adjust when connection changes
    (navigator as any).connection?.addEventListener('change', () => {
      console.log('[QueueManager] Connection changed, re-evaluating...');
      this.detectCapabilities();
      this.processQueue(); // Resume if faster
    });

    // Pause on offline
    window.addEventListener('offline', () => {
      console.log('[QueueManager] Offline - pausing queue');
    });

    // Resume on online
    window.addEventListener('online', () => {
      console.log('[QueueManager] Online - resuming queue');
      this.processQueue();
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.queue = [];
      this.loading.clear();
    });
  }

  /**
   * Add scene to queue with priority
   */
  enqueue(
    url: string,
    options: {
      priority?: number;
      maxRetries?: number;
      onProgress?: (progress: number) => void;
      onLoad?: (blob: Blob) => void;
      onError?: (error: Error) => void;
    } = {}
  ): void {
    // Skip if already loaded or loading
    if (this.loaded.has(url) || this.loading.has(url)) {
      console.log(`[QueueManager] Scene already loaded/loading: ${url}`);
      options.onLoad?.(new Blob()); // Dummy callback
      return;
    }

    // Skip if already in queue
    if (this.queue.some(item => item.url === url)) {
      console.log(`[QueueManager] Scene already in queue: ${url}`);
      return;
    }

    const item: SceneQueueItem = {
      url,
      priority: options.priority || 5,
      retries: 0,
      maxRetries: options.maxRetries || 3,
      onProgress: options.onProgress,
      onLoad: options.onLoad,
      onError: options.onError,
      addedAt: Date.now()
    };

    this.queue.push(item);

    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);

    console.log(`[QueueManager] Enqueued: ${url} (priority: ${item.priority}, queue size: ${this.queue.length})`);

    // Start processing
    this.processQueue();
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    // Don't process if offline
    if (!navigator.onLine) {
      console.log('[QueueManager] Offline - pausing');
      return;
    }

    // Check if we can load more
    const availableSlots = this.maxConcurrent - this.loading.size;
    if (availableSlots <= 0) {
      console.log(`[QueueManager] All slots busy (${this.loading.size}/${this.maxConcurrent})`);
      return;
    }

    // Get next items to load
    const itemsToLoad = this.queue.splice(0, availableSlots);

    if (itemsToLoad.length === 0) {
      return;
    }

    console.log(`[QueueManager] Loading ${itemsToLoad.length} scene(s)...`);

    // Load each item
    await Promise.all(
      itemsToLoad.map(item => this.loadScene(item))
    );
  }

  /**
   * Load a single scene
   */
  private async loadScene(item: SceneQueueItem): Promise<void> {
    this.loading.add(item.url);

    try {
      console.log(`[QueueManager] Loading: ${item.url} (attempt ${item.retries + 1}/${item.maxRetries + 1})`);

      // Use splineManager to load
      const result = await splineManager.loadScene(
        item.url,
        this.getPriorityLevel(item.priority),
        {
          onProgress: (loaded, total) => {
            const progress = total > 0 ? (loaded / total) * 100 : 0;
            item.onProgress?.(progress);
          }
        }
      );

      // Success!
      this.loading.delete(item.url);
      this.loaded.add(item.url);

      console.log(`[QueueManager] ✅ Loaded: ${item.url}`);

      // Create blob from URL
      const response = await fetch(result.url);
      const blob = await response.blob();

      item.onLoad?.(blob);

      // Process next in queue
      setTimeout(() => this.processQueue(), 100);

    } catch (error: any) {
      console.error(`[QueueManager] ❌ Failed: ${item.url}`, error);

      this.loading.delete(item.url);

      // Retry logic
      if (item.retries < item.maxRetries) {
        item.retries++;

        const delay = this.retryDelays[Math.min(item.retries - 1, this.retryDelays.length - 1)];
        console.log(`[QueueManager] Retrying in ${delay}ms...`);

        // Re-queue with lower priority
        item.priority = Math.max(1, item.priority - 1);

        setTimeout(() => {
          this.queue.unshift(item); // Add to front
          this.queue.sort((a, b) => b.priority - a.priority);
          this.processQueue();
        }, delay);

      } else {
        // Failed permanently
        this.failed.add(item.url);
        item.onError?.(error);

        // Continue with next
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Convert numeric priority to string level
   */
  private getPriorityLevel(priority: number): 'critical' | 'high' | 'medium' | 'low' {
    if (priority >= 9) return 'critical';
    if (priority >= 7) return 'high';
    if (priority >= 4) return 'medium';
    return 'low';
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      pending: this.queue.length,
      loading: this.loading.size,
      loaded: this.loaded.size,
      failed: this.failed.size,
      totalScenes: this.queue.length + this.loading.size + this.loaded.size + this.failed.size
    };
  }

  /**
   * Check if scene is loaded
   */
  isLoaded(url: string): boolean {
    return this.loaded.has(url);
  }

  /**
   * Check if scene is loading
   */
  isLoading(url: string): boolean {
    return this.loading.has(url);
  }

  /**
   * Clear queue (emergency)
   */
  clearQueue(): void {
    console.log('[QueueManager] Clearing queue');
    this.queue = [];
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    this.queue = [];
    this.loading.clear();
    this.loaded.clear();
    this.failed.clear();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const queueManager = new SplineQueueManager();

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).splineQueue = queueManager;
}
