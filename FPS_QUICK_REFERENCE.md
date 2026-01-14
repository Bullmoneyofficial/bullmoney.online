# FPS Optimization Quick Reference Card

## 📊 FPS Monitor Display

Shows in **top-right corner** in development mode:

```
✓ FPS Monitor
├─ FPS: 60 (avg: 59 | min: 57 | max: 60)  ← Current/Average/Min/Max
├─ Frame: 16.7ms (target: 16.67ms)        ← Frame time vs budget
├─ Quality:
│  ├─ Tier: high                            ← Device capability
│  ├─ Shimmer: high                         ← Shimmer quality level
│  └─ 3D: ON                                ← 3D rendering enabled
├─ History: [▓▓▓▓▓...] (graph)             ← FPS history
└─ Dropped: 0                               ← Dropped frames counter
```

---

## 🎯 Quality Tiers

### Detection
Automatically detected based on GPU, CPU, memory, display:

| Tier | GPU | Memory | FPS | Shimmer | 3D | Polygons |
|------|-----|--------|-----|---------|----|----|
| **Ultra** | Discrete | 16GB+ | 60 | High | Ultra | 3M |
| **High** | Good | 8GB+ | 60 | High | High | 2M |
| **Medium** | Average | 4GB+ | 60 | Medium | Medium | 1M |
| **Low** | Budget | 2GB+ | 60 | Low | Low | 250K |
| **Minimal** | Integrated | <2GB | 60 | Off | Low | 100K |

### Your M1 Mac
**Expected: Ultra or High tier**

---

## 💻 Usage in Components

### Quick Access
```tsx
import { useFpsOptimizer } from '@/lib/FpsOptimizer';

export function Component() {
  const { 
    currentFps,           // Number: current FPS (0-60)
    averageFps,           // Number: rolling average
    deviceTier,           // 'ultra' | 'high' | 'medium' | 'low' | 'minimal'
    shimmerQuality,       // 'high' | 'medium' | 'low' | 'disabled'
    enable3D,             // Boolean: 3D rendering enabled
    enableHoverAnimations // Boolean: hover effects enabled
  } = useFpsOptimizer();
  
  // Use for conditional rendering
  return <div>{shimmerQuality !== 'disabled' && <Shimmer />}</div>;
}
```

### Quality-Aware Rendering
```tsx
// Only render expensive component on fast devices
if (deviceTier === 'ultra' || deviceTier === 'high') {
  return <AdvancedEffect />;
} else {
  return <SimpleFallback />;
}

// Disable shimmer on low-end devices
if (shimmerQuality === 'disabled') {
  return <SolidPlaceholder />;
}
```

### Frame Skipping
```tsx
import { useFrameSkipping } from '@/lib/renderingOptimizations';

export function ShimmerEffect() {
  const { shouldRender } = useFrameSkipping(2); // Skip every 2 frames
  
  // Returns false on skipped frames - component won't render
  // Result: Animation runs at 30fps visually, but render loop stays at 60fps
  if (!shouldRender()) return null;
  
  return <div className="shimmer-animated">Loading...</div>;
}
```

### Deferred Work
```tsx
import { useDeferredWork } from '@/lib/renderingOptimizations';

export function Component() {
  const { performWork } = useDeferredWork();
  
  useEffect(() => {
    // This runs when browser is idle, not blocking main thread
    performWork(
      () => expensiveCalculation(),
      'calc-id',
      'low'  // Priority: 'high' | 'normal' | 'low'
    );
  }, [performWork]);
}
```

---

## 🎨 CSS Classes

Applied automatically to `<html>` element:

### Device Tier
```css
html.fps-ultra    { /* Ultra tier styles */ }
html.fps-high     { /* High tier styles */ }
html.fps-medium   { /* Medium tier styles */ }
html.fps-low      { /* Low tier styles */ }
html.fps-minimal  { /* Minimal tier styles */ }
```

