// Big Device Scroll Optimization Utilities (2026)
// Fixes scrolling issues specifically for displays >= 1440px

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
    
    // Enable hardware acceleration for smooth scrolling
    html.style.setProperty('will-change', 'scroll-position');
    
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

    // Apply performance optimizations to media elements
    const mediaElements = document.querySelectorAll('img, video, canvas');
    mediaElements.forEach((element) => {
      const el = element as HTMLElement;
      el.style.willChange = 'transform';
      el.style.transform = 'translateZ(0)';
    });

    // Optimize parallax elements
    const parallaxElements = document.querySelectorAll('[data-parallax], .hero-parallax-container');
    parallaxElements.forEach((element) => {
      const el = element as HTMLElement;
      el.style.willChange = 'transform';
      el.style.transform = 'translateZ(0)';
      el.style.overflow = 'visible';
    });

    console.log('[BigDeviceScrollOptimizer] Performance optimizations applied');
  }

  private setupScrollListeners(): void {
    let ticking = false;

    const optimizeScrollPosition = () => {
      // Ensure theme overlays don't block scroll
      const overlays = document.querySelectorAll(
        '#theme-global-overlay, #theme-edge-glow, #theme-filter-overlay'
      );
      overlays.forEach((overlay) => {
        const el = overlay as HTMLElement;
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('z-index', '-1', 'important');
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(optimizeScrollPosition);
        ticking = true;
      }
    };

    // Throttled scroll optimization
    window.addEventListener('scroll', onScroll, { passive: true });

    // Listen for resize changes
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

// Import React for the hook
import React from 'react';

export default BigDeviceScrollOptimizer;