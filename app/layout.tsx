import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
// Combined 12 CSS files into 1 for faster compilation (fewer modules to resolve)
import "../styles/_combined-layout.css";
import "./styles/90-scroll-anywhere.css";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { APP_VERSION, PRESERVED_KEYS } from "@/lib/appVersion";

// ✅ CUSTOM EVENT TRACKING - Removed from layout (static import pulled analytics into every page)
// Import trackEvent in individual client components that need it instead.

// ✅ PROVIDERS - Context providers for root layout
import { ThemeProvider } from "@/context/providers";
import { StudioProvider } from "@/context/StudioContext";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsProvider";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { RecruitAuthProvider } from "@/contexts/RecruitAuthContext";
import { ViewportStateProvider } from "@/contexts/ViewportStateContext";
import { ShopProvider } from "@/components/ShopContext";
import { ThemesProvider, ThemesPanel } from "@/contexts/ThemesContext";

// ✅ SMART SCREENSAVER - Idle detection, cleanup, and battery saver
import { SmartScreensaverProvider } from "@/components/SmartScreensaver";

// ✅ LAYOUT PROVIDERS - Client component wrapper for dynamic imports
import { LayoutProviders } from "@/components/LayoutProviders";
import { HreflangMeta } from "@/components/HreflangMeta";
import { ServerHreflangMeta } from "@/components/ServerHreflangMeta";



