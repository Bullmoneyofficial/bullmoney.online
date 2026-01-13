# Mobile Crash Fixes - In-App Browser Compatibility

## Summary
This document describes the comprehensive fixes implemented to prevent mobile crashes in Instagram, TikTok, Safari, and other in-app browsers when scrolling or viewing the app.

## Root Causes Identified

### 1. **WebGL/3D Content Overload**
In-app browsers (Instagram, TikTok, Facebook) have severely limited WebGL memory (~50-100MB vs 500MB+ in Safari/Chrome). Spline 3D scenes were causing immediate crashes.

### 2. **WebSocket Connection Failures**
In-app browsers often block or fail to handle WebSocket connections properly, causing uncaught errors that could crash the app.

### 3. **AudioContext Restrictions**
Many in-app browsers have strict audio policies that cause crashes when AudioContext is created without user interaction.

### 4. **GSAP Ticker Overhead**
Continuous GSAP ticker animations consume significant memory and CPU, causing performance issues on memory-constrained browsers.

### 5. **Lenis Smooth Scroll Conflicts**
Custom scroll libraries conflict with in-app browser scroll handling, causing janky scrolling or crashes.

---

## Files Modified

### Core Detection Utility
| File | Purpose |
|------|---------|
| `lib/browserDetection.ts` | **NEW** - Comprehensive browser detection utility that identifies in-app browsers and assesses device capabilities |

### 3D/WebGL Components
| File | Changes |
|------|---------|
| `lib/spline-wrapper.js` | Added browser detection, 'disabled' tier, skip preloading for unsupported browsers |
| `components/SplineScene.tsx` | Added 'disabled' tier detection for in-app browsers |
| `components/features.tsx` | Fixed Globe component with WebGL fallback for unsupported browsers |
| `components/hero.tsx` | Added browser detection to `useDeviceInfo` hook |
| `app/page.tsx` | Added browser detection to `LazySplineContainer`, added reduced motion CSS support |

### WebSocket/Live Data Components
| File | Changes |
|------|---------|
| `components/MultiStepLoaderv2.tsx` | Added browser detection, WebSocket fallback to static prices, AudioContext protection |
| `components/MultiStepLoaderVip.tsx` | Added browser detection, WebSocket fallback, error handling |
| `components/MultiStepLoaderAffiliate.tsx` | Added browser detection, WebSocket fallback, error handling |
| `components/MultiStepLoader.tsx` | Added browser detection, WebSocket fallback, error handling |
| `components/Mainpage/LiveMiniPreview.tsx` | Added browser detection, fallback to price simulation |
| `app/hooks/use-binance.ts` | Added browser detection, static fallback for in-app browsers |

### Animation/Cursor Components
| File | Changes |
|------|---------|
| `components/ClientCursor.tsx` | Disabled on in-app browsers and low-memory mobile devices |
| `components/REGISTER USERS/pageVip.tsx` | Added browser detection to disable GSAP cursor on in-app browsers |

### Scroll/Performance Components
| File | Changes |
|------|---------|
| `lib/smoothScroll.tsx` | Added in-app browser detection, disabled Lenis on in-app browsers and mobile |
| `lib/smartLoading.ts` | Added in-app browser detection, 'disabled' quality tier |
| `components/PerformanceProvider.tsx` | Added in-app browser detection, skip Lenis initialization |

### Audio Components
| File | Changes |
|------|---------|
| `app/hooks/useSoundEffects.ts` | Added browser detection, skip AudioContext for in-app browsers |

---

## Browser Detection Features

The `lib/browserDetection.ts` utility detects:

### In-App Browsers
- Instagram WebView
- TikTok WebView  
- Facebook WebView
- Twitter WebView
- Snapchat WebView
- LinkedIn WebView
- Pinterest WebView
- Line WebView
- WeChat WebView

### Capability Flags
- `canHandle3D` - Can render WebGL/3D content
- `canHandleWebSocket` - Can use WebSocket connections
- `canHandleAudio` - Can use AudioContext
- `canHandleWebGL` - Can render WebGL

### Device Detection
- Low memory mobile devices (< 3GB)
- Small screens (< 480px)
- Standard mobile vs desktop

---

## Fallback Behaviors

### 3D Content
- In-app browsers see a styled fallback card with BullMoney logo
- Animated shimmer border and pulse effects (CSS-only, no WebGL)
- "3D View - Optimized for your device" message

### Live Prices
- Static fallback prices: BTC: $67,500, ETH: $3,450, SOL: $145
- Price simulation for non-crypto assets
- Graceful degradation on WebSocket failure

### Audio
- Sound effects completely disabled on in-app browsers
- No AudioContext creation to prevent crashes

### Animations
- CSS animations respect `prefers-reduced-motion`
- Animation durations doubled on mobile (saves battery)
- GSAP cursors disabled on in-app browsers
- Smooth scroll falls back to native scroll

---

## CSS Optimizations Added

```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .page-shimmer-ltr,
  .page-spin,
  .page-pulse-glow,
  .page-dot-pulse,
  .page-float {
    animation: none;
  }
}

/* Reduce animations on mobile to save battery and prevent jank */
@media (max-width: 768px) {
  .page-shimmer-ltr { animation-duration: 6s; }
  .page-spin { animation-duration: 8s; }
}
```

---

## Testing Recommendations

1. **Instagram WebView** - Open link in Instagram bio or DM
2. **TikTok WebView** - Open link from TikTok bio
3. **Facebook WebView** - Share link in Messenger
4. **Safari iOS** - Standard browser testing
5. **Chrome Android** - Standard browser testing
6. **Low-memory devices** - Test on devices with 2-3GB RAM

---

## Console Logging

All browser detection logs to console for debugging:
- `[LazySpline] Disabled for: Instagram`
- `[Spline] Skipping preload - browser cannot handle 3D`
- `[ClientCursor] Disabled for in-app browser`
- `[SoundEffects] Disabled for: TikTok`
- `[LivePrice] WebSocket disabled for: Facebook`

---

## Version
- Created: 2025
- Last Updated: Session Date
