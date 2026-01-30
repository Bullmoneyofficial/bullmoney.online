"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

export interface FooterButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export const FooterButton = ({ onClick, children, variant = "secondary", icon }: FooterButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        SoundEffects.click();
        onClick();
      }}
      onMouseEnter={() => SoundEffects.hover()}
      className={cn(
        "relative group h-10 sm:h-11 inline-flex items-center justify-center rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden min-w-[44px]"
      )}
      style={{
        background: 'black',
        border: isPrimary ? '2px solid #ffffff' : '1px solid #ffffff',
        boxShadow: isPrimary 
          ? '0 0 8px #ffffff, 0 0 16px rgba(255, 255, 255, 0.5)' 
          : '0 0 4px rgba(255, 255, 255, 0.5)'
      }}
    >
      <span 
        className="relative z-10 flex items-center gap-2"
        style={{
          color: '#ffffff',
          textShadow: '0 0 4px #ffffff, 0 0 8px rgba(255, 255, 255, 0.5)'
        }}
      >
        {icon && (
          <span 
            style={{ 
              color: '#ffffff',
              filter: 'drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff)'
            }}
          >
            {icon}
          </span>
        )}
        {children}
      </span>
    </motion.button>
  );
};

export default FooterButton;
