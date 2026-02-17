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

  let clickTimeout: ReturnType<typeof setTimeout> | null = null;
  let wheelRafId: number | null = null;

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

    // Detect StoreHeader scroll-lock (mobile menu, cart, etc). This lock is not a modal.
    // If lock UI is actually present, do NOT fight it. If the attribute is stale, clear it.
    const storeHeaderLockAttr =
      body.getAttribute('data-storeheader-scroll-lock') === 'true' ||
      html.getAttribute('data-storeheader-scroll-lock') === 'true';
    const hasStoreHeaderLockUi = Boolean(document.querySelector('[data-storeheader-lock-ui="true"]'));

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
    
    if (hasOpenModal || hasOpenAffiliate || (storeHeaderLockAttr && hasStoreHeaderLockUi)) {
      // Skip scroll enablement when modals are genuinely open
      return;
    }

    // If StoreHeader left the page in a locked state (common on some Android/Samsung browsers),
    // unlock it and restore the scroll position.
    if (storeHeaderLockAttr && !hasStoreHeaderLockUi) {
      try {
        body.removeAttribute('data-storeheader-scroll-lock');
        html.removeAttribute('data-storeheader-scroll-lock');
      } catch {
        // Ignore
      }

      const top = body.style.top;
      const lockedY = top && top.startsWith('-') ? Math.abs(parseInt(top, 10)) : null;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      html.style.overflow = '';

      if (typeof lockedY === 'number' && !Number.isNaN(lockedY)) {
        try {
          window.scrollTo(0, lockedY);
        } catch {
          // Ignore
        }
      }
    }

    // Force overflow to auto (CRITICAL for all browsers)
    // On Samsung/Android, be more aggressive because scroll can get stuck even when overflow isn't exactly "hidden".
    if (isSamsungDevice) {
      html.style.overflowY = 'auto';
      html.style.overflowX = 'hidden';
      body.style.overflowY = 'auto';
      body.style.overflowX = 'hidden';
    } else {
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
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
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
        html.style.setProperty('-webkit-overflow-scrolling', 'touch');
        body.style.setProperty('-webkit-overflow-scrolling', 'touch');
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

  // ---------------------------------------------------------------------------
  // Desktop wheel/trackpad fallback
  //
  // Symptom: On larger viewports, some fixed overlays/canvases/3D scenes intercept
  // the wheel event (sometimes calling preventDefault/stopPropagation), so the page
  // only scrolls when the cursor is over a specific scrollable region (e.g. header).
  //
  // Fix: Listen in CAPTURE phase and, if the scrollingElement doesn't move after
  // a wheel input, manually scroll the window by deltaY.
  // ---------------------------------------------------------------------------
  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    const el = target as HTMLElement;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION';
  };

  const isVerticallyScrollable = (el: Element) => {
    const node = el as HTMLElement;
    if (!node) return false;
    // PERF FIX: Check scrollHeight vs clientHeight FIRST (no layout cost if false).
    // Only call getComputedStyle if the element actually has more content than its box.
    if (node.scrollHeight <= node.clientHeight + 2) return false;
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  };

  const findScrollableAncestor = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    let el: HTMLElement | null = target as HTMLElement;
    while (el && el !== document.body && el !== document.documentElement) {
      if (isVerticallyScrollable(el)) return el;
      el = el.parentElement;
    }
    return null;
  };

  const onWheelCapture = (event: WheelEvent) => {
    // Only help desktop-like environments (mouse/trackpad). Mobile scroll uses touch.
    if (window.innerWidth < 769) return;
    if (Math.abs(event.deltaY) < 1) return;

    // Respect pinch-to-zoom and browser zoom gestures
    if (event.ctrlKey || event.metaKey) return;

    // Avoid hijacking wheel inside inputs/editors
    if (isEditableTarget(event.target)) return;

    // If a modal is open, let the modal manage its own scroll.
    const hasOpenModal = document.querySelector('[role="dialog"]:not([data-state="closed"])');
    if (hasOpenModal) return;

    // If the wheel target is inside a dedicated scroll container, don't override.
    const scrollableAncestor = findScrollableAncestor(event.target);
    if (scrollableAncestor) return;

    const scrollingElement = document.scrollingElement || document.documentElement;
    if (!scrollingElement) return;
    const maxScrollable = scrollingElement.scrollHeight - scrollingElement.clientHeight;
    if (maxScrollable <= 4) return;

    // Debounce per-frame: check if the page scroll actually moved after wheel.
    const start = scrollingElement.scrollTop;
    const deltaY = event.deltaY;
    if (wheelRafId !== null) cancelAnimationFrame(wheelRafId);
    wheelRafId = requestAnimationFrame(() => {
      wheelRafId = null;
      const current = (document.scrollingElement || document.documentElement).scrollTop;
      if (Math.abs(current - start) < 1) {
        try {
          window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
        } catch {
          // Ignore
        }
      }
    });
  };

  // Run immediately
  enableScroll();

  // Capture-phase wheel fallback so stopPropagation in components can't block it.
  window.addEventListener('wheel', onWheelCapture, { passive: true, capture: true } as any);

  // Run on DOM content loaded
  const onDomContentLoaded = () => {
    enableScroll();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomContentLoaded);
  }

  // Watch for style attribute changes that might disable scroll
  // PERF FIX: Heavy debounce to prevent Chrome layout thrashing.
  // enableScroll() modifies styles → triggers observer → calls enableScroll() again.
  // Without debounce this creates a reflow loop that makes Chrome scroll feel sluggish.
  let mutationDebounceId: ReturnType<typeof setTimeout> | null = null;
  let isScrolling = false;
  let scrollEndTimer: ReturnType<typeof setTimeout> | null = null;

  // Track scroll state so we don't run enableScroll during active scrolling
  const onScrollStart = () => {
    isScrolling = true;
    if (scrollEndTimer) clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => { isScrolling = false; }, 200);
  };
  window.addEventListener('scroll', onScrollStart, { passive: true });

  const observer = new MutationObserver(() => {
    // PERF: Skip mutations entirely while user is scrolling — this is the #1
    // cause of Chrome scroll jank. enableScroll() forces layout recalculation.
    if (isScrolling) return;
    if (mutationDebounceId) clearTimeout(mutationDebounceId);
    mutationDebounceId = setTimeout(enableScroll, 250);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  // Re-enable scroll on visibility change (user returns to tab)
  const onVisibilityChange = () => {
    if (!document.hidden) {
      enableScroll();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Re-enable scroll after any modal closes (detects clicks)
  const onClick = () => {
    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(enableScroll, 100);
  };
  document.addEventListener('click', onClick, { passive: true });

  // Cleanup function
  return () => {
    window.removeEventListener('wheel', onWheelCapture as any, true as any);
    window.removeEventListener('scroll', onScrollStart);
    if (wheelRafId !== null) {
      cancelAnimationFrame(wheelRafId);
      wheelRafId = null;
    }
    if (mutationDebounceId) {
      clearTimeout(mutationDebounceId);
      mutationDebounceId = null;
    }
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = null;
    }
    observer.disconnect();
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    document.removeEventListener('DOMContentLoaded', onDomContentLoaded);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('click', onClick);
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
