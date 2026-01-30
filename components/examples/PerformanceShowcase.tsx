"use client";

import React, { memo, useCallback } from 'react';
import { 
  GPUMotionDiv, 
  GPUListItem, 
  MouseTrackingDiv, 
  ParallaxDiv,
  fadeInUp,
  fadeInScale,
  staggerContainer,
  SPRING_120HZ,
  SPRING_SNAPPY
} from '@/components/ui/GPUMotion';
import { 
  InteractiveCard, 
  MagneticButton, 
  Reveal, 
  StaggerContainer, 
  StaggerItem 
} from '@/components/ui/InteractiveElements';
import { OptimizedImage, GPUBackground, LazyImage } from '@/components/ui/OptimizedImage';
import { usePerformanceStore, useIsProMotion, useCurrentFps } from '@/stores/performanceStore';
import { useScrollDirection, useScrollProgress } from '@/lib/smoothScroll';
import { motion } from 'framer-motion';

// ============================================================================
// PERFORMANCE SHOWCASE COMPONENT
// ============================================================================

/**
 * Example component demonstrating all 120Hz performance features
 * Use this as a reference for building high-performance UIs
 */

// Memoized list item to prevent unnecessary re-renders
const FeatureCard = memo(function FeatureCard({ 
  title, 
  description, 
  icon,
  index 
}: { 
  title: string; 
  description: string; 
  icon: string;
  index: number;
}) {
  return (
    <InteractiveCard
      className="p-6 rounded-xl bg-white/5 border border-white/10"
      tiltIntensity={10}
      glowEnabled={true}
      scaleOnHover={true}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </InteractiveCard>
  );
});

// Hero section with parallax
const HeroSection = memo(function HeroSection() {
  const isProMotion = useIsProMotion();
  
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax Background */}
      <ParallaxDiv 
        className="absolute inset-0 -z-10" 
        speed={0.3}
        direction="up"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255, 255, 255,0.15),transparent_70%)]" />
      </ParallaxDiv>
      
      {/* Content */}
      <div className="text-center px-4 max-w-4xl mx-auto">
        <Reveal direction="up" delay={0.2}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            {isProMotion ? '120Hz' : '60Hz'} Performance
          </h1>
        </Reveal>
        
        <Reveal direction="up" delay={0.4}>
          <p className="text-xl text-gray-300 mb-8">
            GPU-accelerated animations • Zero layout shifts • Butter-smooth scrolling
          </p>
        </Reveal>
        
        <Reveal direction="scale" delay={0.6}>
          <MagneticButton 
            className="px-8 py-4 bg-white hover:bg-white/90 text-black rounded-full font-semibold transition-colors"
            magneticStrength={0.4}
          >
            Get Started
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  );
});

