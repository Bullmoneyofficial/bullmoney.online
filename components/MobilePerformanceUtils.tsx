/**
 * Mobile Performance Utilities
 * 
 * Helper components and utilities for mobile performance optimization.
 * Use these to conditionally render expensive components based on device capabilities.
 */

'use client';

import React, { memo, ReactNode } from 'react';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// ============================================================================
// CONDITIONAL RENDERING COMPONENTS
// ============================================================================

interface ConditionalProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * DesktopOnly - Only renders children on desktop devices
 * Use for heavy components that shouldn't load on mobile
 */
export const DesktopOnly = memo(function DesktopOnly({ 
  children, 
  fallback = null 
}: ConditionalProps) {
  const { isDesktop, isHydrated } = useMobilePerformance();
  
  // Show nothing during SSR
  if (!isHydrated) return null;
  
  return isDesktop ? <>{children}</> : <>{fallback}</>;
});

/**
 * MobileOnly - Only renders children on mobile devices
 * Use for mobile-specific UI components
 */
export const MobileOnly = memo(function MobileOnly({ 
  children, 
  fallback = null 
}: ConditionalProps) {
  const { isMobile, isHydrated } = useMobilePerformance();
  
  if (!isHydrated) return null;
  
  return isMobile ? <>{children}</> : <>{fallback}</>;
});

/**
 * HighEndOnly - Only renders children on high-end devices
 * Use for 3D content, complex animations, etc.
 */
export const HighEndOnly = memo(function HighEndOnly({ 
  children, 
  fallback = null 
}: ConditionalProps) {
  const { isHighEnd, isHydrated } = useMobilePerformance();
  
  if (!isHydrated) return null;
  
  return isHighEnd ? <>{children}</> : <>{fallback}</>;
});

/**
 * SkipOnLowEnd - Renders children unless on low-end device
 * Use for nice-to-have features that are expensive
 */
export const SkipOnLowEnd = memo(function SkipOnLowEnd({ 
  children, 
  fallback = null 
}: ConditionalProps) {
  const { shouldSkipHeavyEffects, isHydrated } = useMobilePerformance();
  
  if (!isHydrated) return null;
  
  return !shouldSkipHeavyEffects ? <>{children}</> : <>{fallback}</>;
});

/**
 * SkipOnMobile - Renders children unless on mobile device
 * Use for features that should be desktop-only
 */
export const SkipOnMobile = memo(function SkipOnMobile({ 
  children, 
  fallback = null 
}: ConditionalProps) {
  const { isMobile, isTablet, isHydrated } = useMobilePerformance();
  
  if (!isHydrated) return null;
  
  const isMobileOrTablet = isMobile || isTablet;
  return !isMobileOrTablet ? <>{children}</> : <>{fallback}</>;
});

// ============================================================================
// ANIMATION WRAPPER COMPONENTS
// ============================================================================

interface OptimizedAnimationProps {
  children: ReactNode;
  className?: string;
  /** Animation class to apply on desktop (e.g., 'animate-pulse') */
  desktopAnimation?: string;
  /** Animation class to apply on mobile (e.g., 'animate-none' or simpler animation) */
  mobileAnimation?: string;
}

/**
 * OptimizedAnimation - Applies different animations based on device
 */
export const OptimizedAnimation = memo(function OptimizedAnimation({
  children,
  className = '',
  desktopAnimation = '',
  mobileAnimation = '',
}: OptimizedAnimationProps) {
  const { isMobile, shouldSkipHeavyEffects } = useMobilePerformance();
  
  const animationClass = shouldSkipHeavyEffects 
    ? '' 
    : (isMobile ? mobileAnimation : desktopAnimation);
  
  return (
    <div className={`${className} ${animationClass}`}>
      {children}
    </div>
  );
});

// ============================================================================
// PERFORMANCE-AWARE BACKDROP
// ============================================================================

interface OptimizedBackdropProps {
  children?: ReactNode;
  className?: string;
  /** Whether to show backdrop blur on capable devices */
  blur?: boolean;
  /** Background color/opacity */
  background?: string;
  onClick?: () => void;
}

/**
 * OptimizedBackdrop - A backdrop that automatically disables blur on low-end devices
 */
export const OptimizedBackdrop = memo(function OptimizedBackdrop({
  children,
  className = '',
  blur = true,
  background = 'bg-black/60',
  onClick,
}: OptimizedBackdropProps) {
  const { shouldDisableBackdropBlur } = useMobilePerformance();
  
  const shouldBlur = blur && !shouldDisableBackdropBlur;
  
  return (
    <div 
      className={`
        ${className} 
        ${background} 
        ${shouldBlur ? 'backdrop-blur-md' : ''} 
        mobile-no-blur
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

// ============================================================================
// PERFORMANCE-AWARE SHADOW
// ============================================================================

interface OptimizedShadowProps {
  children: ReactNode;
  className?: string;
  /** Shadow class for desktop (e.g., 'shadow-2xl') */
  shadow?: string;
  /** Shadow class for mobile (e.g., 'shadow-lg' or '') */
  mobileShadow?: string;
}

/**
 * OptimizedShadow - Applies simpler shadows on mobile/low-end devices
 */
export const OptimizedShadow = memo(function OptimizedShadow({
  children,
  className = '',
  shadow = 'shadow-2xl',
  mobileShadow = 'shadow-lg',
}: OptimizedShadowProps) {
  const { isMobile, shouldDisableBoxShadows } = useMobilePerformance();
  
  const shadowClass = shouldDisableBoxShadows 
    ? '' 
    : (isMobile ? mobileShadow : shadow);
  
  return (
    <div className={`${className} ${shadowClass}`}>
      {children}
    </div>
  );
});

// ============================================================================
// EXPORTS - Components are already exported inline
// ============================================================================
