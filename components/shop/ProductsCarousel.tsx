'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { ProductWithDetails } from '@/types/store';
import { ProductCard } from '@/components/shop/ProductCard';

// ============================================================================
// PRODUCTS CAROUSEL - AUTO-SCROLLING MULTI-ROW CAROUSEL
// Rows controlled by picker. Scrolls left-to-right infinitely.
// ============================================================================

interface ProductsCarouselProps {
  products: ProductWithDetails[];
  title?: string;
  subtitle?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
  scrollSpeed?: number;
  rowHeight?: number;
  infinite?: boolean;
  mobileColumns?: number;
  desktopColumns?: number;
  mobileRows?: number;
  desktopRows?: number;
}

export function ProductsCarousel({
  products,
  title = 'Featured Products',
  subtitle,
  onLoadMore,
  hasMore = false,
  loading = false,
  className,
  scrollSpeed = 30,
  mobileRows = 2,
  desktopRows = 2,
}: ProductsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const autoScrollPosRef = useRef(0);
  const isPausedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isMobileRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Swipe / drag state
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollStartRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const velocityRef = useRef(0);
  const lastDragXRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const momentumRef = useRef<number | null>(null);

  const rows = isFinite(isMobileRef.current ? mobileRows : desktopRows)
    ? (isMobileRef.current ? mobileRows : desktopRows)
    : products.length; // Infinite = stack all products in one column

  // Chunk products into columns (each column = N rows stacked)
  const columns = useMemo(() => {
    const r = isFinite(rows) ? rows : products.length;
    const cols: ProductWithDetails[][] = [];
    for (let i = 0; i < products.length; i += r) {
      cols.push(products.slice(i, i + r));
    }
    return cols;
  }, [products, rows]);

  // Repeat columns for infinite scroll
  const repeatCount = columns.length < 6 ? 4 : 3;
  const repeatedColumns = useMemo(
    () => Array.from({ length: repeatCount }, () => columns).flat(),
    [columns, repeatCount]
  );

  // Detect mobile — rAF debounced
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
    };
    checkMobile();
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { checkMobile(); rafId = null; });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Pause rAF when off-screen
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { rootMargin: '200px 0px' }
    );
    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll loop
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || products.length === 0) return;

    let lastTime = 0;
    const baseSpeed = Math.max(16, scrollSpeed);
    const speedPx = isMobileRef.current ? baseSpeed * 0.5 : baseSpeed;

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll > 0 && !isPausedRef.current && isVisibleRef.current) {
        const next = autoScrollPosRef.current + (speedPx * delta) / 1000;
        autoScrollPosRef.current = ((next % maxScroll) + maxScroll) % maxScroll;
        carousel.scrollLeft = autoScrollPosRef.current;
      }

      autoScrollRef.current = window.requestAnimationFrame(loop);
    };

    autoScrollRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (autoScrollRef.current !== null) window.cancelAnimationFrame(autoScrollRef.current);
    };
  }, [scrollSpeed, products.length]);

  // Infinite load-more observer
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [onLoadMore, hasMore, loading]);

  // Drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragScrollStartRef.current = carousel.scrollLeft;
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
    lastDragXRef.current = clientX;
    lastDragTimeRef.current = performance.now();
    isPausedRef.current = true;
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null; }
    if (momentumRef.current !== null) { cancelAnimationFrame(momentumRef.current); momentumRef.current = null; }
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const carousel = carouselRef.current;
    if (!carousel) return;
    const dx = dragStartXRef.current - clientX;
    dragDistanceRef.current = Math.abs(dx);
    carousel.scrollLeft = dragScrollStartRef.current + dx;
    const now = performance.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) velocityRef.current = (lastDragXRef.current - clientX) / dt;
    lastDragXRef.current = clientX;
    lastDragTimeRef.current = now;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const carousel = carouselRef.current;
    if (!carousel) return;

    let v = velocityRef.current * 16;
    const friction = 0.95;
    const applyMomentum = () => {
      if (Math.abs(v) < 0.5) {
        autoScrollPosRef.current = carousel.scrollLeft;
        resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
        return;
      }
      v *= friction;
      carousel.scrollLeft += v;
      momentumRef.current = requestAnimationFrame(applyMomentum);
    };
    applyMomentum();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => handleDragStart(e.clientX), [handleDragStart]);
  const onMouseMove = useCallback((e: React.MouseEvent) => handleDragMove(e.clientX), [handleDragMove]);
  const onMouseUp = useCallback(() => handleDragEnd(), [handleDragEnd]);
  const onMouseLeave = useCallback(() => { if (isDraggingRef.current) handleDragEnd(); }, [handleDragEnd]);
  const onTouchStart = useCallback((e: React.TouchEvent) => handleDragStart(e.touches[0].clientX), [handleDragStart]);
  const onTouchMove = useCallback((e: React.TouchEvent) => handleDragMove(e.touches[0].clientX), [handleDragMove]);
  const onTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  const handleMouseEnter = useCallback(() => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null; }
  }, []);

  const handleMouseLeaveRow = useCallback(() => {
    if (!isDraggingRef.current) {
      resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 500);
    }
  }, []);

  const scrollLeftFn = () => {
    if (carouselRef.current) {
      isPausedRef.current = true;
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
      autoScrollPosRef.current = carouselRef.current.scrollLeft - 400;
      resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
    }
  };

  const scrollRightFn = () => {
    if (carouselRef.current) {
      isPausedRef.current = true;
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
      autoScrollPosRef.current = carouselRef.current.scrollLeft + 400;
      resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
    }
  };

  if (products.length === 0) {
    return (
      <div className={cn('w-full py-20 flex items-center justify-center', className)}>
        <p className="text-white/50 text-lg">No products available</p>
      </div>
    );
  }

  // Card sizing: height adapts to row count so total height stays reasonable
  const baseHeight = isMobileRef.current ? 380 : 480;
  const effectiveRows = isFinite(rows) ? rows : products.length;
  const minCardHeight = isMobileRef.current ? 160 : 180;
  const cardHeight = effectiveRows > 1
    ? Math.max(minCardHeight, Math.round(baseHeight / Math.min(effectiveRows, 5) * 1.1))
    : baseHeight;
  const cardWidth = Math.round(cardHeight * 0.72);
  const gap = isMobileRef.current ? 36 : 64;

  return (
    <div className={cn('w-full', className)}>
      {/* Header with Navigation buttons */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white font-sans">
              {title}
            </h2>
            {subtitle && (
              <p className="text-white/60 text-base md:text-lg mt-2">{subtitle}</p>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center md:justify-end shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex gap-3">
              <button
                className="group flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/25 hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:shadow-white/10"
                onClick={scrollLeftFn}
              >
                <IconArrowNarrowLeft className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform duration-300" />
              </button>
              <button
                className="group flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/25 hover:border-white/40 hover:scale-110 active:scale-95 transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:shadow-white/10"
                onClick={scrollRightFn}
              >
                <IconArrowNarrowRight className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative w-full overflow-visible">
        <div
          className="flex w-full overflow-x-scroll overflow-y-visible overscroll-x-auto pt-6 pb-28 md:pt-10 md:pb-40 [scrollbar-width:none] cursor-grab active:cursor-grabbing"
          ref={carouselRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', willChange: 'scroll-position', contain: 'layout style' } as React.CSSProperties}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseEnter={handleMouseEnter}
        >
          {/* Left gradient fade */}
          <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-16 md:w-24 bg-gradient-to-r from-black to-transparent" />
          {/* Right gradient fade */}
          <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16 md:w-24 bg-gradient-to-l from-black to-transparent" />

          <div
            className="flex flex-row px-4 md:px-8"
            style={{ gap }}
            onMouseLeave={handleMouseLeaveRow}
          >
            {repeatedColumns.map((column, colIndex) => (
              <div
                key={colIndex}
                className="shrink-0 flex flex-col"
                style={{ width: cardWidth, gap }}
              >
                {column.map((product, rowIndex) => (
                  <div
                    key={`${product.id}-${colIndex}-${rowIndex}`}
                    style={{ height: cardHeight }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ))}

            {/* Load more trigger */}
            {onLoadMore && hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center w-20 shrink-0">
                {loading && (
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsCarousel;
