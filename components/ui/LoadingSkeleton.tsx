"use client";

/**
 * LoadingSkeleton - Unified Loading Component
 *
 * A comprehensive skeleton loading component that:
 * - Prevents Cumulative Layout Shift (CLS) by reserving space
 * - Uses the unified shimmer system for consistent animations
 * - Adapts to device tier for performance optimization
 * - Provides various presets for common loading scenarios
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <LoadingSkeleton variant="card" />
 *
 * // With custom dimensions
 * <LoadingSkeleton width={300} height={200} />
 *
 * // For Spline scenes
 * <LoadingSkeleton variant="spline" aspectRatio="16/9" />
 * ```
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  ShimmerBorder,
  ShimmerLine,
  ShimmerRadialGlow,
  ShimmerSpinner,
  ShimmerPulse,
} from './UnifiedShimmer';

export type SkeletonVariant =
  | 'default'
  | 'card'
  | 'spline'
  | 'hero'
  | 'text'
  | 'image'
  | 'button'
  | 'avatar'
  | 'modal'
  | 'ticker';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  className?: string;
  showBorder?: boolean;
  showGlow?: boolean;
  showSpinner?: boolean;
  spinnerSize?: number;
  color?: 'blue' | 'white' | 'red';
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
  children?: React.ReactNode;
}

// Preset configurations for different variants
const variantConfigs: Record<SkeletonVariant, Partial<LoadingSkeletonProps>> = {
  default: {
    height: 100,
    showBorder: true,
    showGlow: false,
    showSpinner: true,
    spinnerSize: 32,
  },
  card: {
    height: 200,
    showBorder: true,
    showGlow: true,
    showSpinner: false,
  },
  spline: {
    aspectRatio: '16/9',
    showBorder: true,
    showGlow: true,
    showSpinner: true,
    spinnerSize: 40,
    // CLS FIX: Fixed dimensions for Spline scenes
    height: 800,
  },
  hero: {
    height: '100vh',
    showBorder: false,
    showGlow: true,
    showSpinner: true,
    spinnerSize: 48,
    // CLS FIX: Fixed viewport height
  },
  text: {
    height: 16,
    showBorder: false,
    showGlow: false,
    showSpinner: false,
  },
  image: {
    aspectRatio: '4/3',
    showBorder: true,
    showGlow: false,
    showSpinner: true,
    spinnerSize: 24,
  },
  button: {
    height: 44,
    width: 120,
    showBorder: true,
    showGlow: false,
    showSpinner: false,
  },
  avatar: {
    width: 48,
    height: 48,
    showBorder: true,
    showGlow: false,
    showSpinner: false,
  },
  modal: {
    width: 400,
    height: 300,
    showBorder: true,
    showGlow: true,
    showSpinner: true,
    spinnerSize: 40,
  },
  ticker: {
    height: 80,
    showBorder: true,
    showGlow: false,
    showSpinner: false,
  },
};

function LoadingSkeletonComponent({
  variant = 'default',
  width,
  height,
  aspectRatio,
  className = '',
  showBorder,
  showGlow,
  showSpinner,
  spinnerSize,
  color = 'blue',
  intensity = 'medium',
  animated = true,
  children,
}: LoadingSkeletonProps) {
  // Merge variant config with props
  const config = { ...variantConfigs[variant] };
  const finalWidth = width ?? config.width;
  const finalHeight = height ?? config.height;
  const finalAspectRatio = aspectRatio ?? config.aspectRatio;
  const finalShowBorder = showBorder ?? config.showBorder;
  const finalShowGlow = showGlow ?? config.showGlow;
  const finalShowSpinner = showSpinner ?? config.showSpinner;
  const finalSpinnerSize = spinnerSize ?? config.spinnerSize ?? 32;

  // Build style object
  // CLS FIX: Use contain:strict and exact dimensions to prevent layout shift
  const style: React.CSSProperties = {
    contain: 'strict', // Prevent layout shift
    contentVisibility: 'auto',
  };

  if (finalWidth) {
    style.width = typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth;
    style.minWidth = style.width;
  }
  if (finalHeight) {
    style.height = typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight;
    style.minHeight = style.height;
  }
  if (finalAspectRatio) {
    style.aspectRatio = finalAspectRatio;
  }
  
  // CLS FIX: containIntrinsicSize helps browser reserve space
  if (finalHeight && typeof finalHeight === 'number') {
    style.containIntrinsicSize = `auto ${finalHeight}px`;
  }

  // Base classes
  const baseClasses = cn(
    'relative rounded-xl overflow-hidden bg-black/50',
    'flex items-center justify-center',
    className
  );

  return (
    <div className={baseClasses} style={style} data-skeleton={variant}>
      {/* Shimmer Border */}
      {finalShowBorder && animated && (
        <ShimmerBorder color={color} intensity={intensity} speed="slow" />
      )}

      {/* Inner Container */}
      <div className="relative z-10 w-full h-full bg-black rounded-xl border border-white/20 overflow-hidden flex items-center justify-center">
        {/* Top Shimmer Line */}
        {animated && <ShimmerLine color={color} intensity={intensity} />}

        {/* Radial Glow */}
        {finalShowGlow && <ShimmerRadialGlow color={color} intensity={intensity} />}

        {/* Pulse Background */}
        {animated && <ShimmerPulse color={color} intensity="low" />}

        {/* Spinner */}
        {finalShowSpinner && (
          <ShimmerSpinner size={finalSpinnerSize} color={color} />
        )}

        {/* Children (custom content) */}
        {children}
      </div>
    </div>
  );
}

