"use client";

import { MessageCircle } from 'lucide-react';
import { playClick } from '@/lib/interactionUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileQuickActionsProps {
  isVisible: boolean;
  safeAreaBottom: string;
  onHelpClick: () => void;
}

// Helper to generate BULLMONEY-style shimmer gradient
const getShimmerGradient = (color: string) =>
  `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${color} 50%, #00000000 100%)`;

export function MobileQuickActions({
  isVisible,
  safeAreaBottom,
  onHelpClick,
}: MobileQuickActionsProps) {
  // BULLMONEY blue color scheme
  const primaryBlue = '#3b82f6';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 right-0 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pr-3"
          style={{
            zIndex: 9998,
            paddingBottom: safeAreaBottom,
          }}
        >
          {/* Support Button - Single Glowing Icon */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              playClick();
              if (navigator.vibrate) navigator.vibrate(12);
              onHelpClick();
            }}
            className="relative flex items-center justify-center rounded-full w-10 h-10 transition-all overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${primaryBlue}20, ${primaryBlue}08)`,
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="Support"
          >
            {/* Rotating shimmer effect - BULLMONEY style */}
            <motion.div
              className="absolute inset-[-100%]"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              style={{ background: getShimmerGradient(primaryBlue) }}
            />

            {/* Pulsing glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `1.5px solid ${primaryBlue}`,
                boxShadow: `0 0 15px ${primaryBlue}80`
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `1.5px solid ${primaryBlue}`,
                boxShadow: `0 0 15px ${primaryBlue}80`
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />

            <div className="absolute inset-[1.5px] rounded-full bg-black/90 flex items-center justify-center z-10">
              <MessageCircle
                size={20}
                strokeWidth={2.5}
                className="drop-shadow-[0_0_8px_currentColor]"
                style={{ color: primaryBlue }}
              />
            </div>
          </motion.button>

          <style jsx>{`
            @keyframes premium-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }

            @keyframes glow-pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }

            @keyframes pulse {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.3; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
