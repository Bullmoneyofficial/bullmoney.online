'use client';

/**
 * StoreGridRenderer.tsx
 *
 * Renders any of the 28 grid layout variants for a list of products.
 * Accepts variant name, section tag, items, and animation flags — keeping all
 * CSS grid / animation logic isolated from the parent page.
 */

import React, { useMemo } from 'react';
import type { ProductWithDetails } from '@/types/store';
import type { GridVariant } from '../_constants/grid.constants';
import {
  AnimatedProductGrid,
  CircularProductGrid,
  GlassProductGrid,
  ProductCard,
  ProductsCarousel,
} from '../_lazy/store-dynamics';

interface StoreGridRendererProps {
  variant: GridVariant;
  section: 'products' | 'featured' | 'timeline';
  items: ProductWithDetails[];
  allowAnimation: boolean;
  isMobile: boolean;
  isUltraWide: boolean;
  /** Required only for "carousel" variant's load-more button */
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  page?: number;
}

export function StoreGridRenderer({
  variant,
  section,
  items,
  allowAnimation,
  isMobile,
  isUltraWide,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  page = 1,
}: StoreGridRendererProps) {
  if (!items.length) return null;

  const isProducts = section === 'products';
  const isFeatured = section === 'featured';
  const isTimeline = section === 'timeline';

  // Estimate visible count to decide whether animations are worthwhile
  const visibleEstimate = useMemo(() => {
    const desktopCols = isUltraWide ? 6 : 4;
    const compactCols = isUltraWide ? 7 : 5;
    const denseCols = isUltraWide ? 7 : 5;
    const tilesCols = isUltraWide ? 6 : 4;
    const microCols = isUltraWide ? 9 : 7;
    const gridRows = isProducts ? 2 : 1;

    switch (variant) {
      case 'animated': return (isTimeline ? 3 : 4) * gridRows;
      case 'circular':
      case 'glass': return (isTimeline ? 3 : isFeatured ? 4 : 5) * gridRows;
      case 'carousel': return (isProducts ? 2 : 1) * (isMobile ? 3 : 4);
      case 'compact': return (isMobile ? 2 : desktopCols) * 2;
      case 'compact-2': return (isMobile ? 3 : compactCols) * 2;
      case 'micro': return (isMobile ? 4 : microCols) * 2;
      case 'dense': return (isMobile ? 3 : denseCols) * 2;
      case 'snug':
      case 'gallery':
      case 'tiles': return (isMobile ? 2 : tilesCols) * 2;
      case 'wide':
      case 'center': return 4;
      case 'split':
      case 'stacked':
      case 'spotlight':
      case 'glow':
      case 'edge':
      case 'frame':
      case 'shadow':
      case 'borderless': return 6;
      case 'list':
      case 'stripe':
      case 'shelves': return isMobile ? 3 : 4;
      case 'ribbon': return isMobile ? 2 : 4;
      case 'panel': return (isMobile ? 2 : 4) * 2;
      case 'diagonal': return 6;
      case 'mosaic': return (isMobile ? 2 : tilesCols) * 2;
      default: return items.length;
    }
  }, [variant, section, isMobile, isUltraWide, items.length]);

  const shouldAnimateGrid = allowAnimation && visibleEstimate <= 12;
  const staggerStyle = (index: number) => ({
    animationDelay: `${Math.min(index, 10) * 35}ms`,
  });

  switch (variant) {
    // ── Animated grid ────────────────────────────────────────────────────
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
            onLoadMore={isProducts ? onLoadMore : undefined}
            hasMore={isProducts ? hasMore : false}
            loading={isProducts ? loadingMore : false}
          />
        </div>
      );

    case 'compact':
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'compact-2':
      return (
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'micro':
      return (
        <div className="grid gap-1.5 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'dense':
      return (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'snug':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'masonry':
      return (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4 [column-fill:_balance] grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`mb-4 break-inside-avoid grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
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
              style={{
                ...(shouldAnimateGrid ? staggerStyle(index) : {}),
                backgroundColor:
                  index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.05)',
              }}
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
              className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''} ${
                index === 0
                  ? 'lg:col-span-2 ring-1 ring-amber-300/40 shadow-[0_20px_60px_rgba(245,158,11,0.18)] spotlight-card'
                  : ''
              } ${index === 0 && shouldAnimateGrid ? 'spotlight-active' : ''}`}
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
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'wide':
      return (
        <div className="grid gap-6 md:grid-cols-2 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      );

    case 'center':
      return (
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
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
              <div
                key={product.id}
                className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.slice(4).map((product, index) => (
              <div
                key={product.id}
                className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index + 4) : undefined}
              >
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
              className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''} ${
                index % 7 === 0
                  ? 'sm:col-span-2'
                  : index % 9 === 0
                  ? 'lg:row-span-2'
                  : 'h-full'
              }`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'ribbon':
      return (
        <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] snap-x snap-mandatory grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`min-w-[220px] snap-start grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      );

    case 'shelves':
      return (
        <div className="flex flex-col gap-6 grid-perf">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`border-t border-black/5 pt-6 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
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
            <div
              key={product.id}
              className={`rounded-2xl border border-black/15 p-2 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
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
              style={
                shouldAnimateGrid
                  ? {
                      ...staggerStyle(index),
                      transform:
                        index % 2 === 0 ? 'rotate(-0.8deg)' : 'rotate(0.8deg)',
                    }
                  : { transform: index % 2 === 0 ? 'rotate(-0.8deg)' : 'rotate(0.8deg)' }
              }
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
              <div
                key={product.id}
                className={`grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
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
            <div
              key={product.id}
              className={`rounded-3xl border border-black/10 bg-white p-2 grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
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
            <div
              key={product.id}
              className={`bg-transparent grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
              style={shouldAnimateGrid ? staggerStyle(index) : undefined}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      );

    case 'mosaic':
      return (
        <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 grid-perf">
          {items.map((product, index) => {
            const mosaicSpan =
              index % 5 === 0
                ? 'col-span-6 sm:col-span-2'
                : index % 5 === 1
                ? 'col-span-3 sm:col-span-1'
                : index % 5 === 2
                ? 'col-span-3 sm:col-span-1'
                : index % 5 === 3
                ? 'col-span-4 sm:col-span-1'
                : 'col-span-2 sm:col-span-1';
            return (
              <div
                key={product.id}
                className={`${mosaicSpan} h-full grid-card ${shouldAnimateGrid ? 'stagger-item' : ''}`}
                style={shouldAnimateGrid ? staggerStyle(index) : undefined}
              >
                <ProductCard product={product} compact={index % 5 !== 0} />
              </div>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}
