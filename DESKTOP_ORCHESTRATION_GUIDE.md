# 🧠 Desktop Orchestration System - Complete Guide
**BullMoney Desktop Scripts Unified Coordination**

**Date:** February 17, 2026  
**Status:** ✅ Full Integration Complete  
**Architecture:** Central Event Bus + Module Registration

---

## 📋 Overview

All 7 desktop optimization scripts now work together as a unified system through the **Desktop Orchestrator**. Think of it like BMBRAIN but specifically for desktop performance.

**Before:** Each script worked independently
**After:** Scripts coordinate, prevent conflicts, share state, and communicate via event bus

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│         DESKTOP ORCHESTRATOR (hub/brain)            │
│  • Module Registration                              │
│  • Event Bus (inter-script communication)           │
│  • Feature Flags & State                            │
│  • Performance Metrics Collection                   │
│  • Conflict Prevention                              │
└─────────────────────────────────────────────────────┘
         ▲           ▲           ▲           ▲
         │           │           │           │
    ┌────┴──┐  ┌──────┴──┐  ┌───┴────┐  ┌──┤──────┐
    │        │  │         │  │        │  │  │      │
┌───┴──┐ ┌──┴──┴──┐ ┌───┴────┴──┐ ┌──┴──┴──┴──┐ ┌──┴──────────┐
│Image │ │Network │ │Interaction│ │  Memory  │ │   Scroll   │
│Optim │ │ Optim  │ │  Optim    │ │  Optim   │ │ Smoothness │
└──────┘ └────────┘ └───────────┘ └──────────┘ └────────────┘
│
└──────────────────────────────┐
                              │
                        ┌─────┴──────┐
                        │ Performance│
                        │   Tuning   │
                        │ (Tier Det) │
                        └────────────┘
```

---

## 📦 Load Order (Critical)

The orchestrator is loaded **right after performance-tuning** because other modules depend on it:

```
1. desktop-performance-tuning.js      ← Tier detection must happen first
2. desktop-orchestrator.js            ← Hub/coordinator (must be 2nd)
3. desktop-image-optimizer.js         ← Image loading
4. desktop-network-optimizer.js       ← Network optimization
5. desktop-interaction-optimizer.js   ← Event handling
6. desktop-memory-optimizer.js        ← Memory cleanup
7. desktop-scroll-smoothness.js       ← Scroll smoothness
8. desktop-fast-rendering.js          ← Rendering optimization
```

Each script waits for the orchestrator to be ready, then registers itself.

---

## 🔌 How Scripts Register

### Pattern: Module Registration

Every desktop optimization script registers itself like this:

```javascript
// At the end of each script:
if (w.__BM_DESKTOP__) {
  w.__BM_DESKTOP__.register('module-name', {
    // Export public API
    someMethod: function() { /* ... */ },
    getStats: function() { /* ... */ }
  });
}
```

### Example: Image Optimizer Registration

```javascript
// desktop-image-optimizer.js
if (w.__BM_DESKTOP__) {
  w.__BM_DESKTOP__.register('image-optimizer', w.__BM_IMAGE_OPTIMIZER__);
  
  // Listen for orchestrator events
  w.__BM_DESKTOP__.on('cleanup', function() {
    if (state.observer) {
      state.observer.disconnect();
    }
    state.loadedImages.clear();
  });
}
```

---

## 🚀 Central Orchestrator API

### 1. **Module Management**

```javascript
// Register a module
window.__BM_DESKTOP__.register('my-module', {
  getData: function() { return 'data'; }
});

// Check if module loaded
window.__BM_DESKTOP__.moduleLoaded('image-optimizer'); // true

// Get module API
var imageAPI = window.__BM_DESKTOP__.requireModule('image-optimizer');
imageAPI.preloadCriticalImages();

// Wait for specific module
window.__BM_DESKTOP__.whenReady('memory-optimizer', function(module) {
  console.log('Memory optimizer loaded!');
});

