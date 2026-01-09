/**
 * Universal Fallback System
 *
 * Ensures EVERY device can experience the site with:
 * - Progressive enhancement
 * - Graceful degradation
 * - Static fallbacks
 * - Accessible alternatives
 */

// ============================================================================
// DEVICE CAPABILITY DETECTOR
// ============================================================================

export interface DeviceCapabilities {
  // Core features
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  supports3D: boolean;

  // Performance tier
  tier: 'high' | 'medium' | 'low' | 'minimal';

  // Network
  isOnline: boolean;
  connectionSpeed: 'fast' | 'medium' | 'slow' | 'offline';

  // Device info
  isMobile: boolean;
  isLowEndDevice: boolean;
  hasLowMemory: boolean;

  // Browser features
  supportsWorkers: boolean;
  supportsOffscreen: boolean;
  supportsCompression: boolean;

  // User preferences
  prefersReducedMotion: boolean;
  prefersReducedData: boolean;
  prefersDarkMode: boolean;
}

export class UniversalCapabilityDetector {
  private capabilities: DeviceCapabilities | null = null;

  /**
   * Detect all device capabilities
   */
  async detect(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities;

    // WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas.getContext('webgl2');
    const supportsWebGL = !!gl;
    const supportsWebGL2 = !!gl2;

    // Get GPU info
    let gpuTier: 'high' | 'medium' | 'low' | 'minimal' = 'medium';
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : '';

      if (/Apple GPU|Mali-G7|Adreno 6|Adreno 7|RTX|RX/.test(renderer)) {
        gpuTier = 'high';
      } else if (/Mali-G5|Adreno 5|Intel HD/.test(renderer)) {
        gpuTier = 'medium';
      } else if (/Mali-T|Adreno 4|PowerVR/.test(renderer)) {
        gpuTier = 'low';
      } else if (!supportsWebGL) {
        gpuTier = 'minimal';
      }
    }

    // Memory detection
    const memory = (navigator as any).deviceMemory || 4;
    const hasLowMemory = memory < 4;

    // CPU cores
    const cores = navigator.hardwareConcurrency || 2;
    const isLowEndDevice = cores < 4 || memory < 4;

    // Network detection
    const connection = (navigator as any).connection || {};
    const effectiveType = connection.effectiveType || '4g';
    const saveData = connection.saveData || false;

    let connectionSpeed: 'fast' | 'medium' | 'slow' | 'offline' = 'fast';
    if (!navigator.onLine) {
      connectionSpeed = 'offline';
    } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      connectionSpeed = 'slow';
    } else if (effectiveType === '3g') {
      connectionSpeed = 'medium';
    }

    // Mobile detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                     window.innerWidth < 768;

    // Worker support
    const supportsWorkers = typeof Worker !== 'undefined';
    const supportsOffscreen = typeof OffscreenCanvas !== 'undefined';
    const supportsCompression = typeof CompressionStream !== 'undefined';

    // User preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedData = saveData;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine if 3D should be enabled
    let supports3D = supportsWebGL;

    // Disable 3D on minimal devices
    if (gpuTier === 'minimal' || !supportsWebGL) {
      supports3D = false;
    }

    // Disable 3D on very slow connections
    if (connectionSpeed === 'offline' || (connectionSpeed === 'slow' && prefersReducedData)) {
      supports3D = false;
    }

    // Disable 3D if user prefers reduced motion AND low-end device
    if (prefersReducedMotion && isLowEndDevice) {
      supports3D = false;
    }

    this.capabilities = {
      supportsWebGL,
      supportsWebGL2,
      supports3D,
      tier: gpuTier,
      isOnline: navigator.onLine,
      connectionSpeed,
      isMobile,
      isLowEndDevice,
      hasLowMemory,
      supportsWorkers,
      supportsOffscreen,
      supportsCompression,
      prefersReducedMotion,
      prefersReducedData,
      prefersDarkMode
    };

    console.log('[UniversalCapability] Detected:', this.capabilities);

    return this.capabilities;
  }

  /**
   * Get recommendation for content type
   */
  getRecommendation(): 'spline' | 'video' | 'image' | 'minimal' {
    if (!this.capabilities) return 'minimal';

    const { supports3D, tier, connectionSpeed, prefersReducedData } = this.capabilities;

    // Full 3D for capable devices
    if (supports3D && tier === 'high' && connectionSpeed === 'fast') {
      return 'spline';
    }

    // Video fallback for medium devices
    if (tier === 'medium' && connectionSpeed !== 'slow' && !prefersReducedData) {
      return 'video';
    }

    // Static images for low-end
    if (tier === 'low' || connectionSpeed === 'slow') {
      return 'image';
    }

    // Minimal for offline/very limited devices
    return 'minimal';
  }
}

// ============================================================================
// FALLBACK CONTENT GENERATOR
// ============================================================================

export interface FallbackContent {
  type: 'spline' | 'video' | 'image' | 'minimal';
  src?: string;
  poster?: string;
  alt: string;
  description: string;
}

