"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp,
  ChevronRight,
  BarChart3,
  Globe,
  MessageSquare,
  Bitcoin,
  Coins,
  ExternalLink
} from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';

// Trading symbols configuration
const symbols = [
  {
    id: 'xauusd',
    name: 'XAUUSD',
    displayName: 'Gold',
    symbol: 'OANDA:XAUUSD',
    icon: Coins,
  },
  {
    id: 'btcusd',
    name: 'BTCUSD',
    displayName: 'Bitcoin',
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
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'
];

export function TradingQuickAccess() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeChart, setActiveChart] = useState('xauusd');
  const [showForexFactory, setShowForexFactory] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({
    xauusd: '...',
    btcusd: '...'
  });
  const [calendarImportance, setCalendarImportance] = useState<string[]>(['2', '3']); // High and Medium
  const [calendarCurrencies, setCalendarCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY']);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // UI State awareness
  const { isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen, isV2Unlocked } = useUIState();
  
  // Wait for client-side mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close when other UI elements open
  useEffect(() => {
    if (isAnyModalOpen || isMobileMenuOpen || isUltimatePanelOpen) {
      setIsExpanded(false);
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
    }
  }, [isExpanded]);

  // Simulated price updates - in production, connect to real WebSocket/API
  useEffect(() => {
    const updatePrices = () => {
      // Simulate price updates
      setPrices({
        xauusd: (2650 + Math.random() * 50).toFixed(2),
        btcusd: (98000 + Math.random() * 2000).toFixed(0)
      });
    };

    updatePrices();
    const interval = setInterval(updatePrices, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hide when not mounted, v2 not unlocked, or any modal/UI is open
  const shouldHide = !mounted || !isV2Unlocked || isMobileMenuOpen || isUltimatePanelOpen || isAnyModalOpen;

  if (shouldHide) {
    return null;
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
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="fixed left-0 z-[250000] pointer-events-none"
        style={{
          top: 'calc(5rem + env(safe-area-inset-top, 0px) + 80px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 8px)',
        }}
      >
        <motion.div
          whileHover={{ x: 8, scale: 1.02 }}
          className="relative pointer-events-auto cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsExpanded(true)}
        >
          {/* Pill Content */}
          <div className="relative rounded-r-full bg-gradient-to-br from-blue-600/30 via-blue-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-blue-500/50 shadow-2xl hover:border-blue-400/70 hover:shadow-blue-600/40">
            <div className="px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2">
              {/* Live Indicator */}
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ 
                  opacity: [1, 0.4, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />

              {/* Prices */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 md:w-4 md:h-4 text-blue-300" />
                  <span className="text-[9px] md:text-[10px] font-bold text-blue-200">
                    ${prices.xauusd}
                  </span>
                </div>
                <div className="w-px h-3 bg-blue-500/30" />
                <div className="flex items-center gap-1">
                  <Bitcoin className="w-3 h-3 md:w-4 md:h-4 text-blue-300" />
                  <span className="text-[9px] md:text-[10px] font-bold text-blue-200">
                    ${prices.btcusd}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="w-3 h-3 text-blue-400/70" />
              </motion.div>
            </div>
          </div>
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
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="fixed z-[250000] w-[340px] md:w-[400px]"
              style={{
                left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
                top: 'calc(5rem + env(safe-area-inset-top, 0px) + 120px)',
              }}
              onMouseLeave={() => setIsExpanded(false)}
            >
              <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-900/20 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Trading Quick Access</h3>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Live charts, news & community
                  </p>
                </div>

                {/* Chart Selector Tabs */}
                <div className="p-3 border-b border-blue-500/20">
                  <div className="flex gap-2">
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
                            flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                            transition-all duration-200
                            ${activeChart === sym.id && !showForexFactory
                              ? 'bg-blue-500/30 border border-blue-400/50' 
                              : 'bg-zinc-800/50 border border-blue-500/20 hover:border-blue-400/40'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-white">
                            {sym.displayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TradingView Chart or Economic Calendar */}
                {!showForexFactory ? (
                  <div className="relative bg-zinc-950">
                    <div className="w-full h-[300px] md:h-[350px]">
                      <iframe
                        src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${symbols.find(s => s.id === activeChart)?.symbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=bullmoney.shop&utm_medium=widget&utm_campaign=chart&utm_term=${symbols.find(s => s.id === activeChart)?.symbol}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-zinc-950">
                    <div className="w-full h-[400px] overflow-hidden">
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
                  <div className="p-3 border-t border-blue-500/20 bg-zinc-900/50 space-y-3">
                    {/* Importance Filter */}
                    <div>
                      <p className="text-[10px] text-blue-300 font-semibold mb-2 uppercase tracking-wider">
                        Event Importance
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {importanceLevels.map((level) => (
                          <button
                            key={level.value}
                            onClick={() => toggleImportance(level.value)}
                            className={`
                              px-2.5 py-1 text-[10px] font-semibold rounded-md
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
                      <p className="text-[10px] text-blue-300 font-semibold mb-2 uppercase tracking-wider">
                        Currencies
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {currencies.map((currency) => (
                          <button
                            key={currency}
                            onClick={() => toggleCurrency(currency)}
                            className={`
                              px-2.5 py-1 text-[10px] font-bold rounded-md
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
                <div className="p-3 border-t border-blue-500/20 space-y-2">
                  {/* Forex Factory Toggle */}
                  <motion.button
                    onClick={() => setShowForexFactory(!showForexFactory)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                      transition-all duration-200
                      ${showForexFactory
                        ? 'bg-blue-500/30 border border-blue-400/50' 
                        : 'bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 border border-blue-500/20'
                      }
                    `}
                  >
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">
                      {showForexFactory ? 'Show Charts' : 'Show Economic Calendar'}
                    </span>
                  </motion.button>

                  {/* Discord Button */}
                  <motion.button
                    onClick={handleDiscordClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                      bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                      text-white font-semibold text-xs
                      border border-indigo-500/30
                      shadow-lg shadow-indigo-500/25
                      transition-all duration-300"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Join Our Discord Community</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default TradingQuickAccess;
