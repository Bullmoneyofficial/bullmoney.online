'use client';

import { memo, useEffect, useState } from 'react';
import { useDesktopPerformance } from '@/hooks/useDesktopPerformance';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlobalLiteModeToggle
 * 
 * A fixed-position toggle that appears on desktop devices,
 * allowing users to enable/disable "lite mode" which reduces
 * heavy visual effects (blur, shadows, glow) while keeping
 * animations working.
 * 
 * Visible from first load, persists preference in localStorage.
 */
const GlobalLiteModeToggle = memo(function GlobalLiteModeToggle() {
  const { liteMode, toggleLiteMode, isDesktop, gpuTier, isHydrated } = useDesktopPerformance();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Don't render during SSR
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    // Show on all devices (mobile and desktop)
    setShouldRender(true);
  }, []);
  
  if (!shouldRender || !isHydrated) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-[2147483645] flex flex-col items-end gap-2">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-black/90 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 shadow-lg"
            style={{
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
              minWidth: '220px'
            }}
          >
            <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-3">
              Performance Settings
            </div>
            
            {/* Lite Mode Toggle */}
            <button
              onClick={toggleLiteMode}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{liteMode ? '🌙' : '✨'}</span>
                <div className="text-left">
                  <div className="text-sm text-white font-medium">
                    Lite Mode
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {liteMode ? 'Effects disabled' : 'Full effects enabled'}
                  </div>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div 
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  liteMode ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                  animate={{ x: liteMode ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
            
            {/* GPU Info */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-[10px] text-gray-500">
                GPU: {gpuTier === 'discrete' ? '🎮 Discrete' : gpuTier === 'integrated' ? '💻 Integrated' : '❓ Unknown'}
              </div>
            </div>
            
            <div className="mt-2 text-[9px] text-gray-600 leading-relaxed">
              Lite mode disables blur, shadows, and glow effects while keeping animations smooth.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-300 group
          ${liteMode 
            ? 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30' 
            : 'bg-black/80 border-white/20 hover:bg-black/90 hover:border-white/30'
          }
          border backdrop-blur-sm
        `}
        style={{
          boxShadow: liteMode 
            ? '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(59, 130, 246, 0.2)'
            : '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Performance settings"
      >
        <span className="text-xl transition-transform group-hover:scale-110">
          {liteMode ? '🌙' : '⚡'}
        </span>
        
        {/* Active indicator */}
        {liteMode && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)'
            }}
          />
        )}
      </motion.button>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-14 bottom-2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10"
          >
            {liteMode ? 'Lite Mode ON' : 'Performance Settings'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default GlobalLiteModeToggle;
