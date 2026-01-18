"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp,
  ChevronRight,
  BarChart3,
  Globe,
  Bitcoin,
  Coins,
  ExternalLink,
  Sparkles
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
  
  // Secret modal state tracking - UIState handles mutual exclusion
  useEffect(() => {
    // Modal open/close is fully managed by UIState
  }, [isDiscordStageModalOpen]);
  
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

  // Live price updates from real API - Updates every 1 second
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
          // Update prices if valid data received
          setPrices(prev => ({
            xauusd: data.xauusd || prev.xauusd,
            btcusd: data.btcusd || prev.btcusd
          }));
          
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
    
    // Update every 2 seconds for real-time prices (reduced from 1s to prevent overwhelming)
    const interval = setInterval(fetchPrices, 2000);
    
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
  
  // Dispatch hover events for coordination
  const handleMouseEnter = () => {
    window.dispatchEvent(new CustomEvent('tradingQuickAccessHovered'));
    if (canOpen) setIsExpanded(true);
    
    // Unlock secret on ANY hover of the trading pill
    if (!secretUnlocked) {
      setSecretUnlocked(true);
      localStorage.setItem('discord-stage-unlocked', 'true');
    }
  };
  const handleMouseLeave = () => {
    window.dispatchEvent(new CustomEvent('tradingQuickAccessUnhovered'));
  };

  // Discord Stage Modal - ALWAYS render this, even when shouldHide is true
  // This modal appears on top of everything when open
  const discordStageModal = (
    <AnimatePresence>
      {isDiscordStageModalOpen && (
        <>
          {/* Backdrop - highest z-index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDiscordStageModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[2147483640]"
          />
          
          {/* Centered Modal Panel - highest z-index */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className="fixed inset-0 z-[2147483645] pointer-events-none flex items-center justify-center p-4"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div 
              className="bg-gradient-to-br from-purple-950/98 via-purple-900/95 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-purple-500/50 shadow-2xl shadow-purple-900/50 overflow-hidden pointer-events-auto w-full max-w-[340px] sm:max-w-[400px] md:max-w-[500px]"
              style={{
                maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)',
              }}
            >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-purple-500/30 bg-purple-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-purple-100">
                      Live Discord Stage
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDiscordStageModalOpen(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/40 flex items-center justify-center transition-colors"
                  >
                    <span className="text-purple-200 text-sm sm:text-base font-bold">×</span>
                  </motion.button>
                </div>
                <p className="text-[10px] sm:text-xs text-purple-300/70 mt-1">
                  Join the live stream and discussion
                </p>
              </div>

              {/* Discord Stage Embed - Responsive height */}
              <div className="relative w-full h-[280px] sm:h-[350px] md:h-[400px]">
                <iframe
                  src="https://discord.com/channels/1293532691542708276/1410093730131873893"
                  width="100%"
                  height="100%"
                  // @ts-ignore - React wants lowercase for DOM attribute
                  allowtransparency="true"
                  frameBorder="0"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  className="rounded-b-2xl"
                />
              </div>
            </div>
          </motion.div>
        </>
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
          top: 'calc(5rem + env(safe-area-inset-top, 0px) + 50px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 8px)',
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
            {/* Enhanced pulsing glow background */}
            <motion.div
              className="absolute inset-0 rounded-r-full bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-transparent opacity-0"
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
            
            <div className="px-1.5 py-1.5 sm:px-2 sm:py-1.5 md:px-3 md:py-2.5 flex items-center gap-0.5 sm:gap-1 md:gap-1.5 relative z-10">
              {/* Live Indicator */}
              <motion.div
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"
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
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300 drop-shadow-[0_0_3px_rgba(147,197,253,0.5)]" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-200">
                    ${prices.xauusd}
                  </span>
                </div>
                <div className="w-px h-2 sm:h-2.5 md:h-3 bg-blue-500/30" />
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Bitcoin className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300 drop-shadow-[0_0_3px_rgba(147,197,253,0.5)]" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-200">
                    ${prices.btcusd}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 text-blue-400/70" />
              </motion.div>
            </div>
          </div>
          
          {/* Trading Tip - Matching Price Pill Style */}
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -8, x: -20 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 25,
                delay: 0.5
              }}
              className="mt-1.5"
            >
              {/* Pill Container - Same style as price UI */}
              <div className="relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl hover:border-blue-400/70 hover:shadow-blue-600/40 transition-all duration-300 px-3 py-1.5 overflow-hidden">
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
                <div className="flex items-center gap-2 relative z-10">
                  <motion.div
                    animate={isSpinning ? { 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </motion.div>
                  
                  {/* Tip Text Window */}
                  <div className="h-4 flex-1 overflow-hidden relative">
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
                              className="text-[8px] md:text-[9px] text-blue-300/50 font-medium whitespace-nowrap"
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
                            className="text-[8px] md:text-[9px] text-blue-200/90 font-medium whitespace-nowrap"
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
                            💡 {tradingTips[tipIndex]}
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
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-transparent z-[249999]"
              style={{ touchAction: 'manipulation' }}
            />

            {/* Compact Dropdown */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ 
                type: 'spring', 
                damping: 22, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed z-[250000] w-[85vw] xs:w-[90vw] sm:w-[340px] md:w-[420px] lg:w-[480px] max-w-[90vw]"
              style={{
                left: 'max(6px, calc(env(safe-area-inset-left, 0px) + 6px))',
                right: 'auto',
                top: 'clamp(4.5rem, calc(5rem + env(safe-area-inset-top, 0px) + 50px), calc(100vh - 300px))',
                maxHeight: 'clamp(300px, calc(100vh - 80px), 85vh)',
                overflowY: 'auto'
              }}
              onMouseLeave={() => setIsExpanded(false)}
            >
              <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-2 sm:p-3 md:p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 md:mb-2">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-white truncate">Trading Quick Access</h3>
                  </div>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400">
                    Live charts & community
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
              </div>
            </motion.div>
          </>
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
