import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOBILE_HELPER_TIPS } from './navbar.utils';

export const MobileStaticHelper = () => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % MOBILE_HELPER_TIPS.length);
        setIsVisible(true);
      }, 250);
    }, 4500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div
      className="fixed right-3 left-3 z-[100] pointer-events-none lg:hidden"
      style={{ top: 'calc(6.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -8, scale: isVisible ? 1 : 0.95 }}
        transition={{ 
          duration: 0.35,
          ease: [0.34, 1.56, 0.64, 1]
        }}
        className="mx-auto w-fit max-w-[90%] px-3 py-2 rounded-xl bg-black/80 backdrop-blur-2xl border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3),inset_0_0_15px_rgba(59,130,246,0.1)]"
      >
        <motion.div 
          className="flex items-center gap-2.5 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {/* Pulse indicator */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="relative flex h-1.5 w-1.5 shrink-0"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
          </motion.div>
          
          {/* Rotating tip text */}
          <AnimatePresence mode="wait">
            <motion.span 
              key={tipIndex}
              initial={{ opacity: 0, y: 4, x: -8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -4, x: 8 }}
              transition={{ 
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="text-[10px] tracking-wide font-medium text-blue-200/90 text-center"
            >
              {MOBILE_HELPER_TIPS[tipIndex]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};
