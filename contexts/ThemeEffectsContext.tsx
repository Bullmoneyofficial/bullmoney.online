'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// SMART THEME EFFECTS SYSTEM
// Cool visual effects: LSD, Weed, Drunk, Blur, Shake, Invert + more!
// ============================================================================

type EffectType = 
  | 'none'
  | 'invert'           // Inverted colors
  | 'lsd'              // Psychedelic rainbow cycling
  | 'weed'             // Mellow green haze + slight blur
  | 'drunk'            // Screen shake + blur
  | 'blur'             // Gaussian blur effect
  | 'glitch'           // Digital glitch effect
  | 'vaporwave'        // Retro pink/cyan aesthetic
  | 'matrix'           // Matrix green rain effect
  | 'nightvision'      // Green night vision look
  | 'thermal'          // Thermal camera effect
  | 'sepia'            // Old photo sepia
  | 'cyberpunk';       // Neon cyberpunk glow

interface ThemeEffectSettings {
  enabled: boolean;
  activeEffect: EffectType;
  intensity: number; // 0-100
}

interface ThemeEffectsContextType {
  settings: ThemeEffectSettings;
  setEffect: (effect: EffectType) => void;
  setIntensity: (intensity: number) => void;
  toggleEffect: () => void;
  effects: { id: EffectType; name: string; icon: string; description: string }[];
}

const DEFAULT_SETTINGS: ThemeEffectSettings = {
  enabled: false,
  activeEffect: 'none',
  intensity: 70,
};

// All available effects
const THEME_EFFECTS: { id: EffectType; name: string; icon: string; description: string }[] = [
  { id: 'none', name: 'Normal', icon: '🔲', description: 'No effects applied' },
  { id: 'invert', name: 'Invert', icon: '🔄', description: 'Flip all colors' },
  { id: 'lsd', name: 'LSD Trip', icon: '🌈', description: 'Psychedelic rainbow cycling' },
  { id: 'weed', name: '420 Haze', icon: '🍃', description: 'Mellow green vibes' },
  { id: 'drunk', name: 'Drunk Mode', icon: '🍺', description: 'Wobbly vision' },
  { id: 'blur', name: 'Blur Out', icon: '💨', description: 'Smooth blur effect' },
  { id: 'glitch', name: 'Glitch', icon: '📺', description: 'Digital corruption' },
  { id: 'vaporwave', name: 'Vaporwave', icon: '🌴', description: 'Retro aesthetic' },
  { id: 'matrix', name: 'Matrix', icon: '💊', description: 'Take the red pill' },
  { id: 'nightvision', name: 'Night Vision', icon: '🔦', description: 'Military green view' },
  { id: 'thermal', name: 'Thermal', icon: '🌡️', description: 'Heat signature mode' },
  { id: 'sepia', name: 'Vintage', icon: '📷', description: 'Old photograph look' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon city vibes' },
];

const ThemeEffectsContext = createContext<ThemeEffectsContextType | undefined>(undefined);

const STORAGE_KEY = 'bullmoney-theme-effects';

const loadSettings = (): ThemeEffectSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('[ThemeEffects] Error loading settings:', e);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: ThemeEffectSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[ThemeEffects] Error saving settings:', e);
  }
};

