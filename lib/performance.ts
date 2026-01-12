/**
 * 120Hz Performance System - Exports
 * 
 * High-performance utilities for ProMotion displays
 * All components use GPU-only animations (transform, opacity, filter)
 */

// ============================================================================
// ZUSTAND STORES (Transient State - Zero Re-renders)
// ============================================================================
export * from '@/stores/performanceStore';
export * from '@/stores/uiStore';

// ============================================================================
// ANIMATION COMPONENTS
// ============================================================================
export {
  // GPU-optimized motion components
  GPUMotionDiv,
  GPUListItem,
  MouseTrackingDiv,
  ParallaxDiv,
  withGPUOptimization,
  
  // Pre-built variants
  fadeInUp,
  fadeInScale,
  slideInLeft,
  slideInRight,
  staggerContainer,
  
  // Spring configs
  SPRING_120HZ,
  SPRING_SNAPPY,
  SPRING_GENTLE,
  TWEEN_FAST,
  TWEEN_SMOOTH,
} from '@/components/ui/GPUMotion';

export {
  // Interactive elements
  InteractiveCard,
  MagneticButton,
  Reveal,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/InteractiveElements';

// ============================================================================
// IMAGE COMPONENTS (Zero CLS)
// ============================================================================
export {
  OptimizedImage,
  GPUBackground,
  LazyImage,
} from '@/components/ui/OptimizedImage';

// ============================================================================
// SMOOTH SCROLL
// ============================================================================
export {
  LenisProvider,
  useLenis,
  useScrollPosition,
  useIsScrolling,
  useScrollProgress,
  useScrollDirection,
} from '@/lib/smoothScroll';

// ============================================================================
// GPU ANIMATION UTILITIES
// ============================================================================
export {
  useGPUAnimation,
  useScrollAnimation,
  Easing,
} from '@/lib/gpuAnimation';

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================
export {
  usePerformanceInit,
  usePerformanceCSSSync,
} from '@/hooks/usePerformanceInit';

// ============================================================================
// PROVIDERS
// ============================================================================
export {
  PerformanceProvider,
  FPSCounter,
} from '@/components/PerformanceProvider';
