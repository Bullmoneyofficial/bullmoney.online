"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronRight, X, ArrowLeft, Download } from "lucide-react";
import { createPortal } from "react-dom";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

export interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps?: {
    title: string;
    links: { label: string; href: string }[];
  }[];
}

const defaultApps: AppsModalProps["apps"] = [
  {
    title: "MetaTrader 5",
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5&pcampaignid=web_share" },
      { label: "App Store (ZA)", href: "https://apps.apple.com/za/app/metatrader-5/id413251709" },
      { label: "App Store (SC)", href: "https://apps.apple.com/sc/app/metatrader-5/id413251709" },
    ],
  },
  {
    title: "TradingView",
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.tradingview.tradingviewapp&pcampaignid=web_share" },
      { label: "App Store", href: "https://apps.apple.com/us/app/tradingview-track-all-markets/id1205990992" },
      { label: "Windows (.msix)", href: "https://tvd-packages.tradingview.com/stable/latest/win32/TradingView.msix" },
      { label: "macOS (.dmg)", href: "https://tvd-packages.tradingview.com/stable/latest/darwin/TradingView.dmg" },
    ],
  },
  {
    title: "Bullmoney Indicators",
    links: [
      { label: "Premium", href: "https://www.tradingview.com/script/OCrInl1O-BULLMONEY-PREMIUM/" },
      { label: "Free", href: "https://www.tradingview.com/script/CaYXTswS-BULLMONEY/" },
    ],
  },
];

export const AppsModal = ({ isOpen, onClose, apps = defaultApps }: AppsModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    onClose();
  }, [onClose]);

  const handleBackdropTouch = useCallback((e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      handleClose();
    }
  }, [handleClose]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={handleClose}
            onTouchEnd={handleBackdropTouch}
            className="fixed inset-0"
            style={{ zIndex: 2147483648, background: 'rgba(0,0,0,0.2)' }}
          />

          <motion.div
            initial={isDesktop ? { y: '-100%' } : { x: '100%' }}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={isDesktop ? { y: '-100%' } : { x: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh] overflow-hidden'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden'
            }
            style={{ zIndex: 2147483649, color: '#1d1d1f' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              <button
                onClick={handleClose}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center">
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="leading-tight text-center">
                  <h2 className="text-lg md:text-xl font-light">Apps & Tools</h2>
                  <p className="text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>Download & Connect</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-6 md:space-y-8">
                {apps?.map((app, idx) => (
                  <motion.section
                    key={app.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="space-y-3"
                  >
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-black mb-3">
                        {app.title}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {app.links.map((link) => (
                          <motion.a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => SoundEffects.click()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex items-center justify-between rounded-xl overflow-hidden px-3 py-2.5 md:py-3 text-xs md:text-sm bg-black/5 border border-black/10 hover:bg-black/8 hover:border-black/20 transition-all active:scale-95"
                          >
                            <span className="relative text-black font-medium truncate">{link.label}</span>
                            <ExternalLink className="relative h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5 text-black" />
                          </motion.a>
                        ))}
                        {app.title === "Bullmoney Indicators" && (
                          <motion.a
                            href="https://drive.google.com/drive/folders/1aVKPzJAkUqiZqVQnYIZ7M4E0lNOQ2kIi"
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => SoundEffects.click()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative col-span-2 sm:col-span-3 lg:col-span-2 flex items-center justify-center gap-2 rounded-xl overflow-hidden px-3 py-2.5 md:py-3 text-xs md:text-sm font-semibold bg-black text-white hover:bg-black/85 transition-all active:scale-95"
                          >
                            <span className="relative flex items-center gap-2">
                              Premium PDFs
                              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </motion.section>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AppsModal;
