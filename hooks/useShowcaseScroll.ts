"use client";

import { useEffect, useRef } from "react";

/**
 * useShowcaseScroll — lightweight "hero → footer → hero" spring showcase scroll.
 *
 * On first load / reload:
 *  1. Auto-scrolls smoothly from top to bottom of the page
 *  2. Pauses briefly at the bottom
 *  3. Springs back to the top with a genie snap-back effect
 *  4. Applies a quick scale "genie pinch" on the viewport then releases
 *
 * Designed for mobile (low memory) + desktop:
 *  - Uses requestAnimationFrame easing (no libraries)
 *  - Only runs once per session (sessionStorage guard)
 *  - Cancels immediately on any user interaction (touch / wheel / key)
 *  - Cleans up all listeners on unmount
 */

const SESSION_KEY_PREFIX = "bm_showcase_scroll_done";

interface ShowcaseScrollOptions {
  /** ms to scroll down (default 1800) */
  scrollDownDuration?: number;
  /** ms to pause at bottom (default 400) */
  bottomPause?: number;
  /** ms to spring back up (default 1200) */
  springBackDuration?: number;
  /** ms for genie pinch animation (default 500) */
  genieDuration?: number;
  /** Min scale during genie pinch 0-1 (default 0.96) */
  genieScale?: number;
  /** Delay before starting (ms, default 600) */
  startDelay?: number;
  /** Skip if user has reduced-motion preference (default true) */
  respectReducedMotion?: boolean;
  /** CSS selector for the scrollable container — defaults to window */
  containerSelector?: string;
  /** Gate: scroll won't start until this is true (default true) */
  enabled?: boolean;
  /** Unique page id for session-key so each page gets its own scroll (default: pathname) */
  pageId?: string;
}

