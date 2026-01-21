"use client";

import React, { ReactNode, useEffect, useRef } from 'react';
import { LenisProvider } from '@/lib/smoothScroll';
import { usePerformanceInit, usePerformanceCSSSync } from '@/hooks/usePerformanceInit';
import { detectBrowser } from '@/lib/browserDetection';
import { detectSafari, applySafariCSSFixes, applySafariMemoryOptimizations } from '@/lib/safariOptimizations';
import { deviceMonitor } from '@/lib/deviceMonitor';

// ============================================================================
// PERFORMANCE PROVIDER - Wraps App with 120Hz Optimizations
// ============================================================================

interface PerformanceProviderProps {
  children: ReactNode;
  enableSmoothScroll?: boolean;
  enableMobileSmoothScroll?: boolean;
  smoothScrollOptions?: {
    lerp?: number;
    duration?: number;
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchMultiplier?: number;
  };
}

/**
 * Desktop FPS Optimizer Hook v3 - OPTIMIZED for better performance
 * Uses longer intervals to reduce CPU overhead while still adapting quality
 */
function useDesktopFPSOptimizer() {
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const shimmerQualityRef = useRef<'high' | 'medium' | 'low' | 'disabled'>('high');
  const lastUpdateTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return; // Desktop only

    const measureAndOptimize = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      // OPTIMIZED: Update every 3 seconds instead of 1 second to reduce overhead
      if (elapsed >= 3000) {
        const currentFps = Math.round(frameCountRef.current * 1000 / elapsed);
        fpsHistoryRef.current.push(currentFps);

        if (fpsHistoryRef.current.length > 5) {
          fpsHistoryRef.current.shift();
        }

        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        const root = document.documentElement;

        // Only update quality if 5 seconds passed - prevents thrashing
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
        if (timeSinceLastUpdate >= 5000) {
          // Clear existing classes
          root.classList.remove('shimmer-quality-high', 'shimmer-quality-medium', 'shimmer-quality-low', 'shimmer-quality-disabled');

          // Adaptive quality based on FPS
          if (avgFps < 20 && shimmerQualityRef.current !== 'disabled') {
            shimmerQualityRef.current = 'disabled';
            root.classList.add('shimmer-quality-disabled', 'reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.1');
            lastUpdateTimeRef.current = now;
          } else if (avgFps < 35 && shimmerQualityRef.current !== 'low') {
            shimmerQualityRef.current = 'low';
            root.classList.add('shimmer-quality-low', 'reduce-animations', 'reduce-blur');
            root.style.setProperty('--animation-duration-multiplier', '0.3');
            lastUpdateTimeRef.current = now;
          } else if (avgFps < 50 && shimmerQualityRef.current !== 'medium') {
            shimmerQualityRef.current = 'medium';
            root.classList.add('shimmer-quality-medium');
            root.classList.remove('reduce-animations', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '0.7');
            lastUpdateTimeRef.current = now;
          } else if (avgFps >= 55 && shimmerQualityRef.current !== 'high') {
            shimmerQualityRef.current = 'high';
            root.classList.add('shimmer-quality-high');
            root.classList.remove('reduce-animations', 'reduce-blur', 'reduce-shadows');
            root.style.setProperty('--animation-duration-multiplier', '1');
            lastUpdateTimeRef.current = now;
          }
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(measureAndOptimize);
    };

    // Wait 8 seconds for page to fully load before monitoring
    const timeout = setTimeout(() => {
      rafIdRef.current = requestAnimationFrame(measureAndOptimize);
    }, 8000);

    return () => {
      clearTimeout(timeout);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);
}

/**
 * Scroll-aware animation pauser
 * Pauses heavy animations during scroll for better performance
 */
function useScrollAwareAnimations() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return; // Desktop only
    
    const handleScroll = () => {
      document.documentElement.classList.add('is-scrolling');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        document.documentElement.classList.remove('is-scrolling');
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}

/**
 * Performance Provider Component
 * 
 * Initializes:
 * - 120Hz display detection
 * - FPS monitoring
 * - CSS custom property sync
 * - Lenis smooth scroll (DESKTOP ONLY - disabled on mobile for native scroll)
 * 
 * Usage:
 * ```tsx
 * <PerformanceProvider enableSmoothScroll>
 *   <App />
 * </PerformanceProvider>
 * ```
 */
export function PerformanceProvider({ 
  children, 
  enableSmoothScroll = true,
  enableMobileSmoothScroll = true,
  smoothScrollOptions = {}
}: PerformanceProviderProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHighEndDesktop, setIsHighEndDesktop] = React.useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = React.useState(false);
  const [lenisFailed, setLenisFailed] = React.useState(false);
  // Force native scroll on desktop to avoid stacking-context side effects from Lenis
  const [forceNativeScroll, setForceNativeScroll] = React.useState(false);
  
  // Detect device type and capabilities on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Check for in-app browsers - disable heavy features
      const browserInfo = detectBrowser();
      setIsInAppBrowser(browserInfo.isInAppBrowser);
      
      // UPDATED 2026: Detect Apple devices and Instagram for premium experience
      const ua = navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/i.test(ua) || /macintosh|mac os x/i.test(ua);
      const isInstagram = ua.includes('instagram') || ua.includes('ig_');
      const hasPremiumExperience = isAppleDevice || isInstagram;
      
      // Initialize Safari-specific optimizations
      const safariInfo = detectSafari();
      if (safariInfo.isSafari) {
        applySafariCSSFixes();
        applySafariMemoryOptimizations();
        console.log('[PerformanceProvider] Safari optimizations applied');
        
        // Safari on mobile needs extra careful handling - but Apple devices still get premium
        if (safariInfo.isMobileSafari && !isAppleDevice) {
          console.log('[PerformanceProvider] Mobile Safari detected - enabling conservative mode');
          setIsHighEndDesktop(false);
          return;
        }
      }
      
      // UPDATED 2026: Apple devices and Instagram get premium experience regardless of browser
      if (hasPremiumExperience) {
        console.log('[PerformanceProvider] Premium experience enabled for:', isAppleDevice ? 'Apple device' : 'Instagram');
        setIsHighEndDesktop(true);
        
        // Add appropriate premium classes to both html and body
        if (isAppleDevice) {
          document.documentElement.classList.add('apple-premium', 'high-performance');
          document.body?.classList.add('apple-premium', 'high-performance');
        }
        if (isInstagram) {
          document.documentElement.classList.add('instagram-premium', 'high-performance');
          document.body?.classList.add('instagram-premium', 'high-performance');
        }
        // Continue with detection but don't return early
      }
      
      if (browserInfo.isInAppBrowser && !hasPremiumExperience) {
        console.log('[PerformanceProvider] In-app browser detected:', browserInfo.browserName);
        console.log('[PerformanceProvider] Disabling heavy features for stability');
        setIsHighEndDesktop(false);
        return;
      }
      
      // Detect high-end desktop (Apple Silicon, high-spec PCs)
      if (!mobile) {
        const memory = (navigator as any).deviceMemory || 8;
        const cores = navigator.hardwareConcurrency || 4;
        const ua = navigator.userAgent.toLowerCase();
        const isMac = /macintosh|mac os x/i.test(ua);
        
        // Apple Silicon detection
        let isAppleSilicon = false;
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
        
        // High-end desktop: Apple Silicon OR 8GB+ RAM with 4+ cores
        const highEnd = isAppleSilicon || (isMac && cores >= 8) || (memory >= 8 && cores >= 4);
        setIsHighEndDesktop(highEnd);
        
        // Apply desktop-specific optimizations
        if (highEnd) {
          document.documentElement.classList.add('desktop-optimized', 'high-performance');
          console.log('[PerformanceProvider] 🖥️ High-end desktop detected, enabling optimizations');
        }
      }
    }
  }, []);

  // Desktop-only: disable Lenis smoothing so fixed/modals stay pinned to viewport
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateScrollMode = () => {
      setForceNativeScroll(window.innerWidth >= 1024);
    };

    updateScrollMode();
    window.addEventListener('resize', updateScrollMode, { passive: true });

    return () => window.removeEventListener('resize', updateScrollMode);
  }, []);

  React.useEffect(() => {
    if (isMobile && lenisFailed) {
      setLenisFailed(false);
    }
  }, [isMobile, lenisFailed]);
  
  // Initialize performance monitoring
  usePerformanceInit();
  
  // Sync performance state to CSS
  usePerformanceCSSSync();

  // NOTE: Keyboard scrolling is now ALLOWED on desktop
  // Users should be able to use arrow keys, space, page up/down to scroll normally

  // Set up performance observers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const debugEnabled = process.env.NODE_ENV !== 'production' || localStorage.getItem('bullmoney_perf_debug') === 'true';
    if (!debugEnabled) return;
    let lastLogTime = 0;

    // Report long tasks that exceed frame budget
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 200) { // Focus on truly blocking tasks
              const now = performance.now();
              if (now - lastLogTime < 5000) {
                continue;
              }
              lastLogTime = now;
              console.warn('[Performance] Long task detected:', {
                duration: `${entry.duration.toFixed(2)}ms`,
                startTime: entry.startTime,
              });
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        
        return () => longTaskObserver.disconnect();
      } catch (e) {
        // Long task API not supported
      }
    }
  }, []);

  // Wrap with Lenis if smooth scroll is enabled.
  // IMPORTANT: Disable Lenis on mobile and non-premium in-app browsers
  // UPDATED 2026: Apple devices and Instagram get smooth scroll even in in-app browser
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAppleDevice = /iphone|ipad|ipod/i.test(ua) || /macintosh|mac os x/i.test(ua);
  const isInstagram = ua.includes('instagram') || ua.includes('ig_');
  const hasPremiumExperience = isAppleDevice || isInstagram;
  
  const shouldUseSmoothScroll = enableSmoothScroll && !isMobile && !forceNativeScroll && (!isInAppBrowser || hasPremiumExperience) && !lenisFailed;

  React.useEffect(() => {
    if (!shouldUseSmoothScroll) {
      return;
    }

    const scrollingElement = document.scrollingElement || document.documentElement;
    let failureCount = 0;
    let rafId: number | null = null;

    const handleWheel = (event: WheelEvent) => {
      const maxScrollable = scrollingElement.scrollHeight - scrollingElement.clientHeight;
      if (maxScrollable <= 4) {
        return;
      }

      const start = scrollingElement.scrollTop;
      const atTop = start <= 1;
      const atBottom = start >= maxScrollable - 1;

      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
        failureCount = 0;
        return;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const delta = Math.abs(scrollingElement.scrollTop - start);
        if (delta < 0.5) {
          failureCount += 1;
          if (failureCount >= 3 && !lenisFailed) {
            console.warn('[PerformanceProvider] Lenis failed to move after wheel input, falling back to native scroll.');
            setLenisFailed(true);
          }
        } else {
          failureCount = 0;
        }
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [shouldUseSmoothScroll, lenisFailed]);
  
  if (shouldUseSmoothScroll) {
    return (
      <LenisProvider options={smoothScrollOptions}>
        <PerformanceOptimizer>
          {children}
        </PerformanceOptimizer>
      </LenisProvider>
    );
  }

  return (
    <PerformanceOptimizer>
      {children}
    </PerformanceOptimizer>
  );
}

/**
 * Performance Optimizer - Applies runtime optimizations
 */
function PerformanceOptimizer({ children }: { children: ReactNode }) {
  // Enable FPS optimizer on desktop
  useDesktopFPSOptimizer();
  
  // Enable scroll-aware animation pausing
  useScrollAwareAnimations();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inject scroll-aware CSS
    const styleId = 'perf-optimizer-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
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
        
        html.reduce-blur {
          --blur-amount: 4px !important;
        }
        
        html.reduce-blur .backdrop-blur-2xl,
        html.reduce-blur .backdrop-blur-xl,
        html.reduce-blur .backdrop-blur-lg {
          backdrop-filter: blur(4px) !important;
        }
        
        html.reduce-shadows * {
          box-shadow: none !important;
        }
        
        /* Scroll Performance - Pause animations while scrolling */
        html.is-scrolling .shimmer-spin,
        html.is-scrolling .shimmer-line,
        html.is-scrolling .shimmer-pulse,
        html.is-scrolling .shimmer-glow,
        html.is-scrolling .page-spin,
        html.is-scrolling .page-shimmer-ltr {
          animation-play-state: paused !important;
        }
        
        html.is-scrolling canvas {
          pointer-events: none;
        }
        
        /* Reduce GPU load during scroll */
        html.is-scrolling .spline-container canvas,
        html.is-scrolling [data-spline] canvas {
          filter: blur(1px);
          opacity: 0.95;
          transition: filter 0.1s, opacity 0.1s;
        }
      `;
      document.head.appendChild(style);
    }

    // Request high priority rendering
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
      console.log('[Performance] Using Scheduler API for priority rendering');
    }

    // Optimize Intersection Observer for 120Hz
    const prefetchLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const link = entry.target as HTMLAnchorElement;
              const href = link.getAttribute('href');
              
              // Prefetch on hover intent
              if (href && !document.querySelector(`link[href="${href}"]`)) {
                const prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = href;
                document.head.appendChild(prefetch);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );

      links.forEach((link) => observer.observe(link));
      
      return () => observer.disconnect();
    };

    // Delay prefetch to after initial render
    const timeoutId = setTimeout(prefetchLinks, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return <>{children}</>;
}

// ============================================================================
// FPS DISPLAY COMPONENT (Development Only)
// ============================================================================

interface FPSCounterProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// ============================================================================
// OOKLA-STYLE ACCURATE SPEED TEST
// ============================================================================
// Uses Cloudflare's speed test endpoints (same infrastructure as speed.cloudflare.com)
// Downloads/uploads large files with multiple parallel connections

interface SpeedTestResult {
  speed: number; // Mbps
  latency: number; // ms
}

// Cloudflare speed test endpoints - designed for accurate speed testing
const CF_DOWNLOAD_ENDPOINTS = [
  'https://speed.cloudflare.com/__down?bytes=', // Cloudflare's official speed test
];

const CF_UPLOAD_ENDPOINT = 'https://speed.cloudflare.com/__up';

// Download speed test - Ookla style with multiple parallel connections
const measureDownloadSpeed = async (
  onProgress?: (speed: number) => void
): Promise<SpeedTestResult> => {
  const results: number[] = [];
  // Match Ookla closer: longer window and larger chunks
  const testDuration = 12000; // 12 seconds
  const chunkSizes = [5_000_000, 10_000_000, 25_000_000]; // 5MB, 10MB, 25MB chunks
  
  try {
    // Warm-up request to establish connection
    await fetch(`${CF_DOWNLOAD_ENDPOINTS[0]}${10000}?r=${Math.random()}`, {
      cache: 'no-store',
    });
    
    const startTime = performance.now();
    let totalBytes = 0;
    let lastUpdate = startTime;
    const activeRequests: Promise<void>[] = [];
    
    // Function to download a chunk and measure
    const downloadChunk = async (size: number): Promise<void> => {
      try {
        const chunkStart = performance.now();
        const response = await fetch(
          `${CF_DOWNLOAD_ENDPOINTS[0]}${size}&r=${Math.random()}`,
          { cache: 'no-store' }
        );
        
        if (!response.ok || !response.body) return;
        
        const reader = response.body.getReader();
        let chunkBytes = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunkBytes += value.length;
          totalBytes += value.length;
          
          // Update speed every 200ms
          const now = performance.now();
          if (now - lastUpdate >= 200) {
            const elapsed = (now - startTime) / 1000;
            const currentSpeed = ((totalBytes * 8) / elapsed) / 1_000_000;
            results.push(currentSpeed);
            if (onProgress) onProgress(currentSpeed);
            lastUpdate = now;
          }
        }
      } catch {
        // Ignore individual chunk failures
      }
    };
    
    // Start multiple parallel downloads (like Ookla uses 4-8 connections)
    const numConnections = 6;
    let chunkIndex = 0;
    
    while (performance.now() - startTime < testDuration) {
      // Keep 4 active connections
      while (activeRequests.length < numConnections && performance.now() - startTime < testDuration - 500) {
        const size = chunkSizes[chunkIndex % chunkSizes.length];
        const request = downloadChunk(size);
        activeRequests.push(request);
        chunkIndex++;
        
        // Stagger starts slightly
        await new Promise(r => setTimeout(r, 50));
      }
      
      // Wait for any request to complete
      if (activeRequests.length > 0) {
        await Promise.race(activeRequests);
        // Remove completed requests (simplified - in production would track properly)
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    // Wait for remaining requests
    await Promise.allSettled(activeRequests);
    
    const totalTime = (performance.now() - startTime) / 1000;
    const finalSpeed = ((totalBytes * 8) / totalTime) / 1_000_000;
    
    // Calculate using 90th percentile (Ookla style - excludes slow start)
    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => a - b);
      const p90Index = Math.floor(sorted.length * 0.9);
      const p90Speed = sorted[p90Index] || finalSpeed;
      return { speed: Math.round(p90Speed * 10) / 10, latency: 0 };
    }
    
    return { speed: Math.round(finalSpeed * 10) / 10, latency: 0 };
  } catch {
    // Fallback to simpler test
    try {
      const start = performance.now();
      const response = await fetch(`${CF_DOWNLOAD_ENDPOINTS[0]}${5_000_000}&r=${Math.random()}`, {
        cache: 'no-store',
      });
      const blob = await response.blob();
      const elapsed = (performance.now() - start) / 1000;
      const speed = ((blob.size * 8) / elapsed) / 1_000_000;
      return { speed: Math.round(speed * 10) / 10, latency: 0 };
    } catch {
      return { speed: 0, latency: 0 };
    }
  }
};

// Upload speed test - Ookla style with multiple parallel connections
const measureUploadSpeed = async (
  onProgress?: (speed: number) => void
): Promise<SpeedTestResult> => {
  const results: number[] = [];
  // Match Ookla closer: longer window and larger payloads
  const testDuration = 12000; // 12 seconds
  
  try {
    // Create test data chunks of various sizes
    const createChunk = (size: number): Blob => {
      const data = new Uint8Array(size);
      // Fill with random-ish data to prevent compression
      for (let i = 0; i < size; i += 4) {
        const val = (i * 1103515245 + 12345) & 0xff;
        data[i] = val;
        if (i + 1 < size) data[i + 1] = val ^ 0x55;
        if (i + 2 < size) data[i + 2] = val ^ 0xaa;
        if (i + 3 < size) data[i + 3] = val ^ 0xff;
      }
      return new Blob([data]);
    };
    
    // Warm-up
    const warmupData = createChunk(10000);
    await fetch(CF_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: warmupData,
    }).catch(() => {});
    
    const startTime = performance.now();
    let totalBytes = 0;
    let lastUpdate = startTime;
    const chunkSizes = [1_000_000, 2_000_000, 4_000_000]; // 1MB, 2MB, 4MB
    
    const uploadChunk = async (size: number): Promise<void> => {
      try {
        const chunk = createChunk(size);
        const response = await fetch(CF_UPLOAD_ENDPOINT, {
          method: 'POST',
          body: chunk,
        });
        
        if (response.ok) {
          totalBytes += size;
          
          const now = performance.now();
          if (now - lastUpdate >= 200) {
            const elapsed = (now - startTime) / 1000;
            const currentSpeed = ((totalBytes * 8) / elapsed) / 1_000_000;
            results.push(currentSpeed);
            if (onProgress) onProgress(currentSpeed);
            lastUpdate = now;
          }
        }
      } catch {
        // Ignore failures
      }
    };
    
    // Upload with multiple parallel connections
    const numConnections = 6;
    const activeUploads: Promise<void>[] = [];
    let chunkIndex = 0;
    
    while (performance.now() - startTime < testDuration) {
      while (activeUploads.length < numConnections && performance.now() - startTime < testDuration - 500) {
        const size = chunkSizes[chunkIndex % chunkSizes.length];
        activeUploads.push(uploadChunk(size));
        chunkIndex++;
        await new Promise(r => setTimeout(r, 50));
      }
      
      if (activeUploads.length > 0) {
        await Promise.race(activeUploads);
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    await Promise.allSettled(activeUploads);
    
    const totalTime = (performance.now() - startTime) / 1000;
    const finalSpeed = ((totalBytes * 8) / totalTime) / 1_000_000;
    
    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => a - b);
      const p90Index = Math.floor(sorted.length * 0.9);
      const p90Speed = sorted[p90Index] || finalSpeed;
      return { speed: Math.round(p90Speed * 10) / 10, latency: 0 };
    }
    
    return { speed: Math.round(finalSpeed * 10) / 10, latency: 0 };
  } catch {
    // Fallback: try httpbin or estimate
    try {
      const chunk = new Blob([new Uint8Array(1_000_000)]); // 1MB
      const start = performance.now();
      await fetch('https://httpbin.org/post', { method: 'POST', body: chunk });
      const elapsed = (performance.now() - start) / 1000;
      const speed = ((1_000_000 * 8) / elapsed) / 1_000_000;
      return { speed: Math.round(speed * 10) / 10, latency: 0 };
    } catch {
      return { speed: 0, latency: 0 };
    }
  }
};

// Measure latency/ping
const measureLatency = async (): Promise<number> => {
  try {
    const pings: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await fetch(`https://speed.cloudflare.com/__down?bytes=0&r=${Math.random()}`, {
        cache: 'no-store',
      });
      const ping = performance.now() - start;
      pings.push(ping);
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Return median ping
    const sorted = pings.sort((a, b) => a - b);
    return Math.round(sorted[Math.floor(sorted.length / 2)]);
  } catch {
    return 0;
  }
};

