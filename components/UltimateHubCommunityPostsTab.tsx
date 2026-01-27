"use client";

/**
 * UltimateHubCommunityPostsTab - User-Generated Trade Posts
 * 
 * Displays community trade posts from the analyses table
 * Features:
 * - User-generated trade analysis feed
 * - Create new posts with PostComposer
 * - Trade screenshots and charts
 * - Mobile-optimized sizing and scrolling
 * - Filtering and sorting options
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ThumbsUp,
  MessageSquare,
  Share2,
  Loader2,
  Filter,
  ChevronDown,
  Eye,
  Award,
  Target,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { createSupabaseClient } from '@/lib/supabase';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { usePostComposerModalUI } from '@/contexts/UIStateContext';

// Types
type MarketType = 'forex' | 'crypto' | 'stocks' | 'indices';
type Direction = 'bullish' | 'bearish' | 'neutral';
type ContentType = 'quick_take' | 'deep_dive' | 'market_update' | 'market_pulse' | 'blog_post';

interface Analysis {
  id: string;
  author_id: string;
  title: string;
  content: string;
  market: MarketType;
  direction: Direction;
  pair: string;
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
  confidence_score: number;
  content_type: ContentType;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_pro_only: boolean;
  bull_score: number;
  view_count: number;
  comment_count: number;
  reaction_counts?: {
    bull: number;
    bear: number;
    save: number;
  };
  profiles?: {
    username: string;
    avatar_url?: string;
    rank?: string;
  };
}

// Format date helper
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Market colors
const marketColors: Record<MarketType, string> = {
  forex: 'from-green-500 to-emerald-600',
  crypto: 'from-orange-500 to-amber-600',
  stocks: 'from-blue-500 to-cyan-600',
  indices: 'from-purple-500 to-violet-600',
};

// Direction colors
const directionColors: Record<Direction, string> = {
  bullish: 'text-green-400',
  bearish: 'text-red-400',
  neutral: 'text-blue-400',
};

export const UltimateHubCommunityPostsTab = memo(() => {
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  const { setIsOpen: setPostComposerOpen } = usePostComposerModalUI();
  
  const [posts, setPosts] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch community posts from analyses table
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const supabase = createSupabaseClient();
        let query = supabase
          .from('analyses')
          .select(`
            *,
            profiles:author_id (
              username,
              avatar_url,
              rank
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(50);

        // Apply filter
        if (filter !== 'all') {
          query = query.eq('direction', filter);
        }

        const { data, error } = await query;

        if (!error && data) {
          setPosts(data as Analysis[]);
        }
      } catch (err) {
        console.error('[CommunityPosts] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [filter]);

  const handleCreatePost = useCallback(() => {
    SoundEffects.click();
    setPostComposerOpen(true);
  }, [setPostComposerOpen]);

  const handleLike = useCallback(async (postId: string) => {
    SoundEffects.click();
    // Update reaction count
    const supabase = createSupabaseClient();
    const { data: post } = await supabase
      .from('analyses')
      .select('reaction_counts')
      .eq('id', postId)
      .single();
    
    if (post) {
      const counts = post.reaction_counts || { bull: 0, bear: 0, save: 0 };
      await supabase
        .from('analyses')
        .update({ reaction_counts: { ...counts, bull: counts.bull + 1 } })
        .eq('id', postId);
    }
  }, []);

  const handleShare = useCallback((post: Analysis) => {
    SoundEffects.click();
    navigator.clipboard.writeText(window.location.href + `?analysis=${post.id}`);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <ShimmerSpinner size={48} color="blue" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 sm:p-3 border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
            <h2 className="text-xs sm:text-sm font-bold text-blue-300" style={{ textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>
              Community Trades
            </h2>
            <span className="text-[8px] sm:text-[9px] text-blue-400/60">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Create Post Button */}
            <motion.button
              onClick={handleCreatePost}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40"
              title="Create new post"
            >
              <Plus className="w-3 h-3 text-green-400" />
              <span className="text-[9px] font-semibold text-green-300 hidden sm:inline">New Post</span>
            </motion.button>
            
            {/* Filter Button */}
            <div className="relative">
              <motion.button
                onClick={() => { SoundEffects.click(); setShowFilterMenu(p => !p); }}
                whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40"
              >
                <Filter className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-semibold text-blue-300 capitalize">{filter}</span>
                <ChevronDown className={`w-3 h-3 text-blue-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-32 p-1 rounded-lg bg-zinc-900 border border-blue-500/30 z-50"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                  >
                    {(['all', 'bullish', 'bearish', 'neutral'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          SoundEffects.click();
                          setFilter(option);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[9px] font-semibold transition-colors ${
                          filter === option
                            ? 'bg-blue-500/30 text-blue-200'
                            : 'text-zinc-300 hover:bg-blue-500/20 hover:text-blue-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-500">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => {
            const username = post.profiles?.username || 'Anonymous';
            const avatar_url = post.profiles?.avatar_url;
            const user_rank = post.profiles?.rank;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 sm:p-3 rounded-lg bg-zinc-900/50 border border-blue-500/20"
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                {/* User Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {avatar_url ? (
                      <img src={avatar_url} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">{username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-white truncate">{username}</span>
                      {user_rank && (
                        <Award className="w-3 h-3 text-yellow-400" />
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-500">{formatDate(post.created_at)}</span>
                  </div>
                  
                  {/* Market Badge */}
                  <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${marketColors[post.market]} text-[8px] font-bold uppercase text-white`}>
                    {post.market}
                  </span>
                </div>

                {/* Trade Info */}
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-white mb-1">{post.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-300">{post.pair}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${directionColors[post.direction]}`}>
                      {post.direction === 'bullish' && <TrendingUp className="w-2.5 h-2.5" />}
                      {post.direction === 'bearish' && <TrendingDown className="w-2.5 h-2.5" />}
                      {post.direction === 'neutral' && <Minus className="w-2.5 h-2.5" />}
                      {post.direction.toUpperCase()}
                    </span>
                  </div>
                  
                  {post.content && (
                    <p className="text-xs text-zinc-300 mb-2 line-clamp-3">{post.content}</p>
                  )}

                  {/* Price Levels */}
                  {(post.entry_price || post.target_price || post.stop_loss) && (
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {post.entry_price && (
                        <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30">
                          <div className="text-[8px] text-blue-400/70 uppercase">Entry</div>
                          <div className="text-[10px] font-bold text-white">{post.entry_price}</div>
                        </div>
                      )}
                      {post.target_price && (
                        <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30">
                          <div className="text-[8px] text-green-400/70 uppercase">Target</div>
                          <div className="text-[10px] font-bold text-white">{post.target_price}</div>
                        </div>
                      )}
                      {post.stop_loss && (
                        <div className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                          <div className="text-[8px] text-red-400/70 uppercase">SL</div>
                          <div className="text-[10px] font-bold text-white">{post.stop_loss}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="px-2 py-1 rounded bg-zinc-800/50 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-zinc-400 uppercase">Confidence</span>
                      <span className="text-xs font-bold text-blue-300">{post.confidence_score}/10</span>
                    </div>
                  </div>
                </div>

                {/* Image Attachment */}
                {post.image_url && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-blue-500/20">
                    <img
                      src={post.image_url}
                      alt="Trade screenshot"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Engagement Footer */}
                <div className="flex items-center gap-3 pt-2 border-t border-blue-500/10">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-green-400 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[9px] font-semibold">{post.reaction_counts?.bull || 0}</span>
                  </button>
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-[9px] font-semibold">{post.reaction_counts?.bear || 0}</span>
                  </button>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[9px] font-semibold">{post.comment_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Eye className="w-3 h-3" />
                    <span className="text-[9px] font-semibold">{post.view_count || 0}</span>
                  </div>
                  <button
                    onClick={() => handleShare(post)}
                    className="ml-auto flex items-center gap-1 text-zinc-400 hover:text-blue-400 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
});

UltimateHubCommunityPostsTab.displayName = 'UltimateHubCommunityPostsTab';
