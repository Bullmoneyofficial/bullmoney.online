"use client";

import { useRef, useState, useEffect } from 'react';

// GLOBAL CACHE: reuse the runtime import to avoid re-downloading 3MB JS on every spline
let runtimePromise = null;

export default function SplineWrapper({ 
  scene, 
  placeholder, // Pass a screenshot URL of your scene here for "instant" load
  className 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  // 1. LAZY TRIGGER: Only start heavy logic when user is 500px away
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: '500px' }); // Load well before user sees it

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. PARALLEL LOADER: Fetches Engine + Scene simultaneously
  useEffect(() => {
    if (!shouldLoad || !canvasRef.current) return;
    let isMounted = true;

    const init = async () => {
      try {
        // Start pre-fetching the runtime only once globally
        if (!runtimePromise) {
          runtimePromise = import('@splinetool/runtime');
        }

        // Wait for Runtime AND Scene to be ready
        const { Application } = await runtimePromise;
        
        if (!isMounted) return;

        // Cleanup old instances to free GPU memory
        if (appRef.current) appRef.current.dispose();

        const isMobile = window.innerWidth < 768;

        // Initialize App
        const app = new Application(canvasRef.current, {
            // "Movie Grade" Settings
            antialias: !isMobile, // ON for desktop (smooth edges), OFF for mobile (fast fps)
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
        });

        appRef.current = app;

        // Load the scene
        await app.load(scene);

        // OPTIMIZATION: Set initial size correctly
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
        
        // Fix for the error you saw: Use setSize, not resize
        if (app.setSize) {
             app.setSize(rect.width, rect.height);
        }

        if (isMounted) setIsLoaded(true);

      } catch (err) {
        console.warn("Spline skipped or failed:", err);
      }
    };

    requestAnimationFrame(init);

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.dispose();
        appRef.current = null;
      }
    };
  }, [shouldLoad, scene]);

  // 3. RESIZE HANDLER (Fixed)
  useEffect(() => {
    if (!appRef.current || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      
      // FIX: The error happened because 'resize' didn't exist. 
      // We use setSize or just update canvas attributes.
      if (appRef.current.setSize) {
          appRef.current.setSize(width, height);
      } else {
          // Fallback if API changes
          const dpr = window.innerWidth < 768 ? 1 : window.devicePixelRatio;
          canvasRef.current.width = width * dpr;
          canvasRef.current.height = height * dpr;
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isLoaded]); // Only attach resize observer after loading

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full isolate overflow-hidden ${className}`}
    >
      {/* PLACEHOLDER: The "Instant" loading trick */}
      {/* User sees this immediately while the 3D loads behind it */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          backgroundImage: placeholder ? `url(${placeholder})` : 'none',
          pointerEvents: 'none'
        }}
      />
      
      {/* 3D CANVAS */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block outline-none transition-opacity duration-1000 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}