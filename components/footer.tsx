"use client";
import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, ExternalLink, MessageCircle, Smartphone, Globe } from "lucide-react";
import { Logo } from "./logo";
import { DesktopFooter } from "./footer/DesktopFooter";
import { SocialsRow } from "./footer/SocialsRow";
import AdminModal from "@/components/AdminModal";
import { LegalDisclaimerModal } from "@/components/Mainpage/footer/LegalDisclaimerModal";
import AffiliateModal from "@/components/AffiliateModal";
import { ShimmerLine, ShimmerBorder, useOptimizedShimmer } from "@/components/ui/UnifiedShimmer";
import { useFpsOptimizer } from "@/lib/FpsOptimizer";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { useFooterModalsUI } from "@/contexts/UIStateContext";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

// Neon Blue Sign Style from Chartnews (STATIC for performance)
const NEON_STYLES = `
  .neon-blue-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-border {
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff;
  }

  .neon-blue-bg {
    background: #ffffff;
    box-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

// Unified Modal Wrapper for Footer - Static Neon Style
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex flex-col bg-black"
          style={{ zIndex: 2147483647 }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 shrink-0"
            style={{
              borderBottom: '2px solid #ffffff',
              boxShadow: '0 2px 8px #ffffff, 0 4px 16px rgba(255, 255, 255, 0.4)'
            }}
          >
            <h2 className="text-lg font-bold neon-blue-text">
              {title}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { SoundEffects.click(); onClose(); }}
              className="p-2 rounded-full bg-black transition-all neon-blue-border"
              style={{ zIndex: 2147483647 }}
            >
              <X className="w-5 h-5 neon-white-icon" style={{ color: '#ffffff' }} />
            </motion.button>
          </div>
          
          {/* Content - full remaining height, scrollable */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto p-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y'
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});
FooterModal.displayName = 'FooterModal';

// Apps & Tools Modal Content - Static Neon Style
const AppsToolsContent = memo(() => {
  const apps = [
    { name: "TradingView", icon: "📊", url: "https://tradingview.com", desc: "Advanced charting platform" },
    { name: "MetaTrader 4", icon: "📈", url: "https://metatrader4.com", desc: "Forex trading platform" },
    { name: "MetaTrader 5", icon: "📉", url: "https://metatrader5.com", desc: "Multi-asset platform" },
    { name: "Discord", icon: "💬", url: "https://discord.gg/bullmoney", desc: "Community chat" },
    { name: "Telegram", icon: "✈️", url: "https://t.me/bullmoneyonline", desc: "Updates & setups" },
  ];

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <a
          key={app.name}
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => SoundEffects.click()}
          className="flex items-center gap-4 p-4 bg-black rounded-xl transition-all hover:brightness-110 group neon-blue-border"
        >
          <span className="text-2xl">{app.icon}</span>
          <div className="flex-1">
            <p className="font-medium transition-all neon-blue-text">
              {app.name}
            </p>
            <p className="text-xs text-gray-400">
              {app.desc}
            </p>
          </div>
          <ExternalLink className="w-4 h-4 neon-blue-icon" style={{ color: '#ffffff' }} />
        </a>
      ))}
    </div>
  );
});
AppsToolsContent.displayName = 'AppsToolsContent';

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Unified performance (Mobile + Desktop Lite Mode)
  const { isMobile, shouldSkipHeavyEffects, shouldDisableBackdropBlur, animations } = useUnifiedPerformance();

  // FPS Optimizer integration for component lifecycle tracking
  const { registerComponent, unregisterComponent, shouldEnableShimmer } = useFpsOptimizer();
  const shimmerSettings = useOptimizedShimmer();
  
  // Register component with FPS optimizer on mount
  useEffect(() => {
    registerComponent('footer');
    return () => unregisterComponent('footer');
  }, [registerComponent, unregisterComponent]);

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
      {/* Only inject neon styles on desktop for performance */}
      {!shouldSkipHeavyEffects && <style dangerouslySetInnerHTML={{ __html: NEON_STYLES }} />}
      {/* Legal Disclaimer Modal - Comprehensive Terms, Privacy & Disclaimer */}
      <LegalDisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setDisclaimerOpen(false)} />

      <FooterModal
        isOpen={isAppsOpen}
        onClose={() => setAppsOpen(false)}
        title="Apps & Tools"
      >
        <AppsToolsContent />
      </FooterModal>

      <div
        className="relative w-full px-4 sm:px-8 py-8 sm:py-10 overflow-hidden"
      >
        {/* Inner Content Container - Static Neon Style on desktop, simplified on mobile */}
        <div 
          className={`relative max-w-7xl mx-auto flex flex-col items-center gap-6 sm:gap-8 bg-black rounded-2xl p-4 sm:p-6 ${shouldSkipHeavyEffects ? 'border border-white/50' : 'neon-blue-border'}`}
        >
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
            <button
              onClick={handleDisclaimerClick}
              className={`px-4 py-2 text-sm font-medium bg-black rounded-full transition-all hover:brightness-110 active:scale-95 ${shouldSkipHeavyEffects ? 'border border-white/50 text-white' : 'neon-blue-border neon-blue-text'}`}
            >
              Disclaimer
            </button>
            <button
              onClick={handleAppsClick}
              className={`px-4 py-2 text-sm font-medium bg-black rounded-full transition-all hover:brightness-110 active:scale-95 ${shouldSkipHeavyEffects ? 'border border-white/50 text-white' : 'neon-blue-border neon-blue-text'}`}
            >
              Apps & Tools
            </button>
          </div>

          {/* Bottom: Socials Row */}
          <div className="mt-2 sm:mt-4">
            <SocialsRow />
          </div>

          {/* Copyright - Neon White Text on desktop, regular on mobile */}
          <p 
            className="text-[10px] sm:text-xs font-light tracking-wide text-center mt-4 sm:mt-6"
            style={{
              color: '#ffffff',
              textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 4px #ffffff, 0 0 8px rgba(255, 255, 255, 0.5)'
            }}
          >
            &copy; {currentYear} BullMoney. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}