// Wait for all core modules
window.__BM_DESKTOP__.whenAllReady(function(DESKTOP) {
  console.log('✓ All modules ready');
  console.log('Modules loaded:', DESKTOP.listModules());
});
```

### 2. **Event Bus (Inter-Script Communication)**

```javascript
// Listen for event
window.__BM_DESKTOP__.on('memory-warning', function(data) {
  console.log('Memory pressure:', data.percentUsed);
  // Other modules listen to same event
});

// Emit event (triggers all listeners)
window.__BM_DESKTOP__.emit('memory-warning', {
  percentUsed: 85
});

// Unsubscribe from event
window.__BM_DESKTOP__.off('memory-warning', handlerFunction);

// Event listener returns unsubscribe function
var unsubscribe = window.__BM_DESKTOP__.on('tier-changed', handler);
unsubscribe(); // Stop listening
```

### 3. **Feature Flags**

```javascript
// Set feature flag
window.__BM_DESKTOP__.setFeature('scroll-audio', true);

// Get feature flag
var audioEnabled = window.__BM_DESKTOP__.getFeature('scroll-audio');
// Returns false on Tier 1 devices automatically

// Pre-defined features
window.__BM_DESKTOP__.setFeature('scroll-audio', true);         // Tier 3+
window.__BM_DESKTOP__.setFeature('particle-effects', true);    // Tier 3+
window.__BM_DESKTOP__.setFeature('blur-effects', true);        // Tier 2+
window.__BM_DESKTOP__.setFeature('animations', true);          // Tier 1+ (always on)
window.__BM_DESKTOP__.setFeature('lazy-loading', true);       // Always on
window.__BM_DESKTOP__.setFeature('memory-cleanup', true);      // Always on
```

### 4. **State Management**

```javascript
// Set state (shared across all modules)
window.__BM_DESKTOP__.setState('network-speed', 'slow');

// Get state
var speed = window.__BM_DESKTOP__.getState('network-speed');

// State changes emit events
window.__BM_DESKTOP__.on('state-changed:network-speed', function(data) {
  console.log('Network was:', data.old);
  console.log('Network now:', data.new);
});

// All state
window.__BM_DESKTOP__.printState();
// Outputs: { 'network-speed': 'slow', ... }
```

### 5. **Metrics Collection**

```javascript
// Record metric (auto-aggregated)
window.__BM_DESKTOP__.recordMetric('scroll-fps', 58);
window.__BM_DESKTOP__.recordMetric('memory-percent', 45);
window.__BM_DESKTOP__.recordMetric('event:tier-changed', 1);

// Get all metrics
var all = window.__BM_DESKTOP__.getMetrics();

// Get specific metric
var fpsReadings = window.__BM_DESKTOP__.getMetrics('scroll-fps');
// Returns: [{ value: 58, timestamp: ... }, ...]

// Print formatted metrics
window.__BM_DESKTOP__.printMetrics();
// Outputs:
// ┌─────────────────┬─────┬─────┬──────┐
// │ metric          │ cnt │ avg │ last │
// ├─────────────────┼─────┼─────┼──────┤
// │ scroll-fps      │ 5   │57.8 │ 58   │
// │ memory-percent  │ 5   │52.4 │ 45   │
// └─────────────────┴─────┴─────┴──────┘
```

### 6. **Debugging & Monitoring**

```javascript
// Full debug info
window.__BM_DESKTOP__.debug();
// Shows: version, ready status, modules, state, features, pending

// Health check
var health = window.__BM_DESKTOP__.health();
// Returns: {
//   ready: true,
//   modules: 7,
//   events: 12,
//   metrics: 8,
//   pending: 0,
//   tier: 3,
//   memory: { percent: '45.2', pressured: false }
// }

// Print health check
window.__BM_DESKTOP__.printHealth();
// Outputs formatted table

