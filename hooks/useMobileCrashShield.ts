"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Mobile Crash Shield Hook
 * 
 * Integrates components with the mobile crash prevention system.
 * Provides smart loading, memory-aware rendering, and crash prevention.
 * 
 * @example
 * ```tsx
 * function SplineComponent() {
 *   const { shouldSkipHeavy, shouldLoad, memoryPressure } = useMobileCrashShield({
 *     componentId: 'my-spline-scene',
 *     priority: 'normal'
 *   });
 *   
 *   if (!shouldLoad) return <LoadingSkeleton />;
 *   if (shouldSkipHeavy) return <LightweightVersion />;
 *   
 *   return <HeavyComponent />;
 * }
 * ```
 */

interface CrashShieldOptions {
  /** Unique identifier for this component */
  componentId: string;
  /** Loading priority: high (100ms), normal (idle), low (idle+5s) */
  priority?: 'high' | 'normal' | 'low';
  /** Skip loading entirely on low-memory devices */
  skipOnLowMemory?: boolean;
  /** Viewport margin for lazy loading (default: 400px) */
  viewportMargin?: string;
}

interface CrashShieldState {
  /** Skip heavy render effects due to memory pressure */
  shouldSkipHeavy: boolean;
  /** Reduce component quality (lower FPS, textures, etc) */
  shouldReduceQuality: boolean;
  /** Component is ready to load */
  shouldLoad: boolean;
  /** Current memory pressure level */
  memoryPressure: 'normal' | 'warning' | 'critical';
  /** Current memory usage in MB */
  memoryMB: number;
  /** Memory budget in MB */
  budgetMB: number;
  /** Queue heavy 3D/Spline loads to prevent simultaneous WebGL contexts */
  queueSplineLoad: (sceneUrl: string, callback: () => void) => void;
  /** Register component for deferred loading */
  deferLoad: (element: HTMLElement, loadFn: () => void) => void;
}

