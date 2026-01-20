"use client";

/**
 * FPS Monitor - Real-time Performance Display
 * 
 * Displays FPS, frame time, and quality metrics in top-right corner
 * Helps debug performance issues during development
 * 
 * Shows:
 * - Current FPS
 * - Average FPS
 * - Frame time (ms)
 * - Quality settings
 * - Memory usage (optional)
 * - Device tier
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFpsOptimizer } from '@/lib/FpsOptimizer';

interface FpsStats {
  fps: number;
  frameTime: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  dropped: number;
}

const FpsMonitor = ({ show = false }: { show?: boolean }) => {
  const {
    currentFps,
    averageFps,
    shimmerQuality,
    splineQuality,
    deviceTier,
    targetFrameRate,
    enable3D,
  } = useFpsOptimizer();

  const [stats, setStats] = useState<FpsStats>({
    fps: 60,
    frameTime: 16.67,
    avgFps: 60,
    minFps: 60,
    maxFps: 60,
    dropped: 0,
  });

  const fpsHistoryRef = useRef<number[]>([]);
  const frameTimeRef = useRef<number[]>([]);
  const lastTimeRef = useRef(0);
  const droppedRef = useRef(0);

  // Monitor frame performance
  useEffect(() => {
    let animationId: number;

    const monitor = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      } else {
        const frameTime = timestamp - lastTimeRef.current;
        frameTimeRef.current.push(frameTime);

        // Track dropped frames (>33ms for 30fps, >16.67ms for 60fps)
        if (frameTime > 33) {
          droppedRef.current++;
        }

        if (frameTimeRef.current.length > 120) {
          frameTimeRef.current.shift();
        }
      }

      lastTimeRef.current = timestamp;
      animationId = requestAnimationFrame(monitor);
    };

    animationId = requestAnimationFrame(monitor);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Track previous stats to prevent unnecessary updates
  const prevStatsRef = useRef<string>('');
  
  // Update stats display every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (frameTimeRef.current.length > 0) {
        const avgFrameTime =
          frameTimeRef.current.reduce((a, b) => a + b, 0) /
          frameTimeRef.current.length;

        // Calculate FPS from frame time
        const calculatedFps = Math.round(1000 / avgFrameTime);

        const newStats = {
          fps: currentFps,
          frameTime: Math.round(avgFrameTime * 10) / 10,
          avgFps: calculatedFps,
          minFps: Math.round(
            1000 / Math.max(...frameTimeRef.current)
          ),
          maxFps: Math.round(
            1000 / Math.min(...frameTimeRef.current)
          ),
          dropped: droppedRef.current,
        };
        
        // Only update if stats actually changed (prevents infinite loop)
        const statsKey = JSON.stringify(newStats);
        if (statsKey !== prevStatsRef.current) {
          prevStatsRef.current = statsKey;
          setStats(newStats);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentFps]);

  if (!show) return null;

  // Color coding based on FPS - Neon Blue/Red theme
  const getColor = (fps: number) => {
    if (fps >= 58) return 'text-blue-400'; // Neon Blue - Good
    if (fps >= 50) return 'text-blue-300'; // Neon Blue - OK
    if (fps >= 40) return 'text-yellow-400'; // Warning
    if (fps >= 30) return 'text-orange-500'; // Bad
    return 'text-red-500'; // Critical Red
  };

  const getHealthIcon = (fps: number) => {
    if (fps >= 58) return '●';
    if (fps >= 50) return '◐';
    if (fps >= 30) return '◑';
    return '○';
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[10000] pointer-events-none"
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        lineHeight: '1.4',
      }}
    >
      {/* FPS Display - Neon Blue/Red Aesthetic */}
      <style>{`
        @keyframes neon-pulse {
          0%, 100% { 
            text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
          }
          50% { 
            text-shadow: 0 0 8px #3b82f6, 0 0 16px #3b82f6;
          }
        }
        @keyframes neon-red-pulse {
          0%, 100% { 
            text-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444;
          }
          50% { 
            text-shadow: 0 0 8px #ef4444, 0 0 16px #ef4444;
          }
        }
        .neon-fps-text {
          animation: neon-pulse 1s ease-in-out infinite;
        }
        .neon-red-text {
          animation: neon-red-pulse 1s ease-in-out infinite;
        }
      `}</style>
      <div className="bg-black/90 border-2 border-blue-500/50 rounded-lg p-3 text-white shadow-2xl" style={{
        boxShadow: '0 0 12px rgba(59, 130, 246, 0.5), 0 0 24px rgba(59, 130, 246, 0.3)'
      }}>
        {/* Header */}
        <div className={`flex items-center gap-2 font-bold mb-2 ${getColor(stats.fps)} ${stats.fps < 40 ? 'neon-red-text' : 'neon-fps-text'}`}>
          <span>{getHealthIcon(stats.fps)}</span>
          <span>FPS Monitor</span>
        </div>

        {/* Current FPS - Main metric */}
        <div className="mb-2 border-t border-blue-500/30 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-blue-300/70">FPS:</span>
            <span className={`font-bold text-lg ${getColor(stats.fps)} ${stats.fps < 40 ? 'neon-red-text' : 'neon-fps-text'}`}>
              {stats.fps}
            </span>
          </div>
          <div className="text-xs text-blue-300/50 mt-1">
            avg: {stats.avgFps} | min: {stats.minFps} | max: {stats.maxFps}
          </div>
        </div>

        {/* Frame Time */}
        <div className="flex justify-between items-center text-blue-300/70 mb-1 text-xs">
          <span>Frame:</span>
          <span className={stats.frameTime > 16.67 ? 'text-red-500 font-bold' : 'text-blue-400'}>
            {stats.frameTime}ms
          </span>
        </div>

        {/* Target */}
        <div className="flex justify-between items-center text-blue-300/70 mb-2 text-xs">
          <span>Target:</span>
          <span className="text-blue-400">{targetFrameRate}fps</span>
        </div>

        {/* Dropped Frames */}
        {stats.dropped > 0 && (
          <div className="flex justify-between items-center text-red-500 mb-2 text-xs border-t border-red-500/30 pt-2 font-bold">
            <span>Dropped:</span>
            <span>{stats.dropped}</span>
          </div>
        )}

        {/* Quality Settings */}
        <div className="border-t border-blue-500/30 pt-2 text-xs">
          <div className="text-blue-300/70 mb-1 font-bold">Quality:</div>
          <div className="flex justify-between mb-1">
            <span className="text-blue-300/60">Tier:</span>
            <span className="text-blue-400 font-mono capitalize">
              {deviceTier}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300/60">3D:</span>
            <span className={enable3D ? 'text-blue-400' : 'text-red-500'}>
              {enable3D ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* FPS Graph (mini sparkline) */}
        <div className="border-t border-blue-500/30 pt-2 mt-2">
          <div className="text-blue-300/70 text-xs mb-1 font-bold">Graph:</div>
          <div className="flex gap-px h-5">
            {fpsHistoryRef.current.slice(-20).map((fps, i) => {
              const height = Math.max(1, Math.round((fps / 60) * 20));
              const color =
                fps >= 58
                  ? 'bg-blue-500'
                  : fps >= 50
                  ? 'bg-blue-400'
                  : fps >= 40
                  ? 'bg-yellow-500'
                  : fps >= 30
                  ? 'bg-orange-500'
                  : 'bg-red-500';
              return (
                <div
                  key={i}
                  className={`${color} flex-1 opacity-100`}
                  style={{ 
                    height: `${height}px`,
                    boxShadow: fps < 40 ? 'inset 0 0 2px rgba(239, 68, 68, 0.8)' : 'inset 0 0 2px rgba(59, 130, 246, 0.8)'
                  }}
                  title={`${fps} FPS`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FpsMonitor;
