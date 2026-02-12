(function(){
  var splash = document.getElementById('bm-splash');
  if (!splash) return;

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
      iter += 0.5;
    }, 30);
  }

  // Update progress display (safe — these elements have suppressHydrationWarning)
  function updateProgress(pct) {
    progress = Math.min(pct, 100);
    var display = Math.floor(progress).toString();
    if (display.length < 2) display = '0' + display;
    if (progressEl) progressEl.textContent = display + '%';
    if (barEl) barEl.style.width = progress + '%';
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
    for (var i = 0; i < stepEls.length; i++) {
      stepEls[i].className = 'bm-step' + (i < idx ? ' done' : (i === idx ? ' active' : ''));
      var icon = stepEls[i].querySelector('.bm-step-icon');
      if (i < idx && icon) icon.textContent = '\u2713';
    }
    if (STEPS[idx]) encryptText(statusEl, STEPS[idx]);
  }

  // Flush any deferred step changes after hydration
  function onReactHydrated() {
    if (reactHydrated) return;
    reactHydrated = true;
    if (pendingStep > 0) applyStep(pendingStep);
  }

  // --- Smooth progress animation with acceleration ---
  var targetPct = 0;
  var animFrame;
  function animateProgress() {
    if (progress < targetPct) {
      // Accelerate as we get closer to 100 — slow at start, fast at end
      var remaining = targetPct - progress;
      var speed;
      if (progress >= 90) speed = Math.max(remaining * 0.3, 1.5);    // Very fast final stretch
      else if (progress >= 70) speed = Math.max(remaining * 0.15, 0.8); // Fast
      else if (progress >= 50) speed = Math.max(remaining * 0.08, 0.5); // Medium
      else speed = 0.5;                                                  // Steady start
      updateProgress(progress + speed);
    }
    if (progress < 100) {
      animFrame = requestAnimationFrame(animateProgress);
    }
  }
  animFrame = requestAnimationFrame(animateProgress);

  // --- Phase 1: Core loading (0-30%) — only animate counter, no DOM class changes ---
  targetPct = 15;

  // Document ready = core loaded
  function onDomReady() {
    targetPct = 30;
    setStep(1);

    // --- Phase 2: Services connecting (30-60%) ---
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }
  }

  function onLoad() {
    targetPct = 60;
    setStep(2);

    // --- Phase 3: Hydration (60-95%) ---
    waitForHydration(function() {
      onReactHydrated();
      targetPct = 95;
      setStep(3);
      
      // Brief pause at READY state so user sees it
      setTimeout(function() {
        targetPct = 100;
        updateProgress(100);
        
        setTimeout(function() {
          hide();
        }, 400);
      }, 300);
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
        if (targetPct < 90) targetPct += 0.3;
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
    cancelAnimationFrame(animFrame);
    splash.classList.add('hide');
    setTimeout(function() {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 700);
  }

  // Start the flow
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }

  // Safety net: 12s max
  setTimeout(function() {
    if (splash && !splash.classList.contains('hide')) hide();
  }, 12000);
})();
