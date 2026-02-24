'use client';

/**
 * useStoreProducts.ts
 *
 * All product-list state: fetching, pagination, filters, search debounce,
 * URL sync, and display-mode detection (global / vip / timer).
 */

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ProductWithDetails, PaginatedResponse, ProductFilters } from '@/types/store';
import type { StoreDisplayMode } from '../_types/store-page.types';
import { buildUrlParams } from '../store.utils';

const PAGE_SIZE = 12;

interface UseStoreProductsOptions {
  routeBase: string;
  syncUrl: boolean;
  showProducts: boolean;
}

export function useStoreProducts({
  routeBase,
  syncUrl,
  showProducts,
}: UseStoreProductsOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Filter state ────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price')
      ? Number(searchParams.get('min_price'))
      : undefined,
    max_price: searchParams.get('max_price')
      ? Number(searchParams.get('max_price'))
      : undefined,
    sort_by: (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest',
  });

  // ── Search state (with debounce) ────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Product list state ──────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Display mode (global / vip / timer) ────────────────────────────────
  const [storeDisplayMode, setStoreDisplayMode] = useState<StoreDisplayMode>('global');
  const [timerEnd, setTimerEnd] = useState<string | null>(null);
  const [timerHeadline, setTimerHeadline] = useState('Something big is coming');
  const [timerSubtext, setTimerSubtext] = useState('New products dropping soon. Stay tuned.');

  // ── Sync URL params → local state (back/forward navigation) ────────────
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlMinPrice = searchParams.get('min_price')
      ? Number(searchParams.get('min_price'))
      : undefined;
    const urlMaxPrice = searchParams.get('max_price')
      ? Number(searchParams.get('max_price'))
      : undefined;
    const urlSortBy =
      (searchParams.get('sort_by') as ProductFilters['sort_by']) || 'newest';
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

    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounce search input ───────────────────────────────────────────────
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // ── Core fetch ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (pageNum: number, append: boolean, signal?: AbortSignal) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set('page', pageNum.toString());
        params.set('limit', PAGE_SIZE.toString());
        if (filters.category) params.set('category', filters.category);
        if (filters.min_price) params.set('min_price', filters.min_price.toString());
        if (filters.max_price) params.set('max_price', filters.max_price.toString());
        if (filters.sort_by) params.set('sort_by', filters.sort_by);
        if (debouncedSearch) params.set('search', debouncedSearch);

        const response = await fetch(`/api/store/products?${params.toString()}`, {
          signal,
        });
        const data: PaginatedResponse<ProductWithDetails> & {
          display_mode?: string;
          timer_end?: string;
          timer_headline?: string;
          timer_subtext?: string;
        } = await response.json();

        // Timer mode — display countdown, hide product grid
        if (data.display_mode === 'timer') {
          setStoreDisplayMode('timer');
          setTimerEnd(data.timer_end || null);
          setTimerHeadline(data.timer_headline || 'Something big is coming');
          setTimerSubtext(
            data.timer_subtext || 'New products dropping soon. Stay tuned.'
          );
          setProducts([]);
          setTotal(0);
          setHasMore(false);
          return;
        }

        setStoreDisplayMode(
          (data.display_mode as StoreDisplayMode | undefined) || 'global'
        );

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
    },
    [filters, debouncedSearch]
  );

  // ── Fetch on filter / search change ──────────────────────────────────────
  useEffect(() => {
    if (!showProducts) return;
    const controller = new AbortController();
    fetchProducts(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchProducts, showProducts]);

  // ── Push filter changes to URL ────────────────────────────────────────────
  useEffect(() => {
    if (!syncUrl) return;
    const params = buildUrlParams(filters, debouncedSearch);
    const query = params.toString();
    const newUrl = query ? `${routeBase}?${query}` : routeBase;
    router.replace(newUrl, { scroll: false });
  }, [filters, debouncedSearch, routeBase, router, syncUrl]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    });
  }, []);

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

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    page,
    total,
    filters,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    storeDisplayMode,
    timerEnd,
    timerHeadline,
    timerSubtext,
    fetchProducts,
    handleFilterChange,
    clearFilters,
    updateFilters,
  };
}
