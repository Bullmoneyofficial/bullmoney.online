"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

// Neon Blue Sign Styles (Static glow like Chartnews)
const NEON_MODAL_STYLES = `
  .modal-neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, 0 0 12px #3b82f6;
  }
  .modal-neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .modal-neon-blue-border {
    border: 2px solid #3b82f6;
    box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, 0 0 16px #3b82f6, inset 0 0 4px rgba(59, 130, 246, 0.3);
  }
  .modal-neon-blue-icon {
    filter: drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6);
  }
`;

// Mobile-optimized styles (no glows)
const MOBILE_MODAL_STYLES = `
  .modal-neon-blue-text {
    color: #3b82f6;
  }
  .modal-neon-white-text {
    color: #ffffff;
  }
  .modal-neon-blue-border {
    border: 2px solid #3b82f6;
  }
  .modal-neon-blue-icon {
    color: #3b82f6;
  }
`;

export interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const EnhancedModal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
}: EnhancedModalProps) => {
  const { isMobile, animations, shouldSkipHeavyEffects } = useMobilePerformance();
  
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <style dangerouslySetInnerHTML={{ __html: shouldSkipHeavyEffects ? MOBILE_MODAL_STYLES : NEON_MODAL_STYLES }} />
          <motion.div
            key="modal-backdrop"
            initial={animations.modalBackdrop.initial}
            animate={animations.modalBackdrop.animate as TargetAndTransition}
            exit={animations.modalBackdrop.exit}
            transition={animations.modalBackdrop.transition}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-2 xs:p-3 sm:p-4 md:p-6"
          >
            <div onClick={onClose} className="absolute inset-0 bg-black/95" />

            <motion.div
              initial={animations.modalContent.initial}
              animate={animations.modalContent.animate as TargetAndTransition}
              exit={animations.modalContent.exit}
              transition={animations.modalContent.transition}
              className={cn(
                "relative w-full overflow-hidden rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl",
                maxWidth
              )}
              style={shouldSkipHeavyEffects ? {} : {
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Static neon border glow - skip on mobile */}
              {!shouldSkipHeavyEffects && (
                <div 
                  className="absolute inset-[-2px] rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl pointer-events-none modal-neon-blue-border"
                  style={{ background: 'transparent' }}
                />
              )}

              <div className="relative z-10 m-[2px] flex max-h-[90vh] xs:max-h-[88vh] sm:max-h-[85vh] md:max-h-[82vh] lg:max-h-[80vh] flex-col rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl bg-black overflow-hidden min-h-0">
                {/* Header with neon styling */}
                <div 
                  className="relative flex items-center justify-between px-3 xs:px-4 sm:px-5 md:px-6 py-2.5 xs:py-3 sm:py-3.5 md:py-4 bg-black shrink-0"
                  style={shouldSkipHeavyEffects ? { borderBottom: '2px solid #3b82f6' } : { 
                    borderBottom: '2px solid #3b82f6',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  {/* Static neon line at top - skip on mobile */}
                  {!shouldSkipHeavyEffects && (
                    <div 
                      className="absolute inset-x-0 top-0 h-[2px]"
                      style={{ 
                        background: '#3b82f6',
                        boxShadow: '0 0 8px #3b82f6, 0 0 16px #3b82f6'
                      }}
                    />
                  )}

                  <div className="relative text-sm xs:text-base sm:text-lg md:text-xl font-semibold tracking-wide modal-neon-white-text truncate pr-3">
                    {title}
                  </div>

                  <button
                    onClick={onClose}
                    className="relative z-[9999999] p-1.5 xs:p-2 sm:p-2 md:p-2.5 rounded-full bg-black text-white min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center group flex-shrink-0 transition-all duration-300"
                    style={{
                      border: '2px solid #3b82f6',
                      boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6'
                    }}
                  >
                    <X className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90 duration-300 modal-neon-blue-icon" style={{ color: '#3b82f6' }} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-5 md:py-6 footer-scrollbar relative bg-black">
                  {children}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnhancedModal;
