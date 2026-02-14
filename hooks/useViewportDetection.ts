/**
 * ✅ PERF: Consolidated viewport detection hook
 * Replaces multiple separate useEffects with a single optimized observer
 * Reduces re-renders and improves initial load performance
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface ViewportState {
  isMobile: boolean;
  isDesktop: boolean;
  isUltraWide: boolean;
  hasMounted: boolean;
  width: number;
  height: number;
}

const DEFAULT_STATE: ViewportState = {
  isMobile: false,
  isDesktop: false,
  isUltraWide: false,
  hasMounted: false,
  width: 0,
  height: 0,
};

// SSR-safe initial state
const getInitialState = (): ViewportState => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    isMobile: width < 768,
    isDesktop: width >= 1024,
    isUltraWide: width >= 1980,
    hasMounted: true,
    width,
    height,
  };
};

/**
 * Optimized viewport detection hook
 * - Single resize listener instead of multiple
 * - Debounced updates to prevent thrashing
 * - SSR-safe initialization
 */
export function useViewportDetection(): ViewportState {
  const [state, setState] = useState<ViewportState>(DEFAULT_STATE);
  const rafIdRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  // Batch update function
  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined' || !mountedRef.current) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState({
      isMobile: width < 768,
      isDesktop: width >= 1024,
      isUltraWide: width >= 1980,
      hasMounted: true,
      width,
      height,
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial update
    updateViewport();

    // Debounced resize handler using RAF
    const handleResize = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(updateViewport);
    };

    // Also use matchMedia for more efficient desktop/mobile detection
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const ultraWideMq = window.matchMedia('(min-width: 1980px)');

    const handleDesktopChange = () => handleResize();
    const handleUltraWideChange = () => handleResize();

    window.addEventListener('resize', handleResize, { passive: true });
    
    // Use addEventListener for matchMedia if available
    if (typeof desktopMq.addEventListener === 'function') {
      desktopMq.addEventListener('change', handleDesktopChange);
      ultraWideMq.addEventListener('change', handleUltraWideChange);
    } else {
      // Fallback for older browsers
      (desktopMq as any).addListener?.(handleDesktopChange);
      (ultraWideMq as any).addListener?.(handleUltraWideChange);
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      if (typeof desktopMq.removeEventListener === 'function') {
        desktopMq.removeEventListener('change', handleDesktopChange);
        ultraWideMq.removeEventListener('change', handleUltraWideChange);
      } else {
        (desktopMq as any).removeListener?.(handleDesktopChange);
        (ultraWideMq as any).removeListener?.(handleUltraWideChange);
      }
    };
  }, [updateViewport]);

  return state;
}

/**
 * Hook to defer heavy rendering until idle time
 * Useful for below-fold content that doesn't need immediate render
 */
export function useDeferredRender(delay: number = 0): boolean {
  const [shouldRender, setShouldRender] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const enable = () => {
      if (mountedRef.current) setShouldRender(true);
    };

    if (delay === 0) {
      // Use requestIdleCallback for zero delay
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(enable, { timeout: 1000 });
        return () => {
          mountedRef.current = false;
          (window as any).cancelIdleCallback(id);
        };
      }
      // Fallback to setTimeout
      const timeout = setTimeout(enable, 100);
      return () => {
        mountedRef.current = false;
        clearTimeout(timeout);
      };
    }

    // Use specified delay
    const timeout = setTimeout(enable, delay);
    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
    };
  }, [delay]);

  return shouldRender;
}

/**
 * Hook to batch multiple state updates and reduce re-renders
 */
export function useBatchedState<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingRef = useRef<Partial<T>>({});
  const rafIdRef = useRef<number | null>(null);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    pendingRef.current = { ...pendingRef.current, ...updates };
    
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        setState(prev => ({ ...prev, ...pendingRef.current }));
        pendingRef.current = {};
        rafIdRef.current = null;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return [state, batchUpdate];
}
