"use client";

/**
 * UltimateHubCommunityPostsTab - Bull Feed powered community posts
 * Uses bull-feed components for layout + comments components for threads
 */

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, X, Flame, TrendingUp, Trophy, Clock, Sparkles, BarChart3, Newspaper, LineChart, Filter, ChevronDown } from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { createSupabaseClient } from '@/lib/supabase';
import { usePostComposerModalUI, useAuthModalUI } from '@/contexts/UIStateContext';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useUserStore } from '@/stores/userStore';
import {
  FeedGrid,
  type FeedTab,
} from '@/components/bull-feed';
import { CommentThread } from '@/components/comments';
import {
  calculateBullScore,
  sortByHot,
  sortByTopRated,
  sortByFresh,
  filterSmartMoney,
} from '@/lib/bullAlgo';
import type { Analysis, ReactionType, ContentType } from '@/types/feed';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

export const UltimateHubCommunityPostsTab = memo(() => {
  const { setIsOpen: setPostComposerOpen } = usePostComposerModalUI();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  const { isAuthenticated } = useRecruitAuth();
  const { user } = useUserStore();
  const { shouldSkipHeavyEffects, isMobile } = useMobilePerformance();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('fresh');
  const [activeMarkets, setActiveMarkets] = useState<string[]>(['all']);
  const [activeTypes, setActiveTypes] = useState<string[]>(['all']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [headerCollapsed, setHeaderCollapsed] = useState(isMobile);
  const [showSearchBar, setShowSearchBar] = useState(!isMobile);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();

      let query = supabase
        .from('analyses')
        .select(`
          *,
          author:user_profiles(*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(isMobile ? 24 : 50);

      if (!activeMarkets.includes('all') && activeMarkets.length > 0) {
        query = query.in('market', activeMarkets);
      }

      if (!activeTypes.includes('all') && activeTypes.length > 0) {
        query = query.in('content_type', activeTypes as ContentType[]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CommunityPosts] Failed to load:', error);
        return;
      }

      const enriched = (data || []).map((item: any) => {
        const reactionCounts = item.reaction_counts || { bull: 0, bear: 0, save: 0 };
        const commentCount = item.comment_count || 0;
        const viewCount = item.view_count || 0;
        const bullScore = item.bull_score || calculateBullScore(viewCount, reactionCounts, commentCount);

        return {
          ...item,
          attachments: item.attachments || [],
          tickers: item.tickers || [],
          confidence_score: item.confidence_score || 5,
          content_type: item.content_type || 'quick_take',
          bull_score: bullScore,
          view_count: viewCount,
          reaction_counts: reactionCounts,
          comment_count: commentCount,
          author: item.author || null,
        } as Analysis;
      });

      setAnalyses(enriched);
    } catch (err) {
      console.error('[CommunityPosts] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMarkets, activeTypes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setShowFilters(!isMobile);
    setHeaderCollapsed(isMobile);
  }, [isMobile]);

  const filteredAnalyses = useMemo(() => {
    let list = analyses;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.pair.toLowerCase().includes(q) ||
        (a.tickers || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    switch (activeTab) {
      case 'hot':
        return sortByHot(list);
      case 'top':
        return sortByTopRated(list);
      case 'smart_money':
        return sortByTopRated(filterSmartMoney(list));
      case 'fresh':
      default:
        return sortByFresh(list);
    }
  }, [analyses, activeTab, searchQuery]);

  const handleOpenAnalysis = useCallback((analysis: Analysis) => {
    SoundEffects.click();
    setSelectedAnalysis(analysis);
  }, []);

  const handleReaction = useCallback(async (analysisId: string, type: ReactionType) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    SoundEffects.click();

    setAnalyses((prev) =>
      prev.map((analysis) => {
        if (analysis.id !== analysisId) return analysis;
        const counts = analysis.reaction_counts || { bull: 0, bear: 0, save: 0 };
        const updated = { ...counts, [type]: (counts[type] ?? 0) + 1 };
        return {
          ...analysis,
          reaction_counts: updated,
        };
      })
    );

    try {
      const supabase = createSupabaseClient();
      const target = analyses.find((a) => a.id === analysisId);
      const counts = target?.reaction_counts || { bull: 0, bear: 0, save: 0 };
      const updated = { ...counts, [type]: (counts[type] ?? 0) + 1 };
      await supabase
        .from('analyses')
        .update({ reaction_counts: updated })
        .eq('id', analysisId);
    } catch (error) {
      console.error('[CommunityPosts] Failed to react:', error);
    }
  }, [isAuthenticated, setAuthModalOpen, analyses]);

  const handleCreatePost = useCallback(() => {
    SoundEffects.click();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setPostComposerOpen(true);
  }, [isAuthenticated, setAuthModalOpen, setPostComposerOpen]);

  const toggleMarket = useCallback((marketId: string) => {
    setActiveMarkets((prev) => {
      if (marketId === 'all') return ['all'];
      const next = prev.includes(marketId)
        ? prev.filter((m) => m !== marketId)
        : [...prev.filter((m) => m !== 'all'), marketId];
      return next.length === 0 ? ['all'] : next;
    });
  }, []);

  const toggleType = useCallback((typeId: string) => {
    setActiveTypes((prev) => {
      if (typeId === 'all') return ['all'];
      const next = prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev.filter((t) => t !== 'all'), typeId];
      return next.length === 0 ? ['all'] : next;
    });
  }, []);

  const tabOptions = useMemo(() => ([
    { id: 'hot' as FeedTab, label: 'Hot', icon: Flame },
    { id: 'top' as FeedTab, label: 'Top', icon: TrendingUp },
    { id: 'smart_money' as FeedTab, label: 'Smart', icon: Trophy },
    { id: 'fresh' as FeedTab, label: 'Fresh', icon: Clock },
  ]), []);

  const contentTypeOptions = useMemo(() => ([
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'deep_dive', label: 'Deep', icon: BarChart3 },
    { id: 'market_pulse', label: 'Pulse', icon: LineChart },
    { id: 'blog_post', label: 'Blog', icon: Newspaper },
  ]), []);

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Header - Ultra Compact */}
      <div className="shrink-0 bg-black/95 sticky top-0 z-10 border-b border-blue-500/20">
        {/* Single row header with everything inline */}
        <div className="px-2 py-1 flex items-center gap-2">
          {/* Title */}
          <span className="text-[9px] font-bold text-blue-300">Posts</span>
          <span className="text-[8px] text-blue-400/50">({filteredAnalyses.length})</span>
          
          {/* Search - inline on desktop, togglable on mobile */}
          <div className={`flex-1 min-w-0 ${showSearchBar ? '' : 'hidden md:block'}`}>
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-5 pr-2 py-0.5 bg-zinc-900/50 border border-zinc-700/50 rounded text-[9px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { SoundEffects.click(); setShowSearchBar(!showSearchBar); }}
              className={`md:hidden p-1 rounded ${showSearchBar ? 'text-blue-400' : 'text-zinc-500'}`}
              aria-label="Search"
            >
              <Search className="w-3 h-3" />
            </button>
            <button
              onClick={() => { SoundEffects.click(); setShowFilters((v) => !v); }}
              className={`p-1 rounded ${showFilters ? 'text-blue-400' : 'text-zinc-500'}`}
              aria-label="Filters"
            >
              <Filter className="w-3 h-3" />
            </button>
            <button
              onClick={handleCreatePost}
              className="p-1 rounded text-green-400"
              aria-label="New post"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Filters - Single scrollable row when open */}
        {showFilters && (
          <div className="px-2 pb-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 min-w-min">
              {/* Sort tabs */}
              {tabOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { SoundEffects.click(); setActiveTab(id); }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap ${
                    activeTab === id ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span>{label}</span>
                </button>
              ))}
              
              <span className="text-zinc-700 mx-0.5">|</span>
              
              {/* Content types */}
              {contentTypeOptions.map(({ id, label, icon: Icon }) => {
                const isActive = activeTypes.includes(id) || (id === 'all' && activeTypes.includes('all'));
                return (
                  <button
                    key={id}
                    onClick={() => { SoundEffects.click(); toggleType(id); }}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap ${
                      isActive ? 'bg-purple-500/70 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 sm:p-4">
          <FeedGrid
            analyses={filteredAnalyses}
            loading={loading}
            onOpenAnalysis={handleOpenAnalysis}
            onReaction={handleReaction}
            currentUserId={user?.id}
            emptyMessage={searchQuery ? 'No results found' : 'No posts yet. Be the first to post!'}
          />
        </div>
      </div>

      {/* Comments Panel - Mobile optimized */}
      {selectedAnalysis && (
        <div className={`shrink-0 border-t border-blue-500/20 bg-black/95 flex flex-col ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-sm'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 sm:py-2 border-b border-blue-500/10 shrink-0">
            <div className="text-sm sm:text-sm text-blue-300 truncate flex-1 min-w-0 font-medium">
              <span className="hidden sm:inline">Comments · </span>
              <span className="truncate">{selectedAnalysis.title}</span>
            </div>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="ml-2 p-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 shrink-0 transition-all active:scale-95"
              aria-label="Close comments"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Comments content */}
          <div className="flex-1 overflow-y-auto max-h-[45vh] sm:max-h-[40vh]">
            <CommentThread
              analysisId={selectedAnalysis.id}
              initialCommentCount={selectedAnalysis.comment_count || 0}
            />
          </div>
        </div>
      )}
    </div>
  );
});

UltimateHubCommunityPostsTab.displayName = 'UltimateHubCommunityPostsTab';

export default UltimateHubCommunityPostsTab;
