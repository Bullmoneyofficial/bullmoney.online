'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import for FluidGlass (heavy 3D component)
const FluidGlass = dynamic(() => import('@/components/FluidGlass'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-linear-to-b from-black/50 to-transparent" />
  ),
});

interface StoreHeroFluidGlassProps {
  className?: string;
  scale?: number;
  ior?: number;
  thickness?: number;
  chromaticAberration?: number;
  distortion?: number;
}

export function StoreHeroFluidGlass({ 
  className = '',
  scale = 0.12,
  ior = 1.5,
  thickness = 0.5,
  chromaticAberration = 0.5,
  distortion = 0.5,
}: StoreHeroFluidGlassProps) {
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

export default StoreHeroFluidGlass;
