'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ChevronDown } from 'lucide-react';
import type { ReviewWithUser } from '@/types/store';

// ============================================================================
// PRODUCT REVIEWS SECTION
// ============================================================================

interface RatingStats {
  average: number;
  count: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

interface ProductReviewsProps {
  productId: string;
  reviews: ReviewWithUser[];
  ratingStats?: RatingStats;
}

export function ProductReviews({ productId, reviews, ratingStats }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'helpful' | 'highest' | 'lowest'>('newest');
  const [showAll, setShowAll] = useState(false);

  if (!reviews || reviews.length === 0) {
    return (
      <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-16 border-t border-white/10">
        <h2 className="text-2xl font-light mb-6">Reviews</h2>
        <div className="text-center py-12 bg-white/5 rounded-2xl">
          <p className="text-white/60 mb-4">No reviews yet</p>
          <p className="text-white/40 text-sm">Be the first to review this product</p>
        </div>
      </section>
    );
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpful_count - a.helpful_count;
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 4);

  return (
    <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-16 border-t border-white/10">
      <div className="grid lg:grid-cols-[300px_1fr] gap-12">
        {/* Rating Summary */}
        {ratingStats && (
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            <h2 className="text-2xl font-light">Reviews</h2>
            
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-light">{ratingStats.average.toFixed(1)}</span>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(ratingStats.average) ? 'fill-white text-white' : 'text-white/20'}`}
                    />
                  ))}
                </div>
                <p className="text-white/40 text-sm mt-1">
                  {ratingStats.count} {ratingStats.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingStats.distribution[rating.toString() as keyof typeof ratingStats.distribution];
                const percentage = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-white/60 w-3">{rating}</span>
                    <Star className="w-3 h-3 text-white/40" />
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-white/40 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <h3 className="lg:hidden text-xl font-light">Reviews ({reviews.length})</h3>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-10 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm
                         appearance-none cursor-pointer focus:outline-none focus:border-white/20"
              >
                <option value="newest" className="bg-black">Most Recent</option>
                <option value="helpful" className="bg-black">Most Helpful</option>
                <option value="highest" className="bg-black">Highest Rated</option>
                <option value="lowest" className="bg-black">Lowest Rated</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-6">
            {displayedReviews.map((review, index) => (
              <motion.article
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white/5 rounded-2xl border border-white/10"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'fill-white text-white' : 'text-white/20'}`}
                        />
                      ))}
                    </div>
                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}
                  </div>
                  
                  {review.is_verified_purchase && (
                    <span className="px-2 py-1 bg-white/10 rounded-md text-xs text-white/60">
                      Verified
                    </span>
                  )}
                </div>

                {review.content && (
                  <p className="text-white/70 leading-relaxed mb-4">
                    {review.content}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-white/40">
                    <span>{review.user?.full_name || 'Anonymous'}</span>
                    <span>·</span>
                    <span>
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful_count}</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Show More Button */}
          {reviews.length > 4 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-4 text-white/60 hover:text-white transition-colors"
            >
              Show all {reviews.length} reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
