"use client";

import React, { memo, useEffect, useMemo, createContext, useContext, useState } from 'react';

/**
 * Unified Shimmer System v4 - ENHANCED
 * 
 * THE SINGLE SOURCE OF TRUTH FOR ALL SHIMMER EFFECTS
 * All components must use this for shimmer animations.
 * 
 * This component provides a unified, optimized shimmer implementation
 * to reduce lag from multiple shimmer animations across the app.
 * 
 * Features:
 * ✓ ALL shimmers animate LEFT-TO-RIGHT consistently (NO SPINNING)
 * ✓ CSS animations with will-change hints for GPU acceleration
 * ✓ All shimmers synced to reduce repaints
 * ✓ Integrates with FpsOptimizer for device-aware quality
 * ✓ Automatic degradation when FPS drops
 * ✓ Enhanced aesthetic with vibrant gradients and glow effects
 * ✓ NO circles on low-end devices (fixed with CSS)
 * ✓ Mobile-optimized animations (slower for battery)
 * ✓ Wave, ripple, and gradient animations
 * 
 * NEW IN v4:
 * - ShimmerWave - Wave effect animations
 * - ShimmerRipple - Expanding ripple effect
 * - Enhanced gradient support with multiple colors
 * - Automatic device tier detection
 * - CSS-based circle rendering (no rounded-full on low FPS)
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
       UNIFIED SHIMMER KEYFRAMES v5 - ENHANCED AESTHETIC WITH GLOW
       All shimmer animations in one place for consistent performance
       Now includes wave, ripple, gradient sweep, and enhanced glow effects
       ALL ANIMATIONS ARE LEFT-TO-RIGHT - NO SPINNING
       ================================================================= */

    /* PRIMARY: Enhanced left-to-right shimmer with trailing glow */
    @keyframes unified-shimmer-ltr {
      0% {
        transform: translateX(-100%);
        opacity: 0;
        filter: blur(0px);
      }
      10% {
        opacity: 0.3;
        filter: blur(0px);
      }
      30% {
        opacity: 0.7;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
      }
      50% {
        opacity: 1;
        filter: drop-shadow(0 0 12px rgba(147, 197, 253, 0.8));
      }
      70% {
        opacity: 0.7;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
      }
      90% {
        opacity: 0.3;
        filter: blur(0px);
      }
      100% {
        transform: translateX(200%);
        opacity: 0;
        filter: blur(0px);
      }
    }

    /* LEFT-TO-RIGHT Border shimmer - enhanced with pulsing glow */
    @keyframes unified-border-ltr {
      0% {
        background-position: -200% 0;
        filter: drop-shadow(0 0 0 rgba(59, 130, 246, 0));
      }
      25% {
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
      }
      50% {
        filter: drop-shadow(0 0 20px rgba(147, 197, 253, 0.8));
      }
      75% {
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
      }
      100% {
        background-position: 200% 0;
        filter: drop-shadow(0 0 0 rgba(59, 130, 246, 0));
      }
    }

    /* Enhanced LEFT-TO-RIGHT sweep with soft glow trail */
    @keyframes unified-sweep-ltr {
      0% {
        transform: translateX(-100%);
        opacity: 0;
      }
      15% {
        opacity: 0.4;
      }
      35% {
        opacity: 0.8;
        filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
      }
      50% {
        opacity: 1;
        filter: drop-shadow(0 0 15px rgba(147, 197, 253, 0.9));
      }
      65% {
        opacity: 0.8;
        filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
      }
      85% {
        opacity: 0.4;
      }
      100% {
        transform: translateX(200%);
        opacity: 0;
      }
    }

    /* Wave animation - smooth wave motion left to right with glow */
    @keyframes unified-wave {
      0% {
        transform: translateX(-100%) scaleY(1);
        opacity: 0;
      }
      20% {
        opacity: 0.5;
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.4));
      }
      50% {
        transform: translateX(0%) scaleY(1.15);
        opacity: 1;
        filter: drop-shadow(0 0 12px rgba(147, 197, 253, 0.8));
      }
      80% {
        opacity: 0.5;
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.4));
      }
      100% {
        transform: translateX(100%) scaleY(1);
        opacity: 0;
      }
    }

    /* Ripple animation - expanding circles with glow */
    @keyframes unified-ripple {
      0% {
        transform: scale(0);
        opacity: 1;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0.8);
      }
      50% {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
      }
      100% {
        transform: scale(4);
        opacity: 0;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0);
      }
    }

    /* Gradient wave - combines color shift with LEFT TO RIGHT movement */
    @keyframes unified-gradient-wave {
      0% {
        background-position: 0% 50%;
        transform: translateX(-100%);
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.3));
      }
      50% {
        background-position: 100% 50%;
        transform: translateX(0);
        filter: drop-shadow(0 0 12px rgba(147, 197, 253, 0.6));
      }
      100% {
        background-position: 0% 50%;
        transform: translateX(100%);
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.3));
      }
    }

    /* Enhanced pulse with vibrant glow */
    @keyframes unified-pulse {
      0%, 100% {
        opacity: 0.4;
        box-shadow: 0 0 5px rgba(59, 130, 246, 0.2),
                    0 0 10px rgba(59, 130, 246, 0.1);
      }
      50% {
        opacity: 0.8;
        box-shadow: 0 0 25px rgba(59, 130, 246, 0.6),
                    0 0 40px rgba(147, 197, 253, 0.4);
      }
    }

    /* Enhanced glow - more vibrant with color shift */
    @keyframes unified-glow {
      0%, 100% {
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.3),
                    0 0 30px rgba(59, 130, 246, 0.15),
                    inset 0 0 10px rgba(59, 130, 246, 0.05);
      }
      50% {
        box-shadow: 0 0 35px rgba(59, 130, 246, 0.7),
                    0 0 60px rgba(147, 197, 253, 0.4),
                    inset 0 0 15px rgba(147, 197, 253, 0.1);
      }
    }

    /* Enhanced float with glow pulse */
    @keyframes unified-float {
      0%, 100% {
        transform: translateY(0);
        opacity: 0.8;
        filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.3));
      }
      50% {
        transform: translateY(-8px);
        opacity: 1;
        filter: drop-shadow(0 0 12px rgba(147, 197, 253, 0.6));
      }
    }

    /* Enhanced dot pulse - more prominent glow ring */
    @keyframes unified-dot-pulse {
      0%, 100% {
        opacity: 0.5;
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4),
                    0 0 5px rgba(59, 130, 246, 0.3);
      }
      50% {
        opacity: 1;
        transform: scale(1.3);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2),
                    0 0 20px rgba(147, 197, 253, 0.7);
      }
    }

    /* Enhanced ping with expanding glow ring */
    @keyframes unified-ping {
      0% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.7);
      }
      50% {
        transform: scale(2);
        opacity: 0.6;
        box-shadow: 0 0 25px rgba(147, 197, 253, 0.5);
      }
      100% {
        transform: scale(3);
        opacity: 0;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0);
      }
    }

    /* Enhanced text shimmer - vibrant gradient sweep LEFT TO RIGHT */
    @keyframes unified-text-shimmer {
      0% {
        background-position: 200% 0;
        filter: drop-shadow(0 0 0 transparent);
      }
      50% {
        filter: drop-shadow(0 0 8px rgba(147, 197, 253, 0.5));
      }
      100% {
        background-position: -200% 0;
        filter: drop-shadow(0 0 0 transparent);
      }
    }

    /* Enhanced glow sweep - LEFT TO RIGHT with bright center */
    @keyframes unified-glow-sweep {
      0% {
        background-position: -100% 0;
        opacity: 0;
      }
      15% {
        opacity: 0.2;
      }
      35% {
        opacity: 0.6;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
      }
      50% {
        opacity: 1;
        filter: drop-shadow(0 0 15px rgba(147, 197, 253, 0.8));
      }
      65% {
        opacity: 0.6;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
      }
      85% {
        opacity: 0.2;
      }
      100% {
        background-position: 100% 0;
        opacity: 0;
      }
    }

    /* Shine burst - sudden bright flash with expanding glow */
    @keyframes unified-shine-burst {
      0% {
        opacity: 0;
        transform: scale(0.8);
        box-shadow: 0 0 0 rgba(147, 197, 253, 0);
      }
      50% {
        opacity: 1;
        transform: scale(1.1);
        box-shadow: 0 0 40px rgba(147, 197, 253, 0.9),
                    0 0 60px rgba(59, 130, 246, 0.5);
      }
      100% {
        opacity: 0;
        transform: scale(0.8);
        box-shadow: 0 0 0 rgba(147, 197, 253, 0);
      }
    }

    /* NEW: Smooth glide - gentle left to right with soft edges */
    @keyframes unified-glide {
      0% {
        transform: translateX(-100%);
        opacity: 0;
      }
      20% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
        filter: drop-shadow(0 0 10px rgba(147, 197, 253, 0.7));
      }
      80% {
        opacity: 0.6;
      }
      100% {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    /* NEW: Streak - fast left to right with bright trail */
    @keyframes unified-streak {
      0% {
        transform: translateX(-100%) scaleX(0.5);
        opacity: 0;
      }
      30% {
        transform: translateX(-20%) scaleX(1.2);
        opacity: 1;
        filter: drop-shadow(0 0 15px rgba(147, 197, 253, 1));
      }
      100% {
        transform: translateX(200%) scaleX(0.5);
        opacity: 0;
      }
    }
    
    /* =================================================================
       SHIMMER CSS CLASSES v5 - ENHANCED AESTHETIC WITH GLOW
       Use these classes directly for maximum performance
       ALL LEFT-TO-RIGHT animations with vibrant glow effects
       ================================================================= */

    .shimmer-line {
      animation: unified-shimmer-ltr 8s ease-in-out infinite;
      will-change: transform, filter;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(59, 130, 246, 0.4) 15%,
        rgba(147, 197, 253, 1) 50%,
        rgba(59, 130, 246, 0.4) 85%,
        transparent 100%
      );
    }

    /* shimmer-spin: LEFT-TO-RIGHT sweep with enhanced glow trail */
    .shimmer-spin {
      animation: unified-sweep-ltr 10s ease-in-out infinite;
      will-change: transform, filter;
    }

    /* Explicit left-to-right class - ENHANCED with glow */
    .shimmer-ltr {
      animation: unified-shimmer-ltr 8s ease-in-out infinite;
      will-change: transform, filter;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(59, 130, 246, 0.3) 10%,
        rgba(147, 197, 253, 1) 50%,
        rgba(59, 130, 246, 0.3) 90%,
        transparent 100%
      );
    }

    /* NEW: Glide animation - smooth gentle sweep */
    .shimmer-glide {
      animation: unified-glide 6s ease-in-out infinite;
      will-change: transform, filter;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(59, 130, 246, 0.5) 20%,
        rgba(147, 197, 253, 0.9) 50%,
        rgba(59, 130, 246, 0.5) 80%,
        transparent 100%
      );
    }

    /* NEW: Streak animation - fast bright trail */
    .shimmer-streak {
      animation: unified-streak 4s ease-out infinite;
      will-change: transform, filter;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(147, 197, 253, 0.6) 30%,
        rgba(255, 255, 255, 1) 50%,
        rgba(147, 197, 253, 0.6) 70%,
        transparent 100%
      );
    }

    /* Wave animation - smooth wave motion with glow */
    .shimmer-wave {
      animation: unified-wave 6s ease-in-out infinite;
      will-change: transform, opacity, filter;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(59, 130, 246, 0.4) 15%,
        rgba(147, 197, 253, 0.95) 50%,
        rgba(59, 130, 246, 0.4) 85%,
        transparent 100%
      );
    }

    /* Ripple animation - expanding ripple effect with glow */
    .shimmer-ripple {
      animation: unified-ripple 1.5s ease-out infinite;
      will-change: transform, opacity, box-shadow;
      border-radius: 50%;
      border: 2px solid rgba(59, 130, 246, 0.8);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    }

    /* Gradient wave - color shift with movement and glow */
    .shimmer-gradient-wave {
      animation: unified-gradient-wave 6s ease-in-out infinite;
      will-change: background-position, transform, filter;
      background-size: 200% 200%;
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.2) 0%,
        rgba(147, 197, 253, 0.7) 25%,
        rgba(59, 130, 246, 0.2) 50%,
        rgba(147, 197, 253, 0.7) 75%,
        rgba(59, 130, 246, 0.2) 100%
      );
    }

    /* Shine burst - sudden bright flash with expanding glow */
    .shimmer-shine-burst {
      animation: unified-shine-burst 2s ease-in-out infinite;
      will-change: opacity, box-shadow, transform;
      border-radius: 50%;
    }

    /* Enhanced pulse with vibrant glow */
    .shimmer-pulse {
      animation: unified-pulse 5s ease-in-out infinite;
      will-change: opacity, box-shadow;
    }

    /* Enhanced glow - more vibrant with inner glow */
    .shimmer-glow {
      animation: unified-glow 4s ease-in-out infinite;
      will-change: box-shadow;
    }

    /* Enhanced float with glow trail */
    .shimmer-float {
      animation: unified-float 3s ease-in-out infinite;
      will-change: transform, opacity, filter;
    }

    /* Enhanced dot pulse - prominent glow ring */
    .shimmer-dot-pulse {
      animation: unified-dot-pulse 1.2s ease-in-out infinite;
      will-change: opacity, transform, box-shadow;
      border-radius: 50%;
    }

    /* Enhanced ping with expanding glow ring */
    .shimmer-ping {
      animation: unified-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
      will-change: transform, opacity, box-shadow;
      border-radius: 50%;
    }

    /* Text shimmer - vibrant gradient text with glow */
    .shimmer-text {
      background: linear-gradient(
        110deg,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(59, 130, 246, 0.7) 15%,
        rgba(147, 197, 253, 1) 35%,
        rgba(255, 255, 255, 1) 50%,
        rgba(147, 197, 253, 1) 65%,
        rgba(59, 130, 246, 0.7) 85%,
        rgba(255, 255, 255, 0.9) 100%
      );
      background-size: 300% auto;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: unified-text-shimmer 3s linear infinite;
      will-change: background-position, filter;
    }

    /* GPU acceleration hint */
    .shimmer-gpu {
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    /* Circle styling - uses proper border-radius, works on all devices */
    .shimmer-circle {
      position: relative;
      display: inline-block;
      border-radius: 50%;
    }
    
    /* =================================================================
       FPS-AWARE QUALITY CONTROL - ENHANCED v5
       Classes added by UnifiedPerformanceSystem based on real FPS
       FIXED: Removed aggressive border-radius removal that broke shapes
       ================================================================= */

    /* NOTE: Removed border-radius: 0 rules that were breaking UI shapes */
    /* Instead, we slow down animations and reduce glow effects on low FPS */

    /* Simplify shadows on low FPS devices */
    html.fps-minimal .shimmer-dot-pulse,
    html.fps-low .shimmer-dot-pulse,
    html.shimmer-quality-disabled .shimmer-dot-pulse {
      box-shadow: 0 0 4px rgba(59, 130, 246, 0.3) !important;
    }

    /* Simplify ping animation on low FPS */
    html.fps-minimal .shimmer-ping,
    html.fps-low .shimmer-ping,
    html.shimmer-quality-disabled .shimmer-ping {
      animation-duration: 3s !important;
    }

    /* Medium quality - STILL AESTHETIC, just slower */
    html.shimmer-quality-medium .shimmer-line { 
      animation-duration: 14s;
      opacity: 0.9;
    }
    html.shimmer-quality-medium .shimmer-spin { 
      animation-duration: 16s;
      opacity: 0.9;
    }
    html.shimmer-quality-medium .shimmer-ltr { 
      animation-duration: 14s;
      opacity: 0.9;
    }
    html.shimmer-quality-medium .shimmer-pulse { 
      animation-duration: 8s;
      opacity: 0.85;
    }
    html.shimmer-quality-medium .shimmer-glow { 
      animation-duration: 7s;
      opacity: 0.8;
    }
    html.shimmer-quality-medium .shimmer-ping { 
      animation-duration: 2s;
      opacity: 0.85;
    }

    /* Low quality - STILL AESTHETIC, very slow to preserve FPS */
    html.shimmer-quality-low .shimmer-line,
    html.shimmer-quality-low .shimmer-spin,
    html.shimmer-quality-low .shimmer-ltr {
      animation-duration: 20s !important;
      opacity: 0.8 !important;
    }

    html.shimmer-quality-low .shimmer-glow,
    html.shimmer-quality-low .shimmer-float,
    html.shimmer-quality-low .shimmer-pulse {
      animation-duration: 12s !important;
      opacity: 0.75 !important;
    }

    html.shimmer-quality-low .shimmer-dot-pulse,
    html.shimmer-quality-low .shimmer-ping {
      animation-duration: 3s !important;
      opacity: 0.7 !important;
    }

    /* Disabled - ULTRA SLOW but keep glow aesthetic */
    html.shimmer-quality-disabled .shimmer-line,
    html.shimmer-quality-disabled .shimmer-spin,
    html.shimmer-quality-disabled .shimmer-ltr {
      animation-duration: 35s !important;
      opacity: 0.5 !important;
      filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4));
    }

    html.shimmer-quality-disabled .shimmer-pulse,
    html.shimmer-quality-disabled .shimmer-glow,
    html.shimmer-quality-disabled .shimmer-float {
      animation-duration: 20s !important;
      opacity: 0.4 !important;
    }

    html.shimmer-quality-disabled .shimmer-dot-pulse,
    html.shimmer-quality-disabled .shimmer-ping {
      animation-duration: 5s !important;
      opacity: 0.35 !important;
    }

    /* =================================================================
       FPS-CLASS BASED EMERGENCY CONTROLS
       These provide immediate CSS-level performance improvements
       Applied by UnifiedPerformanceSystem based on real-time FPS
       NOTE: Only target actual shimmer animation elements, NOT containers
       ================================================================= */

    /* FPS MINIMAL (<30fps) - Ultra slow animations with glow */
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
      opacity: 0.6 !important;
      filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3)) !important;
    }

    html.fps-minimal .shimmer-text {
      animation-duration: 25s !important;
    }

    /* FPS LOW (30-35fps) - Very slow shimmers with subtle glow */
    html.fps-low .shimmer-line:not(.shimmer-essential),
    html.fps-low .shimmer-spin:not(.shimmer-essential),
    html.fps-low .shimmer-ltr:not(.shimmer-essential),
    html.fps-low .shimmer-pulse:not(.shimmer-essential),
    html.fps-low .shimmer-glow:not(.shimmer-essential) {
      animation-duration: 22s !important;
      will-change: auto !important;
      opacity: 0.7 !important;
      filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4)) !important;
    }

    html.fps-low .shimmer-pulse,
    html.fps-low .shimmer-glow {
      animation-duration: 18s !important;
      opacity: 0.75 !important;
    }

    html.fps-low .shimmer-float,
    html.fps-low .shimmer-dot-pulse {
      animation-duration: 20s !important;
      opacity: 0.65 !important;
    }

    /* FPS MEDIUM (35-50fps) - Moderate speed, maintain aesthetics */
    html.fps-medium .shimmer-line { 
      animation-duration: 12s !important;
      opacity: 0.85 !important;
    }
    html.fps-medium .shimmer-spin { 
      animation-duration: 14s !important;
      opacity: 0.85 !important;
    }
    html.fps-medium .shimmer-ltr { 
      animation-duration: 12s !important;
      opacity: 0.85 !important;
    }
    html.fps-medium .shimmer-pulse { 
      animation-duration: 8s !important;
      opacity: 0.8 !important;
    }
    html.fps-medium .shimmer-glow { 
      animation-duration: 7s !important;
      opacity: 0.8 !important;
    }
    html.fps-medium .shimmer-float { 
      animation-duration: 6s !important;
      opacity: 0.8 !important;
    }

    /* FPS HIGH (50-60fps) - Normal speeds, full aesthetic */
    html.fps-high .shimmer-line { 
      animation-duration: 10s !important;
      opacity: 0.95 !important;
    }
    html.fps-high .shimmer-glow {
      animation-duration: 5s !important;
      opacity: 0.9 !important;
    }

    /* FPS ULTRA (60+fps) - FULL QUALITY */
    html.fps-ultra .shimmer-line { 
      animation-duration: 8s !important;
      opacity: 1 !important;
    }
    html.fps-ultra .shimmer-glow {
      animation-duration: 4s !important;
      opacity: 1 !important;
    }

    /* iOS/Safari specific - slower animations but KEEP GLOW AESTHETIC */
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
      animation-duration: 16s !important;
      will-change: auto !important;
      opacity: 0.8 !important;
      filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5)) !important;
    }

    html.is-ios.fps-medium .shimmer-line,
    html.is-ios.fps-medium .shimmer-spin,
    html.is-ios.fps-medium .shimmer-ltr,
    html.is-safari.fps-medium .shimmer-line,
    html.is-safari.fps-medium .shimmer-spin,
    html.is-safari.fps-medium .shimmer-ltr {
      animation-duration: 20s !important;
      opacity: 0.75 !important;
    }

    /* iOS/Safari at low FPS - ultra slow animations but keep glow */
    html.is-ios.fps-low .shimmer-line,
    html.is-ios.fps-low .shimmer-spin,
    html.is-ios.fps-low .shimmer-ltr,
    html.is-safari.fps-low .shimmer-line,
    html.is-safari.fps-low .shimmer-spin,
    html.is-safari.fps-low .shimmer-ltr {
      animation-duration: 28s !important;
      opacity: 0.7 !important;
      filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4)) !important;
    }

    html.is-ios.fps-minimal .shimmer-line,
    html.is-ios.fps-minimal .shimmer-spin,
    html.is-ios.fps-minimal .shimmer-ltr,
    html.is-safari.fps-minimal .shimmer-line,
    html.is-safari.fps-minimal .shimmer-spin,
    html.is-safari.fps-minimal .shimmer-ltr {
      animation-duration: 40s !important;
      opacity: 0.6 !important;
      filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3)) !important;
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
    
    /* Mobile: slow down animations for battery and performance but KEEP AESTHETIC */
    @media (max-width: 768px) {
      /* FIXED: Removed border-radius: 0 rule that was breaking UI shapes on mobile */
      /* Circles and rounded elements should still render correctly */

      .shimmer-line {
        animation-duration: 14s;
        opacity: 0.85;
        filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4));
      }
      .shimmer-spin {
        animation-duration: 16s;
        opacity: 0.85;
        filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4));
      }
      .shimmer-ltr {
        animation-duration: 14s;
        opacity: 0.85;
      }
      .shimmer-pulse {
        animation-duration: 12s;
        opacity: 0.8;
      }
      .shimmer-glow {
        animation-duration: 14s;
        opacity: 0.8;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
      }
      .shimmer-wave {
        animation-duration: 12s;
        opacity: 0.8;
      }
      .shimmer-ripple {
        animation-duration: 2s;
        opacity: 0.6;
      }
    }
    
    /* Component visibility optimization - slow down shimmers on inactive components but KEEP AESTHETIC GLOW */
    /* When FPS optimizer detects component is offscreen, slow animations significantly while maintaining visual appeal */
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
      animation-duration: 28s !important;
      opacity: 0.7;
      filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.5)) !important;
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
type ShimmerVariant = 'line' | 'border' | 'conic' | 'glow' | 'pulse' | 'wave' | 'ripple' | 'gradient-wave' | 'shine-burst' | 'glide' | 'streak' | 'glow-border';
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

