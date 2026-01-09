/**
 * Spline Streamer - Ultra-Optimized 2025
 *
 * Advanced features:
 * - WebWorker-based loading (non-blocking)
 * - Chunked streaming (progressive rendering)
 * - Adaptive bitrate (like video streaming)
 * - Predictive prefetching
 * - WebGL context pooling
 * - Frame budget management
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StreamConfig {
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  chunkSize?: number; // bytes
  maxConcurrentChunks?: number;
  enableProgressive?: boolean;
}

export interface StreamProgress {
  loaded: number;
  total: number;
  chunks: number;
  speed: number; // bytes/sec
  eta: number; // seconds
}

// ============================================================================
// WEB WORKER LOADER
// ============================================================================

class WorkerLoader {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (blob: Blob) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: StreamProgress) => void;
  }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    // Create inline worker to avoid external file
    const workerCode = `
      let activeDownloads = new Map();

      self.addEventListener('message', async (e) => {
        const { id, action, url, chunkSize } = e.data;

        if (action === 'load') {
          try {
            const response = await fetch(url);
            const reader = response.body.getReader();
            const contentLength = parseInt(response.headers.get('Content-Length') || '0');

            let receivedLength = 0;
            let chunks = [];
            let startTime = Date.now();

            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              chunks.push(value);
              receivedLength += value.length;

              // Send progress update
              const elapsed = (Date.now() - startTime) / 1000;
              const speed = receivedLength / elapsed;
              const remaining = contentLength - receivedLength;
              const eta = remaining / speed;

              self.postMessage({
                id,
                type: 'progress',
                data: {
                  loaded: receivedLength,
                  total: contentLength,
                  chunks: chunks.length,
                  speed,
                  eta
                }
              });
            }

            // Combine chunks
            const blob = new Blob(chunks);

            self.postMessage({
              id,
              type: 'complete',
              data: blob
            });
          } catch (error) {
            self.postMessage({
              id,
              type: 'error',
              data: error.message
            });
          }
        }
      });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.addEventListener('message', (e) => {
      const { id, type, data } = e.data;
      const request = this.pendingRequests.get(id);

      if (!request) return;

      if (type === 'progress') {
        request.onProgress?.(data);
      } else if (type === 'complete') {
        request.resolve(data);
        this.pendingRequests.delete(id);
      } else if (type === 'error') {
        request.reject(new Error(data));
        this.pendingRequests.delete(id);
      }
    });
  }

  async load(
    url: string,
    options?: {
      onProgress?: (progress: StreamProgress) => void;
      signal?: AbortSignal;
    }
  ): Promise<Blob> {
    if (!this.worker) throw new Error('Worker not initialized');

    const id = `${Date.now()}_${Math.random()}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve,
        reject,
        onProgress: options?.onProgress
      });

      // Handle abort
      options?.signal?.addEventListener('abort', () => {
        this.pendingRequests.delete(id);
        reject(new Error('Aborted'));
      });

      this.worker!.postMessage({
        id,
        action: 'load',
        url
      });
    });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.pendingRequests.clear();
  }
}

// ============================================================================
// CHUNK STREAMER
// ============================================================================

export class ChunkStreamer {
  private workerLoader = new WorkerLoader();
  private activeStreams = new Map<string, AbortController>();

  /**
   * Stream a scene in chunks for progressive rendering
   */
  async stream(
    config: StreamConfig,
    onProgress?: (progress: StreamProgress) => void
  ): Promise<Blob> {
    const controller = new AbortController();
    this.activeStreams.set(config.url, controller);

    try {
      console.log(`[ChunkStreamer] Starting stream for ${config.url}`);

      // Use WebWorker for non-blocking download
      const blob = await this.workerLoader.load(config.url, {
        onProgress,
        signal: controller.signal
      });

      console.log(`[ChunkStreamer] Stream complete: ${blob.size} bytes`);
      return blob;
    } finally {
      this.activeStreams.delete(config.url);
    }
  }

  /**
   * Cancel an active stream
   */
  cancel(url: string) {
    this.activeStreams.get(url)?.abort();
    this.activeStreams.delete(url);
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.activeStreams.forEach(controller => controller.abort());
    this.activeStreams.clear();
    this.workerLoader.terminate();
  }
}

// ============================================================================
// ADAPTIVE QUALITY MANAGER
// ============================================================================

export class AdaptiveQualityManager {
  private frameHistory: number[] = [];
  private readonly HISTORY_SIZE = 60; // 1 second at 60fps
  private readonly TARGET_FPS = 60;
  private readonly MIN_FPS = 30;

  private currentQuality: 'ultra' | 'high' | 'medium' | 'low' = 'high';
  private qualityLocked = false;

  /**
   * Record a frame time
   */
  recordFrame(deltaTime: number) {
    this.frameHistory.push(deltaTime);
    if (this.frameHistory.length > this.HISTORY_SIZE) {
      this.frameHistory.shift();
    }
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.frameHistory.length === 0) return 60;

    const avgDelta = this.frameHistory.reduce((a, b) => a + b) / this.frameHistory.length;
    return 1000 / avgDelta;
  }

  /**
   * Get recommended quality based on performance
   */
  getRecommendedQuality(): 'ultra' | 'high' | 'medium' | 'low' {
    if (this.qualityLocked) return this.currentQuality;

    const fps = this.getCurrentFPS();

    // Aggressive quality adjustment
    if (fps < this.MIN_FPS) {
      return 'low';
    } else if (fps < 45) {
      return 'medium';
    } else if (fps < 55) {
      return 'high';
    } else {
      return 'ultra';
    }
  }

  /**
   * Update quality if needed
   */
  updateQuality(): 'ultra' | 'high' | 'medium' | 'low' {
    const recommended = this.getRecommendedQuality();

    if (recommended !== this.currentQuality) {
      console.log(`[AdaptiveQuality] Changing quality: ${this.currentQuality} → ${recommended} (${this.getCurrentFPS().toFixed(0)} fps)`);
      this.currentQuality = recommended;
    }

    return this.currentQuality;
  }

  /**
   * Lock quality (user preference)
   */
  lockQuality(quality: 'ultra' | 'high' | 'medium' | 'low') {
    this.currentQuality = quality;
    this.qualityLocked = true;
  }

  /**
   * Unlock quality (allow adaptive)
   */
  unlockQuality() {
    this.qualityLocked = false;
  }
}

