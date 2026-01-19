"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TelegramFeed } from './TelegramFeed';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelegramModal({ isOpen, onClose }: TelegramModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 bg-black/95"
          onClick={onClose}
        >
          {/* Tap to close hints - Top */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
            transition={{ opacity: { duration: 2, repeat: Infinity }, y: { duration: 0.3 } }}
            className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-xs sm:text-sm pointer-events-none"
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
            className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-xs sm:text-sm pointer-events-none"
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
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/40 text-[10px] sm:text-xs pointer-events-none"
          >
            <span>←</span>
            <span className="writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
          </motion.div>

          {/* Tap to close hints - Right */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: [0.3, 0.6, 0.3], x: 0 }}
            transition={{ opacity: { duration: 2, repeat: Infinity, delay: 0.75 }, x: { duration: 0.3 } }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/40 text-[10px] sm:text-xs pointer-events-none"
          >
            <span>→</span>
            <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 shadow-2xl shadow-black/50"
          >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Telegram Feed</h2>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors group"
                  aria-label="Close modal"
                >
                  <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-300 hidden sm:inline">ESC to close</span>
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <TelegramFeed
                  limit={50}
                  refreshInterval={300000}
                  showHeader={false}
                  compact={false}
                />
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TelegramModal;
