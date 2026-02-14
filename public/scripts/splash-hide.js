(function(){
  var splash = document.getElementById('bm-splash');
  if (!splash) return;
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(cb){ return setTimeout(cb, 16); };
  var caf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : function(id){ clearTimeout(id); };
  var hardFailTimer = null;

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
  var lastVisualProgress = -1;
  var lastVisualTick = Date.now();
  var splashStartAt = Date.now();
  var isInAppBrowser = document.documentElement.classList.contains('is-in-app-browser');
  var minVisibleMs = isInAppBrowser ? 800 : 400;
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
    var displayNum = Math.floor(progress + 0.35);
    if (progress < 100 && displayNum > 99) displayNum = 99;
    if (displayNum < lastVisualProgress) displayNum = lastVisualProgress;
    var display = displayNum.toString();
    if (display.length < 2) display = '0' + display;
    if (displayNum !== lastVisualProgress) {
      lastVisualProgress = displayNum;
      lastVisualTick = Date.now();
    }
    if (progressEl) progressEl.textContent = display + '%';
    if (barEl) barEl.style.width = progress + '%';

    if (readyAt95Armed && !readyShownAt95 && progress >= 95) {
      readyShownAt95 = true;
      setStep(3);
    }

    syncStepClassesByProgress();
  }

  function syncStepClassesByProgress() {
    if (!stepEls || !stepEls.length) return;

    var completedSteps = Math.floor(progress / 20);
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

      if (progress >= 90) {
        // 90-100%: slow linear tick so every digit is visible (~250ms each)
        delta = 0.06 * dt;
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
    }
    if (progress < 100) {
      animFrame = requestAnimationFrame(animateProgress);
    }
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
      
      // Wait for progress to actually reach 95 before going to 100
      // so each digit 90-100 is visible
      function waitForNinetyFive() {
        if (progress >= 94.5) {
          targetPct = 100;
          // Let animation naturally tick to 100 — no forced jumps
          function waitForHundred() {
            if (progress >= 99.5) {
              updateProgress(100);
              setTimeout(hide, 150);
            } else {
              raf(waitForHundred);
            }
          }
          waitForHundred();
        } else {
          raf(waitForNinetyFive);
        }
      }
      waitForNinetyFive();
    });
  }

  function waitForHydration(cb) {
    var checks = 0;
    var maxChecks = 150; // 7.5s max
    
    function check() {
      checks++;
      var hydrated = false;

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
        if (targetPct < 90) targetPct += 0.6;
        setTimeout(check, 50);
      }
    }
    check();
  }

  // Listen for custom hydration signal
  window.addEventListener('bm-hydrated', function() {
    window.__BM_HYDRATED__ = true;
  });

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
    caf(animFrame);
    clearInterval(stallWatchdog);
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

    // Safety net: 8s max
    setTimeout(function() {
      if (splash && !splash.classList.contains('hide')) hide();
    }, 8000);

    // Hard fail-safe in case of runtime errors or missing APIs
    hardFailTimer = setTimeout(forceHide, 12000);
  } catch (e) {
    forceHide();
  }
})();
