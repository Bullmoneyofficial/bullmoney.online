"use client";

/**
 * Performance Dashboard - Enhanced UI States for FPS & Crash Tracking
 * 
 * Beautiful, animated dashboard combining:
 * - Real-time FPS monitoring with visual states
 * - Crash/error tracking with severity indicators
 * - Device performance metrics
 * - Session health status
 * 
 * UI States:
 * - Optimal (green glow) - 55+ FPS, no errors
 * - Good (blue glow) - 45-55 FPS, minor warnings
 * - Warning (yellow glow) - 30-45 FPS, performance issues
 * - Critical (red pulse) - <30 FPS or crash detected
 * - Recovering (amber transition) - Performance improving
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Activity, AlertTriangle, CheckCircle, Cpu, Zap, WifiOff, Gauge, TrendingUp, TrendingDown, XCircle, RefreshCw, BarChart3 } from 'lucide-react';
import { useFpsOptimizer } from '@/lib/FpsOptimizer';
import { useCrashTracker } from '@/lib/CrashTracker';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type PerformanceState = 'optimal' | 'good' | 'warning' | 'critical' | 'recovering' | 'offline';

interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  droppedFrames: number;
  errorCount: number;
  warningCount: number;
  sessionUptime: number;
  memoryUsage?: number;
}

interface StateConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: React.ReactNode;
  label: string;
  pulse: boolean;
}

const STATE_CONFIGS: Record<PerformanceState, StateConfig> = {
  optimal: {
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/30',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Optimal',
    pulse: false,
  },
  good: {
    color: 'text-blue-400',
    bgColor: 'from-blue-500/20 via-blue-500/10 to-transparent',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/30',
    icon: <Activity className="w-4 h-4" />,
    label: 'Good',
    pulse: false,
  },
  warning: {
    color: 'text-amber-400',
    bgColor: 'from-amber-500/20 via-amber-500/10 to-transparent',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/30',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Warning',
    pulse: false,
  },
  critical: {
    color: 'text-red-400',
    bgColor: 'from-red-500/25 via-red-500/15 to-transparent',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-red-500/40',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Critical',
    pulse: true,
  },
  recovering: {
    color: 'text-orange-400',
    bgColor: 'from-orange-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/30',
    icon: <RefreshCw className="w-4 h-4 animate-spin" />,
    label: 'Recovering',
    pulse: false,
  },
  offline: {
    color: 'text-gray-400',
    bgColor: 'from-gray-500/20 via-gray-500/10 to-transparent',
    borderColor: 'border-gray-500/40',
    glowColor: 'shadow-gray-500/20',
    icon: <WifiOff className="w-4 h-4" />,
    label: 'Offline',
    pulse: false,
  },
};

// ============================================================================
// MINI SPARKLINE COMPONENT
// ============================================================================

const MiniSparkline = memo(({ data, height = 24, color = '#60a5fa' }: { data: number[]; height?: number; color?: string }) => {
  if (data.length < 2) return null;
  
  const max = Math.max(...data, 60);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = data.length * 3;
  
  const points = data.map((v, i) => {
    const x = i * 3;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="opacity-80">
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width - 3},${height}`}
        fill="url(#sparkGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

MiniSparkline.displayName = 'MiniSparkline';

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

const MetricCard = memo(({ icon, label, value, subValue, trend, color = 'text-blue-400' }: MetricCardProps) => (
  <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/10">
    <div className={color}>{icon}</div>
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-bold ${color}`}>{value}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          </span>
        )}
      </div>
      {subValue && <span className="text-[9px] text-gray-500">{subValue}</span>}
    </div>
  </div>
));

MetricCard.displayName = 'MetricCard';

// ============================================================================
// ERROR BADGE COMPONENT
// ============================================================================

const ErrorBadge = memo(({ count, type }: { count: number; type: 'error' | 'warning' }) => {
  if (count === 0) return null;
  
  const isError = type === 'error';
  
  return (
    <div className={`
      flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
      ${isError 
        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      }
      ${isError && count > 0 ? 'animate-pulse' : ''}
    `}>
      {isError ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      <span>{count}</span>
    </div>
  );
});

ErrorBadge.displayName = 'ErrorBadge';

// ============================================================================
// FPS GAUGE COMPONENT
// ============================================================================

const FpsGauge = memo(({ fps, maxFps = 120, state }: { fps: number; maxFps?: number; state: PerformanceState }) => {
  const config = STATE_CONFIGS[state];
  const percentage = Math.min((fps / maxFps) * 100, 100);
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  
  return (
    <div className="relative w-20 h-12 overflow-hidden">
      {/* Gauge background */}
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="66%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Colored arc based on FPS */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          className="transition-all duration-300"
        />
        
        {/* Needle */}
        <g transform={`rotate(${rotation} 50 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
          <circle cx="50" cy="50" r="4" fill="white" className="drop-shadow-md" />
        </g>
      </svg>
      
      {/* FPS value */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-lg font-black ${config.color}`}>
        {fps}
      </div>
    </div>
  );
});

