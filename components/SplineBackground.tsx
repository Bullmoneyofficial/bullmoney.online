"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import dynamic from 'next/dynamic';

interface Props {
  scene: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean; // Load immediately without intersection observer
}

// Spline is allowed on all devices/browsers
const shouldLoadSpline = () => true;

function getSplineLoadLock() {
  const w = window as typeof window & { __BM_SPLINE_LOAD_LOCK__?: { active: boolean; queue: Array<() => void> } };
  if (!w.__BM_SPLINE_LOAD_LOCK__) {
    w.__BM_SPLINE_LOAD_LOCK__ = { active: false, queue: [] };
  }
  return w.__BM_SPLINE_LOAD_LOCK__;
}

function waitForSplineSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const lock = getSplineLoadLock();
    const grant = () => {
      lock.active = true;
      resolve(() => {
        lock.active = false;
        const next = lock.queue.shift();
        if (next) next();
      });
    };
    if (!lock.active) grant();
    else lock.queue.push(grant);
  });
}

// Dynamic import - only load when needed
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

function LazySplineSection({ scene, className = "", children, priority = false }: Props) {
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const [allowLoad, setAllowLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<null | (() => void)>(null);

  // Check device capability on mount
  useEffect(() => {
    setCanRender(shouldLoadSpline());
  }, []);

  useEffect(() => {
    if (!canRender || !isVisible) return;
    let cancelled = false;

    waitForSplineSlot().then((release) => {
      if (cancelled) {
        release();
        return;
      }
      releaseRef.current = release;
      setAllowLoad(true);
    });

    return () => {
      cancelled = true;
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
      setAllowLoad(false);
    };
  }, [canRender, isVisible]);

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

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || !canRender) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.05,
        rootMargin: '200px' // Start loading before visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, canRender]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* BACKGROUND: The 3D Scene or Fallback */}
      <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
        {canRender && isVisible && allowLoad ? (
          <div className={`w-full h-full transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <Spline 
              className="w-full h-full object-cover" 
              scene={scene}
              onLoad={() => {
                setIsLoaded(true);
                if (releaseRef.current) {
                  releaseRef.current();
                  releaseRef.current = null;
                }
              }}
            />
          </div>
        ) : null}
        
        {/* Gradient fallback - always visible until loaded */}
        <div 
          className={`absolute inset-0 bg-linear-to-br from-slate-900/50 via-blue-950/30 to-black transition-opacity duration-700 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>

      {/* FOREGROUND: Page Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default memo(LazySplineSection);