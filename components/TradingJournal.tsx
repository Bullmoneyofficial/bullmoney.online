'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import TradingCalendar from './TradingCalendar';
import TradeStatistics from './TradeStatistics';
import TradeEntryModal from './TradeEntryModal';
import { TradeDB } from '@/types/tradingJournal';
import { calculateComprehensiveStats } from '@/lib/tradingCalculations';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, Calendar, BarChart3, Filter, Download, Upload, Lock, LogIn } from 'lucide-react';

type ViewMode = 'calendar' | 'list' | 'statistics';

// Sample preview data for non-logged-in users
const PREVIEW_STATS = {
  totalTrades: 47,
  winRate: 68,
  profitFactor: 2.4,
  totalNetProfit: 12580,
  wins: 32,
  losses: 15,
};

const PREVIEW_TRADES = [
  { id: '1', asset_symbol: 'XAUUSD', direction: 'long', outcome: 'win', net_pnl: 850, trade_date: new Date().toISOString() },
  { id: '2', asset_symbol: 'BTCUSD', direction: 'short', outcome: 'win', net_pnl: 1200, trade_date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', asset_symbol: 'EURUSD', direction: 'long', outcome: 'loss', net_pnl: -320, trade_date: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', asset_symbol: 'AAPL', direction: 'long', outcome: 'win', net_pnl: 450, trade_date: new Date(Date.now() - 259200000).toISOString() },
  { id: '5', asset_symbol: 'NVDA', direction: 'short', outcome: 'win', net_pnl: 680, trade_date: new Date(Date.now() - 345600000).toISOString() },
];

