'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
import { Search, SlidersHorizontal, X, ChevronDown, Grid3X3, Sparkles, TrendingUp, LayoutGrid, Rows3 } from 'lucide-react';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import type { ProductWithDetails, PaginatedResponse, ProductFilters } from '@/types/store';
import { useStoreSection } from './StoreMemoryContext';

// ============================================================================
// PERFORMANCE OPTIMIZED: Dynamic imports for heavy components
// Reduces initial bundle size and speeds up first load
// ============================================================================

// Framer Motion - only load when animation is needed
const MotionDiv = dynamic(() => import('framer-motion').then(mod => {
  const { motion } = mod;
  return { default: motion.div };
}), { ssr: false });

const AnimatePresence = dynamic(() => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })), { ssr: false });

// Heavy 3D component - deferred load
const StoreHero3D = dynamic(() => import('@/components/shop/StoreHero3D').then(mod => ({ default: mod.StoreHero3D })), {
  ssr: false,
  loading: () => <div className="w-full h-100 bg-linear-to-b from-black via-zinc-900/50 to-black animate-pulse" />
});

// Product grids - load on demand
const CircularProductGrid = dynamic(() => import('@/components/shop/CircularProductGrid').then(mod => ({ default: mod.CircularProductGrid })), { ssr: false });
const GlassProductGrid = dynamic(() => import('@/components/shop/GlassProductGrid').then(mod => ({ default: mod.GlassProductGrid })), { ssr: false });

// UI components - defer loading
const ProductCard = dynamic(() => import('@/components/shop/ProductCard').then(mod => ({ default: mod.ProductCard })), { ssr: true });
const HoverEffect = dynamic(() => import('@/components/ui/card-hover-effect').then(mod => ({ default: mod.HoverEffect })), { ssr: false });
const FilterSheet = dynamic(() => import('@/components/shop/FilterSheet').then(mod => ({ default: mod.FilterSheet })), { ssr: false });
const FocusCards = dynamic(() => import('@/components/ui/focus-cards').then(mod => ({ default: mod.FocusCards })), { ssr: false });
const StoreFluidGlassSection = dynamic(() => import('@/components/shop/StoreFluidGlassSection').then(mod => ({ default: mod.StoreFluidGlassSection })), { ssr: false });
const StoreFooter = dynamic(() => import('@/components/shop/StoreFooter').then(mod => ({ default: mod.StoreFooter })), { ssr: false });
const SearchAutocomplete = dynamic(() => import('@/components/shop/SearchAutocomplete').then(mod => ({ default: mod.SearchAutocomplete })), { ssr: false });

// Modals and overlays - lazy load
const RewardsCardBanner = dynamic(() => import('@/components/RewardsCardBanner'), { ssr: false });
const RewardsCard = dynamic(() => import('@/components/RewardsCard'), { ssr: false });

// ============================================================================
// STORE HOME - PRODUCT LISTING PAGE (PLP)
// Luxury Trading Aesthetic with Mobile-First Design
// ============================================================================

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'best_selling', label: 'Best Selling' },
];

const CATEGORIES = [
  { value: '', label: 'All Products', icon: Sparkles },
  { value: 'apparel', label: 'Apparel', icon: null },
  { value: 'accessories', label: 'Accessories', icon: null },
  { value: 'tech-gear', label: 'Tech & Gear', icon: null },
  { value: 'home-office', label: 'Home Office', icon: null },
  { value: 'drinkware', label: 'Drinkware', icon: null },
  { value: 'limited-edition', label: 'Limited Edition', icon: TrendingUp },
];

