import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '@/constants/theme-data'

interface ThemeEffectsProps {
  theme: Theme;
  children: React.ReactNode;
}

export const ThemeEffects = ({ theme, children }: ThemeEffectsProps) => {
  const [isMobile, setIsMobile] = useState(false);
  
  // 1. Handle Audio on Theme Change
  useEffect(() => {
    if (theme.audioUrl) {
      const audio = new Audio(theme.audioUrl);
      audio.volume = 0.4; // Keep it subtle
      audio.play().catch(e => console.log("Audio play failed (user interaction required first)"));
    }
  }, [theme.id]); // Only play when ID changes

  // 2. Detect Mobile for optimized filters
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden transition-all duration-700 ease-in-out bg-black text-white"
      style={{
        // 3. Apply the Master Filter (The heavy lifting)
        filter: isMobile ? theme.mobileFilter : theme.filter,
      }}
    >
      {/* --- LAYER A: RENDERED BACKGROUND IMAGE --- */}
      {theme.bgImage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${theme.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            // critical for the "professional" look:
            backgroundBlendMode: theme.bgBlendMode || 'normal', 
            opacity: theme.bgOpacity || 0.2, 
          }}
        />
      )}

      {/* --- LAYER B: ILLUSIONS (Scanlines, Noise, Vignette) --- */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {theme.illusion === 'SCANLINES' && <div className="absolute inset-0 bg-scanlines opacity-20" />}
        {theme.illusion === 'VIGNETTE' && <div className="absolute inset-0 bg-radial-gradient from-transparent to-black opacity-60" />}
        {theme.illusion === 'NOISE' && <div className="absolute inset-0 bg-noise opacity-10 animate-grain" />}
        {theme.illusion === 'GLITCH' && <div className="absolute inset-0 animate-glitch-overlay opacity-20 mix-blend-color-dodge" />}
      </div>

      {/* --- LAYER C: PARTICLE OVERLAYS (Seasonal) --- */}
      {theme.overlay !== 'NONE' && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
           <ParticleOverlay type={theme.overlay} />
        </div>
      )}

      {/* --- LAYER D: CONTENT --- */}
      <div className="relative z-30">
        {children}
      </div>
    </div>
  );
};

// --- HELPER: Particle System ---
// Simple CSS-based particles to avoid heavy libraries
const ParticleOverlay = ({ type }: { type: Theme['overlay'] }) => {
  if (!type) return null;

  // Map types to emojis or simple shapes
  const particleMap: Record<string, string> = {
    SNOW: '❄️', HEARTS: '❤️', CONFETTI: '🎉', EGGS: '🥚', 
    LEAVES: '🍂', PUMPKINS: '🎃', RAIN: '💧', FIREWORKS: '💥',
    BUBBLES: '.。', ASH: '░'
  };

  // Create 20 particles
  const particles = Array.from({ length: 20 });

  return (
    <>
      {particles.map((_, i) => (
        <div
          key={i}
          className="absolute animate-fall text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDuration: `${Math.random() * 5 + 5}s`, // Random speed between 5-10s
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.6
          }}
        >
          {particleMap[type] || '✨'}
        </div>
      ))}
    </>
  );
};