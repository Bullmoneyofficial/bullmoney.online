'use client';

/**
 * _lazy/store-dynamics.tsx
 *
 * All next/dynamic() imports for the Store page, consolidated in one place.
 * Priority ordering matches actual render sequence — highest priority first.
 */

import dynamic from 'next/dynamic';

// ─── Gate / Auth ──────────────────────────────────────────────────────────────

export const TelegramUnlockScreen = dynamic(
  () =>
    import('@/components/signups/TelegramConfirmationStoreResponsive').then((mod) => ({
      default: mod.TelegramConfirmationStoreResponsive,
    })),
  {
    ssr: false,
    loading: () => (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#ffffff' }} />
    ),
  }
);

// ─── Product grid building blocks ─────────────────────────────────────────────

export const ProductCard = dynamic(
  () => import('@/components/shop/ProductCard').then((m) => ({ default: m.ProductCard })),
  { ssr: false, loading: () => <div className="bg-white/5 animate-pulse aspect-3/4 rounded-2xl" /> }
);

export const AnimatedProductGrid = dynamic(
  () => import('@/components/shop/AnimatedProductGrid').then((m) => m.AnimatedProductGrid),
  { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const CircularProductGrid = dynamic(
  () => import('@/components/shop/CircularProductGrid').then((m) => m.CircularProductGrid),
  { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const GlassProductGrid = dynamic(
  () => import('@/components/shop/GlassProductGrid').then((m) => m.GlassProductGrid),
  { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const ProductsCarousel = dynamic(
  () => import('@/components/shop/ProductsCarousel').then((m) => m.ProductsCarousel),
  { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

// ─── Search ───────────────────────────────────────────────────────────────────

export const SearchAutocomplete = dynamic(
  () => import('@/components/shop/SearchAutocomplete').then((m) => ({ default: m.SearchAutocomplete })),
  { ssr: false, loading: () => null }
);

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const CryptoCheckoutTrigger = dynamic(
  () => import('@/components/shop/CryptoCheckoutInline').then((m) => ({ default: m.CryptoCheckoutTrigger })),
  { ssr: false, loading: () => null }
);

// ─── Hero media ───────────────────────────────────────────────────────────────

export const SplineBackground = dynamic(() => import('@/components/SplineBackground'), {
  ssr: false,
  loading: () => null,
});

export const WorldMapPlaceholder = dynamic(
  () => import('@/components/ui/world-map-placeholder').then((m) => ({ default: m.WorldMapPlaceholder })),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);

export const WorldMap = dynamic(() => import('@/components/ui/world-map'), {
  ssr: false,
  loading: () => <WorldMapPlaceholder className="h-full w-full" />,
});

// ─── Nav ──────────────────────────────────────────────────────────────────────

export const StorePillNav = dynamic(
  () => import('@/components/store/StorePillNav').then((m) => ({ default: m.StorePillNav })),
  { ssr: false, loading: () => null }
);

// ─── Store-specific sections ──────────────────────────────────────────────────

export const PrintProductsSection = dynamic(
  () => import('@/components/shop/PrintProductsSection').then((m) => ({ default: m.PrintProductsSection })),
  { ssr: false, loading: () => <div className="h-80 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);

export const DigitalArtSection = dynamic(
  () => import('@/components/shop/DigitalArtSection').then((m) => ({ default: m.DigitalArtSection })),
  { ssr: false, loading: () => <div className="h-80 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);

export const PrintDesignStudio = dynamic(
  () => import('@/components/shop/PrintDesignStudio').then((m) => ({ default: m.PrintDesignStudio })),
  { ssr: false }
);

export const StoreAboutTimeline = dynamic(
  () => import('@/components/shop/StoreAboutTimeline').then((m) => ({ default: m.StoreAboutTimeline })),
  { ssr: false, loading: () => <div className="h-80 w-full bg-white" /> }
);

export const BrokerSignupSection = dynamic(
  () => import('@/components/shop/BrokerSignupSection').then((m) => ({ default: m.BrokerSignupSection })),
  { ssr: false, loading: () => <div className="h-80 w-full bg-[#FBFBFD]" /> }
);

// ─── Page-section widgets (from PageSections barrel) ─────────────────────────

export const ToastProvider = dynamic(
  () => import('@/app/PageSections').then((mod) => mod.ToastProvider),
  { ssr: false, loading: () => null }
);

export const QuotesSection = dynamic(
  () => import('@/app/PageSections').then((mod) => mod.QuotesSection),
  { ssr: false, loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const BreakingNewsSection = dynamic(
  () => import('@/app/PageSections').then((mod) => mod.BreakingNewsSection),
  { ssr: false, loading: () => <div className="h-32 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const TelegramSection = dynamic(
  () => import('@/app/PageSections').then((mod) => mod.TelegramSection),
  { ssr: false, loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

// ─── Shared widgets ───────────────────────────────────────────────────────────

export const MetaTraderQuotes = dynamic(() => import('@/components/MetaTraderQuotes'), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" />,
});

export const BreakingNewsTicker = dynamic(() => import('@/components/BreakingNewsTicker'), {
  ssr: false,
  loading: () => <div className="h-32 w-full animate-pulse rounded-2xl bg-black/5" />,
});

export const BullMoneyCommunity = dynamic(() => import('@/components/BullMoneyCommunity'), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" />,
});

export const Features = dynamic(
  () => import('@/components/features').then((mod) => ({ default: mod.Features })),
  { ssr: false, loading: () => <div className="h-60 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const TestimonialsCarousel = dynamic(
  () =>
    import('@/components/Testimonial').then((mod) => ({
      default: mod.TestimonialsCarousel,
    })),
  { ssr: false, loading: () => <div className="h-60 w-full animate-pulse rounded-2xl bg-black/5" /> }
);

export const FooterComponent = dynamic(
  () => import('@/components/Mainpage/footer').then((mod) => ({ default: mod.Footer })),
  { ssr: false }
);

export const MultiStepLoaderV2 = dynamic(
  () => import('@/components/Mainpage/MultiStepLoaderv2'),
  { ssr: false }
);

// ─── Lazy side-effect: showcase scroll ───────────────────────────────────────

export const LazyShowcaseScroll = dynamic(
  () =>
    import('@/hooks/useShowcaseScroll').then((mod) => ({
      default: function ShowcaseScrollEffect(props: {
        startDelay: number;
        enabled: boolean;
        pageId: string;
      }) {
        mod.useShowcaseScroll(props);
        return null;
      },
    })),
  { ssr: false }
);
