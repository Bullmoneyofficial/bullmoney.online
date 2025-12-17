"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX, Palette, Sparkles, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
// Standard utility for cleaner tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface BottomControlsProps {
  isPlaying: boolean;
  onToggleMusic: () => void;
  onOpenTheme: () => void;
  themeName: string;
  volume: number;
  onVolumeChange: (val: number) => void;
  visible: boolean;
}

// --- Sub-Components ---

// 1. Reusable Icon Button with Tooltip capability
const ControlButton = ({ 
  onClick, 
  active, 
  icon: Icon, 
  label, 
  className,
  children 
}: { 
  onClick: (e: React.MouseEvent) => void; 
  active?: boolean; 
  icon: React.ElementType; 
  label: string;
  className?: string;
  children?: React.ReactNode;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    aria-label={label}
    className={cn(
      "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 group",
      active 
        ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10",
      "border backdrop-blur-sm",
      className
    )}
  >
    <Icon size={18} />
    {children}
    {/* Tooltip */}
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      {label}
    </span>
  </motion.button>
);

// 2. Animated Music Bars
const MusicBars = ({ isPlaying }: { isPlaying: boolean }) => {
  const barVariants = {
    playing: (i: number) => ({
      height: [4, 12, 4],
      transition: {
        repeat: Infinity,
        duration: 0.8,
        ease: "easeInOut",
        delay: i * 0.1, // Stagger effect
      },
    }),
    paused: {
      height: 4,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="flex items-end gap-[2px] h-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={barVariants}
          animate={isPlaying ? "playing" : "paused"}
          className="w-0.5 bg-blue-500 rounded-full"
        />
      ))}
    </div>
  );
};

// --- Main Component ---
export const BottomControls = ({ 
  isPlaying, 
  onToggleMusic, 
  onOpenTheme,
  themeName, 
  volume, 
  onVolumeChange,
  visible
}: BottomControlsProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showHelper, setShowHelper] = useState(true);
  // Track if user is interacting with volume to prevent auto-hide on touch
  const [isInteractingVolume, setIsInteractingVolume] = useState(false);

  // Auto-hide helper, but cancel if user hovers immediately
  useEffect(() => {
    const timer = setTimeout(() => setShowHelper(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Determine Volume Icon
  const VolumeIcon = volume === 0 ? VolumeX : volume > 50 ? Volume2 : Volume1;

  // Animation variants for container entrance/exit
  const containerVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", damping: 20, stiffness: 300 }
    },
    exit: { opacity: 0, y: 40, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-6 left-6 z-[9998] flex flex-col items-start gap-3"
          onMouseEnter={() => {
            setIsHovered(true);
            setShowHelper(false);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsInteractingVolume(false);
          }}
        >
          {/* Helper Tooltip */}
          <AnimatePresence>
            {showHelper && (
              <motion.div 
                initial={{ opacity: 0, y: 10, x: -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -top-12 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap border border-white/20 select-none pointer-events-none"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span>Customize your vibe!</span>
                <div className="absolute -bottom-1 left-4 w-2.5 h-2.5 bg-purple-500 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Control Bar */}
          <div className="flex items-center p-1.5 gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl hover:border-white/20 transition-colors">
            
            {/* Theme Button */}
            <ControlButton 
              onClick={onOpenTheme} 
              icon={Palette} 
              label="Change Theme" 
              className="hover:border-purple-500/50 hover:text-purple-400"
            />

            <div className="w-px h-6 bg-white/10" />

            {/* Volume Section */}
            <div 
              className="flex items-center"
              // Keep volume open if dragging slider
              onMouseEnter={() => setIsInteractingVolume(true)}
            >
              <ControlButton 
                onClick={onToggleMusic} 
                active={isPlaying} 
                icon={isPlaying ? VolumeIcon : VolumeX} 
                label={isPlaying ? "Pause Music" : "Play Music"}
              >
                 {/* Subtle ripple effect when playing */}
                {isPlaying && (
                  <span className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-20" />
                )}
              </ControlButton>

              {/* Animated Volume Slider */}
              <motion.div 
                initial={false}
                animate={{ 
                  width: (isHovered || isInteractingVolume) ? 100 : 0,
                  opacity: (isHovered || isInteractingVolume) ? 1 : 0,
                  paddingLeft: (isHovered || isInteractingVolume) ? 8 : 0,
                  paddingRight: (isHovered || isInteractingVolume) ? 8 : 0,
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="overflow-hidden h-10 flex items-center"
              >
                <div className="w-full relative h-6 flex items-center">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                    aria-label="Volume"
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Track Info (Desktop only usually, but responsive here) */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="pl-3 overflow-hidden"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Now Streaming</span>
                  <div className="flex items-center gap-2">
                    <Music size={12} className="text-blue-400" />
                    <span className="text-xs text-gray-200 font-medium tracking-tight shadow-black drop-shadow-md">
                      {themeName} Radio
                    </span>
                    <MusicBars isPlaying={isPlaying} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};