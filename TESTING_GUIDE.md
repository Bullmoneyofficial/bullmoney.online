# Spline Loading - Quick Testing Guide

## 🚀 Quick Start

### 1. Open Browser Console
Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

### 2. Look for These Logs:

#### ✅ Success (Desktop):
```
[MemoryManager v2] Initialized
  maxScenes: 15
  deviceMemory: 8

[SmartSplineLoader] 🖥️ Desktop device - using high quality mode
[SmartSplineLoader] ✅ Device-specific optimizations complete
[MemoryManager] Registered scene: /scene1.splinecode (1/15)
```

#### ✅ Success (Mobile High-End):
```
[MemoryManager v2] Initialized
  isMobile: true
  maxScenes: 5

[SmartSplineLoader] 📱 Mid-range device - using balanced mode
[SmartSplineLoader] Applied balanced optimizations
```

#### ✅ Success (Mobile Low-End):
```
[MemoryManager v2] Initialized
  isMobile: true
  maxScenes: 2

[SmartSplineLoader] ⚡ Low-end device - using performance mode
[SmartSplineLoader] Applied ultra-performance optimizations
```

#### ⚠️ Memory Limited (Expected):
```
[SceneWrapper] Memory blocked for /scene5.splinecode:
  At max concurrent scenes (2)
```

#### ❌ Error (Should Retry):
```
[SmartSplineLoader] Load failed (attempt 1/3): Error
[SmartSplineLoader] Retrying in 1000ms...
```

---

## 📱 Device-Specific Tests

### iPhone/iPad:
1. Open Safari
2. Navigate to homepage
3. Hero scene should load immediately
4. Scroll through pages 1-10
5. Check: No crashes, 3D visible, smooth scrolling

### Android:
1. Open Chrome
2. Navigate to homepage
3. Hero scene should load immediately
4. Check split pages (4-6) - should show 2 scenes
5. Memory manager should limit based on RAM

### Desktop:
1. All scenes should load
2. High quality (check console)
3. Smooth 60fps
4. Multiple scenes visible simultaneously

---

## 🔍 What to Check

### Visual Checks:
- [ ] Hero scene visible immediately (no delay)
- [ ] 3D scenes render on pages 1-10
- [ ] Quality appropriate for device (check console)
- [ ] Smooth transitions between pages
- [ ] No white screens or crashes

### Console Checks:
- [ ] Memory manager initialized
- [ ] Scenes registered/unregistered properly
- [ ] Quality tier logged correctly
- [ ] No repeated errors
- [ ] Memory limits respected

### Performance Checks:
- [ ] FPS: 60fps desktop, 30fps mobile
- [ ] Memory: Stable, no leaks
- [ ] Load time: <500ms for cached scenes
- [ ] Smooth scrolling

---

## 🐛 Common Issues

### Issue: "Memory blocked" on desktop
**Fix**: Check deviceMemory in console, should be ≥4

### Issue: Hero scene doesn't load
**Check**:
1. Console for errors
2. Network tab for 404s
3. WebGL support (visit webglreport.com)

### Issue: Low quality on high-end device
**Check**:
1. Device detection in console
2. Memory/cores reported correctly
3. Connection type

### Issue: Crashes on mobile
**Check**:
1. Memory manager logs
2. How many scenes active
3. Device RAM (<2GB might still crash)

---

## ✅ Expected Behavior by Device

| Device | Quality | Max Scenes | FPS Target |
|--------|---------|------------|------------|
| Desktop 8GB+ | High | 15 | 60fps |
| Desktop 4-6GB | High | 7-10 | 60fps |
| Desktop <4GB | Medium | 5 | 45fps |
| Mobile 6GB+ | Medium-High | 5 | 30fps |
| Mobile 4GB | Medium | 4 | 30fps |
| Mobile 3GB | Medium | 3 | 24fps |
| Mobile 2GB | Low | 2 | 20fps |
| Mobile <2GB | Very Low | 2 | 15fps |

---

## 📊 Success Metrics

### Must Pass:
- ✅ Hero loads in <2s on all devices
- ✅ No crashes on mobile (success rate >95%)
- ✅ 3D visible on 80%+ of devices
- ✅ Quality auto-adjusts correctly

### Should Pass:
- ⏳ Load time <500ms (cached)
- ⏳ Smooth 30fps on mid-range mobile
- ⏳ Memory stable (<500MB on mobile)

---

## 🔧 Quick Fixes

### If splines don't load:
1. Clear cache: `Cmd+Shift+R` / `Ctrl+Shift+R`
2. Check "Disable cache" in DevTools Network tab
3. Hard refresh the page

### If quality is wrong:
1. Check `deviceProfile` object in console
2. Verify `isHighEndDevice` value
3. Check connection type

### If memory crashes persist:
1. Lower limits in `mobileMemoryManager.ts`
2. Reduce rendering distance in `PageScenes.tsx`
3. Disable post-processing for all devices

---

## 📞 Support

Issues? Check:
1. [SPLINE_LOADING_ENHANCEMENTS.md](SPLINE_LOADING_ENHANCEMENTS.md) - Full documentation
2. Browser console for error logs
3. Network tab for failed requests

---

**Quick Test Command** (in console):
```javascript
// Check device profile
console.log(window.deviceProfile);

// Check memory manager status
console.log(window.memoryManager?.getStatus());

// Check active scenes
console.log(window.memoryManager?.getActiveSceneCount());
```
