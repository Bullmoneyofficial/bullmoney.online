/**
 * SCROLL UNLOCK FAILSAFE — BullMoney
 * ═════════════════════════════════════════════
 * Ensures scroll is NEVER locked on the homepage or any page.
 * Acts as a safety net if splash or modals don't properly unlock scroll.
 * 
 * Runs early (high priority) to catch and fix overflow issues before anything else.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var d = document;
  var html = d.documentElement;
  var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };

  /**
   * CRITICAL: Force unlock scroll and check for lock attempts
   * This runs immediately and continuously monitors for scroll locks
   */
  function forceUnlockScroll() {
    // Remove any overflow:hidden that might be locking scroll
    var overflowLocked = false;

    // Check html
    if (html.style.overflow === 'hidden' || html.style.overflowY === 'hidden') {
      html.style.overflow = '';
      html.style.overflowY = '';
      html.style.overflowX = '';
      html.style.height = '';
      overflowLocked = true;
    }

    // Check body
    if (d.body && (d.body.style.overflow === 'hidden' || d.body.style.overflowY === 'hidden')) {
      d.body.style.overflow = '';
      d.body.style.overflowY = '';
      d.body.style.overflowX = '';
      d.body.style.height = '';
      d.body.style.position = '';
      overflowLocked = true;
    }

    // Remove position:static that might prevent scrolling
    if (html.style.position === 'static' || html.style.position === 'fixed') {
      html.style.position = '';
    }
    if (d.body && d.body.style.position === 'static') {
      d.body.style.position = '';
    }

    // Log if we unlocked scroll (useful for debugging)
    if (overflowLocked) {
      console.warn('[Scroll-Unlock] Detected locked scroll, forcing unlock');
      try {
        window.dispatchEvent(new CustomEvent('bm-scroll-forced-unlock', { detail: { timestamp: Date.now() } }));
      } catch (e) {}
    }

    return overflowLocked;
  }

  /**
   * FIRST RUN: Unlock immediately on script load
   */
  forceUnlockScroll();

  /**
   * BACKGROUND MONITOR: Check periodically for scroll locks
   * This catches splash/modal code that might have re-locked scroll
   */
  var monitorInterval = null;
  var monitorCount = 0;
  var maxMonitorChecks = 60; // Monitor for 3-6 seconds depending on device

  function startMonitor() {
    if (monitorInterval) return;

    monitorInterval = setInterval(function () {
      monitorCount++;

      // Force unlock if needed
      var wasLocked = forceUnlockScroll();

      // Stop monitoring after ~3 seconds (180 frames)
      // Splash should be done by then
      if (monitorCount >= maxMonitorChecks) {
        clearInterval(monitorInterval);
        monitorInterval = null;

        // Final check - do one more unlock to be sure
        raf(forceUnlockScroll);
      }
    }, 50); // Check every 50ms
  }

  /**
   * START: Initial check and monitoring
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMonitor, { once: true });
  } else {
    startMonitor();
  }

  /**
   * SAFETY: Also check after page shows (for bfcache/back-forward navigation)
   */
  try {
    window.addEventListener('pageshow', function () {
      forceUnlockScroll();
      startMonitor();
    }, { passive: true });
  } catch (e) {}

  /**
   * EMERGENCY: If user tries to scroll but it's locked, force unlock
   * This catches edge cases where scroll gets locked dynamically
   */
  try {
    window.addEventListener('wheel', function () {
      // Don't check on every wheel event (too expensive)
      // Just check if user is actively scrolling
      raf(forceUnlockScroll);
    }, { passive: true });
  } catch (e) {}

  /**
   * Also monitor for scroll attempt via touchpad/trackpad
   */
  try {
    d.addEventListener('touchmove', function () {
      raf(forceUnlockScroll);
    }, { passive: true });
  } catch (e) {}

  /**
   * PUBLIC API: External scripts can call this to force unlock
   */
  window.__BM_FORCE_SCROLL_UNLOCK__ = function () {
    var wasLocked = forceUnlockScroll();
    console.log('[Scroll-Unlock] Manual unlock called, was locked:', wasLocked);
    return !wasLocked; // Returns true if successful (wasn't locked)
  };

  /**
   * PUBLIC API: Check if scroll is currently locked
   */
  window.__BM_IS_SCROLL_LOCKED__ = function () {
    var htmlOverflow = window.getComputedStyle(html).overflow;
    var bodyOverflow = d.body ? window.getComputedStyle(d.body).overflow : 'auto';
    var isLocked = htmlOverflow === 'hidden' || bodyOverflow === 'hidden';
    if (isLocked) {
      console.warn('[Scroll-Unlock] Detected scroll is locked:', { htmlOverflow, bodyOverflow });
    }
    return isLocked;
  };
})();