// List all loaded modules
window.__BM_DESKTOP__.listModules();
// Returns: ['performance-tuning', 'image-optimizer', ...]
```

---

## 🌟 Built-In Events

### Performance Events

```javascript
// Fired when tier changes
window.__BM_DESKTOP__.on('tier-changed', function(data) {
  console.log('New tier:', data.tier); // 1-4
});

// Fired when memory pressure detected
window.__BM_DESKTOP__.on('memory-warning', function(data) {
  console.log('Memory:', data.percentUsed + '%');
});

// Fired when scroll FPS drops
window.__BM_DESKTOP__.on('scroll-fps-low', function(data) {
  console.log('Scroll FPS:', data.fps);
});

// Fired during heavy rendering
window.__BM_DESKTOP__.on('heavy-render', function(data) {
  console.log('Heavy rendering detected');
});

// Fired when network speed changes
window.__BM_DESKTOP__.on('network-speed-changed', function(data) {
  console.log('Network speed:', data.speed);
});

// Fired when module loads
window.__BM_DESKTOP__.on('module-loaded', function(data) {
  console.log('Module loaded:', data.name);
});
```

### Command Events

```javascript
// Listen for orchestrator commands and respond
window.__BM_DESKTOP__.on('optimize-memory', function(data) {
  // Memory optimizer listens for this
  if (data.force) {
    performAggresiveCleanup();
  }
});

window.__BM_DESKTOP__.on('throttle-animations', function(data) {
  // Scroll smoothness listens for this
  disableExpensiveAnimations();
});

window.__BM_DESKTOP__.on('pause-animations', function(data) {
  // Rendering optimization listens for this
  const duration = data.duration; // ms
  pauseForDuration(duration);
});

window.__BM_DESKTOP__.on('cleanup', function() {
  // All modules listen for this on page transition
  cleanupResources();
});
```

---

## 🔗 How Scripts Communicate

### Pattern 1: Event-Driven Updates

```javascript
// Memory optimizer detects pressure
window.__BM_DESKTOP__.emit('memory-warning', { percentUsed: 85 });

// Orchestrator catches this and triggers action
window.__BM_DESKTOP__.on('memory-warning', function(data) {
  if (data.percentUsed > 80) {
    // Tell interaction optimizer to reduce listeners
    window.__BM_DESKTOP__.emit('optimize-memory', { force: true });
    // Tell scroll to disable audio
    window.__BM_DESKTOP__.setFeature('scroll-audio', false);
  }
});

// Scroll optimizer respects feature flag
if (window.__BM_DESKTOP__.getFeature('scroll-audio')) {
  playScrollAudio();
}
```

### Pattern 2: Module Cooperation

```javascript
// Image optimizer needs to know network speed
window.__BM_DESKTOP__.on('network-speed-changed', function(data) {
  if (data.speed === 'slow') {
    // Switch to low-quality images
    window.__BM_IMAGE_OPTIMIZER__.optimizeForLowBandwidth();
  }
});

// Network optimizer emits this
window.__BM_ASSET_OPTIMIZER__.on('network-speed-change', function(e) {
  window.__BM_DESKTOP__.emit('network-speed-changed', { speed: e.detail.speed });
});
```

### Pattern 3: Metrics Aggregation

```javascript
// Each module records its own metrics
window.__BM_DESKTOP__.recordMetric('scroll-fps', 58);
window.__BM_DESKTOP__.recordMetric('memory-percent', 45);
window.__BM_DESKTOP__.recordMetric('interaction:activeListeners', 42);

// Central dashboard accesses all metrics
var metrics = window.__BM_DESKTOP__.getMetrics();
var scrollFPS = metrics['scroll-fps']; // [{ value: 58, timestamp: ... }, ...]
```

---

## 💡 Real-World Usage Examples

### Example 1: Respond to Performance Changes

```javascript
// Listen for performance degradation
window.__BM_DESKTOP__.on('scroll-fps-low', function(data) {
  console.warn('Scroll FPS:', data.fps);
  
  // Coordinate across modules
  window.__BM_DESKTOP__.emit('slow-rendering-detected', {
    fps: data.fps
  });
});

