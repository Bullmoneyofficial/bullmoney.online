"use client";

/**
 * FPS Monitor - Enhanced Real-time Performance Display
 * 
 * Beautiful, state-aware FPS monitor with:
 * - Animated state transitions
 * - Color-coded health indicators
 * - Live sparkline graph
 * - Device tier display
 * - Error tracking integration
 * 
 * UI States:
 * - 🟢 Excellent (58+ FPS) - Green glow, smooth operation
 * - 🔵 Good (50-58 FPS) - Blue glow, acceptable
 * - 🟡 Warning (40-50 FPS) - Yellow glow, needs attention
 * - 🟠 Poor (30-40 FPS) - Orange pulse, degraded
 * - 🔴 Critical (<30 FPS) - Red pulse, action needed
 */

import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import { Activity, AlertTriangle, CheckCircle, Cpu, Gauge, Zap, XCircle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useFpsOptimizer } from '@/lib/FpsOptimizer';
import { useCrashTracker } from '@/lib/CrashTracker';

// ============================================================================
// TYPES
// ============================================================================

type HealthState = 'excellent' | 'good' | 'warning' | 'poor' | 'critical';

interface FpsStats {
  fps: number;
  frameTime: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  dropped: number;
}

interface StateStyle {
  textColor: string;
  bgGradient: string;
  borderColor: string;
  glowShadow: string;
  icon: React.ReactNode;
  label: string;
  pulse: boolean;
}

const STATE_STYLES: Record<HealthState, StateStyle> = {
  excellent: {
    textColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    borderColor: 'border-emerald-500/30',
    glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Excellent',
    pulse: false,
  },
  good: {
    textColor: 'text-blue-400',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    borderColor: 'border-blue-500/30',
    glowShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    icon: <Activity className="w-4 h-4" />,
    label: 'Good',
    pulse: false,
  },
  warning: {
    textColor: 'text-amber-400',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    borderColor: 'border-amber-500/30',
    glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Warning',
    pulse: false,
  },
  poor: {
    textColor: 'text-orange-400',
    bgGradient: 'from-orange-500/15 via-orange-500/8 to-transparent',
    borderColor: 'border-orange-500/40',
    glowShadow: 'shadow-[0_0_25px_rgba(249,115,22,0.2)]',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Poor',
    pulse: true,
  },
  critical: {
    textColor: 'text-red-400',
    bgGradient: 'from-red-500/20 via-red-500/10 to-transparent',
    borderColor: 'border-red-500/50',
    glowShadow: 'shadow-[0_0_30px_rgba(239,68,68,0.25)]',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Critical',
    pulse: true,
  },
};

// ============================================================================
// SPARKLINE COMPONENT
// ============================================================================

