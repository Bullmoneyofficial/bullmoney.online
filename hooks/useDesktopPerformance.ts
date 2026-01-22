/**
 * useDesktopPerformance Hook
 * 
 * Desktop-specific performance optimization hook that provides:
 * - User-controllable "lite mode" to disable heavy render effects
 * - Keeps animations working while reducing GPU-intensive effects
 * - Persists user preference in localStorage
 * - Detects system performance capabilities
 * 
 * IMPORTANT: This does NOT change mobile behavior - mobile uses useMobilePerformance
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DesktopPerformanceProfile {
  // Device capabilities
  isDesktop: boolean;
  isHighRefreshRate: boolean;
  gpuTier: 'integrated' | 'discrete' | 'unknown';
  
  // User preferences
  liteMode: boolean;
  prefersReducedMotion: boolean;
  
  // System info
  deviceMemory: number;
  hardwareConcurrency: number;
  
  // Calculated flags
  shouldSkipHeavyEffects: boolean;
  shouldReduceBlur: boolean;
  shouldReduceShadows: boolean;
  shouldReduceGlow: boolean;
  animationsEnabled: boolean; // Always true unless prefersReducedMotion
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'bullmoney_desktop_lite_mode';
const GPU_VENDORS_INTEGRATED = ['intel', 'mesa', 'apple m1', 'apple m2', 'apple m3'];
const GPU_VENDORS_DISCRETE = ['nvidia', 'amd', 'radeon', 'geforce', 'rtx', 'rx '];

// ============================================================================
// DEFAULT PROFILE (SSR-safe)
// ============================================================================

const DEFAULT_PROFILE: DesktopPerformanceProfile = {
  isDesktop: true,
  isHighRefreshRate: false,
  gpuTier: 'unknown',
  liteMode: false,
  prefersReducedMotion: false,
  deviceMemory: 8,
  hardwareConcurrency: 4,
  shouldSkipHeavyEffects: false,
  shouldReduceBlur: false,
  shouldReduceShadows: false,
  shouldReduceGlow: false,
  animationsEnabled: true,
};

// ============================================================================
// GPU DETECTION
// ============================================================================

function detectGpuTier(): 'integrated' | 'discrete' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'unknown';
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'unknown';
    
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
    
    // Check for discrete GPU
    if (GPU_VENDORS_DISCRETE.some(v => renderer.includes(v))) {
      return 'discrete';
    }
    
    // Check for integrated GPU
    if (GPU_VENDORS_INTEGRATED.some(v => renderer.includes(v))) {
      return 'integrated';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// ============================================================================
// REFRESH RATE DETECTION
// ============================================================================

function detectHighRefreshRate(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for high refresh rate via media query
  if (window.matchMedia) {
    // This works on some browsers
    const highRefresh = window.matchMedia('(min-resolution: 120dpi)').matches;
    if (highRefresh) return true;
  }
  
  // Fallback: assume modern Macs and gaming displays have high refresh
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  
  // If high-end hardware, likely has good display
  return memory >= 8 && cores >= 8;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useDesktopPerformance() {
  const [liteMode, setLiteMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [gpuTier, setGpuTier] = useState<'integrated' | 'discrete' | 'unknown'>('unknown');
  const [isHighRefreshRate, setIsHighRefreshRate] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Load saved preference and detect capabilities on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load saved lite mode preference
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') {
        setLiteMode(true);
      }
    } catch {
      // localStorage not available
    }
    
    // Detect GPU tier
    setGpuTier(detectGpuTier());
    
    // Detect refresh rate
    setIsHighRefreshRate(detectHighRefreshRate());
    
    // Detect reduced motion preference
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(motionQuery.matches);
      
      const handleMotionChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      motionQuery.addEventListener('change', handleMotionChange);
      return () => motionQuery.removeEventListener('change', handleMotionChange);
    }
    
    setIsHydrated(true);
  }, []);

  // Toggle lite mode with persistence
  const toggleLiteMode = useCallback(() => {
    setLiteMode(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      } catch {
        // localStorage not available
      }
      
      // Add/remove class on HTML element for CSS targeting
      if (typeof document !== 'undefined') {
        if (newValue) {
          document.documentElement.classList.add('desktop-lite-mode');
        } else {
          document.documentElement.classList.remove('desktop-lite-mode');
        }
      }
      
      return newValue;
    });
  }, []);

  // Set lite mode directly
  const setLiteModeValue = useCallback((value: boolean) => {
    setLiteMode(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // localStorage not available
    }
    
    if (typeof document !== 'undefined') {
      if (value) {
        document.documentElement.classList.add('desktop-lite-mode');
      } else {
        document.documentElement.classList.remove('desktop-lite-mode');
      }
    }
  }, []);

  // Calculate derived values
  const profile = useMemo((): DesktopPerformanceProfile => {
    const memory = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || 8 : 8;
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    
    // Desktop detection (no touch)
    const isDesktop = typeof window !== 'undefined' 
      ? !('ontouchstart' in window) && navigator.maxTouchPoints === 0
      : true;
    
    // Determine if heavy effects should be skipped
    // User can force lite mode, or system may auto-detect low-end
    const shouldSkipHeavyEffects = liteMode || 
                                   prefersReducedMotion ||
                                   (gpuTier === 'integrated' && memory < 8);
    
    return {
      isDesktop,
      isHighRefreshRate,
      gpuTier,
      liteMode,
      prefersReducedMotion,
      deviceMemory: memory,
      hardwareConcurrency: cores,
      shouldSkipHeavyEffects,
      shouldReduceBlur: shouldSkipHeavyEffects,
      shouldReduceShadows: shouldSkipHeavyEffects,
      shouldReduceGlow: shouldSkipHeavyEffects,
      // IMPORTANT: Animations stay enabled unless user explicitly prefers reduced motion
      animationsEnabled: !prefersReducedMotion,
    };
  }, [liteMode, prefersReducedMotion, gpuTier, isHighRefreshRate]);

  // Apply CSS class on mount based on saved preference
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (liteMode) {
      document.documentElement.classList.add('desktop-lite-mode');
    } else {
      document.documentElement.classList.remove('desktop-lite-mode');
    }
  }, [liteMode]);

  return {
    ...profile,
    isHydrated,
    toggleLiteMode,
    setLiteMode: setLiteModeValue,
  };
}

// ============================================================================
// COMBINED HOOK - Use this in components that need both mobile and desktop
// ============================================================================

import { useMobilePerformance } from './useMobilePerformance';

/**
 * Combined hook that provides unified performance flags for both mobile and desktop.
 * - On mobile: Uses mobile performance detection (unchanged)
 * - On desktop: Adds lite mode toggle for user control
 */
