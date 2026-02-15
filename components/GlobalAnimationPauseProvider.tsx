"use client";

/**
 * GlobalAnimationPauseProvider.tsx - Master Animation Control System
 * 
 * PROBLEM: Phones get hot because animations continue running even when:
 * - The page/tab is not visible
 * - The user hasn't interacted in a while
 * - The device is in low power mode
 * 
 * SOLUTION: This provider creates a global pause system that:
 * - Pauses ALL CSS animations when tab is hidden
 * - Pauses requestAnimationFrame loops when tab is hidden  
 * - Reduces animation quality on mobile automatically
 * - Provides hooks for components to check pause state
 * 
 * USAGE: Wrap your app with <GlobalAnimationPauseProvider>
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AnimationPauseState {
  /** Whether all animations should be paused */
  isPaused: boolean;
  /** Why animations are paused */
  pauseReason: 'visible' | 'hidden' | 'idle' | 'power-saver' | 'thermal';
  /** Timestamp of last user interaction */
  lastInteraction: number;
  /** Whether the page is currently visible */
  isPageVisible: boolean;
  /** Whether we're in idle mode (no interaction for 60s) */
  isIdle: boolean;
  /** Device type for optimization decisions */
  isMobile: boolean;
  /** Current animation speed multiplier (1 = normal, 0.5 = half speed) */
  speedMultiplier: number;
}

interface AnimationPauseContextType extends AnimationPauseState {
  /** Force pause animations (for modals, etc) */
  forcePause: () => void;
  /** Force resume animations */
  forceResume: () => void;
  /** Record user interaction (resets idle timer) */
  recordInteraction: () => void;
  /** Get whether a specific animation type should run */
  shouldAnimate: (type: 'css' | 'canvas' | 'spline' | 'video') => boolean;
}

const defaultState: AnimationPauseState = {
  isPaused: false,
  pauseReason: 'visible',
  lastInteraction: Date.now(),
  isPageVisible: true,
  isIdle: false,
  isMobile: false,
  speedMultiplier: 1,
};

// ============================================================================
// CONTEXT
// ============================================================================

const AnimationPauseContext = createContext<AnimationPauseContextType>({
  ...defaultState,
  forcePause: () => {},
  forceResume: () => {},
  recordInteraction: () => {},
  shouldAnimate: () => true,
});

export function useAnimationPause() {
  return useContext(AnimationPauseContext);
}

// ============================================================================
// RAF MANAGER - Centralized requestAnimationFrame tracking
// ============================================================================

class RAFManager {
  private static instance: RAFManager;
  private rafIds = new Set<number>();
  private isPaused = false;
  private pausedCallbacks = new Map<number, () => void>();

  static getInstance() {
    if (!RAFManager.instance) {
      RAFManager.instance = new RAFManager();
    }
    return RAFManager.instance;
  }

  // Override global requestAnimationFrame to track all RAF calls
  install() {
    if (typeof window === 'undefined') return;
    
    // Store original RAF
    const originalRAF = window.requestAnimationFrame.bind(window);
    const originalCAF = window.cancelAnimationFrame.bind(window);
    
    // Override RAF
    (window as any).__bullmoneyRAF = originalRAF;
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      if (this.isPaused) {
        // Store callback to run when resumed
        const fakeId = Date.now() + Math.random();
        this.pausedCallbacks.set(fakeId, () => originalRAF(callback));
        return fakeId as any;
      }
      
      const id = originalRAF((time) => {
        this.rafIds.delete(id);
        callback(time);
      });
      this.rafIds.add(id);
      return id;
    };
    
    // Override CAF
    window.cancelAnimationFrame = (id: number) => {
      this.rafIds.delete(id);
      this.pausedCallbacks.delete(id);
      originalCAF(id);
    };
  }

  pause() {
    this.isPaused = true;
    // Cancel all active RAF loops - they'll be resumed when unpaused
    const originalCAF = (window as any).__bullmoneyCAF || window.cancelAnimationFrame;
    this.rafIds.forEach(id => {
      originalCAF(id);
    });
    this.rafIds.clear();
  }

  resume() {
    this.isPaused = false;
    // Run any paused callbacks
    const originalRAF = (window as any).__bullmoneyRAF || window.requestAnimationFrame;
    this.pausedCallbacks.forEach((cb) => {
      cb();
    });
    this.pausedCallbacks.clear();
  }
  
  get paused() {
    return this.isPaused;
  }
}

// ============================================================================
// CSS ANIMATION PAUSE STYLES
// ============================================================================

const PAUSE_STYLES = `
/* Global Animation Pause System - Injected dynamically */

/* PAUSE ALL: When page is hidden or paused */
html.animations-paused *,
html.animations-paused *::before,
html.animations-paused *::after {
  animation-play-state: paused !important;
  transition: none !important;
}

/* PAUSE ALL: Spline and canvas when paused */
html.animations-paused canvas,
html.animations-paused spline-viewer,
html.animations-paused [data-spline] {
  visibility: hidden !important;
}

/* IDLE MODE: Reduce but don't stop animations */
html.animations-idle * {
  animation-duration: 2s !important;
  animation-timing-function: linear !important;
}

/* SLOW MODE: For mobile/thermal throttling */
html.animations-slow * {
  animation-duration: 1.5s !important;
  transition-duration: 150ms !important;
}

/* When thermal-hot or thermal-critical, use pause styles too */
html.thermal-critical canvas,
html.thermal-critical spline-viewer {
  visibility: hidden !important;
}
`;

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface Props {
  children: ReactNode;
  /** Idle timeout in ms (default: 60000 = 1 minute) */
  idleTimeout?: number;
  /** Whether to install RAF override (default: true) */
  manageRAF?: boolean;
}

