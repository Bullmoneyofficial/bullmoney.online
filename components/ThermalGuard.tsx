"use client";

/**
 * ThermalGuard.tsx - Lightweight thermal monitoring wrapper
 * 
 * Drop-in component to enable thermal monitoring for specific pages.
 * Particularly useful for heavy pages like games, 3D scenes, etc.
 * 
 * Usage:
 * <ThermalGuard>
 *   <YourHeavyComponent />
 * </ThermalGuard>
 */

import React, { useEffect, useRef, type ReactNode } from 'react';
import useThermalOptimization, { getGlobalThermalState } from '@/hooks/useThermalOptimization';

interface ThermalGuardProps {
  children: ReactNode;
  /** Show visual indicator of thermal state (dev only by default) */
  showIndicator?: boolean;
  /** Callback when thermal level changes */
  onThermalChange?: (level: 'cool' | 'warm' | 'hot' | 'critical') => void;
}

export function ThermalGuard({ 
  children, 
  showIndicator = process.env.NODE_ENV === 'development',
  onThermalChange,
}: ThermalGuardProps) {
  const thermal = useThermalOptimization();
  const prevLevel = useRef(thermal.thermalLevel);

  // Notify on thermal level change
  useEffect(() => {
    if (prevLevel.current !== thermal.thermalLevel) {
      prevLevel.current = thermal.thermalLevel;
      onThermalChange?.(thermal.thermalLevel);
    }
  }, [thermal.thermalLevel, onThermalChange]);

  return (
    <>
      {children}
      
      {/* Thermal indicator overlay */}
      {showIndicator && (
        <ThermalIndicator 
          level={thermal.thermalLevel}
          fps={thermal.currentFps}
          avgFps={thermal.averageFps}
          isOnBattery={thermal.isOnBattery}
          powerSaverActive={thermal.powerSaverActive}
          onTogglePowerSaver={thermal.togglePowerSaver}
        />
      )}
    </>
  );
}

// ============================================================================
// THERMAL INDICATOR (dev overlay)
// ============================================================================

interface ThermalIndicatorProps {
  level: 'cool' | 'warm' | 'hot' | 'critical';
  fps: number;
  avgFps: number;
  isOnBattery: boolean;
  powerSaverActive: boolean;
  onTogglePowerSaver: () => void;
}

function ThermalIndicator({
  level,
  fps,
  avgFps,
  isOnBattery,
  powerSaverActive,
  onTogglePowerSaver,
}: ThermalIndicatorProps) {
  const colors = {
    cool: 'bg-green-500',
    warm: 'bg-yellow-500',
    hot: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const icons = {
    cool: '❄️',
    warm: '🌡️',
    hot: '🔥',
    critical: '🚨',
  };

  return (
    <div 
      className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-lg bg-black/80 text-white text-xs font-mono"
      style={{ backdropFilter: 'none' }} // No blur for performance
    >
      {/* Thermal level indicator */}
      <div className={`w-2 h-2 rounded-full ${colors[level]}`} />
      <span>{icons[level]} {level.toUpperCase()}</span>
      
      {/* FPS display */}
      <span className="text-white/60">|</span>
      <span className={avgFps < 30 ? 'text-red-400' : avgFps < 50 ? 'text-yellow-400' : 'text-green-400'}>
        {fps} FPS (avg: {avgFps})
      </span>
      
      {/* Battery indicator */}
      {isOnBattery && (
        <>
          <span className="text-white/60">|</span>
          <span className="text-yellow-400">🔋</span>
        </>
      )}
      
      {/* Power saver toggle */}
      <span className="text-white/60">|</span>
      <button
        onClick={onTogglePowerSaver}
        className={`px-2 py-0.5 rounded ${powerSaverActive ? 'bg-green-600' : 'bg-gray-600'}`}
      >
        {powerSaverActive ? '⚡ Saver ON' : '💡 Saver OFF'}
      </button>
    </div>
  );
}

// ============================================================================
// USETHERMALAWARERENDER - Hook for components to check if they should render
// ============================================================================

/**
 * Hook for components to check thermal state and decide whether to render
 */
export function useThermalAwareRender() {
  const thermal = useThermalOptimization();
  
  return {
    /** Whether heavy components should render at all */
    shouldRenderHeavy: thermal.thermalLevel !== 'critical' && thermal.config.enableSpline,
    /** Whether CSS animations should run */
    shouldAnimate: thermal.config.enableCssAnimations,
    /** Whether hover effects should be enabled */
    shouldHover: thermal.config.enableHoverEffects,
    /** Recommended FPS target */
    targetFps: thermal.config.targetFps,
    /** Recommended DPR cap */
    maxDpr: thermal.config.maxDpr,
    /** Quality level for adaptive components */
    qualityLevel: thermal.config.qualityLevel,
    /** Current thermal level */
    thermalLevel: thermal.thermalLevel,
    /** Whether page is visible */
    isPageVisible: thermal.isPageVisible,
  };
}

// ============================================================================
// WITHTERMALPAUSE - HOC to pause component when thermal is critical
// ============================================================================

interface WithThermalPauseOptions {
  /** Placeholder to show when paused */
  fallback?: ReactNode;
  /** Pause at this thermal level or worse */
  pauseAt?: 'warm' | 'hot' | 'critical';
}

export function withThermalPause<P extends object>(
  Component: React.ComponentType<P>,
  options: WithThermalPauseOptions = {}
) {
  const { fallback = null, pauseAt = 'critical' } = options;
  
  return function ThermalPausedComponent(props: P) {
    const { thermalLevel, isPageVisible } = useThermalAwareRender();
    
    const pauseLevels: Record<typeof pauseAt, string[]> = {
      warm: ['warm', 'hot', 'critical'],
      hot: ['hot', 'critical'],
      critical: ['critical'],
    };
    
    const shouldPause = !isPageVisible || pauseLevels[pauseAt].includes(thermalLevel);
    
    if (shouldPause) {
      return <>{fallback}</>;
    }
    
    return <Component {...props} />;
  };
}

export default ThermalGuard;
