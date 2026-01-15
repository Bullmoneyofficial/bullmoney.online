"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from 'react';

/**
 * Performance System
 * 
 * Comprehensive performance optimizations for:
 * - Desktop mouse-only scrolling
 * - In-app browser detection and enhancement
 * - FPS monitoring and optimization
 * - GPU acceleration hints
 * - Lazy loading optimization
 */

// Browser detection utilities
export const detectBrowserCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      isDesktop: true,
      isMobile: false,
      isInAppBrowser: false,
      hasGPU: true,
      memory: 8,
      cores: 4,
      isHighPerformance: true,
      supportsWebGL: true,
      supports120Hz: false,
      browserName: 'SSR',
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isDesktop = !isMobile;
  
  // In-app browser detection
  const isInAppBrowser = 
    /fbav|fban|instagram|twitter|line|telegram|wechat|whatsapp|snapchat|linkedin/i.test(ua) ||
    /webview|wv|; wv\)/i.test(ua);
  
  // Performance capabilities
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isHighPerformance = memory >= 4 && cores >= 4;
  
  // WebGL support
  let supportsWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    supportsWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    supportsWebGL = false;
  }
  
  // 120Hz display detection (heuristic)
  const supports120Hz = window.matchMedia?.('(min-resolution: 2dppx)')?.matches && isDesktop;
  
  // Browser name
  let browserName = 'Unknown';
  if (ua.includes('chrome')) browserName = 'Chrome';
  else if (ua.includes('safari')) browserName = 'Safari';
  else if (ua.includes('firefox')) browserName = 'Firefox';
  else if (ua.includes('edge')) browserName = 'Edge';
  
  return {
    isDesktop,
    isMobile,
    isInAppBrowser,
    hasGPU: supportsWebGL,
    memory,
    cores,
    isHighPerformance,
    supportsWebGL,
    supports120Hz,
    browserName,
  };
};

// Performance class application
const applyPerformanceClasses = (capabilities: ReturnType<typeof detectBrowserCapabilities>) => {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  const body = document.body;
  
  // Clear existing performance classes
  html.classList.remove('desktop-optimized', 'high-performance', 'mobile-optimized', 'in-app-browser', 'display-120hz');
  body.classList.remove('desktop-optimized', 'high-performance', 'mobile-optimized', 'in-app-browser');
  
  if (capabilities.isDesktop) {
    html.classList.add('desktop-optimized');
    body.classList.add('desktop-optimized');
    
    if (capabilities.isHighPerformance) {
      html.classList.add('high-performance');
      body.classList.add('high-performance');
    }
    
    if (capabilities.supports120Hz) {
      html.classList.add('display-120hz');
    }
  } else {
    html.classList.add('mobile-optimized');
    body.classList.add('mobile-optimized');
  }
  
  if (capabilities.isInAppBrowser) {
    html.classList.add('in-app-browser');
    body.classList.add('in-app-browser');
  }
};

// Disable keyboard scrolling on desktop
const setupDesktopScrolling = () => {
  if (typeof window === 'undefined') return () => {};
  
  const preventKeyScroll = (e: KeyboardEvent) => {
    // Allow scrolling only with specific modifiers or in input fields
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if (isInputField) return;
    
    // Prevent arrow keys, space, page up/down from scrolling
    const scrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];
    
    if (scrollKeys.includes(e.code) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };
  
  // Only on desktop
  if (window.innerWidth >= 1024) {
    window.addEventListener('keydown', preventKeyScroll, { passive: false });
  }
  
  return () => {
    window.removeEventListener('keydown', preventKeyScroll);
  };
};

// Optimize in-app browser experience
const optimizeInAppBrowser = () => {
  if (typeof window === 'undefined') return;
  
  const capabilities = detectBrowserCapabilities();
  
  if (capabilities.isInAppBrowser) {
    // Slow down animations significantly for in-app browsers
    document.documentElement.style.setProperty('--animation-duration-multiplier', '0.3');
    
    // Disable 3D transforms on low memory
    if (capabilities.memory < 3) {
      document.documentElement.style.setProperty('--disable-3d', '1');
    }
  }
};

