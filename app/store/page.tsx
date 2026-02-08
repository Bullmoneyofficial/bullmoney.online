'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, Sparkles, LayoutGrid, Rows3, Layers, Clock, LayoutDashboard } from 'lucide-react';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import type { ProductWithDetails, PaginatedResponse, ProductFilters } from '@/types/store';
import { useStoreSection } from './StoreMemoryContext';
import { useSound } from '@/contexts/SoundContext';

// ✅ PERFORMANCE HOOKS - Matching app/page.tsx optimization stack
import { useScrollOptimization } from '@/hooks/useScrollOptimization';
import { useBigDeviceScrollOptimizer } from '@/lib/bigDeviceScrollOptimizer';
import { useMobileLazyRender } from '@/hooks/useMobileLazyRender';
import { useUnifiedPerformance } from '@/lib/UnifiedPerformanceSystem';
import { useComponentTracking, useCrashTracker } from '@/lib/CrashTracker';
import { deferAnalytics, smartPrefetch } from '@/lib/prefetchHelper';
import {
  ShimmerSpinner,
  ShimmerRadialGlow,
} from '@/components/ui/UnifiedShimmer';

// ============================================================================
// ✅ OPTIMIZED IMPORTS - Split into separate modules for faster compilation
// ============================================================================
import {
  CookieConsent,
  StoreHero3D,
  CircularProductGrid,
  AnimatedProductGrid,
  ProductsCarousel,
  ProductCard,
  HoverEffect,
  FilterSheet,
  FocusCards,
  FeaturedProductsTimeline,
  GlassProductGrid,
  StoreFluidGlassSection,
  StoreFooter,
  SearchAutocomplete,
  WorldMap,
  InfiniteMenu,
  FlyingPosters,
  MarketPriceTicker,
  RewardsCardBanner,
  RewardsCard,
  MotionDiv,
  AnimatePresence,
} from './store.imports';

import {
  SORT_OPTIONS,
  CATEGORIES,
  MOBILE_COLUMN_OPTIONS,
  DESKTOP_COLUMN_OPTIONS,
  GRID_ROW_OPTIONS,
  FOCUS_LAYOUT_OPTIONS,
} from './store.config';

import {
  getGridClasses,
  hasActiveFilters as checkActiveFilters,
  buildUrlParams,
  getFocusMaxItems,
  getGridViewProducts,
} from './store.utils';

import { useProgressiveLoad, useIdleEffect } from './store.hooks';

