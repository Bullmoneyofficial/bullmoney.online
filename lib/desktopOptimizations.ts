"use client";

/**
 * Desktop Performance Optimizations
 * 
 * Comprehensive optimizations for Apple Silicon Macs (M1, M2, M3, M4+)
 * and high-performance Windows/Linux desktops with discrete GPUs.
 * 
 * These optimizations ensure desktop experiences are as smooth as mobile.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export interface DesktopCapabilities {
  isDesktop: boolean;
  isAppleSilicon: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  gpuType: 'apple-gpu' | 'nvidia' | 'amd' | 'intel' | 'unknown';
  gpuRenderer: string;
  memoryGB: number;
  cpuCores: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isHighRefresh: boolean;
  estimatedRefreshRate: number;
  performanceTier: 'ultra' | 'high' | 'medium' | 'low';
}

let cachedCapabilities: DesktopCapabilities | null = null;

/**
 * Detect desktop hardware capabilities
 */
export function detectDesktopCapabilities(): DesktopCapabilities {
  if (cachedCapabilities) return cachedCapabilities;
  
  if (typeof window === 'undefined') {
    return {
      isDesktop: true,
      isAppleSilicon: false,
      isMac: false,
      isWindows: false,
      isLinux: false,
      gpuType: 'unknown',
      gpuRenderer: 'unknown',
      memoryGB: 8,
      cpuCores: 4,
      screenWidth: 1920,
      screenHeight: 1080,
      devicePixelRatio: 1,
      isHighRefresh: false,
      estimatedRefreshRate: 60,
      performanceTier: 'high',
    };
  }
  
  const ua = navigator.userAgent.toLowerCase();
  const memory = (navigator as any).deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = window.innerWidth < 768;
  
  // OS Detection
  const isMac = /macintosh|mac os x/i.test(ua);
  const isWindows = /windows/i.test(ua);
  const isLinux = /linux/i.test(ua) && !isWindows;
  const isDesktop = !isMobile;
  
  // GPU Detection via WebGL
  let gpuType: 'apple-gpu' | 'nvidia' | 'amd' | 'intel' | 'unknown' = 'unknown';
  let gpuRenderer = 'unknown';
  let isAppleSilicon = false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
        const rendererLower = gpuRenderer.toLowerCase();
        
        // Detect GPU type
        if (rendererLower.includes('apple') && (rendererLower.includes('gpu') || /m[1-9]/.test(rendererLower))) {
          gpuType = 'apple-gpu';
          isAppleSilicon = true;
        } else if (rendererLower.includes('nvidia') || rendererLower.includes('geforce') || 
                   rendererLower.includes('rtx') || rendererLower.includes('gtx')) {
          gpuType = 'nvidia';
        } else if (rendererLower.includes('amd') || rendererLower.includes('radeon') || 
                   rendererLower.includes('rx ')) {
          gpuType = 'amd';
        } else if (rendererLower.includes('intel') || rendererLower.includes('uhd') || 
                   rendererLower.includes('iris')) {
          gpuType = 'intel';
        }
      }
    }
  } catch (e) {
    console.warn('[DesktopOptimizations] WebGL detection failed:', e);
  }
  
  // Fallback Apple Silicon detection for Macs
  if (isMac && !isAppleSilicon && cores >= 8) {
    isAppleSilicon = true;
    gpuType = 'apple-gpu';
  }
  
  // Screen info
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // High refresh detection
  let estimatedRefreshRate = 60;
  let isHighRefresh = false;
  
  // Use Screen API if available
  if ('refreshRate' in (window.screen as any)) {
    estimatedRefreshRate = (window.screen as any).refreshRate;
    isHighRefresh = estimatedRefreshRate >= 90;
  } else {
    // Estimate based on device
    if (isAppleSilicon) {
      estimatedRefreshRate = 120; // ProMotion displays
      isHighRefresh = true;
    } else if (screenWidth >= 2560 || (gpuType === 'nvidia' || gpuType === 'amd')) {
      estimatedRefreshRate = 144; // Gaming monitors likely
      isHighRefresh = true;
    }
  }
  
  // Performance tier classification
  let performanceTier: 'ultra' | 'high' | 'medium' | 'low';
  
  if (isAppleSilicon || (gpuType !== 'intel' && gpuType !== 'unknown' && memory >= 16)) {
    performanceTier = 'ultra';
  } else if (memory >= 8 && cores >= 4) {
    performanceTier = 'high';
  } else if (memory >= 4 && cores >= 2) {
    performanceTier = 'medium';
  } else {
    performanceTier = 'low';
  }
  
  cachedCapabilities = {
    isDesktop,
    isAppleSilicon,
    isMac,
    isWindows,
    isLinux,
    gpuType,
    gpuRenderer,
    memoryGB: memory,
    cpuCores: cores,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    isHighRefresh,
    estimatedRefreshRate,
    performanceTier,
  };
  
  console.log('[DesktopOptimizations] Detected capabilities:', cachedCapabilities);
  
  return cachedCapabilities;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get desktop capabilities with auto-detection
 */
