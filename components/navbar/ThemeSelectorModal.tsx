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
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80" />
        
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
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <IconX className="w-5 h-5 text-gray-400" />
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