// Use system font stack with Inter as preference - avoids network dependency during build
const inter = {
  className: "font-sans",
  style: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.bullmoney.shop"
  ),
  
  // All domains for SEO
  // Primary: www.bullmoney.shop
  // Secondary: www.bullmoney.online
  // Additional: www.bullmoney.live, www.bullmoney.co.za, www.bullmoney.site
  
  // ============================================
  // PRIMARY SEO - Main title and description
  // ============================================
  title: {
    default: "BullMoney | Free Trading Community, Crypto Setups & Market Analysis",
    template: "%s | BullMoney Trading Community"
  },
  description:
    "Join BullMoney - the #1 FREE trading community for Crypto, Gold, Forex & Stocks. Get free trading setups, expert market analysis, live trading mentorship, heavy market news, and connect with 10,000+ traders. Free trading mentor for beginners. Start your trading journey today!",
  
  // ============================================
  // KEYWORDS - Top 40 high-value keywords (trimmed for smaller HTML payload)
  // Google ignores the keywords meta tag, but other engines may use it.
  // ============================================
  keywords: [
    "BullMoney", "BullMoney trading community",
    "free trading mentor", "free trading mentorship", "free trading community",
    "trading community 2026", "best trading community",
    "gold trading", "XAUUSD", "gold analysis", "gold price today",
    "bitcoin trading", "crypto trading", "ethereum trading", "altcoin trading",
    "forex trading", "stock trading", "day trading", "swing trading",
    "trading for beginners", "learn to trade", "free trading course",
    "trading setups", "market analysis", "technical analysis", "price action",
    "prop firm", "funded trader", "FTMO",
    "trading discord", "crypto discord", "AI trading",
    "market news", "breaking news trading", "heavy market news",
    "trading mentor", "crypto news", "bitcoin price",
    "make money trading", "financial freedom trading",
  ],
  
  // ============================================
  // AUTHORS & CREATOR
  // ============================================
  authors: [{ name: "BullMoney", url: "https://www.bullmoney.shop" }],
  creator: "BullMoney Trading Community",
  publisher: "BullMoney",
  
  // ============================================
  // ICONS & BRANDING
  // ============================================
  icons: {
    icon: [
      { url: "/ONcc2l601.svg", type: "image/svg+xml" },
    ],
    shortcut: "/ONcc2l601.svg",
    apple: [
      { url: "/ONcc2l601.svg", type: "image/svg+xml" },
    ],
  },
  
  // ============================================
  // OPEN GRAPH - Social Media Sharing
  // ============================================
  openGraph: {
    title: "BullMoney | Free Trading Community, Crypto Setups & Market Analysis",
    description:
      "Join 10,000+ traders in the #1 FREE trading community. Get free crypto setups, gold trading analysis, forex setups, and live mentorship. No fees, no BS - just profitable trading education.",
    url: "https://www.bullmoney.shop/",
    siteName: "BullMoney Trading Community",
    images: [
      {
        url: "/ONcc2l601.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney - Free Trading Community for Crypto, Gold & Forex",
      },
    ],
    locale: "en_US",
    alternateLocale: [
      'es_ES', 'fr_FR', 'de_DE', 'pt_BR', 'it_IT', 'ja_JP', 'ko_KR',
      'zh_CN', 'ar_SA', 'hi_IN', 'ru_RU', 'tr_TR', 'nl_NL', 'pl_PL',
      'sv_SE', 'nb_NO', 'da_DK', 'fi_FI', 'th_TH', 'vi_VN', 'id_ID',
      'ms_MY', 'tl_PH', 'uk_UA', 'cs_CZ', 'ro_RO', 'el_GR', 'he_IL',
      'hu_HU', 'bg_BG', 'sw_KE', 'af_ZA', 'zu_ZA', 'bn_BD', 'ur_PK',
    ],
    type: "website",
  },
  
  // ============================================
  // TWITTER CARD - Twitter/X Sharing
  // ============================================
  twitter: {
    card: "summary_large_image",
    title: "BullMoney | Free Trading Community & Setups",
    description:
      "Join 10,000+ traders. FREE crypto setups, gold analysis, forex setups & live mentorship. Start trading profitably today!",
    images: ["/ONcc2l601.svg"],
    creator: "@BullMoney",
    site: "@BullMoney",
  },
  
  // ============================================
  // ROBOTS & INDEXING
  // ============================================
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // ============================================
  // VERIFICATION - Add your verification codes
  // ============================================
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    // yandex: "your-yandex-verification",
    // bing: "your-bing-verification",
  },
  
  // ============================================
  // ALTERNATES & CANONICAL - ALL 36 LANGUAGES FOR GLOBAL SEO
  // ============================================
  alternates: {
    canonical: "https://www.bullmoney.shop",
    languages: {
      "x-default": "https://www.bullmoney.shop",
      "en": "https://www.bullmoney.shop?lang=en",
      "es": "https://www.bullmoney.shop?lang=es",
      "fr": "https://www.bullmoney.shop?lang=fr",
      "de": "https://www.bullmoney.shop?lang=de",
      "pt": "https://www.bullmoney.shop?lang=pt",
      "it": "https://www.bullmoney.shop?lang=it",
      "ja": "https://www.bullmoney.shop?lang=ja",
      "ko": "https://www.bullmoney.shop?lang=ko",
      "zh": "https://www.bullmoney.shop?lang=zh",
      "ar": "https://www.bullmoney.shop?lang=ar",
      "hi": "https://www.bullmoney.shop?lang=hi",
      "ru": "https://www.bullmoney.shop?lang=ru",
      "tr": "https://www.bullmoney.shop?lang=tr",
      "nl": "https://www.bullmoney.shop?lang=nl",
      "pl": "https://www.bullmoney.shop?lang=pl",
      "sv": "https://www.bullmoney.shop?lang=sv",
      "no": "https://www.bullmoney.shop?lang=no",
      "da": "https://www.bullmoney.shop?lang=da",
      "fi": "https://www.bullmoney.shop?lang=fi",
      "th": "https://www.bullmoney.shop?lang=th",
      "vi": "https://www.bullmoney.shop?lang=vi",
      "id": "https://www.bullmoney.shop?lang=id",
      "ms": "https://www.bullmoney.shop?lang=ms",
      "tl": "https://www.bullmoney.shop?lang=tl",
      "uk": "https://www.bullmoney.shop?lang=uk",
      "cs": "https://www.bullmoney.shop?lang=cs",
      "ro": "https://www.bullmoney.shop?lang=ro",
      "el": "https://www.bullmoney.shop?lang=el",
      "he": "https://www.bullmoney.shop?lang=he",
      "hu": "https://www.bullmoney.shop?lang=hu",
      "bg": "https://www.bullmoney.shop?lang=bg",
      "sw": "https://www.bullmoney.shop?lang=sw",
      "af": "https://www.bullmoney.shop?lang=af",
      "zu": "https://www.bullmoney.shop?lang=zu",
      "bn": "https://www.bullmoney.shop?lang=bn",
      "ur": "https://www.bullmoney.shop?lang=ur",
    },
  },
  
  // Additional domain references for SEO
  // www.bullmoney.online mirrors www.bullmoney.shop
  
  // ============================================
  // CATEGORY & CLASSIFICATION
  // ============================================
  category: "Finance",
  classification: "Trading Community, Financial Education",
  
  // ============================================
  // OTHER META
  // ============================================
  other: {
    "apple-mobile-web-app-title": "BullMoney",
    "application-name": "BullMoney Trading",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
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
        {/* CRITICAL: Minimal blocking script - Safari detection + theme + desktop scroll */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){var d=document.documentElement,ua=navigator.userAgent,s=d.style;
var isD=!(/mobi|android|iphone|ipad/i.test(ua)),isB=window.innerWidth>=769;
if(isD&&isB){d.classList.add('desktop-optimized');s.height='auto';s.overflowY='scroll';s.overflowX='hidden';s.scrollBehavior='auto';s.scrollSnapType='none';s.overscrollBehavior='auto';
var b=document.body;if(b){b.style.height='auto';b.style.overflowY='visible';b.style.overflowX='hidden';b.style.overscrollBehavior='auto';}
if(!('ontouchstart' in window)&&!navigator.maxTouchPoints)d.classList.add('mouse-device','non-touch-device');
if(window.innerWidth>=1440){d.classList.add('big-display');s.scrollPaddingTop='80px';if(b)b.classList.add('big-display-body');}}
if(/macintosh|mac os x/i.test(ua)&&isD){d.classList.add('macos');}
var isSaf=/^((?!chrome|android|crios|fxios|opera|opr|edge|edg).)*safari/i.test(ua),iOS=/iphone|ipad|ipod/i.test(ua);
if(isSaf||iOS){d.classList.add('is-safari');if(iOS)d.classList.add('is-ios-safari');
var vh=function(){s.setProperty('--vh',(window.innerHeight*0.01)+'px');s.setProperty('--svh',(window.innerHeight*0.01)+'px');};
vh();window.addEventListener('resize',vh);window.addEventListener('orientationchange',vh);}
try{var t=localStorage.getItem('bullmoney-theme-data');if(t){var p=JSON.parse(t);if(p&&p.accentColor){var h=p.accentColor.replace('#',''),r=parseInt(h.substring(0,2),16)||59,g=parseInt(h.substring(2,4),16)||130,b2=parseInt(h.substring(4,6),16)||246,rgb=r+', '+g+', '+b2;
s.setProperty('--accent-color',p.accentColor);s.setProperty('--accent-rgb',rgb);s.setProperty('--theme-accent-light','rgba('+rgb+', 0.25)');s.setProperty('--theme-accent-dark','rgba('+rgb+', 0.5)');s.setProperty('--theme-accent-glow','rgba('+rgb+', 0.4)');s.setProperty('--theme-accent-subtle','rgba('+rgb+', 0.1)');s.setProperty('--theme-accent-border','rgba('+rgb+', 0.3)');
d.setAttribute('data-active-theme',p.id||'bullmoney-blue');d.setAttribute('data-theme-category',p.category||'SPECIAL');
}}else{d.setAttribute('data-active-theme','bullmoney-blue');s.setProperty('--accent-color','#ffffff');s.setProperty('--accent-rgb','255, 255, 255');}}catch(e){d.setAttribute('data-active-theme','bullmoney-blue');s.setProperty('--accent-color','#ffffff');s.setProperty('--accent-rgb','255, 255, 255');}
})();
            `,
          }}
        />
        {/* Cache validation (deferred to avoid blocking first paint) */}
        <Script
          id="cache-buster"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // App version for cache invalidation - MUST MATCH lib/appVersion.ts
  var APP_VERSION = '${APP_VERSION}';
  var storedVersion = localStorage.getItem('bullmoney_app_version');
  
  // Force cache clear on version mismatch
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[CacheBuster] Version mismatch:', storedVersion, '->', APP_VERSION);
    
    // Clear browser caches (NOT localStorage auth)
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
    
    // SAFE clear: Only remove volatile/cache keys, ALWAYS preserve auth & session
    var keysToKeep = ['bullmoney_app_version'].concat(${JSON.stringify(PRESERVED_KEYS)});
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (!key) continue;
      // NEVER touch auth/session keys
      if (keysToKeep.indexOf(key) !== -1) continue;
      // NEVER touch Supabase auth tokens
      if (key.indexOf('sb-') === 0 || key.indexOf('supabase') === 0) continue;
      // NEVER touch cookie-backed auth
      if (key.indexOf('bm_auth') === 0) continue;
      // Only clear bullmoney cache/volatile keys
      if (key.indexOf('bullmoney_cache') === 0 || key.indexOf('bullmoney_temp') === 0 || key.indexOf('bullmoney_spline') === 0 || key.indexOf('bullmoney_image') === 0 || key.indexOf('bullmoney_api') === 0 || key.indexOf('bullmoney_playlist') === 0 || key.indexOf('bullmoney_component') === 0) {
        localStorage.removeItem(key);
      }
    }
    
    // Set new version (NO reload - let React hydrate normally)
    localStorage.setItem('bullmoney_app_version', APP_VERSION);
  }
  
  // Initialize version on first load
  if (!storedVersion) {
    try { localStorage.setItem('bullmoney_app_version', APP_VERSION); } catch (e) {}
  }

  // Track failed chunk loads
  var failedLoads = 0;
  var hasReloaded = sessionStorage.getItem('_bm_reloaded');
  var isDev = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname === '127.0.0.1';

  // Listen for resource load errors (404s on JS/CSS files)
  window.addEventListener('error', function(e) {
    var target = e.target || e.srcElement;
    if (target && target.tagName) {
      var tag = target.tagName.toLowerCase();
      var src = target.src || target.href || '';

      // Skip Vercel-specific URLs in development (they only exist in production)
      if (isDev && (src.includes('/_vercel/') || src.includes('vercel-insights') || src.includes('vercel-analytics'))) {
        return; // Silently ignore - expected in development
      }

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

        {/* PERFORMANCE: Preconnect only to origins needed for first paint */}
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* PERFORMANCE: Preload critical assets with proper priorities */}
        <link rel="preload" href="/ONcc2l601.svg" as="image" fetchPriority="high" />
        
        {/* 
          PERFORMANCE FIX: Removed all Spline scene preload/prefetch tags.
          Scene1 (6.9MB) was being preloaded with HIGH priority, competing with 
          critical JS/CSS for bandwidth. 5 other scenes (total ~13MB) were prefetched.
          Spline scenes are now loaded on-demand by the SplineBackground component
          via the Cache API system, which already handles caching efficiently.
        */}
        
        {/* Spline preloading deferred to afterInteractive to avoid competing with critical JS/CSS */}
        <Script
          id="spline-preload"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(){if(window.innerWidth<768)return;
var C=window.__SPLINE_MEMORY_CACHE__=window.__SPLINE_MEMORY_CACHE__||{};
var N='spline-scenes-v1';
function load(s){if(C[s])return;var cc=typeof caches!=='undefined';
if(!cc){fetch(s,{cache:'force-cache',priority:'low'}).then(function(r){if(r.ok)return r.arrayBuffer()}).then(function(b){if(b)C[s]=b});return;}
caches.open(N).then(function(c){c.match(s).then(function(r){if(r)return r.arrayBuffer().then(function(b){C[s]=b});
return fetch(s,{cache:'force-cache',priority:'low'}).then(function(r2){if(r2.ok){c.put(s,r2.clone());return r2.arrayBuffer().then(function(b){C[s]=b})}})})}).catch(function(){});}
setTimeout(function(){load('/scene1.splinecode');},100);
})();
            `,
          }}
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />

        {/* 
          HREFLANG: Handled by Next.js Metadata API `alternates` in each layout.
          Each layout (root, store, about, products, etc.) exports its own alternates 
          via makeAlternatesMetadata() — Next.js renders these as <link rel="alternate"> 
          tags server-side. No need for a separate ServerHreflangMeta component.
        */}

        {/* Apple Touch Icon - 180x180 is all modern iOS needs */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />

        {/* Splash Screens for iOS - top 3 most common sizes only */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash-screens/iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png" />

        {/* Favicon for various platforms */}
        <link rel="icon" type="image/svg+xml" href="/ONcc2l601.svg" />
        <link rel="shortcut icon" href="/ONcc2l601.svg" />
        <link rel="apple-touch-icon" href="/ONcc2l601.svg" />

        {/* Service Worker & Essential Scripts - DEFERRED to afterInteractive */}
        <Script
          id="sw-and-touch"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var __BM_SW_ENABLED__ = ${swEnabled ? "true" : "false"};
              if (__BM_SW_ENABLED__ && 'serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(function(reg) { console.log('[SW] Registered:', reg.scope); })
                  .catch(function(e) { console.error('[SW] Failed:', e); });
              }

              // Prevent pull-to-refresh at top of page
              var touchStartY = 0;
              document.addEventListener('touchstart', function(e) { touchStartY = e.touches[0].clientY; }, { passive: true });
              document.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) return;
                var deltaY = e.touches[0].clientY - touchStartY;
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                if (scrollTop <= 0 && deltaY > 10) {
                  var target = e.target;
                  if (!(target && target.closest && target.closest('.fixed[style*="z-index"]'))) e.preventDefault();
                }
              }, { passive: false });
            `,
          }}
        />
        {/* 
          PERFORMANCE FIX: 120Hz detection moved to afterInteractive.
          Was previously running synchronously in <head> — creating WebGL canvas,
          reading GPU info, and running 20 RAF frames BEFORE React hydration.
          This alone was adding 300-500ms to First Contentful Paint.
        */}
        <Script
          id="detect-120hz"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var r=document.documentElement,hz=60;
                if('refreshRate' in screen){hz=Math.min(screen.refreshRate,120);}
                else{var ua=navigator.userAgent.toLowerCase(),dpr=window.devicePixelRatio,w=screen.width,h=screen.height;
                if(/iphone/.test(ua)&&dpr>=3&&(w>=390||h>=844))hz=120;
                else if(/ipad/.test(ua)&&dpr>=2&&w>=1024)hz=120;
                else if(/macintosh/i.test(ua)&&navigator.hardwareConcurrency>=8)hz=120;
                else if(/samsung|oneplus|xiaomi|oppo|realme|vivo/i.test(ua)&&dpr>=2.5)hz=120;
                else if(/pixel.*pro/i.test(ua))hz=90;
                else if(!(/mobi|android|iphone|ipad/i.test(ua))&&((navigator.deviceMemory||8)>=16||screen.width>=2560))hz=120;}
                var t=Math.min(hz,120);
                r.style.setProperty('--native-refresh-rate',hz);
                r.style.setProperty('--target-fps',t);
                r.style.setProperty('--frame-duration',(1000/t)+'ms');
                r.style.setProperty('--frame-budget',(1000/t*0.9)+'ms');
                if(hz>=120)r.classList.add('display-120hz');
                else if(hz>=90)r.classList.add('display-90hz');
              })();
            `,
          }}
        />
        {/* External performance monitoring script - loaded after page is interactive */}
        <Script 
          src="/scripts/perf-monitor.js" 
          strategy="afterInteractive"
        />

        {/* BOOST: Device detection runs before first paint for layout decisions */}
        <Script
          src="/scripts/device-detect.js"
          strategy="beforeInteractive"
        />
        {/* BOOST: Loader coordinates perf-boost, seo-boost, offline-detect */}
        <Script
          src="/scripts/boost-loader.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={cn("antialiased bg-[#050915] text-white", inter.className)}
        suppressHydrationWarning
      >
        {/* Global Shimmer Styles - ensures all shimmers are synchronized */}
        {/* Cache Manager - Handles version-based cache invalidation */}
        {/* All providers and lazy-loaded components are in LayoutProviders */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemesProvider>
            <GlobalThemeProvider>
              <ViewportStateProvider>
                <MobileMenuProvider>
                  <RecruitAuthProvider>
                    <AudioSettingsProvider>
                      <StudioProvider>
                        {/* ✅ ShopProvider with LayoutProviders wrapper */}
                        <ShopProvider>
                          <SmartScreensaverProvider>
                            <LayoutProviders modal={modal}>
                              <HreflangMeta />
                              {children}
                            </LayoutProviders>
                            {/* Unified Themes Panel (Colors + Effects) */}
                            <ThemesPanel />
                          </SmartScreensaverProvider>
                        </ShopProvider>
                      </StudioProvider>
                    </AudioSettingsProvider>
                  </RecruitAuthProvider>
                </MobileMenuProvider>
              </ViewportStateProvider>
            </GlobalThemeProvider>
          </ThemesProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}