const FpsSparkline = memo(({ history, healthState }: { history: number[]; healthState: HealthState }) => {
  const style = STATE_STYLES[healthState];
  const colorMap: Record<HealthState, string> = {
    excellent: '#10b981',
    good: '#3b82f6',
    warning: '#f59e0b',
    poor: '#f97316',
    critical: '#ef4444',
  };
  
  const color = colorMap[healthState];
  const height = 32;
  const width = history.length * 4;
  
  if (history.length < 2) return <div className="w-full h-8 bg-white/5 rounded animate-pulse" />;
  
  const max = Math.max(...history, 70);
  const min = Math.min(...history, 0);
  const range = max - min || 1;
  
  const points = history.map((v, i) => {
    const x = i * 4 + 2;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `2,${height - 2} ${points} ${width - 2},${height - 2}`;
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGrad-${healthState}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill={`url(#sparkGrad-${healthState})`}
      />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      
      {/* Current point */}
      <circle
        cx={width - 2}
        cy={height - 2 - ((history[history.length - 1] - min) / range) * (height - 4)}
        r="3"
        fill={color}
        className={healthState === 'critical' || healthState === 'poor' ? 'animate-pulse' : ''}
      />
    </svg>
  );
});

FpsSparkline.displayName = 'FpsSparkline';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface FpsMonitorProps {
  show?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const FpsMonitor: React.FC<FpsMonitorProps> = ({ 
  show = false,
  position = 'top-right'
}) => {
  const {
    currentFps,
    averageFps,
    shimmerQuality,
    splineQuality,
    deviceTier,
    targetFrameRate,
    enable3D,
  } = useFpsOptimizer();

  const { sessionData } = useCrashTracker();

  const [stats, setStats] = useState<FpsStats>({
    fps: 60,
    frameTime: 16.67,
    avgFps: 60,
    minFps: 60,
    maxFps: 60,
    dropped: 0,
  });
  
  const [fpsHistory, setFpsHistory] = useState<number[]>(Array(40).fill(60));
  const [healthState, setHealthState] = useState<HealthState>('good');

  const fpsHistoryRef = useRef<number[]>([]);
  const frameTimeRef = useRef<number[]>([]);
  const lastTimeRef = useRef(0);
  const droppedRef = useRef(0);

  // Determine health state
  const getHealthState = (fps: number): HealthState => {
    if (fps >= 58) return 'excellent';
    if (fps >= 50) return 'good';
    if (fps >= 40) return 'warning';
    if (fps >= 30) return 'poor';
    return 'critical';
  };

  // Monitor frame performance
  useEffect(() => {
    if (!show) return;
    
    let animationId: number;

    const monitor = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      } else {
        const frameTime = timestamp - lastTimeRef.current;
        frameTimeRef.current.push(frameTime);

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
  }, [show]);

  // Update stats display every 500ms
  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      if (frameTimeRef.current.length > 0) {
        const avgFrameTime =
          frameTimeRef.current.reduce((a, b) => a + b, 0) /
          frameTimeRef.current.length;

        const calculatedFps = Math.round(1000 / avgFrameTime);

        setStats({
          fps: currentFps,
          frameTime: Math.round(avgFrameTime * 10) / 10,
          avgFps: calculatedFps,
          minFps: Math.round(1000 / Math.max(...frameTimeRef.current)),
          maxFps: Math.round(1000 / Math.min(...frameTimeRef.current)),
          dropped: droppedRef.current,
        });
        
        // Update history
        setFpsHistory(prev => [...prev.slice(1), currentFps]);
        
        // Update health state
        setHealthState(getHealthState(currentFps));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentFps, show]);

  if (!show) return null;

  const style = STATE_STYLES[healthState];
  const errorCount = sessionData?.errorCount || 0;
  
  const fpsTrend = fpsHistory[fpsHistory.length - 1] > fpsHistory[fpsHistory.length - 6] ? 'up' : 
                   fpsHistory[fpsHistory.length - 1] < fpsHistory[fpsHistory.length - 6] ? 'down' : 'stable';

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }[position];

  return (
    <div
      className={`fixed ${positionClasses} z-[10000] pointer-events-none`}
      style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}
    >
      <div className={`
        w-64 rounded-xl overflow-hidden
        bg-gradient-to-br ${style.bgGradient}
        border ${style.borderColor}
        ${style.glowShadow}
        backdrop-blur-md bg-black/70
        transition-all duration-500
        ${style.pulse ? 'animate-pulse' : ''}
      `}>
        {/* Header with state indicator */}
        <div className={`flex items-center justify-between px-3 py-2 border-b ${style.borderColor} bg-black/30`}>
          <div className="flex items-center gap-2">
            <span className={style.textColor}>{style.icon}</span>
            <span className={`font-bold ${style.textColor}`}>FPS Monitor</span>
          </div>
          <div className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 ${style.textColor}`}>
            {style.label}
          </div>
        </div>

        {/* Main FPS Display */}
        <div className="px-3 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-black ${style.textColor}`}>
              {stats.fps}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px]">FPS</span>
              <div className="flex items-center gap-1">
                {fpsTrend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                {fpsTrend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                <span className="text-gray-400 text-[10px]">{stats.avgFps} avg</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-bold ${stats.frameTime > 20 ? 'text-amber-400' : 'text-gray-300'}`}>
              {stats.frameTime}ms
            </div>
            <div className="text-[10px] text-gray-500">
              target: {Math.round(1000 / targetFrameRate * 10) / 10}ms
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="px-3 py-2 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 text-[10px]">PERFORMANCE GRAPH</span>
            <span className="text-gray-500 text-[10px]">
              {stats.minFps} - {stats.maxFps}
            </span>
          </div>
          <FpsSparkline history={fpsHistory} healthState={healthState} />
        </div>

        {/* Metrics Row */}
        <div className="px-3 py-2 grid grid-cols-3 gap-2 border-b border-white/5">
          <div className="flex flex-col items-center p-1.5 rounded bg-white/5">
            <Cpu className="w-3 h-3 text-gray-400 mb-0.5" />
            <span className={`text-[10px] font-bold capitalize ${
              deviceTier === 'ultra' || deviceTier === 'high' ? 'text-emerald-400' :
              deviceTier === 'medium' ? 'text-blue-400' : 'text-amber-400'
            }`}>
              {deviceTier}
            </span>
            <span className="text-[8px] text-gray-500">TIER</span>
          </div>
          
          <div className="flex flex-col items-center p-1.5 rounded bg-white/5">
            <BarChart3 className="w-3 h-3 text-gray-400 mb-0.5" />
            <span className={`text-[10px] font-bold capitalize ${
              shimmerQuality === 'high' ? 'text-emerald-400' :
              shimmerQuality === 'medium' ? 'text-blue-400' :
              shimmerQuality === 'low' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {shimmerQuality}
            </span>
            <span className="text-[8px] text-gray-500">SHIMMER</span>
          </div>
          
          <div className="flex flex-col items-center p-1.5 rounded bg-white/5">
            <Zap className="w-3 h-3 text-gray-400 mb-0.5" />
            <span className={`text-[10px] font-bold ${enable3D ? 'text-emerald-400' : 'text-red-400'}`}>
              {enable3D ? 'ON' : 'OFF'}
            </span>
            <span className="text-[8px] text-gray-500">3D</span>
          </div>
        </div>

        {/* Footer stats */}
        <div className="px-3 py-2 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            {stats.dropped > 0 && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.dropped} dropped
              </span>
            )}
          </div>
          
          {errorCount > 0 && (
            <span className="text-red-400 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20">
              <XCircle className="w-3 h-3" />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="px-3 py-1.5 text-center text-[9px] text-gray-600 border-t border-white/5 bg-black/20">
          Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
};

export default memo(FpsMonitor);
