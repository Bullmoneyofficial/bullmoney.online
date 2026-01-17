"use client";

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { FeedCard } from './FeedCard';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import type { Analysis, ReactionType } from '@/types/feed';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface FeedSwiperProps {
  analyses: Analysis[];
  loading: boolean;
  onOpenAnalysis: (analysis: Analysis) => void;
  onReaction?: (analysisId: string, type: ReactionType) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUserId?: string;
}

// TikTok-style vertical swipe navigation for mobile
export const FeedSwiper = memo(({
  analyses,
  loading,
  onOpenAnalysis,
  onReaction,
  onLoadMore,
  hasMore = false,
  currentUserId,
}: FeedSwiperProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.5, 1, 0.5]);
  
  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < analyses.length - 1) {
      setDirection('up');
      setCurrentIndex(prev => prev + 1);
      
      // Load more when near the end
      if (currentIndex >= analyses.length - 3 && hasMore && onLoadMore) {
        onLoadMore();
      }
    }
  }, [currentIndex, analyses.length, hasMore, onLoadMore]);
  
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('down');
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);
  
  // Handle swipe gestures
  const handleDragEnd = useCallback((
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50;
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    if (offset < -threshold || velocity < -500) {
      goToNext();
    } else if (offset > threshold || velocity > 500) {
      goToPrev();
    }
  }, [goToNext, goToPrev]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrev();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);
  
  // Animation variants
  const variants = {
    enter: (dir: 'up' | 'down') => ({
      y: dir === 'up' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: 'up' | 'down') => ({
      y: dir === 'up' ? '-100%' : '100%',
      opacity: 0,
    }),
  };
  
  const currentAnalysis = analyses[currentIndex];
  
  if (loading && analyses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <ShimmerSpinner size={48} color="blue" />
      </div>
    );
  }
  
  if (!loading && analyses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col items-center justify-center gap-4"
      >
        <div className="text-6xl opacity-30">📊</div>
        <p className="text-neutral-500 text-center">No analyses found</p>
      </motion.div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden touch-none"
    >
      {/* Navigation hint - top */}
      {currentIndex > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={goToPrev}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
      
      {/* Main content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ y, opacity }}
          className="absolute inset-0 flex items-center justify-center p-4"
        >
          {currentAnalysis && (
            <div className="w-full max-w-md mx-auto">
              <FeedCard
                analysis={currentAnalysis}
                onOpenAnalysis={onOpenAnalysis}
                onReaction={onReaction}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation hint - bottom */}
      {currentIndex < analyses.length - 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={goToNext}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      )}
      
      {/* Progress indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {analyses.slice(
          Math.max(0, currentIndex - 2),
          Math.min(analyses.length, currentIndex + 3)
        ).map((_, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex;
          return (
            <motion.div
              key={actualIndex}
              initial={false}
              animate={{
                width: actualIndex === currentIndex ? 4 : 2,
                height: actualIndex === currentIndex ? 24 : 8,
                opacity: actualIndex === currentIndex ? 1 : 0.4,
              }}
              className="rounded-full bg-white"
            />
          );
        })}
      </div>
      
      {/* Loading indicator for more content */}
      {loading && analyses.length > 0 && currentIndex >= analyses.length - 2 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
          <ShimmerSpinner size={24} color="blue" />
        </div>
      )}
      
      {/* Counter */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
        {currentIndex + 1} / {analyses.length}
      </div>
    </div>
  );
});

FeedSwiper.displayName = 'FeedSwiper';

export default FeedSwiper;
