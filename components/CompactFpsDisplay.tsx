"use client";

/**
 * Compact FPS Display - Aesthetic Blue Glass UI with MT5 Candlestick Chart
 * Shows: FPS Candlestick Chart, Device Tier, Performance status
 * Features: Glassmorphism, glow effects, trading-themed styling
 */

import React from 'react';
import { Activity, TrendingUp, Zap } from 'lucide-react';
import FpsCandlestickChart from './FpsCandlestickChart';

interface CompactFpsDisplayProps {
  fps: number;
  deviceTier: string;
  shimmerQuality: string;
  splineQuality: string;
  enable3D: boolean;
}

const CompactFpsDisplay: React.FC<CompactFpsDisplayProps> = ({
  fps,
  deviceTier,
  shimmerQuality,
  splineQuality,
  enable3D,
}) => {
  const getColorClass = (fpsValue: number) => {
    if (fpsValue >= 58) return 'text-blue-300';
    if (fpsValue >= 50) return 'text-blue-400';
    if (fpsValue >= 40) return 'text-blue-500';
    if (fpsValue >= 30) return 'text-blue-600';
    return 'text-blue-700';
  };

  const getGlowClass = (fpsValue: number) => {
    if (fpsValue >= 58) return 'drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]';
    if (fpsValue >= 50) return 'drop-shadow-[0_0_7px_rgba(59,130,246,0.8)]';
    if (fpsValue >= 40) return 'drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]';
    return 'drop-shadow-[0_0_5px_rgba(59,130,246,0.6)]';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ultra':
        return 'text-blue-200';
      case 'high':
        return 'text-blue-300';
      case 'medium':
        return 'text-blue-400';
      case 'low':
        return 'text-blue-500';
      case 'minimal':
        return 'text-blue-600';
      default:
        return 'text-blue-400';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'ultra':
        return 'drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]';
      case 'high':
        return 'drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]';
      case 'medium':
        return 'drop-shadow-[0_0_5px_rgba(59,130,246,0.7)]';
      case 'low':
        return 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]';
      case 'minimal':
        return 'drop-shadow-[0_0_3px_rgba(59,130,246,0.5)]';
      default:
        return 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
      case 'ultra':
        return 'text-blue-300';
      case 'medium':
        return 'text-blue-400';
      case 'low':
        return 'text-blue-500';
      case 'disabled':
        return 'text-blue-800';
      default:
        return 'text-blue-400';
    }
  };

  const getQualityGlow = (quality: string) => {
    if (quality === 'high' || quality === 'ultra') {
      return 'drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]';
    }
    if (quality === 'medium') {
      return 'drop-shadow-[0_0_3px_rgba(59,130,246,0.7)]';
    }
    return '';
  };

  const performanceStatus = fps >= 58 ? '📈' : fps >= 50 ? '↗️' : fps >= 40 ? '→' : '⚠️';

  return (
    <div className="fps-chart-container relative" data-fps-chart>
      {/* Glass Background - NO BLUR for performance */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-slate-900/40 border border-blue-500/40 shadow-lg shadow-blue-600/20" />

      {/* Content - Horizontal compact layout */}
      <div className="relative px-2 py-1.5 flex items-center gap-2">
        {/* Chart */}
        <div className="flex-shrink-0">
          <FpsCandlestickChart fps={fps} maxFps={120} height={48} width={80} candleCount={8} />
        </div>

        {/* Info - Right side */}
        <div className="flex flex-col gap-0.5 min-w-[40px]">
          {/* FPS Number with glow */}
          <div className="flex items-center gap-1">
            <Activity 
              size={10} 
              className="text-blue-400"
            />
            <span className={`text-sm font-black ${getColorClass(fps)}`}>
              {fps}
            </span>
          </div>

          {/* Device Tier */}
          <div className={`text-[8px] font-mono font-bold uppercase ${getTierColor(deviceTier)} tracking-wide`}>
            {deviceTier}
          </div>

          {/* Quality Indicators */}
          <div className="flex items-center gap-1">
            <span className={`text-[8px] font-bold ${getQualityColor(shimmerQuality)}`}>
              ✦{shimmerQuality.charAt(0).toUpperCase()}
            </span>
            {enable3D ? (
              <TrendingUp size={8} className="text-blue-400" />
            ) : (
              <Zap size={8} className="text-blue-700 opacity-50" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactFpsDisplay;
