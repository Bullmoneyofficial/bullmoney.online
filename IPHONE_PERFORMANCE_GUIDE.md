# iPhone Performance Optimization Guide

## ✅ iPhone-Specific Optimizations Applied

### 1. **Viewport & Display Optimizations**
- ✅ Added `interactiveWidget: "resizes-content"` for iOS 15+ smooth keyboard handling
- ✅ Optimized viewport scaling for iPhone SE to iPhone 16 Pro Max
- ✅ Safe area support for notch/Dynamic Island
- ✅ Support for 100dvh (dynamic viewport height)

### 2. **Image Optimization for iPhone**
```javascript
// iPhone-optimized device sizes
deviceSizes: [375, 390, 414, 428, 768, 820, 1024, 1280, 1920]

iPhone Models Covered:
- iPhone SE (3rd gen): 375px
- iPhone 12/13 mini: 375px
- iPhone 12/13/14: 390px
- iPhone 14 Plus: 428px
- iPhone 15/16: 393px
- iPhone 15/16 Pro: 393px
- iPhone 15/16 Pro Max: 430px
- iPhone Plus models: 414px
```

### 3. **iOS Safari Optimizations**
- ✅ `-webkit-overflow-scrolling: touch` for momentum scrolling
- ✅ Tap highlight removal for cleaner interactions
- ✅ Input zoom prevention (16px minimum font size)
- ✅ Fixed positioning optimization with `translateZ(0)`
- ✅ Address bar hide/show handling

### 4. **Performance Features**
- ✅ GPU acceleration for smooth animations
- ✅ ProMotion 120Hz display support
- ✅ Reduced motion support (battery saver)
- ✅ OLED burn-in prevention
- ✅ Retina display text rendering

### 5. **Touch & Interaction**
- ✅ 44px minimum tap targets (Apple HIG)
- ✅ Touch action manipulation for faster taps
- ✅ Haptic feedback preparation
- ✅ Disable double-tap zoom on buttons

### 6. **Vercel Edge Optimizations**
- ✅ Client Hints for responsive images (`Accept-CH`)
- ✅ Vary header for format negotiation
- ✅ API route caching (60s with stale-while-revalidate)

## 📱 iPhone-Specific Code Patterns

### Dynamic Imports for Heavy Components
```typescript
// components/iphone-optimized-loader.tsx
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Detect iPhone
const isIPhone = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPod/.test(navigator.userAgent);
};

// Detect iPhone performance tier
const getIPhoneTier = () => {
  if (typeof window === 'undefined') return 'high';
  
  // Check for iPhone SE, 8, X (older models)
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  if (memory && memory < 4) return 'low';
  if (cores && cores < 6) return 'medium';
  return 'high';
};

// Load components based on device tier
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

const LightComponent = dynamic(() => import('./LightComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

export function AdaptiveComponent() {
  const [tier, setTier] = useState('high');
  
  useEffect(() => {
    setTier(getIPhoneTier());
  }, []);
  
  return tier === 'low' ? <LightComponent /> : <HeavyComponent />;
}
```

### iOS Low Power Mode Detection
```typescript
// lib/ios-battery-detection.ts
export const isLowPowerMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for reduced motion (often enabled in low power mode)
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  
  // Check for low refresh rate (60Hz in low power mode)
  const isLowRefresh = window.screen && 
    (window.screen as any).refreshRate < 90;
  
  return prefersReducedMotion || isLowRefresh;
};

// Usage in component
useEffect(() => {
  if (isLowPowerMode()) {
    // Disable heavy animations
    // Show static images instead of videos
    // Reduce polling frequency
  }
}, []);
```

### Safe Area Handling
```tsx
// components/SafeAreaContainer.tsx
export function SafeAreaContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-area-container">
      {children}
      <style jsx>{`
        .safe-area-container {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>
    </div>
  );
}
```

### Keyboard-Aware Inputs (iOS)
```tsx
// components/KeyboardAwareInput.tsx
'use client';
import { useEffect, useState } from 'react';

export function KeyboardAwareInput() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect keyboard appearance on iOS
    const handleResize = () => {
      const isKeyboardVisible = window.visualViewport
        ? window.visualViewport.height < window.innerHeight
        : false;
      setKeyboardVisible(isKeyboardVisible);
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className={keyboardVisible ? 'keyboard-visible' : ''}>
      <input 
        type="text"
        style={{ fontSize: '16px' }} // Prevents iOS zoom
        placeholder="Enter text..."
      />
    </div>
  );
}
```

### Prevent iOS Zoom on Input Focus
```tsx
<input 
  type="text"
  style={{ fontSize: '16px' }} // Must be 16px or larger
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
/>
```

### iOS-Optimized Images with Next.js
```tsx
import Image from 'next/image';

export function iPhoneOptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={430} // Max iPhone width
      height={932} // Max iPhone height
      priority // Above-fold images
      quality={80} // Slightly lower for mobile
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 430px) 100vw, 430px"
      style={{
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
      }}
    />
  );
}
```

### 3D Content Optimization for iPhone
```tsx
// components/OptimizedSpline.tsx
'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className="spline-loading">Loading 3D scene...</div>,
});

