"use client";

import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

// ==========================================
// STATIC PAGE WRAPPER WITH ANIMATIONS
// ==========================================

interface StaticPageWrapperProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slide' | 'reveal' | 'none';
  /** Enable parallax scrolling effects */
  enableParallax?: boolean;
  /** Scroll-based text reveal animation */
  enableTextReveal?: boolean;
  /** Background gradient that follows scroll */
  enableScrollGradient?: boolean;
  className?: string;
}

/**
 * Wrapper for static TSX components with scroll-based animations
 * Optimized for mobile performance with reduced-motion support
 */
export const StaticPageWrapper = memo<StaticPageWrapperProps>(({
  children,
  animationType = 'fade',
  enableParallax = true,
  enableTextReveal: _enableTextReveal = false,
  enableScrollGradient = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect user preferences and device
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mobileQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      mobileQuery.addEventListener('change', handleMobileChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
        mobileQuery.removeEventListener('change', handleMobileChange);
      }
    };
  }, []);

  // Scroll progress tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth spring animation
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const smoothProgress = useSpring(scrollYProgress, springConfig);

  // Parallax transforms (disabled on mobile or with reduced motion)
  const shouldAnimate = !prefersReducedMotion && !isMobile;

  const y = useTransform(
    smoothProgress,
    [0, 1],
    shouldAnimate && enableParallax ? [100, -100] : [0, 0]
  );

  const opacity = useTransform(
    smoothProgress,
    [0, 0.2, 0.8, 1],
    animationType !== 'none' ? [0, 1, 1, 0] : [1, 1, 1, 1]
  );

  const scale = useTransform(
    smoothProgress,
    [0, 0.2, 0.8, 1],
    shouldAnimate ? [0.95, 1, 1, 0.95] : [1, 1, 1, 1]
  );

  const scrollGradient = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    [
      'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
      'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
      'radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
    ]
  );

  // Get animation variants based on type
  const getAnimationVariants = () => {
    if (prefersReducedMotion || animationType === 'none') {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      };
    }

    switch (animationType) {
      case 'slide':
        return {
          hidden: { opacity: 0, y: isMobile ? 30 : 60 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1]
            }
          },
        };
      case 'reveal':
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.7,
              ease: [0.25, 0.1, 0.25, 1]
            }
          },
        };
      case 'fade':
      default:
        return {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              duration: 0.5,
              ease: 'easeOut'
            }
          },
        };
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Scroll-based gradient background (optional) */}
      {enableScrollGradient && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: scrollGradient as any,
          }}
        />
      )}

      {/* Main content with animations */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={getAnimationVariants()}
        style={{
          y: enableParallax ? y : 0,
          opacity,
          scale,
        }}
        className="w-full h-full relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
});
StaticPageWrapper.displayName = "StaticPageWrapper";

// ==========================================
// TEXT REVEAL ANIMATION
// ==========================================

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

/**
 * Smooth text reveal animation for headings
 * Characters fade and slide in on scroll
 */
export const TextReveal = memo<TextRevealProps>(({
  children,
  className = '',
  delay = 0,
  stagger = 0.02,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  if (prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  const words = children.split(' ');

  return (
    <span className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.8 }}
              transition={{
                duration: 0.5,
                delay: delay + (wordIndex * words.length + charIndex) * stagger,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
});
TextReveal.displayName = "TextReveal";

// ==========================================
// SCROLL INDICATOR
// ==========================================

interface ScrollIndicatorProps {
  label?: string;
  direction?: 'down' | 'up';
}

export const ScrollIndicator = memo<ScrollIndicatorProps>(({
  label = 'Scroll',
  direction = 'down',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled < 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-xs text-white/50 uppercase tracking-widest font-mono">
            {label}
          </span>
          <motion.div
            animate={{
              y: direction === 'down' ? [0, 8, 0] : [0, -8, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
ScrollIndicator.displayName = "ScrollIndicator";

// ==========================================
// SECTION DIVIDER
// ==========================================

export const SectionDivider = memo(() => {
  return (
    <div className="relative w-full h-px my-8 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
        initial={{ x: '-100%' }}
        whileInView={{ x: '100%' }}
        viewport={{ once: false }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
});
SectionDivider.displayName = "SectionDivider";

// ==========================================
// FLOATING ELEMENT (For decorative purposes)
// ==========================================

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export const FloatingElement = memo<FloatingElementProps>(({
  children,
  className = '',
  delay = 0,
  duration = 3,
  yOffset = 10,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [-yOffset, yOffset, -yOffset],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
});
FloatingElement.displayName = "FloatingElement";
