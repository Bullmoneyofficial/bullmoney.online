"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp,
  ChevronRight,
  BarChart3,
  Globe,
  Bitcoin,
  Coins,
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';

// Trading symbols configuration
const symbols = [
  {
    id: 'xauusd',
    name: 'XAUUSD',
    displayName: 'Gold',
    abbreviation: 'Gold',
    symbol: 'OANDA:XAUUSD',
    icon: Coins,
  },
  {
    id: 'btcusd',
    name: 'BTCUSD',
    displayName: 'Bitcoin',
    abbreviation: 'BTC',
    symbol: 'BITSTAMP:BTCUSD',
    icon: Bitcoin,
  }
];

const importanceLevels = [
  { value: '0', label: 'Low', color: 'bg-blue-900/30' },
  { value: '1', label: 'Medium', color: 'bg-blue-700/50' },
  { value: '2', label: 'High', color: 'bg-blue-500/70' },
  { value: '3', label: 'Critical', color: 'bg-blue-400/90' }
];

const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY', 'USDT', 'USDC', 'BUSD', 'PAXG'
];

export function TradingQuickAccess() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeChart, setActiveChart] = useState('xauusd');
  const [showForexFactory, setShowForexFactory] = useState(false);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const [otherHovered, setOtherHovered] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({
    xauusd: '...',
    btcusd: '...'
  });
  const [calendarImportance, setCalendarImportance] = useState<string[]>(['2', '3']); // High and Medium
  const [calendarCurrencies, setCalendarCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY']);
  const [mounted, setMounted] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [secretHovered, setSecretHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'live'>('featured');
  const [playerKey, setPlayerKey] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [liveChannelId, setLiveChannelId] = useState<string>('UCTd2Y1DjefTH6bOAvFcJ34Q');
  const [tradingChannelIndex, setTradingChannelIndex] = useState(0);
  const featuredVideos = ['Q3dSjSP3t8I', 'xvP1FJt-Qto'];
  
  // Popular trading/forex YouTube channels to pull live streams from when BullMoney isn't live
  const tradingLiveChannels = [
    { id: 'UCrp_UI8XtuYfpiqluWLD7Lw', name: 'The Trading Channel' },
    { id: 'UCGnHwBJHZ0JCN8t8EA0PLQA', name: 'Rayner Teo' },
    { id: 'UC2C_jShtL725hvbm1arSV9w', name: 'Matt Kohrs' },
    { id: 'UCduLPLzWNkL-8aCJohrmJhw', name: 'Ziptrader' },
    { id: 'UCnqZ2hx679O1JBIRDlJNzKA', name: 'TradeZella' },
    { id: 'UCU8WjbDkHFUfIGBnrkA6zRg', name: 'Humbled Trader' },
    { id: 'UCpmAlqg4X-UdHcSL4aPTPqw', name: 'Warrior Trading' },
  ];
  
  // YouTube channels to check for live streams
  const youtubeChannels = [
    { id: 'UCTd2Y1DjefTH6bOAvFcJ34Q', name: 'BullMoney Streams' },
    { id: 'UC_gaming_channel', name: 'BullMoney Gaming' } // Gaming channel
  ];
  const panelRef = useRef<HTMLDivElement>(null);
  const secretButtonRef = useRef<HTMLDivElement>(null);

  // Trading tips that rotate
  const tradingTips = [
    "Check the price out! 📈",
    "Gold often moves inverse to USD 💰",
    "Watch for support & resistance levels",
    "Use RSI for overbought/oversold signals",
    "MACD crossovers signal trend changes",
    "Volume confirms price movements",
    "Higher highs = bullish trend 🟢",
    "Lower lows = bearish trend 🔴",
    "200+ chart analysis tools inside!",
    "Set stop losses to manage risk",
    "News events move markets fast ⚡",
    "Fibonacci levels mark key zones",
    "Bollinger Bands show volatility",
    "Moving averages smooth price action",
    "Candlestick patterns reveal sentiment",
    "Doji = market indecision",
    "Engulfing candles signal reversals",
    "Head & shoulders = trend reversal",
    "Double tops/bottoms are key patterns",
    "Triangles precede breakouts",
    "Always check the daily timeframe",
    "Correlation: Gold vs DXY inverse 📊",
    "BTC leads crypto market moves",
    "London & NY sessions = high volume",
    "Asian session = range-bound trading",
    "NFP Fridays = major USD moves",
    "FOMC meetings = volatility spikes",
    "Risk management > prediction",
    "1% risk per trade is wise",
    "Trend is your friend 🎯",
    "Don't fight the Fed",
    "Buy the rumor, sell the news",
    "Patience is a trader's virtue",
    "Emotions kill trading accounts",
    "Journal every trade you make",
    "Backtest before going live",
    "Paper trade to learn first",
    "ATR measures true volatility",
    "Pivot points mark intraday levels",
    "VWAP is institutional favorite",
    "Order flow reveals big players",
    "Liquidity pools attract price",
    "Fair value gaps get filled",
    "Market structure = key concept",
    "Break of structure = momentum",
    "Change of character = reversal",
    "Smart money concepts work",
    "ICT methodology is powerful",
    "Supply & demand zones matter",
    "Imbalances create opportunities",
  ];
  
  // UI State awareness - use centralized state for Discord Stage modal
  const { 
    isAnyModalOpen, 
    isMobileMenuOpen, 
    isUltimatePanelOpen, 
    isV2Unlocked,
    isDiscordStageModalOpen,
    setDiscordStageModalOpen
  } = useUIState();
  
  // Wait for client-side mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Check if secret is unlocked from localStorage
    const unlocked = localStorage.getItem('discord-stage-unlocked');
    if (unlocked === 'true') {
      setSecretUnlocked(true);
    }
  }, []);

  // Auto-close when other UI elements open
  useEffect(() => {
    if (isAnyModalOpen || isMobileMenuOpen || isUltimatePanelOpen) {
      setIsExpanded(false);
      // Discord Stage modal is handled by UIState mutual exclusion
    }
  }, [isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen]);
  
  // Close when BrowserSwitchTab opens (mutual exclusion)
  useEffect(() => {
    const handleBrowserOpen = () => setIsExpanded(false);
    window.addEventListener('browserSwitchOpened', handleBrowserOpen);
    return () => window.removeEventListener('browserSwitchOpened', handleBrowserOpen);
  }, []);
  
  // Dispatch event when this component opens
  useEffect(() => {
    if (isExpanded) {
      window.dispatchEvent(new CustomEvent('tradingQuickAccessOpened'));
      // Discord Stage modal is handled by UIState mutual exclusion
    } else {
      window.dispatchEvent(new CustomEvent('tradingQuickAccessClosed'));
    }
  }, [isExpanded]);
  
  // Secret modal state tracking - Trigger video play when modal opens
  useEffect(() => {
    if (isDiscordStageModalOpen) {
      // Reset state when modal opens
      setFeaturedIndex(0);
      setPlayerKey(prev => prev + 1);
      
      // Check if any channel is live - if yes, show live tab; otherwise featured
      const checkLiveStatus = async () => {
        // Check both channels for live status (using channel IDs)
        // @bullmoney.streams = UCTd2Y1DjefTH6bOAvFcJ34Q
        // @bullmoney.gaming = need to get this ID, using handle for now
        const channelsToCheck = [
          { id: 'UCTd2Y1DjefTH6bOAvFcJ34Q', handle: 'bullmoney.streams' },
          { id: null, handle: 'bullmoney.gaming' }
        ];
        
        for (const channel of channelsToCheck) {
          try {
            // Try channel ID first, then handle
            const url = channel.id 
              ? `https://www.youtube.com/oembed?url=https://www.youtube.com/channel/${channel.id}/live&format=json`
              : `https://www.youtube.com/oembed?url=https://www.youtube.com/@${channel.handle}/live&format=json`;
            
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              // Check if it's actually a live stream (not just a video)
              if (data.title) {
                setIsLive(true);
                // Store the channel ID or handle for the embed
                setLiveChannelId(channel.id || channel.handle);
                setActiveTab('live'); // Auto-switch to live when streaming
                return; // Found a live stream, stop checking
              }
            }
          } catch {
            // This channel not live, continue checking
          }
        }
        
        // No channels are live - pick a random trading channel for the live tab
        setIsLive(false);
        setTradingChannelIndex(Math.floor(Math.random() * tradingLiveChannels.length));
        setActiveTab('featured'); // Default to featured when not live
      };
      
      checkLiveStatus();
    }
  }, [isDiscordStageModalOpen]);

  // Build the YouTube embed URL based on active tab
  const youtubeEmbedUrl = useMemo(() => {
    if (activeTab === 'live') {
      if (isLive) {
        // Actually live - use the channel that's currently live
        const isChannelId = liveChannelId.startsWith('UC');
        if (isChannelId) {
          return `https://www.youtube.com/embed/live_stream?channel=${liveChannelId}&autoplay=1&mute=0&rel=0&modestbranding=1`;
        } else {
          return `https://www.youtube.com/embed?listType=user_uploads&list=${liveChannelId}&autoplay=1&mute=0&rel=0&modestbranding=1`;
        }
      } else {
        // Not live - pull live stream from a trading channel
        const channel = tradingLiveChannels[tradingChannelIndex] || tradingLiveChannels[0];
        return `https://www.youtube.com/embed/live_stream?channel=${channel.id}&autoplay=1&mute=0&rel=0&modestbranding=1`;
      }
    }
    // Featured tab - show the selected featured video
    const videoId = featuredVideos[featuredIndex] || 'Q3dSjSP3t8I';
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`;
  }, [activeTab, featuredIndex, liveChannelId, isLive, tradingChannelIndex]);
  
  // Unlock secret permanently on hover - stable without closing other menus
  const handleSecretHover = () => {
    if (!secretUnlocked) {
      setSecretUnlocked(true);
      localStorage.setItem('discord-stage-unlocked', 'true');
    }
    setSecretHovered(true);
    setDiscordStageModalOpen(true); // Use UIState - closes all other modals/menus
  };
  
  const handleSecretUnhover = () => {
    setSecretHovered(false);
    // Don't close modal on unhover - let user click to close
  };

  // Hide when other menus open or are being hovered
  useEffect(() => {
    const handleBrowserOpen = () => { setOtherMenuOpen(true); setIsExpanded(false); };
    const handleBrowserClose = () => setOtherMenuOpen(false);
    const handleCommunityOpen = () => { setOtherMenuOpen(true); setIsExpanded(false); };
    const handleCommunityClose = () => setOtherMenuOpen(false);
    const handleOtherHoverStart = () => { setOtherHovered(true); setIsExpanded(false); };
    const handleOtherHoverEnd = () => setOtherHovered(false);
    
    window.addEventListener('browserSwitchOpened', handleBrowserOpen);
    window.addEventListener('browserSwitchClosed', handleBrowserClose);
    window.addEventListener('communityQuickAccessOpened', handleCommunityOpen);
    window.addEventListener('communityQuickAccessClosed', handleCommunityClose);
    window.addEventListener('browserSwitchHovered', handleOtherHoverStart);
    window.addEventListener('browserSwitchUnhovered', handleOtherHoverEnd);
    window.addEventListener('communityQuickAccessHovered', handleOtherHoverStart);
    window.addEventListener('communityQuickAccessUnhovered', handleOtherHoverEnd);
    
    return () => {
      window.removeEventListener('browserSwitchOpened', handleBrowserOpen);
      window.removeEventListener('browserSwitchClosed', handleBrowserClose);
      window.removeEventListener('communityQuickAccessOpened', handleCommunityOpen);
      window.removeEventListener('communityQuickAccessClosed', handleCommunityClose);
      window.removeEventListener('browserSwitchHovered', handleOtherHoverStart);
      window.removeEventListener('browserSwitchUnhovered', handleOtherHoverEnd);
      window.removeEventListener('communityQuickAccessHovered', handleOtherHoverStart);
      window.removeEventListener('communityQuickAccessUnhovered', handleOtherHoverEnd);
    };
  }, []);

  // Reset otherMenuOpen when they close
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isExpanded) {
        setOtherMenuOpen(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Live price updates from real API - Updates every 2 seconds (optimized)
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchPrices = async () => {
      if (!isMounted) return;
      
      try {
        // Use timestamp to prevent caching
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        let response;
        try {
          response = await fetch(`/api/prices/live?t=${Date.now()}`, { 
            cache: 'no-store',
            headers: { 
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          });
        } catch (fetchError) {
          // Network error - silently fail and use cached prices
          clearTimeout(timeoutId);
          return;
        }
        
        clearTimeout(timeoutId);
        
        if (!response || !response.ok) {
          // HTTP error - silently fail
          return;
        }
        
        const data = await response.json();
        
        if (isMounted && data) {
          // Update prices only if values actually changed (prevents infinite loops)
          setPrices(prev => {
            const newXauusd = data.xauusd || prev.xauusd;
            const newBtcusd = data.btcusd || prev.btcusd;
            // Only update state if values changed
            if (prev.xauusd === newXauusd && prev.btcusd === newBtcusd) {
              return prev; // Return same reference to prevent re-render
            }
            return {
              xauusd: newXauusd,
              btcusd: newBtcusd
            };
          });
          
          // Reset retry count on success
          retryCount = 0;
        }
      } catch (error) {
        // Silently handle all errors - keep existing prices
        if (process.env.NODE_ENV === 'development') {
          console.warn('Price fetch issue:', error);
        }
      }
    };

    // Initial fetch with small delay
    const initialTimeout = setTimeout(fetchPrices, 500);
    
    // Update every 3 seconds instead of 2 for better performance (reduced API pressure)
    const interval = setInterval(fetchPrices, 3000);
    
    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []); // Empty deps - run once and maintain interval

  // Rotate trading tips with slot machine spin effect
  useEffect(() => {
    const tipInterval = setInterval(() => {
      // Start spinning
      setIsSpinning(true);
      
      // After spin animation, show new tip
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % tradingTips.length);
        setIsSpinning(false);
      }, 800); // Spin duration
    }, 5000); // Time between spins
    return () => clearInterval(tipInterval);
  }, [tradingTips.length]);

  // Hide ALL UI when Discord Stage is open (except the modal itself)
  // Also hide for other modals, mobile menu, ultimate panel
  const shouldHideForDiscordStage = isDiscordStageModalOpen;
  const shouldHideForOtherModals = isAnyModalOpen && !isDiscordStageModalOpen;
  const shouldHide = !mounted || !isV2Unlocked || isMobileMenuOpen || isUltimatePanelOpen || shouldHideForOtherModals || shouldHideForDiscordStage;
  
  // Prevent hover-open when another panel is active
  const canOpen = !otherMenuOpen && !otherHovered;
  
  // Debounced hover handlers to prevent excessive re-renders
  const handleMouseEnter = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tradingQuickAccessHovered'));
    if (canOpen) setIsExpanded(true);
    
    // Unlock secret on ANY hover of the trading pill
    if (!secretUnlocked) {
      setSecretUnlocked(true);
      localStorage.setItem('discord-stage-unlocked', 'true');
    }
  }, [canOpen, secretUnlocked]);
  
  const handleMouseLeave = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tradingQuickAccessUnhovered'));
  }, []);

  // Discord Stage Modal - ALWAYS render this, even when shouldHide is true
  // This modal appears on top of everything when open
  // LAZY LOAD: Only render iframe when modal is open to save resources
  const discordStageModal = (
    <AnimatePresence>
      {isDiscordStageModalOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 bg-black/95"
        >
          {/* Click overlay - transparent, just for click handling */}
          <div className="absolute inset-0 bg-transparent" onClick={() => setDiscordStageModalOpen(false)} />
          
          {/* Tap to close hints - Top */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
            transition={{ opacity: { duration: 2, repeat: Infinity }, y: { duration: 0.3 } }}
            className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-purple-300/50 text-xs sm:text-sm pointer-events-none"
          >
            <span>↑</span>
            <span>Tap anywhere to close</span>
            <span>↑</span>
          </motion.div>

          {/* Tap to close hints - Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
            transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.5 }, y: { duration: 0.3 } }}
            className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-purple-300/50 text-xs sm:text-sm pointer-events-none"
          >
            <span>↓</span>
            <span>Tap anywhere to close</span>
            <span>↓</span>
          </motion.div>

          {/* Tap to close hints - Left */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: [0.3, 0.6, 0.3], x: 0 }}
            transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.25 }, x: { duration: 0.3 } }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-purple-300/40 text-[10px] sm:text-xs pointer-events-none"
          >
            <span>←</span>
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Tap to close</span>
          </motion.div>

          {/* Tap to close hints - Right */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: [0.3, 0.6, 0.3], x: 0 }}
            transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.75 }, x: { duration: 0.3 } }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-purple-300/40 text-[10px] sm:text-xs pointer-events-none"
          >
            <span>→</span>
            <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
          </motion.div>
          
          {/* Centered Modal Panel */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/98 via-purple-900/95 to-zinc-900/98 backdrop-blur-2xl border border-purple-500/50 shadow-2xl shadow-purple-900/50"
          >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-purple-500/30 bg-purple-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-purple-100">
                      BullMoney TV
                    </h3>
                    {isLive && (
                      <motion.div
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded-full"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span className="text-[8px] font-bold text-red-400">LIVE NOW</span>
                      </motion.div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDiscordStageModalOpen(false)}
                    className="flex items-center gap-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/40 justify-center transition-colors group"
                  >
                    <span className="text-purple-200 text-sm sm:text-base font-bold">×</span>
                  </motion.button>
                </div>
                <p className="text-[9px] sm:text-[10px] text-purple-300/60 mt-1">Click outside or press ESC to close</p>
                
                {/* Tab Buttons - Featured First, Live Second */}
                <div className="flex gap-2 mt-3">
                  <motion.button
                    onClick={() => {
                      setActiveTab('featured');
                      setPlayerKey(prev => prev + 1);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'featured'
                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Featured
                    <span className="text-[10px] opacity-70">({featuredIndex + 1}/{featuredVideos.length})</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      setActiveTab('live');
                      // Pick a new random channel each time they click if not live
                      if (!isLive) {
                        setTradingChannelIndex(Math.floor(Math.random() * tradingLiveChannels.length));
                      }
                      setPlayerKey(prev => prev + 1);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'live'
                        ? isLive ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-400' : 'bg-white/50'}`}
                      animate={isLive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {isLive ? 'Live Stream' : 'Trading'}
                    {isLive && <span className="text-[10px] text-red-200">• ON AIR</span>}
                  </motion.button>
                </div>
              </div>

              {/* Single Smart Video Player */}
              <div className="relative w-full flex flex-col bg-[#0f0f0f]">
                {/* Video Player - switches between Featured and Live based on tab */}
                <div className="w-full bg-black relative" style={{ minHeight: '280px' }}>
                  {isDiscordStageModalOpen && (
                    <iframe 
                      key={`discord-player-${playerKey}-${activeTab}-${featuredIndex}`}
                      src={`${youtubeEmbedUrl}&t=${playerKey}`}
                      width="100%" 
                      height="280"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ border: 'none' }}
                      title="BullMoney Stream"
                    />
                  )}
                  
                  {/* Next/Prev for Featured Videos - only show on Featured tab */}
                  {activeTab === 'featured' && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <motion.button
                        onClick={() => {
                          setFeaturedIndex(prev => (prev - 1 + featuredVideos.length) % featuredVideos.length);
                          setPlayerKey(prev => prev + 1);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                      </motion.button>
                      <span className="text-white/70 text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                        {featuredIndex + 1} / {featuredVideos.length}
                      </span>
                      <motion.button
                        onClick={() => {
                          setFeaturedIndex(prev => (prev + 1) % featuredVideos.length);
                          setPlayerKey(prev => prev + 1);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                      </motion.button>
                    </div>
                  )}
                  
                  {/* Live indicator overlay when on Live tab */}
                  {activeTab === 'live' && (
                    <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold text-white ${isLive ? 'bg-red-600/90' : 'bg-purple-600/90'}`}>
                      {isLive ? (
                        <>
                          <motion.div
                            className="w-2 h-2 bg-white rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          LIVE NOW
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          {tradingLiveChannels[tradingChannelIndex]?.name || 'Trading Live'}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Next channel button for trading when not live */}
                  {activeTab === 'live' && !isLive && (
                    <div className="absolute bottom-2 right-2">
                      <motion.button
                        onClick={() => {
                          setTradingChannelIndex(prev => (prev + 1) % tradingLiveChannels.length);
                          setPlayerKey(prev => prev + 1);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600/90 hover:bg-purple-500 rounded text-[10px] font-bold text-white"
                      >
                        Next Channel
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Platform Tabs */}
                <div className="flex bg-[#1a1a1a] border-b border-white/10">
                  <a 
                    href="https://youtube.com/@bullmoney.streams" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-red-600/20 transition-all"
                  >
                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </a>
                  <a 
                    href="https://discord.gg/vfxHPpCeQ" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-[#5865F2]/20 transition-all"
                  >
                    <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Discord
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="p-3 space-y-2 bg-[#1a1a1a]">
                  {/* Primary Buttons Row */}
                  <div className="flex gap-2">
                    <motion.a
                      href="https://youtube.com/@bullmoney.streams?sub_confirmation=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Subscribe
                    </motion.a>
                    <motion.a
                      href="https://discord.gg/vfxHPpCeQ"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-3 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.107 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.025-.02.05-.041.075-.062a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.025.02.05.042.075.063a.077.077 0 0 1-.007.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                      </svg>
                      Join Discord
                    </motion.a>
                  </div>

                  {/* Live Stream Link */}
                  <motion.a
                    href="https://youtube.com/@bullmoney.streams/live"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-white/90 font-semibold rounded-lg flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    <motion.div
                      className="w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    Watch Live Stream
                  </motion.a>

                  {/* Stage Channel Link */}
                  <motion.a
                    href="https://discord.com/channels/1293532691542708276/1410093730131873893"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-white/10 text-white/80 font-semibold rounded-lg flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <path d="M12 19v3"/>
                    </svg>
                    Discord Stage Channel
                  </motion.a>

                  {/* Info */}
                  <p className="text-white/40 text-[10px] text-center pt-1">
                    Watch live on YouTube or join Discord Stage for audio
                  </p>
                </div>
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Return ONLY the modal if everything else should be hidden
  if (shouldHide || otherMenuOpen) {
    return discordStageModal;
  }

  const handleDiscordClick = () => {
    window.open('https://discord.gg/bullmoney', '_blank', 'noopener,noreferrer');
  };

  const toggleImportance = (level: string) => {
    setCalendarImportance(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const toggleCurrency = (currency: string) => {
    setCalendarCurrencies(prev => 
      prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  };

  // Build calendar URL with filters
  const getCalendarUrl = () => {
    const importanceParam = calendarImportance.length > 0 
      ? calendarImportance.sort().join('%2C')
      : '0%2C1%2C2%2C3';
    const currenciesParam = calendarCurrencies.join('%2C');
    
    return `https://www.tradingview.com/embed-widget/events/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%22${importanceParam}%22%2C%22currencyFilter%22%3A%22${currenciesParam}%22%2C%22utm_source%22%3A%22bullmoney.shop%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22events%22%7D`;
  };

  return (
    <>
      {/* Live Price Pill - Positioned below Browser Switch Tab */}
      <motion.div
        data-trading-panel="true"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 80,
          damping: 20,
          delay: 0.3,
          mass: 0.8
        }}
        className="fixed left-0 z-[250000] pointer-events-none"
        style={{
          top: 'calc(5rem + env(safe-area-inset-top, 0px) + 28px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 2px)',
        }}
      >
        <motion.div
          whileHover={{ 
            x: 12, 
            scale: 1.05,
            boxShadow: '0 0 30px rgba(96, 165, 250, 0.6)'
          }}
          className="relative pointer-events-auto cursor-pointer"
          onClick={() => canOpen && setIsExpanded(!isExpanded)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animate={{
            x: [0, 8, 0, 6, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
            times: [0, 0.3, 0.5, 0.8, 1]
          }}
        >
          {/* Pill Content */}
          <div className="relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl hover:border-blue-400/70 hover:shadow-blue-600/40">
            {/* Enhanced pulsing glow background - OPTIMIZED: reduced from 2s to 3s to reduce jank */}
            <motion.div
              className="absolute inset-0 rounded-r-full bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-transparent opacity-0"
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ filter: 'blur(8px)' }}
            />
            
            {/* Subtle shine effect */}
            <motion.div
              className="absolute inset-0 rounded-r-full"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(96, 165, 250, 0)',
                  '0 0 20px rgba(96, 165, 250, 0.4)',
                  '0 0 10px rgba(96, 165, 250, 0)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            <div className="px-1 py-1 xs:px-1.5 xs:py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2.5 flex items-center gap-0.5 sm:gap-1 md:gap-1.5 relative z-10">
              {/* Live Indicator */}
              <motion.div
                className="w-1 h-1 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"
                animate={{ 
                  opacity: [1, 0.4, 1],
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0px rgba(96, 165, 250, 1)',
                    '0 0 8px rgba(96, 165, 250, 0.8)',
                    '0 0 0px rgba(96, 165, 250, 1)'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />

              {/* Prices */}
              <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2">
                <div className="flex items-center gap-0.5">
                  <Coins className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300 drop-shadow-[0_0_3px_rgba(147,197,253,0.5)]" />
                  <span className="text-[6px] xs:text-[7px] sm:text-[9px] md:text-[10px] font-bold text-blue-200">
                    ${prices.xauusd}
                  </span>
                </div>
                <div className="w-px h-1.5 xs:h-2 sm:h-2.5 md:h-3 bg-blue-500/30" />
                <div className="flex items-center gap-0.5">
                  <Bitcoin className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300 drop-shadow-[0_0_3px_rgba(147,197,253,0.5)]" />
                  <span className="text-[6px] xs:text-[7px] sm:text-[9px] md:text-[10px] font-bold text-blue-200">
                    ${prices.btcusd}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-blue-400/70" />
              </motion.div>
            </div>
          </div>
          
          {/* Trading Tip - Matching Price Pill Style */}
          {!isExpanded && (
            <motion.div
              data-trading-tip="true"
              initial={{ opacity: 0, y: -8, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -8, x: -20 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 25,
                delay: 0.5
              }}
              className="mt-1 sm:mt-1.5 trading-tip-pill-container"
            >
              {/* Pill Container - Same style as price UI */}
              <div className="trading-tip-pill relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl hover:border-blue-400/70 hover:shadow-blue-600/40 transition-all duration-300 px-1.5 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 overflow-hidden max-w-[150px] xs:max-w-[180px] sm:max-w-none lg:min-w-[140px] xl:min-w-[160px] 2xl:min-w-[180px]">
                {/* Animated tip pulse background */}
                <motion.div
                  className="absolute inset-0 rounded-r-full bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent"
                  animate={{
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'easeInOut'
                  }}
                />
                
                {/* Animated tip icon */}
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 relative z-10">
                  <motion.div
                    animate={isSpinning ? { 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                  </motion.div>
                  
                  {/* Tip Text Window */}
                  <div className="h-3 xs:h-3.5 sm:h-4 flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      {isSpinning ? (
                        // Spinning animation
                        <motion.div
                          key="spinning"
                          initial={{ y: 0 }}
                          animate={{ y: [-60, 60, -30, 30, 0] }}
                          transition={{ 
                            duration: 0.8,
                            ease: [0.25, 0.1, 0.25, 1],
                            times: [0, 0.3, 0.5, 0.7, 1]
                          }}
                          className="absolute inset-0 flex flex-col items-center justify-center"
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] text-blue-300/50 font-medium whitespace-nowrap"
                              style={{ filter: 'blur(1px)' }}
                            >
                              {tradingTips[(tipIndex + i) % tradingTips.length].slice(0, 28)}
                            </motion.span>
                          ))}
                        </motion.div>
                      ) : (
                        // Displayed tip with horizontal scroll for longer text
                        <motion.div
                          key={tipIndex}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 400,
                            damping: 20
                          }}
                          className="absolute inset-0 flex items-center"
                        >
                          <motion.span 
                            className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] text-blue-200/90 font-medium whitespace-nowrap truncate"
                            animate={tradingTips[tipIndex].length > 40 ? {
                              x: [0, -20, 0]
                            } : {
                              opacity: [1, 1, 1],
                              textShadow: [
                                '0 0 0px rgba(96, 165, 250, 0)',
                                '0 0 8px rgba(96, 165, 250, 0.5)',
                                '0 0 0px rgba(96, 165, 250, 0)'
                              ]
                            }}
                            transition={{
                              duration: tradingTips[tipIndex].length > 40 
                                ? Math.max(3, Math.ceil(tradingTips[tipIndex].length / 15) * 2)
                                : 3,
                              ease: 'linear',
                              repeat: tradingTips[tipIndex].length > 40 ? Infinity : 0,
                              repeatDelay: 1
                            }}
                          >
                            <Sparkles className="w-3 h-3 inline mr-1" /> {tradingTips[tipIndex]}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-r-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Expanded Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[2147483645] flex items-center justify-center p-3 sm:p-6 bg-black/95"
            onClick={() => setIsExpanded(false)}
          >
            {/* Tap to close hints - Top */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
              transition={{ opacity: { duration: 2, repeat: Infinity }, y: { duration: 0.3 } }}
              className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-blue-300/50 text-xs sm:text-sm pointer-events-none"
            >
              <span>↑</span>
              <span>Tap anywhere to close</span>
              <span>↑</span>
            </motion.div>

            {/* Tap to close hints - Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
              transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.5 }, y: { duration: 0.3 } }}
              className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-blue-300/50 text-xs sm:text-sm pointer-events-none"
            >
              <span>↓</span>
              <span>Tap anywhere to close</span>
              <span>↓</span>
            </motion.div>

            {/* Tap to close hints - Left */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: [0.3, 0.6, 0.3], x: 0 }}
              transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.25 }, x: { duration: 0.3 } }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-blue-300/40 text-[10px] sm:text-xs pointer-events-none"
            >
              <span>←</span>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Tap to close</span>
            </motion.div>

            {/* Tap to close hints - Right */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: [0.3, 0.6, 0.3], x: 0 }}
              transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.75 }, x: { duration: 0.3 } }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-blue-300/40 text-[10px] sm:text-xs pointer-events-none"
            >
              <span>→</span>
              <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
            </motion.div>

            {/* Centered Modal */}
            <motion.div
              ref={panelRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl border border-blue-500/30 shadow-2xl shadow-blue-900/20"
            >
                {/* Header */}
                <div className="p-2 sm:p-3 md:p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                      <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-white truncate">Trading Quick Access</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsExpanded(false)}
                      className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 transition-colors group"
                    >
                      <span className="text-[8px] sm:text-[10px] text-blue-300/70 group-hover:text-blue-200 hidden sm:inline">ESC</span>
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300 group-hover:text-white" />
                    </motion.button>
                  </div>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 mt-0.5">
                    Live charts & community • Click outside to close
                  </p>
                </div>

                {/* Chart Selector Tabs */}
                <div className="p-2 sm:p-2.5 md:p-3 border-b border-blue-500/20 flex-shrink-0">
                  <div className="flex gap-1.5 sm:gap-2">
                    {symbols.map((sym) => {
                      const Icon = sym.icon;
                      return (
                        <button
                          key={sym.id}
                          onClick={() => {
                            setActiveChart(sym.id);
                            setShowForexFactory(false);
                          }}
                          className={`
                            flex-1 flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2 py-1.5 sm:py-2 px-1.5 sm:px-2.5 md:px-3 rounded-lg text-[10px] sm:text-xs md:text-xs font-semibold
                            transition-all duration-200 whitespace-nowrap
                            ${activeChart === sym.id && !showForexFactory
                              ? 'bg-blue-500/30 border border-blue-400/50' 
                              : 'bg-zinc-800/50 border border-blue-500/20 hover:border-blue-400/40'
                            }
                          `}
                        >
                          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-white hidden sm:inline">
                            {sym.displayName}
                          </span>
                          <span className="text-white sm:hidden">
                            {sym.abbreviation}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TradingView Chart or Economic Calendar */}
                {!showForexFactory ? (
                  <div className="relative bg-zinc-950 flex-1 min-h-0">
                    <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px]">
                      <iframe
                        src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbols.find(s => s.id === activeChart)?.symbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=bullmoney.shop&utm_medium=widget&utm_campaign=chart&utm_term=${symbols.find(s => s.id === activeChart)?.symbol}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-zinc-950 flex-1 min-h-0">
                    <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] overflow-hidden">
                      {/* TradingView Economic Calendar Widget */}
                      <iframe
                        key={getCalendarUrl()} // Force refresh when filters change
                        src={getCalendarUrl()}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          border: 'none',
                          backgroundColor: '#131722'
                        }}
                        title="Economic Calendar"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Calendar Filters - Only show when calendar is active */}
                {showForexFactory && (
                  <div className="p-2 sm:p-2.5 md:p-3 border-t border-blue-500/20 bg-zinc-900/50 space-y-1.5 sm:space-y-2 md:space-y-3 max-h-[140px] overflow-y-auto flex-shrink-0">
                    {/* Importance Filter */}
                    <div>
                      <p className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-300 font-semibold mb-1 uppercase tracking-wider">
                        Importance
                      </p>
                      <div className="flex flex-wrap gap-0.5 sm:gap-1">
                        {importanceLevels.map((level) => (
                          <button
                            key={level.value}
                            onClick={() => toggleImportance(level.value)}
                            className={`
                              px-1.5 sm:px-2 md:px-2.5 py-0.5 text-[7px] sm:text-[8px] md:text-[9px] font-semibold rounded-md whitespace-nowrap
                              transition-all duration-200
                              ${calendarImportance.includes(level.value)
                                ? `${level.color} border border-blue-400/70 text-white shadow-sm shadow-blue-500/20`
                                : 'bg-zinc-800/50 border border-blue-500/20 text-blue-400/60 hover:border-blue-400/40'
                              }
                            `}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Currency Filter */}
                    <div>
                      <p className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-300 font-semibold mb-1 uppercase tracking-wider">
                        Currencies
                      </p>
                      <div className="flex flex-wrap gap-0.5 sm:gap-1">
                        {currencies.map((currency) => (
                          <button
                            key={currency}
                            onClick={() => toggleCurrency(currency)}
                            className={`
                              px-1.5 sm:px-2 md:px-2.5 py-0.5 text-[7px] sm:text-[8px] md:text-[9px] font-bold rounded-md whitespace-nowrap
                              transition-all duration-200
                              ${calendarCurrencies.includes(currency)
                                ? 'bg-blue-500/70 border border-blue-400/70 text-white shadow-sm shadow-blue-500/20'
                                : 'bg-zinc-800/50 border border-blue-500/20 text-blue-400/60 hover:border-blue-400/40'
                              }
                            `}
                          >
                            {currency}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                <div className="p-2 sm:p-2.5 md:p-3 border-t border-blue-500/20 space-y-1.5 sm:space-y-2 flex-shrink-0">
                  {/* Forex Factory Toggle */}
                  <motion.button
                    onClick={() => setShowForexFactory(!showForexFactory)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg text-[10px] sm:text-xs md:text-xs font-semibold
                      transition-all duration-200 whitespace-nowrap
                      ${showForexFactory
                        ? 'bg-blue-500/30 border border-blue-400/50' 
                        : 'bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 border border-blue-500/20'
                      }
                    `}
                  >
                    <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-white hidden sm:inline">
                      {showForexFactory ? 'Show Charts' : 'Show Economic Calendar'}
                    </span>
                    <span className="text-white sm:hidden text-[9px]">
                      {showForexFactory ? 'Charts' : 'Calendar'}
                    </span>
                  </motion.button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Secret Discord Stage Button - Shows if unlocked, positioned below Community button */}
      {secretUnlocked && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 80,
            damping: 20,
            delay: 0.6,
            mass: 0.8
          }}
          className="fixed left-0 z-[250000] pointer-events-none"
          style={{
            top: 'calc(5rem + env(safe-area-inset-top, 0px) + 238px)', // Below Community button
            paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 8px)',
          }}
        >
          <motion.div
            ref={secretButtonRef}
            whileHover={{ 
              x: 12, 
              scale: 1.05,
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)'
            }}
            className="relative pointer-events-auto cursor-pointer"
            onClick={() => setDiscordStageModalOpen(!isDiscordStageModalOpen)}
            onMouseEnter={handleSecretHover}
            onMouseLeave={handleSecretUnhover}
            animate={{
              x: [0, 8, 0, 6, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
              times: [0, 0.3, 0.5, 0.8, 1]
            }}
          >
            {/* Purple Pill Content */}
            <div className="relative rounded-r-full bg-gradient-to-br from-purple-600/30 via-purple-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-purple-500/50 shadow-2xl hover:border-purple-400/70 hover:shadow-purple-600/40">
              {/* Enhanced pulsing glow background */}
              <motion.div
                className="absolute inset-0 rounded-r-full bg-gradient-to-r from-purple-500/20 via-fuchsia-500/10 to-transparent opacity-0"
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{ filter: 'blur(8px)' }}
              />
              
              {/* Subtle shine effect */}
              <motion.div
                className="absolute inset-0 rounded-r-full"
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(168, 85, 247, 0)',
                    '0 0 20px rgba(168, 85, 247, 0.4)',
                    '0 0 10px rgba(168, 85, 247, 0)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              
              <div className="px-1.5 py-1.5 sm:px-2 sm:py-1.5 md:px-3 md:py-2.5 flex items-center gap-0.5 sm:gap-1 md:gap-1.5 relative z-10">
                {/* Live Indicator */}
                <motion.div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full"
                  animate={{ 
                    opacity: [1, 0.4, 1],
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 0px rgba(168, 85, 247, 1)',
                      '0 0 8px rgba(168, 85, 247, 0.8)',
                      '0 0 0px rgba(168, 85, 247, 1)'
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />

                {/* Text */}
                <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-purple-300 drop-shadow-[0_0_3px_rgba(216,180,254,0.5)]" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-purple-200">
                    LIVE STAGE
                  </span>
                </div>

                {/* Arrow */}
                <motion.div
                  animate={{ rotate: isDiscordStageModalOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 text-purple-400/70" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Discord Stage Modal - rendered via discordStageModal variable */}
      {discordStageModal}
    </>
  );
}

export default TradingQuickAccess;
