"use client";

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSmartScreensaver } from '@/components/SmartScreensaver';

// ============================================================================
// BATTERY SAVER HOOK
// ============================================================================
// This hook manages heavy resource cleanup when screensaver is active:
// - Disposes Spline/WebGL contexts
// - Pauses requestAnimationFrame loops
// - Stops Web Workers
// - Pauses background intervals/timeouts
// - Reduces CPU/GPU usage for maximum battery savings

interface BatterySaverOptions {
  /** Whether to completely unmount Spline scenes (default: true) */
  disposeSpline?: boolean;
  /** Whether to pause all animation frames (default: true) */
  pauseAnimations?: boolean;
  /** Whether to pause Web Workers (default: true) */
  pauseWorkers?: boolean;
  /** Whether to clear GPU memory (default: true) */
  clearGpuMemory?: boolean;
  /** Custom cleanup callback */
  onFreeze?: () => void;
  /** Custom resume callback */
  onUnfreeze?: () => void;
}

interface SplineInstance {
  dispose?: () => void;
  pause?: () => void;
  play?: () => void;
  stop?: () => void;
  _renderer?: {
    dispose?: () => void;
    forceContextLoss?: () => void;
  };
}

// Global registry of Spline instances for disposal
const splineRegistry = new Map<string, SplineInstance>();
const rafRegistry = new Map<string, number>();
const workerRegistry = new Map<string, Worker>();
const intervalRegistry = new Map<string, NodeJS.Timeout>();

/**
 * Register a Spline app instance for battery saver management
 */
export function registerSplineInstance(id: string, instance: SplineInstance): void {
  splineRegistry.set(id, instance);
  console.log(`[BatterySaver] Registered Spline instance: ${id}`);
}

/**
 * Unregister a Spline app instance
 */
export function unregisterSplineInstance(id: string): void {
  splineRegistry.delete(id);
  console.log(`[BatterySaver] Unregistered Spline instance: ${id}`);
}

/**
 * Register a requestAnimationFrame ID for pausing
 */
export function registerRAF(id: string, rafId: number): void {
  rafRegistry.set(id, rafId);
}

/**
 * Unregister a requestAnimationFrame
 */
export function unregisterRAF(id: string): void {
  rafRegistry.delete(id);
}

/**
 * Register a Web Worker for pausing
 */
export function registerWorker(id: string, worker: Worker): void {
  workerRegistry.set(id, worker);
}

/**
 * Unregister a Web Worker
 */
export function unregisterWorker(id: string): void {
  workerRegistry.delete(id);
}

/**
 * Register a background interval
 */
export function registerInterval(id: string, intervalId: NodeJS.Timeout): void {
  intervalRegistry.set(id, intervalId);
}

/**
 * Unregister a background interval
 */
export function unregisterInterval(id: string): void {
  intervalRegistry.delete(id);
}

/**
 * Battery saver state for tracking disposal
 */
interface BatterySaverState {
  disposedSplines: string[];
  pausedRAFs: string[];
  pausedWorkers: string[];
  pausedIntervals: string[];
  clearedGpuContexts: boolean;
}

/**
 * Main battery saver hook
 */
