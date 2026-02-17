// ==========================================
// DESKTOP MEMORY OPTIMIZER
// Memory management & GC optimization
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
    enableMemoryMonitoring: true,
    enableGCOptimization: true,
    memoryWarningThreshold: 75, // 75% of available
    aggressiveCleanup: false,
    cleanupInterval: 30000, // Every 30 seconds
    cacheMaxSize: 50 * 1024 * 1024, // 50MB
    idleTimerInterval: 60000 // 1 minute for idle GC
  };

  var state = {
    memorySnapshots: [],
    gcEvents: [],
    caches: new Map(),
    timers: new Map(),
    observers: new Map(),
    lastCleanupTime: Date.now(),
    isMemoryPressured: false,
    memoryLimit: 0
  };

  // ========================================
  // Estimate Available Memory
  // ========================================
  function getAvailableMemory() {
    if (navigator.deviceMemory) {
      return navigator.deviceMemory * 1024; // MB
    }

    // Fallback estimate based on device type
    try {
      var cores = navigator.hardwareConcurrency || 1;
      return cores > 4 ? 8192 : cores > 2 ? 4096 : 2048; // MB
    } catch (e) {
      return 4096; // Default 4GB
    }
  }

  state.memoryLimit = getAvailableMemory();

  // ========================================
  // Monitor Memory Usage
  // ========================================
  function checkMemoryUsage() {
    if (!performance.memory) {
      return null; // Memory API not available
    }

    var memory = {
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      percentUsed: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    };

    state.memorySnapshots.push(memory);

    // Keep only last 100 snapshots (5 minutes at 3sec intervals)
    if (state.memorySnapshots.length > 100) {
      state.memorySnapshots.shift();
    }

    // Warn if memory pressure is high
    if (memory.percentUsed > config.memoryWarningThreshold) {
      state.isMemoryPressured = true;
      triggerMemoryWarning(memory);
    } else if (memory.percentUsed < 50) {
      state.isMemoryPressured = false;
    }

    return memory;
  }

  function triggerMemoryWarning(memory) {
    console.warn('[BM Memory] High memory pressure:', Math.round(memory.percentUsed) + '%');
    
    w.dispatchEvent(new CustomEvent('bm-memory-warning', {
      detail: memory
    }));

    // Auto-cleanup on memory pressure
    performMemoryCleanup();
  }

  // ========================================
  // Aggressive Memory Cleanup
  // ========================================
  function performMemoryCleanup() {
    var now = Date.now();

    // Clear old memory snapshots
    state.memorySnapshots = state.memorySnapshots.filter(function(snap) {
      return now - snap.timestamp < 60000; // Keep last minute
    });

    // Clear expired caches
    state.caches.forEach(function(cache, key) {
      if (cache.expiry && cache.expiry < now) {
        state.caches.delete(key);
        console.log('[BM Memory] Expired cache cleared:', key);
      }
    });

    // Clear old timers
    state.timers.forEach(function(timerData, key) {
      if (timerData.expiry && timerData.expiry < now) {
        clearTimeout(timerData.id);
        clearInterval(timerData.id);
        state.timers.delete(key);
      }
    });

    // Remove detached DOM nodes
    cleanupDetachedDOM();

    // Clear image caches
    var images = doc.querySelectorAll('img');
    var removedCount = 0;
    images.forEach(function(img) {
      if (!doc.body.contains(img)) {
        img.src = '';
        img.srcset = '';
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log('[BM Memory] Cleaned', removedCount, 'detached images');
    }

    state.lastCleanupTime = now;
  }

  // ========================================
  // Cleanup Detached DOM Nodes
  // ========================================
  function cleanupDetachedDOM() {
    try {
      // Find and cleanup orphaned DOM nodes
      var walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT);
      var detachedCount = 0;

      var node;
      while ((node = walker.nextNode())) {
        if (!doc.body.contains(node)) {
          // Node is detached
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
          detachedCount++;

          if (detachedCount > 100) break; // Limit iterations
        }
      }

      if (detachedCount > 0) {
        console.log('[BM Memory] Cleanup detached DOM nodes:', detachedCount);
      }
    } catch (e) {
      // Error during cleanup, continue
    }
  }

  // ========================================
  // Defer Large Operations
  // ========================================
  function scheduleIdleGarbageCollection() {
    if (typeof requestIdleCallback === 'undefined') {
      // Fallback to setTimeout
      setTimeout(function() {
        if (state.isMemoryPressured) {
          performMemoryCleanup();
        }
      }, config.idleTimerInterval);
      return;
    }

    requestIdleCallback(function(deadline) {
      if (deadline.timeRemaining() > 10) {
        if (state.isMemoryPressured) {
          performMemoryCleanup();
        }
      }
    }, { timeout: config.idleTimerInterval });
  }

  // ========================================
  // Object Pool for Reusable Objects
  // ========================================
  var ObjectPool = function(factory) {
    this.factory = factory;
    this.available = [];
    this.inUse = new Set();
  };

  ObjectPool.prototype.acquire = function() {
    var obj = this.available.length > 0 ? this.available.pop() : this.factory();
    this.inUse.add(obj);
    return obj;
  };

  ObjectPool.prototype.release = function(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.available.push(obj);
    }
  };

  ObjectPool.prototype.clear = function() {
    this.available = [];
    this.inUse.clear();
  };

  ObjectPool.prototype.getStats = function() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  };

  // ========================================
  // WeakMap-based Cache (Auto-cleanup)
  // ========================================
  function createWeakCache() {
    return new WeakMap();
  }

  // ========================================
  // Track Event Listeners (Leak Detection)
  // ========================================
  var OriginalAddEventListener = EventTarget.prototype.addEventListener;
  var OriginalRemoveEventListener = EventTarget.prototype.removeEventListener;

  var activeListeners = new Map();

  EventTarget.prototype.addEventListener = function(type, listener, options) {
    var key = type + ':' + listener.toString();
    if (!activeListeners.has(key)) {
      activeListeners.set(key, []);
    }
    activeListeners.get(key).push(this);
    OriginalAddEventListener.call(this, type, listener, options);
  };

  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    var key = type + ':' + listener.toString();
    if (activeListeners.has(key)) {
      var listeners = activeListeners.get(key);
      var index = listeners.indexOf(this);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    OriginalRemoveEventListener.call(this, type, listener, options);
  };

  // ========================================
  // Detect Memory Leaks
  // ========================================
  function detectMemoryLeaks() {
    if (!performance.memory) return null;

    var snapshots = state.memorySnapshots;
    if (snapshots.length < 10) return null; // Need at least 10 samples

    var recentSnapshots = snapshots.slice(-10);
    var trend = 0;

    for (var i = 1; i < recentSnapshots.length; i++) {
      var delta = recentSnapshots[i].usedJSHeapSize - recentSnapshots[i - 1].usedJSHeapSize;
      if (delta > 0) trend += delta;
    }

    var averageGrowth = trend / recentSnapshots.length;

    return {
      suspectedLeak: averageGrowth > 1024 * 1024, // > 1MB/sample
      averageGrowthPerSecond: averageGrowth,
      activeListenerCount: activeListeners.size,
      cachedItemCount: state.caches.size
    };
  }

  // ========================================
  // Export Public API
  // ========================================
  w.__BM_MEMORY_OPTIMIZER__ = {
    getMemoryStats: function() {
      return checkMemoryUsage();
    },
    getMemoryHistory: function() {
      return state.memorySnapshots.slice(-20);
    },
    cleanup: performMemoryCleanup,
    setCache: function(key, value, expiryMs) {
      state.caches.set(key, {
        value: value,
        expiry: Date.now() + (expiryMs || 3600000) // Default 1 hour
      });
    },
    getCache: function(key) {
      var cached = state.caches.get(key);
      if (!cached || (cached.expiry && cached.expiry < Date.now())) {
        state.caches.delete(key);
        return null;
      }
      return cached.value;
    },
    createObjectPool: function(factory) {
      return new ObjectPool(factory);
    },
    createWeakCache: createWeakCache,
    detectLeaks: detectMemoryLeaks,
    getActiveListenerCount: function() {
      return activeListeners.size;
    },
    isMemoryPressured: function() {
      return state.isMemoryPressured;
    }
  };

  // ========================================
  // Initialize Monitoring
  // ========================================
  function init() {
    if (!config.enableMemoryMonitoring) return;

    // Check memory every 3 seconds
    setInterval(function() {
      checkMemoryUsage();
    }, 3000);

    // Scheduled garbage collection
    scheduleIdleGarbageCollection();

    // Cleanup on page hide
    w.addEventListener('pagehide', function() {
      performMemoryCleanup();
    });

    // Listen for memory warnings and auto-cleanup
    w.addEventListener('bm-memory-warning', function() {
      if (config.aggressiveCleanup) {
        performMemoryCleanup();
      }
    });

    console.log('[BM Memory] Memory optimizer initialized');
    console.log('[BM Memory] Device memory:', state.memoryLimit + 'MB');
  }

  init();

  // ========================================
  // ORCHESTRATOR INTEGRATION
  // ========================================
  if (w.__BM_DESKTOP__) {
    w.__BM_DESKTOP__.register('memory-optimizer', w.__BM_MEMORY_OPTIMIZER__);
    
    // Forward memory warnings to orchestrator
    w.addEventListener('bm-memory-warning', function(e) {
      w.__BM_DESKTOP__.emit('memory-warning', e.detail);
    });
    
    // Listen for cleanup triggers
    w.__BM_DESKTOP__.on('optimize-memory', function(data) {
      if (data.force) {
        console.log('[BM Memory] Forced cleanup triggered by orchestrator');
        performMemoryCleanup();
      }
    });
  }

})();
