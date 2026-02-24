import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import { initSplineCache } from '../spline/splineCache';
import { useSplineSceneUrl } from '../spline/useSplineSceneUrl';

// Dynamic import for Spline (heavy 3D component)
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

function ensurePreloadLink(scene: string): HTMLLinkElement | null {
  if (typeof document === 'undefined') return null;
  const existing = document.head.querySelector(`link[rel="preload"][as="fetch"][href="${scene}"]`) as HTMLLinkElement | null;
  if (existing) return null;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.href = scene;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  return link;
}

// --- SPLINE BACKGROUND COMPONENT (for cycling backgrounds) ---
// Uses load-lock pattern (same as store page hero) for smooth, lag-free loading
export const SplineBackground = memo(function SplineBackground({
  grayscale = true,
  sceneUrl,
}: {
  grayscale?: boolean;
  sceneUrl: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [allowLoad, setAllowLoad] = useState(false);
  const releaseRef = useRef<null | (() => void)>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scene = sceneUrl;

  const resolvedSceneUrl = useSplineSceneUrl(scene);

  // --- WHEEL PASSTHROUGH: Allow mouse interaction with Spline but keep page scrolling ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      // Stop Spline from using wheel for camera zoom
      e.preventDefault();
      e.stopPropagation();
      // Forward the scroll to the page
      window.scrollBy({ top: e.deltaY, left: e.deltaX });
    };
    el.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', handleWheel, true);
  }, []);

  // --- LOAD LOCK: Only one Spline instance loads at a time (prevents GPU contention) ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    // Preload the runtime in parallel
    import('@splinetool/react-spline').catch(() => undefined);

    // Preload the scene file via link tag + fetch for browser caching
    const link = ensurePreloadLink(scene);
    fetch(scene, { cache: 'force-cache' }).catch(() => undefined);

    // Also try memory cache (blob URL for instant load)
    initSplineCache()
      .then(() => {
        // Cache initialized — scene will auto-resolve via browser cache
      })
      .catch(() => undefined);

    // Wait for exclusive GPU slot
    const lockW = window as typeof window & {
      __BM_SPLINE_LOAD_LOCK__?: { active: boolean; queue: Array<() => void> };
    };
    if (!lockW.__BM_SPLINE_LOAD_LOCK__) {
      lockW.__BM_SPLINE_LOAD_LOCK__ = { active: false, queue: [] };
    }
    const lock = lockW.__BM_SPLINE_LOAD_LOCK__;

    const grant = () => {
      lock.active = true;
      const release = () => {
        lock.active = false;
        const next = lock.queue.shift();
        if (next) next();
      };
      if (cancelled) {
        release();
        return;
      }
      releaseRef.current = release;
      setAllowLoad(true);
    };

    if (!lock.active) grant();
    else lock.queue.push(grant);

    return () => {
      cancelled = true;
      if (link?.parentNode) link.parentNode.removeChild(link);
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
      setAllowLoad(false);
    };
  }, [scene]);

  // Safety timeout — release lock after 15s even if Spline never fires onLoad
  useEffect(() => {
    if (!allowLoad || !releaseRef.current) return;
    const timeout = setTimeout(() => {
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [allowLoad]);

  const handleLoad = useCallback((splineApp: any) => {
    setIsLoaded(true);
    // Release the load lock so other Spline instances can load
    if (releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        zIndex: 0,
        touchAction: 'pan-y',
        backgroundColor: '#000',
        pointerEvents: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Gradient fallback — always visible until Spline is loaded, then fades out */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(15,15,15,1) 0%, rgba(30,30,30,1) 50%, rgba(10,10,10,1) 100%)',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 700ms ease-out',
          zIndex: -1,
        }}
      />

      {/* Spline — only mounts after acquiring load lock (prevents GPU contention) */}
      {allowLoad && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            filter: grayscale ? 'grayscale(100%) saturate(0) contrast(1.1)' : 'none',
            WebkitFilter: grayscale ? 'grayscale(100%) saturate(0) contrast(1.1)' : 'none',
            pointerEvents: 'auto',
            zIndex: 1,
          } as React.CSSProperties}
        >
          <Spline
            scene={resolvedSceneUrl}
            onLoad={handleLoad}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
});
