'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import for FluidGlass (heavy 3D component)
const FluidGlass = dynamic(() => import('@/components/FluidGlass'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-linear-to-b from-black via-black/90 to-black animate-pulse" />
  ),
});

interface StoreFluidGlassSectionProps {
  className?: string;
  height?: string;
  scale?: number;
  ior?: number;
  thickness?: number;
  chromaticAberration?: number;
  distortion?: number;
}

export function StoreFluidGlassSection({ 
  className = '',
  height = '100vh',
  scale = 0.12,
  ior = 1.5,
  thickness = 0.5,
  chromaticAberration = 0.5,
  distortion = 0.5,
}: StoreFluidGlassSectionProps) {
  return (
    <Suspense fallback={null}>
      <FluidGlass 
        scale={scale}
        ior={ior}
        thickness={thickness}
        chromaticAberration={chromaticAberration}
        distortion={distortion}
      />
    </Suspense>
  );
}

export default StoreFluidGlassSection;
