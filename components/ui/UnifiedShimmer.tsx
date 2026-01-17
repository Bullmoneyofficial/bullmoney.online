"use client";

import React, { memo, useEffect, useState, createContext, useContext } from 'react';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║       UNIFIED SHIMMER SYSTEM v10 - DESKTOP ULTRA AESTHETIC 2026          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  🖥️ DESKTOP EXCLUSIVE FEATURES:                                          ║
 * ║  • 20+ Unique shimmer animation types                                     ║
 * ║  • GPU-accelerated with WebGL hints                                       ║
 * ║  • 120Hz ProMotion optimized (Apple Silicon M1-M5)                       ║
 * ║  • Full blur, glow, gradient effects unlocked                            ║
 * ║  • Zero throttling on capable hardware                                    ║
 * ║                                                                           ║
 * ║  📱 MOBILE: Simplified, battery-efficient animations                      ║
 * ║                                                                           ║
 * ║  Animation Categories:                                                    ║
 * ║  1. SWEEP    - Directional gradient movements                            ║
 * ║  2. GLOW     - Pulsing luminance effects                                 ║
 * ║  3. BORDER   - Edge illumination effects                                 ║
 * ║  4. CONIC    - Rotating gradient borders                                 ║
 * ║  5. RADIAL   - Expanding/contracting effects                             ║
 * ║  6. AURORA   - Multi-color flowing gradients                             ║
 * ║  7. WAVE     - Undulating motion effects                                 ║
 * ║  8. PULSE    - Rhythmic intensity changes                                ║
 * ║  9. MORPH    - Shape-shifting effects                                    ║
 * ║  10. PRISM   - Rainbow refraction effects                                ║
 * ║  11. NEON    - High-contrast edge glow                                   ║
 * ║  12. PLASMA  - Organic flowing patterns                                  ║
 * ║  13. MATRIX  - Digital rain effect                                       ║
 * ║  14. HOLOGRAM - Iridescent surface effect                                ║
 * ║  15. SPARK   - Particle burst effects                                    ║
 * ║                                                                           ║
 * ║  BullMoney Blue: #3b82f6 | Light: #93c5fd | Cyan: #06b6d4               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT & HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export type ShimmerQuality = 'ultra' | 'high' | 'medium' | 'low' | 'disabled';
export type ShimmerVariant = 
  | 'line' | 'border' | 'glow' | 'pulse' | 'text' | 'card' | 'button' | 'section' | 'container'
  | 'aurora' | 'wave' | 'conic' | 'radial' | 'prism' | 'neon' | 'plasma' | 'hologram' | 'spark'
  | 'matrix' | 'morph' | 'spotlight' | 'ripple' | 'laser' | 'gradient-flow';

interface ShimmerContextValue {
  quality: ShimmerQuality;
  setQuality: (q: ShimmerQuality) => void;
  isDesktop: boolean;
  isAppleSilicon: boolean;
  chipGeneration: string;
  fps: number;
}

const ShimmerQualityContext = createContext<ShimmerContextValue>({ 
  quality: 'high', 
  setQuality: () => {},
  isDesktop: false,
  isAppleSilicon: false,
  chipGeneration: 'unknown',
  fps: 60,
});

export const useShimmerQuality = () => useContext(ShimmerQualityContext);

