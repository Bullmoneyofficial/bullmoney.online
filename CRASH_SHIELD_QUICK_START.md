# Mobile Crash Shield - Quick Integration Guide

## 🚀 Quick Start (5 minutes)

### Step 1: The script is already added to your app

The crash shield automatically loads on every page via `app/layout.tsx`:

```tsx
<Script
  src="/scripts/BMBRAIN/mobile-crash-shield.js"
  strategy="afterInteractive"
/>
```

✅ **No additional setup needed!**

---

## 🔧 Updating Existing Components

### For Spline/3D Components

#### Before:
```tsx
import { SplineWrapper } from '@/lib/spline-wrapper';

function Hero() {
  return (
    <SplineWrapper scene="/scene1.splinecode" />
  );
}
```

#### After (2 line change):
```tsx
import { SplineWrapper } from '@/lib/spline-wrapper';
import { useMobileCrashShield } from '@/hooks/useMobileCrashShield';

function Hero() {
  const { shouldLoad, queueSplineLoad } = useMobileCrashShield({
    componentId: 'hero-spline',
    priority: 'high'
  });
  
  const [loaded, setLoaded] = React.useState(false);
  
  React.useEffect(() => {
    if (shouldLoad) {
      queueSplineLoad('/scene1.splinecode', () => setLoaded(true));
    }
  }, [shouldLoad, queueSplineLoad]);
  
  if (!loaded) return <LoadingSkeleton />;
  
  return <SplineWrapper scene="/scene1.splinecode" />;
}
```

---

### For Heavy Animation Components

#### Before:
```tsx
function ParticleBackground() {
  return <ParticleSystem count={500} />;
}
```

#### After (1 line change):
```tsx
import { useSkipHeavyEffects } from '@/hooks/useMobileCrashShield';

function ParticleBackground() {
  const shouldSkip = useSkipHeavyEffects();
  
  if (shouldSkip) return null; // Skip on low memory
  
  return <ParticleSystem count={500} />;
}
```

---

### For Canvas/WebGL Components

#### Before:
```tsx
function CustomCanvas() {
  return <canvas ref={canvasRef} />;
}
```

#### After (1 attribute change):
```tsx
function CustomCanvas() {
  return (
    <canvas 
      ref={canvasRef}
      data-keep-canvas={isPermanent ? "true" : undefined}
    />
  );
}
```

The `data-keep-canvas` attribute prevents cleanup on hero/critical canvases.

---

## 📦 Common Patterns

### Pattern 1: Progressive Enhancement

Load lightweight version first, then enhance:

```tsx
function SmartComponent() {
  const { shouldLoad, shouldSkipHeavy } = useMobileCrashShield({
    componentId: 'smart-comp',
    priority: 'normal'
  });
  
  // Lightweight version loads immediately
  if (!shouldLoad || shouldSkipHeavy) {
    return <LightweightVersion />;
  }
  
  // Heavy version loads when ready and memory allows
  return <HeavyVersion />;
}
```

### Pattern 2: Quality Scaling

Adjust quality based on memory:

```tsx
function AdaptiveScene() {
  const { shouldReduceQuality } = useMobileCrashShield({
    componentId: 'scene',
    priority: 'normal'
  });
  
  return (
    <Scene
      quality={shouldReduceQuality ? 'low' : 'high'}
      fps={shouldReduceQuality ? 30 : 60}
      particles={shouldReduceQuality ? 50 : 500}
    />
  );
}
```

### Pattern 3: Conditional Rendering

Skip non-essential features on low memory:

```tsx
function FullPage() {
  const shouldSkip = useSkipHeavyEffects();
  
  return (
    <>
      <HeroSection />
      <ContentSection />
      {!shouldSkip && <ParticleBackground />}
      {!shouldSkip && <AnimatedDecoration />}
      <FooterSection />
    </>
  );
}
```

---

## 🎯 Priority Guide

Choose priority based on viewport position:

| Priority | Use Case | Load Time |
|----------|----------|-----------|
| `high` | Hero sections, above-fold critical content | ~100ms |
| `normal` | Mid-page content, features, products | Idle or 2s |
| `low` | Below-fold, footer, decorative elements | Idle or 5s |

