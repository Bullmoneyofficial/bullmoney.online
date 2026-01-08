"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Palette, Volume1, Volume2, VolumeX, 
  Zap, Settings2, X, GripHorizontal, Command} from 'lucide-react';
import { playClick } from '@/lib/interactionUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileQuickActionsProps {
  isVisible: boolean;
  disableSpline?: boolean;
  isPlaying?: boolean;
  volume?: number;
  onPerformanceToggle?: () => void;
  onMusicToggle?: () => void;
  onThemeClick?: () => void;
  onHelpClick?: () => void;
  safeAreaInlinePadding?: React.CSSProperties;
  safeAreaBottom?: React.CSSProperties['bottom'];
}

export function MobileQuickActions({
  isVisible,
  disableSpline = false,
  isPlaying = false,
  volume = 0,
  onPerformanceToggle,
  onMusicToggle,
  onThemeClick,
  onHelpClick,
  safeAreaInlinePadding,
  safeAreaBottom,
}: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user has seen it
  const constraintsRef = useRef(null);

  const showPerformance = typeof onPerformanceToggle === 'function';
  const showMusic = typeof onMusicToggle === 'function';
  const showTheme = typeof onThemeClick === 'function';
  const showHelp = typeof onHelpClick === 'function';

  // Keybind listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        playClick();
        setIsOpen((prev) => !prev);
        setHasInteracted(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (action?: () => void, vibration = 8) => {
    if (!action) return;
    playClick();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(vibration);
    }
    action();
    // Optional: Close menu after action? 
    // setIsOpen(false); 
  };

  // Improved Toggle Logic using Tap instead of Click to fix Drag conflicts
  const handleTap = () => {
    if (!isDragging) {
      playClick();
      setIsOpen((prev) => !prev);
      setHasInteracted(true);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Constraints Area */}
      <div
        ref={constraintsRef}
        className="fixed inset-4 pointer-events-none z-[-1]"
        style={safeAreaBottom ? { bottom: safeAreaBottom } : undefined}
      />

      {/* Backdrop: Close on tap outside when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/10 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)} // Small debounce to prevent accidental clicks
        initial={{ x: 12, y: 0 }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999]"
        style={safeAreaInlinePadding}
      >
        <div className="relative flex flex-col items-start gap-2">
          
          {/* Main Toggle Button */}
          <motion.div 
            // Blue Glow & Shimmer Animation when closed
            animate={!isOpen ? {
              boxShadow: [
                "0px 0px 0px rgba(59, 130, 246, 0)",
                "0px 0px 20px rgba(59, 130, 246, 0.5)",
                "0px 0px 0px rgba(59, 130, 246, 0)"
              ],
              transition: { duration: 3, repeat: Infinity }
            } : {
              boxShadow: "0px 8px 32px rgba(0,0,0,0.4)"
            }}
            className={`
              relative flex flex-col items-center justify-center p-1 rounded-2xl
              backdrop-blur-xl border transition-all duration-300 overflow-hidden
              ${isOpen 
                ? 'bg-black/90 border-white/20 w-16' 
                : 'bg-white/10 border-blue-400/30 w-14 h-14'
              }
            `}
          >
            {/* Shimmer Effect Overlay (Only when closed) */}
            {!isOpen && (
              <motion.div
                className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-blue-400/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
              />
            )}

            {/* Drag Handle */}
            <div className="absolute top-0 inset-x-0 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 z-10">
               <GripHorizontal size={12} className={isOpen ? "text-white/40" : "text-blue-200"} />
            </div>

            {/* Button Icon */}
            <motion.button 
              onTap={handleTap} // Use onTap instead of onClick for better touch handling
              className="mt-2 w-full h-full flex items-center justify-center outline-none z-10 relative"
            >
               <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
               >
                 {isOpen ? (
                   <X size={20} className="text-red-400"/>
                 ) : (
                   <Settings2 size={22} className="text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"/>
                 )}
               </motion.div>
            </motion.button>

            {/* Desktop Shortcut Hint */}
            <AnimatePresence>
              {!isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-6 whitespace-nowrap hidden sm:block"
                >
                  <div className="flex items-center gap-1 text-[9px] font-mono text-white/30 bg-black/40 px-1.5 py-0.5 rounded">
                    <Command size={8} /> K
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Helper / Tip Tooltip */}
          <AnimatePresence>
            {!isOpen && !hasInteracted && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute left-[4.5rem] top-2 pointer-events-none"
              >
                <div className="bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border border-blue-400/50 whitespace-nowrap flex items-center gap-2">
                  <span>Quick Menu</span>
                  <div className="w-2 h-2 bg-blue-600/90 absolute -left-1 top-1/2 -translate-y-1/2 rotate-45 border-l border-b border-blue-400/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Menu Items */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, height: 'auto', scale: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.9, x: -20 }}
                className="flex flex-col gap-2 overflow-hidden bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 p-2 shadow-2xl origin-left min-w-[160px]"
              >
                {showPerformance && (
                  <ActionButton 
                    icon={<Zap size={16} />}
                    label="GRAPHICS"
                    value={disableSpline ? "LITE" : "PRO"}
                    active={!disableSpline}
                    onClick={() => handleAction(onPerformanceToggle, 10)}
                    colorClass="text-orange-400"
                  />
                )}

                {showMusic && (
                  <ActionButton 
                    icon={isPlaying ? (volume > 50 ? <Volume2 size={16} /> : <Volume1 size={16} />) : <VolumeX size={16} />}
                    label="AUDIO"
                    value={isPlaying ? "ON" : "OFF"}
                    active={isPlaying}
                    onClick={() => handleAction(onMusicToggle, 8)}
                    colorClass="text-emerald-400"
                  />
                )}

                {showTheme && (
                  <ActionButton 
                    icon={<Palette size={16} />}
                    label="INTERFACE"
                    value="THEME"
                    active={true}
                    onClick={() => handleAction(onThemeClick, 8)}
                    colorClass="text-purple-400"
                  />
                )}

                {showHelp && (
                  <ActionButton 
                    icon={<MessageCircle size={16} />}
                    label="SYSTEM"
                    value="HELP"
                    active={true}
                    onClick={() => handleAction(onHelpClick, 10)}
                    colorClass="text-blue-400"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
  colorClass: string;
  active: boolean;
}

const ActionButton = ({ icon, label, value, onClick, colorClass, active }: ActionButtonProps) => (
  <motion.button
    whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}
    whileTap={{ scale: 0.96 }}
    onTap={onClick} // Unified tap handler
    className="flex items-center gap-3 w-full p-2.5 rounded-lg transition-colors group text-left"
  >
    <div className={`p-1.5 rounded-md bg-white/5 border border-white/5 shadow-inner ${active ? colorClass : 'text-gray-500'}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] text-white/30 font-mono leading-none mb-1 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold font-mono ${active ? 'text-white' : 'text-gray-500'}`}>
        {value}
      </span>
    </div>
    <div 
      className={`ml-auto w-2 h-2 rounded-full transition-all duration-300 ${
        active 
          ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
          : 'bg-gray-800'
      }`} 
    />
  </motion.button>
);
