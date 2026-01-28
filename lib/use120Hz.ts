"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 120Hz Refresh Rate Detection & Optimization Hook
 * 
 * Detects native display refresh rate and provides optimized animation utilities
 * for ProMotion displays (iPhone Pro, iPad Pro) and high-refresh monitors.
 */

export interface RefreshRateInfo {
  nativeHz: number;           // Detected native refresh rate
  targetHz: number;           // Target FPS for animations (may be capped)
  isHighRefresh: boolean;     // True if 90Hz+
  isProMotion: boolean;       // True if 120Hz+
  frameInterval: number;      // Milliseconds per frame
  supportsVariableRate: boolean; // True if display supports dynamic refresh
  actualFps: number;          // Real-time measured FPS
}

// Cache detected rate to avoid repeated calculations
let cachedRefreshRate: number | null = null;
let measuredFps: number = 60;

/**
 * Measure actual frame rate in real-time
 */
export function measureActualFrameRate(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(60);
      return;
    }
    
    let frames = 0;
    let startTime = performance.now();
    const targetFrames = 30; // Measure 30 frames for accuracy
    
    const countFrame = (timestamp: number) => {
      frames++;
      if (frames < targetFrames) {
        requestAnimationFrame(countFrame);
      } else {
        const elapsed = timestamp - startTime;
        const fps = Math.round((frames / elapsed) * 1000);
        // Round to nearest common refresh rate
        if (fps >= 110) measuredFps = 120;
        else if (fps >= 80) measuredFps = 90;
        else if (fps >= 55) measuredFps = 60;
        else measuredFps = 30;
        resolve(measuredFps);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
}

/**
 * Detect the native display refresh rate
 * Uses multiple detection methods for best accuracy
 */
export function detectRefreshRate(): number {
  if (typeof window === 'undefined') return 60;
  if (cachedRefreshRate !== null) return cachedRefreshRate;
  
  // Method 1: Modern Screen API (Chrome 110+)
  if ('refreshRate' in (window.screen as any)) {
    const rate = (window.screen as any).refreshRate as number;
    cachedRefreshRate = rate;
    return rate;
  }
  
  // Method 2: Check for ProMotion devices via user agent/screen
  const isProMotionDevice = detectProMotionDevice();
  if (isProMotionDevice) {
    cachedRefreshRate = 120;
    return 120;
  }
  
  // Method 3: Assume 60Hz as fallback
  cachedRefreshRate = 60;
  return 60;
}

/**
 * Detect ProMotion-capable devices (iPhone Pro, iPad Pro, high-refresh monitors)
 * ENHANCED: Now includes Apple Silicon Macs and high-refresh desktop monitors
 */
function detectProMotionDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const dpr = window.devicePixelRatio;
  
  // iPhone Pro detection (13 Pro+, 14 Pro+, 15 Pro+, 16 Pro+, 17 Pro+)
  const isIPhone = /iphone/.test(ua);
  if (isIPhone && dpr >= 3) {
    // iPhone Pro models have specific screen dimensions
    // iPhone 16 Pro/Pro Max: 402x874, 440×956
    // iPhone 15 Pro/Pro Max: 393x852, 430x932
    // iPhone 14 Pro/Pro Max: 390x844, 428x926
    // iPhone 13 Pro/Pro Max: 390x844, 428x926
    if (
      (screenWidth === 402 || screenWidth === 440) || // 16 Pro/Max
      (screenWidth === 393 || screenWidth === 430) || // 15 Pro/Max
      (screenWidth === 390 || screenWidth === 428) || // 14/13 Pro/Max
      (screenHeight >= 844 && dpr >= 3) // General Pro-class height with Retina
    ) {
      console.log('[120Hz] 📱 iPhone Pro detected - ProMotion 120Hz enabled');
      return true;
    }
  }
  
  // iPad Pro detection (all support ProMotion)
  const isIPadPro = /ipad/.test(ua) && dpr >= 2 && screenWidth >= 1024;
  if (isIPadPro) return true;
  
  // NEW: Apple Silicon Mac detection (M1, M2, M3, M4 with ProMotion displays)
  const isMac = /macintosh|mac os x/i.test(ua);
  if (isMac) {
    // Check for Apple GPU (indicates Apple Silicon)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          // Apple Silicon GPUs
          if (renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer))) {
            console.log('[120Hz] 🍎 Apple Silicon Mac detected:', renderer);
            return true;
          }
        }
      }
    } catch (e) {}
    
    // Fallback: Check for high core count (Apple Silicon has 8+ cores)
    const cores = navigator.hardwareConcurrency || 4;
    if (cores >= 8) {
      console.log('[120Hz] 🖥️ High-core Mac detected (likely Apple Silicon)');
      return true;
    }
  }
  
  // High-refresh gaming monitors (typically 1440p+)
  const isHighRefreshMonitor = screenWidth >= 2560;
  if (isHighRefreshMonitor) {
    console.log('[120Hz] 🖥️ High-resolution display detected, assuming high-refresh capable');
    return true;
  }
  
  // Samsung Galaxy S/Note/Ultra high-refresh detection
  const isSamsungHighRefresh = /samsung|sm-g|sm-n|sm-s/i.test(ua) && dpr >= 2.5;
  if (isSamsungHighRefresh) return true;
  
  // OnePlus, Xiaomi, and other high-refresh Android devices
  const isHighRefreshAndroid = /oneplus|xiaomi|redmi|poco|oppo|realme|vivo|asus rog|razer/i.test(ua) && dpr >= 2;
  if (isHighRefreshAndroid) return true;
  
  // Google Pixel Pro (90Hz+)
  const isPixelPro = /pixel.*pro/i.test(ua);
  if (isPixelPro) return true;
  
  // NEW: Windows high-refresh desktop detection
  const isWindows = /windows/i.test(ua);
  if (isWindows && screenWidth >= 1920) {
    const memory = (navigator as any).deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 4;
    // High-spec Windows PC likely has high-refresh monitor
    if (memory >= 16 && cores >= 8) {
      console.log('[120Hz] 🖥️ High-spec Windows PC detected');
      return true;
    }
  }
  
  return false;
}