export const LoadingSkeleton = memo(LoadingSkeletonComponent);

/**
 * SplineSkeleton - Pre-configured for Spline 3D scenes
 * CLS FIX: Uses fixed dimensions to prevent layout shift
 */
export const SplineSkeleton = memo(function SplineSkeleton({
  className = '',
  aspectRatio = '16/9',
  style: customStyle,
}: {
  className?: string;
  aspectRatio?: string;
  style?: React.CSSProperties;
}) {
  // CLS FIX: Merge custom style with default dimensions
  const mergedStyle: React.CSSProperties = {
    minHeight: '300px',
    height: '800px',
    contain: 'strict',
    contentVisibility: 'auto',
    ...customStyle,
  };

  return (
    <LoadingSkeleton
      variant="spline"
      className={cn('spline-skeleton', className)}
      aspectRatio={aspectRatio}
      height={mergedStyle.height}
    >
      <div className="flex flex-col items-center gap-2">
        <ShimmerSpinner size={40} color="blue" />
        <p className="text-xs text-white/60">Loading 3D Scene...</p>
      </div>
    </LoadingSkeleton>
  );
});

/**
 * CardSkeleton - Pre-configured for card loading
 */
export const CardSkeleton = memo(function CardSkeleton({
  className = '',
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  if (count === 1) {
    return <LoadingSkeleton variant="card" className={className} />;
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} variant="card" />
      ))}
    </div>
  );
});

/**
 * TextSkeleton - For loading text content
 */
export const TextSkeleton = memo(function TextSkeleton({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ['100%', '80%', '60%', '90%', '70%'];

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 shimmer-pulse"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
});

/**
 * TickerSkeleton - For market ticker loading
 */
export const TickerSkeleton = memo(function TickerSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <LoadingSkeleton variant="ticker" className={cn('w-full', className)}>
      <div className="flex items-center gap-4 px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 shimmer-pulse" />
            <div className="space-y-1">
              <div className="w-16 h-3 rounded bg-gray-800 shimmer-pulse" />
              <div className="w-12 h-2 rounded bg-gray-800/50 shimmer-pulse" />
            </div>
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
});

/**
 * HeroSkeleton - Full-page hero loading
 */
export const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <LoadingSkeleton variant="hero">
      <div className="flex flex-col items-center gap-4">
        <ShimmerSpinner size={48} color="blue" />
        <div className="text-center">
          <div className="w-48 h-6 rounded bg-gray-800 shimmer-pulse mx-auto mb-2" />
          <div className="w-32 h-4 rounded bg-gray-800/50 shimmer-pulse mx-auto" />
        </div>
      </div>
    </LoadingSkeleton>
  );
});

export default LoadingSkeleton;
