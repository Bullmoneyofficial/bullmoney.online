"use client";

/**
 * UltimateHubAnalysisTab - Trading Analysis & Charts
 * 
 * Optimized tab version of EnhancedAnalysisModal for Ultimate Hub
 * Features:
 * - Trading analysis feed
 * - TradingView charts
 * - Mobile-optimized sizing and scrolling
 * - Skip heavy render effects for performance
 * - Touch-friendly controls
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  Loader2,
  PenSquare,
  Users,
  Rss,
  Plus,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { createSupabaseClient } from '@/lib/supabase';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// Types
type MarketType = 'forex' | 'crypto' | 'stocks' | 'indices';
type Direction = 'bullish' | 'bearish' | 'neutral';
type ContentType = 'quick_take' | 'deep_dive' | 'market_update';

interface Analysis {
  id: string;
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
  author_id: string;
  is_published: boolean;
  is_pro_only: boolean;
  bull_score: number;
  view_count: number;
  comment_count: number;
}

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

// Get TradingView symbol from analysis
const getChartSymbol = (analysis: Analysis): string => {
  const pair = analysis.pair.replace('/', '');
  if (analysis.market === 'crypto') {
    return `BINANCE:${pair}USDT`;
  }
  if (analysis.market === 'forex') {
    return `FX:${pair}`;
  }
  if (analysis.market === 'stocks') {
    return `NASDAQ:${pair}`;
  }
  return pair;
};

// Confidence Meter Component
const ConfidenceMeter = memo(({ score }: { score: number }) => {
  const percentage = (score / 10) * 100;
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#3b82f6' : score >= 4 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
        />
      </div>
      <span className="text-[10px] font-bold text-white" style={{ color }}>
        {score}/10
      </span>
    </div>
  );
});
ConfidenceMeter.displayName = 'ConfidenceMeter';

export const UltimateHubAnalysisTab = memo(() => {
  const { shouldSkipHeavyEffects, isMobile } = useMobilePerformance();
  
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(!isMobile); // Hide chart on mobile by default to save resources
  const [userReaction, setUserReaction] = useState<'bull' | 'bear' | 'save' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Analysis> | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(isMobile); // Collapse details on mobile

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.session.user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdmin();
  }, []);

  // Fetch analyses from Supabase
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setAnalyses(data);
        }
      } catch (err) {
        console.error('[Analysis] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyses();
  }, []);

  const currentAnalysis = analyses[currentIndex] || null;

  const goNext = useCallback(() => {
    SoundEffects.click();
    setCurrentIndex((prev) => (prev + 1) % analyses.length);
    setUserReaction(null);
    setIsEditing(false);
  }, [analyses.length]);

  const goPrev = useCallback(() => {
    SoundEffects.click();
    setCurrentIndex((prev) => (prev - 1 + analyses.length) % analyses.length);
    setUserReaction(null);
    setIsEditing(false);
  }, [analyses.length]);

  // Admin: Start editing
  const handleEdit = useCallback(() => {
    if (!currentAnalysis || !isAdmin) return;
    SoundEffects.click();
    setEditForm(currentAnalysis);
    setIsEditing(true);
  }, [currentAnalysis, isAdmin]);

  // Admin: Save edit
  const handleSaveEdit = useCallback(async () => {
    if (!editForm || !currentAnalysis) return;
    SoundEffects.click();
    
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('analyses')
        .update(editForm)
        .eq('id', currentAnalysis.id);

      if (!error) {
        setAnalyses(prev => prev.map(a => a.id === currentAnalysis.id ? { ...a, ...editForm } : a));
        setIsEditing(false);
        setEditForm(null);
      }
    } catch (err) {
      console.error('[Analysis] Failed to save:', err);
    }
  }, [editForm, currentAnalysis]);

  // Admin: Delete analysis
  const handleDelete = useCallback(async () => {
    if (!currentAnalysis || !isAdmin) return;
    if (!confirm('Delete this analysis?')) return;
    SoundEffects.click();
    
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', currentAnalysis.id);

      if (!error) {
        setAnalyses(prev => prev.filter(a => a.id !== currentAnalysis.id));
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('[Analysis] Failed to delete:', err);
    }
  }, [currentAnalysis, isAdmin]);

  // Admin: Create new analysis
  const handleCreate = useCallback(async () => {
    if (!isAdmin) return;
    SoundEffects.click();
    
    const newAnalysis: Partial<Analysis> = {
      title: 'New Analysis',
      content: 'Add your analysis here...',
      market: 'forex',
      direction: 'neutral',
      pair: 'EUR/USD',
      confidence_score: 5,
      content_type: 'quick_take',
      is_published: false,
      is_pro_only: false,
      bull_score: 0,
      view_count: 0,
      comment_count: 0,
    };
    
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('analyses')
        .insert([{ ...newAnalysis, author_id: session?.session?.user?.id }])
        .select()
        .single();

      if (!error && data) {
        setAnalyses(prev => [data, ...prev]);
        setCurrentIndex(0);
        setEditForm(data);
        setIsEditing(true);
      }
    } catch (err) {
      console.error('[Analysis] Failed to create:', err);
    }
  }, [isAdmin]);

  const handleReaction = useCallback((type: 'bull' | 'bear' | 'save') => {
    SoundEffects.click();
    setUserReaction(prev => prev === type ? null : type);
  }, []);

  const handleShare = useCallback(() => {
    SoundEffects.click();
    if (currentAnalysis) {
      navigator.clipboard.writeText(window.location.href + `?analysis=${currentAnalysis.id}`);
    }
  }, [currentAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <ShimmerSpinner size={48} color="blue" />
      </div>
    );
  }

  if (!currentAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black p-4">
        <PenSquare className="w-12 h-12 text-blue-400/30 mb-4" />
        <p className="text-sm text-zinc-400 text-center">No analyses available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-1.5 sm:p-2 md:p-3 border-b border-blue-500/30 bg-black" style={{ boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)' }}>
        {/* Title Row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 shrink-0" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
            <h2 className="text-xs sm:text-sm font-bold text-blue-300 truncate" style={{ textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6' }}>
              Analysis
            </h2>
            <span className="text-[8px] sm:text-[9px] text-blue-400/60 shrink-0">
              {currentIndex + 1}/{analyses.length}
            </span>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {isAdmin && (
              <>
                <motion.button
                  onClick={handleCreate}
                  whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 sm:p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40"
                  title="Create"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                </motion.button>
                {!isEditing ? (
                  <>
                    <motion.button
                      onClick={handleEdit}
                      whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 sm:p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40"
                      title="Edit"
                    >
                      <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
                    </motion.button>
                    <motion.button
                      onClick={handleDelete}
                      whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 sm:p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={handleSaveEdit}
                      whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 sm:p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40"
                      title="Save"
                    >
                      <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                    </motion.button>
                    <motion.button
                      onClick={() => { setIsEditing(false); setEditForm(null); }}
                      whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 sm:p-1.5 rounded-lg bg-zinc-500/20 hover:bg-zinc-500/30 border border-zinc-500/40"
                      title="Cancel"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400" />
                    </motion.button>
                  </>
                )}
              </>
            )}
            
            <motion.button
              onClick={goPrev}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40"
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
            </motion.button>
            <motion.button
              onClick={goNext}
              whileHover={shouldSkipHeavyEffects ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40"
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
            </motion.button>
          </div>
        </div>

        {/* Market Badge & Direction - Collapse on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-nowrap scrollbar-hide">
            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${marketColors[currentAnalysis.market]} text-[9px] font-bold uppercase text-white shrink-0`}>
              {currentAnalysis.market}
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold shrink-0 ${directionColors[currentAnalysis.direction]}`}>
              {currentAnalysis.direction === 'bullish' && <TrendingUp className="w-2.5 h-2.5" />}
              {currentAnalysis.direction === 'bearish' && <TrendingDown className="w-2.5 h-2.5" />}
              {currentAnalysis.direction === 'neutral' && <BarChart3 className="w-2.5 h-2.5" />}
              {currentAnalysis.direction.toUpperCase()}
            </span>
            <span className="text-[10px] font-semibold text-white shrink-0">{currentAnalysis.pair}</span>
          </div>
        )}
        {isMobile && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white bg-gradient-to-r ${marketColors[currentAnalysis.market]}`}>
              {currentAnalysis.market.charAt(0).toUpperCase()}
            </span>
            <span className={`text-[8px] font-bold ${directionColors[currentAnalysis.direction]}`}>
              {currentAnalysis.direction === 'bullish' && '↑'} {currentAnalysis.direction === 'bearish' && '↓'}
            </span>
            <span className="text-[8px] text-blue-400">{currentAnalysis.pair}</span>
          </div>
        )}
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 md:p-3 space-y-1.5 sm:space-y-2 md:space-y-3" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}>
        {isEditing && editForm ? (
          /* Edit Mode */
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Title"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={editForm.content || ''}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              placeholder="Content"
              rows={4}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editForm.market || 'forex'}
                onChange={(e) => setEditForm({ ...editForm, market: e.target.value as MarketType })}
                className="px-3 py-2 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
                <option value="indices">Indices</option>
              </select>
              <select
                value={editForm.direction || 'neutral'}
                onChange={(e) => setEditForm({ ...editForm, direction: e.target.value as Direction })}
                className="px-3 py-2 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <input
              type="text"
              value={editForm.pair || ''}
              onChange={(e) => setEditForm({ ...editForm, pair: e.target.value })}
              placeholder="Pair (e.g., EUR/USD)"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.01"
                value={editForm.entry_price || ''}
                onChange={(e) => setEditForm({ ...editForm, entry_price: parseFloat(e.target.value) })}
                placeholder="Entry"
                className="px-2 py-1.5 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                step="0.01"
                value={editForm.target_price || ''}
                onChange={(e) => setEditForm({ ...editForm, target_price: parseFloat(e.target.value) })}
                placeholder="Target"
                className="px-2 py-1.5 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                step="0.01"
                value={editForm.stop_loss || ''}
                onChange={(e) => setEditForm({ ...editForm, stop_loss: parseFloat(e.target.value) })}
                placeholder="Stop"
                className="px-2 py-1.5 bg-zinc-900/50 border border-blue-500/30 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={editForm.confidence_score || 5}
              onChange={(e) => setEditForm({ ...editForm, confidence_score: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-zinc-400 text-center">Confidence: {editForm.confidence_score}/10</div>
            <label className="flex items-center gap-2 text-xs text-white">
              <input
                type="checkbox"
                checked={editForm.is_published || false}
                onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                className="rounded border-blue-500/30"
              />
              Published
            </label>
          </div>
        ) : (
          /* View Mode */
          <>
        {/* Title */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white mb-1">{currentAnalysis.title}</h3>
          <div className="flex items-center gap-2 text-[9px] text-blue-400/60">
            <span>{formatDate(currentAnalysis.created_at)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              <span>{currentAnalysis.view_count || 0}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-2.5 h-2.5" />
              <span>{currentAnalysis.comment_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="p-2 rounded-lg bg-zinc-900/50 border border-blue-500/20">
          <div className="text-[9px] text-blue-400 uppercase font-bold mb-1">Confidence</div>
          <ConfidenceMeter score={currentAnalysis.confidence_score} />
        </div>

        {/* Price Levels */}
        {(currentAnalysis.entry_price || currentAnalysis.target_price || currentAnalysis.stop_loss) && (
          <div className="grid grid-cols-3 gap-2">
            {currentAnalysis.entry_price && (
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="text-[8px] text-blue-400/70 uppercase mb-0.5">Entry</div>
                <div className="text-[11px] font-bold text-white">{currentAnalysis.entry_price}</div>
              </div>
            )}
            {currentAnalysis.target_price && (
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-[8px] text-green-400/70 uppercase mb-0.5">Target</div>
                <div className="text-[11px] font-bold text-white">{currentAnalysis.target_price}</div>
              </div>
            )}
            {currentAnalysis.stop_loss && (
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="text-[8px] text-red-400/70 uppercase mb-0.5">Stop</div>
                <div className="text-[11px] font-bold text-white">{currentAnalysis.stop_loss}</div>
              </div>
            )}
          </div>
        )}

        {/* Chart Toggle */}
        <button
          onClick={() => { SoundEffects.click(); setShowChart(p => !p); }}
          className="w-full p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 transition-colors text-[10px] font-semibold text-blue-300"
        >
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </button>

        {/* TradingView Chart */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.3 }}
              className="overflow-hidden rounded-lg border border-blue-500/30"
            >
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] xl:h-[400px] bg-black">
                <iframe
                  src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${getChartSymbol(currentAnalysis)}&interval=15&hidesidetoolbar=0&theme=dark&style=1&timezone=Etc%2FUTC`}
                  className="w-full h-full border-0"
                  style={{ touchAction: 'pan-y pinch-zoom' }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-blue-500/20">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {currentAnalysis.content}
          </p>
        </div>

        {/* Image if available */}
        {currentAnalysis.image_url && (
          <div className="rounded-lg overflow-hidden border border-blue-500/30">
            <img
              src={currentAnalysis.image_url}
              alt={currentAnalysis.title}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}
        </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 p-1.5 sm:p-2 md:p-3 border-t border-blue-500/30 bg-black" style={{ boxShadow: '0 -2px 8px rgba(59, 130, 246, 0.2)' }}>
        <div className="flex items-center justify-around gap-1 sm:gap-2">
          {/* Bullish */}
          <motion.button
            onClick={() => handleReaction('bull')}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg transition-all ${
              userReaction === 'bull'
                ? 'bg-green-500/30 border border-green-500/50'
                : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${userReaction === 'bull' ? 'text-green-400' : 'text-zinc-400'}`} />
            <span className="text-[7px] sm:text-[8px] font-bold text-zinc-400">Bull</span>
          </motion.button>

          {/* Bearish */}
          <motion.button
            onClick={() => handleReaction('bear')}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg transition-all ${
              userReaction === 'bear'
                ? 'bg-red-500/30 border border-red-500/50'
                : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent'
            }`}
          >
            <TrendingDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${userReaction === 'bear' ? 'text-red-400' : 'text-zinc-400'}`} />
            <span className="text-[7px] sm:text-[8px] font-bold text-zinc-400">Bear</span>
          </motion.button>

          {/* Save */}
          <motion.button
            onClick={() => handleReaction('save')}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg transition-all ${
              userReaction === 'save'
                ? 'bg-blue-500/30 border border-blue-500/50'
                : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent'
            }`}
          >
            <Copy className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${userReaction === 'save' ? 'text-blue-400' : 'text-zinc-400'}`} />
            <span className="text-[7px] sm:text-[8px] font-bold text-zinc-400">Save</span>
          </motion.button>

          {/* Share */}
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            <span className="text-[7px] sm:text-[8px] font-bold text-zinc-400">Share</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
});

UltimateHubAnalysisTab.displayName = 'UltimateHubAnalysisTab';
