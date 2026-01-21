'use client';

import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FPSCounter } from './PerformanceProvider';
import { useBrowserDetection } from '@/lib/browserDetection';
import { getFpsEngine, initializeFpsMeasurement } from '@/lib/FpsMeasurement';
import { detectBrowserCapabilities, selectOptimalMeasurementConfig } from '@/lib/FpsCompatibility';
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

// ============================================================================
// SMART SCREENSAVER CONTEXT
// ============================================================================
// This context allows any component to know if the screensaver is active
// and respond to freeze/unfreeze events

interface SmartScreensaverContextType {
  isScreensaverActive: boolean;
  isScreensaverPermanent: boolean;
  isFrozen: boolean;
  /** Whether Spline/heavy resources are being disposed for battery saving */
  isBatterySaving: boolean;
  dismissScreensaver: () => void;
  resetActivity: () => void;
}

const SmartScreensaverContext = createContext<SmartScreensaverContextType>({
  isScreensaverActive: false,
  isScreensaverPermanent: false,
  isFrozen: false,
  isBatterySaving: false,
  dismissScreensaver: () => {},
  resetActivity: () => {},
});

export const useSmartScreensaver = () => useContext(SmartScreensaverContext);

// ============================================================================
// SMART SCREENSAVER COMPONENT
// ============================================================================
// Standalone component that:
// - Detects user idle (5 minutes on desktop)
// - Shows screensaver overlay only after proper idle time
// - Freezes site (CSS-only, non-destructive)
// - Auto-clears browser data for performance
// - Saves battery when permanent
// - Resumes everything smoothly when dismissed

