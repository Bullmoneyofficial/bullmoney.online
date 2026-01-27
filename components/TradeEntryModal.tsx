'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { TradeDB, AssetType, TradeDirection, NewTrade } from '@/types/tradingJournal';
import { calculateTradePnL, calculateRiskReward, determineOutcome } from '@/lib/tradingCalculations';

interface TradeEntryModalProps {
  trade: TradeDB | null;
  onClose: () => void;
  onSubmit: () => void;
}

export default function TradeEntryModal({ trade, onClose, onSubmit }: TradeEntryModalProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    trade_date: trade?.trade_date ? new Date(trade.trade_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    asset_symbol: trade?.asset_symbol || '',
    asset_type: trade?.asset_type || 'stock' as AssetType,
    direction: trade?.direction || 'long' as TradeDirection,
    entry_price: trade?.entry_price || 0,
    exit_price: trade?.exit_price || null,
    quantity: trade?.quantity || 0,
    leverage: trade?.leverage || 1,
    entry_fee: trade?.entry_fee || 0,
    exit_fee: trade?.exit_fee || 0,
    funding_fees: trade?.funding_fees || 0,
    stop_loss: trade?.stop_loss || null,
    take_profit: trade?.take_profit || null,
    strategy: trade?.strategy || '',
    timeframe: trade?.timeframe || '',
    market_condition: trade?.market_condition || '',
    entry_reason: trade?.entry_reason || '',
    exit_reason: trade?.exit_reason || '',
    emotional_state: trade?.emotional_state || '',
    followed_plan: trade?.followed_plan ?? true,
    session_number: trade?.session_number || null,
    setup_quality: trade?.setup_quality || 3,
    tags: trade?.tags?.join(', ') || '',
    notes: trade?.notes || '',
    mistake_made: trade?.mistake_made || false,
    mistake_notes: trade?.mistake_notes || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (tradeId: string, userId: string) => {
    if (imageFiles.length === 0) return;

    setUploadingImages(true);

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${tradeId}/${Date.now()}_${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trade-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('trade-images')
          .getPublicUrl(fileName);

        // Insert image record
        const { error: insertError } = await supabase
          .from('trade_images')
          .insert({
            trade_id: tradeId,
            user_id: userId,
            image_url: publicUrl,
            image_type: 'analysis',
            order_index: i,
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to get user from multiple sources
      let userId = null;
      let userType = 'auth';
      
      // First check localStorage for recruit session
      const pagemodeSession = localStorage.getItem('bullmoney_session');
      if (pagemodeSession) {
        try {
          const sessionData = JSON.parse(pagemodeSession);
          if (sessionData?.id) {
            userId = sessionData.id;
            userType = 'recruit';
          }
        } catch (e) {
          // Invalid JSON, continue
        }
      }
      
      // If no recruit session, try Supabase auth
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userType = 'auth';
        }
      }
      
      if (!userId) throw new Error('No user found - please log in');

      // Calculate P&L if exit price is provided
      let pnlData = null;
      let status: 'open' | 'closed' = 'open';
      let outcome = null;

      if (formData.exit_price) {
        pnlData = calculateTradePnL({
          entry_price: formData.entry_price,
          exit_price: formData.exit_price,
          quantity: formData.quantity,
          direction: formData.direction,
          entry_fee: formData.entry_fee,
          exit_fee: formData.exit_fee,
          funding_fees: formData.funding_fees,
          leverage: formData.leverage,
        });
        status = 'closed';
        outcome = determineOutcome(pnlData.net_pnl);
      }

      // Calculate risk/reward if stop loss and take profit are provided
      let rrData = null;
      if (formData.stop_loss && formData.take_profit) {
        rrData = calculateRiskReward(
          formData.entry_price,
          formData.stop_loss,
          formData.take_profit,
          formData.direction
        );
      }

      const tradeData = {
        user_id: userId.toString(), // Convert to string to support both UUID and BIGINT
        trade_date: new Date(formData.trade_date).toISOString(),
        asset_symbol: formData.asset_symbol.toUpperCase(),
        asset_type: formData.asset_type,
        direction: formData.direction,
        entry_price: formData.entry_price,
        exit_price: formData.exit_price,
        quantity: formData.quantity,
        leverage: formData.leverage,
        entry_fee: formData.entry_fee,
        exit_fee: formData.exit_fee,
        funding_fees: formData.funding_fees,
        status,
        gross_pnl: pnlData?.gross_pnl || null,
        net_pnl: pnlData?.net_pnl || null,
        pnl_percentage: pnlData?.pnl_percentage || null,
        stop_loss: formData.stop_loss,
        take_profit: formData.take_profit,
        risk_amount: rrData?.risk_amount || null,
        reward_amount: rrData?.reward_amount || null,
        risk_reward_ratio: rrData?.risk_reward_ratio || null,
        strategy: formData.strategy || null,
        timeframe: formData.timeframe || null,
        market_condition: formData.market_condition || null,
        entry_reason: formData.entry_reason || null,
        exit_reason: formData.exit_reason || null,
        outcome,
        mistake_made: formData.mistake_made,
        mistake_notes: formData.mistake_notes || null,
        emotional_state: formData.emotional_state || null,
        followed_plan: formData.followed_plan,
        session_number: formData.session_number,
        setup_quality: formData.setup_quality,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        notes: formData.notes || null,
      };

      if (trade) {
        // Update existing trade
        const { error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', trade.id);

        if (error) throw error;

        // Upload new images if any
        if (imageFiles.length > 0) {
          await uploadImages(trade.id, userId.toString());
        }
      } else {
        // Insert new trade
        const { data: newTrade, error } = await supabase
          .from('trades')
          .insert(tradeData)
          .select()
          .single();

        if (error) throw error;

        // Upload images
        if (imageFiles.length > 0 && newTrade) {
          await uploadImages(newTrade.id, userId.toString());
        }
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving trade:', error);
      alert('Failed to save trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black rounded-2xl border border-blue-500/30 
                   max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {trade ? 'Edit Trade' : 'New Trade'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Trade Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Trade Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trade Date *
                </label>
                <input
                  type="date"
                  name="trade_date"
                  value={formData.trade_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  name="asset_symbol"
                  value={formData.asset_symbol}
                  onChange={handleInputChange}
                  placeholder="BTC, AAPL, EUR/USD..."
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asset Type *
                </label>
                <select
                  name="asset_type"
                  value={formData.asset_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                  <option value="forex">Forex</option>
                  <option value="options">Options</option>
                  <option value="futures">Futures</option>
                  <option value="commodities">Commodities</option>
                  <option value="bonds">Bonds</option>
                  <option value="etf">ETF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Direction *
                </label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Price *
                </label>
                <input
                  type="number"
                  name="entry_price"
                  value={formData.entry_price || ''}
                  onChange={handleInputChange}
                  step="0.00000001"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exit Price
                </label>
                <input
                  type="number"
                  name="exit_price"
                  value={formData.exit_price || ''}
                  onChange={handleInputChange}
                  step="0.00000001"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity || ''}
                  onChange={handleInputChange}
                  step="0.00000001"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Leverage
                </label>
                <input
                  type="number"
                  name="leverage"
                  value={formData.leverage || 1}
                  onChange={handleInputChange}
                  step="0.1"
                  min="1"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Risk Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stop Loss
                </label>
                <input
                  type="number"
                  name="stop_loss"
                  value={formData.stop_loss || ''}
                  onChange={handleInputChange}
                  step="0.00000001"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Take Profit
                </label>
                <input
                  type="number"
                  name="take_profit"
                  value={formData.take_profit || ''}
                  onChange={handleInputChange}
                  step="0.00000001"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Setup Quality (1-5)
                </label>
                <input
                  type="number"
                  name="setup_quality"
                  value={formData.setup_quality || 3}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Fees</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Fee
                </label>
                <input
                  type="number"
                  name="entry_fee"
                  value={formData.entry_fee || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exit Fee
                </label>
                <input
                  type="number"
                  name="exit_fee"
                  value={formData.exit_fee || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Funding Fees
                </label>
                <input
                  type="number"
                  name="funding_fees"
                  value={formData.funding_fees || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Trading Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Strategy
                </label>
                <input
                  type="text"
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleInputChange}
                  placeholder="Breakout, Reversal..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeframe
                </label>
                <input
                  type="text"
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
                  placeholder="1h, 4h, 1d..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Market Condition
                </label>
                <input
                  type="text"
                  name="market_condition"
                  value={formData.market_condition}
                  onChange={handleInputChange}
                  placeholder="Trending, Ranging..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Entry Reason
              </label>
              <textarea
                name="entry_reason"
                value={formData.entry_reason}
                onChange={handleInputChange}
                rows={3}
                placeholder="Why did you enter this trade?"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exit Reason
              </label>
              <textarea
                name="exit_reason"
                value={formData.exit_reason}
                onChange={handleInputChange}
                rows={3}
                placeholder="Why did you exit this trade?"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Psychology */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Trading Psychology</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emotional State
                </label>
                <select
                  name="emotional_state"
                  value={formData.emotional_state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="confident">Confident</option>
                  <option value="fearful">Fearful</option>
                  <option value="greedy">Greedy</option>
                  <option value="disciplined">Disciplined</option>
                  <option value="revenge">Revenge Trading</option>
                  <option value="calm">Calm</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="followed_plan"
                    checked={formData.followed_plan}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500
                             focus:ring-2 focus:ring-blue-500"
                  />
                  Followed Trading Plan
                </label>

                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="mistake_made"
                    checked={formData.mistake_made}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-red-500
                             focus:ring-2 focus:ring-red-500"
                  />
                  Mistake Made
                </label>
              </div>
            </div>

            {formData.mistake_made && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mistake Notes
                </label>
                <textarea
                  name="mistake_notes"
                  value={formData.mistake_notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="What mistake was made and how to avoid it?"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Notes and Tags */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="breakout, high-volume, news-driven"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Additional notes about this trade..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon size={20} />
              Screenshots & Charts
            </h3>

            <div>
              <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed 
                             border-white/20 rounded-lg cursor-pointer hover:border-blue-500 
                             transition-colors bg-white/5">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  <span className="text-gray-300">Click to upload images</span>
                  <span className="block text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 
                               group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg
                       hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white 
                       rounded-lg font-semibold hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading || uploadingImages ? 'Saving...' : trade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