FpsGauge.displayName = 'FpsGauge';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface PerformanceDashboardProps {
  show?: boolean;
  compact?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  show = true,
  compact = false,
  position = 'top-right',
}) => {
  // Hooks
  const fpsOptimizer = useFpsOptimizer();
  const crashTracker = useCrashTracker();
  
  // State
  const [performanceState, setPerformanceState] = useState<PerformanceState>('good');
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    avgFps: 60,
    minFps: 60,
    maxFps: 60,
    frameTime: 16.67,
    droppedFrames: 0,
    errorCount: 0,
    warningCount: 0,
    sessionUptime: 0,
  });
  const [fpsHistory, setFpsHistory] = useState<number[]>(Array(30).fill(60));
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(0);
  const droppedFramesRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const previousFpsRef = useRef(60);
  const recoveringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate performance state
  const calculateState = useCallback((fps: number, errors: number, wasRecovering: boolean): PerformanceState => {
    if (!isOnline) return 'offline';
    if (errors > 3) return 'critical';
    if (fps < 25) return 'critical';
    if (fps < 35) return 'warning';
    
    // Check if we're recovering from a drop
    if (wasRecovering && fps > previousFpsRef.current && fps < 50) {
      return 'recovering';
    }
    
    if (fps < 50) return 'warning';
    if (fps < 55) return 'good';
    return 'optimal';
  }, [isOnline]);
  
  // Frame monitoring
  useEffect(() => {
    if (!show) return;
    
    let animationId: number;
    
    const measureFrame = (timestamp: number) => {
      if (lastFrameTimeRef.current > 0) {
        const frameTime = timestamp - lastFrameTimeRef.current;
        frameTimesRef.current.push(frameTime);
        
        if (frameTime > 33) {
          droppedFramesRef.current++;
        }
        
        // Keep last 120 frame times
        if (frameTimesRef.current.length > 120) {
          frameTimesRef.current.shift();
        }
      }
      
      lastFrameTimeRef.current = timestamp;
      animationId = requestAnimationFrame(measureFrame);
    };
    
    animationId = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(animationId);
  }, [show]);
  
  // Update metrics periodically
  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      const frames = frameTimesRef.current;
      if (frames.length === 0) return;
      
      const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
      const calculatedFps = Math.round(1000 / avgFrameTime);
      const minFrameTime = Math.max(...frames);
      const maxFrameTime = Math.min(...frames);
      
      const newMetrics: PerformanceMetrics = {
        fps: fpsOptimizer.currentFps,
        avgFps: calculatedFps,
        minFps: Math.round(1000 / minFrameTime),
        maxFps: Math.round(1000 / maxFrameTime),
        frameTime: Math.round(avgFrameTime * 100) / 100,
        droppedFrames: droppedFramesRef.current,
        errorCount: crashTracker.sessionData?.errorCount || 0,
        warningCount: 0, // Could track warnings separately
        sessionUptime: Math.round((Date.now() - sessionStartRef.current) / 1000),
      };
      
      setMetrics(newMetrics);
      
      // Update FPS history
      setFpsHistory(prev => [...prev.slice(1), fpsOptimizer.currentFps]);
      
      // Calculate and update performance state
      const wasRecovering = performanceState === 'recovering';
      const wasCritical = performanceState === 'critical' || performanceState === 'warning';
      const newState = calculateState(fpsOptimizer.currentFps, newMetrics.errorCount, wasRecovering);
      
      // Transition to recovering if improving from critical/warning
      if (wasCritical && fpsOptimizer.currentFps > previousFpsRef.current + 5 && newState !== 'critical') {
        setPerformanceState('recovering');
        
        // Clear previous timeout
        if (recoveringTimeoutRef.current) {
          clearTimeout(recoveringTimeoutRef.current);
        }
        
        // Exit recovering state after 2 seconds
        recoveringTimeoutRef.current = setTimeout(() => {
          setPerformanceState(calculateState(fpsOptimizer.currentFps, newMetrics.errorCount, false));
        }, 2000);
      } else if (newState !== 'recovering') {
        setPerformanceState(newState);
      }
      
      previousFpsRef.current = fpsOptimizer.currentFps;
    }, 500);
    
    return () => {
      clearInterval(interval);
      if (recoveringTimeoutRef.current) {
        clearTimeout(recoveringTimeoutRef.current);
      }
    };
  }, [show, fpsOptimizer.currentFps, crashTracker.sessionData, calculateState, performanceState]);
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Position classes
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      default: return 'top-4 right-4';
    }
  }, [position]);
  
  if (!show) return null;
  
  const config = STATE_CONFIGS[performanceState];
  const fpsTrend = fpsHistory[fpsHistory.length - 1] > fpsHistory[fpsHistory.length - 6] ? 'up' : 
                   fpsHistory[fpsHistory.length - 1] < fpsHistory[fpsHistory.length - 6] ? 'down' : 'stable';
  
  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  // Compact view
  if (!isExpanded) {
    return (
      <div
        className={`fixed ${positionClasses} z-[10000] cursor-pointer`}
        onClick={() => setIsExpanded(true)}
      >
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-br ${config.bgColor}
          border ${config.borderColor}
          shadow-lg ${config.glowColor}
          backdrop-blur-sm
          transition-all duration-300 hover:scale-105
          ${config.pulse ? 'animate-pulse' : ''}
        `}>
          <div className={config.color}>{config.icon}</div>
          <span className={`font-bold ${config.color}`}>{metrics.fps}</span>
          <span className="text-gray-400 text-xs">FPS</span>
          {metrics.errorCount > 0 && <ErrorBadge count={metrics.errorCount} type="error" />}
        </div>
      </div>
    );
  }
  
  // Full dashboard view
  return (
    <div
      className={`fixed ${positionClasses} z-[10000] pointer-events-auto`}
      style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}
    >
      <div className={`
        w-72 rounded-xl overflow-hidden
        bg-gradient-to-br ${config.bgColor}
        border ${config.borderColor}
        shadow-2xl ${config.glowColor}
        backdrop-blur-md
        transition-all duration-500
        ${config.pulse ? 'animate-pulse' : ''}
      `}>
        {/* Header */}
        <div 
          className={`
            flex items-center justify-between px-4 py-2
            bg-black/40 border-b ${config.borderColor}
            cursor-pointer
          `}
          onClick={() => setIsExpanded(false)}
        >
          <div className="flex items-center gap-2">
            <div className={config.color}>{config.icon}</div>
            <span className={`font-bold ${config.color}`}>Performance</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {metrics.errorCount > 0 && <ErrorBadge count={metrics.errorCount} type="error" />}
            <span className="text-gray-500 text-xs">▼</span>
          </div>
        </div>
        
        {/* Main FPS Display */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <FpsGauge fps={metrics.fps} state={performanceState} />
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {fpsTrend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
              {fpsTrend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              <span className="text-gray-400 text-[10px]">AVG: {metrics.avgFps}</span>
            </div>
            <span className="text-gray-500 text-[10px]">
              {metrics.minFps} - {metrics.maxFps}
            </span>
            <span className={`text-[10px] ${metrics.frameTime > 20 ? 'text-amber-400' : 'text-gray-400'}`}>
              {metrics.frameTime}ms/frame
            </span>
          </div>
        </div>
        
        {/* FPS History Sparkline */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 text-[10px]">FPS HISTORY</span>
            <span className="text-gray-500 text-[10px]">30s</span>
          </div>
          <MiniSparkline 
            data={fpsHistory} 
            height={24}
            color={performanceState === 'optimal' ? '#10b981' : 
                   performanceState === 'good' ? '#3b82f6' : 
                   performanceState === 'warning' ? '#f59e0b' : '#ef4444'}
          />
        </div>
        
        {/* Metrics Grid */}
        <div className="px-4 py-2 grid grid-cols-2 gap-2 border-b border-white/5">
          <MetricCard
            icon={<Cpu className="w-3 h-3" />}
            label="Device"
            value={fpsOptimizer.deviceTier.toUpperCase()}
            color={fpsOptimizer.deviceTier === 'ultra' || fpsOptimizer.deviceTier === 'high' 
              ? 'text-emerald-400' 
              : fpsOptimizer.deviceTier === 'medium' 
              ? 'text-blue-400' 
              : 'text-amber-400'}
          />
          
          <MetricCard
            icon={<Zap className="w-3 h-3" />}
            label="Target"
            value={`${fpsOptimizer.targetFrameRate}fps`}
            color="text-blue-400"
          />
          
          <MetricCard
            icon={<BarChart3 className="w-3 h-3" />}
            label="Shimmer"
            value={fpsOptimizer.shimmerQuality.toUpperCase()}
            color={fpsOptimizer.shimmerQuality === 'high' ? 'text-emerald-400' :
                   fpsOptimizer.shimmerQuality === 'medium' ? 'text-blue-400' :
                   fpsOptimizer.shimmerQuality === 'low' ? 'text-amber-400' : 'text-red-400'}
          />
          
          <MetricCard
            icon={<Gauge className="w-3 h-3" />}
            label="3D"
            value={fpsOptimizer.enable3D ? 'ON' : 'OFF'}
            color={fpsOptimizer.enable3D ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
        
        {/* Session Info */}
        <div className="px-4 py-2 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-2">
            <span>Session: {formatUptime(metrics.sessionUptime)}</span>
          </div>
          <div className="flex items-center gap-2">
            {metrics.droppedFrames > 0 && (
              <span className="text-amber-400">⚠ {metrics.droppedFrames} dropped</span>
            )}
            <span className={isOnline ? 'text-emerald-400' : 'text-red-400'}>
              {isOnline ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>
        
        {/* Error Details (if any) */}
        {metrics.errorCount > 0 && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-3 h-3" />
              <span className="text-[10px] font-bold">
                {metrics.errorCount} error{metrics.errorCount > 1 ? 's' : ''} this session
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PerformanceDashboard);
