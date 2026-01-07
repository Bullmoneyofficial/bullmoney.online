/**
 * Advanced Mobile Memory Manager v2.0
 * Prevents WebGL crashes with intelligent scene grouping and memory pressure detection
 */

interface MemoryStatus {
  canLoadMore: boolean;
  activeScenes: number;
  maxScenes: number;
  memoryPressure: 'normal' | 'high' | 'critical';
  reason?: string;
}

interface SceneGroup {
  id: string;
  scenes: string[];
  priority: 'critical' | 'high' | 'normal';
}

class MobileMemoryManager {
  private activeScenes = new Set<string>();
  private sceneGroups = new Map<string, string[]>(); // Group ID -> scene URLs
  private sceneToGroup = new Map<string, string>(); // Scene URL -> group ID
  private maxConcurrentScenes: number;
  private maxConcurrentGroups: number;
  private isMobile: boolean;
  private isLowMemory: boolean;
  private memoryPressure: 'normal' | 'high' | 'critical' = 'normal';
  private lastCleanup: number = 0;
  private cleanupThrottle: number = 1000; // ms
  // BUG FIX #15: Track memory monitoring interval for cleanup
  private memoryMonitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.isMobile = false;
    this.isLowMemory = false;
    this.maxConcurrentScenes = 3;
    this.maxConcurrentGroups = 2;

    if (typeof window !== 'undefined') {
      this.detectDevice();
      this.setupMemoryMonitoring();

      // BUG FIX #15: Clean up on page unload
      window.addEventListener('beforeunload', () => this.cleanup());
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

    // SMART LIMITS: Allow split scenes but limit total
    if (this.isMobile) {
      // Mobile: Allow 2 scenes (for split views) but only 1 group at a time
      this.maxConcurrentScenes = 2; // Increased from 1 to handle split views
      this.maxConcurrentGroups = 1;  // Only 1 page/group active

      if (memory < 4 || this.isLowMemory) {
        this.maxConcurrentScenes = 2; // Still allow split views on low memory
        this.maxConcurrentGroups = 1;
      }
    } else {
      // Desktop
      if (memory >= 8 && !this.isLowMemory) {
        this.maxConcurrentScenes = 6; // High-end desktop
        this.maxConcurrentGroups = 3;
      } else if (memory >= 4) {
        this.maxConcurrentScenes = 4; // Standard desktop
        this.maxConcurrentGroups = 2;
      } else {
        this.maxConcurrentScenes = 3; // Low-end desktop
        this.maxConcurrentGroups = 2;
      }
    }

    console.log('[MemoryManager v2] Initialized', {
      isMobile: this.isMobile,
      isLowMemory: this.isLowMemory,
      maxScenes: this.maxConcurrentScenes,
      maxGroups: this.maxConcurrentGroups,
      deviceMemory: memory
    });
  }

  // BUG FIX #15: Store interval reference for cleanup
  private setupMemoryMonitoring() {
    // Monitor performance.memory if available (Chrome)
    if (typeof window !== 'undefined' && (performance as any).memory) {
      this.memoryMonitorInterval = setInterval(() => {
        const mem = (performance as any).memory;
        const usedRatio = mem.usedJSHeapSize / mem.jsHeapSizeLimit;

        if (usedRatio > 0.9) {
          this.memoryPressure = 'critical';
          this.emergencyCleanup();
        } else if (usedRatio > 0.75) {
          this.memoryPressure = 'high';
        } else {
          this.memoryPressure = 'normal';
        }
      }, 2000);
    }
  }

  /**
   * Register a scene group (e.g., split view with 2 scenes)
   */
  registerSceneGroup(groupId: string, sceneUrls: string[], priority: 'critical' | 'high' | 'normal' = 'normal'): void {
    this.sceneGroups.set(groupId, sceneUrls);
    sceneUrls.forEach(url => {
      this.sceneToGroup.set(url, groupId);
      this.activeScenes.add(url);
    });

    console.log(`[MemoryManager] Registered group "${groupId}" with ${sceneUrls.length} scenes (${this.activeScenes.size}/${this.maxConcurrentScenes})`);
  }

  /**
   * Unregister a scene group
   */
  unregisterSceneGroup(groupId: string): void {
    const scenes = this.sceneGroups.get(groupId);
    if (scenes) {
      scenes.forEach(url => {
        this.activeScenes.delete(url);
        this.sceneToGroup.delete(url);
      });
      this.sceneGroups.delete(groupId);
      console.log(`[MemoryManager] Unregistered group "${groupId}"`);
    }
  }

