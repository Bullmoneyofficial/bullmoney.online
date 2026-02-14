/**
 * ✅ PERF: Critical resource preloading
 * Preload key assets during idle time for faster subsequent navigation
 * 
 * HYDRATION OPTIMIZED: Uses requestIdleCallback and progressive loading
 * to avoid blocking the main thread during initial page load.
 */

// Track what's already been preloaded to avoid duplicates
const preloadedResources = new Set<string>();

// Preload critical images during idle time
export const preloadCriticalImages = () => {
  if (typeof window === 'undefined') return;
  
  const criticalImages = [
    '/bullmoney-logo.png',
    '/bullmoneyvantage.png',
    '/IMG_2921.PNG', // OG image
  ];
  
  const preloadImage = (src: string) => {
    if (preloadedResources.has(src)) return;
    preloadedResources.add(src);
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    // Use low fetchpriority for non-critical images
    link.setAttribute('fetchpriority', 'low');
    document.head.appendChild(link);
  };
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      criticalImages.forEach(preloadImage);
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      criticalImages.forEach(preloadImage);
    }, 1000);
  }
};

// Prefetch routes during idle time
export const prefetchCriticalRoutes = () => {
  if (typeof window === 'undefined') return;
  
  const routes = ['/store', '/community', '/trading-showcase', '/course'];
  
  const prefetchRoute = (href: string) => {
    if (preloadedResources.has(href)) return;
    preloadedResources.add(href);
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  };
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      routes.forEach(prefetchRoute);
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      routes.forEach(prefetchRoute);
    }, 3000);
  }
};

// Preconnect to external domains - call this early for fastest connection
export const preconnectToDomains = () => {
  if (typeof window === 'undefined') return;
  
  const domains = [
    { href: 'https://fonts.googleapis.com', crossOrigin: false },
    { href: 'https://fonts.gstatic.com', crossOrigin: true },
    // Add any CDN or API domains used frequently
  ];
  
  domains.forEach(({ href, crossOrigin }) => {
    // Check if already preconnected
    if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// DNS prefetch for external domains (lighter than preconnect)
export const dnsPrefetchDomains = () => {
  if (typeof window === 'undefined') return;
  
  const domains = [
    'https://excalidraw.com', // Whiteboard integration
    'https://prod.spline.design', // Spline assets
  ];
  
  domains.forEach((domain) => {
    if (document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Preload critical JavaScript chunks - call after hydration
export const preloadCriticalChunks = () => {
  if (typeof window === 'undefined') return;
  
  // Only preload if the browser supports modulepreload
  if (!document.createElement('link').relList?.supports?.('modulepreload')) return;
  
  // These chunks are commonly needed after initial load
  const chunks: string[] = [
    // Add any frequently-used dynamic import chunks here
  ];
  
  const preloadChunk = (href: string) => {
    if (preloadedResources.has(href)) return;
    preloadedResources.add(href);
    
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = href;
    document.head.appendChild(link);
  };
  
  if ('requestIdleCallback' in window && chunks.length > 0) {
    (window as any).requestIdleCallback(() => {
      chunks.forEach(preloadChunk);
    }, { timeout: 3000 });
  }
};

// Progressive resource preloading - prioritizes based on user scroll
export const setupProgressivePreloading = () => {
  if (typeof window === 'undefined') return;
  
  let hasScrolled = false;
  
  const onFirstScroll = () => {
    if (hasScrolled) return;
    hasScrolled = true;
    
    // User is engaged, preload more resources
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadCriticalChunks();
      }, { timeout: 2000 });
    }
    
    window.removeEventListener('scroll', onFirstScroll, { capture: true });
  };
  
  window.addEventListener('scroll', onFirstScroll, { capture: true, passive: true });
  
  // Also trigger after 5 seconds if user hasn't scrolled
  setTimeout(() => {
    if (!hasScrolled) {
      onFirstScroll();
    }
  }, 5000);
};

// Initialize all preloading with priority order
export const initResourcePreloading = () => {
  // Priority 1: Immediate - preconnect to external domains (no idle callback)
  preconnectToDomains();
  dnsPrefetchDomains();
  
  // Priority 2: After hydration - preload critical images
  preloadCriticalImages();
  
  // Priority 3: Idle time - prefetch routes
  prefetchCriticalRoutes();
  
  // Priority 4: After user engagement - progressive loading
  setupProgressivePreloading();
};

// Export for manual triggering from specific pages
export const preloadForStore = () => {
  if (typeof window === 'undefined') return;
  
  const storeResources = [
    '/Fvfront.png',
    '/Img1.jpg',
  ];
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      storeResources.forEach(src => {
        if (preloadedResources.has(src)) return;
        preloadedResources.add(src);
        
        const img = new Image();
        img.src = src;
      });
    }, { timeout: 2000 });
  }
};

// Export for checking if a resource was preloaded
export const isResourcePreloaded = (src: string) => preloadedResources.has(src);
