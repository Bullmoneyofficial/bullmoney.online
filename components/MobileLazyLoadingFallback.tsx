/**
 * Mobile-Optimized Loading Fallback Components
 * Minimal, lightweight loading states for lazy-loaded components
 */

import React from 'react';

// Minimal spinner for mobile
export const MobileLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
  </div>
);

// Skeleton for navigation components
export const NavbarSkeleton: React.FC = () => (
  <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/80 backdrop-blur-sm border-b border-gray-800 animate-pulse">
    <div className="container mx-auto px-4 h-full flex items-center justify-between">
      <div className="h-8 w-24 bg-gray-700 rounded" />
      <div className="flex gap-4">
        <div className="h-8 w-8 bg-gray-700 rounded-full" />
        <div className="h-8 w-8 bg-gray-700 rounded-full" />
      </div>
    </div>
  </div>
);

// Skeleton for footer
export const FooterSkeleton: React.FC = () => (
  <div className="w-full bg-black/90 border-t border-gray-800 py-8 animate-pulse">
    <div className="container mx-auto px-4 space-y-4">
      <div className="h-6 w-32 bg-gray-700 rounded mx-auto" />
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-8 bg-gray-700 rounded-full" />
        ))}
      </div>
    </div>
  </div>
);

// Skeleton for hero sections
export const HeroSkeleton: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-black to-gray-900 animate-pulse">
    <div className="text-center space-y-6 p-8">
      <div className="h-16 w-96 max-w-full bg-gray-700 rounded mx-auto" />
      <div className="h-8 w-64 max-w-full bg-gray-700 rounded mx-auto" />
      <div className="h-12 w-40 bg-gray-700 rounded mx-auto mt-8" />
    </div>
  </div>
);

// Skeleton for feature cards
export const FeaturesSkeleton: React.FC = () => (
  <div className="container mx-auto px-4 py-16 animate-pulse">
    <div className="h-12 w-64 bg-gray-700 rounded mx-auto mb-12" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-6 bg-gray-800 rounded-lg space-y-4">
          <div className="h-12 w-12 bg-gray-700 rounded" />
          <div className="h-6 w-32 bg-gray-700 rounded" />
          <div className="h-4 w-full bg-gray-700 rounded" />
          <div className="h-4 w-3/4 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Generic content skeleton
export const ContentSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-3 p-4 animate-pulse">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-700 rounded" style={{ width: `${100 - i * 10}%` }} />
    ))}
  </div>
);

// Card skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-gray-800 rounded-lg p-6 space-y-4 animate-pulse">
    <div className="h-8 w-3/4 bg-gray-700 rounded" />
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-700 rounded" />
      <div className="h-4 w-5/6 bg-gray-700 rounded" />
      <div className="h-4 w-4/6 bg-gray-700 rounded" />
    </div>
  </div>
);

// Modal skeleton
export const ModalSkeleton: React.FC = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-pulse">
    <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
      <div className="h-8 w-48 bg-gray-700 rounded" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-700 rounded" />
        <div className="h-4 w-5/6 bg-gray-700 rounded" />
        <div className="h-4 w-4/6 bg-gray-700 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-24 bg-gray-700 rounded" />
        <div className="h-10 w-24 bg-gray-700 rounded" />
      </div>
    </div>
  </div>
);

// Page skeleton
export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-black">
    <NavbarSkeleton />
    <div className="pt-16">
      <HeroSkeleton />
      <FeaturesSkeleton />
    </div>
    <FooterSkeleton />
  </div>
);

// Lightweight fallback for quick loads
export const MinimalFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
  </div>
);

// Provider skeleton (for context providers)
export const ProviderSkeleton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="opacity-0 animate-fade-in">
    {children}
  </div>
);
