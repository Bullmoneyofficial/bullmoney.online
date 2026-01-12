import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconPalette, IconX } from '@tabler/icons-react';
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ThemeCategory, SoundProfile } from '@/constants/theme-data';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal = ({ isOpen, onClose }: ThemeSelectorModalProps) => {
  const { activeThemeId: globalThemeId, setTheme } = useGlobalTheme();
  
  const [activeThemeId, setActiveThemeId] = useState(globalThemeId || 'BITCOIN');
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('CRYPTO');
  const [currentSound, setCurrentSound] = useState<SoundProfile>('SILENT');
  const [isMuted, setIsMuted] = useState(true);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  useEffect(() => {
    if (globalThemeId) {
      setActiveThemeId(globalThemeId);
    }
  }, [globalThemeId, isOpen]);

  const handleSave = (themeId: string) => {
    setTheme(themeId);
    localStorage.setItem('bullmoney-theme', themeId);
    localStorage.setItem('user_theme_id', themeId);
    
    window.dispatchEvent(new CustomEvent('bullmoney-theme-change', { 
      detail: { themeId } 
    }));
    
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
        
        {/* Modal container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-black/90 border-b border-blue-500/30">
            <div className="flex items-center gap-3">
              <IconPalette className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-blue-400">
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
