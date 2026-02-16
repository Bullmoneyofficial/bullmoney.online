'use client';

import { useCallback, useEffect, useMemo, useRef, useState, startTransition, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, CreditCard, X } from 'lucide-react';
import type { ProductWithDetails, PaginatedResponse, ProductFilters } from '@/types/store';
// ✅ HYDRATION OPTIMIZATION: Import deferred utilities
import { useHydrated, useIdleCallback } from '@/hooks/useHydrationOptimization';
// ✅ LAZY: forceEnableScrolling (342 lines) loaded via import() in useEffect

// ✅ PERF: ProductCard (1,279 lines + framer-motion) lazy-loaded — not needed at compile time
const ProductCard = dynamic(
  () => import('@/components/shop/ProductCard').then(m => ({ default: m.ProductCard })),
  { ssr: false, loading: () => <div className="bg-white/5 animate-pulse aspect-3/4 rounded-2xl" /> }
);
const SearchAutocomplete = dynamic(
  () => import('@/components/shop/SearchAutocomplete').then(m => ({ default: m.SearchAutocomplete })),
  { ssr: false, loading: () => null }
);
const CryptoCheckoutTrigger = dynamic(
  () => import('@/components/shop/CryptoCheckoutInline').then(m => ({ default: m.CryptoCheckoutTrigger })),
  { ssr: false, loading: () => null }
);
const WorldMapPlaceholder = dynamic(
  () => import('@/components/ui/world-map-placeholder').then(m => ({ default: m.WorldMapPlaceholder })),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);
