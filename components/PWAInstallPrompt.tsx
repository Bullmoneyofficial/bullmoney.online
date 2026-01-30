"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  delay?: number;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  autoShow = true,
  delay = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');

      if (isStandalone) {
        return; // Already installed, don't show
      }

      // Check if dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          // Don't show again for 7 days
          return;
        }
      }

      // Listen for install prompt
      const handleBeforeInstallPrompt = () => {
        setIsInstallable(true);
        if (autoShow && !hasBeenDismissed) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      };

      window.addEventListener('pwa-install-available', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('pwa-install-available', handleBeforeInstallPrompt);
      };
    }
    return () => {};
  }, [autoShow, delay, hasBeenDismissed]);

  const handleInstall = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).showInstallPrompt) {
      (window as any).showInstallPrompt();
      setIsVisible(false);
      onInstall?.();
    }
  }, [onInstall]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  }, [onDismiss]);

  if (!isInstallable || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-safe left-4 right-4 z-[999999] pointer-events-auto"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          }}
        >
          <div className="max-w-md mx-auto bg-gradient-to-r from-white to-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              aria-label="Dismiss install prompt"
            >
              <X size={18} className="text-white" />
            </button>

            {/* Content */}
            <div className="p-5 pr-12">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Download size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Install BullMoney
                  </h3>
                  <p className="text-sm text-white/90 mb-3 leading-relaxed">
                    Get instant access with app-like experience. Works offline, loads faster!
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full">
                      <Zap size={12} className="text-yellow-300" />
                      <span className="text-xs font-medium text-white">Faster</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full">
                      <Smartphone size={12} className="text-white" />
                      <span className="text-xs font-medium text-white">App-like</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium text-white">Offline</span>
                    </div>
                  </div>

                  {/* Install Button */}
                  <motion.button
                    onClick={handleInstall}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 min-h-[52px] touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    Install Now
                  </motion.button>

                  <p className="text-[10px] text-white/60 mt-2 text-center">
                    Free • No app store • Instant access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
