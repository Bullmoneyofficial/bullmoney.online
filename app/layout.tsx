import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/performance-optimizations.css";
import "../styles/gpu-animations.css";
import "../styles/120hz-performance.css"; // Critical 120Hz optimizations
import "../styles/device-tier-optimizations.css"; // Device-tier aware CSS
import "../styles/safari-optimizations.css"; // Safari-specific fixes
import "../styles/no-spin.css"; // Disable rotation-based spin animations
import "../styles/fps-optimization.css"; // FPS optimization & frame skipping
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/context/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StudioProvider } from "@/context/StudioContext";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsProvider";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { RecruitAuthProvider } from "@/contexts/RecruitAuthContext";

// ✅ ADDED: Import the ShopProvider
import { ShopProvider } from "@/components/ShopContext";

// ✅ LAZY LOADED: All performance providers bundled in client wrapper
import { ClientProviders, Footer } from "@/components/ClientProviders";

// ✅ ADDED: Import the Unified Shimmer Styles Provider
import { ShimmerStylesProvider } from "@/components/ui/UnifiedShimmer";

// ✅ ADDED: Import the Cache Manager Provider for version-based cache invalidation
import { CacheManagerProvider } from "@/components/CacheManagerProvider";

// Navigation component
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.bullmoney.shop"
  ),
  title: "BullMoney | Elite Trading Community",
  description:
    "Join BullMoney - the premier trading community for Crypto, Stocks, Forex, and Metals. Get expert trading setups, connect with traders, and master the markets in real-time. Your path to trading success starts here.",
  icons: {
    icon: "/BULL.svg",
  },
  openGraph: {
    title: "BullMoney | Elite Trading Community",
    description:
      "Join BullMoney - the premier trading community for Crypto, Stocks, Forex, and Metals. Get expert trading setups, connect with traders, and master the markets in real-time. Your path to trading success starts here.",
    url: "https://www.bullmoney.shop/",
    siteName: "BullMoney",
    images: [
      {
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney - Elite Trading Community",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BullMoney | Elite Trading Community",
    description:
      "Join BullMoney - the premier trading community for Crypto, Stocks, Forex, and Metals. Get expert trading setups, connect with traders, and master the markets in real-time.",
    images: ["/BULL.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const swEnabled = process.env.NODE_ENV === "production";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Safari detection and fixes - must run before anything else */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // Safari Detection and Early Fixes
  var ua = navigator.userAgent;
  var isSafari = /^((?!chrome|android|crios|fxios|opera|opr|edge|edg).)*safari/i.test(ua);
  var isIOS = /iphone|ipad|ipod/i.test(ua);
  var isIOSSafari = isIOS && isSafari;
  
  if (isSafari || isIOS) {
    // Add Safari classes immediately for CSS fixes
    document.documentElement.classList.add('is-safari');
    if (isIOS) document.documentElement.classList.add('is-ios-safari');
    
    // Fix iOS Safari viewport height
    var setVH = function() {
      document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
      document.documentElement.style.setProperty('--svh', (window.innerHeight * 0.01) + 'px');
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Safari-specific font smoothing
    document.documentElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
    
    console.log('[SafariFix] Safari detected, early fixes applied');
  }
  
  // EARLY THEME APPLICATION - Apply saved theme BEFORE React hydrates
  // This prevents flash of default blue before theme loads
  try {
    var savedTheme = localStorage.getItem('bullmoney-theme-data');
    if (savedTheme) {
      var themeData = JSON.parse(savedTheme);
      if (themeData && themeData.accentColor) {
        var hex = themeData.accentColor.replace('#', '');
        var r = parseInt(hex.substring(0, 2), 16) || 59;
        var g = parseInt(hex.substring(2, 4), 16) || 130;
        var b = parseInt(hex.substring(4, 6), 16) || 246;
        
        // Set CSS variables immediately
        document.documentElement.style.setProperty('--accent-color', themeData.accentColor);
        document.documentElement.style.setProperty('--accent-rgb', r + ', ' + g + ', ' + b);
        document.documentElement.setAttribute('data-active-theme', themeData.id || 't01');
        document.documentElement.setAttribute('data-theme-category', themeData.category || 'SPECIAL');
        
        console.log('[EarlyTheme] Applied:', themeData.id, themeData.accentColor);
      }
    } else {
      // Set default theme attribute so CSS selectors work
      document.documentElement.setAttribute('data-active-theme', 't01');
    }
  } catch (e) {
    // Set default on error
    document.documentElement.setAttribute('data-active-theme', 't01');
    console.warn('[EarlyTheme] Error:', e);
  }
})();
            `,
          }}
        />
        {/* CRITICAL: Auto-refresh on stale cache - runs BEFORE any other JS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // App version for cache invalidation - MUST MATCH lib/appVersion.ts
  var APP_VERSION = '3.0.0';
  var storedVersion = localStorage.getItem('bullmoney_app_version');
  
  // Force cache clear on version mismatch
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[CacheBuster] Version mismatch:', storedVersion, '->', APP_VERSION);
    
    // Clear everything
    if ('caches' in window) {
      caches.keys().then(function(names) {
        names.forEach(function(name) { caches.delete(name); });
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
      });
    }
    
    // Clear storage except the version key
    var keysToKeep = ['bullmoney_app_version'];
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (key && key.startsWith('bullmoney') && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }
    
    // Set new version and reload
    localStorage.setItem('bullmoney_app_version', APP_VERSION);
    
    if (!sessionStorage.getItem('_bm_version_reloaded')) {
      sessionStorage.setItem('_bm_version_reloaded', '1');
      window.location.reload();
      return;
    }
  }
  
  // Track failed chunk loads
  var failedLoads = 0;
  var hasReloaded = sessionStorage.getItem('_bm_reloaded');

  // Listen for resource load errors (404s on JS/CSS files)
  window.addEventListener('error', function(e) {
    var target = e.target || e.srcElement;
    if (target && target.tagName) {
      var tag = target.tagName.toLowerCase();
      var src = target.src || target.href || '';

      // Check if it's a Next.js chunk or CSS file that failed to load
      if ((tag === 'script' || tag === 'link') &&
          (src.includes('/_next/static/') || src.includes('.js') || src.includes('.css'))) {
        failedLoads++;
        console.error('[CacheBuster] Asset failed to load:', src);

        // If we haven't already reloaded this session and we have failures (reduced threshold for Safari)
        var isSafari = document.documentElement.classList.contains('is-safari');
        var threshold = isSafari ? 1 : 2;
        
        if (!hasReloaded && failedLoads >= threshold) {
          console.log('[CacheBuster] Stale cache detected, clearing and reloading...');

          // Mark that we're reloading to prevent infinite loops
          sessionStorage.setItem('_bm_reloaded', '1');

          // Clear caches
          if ('caches' in window) {
            caches.keys().then(function(names) {
              names.forEach(function(name) { caches.delete(name); });
            });
          }

          // Unregister service workers
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(r) { r.unregister(); });
            });
          }

          // Clear localStorage build ID to force fresh state
          try { localStorage.removeItem('bullmoney_build_id'); } catch(e) {}

          // Force hard reload (bypass cache)
          setTimeout(function() {
            window.location.href = window.location.href.split('?')[0] + '?_cache_bust=' + Date.now();
          }, 100);
        }
      }
    }
  }, true);

  // Clear the reload flag after successful load
  window.addEventListener('load', function() {
    setTimeout(function() {
      sessionStorage.removeItem('_bm_reloaded');
    }, 5000);
  });
})();
            `,
          }}
        />

        {/* Mobile-Specific Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BullMoney" />
        <meta name="application-name" content="BullMoney" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />

        {/* PERFORMANCE: Preconnect to critical origins */}
        <link rel="preconnect" href="https://www.youtube.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for secondary resources */}
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* PERFORMANCE: Preload critical assets with proper priorities */}
        <link rel="preload" href="/BULL.svg" as="image" fetchPriority="high" />
        
        {/* ULTRA-FAST: Preload hero Spline scene for 200ms load target */}
        <link rel="preload" href="/scene1.splinecode" as="fetch" crossOrigin="anonymous" fetchPriority="high" />

        {/* Prefetch Spline scenes with lower priority - load on demand */}
        <link rel="prefetch" href="/scene3.splinecode" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/scene4.splinecode" as="fetch" crossOrigin="anonymous" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />

        {/* Apple Touch Icons for various sizes */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icon-57x57.png" />

        {/* Splash Screens for iOS */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash-screens/iPhone_11__iPhone_XR_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash-screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash-screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png" />

        {/* Favicon for various platforms */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        <link rel="shortcut icon" href="/BULL.svg" />

        {/* Service Worker & Performance Scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ULTRA-FAST: Preload Spline runtime by triggering dynamic import early
              (function preloadSpline() {
                // Prefetch the hero scene immediately
                const sceneLink = document.createElement('link');
                sceneLink.rel = 'preload';
                sceneLink.href = '/scene1.splinecode';
                sceneLink.as = 'fetch';
                sceneLink.crossOrigin = 'anonymous';
                document.head.appendChild(sceneLink);
                
                console.log('⚡ Spline scene preload initiated');
              })();
              
              // 120Hz Display Detection & Optimization - Ultra Mode
              (function detect120Hz() {
                const root = document.documentElement;
                let nativeHz = 60;
                let measured = false;
                
                // Modern Screen API (Chrome 110+)
                if ('refreshRate' in screen) {
                  nativeHz = Math.min(screen.refreshRate, 120);
                  measured = true;
                }
                
                // Detect ProMotion & high-refresh devices via UA + screen
                if (!measured) {
                  const ua = navigator.userAgent.toLowerCase();
                  const w = screen.width;
                  const h = screen.height;
                  const dpr = window.devicePixelRatio;
                  const cores = navigator.hardwareConcurrency || 4;
                  const memory = navigator.deviceMemory || 8;
                  
                  // iPhone Pro (13/14/15/16 Pro/Pro Max)
                  if (/iphone/.test(ua) && dpr >= 3) {
                    if (w === 393 || w === 430 || w === 390 || w === 428 || w === 402 || w === 440 || h >= 844) {
                      nativeHz = 120;
                    }
                  }
                  // iPad Pro (all support ProMotion)
                  else if (/ipad/.test(ua) && dpr >= 2 && w >= 1024) {
                    nativeHz = 120;
                  }
                  // ENHANCED: Apple Silicon Mac detection (M1, M2, M3, M4+)
                  else if (/macintosh|mac os x/i.test(ua)) {
                    // Check for Apple Silicon via high core count or WebGL
                    let isAppleSilicon = cores >= 8;
                    try {
                      const canvas = document.createElement('canvas');
                      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
                      if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                          if (renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer))) {
                            isAppleSilicon = true;
                            root.classList.add('apple-silicon');
                            console.log('🍎 Apple Silicon Mac detected:', renderer);
                          }
                        }
                      }
                    } catch (e) {}
                    
                    if (isAppleSilicon) {
                      nativeHz = 120; // ProMotion on MacBook Pro 14"/16"
                      root.classList.add('desktop-optimized', 'high-performance');
                    }
                  }
                  // Samsung Galaxy S/Note/Ultra
                  else if (/samsung|sm-g|sm-n|sm-s/i.test(ua) && dpr >= 2.5) {
                    nativeHz = 120;
                  }
                  // OnePlus, Xiaomi, high-end Android
                  else if (/oneplus|xiaomi|redmi|poco|oppo|realme|vivo/i.test(ua) && dpr >= 2.5) {
                    nativeHz = 120;
                  }
                  // Google Pixel Pro (90Hz+)
                  else if (/pixel.*pro/i.test(ua)) {
                    nativeHz = 90;
                  }
                  // ENHANCED: High-spec Windows/Linux desktops
                  else if (!(/mobi|android|iphone|ipad/i.test(ua))) {
                    // Check for discrete GPU
                    let hasDiscreteGPU = false;
                    try {
                      const canvas = document.createElement('canvas');
                      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
                      if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                          hasDiscreteGPU = renderer.includes('nvidia') || renderer.includes('geforce') || 
                                           renderer.includes('radeon') || renderer.includes('amd') ||
                                           renderer.includes('rtx') || renderer.includes('gtx');
                          if (hasDiscreteGPU) {
                            root.classList.add('discrete-gpu');
                          }
                        }
                      }
                    } catch (e) {}
                    
                    // High-spec desktop with likely high-refresh monitor
                    if (w >= 2560 || (hasDiscreteGPU && memory >= 8) || (memory >= 16 && cores >= 8)) {
                      nativeHz = 120;
                      root.classList.add('desktop-optimized', 'high-performance');
                      console.log('🖥️ High-performance desktop detected');
                    }
                  }
                }
                
                // Measure actual FPS capability
                let frames = 0, startTime = performance.now();
                function measureFps(timestamp) {
                  frames++;
                  if (frames < 20) {
                    requestAnimationFrame(measureFps);
                  } else {
                    const elapsed = timestamp - startTime;
                    const fps = Math.round((frames / elapsed) * 1000);
                    const actualHz = fps >= 110 ? 120 : fps >= 80 ? 90 : 60;
                    const finalHz = Math.min(nativeHz, actualHz);
                    
                    root.style.setProperty('--measured-fps', actualHz);
                    root.style.setProperty('--actual-target-fps', finalHz);
                    
                    if (actualHz >= 110) {
                      root.classList.add('fps-120');
                      console.log('⚡ 120Hz CONFIRMED: ' + fps + 'fps measured');
                    } else if (actualHz >= 80) {
                      root.classList.add('fps-90');
                      console.log('⚡ 90Hz CONFIRMED: ' + fps + 'fps measured');
                    }
                  }
                }
                requestAnimationFrame(measureFps);
                
                const targetHz = Math.min(nativeHz, 120);
                root.style.setProperty('--native-refresh-rate', nativeHz);
                root.style.setProperty('--target-fps', targetHz);
                root.style.setProperty('--frame-duration', (1000 / targetHz) + 'ms');
                root.style.setProperty('--frame-budget', (1000 / targetHz * 0.9) + 'ms');
                
                if (nativeHz >= 120) root.classList.add('display-120hz');
                else if (nativeHz >= 90) root.classList.add('display-90hz');
                
                console.log('🖥️ Display: ' + nativeHz + 'Hz detected, targeting ' + targetHz + 'fps');
              })();
              
              // Service Worker Registration
              const __BM_SW_ENABLED__ = ${swEnabled ? "true" : "false"};
              if (__BM_SW_ENABLED__ && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(reg => console.log('[SW] Registered:', reg.scope))
                    .catch(e => console.error('[SW] Failed:', e));
                });
              }

              // Viewport Height Fix for Mobile Browsers
              function setVH() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);

              // SIMPLIFIED: Only prevent pull-to-refresh at very top of page
              // All other scrolling is allowed by default
              let touchStartY = 0;
              
              document.addEventListener('touchstart', function(e) {
                touchStartY = e.touches[0].clientY;
              }, { passive: true });

              document.addEventListener('touchmove', function(e) {
                // Always allow multi-touch gestures (pinch zoom)
                if (e.touches.length > 1) return;
                
                const touchY = e.touches[0].clientY;
                const deltaY = touchY - touchStartY;
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Only prevent default at the very top when pulling down (refresh gesture)
                // This prevents accidental pull-to-refresh but allows all normal scrolling
                if (scrollTop <= 0 && deltaY > 10) {
                  // Check if we're in a modal or fixed overlay that should block
                  const target = e.target;
                  const isInModal = target && target.closest && target.closest('.fixed[style*="z-index"]');
                  if (!isInModal) {
                    e.preventDefault();
                  }
                }
              }, { passive: false });

              // Performance Monitoring
              if ('PerformanceObserver' in window) {
                try {
                  // First Contentful Paint
                  const fcpObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      if (entry.name === 'first-contentful-paint') {
                        console.log('[Perf] FCP:', Math.round(entry.startTime) + 'ms');
                      }
                    }
                  });
                  fcpObserver.observe({ entryTypes: ['paint'] });

                  // Largest Contentful Paint
                  const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('[Perf] LCP:', Math.round(lastEntry.startTime) + 'ms');
                  });
                  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                  // First Input Delay
                  const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      const fid = entry.processingStart - entry.startTime;
                      console.log('[Perf] FID:', Math.round(fid) + 'ms');
                    }
                  });
                  fidObserver.observe({ entryTypes: ['first-input'] });

                  // Cumulative Layout Shift
                  let clsScore = 0;
                  const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      if (!entry.hadRecentInput) {
                        clsScore += entry.value;
                      }
                    }
                  });
                  clsObserver.observe({ entryTypes: ['layout-shift'] });

                  // Log final CLS on page hide
                  window.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') {
                      console.log('[Perf] CLS:', clsScore.toFixed(4));
                    }
                  });
                } catch (e) {
                  console.log('[Perf] Monitoring failed:', e);
                }
              }

              // Install Prompt Handling
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                console.log('[PWA] Install prompt available');
                // Dispatch custom event for React to handle
                window.dispatchEvent(new CustomEvent('pwa-install-available'));
              });

              window.addEventListener('appinstalled', () => {
                console.log('[PWA] App installed');
                deferredPrompt = null;
              });

              // Expose install prompt method
              window.showInstallPrompt = function() {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then((choiceResult) => {
                    console.log('[PWA] User choice:', choiceResult.outcome);
                    deferredPrompt = null;
                  });
                }
              };
            `,
          }}
        />
      </head>
      <body
        className={cn("antialiased dark:bg-black bg-white", inter.className)}
        suppressHydrationWarning
      >
        {/* Global Shimmer Styles - ensures all shimmers are synchronized */}
        <ShimmerStylesProvider />
        <ErrorBoundary>
          {/* Cache Manager - Handles version-based cache invalidation */}
          <CacheManagerProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <GlobalThemeProvider>
              <MobileMenuProvider>
                <RecruitAuthProvider>
                  <AudioSettingsProvider>
                    <StudioProvider>
                      {/* ✅ ADDED: ShopProvider starts here */}
                      <ShopProvider>
                        {/* Navbar rendered outside ClientProviders for fixed positioning */}
                        <Navbar />
                        {/* ✅ LAZY LOADED: All performance providers bundled */}
                        <ClientProviders modal={modal}>
                          {children}
                        </ClientProviders>
                      </ShopProvider>
                      {/* ✅ ADDED: ShopProvider ends here */}
                    </StudioProvider>
                  </AudioSettingsProvider>
                </RecruitAuthProvider>
              </MobileMenuProvider>
            </GlobalThemeProvider>
          </ThemeProvider>
          </CacheManagerProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
