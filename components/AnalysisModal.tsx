"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Save,
  Loader2,
  Image as ImageIcon,
  Send,
  Eye
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder, ShimmerSpinner } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop } from '@/components/ShopContext';
import { createSupabaseClient } from '@/lib/supabase';

// Types
interface Analysis {
  id: string;
  title: string;
  content: string;
  market: string; // 'forex' | 'crypto' | 'stocks' | 'indices'
  direction: 'bullish' | 'bearish' | 'neutral';
  pair: string; // e.g., 'EUR/USD', 'BTC/USD'
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  is_published: boolean;
}

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within AnalysisModal');
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

// Main Modal Component
export const AnalysisModal = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
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
      <AnalysisTrigger />
      {createPortal(
        <AnimatePresence>
          {isOpen && <AnalysisContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
AnalysisModal.displayName = 'AnalysisModal';

// Trigger Button - Better click handling for Dock integration
const AnalysisTrigger = memo(() => {
  const { setIsOpen } = useModalState();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        SoundEffects.click();
        setIsOpen(true);
      }}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-50"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation'
      }}
      aria-label="Open Analysis"
    />
  );
});
AnalysisTrigger.displayName = 'AnalysisTrigger';

// Main Content
const AnalysisContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { state } = useShop();
  const { isAdmin } = state;
  
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Analysis>>({
    title: '',
    content: '',
    market: 'forex',
    direction: 'neutral',
    pair: '',
    entry_price: undefined,
    target_price: undefined,
    stop_loss: undefined,
    image_url: '',
    is_published: true,
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
        setAnalyses(data || []);
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
  }, [analyses.length]);

  const goPrev = useCallback(() => {
    SoundEffects.click();
    setCurrentIndex((prev) => (prev - 1 + analyses.length) % analyses.length);
  }, [analyses.length]);

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
        image_url: '',
        is_published: true,
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
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[95vh] overflow-hidden rounded-2xl"
      >
        {/* Shimmer Border - Positioned outside inner container */}
        <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
          <ShimmerBorder color="blue" intensity="low" />
        </div>
        
        {/* Inner Container */}
        <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-blue-500/30 overflow-hidden max-h-[95vh] flex flex-col">
          <ShimmerLine color="blue" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-500/20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Trade Analysis</h2>
                <p className="text-xs text-blue-400/70">Expert market insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && viewMode === 'view' && (
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
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <ShimmerSpinner size={48} color="blue" />
              </div>
            ) : viewMode === 'edit' ? (
              /* Edit Mode */
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Market</label>
                    <select
                      value={formData.market || 'forex'}
                      onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="forex">Forex</option>
                      <option value="crypto">Crypto</option>
                      <option value="stocks">Stocks</option>
                      <option value="indices">Indices</option>
                    </select>
                  </div>
                  
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
                  
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Direction</label>
                    <select
                      value={formData.direction || 'neutral'}
                      onChange={(e) => setFormData({ ...formData, direction: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="bullish">🟢 Bullish</option>
                      <option value="bearish">🔴 Bearish</option>
                      <option value="neutral">⚪ Neutral</option>
                    </select>
                  </div>
                  
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
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Image URL (optional)</label>
                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Analysis Content</label>
                    <textarea
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Write your analysis here..."
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published || false}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="w-4 h-4 rounded border-blue-500/30 bg-black/50 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-neutral-400">Publish immediately</span>
                    </label>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-blue-500/20">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { SoundEffects.click(); setViewMode('view'); }}
                    className="px-4 py-2 bg-neutral-800 text-white rounded-lg font-medium text-sm"
                  >
                    Cancel
                  </motion.button>
                  
                  <div className="flex items-center gap-2">
                    {selectedAnalysis && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteAnalysis(selectedAnalysis.id)}
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
                      onClick={saveAnalysis}
                      disabled={saving || !formData.title?.trim() || !formData.content?.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {selectedAnalysis ? 'Update' : 'Publish'}
                    </motion.button>
                  </div>
                </div>
              </div>
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
            ) : (
              /* View Mode */
              <div className="p-4">
                {currentAnalysis && (
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase text-white ${marketColors[currentAnalysis.market] || 'bg-blue-500'}`}>
                            {currentAnalysis.market}
                          </span>
                          <span className="text-lg font-bold text-white">{currentAnalysis.pair}</span>
                          {currentAnalysis.direction === 'bullish' && (
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                              <TrendingUp className="w-4 h-4" /> Bullish
                            </span>
                          )}
                          {currentAnalysis.direction === 'bearish' && (
                            <span className="flex items-center gap-1 text-red-400 text-sm">
                              <TrendingDown className="w-4 h-4" /> Bearish
                            </span>
                          )}
                          {currentAnalysis.direction === 'neutral' && (
                            <span className="text-neutral-400 text-sm">Neutral</span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white">{currentAnalysis.title}</h3>
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(currentAnalysis.created_at)}
                        </p>
                      </div>
                      
                      {isAdmin && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { SoundEffects.click(); startEdit(currentAnalysis); }}
                          className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex-shrink-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                    
                    {/* Price targets */}
                    {(currentAnalysis.entry_price || currentAnalysis.target_price || currentAnalysis.stop_loss) && (
                      <div className="grid grid-cols-3 gap-2">
                        {currentAnalysis.entry_price && (
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                            <p className="text-xs text-neutral-500 uppercase">Entry</p>
                            <p className="text-lg font-bold text-blue-400">{currentAnalysis.entry_price}</p>
                          </div>
                        )}
                        {currentAnalysis.target_price && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                            <p className="text-xs text-neutral-500 uppercase">Target</p>
                            <p className="text-lg font-bold text-green-400">{currentAnalysis.target_price}</p>
                          </div>
                        )}
                        {currentAnalysis.stop_loss && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                            <p className="text-xs text-neutral-500 uppercase">Stop Loss</p>
                            <p className="text-lg font-bold text-red-400">{currentAnalysis.stop_loss}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Image */}
                    {currentAnalysis.image_url && (
                      <div className="rounded-lg overflow-hidden border border-blue-500/20">
                        <img 
                          src={currentAnalysis.image_url} 
                          alt={currentAnalysis.title}
                          className="w-full h-auto max-h-[300px] object-contain bg-black"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {currentAnalysis.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation */}
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
                    className={`w-2 h-2 rounded-full transition-colors ${
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
        </div>
      </motion.div>
    </motion.div>
  );
});
AnalysisContent.displayName = 'AnalysisContent';

export default AnalysisModal;
