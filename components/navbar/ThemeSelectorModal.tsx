import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { IconPalette, IconX } from '@tabler/icons-react';
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ThemeCategory, SoundProfile, ALL_THEMES } from '@/constants/theme-data';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { LiveThemePreviewOverlay } from '@/components/LiveThemePreviewOverlay';
import '@/styles/themes/supreme-z-index.css';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal = ({ isOpen, onClose }: ThemeSelectorModalProps) => {
  const { activeThemeId: globalThemeId, setTheme } = useGlobalTheme();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  
  // Default to BullMoney Blue if no theme is set
  const [activeThemeId, setActiveThemeId] = useState(globalThemeId || 'bullmoney-blue');
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('SPECIAL');
  const [currentSound, setCurrentSound] = useState<SoundProfile>('SILENT');
  const [isMuted, setIsMuted] = useState(true);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (globalThemeId) {
      setActiveThemeId(globalThemeId);
    }
  }, [globalThemeId, isOpen]);

  const handleSave = (themeId: string) => {
    // Find the full theme object
    const selectedTheme = ALL_THEMES.find(t => t.id === themeId);
    
    // Update global context
    setTheme(themeId);
    
    // Save to multiple storage locations for persistence
    localStorage.setItem('bullmoney-theme', themeId);
    localStorage.setItem('user_theme_id', themeId);
    
    // Save full theme data for early application on next page load
    if (selectedTheme) {
      const themeData = {
        id: selectedTheme.id,
        name: selectedTheme.name,
        accentColor: selectedTheme.accentColor,
        filter: selectedTheme.filter,
        mobileFilter: selectedTheme.mobileFilter,
        category: selectedTheme.category,
        savedAt: Date.now()
      };
      localStorage.setItem('bullmoney-theme-data', JSON.stringify(themeData));
      
      // Also dispatch event with full theme data
      window.dispatchEvent(new CustomEvent('bullmoney-theme-change', { 
        detail: { themeId, theme: selectedTheme, accentColor: selectedTheme.accentColor } 
      }));
    } else {
      window.dispatchEvent(new CustomEvent('bullmoney-theme-change', { 
        detail: { themeId } 
      }));
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Live Theme Preview Overlay - Shows theme colors over entire app */}
      <LiveThemePreviewOverlay
        previewThemeId={previewThemeId}
        enableMusic={!isMuted}
        musicVolume={35}
        isMobile={isMobile}
        isMuted={isMuted}
      />

      <AnimatePresence>
        <motion.div
          initial={animations.modalBackdrop.initial}
          animate={animations.modalBackdrop.animate as TargetAndTransition}
          exit={animations.modalBackdrop.exit}
          transition={animations.modalBackdrop.transition}
          className={`theme-selector-modal-supreme flex items-center justify-center p-3 sm:p-6 bg-black/95 ${
            shouldDisableBackdropBlur ? '' : 'backdrop-blur-sm theme-modal-backdrop'
          }`}
          onClick={onClose}
        >
        {/* Animated tap to close hints - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
          >
            <span>↑</span> Tap anywhere to close <span>↑</span>
          </motion.div>
        )}
        {!shouldSkipHeavyEffects && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
          >
            <span>↓</span> Tap anywhere to close <span>↓</span>
          </motion.div>
        )}
        {!shouldSkipHeavyEffects && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            ← Tap to close
          </motion.div>
        )}
        {!shouldSkipHeavyEffects && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Tap to close →
          </motion.div>
        )}
        
        {/* Modal container - Theme-aware styling */}
        <motion.div
          initial={animations.modalContent.initial}
          animate={animations.modalContent.animate as TargetAndTransition}
          exit={animations.modalContent.exit}
          transition={animations.modalContent.transition}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden"
          style={shouldSkipHeavyEffects ? {
            border: '2px solid rgba(var(--accent-rgb, 255, 255, 255), 0.6)',
            boxShadow: '0 0 20px rgba(var(--accent-rgb, 255, 255, 255), 0.4)',
          } : {
            border: '2px solid rgba(var(--accent-rgb, 255, 255, 255), 0.6)',
            boxShadow: '0 0 40px rgba(var(--accent-rgb, 255, 255, 255), 0.5), 0 0 80px rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
          }}
        >
          {/* Header - Theme-aware */}
          <div 
            className="flex items-center justify-between px-6 py-4 bg-black/90"
            style={{
              borderBottom: '2px solid rgba(var(--accent-rgb, 255, 255, 255), 0.5)',
              boxShadow: '0 4px 20px rgba(var(--accent-rgb, 255, 255, 255), 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <IconPalette 
                className="w-5 h-5" 
                style={{ color: 'var(--accent-color, #ffffff)', filter: 'drop-shadow(0 0 6px var(--accent-color, #ffffff))' }}
              />
              <span 
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)', textShadow: '0 0 10px rgba(var(--accent-rgb, 255, 255, 255), 0.6)' }}
              >
                Theme Selector
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border transition-all group relative"
              style={{
                background: 'rgba(var(--accent-rgb, 255, 255, 255), 0.1)',
                borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.4)',
                boxShadow: '0 0 10px rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
              }}
              title="Close (ESC)"
              data-modal-close="true"
            >
              <IconX className="w-5 h-5" style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)' }} />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ESC</span>
            </button>
          </div>
          
          {/* Theme Selector Content */}
          <div className="h-[70vh] overflow-auto">
            <ThemeSelector
              activeThemeId={activeThemeId}
              setActiveThemeId={setActiveThemeId}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              isMobile={false}
              currentSound={currentSound}
              setCurrentSound={setCurrentSound}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              onSave={handleSave}
              onExit={onClose}
              onHover={setPreviewThemeId}
            />
          </div>
        </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