export default function StorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ PERFORMANCE OPTIMIZATION STACK - Matching app/page.tsx patterns
  // Progressive loading - renders in stages for faster initial load
  const { showCritical, showInteractive, showBelowFold, showHeavy } = useProgressiveLoad();
  
  // Scroll optimization for 120fps - same as home page
  useScrollOptimization();
  const { optimizeSection } = useBigDeviceScrollOptimizer();
  
  // Device tier awareness, FPS monitoring, preload/unload hints
  const {
    deviceTier,
    registerComponent,
    unregisterComponent,
    averageFps,
    shimmerQuality,
    preloadQueue,
    unloadQueue,
  } = useUnifiedPerformance();
  
  // Crash & perf tracking
  const { trackClick, trackError, trackCustom } = useComponentTracking('store-page');
  const { trackPerformanceWarning } = useCrashTracker();
  
  // Mobile lazy render (smart, not just a 400ms timeout)
  const { shouldRender: allowMobileLazyRender } = useMobileLazyRender(240);
  
  // Heavy desktop gating via requestIdleCallback (same pattern as home page)
  const [allowHeavyDesktop, setAllowHeavyDesktop] = useState(false);
  
  // Initialize trading sounds from context
  const { sounds } = useSound();
  
  // Recruit auth for rewards
  const { recruit } = useRecruitAuth();
  const [rewardsCardOpen, setRewardsCardOpen] = useState(false);
  
  // Smart memory: per-section visibility via IntersectionObserver
  const hero = useStoreSection('hero');
  const featured = useStoreSection('featured');
  const productsSection = useStoreSection('products');
  const fluidGlass = useStoreSection('fluidGlass');
  const footer = useStoreSection('footer');
  
  // State
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileColumns, setMobileColumns] = useState(2);
  const [desktopColumns, setDesktopColumns] = useState(5);
  const [mobileRows, setMobileRows] = useState(2);
  const [desktopRows, setDesktopRows] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'circular' | 'grid' | 'animated'>('carousel'); // Default to carousel view
  const [gridLayoutOpen, setGridLayoutOpen] = useState(false);
  const gridLayoutRef = useRef<HTMLDivElement>(null);
  const gridLayoutMobileRef = useRef<HTMLDivElement>(null);
  const [focusMobileColumns, setFocusMobileColumns] = useState<1 | 2 | 3>(2);
  const [focusDesktopColumns, setFocusDesktopColumns] = useState<1 | 2 | 3>(2);
  const [focusMobileRows, setFocusMobileRows] = useState<1 | 2 | 3>(3);
  const [focusDesktopRows, setFocusDesktopRows] = useState<1 | 2 | 3>(1);
  const [vipProducts, setVipProducts] = useState<{ id: string; name: string; price: number; image_url?: string; imageUrl?: string; visible?: boolean }[]>([]);
  const [featuredViewMode, setFeaturedViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [timelineVisible, setTimelineVisible] = useState(true);
  const featuredSectionRef = useRef<HTMLElement>(null);

  // Close grid layout dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        gridLayoutRef.current && !gridLayoutRef.current.contains(e.target as Node) &&
        gridLayoutMobileRef.current && !gridLayoutMobileRef.current.contains(e.target as Node)
      ) {
        setGridLayoutOpen(false);
      }
    };
    if (gridLayoutOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [gridLayoutOpen]);
  
  // Search state with debouncing
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort_by: (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest',
  });

  // Sync filters with URL params when they change (e.g., from header pill nav)
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlMinPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
    const urlMaxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;
    const urlSortBy = (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest';
    const urlSearch = searchParams.get('search') || '';
    
    setFilters(prev => {
      // Only update if different to avoid infinite loops
      if (prev.category !== urlCategory || prev.min_price !== urlMinPrice || 
          prev.max_price !== urlMaxPrice || prev.sort_by !== urlSortBy) {
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
  }, [searchParams]);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const autoLoadRef = useRef(0);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Detect mobile — debounced to avoid layout thrash on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId) return; // skip if already queued
      rafId = requestAnimationFrame(() => {
        checkMobile();
        rafId = null;
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ✅ DEFERRED ANALYTICS - Load analytics after page is interactive (same as home page)
  useEffect(() => {
    deferAnalytics(() => {
      import('@/lib/analytics').then(({ trackEvent, BullMoneyAnalytics }) => {
        console.log('[Store] Analytics loaded after page interaction');
      });
    });

    // Smart prefetch likely navigation routes after initial load
    smartPrefetch([
      { href: '/', options: { priority: 'low' } },
      { href: '/store/checkout', options: { priority: 'low' } },
      { href: '/trading-showcase', options: { priority: 'low' } },
      { href: '/community', options: { priority: 'low' } },
    ]);

    // ✅ SPLINE PRELOAD — Same strategy as home page
    // Preload runtime + scene file during idle time so 3D loads instantly
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const preloadSpline = () => {
        // 1. Preload Spline runtime (shares module cache with spline-wrapper)
        import('@splinetool/runtime').catch(() => {});
        // 2. Preload the wrapper component  
        import('@/lib/spline-wrapper').catch(() => {});
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadSpline, { timeout: 2000 });
      } else {
        setTimeout(preloadSpline, 1000);
      }
    }
  }, []);

  // ✅ HEAVY DESKTOP GATING via requestIdleCallback (same as home page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMobile) {
      setAllowHeavyDesktop(false);
      return;
    }

    let cancelled = false;
    const enable = () => {
      if (!cancelled) setAllowHeavyDesktop(true);
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        (window as any).cancelIdleCallback(id);
      };
    }

    const timeout = setTimeout(enable, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isMobile]);

  // ✅ FPS TRACKING - Monitor drops same as home page
  useEffect(() => {
    if (averageFps < 25) {
      trackPerformanceWarning('store-page', averageFps, `FPS dropped to ${averageFps}`);
    }
  }, [averageFps, trackPerformanceWarning]);

  // ✅ COMPONENT REGISTRATION for unified performance tracking
  const componentsRegisteredRef = useRef(false);
  const registerComponentRef = useRef(registerComponent);
  const unregisterComponentRef = useRef(unregisterComponent);
  const trackCustomRef = useRef(trackCustom);
  const optimizeSectionRef = useRef(optimizeSection);

  useEffect(() => {
    registerComponentRef.current = registerComponent;
    unregisterComponentRef.current = unregisterComponent;
    trackCustomRef.current = trackCustom;
    optimizeSectionRef.current = optimizeSection;
  });

  useEffect(() => {
    if (showInteractive && !componentsRegisteredRef.current) {
      componentsRegisteredRef.current = true;
      registerComponentRef.current('store-hero', 9);
      registerComponentRef.current('store-products', 7);
      registerComponentRef.current('store-ticker', 5);
      trackCustomRef.current('store_loaded', { deviceTier, shimmerQuality });

      if (typeof window !== 'undefined' && window.innerWidth >= 1440) {
        setTimeout(() => {
          optimizeSectionRef.current('hero');
          optimizeSectionRef.current('products');
        }, 100);
      }
    }
    return () => {
      if (componentsRegisteredRef.current) {
        componentsRegisteredRef.current = false;
        unregisterComponentRef.current('store-hero');
        unregisterComponentRef.current('store-products');
        unregisterComponentRef.current('store-ticker');
      }
    };
  }, [showInteractive, deviceTier, shimmerQuality]);

  // Smart preloading based on usage patterns
  useEffect(() => {
    if (preloadQueue.length > 0) {
      console.log('[Store] Preload suggestions:', preloadQueue);
    }
    if (unloadQueue.length > 0) {
      console.log('[Store] Unload suggestions:', unloadQueue);
    }
  }, [preloadQueue, unloadQueue]);

  // ✅ MOBILE DEFERRAL - Use smart useMobileLazyRender instead of simple timeout
  useEffect(() => {
    if (!isMobile) {
      setMobileDeferReady(true);
      return;
    }
    // Use the hook-based signal for smarter deferral
    setMobileDeferReady(allowMobileLazyRender);
  }, [isMobile, allowMobileLazyRender]);

  // Manual toggle only — timeline stays as default, grid only if user selects it
  const handleFeaturedViewChange = useCallback((mode: 'timeline' | 'grid') => {
    sounds.buttonClick();
    setFeaturedViewMode(mode);
    setTimelineVisible(mode === 'timeline');
  }, [sounds]);

  const focusCards = useMemo(() => {
    return vipProducts
      .map((vip) => {
        const src = vip.image_url || vip.imageUrl || '';
        if (!src) return null;
        return {
          title: vip.name || 'VIP Product',
          src,
          price: vip.price,
          description: (vip as any).description || '',
          comingSoon: (vip as any).coming_soon || false,
          buyUrl: (vip as any).buy_url || '',
        };
      })
      .filter(Boolean)
      .slice(0, 9) as { title: string; src: string; price: number; description: string; comingSoon: boolean; buyUrl: string }[];
  }, [vipProducts]);

  const focusMaxItems = useMemo(() => 
    getFocusMaxItems(isMobile, focusCards.length, focusDesktopColumns, focusDesktopRows),
    [isMobile, focusCards.length, focusDesktopColumns, focusDesktopRows]
  );

  const gridViewProducts = useMemo(() => 
    getGridViewProducts(products, isMobile, mobileColumns, desktopColumns, mobileRows, desktopRows),
    [products, isMobile, mobileColumns, desktopColumns, mobileRows, desktopRows]
  );

  // ✅ MEMOIZE GRID RENDER ITEM — prevents HoverEffect children from remounting
  const isCompactGrid = mobileColumns >= 3 || desktopColumns >= 7;
  const gridGetKey = useCallback((product: any) => (product as ProductWithDetails).id, []);
  const gridGetLink = useCallback(() => undefined, []);
  const gridRenderItem = useCallback((product: any, index: number) => (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className="h-full w-full mb-6 relative"
      style={{ overflow: 'visible', zIndex: 1 }}
    >
      <ProductCard product={product as ProductWithDetails} compact={isCompactGrid} />
    </MotionDiv>
  ), [isCompactGrid]);

  const canRenderMobileSections = !isMobile || allowMobileLazyRender;
  const canRenderHeavyDesktop = !isMobile && allowHeavyDesktop;

  // ✅ MEMOIZE STATIC OBJECTS — prevent re-creating on every render
  const worldMapDots = useMemo(() => [
    { start: { lat: 40.7128, lng: -74.006, label: 'New York' }, end: { lat: 51.5074, lng: -0.1278, label: 'London' } },
    { start: { lat: 51.5074, lng: -0.1278, label: 'London' }, end: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' } },
    { start: { lat: 40.7128, lng: -74.006, label: 'New York' }, end: { lat: -33.8688, lng: 151.2093, label: 'Sydney' } },
    { start: { lat: 1.3521, lng: 103.8198, label: 'Singapore' }, end: { lat: 25.2048, lng: 55.2708, label: 'Dubai' } },
    { start: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' }, end: { lat: 22.3193, lng: 114.1694, label: 'Hong Kong' } },
    { start: { lat: 51.5074, lng: -0.1278, label: 'London' }, end: { lat: -33.9249, lng: 18.4241, label: 'Cape Town' }, color: '#3B82F6' },
  ], []);

  const shouldShowHero = hero.shouldRender && (showHeavy || (isMobile && showInteractive));
  const [mobileDeferReady, setMobileDeferReady] = useState(true);
  const shouldShowBelowFold = showBelowFold && (!isMobile || mobileDeferReady) && canRenderMobileSections;
  const shouldShowHeavySections = showHeavy && (canRenderHeavyDesktop || (isMobile && mobileDeferReady && canRenderMobileSections));

  // ✅ STAGGERED HEAVY SECTIONS — like home page sequenceStage
  // Only render 1-2 heavy sections at a time to avoid GPU overload
  const [heavyStage, setHeavyStage] = useState(0);
  useEffect(() => {
    if (!shouldShowHeavySections) { setHeavyStage(0); return; }
    // Stage 1: Featured products (lightweight)
    setHeavyStage(1);
    const t2 = setTimeout(() => setHeavyStage(2), 400);   // Stage 2: WorldMap
    const t3 = setTimeout(() => setHeavyStage(3), 1200);  // Stage 3: FluidGlass (heaviest)
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, [shouldShowHeavySections]);

  const shouldShowFeatured = shouldShowBelowFold;
  const shouldShowWorldMap = shouldShowHeavySections && heavyStage >= 2;
  const [showInfiniteMenu, setShowInfiniteMenu] = useState(false);

  // Logo items for InfiniteMenu
  const infiniteMenuItems = useMemo(() => [
    { image: '/bullmoney-logo.png', link: '/', title: 'Bull Money', description: 'Trading Community' },
    { image: '/FTMO_LOGO.png', link: 'https://ftmo.com', title: 'FTMO', description: 'Prop Trading' },
    { image: '/Vantage-logo.jpg', link: 'https://vantage.com', title: 'Vantage', description: 'Forex Broker' },
    { image: '/GTFLOGO.png', link: '/', title: 'GTF', description: 'Get Funded' },
    { image: '/eqlogo.png', link: '/', title: 'EQ', description: 'Trading Tools' },
    { image: '/xm-logo.png', link: 'https://xm.com', title: 'XM', description: 'Global Broker' },
    { image: '/FTMO_LOGOB.png', link: 'https://ftmo.com', title: 'FTMO', description: 'Challenge' },
    { image: '/bullmoneyvantage.png', link: '/', title: 'Bull x Vantage', description: 'Partnership' },
  ], []);

  // Logo image paths for FlyingPosters
  const flyingPosterImages = useMemo(() => [
    '/bullmoney-logo.png',
    '/FTMO_LOGO.png',
    '/Vantage-logo.jpg',
    '/GTFLOGO.png',
    '/eqlogo.png',
    '/xm-logo.png',
    '/FTMO_LOGOB.png',
    '/bullmoneyvantage.png',
  ], []);
  // FluidGlass = heaviest WebGL component — only on desktop, only after everything else
  const shouldShowFluidGlass = canRenderHeavyDesktop && heavyStage >= 3;
  const shouldShowFooter = shouldShowBelowFold;

  // ✅ PAUSE HERO WHEN SCROLLED OUT OF VIEW — stops Spline + all animations
  const isHeroPaused = !hero.shouldAnimate;


  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '12');
      
      if (filters.category) params.set('category', filters.category);
      if (filters.min_price) params.set('min_price', filters.min_price.toString());
      if (filters.max_price) params.set('max_price', filters.max_price.toString());
      if (filters.sort_by) params.set('sort_by', filters.sort_by);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/store/products?${params}`);
      const data: PaginatedResponse<ProductWithDetails> = await response.json();

      if (append) {
        setProducts(prev => [...prev, ...(data.data || [])]);
      } else {
        setProducts(data.data || []);
      }
      
      setTotal(data.total);
      setHasMore(data.has_more);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, debouncedSearch]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Fetch VIP products - DEFERRED until below-fold content loads
  useIdleEffect(() => {
    if (!showBelowFold) return;
    
    const fetchVip = async () => {
      try {
        const res = await fetch('/api/store/vip');
        const json = res.ok ? await res.json() : { data: [] };
        const items = (json.data || []).filter((item: any) => item.visible !== false);
        setVipProducts(items);
      } catch (err) {
        // Silently degrade — VIP section will just be empty
        if (process.env.NODE_ENV === 'development') console.warn('VIP fetch skipped:', err);
      }
    };
    fetchVip();
  }, [showBelowFold]);

  // Update URL with filters
  useEffect(() => {
    const params = buildUrlParams(filters, debouncedSearch);
    const newUrl = params.toString() ? `/store?${params}` : '/store';
    router.replace(newUrl, { scroll: false });
  }, [filters, debouncedSearch, router]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProducts(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchProducts]);

  // Ensure small screens load enough items to fill the viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768) return;
    if (loading || loadingMore || !hasMore) return;
    if (products.length === 0) return;

    if (products.length < 8 && autoLoadRef.current < 2) {
      autoLoadRef.current += 1;
      fetchProducts(page + 1, true);
    }
  }, [products.length, hasMore, loading, loadingMore, page, fetchProducts]);

  const handleFilterChange = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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

  const hasActiveFilters = checkActiveFilters(filters, debouncedSearch);

  return (
    <div className="bg-black" style={{ height: 'auto', minHeight: '100vh', overflow: 'visible' }} data-allow-scroll data-scrollable data-content>
      {/* Rewards Card Banner - Load when interactive */}
      {showInteractive && (
        <RewardsCardBanner 
          userEmail={recruit?.email || null}
          onOpenRewardsCard={() => setRewardsCardOpen(true)}
        />
      )}
      
      {/* Rewards Card Modal */}
      {showInteractive && (
        <RewardsCard
          isOpen={rewardsCardOpen}
          onClose={() => setRewardsCardOpen(false)}
          userEmail={recruit?.email || null}
        />
      )}
      
      {/* Hero Section - 3D Spline Hero - DEFERRED to improve initial load */}
      <div
        ref={hero.ref}
        style={{
          minHeight: 400,
          contain: 'layout style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 400px',
        } as React.CSSProperties}
        data-allow-scroll
        data-content
      >
        {shouldShowHero ? (
          <StoreHero3D paused={isHeroPaused} />
        ) : (
          <div className="w-full h-100 bg-linear-to-b from-black via-zinc-900/50 to-black flex items-center justify-center">
            <ShimmerRadialGlow color="white" intensity="low" />
            <ShimmerSpinner size={48} color="white" />
          </div>
        )}
      </div>

      {/* Market Price Ticker - Top - Only render when below fold AND visible */}
      <div
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 48px',
          visibility: shouldShowBelowFold ? 'visible' : 'hidden',
          height: shouldShowBelowFold ? 'auto' : 0,
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {shouldShowBelowFold && <MarketPriceTicker direction="left" speed={15} />}
      </div>

      {/* World Map / Flying Posters Section — ✅ Toggle between views */}
      <section
        className={`relative w-full overflow-hidden bg-black transition-all duration-700 ease-in-out ${
          showInfiniteMenu ? 'min-h-[80vh] md:min-h-[120vh]' : 'min-h-[50vh] md:h-screen'
        }`}
        style={{
          contain: 'style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: showInfiniteMenu ? 'auto 120vh' : 'auto 50vh',
        } as React.CSSProperties}
        data-allow-scroll
        data-content
      >
        {/* Toggle Button */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setShowInfiniteMenu(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-300"
          >
            {showInfiniteMenu ? (
              <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Map View</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> Partners</>
            )}
          </button>
        </div>

        {/* World Map View */}
        {!showInfiniteMenu && shouldShowWorldMap && (
          <div className="absolute inset-0 z-0">
            <WorldMap
              dots={worldMapDots}
              lineColor="#ffffff"
            />
          </div>
        )}

        {/* Flying Posters View */}
        {showInfiniteMenu && shouldShowWorldMap && (
          <div className="absolute inset-0 z-0">
            <FlyingPosters
              items={flyingPosterImages}
              planeWidth={160}
              planeHeight={160}
              distortion={2}
              scrollEase={0.01}
              cameraFov={50}
              cameraZ={12}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Overlay Text — only show on map view */}
        {!showInfiniteMenu && (
          <div className="absolute inset-x-0 top-8 md:inset-0 z-10 flex items-start md:items-center justify-center">
            <div className="text-center px-4">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Pay With Crypto
              </h2>
              <p className="text-white/60 text-base md:text-xl max-w-2xl mx-auto">
                Our store accepts Bitcoin, Ethereum & more
              </p>
            </div>
          </div>
        )}

        {/* Overlay Text — Infinite Menu view */}
        {showInfiniteMenu && (
          <div className="absolute inset-x-0 top-8 z-10 flex justify-center pointer-events-none">
            <div className="text-center px-4">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                Our Partners
              </h2>
              <p className="text-white/50 text-sm md:text-lg max-w-2xl mx-auto">
                Trusted brokers & prop firms we work with
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Market Price Ticker - Bottom */}
      <div
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 48px',
          visibility: shouldShowBelowFold ? 'visible' : 'hidden',
          height: shouldShowBelowFold ? 'auto' : 0,
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {shouldShowBelowFold && <MarketPriceTicker direction="right" speed={12} />}
      </div>

      {/* Main Content */}
      <section 
        className="relative z-50 max-w-450 mx-auto px-4 md:px-8 pt-2 pb-4 md:py-12 bg-black" 
        style={{
          isolation: 'isolate',
          height: 'auto',
          overflow: 'visible',
          contain: 'layout style',
        }}
        data-allow-scroll
        data-content
      >
        {/* Featured Products - Timeline / Grid Toggle - DEFERRED below fold */}
        {shouldShowFeatured && !loading && focusCards.length > 0 && (
          <section 
            ref={(el) => { 
              if (typeof featured.ref === 'function') featured.ref(el); 
              if (featuredSectionRef) featuredSectionRef.current = el; 
            }} 
            className="-mx-4 md:-mx-8 mb-6 md:mb-8 bg-black rounded-2xl py-6"
            style={{
              contentVisibility: 'auto',
              containIntrinsicSize: 'auto 600px',
            } as React.CSSProperties}
          >
            {/* Toggle Header */}
            <div className="flex flex-col items-center px-4 md:px-8 mb-6">
              <h2 className="text-sm md:text-lg font-semibold text-white/80 tracking-wide uppercase mb-4">
                Featured Products
              </h2>
              <div className="flex items-center gap-4 md:gap-6 perspective-[800px]">
                <button
                  onClick={() => handleFeaturedViewChange('timeline')}
                  className={`group relative flex items-center gap-2 px-5 py-2.5 md:px-7 md:py-3 rounded-2xl text-xs md:text-sm font-bold tracking-wide uppercase transition-all duration-300 border-2 [transform-style:preserve-3d] ${
                    featuredViewMode === 'timeline'
                      ? 'bg-white text-black border-transparent shadow-[0_8px_30px_rgba(255,255,255,0.3),0_0_60px_rgba(255,0,0,0.15),0_0_60px_rgba(0,255,0,0.15),0_0_60px_rgba(0,100,255,0.15)] translate-y-0 [transform:rotateX(0deg)_translateZ(12px)] hover:[transform:rotateX(-5deg)_translateZ(20px)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.4),0_0_80px_rgba(255,0,0,0.2),0_0_80px_rgba(0,255,0,0.2),0_0_80px_rgba(0,100,255,0.2)]'
                      : 'bg-black text-white/70 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.5)] [transform:rotateX(8deg)_translateZ(-4px)] hover:text-white hover:border-white/30 hover:[transform:rotateX(0deg)_translateZ(8px)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.15),0_0_40px_rgba(255,0,0,0.1),0_0_40px_rgba(0,255,0,0.1),0_0_40px_rgba(0,100,255,0.1)]'
                  }`}
                >
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Timeline</span>
                  {featuredViewMode === 'timeline' && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2/3 h-[3px] rounded-full bg-gradient-to-r from-red-500 via-green-400 to-blue-500 animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => handleFeaturedViewChange('grid')}
                  className={`group relative flex items-center gap-2 px-5 py-2.5 md:px-7 md:py-3 rounded-2xl text-xs md:text-sm font-bold tracking-wide uppercase transition-all duration-300 border-2 [transform-style:preserve-3d] ${
                    featuredViewMode === 'grid'
                      ? 'bg-white text-black border-transparent shadow-[0_8px_30px_rgba(255,255,255,0.3),0_0_60px_rgba(255,0,0,0.15),0_0_60px_rgba(0,255,0,0.15),0_0_60px_rgba(0,100,255,0.15)] translate-y-0 [transform:rotateX(0deg)_translateZ(12px)] hover:[transform:rotateX(-5deg)_translateZ(20px)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.4),0_0_80px_rgba(255,0,0,0.2),0_0_80px_rgba(0,255,0,0.2),0_0_80px_rgba(0,100,255,0.2)]'
                      : 'bg-black text-white/70 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.5)] [transform:rotateX(8deg)_translateZ(-4px)] hover:text-white hover:border-white/30 hover:[transform:rotateX(0deg)_translateZ(8px)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.15),0_0_40px_rgba(255,0,0,0.1),0_0_40px_rgba(0,255,0,0.1),0_0_40px_rgba(0,100,255,0.1)]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Grid</span>
                  {featuredViewMode === 'grid' && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2/3 h-[3px] rounded-full bg-gradient-to-r from-red-500 via-green-400 to-blue-500 animate-pulse" />
                  )}
                </button>
              </div>
            </div>
            {/* Conditional View */}
            {featuredViewMode === 'timeline' ? (
              <div
                className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen transition-all duration-500 ease-in-out"
                style={{
                  opacity: timelineVisible ? 1 : 0,
                  transform: timelineVisible ? 'translateY(0)' : 'translateY(-20px)',
                  maxHeight: timelineVisible ? '9999px' : '0px',
                  overflow: 'hidden',
                }}
              >
                <FeaturedProductsTimeline products={focusCards} />
              </div>
            ) : (
              <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-6 md:py-10 bg-black">
                <GlassProductGrid
                  products={products}
                  rowHeight={300}
                  itemsPerRow={999}
                  gap={14}
                  scrollSpeed={30}
                  visibleCount={2}
                  glassProps={{
                    borderRadius: 18,
                    displace: 0.5,
                    distortionScale: -180,
                    brightness: 50,
                    opacity: 0.93,
                  }}
                />
              </div>
            )}
          </section>
        )}
        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-2 mb-3 md:gap-4 md:mb-8">
          {/* Search Row */}
          <div className="flex gap-2">
            {/* Search Input - Full width on mobile */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-white/5 border border-white/10 rounded-xl text-[12px]
                         text-white placeholder:text-white/40 focus:outline-none focus:border-white/20
                         focus:bg-white/[0.07] transition-all md:h-12 md:pl-12 md:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <SearchAutocomplete
                searchQuery={searchQuery}
                onSelect={(query) => { setSearchQuery(query); }}
                onProductSelect={(slug) => { router.push(`/store/product/${slug}`); }}
              />
            </div>

            {/* Filters Button - Mobile */}
            <button
              onClick={() => setShowFilters(true)}
              className="h-12 w-12 md:hidden flex items-center justify-center bg-white/5 border border-white/10
                       rounded-xl text-white active:bg-white/10 transition-colors relative"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
              )}
            </button>
          </div>

          {/* Desktop Controls Row */}
          <div className="hidden md:flex items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="h-12 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl
                         text-white appearance-none cursor-pointer focus:outline-none
                         focus:border-white/20 hover:bg-white/[0.07] transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-black">
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={filters.sort_by || 'newest'}
                onChange={(e) => handleFilterChange({ sort_by: e.target.value as ProductFilters['sort_by'] })}
                className="h-12 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl
                         text-white appearance-none cursor-pointer focus:outline-none
                         focus:border-white/20 hover:bg-white/[0.07] transition-all"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-black">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>

            {/* Filters Button - Desktop */}
            <button
              onClick={() => { sounds.filterApply(); setShowFilters(true); }}
              className="h-12 px-4 flex items-center gap-2 bg-white/5 border border-white/10
                       rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-white rounded-full" />
              )}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Grid Layout Dropdown - Desktop */}
            <div className="relative hidden md:block" ref={gridLayoutRef}>
              <button
                onClick={() => { sounds.buttonClick(); setGridLayoutOpen(!gridLayoutOpen); }}
                className={`h-11 px-5 flex items-center gap-2.5 rounded-full transition-all duration-200 ${
                  gridLayoutOpen
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'bg-white/[0.08] text-white/90 hover:bg-white/[0.14] border border-white/[0.08]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-[13px] font-semibold tracking-tight">Layout</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${gridLayoutOpen ? 'rotate-180' : ''}`} />
              </button>

              {gridLayoutOpen && (
                <div className="absolute right-0 top-full mt-3 z-[9999] w-[280px] bg-[#1c1c1e] border border-white/[0.08] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] p-5 space-y-5">
                  {/* View Mode */}
                  <div>
                    <span className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.08em]">View</span>
                    <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                      {[
                        { mode: 'carousel' as const, icon: Layers, label: 'Carousel' },
                        { mode: 'circular' as const, icon: Rows3, label: 'Circular' },
                        { mode: 'animated' as const, icon: Sparkles, label: 'Animated' },
                        { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
                      ].map(({ mode, icon: Icon, label }) => (
                        <button
                          key={mode}
                          onClick={() => { sounds.buttonClick(); setViewMode(mode); }}
                          className={`h-10 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-150 ${
                            viewMode === mode
                              ? 'bg-white text-black shadow-sm'
                              : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white/90'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  {/* Columns */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.08em]">Columns</span>
                      <span className="text-white/80 text-[13px] font-bold tabular-nums">{desktopColumns}</span>
                    </div>
                    <div className="mt-2.5">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={desktopColumns}
                        onChange={(e) => setDesktopColumns(Number(e.target.value))}
                        className="w-full h-1.5 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                          [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                      />
                    </div>
                  </div>

                  {/* Rows */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.08em]">Rows</span>
                      <span className="text-white/80 text-[13px] font-bold tabular-nums">
                        {isFinite(desktopRows) ? desktopRows : '∞'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={isFinite(desktopRows) ? desktopRows : 10}
                        onChange={(e) => setDesktopRows(Number(e.target.value))}
                        className="flex-1 h-1.5 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                          [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                      />
                      <button
                        onClick={() => setDesktopRows(isFinite(desktopRows) ? Infinity : 2)}
                        className={`shrink-0 h-8 w-8 rounded-lg text-[14px] font-bold transition-all duration-150 ${
                          !isFinite(desktopRows)
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white/90'
                        }`}
                        title="Show all rows"
                      >
                        ∞
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Sort Dropdown */}
          <div className="md:hidden relative">
            <select
              value={filters.sort_by || 'newest'}
              onChange={(e) => handleFilterChange({ sort_by: e.target.value as ProductFilters['sort_by'] })}
              className="w-full h-9 pl-3 pr-9 bg-white/5 border border-white/10 rounded-xl
                       text-white/80 text-[11px] appearance-none cursor-pointer focus:outline-none
                       focus:border-white/20 transition-all"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-black">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <MotionDiv 
            className="flex flex-wrap items-center gap-2 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {debouncedSearch && (
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2">
                &ldquo;{debouncedSearch}&rdquo;
                <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2">
                {CATEGORIES.find(c => c.value === filters.category)?.label}
                <button onClick={() => handleFilterChange({ category: '' })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.min_price || filters.max_price) && (
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2">
                ${filters.min_price || 0} - ${filters.max_price || '∞'}
                <button onClick={() => handleFilterChange({ min_price: undefined, max_price: undefined })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              Clear all
            </button>
          </MotionDiv>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-2 md:mb-6">
          <p className="text-white/40 text-sm min-w-0 flex-shrink">
            {loading ? 'Loading...' : `${total} ${total === 1 ? 'product' : 'products'}`}
          </p>
          {/* Mobile Grid Layout Dropdown */}
          <div className="relative md:hidden" ref={gridLayoutMobileRef}>
            <button
              onClick={() => setGridLayoutOpen(!gridLayoutOpen)}
              className={`h-9 px-3.5 flex items-center gap-2 rounded-full transition-all duration-200 ${
                gridLayoutOpen
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-white/[0.08] text-white/90 border border-white/[0.08]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[12px] font-semibold tracking-tight">Layout</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${gridLayoutOpen ? 'rotate-180' : ''}`} />
            </button>

            {gridLayoutOpen && (
              <div className="absolute right-0 top-full mt-2.5 z-[9999] w-[260px] bg-[#1c1c1e] border border-white/[0.08] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] p-4 space-y-4">
                {/* View Mode */}
                <div>
                  <span className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.08em]">View</span>
                  <div className="grid grid-cols-4 gap-1 mt-2">
                    {[
                      { mode: 'carousel' as const, icon: Layers, label: 'Carousel' },
                      { mode: 'circular' as const, icon: Rows3, label: 'Circular' },
                      { mode: 'animated' as const, icon: Sparkles, label: 'Animated' },
                      { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold transition-all duration-150 ${
                          viewMode === mode
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-white/[0.06] text-white/60 active:bg-white/[0.15]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Columns */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.08em]">Columns</span>
                    <span className="text-white/80 text-[12px] font-bold tabular-nums">{mobileColumns}</span>
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={mobileColumns}
                      onChange={(e) => setMobileColumns(Number(e.target.value))}
                      className="w-full h-1.5 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                    />
                  </div>
                </div>

                {/* Rows */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.08em]">Rows</span>
                    <span className="text-white/80 text-[12px] font-bold tabular-nums">
                      {isFinite(mobileRows) ? mobileRows : '∞'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={isFinite(mobileRows) ? mobileRows : 10}
                      onChange={(e) => setMobileRows(Number(e.target.value))}
                      className="flex-1 h-1.5 appearance-none bg-white/[0.08] rounded-full outline-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
                    />
                    <button
                      onClick={() => setMobileRows(isFinite(mobileRows) ? Infinity : 2)}
                      className={`shrink-0 h-8 w-8 rounded-lg text-[14px] font-bold transition-all duration-150 ${
                        !isFinite(mobileRows)
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-white/[0.06] text-white/50 active:bg-white/[0.15]'
                      }`}
                      title="Show all rows"
                    >
                      ∞
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid / Circular Gallery */}
        <div
          ref={productsSection.ref}
          data-products-grid
          data-allow-scroll
          data-content
          style={{
            contain: 'layout style',
            contentVisibility: 'auto',
            containIntrinsicSize: 'auto 800px',
          } as React.CSSProperties}
        >
        {loading ? (
          viewMode === 'carousel' ? (
            <div className="flex gap-4 md:gap-6 overflow-hidden py-6 md:py-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[280px] md:w-96 h-[400px] md:h-[500px] shrink-0 bg-white/5 animate-pulse rounded-3xl"
                />
              ))}
            </div>
          ) : viewMode === 'circular' ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-75 md:h-100 bg-white/5 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : viewMode === 'animated' ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-70 md:h-90 bg-white/5 animate-pulse rounded-2xl"
              />
            ))}
          </div>
          ) : (
          <div className={`grid ${getGridClasses(mobileColumns, desktopColumns)} gap-3 gap-y-6 sm:gap-4 sm:gap-y-8 md:gap-5 md:gap-y-10 lg:gap-y-12 pb-8`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/5 animate-pulse aspect-3/4 rounded-lg sm:rounded-xl md:rounded-2xl"
              />
            ))}
          </div>
          )
        ) : products.length === 0 ? (
          <MotionDiv 
            className="text-center py-16 md:py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/60 text-lg mb-2">No products found</p>
            <p className="text-white/40 text-sm mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-white text-black rounded-xl hover:bg-white/90 active:scale-95 transition-all"
            >
              Clear filters
            </button>
          </MotionDiv>
        ) : viewMode === 'carousel' ? (
          /* Carousel View - Apple Cards Style */
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="-mx-4 md:-mx-8"
          >
            <ProductsCarousel
              products={products}
              title="All Products"
              subtitle={`${total} ${total === 1 ? 'product' : 'products'} available`}
              infinite={true}
              onLoadMore={hasMore ? () => fetchProducts(page + 1, true) : undefined}
              hasMore={hasMore}
              loading={loadingMore}
              mobileColumns={mobileColumns}
              desktopColumns={desktopColumns}
              mobileRows={mobileRows}
              desktopRows={desktopRows}
            />
          </MotionDiv>
        ) : viewMode === 'circular' ? (
          /* Circular Gallery View - Multiple Rows */
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-8"
          >
            <CircularProductGrid
              products={gridViewProducts}
              rowHeight={isMobile ? 300 : 450}
              itemsPerRow={isMobile ? mobileColumns : desktopColumns}
              bend={1}
              borderRadius={0.05}
              scrollSpeed={2}
              scrollEase={0.05}
              textColor="#ffffff"
              gap={isMobile ? 12 : 20}
            />
          </MotionDiv>
        ) : viewMode === 'animated' ? (
          /* Animated View - Configurable Rows & Columns */
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-8"
          >
            <AnimatedProductGrid
              products={gridViewProducts}
              rowHeight={isMobile ? 280 : 360}
              columns={isMobile ? mobileColumns : desktopColumns}
              rows={isMobile ? mobileRows : desktopRows}
              gap={isMobile ? 12 : 18}
              scrollSpeed={isMobile ? 18 : 26}
            />
          </MotionDiv>
        ) : (
          /* Standard Grid View */
          <MotionDiv 
            className="pb-8 relative"
            style={{ isolation: 'isolate', zIndex: 10, height: 'auto', overflow: 'visible', minHeight: 'auto', contain: 'layout style' }}
          >
            <HoverEffect
              items={products as ProductWithDetails[]}
              layout="custom"
              className={`grid ${getGridClasses(mobileColumns, desktopColumns)} gap-3 gap-y-6 sm:gap-4 sm:gap-y-8 md:gap-5 md:gap-y-10 lg:gap-y-12`}
              getKey={gridGetKey}
              getLink={gridGetLink}
              renderItem={gridRenderItem}
            />
          </MotionDiv>
        )}
        </div>

        {/* Load More Trigger */}
        {hasMore && !loading && (
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            {loadingMore && (
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )}
          </div>
        )}
      </section>

      {/* Fluid Glass 3D Experience Section - stays mounted, CSS hidden off-screen */}
      <div
        ref={fluidGlass.ref}
        className="hidden md:block"
        style={{
          minHeight: 400,
          contain: 'layout style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 100vh',
        } as React.CSSProperties}
        data-allow-scroll
        data-content
      >
        {shouldShowFluidGlass && canRenderHeavyDesktop && (
          <StoreFluidGlassSection 
            height="100vh"
            className="mt-8"
          />
        )}
      </div>

      {/* Market Price Ticker - Before Footer */}
      <div
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 48px',
          visibility: shouldShowFooter ? 'visible' : 'hidden',
          height: shouldShowFooter ? 'auto' : 0,
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {shouldShowFooter && <MarketPriceTicker direction="right" speed={10} />}
      </div>

      {/* Store Footer - stays mounted once loaded */}
      <div
        ref={footer.ref}
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 200px',
        } as React.CSSProperties}
        data-allow-scroll
        data-content
      >
        {shouldShowFooter && <StoreFooter />}
      </div>

      {/* Filter Sheet - Load when interactive */}
      {showInteractive && (
        <FilterSheet
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />
      )}

      {/* Cookie Consent Banner - Load immediately */}
      <CookieConsent />
    </div>
  );
}
