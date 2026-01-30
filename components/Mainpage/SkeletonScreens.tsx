/**
 * Skeleton Screens for Instant Loading Feel
 * Shows immediately while content loads in background
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Animated shimmer effect
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .skeleton-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.02) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.02) 100%
    );
    background-size: 1000px 100%;
  }

  .skeleton-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.6; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'skeleton-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerStyles;
    document.head.appendChild(style);
  }
}

// Base skeleton element
const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`bg-white/5 rounded skeleton-shimmer ${className}`} />
);

// Hero section skeleton
export const HeroSkeleton = () => (
  <div className="w-full h-screen relative bg-black overflow-hidden">
    {/* Background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20" />

    {/* Content skeleton */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
      {/* Logo skeleton */}
      <Skeleton className="w-24 h-24 rounded-full" />

      {/* Title skeleton */}
      <div className="space-y-3 w-full max-w-2xl">
        <Skeleton className="h-12 md:h-16 w-3/4 mx-auto" />
        <Skeleton className="h-12 md:h-16 w-full" />
      </div>

      {/* Subtitle skeleton */}
      <div className="space-y-2 w-full max-w-xl">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
      </div>

      {/* CTA button skeleton */}
      <Skeleton className="h-14 w-48 rounded-full mt-4" />
    </div>

    {/* Floating elements */}
    <div className="absolute top-20 left-10">
      <Skeleton className="w-16 h-16 rounded-lg skeleton-pulse" />
    </div>
    <div className="absolute bottom-20 right-10">
      <Skeleton className="w-20 h-20 rounded-lg skeleton-pulse animation-delay-500" />
    </div>
  </div>
);

// Spline scene skeleton
export const SplineSkeleton = ({ label }: { label?: string }) => (
  <div className="w-full h-full relative bg-gradient-to-br from-neutral-950 via-black to-neutral-900 overflow-hidden">
    {/* Grid pattern */}
    <div className="absolute inset-0 opacity-5">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>

    {/* Loading indicator */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-white/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
      {label && (
        <div className="text-sm text-white/60 font-mono">
          Loading {label}...
        </div>
      )}
    </div>

    {/* Decorative elements */}
    <div className="absolute top-1/4 left-1/4">
      <Skeleton className="w-12 h-12 rounded-full skeleton-pulse" />
    </div>
    <div className="absolute bottom-1/3 right-1/4">
      <Skeleton className="w-16 h-16 rounded-full skeleton-pulse animation-delay-700" />
    </div>
  </div>
);

// Card skeleton
export const CardSkeleton = ({ count = 1 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-white/10 overflow-hidden bg-black/40 p-6">
        <Skeleton className="w-full h-48 mb-4 rounded-lg" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Navbar skeleton
export const NavbarSkeleton = () => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <Skeleton className="h-10 w-32" />
      <div className="hidden md:flex gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
  </div>
);

// Text skeleton
export const TextSkeleton = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

// Loading progress bar
export const LoadingProgress = ({ progress }: { progress: number }) => (
  <div className="w-full max-w-md mx-auto">
    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-white transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 bg-white/30 blur-lg"
        style={{ width: `${progress}%` }}
      />
    </div>
    <div className="text-center text-sm text-white/60 mt-2 font-mono">
      {progress}%
    </div>
  </div>
);

// Full page skeleton (app shell)
export const AppShellSkeleton = () => (
  <div className="min-h-screen bg-black">
    <NavbarSkeleton />
    <div className="pt-20">
      <HeroSkeleton />
    </div>
  </div>
);

export default Skeleton;