export function GlobalAnimationPauseProvider({ 
  children, 
  idleTimeout = 60000,
  manageRAF = true,
}: Props) {
  const [state, setState] = useState<AnimationPauseState>(() => ({
    ...defaultState,
    isMobile: typeof window !== 'undefined' && 
      (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)),
  }));
  
  const rafManager = useRef<RAFManager | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forcePausedRef = useRef(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Inject pause styles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.id = 'global-animation-pause-styles';
      styleRef.current.textContent = PAUSE_STYLES;
      document.head.appendChild(styleRef.current);
    }
    
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  // Install RAF manager
  useEffect(() => {
    if (!manageRAF || typeof window === 'undefined') return;
    
    rafManager.current = RAFManager.getInstance();
    rafManager.current.install();
  }, [manageRAF]);

  // Update CSS classes when state changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Clear all animation state classes
    root.classList.remove('animations-paused', 'animations-idle', 'animations-slow');
    
    if (state.isPaused) {
      root.classList.add('animations-paused');
    } else if (state.isIdle) {
      root.classList.add('animations-idle');
    } else if (state.isMobile && state.speedMultiplier < 1) {
      root.classList.add('animations-slow');
    }
  }, [state.isPaused, state.isIdle, state.isMobile, state.speedMultiplier]);

  // Sync RAF manager with pause state
  useEffect(() => {
    if (!rafManager.current) return;
    
    if (state.isPaused) {
      rafManager.current.pause();
    } else {
      rafManager.current.resume();
    }
  }, [state.isPaused]);

  // Monitor page visibility
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibility = () => {
      const isVisible = !document.hidden;
      
      setState(prev => ({
        ...prev,
        isPageVisible: isVisible,
        isPaused: !isVisible || forcePausedRef.current,
        pauseReason: !isVisible ? 'hidden' : (forcePausedRef.current ? prev.pauseReason : 'visible'),
      }));

      // Emit global event for other systems to listen
      window.dispatchEvent(new CustomEvent('bullmoney-visibility-change', { 
        detail: { isVisible } 
      }));
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Also handle when the page loses focus (e.g., switching apps on mobile)
    window.addEventListener('blur', () => {
      // Short delay to avoid false positives during interactions
      setTimeout(() => {
        if (!document.hasFocus()) {
          setState(prev => ({
            ...prev,
            isPaused: true,
            pauseReason: 'hidden',
          }));
        }
      }, 100);
    });
    
    window.addEventListener('focus', () => {
      if (!forcePausedRef.current && !document.hidden) {
        setState(prev => ({
          ...prev,
          isPaused: false,
          pauseReason: 'visible',
        }));
      }
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Idle detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      
      // If we were idle, we're not anymore
      setState(prev => ({
        ...prev,
        isIdle: false,
        lastInteraction: Date.now(),
      }));
      
      // Set new idle timer
      idleTimerRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isIdle: true,
          speedMultiplier: 0.5, // Slow down when idle
        }));
      }, idleTimeout);
    };
    
    // Track user interactions
    const interactionEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    interactionEvents.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });
    
    // Start idle timer
    resetIdleTimer();
    
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      interactionEvents.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [idleTimeout]);

  // Mobile-specific: Reduce animation speed
  useEffect(() => {
    if (!state.isMobile) return;
    
    // On mobile, run animations slower to reduce heat
    setState(prev => ({
      ...prev,
      speedMultiplier: 0.75,
    }));
  }, [state.isMobile]);

  // Listen for thermal state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleThermalChange = (e: CustomEvent) => {
      const { state: thermalState } = e.detail;
      
      if (thermalState.thermalLevel === 'critical' || thermalState.thermalLevel === 'hot') {
        setState(prev => ({
          ...prev,
          isPaused: thermalState.thermalLevel === 'critical',
          pauseReason: 'thermal',
          speedMultiplier: thermalState.thermalLevel === 'critical' ? 0 : 0.5,
        }));
      }
    };
    
    window.addEventListener('thermal-state-change', handleThermalChange as EventListener);
    return () => window.removeEventListener('thermal-state-change', handleThermalChange as EventListener);
  }, []);

  // Context actions
  const forcePause = useCallback(() => {
    forcePausedRef.current = true;
    setState(prev => ({
      ...prev,
      isPaused: true,
      pauseReason: 'power-saver',
    }));
  }, []);

  const forceResume = useCallback(() => {
    forcePausedRef.current = false;
    if (!document.hidden) {
      setState(prev => ({
        ...prev,
        isPaused: false,
        pauseReason: 'visible',
      }));
    }
  }, []);

  const recordInteraction = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastInteraction: Date.now(),
      isIdle: false,
    }));
  }, []);

  const shouldAnimate = useCallback((type: 'css' | 'canvas' | 'spline' | 'video') => {
    if (state.isPaused) return false;
    
    // On mobile, be more conservative
    if (state.isMobile) {
      if (type === 'spline' && state.isIdle) return false;
      if (type === 'canvas' && state.isIdle) return false;
    }
    
    return true;
  }, [state.isPaused, state.isMobile, state.isIdle]);

  const value: AnimationPauseContextType = {
    ...state,
    forcePause,
    forceResume,
    recordInteraction,
    shouldAnimate,
  };

  return (
    <AnimationPauseContext.Provider value={value}>
      {children}
    </AnimationPauseContext.Provider>
  );
}

export default GlobalAnimationPauseProvider;