interface TradingJournalProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export default function TradingJournal({ isEmbedded = false, onClose }: TradingJournalProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [trades, setTrades] = useState<TradeDB[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<TradeDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeDB | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterAssetType, setFilterAssetType] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [tradeImages, setTradeImages] = useState<{[tradeId: string]: string[]}>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authError, setAuthError] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null); // null = checking, true/false = determined
  const { recruit, isAuthenticated: isRecruitAuthenticated, isLoading: recruitAuthLoading } = useRecruitAuth();
  const isCurrentUserRecruit = currentUser?.user_type === 'recruit';

  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    if (isRecruitAuthenticated && recruit) {
      const recruitUser = {
        id: String(recruit.id),
        email: recruit.email,
        user_type: 'recruit',
      };

      setCurrentUser((prev: any) => {
        if (prev && prev.id === recruitUser.id && prev.user_type === 'recruit') {
          return prev;
        }
        return recruitUser;
      });
      setHasSession(true);
      setAuthError(false);
      return;
    }

    if (!recruitAuthLoading && isCurrentUserRecruit && !isRecruitAuthenticated) {
      setCurrentUser(null);
      setHasSession(null);
      setAuthError(false);
      setLoading(true);
    }
  }, [isRecruitAuthenticated, recruit, recruitAuthLoading, isCurrentUserRecruit]);

  // Memoized loaders/filters defined early so hooks below can reference them safely
  const loadTrades = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(false);

      const userId = currentUser?.id;

      if (!userId) {
        console.warn('loadTrades called without userId');
        setAuthError(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId.toString())
        .order('entry_date', { ascending: false });

      if (error) {
        console.log('Trades query error:', error);
        setTrades([]);
        setLoading(false);
        return;
      }

      setTrades(data || []);

      if (data && data.length > 0) {
        const { data: images } = await supabase
          .from('trade_images')
          .select('trade_id, image_url')
          .in('trade_id', data.map(t => t.id));

        if (images) {
          const imageMap: { [key: string]: string[] } = {};
          images.forEach(img => {
            if (!imageMap[img.trade_id]) imageMap[img.trade_id] = [];
            imageMap[img.trade_id].push(img.image_url);
          });
          setTradeImages(imageMap);
        }
      }
    } catch (error) {
      console.error('Load trades error:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, supabase]);

  const applyFilters = useCallback(() => {
    let filtered = [...trades];

    if (filterAssetType !== 'all') {
      filtered = filtered.filter(t => t.asset_type === filterAssetType);
    }

    if (filterOutcome !== 'all') {
      filtered = filtered.filter(t => t.outcome === filterOutcome);
    }

    filtered = filtered.filter(t => {
      const tradeDate = new Date(t.trade_date);
      return tradeDate >= dateRange.start && tradeDate <= dateRange.end;
    });

    setFilteredTrades(filtered);
  }, [trades, filterAssetType, filterOutcome, dateRange]);

  // Check both pagemode session AND Supabase auth on mount and listen for changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let isMounted = true;
    let lastUserId: string | null | undefined = undefined; // undefined = not yet checked, null = no user, string = user id
    
    // Check all authentication methods and set user info
    const checkAuth = async () => {
      if (!isMounted) return;
      if (isRecruitAuthenticated && recruit) {
        return;
      }
      
      let foundUserId: string | null = null;
      let foundEmail: string | null = null;
      let foundUserType: string = 'unknown';
      
      // Method 1: Check pagemode localStorage session (primary method for recruits)
      const pagemodeSession = localStorage.getItem('bullmoney_session');
      if (pagemodeSession) {
        try {
          const sessionData = JSON.parse(pagemodeSession);
          // Validate the session has required data
          if (sessionData?.id && sessionData?.email) {
            foundUserId = String(sessionData.id);
            foundEmail = sessionData.email;
            foundUserType = 'recruit';
          }
        } catch (e) {
          // Invalid JSON, continue to other methods
        }
      }
      
      // Method 2: Check recruit auth storage (backup)
      if (!foundUserId) {
        const recruitAuth = localStorage.getItem('bullmoney_recruit_auth');
        if (recruitAuth) {
          try {
            const authData = JSON.parse(recruitAuth);
            if (authData?.recruitId && authData?.email) {
              foundUserId = String(authData.recruitId);
              foundEmail = authData.email;
              foundUserType = 'recruit';
            }
          } catch (e) {
            // Invalid JSON, continue
          }
        }
      }
      
      // Method 3: Check Supabase auth directly (for auth.users)
      if (!foundUserId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            foundUserId = user.id;
            foundEmail = user.email || '';
            foundUserType = 'auth';
          }
        } catch (e) {
          // Supabase auth check failed
        }
      }
      
      if (!isMounted) return;
      
      // Update state if this is the first check OR if user changed
      if (lastUserId === undefined || foundUserId !== lastUserId) {
        if (!foundUserId && recruitAuthLoading) {
          return;
        }
        lastUserId = foundUserId;
        
        if (foundUserId) {
          setCurrentUser({
            id: foundUserId,
            email: foundEmail,
            user_type: foundUserType
          });
          setHasSession(true);
          setAuthError(false); // Clear auth error when session is found
        } else {
          setCurrentUser(null);
          setHasSession(false);
          setAuthError(true); // Set auth error when no session found
          setLoading(false); // Stop loading immediately if no session
        }
      }
    };
    
    // Initial check
    checkAuth();
    
    // Listen for storage changes (when pagemode sets the session)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bullmoney_session' || 
          e.key === 'bullmoney_recruit_auth' || 
          e.key === 'bullmoney_pagemode_completed') {
        checkAuth();
      }
    };
    
    // Also listen for custom event dispatched by pagemode
    const handleSessionChange = () => {
      checkAuth();
    };
    
    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        checkAuth();
      }
    });
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bullmoney_session_changed', handleSessionChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bullmoney_session_changed', handleSessionChange);
      subscription.unsubscribe();
    };
  }, [supabase, isRecruitAuthenticated, recruit, recruitAuthLoading]);

  useEffect(() => {
    // Only attempt to load trades if user has a valid session and currentUser is set
    // Use currentUser.id as dependency to prevent reloading when object reference changes
    if (hasSession === true && currentUser?.id) {
      loadTrades();
    } else if (hasSession === false) {
      setLoading(false);
      setAuthError(true);
    }
    // If hasSession is null, we're still checking - keep loading state
  }, [hasSession, currentUser?.id, loadTrades]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAddTrade = () => {
    setEditingTrade(null);
    setShowTradeModal(true);
  };

  const handleEditTrade = (trade: TradeDB) => {
    setEditingTrade(trade);
    setShowTradeModal(true);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;
      
      await loadTrades();
    } catch (error) {
      // Silently handle deletion errors
    }
  };

  const handleTradeSubmitted = () => {
    setShowTradeModal(false);
    setEditingTrade(null);
    loadTrades();
  };

  const stats = calculateComprehensiveStats(
    filteredTrades.map(t => ({
      id: t.id,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      quantity: t.quantity,
      direction: t.direction,
      entry_fee: t.entry_fee,
      exit_fee: t.exit_fee,
      funding_fees: t.funding_fees,
      gross_pnl: t.gross_pnl,
      net_pnl: t.net_pnl,
      outcome: t.outcome,
      risk_amount: t.risk_amount,
      reward_amount: t.reward_amount,
      leverage: t.leverage,
    }))
  );

  const exportTrades = () => {
    const csv = convertToCSV(filteredTrades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (data: TradeDB[]) => {
    const headers = [
      'Date', 'Symbol', 'Type', 'Direction', 'Entry', 'Exit', 'Quantity',
      'P&L', 'P&L %', 'Outcome', 'Strategy', 'Notes'
    ];
    
    const rows = data.map(t => [
      new Date(t.trade_date).toLocaleDateString(),
      t.asset_symbol,
      t.asset_type,
      t.direction,
      t.entry_price,
      t.exit_price || 'Open',
      t.quantity,
      t.net_pnl || 0,
      t.pnl_percentage || 0,
      t.outcome || 'Open',
      t.strategy || '',
      t.notes || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="h-full bg-black flex items-center justify-center p-4">
        <div className="text-blue-300 text-sm md:text-base neon-blue-text" style={{ textShadow: '0 0 8px #3b82f6' }}>Loading journal...</div>
      </div>
    );
  }

  if (authError) {
    // Show interactive preview with login prompt overlay
    const handleLoginClick = () => {
      if (isEmbedded) {
        // Clear pagemode completion to force it to show again
        localStorage.removeItem('bullmoney_pagemode_completed');
        if (onClose) {
          onClose();
        }
        router.push('/');
      } else {
        router.push('/login');
      }
    };

    return (
      <div className={`h-full bg-black ${isEmbedded ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'} relative`}>
        {/* Preview Content (blurred/dimmed) */}
        <div className={`${isEmbedded ? 'flex-1 overflow-y-auto p-2' : 'p-2 md:p-4'} max-w-7xl mx-auto filter blur-[2px] opacity-60 pointer-events-none select-none`}>
          {/* Header */}
          <div className="mb-2 md:mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className={`${isEmbedded ? 'text-sm' : 'text-base'} md:text-2xl font-bold text-blue-300 neon-blue-text truncate`} style={{ textShadow: '0 0 4px #3b82f6' }}>
                  Trading Journal
                </h1>
                <p className="text-blue-400/50 text-[10px] md:text-xs mt-0.5 truncate">
                  Preview Mode
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-500 
                         text-white rounded-lg font-semibold text-xs md:text-sm whitespace-nowrap">
                <Plus size={14} className="md:w-4 md:h-4" />
                Add Trade
              </div>
            </div>

            {/* Preview Quick Stats */}
            <div className="grid grid-cols-4 gap-1 md:gap-2 mt-2">
              <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
                <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">Trades</div>
                <div className="text-xs md:text-base font-bold text-blue-300">{PREVIEW_STATS.totalTrades}</div>
              </div>
              <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
                <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">Win Rate</div>
                <div className="text-xs md:text-base font-bold text-blue-300">{PREVIEW_STATS.winRate}%</div>
              </div>
              <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
                <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">P. Factor</div>
                <div className="text-xs md:text-base font-bold text-blue-300">{PREVIEW_STATS.profitFactor}</div>
              </div>
              <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
                <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">P&L</div>
                <div className="text-xs md:text-base font-bold text-green-400">+$12.5k</div>
              </div>
            </div>
          </div>

          {/* Preview Tabs */}
          <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4">
            <div className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-medium bg-blue-500 text-white">
              <Calendar size={12} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Calendar</span>
            </div>
            <div className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-medium bg-white/5 text-gray-400">
              <TrendingUp size={12} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">List</span>
            </div>
            <div className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-medium bg-white/5 text-gray-400">
              <BarChart3 size={12} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Stats</span>
            </div>
          </div>

          {/* Preview Trades List */}
          <div className="space-y-2">
            {PREVIEW_TRADES.map((trade) => (
              <div 
                key={trade.id}
                className="bg-black/50 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${trade.outcome === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="text-blue-300 font-bold text-sm">{trade.asset_symbol}</div>
                    <div className="text-blue-400/50 text-xs capitalize">{trade.direction}</div>
                  </div>
                </div>
                <div className={`font-bold text-sm ${trade.net_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.net_pnl >= 0 ? '+' : ''}{trade.net_pnl < 0 ? '-' : ''}${Math.abs(trade.net_pnl)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Overlay - Clickable */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer z-10"
          onClick={handleLoginClick}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="text-center max-w-sm mx-4 p-6 bg-black/80 border border-blue-500/30 rounded-2xl"
            style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center"
              animate={{ 
                boxShadow: ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 30px rgba(59, 130, 246, 0.5)', '0 0 20px rgba(59, 130, 246, 0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-8 h-8 text-blue-400" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-blue-300 mb-2 neon-blue-text" style={{ textShadow: '0 0 8px #3b82f6' }}>
              Unlock Your Journal
            </h3>
            <p className="text-blue-400/70 text-sm mb-5">
              Create a free account to track your trades, analyze performance, and improve your trading strategy.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoginClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 
                       text-white rounded-xl font-semibold shadow-lg hover:bg-blue-400 transition-all"
              style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}
            >
              <LogIn size={18} />
              {isEmbedded ? 'Sign Up Free' : 'Log In to Continue'}
            </motion.button>
            
            <div className="flex items-center justify-center gap-3 text-blue-400/40 text-xs mt-3">
              <span className="flex items-center gap-1"><TrendingUp size={12} /> Unlimited trades</span>
              <span className="flex items-center gap-1"><BarChart3 size={12} /> Analytics</span>
              <span className="flex items-center gap-1"><Lock size={12} /> Secure</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-black ${isEmbedded ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
      <div className={`${isEmbedded ? 'flex-1 overflow-y-auto p-2' : 'p-2 md:p-4'} max-w-7xl mx-auto`}>
        {/* Compact Header */}
        <div className="mb-2 md:mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className={`${isEmbedded ? 'text-sm' : 'text-base'} md:text-2xl font-bold text-blue-300 neon-blue-text truncate`} style={{ textShadow: '0 0 4px #3b82f6' }}>
                Trading Journal
              </h1>
              {currentUser && (
                <p className="text-blue-400/50 text-[10px] md:text-xs mt-0.5 truncate">
                  {currentUser.email || 'Your Account'}
                </p>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddTrade}
              className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-500 
                       text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all text-xs md:text-sm whitespace-nowrap"
              style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)' }}
            >
              <Plus size={14} className="md:w-4 md:h-4" />
              Add Trade
            </motion.button>
          </div>

          {/* Compact Quick Stats */}
          <div className="grid grid-cols-4 gap-1 md:gap-2 mt-2">
            <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
              <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">Trades</div>
              <div className="text-xs md:text-base font-bold text-blue-300">{stats.totalTrades}</div>
            </div>
            <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
              <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">Win Rate</div>
              <div className="text-xs md:text-base font-bold text-blue-300">
                {stats.winRate.toFixed(0)}%
              </div>
            </div>
            <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
              <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">P. Factor</div>
              <div className="text-xs md:text-base font-bold text-blue-300">
                {stats.profitFactor.toFixed(1)}
              </div>
            </div>
            <div className="bg-black rounded p-1.5 md:p-2 border border-blue-500/30" style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}>
              <div className="text-blue-400/70 text-[8px] md:text-[10px] mb-0.5">P&L</div>
              <div className={`text-xs md:text-base font-bold ${
                stats.totalNetProfit >= 0 ? 'text-blue-300' : 'text-blue-400/70'
              }`}>
                {stats.totalNetProfit >= 0 ? '+' : '-'}${Math.abs(stats.totalNetProfit) >= 1000 ? (Math.abs(stats.totalNetProfit)/1000).toFixed(1) + 'k' : Math.abs(stats.totalNetProfit).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Compact View Mode Tabs */}
        <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Calendar size={12} className="md:w-4 md:h-4" />
            <span className="hidden md:inline">Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp size={12} className="md:w-4 md:h-4" />
            <span className="hidden md:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all ${
              viewMode === 'statistics'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <BarChart3 size={12} className="md:w-4 md:h-4" />
            <span className="hidden md:inline">Stats</span>
          </button>

          {/* Compact Filters */}
          <div className="ml-auto flex gap-1 md:gap-2">
            <select
              value={filterAssetType}
              onChange={(e) => setFilterAssetType(e.target.value)}
              className="px-2 md:px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-[10px] md:text-xs
                       focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="options">Options</option>
              <option value="futures">Futures</option>
            </select>

            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-2 md:px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-[10px] md:text-xs
                       focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
            </select>

            <button
              onClick={exportTrades}
              className="hidden md:flex items-center gap-1 px-2 md:px-3 py-1 bg-white/5 border border-white/10 
                       rounded text-white hover:bg-white/10 transition-all text-xs"
            >
              <Download size={14} />
              <span className="hidden lg:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TradingCalendar
                trades={filteredTrades}
                tradeImages={tradeImages}
                onTradeClick={handleEditTrade}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-black/50 backdrop-blur-xl rounded-lg border border-blue-500/30 overflow-hidden"
              style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-500/10 border-b border-blue-500/30">
                    <tr>
                      <th className="px-2 md:px-4 py-2 text-left text-[10px] md:text-sm font-medium text-blue-400/70">Date</th>
                      <th className="px-2 md:px-4 py-2 text-left text-[10px] md:text-sm font-medium text-blue-400/70">Symbol</th>
                      <th className="hidden md:table-cell px-4 py-2 text-left text-sm font-medium text-blue-400/70">Type</th>
                      <th className="px-2 md:px-4 py-2 text-left text-[10px] md:text-sm font-medium text-blue-400/70">Dir</th>
                      <th className="hidden md:table-cell px-4 py-2 text-right text-sm font-medium text-blue-400/70">Entry</th>
                      <th className="hidden md:table-cell px-4 py-2 text-right text-sm font-medium text-blue-400/70">Exit</th>
                      <th className="px-2 md:px-4 py-2 text-right text-[10px] md:text-sm font-medium text-blue-400/70">P&L</th>
                      <th className="px-2 md:px-4 py-2 text-center text-[10px] md:text-sm font-medium text-blue-400/70">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/10">
                    {filteredTrades.slice(0, 50).map((trade) => (
                      <tr
                        key={trade.id}
                        className="hover:bg-blue-500/10 transition-colors cursor-pointer"
                        onClick={() => handleEditTrade(trade)}
                      >
                        <td className="px-2 md:px-4 py-2 text-[10px] md:text-sm text-blue-300">
                          {new Date(trade.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-2 md:px-4 py-2 text-[10px] md:text-sm font-medium text-blue-300">
                          {trade.asset_symbol}
                        </td>
                        <td className="hidden md:table-cell px-4 py-2 text-sm text-blue-400/70">
                          {trade.asset_type}
                        </td>
                        <td className="px-2 md:px-4 py-2 text-[10px] md:text-sm">
                          <span className={`px-1 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-xs font-medium ${
                            trade.direction === 'long' 
                              ? 'bg-blue-500/30 text-blue-300 border border-blue-400/60'
                              : 'bg-blue-500/20 text-blue-400/70 border border-blue-500/30'
                          }`}>
                            {trade.direction === 'long' ? 'L' : 'S'}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-2 text-sm text-right text-blue-300">
                          ${trade.entry_price.toFixed(2)}
                        </td>
                        <td className="hidden md:table-cell px-4 py-2 text-sm text-right text-blue-300">
                          {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
                        </td>
                        <td className={`px-2 md:px-4 py-2 text-[10px] md:text-sm text-right font-medium ${
                          (trade.net_pnl || 0) >= 0 ? 'text-blue-300' : 'text-blue-400/70'
                        }`}>
                          {trade.net_pnl ? `${trade.net_pnl >= 0 ? '+' : '-'}$${Math.abs(trade.net_pnl).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-2 md:px-4 py-2 text-center">
                          {trade.outcome && (
                            <span className={`inline-block w-2 h-2 md:w-3 md:h-3 rounded-full ${
                              trade.outcome === 'win' 
                                ? 'bg-blue-400'
                                : trade.outcome === 'loss'
                                ? 'bg-blue-500/40'
                                : 'bg-blue-500/20'
                            }`} />
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredTrades.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-blue-400/70 text-sm">
                          No trades found. Add your first trade to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {viewMode === 'statistics' && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TradeStatistics trades={filteredTrades} stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trade Entry Modal */}
      <AnimatePresence>
        {showTradeModal && (
          <TradeEntryModal
            trade={editingTrade}
            onClose={() => {
              setShowTradeModal(false);
              setEditingTrade(null);
            }}
            onSubmit={handleTradeSubmitted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
