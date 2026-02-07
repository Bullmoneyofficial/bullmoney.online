/**
 * COMPLETE WORKING EXAMPLE
 * 
 * This shows exactly how a fully integrated section should look
 * with all the preferences, auto-refresh, notifications, and controls working.
 * 
 * Use this as a reference when updating the actual sections in PageSections.tsx
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, RefreshCw, Filter, Settings, MoreVertical, 
  Eye, EyeOff, Volume2, VolumeX, Maximize2
} from 'lucide-react';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import { useToast } from './ToastContext'; // Assuming this path

// ─── TYPE DEFINITIONS ───────────────────────────────────────────────────────

interface Quote {
  id: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'stocks' | 'crypto' | 'forex';
  timestamp: Date;
}

interface QuotesSectionProps {
  onOpenSettings: () => void;
  onOpenWatchlist: () => void;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export const QuotesSectionExample = memo(function QuotesSectionExample({
  onOpenSettings,
  onOpenWatchlist
}: QuotesSectionProps) {
  
  // ═══ HOOKS ═══
  const { preferences, updateQuotesPrefs } = useDashboardPreferences();
  const { showToast } = useToast();
  
  // ═══ STATE ═══
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Filter dropdown state (desktop)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // ═══ DATA FETCHING WITH AUTO-REFRESH ═══
  const fetchQuotes = useCallback(async () => {
    if (!preferences.quotes.autoRefresh) {
      console.log('Auto-refresh disabled, skipping fetch');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/quotes');
      
      if (!response.ok) throw new Error('Failed to fetch quotes');
      
      const data: Quote[] = await response.json();
      
      // Apply category filter from preferences
      const filtered = data.filter(quote => {
        if (preferences.quotes.category === 'all') return true;
        return quote.category === preferences.quotes.category;
      });
      
      setQuotes(filtered);
      setLastFetch(new Date());
      setError(null);
      
      // Check for significant price movements and notify if enabled
      if (preferences.quotes.notifications) {
        const significantChanges = filtered.filter(q => Math.abs(q.changePercent) > 5);
        
        if (significantChanges.length > 0) {
          showToast(
            `📊 ${significantChanges.length} major price ${significantChanges.length === 1 ? 'movement' : 'movements'} detected`,
            'info',
            preferences.quotes.soundEnabled
          );
        }
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch quotes:', err);
      
      showToast('Failed to update market quotes', 'error', false);
    } finally {
      setIsLoading(false);
    }
  }, [
    preferences.quotes.autoRefresh, 
    preferences.quotes.category,
    preferences.quotes.notifications, 
    preferences.quotes.soundEnabled,
    showToast
  ]);
  
  // ═══ AUTO-REFRESH TIMER ═══
  useEffect(() => {
    // Initial fetch
    fetchQuotes();
    
    // Only set up interval if auto-refresh is enabled
    if (!preferences.quotes.autoRefresh) {
      console.log('Auto-refresh disabled');
      return;
    }
    
    console.log(`Setting up auto-refresh every ${preferences.quotes.refreshInterval}ms`);
    
    const intervalId = setInterval(() => {
      console.log('Auto-refresh triggered');
      fetchQuotes();
    }, preferences.quotes.refreshInterval);
    
    // Cleanup
    return () => {
      console.log('Clearing auto-refresh interval');
      clearInterval(intervalId);
    };
  }, [preferences.quotes.autoRefresh, preferences.quotes.refreshInterval, fetchQuotes]);
  
  // ═══ ALERT TOGGLE HANDLER ═══
  const toggleAlerts = useCallback(() => {
    const newState = !preferences.quotes.notifications;
    
    updateQuotesPrefs({ notifications: newState });
    
    showToast(
      `Price alerts ${newState ? 'enabled' : 'disabled'}`,
      'info',
      false // Don't play sound for this notification
    );
  }, [preferences.quotes.notifications, updateQuotesPrefs, showToast]);
  
  // ═══ CATEGORY FILTER HANDLER ═══
  const handleCategoryChange = useCallback((category: string) => {
    updateQuotesPrefs({ category });
    setShowFilterDropdown(false);
    
    showToast(
      `Showing ${category === 'all' ? 'all' : category} quotes`,
      'info',
      false
    );
  }, [updateQuotesPrefs, showToast]);
  
  // ═══ SOUND TOGGLE HANDLER ═══
  const toggleSound = useCallback(() => {
    const newState = !preferences.quotes.soundEnabled;
    updateQuotesPrefs({ soundEnabled: newState });
    
    showToast(
      `Sound alerts ${newState ? 'enabled' : 'disabled'}`,
      'info',
      false
    );
  }, [preferences.quotes.soundEnabled, updateQuotesPrefs, showToast]);
  
  // ═══ AUTO-REFRESH TOGGLE HANDLER ═══
  const toggleAutoRefresh = useCallback(() => {
    const newState = !preferences.quotes.autoRefresh;
    updateQuotesPrefs({ autoRefresh: newState });
    
    showToast(
      `Auto-refresh ${newState ? 'enabled' : 'disabled'}`,
      'info',
      false
    );
  }, [preferences.quotes.autoRefresh, updateQuotesPrefs, showToast]);
  
  // ═══ RENDER ═══
  return (
    <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden">
      {/* ─── HEADER ─── */}
      <div className="px-4 py-3 border-b border-white/10">
        {/* Mobile Header */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <h2 className="text-[13px] font-semibold text-white">Market Quotes</h2>
            {lastFetch && (
              <span className="text-[9px] text-white/40">
                {Math.round((Date.now() - lastFetch.getTime()) / 1000)}s ago
              </span>
            )}
          </div>
          
          {/* Mobile: Single Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <MoreVertical size={16} className="text-white/70" />
          </button>
        </div>
        
        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-white">Market Quotes</h2>
              {lastFetch && (
                <p className="text-[10px] text-white/40">
                  Updated {Math.round((Date.now() - lastFetch.getTime()) / 1000)}s ago
                </p>
              )}
            </div>
          </div>
          
          {/* Desktop: All Controls Visible */}
          <div className="flex items-center gap-1.5">
            {/* Alert Button */}
            <button
              onClick={toggleAlerts}
              className={`p-2 rounded-lg transition-all ${
                preferences.quotes.notifications 
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/30' 
                  : 'hover:bg-white/10 text-white/60'
              }`}
              title={`${preferences.quotes.notifications ? 'Disable' : 'Enable'} price alerts`}
            >
              <Bell size={14} />
            </button>
            
            {/* Sound Button */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg transition-all ${
                preferences.quotes.soundEnabled 
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/30' 
                  : 'hover:bg-white/10 text-white/60'
              }`}
              title={`${preferences.quotes.soundEnabled ? 'Disable' : 'Enable'} sound alerts`}
            >
              {preferences.quotes.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            
            {/* Auto-Refresh Button */}
            <button
              onClick={toggleAutoRefresh}
              className={`p-2 rounded-lg transition-all ${
                preferences.quotes.autoRefresh 
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/30 animate-spin-slow' 
                  : 'hover:bg-white/10 text-white/60'
              }`}
              title={`${preferences.quotes.autoRefresh ? 'Disable' : 'Enable'} auto-refresh`}
            >
              <RefreshCw size={14} />
            </button>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
                title="Filter quotes"
              >
                <Filter size={14} />
              </button>
              
              {showFilterDropdown && createPortal(
                <div className="fixed inset-0 z-[9998]" onClick={() => setShowFilterDropdown(false)}>
                  <div 
                    className="absolute top-20 right-4 w-48 bg-[#1a1a1a] border border-white/10 
                               rounded-xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    {['all', 'stocks', 'crypto', 'forex'].map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full px-4 py-2.5 text-left text-[12px] transition-colors ${
                          preferences.quotes.category === category
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </div>
            
            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
              title="Open settings"
            >
              <Settings size={14} />
            </button>
            
            {/* Watchlist Button */}
            <button
              onClick={onOpenWatchlist}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
              title="Open watchlist"
            >
              <Eye size={14} />
            </button>
            
            {/* Fullscreen Button */}
            <button
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
              title="Fullscreen mode"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* ─── MOBILE MENU DROPDOWN ─── */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 overflow-hidden sm:hidden"
          >
            <div className="px-4 py-3 space-y-2">
              {/* Alert Toggle */}
              <button
                onClick={() => {
                  toggleAlerts();
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  preferences.quotes.notifications ? 'bg-blue-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell size={14} className={preferences.quotes.notifications ? 'text-blue-400' : 'text-white/60'} />
                  <span className="text-[12px] text-white/80">Price Alerts</span>
                </div>
                <span className="text-[10px] text-white/40">
                  {preferences.quotes.notifications ? 'On' : 'Off'}
                </span>
              </button>
              
              {/* Sound Toggle */}
              <button
                onClick={() => {
                  toggleSound();
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  preferences.quotes.soundEnabled ? 'bg-blue-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {preferences.quotes.soundEnabled ? (
                    <Volume2 size={14} className="text-blue-400" />
                  ) : (
                    <VolumeX size={14} className="text-white/60" />
                  )}
                  <span className="text-[12px] text-white/80">Sound Alerts</span>
                </div>
                <span className="text-[10px] text-white/40">
                  {preferences.quotes.soundEnabled ? 'On' : 'Off'}
                </span>
              </button>
              
              {/* Auto-Refresh Toggle */}
              <button
                onClick={() => {
                  toggleAutoRefresh();
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  preferences.quotes.autoRefresh ? 'bg-blue-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className={preferences.quotes.autoRefresh ? 'text-blue-400' : 'text-white/60'} />
                  <span className="text-[12px] text-white/80">Auto-Refresh</span>
                </div>
                <span className="text-[10px] text-white/40">
                  {preferences.quotes.autoRefresh ? `${preferences.quotes.refreshInterval / 1000}s` : 'Off'}
                </span>
              </button>
              
              {/* Category Filter */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-[10px] text-white/40 mb-2 px-3">Filter</div>
                {['all', 'stocks', 'crypto', 'forex'].map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      handleCategoryChange(category);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left rounded-lg transition-colors ${
                      preferences.quotes.category === category
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[12px]">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Settings & Watchlist */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Settings size={14} className="text-white/60" />
                  <span className="text-[12px] text-white/80">Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    onOpenWatchlist();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Eye size={14} className="text-white/60" />
                  <span className="text-[12px] text-white/80">Watchlist</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ─── CONTENT ─── */}
      <div className="p-4">
        {isLoading && quotes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-[12px]">{error}</p>
            <button
              onClick={fetchQuotes}
              className="mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 
                         text-blue-400 rounded-lg text-[12px] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-[12px]">No quotes available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 rounded-lg 
                           bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white/80">
                      {quote.symbol.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white">{quote.symbol}</div>
                    <div className="text-[10px] text-white/40 capitalize">{quote.category}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-[14px] font-bold text-white">
                    ${quote.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-[11px] font-medium ${
                      quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {quote.changePercent >= 0 ? '+' : ''}
                    {quote.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default QuotesSectionExample;
