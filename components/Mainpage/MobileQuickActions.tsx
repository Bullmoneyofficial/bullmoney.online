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
  accentColor?: string;
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
  accentColor = '#3b82f6',
}: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user has seen it
  const [isButtonHovering, setIsButtonHovering] = useState(false);
  const constraintsRef = useRef(null);

  const showPerformance = typeof onPerformanceToggle === 'function';
  const showMusic = typeof onMusicToggle === 'function';
  const showTheme = typeof onThemeClick === 'function';
  const showHelp = typeof onHelpClick === 'function';
  // FIXED: Position above the 3D hint button (which is at 50vh - 120px)
  const stackLeft = 'calc(env(safe-area-inset-left, 0px) + 22px)';
  const stackTop = 'calc(50vh - 200px + env(safe-area-inset-top, 0px))';

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
        className="fixed z-[9999]"
        style={{
          ...(safeAreaInlinePadding || {}),
          left: stackLeft,
          top: stackTop,
        }}
      >
        <div className="relative flex flex-col items-start gap-2">
          
          {/* Main Toggle Button */}
          <motion.div
            animate={!isOpen
              ? {
                boxShadow: [
                  `0 0 0 rgba(59, 130, 246, 0)`,
                  `0 0 25px ${accentColor}60`,
                  `0 0 0 rgba(59, 130, 246, 0)`
                ]
              }
              : {
                boxShadow: "0px 12px 40px rgba(0,0,0,0.45)"
              }
            }
            transition={{ duration: 1.5, repeat: !isOpen ? Infinity : 0, ease: "easeInOut" }}
            className={`relative flex flex-col items-center justify-center p-1 rounded-full border transition-all duration-300 overflow-hidden bg-black/80 border-white/20 w-12 h-12 sm:w-14 sm:h-14 shadow-2xl`}
          >
            {/* Drag Handle */}
            <div className="absolute top-0 inset-x-0 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 z-10">
              <GripHorizontal size={12} className="text-white/40" />
            </div>

            {/* Button Icon */}
              <motion.button
                onTap={handleTap}
                onMouseEnter={() => {
                  setIsButtonHovering(true);
                  setHasInteracted(true);
                }}
                onMouseLeave={() => setIsButtonHovering(false)}
                onTouchStart={() => {
                  setIsButtonHovering(true);
                  setHasInteracted(true);
                }}
                onTouchEnd={() => setIsButtonHovering(false)}
                className="relative w-full h-full flex items-center justify-center outline-none z-10 rounded-full overflow-hidden"
                type="button"
                aria-label="Open quick actions"
              >
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: isOpen ? 0 : 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `conic-gradient(from 0deg, ${accentColor}, ${accentColor}, ${accentColor})`
                }}
              />
              <div className="absolute inset-[3px] rounded-full bg-black/90 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {isOpen ? (
                    <X size={20} className="text-red-400" />
                  ) : (
                    <Settings2 size={22} className="text-white drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
                  )}
                </motion.div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: isOpen
                    ? `0 0 15px ${accentColor}60, 0 0 35px ${accentColor}40`
                    : `0 0 20px ${accentColor}60`
                }}
                transition={{ duration: 1.5, repeat: isOpen ? Infinity : 0, ease: "easeInOut" }}
              />
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

          {/* Helper / Tip Tooltip - FIXED: Now overlays as a fixed element */}
          <AnimatePresence>
            {(!isOpen && (isButtonHovering || !hasInteracted)) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="fixed pointer-events-none z-[10001]"
                style={{
                  left: `calc(env(safe-area-inset-left, 0px) + 92px)`,
                  top: stackTop,
                  transform: 'translateY(8px)',
                }}
              >
                <div className="bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md border border-blue-400/50 whitespace-nowrap flex items-center gap-2">
                  <span>Quick Settings</span>
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
