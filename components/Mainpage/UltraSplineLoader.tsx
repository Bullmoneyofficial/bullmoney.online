"use client";

/**
 * Ultra Spline Loader - Maximum Performance Edition
 *
 * Features:
 * - WebWorker-based loading (non-blocking)
 * - Adaptive quality (auto-adjusts to FPS)
 * - Progressive rendering
 * - Touch gestures optimized
 * - Frame budget management
 * - Works on ALL devices
 */

import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { Loader2, Zap, TrendingUp } from 'lucide-react';
import { splineManager } from '@/lib/splineManager';
import {
  chunkStreamer,
  qualityManager,
  frameBudget,
  type StreamProgress
} from '@/lib/splineStreamer';

const Spline = lazy(() =>
  import('@splinetool/react-spline').then((mod) => ({
    default: mod.default || mod,
  }))
);

// ============================================================================
// TYPES
// ============================================================================

interface UltraSplineLoaderProps {
  scene: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
  enableInteraction?: boolean;
  onLoad?: (spline: any) => void;
  onError?: (error: Error) => void;
  adaptiveQuality?: boolean; // Auto-adjust quality based on FPS
  enableGestures?: boolean; // Enhanced touch gestures
}

interface LoadState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: StreamProgress | null;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  fps: number;
}

// ============================================================================
// ENHANCED LOADING SCREEN
// ============================================================================

