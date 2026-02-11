# Mobile Crash Shield - Usage Guide

## Overview

The Mobile Crash Shield is a lightweight performance system that prevents crashes on mobile devices through:

1. **Smart Cache Management** - Automatically cleans old caches while preserving critical assets
2. **Memory Monitoring** - Tracks memory usage and triggers cleanup before crashes occur
3. **Smart Lazy Loading** - Defers heavy 3D/Spline/WebGL components until they're needed
4. **No Styling Changes** - Only performance optimizations, no visual changes

## How It Works

The system runs automatically in the background and:

- Monitors JavaScript heap memory usage
- Detects memory pressure levels (normal → warning → critical)
- Clears off-screen images, canvases, and videos when memory is low
- Queues Spline/3D loads to prevent simultaneous WebGL context creation
- Provides React hooks for components to react to memory pressure

## For React Components

### Basic Usage - Skip Heavy Effects

Use this hook when you want to skip expensive render effects on low-memory devices:

```tsx
import { useSkipHeavyEffects } from '@/hooks/useMobileCrashShield';

function MyComponent() {
  const shouldSkip = useSkipHeavyEffects();
  
  if (shouldSkip) {
    return <LightweightVersion />;
  }
  
  return <HeavyAnimatedVersion />;
}
```

### Advanced Usage - Full Crash Shield Integration

For components that need more control:

```tsx
import { useMobileCrashShield } from '@/hooks/useMobileCrashShield';

function SplineScene() {
  const {
    shouldLoad,          // True when component should load
    shouldSkipHeavy,     // True when heavy effects should be skipped
    shouldReduceQuality, // True when quality should be reduced
    memoryPressure,      // 'normal' | 'warning' | 'critical'
    queueSplineLoad,     // Queue Spline loads
    deferLoad            // Defer load until viewport
  } = useMobileCrashShield({
    componentId: 'hero-spline',
    priority: 'high', // 'high' | 'normal' | 'low'
    skipOnLowMemory: false,
    viewportMargin: '400px'
  });

  // Don't render until ready
  if (!shouldLoad) {
    return <LoadingSkeleton />;
  }

  // Use reduced quality on memory pressure
  const quality = shouldReduceQuality ? 'low' : 'high';
  
  return <Spline scene="/scene.splinecode" quality={quality} />;
}
```

### Priority Levels

- **high**: Loads after 100ms (hero sections, critical content)
- **normal**: Loads during idle time with 2s timeout (typical components)
- **low**: Loads during idle time with 5s timeout (below-fold content)

### Memory-Aware Spline Loading

Queue Spline loads to prevent crashes from too many simultaneous WebGL contexts:

```tsx
function MultipleSplineScenes() {
  const { queueSplineLoad } = useMobileCrashShield({
    componentId: 'multi-spline',
    priority: 'normal'
  });

  useEffect(() => {
    // Queue loads instead of loading all at once
    queueSplineLoad('/scene1.splinecode', () => {
      setScene1Loaded(true);
    });
    
    queueSplineLoad('/scene2.splinecode', () => {
      setScene2Loaded(true);
    });
  }, [queueSplineLoad]);

  return (
    <>
      {scene1Loaded && <Spline scene="/scene1.splinecode" />}
      {scene2Loaded && <Spline scene="/scene2.splinecode" />}
    </>
  );
}
```

### Deferred Loading with IntersectionObserver

Defer component loading until it's near the viewport:

```tsx
function HeavySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { deferLoad } = useMobileCrashShield({
    componentId: 'heavy-section',
    priority: 'low'
  });

  useEffect(() => {
    if (containerRef.current) {
      deferLoad(containerRef.current, () => {
        setIsLoaded(true);
      });
    }
  }, [deferLoad]);

  return (
    <div ref={containerRef}>
      {isLoaded ? <HeavyComponent /> : <LoadingSkeleton />}
    </div>
  );
}
```

### Check Memory Stats

Monitor current memory usage:

