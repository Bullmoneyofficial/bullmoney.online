"use client";

import React, { memo, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedCard } from './FeedCard';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import type { Analysis, ReactionType } from '@/types/feed';

// Breakpoints for responsive masonry columns
const breakpointColumns = {
  default: 3,  // Desktop: 3 columns
  1280: 3,     // Large screens: 3 columns
  1024: 2,     // Medium screens: 2 columns  
  768: 2,      // Tablets: 2 columns
  640: 1,      // Mobile: 1 column
};

interface FeedGridProps {
  analyses: Analysis[];
  loading: boolean;
  onOpenAnalysis: (analysis: Analysis) => void;
  onReaction?: (analysisId: string, type: ReactionType) => void;
  currentUserId?: string;
  emptyMessage?: string;
}

export const FeedGrid = memo(({
  analyses,
  loading,
  onOpenAnalysis,
  onReaction,
  currentUserId,
  emptyMessage = "No analyses found",
}: FeedGridProps) => {
  
  // Skeleton loading cards
  const skeletonCards = useMemo(() => (
    Array.from({ length: 6 }).map((_, index) => (
      <SkeletonCard key={`skeleton-${index}`} />
    ))
  ), []);
  
  if (loading && analyses.length === 0) {
    return (
      <div className="w-full">
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {skeletonCards}
        </Masonry>
      </div>
    );
  }
  
  if (!loading && analyses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <div className="text-6xl opacity-30">📊</div>
        <p className="text-neutral-500 text-center">{emptyMessage}</p>
      </motion.div>
    );
  }
  
  return (
    <div className="w-full">
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        <AnimatePresence mode="popLayout">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="mb-4">
              <FeedCard
                analysis={analysis}
                onOpenAnalysis={onOpenAnalysis}
                onReaction={onReaction}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </AnimatePresence>
        
        {/* Loading indicator at the end */}
        {loading && analyses.length > 0 && (
          <div className="mb-4 flex items-center justify-center py-8">
            <ShimmerSpinner size={32} color="blue" />
          </div>
        )}
      </Masonry>
    </div>
  );
});

FeedGrid.displayName = 'FeedGrid';

// Skeleton Card for loading state
const SkeletonCard = memo(() => {
  return (
    <div className="mb-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/50 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-neutral-800" />
      
      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neutral-700" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-neutral-700 rounded w-24" />
            <div className="h-2 bg-neutral-800 rounded w-16" />
          </div>
        </div>
        
        {/* Title */}
        <div className="h-4 bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-700 rounded w-3/4" />
        
        {/* Content preview */}
        <div className="h-3 bg-neutral-800 rounded w-full" />
        <div className="h-3 bg-neutral-800 rounded w-5/6" />
        
        {/* Engagement row */}
        <div className="flex items-center gap-4 pt-3 border-t border-neutral-800">
          <div className="h-4 bg-neutral-700 rounded w-12" />
          <div className="h-4 bg-neutral-700 rounded w-12" />
          <div className="h-4 bg-neutral-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export default FeedGrid;
