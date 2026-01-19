"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// PERFORMANCE STORE - Zustand for Transient Updates (Zero Re-renders)
// ============================================================================

/**
 * High-Performance Store for 120Hz displays
 * Uses Zustand's transient updates to avoid React re-renders
 * Only the subscribed components update - not the entire tree
 */

export interface FrameMetrics {
  currentFps: number;
  targetFps: number;
  frameTime: number;
  droppedFrames: number;
  isThrottled: boolean;
}

export interface ScrollMetrics {
  scrollY: number;
  scrollVelocity: number;
  scrollDirection: 'up' | 'down' | 'idle';
  isScrolling: boolean;
  scrollProgress: number;
}

export interface AnimationState {
  activeAnimations: number;
  gpuMemoryUsage: number;
  cpuLoad: number;
  isHighRefreshRate: boolean;
  detectedHz: number;
  // NEW: Desktop-specific state
  isAppleSilicon: boolean;
  isHighEndDesktop: boolean;
  gpuType: 'integrated' | 'discrete' | 'apple-gpu' | 'unknown';
}

export interface PerformanceStore {
  // Frame metrics (updated 60-120 times per second)
  frame: FrameMetrics;
  
  // Scroll metrics (updated on RAF)
  scroll: ScrollMetrics;
  
  // Animation state
  animation: AnimationState;
  
  // Display info
  isProMotion: boolean;
  refreshRate: number;
  
  // Performance mode
  performanceMode: 'ultra' | 'balanced' | 'power-saver';
  reduceMotion: boolean;
  
  // Actions - these use transient updates (no re-render)
  updateFrame: (metrics: Partial<FrameMetrics>) => void;
  updateScroll: (metrics: Partial<ScrollMetrics>) => void;
  updateAnimation: (state: Partial<AnimationState>) => void;
  setRefreshRate: (hz: number) => void;
  setPerformanceMode: (mode: 'ultra' | 'balanced' | 'power-saver') => void;
  setReduceMotion: (reduce: boolean) => void;
  
  // Transient update refs (for RAF loops - ZERO re-renders)
  _transientScrollY: number;
  _transientVelocity: number;
  _transientFps: number;
}

export const usePerformanceStore = create<PerformanceStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial frame metrics
    frame: {
      currentFps: 60,
      targetFps: 60,
      frameTime: 16.67,
      droppedFrames: 0,
      isThrottled: false,
    },
    
    // Initial scroll metrics
    scroll: {
      scrollY: 0,
      scrollVelocity: 0,
      scrollDirection: 'idle',
      isScrolling: false,
      scrollProgress: 0,
    },
    
    // Initial animation state
    animation: {
      activeAnimations: 0,
      gpuMemoryUsage: 0,
      cpuLoad: 0,
      isHighRefreshRate: false,
      detectedHz: 60,
      // NEW: Desktop-specific defaults
      isAppleSilicon: false,
      isHighEndDesktop: false,
      gpuType: 'unknown',
    },
    
    // Display defaults
    isProMotion: false,
    refreshRate: 60,
    performanceMode: 'ultra',
    reduceMotion: false,
    
    // Transient values (direct mutation for RAF - no state update)
    _transientScrollY: 0,
    _transientVelocity: 0,
    _transientFps: 60,
    _lastFrameUpdate: 0,
    _lastScrollUpdate: 0,
    
    // Frame update (batched, throttled to 10fps for React state)
    updateFrame: (metrics) => {
      const store = get();
      const now = Date.now();
      
      // Update transient value directly (zero re-render)
      if (metrics.currentFps !== undefined) {
        store._transientFps = metrics.currentFps;
      }
      
      // Throttle React state updates to every 100ms to prevent infinite loops
      if (now - store._lastFrameUpdate < 100) {
        return; // Skip this update
      }
      store._lastFrameUpdate = now;
      
      // Only update React state if values actually changed
      const currentFrame = store.frame;
      const hasChanges = Object.keys(metrics).some(
        key => metrics[key as keyof typeof metrics] !== currentFrame[key as keyof typeof currentFrame]
      );
      if (!hasChanges) return;
      
      set((state) => ({
        frame: { ...state.frame, ...metrics }
      }));
    },
    
    // Scroll update with transient optimization
    updateScroll: (metrics) => {
      const store = get();
      // Direct mutation for RAF performance
      if (metrics.scrollY !== undefined) {
        store._transientScrollY = metrics.scrollY;
      }
      if (metrics.scrollVelocity !== undefined) {
        store._transientVelocity = metrics.scrollVelocity;
      }
      // Batch React state updates
      set((state) => ({
        scroll: { ...state.scroll, ...metrics }
      }));
    },
    
    updateAnimation: (state) => set((prev) => ({
      animation: { ...prev.animation, ...state }
    })),
    
    setRefreshRate: (hz) => set({
      refreshRate: hz,
      isProMotion: hz >= 120,
      frame: {
        ...get().frame,
        targetFps: hz,
        frameTime: 1000 / hz,
      },
      animation: {
        ...get().animation,
        isHighRefreshRate: hz >= 90,
        detectedHz: hz,
      }
    }),
    
    setPerformanceMode: (mode) => set({ performanceMode: mode }),
    setReduceMotion: (reduce) => set({ reduceMotion: reduce }),
  }))
);

// ============================================================================
// TRANSIENT SELECTORS - Subscribe without causing re-renders
// ============================================================================

/**
 * Get transient scroll value (for RAF loops)
 * This reads directly from the store without subscribing to changes
 */
export const getTransientScroll = () => usePerformanceStore.getState()._transientScrollY;
export const getTransientVelocity = () => usePerformanceStore.getState()._transientVelocity;
export const getTransientFps = () => usePerformanceStore.getState()._transientFps;

/**
 * Subscribe to specific values only (selective re-rendering)
 */
export const useScrollY = () => usePerformanceStore((s) => s.scroll.scrollY);
export const useScrollDirection = () => usePerformanceStore((s) => s.scroll.scrollDirection);
export const useIsScrolling = () => usePerformanceStore((s) => s.scroll.isScrolling);
export const useCurrentFps = () => usePerformanceStore((s) => s.frame.currentFps);
export const useIsProMotion = () => usePerformanceStore((s) => s.isProMotion);
export const usePerformanceMode = () => usePerformanceStore((s) => s.performanceMode);
