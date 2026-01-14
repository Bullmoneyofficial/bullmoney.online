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
    <div className="relative">
      {/* Glass Background with bullmoney blue gradient */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600/25 via-blue-500/10 to-slate-900/30 backdrop-blur-xl border border-blue-500/40 shadow-lg shadow-blue-600/20" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
        <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse" />
      </div>

      {/* Content - Vertical Layout */}
      <div className="relative px-1.5 py-1.5 flex flex-col gap-1.5">
        {/* Chart - Top */}
        <div className="flex-shrink-0 flex justify-center">
          <FpsCandlestickChart fps={fps} maxFps={120} height={64} width={110} candleCount={10} />
        </div>

        {/* Info - Bottom */}
        <div className="flex flex-col gap-0.5 px-1">
          {/* FPS Number with glow */}
          <div className="flex items-center gap-1 justify-center">
            <Activity 
              size={12} 
              className={`text-blue-500 animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]`}
            />
            <span className={`text-xs font-black drop-shadow-lg ${getColorClass(fps)} ${getGlowClass(fps)}`}>
              {fps}
            </span>
            <span className="text-[6px] text-blue-400/90 font-bold uppercase tracking-wider drop-shadow-[0_0_3px_rgba(59,130,246,0.5)]">
              FPS
            </span>
          </div>

          {/* Device Tier Badge with glow */}
          <div className={`text-[6px] font-mono font-bold uppercase text-center ${getTierColor(deviceTier)} ${getTierGlow(deviceTier)} tracking-wider`}>
            {deviceTier === 'ultra' && '◆'} {deviceTier}
          </div>

          {/* Quality Indicators - Trading theme */}
          <div className="flex items-center justify-center gap-0.5">
            {/* Shimmer Quality */}
            <span className={`text-[6px] font-bold ${getQualityColor(shimmerQuality)} ${getQualityGlow(shimmerQuality)}`}>
              ✦
            </span>
            
            {/* 3D/Spline Quality */}
            <span className={`text-[6px] font-bold ${getQualityColor(splineQuality)} ${getQualityGlow(splineQuality)}`}>
              ◆
            </span>
            
            {/* 3D Status with trading icon */}
            {enable3D ? (
              <TrendingUp size={8} className="text-blue-500 drop-shadow-[0_0_3px_rgba(59,130,246,0.8)]" />
            ) : (
              <Zap size={7} className="text-blue-800 opacity-40" />
            )}

            {/* Performance Status */}
            <span className="text-[7px] ml-0.5">{performanceStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactFpsDisplay;
