"use client";

import { useEffect, useState } from 'react';
import { Zap, Sparkles, Smartphone, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DeviceProfile } from '@/lib/deviceProfile';

interface PerformancePromptProps {
  isVisible: boolean;
  accentColor: string;
  deviceProfile: DeviceProfile;
  defaultPerfMode: 'high' | 'balanced';
  onChoose: (mode: 'high' | 'balanced') => void;
}

// BULLMONEY shimmer gradient
const getShimmerGradient = (color: string) =>
  `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${color} 50%, #00000000 100%)`;

export function PerformancePrompt({
  isVisible,
  accentColor,
  deviceProfile,
  defaultPerfMode,
  onChoose,
}: PerformancePromptProps) {
  const [countdown, setCountdown] = useState(8);
  const primaryBlue = '#3b82f6';

  useEffect(() => {
    if (!isVisible) {
      setCountdown(8);
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onChoose(defaultPerfMode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, defaultPerfMode, onChoose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4 animate-in fade-in duration-300"
      style={{ zIndex: 10005, backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={() => onChoose(defaultPerfMode)}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500"
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px ${primaryBlue}20, 0 0 40px ${primaryBlue}10`
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                <motion.div
                  className="absolute inset-[-100%]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ background: getShimmerGradient(primaryBlue) }}
                />
                <div className="absolute inset-[1.5px] rounded-xl bg-black/80 flex items-center justify-center">
                  <Zap size={24} style={{ color: primaryBlue }} className="drop-shadow-[0_0_8px_currentColor]" />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: primaryBlue }}>BULLMONEY OPTIMIZATION</div>
                <div className="text-xs text-white/50 mt-0.5">Choose your experience</div>
              </div>
            </div>
            <span className="text-[10px] text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-bold">
              Auto: {countdown}s
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Optimize Your Trading Terminal
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Select your preferred mode. You can always change this later via the performance toggle.
          </p>

          {/* Options Grid - BULLMONEY Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Full 3D Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChoose('high')}
              className="relative p-5 sm:p-6 rounded-xl overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${primaryBlue}15, ${primaryBlue}05)`,
              }}
            >
              <motion.div
                className="absolute inset-[-100%]"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ background: getShimmerGradient(primaryBlue) }}
              />

              <div className="absolute inset-[1.5px] rounded-xl bg-black/80 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <Sparkles size={32} style={{ color: primaryBlue }} className="drop-shadow-[0_0_12px_currentColor]" />
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: `${primaryBlue}30`, color: primaryBlue }}>Premium</span>
                </div>
                <h4 className="text-lg font-black mb-2" style={{ color: primaryBlue }}>✨ Full 3D Mode</h4>
                <p className="text-xs text-white/60 leading-relaxed mb-4">
                  Premium 3D trading terminal with immersive visualizations. The ultimate BULLMONEY experience.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="font-black" style={{ color: primaryBlue }}>10</span>
                    <span className="text-white/50">Pages</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="font-black" style={{ color: primaryBlue }}>3D</span>
                    <span className="text-white/50">Visuals</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="font-black" style={{ color: primaryBlue }}>MAX</span>
                    <span className="text-white/50">Quality</span>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Performance Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChoose('balanced')}
              className="relative p-5 sm:p-6 rounded-xl overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
              }}
            >
              <motion.div
                className="absolute inset-[-100%]"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ background: getShimmerGradient('#f97316') }}
              />

              <div className="absolute inset-[1.5px] rounded-xl bg-black/80 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap size={32} className="text-orange-500 drop-shadow-[0_0_12px_currentColor]" />
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/30 text-orange-500 px-2 py-1 rounded-full">Fastest</span>
                </div>
                <h4 className="text-lg font-black text-orange-500 mb-2">⚡ Performance Mode</h4>
                <p className="text-xs text-white/60 leading-relaxed mb-4">
                  Lightning-fast execution. Instant load times. Optimized for speed traders.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-orange-500 font-black">3x</span>
                    <span className="text-white/50">Faster</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-orange-500 font-black">50%</span>
                    <span className="text-white/50">Data</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-orange-500 font-black">&lt;1s</span>
                    <span className="text-white/50">Load</span>
                  </div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Auto-detect Info - BULLMONEY Style */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                {deviceProfile.isMobile ? <Smartphone size={18} style={{ color: primaryBlue }} /> : <Monitor size={18} style={{ color: primaryBlue }} />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {deviceProfile.isMobile ? 'Mobile' : 'Desktop'} • {deviceProfile.isHighEndDevice ? 'High-End' : 'Standard'}
                </div>
                <div className="text-[10px] text-white/50">
                  Recommended: <span style={{ color: defaultPerfMode === 'high' ? primaryBlue : '#f97316' }} className="font-bold">
                    {defaultPerfMode === 'high' ? 'Full 3D' : 'Performance'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onChoose(defaultPerfMode)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-all"
            >
              Use Recommended
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-white/50 mt-4">
            💡 Toggle anytime via the performance button
          </p>
        </div>

        {/* Bottom Accent Line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${primaryBlue}50, transparent)`,
          }}
        />

        <style jsx>{`
          @keyframes premium-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }

          @keyframes glow-pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