  /**
   * Check if we can load a new scene/group
   */
  canLoadScene(sceneUrl: string, priority: 'critical' | 'high' | 'normal' = 'normal'): MemoryStatus {
    // Critical scenes always load
    if (priority === 'critical') {
      return {
        canLoadMore: true,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        memoryPressure: this.memoryPressure,
        reason: 'Critical scene - always load'
      };
    }

    // If scene is already active, allow it
    if (this.activeScenes.has(sceneUrl)) {
      return {
        canLoadMore: true,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        memoryPressure: this.memoryPressure,
        reason: 'Scene already active'
      };
    }

    // Critical memory pressure - deny new loads
    if (this.memoryPressure === 'critical') {
      return {
        canLoadMore: false,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        memoryPressure: this.memoryPressure,
        reason: 'Critical memory pressure - load blocked'
      };
    }

    // Check scene limit
    if (this.activeScenes.size >= this.maxConcurrentScenes) {
      return {
        canLoadMore: false,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        memoryPressure: this.memoryPressure,
        reason: `At max concurrent scenes (${this.maxConcurrentScenes})`
      };
    }

    // Check group limit (only on mobile)
    if (this.isMobile && this.sceneGroups.size >= this.maxConcurrentGroups) {
      return {
        canLoadMore: false,
        activeScenes: this.activeScenes.size,
        maxScenes: this.maxConcurrentScenes,
        memoryPressure: this.memoryPressure,
        reason: `At max concurrent groups (${this.maxConcurrentGroups})`
      };
    }

    return {
      canLoadMore: true,
      activeScenes: this.activeScenes.size,
      maxScenes: this.maxConcurrentScenes,
      memoryPressure: this.memoryPressure
    };
  }

  /**
   * Register a single scene
   */
  registerScene(sceneUrl: string): void {
    this.activeScenes.add(sceneUrl);
    console.log(`[MemoryManager] Registered scene: ${sceneUrl} (${this.activeScenes.size}/${this.maxConcurrentScenes})`);
  }

  /**
   * Unregister a single scene
   */
  unregisterScene(sceneUrl: string): void {
    this.activeScenes.delete(sceneUrl);
    const groupId = this.sceneToGroup.get(sceneUrl);
    if (groupId) {
      this.unregisterSceneGroup(groupId);
    }
    console.log(`[MemoryManager] Unregistered scene: ${sceneUrl} (${this.activeScenes.size}/${this.maxConcurrentScenes})`);
  }

  /**
   * Force unload oldest non-critical scenes to make room
   */
  makeRoom(criticalScenes: string[] = []): boolean {
    // First, try to unload entire groups
    const nonCriticalGroups = Array.from(this.sceneGroups.keys()).filter(groupId => {
      const scenes = this.sceneGroups.get(groupId) || [];
      return !scenes.some(scene => criticalScenes.includes(scene));
    });

    if (nonCriticalGroups.length > 0) {
      const oldestGroup = nonCriticalGroups[0];
      this.unregisterSceneGroup(oldestGroup);
      console.log(`[MemoryManager] Made room by unloading group: ${oldestGroup}`);
      return true;
    }

    // Fallback: unload individual scenes
    const nonCriticalScenes = Array.from(this.activeScenes).filter(
      scene => !criticalScenes.includes(scene) && !this.sceneToGroup.has(scene)
    );

    if (nonCriticalScenes.length > 0) {
      const oldestScene = nonCriticalScenes[0];
      this.unregisterScene(oldestScene);
      console.log(`[MemoryManager] Made room by unloading scene: ${oldestScene}`);
      return true;
    }

    return false;
  }

  /**
   * Emergency cleanup during critical memory pressure
   */
  private emergencyCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupThrottle) return;

    this.lastCleanup = now;
    console.warn('[MemoryManager] EMERGENCY CLEANUP - Critical memory pressure');

    // Force cleanup of all non-critical scenes
    const criticalScenes = ['/scene1.splinecode']; // Hero only
    this.makeRoom(criticalScenes);

    // BUG FIX #18: Only cleanup Spline canvases, not all canvases
    if (typeof document !== 'undefined') {
      // Target Spline canvases specifically (they're inside .spline-container)
      const splineContainers = document.querySelectorAll('.spline-container canvas');
      const nonCriticalCanvases = Array.from(splineContainers).filter(canvas => {
        const container = (canvas as HTMLCanvasElement).closest('.spline-container');
        // Check if this canvas is NOT from scene1 (hero)
        return container && !container.innerHTML.includes('scene1');
      });

      nonCriticalCanvases.forEach(canvas => {
        const gl = (canvas as HTMLCanvasElement).getContext('webgl') ||
                   (canvas as HTMLCanvasElement).getContext('webgl2');
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) {
            loseContext.loseContext();
            console.log('[MemoryManager] Force-lost WebGL context for non-critical scene');
          }
        }
      });
    }
  }

  /**
   * BUG FIX #15: Cleanup method to stop monitoring and free resources
   */
  cleanup(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
      console.log('[MemoryManager] Stopped memory monitoring');
    }
    this.reset();
  }

  /**
   * Get current memory status
   */
  getStatus(): MemoryStatus {
    return {
      canLoadMore: this.activeScenes.size < this.maxConcurrentScenes,
      activeScenes: this.activeScenes.size,
      maxScenes: this.maxConcurrentScenes,
      memoryPressure: this.memoryPressure
    };
  }

  /**
   * Get active scene count
   */
  getActiveSceneCount(): number {
    return this.activeScenes.size;
  }

  /**
   * Get active group count
   */
  getActiveGroupCount(): number {
    return this.sceneGroups.size;
  }

  /**
   * Clear all active scenes
   */
  reset(): void {
    this.activeScenes.clear();
    this.sceneGroups.clear();
    this.sceneToGroup.clear();
    console.log('[MemoryManager] Reset - all scenes cleared');
  }
}

// Singleton instance
export const memoryManager = new MobileMemoryManager();

// BUG FIX #14 & #16: Expose globally so all loaders use the same instance
if (typeof window !== 'undefined') {
  (window as any).memoryManager = memoryManager;
}
