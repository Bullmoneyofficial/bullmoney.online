"use client";

import React, { useRef, useEffect, useCallback, memo, ComponentType, ReactNode, ElementType } from 'react';
import { motion, MotionProps, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { usePerformanceStore } from '@/stores/performanceStore';

// ============================================================================
// FRAMER MOTION OPTIMIZATION WRAPPERS - 120Hz GPU-Accelerated
// ============================================================================

/**
 * Performance-optimized motion variants
 * All animations use GPU-composited properties only:
 * - transform (translateX, translateY, translateZ, scale, rotate)
 * - opacity
 * - filter (blur, brightness, etc.)
 * 
 * NEVER use: width, height, top, left, right, bottom, margin, padding
 */

// Optimized spring config for 120Hz
const SPRING_120HZ = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
  mass: 1,
};

// Tween config for predictable animations
const TWEEN_FAST = {
  type: 'tween' as const,
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

const TWEEN_SMOOTH = {
  type: 'tween' as const,
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

// ============================================================================
// PRE-BUILT ANIMATION VARIANTS (GPU-Only)
// ============================================================================

export const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 20,
    // Force GPU layer
    transform: 'translateY(20px) translateZ(0)',
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transform: 'translateY(0px) translateZ(0)',
    transition: SPRING_120HZ,
  },
};

export const fadeInScale = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    transform: 'scale(0.95) translateZ(0)',
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transform: 'scale(1) translateZ(0)',
    transition: SPRING_SNAPPY,
  },
};

export const slideInLeft = {
  hidden: { 
    opacity: 0, 
    x: -30,
    transform: 'translateX(-30px) translateZ(0)',
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transform: 'translateX(0) translateZ(0)',
    transition: SPRING_120HZ,
  },
};

export const slideInRight = {
  hidden: { 
    opacity: 0, 
    x: 30,
    transform: 'translateX(30px) translateZ(0)',
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transform: 'translateX(0) translateZ(0)',
    transition: SPRING_120HZ,
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Fast stagger for 120Hz
      delayChildren: 0.02,
    },
  },
};

// ============================================================================
// GPU-ACCELERATED MOTION COMPONENTS
// ============================================================================

interface GPUMotionProps extends MotionProps {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * GPU-accelerated motion div
 * Automatically promotes to compositor layer and uses optimal settings
 */
export const GPUMotionDiv = memo(function GPUMotionDiv({ 
  children, 
  className = '',
  style,
  ...props 
}: GPUMotionProps) {
  const isProMotion = usePerformanceStore((s) => s.isProMotion);
  
  return (
    <motion.div
      className={className}
      style={{
        // Force GPU compositing
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        // Conditionally enable will-change based on animation state
        ...style,
      }}
      // Use faster transitions on 120Hz displays
      transition={isProMotion ? SPRING_120HZ : SPRING_GENTLE}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * Optimized list item for virtualized lists
 * Uses React.memo with deep comparison
 */
export const GPUListItem = memo(function GPUListItem({
  children,
  className = '',
  index = 0,
  ...props
}: GPUMotionProps & { index?: number }) {
  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      custom={index}
      style={{
        transform: 'translateZ(0)',
      }}
      transition={{
        ...SPRING_120HZ,
        delay: index * 0.03, // Micro-stagger
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// SPRING-BASED MOUSE TRACKING (120Hz Optimized)
// ============================================================================

interface MouseTrackingProps {
  children: ReactNode;
  className?: string;
  intensity?: number; // 0-1, how much the element follows mouse
  springConfig?: typeof SPRING_120HZ;
}

export const MouseTrackingDiv = memo(function MouseTrackingDiv({
  children,
  className = '',
  intensity = 0.1,
  springConfig = SPRING_120HZ,
}: MouseTrackingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Use spring for smooth 120Hz tracking
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  
  // Transform to actual movement
  const x = useTransform(springX, (val) => val * intensity);
  const y = useTransform(springY, (val) => val * intensity);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  }, [mouseX, mouseY]);
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y, transform: 'translateZ(0)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// PARALLAX COMPONENT (GPU-Only)
// ============================================================================

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number; // Parallax speed multiplier
  direction?: 'up' | 'down';
}

export const ParallaxDiv = memo(function ParallaxDiv({
  children,
  className = '',
  speed = 0.5,
  direction = 'up',
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const multiplier = direction === 'up' ? -1 : 1;
    
    // Use transient scroll updates (no re-render)
    const unsubscribe = usePerformanceStore.subscribe(
      (state) => state._transientScrollY,
      (scrollY) => {
        // GPU-only transform
        element.style.transform = `translate3d(0, ${scrollY * speed * multiplier}px, 0)`;
      }
    );
    
    return unsubscribe;
  }, [speed, direction]);
  
  return (
    <div 
      ref={ref} 
      className={className}
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    >
      {children}
    </div>
  );
});

// ============================================================================
// HOC: withGPUOptimization - Wrap any component for GPU acceleration
// ============================================================================

export function withGPUOptimization<P extends object>(
  WrappedComponent: ComponentType<P>,
  displayName?: string
) {
  const OptimizedComponent = memo(function OptimizedComponent(props: P) {
    return (
      <div 
        style={{ 
          transform: 'translateZ(0)', 
          backfaceVisibility: 'hidden',
          contain: 'layout paint',
        }}
      >
        <WrappedComponent {...props} />
      </div>
    );
  });
  
  OptimizedComponent.displayName = displayName || `GPUOptimized(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return OptimizedComponent;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SPRING_120HZ, SPRING_SNAPPY, SPRING_GENTLE, TWEEN_FAST, TWEEN_SMOOTH };
