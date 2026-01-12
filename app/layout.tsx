import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/performance-optimizations.css";
import "../styles/gpu-animations.css";
import "../styles/120hz-performance.css"; // Critical 120Hz optimizations
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/context/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StudioProvider } from "@/context/StudioContext";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";

// ✅ ADDED: Import the ShopProvider
import { ShopProvider } from "@/components/ShopContext";

// ✅ ADDED: Import the Performance Provider for 120Hz optimization
import { PerformanceProvider, FPSCounter } from "@/components/PerformanceProvider";

// Navigation and Footer components
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/Mainpage/footer";

// Client-side cursor component for desktop
import ClientCursor from "@/components/ClientCursor";

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

              // Disable Pull-to-Refresh on iOS (only at edges, allow normal scrolling)
              document.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) return;
                const target = e.target;

                // Allow scrolling in marked scrollable areas
                if (target && target.closest && (
                  target.closest('[data-allow-scroll]') ||
                  target.closest('main') ||
                  target.closest('[data-scrollable]') ||
                  target.closest('.overflow-y-auto') ||
                  target.closest('.overflow-auto')
                )) {
                  return; // Allow normal scrolling
                }

                // Only prevent at the very top
                if (window.scrollY === 0) {
                  e.preventDefault();
                }
              }, { passive: false });

              // Prevent iOS Bounce Effect (only at document edges, not during normal scroll)
              let lastY = 0;
              let isScrolling = false;

              document.addEventListener('touchstart', function(e) {
                lastY = e.touches[0].clientY;
                isScrolling = false;
              }, { passive: true });

              document.addEventListener('touchmove', function(e) {
                const target = e.target;

                // Allow scrolling in scrollable containers
                if (target && target.closest && (
                  target.closest('[data-allow-scroll]') ||
                  target.closest('main') ||
                  target.closest('[data-scrollable]') ||
                  target.closest('.overflow-y-auto') ||
                  target.closest('.overflow-auto')
                )) {
                  return; // Allow normal scrolling
                }

                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight;
                const clientHeight = document.documentElement.clientHeight;
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - lastY;

                // Only prevent bounce at absolute edges
                const atTop = scrollTop <= 0;
                // More lenient bottom detection - allow for footer and safe areas
                const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
                const pullingDown = deltaY > 0;
                const pullingUp = deltaY < 0;

                // Only prevent if we're at the TOP and trying to pull down (refresh)
                // Do NOT prevent scrolling at bottom - let users scroll normally
                if (atTop && pullingDown) {
                  e.preventDefault();
                }

                lastY = currentY;
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
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <GlobalThemeProvider>
              <StudioProvider>
                {/* ✅ ADDED: ShopProvider starts here */}
                <ShopProvider>
                  {/* ✅ Performance Provider for 120Hz optimization & smooth scroll */}
                  <PerformanceProvider enableSmoothScroll={true}>
                    {/* Custom Cursor for Desktop */}
                    <ClientCursor />
                    {/* Navbar rendered outside filter wrapper to preserve fixed positioning */}
                    <Navbar />
                    {/* Theme filter wrapper - applies filter only to main content */}
                    <div 
                      className="theme-filter-wrapper min-h-screen"
                      style={{ 
                        filter: 'var(--theme-filter, none)',
                        transition: 'filter 0.5s ease-in-out'
                      }}
                    >
                      {children}
                      {modal}
                    </div>
                    <Footer />
                    {/* FPS Counter - only shows in development */}
                    <FPSCounter />
                  </PerformanceProvider>
                </ShopProvider>
                {/* ✅ ADDED: ShopProvider ends here */}
              </StudioProvider>
            </GlobalThemeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}