import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
// Combined 12 CSS files into 1 for faster compilation (fewer modules to resolve)
import "../styles/_combined-layout.css";
import "./styles/90-scroll-anywhere.css";
import { cn } from "@/lib/utils";
import { APP_VERSION, PRESERVED_KEYS } from "@/lib/appVersion";

// ✅ CUSTOM EVENT TRACKING - Removed from layout (static import pulled analytics into every page)
// Import trackEvent in individual client components that need it instead.

// ✅ PROVIDERS — single consolidated wrapper (reduces Turbopack module graph)
import { AppProviders } from "@/components/AppProviders";

// ✅ LAYOUT PROVIDERS - Client component wrapper for dynamic imports
import { LayoutProviders } from "@/components/LayoutProviders";
import { HreflangMeta } from "@/components/HreflangMeta";



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
        {/* INSTANT SPLASH: Prevents white/black flash before React hydrates */}
        <style dangerouslySetInnerHTML={{ __html: `
html,body{background:#050915!important;}
#bm-splash{position:fixed;inset:0;z-index:99999;background:#050915;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;opacity:1;transition:opacity .35s ease-out,visibility .35s ease-out;}
#bm-splash.hide{opacity:0;visibility:hidden;pointer-events:none;}
#bm-splash img{width:64px;height:64px;animation:bm-pulse 1.6s ease-in-out infinite;}
#bm-splash .bm-name{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:22px;font-weight:700;letter-spacing:.04em;color:#fff;opacity:.92;}
#bm-splash .bm-bar{width:120px;height:3px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:4px;}
#bm-splash .bm-bar::after{content:"";display:block;width:40%;height:100%;border-radius:3px;background:linear-gradient(90deg,#ffd700,#f59e0b);animation:bm-slide 1s ease-in-out infinite alternate;}
@keyframes bm-pulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
@keyframes bm-slide{0%{transform:translateX(0)}100%{transform:translateX(200%)}}
        ` }} />
        {/* CRITICAL: Blocking init — served as static file (no Turbopack compilation cost) */}
        <script src="/scripts/splash-init.js" />
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

      // Skip external third-party scripts (Cal.com, analytics, etc.)
      if (src && (src.includes('cal.com') || src.includes('plausible.io') || 
          src.includes('google-analytics') || src.includes('googletagmanager') ||
          src.includes('cdn.') || (!src.includes(window.location.hostname) && src.startsWith('http')))) {
        return; // Silently ignore external scripts
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

        {/* PERFORMANCE: dns-prefetch only origins actually used during page load */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* PERFORMANCE: Preload critical assets with proper priorities */}
        <link rel="preload" href="/ONcc2l601.svg" as="image" fetchPriority="high" />
        
        {/* 
          PERFORMANCE FIX: Removed all Spline scene preload/prefetch tags.
          Scene1 (6.9MB) was being preloaded with HIGH priority, competing with 
          critical JS/CSS for bandwidth. 5 other scenes (total ~13MB) were prefetched.
          Spline scenes are now loaded on-demand by the SplineBackground component
          via the Cache API system, which already handles caching efficiently.
        */}
        
        {/* Spline preloading deferred to lazyOnload — static file avoids Turbopack compile cost */}
        <Script id="spline-preload" src="/scripts/spline-preload.js" strategy="lazyOnload" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

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

        {/* Service Worker & Touch — tiny inline shim sets globals, bulk logic in static file */}
        <Script
          id="sw-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__BM_SW_ENABLED__=${swEnabled};window.__BM_VAPID_KEY__='${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""}';`
          }}
        />
        <Script id="sw-and-touch" src="/scripts/sw-touch.js" strategy="afterInteractive" />
        {/* 
          PERFORMANCE FIX: 120Hz detection moved to afterInteractive.
          Was previously running synchronously in <head> — creating WebGL canvas,
          reading GPU info, and running 20 RAF frames BEFORE React hydration.
          This alone was adding 300-500ms to First Contentful Paint.
        */}
        <Script id="detect-120hz" src="/scripts/detect-120hz.js" strategy="afterInteractive" />
        {/* External performance monitoring script - loaded after everything else */}
        <Script 
          src="/scripts/perf-monitor.js" 
          strategy="lazyOnload"
        />

        {/* BOOST: Device detection — afterInteractive is fine; no CSS depends on
             data-device/data-perf above the fold. Avoids blocking first paint. */}
        <Script
          src="/scripts/device-detect.js"
          strategy="afterInteractive"
        />
        {/* BOOST: Loader coordinates perf-boost, seo-boost, offline-detect */}
        <Script
          src="/scripts/boost-loader.js"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={cn("antialiased bg-[#050915] text-white", inter.className)}
        suppressHydrationWarning
      >
        {/* INSTANT SPLASH: Shows BullMoney logo + name before React hydrates */}
        <div id="bm-splash" aria-hidden="true" suppressHydrationWarning>
          <img src="/ONcc2l601.svg" alt="" width={64} height={64} />
          <span className="bm-name">BullMoney</span>
          <div className="bm-bar" />
        </div>
        <script src="/scripts/splash-hide.js" />
        {/* All providers consolidated into AppProviders (heavy ones dynamically imported) */}
        <AppProviders>
          <LayoutProviders modal={modal}>
            <HreflangMeta />
            {children}
          </LayoutProviders>
        </AppProviders>

      </body>
    </html>
  );
}
