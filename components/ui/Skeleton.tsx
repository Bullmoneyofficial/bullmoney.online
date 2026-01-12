"use client";

import { memo } from 'react';

/**
 * Lightweight skeleton loader for perceived performance
 * Uses CSS animations instead of JS for butter-smooth rendering
 */
export const Skeleton = memo(function Skeleton({ 
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true
}: {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}) {
  const baseClasses = 'bg-neutral-800/50';
  const animationClass = animate ? 'animate-pulse' : '';
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${animationClass} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
});

/**
 * Card skeleton for product/feature cards
 */
export const CardSkeleton = memo(function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-neutral-900/50 rounded-xl p-4 space-y-4 ${className}`}>
      <Skeleton height={200} className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
});

/**
 * Section skeleton for large content areas
 */
export const SectionSkeleton = memo(function SectionSkeleton({ 
  minHeight = '400px',
  className = '' 
}: { 
  minHeight?: string;
  className?: string;
}) {
  return (
    <div 
      className={`w-full bg-neutral-950/30 rounded-xl flex items-center justify-center ${className}`}
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs text-neutral-500">Loading...</span>
      </div>
    </div>
  );
});

/**
 * Hero skeleton for above-the-fold content
 */
export const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <Skeleton variant="circular" width={100} height={100} className="mb-6" />
      <Skeleton variant="text" className="w-64 h-8 mb-4" />
      <Skeleton variant="text" className="w-48 h-4" />
    </div>
  );
});

/**
 * Grid skeleton for product grids
 */
export const GridSkeleton = memo(function GridSkeleton({ 
  count = 6,
  className = '' 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
});
