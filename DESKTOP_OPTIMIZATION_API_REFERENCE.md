# 🔌 Desktop Optimization APIs - Quick Reference Guide

## Available Global Objects

### Memory Management
```javascript
// ✅ Memory monitoring and optimization
window.__BM_MEMORY_OPTIMIZER__

Methods:
- getMemoryStats() → Returns current heap usage
- getMemoryHistory() → Returns last 20 memory snapshots
- cleanup() → Manually trigger cleanup
- setCache(key, value, expiryMs) → Set cached value with expiry
- getCache(key) → Get cached value (auto-deleted if expired)
- createObjectPool(factory) → Create reusable object pool
- createWeakCache() → Create auto-cleanup weak map cache
- detectLeaks() → Analyze for memory leak patterns
- getActiveListenerCount() → Count event listeners
- isMemoryPressured() → Check if memory >75% used
```

### Interaction Handling
```javascript
// ✅ Event handling, debounce, throttle
window.__BM_INTERACTION_OPTIMIZER__

Methods:
- debounce(fn, delay, context) → Debounced function
- throttle(fn, delay, context) → Throttled function
- delegate(container, eventType, selector, handler) → Event delegation
- getLastInteractionTime() → When user last interacted
- isUserInteracting() → Is user actively interacting now?
- getInteractionStats() → Count of listeners, delegators, etc
```

### Network & Assets
```javascript
// ✅ Network optimization, resource hints, caching
window.__BM_ASSET_OPTIMIZER__

Methods:
- getNetworkSpeed() → 'fast' | 'slow' | 'very-slow' | 'unknown'
- cacheResource(url, content, metadata) → Cache a resource
- getCachedResource(url) → Get cached resource
- getResourceStats() → Timing of loaded resources
- preloadResources(urls) → Preload array of URLs
- optimizeForNetwork() → Listen for network changes
```

### Image Optimization
```javascript
// ✅ Image loading, WebP detection, lazy load
window.__BM_IMAGE_OPTIMIZER__

Methods:
- enableLazyLoading() → Start lazy loading images
- preloadCriticalImages() → Preload hero images
- optimizeResponsive() → Fix responsive image attributes
- inlineSmallImages() → Convert icons to data URLs
- getWebPSupport() → true | false (WebP capable?)
- optimizeForLowBandwidth() → Compress on slow networks
- getStats() → WebP support, loaded count, etc
```

### Scroll Performance
```javascript
// ✅ Real-time scroll FPS, smoothness optimization
window.__BM_SCROLL_SMOOTH__

Methods:
- getFPS() → Current scroll FPS (25th percentile)
- isThrottled() → Are animations throttled?
- queueWork(fn) → Queue work between scroll frames
- getStats() → Scroll metrics

Events:
- 'bm-scroll-fps-low' → FPS dropped below 50
```

### Rendering Performance
```javascript
// ✅ Rendering metrics, batch operations, defer paint
window.__BM_BATCH_READ__(fn) → Queue DOM read
window.__BM_BATCH_WRITE__(fn) → Queue DOM write
window.__BM_DEFER_PAINT__(fn, priority) → Defer rendering
  - priority: 'high' (scheduler.postTask), 'background' (requestIdleCallback)

window.__BM_RENDER_METRICS__

Methods:
- getMetrics() → { isHeavy, readQueue, writeQueue, ... }

Events:
- 'bm-heavy-render' → Long task detected (>50ms)
```

### Device Performance Tier
```javascript
// ✅ Device capability detection (from tuning script)
window.__BM_PERFORMANCE_TIER__
// 1 = Low-end (mobile, old laptop)
// 2 = Mid-range (modern laptop, budget mobile)
// 3 = High-end (gaming laptop, iPad Pro)
// 4 = Very high-end (powerful desktop)

// Features disabled per tier:
// Tier 1: Audio off, animations minimal, aggressivecache cleanup
// Tier 2: Audio on, reduced animations
// Tier 3: All features, some throttling
// Tier 4: All features, no throttling
```

---

## 📚 Common Usage Patterns

### Pattern 1: Debounce Search Input
```javascript
// In React component:
const [searchQuery, setSearchQuery] = useState('');

const debouncedSearch = window.__BM_INTERACTION_OPTIMIZER__.debounce(
  (query) => {
    // This runs max once per 150ms
    fetch(`/api/search?q=${query}`)
      .then(r => r.json())
      .then(results => setResults(results));
  },
  150
);

function handleSearchChange(e) {
  const query = e.target.value;
  setSearchQuery(query);
  debouncedSearch(query);
}

return <input onChange={handleSearchChange} />;
```