// Image optimizer listens
window.__BM_DESKTOP__.on('slow-rendering-detected', function(data) {
  // Pause lazy loading
  window.__BM_IMAGE_OPTIMIZER__.pauseLazyLoading();
});

// Network optimizer listens
window.__BM_DESKTOP__.on('slow-rendering-detected', function(data) {
  // Stop prefetching
  window.__BM_ASSET_OPTIMIZER__.stopPrefetch();
});

// Rendering optimizer listens
window.__BM_DESKTOP__.on('slow-rendering-detected', function(data) {
  // Simplify CSS animations
  window.__BM_RENDER_METRICS__.simplifyAnimations();
});
```

### Example 2: Tier-Based Feature Control

```javascript
// On tier detection
window.__BM_DESKTOP__.emit('tier-changed', { tier: 2 });

// Orchestrator adjusts all modules
window.__BM_DESKTOP__.on('tier-changed', function(data) {
  if (data.tier <= 1) {
    // Low-end device - disable heavy features
    window.__BM_DESKTOP__.setFeature('scroll-audio', false);
    window.__BM_DESKTOP__.setFeature('particle-effects', false);
    window.__BM_DESKTOP__.emit('optimize-memory', { force: true });
  } else if (data.tier === 4) {
    // High-end device - enable everything
    window.__BM_DESKTOP__.setFeature('scroll-audio', true);
    window.__BM_DESKTOP__.setFeature('particle-effects', true);
  }
});

// Each module checks features
if (window.__BM_DESKTOP__.getFeature('scroll-audio')) {
  enableScrollAudio();
}
```

### Example 3: Memory Management Coordination

```javascript
// Memory optimizer emits warning
window.__BM_DESKTOP__.emit('memory-warning', { 
  percentUsed: 85,
  isMemoryPressured: true
});

// Orchestrator triggers cleanup across all modules
window.__BM_DESKTOP__.on('memory-warning', function(data) {
  if (data.percentUsed > 80) {
    // Tell image optimizer to stop lazy loading
    window.__BM_DESKTOP__.emit('memory-pressure', { aggressive: true });
    
    // Tell network optimizer to clear cache
    window.__BM_DESKTOP__.emit('clear-cache', {});
    
    // Tell interaction optimizer to reduce listeners
    window.__BM_DESKTOP__.emit('simplify-interactions', {});
  }
});

// Each module responds
window.__BM_DESKTOP__.on('memory-pressure', function(data) {
  clearOldCaches();
  reduceBufferSizes();
  if (data.aggressive) {
    pauseLazyLoading();
  }
});
```

---

## 🔄 Module Lifecycle

### 1. Script Loads
```javascript
// desktop-image-optimizer.js starts loading
```

### 2. Waits for Orchestrator
```javascript
setTimeout(() => {
  if (!w.__BM_DESKTOP__) return; // Orchestrator not ready yet
  // Continue initialization...
}, 0);
```

### 3. Initializes Itself
```javascript
// Setup listeners, start monitoring, etc
function init() {
  initLazyLoading();
  optimizeResponsiveImages();
  // ...
}
```

### 4. Registers with Orchestrator
```javascript
if (w.__BM_DESKTOP__) {
  w.__BM_DESKTOP__.register('image-optimizer', w.__BM_IMAGE_OPTIMIZER__);
}
```

### 5. Listens for Events
```javascript
// Now responds to orchestrator commands
w.__BM_DESKTOP__.on('cleanup', function() {
  // Page transition - cleanup
});

