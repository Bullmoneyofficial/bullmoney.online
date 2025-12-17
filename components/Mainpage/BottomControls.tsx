"use client";

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { createPortal } from 'react-dom'; // <--- KEY FIX
import { Volume2, Volume1, VolumeX, Palette, Sparkles, Music, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// 1. Reusable Button
const ControlButton = forwardRef<HTMLButtonElement, { 
  onClick: (e: React.MouseEvent) => void; 
  active?: boolean; 
  icon: React.ElementType; 
  label: string;
  className?: string;
  children?: React.ReactNode;
}>(({ onClick, active, icon: Icon, label, className, children }, ref) => (
  <motion.button
    ref={ref}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    className={cn(
      "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 group outline-offset-2 outline-blue-500",
      active 
        ? "bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10",
      "border backdrop-blur-sm",
      className
    )}
  >
    <Icon size={18} />
    {children}
  </motion.button>
));
ControlButton.displayName = "ControlButton";

// 2. The Portal Helper (Renders outside the main DOM tree)
type GuideStep = 'idle' | 'moving-to-theme' | 'at-theme' | 'moving-to-volume' | 'at-volume';

const AnimatedGuideHelper = ({ 
  themePos, volumePos, currentStep 
}: { 
  themePos: { x: number, y: number } | null, 
  volumePos: { x: number, y: number } | null,
  currentStep: GuideStep
}) => {
  // Wait until we have positions and we are on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted || !themePos || !volumePos) return null;

  // Use Portal to render directly into body (solves z-index/overflow issues)
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      <motion.div
        initial={{ x: "50vw", y: "50vh", opacity: 0, scale: 0 }}
        animate={(() => {
            // Logic to determine animation based on step
            switch (currentStep) {
                case 'idle':
                    return { opacity: 0, scale: 0 };
                case 'moving-to-theme':
                    return { x: themePos.x + 15, y: themePos.y + 15, opacity: 1, scale: 1 };
                case 'at-theme':
                    return { x: themePos.x + 15, y: themePos.y + 15, scale: 0.9 }; // Tap
                case 'moving-to-volume':
                    return { x: volumePos.x + 15, y: volumePos.y + 15, opacity: 1, scale: 1 };
                case 'at-volume':
                    return { x: volumePos.x + 15, y: volumePos.y + 15, scale: 0.9 }; // Tap
                default:
                    return { opacity: 0 };
            }
        })()}
        transition={{ 
            type: "spring", 
            stiffness: 70, 
            damping: 15,
            opacity: { duration: 0.3 }
        }}
        className="absolute top-0 left-0"
      >
        {/* The Hand Icon */}
        <Hand size={32} className="text-white fill-black/50 rotate-[-25deg] drop-shadow-xl stroke-[1.5px]" />

        {/* Floating Tooltips */}
        <AnimatePresence mode='wait'>
          {currentStep === 'at-theme' && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: -20 }}
              animate={{ opacity: 1, y: -45, x: -30 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/20"
            >
              Change Theme
            </motion.div>
          )}
          {currentStep === 'at-volume' && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: -20 }}
              animate={{ opacity: 1, y: -45, x: -20 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/20"
            >
              Adjust Volume
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body // Target container
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
  const [isInteractingVolume, setIsInteractingVolume] = useState(false);
  
  // Refs & Positions
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const volumeBtnRef = useRef<HTMLButtonElement>(null);
  const [themePos, setThemePos] = useState<{x:number, y:number} | null>(null);
  const [volumePos, setVolumePos] = useState<{x:number, y:number} | null>(null);
  const [guideStep, setGuideStep] = useState<GuideStep>('idle');

  // Measure positions AFTER the component has animated in
  const updatePositions = useCallback(() => {
    if (themeBtnRef.current && volumeBtnRef.current) {
        const themeRect = themeBtnRef.current.getBoundingClientRect();
        const volRect = volumeBtnRef.current.getBoundingClientRect();
        
        // Safety check: ensure we aren't getting 0,0 coordinates
        if (themeRect.top > 0 && volRect.top > 0) {
            setThemePos({ 
                x: themeRect.left + themeRect.width / 2, 
                y: themeRect.top + themeRect.height / 2 
            });
            setVolumePos({ 
                x: volRect.left + volRect.width / 2, 
                y: volRect.top + volRect.height / 2 
            });
        }
    }
  }, []);

  // Watch for resize and initial mount
  useEffect(() => {
    if (visible) {
        // Wait 600ms for the entrance animation (slide up) to finish
        // This is crucial: if we measure too early, we get the "slide up" coordinates, not the final ones
        const timer = setTimeout(updatePositions, 600);
        
        window.addEventListener('resize', updatePositions);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePositions);
        };
    }
  }, [visible, updatePositions]);

  // Animation Loop
  useEffect(() => {
    // Only start if we have valid positions
    if (!showHelper || !visible || !themePos || !volumePos) return;

    let mounted = true;

    const sequence = async () => {
        // Start loop
        while (mounted && showHelper) {
            setGuideStep('moving-to-theme');
            await delay(1000); // Travel time
            if (!mounted) break;

            setGuideStep('at-theme');
            await delay(1500); // Pause on button
            if (!mounted) break;

            setGuideStep('moving-to-volume');
            await delay(800); // Travel time
            if (!mounted) break;

            setGuideStep('at-volume');
            await delay(1500); // Pause on button
            if (!mounted) break;
            
            // Loop break (briefly hide)
            setGuideStep('idle');
            await delay(500);
        }
    };
    sequence();
    return () => { mounted = false; };
  }, [showHelper, visible, themePos, volumePos]);

  // Stop animation if user interacts
  const handleInteraction = () => {
     setShowHelper(false);
     setGuideStep('idle');
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume > 50 ? Volume2 : Volume1;

  return (
    <>
      <AnimatedGuideHelper 
        themePos={themePos} 
        volumePos={volumePos} 
        currentStep={guideStep} 
      />

      <AnimatePresence>
        {visible && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-6 left-6 z-[9998] flex flex-col items-start gap-3"
            onMouseEnter={() => { setIsHovered(true); handleInteraction(); }}
            onMouseLeave={() => { setIsHovered(false); setIsInteractingVolume(false); }}
            onTouchStart={handleInteraction}
          >
            {/* Control Bar */}
            <div className="flex items-center p-1.5 gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl relative">
              <ControlButton 
                ref={themeBtnRef}
                onClick={onOpenTheme} 
                icon={Palette} 
                label="Change Theme" 
                className="hover:border-purple-500/50 hover:text-purple-400"
              />

              <div className="w-px h-6 bg-white/10" />

              <div 
                className="flex items-center"
                onMouseEnter={() => setIsInteractingVolume(true)}
              >
                <ControlButton 
                  ref={volumeBtnRef}
                  onClick={onToggleMusic} 
                  active={isPlaying} 
                  icon={isPlaying ? VolumeIcon : VolumeX} 
                  label={isPlaying ? "Pause Music" : "Play Music"}
                />

                <motion.div 
                  initial={false}
                  animate={{ 
                    width: (isHovered || isInteractingVolume) ? 100 : 0,
                    opacity: (isHovered || isInteractingVolume) ? 1 : 0,
                    paddingLeft: (isHovered || isInteractingVolume) ? 8 : 0,
                    paddingRight: (isHovered || isInteractingVolume) ? 8 : 0,
                  }}
                  className="overflow-hidden h-10 flex items-center"
                >
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </motion.div>
              </div>
            </div>
            
            {/* Track Info */}
            {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pl-3"
                >
                  <div className="flex items-center gap-2">
                    <Music size={12} className="text-blue-400" />
                    <span className="text-xs text-gray-200 font-medium">
                      {themeName} Radio
                    </span>
                  </div>
                </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};