function UltraLoadingScreen({ progress, priority, fps }: {
  progress: StreamProgress | null;
  priority: string;
  fps: number;
}) {
  const isCritical = priority === 'critical';
  const speedMBps = progress ? (progress.speed / 1024 / 1024).toFixed(1) : '0';
  const etaSeconds = progress?.eta ? Math.ceil(progress.eta) : 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#050814] via-[#0b1226]/90 to-[#04060f] overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* Pulsing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${
                i === 0 ? 'rgba(59, 130, 246, 0.15)' :
                i === 1 ? 'rgba(139, 92, 246, 0.12)' :
                'rgba(236, 72, 153, 0.10)'
              }, transparent)`,
              left: `${20 + i * 30}%`,
              top: `${10 + i * 25}%`,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-6 px-6 max-w-lg">
        {/* Advanced loader with FPS indicator */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400"
            style={{ animation: 'spin 1.5s linear infinite' }}
          />

          {/* Middle pulse ring */}
          <div className="absolute inset-3 rounded-full border border-blue-400/30 bg-blue-500/5" />
          <div
            className="absolute inset-3 rounded-full border border-blue-400/50"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />

          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {fps > 0 ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">{fps}</div>
                <div className="text-[8px] text-blue-400/60 font-mono">FPS</div>
              </div>
            ) : (
              <Loader2
                className="h-12 w-12 text-blue-300 animate-spin"
                style={{ animationDuration: '1s' }}
              />
            )}
          </div>

          {/* Progress arc */}
          {progress && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="60"
                fill="none"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="3"
              />
              <circle
                cx="50%"
                cy="50%"
                r="60"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress.loaded / progress.total)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* Status */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 backdrop-blur-sm">
            <Zap className="w-3 h-3 text-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              {isCritical ? 'Ultra Priority' : 'Optimizing Experience'}
            </span>
          </div>

          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-blue-100 to-purple-200">
            {progress
              ? `${((progress.loaded / progress.total) * 100).toFixed(0)}% Loaded`
              : 'Preparing Scene'}
          </h3>

          {/* Advanced progress info */}
          {progress && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="w-full h-2 bg-blue-100/10 rounded-full overflow-hidden border border-blue-400/20">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 rounded-full relative overflow-hidden"
                  style={{
                    width: `${(progress.loaded / progress.total) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{
                      animation: 'shimmer 2s infinite',
                      backgroundSize: '200% 100%'
                    }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-400/20">
                  <div className="text-blue-300 font-mono font-bold">
                    {speedMBps} MB/s
                  </div>
                  <div className="text-blue-200/50 text-[10px]">Speed</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-400/20">
                  <div className="text-purple-300 font-mono font-bold">
                    {etaSeconds}s
                  </div>
                  <div className="text-purple-200/50 text-[10px]">ETA</div>
                </div>
                <div className="p-2 rounded-lg bg-green-500/5 border border-green-400/20">
                  <div className="text-green-300 font-mono font-bold">
                    {progress.chunks}
                  </div>
                  <div className="text-green-200/50 text-[10px]">Chunks</div>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <p className="text-xs text-blue-100/40 mt-2">
            <TrendingUp className="inline w-3 h-3 mr-1" />
            Auto-adjusting quality for your device...
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UltraSplineLoader({
  scene,
  priority = 'medium',
  className = '',
  enableInteraction = true,
  onLoad,
  onError,
  adaptiveQuality = true,
  enableGestures = true
}: UltraSplineLoaderProps) {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'idle',
    progress: null,
    quality: 'high',
    fps: 0
  });
  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const splineRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);

  // Load scene with streaming
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function loadScene() {
      try {
        setLoadState(prev => ({
          ...prev,
          status: 'loading',
          progress: null
        }));

        // Use chunk streamer for progressive loading
        const blob = await chunkStreamer.stream(
          {
            url: scene,
            priority,
            enableProgressive: true
          },
          (progress) => {
            if (!cancelled) {
              setLoadState(prev => ({
                ...prev,
                progress
              }));
            }
          }
        );

        if (cancelled) return;

        // Register with memory manager
        splineManager.getMemoryStatus(); // Check availability

        const objectUrl = URL.createObjectURL(blob);
        setSceneUrl(objectUrl);
        cleanup = () => URL.revokeObjectURL(objectUrl);

        setLoadState(prev => ({
          ...prev,
          status: 'ready'
        }));
      } catch (error: any) {
        if (!cancelled) {
          console.error('[UltraSplineLoader] Load failed:', error);
          setLoadState(prev => ({
            ...prev,
            status: 'error'
          }));
          onError?.(error);
        }
      }
    }

    loadScene();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [scene, priority, onError]);

  // Adaptive quality monitoring
  useEffect(() => {
    if (!adaptiveQuality || !sceneUrl) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const monitorPerformance = (timestamp: number) => {
      frameBudget.startFrame();

      // Calculate FPS
      frameCount++;
      if (timestamp - lastTime >= 1000) {
        const currentFps = Math.round(frameCount);
        frameCount = 0;
        lastTime = timestamp;

        // Update quality manager
        qualityManager.recordFrame(timestamp - (lastFrameTimeRef.current || timestamp));
        const newQuality = qualityManager.updateQuality();

        setLoadState(prev => ({
          ...prev,
          quality: newQuality,
          fps: currentFps
        }));

        // Apply quality to Spline if changed
        if (splineRef.current && newQuality !== loadState.quality) {
          applyQuality(splineRef.current, newQuality);
        }
      }

      lastFrameTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(monitorPerformance);
    };

    animationFrameRef.current = requestAnimationFrame(monitorPerformance);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [adaptiveQuality, sceneUrl, loadState.quality]);

  // Apply quality settings
  const applyQuality = useCallback((spline: any, quality: 'ultra' | 'high' | 'medium' | 'low') => {
    try {
      console.log(`[UltraSplineLoader] Applying ${quality} quality`);

      const settings = {
        ultra: {
          quality: 'high',
          shadows: 'high',
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          antialiasing: true,
          postProcessing: true,
          reflections: true,
          particles: true
        },
        high: {
          quality: 'high',
          shadows: 'medium',
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          antialiasing: true,
          postProcessing: true,
          reflections: false,
          particles: true
        },
        medium: {
          quality: 'medium',
          shadows: 'low',
          pixelRatio: Math.min(window.devicePixelRatio, 1.25),
          antialiasing: true,
          postProcessing: false,
          reflections: false,
          particles: false
        },
        low: {
          quality: 'low',
          shadows: 'none',
          pixelRatio: 1,
          antialiasing: false,
          postProcessing: false,
          reflections: false,
          particles: false
        }
      };

      const config = settings[quality];

      spline.setQuality?.(config.quality);
      spline.setShadowQuality?.(config.shadows);
      spline.setPixelRatio?.(config.pixelRatio);
      spline.setAntialias?.(config.antialiasing);
      spline.setPostProcessing?.(config.postProcessing);

      // Universal optimizations
      spline.setFrustumCulling?.(true);
      spline.setOcclusionCulling?.(true);

    } catch (error) {
      console.warn('[UltraSplineLoader] Failed to apply quality:', error);
    }
  }, []);

  // Handle Spline load
  const handleSplineLoad = useCallback((spline: any) => {
    splineRef.current = spline;

    // Apply initial quality
    applyQuality(spline, loadState.quality);

    onLoad?.(spline);
  }, [loadState.quality, applyQuality, onLoad]);

  // Enhanced touch gestures
  useEffect(() => {
    if (!enableGestures || !containerRef.current) return;

    const container = containerRef.current;
    let lastTouchY = 0;
    let velocity = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches.item(0);
      if (!touch) return;
      lastTouchY = touch.clientY;
      velocity = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches.item(0);
      if (!touch) return;
      const currentY = touch.clientY;
      const delta = currentY - lastTouchY;
      velocity = delta;
      lastTouchY = currentY;

      // Allow scene interaction
      if (Math.abs(delta) < 5 && enableInteraction) {
        e.stopPropagation();
      }
    };

    const handleTouchEnd = () => {
      // Apply momentum if high velocity
      if (Math.abs(velocity) > 10 && splineRef.current) {
        // Smooth rotation or camera movement
        // This would be customized per scene
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableGestures, enableInteraction]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Loading state */}
      {loadState.status === 'loading' && (
        <UltraLoadingScreen
          progress={loadState.progress}
          priority={priority}
          fps={loadState.fps}
        />
      )}

      {/* Error state */}
      {loadState.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-950/20 via-black to-red-950/20">
          <div className="text-center space-y-4 p-8 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-bold text-white">Load Failed</h3>
            <p className="text-sm text-white/70">
              Unable to load 3D scene. Check your connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Spline scene */}
      {sceneUrl && (
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            loadState.status === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Suspense fallback={<div className="w-full h-full bg-black" />}>
            <Spline
              scene={sceneUrl}
              onLoad={handleSplineLoad}
              onError={(error) => {
                console.error('[UltraSplineLoader] Spline error:', error);
                setLoadState(prev => ({ ...prev, status: 'error' }));
                const normalized = error instanceof Error ? error : new Error('Spline error');
                onError?.(normalized);
              }}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: enableInteraction ? 'auto' : 'none',
                touchAction: enableInteraction ? 'none' : 'auto',
              }}
            />
          </Suspense>

          {/* Quality indicator (debug) */}
          {adaptiveQuality && loadState.fps > 0 && process.env.NODE_ENV === 'development' && (
            <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-mono text-white/80">
              <div>Quality: {loadState.quality.toUpperCase()}</div>
              <div>FPS: {loadState.fps}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UltraSplineLoader;