// Simple easing functions (no dependencies)
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function useShowcaseScroll(options: ShowcaseScrollOptions = {}) {
  const {
    scrollDownDuration = 1800,
    bottomPause = 400,
    springBackDuration = 1200,
    genieDuration = 500,
    genieScale = 0.96,
    startDelay = 600,
    respectReducedMotion = true,
    containerSelector,
    enabled = true,
    pageId,
  } = options;

  const cancelledRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't start until the page signals it's ready
    if (!enabled) return;

    // Respect reduced-motion
    if (respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Only run once per session per page
    const sessionKey = `${SESSION_KEY_PREFIX}_${pageId || (typeof location !== "undefined" ? location.pathname : "default")}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
    } catch {
      // Private browsing — allow to run
    }

    // Prevent duplicate runs if enabled toggles multiple times
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    cancelledRef.current = false;

    const getContainer = (): HTMLElement | null => {
      if (containerSelector) return document.querySelector(containerSelector);
      return null; // null = use window
    };

    const getScrollTop = (): number => {
      const el = getContainer();
      return el ? el.scrollTop : window.scrollY;
    };

    const getMaxScroll = (): number => {
      const el = getContainer();
      if (el) return el.scrollHeight - el.clientHeight;
      return document.documentElement.scrollHeight - window.innerHeight;
    };

    const setScroll = (y: number) => {
      const el = getContainer();
      if (el) {
        el.scrollTop = y;
      } else {
        window.scrollTo(0, y);
      }
    };

    // Cancel on any user interaction
    const cancel = () => {
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cleanup();
      // Remove genie transform if interrupted
      document.documentElement.style.removeProperty("transform");
      document.documentElement.style.removeProperty("transform-origin");
      document.documentElement.style.removeProperty("transition");
    };

    const interactionEvents = ["wheel", "touchstart", "mousedown", "keydown"] as const;
    interactionEvents.forEach((evt) => window.addEventListener(evt, cancel, { passive: true, once: true }));

    const cleanup = () => {
      interactionEvents.forEach((evt) => window.removeEventListener(evt, cancel));
    };

    // Animate helper using rAF
    const animate = (
      from: number,
      to: number,
      duration: number,
      easing: (t: number) => number,
      onFrame: (value: number) => void,
    ): Promise<void> => {
      return new Promise((resolve) => {
        const start = performance.now();
        const tick = (now: number) => {
          if (cancelledRef.current) { resolve(); return; }
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easing(progress);
          const value = from + (to - from) * easedProgress;
          onFrame(value);
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      });
    };

    const delay = (ms: number): Promise<void> =>
      new Promise((resolve) => {
        timeoutRef.current = setTimeout(resolve, ms);
      });

    // Wait for the global layout splash (#bm-splash) to finish before starting
    const waitForSplash = (): Promise<void> => {
      return new Promise((resolve) => {
        // Already finished
        if ((window as any).__BM_SPLASH_FINISHED__ === true) { resolve(); return; }
        // Splash element already gone
        const el = document.getElementById("bm-splash");
        if (!el) { resolve(); return; }

        // Listen for the splash-finished event
        const onDone = () => {
          window.removeEventListener("bm-splash-finished", onDone);
          resolve();
        };
        window.addEventListener("bm-splash-finished", onDone);

        // Safety: if splash hides via class before event fires, poll briefly
        const poll = setInterval(() => {
          if (
            (window as any).__BM_SPLASH_FINISHED__ === true ||
            !document.getElementById("bm-splash")
          ) {
            clearInterval(poll);
            window.removeEventListener("bm-splash-finished", onDone);
            resolve();
          }
        }, 200);

        // Hard timeout so we never hang forever (8s)
        timeoutRef.current = setTimeout(() => {
          clearInterval(poll);
          window.removeEventListener("bm-splash-finished", onDone);
          resolve();
        }, 8000);
      });
    };

    // Main sequence
    const run = async () => {
      // Wait for the global layout splash to finish first
      await waitForSplash();
      if (cancelledRef.current) return;

      await delay(startDelay);
      if (cancelledRef.current) return;

      // Ensure we start at top
      setScroll(0);

      // Let layout settle so scrollHeight is fully computed
      await delay(300);
      if (cancelledRef.current) return;

      // Re-measure after settle — content may still be loading
      let maxScroll = getMaxScroll();
      // If page content hasn't rendered yet, wait a bit more
      if (maxScroll <= 100) {
        await delay(500);
        if (cancelledRef.current) return;
        maxScroll = getMaxScroll();
      }
      if (maxScroll <= 0) return;

      // 1) Scroll down to bottom
      await animate(0, maxScroll, scrollDownDuration, easeInOutCubic, setScroll);
      if (cancelledRef.current) return;

      // 2) Brief pause at bottom
      await delay(bottomPause);
      if (cancelledRef.current) return;

      // 3) Spring back to top (with overshoot via easeOutBack)
      await animate(maxScroll, 0, springBackDuration, easeOutBack, setScroll);
      if (cancelledRef.current) return;

      // 4) Genie pinch effect on viewport
      const root = document.documentElement;
      root.style.transformOrigin = "center top";
      root.style.transition = "none";

      // Pinch in
      await animate(1, genieScale, genieDuration * 0.5, easeInOutCubic, (v) => {
        root.style.transform = `scale(${v})`;
      });
      if (cancelledRef.current) return;

      // Snap back with spring
      await animate(genieScale, 1, genieDuration * 0.5, easeOutBack, (v) => {
        root.style.transform = `scale(${v})`;
      });

      // Cleanup transform
      root.style.removeProperty("transform");
      root.style.removeProperty("transform-origin");
      root.style.removeProperty("transition");

      // Mark as done for this session
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {
        // Ignore
      }

      cleanup();
    };

    run();

    return () => {
      cancel();
    };
  }, [
    scrollDownDuration,
    bottomPause,
    springBackDuration,
    genieDuration,
    genieScale,
    startDelay,
    respectReducedMotion,
    containerSelector,
    enabled,
    pageId,
  ]);
}
