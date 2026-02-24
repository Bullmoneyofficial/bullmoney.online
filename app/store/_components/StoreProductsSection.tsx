'use client';

/**
 * StoreProductsSection.tsx
 *
 * Products / Featured / Timeline section block.
 * Renders: filter bar → products grid → featured grid → timeline grid.
 * Works in both standard-card mode and grid-layout (variant) mode.
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { Typewriter, FallingWords, SlideInLabel } from '@/components/shop/StoreTextEffects';
import {
  SearchAutocomplete,
  ProductCard,
} from '../_lazy/store-dynamics';
import { StoreGridRenderer } from './StoreGridRenderer';
import { CATEGORIES, SORT_OPTIONS } from '../store.config';
import { GRID_VARIANT_GROUP_ORDER, GRID_VARIANT_GROUPS } from '../_constants/grid.constants';
import type { GridVariant } from '../_constants/grid.constants';
import type { ProductFilters } from '@/types/store';
import type { ProductWithDetails } from '@/types/store';

interface StoreProductsSectionProps {
  /** Search & filter */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: ProductFilters;
  handleFilterChange: (partial: Partial<ProductFilters>) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;

  /** Products data */
  products: ProductWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  page: number;
  total: number;
  fetchProducts: (page: number, append: boolean) => void;
  featuredProducts: ProductWithDetails[];
  timelineProducts: ProductWithDetails[];

  /** Layout toggles */
  useGridLayouts: boolean;
  setUseGridLayouts: (fn: (prev: boolean) => boolean) => void;
  productsGridVariant: GridVariant;
  setProductsGridVariant: (v: GridVariant) => void;
  featuredGridVariant: GridVariant;
  setFeaturedGridVariant: (v: GridVariant) => void;
  timelineGridVariant: GridVariant;
  setTimelineGridVariant: (v: GridVariant) => void;

  /** Section refs & animation */
  productsRef: React.RefObject<HTMLElement | null>;
  featuredRef: React.RefObject<HTMLElement | null>;
  shouldAnimateProducts: boolean;
  shouldAnimateFeatured: boolean;
  heroMode: string;

  /** Actions */
  onViewProduct: (p: ProductWithDetails) => void;
  onAddClick: (p: ProductWithDetails) => void;
  canAddToCart: (p: ProductWithDetails) => boolean;
  formatPrice: (v: number) => string;
  paddingBoost: number;

  /** Responsive */
  isMobile: boolean;
  isUltraWide: boolean;
}

