"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ThreeDHintIconProps {
  onClick: () => void;
  accentColor?: string;
  disableSpline?: boolean;
  showHint?: boolean;
}

export const ThreeDHintIcon: React.FC<ThreeDHintIconProps> = ({
  onClick,
  accentColor = '#3b82f6',
  disableSpline = false,
  showHint = true
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showInitialHint, setShowInitialHint] = useState(showHint);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowInitialHint(false), 15000);
      return () => clearTimeout(timer);
    }
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
  }, [disableSpline]);

  const handleClick = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    onClick();
    setShowInitialHint(false);
  };

  return (
    <div
      className="fixed right-4 z-[999] pointer-events-auto"
      style={{
        right: 'max(1rem, calc(1rem + env(safe-area-inset-right, 0px)))',
        top: 'calc(50vh - 220px + env(safe-area-inset-top, 0px))', // Positioned above the scrollbar
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
          scale: pulse ? [1, 1.1, 1] : 1,
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
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 0deg, ${accentColor}, #ffffff, ${accentColor})`,
          }}
        />

        {/* Inner Circle */}
        <div className="absolute inset-[2px] rounded-full bg-black/90 backdrop-blur-xl flex items-center justify-center">
          <Sparkles
            size={20}
            className="sm:w-6 sm:h-6"
            style={{ color: accentColor }}
          />

          {/* Pulsing Ring when 3D is off */}
          {disableSpline && (
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: accentColor }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </div>

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 ${isHovering ? '40px' : '20px'} ${accentColor}${isHovering ? '80' : '60'}`,
          }}
          animate={{
            boxShadow: pulse
              ? [
                  `0 0 20px ${accentColor}60`,
                  `0 0 35px ${accentColor}80`,
                  `0 0 20px ${accentColor}60`,
                ]
              : `0 0 ${isHovering ? '40px' : '20px'} ${accentColor}${isHovering ? '80' : '60'}`,
          }}
          transition={{
            duration: 2,
            repeat: pulse ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </motion.button>

      {/* Tooltip / Hint */}
      <AnimatePresence>
        {(isHovering || showInitialHint) && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap"
          >
            <div className="relative">
              {/* Arrow */}
              <div
                className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8"
                style={{ borderLeftColor: accentColor }}
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
                    {disableSpline ? 'Enable' : 'Control'} 3D
                  </div>
                  <div className="text-[10px] text-white/80">
                    {disableSpline ? 'Turn on 3D scenes' : 'Adjust 3D settings'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Hint Text */}
      {showInitialHint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-2 right-0 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-xl shadow-lg lg:hidden"
          style={{
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
        >
          <div className="text-[10px] font-bold text-white flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            Tap for 3D Controls
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ThreeDHintIcon;
