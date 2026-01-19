import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconPalette, IconX } from '@tabler/icons-react';
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ThemeCategory, SoundProfile, ALL_THEMES } from '@/constants/theme-data';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal = ({ isOpen, onClose }: ThemeSelectorModalProps) => {
  const { activeThemeId: globalThemeId, setTheme } = useGlobalTheme();
  
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 bg-black/95"
        onClick={onClose}
      >
        {/* Animated tap to close hints */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
        >
          <span>↑</span> Tap anywhere to close <span>↑</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
        >
          <span>↓</span> Tap anywhere to close <span>↓</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          ← Tap to close
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Tap to close →
        </motion.div>
        
        {/* Modal container - Theme-aware styling */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
            boxShadow: '0 0 60px rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
          }}
        >
          {/* Header - Theme-aware */}
          <div 
            className="flex items-center justify-between px-6 py-4 bg-black/90"
            style={{
              borderBottom: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <IconPalette 
                className="w-5 h-5" 
                style={{ color: 'var(--accent-color, #3b82f6)' }}
              />
              <span 
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: 'var(--accent-color, #3b82f6)' }}
              >
                Theme Selector
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group relative"
              title="Close (ESC)"
            >
              <IconX className="w-5 h-5 text-gray-400" />
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
  );
};