export function ThemeEffectsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeEffectSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveSettings(settings);
    }
  }, [settings, mounted]);

  // Apply effects via CSS + keyframe animations
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    let styleEl = document.getElementById('theme-effects-style') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-effects-style';
      document.head.appendChild(styleEl);
    }

    if (!settings.enabled || settings.activeEffect === 'none') {
      styleEl.textContent = '';
      document.documentElement.classList.remove('theme-effect-active');
      return;
    }

    document.documentElement.classList.add('theme-effect-active');
    const intensity = settings.intensity / 100;
    let css = '';

    switch (settings.activeEffect) {
      case 'invert':
        css = `
          html.theme-effect-active {
            filter: invert(${intensity}) !important;
          }
          html.theme-effect-active img,
          html.theme-effect-active video,
          html.theme-effect-active canvas {
            filter: invert(${intensity}) !important;
          }
        `;
        break;

      case 'lsd':
        css = `
          @keyframes lsd-trip {
            0% { filter: hue-rotate(0deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%) contrast(${100 + intensity * 10}%); }
            25% { filter: hue-rotate(90deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%) contrast(${100 + intensity * 10}%); }
            50% { filter: hue-rotate(180deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%) contrast(${100 + intensity * 10}%); }
            75% { filter: hue-rotate(270deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%) contrast(${100 + intensity * 10}%); }
            100% { filter: hue-rotate(360deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%) contrast(${100 + intensity * 10}%); }
          }
          @keyframes lsd-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(${1 + intensity * 0.02}); }
          }
          html.theme-effect-active {
            animation: lsd-trip ${5 - intensity * 3}s linear infinite, lsd-pulse ${2}s ease-in-out infinite !important;
          }
        `;
        break;

      case 'weed':
        css = `
          @keyframes weed-float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(${intensity * 5}px) rotate(${intensity * 0.5}deg); }
          }
          html.theme-effect-active {
            filter: 
              sepia(${intensity * 0.3}) 
              hue-rotate(60deg) 
              saturate(${80 + intensity * 40}%) 
              blur(${intensity * 1.5}px) 
              brightness(${95 + intensity * 10}%) !important;
            animation: weed-float ${4}s ease-in-out infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, transparent 30%, rgba(0, 100, 0, ${intensity * 0.2}) 100%);
            pointer-events: none;
            z-index: 2147483647;
          }
        `;
        break;

      case 'drunk':
        css = `
          @keyframes drunk-shake {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            10% { transform: translateX(${-intensity * 8}px) rotate(${-intensity * 1}deg); }
            20% { transform: translateX(${intensity * 6}px) rotate(${intensity * 0.8}deg); }
            30% { transform: translateX(${-intensity * 5}px) rotate(${-intensity * 0.5}deg); }
            40% { transform: translateX(${intensity * 4}px) rotate(${intensity * 0.3}deg); }
            50% { transform: translateX(${-intensity * 6}px) rotate(${-intensity * 0.6}deg); }
            60% { transform: translateX(${intensity * 7}px) rotate(${intensity * 0.7}deg); }
            70% { transform: translateX(${-intensity * 4}px) rotate(${-intensity * 0.4}deg); }
            80% { transform: translateX(${intensity * 5}px) rotate(${intensity * 0.5}deg); }
            90% { transform: translateX(${-intensity * 3}px) rotate(${-intensity * 0.2}deg); }
          }
          @keyframes drunk-blur-pulse {
            0%, 100% { filter: blur(${intensity * 2}px); }
            50% { filter: blur(${intensity * 4}px); }
          }
          html.theme-effect-active {
            animation: drunk-shake ${3 - intensity}s ease-in-out infinite, drunk-blur-pulse ${2}s ease-in-out infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 200, 100, ${intensity * 0.1});
            pointer-events: none;
            z-index: 2147483647;
          }
        `;
        break;

      case 'blur':
        css = `
          @keyframes blur-breathe {
            0%, 100% { filter: blur(${intensity * 3}px); }
            50% { filter: blur(${intensity * 6}px); }
          }
          html.theme-effect-active {
            filter: blur(${intensity * 4}px) !important;
            transition: filter 0.3s ease !important;
          }
        `;
        break;

      case 'glitch':
        css = `
          @keyframes glitch-main {
            0%, 2% { transform: translate(0); filter: none; }
            3% { transform: translate(${intensity * 3}px, ${-intensity * 2}px); filter: hue-rotate(90deg); }
            4% { transform: translate(${-intensity * 2}px, ${intensity * 3}px); filter: hue-rotate(180deg); }
            5%, 15% { transform: translate(0); filter: none; }
            16% { transform: translate(${-intensity * 4}px, 0); filter: saturate(200%); }
            17% { transform: translate(0); filter: none; }
            50%, 52% { transform: translate(0); filter: none; }
            53% { transform: translate(${intensity * 5}px, ${intensity * 2}px); filter: hue-rotate(-45deg); }
            54%, 100% { transform: translate(0); filter: none; }
          }
          @keyframes glitch-offset {
            0%, 100% { clip-path: inset(0 0 0 0); }
            5% { clip-path: inset(${intensity * 10}% 0 ${100 - intensity * 10}% 0); }
            10% { clip-path: inset(${intensity * 30}% 0 ${100 - intensity * 30}% 0); }
            15% { clip-path: inset(0 0 0 0); }
          }
          html.theme-effect-active {
            animation: glitch-main ${2 - intensity}s steps(1) infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 255, ${intensity * 0.03}) 2px,
                rgba(0, 255, 255, ${intensity * 0.03}) 4px
              );
            pointer-events: none;
            z-index: 2147483647;
            animation: glitch-offset 0.5s steps(1) infinite;
          }
        `;
        break;

      case 'vaporwave':
        css = `
          @keyframes vaporwave-shift {
            0%, 100% { filter: hue-rotate(280deg) saturate(${150 + intensity * 100}%) contrast(${110 + intensity * 10}%); }
            50% { filter: hue-rotate(320deg) saturate(${150 + intensity * 100}%) contrast(${110 + intensity * 10}%); }
          }
          html.theme-effect-active {
            animation: vaporwave-shift ${8 - intensity * 4}s ease-in-out infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              135deg,
              rgba(255, 0, 128, ${intensity * 0.15}) 0%,
              transparent 50%,
              rgba(0, 255, 255, ${intensity * 0.15}) 100%
            );
            pointer-events: none;
            z-index: 2147483647;
          }
        `;
        break;

      case 'matrix':
        css = `
          html.theme-effect-active {
            filter: 
              hue-rotate(80deg) 
              saturate(${50 + intensity * 100}%) 
              brightness(${90 + intensity * 10}%) 
              contrast(${120 + intensity * 20}%) !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(0, 255, 0, ${intensity * 0.05}) 1px,
                rgba(0, 255, 0, ${intensity * 0.05}) 2px
              ),
              radial-gradient(ellipse at center, transparent 0%, rgba(0, 20, 0, ${intensity * 0.4}) 100%);
            pointer-events: none;
            z-index: 2147483647;
          }
        `;
        break;

      case 'nightvision':
        css = `
          @keyframes nv-flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: ${0.95 + intensity * 0.05}; }
            75% { opacity: ${0.92 + intensity * 0.08}; }
          }
          html.theme-effect-active {
            filter: 
              brightness(${150 + intensity * 50}%) 
              contrast(${130 + intensity * 20}%) 
              saturate(0%) 
              sepia(100%) 
              hue-rotate(70deg) !important;
            animation: nv-flicker 0.1s steps(2) infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(0, 0, 0, ${intensity * 0.5}) 100%),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, ${intensity * 0.1}) 2px,
                rgba(0, 0, 0, ${intensity * 0.1}) 4px
              );
            pointer-events: none;
            z-index: 2147483647;
          }
        `;
        break;

      case 'thermal':
        css = `
          @keyframes thermal-pulse {
            0%, 100% { filter: saturate(${200 + intensity * 100}%) contrast(${150 + intensity * 30}%) hue-rotate(0deg); }
            33% { filter: saturate(${200 + intensity * 100}%) contrast(${150 + intensity * 30}%) hue-rotate(-20deg); }
            66% { filter: saturate(${200 + intensity * 100}%) contrast(${150 + intensity * 30}%) hue-rotate(20deg); }
          }
          html.theme-effect-active {
            filter: 
              invert(${intensity * 0.8}) 
              hue-rotate(180deg) 
              saturate(${200 + intensity * 100}%) 
              contrast(${150 + intensity * 30}%) !important;
            animation: thermal-pulse 2s ease-in-out infinite !important;
          }
          html.theme-effect-active img,
          html.theme-effect-active video {
            filter: invert(${intensity * 0.8}) hue-rotate(180deg) !important;
          }
        `;
        break;

      case 'sepia':
        css = `
          @keyframes old-film {
            0%, 100% { opacity: 1; }
            5% { opacity: ${0.9 + intensity * 0.1}; }
            10% { opacity: 1; }
            50% { opacity: ${0.95 + intensity * 0.05}; }
          }
          html.theme-effect-active {
            filter: 
              sepia(${50 + intensity * 50}%) 
              contrast(${90 + intensity * 20}%) 
              brightness(${90 + intensity * 10}%) 
              saturate(${80 + intensity * 20}%) !important;
            animation: old-film 0.5s steps(3) infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, ${intensity * 0.4}) 100%);
            pointer-events: none;
            z-index: 2147483647;
          }
        `;
        break;

      case 'cyberpunk':
        css = `
          @keyframes cyber-glow {
            0%, 100% { 
              filter: 
                contrast(${120 + intensity * 20}%) 
                saturate(${150 + intensity * 50}%) 
                brightness(${100 + intensity * 10}%);
            }
            50% { 
              filter: 
                contrast(${130 + intensity * 20}%) 
                saturate(${170 + intensity * 50}%) 
                brightness(${105 + intensity * 10}%);
            }
          }
          @keyframes neon-flicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { 
              box-shadow: inset 0 0 ${60 + intensity * 40}px rgba(255, 0, 128, ${intensity * 0.3}), 
                          inset 0 0 ${100 + intensity * 50}px rgba(0, 255, 255, ${intensity * 0.2});
            }
            20%, 24%, 55% { 
              box-shadow: none; 
            }
          }
          html.theme-effect-active {
            animation: cyber-glow 3s ease-in-out infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              0deg,
              rgba(255, 0, 128, ${intensity * 0.1}) 0%,
              transparent 30%,
              transparent 70%,
              rgba(0, 255, 255, ${intensity * 0.1}) 100%
            );
            animation: neon-flicker 4s steps(1) infinite;
            pointer-events: none;
            z-index: 2147483647;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, ${intensity * 0.1}) 2px,
              rgba(0, 0, 0, ${intensity * 0.1}) 4px
            );
            pointer-events: none;
            z-index: 2147483646;
          }
        `;
        break;
    }

    styleEl.textContent = css;

    return () => {
      if (styleEl && styleEl.parentNode) {
        styleEl.textContent = '';
      }
      document.documentElement.classList.remove('theme-effect-active');
    };
  }, [mounted, settings]);

  const setEffect = useCallback((effect: EffectType) => {
    setSettings(prev => ({
      ...prev,
      activeEffect: effect,
      enabled: effect !== 'none',
    }));
  }, []);

  const setIntensity = useCallback((intensity: number) => {
    setSettings(prev => ({ ...prev, intensity }));
  }, []);

  const toggleEffect = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return (
    <ThemeEffectsContext.Provider
      value={{
        settings,
        setEffect,
        setIntensity,
        toggleEffect,
        effects: THEME_EFFECTS,
      }}
    >
      {children}
    </ThemeEffectsContext.Provider>
  );
}

