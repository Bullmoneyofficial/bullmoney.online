"use client";

/**
 * SPLINE PAGE MODE
 * Full-screen interactive Spline 3D experience for both mobile and desktop
 * This component can be used as a standalone page or embedded in welcome screens
 * 
 * Features:
 * - Full interactivity on mobile (touch gestures) and desktop (mouse)
 * - Automatic device detection and quality adjustment
 * - Scene rotation with weighted random selection
 * - Smooth loading transitions
 * 
 * Updated: 2026.1.22 - Ensured interactivity on all devices
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { SplineWrapperProps } from '@/lib/spline-wrapper';

// Ultra-optimized Spline wrapper (preloads runtime at module import time)
const Spline = dynamic<SplineWrapperProps>(
  () => import(/* webpackChunkName: "spline-wrapper" */ '@/lib/spline-wrapper') as any,
  {
    ssr: false,
    loading: () => null,
  }
);

// Scene configuration - local files for desktop, can be extended
const SPLINE_SCENES = [
  '/scene1.splinecode',
  '/scene2.splinecode',
  '/scene3.splinecode',
  '/scene4.splinecode',
  '/scene5.splinecode',
  '/scene6.splinecode',
  '/scene.splinecode',
];

// Mobile iframe scenes (Spline viewer URLs for better mobile performance)
type MobileSplineScene = {
  id: string;
  viewerUrl: string;
  weight: number;
};

const MOBILE_SPLINE_SCENES: readonly MobileSplineScene[] = [
  {
    id: "timefold",
    viewerUrl: "https://my.spline.design/timefoldodyssey-s3vKRBOk0ESLxu0qgZIB1IOD/",
    weight: 35,
  },
  {
    id: "nexbot",
    viewerUrl: "https://my.spline.design/nexbotrobotcharacterconcept-pJvW8Dq4jVXayg6xUDiM8nPp/",
    weight: 35,
  },
  {
    id: "followers-focus",
    viewerUrl: "https://my.spline.design/100followersfocus-55tpQJYDbng5lAQ3P1tq5abx/",
    weight: 6,
  },
  {
    id: "loading-bar",
    viewerUrl: "https://my.spline.design/theloadingbarvertical-J0jRfhBsRDUAUKzNRxMvZXak/",
    weight: 6,
  },
  {
    id: "cannon",
    viewerUrl: "https://my.spline.design/cannon-vOk1Cc5VyFBvcSq1ozXuhK1n/",
    weight: 6,
  },
  {
    id: "xgamer",
    viewerUrl: "https://my.spline.design/xgamer-RZ9X6L57SHESs7L04p6IDisA/",
    weight: 6,
  },
  {
    id: "r4xbot",
    viewerUrl: "https://my.spline.design/r4xbot-2RZeOpfgJ0Vr36G9Jd9EHlFB/",
    weight: 6,
  },
] as const;

const ROTATION_KEY = 'bullmoney_spline_page_rotation_v1';
const MOBILE_ROTATION_KEY = 'bullmoney_mobile_spline_page_rotation_v1';

// Device detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isTouch && (window.innerWidth <= 1024 || isMobileUA));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Weighted scene selection for mobile
const selectWeightedMobileScene = (): MobileSplineScene => {
  const totalWeight = MOBILE_SPLINE_SCENES.reduce((sum, scene) => sum + scene.weight, 0);
  let random = Math.random() * totalWeight;
  for (const scene of MOBILE_SPLINE_SCENES) {
    random -= scene.weight;
    if (random <= 0) return scene;
  }
  return MOBILE_SPLINE_SCENES[0];
};

interface SplinePageProps {
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  showControls?: boolean;
}

