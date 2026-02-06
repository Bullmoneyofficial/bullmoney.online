'use client';

import { useMemo, useEffect, useRef } from 'react';
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
}

export function GlassProductGrid({
  products,
  rowHeight = 360,
  itemsPerRow = 5,
  gap = 18,
  scrollSpeed = 24,
  glassProps = {},
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
          direction={rowIndex % 2 === 0 ? 1 : -1}
          glassProps={glassProps}
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
}

function GlassProductRow({ products, rowHeight, gap, scrollSpeed, direction, glassProps }: GlassProductRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  const autoScrollPosRef = useRef(0);
  const isPausedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isMobileRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);

  const repeatCount = products.length < 6 ? 4 : 3;
  const repeatedProducts = Array.from({ length: repeatCount }, () => products).flat();
  const cardWidth = Math.round(rowHeight * 0.72);
  const trackPadding = Math.round(cardWidth * 0.6);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pause rAF when row is off-screen
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { rootMargin: '100px 0px' }
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let lastTime = 0;
    // Reduce speed on mobile for smoother performance
    const baseSpeed = Math.max(16, scrollSpeed);
    const speedPx = isMobileRef.current ? baseSpeed * 0.5 : baseSpeed;
    // Throttle mobile updates to ~30fps instead of 60fps
    const mobileThrottle = isMobileRef.current ? 32 : 0;

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;

      // Throttle updates on mobile
      if (isMobileRef.current && time - lastUpdateTimeRef.current < mobileThrottle) {
        autoScrollRef.current = window.requestAnimationFrame(loop);
        return;
      }
      lastUpdateTimeRef.current = time;
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

  return (
    <div
      ref={rowRef}
      className="relative w-full overflow-x-hidden overflow-y-visible"
      style={{ height: `${rowHeight}px` }}
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
      onTouchStart={() => {
        isPausedRef.current = true;
      }}
      onTouchEnd={() => {
        isPausedRef.current = false;
      }}
    >
      <HoverEffect
        items={repeatedProducts}
        layout="custom"
        className="flex items-stretch h-full"
        containerStyle={{
          gap: `${gap}px`,
          paddingLeft: `${trackPadding}px`,
          paddingRight: `${trackPadding}px`,
        }}
        itemClassName="shrink-0"
        getItemStyle={() => ({ width: `${cardWidth}px` })}
        getKey={(product, index) => `${product.id}-${index}`}
        getLink={() => undefined}
        renderItem={(product) => (
          <GlassSurface
            width={cardWidth}
            height={rowHeight}
            borderRadius={Math.round(cardWidth * 0.2)}
            className="h-full w-full"
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
            <div className="h-full w-full p-2">
              <ProductCard product={product} compact={true} />
            </div>
          </GlassSurface>
        )}
      />
    </div>
  );
}

export default GlassProductGrid;