export function useDesktopCapabilities(): DesktopCapabilities {
  const [capabilities, setCapabilities] = useState<DesktopCapabilities>(() => detectDesktopCapabilities());
  
  useEffect(() => {
    setCapabilities(detectDesktopCapabilities());
  }, []);
  
  return capabilities;
}

/**
 * Hook to apply desktop-specific CSS classes
 */
export function useDesktopOptimizations(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const caps = detectDesktopCapabilities();
    const root = document.documentElement;
    
    if (!caps.isDesktop) return;
    
    // Add desktop optimization classes
    root.classList.add('desktop-optimized');
    
    if (caps.performanceTier === 'ultra') {
      root.classList.add('high-performance', 'perf-ultra');
    } else if (caps.performanceTier === 'high') {
      root.classList.add('high-performance');
    }
    
    if (caps.isAppleSilicon) {
      root.classList.add('apple-silicon');
    }
    
    if (caps.isHighRefresh) {
      root.classList.add('display-120hz', 'fps-120');
    }
    
    // Set CSS custom properties for desktop
    root.style.setProperty('--desktop-tier', caps.performanceTier);
    root.style.setProperty('--gpu-type', caps.gpuType);
    root.style.setProperty('--estimated-refresh', String(caps.estimatedRefreshRate));
    
    console.log('[DesktopOptimizations] Applied desktop classes:', {
      tier: caps.performanceTier,
      appleSilicon: caps.isAppleSilicon,
      highRefresh: caps.isHighRefresh,
      gpu: caps.gpuType
    });
    
    return () => {
      root.classList.remove('desktop-optimized', 'high-performance', 'perf-ultra', 'apple-silicon');
    };
  }, []);
}

// ============================================================================
// GPU-OPTIMIZED ANIMATION UTILITIES
// ============================================================================

/**
 * Optimized RAF loop for high-refresh displays
 */
export function useOptimizedRAF(callback: (deltaTime: number, timestamp: number) => void) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const capsRef = useRef<DesktopCapabilities | null>(null);
  
  useEffect(() => {
    capsRef.current = detectDesktopCapabilities();
    
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      callback(deltaTime, timestamp);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [callback]);
}

/**
 * Get optimal animation spring config based on device
 */
export function getOptimalSpringConfig(): {
  stiffness: number;
  damping: number;
  mass: number;
} {
  const caps = detectDesktopCapabilities();
  
  // Ultra-smooth springs for high-refresh displays
  if (caps.isHighRefresh || caps.performanceTier === 'ultra') {
    return { stiffness: 400, damping: 30, mass: 0.8 };
  }
  
  // Standard springs
  if (caps.performanceTier === 'high') {
    return { stiffness: 350, damping: 28, mass: 1 };
  }
  
  // Faster springs for lower-end devices (less frames to animate)
  return { stiffness: 300, damping: 25, mass: 1.2 };
}

/**
 * Get optimal transition duration based on device
 */
export function getOptimalDuration(baseDuration: number): number {
  const caps = detectDesktopCapabilities();
  
  // Faster transitions for high-refresh displays
  if (caps.isHighRefresh) {
    return baseDuration * 0.8;
  }
  
  if (caps.performanceTier === 'ultra' || caps.performanceTier === 'high') {
    return baseDuration * 0.9;
  }
  
  return baseDuration;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize desktop optimizations on page load
 * Call this once in your app root
 */
export function initDesktopOptimizations(): void {
  if (typeof window === 'undefined') return;
  
  const caps = detectDesktopCapabilities();
  
  if (!caps.isDesktop) {
    console.log('[DesktopOptimizations] Mobile device detected, skipping desktop optimizations');
    return;
  }
  
  console.log(`[DesktopOptimizations] 🖥️ Initializing for ${caps.performanceTier.toUpperCase()} tier desktop`);
  
  // Apply optimizations immediately
  const root = document.documentElement;
  root.classList.add('desktop-optimized');
  
  if (caps.performanceTier === 'ultra') {
    root.classList.add('high-performance', 'perf-ultra');
    console.log('[DesktopOptimizations] ⚡ ULTRA mode enabled - all effects at maximum quality');
  }
  
  if (caps.isAppleSilicon) {
    root.classList.add('apple-silicon');
    console.log('[DesktopOptimizations] 🍎 Apple Silicon optimizations enabled');
  }
  
  if (caps.isHighRefresh) {
    root.classList.add('display-120hz', 'fps-120');
    console.log(`[DesktopOptimizations] 🖥️ High-refresh display detected (${caps.estimatedRefreshRate}Hz)`);
  }
  
  // Force GPU compositing for smoother animations
  root.style.setProperty('transform', 'translateZ(0)');
  
  // Set performance CSS variables
  root.style.setProperty('--native-refresh-rate', String(caps.estimatedRefreshRate));
  root.style.setProperty('--target-fps', String(caps.estimatedRefreshRate));
  root.style.setProperty('--frame-duration', `${1000 / caps.estimatedRefreshRate}ms`);
}

export default {
  detectDesktopCapabilities,
  useDesktopCapabilities,
  useDesktopOptimizations,
  useOptimizedRAF,
  getOptimalSpringConfig,
  getOptimalDuration,
  initDesktopOptimizations,
};