export class FallbackContentGenerator {
  /**
   * Generate fallback content for a scene
   */
  generate(sceneUrl: string, recommendation: string): FallbackContent {
    const sceneName = sceneUrl.split('/').pop()?.replace('.splinecode', '') || 'scene';

    switch (recommendation) {
      case 'spline':
        return {
          type: 'spline',
          src: sceneUrl,
          alt: `3D scene: ${sceneName}`,
          description: 'Interactive 3D experience'
        };

      case 'video':
        return {
          type: 'video',
          src: `/fallbacks/${sceneName}.mp4`,
          poster: `/fallbacks/${sceneName}-poster.jpg`,
          alt: `Video preview: ${sceneName}`,
          description: 'High-quality video preview'
        };

      case 'image':
        return {
          type: 'image',
          src: `/fallbacks/${sceneName}.jpg`,
          alt: `Static preview: ${sceneName}`,
          description: 'Static image preview'
        };

      case 'minimal':
      default:
        return {
          type: 'minimal',
          alt: sceneName,
          description: 'Text-based content'
        };
    }
  }

  /**
   * Generate all fallback variants
   */
  generateAll(sceneUrl: string): Record<string, FallbackContent> {
    return {
      spline: this.generate(sceneUrl, 'spline'),
      video: this.generate(sceneUrl, 'video'),
      image: this.generate(sceneUrl, 'image'),
      minimal: this.generate(sceneUrl, 'minimal')
    };
  }
}

// ============================================================================
// PROGRESSIVE ENHANCEMENT MANAGER
// ============================================================================

export class ProgressiveEnhancementManager {
  private detector = new UniversalCapabilityDetector();
  private contentGenerator = new FallbackContentGenerator();
  private capabilities: DeviceCapabilities | null = null;

  /**
   * Initialize
   */
  async initialize(): Promise<void> {
    this.capabilities = await this.detector.detect();

    // Log recommendation
    const recommendation = this.detector.getRecommendation();
    console.log(`[ProgressiveEnhancement] Recommended content type: ${recommendation}`);

    // Notify user if using fallback
    if (recommendation !== 'spline') {
      this.notifyFallbackMode(recommendation);
    }
  }

  /**
   * Get capabilities
   */
  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get content for scene
   */
  getContent(sceneUrl: string): FallbackContent {
    const recommendation = this.detector.getRecommendation();
    return this.contentGenerator.generate(sceneUrl, recommendation);
  }

  /**
   * Check if should use 3D
   */
  shouldUse3D(): boolean {
    return this.capabilities?.supports3D ?? false;
  }

  /**
   * Notify user about fallback mode
   */
  private notifyFallbackMode(mode: string) {
    // Store in sessionStorage to avoid repeated notifications
    const key = 'bm_fallback_notified';
    if (sessionStorage.getItem(key)) return;

    const messages = {
      video: '🎥 Using video preview for optimal performance',
      image: '📸 Using static previews to save data',
      minimal: '⚡ Using lightweight mode for best compatibility'
    };

    const message = messages[mode as keyof typeof messages];
    if (message) {
      console.log(`[ProgressiveEnhancement] ${message}`);
      sessionStorage.setItem(key, 'true');
    }
  }

  /**
   * Upgrade content (e.g., when connection improves)
   */
  async attemptUpgrade(): Promise<boolean> {
    const oldCapabilities = this.capabilities;
    this.capabilities = await this.detector.detect();

    // Check if we can upgrade
    const oldRecommendation = this.getRecommendationFromCapabilities(oldCapabilities);
    const newRecommendation = this.detector.getRecommendation();

    if (newRecommendation === 'spline' && oldRecommendation !== 'spline') {
      console.log('[ProgressiveEnhancement] Upgrading to 3D content');
      return true;
    }

    return false;
  }

  private getRecommendationFromCapabilities(caps: DeviceCapabilities | null): string {
    if (!caps) return 'minimal';

    if (caps.supports3D && caps.tier === 'high' && caps.connectionSpeed === 'fast') {
      return 'spline';
    } else if (caps.tier === 'medium' && caps.connectionSpeed !== 'slow') {
      return 'video';
    } else if (caps.tier === 'low' || caps.connectionSpeed === 'slow') {
      return 'image';
    }

    return 'minimal';
  }
}

// ============================================================================
// ACCESSIBILITY MANAGER
// ============================================================================

export class AccessibilityManager {
  /**
   * Get ARIA labels for content
   */
  getAriaLabels(content: FallbackContent): Record<string, string> {
    return {
      'aria-label': content.alt,
      'aria-describedby': `desc-${content.type}`,
      'role': content.type === 'spline' ? 'region' : 'img'
    };
  }

  /**
   * Get keyboard shortcuts info
   */
  getKeyboardShortcuts(): Record<string, string> {
    return {
      'Space': 'Pause/Play animation',
      'Arrow Keys': 'Navigate scene',
      'Escape': 'Exit fullscreen',
      'Tab': 'Focus next interactive element'
    };
  }

  /**
   * Announce to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.getElementById('aria-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const capabilityDetector = new UniversalCapabilityDetector();
export const contentGenerator = new FallbackContentGenerator();
export const enhancementManager = new ProgressiveEnhancementManager();
export const accessibilityManager = new AccessibilityManager();

// Auto-initialize
if (typeof window !== 'undefined') {
  enhancementManager.initialize().catch(console.error);

  // Listen for online/offline
  window.addEventListener('online', () => {
    console.log('[ProgressiveEnhancement] Back online - checking for upgrades');
    enhancementManager.attemptUpgrade();
  });

  // Listen for connection change
  (navigator as any).connection?.addEventListener('change', () => {
    console.log('[ProgressiveEnhancement] Connection changed - re-evaluating');
    enhancementManager.attemptUpgrade();
  });
}
