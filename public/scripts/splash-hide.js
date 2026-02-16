(function(){
  function run() {
    var splash = document.getElementById('bm-splash');
    if (!splash) return false;
    if (window.__BM_SPLASH_STARTED__) return true;
    window.__BM_SPLASH_STARTED__ = true;
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(cb){ return setTimeout(cb, 16); };
  var caf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : function(id){ clearTimeout(id); };
  var hardFailTimer = null;
  var visibilityWatchdog = null;

  function forceHide() {
    if (!splash || splash.classList.contains('hide')) return;
    splash.classList.add('hide');
    document.documentElement.classList.add('bm-splash-done');
    setTimeout(function() {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 450);
    window.__BM_SPLASH_FINISHED__ = true;
    try {
      window.dispatchEvent(new Event('bm-splash-finished'));
    } catch (e) {
      // noop
    }
  }
  // --- Loading state machine ---
  var STEPS = ['LOADING CORE','CONNECTING SERVICES','HYDRATING UI','READY'];
  var CHARS = 'ABCDEF0123456789!@#$%^&*';
  var currentStep = 0;
  var progress = 0;
  var reactHydrated = false; // Gate: don't touch step DOM until React hydrates
  var pendingStep = 0;       // Queue step changes for after hydration
  var progressEl = document.getElementById('bm-splash-pct');
  var barEl = document.getElementById('bm-splash-bar');
  var statusEl = document.getElementById('bm-splash-status');
  var stepsEl = document.getElementById('bm-splash-steps');
  var stepEls = stepsEl ? stepsEl.querySelectorAll('.bm-step') : [];
  var lastVisualProgress = 0;
  var lastVisualTick = Date.now();
  var visualProgress = 0;
  var minDigitMs = 25;
  var ninetyStallStart = null;
  var splashStartAt = Date.now();
  var finaleStarted = false;
  var isInAppBrowser = document.documentElement.classList.contains('is-in-app-browser');
  // In-app webviews can be fragile with filter/keyframe-heavy animations.
  // Enable a lite mode to keep the splash reliable.
  try {
    if (isInAppBrowser) splash.classList.add('bm-splash-lite');
  } catch (e) {}
  var minVisibleMs = isInAppBrowser ? 400 : 200;
  var mem = (navigator && navigator.deviceMemory) ? navigator.deviceMemory : 0;
  var lowMemory = mem > 0 && mem <= 4;
  var constrainedSplash = isInAppBrowser || lowMemory;
  var maxSplashMs = constrainedSplash ? 4000 : 6000;
  var loadAudio = null;
  var interactionBound = false;
  var lifecycleBound = false;
  var loadSoundPlayed = false;
  var mutedBootstrapTried = false;
  var readyAt95Armed = false;
  var readyShownAt95 = false;

  function playLoadSound(useMutedBootstrap) {
    if (typeof Audio === 'undefined') return;
    if (loadSoundPlayed) return;
    if (!loadAudio) {
      loadAudio = new Audio('/modals.mp3');
      loadAudio.preload = 'auto';
      loadAudio.volume = 0.18;
      loadAudio.playsInline = true;
    }

    loadAudio.muted = !!useMutedBootstrap;
    if (!loadAudio.muted) loadAudio.volume = 0.18;

    var playPromise;
    try {
      loadAudio.currentTime = 0;
      playPromise = loadAudio.play();
    } catch (e) {
      playPromise = null;
    }

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(function() {
        loadSoundPlayed = true;
        unbindInteractionSoundRetry();
        unbindLifecycleSoundRetry();
        if (loadAudio && loadAudio.muted) {
          setTimeout(function() {
            if (!loadAudio) return;
            loadAudio.muted = false;
            loadAudio.volume = 0;
            var targetVolume = 0.18;
            var fadeStep = 0;
            var fadeMax = 6;
            var fadeIv = setInterval(function() {
              if (!loadAudio) {
                clearInterval(fadeIv);
                return;
              }
              fadeStep++;
              loadAudio.volume = Math.min(targetVolume, (targetVolume / fadeMax) * fadeStep);
              if (fadeStep >= fadeMax) clearInterval(fadeIv);
            }, 35);
          }, 25);
        }
      });
    }

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function() {
        if (!mutedBootstrapTried && !useMutedBootstrap) {
          mutedBootstrapTried = true;
          playLoadSound(true);
          return;
        }
        bindInteractionSoundRetry();
        bindLifecycleSoundRetry();
      });
    } else if (!playPromise) {
      bindInteractionSoundRetry();
      bindLifecycleSoundRetry();
    }
  }

  function onFirstInteraction() {
    unbindInteractionSoundRetry();
    playLoadSound();
  }

  function bindInteractionSoundRetry() {
    if (interactionBound) return;
    interactionBound = true;
    window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true, capture: true });
    window.addEventListener('mousedown', onFirstInteraction, { once: true, passive: true, capture: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true, capture: true });
    window.addEventListener('touchend', onFirstInteraction, { once: true, passive: true, capture: true });
    window.addEventListener('click', onFirstInteraction, { once: true, passive: true, capture: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true, capture: true });
  }

  function onLifecycleRetry() {
    if (loadSoundPlayed) {
      unbindLifecycleSoundRetry();
      return;
    }
    playLoadSound(false);
  }

  function bindLifecycleSoundRetry() {
    if (lifecycleBound) return;
    lifecycleBound = true;
    window.addEventListener('pageshow', onLifecycleRetry, { passive: true });
    window.addEventListener('focus', onLifecycleRetry, { passive: true });
    document.addEventListener('visibilitychange', onLifecycleRetry, { passive: true });
  }

  function unbindLifecycleSoundRetry() {
    if (!lifecycleBound) return;
    lifecycleBound = false;
    window.removeEventListener('pageshow', onLifecycleRetry);
    window.removeEventListener('focus', onLifecycleRetry);
    document.removeEventListener('visibilitychange', onLifecycleRetry);
  }

  function unbindInteractionSoundRetry() {
    if (!interactionBound) return;
    interactionBound = false;
    window.removeEventListener('pointerdown', onFirstInteraction);
    window.removeEventListener('mousedown', onFirstInteraction);
    window.removeEventListener('touchstart', onFirstInteraction);
    window.removeEventListener('touchend', onFirstInteraction);
    window.removeEventListener('click', onFirstInteraction);
    window.removeEventListener('keydown', onFirstInteraction);
  }

  playLoadSound(false);
  bindLifecycleSoundRetry();

  // Encrypted text effect (like MultiStepLoader)
  function encryptText(target, text) {
    if (!target) return;
    var iter = 0;
    var iv = setInterval(function() {
      var out = '';
      for (var i = 0; i < text.length; i++) {
        if (i < iter) out += text[i];
        else out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      target.textContent = out;
      if (iter >= text.length) clearInterval(iv);
      iter += 1.2;
    }, 18);
  }

  // Update progress display (safe — these elements have suppressHydrationWarning)
  function updateProgress(pct) {
    progress = Math.max(0, Math.min(pct, 100));
    var targetDisplay = Math.floor(progress + 0.35);
    if (progress < 100 && targetDisplay > 99) targetDisplay = 99;
    if (targetDisplay < lastVisualProgress) targetDisplay = lastVisualProgress;

    var now = Date.now();
    var digitMs = progress >= 85 ? 60 : minDigitMs;
    if (targetDisplay > visualProgress && now - lastVisualTick >= digitMs) {
      visualProgress += 1;
      lastVisualTick = now;
    }

    if (visualProgress !== lastVisualProgress) {
      lastVisualProgress = visualProgress;
    }

    var display = visualProgress.toString();
    if (display.length < 2) display = '0' + display;
    if (progressEl) progressEl.textContent = display + '%';
    if (barEl) barEl.style.width = visualProgress + '%';

    // Trigger finale at 75%
    if (visualProgress >= 75 && !finaleStarted) {
      startFinale();
    }

    if (visualProgress >= 90) {
      if (!ninetyStallStart) ninetyStallStart = Date.now();
      if (Date.now() - ninetyStallStart > 800) {
        targetPct = 100;
      }
    } else {
      ninetyStallStart = null;
    }

    if (readyAt95Armed && !readyShownAt95 && visualProgress >= 95) {
      readyShownAt95 = true;
      setStep(3);
    }

    syncStepClassesByProgress();
  }

  function syncStepClassesByProgress() {
    if (!stepEls || !stepEls.length) return;

    var completedSteps = Math.floor(visualProgress / 20);
    if (completedSteps < 0) completedSteps = 0;
    if (completedSteps > stepEls.length) completedSteps = stepEls.length;

    for (var i = 0; i < stepEls.length; i++) {
      var nextClass = 'bm-step';
      if (i < completedSteps) nextClass += ' done';
      else if (i === completedSteps && completedSteps < stepEls.length) nextClass += ' active';
      stepEls[i].className = nextClass;

      var icon = stepEls[i].querySelector('.bm-step-icon');
      if (!icon) continue;
      icon.textContent = i < completedSteps ? '\u2713' : '';
    }
  }

  // Advance step — only touches DOM after React hydration to avoid mismatch
  function setStep(idx) {
    if (idx <= currentStep && idx !== 0) return;
    pendingStep = idx;
    if (!reactHydrated) return; // Defer until hydration complete
    applyStep(idx);
  }

  function applyStep(idx) {
    currentStep = idx;
    if (STEPS[idx]) encryptText(statusEl, STEPS[idx]);
  }

  // Flush any deferred step changes after hydration
  function onReactHydrated() {
    if (reactHydrated) return;
    reactHydrated = true;
    if (pendingStep > 0) applyStep(pendingStep);
    syncStepClassesByProgress();
  }

  // --- Smooth progress animation with acceleration ---
  var targetPct = 0;
  var animFrame;
  var stallWatchdog;
  var lastFrameTs = 0;
  function animateProgress() {
    var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var dt = lastFrameTs ? Math.min((now - lastFrameTs) / 16.67, 3) : 1;
    lastFrameTs = now;

    if (progress < targetPct) {
      var remaining = targetPct - progress;
      var delta;

      if (progress >= 85) {
        // 85-100%: accelerate to feel snappier near the end
        var boost = progress >= 95 ? 0.35 : 0.22;
        delta = remaining * boost * dt;
        var fastMin = 0.18;
        var fastMax = progress >= 95 ? 1.2 : 0.8;
        delta = Math.min(Math.max(delta, fastMin * dt), fastMax);
      } else {
        // Front-loaded easing: rush through early %, slow near end for perceived speed
        var easing;
        if (progress >= 75) easing = 0.10;
        else if (progress >= 60) easing = 0.14;
        else if (progress >= 40) easing = 0.22;
        else if (progress >= 20) easing = 0.30;
        else easing = 0.40;

        delta = remaining * easing * dt;
        var maxDelta = progress >= 60 ? 0.6 : 1.8;
        var minDelta = remaining > 1 ? 0.08 : 0.01;
        delta = Math.min(Math.max(minDelta, Math.min(delta, maxDelta)));
      }

      delta = Math.min(remaining, delta);
      updateProgress(progress + delta);
    } else {
      // Keep digits advancing even if progress is paused at a target.
      updateProgress(progress);
    }
    if (!splash || splash.classList.contains('hide')) return;
    animFrame = raf(animateProgress);
  }
  animFrame = raf(animateProgress);

  stallWatchdog = setInterval(function() {
    if (!splash || splash.classList.contains('hide')) return;
    if (progress >= 100) return;
    var stalledFor = Date.now() - lastVisualTick;
    if (stalledFor > 1000 && targetPct > progress + 0.2) {
      updateProgress(Math.min(progress + 1, targetPct));
    }
  }, 250);

  // --- Phase 1: Core loading (0-40%) — fast initial burst for perceived speed ---
  targetPct = 35;

  // Document ready = core loaded
  function onDomReady() {
    targetPct = 50;
    setStep(1);

    // --- Phase 2: Services connecting (30-60%) ---
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }
  }

  function onLoad() {
    targetPct = 75;
    setStep(2);

    // --- Phase 3: Hydration (60-95%) ---
    waitForHydration(function() {
      onReactHydrated();
      readyAt95Armed = true;
      targetPct = 95;
      if (progress >= 95 && !readyShownAt95) {
        readyShownAt95 = true;
        setStep(3);
      }
      
      // Start finale at 85% (triggered from updateProgress)
      // Just wait for 100 to actually finish, then hide
      function waitForHundred() {
        if (visualProgress >= 100) {
          updateProgress(100);
          setTimeout(hide, 400);
        } else {
          raf(waitForHundred);
        }
      }
      waitForHundred();
    });
  }

  function waitForHydration(cb) {
    var checks = 0;
    var maxChecks = constrainedSplash ? 60 : 150; // 3s vs 7.5s max
    
    function check() {
      try {
        checks++;
        var hydrated = false;

        if (!document.body) {
          if (checks >= maxChecks) cb();
          else setTimeout(check, 50);
          return;
        }

        // Signal 1: body has meaningful rendered content beyond splash + scripts
        var bodyChildren = document.body.children;
        var hasContent = false;
        for (var i = 0; i < bodyChildren.length; i++) {
          var child = bodyChildren[i];
          if (child.id === 'bm-splash' || child.tagName === 'SCRIPT') continue;
          if (child.children && child.children.length > 0) {
            hasContent = true;
            break;
          }
        }

        // Signal 2: React root with content
        var reactRoot = document.querySelector('[data-reactroot]') || document.getElementById('__next');
        if (reactRoot && reactRoot.children && reactRoot.children.length > 0) hydrated = true;

        // Signal 3: __NEXT_DATA__ + content
        var nextData = document.getElementById('__NEXT_DATA__');
        if (hasContent && nextData) hydrated = true;

        // Signal 4: Custom event
        if (window.__BM_HYDRATED__) hydrated = true;

        if (hydrated || checks >= maxChecks) {
          cb();
        } else {
          if (constrainedSplash && visualProgress >= 85) {
            var elapsed = Date.now() - splashStartAt;
            if (elapsed > maxSplashMs - 1500) {
              targetPct = 100;
            }
          }
          if (targetPct < 90) targetPct += 0.6;
          setTimeout(check, 50);
        }
      } catch (e) {
        cb();
      }
    }
    check();
  }

  // Listen for custom hydration signal
  window.addEventListener('bm-hydrated', function() {
    window.__BM_HYDRATED__ = true;
  });

  // --- Splash finale: logo grows to playing-card size, everything else fades ---
  function startFinale() {
    if (finaleStarted) return;
    finaleStarted = true;
    targetPct = 100;
    if (!splash || splash.classList.contains('hide')) { hide(); return; }
    
    // Add finale class for CSS animations
    splash.classList.add('bm-splash-finale');
    
    var logoWrap = splash.querySelector('.bm-logo-wrap');
    var title = splash.querySelector('.bm-title');
    var subtitle = splash.querySelector('.bm-subtitle');
    var progressWrap = splash.querySelector('.bm-progress-wrap');
    var orbs = splash.querySelectorAll('.bm-orb');
    
    // Fade out title, subtitle, progress over the 85→100 window
    [title, subtitle, progressWrap].forEach(function(el) {
      if (!el) return;
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.92)';
      el.style.pointerEvents = 'none';
    });
    
    // Fade out orbs
    for (var i = 0; i < orbs.length; i++) {
      orbs[i].style.transition = 'opacity .4s ease';
      orbs[i].style.opacity = '0';
    }
    
    // Grow logo from its current size to 1.75x, centered on screen
    // NOTE: layout CSS owns position/size/transform with !important;
    // we animate via a CSS variable so we don't fight the cascade.
    if (logoWrap) {
      // Kill any running intro animation
      logoWrap.style.animation = 'none';

      // Finale snap: blur → sharp timed to land at the end of the grow.
      // Keep this on the wrapper so it doesn't fight SVG filter (invert/glow).
      try {
        var snapPrefersReduced = false;
        if (window.matchMedia) {
          snapPrefersReduced = !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        if (!snapPrefersReduced) {
          logoWrap.style.filter = 'blur(8px)';
          logoWrap.style.webkitFilter = 'blur(8px)';
          // Ensure blur applies before we start transitioning it away
          void logoWrap.offsetHeight;
        }
      } catch (e) {
        // noop
      }

      // Prefer animating via CSS variable (lets layout CSS keep transform ownership),
      // but provide a Safari-safe fallback by animating transform directly.
      var supportsCssVars = false;
      try {
        supportsCssVars = !!(window.CSS && CSS.supports && CSS.supports('--bm-test: 0'));
      } catch (e) {
        supportsCssVars = false;
      }

      // Start at 1, then animate to 1.75
      try {
        if (supportsCssVars) {
          logoWrap.style.setProperty('--bm-finale-scale', '1');
          void logoWrap.offsetHeight;
          logoWrap.style.setProperty('--bm-finale-scale', '1.75');
        } else {
          // Ensure we win over any stylesheet !important rules
          logoWrap.style.setProperty('transition', 'transform 1.5s cubic-bezier(.22,1,.36,1)', 'important');
          logoWrap.style.setProperty('transform', 'translateX(-15px) scale(1)', 'important');
          void logoWrap.offsetHeight;
          logoWrap.style.setProperty('transform', 'translateX(-15px) scale(1.75)', 'important');
        }
      } catch (e) {
        // Fallback: if setProperty fails for any reason, do nothing.
      }

      // Snap to sharp near the end of the grow.
      try {
        var snapPrefersReduced2 = false;
        if (window.matchMedia) {
          snapPrefersReduced2 = !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        if (!snapPrefersReduced2) {
          setTimeout(function() {
            if (!splash || splash.classList.contains('hide') || !logoWrap) return;
            logoWrap.style.transition = (logoWrap.style.transition ? (logoWrap.style.transition + ',') : '') + 'filter 260ms cubic-bezier(.22,1,.36,1)';
            logoWrap.style.filter = 'blur(0px)';
            logoWrap.style.webkitFilter = 'blur(0px)';
          }, 650);
        }
      } catch (e) {
        // noop
      }

      // After the grow finishes, keep the logo subtly animating in its big state.
      // Respect reduced motion.
      try {
        var prefersReduced = false;
        if (window.matchMedia) {
          prefersReduced = !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        if (!prefersReduced) {
          setTimeout(function() {
            if (!splash || splash.classList.contains('hide')) return;
            splash.classList.add('bm-splash-idle');

            // Clear any existing timer (defensive)
            try {
              if (window.__BM_SPLASH_IDLE_TIMER__) clearInterval(window.__BM_SPLASH_IDLE_TIMER__);
            } catch (e) {}

            var up = false;
            window.__BM_SPLASH_IDLE_TIMER__ = setInterval(function() {
              if (!splash || splash.classList.contains('hide') || !logoWrap) {
                try { clearInterval(window.__BM_SPLASH_IDLE_TIMER__); } catch (e) {}
                window.__BM_SPLASH_IDLE_TIMER__ = null;
                return;
              }
              up = !up;
              // Small pulse around the final scale
              try {
                if (supportsCssVars) {
                  logoWrap.style.setProperty('--bm-finale-scale', up ? '1.78' : '1.72');
                } else {
                  logoWrap.style.setProperty('transition', 'transform .9s cubic-bezier(.22,1,.36,1)', 'important');
                  logoWrap.style.setProperty('transform', up ? 'translateX(-15px) scale(1.78)' : 'translateX(-15px) scale(1.72)', 'important');
                }
              } catch (e) {
                // noop
              }
            }, 950);
          }, 800);
        }
      } catch (e) {
        // noop
      }
    }
  }

  function hide() {
    var elapsed = Date.now() - splashStartAt;
    if (elapsed < minVisibleMs) {
      setTimeout(hide, minVisibleMs - elapsed);
      return;
    }
    if (hardFailTimer) {
      clearTimeout(hardFailTimer);
      hardFailTimer = null;
    }
    if (visibilityWatchdog) {
      window.removeEventListener('visibilitychange', visibilityWatchdog);
      window.removeEventListener('pageshow', visibilityWatchdog);
      visibilityWatchdog = null;
    }
    caf(animFrame);
    clearInterval(stallWatchdog);
    try {
      if (window.__BM_SPLASH_IDLE_TIMER__) {
        clearInterval(window.__BM_SPLASH_IDLE_TIMER__);
        window.__BM_SPLASH_IDLE_TIMER__ = null;
      }
    } catch (e) {
      // noop
    }
    unbindInteractionSoundRetry();
    unbindLifecycleSoundRetry();
    splash.classList.add('hide');
    document.documentElement.classList.add('bm-splash-done');
    setTimeout(function() {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      triggerFinishEffects();
      window.__BM_SPLASH_FINISHED__ = true;
      try {
        window.dispatchEvent(new Event('bm-splash-finished'));
      } catch (e) {
        // noop
      }
    }, 450);
  }

  function triggerFinishEffects() {
    // finish effects removed (no sway)
  }

  try {
    // Start the flow
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady);
    } else {
      onDomReady();
    }

    visibilityWatchdog = function() {
      if (!splash || splash.classList.contains('hide')) return;
      var elapsed = Date.now() - splashStartAt;
      if (elapsed > maxSplashMs) forceHide();
    };
    window.addEventListener('visibilitychange', visibilityWatchdog, { passive: true });
    window.addEventListener('pageshow', visibilityWatchdog, { passive: true });

    // Safety net: ensure exit even in constrained webviews
    setTimeout(function() {
      if (splash && !splash.classList.contains('hide')) startFinale();
    }, constrainedSplash ? 3500 : 5000);

    // Hard fail-safe in case of runtime errors or missing APIs
    hardFailTimer = setTimeout(forceHide, maxSplashMs);
  } catch (e) {
    forceHide();
  }
  return true;
  }

  if (run()) return;

  var tries = 0;
  var maxTries = 200;
  var timer = setInterval(function() {
    tries += 1;
    if (run() || tries >= maxTries) clearInterval(timer);
  }, 50);

  var domObserver = null;
  function observeSplashInsertion() {
    if (domObserver || !('MutationObserver' in window)) return;
    domObserver = new MutationObserver(function() {
      if (run()) {
        if (timer) clearInterval(timer);
        domObserver.disconnect();
        domObserver = null;
      }
    });
    domObserver.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(function() {
      if (!domObserver) return;
      domObserver.disconnect();
      domObserver = null;
    }, 30000);
  }

  observeSplashInsertion();

  window.addEventListener('pageshow', function() {
    if (run() && timer) clearInterval(timer);
  }, { once: true, passive: true });

  window.addEventListener('load', function() {
    if (run() && timer) clearInterval(timer);
  }, { once: true, passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (run()) clearInterval(timer);
    }, { once: true });
  } else {
    if (run()) clearInterval(timer);
  }
})();