// FPS Monitor (development only)
interface FPSMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const FPSMonitor = memo(({ enabled = false, position = 'bottom-right' }: FPSMonitorProps) => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  useEffect(() => {
    if (!enabled) return;
    
    let animationId: number;
    
    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round(frameCountRef.current * 1000 / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, [enabled]);
  
  if (!enabled) return null;
  
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };
  
  const fpsColor = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className={`fixed ${positionClasses[position]} z-[99999] px-2 py-1 bg-black/80 rounded text-xs font-mono ${fpsColor}`}>
      {fps} FPS
    </div>
  );
});
FPSMonitor.displayName = 'FPSMonitor';

// Main Performance Provider
interface PerformanceProviderProps {
  children: React.ReactNode;
  showFPS?: boolean;
}

export const PerformanceProvider = memo(({ children, showFPS = false }: PerformanceProviderProps) => {
  const [mounted, setMounted] = useState(false);
  const [capabilities, setCapabilities] = useState<ReturnType<typeof detectBrowserCapabilities> | null>(null);
  
  useEffect(() => {
    setMounted(true);
    
    // Detect and apply performance settings
    const caps = detectBrowserCapabilities();
    setCapabilities(caps);
    applyPerformanceClasses(caps);
    
    // Setup desktop scrolling
    const cleanupScroll = setupDesktopScrolling();
    
    // Optimize in-app browser
    optimizeInAppBrowser();
    
    // Preload critical fonts
    if (document.fonts) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('fonts-loaded');
      });
    }
    
    // Log performance info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance System Initialized:', caps);
    }
    
    return () => {
      cleanupScroll();
    };
  }, []);
  
  // Inject performance CSS
  useEffect(() => {
    if (!mounted) return;
    
    const styleId = 'performance-system-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Performance System - Desktop Mouse-Only Scrolling */
      @media (min-width: 1024px) {
        html.desktop-optimized {
          scroll-behavior: auto !important;
          overflow-y: scroll;
          overflow-x: hidden;
        }
        
        /* Disable smooth scrolling to improve mouse wheel responsiveness */
        html.desktop-optimized * {
          scroll-behavior: auto !important;
        }
        
        /* Optimize scrollbar for desktop */
        html.desktop-optimized::-webkit-scrollbar {
          width: 8px;
        }
        
        html.desktop-optimized::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        html.desktop-optimized::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.4);
          border-radius: 4px;
        }
        
        html.desktop-optimized::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.6);
        }
      }
      
      /* In-App Browser Optimizations */
      html.in-app-browser {
        -webkit-overflow-scrolling: touch;
      }
      
      html.in-app-browser .spline-container,
      html.in-app-browser [data-spline] {
        display: none !important;
      }
      
      html.in-app-browser .spline-fallback {
        display: flex !important;
      }
      
      /* High Performance Mode */
      html.high-performance {
        --animation-speed: 0.8;
      }
      
      html.high-performance button,
      html.high-performance a,
      html.high-performance [role="button"] {
        will-change: transform, opacity;
      }
      
      /* GPU Acceleration Hints */
      .gpu-accelerated {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* FPS Optimizer - Quality Reduction Classes */
      html.reduce-animations * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      html.reduce-animations .shimmer-spin,
      html.reduce-animations .shimmer-line,
      html.reduce-animations .shimmer-pulse {
        animation: none !important;
      }
      
      /* NO BLUR - all blur effects globally disabled */
      html.reduce-blur *, 
      * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      html.reduce-shadows * {
        box-shadow: none !important;
        text-shadow: none !important;
      }
      
      /* Scroll Performance - Pause animations while scrolling */
      html.is-scrolling .shimmer-spin,
      html.is-scrolling .shimmer-line,
      html.is-scrolling .shimmer-pulse,
      html.is-scrolling .shimmer-glow {
        animation-play-state: paused !important;
      }
      
      html.is-scrolling canvas[data-spline] {
        pointer-events: none;
      }
      
      /* Reduce motion for users who prefer it */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Fast loading optimizations */
      .content-visibility-auto {
        content-visibility: auto;
        contain-intrinsic-size: 0 500px;
      }
      
      /* Spline optimization - reduce GPU load during scroll */
      html.is-scrolling .spline-container canvas,
      html.is-scrolling [data-spline] canvas {
        /* NO BLUR - removed for performance */
        opacity: 0.9;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [mounted]);
  
  if (!mounted) return <>{children}</>;
  
  return (
    <>
      {children}
      <FPSMonitor enabled={showFPS && process.env.NODE_ENV === 'development'} />
    </>
  );
});
PerformanceProvider.displayName = 'PerformanceProvider';

