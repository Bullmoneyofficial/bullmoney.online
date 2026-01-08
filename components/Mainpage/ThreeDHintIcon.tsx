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
  const horizontalInset = 'calc(env(safe-area-inset-left, 0px) + 22px)';
  const horizontalInsetRight = 'calc(env(safe-area-inset-right, 0px) + 22px)';
  const topOffset = dockSide === 'left'
    ? 'calc(50vh - 120px + env(safe-area-inset-top, 0px))'
    : 'calc(50vh - 120px + env(safe-area-inset-top, 0px))';

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
          ? { left: horizontalInset }
          : { right: horizontalInsetRight }),
        top: topOffset,
      }}
    >
      <motion.div
        animate={{
          boxShadow: pulse || isOpen
            ? `0 0 25px ${accentColor}60, 0 0 40px ${accentColor}30`
            : `0 0 15px ${accentColor}50`
        }}
        transition={{ duration: 1.5, repeat: pulse || isOpen ? Infinity : 0, ease: "easeInOut" }}
        className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 bg-black/80 shadow-2xl overflow-hidden"
      >
        <motion.button
          onTap={handleClick}
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
          className="relative w-full h-full flex items-center justify-center outline-none z-10 rounded-full overflow-hidden"
          style={{ WebkitTapHighlightColor: 'transparent' }}
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
              <Sparkles
                size={20}
                className="sm:w-6 sm:h-6"
                style={{ color: accentColor }}
              />
            </motion.div>
          </div>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: isOpen
                ? `0 0 18px ${accentColor}60, 0 0 40px ${accentColor}40`
                : `0 0 25px ${accentColor}40`
            }}
            transition={{ duration: 1.5, repeat: pulse || isOpen ? Infinity : 0, ease: "easeInOut" }}
          />
        </motion.button>
      </motion.div>

      {/* Tooltip / Hint - FIXED: Now overlays as fixed element */}
      <AnimatePresence>
        {(isHovering || showInitialHint) && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: tooltipOffsetX, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: tooltipOffsetX, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed pointer-events-none whitespace-nowrap z-[10001]"
            style={{
              left: dockSide === 'left' ? `calc(env(safe-area-inset-left, 0px) + 92px)` : 'auto',
              right: dockSide === 'right' ? `calc(env(safe-area-inset-right, 0px) + 92px)` : 'auto',
              top: topOffset,
              transform: 'translateY(-50%)',
              maxWidth: 'calc(100vw - 150px)',
            }}
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
