'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutGrid, Sparkles, TrendingUp } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { FilterSheet } from '@/components/shop/FilterSheet';
import { StoreHero3D } from '@/components/shop/StoreHero3D';
import { MobileProductsDome } from '@/components/shop/MobileProductsDome';
import type { ProductWithDetails, PaginatedResponse, ProductFilters } from '@/types/store';

// ============================================================================
// STORE HOME - PRODUCT LISTING PAGE (PLP)
// Luxury Trading Aesthetic with Mobile-First Design
// ============================================================================

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
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
  
  // State
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [gridSize, setGridSize] = useState<'small' | 'large'>('large');
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Detect mobile and default to compact grid
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setGridSize('small');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


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
      {/* Hero Section - Mobile uses DomeGallery, Desktop uses 3D Spline */}
      {isMobile ? <MobileProductsDome /> : <StoreHero3D />}

      {/* Main Content */}
      <section className="relative z-[50] max-w-[1800px] mx-auto px-3 md:px-8 pt-2 pb-4 md:py-12" style={{ isolation: 'isolate', height: 'auto', overflow: 'visible' }}>
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

            {/* Grid Toggle */}
            <div className="flex h-12 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setGridSize('large')}
                className={`px-3 transition-colors ${gridSize === 'large' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridSize('small')}
                className={`px-3 transition-colors ${gridSize === 'small' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
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
          <motion.div 
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
          </motion.div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-2 md:mb-6">
          <p className="text-white/40 text-sm">
            {loading ? 'Loading...' : `${total} ${total === 1 ? 'product' : 'products'}`}
          </p>
          {/* Mobile Grid Toggle */}
          <div className="flex md:hidden h-10 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setGridSize('large')}
              className={`px-2.5 transition-colors ${gridSize === 'large' ? 'bg-white/10' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridSize('small')}
              className={`px-2.5 transition-colors ${gridSize === 'small' ? 'bg-white/10' : ''}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Grid - Shopify-Like Responsive Layout */}
        <div data-products-grid>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 pb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`bg-white/5 animate-pulse ${
                  gridSize === 'small'
                    ? 'aspect-[2/3] rounded-lg'
                    : 'aspect-3/4 rounded-lg sm:rounded-xl md:rounded-2xl'
                }`}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div 
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
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 pb-8 relative"
            style={{ isolation: 'isolate', zIndex: 10, height: 'auto', overflow: 'visible', minHeight: 'auto' }}
            layout
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  layout
                  className="h-full w-full mb-6 relative"
                  style={{ overflow: 'visible', zIndex: 1 }}
                >
                  <ProductCard product={product} compact={gridSize === 'small'} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
      />
    </div>
  );
}
