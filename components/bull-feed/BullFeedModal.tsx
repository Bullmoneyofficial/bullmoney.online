"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { 
  X, 
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Smartphone,
  RefreshCw,
  User,
  LogIn
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder, ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useBullFeedModalUI, useAuthModalUI, usePostComposerModalUI, useAnalysisModalUI } from '@/contexts/UIStateContext';
import { createSupabaseClient } from '@/lib/supabase';
import { FeedGrid } from './FeedGrid';
import { FeedSwiper } from './FeedSwiper';
import { FeedFilters, MarketFilter, type FeedTab } from './FeedFilters';
import { useFeedStore } from '@/stores/feedStore';
import { useUserStore } from '@/stores/userStore';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { calculateHotScore, calculateBullScore, sortByHot, sortByTopRated, filterSmartMoney, sortByFresh } from '@/lib/bullAlgo';
import type { Analysis, ReactionType, MarketType, ContentType } from '@/types/feed';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within BullFeedModal');
  return context;
};

// Main Modal Component
export const BullFeedModal = memo(() => {
  const { isOpen, setIsOpen } = useBullFeedModalUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  // Only render the modal content when open - NO TRIGGER
  // The trigger should be placed in the navbar/dock where needed
  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {createPortal(
        <AnimatePresence>
          {isOpen && <BullFeedContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
BullFeedModal.displayName = 'BullFeedModal';

// Trigger Button
const BullFeedTrigger = memo(() => {
  const { setIsOpen } = useModalState();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-[100]"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="Open Bull Feed"
    />
  );
});
BullFeedTrigger.displayName = 'BullFeedTrigger';

// Main Content
const BullFeedContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  const { setIsOpen: setPostComposerOpen } = usePostComposerModalUI();
  const { setIsOpen: setAnalysisModalOpen } = useAnalysisModalUI();
  const { isMobile: isMobileDevice, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  
  // Zustand stores
  const { 
    analyses, 
    setAnalyses, 
    filter,
    setFilter,
    contentType,
    setContentType,
    ticker,
    setTicker,
    isLoading,
    setLoading 
  } = useFeedStore();
  
  const { user } = useUserStore();
  const { isAuthenticated, recruit } = useRecruitAuth();
  
  // Local state for search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMarkets, setActiveMarkets] = useState<string[]>(['forex', 'crypto', 'stocks', 'indices']);
  const [viewMode, setViewMode] = useState<'grid' | 'swiper'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Toggle market filter
  const toggleMarket = useCallback((market: string) => {
    setActiveMarkets(prev => 
      prev.includes(market) 
        ? prev.filter(m => m !== market)
        : [...prev, market]
    );
  }, []);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('swiper');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          author:user_profiles(*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching analyses:', error);
      } else {
        // Transform and enrich data
        const enriched = (data || []).map((item: any) => ({
          ...item,
          attachments: item.attachments || [],
          tickers: item.tickers || [],
          confidence_score: item.confidence_score || 5,
          content_type: item.content_type || 'deep_dive',
          bull_score: item.bull_score || calculateBullScore(
            item.view_count || 0,
            { bull: 0, bear: 0, save: 0 },
            0,
            0
          ),
          view_count: item.view_count || 0,
          reaction_counts: {
            bull: 0,
            bear: 0,
            save: 0,
          },
          comment_count: 0,
        }));
        setAnalyses(enriched);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }, [setAnalyses, setLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort analyses based on active tab and filters
  const filteredAnalyses = useMemo(() => {
    let filtered = [...analyses];
    
    // Filter by market
    if (activeMarkets.length > 0 && !activeMarkets.includes('all')) {
      filtered = filtered.filter(a => activeMarkets.includes(a.market));
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.pair.toLowerCase().includes(query) ||
        a.tickers?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Sort by filter (Hot/Top/Smart Money/Fresh)
    switch (filter) {
      case 'hot':
        return sortByHot(filtered);
      case 'top':
        return sortByTopRated(filtered);
      case 'smart_money':
        return filterSmartMoney(filtered);
      case 'fresh':
      default:
        return sortByFresh(filtered);
    }
  }, [analyses, filter, activeMarkets, searchQuery]);

  // Handle opening individual analysis
  const handleOpenAnalysis = useCallback((analysis: Analysis) => {
    SoundEffects.click();
    // For now, log it. Later, open the EnhancedAnalysisModal with this analysis
    console.log('Open analysis:', analysis.id);
    setIsOpen(false);
    setAnalysisModalOpen(true);
  }, [setIsOpen, setAnalysisModalOpen]);

  // Handle reaction
  const handleReaction = useCallback(async (analysisId: string, type: ReactionType) => {
    if (!isAuthenticated) {
      setIsOpen(false);
      setAuthModalOpen(true);
      return;
    }
    
    // TODO: Save reaction to Supabase
    console.log('React:', analysisId, type);
  }, [isAuthenticated, setIsOpen, setAuthModalOpen]);

  // Handle create post
  const handleCreatePost = useCallback(() => {
    SoundEffects.click();
    if (!isAuthenticated) {
      setIsOpen(false);
      setAuthModalOpen(true);
      return;
    }
    setIsOpen(false);
    setPostComposerOpen(true);
  }, [isAuthenticated, setIsOpen, setAuthModalOpen, setPostComposerOpen]);

  // Handle auth
  const handleAuth = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
    setAuthModalOpen(true);
  }, [setIsOpen, setAuthModalOpen]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className={`fixed inset-0 z-[2147483647] bg-black/80 backdrop-blur-xl`}
    >
      {/* Click overlay - transparent, just for click handling */}
      <div className="absolute inset-0 bg-transparent" onClick={handleClose} />
      
      {/* Modal */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[100vw] h-[100dvh] max-w-[100vw] max-h-[100dvh] overflow-hidden"
      >
        {/* Shimmer Border - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
            <ShimmerBorder color="blue" intensity="low" />
          </div>
        )}
        
        {/* Inner Container */}
        <div className="relative z-10 h-full bg-linear-to-b from-neutral-900 to-black border border-white/30 overflow-hidden flex flex-col">
          {!shouldSkipHeavyEffects && <ShimmerLine color="blue" />}
          
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-neutral-800">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🐂</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Bull Feed</h2>
                  <p className="text-xs text-white/70">Community trading insights</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Create Post Button */}
                <motion.button
                  whileHover={isMobileDevice ? {} : { scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePost}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Post
                </motion.button>
                
                {/* Auth Button */}
                {!isAuthenticated ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAuth}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-xl font-medium text-sm hover:bg-neutral-700"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2">
                    {recruit?.image_url ? (
                      <img 
                        src={recruit.image_url} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm text-neutral-300 truncate max-w-[120px]">
                      {recruit?.social_handle || recruit?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                )}
                
                {/* View Mode Toggle (desktop only) */}
                {!isMobile && (
                  <div className="hidden md:flex items-center bg-neutral-800 rounded-xl p-1">
                    <button
                      onClick={() => { SoundEffects.click(); setViewMode('grid'); }}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-black' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { SoundEffects.click(); setViewMode('swiper'); }}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'swiper' 
                          ? 'bg-white text-black' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95, rotate: 180 }}
                  onClick={() => { SoundEffects.click(); fetchData(); }}
                  disabled={isLoading}
                  className="p-2 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </motion.button>
                
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="p-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search analyses, pairs, $tickers..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { SoundEffects.click(); setShowFilters(!showFilters); }}
                className={`p-2.5 rounded-xl transition-colors ${
                  showFilters 
                    ? 'bg-white text-black' 
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Filter className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* Tab Filters */}
            <FeedFilters 
              activeTab={filter}
              onTabChange={setFilter}
            />
            
            {/* Market Filters (expandable) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <p className="text-xs text-neutral-500 mb-2">Markets</p>
                    <MarketFilter 
                      activeMarkets={activeMarkets}
                      onMarketToggle={toggleMarket}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' || !isMobile ? (
              <FeedGrid
                analyses={filteredAnalyses}
                loading={isLoading}
                onOpenAnalysis={handleOpenAnalysis}
                onReaction={handleReaction}
                currentUserId={user?.id}
                emptyMessage={
                  searchQuery 
                    ? "No analyses match your search" 
                    : "No analyses yet. Be the first to post!"
                }
              />
            ) : (
              <FeedSwiper
                analyses={filteredAnalyses}
                loading={isLoading}
                onOpenAnalysis={handleOpenAnalysis}
                onReaction={handleReaction}
                currentUserId={user?.id}
              />
            )}
          </div>
          
          {/* Mobile Create Button */}
          {isMobile && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCreatePost}
              className="absolute bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-lg shadow-white/30 flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
BullFeedContent.displayName = 'BullFeedContent';

export default BullFeedModal;
