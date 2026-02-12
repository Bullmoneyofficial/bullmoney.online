// @ts-nocheck
/**
 * MobilePerformanceProvider
 * 
 * Global context provider for mobile performance optimizations.
 * Wrap your app with this to enable performance features across all components.
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useMobilePerformance, MobilePerformanceProfile, MobileAnimationVariants } from '@/hooks/useMobilePerformance';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface MobilePerformanceContextType extends MobilePerformanceProfile {
  isHydrated: boolean;
  animations: MobileAnimationVariants;
  getPerformanceClass: (mobileClass: string, desktopClass?: string, lowEndClass?: string) => string;
  shouldSkipHeavyEffects: boolean;
  shouldUseSimpleAnimations: boolean;
  getTransitionDuration: (baseDuration?: number) => number;
  shouldDisableBackdropBlur: boolean;
  shouldDisableBoxShadows: boolean;
  shouldDisableTransforms: boolean;
  shouldUseNativeScroll: boolean;
}

// ============================================================================
// DEFAULT CONTEXT VALUE
// ============================================================================

const defaultContextValue: MobilePerformanceContextType = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouch: false,
  isLowEnd: false,
  isHighEnd: true,
  prefersReducedMotion: false,
  isSlowConnection: false,
  connectionType: 'unknown',
  deviceMemory: 8,
  hardwareConcurrency: 4,
  isIOS: false,
  isAndroid: false,
  isSafari: false,
  isInAppBrowser: false,
  performanceTier: 'high',
  isHydrated: false,
  animations: {
    modalBackdrop: { initial: {}, animate: {}, exit: {}, transition: {} },
    modalContent: { initial: {}, animate: {}, exit: {}, transition: {} },
    fadeIn: { initial: {}, animate: {}, transition: {} },
    scaleIn: { initial: {}, animate: {}, transition: {} },
    slideUp: { initial: {}, animate: {}, exit: {}, transition: {} },
    listItem: { initial: {}, animate: {}, transition: {} },
  },
  getPerformanceClass: () => '',
  shouldSkipHeavyEffects: false,
  shouldUseSimpleAnimations: false,
  getTransitionDuration: (d = 0.3) => d,
  shouldDisableBackdropBlur: false,
  shouldDisableBoxShadows: false,
  shouldDisableTransforms: false,
  shouldUseNativeScroll: false,
};

// ============================================================================
// CONTEXT
// ============================================================================

const MobilePerformanceContext = createContext<MobilePerformanceContextType>(defaultContextValue);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface MobilePerformanceProviderProps {
  children: ReactNode;
}

export function MobilePerformanceProvider({ children }: MobilePerformanceProviderProps) {
  const performanceData = useMobilePerformance();
  
  // Apply performance classes to document on mount
  useEffect(() => {
    if (!performanceData.isHydrated) return;
    
    const html = document.documentElement;
    
    // Log performance info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[MobilePerformance] Device profile:', {
        isMobile: performanceData.isMobile,
        performanceTier: performanceData.performanceTier,
        deviceMemory: performanceData.deviceMemory,
        isLowEnd: performanceData.isLowEnd,
        isInAppBrowser: performanceData.isInAppBrowser,
      });
    }
    
    // Add scroll detection for animation pausing
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      html.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        html.classList.remove('is-scrolling');
      }, 150);
    };
    
    if (performanceData.isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [performanceData.isHydrated, performanceData.isMobile, performanceData.performanceTier, performanceData.deviceMemory, performanceData.isLowEnd, performanceData.isInAppBrowser]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => performanceData, [performanceData]);
  
  return (
    <MobilePerformanceContext.Provider value={contextValue}>
      {children}
    </MobilePerformanceContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useMobilePerformanceContext(): MobilePerformanceContextType {
  const context = useContext(MobilePerformanceContext);
  if (!context) {
    // Return default if used outside provider (for backwards compatibility)
    return defaultContextValue;
  }
  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { MobilePerformanceContext };
export type { MobilePerformanceContextType };
