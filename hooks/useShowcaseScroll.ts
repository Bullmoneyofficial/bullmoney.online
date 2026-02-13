"use client";

import { useEffect, useRef } from "react";

/**
 * useShowcaseScroll — ultra-lightweight "hero → footer → hero" showcase scroll.
 * V3 — optimized for low-end devices:
 *  - Throttled scrollTo (skips if delta < 2px)
 *  - Progress bar updated max 10x/sec (not every rAF)
 *  - No CSS transitions on progress (eliminates GPU compositing fight)
 *  - Re-measures scrollHeight max every 500ms
 *  - Cancels on any user interaction
 *  - Only runs once per session
 */

const SESSION_KEY_PREFIX = "bm_showcase_scroll_done";

interface ShowcaseScrollOptions {
  scrollDownDuration?: number;
  bottomPause?: number;
  springBackDuration?: number;
  startDelay?: number;
  respectReducedMotion?: boolean;
  containerSelector?: string;
  enabled?: boolean;
  pageId?: string;
  /** @deprecated */ genieDuration?: number;
  /** @deprecated */ genieScale?: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useShowcaseScroll(options: ShowcaseScrollOptions = {}) {
  const {
    scrollDownDuration = 1400,
    bottomPause = 250,
    springBackDuration = 900,
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
    if (typeof window === "undefined" || !enabled) return;
    if (respectReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const sessionKey = `${SESSION_KEY_PREFIX}_${pageId || location?.pathname || "default"}`;
    try { if (sessionStorage.getItem(sessionKey)) return; } catch { /* private */ }
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    cancelledRef.current = false;

    const containerEl = containerSelector ? document.querySelector<HTMLElement>(containerSelector) : null;

    // Cache scrollHeight — reading it forces layout, so we throttle
    let cachedMax = 0;
    let lastMaxRead = 0;
    const getMaxScroll = (): number => {
      const now = performance.now();
      if (now - lastMaxRead > 500) {
        cachedMax = containerEl
          ? containerEl.scrollHeight - containerEl.clientHeight
          : document.documentElement.scrollHeight - window.innerHeight;
        lastMaxRead = now;
      }
      return cachedMax;
    };

    let lastScrollY = -999;
    const setScroll = (y: number) => {
      // Skip DOM write if change is < 2px (invisible, saves layout thrash)
      if (Math.abs(y - lastScrollY) < 2) return;
      lastScrollY = y;
      if (containerEl) containerEl.scrollTop = y;
      else window.scrollTo(0, y);
    };

    // ── Cancel ──
    const cancel = () => {
      if (cancelledRef.current) return;
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      removeOverlay();
      detach();
    };

    const events = ["wheel", "touchstart", "touchmove", "mousedown", "keydown"] as const;
    const attach = () => { for (const e of events) window.addEventListener(e, cancel, { passive: true, once: true }); };
    const detach = () => { for (const e of events) window.removeEventListener(e, cancel); };
    attach();

    // ── Overlay (inline styles only — no injected <style> tag) ──
    let overlayEl: HTMLDivElement | null = null;
    let barEl: HTMLDivElement | null = null;
    let txtEl: HTMLSpanElement | null = null;
    let lastBarUpdate = 0;

    const injectOverlay = () => {
      if (overlayEl) return;
      overlayEl = document.createElement("div");
      overlayEl.id = "_sc_overlay";
      overlayEl.style.cssText = "position:fixed;inset:0;z-index:999999;pointer-events:none;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.32);opacity:0;transition:opacity .35s";
      overlayEl.innerHTML = `<div style="background:rgba(0,0,0,.7);color:#fff;font-size:12px;font-weight:500;padding:8px 18px;border-radius:40px;display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:_scSpin .6s linear infinite"></span><span id="_sc_txt">Caching page</span><div style="width:56px;height:2px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;margin-left:4px"><div id="_sc_bar" style="height:100%;width:0%;background:#fff;border-radius:2px"></div></div></div>`;

      // Single tiny keyframes rule for spinner only
      const s = document.createElement("style");
      s.id = "_sc_kf";
      s.textContent = "@keyframes _scSpin{to{transform:rotate(360deg)}}";
      if (!document.getElementById("_sc_kf")) document.head.appendChild(s);

      document.body.appendChild(overlayEl);
      barEl = overlayEl.querySelector("#_sc_bar") as HTMLDivElement;
      txtEl = overlayEl.querySelector("#_sc_txt") as HTMLSpanElement;
      requestAnimationFrame(() => { if (overlayEl) overlayEl.style.opacity = "1"; });
    };

    const setProgress = (pct: number) => {
      // Throttle bar DOM writes to max ~10/sec
      const now = performance.now();
      if (now - lastBarUpdate < 100 && pct < 100) return;
      lastBarUpdate = now;
      if (barEl) barEl.style.width = `${Math.round(pct)}%`;
    };

    const setPhase = (t: string) => { if (txtEl) txtEl.textContent = t; };

    const removeOverlay = () => {
      if (!overlayEl) return;
      if (barEl) barEl.style.width = "100%";
      setPhase("Cached ✓");
      const el = overlayEl;
      overlayEl = null; barEl = null; txtEl = null;
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 350);
      }, 800);
    };

