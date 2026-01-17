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
import "../styles/mobile-scroll-optimization.css"; // Mobile & scroll performance optimizations
import "../styles/smart-mount.css"; // Smart mount/unmount freeze styles
import { cn } from "@/lib/utils";

// ✅ VERCEL ANALYTICS & SPEED INSIGHTS - Track all pages from root layout
// Works with Vercel Free Plan - page views are unlimited, custom events limited to 2,500/month
import { VercelAnalyticsWrapper } from "@/components/VercelAnalyticsWrapper";

// ✅ ENHANCED WEB VITALS - Report Core Web Vitals to Vercel dashboard with bot filtering
import { WebVitalsEnhanced } from "@/components/WebVitalsEnhanced";

// ✅ SEO STRUCTURED DATA - JSON-LD for rich search results (stars, FAQs, courses)
import { AllSEOSchemas } from "@/components/SEOSchemas";

// ✅ ADVANCED SEO - HowTo, Event, Service, Video schemas for Google #1 ranking
import { AdvancedSEO } from "@/components/AdvancedSEO";

// ✅ GOOGLE SEO BOOST - Maximum ranking power with all schema types
import { GoogleSEOBoost } from "@/components/GoogleSEOBoost";

import { ThemeProvider } from "@/context/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StudioProvider } from "@/context/StudioContext";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import { AudioSettingsProvider } from "@/contexts/AudioSettingsProvider";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { RecruitAuthProvider } from "@/contexts/RecruitAuthContext";
import { ViewportStateProvider } from "@/contexts/ViewportStateContext";

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
  // KEYWORDS - 150+ Primary Keywords for SEO (2026 TRENDING)
  // ============================================
  keywords: [
    // Brand Keywords
    "BullMoney", "Bull Money", "BullMoney trading", "BullMoney community",
    
    // Free Trading Mentor Keywords (HIGH PRIORITY)
    "free trading mentor", "free trading mentor 2026", "free trading mentorship",
    "trading mentor free", "best free trading mentor", "find free trading mentor",
    "free mentor for trading", "free forex mentor", "free crypto mentor",
    "free stock mentor", "free day trading mentor", "online trading mentor free",
    
    // Trading Community Keywords (HIGH PRIORITY)
    "trading community", "free trading community", "best trading community",
    "online trading community", "trading community 2026", "join trading community",
    "active trading community", "profitable trading community",
    "day trading community", "swing trading community", "crypto trading community",
    "forex trading community", "stock trading community", "gold trading community",
    
    // Heavy News & Market News Keywords (HIGH PRIORITY)
    "heavy news", "heavy market news", "breaking news trading",
    "market breaking news", "trading news", "trading news today",
    "financial news", "financial news today", "economic news",
    "market news", "market news today", "daily market news",
    
    // Gold & XAUUSD Keywords (HIGH PRIORITY)
    "gold trading", "gold price", "gold price today", "gold analysis",
    "XAUUSD", "XAUUSD trading", "XAUUSD analysis", "XAUUSD price",
    "gold chart", "gold technical analysis", "how to trade gold",
    "gold trading strategy", "gold trading for beginners", "gold setup",
    "gold trade setup", "gold news", "gold news today", "gold forecast",
    
    // Cryptocurrency Keywords (HIGH PRIORITY)
    "bitcoin trading", "bitcoin analysis", "bitcoin price", "BTC trading",
    "ethereum trading", "ETH trading", "crypto trading", "cryptocurrency trading",
    "altcoin trading", "crypto market", "crypto news", "crypto analysis",
    "best crypto to buy", "crypto trading for beginners", "learn crypto trading",
    
    // ============================================
    // 🔥 2026 TRENDING KEYWORDS (HOT SEARCHES)
    // ============================================
    
    // Bitcoin 2026 Trends
    "bitcoin $100k", "BTC $100K", "bitcoin price prediction 2026",
    "bitcoin supercycle", "bitcoin mining 2026", "bitcoin halving effect",
    "bitcoin ETF", "bitcoin institutional adoption", "bitcoin price target",
    
    // Ethereum 2026 Trends
    "ETH $15000", "ethereum 2026 prediction", "ethereum staking",
    "ETH staking rewards", "ethereum supercycle", "ethereum price target 2026",
    
    // Tokenization Trends (HOT in 2026)
    "tokenized stocks", "tokenized gold", "tokenized assets",
    "RWA crypto", "real world assets crypto", "tokenization 2026",
    
    // Stablecoin Trends
    "stablecoin news", "stablecoin payments", "USDC", "USDT",
    "stablecoin regulation 2026", "crypto payments",
    
    // Fed & Interest Rate Keywords (HOT)
    "fed rate cut 2026", "interest rate decision", "FOMC meeting",
    "fed chair news", "federal reserve 2026", "inflation news 2026",
    "rate cut prediction", "monetary policy 2026",
    
    // AI + Crypto Trends (HOT)
    "AI crypto", "AI trading", "AI trading bot", "AI crypto coins",
    "artificial intelligence trading", "machine learning trading",
    
    // Prop Trading 2026
    "prop firm 2026", "funded trader 2026", "FTMO 2026",
    "best prop firm 2026", "prop firm challenge strategy",
    
    // Silver & Precious Metals (TRENDING)
    "silver price", "silver trading", "silver 2026", "silver analysis",
    "precious metals trading", "gold vs silver", "silver price prediction",
    
    // Solana & Altcoins (HOT)
    "solana trading", "SOL price", "XRP news", "XRP price",
    "altcoin season 2026", "best altcoins 2026", "meme coins 2026",
    
    // Forex Keywords
    "forex trading", "forex analysis", "forex for beginners", "how to trade forex",
    "EURUSD", "GBPUSD", "USDJPY", "forex community", "forex mentor",
    
    // Stock Market Keywords (2026)
    "stock trading", "stock market", "S&P 500", "Nasdaq", "day trading",
    "swing trading", "stock analysis", "stock trading for beginners",
    "S&P 500 7000", "Nasdaq 2026", "stock market prediction 2026",
    "tech stocks 2026", "AI stocks 2026", "Nvidia stock",
    
    // Trading Education Keywords
    "trading for beginners", "trading for beginners 2026", "how to start trading",
    "learn to trade", "learn trading free", "trading basics",
    "trading course", "trading course free", "free trading course",
    "trading education", "trading school", "trading academy",
    
    // Prop Firm Keywords
    "prop firm", "prop trading", "funded trader", "funded account",
    "prop firm challenge", "FTMO", "FTMO challenge", "pass prop firm",
    
    // Technical Analysis Keywords
    "technical analysis", "chart analysis", "price action",
    "support and resistance", "candlestick patterns", "chart patterns",
    
    // Trading Discord & Telegram
    "trading discord", "best trading discord", "free trading discord",
    "trading telegram", "crypto discord", "forex discord",
    
    // Trading Tools
    "TradingView", "trading charts", "economic calendar",
    
    // Crypto Regulation & Policy (HOT 2026)
    "crypto regulation 2026", "crypto bill", "SEC crypto",
    "crypto tax 2026", "crypto policy", "bitcoin regulation",
    
    // 2026 Keywords
    "trading 2026", "best trading strategy 2026", "crypto 2026", "gold 2026",
    "market outlook 2026", "investment 2026", "where to invest 2026",
    
    // ============================================
    // 🔥 VIRAL WEALTH & FAMOUS TRADER KEYWORDS (2020-2027)
    // ============================================
    
    // Famous Traders & Success Stories
    "how traders get rich", "rich trader secrets", "millionaire trader",
    "how to become rich trading", "trading millionaire", "trading billionaire",
    "famous traders", "best traders in the world", "top traders 2026",
    "successful traders", "profitable trader secrets", "trader lifestyle",
    
    // Get Rich Trading Keywords (HIGH INTENT)
    "make money trading", "make money from home trading", "quit job trading",
    "trading for a living", "full time trader", "trading income",
    "passive income trading", "trading side hustle", "make $1000 a day trading",
    "how much can you make trading", "trading profit", "trading gains",
    "100x crypto", "1000x gains", "turn $100 into $10000",
    
    // Viral Trading Trends 2020-2027
    "GME squeeze", "meme stocks", "wallstreetbets", "WSB",
    "dogecoin millionaire", "shiba millionaire", "crypto millionaire",
    "bitcoin millionaire", "NFT millionaire", "trading tiktok",
    "trading youtube", "trading influencer", "fintwit",
    
    // Trading Lifestyle & Motivation
    "trader motivation", "trading success story", "rags to riches trading",
    "financial freedom trading", "escape 9 to 5 trading", "work from anywhere trading",
    "laptop lifestyle trading", "trading from phone", "mobile trading",
    
    // Wealth Building Keywords
    "build wealth trading", "generational wealth", "compound gains",
    "grow account trading", "small account trading", "$100 to $10000",
    "flip money", "double your money", "trading challenge",
    
    // Year-Specific Viral Keywords
    "trading 2020", "trading 2021", "trading 2022", "trading 2023",
    "trading 2024", "trading 2025", "trading 2027",
    "best trades 2026", "biggest gains 2026", "best investments 2026",
    "crypto bull run 2024", "crypto bull run 2025", "next bull run",
    
    // Beginner Success Keywords
    "beginner made money trading", "started trading with $100",
    "first profitable trade", "new trader success", "trading changed my life",
    "trading transformation", "from broke to rich trading"
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
      { url: "/BULL.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-180x180.png", sizes: "180x180", type: "image/png" },
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
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney - Free Trading Community for Crypto, Gold & Forex",
      },
    ],
    locale: "en_US",
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
    images: ["/BULL.svg"],
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
  // ALTERNATES & CANONICAL
  // ============================================
  alternates: {
    canonical: "https://www.bullmoney.shop",
    languages: {
      "en-US": "https://www.bullmoney.shop",
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
  var isMac = /macintosh|mac os x/i.test(ua);
  var isDesktop = !(/mobi|android|iphone|ipad/i.test(ua));
  var isWindows = /windows/i.test(ua);
  var isLinux = /linux/i.test(ua) && !(/android/i.test(ua));
  var isBigScreen = window.innerWidth >= 769;
  
  // CRITICAL: Desktop scroll initialization - MUST run early
  if (isDesktop && isBigScreen) {
    var html = document.documentElement;
    var body = document.body;
    
    // Add desktop classes
    html.classList.add('desktop-optimized', 'mouse-device', 'non-touch-device');
    
    // CRITICAL: Force scroll to work on desktop
    html.style.height = 'auto';
    html.style.overflowY = 'scroll';
    html.style.overflowX = 'hidden';
    html.style.scrollBehavior = 'auto';
    html.style.scrollSnapType = 'none';
    html.style.overscrollBehavior = 'auto';
    
    // Body must not constrain scrolling
    body.style.height = 'auto';
    body.style.overflowY = 'visible';
    body.style.overflowX = 'hidden';
    body.style.overscrollBehavior = 'auto';
    
    console.log('[DesktopScroll] Desktop scroll fixes applied early');
    
    if (window.innerWidth >= 1440) {
      html.classList.add('big-display');
      console.log('[DesktopScroll] Big display detected');
    }
  }
  
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
  
  // CRITICAL: macOS desktop scroll fixes - applied early
  if (isMac && isDesktop) {
    document.documentElement.classList.add('macos', 'desktop-optimized');
    // Ensure scrolling works with trackpad
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.overflowY = 'scroll';
    console.log('[MacFix] macOS desktop detected, trackpad scroll enabled');
  }
  
  // Desktop detection for non-touch devices
  if (isDesktop) {
    document.documentElement.classList.add('desktop-optimized');
    var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      document.documentElement.classList.add('mouse-device', 'non-touch-device');
    }
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
        
        // Set CSS variables immediately - comprehensive theme coverage
        document.documentElement.style.setProperty('--accent-color', themeData.accentColor);
        document.documentElement.style.setProperty('--accent-rgb', r + ', ' + g + ', ' + b);
        document.documentElement.style.setProperty('--theme-accent-light', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.25)');
        document.documentElement.style.setProperty('--theme-accent-dark', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.5)');
        document.documentElement.style.setProperty('--theme-accent-glow', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.4)');
        document.documentElement.style.setProperty('--theme-accent-subtle', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.1)');
        document.documentElement.style.setProperty('--theme-accent-border', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.3)');
        document.documentElement.setAttribute('data-active-theme', themeData.id || 'bullmoney-blue');
        document.documentElement.setAttribute('data-theme-category', themeData.category || 'SPECIAL');
        
        console.log('[EarlyTheme] Applied:', themeData.id, themeData.accentColor);
      }
    } else {
      // Set default theme attribute so CSS selectors work
      document.documentElement.setAttribute('data-active-theme', 'bullmoney-blue');
      // Set default blue theme variables
      document.documentElement.style.setProperty('--accent-color', '#3b82f6');
      document.documentElement.style.setProperty('--accent-rgb', '59, 130, 246');
    }
  } catch (e) {
    // Set default on error
    document.documentElement.setAttribute('data-active-theme', 'bullmoney-blue');
    document.documentElement.style.setProperty('--accent-color', '#3b82f6');
    document.documentElement.style.setProperty('--accent-rgb', '59, 130, 246');
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
              <ViewportStateProvider>
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
              </ViewportStateProvider>
            </GlobalThemeProvider>
          </ThemeProvider>
          </CacheManagerProvider>
        </ErrorBoundary>
        
        {/* ✅ VERCEL TRACKING - Enhanced Analytics & Speed Insights
            - Analytics: Tracks page views (unlimited on free plan)
            - SpeedInsights: Tracks Core Web Vitals (LCP, FID, CLS, TTFB, INP)
            - WebVitalsEnhanced: Additional metrics + bot filtering
            
            Free Plan Limits:
            - Page views: Unlimited
            - Custom events: 2,500/month
            - Speed Insights: Included
        */}
        <VercelAnalyticsWrapper />
        <WebVitalsEnhanced />
        
        {/* ✅ SEO STRUCTURED DATA - JSON-LD Schemas for Rich Search Results
            - Organization: Brand info + social links
            - Website: Site search capability
            - FAQ: Rich FAQ snippets
            - Course: Trading education schema
            - LocalBusiness: Rating stars
            - Software: App schema
        */}
        <AllSEOSchemas />
        
        {/* ✅ ADVANCED SEO - Additional schemas for Google #1 ranking
            - HowTo: "How to start trading" rich snippets
            - Event: Live trading sessions
            - Service: Mentorship service
            - Video: Trading tutorials
            - Review: Star ratings
            - ItemList: Market coverage
        */}
        <AdvancedSEO />
        
        {/* ✅ GOOGLE SEO BOOST - Maximum ranking power
            - Breadcrumb: Site navigation structure
            - CollectionPage: Blog/news sections
            - FinancialService: Trading mentorship
            - LearningResource: Education content
            - Speakable: Voice search optimization
            - WebsiteSearch: Site search action
            - SoftwareApp: Trading platform schema
            - NewsArticleList: News section schema
        */}
        <GoogleSEOBoost />
      </body>
    </html>
  );
}
