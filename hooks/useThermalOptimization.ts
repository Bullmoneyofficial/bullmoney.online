"use client";

/**
 * useThermalOptimization.ts - Mobile Phone Heat Prevention System
 * 
 * PROBLEM: Users report phones getting hot when using the app.
 * 
 * SOLUTION: This hook monitors device performance and automatically reduces
 * CPU/GPU load when thermal throttling is detected or FPS drops.
 * 
 * Features:
 * - Detects FPS drops that indicate thermal throttling
 * - Automatically reduces animation quality
 * - Pauses non-essential effects when tab is hidden
 * - Respects battery saver mode from OS
 * - Provides manual power saver toggle
 * 
 * CRITICAL: This runs globally and affects ALL rendering in the app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ThermalState {
  /** Current thermal level: cool → warm → hot → critical */
  thermalLevel: 'cool' | 'warm' | 'hot' | 'critical';
  /** Whether power saver mode is active (manual or automatic) */
  powerSaverActive: boolean;
  /** Current measured FPS */
  currentFps: number;
  /** Average FPS over last 10 seconds */
  averageFps: number;
  /** Whether the page is currently visible */
  isPageVisible: boolean;
  /** Whether the device is on battery (not plugged in) */
  isOnBattery: boolean;
  /** Battery level (0-1) if available */
  batteryLevel: number | null;
  /** Whether low power mode is enabled on device */
  isLowPowerMode: boolean;
}

export interface ThermalOptimizationConfig {
  /** Target FPS for animations (lower = less heat) */
  targetFps: number;
  /** Animation duration multiplier (higher = slower, less CPU) */
  animationSlowdown: number;
  /** Whether to render Spline 3D scenes */
  enableSpline: boolean;
  /** Whether to run CSS animations */
  enableCssAnimations: boolean;
  /** Whether to allow hover effects */
  enableHoverEffects: boolean;
  /** Whether to allow particle effects */
  enableParticles: boolean;
  /** Quality level for any remaining effects */
  qualityLevel: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
  /** Recommended DPR cap */
  maxDpr: number;
}

// ============================================================================
// CONFIGURATION BY THERMAL LEVEL
// NOTE: All levels keep enableSpline=true - we ALWAYS render, just at reduced quality
// ============================================================================

const THERMAL_CONFIGS: Record<ThermalState['thermalLevel'], ThermalOptimizationConfig> = {
  cool: {
    targetFps: 60,
    animationSlowdown: 1.0,
    enableSpline: true,
    enableCssAnimations: true,
    enableHoverEffects: true,
    enableParticles: true,
    qualityLevel: 'high',
    maxDpr: 2.0,
  },
  warm: {
    targetFps: 45,
    animationSlowdown: 1.2,
    enableSpline: true,
    enableCssAnimations: true,
    enableHoverEffects: true,
    enableParticles: false,
    qualityLevel: 'medium',
    maxDpr: 1.5,
  },
  hot: {
    targetFps: 30,
    animationSlowdown: 1.5,
    enableSpline: true,
    enableCssAnimations: false,
    enableHoverEffects: false,
    enableParticles: false,
    qualityLevel: 'low',
    maxDpr: 1.0,
  },
  critical: {
    targetFps: 20,
    animationSlowdown: 2.0,
    enableSpline: true,  // ALWAYS render Spline, just at minimal quality
    enableCssAnimations: false,
    enableHoverEffects: false,
    enableParticles: false,
    qualityLevel: 'minimal',
    maxDpr: 0.5, // Very low DPR for minimal GPU load
  },
};

// Power saver overrides (when manually enabled or low battery)
const POWER_SAVER_CONFIG: ThermalOptimizationConfig = {
  targetFps: 30,
  animationSlowdown: 1.5,
  enableSpline: true,
  enableCssAnimations: false,
  enableHoverEffects: false,
  enableParticles: false,
  qualityLevel: 'low',
  maxDpr: 1.0,
};

// When page is hidden, use absolute minimum
const HIDDEN_PAGE_CONFIG: ThermalOptimizationConfig = {
  targetFps: 0, // No rendering
  animationSlowdown: 10,
  enableSpline: false,
  enableCssAnimations: false,
  enableHoverEffects: false,
  enableParticles: false,
  qualityLevel: 'minimal',
  maxDpr: 0.5,
};

// ============================================================================
// FPS MONITORING
// ============================================================================

class FpsMonitor {
  private frames: number[] = [];
  private lastTime = 0;
  private rafId: number | null = null;
  private onUpdate: (fps: number) => void;
  private isRunning = false;