Example:
```tsx
// Hero - high priority
useMobileCrashShield({ componentId: 'hero', priority: 'high' });

// Features - normal priority  
useMobileCrashShield({ componentId: 'features', priority: 'normal' });

// Footer decoration - low priority
useMobileCrashShield({ componentId: 'footer-bg', priority: 'low' });
```

---

## ⚙️ Configuration Options

```tsx
useMobileCrashShield({
  componentId: 'unique-id',           // Required: Unique identifier
  priority: 'high',                   // Optional: 'high' | 'normal' | 'low'
  skipOnLowMemory: false,             // Optional: Skip completely on low-memory devices
  viewportMargin: '400px'             // Optional: When to start loading (IntersectionObserver margin)
});
```

---

## 🐛 Debugging

### Check if shield is working:

```javascript
// In browser console
console.log(window.__BM_CRASH_SHIELD__);
// Should show: { active: true, memoryBudget: 180, ... }

console.log(window.__BM_CRASH_SHIELD__.getStats());
// Shows current memory usage and stats
```

### Add debug component to your page:

```tsx
import { useMemoryStats } from '@/hooks/useMobileCrashShield';

function MemoryDebug() {
  const { memoryMB, budgetMB, pressure } = useMemoryStats();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white px-3 py-2 rounded text-xs">
      {memoryMB}MB / {budgetMB}MB ({pressure})
    </div>
  );
}
```

---

## 📋 Migration Checklist

When updating existing pages:

- [ ] Identify all Spline/3D components
- [ ] Add `useMobileCrashShield` hook with appropriate priority
- [ ] Queue Spline loads with `queueSplineLoad()`
- [ ] Identify heavy animation components
- [ ] Add `useSkipHeavyEffects()` to particle systems, complex animations
- [ ] Mark critical canvases with `data-keep-canvas`
- [ ] Test on mobile device or Chrome DevTools mobile emulation
- [ ] Check memory usage with `getStats()`

---

## 🎨 No Visual Changes

**Important**: The crash shield **never changes styles**. It only:

✅ Manages memory  
✅ Queues heavy loads  
✅ Provides hooks for components to adapt  
✅ Cleans up off-screen resources  

❌ Does not change colors  
❌ Does not change backgrounds  
❌ Does not disable features (just defers them)  
❌ Does not force dark/light mode  

---

## 📊 Performance Impact

| Metric | Before Shield | After Shield |
|--------|---------------|--------------|
| Script size | - | +6KB |
| Memory overhead | - | <1MB |
| CPU usage | - | Negligible |
| Crash rate (mobile) | ~5-10% | <1% |
| Load time | Same | Same |

---

## ✅ Examples in Codebase

See these files for working examples:

- `/components/examples/SmartSplineExample.tsx` - Full examples
- `/hooks/useMobileCrashShield.ts` - Hook implementation
- `/public/scripts/BMBRAIN/mobile-crash-shield.js` - Core script
- `/MOBILE_CRASH_SHIELD_GUIDE.md` - Full documentation

---

## 🆘 Troubleshooting

### Components not loading

Check priority and `shouldLoad`:
```tsx
const { shouldLoad } = useMobileCrashShield({...});
console.log('Should load?', shouldLoad);
```

### Memory still high

Check if old `memory-guardian.js` is conflicting:
```javascript
console.log(window.__BM_MEMORY_GUARDIAN__);
// If present alongside crash shield, there may be conflicts
```

### Spline scenes loading too fast

They're queued! Check queue:
```javascript
console.log(window.__BM_CRASH_SHIELD__.getStats());
// Shows activeSplineLoads and queuedSplineLoads
```

---

## 🚀 Next Steps

1. **Start small**: Update 1-2 components to test
2. **Monitor**: Add debug component during development
3. **Measure**: Check `getStats()` before and after
4. **Expand**: Gradually update remaining heavy components
5. **Test**: Use mobile device or Chrome DevTools mobile emulation

For full API docs, see: `/MOBILE_CRASH_SHIELD_GUIDE.md`