export function useOptimizedShimmer() {
  const [settings, setSettings] = useState<{ 
    disabled: boolean; 
    speed: 'slow' | 'normal' | 'fast' | 'ultra';
    intensity: 'low' | 'medium' | 'high' | 'ultra' | 'max';
    isDesktop: boolean;
    isAppleSilicon: boolean;
    enableAdvanced: boolean;
    fps: number;
  }>({ 
    disabled: false, 
    speed: 'slow', 
    intensity: 'medium',
    isDesktop: false,
    isAppleSilicon: false,
    enableAdvanced: false,
    fps: 60,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    
    const update = () => {
      // UPDATED 2026: All devices get desktop-quality shimmers
      const isDesktop = true; // Always enable desktop features
      const isAppleSilicon = root.classList.contains('apple-silicon') ||
                             /apple-silicon-m[1-5]/.test(root.className);
      const isUltra = root.classList.contains('perf-ultra');
      const isHigh = root.classList.contains('perf-high');
      // UPDATED 2026: All devices get 60 FPS minimum
      const fps = isAppleSilicon ? 120 : 60;
      
      // 🖥️ UPDATED 2026: All devices get full shimmer effects
      if (isUltra || isAppleSilicon) {
        setSettings({ 
          disabled: false, 
          speed: 'ultra', 
          intensity: 'max',
          isDesktop: true,
          isAppleSilicon,
          enableAdvanced: true,
          fps,
        });
      } else if (isHigh) {
        setSettings({ 
          disabled: false, 
          speed: 'fast', 
          intensity: 'ultra',
          isDesktop: true,
          isAppleSilicon,
          enableAdvanced: true,
          fps,
        });
      } else if (root.classList.contains('shimmer-quality-disabled')) {
        setSettings({ 
          disabled: true, 
          speed: 'slow', 
          intensity: 'low', 
          isDesktop: false, 
          isAppleSilicon: false,
          enableAdvanced: false,
          fps: 30,
        });
      } else {
        // UPDATED 2026: All devices get high quality shimmers
        setSettings({ 
          disabled: false, 
          speed: 'normal', 
          intensity: 'high', 
          isDesktop: true, // UPDATED 2026: All devices treated as desktop for shimmers
          isAppleSilicon: false,
          enableAdvanced: true, // UPDATED 2026: Advanced features for all
          fps,
        });
      }
    };
    
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', update);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  
  return settings;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES - COMPLETE DESKTOP SHIMMER AESTHETIC
// ═══════════════════════════════════════════════════════════════════════════

export const ShimmerStylesProvider = memo(() => (
  <style jsx global>{`
    /* 
     * ╔═══════════════════════════════════════════════════════════════════════╗
     * ║           UNIFIED SHIMMER v10 - DESKTOP ULTRA CSS                     ║
     * ╚═══════════════════════════════════════════════════════════════════════╝
     */
    
    :root {
      --shimmer-blue: #3b82f6;
      --shimmer-blue-light: #93c5fd;
      --shimmer-cyan: #06b6d4;
      --shimmer-purple: #8b5cf6;
      --shimmer-pink: #ec4899;
      --shimmer-gold: #f59e0b;
      --shimmer-green: #10b981;
      --accent-rgb: 59, 130, 246;
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       KEYFRAME ANIMATIONS - MOBILE (Battery Efficient)
       ═══════════════════════════════════════════════════════════════════════ */
    
    /* Basic sweep - slow for mobile */
    @keyframes shimmer-ltr { 
      0% { transform: translateX(-100%); opacity: 0; } 
      50% { opacity: 1; } 
      100% { transform: translateX(200%); opacity: 0; } 
    }
    
    /* Basic glow pulse */
    @keyframes shimmer-glow { 
      0%, 100% { 
        box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3), 
                    0 0 30px rgba(var(--accent-rgb), 0.15); 
      } 
      50% { 
        box-shadow: 0 0 35px rgba(var(--accent-rgb), 0.6), 
                    0 0 60px rgba(var(--accent-rgb), 0.35); 
      } 
    }
    
    /* Text glow */
    @keyframes shimmer-text-glow { 
      0%, 100% { text-shadow: 0 0 8px rgba(var(--accent-rgb), 0.4); } 
      50% { text-shadow: 0 0 20px rgba(var(--accent-rgb), 0.8), 0 0 30px rgba(var(--accent-rgb), 0.5); } 
    }
    
    /* Border glow */
    @keyframes shimmer-border-glow { 
      0%, 100% { 
        box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.3), 
                    0 0 10px rgba(var(--accent-rgb), 0.2); 
      } 
      50% { 
        box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.6), 
                    0 0 25px rgba(var(--accent-rgb), 0.4); 
      } 
    }
    
    /* Conic rotation */
    @keyframes shimmer-conic-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Ping animation */
    @keyframes shimmer-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       KEYFRAME ANIMATIONS - DESKTOP ULTRA EXCLUSIVE
       ═══════════════════════════════════════════════════════════════════════ */
    
    /* 🖥️ ULTRA GLOW - Intense multi-layer effect */
    @keyframes shimmer-glow-ultra { 
      0%, 100% { 
        box-shadow: 
          0 0 20px rgba(var(--accent-rgb), 0.5), 
          0 0 40px rgba(var(--accent-rgb), 0.3),
          0 0 60px rgba(var(--accent-rgb), 0.2),
          0 0 80px rgba(var(--accent-rgb), 0.1),
          inset 0 0 20px rgba(var(--accent-rgb), 0.15); 
      } 
      50% { 
        box-shadow: 
          0 0 40px rgba(var(--accent-rgb), 0.8), 
          0 0 80px rgba(var(--accent-rgb), 0.5),
          0 0 120px rgba(var(--accent-rgb), 0.3),
          0 0 160px rgba(var(--accent-rgb), 0.15),
          inset 0 0 40px rgba(var(--accent-rgb), 0.25); 
      } 
    }
    
    /* 🖥️ ULTRA BORDER */
    @keyframes shimmer-border-ultra { 
      0%, 100% { 
        box-shadow: 
          inset 0 0 0 1px rgba(var(--accent-rgb), 0.5), 
          0 0 20px rgba(var(--accent-rgb), 0.4),
          0 0 40px rgba(var(--accent-rgb), 0.2); 
      } 
      50% { 
        box-shadow: 
          inset 0 0 0 2px rgba(var(--accent-rgb), 0.8), 
          0 0 50px rgba(var(--accent-rgb), 0.6),
          0 0 80px rgba(var(--accent-rgb), 0.35); 
      } 
    }
    
    /* 🖥️ AURORA - Multi-color flowing gradient */
    @keyframes shimmer-aurora {
      0% {
        background-position: 0% 50%;
        filter: hue-rotate(0deg);
      }
      50% {
        background-position: 100% 50%;
        filter: hue-rotate(30deg);
      }
      100% {
        background-position: 0% 50%;
        filter: hue-rotate(0deg);
      }
    }
    
    /* 🖥️ WAVE - Undulating motion */
    @keyframes shimmer-wave {
      0% { 
        transform: translateY(0) scaleY(1);
        opacity: 0.8;
      }
      25% { 
        transform: translateY(-3px) scaleY(1.02);
        opacity: 1;
      }
      50% { 
        transform: translateY(0) scaleY(1);
        opacity: 0.8;
      }
      75% { 
        transform: translateY(3px) scaleY(0.98);
        opacity: 1;
      }
      100% { 
        transform: translateY(0) scaleY(1);
        opacity: 0.8;
      }
    }
    
    /* 🖥️ PULSE - Rhythmic intensity */
    @keyframes shimmer-pulse-intense {
      0%, 100% { 
        opacity: 0.6;
        transform: scale(1);
      }
      50% { 
        opacity: 1;
        transform: scale(1.02);
      }
    }
    
    /* 🖥️ RADIAL EXPANSION */
    @keyframes shimmer-radial-expand {
      0% { 
        transform: scale(0.98);
        box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.6);
      }
      50% {
        box-shadow: 0 0 60px 20px rgba(var(--accent-rgb), 0.3);
      }
      100% { 
        transform: scale(1.02);
        box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0);
      }
    }
    
    /* 🖥️ PRISM - Rainbow refraction */
    @keyframes shimmer-prism {
      0% {
        background-position: 0% 50%;
        box-shadow: 
          0 0 20px rgba(239, 68, 68, 0.3),
          0 0 40px rgba(var(--accent-rgb), 0.2);
      }
      33% {
        background-position: 50% 50%;
        box-shadow: 
          0 0 20px rgba(16, 185, 129, 0.3),
          0 0 40px rgba(var(--accent-rgb), 0.2);
      }
      66% {
        background-position: 100% 50%;
        box-shadow: 
          0 0 20px rgba(139, 92, 246, 0.3),
          0 0 40px rgba(var(--accent-rgb), 0.2);
      }
      100% {
        background-position: 0% 50%;
        box-shadow: 
          0 0 20px rgba(239, 68, 68, 0.3),
          0 0 40px rgba(var(--accent-rgb), 0.2);
      }
    }
    
    /* 🖥️ NEON - High contrast edge */
    @keyframes shimmer-neon {
      0%, 100% {
        box-shadow: 
          0 0 5px rgba(var(--accent-rgb), 0.8),
          0 0 10px rgba(var(--accent-rgb), 0.6),
          0 0 20px rgba(var(--accent-rgb), 0.4),
          0 0 40px rgba(var(--accent-rgb), 0.2),
          inset 0 0 5px rgba(var(--accent-rgb), 0.1);
        border-color: rgba(var(--accent-rgb), 0.8);
      }
      50% {
        box-shadow: 
          0 0 10px rgba(var(--accent-rgb), 1),
          0 0 20px rgba(var(--accent-rgb), 0.8),
          0 0 40px rgba(var(--accent-rgb), 0.6),
          0 0 80px rgba(var(--accent-rgb), 0.4),
          inset 0 0 10px rgba(var(--accent-rgb), 0.2);
        border-color: rgba(var(--accent-rgb), 1);
      }
    }
    
    /* 🖥️ PLASMA - Organic flow */
    @keyframes shimmer-plasma {
      0% {
        background-position: 0% 0%;
        filter: brightness(1) saturate(1.2);
      }
      25% {
        background-position: 100% 0%;
        filter: brightness(1.1) saturate(1.3);
      }
      50% {
        background-position: 100% 100%;
        filter: brightness(1) saturate(1.2);
      }
      75% {
        background-position: 0% 100%;
        filter: brightness(1.1) saturate(1.3);
      }
      100% {
        background-position: 0% 0%;
        filter: brightness(1) saturate(1.2);
      }
    }
    
    /* 🖥️ HOLOGRAM - Iridescent */
    @keyframes shimmer-hologram {
      0% {
        background-position: 0% 50%;
        opacity: 0.8;
        filter: hue-rotate(0deg) brightness(1);
      }
      25% {
        opacity: 1;
        filter: hue-rotate(90deg) brightness(1.1);
      }
      50% {
        background-position: 100% 50%;
        opacity: 0.8;
        filter: hue-rotate(180deg) brightness(1);
      }
      75% {
        opacity: 1;
        filter: hue-rotate(270deg) brightness(1.1);
      }
      100% {
        background-position: 0% 50%;
        opacity: 0.8;
        filter: hue-rotate(360deg) brightness(1);
      }
    }
    
    /* 🖥️ SPARK - Particle burst */
    @keyframes shimmer-spark {
      0% {
        box-shadow: 
          0 0 0 0 rgba(var(--accent-rgb), 0.8),
          10px 10px 0 0 rgba(var(--accent-rgb), 0),
          -10px -10px 0 0 rgba(var(--accent-rgb), 0),
          10px -10px 0 0 rgba(var(--accent-rgb), 0),
          -10px 10px 0 0 rgba(var(--accent-rgb), 0);
      }
      50% {
        box-shadow: 
          0 0 20px 5px rgba(var(--accent-rgb), 0.6),
          30px 30px 10px 0 rgba(var(--accent-rgb), 0.4),
          -30px -30px 10px 0 rgba(var(--accent-rgb), 0.4),
          30px -30px 10px 0 rgba(var(--accent-rgb), 0.4),
          -30px 30px 10px 0 rgba(var(--accent-rgb), 0.4);
      }
      100% {
        box-shadow: 
          0 0 0 0 rgba(var(--accent-rgb), 0),
          60px 60px 0 0 rgba(var(--accent-rgb), 0),
          -60px -60px 0 0 rgba(var(--accent-rgb), 0),
          60px -60px 0 0 rgba(var(--accent-rgb), 0),
          -60px 60px 0 0 rgba(var(--accent-rgb), 0);
      }
    }
    
    /* 🖥️ SPOTLIGHT - Moving highlight */
    @keyframes shimmer-spotlight {
      0% {
        background-position: -200% 0%;
      }
      100% {
        background-position: 200% 0%;
      }
    }
    
    /* 🖥️ RIPPLE - Water effect */
    @keyframes shimmer-ripple {
      0% {
        box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.6);
      }
      100% {
        box-shadow: 0 0 0 30px rgba(var(--accent-rgb), 0);
      }
    }
    
    /* 🖥️ LASER - Sharp line */
    @keyframes shimmer-laser {
      0% {
        transform: translateX(-100%) rotate(-45deg);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: translateX(200%) rotate(-45deg);
        opacity: 0;
      }
    }
    
    /* 🖥️ GRADIENT FLOW */
    @keyframes shimmer-gradient-flow {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    
    /* 🖥️ MORPH - Shape shifting */
    @keyframes shimmer-morph {
      0%, 100% {
        border-radius: 60% 40% 30% 70%/60% 30% 70% 40%;
      }
      25% {
        border-radius: 30% 60% 70% 40%/50% 60% 30% 60%;
      }
      50% {
        border-radius: 50% 60% 30% 60%/30% 70% 40% 60%;
      }
      75% {
        border-radius: 40% 60% 50% 40%/60% 40% 60% 50%;
      }
    }
    
    /* 🖥️ MATRIX - Digital rain */
    @keyframes shimmer-matrix {
      0% {
        background-position: 0% -100%;
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        background-position: 0% 200%;
        opacity: 0;
      }
    }
    
    /* 🖥️ BREATHE - Subtle scaling */
    @keyframes shimmer-breathe {
      0%, 100% {
        transform: scale(1);
        opacity: 0.9;
      }
      50% {
        transform: scale(1.01);
        opacity: 1;
      }
    }
    
    /* 🖥️ FLOAT - Gentle movement */
    @keyframes shimmer-float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }
    
    /* 🖥️ ELECTRIC - Lightning effect */
    @keyframes shimmer-electric {
      0%, 100% {
        filter: brightness(1) drop-shadow(0 0 2px rgba(var(--accent-rgb), 0.8));
      }
      10% {
        filter: brightness(1.3) drop-shadow(0 0 8px rgba(var(--accent-rgb), 1));
      }
      20% {
        filter: brightness(1) drop-shadow(0 0 2px rgba(var(--accent-rgb), 0.8));
      }
      30% {
        filter: brightness(1.2) drop-shadow(0 0 6px rgba(var(--accent-rgb), 1));
      }
      40% {
        filter: brightness(1) drop-shadow(0 0 2px rgba(var(--accent-rgb), 0.8));
      }
    }
    
    /* 🖥️ SHIMMER SLIDE - Premium sweep */
    @keyframes shimmer-slide {
      0% {
        transform: translateX(-100%) skewX(-15deg);
      }
      100% {
        transform: translateX(200%) skewX(-15deg);
      }
    }
    
    /* 🖥️ ORBIT - Circular motion */
    @keyframes shimmer-orbit {
      0% {
        transform: rotate(0deg) translateX(10px) rotate(0deg);
      }
      100% {
        transform: rotate(360deg) translateX(10px) rotate(-360deg);
      }
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       BASE CSS CLASSES - ALL DEVICES
       ═══════════════════════════════════════════════════════════════════════ */
    
    .shimmer-gpu {
      transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    .shimmer-sweep { 
      animation: shimmer-ltr 6s ease-in-out infinite; 
      background: linear-gradient(
        90deg, 
        transparent 0%, 
        rgba(var(--accent-rgb), 0.3) 25%, 
        rgba(var(--accent-rgb), 0.8) 50%, 
        rgba(var(--accent-rgb), 0.3) 75%, 
        transparent 100%
      ); 
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
      border: 1px solid rgba(var(--accent-rgb), 0.4); 
    }
    
    .shimmer-card { 
      animation: shimmer-glow 5s ease-in-out infinite; 
      background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(10,20,40,0.95) 100%); 
      border: 1px solid rgba(var(--accent-rgb), 0.3); 
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
      background: linear-gradient(
        90deg, 
        transparent, 
        rgba(var(--accent-rgb), 0.2), 
        rgba(var(--accent-rgb), 0.4), 
        rgba(var(--accent-rgb), 0.2), 
        transparent
      ); 
      pointer-events: none; 
    }
    
    .shimmer-section { 
      position: relative; 
      animation: shimmer-glow 6s ease-in-out infinite; 
    }
    
    .shimmer-bg { 
      background: linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(10,20,50,0.98) 50%, rgba(0,0,0,1) 100%); 
    }
    
    .shimmer-ping {
      animation: shimmer-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
      background-color: var(--accent-color, #3b82f6);
    }
    
    .shimmer-conic-border {
      background: conic-gradient(
        from 0deg at 50% 50%,
        var(--shimmer-blue) 0%,
        rgba(var(--accent-rgb), 0.3) 25%,
        var(--shimmer-blue) 50%,
        rgba(var(--accent-rgb), 0.3) 75%,
        var(--shimmer-blue) 100%
      );
      animation: shimmer-conic-rotate 4s linear infinite;
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       🖥️ DESKTOP EXCLUSIVE CLASSES
       These activate ONLY on desktop devices
       ═══════════════════════════════════════════════════════════════════════ */
    
    /* AURORA - Multi-color flowing */
    .shimmer-aurora {
      background: linear-gradient(
        135deg,
        var(--shimmer-blue) 0%,
        var(--shimmer-cyan) 25%,
        var(--shimmer-purple) 50%,
        var(--shimmer-pink) 75%,
        var(--shimmer-blue) 100%
      );
      background-size: 400% 400%;
      animation: shimmer-aurora 8s ease infinite;
      -webkit-background-clip: text;
      background-clip: text;
    }
    
    /* WAVE - Undulating effect */
    .shimmer-wave {
      animation: shimmer-wave 3s ease-in-out infinite;
    }
    
    /* RADIAL - Expanding glow */
    .shimmer-radial {
      animation: shimmer-radial-expand 4s ease-in-out infinite;
    }
    
    /* PRISM - Rainbow refraction */
    .shimmer-prism {
      background: linear-gradient(
        90deg,
        var(--shimmer-pink) 0%,
        var(--shimmer-purple) 20%,
        var(--shimmer-blue) 40%,
        var(--shimmer-cyan) 60%,
        var(--shimmer-green) 80%,
        var(--shimmer-pink) 100%
      );
      background-size: 200% 200%;
      animation: shimmer-prism 6s ease infinite;
    }
    
    /* NEON - High contrast */
    .shimmer-neon {
      border: 1px solid rgba(var(--accent-rgb), 0.6);
      animation: shimmer-neon 2s ease-in-out infinite;
    }
    
    /* PLASMA - Organic flow */
    .shimmer-plasma {
      background: radial-gradient(
        ellipse at 20% 80%,
        var(--shimmer-purple) 0%,
        transparent 50%
      ),
      radial-gradient(
        ellipse at 80% 20%,
        var(--shimmer-cyan) 0%,
        transparent 50%
      ),
      radial-gradient(
        ellipse at 40% 40%,
        var(--shimmer-blue) 0%,
        transparent 60%
      ),
      linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(10,20,40,0.95) 100%);
      background-size: 100% 100%;
      animation: shimmer-plasma 10s ease infinite;
    }
    
    /* HOLOGRAM - Iridescent */
    .shimmer-hologram {
      background: linear-gradient(
        135deg,
        rgba(var(--accent-rgb), 0.2) 0%,
        rgba(6, 182, 212, 0.2) 25%,
        rgba(139, 92, 246, 0.2) 50%,
        rgba(236, 72, 153, 0.2) 75%,
        rgba(var(--accent-rgb), 0.2) 100%
      );
      background-size: 200% 200%;
      animation: shimmer-hologram 5s ease infinite;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    
    /* SPARK - Particle burst */
    .shimmer-spark {
      animation: shimmer-spark 3s ease-in-out infinite;
    }
    
    /* SPOTLIGHT - Moving highlight */
    .shimmer-spotlight {
      background: linear-gradient(
        90deg,
        transparent 0%,
        transparent 40%,
        rgba(255,255,255,0.1) 50%,
        transparent 60%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: shimmer-spotlight 3s ease infinite;
    }
    
    /* RIPPLE - Water effect */
    .shimmer-ripple {
      animation: shimmer-ripple 1.5s ease-out infinite;
    }
    
    /* LASER - Sharp line */
    .shimmer-laser::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(var(--accent-rgb), 0.8),
        white,
        rgba(var(--accent-rgb), 0.8),
        transparent
      );
      animation: shimmer-laser 2s ease-in-out infinite;
    }
    
    /* GRADIENT FLOW */
    .shimmer-gradient-flow {
      background: linear-gradient(
        -45deg,
        var(--shimmer-blue) 0%,
        var(--shimmer-cyan) 25%,
        var(--shimmer-purple) 50%,
        var(--shimmer-blue) 100%
      );
      background-size: 400% 400%;
      animation: shimmer-gradient-flow 8s ease infinite;
    }
    
    /* MORPH - Shape shifting */
    .shimmer-morph {
      animation: shimmer-morph 8s ease-in-out infinite;
    }
    
    /* MATRIX - Digital rain */
    .shimmer-matrix {
      background: repeating-linear-gradient(
        180deg,
        rgba(var(--accent-rgb), 0.8) 0px,
        rgba(var(--accent-rgb), 0.4) 2px,
        transparent 4px,
        transparent 8px
      );
      background-size: 100% 200%;
      animation: shimmer-matrix 4s linear infinite;
    }
    
    /* BREATHE - Subtle scaling */
    .shimmer-breathe {
      animation: shimmer-breathe 4s ease-in-out infinite;
    }
    
    /* FLOAT - Gentle movement */
    .shimmer-float {
      animation: shimmer-float 3s ease-in-out infinite;
    }
    
    /* ELECTRIC - Lightning flicker */
    .shimmer-electric {
      animation: shimmer-electric 2s ease-in-out infinite;
    }
    
    /* SLIDE - Premium sweep */
    .shimmer-slide::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: shimmer-slide 3s ease-in-out infinite;
    }
    
    /* ORBIT - Circular glow */
    .shimmer-orbit::before {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: var(--shimmer-blue);
      border-radius: 50%;
      box-shadow: 0 0 20px var(--shimmer-blue);
      animation: shimmer-orbit 4s linear infinite;
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       🖥️ DESKTOP MODE OVERRIDES - Full power unlocked
       ═══════════════════════════════════════════════════════════════════════ */
    
    .desktop-mode .shimmer-sweep,
    .perf-ultra .shimmer-sweep,
    .apple-silicon .shimmer-sweep { 
      animation-duration: 2.5s !important; 
    }
    
    .desktop-mode .shimmer-glow,
    .perf-ultra .shimmer-glow,
    .apple-silicon .shimmer-glow { 
      animation: shimmer-glow-ultra 2.5s ease-in-out infinite !important; 
    }
    
    .desktop-mode .shimmer-border,
    .perf-ultra .shimmer-border,
    .apple-silicon .shimmer-border { 
      animation: shimmer-border-ultra 2s ease-in-out infinite !important; 
    }
    
    .desktop-mode .shimmer-conic-border,
    .perf-ultra .shimmer-conic-border,
    .apple-silicon .shimmer-conic-border { 
      animation-duration: 1.5s !important; 
    }
    
    .desktop-mode .shimmer-card,
    .perf-ultra .shimmer-card,
    .apple-silicon .shimmer-card { 
      animation: shimmer-glow-ultra 3s ease-in-out infinite !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    
    .desktop-mode .shimmer-button::before,
    .perf-ultra .shimmer-button::before,
    .apple-silicon .shimmer-button::before { 
      animation-duration: 1.5s !important;
      background: linear-gradient(
        90deg, 
        transparent, 
        rgba(var(--accent-rgb), 0.4), 
        rgba(var(--accent-rgb), 0.7), 
        rgba(var(--accent-rgb), 0.4), 
        transparent
      ) !important; 
    }
    
    .desktop-mode .shimmer-neon,
    .perf-ultra .shimmer-neon,
    .apple-silicon .shimmer-neon {
      animation-duration: 1.5s !important;
    }
    
    .desktop-mode .shimmer-aurora,
    .perf-ultra .shimmer-aurora,
    .apple-silicon .shimmer-aurora {
      animation-duration: 5s !important;
    }
    
    .desktop-mode .shimmer-plasma,
    .perf-ultra .shimmer-plasma,
    .apple-silicon .shimmer-plasma {
      animation-duration: 6s !important;
    }
    
    .desktop-mode .shimmer-hologram,
    .perf-ultra .shimmer-hologram,
    .apple-silicon .shimmer-hologram {
      animation-duration: 3s !important;
    }
    
    .desktop-mode .shimmer-prism,
    .perf-ultra .shimmer-prism,
    .apple-silicon .shimmer-prism {
      animation-duration: 4s !important;
    }
    
    /* 🍎 APPLE SILICON - 120Hz ProMotion optimized */
    .apple-silicon .shimmer-sweep,
    .apple-silicon .shimmer-glow,
    .apple-silicon .shimmer-border,
    .apple-silicon .shimmer-neon,
    .apple-silicon .shimmer-aurora,
    .apple-silicon .shimmer-plasma,
    .apple-silicon .shimmer-hologram {
      animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1) !important;
    }
    
    /* Apple Silicon M1-M5 specific enhancements */
    .apple-silicon-m3 .shimmer-glow,
    .apple-silicon-m4 .shimmer-glow,
    .apple-silicon-m5 .shimmer-glow {
      animation: shimmer-glow-ultra 2s ease-in-out infinite !important;
    }
    
    .apple-silicon-m3 .shimmer-card,
    .apple-silicon-m4 .shimmer-card,
    .apple-silicon-m5 .shimmer-card {
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
    }
    
    /* HIGH mode */
    .perf-high .shimmer-sweep { 
      animation-duration: 3.5s !important; 
    }
    .perf-high .shimmer-glow { 
      animation-duration: 3s !important; 
    }
    .perf-high .shimmer-border { 
      animation-duration: 2.5s !important; 
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       📱 MOBILE OPTIMIZATIONS - Battery efficient
       ═══════════════════════════════════════════════════════════════════════ */
    
    @media (max-width: 768px) { 
      .shimmer-sweep { animation-duration: 8s !important; } 
      .shimmer-glow, .shimmer-border { animation-duration: 6s !important; } 
      .shimmer-conic-border { animation-duration: 8s !important; }
      
      /* Disable advanced effects on mobile */
      .shimmer-aurora,
      .shimmer-plasma,
      .shimmer-hologram,
      .shimmer-spark,
      .shimmer-morph,
      .shimmer-matrix,
      .shimmer-electric,
      .shimmer-slide,
      .shimmer-orbit {
        animation: none !important;
        background: rgba(var(--accent-rgb), 0.1) !important;
      }
      
      .shimmer-neon {
        animation: shimmer-border-glow 6s ease-in-out infinite !important;
      }
      
      .shimmer-prism {
        animation: shimmer-glow 6s ease-in-out infinite !important;
        background: rgba(var(--accent-rgb), 0.2) !important;
      }
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       🖥️ BIG DISPLAYS (1440px+) - Maximum quality
       ═══════════════════════════════════════════════════════════════════════ */
    
    @media (min-width: 1440px) {
      .shimmer-sweep { animation-duration: 3s !important; }
      .shimmer-glow { animation-duration: 2.5s !important; }
      .shimmer-border { animation-duration: 2s !important; }
      
      .shimmer-card {
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
      }
    }
    
    /* 4K+ displays */
    @media (min-width: 2560px) {
      .shimmer-glow {
        animation: shimmer-glow-ultra 2s ease-in-out infinite !important;
      }
      
      .shimmer-card {
        backdrop-filter: blur(32px) saturate(150%);
        -webkit-backdrop-filter: blur(32px) saturate(150%);
      }
    }
    
    /* ═══════════════════════════════════════════════════════════════════════
       ACCESSIBILITY - Reduced motion
       ═══════════════════════════════════════════════════════════════════════ */
    
    @media (prefers-reduced-motion: reduce) { 
      .shimmer-sweep, .shimmer-glow, .shimmer-text, .shimmer-border, 
      .shimmer-button::before, .shimmer-conic-border, .shimmer-radial,
      .shimmer-aurora, .shimmer-wave, .shimmer-pulse-effect,
      .shimmer-prism, .shimmer-neon, .shimmer-plasma, .shimmer-hologram,
      .shimmer-spark, .shimmer-spotlight, .shimmer-ripple, .shimmer-laser,
      .shimmer-gradient-flow, .shimmer-morph, .shimmer-matrix,
      .shimmer-breathe, .shimmer-float, .shimmer-electric,
      .shimmer-slide, .shimmer-orbit { 
        animation: none !important; 
      } 
    }
  `}</style>
));
ShimmerStylesProvider.displayName = 'ShimmerStylesProvider';

// ═══════════════════════════════════════════════════════════════════════════
// SHIMMER COMPONENTS - All Variants
// ═══════════════════════════════════════════════════════════════════════════

type ShimmerProps = { 
  className?: string; 
  disabled?: boolean; 
  children?: React.ReactNode;
  color?: string;
  intensity?: 'low' | 'medium' | 'high' | 'ultra' | 'max';
  speed?: 'slow' | 'normal' | 'fast' | 'ultra';
  size?: number;
  delay?: number;
};

// ───────────────────────────────────────────────────────────────────────────
// CORE COMPONENTS
// ───────────────────────────────────────────────────────────────────────────

/** Left-to-right gradient sweep line */
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

/** Glowing border effect */
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

/** Pulsing glow effect */
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

// ───────────────────────────────────────────────────────────────────────────
// COMPOSITE COMPONENTS
// ───────────────────────────────────────────────────────────────────────────

/** Card with glow and gradient background */
export const ShimmerCard = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-card shimmer-gpu relative rounded-xl p-4 ${className}`}>
    {!disabled && <ShimmerLine />}
    {!disabled && <ShimmerBorder />}
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerCard.displayName = 'ShimmerCard';

/** Button with border glow and sweep */
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

// ───────────────────────────────────────────────────────────────────────────
// 🖥️ DESKTOP EXCLUSIVE COMPONENTS
// ───────────────────────────────────────────────────────────────────────────

/** Aurora - Multi-color flowing gradient (Desktop only) */
export const ShimmerAurora = memo(({ children, className = '', disabled = false }: ShimmerProps) => {
  const { isDesktop } = useOptimizedShimmer();
  if (disabled || !isDesktop) return <>{children}</>;
  return (
    <div className={`shimmer-aurora shimmer-gpu relative ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
});
ShimmerAurora.displayName = 'ShimmerAurora';

/** Neon - High contrast edge glow */
export const ShimmerNeon = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-neon shimmer-gpu relative rounded-xl ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerNeon.displayName = 'ShimmerNeon';

/** Prism - Rainbow refraction effect */
export const ShimmerPrism = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-prism shimmer-gpu relative rounded-xl p-4 ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerPrism.displayName = 'ShimmerPrism';

/** Plasma - Organic flowing pattern */
export const ShimmerPlasma = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-plasma shimmer-gpu relative rounded-xl p-4 ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerPlasma.displayName = 'ShimmerPlasma';

/** Hologram - Iridescent surface */
export const ShimmerHologram = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-hologram shimmer-gpu relative rounded-xl p-4 ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerHologram.displayName = 'ShimmerHologram';

/** Wave - Undulating motion */
export const ShimmerWave = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-wave shimmer-glow shimmer-gpu relative ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerWave.displayName = 'ShimmerWave';

/** Radial - Expanding glow effect */
export const ShimmerRadial = memo(({ children, className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return <>{children}</>;
  return (
    <div className={`shimmer-radial shimmer-gpu relative ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
});
ShimmerRadial.displayName = 'ShimmerRadial';

/** Spark - Particle burst effect */
export const ShimmerSpark = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-spark shimmer-gpu relative ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerSpark.displayName = 'ShimmerSpark';

/** Spotlight - Moving highlight effect */
export const ShimmerSpotlight = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-spotlight shimmer-gpu relative overflow-hidden ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerSpotlight.displayName = 'ShimmerSpotlight';

/** Ripple - Water ripple effect */
export const ShimmerRipple = memo(({ className = '', disabled = false }: ShimmerProps) => {
  if (disabled) return null;
  return (
    <div 
      className={`shimmer-ripple shimmer-gpu absolute inset-0 rounded-full pointer-events-none ${className}`}
      style={{ borderRadius: 'inherit' }}
    />
  );
});
ShimmerRipple.displayName = 'ShimmerRipple';

/** Laser - Sharp line sweep */
export const ShimmerLaser = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-laser shimmer-gpu relative overflow-hidden ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerLaser.displayName = 'ShimmerLaser';

/** Gradient Flow - Smooth gradient animation */
export const ShimmerGradientFlow = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-gradient-flow shimmer-gpu relative rounded-xl p-4 ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerGradientFlow.displayName = 'ShimmerGradientFlow';

/** Morph - Shape-shifting border */
export const ShimmerMorph = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-morph shimmer-glow shimmer-gpu relative p-4 ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerMorph.displayName = 'ShimmerMorph';

/** Matrix - Digital rain effect */
export const ShimmerMatrix = memo(({ className = '', disabled = false, children }: ShimmerProps) => (
  <div className={`shimmer-matrix shimmer-gpu relative overflow-hidden ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerMatrix.displayName = 'ShimmerMatrix';

/** Breathe - Subtle scaling animation */
export const ShimmerBreathe = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-breathe shimmer-glow shimmer-gpu relative ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerBreathe.displayName = 'ShimmerBreathe';

/** Float - Gentle floating animation */
export const ShimmerFloat = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-float shimmer-glow shimmer-gpu relative ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerFloat.displayName = 'ShimmerFloat';

/** Electric - Lightning flicker effect */
export const ShimmerElectric = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-electric shimmer-gpu relative ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerElectric.displayName = 'ShimmerElectric';

/** Slide - Premium sweep overlay */
export const ShimmerSlide = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-slide shimmer-gpu relative overflow-hidden ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerSlide.displayName = 'ShimmerSlide';

/** Orbit - Circular glow animation */
export const ShimmerOrbit = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className={`shimmer-orbit shimmer-gpu relative ${className}`}>
    <div className="relative z-10">{children}</div>
  </div>
));
ShimmerOrbit.displayName = 'ShimmerOrbit';

// ───────────────────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ───────────────────────────────────────────────────────────────────────────

/** Conic rotating border */
export const ShimmerConic = memo(({ children, className = '', disabled = false }: ShimmerProps) => (
  <div className="relative p-[1px] overflow-hidden rounded-xl">
    {!disabled && <div className="shimmer-conic-border shimmer-gpu absolute inset-0 rounded-xl" />}
    <div className={`relative z-10 bg-black rounded-xl ${className}`}>
      {children}
    </div>
  </div>
));
ShimmerConic.displayName = 'ShimmerConic';

/** Animated dot */
export const ShimmerDot = memo(({ className = '', delay = 0 }: ShimmerProps) => (
  <span 
    className={`shimmer-glow w-2 h-2 rounded-full ${className}`} 
    style={{ animationDelay: `${delay}s`, backgroundColor: 'var(--accent-color, #3b82f6)' }}
  />
));
ShimmerDot.displayName = 'ShimmerDot';

/** Loading spinner */
export const ShimmerSpinner = memo(({ className = '', size = 32 }: ShimmerProps) => (
  <div 
    className={`shimmer-glow rounded-full flex items-center justify-center ${className}`} 
    style={{ width: size, height: size, border: '2px solid rgba(var(--accent-rgb), 0.5)' }}
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
));
ShimmerSpinner.displayName = 'ShimmerSpinner';

/** Pulse indicator */
export const ShimmerPulse = memo(({ className = '', size = 8 }: ShimmerProps) => (
  <span className="relative flex">
    <span 
      className={`shimmer-ping absolute inline-flex rounded-full opacity-75 ${className}`}
      style={{ width: size, height: size }}
    />
    <span 
      className={`relative inline-flex rounded-full bg-blue-500 ${className}`}
      style={{ width: size, height: size }}
    />
  </span>
));
ShimmerPulse.displayName = 'ShimmerPulse';

// ───────────────────────────────────────────────────────────────────────────
// LEGACY EXPORTS (Backward Compatibility)
// ───────────────────────────────────────────────────────────────────────────

export const ShimmerGlide = ShimmerLine;
export const ShimmerStreak = ShimmerLine;
export const ShimmerGlowBorder = ShimmerBorder;
export const ShimmerRadialGlow = ShimmerRadial;
export const ShimmerShineBurst = ShimmerSpark;

// ───────────────────────────────────────────────────────────────────────────
// UNIFIED API
// ───────────────────────────────────────────────────────────────────────────

const componentMap: Record<string, React.FC<ShimmerProps>> = {
  // Core
  line: ShimmerLine,
  border: ShimmerBorder,
  glow: ShimmerGlow,
  text: ShimmerText,
  // Composite
  card: ShimmerCard,
  button: ShimmerButton,
  section: ShimmerSection,
  container: ShimmerContainer,
  // Desktop Exclusive
  aurora: ShimmerAurora,
  neon: ShimmerNeon,
  prism: ShimmerPrism,
  plasma: ShimmerPlasma,
  hologram: ShimmerHologram,
  wave: ShimmerWave,
  radial: ShimmerRadial,
  spark: ShimmerSpark,
  spotlight: ShimmerSpotlight,
  ripple: ShimmerRipple,
  laser: ShimmerLaser,
  'gradient-flow': ShimmerGradientFlow,
  morph: ShimmerMorph,
  matrix: ShimmerMatrix,
  breathe: ShimmerBreathe,
  float: ShimmerFloat,
  electric: ShimmerElectric,
  slide: ShimmerSlide,
  orbit: ShimmerOrbit,
  conic: ShimmerConic,
  // Utilities
  pulse: ShimmerPulse,
  dot: ShimmerDot,
  spinner: ShimmerSpinner,
};

/** Unified Shimmer - variant-based API */
export const UnifiedShimmer = memo(({ variant, ...props }: { variant: ShimmerVariant | string } & ShimmerProps) => {
  const Component = componentMap[variant] || ShimmerGlow;
  return <Component {...props} />;
});
UnifiedShimmer.displayName = 'UnifiedShimmer';

export default UnifiedShimmer;
