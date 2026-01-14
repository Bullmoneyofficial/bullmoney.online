"use client";

import React, { memo, useEffect, useMemo, createContext, useContext, useState } from 'react';

/**
 * Unified Shimmer System v3
 * 
 * THE SINGLE SOURCE OF TRUTH FOR ALL SHIMMER EFFECTS
 * All components must use this for shimmer animations.
 * 
 * This component provides a single, optimized shimmer implementation
 * to reduce lag from multiple shimmer animations across the app.
 * 
 * Features:
 * - ALL shimmers animate LEFT-TO-RIGHT consistently
 * - CSS animations with will-change hints for GPU acceleration
 * - All shimmers synced to reduce repaints
 * - Integrates with FpsOptimizer for device-aware quality
 * - Automatic degradation when FPS drops
 * 
 * Usage:
 * 1. Add <ShimmerStylesProvider /> in layout.tsx (once)
 * 2. Use shimmer components: ShimmerLine, ShimmerBorder, ShimmerGlow, etc.
 * 3. Use CSS classes directly: shimmer-line, shimmer-spin, shimmer-pulse
 * 
 * Components using this:
 * - Navbar, Footer, AudioWidget, UltimateControlPanel
 * - All modals and cards
 */

// Global shimmer quality state
export type ShimmerQuality = 'high' | 'medium' | 'low' | 'disabled';

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
    
    /* LEFT-TO-RIGHT Border shimmer - sweeps around the border */
    @keyframes unified-border-ltr {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    /* LEFT-TO-RIGHT sweep - replaces all spinning animations */
    @keyframes unified-sweep-ltr {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    
    /* Deprecated: unified-spin now redirects to sweep (NO SPINNING EVER) */
    @keyframes unified-spin {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    
    @keyframes unified-pulse {
      0%, 100% { opacity: 0.25; }
      50% { opacity: 0.45; }
    }
    
    @keyframes unified-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
      50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.35); }
    }
    
    @keyframes unified-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    
    @keyframes unified-dot-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.3); }
    }
    
    @keyframes unified-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    
    /* Text shimmer - background position animation for gradient text */
    @keyframes unified-text-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* =================================================================
       SHIMMER CSS CLASSES
       Use these classes directly for maximum performance
       SMOOTH left-to-right animations for aesthetic look
       ================================================================= */
    
    .shimmer-line {
      animation: unified-shimmer-ltr 14s linear infinite;
      will-change: transform;
    }
    
    /* shimmer-spin: LEFT-TO-RIGHT ONLY - NO ROTATION/SPINNING */
    .shimmer-spin {
      animation: unified-sweep-ltr 16s linear infinite;
      will-change: transform;
    }
    
    /* Explicit left-to-right class for clarity - SMOOTH */
    .shimmer-ltr {
      animation: unified-shimmer-ltr 14s linear infinite;
      will-change: transform;
    }
    
    .shimmer-pulse {
      animation: unified-pulse 12s ease-in-out infinite;
      will-change: opacity;
    }
    
    .shimmer-glow {
      animation: unified-glow 10s ease-in-out infinite;
      will-change: box-shadow;
    }
    
    .shimmer-float {
      animation: unified-float 6s ease-in-out infinite;
      will-change: transform;
    }
    
    .shimmer-dot-pulse {
      animation: unified-dot-pulse 1.5s ease-in-out infinite;
      will-change: opacity, transform;
    }
    
    .shimmer-ping {
      animation: unified-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    
    /* Text shimmer - for animated gradient text */
    .shimmer-text {
      background: linear-gradient(110deg, #FFFFFF 0%, #3b82f6 45%, #60a5fa 55%, #FFFFFF 100%);
      background-size: 200% auto;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: unified-text-shimmer 3s linear infinite;
      will-change: background-position;
    }
    
    /* GPU acceleration hint */
    .shimmer-gpu {
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    /* =================================================================
       FPS-AWARE QUALITY CONTROL
       Classes added by UnifiedPerformanceSystem based on real FPS
       ================================================================= */

    /* Medium quality - slow down animations significantly */
    html.shimmer-quality-medium .shimmer-line { animation-duration: 14s; }
    html.shimmer-quality-medium .shimmer-spin { animation-duration: 16s; }
    html.shimmer-quality-medium .shimmer-ltr { animation-duration: 14s; }
    html.shimmer-quality-medium .shimmer-pulse { animation-duration: 12s; }
    html.shimmer-quality-medium .shimmer-glow { animation-duration: 14s; }
    html.shimmer-quality-medium .shimmer-ping { animation-duration: 4s; }

    /* Low quality - very slow animations but KEEP LEFT-TO-RIGHT effect */
    html.shimmer-quality-low .shimmer-line,
    html.shimmer-quality-low .shimmer-spin,
    html.shimmer-quality-low .shimmer-ltr {
      animation-duration: 20s !important;
    }

    html.shimmer-quality-low .shimmer-glow,
    html.shimmer-quality-low .shimmer-float {
      animation-duration: 18s !important;
    }

    html.shimmer-quality-low .shimmer-dot-pulse,
    html.shimmer-quality-low .shimmer-ping {
      animation-duration: 8s !important;
    }

    html.shimmer-quality-low .shimmer-pulse {
      animation-duration: 16s;
    }

    /* Disabled - ULTRA slow animations, keep left-to-right look */
    html.shimmer-quality-disabled .shimmer-line,
    html.shimmer-quality-disabled .shimmer-spin,
    html.shimmer-quality-disabled .shimmer-ltr {
      animation-duration: 30s !important;
      opacity: 0.3;
    }

    html.shimmer-quality-disabled .shimmer-pulse,
    html.shimmer-quality-disabled .shimmer-glow,
    html.shimmer-quality-disabled .shimmer-float,
    html.shimmer-quality-disabled .shimmer-dot-pulse,
    html.shimmer-quality-disabled .shimmer-ping {
      animation-duration: 25s !important;
      opacity: 0.2;
    }

    /* =================================================================
       FPS-CLASS BASED EMERGENCY CONTROLS
       These provide immediate CSS-level performance improvements
       Applied by UnifiedPerformanceSystem based on real-time FPS
       NOTE: Only target actual shimmer animation elements, NOT containers
       ================================================================= */

    /* FPS MINIMAL (<30fps) - Ultra slow animations */
    /* IMPORTANT: Only target actual shimmer overlays, not parent containers */
    html.fps-minimal .shimmer-line,
    html.fps-minimal .shimmer-spin,
    html.fps-minimal .shimmer-ltr,
    html.fps-minimal .shimmer-pulse,
    html.fps-minimal .shimmer-glow,
    html.fps-minimal .shimmer-float,
    html.fps-minimal .shimmer-dot-pulse,
    html.fps-minimal .shimmer-ping {
      animation-duration: 30s !important;
      will-change: auto !important;
    }

    html.fps-minimal .shimmer-text {
      animation-duration: 25s !important;
    }

    /* FPS LOW (30-35fps) - Very slow shimmers, keep aesthetic */
    html.fps-low .shimmer-line:not(.shimmer-essential),
    html.fps-low .shimmer-spin:not(.shimmer-essential),
    html.fps-low .shimmer-ltr:not(.shimmer-essential),
    html.fps-low .shimmer-pulse:not(.shimmer-essential),
    html.fps-low .shimmer-glow:not(.shimmer-essential) {
      animation-duration: 20s !important;
      will-change: auto !important;
    }

    html.fps-low .shimmer-pulse,
    html.fps-low .shimmer-glow {
      animation-duration: 22s !important;
    }

    /* FPS MEDIUM (35-50fps) - Moderate speed reduction */
    html.fps-medium .shimmer-line { animation-duration: 14s !important; }
    html.fps-medium .shimmer-spin { animation-duration: 16s !important; }
    html.fps-medium .shimmer-ltr { animation-duration: 14s !important; }
    html.fps-medium .shimmer-pulse { animation-duration: 12s !important; }
    html.fps-medium .shimmer-glow { animation-duration: 16s !important; }
    html.fps-medium .shimmer-float { animation-duration: 12s !important; }

    /* iOS/Safari specific - slower animations for performance */
    /* NOTE: Only target actual shimmer elements, not containers */
    html.is-ios .shimmer-line,
    html.is-ios .shimmer-spin,
    html.is-ios .shimmer-ltr,
    html.is-ios .shimmer-pulse,
    html.is-ios .shimmer-glow,
    html.is-safari .shimmer-line,
    html.is-safari .shimmer-spin,
    html.is-safari .shimmer-ltr,
    html.is-safari .shimmer-pulse,
    html.is-safari .shimmer-glow {
      animation-duration: 14s !important;
    }

    html.is-ios.fps-medium .shimmer-line,
    html.is-ios.fps-medium .shimmer-spin,
    html.is-ios.fps-medium .shimmer-ltr,
    html.is-safari.fps-medium .shimmer-line,
    html.is-safari.fps-medium .shimmer-spin,
    html.is-safari.fps-medium .shimmer-ltr {
      animation-duration: 18s !important;
    }

    /* iOS/Safari at low FPS - ultra slow animations */
    html.is-ios.fps-low .shimmer-line,
    html.is-ios.fps-low .shimmer-spin,
    html.is-ios.fps-low .shimmer-ltr,
    html.is-safari.fps-low .shimmer-line,
    html.is-safari.fps-low .shimmer-spin,
    html.is-safari.fps-low .shimmer-ltr {
      animation-duration: 24s !important;
    }

    html.is-ios.fps-minimal .shimmer-line,
    html.is-ios.fps-minimal .shimmer-spin,
    html.is-ios.fps-minimal .shimmer-ltr,
    html.is-safari.fps-minimal .shimmer-line,
    html.is-safari.fps-minimal .shimmer-spin,
    html.is-safari.fps-minimal .shimmer-ltr {
      animation-duration: 35s !important;
    }
    
    /* =================================================================
       SCROLL-AWARE OPTIMIZATION
       Pause animations during scroll for smoother performance
       ================================================================= */
    
    html.is-scrolling .shimmer-line,
    html.is-scrolling .shimmer-spin,
    html.is-scrolling .shimmer-ltr,
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
    
    /* Mobile: slow down animations for battery and performance */
    @media (max-width: 768px) {
      .shimmer-line { animation-duration: 14s; }
      .shimmer-spin { animation-duration: 16s; }
      .shimmer-ltr { animation-duration: 14s; }
      .shimmer-pulse { animation-duration: 12s; }
      .shimmer-glow { animation-duration: 14s; }
    }
    
    /* Component visibility optimization - slow down shimmers on inactive components */
    /* When FPS optimizer detects component is offscreen, slow down shimmers significantly */
    /* NOTE: Only target shimmer-line elements INSIDE containers, not the containers themselves */
    html.component-inactive-navbar .navbar-shimmer .shimmer-line,
    html.component-inactive-navbar .navbar-shimmer .shimmer-spin,
    html.component-inactive-footer .footer-shimmer .shimmer-line,
    html.component-inactive-footer .footer-shimmer .shimmer-spin,
    html.component-inactive-audioWidget .audio-shimmer .shimmer-line,
    html.component-inactive-audioWidget .audio-shimmer .shimmer-spin,
    html.component-inactive-ultimatePanel .panel-shimmer .shimmer-line,
    html.component-inactive-ultimatePanel .panel-shimmer .shimmer-spin,
    html.component-inactive-staticTip .static-tip-shimmer .shimmer-line,
    html.component-inactive-movingTip .moving-tip-shimmer .shimmer-line {
      animation-duration: 20s !important;
      animation-play-state: paused !important;
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
  slow: '16s',
  normal: '10s',
  fast: '7s',
};

const intensityMap = {
  low: 0.25,
  medium: 0.4,
  high: 0.55,
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
  const viaColor = customColor || colors.via;
  
  if (disabled) return null;
  
  // LEFT-TO-RIGHT shimmer border effect
  return (
    <>
      {/* Top border shimmer - LEFT TO RIGHT */}
      <span 
        className={`shimmer-line shimmer-gpu absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none ${className}`}
      >
        <span 
          className="absolute inset-y-0 left-[-100%] w-[100%] shimmer-line"
          style={{ 
            background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
            opacity: intensityMap[intensity],
            animationDuration: speedMap[speed],
          }} 
        />
      </span>
      {/* Bottom border shimmer - LEFT TO RIGHT */}
      <span 
        className={`shimmer-line shimmer-gpu absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none ${className}`}
      >
        <span 
          className="absolute inset-y-0 left-[-100%] w-[100%] shimmer-line"
          style={{ 
            background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
            opacity: intensityMap[intensity],
            animationDuration: speedMap[speed],
            animationDelay: '1.5s',
          }} 
        />
      </span>
    </>
  );
});
ShimmerBorder.displayName = 'ShimmerBorder';

/**
 * Conic Shimmer - Now LEFT TO RIGHT sweep (no spinning)
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
  const viaColor = customColor || colors.via;
  
  if (disabled) return null;
  
  // LEFT-TO-RIGHT sweep instead of spinning
  return (
    <span 
      className={`shimmer-gpu absolute inset-0 rounded-full overflow-hidden pointer-events-none ${className}`}
    >
      <span 
        className="absolute inset-y-0 left-[-100%] w-[100%] shimmer-line"
        style={{ 
          background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
          opacity: intensityMap[intensity],
          animationDuration: speedMap[speed],
        }} 
      />
    </span>
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
 * Spinner Shimmer - Loading spinner with LEFT-TO-RIGHT sweep (no spinning)
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
      {/* LEFT-TO-RIGHT sweep instead of spinning */}
      <span 
        className="shimmer-gpu absolute inset-0 rounded-full overflow-hidden"
      >
        <span 
          className="absolute inset-y-0 left-[-100%] w-[100%] shimmer-line"
          style={{ 
            background: `linear-gradient(to right, transparent, ${colors.via}, transparent)`,
            animationDuration: speedMap[speed],
          }} 
        />
      </span>
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
 * Text Shimmer - Animated gradient text effect
 */
export const ShimmerText = memo(({ 
  children,
  className = '',
  speed = 'normal',
  disabled = false
}: { 
  children: React.ReactNode; 
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  disabled?: boolean;
}) => {
  const speedMap = {
    slow: '5s',
    normal: '3s',
    fast: '2s',
  };
  
  if (disabled) return <>{children}</>;
  
  return (
    <span 
      className={`shimmer-text shimmer-gpu ${className}`}
      style={{
        animationDuration: speedMap[speed],
      }}
    >
      {children}
    </span>
  );
});
ShimmerText.displayName = 'ShimmerText';

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

/**
 * Hook to get shimmer props based on FpsOptimizer device tier
 * Use this in components to get device-aware shimmer settings
 * 
 * @example
 * const { disabled, speed, intensity } = useOptimizedShimmer();
 * <ShimmerLine disabled={disabled} speed={speed} intensity={intensity} />
 */
export function useOptimizedShimmer() {
  const [settings, setSettings] = useState({
    disabled: false,
    speed: 'normal' as 'slow' | 'normal' | 'fast',
    intensity: 'medium' as 'low' | 'medium' | 'high',
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    const updateSettings = () => {
      if (root.classList.contains('shimmer-quality-disabled')) {
        setSettings({ disabled: true, speed: 'slow', intensity: 'low' });
      } else if (root.classList.contains('shimmer-quality-low')) {
        setSettings({ disabled: false, speed: 'slow', intensity: 'low' });
      } else if (root.classList.contains('shimmer-quality-medium')) {
        setSettings({ disabled: false, speed: 'slow', intensity: 'medium' });
      } else {
        setSettings({ disabled: false, speed: 'normal', intensity: 'medium' });
      }
    };
    
    // Initial check
    updateSettings();
    
    // Watch for class changes
    const observer = new MutationObserver(updateSettings);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  return settings;
}

export default UnifiedShimmer;
