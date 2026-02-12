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
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover", // iOS: Extend into notch/safe area
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
  colorScheme: "dark light",
  // iOS-specific: Improve rendering performance
  interactiveWidget: "resizes-content", // iOS 15+: Better keyboard handling
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
      html,body{background:#ffffff!important;}
      #bm-splash{position:fixed;inset:0;z-index:99999;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;opacity:1;transition:opacity .5s cubic-bezier(.4,0,.2,1),visibility .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1);overflow:hidden;will-change:opacity,transform;}
      #bm-splash.hide{opacity:0;visibility:hidden;pointer-events:none;transform:scale(1.02);}

      /* Subtle radial gradient overlay */
      #bm-splash::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at center,rgba(0,0,0,0.02) 0%,rgba(255,255,255,0) 70%);z-index:0;animation:bm-breathe 5.5s ease-in-out infinite;will-change:transform,opacity;}
      #bm-splash::after{content:"";position:absolute;inset:-20%;background:conic-gradient(from 180deg at 50% 50%,rgba(24,24,27,.04),rgba(24,24,27,0),rgba(24,24,27,.04));filter:blur(20px);opacity:.48;z-index:0;animation:bm-rotate-bg 18s linear infinite;will-change:transform;}
      #bm-splash .bm-orb{position:absolute;border-radius:9999px;filter:blur(20px);pointer-events:none;z-index:1;will-change:transform;}
      #bm-splash .bm-orb-a{width:240px;height:240px;top:12%;left:18%;background:radial-gradient(circle,rgba(24,24,27,.12),rgba(24,24,27,0) 65%);animation:bm-orb-float-a 9s ease-in-out infinite;}
      #bm-splash .bm-orb-b{width:280px;height:280px;right:14%;bottom:10%;background:radial-gradient(circle,rgba(24,24,27,.1),rgba(24,24,27,0) 65%);animation:bm-orb-float-b 11s ease-in-out infinite;}

      /* Logo container */
      #bm-splash .bm-logo-wrap{position:relative;z-index:10;width:120px;height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;animation:bm-logo-intro .7s cubic-bezier(.2,.8,.2,1) both,bm-logo-float 3s ease-in-out .7s infinite;will-change:transform,opacity;}
      #bm-splash .bm-logo-wrap svg{width:100%;height:100%;filter:drop-shadow(0 0 20px rgba(0,0,0,0.08));}

      /* Title */
      #bm-splash .bm-title{position:relative;z-index:10;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,"Segoe UI",Roboto,sans-serif;font-size:42px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-bottom:6px;background:linear-gradient(110deg,#a1a1aa 15%,#18181b 45%,#18181b 55%,#a1a1aa 85%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:bm-text-intro .6s cubic-bezier(.2,.8,.2,1) .15s both,bm-shimmer 4.2s linear .8s infinite;will-change:transform,opacity;}

      /* Subtitle */
      #bm-splash .bm-subtitle{position:relative;z-index:10;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif;font-size:11px;font-weight:600;letter-spacing:.5em;text-transform:uppercase;color:rgba(0,0,0,.35);margin-bottom:32px;animation:bm-text-intro .6s cubic-bezier(.2,.8,.2,1) .28s both;will-change:transform,opacity;}

      /* Progress section */
      #bm-splash .bm-progress-wrap{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:16px;animation:bm-text-intro .6s cubic-bezier(.2,.8,.2,1) .4s both,bm-progress-float 4s ease-in-out 1.1s infinite;will-change:transform,opacity;}

      /* Percentage */
      #bm-splash .bm-percent{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Monaco,Consolas,monospace;font-size:56px;font-weight:700;letter-spacing:-.04em;line-height:1;background:linear-gradient(110deg,#a1a1aa 15%,#18181b 45%,#18181b 55%,#a1a1aa 85%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:bm-shimmer 3.5s linear infinite;font-variant-numeric:tabular-nums;}

      /* Status pill */
      #bm-splash .bm-status{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.03);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:8px 20px;border-radius:9999px;border:1px solid rgba(0,0,0,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);}
      #bm-splash .bm-dot-wrap{position:relative;display:flex;width:10px;height:10px;}
      #bm-splash .bm-dot-ping{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.25);animation:bm-ping 1s cubic-bezier(0,0,.2,1) infinite;}
      #bm-splash .bm-dot{position:relative;width:10px;height:10px;border-radius:50%;background:#18181b;}
      #bm-splash .bm-status-text{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Monaco,Consolas,monospace;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,0,0,.5);}

      /* Loading bar */
      #bm-splash .bm-bar-outer{width:200px;height:2px;border-radius:2px;background:rgba(0,0,0,.06);overflow:hidden;margin-top:8px;position:relative;}
      #bm-splash .bm-bar-outer::after{content:"";position:absolute;inset:0;transform:translate3d(-130%,0,0);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:bm-bar-scan 1.8s linear infinite;will-change:transform;}
      #bm-splash .bm-bar-inner{width:0%;height:100%;border-radius:2px;background:linear-gradient(90deg,#18181b,#3f3f46,#18181b);transition:width .3s ease-out,opacity .3s ease-out;animation:bm-bar-glow 2s ease-in-out infinite;}

      /* Loading steps */
      #bm-splash .bm-steps{display:flex;flex-direction:column;gap:6px;margin-top:20px;position:relative;z-index:10;}
      #bm-splash .bm-step{display:flex;align-items:center;gap:10px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Monaco,Consolas,monospace;font-size:11px;letter-spacing:.05em;color:rgba(0,0,0,.25);transition:color .3s ease,opacity .3s ease,transform .3s ease;opacity:.5;transform:translateX(0);}
      #bm-splash .bm-step.active{color:rgba(0,0,0,.8);opacity:1;transform:translateX(3px);}
      #bm-splash .bm-step.done{color:rgba(0,0,0,.35);opacity:.7;}
      #bm-splash .bm-step-icon{width:14px;height:14px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;font-size:8px;flex-shrink:0;transition:all .3s ease;}
      #bm-splash .bm-step.active .bm-step-icon{background:rgba(0,0,0,.06);}
      #bm-splash .bm-step.done .bm-step-icon{background:#18181b;color:#fff;}

      @keyframes bm-logo-intro{0%{opacity:0;transform:translate3d(0,14px,0) scale(.9)}100%{opacity:1;transform:translate3d(0,0,0) scale(1)}}
      @keyframes bm-logo-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-8px,0)}}
      @keyframes bm-text-intro{0%{opacity:0;transform:translate3d(0,10px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}
      @keyframes bm-shimmer{0%{background-position:0% 50%;opacity:.4}50%{background-position:-200% 50%;opacity:1}100%{background-position:0% 50%;opacity:.4}}
      @keyframes bm-ping{75%,100%{transform:scale(2);opacity:0}}
      @keyframes bm-breathe{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
      @keyframes bm-rotate-bg{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      @keyframes bm-orb-float-a{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(26px,-18px,0)}}
      @keyframes bm-orb-float-b{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(-22px,20px,0)}}
      @keyframes bm-bar-scan{0%{transform:translate3d(-130%,0,0)}100%{transform:translate3d(130%,0,0)}}
      @keyframes bm-bar-glow{0%,100%{opacity:.86}50%{opacity:1}}
      @keyframes bm-progress-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-3px,0)}}
      @media(prefers-reduced-motion:reduce){#bm-splash::before,#bm-splash::after,#bm-splash .bm-orb,#bm-splash .bm-logo-wrap,#bm-splash .bm-title,#bm-splash .bm-subtitle,#bm-splash .bm-progress-wrap,#bm-splash .bm-dot-ping,#bm-splash .bm-bar-outer::after,#bm-splash .bm-bar-inner{animation:none!important;}#bm-splash,#bm-splash .bm-step{transition:none!important;}}
      @media(min-width:768px){#bm-splash .bm-logo-wrap{width:160px;height:160px;}#bm-splash .bm-title{font-size:64px;}#bm-splash .bm-percent{font-size:72px;}}
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

      // Ignore static public assets (non-critical cache-buster scope)
      if (src && src.includes('/assets/')) {
        return;
      }

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

        {/* CRITICAL SCRIPTS - afterInteractive (run after page is interactive) */}
        <Script id="mobile-crash-shield" src="/scripts/BMBRAIN/mobile-crash-shield.js" strategy="afterInteractive" />
        <Script id="inapp-shield" src="/scripts/BMBRAIN/inapp-shield.js" strategy="afterInteractive" />

        {/* NON-CRITICAL SCRIPTS - lazyOnload (defer until after everything else) */}
        <Script id="detect-120hz" src="/scripts/detect-120hz.js" strategy="lazyOnload" />
        <Script id="perf-monitor" src="/scripts/perf-monitor.js" strategy="lazyOnload" />
        <Script id="device-detect" src="/scripts/device-detect.js" strategy="lazyOnload" />
        <Script id="network-optimizer" src="/scripts/BMBRAIN/network-optimizer.js" strategy="lazyOnload" />
        <Script id="spline-universal" src="/scripts/BMBRAIN/spline-universal.js" strategy="lazyOnload" />
        <Script id="offline-detect" src="/scripts/BMBRAIN/offline-detect.js" strategy="lazyOnload" />
      </head>
      <body
        className={cn("antialiased bg-[#050915] text-white", inter.className)}
        suppressHydrationWarning
      >
        {/* INSTANT SPLASH: Shows BullMoney logo + name before React hydrates */}
        <div id="bm-splash" aria-hidden="true" suppressHydrationWarning>
          <div className="bm-orb bm-orb-a" />
          <div className="bm-orb bm-orb-b" />
          {/* Logo */}
          <div className="bm-logo-wrap">
            <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 1H8.625C11.0412 1 13 2.95875 13 5.375C13 6.08661 12.8301 6.75853 12.5287 7.35243C13.4313 8.15386 14 9.32301 14 10.625C14 13.0412 12.0412 15 9.625 15H2V1ZM5.5 9.75V11.5H9.625C10.1082 11.5 10.5 11.1082 10.5 10.625C10.5 10.1418 10.1082 9.75 9.625 9.75H5.5ZM5.5 6.25H8.625C9.10825 6.25 9.5 5.85825 9.5 5.375C9.5 4.89175 9.10825 4.5 8.625 4.5H5.5V6.25Z"
                fill="#18181b"
              />
            </svg>
          </div>
          {/* Title */}
          <span className="bm-title">BULLMONEY</span>
          <span className="bm-subtitle">Premium Gateway</span>
          {/* Progress section */}
          <div className="bm-progress-wrap">
            <span className="bm-percent" id="bm-splash-pct" suppressHydrationWarning>00%</span>
            <div className="bm-status">
              <span className="bm-dot-wrap"><span className="bm-dot-ping" /><span className="bm-dot" /></span>
              <span className="bm-status-text" id="bm-splash-status" suppressHydrationWarning>INITIALIZING</span>
            </div>
            <div className="bm-bar-outer"><div className="bm-bar-inner" id="bm-splash-bar" suppressHydrationWarning /></div>
            <div className="bm-steps" id="bm-splash-steps" suppressHydrationWarning>
              <div className="bm-step active" data-step="0" suppressHydrationWarning><span className="bm-step-icon" suppressHydrationWarning></span><span>LOADING CORE</span></div>
              <div className="bm-step" data-step="1" suppressHydrationWarning><span className="bm-step-icon" suppressHydrationWarning></span><span>CONNECTING SERVICES</span></div>
              <div className="bm-step" data-step="2" suppressHydrationWarning><span className="bm-step-icon" suppressHydrationWarning></span><span>HYDRATING UI</span></div>
              <div className="bm-step" data-step="3" suppressHydrationWarning><span className="bm-step-icon" suppressHydrationWarning></span><span>READY</span></div>
            </div>
          </div>
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
