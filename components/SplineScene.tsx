"use client";

import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@/lib/spline-wrapper'), { ssr: false });

interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function SplineScene({ scene, className = "", onLoad, onError }: SplineSceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Spline scene={scene} onLoad={onLoad} onError={onError} />
    </div>
  );
}
