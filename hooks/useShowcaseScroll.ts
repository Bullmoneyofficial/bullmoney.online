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

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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
  const drunkRafRef = useRef<number>(0);
  const drunkLastScrollRef = useRef<number>(0);
  const drunkActiveRef = useRef(false);
  const drunkLastUpdateRef = useRef(0);
  const drunkXRef = useRef(0);
  const drunkRotRef = useRef(0);

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

    const containerEl = containerSelector ? document.querySelector(containerSelector) : null;
    const getContainer = (): HTMLElement | null => containerEl as HTMLElement | null;

    const maxScrollRef = { current: 0 };
    const maxScrollLastUpdateRef = { current: 0 };

    const getScrollTop = (): number => {
      const el = getContainer();
      return el ? el.scrollTop : window.scrollY;
    };

    const computeMaxScroll = (): number => {
      const el = getContainer();
      if (el) return el.scrollHeight - el.clientHeight;
      return document.documentElement.scrollHeight - window.innerHeight;
    };

    const refreshMaxScroll = (force = false): number => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (force || now - maxScrollLastUpdateRef.current > 500) {
        maxScrollRef.current = computeMaxScroll();
        maxScrollLastUpdateRef.current = now;
      }
      return maxScrollRef.current;
    };

    const getMaxScroll = (force = false): number => refreshMaxScroll(force);

    const setScroll = (y: number) => {
      const el = getContainer();
      if (el) {
        el.scrollTop = y;
      } else {
        window.scrollTo(0, y);
      }
    };

    const stopDrunk = () => {
      if (drunkRafRef.current) cancelAnimationFrame(drunkRafRef.current);
      drunkActiveRef.current = false;
      drunkXRef.current = 0;
      drunkRotRef.current = 0;
      const root = document.documentElement;
      root.classList.remove("bm-drunk-scroll");
      root.style.removeProperty("--bm-drunk-x");
      root.style.removeProperty("--bm-drunk-rot");
    };

    const updateDrunk = (now?: number) => {
      if (cancelledRef.current) { stopDrunk(); return; }
      const ts = typeof now === "number" ? now : (typeof performance !== "undefined" ? performance.now() : Date.now());
      // Cap updates to reduce CPU load while keeping motion smooth.
      if (ts - drunkLastUpdateRef.current < 24) {
        drunkRafRef.current = requestAnimationFrame(updateDrunk);
        return;
      }
      drunkLastUpdateRef.current = ts;
      const root = document.documentElement;
      const maxScroll = Math.max(1, getMaxScroll());
      const scrollTop = getScrollTop();
      let strength = Math.min(1, Math.max(0, scrollTop / maxScroll));
      // Ease the curve and taper near the bottom to avoid heavy transforms at footer.
      strength = strength * strength * (3 - 2 * strength);
      if (maxScroll - scrollTop < 220) strength *= 0.55;

      if (strength <= 0 && Date.now() - drunkLastScrollRef.current > 600) {
        stopDrunk();
        return;
      }

      const t = ts / 280;
      const ampX = 2 + 6 * strength;
      const ampRot = 0.1 + 0.4 * strength;
      const targetX = Math.sin(t) * ampX;
      const targetRot = Math.sin(t + 0.7) * ampRot;
      const smooth = 0.18 + 0.12 * strength;
      const x = lerp(drunkXRef.current, targetX, smooth);
      const rot = lerp(drunkRotRef.current, targetRot, smooth);
      drunkXRef.current = x;
      drunkRotRef.current = rot;

      root.style.setProperty("--bm-drunk-x", `${Math.round(x * 100) / 100}px`);
      root.style.setProperty("--bm-drunk-rot", `${Math.round(rot * 1000) / 1000}deg`);
      drunkRafRef.current = requestAnimationFrame(updateDrunk);
    };

    const startDrunk = () => {
      if (drunkActiveRef.current) return;
      drunkActiveRef.current = true;
      document.documentElement.classList.add("bm-drunk-scroll");
      drunkRafRef.current = requestAnimationFrame(updateDrunk);
    };

    const noteScrollActivity = () => {
      drunkLastScrollRef.current = Date.now();
      refreshMaxScroll();
      startDrunk();
    };

    // Cancel on any user interaction
    const cancel = () => {
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cleanup();
      removeOverlay();
      stopDrunk();
      // Remove genie transform if interrupted
      document.documentElement.style.removeProperty("transform");
      document.documentElement.style.removeProperty("transform-origin");
      document.documentElement.style.removeProperty("transition");
    };

    // ── Lightweight "caching" overlay ──────────────────────────────────
    let overlayEl: HTMLDivElement | null = null;
    let overlayStyleEl: HTMLStyleElement | null = null;
    let progressBarEl: HTMLDivElement | null = null;
    let phaseTextEl: HTMLSpanElement | null = null;

    const injectOverlay = () => {
      if (overlayEl) return;

      overlayStyleEl = document.createElement("style");
      overlayStyleEl.textContent = `
        @keyframes _sc_in { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes _sc_out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.97)} }
        @keyframes _sc_spin { to{transform:rotate(360deg)} }
        #_sc_overlay{position:fixed;inset:0;z-index:999999;pointer-events:none;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);animation:_sc_in .3s ease-out both;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
        #_sc_overlay.out{animation:_sc_out .3s ease-in both}
        ._sc_pill{background:rgba(0,0,0,.7);color:#fff;font-size:12px;font-weight:500;padding:8px 18px;border-radius:40px;display:flex;align-items:center;gap:8px;box-shadow:0 2px 12px rgba(0,0,0,.2)}
        ._sc_dot{width:12px;height:12px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:_sc_spin .6s linear infinite}
        ._sc_bar_wrap{width:60px;height:2px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;margin-left:4px}
        ._sc_bar_fill{height:100%;width:0%;background:#fff;border-radius:2px;transition:width .1s linear}
        html.store-active #_sc_overlay{background:rgba(0,0,0,.15)}
        html.store-active ._sc_pill{background:rgba(255,255,255,.85);color:#1d1d1f;box-shadow:0 2px 12px rgba(0,0,0,.08)}
        html.store-active ._sc_dot{border-color:rgba(0,0,0,.1);border-top-color:#1d1d1f}
        html.store-active ._sc_bar_wrap{background:rgba(0,0,0,.08)}
        html.store-active ._sc_bar_fill{background:#1d1d1f}
      `;
      document.head.appendChild(overlayStyleEl);

      overlayEl = document.createElement("div");
      overlayEl.id = "_sc_overlay";
      overlayEl.innerHTML = `<div class="_sc_pill"><div class="_sc_dot"></div><span class="_sc_txt">Caching page</span><div class="_sc_bar_wrap"><div class="_sc_bar_fill"></div></div></div>`;
      document.body.appendChild(overlayEl);

      progressBarEl = overlayEl.querySelector("._sc_bar_fill") as HTMLDivElement;
      phaseTextEl = overlayEl.querySelector("._sc_txt") as HTMLSpanElement;
    };

    const setOverlayProgress = (pct: number) => {
      if (progressBarEl) progressBarEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    };

    const setOverlayPhase = (text: string) => {
      if (phaseTextEl) phaseTextEl.textContent = text;
    };

    const removeOverlay = () => {
      if (!overlayEl) return;
      setOverlayProgress(100);
      setOverlayPhase("Cached ✓");
      const el = overlayEl;
      const styleEl = overlayStyleEl;
      setTimeout(() => {
        el.classList.add("out");
        setTimeout(() => { el?.remove(); styleEl?.remove(); }, 350);
      }, 1300);
      overlayEl = null;
      overlayStyleEl = null;
      progressBarEl = null;
      phaseTextEl = null;
    };
    // ────────────────────────────────────────────────────────────────────

    const interactionEvents = ["wheel", "touchstart", "mousedown", "keydown"] as const;
    interactionEvents.forEach((evt) => window.addEventListener(evt, cancel, { passive: true, once: true }));

    const scrollTarget = getContainer() || window;
    const onScroll = () => {
      if (respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      noteScrollActivity();
    };
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      refreshMaxScroll(true);
    };
    window.addEventListener("resize", onResize, { passive: true });

    const cleanup = () => {
      interactionEvents.forEach((evt) => window.removeEventListener(evt, cancel));
      scrollTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };

    // Optimized animate helper using rAF with frame skipping for 60fps
    const animate = (
      from: number,
      to: number,
      duration: number,
      easing: (t: number) => number,
      onFrame: (value: number) => void,
    ): Promise<void> => {
      return new Promise((resolve) => {
        const start = performance.now();
        let lastFrameTime = start;
        const tick = (now: number) => {
          if (cancelledRef.current) { resolve(); return; }
          // Enforce ~16.67ms per frame (60fps) to avoid excessive DOM writes
          if (now - lastFrameTime < 14) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          lastFrameTime = now;
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

    const waitForScrollable = async (): Promise<number> => {
      let checks = 0;
      const maxChecks = 60;
      while (!cancelledRef.current && checks < maxChecks) {
        const maxScroll = getMaxScroll(true);
        if (maxScroll > 120) return maxScroll;
        checks += 1;
        await delay(200);
      }
      return getMaxScroll();
    };

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
      const maxScroll = await waitForScrollable();
      if (cancelledRef.current) return;
      if (maxScroll <= 120) return;

      // Show the overlay
      injectOverlay();
      startDrunk();
      noteScrollActivity();

      // 1) Scroll down to bottom — progress 0→60%
      await animate(0, maxScroll, scrollDownDuration, easeInCubic, (v) => {
        setScroll(v);
        setOverlayProgress((v / maxScroll) * 60);
        noteScrollActivity();
      });
      if (cancelledRef.current) return;

      setOverlayProgress(60);

      // 2) Brief pause at bottom
      await delay(bottomPause);
      if (cancelledRef.current) return;

      setOverlayPhase("Returning");

      // 3) Spring back to top — progress 60→85%
      await animate(maxScroll, 0, springBackDuration, easeInCubic, (v) => {
        setScroll(v);
        setOverlayProgress(60 + (1 - v / maxScroll) * 25);
        noteScrollActivity();
      });
      if (cancelledRef.current) return;

      setOverlayProgress(90);
      setOverlayPhase("Finalizing");

      // 4) Genie pinch effect on viewport — progress 90→100%
      const root = document.documentElement;
      root.style.transformOrigin = "center top";
      root.style.transition = "none";

      // Pinch in
      await animate(1, genieScale, genieDuration * 0.5, easeInOutCubic, (v) => {
        root.style.transform = `scale(${v})`;
        const pinchProgress = (1 - v) / (1 - genieScale);
        setOverlayProgress(90 + pinchProgress * 5);
      });
      if (cancelledRef.current) return;

      // Snap back with spring
      await animate(genieScale, 1, genieDuration * 0.5, easeOutBack, (v) => {
        root.style.transform = `scale(${v})`;
        const snapProgress = (v - genieScale) / (1 - genieScale);
        setOverlayProgress(95 + snapProgress * 5);
      });

      // Cleanup transform
      root.style.removeProperty("transform");
      root.style.removeProperty("transform-origin");
      root.style.removeProperty("transition");

      // Dismiss the overlay
      removeOverlay();

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
      stopDrunk();
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
