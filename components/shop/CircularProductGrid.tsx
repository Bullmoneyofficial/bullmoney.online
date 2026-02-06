'use client';

import { useMemo, useEffect, useRef, useCallback } from 'react';
import type { ProductWithDetails } from '@/types/store';
import { ProductCard } from '@/components/shop/ProductCard';
import { HoverEffect } from '@/components/ui/card-hover-effect';

interface CircularProductGridProps {
  products: ProductWithDetails[];
  rowHeight?: number;
  itemsPerRow?: number;
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  scrollSpeed?: number;
  scrollEase?: number;
  gap?: number;
  onProductClick?: (product: ProductWithDetails) => void;
}

export function CircularProductGrid(props: CircularProductGridProps) {
  const {
    products,
    rowHeight = 400,
    itemsPerRow = 6,
    bend = 1,
    gap = 16,
  } = props;
  // Split products into rows - ensure each row has items
  const productRows = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const rows: ProductWithDetails[][] = [];
    for (let i = 0; i < products.length; i += itemsPerRow) {
      const rowItems = products.slice(i, i + itemsPerRow);
      // Only add rows that have at least 1 item
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
      {productRows.map((rowProducts, rowIndex) => {
        return (
          <CircularProductRow
            key={`row-${rowIndex}-${rowProducts[0]?.id || rowIndex}`}
            products={rowProducts}
            rowHeight={rowHeight}
            itemsPerRow={itemsPerRow}
            bend={bend}
            gap={gap}
            rowIndex={rowIndex}
          />
        );
      })}
    </div>
  );
}

export default CircularProductGrid;

interface CircularProductRowProps {
  products: ProductWithDetails[];
  rowHeight: number;
  itemsPerRow: number;
  bend: number;
  gap: number;
  rowIndex?: number; // Add unique row identifier
}

function CircularProductRow({ products, rowHeight, itemsPerRow, bend, gap, rowIndex = 0 }: CircularProductRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  const autoScrollPosRef = useRef(0);
  const isPausedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isMobileRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateCurve = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    // Throttle updates on mobile for better performance
    const now = performance.now();
    if (isMobileRef.current && now - lastUpdateTimeRef.current < 32) { // ~30fps on mobile
      return;
    }
    lastUpdateTimeRef.current = now;

    const rowRect = row.getBoundingClientRect();
    const centerX = rowRect.left + rowRect.width / 2;
    const halfWidth = Math.max(rowRect.width / 2, 1);
    const direction = bend >= 0 ? -1 : 1;
    const absBend = Math.abs(bend);

    if (absBend === 0) {
      itemRefs.current.forEach((item) => {
        if (!item) return;
        item.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
      });
      return;
    }

    const fov = 45;
    const cameraZ = 20;
    const viewportHeight = 2 * Math.tan((fov * Math.PI) / 360) * cameraZ;
    const viewportWidth = viewportHeight * (rowRect.width / rowRect.height);
    const H = viewportWidth / 2;
    const R = (H * H + absBend * absBend) / (2 * absBend);
    const pxToWorld = viewportWidth / rowRect.width;
    const worldToPx = rowRect.width / viewportWidth;

    itemRefs.current.forEach((item) => {
      if (!item) return;
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const xPx = itemCenterX - centerX;
      const xWorld = xPx * pxToWorld;
      const effectiveX = Math.min(Math.abs(xWorld), H);
      const arcWorld = R - Math.sqrt(Math.max(R * R - effectiveX * effectiveX, 0));
      const arcPx = arcWorld * worldToPx;
      const rotationRad = Math.asin(Math.min(effectiveX / R, 1));
      const rotationDeg = (rotationRad * 180) / Math.PI;
      const y = direction * arcPx;
      const rotate = direction * Math.sign(xWorld) * rotationDeg;
      item.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg)`;
    });
  }, [bend, rowHeight]);

  // Pause rAF loops when row is off-screen (saves CPU/GPU)
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
    const loop = () => {
      if (isVisibleRef.current) updateCurve();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateCurve]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const handleUpdate = () => updateCurve();
    const resizeObserver = new ResizeObserver(handleUpdate);

    resizeObserver.observe(row);
    row.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate);

    return () => {
      resizeObserver.disconnect();
      row.removeEventListener('scroll', handleUpdate);
    // Reduce speed on mobile for smoother performance
    const baseSpeed = Math.max(20, Math.round(cardWidth * 0.25));
    const pixelsPerSecond = isMobileRef.current ? baseSpeed * 0.6 : baseSpeed
    };
  }, [updateCurve]);

  const fov = 45;
  const cameraZ = 20;
  const viewportHeight = 2 * Math.tan((fov * Math.PI) / 360) * cameraZ;
  const cardWidth = Math.round(rowHeight * (700 / 1500));
  const cardGap = Math.round((2 * rowHeight) / viewportHeight);
  const trackPadding = Math.round(cardWidth * 0.5);
  const repeatCount = products.length < 6 ? 4 : 3;
  const repeatedProducts = Array.from({ length: repeatCount }, () => products).flat();
  const compact = itemsPerRow >= 6;

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let lastTime = 0;
    const pixelsPerSecond = Math.max(20, Math.round(cardWidth * 0.25));

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll > 0 && !isPausedRef.current && isVisibleRef.current) {
        autoScrollPosRef.current = (autoScrollPosRef.current + (pixelsPerSecond * delta) / 1000) % maxScroll;
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
  }, [cardWidth, repeatedProducts.length]);

  return (
    <div
      ref={rowRef}
      className="circular-product-row relative w-full overflow-x-hidden overflow-y-visible scrollbar-hide"
      style={{ height: `${rowHeight}px` }}
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
      onTouchStart={() => { isPausedRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { isPausedRef.current = false; }, 300); }}
    >
      <HoverEffect
        items={repeatedProducts}
        layout="custom"
        className="flex items-start h-full"
        containerStyle={{
          gap: `${cardGap}px`,
          paddingBottom: `${Math.round(rowHeight * 0.15)}px`,
          paddingLeft: `${trackPadding}px`,
          paddingRight: `${trackPadding}px`,
        }}
        itemClassName="shrink-0 will-change-transform"
        getItemStyle={() => ({ width: `${cardWidth}px` })}
        getKey={(product, index) => `${product.id}-${rowIndex}-${index}`}
        getLink={() => undefined}
        onItemRef={(index, el) => {
          itemRefs.current[index] = el;
        }}
        renderItem={(product) => <ProductCard product={product} compact={compact} />}
      />
    </div>
  );
}
