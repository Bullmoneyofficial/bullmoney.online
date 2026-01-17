"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Eye,
  Share2,
  Bell,
  Copy,
  ExternalLink,
  Rss,
  PenSquare,
  Users
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder, ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop } from '@/components/ShopContext';
import { createSupabaseClient } from '@/lib/supabase';
import { useAnalysisModalUI, UI_Z_INDEX } from '@/contexts/UIStateContext';
import { TradingViewWidget } from './TradingViewWidget';
import { ConfidenceMeter } from './ConfidenceMeter';
import { SentimentBadge } from './SentimentBadge';
import { AttachmentCarousel } from './AttachmentCarousel';
import type { Analysis, ReactionType, Attachment, ContentType, MarketType, Direction, ChartConfig } from '@/types/feed';

// Dynamically import other components to avoid circular dependencies
import dynamic from 'next/dynamic';

const FeedInlineDynamic = dynamic(
  () => import('./FeedInline').then(mod => ({ default: mod.FeedInline })),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-20"><ShimmerSpinner size={48} color="blue" /></div> }
);

const PostComposerInlineDynamic = dynamic(
  () => import('./PostComposerInline').then(mod => ({ default: mod.PostComposerInline })),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-20"><ShimmerSpinner size={48} color="blue" /></div> }
);

// Debug: Log when module loads
if (typeof window !== 'undefined') {
  console.log('[EnhancedAnalysisModal] Module loaded in browser');
}

// Tab types for the modal
type ModalTab = 'analysis' | 'feed' | 'compose';

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: ModalTab;
  setActiveTab: (tab: ModalTab) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within EnhancedAnalysisModal');
  return context;
};

// Helper to format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Market colors
const marketColors: Record<string, string> = {
  forex: 'bg-green-500',
  crypto: 'bg-orange-500',
  stocks: 'bg-blue-500',
  indices: 'bg-purple-500',
};

// Get TradingView symbol from analysis
const getChartSymbol = (analysis: Analysis): string => {
  if (analysis.chart_config?.symbol) {
    return analysis.chart_config.symbol;
  }
  // Fallback: convert pair to TradingView format
  const pair = analysis.pair.replace('/', '');
  if (analysis.market === 'crypto') {
    return `BINANCE:${pair}USDT`;
  }
  if (analysis.market === 'forex') {
    return `FX:${pair}`;
  }
  return pair;
};

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton = memo(({ active, onClick, icon, label }: TabButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
      active 
        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </motion.button>
));
TabButton.displayName = 'TabButton';

// Main Modal Component - Uses centralized UIStateContext for mutual exclusion
export const EnhancedAnalysisModal = memo(() => {
  // Use centralized UI state for mutual exclusion with other modals
  const { isOpen, setIsOpen } = useAnalysisModalUI();
  const [mounted, setMounted] = useState(false);

  // Debug: Log on every render
  console.log('[EnhancedAnalysisModal] Render - isOpen:', isOpen, 'mounted:', mounted);

  useEffect(() => {
    console.log('[EnhancedAnalysisModal] Component mounted');
    setMounted(true);
    
    // Debug: Add keyboard shortcut to test opening (Ctrl/Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        console.log('[EnhancedAnalysisModal] DEBUG: Keyboard shortcut triggered');
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('[EnhancedAnalysisModal] Component unmounting');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsOpen]);

  useEffect(() => {
    console.log('[EnhancedAnalysisModal] isOpen effect triggered:', isOpen);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('[EnhancedAnalysisModal] Modal OPENING - body overflow hidden');
    } else {
      document.body.style.overflow = '';
      console.log('[EnhancedAnalysisModal] Modal CLOSING - body overflow reset');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Always render when mounted - the AnimatePresence handles show/hide
  if (!mounted) {
    console.log('[EnhancedAnalysisModal] Not rendering - waiting for mount');
    return null;
  }

  console.log('[EnhancedAnalysisModal] Rendering portal with isOpen:', isOpen);

  // Portal to document.body - simplified like AuthModal
  return createPortal(
    <AnimatePresence>
      {isOpen && <EnhancedAnalysisContentWrapper onClose={() => setIsOpen(false)} />}
    </AnimatePresence>,
    document.body
  );
});
EnhancedAnalysisModal.displayName = 'EnhancedAnalysisModal';

// Wrapper that provides the close function and tab state
interface ContentWrapperProps {
  onClose: () => void;
}

const EnhancedAnalysisContentWrapper = memo(({ onClose }: ContentWrapperProps) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('analysis');
  
  return (
    <ModalContext.Provider value={{ 
      isOpen: true, 
      setIsOpen: (open) => !open && onClose(),
      activeTab,
      setActiveTab
    }}>
      <EnhancedAnalysisContent onClose={onClose} />
    </ModalContext.Provider>
  );
});
EnhancedAnalysisContentWrapper.displayName = 'EnhancedAnalysisContentWrapper';

// Trigger Button
const EnhancedAnalysisTrigger = memo(() => {
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
      aria-label="Open Enhanced Analysis"
    />
  );
});
EnhancedAnalysisTrigger.displayName = 'EnhancedAnalysisTrigger';

