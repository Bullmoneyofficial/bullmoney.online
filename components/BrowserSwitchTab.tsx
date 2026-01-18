"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Chrome, 
  ChevronRight,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Monitor
} from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';

// Browser configuration
const browsers = [
  {
    id: 'chrome',
    name: 'Chrome',
    fullName: 'Google Chrome',
    icon: Chrome,
    color: 'emerald',
    recommended: true,
    getUrl: (url: string) => `googlechrome://${url.replace(/^https?:\/\//, '')}`
  },
  {
    id: 'firefox',
    name: 'Firefox',
    fullName: 'Firefox',
    icon: Globe,
    color: 'orange',
    recommended: false,
    getUrl: (url: string) => `firefox://open-url?url=${encodeURIComponent(url)}`
  },
  {
    id: 'safari',
    name: 'Safari',
    fullName: 'Safari',
    icon: Globe,
    color: 'blue',
    recommended: false,
    getUrl: (url: string) => url
  },
  {
    id: 'edge',
    name: 'Edge',
    fullName: 'Microsoft Edge',
    icon: Globe,
    color: 'cyan',
    recommended: false,
    getUrl: (url: string) => `microsoft-edge:${url}`
  },
  {
    id: 'brave',
    name: 'Brave',
    fullName: 'Brave Browser',
    icon: Globe,
    color: 'orange',
    recommended: false,
    getUrl: (url: string) => `brave://${url.replace(/^https?:\/\//, '')}`
  }
];

export function BrowserSwitchTab() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openingBrowser, setOpeningBrowser] = useState<string | null>(null);
  const [showPulse, setShowPulse] = useState(true);
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
  
  // Close when TradingQuickAccess opens (mutual exclusion)
  useEffect(() => {
    const handleTradingOpen = () => setIsExpanded(false);
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    return () => window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
  }, []);
  
  // Dispatch event when this component opens
  useEffect(() => {
    if (isExpanded) {
      window.dispatchEvent(new CustomEvent('browserSwitchOpened'));
    } else {
      window.dispatchEvent(new CustomEvent('browserSwitchClosed'));
    }
  }, [isExpanded]);

  // Hide when other menus open
  useEffect(() => {
    const handleTradingOpen = () => setOtherMenuOpen(true);
    const handleTradingClose = () => setOtherMenuOpen(false);
    const handleCommunityOpen = () => setOtherMenuOpen(true);
    const handleCommunityClose = () => setOtherMenuOpen(false);
    
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    window.addEventListener('tradingQuickAccessClosed', handleTradingClose);
    window.addEventListener('communityQuickAccessOpened', handleCommunityOpen);
    window.addEventListener('communityQuickAccessClosed', handleCommunityClose);
    
    return () => {
      window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
      window.removeEventListener('tradingQuickAccessClosed', handleTradingClose);
      window.removeEventListener('communityQuickAccessOpened', handleCommunityOpen);
      window.removeEventListener('communityQuickAccessClosed', handleCommunityClose);
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
  
  useEffect(() => {
    if (isExpanded) {
      setShowPulse(false);
    }
  }, [isExpanded]);

  // Hide when not mounted, v2 not unlocked, or any modal/UI is open
  const shouldHide = !mounted || !isV2Unlocked || isMobileMenuOpen || isUltimatePanelOpen || isAnyModalOpen;

  if (shouldHide || otherMenuOpen) {
    return null;
  }

  const handleOpenBrowser = (browserId: string) => {
    const currentUrl = window.location.href;
    const browser = browsers.find(b => b.id === browserId);
    
    if (!browser) return;
    
    setOpeningBrowser(browserId);
    
    const browserUrl = browser.getUrl(currentUrl);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    try {
      iframe.contentWindow?.location.replace(browserUrl);
    } catch (e) {
      // URL scheme failed
    }
    
    setTimeout(() => {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
      document.body.removeChild(iframe);
      setOpeningBrowser(null);
    }, 500);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Pull Tab - Always visible on left */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 80,
          damping: 20,
          delay: 0.1,
          mass: 0.8
        }}
        className="fixed left-0 z-[250000] pointer-events-none"
        style={{
          top: 'calc(5rem + env(safe-area-inset-top, 0px) + 10px)',
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
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsExpanded(true)}
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
            
            <div className="px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2 relative z-10">
              {/* Live Indicator */}
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
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

              {/* Text */}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-300 drop-shadow-[0_0_3px_rgba(147,197,253,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-bold text-blue-200">
                  Pro Trading
                </span>
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

      {/* Compact Dropdown Menu - Appears under button */}
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
              className="fixed z-[250000] w-[280px] md:w-[320px]"
              style={{
                left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
                top: 'calc(5rem + env(safe-area-inset-top, 0px) + 70px)',
              }}
              onMouseLeave={() => setIsExpanded(false)}
            >
              <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Best on Chrome + Desktop</h3>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Select browser for optimal trading experience
                  </p>
                </div>

                {/* Browser List */}
                <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
                  {browsers.map((browser, index) => {
                    const Icon = browser.icon;
                    const isLoading = openingBrowser === browser.id;
                    
                    return (
                      <motion.button
                        key={browser.id}
                        onClick={() => handleOpenBrowser(browser.id)}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                        className={`
                          w-full flex items-center justify-between p-2.5 rounded-lg
                          bg-gradient-to-r from-zinc-800/50 to-zinc-900/50
                          border border-emerald-500/20
                          hover:border-emerald-400/40
                          hover:bg-emerald-500/10
                          transition-all duration-200
                          disabled:opacity-50 group
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
                            <Icon className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-medium text-white block">
                              {browser.fullName}
                            </span>
                            {browser.recommended && (
                              <span className="text-[9px] text-emerald-400 uppercase font-bold">
                                ★ Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-t-transparent border-emerald-400 rounded-full"
                          />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Copy Link Button */}
                <div className="p-3 border-t border-emerald-500/20">
                  <motion.button
                    onClick={handleCopyLink}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center justify-center gap-2 py-2 px-3
                      ${copied 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' 
                        : 'bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500'
                      }
                      text-white font-semibold text-xs rounded-lg
                      border border-zinc-600/50
                      transition-all duration-300
                    `}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
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

export default BrowserSwitchTab;
