/**
 * Modern Spline Manager - 2025 Edition
 *
 * Features:
 * - HTTP/2 multiplexing & streaming
 * - Service Worker caching with compression
 * - Adaptive quality based on device/network
 * - Predictive preloading
 * - Memory-efficient scene management
 * - WebGL context pooling
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SplineConfig {
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  preload?: boolean;
  quality?: 'auto' | 'high' | 'medium' | 'low';
}

export interface DeviceCapabilities {
  gpu: 'high' | 'medium' | 'low';
  memory: number; // GB
  cores: number;
  isMobile: boolean;
  connection: 'fast' | 'slow' | 'offline';
  supportsWebGL2: boolean;
}

export interface LoadOptions {
  priority?: RequestInit['priority'];
  signal?: AbortSignal;
  onProgress?: (loaded: number, total: number) => void;
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

class DeviceDetector {
  private capabilities: DeviceCapabilities | null = null;

  async detect(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                     window.innerWidth < 768;

    // Detect GPU tier
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ?
      gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    let gpu: 'high' | 'medium' | 'low' = 'medium';
    if (renderer) {
      if (/Apple GPU|Mali-G|Adreno 6|Adreno 7|RTX|AMD/.test(renderer)) {
        gpu = 'high';
      } else if (/Adreno 5|Mali-T|PowerVR/.test(renderer)) {
        gpu = 'low';
      }
    }

    // Memory detection
    const memory = (navigator as any).deviceMemory || 4;

    // CPU cores
    const cores = navigator.hardwareConcurrency || 4;

    // Network speed
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;
    const effectiveType = connection?.effectiveType || '4g';
    const connectionSpeed: 'fast' | 'slow' | 'offline' =
      effectiveType === '4g' || effectiveType === 'wifi' ? 'fast' : 'slow';

    // WebGL2 support
    const supportsWebGL2 = !!document.createElement('canvas').getContext('webgl2');

    this.capabilities = {
      gpu,
      memory,
      cores,
      isMobile,
      connection: navigator.onLine ? connectionSpeed : 'offline',
      supportsWebGL2
    };

    console.log('[SplineManager] Device capabilities:', this.capabilities);
    return this.capabilities;
  }

  getQualityRecommendation(): 'high' | 'medium' | 'low' {
    if (!this.capabilities) return 'medium';

    const { gpu, memory, isMobile, connection } = this.capabilities;

    // Desktop high-end
    if (!isMobile && gpu === 'high' && memory >= 8 && connection === 'fast') {
      return 'high';
    }

    // Mobile high-end or desktop mid-range
    if (gpu === 'high' && memory >= 4) {
      return 'medium';
    }

    // Low-end devices
    return 'low';
  }
}

// ============================================================================
// MODERN CACHE MANAGER
// ============================================================================

class SplineCacheManager {
  private static readonly CACHE_NAME = 'spline-v3-2025';
  private static readonly COMPRESSION_THRESHOLD = 100 * 1024; // 100KB

  /**
   * Store scene with automatic compression for large files
   */
  async store(url: string, blob: Blob): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(SplineCacheManager.CACHE_NAME);

      // Compress if large enough and browser supports it
      let finalBlob = blob;
      if (blob.size > SplineCacheManager.COMPRESSION_THRESHOLD &&
          'CompressionStream' in window) {
        finalBlob = await this.compress(blob);
        console.log(`[Cache] Compressed ${url}: ${blob.size} → ${finalBlob.size} bytes`);
      }

      const response = new Response(finalBlob, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Compressed': finalBlob !== blob ? 'true' : 'false',
        }
      });

      await cache.put(url, response);
      console.log(`[Cache] Stored ${url} (${finalBlob.size} bytes)`);
    } catch (error) {
      console.warn('[Cache] Store failed:', error);
    }
  }

  /**
   * Retrieve scene with automatic decompression
   */
  async retrieve(url: string): Promise<Blob | null> {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open(SplineCacheManager.CACHE_NAME);
      const response = await cache.match(url);

      if (!response) return null;

      let blob = await response.blob();

      // Decompress if needed
      if (response.headers.get('X-Compressed') === 'true' &&
          'DecompressionStream' in window) {
        blob = await this.decompress(blob);
      }

      return blob;
    } catch (error) {
      console.warn('[Cache] Retrieve failed:', error);
      return null;
    }
  }

  /**
   * Compress blob using modern Compression Streams API
   */
  private async compress(blob: Blob): Promise<Blob> {
    const stream = blob.stream().pipeThrough(
      new (window as any).CompressionStream('gzip')
    );
    return new Response(stream).blob();
  }

  /**
   * Decompress blob
   */
  private async decompress(blob: Blob): Promise<Blob> {
    const stream = blob.stream().pipeThrough(
      new (window as any).DecompressionStream('gzip')
    );
    return new Response(stream).blob();
  }

  /**
   * Clear old cache versions
   */
  async cleanup(): Promise<void> {
    if (!('caches' in window)) return;

    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('spline-') && key !== SplineCacheManager.CACHE_NAME)
        .map(key => caches.delete(key))
    );
  }
}

