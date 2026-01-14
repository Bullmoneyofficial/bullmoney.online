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

  // Update stats display every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (frameTimeRef.current.length > 0) {
        const avgFrameTime =
          frameTimeRef.current.reduce((a, b) => a + b, 0) /
          frameTimeRef.current.length;

        // Calculate FPS from frame time
        const calculatedFps = Math.round(1000 / avgFrameTime);

        setStats({
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
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentFps]);

  if (!show) return null;

  // Color coding based on FPS
  const getColor = (fps: number) => {
    if (fps >= 58) return 'text-green-400'; // Good
    if (fps >= 50) return 'text-lime-400'; // OK
    if (fps >= 40) return 'text-yellow-400'; // Warning
    if (fps >= 30) return 'text-orange-400'; // Bad
    return 'text-red-500'; // Critical
  };

  const getHealthIcon = (fps: number) => {
    if (fps >= 58) return '✓';
    if (fps >= 50) return '⚠';
    if (fps >= 30) return '!';
    return '✗';
  };

  return (
    <div
      className="fixed top-4 right-4 z-[10000] pointer-events-none"
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        lineHeight: '1.4',
      }}
    >
      {/* FPS Display */}
      <div className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-lg p-3 text-white shadow-lg">
        {/* Header */}
        <div className={`flex items-center gap-2 font-bold mb-2 ${getColor(stats.fps)}`}>
          <span>{getHealthIcon(stats.fps)}</span>
          <span className="text-yellow-200">FPS Monitor</span>
        </div>

        {/* Current FPS - Main metric */}
        <div className="mb-2 border-t border-gray-600 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">FPS:</span>
            <span className={`font-bold text-lg ${getColor(stats.fps)}`}>
              {stats.fps}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            avg: {stats.avgFps} | min: {stats.minFps} | max: {stats.maxFps}
          </div>
        </div>

        {/* Frame Time */}
        <div className="flex justify-between items-center text-gray-300 mb-1">
          <span className="text-gray-400">Frame:</span>
          <span className={stats.frameTime > 16.67 ? 'text-red-400' : 'text-green-400'}>
            {stats.frameTime}ms
          </span>
        </div>

        {/* Target */}
        <div className="flex justify-between items-center text-gray-300 mb-2 text-xs">
          <span className="text-gray-500">Target:</span>
          <span className="text-blue-300">{targetFrameRate}fps ({Math.round(1000 / targetFrameRate * 10) / 10}ms)</span>
        </div>

        {/* Dropped Frames */}
        {stats.dropped > 0 && (
          <div className="flex justify-between items-center text-orange-400 mb-2 text-xs border-t border-gray-600 pt-2">
            <span>Dropped:</span>
            <span>{stats.dropped}</span>
          </div>
        )}

        {/* Quality Settings */}
        <div className="border-t border-gray-600 pt-2 text-xs">
          <div className="text-gray-400 mb-1">Quality:</div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Tier:</span>
            <span className="text-purple-300 font-mono capitalize">
              {deviceTier}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Shimmer:</span>
            <span className={
              shimmerQuality === 'high'
                ? 'text-green-400'
                : shimmerQuality === 'medium'
                ? 'text-yellow-400'
                : shimmerQuality === 'low'
                ? 'text-orange-400'
                : 'text-red-400'
            }>
              {shimmerQuality}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">3D:</span>
            <span className={enable3D ? 'text-green-400' : 'text-red-400'}>
              {enable3D ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* FPS Graph (mini sparkline) */}
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="text-gray-500 text-xs mb-1">History:</div>
          <div className="flex gap-px h-6">
            {fpsHistoryRef.current.slice(-30).map((fps, i) => {
              const height = Math.max(1, Math.round((fps / 60) * 24));
              const color =
                fps >= 58
                  ? 'bg-green-500'
                  : fps >= 50
                  ? 'bg-lime-500'
                  : fps >= 40
                  ? 'bg-yellow-500'
                  : fps >= 30
                  ? 'bg-orange-500'
                  : 'bg-red-500';
              return (
                <div
                  key={i}
                  className={`${color} flex-1 opacity-80 hover:opacity-100`}
                  style={{ height: `${height}px` }}
                  title={`${fps} FPS`}
                />
              );
            })}
          </div>
        </div>

        {/* Debug Info */}
        <div className="border-t border-gray-600 pt-2 mt-2 text-xs text-gray-500">
          <div className="text-center">
            Press Ctrl+Shift+P to toggle this
          </div>
        </div>
      </div>
    </div>
  );
};

export default FpsMonitor;
