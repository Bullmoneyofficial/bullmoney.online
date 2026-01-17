"use client";

/**
 * Performance Status Indicator - Minimal Floating Badge
 * 
 * A tiny, beautiful status indicator that shows:
 * - Current FPS with color-coded state
 * - Animated pulse for critical states
 * - Expandable on click for more details
 * - Crash/error count badge
 * 
 * Perfect for production use - unobtrusive but informative
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Activity, AlertTriangle, CheckCircle, Zap, WifiOff, XCircle } from 'lucide-react';
import { useFpsOptimizer } from '@/lib/FpsOptimizer';
import { useCrashTracker } from '@/lib/CrashTracker';

type StatusLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'offline';

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  glow: string;
  icon: React.ReactNode;
  animate: string;
}

const STATUS_CONFIGS: Record<StatusLevel, StatusConfig> = {
  excellent: {
    bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    animate: '',
  },
  good: {
    bg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
    icon: <Activity className="w-3.5 h-3.5" />,
    animate: '',
  },
  fair: {
    bg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    icon: <Zap className="w-3.5 h-3.5" />,
    animate: '',
  },
  poor: {
    bg: 'bg-gradient-to-r from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    animate: 'animate-[pulse_2s_ease-in-out_infinite]',
  },
  critical: {
    bg: 'bg-gradient-to-r from-red-500/25 to-red-600/15',
    border: 'border-red-500/60',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    icon: <XCircle className="w-3.5 h-3.5" />,
    animate: 'animate-[pulse_1s_ease-in-out_infinite]',
  },
  offline: {
    bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/10',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    glow: '',
    icon: <WifiOff className="w-3.5 h-3.5" />,
    animate: '',
  },
};

interface PerformanceStatusProps {
  show?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showFps?: boolean;
  showErrors?: boolean;
  onClick?: () => void;
}

const PerformanceStatus: React.FC<PerformanceStatusProps> = ({
  show = true,
  position = 'top-right',
  showFps = true,
  showErrors = true,
  onClick,
}) => {
  const { currentFps, deviceTier, shimmerQuality, enable3D } = useFpsOptimizer();
  const { sessionData } = useCrashTracker();
  
  const [isOnline, setIsOnline] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  // Determine status level
  const getStatusLevel = useCallback((): StatusLevel => {
    if (!isOnline) return 'offline';
    
    const errorCount = sessionData?.errorCount || 0;
    if (errorCount > 5 || currentFps < 20) return 'critical';
    if (errorCount > 2 || currentFps < 30) return 'poor';
    if (currentFps < 45) return 'fair';
    if (currentFps < 55) return 'good';
    return 'excellent';
  }, [isOnline, currentFps, sessionData?.errorCount]);
  
  const statusLevel = getStatusLevel();
  const config = STATUS_CONFIGS[statusLevel];
  const errorCount = sessionData?.errorCount || 0;
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }[position];
  
  if (!show) return null;
  
  return (
    <div 
      className={`fixed ${positionClasses} z-[10000]`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-full
          ${config.bg} ${config.border} border
          ${config.glow}
          ${config.animate}
          backdrop-blur-sm
          transition-all duration-300 ease-out
          hover:scale-105 active:scale-95
          cursor-pointer
          ${isHovered ? 'pr-4' : ''}
        `}
        style={{ fontFamily: 'ui-monospace, monospace' }}
      >
        {/* Status Icon */}
        <span className={`${config.text} transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}>
          {config.icon}
        </span>
        
        {/* FPS Display */}
        {showFps && (
          <span className={`font-bold text-sm ${config.text}`}>
            {currentFps}
          </span>
        )}
        
        {/* Expanded info on hover */}
        <div className={`
          flex items-center gap-2 overflow-hidden transition-all duration-300
          ${isHovered ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'}
        `}>
          <span className="text-gray-400 text-[10px] whitespace-nowrap">
            {deviceTier.toUpperCase()}
          </span>
          <span className={`text-[10px] ${enable3D ? 'text-emerald-400' : 'text-gray-500'}`}>
            {enable3D ? '3D' : '2D'}
          </span>
        </div>
        
        {/* Error Badge */}
        {showErrors && errorCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold animate-bounce">
            {errorCount > 9 ? '9+' : errorCount}
          </span>
        )}
        
        {/* Ripple effect on critical */}
        {statusLevel === 'critical' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-red-500/10 animate-ping animation-delay-500" />
          </>
        )}
      </button>
    </div>
  );
};

export default memo(PerformanceStatus);
