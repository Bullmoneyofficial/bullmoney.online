"use client";
import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, ExternalLink, MessageCircle, Smartphone, Globe } from "lucide-react";
import { Logo } from "./logo";
import { DesktopFooter } from "./footer/DesktopFooter";
import { SocialsRow } from "./footer/SocialsRow";
import AdminModal from "@/components/AdminModal";
import BullMoneyModal from "@/components/Faq";
import AffiliateModal from "@/components/AffiliateModal";
import { ShimmerLine, ShimmerBorder, useOptimizedShimmer } from "@/components/ui/UnifiedShimmer";
import { useFpsOptimizer } from "@/lib/FpsOptimizer";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { useFooterModalsUI } from "@/contexts/UIStateContext";

// Unified Modal Wrapper for Footer - Fixes display issues on all devices
const FooterModal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-2 sm:p-4"
          style={{ 
            zIndex: 2147483647,
            isolation: 'isolate',
          }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-lg"
            style={{ zIndex: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl"
            style={{ zIndex: 1 }}
          >
            {/* Shimmer Border */}
            <ShimmerBorder color="blue" intensity="low" />
            
            {/* Inner Container */}
            <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-blue-500/30 overflow-hidden">
              <ShimmerLine color="blue" />
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-blue-500/20">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); onClose(); }}
                  className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Content */}
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});
FooterModal.displayName = 'FooterModal';

// Apps & Tools Modal Content
const AppsToolsContent = memo(() => {
  const apps = [
    { name: "TradingView", icon: "📊", url: "https://tradingview.com", desc: "Advanced charting platform" },
    { name: "MetaTrader 4", icon: "📈", url: "https://metatrader4.com", desc: "Forex trading platform" },
    { name: "MetaTrader 5", icon: "📉", url: "https://metatrader5.com", desc: "Multi-asset platform" },
    { name: "Discord", icon: "💬", url: "https://discord.gg/bullmoney", desc: "Community chat" },
    { name: "Telegram", icon: "✈️", url: "https://t.me/bullmoneyonline", desc: "Updates & signals" },
  ];

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <motion.a
          key={app.name}
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => SoundEffects.click()}
          className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors"
        >
          <span className="text-2xl">{app.icon}</span>
          <div className="flex-1">
            <p className="font-medium text-white">{app.name}</p>
            <p className="text-xs text-neutral-500">{app.desc}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-400" />
        </motion.a>
      ))}
    </div>
  );
});
AppsToolsContent.displayName = 'AppsToolsContent';

export function Footer() {
  const currentYear = new Date().getFullYear();

  // FPS Optimizer integration for component lifecycle tracking
  const { registerComponent, unregisterComponent, shouldEnableShimmer } = useFpsOptimizer();
  const shimmerSettings = useOptimizedShimmer();
  
  // Register component with FPS optimizer on mount
  useEffect(() => {
    registerComponent('footer');
    return () => unregisterComponent('footer');
  }, [registerComponent, unregisterComponent]);
  
  // Check if shimmer should be enabled for this component
  const shimmerEnabled = shouldEnableShimmer('footer') && !shimmerSettings.disabled;

  // Use centralized UI state for mutual exclusion with other modals
  const { isAppsOpen, isDisclaimerOpen, setAppsOpen, setDisclaimerOpen } = useFooterModalsUI();

  const handleDisclaimerClick = useCallback(() => {
    SoundEffects.click();
    setDisclaimerOpen(true);
  }, [setDisclaimerOpen]);

  const handleAppsClick = useCallback(() => {
    SoundEffects.click();
    setAppsOpen(true);
  }, [setAppsOpen]);

  return (
    <>
      {/* Modal Components */}
      <BullMoneyModal isOpen={isDisclaimerOpen} onClose={() => setDisclaimerOpen(false)} />

      <FooterModal
        isOpen={isAppsOpen}
        onClose={() => setAppsOpen(false)}
        title="Apps & Tools"
      >
        <AppsToolsContent />
      </FooterModal>

      <motion.div
        className="relative w-full px-4 sm:px-8 py-8 sm:py-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Inner Content Container */}
        <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-6 sm:gap-8 bg-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-blue-500/30 footer-shimmer">
          {/* Top shimmer - LEFT TO RIGHT, FPS-aware */}
          {shimmerEnabled && <ShimmerLine color="blue" intensity={shimmerSettings.intensity} speed={shimmerSettings.speed} />}
          
          {/* Top: Logo */}
          <div className="scale-110 sm:scale-125 md:scale-150 origin-center p-1">
            <Logo />
          </div>

          {/* Desktop Footer Items */}
          <DesktopFooter
            onDisclaimerClick={handleDisclaimerClick}
            onAppsAndToolsClick={handleAppsClick}
            onSocialsClick={() => {}}
          />

          {/* Mobile Footer Items */}
          <div className="lg:hidden flex flex-wrap justify-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDisclaimerClick}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-neutral-800/50 rounded-full border border-blue-500/20 hover:border-blue-500/40 transition-all"
            >
              Disclaimer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAppsClick}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-neutral-800/50 rounded-full border border-blue-500/20 hover:border-blue-500/40 transition-all"
            >
              Apps & Tools
            </motion.button>
          </div>

          {/* Bottom: Socials Row */}
          <div className="mt-2 sm:mt-4">
            <SocialsRow />
          </div>

          {/* Copyright */}
          <p className="text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 font-light tracking-wide text-center mt-4 sm:mt-6">
            &copy; {currentYear} BullMoney. All rights reserved.
          </p>
        </div>
      </motion.div>
    </>
  );
}