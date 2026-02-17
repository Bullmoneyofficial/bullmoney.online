// ==========================================
// DESKTOP INTERACTION OPTIMIZER
// Efficient event handling & debouncing
// ==========================================

(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;

  // ========================================
  // Configuration
  // ========================================
  var config = {
    enableEventDelegation: true,
    enableInputDebounce: true,
    enableGestureOptimization: true,
    debounceDelay: 150,
    throttleDelay: 50,
    maxEventListeners: 1000,
    enablePassiveListeners: true,
    enablePointerEvents: true
  };

  var state = {
    eventListeners: new Map(),
    debounceTimers: new Map(),
    throttleTimers: new Map(),
    activeEventDelegators: new Set(),
    pointerDownTarget: null,
    lastInteractionTime: Date.now()
  };

  // ========================================
  // Event Delegation (Single listener for many elements)
  // ========================================
  var DelegatedEvent = function(container, eventType, selector, handler) {
    this.container = container;
    this.eventType = eventType;
    this.selector = selector;
    this.handler = handler;
    this.delegatedHandler = null;

    this.attach = function() {
      var self = this;
      this.delegatedHandler = function(e) {
        if (e.target.matches(self.selector)) {
          self.handler.call(e.target, e);
        }
      };

      var options = config.enablePassiveListeners ? { passive: true } : false;
      this.container.addEventListener(eventType, this.delegatedHandler, options);
      state.activeEventDelegators.add(this);
    };

    this.detach = function() {
      if (this.delegatedHandler) {
        this.container.removeEventListener(this.eventType, this.delegatedHandler);
      }
      state.activeEventDelegators.delete(this);
    };
  };

  // ========================================
  // Debouncing (Wait for user to stop)
  // ========================================
  function debounce(fn, delay, context) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      var key = fn.toString();

      if (state.debounceTimers.has(key)) {
        clearTimeout(state.debounceTimers.get(key));
      }

      var timer = setTimeout(function() {
        fn.apply(context || w, args);
        state.debounceTimers.delete(key);
      }, delay || config.debounceDelay);

      state.debounceTimers.set(key, timer);
    };
  }

  // ========================================
  // Throttling (Max once per interval)
  // ========================================
  function throttle(fn, delay, context) {
    var lastCall = 0;
    var timer = null;
    var key = fn.toString();

    return function() {
      var now = Date.now();
      var args = Array.prototype.slice.call(arguments);
      var timeSinceLastCall = now - lastCall;

      function call() {
        lastCall = Date.now();
        fn.apply(context || w, args);
      }

      if (timeSinceLastCall >= (delay || config.throttleDelay)) {
        call();
      } else {
        if (timer) clearTimeout(timer);
        timer = setTimeout(call, (delay || config.throttleDelay) - timeSinceLastCall);
      }
    };
  }

  // ========================================
  // Optimize Input Events (Debounce Search, etc)
  // ========================================
  function optimizeInputEvents() {
    if (!config.enableInputDebounce) return;

    var inputs = doc.querySelectorAll('input[type="text"], input[type="search"], textarea');

    inputs.forEach(function(input) {
      // Store original event listeners
      var originalHandlers = {
        oninput: input.oninput,
        onchange: input.onchange,
        onkeyup: input.onkeyup
      };

      // Debounce input events
      input.addEventListener('input', debounce(function(e) {
        if (originalHandlers.oninput) {
          originalHandlers.oninput.call(input, e);
        }
        input.dispatchEvent(new Event('debounced-input', { bubbles: true }));
      }, config.debounceDelay), false);

      // Mark as optimized
      input.classList.add('bm-input-optimized');
    });
  }

  // ========================================
  // Optimize Resize & Scroll Listeners
  // ========================================
  function optimizeWindowEvents() {
    // Throttle resize
    var originalResize = null;
    w.addEventListener('resize', throttle(function() {
      w.dispatchEvent(new CustomEvent('bm-throttled-resize'));
      
      // Also dispatch to document for compatibility
      doc.dispatchEvent(new CustomEvent('bm-throttled-resize'));
    }, config.throttleDelay), false);

    // Throttle orientation change
    w.addEventListener('orientationchange', throttle(function() {
      w.dispatchEvent(new CustomEvent('bm-orientation-change'));
    }, config.throttleDelay), false);

    // Check for idle interactions
    ['mousedown', 'keydown', 'touchstart'].forEach(function(eventType) {
      doc.addEventListener(eventType, function() {
        state.lastInteractionTime = Date.now();
      }, { passive: true });
    });
  }

  // ========================================
  // Pointer Event Optimization
  // ========================================
  function optimizePointerEvents() {
    if (!config.enablePointerEvents) return;

    // Replace old mouse/touch with modern pointer events
    doc.addEventListener('pointerdown', function(e) {
      state.pointerDownTarget = e.target;
    }, { passive: true });

    doc.addEventListener('pointerup', function(e) {
      state.pointerDownTarget = null;
    }, { passive: true });

    doc.addEventListener('pointermove', throttle(function(e) {
      // Dispatch custom event for optimized pointer tracking
      w.dispatchEvent(new CustomEvent('bm-pointer-move', {
        detail: { x: e.clientX, y: e.clientY }
      }));
    }, 16), { passive: true }); // ~60fps
  }

  // ========================================
  // Click Event Optimization
  // ========================================
  function optimizeClickEvents() {
    // Only attach listeners to clickable elements
    var clickableElements = doc.querySelectorAll('a, button, [role="button"], [onclick]');

    clickableElements.forEach(function(el) {
      // Check if handler already attached
      if (el.hasAttribute('data-click-optimized')) return;

      el.addEventListener('click', function(e) {
        state.lastInteractionTime = Date.now();
        
        // Add visual feedback
        el.classList.add('bm-clicked');
        setTimeout(function() {
          el.classList.remove('bm-clicked');
        }, 150);
      }, { passive: false });

      el.setAttribute('data-click-optimized', 'true');
    });
  }

  // ========================================
  // Hover Event Delegation
  // ========================================
  function optimizeHoverEvents() {
    var hoverableElements = doc.querySelectorAll('[data-hover], .bm-hoverable');

    hoverableElements.forEach(function(el) {
      if (el.hasAttribute('data-hover-optimized')) return;

      el.addEventListener('mouseenter', throttle(function(e) {
        this.classList.add('bm-hovered');
      }, 50), { passive: true });

      el.addEventListener('mouseleave', function(e) {
        this.classList.remove('bm-hovered');
      }, { passive: true });

      el.setAttribute('data-hover-optimized', 'true');
    });
  }

  // ========================================
  // Context Menu Optimization
  // ========================================
  function optimizeContextMenu() {
    // Prevent excessive context menu processing
    doc.addEventListener('contextmenu', function(e) {
      // Only process for allowed elements
      if (!e.target.matches('[data-context-menu], .bm-context-menu')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // ========================================
  // Passive Event Listeners
  // ========================================
  function attachPassiveListeners() {
    if (!config.enablePassiveListeners) return;

    // Passive listeners for non-blocking events
    var passiveEvents = ['scroll', 'wheel', 'mousemove', 'touchmove', 'pointermove'];

    passiveEvents.forEach(function(eventType) {
      w.addEventListener(eventType, function() {
        // No-op, just ensures passive listeners are used
      }, { passive: true, once: true });
    });
  }

  // ========================================
  // Cleanup on Page Transition
  // ========================================
  function setupCleanup() {
    w.addEventListener('pagehide', function() {
      // Clear all debounce timers
      state.debounceTimers.forEach(function(timer) {
        clearTimeout(timer);
      });
      state.debounceTimers.clear();

      // Clear all throttle timers
      state.throttleTimers.forEach(function(timer) {
        clearTimeout(timer);
      });
      state.throttleTimers.clear();

      // Detach all delegated listeners
      state.activeEventDelegators.forEach(function(delegator) {
        delegator.detach();
      });
      state.activeEventDelegators.clear();

      // Clear event listener tracking
      state.eventListeners.clear();
    });
  }

  // ========================================
  // Export Public API
  // ========================================
  w.__BM_INTERACTION_OPTIMIZER__ = {
    debounce: debounce,
    throttle: throttle,
    delegate: function(container, eventType, selector, handler) {
      var delegated = new DelegatedEvent(container, eventType, selector, handler);
      delegated.attach();
      return delegated;
    },
    getLastInteractionTime: function() {
      return state.lastInteractionTime;
    },
    isUserInteracting: function() {
      return Date.now() - state.lastInteractionTime < 100;
    },
    getInteractionStats: function() {
      return {
        activeListeners: state.eventListeners.size,
        activeDelegators: state.activeEventDelegators.size,
        pendingDebounces: state.debounceTimers.size,
        pendingThrottles: state.throttleTimers.size
      };
    }
  };

  // ========================================
  // Initialize
  // ========================================
  optimizeInputEvents();
  optimizeWindowEvents();
  optimizePointerEvents();
  optimizeClickEvents();
  optimizeHoverEvents();
  optimizeContextMenu();
  attachPassiveListeners();
  setupCleanup();

  console.log('[BM Interaction] Event handler optimizer initialized');
  // ═════════════════════════════════════════════════════════════
  // ORCHESTRATOR INTEGRATION
  // ═════════════════════════════════════════════════════════════
  if (w.__BM_DESKTOP__) {
    w.__BM_DESKTOP__.register('interaction-optimizer', w.__BM_INTERACTION_OPTIMIZER__);
    
    // Track interaction stats
    setInterval(function() {
      var stats = w.__BM_INTERACTION_OPTIMIZER__.getInteractionStats();
      w.__BM_DESKTOP__.recordMetric('interaction:activeListeners', stats.activeListeners);
      w.__BM_DESKTOP__.recordMetric('interaction:pendingDebounces', stats.pendingDebounces);
    }, 5000);
  }
})();