```tsx
import { useMemoryStats } from '@/hooks/useMobileCrashShield';

function MemoryDebugger() {
  const { memoryMB, budgetMB, pressure } = useMemoryStats();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 p-2 rounded text-xs">
      Memory: {memoryMB}MB / {budgetMB}MB ({pressure})
    </div>
  );
}
```

## Vanilla JavaScript Usage

### Check if Heavy Effects Should Be Skipped

```javascript
// Global function available after shield loads
if (window.__BM_SHOULD_SKIP_HEAVY__ && window.__BM_SHOULD_SKIP_HEAVY__()) {
  // Skip expensive animations
  element.classList.remove('animate-complex');
}
```

### Listen to Memory Pressure Events

```javascript
window.addEventListener('bullmoney-memory-pressure', (event) => {
  const { level, memoryMB, budgetMB } = event.detail;
  
  if (level === 'critical') {
    // Stop animations, reduce quality
    pauseExpensiveEffects();
  }
});
```

### Listen to Performance Hints

```javascript
window.addEventListener('bullmoney-performance-hint', (event) => {
  const { skipHeavy, reduceQuality, memoryMB } = event.detail;
  
  if (skipHeavy) {
    // Disable particle systems
    stopParticles();
  }
  
  if (reduceQuality) {
    // Lower texture quality
    setTextureQuality('low');
  }
});
```

### Queue Spline Loads

```javascript
// Queue multiple Spline scenes to prevent simultaneous loads
const shield = window.__BM_CRASH_SHIELD__;

shield.queueSplineLoad('/scene1.splinecode', () => {
  loadSplineScene1();
});

shield.queueSplineLoad('/scene2.splinecode', () => {
  loadSplineScene2();
});
```

### Defer Component Loading

```javascript
const element = document.getElementById('heavy-component');

window.deferHeavyComponent(
  '#heavy-component',
  () => {
    // Load heavy component
    initializeHeavyComponent();
  },
  {
    priority: 'normal', // 'high' | 'normal' | 'low'
    margin: '400px'     // Viewport margin for IntersectionObserver
  }
);
```

### Get Shield Stats

```javascript
const shield = window.__BM_CRASH_SHIELD__;
const stats = shield.getStats();

console.log(stats);
// {
//   memoryBudget: "180MB",
//   currentMemory: "120MB",
//   cleanupCount: 3,
//   deferredComponents: 5,
//   activeSplineLoads: 1,
//   queuedSplineLoads: 2,
//   isMobile: true,
//   isInApp: false,
//   deviceMemory: "4GB"
// }
```

## Best Practices

### 1. **Always Queue Spline/3D Loads**

❌ **Bad** - Loading multiple Spline scenes simultaneously:
```tsx
function HeroSection() {
  return (
    <>
      <Spline scene="/scene1.splinecode" />
      <Spline scene="/scene2.splinecode" />
      <Spline scene="/scene3.splinecode" />
    </>
  );
}
```

✅ **Good** - Queue loads sequentially:
```tsx
function HeroSection() {
  const { queueSplineLoad } = useMobileCrashShield({
    componentId: 'hero-splines',
    priority: 'high'
  });
  
  const [loadedScenes, setLoadedScenes] = useState<string[]>([]);
  
  useEffect(() => {
    const scenes = ['/scene1.splinecode', '/scene2.splinecode', '/scene3.splinecode'];
    
    scenes.forEach((sceneUrl) => {
      queueSplineLoad(sceneUrl, () => {
        setLoadedScenes(prev => [...prev, sceneUrl]);
      });
    });
  }, [queueSplineLoad]);
  
  return (
    <>
      {loadedScenes.includes('/scene1.splinecode') && <Spline scene="/scene1.splinecode" />}
      {loadedScenes.includes('/scene2.splinecode') && <Spline scene="/scene2.splinecode" />}
      {loadedScenes.includes('/scene3.splinecode') && <Spline scene="/scene3.splinecode" />}
    </>
  );
}
```

### 2. **Use Appropriate Priority Levels**

