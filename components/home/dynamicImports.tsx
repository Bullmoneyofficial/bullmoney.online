import dynamic from "next/dynamic";
import {
  HeroSkeleton,
  MinimalFallback,
  ContentSkeleton,
  CardSkeleton,
} from "@/components/MobileLazyLoadingFallback";

// ==========================================
// ✅ PERFORMANCE OPTIMIZED: Priority-based lazy loading for Turbopack
// Webpack magic comments removed - not compatible with Turbopack
// ==========================================

// HIGH PRIORITY - Visible immediately on page load
export const Hero = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.Hero })),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

export const HeroDesktop = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.HeroDesktop })),
  { ssr: false }
);

export const PageMode = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.PageMode })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const TradingUnlockLoader = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.TradingUnlockLoader })),
  { 
    ssr: false, 
    loading: () => <MinimalFallback />,
  }
);

// MEDIUM PRIORITY - Above the fold or near top
export const MetaTraderQuotes = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.MetaTraderQuotes })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const Features = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.Features })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const BullMoneyCommunity = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.BullMoneyCommunity })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const BreakingNewsTicker = dynamic(
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.BreakingNewsTicker })),
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
  () => import("@/components/home/bundles/aboveFold").then(mod => ({ default: mod.TradingViewDashboard })),
  { ssr: false, loading: () => <TradingViewDashboardSkeleton /> }
);

// LOW PRIORITY - Below the fold, load on demand
export const BullMoneyPromoScroll = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.BullMoneyPromoScroll })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const LiveMarketTicker = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.LiveMarketTickerOptimized })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const TestimonialsCarousel = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.TestimonialsCarousel })),
  { ssr: true, loading: () => <CardSkeleton /> }
);

export const BrokerSignupSectionDark = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.BrokerSignupSectionDark })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

export const FooterComponent = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.FooterComponent })),
  { ssr: false }
);

// UTILITY COMPONENTS - Loaded as needed
export const SplineSkeleton = dynamic(
  () => import( "@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.SplineSkeleton })),
  { ssr: true }
);

export const LoadingSkeleton = dynamic(
  () => import( "@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.LoadingSkeleton })),
  { ssr: true }
);

// HEAVY COMPONENTS - Desktop only, deferred loading
export const HeroScrollDemo = dynamic(
  () => import("@/components/home/bundles/heavy").then(mod => ({ default: mod.HeroScrollDemo })),
  { ssr: false }
);

export const TradingQuickAccess = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.TradingQuickAccess })),
  { ssr: false }
);

export const HiddenYoutubePlayer = dynamic(
  () => import("@/components/home/bundles/belowFold").then(mod => ({ default: mod.HiddenYoutubePlayer })),
  { ssr: false }
);

export const DraggableSplit = dynamic(
  () => import("@/components/home/bundles/heavy").then(mod => ({ default: mod.DraggableSplit })),
  { ssr: true, loading: () => <ContentSkeleton lines={5} /> }
);

export const SplineScene = dynamic(
  () => import("@/components/home/bundles/heavy").then(mod => ({ default: mod.SplineScene })),
  { ssr: true, loading: () => <ContentSkeleton lines={4} /> }
);

// MODALS - Only loaded when opened
export const CookieConsent = dynamic(
  () => import( '@/components/CookieConsent'),
  { ssr: false }
);

export const AppSupportButton = dynamic(
  () => import( '@/components/shop/StoreSupportButton').then(m => ({ default: m.AppSupportButton })),
  { ssr: false }
);