export const SmartScreensaverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [isScreensaverPermanent, setIsScreensaverPermanent] = useState(false);
  const [screensaverFadingOut, setScreensaverFadingOut] = useState(false);
  
  // Get browser detection for reduce animations preference
  const browserInfo = useBrowserDetection();
  const shouldReduceAnimations = browserInfo.shouldReduceAnimations;
  
  // Mobile performance hook
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screensaverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const batterySaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const idleCleanupCountRef = useRef<number>(0);
  
  // ========================================
  // IDLE DETECTION & AUTO-CLEANUP SYSTEM
  // ========================================
  
  const performIdleCleanup = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const cleanupLevel = idleCleanupCountRef.current;
    idleCleanupCountRef.current++;
    
    console.log(`[BULLMONEY] 🧹 Idle cleanup #${cleanupLevel + 1} triggered`);
    
    // Level 1: Light cleanup (first 10 seconds idle)
    if (cleanupLevel >= 0) {
      // Clear volatile localStorage
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('_temp') || 
            key.includes('_volatile') ||
            key.includes('scroll_') ||
            key.includes('hover_') ||
            key.includes('_preview')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (keysToRemove.length > 0) {
          console.log(`[BULLMONEY] Cleared ${keysToRemove.length} temp items`);
        }
      } catch (e) {}
      
      // Clear sessionStorage non-essentials
      ['animation_state', 'scroll_position_cache', 'hover_states', 'modal_history', 'tooltip_cache'].forEach(key => {
        try { sessionStorage.removeItem(key); } catch (e) {}
      });
    }
    
    // Level 2: Medium cleanup (20+ seconds idle)
    if (cleanupLevel >= 1) {
      // Clear image caches
      document.querySelectorAll('img[data-cached]').forEach(img => {
        (img as HTMLImageElement).removeAttribute('data-cached');
      });
      
      // Release blob URLs
      const blobURLs = (window as any).__blobURLs;
      if (Array.isArray(blobURLs)) {
        blobURLs.forEach((url: string) => {
          try { URL.revokeObjectURL(url); } catch (e) {}
        });
        (window as any).__blobURLs = [];
      }
      
      // Clear any animation frame queues
      if ((window as any).__pendingAnimationFrames) {
        (window as any).__pendingAnimationFrames.forEach((id: number) => {
          cancelAnimationFrame(id);
        });
        (window as any).__pendingAnimationFrames = [];
      }
    }
    
    // Level 3: Deep cleanup (30+ seconds idle)
    if (cleanupLevel >= 2) {
      // Clear Cache Storage API entries
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('temp') || name.includes('runtime') || name.includes('preview') || name.includes('dynamic')) {
              caches.delete(name).then(() => {
                console.log(`[BULLMONEY] Cleared cache: ${name}`);
              });
            }
          });
        }).catch(() => {});
      }
      
      // Force GPU memory release
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } catch (e) {}
      
      // Hide offscreen heavy elements
      const viewportHeight = window.innerHeight;
      document.querySelectorAll('iframe:not([data-essential]), video:not([data-essential]), .spline-container').forEach(el => {
        const rect = el.getBoundingClientRect();
        const isOffscreen = rect.bottom < -200 || rect.top > viewportHeight + 200;
        if (isOffscreen) {
          (el as HTMLElement).style.contentVisibility = 'hidden';
        }
      });
    }
    
    // Level 4+: Aggressive cleanup (40+ seconds idle)
    if (cleanupLevel >= 3) {
      if ((window as any).gc) {
        try { (window as any).gc(); } catch (e) {}
      }
      
      if ('indexedDB' in window) {
        try {
          const dbNames = ['bullmoney_temp', 'cache_temp', 'preview_data'];
          dbNames.forEach(name => {
            indexedDB.deleteDatabase(name);
          });
        } catch (e) {}
      }
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('bullmoney-idle-cleanup', {
      detail: { level: cleanupLevel, timestamp: Date.now() }
    }));
    
    console.log(`[BULLMONEY] ⚡ Idle cleanup level ${cleanupLevel} complete`);
    
    // NOTE: Screensaver activation is now handled separately in the idle check interval
    // to ensure proper idle time threshold is met before showing screensaver
  }, []);
  
  // ========================================
  // FREEZE MODE - CSS-only, non-destructive
  // ========================================
  
  // Aggressive Spline/WebGL disposal for battery saving
  const disposeSplineContexts = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    console.log('[BULLMONEY] 🔋 Disposing ALL Spline/WebGL contexts for battery saving...');
    
    let disposedCount = 0;
    
    // 1. Find ALL canvases and force WebGL context loss
    const allCanvases = document.querySelectorAll('canvas');
    allCanvases.forEach((canvas) => {
      try {
        const gl = (canvas as HTMLCanvasElement).getContext('webgl2') || 
                   (canvas as HTMLCanvasElement).getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            ext.loseContext();
            disposedCount++;
            console.log('[BULLMONEY] Lost WebGL context for canvas');
          }
        }
      } catch (e) {
        // Context might already be lost
      }
    });
    
    // 2. Find spline-viewer web components and dispose their internal spline app
    const splineViewers = document.querySelectorAll('spline-viewer');
    console.log(`[BULLMONEY] Found ${splineViewers.length} spline-viewer elements`);
    splineViewers.forEach((viewer: any, index) => {
      try {
        // Try to access the internal Spline app
        if (viewer.spline) {
          console.log(`[BULLMONEY] Disposing spline-viewer ${index} internal app`);
          if (viewer.spline.stop) viewer.spline.stop();
          if (viewer.spline.pause) viewer.spline.pause();
          if (viewer.spline.dispose) {
            viewer.spline.dispose();
            disposedCount++;
          }
        }
        
        // Also try to stop the viewer itself
        if (viewer.stop) viewer.stop();
        if (viewer.pause) viewer.pause();
        
        // Find canvas inside spline-viewer and lose its context
        const viewerCanvas = viewer.shadowRoot?.querySelector('canvas') || viewer.querySelector('canvas');
        if (viewerCanvas) {
          const gl = viewerCanvas.getContext('webgl2') || viewerCanvas.getContext('webgl');
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
              disposedCount++;
              console.log(`[BULLMONEY] Lost spline-viewer ${index} canvas context`);
            }
          }
        }
        
        // Hide the viewer to stop rendering
        (viewer as HTMLElement).style.visibility = 'hidden';
        (viewer as HTMLElement).style.display = 'none';
      } catch (e) {
        console.warn('[BULLMONEY] Error disposing spline-viewer:', e);
      }
    });
    
    // 3. Find iframes with spline content and remove their src
    const splineIframes = document.querySelectorAll('iframe[src*="spline"]');
    splineIframes.forEach((iframe: any) => {
      try {
        iframe.dataset.originalSrc = iframe.src;
        iframe.src = 'about:blank';
        disposedCount++;
        console.log('[BULLMONEY] Blanked spline iframe');
      } catch (e) {}
    });
    
    // 4. Find any global Spline app instances
    if ((window as any).__splineApp) {
      try {
        (window as any).__splineApp.stop?.();
        (window as any).__splineApp.dispose?.();
        (window as any).__splineApp = null;
        disposedCount++;
        console.log('[BULLMONEY] Disposed global __splineApp');
      } catch (e) {}
    }
    
    // 5. Cancel ALL animation frames (aggressive)
    // Cancel up to 10000 RAF IDs as a safety measure
    for (let i = 1; i < 10000; i++) {
      cancelAnimationFrame(i);
    }
    
    // Also cancel tracked RAFs
    if ((window as any).__bullmoneyRAFs) {
      (window as any).__bullmoneyRAFs.forEach((id: number) => {
        cancelAnimationFrame(id);
      });
      (window as any).__bullmoneyRAFs = [];
    }
    
    console.log(`[BULLMONEY] 🔋 Disposed ${disposedCount} WebGL/Spline contexts - ALL ANIMATION FRAMES CANCELLED`);
    
    // Dispatch event for Spline components to handle internally
    window.dispatchEvent(new CustomEvent('bullmoney-spline-dispose', {
      detail: { disposedCount, timestamp: Date.now() }
    }));
  }, []);

  // Restore Spline contexts
  const restoreSplineContexts = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    console.log('[BULLMONEY] ⚡ Signaling Spline components to remount...');
    
    // Re-show spline-viewers
    const splineViewers = document.querySelectorAll('spline-viewer');
    splineViewers.forEach((viewer: any) => {
      try {
        (viewer as HTMLElement).style.visibility = '';
        (viewer as HTMLElement).style.display = '';
      } catch (e) {}
    });
    
    // Restore spline iframes
    const splineIframes = document.querySelectorAll('iframe[data-original-src]');
    splineIframes.forEach((iframe: any) => {
      try {
        if (iframe.dataset.originalSrc) {
          iframe.src = iframe.dataset.originalSrc;
          delete iframe.dataset.originalSrc;
        }
      } catch (e) {}
    });
    
    // Dispatch event for Spline components to remount
    window.dispatchEvent(new CustomEvent('bullmoney-spline-restore', {
      detail: { timestamp: Date.now() }
    }));
  }, []);
  
  useEffect(() => {
    if (!isScreensaverActive) return;
    
    console.log('[BULLMONEY] ❄️ FREEZE MODE - Pausing site and disposing Spline');
    
    // Add frozen class to body
    document.body.classList.add('bullmoney-frozen');
    document.documentElement.classList.add('bullmoney-frozen');
    
    // IMMEDIATELY dispose Spline/WebGL when screensaver shows (not just when permanent)
    // This is the key fix - dispose right away for battery saving
    disposeSplineContexts();
    
    // Dispatch global freeze event
    window.dispatchEvent(new CustomEvent('bullmoney-freeze'));
    
    // Create freeze stylesheet - CSS-only, non-destructive
    const freezeStyle = document.createElement('style');
    freezeStyle.id = 'bullmoney-freeze-style';
    freezeStyle.textContent = `
      /* BULLMONEY FREEZE MODE - CSS ONLY, FULLY REVERSIBLE */
      html.bullmoney-frozen, body.bullmoney-frozen {
        overflow: hidden !important;
      }
      
      .bullmoney-frozen *:not([data-bullmoney-overlay] *):not([data-bullmoney-overlay]) {
        animation-play-state: paused !important;
        transition: none !important;
      }
      
      /* HIDE Spline and heavy elements - will be fully unmounted when permanent */
      .bullmoney-frozen video:not([data-bullmoney-overlay] video),
      .bullmoney-frozen canvas:not([data-bullmoney-overlay] canvas),
      .bullmoney-frozen .spline-container,
      .bullmoney-frozen [data-heavy],
      .bullmoney-frozen [data-spline],
      .bullmoney-frozen spline-viewer {
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
      
      /* Signal to unmount Spline in permanent mode */
      .bullmoney-frozen.bullmoney-permanent .spline-container,
      .bullmoney-frozen.bullmoney-permanent [data-spline],
      .bullmoney-frozen.bullmoney-permanent spline-viewer {
        display: none !important;
      }
      
      /* HIDE TARGET CURSOR during screensaver */
      .bullmoney-frozen .target-cursor-wrapper,
      .bullmoney-frozen [class*="target-cursor"],
      .bullmoney-frozen .target-cursor-dot,
      .bullmoney-frozen .target-cursor-corner {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      
      /* HIDE TRADING QUICK ACCESS / MOVING TIPS during screensaver */
      .bullmoney-frozen .trading-quick-access,
      .bullmoney-frozen .trading-tip-pill,
      .bullmoney-frozen .trading-tip-pill-container,
      .bullmoney-frozen [class*="TradingQuickAccess"],
      .bullmoney-frozen [data-trading-panel],
      .bullmoney-frozen [data-trading-tip] {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      
      /* Allow screensaver overlay to work - HIGHEST Z-INDEX */
      [data-bullmoney-overlay],
      [data-bullmoney-overlay] * {
        animation-play-state: running !important;
        transition: all 0.3s ease !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Screensaver overlay must be above everything */
      #bullmoney-screensaver-overlay,
      .bullmoney-screensaver-active {
        z-index: 2147483647 !important;
        isolation: isolate !important;
      }
      
      /* Force hide target cursor when screensaver is active (backup) */
      html.bullmoney-frozen .target-cursor-wrapper {
        display: none !important;
        z-index: -1 !important;
      }
    `;
    document.head.appendChild(freezeStyle);
    
    // Pause videos (non-destructive - just pause, don't clear src)
    const pausedVideos: HTMLVideoElement[] = [];
    document.querySelectorAll('video').forEach(v => {
      try {
        const video = v as HTMLVideoElement;
        if (!video.paused) {
          video.pause();
          pausedVideos.push(video);
        }
      } catch (e) {}
    });
    (window as any).__bullmoneyPausedVideos = pausedVideos;
    
    // Pause audio (non-destructive)
    const pausedAudios: HTMLAudioElement[] = [];
    document.querySelectorAll('audio').forEach(a => {
      try {
        const audio = a as HTMLAudioElement;
        if (!audio.paused) {
          audio.pause();
          pausedAudios.push(audio);
        }
      } catch (e) {}
    });
    (window as any).__bullmoneyPausedAudios = pausedAudios;
    
    console.log('[BULLMONEY] ❄️ Freeze complete - site paused (fully resumable)');
    
    return () => {
      const styleEl = document.getElementById('bullmoney-freeze-style');
      if (styleEl) styleEl.remove();
      document.body.classList.remove('bullmoney-frozen');
      document.documentElement.classList.remove('bullmoney-frozen');
    };
  }, [isScreensaverActive, disposeSplineContexts]);
  
  // ========================================
  // BATTERY SAVER MODE
  // ========================================
  
  useEffect(() => {
    if (!isScreensaverPermanent) {
      if (batterySaveIntervalRef.current) {
        clearInterval(batterySaveIntervalRef.current);
        batterySaveIntervalRef.current = null;
      }
      return;
    }
    
    console.log('[BULLMONEY] 🔋 Battery saver mode active');
    
    const performBatterySave = () => {
      if ((window as any).gc) {
        try { (window as any).gc(); } catch (e) {}
      }
      
      try {
        const keysToKeep = ['auth', 'user', 'token', 'session'];
        Object.keys(sessionStorage).forEach(key => {
          if (!keysToKeep.some(k => key.toLowerCase().includes(k))) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {}
    };
    
    // Add permanent class for CSS targeting
    document.body.classList.add('bullmoney-permanent');
    document.documentElement.classList.add('bullmoney-permanent');
    
    // AGGRESSIVE: Dispose Spline/WebGL contexts when permanent
    disposeSplineContexts();
    
    performBatterySave();
    batterySaveIntervalRef.current = setInterval(performBatterySave, 10000);
    
    return () => {
      if (batterySaveIntervalRef.current) {
        clearInterval(batterySaveIntervalRef.current);
      }
      document.body.classList.remove('bullmoney-permanent');
      document.documentElement.classList.remove('bullmoney-permanent');
    };
  }, [isScreensaverPermanent, disposeSplineContexts]);
  
  // ========================================
  // DISMISS SCREENSAVER - Full restoration
  // ========================================
  
  const dismissScreensaver = useCallback(() => {
    if (!isScreensaverActive) return;
    
    console.log('[BULLMONEY] 👆 Screensaver dismissed - unfreezing NOW');
    
    if (screensaverTimeoutRef.current) {
      clearTimeout(screensaverTimeoutRef.current);
      screensaverTimeoutRef.current = null;
    }
    
    setScreensaverFadingOut(true);
    
    // IMMEDIATELY remove freeze and permanent classes
    document.body.classList.remove('bullmoney-permanent');
    document.documentElement.classList.remove('bullmoney-permanent');
    
    const freezeStyle = document.getElementById('bullmoney-freeze-style');
    if (freezeStyle) {
      freezeStyle.remove();
      console.log('[BULLMONEY] ✓ Removed freeze stylesheet');
    }
    
    const screensaverStyle = document.getElementById('bullmoney-screensaver-style');
    if (screensaverStyle) screensaverStyle.remove();
    
    // Signal Spline components to restore/remount
    restoreSplineContexts();
    
    document.body.classList.remove('bullmoney-frozen');
    document.documentElement.classList.remove('bullmoney-frozen');
    console.log('[BULLMONEY] ✓ Removed frozen classes');
    
    // Dispatch unfreeze event
    window.dispatchEvent(new CustomEvent('bullmoney-unfreeze'));
    
    // Resume paused videos
    const pausedVideos = (window as any).__bullmoneyPausedVideos as HTMLVideoElement[];
    if (pausedVideos && pausedVideos.length > 0) {
      pausedVideos.forEach(video => {
        try { video.play().catch(() => {}); } catch (e) {}
      });
      delete (window as any).__bullmoneyPausedVideos;
      console.log(`[BULLMONEY] ✓ Resumed ${pausedVideos.length} videos`);
    }
    
    // Resume paused audio
    const pausedAudios = (window as any).__bullmoneyPausedAudios as HTMLAudioElement[];
    if (pausedAudios && pausedAudios.length > 0) {
      pausedAudios.forEach(audio => {
        try { audio.play().catch(() => {}); } catch (e) {}
      });
      delete (window as any).__bullmoneyPausedAudios;
      console.log(`[BULLMONEY] ✓ Resumed ${pausedAudios.length} audio`);
    }
    
    // After fade animation, finalize state
    setTimeout(() => {
      setIsScreensaverActive(false);
      setIsScreensaverPermanent(false);
      setScreensaverFadingOut(false);
      lastActivityRef.current = Date.now();
      idleCleanupCountRef.current = 0;
      console.log('[BULLMONEY] ✅ Site fully resumed!');
    }, 400);
    
  }, [isScreensaverActive, restoreSplineContexts]);
  
  // Reset activity (for external components to call)
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleCleanupCountRef.current = 0;
  }, []);
  
  // ========================================
  // ACTIVITY TRACKING
  // ========================================
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      idleCleanupCountRef.current = 0;
      
      // If screensaver is showing but not permanent yet, dismiss it
      if (isScreensaverActive && !isScreensaverPermanent) {
        dismissScreensaver();
      }
    };
    
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Check idle status every 5 seconds (1 second in dev for faster testing)
    const checkInterval = process.env.NODE_ENV === 'development' ? 1000 : 5000;
    idleCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      // 10 seconds in dev, 5 minutes in production
      const IDLE_THRESHOLD = process.env.NODE_ENV === 'development' ? 10000 : 300000;
      
      if (idleTime >= IDLE_THRESHOLD && !isScreensaverActive) {
        console.log('[BULLMONEY] User idle detected - triggering cleanup and screensaver');
        performIdleCleanup();
        
        // Only show screensaver after the actual idle threshold is met
        console.log(`[BULLMONEY] 🖥️ Showing screensaver - user idle for ${process.env.NODE_ENV === 'development' ? '10 seconds (dev)' : '5+ minutes'}`);
        setIsScreensaverActive(true);
        setIsScreensaverPermanent(false);
        setScreensaverFadingOut(false);
        
        // After 10 seconds, if no interaction, make it permanent
        screensaverTimeoutRef.current = setTimeout(() => {
          setIsScreensaverPermanent(true);
          console.log('[BULLMONEY] 🖥️ Screensaver mode activated - battery saver on');
        }, 10000);
      }
    }, checkInterval);
    
    // Initial check after mount - only run cleanup, not screensaver
    // Screensaver will only activate through the interval check after real idle time
    const initialCheckTimeout = setTimeout(() => {
      // Just reset the activity timestamp on mount to start fresh
      lastActivityRef.current = Date.now();
    }, 1000);
    
    // Page visibility handler - only run light cleanup when hidden, never show screensaver
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only perform light cleanup when tab is hidden, don't trigger screensaver
        performIdleCleanup();
      } else {
        // Reset activity when user returns to the page
        lastActivityRef.current = Date.now();
        idleCleanupCountRef.current = 0;
        // If screensaver was showing when returning, dismiss it
        if (isScreensaverActive) {
          dismissScreensaver();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
      clearTimeout(initialCheckTimeout);
    };
  }, [performIdleCleanup, dismissScreensaver, isScreensaverActive, isScreensaverPermanent]);
  
  // Context value - includes battery saving state (permanent = battery saving)
  const contextValue: SmartScreensaverContextType = {
    isScreensaverActive,
    isScreensaverPermanent,
    isFrozen: isScreensaverActive,
    isBatterySaving: isScreensaverPermanent, // Battery saving mode = permanent screensaver
    dismissScreensaver,
    resetActivity,
  };
  
  return (
    <SmartScreensaverContext.Provider value={contextValue}>
      {children}
      
      {/* BULLMONEY Screensaver Overlay - HIGHEST Z-INDEX, above cursor and trading tips */}
      <AnimatePresence>
        {isScreensaverActive && (
          <motion.div
            data-bullmoney-overlay="true"
            id="bullmoney-screensaver-overlay"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: screensaverFadingOut 
                ? (shouldReduceAnimations ? 0 : [1, 0.6, 0.3, 0])
                : (shouldReduceAnimations ? 1 : [0, 0.4, 0.7, 1])
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: shouldReduceAnimations ? 0.1 : (screensaverFadingOut ? 0.5 : 0.8),
              ease: shouldReduceAnimations ? 'linear' : [0.4, 0, 0.2, 1],
            }}
            className="fixed inset-0 flex items-center justify-center cursor-pointer bullmoney-screensaver-active"
            onClick={dismissScreensaver}
            onTouchStart={dismissScreensaver}
            style={{
              background: '#000000',
              zIndex: 2147483647, // Maximum z-index - same as target cursor to ensure we're on top
              isolation: 'isolate',
            }}
          >
            {/* Subtle ambient glow - disabled when reduce animations is on */}
            {!shouldReduceAnimations && !shouldSkipHeavyEffects && (
              <motion.div 
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
                    'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.12) 0%, transparent 55%)',
                    'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
                  ]
                }}
                transition={shouldSkipHeavyEffects ? {} : {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            
            {/* Static ambient glow for reduced motion */}
            {shouldReduceAnimations && (
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 60%)',
                }}
              />
            )}
            
            {/* Gentle scan lines */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(59, 130, 246, 0.05) 3px, rgba(59, 130, 246, 0.05) 6px)',
              }}
            />
            
            {/* Main Content */}
            <motion.div
              initial={shouldReduceAnimations ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 30 }}
              animate={shouldReduceAnimations 
                ? { opacity: screensaverFadingOut ? 0 : 1 }
                : { 
                    scale: screensaverFadingOut ? [1, 0.95] : [0.9, 1.02, 1],
                    opacity: screensaverFadingOut ? [1, 0] : [0, 0.7, 1],
                    y: screensaverFadingOut ? [0, 20] : [30, -5, 0],
                  }
              }
              transition={{ 
                duration: shouldReduceAnimations ? 0.1 : (screensaverFadingOut ? 0.4 : 0.6),
                ease: shouldReduceAnimations ? 'linear' : [0.34, 1.56, 0.64, 1],
              }}
              className="relative select-none flex flex-col items-center gap-3 sm:gap-5 px-4"
            >
              {/* BULLMONEY Logo */}
              <div className="relative">
                <span 
                  className="absolute text-4xl sm:text-6xl md:text-7xl font-black tracking-widest"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '2px rgba(59, 130, 246, 0.2)',
                    filter: 'blur(10px)',
                    transform: 'translate(-2px, -2px)',
                  }}
                >
                  BULLMONEY
                </span>
                {shouldReduceAnimations ? (
                  <span 
                    className="relative text-4xl sm:text-6xl md:text-7xl font-black tracking-widest"
                    style={{
                      color: '#3b82f6',
                      textShadow: '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    BULLMONEY
                  </span>
                ) : (
                  <motion.span 
                    className="relative text-4xl sm:text-6xl md:text-7xl font-black tracking-widest"
                    animate={shouldSkipHeavyEffects ? {} : {
                      textShadow: [
                        '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)',
                        '0 0 30px #3b82f6, 0 0 60px rgba(59, 130, 246, 0.7), 0 0 90px rgba(59, 130, 246, 0.4)',
                        '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)',
                      ],
                    }}
                    transition={shouldSkipHeavyEffects ? {} : {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      color: '#3b82f6',
                      textShadow: shouldSkipHeavyEffects ? '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.6)' : undefined,
                    }}
                  >
                    BULLMONEY
                  </motion.span>
                )}
              </div>
              
              {/* Boost message */}
              <motion.div
                initial={{ opacity: 0, y: shouldReduceAnimations ? 0 : 20 }}
                animate={{ 
                  opacity: screensaverFadingOut ? 0 : 1,
                  y: screensaverFadingOut ? (shouldReduceAnimations ? 0 : 10) : 0,
                }}
                transition={{ duration: shouldReduceAnimations ? 0.1 : 0.5, delay: shouldReduceAnimations ? 0 : 0.2 }}
                className="flex flex-col items-center gap-2"
              >
                {/* Checkmark icon */}
                <motion.div
                  initial={{ scale: shouldReduceAnimations ? 1 : 0 }}
                  animate={{ scale: screensaverFadingOut ? 0 : 1 }}
                  transition={(shouldReduceAnimations || shouldSkipHeavyEffects)
                    ? { duration: 0.1 } 
                    : { duration: 0.4, delay: 0.3, type: 'spring', stiffness: 200 }
                  }
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2"
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: shouldSkipHeavyEffects ? 'none' : '0 0 20px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <svg 
                    className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    {shouldReduceAnimations ? (
                      <path
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M5 13l4 4L19 7" 
                      />
                    ) : (
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: screensaverFadingOut ? 0 : 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M5 13l4 4L19 7" 
                      />
                    )}
                  </svg>
                </motion.div>
                
                <span 
                  className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide text-center"
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  we boosted the website for you
                </span>
                
                <motion.span
                  animate={(shouldReduceAnimations || shouldSkipHeavyEffects) ? {} : {
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={(shouldReduceAnimations || shouldSkipHeavyEffects) ? {} : {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-sm sm:text-base font-medium tracking-wider uppercase mt-3"
                  style={{
                    color: 'rgba(59, 130, 246, 0.7)',
                    opacity: shouldSkipHeavyEffects ? 0.7 : undefined,
                  }}
                >
                  {isScreensaverPermanent ? 'tap anywhere to continue' : 'saving battery...'}
                </motion.span>
              </motion.div>
              
              {/* Battery indicator when permanent */}
              {isScreensaverPermanent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: shouldReduceAnimations ? 0 : 0.5 }}
                  className="absolute bottom-[-80px] flex items-center gap-2"
                >
                  <motion.div
                    animate={(shouldReduceAnimations || shouldSkipHeavyEffects) ? {} : {
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={(shouldReduceAnimations || shouldSkipHeavyEffects) ? {} : {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      opacity: (shouldReduceAnimations || shouldSkipHeavyEffects) ? 0.6 : undefined,
                    }}
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2h2v2zm0-4h-2V9h2v5z"/>
                    </svg>
                    <span className="text-xs text-blue-500/70 font-medium">battery saver active</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
            
            {/* Dev FPS Counter in screensaver */}
            <FPSCounter show={process.env.NODE_ENV === 'development'} />
          </motion.div>
        )}
      </AnimatePresence>
    </SmartScreensaverContext.Provider>
  );
};

export default SmartScreensaverProvider;