export function useThemeEffects() {
  const context = useContext(ThemeEffectsContext);
  if (context === undefined) {
    throw new Error('useThemeEffects must be used within a ThemeEffectsProvider');
  }
  return context;
}

// ============================================================================
// THEME EFFECTS CONTROL PANEL
// ============================================================================

export function ThemeEffectsPanel() {
  const { settings, setEffect, setIntensity, toggleEffect, effects } = useThemeEffects();
  const [isOpen, setIsOpen] = useState(false);
  const currentEffect = effects.find(e => e.id === settings.activeEffect);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          top: 130,
          right: 20,
          zIndex: 100000,
          height: 40,
          padding: '0 16px',
          borderRadius: 20,
          background: settings.enabled 
            ? 'linear-gradient(135deg, rgba(255,0,128,0.5), rgba(0,255,255,0.5))' 
            : 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          transition: 'all 0.25s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}
        title="Theme Effects"
      >
        <span style={{ fontSize: 16 }}>{currentEffect?.icon || '✨'}</span>
        <span>Effects</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 180,
            right: 20,
            zIndex: 100000,
            width: 320,
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(255,0,128,0.1), rgba(0,255,255,0.1))',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                ✨ Theme Effects
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                Trippy visual experiences
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                color: '#fff', 
                fontSize: 16, 
                cursor: 'pointer',
                width: 28,
                height: 28,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Current Effect Display */}
          {settings.enabled && currentEffect && currentEffect.id !== 'none' && (
            <div style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(255,0,128,0.15), rgba(0,255,255,0.15))',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>{currentEffect.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{currentEffect.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{currentEffect.description}</div>
              </div>
              <button
                onClick={toggleEffect}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  fontSize: 11,
                  borderRadius: 12,
                  border: 'none',
                  background: '#ff3366',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Disable
              </button>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: 16 }}>
            {/* Intensity Slider */}
            {settings.activeEffect !== 'none' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  fontSize: 12, 
                  color: 'rgba(255,255,255,0.6)', 
                  marginBottom: 8, 
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Intensity</span>
                  <span style={{ color: '#fff' }}>{settings.intensity}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.intensity}
                  onChange={e => setIntensity(parseInt(e.target.value))}
                  style={{ 
                    width: '100%', 
                    accentColor: '#ff00ff',
                    height: 6,
                  }}
                />
              </div>
            )}

            {/* Effects Grid */}
            <label style={{ 
              fontSize: 12, 
              color: 'rgba(255,255,255,0.6)', 
              marginBottom: 10, 
              display: 'block',
              fontWeight: 500,
            }}>
              Choose Effect
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 8,
            }}>
              {effects.map(effect => {
                const isActive = settings.activeEffect === effect.id && settings.enabled;
                return (
                  <button
                    key={effect.id}
                    onClick={() => setEffect(effect.id)}
                    style={{
                      padding: '12px 8px',
                      fontSize: 10,
                      borderRadius: 10,
                      border: '1px solid',
                      borderColor: isActive ? '#ff00ff' : 'rgba(255,255,255,0.15)',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(255,0,128,0.3), rgba(0,255,255,0.3))' 
                        : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{effect.icon}</span>
                    <span style={{ fontWeight: isActive ? 600 : 400 }}>{effect.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Tips */}
            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.5,
            }}>
              💡 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Tips:</strong> Lower intensity for subtle effects. 
              Effects are saved automatically. Works across all pages!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
