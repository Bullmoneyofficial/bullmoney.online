"use client";

/**
 * Universal Scene Loader - Works on ALL Devices
 *
 * Progressive enhancement strategy:
 * - High-end: Full 3D Spline with ultra quality
 * - Medium: 3D Spline with adaptive quality OR video fallback
 * - Low-end: Static images with parallax
 * - Minimal: Text-based accessible content
 *
 * Features:
 * - Zero crashes (comprehensive error handling)
 * - Smooth on ALL devices (adaptive quality)
 * - Accessible (ARIA labels, keyboard nav)
 * - Progressive (upgrades when possible)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { UltraSplineLoader } from './UltraSplineLoader';
import {
  enhancementManager,
  accessibilityManager,
  type FallbackContent
} from '@/lib/universalFallback';

// ============================================================================
// TYPES
// ============================================================================

interface UniversalSceneLoaderProps {
  scene: string;
  label?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
  enableInteraction?: boolean;
  onLoad?: () => void;
}

// ============================================================================
// FALLBACK COMPONENTS
// ============================================================================

/**
 * Video Fallback - For medium-tier devices
 */
function VideoFallback({ src, poster, alt, onLoad }: {
  src: string;
  poster?: string;
  alt: string;
  onLoad?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        onLoadedData={onLoad}
        aria-label={alt}
      />

      {/* Controls overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-6 left-6 flex gap-3">
          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-all"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-all"
            aria-label="Fullscreen"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Performance badge */}
      <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold">
        ⚡ Optimized Mode
      </div>
    </div>
  );
}

/**
 * Image Fallback - For low-end devices
 */
function ImageFallback({ src, alt, onLoad }: {
  src: string;
  alt: string;
  onLoad?: () => void;
}) {
  const [parallaxY, setParallaxY] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setParallaxY(scrollPercent * 50 - 25); // -25 to +25
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={imageRef} className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-75"
        style={{
          backgroundImage: `url(${src})`,
          transform: `translateY(${parallaxY}px) scale(1.1)`
        }}
        role="img"
        aria-label={alt}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/50" />

      {/* Data saver badge */}
      <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold">
        📸 Lite Mode
      </div>

      {/* Hidden img for loading event */}
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        className="hidden"
      />
    </div>
  );
}

/**
 * Minimal Fallback - For very limited devices
 */
function MinimalFallback({ alt, description }: {
  alt: string;
  description: string;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-linear-to-br from-blue-950/30 via-black to-purple-950/30">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(30deg, rgba(255, 255, 255, 0.5) 12%, transparent 12.5%, transparent 87%, rgba(255, 255, 255, 0.5) 87.5%, rgba(255, 255, 255, 0.5)),
            linear-gradient(150deg, rgba(255, 255, 255, 0.5) 12%, transparent 12.5%, transparent 87%, rgba(255, 255, 255, 0.5) 87.5%, rgba(255, 255, 255, 0.5))
          `,
          backgroundSize: '80px 140px'
        }}
      />

      <div className="relative z-10 text-center space-y-4 px-6 max-w-2xl">
        <div className="inline-block p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-white mb-3">
            {alt}
          </h2>
          <p className="text-lg text-white/70 leading-relaxed">
            {description}
          </p>

          {/* Accessibility badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold">
            ♿ Accessible Mode
          </div>
        </div>

        {/* Benefits of minimal mode */}
        <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-white font-bold">0 Data</div>
            <div className="text-white/50 text-xs">Ultra-lite</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-white font-bold">Fast</div>
            <div className="text-white/50 text-xs">Instant load</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UniversalSceneLoader({
  scene,
  label,
  priority = 'medium',
  className = '',
  enableInteraction = true,
  onLoad
}: UniversalSceneLoaderProps) {
  const [content, setContent] = useState<FallbackContent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);

  // Detect capabilities and get appropriate content
  useEffect(() => {
    const init = async () => {
      const caps = enhancementManager.getCapabilities();
      setCapabilities(caps);

      const fallbackContent = enhancementManager.getContent(scene);
      setContent(fallbackContent);

      console.log('[UniversalSceneLoader] Content type:', fallbackContent.type);
    };

    init();
  }, [scene]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();

    // Announce to screen readers
    accessibilityManager.announce(`${label || 'Scene'} loaded`);
  };

  if (!content) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black ${className}`}>
        <div className="text-white/50 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  // Render appropriate content type
  return (
    <div
      className={`relative w-full h-full ${className}`}
      {...accessibilityManager.getAriaLabels(content)}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-linear-to-br from-blue-950/20 via-black to-purple-950/20 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/50 text-sm font-mono">
              Loading {content.type}...
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {content.type === 'spline' && (
          <UltraSplineLoader
            scene={scene}
            priority={priority}
            enableInteraction={enableInteraction}
            adaptiveQuality={true}
            enableGestures={true}
            onLoad={handleLoad}
            className="w-full h-full"
          />
        )}

        {content.type === 'video' && content.src && (
          <VideoFallback
            src={content.src}
            poster={content.poster}
            alt={content.alt}
            onLoad={handleLoad}
          />
        )}

        {content.type === 'image' && content.src && (
          <ImageFallback
            src={content.src}
            alt={content.alt}
            onLoad={handleLoad}
          />
        )}

        {content.type === 'minimal' && (
          <MinimalFallback
            alt={content.alt}
            description={content.description}
          />
        )}
      </div>

      {/* Label overlay */}
      {label && isLoaded && (
        <div className="absolute bottom-8 left-8 z-20 pointer-events-none max-w-[80%]">
          <h2
            className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-white/10 tracking-tighter select-none drop-shadow-2xl"
            style={{
              textShadow: '0 0 40px rgba(0,0,0,0.5)'
            }}
          >
            {label}
          </h2>
        </div>
      )}

      {/* Device info (debug) */}
      {process.env.NODE_ENV === 'development' && capabilities && (
        <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-mono text-white/80 space-y-1">
          <div>Type: {content.type}</div>
          <div>Tier: {capabilities.tier}</div>
          <div>3D: {capabilities.supports3D ? '✅' : '❌'}</div>
          <div>WebGL2: {capabilities.supportsWebGL2 ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
}

export default UniversalSceneLoader;