// Main Content
interface EnhancedAnalysisContentProps {
  onClose: () => void;
}

const EnhancedAnalysisContent = ({ onClose }: EnhancedAnalysisContentProps) => {
  console.log('[EnhancedAnalysisContent] Rendering content component');
  const { state } = useShop();
  const { isAdmin } = state;
  const { activeTab, setActiveTab } = useModalState();
  
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  
  // Form state for editing
  const [formData, setFormData] = useState<Partial<Analysis>>({
    title: '',
    content: '',
    market: 'forex',
    direction: 'neutral',
    pair: '',
    entry_price: undefined,
    target_price: undefined,
    stop_loss: undefined,
    confidence_score: 5,
    content_type: 'deep_dive',
    image_url: '',
    is_published: true,
    is_pro_only: false,
    attachments: [],
    tickers: [],
  });
  const [saving, setSaving] = useState(false);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      const query = supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Non-admins only see published
      if (!isAdmin) {
        query.eq('is_published', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching analyses:', error);
      } else {
        // Transform data to match our type
        const transformed = (data || []).map((item: any) => ({
          ...item,
          attachments: item.attachments || [],
          tickers: item.tickers || [],
          confidence_score: item.confidence_score || 5,
          content_type: item.content_type || 'deep_dive',
          bull_score: item.bull_score || 0,
          view_count: item.view_count || 0,
          reaction_counts: item.reaction_counts || { bull: 0, bear: 0, save: 0 },
          comment_count: item.comment_count || 0,
        }));
        setAnalyses(transformed);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current analysis
  const currentAnalysis = analyses[currentIndex] || null;

  // Navigation
  const goNext = useCallback(() => {
    SoundEffects.click();
    setCurrentIndex((prev) => (prev + 1) % analyses.length);
    setUserReaction(null);
  }, [analyses.length]);

  const goPrev = useCallback(() => {
    SoundEffects.click();
    setCurrentIndex((prev) => (prev - 1 + analyses.length) % analyses.length);
    setUserReaction(null);
  }, [analyses.length]);

  // Handle reaction
  const handleReaction = useCallback(async (type: ReactionType) => {
    if (userReaction === type) {
      setUserReaction(null);
      SoundEffects.click();
    } else {
      setUserReaction(type);
      SoundEffects.click();
    }
    // TODO: Save to Supabase when auth is connected
  }, [userReaction]);

  // Copy trade action
  const handleCopyTrade = useCallback(() => {
    SoundEffects.click();
    // TODO: Implement copy trade logic
    alert('Copy Trade feature coming soon!');
  }, []);

  // Share action
  const handleShare = useCallback(() => {
    if (currentAnalysis) {
      navigator.clipboard.writeText(window.location.href + `?analysis=${currentAnalysis.id}`);
      SoundEffects.click();
    }
  }, [currentAnalysis]);

  // Admin functions
  const startEdit = useCallback((analysis: Analysis | null) => {
    if (analysis) {
      setFormData({ ...analysis });
      setSelectedAnalysis(analysis);
    } else {
      setFormData({
        title: '',
        content: '',
        market: 'forex',
        direction: 'neutral',
        pair: '',
        entry_price: undefined,
        target_price: undefined,
        stop_loss: undefined,
        confidence_score: 5,
        content_type: 'deep_dive',
        image_url: '',
        is_published: true,
        is_pro_only: false,
        attachments: [],
        tickers: [],
      });
      setSelectedAnalysis(null);
    }
    setViewMode('edit');
  }, []);

  const saveAnalysis = useCallback(async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      
      if (selectedAnalysis?.id) {
        // Update existing
        const { error } = await supabase
          .from('analyses')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAnalysis.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('analyses')
          .insert({
            ...formData,
            created_at: new Date().toISOString(),
          });
        
        if (error) throw error;
      }
      
      setViewMode('view');
      fetchData();
    } catch (error) {
      console.error('Error saving analysis:', error);
    } finally {
      setSaving(false);
    }
  }, [formData, selectedAnalysis, fetchData]);

  const deleteAnalysis = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setViewMode('view');
      fetchData();
    } catch (error) {
      console.error('Error deleting analysis:', error);
    } finally {
      setSaving(false);
    }
  }, [fetchData]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    onClose();
  }, [onClose]);

  // Memoized chart symbol
  const chartSymbol = useMemo(() => {
    return currentAnalysis ? getChartSymbol(currentAnalysis) : 'BINANCE:BTCUSDT';
  }, [currentAnalysis]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4"
      style={{ 
        zIndex: 2147483647, // Maximum possible z-index - matches LiveStreamModal
        isolation: 'isolate',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop - covers everything */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-lg"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl"
        style={{ zIndex: 1 }}
      >
        {/* Shimmer Border */}
        <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
          <ShimmerBorder color="blue" intensity="medium" />
        </div>
        
        {/* Inner Container */}
        <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-blue-500/30 overflow-hidden max-h-[95vh] flex flex-col">
          <ShimmerLine color="blue" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-500/20 flex-shrink-0">
            <div className="flex items-center gap-3">
              {activeTab === 'analysis' && <BarChart3 className="w-6 h-6 text-blue-400" />}
              {activeTab === 'feed' && <Rss className="w-6 h-6 text-blue-400" />}
              {activeTab === 'compose' && <PenSquare className="w-6 h-6 text-blue-400" />}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {activeTab === 'analysis' && 'Trade Analysis'}
                  {activeTab === 'feed' && 'Bull Feed'}
                  {activeTab === 'compose' && 'Create Post'}
                </h2>
                <p className="text-xs text-blue-400/70">
                  {activeTab === 'analysis' && 'Pro-grade market insights'}
                  {activeTab === 'feed' && 'Community trading ideas'}
                  {activeTab === 'compose' && 'Share your analysis'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && viewMode === 'view' && activeTab === 'analysis' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); startEdit(null); }}
                  className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-2 border-b border-blue-500/20 flex-shrink-0 bg-neutral-900/50">
            <TabButton 
              active={activeTab === 'analysis'} 
              onClick={() => { SoundEffects.click(); setActiveTab('analysis'); }}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analysis"
            />
            <TabButton 
              active={activeTab === 'feed'} 
              onClick={() => { SoundEffects.click(); setActiveTab('feed'); }}
              icon={<Rss className="w-4 h-4" />}
              label="Feed"
            />
            <TabButton 
              active={activeTab === 'compose'} 
              onClick={() => { SoundEffects.click(); setActiveTab('compose'); }}
              icon={<PenSquare className="w-4 h-4" />}
              label="Create"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <ShimmerSpinner size={48} color="blue" />
                    </div>
                  ) : viewMode === 'edit' ? (
                    /* Edit Mode - Form */
                    <EditForm 
                      formData={formData}
                      setFormData={setFormData}
                      saving={saving}
                      selectedAnalysis={selectedAnalysis}
                      onSave={saveAnalysis}
                      onDelete={deleteAnalysis}
                      onCancel={() => { SoundEffects.click(); setViewMode('view'); }}
                    />
                  ) : analyses.length === 0 ? (
                    /* No analyses */
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <BarChart3 className="w-16 h-16 text-blue-400/30" />
                <p className="text-neutral-500">No analysis available yet</p>
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startEdit(null)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Analysis
                  </motion.button>
                )}
              </div>
            ) : currentAnalysis ? (
              /* View Mode - Analysis Display */
              <div className="flex flex-col">
                {/* Asset Header with Sentiment */}
                <div className="p-4 border-b border-blue-500/20 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase text-white ${marketColors[currentAnalysis.market] || 'bg-blue-500'}`}>
                      {currentAnalysis.market}
                    </span>
                    <span className="text-2xl font-bold text-white">{currentAnalysis.pair}</span>
                    {currentAnalysis.direction === 'bullish' && (
                      <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                        <TrendingUp className="w-5 h-5" />
                      </span>
                    )}
                    {currentAnalysis.direction === 'bearish' && (
                      <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
                        <TrendingDown className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <SentimentBadge 
                      direction={currentAnalysis.direction} 
                      size="md"
                    />
                    {isAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { SoundEffects.click(); startEdit(currentAnalysis); }}
                        className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
                
                {/* Chart Section */}
                {showChart && (
                  <div className="border-b border-blue-500/20">
                    <TradingViewWidget 
                      symbol={chartSymbol}
                      height={300}
                      theme="dark"
                      interval="D"
                    />
                  </div>
                )}
                
                {/* Confidence Meter */}
                <div className="p-4 border-b border-blue-500/20">
                  <ConfidenceMeter 
                    score={currentAnalysis.confidence_score || 5} 
                    showLabel 
                    size="lg"
                  />
                </div>
                
                {/* Price Targets */}
                {(currentAnalysis.entry_price || currentAnalysis.target_price || currentAnalysis.stop_loss) && (
                  <div className="p-4 border-b border-blue-500/20">
                    <div className="grid grid-cols-3 gap-3">
                      {currentAnalysis.entry_price && (
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                          <p className="text-xs text-neutral-500 uppercase mb-1">Entry</p>
                          <p className="text-xl font-bold text-blue-400">{currentAnalysis.entry_price}</p>
                        </div>
                      )}
                      {currentAnalysis.target_price && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                          <p className="text-xs text-neutral-500 uppercase mb-1">Target</p>
                          <p className="text-xl font-bold text-green-400">{currentAnalysis.target_price}</p>
                        </div>
                      )}
                      {currentAnalysis.stop_loss && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                          <p className="text-xs text-neutral-500 uppercase mb-1">Stop Loss</p>
                          <p className="text-xl font-bold text-red-400">{currentAnalysis.stop_loss}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Analysis Content */}
                <div className="p-4 border-b border-blue-500/20">
                  <h3 className="text-xl font-bold text-white mb-2">{currentAnalysis.title}</h3>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mb-4">
                    <Calendar className="w-3 h-3" />
                    {formatDate(currentAnalysis.created_at)}
                    <span className="mx-2">•</span>
                    <Eye className="w-3 h-3" />
                    {currentAnalysis.view_count || 0} views
                  </p>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {currentAnalysis.content}
                    </p>
                  </div>
                </div>
                
                {/* Attachments */}
                {currentAnalysis.attachments && currentAnalysis.attachments.length > 0 && (
                  <div className="p-4 border-b border-blue-500/20">
                    <AttachmentCarousel 
                      attachments={currentAnalysis.attachments}
                    />
                  </div>
                )}
                
                {/* Legacy single image support */}
                {currentAnalysis.image_url && !currentAnalysis.attachments?.length && (
                  <div className="p-4 border-b border-blue-500/20">
                    <div className="rounded-lg overflow-hidden border border-blue-500/20">
                      <img 
                        src={currentAnalysis.image_url} 
                        alt={currentAnalysis.title}
                        className="w-full h-auto max-h-[300px] object-contain bg-black"
                      />
                    </div>
                  </div>
                )}
                
                {/* Engagement Actions */}
                <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Bull React */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction('bull')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                        userReaction === 'bull' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      🐂 <span>{currentAnalysis.reaction_counts?.bull || 0}</span>
                    </motion.button>
                    
                    {/* Bear React */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction('bear')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                        userReaction === 'bear' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      🐻 <span>{currentAnalysis.reaction_counts?.bear || 0}</span>
                    </motion.button>
                    
                    {/* Comments */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 font-medium text-sm flex items-center gap-2 hover:bg-neutral-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{currentAnalysis.comment_count || 0}</span>
                    </motion.button>
                    
                    {/* Save */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction('save')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                        userReaction === 'save' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      }`}
                    >
                      🔖
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Share */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                    
                    {/* Copy Trade */}
                    {(currentAnalysis.entry_price || currentAnalysis.target_price) && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyTrade}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium text-sm flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Trade
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            
            {/* Navigation for Analysis */}
            {viewMode === 'view' && analyses.length > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-blue-500/20 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goPrev}
                  className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                
                <div className="flex items-center gap-2">
                  {analyses.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => { SoundEffects.click(); setCurrentIndex(index); }}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-blue-500' : 'bg-neutral-600 hover:bg-neutral-500'
                      }`}
                    />
                  ))}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goNext}
                  className="p-2.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}
                </motion.div>
              )}
              
              {/* Feed Tab Content */}
              {activeTab === 'feed' && (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-[400px]"
                >
                  <FeedInlineDynamic inModal={true} />
                </motion.div>
              )}
              
              {/* Compose Tab Content */}
              {activeTab === 'compose' && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-[400px]"
                >
                  <PostComposerInlineDynamic onSuccess={() => setActiveTab('feed')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Edit Form Component
interface EditFormProps {
  formData: Partial<Analysis>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Analysis>>>;
  saving: boolean;
  selectedAnalysis: Analysis | null;
  onSave: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const EditForm = memo(({ 
  formData, 
  setFormData, 
  saving, 
  selectedAnalysis, 
  onSave, 
  onDelete, 
  onCancel 
}: EditFormProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-neutral-400 mb-1">Title</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="Analysis title..."
          />
        </div>
        
        {/* Market */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Market</label>
          <select
            value={formData.market || 'forex'}
            onChange={(e) => setFormData({ ...formData, market: e.target.value as MarketType })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="indices">Indices</option>
          </select>
        </div>
        
        {/* Pair */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Pair/Symbol</label>
          <input
            type="text"
            value={formData.pair || ''}
            onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="EUR/USD, BTC, AAPL..."
          />
        </div>
        
        {/* Direction */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Direction</label>
          <select
            value={formData.direction || 'neutral'}
            onChange={(e) => setFormData({ ...formData, direction: e.target.value as Direction })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="bullish">🟢 Bullish (LONG)</option>
            <option value="bearish">🔴 Bearish (SHORT)</option>
            <option value="neutral">⚪ Neutral</option>
          </select>
        </div>
        
        {/* Content Type */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Content Type</label>
          <select
            value={formData.content_type || 'deep_dive'}
            onChange={(e) => setFormData({ ...formData, content_type: e.target.value as ContentType })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="deep_dive">📊 Deep Dive</option>
            <option value="market_pulse">⚡ Market Pulse</option>
            <option value="blog_post">📝 Blog Post</option>
          </select>
        </div>
        
        {/* Confidence Score */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-neutral-400 mb-2">Confidence Score</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.confidence_score || 5}
              onChange={(e) => setFormData({ ...formData, confidence_score: parseInt(e.target.value) })}
              className="flex-1 h-2 rounded-full appearance-none bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
            <span className="text-lg font-bold text-blue-400 w-8 text-center">{formData.confidence_score || 5}</span>
          </div>
        </div>
        
        {/* Entry Price */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Entry Price</label>
          <input
            type="number"
            step="any"
            value={formData.entry_price || ''}
            onChange={(e) => setFormData({ ...formData, entry_price: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="1.0850"
          />
        </div>
        
        {/* Target Price */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Target Price</label>
          <input
            type="number"
            step="any"
            value={formData.target_price || ''}
            onChange={(e) => setFormData({ ...formData, target_price: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="1.0950"
          />
        </div>
        
        {/* Stop Loss */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Stop Loss</label>
          <input
            type="number"
            step="any"
            value={formData.stop_loss || ''}
            onChange={(e) => setFormData({ ...formData, stop_loss: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="1.0800"
          />
        </div>
        
        {/* Image URL */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Image URL (optional)</label>
          <input
            type="text"
            value={formData.image_url || ''}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="https://..."
          />
        </div>
        
        {/* Content */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-neutral-400 mb-1">Analysis Content</label>
          <textarea
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Write your analysis here..."
          />
        </div>
        
        {/* Options */}
        <div className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published || false}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 rounded border-blue-500/30 bg-black/50 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-400">Publish immediately</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_pro_only || false}
              onChange={(e) => setFormData({ ...formData, is_pro_only: e.target.checked })}
              className="w-4 h-4 rounded border-purple-500/30 bg-black/50 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-neutral-400">Pro members only</span>
          </label>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-blue-500/20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="px-4 py-2 bg-neutral-800 text-white rounded-lg font-medium text-sm"
        >
          Cancel
        </motion.button>
        
        <div className="flex items-center gap-2">
          {selectedAnalysis && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(selectedAnalysis.id)}
              disabled={saving}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSave}
            disabled={saving || !formData.title?.trim() || !formData.content?.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {selectedAnalysis ? 'Update' : 'Publish'}
          </motion.button>
        </div>
      </div>
    </div>
  );
});
EditForm.displayName = 'EditForm';

export default EnhancedAnalysisModal;
