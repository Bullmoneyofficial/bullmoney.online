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
  const lastCurveUpdateRef = useRef(0);
  const cachedRowRectRef = useRef<{ left: number; width: number; height: number } | null>(null);
  const curveNeedsUpdateRef = useRef(true);

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

  // Detect mobile device — rAF debounced
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    };
    checkMobile();
    let rafId: number | null = null;
    const handleMobileCheck = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { checkMobile(); rafId = null; });
    };
    window.addEventListener('resize', handleMobileCheck, { passive: true });
    return () => {
      window.removeEventListener('resize', handleMobileCheck);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const updateCurve = useCallback((forceUpdate = false) => {
    const row = rowRef.current;
    if (!row) return;

    // On mobile, throttle curve updates to ~20fps (every 50ms) to avoid jank
    // On desktop, allow up to ~60fps
    const now = performance.now();
    const throttleMs = isMobileRef.current ? 50 : 16;
    if (!forceUpdate && now - lastCurveUpdateRef.current < throttleMs) {
      return;
    }
    lastCurveUpdateRef.current = now;

    // Cache row rect to avoid layout thrashing — only re-measure on resize/force
    if (!cachedRowRectRef.current || forceUpdate) {
      const rowRect = row.getBoundingClientRect();
      cachedRowRectRef.current = { left: rowRect.left, width: rowRect.width, height: rowRect.height };
    }
    const rowRect = cachedRowRectRef.current;

    const centerX = rowRect.left + rowRect.width / 2;
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

    // On mobile, use offsetLeft-based calculation to avoid per-item getBoundingClientRect
    const scrollLeft = row.scrollLeft;
    itemRefs.current.forEach((item) => {
      if (!item) return;
      let xPx: number;
      if (isMobileRef.current) {
        // Use offsetLeft to avoid costly getBoundingClientRect per item
        const itemCenterX = item.offsetLeft + item.offsetWidth / 2 - scrollLeft + rowRect.left;
        xPx = itemCenterX - centerX;
      } else {
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        xPx = itemCenterX - centerX;
      }
      const xWorld = xPx * pxToWorld;
      // Clamp to circle radius R (not half-viewport H) so edge items
      // continue along the arc instead of snapping flat
      const effectiveX = Math.min(Math.abs(xWorld), R * 0.99);
      const arcWorld = R - Math.sqrt(Math.max(R * R - effectiveX * effectiveX, 0));
      const arcPx = arcWorld * worldToPx;
      const rotationRad = Math.asin(Math.min(effectiveX / R, 1));
      const rotationDeg = (rotationRad * 180) / Math.PI;
      const y = direction * arcPx;
      const rotate = direction * Math.sign(xWorld) * rotationDeg;
      item.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${rotate.toFixed(1)}deg)`;
    });
  }, [bend, rowHeight]);

  // Pause rAF loops when row is off-screen (saves CPU/GPU)
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

  // Single unified rAF loop for curve updates — driven by scroll changes, not every frame
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let lastScrollLeft = -1;

    const loop = () => {
      if (isVisibleRef.current) {
        // Only recalculate curve when scroll position actually changed
        const currentScroll = row.scrollLeft;
        if (currentScroll !== lastScrollLeft || curveNeedsUpdateRef.current) {
          lastScrollLeft = currentScroll;
          curveNeedsUpdateRef.current = false;
          updateCurve();
        }
      }
      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateCurve]);

  // Invalidate cached row rect on resize
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const handleResize = () => {
      cachedRowRectRef.current = null;
      curveNeedsUpdateRef.current = true;
      updateCurve(true);
    };
    const resizeObserver = new ResizeObserver(handleResize);

    resizeObserver.observe(row);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
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
    // Cancel any pending resume or momentum
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
    // Track velocity for momentum
    const now = performance.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (lastDragXRef.current - clientX) / dt; // px per ms
    }
    lastDragXRef.current = clientX;
    lastDragTimeRef.current = now;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const row = rowRef.current;
    if (!row) return;

    // Apply momentum scroll
    let v = velocityRef.current * 16; // convert to px/frame (~16ms)
    const friction = 0.95;
    const applyMomentum = () => {
      if (Math.abs(v) < 0.5) {
        // Momentum done — sync auto-scroll position and resume
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
      // No significant velocity — just sync and resume
      autoScrollPosRef.current = row.scrollLeft;
      resumeTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
    }
  }, []);

  // Mouse drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only left button for mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Don't start drag if clicking on interactive elements (buttons, links, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], input, select, textarea')) return;
    handleDragStart(e.clientX);
    // Don't capture here — wait for real drag movement so child clicks still fire
  }, [handleDragStart]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    handleDragMove(e.clientX);
    // Only capture pointer after significant movement (actual drag, not a click)
    if (isDraggingRef.current && dragDistanceRef.current > 5) {
      try {
        if (!(e.currentTarget as Element).hasPointerCapture(e.pointerId)) {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }
      } catch {}
    }
  }, [handleDragMove]);

  const onPointerUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Prevent clicks on products if the user just dragged
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragDistanceRef.current > 5) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (momentumRef.current !== null) cancelAnimationFrame(momentumRef.current);
    };
  }, []);

  // Auto-scroll loop — reduced speed on mobile for smoother experience
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let lastTime = 0;
    const baseSpeed = Math.max(20, Math.round(cardWidth * 0.25));
    const pixelsPerSecond = isMobileRef.current ? baseSpeed * 0.5 : baseSpeed;

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = Math.min(time - lastTime, 50); // Cap delta to avoid big jumps
      lastTime = time;

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll > 0 && !isPausedRef.current && isVisibleRef.current) {
        autoScrollPosRef.current += (pixelsPerSecond * delta) / 1000;
        // Seamless infinite loop: snap back by one product-set width
        // so there's no visible jump (repeated content is identical)
        const singleSetWidth = products.length * (cardWidth + cardGap);
        if (singleSetWidth > 0 && autoScrollPosRef.current >= singleSetWidth) {
          autoScrollPosRef.current -= singleSetWidth;
        }
        row.scrollLeft = Math.min(autoScrollPosRef.current, maxScroll);
      }

      autoScrollRef.current = window.requestAnimationFrame(loop);
    };

    autoScrollRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (autoScrollRef.current !== null) {
        window.cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [cardWidth, cardGap, products.length, repeatedProducts.length]);

  return (
    <div
      ref={rowRef}
      className="circular-product-row relative w-full overflow-x-auto overflow-y-visible scrollbar-hide select-none"
      style={{ height: `${rowHeight}px`, contain: 'layout style', willChange: 'auto', cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onMouseEnter={() => { if (!isDraggingRef.current) isPausedRef.current = true; }}
      onMouseLeave={() => { if (!isDraggingRef.current) { isPausedRef.current = false; } handleDragEnd(); }}
      onTouchStart={() => { isPausedRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { if (!isDraggingRef.current) isPausedRef.current = false; }, 300); }}
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
