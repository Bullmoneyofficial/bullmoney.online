"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Flame, TrendingUp, Clock, Trophy } from 'lucide-react';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { FeedGrid } from '@/components/bull-feed/FeedGrid';
import { createSupabaseClient } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useAuthModalUI } from '@/contexts/UIStateContext';
import { calculateHotScore, sortByHot, sortByTopRated, sortByFresh } from '@/lib/bullAlgo';
import type { Analysis, ReactionType, MarketType } from '@/types/feed';

type FeedTab = 'hot' | 'top' | 'fresh';
type MarketFilter = 'all' | MarketType;

interface FeedInlineProps {
  inModal?: boolean;
}

export const FeedInline = memo(({ inModal = true }: FeedInlineProps) => {
  const { user } = useUserStore();
  const { isAuthenticated } = useRecruitAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('hot');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      let query = supabase
        .from('analyses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Apply market filter
      if (marketFilter !== 'all') {
        query = query.eq('market', marketFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching feed:', error);
        return;
      }
      
      // Transform and add calculated scores
      let transformed = (data || []).map((item: any) => {
        const reactionCounts = item.reaction_counts || { bull: 0, bear: 0, save: 0 };
        const commentCount = item.comment_count || 0;
        const createdAt = item.created_at;
        
        return {
          ...item,
          attachments: item.attachments || [],
          tickers: item.tickers || [],
          confidence_score: item.confidence_score || 5,
          content_type: item.content_type || 'quick_take',
          bull_score: item.bull_score || 0,
          view_count: item.view_count || 0,
          reaction_counts: reactionCounts,
          comment_count: commentCount,
          hot_score: calculateHotScore(reactionCounts, commentCount, createdAt),
        };
      });
      
      // Apply sorting based on tab
      switch (activeTab) {
        case 'hot':
          transformed = sortByHot(transformed);
          break;
        case 'top':
          transformed = sortByTopRated(transformed);
          break;
        case 'fresh':
          transformed = sortByFresh(transformed);
          break;
      }
      
      // Apply search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        transformed = transformed.filter((a: Analysis) => 
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.pair.toLowerCase().includes(q) ||
          a.tickers?.some(t => t.toLowerCase().includes(q))
        );
      }
      
      setAnalyses(transformed);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }, [marketFilter, activeTab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle opening an analysis
  const handleOpenAnalysis = useCallback((analysis: Analysis) => {
    SoundEffects.click();
    // For now, just log - could expand to detailed view
    console.log('Opening analysis:', analysis.id);
  }, []);

  // Handle reaction
  const handleReaction = useCallback(async (analysisId: string, type: ReactionType) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    SoundEffects.click();
  }, [isAuthenticated, setAuthModalOpen]);

  const tabs = [
    { id: 'hot' as FeedTab, label: 'Hot', icon: <Flame className="w-4 h-4" /> },
    { id: 'top' as FeedTab, label: 'Top', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'fresh' as FeedTab, label: 'Fresh', icon: <Clock className="w-4 h-4" /> },
  ];

  const markets = [
    { id: 'all' as MarketFilter, label: 'All' },
    { id: 'forex' as MarketFilter, label: 'Forex' },
    { id: 'crypto' as MarketFilter, label: 'Crypto' },
    { id: 'stocks' as MarketFilter, label: 'Stocks' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filters Bar */}
      <div className="flex-shrink-0 p-3 border-b border-blue-500/20 bg-neutral-900/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Filters */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { SoundEffects.click(); setActiveTab(tab.id); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-neutral-700" />
          
          {/* Market Filters */}
          <div className="flex items-center gap-1">
            {markets.map((market) => (
              <motion.button
                key={market.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { SoundEffects.click(); setMarketFilter(market.id); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  marketFilter === market.id 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                    : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800'
                }`}
              >
                {market.label}
              </motion.button>
            ))}
          </div>
          
          {/* Search & Refresh */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-[120px] sm:w-[180px] pl-8 pr-3 py-1.5 bg-black/50 border border-blue-500/30 rounded-lg text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { SoundEffects.click(); fetchData(); }}
              disabled={loading}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <FeedGrid
          analyses={analyses}
          loading={loading}
          onOpenAnalysis={handleOpenAnalysis}
          onReaction={handleReaction}
          currentUserId={user?.id}
          emptyMessage={searchQuery ? "No results found" : "No analyses yet. Be the first to post!"}
        />
      </div>
    </div>
  );
});

FeedInline.displayName = 'FeedInline';

export default FeedInline;