export function useBatterySaver(options: BatterySaverOptions = {}): {
  isSaving: boolean;
  disposedCount: number;
} {
  const {
    disposeSpline = true,
    pauseAnimations = true,
    pauseWorkers = true,
    clearGpuMemory = true,
    onFreeze,
    onUnfreeze,
  } = options;

  const { isScreensaverActive, isScreensaverPermanent } = useSmartScreensaver();
  const stateRef = useRef<BatterySaverState>({
    disposedSplines: [],
    pausedRAFs: [],
    pausedWorkers: [],
    pausedIntervals: [],
    clearedGpuContexts: false,
  });
  const [disposedCount, setDisposedCount] = useState(0);

  // Dispose all Spline instances
  const disposeSplines = useCallback(() => {
    if (!disposeSpline) return;
    
    const disposed: string[] = [];
    splineRegistry.forEach((instance, id) => {
      try {
        // First try to pause
        if (instance.pause) {
          instance.pause();
        }
        if (instance.stop) {
          instance.stop();
        }
        
        // Then dispose WebGL renderer
        if (instance._renderer?.dispose) {
          instance._renderer.dispose();
        }
        if (instance._renderer?.forceContextLoss) {
          instance._renderer.forceContextLoss();
        }
        
        // Finally dispose the app
        if (instance.dispose) {
          instance.dispose();
        }
        
        disposed.push(id);
        console.log(`[BatterySaver] Disposed Spline: ${id}`);
      } catch (e) {
        console.warn(`[BatterySaver] Failed to dispose Spline ${id}:`, e);
      }
    });
    
    stateRef.current.disposedSplines = disposed;
    setDisposedCount(disposed.length);
  }, [disposeSpline]);

  // Pause all animation frames
  const pauseRAFs = useCallback(() => {
    if (!pauseAnimations) return;
    
    const paused: string[] = [];
    rafRegistry.forEach((rafId, id) => {
      try {
        cancelAnimationFrame(rafId);
        paused.push(id);
        console.log(`[BatterySaver] Cancelled RAF: ${id}`);
      } catch (e) {
        console.warn(`[BatterySaver] Failed to cancel RAF ${id}:`, e);
      }
    });
    
    stateRef.current.pausedRAFs = paused;
  }, [pauseAnimations]);

  // Pause Web Workers
  const pauseAllWorkers = useCallback(() => {
    if (!pauseWorkers) return;
    
    const paused: string[] = [];
    workerRegistry.forEach((worker, id) => {
      try {
        worker.postMessage({ type: 'PAUSE' });
        paused.push(id);
        console.log(`[BatterySaver] Paused worker: ${id}`);
      } catch (e) {
        console.warn(`[BatterySaver] Failed to pause worker ${id}:`, e);
      }
    });
    
    stateRef.current.pausedWorkers = paused;
  }, [pauseWorkers]);

  // Resume Web Workers
  const resumeAllWorkers = useCallback(() => {
    if (!pauseWorkers) return;
    
    stateRef.current.pausedWorkers.forEach((id) => {
      const worker = workerRegistry.get(id);
      if (worker) {
        try {
          worker.postMessage({ type: 'RESUME' });
          console.log(`[BatterySaver] Resumed worker: ${id}`);
        } catch (e) {
          console.warn(`[BatterySaver] Failed to resume worker ${id}:`, e);
        }
      }
    });
    
    stateRef.current.pausedWorkers = [];
  }, [pauseWorkers]);

  // Pause all background intervals
  const pauseIntervals = useCallback(() => {
    const paused: string[] = [];
    intervalRegistry.forEach((intervalId, id) => {
      try {
        clearInterval(intervalId);
        paused.push(id);
        console.log(`[BatterySaver] Cleared interval: ${id}`);
      } catch (e) {
        console.warn(`[BatterySaver] Failed to clear interval ${id}:`, e);
      }
    });
    
    stateRef.current.pausedIntervals = paused;
  }, []);

  // Clear GPU memory aggressively
  const clearGpuMemoryFn = useCallback(() => {
    if (!clearGpuMemory || typeof window === 'undefined') return;
    
    try {
      // Find all WebGL canvases and force context loss
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach((canvas) => {
        try {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
              console.log('[BatterySaver] Lost WebGL context for canvas');
            }
          }
        } catch (e) {
          // Context might already be lost
        }
      });
      
      stateRef.current.clearedGpuContexts = true;
      console.log('[BatterySaver] GPU memory cleared');
    } catch (e) {
      console.warn('[BatterySaver] Failed to clear GPU memory:', e);
    }
  }, [clearGpuMemory]);

  // Dispatch event for Spline components to unmount
  const dispatchSplineUnmount = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    window.dispatchEvent(new CustomEvent('bullmoney-spline-unmount', {
      detail: { timestamp: Date.now() }
    }));
    console.log('[BatterySaver] Dispatched spline unmount event');
  }, []);

  // Dispatch event for Spline components to remount
  const dispatchSplineRemount = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    window.dispatchEvent(new CustomEvent('bullmoney-spline-remount', {
      detail: { timestamp: Date.now() }
    }));
    console.log('[BatterySaver] Dispatched spline remount event');
  }, []);

  // Main freeze effect
  useEffect(() => {
    if (!isScreensaverActive) return;
    
    console.log('[BatterySaver] 🔋 Battery saver activating...');
    
    // Immediate actions
    dispatchSplineUnmount();
    pauseRAFs();
    pauseAllWorkers();
    
    // Call custom freeze callback
    onFreeze?.();
    
    // If screensaver becomes permanent, do aggressive cleanup
    if (isScreensaverPermanent) {
      console.log('[BatterySaver] 🔋 Permanent mode - aggressive cleanup');
      
      // Delay heavy cleanup slightly to ensure smooth screensaver transition
      const cleanupTimeout = setTimeout(() => {
        disposeSplines();
        clearGpuMemoryFn();
        pauseIntervals();
        
        // Force garbage collection if available (Chrome DevTools)
        if ((window as any).gc) {
          try {
            (window as any).gc();
            console.log('[BatterySaver] Forced garbage collection');
          } catch (e) {}
        }
      }, 500);
      
      return () => {
        clearTimeout(cleanupTimeout);
      };
    }
  }, [isScreensaverActive, isScreensaverPermanent, dispatchSplineUnmount, pauseRAFs, pauseAllWorkers, disposeSplines, clearGpuMemoryFn, pauseIntervals, onFreeze]);

  // Main unfreeze effect
  useEffect(() => {
    if (isScreensaverActive) return;
    
    // Only run unfreeze if we previously froze
    if (stateRef.current.disposedSplines.length > 0 || 
        stateRef.current.pausedWorkers.length > 0 ||
        stateRef.current.clearedGpuContexts) {
      
      console.log('[BatterySaver] ⚡ Battery saver deactivating - restoring resources');
      
      // Resume workers
      resumeAllWorkers();
      
      // Dispatch remount event for Spline components
      dispatchSplineRemount();
      
      // Call custom unfreeze callback
      onUnfreeze?.();
      
      // Reset state
      stateRef.current = {
        disposedSplines: [],
        pausedRAFs: [],
        pausedWorkers: [],
        pausedIntervals: [],
        clearedGpuContexts: false,
      };
      setDisposedCount(0);
    }
  }, [isScreensaverActive, resumeAllWorkers, dispatchSplineRemount, onUnfreeze]);

  return {
    isSaving: isScreensaverActive,
    disposedCount,
  };
}

