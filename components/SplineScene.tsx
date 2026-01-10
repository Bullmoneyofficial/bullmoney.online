"use client";

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { useSplineCache } from '@/hooks/useSplineCache';
// 1. Import Sparkles
import Sparkle from 'react-sparkle';

interface SplineWrapperProps {
  scene: string;
  className?: string;
  placeholder?: string | null; 
  onLoad?: () => void;
  onError?: (error: Error) => void;
  // Optional: Allow parent to toggle sparkles off/on
  withSparkles?: boolean; 
}

// Dynamic import for the heavy Spline runtime
const Spline = dynamic<SplineWrapperProps>(() => import('@/lib/spline-wrapper') as any, { 
  ssr: false,
  loading: () => null 
});

export default function SplineScene({ 
  scene, 
  className = "", 
  onLoad, 
  onError,
  placeholder,
  withSparkles = true // Default to true
}: SplineWrapperProps) {
  
  const { sceneUrl, isLoading: isCacheLoading } = useSplineCache(scene);
  const [isInteractive, setIsInteractive] = useState(false);

  // If caching is still working, show placeholder
  if (isCacheLoading || !sceneUrl) {
    return <div className="w-full h-full bg-neutral-900/5 animate-pulse" />;
  }

  return (
    <div className={`w-full h-full relative group ${className}`}>
      
      {/* 2. Sparkles Layer (Z-Index 5) */}
      {/* Positioned absolutely to cover the container, but pointer-events-none so clicks pass through */}
      {withSparkles && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-xl">
           <Sparkle 
             color="#fff" 
             count={30} 
             minSize={2} 
             maxSize={5} 
             overflowPx={0} 
             fadeOutSpeed={20} 
             flicker={false} 
           />
        </div>
      )}

      {/* 3. The 3D Scene Layer */}
      <div 
        className={`w-full h-full transition-opacity duration-500 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <Suspense fallback={<div className="w-full h-full bg-neutral-900/5" />}>
          <Spline 
            scene={sceneUrl} 
            onLoad={onLoad} 
            onError={onError} 
            placeholder={placeholder}
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* 4. Interaction Toggle Overlay */}
      {!isInteractive && (
        <button
          onClick={() => setIsInteractive(true)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Interact with 3D Scene"
        >
          <div className="bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 shadow-lg border border-white/10">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
             <span className="text-sm font-medium">Click to Interact</span>
          </div>
        </button>
      )}

      {/* 5. Exit Interaction Button */}
      {isInteractive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsInteractive(false);
          }}
          className="absolute top-4 right-4 z-50 bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      )}
    </div>
  );
}