"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

interface TipsOverlayProps {
  show: boolean;
  open: boolean;
  streamingActive: boolean;
  onClose: () => void;
}

export const TipsOverlay = React.memo(function TipsOverlay({ show, open, streamingActive, onClose }: TipsOverlayProps) {
  return (
    <AnimatePresence>
      {show && open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed left-3 bottom-[280px] z-[100210] w-[280px] sm:w-[320px] pointer-events-auto"
        >
          <div className="relative p-3 rounded-xl bg-black/90 border border-blue-400/30 backdrop-blur-xl shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/25 hover:bg-white/35 transition-colors"
            >
              <IconX className="w-3.5 h-3.5 text-white/60" />
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <IconInfoCircle className="w-4 h-4 text-blue-300" />
              <span className="text-[11px] font-medium text-white">Quick Tips</span>
            </div>
            
            {!streamingActive ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/70">1️⃣ Pick a music service above</p>
                <p className="text-[10px] text-white/50">2️⃣ Close menu to see player</p>
                <p className="text-[10px] text-white/50">3️⃣ Press play in the player</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] text-blue-300">✅ Music service active!</p>
                <p className="text-[10px] text-white/60">← Swipe left to hide widget</p>
                <p className="text-[10px] text-white/60">🎵 Music plays when hidden</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
