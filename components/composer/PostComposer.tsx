"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  Image as ImageIcon,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { usePostComposerModalUI, useAuthModalUI } from '@/contexts/UIStateContext';
import { useUserStore } from '@/stores/userStore';
import { createSupabaseClient } from '@/lib/supabase';
import { RichTextEditor } from './RichTextEditor';
import { MediaUploader } from './MediaUploader';
import { TickerSelector } from './TickerSelector';
import { ConfidenceMeter } from '@/components/analysis-enhanced/ConfidenceMeter';
import type { Attachment, ContentType, MarketType, Direction, AnalysisInsert } from '@/types/feed';

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within PostComposer');
  return context;
};

// Main Modal Component
export const PostComposer = memo(() => {
  const { isOpen, setIsOpen } = usePostComposerModalUI();
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

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {createPortal(
        <AnimatePresence>
          {isOpen && <PostComposerContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
PostComposer.displayName = 'PostComposer';

// Content types config
const contentTypes: { id: ContentType; label: string; icon: string; description: string }[] = [
  { id: 'deep_dive', label: 'Deep Dive', icon: '📊', description: 'Full technical/fundamental analysis' },
  { id: 'market_pulse', label: 'Market Pulse', icon: '⚡', description: 'Quick take (max 280 chars)' },
  { id: 'blog_post', label: 'Blog Post', icon: '📝', description: 'Educational content' },
];

const markets: { id: MarketType; label: string; color: string }[] = [
  { id: 'forex', label: 'Forex', color: 'bg-green-500' },
  { id: 'crypto', label: 'Crypto', color: 'bg-orange-500' },
  { id: 'stocks', label: 'Stocks', color: 'bg-blue-500' },
  { id: 'indices', label: 'Indices', color: 'bg-purple-500' },
];

// Main Content
const PostComposerContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  const { user, isAuthenticated } = useUserStore();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [richContent, setRichContent] = useState<any>(null);
  const [contentType, setContentType] = useState<ContentType>('deep_dive');
  const [market, setMarket] = useState<MarketType>('forex');
  const [direction, setDirection] = useState<Direction>('neutral');
  const [pair, setPair] = useState('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState(5);
  const [tickers, setTickers] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isProOnly, setIsProOnly] = useState(false);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  // Check auth
  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      setAuthModalOpen(true);
    }
  }, [isAuthenticated, setIsOpen, setAuthModalOpen]);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      title, content, contentType, market, direction, pair,
      entryPrice, targetPrice, stopLoss, confidenceScore,
      tickers, isPublished, isProOnly
    };
    localStorage.setItem('bullmoney_draft', JSON.stringify(draft));
  }, [title, content, contentType, market, direction, pair, entryPrice, targetPrice, stopLoss, confidenceScore, tickers, isPublished, isProOnly]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('bullmoney_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title || draft.content) {
          setIsDraft(true);
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setContentType(draft.contentType || 'deep_dive');
          setMarket(draft.market || 'forex');
          setDirection(draft.direction || 'neutral');
          setPair(draft.pair || '');
          setEntryPrice(draft.entryPrice || '');
          setTargetPrice(draft.targetPrice || '');
          setStopLoss(draft.stopLoss || '');
          setConfidenceScore(draft.confidenceScore || 5);
          setTickers(draft.tickers || []);
          setIsPublished(draft.isPublished ?? true);
          setIsProOnly(draft.isProOnly ?? false);
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem('bullmoney_draft');
    setIsDraft(false);
    setTitle('');
    setContent('');
    setRichContent(null);
    setContentType('deep_dive');
    setMarket('forex');
    setDirection('neutral');
    setPair('');
    setEntryPrice('');
    setTargetPrice('');
    setStopLoss('');
    setConfidenceScore(5);
    setTickers([]);
    setAttachments([]);
    setIsPublished(true);
    setIsProOnly(false);
    setError(null);
  }, []);

  // Handle content change from rich editor
  const handleContentChange = useCallback((html: string, json: any) => {
    setContent(html);
    setRichContent(json);
  }, []);

  // Validation
  const isValid = title.trim().length >= 3 && content.trim().length >= 10 && pair.trim().length > 0;

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      setError('Please sign in to post');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();

      const analysisData: AnalysisInsert = {
        title: title.trim(),
        content: content.trim(),
        rich_content: richContent,
        content_type: contentType,
        market,
        direction,
        pair: pair.trim().toUpperCase(),
        entry_price: entryPrice ? parseFloat(entryPrice) : null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        confidence_score: confidenceScore,
        tickers,
        attachments,
        is_published: isPublished,
        is_pro_only: isProOnly,
      };

      const { error: insertError } = await supabase
        .from('analyses')
        .insert({
          ...analysisData,
          author_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Clear draft and close
      clearDraft();
      SoundEffects.click();
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error saving analysis:', err);
      setError(err.message || 'Failed to publish. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    isValid, user, title, content, richContent, contentType, market, direction,
    pair, entryPrice, targetPrice, stopLoss, confidenceScore, tickers, attachments,
    isPublished, isProOnly, clearDraft, setIsOpen
  ]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        zIndex: 2147483647, // Maximum possible z-index - matches EnhancedAnalysisModal
        isolation: 'isolate',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-lg"
        style={{ zIndex: 0 }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[95vh] m-4 overflow-hidden rounded-2xl"
        style={{ zIndex: 1 }}
      >
        {/* Shimmer Border */}
        <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
          <ShimmerBorder color="blue" intensity="medium" />
        </div>
        
        {/* Inner Container */}
        <div className="relative z-10 h-full bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-blue-500/30 overflow-hidden flex flex-col max-h-[95vh]">
          <ShimmerLine color="blue" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✏️</div>
              <div>
                <h2 className="text-lg font-bold text-white">Create Analysis</h2>
                <p className="text-xs text-neutral-500">Share your trading insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isDraft && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <Save className="w-3 h-3" /> Draft saved
                </span>
              )}
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
          
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Content Type Selector */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Content Type</label>
              <div className="grid grid-cols-3 gap-2">
                {contentTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { SoundEffects.click(); setContentType(type.id); }}
                    className={`
                      p-3 rounded-xl border text-left transition-all
                      ${contentType === type.id 
                        ? 'bg-blue-500/20 border-blue-500 text-white' 
                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                      }
                    `}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <p className="font-medium text-sm mt-1">{type.label}</p>
                    <p className="text-xs opacity-60">{type.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Market & Direction Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Market */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Market</label>
                <div className="flex flex-wrap gap-2">
                  {markets.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { SoundEffects.click(); setMarket(m.id); }}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all
                        ${market === m.id 
                          ? `${m.color} text-white` 
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }
                      `}
                    >
                      {m.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Direction */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Direction</label>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { SoundEffects.click(); setDirection('bullish'); }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all
                      ${direction === 'bullish' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }
                    `}
                  >
                    <TrendingUp className="w-4 h-4" />
                    LONG
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { SoundEffects.click(); setDirection('neutral'); }}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-all
                      ${direction === 'neutral' 
                        ? 'bg-neutral-600 text-white' 
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }
                    `}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { SoundEffects.click(); setDirection('bearish'); }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all
                      ${direction === 'bearish' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }
                    `}
                  >
                    <TrendingDown className="w-4 h-4" />
                    SHORT
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Pair / Symbol */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Pair / Symbol *</label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                placeholder="EUR/USD, BTC, AAPL..."
                className="w-full px-4 py-3 bg-black/50 border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your analysis title..."
                className="w-full px-4 py-3 bg-black/50 border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Analysis Content *
                {contentType === 'market_pulse' && (
                  <span className="ml-2 text-xs text-yellow-400">({content.length}/280)</span>
                )}
              </label>
              {contentType === 'market_pulse' ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 280))}
                  placeholder="Share your quick take..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-blue-500/30 rounded-xl text-white resize-none focus:outline-none focus:border-blue-500 transition-colors"
                />
              ) : (
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Write your detailed analysis here..."
                  minHeight={200}
                />
              )}
            </div>

            {/* Confidence Score */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Confidence Score</label>
              <ConfidenceMeter
                score={confidenceScore}
                onChange={setConfidenceScore}
                showLabel
                size="lg"
                interactive
              />
            </div>

            {/* Tickers */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">$Tickers</label>
              <TickerSelector
                selectedTickers={tickers}
                onChange={setTickers}
                maxTickers={5}
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Attachments</label>
              <MediaUploader
                attachments={attachments}
                onChange={setAttachments}
                maxFiles={5}
                maxSizeMB={10}
              />
            </div>

            {/* Advanced Options */}
            <div>
              <button
                onClick={() => { SoundEffects.click(); setShowAdvanced(!showAdvanced); }}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Advanced Options
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      {/* Price Targets */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Entry Price</label>
                          <input
                            type="number"
                            step="any"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Target Price</label>
                          <input
                            type="number"
                            step="any"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Stop Loss</label>
                          <input
                            type="number"
                            step="any"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-black/50 border border-red-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                      
                      {/* Publish Options */}
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-4 h-4 rounded border-blue-500/30 bg-black/50 text-blue-500"
                          />
                          <span className="text-sm text-neutral-400 flex items-center gap-1">
                            {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            Publish immediately
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isProOnly}
                            onChange={(e) => setIsProOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-purple-500/30 bg-black/50 text-purple-500"
                          />
                          <span className="text-sm text-neutral-400">🔒 Pro members only</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Footer - Actions */}
          <div className="flex items-center justify-between p-4 border-t border-neutral-800 flex-shrink-0 bg-black/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearDraft}
              className="px-4 py-2 text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Clear Draft
            </motion.button>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="px-4 py-2.5 bg-neutral-800 text-white rounded-xl font-medium text-sm hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={saving || !isValid}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isPublished ? 'Publish' : 'Save Draft'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
PostComposerContent.displayName = 'PostComposerContent';

export default PostComposer;
