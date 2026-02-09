// Big Device Scroll Optimization Utilities (2026)
// Fixes scrolling issues specifically for displays >= 1440px

import React from 'react';

export interface ScrollOptimizationConfig {
  enableSmoothScroll?: boolean;
  optimizeContainment?: boolean;
  fixHeroHeight?: boolean;
  enhancePerformance?: boolean;
}

export const defaultScrollConfig: ScrollOptimizationConfig = {
  enableSmoothScroll: true,
  optimizeContainment: true,
  fixHeroHeight: true,
  enhancePerformance: true,
};

export class BigDeviceScrollOptimizer {
  private static instance: BigDeviceScrollOptimizer;
  private isInitialized = false;
  private config: ScrollOptimizationConfig;

  private constructor(config: ScrollOptimizationConfig = defaultScrollConfig) {
    this.config = { ...defaultScrollConfig, ...config };
  }

  public static getInstance(config?: ScrollOptimizationConfig): BigDeviceScrollOptimizer {
    if (!BigDeviceScrollOptimizer.instance) {
      BigDeviceScrollOptimizer.instance = new BigDeviceScrollOptimizer(config);
    }
    return BigDeviceScrollOptimizer.instance;
  }

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    const isBigDevice = window.innerWidth >= 1440;
    if (!isBigDevice) return;

    console.log('[BigDeviceScrollOptimizer] Initializing for large display...');

    this.applyRootOptimizations();
    this.optimizeScrollBehavior();
    this.fixContainmentIssues();
    this.enhanceScrollPerformance();
    this.setupScrollListeners();

    this.isInitialized = true;
    console.log('[BigDeviceScrollOptimizer] Initialization complete');
  }

  private applyRootOptimizations(): void {
    if (!this.config.enableSmoothScroll) return;

    const html = document.documentElement;
    const body = document.body;

    // Apply big device classes
    html.classList.add('big-display');
    body.classList.add('big-display-body');

    // Root scroll optimizations
    html.style.setProperty('scroll-behavior', 'smooth', 'important');
    html.style.setProperty('overflow-y', 'auto', 'important');
    html.style.setProperty('scroll-padding-top', '80px');
    body.style.setProperty('overflow-y', 'auto', 'important');
    body.style.setProperty('scroll-behavior', 'inherit');

    console.log('[BigDeviceScrollOptimizer] Root optimizations applied');
  }

  private optimizeScrollBehavior(): void {
    // Fix scroll snap issues
    const html = document.documentElement;
    html.style.setProperty('scroll-snap-type', 'none', 'important');
    
    // PERF FIX: Removed will-change: scroll-position (promotes entire page to GPU = massive memory)
    
    // Fix overscroll behavior
    html.style.setProperty('overscroll-behavior-y', 'auto');
    html.style.setProperty('overscroll-behavior-x', 'none');
  }

  private fixContainmentIssues(): void {
    if (!this.config.optimizeContainment) return;

    // Fix containment on hero elements
    const heroElements = document.querySelectorAll('.hero, .hero-spline-wrapper');
    heroElements.forEach((element) => {
      const el = element as HTMLElement;
      el.style.setProperty('contain', 'layout style', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('height', 'auto', 'important');
    });

    // Fix spline containers
    const splineContainers = document.querySelectorAll('.spline-container, [data-spline-scene]');
    splineContainers.forEach((element) => {
      const el = element as HTMLElement;
      el.style.setProperty('contain', 'layout style', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
    });

    console.log('[BigDeviceScrollOptimizer] Containment issues fixed');
  }

  private enhanceScrollPerformance(): void {
    if (!this.config.enhancePerformance) return;

    // PERF FIX: Removed blanket will-change:transform on ALL img/video/canvas elements.
    // This was creating hundreds of GPU layers, consuming massive VRAM and causing jank.
    // Only parallax elements that actually animate need GPU promotion.
    const parallaxElements = document.querySelectorAll('[data-parallax], .hero-parallax-container');
    parallaxElements.forEach((element) => {
      const el = element as HTMLElement;
      el.style.willChange = 'transform';
      el.style.overflow = 'visible';
    });

    console.log('[BigDeviceScrollOptimizer] Performance optimizations applied');
  }

  private setupScrollListeners(): void {
    // PERF FIX: Removed per-scroll RAF that fixed overlay pointer-events every frame.
    // Overlays now have pointer-events:none set once via CSS (ThemeOverlay component).

    // Listen for resize changes only
    window.addEventListener('resize', () => {
      const isBigDevice = window.innerWidth >= 1440;
      const html = document.documentElement;
      
      if (isBigDevice) {
        html.classList.add('big-display');
        document.body.classList.add('big-display-body');
        this.applyRootOptimizations();
      } else {
        html.classList.remove('big-display');
        document.body.classList.remove('big-display-body');
      }
    });

    console.log('[BigDeviceScrollOptimizer] Scroll listeners setup complete');
  }

  public fixHeroHeight(): void {
    if (!this.config.fixHeroHeight) return;

    const heroElements = document.querySelectorAll('.hero');
    heroElements.forEach((element) => {
      const el = element as HTMLElement;
      const isBigDevice = window.innerWidth >= 1440;
      
      if (isBigDevice) {
        el.style.setProperty('height', 'auto', 'important');
        el.style.setProperty('min-height', 'calc(100vh - 80px)', 'important');
        el.style.setProperty('max-height', 'none', 'important');
      }
    });

    console.log('[BigDeviceScrollOptimizer] Hero height fixes applied');
  }

  public optimizeSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const isBigDevice = window.innerWidth >= 1440;
    if (!isBigDevice) return;

    section.style.setProperty('overflow', 'visible', 'important');
    section.style.setProperty('contain', 'layout style', 'important');
    section.style.setProperty('height', 'auto', 'important');

    console.log(`[BigDeviceScrollOptimizer] Optimized section: ${sectionId}`);
  }

  public reset(): void {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;

    html.classList.remove('big-display');
    body.classList.remove('big-display-body');

    this.isInitialized = false;
    console.log('[BigDeviceScrollOptimizer] Reset complete');
  }
}

// React Hook for easy integration
export const useBigDeviceScrollOptimizer = (config?: ScrollOptimizationConfig) => {
  const optimizer = BigDeviceScrollOptimizer.getInstance(config);

  React.useEffect(() => {
    optimizer.initialize();
    
    return () => {
      // Cleanup is handled by the singleton pattern
    };
  }, [optimizer]);

  return {
    optimizer,
    fixHeroHeight: () => optimizer.fixHeroHeight(),
    optimizeSection: (sectionId: string) => optimizer.optimizeSection(sectionId),
    reset: () => optimizer.reset(),
  };
};

export default BigDeviceScrollOptimizer;