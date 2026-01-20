"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePerformanceStore } from '@/stores/performanceStore';

// ============================================================================
// 120Hz DISPLAY DETECTION & INITIALIZATION
// ============================================================================

/**
 * Initialize performance optimizations for high-refresh-rate displays
 * This hook should be called once at the app root
 */
export function usePerformanceInit() {
  const initRef = useRef(false);
  const fpsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  
  const { 
    setRefreshRate, 
    updateFrame, 
    setReduceMotion,
    setPerformanceMode 
  } = usePerformanceStore();

  /**
   * Measure actual display refresh rate using RAF timing
   */
  const measureRefreshRate = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      const samples: number[] = [];
      let lastTime = performance.now();
      let frameCount = 0;
      const targetFrames = 60; // Sample 60 frames

      const measure = (time: number) => {
        const delta = time - lastTime;
        if (delta > 0) {
          samples.push(1000 / delta);
        }
        lastTime = time;
        frameCount++;

        if (frameCount < targetFrames) {
          requestAnimationFrame(measure);
        } else {
          // Calculate median FPS (more stable than average)
          samples.sort((a, b) => a - b);
          const median = samples[Math.floor(samples.length / 2)];
          
          // Round to nearest common refresh rate
          let detectedHz = 60;
          if (median >= 115) detectedHz = 120;
          else if (median >= 85) detectedHz = 90;
          else if (median >= 70) detectedHz = 75;
          else if (median >= 55) detectedHz = 60;
          else detectedHz = 30;
          
          resolve(detectedHz);
        }
      };

      requestAnimationFrame(measure);
    });
  }, []);

  /**
   * Detect ProMotion-capable devices
   * ENHANCED: Now includes Apple Silicon Macs and all high-refresh desktops
   */
  const detectProMotion = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    const ua = navigator.userAgent.toLowerCase();
    const dpr = window.devicePixelRatio;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 8;

    // iPhone Pro models (13 Pro+, 14 Pro+, 15 Pro+, 16 Pro+)
    const isIPhonePro = /iphone/.test(ua) && dpr >= 3;
    
    // iPad Pro detection
    const isIPadPro = /ipad/.test(ua) && (
      window.screen.width >= 1024 || 
      window.screen.height >= 1024
    );
    
    // ENHANCED: Apple Silicon Mac detection
    const isMac = /macintosh|mac os x/i.test(ua);
    let isAppleSilicon = false;
    if (isMac) {
      // Check for Apple GPU via WebGL
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
            isAppleSilicon = renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer));
          }
        }
      } catch (e) {}
      // Fallback: 8+ core Mac is likely Apple Silicon
      if (!isAppleSilicon && cores >= 8) {
        isAppleSilicon = true;
      }
    }
    
    // MacBook Pro with ProMotion (14" and 16" from 2021+) or any Apple Silicon Mac
    const isMacBookPro = isMac && (
      isAppleSilicon ||
      window.screen.width >= 3024 || // 14" scaled
      window.screen.height >= 1964
    );
    
    // ENHANCED: High-refresh desktop monitor detection
    const isHighRefreshDesktop = (
      window.screen.width >= 2560 || // 1440p+ monitors often 144Hz+
      (memory >= 16 && cores >= 8) // High-spec PC likely has good monitor
    );
    
    // High-refresh gaming monitors (check via Screen API if available)
    const hasScreenAPI = 'refreshRate' in (window.screen as any);
    if (hasScreenAPI) {
      const screenHz = (window.screen as any).refreshRate;
      if (screenHz >= 90) return true;
    }

    const result = isIPhonePro || isIPadPro || isMacBookPro || isAppleSilicon || isHighRefreshDesktop;
    
    if (result && !isIPhonePro && !isIPadPro) {
      console.log('[PerformanceInit] 🖥️ Desktop high-refresh detected:', {
        isAppleSilicon,
        isMacBookPro,
        isHighRefreshDesktop,
        cores,
        memory: `${memory}GB`
      });
    }
    
    return result;
  }, []);

  /**
   * FPS monitoring loop
   */
  const startFPSMonitoring = useCallback(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const monitor = (time: number) => {
      frameCount++;
      const elapsed = time - lastTime;
      
      // Update every 500ms
      if (elapsed >= 500) {
        const fps = Math.round((frameCount / elapsed) * 1000);
        fpsRef.current.push(fps);
        
        // Keep last 10 samples
        if (fpsRef.current.length > 10) {
          fpsRef.current.shift();
        }
        
        // Calculate average
        const avgFps = Math.round(
          fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
        );
        
        updateFrame({
          currentFps: avgFps,
          frameTime: 1000 / avgFps,
          isThrottled: avgFps < 50,
        });
        
        frameCount = 0;
        lastTime = time;
      }
      
      rafRef.current = requestAnimationFrame(monitor);
    };
    
    rafRef.current = requestAnimationFrame(monitor);
  }, [updateFrame]);

  // Initialize on mount
  useEffect(() => {
    if (initRef.current || typeof window === 'undefined') return;
    initRef.current = true;

    console.log('[PerformanceInit] Starting 120Hz optimization...');

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    setReduceMotion(prefersReducedMotion);

    // Listen for reduced motion changes
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };
    motionMediaQuery.addEventListener('change', handleMotionChange);

    // Detect display capabilities
    const initAsync = async () => {
      // First check for ProMotion device
      const isProMotion = detectProMotion();
      
      if (isProMotion) {
        console.log('[PerformanceInit] ProMotion device detected');
        setRefreshRate(120);
        document.documentElement.classList.add('display-120hz', 'fps-120');
      } else {
        // Measure actual refresh rate
        const measuredHz = await measureRefreshRate();
        console.log(`[PerformanceInit] Measured refresh rate: ${measuredHz}Hz`);
        setRefreshRate(measuredHz);
        
        if (measuredHz >= 120) {
          document.documentElement.classList.add('display-120hz', 'fps-120');
        } else if (measuredHz >= 90) {
          document.documentElement.classList.add('display-90hz', 'fps-90');
        }
      }

      // Set performance mode based on device
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.saveData || connection.effectiveType === '2g') {
          setPerformanceMode('power-saver');
        } else if (connection.effectiveType === '3g') {
          setPerformanceMode('balanced');
        } else {
          setPerformanceMode('ultra');
        }
      }

      // Start FPS monitoring
      startFPSMonitoring();
    };

    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    if ('requestIdleCallback' in window) {
      idleHandle = (window as any).requestIdleCallback(() => {
        initAsync();
      }, { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(() => {
        initAsync();
      }, 0);
    }

    // Cleanup
    return () => {
      motionMediaQuery.removeEventListener('change', handleMotionChange);
      if (idleHandle !== null && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    detectProMotion, 
    measureRefreshRate, 
    setPerformanceMode, 
    setReduceMotion, 
    setRefreshRate, 
    startFPSMonitoring
  ]);
}

// ============================================================================
// CSS CUSTOM PROPERTY UPDATER
// ============================================================================

/**
 * Sync performance state to CSS custom properties
 * Allows CSS animations to be aware of display capabilities
 */
export function usePerformanceCSSSync() {
  const { refreshRate, frame, performanceMode } = usePerformanceStore();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Update CSS custom properties
    root.style.setProperty('--native-refresh-rate', String(refreshRate));
    root.style.setProperty('--target-fps', String(frame.targetFps));
    root.style.setProperty('--frame-duration', `${frame.frameTime}ms`);
    
    // Set animation speed multiplier based on refresh rate
    const animationSpeed = refreshRate >= 120 ? 0.8 : refreshRate >= 90 ? 0.9 : 1;
    root.style.setProperty('--animation-speed', String(animationSpeed));
    
    // Performance mode classes
    root.classList.remove('perf-ultra', 'perf-balanced', 'perf-power-saver');
    root.classList.add(`perf-${performanceMode}`);
    
  }, [refreshRate, frame.targetFps, frame.frameTime, performanceMode]);
}