### Pattern 2: Batch DOM Updates
```javascript
// Efficient DOM manipulation
function updateMultipleElements(data) {
  const reads = [];
  const writes = [];

  // Collect all reads
  window.__BM_BATCH_READ__(() => {
    reads.push(document.querySelector('.header').offsetHeight);
    reads.push(document.querySelector('.sidebar').offsetWidth);
  });

  // Collect all writes
  window.__BM_BATCH_WRITE__(() => {
    document.querySelector('.main').style.marginTop = reads[0] + 'px';
    document.querySelector('.main').style.marginLeft = reads[1] + 'px';
  });

  // Browser does all reads, then all writes (no layout thrashing)
}
```

### Pattern 3: Deferred Rendering
```javascript
// Defer expensive rendering until idle
function renderComplexVisualization() {
  window.__BM_DEFER_PAINT__(() => {
    // This runs during browser idle callback
    // Won't block user interaction
    complexChart.render();
    heavyAnimation.start();
  }, 'background');
}
```

### Pattern 4: Preload Critical Resources
```javascript
// Preload hero image and fonts for next page
window.__BM_ASSET_OPTIMIZER__.preloadResources([
  '/images/hero-1200w.webp',
  '/fonts/inter-400.woff2',
  '/fonts/oswald-700.woff2'
]);
```

### Pattern 5: Cache with Auto-Expiry
```javascript
// Cache API response for 1 hour
function getCachedUserData() {
  const cached = window.__BM_MEMORY_OPTIMIZER__.getCache('user-data');
  if (cached) return cached;

  // Fetch and cache
  const userData = fetch('/api/user').then(r => r.json());
  window.__BM_MEMORY_OPTIMIZER__.setCache('user-data', userData, 3600000);
  return userData;
}
```

### Pattern 6: Monitor Memory
```javascript
// Set up monitoring in useEffect
useEffect(() => {
  const interval = setInterval(() => {
    const stats = window.__BM_MEMORY_OPTIMIZER__.getMemoryStats();
    
    if (stats.percentUsed > 80) {
      console.warn('Memory pressure:', stats.percentUsed + '%');
      // Could trigger cleanup or disable features
    }
  }, 10000); // Every 10 seconds

  return () => clearInterval(interval);
}, []);
```

### Pattern 7: Adapt to Network
```javascript
// Load different content based on network
useEffect(() => {
  const speed = window.__BM_ASSET_OPTIMIZER__.getNetworkSpeed();

  if (speed === 'slow' || speed === 'very-slow') {
    loadImages(LOW_QUALITY); // Small, compressed images
  } else {
    loadImages(HIGH_QUALITY); // Full resolution
  }

  window.addEventListener('bm-network-speed-change', (e) => {
    if (e.detail.speed === 'slow') {
      switchToLowQuality();
    }
  });
}, []);
```

### Pattern 8: Device-Aware Features
```javascript
// Only show effect on capable devices
if (window.__BM_PERFORMANCE_TIER__ >= 3) {
  // Show fancy 3D animation
  useSplineAnimation();
} else {
  // Show simpler 2D animation
  useCSS2DAnimation();
}
```

---

## 🎯 Performance Hooks for React

```javascript
// Custom hook to use optimization APIs
function usePerformanceOptimization() {
  const batchRead = window.__BM_BATCH_READ__;
  const batchWrite = window.__BM_BATCH_WRITE__;
  const deferPaint = window.__BM_DEFER_PAINT__;
  const memoryStats = window.__BM_MEMORY_OPTIMIZER__.getMemoryStats();
  const scrollFps = window.__BM_SCROLL_SMOOTH__.getFPS();
  const tier = window.__BM_PERFORMANCE_TIER__;

  return {
    batchRead,
    batchWrite,
    deferPaint,
    memoryStats,
    scrollFps,
    tier,
    isLowEnd: tier <= 2,
    isHighEnd: tier >= 3,
    isMemoryPressured: window.__BM_MEMORY_OPTIMIZER__.isMemoryPressured()
  };
}

// Usage in component:
function MyComponent() {
  const perf = usePerformanceOptimization();

  if (perf.isMemoryPressured) {
    return <SimplifiedUI />;
  }

  return perf.isHighEnd ? <FullFeaturedUI /> : <OptimizedUI />;
}
```

---

## 📊 Monitoring Dashboard Example

