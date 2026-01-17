"use client";

import React, { memo, useEffect, useState, createContext, useContext } from 'react';

/**
 * Unified Shimmer System v6 - AESTHETIC REFACTOR
 *
 * Only 3 animation types allowed:
 * 1. Slow glowing pulse
 * 2. Slow left-to-right gradient sweep
 * 3. Blue border shimmer
 *
 * BullMoney Blue: #3b82f6 | Light: #93c5fd
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT & HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export type ShimmerQuality = 'high' | 'medium' | 'low' | 'disabled';
const ShimmerQualityContext = createContext<{ quality: ShimmerQuality; setQuality: (q: ShimmerQuality) => void }>({ quality: 'high', setQuality: () => {} });
export const useShimmerQuality = () => useContext(ShimmerQualityContext);

export function useOptimizedShimmer() {
  const [settings, setSettings] = useState<{ disabled: boolean; speed: 'slow' | 'normal' | 'fast'; intensity: 'low' | 'medium' | 'high' }>({ disabled: false, speed: 'slow', intensity: 'medium' });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const update = () => {
      if (root.classList.contains('shimmer-quality-disabled')) setSettings({ disabled: true, speed: 'slow', intensity: 'low' });
      else setSettings({ disabled: false, speed: 'slow', intensity: 'medium' });
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return settings;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES - Injected once via ShimmerStylesProvider
// ═══════════════════════════════════════════════════════════════════════════

export const ShimmerStylesProvider = memo(() => (
  <style jsx global>{`
    /* 
     * UNIFIED SHIMMER v7 - THEME-AWARE
     * Uses CSS variables from GlobalThemeProvider for dynamic theming
     * Fallback to BullMoney Blue: #3b82f6 | Light: #93c5fd
     */
    
    /* SLOW LEFT-TO-RIGHT SWEEP - Theme-aware */
    @keyframes shimmer-ltr { 
      0% { transform: translateX(-100%); opacity: 0; } 
      50% { opacity: 1; } 
      100% { transform: translateX(200%); opacity: 0; } 
    }
    
    /* SLOW GLOW PULSE - Theme-aware */
    @keyframes shimmer-glow { 
      0%, 100% { box-shadow: 0 0 15px rgba(var(--accent-rgb, 59, 130, 246), 0.3), 0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.15); } 
      50% { box-shadow: 0 0 35px rgba(var(--accent-rgb, 59, 130, 246), 0.6), 0 0 60px rgba(var(--accent-rgb, 59, 130, 246), 0.35); } 
    }
    
    /* SLOW TEXT GLOW - Theme-aware */
    @keyframes shimmer-text-glow { 
      0%, 100% { text-shadow: 0 0 8px rgba(var(--accent-rgb, 59, 130, 246), 0.4); } 
      50% { text-shadow: 0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.8), 0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.5); } 
    }
    
    /* BORDER GLOW PULSE - Theme-aware */
    @keyframes shimmer-border-glow { 
      0%, 100% { box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb, 59, 130, 246), 0.3), 0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.2); } 
      50% { box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb, 59, 130, 246), 0.6), 0 0 25px rgba(var(--accent-rgb, 59, 130, 246), 0.4); } 
    }
    
    /* PING ANIMATION - Theme-aware expanding pulse */
    @keyframes shimmer-ping-animation {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    /* CSS CLASSES - Theme-aware using CSS variables */
    .shimmer-sweep { 
      animation: shimmer-ltr 6s ease-in-out infinite; 
      background: linear-gradient(90deg, transparent 0%, rgba(var(--accent-rgb, 59, 130, 246), 0.3) 25%, rgba(var(--accent-rgb, 59, 130, 246), 0.8) 50%, rgba(var(--accent-rgb, 59, 130, 246), 0.3) 75%, transparent 100%); 
      will-change: transform; 
    }
    .shimmer-glow { 
      animation: shimmer-glow 4s ease-in-out infinite; 
      will-change: box-shadow; 
    }
    .shimmer-text { 
      animation: shimmer-text-glow 4s ease-in-out infinite; 
      color: var(--accent-color, rgba(147,197,253,1)); 
    }
    .shimmer-text-white { 
      animation: shimmer-text-glow 4s ease-in-out infinite; 
      color: white; 
      text-shadow: 0 0 10px rgba(255,255,255,0.5); 
    }
    .shimmer-border { 
      animation: shimmer-border-glow 4s ease-in-out infinite; 
      border: 1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.4); 
    }
    .shimmer-card { 
      animation: shimmer-glow 5s ease-in-out infinite; 
      background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(10,20,40,0.95) 100%); 
      border: 1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3); 
    }
    .shimmer-button { 
      position: relative; 
      overflow: hidden; 
      animation: shimmer-border-glow 3s ease-in-out infinite; 
    }
    .shimmer-button::before { 
      content: ''; 
      position: absolute; 
      inset: 0; 
      animation: shimmer-ltr 4s ease-in-out infinite; 
      background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb, 59, 130, 246), 0.2), rgba(var(--accent-rgb, 59, 130, 246), 0.4), rgba(var(--accent-rgb, 59, 130, 246), 0.2), transparent); 
      pointer-events: none; 
    }
    .shimmer-section { 
      position: relative; 
      animation: shimmer-glow 6s ease-in-out infinite; 
    }
    .shimmer-bg { 
      background: linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(10,20,50,0.98) 50%, rgba(0,0,0,1) 100%); 
    }
    .shimmer-gpu { 
      transform: translateZ(0); 
      backface-visibility: hidden; 
    }
    
    /* PING - Theme-aware expanding pulse */
    .shimmer-ping {
      animation: shimmer-ping-animation 1s cubic-bezier(0, 0, 0.2, 1) infinite;
      background-color: var(--accent-color, #3b82f6);
    }
    
    /* CONIC BORDER - Theme-aware spinning gradient border */
    @keyframes shimmer-conic-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .shimmer-conic-border {
      background: conic-gradient(
        from 0deg at 50% 50%,
        var(--accent-color, #3b82f6) 0%,
        rgba(var(--accent-rgb, 59, 130, 246), 0.3) 25%,
        var(--accent-color, #3b82f6) 50%,
        rgba(var(--accent-rgb, 59, 130, 246), 0.3) 75%,
        var(--accent-color, #3b82f6) 100%
      );
      animation: shimmer-conic-rotate 4s linear infinite;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) { .shimmer-sweep, .shimmer-glow, .shimmer-text, .shimmer-border, .shimmer-button::before, .shimmer-conic-border { animation: none; } }
    /* Mobile optimization */
    @media (max-width: 768px) { .shimmer-sweep { animation-duration: 8s; } .shimmer-glow, .shimmer-border { animation-duration: 6s; } .shimmer-conic-border { animation-duration: 8s; } }
  `}</style>
));
ShimmerStylesProvider.displayName = 'ShimmerStylesProvider';

// ═══════════════════════════════════════════════════════════════════════════
// SHIMMER COMPONENTS - FPS Optimized 2026
// ═══════════════════════════════════════════════════════════════════════════

type ShimmerProps = { 
  className?: string; 
  disabled?: boolean; 
  children?: React.ReactNode;
  // Legacy props for backward compatibility (accepted but not used as we standardized to blue)
  color?: string;
  intensity?: 'low' | 'medium' | 'high' | string;
  speed?: 'slow' | 'normal' | 'fast' | string;
  size?: number;
  delay?: number;
};

/** 
 * Left-to-right gradient sweep line 
 * FPS OPTIMIZED: Uses CSS containment and will-change: auto when idle
 */
export const ShimmerLine = memo(({ className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return null;
  return (
    <div 
      className={`shimmer-line absolute inset-x-0 top-0 h-[2px] overflow-hidden ${className}`}
      style={{ contain: 'strict' }}
      data-shimmer="line"
    >
      <div className="shimmer-sweep shimmer-gpu absolute inset-y-0 left-[-100%] w-full" />
    </div>
  );
});
ShimmerLine.displayName = 'ShimmerLine';

/** 
 * Glowing border effect for buttons and cards 
 * FPS OPTIMIZED: border-radius inherit for proper GPU layer
 */
export const ShimmerBorder = memo(({ className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return null;
  return (
    <div 
      className={`shimmer-border shimmer-gpu absolute inset-0 rounded-inherit pointer-events-none ${className}`} 
      style={{ borderRadius: 'inherit', contain: 'layout paint' }}
      data-shimmer="border"
    />
  );
});
ShimmerBorder.displayName = 'ShimmerBorder';

/** 
 * Slow pulsing glow effect 
 * FPS OPTIMIZED: box-shadow animations only
 */
export const ShimmerGlow = memo(({ className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return null;
  return (
    <div 
      className={`shimmer-glow shimmer-gpu absolute inset-0 pointer-events-none ${className}`} 
      style={{ borderRadius: 'inherit', contain: 'layout paint' }}
      data-shimmer="glow"
    />
  );
});
ShimmerGlow.displayName = 'ShimmerGlow';

/** Blue glowing text */
export const ShimmerText = memo(({ children, className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return <>{children}</>;
  return <span className={`shimmer-text shimmer-gpu ${className}`}>{children}</span>;
});
ShimmerText.displayName = 'ShimmerText';

/** White glowing text */
export const ShimmerTextWhite = memo(({ children, className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return <>{children}</>;
  return <span className={`shimmer-text-white shimmer-gpu ${className}`}>{children}</span>;
});
ShimmerTextWhite.displayName = 'ShimmerTextWhite';

/** Card with glow and gradient background */
export const ShimmerCard = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-card shimmer-gpu relative rounded-xl p-4 ${className}`}>
    {!disabled && <ShimmerLine />}
    {!disabled && <ShimmerBorder />}
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerCard.displayName = 'ShimmerCard';

/** Button with border glow and sweep effect */
export const ShimmerButton = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-button shimmer-gpu relative rounded-lg ${className}`} style={{ borderRadius: 'inherit' }}>
    {!disabled && <ShimmerBorder />}
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerButton.displayName = 'ShimmerButton';

/** Section with background glow */
export const ShimmerSection = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-section shimmer-bg shimmer-gpu relative ${className}`}>
    {!disabled && <ShimmerGlow />}
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerSection.displayName = 'ShimmerSection';

/** Container with all shimmer effects */
export const ShimmerContainer = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`relative shimmer-bg rounded-xl ${className}`}>
    {!disabled && <ShimmerGlow />}
    {!disabled && <ShimmerBorder />}
    {!disabled && <ShimmerLine />}
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerContainer.displayName = 'ShimmerContainer';

// Legacy exports for backwards compatibility
export const ShimmerPulse = ShimmerGlow;
export const ShimmerConic = ShimmerLine;
export const ShimmerWave = ShimmerLine;
export const ShimmerGradientWave = ShimmerGlow;
export const ShimmerGlide = ShimmerLine;
export const ShimmerStreak = ShimmerLine;
export const ShimmerGlowBorder = ShimmerBorder;
const ShimmerFloatComponent = memo(({ children, className = '' }: ShimmerProps) => <div className={`shimmer-glow ${className}`}>{children}</div>);
ShimmerFloatComponent.displayName = 'ShimmerFloat';
export const ShimmerFloat = ShimmerFloatComponent;

const ShimmerDotComponent = memo(({ className = '', delay = 0 }: ShimmerProps) => (
  <span 
    className={`shimmer-glow w-2 h-2 rounded-full ${className}`} 
    style={{ animationDelay: `${delay}s`, backgroundColor: 'var(--accent-color, #3b82f6)' }}
  />
));
ShimmerDotComponent.displayName = 'ShimmerDot';
export const ShimmerDot = ShimmerDotComponent;

const ShimmerSpinnerComponent = memo(({ className = '', size = 32 }: ShimmerProps) => {
  const sizeStyle = { width: size, height: size };
  return (
    <div 
      className={`shimmer-glow rounded-full flex items-center justify-center ${className}`} 
      style={{ ...sizeStyle, border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)' }}
    >
      <div 
        className="animate-spin rounded-full border-2 border-transparent" 
        style={{ 
          width: size * 0.75, 
          height: size * 0.75,
          borderTopColor: 'var(--accent-color, #60a5fa)'
        }} 
      />
    </div>
  );
});
ShimmerSpinnerComponent.displayName = 'ShimmerSpinner';
export const ShimmerSpinner = ShimmerSpinnerComponent;
export const ShimmerRadialGlow = ShimmerGlow;
export const ShimmerRipple = ShimmerGlow;
export const ShimmerShineBurst = ShimmerGlow;

/** Unified Shimmer - variant-based API */
export const UnifiedShimmer = memo(({ variant, ...props }: { variant: string } & ShimmerProps) => {
  const components: Record<string, React.FC<ShimmerProps>> = { line: ShimmerLine, border: ShimmerBorder, glow: ShimmerGlow, pulse: ShimmerGlow, text: ShimmerText, card: ShimmerCard, button: ShimmerButton, section: ShimmerSection, container: ShimmerContainer };
  const Component = components[variant] || ShimmerGlow;
  return <Component {...props} />;
});
UnifiedShimmer.displayName = 'UnifiedShimmer';

export default UnifiedShimmer;
