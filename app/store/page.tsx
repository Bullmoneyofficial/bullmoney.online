'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Search from 'lucide-react/dist/esm/icons/search';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import X from 'lucide-react/dist/esm/icons/x';
import type { ProductWithDetails, PaginatedResponse, ProductFilters } from '@/types/store';
import { ProductCard } from '@/components/shop/ProductCard';
import { SearchAutocomplete } from '@/components/shop/SearchAutocomplete';
import { CryptoCheckoutTrigger } from '@/components/shop/CryptoCheckoutInline';
import { WorldMapPlaceholder } from '@/components/ui/world-map-placeholder';
import { AnimatedProductGrid } from '@/components/shop/AnimatedProductGrid';
import { CircularProductGrid } from '@/components/shop/CircularProductGrid';
import { GlassProductGrid } from '@/components/shop/GlassProductGrid';
import { ProductsCarousel } from '@/components/shop/ProductsCarousel';
import { StorePillNav } from '@/components/store/StorePillNav';
import { useStoreSection } from './StoreMemoryContext';
import { buildUrlParams, hasActiveFilters as checkActiveFilters } from './store.utils';
import { SORT_OPTIONS, CATEGORIES } from './store.config';
import { useCartStore } from '@/stores/cart-store';
import { useProductsModalUI } from '@/contexts/UIStateContext';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { isMobileDevice } from '@/lib/mobileDetection';
import { userStorage } from '@/lib/smartStorage';

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

const GRID_VARIANTS = [
  { value: 'animated', label: 'Animated grid', group: 'Dynamic' },
  { value: 'circular', label: 'Circular grid', group: 'Dynamic' },
  { value: 'glass', label: 'Glass grid', group: 'Dynamic' },
  { value: 'carousel', label: 'Carousel', group: 'Dynamic' },
  { value: 'compact', label: 'Compact grid', group: 'Classic' },
  { value: 'masonry', label: 'Masonry columns', group: 'Classic' },
  { value: 'list', label: 'List stack', group: 'Classic' },
  { value: 'stacked', label: 'Stacked hero', group: 'Classic' },
  { value: 'tiles', label: 'Tile wall', group: 'Classic' },
  { value: 'compact-2', label: 'Compact tight', group: 'Compact' },
  { value: 'micro', label: 'Micro tiles', group: 'Compact' },
  { value: 'dense', label: 'Dense grid', group: 'Compact' },
  { value: 'snug', label: 'Snug grid', group: 'Compact' },
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
  { value: 'spotlight', label: 'Spotlight', group: 'Style' },
  { value: 'panel', label: 'Panel grid', group: 'Style' },
  { value: 'frame', label: 'Framed cards', group: 'Style' },
  { value: 'shadow', label: 'Shadow stack', group: 'Style' },
  { value: 'borderless', label: 'Borderless', group: 'Style' },
] as const;

const GRID_VARIANT_GROUP_ORDER = ['Dynamic', 'Classic', 'Compact', 'Layout', 'Style'] as const;
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
  const buckets = {
    'world-map': [] as number[],
    spline: [] as number[],
    image: [] as number[],
    video: [] as number[],
  };

  HERO_CAROUSEL_SLIDES.forEach((slide, index) => {
    buckets[slide.type].push(index);
  });

  const roll = Math.random();
  const cutoffs = [
    HERO_TYPE_WEIGHTS['world-map'],
    HERO_TYPE_WEIGHTS['world-map'] + HERO_TYPE_WEIGHTS.spline,
    HERO_TYPE_WEIGHTS['world-map'] + HERO_TYPE_WEIGHTS.spline + HERO_TYPE_WEIGHTS.image,
  ];

  let type: keyof typeof buckets = 'video';
  if (roll < cutoffs[0]) type = 'world-map';
  else if (roll < cutoffs[1]) type = 'spline';
  else if (roll < cutoffs[2]) type = 'image';

  const pool = buckets[type];
  if (!pool.length) return 0;
  return pool[Math.floor(Math.random() * pool.length)];
};

type StorePageProps = {
  routeBase?: string;
  syncUrl?: boolean;
  showProductSections?: boolean;
};

