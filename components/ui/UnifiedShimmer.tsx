"use client";

import React, { memo, useEffect, useMemo, createContext, useContext, useState } from 'react';

/**
 * Unified Shimmer System v2
 * 
 * This component provides a single, optimized shimmer implementation
 * to reduce lag from multiple shimmer animations across the app.
 * 
 * Features:
 * - CSS animations with will-change hints for GPU acceleration
 * - All shimmers synced to reduce repaints
 * - Global FPS-aware quality control
 * - Automatic degradation when FPS drops
 * 
 * Usage:
 * 1. Add <ShimmerStylesProvider /> in layout.tsx (once)
 * 2. Use shimmer components or CSS classes directly
 */

// Global shimmer quality state
type ShimmerQuality = 'high' | 'medium' | 'low' | 'disabled';

const ShimmerQualityContext = createContext<{
  quality: ShimmerQuality;
  setQuality: (q: ShimmerQuality) => void;
}>({
  quality: 'high',
  setQuality: () => {},
});

// Hook to access shimmer quality - components can use this to conditionally render
export const useShimmerQuality = () => useContext(ShimmerQualityContext);

// CSS styles injected once globally - includes all shimmer animations
const ShimmerStyles = () => (
  <style jsx global>{`
    /* =================================================================
       UNIFIED SHIMMER KEYFRAMES
       All shimmer animations in one place for consistent performance
       ================================================================= */
    
    @keyframes unified-shimmer-ltr {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    
    @keyframes unified-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes unified-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    
    @keyframes unified-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
      50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
    }
    
    @keyframes unified-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    
    @keyframes unified-dot-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.3); }
    }
    
    @keyframes unified-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    
    /* =================================================================
       SHIMMER CSS CLASSES
       Use these classes directly for maximum performance
       ================================================================= */
    
    .shimmer-line {
      animation: unified-shimmer-ltr 3s linear infinite;
      will-change: transform;
    }
    
    .shimmer-spin {
      animation: unified-spin 4s linear infinite;
      will-change: transform;
    }
    
    .shimmer-pulse {
      animation: unified-pulse 3s ease-in-out infinite;
      will-change: opacity;
    }
    
    .shimmer-glow {
      animation: unified-glow 3s ease-in-out infinite;
      will-change: box-shadow;
    }
    
    .shimmer-float {
      animation: unified-float 3s ease-in-out infinite;
      will-change: transform;
    }
    
    .shimmer-dot-pulse {
      animation: unified-dot-pulse 1.5s ease-in-out infinite;
      will-change: opacity, transform;
    }
    
    .shimmer-ping {
      animation: unified-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    
    /* GPU acceleration hint */
    .shimmer-gpu {
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    /* =================================================================
       FPS-AWARE QUALITY CONTROL
       Classes added by PerformanceProvider based on FPS
       ================================================================= */
    
    /* Medium quality - slow down animations */
    html.shimmer-quality-medium .shimmer-line { animation-duration: 5s; }
    html.shimmer-quality-medium .shimmer-spin { animation-duration: 6s; }
    html.shimmer-quality-medium .shimmer-pulse { animation-duration: 5s; }
    html.shimmer-quality-medium .shimmer-glow { animation-duration: 5s; }
    html.shimmer-quality-medium .shimmer-ping { animation-duration: 2s; }
    
    /* Low quality - minimal animations */
    html.shimmer-quality-low .shimmer-line,
    html.shimmer-quality-low .shimmer-spin,
    html.shimmer-quality-low .shimmer-glow,
    html.shimmer-quality-low .shimmer-float,
    html.shimmer-quality-low .shimmer-dot-pulse,
    html.shimmer-quality-low .shimmer-ping {
      animation: none !important;
    }
    
    html.shimmer-quality-low .shimmer-pulse {
      animation-duration: 8s;
    }
    
    /* Disabled - no animations at all */
    html.shimmer-quality-disabled .shimmer-line,
    html.shimmer-quality-disabled .shimmer-spin,
    html.shimmer-quality-disabled .shimmer-pulse,
    html.shimmer-quality-disabled .shimmer-glow,
    html.shimmer-quality-disabled .shimmer-float,
    html.shimmer-quality-disabled .shimmer-dot-pulse,
    html.shimmer-quality-disabled .shimmer-ping {
      animation: none !important;
      opacity: 0.5;
    }
    
    /* =================================================================
       SCROLL-AWARE OPTIMIZATION
       Pause animations during scroll for smoother performance
       ================================================================= */
    
    html.is-scrolling .shimmer-line,
    html.is-scrolling .shimmer-spin,
    html.is-scrolling .shimmer-glow,
    html.is-scrolling .shimmer-float,
    html.is-scrolling .shimmer-ping {
      animation-play-state: paused !important;
    }
    
    /* =================================================================
       ACCESSIBILITY & BATTERY OPTIMIZATION
       ================================================================= */
    
    @media (prefers-reduced-motion: reduce) {
      .shimmer-line,
      .shimmer-spin,
      .shimmer-pulse,
      .shimmer-glow {
        animation: none;
      }
    }
    
    /* Mobile: slow down animations for battery */
    @media (max-width: 768px) {
      .shimmer-line { animation-duration: 5s; }
      .shimmer-spin { animation-duration: 6s; }
    }
    
    /* Performance hint for GPU compositing */
    .shimmer-gpu {
      transform: translateZ(0);
      backface-visibility: hidden;
    }
  `}</style>
);

