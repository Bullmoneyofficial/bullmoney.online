"use client";

/**
 * FPS Monitor - Real-time Performance Display (Enhanced)
 * 
 * Uses advanced FPS measurement system for accurate cross-browser metrics
 * Displays:
 * - Current & average FPS
 * - Frame time (min/max/p95/p99)
 * - Jank detection and scoring
 * - GPU/CPU bottleneck detection
 * - Quality recommendations
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFpsOptimizer } from '@/lib/FpsOptimizer';
import {
  getFpsEngine,
  initializeFpsMeasurement,
  FrameMetrics,
} from '@/lib/FpsMeasurement';
import {
  detectBrowserCapabilities,
  selectOptimalMeasurementConfig,
  analyzeFpsMetrics,
  diagnoseFps,
  formatFpsMetrics,
  FpsRecommendation,
  FrameDiagnostics,
} from '@/lib/FpsCompatibility';

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

  // New advanced metrics
  const [metrics, setMetrics] = useState<FrameMetrics | null>(null);
  const [recommendation, setRecommendation] = useState<FpsRecommendation | null>(null);
  const [diagnosis, setDiagnosis] = useState<FrameDiagnostics | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const engineRef = useRef<ReturnType<typeof getFpsEngine> | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const prevMetricsRef = useRef<string>('');

  // Initialize advanced FPS measurement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Detect browser capabilities
      const capabilities = detectBrowserCapabilities();
      
      // Check for low battery
      const nav = navigator as any;
      const lowBattery = nav.getBattery
        ? nav.getBattery().then((b: any) => b.level < 0.3)
        : Promise.resolve(false);

      lowBattery.then((isLowBattery: boolean) => {
        // Get optimal config for this device
        const config = selectOptimalMeasurementConfig(
          capabilities,
          isLowBattery
        );

        // Initialize or get engine
        if (!engineRef.current) {
          engineRef.current = initializeFpsMeasurement(config);
        }
      });
    } catch (err) {
      console.warn('[FpsMonitor] Failed to initialize advanced measurement:', err);
      // Fallback to basic measurement
      engineRef.current = getFpsEngine();
    }

    return () => {
      // Engine cleanup handled by module
    };
  }, []);

  // Update metrics periodically
  useEffect(() => {
    if (!show || !engineRef.current) return;

    const updateInterval = setInterval(() => {
      const currentMetrics = engineRef.current?.getMetrics();
      if (!currentMetrics) return;

      // Track FPS history for graph
      fpsHistoryRef.current.push(currentMetrics.averageFps);
      if (fpsHistoryRef.current.length > 60) {
        fpsHistoryRef.current.shift();
      }

      // Only update if metrics changed
      const metricsKey = JSON.stringify(currentMetrics);
      if (metricsKey !== prevMetricsRef.current) {
        prevMetricsRef.current = metricsKey;
        setMetrics(currentMetrics);

        // Analyze metrics
        const rec = analyzeFpsMetrics(currentMetrics);
        setRecommendation(rec);

        const diag = diagnoseFps(currentMetrics);
        setDiagnosis(diag);
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [show]);

  if (!show || !metrics) return null;

  // Determine color based on quality recommendation
  const getQualityColor = () => {
    if (!recommendation) return 'text-white';
    switch (recommendation.quality) {
      case 'excellent':
        return 'text-white';
      case 'good':
        return 'text-white';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-orange-500';
      case 'critical':
        return 'text-red-500';
    }
  };

  const getHealthIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '✓';
      case 'good':
        return '●';
      case 'fair':
        return '◐';
      case 'poor':
        return '◑';
      case 'critical':
        return '○';
      default:
        return '?';
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[10000] pointer-events-none"
      style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        lineHeight: '1.3',
      }}
    >
      <style>{`
        @keyframes neon-pulse {
          0%, 100% { text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff; }
          50% { text-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff; }
        }
        @keyframes neon-warn {
          0%, 100% { text-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444; }
          50% { text-shadow: 0 0 8px #ef4444, 0 0 16px #ef4444; }
        }
        .neon-good { animation: neon-pulse 1s ease-in-out infinite; }
        .neon-bad { animation: neon-warn 1s ease-in-out infinite; }
        .fps-panel { cursor: pointer; transition: all 0.2s; }
        .fps-panel:hover { box-shadow: 0 0 24px rgba(255, 255, 255, 0.7), 0 0 48px rgba(255, 255, 255, 0.4) !important; }
      `}</style>

      <div
        className="fps-panel bg-black/95 border-2 border-white/50 rounded-lg p-2.5 text-white shadow-2xl"
        style={{
          boxShadow: '0 0 12px rgba(255, 255, 255, 0.5)',
          maxWidth: '320px',
        }}
        onClick={() => setShowDiagnostics(!showDiagnostics)}
      >
        {/* Header with quality */}
        <div className={`flex items-center gap-2 font-bold mb-2 ${getQualityColor()} ${metrics.averageFps < 40 ? 'neon-bad' : 'neon-good'}`}>
          <span>{getHealthIcon(recommendation?.quality || 'fair')}</span>
          <span>FPS Monitor</span>
          <span className="text-xs opacity-70">(Click for diagnostics)</span>
        </div>

        {/* Main metrics grid */}
        <div className="grid grid-cols-2 gap-2 mb-2 border-t border-white/30 pt-2">
          {/* FPS */}
          <div>
            <div className="text-white/70 text-xs">FPS</div>
            <div className={`font-bold text-lg ${getQualityColor()}`}>
              {metrics.averageFps}
            </div>
            <div className="text-xs text-white/50">
              min: {Math.round(metrics.minFrameTime ? 1000 / metrics.maxFrameTime : 0)} | max: {Math.round(metrics.maxFrameTime ? 1000 / metrics.minFrameTime : 0)}
            </div>
          </div>

          {/* Frame Time */}
          <div>
            <div className="text-white/70 text-xs">Frame Time</div>
            <div className={metrics.averageFrameTime > 16.67 ? 'text-red-400 font-bold' : 'text-white font-bold'}>
              {metrics.averageFrameTime.toFixed(2)}ms
            </div>
            <div className="text-xs text-white/50">
              p95: {metrics.p95FrameTime.toFixed(1)}ms
            </div>
          </div>

          {/* Bottleneck */}
          <div>
            <div className="text-white/70 text-xs">Bottleneck</div>
            <div className="font-bold">
              {metrics.isGpuBound ? (
                <span className="text-orange-400">GPU</span>
              ) : metrics.isCpuBound ? (
                <span className="text-yellow-400">CPU</span>
              ) : (
                <span className="text-white">Balanced</span>
              )}
            </div>
          </div>

          {/* Jank */}
          <div>
            <div className="text-white/70 text-xs">Jank</div>
            <div className={metrics.jankScore > 0.3 ? 'text-red-400 font-bold' : 'text-white font-bold'}>
              {(metrics.jankScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-white/50">
              {metrics.jankEvents} events
            </div>
          </div>
        </div>

        {/* Quality & Recommendations */}
        {recommendation && (
          <div className="border-t border-white/30 pt-2 mb-2 text-xs">
            <div className="text-white/70 font-bold mb-1">
              Quality: <span className="text-white capitalize">{recommendation.quality}</span>
            </div>
            {recommendation.issues.length > 0 && (
              <div className="text-red-300/70 mb-1">
                ⚠️ {recommendation.issues[0]}
              </div>
            )}
            {recommendation.recommendations.length > 0 && (
              <div className="text-yellow-300/70">
                💡 {recommendation.recommendations[0]}
              </div>
            )}
          </div>
        )}

        {/* Diagnostics Panel */}
        {showDiagnostics && diagnosis && (
          <div className="border-t border-white/30 pt-2 text-xs bg-white/10/30 rounded p-2">
            <div className="font-bold text-white mb-1 capitalize">
              {diagnosis.category}
            </div>
            <div className="text-white/70 mb-1 text-xs">
              {diagnosis.diagnosis}
            </div>
            <div className="text-xs space-y-0.5">
              {diagnosis.nextSteps.slice(0, 3).map((step, i) => (
                <div key={i} className="text-white/70">
                  • {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact FPS Graph */}
        <div className="border-t border-white/30 pt-2">
          <div className="flex gap-px h-4">
            {fpsHistoryRef.current.slice(-40).map((fps, i) => {
              const height = Math.max(1, Math.round((fps / 60) * 16));
              const color =
                fps >= 58
                  ? 'bg-white'
                  : fps >= 50
                  ? 'bg-white'
                  : fps >= 40
                  ? 'bg-yellow-500'
                  : fps >= 30
                  ? 'bg-orange-500'
                  : 'bg-red-500';
              return (
                <div
                  key={i}
                  className={`${color} flex-1 opacity-80`}
                  style={{ height: `${height}px` }}
                  title={`${fps} FPS`}
                />
              );
            })}
          </div>
        </div>

        {/* Status Footer */}
        <div className="text-xs text-white/50 mt-2 pt-2 border-t border-white/30">
          Samples: {metrics.sampleCount} | {metrics.isReliable ? '✓ Reliable' : '⚠ Low sample'}
        </div>
      </div>
    </div>
  );
};

export default FpsMonitor;