export function useMobileCrashShield(options: CrashShieldOptions): CrashShieldState {
  const {
    componentId,
    priority = 'normal',
    skipOnLowMemory = false,
    viewportMargin = '400px'
  } = options;

  const [shouldSkipHeavy, setShouldSkipHeavy] = useState(false);
  const [shouldReduceQuality, setShouldReduceQuality] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority === 'high');
  const [memoryPressure, setMemoryPressure] = useState<'normal' | 'warning' | 'critical'>('normal');
  const [memoryMB, setMemoryMB] = useState(0);
  const [budgetMB, setBudgetMB] = useState(0);
  
  const loadTimerRef = useRef<NodeJS.Timeout>();
  const hasLoadedRef = useRef(false);

  // Get crash shield instance
  const getShield = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return (window as any).__BM_CRASH_SHIELD__;
  }, []);

  // Initialize load timing based on priority
  useEffect(() => {
    if (hasLoadedRef.current) return;
    if (priority === 'high') {
      // High priority loads immediately
      setShouldLoad(true);
      hasLoadedRef.current = true;
      return;
    }

    const shield = getShield();
    if (!shield) {
      // No shield - load after small delay
      loadTimerRef.current = setTimeout(() => {
        setShouldLoad(true);
        hasLoadedRef.current = true;
      }, priority === 'low' ? 2000 : 500);
      return;
    }

    // Check if we should skip on low memory
    if (skipOnLowMemory && (shield.deviceMem <= 2 || shield.isInApp)) {
      console.log(`[CrashShield] Skipping ${componentId} on low-memory device`);
      setShouldLoad(false);
      return;
    }

    // Use requestIdleCallback for normal/low priority
    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(() => {
        setShouldLoad(true);
        hasLoadedRef.current = true;
      }, { timeout: priority === 'low' ? 5000 : 2000 });

      return () => cancelIdleCallback(idleId);
    } else {
      // Fallback for browsers without requestIdleCallback
      loadTimerRef.current = setTimeout(() => {
        setShouldLoad(true);
        hasLoadedRef.current = true;
      }, priority === 'low' ? 1000 : 300);
    }

    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
    };
  }, [componentId, priority, skipOnLowMemory, getShield]);

  // Listen to memory pressure events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shield = getShield();
    if (shield) {
      setBudgetMB(shield.memoryBudget || 0);
    }

    const handleMemoryPressure = (event: CustomEvent) => {
      const { level, memoryMB: currentMem, budgetMB: budget } = event.detail;
      setMemoryPressure(level);
      setMemoryMB(currentMem);
      setBudgetMB(budget);
    };

    const handlePerformanceHint = (event: CustomEvent) => {
      const { skipHeavy, reduceQuality, memoryMB: currentMem } = event.detail;
      setShouldSkipHeavy(skipHeavy);
      setShouldReduceQuality(reduceQuality);
      setMemoryMB(currentMem);
    };

    window.addEventListener('bullmoney-memory-pressure', handleMemoryPressure as EventListener);
    window.addEventListener('bullmoney-performance-hint', handlePerformanceHint as EventListener);

    // Initial check
    if (shield) {
      const skipHeavy = shield.shouldSkipHeavyEffect?.() || false;
      const reduceQuality = shield.shouldReduceQuality?.() || false;
      setShouldSkipHeavy(skipHeavy);
      setShouldReduceQuality(reduceQuality);
    }

    return () => {
      window.removeEventListener('bullmoney-memory-pressure', handleMemoryPressure as EventListener);
      window.removeEventListener('bullmoney-performance-hint', handlePerformanceHint as EventListener);
    };
  }, [getShield]);

  // Queue Spline load helper
  const queueSplineLoad = useCallback((sceneUrl: string, callback: () => void) => {
    const shield = getShield();
    if (shield?.queueSplineLoad) {
      shield.queueSplineLoad(sceneUrl, callback);
    } else {
      // No shield - load directly
      callback();
    }
  }, [getShield]);

  // Defer load helper
  const deferLoad = useCallback((element: HTMLElement, loadFn: () => void) => {
    const shield = getShield();
    if (shield?.registerDeferredComponent) {
      shield.registerDeferredComponent(element, loadFn, viewportMargin);
    } else {
      // No shield - load immediately
      loadFn();
    }
  }, [getShield, viewportMargin]);

  return {
    shouldSkipHeavy,
    shouldReduceQuality,
    shouldLoad,
    memoryPressure,
    memoryMB,
    budgetMB,
    queueSplineLoad,
    deferLoad
  };
}

/**
 * Simpler hook for components that just need to know if they should skip heavy effects
 */
export function useSkipHeavyEffects(): boolean {
  const [shouldSkip, setShouldSkip] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHint = (event: CustomEvent) => {
      setShouldSkip(event.detail.skipHeavy);
    };

    window.addEventListener('bullmoney-performance-hint', handleHint as EventListener);

    // Initial check
    const shield = (window as any).__BM_CRASH_SHIELD__;
    if (shield?.shouldSkipHeavyEffect) {
      setShouldSkip(shield.shouldSkipHeavyEffect());
    }

    return () => {
      window.removeEventListener('bullmoney-performance-hint', handleHint as EventListener);
    };
  }, []);

  return shouldSkip;
}

/**
 * Hook to get current memory stats
 */
export function useMemoryStats() {
  const [stats, setStats] = useState({
    memoryMB: 0,
    budgetMB: 0,
    pressure: 'normal' as 'normal' | 'warning' | 'critical'
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePressure = (event: CustomEvent) => {
      setStats({
        memoryMB: event.detail.memoryMB || 0,
        budgetMB: event.detail.budgetMB || 0,
        pressure: event.detail.level || 'normal'
      });
    };

    window.addEventListener('bullmoney-memory-pressure', handlePressure as EventListener);

    // Initial check
    const shield = (window as any).__BM_CRASH_SHIELD__;
    if (shield) {
      setStats({
        memoryMB: shield.currentMemoryMB || 0,
        budgetMB: shield.memoryBudget || 0,
        pressure: 'normal'
      });
    }

    return () => {
      window.removeEventListener('bullmoney-memory-pressure', handlePressure as EventListener);
    };
  }, []);

  return stats;
}