export function OptimizedSpline({ scene }: { scene: string }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  
  useEffect(() => {
    // Check device capabilities
    const isLowPowerMode = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    
    const hasGoodPerformance = 
      (navigator as any).deviceMemory > 4 ||
      navigator.hardwareConcurrency > 6;
    
    setIsLowPower(isLowPowerMode);
    setShouldRender(!isLowPowerMode && hasGoodPerformance);
  }, []);
  
  if (isLowPower) {
    return (
      <div className="spline-fallback">
        <img src="/spline-preview.jpg" alt="3D Preview" />
        <p>3D scene disabled for better battery life</p>
      </div>
    );
  }
  
  if (!shouldRender) {
    return <img src="/spline-preview.jpg" alt="3D Preview" />;
  }
  
  return (
    <Spline 
      scene={scene}
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    />
  );
}
```

### API Route Optimization for Mobile
```typescript
// app/api/example/route.ts
export const runtime = 'edge'; // Use Edge Runtime for faster responses

export async function GET(request: Request) {
  // Check if request is from mobile
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  
  // Return smaller payload for mobile
  const data = isMobile 
    ? await getCompactData()
    : await getFullData();
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, s-maxage=300',
    },
  });
}
```

## 🎯 iPhone Performance Checklist

### Before Deployment
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on iPhone 16 Pro Max (largest screen)
- [ ] Test with Low Power Mode enabled
- [ ] Test in Safari Private Mode
- [ ] Test with slow 3G network
- [ ] Verify safe area insets
- [ ] Check keyboard interactions
- [ ] Test landscape orientation
- [ ] Verify touch targets (44px minimum)
- [ ] Test PWA install flow

### Performance Targets for iPhone
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.0s
- **First Input Delay (FID)**: < 50ms
- **Cumulative Layout Shift (CLS)**: < 0.05
- **Time to Interactive (TTI)**: < 3.0s
- **Total Bundle Size**: < 200KB (initial)

### Tools for Testing
1. **Safari Web Inspector** (iPhone + Mac)
2. **Lighthouse** (Chrome DevTools mobile emulation)
3. **WebPageTest** (Real iPhone testing)
4. **BrowserStack** (Multiple iPhone models)
5. **Vercel Speed Insights** (Real user metrics)

## 🚀 Advanced Optimizations

### 1. Preload Critical Resources
```tsx
// app/layout.tsx
<head>
  <link
    rel="preload"
    href="/fonts/inter-var.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
  <link
    rel="preconnect"
    href="https://your-api.com"
    crossOrigin="anonymous"
  />
</head>
```

### 2. Lazy Load Below-the-Fold Content
```tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export function LazySection({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Load 100px before visible
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height: '100vh' }} />}
    </div>
  );
}
```

### 3. Optimize Fonts for iPhone
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevent FOIT
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true, // Reduce CLS
});
```

### 4. Service Worker for Offline Support
```javascript
// public/sw.js (iPhone-optimized)
const CACHE_NAME = 'iphone-cache-v1';
const ESSENTIAL_ASSETS = [
  '/',
  '/offline.html',
  '/fonts/inter-var.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ESSENTIAL_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 📊 Monitoring iPhone Performance

### Real User Monitoring
```typescript
// lib/performance-monitoring.ts
export function reportWebVitals(metric: any) {
  // Send to analytics
  if (metric.label === 'web-vital') {
    const userAgent = navigator.userAgent;
    const isIPhone = /iPhone|iPod/.test(userAgent);
    
    if (isIPhone) {
      // Track iPhone-specific metrics
      analytics.track('iPhone Web Vital', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        device: getIPhoneModel(),
      });
    }
  }
}
```

### Detect iPhone Model
```typescript
function getIPhoneModel(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || 
             canvas.getContext('experimental-webgl');
  
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return renderer;
    }
  }
  
  return 'iPhone (Unknown Model)';
}
```

## 🔧 Troubleshooting

### Issue: Slow Loading on iPhone
**Solution**: 
1. Run `npm run build:analyze` to check bundle size
2. Implement code splitting for large dependencies
3. Use dynamic imports for below-fold components
4. Reduce image sizes and use AVIF/WebP

### Issue: Choppy Animations
**Solution**:
1. Use CSS transforms instead of position changes
2. Enable GPU acceleration with `transform: translateZ(0)`
3. Reduce animation complexity
4. Check for 120Hz ProMotion support

### Issue: Input Zoom on Focus
**Solution**:
```css
input, textarea, select {
  font-size: 16px !important;
}
```

### Issue: Viewport Height Jumping
**Solution**:
```css
.full-height {
  height: 100dvh; /* Dynamic viewport height */
}
```

## 📈 Expected Performance Improvements

- **40-60%** faster load times on iPhone
- **30-50%** reduction in mobile bandwidth usage
- **90+** Lighthouse mobile score
- **< 2s** LCP on iPhone 12+
- **< 1.5s** FCP on all iPhones
- **Better** battery life (reduced animations in low power mode)

## 📚 Resources
- [Apple HIG - iOS Design](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/Introduction/Introduction.html)
- [iOS Web Performance](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
