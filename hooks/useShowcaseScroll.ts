"use client";

import { useEffect, useRef } from "react";
import { setShowcaseRunningMode, triggerShowcaseBoost } from "@/lib/showcaseBoost";

interface ShowcaseScrollOptions {
  scrollDownDuration?: number;
  bottomPause?: number;
  springBackDuration?: number;
  startDelay?: number;
  respectReducedMotion?: boolean;
  containerSelector?: string;
  enabled?: boolean;
  pageId?: string;
  persistInSession?: boolean;
  genieDuration?: number;
  genieScale?: number;
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
    if (respectReducedMotion && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    if (hasRunRef.current) return;
    hasRunRef.current = true;
    cancelledRef.current = false;

    const containerEl = containerSelector ? document.querySelector<HTMLElement>(containerSelector) : null;
    const rootScroller = !containerEl
      ? ((document.scrollingElement as HTMLElement | null) || document.documentElement || document.body)
      : null;

    let boostTriggered = false;
    const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
    const deviceMemory = nav.deviceMemory ?? 8;
    const hardwareConcurrency = nav.hardwareConcurrency ?? 8;
    const isTouchPointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const isSmallViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
    const isLikelyMobile = isTouchPointer || isSmallViewport;
    const isLowEndDevice = isLikelyMobile && (deviceMemory <= 4 || hardwareConcurrency <= 4);

    let cachedMax = 0;
    let lastMaxRead = 0;
    const getMaxScroll = (): number => {
      const now = performance.now();
      if (now - lastMaxRead > 500) {
        if (containerEl) cachedMax = containerEl.scrollHeight - containerEl.clientHeight;
        else if (rootScroller) cachedMax = rootScroller.scrollHeight - rootScroller.clientHeight;
        else cachedMax = document.documentElement.scrollHeight - window.innerHeight;
        lastMaxRead = now;
      }
      return cachedMax;
    };

    // Emit scroll SFX events so the global ScrollSciFiAudio can play the same dragging sound
    // even when we scroll a container (which doesn't change window.scrollY).
    const lastSfxPosRef = { current: 0 };
    const lastSfxTimeRef = { current: performance.now() };
    let sfxInitialized = false;
    const emitScrollSfx = (nextPos: number) => {
      const now = performance.now();
      if (!sfxInitialized) {
        sfxInitialized = true;
        lastSfxPosRef.current = nextPos;
        lastSfxTimeRef.current = now;
        return;
      }

      const delta = nextPos - lastSfxPosRef.current;
      const elapsed = now - lastSfxTimeRef.current;
      lastSfxPosRef.current = nextPos;
      lastSfxTimeRef.current = now;

      if (Math.abs(delta) < 3) return;
      window.dispatchEvent(
        new CustomEvent("bullmoney-scroll-sfx", {
          detail: {
            delta,
            elapsed,
          },
        })
      );
    };

    let lastScrollY = -999;
    const setScroll = (y: number) => {
      if (Math.abs(y - lastScrollY) < 2) return;
      lastScrollY = y;
      if (containerEl) {
        containerEl.scrollTop = y;
        emitScrollSfx(y);
        return;
      }
      if (rootScroller) rootScroller.scrollTop = y;
      window.scrollTo(0, y);

      emitScrollSfx(y);
    };

    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const pendingIntervals = new Set<ReturnType<typeof setInterval>>();
    let showcaseModeActive = false;
    let screensaverActive = false;

    const setShowcaseMode = (active: boolean) => {
      if (showcaseModeActive === active) return;
      showcaseModeActive = active;
      setShowcaseRunningMode(active);
    };

    const detectScreensaverActive = () => {
      return Boolean(
        document.getElementById("bullmoney-screensaver-overlay") ||
          document.body.classList.contains("bullmoney-frozen") ||
          document.documentElement.classList.contains("bullmoney-frozen"),
      );
    };

    screensaverActive = detectScreensaverActive();

    const onScreensaverFreeze = () => {
      screensaverActive = true;
      cancel();
    };

    const onScreensaverUnfreeze = () => {
      screensaverActive = false;
    };

    const addTimeout = (handler: () => void, ms: number) => {
      const id = setTimeout(() => {
        pendingTimeouts.delete(id);
        handler();
      }, ms);
      pendingTimeouts.add(id);
      return id;
    };

    const addInterval = (handler: () => void, ms: number) => {
      const id = setInterval(handler, ms);
      pendingIntervals.add(id);
      return id;
    };

    let overlayEl: HTMLDivElement | null = null;
    let barEl: HTMLDivElement | null = null;
    let txtEl: HTMLSpanElement | null = null;
    let lastBarUpdate = 0;

    const removeOverlay = () => {
      if (!overlayEl) return;
      if (barEl) barEl.style.width = "100%";
      if (txtEl) txtEl.textContent = "Cached ✓";
      const el = overlayEl;
      overlayEl = null;
      barEl = null;
      txtEl = null;
      addTimeout(() => {
        el.style.opacity = "0";
        addTimeout(() => el.remove(), 300);
      }, 600);
    };

    let cancelArmed = false;
    const events = ["wheel", "touchstart", "touchmove", "mousedown", "keydown"] as const;

    const detach = () => {
      if (!cancelArmed) return;
      cancelArmed = false;
      for (const e of events) window.removeEventListener(e, cancel);
    };

    const cancel = () => {
      if (cancelledRef.current) return;
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      pendingTimeouts.forEach((id) => clearTimeout(id));
      pendingIntervals.forEach((id) => clearInterval(id));
      pendingTimeouts.clear();
      pendingIntervals.clear();
      setShowcaseMode(false);
      removeOverlay();
      detach();
    };

    const attach = () => {
      if (cancelArmed) return;
      cancelArmed = true;
      for (const e of events) window.addEventListener(e, cancel, { passive: true, once: true });
    };

    window.addEventListener("bullmoney-freeze", onScreensaverFreeze as EventListener);
    window.addEventListener("bullmoney-unfreeze", onScreensaverUnfreeze as EventListener);

    const injectOverlay = () => {
      if (overlayEl) return;
      overlayEl = document.createElement("div");
      overlayEl.id = "_sc_overlay";
      overlayEl.style.cssText = "position:fixed;inset:0;z-index:999999;pointer-events:none;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.28);opacity:0;transition:opacity .3s";
      overlayEl.innerHTML = isLowEndDevice
        ? '<div style="background:rgba(0,0,0,.72);color:#fff;font-size:12px;font-weight:500;padding:8px 16px;border-radius:40px;display:flex;align-items:center;gap:8px"><span id="_sc_txt">Loading sections</span><div style="width:56px;height:2px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden"><div id="_sc_bar" style="height:100%;width:0%;background:#fff;border-radius:2px"></div></div></div>'
        : '<div style="background:rgba(0,0,0,.72);color:#fff;font-size:12px;font-weight:500;padding:8px 18px;border-radius:40px;display:flex;align-items:center;gap:8px"><span id="_sc_txt">Loading sections</span><div style="width:56px;height:2px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden"><div id="_sc_bar" style="height:100%;width:0%;background:#fff;border-radius:2px"></div></div></div>';
      document.body.appendChild(overlayEl);
      barEl = overlayEl.querySelector("#_sc_bar") as HTMLDivElement;
      txtEl = overlayEl.querySelector("#_sc_txt") as HTMLSpanElement;
      requestAnimationFrame(() => {
        if (overlayEl) overlayEl.style.opacity = "1";
      });
    };

    const setProgress = (pct: number) => {
      const now = performance.now();
      if (now - lastBarUpdate < 100 && pct < 100) return;
      lastBarUpdate = now;
      if (barEl) barEl.style.width = `${Math.round(pct)}%`;
    };

    const setPhase = (text: string) => {
      if (txtEl) txtEl.textContent = text;
    };

    const runShowcaseBoost = () => {
      if (boostTriggered || cancelledRef.current) return;
      boostTriggered = true;
      triggerShowcaseBoost({ pageId, path: window.location.pathname || "/" });
    };

    const animate = (
      from: number,
      to: number,
      duration: number,
      easing: (t: number) => number,
      onFrame: (value: number, currentTo: number) => void,
      dynamicTo?: boolean,
    ): Promise<number> =>
      new Promise((resolve) => {
        const start = performance.now();
        let currentTo = to;
        let lastRemeasure = start;

        const tick = (now: number) => {
          if (cancelledRef.current) {
            resolve(currentTo);
            return;
          }

          if (dynamicTo && now - lastRemeasure > 500) {
            lastMaxRead = 0;
            const max = getMaxScroll();
            if (max > currentTo) currentTo = max;
            lastRemeasure = now;
          }

          const t = Math.min((now - start) / duration, 1);
          onFrame(from + (currentTo - from) * easing(t), currentTo);

          if (t < 1) rafRef.current = requestAnimationFrame(tick);
          else resolve(currentTo);
        };

        rafRef.current = requestAnimationFrame(tick);
      });

    const delay = (ms: number): Promise<void> =>
      new Promise((resolve) => {
        timeoutRef.current = addTimeout(resolve, ms);
      });

    const waitForSplash = (): Promise<void> =>
      new Promise((resolve) => {
        if ((window as any).__BM_SPLASH_FINISHED__ === true || !document.getElementById("bm-splash")) {
          resolve();
          return;
        }

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.removeEventListener("bm-splash-finished", finish);
          clearInterval(poll);
          clearTimeout(hard);
          pendingIntervals.delete(poll);
          pendingTimeouts.delete(hard);
          resolve();
        };

        window.addEventListener("bm-splash-finished", finish);
        const poll = addInterval(() => {
          if ((window as any).__BM_SPLASH_FINISHED__ === true || !document.getElementById("bm-splash")) {
            if (!(window as any).__BM_SPLASH_FINISHED__) addTimeout(finish, 80);
            else finish();
          }
        }, 200);
        const hard = addTimeout(finish, 10000);
        timeoutRef.current = hard;
      });

