# 🧠 Desktop Orchestrator API - Quick Reference
**Fast Lookup for Desktop Script Coordination**

---

## Module API

| Method | Usage | Returns |
|--------|-------|---------|
| `register(name, api)` | Register your module | `boolean` |
| `requireModule(name)` | Get another module's API | `object` or `null` |
| `listModules()` | List all loaded modules | `array` of names |
| `whenReady(name, callback)` | Wait for module to load | `void` |
| `whenAllReady(callback)` | Wait for all core modules | `void` |

### Example

```javascript
// Register your module
window.__BM_DESKTOP__.register('my-module', {
  getData: function() { return 'data'; }
});

// Use another module
var memoryAPI = window.__BM_DESKTOP__.requireModule('memory-optimizer');
var stats = memoryAPI.getMemoryStats();
```

---

## Event Bus API

| Method | Usage | Example |
|--------|-------|---------|
| `on(event, handler)` | Listen for event | `window.__BM_DESKTOP__.on('tier-changed', fn)` |
| `off(event, handler)` | Stop listening | `window.__BM_DESKTOP__.off('tier-changed', fn)` |
| `emit(event, data)` | Trigger event | `window.__BM_DESKTOP__.emit('memory-warning', {})` |

### Example

```javascript
// Listen
var unsubscribe = window.__BM_DESKTOP__.on('memory-warning', function(data) {
  console.log('Memory:', data.percentUsed);
});

// Unsubscribe
unsubscribe();

// Emit
window.__BM_DESKTOP__.emit('memory-warning', { percentUsed: 85 });
```

---

## Feature Flags API

| Method | Usage | Returns |
|--------|-------|---------|
| `setFeature(name, enabled)` | Enable/disable feature | `void` |
| `getFeature(name)` | Check if feature enabled | `boolean` |
| `printFeatures()` | Show all features | `void` (logs) |

### Features

| Feature | Default | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|---------|--------|--------|--------|--------|
| `scroll-audio` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `particle-effects` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `blur-effects` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `animations` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lazy-loading` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `memory-cleanup` | ✅ | ✅ | ✅ | ✅ | ✅ |

### Example

```javascript
// Check if feature enabled
if (window.__BM_DESKTOP__.getFeature('scroll-audio')) {
  playAudio();
}

// Override feature
window.__BM_DESKTOP__.setFeature('blur-effects', true);
```

---

## State Management API

| Method | Usage | Returns |
|--------|-------|---------|
| `setState(key, value)` | Set shared state | `void` |
| `getState(key)` | Get state value | `any` |
| `printState()` | Show all state | `void` (logs) |

### Example

```javascript
// Set state
window.__BM_DESKTOP__.setState('network-speed', 'slow');

// Get state
var speed = window.__BM_DESKTOP__.getState('network-speed');

// Listen for state changes
window.__BM_DESKTOP__.on('state-changed:network-speed', function(data) {
  console.log('Was:', data.old, 'Now:', data.new);
});
```

---

## Metrics API

| Method | Usage | Returns |
|--------|-------|---------|
| `recordMetric(name, value)` | Record a metric | `void` |
| `getMetrics(name)` | Get metric values | `array` or `object` |
| `printMetrics()` | Show metrics table | `void` (logs) |

### Example

```javascript
// Record metrics
window.__BM_DESKTOP__.recordMetric('scroll-fps', 58);
window.__BM_DESKTOP__.recordMetric('memory-percent', 45);

// Get specific metric
var fpsReadings = window.__BM_DESKTOP__.getMetrics('scroll-fps');
// Returns: [{ value: 58, timestamp: 1234567 }, ...]

// Get all metrics
var all = window.__BM_DESKTOP__.getMetrics();
```

---

## Debugging API

| Method | Usage | Output |
|--------|-------|--------|
| `debug()` | Full debug info | Detailed log |
| `printHealth()` | Health check | Formatted table |
| `health()` | Get health data | Object |

### Example

```javascript
// Full debug info
window.__BM_DESKTOP__.debug();

// Health check
window.__BM_DESKTOP__.printHealth();

// Get health data programmatically
var health = window.__BM_DESKTOP__.health();
if (!health.ready) alert('Modules still loading');
```

---

## Core Events

| Event | Fired By | Data |
|-------|----------|------|
| `module-loaded` | Orchestrator | `{ name, api }` |
| `tier-changed` | Performance Tuning | `{ tier: 1-4 }` |
| `memory-warning` | Memory Optimizer | `{ percentUsed, ... }` |
| `scroll-fps-low` | Scroll Smoothness | `{ fps }` |
| `heavy-render` | Fast Rendering | `{ ... }` |
| `network-speed-changed` | Network Optimizer | `{ speed: 'fast'\|'slow' }` |
| `state-changed:*` | Orchestrator | `{ old, new }` |
| `cleanup` | Orchestrator | (on page hide) |

### Listening Example

```javascript
// Memory pressure
window.__BM_DESKTOP__.on('memory-warning', function(data) {
  console.warn('Memory:', data.percentUsed + '%');
});

// Scroll performance drops
window.__BM_DESKTOP__.on('scroll-fps-low', function(data) {
  console.warn('FPS:', data.fps);
});

// Heavy rendering
window.__BM_DESKTOP__.on('heavy-render', function(data) {
  console.log('Pausing animations...');
});
```

---

## Core Commands (Emit)

| Command | Data | Response |
|---------|------|----------|
| `optimize-memory` | `{ force: boolean }` | Memory cleanup triggered |
| `throttle-animations` | `{ force: boolean }` | Animations disabled |
| `pause-animations` | `{ duration: ms }` | Animations paused |
| `cleanup` | `{}` | All modules cleanup |

### Emitting Example

```javascript
// Force memory cleanup
window.__BM_DESKTOP__.emit('optimize-memory', { force: true });

