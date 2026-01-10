"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// FIX: Define props to match the wrapper exactly
interface SplineWrapperProps {
  scene: string;
  className?: string;
  placeholder?: string | null; 
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// FIX: Cast the import to the Props interface
const Spline = dynamic<SplineWrapperProps>(() => import('@/lib/spline-wrapper') as any, { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-neutral-900/5" /> 
});

export default function SplineScene({ 
  scene, 
  className = "", 
  onLoad, 
  onError,
  placeholder 
}: SplineWrapperProps) {
  return (
    <div className={`w-full h-full relative ${className}`}>
      <Suspense fallback={<div className="w-full h-full bg-neutral-900/5 animate-pulse" />}>
        <Spline 
          scene={scene} 
          onLoad={onLoad} 
          onError={onError} 
          placeholder={placeholder}
          className="w-full h-full"
        />
      </Suspense>
    </div>
  );
}