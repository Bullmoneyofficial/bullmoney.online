"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  MessageCircle,
  Instagram,
  Youtube,
  Crown,
  ChevronRight
} from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';

export function CommunityQuickAccess() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen, isV2Unlocked } = useUIState();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAnyModalOpen || isMobileMenuOpen || isUltimatePanelOpen) {
      setIsExpanded(false);
    }
  }, [isAnyModalOpen, isMobileMenuOpen, isUltimatePanelOpen]);
  
  useEffect(() => {
    const handleTradingOpen = () => setIsExpanded(false);
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    return () => window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
  }, []);
  
  useEffect(() => {
    if (isExpanded) {
      window.dispatchEvent(new CustomEvent('communityQuickAccessOpened'));
    } else {
      window.dispatchEvent(new CustomEvent('communityQuickAccessClosed'));
    }
  }, [isExpanded]);

  // Hide when other menus open
  useEffect(() => {
    const handleBrowserOpen = () => setOtherMenuOpen(true);
    const handleBrowserClose = () => setOtherMenuOpen(false);
    const handleTradingOpen = () => setOtherMenuOpen(true);
    const handleTradingClose = () => setOtherMenuOpen(false);
    
    window.addEventListener('browserSwitchOpened', handleBrowserOpen);
    window.addEventListener('browserSwitchClosed', handleBrowserClose);
    window.addEventListener('tradingQuickAccessOpened', handleTradingOpen);
    window.addEventListener('tradingQuickAccessClosed', handleTradingClose);
    
    return () => {
      window.removeEventListener('browserSwitchOpened', handleBrowserOpen);
      window.removeEventListener('browserSwitchClosed', handleBrowserClose);
      window.removeEventListener('tradingQuickAccessOpened', handleTradingOpen);
      window.removeEventListener('tradingQuickAccessClosed', handleTradingClose);
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

  const shouldHide = !mounted || !isV2Unlocked || isMobileMenuOpen || isUltimatePanelOpen || isAnyModalOpen;

  if (shouldHide || otherMenuOpen) {
    return null;
  }

  const handleDiscordClick = () => {
    window.open('https://discord.gg/bullmoney', '_blank', 'noopener,noreferrer');
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/bullmoney', '_blank', 'noopener,noreferrer');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/bullmoney', '_blank', 'noopener,noreferrer');
  };

  const handleYoutubeClick = () => {
    window.open('https://youtube.com/@bullmoney', '_blank', 'noopener,noreferrer');
  };

  const handleVIPClick = () => {
    window.dispatchEvent(new CustomEvent('openProductsModal'));
    setTimeout(() => setIsExpanded(false), 100);
  };

  return (
    <>
      {/* Community Pill - Positioned below Trading Quick Access */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 80,
          damping: 20,
          delay: 0.5,
          mass: 0.8
        }}
        className="fixed left-0 z-[250000] pointer-events-none"
        style={{
          top: 'calc(5rem + env(safe-area-inset-top, 0px) + 130px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 8px)',
        }}
      >
        <motion.div
          whileHover={{ 
            x: 12, 
            scale: 1.05,
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)'
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
          <div className="relative rounded-r-full bg-gradient-to-br from-purple-600/30 via-purple-500/15 to-zinc-900/40 backdrop-blur-2xl border-y border-r border-purple-500/50 shadow-2xl hover:border-purple-400/70 hover:shadow-purple-600/40">
            {/* Enhanced pulsing glow background */}
            <motion.div
              className="absolute inset-0 rounded-r-full bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-transparent opacity-0"
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
            
            <div className="px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2 relative z-10">
              {/* Live Indicator */}
              <motion.div
                className="w-2 h-2 bg-purple-400 rounded-full"
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
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-purple-300 drop-shadow-[0_0_3px_rgba(192,132,250,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-bold text-purple-200">
                  Community
                </span>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronRight className="w-3 h-3 text-purple-400/70" />
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
                top: 'clamp(4.5rem, calc(5rem + env(safe-area-inset-top, 0px) + 130px), calc(100vh - 300px))',
                maxHeight: 'clamp(300px, calc(100vh - 80px), 85vh)',
                overflowY: 'auto'
              }}
              onMouseLeave={() => setIsExpanded(false)}
            >
              <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/20 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-2 sm:p-3 md:p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 md:mb-2">
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                    <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-white truncate">Join Our Community</h3>
                  </div>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400">
                    Connect with 10,000+ traders
                  </p>
                </div>

                {/* Social Buttons */}
                <div className="p-2 sm:p-2.5 md:p-3 border-t border-purple-500/20 space-y-1.5 sm:space-y-2 flex-shrink-0">
                  {/* Discord */}
                  <motion.button
                    onClick={handleDiscordClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-indigo-500/30
                      shadow-lg shadow-indigo-500/25
                      transition-all duration-300"
                  >
                    <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Discord Server</span>
                    <span className="sm:hidden text-[9px]">Discord</span>
                  </motion.button>

                  {/* Telegram */}
                  <motion.button
                    onClick={handleTelegramClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-cyan-500/30
                      shadow-lg shadow-cyan-500/25
                      transition-all duration-300"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Telegram Group</span>
                    <span className="sm:hidden text-[9px]">Telegram</span>
                  </motion.button>

                  {/* Instagram */}
                  <motion.button
                    onClick={handleInstagramClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-pink-500/30
                      shadow-lg shadow-pink-500/25
                      transition-all duration-300"
                  >
                    <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Instagram</span>
                    <span className="sm:hidden text-[9px]">Instagram</span>
                  </motion.button>

                  {/* YouTube */}
                  <motion.button
                    onClick={handleYoutubeClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500
                      text-white font-semibold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-red-500/30
                      shadow-lg shadow-red-500/25
                      transition-all duration-300"
                  >
                    <Youtube className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">YouTube Channel</span>
                    <span className="sm:hidden text-[9px]">YouTube</span>
                  </motion.button>

                  {/* VIP - Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-2"></div>

                  {/* Join VIP */}
                  <motion.button
                    onClick={handleVIPClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-2 sm:py-2.5 px-2 sm:px-2.5 md:px-3 rounded-lg
                      bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500
                      text-white font-bold text-[10px] sm:text-xs md:text-xs whitespace-nowrap
                      border border-yellow-500/30
                      shadow-lg shadow-yellow-500/30
                      transition-all duration-300"
                  >
                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Join VIP</span>
                    <span className="sm:hidden text-[9px]">VIP</span>
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

export default CommunityQuickAccess;