```tsx
// Hero/above-fold content
const hero = useMobileCrashShield({ 
  componentId: 'hero', 
  priority: 'high' 
});

// Mid-page content
const features = useMobileCrashShield({ 
  componentId: 'features', 
  priority: 'normal' 
});

// Below-fold content
const footer = useMobileCrashShield({ 
  componentId: 'footer-spline', 
  priority: 'low' 
});
```

### 3. **Skip Heavy Effects on Memory Pressure**

```tsx
function ParticleSystem() {
  const shouldSkip = useSkipHeavyEffects();
  
  return (
    <Canvas>
      <Particles count={shouldSkip ? 50 : 500} />
      <AnimatedMesh 
        complexity={shouldSkip ? 'low' : 'high'}
        fps={shouldSkip ? 30 : 60}
      />
    </Canvas>
  );
}
```

### 4. **Mark Canvases You Want to Keep**

Add `data-keep-canvas` or `data-spline-hero` to prevent cleanup:

```tsx
<canvas 
  data-keep-canvas="true"
  ref={heroCanvasRef}
/>
```

### 5. **Provide Loading Fallbacks**

Always show something while components load:

```tsx
const { shouldLoad } = useMobileCrashShield({
  componentId: 'product-3d',
  priority: 'normal'
});

if (!shouldLoad) {
  return <ProductImageSkeleton />;
}
```

## Memory Budgets

The shield automatically calculates memory budgets based on device:

| Device Type | Memory | Budget |
|------------|--------|--------|
| In-app browser (4GB+) | ≥4GB | 120MB |
| In-app browser (2-4GB) | 2-4GB | 80MB |
| In-app browser (<2GB) | <2GB | 50MB |
| Mobile (8GB+) | ≥8GB | 300MB |
| Mobile (6-8GB) | 6-8GB | 220MB |
| Mobile (4-6GB) | 4-6GB | 180MB |
| Mobile (2-4GB) | 2-4GB | 100MB |
| Mobile (<2GB) | <2GB | 60MB |
| Desktop | Any | 500MB |

## Events Reference

### `bullmoney-memory-pressure`

Fired when memory pressure changes.

```typescript
interface MemoryPressureEvent {
  level: 'normal' | 'warning' | 'critical';
  memoryMB: number;
  budgetMB: number;
}
```

### `bullmoney-performance-hint`

Fired every 5 seconds with performance recommendations.

```typescript
interface PerformanceHintEvent {
  skipHeavy: boolean;
  reduceQuality: boolean;
  memoryMB: number;
  budgetMB: number;
}
```

## Debugging

### Check if Shield is Active

```javascript
console.log(window.__BM_CRASH_SHIELD__);
// { active: true, memoryBudget: 180, ... }
```

### View Current Stats

```javascript
console.log(window.__BM_CRASH_SHIELD__.getStats());
```

### Enable Debug Logs

Shield logs are visible on `localhost`:

```
[Mobile Crash Shield] Active | Budget: 180MB | Device: 4GB | Mobile: true
[Mobile Crash Shield] Cache cleanup complete
[Mobile Crash Shield] Stats: {...}
```

On production, only warnings and errors are logged.

## Migration from Old Boost System

The new shield **replaces** these old scripts:

- ❌ `boost.py` (deleted)
- ❌ `memory-guardian.js` (keep for backward compat, but shield is simpler)
- ❌ `crash-prevention.js` (functionality merged into shield)

Key differences:

1. **No styling changes** - Shield never changes colors, backgrounds, or themes
2. **Simpler API** - Just 3 hooks vs complex configuration
3. **Smart queuing** - Prevents simultaneous heavy loads
4. **Auto cache management** - No manual cache clearing needed

## Performance Impact

The shield itself is **extremely lightweight**:

- **Script size**: ~6KB minified
- **Memory overhead**: <1MB
- **CPU impact**: Negligible (checks run every 3-8 seconds)
- **No render blocking**: Loads after interactive

## Support

For issues or questions:

1. Check `window.__BM_CRASH_SHIELD__.getStats()` for diagnostics
2. Verify shield is loaded: `data-crash-shield="active"` on `<html>`
3. Check console for memory pressure warnings
4. Use memory debugger component to monitor real-time stats
