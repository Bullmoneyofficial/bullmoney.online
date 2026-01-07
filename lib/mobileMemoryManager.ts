/**
 * Mobile Memory Manager
 * Prevents WebGL crashes on mobile by managing scene loading intelligently
 */

interface MemoryStatus {
  canLoadMore: boolean;
  activeScenes: number;
  maxScenes: number;
  reason?: string;
}

class MobileMemoryManager {
  private activeScenes = new Set<string>();
  private maxConcurrentScenes: number;
  private isMobile: boolean;
  private isLowMemory: boolean;

  constructor() {
    this.isMobile = false;
    this.isLowMemory = false;
    this.maxConcurrentScenes = 3; // Default safe limit

    if (typeof window !== 'undefined') {
      this.detectDevice();
    }
  }

  private detectDevice() {
    const ua = navigator.userAgent || '';
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth < 768;

    // Detect memory constraints
    const memory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;
    const isSlowConnection = connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType);

    this.isLowMemory = memory < 4 || isSlowConnection;

    // Set max concurrent scenes based on device capability
    if (this.isMobile) {
      if (this.isLowMemory) {
        this.maxConcurrentScenes = 1; // Very conservative for low-end mobile
      } else if (memory >= 6) {
        this.maxConcurrentScenes = 2; // High-end mobile can handle 2
      } else {
        this.maxConcurrentScenes = 1; // Mid-range mobile: 1 at a time
      }
    } else {
      // Desktop
      if (memory >= 8) {
        this.maxConcurrentScenes = 4; // High-end desktop
      } else {
        this.maxConcurrentScenes = 3; // Standard desktop
      }
    }

    console.log('[MobileMemoryManager] Initialized', {
      isMobile: this.isMobile,
      isLowMemory: this.isLowMemory,
      maxConcurrentScenes: this.maxConcurrentScenes,
      deviceMemory: memory
    });
  }

  /**
   * Check if we can load a new scene
   */
  canLoadScene(sceneUrl: string, priority: 'critical' | 'high' | 'normal' = 'normal'): MemoryStatus {
    // Critical scenes always load (e.g., hero scene)
    if (priority === 'critical') {
      return {
        canLoadMore: true,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        reason: 'Critical scene - always load'
      };
    }

    // If scene is already active, allow it
    if (this.activeScenes.has(sceneUrl)) {
      return {
        canLoadMore: true,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        reason: 'Scene already active'
      };
    }

    // Check if we're at limit
    if (this.activeScenes.size >= this.maxConcurrentScenes) {
      return {
        canLoadMore: false,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        reason: `At max concurrent scenes (${this.maxConcurrentScenes})`
      };
    }

    return {
      canLoadMore: true,
      activeScenes: this.activeScenes.size,
      maxScenes: this.maxConcurrentScenes
    };
  }

  /**
   * Register a scene as active
   */
  registerScene(sceneUrl: string): void {
    this.activeScenes.add(sceneUrl);
    console.log(`[MobileMemoryManager] Registered scene: ${sceneUrl} (${this.activeScenes.size}/${this.maxConcurrentScenes})`);
  }

  /**
   * Unregister a scene
   */
  unregisterScene(sceneUrl: string): void {
    this.activeScenes.delete(sceneUrl);
    console.log(`[MobileMemoryManager] Unregistered scene: ${sceneUrl} (${this.activeScenes.size}/${this.maxConcurrentScenes})`);
  }

  /**
   * Force unload oldest non-critical scene to make room
   */
  makeRoom(criticalScenes: string[] = []): boolean {
    const nonCriticalScenes = Array.from(this.activeScenes).filter(
      scene => !criticalScenes.includes(scene)
    );

    if (nonCriticalScenes.length > 0) {
      const oldestScene = nonCriticalScenes[0];
      this.unregisterScene(oldestScene);
      console.log(`[MobileMemoryManager] Made room by unloading: ${oldestScene}`);
      return true;
    }

    return false;
  }

  /**
   * Get current memory status
   */
  getStatus(): MemoryStatus {
    return {
      canLoadMore: this.activeScenes.size < this.maxConcurrentScenes,
      activeScenes: this.activeScenes.size,
      maxScenes: this.maxConcurrentScenes
    };
  }

  /**
   * Clear all active scenes
   */
  reset(): void {
    this.activeScenes.clear();
    console.log('[MobileMemoryManager] Reset - all scenes cleared');
  }
}

// Singleton instance
export const memoryManager = new MobileMemoryManager();
