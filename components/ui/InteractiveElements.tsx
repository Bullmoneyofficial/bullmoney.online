"use client";

import React, { memo, useRef, useEffect, useCallback, useState, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================================================
// INTERACTIVE CARD - 120Hz GPU-Optimized
// ============================================================================

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  
  // 3D tilt settings
  tiltEnabled?: boolean;
  tiltIntensity?: number; // Max tilt in degrees (default: 15)
  
  // Glow effect
  glowEnabled?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  
  // Scale on hover
  scaleOnHover?: boolean;
  hoverScale?: number;
  
  // Callbacks
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

/**
 * Interactive Card with GPU-accelerated 3D effects
 * Uses transform and filter only (no layout thrashing)
 */
export const InteractiveCard = memo(function InteractiveCard({
  children,
  className = '',
  tiltEnabled = true,
  tiltIntensity = 15,
  glowEnabled = true,
  glowColor = 'rgba(255, 255, 255, 0.1)',
  glowIntensity = 0.3,
  scaleOnHover = true,
  hoverScale = 1.02,
  onClick,
  onHoverStart,
  onHoverEnd,
}: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring config for 120Hz smoothness
  const springConfig = { stiffness: 400, damping: 30, mass: 0.5 };
  
  // Smooth spring values
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Transform mouse position to rotation
  const rotateX = useTransform(springY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]);

  // Glow position
  const glowX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !tiltEnabled) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY, tiltEnabled]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHoverStart?.();
  }, [onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    onHoverEnd?.();
  }, [mouseX, mouseY, onHoverEnd]);

  return (
    <motion.div
      ref={ref}
      className={`interactive-card ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // GPU-only transforms
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        scale: scaleOnHover && isHovered ? hoverScale : 1,
        // GPU layer promotion
        transformStyle: 'preserve-3d',
        perspective: 1000,
        willChange: isHovered ? 'transform' : 'auto',
      }}
      transition={{
        scale: { type: 'spring', stiffness: 500, damping: 30 },
      }}
    >
      {/* Glow effect layer */}
      {glowEnabled && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            opacity: isHovered ? glowIntensity : 0,
            background: `radial-gradient(circle at ${glowX} ${glowY}, ${glowColor}, transparent 50%)`,
            pointerEvents: 'none',
            transform: 'translateZ(0)',
          }}
          transition={{ opacity: { duration: 0.2 } }}
        />
      )}
      
      {/* Content */}
      <div style={{ position: 'relative', transform: 'translateZ(0)' }}>
        {children}
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAGNETIC BUTTON - GPU-Accelerated Magnetic Effect
// ============================================================================

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  magneticStrength?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const MagneticButton = memo(function MagneticButton({
  children,
  className = '',
  magneticStrength = 0.3,
  onClick,
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 300, damping: 20, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || disabled) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * magneticStrength;
    const deltaY = (e.clientY - centerY) * magneticStrength;

    x.set(deltaX);
    y.set(deltaY);
  }, [x, y, magneticStrength, disabled]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      className={`magnetic-button ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      style={{
        x: springX,
        y: springY,
        transform: 'translateZ(0)',
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ scale: { type: 'spring', stiffness: 400, damping: 17 } }}
    >
      {children}
    </motion.button>
  );
});

// ============================================================================
// REVEAL ANIMATION WRAPPER
// ============================================================================

interface RevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  delay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

export const Reveal = memo(function Reveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.6,
  once = true,
  threshold = 0.2,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once, threshold]);

  // Direction-based initial transforms (GPU-only)
  const initialTransform = {
    up: { y: 40, opacity: 0 },
    down: { y: -40, opacity: 0 },
    left: { x: 40, opacity: 0 },
    right: { x: -40, opacity: 0 },
    scale: { scale: 0.9, opacity: 0 },
  }[direction];

  const visibleTransform = {
    y: 0,
    x: 0,
    scale: 1,
    opacity: 1,
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initialTransform}
      animate={isVisible ? visibleTransform : initialTransform}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth ease-out
      }}
      style={{ transform: 'translateZ(0)' }}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// STAGGER CONTAINER
// ============================================================================

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export const StaggerContainer = memo(function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.05,
  delayChildren = 0,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
});

export const StaggerItem = memo(function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { 
          opacity: 0, 
          y: 20,
          transform: 'translateY(20px) translateZ(0)',
        },
        visible: { 
          opacity: 1, 
          y: 0,
          transform: 'translateY(0) translateZ(0)',
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
});
