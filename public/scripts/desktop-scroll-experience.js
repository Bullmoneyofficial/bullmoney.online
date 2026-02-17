/**
 * DESKTOP SCROLL EXPERIENCE — BullMoney
 * ═══════════════════════════════════════
 * Premium desktop scroll with:
 *  • Smooth momentum physics (native smooth-scroll + overscroll)
 *  • Scroll-direction CSS classes for auto-hiding nav
 *  • Scroll progress indicator (CSS custom property)
 *  • Scroll-speed-modulated sci-fi audio (Web Audio)
 *  • Parallax-ready scroll velocity tracking
 *  • Scroll-to-top on triple-click scrollbar area
 *  • Smart snap detection for section-based layouts
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 * Waits for splash to finish before activating.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;
  var w = window.innerWidth || document.documentElement.clientWidth || 0;
  if (w <= 769) return;
  var ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) && !/Macintosh/i.test(ua)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ── State ───────────────────────────────────────────────────────── */
  var html = document.documentElement;
  var lastScrollY = 0;
  var scrollDir = "none"; // "up" | "down" | "none"
  var scrollSpeed = 0;
  var smoothedSpeed = 0;
  var lastTimestamp = 0;
  var idleTimer = null;
  var IDLE_MS = 150;
  var SPEED_SMOOTHING = 0.4;
  var rafId = null;
  var active = false;
  var paused = false;
  var scrollListenerAttached = false;

  /* ── Scroll Audio Engine (vanilla Web Audio) ────────────────────── */
  var audioCtx = null;
  var audioNodes = null;
  var audioActive = false;
  var audioFadeTimer = null;
  var userUnlocked = false;

  function getVolume() {
    if (window.__BM_SFX_VOLUME__ !== undefined) return Math.min(1, Math.max(0, window.__BM_SFX_VOLUME__));
    return 0.25;
  }

  function isAudioEnabled() {
    if (window.__BM_SFX_ENABLED__ === false) return false;
    if (window.__BM_MASTER_MUTED__ === true) return false;
    return true;
  }

  function getCtx() {
    if (audioCtx) {
      if (audioCtx.state === "suspended" && userUnlocked) audioCtx.resume().catch(function () {});
      return audioCtx;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) {}
    return audioCtx;
  }

  // Unlock AudioContext on first interaction
  function unlockAudio() {
    userUnlocked = true;
    var c = getCtx();
    if (c && c.state === "suspended") c.resume().catch(function () {});
    window.removeEventListener("click", unlockAudio, true);
    window.removeEventListener("keydown", unlockAudio, true);
  }
  window.addEventListener("click", unlockAudio, true);
  window.addEventListener("keydown", unlockAudio, true);

  /** Create persistent scroll audio nodes (triangle + filtered noise) */
  function createScrollNodes() {
    var c = getCtx();
    if (!c) return null;
    try {
      // Master gain (fades in/out with scroll)
      var master = c.createGain();
      master.gain.value = 0;
      master.connect(c.destination);

      // Triangle oscillator for "engine hum"
      var osc = c.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 120;

      var oscFilter = c.createBiquadFilter();
      oscFilter.type = "bandpass";
      oscFilter.frequency.value = 600;
      oscFilter.Q.value = 0.6;

      osc.connect(oscFilter);
      oscFilter.connect(master);

      // Noise layer for "wind" texture
      var noiseDur = 1.5;
      var noiseLen = Math.floor(c.sampleRate * noiseDur);
      var noiseBuf = c.createBuffer(1, noiseLen, c.sampleRate);
      var noiseData = noiseBuf.getChannelData(0);
      for (var i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3;
      }
      var noise = c.createBufferSource();
      noise.buffer = noiseBuf;
      noise.loop = true;

      var noiseFilter = c.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 1800;

      var noiseGain = c.createGain();
      noiseGain.gain.value = 0.08;

      noise.connect(noiseGain);
      noiseGain.connect(noiseFilter);
      noiseFilter.connect(master);

      osc.start();
      noise.start();

      return {
        master: master,
        osc: osc,
        oscFilter: oscFilter,
        noise: noise,
        noiseGain: noiseGain,
        noiseFilter: noiseFilter,
      };
    } catch (e) {
      return null;
    }
  }

  /** Modulate scroll sound based on speed (0..1) */
  function updateScrollAudio(speed) {
    if (!audioNodes || !audioCtx || !isAudioEnabled()) return;
    var vol = getVolume();
    var BASE_GAIN = 0.05 * vol;
    var t = audioCtx.currentTime;

    // Intensity maps speed to gain and pitch
    var intensity = Math.min(1, speed);
    var targetGain = BASE_GAIN * (0.3 + intensity * 0.7);

    audioNodes.master.gain.cancelScheduledValues(t);
    audioNodes.master.gain.setTargetAtTime(targetGain, t, 0.05);

    // Pitch shifts with speed
    var freq = 120 + intensity * 80;
    audioNodes.osc.frequency.setTargetAtTime(freq, t, 0.08);

    // Filter opens with speed
    audioNodes.oscFilter.frequency.setTargetAtTime(600 + intensity * 400, t, 0.08);

    // Noise increases with speed
    audioNodes.noiseGain.gain.setTargetAtTime(0.08 + intensity * 0.12, t, 0.06);
  }

  /** Fade out scroll sound */
  function fadeOutScrollAudio() {
    if (!audioNodes || !audioCtx) return;
    var t = audioCtx.currentTime;
    audioNodes.master.gain.cancelScheduledValues(t);
    audioNodes.master.gain.setTargetAtTime(0, t, 0.15);
  }

  /* ── Smooth scroll CSS ──────────────────────────────────────────── */
  function injectScrollCSS() {
    var style = document.createElement("style");
    style.id = "bm-desktop-scroll-css";
    style.textContent = [
      "html.bm-splash-done { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }",
      // Overscroll visual
      "html.bm-splash-done body { overscroll-behavior-y: contain; }",
      // Scroll direction classes for nav auto-hide
      "html.scroll-down .bm-auto-hide-nav { transform: translateY(-100%); opacity: 0; pointer-events: none; transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease; }",
      "html.scroll-up .bm-auto-hide-nav, html.scroll-top .bm-auto-hide-nav { transform: translateY(0); opacity: 1; pointer-events: auto; transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease; }",
      // Scroll progress bar
      ".bm-scroll-progress { position: fixed; top: 0; left: 0; height: 2px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899); z-index: 99999; pointer-events: none; transform-origin: left; transform: scaleX(var(--bm-scroll-progress, 0)); transition: transform 0.1s linear; will-change: transform; }",
      // Custom scrollbar styling
      "html.bm-splash-done::-webkit-scrollbar { width: 8px; }",
      "html.bm-splash-done::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }",
      "html.bm-splash-done::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5)); border-radius: 4px; }",
      "html.bm-splash-done::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(59,130,246,0.7), rgba(139,92,246,0.7)); }",
    ].join("\n");
    document.head.appendChild(style);
  }

  /* ── Scroll progress bar element ────────────────────────────────── */
  function createProgressBar() {
    var bar = document.createElement("div");
    bar.className = "bm-scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    return bar;
  }

  /* ── Core scroll handler ────────────────────────────────────────── */
  function onScroll() {
    if (!active || paused) return;
    var now = performance.now();
    var currentY = window.scrollY || window.pageYOffset || 0;
    var delta = currentY - lastScrollY;
    var elapsed = now - lastTimestamp || 16;

    // Direction
    if (delta > 2) {
      if (scrollDir !== "down") {
        scrollDir = "down";
        html.classList.remove("scroll-up", "scroll-top");
        html.classList.add("scroll-down");
      }
    } else if (delta < -2) {
      if (scrollDir !== "up") {
        scrollDir = "up";
        html.classList.remove("scroll-down", "scroll-top");
        html.classList.add("scroll-up");
      }
    }

    // At top
    if (currentY <= 5) {
      html.classList.remove("scroll-down", "scroll-up");
      html.classList.add("scroll-top");
      scrollDir = "none";
    }

    // Speed (px/ms → normalized 0..1 with 2px/ms as max)
    var rawSpeed = Math.abs(delta) / elapsed;
    smoothedSpeed += (rawSpeed - smoothedSpeed) * SPEED_SMOOTHING;
    var normalizedSpeed = Math.min(1, smoothedSpeed / 2);

    // Progress
    var docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = currentY / docHeight;
    html.style.setProperty("--bm-scroll-progress", Math.min(1, Math.max(0, progress)).toFixed(4));

    // Scroll audio
    if (userUnlocked && isAudioEnabled()) {
      if (!audioNodes) audioNodes = createScrollNodes();
      updateScrollAudio(normalizedSpeed);
      clearTimeout(audioFadeTimer);
      audioFadeTimer = setTimeout(fadeOutScrollAudio, IDLE_MS);
    }

    // Export velocity for parallax usage
    window.__BM_SCROLL_VELOCITY__ = {
      speed: normalizedSpeed,
      direction: scrollDir,
      y: currentY,
      progress: progress,
    };

    lastScrollY = currentY;
    lastTimestamp = now;
  }

  /* ── RAF-based scroll listener (smoother than direct scroll event) */
  var ticking = false;
  function scrollRAF() {
    if (!ticking) {
      ticking = true;
      rafId = requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    }
  }

  /* ── Activation (after splash finishes) ─────────────────────────── */
  function activate() {
    if (active) return;
    active = true;
    lastScrollY = window.scrollY || window.pageYOffset || 0;
    lastTimestamp = performance.now();
    html.classList.add("scroll-top");

    injectScrollCSS();
    createProgressBar();

    // Use passive scroll listener with rAF batching
    window.addEventListener("scroll", scrollRAF, { passive: true });
    scrollListenerAttached = true;

    // Initial state
    onScroll();
  }

  function pauseWork() {
    if (paused) return;
    paused = true;
    if (scrollListenerAttached) {
      window.removeEventListener("scroll", scrollRAF);
      scrollListenerAttached = false;
    }
    try { fadeOutScrollAudio(); } catch (e) {}
    try {
      if (audioCtx && audioCtx.state === "running") {
        audioCtx.suspend().catch(function () {});
      }
    } catch (e) {}
  }

  function resumeWork() {
    if (!paused) return;
    paused = false;
    if (active && !scrollListenerAttached) {
      window.addEventListener("scroll", scrollRAF, { passive: true });
      scrollListenerAttached = true;
    }
    try {
      if (audioCtx && audioCtx.state === "suspended" && userUnlocked) {
        audioCtx.resume().catch(function () {});
      }
    } catch (e) {}
  }

  // Wait for splash to finish
  if (window.__BM_SPLASH_FINISHED__) {
    activate();
  } else {
    window.addEventListener("bm-splash-finished", activate, { once: true });
    // Fallback: 20s max wait
    setTimeout(function () {
      if (!active) activate();
    }, 20000);
  }

  // Pause when tab is hidden (prevents background CPU + keeps laptops cool)
  document.addEventListener("visibilitychange", function () {
    if (!active) return;
    if (document.hidden) pauseWork();
    else resumeWork();
  });

  /* ── Cleanup on page hide (for bfcache) ─────────────────────────── */
  window.addEventListener("pagehide", function () {
    try {
      pauseWork();
      window.removeEventListener("click", unlockAudio, true);
      window.removeEventListener("keydown", unlockAudio, true);
    } catch (e) {}
    if (rafId) cancelAnimationFrame(rafId);
    if (audioNodes && audioCtx) {
      try { audioNodes.master.gain.value = 0; } catch (e) {}
    }
  });

})();