const PrintProductsSection = dynamic(
  () => import('@/components/shop/PrintProductsSection').then(m => ({ default: m.PrintProductsSection })),
  { ssr: false, loading: () => <div className="h-80 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);
const DigitalArtSection = dynamic(
  () => import('@/components/shop/DigitalArtSection').then(m => ({ default: m.DigitalArtSection })),
  { ssr: false, loading: () => <div className="h-80 w-full rounded-2xl bg-black/5 animate-pulse" /> }
);
const PrintDesignStudio = dynamic(
  () => import('@/components/shop/PrintDesignStudio').then(m => ({ default: m.PrintDesignStudio })),
  { ssr: false }
);

// ✅ LAZY: useShowcaseScroll (461 lines) converted to lazy effect component — side-effect only
const LazyShowcaseScroll = dynamic(() => import("@/hooks/useShowcaseScroll").then(mod => ({
  default: function ShowcaseScrollEffect(props: { startDelay: number; enabled: boolean; pageId: string }) {
    mod.useShowcaseScroll(props);
    return null;
  }
})), { ssr: false });

// ✅ PERF: Sample data lazy-loaded — only needed when sections render
let _cachedPrintProducts: any[] | null = null;
let _cachedDigitalArt: any[] | null = null;
const getSamplePrintProducts = () => {
  if (!_cachedPrintProducts) {
    import('@/components/shop/PrintProductsSection').then(m => { _cachedPrintProducts = m.SAMPLE_PRINT_PRODUCTS; });
  }
  return _cachedPrintProducts || [];
};
const getSampleDigitalArt = () => {
  if (!_cachedDigitalArt) {
    import('@/components/shop/DigitalArtSection').then(m => { _cachedDigitalArt = m.SAMPLE_DIGITAL_ART; });
  }
  return _cachedDigitalArt || [];
};


// Heavy grid components — lazy loaded since user may not use dynamic variants
const AnimatedProductGrid = dynamic(() => import('@/components/shop/AnimatedProductGrid').then(m => m.AnimatedProductGrid), { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> });
const CircularProductGrid = dynamic(() => import('@/components/shop/CircularProductGrid').then(m => m.CircularProductGrid), { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> });
const GlassProductGrid = dynamic(() => import('@/components/shop/GlassProductGrid').then(m => m.GlassProductGrid), { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> });
const ProductsCarousel = dynamic(() => import('@/components/shop/ProductsCarousel').then(m => m.ProductsCarousel), { ssr: false, loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-black/5" /> });
const StorePillNav = dynamic(
  () => import('@/components/store/StorePillNav').then(m => ({ default: m.StorePillNav })),
  { ssr: false, loading: () => null }
);
import { useStoreSection } from './StoreMemoryContext';
import { buildUrlParams, hasActiveFilters as checkActiveFilters } from './store.utils';
import { SORT_OPTIONS, CATEGORIES } from './store.config';
import { useCartStore } from '@/stores/cart-store';
import { useProductsModalUI } from '@/contexts/UIStateHook';
import { useHeroMode } from '@/hooks/useHeroMode';
import type { HeroMode } from '@/hooks/useHeroMode';
import { isMobileDevice } from '@/lib/mobileDetection';
import { userStorage } from '@/lib/smartStorage';

// ✅ PERF: SoundEffects lazy-loaded — audio not needed at compile time
const playSoundEffect = (effect: 'click') => {
  import('@/app/hooks/useSoundEffects').then(m => m.SoundEffects.play(effect)).catch(() => {});
};
const clickSound = () => {
  import('@/app/hooks/useSoundEffects').then(m => m.SoundEffects.click()).catch(() => {});
};

function DeferredMount({
  children,
  rootMargin = '400px',
  fallback = null,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  fallback?: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ready, rootMargin]);

  return (
    <div ref={hostRef} style={{ contentVisibility: ready ? 'visible' : 'auto', containIntrinsicSize: 'auto 600px' }}>
      {ready ? children : fallback}
    </div>
  );
}

function StoreNetworkShowcase() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [postIndex, setPostIndex] = useState(0);

  const PLATFORM_ICONS: Record<string, string> = {
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    tiktok: 'M9 3v11.5a3.5 3.5 0 11-2.5-3.36V7.5c0-.69.56-1.25 1.25-1.25H9zm6.25 1.25c.82 1.36 2.25 2.22 3.75 2.5v2.44c-1.74-.2-3.34-.96-4.5-2.12v7.98a4.5 4.5 0 11-4.5-4.5c.35 0 .7.04 1.03.12V9.6c-.34-.05-.68-.08-1.03-.08a3 3 0 103 3v-9.3h1.25z',
    youtube: 'M19.615 3.184c-3.604-.246-7.226-.246-10.83 0-3.898.266-4.356 2.62-4.356 8.816 0 6.196.458 8.55 4.356 8.816 3.604.246 7.226.246 10.83 0 3.898-.266 4.356-2.62 4.356-8.816 0-6.196-.458-8.55-4.356-8.816zM9.75 15.02V8.98l5.5 3.02-5.5 3.02z',
  };

  const platformLabel = (platform?: string) => {
    if (!platform) return 'Network';
    if (platform === 'instagram') return 'Instagram';
    if (platform === 'tiktok') return 'TikTok';
    if (platform === 'youtube') return 'YouTube';
    return 'Network';
  };

  const accountDisplay = (account: any) => {
    const handle = account?.handle?.replace(/^@/, "");
    if (handle) return `@${handle}`;
    return account?.label || 'Network';
  };

  const resolveProfileUrl = (account: any) => {
    if (account?.profileUrl) return account.profileUrl;
    const handle = account?.handle?.replace(/^@/, "");
    if (!handle) return null;
    if (account.platform === 'instagram') return `https://instagram.com/${handle}`;
    if (account.platform === 'tiktok') return `https://www.tiktok.com/@${handle}`;
    if (account.platform === 'youtube') return `https://www.youtube.com/@${handle}`;
    return null;
  };

  const fetchAccounts = useCallback(() => {
    fetch('/api/network')
      .then((r) => r.json())
      .then((json) => {
        setAccounts(json.accounts || []);
      })
      .catch(() => {
        setAccounts([]);
      });
  }, []);

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 60_000);
    return () => clearInterval(interval);
  }, [fetchAccounts]);

  const activeAccount = accounts[activeTab];
  const activePosts = activeAccount?.posts || [];
  const hasRealPosts = activePosts.some((post: any) => !post.isExample);
  const placeholderPosts = useMemo(() => (
    Array.from({ length: 3 }).map((_, index) => ({ id: `placeholder-${index}`, isPlaceholder: true }))
  ), []);
  const visiblePosts = useMemo(() => {
    if (hasRealPosts) {
      return activePosts.filter((post: any) => !post.isExample);
    }
    return placeholderPosts;
  }, [activePosts, hasRealPosts, placeholderPosts]);
  const activeIcon = PLATFORM_ICONS[activeAccount?.platform || 'instagram'] || PLATFORM_ICONS.instagram;
  const activeProfileUrl = resolveProfileUrl(activeAccount);
  const activeDisplay = accountDisplay(activeAccount);
  const activePlatform = platformLabel(activeAccount?.platform);

  useEffect(() => {
    setPostIndex(0);
  }, [activeTab]);

  useEffect(() => {
    if (postIndex >= visiblePosts.length) setPostIndex(0);
  }, [postIndex, visiblePosts.length]);

  useEffect(() => {
    if (visiblePosts.length <= 1) return;
    const interval = setInterval(() => {
      setPostIndex((prev) => (prev + 1) % visiblePosts.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [visiblePosts.length]);

  const handlePrev = useCallback(() => {
    if (visiblePosts.length <= 1) return;
    setPostIndex((prev) => (prev - 1 + visiblePosts.length) % visiblePosts.length);
  }, [visiblePosts.length]);

  const handleNext = useCallback(() => {
    if (visiblePosts.length <= 1) return;
    setPostIndex((prev) => (prev + 1) % visiblePosts.length);
  }, [visiblePosts.length]);

  return (
    <section
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 700px',
      }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  Network drop
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Network drops.</h2>
                <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: 'rgba(0,0,0,0.6)' }}>
                  Fresh visuals from the BullMoney network across Instagram, TikTok, and YouTube.
                </p>
              </div>
            </div>
            {activeProfileUrl ? (
              <a
                href={activeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Open {activePlatform}
              </a>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {accounts.map((account: any, index: number) => {
              const isActive = index === activeTab;
              return (
                <button
                  key={account.id || `${account.platform}-${index}`}
                  onClick={() => setActiveTab(index)}
                  className="relative rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? '#111111' : '#ffffff',
                    border: `1px solid ${isActive ? '#111111' : 'rgba(0,0,0,0.12)'}`,
                    color: isActive ? '#ffffff' : 'rgba(0,0,0,0.7)',
                  }}
                >
                  <span className="flex items-center gap-2">{accountDisplay(account)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white" style={{ boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
              {visiblePosts[postIndex]?.isPlaceholder ? (
                activeProfileUrl ? (
                  <a
                    href={activeProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[420px] items-center justify-center"
                  >
                    <div className="text-center">
                      <p className="text-sm font-semibold text-black">{activeDisplay}</p>
                      <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                        View on {activePlatform}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center">
                    <div className="text-center">
                      <p className="mt-3 text-sm font-semibold text-black">No network posts yet</p>
                      <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                        Add embeds in Admin Hub → Network
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <iframe
                  key={visiblePosts[postIndex]?.id}
                  src={visiblePosts[postIndex]?.embedUrl}
                  className="w-full border-0"
                  style={{ minHeight: '480px', background: '#ffffff' }}
                  loading="lazy"
                  scrolling="no"
                  title={`Network post from ${activeDisplay}`}
                />
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                  disabled={visiblePosts.length <= 1}
                >
                  Prev
                </button>
                <div className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  {visiblePosts.length ? `${postIndex + 1} / ${visiblePosts.length}` : '0 / 0'}
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                  disabled={visiblePosts.length <= 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div
            className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3"
          >
            <span className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
              Network links
            </span>
            {accounts.map((account: any) => {
              const link = resolveProfileUrl(account);
              if (!link) return null;
              return (
                <a
                  key={account.id || account.handle}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {accountDisplay(account)}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const PAGE_SIZE = 12;

const SplineBackground = dynamic(() => import('@/components/SplineBackground'), {
  ssr: false,
  loading: () => null,
});

const WorldMap = dynamic(() => import('@/components/ui/world-map'), {
  ssr: false,
  loading: () => <WorldMapPlaceholder className="h-full w-full" />,
});

const MultiStepLoaderV2 = dynamic(() => import('@/components/Mainpage/MultiStepLoaderv2'), {
  ssr: false,
});

const ToastProvider = dynamic(() => import('../PageSections').then((mod) => mod.ToastProvider), {
  ssr: false,
  loading: () => null,
});

const QuotesSection = dynamic(() => import('../PageSections').then((mod) => mod.QuotesSection), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const BreakingNewsSection = dynamic(() => import('../PageSections').then((mod) => mod.BreakingNewsSection), {
  ssr: false,
  loading: () => <div className="h-32 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const TelegramSection = dynamic(() => import('../PageSections').then((mod) => mod.TelegramSection), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const MetaTraderQuotes = dynamic(() => import('@/components/MetaTraderQuotes'), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const BreakingNewsTicker = dynamic(() => import('@/components/BreakingNewsTicker'), {
  ssr: false,
  loading: () => <div className="h-32 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const BullMoneyCommunity = dynamic(() => import('@/components/BullMoneyCommunity'), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const Features = dynamic(() => import('@/components/features').then((mod) => ({ default: mod.Features })), {
  ssr: false,
  loading: () => <div className="h-60 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const TestimonialsCarousel = dynamic(() => import('@/components/Testimonial').then((mod) => ({ default: mod.TestimonialsCarousel })), {
  ssr: false,
  loading: () => <div className="h-60 w-full animate-pulse rounded-2xl bg-black/5" />,
});

const FooterComponent = dynamic(() => import('@/components/Mainpage/footer').then((mod) => ({ default: mod.Footer })), {
  ssr: false,
});

const HERO_SLIDE_DURATION = 6;
const HERO_CACHE_KEY = 'hero_store_slide_v1';
const HERO_CACHE_TTL = 1000 * 60 * 60 * 24;

const HERO_CAROUSEL_SLIDES = [
  { type: 'image' as const, src: '/bullmoney-logo.png', alt: 'BullMoney logo' },
  { type: 'image' as const, src: '/bullmoneyvantage.png', alt: 'BullMoney Vantage' },
  { type: 'image' as const, src: '/Fvfront.png', alt: 'BullMoney product front' },
  { type: 'image' as const, src: '/IMG_2921.PNG', alt: 'BullMoney mark' },
  { type: 'image' as const, src: '/Img1.jpg', alt: 'BullMoney product preview' },
  { type: 'video' as const, src: '/newhero.mp4', poster: '/Img1.jpg' },
  { type: 'world-map' as const },
  { type: 'spline' as const, scene: '/scene1.splinecode' },
  { type: 'spline' as const, scene: '/scene3.splinecode' },
];

const HERO_IMAGE_INDICES = HERO_CAROUSEL_SLIDES
  .map((slide, index) => (slide.type === 'image' ? index : -1))
  .filter((index) => index >= 0);
const FIRST_HERO_IMAGE_INDEX = HERO_IMAGE_INDICES[0] ?? 0;
const HERO_VIDEO_INDICES = HERO_CAROUSEL_SLIDES
  .map((slide, index) => (slide.type === 'video' ? index : -1))
  .filter((index) => index >= 0);
const FIRST_HERO_VIDEO_INDEX = HERO_VIDEO_INDICES[0] ?? 0;

const GRID_VARIANTS = [
  { value: 'spotlight', label: 'Spotlight', group: 'Featured' },
  { value: 'animated', label: 'Animated grid', group: 'Featured' },
  { value: 'snug', label: 'Snug grid', group: 'Featured' },
  { value: 'compact-2', label: 'Compact tight', group: 'Featured' },
  { value: 'circular', label: 'Circular grid', group: 'Dynamic' },
  { value: 'glass', label: 'Glass grid', group: 'Dynamic' },
  { value: 'carousel', label: 'Carousel', group: 'Dynamic' },
  { value: 'compact', label: 'Compact grid', group: 'Classic' },
  { value: 'masonry', label: 'Masonry columns', group: 'Classic' },
  { value: 'list', label: 'List stack', group: 'Classic' },
  { value: 'stacked', label: 'Stacked hero', group: 'Classic' },
  { value: 'tiles', label: 'Tile wall', group: 'Classic' },
  { value: 'micro', label: 'Micro tiles', group: 'Compact' },
  { value: 'dense', label: 'Dense grid', group: 'Compact' },
  { value: 'wide', label: 'Wide cards', group: 'Layout' },
  { value: 'center', label: 'Centered grid', group: 'Layout' },
  { value: 'split', label: 'Split layout', group: 'Layout' },
  { value: 'gallery', label: 'Gallery flow', group: 'Layout' },
  { value: 'ribbon', label: 'Ribbon row', group: 'Layout' },
  { value: 'shelves', label: 'Shelves', group: 'Layout' },
  { value: 'glow', label: 'Glow grid', group: 'Style' },
  { value: 'stripe', label: 'Striped list', group: 'Style' },
  { value: 'edge', label: 'Edge borders', group: 'Style' },
  { value: 'diagonal', label: 'Diagonal tilt', group: 'Style' },
  { value: 'panel', label: 'Panel grid', group: 'Style' },
  { value: 'frame', label: 'Framed cards', group: 'Style' },
  { value: 'shadow', label: 'Shadow stack', group: 'Style' },
  { value: 'borderless', label: 'Borderless', group: 'Style' },
  { value: 'mosaic', label: 'Mosaic', group: 'Layout' },
] as const;

const GRID_VARIANT_GROUP_ORDER = ['Featured', 'Dynamic', 'Classic', 'Compact', 'Layout', 'Style'] as const;
const GRID_VARIANT_GROUPS = GRID_VARIANTS.reduce<Record<string, typeof GRID_VARIANTS[number][]>>((acc, variant) => {
  if (!acc[variant.group]) acc[variant.group] = [];
  acc[variant.group].push(variant);
  return acc;
}, {});

type GridVariant = typeof GRID_VARIANTS[number]['value'];

const HERO_WORLD_MAP_DOTS = [
  {
    start: { lat: 40.7128, lng: -74.006, label: 'New York' },
    end: { lat: 51.5074, lng: -0.1278, label: 'London' },
    color: '#00D4FF',
  },
  {
    start: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
    end: { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
    color: '#00FFA3',
  },
  {
    start: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
    end: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
    color: '#FF6B35',
  },
];

const HERO_TYPE_WEIGHTS = {
  'world-map': 0.6,
  spline: 0.3,
  image: 0.03,
  video: 0.07,
} as const;

const pickHeroSlideIndex = () => {
  return FIRST_HERO_VIDEO_INDEX;
};

type StorePageProps = {
  routeBase?: string;
  syncUrl?: boolean;
  showProductSections?: boolean;
};

type StudioOpts = {
  tab?: 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs';
  productId?: string;
  artId?: string;
  productType?: string;
};

// ---- Countdown Timer Component ----
function CountdownTimer({ targetDate }: { targetDate: string | null }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const calc = () => {
      const now = Date.now();
      const end = new Date(targetDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setExpired(false);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <p className="text-white/40 text-sm">Timer not configured yet.</p>
    );
  }

  if (expired) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-white animate-pulse">It&apos;s time!</p>
        <p className="text-white/50 text-sm mt-2">New products are on the way. Refresh the page soon.</p>
      </div>
    );
  }

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <div
              className="relative w-[72px] h-[88px] sm:w-[90px] sm:h-[110px] rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(79,70,229,0.1) 100%)',
                border: '1px solid rgba(147,51,234,0.25)',
                boxShadow: '0 8px 32px rgba(147,51,234,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {String(block.value).padStart(2, '0')}
              </span>
              {/* Center line accent */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest mt-2 font-medium">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-2xl sm:text-3xl text-white/20 font-light mb-6">:</span>
          )}
        </div>
      ))}
    </div>
  );
}


export function StorePageClient({ routeBase = '/store', syncUrl = true, showProductSections = true }: StorePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hero = useStoreSection('hero');
  const productsSection = useStoreSection('products');
  const featuredSection = useStoreSection('featured');
  const footerSection = useStoreSection('footer');
  const { heroMode, setHeroMode: setSharedHeroMode } = useHeroMode();
  const showProducts = showProductSections && heroMode === 'store';

  useEffect(() => {
    if (heroMode !== 'store') {
      setSharedHeroMode('store');
    }
  }, [heroMode, setSharedHeroMode]);

  // Force enable scrolling for all devices (lazy-loaded: 342 lines)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import('@/lib/forceScrollEnabler').then(mod => {
      cleanup = mod.forceEnableScrolling();
    });
    return () => cleanup?.();
  }, []);

  // Handle mode toggle with sound effect
  const handleModeChange = useCallback((mode: 'store' | 'trader' | 'design') => {
    playSoundEffect('click');
    setSharedHeroMode(mode);
    if (mode === 'design') {
      router.push('/design');
    } else if (mode === 'trader') {
      router.push('/'); // Redirect to app page (homepage)
    }
  }, [router, setSharedHeroMode]);

  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [storeDisplayMode, setStoreDisplayMode] = useState<'global' | 'vip' | 'timer'>('global');
  const [timerEnd, setTimerEnd] = useState<string | null>(null);
  const [timerHeadline, setTimerHeadline] = useState('Something big is coming');
  const [timerSubtext, setTimerSubtext] = useState('New products dropping soon. Stay tuned.');

  const [expandedProduct, setExpandedProduct] = useState<ProductWithDetails | null>(null);
  const [viewerProduct, setViewerProduct] = useState<ProductWithDetails | null>(null);
  const [viewerMounted, setViewerMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [allowHeavyHero, setAllowHeavyHero] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [studioState, setStudioState] = useState<{ open: boolean } & StudioOpts>({ open: false });

  const [checkoutProduct, setCheckoutProduct] = useState<ProductWithDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    'cart' | 'stripe' | 'whop' | 'skrill'
  >('cart');
  const [useGridLayouts, setUseGridLayouts] = useState(true);
  const [productsGridVariant, setProductsGridVariant] = useState<GridVariant>('spotlight');
  const [featuredGridVariant, setFeaturedGridVariant] = useState<GridVariant>('animated');
  const [timelineGridVariant, setTimelineGridVariant] = useState<GridVariant>('snug');
  const [heroSlideIndex, setHeroSlideIndex] = useState(() => FIRST_HERO_VIDEO_INDEX);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [showHeroMapOverlay] = useState(() => Math.random() < 0.05);
  const [heroImageReady, setHeroImageReady] = useState(false);
  const [heroVideoFinished, setHeroVideoFinished] = useState(false);

  const openStudio = useCallback((opts?: StudioOpts) => {
    setStudioState({ open: true, ...opts });
  }, []);


  const heroCacheLoadedRef = useRef(false);
  const allowHeavyHeroReady = allowHeavyHero && hasMounted && heroImageReady;

  // ✅ PERF: Showcase scroll lazy-loaded — activated via component below

  const resolvedHeroSlide = useMemo(() => {
    const fallbackImage = HERO_CAROUSEL_SLIDES[FIRST_HERO_IMAGE_INDEX] || HERO_CAROUSEL_SLIDES[0];

    if (!hasMounted || !allowHeavyHeroReady) {
      const imageIndex = HERO_IMAGE_INDICES[heroImageIndex] ?? FIRST_HERO_IMAGE_INDEX;
      return HERO_CAROUSEL_SLIDES[imageIndex] || fallbackImage;
    }

    // Mobile gets the same hero types as desktop (videos, splines, world-map)
    return HERO_CAROUSEL_SLIDES[heroSlideIndex];
  }, [allowHeavyHero, hasMounted, heroImageReady, heroImageIndex, heroSlideIndex]);
  const heroIsWorldMap = resolvedHeroSlide?.type === 'world-map';
  const heroTitleColor = 'rgb(255,255,255)';
  const heroMetaColor = 'rgb(255,255,255)';
  const heroBodyColor = 'rgb(255,255,255)';
  const heroTextShadow = heroIsWorldMap ? 'none' : '0 6px 18px rgba(0,0,0,0.45)';
  const heroTitleShadow = heroIsWorldMap ? 'none' : '0 10px 30px rgba(0,0,0,0.5)';
  const heroBodyShadow = heroIsWorldMap ? 'none' : '0 8px 22px rgba(0,0,0,0.4)';
  const shouldShowHeroMapOverlay = allowHeavyHeroReady && showHeroMapOverlay;
  useEffect(() => {
    if (heroCacheLoadedRef.current) return;
    heroCacheLoadedRef.current = true;

    setHeroSlideIndex(FIRST_HERO_VIDEO_INDEX);
    setHeroVideoFinished(false);
  }, []);

  useEffect(() => {
    if (!heroCacheLoadedRef.current) return;
    userStorage.set(HERO_CACHE_KEY, heroSlideIndex, HERO_CACHE_TTL);
  }, [heroSlideIndex]);

  useEffect(() => {
    const currentSlide = HERO_CAROUSEL_SLIDES[heroSlideIndex];
    if (currentSlide?.type === 'video') {
      setHeroVideoFinished(false);
      return;
    }
    setHeroVideoFinished(true);
  }, [heroSlideIndex]);

  useEffect(() => {
    if (!hasMounted) return;
    const firstImage = HERO_CAROUSEL_SLIDES[FIRST_HERO_IMAGE_INDEX];
    if (!firstImage || firstImage.type !== 'image') {
      setHeroImageReady(true);
      return;
    }

    const img = new Image();
    img.src = firstImage.src;
    if (img.complete) {
      setHeroImageReady(true);
      return;
    }

    const handleLoad = () => setHeroImageReady(true);
    const handleError = () => setHeroImageReady(true);
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [hasMounted]);

  // Auto-cycle hero slides every HERO_SLIDE_DURATION seconds
  useEffect(() => {
    if (!hasMounted) return;
    const interval = setInterval(() => {
      if (!allowHeavyHeroReady) {
        if (HERO_IMAGE_INDICES.length > 1) {
          setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGE_INDICES.length);
        }
        return;
      }
      const currentSlide = HERO_CAROUSEL_SLIDES[heroSlideIndex];
      if (currentSlide?.type === 'video' && !heroVideoFinished) {
        return;
      }
      setHeroSlideIndex((prev) => (prev + 1) % HERO_CAROUSEL_SLIDES.length);
    }, HERO_SLIDE_DURATION * 1000);
    return () => clearInterval(interval);
  }, [allowHeavyHeroReady, hasMounted, heroSlideIndex, heroVideoFinished]);


  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  // ✅ HYDRATION OPTIMIZED: Use useDeferredValue for search to prevent blocking UI
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { open: openProductsModal } = useProductsModalUI();
  const isHydrated = useHydrated();

  // ✅ HYDRATION OPTIMIZED: Use startTransition for filter updates
  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort_by: (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest',
  });
  
  // Wrap filter updates in startTransition
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    });
  }, []);

  const [showLoader, setShowLoader] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const cartCount = getItemCount();
  const paddingBoost = isDesktop ? 60 : 15;

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }), []);

  const formatPrice = useCallback((value: number) => currencyFormatter.format(value || 0), [currencyFormatter]);
  const normalizeAssetUrl = useCallback((src: string) => {
    let normalized = src;
    if (normalized.startsWith('/http://') || normalized.startsWith('/https://')) {
      normalized = normalized.substring(1);
    }
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    return normalized.startsWith('/') ? normalized : `/${normalized.replace(/^public\//, '')}`;
  }, []);

  // Column layout: content flows naturally in the document.
  // Each column renders its sections inline — the page scrolls the whole thing.
  // No JS scroll snapping needed since columns are no longer sticky/trapped.


  const handleOpenVip = useCallback(() => {
    clickSound();
    openProductsModal();
  }, [openProductsModal]);

  const handleVisitShop = useCallback(() => {
    clickSound();
    if (!showProducts && showProductSections) {
      setSharedHeroMode('store');
      setTimeout(() => {
        const target = document.querySelector('[data-products-grid]');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
      return;
    }
    const target = document.querySelector('[data-products-grid]');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showProducts, showProductSections]);

  const handleStoreAccountClick = useCallback(() => {
    clickSound();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bullmoney_open_account_drawer'));
      return;
    }

    router.push('/');
  }, [router]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAllowHeavyHero(false);
      return;
    }

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const activate = () => setAllowHeavyHero(true);

    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(activate, { timeout: 900 });
    } else {
      timeoutId = setTimeout(activate, 250);
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [hasMounted]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(isMobileDevice());
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const ultraWideMq = window.matchMedia('(min-width: 1980px)');
    const updateDesktop = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    const updateUltraWide = (event: MediaQueryListEvent) => setIsUltraWide(event.matches);

    setIsDesktop(desktopMq.matches);
    setIsUltraWide(ultraWideMq.matches);

    desktopMq.addEventListener('change', updateDesktop);
    ultraWideMq.addEventListener('change', updateUltraWide);

    return () => {
      desktopMq.removeEventListener('change', updateDesktop);
      ultraWideMq.removeEventListener('change', updateUltraWide);
    };
  }, []);

  useEffect(() => {
    setViewerMounted(true);
  }, []);

  // Loader removed — content renders immediately for faster perceived load
  // useEffect for loader timer no longer needed

  useEffect(() => {
    if (!isDesktop) setExpandedProduct(null);
  }, [isDesktop]);

  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlMinPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
    const urlMaxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;
    const urlSortBy = (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest';
    const urlSearch = searchParams.get('search') || '';

    setFilters((prev) => {
      if (
        prev.category !== urlCategory ||
        prev.min_price !== urlMinPrice ||
        prev.max_price !== urlMaxPrice ||
        prev.sort_by !== urlSortBy
      ) {
        return {
          category: urlCategory,
          min_price: urlMinPrice,
          max_price: urlMaxPrice,
          sort_by: urlSortBy,
        };
      }
      return prev;
    });

    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams, searchQuery]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!expandedProduct) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedProduct(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expandedProduct]);

  useEffect(() => {
    if (!viewerProduct) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setViewerProduct(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [viewerProduct]);

  useEffect(() => {
    if (!checkoutOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCheckoutOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [checkoutOpen]);

  const fetchProducts = useCallback(async (
    pageNum: number,
    append: boolean,
    trades?: AbortSignal
  ) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', PAGE_SIZE.toString());
      if (filters.category) params.set('category', filters.category);
      if (filters.min_price) params.set('min_price', filters.min_price.toString());
      if (filters.max_price) params.set('max_price', filters.max_price.toString());
      if (filters.sort_by) params.set('sort_by', filters.sort_by);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/store/products?${params.toString()}`, { trades });
      const data = await response.json();

      // Check for timer mode from API
      if (data.display_mode === 'timer') {
        setStoreDisplayMode('timer');
        setTimerEnd(data.timer_end || null);
        setTimerHeadline(data.timer_headline || 'Something big is coming');
        setTimerSubtext(data.timer_subtext || 'New products dropping soon. Stay tuned.');
        setProducts([]);
        setTotal(0);
        setHasMore(false);
        return;
      }

      // Track display mode for VIP badge
      if (data.display_mode) {
        setStoreDisplayMode(data.display_mode);
      } else {
        setStoreDisplayMode('global');
      }

      if (append) {
        setProducts((prev) => [...prev, ...(data.data || [])]);
      } else {
        setProducts(data.data || []);
      }

      setTotal(data.total || 0);
      setHasMore(Boolean(data.has_more));
      setPage(pageNum);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to fetch products:', error);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, debouncedSearch]);

  const renderGridVariant = useCallback((
    variant: GridVariant,
    section: 'products' | 'featured' | 'timeline',
    items: ProductWithDetails[],
    allowAnimation: boolean,
  ) => {
    if (!items.length) return null;
    const isProducts = section === 'products';
    const isFeatured = section === 'featured';
    const isTimeline = section === 'timeline';
    const estimateVisibleCount = () => {
      const desktopCols = isUltraWide ? 6 : 4;
      const compactCols = isUltraWide ? 7 : 5;
      const denseCols = isUltraWide ? 7 : 5;
      const tilesCols = isUltraWide ? 6 : 4;
      const microCols = isUltraWide ? 9 : 7;
      const gridRows = isProducts ? 2 : 1;

      switch (variant) {
        case 'animated':
          return (isTimeline ? 3 : 4) * gridRows;
        case 'circular':
        case 'glass':
          return (isTimeline ? 3 : isFeatured ? 4 : 5) * gridRows;
        case 'carousel':
          return (isProducts ? 2 : 1) * (isMobile ? 3 : 4);
        case 'compact':
          return (isMobile ? 2 : desktopCols) * 2;
        case 'compact-2':
          return (isMobile ? 3 : compactCols) * 2;
        case 'micro':
          return (isMobile ? 4 : microCols) * 2;
        case 'dense':
          return (isMobile ? 3 : denseCols) * 2;
        case 'snug':
        case 'gallery':
        case 'tiles':
          return (isMobile ? 2 : tilesCols) * 2;
        case 'wide':
        case 'center':
          return 4;
        case 'split':
        case 'stacked':
        case 'spotlight':
        case 'glow':
        case 'edge':
        case 'frame':
        case 'shadow':
        case 'borderless':
          return 6;
        case 'list':
        case 'stripe':
        case 'shelves':
          return isMobile ? 3 : 4;
        case 'ribbon':
          return isMobile ? 2 : 4;
        case 'panel':
          return (isMobile ? 2 : 4) * 2;
        case 'diagonal':
          return 6;
        case 'mosaic':
          return (isMobile ? 2 : tilesCols) * 2;
        default:
          return items.length;
      }
    };
    const visibleEstimate = Math.min(items.length, estimateVisibleCount());
    const shouldAnimateGrid = allowAnimation && visibleEstimate <= 12;
    const staggerStyle = (index: number) => ({ animationDelay: `${Math.min(index, 10) * 35}ms` });

    switch (variant) {
      case 'animated':
        return (
          <div className={`grid-perf ${shouldAnimateGrid ? 'grid-float' : ''}`}>
            <AnimatedProductGrid
              products={items}
              rows={isProducts ? 2 : 1}
              columns={isTimeline ? 3 : 4}
              rowHeight={isTimeline ? 340 : 360}
              gap={16}
            />
          </div>
        );
      case 'circular':
        return (
          <div className={`grid-perf ${shouldAnimateGrid ? 'grid-float' : ''}`}>
            <CircularProductGrid
              products={items}
              itemsPerRow={isTimeline ? 3 : isFeatured ? 4 : 5}
              rowHeight={isTimeline ? 340 : 360}
              bend={1}
              gap={18}
            />
          </div>
        );
      case 'glass':
        return (
          <div className={`grid-perf ${shouldAnimateGrid ? 'grid-float' : ''}`}>
            <GlassProductGrid
              products={items}
              itemsPerRow={isTimeline ? 3 : isFeatured ? 4 : 5}
              rowHeight={isTimeline ? 340 : 360}
              gap={18}
              scrollSpeed={22}
              visibleCount={isTimeline ? 3 : 4}
            />
          </div>
        );
      case 'carousel':
        return (
          <div className={`grid-perf ${shouldAnimateGrid ? 'grid-float' : ''}`}>
            <ProductsCarousel
              products={items}
              title={isProducts ? 'Latest drops' : isFeatured ? 'Best sellers this week' : 'Drop highlights'}
              subtitle={isProducts ? 'Fresh essentials' : isFeatured ? 'Featured' : 'Timeline picks'}
              mobileRows={isProducts ? 2 : 1}
              desktopRows={isProducts ? 2 : 1}
              scrollSpeed={isProducts ? 24 : 22}
              onLoadMore={isProducts ? () => fetchProducts(page + 1, true) : undefined}
              hasMore={isProducts ? hasMore : false}
              loading={isProducts ? loadingMore : false}
            />
          </div>
        );
      case 'compact':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'compact-2':
        return (
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'micro':
        return (
          <div className="grid gap-1.5 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'dense':
        return (
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'snug':
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'masonry':
        return (
          <div className="columns-2 gap-4 md:columns-3 xl:columns-4 [column-fill:_balance] grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`mb-4 break-inside-avoid grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'list':
        return (
          <div className="flex flex-col gap-5 grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`rounded-2xl border border-black/5 bg-white p-3 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'stripe':
        return (
          <div className="flex flex-col gap-4 grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`rounded-2xl border border-black/5 p-3 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={{ ...(shouldAnimateGrid ? staggerStyle(index) : {}), backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.05)' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'stacked':
        return (
          <div className="grid gap-5 md:grid-cols-3 md:auto-rows-fr grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''} ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'spotlight':
        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''} ${index === 0 ? 'lg:col-span-2 ring-1 ring-amber-300/40 shadow-[0_20px_60px_rgba(245,158,11,0.18)] spotlight-card' : ''} ${index === 0 && shouldAnimateGrid ? 'spotlight-active' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'tiles':
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'wide':
        return (
          <div className="grid gap-6 md:grid-cols-2 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'center':
        return (
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'split':
        return (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] grid-perf">
            <div className="flex flex-col gap-5">
              {items.slice(0, 4).map((product, index) => (
                <div key={product.id} className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.slice(4).map((product, index) => (
                <div key={product.id} className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index + 4) : undefined}>
                  <ProductCard product={product} compact />
                </div>
              ))}
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr [grid-auto-flow:dense] grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''} ${index % 7 === 0 ? 'sm:col-span-2' : index % 9 === 0 ? 'lg:row-span-2' : 'h-full'}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'ribbon':
        return (
          <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] snap-x snap-mandatory scroll-smooth grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`min-w-[220px] snap-start grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        );
      case 'shelves':
        return (
          <div className="flex flex-col gap-6 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`border-t border-black/5 pt-6 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'glow':
        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`rounded-3xl bg-white p-2 shadow-[0_20px_60px_rgba(59,130,246,0.12)] grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'edge':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`rounded-2xl border border-black/15 p-2 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'diagonal':
        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`h-full transition-transform duration-300 ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? { ...staggerStyle(index), transform: index % 2 === 0 ? 'rotate(-0.8deg)' : 'rotate(0.8deg)' } : { transform: index % 2 === 0 ? 'rotate(-0.8deg)' : 'rotate(0.8deg)' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'panel':
        return (
          <div className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] grid-perf">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((product, index) => (
                <div key={product.id} className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                  <ProductCard product={product} compact />
                </div>
              ))}
            </div>
          </div>
        );
      case 'frame':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`rounded-3xl border border-black/10 bg-white p-2 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'shadow':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 grid-perf">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`relative rounded-3xl bg-white p-2 shadow-[0_12px_36px_rgba(0,0,0,0.12)] before:absolute before:inset-2 before:-z-10 before:rounded-3xl before:bg-black/5 before:blur-sm grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'borderless':
        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 grid-perf">
            {items.map((product, index) => (
              <div key={product.id} className={`bg-transparent grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        );
      case 'mosaic':
        return (
          <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 grid-perf">
            {items.map((product, index) => {
              // Varied spans: hero → half → third pattern
              const mosaicSpan = index % 5 === 0 ? 'col-span-6 sm:col-span-2' : index % 5 === 1 ? 'col-span-3 sm:col-span-1' : index % 5 === 2 ? 'col-span-3 sm:col-span-1' : index % 5 === 3 ? 'col-span-4 sm:col-span-1' : 'col-span-2 sm:col-span-1';
              return (
                <div key={product.id} className={`${mosaicSpan} h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`} style={shouldAnimateGrid ? staggerStyle(index) : undefined}>
                  <ProductCard product={product} compact={index % 5 !== 0} />
                </div>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  }, [fetchProducts, hasMore, isMobile, isUltraWide, loadingMore, page]);

  useEffect(() => {
    if (!showProducts) return;
    const controller = new AbortController();
    fetchProducts(1, false, controller.trades);
    return () => controller.abort();
  }, [fetchProducts, showProducts]);

  useEffect(() => {
    if (!syncUrl) return;
    const params = buildUrlParams(filters, debouncedSearch);
    const query = params.toString();
    const newUrl = query ? `${routeBase}?${query}` : routeBase;
    router.replace(newUrl, { scroll: false });
  }, [filters, debouncedSearch, routeBase, router, syncUrl]);

  const handleFilterChange = useCallback((next: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: '',
      min_price: undefined,
      max_price: undefined,
      sort_by: 'newest',
    });
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  const isVipProduct = useCallback((product: ProductWithDetails) => {
    return Boolean((product as any).buy_url || (product as any)._source === 'vip' || (product.details as any)?.buy_url);
  }, []);

  const canAddToCart = useCallback((product: ProductWithDetails) => {
    if (isVipProduct(product)) return true;
    const variant = product.variants?.[0];
    return Boolean(variant && variant.inventory_count > 0);
  }, [isVipProduct]);

  const handleAddToCart = useCallback((product: ProductWithDetails) => {
    const variant = product.variants?.[0];
    if (isVipProduct(product)) {
      // VIP products use a synthetic variant for cart
      const syntheticVariant = variant || {
        id: `vip-${product.id}`,
        name: 'Default',
        price_adjustment: 0,
        inventory_count: 999,
        sort_order: 0,
      };
      addItem(product, syntheticVariant as any, 1);
      return;
    }
    if (!variant || variant.inventory_count <= 0) return;
    addItem(product, variant, 1);
  }, [addItem, isVipProduct]);

  const handleAddClick = useCallback((product: ProductWithDetails) => {
    const desktopNow = typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : isDesktop;

    handleAddToCart(product);
    if (desktopNow) {
      setExpandedProduct(product);
    }
  }, [handleAddToCart, isDesktop]);

  const confirmExpandedAdd = useCallback(() => {
    if (!expandedProduct) return;
    handleAddToCart(expandedProduct);
    setExpandedProduct(null);
  }, [expandedProduct, handleAddToCart]);

  const handleCheckoutAction = useCallback(async () => {
    if (!checkoutProduct) return;
    const variant = checkoutProduct.variants?.[0];
    const vip = isVipProduct(checkoutProduct);
    if (!vip && (!variant || variant.inventory_count <= 0)) return;

    if (paymentMethod === 'cart') {
      if (vip) {
        const syntheticVariant = variant || {
          id: `vip-${checkoutProduct.id}`,
          name: 'Default',
          price_adjustment: 0,
          inventory_count: 999,
          sort_order: 0,
        };
        addItem(checkoutProduct, syntheticVariant as any, 1);
      } else {
        addItem(checkoutProduct, variant!, 1);
      }
      setCheckoutOpen(false);
      return;
    }

    if (paymentMethod === 'whop') {
      const buyUrl = (checkoutProduct as any).buy_url || (checkoutProduct.details as { buy_url?: string } | undefined)?.buy_url;
      const checkoutUrl = buyUrl || `https://whop.com/checkout/${checkoutProduct.slug}`;
      window.open(checkoutUrl, '_blank');
      setCheckoutOpen(false);
      return;
    }

    if (paymentMethod === 'skrill') {
      try {
        const response = await fetch('/api/skrill/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: checkoutProduct.id,
            variantId: variant.id,
            name: checkoutProduct.name,
            description: checkoutProduct.description,
            price: checkoutProduct.base_price + variant.price_adjustment,
            quantity: 1,
            image: checkoutProduct.primary_image,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (error) {
        console.error('Skrill checkout error:', error);
      }
    }
  }, [addItem, checkoutProduct, isVipProduct, paymentMethod]);

  const hasActiveFilters = checkActiveFilters(filters, debouncedSearch);
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const timelineProducts = useMemo(() => products.slice(4, 8), [products]);
  const heroMedia = useMemo(() => {
    const slide = resolvedHeroSlide;

    if (slide.type === 'spline') {
      return (
        <div
          className="absolute inset-0 z-0 h-full w-full"
          style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
        >
          <SplineBackground scene={slide.scene ?? '/scene1.splinecode'} className="h-full w-full" priority />
        </div>
      );
    }

    if (slide.type === 'image') {
      return (
        <img
          src={slide.src}
          alt={slide.alt}
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
          style={{ touchAction: 'pan-y' }}
          loading="eager"
          decoding="async"
        />
      );
    }

    if (slide.type === 'video') {
      if (!allowHeavyHeroReady) {
        return (
          <img
            src={slide.poster || '/Img1.jpg'}
            alt={slide.alt}
            className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
            style={{ touchAction: 'pan-y' }}
            loading="eager"
            decoding="async"
          />
        );
      }
      return (
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
          style={{ touchAction: 'pan-y' }}
          autoPlay
          muted
          loop={false}
          playsInline
          preload="metadata"
          poster={slide.poster}
          onEnded={() => setHeroVideoFinished(true)}
          onError={() => setHeroVideoFinished(true)}
        >
          <source src={slide.src} type="video/mp4" />
        </video>
      );
    }

    if (slide.type === 'world-map') {
      if (!allowHeavyHeroReady) {
        return (
          <div
            className="absolute inset-0 z-0 h-full w-full bg-white"
            style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
          />
        );
      }
      return (
        <div
          className="absolute inset-0 z-0 h-full w-full"
          style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
        >
          <div className="absolute inset-0 bg-white">
            <WorldMapPlaceholder className="min-h-0" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <style>{`
              @keyframes heroLineFlow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -120; } }
              @keyframes heroListPulse { 0%, 100% { opacity: 0.55; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
              @keyframes heroGlow { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.6; } }
            `}</style>
            <div className="absolute left-6 top-6 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.32em] text-black/45">Markets + Sessions</p>
              <ul className="mt-2 space-y-1 text-xs font-semibold text-black/70">
                {[
                  'Tokyo Session · 00:00-09:00 UTC',
                  'London Session · 07:00-16:00 UTC',
                  'New York Session · 13:00-22:00 UTC',
                  'Crypto · 24/7 Global',
                ].map((item, idx) => (
                  <li
                    key={item}
                    style={{ animation: 'heroListPulse 6s ease-in-out infinite', animationDelay: `${idx * 0.6}s` }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <svg
              viewBox="0 0 1000 500"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="heroLineBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0A84FF" stopOpacity="0" />
                  <stop offset="15%" stopColor="#0A84FF" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#0A84FF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                id="route-ny-lon"
                d="M 280 190 Q 460 70 640 170"
                fill="none"
                stroke="url(#heroLineBlue)"
                strokeWidth="2"
                strokeDasharray="10 12"
                style={{ animation: 'heroLineFlow 8s linear infinite' }}
              />
              <path
                id="route-lon-dxb"
                d="M 640 170 Q 700 190 760 240"
                fill="none"
                stroke="url(#heroLineBlue)"
                strokeWidth="2"
                strokeDasharray="10 12"
                style={{ animation: 'heroLineFlow 7s linear infinite' }}
              />
              <path
                id="route-tyo-sg"
                d="M 820 190 Q 760 260 720 300"
                fill="none"
                stroke="url(#heroLineBlue)"
                strokeWidth="2"
                strokeDasharray="10 12"
                style={{ animation: 'heroLineFlow 6s linear infinite' }}
              />

              <g style={{ animation: 'heroGlow 3s ease-in-out infinite' }}>
                <circle cx="280" cy="190" r="4" fill="#0A84FF" />
                <circle cx="640" cy="170" r="4" fill="#0A84FF" />
                <circle cx="760" cy="240" r="4" fill="#0A84FF" />
                <circle cx="820" cy="190" r="4" fill="#0A84FF" />
                <circle cx="720" cy="300" r="4" fill="#0A84FF" />
              </g>

              <g>
                <circle r="7" fill="#0A84FF" opacity="0.9">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#route-ny-lon" />
                  </animateMotion>
                </circle>
                <text fontSize="6" fontWeight="700" fill="#000" textAnchor="middle" dy="2">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#route-ny-lon" />
                  </animateMotion>
                  BTC
                </text>
              </g>
              <g>
                <circle r="7" fill="#0A84FF" opacity="0.9">
                  <animateMotion dur="1s" repeatCount="indefinite" begin="0.2s">
                    <mpath href="#route-lon-dxb" />
                  </animateMotion>
                </circle>
                <text fontSize="6" fontWeight="700" fill="#000" textAnchor="middle" dy="2">
                  <animateMotion dur="1s" repeatCount="indefinite" begin="0.2s">
                    <mpath href="#route-lon-dxb" />
                  </animateMotion>
                  ETH
                </text>
              </g>
              <g>
                <circle r="7" fill="#0A84FF" opacity="0.9">
                  <animateMotion dur="1s" repeatCount="indefinite" begin="0.4s">
                    <mpath href="#route-tyo-sg" />
                  </animateMotion>
                </circle>
                <text fontSize="6" fontWeight="700" fill="#000" textAnchor="middle" dy="2">
                  <animateMotion dur="1s" repeatCount="indefinite" begin="0.4s">
                    <mpath href="#route-tyo-sg" />
                  </animateMotion>
                  SOL
                </text>
              </g>
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div
        className="absolute inset-0 z-0 h-full w-full"
        style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
      >
        <SplineBackground scene="/scene1.splinecode" className="h-full w-full" priority />
      </div>
    );
  }, [resolvedHeroSlide, allowHeavyHeroReady]);

  const expandedPrimaryImage = useMemo(() => {
    if (!expandedProduct) return '';
    if (expandedProduct.primary_image) return expandedProduct.primary_image;
    const primary = expandedProduct.images?.find((img) => img.is_primary);
    return primary?.url || expandedProduct.images?.[0]?.url || '';
  }, [expandedProduct]);

  const viewerMedia = useMemo(() => {
    if (!viewerProduct) return null;
    const media = (viewerProduct as ProductWithDetails & { media?: Array<{ url: string; media_type?: string; is_primary?: boolean }> }).media;
    const primaryMedia = media?.find((item) => item.is_primary) || media?.[0];
    const primaryImage = viewerProduct.primary_image
      || viewerProduct.images?.find((img) => img.is_primary)?.url
      || viewerProduct.images?.[0]?.url;

    if (primaryImage) {
      return { url: normalizeAssetUrl(primaryImage), type: 'image' } as const;
    }

    if (primaryMedia?.url) {
      return {
        url: normalizeAssetUrl(primaryMedia.url),
        type: primaryMedia.media_type === 'video' ? 'video' : 'image',
      } as const;
    }

    return null;
  }, [viewerProduct]);

  const expandedVariant = expandedProduct?.variants?.[0];
  const expandedInventory = expandedVariant?.inventory_count;
  const expandedIsVip = expandedProduct ? isVipProduct(expandedProduct) : false;
  const expandedInStock = expandedProduct ? (expandedIsVip || canAddToCart(expandedProduct)) : false;
  const expandedBuyUrl = (expandedProduct as any)?.buy_url || (expandedProduct?.details as { buy_url?: string } | undefined)?.buy_url;
  const expandedDetailsHref = expandedBuyUrl || '/VIP';
  const checkoutVariant = checkoutProduct?.variants?.[0];
  const checkoutIsVip = checkoutProduct ? isVipProduct(checkoutProduct) : false;
  const checkoutInStock = checkoutIsVip || Boolean(checkoutVariant && checkoutVariant.inventory_count > 0);
  const checkoutPrice = checkoutProduct ? checkoutProduct.base_price + (checkoutVariant?.price_adjustment || 0) : 0;
  const dashboardsSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)', contentVisibility: 'auto', containIntrinsicSize: 'auto 1200px' }}
    >
      <div className="mx-auto w-full max-w-[26rem] sm:max-w-3xl lg:max-w-[90rem] px-4 sm:px-8" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
            Live dashboards
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Market intelligence.</h2>
          <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(0,0,0,0.6)' }}>
            A streamlined look at quotes, headlines, and community trades tailored for the store.
          </p>
        </div>

        <div className="mt-6 lg:hidden">
          <ToastProvider>
            <DeferredMount fallback={<div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse" />}>
              <TelegramSection />
            </DeferredMount>
            <DeferredMount fallback={<div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse mt-4" />}>
              <QuotesSection />
            </DeferredMount>
            <DeferredMount fallback={<div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse mt-4" />}>
              <BreakingNewsSection />
            </DeferredMount>
          </ToastProvider>
        </div>

        <div className="mt-6 hidden lg:grid gap-6 lg:grid-cols-1">
          <div className="w-full rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Community</h3>
              <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Live
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[420px] lg:min-h-[calc(100vh-220px)] flex-1">
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                  <BullMoneyCommunity />
                </DeferredMount>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Market Quotes</h3>
              <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Live
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[460px] lg:min-h-[calc(100vh-220px)] flex-1">
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                  <MetaTraderQuotes embedded />
                </DeferredMount>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Breaking News</h3>
              <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Live
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[420px] lg:min-h-[calc(100vh-220px)] flex-1">
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                  <BreakingNewsTicker />
                </DeferredMount>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
  const metaQuotesSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)', contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="w-full rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Market Quotes</h3>
            <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
              Live
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[520px] lg:min-h-[calc(100vh-220px)] flex-1">
            <div
              className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
              style={{ filter: 'invert(1) hue-rotate(180deg)' }}
            >
              <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                <MetaTraderQuotes embedded />
              </DeferredMount>
            </div>
          </div>
        </div>
      </div>
    </section>
  );








  const featuresSection = (
    <section
      data-apple-section
      className="lg:min-h-[calc(100vh-64px)]"
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)', contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8 lg:min-h-[calc(100vh-128px)] lg:flex lg:flex-col" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:flex lg:flex-col lg:flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Features</h3>
            <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
              Live
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white lg:flex-1 lg:min-h-0">
            <div className="max-h-[560px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:h-full" style={{ filter: 'invert(1) hue-rotate(180deg)' }}>
              <Features />
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const metaMarketIntelligenceSection = (
    <section
      data-apple-section
      className="lg:min-h-[calc(100vh-64px)]"
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)', contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8 lg:min-h-[calc(100vh-128px)] lg:flex lg:flex-col" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:flex lg:flex-col lg:flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Meta Market Intelligence</h3>
            <span className="rounded-full border border-green-500/20 bg-green-50 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-green-700">
              AI-Powered
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white lg:flex-1 lg:min-h-0">
            <div className="max-h-[560px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:h-full p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Market Sentiment Analysis */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">Market Sentiment</h4>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Fear & Greed Index</span>
                      <span className="text-xl font-bold text-green-600">73</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                    </div>
                    <div className="text-xs text-blue-600">
                      Market showing strong bullish sentiment with institutional inflows
                    </div>
                  </div>
                </div>

                {/* AI Predictions */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-purple-900">AI Predictions</h4>
                    <div className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">95% Accuracy</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">SPY Target</span>
                      <span className="font-semibold text-green-600">↑ $485</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">BTC Forecast</span>
                      <span className="font-semibold text-green-600">↑ $48K</span>
                    </div>
                    <div className="text-xs text-purple-600">
                      Next major support: $445 | Resistance: $495
                    </div>
                  </div>
                </div>

                {/* Options Flow */}
                <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-orange-900">Options Flow</h4>
                    <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Real-time</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Dark Pool Activity</span>
                      <span className="text-sm font-semibold text-red-600">Heavy Buying</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Call/Put Ratio</span>
                      <span className="text-sm font-semibold">1.8:1</span>
                    </div>
                    <div className="text-xs text-orange-600">
                      Unusual activity detected in SPY 480C expiring Friday
                    </div>
                  </div>
                </div>

                {/* Sector Rotation */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-900">Sector Rotation</h4>
                    <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Updated 1m ago</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Technology</span>
                      <span className="font-semibold text-green-600">+2.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Financials</span>
                      <span className="font-semibold text-green-600">+1.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Energy</span>
                      <span className="font-semibold text-red-600">-0.8%</span>
                    </div>
                    <div className="text-xs text-green-600">
                      Tech leading with semiconductor strength
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Action Bar */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Data updated every 30 seconds • Powered by Meta AI
                </div>
                <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  View Full Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
  const testimonialsSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)', contentVisibility: 'auto', containIntrinsicSize: 'auto 700px' }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Testimonials</h3>
            <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
              Live
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white">
            <div className="min-h-[560px] h-full overflow-hidden">
              <TestimonialsCarousel tone="light" className="mt-0 max-w-none px-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
  const footerSectionBlock = (
    <section
      ref={footerSection.ref}
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 400px',
      }}
    >
      <div className="bg-white">
        <FooterComponent />
      </div>
    </section>
  );

  // ---- Countdown Timer Section (timer mode) ----
  const timerSectionBlock = storeDisplayMode === 'timer' ? (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(0,0,0)' }}
    >
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 py-20 text-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(79,70,229,0.2) 40%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 60%)',
              animation: 'pulse 3s ease-in-out infinite 1s',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-xs font-medium tracking-wider uppercase">Coming Soon</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight" style={{ lineHeight: 1.1 }}>
            {timerHeadline}
          </h2>
          <p className="text-white/50 text-base sm:text-lg mb-10 max-w-md mx-auto">
            {timerSubtext}
          </p>

          {/* Countdown boxes */}
          <CountdownTimer targetDate={timerEnd} />
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.25; }
          }
        `}</style>
      </div>
    </section>
  ) : null;

  const productsSectionBlock = showProducts && storeDisplayMode !== 'timer' ? (
    <>
      <section
        data-apple-section
        style={{ backgroundColor: 'rgb(255,255,255)' }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8" style={{ paddingTop: 28 + paddingBoost, paddingBottom: 28 + paddingBoost }}>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(0,0,0,0.35)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products"
                className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-10 text-sm outline-none"
                style={{
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1"
                  style={{ color: 'rgba(0,0,0,0.5)' }}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <SearchAutocomplete
                searchQuery={searchQuery}
                onSelect={(query) => setSearchQuery(query)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.sort_by || 'newest'}
                onChange={(e) => handleFilterChange({ sort_by: e.target.value as ProductFilters['sort_by'] })}
                className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {useGridLayouts && (
                <select
                  value={productsGridVariant}
                  onChange={(e) => setProductsGridVariant(e.target.value as GridVariant)}
                  className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm outline-none"
                  aria-label="Products grid layout"
                >
                  {GRID_VARIANT_GROUP_ORDER.map((group) => (
                    <optgroup key={group} label={group}>
                      {(GRID_VARIANT_GROUPS[group] || []).map((variant) => (
                        <option key={variant.value} value={variant.value}>
                          {variant.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-10 rounded-full border border-black/10 px-4 text-sm"
                  style={{ color: 'rgba(0,0,0,0.6)' }}
                >
                  Clear filters
                </button>
              )}

              <button
                type="button"
                onClick={() => setUseGridLayouts((prev) => !prev)}
                className="h-10 rounded-full border border-black/10 px-4 text-sm"
                style={{ color: 'rgba(0,0,0,0.6)' }}
                aria-pressed={useGridLayouts}
              >
                {useGridLayouts ? 'Standard view' : 'Grid view'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={productsSection.ref}
        data-apple-section
        data-products-grid
        style={{
          backgroundColor: 'rgb(255,255,255)',
          borderTop: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8" style={{ paddingTop: 24, paddingBottom: 56 }}>
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
              {loading ? 'Loading products...' : `${total} ${total === 1 ? 'product' : 'products'}`}
            </p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-black/5 bg-white p-10 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
              <p className="mt-4 text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Fetching the latest collection...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-black/5 bg-white p-12 text-center">
              <p className="text-base font-medium">No products found</p>
              <p className="mt-2 text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Adjust your filters or search again.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 rounded-full border border-black/10 px-6 py-2 text-sm"
              >
                Reset filters
              </button>
            </div>
          ) : useGridLayouts ? (
            <div className="mt-6 mobile-mosaic-products">
              {renderGridVariant(
                productsGridVariant,
                'products',
                products,
                productsSection.shouldAnimate && heroMode === 'store'
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="h-full pb-14 sm:pb-16">
                  <ProductCard product={product} />
                  <div className="mt-4 flex items-center justify-end gap-2 relative z-10 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => setViewerProduct(product)}
                      className="inline-flex rounded-full border border-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-medium min-h-[34px]"
                      style={{ color: 'rgba(0,0,0,0.7)' }}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddClick(product)}
                      disabled={!canAddToCart(product)}
                      className="inline-flex rounded-full px-4 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-semibold min-h-[40px] whitespace-nowrap"
                      style={canAddToCart(product)
                        ? { backgroundColor: '#111111', color: '#ffffff' }
                        : { backgroundColor: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.4)' }
                      }
                    >
                      Add to bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && !loading && (!useGridLayouts || productsGridVariant !== 'carousel') && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => fetchProducts(page + 1, true)}
                className="h-11 rounded-full border border-black/10 px-6 text-sm"
                disabled={loadingMore}
                style={{ backgroundColor: 'rgb(255,255,255)' }}
              >
                {loadingMore ? 'Loading more...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </section>

      {!!featuredProducts.length && (
        <section
          ref={featuredSection.ref}
          data-apple-section
          style={{ backgroundColor: 'rgb(255,255,255)' }}
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8" style={{ paddingBottom: 64 + paddingBoost }}>
            <div className="border-t border-black/5 pt-10">
              {useGridLayouts && featuredGridVariant === 'carousel' ? (
                <div className="flex items-center justify-end">
                  <select
                    value={featuredGridVariant}
                    onChange={(e) => setFeaturedGridVariant(e.target.value as GridVariant)}
                    className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs outline-none"
                    aria-label="Featured grid layout"
                  >
                    {GRID_VARIANT_GROUP_ORDER.map((group) => (
                      <optgroup key={group} label={group}>
                        {(GRID_VARIANT_GROUPS[group] || []).map((variant) => (
                          <option key={variant.value} value={variant.value}>
                            {variant.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                      Featured
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">Best sellers this week</h2>
                  </div>
                  {useGridLayouts && (
                    <select
                      value={featuredGridVariant}
                      onChange={(e) => setFeaturedGridVariant(e.target.value as GridVariant)}
                      className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs outline-none"
                      aria-label="Featured grid layout"
                    >
                      {GRID_VARIANT_GROUP_ORDER.map((group) => (
                        <optgroup key={group} label={group}>
                          {(GRID_VARIANT_GROUPS[group] || []).map((variant) => (
                            <option key={variant.value} value={variant.value}>
                              {variant.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {useGridLayouts ? (
                <div className="mt-6 mobile-mosaic-featured">
                  {renderGridVariant(
                    featuredGridVariant,
                    'featured',
                    featuredProducts,
                    featuredSection.shouldAnimate && heroMode === 'store'
                  )}
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredProducts.map((product) => (
                    <div key={`featured-${product.id}`} className="h-full pb-14 sm:pb-16">
                      <ProductCard product={product} />
                      <div className="mt-4 flex items-center justify-end gap-2 relative z-10 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => setViewerProduct(product)}
                          className="inline-flex rounded-full border border-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-medium min-h-[34px]"
                          style={{ color: 'rgba(0,0,0,0.7)' }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddClick(product)}
                          disabled={!canAddToCart(product)}
                          className="inline-flex rounded-full px-4 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-semibold min-h-[40px] whitespace-nowrap"
                          style={canAddToCart(product)
                            ? { backgroundColor: '#111111', color: '#ffffff' }
                            : { backgroundColor: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.4)' }
                          }
                        >
                          Add to bag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!!timelineProducts.length && (
        <section data-apple-section style={{ backgroundColor: 'rgb(255,255,255)' }}>
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8" style={{ paddingBottom: 80 + paddingBoost }}>
            <div className="border-t border-black/5 pt-10">
              {useGridLayouts && timelineGridVariant === 'carousel' ? (
                <div className="flex items-center justify-end">
                  <select
                    value={timelineGridVariant}
                    onChange={(e) => setTimelineGridVariant(e.target.value as GridVariant)}
                    className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs outline-none"
                    aria-label="Timeline grid layout"
                  >
                    {GRID_VARIANT_GROUP_ORDER.map((group) => (
                      <optgroup key={group} label={group}>
                        {(GRID_VARIANT_GROUPS[group] || []).map((variant) => (
                          <option key={variant.value} value={variant.value}>
                            {variant.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ) : useGridLayouts ? (
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                      Timeline
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">Drop highlights</h2>
                  </div>
                  <select
                    value={timelineGridVariant}
                    onChange={(e) => setTimelineGridVariant(e.target.value as GridVariant)}
                    className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs outline-none"
                    aria-label="Timeline grid layout"
                  >
                    {GRID_VARIANT_GROUP_ORDER.map((group) => (
                      <optgroup key={group} label={group}>
                        {(GRID_VARIANT_GROUPS[group] || []).map((variant) => (
                          <option key={variant.value} value={variant.value}>
                            {variant.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ) : null}

              {useGridLayouts ? (
                <div className="mt-6 mobile-mosaic-timeline">
                  {renderGridVariant(
                    timelineGridVariant,
                    'timeline',
                    timelineProducts,
                    featuredSection.shouldAnimate && heroMode === 'store'
                  )}
                </div>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                    Timeline
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">Drop highlights</h2>
                  <div className="mt-8 space-y-8">
                    {timelineProducts.map((product, index) => (
                      <div
                        key={`timeline-${product.id}`}
                        className="grid gap-6 border-l border-black/10 pl-6 sm:grid-cols-[200px_1fr]"
                      >
                        <div className="text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
                          Drop {index + 1}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
                          <div className="h-full pb-14 sm:pb-16">
                            <ProductCard product={product} />
                            <div className="mt-4 flex items-center justify-end gap-2 relative z-10 pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => setViewerProduct(product)}
                                className="inline-flex rounded-full border border-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-medium min-h-[34px]"
                                style={{ color: 'rgba(0,0,0,0.7)' }}>
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddClick(product)}
                                disabled={!canAddToCart(product)}
                                className="inline-flex rounded-full px-4 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-semibold min-h-[40px] whitespace-nowrap"
                                style={canAddToCart(product)
                                  ? { backgroundColor: '#111111', color: '#ffffff' }
                                  : { backgroundColor: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.4)' }
                                }
                              >
                                Add to bag
                              </button>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            <p className="mt-2 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                              {product.description || 'A focused essential designed to keep your trading desk clean, calm, and efficient.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

    </>
  ) : null;

  /* ── Print & Design — full-viewport standalone section (rendered below columns on ALL pages) ── */
  const printDesignSection = (
    <section
      id="print-design"
      data-no-theme
      className="relative z-20 w-full min-h-screen flex flex-col justify-center bg-gradient-to-b from-white to-gray-50 border-t border-black/5"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 100vh' }}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 py-20 lg:py-28">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black/45">Expand Your Collection</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-black">Custom Print & Digital Art</h2>
          <p className="mt-3 text-sm sm:text-base text-black/60 max-w-xl mx-auto">Professional printing services and premium digital artwork</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left — Print Products */}
          <div id="print-products" className="border-r-0 lg:border-r border-black/10 pr-0 lg:pr-10">
            <PrintProductsSection products={getSamplePrintProducts()} onOpenStudio={openStudio} />
          </div>

          {/* Right — Digital Art */}
          <div id="digital-art" className="pl-0 lg:pl-6">
            <DigitalArtSection arts={getSampleDigitalArt()} onOpenStudio={openStudio} />
          </div>
        </div>
      </div>
    </section>
  );
  const handleExpandedBuy = useCallback(async (method: typeof paymentMethod) => {
    if (!expandedProduct) return;
    const variant = expandedProduct.variants?.[0];
    const vip = isVipProduct(expandedProduct);
    if (!vip && (!variant || variant.inventory_count <= 0)) return;

    if (method === 'cart') {
      if (vip && !variant) {
        const syntheticVariant = {
          id: `vip-${expandedProduct.id}`,
          name: 'Default',
          price_adjustment: 0,
          inventory_count: 999,
          sort_order: 0,
        };
        addItem(expandedProduct, syntheticVariant as any, 1);
        setExpandedProduct(null);
      } else {
        confirmExpandedAdd();
      }
      return;
    }

    if (method === 'whop') {
      const buyUrl = (expandedProduct as any).buy_url || (expandedProduct.details as { buy_url?: string } | undefined)?.buy_url;
      const checkoutUrl = buyUrl || `https://whop.com/checkout/${expandedProduct.slug}`;
      window.open(checkoutUrl, '_blank');
      setExpandedProduct(null);
      return;
    }

    if (method === 'skrill') {
      try {
        const response = await fetch('/api/skrill/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: expandedProduct.id,
            variantId: variant.id,
            name: expandedProduct.name,
            description: expandedProduct.description,
            price: expandedProduct.base_price + variant.price_adjustment,
            quantity: 1,
            image: expandedProduct.primary_image,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (error) {
        console.error('Skrill checkout error:', error);
      }
    }
  }, [addItem, confirmExpandedAdd, expandedProduct, isVipProduct]);

  if (showLoader) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white">
        <MultiStepLoaderV2
          loading
          loop={false}
          duration={700}
          theme="light"
          loadingStates={[
            { text: 'Preparing store...' },
            { text: 'Loading drops...' },
            { text: 'Ready.' },
          ]}
        />
      </div>
    );
  }

  return (
    <div
      data-store-page
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'rgb(255,255,255)',
        color: '#1d1d1f',
      }}
    >
      {/* Showcase scroll animation for store page */}
      {hasMounted && <LazyShowcaseScroll startDelay={1000} enabled={true} pageId="store" />}
      <style jsx>{`
        @keyframes gridStaggerIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spotlightPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(245,158,11,0.12); }
          50% { box-shadow: 0 22px 60px rgba(245,158,11,0.2); }
        }
        .stagger-item {
          opacity: 0;
          animation: gridStaggerIn 320ms ease-out forwards;
        }
        .grid-float {
          animation: gridFloat 10s ease-in-out infinite;
        }
        .spotlight-card.spotlight-active {
          animation: spotlightPulse 2.8s ease-in-out infinite;
        }
        .grid-perf {
          content-visibility: auto;
          contain: layout paint style;
          contain-intrinsic-size: 900px 1200px;
        }
        .grid-card {
          content-visibility: auto;
          contain: layout paint style;
          contain-intrinsic-size: 280px 420px;
        }
        /* Mobile: keep layout containment, drop paint so card float/glow renders */
        @media (max-width: 767px) {
          .grid-card {
            contain: layout style;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .stagger-item,
          .grid-float {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
        :global(body.quick-view-open) .stagger-item,
        :global(body.quick-view-open) .grid-float,
        :global(body.quick-view-open) .spotlight-card.spotlight-active {
          animation: none !important;
          transform: none !important;
        }
      `}</style>
      <div
        className={`fixed left-0 right-0 z-[495] hidden lg:block transition-all duration-200 ease-out ${expandedProduct ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-full pointer-events-none'}`}
        style={{ top: 0 }}
        role="dialog"
        aria-label="Quick add preview"
        aria-hidden={!expandedProduct}
      >
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-black/5">
                {expandedPrimaryImage ? (
                  <img
                    src={expandedPrimaryImage}
                    alt={expandedProduct?.name || 'Product preview'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>
                    Preview
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  Quick add
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h3 className="truncate text-lg font-semibold tracking-tight">{expandedProduct?.name}</h3>
                  {expandedProduct && (
                    <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium" style={{ color: 'rgba(0,0,0,0.7)' }}>
                      {formatPrice(expandedProduct.base_price)}
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
                  {expandedProduct?.short_description || expandedProduct?.description || 'A focused essential designed for the desk.'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
                  {expandedVariant?.name && <span>{expandedVariant.name}</span>}
                  {(expandedInventory !== undefined || expandedIsVip) && (
                    <span className={`rounded-full px-2 py-1 ${expandedInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {expandedInStock ? (expandedIsVip ? 'Available' : `${Math.max(0, expandedInventory!)} in stock`) : 'Out of stock'}
                    </span>
                  )}
                </div>
                <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleExpandedBuy('cart')}
                    disabled={!expandedInStock}
                    className={`rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 ${
                      expandedInStock
                        ? 'bg-black text-white hover:bg-black/90'
                        : 'bg-black/10 text-black/40 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandedBuy('whop')}
                    disabled={!expandedInStock}
                    className={`rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 ${
                      expandedInStock
                        ? 'bg-white border border-black/10 text-black hover:bg-black/5'
                        : 'bg-black/10 text-black/40 cursor-not-allowed'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Pay with Whop
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 bg-black/10 text-black/40 cursor-not-allowed"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Skrill - Soon
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 bg-black/10 text-black/40 cursor-not-allowed"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Stripe - Soon
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 sm:flex-row">
                <Link
                  href={expandedDetailsHref}
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                  style={{ color: 'rgba(0,0,0,0.75)' }}
                  onClick={() => setExpandedProduct(null)}
                >
                  View details
                </Link>
                <button
                  type="button"
                  onClick={() => setExpandedProduct(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
                  style={{ color: 'rgba(0,0,0,0.6)' }}
                  aria-label="Close quick add"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO SECTION — Store mode shows regular hero, Trader mode shows MetaQuotes hero */}
      {heroMode === 'store' && (
        <section
          ref={hero.ref}
          data-apple-section
          data-store-hero
          style={{
            backgroundColor: 'rgb(255,255,255)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-visible">
            {heroMedia}
            {shouldShowHeroMapOverlay && (
              <div className="absolute inset-0 z-[2] pointer-events-none bg-white/85">
                <WorldMap dots={HERO_WORLD_MAP_DOTS} lineColor="#00D4FF" forceVisible forceLite showCryptoCoins />
              </div>
            )}
            <div
              className="absolute inset-0 z-[1]"
              style={{
                background: 'rgba(0,0,0,0.35)',
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
              }}
            />
            <div
              className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 sm:px-10 pointer-events-none"
              style={{ paddingTop: 48 + paddingBoost, paddingBottom: 40 + paddingBoost, touchAction: 'pan-y' }}
            >
              <div className="flex items-center gap-3" style={{ color: heroTitleColor, textShadow: heroTextShadow }}>
                <img
                  src="/IMG_2921.PNG"
                  alt="BullMoney"
                  className="h-16 w-auto sm:h-18"
                  loading="eager"
                  decoding="async"
                />
                <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: heroMetaColor }}>
                  BullMoney Store
                </p>
              </div>
              <h1
                className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight"
                style={{ color: heroTitleColor, textShadow: heroTitleShadow }}
              >
                Premium trading essentials, built for focus.
              </h1>
              <p
                className="mt-4 max-w-2xl text-sm sm:text-base"
                style={{ color: heroBodyColor, textShadow: heroBodyShadow }}
              >
              Clean materials, calm layouts, and purposeful gear for traders who value clarity.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 pointer-events-auto sm:flex-row lg:flex-col lg:items-start lg:w-full">
              <button
                type="button"
                onClick={handleOpenVip}
                className="rounded-full border-2 border-white/40 bg-white/10 px-5 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.08em] !text-white backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
              >
                GET VIP
              </button>
              <button
                type="button"
                onClick={handleVisitShop}
                className="rounded-full border-2 px-5 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.08em] text-white transition-transform duration-200 hover:-translate-y-0.5 lg:self-end"
                style={{
                  background: 'linear-gradient(135deg, rgba(41, 151, 255, 0.2), rgba(41, 151, 255, 0.1))',
                  borderColor: 'rgba(41, 151, 255, 0.45)',
                }}
              >
                Visit Shop
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {dashboardsSection}

      <StoreNetworkShowcase />

      {/* Products section — full width, no columns */}
      {timerSectionBlock}
      {productsSectionBlock}

      {!isDesktop && featuresSection}
      {!isDesktop && heroMode === 'trader' && metaMarketIntelligenceSection}
      {!isDesktop && testimonialsSection}

      {/* Market Quotes — show on mobile below testimonials (trader mode only) */}
      {!isDesktop && heroMode === 'trader' && metaQuotesSection}


      {/* Store Footer — always at the very bottom */}
      {footerSectionBlock}

      {studioState.open && (
        <PrintDesignStudio
          onClose={() => setStudioState({ open: false })}
          userEmail="bullmoneytraders@gmail.com"
          initialTab={studioState.tab}
          initialProductId={studioState.productId}
          initialArtId={studioState.artId}
          initialProductType={studioState.productType}
        />
      )}

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-[650] flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Checkout menu"
          onClick={(event) => {
            if (event.target === event.currentTarget) setCheckoutOpen(false);
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  Checkout menu
                </p>
                <h3 className="mt-2 text-xl font-semibold">Choose your payment method</h3>
                <p className="mt-1 text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
                  {checkoutProduct?.name ? `${checkoutProduct.name} · ${formatPrice(checkoutProduct.base_price)}` : 'Cart ready to check out.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
                style={{ color: 'rgba(0,0,0,0.6)' }}
                aria-label="Close checkout menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-5">
                <div>
                  <CryptoCheckoutTrigger
                    productName={checkoutProduct?.name || 'Product'}
                    productImage={checkoutProduct?.primary_image}
                    priceUSD={checkoutPrice}
                    productId={checkoutProduct?.id?.toString() || ''}
                    variantId={checkoutVariant?.id?.toString()}
                    quantity={1}
                    disabled={!checkoutInStock}
                  />
                </div>

                <div className="w-full flex flex-col gap-0">
                  <div className="grid grid-cols-4 w-full rounded-2xl overflow-hidden border border-black/10">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cart')}
                      className={`py-3 text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === 'cart'
                          ? 'bg-black text-white'
                          : 'bg-black/5 text-black/70 hover:bg-black/10'
                      }`}
                      aria-pressed={paymentMethod === 'cart'}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Cart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('whop')}
                      className={`py-3 text-[10px] font-bold transition-all border-l border-black/10 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === 'whop'
                          ? 'bg-black text-white'
                          : 'bg-black/5 text-black/70 hover:bg-black/10'
                      }`}
                      aria-pressed={paymentMethod === 'whop'}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Whop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('skrill')}
                      className={`py-3 text-[10px] font-bold transition-all border-l border-black/10 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === 'skrill'
                          ? 'bg-black text-white'
                          : 'bg-black/5 text-black/70 hover:bg-black/10'
                      }`}
                      aria-pressed={paymentMethod === 'skrill'}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Skrill</span>
                      <span className="text-[8px] opacity-50 leading-none -mt-0.5">Soon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`py-3 text-[10px] font-bold transition-all border-l border-black/10 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === 'stripe'
                          ? 'bg-black text-white'
                          : 'bg-black/5 text-black/70 hover:bg-black/10'
                      }`}
                      aria-pressed={paymentMethod === 'stripe'}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Stripe</span>
                      <span className="text-[8px] opacity-50 leading-none -mt-0.5">Soon</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckoutAction}
                    disabled={paymentMethod === 'stripe' || paymentMethod === 'skrill' || !checkoutInStock}
                    className={`w-full py-3.5 rounded-2xl mt-3 transition-all flex items-center justify-center gap-2 text-sm font-semibold ${
                      paymentMethod === 'stripe' || paymentMethod === 'skrill'
                        ? 'bg-black/10 text-black/40 cursor-not-allowed'
                        : paymentMethod === 'cart'
                          ? 'bg-black text-white hover:bg-black/90'
                          : 'bg-white border border-black/10 text-black hover:bg-black/5'
                    }`}
                  >
                    {paymentMethod === 'cart' && (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                    {paymentMethod === 'whop' && (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Pay with Whop</span>
                      </>
                    )}
                    {paymentMethod === 'skrill' && (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Skrill - Coming Soon</span>
                      </>
                    )}
                    {paymentMethod === 'stripe' && (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Stripe - Coming Soon</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                    Secure checkout options match the product quick view.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewerProduct && viewerMounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex h-full w-full items-center justify-center bg-white"
          role="dialog"
          aria-modal="true"
          aria-label="Product media viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewerProduct(null);
          }}
        >
          <div className="relative h-full w-full bg-white">
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/60">Preview</p>
                <h3 className="mt-1 truncate text-lg font-semibold text-black">{viewerProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewerProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black/70"
                aria-label="Close viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex h-full w-full items-center justify-center bg-white pt-16">
              {viewerMedia?.type === 'video' ? (
                <video
                  className="relative z-[10000] h-full w-full object-contain"
                  controls
                  playsInline
                >
                  <source src={viewerMedia.url} type="video/mp4" />
                </video>
              ) : viewerMedia?.url ? (
                <img
                  src={viewerMedia.url}
                  alt={viewerProduct.name}
                  className="relative z-[10000] h-full w-full object-contain"
                />
              ) : (
                <div className="py-16 text-sm text-black/60">No media available.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default StorePageClient;
