'use client';

import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import type { ProductWithDetails } from '@/types/store';
import GlassSurface, { type GlassSurfaceProps } from '@/components/GlassSurface';
import { ProductCard } from '@/components/shop/ProductCard';
import { HoverEffect } from '@/components/ui/card-hover-effect';

interface GlassProductGridProps {
  products: ProductWithDetails[];
  rowHeight?: number;
  itemsPerRow?: number;
  gap?: number;
  scrollSpeed?: number;
  glassProps?: Partial<GlassSurfaceProps>;
  visibleCount?: number;
}

export function GlassProductGrid({
  products,
  rowHeight = 360,
  itemsPerRow = 5,
  gap = 18,
  scrollSpeed = 24,
  glassProps = {},
  visibleCount,
}: GlassProductGridProps) {
  const productRows = useMemo(() => {
    if (!products || products.length === 0) return [];

    const rows: ProductWithDetails[][] = [];
    for (let i = 0; i < products.length; i += itemsPerRow) {
      const rowItems = products.slice(i, i + itemsPerRow);
      if (rowItems.length > 0) {
        rows.push(rowItems);
      }
    }
    return rows;
  }, [products, itemsPerRow]);

  if (!products || products.length === 0 || productRows.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col" style={{ gap: `${gap}px` }}>
      {productRows.map((rowProducts, rowIndex) => (
        <GlassProductRow
          key={`glass-row-${rowIndex}-${rowProducts[0]?.id || rowIndex}`}
          products={rowProducts}
          rowHeight={rowHeight}
          gap={gap}
          scrollSpeed={scrollSpeed}
          direction={1}
          glassProps={glassProps}
          visibleCount={visibleCount}
        />
      ))}
    </div>
  );
}

interface GlassProductRowProps {
  products: ProductWithDetails[];
  rowHeight: number;
  gap: number;
  scrollSpeed: number;
  direction: 1 | -1;
  glassProps: Partial<GlassSurfaceProps>;
  visibleCount?: number;
}

function GlassProductRow({ products, rowHeight, gap, scrollSpeed, direction, glassProps, visibleCount }: GlassProductRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  const autoScrollPosRef = useRef(0);
  const isPausedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isMobileRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // --- Swipe / drag state ---
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollStartRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const velocityRef = useRef(0);
  const lastDragXRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const momentumRef = useRef<number | null>(null);

  const repeatCount = products.length < 4 ? 4 : products.length < 8 ? 3 : 2;
  const repeatedProducts = Array.from({ length: repeatCount }, () => products).flat();
  const defaultCardWidth = Math.round(rowHeight * 0.72);
  // If visibleCount is set and we have a measured container, size cards to show exactly N at once
  const rawCardWidth = visibleCount && containerWidth > 0
    ? Math.round((containerWidth - (visibleCount + 1) * gap) / visibleCount)
    : defaultCardWidth;
  // Cap card width on desktop to prevent oversized cards
  const maxCardWidth = 320;
  const cardWidth = visibleCount ? Math.min(rawCardWidth, maxCardWidth) : rawCardWidth;
  // Auto-compute card height from card width using 4:5 aspect ratio when visibleCount is set
  const cardHeight = visibleCount ? Math.round(cardWidth * 1.25) : rowHeight;
  const trackPadding = Math.round(cardWidth * 0.6);

  // Measure container width for visibleCount sizing — rAF debounced
  useEffect(() => {
    if (!visibleCount) return;
    const measure = () => {
      if (rowRef.current) setContainerWidth(rowRef.current.clientWidth);
    };
    measure();
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { measure(); rafId = null; });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visibleCount]);

  // Detect mobile device — rAF debounced
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
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

  // Pause rAF when row is off-screen
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { rootMargin: '200px 0px' }
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let lastTime = 0;
    // Reduce speed on mobile for smoother scrolling
    const baseSpeed = Math.max(16, scrollSpeed);
    const speedPx = isMobileRef.current ? baseSpeed * 0.4 : baseSpeed;

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = Math.min(time - lastTime, 50); // Cap delta to avoid teleporting on tab switch
      lastTime = time;

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll > 0 && !isPausedRef.current && isVisibleRef.current) {
        const next = autoScrollPosRef.current + direction * (speedPx * delta) / 1000;
        autoScrollPosRef.current = ((next % maxScroll) + maxScroll) % maxScroll;
        row.scrollLeft = autoScrollPosRef.current;
      }

      autoScrollRef.current = window.requestAnimationFrame(loop);
    };

    autoScrollRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (autoScrollRef.current !== null) {
        window.cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [direction, scrollSpeed, repeatedProducts.length]);

  // --- Swipe / drag handling ---
  const handleDragStart = useCallback((clientX: number) => {
    const row = rowRef.current;
    if (!row) return;
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragScrollStartRef.current = row.scrollLeft;
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
    const row = rowRef.current;
    if (!row) return;
    const dx = dragStartXRef.current - clientX;
    dragDistanceRef.current = Math.abs(dx);
    row.scrollLeft = dragScrollStartRef.current + dx;
    const now = performance.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (lastDragXRef.current - clientX) / dt;
    }
    lastDragXRef.current = clientX;
    lastDragTimeRef.current = now;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const row = rowRef.current;
    if (!row) return;

    let v = velocityRef.current * 16;
    const friction = 0.95;
    const applyMomentum = () => {
      if (Math.abs(v) < 0.5) {
        autoScrollPosRef.current = row.scrollLeft;
        resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
        return;
      }
      row.scrollLeft += v;
      v *= friction;
      momentumRef.current = requestAnimationFrame(applyMomentum);
    };
    if (Math.abs(velocityRef.current) > 0.1) {
      momentumRef.current = requestAnimationFrame(applyMomentum);
    } else {
      autoScrollPosRef.current = row.scrollLeft;
      resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    handleDragStart(e.clientX);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [handleDragStart]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const onPointerUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragDistanceRef.current > 5) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (momentumRef.current !== null) cancelAnimationFrame(momentumRef.current);
    };
  }, []);

  return (
    <div
      ref={rowRef}
      className="relative w-full overflow-x-auto overflow-y-visible scrollbar-hide select-none"
      style={{ height: `${cardHeight + 70}px`, paddingBottom: '70px', willChange: 'auto', contain: 'layout style', cursor: isDraggingRef.current ? 'grabbing' : 'grab' } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onMouseLeave={handleDragEnd}
      onTouchEnd={() => { setTimeout(() => { if (!isDraggingRef.current) isPausedRef.current = false; }, 300); }}
    >
      <HoverEffect
        items={repeatedProducts}
        layout="custom"
        className="flex items-start h-full"
        containerStyle={{
          gap: `${gap}px`,
          paddingLeft: `${gap}px`,
          paddingRight: `${gap}px`,
        }}
        itemClassName="shrink-0"
        getItemStyle={() => ({ width: `${cardWidth}px` })}
        getKey={(product, index) => `${product.id}-${index}`}
        getLink={() => undefined}
        renderItem={(product) => (
          <GlassSurface
            width={cardWidth}
            height={cardHeight}
            borderRadius={Math.round(cardWidth * 0.1)}
            className="w-full"
            displace={0.5}
            distortionScale={-180}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            brightness={50}
            opacity={0.93}
            mixBlendMode="screen"
            {...glassProps}
          >
            <div className="w-full p-2" style={{ minHeight: `${cardHeight}px` }}>
              <ProductCard product={product} compact={true} />
            </div>
          </GlassSurface>
        )}
      />
    </div>
  );
}

export default GlassProductGrid;
