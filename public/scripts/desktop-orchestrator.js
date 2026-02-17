// ═════════════════════════════════════════════════════════════════
// DESKTOP ORCHESTRATOR — Central Coordinator for All Desktop Scripts
// Unified event bus, module registration, feature coordination
// Loads: afterInteractive (right after desktop-performance-tuning.js)
// ═════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;

  // ═════════════════════════════════════════════════════════════
  // Central Desktop Namespace
  // All desktop optimization scripts register here
  // ═════════════════════════════════════════════════════════════
  var DESKTOP = w.__BM_DESKTOP__ = w.__BM_DESKTOP__ || {
    version: '1.0',
    ready: false,
    modules: {},
    moduleOrder: [],
    config: {},
    state: {}
  };

  var loaded = {};
  var pending = [];
  var eventListeners = {};
  var featureFlags = {};
  var performanceMetrics = {};

  // ═════════════════════════════════════════════════════════════
  // 1. MODULE REGISTRATION
  // ═════════════════════════════════════════════════════════════
  DESKTOP.register = function(name, api, priority) {
    if (loaded[name]) {
      console.warn('[DESKTOP] Module already loaded:', name);
      return false;
    }

    loaded[name] = true;
    DESKTOP.modules[name] = api || {};
    DESKTOP.moduleOrder.push({ name: name, priority: priority || 0 });

    console.log('[DESKTOP] Module registered:', name);

    // Dispatch module-loaded event
    try {
      w.dispatchEvent(new CustomEvent('bm-desktop:module-loaded', {
        detail: { name: name, api: api }
      }));
    } catch (e) {}

    // Check if all core modules loaded
    checkAllReady();
    return true;
  };

  // ═════════════════════════════════════════════════════════════
  // 2. DEPENDENCY WAITING — scripts wait for other modules
  // ═════════════════════════════════════════════════════════════
  DESKTOP.whenReady = function(moduleName, callback) {
    if (loaded[moduleName]) {
      try {
        callback(DESKTOP.modules[moduleName]);
      } catch (e) {
        console.error('[DESKTOP] Error in callback for', moduleName, e);
      }
      return;
    }

    pending.push({ module: moduleName, fn: callback });
  };

  DESKTOP.whenAllReady = function(callback) {
    if (DESKTOP.ready) {
      try {
        callback(DESKTOP);
      } catch (e) {
        console.error('[DESKTOP] Error in all-ready callback', e);
      }
      return;
    }

    pending.push({ module: '__ALL__', fn: callback });
  };

  function checkAllReady() {
    // List of core modules that must load
    var coreModules = [
      'performance-tuning',
      'image-optimizer',
      'network-optimizer',
      'interaction-optimizer',
      'memory-optimizer'
    ];

    // Check if all core modules loaded
    var allLoaded = coreModules.every(function(name) {
      return loaded[name];
    });

    if (allLoaded && !DESKTOP.ready) {
      DESKTOP.ready = true;
      console.log('[DESKTOP] ✓ All core modules ready');

      // Dispatch global ready event
      try {
        w.dispatchEvent(new CustomEvent('bm-desktop:ready', {
          detail: { timestamp: Date.now() }
        }));
      } catch (e) {}
    }

    // Process pending callbacks
    var stillPending = [];
    for (var i = 0; i < pending.length; i++) {
      var p = pending[i];
      if (p.module === '__ALL__') {
        if (DESKTOP.ready) {
          try {
            p.fn(DESKTOP);
          } catch (e) {
            console.error('[DESKTOP] Error in pending callback', e);
          }
        } else {
          stillPending.push(p);
        }
      } else if (loaded[p.module]) {
        try {
          p.fn(DESKTOP.modules[p.module]);
        } catch (e) {
          console.error('[DESKTOP] Error in pending callback for', p.module, e);
        }
      } else {
        stillPending.push(p);
      }
    }
    pending = stillPending;
  }

  // ═════════════════════════════════════════════════════════════
  // 3. GLOBAL EVENT BUS — cross-script communication
  // ═════════════════════════════════════════════════════════════
  DESKTOP.on = function(event, handler) {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(handler);

    // Return unsubscribe function
    return function() {
      DESKTOP.off(event, handler);
    };
  };

  DESKTOP.off = function(event, handler) {
    if (!eventListeners[event]) return;
    eventListeners[event] = eventListeners[event].filter(function(h) {
      return h !== handler;
    });
  };

  DESKTOP.emit = function(event, data) {
    // Record event for metrics
    recordMetric('event:' + event, 1);

    // Internal listeners
    if (eventListeners[event]) {
      for (var i = 0; i < eventListeners[event].length; i++) {
        try {
          eventListeners[event][i](data);
        } catch (e) {
          console.error('[DESKTOP] Error in event listener for', event, e);
        }
      }
    }

    // Also dispatch as DOM CustomEvent for React/external listeners
    try {
      w.dispatchEvent(new CustomEvent('bm-desktop:' + event, {
        detail: data
      }));
    } catch (e) {}
  };

  // ═════════════════════════════════════════════════════════════
  // 4. FEATURE FLAGS — Enable/disable features per tier
  // ═════════════════════════════════════════════════════════════
  DESKTOP.setFeature = function(name, enabled) {
    featureFlags[name] = enabled;
    DESKTOP.emit('feature-changed', { name: name, enabled: enabled });
  };

  DESKTOP.getFeature = function(name) {
    if (name in featureFlags) {
      return featureFlags[name];
    }

    // Check if disabled by performance tier
    var tier = w.__BM_PERFORMANCE_TIER__ || 1;
    switch (name) {
      case 'scroll-audio':
        return tier >= 3; // Only on high-end
      case 'particle-effects':
        return tier >= 3;
      case 'blur-effects':
        return tier >= 2;
      case 'animations':
        return tier >= 1;
      case 'lazy-loading':
        return true; // Always enabled
      case 'memory-cleanup':
        return true; // Always enabled
      default:
        return true;
    }
  };

  DESKTOP.printFeatures = function() {
    console.log('[DESKTOP] Feature Flags:', featureFlags);
  };

  // ═════════════════════════════════════════════════════════════
  // 5. PERFORMANCE METRICS — unified metrics collection
  // ═════════════════════════════════════════════════════════════
  function recordMetric(name, value) {
    if (!performanceMetrics[name]) {
      performanceMetrics[name] = [];
    }
    performanceMetrics[name].push({
      value: value,
      timestamp: Date.now()
    });

    // Keep only last 100 entries per metric
    if (performanceMetrics[name].length > 100) {
      performanceMetrics[name].shift();
    }
  }

  DESKTOP.recordMetric = recordMetric;

  DESKTOP.getMetrics = function(name) {
    if (!name) {
      return performanceMetrics;
    }
    return performanceMetrics[name] || [];
  };

  DESKTOP.printMetrics = function() {
    var summary = {};
    for (var key in performanceMetrics) {
      var values = performanceMetrics[key];
      if (values.length === 0) continue;

      var sum = values.reduce(function(acc, v) { return acc + v.value; }, 0);
      var avg = sum / values.length;
      var last = values[values.length - 1].value;

      summary[key] = {
        count: values.length,
        average: avg.toFixed(2),
        last: last
      };
    }
    console.table(summary);
  };

  // ═════════════════════════════════════════════════════════════
  // 6. CONFLICT PREVENTION — prevent duplicate functionality
  // ═════════════════════════════════════════════════════════════
  var handlers = {};

  DESKTOP.interceptEvent = function(eventType, handler) {
    // Prevent duplicate event handlers
    if (handlers[eventType]) {
      console.warn('[DESKTOP] Event already intercepted:', eventType);
      return false;
    }

    handlers[eventType] = handler;
    return true;
  };

  DESKTOP.getEventInterceptor = function(eventType) {
    return handlers[eventType];
  };

  // ═════════════════════════════════════════════════════════════
  // 7. STATE MANAGEMENT — shared state for all modules
  // ═════════════════════════════════════════════════════════════
  DESKTOP.setState = function(key, value) {
    var oldValue = DESKTOP.state[key];
    DESKTOP.state[key] = value;

    if (oldValue !== value) {
      DESKTOP.emit('state-changed:' + key, { old: oldValue, new: value });
    }
  };

  DESKTOP.getState = function(key) {
    return DESKTOP.state[key];
  };

  DESKTOP.printState = function() {
    console.log('[DESKTOP] State:', DESKTOP.state);
  };

  // ═════════════════════════════════════════════════════════════
  // 8. UNIFIED DEBUGGING
  // ═════════════════════════════════════════════════════════════
  DESKTOP.debug = function() {
    console.group('[DESKTOP] Orchestrator Debug');
    console.log('Version:', DESKTOP.version);
    console.log('Ready:', DESKTOP.ready);
    console.log('Modules loaded:', Object.keys(loaded).length);
    console.log('Module list:', DESKTOP.moduleOrder);
    console.log('State:', DESKTOP.state);
    console.log('Features:', featureFlags);
    console.log('Pending callbacks:', pending.length);
    console.groupEnd();
  };

  DESKTOP.health = function() {
    var report = {
      ready: DESKTOP.ready,
      modules: Object.keys(loaded).length,
      events: Object.keys(eventListeners).length,
      metrics: Object.keys(performanceMetrics).length,
      pending: pending.length,
      tier: w.__BM_PERFORMANCE_TIER__,
      memory: null
    };

    if (w.__BM_MEMORY_OPTIMIZER__) {
      var memStats = w.__BM_MEMORY_OPTIMIZER__.getMemoryStats();
      report.memory = {
        percent: memStats ? memStats.percentUsed.toFixed(1) : 'N/A',
        pressured: w.__BM_MEMORY_OPTIMIZER__.isMemoryPressured()
      };
    }

    return report;
  };

  DESKTOP.printHealth = function() {
    console.table(DESKTOP.health());
  };

  // ═════════════════════════════════════════════════════════════
  // 9. MODULE INITIALIZATION HELPERS
  // ═════════════════════════════════════════════════════════════
  DESKTOP.requireModule = function(name) {
    if (!loaded[name]) {
      console.error('[DESKTOP] Module not loaded:', name);
      return null;
    }
    return DESKTOP.modules[name];
  };

  DESKTOP.listModules = function() {
    return Object.keys(DESKTOP.modules);
  };

  // ═════════════════════════════════════════════════════════════
  // 10. SETUP — Initialize default event handlers
  // ═════════════════════════════════════════════════════════════
  function init() {
    // Listen for tier changes
    DESKTOP.on('tier-changed', function(data) {
      console.log('[DESKTOP] Performance tier changed to:', data.tier);
      // Auto-adjust features based on new tier
      DESKTOP.setFeature('scroll-audio', data.tier >= 3);
      DESKTOP.setFeature('particle-effects', data.tier >= 3);
      DESKTOP.setFeature('blur-effects', data.tier >= 2);
    });

    // Listen for memory pressure
    DESKTOP.on('memory-warning', function(data) {
      console.warn('[DESKTOP] Memory pressure:', data.percentUsed + '%');
      // Could trigger cleanup or disable features
      DESKTOP.emit('optimize-memory', { force: true });
    });

    // Listen for low scroll FPS
    DESKTOP.on('scroll-fps-low', function(data) {
      console.warn('[DESKTOP] Scroll FPS dropped to:', data.fps);
      DESKTOP.emit('throttle-animations', { force: true });
    });

    // Listen for heavy rendering
    DESKTOP.on('heavy-render', function(data) {
      console.log('[DESKTOP] Heavy rendering detected, pausing animations');
      DESKTOP.emit('pause-animations', { duration: 200 });
    });

    // Cleanup on page transition
    w.addEventListener('pagehide', function() {
      console.log('[DESKTOP] Page transition detected, cleaning up');
      DESKTOP.emit('cleanup');
    });
  }

  init();

  // ═════════════════════════════════════════════════════════════
  // Log initialization
  // ═════════════════════════════════════════════════════════════
  console.log('[DESKTOP] Orchestrator initialized');

})();