### Shimmer Quality
```css
html.shimmer-quality-high      { /* Full shimmer */ }
html.shimmer-quality-medium    { /* Slower shimmer */ }
html.shimmer-quality-low       { /* Very slow shimmer */ }
html.shimmer-quality-disabled  { /* No shimmer */ }
```

### Feature Flags
```css
html.reduce-blur       { /* No blur - always applied */ }
html.reduce-shadows    { /* No shadows */ }
html.reduce-animations { /* Minimal animations */ }
html.reduce-particles  { /* No particles */ }
html.is-mobile         { /* Mobile device */ }
html.is-safari         { /* Safari browser */ }
```

---

## ⚙️ Configuration

### Global (in `app/layout.tsx`)
```tsx
<FpsOptimizerProvider
  enableMonitoring={true}      // ✅ Always enabled
  monitoringInterval={500}     // Check every 500ms
  startDelay={1000}            // Wait 1s before starting
>
```

### CSS Variables
Automatically set on `<html>`:
```css
:root {
  --animation-duration-multiplier: 0.7;  /* Adjust animation speed */
  --blur-amount: 0px;                    /* Always 0 - no blur */
  --shadow-opacity: 1;                   /* Shadow visibility */
  --target-fps: 60;                      /* Target frame rate */
}
```

---

## 📈 Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| FPS (avg) | 55-60 | Watch FPS Monitor |
| FPS (min) | 50+ | Check monitor's min |
| Frame time | <16.7ms | Monitor shows frame time |
| Paint | <5ms | DevTools Performance |
| No jank | Always smooth | Feels responsive |

---

## 🔍 Debugging

### Check Console Logs
```javascript
[FpsOptimizer] Device tier: high          ← Your device tier
[FpsOptimizer] Low FPS (42) - reducing   ← Quality drops
[FpsOptimizer] Idle detected             ← Quality restored when active
```

### DevTools Profiling
1. **Open**: DevTools → Performance tab
2. **Record**: Click Record, interact for 10s, stop
3. **Check**:
   - ✅ FPS line stays at 60 (no dips below 50)
   - ✅ Paint time <5ms per frame
   - ✅ No long tasks >50ms
   - ✅ Green at top = good performance

### FPS Monitor Reference
- **Green (58-60)**: Perfect ✅
- **Yellow (50-57)**: Good ✅
- **Orange (40-49)**: Warning ⚠️
- **Red (<40)**: Critical ❌

---

## 🎯 Common Patterns

### Device-Specific Rendering
```tsx
const { deviceTier } = useFpsOptimizer();

// Render based on capability
switch(deviceTier) {
  case 'ultra':   return <AdvancedVersion />;
  case 'high':    return <StandardVersion />;
  case 'medium':  return <BalancedVersion />;
  case 'low':     return <MinimalVersion />;
  case 'minimal': return <BasicVersion />;
}
```

### Conditional Features
```tsx
const { enable3D, enableHoverAnimations, enableScrollAnimations } = useFpsOptimizer();

return (
  <div>
    {enable3D && <Spline />}                    {/* Only on capable devices */}
    <button className={enableHoverAnimations ? 'hover-scale' : ''}>  {/* Hover on fast devices */}
      Click me
    </button>
  </div>
);
```

### Frame Skipping Patterns
```tsx
// Skip every 1 frame = 30fps visual
const skip1 = useFrameSkipping(1);

// Skip every 2 frames = 20fps visual  
const skip2 = useFrameSkipping(2);

// Skip every 3 frames = 15fps visual
const skip3 = useFrameSkipping(3);

// Skip every 4 frames = 12fps visual (background effects only)
const skip4 = useFrameSkipping(4);
```

---

## 📝 CSS Tips

### Replace Blur
```css
/* ❌ Don't use - disabled globally */
.backdrop-blur { /* Doesn't work */ }

/* ✅ Use instead */
.glass {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Animation Multiplier
```css
/* Animations automatically scaled by device */
.my-animation {
  animation-duration: calc(0.5s * var(--animation-duration-multiplier));
}

/* On ultra: 0.5s × 0.8 = 0.4s (fast)
   On high:  0.5s × 0.7 = 0.35s
   On low:   0.5s × 0.3 = 0.15s (slow) */
