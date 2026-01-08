"use client";

import { useState, useCallback } from 'react';
import { Volume2, VolumeX, Palette, MessageCircle, Zap, Sparkles, Minus, Plus } from 'lucide-react';
import { playClick, playSuccess } from '@/lib/interactionUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileQuickActionsProps {
  isVisible: boolean;
  disableSpline: boolean;
  isPlaying: boolean;
  volume: number;
  safeAreaInlinePadding: React.CSSProperties;
  safeAreaBottom: string;
  onPerformanceToggle: () => void;
  onMusicToggle: () => void;
  onThemeClick: () => void;
  onHelpClick: () => void;
}

// Helper to generate BULLMONEY-style shimmer gradient
const getShimmerGradient = (color: string) =>
  `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${color} 50%, #00000000 100%)`;

export function MobileQuickActions({
  isVisible,
  disableSpline,
  isPlaying,
  volume,
  safeAreaInlinePadding,
  safeAreaBottom,
  onPerformanceToggle,
  onMusicToggle,
  onThemeClick,
  onHelpClick,
}: MobileQuickActionsProps) {
  // IMPORTANT: All hooks must be called before any conditional returns
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);

  // BULLMONEY blue color scheme
  const primaryBlue = '#3b82f6';
  const perfColor = disableSpline ? '#f97316' : primaryBlue;
  const audioColor = isPlaying ? primaryBlue : '#64748b';

  const handleVolumeClick = useCallback(() => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(12);
    // If not playing and user clicks volume, start playing
    if (!isPlaying) {
      onMusicToggle();
    }
    setShowVolumeControl(!showVolumeControl);
  }, [showVolumeControl, isPlaying, onMusicToggle]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]"
          style={{
            zIndex: 9998,
            maxWidth: '100vw',
            boxSizing: 'border-box',
            ...safeAreaInlinePadding,
            paddingBottom: safeAreaBottom,
          }}
        >
          <div className="max-w-4xl mx-auto relative">
            {/* Premium Glow - BULLMONEY Style */}
            <div
              className="absolute inset-0 rounded-2xl blur-2xl opacity-20"
              style={{
                background: `linear-gradient(135deg, ${primaryBlue}60, ${perfColor}40, ${primaryBlue}60)`,
                animation: 'pulse 3s ease-in-out infinite'
              }}
            />

            {/* Main Control Panel - Glass Morphism */}
            <div className="relative rounded-2xl border border-white/20 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                 style={{
                   boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${primaryBlue}20, 0 0 20px ${primaryBlue}10`
                 }}>

              {/* Top Accent Line - BULLMONEY signature */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${primaryBlue}, transparent)`,
                  boxShadow: `0 0 8px ${primaryBlue}`,
                  animation: 'glow-pulse 2s ease-in-out infinite'
                }}
              />

              {/* Premium shimmer overlay */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${primaryBlue}30 50%, transparent 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'premium-shimmer 3s ease-in-out infinite',
                }}
              />

              <div className="relative z-10 p-3">
                {/* Volume Control Panel - Expandable */}
                <AnimatePresence>
                  {showVolumeControl && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 overflow-hidden">
                        {/* Volume shimmer background */}
                        <motion.div
                          className="absolute inset-[-100%]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          style={{ background: getShimmerGradient(primaryBlue) }}
                        />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Volume</span>
                            <span className="text-sm font-black" style={{ color: primaryBlue }}>{Math.round(localVolume)}%</span>
                          </div>

                          {/* Volume Slider */}
                          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="absolute left-0 top-0 h-full rounded-full"
                              style={{
                                width: `${localVolume}%`,
                                background: `linear-gradient(90deg, ${primaryBlue}, ${primaryBlue}cc)`,
                                boxShadow: `0 0 10px ${primaryBlue}80`
                              }}
                              animate={{ opacity: [0.8, 1, 0.8] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={localVolume}
                              onChange={(e) => setLocalVolume(Number(e.target.value))}
                              className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                          </div>

                          {/* Volume Quick Actions */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                playClick();
                                setLocalVolume(Math.max(0, localVolume - 10));
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-bold hover:bg-white/10 transition-all"
                            >
                              <Minus size={12} />
                              <span>10%</span>
                            </button>
                            <button
                              onClick={() => {
                                playClick();
                                setLocalVolume(Math.min(100, localVolume + 10));
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-bold hover:bg-white/10 transition-all"
                            >
                              <Plus size={12} />
                              <span>10%</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Control Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {/* 3D/Performance Toggle - Premium Style */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      playClick();
                      playSuccess();
                      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
                      onPerformanceToggle();
                    }}
                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all overflow-hidden min-h-[70px] group"
                    style={{
                      background: `linear-gradient(135deg, ${perfColor}20, ${perfColor}08)`,
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    aria-label="Toggle 3D mode"
                  >
                    {/* Rotating shimmer effect - BULLMONEY style */}
                    <motion.div
                      className="absolute inset-[-100%]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: disableSpline ? 2 : 3, repeat: Infinity, ease: "linear" }}
                      style={{ background: getShimmerGradient(perfColor) }}
                    />

                    <div className="absolute inset-[1.5px] rounded-xl bg-black/80 flex flex-col items-center justify-center gap-1.5 z-10">
                      <div className="relative">
                        {disableSpline ? (
                          <Zap size={24} className="drop-shadow-[0_0_12px_currentColor]" strokeWidth={2.5} style={{ color: perfColor }} />
                        ) : (
                          <Sparkles size={24} className="drop-shadow-[0_0_12px_currentColor]" strokeWidth={2.5} style={{ color: perfColor }} />
                        )}
                        {/* Pulsing ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2"
                          style={{ borderColor: perfColor }}
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <span className="leading-none" style={{ color: perfColor }}>{disableSpline ? 'PERF' : '3D'}</span>
                    </div>

                    {/* Badge */}
                    <span
                      className="absolute top-1.5 right-1.5 text-[10px] px-2 py-0.5 rounded-full font-black text-white z-20 animate-pulse"
                      style={{
                        backgroundColor: perfColor,
                        boxShadow: `0 0 12px ${perfColor}`
                      }}
                    >
                      {disableSpline ? '⚡' : '✨'}
                    </span>
                  </motion.button>

                  {/* Audio Toggle - BULLMONEY Style */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleVolumeClick}
                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all overflow-hidden min-h-[70px]"
                    style={{
                      background: `linear-gradient(135deg, ${audioColor}15, ${audioColor}05)`,
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    aria-label="Volume control"
                  >
                    <motion.div
                      className="absolute inset-[-100%]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ background: getShimmerGradient(audioColor) }}
                    />

                    <div className="absolute inset-[1.5px] rounded-xl bg-black/80 flex flex-col items-center justify-center gap-1.5 z-10">
                      <div className="relative">
                        {isPlaying ? (
                          <Volume2 size={24} strokeWidth={2.5} style={{ color: audioColor }} />
                        ) : (
                          <VolumeX size={24} strokeWidth={2.5} style={{ color: audioColor }} />
                        )}

                        {/* Animated sound waves */}
                        {isPlaying && (
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-0.5 rounded-full"
                                style={{ backgroundColor: audioColor }}
                                animate={{ height: ['6px', '12px', '6px'] }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="leading-none" style={{ color: audioColor }}>{Math.round(localVolume)}%</span>
                    </div>
                  </motion.button>

                  {/* Theme Button - BULLMONEY Style */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      playClick();
                      if (navigator.vibrate) navigator.vibrate(12);
                      onThemeClick();
                    }}
                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all overflow-hidden min-h-[70px]"
                    style={{
                      background: `linear-gradient(135deg, ${primaryBlue}15, ${primaryBlue}05)`,
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    aria-label="Theme switcher"
                  >
                    <motion.div
                      className="absolute inset-[-100%]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ background: getShimmerGradient(primaryBlue) }}
                    />

                    <div className="absolute inset-[1.5px] rounded-xl bg-black/80 flex flex-col items-center justify-center gap-1.5 z-10">
                      <Palette size={24} strokeWidth={2.5} style={{ color: primaryBlue }} />
                      <span className="leading-none" style={{ color: primaryBlue }}>THEME</span>
                    </div>
                  </motion.button>

                  {/* Help Button - BULLMONEY Style */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      playClick();
                      if (navigator.vibrate) navigator.vibrate(12);
                      onHelpClick();
                    }}
                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition-all overflow-hidden min-h-[70px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    aria-label="Help"
                  >
                    <motion.div
                      className="absolute inset-[-100%]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ background: getShimmerGradient('rgba(255,255,255,0.3)') }}
                    />

                    <div className="absolute inset-[1.5px] rounded-xl bg-black/80 flex flex-col items-center justify-center gap-1.5 z-10">
                      <MessageCircle size={24} strokeWidth={2.5} className="text-white/70" />
                      <span className="leading-none text-white/70">HELP</span>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Bottom Accent Line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${primaryBlue}50, transparent)`,
                }}
              />
            </div>

            {/* Grip Indicator */}
            <div className="flex justify-center mt-2">
              <div className="w-12 h-1 rounded-full bg-white/20 backdrop-blur-sm" />
            </div>
          </div>

          <style jsx>{`
            @keyframes premium-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }

            @keyframes glow-pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }

            @keyframes pulse {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.3; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