  constructor(onUpdate: (fps: number) => void) {
    this.onUpdate = onUpdate;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Calculate instantaneous FPS
    if (delta > 0) {
      const fps = 1000 / delta;
      this.frames.push(fps);
      
      // Keep only last 60 frames (roughly 1 second at 60fps)
      if (this.frames.length > 60) {
        this.frames.shift();
      }

      // Report average every ~500ms (30 frames)
      if (this.frames.length % 30 === 0 && this.frames.length >= 30) {
        const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        this.onUpdate(Math.round(avg));
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  getAverageFps(): number {
    if (this.frames.length === 0) return 60;
    return Math.round(this.frames.reduce((a, b) => a + b, 0) / this.frames.length);
  }
}

// ============================================================================
// THERMAL LEVEL DETECTION
// ============================================================================

function detectThermalLevel(fps: number, isOnBattery: boolean, batteryLevel: number | null): ThermalState['thermalLevel'] {
  // If FPS is very low, device is likely thermal throttling
  if (fps < 20) return 'critical';
  if (fps < 30) return 'hot';
  if (fps < 45) return 'warm';
  
  // If on battery with low charge, be more conservative
  if (isOnBattery && batteryLevel !== null && batteryLevel < 0.2) {
    return fps < 50 ? 'hot' : 'warm';
  }
  
  return 'cool';
}

// ============================================================================
// CSS CLASS INJECTION
// ============================================================================

let styleElement: HTMLStyleElement | null = null;

function injectThermalStyles() {
  if (typeof document === 'undefined' || styleElement) return;
  
  styleElement = document.createElement('style');
  styleElement.id = 'thermal-optimization-styles';
  styleElement.textContent = `
/* ============================================================================
   THERMAL OPTIMIZATION - Auto-injected styles for heat prevention
   ============================================================================ */

/* CRITICAL: Pause all CSS animations when page is hidden */
html.page-hidden *,
html.page-hidden *::before,
html.page-hidden *::after {
  animation-play-state: paused !important;
  transition: none !important;
}

/* Disable expensive animations when thermal level is hot or critical */
html.thermal-hot *,
html.thermal-hot *::before,
html.thermal-hot *::after,
html.thermal-critical *,
html.thermal-critical *::before,
html.thermal-critical *::after {
  animation-duration: 0.01ms !important;
  animation-delay: 0.01ms !important;
  transition-duration: 0.01ms !important;
}

/* Reduce animation complexity when warm */
html.thermal-warm * {
  animation-timing-function: linear !important;
}

/* Power saver mode - minimal animations */
html.power-saver-active * {
  animation-iteration-count: 1 !important;
  animation-duration: 50ms !important;
  transition-duration: 50ms !important;
}

/* Disable shimmer effects when hot */
html.thermal-hot .shimmer-line,
html.thermal-hot .shimmer-border,
html.thermal-hot .shimmer-glow,
html.thermal-critical .shimmer-line,
html.thermal-critical .shimmer-border,
html.thermal-critical .shimmer-glow,
html.power-saver-active .shimmer-line,
html.power-saver-active .shimmer-border,
html.power-saver-active .shimmer-glow {
  display: none !important;
  animation: none !important;
}

/* Disable backdrop blur when hot (very expensive) */
html.thermal-hot [class*="backdrop-blur"],
html.thermal-critical [class*="backdrop-blur"],
html.power-saver-active [class*="backdrop-blur"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Reduce shadow complexity when warm or hotter */
html.thermal-warm [class*="shadow-"],
html.thermal-hot [class*="shadow-"],
html.thermal-critical [class*="shadow-"] {
  box-shadow: none !important;
}

/* Disable hover animations when hot */
html.thermal-hot *:hover,
html.thermal-critical *:hover,
html.power-saver-active *:hover {
  transform: none !important;
  filter: none !important;
}

/* Force hardware acceleration hint for remaining elements */
html.thermal-warm .animate-spin,
html.thermal-warm .animate-pulse,
html.thermal-warm .animate-bounce {
  will-change: transform;
  transform: translateZ(0);
}

/* Spline when critical - keep visible but hint at reduced quality via filter */
html.thermal-critical canvas[data-spline],
html.thermal-critical spline-viewer {
  filter: contrast(0.95) !important; /* Slight hint that we're in reduced mode */
  pointer-events: none !important; /* Disable interactions to save CPU */
}

/* When page is hidden, pause Spline completely - user can't see it anyway */
html.page-hidden canvas[data-spline],
html.page-hidden spline-viewer {
  visibility: hidden !important;
  pointer-events: none !important;
}
`;
  document.head.appendChild(styleElement);
}

function updateThermalClasses(state: ThermalState) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Clear existing thermal classes
  root.classList.remove(
    'thermal-cool', 'thermal-warm', 'thermal-hot', 'thermal-critical',
    'power-saver-active', 'page-hidden'
  );
  
  // Add current thermal level
  root.classList.add(`thermal-${state.thermalLevel}`);
  
  // Add power saver if active
  if (state.powerSaverActive) {
    root.classList.add('power-saver-active');
  }
  
  // Add page hidden state
  if (!state.isPageVisible) {
    root.classList.add('page-hidden');
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useThermalOptimization() {
  const [state, setState] = useState<ThermalState>({
    thermalLevel: 'cool',
    powerSaverActive: false,
    currentFps: 60,
    averageFps: 60,
    isPageVisible: true,
    isOnBattery: false,
    batteryLevel: null,
    isLowPowerMode: false,
  });

  const fpsMonitorRef = useRef<FpsMonitor | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);

  // Get current optimization config
  const config = useCallback((): ThermalOptimizationConfig => {
    if (!state.isPageVisible) {
      return HIDDEN_PAGE_CONFIG;
    }
    if (state.powerSaverActive) {
      return POWER_SAVER_CONFIG;
    }
    const base = THERMAL_CONFIGS[state.thermalLevel];

    // IMPORTANT: iOS/macOS ProMotion and high-refresh displays are often variable.
    // If the browser is actually producing >60fps (measured), allow our targetFps
    // to rise accordingly (up to 120) so we don't unnecessarily cap animations.
    // Still respect inferred low power mode.
    if (state.isLowPowerMode) {
      return base;
    }

    const avg = Number.isFinite(state.averageFps) ? state.averageFps : 60;
    const measuredTier: 60 | 90 | 120 = avg >= 110 ? 120 : avg >= 80 ? 90 : 60;
    const targetFps = Math.min(120, Math.max(base.targetFps, measuredTier));

    if (targetFps === base.targetFps) {
      return base;
    }

    return { ...base, targetFps };
  }, [
    state.isPageVisible,
    state.powerSaverActive,
    state.thermalLevel,
    state.isLowPowerMode,
    state.averageFps,
  ]);

  // Toggle power saver
  const togglePowerSaver = useCallback(() => {
    setState(prev => ({ ...prev, powerSaverActive: !prev.powerSaverActive }));
  }, []);

  // Initialize FPS monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inject styles
    injectThermalStyles();
    
    // Create FPS monitor
    const monitor = new FpsMonitor((fps) => {
      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > 20) {
        fpsHistoryRef.current.shift();
      }
      
      const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
      
      setState(prev => {
        const newThermalLevel = detectThermalLevel(avgFps, prev.isOnBattery, prev.batteryLevel);
        return {
          ...prev,
          currentFps: fps,
          averageFps: Math.round(avgFps),
          thermalLevel: newThermalLevel,
        };
      });
    });
    
    fpsMonitorRef.current = monitor;
    monitor.start();
    
    return () => {
      monitor.stop();
    };
  }, []);

