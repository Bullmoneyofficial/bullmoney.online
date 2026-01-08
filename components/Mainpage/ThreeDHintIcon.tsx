"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ThreeDHintIconProps {
  onClick: () => void;
  accentColor?: string;
  disableSpline?: boolean;
  showHint?: boolean;
  isOpen?: boolean;
  dockSide?: 'left' | 'right';
}

export const ThreeDHintIcon: React.FC<ThreeDHintIconProps> = ({
  onClick,
  accentColor = '#3b82f6',
  disableSpline = false,
  showHint = true,
  isOpen = false,
  dockSide = 'right'
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showInitialHint, setShowInitialHint] = useState(showHint);
  const [pulse, setPulse] = useState(true);
  const tooltipOffsetX = dockSide === 'left' ? -10 : 10;

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowInitialHint(false), 15000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showHint]);

  // Pulse when 3D is disabled
  useEffect(() => {
    if (disableSpline) {
      setPulse(true);
      const interval = setInterval(() => {
        setPulse(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setPulse(false);
    }
    return undefined;
  }, [disableSpline]);

  const handleClick = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    onClick();
    setShowInitialHint(false);
  };

  return (
    <div
      className="fixed z-[10000] pointer-events-auto"
      style={{
        ...(dockSide === 'left'
          ? { left: 'calc(env(safe-area-inset-left, 0px) + 22px)' }
          : { right: 'max(1rem, calc(1rem + env(safe-area-inset-right, 0px)))' }),
        top: dockSide === 'left'
          ? 'calc(50vh - 120px + env(safe-area-inset-top, 0px))'
          : 'calc(50vh - 220px + env(safe-area-inset-top, 0px))',
      }}
    >
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => {
          setIsHovering(true);
          setShowInitialHint(false);
        }}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={(e) => {
          setShowInitialHint(false);
          e.currentTarget.style.transform = 'scale(0.9)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = '';
        }}
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shadow-2xl hover:scale-110 active:scale-95 transition-all touch-manipulation group"
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
        animate={{
          scale: pulse ? [1, 1.1, 1] : (isOpen ? 1.05 : 1),
        }}
        transition={{
          duration: 0.8,
          repeat: pulse ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Rotating Gradient Background */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: isOpen ? 2 : 4, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 0deg, ${accentColor}, ${isOpen ? accentColor : '#ffffff'}, ${accentColor})`,
          }}
        />

        {/* Inner Circle */}
        <div className="absolute inset-[2px] rounded-full bg-black/90 backdrop-blur-xl flex items-center justify-center">
          <motion.div
            animate={{
              rotate: isOpen ? 180 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            <Sparkles
              size={20}
              className="sm:w-6 sm:h-6"
              style={{ color: accentColor }}
            />
          </motion.div>

          {/* Pulsing Ring when 3D is off or menu is open */}
          {(disableSpline || isOpen) && (
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: accentColor }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: isOpen ? 1.5 : 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </div>

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: pulse || isOpen
              ? [
                  `0 0 20px ${accentColor}60`,
                  `0 0 ${isOpen ? '50px' : '35px'} ${accentColor}${isOpen ? '90' : '80'}`,
                  `0 0 20px ${accentColor}60`,
                ]
              : `0 0 ${isHovering ? '40px' : '20px'} ${accentColor}${isHovering ? '80' : '60'}`,
          }}
          transition={{
            duration: isOpen ? 1.5 : 2,
            repeat: (pulse || isOpen) ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </motion.button>

      {/* Tooltip / Hint */}
      <AnimatePresence>
        {(isHovering || showInitialHint) && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: tooltipOffsetX, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: tooltipOffsetX, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap ${
              dockSide === 'left' ? 'left-full ml-3' : 'right-full mr-3'
            }`}
          >
            <div className="relative">
              {/* Arrow */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent ${
                  dockSide === 'left'
                    ? 'left-[-8px] border-r-8'
                    : 'right-[-8px] border-l-8'
                }`}
                style={dockSide === 'left' ? { borderRightColor: accentColor } : { borderLeftColor: accentColor }}
              />

              {/* Content */}
              <div
                className="px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 10px 30px ${accentColor}60`,
                }}
              >
                <Sparkles size={16} className="text-white" />
                <div>
                  <div className="text-sm font-bold text-white">
                    {disableSpline ? 'Enable 3D' : 'Control Panel'}
                  </div>
                  <div className="text-[10px] text-white/80">
                    {disableSpline ? 'Turn on 3D scenes' : 'Tap to toggle controls'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Hint Text */}
      <AnimatePresence>
        {showInitialHint && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full mt-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-xl shadow-lg lg:hidden ${
              dockSide === 'left' ? 'left-0' : 'right-0'
            }`}
            style={{
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            <div className="text-[10px] font-bold text-white flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Control Panel
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open/Close Status Indicator */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-full mt-2 px-2 py-1 rounded-full border backdrop-blur-xl shadow-lg ${
              dockSide === 'left' ? 'left-0' : 'right-0'
            }`}
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}60`,
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            <div className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: accentColor }}>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              OPEN
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreeDHintIcon;