```

### GPU Acceleration
```css
/* Always add for animated elements */
.animated {
  transform: translateZ(0);        /* Force GPU acceleration */
  backface-visibility: hidden;     /* Prevent flickering */
  will-change: transform, opacity; /* Hint to browser */
}
```

---

## 🚀 Performance Tips

### ✅ Do This
- ✅ Use `transform` for animations (not `left`/`top`)
- ✅ Use `opacity` for fading (not `display`)
- ✅ Keep animations under 1 second (except looped shimmer)
- ✅ Skip expensive renders on alternate frames
- ✅ Defer heavy computation to idle time
- ✅ Use CSS `contain` for isolated components
- ✅ Lazy load images with `loading="lazy"`

### ❌ Don't Do This
- ❌ Don't use `backdrop-blur` (automatically disabled)
- ❌ Don't animate `width`/`height` (causes layout thrashing)
- ❌ Don't animate `margin`/`padding` (causes reflows)
- ❌ Don't animate `box-shadow` (expensive)
- ❌ Don't use complex filters (disabled on mobile)
- ❌ Don't disable smooth scrolling (JS RAF handles it)
- ❌ Don't use `will-change` on everything (defeats purpose)

---

## 📊 What's Automatically Disabled

On M1 Mac (and all devices for performance):
- ❌ Backdrop blur effects
- ❌ Complex shadows (>2 layers)
- ❌ Particle effects (on medium tier+)
- ❌ Expensive filters
- ❌ Layout-affecting animations
- ❌ Scroll animations (on low tier+)
- ❌ Hover animations (on low tier+)

**Result**: Everything still looks good, just faster! ⚡

---

## 🔧 Troubleshooting

### Low FPS?
1. Check FPS Monitor - what tier?
2. If ultra/high: Something blocking main thread
3. If low/minimal: Device is genuinely underpowered
4. Profile in DevTools to find bottleneck

### Blur still visible?
1. Clear browser cache (Cmd+Shift+Delete)
2. Hard refresh (Cmd+Shift+R)
3. Check `/styles/fps-optimization.css` is imported

### Quality too degraded?
1. System protecting from crashes (good!)
2. Will restore if stable for 3+ seconds
3. Adjust thresholds in `lib/FpsOptimizer.tsx` if needed

### FPS Monitor not showing?
1. Only shows in **development mode** (`npm run dev`)
2. Not visible in production
3. Check DevTools console for errors

---

## 📞 Help

| Issue | Solution |
|-------|----------|
| Low FPS | Read "Troubleshooting" section above |
| Blur not disabled | Hard refresh & clear cache |
| Visual quality bad | Check FPS Monitor tier |
| Component lag | Use frame skipping or defer work |
| Don't understand | Read `FPS_OPTIMIZATION_GUIDE.md` |

---

## 🎓 Learning Resources

- **`FPS_OPTIMIZATION_GUIDE.md`**: Complete system documentation
- **`FPS_OPTIMIZATION_EXAMPLES.md`**: 10 component implementation examples
- **`FPS_OPTIMIZATION_COMPLETE.md`**: Overview and setup guide
- **Console logs**: Tells you what's happening in real-time
- **FPS Monitor**: Shows live performance metrics

---

## ✅ Checklist

Before going to production:

- ✅ Test FPS Monitor (shows in dev mode)
- ✅ Check FPS stays 55-60 during interactions
- ✅ Verify no blur effects visible
- ✅ Profile with DevTools (paint <5ms)
- ✅ Test on different devices if possible
- ✅ Clear browser cache before testing
- ✅ Check console for error logs

---

## 🎉 You're All Set!

Your app now targets 60 FPS on M1 Macs. The system:
- ✅ Automatically detects device capability
- ✅ Scales quality to match performance
- ✅ Maintains smooth 60fps always
- ✅ Disables expensive effects
- ✅ Provides real-time monitoring

**No further configuration needed!** 🚀

Watch the FPS Monitor in top-right corner and enjoy silky smooth performance.