export function useUnifiedPerformance() {
  const mobile = useMobilePerformance();
  const desktop = useDesktopPerformance();
  
  // Determine if we're on desktop
  const isDesktop = mobile.isDesktop && !mobile.isMobile && !mobile.isTablet;
  
  // Combined shouldSkipHeavyEffects:
  // - Mobile: Use mobile's logic (low-end, slow connection, etc.)
  // - Desktop: Use desktop's lite mode toggle
  const shouldSkipHeavyEffects = isDesktop 
    ? desktop.shouldSkipHeavyEffects 
    : mobile.shouldSkipHeavyEffects;
  
  // Animations should work on desktop unless user explicitly disabled
  const animationsEnabled = isDesktop
    ? desktop.animationsEnabled
    : !mobile.prefersReducedMotion;
  
  return {
    // From mobile hook (for mobile devices)
    ...mobile,
    
    // Override with desktop-specific values when on desktop
    shouldSkipHeavyEffects,
    animationsEnabled,
    
    // Desktop-specific controls
    isDesktopLiteMode: desktop.liteMode,
    toggleDesktopLiteMode: desktop.toggleLiteMode,
    setDesktopLiteMode: desktop.setLiteMode,
    gpuTier: desktop.gpuTier,
    isHighRefreshRate: desktop.isHighRefreshRate,
  };
}

export default useDesktopPerformance;