// Export styles component to be used once in layout
export const ShimmerStylesProvider = memo(() => <ShimmerStyles />);
ShimmerStylesProvider.displayName = 'ShimmerStylesProvider';

// Types
type ShimmerVariant = 'line' | 'border' | 'conic' | 'glow' | 'pulse';
type ShimmerColor = 'blue' | 'red' | 'white' | 'custom';

interface ShimmerProps {
  variant: ShimmerVariant;
  color?: ShimmerColor;
  customColor?: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'normal' | 'fast';
  disabled?: boolean;
}

// Color presets
const colorMap = {
  blue: {
    via: 'rgba(59, 130, 246, 0.5)',
    glow: 'rgba(59, 130, 246, 0.3)',
    conic: '#3b82f6',
  },
  red: {
    via: 'rgba(239, 68, 68, 0.5)',
    glow: 'rgba(239, 68, 68, 0.3)',
    conic: '#ef4444',
  },
  white: {
    via: 'rgba(255, 255, 255, 0.3)',
    glow: 'rgba(255, 255, 255, 0.2)',
    conic: '#ffffff',
  },
  custom: {
    via: 'rgba(59, 130, 246, 0.5)',
    glow: 'rgba(59, 130, 246, 0.3)',
    conic: '#3b82f6',
  },
};

const speedMap = {
  slow: '5s',
  normal: '3s',
  fast: '2s',
};

const intensityMap = {
  low: 0.3,
  medium: 0.5,
  high: 0.8,
};

/**
 * Line Shimmer - Horizontal sweep effect
 */