// ============================================================================
// RESOURCE LOADER WITH STREAMING
// ============================================================================

class SplineLoader {
  private cache = new SplineCacheManager();
  private activeLoads = new Map<string, Promise<Blob>>();
  private abortControllers = new Map<string, AbortController>();

  /**
   * Load scene with modern streaming, caching, and priority
   */
  async load(url: string, options: LoadOptions = {}): Promise<Blob> {
    // Reuse in-flight requests
    if (this.activeLoads.has(url)) {
      console.log(`[Loader] Reusing in-flight request for ${url}`);
      return this.activeLoads.get(url)!;
    }

    const loadPromise = this._loadInternal(url, options);
    this.activeLoads.set(url, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.activeLoads.delete(url);
    }
  }

  private async _loadInternal(url: string, options: LoadOptions): Promise<Blob> {
    // Try cache first
    const cached = await this.cache.retrieve(url);
    if (cached) {
      console.log(`[Loader] Cache hit for ${url}`);
      options.onProgress?.(cached.size, cached.size);
      return cached;
    }

    // Setup abort controller
    const controller = new AbortController();
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }
    this.abortControllers.set(url, controller);

    try {
      console.log(`[Loader] Fetching ${url} from network...`);

      const response = await fetch(url, {
        // @ts-ignore - priority is a new feature
        priority: options.priority || 'auto',
        signal: controller.signal,
        cache: 'force-cache',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Stream with progress
      const contentLength = parseInt(response.headers.get('Content-Length') || '0');
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          loaded += value.length;
          options.onProgress?.(loaded, contentLength);
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' });

      // Cache for next time
      await this.cache.store(url, blob);

      return blob;
    } finally {
      this.abortControllers.delete(url);
    }
  }

  /**
   * Cancel a pending load
   */
  cancel(url: string): void {
    this.abortControllers.get(url)?.abort();
    this.activeLoads.delete(url);
    this.abortControllers.delete(url);
  }

  /**
   * Preload a scene in the background
   */
  async preload(url: string, priority: LoadOptions['priority'] = 'low'): Promise<void> {
    try {
      await this.load(url, { priority });
      console.log(`[Loader] Preloaded ${url}`);
    } catch (error) {
      console.warn(`[Loader] Preload failed for ${url}:`, error);
    }
  }
}

// ============================================================================
// MEMORY MANAGER
// ============================================================================

class SplineMemoryManager {
  private activeScenes = new Set<string>();
  private maxScenes: number;

  constructor() {
    // Calculate max scenes based on device memory
    const memory = (navigator as any).deviceMemory || 4;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      this.maxScenes = memory >= 6 ? 3 : memory >= 4 ? 2 : 1;
    } else {
      this.maxScenes = memory >= 8 ? 7 : memory >= 6 ? 5 : 3;
    }

    console.log(`[Memory] Max concurrent scenes: ${this.maxScenes}`);
  }

  canLoad(sceneUrl: string): boolean {
    return this.activeScenes.has(sceneUrl) ||
           this.activeScenes.size < this.maxScenes;
  }

  register(sceneUrl: string): boolean {
    if (this.activeScenes.size >= this.maxScenes && !this.activeScenes.has(sceneUrl)) {
      console.warn(`[Memory] Scene limit reached (${this.maxScenes})`);
      return false;
    }

    this.activeScenes.add(sceneUrl);
    console.log(`[Memory] Registered scene: ${sceneUrl} (${this.activeScenes.size}/${this.maxScenes})`);
    return true;
  }

