"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisclaimerSectionProps {
  number: string;
  title: string;
  text: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

export const DisclaimerSection = ({ number, title, text, isOpen, onToggle }: DisclaimerSectionProps) => {
  const contentId = `disclaimer-${number}`;

  return (
    <div 
      className={cn(
        "group relative rounded-xl overflow-hidden transition-all duration-200",
        isOpen ? "bg-white/3" : "bg-transparent hover:bg-white/2"
      )}
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(number)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        title={title}
        className="relative flex w-full items-center justify-between text-left gap-2 xs:gap-3 p-3 xs:p-3.5 sm:p-4 min-h-11 xs:min-h-[48px]"
      >
        <div className="flex items-center gap-2.5 xs:gap-3 min-w-0 flex-1">
          {/* Apple-style number badge */}
          <span 
            className="flex h-6 w-6 xs:h-7 xs:w-7 items-center justify-center rounded-lg text-[10px] xs:text-xs font-medium font-mono shrink-0 bg-white/10 text-white/70"
          >
            {number}
          </span>
          <span className="line-clamp-1 text-sm xs:text-[15px] sm:text-base font-medium text-white tracking-tight">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 xs:h-5 xs:w-5 text-white/40 transition-transform duration-200 shrink-0",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      <motion.div
        id={contentId}
        aria-hidden={!isOpen}
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 overflow-hidden"
      >
        <div className="px-3 pb-3 xs:px-3.5 xs:pb-3.5 sm:px-4 sm:pb-4 pt-0">
          <p className="text-[13px] xs:text-sm sm:text-[15px] pl-8 xs:pl-10 leading-relaxed text-white/60">
            {text}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DisclaimerSection;