function SplinePageComponent({
  className = '',
  onLoad,
  onError,
  showControls = true,
}: SplinePageProps) {
  const isMobile = useIsMobile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // Desktop scene state - Initialize immediately on desktop for instant load
  const [desktopScene, setDesktopScene] = useState<string>(() => {
    // SSR-safe: pick first scene immediately for desktop
    return SPLINE_SCENES[0];
  });
  
  // Mobile scene state - Null initially, loads after delay
  const [mobileScene, setMobileScene] = useState<MobileSplineScene | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Pick next desktop scene (rotation)
  const pickNextDesktopScene = useCallback(() => {
    try {
      const raw = localStorage.getItem(ROTATION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      let queue: string[] = Array.isArray(parsed.queue) ? parsed.queue : [];
      if (!queue.length) {
        queue = [...SPLINE_SCENES];
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      }
      const next = queue.shift() || SPLINE_SCENES[0];
      localStorage.setItem(ROTATION_KEY, JSON.stringify({ queue, lastUsed: next, updated: Date.now() }));
      return next;
    } catch {
      return SPLINE_SCENES[0];
    }
  }, []);

  // Pick next mobile scene (rotation)
  const pickNextMobileScene = useCallback((): MobileSplineScene => {
    try {
      const raw = localStorage.getItem(MOBILE_ROTATION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      let queue: string[] = Array.isArray(parsed.queue) ? parsed.queue : [];
      
      if (!queue.length) {
        queue = MOBILE_SPLINE_SCENES.map(s => s.id);
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      }
      
      const nextId = queue.shift() || MOBILE_SPLINE_SCENES[0].id;
      localStorage.setItem(MOBILE_ROTATION_KEY, JSON.stringify({ queue, lastUsed: nextId, updated: Date.now() }));
      
      return MOBILE_SPLINE_SCENES.find(s => s.id === nextId) || MOBILE_SPLINE_SCENES[0];
    } catch {
      return selectWeightedMobileScene();
    }
  }, []);

  // Initialize scenes on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (typeof window !== 'undefined') {
      if (isMobile) {
        // Smart loading for mobile
        // Check device memory - don't load Spline on low memory devices (<4GB)
        const hasEnoughMemory = !('deviceMemory' in navigator) || 
                               (navigator as any).deviceMemory >= 4;
        
        if (hasEnoughMemory) {
          // Delay Spline load by 2 seconds on mobile (enough for initial paint)
          const mobileLoadTimer = setTimeout(() => {
            // Use requestIdleCallback to load only when browser is idle
            if ('requestIdleCallback' in window) {
              requestIdleCallback(
                () => {
                  // Final check: ensure page is still visible
                  if (document.visibilityState === 'visible' && mountedRef.current) {
                    const scene = pickNextMobileScene();
                    setMobileScene(scene);
                  }
                },
                { timeout: 3000 } // Max wait 3 seconds for idle
              );
            } else {
              // Fallback for browsers without requestIdleCallback
              if (mountedRef.current) {
                const scene = pickNextMobileScene();
                setMobileScene(scene);
              }
            }
          }, 2000); // 2 seconds delay — was 15s which prevented loading
          
          return () => {
            clearTimeout(mobileLoadTimer);
            mountedRef.current = false;
          };
        }
        // If not enough memory, mobileScene stays null (gradient background only)
      } else {
        // Desktop - load immediately with high priority
        const scene = pickNextDesktopScene();
        setDesktopScene(scene);

        // Preload the runtime chunk so it's ready when Spline mounts
        import(/* webpackChunkName: "spline-wrapper" */ '@/lib/spline-wrapper').catch(() => undefined);

        // Preconnect to Spline CDN origins
        ['https://prod.spline.design', 'https://cdn.spline.design'].forEach(href => {
          if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
          const l = document.createElement('link');
          l.rel = 'preconnect'; l.href = href; l.crossOrigin = 'anonymous';
          document.head.appendChild(l);
        });

        // High-priority preload for the scene file
        const existing = document.querySelector(`link[rel="preload"][as="fetch"][href="${scene}"]`);
        if (!existing) {
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.href = scene;
          preloadLink.as = 'fetch';
          preloadLink.crossOrigin = 'anonymous';
          (preloadLink as any).fetchPriority = 'high';
          preloadLink.setAttribute('fetchpriority', 'high');
          document.head.appendChild(preloadLink);
        }

        // Warm the cache immediately
        fetch(scene, { cache: 'force-cache', priority: 'high' as RequestPriority }).catch(() => undefined);
      }
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [isMobile, pickNextDesktopScene, pickNextMobileScene]);

  // Handle successful load
  const handleLoad = useCallback((spline?: any) => {
    if (mountedRef.current) {
      splineRef.current = spline;
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
      console.log('[SplinePage] ✅ Scene loaded successfully');
      
      // Attach event listeners to canvas for proper interaction detection
      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
          console.log('[SplinePage] ✅ Canvas found, attaching event listeners');
          
          const handleCanvasPointerDown = () => {
            setIsDragging(true);
            console.log('[SplinePage] Canvas interaction detected');
          };
          
          const handleCanvasPointerUp = () => {
            setIsDragging(false);
          };
          
          const handleCanvasPointerMove = () => {
            setIsHovering(true);
          };
          
          // Ensure canvas receives pointer events
          canvas.style.pointerEvents = 'auto';
          canvas.style.touchAction = 'manipulation';
          
          canvas.addEventListener('pointerdown', handleCanvasPointerDown);
          canvas.addEventListener('pointerup', handleCanvasPointerUp);
          canvas.addEventListener('pointermove', handleCanvasPointerMove);
          canvas.addEventListener('mousedown', handleCanvasPointerDown);
          canvas.addEventListener('mouseup', handleCanvasPointerUp);
          canvas.addEventListener('mousemove', handleCanvasPointerMove);
          canvas.addEventListener('touchstart', handleCanvasPointerDown, { passive: true });
          canvas.addEventListener('touchend', handleCanvasPointerUp, { passive: true });
        }
      }
    }
  }, [onLoad]);

  // Handle iframe load (mobile)
  const handleIframeLoad = useCallback(() => {
    if (mountedRef.current) {
      setIsLoaded(true);
      onLoad?.();
      console.log('[SplinePage] ✅ Mobile iframe loaded');
    }
  }, [onLoad]);

  // Handle errors
  const handleError = useCallback((error?: any) => {
    console.error('[SplinePage] ❌ Error loading scene:', error);
    if (mountedRef.current) {
      setHasError(true);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [onError]);

  // Interaction handlers for visual feedback
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsDragging(false);
  };
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={`spline-page-container relative w-full h-full ${className}`}
      style={{
        minHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        background: '#000',
        touchAction: 'manipulation',
        pointerEvents: 'auto',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Enhanced Gradient Background - Visible on mobile before Spline loads */}
      {isMobile && !mobileScene && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 30%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 40%), linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
            zIndex: 0,
          }}
        />
      )}
      
      {/* Gradient fallback — fades out once Spline is ready, never blocks interaction */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.12) 35%, transparent 65%), linear-gradient(180deg,#0a0a0a 0%,#000 100%)',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 700ms ease-out',
          zIndex: 1,
        }}
      />

      {/* Interaction Indicator */}
      {showControls && isLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 left-4 z-30 pointer-events-none"
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <motion.span
              animate={{ 
                rotate: isDragging ? [0, 10, -10, 0] : 0,
                scale: isDragging ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {isDragging ? '🔄' : isHovering ? '👆' : '🎮'}
            </motion.span>
            <span className="text-xs text-white/80 font-medium">
              {isDragging ? 'Rotating' : isHovering ? 'Interactive' : '3D Scene'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Interaction hint on hover/touch */}
      <AnimatePresence>
        {isHovering && !isDragging && isLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div
              className="px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
              }}
            >
              {isMobile ? '👆 Touch & drag to interact' : '🖱️ Click & drag to rotate'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: Iframe-based Spline Viewer */}
      {isMobile && mobileScene && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            cursor: 'grab',
          }}
        >
          <iframe
            src={mobileScene.viewerUrl}
            title="BullMoney 3D Scene"
            frameBorder="0"
            allow="fullscreen; autoplay; xr-spatial-tracking; pointer-lock; gyroscope; accelerometer"
            loading="eager"
            onLoad={handleIframeLoad}
            onError={() => handleError(new Error('Failed to load mobile Spline scene'))}
            style={{
              width: '100%',
              height: 'calc(100% + 60px)',
              position: 'absolute',
              top: 0,
              left: 0,
              border: 'none',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
          />
        </div>
      )}

      {/* Desktop: Native Spline Component */}
      {!isMobile && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <Spline
            scene={desktopScene}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
          />
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-white/60 text-sm">3D Scene Unavailable</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
                if (isMobile) {
                  setMobileScene(pickNextMobileScene());
                } else {
                  setDesktopScene(pickNextDesktopScene());
                }
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const SplinePage = memo(SplinePageComponent);
export default SplinePage;
