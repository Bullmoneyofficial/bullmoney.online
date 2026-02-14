import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
// Combined 12 CSS files into 1 for faster compilation (fewer modules to resolve)
import "../styles/_combined-layout.css";
// import "./styles/90-scroll-anywhere.css"; // Temporarily disabled - causing PostCSS parse errors, scroll fixes moved to inline styles
import { cn } from "@/lib/utils";
import { APP_VERSION, PRESERVED_KEYS } from "@/lib/appVersion";

// ✅ CUSTOM EVENT TRACKING - Removed from layout (static import pulled analytics into every page)
// Import trackEvent in individual client components that need it instead.

// ✅ PROVIDERS  single consolidated wrapper (reduces Turbopack module graph)
import { AppProviders } from "@/components/AppProviders";

// ✅ LAYOUT PROVIDERS - Client component wrapper for dynamic imports
import { LayoutProviders } from "@/components/LayoutProviders";
import { GamesModalProvider } from "@/components/GamesModalProvider";

import PWAInstallPrompt from "@/components/PWAInstallPrompt";



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
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icon-192x192.png",
    apple: [
      { url: "/icon-180x180.png", type: "image/png", sizes: "180x180" },
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
        url: "/IMG_2921.PNG",
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
    images: ["/IMG_2921.PNG"],
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
  const routePrefetchEnabled = process.env.NODE_ENV === "production";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* INSTANT SPLASH: Prevents white/black flash before React hydrates */}
        <style dangerouslySetInnerHTML={{ __html: `
      :root{--app-vh:1vh;}
      html,body{background:#000000!important;}
      
      #bm-splash{position:fixed;top:0;right:0;bottom:0;left:0;width:100%;height:100%;min-height:100vh;min-height:100dvh;min-height:-webkit-fill-available;z-index:99999;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;opacity:1;transition:opacity .5s cubic-bezier(.4,0,.2,1),visibility .5s cubic-bezier(.4,0,.2,1);overflow:hidden;will-change:opacity,transform;transform-origin:50% 50%;}
      /* Lock viewport while splash is active — overrides scroll fixes below */
      html:has(#bm-splash:not(.hide)),html:has(#bm-splash:not(.hide)) body{overflow:hidden!important;height:100%!important;position:static!important;}
      @supports not (selector(:has(*))){html:not(.bm-splash-done),html:not(.bm-splash-done) body{overflow:hidden!important;height:100%!important;}}
      #bm-splash.hide{opacity:0;visibility:hidden;pointer-events:none;transform:scale(1.02);animation:none!important;transition:opacity .5s cubic-bezier(.4,0,.2,1),visibility .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1);}

      /* Safari/iOS fallback: reduce compositor stress + stabilize viewport sizing */
      html.is-safari #bm-splash,html.is-ios-safari #bm-splash{left:0;right:0;width:100%;height:100%;min-height:100vh;min-height:-webkit-fill-available;transform:translateZ(0);-webkit-transform:translateZ(0);backface-visibility:hidden;-webkit-backface-visibility:hidden;}
      html.is-safari #bm-splash::before,html.is-safari #bm-splash::after,html.is-ios-safari #bm-splash::before,html.is-ios-safari #bm-splash::after{animation:none!important;filter:none!important;}
      html.is-safari #bm-splash .bm-orb,html.is-ios-safari #bm-splash .bm-orb{display:none;}
      html.is-safari #bm-splash .bm-status,html.is-ios-safari #bm-splash .bm-status{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
      html.is-safari #bm-splash .bm-logo-wrap,html.is-safari #bm-splash .bm-progress-wrap,html.is-ios-safari #bm-splash .bm-logo-wrap,html.is-ios-safari #bm-splash .bm-progress-wrap{animation:none!important;}

      /* Subtle radial gradient overlay */
      #bm-splash::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at center,rgba(0,0,0,0.02) 0%,rgba(255,255,255,0) 70%);z-index:0;}
      #bm-splash::after{content:"";position:absolute;inset:-20%;background:conic-gradient(from 180deg at 50% 50%,rgba(24,24,27,.04),rgba(24,24,27,0),rgba(24,24,27,.04));filter:blur(20px);opacity:.48;z-index:0;}
      #bm-splash .bm-orb{position:absolute;border-radius:9999px;filter:blur(20px);pointer-events:none;z-index:1;will-change:transform;}
      #bm-splash .bm-orb-a{width:240px;height:240px;top:12%;left:18%;background:radial-gradient(circle,rgba(24,24,27,.12),rgba(24,24,27,0) 65%);}
      #bm-splash .bm-orb-b{width:280px;height:280px;right:14%;bottom:10%;background:radial-gradient(circle,rgba(24,24,27,.1),rgba(24,24,27,0) 65%);}

      /* Splash content wrapper */
      #bm-splash .bm-sway-content{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;}

      /* Logo container */
      #bm-splash .bm-logo-wrap{position:relative;z-index:10;width:162px;height:162px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;animation:bm-logo-intro .7s cubic-bezier(.2,.8,.2,1) both;will-change:transform,opacity;}
      #bm-splash .bm-logo-wrap svg{width:100%;height:100%;filter:drop-shadow(0 0 20px rgba(0,0,0,0.08));}

      /* Title */
      #bm-splash .bm-title{position:relative;z-index:10;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,"Segoe UI",Roboto,sans-serif;font-size:42px;font-weight:700;letter-spacing:-.02em;line-height:1;margin-bottom:6px;background:linear-gradient(110deg,#a1a1aa 15%,#18181b 45%,#18181b 55%,#a1a1aa 85%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:bm-text-intro .6s cubic-bezier(.2,.8,.2,1) .15s both;will-change:transform,opacity;}

      /* Subtitle */
      #bm-splash .bm-subtitle{position:relative;z-index:10;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif;font-size:11px;font-weight:600;letter-spacing:.5em;text-transform:uppercase;color:rgba(0,0,0,.35);margin-bottom:32px;animation:bm-text-intro .6s cubic-bezier(.2,.8,.2,1) .28s both;will-change:transform,opacity;}

      /* Progress section */
      #bm-splash .bm-progress-wrap{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:16px;animation:bm-text-intro .6s cubic-bezier(.2,.8,.2,1) .4s both;will-change:transform,opacity;}

      /* Percentage */
      #bm-splash .bm-percent{display:inline-block;white-space:nowrap;padding-right:.08em;overflow:visible;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Monaco,Consolas,monospace;font-size:56px;font-weight:700;letter-spacing:-.04em;line-height:1;background:linear-gradient(110deg,#a1a1aa 15%,#18181b 45%,#18181b 55%,#a1a1aa 85%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-variant-numeric:tabular-nums;}

      /* Status pill */
      #bm-splash .bm-status{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.03);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:8px 20px;border-radius:9999px;border:1px solid rgba(0,0,0,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);}
      #bm-splash .bm-dot-wrap{position:relative;display:flex;width:10px;height:10px;}
      #bm-splash .bm-dot-ping{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.25);}
      #bm-splash .bm-dot{position:relative;width:10px;height:10px;border-radius:50%;background:#18181b;}
      #bm-splash .bm-status-text{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Monaco,Consolas,monospace;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,0,0,.5);}

      /* Loading bar */
      #bm-splash .bm-bar-outer{width:200px;height:2px;border-radius:2px;background:rgba(0,0,0,.06);overflow:hidden;margin-top:8px;position:relative;}
      #bm-splash .bm-bar-outer::after{content:"";position:absolute;inset:0;transform:translate3d(-130%,0,0);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);}
      #bm-splash .bm-bar-inner{width:0%;height:100%;border-radius:2px;background:linear-gradient(90deg,#18181b,#3f3f46,#18181b);transition:width .3s ease-out,opacity .3s ease-out;}

      /* Loading steps */
      #bm-splash .bm-steps{display:flex;flex-direction:column;gap:6px;margin-top:20px;position:relative;z-index:10;}
      #bm-splash .bm-step{display:flex;align-items:center;gap:10px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Monaco,Consolas,monospace;font-size:11px;letter-spacing:.05em;color:rgba(0,0,0,.25);transition:color .3s ease,opacity .3s ease,transform .3s ease;opacity:.5;transform:translateX(0);}
      #bm-splash .bm-step span:last-child{position:relative;display:inline-block;}

      /* ═══════════════════════════════════════════════════════════════════ */
      /* CRITICAL SCROLL FIX - Ensures scrolling works on ALL devices/browsers */
      /* Fixes: Chrome, Safari, iOS Safari, Android, Samsung Internet */
      /* Updated 2026-02-13: Enhanced for games/design/store/app pages */
      /* ═══════════════════════════════════════════════════════════════════ */
      
      /* BASE SCROLL ENABLEMENT - Works unless modal is actually open */
      html:not(:has([role="dialog"]:not([data-state="closed"]))),
      body:not(:has([role="dialog"]:not([data-state="closed"]))) {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        height: auto !important;
        min-height: 100vh !important;
        touch-action: pan-y pan-x !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior-y: contain !important;
        scroll-behavior: auto !important;
        position: relative !important;
      }
      
      /* Fallback for browsers without :has() support */
      @supports not (selector(:has(*))) {
        html:not(.modal-open):not([data-modal-open="true"]),
        body:not(.modal-open):not([data-modal-open="true"]) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          min-height: 100vh !important;
          touch-action: pan-y pan-x !important;
          position: relative !important;
        }
      }
      
      /* Remove any blocking pointer events */
      html:not(:has([role="dialog"])), 
      body:not(:has([role="dialog"])), 
      #__next, #root {
        pointer-events: auto !important;
      }
      
      /* iOS-specific scroll fixes - CRITICAL */
      @supports (-webkit-touch-callout: none) {
        html:not(.modal-open), 
        body:not(.modal-open) {
          -webkit-overflow-scrolling: touch !important;
          overflow-y: auto !important;
        }
      }
      
      /* Android-specific fixes - CRITICAL */
      @media (max-width: 768px) {
        html:not(.modal-open) {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        body:not(.modal-open) {
          overflow-y: auto !important;
          position: relative !important;
          min-height: 100vh !important;
        }
      }
      
      /* Samsung Internet & Chrome Mobile fixes */
      @supports (-webkit-appearance: none) {
        html:not(.modal-open), 
        body:not(.modal-open) {
          overflow-y: auto !important;
          touch-action: pan-y pan-x !important;
        }
        
        /* Samsung-specific scroll enhancements */
        html.samsung-browser:not(.modal-open),
        body.samsung-scroll:not(.modal-open) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          touch-action: pan-y pan-x !important;
          -webkit-overflow-scrolling: touch !important;
          height: auto !important;
          transform: none !important;
        }
        
        /* Chrome/Chromium scroll enhancements */
        html.chrome-browser:not(.modal-open),
        body.chrome-scroll:not(.modal-open) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          touch-action: pan-y pan-x !important;
          -webkit-overflow-scrolling: touch !important;
          height: auto !important;
          transform: none !important;
        }
        
        /* Safari scroll enhancements */
        html.safari-browser:not(.modal-open),
        body.safari-scroll:not(.modal-open) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          touch-action: pan-y pan-x !important;
          -webkit-overflow-scrolling: touch !important;
          height: auto !important;
          transform: none !important;
        }
        
        /* In-app browser scroll enhancements */
        html.inapp-browser:not(.modal-open),
        html.instagram-browser:not(.modal-open),
        html.facebook-browser:not(.modal-open),
        html.google-browser:not(.modal-open),
        body.inapp-scroll:not(.modal-open) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          touch-action: pan-y pan-x !important;
          -webkit-overflow-scrolling: touch !important;
          height: auto !important;
          transform: none !important;
        }
      }
      
      /* UC Browser / Huawei Browser / MIUI Browser scroll fixes */
      html.uc-browser:not(.modal-open),
      html.huawei-browser:not(.modal-open),
      html.miui-browser:not(.modal-open) {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        touch-action: pan-y pan-x !important;
        -webkit-overflow-scrolling: touch !important;
        height: auto !important;
        transform: none !important;
      }
      body.uc-browser:not(.modal-open),
      body.huawei-browser:not(.modal-open),
      body.miui-browser:not(.modal-open) {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        height: auto !important;
      }
      
      /* Opera Mini - graceful degradation */
      html.opera-mini *,
      html.reduce-effects * {
        animation-duration: 0.01s !important;
        transition-duration: 0.01s !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      html.opera-mini .glass-effect,
      html.opera-mini .glassmorphism {
        background: rgba(5,9,21,.9) !important;
      }
      
      /* Firefox Android specific fixes */
      @-moz-document url-prefix() {
        html:not(.modal-open),
        body:not(.modal-open) {
          overflow-y: auto !important;
          touch-action: pan-y pan-x !important;
        }
      }
      
      /* Foldable device support (Galaxy Z Fold/Flip, Pixel Fold) */
      html.foldable-device {
        --fold-width: env(viewport-segment-width 0 0, 100vw);
      }
      @media (horizontal-viewport-segments: 2) {
        body { column-count: 2; column-gap: env(viewport-segment-left 1 0, 0px); }
      }
      
      /* PWA standalone mode */
      html.is-pwa body,
      html.standalone-mode body {
        padding-top: env(safe-area-inset-top, 0px) !important;
        padding-bottom: env(safe-area-inset-bottom, 0px) !important;
      }
      
      /* ═══════════════════════════════════════════════════════════════════ */
      /* MAC DESKTOP FIXES — Safari & Chrome on M1-M6 + Intel              */
      /* ═══════════════════════════════════════════════════════════════════ */
      
      /* Mac Safari: fix elastic overscroll color bleed */
      html[data-os="macos"]:not(.modal-open),
      html[data-os="macos"]:not(.modal-open) body {
        overscroll-behavior-y: contain;
        overscroll-behavior-x: none;
      }
      
      /* Mac Safari: trackpad momentum scroll jitter fix */
      html.mac-safari .backdrop-blur-sm,
      html.mac-safari .backdrop-blur-md,
      html.mac-safari .backdrop-blur-lg,
      html.mac-safari .backdrop-blur-xl {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        will-change: transform;
      }
      
      /* Mac Chrome: prevent sub-pixel rendering artifacts on Retina */
      html.mac-chrome .glass-effect,
      html.mac-chrome .glassmorphism {
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* Apple Silicon (M1-M6): higher quality effects */
      html.apple-silicon .particle-container,
      html.apple-silicon .aurora {
        will-change: transform, opacity;
      }
      
      /* Intel Mac: reduce GPU load */
      html.intel-mac .particle-container { will-change: auto; }
      html.intel-mac .aurora { animation-duration: 8s !important; }
      
      /* ═══════════════════════════════════════════════════════════════════ */
      /* DESKTOP SCROLL & VIEWPORT — click, scroll, resize support         */
      /* ═══════════════════════════════════════════════════════════════════ */
      
      /* Desktop scrollbar styling */
      html.is-desktop {
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.15) transparent;
      }
      html.is-desktop::-webkit-scrollbar { width: 8px; height: 8px; }
      html.is-desktop::-webkit-scrollbar-track { background: transparent; }
      html.is-desktop::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 4px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      html.is-desktop::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.3);
        background-clip: content-box;
      }
      
      /* Desktop: always show scrollbar gutter to prevent layout shift */
      html.is-desktop body {
        overflow-y: scroll;
        overflow-x: hidden;
      }
      
      /* Desktop: proper click targets */
      html.is-desktop a,
      html.is-desktop button,
      html.is-desktop [role="button"] {
        cursor: pointer;
      }
      
      /* Desktop hover effects (only with fine pointer) */
      @media (hover: hover) and (pointer: fine) {
        a:hover, button:hover, [role="button"]:hover {
          transition: all 0.15s ease;
        }
      }
      
      
      /* Responsive breakpoint classes from sw-touch.js */
      html.vp-mobile body { font-size: 14px; }
      html.vp-ultrawide body { max-width: 2560px; margin: 0 auto; }
      
      /* Scroll direction classes (for auto-hiding nav) */
      html.scroll-down .auto-hide-nav {
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      }
      html.scroll-up .auto-hide-nav,
      html.at-top .auto-hide-nav {
        transform: translateY(0);
        transition: transform 0.3s ease;
      }
      
      /* Page visibility: pause animations when hidden */
      html.page-hidden *,
      html.page-hidden *::before,
      html.page-hidden *::after {
        animation-play-state: paused !important;
      }
      
      /* ═══════════════════════════════════════════════════════════════════ */
      /* UNIVERSAL TOUCH ENHANCEMENTS                                      */
      /* ═══════════════════════════════════════════════════════════════════ */
      
      /* Remove tap highlight on all devices */
      html {
        -webkit-tap-highlight-color: transparent;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
      }
      
      
      /* Prevent text selection on interactive elements */
      button, [role="button"], a, .no-select {
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Allow text selection on content */
      p, article, span, .selectable, [contenteditable] {
        -webkit-user-select: text;
        user-select: text;
      }
      
      /* Momentum scrolling for containers */
      .scroll-container, [data-scroll], [role="listbox"], [role="menu"] {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      
      /* Horizontal scroll containers */
      .scroll-x, .overflow-x-auto, .overflow-x-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
      }
      .scroll-x::-webkit-scrollbar { display: none; }
      
      /* Virtual keyboard compensation */
      html.keyboard-open body {
        padding-bottom: var(--keyboard-height, 0px);
      }
      html.keyboard-open input:focus,
      html.keyboard-open textarea:focus {
        scroll-margin-bottom: calc(var(--keyboard-height, 0px) + 20px);
      }
      
      /* Ensure all pages can scroll */
      main:not(:has([role="dialog"])), 
      [role="main"]:not(:has([role="dialog"])), 
      .page-container:not(:has([role="dialog"])) {
        overflow-y: visible !important;
        min-height: 100vh !important;
      }
      
      /* Page-specific scroll fixes */
      [data-games-page]:not(.modal-open),
      [data-design-page]:not(.modal-open),
      [data-store-page]:not(.modal-open),
      [data-app-page]:not(.modal-open) {
        overflow-y: auto !important;
        height: auto !important;
        touch-action: pan-y pan-x !important;
      }
      
      /* CRITICAL: Allow scroll when modal classes exist but no modal is open */
      body.modal-open:not(:has([role="dialog"]:not([data-state="closed"]))), 
      html.modal-open:not(:has([role="dialog"]:not([data-state="closed"]))) {
        overflow-y: auto !important;
        position: relative !important;
        height: auto !important;
        touch-action: pan-y pan-x !important;
      }
      
      /* Ensure scroll position is maintained - AUTO to prevent unwanted smooth scrolling */
      html {
        scroll-behavior: auto !important;
      }
      
      html.enable-smooth-scroll {
        scroll-behavior: smooth !important;
      }
      
      /* Whiteboard/Canvas iframe protection - prevents scroll snapping and auto-focus scroll */
      iframe[src*="excalidraw"],
      iframe[title*="Canvas"],
      iframe[title*="Whiteboard"],
      [data-whiteboard-container] {
        pointer-events: none !important;
        touch-action: none !important;
        scroll-margin-top: 100vh !important;
        contain: strict !important;
      }
      
      iframe[src*="excalidraw"].active,
      iframe[title*="Canvas"].active,
      iframe[title*="Whiteboard"].active {
        pointer-events: auto !important;
        touch-action: auto !important;
      }
      /* ═══════════════════════════════════════════════════════════════════ */
      #bm-splash .bm-step.active{color:rgba(0,0,0,.8);opacity:1;transform:translateX(3px);}
      #bm-splash .bm-step.active span:last-child{background:linear-gradient(100deg,#0f0f12 0%,#3f3f46 35%,#0f0f12 70%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:bm-step-sheen 1.4s ease-in-out infinite;}
      #bm-splash .bm-step.done{color:rgba(0,0,0,.35);opacity:.7;}
      #bm-splash .bm-step.done span:last-child{animation:bm-step-settle .5s ease-out both;}
      #bm-splash .bm-step-icon{width:14px;height:14px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;font-size:8px;flex-shrink:0;transition:all .3s ease;}
      #bm-splash .bm-step.active .bm-step-icon{background:rgba(0,0,0,.06);}
      #bm-splash .bm-step.done .bm-step-icon{background:#18181b;color:#fff;}


      @keyframes bm-logo-intro{0%{opacity:0;transform:translate3d(0,14px,0) scale(.9);will-change:transform}100%{opacity:1;transform:translate3d(0,0,0) scale(1)}}
      @keyframes bm-text-intro{0%{opacity:0;transform:translate3d(0,10px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}
      @keyframes bm-step-sheen{0%{background-position:0% 50%;transform:translate3d(0,0,0)}50%{background-position:100% 50%;transform:translate3d(2px,0,0)}100%{background-position:0% 50%;transform:translate3d(0,0,0)}}
      @keyframes bm-step-settle{0%{opacity:.6;transform:translate3d(0,0,0)}100%{opacity:1;transform:translate3d(0,0,0)}}

      @media(prefers-reduced-motion:reduce){#bm-splash,#bm-splash::before,#bm-splash::after,#bm-splash .bm-orb,#bm-splash .bm-logo-wrap,#bm-splash .bm-title,#bm-splash .bm-subtitle,#bm-splash .bm-progress-wrap,#bm-splash .bm-dot-ping,#bm-splash .bm-bar-outer::after,#bm-splash .bm-bar-inner,#bm-splash .bm-step span:last-child{animation:none!important;}#bm-splash,#bm-splash .bm-step{transition:none!important;}}
      @media(min-width:768px){#bm-splash .bm-logo-wrap{width:216px;height:216px;}#bm-splash .bm-title{font-size:64px;}#bm-splash .bm-percent{font-size:72px;}}
        ` }} />
        {/* CRITICAL: Blocking init  served as static file (no Turbopack compilation cost) */}
        <script src="/scripts/splash-init.js" />
        {/* UNIVERSAL COMPATIBILITY LAYER: Polyfills + feature detection for ALL devices worldwide
            MUST load BEFORE other BMBRAIN scripts — provides Element.closest, CustomEvent, Promise,
            fetch, IntersectionObserver polyfills + safe storage for private browsing + CSS fixes
            for Samsung Internet, UC Browser, Huawei Browser, Opera Mini, MIUI Browser, etc. */}
        <script src="/scripts/BMBRAIN/compat-layer.js" />
        {/* Cache validation (deferred to avoid blocking first paint) */}
        <Script
          id="cache-buster"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // Safe storage wrapper for private browsing / incognito mode
  function safeGet(key){try{return localStorage.getItem(key);}catch(e){return null;}}
  function safeSet(key,val){try{localStorage.setItem(key,val);}catch(e){}}
  function safeRemove(key){try{localStorage.removeItem(key);}catch(e){}}
  function safeSessionGet(key){try{return sessionStorage.getItem(key);}catch(e){return null;}}
  function safeSessionSet(key,val){try{sessionStorage.setItem(key,val);}catch(e){}}
  function safeSessionRemove(key){try{sessionStorage.removeItem(key);}catch(e){}}
  
  // App version for cache invalidation - MUST MATCH lib/appVersion.ts
  var APP_VERSION = '${APP_VERSION}';
  var storedVersion = safeGet('bullmoney_app_version');
  
  // Force cache clear on version mismatch
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[CacheBuster] Version mismatch:', storedVersion, '->', APP_VERSION);
    
    // Clear browser caches (NOT localStorage auth)
    if ('caches' in window) {
      try{caches.keys().then(function(names) {
        names.forEach(function(name) { caches.delete(name); });
      }).catch(function(){});}catch(e){}
    }
    if ('serviceWorker' in navigator) {
      try{navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(r) { r.unregister(); });
      }).catch(function(){});}catch(e){}
    }
    
    // SAFE clear: Only remove volatile/cache keys, ALWAYS preserve auth & session
    var keysToKeep = ['bullmoney_app_version'].concat(${JSON.stringify(PRESERVED_KEYS)});
    try{
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
          safeRemove(key);
        }
      }
    }catch(e){}
    
    // Set new version (NO reload - let React hydrate normally)
    safeSet('bullmoney_app_version', APP_VERSION);
  }
  
  // Initialize version on first load
  if (!storedVersion) {
    safeSet('bullmoney_app_version', APP_VERSION);
  }

  // Track failed chunk loads
  var failedLoads = 0;
  var hasReloaded = safeSessionGet('_bm_reloaded');
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
          safeSessionSet('_bm_reloaded', '1');

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
          safeRemove('bullmoney_build_id');

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
      safeSessionRemove('_bm_reloaded');
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

        {/* PERFORMANCE: dns-prefetch only origins actually used during page load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* PERFORMANCE: Preload critical assets with proper priorities */}
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
                  window.setTimeout(function(){
                    var splash = document.getElementById('bm-splash');
                    if (!splash || splash.classList.contains('hide')) return;
                    splash.classList.add('hide');
                    document.documentElement.classList.add('bm-splash-done');
                    window.__BM_SPLASH_FINISHED__ = true;
                    try { window.dispatchEvent(new Event('bm-splash-finished')); } catch (e) {}
                    window.setTimeout(function(){
                      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
                    }, 450);
                  }, 15000);
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* NON-CRITICAL SCRIPTS - lazyOnload (defer until after everything else) */}
        <Script id="detect-120hz" src="/scripts/detect-120hz.js" strategy="lazyOnload" />
        <Script id="perf-monitor" src="/scripts/perf-monitor.js" strategy="lazyOnload" />
        <Script id="device-detect" src="/scripts/device-detect.js" strategy="lazyOnload" />
        <Script id="device-capabilities" src="/scripts/BMBRAIN/device-capabilities.js" strategy="lazyOnload" />
        <Script id="input-controller" src="/scripts/BMBRAIN/input-controller.js" strategy="lazyOnload" />
        <Script id="push-manager" src="/scripts/BMBRAIN/push-manager.js" strategy="lazyOnload" />
        {routePrefetchEnabled && (
          <Script id="network-optimizer" src="/scripts/BMBRAIN/network-optimizer.js" strategy="lazyOnload" />
        )}
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
          <div className="bm-sway-content">
          {/* Logo */}
          <div className="bm-logo-wrap">
            <svg
              viewBox="0 0 4830 6000"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <g fill="#000" stroke="none">
                <path d="M820 1650v750h760l20-50c20-30 50-70 120-120l140-140c50-70 130-160 210-200l70-40-10-40 10-80c10-30 10-40-20-60l-70-50-40-20 50-30c90-60 140-180 130-310-10-140-80-240-210-300-130-70-170-70-690-70H820v760zm920-440c50 30 70 60 70 120 0 70-20 100-70 130-40 20-60 20-290 20h-250v-290h250c230 0 250 0 290 20zm50 600c50 20 80 70 80 130s-30 110-90 130c-40 20-60 30-310 30h-270v-320h280c250 10 280 10 310 30zm590-610 10 310 130-80 70-70 20-10v70c-10 90-40 150-140 250l-80 90c20 10 90 30 120 20 60-10 120-10 170 20l50 30 10-140 10-130 90 170 100 180 60 10c60 0 80-10 130-100l40-80 10-20-230-420-220-410h-350v310zm1270-190-190 340-150 270-20 30h100l-30 40c-50 70-60 110-80 210-30 130-80 200-180 240l-40 20 20 10c20 10 30 20 30 40v30h220l170-330 190-340c10-10 10 70 10 410v420h350V890h-340l-60 120" />
                <path d="m2520 1480-140 80-140 80c-60 60-80 140-60 220 10 10-10 20-60 50-80 40-170 110-220 200-30 40-70 90-110 110-150 120-190 180-190 300 0 50 0 60-20 60l-80 40-110 50c-70 20-100 40-120 130-10 50-10 50 20 90 50 80 70 120 90 190 20 90 30 100 80 130l50 40c10 20 20 20 50-20l40-40-40 70-40 90c-10 30 0 50 30 50l20 20c20 40 190 10 220-50l10-70c0-40 0-50 20-50l10 10c0 30 30-10 40-50l20-40 50 60c50 90 130 160 260 230l110 80-30 40c-40 40-60 90-60 120 0 50 40 170 60 200l70 60c70 60 80 70 40 100l-150 60c-50 0-90 20-120 70l-60 70-70 90c-30 80-40 100-10 100l30 10c10 30 150-20 200-60l20-60c-10-40 10-60 30-40 10 20 20 20 50-30 30-40 80-60 250-100l100-40c30-20 30-70 0-110-50-70-40-120 20-140l80-30 40-20 40 60 70 70 60 80 90 110c40 30 60 50 60 70l50 80c70 70 100 160 110 270 10 90 10 100-10 160l-30 60-720 10-770 20-40 10h30a22250 22250 0 00 1770-20l-60-10 10-20c10-30 10-40-10-80s-20-50-10-80c10-20 10-30-10-70-30-60-60-140-70-210-10-80-30-130-50-180l-20-50-30-60c-20-50-20-60-30-250a1690 1690 0 00-30-280l50 20c30 20 70 20 120 30 80 0 140-20 190-90 20-40 30-50 30-110-10-80-10-100-90-200-70-100-70-130 10-160 50-30 70-50 80-80 10-20 10-20-10-10s-20 10 0-30c20-50 30-80 10-130-10-40-50-80-40-40 10 20 0 70-30 100-30 20-40 30-30 0h-20c-40 20-90 80-100 120-20 60 20 160 80 240s70 110 70 170c0 50 0 60-30 90-40 40-90 40-150 10-50-30-210-160-230-200-30-50-60-80-150-130l-120-100c-40-50-110-190-120-250-10-50-20-50-60-70-50-10-100-40-100-50 0-20-60-80-90-90-40-10-70 0-130 40-50 40-130 90-160 90l40-30 100-70 70-50c20-10 20-10 0-30l-80-30-40-10h30c30 0 70 10 130 40 90 50 110 70 150 120 20 30 30 40 70 50 60 10 110 0 120-30l30-10c20 0 60-40 60-70l20-30v-80l-30-90c-10-60-10-70 10-100 10-30 20-30 50-20 30 0 120-30 120-50l-60-40-60-40h80c90-10 160-40 200-90 30-40 40-70 60-160 10-50 20-110 40-130l20-50-40 20c-50 30-80 60-120 150-50 100-100 120-210 100l-110-50c-10-20-50-30-70-40l-100-30c-70-30-90-40-150-20-30 10-50 10-90-10-100-40-90-70 10-160 70-60 110-110 130-170 10-40 10-40-40 0zm-60 70-100 70c-110 70-130 100-150 170l-10 40v-30c0-90 40-130 170-200l90-50zm-150 220 20 40 10 10c-10-20 0-30 20-10l70 40c60 10 90 40 70 70 0 20-10 20-20 10-130-30-180-70-180-130 0-30 10-50 20-50l-10 20zm890 70-20 60c-20 50-60 110-90 120l-110 20c-80 0-80 0-90-30-20-40-10-40 30-30l110 10 70-10c20 0 30-20 60-90 40-80 60-100 40-50zm-560 30c40 20 90 60 90 80l-20-20c-30-30-70-50-120-60-30-10-30-10-30 10v20l-20-20v-30c0-10 70 0 100 20zm-400 50 80 50 30 20h-220l30 50c30 50 80 80 110 80s30 0 20 10c-20 20-90-10-140-60l-40-40-40 40-60 90c-30 60-30 50-10-10l20-60c-20-10-100 140-140 240l-20 50 10-50c0-60 30-140 60-200 40-50 150-150 220-190s70-30 90-20zm570 10 20 30h-10l-40-30c-20-10-20-20-10-20l40 20zm-300 70-20 10c-10 0-10-10 10-10 20-20 30-20 10 0zm-160 40c40 30 40 30 20 30l-40-20-60-20c-60 0-60-20-10-20l90 30zm340 20c20 30 10 40-20 0l-10-30 30 30zm-100 30 40 50 40 50c20 10 20 10 10 20-20 0-50-20-80-80l-40-40-10-10c0-10 10-10 40 10zm280 40v70c-30 40-40 40-20-10v-70c-20-70 0-60 20 10zm-130 10-10 40-10-20-10-50 10-20 20 50zm50 20c-10 40-10 40-10 10l10-50v40zm-200 0c20 20 10 40-20 20-20-10-30-40-10-40l20 20zm-30 40 20 30c-20 0-60-30-60-50 0-10 10-10 40 20zm-80 70v20c-20-10-40-60-30-90 0-20 0-20 10 10l20 60zm-110 80 50 50c60 60 60 70 0 30-90-50-110-100-90-180l10-40 10 60 20 80zm-220-60c-80 80-110 110-160 220-30 60-30 30 0-60 40-100 100-160 180-200l50-30-70 70zm-320-30-40 40c-20 20-40 50-40 80-10 40-20 40-20 20-10-20-10-20-30 20l-30 90-10 40v-50c0-80 20-130 90-190 60-60 80-70 80-50zm780 0h-20l10-10 10 10zm210 90c10 80 0 100-10 40-20-100-20-140-10-130l20 90zm-140 0c0 20-10 10-20-10-10-30-20-50-10-60 0-10 10-10 20 20l10 60zm-100 90c10 0 10 10 0 0l-10-10c0-10 10-10 10 10zm170 0 60 20c40 0 50 20 20 20-10 10-40 0-70-10-50-30-70-20-90 0s-20 20-20 0c0-40 50-50 100-30zm0 70c20 30 10 30-20-10l-10-20 30 30zm90 20-20 10c0-10 30-40 40-30l-20 20zm-1060 70c0 70 0 120 30 190h-10c-20-20-20-20-20 0-10 30-30-120-30-170l40-110-10 90zm830-30 10 30c-20 0-70-60-60-80h10l40 50zm110 0c-10 0-20 0-30-20-30-30-20-50 10-20l20 30zm-440-20c-10 20-60 40-140 70-70 20-180 90-180 110l-10 10c-10-10 60-100 100-130l130-50 100-10zm-640 80c30 20 20 30-10 20-50 0-80 10-60 20 10 0-20 20-80 30l-90 40-20 10c-40 10-70 70-50 110 10 30 10 30-10 20-20-30-20-60 0-110s20-50 90-70l120-50c60-30 80-30 110-20zm1110 0c10 10 10 10-10 10l-60-10c-30-10-30-10 10-10l60 10zm-410 100-40 60-30 20c-20 0-20 0 0-30l90-90-20 40zm-690 10c10 10-10 10-60 10-60 0-80 0-60-10h120zm1020 110-30 120c-40 60-50 60-20 0l30-120 10-60 10 60zm-520-30 90 30c40 0 90 20 110 50 40 30 40 40-10 20l-50-30-30-10 10 20c10 20 0 20-60-20l-80-40-10 20-20-10c-10-20-40-30-60-10s-20 20 0 40l20 20h-30l-40-10c-10-10-20 0-30 20-10 30-160 180-200 200-20 0-40 30-40 50-20 40-60 80-70 80-20 0-10-30 10-50l40-50c0-20 20-40 70-70 80-60 130-110 170-170 20-40 40-60 80-80l60-30 70 30zm260 30c10 10 10 10-10 10l-50-10c-10-20-10-20 10-20l50 20zm170 110c-20 30-190 210-210 210l20-20 40-70 60-70c40-20 70-80 90-130 0-30 0-30 10 10l-10 70zm880-70-40 50-20 10c0-20 20-50 50-60 40-20 40-20 10 0zm-1900 20c50 20 80 20 130 20 70 10 70 10 90 40 20 40 20 40-20 60-50 30-90 70-90 90s-10 10-30-10c-10-20-20-20-40-20-30 10-30 0-30-20l-30-30c-30-20-70-90-70-130s10-40 90 0zm1210 140 20 110v40l-10-50c-20-70-50-170-60-140l-10 30-10-20 10-80v-50l20 40 40 120zm710-130-40 30 70-60c10 0 0 20-30 30zm-1380 80-50 20c-20 0-60 30-100 60-60 40-70 50-50 20 40-40 120-100 140-100l50-10c30-20 40-10 10 10zm230 50c-20 10-80-20-110-50l-20-30 70 40 60 40zm-150 20 80 50c30 10 30 20 10 20-30 0-70-20-110-60-60-60-50-60 20-10zm210 10-10 20-10-10 10-10h10zm580 120c60 40 100 90 130 140 20 50 10 60-20 20l-50-60-20-20v20c10 40 0 30-20-20l-60-80c-40-40-20-40 40 0zm-1350 60c10 10-10 40-30 60-30 40-40 40-30 20 0-30 40-90 50-90l10 10zm570 130c40 40 30 40-20 0-50-30-140-120-140-140l60 60 100 80zm-490-90c20 10 20 10-10 10-20 0-30 0-40 30-10 40-10 50 30 40 20 0 20 0 10 10h-80l20-50c10-50 20-60 70-40zm1130 120-10 80c0 30 0 40-10 30-10-20-10-100 10-160 10-50 20-50 20-30l-10 80zm400-10c60 60 130 90 190 80l40 10c-30 20-100 10-140-10-60-30-140-90-140-110-10-20 0-10 50 30zm-70 190-10 150c-20 40-20 40-10-60 0-90 0-140-20-240l10 20c20 30 30 50 30 130zm-530-130c90 40 120 90 150 200l20 60-50-80c-40-70-80-120-160-180-40-40-30-40 40 0zm-120 150c90 50 90 70 10 30l-110-80 100 50zm400 160 60 90c40 50 40 60-10 20-30-30-80-110-80-160-10-50-10-50 30 50zm-300 290-20 30h-10l10-50v-20l20 40zm-380 100-60 20c-10 10-10 10 0 0 0-20 40-40 70-40 20 0 10 10-10 20zm-190 170-10 30c-20 10-20 10-10-10 10-30 20-40 20-20zm40 20c-20 50-10 50 20 50 30-10 30-10-10 10l-50 10 20-60c20-50 40-50 20-10zm1230 390c-10 40-30 60-30 40l30-70-10 30zm50 20-10 40v-60c10-30 10-20 10 20" />
                <path d="M1900 3420c0 40 0 40-30 40h-40v490l40 10c30 0 30 0 30 40l10 40 10-40c0-40 0-40 40-40h30v-500h-30c-40 0-40 0-40-40l-10-40-10 40zm-510 210v50h-70v610l40 10c30 0 30 0 30 40l10 40 10-40c0-30 0-40 20-40 50 0 50 10 50-320v-300h-70v-50l-10-60-10 60zm260 200c0 40 0 40-30 40h-40v260h30c30 0 40 0 40 40l10 40v-40c0-40 0-40 40-40h40v-260h-40c-30 0-30-10-40-40l-10-40v40zm90 380zm1690-250 20 30v-50l-20 20zm80 70c-20 30-10 50 10 20l20-30c0-20-20-10-30 10zm-700 30c-10 20 10 40 20 30v-30h-30zm620 40-10 20c0 20 0 20 20 10l10-30c0-10-10-20-20 0zm60 50c-20 20-30 20-20 30h30c10-10 30-30 50-30l40-20h-30l-70 20zm-620 10c-10 20 20 60 40 50 30 0 30-40 0-50h-40zm500 40c0 20 10 20 30 10 50-20 50-20 10-20l-40 10zm160 0-30 10-50 20c-60 10-110 60-60 60l20 20c10 20 20 30 40 30 30 10 80 50 70 60l-40-20h-50l-30 30c0 30 30 100 50 130 20 20 20 40 20 70l10 70 10 30 10 30c10 30 10 30 40 20l60-50c40-40 40-100 10-140-20-20-20-30 10-40 40-20 50-80 30-110-20-20-20-30 10-60l20-60c0-30-40-70-80-90s-50-20-70-10zm80 270-30 10-50 20c-20 30-30 10 0-20 10-20 60-30 70-10zm-620-220h20l-10-10-10 10zm-410 10c10 20 30 20 30 10l-20-10h-10zm220 20c-40 10-70 50-70 80l-20 30-90-40a5150 5150 0 01 230 180 5100 5100 0 00-280-100c100 70 120 80 110 100v40c-10 20-10 30-40 30-40 10-60 40-60 90v30l-100 20-100 30h420l430-10 20-60 10-50v-80l-20-70c-20-20-60 0-80 40s-30 40-20 0c0-30 0-40-20-50-30-20-70-10-100 10-20 30-30 20 0-20 20-30 60-40 110-10 20 20 30 20 40 10 20-20 0-70-30-100s-40-30-90-30c-40 10-50 0-60-20-40-60-130-90-200-50zm110 30c10 10 10 10-10 10l-60 30-30 20c0-20 20-50 50-60h50zm-110 250c40 10 30 30-10 20-30 0-40 0-50 20-20 30-40 20-20-10 10-20 30-30 60-40l20 10zm250 40 20 30-20-10-50-20c-30 0-40 10-60 30l-20 50c10 20 0 20-20 20l-40 10h-10l30-20 20-40c0-70 100-110 150-60zm70 50c30 20 20 30 0 20h-50c-30 10-40 0-10-20h60zm-760-230 30 10c10-10-10-30-30-30v20" />
                <path d="m2540 4520 30 20 30-10-30-20-30 10" />
              </g>
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
        </div>
        <Script id="splash-hide" src="/scripts/splash-hide.js" strategy="beforeInteractive" />
        {/* All providers consolidated into AppProviders (heavy ones dynamically imported) */}
        <AppProviders>
          <LayoutProviders modal={modal}>
            {children}
            <GamesModalProvider />
            <PWAInstallPrompt />
          </LayoutProviders>
        </AppProviders>

      </body>
    </html>
  );
}