// Utility hooks
export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isDesktop;
};

export const useIsInAppBrowser = () => {
  const [isInApp, setIsInApp] = useState(false);
  
  useEffect(() => {
    const caps = detectBrowserCapabilities();
    setIsInApp(caps.isInAppBrowser);
  }, []);
  
  return isInApp;
};

export const usePerformanceMode = () => {
  const [mode, setMode] = useState<'low' | 'medium' | 'high'>('medium');
  
  useEffect(() => {
    const caps = detectBrowserCapabilities();
    if (caps.isHighPerformance && caps.memory >= 8) {
      setMode('high');
    } else if (caps.memory < 3 || caps.isInAppBrowser) {
      setMode('low');
    } else {
      setMode('medium');
    }
  }, []);
  
  return mode;
};

/**
 * Desktop FPS Optimizer
 * 
 * Monitors FPS and automatically reduces animation complexity when FPS drops.
 * This helps maintain smooth scrolling even with heavy 3D content.
 */
export const useDesktopFPSOptimizer = (enabled = true) => {
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const qualityLevelRef = useRef<'high' | 'medium' | 'low'>('high');
  const optimizationAppliedRef = useRef(false);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;
    if (window.innerWidth < 1024) return; // Desktop only
    
    let animationId: number;
    
    const measureAndOptimize = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        const currentFps = Math.round(frameCountRef.current * 1000 / elapsed);
        fpsHistoryRef.current.push(currentFps);
        
        // Keep last 5 seconds of FPS history
        if (fpsHistoryRef.current.length > 5) {
          fpsHistoryRef.current.shift();
        }
        
        // Calculate average FPS
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        
        // Apply quality adjustments based on FPS
        const root = document.documentElement;
        
        if (avgFps < 25 && qualityLevelRef.current !== 'low') {
          // Critical: Drop to low quality
          qualityLevelRef.current = 'low';
          root.classList.add('reduce-animations', 'reduce-shadows');
          root.style.setProperty('--animation-duration-multiplier', '0.15');
          console.warn(`⚠️ FPS critical (${Math.round(avgFps)}fps) - reducing quality to LOW`);
        } else if (avgFps < 40 && qualityLevelRef.current === 'high') {
          // Medium: Reduce some effects
          qualityLevelRef.current = 'medium';
          root.style.setProperty('--animation-duration-multiplier', '0.4');
          console.log(`⚡ FPS dropping (${Math.round(avgFps)}fps) - reducing quality to MEDIUM`);
        } else if (avgFps >= 55 && qualityLevelRef.current !== 'high') {
          // Good: Restore quality
          qualityLevelRef.current = 'high';
          root.classList.remove('reduce-animations', 'reduce-shadows');
          root.style.setProperty('--animation-duration-multiplier', '0.7');
          console.log(`✅ FPS recovered (${Math.round(avgFps)}fps) - restoring quality to HIGH`);
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(measureAndOptimize);
    };
    
    // Start monitoring after a short delay to let page settle
    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(measureAndOptimize);
    }, 2000);
    
    return () => {
      clearTimeout(timeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [enabled]);
  
  return qualityLevelRef.current;
};

/**
 * Scroll-aware animation pauser
 * 
 * Pauses heavy animations during scroll for better performance
 */
export const useScrollAwareAnimations = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setIsScrolling(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (isScrolling) {
      root.classList.add('is-scrolling');
    } else {
      root.classList.remove('is-scrolling');
    }
  }, [isScrolling]);
  
  return isScrolling;
};

export default PerformanceProvider;