/**
 * Hook for components that need to respond to battery saver events
 * Returns whether the component should be mounted/rendered
 */
export function useSplineBatterySaver(): {
  shouldRender: boolean;
  isFrozen: boolean;
} {
  const { isScreensaverActive, isScreensaverPermanent } = useSmartScreensaver();
  const [shouldRender, setShouldRender] = useState(true);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleUnmount = () => {
      console.log('[SplineBatterySaver] Received unmount event');
      
      // Clear any pending remount
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
      
      // Delay unmount slightly for smooth transition
      unmountTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    };

    const handleRemount = () => {
      console.log('[SplineBatterySaver] Received remount event');
      
      // Clear any pending unmount
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
      
      setShouldRender(true);
    };

    window.addEventListener('bullmoney-spline-unmount', handleUnmount);
    window.addEventListener('bullmoney-spline-remount', handleRemount);

    return () => {
      window.removeEventListener('bullmoney-spline-unmount', handleUnmount);
      window.removeEventListener('bullmoney-spline-remount', handleRemount);
      
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
    };
  }, []);

  // Also respond directly to screensaver state
  useEffect(() => {
    if (isScreensaverPermanent) {
      // Unmount on permanent screensaver
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
      unmountTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 500);
    } else if (!isScreensaverActive && !shouldRender) {
      // Remount when screensaver dismissed
      setShouldRender(true);
    }
  }, [isScreensaverActive, isScreensaverPermanent, shouldRender]);

  return {
    shouldRender,
    isFrozen: isScreensaverActive,
  };
}

export default useBatterySaver;
