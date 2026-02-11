"use client";

/**
 * EXAMPLE: Smart Spline Component with Crash Shield Integration
 * 
 * This example shows how to integrate the Mobile Crash Shield with Spline components
 * to prevent crashes on mobile devices while maintaining full desktop experience.
 */

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useMobileCrashShield } from '@/hooks/useMobileCrashShield';

// Dynamically import the heavy Spline component
const SplineWrapper = dynamic(() => import('@/lib/spline-wrapper'), {
  ssr: false,
  loading: () => <SplineSkeleton />
});

// Lightweight loading skeleton
function SplineSkeleton() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-white/40 text-sm">Loading 3D Scene...</div>
    </div>
  );
}

interface SmartSplineProps {
  /** Spline scene URL */
  scene: string;
  /** Loading priority */
  priority?: 'high' | 'normal' | 'low';
  /** Skip on low-memory devices */
  skipOnLowMemory?: boolean;
  /** Fallback image for low-memory mode */
  fallbackImage?: string;
  /** Class name */
  className?: string;
  /** Callback when scene loads */
  onLoad?: () => void;
}

export function SmartSplineComponent({
  scene,
  priority = 'normal',
  skipOnLowMemory = false,
  fallbackImage,
  className = '',
  onLoad
}: SmartSplineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  
  // Get crash shield state
  const {
    shouldLoad,
    shouldSkipHeavy,
    shouldReduceQuality,
    memoryPressure,
    queueSplineLoad,
    deferLoad
  } = useMobileCrashShield({
    componentId: `spline-${scene}`,
    priority,
    skipOnLowMemory,
    viewportMargin: '400px'
  });

  // Queue Spline load to prevent simultaneous WebGL context creation
  useEffect(() => {
    if (!shouldLoad) return;
    if (isSceneLoaded) return;
    
    // Queue the load with crash shield
    queueSplineLoad(scene, () => {
      setIsSceneLoaded(true);
      onLoad?.();
    });
  }, [shouldLoad, scene, queueSplineLoad, isSceneLoaded, onLoad]);

  // Determine quality based on memory pressure
  const quality = shouldReduceQuality ? 'low' : 'high';
  const targetFPS = shouldReduceQuality ? 30 : 60;
  
  // Critical memory - show fallback image instead
  if (memoryPressure === 'critical' && fallbackImage) {
    return (
      <div className={`${className} relative overflow-hidden`} ref={containerRef}>
        <img 
          src={fallbackImage} 
          alt="3D Scene Preview" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Don't load until ready
  if (!shouldLoad || !isSceneLoaded) {
    return (
      <div className={className} ref={containerRef}>
        <SplineSkeleton />
      </div>
    );
  }

  // Skip heavy render effects on memory pressure
  if (shouldSkipHeavy) {
    return (
      <div className={`${className} relative`} ref={containerRef}>
        {fallbackImage ? (
          <img 
            src={fallbackImage} 
            alt="3D Scene Preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-black rounded-lg flex items-center justify-center">
            <div className="text-white/60 text-sm">
              3D scene paused to save memory
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render full Spline component with quality adjustments
  return (
    <div className={className} ref={containerRef}>
      <SplineWrapper
        scene={scene}
        targetFPS={targetFPS}
        maxDpr={shouldReduceQuality ? 1 : 2}
        minDpr={0.5}
        priority={priority === 'high'}
        isHero={priority === 'high'}
        onLoad={onLoad}
      />
      
      {/* Optional: Show quality indicator in dev */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white/60">
          {quality} quality @ {targetFPS}fps
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE: Multi-Spline Page
// ============================================================================

export function MultiSplineExample() {
  return (
    <div className="space-y-8">
      {/* Hero Spline - High priority, loads first */}
      <section className="h-screen">
        <SmartSplineComponent
          scene="/scene1.splinecode"
          priority="high"
          fallbackImage="/hero-fallback.jpg"
          className="w-full h-full"
        />
      </section>

      {/* Feature Spline - Normal priority, queued after hero */}
      <section className="h-96">
        <SmartSplineComponent
          scene="/scene2.splinecode"
          priority="normal"
          fallbackImage="/feature-fallback.jpg"
          className="w-full h-full"
        />
      </section>

      {/* Footer Spline - Low priority, loads last */}
      <section className="h-64">
        <SmartSplineComponent
          scene="/scene3.splinecode"
          priority="low"
          skipOnLowMemory={true}
          fallbackImage="/footer-fallback.jpg"
          className="w-full h-full"
        />
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE: Store Product with 3D Preview
// ============================================================================

export function ProductWith3DPreview({ product }: { product: any }) {
  const { shouldSkipHeavy } = useMobileCrashShield({
    componentId: `product-${product.id}`,
    priority: 'normal',
    skipOnLowMemory: true
  });

  if (shouldSkipHeavy) {
    // Show static images on low memory
    return (
      <div className="relative aspect-square">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    );
  }

  // Show 3D model when memory allows
  return (
    <SmartSplineComponent
      scene={product.splineScene}
      priority="normal"
      fallbackImage={product.image}
      className="relative aspect-square"
    />
  );
}

// ============================================================================
// EXAMPLE: Conditional Heavy Animation
// ============================================================================

import { useSkipHeavyEffects } from '@/hooks/useMobileCrashShield';

export function ConditionalParticles() {
  const shouldSkip = useSkipHeavyEffects();

  if (shouldSkip) {
    // No particles on low memory
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Expensive particle system */}
      <ParticleCanvas count={500} />
    </div>
  );
}

// ============================================================================
// EXAMPLE: Memory-Aware Video
// ============================================================================

export function SmartVideoBackground({ src }: { src: string }) {
  const { shouldReduceQuality, memoryPressure } = useMobileCrashShield({
    componentId: 'video-bg',
    priority: 'low'
  });

  // Pause video on critical memory pressure
  const shouldPause = memoryPressure === 'critical';

  return (
    <video
      src={src}
      autoPlay={!shouldPause}
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        // Reduce quality on memory pressure
        filter: shouldReduceQuality ? 'blur(2px)' : 'none',
        opacity: shouldReduceQuality ? 0.6 : 1
      }}
    />
  );
}

// Dummy ParticleCanvas for example
function ParticleCanvas({ count }: { count: number }) {
  return <div>Particles: {count}</div>;
}