export function StoreProductsSection({
  searchQuery,
  setSearchQuery,
  filters,
  handleFilterChange,
  hasActiveFilters,
  clearFilters,
  products,
  loading,
  loadingMore,
  hasMore,
  page,
  total,
  fetchProducts,
  featuredProducts,
  timelineProducts,
  useGridLayouts,
  setUseGridLayouts,
  productsGridVariant,
  setProductsGridVariant,
  featuredGridVariant,
  setFeaturedGridVariant,
  timelineGridVariant,
  setTimelineGridVariant,
  productsRef,
  featuredRef,
  shouldAnimateProducts,
  shouldAnimateFeatured,
  heroMode,
  onViewProduct,
  onAddClick,
  canAddToCart,
  formatPrice,
  paddingBoost,
  isMobile,
  isUltraWide,
}: StoreProductsSectionProps) {
  const allowAnimation = heroMode === 'store';

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────── */}
      <section data-apple-section style={{ backgroundColor: 'rgb(255,255,255)' }}>
        <div
          className="mx-auto w-full max-w-7xl px-5 sm:px-8"
          style={{ paddingTop: 28 + paddingBoost, paddingBottom: 28 + paddingBoost }}
        >
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'rgba(0,0,0,0.35)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products"
                className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-10 text-sm outline-none"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
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
                onSelect={(q) => setSearchQuery(q)}
              />
            </div>

            {/* Filter selects */}
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
                onChange={(e) =>
                  handleFilterChange({ sort_by: e.target.value as ProductFilters['sort_by'] })
                }
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

      {/* ── Products grid ───────────────────────────────────────── */}
      <section
        ref={productsRef as React.RefObject<HTMLElement>}
        data-apple-section
        data-products-grid
        style={{ backgroundColor: 'rgb(255,255,255)', borderTop: '1px solid rgba(0,0,0,0.04)' }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8" style={{ paddingTop: 24, paddingBottom: 56 }}>
          <div className="mb-4">
            <SlideInLabel
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: 'rgba(0,0,0,0.45)' }}
            >
              Our Collection
            </SlideInLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              <Typewriter text="Browse the shop" />
            </h2>
            <p className="mt-1 text-sm max-w-lg" style={{ color: 'rgba(0,0,0,0.5)' }}>
              <FallingWords
                text="Premium streetwear, trading essentials, and digital art — all in one place."
                delay={0.2}
              />
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
              {loading ? (
                <FallingWords text="Loading products..." delay={0} />
              ) : (
                <FallingWords
                  text={`${total} ${total === 1 ? 'product' : 'products'}`}
                  delay={0}
                />
              )}
            </p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-black/5 bg-white p-10 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
              <p className="mt-4 text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
                <FallingWords text="Fetching the latest collection..." delay={0.1} />
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-black/5 bg-white p-12 text-center">
              <p className="text-base font-medium">
                <Typewriter text="No products found" />
              </p>
              <p className="mt-2 text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
                <FallingWords text="Adjust your filters or search again." delay={0.15} />
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
              <StoreGridRenderer
                variant={productsGridVariant}
                section="products"
                items={products}
                allowAnimation={shouldAnimateProducts && allowAnimation}
                isMobile={isMobile}
                isUltraWide={isUltraWide}
                onLoadMore={() => fetchProducts(page + 1, true)}
                hasMore={hasMore}
                loadingMore={loadingMore}
                page={page}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="h-full pb-14 sm:pb-16">
                  <ProductCard product={product} />
                  <div className="mt-4 flex items-center justify-end gap-2 relative z-10 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => onViewProduct(product)}
                      className="inline-flex rounded-full border border-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-medium min-h-[34px]"
                      style={{ color: 'rgba(0,0,0,0.7)' }}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddClick(product)}
                      disabled={!canAddToCart(product)}
                      className="inline-flex rounded-full px-4 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-semibold min-h-[40px] whitespace-nowrap"
                      style={
                        canAddToCart(product)
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

      {/* ── Featured grid ───────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section
          ref={featuredRef as React.RefObject<HTMLElement>}
          data-apple-section
          style={{ backgroundColor: 'rgb(255,255,255)' }}
        >
          <div
            className="mx-auto w-full max-w-7xl px-5 sm:px-8"
            style={{ paddingBottom: 64 + paddingBoost }}
          >
            <div className="border-t border-black/5 pt-10">
              {useGridLayouts && featuredGridVariant === 'carousel' ? (
                <div className="flex items-center justify-end">
                  <VariantSelect
                    value={featuredGridVariant}
                    onChange={setFeaturedGridVariant}
                    label="Featured grid layout"
                  />
                </div>
              ) : (
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <SlideInLabel
                      className="text-[11px] uppercase tracking-[0.28em]"
                      style={{ color: 'rgba(0,0,0,0.45)' }}
                    >
                      Featured
                    </SlideInLabel>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                      <Typewriter text="Best sellers this week" />
                    </h2>
                  </div>
                  {useGridLayouts && (
                    <VariantSelect
                      value={featuredGridVariant}
                      onChange={setFeaturedGridVariant}
                      label="Featured grid layout"
                    />
                  )}
                </div>
              )}

              {useGridLayouts ? (
                <div className="mt-6 mobile-mosaic-featured">
                  <StoreGridRenderer
                    variant={featuredGridVariant}
                    section="featured"
                    items={featuredProducts}
                    allowAnimation={shouldAnimateFeatured && allowAnimation}
                    isMobile={isMobile}
                    isUltraWide={isUltraWide}
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredProducts.map((product) => (
                    <div key={`featured-${product.id}`} className="h-full pb-14 sm:pb-16">
                      <ProductCard product={product} />
                      <div className="mt-4 flex items-center justify-end gap-2 relative z-10 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => onViewProduct(product)}
                          className="inline-flex rounded-full border border-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-medium min-h-[34px]"
                          style={{ color: 'rgba(0,0,0,0.7)' }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddClick(product)}
                          disabled={!canAddToCart(product)}
                          className="inline-flex rounded-full px-4 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-semibold min-h-[40px] whitespace-nowrap"
                          style={
                            canAddToCart(product)
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

      {/* ── Timeline grid ───────────────────────────────────────── */}
      {timelineProducts.length > 0 && (
        <section data-apple-section style={{ backgroundColor: 'rgb(255,255,255)' }}>
          <div
            className="mx-auto w-full max-w-7xl px-5 sm:px-8"
            style={{ paddingBottom: 80 + paddingBoost }}
          >
            <div className="border-t border-black/5 pt-10">
              {useGridLayouts && timelineGridVariant === 'carousel' ? (
                <div className="flex items-center justify-end">
                  <VariantSelect
                    value={timelineGridVariant}
                    onChange={setTimelineGridVariant}
                    label="Timeline grid layout"
                  />
                </div>
              ) : useGridLayouts ? (
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <SlideInLabel
                      className="text-[11px] uppercase tracking-[0.28em]"
                      style={{ color: 'rgba(0,0,0,0.45)' }}
                    >
                      Timeline
                    </SlideInLabel>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                      <Typewriter text="Drop highlights" />
                    </h2>
                  </div>
                  <VariantSelect
                    value={timelineGridVariant}
                    onChange={setTimelineGridVariant}
                    label="Timeline grid layout"
                  />
                </div>
              ) : null}

              {useGridLayouts ? (
                <div className="mt-6 mobile-mosaic-timeline">
                  <StoreGridRenderer
                    variant={timelineGridVariant}
                    section="timeline"
                    items={timelineProducts}
                    allowAnimation={shouldAnimateFeatured && allowAnimation}
                    isMobile={isMobile}
                    isUltraWide={isUltraWide}
                  />
                </div>
              ) : (
                <>
                  <SlideInLabel
                    className="text-[11px] uppercase tracking-[0.28em]"
                    style={{ color: 'rgba(0,0,0,0.45)' }}
                  >
                    Timeline
                  </SlideInLabel>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    <Typewriter text="Drop highlights" />
                  </h2>
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
                                onClick={() => onViewProduct(product)}
                                className="inline-flex rounded-full border border-black/10 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-medium min-h-[34px]"
                                style={{ color: 'rgba(0,0,0,0.7)' }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => onAddClick(product)}
                                disabled={!canAddToCart(product)}
                                className="inline-flex rounded-full px-4 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-semibold min-h-[40px] whitespace-nowrap"
                                style={
                                  canAddToCart(product)
                                    ? { backgroundColor: '#111111', color: '#ffffff' }
                                    : { backgroundColor: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.4)' }
                                }
                              >
                                Add to bag
                              </button>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              <Typewriter text={product.name} />
                            </h3>
                            <p className="mt-2 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                              <FallingWords
                                text={
                                  product.description ||
                                  'A focused essential designed to keep your trading desk clean, calm, and efficient.'
                                }
                                delay={0.1}
                              />
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
  );
}

/* ── Internal helper: grid variant <select> ─────────────────────────────────── */
function VariantSelect({
  value,
  onChange,
  label,
}: {
  value: GridVariant;
  onChange: (v: GridVariant) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as GridVariant)}
      className="h-9 rounded-full border border-black/10 bg-white px-3 text-xs outline-none"
      aria-label={label}
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
  );
}
