/**
 * useScrollLock – Centralized scroll-lock manager with reference counting.
 *
 * Problem: dozens of modals / menus each independently set
 * `document.body.style.overflow = 'hidden'` and try to restore it on close.
 * On mobile / low-memory / in-app browsers the cleanup races or gets lost,
 * leaving the page permanently un-scrollable.
 *
 * Solution: a global counter. Every consumer calls `useScrollLock(isLocked)`.
 * When the count transitions 0→1, body scroll is disabled.
 * When it transitions 1→0, body scroll is restored.
 * Individual components never touch `body.style.overflow` directly.
 *
 * IMPORTANT: This module is the ONLY place that should control body overflow
 * for modal/menu/drawer purposes.
 */

import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Global singleton state (survives across component instances & re-renders)
// ---------------------------------------------------------------------------
let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyles: {
  overflow: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  height: string;
} | null = null;

function applyLock() {
  if (typeof document === 'undefined') return;

  const body = document.body;
  const html = document.documentElement;

  // Save current scroll position BEFORE locking
  savedScrollY = window.scrollY || window.pageYOffset || 0;

  // Save current styles
  savedBodyStyles = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    height: body.style.height,
  };

  // Use position:fixed approach – works reliably across iOS Safari, Android,
  // Samsung Internet, and in-app browsers (Instagram, Facebook, TikTok).
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';

  html.style.overflow = 'hidden';

  // Mark lock state for forceScrollEnabler to respect
  body.setAttribute('data-scroll-lock-count', String(lockCount));
  html.setAttribute('data-scroll-lock-count', String(lockCount));
}

function releaseLock() {
  if (typeof document === 'undefined') return;

  const body = document.body;
  const html = document.documentElement;

  // Restore styles
  body.style.overflow = savedBodyStyles?.overflow ?? '';
  body.style.position = savedBodyStyles?.position ?? '';
  body.style.top = savedBodyStyles?.top ?? '';
  body.style.left = savedBodyStyles?.left ?? '';
  body.style.right = savedBodyStyles?.right ?? '';
  body.style.width = savedBodyStyles?.width ?? '';
  html.style.overflow = '';

  // Explicitly ensure scroll works after unlock
  html.style.overflowY = 'auto';
  html.style.overflowX = 'hidden';
  body.style.overflowY = 'auto';
  body.style.overflowX = 'hidden';

  // Clear lock markers
  body.removeAttribute('data-scroll-lock-count');
  html.removeAttribute('data-scroll-lock-count');

  // Restore scroll position
  const scrollTarget = savedScrollY;
  savedBodyStyles = null;

  // Use requestAnimationFrame for reliable scroll restoration across browsers
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollTarget);
  });
}

function incrementLock() {
  lockCount++;
  if (lockCount === 1) {
    applyLock();
  } else {
    // Update the count attribute so forceScrollEnabler can see it
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-scroll-lock-count', String(lockCount));
      document.documentElement.setAttribute('data-scroll-lock-count', String(lockCount));
    }
  }
}

function decrementLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    releaseLock();
  } else {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-scroll-lock-count', String(lockCount));
      document.documentElement.setAttribute('data-scroll-lock-count', String(lockCount));
    }
  }
}

// ---------------------------------------------------------------------------
// Emergency unlock – called by forceScrollEnabler when it detects a stale lock
// ---------------------------------------------------------------------------
export function forceUnlockAll() {
  lockCount = 0;
  releaseLock();
}

// Read-only accessor for diagnostics
export function getScrollLockCount() {
  return lockCount;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Lock document scroll while `shouldLock` is true.
 * Safe to call from multiple components simultaneously – uses ref-counting.
 *
 * @example
 *   useScrollLock(isModalOpen);
 */
export function useScrollLock(shouldLock: boolean) {
  const isLockedRef = useRef(false);

  useEffect(() => {
    if (shouldLock && !isLockedRef.current) {
      isLockedRef.current = true;
      incrementLock();
    } else if (!shouldLock && isLockedRef.current) {
      isLockedRef.current = false;
      decrementLock();
    }
  }, [shouldLock]);

  // Cleanup on unmount – ensures lock is released even if component is
  // destroyed while modal is still "open" (e.g. route change).
  useEffect(() => {
    return () => {
      if (isLockedRef.current) {
        isLockedRef.current = false;
        decrementLock();
      }
    };
  }, []);
}

export default useScrollLock;