    const waitForScreensaverInactive = (): Promise<void> =>
      new Promise((resolve) => {
        if (!screensaverActive && !detectScreensaverActive()) {
          resolve();
          return;
        }

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.removeEventListener("bullmoney-unfreeze", onUnfreeze);
          clearInterval(poll);
          clearTimeout(hard);
          pendingIntervals.delete(poll);
          pendingTimeouts.delete(hard);
          resolve();
        };

        const onUnfreeze = () => {
          screensaverActive = false;
          addTimeout(finish, 120);
        };

        window.addEventListener("bullmoney-unfreeze", onUnfreeze, { once: true });
        const poll = addInterval(() => {
          if (!detectScreensaverActive()) finish();
        }, 250);
        const hard = addTimeout(finish, 12000);
      });

    const waitForScrollable = async (): Promise<number> => {
      for (let i = 0; i < 30 && !cancelledRef.current; i++) {
        lastMaxRead = 0;
        const max = getMaxScroll();
        if (max > 120) return max;
        await delay(200);
      }
      return getMaxScroll();
    };

    const waitForIdle = (): Promise<void> =>
      new Promise((resolve) => {
        if (typeof requestIdleCallback === "function") requestIdleCallback(() => resolve(), { timeout: 3000 });
        else setTimeout(resolve, 100);
      });

    const ua = navigator.userAgent;
    const isInApp = /Instagram|FBAN|FBAV|TikTok|musical_ly|Twitter|GSA|Line\//i.test(ua);

    const run = async () => {
      await waitForSplash();
      if (cancelledRef.current) return;

      await waitForScreensaverInactive();
      if (cancelledRef.current || screensaverActive || detectScreensaverActive()) return;

      await waitForIdle();
      if (cancelledRef.current) return;

      await delay(startDelay);
      if (cancelledRef.current) return;

      await waitForScreensaverInactive();
      if (cancelledRef.current || screensaverActive || detectScreensaverActive()) return;

      // Arm user-cancel only when showcase starts to avoid premature mobile touch cancellations.
      attach();

      setShowcaseMode(true);
      runShowcaseBoost();

      setScroll(0);
      lastScrollY = 0;
      await delay(120);
      if (cancelledRef.current) return;

      lastMaxRead = 0;
      const maxScroll = await waitForScrollable();
      if (cancelledRef.current || maxScroll <= 120) {
        setShowcaseMode(false);
        detach();
        return;
      }

      injectOverlay();
      await delay(500);
      if (cancelledRef.current) return;

      const downDur = isLowEndDevice ? Math.min(scrollDownDuration, 700) : isInApp ? Math.min(scrollDownDuration, 900) : scrollDownDuration;
      const upDur = isLowEndDevice ? Math.min(springBackDuration, 450) : isInApp ? Math.min(springBackDuration, 600) : springBackDuration;

      setPhase("Loading sections");
      const finalMax = await animate(0, maxScroll, downDur, easeInOutCubic, (value, currentTo) => {
        setScroll(value);
        setProgress(currentTo > 0 ? (value / currentTo) * 60 : 0);
      }, !isLowEndDevice);
      if (cancelledRef.current) return;

      lastMaxRead = 0;
      const trueBottom = getMaxScroll();
      if (trueBottom > finalMax + 50) setScroll(trueBottom);
      setProgress(60);

      await delay(bottomPause);
      if (cancelledRef.current) return;

      const backFrom = Math.max(finalMax, trueBottom);
      setPhase("Returning");
      await animate(backFrom, 0, upDur, easeInOutCubic, (value) => {
        setScroll(value);
        setProgress(60 + (1 - value / Math.max(1, backFrom)) * 30);
      });
      if (cancelledRef.current) return;

      setProgress(100);
      setShowcaseMode(false);
      removeOverlay();
      detach();

    };

    run();

    return () => {
      setShowcaseMode(false);
      window.removeEventListener("bullmoney-freeze", onScreensaverFreeze as EventListener);
      window.removeEventListener("bullmoney-unfreeze", onScreensaverUnfreeze as EventListener);
      cancel();
    };
  }, [
    scrollDownDuration,
    bottomPause,
    springBackDuration,
    startDelay,
    respectReducedMotion,
    containerSelector,
    enabled,
    pageId,
  ]);
}
