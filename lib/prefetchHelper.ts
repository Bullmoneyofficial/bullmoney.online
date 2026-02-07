/**
 * Prefetch Helper - Optimizes resource loading for faster page performance
 * Implements intelligent prefetching based on user behavior and device capabilities
 */

interface PrefetchOptions {
  priority?: 'high' | 'low';
  as?: 'fetch' | 'script' | 'style' | 'image' | 'font';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Prefetch a resource during idle time
 */
export function prefetchResource(href: string, options: PrefetchOptions = {}) {
  if (typeof document === 'undefined') return;

  // Check if already prefetched
  const selector = `link[rel="prefetch"][href="${href}"]`;
  if (document.querySelector(selector)) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  
  if (options.as) {
    link.as = options.as;
  }
  
  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * Preload a critical resource (higher priority than prefetch)
 */
export function preloadResource(href: string, options: PrefetchOptions = {}) {
  if (typeof document === 'undefined') return;

  const selector = `link[rel="preload"][href="${href}"]`;
  if (document.querySelector(selector)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  
  if (options.as) {
    link.as = options.as;
  }
  
  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * Prefetch routes that user is likely to visit
 */
export function prefetchRoutes(routes: string[]) {
  if (typeof window === 'undefined') return;
  if (!('requestIdleCallback' in window)) return;

  (window as any).requestIdleCallback(() => {
    routes.forEach(route => {
      prefetchResource(route, { priority: 'low' });
    });
  }, { timeout: 2000 });
}

/**
 * Check if user is on a slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const connection = (navigator as any).connection 
    || (navigator as any).mozConnection 
    || (navigator as any).webkitConnection;
  
  if (!connection) return false;
  
  // Effective connection type (4g, 3g, 2g, slow-2g)
  if (connection.effectiveType) {
    return ['slow-2g', '2g'].includes(connection.effectiveType);
  }
  
  // Save data mode enabled
  if (connection.saveData) {
    return true;
  }
  
  return false;
}

/**
 * Smart prefetch based on device capabilities
 */
export function smartPrefetch(resources: Array<{ href: string; options?: PrefetchOptions }>) {
  if (isSlowConnection()) {
    console.log('[Prefetch] Skipping prefetch on slow connection');
    return;
  }

  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      resources.forEach(({ href, options }) => {
        prefetchResource(href, options);
      });
    }, { timeout: 3000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      resources.forEach(({ href, options }) => {
        prefetchResource(href, options);
      });
    }, 3000);
  }
}

/**
 * Defer script loading until after page load
 */
export function deferScript(src: string, async: boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
}

/**
 * Initialize analytics after page is fully loaded
 */
export function deferAnalytics(callback: () => void) {
  if (typeof window === 'undefined') return;

  if (document.readyState === 'complete') {
    // Page already loaded
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 1000 });
    } else {
      setTimeout(callback, 1000);
    }
  } else {
    // Wait for page load
    window.addEventListener('load', () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout: 1000 });
      } else {
        setTimeout(callback, 1000);
      }
    });
  }
}