export default function StorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  const [viewMode, setViewMode] = useState<'circular' | 'grid' | 'glass'>('circular'); // Default to circular gallery
  const [focusMobileColumns, setFocusMobileColumns] = useState<1 | 2 | 3>(2);
  const [focusDesktopColumns, setFocusDesktopColumns] = useState<1 | 2 | 3>(2);
  const [focusMobileRows, setFocusMobileRows] = useState<1 | 2 | 3>(3);
  const [focusDesktopRows, setFocusDesktopRows] = useState<1 | 2 | 3>(1);
  const [vipProducts, setVipProducts] = useState<{ id: string; name: string; price: number; image_url?: string; imageUrl?: string; visible?: boolean }[]>([]);
  
  // Column options
  const MOBILE_COLUMN_OPTIONS = [1, 2, 3, 4];
  const DESKTOP_COLUMN_OPTIONS = [4, 5, 6, 7, 8, 9];
  const GRID_ROW_OPTIONS = [1, 2, 3] as const;
  const FOCUS_LAYOUT_OPTIONS = [1, 2, 3] as const;
  
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

  // Detect mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Dynamic grid classes based on column selection
  const getGridClasses = () => {
    const desktopColClass = {
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
      7: 'md:grid-cols-7',
      8: 'md:grid-cols-8',
      9: 'md:grid-cols-9',
    }[desktopColumns] || 'md:grid-cols-5';
    
    const mobileColClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    }[mobileColumns] || 'grid-cols-2';
    
    return `${mobileColClass} ${desktopColClass}`;
  };

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

  const focusMaxItems = useMemo(() => {
    if (isMobile) {
      // Show all VIP products on mobile, capped at 9
      return Math.min(focusCards.length, 9);
    }
    const columns = focusDesktopColumns;
    const rows = focusDesktopRows;
    return Math.max(1, columns * rows);
  }, [isMobile, focusCards.length, focusDesktopColumns, focusDesktopRows]);

  const gridViewProducts = useMemo(() => {
    const columns = isMobile ? mobileColumns : desktopColumns;
    const rows = isMobile ? mobileRows : desktopRows;
    const maxItems = Math.max(1, columns * rows);
    return products.slice(0, maxItems);
  }, [products, isMobile, mobileColumns, desktopColumns, mobileRows, desktopRows]);


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

  // Fetch VIP products for featured section
  useEffect(() => {
    const fetchVip = async () => {
      try {
        const res = await fetch('/api/store/vip');
        if (!res.ok) throw new Error('Failed to load VIP');
        const json = await res.json();
        const items = (json.data || []).filter((item: any) => item.visible !== false);
        setVipProducts(items);
      } catch (err) {
        console.error('Failed to fetch VIP products:', err);
      }
    };
    fetchVip();
  }, []);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.min_price) params.set('min_price', filters.min_price.toString());
    if (filters.max_price) params.set('max_price', filters.max_price.toString());
    if (filters.sort_by && filters.sort_by !== 'newest') params.set('sort_by', filters.sort_by);
    if (debouncedSearch) params.set('search', debouncedSearch);

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

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      min_price: undefined,
      max_price: undefined,
      sort_by: 'newest',
    });
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const hasActiveFilters = filters.category || filters.min_price || filters.max_price || debouncedSearch;

  return (
    <div className="bg-black" style={{ height: 'auto', minHeight: '100vh', overflow: 'visible' }}>
      {/* Rewards Card Banner */}
      <RewardsCardBanner 
        userEmail={recruit?.email || null}
        onOpenRewardsCard={() => setRewardsCardOpen(true)}
      />
      
      {/* Rewards Card Modal */}
      <RewardsCard
        isOpen={rewardsCardOpen}
        onClose={() => setRewardsCardOpen(false)}
        userEmail={recruit?.email || null}
      />
      
      {/* Hero Section - 3D Spline Hero (only rendered when in/near viewport) */}
      <div ref={hero.ref} style={{ minHeight: hero.shouldRender ? undefined : 400 }}>
        {hero.shouldRender && <StoreHero3D paused={!hero.shouldAnimate} />}
      </div>

      {/* Main Content */}
      <section 
        className="relative z-50 max-w-450 mx-auto px-3 md:px-8 pt-2 pb-4 md:py-12" 
        style={{ isolation: 'isolate', height: 'auto', overflow: 'visible' }}
      >
        {!loading && focusCards.length > 0 && (
          <section ref={featured.ref} className="-mx-3 md:mx-0 mb-6 md:mb-8">
            <div className="px-3 sm:px-8 lg:px-10">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-5">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-[0.2em]">Focus</p>
                    <h2 className="text-white text-2xl md:text-3xl font-semibold">Featured Products</h2>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-white/70 justify-center w-full">
                    <div className="flex items-center gap-2 h-12 px-3 bg-white/5 border border-white/10 rounded-xl">
                      <Grid3X3 className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">Columns</span>
                      <div className="flex gap-1">
                        {FOCUS_LAYOUT_OPTIONS.map((value) => (
                          <button
                            key={`d-col-${value}`}
                            onClick={() => setFocusDesktopColumns(value)}
                            className={`w-7 h-7 rounded-lg text-sm font-medium transition-all ${
                              focusDesktopColumns === value
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                            aria-pressed={focusDesktopColumns === value}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 h-12 px-3 bg-white/5 border border-white/10 rounded-xl">
                      <Rows3 className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">Rows</span>
                      <div className="flex gap-1">
                        {FOCUS_LAYOUT_OPTIONS.map((value) => (
                          <button
                            key={`d-row-${value}`}
                            onClick={() => setFocusDesktopRows(value)}
                            className={`w-7 h-7 rounded-lg text-sm font-medium transition-all ${
                              focusDesktopRows === value
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                            aria-pressed={focusDesktopRows === value}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex md:hidden items-center gap-2 text-white/70 justify-center">
                  <div className="flex items-center gap-1.5 h-9 px-2 bg-white/5 border border-white/10 rounded-lg">
                    <Grid3X3 className="w-3.5 h-3.5 text-white/50" />
                    <div className="flex gap-1">
                      {FOCUS_LAYOUT_OPTIONS.map((value) => (
                        <button
                          key={`m-col-${value}`}
                          onClick={() => setFocusMobileColumns(value)}
                          className={`w-6 h-6 rounded text-xs font-medium transition-all ${
                            focusMobileColumns === value
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/70 active:bg-white/20'
                          }`}
                          aria-pressed={focusMobileColumns === value}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 h-9 px-2 bg-white/5 border border-white/10 rounded-lg">
                    <Rows3 className="w-3.5 h-3.5 text-white/50" />
                    <div className="flex gap-1">
                      {FOCUS_LAYOUT_OPTIONS.map((value) => (
                        <button
                          key={`m-row-${value}`}
                          onClick={() => setFocusMobileRows(value)}
                          className={`w-6 h-6 rounded text-xs font-medium transition-all ${
                            focusMobileRows === value
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/70 active:bg-white/20'
                          }`}
                          aria-pressed={focusMobileRows === value}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:h-auto md:max-w-5xl md:mx-auto">
              <FocusCards
                cards={focusCards}
                mobileColumns={focusMobileColumns}
                desktopColumns={focusDesktopColumns}
                maxItems={focusMaxItems}
              />
            </div>
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
              onClick={() => setShowFilters(true)}
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

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 h-12 px-3 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setViewMode('circular')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'circular' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title="Circular Gallery View"
              >
                <Rows3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('glass')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'glass' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title="Glass Surface View"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Column + Row Picker */}
            <div className="flex items-center gap-2 h-12 px-3 bg-white/5 border border-white/10 rounded-xl">
              <Grid3X3 className="w-4 h-4 text-white/60" />
              <span className="text-white/60 text-sm">Columns:</span>
              <div className="flex gap-1">
                {DESKTOP_COLUMN_OPTIONS.map((cols) => (
                  <button
                    key={cols}
                    onClick={() => setDesktopColumns(cols)}
                    className={`w-7 h-7 rounded-lg text-sm font-medium transition-all ${
                      desktopColumns === cols 
                        ? 'bg-white text-black' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 h-12 px-3 bg-white/5 border border-white/10 rounded-xl">
              <Rows3 className="w-4 h-4 text-white/60" />
              <span className="text-white/60 text-sm">Rows:</span>
              <div className="flex gap-1">
                {GRID_ROW_OPTIONS.map((rows) => (
                  <button
                    key={rows}
                    onClick={() => setDesktopRows(rows)}
                    className={`w-7 h-7 rounded-lg text-sm font-medium transition-all ${
                      desktopRows === rows
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {rows}
                  </button>
                ))}
              </div>
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
          <p className="text-white/40 text-sm">
            {loading ? 'Loading...' : `${total} ${total === 1 ? 'product' : 'products'}`}
          </p>
          {/* Mobile View & Column Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* View Mode Toggle Mobile */}
            <div className="flex items-center gap-1 h-9 px-1.5 bg-white/5 border border-white/10 rounded-lg">
              <button
                onClick={() => setViewMode('circular')}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  viewMode === 'circular' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70'
                }`}
              >
                <Rows3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('glass')}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  viewMode === 'glass' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70'
                }`}
              >
                <Sparkles className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
            </div>
            {/* Mobile Column + Row Picker */}
            <div className="flex items-center gap-1.5 h-9 px-2 bg-white/5 border border-white/10 rounded-lg">
              <Grid3X3 className="w-3.5 h-3.5 text-white/50" />
              <div className="flex gap-1">
                {MOBILE_COLUMN_OPTIONS.map((cols) => (
                  <button
                    key={cols}
                    onClick={() => setMobileColumns(cols)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-all ${
                      mobileColumns === cols 
                        ? 'bg-white text-black' 
                        : 'bg-white/10 text-white/70 active:bg-white/20'
                    }`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 h-9 px-2 bg-white/5 border border-white/10 rounded-lg">
              <Rows3 className="w-3.5 h-3.5 text-white/50" />
              <div className="flex gap-1">
                {GRID_ROW_OPTIONS.map((rows) => (
                  <button
                    key={rows}
                    onClick={() => setMobileRows(rows)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-all ${
                      mobileRows === rows
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/70 active:bg-white/20'
                    }`}
                  >
                    {rows}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid / Circular Gallery */}
        <div ref={productsSection.ref} data-products-grid>
        {loading ? (
          viewMode === 'circular' ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-75 md:h-100 bg-white/5 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : viewMode === 'glass' ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-70 md:h-90 bg-white/5 animate-pulse rounded-2xl"
              />
            ))}
          </div>
          ) : (
          <div className={`grid ${getGridClasses()} gap-3 gap-y-6 sm:gap-4 sm:gap-y-8 md:gap-5 md:gap-y-10 lg:gap-y-12 pb-8`}>
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
        ) : viewMode === 'glass' ? (
          /* Glass Surface View - Infinite Rows */
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-8"
          >
            <GlassProductGrid
              products={gridViewProducts}
              rowHeight={isMobile ? 280 : 360}
              itemsPerRow={isMobile ? mobileColumns : desktopColumns}
              gap={isMobile ? 12 : 18}
              scrollSpeed={isMobile ? 18 : 26}
            />
          </MotionDiv>
        ) : (
          /* Standard Grid View */
          <MotionDiv 
            className="pb-8 relative"
            style={{ isolation: 'isolate', zIndex: 10, height: 'auto', overflow: 'visible', minHeight: 'auto' }}
          >
            <HoverEffect
              items={products as ProductWithDetails[]}
              layout="custom"
              className={`grid ${getGridClasses()} gap-3 gap-y-6 sm:gap-4 sm:gap-y-8 md:gap-5 md:gap-y-10 lg:gap-y-12`}
              getKey={(product) => (product as ProductWithDetails).id}
              getLink={() => undefined}
              renderItem={(product, index) => (
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  className="h-full w-full mb-6 relative"
                  style={{ overflow: 'visible', zIndex: 1 }}
                >
                  <ProductCard product={product as ProductWithDetails} compact={mobileColumns >= 3 || desktopColumns >= 7} />
                </MotionDiv>
              )}
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

      {/* Fluid Glass 3D Experience Section (only rendered when in/near viewport) - hidden on mobile, shown on desktop */}
      <div ref={fluidGlass.ref} className="hidden md:block" style={{ minHeight: fluidGlass.shouldRender ? undefined : 400 }}>
        {fluidGlass.shouldRender && (
          <StoreFluidGlassSection 
            height="100vh"
            className="mt-8"
          />
        )}
      </div>

      {/* Store Footer (tracked for memory awareness) */}
      <div ref={footer.ref}>
        <StoreFooter />
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}
