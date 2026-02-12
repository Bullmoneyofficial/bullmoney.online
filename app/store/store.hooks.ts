import { useEffect, useState } from 'react';

/**
 * Defers execution until browser is idle - improves initial page load
 * @param callback Function to execute when idle
 * @param deps Dependency array
 */
export function useIdleEffect(callback: () => void | (() => void), deps: React.DependencyList = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let cleanup: void | (() => void);
    let timeoutId: NodeJS.Timeout;
    
    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(() => {
        cleanup = callback();
      }, { timeout: 2000 });
      
      return () => {
        (window as any).cancelIdleCallback(idleId);
        if (cleanup) cleanup();
      };
    } else {
      // Fallback for browsers without requestIdleCallback
      timeoutId = setTimeout(() => {
        cleanup = callback();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (cleanup) cleanup();
      };
    }
     
  }, deps);
}

/**
 * Returns true after component has mounted and browser is idle
 * Use to defer rendering of non-critical components
 */
export function useIdleMount(delay = 0) {
  const [isIdle, setIsIdle] = useState(false);
  
  useIdleEffect(() => {
    const timeoutId = setTimeout(() => setIsIdle(true), delay);
    return () => clearTimeout(timeoutId);
  }, [delay]);
  
  return isIdle;
}

/**
 * Progressively loads features based on priority
 * Returns flags indicating which feature sets should be active
 * ✅ MATCHES app/page.tsx sequenceStage pattern (140ms intervals for 120fps feel)
 */
export function useProgressiveLoad() {
  const [loadStage, setLoadStage] = useState(0);
  
  useEffect(() => {
    // Stage 0: Initial render (immediate)
    // Stage 1: Critical interactive elements (next frame — 1 frame at 60fps)
    const timer1 = requestAnimationFrame(() => setLoadStage(1));
    
    // Stage 2: Below-fold content (after 140ms — matches home page staging)
    const timer2 = setTimeout(() => setLoadStage(2), 140);
    
    // Stage 3: Heavy animations and extras (after 280ms — 2x stage interval)
    const timer3 = setTimeout(() => setLoadStage(3), 280);
    
    return () => {
      cancelAnimationFrame(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  return {
    showCritical: loadStage >= 0,      // Search, filters, initial products
    showInteractive: loadStage >= 1,   // Product interactions, hover effects
    showBelowFold: loadStage >= 2,     // Featured section, extras
    showHeavy: loadStage >= 3,         // 3D hero, animations, world map
  };
}