```javascript
// Display performance metrics on page
function PerformanceDashboard() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        memory: window.__BM_MEMORY_OPTIMIZER__.getMemoryStats(),
        scroll: {
          fps: window.__BM_SCROLL_SMOOTH__.getFPS(),
          isThrottled: window.__BM_SCROLL_SMOOTH__.isThrottled()
        },
        render: window.__BM_RENDER_METRICS__.getMetrics(),
        network: window.__BM_ASSET_OPTIMIZER__.getNetworkSpeed(),
        tier: window.__BM_PERFORMANCE_TIER__
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black p-4 text-xs font-mono">
      <div>Memory: {metrics.memory?.percentUsed?.toFixed(1)}%</div>
      <div>Scroll FPS: {metrics.scroll?.fps}</div>
      <div>Network: {metrics.network}</div>
      <div>Tier: {metrics.tier}</div>
      <div>Heavy Render: {metrics.render?.isHeavy ? '⚠️ Yes' : '✓ No'}</div>
    </div>
  );
}
```

---

## 🚨 Event Listeners

Listen for performance events:

```javascript
// Memory pressure
window.addEventListener('bm-memory-warning', (e) => {
  console.warn('Memory at', e.detail.percentUsed + '%');
});

// Scroll FPS dropped
window.addEventListener('bm-scroll-fps-low', (e) => {
  console.warn('Scroll FPS:', e.detail.fps);
});

// Heavy rendering detected
window.addEventListener('bm-heavy-render', (e) => {
  console.warn('Long task detected');
});

// Network speed changed
window.addEventListener('bm-network-speed-change', (e) => {
  console.log('Network changed to:', e.detail.speed);
});

// Fonts finished loading
window.addEventListener('bm-fonts-loaded', () => {
  console.log('All fonts ready');
});

// Low FPS warning (generic)
window.addEventListener('bm-performance-low', (e) => {
  console.warn('Performance issue:', e.detail.fps, 'FPS');
});
```

---

## ⚡ Pro Tips

1. **Use `batchRead`/`batchWrite` for any DOM updates**
   - Prevents layout thrashing
   - Batches all operations in single frame

2. **Defer expensive work to idle time**
   ```javascript
   window.__BM_DEFER_PAINT__(complexWork, 'background');
   ```

3. **Cache frequently-accessed data**
   ```javascript
   window.__BM_MEMORY_OPTIMIZER__.setCache('key', value, 60000);
   ```

4. **Debounce search/filter inputs**
   ```javascript
   window.__BM_INTERACTION_OPTIMIZER__.debounce(search, 150);
   ```

5. **Check performance tier before fancy features**
   ```javascript
   if (window.__BM_PERFORMANCE_TIER__ >= 3) showFancyAnimation();
   ```

6. **Preload critical images on route change**
   ```javascript
   const nextPageHero = '/next-hero.webp';
   window.__BM_ASSET_OPTIMIZER__.preloadResources([nextPageHero]);
   ```

7. **Cleanup listeners on component unmount**
   ```javascript
   useEffect(() => {
     window.addEventListener('bm-memory-warning', handler);
     return () => window.removeEventListener('bm-memory-warning', handler);
   }, []);
   ```

8. **Monitor via custom dashboard**
   ```javascript
   // Add hidden dashboard in dev mode
   if (process.env.NODE_ENV === 'development') {
     return <PerformanceDashboard />;
   }
   ```

---

## 🐛 Debugging Tips

**Check what's loaded:**
```javascript
console.log(
  'Image Optimizer:', !!window.__BM_IMAGE_OPTIMIZER__,
  'Network Opt:', !!window.__BM_ASSET_OPTIMIZER__,
  'Memory Opt:', !!window.__BM_MEMORY_OPTIMIZER__,
  'Scroll Smooth:', !!window.__BM_SCROLL_SMOOTH__,
  'Device Tier:', window.__BM_PERFORMANCE_TIER__
);
```

**Monitor memory growth:**
```javascript
const snapshots = window.__BM_MEMORY_OPTIMIZER__.getMemoryHistory();
const growth = snapshots[snapshots.length - 1].usedJSHeapSize - snapshots[0].usedJSHeapSize;
console.log('Memory growth:', (growth / 1024 / 1024).toFixed(1), 'MB');
```

**Check for listener leaks:**
```javascript
const count = window.__BM_MEMORY_OPTIMIZER__.getActiveListenerCount();
console.log('Active event listeners:', count);
// Should be < 100 on normal page, not 1000+
```

**Profile scroll performance:**
```javascript
setInterval(() => {
  const fps = window.__BM_SCROLL_SMOOTH__.getFPS();
  console.log('Scroll FPS:', fps);
}, 3000);
```

---

**All APIs are namespaced to `__BM_*` to avoid conflicts with other libraries.**

