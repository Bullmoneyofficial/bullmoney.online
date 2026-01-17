"use client";

import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  ChevronDown,
  User
} from 'lucide-react';
import { ShimmerLine } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useAuthModalUI } from '@/contexts/UIStateContext';
import { useUserStore } from '@/stores/userStore';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { ConfidenceMeter } from './ConfidenceMeter';
import type { ContentType, MarketType, Direction, AnalysisInsert } from '@/types/feed';

interface PostComposerInlineProps {
  onSuccess?: () => void;
}

export const PostComposerInline = memo(({ onSuccess }: PostComposerInlineProps) => {
  const { user, isLoading: authLoading } = useUserStore();
  const { isAuthenticated, recruit } = useRecruitAuth();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [market, setMarket] = useState<MarketType>('forex');
  const [direction, setDirection] = useState<Direction>('neutral');
  const [pair, setPair] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [confidence, setConfidence] = useState(5);
  const [contentType, setContentType] = useState<ContentType>('quick_take');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    if (!title.trim() || !content.trim() || !pair.trim()) {
      setError('Please fill in title, content, and trading pair');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const supabase = createSupabaseClient();
      
      // Use recruit ID if available, otherwise user ID
      const authorId = recruit?.id || user?.id || null;
      
      const analysisData: AnalysisInsert = {
        title: title.trim(),
        content: content.trim(),
        market,
        direction,
        pair: pair.trim(),
        entry_price: entryPrice ? parseFloat(entryPrice) : null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        confidence_score: confidence,
        content_type: contentType,
        image_url: imageUrl || null,
        author_id: authorId,
        is_published: true,
        is_pro_only: false,
        tickers: [pair.trim().toUpperCase()],
        attachments: [],
      };
      
      const { error: insertError } = await supabase
        .from('analyses')
        .insert(analysisData);
      
      if (insertError) throw insertError;
      
      SoundEffects.click();
      
      // Reset form
      setTitle('');
      setContent('');
      setPair('');
      setEntryPrice('');
      setTargetPrice('');
      setStopLoss('');
      setConfidence(5);
      setImageUrl('');
      
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isAuthenticated, user, recruit, title, content, market, direction, pair,
    entryPrice, targetPrice, stopLoss, confidence, contentType, imageUrl,
    setAuthModalOpen, onSuccess
  ]);

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
          <User className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Sign in to Create Posts</h3>
        <p className="text-sm text-neutral-400 text-center max-w-sm">
          Join the BullMoney community to share your trading insights and analysis
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { SoundEffects.click(); setAuthModalOpen(true); }}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2"
        >
          Sign In
        </motion.button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <ShimmerLine color="blue" />
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}
      
      {/* Title */}
      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your analysis a title..."
          className="w-full px-4 py-3 bg-black/50 border border-blue-500/30 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      
      {/* Quick Settings Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Market */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Market</label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as MarketType)}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="indices">Indices</option>
          </select>
        </div>
        
        {/* Pair/Ticker */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Pair/Ticker</label>
          <input
            type="text"
            value={pair}
            onChange={(e) => setPair(e.target.value.toUpperCase())}
            placeholder="EUR/USD"
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        {/* Direction */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Direction</label>
          <div className="flex gap-1">
            <button
              onClick={() => setDirection('bullish')}
              className={`flex-1 p-2 rounded-lg transition-all ${
                direction === 'bullish' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setDirection('neutral')}
              className={`flex-1 p-2 rounded-lg transition-all ${
                direction === 'neutral' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <Minus className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setDirection('bearish')}
              className={`flex-1 p-2 rounded-lg transition-all ${
                direction === 'bearish' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <TrendingDown className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
        
        {/* Content Type */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="quick_take">Quick Take</option>
            <option value="deep_dive">Deep Dive</option>
            <option value="trade_idea">Trade Idea</option>
            <option value="educational">Educational</option>
          </select>
        </div>
      </div>
      
      {/* Content */}
      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Analysis</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your trading analysis, insights, and reasoning..."
          rows={5}
          className="w-full px-4 py-3 bg-black/50 border border-blue-500/30 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>
      
      {/* Confidence Meter */}
      <div>
        <label className="block text-xs text-neutral-400 mb-2">Confidence Level</label>
        <ConfidenceMeter 
          score={confidence} 
          showLabel 
          size="md"
          interactive
          onChange={setConfidence}
        />
      </div>
      
      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        {showAdvanced ? 'Hide' : 'Show'} Price Targets
      </button>
      
      {/* Advanced Options */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Entry Price</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Target Price</label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-black/50 border border-red-500/30 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </motion.div>
      )}
      
      {/* Image URL (simplified) */}
      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Image URL (optional)</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/chart.png"
            className="flex-1 px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
          />
          <button className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim() || !content.trim() || !pair.trim()}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Publish Analysis
          </>
        )}
      </motion.button>
    </div>
  );
});

PostComposerInline.displayName = 'PostComposerInline';
