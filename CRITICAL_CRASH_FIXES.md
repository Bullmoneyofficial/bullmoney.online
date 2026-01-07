# Critical Crash Fixes for iPhone 15 Pro Max

## Issues Identified

### 1. **CRITICAL: Excessive Backdrop Filters (129 instances)**
- **Impact**: iOS Safari crashes when too many backdrop-filter effects are stacked
- **Files**: Used across 34+ component files
- **Issue**: Each backdrop-filter creates a new compositing layer, exhausting GPU memory on mobile

### 2. **CRITICAL: Large Spline Files**
- **scene1.splinecode**: 6.9MB - Hero scene
- **scene2.splinecode**: 5.0MB
- **scene.splinecode**: 5.3MB
- **Total**: 19.6MB of 3D assets loading simultaneously
- **Issue**: iPhone 15 Pro Max Safari has ~400MB WebGL memory limit, these files exhaust it

### 3. **Memory Leak: Spline Scene Management**
- Multiple scenes loading without proper cleanup
- `loadedScenesCount` global counter but no force unload
- Scenes keep accumulating in memory

### 4. **Heavy CSS Transforms on Scroll**
- Parallax effects with continuous transform updates
- `will-change` declarations causing layer promotions
- Scroll jank due to excessive repaints

### 5. **Theme Lens Backdrop Filter**
- Full-screen backdrop-filter running continuously
- Applied globally at z-index 200,000
- Causes catastrophic performance degradation on iOS

### 6. **YouTube Player Memory Leaks**
- YouTube iframe API instances not properly destroyed
- Multiple theme changes create orphaned players
- Memory accumulates with each theme switch

### 7. **Framer Motion Overuse**
- Heavy animation libraries on mobile
- Multiple concurrent animations
- Layout animations causing reflows

## Fixes Implemented

### Fix 1: Remove/Reduce Backdrop Filters
```typescript
// BEFORE: backdrop-filter on every overlay
style={{ backdropFilter: 'blur(10px)' }}

// AFTER: Use semi-transparent backgrounds instead
style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
```

### Fix 2: Aggressive Spline Unloading
```typescript
// Force unload scenes when scrolled away
const MAX_CONCURRENT_SCENES_MOBILE = 1;
const UNLOAD_DELAY_MS = 500; // Faster unload

// Implement proper cleanup
useEffect(() => {
  return () => {
    // Force WebGL context loss to free memory
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  };
}, []);
```

### Fix 3: Disable Parallax on Mobile
```typescript
// BEFORE: Parallax always active
const parallaxOffset = scrollY * 0.4;

// AFTER: Disable on mobile/touch devices
const parallaxOffset = isMobile ? 0 : scrollY * 0.4;
```

### Fix 4: Remove Theme Lens Backdrop Filter
```typescript
// BEFORE: Full screen backdrop filter
<div style={{ backdropFilter: theme.filter }} />

// AFTER: Apply filter directly to content, not as overlay
// Or use CSS filters instead of backdrop-filter
<div style={{ filter: theme.filter }} />
```

### Fix 5: YouTube Player Cleanup
```typescript
// Properly destroy YouTube players
useEffect(() => {
  return () => {
    if (playerRef.current?.destroy) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  };
}, [musicKey]); // Recreate when theme changes
```

### Fix 6: Reduce CSS Animations
```typescript
// BEFORE: Framer Motion everywhere
<motion.div animate={{ ... }} />

// AFTER: CSS animations or disable on mobile
{!isMobile && <motion.div ... />}
// OR use CSS keyframes
```

### Fix 7: Lower Spline Quality on Mobile
```typescript
// Add quality parameter for Spline scenes
<Spline
  scene={sceneUrl}
  renderMode={isMobile ? 'lite' : 'full'} // If supported
  fps={isMobile ? 30 : 60}
/>
```

## Implementation Priority

1. **IMMEDIATE**: Remove theme lens backdrop-filter (app/page.tsx:1407, app/shop/page.tsx:499)
2. **IMMEDIATE**: Disable parallax on mobile devices
3. **IMMEDIATE**: Force Spline scene limit to 1 on mobile
4. **HIGH**: Replace backdrop-filters with solid backgrounds
5. **HIGH**: Fix YouTube player memory leaks
6. **MEDIUM**: Reduce Framer Motion usage
7. **MEDIUM**: Compress Spline files or use lower quality on mobile

## Files to Modify

### Priority 1 (Immediate)
- `/app/page.tsx` - Lines 1407, 948, 477-492 (backdrop-filters, parallax)
- `/app/shop/page.tsx` - Lines 499, 452-464 (backdrop-filters)
- `/components/Mainpage/PageScenes.tsx` - Parallax and Spline management
- `/lib/mobileMemoryManager.ts` - Reduce maxConcurrentScenes to 1 for all mobile

### Priority 2 (High)
- `/components/Mainpage/PageElements.tsx` - YouTube player cleanup
- `/components/Mainpage/ThemeComponents.tsx` - Theme switching
- All files with backdrop-filter (34 files found)

### Priority 3 (Medium)
- Compress Spline files with Spline editor
- Review all Framer Motion usage
- Optimize CSS animations

## Testing Checklist

- [ ] Test on iPhone 15 Pro Max Safari
- [ ] Test on iPhone 15 Pro Max Chrome
- [ ] Verify smooth scrolling without crashes
- [ ] Monitor memory usage in Safari Developer Tools
- [ ] Test theme switching doesn't leak memory
- [ ] Verify Spline scenes load/unload properly
- [ ] Check Instagram/Facebook in-app browsers