// Color presets - ENHANCED for better aesthetics
const colorMap = {
  blue: {
    via: 'rgba(59, 130, 246, 0.6)',
    glow: 'rgba(59, 130, 246, 0.4)',
    conic: '#3b82f6',
  },
  red: {
    via: 'rgba(239, 68, 68, 0.6)',
    glow: 'rgba(239, 68, 68, 0.4)',
    conic: '#ef4444',
  },
  white: {
    via: 'rgba(255, 255, 255, 0.4)',
    glow: 'rgba(255, 255, 255, 0.25)',
    conic: '#ffffff',
  },
  custom: {
    via: 'rgba(59, 130, 246, 0.6)',
    glow: 'rgba(59, 130, 246, 0.4)',
    conic: '#3b82f6',
  },
};

const speedMap = {
  slow: '14s',
  normal: '8s',
  fast: '5s',
};

const intensityMap = {
  low: 0.35,
  medium: 0.5,
  high: 0.65,
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
 * FIXED: Uses CSS classes instead of rounded-full to avoid circles on low devices
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
    <div className={`relative shimmer-gpu ${className}`} style={{ width: size, height: size }}>
      {/* LEFT-TO-RIGHT sweep instead of spinning */}
      <span 
        className="shimmer-gpu absolute inset-0 overflow-hidden"
        style={{ borderRadius: '50%' }}
      >
        <span 
          className="absolute inset-y-0 left-[-100%] w-[100%] shimmer-line"
          style={{ 
            background: `linear-gradient(to right, transparent, ${colors.via}, transparent)`,
            animationDuration: speedMap[speed],
          }} 
        />
      </span>
      <div className="absolute inset-[2px] bg-black" style={{ borderRadius: '50%' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="shimmer-dot-pulse"
          style={{ 
            width: size * 0.15,
            height: size * 0.15,
            backgroundColor: `${colors.conic}99`,
            borderRadius: '50%',
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
 * Wave Shimmer - Smooth wave motion effect
 * NEW in v4 - Enhanced aesthetic for cards and buttons
 */
export const ShimmerWave = memo(({ 
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
      className={`shimmer-wave shimmer-gpu absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        opacity: intensityMap[intensity],
        animationDuration: speedMap[speed],
      }} 
    />
  );
});
ShimmerWave.displayName = 'ShimmerWave';

/**
 * Ripple Shimmer - Expanding ripple effect
 * NEW in v4 - Creates expanding circles on click or hover
 */
export const ShimmerRipple = memo(({ 
  color = 'blue',
  size = 20,
  delay = 0,
  className = '',
  disabled = false
}: { color?: ShimmerColor; size?: number; delay?: number; className?: string; disabled?: boolean }) => {
  const colors = colorMap[color];
  
  if (disabled) return null;
  
  return (
    <span 
      className={`shimmer-ripple shimmer-gpu ${className}`}
      style={{ 
        width: size,
        height: size,
        borderColor: colors.conic,
        animationDelay: `${delay}s`
      }} 
    />
  );
});
ShimmerRipple.displayName = 'ShimmerRipple';

/**
 * Gradient Wave - Color-shifting wave animation
 * NEW in v4 - Enhanced gradient sweep with color transitions
 */
export const ShimmerGradientWave = memo(({ 
  className = '',
  intensity = 'medium',
  disabled = false
}: { className?: string; intensity?: 'low' | 'medium' | 'high'; disabled?: boolean }) => {
  if (disabled) return null;
  
  return (
    <div 
      className={`shimmer-gradient-wave shimmer-gpu absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        opacity: intensityMap[intensity],
      }} 
    />
  );
});
ShimmerGradientWave.displayName = 'ShimmerGradientWave';

/**
 * Shine Burst - Sudden bright flash effect
 * NEW in v4 - Creates bright flash bursts for attention-grabbing elements
 */
export const ShimmerShineBurst = memo(({
  color = 'blue',
  size = 20,
  className = '',
  disabled = false
}: { color?: ShimmerColor; size?: number; className?: string; disabled?: boolean }) => {
  const colors = colorMap[color];

  if (disabled) return null;

  return (
    <div
      className={`shimmer-shine-burst shimmer-gpu ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.conic,
      }}
    />
  );
});
ShimmerShineBurst.displayName = 'ShimmerShineBurst';

/**
 * Glide Shimmer - Smooth gentle sweep effect
 * NEW in v5 - Creates a smooth left-to-right glide with soft glow
 */
export const ShimmerGlide = memo(({
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
      className={`absolute inset-x-0 top-0 h-[2px] overflow-hidden ${className}`}
      style={{ willChange: 'contents' }}
    >
      <div
        className="shimmer-glide shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
        style={{
          background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
          opacity: intensityMap[intensity],
          animationDuration: speedMap[speed],
        }}
      />
    </div>
  );
});
ShimmerGlide.displayName = 'ShimmerGlide';

/**
 * Streak Shimmer - Fast bright trail effect
 * NEW in v5 - Creates a fast moving streak with bright center
 */
export const ShimmerStreak = memo(({
  color = 'blue',
  customColor,
  intensity = 'high',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const viaColor = customColor || 'rgba(255, 255, 255, 0.9)';

  if (disabled) return null;

  return (
    <div
      className={`absolute inset-x-0 top-0 h-[1px] overflow-hidden ${className}`}
      style={{ willChange: 'contents' }}
    >
      <div
        className="shimmer-streak shimmer-gpu absolute inset-y-0 left-[-100%] w-[50%]"
        style={{
          background: `linear-gradient(to right, transparent, ${colors.via}, ${viaColor}, ${colors.via}, transparent)`,
          opacity: intensityMap[intensity],
        }}
      />
    </div>
  );
});
ShimmerStreak.displayName = 'ShimmerStreak';

/**
 * Enhanced Glow Border - Left-to-right shimmer with glow on all borders
 * NEW in v5 - Creates a glowing border effect that sweeps left to right
 */
export const ShimmerGlowBorder = memo(({
  color = 'blue',
  customColor,
  intensity = 'medium',
  speed = 'normal',
  className = '',
  disabled = false
}: Omit<ShimmerProps, 'variant'>) => {
  const colors = colorMap[color];
  const viaColor = customColor || colors.via;
  const glowColor = colors.glow;

  if (disabled) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
          style={{
            background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
            opacity: intensityMap[intensity],
            animationDuration: speedMap[speed],
          }}
        />
      </div>
      {/* Bottom shimmer - delayed */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
          style={{
            background: `linear-gradient(to right, transparent, ${viaColor}, transparent)`,
            opacity: intensityMap[intensity],
            animationDuration: speedMap[speed],
            animationDelay: '2s',
          }}
        />
      </div>
      {/* Corner glow effects */}
      <div
        className="shimmer-glow absolute top-0 left-0 w-8 h-8 rounded-tl-xl"
        style={{
          boxShadow: `inset 8px 8px 20px ${glowColor}`,
          opacity: intensityMap[intensity] * 0.5,
        }}
      />
      <div
        className="shimmer-glow absolute top-0 right-0 w-8 h-8 rounded-tr-xl"
        style={{
          boxShadow: `inset -8px 8px 20px ${glowColor}`,
          opacity: intensityMap[intensity] * 0.5,
          animationDelay: '1s',
        }}
      />
    </div>
  );
});
ShimmerGlowBorder.displayName = 'ShimmerGlowBorder';

/**
 * Unified Shimmer - All-in-one component
 * Supports all shimmer variants with enhanced glow effects
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
    case 'wave':
      return <ShimmerWave {...props} />;
    case 'ripple':
      return <ShimmerRipple {...props} />;
    case 'gradient-wave':
      return <ShimmerGradientWave {...props} />;
    case 'shine-burst':
      return <ShimmerShineBurst {...props} />;
    case 'glide':
      return <ShimmerGlide {...props} />;
    case 'streak':
      return <ShimmerStreak {...props} />;
    case 'glow-border':
      return <ShimmerGlowBorder {...props} />;
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
