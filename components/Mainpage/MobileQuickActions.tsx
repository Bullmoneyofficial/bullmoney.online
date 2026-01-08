"use client";

import { MessageCircle, Palette, Volume1, Volume2, VolumeX, Zap } from 'lucide-react';
import { playClick } from '@/lib/interactionUtils';
import { UI_LAYERS } from '@/lib/uiLayers';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileQuickActionsProps {
  isVisible: boolean;
  disableSpline?: boolean;
  isPlaying?: boolean;
  volume?: number;
  safeAreaInlinePadding?: { paddingLeft: string; paddingRight: string };
  safeAreaBottom?: string;
  onPerformanceToggle?: () => void;
  onMusicToggle?: () => void;
  onThemeClick?: () => void;
  onHelpClick?: () => void;
}

export function MobileQuickActions({
  isVisible,
  disableSpline = false,
  isPlaying = false,
  volume = 0,
  safeAreaInlinePadding,
  safeAreaBottom,
  onPerformanceToggle,
  onMusicToggle,
  onThemeClick,
  onHelpClick,
}: MobileQuickActionsProps) {
  const inlinePadding = safeAreaInlinePadding ?? { paddingLeft: '0px', paddingRight: '0px' };
  const bottomPadding = safeAreaBottom ?? '0px';
  const showPerformance = typeof onPerformanceToggle === 'function';
  const showMusic = typeof onMusicToggle === 'function';
  const showTheme = typeof onThemeClick === 'function';
  const showHelp = typeof onHelpClick === 'function';

  const handleAction = (action?: () => void, vibration = 8) => {
    if (!action) return;
    playClick();
    if (navigator.vibrate) navigator.vibrate(vibration);
    action();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="fixed inset-x-0 bottom-0 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]"
          style={{
            zIndex: UI_LAYERS.NAVBAR + 2,
            maxWidth: '100vw',
            boxSizing: 'border-box',
            ...inlinePadding,
            paddingBottom: bottomPadding,
          }}
        >
          <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_12px_60px_rgba(0,0,0,0.55)] px-3 py-2 flex items-center gap-2">
            {showPerformance && (
              <button
                onClick={() => handleAction(onPerformanceToggle, 10)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide active:scale-95 transition-all ${
                  disableSpline
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-100'
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/10 border border-blue-500/30 text-blue-100'
                }`}
                aria-label="Toggle performance mode"
              >
                <Zap size={18} className="drop-shadow-[0_0_8px_currentColor]" />
                <span>{disableSpline ? 'Speed' : '3D'}</span>
              </button>
            )}

            {showMusic && (
              <button
                onClick={() => handleAction(onMusicToggle, 8)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide active:scale-95 transition-all bg-white/5 border border-white/10 text-white/80"
                aria-label="Toggle audio"
              >
                {isPlaying ? (volume > 50 ? <Volume2 size={18} /> : <Volume1 size={18} />) : <VolumeX size={18} />}
                <span>{isPlaying ? 'Audio On' : 'Muted'}</span>
              </button>
            )}

            {showTheme && (
              <button
                onClick={() => handleAction(onThemeClick, 8)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide active:scale-95 transition-all bg-white/5 border border-white/10 text-white/80"
                aria-label="Open theme switcher"
              >
                <Palette size={18} />
                <span>Theme</span>
              </button>
            )}

            {showHelp && (
              <button
                onClick={() => handleAction(onHelpClick, 10)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide active:scale-95 transition-all bg-white/5 border border-white/10 text-white/80"
                aria-label="Open help"
              >
                <MessageCircle size={18} />
                <span>Help</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
