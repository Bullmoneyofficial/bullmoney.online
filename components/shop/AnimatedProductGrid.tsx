'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import type { ProductWithDetails } from '@/types/store';
import { ProductCard } from '@/components/shop/ProductCard';

interface AnimatedProductGridProps {
  products: ProductWithDetails[];
  rowHeight?: number;
  itemsPerRow?: number;
  columns?: number; // Alias for itemsPerRow for clarity
  rows?: number; // Number of rows per page (1 to unlimited)
  gap?: number;
  scrollSpeed?: number;
  autoplay?: boolean;
}

export function AnimatedProductGrid({
  products,
  rowHeight = 420,
  itemsPerRow,
  columns,
  rows = 1,
  gap = 18,
  autoplay = true,
}: AnimatedProductGridProps) {
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  // Pause autoplay when component is off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Debounced resize for isMobile
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const check = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMobile(window.innerWidth < 768), 150);
    };
    check();
    window.addEventListener('resize', check);
    return () => { window.removeEventListener('resize', check); clearTimeout(timeout); };
  }, []);

  // Use columns prop if provided, otherwise fall back to itemsPerRow, default to 4
  const colsProp = columns ?? itemsPerRow ?? 4;
  const cols = isMobile ? Math.min(colsProp, 2) : colsProp;
  const rowsPerPage = isMobile ? Math.min(rows, 3) : rows;
  
  // Break products into pages based on rows × columns
  const pages = useMemo(() => {
    if (!products || products.length === 0) return [];
    const result: ProductWithDetails[][] = [];
    const itemsPerPage = cols * rowsPerPage;
    for (let i = 0; i < products.length; i += itemsPerPage) {
      result.push(products.slice(i, i + itemsPerPage));
    }
    return result;
  }, [products, cols, rowsPerPage]);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % pages.length);
  }, [pages.length]);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + pages.length) % pages.length);
  }, [pages.length]);

  // Autoplay - only when visible
  useEffect(() => {
    if (autoplay && pages.length > 1) {
      const interval = setInterval(() => {
        if (isVisibleRef.current) handleNext();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, handleNext, pages.length]);

  // Stable rotation values per page to avoid recalculating in render
  const rotationValues = useMemo(() => 
    pages.map(() => Math.floor(Math.random() * 21) - 10),
    [pages.length]  
  );

  if (!products || products.length === 0 || pages.length === 0) {
    return null;
  }

  const cardHeight = isMobile ? Math.round(rowHeight * 0.85) : rowHeight;
  const cardWidth = Math.round(cardHeight * 0.72);
  const totalHeight = (cardHeight * rowsPerPage) + (gap * (rowsPerPage - 1));

  return (
    <div className="w-full" ref={containerRef}>
      {/* Card stack area */}
      <div className="relative w-full" style={{ minHeight: `${totalHeight + 40}px`, contain: 'layout style', willChange: 'auto' }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.95, y: 30, rotate: (rotationValues[active] || 0) * 0.3 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -30, rotate: (rotationValues[active] || 0) * 0.3 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full"
          >
            <div
              className="grid justify-center mx-auto"
              style={{ 
                gap: `${gap}px`, 
                gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
                maxWidth: `${cols * (cardWidth + gap)}px` 
              }}
            >
              {pages[active]?.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    ease: 'easeOut',
                    delay: idx * 0.08,
                  }}
                  className="shrink-0"
                  style={{ width: cardWidth, height: cardHeight }}
                >
                  <ProductCard product={product} compact={true} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Stacked ghost cards behind for depth effect */}
        {pages.length > 1 && (
          <>
            <div
              className="absolute inset-x-0 top-2 -z-10 opacity-30 blur-[1px] scale-[0.97] pointer-events-none"
              style={{ minHeight: `${totalHeight}px` }}
            >
              <div
                className="grid justify-center mx-auto"
                style={{ 
                  gap: `${gap}px`, 
                  gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
                  maxWidth: `${cols * (cardWidth + gap)}px` 
                }}
              >
                {pages[(active + 1) % pages.length]?.map((product) => (
                  <div key={`ghost1-${product.id}`} className="shrink-0 rounded-3xl"
                    style={{ width: cardWidth, height: cardHeight, backgroundColor: 'rgba(0,0,0,0.03)' }} />
                ))}
              </div>
            </div>
            <div
              className="absolute inset-x-0 top-4 -z-20 opacity-15 blur-[2px] scale-[0.94] pointer-events-none"
              style={{ minHeight: `${totalHeight}px` }}
            >
              <div
                className="grid justify-center mx-auto"
                style={{ 
                  gap: `${gap}px`, 
                  gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
                  maxWidth: `${cols * (cardWidth + gap)}px` 
                }}
              >
                {pages[(active + 2) % pages.length]?.map((product) => (
                  <div key={`ghost2-${product.id}`} className="shrink-0 rounded-3xl"
                    style={{ width: cardWidth, height: cardHeight, backgroundColor: 'rgba(0,0,0,0.02)' }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation + page indicator */}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            className="group/button flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full transition-all"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <IconArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover/button:rotate-12" style={{ color: 'rgba(0,0,0,0.5)' }} />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 24 : 8,
                  height: 8,
                  backgroundColor: i === active ? '#1d1d1f' : 'rgba(0,0,0,0.15)'
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="group/button flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full transition-all"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <IconArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/button:-rotate-12" style={{ color: 'rgba(0,0,0,0.5)' }} />
          </button>
        </div>
      )}
    </div>
  );
}

export default AnimatedProductGrid;