// Features grid with stagger animation
const FeaturesSection = memo(function FeaturesSection() {
  const features = [
    { 
      icon: '⚡', 
      title: 'GPU Acceleration', 
      description: 'All animations use transform and opacity only - zero main thread blocking' 
    },
    { 
      icon: '🎯', 
      title: 'Zero CLS', 
      description: 'Explicit dimensions on all images prevent cumulative layout shift' 
    },
    { 
      icon: '🔄', 
      title: '120Hz Optimized', 
      description: 'Spring physics tuned for ProMotion displays with 8.33ms frame budget' 
    },
    { 
      icon: '🧠', 
      title: 'Transient State', 
      description: 'Zustand stores enable RAF updates without React re-renders' 
    },
    { 
      icon: '📜', 
      title: 'Smooth Scroll', 
      description: 'Lenis provides luxury-feel scrolling synchronized with refresh rate' 
    },
    { 
      icon: '🎨', 
      title: 'React.memo', 
      description: 'All list items memoized to prevent unnecessary re-renders' 
    },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal direction="up">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Performance Features
          </h2>
        </Reveal>
        
        <StaggerContainer 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          staggerDelay={0.08}
        >
          {features.map((feature, index) => (
            <StaggerItem key={feature.title}>
              <FeatureCard {...feature} index={index} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
});

// Interactive demo section
const InteractiveDemo = memo(function InteractiveDemo() {
  const currentFps = useCurrentFps();
  const scrollDirection = useScrollDirection();
  const scrollProgress = useScrollProgress();
  
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-transparent via-white/10 to-transparent">
      <div className="max-w-4xl mx-auto">
        <Reveal direction="up">
          <h2 className="text-4xl font-bold text-white text-center mb-8">
            Live Performance Metrics
          </h2>
        </Reveal>
        
        {/* Mouse tracking demo */}
        <MouseTrackingDiv 
          className="p-8 rounded-2xl bg-white/5 border border-white/10 mb-8"
          intensity={0.05}
        >
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white">{currentFps}</div>
              <div className="text-gray-400 text-sm">Current FPS</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white capitalize">{scrollDirection}</div>
              <div className="text-gray-400 text-sm">Scroll Direction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">{(scrollProgress * 100).toFixed(0)}%</div>
              <div className="text-gray-400 text-sm">Page Progress</div>
            </div>
          </div>
        </MouseTrackingDiv>
        
        {/* Interactive cards */}
        <div className="grid grid-cols-2 gap-6">
          <InteractiveCard className="p-6 rounded-xl bg-white/5 aspect-square flex items-center justify-center">
            <p className="text-white text-center">
              Hover & move mouse<br/>
              <span className="text-gray-400 text-sm">3D tilt effect</span>
            </p>
          </InteractiveCard>
          
          <InteractiveCard 
            className="p-6 rounded-xl bg-gradient-to-br from-white/20 to-white/20 aspect-square flex items-center justify-center"
            tiltIntensity={20}
            glowColor="rgba(255, 255, 255, 0.3)"
          >
            <p className="text-white text-center">
              Enhanced tilt<br/>
              <span className="text-gray-400 text-sm">Stronger effect</span>
            </p>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
});

// Images section demonstrating zero CLS
const ImagesSection = memo(function ImagesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal direction="up">
          <h2 className="text-4xl font-bold text-white text-center mb-8">
            Zero Layout Shift Images
          </h2>
          <p className="text-gray-400 text-center mb-16">
            All images have explicit width/height to prevent CLS
          </p>
        </Reveal>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Example image cards - replace src with actual images */}
          {[1, 2, 3].map((i) => (
            <Reveal key={i} direction="up" delay={i * 0.1}>
              <div className="rounded-xl overflow-hidden">
                <OptimizedImage
                  src={`/api/placeholder/400/300`}
                  alt={`Example image ${i}`}
                  width={400}
                  height={300}
                  fadeIn={true}
                  fadeInDuration={400}
                  className="w-full"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
});

// Main showcase component
export function PerformanceShowcase() {
  return (
    <div className="bg-black min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <InteractiveDemo />
      <ImagesSection />
      
      {/* Spacer for scroll demo */}
      <div className="h-[50vh]" />
    </div>
  );
}

// ============================================================================
// USAGE EXAMPLES - Copy these patterns for your components
// ============================================================================

/**
 * PATTERN 1: GPU-Only Animation
 * 
 * ✅ GOOD - Uses transform and opacity only:
 * style={{ transform: 'translateY(20px)', opacity: 0.5 }}
 * 
 * ❌ BAD - Causes layout thrashing:
 * style={{ height: '200px', marginTop: '20px' }}
 */

/**
 * PATTERN 2: Memoized List Items
 * 
 * const ListItem = memo(function ListItem({ item }) {
 *   return <div>{item.name}</div>;
 * });
 * 
 * // In parent:
 * {items.map(item => <ListItem key={item.id} item={item} />)}
 */

/**
 * PATTERN 3: Transient State Updates
 * 
 * // For RAF loops, use getState() directly:
 * const scrollY = usePerformanceStore.getState()._transientScrollY;
 * 
 * // For React components that need to re-render:
 * const scrollY = usePerformanceStore((s) => s.scroll.scrollY);
 */

/**
 * PATTERN 4: will-change Management
 * 
 * // Only add will-change during animation:
 * onHoverStart={() => element.style.willChange = 'transform'}
 * onHoverEnd={() => element.style.willChange = 'auto'}
 */

export default PerformanceShowcase;
