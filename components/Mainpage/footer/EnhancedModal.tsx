"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-2 xs:p-3 sm:p-4 md:p-6"
        >
          <div onClick={onClose} className="absolute inset-0 bg-black/90" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className={cn(
              "relative w-full overflow-hidden rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl shadow-2xl shadow-blue-500/30",
              maxWidth
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-[-2px] overflow-hidden rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl pointer-events-none">
              <div className="absolute inset-0 shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-80" />
            </div>

            <div className="relative z-10 m-[2px] flex max-h-[90vh] xs:max-h-[88vh] sm:max-h-[85vh] md:max-h-[82vh] lg:max-h-[80vh] flex-col rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl bg-black overflow-hidden min-h-0">
              <div className="relative flex items-center justify-between border-b border-blue-500/30 px-3 xs:px-4 sm:px-5 md:px-6 py-2.5 xs:py-3 sm:py-3.5 md:py-4 bg-neutral-950 shrink-0">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/15 to-transparent shimmer-line shimmer-gpu" />
                </div>
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

                <div className="relative text-sm xs:text-base sm:text-lg md:text-xl font-semibold tracking-wide text-white truncate pr-3">
                  {title}
                </div>

                <button
                  onClick={onClose}
                  className="relative z-[9999999] p-1.5 xs:p-2 sm:p-2 md:p-2.5 rounded-full bg-neutral-900 border border-blue-500/40 hover:border-blue-400/70 text-neutral-400 hover:text-white hover:bg-blue-500/20 transition-all duration-300 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center group flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90 duration-300" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-5 md:py-6 footer-scrollbar relative bg-neutral-950">
                <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1)_0%,transparent_60%)] pointer-events-none" />
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedModal;