// Throttle animations
window.__BM_DESKTOP__.emit('throttle-animations', { force: true });

// Pause for duration
window.__BM_DESKTOP__.emit('pause-animations', { duration: 200 });

// Trigger cleanup
window.__BM_DESKTOP__.emit('cleanup');
```

---

## Module APIs (Exported)

### Performance Tuning
```javascript
w.__BM_DESKTOP__.requireModule('performance-tuning') → {
  tier: number,
  perf: object,
  frameRate: number,
  getTier(),
  getFrameRate(),
  queueIdleTask()
}
```

### Image Optimizer
```javascript
w.__BM_IMAGE_OPTIMIZER__ → {
  enableLazyLoading(),
  preloadCriticalImages(),
  optimizeResponsive(),
  inlineSmallImages(),
  getWebPSupport(),
  optimizeForLowBandwidth(),
  getStats()
}
```

### Network Optimizer
```javascript
w.__BM_ASSET_OPTIMIZER__ → {
  getNetworkSpeed(),
  cacheResource(),
  getCachedResource(),
  getResourceStats(),
  preloadResources(),
  optimizeForNetwork()
}
```

### Interaction Optimizer
```javascript
w.__BM_INTERACTION_OPTIMIZER__ → {
  debounce(),
  throttle(),
  delegate(),
  getLastInteractionTime(),
  isUserInteracting(),
  getInteractionStats()
}
```

### Memory Optimizer
```javascript
w.__BM_MEMORY_OPTIMIZER__ → {
  getMemoryStats(),
  getMemoryHistory(),
  cleanup(),
  setCache(),
  getCache(),
  createObjectPool(),
  createWeakCache(),
  detectLeaks(),
  getActiveListenerCount(),
  isMemoryPressured()
}
```

### Scroll Smoothness
```javascript
w.__BM_SCROLL_SMOOTH__ → {
  getFPS(),
  isThrottled(),
  queueWork(),
  getStats()
}
```

### Rendering Optimizer
```javascript
w.__BM_BATCH_READ__(fn) // Queue DOM reads
w.__BM_BATCH_WRITE__(fn) // Queue DOM writes
w.__BM_DEFER_PAINT__(fn, priority) // Defer rendering
w.__BM_RENDER_METRICS__.getMetrics() // Get metrics
```

---

## Single-Line Cheat Sheet

```javascript
// Check ready
console.log(window.__BM_DESKTOP__.ready);

// List modules
console.log(window.__BM_DESKTOP__.listModules());

// Register module
window.__BM_DESKTOP__.register('module', { api: function() {} });

// Listen to event
window.__BM_DESKTOP__.on('tier-changed', fn);

// Emit event
window.__BM_DESKTOP__.emit('event-name', { data });

// Check feature
window.__BM_DESKTOP__.getFeature('scroll-audio');

// Set state
window.__BM_DESKTOP__.setState('key', value);

// Get state
window.__BM_DESKTOP__.getState('key');

// Record metric
window.__BM_DESKTOP__.recordMetric('name', value);

// Get metrics
window.__BM_DESKTOP__.getMetrics('name');

// Debug
window.__BM_DESKTOP__.debug();
window.__BM_DESKTOP__.printHealth();
window.__BM_DESKTOP__.printMetrics();
window.__BM_DESKTOP__.printFeatures();
window.__BM_DESKTOP__.printState();
```

---

## Common Patterns

### Pattern 1: Respond to Tier Changes
```javascript
window.__BM_DESKTOP__.on('tier-changed', function(data) {
  if (data.tier <= 1) {
    // Low-end: disable heavy features
    window.__BM_DESKTOP__.setFeature('scroll-audio', false);
  }
});
```

### Pattern 2: Memory Awareness
```javascript
window.__BM_DESKTOP__.on('memory-warning', function(data) {
  if (data.percentUsed > 80) {
    // Clear cache, pause non-critical work
    window.__BM_DESKTOP__.emit('optimize-memory', { force: true });
  }
});
```

### Pattern 3: Module Coordination
```javascript
// Module A emits event
window.__BM_DESKTOP__.emit('data-updated', { type: 'images' });

// Module B listens
window.__BM_DESKTOP__.on('data-updated', function(data) {
  if (data.type === 'images') updateUI();
});
```

### Pattern 4: Feature Gating
```javascript
function maybePlayAudio() {
  if (window.__BM_DESKTOP__.getFeature('scroll-audio')) {
    playAudio();
  }
}
```

---

## Console Testing

```javascript
// Copy-paste these in browser console to test

// 1. Check status
window.__BM_DESKTOP__.printHealth();

// 2. Check module list
console.log('Modules:', window.__BM_DESKTOP__.listModules());

// 3. Check memory
console.log('Memory:', window.__BM_MEMORY_OPTIMIZER__.getMemoryStats());

// 4. Check scroll FPS
console.log('Scroll FPS:', window.__BM_SCROLL_SMOOTH__.getFPS());

// 5. Check network
console.log('Network:', window.__BM_ASSET_OPTIMIZER__.getNetworkSpeed());

// 6. Emit test event
window.__BM_DESKTOP__.emit('test', { msg: 'works' });
window.__BM_DESKTOP__.on('test', (d) => console.log('Event:', d));
```

---

## Ready to Use

All scripts coordinate automatically through the orchestrator. No additional configuration needed!

