"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, TargetAndTransition } from 'framer-motion';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// Dynamically import the RecruitPage to avoid SSR issues
const RecruitPage = dynamic(() => import('@/app/recruit/RecruitPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-12 h-12 border-t-2 border-l-2 border-blue-500 rounded-full animate-spin" />
    </div>
  ),
});

interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecruitModal({ isOpen, onClose }: RecruitModalProps) {
  const [mounted, setMounted] = useState(false);
  const { 
    isMobile, 
    animations, 
    shouldDisableBackdropBlur,
    performanceTier 
  } = useMobilePerformance();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleUnlock = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  // Use mobile-optimized backdrop styles
  const backdropClass = shouldDisableBackdropBlur 
    ? 'bg-black/80' 
    : 'bg-black/60';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={animations.modalBackdrop.initial as TargetAndTransition}
          animate={animations.modalBackdrop.animate as TargetAndTransition}
          exit={animations.modalBackdrop.exit as TargetAndTransition}
          transition={animations.modalBackdrop.transition}
          className={`fixed inset-0 z-[9999] flex items-center justify-center h-full w-full ${backdropClass} mobile-no-blur`}
          data-performance-tier={performanceTier}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-transparent" onClick={onClose} />

          <motion.div
            initial={animations.modalContent.initial as TargetAndTransition}
            animate={animations.modalContent.animate as TargetAndTransition}
            exit={animations.modalContent.exit as TargetAndTransition}
            transition={animations.modalContent.transition}
            className={`relative w-[98%] md:w-[90%] max-w-2xl max-h-[95vh] bg-[#050B14] border border-blue-500/20 rounded-2xl ${isMobile ? '' : 'shadow-[0_0_50px_rgba(59,130,246,0.15)]'} overflow-hidden flex flex-col gpu-accelerated`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Modal Content - RecruitPage wrapped to work in modal context */}
            <div className="overflow-y-auto max-h-[95vh] recruit-modal-content" style={{ WebkitOverflowScrolling: 'touch' }}>
              <RecruitPage onUnlock={handleUnlock} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
