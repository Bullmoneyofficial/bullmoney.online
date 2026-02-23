import Script from "next/script";
// import "./styles/90-scroll-anywhere.css"; // Temporarily disabled - causing PostCSS parse errors, scroll fixes moved to inline styles
import { cn } from "@/lib/utils";
import { APP_VERSION, PRESERVED_KEYS } from "@/lib/appVersion";
import { SPLASH_MIN_MS, SPLASH_FALLBACK_MS, SPLASH_MAX_MS, SPLASH_FADE_MS } from "@/components/splashConfig";

// ✅ CUSTOM EVENT TRACKING - Removed from layout (static import pulled analytics into every page)
// Import trackEvent in individual client components that need it instead.

// ✅ PROVIDERS  single consolidated wrapper (reduces Turbopack module graph)
import { AppProviders } from "@/components/AppProviders";

// ✅ LAYOUT PROVIDERS - Client component wrapper for dynamic imports
import { LayoutProviders } from "@/components/LayoutProviders";

// ✅ PERF: GamesModalProvider + PWAInstallPrompt deferred via client boundary wrapper.
// Saves ~720 lines from the SSR compilation critical path.
// (ssr:false dynamic imports must live inside a Client Component boundary)
import { DeferredLayoutUI } from "@/components/DeferredLayoutUI";

// ✅ SPLASH SCREEN – shows on every route load/reload with pulse animation
import { SplashScreen } from "@/components/SplashScreen";



// Use system font stack with Inter as preference - avoids network dependency during build
const inter = {
  className: "font-sans",
  style: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }
};