export function FPSCounter({ 
  show = true,
  position = 'bottom-right'
}: FPSCounterProps) {
  const [fps, setFps] = React.useState(60);
  const [isLow, setIsLow] = React.useState(false);
  const [downloadSpeed, setDownloadSpeed] = React.useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = React.useState<number>(0);
  const [latency, setLatency] = React.useState<number>(0);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testPhase, setTestPhase] = React.useState<'idle' | 'ping' | 'download' | 'upload'>('idle');
  const speedtestDisabledRef = React.useRef(false);

  // FPS measurement
  useEffect(() => {
    if (!show) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measure = (time: number) => {
      frameCount++;
      const elapsed = time - lastTime;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount / elapsed) * 1000);
        setFps(currentFps);
        setIsLow(currentFps < 15);
        frameCount = 0;
        lastTime = time;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [show]);

  // Network speed measurement - OOKLA CLI ONLY (matches speedtest.net exactly)
  useEffect(() => {
    if (!show) return;

    let cancelled = false;

    const runSpeedTest = async () => {
      if (speedtestDisabledRef.current) return;
      setIsTesting(true);
      setTestPhase('ping');
      setDownloadSpeed(0);
      setUploadSpeed(0);

      try {
        // Use server-side Ookla CLI ONLY (EXACT speedtest.net match)
        console.log('[PerformanceProvider] Running server-side Ookla speedtest (no fallback)...');
        const response = await fetch('/api/speedtest?quick=false');
        
        if (response.ok) {
          const result = await response.json();
          if (result?.available === false) {
            speedtestDisabledRef.current = true;
            if (!cancelled) {
              setTestPhase('idle');
              setIsTesting(false);
            }
            return;
          }
          if (!cancelled && result && !result.error) {
            setLatency(Math.round(result.latency ?? 0));
            setDownloadSpeed(result.downMbps ?? 0);
            setUploadSpeed(result.upMbps ?? 0);
            setTestPhase('idle');
            setIsTesting(false);
            console.log('[PerformanceProvider] ✅ Ookla speedtest complete:', {
              down: result.downMbps,
              up: result.upMbps,
              ping: result.latency,
              server: result.server?.name,
              isp: result.client?.isp,
            });
            return;
          } else if (result.error) {
            console.error('[PerformanceProvider] Ookla CLI error:', result.message);
            if (!cancelled) {
              setTestPhase('idle');
              setIsTesting(false);
            }
            return;
          }
        } else {
          console.error(`[PerformanceProvider] API returned status ${response.status}`);
          const errorData = await response.json().catch(() => ({}));
          console.error('[PerformanceProvider] Error details:', errorData);
          if (!cancelled) {
            setTestPhase('idle');
            setIsTesting(false);
          }
          return;
        }
      } catch (error) {
        console.error('[PerformanceProvider] Speed test failed:', error);
        if (!cancelled) {
          setTestPhase('idle');
          setIsTesting(false);
        }
      }
    };

    // Initial measurement after a short delay
    const initialTimeout = setTimeout(runSpeedTest, 2000);

    // Re-measure every 30 seconds (longer interval since tests take ~12 seconds)
    const interval = setInterval(runSpeedTest, 30000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [show]);

  if (!show) return null;

  // Detect mobile for smaller sizing (20-30% smaller)
  // Use state to prevent SSR mismatch and fix scroll enlargement issue
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const scaleFactor = isMobile ? 0.65 : 1; // 35% smaller on mobile (fixed, not affected by scroll)

  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };

  // Neon color schemes
  const neonBlue = {
    color: '#0066ff',
    textShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, 0 0 40px #0044cc',
    boxShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, inset 0 0 10px rgba(0, 102, 255, 0.3)',
    borderColor: '#0066ff',
  };

  const neonRed = {
    color: '#ff073a',
    textShadow: '0 0 5px #ff073a, 0 0 10px #ff073a, 0 0 20px #ff073a, 0 0 40px #ff0000',
    boxShadow: '0 0 5px #ff073a, 0 0 10px #ff073a, 0 0 20px #ff073a, inset 0 0 10px rgba(255, 7, 58, 0.3)',
    borderColor: '#ff073a',
  };

  const neonGreen = {
    color: '#00ff88',
    textShadow: '0 0 5px #00ff88, 0 0 10px #00ff88',
    borderColor: '#00ff88',
  };

  const neonCyan = {
    color: '#00d4ff',
    textShadow: '0 0 5px #00d4ff, 0 0 10px #00d4ff',
    borderColor: '#00d4ff',
  };

  const fpsStyle = isLow ? neonRed : neonBlue;

  const formatSpeed = (speed: number) => {
    if (speed === 0) return '--';
    if (speed >= 100) return `${Math.round(speed)}`;
    return speed.toFixed(1);
  };

  return (
    <>
      {/* Keyframe animations for arrows */}
      <style>{`
        @keyframes bounceDown {
          0%, 100% { transform: translateY(-1px); }
          50% { transform: translateY(1px); }
        }
        @keyframes bounceUp {
          0%, 100% { transform: translateY(1px); }
          50% { transform: translateY(-1px); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          ...positionStyles[position],
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 99999,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
      >
      {/* FPS Pill */}
      <div
        style={{
          padding: isMobile ? '2px 5px' : '3px 8px',
          borderRadius: 20,
          fontSize: isMobile ? 7 : 10,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          border: `1px solid ${fpsStyle.borderColor}`,
          color: fpsStyle.color,
          textShadow: fpsStyle.textShadow,
          boxShadow: fpsStyle.boxShadow,
          letterSpacing: '0.5px',
          textAlign: 'center',
          transform: `scale(${scaleFactor})`,
          transformOrigin: position.includes('right') ? 'top right' : 'top left',
        }}
      >
        {fps} FPS
      </div>
      
      {/* Network Speed Pill - Download | Upload | Ping */}
      <div
        style={{
          padding: isMobile ? '2px 5px' : '3px 8px',
          borderRadius: 20,
          fontSize: isMobile ? 6 : 9,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          gap: isMobile ? '2px' : '5px',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scaleFactor})`,
          transformOrigin: position.includes('right') ? 'top right' : 'top left',
        }}
      >
        {/* Unit label on left */}
        <span style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontSize: 7,
          textShadow: '0 0 4px rgba(255,255,255,0.6), 0 0 8px rgba(255,255,255,0.3)',
          letterSpacing: '0.5px',
        }}>Mb/s</span>
        
        {/* Download */}
        <span style={{ 
          color: neonGreen.color, 
          textShadow: neonGreen.textShadow,
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
        }}>
          <span style={{ 
            fontSize: 11, 
            animation: 'bounceDown 3s ease-in-out infinite',
          }}>↓</span>
          {formatSpeed(downloadSpeed)}
        </span>
        
        {/* Divider */}
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7 }}>|</span>
        
        {/* Upload */}
        <span style={{ 
          color: neonCyan.color, 
          textShadow: neonCyan.textShadow,
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
        }}>
          <span style={{ 
            fontSize: 11, 
            animation: 'bounceUp 3s ease-in-out infinite',
          }}>↑</span>
          {formatSpeed(uploadSpeed)}
        </span>
        
        {/* Divider */}
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7 }}>|</span>
        
        {/* Ping */}
        <span style={{ 
          color: 'rgba(255,255,255,0.7)', 
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
        }}>
          {latency > 0 ? `${latency}ms` : '--'}
        </span>
      </div>
    </div>
    </>
  );
}
