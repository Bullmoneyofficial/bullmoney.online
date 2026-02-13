/**
 * Force Scroll Enabler
 * 
 * This utility ensures that scrolling is always enabled on all pages,
 * even if other scripts try to disable it. This fixes issues on:
 * - Chrome (desktop & mobile)
 * - Safari (desktop & mobile)
 * - iOS Safari
 * - Android browsers
 * - Samsung Internet
 * 
 * Usage: Import and call in client components or layout
 */

export function forceEnableScrolling() {
  if (typeof window === 'undefined') return;

  // Detect browser types
  const ua = navigator.userAgent;
  const isSamsungBrowser = /SamsungBrowser/i.test(ua);
  const isAndroidWebView = /Android/i.test(ua) && /wv/i.test(ua);
  const isSamsungDevice = isSamsungBrowser || isAndroidWebView;
  
  // Chrome/Chromium detection (Chrome, Edge, Brave, Opera)
  const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isBrave = (navigator as any).brave !== undefined;
  const isOpera = /OPR/i.test(ua) || /Opera/i.test(ua);
  const isChromeFamily = isChrome || isEdge || isBrave || isOpera;
  
  // Safari detection
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua);
  const isIOSSafari = /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS/i.test(ua);
  
  // In-app browser detection
  const isInstagram = /Instagram/i.test(ua);
  const isFacebook = /FBAN|FBAV/i.test(ua);
  const isGoogle = /GSA/i.test(ua); // Google Search App
  const isTikTok = /TikTok/i.test(ua) || /musical_ly/i.test(ua);
  const isTwitter = /Twitter/i.test(ua);
  const isInAppBrowser = isInstagram || isFacebook || isGoogle || isTikTok || isTwitter;

  const enableScroll = () => {
    const html = document.documentElement;
    const body = document.body;

    // CRITICAL: Remove drunk scroll effects that block scrolling
    // BUT: Skip if showcase scroll is actively running (has overlay)
    const showcaseOverlay = document.getElementById('_sc_overlay');
    if (!showcaseOverlay) {
      html.classList.remove('bm-drunk-scroll');
      html.style.removeProperty('--bm-drunk-x');
      html.style.removeProperty('--bm-drunk-rot');
      if (html.style.transform && html.style.transform.includes('translate3d')) {
        html.style.transform = 'none';
      }
      if (body.style.transform && body.style.transform.includes('translate3d')) {
        body.style.transform = 'none';
      }
    }

    // SAFETY: Don't override scroll lock if modal is actually open
    const hasOpenModal = document.querySelector('[role="dialog"]:not([data-state="closed"])');
    const hasOpenAffiliate = document.querySelector('[data-affiliate-modal]:not([data-state="closed"])');
    
    if (hasOpenModal || hasOpenAffiliate) {
      // Skip scroll enablement when modals are genuinely open
      return;
    }

    // Force overflow to auto (CRITICAL for all browsers)
    if (html.style.overflow === 'hidden' || html.style.overflowY === 'hidden') {
      html.style.overflow = '';
      html.style.overflowY = 'auto';
      html.style.overflowX = 'hidden';
    }

    if (body.style.overflow === 'hidden' || body.style.overflowY === 'hidden') {
      body.style.overflow = '';
      body.style.overflowY = 'auto';
      body.style.overflowX = 'hidden';
    }

    // Force touch-action to enable scrolling (CRITICAL for touch devices)
    if (html.style.touchAction === 'none' || body.style.touchAction === 'none') {
      html.style.touchAction = 'pan-y pan-x';
      body.style.touchAction = 'pan-y pan-x';
    }

    // Ensure height is auto (not fixed) - CRITICAL for content scrolling
    if (html.style.height === '100vh' || html.style.height === '100%') {
      html.style.height = 'auto';
      html.style.minHeight = '100vh';
    }
    if (body.style.height === '100vh' || body.style.height === '100%') {
      body.style.height = 'auto';
      body.style.minHeight = '100vh';
    }

    // Remove position: fixed if present (can block scrolling)
    if (html.style.position === 'fixed') {
      html.style.position = '';
    }
    if (body.style.position === 'fixed') {
      body.style.position = '';
    }

    // Remove modal-open class if no modal is actually open
    if (body.classList.contains('modal-open') && !hasOpenModal) {
      body.classList.remove('modal-open');
    }
    if (body.hasAttribute('data-modal-open') && !hasOpenModal) {
      body.removeAttribute('data-modal-open');
    }
    if (html.hasAttribute('data-modal-open') && !hasOpenModal) {
      html.removeAttribute('data-modal-open');
    }

    // Browser-specific fixes
    if (isSamsungDevice) {
      // Force remove any transforms that might block scrolling
      if (html.style.transform && html.style.transform !== 'none') {
        // Keep scale transforms but remove translate/rotate
        const currentTransform = html.style.transform;
        if (!currentTransform.includes('scale') || currentTransform.includes('translate') || currentTransform.includes('rotate')) {
          html.style.transform = 'none';
        }
      }
      if (body.style.transform && body.style.transform !== 'none') {
        const currentTransform = body.style.transform;
        if (!currentTransform.includes('scale') || currentTransform.includes('translate') || currentTransform.includes('rotate')) {
          body.style.transform = 'none';
        }
      }
      
      // Ensure proper viewport meta for Samsung
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        const content = viewportMeta.getAttribute('content') || '';
        if (!content.includes('user-scalable')) {
          viewportMeta.setAttribute('content', content + ', user-scalable=yes');
        }
      }
      
      // Add Samsung-specific class
      html.classList.add('samsung-browser');
      body.classList.add('samsung-scroll');
    }
    
    // Chrome family fixes (Chrome, Edge, Brave, Opera)
    if (isChromeFamily) {
      html.classList.add('chrome-browser');
      body.classList.add('chrome-scroll');
      
      // Remove transforms that might block scrolling (but preserve scale for zoom)
      if (html.style.transform && html.style.transform !== 'none') {
        const currentTransform = html.style.transform;
        if (!currentTransform.includes('scale') || currentTransform.includes('translate') || currentTransform.includes('rotate')) {
          html.style.transform = 'none';
        }
      }
      if (body.style.transform && body.style.transform !== 'none') {
        const currentTransform = body.style.transform;
        if (!currentTransform.includes('scale') || currentTransform.includes('translate') || currentTransform.includes('rotate')) {
          body.style.transform = 'none';
        }
      }
    }
    
    // Safari fixes
    if (isSafari || isIOSSafari) {
      html.classList.add('safari-browser');
      body.classList.add('safari-scroll');
      
      // iOS Safari specific fixes
      if (isIOSSafari) {
        html.classList.add('ios-safari');
        // Ensure momentum scrolling
        html.style.webkitOverflowScrolling = 'touch';
        body.style.webkitOverflowScrolling = 'touch';
      }
    }
    
    // In-app browser fixes
    if (isInAppBrowser) {
      html.classList.add('inapp-browser');
      body.classList.add('inapp-scroll');
      
      // Specific in-app browser classes
      if (isInstagram) {
        html.classList.add('instagram-browser');
      }
      if (isFacebook) {
        html.classList.add('facebook-browser');
      }
      if (isGoogle) {
        html.classList.add('google-browser');
      }
      if (isTikTok) {
        html.classList.add('tiktok-browser');
      }
      
      // Remove transforms that might block scrolling (but preserve scale for zoom)
      if (html.style.transform && html.style.transform !== 'none') {
        const currentTransform = html.style.transform;
        if (!currentTransform.includes('scale') || currentTransform.includes('translate') || currentTransform.includes('rotate')) {
          html.style.transform = 'none';
        }
      }
      if (body.style.transform && body.style.transform !== 'none') {
        const currentTransform = body.style.transform;
        if (!currentTransform.includes('scale') || currentTransform.includes('translate') || currentTransform.includes('rotate')) {
          body.style.transform = 'none';
        }
      }
    }
  };

  // Run immediately
  enableScroll();

  // Run on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableScroll);
  }

  // Watch for style attribute changes that might disable scroll
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        // Debounce: only check if styles change
        requestAnimationFrame(enableScroll);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Re-enable scroll on visibility change (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      enableScroll();
    }
  });

  // Re-enable scroll after any modal closes (detects clicks)
  document.addEventListener('click', () => {
    setTimeout(enableScroll, 100);
  }, { passive: true });

  // Cleanup function
  return () => {
    observer.disconnect();
  };
}

/**
 * Initialize scroll enabler on mount
 * Use this in a useEffect in your root layout or app component
 */
export function useForceScrollEnabled() {
  if (typeof window === 'undefined') return;

  // Only run on client side
  const cleanup = forceEnableScrolling();

  // Return cleanup function for React
  return cleanup;
}
