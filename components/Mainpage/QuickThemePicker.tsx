"use client";

import { X } from 'lucide-react';
import { ALL_THEMES } from '@/components/Mainpage/ThemeComponents';
import { playClick, playHover, playSwipe } from '@/lib/interactionUtils';

interface QuickThemePickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: string;
  onThemeChange: (themeId: string) => void;
}

export function QuickThemePicker({ isOpen, onClose, activeThemeId, onThemeChange }: QuickThemePickerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      style={{
        zIndex: 9999,
        maxWidth: '100vw',
        maxHeight: '100dvh'
      }}
      onClick={() => {
        playClick();
        onClose();
      }}
      onDoubleClick={onClose}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) {
          (e.currentTarget as any)._swipeStartY = touch.clientY;
        }
      }}
      onTouchEnd={(e) => {
        const startY = (e.currentTarget as any)._swipeStartY;
        const touch = e.changedTouches[0];
        if (startY && touch) {
          const endY = touch.clientY;
          if (Math.abs(endY - startY) > 120) {
            playSwipe();
            onClose();
          }
        }
      }}
    >
      <div className="max-w-4xl w-full max-h-[min(80vh,calc(100dvh-2rem))] overflow-y-auto bg-black/80 rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Quick Theme Switch</h2>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            onDoubleClick={onClose}
            onMouseEnter={() => playHover()}
            className="text-white/50 hover:text-white p-2"
            aria-label="Close quick theme picker"
          >
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {ALL_THEMES.filter(t => t.status === 'AVAILABLE').slice(0, 16).map(theme => (
            <button
              key={theme.id}
              onClick={() => {
                onThemeChange(theme.id);
                onClose();
              }}
              className={`p-3 sm:p-4 rounded-xl border transition-all hover:scale-105 active:scale-95 min-h-[60px] ${
                theme.id === activeThemeId
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              style={{
                filter: theme.filter,
                WebkitFilter: theme.filter,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="text-xs sm:text-sm font-bold text-white mb-1 break-words">{theme.name}</div>
              <div className="text-[9px] sm:text-[10px] text-white/60 break-words">{theme.category}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
