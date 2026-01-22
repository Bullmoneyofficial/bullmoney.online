"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import { detectRefreshRate } from '@/lib/use120Hz';

interface Props {
  scene: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean; // Load immediately without intersection observer
}

// Lightweight device detection with 120Hz support
// UPDATED 2026.1.22: Always return true - never block Spline loading
const shouldLoadSpline = () => {
  if (typeof window === 'undefined') return true;
  
  // ALWAYS load Spline - quality will be reduced automatically for low-end devices
  // The spline-wrapper handles all quality adjustments
  return true;
};

// Dynamic import - only load when needed
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

function LazySplineSection({ scene, className = "", children, priority = false }: Props) {
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check device capability on mount
  useEffect(() => {
    setCanRender(shouldLoadSpline());
  }, []);

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
        {canRender && isVisible ? (
          <div className={`w-full h-full transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <Spline 
              className="w-full h-full object-cover" 
              scene={scene}
              onLoad={() => setIsLoaded(true)}
            />
          </div>
        ) : null}
        
        {/* Gradient fallback - always visible until loaded */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-slate-900/50 via-blue-950/30 to-black transition-opacity duration-700 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
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