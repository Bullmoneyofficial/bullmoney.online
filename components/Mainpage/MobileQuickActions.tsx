"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Palette, Volume1, Volume2, VolumeX, 
  Zap, Settings2, X, GripHorizontal, Command 
} from 'lucide-react';
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
  safeAreaBottom?: string | number;
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
}: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);

  const showPerformance = typeof onPerformanceToggle === 'function';
  const showMusic = typeof onMusicToggle === 'function';
  const showTheme = typeof onThemeClick === 'function';
  const showHelp = typeof onHelpClick === 'function';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        playClick();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (action?: () => void, vibration = 8) => {
    if (!action) return;
    playClick();
    if (navigator.vibrate) navigator.vibrate(vibration);
    action();
  };

  const toggleMenu = () => {
    if (!isDragging) {
      playClick();
      setIsOpen(!isOpen);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-[-1]" />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        /**
         * UPDATED: Positioned Middle Left
         * initial x: 12 provides a small breathing gap from the screen edge
         */
        initial={{ x: 12, y: 0 }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999]" 
        style={safeAreaInlinePadding}
      >
        <div className="relative flex flex-col items-start gap-2">
          
          <div 
            className={`
              relative flex flex-col items-center justify-center p-1 rounded-2xl
              backdrop-blur-xl border transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              ${isOpen 
                ? 'bg-black/80 border-white/20 w-16' 
                : 'bg-white/10 border-white/10 hover:bg-white/15 w-14 h-14'
              }
            `}
          >
            <div className="absolute top-0 inset-x-0 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50">
               <GripHorizontal size={12} className="text-white/40" />
            </div>

            <button 
              onClick={toggleMenu}
              className="mt-2 w-full h-full flex items-center justify-center outline-none"
            >
               <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
               >
                 {isOpen ? <X size={20} className="text-red-400"/> : <Settings2 size={22} className="text-white"/>}
               </motion.div>
            </button>

            <AnimatePresence>
              {!isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-6 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1 text-[9px] font-mono text-white/30 bg-black/40 px-1.5 py-0.5 rounded">
                    <Command size={8} /> K
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, height: 'auto', scale: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.9, x: -20 }}
                className="flex flex-col gap-2 overflow-hidden bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-2 shadow-2xl origin-left"
              >
                {showPerformance && (
                  <ActionButton 
                    icon={<Zap size={16} />}
                    label="GFX"
                    value={disableSpline ? "LITE" : "PRO"}
                    active={!disableSpline}
                    onClick={() => handleAction(onPerformanceToggle, 10)}
                    colorClass="text-orange-400"
                  />
                )}

                {showMusic && (
                  <ActionButton 
                    icon={isPlaying ? (volume > 50 ? <Volume2 size={16} /> : <Volume1 size={16} />) : <VolumeX size={16} />}
                    label="SFX"
                    value={isPlaying ? "ON" : "OFF"}
                    active={isPlaying}
                    onClick={() => handleAction(onMusicToggle, 8)}
                    colorClass="text-emerald-400"
                  />
                )}

                {showTheme && (
                  <ActionButton 
                    icon={<Palette size={16} />}
                    label="UI"
                    value="THEME"
                    active={true}
                    onClick={() => handleAction(onThemeClick, 8)}
                    colorClass="text-purple-400"
                  />
                )}

                {showHelp && (
                  <ActionButton 
                    icon={<MessageCircle size={16} />}
                    label="SYS"
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

// ... ActionButton component remains the same
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
    whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors group text-left min-w-[140px]"
  >
    <div className={`p-1.5 rounded-md bg-white/5 border border-white/5 ${active ? colorClass : 'text-gray-500'}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] text-white/40 font-mono leading-tight">{label}</span>
      <span className={`text-xs font-bold font-mono ${active ? 'text-white' : 'text-gray-500'}`}>
        {value}
      </span>
    </div>
    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`} />
  </motion.button>
);