"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// Apple-style minimal black & white design
const APPLE_MODAL_STYLES = `
  .modal-apple-title {
    color: #ffffff;
    letter-spacing: -0.02em;
  }
  .modal-apple-text {
    color: rgba(255, 255, 255, 0.9);
  }
  .modal-apple-muted {
    color: rgba(255, 255, 255, 0.5);
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
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <style dangerouslySetInnerHTML={{ __html: APPLE_MODAL_STYLES }} />
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ zIndex: 2147483647 }}
            onClick={onClose}
          >
            {/* Full-screen container - no dim, no backdrop, no black */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-0 flex flex-col bg-black"
              style={{ zIndex: 2147483647 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div 
                className="relative flex flex-row items-center justify-between px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 shrink-0"
                style={{ 
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Title */}
                <div className="relative flex-1 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-white truncate pr-4 order-1">
                  {title}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="relative w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center group shrink-0 transition-all duration-200 order-2 ml-auto hover:bg-white/10 active:bg-white/20"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', zIndex: 2147483647 }}
                >
                  <X className="h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 text-white/80 transition-transform group-hover:scale-110 duration-200" />
                </button>
              </div>

              {/* Scrollable content - full remaining height */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 footer-scrollbar relative bg-black"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  touchAction: 'pan-y'
                }}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default EnhancedModal;