export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const swEnabled = process.env.NODE_ENV === "production";
  const routePrefetchEnabled = process.env.NODE_ENV === "production";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Base critical CSS moved to static file to reduce SSR payload while keeping instant paint */}
        <link rel="preload" href="/styles/layout-critical.css" as="style" />
        <link rel="stylesheet" href="/styles/layout-critical.css" />
        {/* CRITICAL: Blocking init  served as static file (no Turbopack compilation cost) */}
        <Script id="splash-init" src="/scripts/splash-init.js" strategy="beforeInteractive" />
        {/* UNIVERSAL COMPATIBILITY LAYER: Polyfills + feature detection for ALL devices worldwide
            MUST load BEFORE other BMBRAIN scripts — provides Element.closest, CustomEvent, Promise,
            fetch, IntersectionObserver polyfills + safe storage for private browsing + CSS fixes
            for Samsung Internet, UC Browser, Huawei Browser, Opera Mini, MIUI Browser, etc. */}
        <Script id="compat-layer" src="/scripts/BMBRAIN/compat-layer.js" strategy="beforeInteractive" />
        {/* Lightweight deferred loader - schedules heavy scripts after idle/interaction to keep FCP clean */}
        <Script
          id="bm-defer-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if (typeof window === 'undefined') return;
                var loaded = Object.create(null);
                function inject(item){
                  if (!item || !item.src || loaded[item.id]) return;
                  loaded[item.id] = true;
                  var s = document.createElement('script');
                  s.src = item.src;
                  s.async = true;
                  s.id = item.id || '';
                  (document.head || document.documentElement).appendChild(s);
                }
                function onIdle(fn, timeout){
                  if (window.requestIdleCallback) {
                    window.requestIdleCallback(fn, { timeout: timeout || 1500 });
                  } else {
                    setTimeout(fn, timeout || 1500);
                  }
                }
                function onFirstInput(fn){
                  var fired = false;
                  var timer = setTimeout(fire, 1800);
                  function fire(){ if (fired) return; fired = true; cleanup(); fn(); }
                  function cleanup(){ clearTimeout(timer); window.removeEventListener('pointerdown', fire, true); window.removeEventListener('keydown', fire, true); window.removeEventListener('touchstart', fire, true); }
                  window.addEventListener('pointerdown', fire, true);
                  window.addEventListener('keydown', fire, true);
                  window.addEventListener('touchstart', fire, true);
                }
                window.__bmDeferLoad = function(list){
                  if (!Array.isArray(list)) return;
                  list.forEach(function(item){
                    var trigger = item && item.when ? item.when : 'idle';
                    if (trigger === 'now') return inject(item);
                    if (trigger === 'interactive') return onFirstInput(function(){ inject(item); });
                    return onIdle(function(){ inject(item); }, item && item.timeout);
                  });
                };
              })();
            `
          }}
        />
        {/* Cache validation (deferred to avoid blocking first paint) */}
        <Script
          id="cache-buster-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__BM_CACHE_BUSTER__={APP_VERSION:'${APP_VERSION}',PRESERVED_KEYS:${JSON.stringify(PRESERVED_KEYS)}};`
          }}
        />
        <Script id="cache-buster" src="/scripts/cache-buster.js" strategy="afterInteractive" />

        {/* Mobile-Specific Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BullMoney" />
        <meta name="application-name" content="BullMoney" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        
        {/* Samsung Internet specific */}
        <meta name="samsung-mobile-web-app-capable" content="yes" />
        
        {/* UC Browser specific - improves rendering */}
        <meta name="screen-orientation" content="portrait" />
        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />
        
        {/* Huawei Browser / HarmonyOS */}
        <meta name="huawei-mobile-web-app-capable" content="yes" />
        
        {/* Microsoft/Windows Phone legacy */}
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-TileColor" content="#000000" />
        
        {/* Force IE/Edge to use latest rendering engine */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Prevent auto-detection that can break layouts */}
        <meta name="format-detection" content="telephone=no,date=no,email=no,address=no" />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PERFORMANCE: Resource hints for faster loading                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Preconnect to critical origins (establishes connection early) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for third-party domains (resolves DNS early) */}
        <link rel="dns-prefetch" href="https://prod.spline.design" />
        <link rel="dns-prefetch" href="https://cdn.spline.design" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
        {/* Preload critical assets with proper priorities */}
        <link rel="preload" href="/ONcc2l601.svg" as="image" fetchPriority="high" />
        
        {/* 
          PERFORMANCE FIX: Removed all Spline scene preload/prefetch tags.
          Scene1 (6.9MB) was being preloaded with HIGH priority, competing with 
          critical JS/CSS for bandwidth. 5 other scenes (total ~13MB) were prefetched.
          Spline scenes are now loaded on-demand by the SplineBackground component
          via the Cache API system, which already handles caching efficiently.
        */}
        
        {/* Spline preloading deferred to lazyOnload  static file avoids Turbopack compile cost */}
        <Script id="spline-preload" src="/scripts/spline-preload.js" strategy="lazyOnload" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Cross-domain SEO: explicitly reference both live domains */}
        <link rel="alternate" href="https://www.bullmoney.shop" />
        <link rel="alternate" href="https://www.bullmoney.online" />
        
        {/* iOS PWA - Standalone App Mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BullMoney" />
        
        {/* Android PWA - Chrome Add to Home Screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="BullMoney" />
        
        {/* iOS Safari - Prevent auto-zoom on input focus */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Android Chrome - Disable link preview on long press */}
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />

        {/* 
          HREFLANG: Handled by Next.js Metadata API `alternates` in each layout.
          Each layout (root, store, about, products, etc.) exports its own alternates 
          via makeAlternatesMetadata()  Next.js renders these as <link rel="alternate"> 
          tags server-side. No need for a separate ServerHreflangMeta component.
        */}

        {/* Apple Touch Icon - 180x180 is all modern iOS needs */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />

        {/* Android/Chrome homescreen icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />

        {/* Splash Screens for iOS - top 3 most common sizes only */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/icon-512x512.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/icon-512x512.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/icon-512x512.png" />

        {/* Favicon for various platforms */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/icon-192x192.png" />

        {/* Service Worker & Touch  tiny inline shim sets globals, bulk logic in static file */}
        <Script
          id="sw-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__BM_SW_ENABLED__=${swEnabled};window.__BM_ENABLE_ROUTE_PREFETCH__=${routePrefetchEnabled};window.__BM_VAPID_KEY__='${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""}';window.__BM_SCRIPTS_VIA_NEXTJS__=true;`
          }}
        />
        {/* PWA install prompt capture: must run early so `beforeinstallprompt` isn't missed */}
        <Script
          id="pwa-install-capture"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try{
                  if(typeof window==='undefined') return;
                  // If perf-monitor (or another script) already installed this bridge, don't double-bind.
                  if(window.__BM_PWA_INSTALL_CAPTURED__) return;
                  window.__BM_PWA_INSTALL_CAPTURED__ = true;

                  var deferredPrompt = null;
                  window.addEventListener('beforeinstallprompt', function(e){
                    try{ e.preventDefault(); } catch(_) {}
                    deferredPrompt = e;
                    try{ window.__BM_PWA_INSTALL_AVAILABLE__ = true; } catch(_) {}
                    try{ window.dispatchEvent(new CustomEvent('pwa-install-available')); } catch(_) {}
                  });

                  window.addEventListener('appinstalled', function(){ deferredPrompt = null; });

                  // Always provide a deterministic API: returns true if we actually called prompt().
                  window.showInstallPrompt = function(){
                    try{
                      if(!deferredPrompt) return false;
                      deferredPrompt.prompt();
                      if(deferredPrompt.userChoice && typeof deferredPrompt.userChoice.then === 'function'){
                        deferredPrompt.userChoice.then(function(){ deferredPrompt = null; });
                      } else {
                        deferredPrompt = null;
                      }
                      return true;
                    } catch(_) {
                      deferredPrompt = null;
                      return false;
                    }
                  };
                } catch(_) {}
              })();
            `
          }}
        />
        <Script id="sw-and-touch" src="/scripts/sw-touch.js" strategy="afterInteractive" />

        {/* GLOBAL BRAIN ORCHESTRATOR — coordinates all BMBRAIN scripts, shared state, event bus */}
        <Script id="bmbrain-global" src="/scripts/BMBRAIN/bmbrain-global.js" strategy="afterInteractive" />

        {/* CRITICAL SCRIPTS - afterInteractive (run after page is interactive) */}
        <Script id="mobile-crash-shield" src="/scripts/BMBRAIN/mobile-crash-shield.js" strategy="afterInteractive" />
        <Script id="inapp-shield" src="/scripts/BMBRAIN/inapp-shield.js" strategy="afterInteractive" />
        <Script
          id="memory-manager-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (typeof window === 'undefined' || typeof document === 'undefined') return;
                if (window.__BM_MEMORY_MANAGER_LOADED__) return;

                var nav = navigator || {};
                var ua = String(nav.userAgent || '').toLowerCase();
                var mem = Number(nav.deviceMemory || 0);
                var cores = Number(nav.hardwareConcurrency || 0);
                var touch = Number(nav.maxTouchPoints || 0);
                var vw = window.innerWidth || 0;
                var vh = window.innerHeight || 0;

                var isIOS = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && touch > 1);
                var isIOSWebKit = isIOS && /applewebkit/.test(ua) && !/crios|fxios|edgios|opios/.test(ua);
                var isInApp = /fban|fbav|instagram|line|tiktok|telegram|wechat|wv|webview|micromessenger|gsa|snapchat|linkedinapp/.test(ua);
                var isSmallScreen = (vw > 0 && vw <= 430) || (vh > 0 && vh <= 760);
                var constrained = isIOS || isIOSWebKit || isInApp || isSmallScreen || (mem > 0 && mem <= 4) || (cores > 0 && cores <= 4);

                var inject = function () {
                  if (window.__BM_MEMORY_MANAGER_LOADED__) return;
                  window.__BM_MEMORY_MANAGER_LOADED__ = true;
                  var s = document.createElement('script');
                  s.src = '/scripts/BMBRAIN/memory-manager.js';
                  s.async = true;
                  document.head.appendChild(s);
                };

                if (constrained) {
                  inject();
                  return;
                }

                var idle = window.requestIdleCallback;
                if (typeof idle === 'function') {
                  idle(inject, { timeout: 2000 });
                } else {
                  window.addEventListener('load', function () {
                    window.setTimeout(inject, 400);
                  }, { once: true });
                }
              })();
            `,
          }}
        />

        <Script
          id="splash-failsafe"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  // Timing constants (mirrored from splashConfig.ts)
                  var FADE = ${SPLASH_FADE_MS};

                  // In-app browsers (Instagram, TikTok, Facebook, Snapchat, etc.) need
                  // longer minimums — their WKWebView/WebView can render a cached page in
                  // <200 ms, making the splash feel invisible at the default 600 ms MIN.
                  // splash-init.js already detected the UA and set this class on <html>,
                  // so we can read it directly without re-parsing the user-agent string.
                  var isInApp = !!(
                    document.documentElement.classList &&
                    document.documentElement.classList.contains('is-in-app-browser')
                  );

                  var MIN      = isInApp ? 1400 : ${SPLASH_MIN_MS};
                  var FALLBACK = isInApp ? 3000 : ${SPLASH_FALLBACK_MS};
                  var MAX      = ${SPLASH_MAX_MS};

                  var minDone    = false;
                  var splineDone = false;
                  var dismissed  = false;

                  function playDismissSound() {
                    try {
                      var AC = window.AudioContext || window.webkitAudioContext;
                      if (!AC) return;
                      var ctx = new AC();
                      var t = ctx.currentTime;
                      // Soft C-major chord (C5 + E5 + G5) — warm reveal chime
                      [[523.25, 0.13], [659.25, 0.08], [783.99, 0.05]].forEach(function(p) {
                        var osc = ctx.createOscillator();
                        var env = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = p[0];
                        env.gain.setValueAtTime(0, t);
                        env.gain.linearRampToValueAtTime(p[1], t + 0.018);
                        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
                        osc.connect(env);
                        env.connect(ctx.destination);
                        osc.start(t);
                        osc.stop(t + 0.6);
                      });
                      window.setTimeout(function(){ try { ctx.close(); } catch(e) {} }, 800);
                    } catch(e) {}
                  }

                  function dismiss() {
                    if (dismissed) return;
                    dismissed = true;
                    playDismissSound();
                    var splash = document.getElementById('bm-splash');
                    if (!splash) return;

                    // Primary: CSS keyframe animation via .bm-ready class
                    splash.classList.add('bm-ready');

                    // Fallback: direct CSS transition on opacity — guarantees the element
                    // visually fades even in WebViews where @keyframes with forwards-fill
                    // can silently no-op (seen in some WKWebView versions used by Instagram,
                    // TikTok, Facebook, Snapchat). The transition fires a few ms after the
                    // class add so both can run; whichever finishes first wins visually.
                    try {
                      if (splash.style) {
                        splash.style.transition = 'opacity ' + FADE + 'ms cubic-bezier(0.4,0,0.2,1)';
                        window.setTimeout(function(){ if (splash.style) splash.style.opacity = '0'; }, 16);
                      }
                    } catch(e) {}

                    document.documentElement.classList.add('bm-splash-done');
                    window.__BM_SPLASH_FINISHED__ = true;
                    try { window.dispatchEvent(new CustomEvent('bm-splash-finished')); } catch (e) {}

                    // Remove from DOM after animation/transition completes
                    window.setTimeout(function(){
                      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
                    }, FADE + 120);
                  }

                  // 1. Minimum display guard — avoids a flash when Spline loads instantly
                  window.setTimeout(function(){
                    minDone = true;
                    if (splineDone) dismiss();
                  }, MIN);

                  // 2. Fallback for pages WITHOUT a Spline scene (blogs, store, etc.)
                  //    Dismissed at FALLBACK ms if Spline never signals — same feel as before.
                  window.setTimeout(function(){
                    if (!splineDone) dismiss();
                  }, FALLBACK);

                  // 3. Hard cap — Spline page with very slow / failed load
                  window.setTimeout(function(){
                    dismiss();
                  }, MAX);

                  // 4. Spline signal — dispatched by WelcomeSplineBackground.handleLoad
                  //    in pagemode.tsx (mobile) and WelcomeScreenDesktop.tsx (desktop).
                  window.addEventListener('bm-spline-ready', function onSplineReady(){
                    splineDone = true;
                    if (minDone) dismiss();
                    // If minDone is still false the MIN timer above will call dismiss().
                    window.removeEventListener('bm-spline-ready', onSplineReady);
                  });

                } catch (e) {}
              })();
            `,
          }}
        />


        {/* Deferred non-critical scripts with route/idle gating to keep initial paint fast */}
        <Script
          id="bm-defer-schedule"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if (typeof window === 'undefined' || typeof window.__bmDeferLoad !== 'function') return;
                var isHome = (window.location && (window.location.pathname === '/' || window.location.pathname === ''));

                var globalScripts = [
                  { id: 'detect-120hz', src: '/scripts/detect-120hz.js', when: 'idle' },
                  { id: 'perf-monitor', src: '/scripts/perf-monitor.js', when: 'idle' },
                  { id: 'device-detect', src: '/scripts/device-detect.js', when: 'idle' },
                  { id: 'device-capabilities', src: '/scripts/BMBRAIN/device-capabilities.js', when: 'idle' },
                  { id: 'input-controller', src: '/scripts/BMBRAIN/input-controller.js', when: 'interactive' },
                  { id: 'push-manager', src: '/scripts/BMBRAIN/push-manager.js', when: 'idle' },
                  ${routePrefetchEnabled ? `{ id: 'network-optimizer', src: '/scripts/BMBRAIN/network-optimizer.js', when: 'idle' },` : ''}
                  { id: 'spline-universal', src: '/scripts/BMBRAIN/spline-universal.js', when: 'idle' },
                  { id: 'offline-detect', src: '/scripts/BMBRAIN/offline-detect.js', when: 'idle' }
                ];

                var homeScripts = [
                  { id: 'desktop-fcp-optimizer', src: '/scripts/desktop-fcp-optimizer.js', when: 'idle' },
                  { id: 'desktop-lcp-optimizer', src: '/scripts/desktop-lcp-optimizer.js', when: 'idle' },
                  { id: 'desktop-cls-prevention', src: '/scripts/desktop-cls-prevention.js', when: 'idle' },
                  { id: 'desktop-ttfb-optimizer', src: '/scripts/desktop-ttfb-optimizer.js', when: 'idle' },
                  { id: 'desktop-interaction-sounds', src: '/scripts/desktop-interaction-sounds.js', when: 'interactive' },
                  { id: 'desktop-scroll-experience', src: '/scripts/desktop-scroll-experience.js', when: 'interactive' },
                  { id: 'desktop-stability-shield', src: '/scripts/desktop-stability-shield.js', when: 'idle' },
                  { id: 'desktop-fps-boost', src: '/scripts/desktop-fps-boost.js', when: 'interactive' }
                ];

                var scriptsToLoad = globalScripts.slice();
                if (isHome) { scriptsToLoad = scriptsToLoad.concat(homeScripts); }
                window.__bmDeferLoad(scriptsToLoad);
              })();
            `
          }}
        />
      </head>
      <body
        className={cn("antialiased bg-[#050915] text-white", inter.className)}
        suppressHydrationWarning
      >
        {/* Splash screen – covers every page load on every route */}
        <SplashScreen />
        {/* All providers consolidated into AppProviders (heavy ones dynamically imported) */}
        <AppProviders>
          <LayoutProviders modal={modal}>
            {children}
            {/* GamesModalProvider + PWAInstallPrompt deferred via client boundary */}
            <DeferredLayoutUI />
          </LayoutProviders>
        </AppProviders>

      </body>
    </html>
  );
}