/**
 * Main hook for 120Hz optimization with real-time FPS measurement
 */
export function use120Hz(): RefreshRateInfo {
  const [info, setInfo] = useState<RefreshRateInfo>(() => ({
    nativeHz: 60,
    targetHz: 60,
    isHighRefresh: false,
    isProMotion: false,
    frameInterval: 16.67,
    supportsVariableRate: false,
    actualFps: 60,
  }));
  
  useEffect(() => {
    const initRefreshRate = async () => {
      const nativeHz = detectRefreshRate();
      const targetHz = Math.min(nativeHz, 120); // Cap at 120Hz
      
      // Measure actual FPS capability
      const actualFps = await measureActualFrameRate();
      
      setInfo({
        nativeHz,
        targetHz: Math.min(targetHz, actualFps), // Use measured if lower
        isHighRefresh: nativeHz >= 90,
        isProMotion: nativeHz >= 120,
        frameInterval: 1000 / targetHz,
        supportsVariableRate: 'refreshRate' in (window.screen as any),
        actualFps,
      });
      
      console.log(`🖥️ Display: ${nativeHz}Hz detected, measured ${actualFps}fps, targeting ${Math.min(targetHz, actualFps)}fps`);
    };
    
    initRefreshRate();
  }, []);
  
  return info;
}

/**
 * Optimized requestAnimationFrame for 120Hz displays
 * Provides consistent frame pacing even on variable refresh displays
 */
export function useOptimizedRAF() {
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const { frameInterval, targetHz } = use120Hz();
  
  const animate = useCallback((callback: (deltaTime: number) => void) => {
    const loop = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameRef.current;
      
      // For 120Hz, we want every frame
      // For 60Hz on 120Hz display, skip every other frame
      if (deltaTime >= frameInterval * 0.9) { // 0.9 for tolerance
        lastFrameRef.current = timestamp;
        callback(deltaTime);
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [frameInterval]);
  
  return { animate, targetHz, frameInterval };
}

/**
 * CSS custom properties for 120Hz-aware animations
 */
export function inject120HzCSS(): void {
  if (typeof document === 'undefined') return;
  
  const nativeHz = detectRefreshRate();
  const root = document.documentElement;
  
  root.style.setProperty('--native-refresh-rate', String(nativeHz));
  root.style.setProperty('--target-fps', String(Math.min(nativeHz, 120)));
  root.style.setProperty('--frame-duration', `${1000 / nativeHz}ms`);
  root.style.setProperty('--is-high-refresh', nativeHz >= 90 ? '1' : '0');
  
  // Add class for CSS-based feature detection
  if (nativeHz >= 120) {
    root.classList.add('display-120hz');
  } else if (nativeHz >= 90) {
    root.classList.add('display-90hz');
  }
}

export default use120Hz;
