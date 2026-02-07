import dynamic from "next/dynamic";
import {
  HeroSkeleton,
  MinimalFallback,
  ContentSkeleton,
  CardSkeleton,
} from "@/components/MobileLazyLoadingFallback";

// ==========================================
// ✅ PERFORMANCE OPTIMIZED: Priority-based lazy loading with webpack magic comments
// ==========================================

// HIGH PRIORITY - Visible immediately on page load
export const Hero = dynamic(
  () => import(/* webpackChunkName: "hero", webpackPrefetch: true */ "@/components/hero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

export const HeroDesktop = dynamic(
  () => import(/* webpackChunkName: "hero-desktop", webpackPrefetch: true */ "@/components/HeroDesktop"),
  { ssr: false }
);

export const PageMode = dynamic(
  () => import(/* webpackChunkName: "pagemode" */ "@/components/REGISTER USERS/pagemode"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const TradingUnlockLoader = dynamic(
  () => import(/* webpackChunkName: "loader" */ "@/components/MultiStepLoaderv3Simple"),
  { 
    ssr: false, 
    loading: () => <MinimalFallback />,
  }
);

// MEDIUM PRIORITY - Above the fold or near top
export const MetaTraderQuotes = dynamic(
  () => import(/* webpackChunkName: "mt-quotes" */ "@/components/MetaTraderQuotes"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const Features = dynamic(
  () => import(/* webpackChunkName: "features" */ "@/components/features").then(mod => ({ default: mod.Features })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const BullMoneyCommunity = dynamic(
  () => import(/* webpackChunkName: "community-feed" */ "@/components/BullMoneyCommunity"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const BreakingNewsTicker = dynamic(
  () => import(/* webpackChunkName: "breaking-news" */ "@/components/BreakingNewsTicker"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const TradingViewDashboardSkeleton = () => (
  <div className="w-full bg-black rounded-xl border border-[#1a1a1a] overflow-hidden" style={{ minHeight: 600 }}>
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a1a]">
      <div className="w-7 h-7 rounded bg-[#111] animate-pulse" />
      <div className="h-4 w-28 rounded bg-[#111] animate-pulse" />
    </div>
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a1a] overflow-x-auto">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-7 w-16 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse shrink-0" />
      ))}
    </div>
    <div className="w-full h-[46px] bg-[#060606] border-b border-[#1a1a1a] animate-pulse" />
    <div className="w-full flex-1 bg-black" style={{ height: 450 }}>
      <div className="w-full h-full bg-[#060606] animate-pulse" />
    </div>
  </div>
);

export const TradingViewDashboard = dynamic(
  () => import(/* webpackChunkName: "tv-dashboard" */ "@/components/TradingViewDashboard"),
  { ssr: false, loading: () => <TradingViewDashboardSkeleton /> }
);

// LOW PRIORITY - Below the fold, load on demand
export const BullMoneyPromoScroll = dynamic(
  () => import(/* webpackChunkName: "promo-scroll" */ "@/components/BullMoneyPromoScroll"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const LiveMarketTicker = dynamic(
  () => import(/* webpackChunkName: "ticker" */ "@/components/LiveMarketTickerOptimized").then(mod => ({ default: mod.LiveMarketTickerOptimized })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const TestimonialsCarousel = dynamic(
  () => import(/* webpackChunkName: "testimonials" */ '@/components/Testimonial').then(mod => ({ default: mod.TestimonialsCarousel })),
  { ssr: true, loading: () => <CardSkeleton /> }
);

export const FooterComponent = dynamic(
  () => import(/* webpackChunkName: "footer" */ "@/components/Mainpage/footer").then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

// UTILITY COMPONENTS - Loaded as needed
export const SplineSkeleton = dynamic(
  () => import(/* webpackChunkName: "loading-skeleton" */ "@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.SplineSkeleton })),
  { ssr: true }
);

export const LoadingSkeleton = dynamic(
  () => import(/* webpackChunkName: "loading-skeleton" */ "@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.LoadingSkeleton })),
  { ssr: true }
);

// HEAVY COMPONENTS - Desktop only, deferred loading
export const HeroScrollDemo = dynamic(
  () => import(/* webpackChunkName: "hero-scroll" */ "@/components/HeroScrollDemo").then(mod => ({ default: mod.HeroScrollDemo })),
  { ssr: false }
);

export const TradingQuickAccess = dynamic(
  () => import(/* webpackChunkName: "trading-quick-access" */ "@/components/TradingQuickAccess").then(mod => ({ default: mod.default })),
  { ssr: false }
);

export const HiddenYoutubePlayer = dynamic(
  () => import(/* webpackChunkName: "youtube-player" */ "@/components/Mainpage/HiddenYoutubePlayer"),
  { ssr: false }
);

export const DraggableSplit = dynamic(
  () => import(/* webpackChunkName: "draggable-split" */ '@/components/DraggableSplit'),
  { ssr: true, loading: () => <ContentSkeleton lines={5} /> }
);

export const SplineScene = dynamic(
  () => import(/* webpackChunkName: "spline-scene" */ '@/components/SplineScene'),
  { ssr: true, loading: () => <ContentSkeleton lines={4} /> }
);

// MODALS - Only loaded when opened
export const CookieConsent = dynamic(
  () => import(/* webpackChunkName: "cookie-consent" */ '@/components/CookieConsent'),
  { ssr: false }
);

export const AppSupportButton = dynamic(
  () => import(/* webpackChunkName: "support-button" */ '@/components/shop/StoreSupportButton').then(m => ({ default: m.AppSupportButton })),
  { ssr: false }
);
