'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { ProductImage } from '@/types/store';

// ============================================================================
// PRODUCT GALLERY - LUXURY HOVER ZOOM WITH MOBILE SWIPE
// ============================================================================

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const activeImage = sortedImages[activeIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  }, [sortedImages.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  }, [sortedImages.length]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      handlePrev();
    } else if (info.offset.x < -threshold) {
      handleNext();
    }
  }, [handlePrev, handleNext]);

  if (!sortedImages.length) {
    return (
      <div className="aspect-square bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center">
        <span className="text-white/20 text-6xl md:text-8xl font-light">B</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Main Image with Zoom (desktop) / Swipe (mobile) */}
      <div className="relative">
        <motion.div
          ref={imageRef}
          className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white/5 cursor-zoom-in touch-pan-x"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeImage.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              style={{ x: dragX }}
            >
              <Image
                src={activeImage.url}
                alt={activeImage.alt_text || productName}
                fill
                className="object-cover transition-transform duration-300 select-none"
                style={{
                  transform: isZooming ? 'scale(2)' : 'scale(1)',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom Indicator - Desktop only */}
          <div className={`hidden md:flex absolute top-4 right-4 h-10 w-10 rounded-full bg-black/80 items-center justify-center transition-opacity ${isZooming ? 'opacity-100' : 'opacity-0'}`}>
            <ZoomIn className="w-5 h-5 text-white" />
          </div>

          {/* Navigation Arrows - Hidden on mobile, use swipe instead */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/80 items-center justify-center text-white hover:bg-black transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/80 items-center justify-center text-white hover:bg-black transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Mobile Dots Indicator */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === index 
                      ? 'w-6 bg-white' 
                      : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Thumbnail Strip - Horizontal scroll on mobile */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`relative shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden transition-all active:scale-95
                ${activeIndex === index 
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black opacity-100' 
                  : 'opacity-50 hover:opacity-80'
                }`}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