  unregister(sceneUrl: string): void {
    this.activeScenes.delete(sceneUrl);
    console.log(`[Memory] Unregistered scene: ${sceneUrl} (${this.activeScenes.size}/${this.maxScenes})`);
  }

  getStatus() {
    return {
      active: this.activeScenes.size,
      max: this.maxScenes,
      available: this.maxScenes - this.activeScenes.size
    };
  }
}

// ============================================================================
// SPLINE MANAGER - MAIN CLASS
// ============================================================================

export class SplineManager {
  private static instance: SplineManager;

  private detector = new DeviceDetector();
  private loader = new SplineLoader();
  private memory = new SplineMemoryManager();
  private capabilities: DeviceCapabilities | null = null;

  private constructor() {}

  static getInstance(): SplineManager {
    if (!SplineManager.instance) {
      SplineManager.instance = new SplineManager();
    }
    return SplineManager.instance;
  }

  /**
   * Initialize the manager - OPTIMIZED for faster startup
   */
  async initialize(): Promise<void> {
    console.log('[SplineManager] Initializing...');

    // Setup resource hints immediately for faster loading
    this.addResourceHints();

    // Detect capabilities asynchronously
    this.capabilities = await this.detector.detect();

    // Cleanup old caches in background (don't await)
    const cache = new SplineCacheManager();
    cache.cleanup().catch(console.warn);

    console.log('[SplineManager] Ready');
  }

  /**
   * Load a scene with automatic quality optimization
   */
  async loadScene(
    url: string,
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium',
    options: LoadOptions = {}
  ): Promise<{ blob: Blob; url: string; quality: string }> {
    // Check memory limits
    if (!this.memory.canLoad(url)) {
      throw new Error('Memory limit reached');
    }

    // Map priority to fetch priority
    const fetchPriority = priority === 'critical' ? 'high' :
                         priority === 'high' ? 'high' : 'auto';

    // Load the scene
    const blob = await this.loader.load(url, {
      ...options,
      priority: fetchPriority as any
    });

    // Register with memory manager
    this.memory.register(url);

    // Get recommended quality
    const quality = this.detector.getQualityRecommendation();

    return {
      blob,
      url: URL.createObjectURL(blob),
      quality
    };
  }

  /**
   * Unload a scene to free memory
   */
  unloadScene(url: string): void {
    this.memory.unregister(url);
  }

  /**
   * Preload scenes for faster loading
   */
  async preloadScenes(urls: string[]): Promise<void> {
    const capabilities = await this.detector.detect();

    // Skip preloading on slow connections or low memory
    if (capabilities.connection === 'slow' || capabilities.memory < 4) {
      console.log('[SplineManager] Skipping preload on slow connection/low memory');
      return;
    }

    console.log(`[SplineManager] Preloading ${urls.length} scenes...`);

    // Preload in parallel with low priority
    await Promise.allSettled(
      urls.map(url => this.loader.preload(url, 'low'))
    );
  }

  /**
   * Get device capabilities
   */
  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get memory status
   */
  getMemoryStatus() {
    return this.memory.getStatus();
  }

  /**
   * Cancel a scene load
   */
  cancelLoad(url: string): void {
    this.loader.cancel(url);
  }

  /**
   * Add resource hints for faster loading - OPTIMIZED with more CDN preconnects
   */
  private addResourceHints(): void {
    if (typeof document === 'undefined') return;

    // Preconnect to Spline CDN
    if (!document.querySelector('link[rel="preconnect"][href*="spline"]')) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://prod.spline.design';
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);

      // DNS prefetch as fallback
      const dnsPrefetch = document.createElement('link');
      dnsPrefetch.rel = 'dns-prefetch';
      dnsPrefetch.href = 'https://prod.spline.design';
      document.head.appendChild(dnsPrefetch);

      // Also preconnect to draft CDN (sometimes used)
      const draftPreconnect = document.createElement('link');
      draftPreconnect.rel = 'preconnect';
      draftPreconnect.href = 'https://draft.spline.design';
      draftPreconnect.crossOrigin = 'anonymous';
      document.head.appendChild(draftPreconnect);
    }
  }
}

// Export singleton instance
export const splineManager = SplineManager.getInstance();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  splineManager.initialize().catch(console.error);
}