    // ── Animate ──
    const animate = (
      from: number, to: number, duration: number,
      easing: (t: number) => number,
      onFrame: (v: number, curTo: number) => void,
      dynamicTo?: boolean,
    ): Promise<number> =>
      new Promise((resolve) => {
        const start = performance.now();
        let curTo = to;
        let lastRemeasure = start;
        const tick = (now: number) => {
          if (cancelledRef.current) { resolve(curTo); return; }
          // Re-measure every 500ms for lazy content (only on scroll-down)
          if (dynamicTo && now - lastRemeasure > 500) {
            lastMaxRead = 0; // force fresh read
            const m = getMaxScroll();
            if (m > curTo) curTo = m;
            lastRemeasure = now;
          }
          const t = Math.min((now - start) / duration, 1);
          onFrame(from + (curTo - from) * easing(t), curTo);
          if (t < 1) rafRef.current = requestAnimationFrame(tick);
          else resolve(curTo);
        };
        rafRef.current = requestAnimationFrame(tick);
      });

    const delay = (ms: number): Promise<void> =>
      new Promise((resolve) => { timeoutRef.current = setTimeout(resolve, ms); });

    // ── Wait for scrollable content (max 6s) ──
    const waitForScrollable = async (): Promise<number> => {
      for (let i = 0; i < 30 && !cancelledRef.current; i++) {
        lastMaxRead = 0;
        const m = getMaxScroll();
        if (m > 120) return m;
        await delay(200);
      }
      return getMaxScroll();
    };

    // ── Wait for splash-hide.js ──
    const waitForSplash = (): Promise<void> =>
      new Promise((resolve) => {
        if ((window as any).__BM_SPLASH_FINISHED__ === true || !document.getElementById("bm-splash")) {
          resolve(); return;
        }
        let done = false;
        const finish = () => {
          if (done) return; done = true;
          window.removeEventListener("bm-splash-finished", finish);
          clearInterval(poll); clearTimeout(hard);
          resolve();
        };
        window.addEventListener("bm-splash-finished", finish);
        const poll = setInterval(() => {
          if ((window as any).__BM_SPLASH_FINISHED__ === true || !document.getElementById("bm-splash")) {
            if (!(window as any).__BM_SPLASH_FINISHED__) setTimeout(finish, 80);
            else finish();
          }
        }, 200);
        const hard = setTimeout(finish, 10000);
        timeoutRef.current = hard;
      });

    // ── Main sequence ──
    const run = async () => {
      await waitForSplash();
      if (cancelledRef.current) return;

      await delay(startDelay);
      if (cancelledRef.current) return;

      setScroll(0); lastScrollY = 0;
      await delay(150);
      if (cancelledRef.current) return;

      lastMaxRead = 0;
      const maxScroll = await waitForScrollable();
      if (cancelledRef.current || maxScroll <= 120) return;

      injectOverlay();

      // Brief "Caching page" display
      await delay(800);
      if (cancelledRef.current) return;

      // 1) Scroll down — re-measures for lazy content
      setPhase("Loading sections");
      const finalMax = await animate(0, maxScroll, scrollDownDuration, easeInOutCubic, (v, curTo) => {
        setScroll(v);
        setProgress(curTo > 0 ? (v / curTo) * 60 : 0);
      }, true);
      if (cancelledRef.current) return;

      // Snap to true bottom if more content loaded
      lastMaxRead = 0;
      const trueBottom = getMaxScroll();
      if (trueBottom > finalMax + 50) setScroll(trueBottom);
      setProgress(60);

      // 2) Pause
      await delay(bottomPause);
      if (cancelledRef.current) return;

      // 3) Scroll back up
      const backFrom = Math.max(finalMax, trueBottom);
      setPhase("Returning");
      await animate(backFrom, 0, springBackDuration, easeInOutCubic, (v) => {
        setScroll(v);
        setProgress(60 + (1 - v / Math.max(1, backFrom)) * 30);
      });
      if (cancelledRef.current) return;

      // 4) Finalize
      setProgress(90);
      setPhase("Finalizing");
      await delay(300);
      if (cancelledRef.current) return;
      setProgress(100);

      removeOverlay();
      try { sessionStorage.setItem(sessionKey, "1"); } catch {}
      detach();
    };

    run();
    return () => { cancel(); };
  }, [scrollDownDuration, bottomPause, springBackDuration, startDelay, respectReducedMotion, containerSelector, enabled, pageId]);
}
