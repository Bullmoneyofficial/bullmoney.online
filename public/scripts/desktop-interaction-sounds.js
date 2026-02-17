/**
 * DESKTOP INTERACTION SOUNDS — BullMoney
 * ═══════════════════════════════════════
 * Global Web Audio synthesized feedback for every desktop interaction:
 *  • Click on buttons, links, interactive elements → mechanical click
 *  • Hover on interactive elements → soft hover sweep
 *  • Keyboard key presses → typewriter tap
 *  • Form input focus → open chime
 *  • Modal / dropdown opens → open sound
 *  • Escape / close → close sound
 *  • Tab switching → tab ping
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 * Respects user audio preferences via window.__BM_SFX_ENABLED__
 * and window.__BM_SFX_VOLUME__.
 * Waits for first user interaction to unlock AudioContext (autoplay policy).
 */
(function () {
  "use strict";

  /* ── Desktop gate ────────────────────────────────────────────────── */
  if (typeof window === "undefined") return;
  var w = window.innerWidth || document.documentElement.clientWidth || 0;
  if (w <= 769) return;
  var ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) && !/Macintosh/i.test(ua)) return;

  /* ── Reduced motion preference ───────────────────────────────────── */
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ── State ───────────────────────────────────────────────────────── */
  var audioCtx = null;
  var unlocked = false;
  var THROTTLE_MS = 35; // min ms between same-type sounds
  var lastClick = 0;
  var lastHover = 0;
  var lastKey = 0;
  var lastFocus = 0;

  function getVolume() {
    if (window.__BM_SFX_VOLUME__ !== undefined) return Math.min(1, Math.max(0, window.__BM_SFX_VOLUME__));
    return 0.25; // subtle default
  }

  function isEnabled() {
    if (window.__BM_SFX_ENABLED__ === false) return false;
    if (window.__BM_MASTER_MUTED__ === true) return false;
    return true;
  }

  function ctx() {
    if (audioCtx) {
      if (audioCtx.state === "suspended" && unlocked) audioCtx.resume().catch(function () {});
      return audioCtx;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) {}
    return audioCtx;
  }

  /* ── Unlock on first interaction ────────────────────────────────── */
  function unlock() {
    unlocked = true;
    var c = ctx();
    if (c && c.state === "suspended") c.resume().catch(function () {});
    window.removeEventListener("click", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    window.removeEventListener("touchstart", unlock, true);
  }
  window.addEventListener("click", unlock, true);
  window.addEventListener("keydown", unlock, true);
  window.addEventListener("touchstart", unlock, true);

  /* ── Sound generators (matching useSoundEffects.ts patterns) ──── */

  /** Mechanical click: square wave 150Hz → lowpass 800→100Hz, 100ms */
  function playClick() {
    if (!isEnabled()) return;
    var now = performance.now();
    if (now - lastClick < THROTTLE_MS) return;
    lastClick = now;
    var c = ctx();
    if (!c) return;
    try {
      var t = c.currentTime;
      var vol = getVolume();

      var osc = c.createOscillator();
      var gain = c.createGain();
      var filter = c.createBiquadFilter();

      osc.type = "square";
      osc.frequency.setValueAtTime(150, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.1);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {}
  }

  /** Soft hover: sine sweep 400→600Hz, 50ms, at 30% vol */
  function playHover() {
    if (!isEnabled()) return;
    var now = performance.now();
    if (now - lastHover < 80) return; // longer throttle for hover
    lastHover = now;
    var c = ctx();
    if (!c) return;
    try {
      var t = c.currentTime;
      var vol = getVolume() * 0.3;

      var osc = c.createOscillator();
      var gain = c.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  /** Keyboard tap: short noise burst + high sine, typewriter feel */
  function playKeyTap() {
    if (!isEnabled()) return;
    var now = performance.now();
    if (now - lastKey < THROTTLE_MS) return;
    lastKey = now;
    var c = ctx();
    if (!c) return;
    try {
      var t = c.currentTime;
      var vol = getVolume() * 0.2;

      // Short noise burst for mechanical feel
      var bufLen = Math.floor(c.sampleRate * 0.04);
      var buffer = c.createBuffer(1, bufLen, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
      }
      var noise = c.createBufferSource();
      noise.buffer = buffer;

      var noiseFilter = c.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 2000;

      var noiseGain = c.createGain();
      noiseGain.gain.setValueAtTime(vol, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(c.destination);
      noise.start(t);
      noise.stop(t + 0.05);

      // Tiny sine ping for tonal character
      var osc = c.createOscillator();
      var oscGain = c.createGain();
      osc.type = "sine";
      // Randomize pitch slightly for natural feel
      osc.frequency.setValueAtTime(900 + Math.random() * 200, t);
      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.003);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(oscGain);
      oscGain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  /** Focus chime: rising sine 300→500Hz, ~80ms (matches 'open' sound) */
  function playFocus() {
    if (!isEnabled()) return;
    var now = performance.now();
    if (now - lastFocus < 120) return;
    lastFocus = now;
    var c = ctx();
    if (!c) return;
    try {
      var t = c.currentTime;
      var vol = getVolume() * 0.35;

      var osc1 = c.createOscillator();
      var g1 = c.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(300, t);
      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(vol, t + 0.008);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc1.connect(g1);
      g1.connect(c.destination);
      osc1.start(t);
      osc1.stop(t + 0.12);

      var osc2 = c.createOscillator();
      var g2 = c.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(500, t + 0.04);
      g2.gain.setValueAtTime(0, t + 0.04);
      g2.gain.linearRampToValueAtTime(vol, t + 0.048);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc2.connect(g2);
      g2.connect(c.destination);
      osc2.start(t + 0.04);
      osc2.stop(t + 0.16);
    } catch (e) {}
  }

  /** Tab switch: quick sine ping at 600Hz, 50ms */
  function playTab() {
    if (!isEnabled()) return;
    var c = ctx();
    if (!c) return;
    try {
      var t = c.currentTime;
      var vol = getVolume() * 0.3;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  /** Close chime: falling sine 500→300Hz (opposite of open) */
  function playClose() {
    if (!isEnabled()) return;
    var c = ctx();
    if (!c) return;
    try {
      var t = c.currentTime;
      var vol = getVolume() * 0.35;
      var osc1 = c.createOscillator();
      var g1 = c.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(500, t);
      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(vol, t + 0.008);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc1.connect(g1);
      g1.connect(c.destination);
      osc1.start(t);
      osc1.stop(t + 0.12);

      var osc2 = c.createOscillator();
      var g2 = c.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(300, t + 0.04);
      g2.gain.setValueAtTime(0, t + 0.04);
      g2.gain.linearRampToValueAtTime(vol, t + 0.048);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc2.connect(g2);
      g2.connect(c.destination);
      osc2.start(t + 0.04);
      osc2.stop(t + 0.16);
    } catch (e) {}
  }

  /* ── Selector helpers ───────────────────────────────────────────── */
  var INTERACTIVE_SELECTOR =
    'a[href], button, [role="button"], [role="tab"], [role="menuitem"], ' +
    '[role="link"], [tabindex]:not([tabindex="-1"]), input[type="submit"], ' +
    'input[type="button"], .cursor-pointer, [data-clickable]';

  var INPUT_SELECTOR =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
    'textarea, select, [contenteditable="true"]';

  function isInteractive(el) {
    if (!el || !el.matches) return false;
    try { return el.matches(INTERACTIVE_SELECTOR); } catch (e) { return false; }
  }

  function isInput(el) {
    if (!el || !el.matches) return false;
    try { return el.matches(INPUT_SELECTOR); } catch (e) { return false; }
  }

  function closestInteractive(el) {
    if (!el) return null;
    // Walk up max 4 levels to find interactive parent
    var node = el;
    for (var i = 0; i < 5; i++) {
      if (!node) break;
      if (isInteractive(node)) return node;
      node = node.parentElement;
    }
    return null;
  }

  /* ── Global event listeners (capture phase, passive) ────────────── */

  // CLICK: any button, link, or interactive element
  document.addEventListener("click", function (e) {
    if (!unlocked) return;
    var target = closestInteractive(e.target);
    if (target) playClick();
  }, { capture: true, passive: true });

  // HOVER: mouseenter on interactive elements (delegated)
  var hoverTarget = null;
  var lastHoverCheck = 0;
  var hoverCheckThrottle = 40; // Only check DOM every 40ms max
  var isScrolling = false;
  var scrollTimeout = null;

  // Track when scrolling is active (disable hover sounds during scroll for performance)
  window.addEventListener('scroll', function() {
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      isScrolling = false;
      scrollTimeout = null;
    }, 150);
  }, { passive: true });

  document.addEventListener("mouseover", function (e) {
    if (!unlocked || isScrolling) return; // Skip during scroll
    var now = performance.now();
    if (now - lastHoverCheck < hoverCheckThrottle) return; // Skip if checked too recently
    lastHoverCheck = now;
    
    var target = closestInteractive(e.target);
    if (target && target !== hoverTarget) {
      hoverTarget = target;
      playHover();
    }
  }, { capture: true, passive: true });

  document.addEventListener("mouseout", function (e) {
    var target = closestInteractive(e.target);
    if (target === hoverTarget) hoverTarget = null;
  }, { capture: true, passive: true });

  // KEYBOARD: typewriter sound on key presses in inputs, and tab/escape globally
  document.addEventListener("keydown", function (e) {
    if (!unlocked) return;
    var key = e.key;

    // Tab key → tab switch sound
    if (key === "Tab") {
      playTab();
      return;
    }

    // Escape → close sound
    if (key === "Escape") {
      playClose();
      return;
    }

    // Enter on interactive element → click sound
    if (key === "Enter") {
      var target = closestInteractive(e.target);
      if (target) playClick();
      return;
    }

    // Typing in inputs → typewriter tap
    if (isInput(e.target)) {
      // Only printable keys + backspace/delete
      if (key.length === 1 || key === "Backspace" || key === "Delete") {
        playKeyTap();
      }
    }
  }, { capture: true, passive: true });

  // FOCUS: input focus → open chime
  document.addEventListener("focusin", function (e) {
    if (!unlocked) return;
    if (isInput(e.target)) {
      playFocus();
    }
  }, { capture: true, passive: true });

  /* ── Expose globals for React integration ───────────────────────── */
  window.__BM_DESKTOP_SOUNDS__ = {
    playClick: playClick,
    playHover: playHover,
    playKeyTap: playKeyTap,
    playFocus: playFocus,
    playTab: playTab,
    playClose: playClose,
  };

  // Sync with AudioSettingsProvider when it loads
  var syncTimer = setInterval(function () {
    if (window.__BM_SFX_ENABLED__ !== undefined || window.__BM_MASTER_MUTED__ !== undefined) {
      clearInterval(syncTimer);
    }
  }, 2000);
  // Stop checking after 30s to avoid infinite polling
  setTimeout(function () { clearInterval(syncTimer); }, 30000);

  // Clean up audio context on page hide to free memory
  document.addEventListener("pagehide", function () {
    try {
      clearInterval(syncTimer);
      if (audioCtx && audioCtx.close) {
        audioCtx.close().catch(function () {});
      }
      audioCtx = null;
    } catch (e) {}
  }, { once: true });

})();