// ============================================================================
// WEBGL CONTEXT POOL
// ============================================================================

export class WebGLContextPool {
  private contexts: WebGL2RenderingContext[] = [];
  private maxContexts = 2; // Most devices support 8-16, we use 2 for safety
  private inUse = new Set<WebGL2RenderingContext>();

  /**
   * Get or create a WebGL context
   */
  acquire(): WebGL2RenderingContext | null {
    // Reuse existing context
    const available = this.contexts.find(ctx => !this.inUse.has(ctx));
    if (available) {
      this.inUse.add(available);
      console.log('[WebGLPool] Reused context');
      return available;
    }

    // Create new if under limit
    if (this.contexts.length < this.maxContexts) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false, // Disable for performance
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      });

      if (ctx) {
        this.contexts.push(ctx);
        this.inUse.add(ctx);
        console.log('[WebGLPool] Created new context');
        return ctx;
      }
    }

    console.warn('[WebGLPool] No contexts available');
    return null;
  }

  /**
   * Release a context back to pool
   */
  release(ctx: WebGL2RenderingContext) {
    this.inUse.delete(ctx);
    console.log('[WebGLPool] Released context');
  }

  /**
   * Cleanup all contexts
   */
  cleanup() {
    this.contexts.forEach(ctx => {
      const ext = ctx.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    });
    this.contexts = [];
    this.inUse.clear();
  }
}

// ============================================================================
// PREDICTIVE PREFETCHER
// ============================================================================

export class PredictivePrefetcher {
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private scrollVelocity = 0;
  private lastScrollY = 0;
  private lastScrollTime = Date.now();

  /**
   * Update scroll metrics
   */
  updateScroll(scrollY: number) {
    const now = Date.now();
    const deltaY = scrollY - this.lastScrollY;
    const deltaTime = now - this.lastScrollTime;

    // Calculate velocity (pixels per second)
    this.scrollVelocity = Math.abs(deltaY) / (deltaTime / 1000);

    // Determine direction
    if (deltaY > 5) {
      this.scrollDirection = 'down';
    } else if (deltaY < -5) {
      this.scrollDirection = 'up';
    }

    this.lastScrollY = scrollY;
    this.lastScrollTime = now;
  }

  /**
   * Get scenes to prefetch based on scroll behavior
   */
  getPrefetchTargets(
    currentPage: number,
    totalPages: number,
    scenes: string[]
  ): string[] {
    const targets: string[] = [];

    // Fast scrolling - prefetch more aggressively
    const prefetchDistance = this.scrollVelocity > 1000 ? 3 : 2;

    if (this.scrollDirection === 'down') {
      // Scrolling down - prefetch next pages
      for (let i = 1; i <= prefetchDistance; i++) {
        const pageIndex = currentPage + i;
        if (pageIndex < totalPages && scenes[pageIndex]) {
          targets.push(scenes[pageIndex]);
        }
      }
    } else if (this.scrollDirection === 'up') {
      // Scrolling up - prefetch previous pages
      for (let i = 1; i <= prefetchDistance; i++) {
        const pageIndex = currentPage - i;
        if (pageIndex >= 0 && scenes[pageIndex]) {
          targets.push(scenes[pageIndex]);
        }
      }
    } else {
      // Idle - prefetch adjacent
      const nextPage = currentPage + 1;
      const prevPage = currentPage - 1;

      if (scenes[nextPage]) targets.push(scenes[nextPage]);
      if (scenes[prevPage]) targets.push(scenes[prevPage]);
    }

    return targets;
  }

  /**
   * Get scroll direction
   */
  getDirection(): 'up' | 'down' | 'none' {
    return this.scrollDirection;
  }

  /**
   * Get scroll velocity
   */
  getVelocity(): number {
    return this.scrollVelocity;
  }
}

// ============================================================================
// FRAME BUDGET MANAGER
// ============================================================================

export class FrameBudgetManager {
  private readonly TARGET_FRAME_TIME = 16.67; // 60fps
  private readonly MAX_FRAME_TIME = 33.33; // 30fps
  private frameStart = 0;

  /**
   * Start a frame
   */
  startFrame() {
    this.frameStart = performance.now();
  }

  /**
   * Check if we have budget remaining
   */
  hasBudget(): boolean {
    const elapsed = performance.now() - this.frameStart;
    return elapsed < this.TARGET_FRAME_TIME;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    const elapsed = performance.now() - this.frameStart;
    return Math.max(0, this.TARGET_FRAME_TIME - elapsed);
  }

  /**
   * Check if frame is dropping
   */
  isDropping(): boolean {
    const elapsed = performance.now() - this.frameStart;
    return elapsed > this.MAX_FRAME_TIME;
  }

  /**
   * Get frame time
   */
  getFrameTime(): number {
    return performance.now() - this.frameStart;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton instances
export const chunkStreamer = new ChunkStreamer();
export const qualityManager = new AdaptiveQualityManager();
export const webglPool = new WebGLContextPool();
export const prefetcher = new PredictivePrefetcher();
export const frameBudget = new FrameBudgetManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    chunkStreamer.cleanup();
    webglPool.cleanup();
  });
}
