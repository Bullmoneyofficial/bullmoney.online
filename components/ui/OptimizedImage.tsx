"use client";

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

// ============================================================================
// OPTIMIZED IMAGE COMPONENT - Zero CLS, GPU-Accelerated
// ============================================================================

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  // REQUIRED: Explicit dimensions prevent Cumulative Layout Shift
  width: number;
  height: number;
  
  // Optional enhancements
  fadeIn?: boolean;
  fadeInDuration?: number;
  blurPlaceholder?: boolean;
  priority?: boolean;
  
  // Callbacks
  onLoadComplete?: () => void;
}

/**
 * Zero-CLS Optimized Image Component
 * 
 * Features:
 * - Explicit width/height to prevent layout shift
 * - GPU-accelerated fade-in animation
 * - Placeholder blur while loading
 * - Proper priority loading for LCP images
 */
export const OptimizedImage = memo(function OptimizedImage({
  width,
  height,
  fadeIn = true,
  fadeInDuration = 300,
  blurPlaceholder = true,
  priority = false,
  onLoadComplete,
  className = '',
  style,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Calculate aspect ratio for responsive sizing
  const aspectRatio = height / width;

  return (
    <div
      className={`optimized-image-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width} / ${height}`,
        overflow: 'hidden',
        // GPU layer promotion
        transform: 'translateZ(0)',
        contain: 'layout paint',
        ...style,
      }}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(128, 128, 128, 0.1)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(128, 128, 128, 0.1)',
            color: 'rgba(128, 128, 128, 0.5)',
            fontSize: '0.875rem',
          }}
        >
          Failed to load
        </div>
      )}
      
      {/* Actual image */}
      {!hasError && (
        <Image
          width={width}
          height={height}
          alt={alt}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          placeholder={blurPlaceholder ? 'blur' : 'empty'}
          blurDataURL={blurPlaceholder ? generateBlurDataURL(width, height) : undefined}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            // GPU-only properties for fade-in
            opacity: fadeIn ? (isLoaded ? 1 : 0) : 1,
            transform: 'translateZ(0)',
            transition: fadeIn 
              ? `opacity ${fadeInDuration}ms cubic-bezier(0.16, 1, 0.3, 1)` 
              : 'none',
            willChange: fadeIn ? 'opacity' : 'auto',
            // Ensure proper sizing
            objectFit: 'cover',
            width: '100%',
            height: 'auto',
          }}
          {...props}
        />
      )}
    </div>
  );
});

/**
 * Generate a tiny blur placeholder SVG
 */
function generateBlurDataURL(width: number, height: number): string {
  const aspectRatio = width / height;
  const w = 10;
  const h = Math.round(w / aspectRatio);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="100%" height="100%" fill="#1a1a1a" filter="url(#b)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ============================================================================
// BACKGROUND IMAGE WITH GPU OPTIMIZATION
// ============================================================================

interface GPUBackgroundProps {
  src: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  parallax?: boolean;
  parallaxSpeed?: number;
}

export const GPUBackground = memo(function GPUBackground({
  src,
  alt = '',
  children,
  className = '',
  overlay = false,
  overlayOpacity = 0.5,
  parallax = false,
  parallaxSpeed = 0.3,
}: GPUBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Parallax effect using transient scroll
  useEffect(() => {
    if (!parallax || !imageRef.current) return;

    const image = imageRef.current;
    let rafId: number;
    let lastScrollY = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY === lastScrollY) {
        rafId = requestAnimationFrame(handleScroll);
        return;
      }
      lastScrollY = scrollY;
      
      // GPU-only transform
      image.style.transform = `translate3d(0, ${scrollY * parallaxSpeed}px, 0)`;
      rafId = requestAnimationFrame(handleScroll);
    };

    rafId = requestAnimationFrame(handleScroll);
    
    return () => cancelAnimationFrame(rafId);
  }, [parallax, parallaxSpeed]);

  return (
    <div
      ref={ref}
      className={`gpu-background ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      {/* Background image layer */}
      <div
        ref={imageRef}
        style={{
          position: 'absolute',
          inset: parallax ? '-20%' : 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'translateZ(0)',
          willChange: parallax ? 'transform' : 'auto',
        }}
        role="img"
        aria-label={alt}
      />
      
      {/* Optional overlay */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            transform: 'translateZ(0)',
          }}
        />
      )}
      
      {/* Content */}
      {children && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// LAZY IMAGE WITH INTERSECTION OBSERVER
// ============================================================================

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage = memo(function LazyImage({
  threshold = 0.1,
  rootMargin = '100px 0px',
  ...props
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isInView ? (
        <OptimizedImage {...props} />
      ) : (
        <div
          style={{
            width: props.width,
            height: props.height,
            backgroundColor: 'rgba(128, 128, 128, 0.1)',
          }}
        />
      )}
    </div>
  );
});
