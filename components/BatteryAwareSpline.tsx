"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSmartScreensaver } from '@/components/SmartScreensaver';

// ============================================================================
// BATTERY AWARE SPLINE WRAPPER
// ============================================================================
// A wrapper component that automatically unmounts/remounts children (like Spline)
// when the screensaver enters/exits battery saving mode.
//
// Usage:
// <BatteryAwareSpline>
//   <SplineWrapper scene="/scene.splinecode" />
// </BatteryAwareSpline>

interface BatteryAwareSplineProps {
  children: React.ReactNode;
  /** Show a placeholder when unmounted (default: gradient) */
  placeholder?: React.ReactNode;
  /** Delay before unmounting to allow fade animation (ms) */
  unmountDelay?: number;
  /** Delay before remounting after screensaver dismissed (ms) */
  remountDelay?: number;
  /** Custom className for the container */
  className?: string;
  /** Whether to show the battery saving indicator */
  showIndicator?: boolean;
}

export function BatteryAwareSpline({
  children,
  placeholder,
  unmountDelay = 500,
  remountDelay = 200,
  className = '',
  showIndicator = false,
}: BatteryAwareSplineProps) {
  const { isScreensaverActive, isScreensaverPermanent, isBatterySaving } = useSmartScreensaver();
  const [shouldRender, setShouldRender] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle unmounting when battery saving becomes active
  useEffect(() => {
    // Clear any pending operations
    if (unmountTimeoutRef.current) {
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }
    if (remountTimeoutRef.current) {
      clearTimeout(remountTimeoutRef.current);
      remountTimeoutRef.current = null;
    }

    if (isBatterySaving && shouldRender) {
      // Start transition
      setIsTransitioning(true);
      
      // Delay unmount to allow fade animation
      unmountTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsTransitioning(false);
        console.log('[BatteryAwareSpline] Unmounted children for battery saving');
      }, unmountDelay);
    } else if (!isScreensaverActive && !shouldRender) {
      // Start transition
      setIsTransitioning(true);
      
      // Delay remount to ensure smooth transition
      remountTimeoutRef.current = setTimeout(() => {
        setShouldRender(true);
        setIsTransitioning(false);
        console.log('[BatteryAwareSpline] Remounted children after screensaver');
      }, remountDelay);
    }

    return () => {
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
      if (remountTimeoutRef.current) clearTimeout(remountTimeoutRef.current);
    };
  }, [isBatterySaving, isScreensaverActive, shouldRender, unmountDelay, remountDelay]);

  // Also listen for global events
  useEffect(() => {
    const handleDispose = () => {
      if (shouldRender) {
        setIsTransitioning(true);
        unmountTimeoutRef.current = setTimeout(() => {
          setShouldRender(false);
          setIsTransitioning(false);
        }, unmountDelay);
      }
    };

    const handleRestore = () => {
      if (!shouldRender) {
        setIsTransitioning(true);
        remountTimeoutRef.current = setTimeout(() => {
          setShouldRender(true);
          setIsTransitioning(false);
        }, remountDelay);
      }
    };

    window.addEventListener('bullmoney-spline-dispose', handleDispose);
    window.addEventListener('bullmoney-spline-restore', handleRestore);

    return () => {
      window.removeEventListener('bullmoney-spline-dispose', handleDispose);
      window.removeEventListener('bullmoney-spline-restore', handleRestore);
    };
  }, [shouldRender, unmountDelay, remountDelay]);

  // Default placeholder
  const defaultPlaceholder = (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-black/30 flex items-center justify-center">
      <div className="text-center text-white/40">
        <div className="text-2xl mb-2">🔋</div>
        <div className="text-xs">Battery Saver Active</div>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Render children only when not in battery saving mode */}
      {shouldRender && children}
      
      {/* Show placeholder when battery saving */}
      {!shouldRender && (placeholder || defaultPlaceholder)}
      
      {/* Optional transition overlay */}
      {isTransitioning && (
        <div 
          className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-300"
          style={{ opacity: isTransitioning ? 1 : 0 }}
        />
      )}
      
      {/* Battery saving indicator */}
      {showIndicator && isBatterySaving && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
          <span>🔋</span>
          <span>Saving</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HOOK: Use for custom implementations
// ============================================================================

interface UseBatteryAwareSplineOptions {
  unmountDelay?: number;
  remountDelay?: number;
}

export function useBatteryAwareSpline(options: UseBatteryAwareSplineOptions = {}) {
  const { unmountDelay = 500, remountDelay = 200 } = options;
  const { isScreensaverActive, isScreensaverPermanent, isBatterySaving } = useSmartScreensaver();
  const [shouldRender, setShouldRender] = useState(true);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (unmountTimeoutRef.current) {
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }
    if (remountTimeoutRef.current) {
      clearTimeout(remountTimeoutRef.current);
      remountTimeoutRef.current = null;
    }

    if (isBatterySaving && shouldRender) {
      unmountTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, unmountDelay);
    } else if (!isScreensaverActive && !shouldRender) {
      remountTimeoutRef.current = setTimeout(() => {
        setShouldRender(true);
      }, remountDelay);
    }

    return () => {
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
      if (remountTimeoutRef.current) clearTimeout(remountTimeoutRef.current);
    };
  }, [isBatterySaving, isScreensaverActive, shouldRender, unmountDelay, remountDelay]);

  return {
    shouldRender,
    isBatterySaving,
    isScreensaverActive,
    isScreensaverPermanent,
  };
}

export default BatteryAwareSpline;
