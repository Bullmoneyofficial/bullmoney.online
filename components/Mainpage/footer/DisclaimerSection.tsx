"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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
      className="group relative rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: 'black',
        border: '1px solid #3b82f6',
        boxShadow: isOpen ? '0 0 8px rgba(59, 130, 246, 0.5)' : '0 0 4px rgba(59, 130, 246, 0.3)'
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(number)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        title={title}
        className="relative flex w-full items-center justify-between text-left gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 min-h-[32px] xs:min-h-[36px]"
      >
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0 flex-1">
          <span 
            className="flex h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded text-[7px] xs:text-[8px] sm:text-[9px] font-bold font-mono flex-shrink-0"
            style={{
              color: '#3b82f6',
              textShadow: '0 0 4px #3b82f6',
              border: '1px solid #3b82f6',
              boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
              background: 'rgba(59, 130, 246, 0.1)'
            }}
          >
            {number}
          </span>
          <span 
            className="line-clamp-1 text-[10px] xs:text-xs sm:text-sm font-semibold"
            style={{ color: '#ffffff', textShadow: '0 0 4px rgba(255, 255, 255, 0.5)' }}
          >
            {title}
          </span>
        </div>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-300 flex-shrink-0",
            isOpen ? "rotate-90" : "rotate-0"
          )}
          style={{ 
            color: '#3b82f6',
            filter: 'drop-shadow(0 0 4px #3b82f6)'
          }}
        />
      </button>

      <motion.div
        id={contentId}
        aria-hidden={!isOpen}
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative z-10 px-1.5 pb-1.5 xs:px-2 xs:pb-2 sm:px-2.5 sm:pb-2.5 overflow-hidden"
      >
        <div className="space-y-1" aria-hidden={!isOpen}>
          <p 
            className="text-[8px] xs:text-[9px] sm:text-[10px] pl-5 xs:pl-6 sm:pl-7 leading-relaxed"
            style={{ color: '#9ca3af', textShadow: '0 0 2px rgba(156, 163, 175, 0.3)' }}
          >
            {text}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DisclaimerSection;
