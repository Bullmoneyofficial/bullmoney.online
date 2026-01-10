"use client";

import { useRef, useState, useEffect } from 'react';

export default function SplineWrapper({ scene, onLoad, onError }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Handle canvas sizing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!canvasRef.current || !containerRef.current) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const { width, height } = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(resizeCanvas, 0);
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle Spline loading and visibility
  useEffect(() => {
    let isMounted = true;
    let animationFrameId;

    const loadSpline = async () => {
      try {
        const { Application } = await import('@splinetool/runtime');

        if (!isMounted || !canvasRef.current) return;

        appRef.current = new Application(canvasRef.current, {
          fps: 60,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        });

        await appRef.current.load(scene);

        if (isMounted) {
          setIsReady(true);
          onLoad?.();
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          onError?.(err);
        }
      }
    };

    loadSpline();

    // Pause/resume based on visibility
    const handleVisibilityChange = () => {
      if (!appRef.current) return;

      if (document.hidden) {
        appRef.current.stop?.();
      } else {
        appRef.current.play?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (appRef.current) {
        appRef.current.stop?.();
        appRef.current.dispose?.();
        appRef.current = null;
      }
    };
  }, [scene, onLoad, onError]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-red-500/60 text-sm">Scene unavailable</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full transition-opacity duration-700 ease-out"
        style={{ opacity: isReady ? 1 : 0, display: 'block' }}
      />
    </div>
  );
}