w.__BM_DESKTOP__.on('memory-pressure', function() {
  // Memory warning - adapt
});
```

### 6. Fires Own Events
```javascript
// Report back to orchestrator
window.__BM_DESKTOP__.emit('images-loaded', {
  count: state.loadedImages.size,
  bytes: state.totalBytes
});
```

---

## 📊 Monitoring Dashboard

Create a real-time monitoring dashboard:

```javascript
function createDesktopDashboard() {
  return setInterval(() => {
    const desktop = window.__BM_DESKTOP__;
    const health = desktop.health();
    
    console.clear();
    console.log('═══════════════════════════════════════');
    console.log('  DESKTOP ORCHESTRATOR STATUS');
    console.log('═══════════════════════════════════════');
    console.log('Status:', health.ready ? '✅ Ready' : '⏳ Loading');
    console.log('Modules:', health.modules + '/7');
    console.log('Performance Tier:', health.tier);
    console.log('Memory:', health.memory?.percent + '%' + 
                (health.memory?.pressured ? ' ⚠️' : ' ✅'));
    console.log('───────────────────────────────────────');
    console.log('Modules:', desktop.listModules());
    console.log('═══════════════════════════════════════');
  }, 3000);
}

// Start monitoring
createDesktopDashboard();
```

---

## 🆚 Orchestrator vs BMBRAIN

**Similarities:**
- Module registration system
- Event bus for communication
- Dependency management
- Unified namespace

**Differences:**
- BMBRAIN: Global cross-app coordination
- Desktop Orch: Desktop-specific optimization
- BMBRAIN: Features detection, device info
- Desktop Orch: Performance tuning, memory, rendering

They **work together** - BMBRAIN provides context, Desktop Orchestrator coordinates optimization.

---

## 🚀 Best Practices

### ✅ DO

- Always check if `window.__BM_DESKTOP__` exists before using it
- Use event bus for inter-module communication
- Record metrics for monitoring
- Listen for cleanup events on page transitions
- Use feature flags for tier-based behavior

### ❌ DON'T

- Access other modules' internal state directly
- Duplicate event listening (one handler per module)
- Ignore cleanup events (causes memory leaks)
- Assume modules load in specific order
- Block other modules during expensive operations

### 🎯 RECOMMENDED

```javascript
// Good: Use orchestrator for coordination
window.__BM_DESKTOP__.on('network-speed-changed', function(data) {
  updateBehavior(data.speed);
});

// Bad: Direct module access
window.__BM_ASSET_OPTIMIZER__.getNetworkSpeed(); // Bypasses orchestrator
```

---

## 📞 Debugging Commands

```javascript
// Debug info
window.__BM_DESKTOP__.debug();

// Health check
window.__BM_DESKTOP__.printHealth();

// Metrics summary
window.__BM_DESKTOP__.printMetrics();

// Feature status
window.__BM_DESKTOP__.printFeatures();

// State dump
window.__BM_DESKTOP__.printState();

// List modules
console.log(window.__BM_DESKTOP__.listModules());

// Module API access
const memoryAPI = window.__BM_DESKTOP__.requireModule('memory-optimizer');
console.log(memoryAPI.getMemoryStats());
```

---

## ✅ Verification

To verify everything is working:

```javascript
// Open browser console and run:

// 1. Check orchestrator loaded
console.log('Orchestrator ready:', window.__BM_DESKTOP__.ready);

// 2. Check all modules registered
console.log('Modules:', window.__BM_DESKTOP__.listModules());
// Should show: ['performance-tuning', 'image-optimizer', ...]

// 3. Check health
window.__BM_DESKTOP__.printHealth();

// 4. Test event system
window.__BM_DESKTOP__.emit('test-event', { message: 'Hello' });
window.__BM_DESKTOP__.on('test-event', function(data) {
  console.log('Event received:', data.message);
});
```

---

## 🎉 Conclusion

All desktop optimization scripts now work together seamlessly through the **Desktop Orchestrator**, preventing conflicts, sharing state, communicating efficiently, and coordinating performance optimizations across the entire desktop experience.

Think of it as the "brain" coordinating the "body" of desktop performance!