export const ShimmerLine = memo(({ 
  color = 'blue', 
  customColor,
  intensity = 'medium',
  speed = 'normal',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const viaColor = customColor || colors.via;
  
  if (disabled) return null;
  
  return (
    <div 
      className={`absolute inset-x-0 top-0 h-[1px] overflow-hidden ${className}`}
      style={{ willChange: 'contents' }}
    >
      <div 
        className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
        style={{ 
          background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
          opacity: intensityMap[intensity],
          animationDuration: speedMap[speed],
        }} 
      />
    </div>
  );
});
ShimmerLine.displayName = 'ShimmerLine';

/**
 * Border Shimmer - Animated border effect
 */
export const ShimmerBorder = memo(({ 
  color = 'blue', 
  customColor,
  intensity = 'medium',
  speed = 'normal',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const conicColor = customColor || colors.conic;
  
  if (disabled) return null;
  
  return (
    <span 
      className={`shimmer-spin shimmer-gpu absolute inset-[-2px] rounded-2xl pointer-events-none ${className}`}
      style={{ 
        background: `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${conicColor} 25%, ${conicColor}80 50%, ${conicColor} 75%, #00000000 100%)`,
        opacity: intensityMap[intensity],
        animationDuration: speedMap[speed],
      }} 
    />
  );
});
ShimmerBorder.displayName = 'ShimmerBorder';

/**
 * Conic Shimmer - Spinning conic gradient
 */
export const ShimmerConic = memo(({ 
  color = 'blue', 
  customColor,
  intensity = 'medium',
  speed = 'normal',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const conicColor = customColor || colors.conic;
  
  if (disabled) return null;
  
  return (
    <span 
      className={`shimmer-spin shimmer-gpu absolute inset-0 rounded-full ${className}`}
      style={{ 
        background: `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${conicColor} 50%, #00000000 100%)`,
        opacity: intensityMap[intensity],
        animationDuration: speedMap[speed],
      }} 
    />
  );
});
ShimmerConic.displayName = 'ShimmerConic';

/**
 * Glow Shimmer - Pulsing glow effect
 */
export const ShimmerGlow = memo(({ 
  color = 'blue', 
  customColor,
  intensity = 'medium',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const glowColor = customColor || colors.glow;
  
  if (disabled) return null;
  
  return (
    <div 
      className={`shimmer-glow shimmer-gpu absolute inset-0 rounded-2xl pointer-events-none ${className}`}
      style={{ 
        boxShadow: `0 0 30px ${glowColor}`,
        opacity: intensityMap[intensity],
      }} 
    />
  );
});
ShimmerGlow.displayName = 'ShimmerGlow';

/**
 * Pulse Shimmer - Fading pulse effect
 */
export const ShimmerPulse = memo(({ 
  color = 'blue', 
  customColor,
  intensity = 'medium',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const viaColor = customColor || colors.via;
  
  if (disabled) return null;
  
  return (
    <div 
      className={`shimmer-pulse shimmer-gpu absolute inset-0 rounded-2xl pointer-events-none ${className}`}
      style={{ 
        background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
        opacity: intensityMap[intensity],
      }} 
    />
  );
});
ShimmerPulse.displayName = 'ShimmerPulse';

/**
 * Float Shimmer - Floating effect for logos/icons
 */
export const ShimmerFloat = memo(({ 
  children,
  className = '',
  disabled = false
}: { children?: React.ReactNode; className?: string; disabled?: boolean }) => {
  if (disabled) return <>{children}</>;
  
  return (
    <div className={`shimmer-float shimmer-gpu ${className}`}>
      {children}
    </div>
  );
});
ShimmerFloat.displayName = 'ShimmerFloat';

/**
 * Dot Pulse - Pulsing dot indicators
 */
export const ShimmerDot = memo(({ 
  color = 'blue',
  delay = 0,
  className = '',
  disabled = false
}: { color?: ShimmerColor; delay?: number; className?: string; disabled?: boolean }) => {
  const colors = colorMap[color];
  
  if (disabled) return null;
  
  return (
    <span 
      className={`shimmer-dot-pulse shimmer-gpu w-1 h-1 rounded-full ${className}`}
      style={{ 
        backgroundColor: colors.conic,
        opacity: 0.6,
        animationDelay: `${delay}s`
      }} 
    />
  );
});
ShimmerDot.displayName = 'ShimmerDot';

/**
 * Spinner Shimmer - Loading spinner with conic gradient
 */
export const ShimmerSpinner = memo(({ 
  size = 40,
  color = 'blue',
  speed = 'normal',
  className = '',
  disabled = false
}: { size?: number; color?: ShimmerColor; speed?: 'slow' | 'normal' | 'fast'; className?: string; disabled?: boolean }) => {
  const colors = colorMap[color];
  
  if (disabled) return null;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <span 
        className="shimmer-spin shimmer-gpu absolute inset-0 rounded-full"
        style={{ 
          background: `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${colors.conic} 50%, #00000000 100%)`,
          animationDuration: speedMap[speed],
        }} 
      />
      <div className="absolute inset-[2px] bg-black rounded-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="shimmer-dot-pulse rounded-full"
          style={{ 
            width: size * 0.15,
            height: size * 0.15,
            backgroundColor: `${colors.conic}99`,
          }} 
        />
      </div>
    </div>
  );
});
ShimmerSpinner.displayName = 'ShimmerSpinner';

/**
 * Radial Glow - Background radial gradient
 */
export const ShimmerRadialGlow = memo(({ 
  color = 'blue',
  intensity = 'low',
  className = '',
  disabled = false
}: { color?: ShimmerColor; intensity?: 'low' | 'medium' | 'high'; className?: string; disabled?: boolean }) => {
  const colors = colorMap[color];
  const opacityMap = { low: 0.05, medium: 0.1, high: 0.15 };
  
  if (disabled) return null;
  
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        background: `radial-gradient(ellipse at center, ${colors.glow.replace('0.3', String(opacityMap[intensity]))} 0%, transparent 70%)`
      }} 
    />
  );
});
ShimmerRadialGlow.displayName = 'ShimmerRadialGlow';

/**
 * Unified Shimmer - All-in-one component
 */
export const UnifiedShimmer = memo(({ 
  variant, 
  ...props 
}: ShimmerProps) => {
  switch (variant) {
    case 'line':
      return <ShimmerLine {...props} />;
    case 'border':
      return <ShimmerBorder {...props} />;
    case 'conic':
      return <ShimmerConic {...props} />;
    case 'glow':
      return <ShimmerGlow {...props} />;
    case 'pulse':
      return <ShimmerPulse {...props} />;
    default:
      return null;
  }
});
UnifiedShimmer.displayName = 'UnifiedShimmer';

/**
 * Shimmer Container - Wrapper with shimmer effects
 */
interface ShimmerContainerProps {
  children: React.ReactNode;
  showBorder?: boolean;
  showLine?: boolean;
  showGlow?: boolean;
  color?: ShimmerColor;
  className?: string;
  innerClassName?: string;
  disabled?: boolean;
}

export const ShimmerContainer = memo(({ 
  children,
  showBorder = true,
  showLine = true,
  showGlow = false,
  color = 'blue',
  className = '',
  innerClassName = '',
  disabled = false
}: ShimmerContainerProps) => {
  return (
    <div className={`relative ${className}`}>
      {showBorder && <ShimmerBorder color={color} intensity="low" disabled={disabled} />}
      
      <div className={`relative z-10 bg-black rounded-2xl border border-blue-500/20 overflow-hidden ${innerClassName}`}>
        {showLine && <ShimmerLine color={color} disabled={disabled} />}
        {showGlow && <ShimmerGlow color={color} intensity="low" disabled={disabled} />}
        {children}
      </div>
    </div>
  );
});
ShimmerContainer.displayName = 'ShimmerContainer';

export default UnifiedShimmer;
