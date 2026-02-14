/**
 * ✅ PERF: Critical resource preloading
 * Preload key assets during idle time for faster subsequent navigation
 */

// Preload critical images during idle time
export const preloadCriticalImages = () => {
  if (typeof window === 'undefined') return;
  
  const criticalImages = [
    '/bullmoney-logo.png',
    '/bullmoneyvantage.png',
  ];
  
  const preloadImage = (src: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
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
  
  const routes = ['/store', '/community', '/trading-showcase'];
  
  const prefetchRoute = (href: string) => {
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

// Preconnect to external domains
export const preconnectToDomains = () => {
  if (typeof window === 'undefined') return;
  
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];
  
  domains.forEach((domain) => {
    // Check if already preconnected
    if (document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Initialize all preloading
export const initResourcePreloading = () => {
  preconnectToDomains();
  preloadCriticalImages();
  prefetchCriticalRoutes();
};