  // Monitor page visibility
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibility = () => {
      const isVisible = !document.hidden;
      setState(prev => ({ ...prev, isPageVisible: isVisible }));
      
      // Pause/resume FPS monitor based on visibility
      if (fpsMonitorRef.current) {
        if (isVisible) {
          fpsMonitorRef.current.start();
        } else {
          fpsMonitorRef.current.stop();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Monitor battery status
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return;
    
    let battery: any = null;
    
    const updateBatteryInfo = () => {
      if (!battery) return;
      setState(prev => ({
        ...prev,
        isOnBattery: !battery.charging,
        batteryLevel: battery.level,
      }));
    };
    
    (navigator as any).getBattery?.().then((b: any) => {
      battery = b;
      updateBatteryInfo();
      
      battery.addEventListener('chargingchange', updateBatteryInfo);
      battery.addEventListener('levelchange', updateBatteryInfo);
    });
    
    return () => {
      if (battery) {
        battery.removeEventListener('chargingchange', updateBatteryInfo);
        battery.removeEventListener('levelchange', updateBatteryInfo);
      }
    };
  }, []);

  // Detect iOS Low Power Mode (approximation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // iOS doesn't expose low power mode directly, but we can infer it
    // from reduced animation performance or media queries
    const checkLowPowerMode = () => {
      // Check if reduce motion is enabled (often correlates with low power)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setState(prev => ({ ...prev, isLowPowerMode: prefersReducedMotion }));
    };
    
    checkLowPowerMode();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkLowPowerMode);
    
    return () => mediaQuery.removeEventListener('change', checkLowPowerMode);
  }, []);

  // Update CSS classes when state changes
  useEffect(() => {
    updateThermalClasses(state);
  }, [state]);

  // Emit global events for other components to listen to
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const event = new CustomEvent('thermal-state-change', { detail: { state, config: config() } });
    window.dispatchEvent(event);
  }, [state, config]);

  return {
    ...state,
    config: config(),
    togglePowerSaver,
    // Utility functions for components
    shouldRenderSpline: () => config().enableSpline,
    shouldAnimate: () => config().enableCssAnimations,
    getTargetFps: () => config().targetFps,
    getQualityLevel: () => config().qualityLevel,
    getMaxDpr: () => config().maxDpr,
  };
}

// ============================================================================
// GLOBAL THERMAL STATE (for non-React contexts)
// ============================================================================

let globalThermalState: ThermalState = {
  thermalLevel: 'cool',
  powerSaverActive: false,
  currentFps: 60,
  averageFps: 60,
  isPageVisible: true,
  isOnBattery: false,
  batteryLevel: null,
  isLowPowerMode: false,
};

export function getGlobalThermalState(): ThermalState {
  return globalThermalState;
}

export function setGlobalThermalState(state: Partial<ThermalState>) {
  globalThermalState = { ...globalThermalState, ...state };
}

// Listen for thermal state changes from the hook
if (typeof window !== 'undefined') {
  window.addEventListener('thermal-state-change', ((e: CustomEvent) => {
    globalThermalState = e.detail.state;
  }) as EventListener);
}

export default useThermalOptimization;
