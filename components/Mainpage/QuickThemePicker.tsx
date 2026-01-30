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
        zIndex: 260000,
        maxWidth: '100vw',
        maxHeight: '100dvh',
        touchAction: 'manipulation'
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
      <div className="max-w-4xl w-full max-h-[min(80vh,calc(100dvh-2rem))] overflow-y-auto bg-black/80 rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Quick Theme Switch</h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              if (navigator.vibrate) navigator.vibrate(10);
              onClose();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              playHover();
              e.currentTarget.style.transform = 'scale(0.9)';
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.currentTarget.style.transform = '';
            }}
            onMouseEnter={() => playHover()}
            className="text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 active:bg-white/20 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            aria-label="Close quick theme picker"
          >
            <X size={26} strokeWidth={2.5} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {ALL_THEMES.filter(t => t.status === 'AVAILABLE').slice(0, 16).map(theme => (
            <button
              key={theme.id}
              onClick={(e) => {
                e.stopPropagation();
                playClick();
                if (navigator.vibrate) navigator.vibrate(12);
                onThemeChange(theme.id);
                onClose();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.currentTarget.style.transform = '';
              }}
              className={`p-3 sm:p-4 rounded-xl border transition-all hover:scale-105 active:scale-95 min-h-[68px] touch-manipulation ${
                theme.id === activeThemeId
                  ? 'bg-white/20 border-white'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              style={{
                filter: theme.filter,
                WebkitFilter: theme.filter,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
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