export default function StorePage({ routeBase = '/store', syncUrl = true, showProductSections = true }: StorePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hero = useStoreSection('hero');
  const productsSection = useStoreSection('products');
  const featuredSection = useStoreSection('featured');
  const footerSection = useStoreSection('footer');
  const [heroMode, setHeroMode] = useState<'store' | 'trader'>('store');
  const showProducts = showProductSections && heroMode === 'store';

  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [expandedProduct, setExpandedProduct] = useState<ProductWithDetails | null>(null);
  const [viewerProduct, setViewerProduct] = useState<ProductWithDetails | null>(null);
  const [viewerMounted, setViewerMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUltraWide, setIsUltraWide] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<ProductWithDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    'cart' | 'stripe' | 'whop' | 'skrill'
  >('cart');
  const [useGridLayouts, setUseGridLayouts] = useState(true);
  const [productsGridVariant, setProductsGridVariant] = useState<GridVariant>('spotlight');
  const [featuredGridVariant, setFeaturedGridVariant] = useState<GridVariant>('spotlight');
  const [timelineGridVariant, setTimelineGridVariant] = useState<GridVariant>('spotlight');
  const [heroSlideIndex, setHeroSlideIndex] = useState(() => pickHeroSlideIndex());
  const [showHeroMapOverlay] = useState(() => Math.random() < 0.05);
  const heroCacheLoadedRef = useRef(false);
  const resolvedHeroSlide = useMemo(() => {
    if (!hasMounted || isMobile) {
      return HERO_CAROUSEL_SLIDES.find((slide) => slide.type === 'image') || HERO_CAROUSEL_SLIDES[0];
    }
    return HERO_CAROUSEL_SLIDES[heroSlideIndex];
  }, [hasMounted, isMobile, heroSlideIndex]);
  const heroIsWorldMap = resolvedHeroSlide?.type === 'world-map';
  const allowHeavyHero = hasMounted;
  const heroTitleColor = 'rgb(255,255,255)';
  const heroMetaColor = 'rgb(255,255,255)';
  const heroBodyColor = 'rgb(255,255,255)';
  const heroTextShadow = heroIsWorldMap ? 'none' : '0 6px 18px rgba(0,0,0,0.45)';
  const heroTitleShadow = heroIsWorldMap ? 'none' : '0 10px 30px rgba(0,0,0,0.5)';
  const heroBodyShadow = heroIsWorldMap ? 'none' : '0 8px 22px rgba(0,0,0,0.4)';
  const shouldShowHeroMapOverlay = allowHeavyHero && showHeroMapOverlay;
  useEffect(() => {
    if (heroCacheLoadedRef.current) return;
    heroCacheLoadedRef.current = true;

    const cachedIndex = userStorage.get<number>(HERO_CACHE_KEY, null);
    if (typeof cachedIndex === 'number' && cachedIndex >= 0 && cachedIndex < HERO_CAROUSEL_SLIDES.length) {
      setHeroSlideIndex(cachedIndex);
    }
  }, []);

  useEffect(() => {
    if (!heroCacheLoadedRef.current) return;
    userStorage.set(HERO_CACHE_KEY, heroSlideIndex, HERO_CACHE_TTL);
  }, [heroSlideIndex]);


  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { open: openProductsModal } = useProductsModalUI();

  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort_by: (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest',
  });

  const [showLoader, setShowLoader] = useState(true);

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


  const handleOpenVip = useCallback(() => {
    SoundEffects.click();
    openProductsModal();
  }, [openProductsModal]);

  const handleVisitShop = useCallback(() => {
    SoundEffects.click();
    if (!showProducts && showProductSections) {
      setHeroMode('store');
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

  const columnNavItems = useMemo(() => ([
    { label: 'Home', href: '/' },
    { label: 'Store', href: '/store' },
    { label: 'Apparel', href: '/store?category=apparel' },
    { label: 'Accessories', href: '/store?category=accessories' },
    { label: 'Tech & Gear', href: '/store?category=tech-gear' },
    { label: 'Drinkware', href: '/store?category=drinkware' },
  ]), []);

  const columnDesktopLinks = useMemo(() => ([
    { label: 'Products', onClick: () => openProductsModal(), variant: 'link' as const },
    { label: 'VIP', href: '/VIP', variant: 'link' as const },
    { label: 'Community', href: '/community', variant: 'link' as const },
  ]), [openProductsModal]);

  const columnHeaderSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <StorePillNav
          items={columnNavItems}
          desktopLinks={columnDesktopLinks}
          position="static"
          showSearch={true}
          showUser={true}
          showCart={true}
          cartCount={cartCount}
          onCartClick={openCart}
          onSearchClick={handleVisitShop}
          onUserClick={() => router.push('/login')}
        />
      </div>
    </section>
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoader(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

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
    signal?: AbortSignal
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

      const response = await fetch(`/api/store/products?${params.toString()}`, { signal });
      const data: PaginatedResponse<ProductWithDetails> = await response.json();

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
      default:
        return null;
    }
  }, [fetchProducts, hasMore, isMobile, isUltraWide, loadingMore, page]);

  useEffect(() => {
    if (!showProducts) return;
    const controller = new AbortController();
    fetchProducts(1, false, controller.signal);
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

  const canAddToCart = useCallback((product: ProductWithDetails) => {
    const variant = product.variants?.[0];
    return Boolean(variant && variant.inventory_count > 0);
  }, []);

  const handleAddToCart = useCallback((product: ProductWithDetails) => {
    const variant = product.variants?.[0];
    if (!variant || variant.inventory_count <= 0) return;
    addItem(product, variant, 1);
  }, [addItem]);

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
    if (!variant || variant.inventory_count <= 0) return;

    if (paymentMethod === 'cart') {
      addItem(checkoutProduct, variant, 1);
      setCheckoutOpen(false);
      return;
    }

    if (paymentMethod === 'whop') {
      const buyUrl = (checkoutProduct.details as { buy_url?: string } | undefined)?.buy_url;
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
            price: variant.price || checkoutProduct.base_price,
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
  }, [addItem, checkoutProduct, paymentMethod]);

  const hasActiveFilters = checkActiveFilters(filters, debouncedSearch);
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const timelineProducts = useMemo(() => products.slice(4, 8), [products]);
  const heroMedia = useMemo(() => {
    const slide = resolvedHeroSlide;
    if (!allowHeavyHero && (slide.type === 'world-map' || slide.type === 'spline')) {
      return (
        <img
          src="/Img1.jpg"
          alt="BullMoney hero"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      );
    }

    if (slide.type === 'image') {
      return (
        <img
          src={slide.src}
          alt={slide.alt}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      );
    }

    if (slide.type === 'video') {
      return (
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={slide.poster}
        >
          <source src={slide.src} type="video/mp4" />
        </video>
      );
    }

    if (slide.type === 'world-map') {
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
        <SplineBackground scene={slide.scene} className="h-full w-full" priority />
      </div>
    );
  }, [allowHeavyHero, resolvedHeroSlide]);

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
  const expandedInStock = expandedProduct ? canAddToCart(expandedProduct) : false;
  const expandedBuyUrl = (expandedProduct?.details as { buy_url?: string } | undefined)?.buy_url;
  const expandedDetailsHref = expandedBuyUrl || '/VIP';
  const checkoutVariant = checkoutProduct?.variants?.[0];
  const checkoutInStock = Boolean(checkoutVariant && checkoutVariant.inventory_count > 0);
  const checkoutPrice = checkoutVariant?.price || checkoutProduct?.base_price || 0;
  const dashboardsSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
    >
      <div className="mx-auto w-full max-w-[26rem] sm:max-w-3xl lg:max-w-[90rem] px-4 sm:px-8" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
            Live dashboards
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Market intelligence.</h2>
          <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(0,0,0,0.6)' }}>
            A streamlined look at quotes, headlines, and community signals tailored for the store.
          </p>
        </div>

        <div className="mt-6 lg:hidden">
          <ToastProvider>
            <QuotesSection />
            <BreakingNewsSection />
            <TelegramSection />
          </ToastProvider>
        </div>

        <div className="mt-6 hidden lg:grid gap-6 lg:grid-cols-1">
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
                <MetaTraderQuotes embedded />
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
                <BreakingNewsTicker />
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Community Signals</h3>
              <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Live
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[420px] lg:min-h-[calc(100vh-220px)] flex-1">
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <BullMoneyCommunity />
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
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
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
              <MetaTraderQuotes embedded />
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
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
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
  const testimonialsSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
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
  const heroDuplicateSection = (
    <section
      data-apple-section
      style={{ backgroundColor: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-8" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <div className="relative min-h-[70vh] w-full overflow-hidden rounded-3xl border border-black/10">
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
            className="relative z-10 flex min-h-[70vh] w-full flex-col justify-center px-6 sm:px-10"
            style={{ color: heroTitleColor, textShadow: heroTextShadow }}
          >
            <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: heroMetaColor }}>
              Trader mode
            </p>
            <h2 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight">
              Market focus, visualized.
            </h2>
            <p className="mt-3 max-w-xl text-sm sm:text-base" style={{ color: heroBodyColor, textShadow: heroBodyShadow }}>
              A second view of the live hero scene to keep context alongside your dashboards.
            </p>
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
      }}
    >
      <div
        className="bg-white"
        style={{ backgroundColor: 'rgb(255,255,255)', filter: 'invert(1) hue-rotate(180deg)' }}
      >
        <FooterComponent />
      </div>
    </section>
  );
  const productsSectionBlock = showProducts ? (
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
            <div className="mt-6">
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
                <div className="mt-6">
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
                <div className="mt-6">
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
  const handleExpandedBuy = useCallback(async (method: typeof paymentMethod) => {
    if (!expandedProduct) return;
    const variant = expandedProduct.variants?.[0];
    if (!variant || variant.inventory_count <= 0) return;

    if (method === 'cart') {
      confirmExpandedAdd();
      return;
    }

    if (method === 'whop') {
      const buyUrl = (expandedProduct.details as { buy_url?: string } | undefined)?.buy_url;
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
            price: variant.price || expandedProduct.base_price,
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
  }, [confirmExpandedAdd, expandedProduct]);

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
                  {expandedInventory !== undefined && (
                    <span className={`rounded-full px-2 py-1 ${expandedInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {expandedInStock ? `${Math.max(0, expandedInventory)} in stock` : 'Out of stock'}
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

      <section
        ref={hero.ref}
        data-apple-section
        data-store-hero
        style={{
          backgroundColor: 'rgb(255,255,255)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="relative min-h-screen w-full overflow-hidden">
          {showProductSections && (
            <div className="absolute right-6 top-6 z-20 flex items-center gap-3 rounded-full border border-white/15 bg-black/65 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <span className="hidden sm:inline text-white/60">Mode</span>
              <div className="flex overflow-hidden rounded-full border border-white/20 bg-white/5">
                <button
                  type="button"
                  onClick={() => setHeroMode('store')}
                  className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors ${
                    heroMode === 'store'
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Store
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode('trader')}
                  className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors ${
                    heroMode === 'trader'
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Trader
                </button>
              </div>
            </div>
          )}
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
            style={{ paddingTop: 48 + paddingBoost, paddingBottom: 40 + paddingBoost }}
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
                className="rounded-full border-2 border-white/40 bg-white/10 px-5 py-2 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
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

      <div className="w-full lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:items-start lg:h-[calc(100vh-64px)] lg:overflow-hidden">
        <div className="lg:pr-3 lg:max-h-full lg:overflow-y-auto store-column-scroll">
          {isDesktop && columnHeaderSection}
          {isDesktop && heroMode === 'store' && featuresSection}
          {isDesktop && heroMode === 'store' && productsSectionBlock}
          {isDesktop && heroMode === 'store' && footerSectionBlock}
          {isDesktop && heroMode === 'trader' && dashboardsSection}
        </div>

        <div className="space-y-0 lg:max-h-full lg:overflow-y-auto lg:pr-2 store-column-scroll">
          {isDesktop && columnHeaderSection}
          {isDesktop && heroMode === 'store' && dashboardsSection}
          {isDesktop && heroMode === 'store' && testimonialsSection}
          {isDesktop && heroMode === 'store' && footerSectionBlock}
          {isDesktop && heroMode === 'trader' && heroDuplicateSection}
          {isDesktop && heroMode === 'trader' && featuresSection}
          {isDesktop && heroMode === 'trader' && testimonialsSection}
          {isDesktop && heroMode === 'trader' && footerSectionBlock}
          {!isDesktop && dashboardsSection}
        </div>
      </div>

      {isDesktop && productsSectionBlock}
      {isDesktop && featuresSection}
      {isDesktop && metaQuotesSection}
      {isDesktop && footerSectionBlock}

      {(!isDesktop || heroMode !== 'store') && productsSectionBlock}

      {!isDesktop && featuresSection}
      {!isDesktop && testimonialsSection}
      {!isDesktop && footerSectionBlock}

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
