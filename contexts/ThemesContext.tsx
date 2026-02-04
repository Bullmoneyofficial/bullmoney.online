'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// ============================================================================
// UNIFIED THEMES SYSTEM
// Combines Color Overlays + Visual Effects in one place
// ============================================================================

// === COLOR OVERLAY TYPES ===
interface ColorOverlaySettings {
  enabled: boolean;
  tintColor: string;
  hueShiftColor: string;
  neonColor: string;
  duotoneColor: string;
  intensity: number;
  mode: 'tint' | 'hue-shift' | 'neon' | 'duotone';
  hueRotate: number;
  saturation: number;
  brightness: number;
}

// === VISUAL EFFECTS TYPES ===
type EffectType = 
  | 'none'
  | 'invert'
  | 'lsd'
  | 'weed'
  | 'drunk'
  | 'blur'
  | 'glitch'
  | 'vaporwave'
  | 'matrix'
  | 'nightvision'
  | 'thermal'
  | 'sepia'
  | 'cyberpunk';

interface EffectSettings {
  enabled: boolean;
  activeEffect: EffectType;
  intensity: number;
}

// === COMBINED CONTEXT ===
interface ThemesContextType {
  // Color Overlay
  colorSettings: ColorOverlaySettings;
  updateColorSettings: (updates: Partial<ColorOverlaySettings>) => void;
  colorPresets: { name: string; settings: Partial<ColorOverlaySettings> }[];
  applyColorPreset: (presetName: string) => void;
  
  // Visual Effects
  effectSettings: EffectSettings;
  setEffect: (effect: EffectType) => void;
  setEffectIntensity: (intensity: number) => void;
  toggleEffect: () => void;
  effects: { id: EffectType; name: string; icon: string; description: string }[];
  renderIcon: (iconName: string) => React.ReactNode;
  
  // Global
  resetAll: () => void;
}

// === DEFAULTS ===
const DEFAULT_COLOR_SETTINGS: ColorOverlaySettings = {
  enabled: false,
  tintColor: '#2997ff',
  hueShiftColor: '#ff6600',
  neonColor: '#ff00ff',
  duotoneColor: '#00ffff',
  intensity: 30,
  mode: 'tint',
  hueRotate: 0,
  saturation: 100,
  brightness: 100,
};

const DEFAULT_EFFECT_SETTINGS: EffectSettings = {
  enabled: false,
  activeEffect: 'none',
  intensity: 70,
};

// === PRESETS ===
const COLOR_PRESETS = [
  { name: 'Default', settings: { enabled: false, tintColor: '#ffffff', intensity: 0 } },
  { name: 'Ocean Blue', settings: { enabled: true, tintColor: '#0066ff', intensity: 25, mode: 'tint' as const } },
  { name: 'Sunset Gold', settings: { enabled: true, tintColor: '#ffaa00', intensity: 20, mode: 'tint' as const } },
  { name: 'Neon Pink', settings: { enabled: true, tintColor: '#ff00ff', intensity: 30, mode: 'neon' as const } },
  { name: 'Matrix Green', settings: { enabled: true, tintColor: '#00ff00', intensity: 35, mode: 'tint' as const } },
  { name: 'Purple Haze', settings: { enabled: true, tintColor: '#9900ff', intensity: 25, mode: 'tint' as const } },
  { name: 'Warm Amber', settings: { enabled: true, tintColor: '#ff6600', intensity: 20, mode: 'tint' as const } },
  { name: 'Ice Cold', settings: { enabled: true, tintColor: '#00ffff', intensity: 25, mode: 'tint' as const } },
  { name: 'Rose Gold', settings: { enabled: true, tintColor: '#ff66aa', intensity: 20, mode: 'tint' as const } },
];

// SVG Icon Components
const Icons = {
  // Normal - clean circle with slash
  none: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <line x1="5" y1="5" x2="19" y2="19"/>
    </svg>
  ),
  // Invert - yin yang style
  invert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor"/>
      <circle cx="12" cy="7" r="2" fill="currentColor"/>
      <circle cx="12" cy="17" r="2" stroke="currentColor" fill="none"/>
    </svg>
  ),
  // LSD - trippy spiral eye
  lsd: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="3"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeWidth="1.5"/>
    </svg>
  ),
  // Weed - cannabis leaf
  weed: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22v-8"/>
      <path d="M12 14c-4 0-7-3-7-3s2-5 7-5 7 5 7 5-3 3-7 3z"/>
      <path d="M12 6c0-3-2-4-2-4s2-1 2 1c0-2 2-1 2-1s-2 1-2 4"/>
      <path d="M8 10c-3-1-4-4-4-4s2 1 4 4"/>
      <path d="M16 10c3-1 4-4 4-4s-2 1-4 4"/>
    </svg>
  ),
  // Drunk - beer mug with bubbles
  drunk: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 6h10v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z"/>
      <path d="M15 8h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3"/>
      <path d="M5 6c0-2 1-4 5-4s5 2 5 4"/>
      <circle cx="8" cy="10" r="1" fill="currentColor"/>
      <circle cx="11" cy="12" r="1" fill="currentColor"/>
      <circle cx="9" cy="15" r="1" fill="currentColor"/>
    </svg>
  ),
  // Blur - soft focus circles
  blur: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <circle cx="12" cy="12" r="5" strokeOpacity="0.7"/>
      <circle cx="12" cy="12" r="8" strokeOpacity="0.4"/>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
    </svg>
  ),
  // Glitch - broken screen effect
  glitch: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18" strokeOpacity="0.5"/>
      <path d="M3 15h18" strokeOpacity="0.5"/>
      <path d="M8 3v7l4-2 4 2V3" fill="currentColor" fillOpacity="0.3"/>
      <path d="M6 12h3l2 3h6"/>
      <path d="M9 18h6l-3-3"/>
    </svg>
  ),
  // Vaporwave - retro sun with grid
  vaporwave: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="10" r="5"/>
      <path d="M7 10h10" strokeOpacity="0.4"/>
      <path d="M8 12h8" strokeOpacity="0.4"/>
      <path d="M9 14h6" strokeOpacity="0.4"/>
      <path d="M2 18l4-3 4 2 4-2 4 3 4-3"/>
      <path d="M2 21l4-2 4 1 4-1 4 2 4-2"/>
    </svg>
  ),
  // Matrix - falling code rain
  matrix: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4v8" strokeWidth="2.5"/>
      <path d="M8 2v12" strokeWidth="2.5"/>
      <path d="M12 6v10" strokeWidth="2.5"/>
      <path d="M16 3v14" strokeWidth="2.5"/>
      <path d="M20 5v11" strokeWidth="2.5"/>
      <circle cx="4" cy="14" r="1" fill="currentColor"/>
      <circle cx="8" cy="16" r="1" fill="currentColor"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
      <circle cx="16" cy="19" r="1" fill="currentColor"/>
      <circle cx="20" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
  // Night vision - military goggle view
  nightvision: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="12" r="5"/>
      <circle cx="16" cy="12" r="5"/>
      <circle cx="8" cy="12" r="2" fill="currentColor"/>
      <circle cx="16" cy="12" r="2" fill="currentColor"/>
      <path d="M3 12h0M21 12h0" strokeWidth="3"/>
      <path d="M11 12h2"/>
    </svg>
  ),
  // Thermal - heat signature
  thermal: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="4" ry="6" fill="currentColor" fillOpacity="0.3"/>
      <ellipse cx="12" cy="12" rx="6" ry="8" strokeOpacity="0.7"/>
      <ellipse cx="12" cy="12" rx="8" ry="10" strokeOpacity="0.4"/>
      <circle cx="12" cy="10" r="2" fill="currentColor"/>
    </svg>
  ),
  // Sepia/Vintage - old film frame
  sepia: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="1"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="12" cy="12" r="2"/>
      <rect x="5" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="13" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="17" y="3" width="2" height="2" fill="currentColor"/>
      <rect x="5" y="19" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="19" width="2" height="2" fill="currentColor"/>
      <rect x="13" y="19" width="2" height="2" fill="currentColor"/>
      <rect x="17" y="19" width="2" height="2" fill="currentColor"/>
    </svg>
  ),
  // Cyberpunk - neon circuit face
  cyberpunk: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h4l2 2h4l2-2h4"/>
      <path d="M6 4v6l-2 2v4l2 2v2"/>
      <path d="M18 4v6l2 2v4l-2 2v2"/>
      <rect x="8" y="8" width="3" height="3" fill="currentColor"/>
      <rect x="13" y="8" width="3" height="3" fill="currentColor"/>
      <path d="M10 15h4"/>
      <path d="M8 18h8"/>
    </svg>
  ),
  // Palette for themes button
  palette: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor"/>
      <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.14-.76-.4-1.06-.25-.3-.4-.67-.4-1.06 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/>
    </svg>
  ),
  // Sparkles for effects
  effects: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
      <path d="M19 12l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z"/>
    </svg>
  ),
  // Colors/droplet for colors tab
  colors: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  // Close X
  close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  // Refresh/reset
  reset: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    </svg>
  ),
};

const THEME_EFFECTS: { id: EffectType; name: string; icon: keyof typeof Icons; description: string }[] = [
  { id: 'none', name: 'Normal', icon: 'none', description: 'No effects' },
  { id: 'invert', name: 'Invert', icon: 'invert', description: 'Flip colors' },
  { id: 'lsd', name: 'LSD Trip', icon: 'lsd', description: 'Psychedelic' },
  { id: 'weed', name: '420 Haze', icon: 'weed', description: 'Mellow vibes' },
  { id: 'drunk', name: 'Drunk', icon: 'drunk', description: 'Wobbly vision' },
  { id: 'blur', name: 'Blur', icon: 'blur', description: 'Smooth blur' },
  { id: 'glitch', name: 'Glitch', icon: 'glitch', description: 'Digital chaos' },
  { id: 'vaporwave', name: 'Vaporwave', icon: 'vaporwave', description: 'Retro aesthetic' },
  { id: 'matrix', name: 'Matrix', icon: 'matrix', description: 'Red pill' },
  { id: 'nightvision', name: 'Night Vision', icon: 'nightvision', description: 'Military green' },
  { id: 'thermal', name: 'Thermal', icon: 'thermal', description: 'Heat vision' },
  { id: 'sepia', name: 'Vintage', icon: 'sepia', description: 'Old photo' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: 'cyberpunk', description: 'Neon city' },
];

const ThemesContext = createContext<ThemesContextType | undefined>(undefined);

const STORAGE_KEY = 'bullmoney-themes';

const loadSettings = () => {
  if (typeof window === 'undefined') return { color: DEFAULT_COLOR_SETTINGS, effect: DEFAULT_EFFECT_SETTINGS };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        color: { ...DEFAULT_COLOR_SETTINGS, ...parsed.color },
        effect: { ...DEFAULT_EFFECT_SETTINGS, ...parsed.effect },
      };
    }
  } catch (e) {
    console.error('[Themes] Error loading settings:', e);
  }
  return { color: DEFAULT_COLOR_SETTINGS, effect: DEFAULT_EFFECT_SETTINGS };
};

const saveSettings = (color: ColorOverlaySettings, effect: EffectSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ color, effect }));
  } catch (e) {
    console.error('[Themes] Error saving settings:', e);
  }
};

export function ThemesProvider({ children }: { children: ReactNode }) {
  const [colorSettings, setColorSettings] = useState<ColorOverlaySettings>(DEFAULT_COLOR_SETTINGS);
  const [effectSettings, setEffectSettings] = useState<EffectSettings>(DEFAULT_EFFECT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = loadSettings();
    setColorSettings(saved.color);
    setEffectSettings(saved.effect);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveSettings(colorSettings, effectSettings);
    }
  }, [colorSettings, effectSettings, mounted]);

  // === APPLY COLOR OVERLAY ===
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    let styleEl = document.getElementById('themes-color-style') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'themes-color-style';
      document.head.appendChild(styleEl);
    }

    if (!colorSettings.enabled) {
      styleEl.textContent = '';
      return;
    }

    let css = '';
    
    // Get the color for the current mode
    const getModeColor = () => {
      switch (colorSettings.mode) {
        case 'tint': return colorSettings.tintColor;
        case 'hue-shift': return colorSettings.hueShiftColor;
        case 'neon': return colorSettings.neonColor;
        case 'duotone': return colorSettings.duotoneColor;
        default: return colorSettings.tintColor;
      }
    };
    const activeColor = getModeColor();

    if (colorSettings.mode === 'hue-shift') {
      const filters: string[] = [];
      filters.push(`hue-rotate(${colorSettings.hueRotate}deg)`);
      if (colorSettings.saturation !== 100) filters.push(`saturate(${colorSettings.saturation}%)`);
      if (colorSettings.brightness !== 100) filters.push(`brightness(${colorSettings.brightness}%)`);
      // Also add a subtle color tint based on hueShiftColor
      const opacity = colorSettings.intensity / 100 * 0.3;
      css = `
        html:not(.theme-effect-active) { filter: ${filters.join(' ')} !important; }
        html:not(.theme-effect-active)::after {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh;
          background: ${activeColor};
          opacity: ${opacity};
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 2147483647;
        }
      `;
    } else {
      const opacity = colorSettings.mode === 'neon' ? colorSettings.intensity / 100 * 0.5 : colorSettings.intensity / 100;
      const blendMode = colorSettings.mode === 'neon' ? 'screen' : 'color';
      const bgColor = colorSettings.mode === 'duotone' 
        ? `linear-gradient(135deg, ${activeColor}${Math.round(colorSettings.intensity * 2.55).toString(16).padStart(2, '0')}, transparent)`
        : activeColor;
      
      const filters: string[] = [];
      if (colorSettings.saturation !== 100) filters.push(`saturate(${colorSettings.saturation}%)`);
      if (colorSettings.brightness !== 100) filters.push(`brightness(${colorSettings.brightness}%)`);
      const filterStr = filters.length > 0 ? `filter: ${filters.join(' ')} !important;` : '';
      
      css = `
        html:not(.theme-effect-active) { ${filterStr} }
        html:not(.theme-effect-active)::after {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh;
          background: ${bgColor};
          opacity: ${opacity};
          mix-blend-mode: ${blendMode};
          pointer-events: none;
          z-index: 2147483647;
        }
        ${colorSettings.mode === 'neon' ? `
        html:not(.theme-effect-active)::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh;
          box-shadow: inset 0 0 150px ${activeColor}60;
          pointer-events: none;
          z-index: 2147483647;
        }` : ''}
      `;
    }

    styleEl.textContent = css;
  }, [mounted, colorSettings]);

  // === APPLY VISUAL EFFECTS ===
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    let styleEl = document.getElementById('themes-effect-style') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'themes-effect-style';
      document.head.appendChild(styleEl);
    }

    if (!effectSettings.enabled || effectSettings.activeEffect === 'none') {
      styleEl.textContent = '';
      document.documentElement.classList.remove('theme-effect-active');
      return;
    }

    document.documentElement.classList.add('theme-effect-active');
    const intensity = effectSettings.intensity / 100;
    
    // Common exclusion selector for themes panel
    const excludePanel = ':not(.themes-panel-isolated):not(.themes-panel-isolated *)';
    let css = `
      /* Always exclude themes panel from effects */
      .themes-panel-isolated,
      .themes-panel-isolated *,
      .themes-panel-isolated::before,
      .themes-panel-isolated::after {
        filter: none !important;
        animation: none !important;
        transform: none !important;
        text-shadow: none !important;
        mix-blend-mode: normal !important;
      }
    `;

    switch (effectSettings.activeEffect) {
      case 'invert':
        css += `
          html.theme-effect-active { filter: invert(${intensity}) !important; }
          html.theme-effect-active img${excludePanel}, 
          html.theme-effect-active video${excludePanel}, 
          html.theme-effect-active canvas${excludePanel} {
            filter: invert(${intensity}) !important;
          }
        `;
        break;

      case 'lsd':
        css += `
          @keyframes lsd-trip {
            0% { filter: hue-rotate(0deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%); }
            25% { filter: hue-rotate(90deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%); }
            50% { filter: hue-rotate(180deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%); }
            75% { filter: hue-rotate(270deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%); }
            100% { filter: hue-rotate(360deg) saturate(${150 + intensity * 150}%) brightness(${100 + intensity * 20}%); }
          }
          @keyframes lsd-breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(${1 + intensity * 0.02}); }
          }
          @keyframes lsd-chromatic-shift {
            0%, 100% { 
              text-shadow: ${intensity * 3}px 0 0 rgba(255,0,0,0.7), ${-intensity * 3}px 0 0 rgba(0,255,255,0.7);
            }
            50% { 
              text-shadow: ${-intensity * 3}px 0 0 rgba(255,0,0,0.7), ${intensity * 3}px 0 0 rgba(0,255,255,0.7);
            }
          }
          html.theme-effect-active { 
            animation: lsd-trip ${5 - intensity * 3}s linear infinite, lsd-breathe ${4 - intensity * 2}s ease-in-out infinite !important; 
          }
          /* 3D Glasses Chromatic Aberration Effect - exclude panel */
          html.theme-effect-active *${excludePanel} {
            text-shadow: ${intensity * 2}px 0 0 rgba(255,0,0,0.5), ${-intensity * 2}px 0 0 rgba(0,255,255,0.5) !important;
          }
          html.theme-effect-active img${excludePanel},
          html.theme-effect-active video${excludePanel},
          html.theme-effect-active canvas${excludePanel},
          html.theme-effect-active svg${excludePanel} {
            filter: drop-shadow(${intensity * 3}px 0 0 rgba(255,0,0,0.5)) drop-shadow(${-intensity * 3}px 0 0 rgba(0,255,255,0.5)) !important;
          }
          /* Liquid morph cursor effect container */
          #lsd-liquid-cursor {
            position: fixed;
            pointer-events: none;
            z-index: 2147483646;
            width: ${150 + intensity * 100}px;
            height: ${150 + intensity * 100}px;
            border-radius: 50%;
            background: radial-gradient(circle at center,
              rgba(255, 0, 128, ${intensity * 0.3}) 0%,
              rgba(0, 255, 255, ${intensity * 0.2}) 30%,
              rgba(255, 255, 0, ${intensity * 0.15}) 60%,
              transparent 70%
            );
            filter: blur(${20 + intensity * 30}px);
            mix-blend-mode: screen;
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease;
          }
          /* Liquid distortion ripples */
          #lsd-liquid-ripple {
            position: fixed;
            pointer-events: none;
            z-index: 2147483645;
            width: ${200 + intensity * 150}px;
            height: ${200 + intensity * 150}px;
            border-radius: 50%;
            border: ${2 + intensity * 3}px solid rgba(255, 0, 255, ${intensity * 0.4});
            box-shadow: 
              0 0 ${20 + intensity * 20}px rgba(255, 0, 128, ${intensity * 0.5}),
              0 0 ${40 + intensity * 40}px rgba(0, 255, 255, ${intensity * 0.3}),
              inset 0 0 ${30 + intensity * 30}px rgba(255, 255, 0, ${intensity * 0.2});
            transform: translate(-50%, -50%) scale(1);
            animation: lsd-ripple-pulse 2s ease-out infinite;
            opacity: 0;
          }
          @keyframes lsd-ripple-pulse {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: ${intensity * 0.8}; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
          /* Trailing particles */
          .lsd-trail-particle {
            position: fixed;
            pointer-events: none;
            z-index: 2147483644;
            border-radius: 50%;
            animation: lsd-particle-fade 1s ease-out forwards;
          }
          @keyframes lsd-particle-fade {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0); opacity: 0; }
          }
          /* Global wavy distortion */
          html.theme-effect-active::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
              repeating-linear-gradient(
                ${45 + intensity * 45}deg,
                transparent,
                transparent 10px,
                rgba(255, 0, 128, ${intensity * 0.03}) 10px,
                rgba(255, 0, 128, ${intensity * 0.03}) 20px
              ),
              repeating-linear-gradient(
                ${-45 - intensity * 45}deg,
                transparent,
                transparent 10px,
                rgba(0, 255, 255, ${intensity * 0.03}) 10px,
                rgba(0, 255, 255, ${intensity * 0.03}) 20px
              );
            pointer-events: none;
            z-index: 2147483643;
            animation: lsd-pattern-shift ${10 - intensity * 5}s linear infinite;
          }
          @keyframes lsd-pattern-shift {
            0% { transform: translateX(0) translateY(0); }
            100% { transform: translateX(40px) translateY(40px); }
          }
          /* Chromatic aberration overlay for 3D glasses effect */
          html.theme-effect-active::after {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(
              90deg,
              rgba(255, 0, 0, ${intensity * 0.08}) 0%,
              transparent 30%,
              transparent 70%,
              rgba(0, 255, 255, ${intensity * 0.08}) 100%
            );
            pointer-events: none;
            z-index: 2147483647;
            animation: lsd-chromatic-breathe ${3 - intensity}s ease-in-out infinite;
          }
          @keyframes lsd-chromatic-breathe {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `;
        break;

      case 'weed':
        css += `
          @keyframes weed-float {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
            25% { transform: translateY(${intensity * 3}px) rotate(${intensity * 0.3}deg) scale(${1 + intensity * 0.005}); }
            50% { transform: translateY(${intensity * 5}px) rotate(${intensity * 0.5}deg) scale(${1 + intensity * 0.01}); }
            75% { transform: translateY(${intensity * 2}px) rotate(${intensity * 0.2}deg) scale(${1 + intensity * 0.003}); }
          }
          @keyframes weed-pulse {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.25; }
          }
          @keyframes weed-smoke {
            0% { transform: translateY(0) scale(1); opacity: 0.3; }
            100% { transform: translateY(-100px) scale(2); opacity: 0; }
          }
          html.theme-effect-active {
            filter: sepia(${intensity * 0.25}) hue-rotate(50deg) saturate(${90 + intensity * 30}%) blur(${intensity * 1.2}px) brightness(${95 + intensity * 5}%) !important;
            animation: weed-float 5s ease-in-out infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(ellipse 80% 50% at 20% 80%, rgba(50, 150, 50, ${intensity * 0.15}) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(80, 180, 80, ${intensity * 0.1}) 0%, transparent 50%),
              radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30, 100, 30, ${intensity * 0.08}) 0%, transparent 60%);
            pointer-events: none; 
            z-index: 2147483646;
            animation: weed-pulse 4s ease-in-out infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at center, transparent 20%, rgba(0, 80, 0, ${intensity * 0.25}) 100%);
            pointer-events: none; z-index: 2147483647;
          }
        `;
        break;

      case 'drunk':
        css += `
          @keyframes drunk-sway {
            0%, 100% { transform: translateX(0) rotate(0deg) skewX(0deg); }
            15% { transform: translateX(${-intensity * 10}px) rotate(${-intensity * 1.5}deg) skewX(${intensity * 0.5}deg); }
            30% { transform: translateX(${intensity * 8}px) rotate(${intensity * 1.2}deg) skewX(${-intensity * 0.3}deg); }
            45% { transform: translateX(${-intensity * 6}px) rotate(${-intensity * 0.8}deg) skewX(${intensity * 0.4}deg); }
            60% { transform: translateX(${intensity * 9}px) rotate(${intensity * 1.4}deg) skewX(${-intensity * 0.6}deg); }
            75% { transform: translateX(${-intensity * 5}px) rotate(${-intensity * 0.6}deg) skewX(${intensity * 0.2}deg); }
            90% { transform: translateX(${intensity * 4}px) rotate(${intensity * 0.4}deg) skewX(${-intensity * 0.1}deg); }
          }
          @keyframes drunk-double-vision {
            0%, 100% { text-shadow: ${intensity * 2}px 0 0 rgba(255,255,255,0.3), ${-intensity * 2}px 0 0 rgba(255,255,255,0.3); }
            50% { text-shadow: ${intensity * 4}px ${intensity}px 0 rgba(255,255,255,0.4), ${-intensity * 4}px ${-intensity}px 0 rgba(255,255,255,0.4); }
          }
          @keyframes drunk-blur-pulse {
            0%, 100% { filter: blur(${intensity * 2}px); }
            50% { filter: blur(${intensity * 4}px); }
          }
          html.theme-effect-active {
            animation: drunk-sway ${4 - intensity * 1.5}s ease-in-out infinite, drunk-blur-pulse ${3 - intensity}s ease-in-out infinite !important;
          }
          html.theme-effect-active *${excludePanel} {
            animation: drunk-double-vision 2s ease-in-out infinite !important;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at center, transparent 30%, rgba(139, 90, 43, ${intensity * 0.15}) 100%);
            pointer-events: none; z-index: 2147483647;
          }
        `;
        break;

      case 'blur':
        css += `
          @keyframes blur-breathe {
            0%, 100% { filter: blur(${intensity * 3}px) brightness(1); }
            50% { filter: blur(${intensity * 5}px) brightness(1.05); }
          }
          @keyframes blur-vignette {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.6; }
          }
          html.theme-effect-active { 
            animation: blur-breathe 4s ease-in-out infinite !important; 
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, ${intensity * 0.3}) 100%);
            pointer-events: none; z-index: 2147483647;
            animation: blur-vignette 4s ease-in-out infinite;
          }
        `;
        break;

      case 'glitch':
        css += `
          @keyframes glitch-main {
            0%, 90%, 100% { transform: translate(0) skew(0); filter: none; }
            91% { transform: translate(${intensity * 5}px, ${-intensity * 2}px) skew(${intensity * 0.5}deg); filter: hue-rotate(90deg); }
            92% { transform: translate(${-intensity * 3}px, ${intensity * 4}px) skew(${-intensity * 0.3}deg); filter: hue-rotate(180deg); }
            93% { transform: translate(${intensity * 2}px, ${-intensity * 3}px) skew(${intensity * 0.2}deg); filter: hue-rotate(270deg); }
            94% { transform: translate(${-intensity * 4}px, ${intensity * 2}px) skew(${-intensity * 0.4}deg); filter: none; }
          }
          @keyframes glitch-clip {
            0%, 100% { clip-path: inset(0 0 0 0); }
            20% { clip-path: inset(${intensity * 20}% 0 ${intensity * 30}% 0); }
            40% { clip-path: inset(${intensity * 50}% 0 ${intensity * 10}% 0); }
            60% { clip-path: inset(${intensity * 10}% 0 ${intensity * 60}% 0); }
            80% { clip-path: inset(${intensity * 40}% 0 ${intensity * 20}% 0); }
          }
          @keyframes glitch-color {
            0%, 100% { 
              text-shadow: ${intensity * 2}px 0 #ff0000, ${-intensity * 2}px 0 #00ffff;
            }
            25% { 
              text-shadow: ${-intensity * 2}px 0 #ff0000, ${intensity * 2}px 0 #00ffff;
            }
            50% { 
              text-shadow: ${intensity * 3}px ${intensity}px #ff00ff, ${-intensity * 3}px ${-intensity}px #00ff00;
            }
            75% { 
              text-shadow: ${-intensity}px ${intensity * 2}px #ffff00, ${intensity}px ${-intensity * 2}px #0000ff;
            }
          }
          html.theme-effect-active { 
            animation: glitch-main ${1.5 - intensity * 0.5}s steps(1) infinite !important; 
          }
          html.theme-effect-active *${excludePanel} {
            animation: glitch-color 0.3s steps(1) infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, ${intensity * 0.05}) 2px, rgba(0, 255, 255, ${intensity * 0.05}) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 50%, rgba(255, 0, 255, ${intensity * 0.02}) 50%);
            pointer-events: none; 
            z-index: 2147483646;
            animation: glitch-clip 0.5s steps(1) infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(90deg, 
              rgba(255, 0, 0, ${intensity * 0.1}) 0%, 
              transparent 10%,
              transparent 90%,
              rgba(0, 255, 255, ${intensity * 0.1}) 100%
            );
            pointer-events: none; z-index: 2147483647;
          }
        `;
        break;

      case 'vaporwave':
        css += `
          @keyframes vaporwave-shift {
            0%, 100% { filter: hue-rotate(280deg) saturate(${220 + intensity * 150}%) brightness(1.2) contrast(1.15); }
            25% { filter: hue-rotate(300deg) saturate(${250 + intensity * 150}%) brightness(1.25) contrast(1.1); }
            50% { filter: hue-rotate(320deg) saturate(${240 + intensity * 150}%) brightness(1.15) contrast(1.2); }
            75% { filter: hue-rotate(290deg) saturate(${230 + intensity * 150}%) brightness(1.3) contrast(1.12); }
          }
          @keyframes vaporwave-grid {
            0% { background-position: 0 0; }
            100% { background-position: 0 100px; }
          }
          @keyframes vaporwave-sun {
            0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 80px rgba(255, 100, 200, 0.8), 0 0 150px rgba(255, 50, 150, 0.6), 0 0 200px rgba(255, 0, 128, 0.4); }
            50% { transform: translateY(-20px) scale(1.08); box-shadow: 0 0 100px rgba(255, 100, 200, 1), 0 0 180px rgba(255, 50, 150, 0.8), 0 0 250px rgba(255, 0, 128, 0.5); }
          }
          @keyframes vaporwave-chromatic {
            0%, 100% { 
              text-shadow: ${intensity * 4}px 0 rgba(255, 0, 255, 0.9), 
                           ${-intensity * 4}px 0 rgba(0, 255, 255, 0.9), 
                           0 0 30px rgba(255, 0, 255, 0.6),
                           0 0 60px rgba(0, 255, 255, 0.4),
                           0 ${intensity * 2}px 20px rgba(255, 100, 200, 0.5);
              color: #fff !important;
            }
            50% { 
              text-shadow: ${-intensity * 4}px 0 rgba(255, 0, 255, 0.9), 
                           ${intensity * 4}px 0 rgba(0, 255, 255, 0.9), 
                           0 0 40px rgba(0, 255, 255, 0.7),
                           0 0 80px rgba(255, 0, 255, 0.5),
                           0 ${-intensity * 2}px 25px rgba(0, 200, 255, 0.5);
              color: #fff !important;
            }
          }
          @keyframes vaporwave-bars {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.25; }
          }
          @keyframes vaporwave-star {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
          html.theme-effect-active { 
            animation: vaporwave-shift ${4 - intensity * 1.5}s ease-in-out infinite !important; 
          }
          html.theme-effect-active *${excludePanel} {
            animation: vaporwave-chromatic 2.5s ease-in-out infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; 
            bottom: 0; left: 0; right: 0; 
            height: 50%;
            background: 
              linear-gradient(180deg, transparent 0%, rgba(255, 0, 128, ${intensity * 0.3}) 100%),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 35px,
                rgba(255, 0, 255, ${intensity * 0.4}) 35px,
                rgba(255, 0, 255, ${intensity * 0.4}) 37px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 35px,
                rgba(0, 255, 255, ${intensity * 0.35}) 35px,
                rgba(0, 255, 255, ${intensity * 0.35}) 37px
              );
            transform: perspective(350px) rotateX(70deg);
            transform-origin: bottom;
            pointer-events: none; 
            z-index: 2147483645;
            animation: vaporwave-grid 1.2s linear infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 2%; left: 50%; 
            width: 280px; height: 280px;
            margin-left: -140px;
            background: 
              repeating-linear-gradient(
                0deg,
                rgba(255, 50, 150, ${intensity * 1}) 0px,
                rgba(255, 50, 150, ${intensity * 1}) 10px,
                rgba(255, 100, 50, ${intensity * 0.8}) 10px,
                rgba(255, 100, 50, ${intensity * 0.8}) 20px,
                rgba(255, 200, 50, ${intensity * 0.7}) 20px,
                rgba(255, 200, 50, ${intensity * 0.7}) 30px,
                rgba(150, 50, 255, ${intensity * 0.6}) 30px,
                rgba(150, 50, 255, ${intensity * 0.6}) 40px,
                rgba(100, 0, 200, ${intensity * 0.5}) 40px,
                rgba(100, 0, 200, ${intensity * 0.5}) 50px
              );
            border-radius: 50% 50% 0 0;
            clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
            pointer-events: none; z-index: 2147483646;
            animation: vaporwave-sun 3s ease-in-out infinite;
          }
        `;
        css += `
          body::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(2px 2px at 20% 15%, rgba(255, 255, 255, 0.8), transparent),
              radial-gradient(2px 2px at 40% 25%, rgba(255, 200, 255, 0.7), transparent),
              radial-gradient(3px 3px at 60% 10%, rgba(200, 255, 255, 0.9), transparent),
              radial-gradient(2px 2px at 80% 20%, rgba(255, 255, 200, 0.6), transparent),
              radial-gradient(2px 2px at 30% 35%, rgba(255, 150, 255, 0.7), transparent),
              radial-gradient(3px 3px at 70% 30%, rgba(150, 255, 255, 0.8), transparent),
              linear-gradient(180deg, 
                rgba(100, 0, 150, ${intensity * 0.25}) 0%, 
                rgba(200, 0, 150, ${intensity * 0.2}) 20%,
                rgba(255, 0, 128, ${intensity * 0.15}) 40%,
                transparent 60%
              ),
              linear-gradient(90deg, 
                rgba(255, 0, 255, ${intensity * 0.2}) 0%, 
                transparent 15%,
                transparent 85%,
                rgba(0, 255, 255, ${intensity * 0.2}) 100%
              );
            pointer-events: none;
            z-index: 2147483644;
            animation: vaporwave-bars 3s ease-in-out infinite;
          }
          body::after {
            content: '✦';
            position: fixed; top: 8%; left: 15%;
            font-size: 20px;
            color: rgba(255, 200, 255, 0.8);
            text-shadow: 0 0 20px rgba(255, 0, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.5);
            pointer-events: none;
            z-index: 2147483647;
            animation: vaporwave-star 2s ease-in-out infinite;
          }
        `;
        break;

      case 'matrix':
        css += `
          @keyframes matrix-rain {
            0% { background-position: 0 -100vh; }
            100% { background-position: 0 100vh; }
          }
          @keyframes matrix-glow {
            0%, 100% { filter: hue-rotate(80deg) saturate(${150 + intensity * 200}%) contrast(${140 + intensity * 40}%) brightness(1.1); }
            50% { filter: hue-rotate(100deg) saturate(${180 + intensity * 200}%) contrast(${150 + intensity * 40}%) brightness(1.2); }
          }
          @keyframes matrix-flicker {
            0%, 89%, 91%, 93%, 95%, 100% { opacity: 1; }
            90%, 92%, 94% { opacity: 0.88; }
          }
          @keyframes matrix-code-glow {
            0%, 100% { 
              text-shadow: 0 0 ${intensity * 10}px rgba(0, 255, 0, 1), 
                           0 0 ${intensity * 20}px rgba(0, 255, 0, 0.9), 
                           0 0 ${intensity * 35}px rgba(0, 255, 0, 0.7),
                           0 0 ${intensity * 50}px rgba(0, 255, 0, 0.5),
                           0 0 ${intensity * 70}px rgba(0, 200, 0, 0.3),
                           ${intensity * 2}px 0 rgba(0, 255, 100, 0.5),
                           ${-intensity * 2}px 0 rgba(100, 255, 0, 0.5);
              color: #00ff00 !important;
            }
            50% { 
              text-shadow: 0 0 ${intensity * 15}px rgba(0, 255, 0, 1), 
                           0 0 ${intensity * 30}px rgba(0, 255, 0, 1), 
                           0 0 ${intensity * 50}px rgba(0, 255, 0, 0.8),
                           0 0 ${intensity * 70}px rgba(0, 255, 0, 0.6),
                           0 0 ${intensity * 100}px rgba(0, 200, 0, 0.4),
                           ${intensity * 3}px 0 rgba(100, 255, 100, 0.6),
                           ${-intensity * 3}px 0 rgba(100, 255, 50, 0.6);
              color: #00ff00 !important;
            }
          }
          @keyframes matrix-scanline {
            0% { top: -10%; }
            100% { top: 110%; }
          }
          @keyframes matrix-drip {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; transform: translateY(100vh); }
          }
          html.theme-effect-active {
            animation: matrix-glow 2.5s ease-in-out infinite, matrix-flicker 0.1s steps(1) infinite !important;
          }
          html.theme-effect-active *${excludePanel} {
            animation: matrix-code-glow 1.5s ease-in-out infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 2px,
                rgba(0, 255, 0, ${intensity * 0.06}) 2px,
                rgba(0, 255, 0, ${intensity * 0.06}) 4px
              ),
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 1px,
                rgba(0, 255, 0, ${intensity * 0.08}) 1px,
                rgba(0, 255, 0, ${intensity * 0.08}) 3px
              ),
              linear-gradient(180deg, 
                rgba(0, 80, 0, ${intensity * 0.4}) 0%,
                rgba(0, 40, 0, ${intensity * 0.2}) 20%,
                transparent 40%,
                transparent 60%,
                rgba(0, 40, 0, ${intensity * 0.2}) 80%,
                rgba(0, 80, 0, ${intensity * 0.5}) 100%
              );
            pointer-events: none; 
            z-index: 2147483645;
            animation: matrix-rain ${2.5 - intensity * 0.8}s linear infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(ellipse at center, rgba(0, 50, 0, 0.3) 0%, rgba(0, 30, 0, ${intensity * 0.85}) 100%);
            pointer-events: none; z-index: 2147483646;
          }
          body::before {
            content: '';
            position: fixed; left: 0; right: 0; height: 6px;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 0, ${intensity * 0.8}), rgba(100, 255, 100, ${intensity * 0.9}), rgba(0, 255, 0, ${intensity * 0.8}), transparent);
            box-shadow: 0 0 30px rgba(0, 255, 0, ${intensity * 0.7}), 0 0 60px rgba(0, 255, 0, ${intensity * 0.5}), 0 0 100px rgba(0, 255, 0, ${intensity * 0.3});
            pointer-events: none;
            z-index: 2147483647;
            animation: matrix-scanline 1.5s linear infinite;
          }
          body::after {
            content: '01101001';
            position: fixed; top: 5%; right: 5%;
            font-family: monospace;
            font-size: 14px;
            color: rgba(0, 255, 0, 0.6);
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
            pointer-events: none;
            z-index: 2147483647;
            animation: matrix-drip 4s linear infinite;
          }
        `;
        break;

      case 'nightvision':
        css += `
          @keyframes nv-scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes nv-noise {
            0% { background-position: 0 0; }
            100% { background-position: 100% 100%; }
          }
          @keyframes nv-flicker {
            0%, 87%, 89%, 91%, 93%, 100% { 
              filter: brightness(${180 + intensity * 80}%) contrast(${150 + intensity * 40}%) saturate(0%) sepia(100%) hue-rotate(70deg); 
            }
            88%, 90%, 92% { 
              filter: brightness(${160 + intensity * 80}%) contrast(${140 + intensity * 40}%) saturate(0%) sepia(100%) hue-rotate(70deg); 
            }
          }
          @keyframes nv-glow {
            0%, 100% { 
              text-shadow: 0 0 ${intensity * 8}px rgba(0, 255, 0, 1), 
                           0 0 ${intensity * 15}px rgba(0, 255, 0, 0.9),
                           0 0 ${intensity * 25}px rgba(0, 255, 0, 0.7),
                           0 0 ${intensity * 40}px rgba(0, 255, 0, 0.5),
                           0 0 ${intensity * 60}px rgba(0, 200, 0, 0.3),
                           inset 0 0 ${intensity * 5}px rgba(0, 255, 0, 0.3);
              color: #90ff90 !important;
            }
            50% { 
              text-shadow: 0 0 ${intensity * 12}px rgba(0, 255, 0, 1), 
                           0 0 ${intensity * 22}px rgba(0, 255, 0, 1),
                           0 0 ${intensity * 35}px rgba(0, 255, 0, 0.8),
                           0 0 ${intensity * 55}px rgba(0, 255, 0, 0.6),
                           0 0 ${intensity * 80}px rgba(0, 200, 0, 0.4),
                           inset 0 0 ${intensity * 8}px rgba(0, 255, 0, 0.4);
              color: #b0ffb0 !important;
            }
          }
          @keyframes nv-static {
            0%, 100% { opacity: ${intensity * 0.12}; }
            25% { opacity: ${intensity * 0.18}; }
            50% { opacity: ${intensity * 0.1}; }
            75% { opacity: ${intensity * 0.15}; }
          }
          @keyframes nv-scope-pulse {
            0%, 100% { box-shadow: inset 0 0 150px rgba(0, 0, 0, 0.8), inset 0 0 80px rgba(0, 50, 0, 0.3); }
            50% { box-shadow: inset 0 0 180px rgba(0, 0, 0, 0.85), inset 0 0 100px rgba(0, 60, 0, 0.4); }
          }
          @keyframes nv-crosshair {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
          html.theme-effect-active {
            animation: nv-flicker 0.12s steps(1) infinite !important;
          }
          html.theme-effect-active *${excludePanel} {
            animation: nv-glow 1.5s ease-in-out infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; height: 10px;
            background: linear-gradient(180deg, rgba(0, 255, 0, ${intensity * 0.8}) 0%, rgba(0, 255, 0, ${intensity * 0.5}) 40%, rgba(100, 255, 100, ${intensity * 0.3}) 70%, transparent 100%);
            box-shadow: 0 0 40px rgba(0, 255, 0, ${intensity * 0.7}), 0 0 80px rgba(0, 255, 0, ${intensity * 0.5}), 0 0 120px rgba(0, 255, 0, ${intensity * 0.3});
            pointer-events: none; 
            z-index: 2147483645;
            animation: nv-scan 2s linear infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(circle at center, transparent 0%, transparent 25%, rgba(0, 0, 0, ${intensity * 0.9}) 100%),
              repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(0, 255, 0, ${intensity * 0.035}) 3px, rgba(0, 255, 0, ${intensity * 0.035}) 6px),
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 1px,
                rgba(0, 0, 0, ${intensity * 0.15}) 1px,
                rgba(0, 0, 0, ${intensity * 0.15}) 2px
              );
            border-radius: 50%;
            pointer-events: none; z-index: 2147483646;
            animation: nv-scope-pulse 3s ease-in-out infinite;
          }
          body::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            opacity: ${intensity * 0.2};
            pointer-events: none;
            z-index: 2147483647;
            animation: nv-noise 0.15s steps(4) infinite, nv-static 0.4s ease-in-out infinite;
          }
          body::after {
            content: '+';
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 40px;
            font-weight: 100;
            color: rgba(0, 255, 0, 0.5);
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
            pointer-events: none;
            z-index: 2147483647;
            animation: nv-crosshair 2s ease-in-out infinite;
          }
        `;
        break;

      case 'thermal':
        css += `
          @keyframes thermal-shift {
            0%, 100% { filter: saturate(${300 + intensity * 200}%) contrast(${180 + intensity * 50}%) brightness(1.15); }
            33% { filter: saturate(${350 + intensity * 200}%) contrast(${190 + intensity * 50}%) brightness(1.2); }
            66% { filter: saturate(${320 + intensity * 200}%) contrast(${170 + intensity * 50}%) brightness(1.1); }
          }
          @keyframes thermal-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.85; }
          }
          @keyframes thermal-scan {
            0% { top: -5%; }
            100% { top: 105%; }
          }
          @keyframes thermal-glow {
            0%, 100% { 
              text-shadow: 0 0 ${intensity * 8}px rgba(255, 100, 0, 1), 
                           0 0 ${intensity * 15}px rgba(255, 50, 0, 0.8),
                           0 0 ${intensity * 25}px rgba(255, 0, 0, 0.6),
                           0 0 ${intensity * 40}px rgba(200, 0, 0, 0.4),
                           ${intensity * 2}px 0 rgba(255, 200, 0, 0.5),
                           ${-intensity * 2}px 0 rgba(255, 100, 50, 0.5);
              color: #ffcc00 !important;
            }
            50% { 
              text-shadow: 0 0 ${intensity * 12}px rgba(255, 150, 0, 1), 
                           0 0 ${intensity * 22}px rgba(255, 100, 0, 0.9),
                           0 0 ${intensity * 35}px rgba(255, 50, 0, 0.7),
                           0 0 ${intensity * 55}px rgba(200, 0, 0, 0.5),
                           ${intensity * 3}px 0 rgba(255, 255, 0, 0.6),
                           ${-intensity * 3}px 0 rgba(255, 150, 50, 0.6);
              color: #ffee00 !important;
            }
          }
          @keyframes thermal-hotspot {
            0%, 100% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.1); opacity: 0.6; }
          }
          html.theme-effect-active {
            animation: thermal-shift 2.5s ease-in-out infinite !important;
          }
          html.theme-effect-active *${excludePanel} {
            animation: thermal-glow 1.5s ease-in-out infinite !important;
          }
          html.theme-effect-active img${excludePanel}, html.theme-effect-active video${excludePanel} {
            filter: saturate(400%) contrast(180%) !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; left: 0; right: 0; height: 6px;
            background: linear-gradient(90deg, 
              rgba(0, 0, 180, ${intensity * 1}) 0%,
              rgba(0, 100, 255, ${intensity * 0.9}) 15%,
              rgba(0, 255, 255, ${intensity * 0.8}) 30%,
              rgba(0, 255, 100, ${intensity * 0.7}) 45%,
              rgba(255, 255, 0, ${intensity * 0.8}) 60%,
              rgba(255, 150, 0, ${intensity * 0.9}) 75%,
              rgba(255, 50, 0, ${intensity * 1}) 90%,
              rgba(255, 0, 0, ${intensity * 1}) 100%
            );
            box-shadow: 0 0 30px rgba(255, 100, 0, ${intensity * 0.7}), 0 0 60px rgba(255, 50, 0, ${intensity * 0.5}), 0 0 100px rgba(255, 0, 0, ${intensity * 0.3});
            pointer-events: none; 
            z-index: 2147483645;
            animation: thermal-scan 2.5s linear infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(ellipse 40% 30% at 25% 25%, rgba(255, 0, 0, ${intensity * 0.35}) 0%, rgba(255, 100, 0, ${intensity * 0.2}) 40%, transparent 70%),
              radial-gradient(ellipse 50% 40% at 75% 55%, rgba(255, 200, 0, ${intensity * 0.3}) 0%, rgba(255, 100, 0, ${intensity * 0.15}) 50%, transparent 80%),
              radial-gradient(ellipse 35% 35% at 50% 75%, rgba(255, 150, 50, ${intensity * 0.25}) 0%, rgba(255, 100, 0, ${intensity * 0.1}) 45%, transparent 75%),
              radial-gradient(ellipse 30% 25% at 15% 65%, rgba(0, 200, 255, ${intensity * 0.2}) 0%, rgba(0, 100, 200, ${intensity * 0.1}) 40%, transparent 60%),
              radial-gradient(ellipse 25% 20% at 85% 15%, rgba(0, 150, 255, ${intensity * 0.15}) 0%, rgba(0, 50, 150, ${intensity * 0.08}) 35%, transparent 55%),
              radial-gradient(ellipse 45% 50% at 60% 30%, rgba(255, 255, 0, ${intensity * 0.2}) 0%, transparent 60%),
              linear-gradient(180deg, 
                rgba(255, 0, 0, ${intensity * 0.2}) 0%,
                rgba(255, 100, 0, ${intensity * 0.15}) 15%,
                rgba(255, 200, 0, ${intensity * 0.12}) 30%,
                rgba(100, 255, 0, ${intensity * 0.08}) 45%,
                rgba(0, 255, 150, ${intensity * 0.1}) 60%,
                rgba(0, 150, 255, ${intensity * 0.15}) 80%,
                rgba(0, 50, 200, ${intensity * 0.2}) 100%
              );
            pointer-events: none; z-index: 2147483646;
            animation: thermal-pulse 2s ease-in-out infinite;
          }
          body::before {
            content: '';
            position: fixed; top: 20%; left: 30%;
            width: 100px; height: 100px;
            background: radial-gradient(circle, rgba(255, 0, 0, ${intensity * 0.4}) 0%, rgba(255, 100, 0, ${intensity * 0.2}) 50%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 2147483647;
            animation: thermal-hotspot 3s ease-in-out infinite;
          }
        `;
        break;

      case 'sepia':
        css += `
          @keyframes sepia-flicker {
            0%, 85%, 87%, 89%, 91%, 100% { filter: sepia(${70 + intensity * 30}%) contrast(${100 + intensity * 25}%) brightness(${95 + intensity * 5}%); }
            86%, 88%, 90% { filter: sepia(${65 + intensity * 30}%) contrast(${95 + intensity * 25}%) brightness(${88 + intensity * 5}%); }
          }
          @keyframes sepia-scratches {
            0% { background-position: 0 0, 100% 100%, 50% 50%; }
            100% { background-position: 100% 100%, 0 0, 0 100%; }
          }
          @keyframes sepia-dust {
            0%, 100% { opacity: ${intensity * 0.35}; transform: translateY(0); }
            50% { opacity: ${intensity * 0.55}; transform: translateY(-8px); }
          }
          @keyframes sepia-vignette {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 0.9; }
          }
          @keyframes sepia-grain {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-1%, -1%); }
            20% { transform: translate(1%, 1%); }
            30% { transform: translate(-1%, 1%); }
            40% { transform: translate(1%, -1%); }
            50% { transform: translate(-1%, 0); }
            60% { transform: translate(1%, 0); }
            70% { transform: translate(0, 1%); }
            80% { transform: translate(0, -1%); }
            90% { transform: translate(1%, 1%); }
          }
          @keyframes sepia-text-vintage {
            0%, 100% { 
              text-shadow: 1px 1px 0 rgba(139, 90, 43, 0.5), 
                           2px 2px 3px rgba(80, 50, 20, 0.4),
                           0 0 ${intensity * 5}px rgba(200, 150, 100, 0.3);
              color: #3d2b1f !important;
            }
            50% { 
              text-shadow: 1px 1px 0 rgba(139, 90, 43, 0.6), 
                           2px 2px 4px rgba(80, 50, 20, 0.5),
                           0 0 ${intensity * 8}px rgba(200, 150, 100, 0.4);
              color: #4a3728 !important;
            }
          }
          @keyframes sepia-reel {
            0% { top: -10%; opacity: 0; }
            5% { opacity: 0.8; }
            95% { opacity: 0.8; }
            100% { top: 110%; opacity: 0; }
          }
          html.theme-effect-active {
            animation: sepia-flicker 0.25s steps(1) infinite !important;
          }
          html.theme-effect-active *${excludePanel} {
            animation: sepia-text-vintage 3s ease-in-out infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; top: -10%; left: -10%; right: -10%; bottom: -10%;
            background: 
              radial-gradient(ellipse at 10% 20%, rgba(255, 255, 255, ${intensity * 0.2}) 0%, transparent 30%),
              radial-gradient(ellipse at 80% 50%, rgba(255, 255, 255, ${intensity * 0.18}) 0%, transparent 25%),
              radial-gradient(ellipse at 30% 70%, rgba(255, 255, 255, ${intensity * 0.15}) 0%, transparent 20%),
              radial-gradient(ellipse at 90% 80%, rgba(255, 255, 255, ${intensity * 0.12}) 0%, transparent 18%),
              radial-gradient(ellipse at 20% 95%, rgba(255, 255, 255, ${intensity * 0.1}) 0%, transparent 15%),
              radial-gradient(ellipse at 70% 15%, rgba(255, 255, 255, ${intensity * 0.08}) 0%, transparent 12%),
              linear-gradient(90deg, 
                rgba(0, 0, 0, ${intensity * 0.4}) 0%, 
                transparent 3%, 
                transparent 4%,
                rgba(0, 0, 0, ${intensity * 0.15}) 4.5%,
                transparent 5%,
                transparent 100%
              ),
              linear-gradient(90deg, 
                transparent 0%, 
                transparent 95%,
                rgba(0, 0, 0, ${intensity * 0.2}) 95.5%,
                transparent 96%,
                transparent 98%,
                rgba(0, 0, 0, ${intensity * 0.35}) 100%
              );
            pointer-events: none; 
            z-index: 2147483645;
            animation: sepia-dust 3.5s ease-in-out infinite, sepia-scratches 6s linear infinite, sepia-grain 0.4s steps(1) infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(circle at center, transparent 15%, rgba(30, 15, 0, ${intensity * 0.7}) 100%),
              linear-gradient(180deg, rgba(120, 70, 30, ${intensity * 0.2}) 0%, transparent 12%, transparent 88%, rgba(100, 50, 15, ${intensity * 0.25}) 100%),
              linear-gradient(90deg, rgba(80, 40, 5, ${intensity * 0.15}) 0%, transparent 8%, transparent 92%, rgba(80, 40, 5, ${intensity * 0.15}) 100%);
            pointer-events: none; z-index: 2147483646;
            animation: sepia-vignette 2.5s ease-in-out infinite;
          }
          body::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E");
            opacity: ${intensity * 0.12};
            pointer-events: none;
            z-index: 2147483647;
          }
          body::after {
            content: '';
            position: fixed; left: 3%; width: 2px; height: 100%;
            background: linear-gradient(180deg, transparent, rgba(0, 0, 0, ${intensity * 0.5}), transparent);
            pointer-events: none;
            z-index: 2147483647;
            animation: sepia-reel 8s linear infinite;
          }
        `;
        break;

      case 'cyberpunk':
        css += `
          @keyframes cyber-glow {
            0%, 100% { filter: contrast(${140 + intensity * 30}%) saturate(${220 + intensity * 100}%) brightness(1.15); }
            25% { filter: contrast(${150 + intensity * 30}%) saturate(${250 + intensity * 100}%) brightness(1.25); }
            50% { filter: contrast(${145 + intensity * 30}%) saturate(${240 + intensity * 100}%) brightness(1.2); }
            75% { filter: contrast(${155 + intensity * 30}%) saturate(${260 + intensity * 100}%) brightness(1.22); }
          }
          @keyframes cyber-scan {
            0% { top: -5%; opacity: 1; }
            50% { opacity: 0.8; }
            100% { top: 105%; opacity: 1; }
          }
          @keyframes cyber-flicker {
            0%, 87%, 89%, 92%, 94%, 100% { opacity: 1; }
            88%, 93% { opacity: 0.8; }
            90%, 95% { opacity: 0.88; }
          }
          @keyframes cyber-chromatic {
            0%, 100% { 
              text-shadow: ${intensity * 4}px 0 rgba(255, 0, 128, 1), 
                           ${-intensity * 4}px 0 rgba(0, 255, 255, 1),
                           0 0 ${intensity * 15}px rgba(255, 0, 255, 0.8),
                           0 0 ${intensity * 30}px rgba(0, 255, 255, 0.6),
                           0 0 ${intensity * 50}px rgba(255, 0, 128, 0.4),
                           ${intensity * 2}px ${intensity}px rgba(255, 255, 0, 0.5);
              color: #fff !important;
            }
            33% { 
              text-shadow: ${-intensity * 4}px 0 rgba(255, 0, 128, 1), 
                           ${intensity * 4}px 0 rgba(0, 255, 255, 1),
                           0 0 ${intensity * 20}px rgba(255, 0, 255, 0.9),
                           0 0 ${intensity * 40}px rgba(0, 255, 255, 0.7),
                           0 0 ${intensity * 60}px rgba(255, 0, 128, 0.5),
                           ${-intensity * 2}px ${-intensity}px rgba(0, 255, 128, 0.5);
              color: #fff !important;
            }
            66% { 
              text-shadow: ${intensity * 3}px ${intensity}px rgba(255, 0, 255, 1), 
                           ${-intensity * 3}px ${-intensity}px rgba(0, 255, 255, 1),
                           0 0 ${intensity * 18}px rgba(255, 0, 128, 0.85),
                           0 0 ${intensity * 35}px rgba(255, 255, 0, 0.65),
                           0 0 ${intensity * 55}px rgba(0, 255, 255, 0.45);
              color: #fff !important;
            }
          }
          @keyframes cyber-neon-pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          @keyframes cyber-glitch {
            0%, 92%, 100% { transform: translate(0) skew(0); }
            93% { transform: translate(${intensity * 5}px, ${-intensity * 2}px) skew(${intensity * 0.3}deg); }
            94% { transform: translate(${-intensity * 4}px, ${intensity * 3}px) skew(${-intensity * 0.4}deg); }
            95% { transform: translate(${intensity * 3}px, ${-intensity * 4}px) skew(${intensity * 0.2}deg); }
            96% { transform: translate(${-intensity * 5}px, ${intensity * 2}px) skew(${-intensity * 0.3}deg); }
          }
          @keyframes cyber-hex {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.2; }
          }
          @keyframes cyber-vertical-scan {
            0% { left: -5%; }
            100% { left: 105%; }
          }
          html.theme-effect-active { 
            animation: cyber-glow 2s ease-in-out infinite, cyber-flicker 0.12s steps(1) infinite, cyber-glitch 2.5s steps(1) infinite !important; 
          }
          html.theme-effect-active *${excludePanel} {
            animation: cyber-chromatic 1.2s ease-in-out infinite !important;
          }
          html.theme-effect-active::before {
            content: '';
            position: fixed; left: 0; right: 0; height: 8px;
            background: linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 0, 128, ${intensity * 1}) 10%,
              rgba(255, 0, 255, ${intensity * 1}) 25%,
              rgba(200, 0, 255, ${intensity * 0.9}) 40%,
              rgba(0, 200, 255, ${intensity * 0.9}) 60%,
              rgba(0, 255, 255, ${intensity * 1}) 75%,
              rgba(0, 255, 200, ${intensity * 1}) 90%,
              transparent 100%
            );
            box-shadow: 
              0 0 30px rgba(255, 0, 128, ${intensity * 0.9}),
              0 0 60px rgba(0, 255, 255, ${intensity * 0.7}),
              0 0 100px rgba(255, 0, 255, ${intensity * 0.5}),
              0 0 150px rgba(0, 200, 255, ${intensity * 0.3});
            pointer-events: none; 
            z-index: 2147483645;
            animation: cyber-scan 2.5s linear infinite;
          }
          html.theme-effect-active::after {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              linear-gradient(0deg, 
                rgba(255, 0, 128, ${intensity * 0.3}) 0%, 
                rgba(255, 0, 128, ${intensity * 0.1}) 8%,
                transparent 20%, 
                transparent 80%, 
                rgba(0, 255, 255, ${intensity * 0.1}) 92%,
                rgba(0, 255, 255, ${intensity * 0.3}) 100%
              ),
              linear-gradient(90deg, 
                rgba(255, 0, 255, ${intensity * 0.25}) 0%, 
                transparent 6%, 
                transparent 94%, 
                rgba(0, 255, 255, ${intensity * 0.25}) 100%
              ),
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(0, 255, 255, ${intensity * 0.03}) 2px,
                rgba(0, 255, 255, ${intensity * 0.03}) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 3px,
                rgba(255, 0, 128, ${intensity * 0.025}) 3px,
                rgba(255, 0, 128, ${intensity * 0.025}) 6px
              );
            pointer-events: none; z-index: 2147483646;
            animation: cyber-neon-pulse 1.5s ease-in-out infinite;
          }
          body::before {
            content: '';
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: 
              radial-gradient(ellipse 60% 40% at 5% 95%, rgba(255, 0, 128, ${intensity * 0.3}) 0%, rgba(255, 0, 200, ${intensity * 0.15}) 30%, transparent 60%),
              radial-gradient(ellipse 50% 35% at 95% 5%, rgba(0, 255, 255, ${intensity * 0.3}) 0%, rgba(0, 200, 255, ${intensity * 0.15}) 30%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 50% 50%, rgba(150, 0, 255, ${intensity * 0.1}) 0%, transparent 50%),
              radial-gradient(ellipse 30% 25% at 20% 30%, rgba(255, 255, 0, ${intensity * 0.1}) 0%, transparent 40%),
              radial-gradient(ellipse 25% 20% at 80% 70%, rgba(0, 255, 150, ${intensity * 0.08}) 0%, transparent 35%);
            pointer-events: none;
            z-index: 2147483644;
            animation: cyber-hex 3s ease-in-out infinite;
          }
          body::after {
            content: '';
            position: fixed; top: 0; width: 3px; height: 100%;
            background: linear-gradient(180deg, 
              transparent 0%,
              rgba(255, 0, 255, ${intensity * 0.6}) 20%,
              rgba(0, 255, 255, ${intensity * 0.8}) 50%,
              rgba(255, 0, 128, ${intensity * 0.6}) 80%,
              transparent 100%
            );
            box-shadow: 0 0 20px rgba(0, 255, 255, ${intensity * 0.5}), 0 0 40px rgba(255, 0, 255, ${intensity * 0.3});
            pointer-events: none;
            z-index: 2147483647;
            animation: cyber-vertical-scan 4s linear infinite;
          }
        `;
        break;
    }

    styleEl.textContent = css;
  }, [mounted, effectSettings]);

  // === LSD MOUSE TRACKING EFFECT ===
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    
    // Only run for LSD effect
    if (!effectSettings.enabled || effectSettings.activeEffect !== 'lsd') {
      // Cleanup existing elements
      const cursor = document.getElementById('lsd-liquid-cursor');
      const ripple = document.getElementById('lsd-liquid-ripple');
      if (cursor) cursor.remove();
      if (ripple) ripple.remove();
      // Remove all trail particles
      document.querySelectorAll('.lsd-trail-particle').forEach(el => el.remove());
      return;
    }

    const intensity = effectSettings.intensity / 100;

    // Create liquid cursor element
    let cursor = document.getElementById('lsd-liquid-cursor') as HTMLDivElement;
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'lsd-liquid-cursor';
      document.body.appendChild(cursor);
    }

    // Create ripple element
    let ripple = document.getElementById('lsd-liquid-ripple') as HTMLDivElement;
    if (!ripple) {
      ripple = document.createElement('div');
      ripple.id = 'lsd-liquid-ripple';
      document.body.appendChild(ripple);
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let lastTrailTime = 0;
    let animationId: number;

    // Rainbow colors for particles
    const colors = [
      'rgba(255, 0, 128, 0.8)',
      'rgba(0, 255, 255, 0.8)',
      'rgba(255, 255, 0, 0.8)',
      'rgba(128, 0, 255, 0.8)',
      'rgba(0, 255, 128, 0.8)',
      'rgba(255, 128, 0, 0.8)',
    ];

    // Create trail particle
    const createTrailParticle = (x: number, y: number) => {
      const particle = document.createElement('div');
      particle.className = 'lsd-trail-particle';
      const size = Math.random() * (20 + intensity * 30) + 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, ${color} 0%, transparent 70%);
        filter: blur(${3 + intensity * 5}px);
        mix-blend-mode: screen;
      `;
      document.body.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => particle.remove(), 1000);
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Create trail particles with throttling
      const now = Date.now();
      if (now - lastTrailTime > (100 - intensity * 70)) {
        createTrailParticle(mouseX + (Math.random() - 0.5) * 30, mouseY + (Math.random() - 0.5) * 30);
        lastTrailTime = now;
      }

      // Update ripple position
      ripple.style.left = `${mouseX}px`;
      ripple.style.top = `${mouseY}px`;
    };

    // Smooth cursor animation loop
    const animateCursor = () => {
      // Smooth interpolation with liquid-like lag
      const ease = 0.08 + intensity * 0.04;
      cursorX += (mouseX - cursorX) * ease;
      cursorY += (mouseY - cursorY) * ease;

      // Add some organic wobble
      const wobbleX = Math.sin(Date.now() * 0.003) * (5 + intensity * 10);
      const wobbleY = Math.cos(Date.now() * 0.004) * (5 + intensity * 10);

      cursor.style.left = `${cursorX + wobbleX}px`;
      cursor.style.top = `${cursorY + wobbleY}px`;

      // Morphing size based on movement speed
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const size = (150 + intensity * 100) + speed * 0.5;
      cursor.style.width = `${size}px`;
      cursor.style.height = `${size}px`;

      animationId = requestAnimationFrame(animateCursor);
    };

    // Start tracking
    document.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(animateCursor);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      const cursorEl = document.getElementById('lsd-liquid-cursor');
      const rippleEl = document.getElementById('lsd-liquid-ripple');
      if (cursorEl) cursorEl.remove();
      if (rippleEl) rippleEl.remove();
      document.querySelectorAll('.lsd-trail-particle').forEach(el => el.remove());
    };
  }, [mounted, effectSettings.enabled, effectSettings.activeEffect, effectSettings.intensity]);

  const updateColorSettings = useCallback((updates: Partial<ColorOverlaySettings>) => {
    setColorSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const applyColorPreset = useCallback((presetName: string) => {
    const preset = COLOR_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setColorSettings(prev => ({ ...prev, ...preset.settings }));
    }
  }, []);

  const setEffect = useCallback((effect: EffectType) => {
    setEffectSettings(prev => ({
      ...prev,
      activeEffect: effect,
      enabled: effect !== 'none',
    }));
  }, []);

  const setEffectIntensity = useCallback((intensity: number) => {
    setEffectSettings(prev => ({ ...prev, intensity }));
  }, []);

  const toggleEffect = useCallback(() => {
    setEffectSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const resetAll = useCallback(() => {
    setColorSettings(DEFAULT_COLOR_SETTINGS);
    setEffectSettings(DEFAULT_EFFECT_SETTINGS);
  }, []);

  const renderIcon = useCallback((iconName: string): React.ReactNode => {
    const IconComponent = Icons[iconName as keyof typeof Icons];
    return IconComponent ? <IconComponent /> : null;
  }, []);

  return (
    <ThemesContext.Provider
      value={{
        colorSettings,
        updateColorSettings,
        colorPresets: COLOR_PRESETS,
        applyColorPreset,
        effectSettings,
        setEffect,
        setEffectIntensity,
        toggleEffect,
        effects: THEME_EFFECTS,
        renderIcon,
        resetAll,
      }}
    >
      {children}
    </ThemesContext.Provider>
  );
}

export function useThemes() {
  const context = useContext(ThemesContext);
  if (context === undefined) {
    throw new Error('useThemes must be used within a ThemesProvider');
  }
  return context;
}

// ============================================================================
// UNIFIED THEMES PANEL
// ============================================================================

// Effect preview styles for buttons - smooth, non-glitchy animations
const getEffectPreviewStyle = (effectId: EffectType): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  switch (effectId) {
    case 'none':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(135deg, rgba(60,60,60,0.6) 0%, rgba(40,40,40,0.6) 100%)',
      };
    case 'invert':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(135deg, #fff 0%, #fff 50%, #111 50%, #111 100%)',
        animation: 'invert-preview 3s ease-in-out infinite',
      };
    case 'lsd':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(45deg, #ff0080, #ff8c00, #ffff00, #00ff00, #00ffff, #8000ff, #ff0080)',
        backgroundSize: '300% 300%',
        animation: 'lsd-preview 4s ease infinite',
      };
    case 'weed':
      return { 
        ...baseStyle, 
        background: 'radial-gradient(circle at center, rgba(50,180,50,0.7) 0%, rgba(20,100,20,0.6) 50%, rgba(10,60,10,0.7) 100%)',
        animation: 'weed-preview 5s ease-in-out infinite',
      };
    case 'drunk':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(180deg, rgba(255,180,80,0.6) 0%, rgba(180,120,40,0.7) 100%)',
        animation: 'drunk-preview 3s ease-in-out infinite',
      };
    case 'blur':
      return { 
        ...baseStyle, 
        background: 'radial-gradient(circle at center, rgba(200,200,220,0.5) 0%, rgba(120,120,140,0.4) 50%, rgba(60,60,80,0.5) 100%)',
        animation: 'blur-preview 4s ease-in-out infinite',
      };
    case 'glitch':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(180deg, rgba(255,0,100,0.4) 0%, rgba(20,20,30,0.9) 50%, rgba(0,200,255,0.4) 100%)',
        animation: 'glitch-preview 3s ease-in-out infinite',
      };
    case 'vaporwave':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(180deg, #ff71ce 0%, #01cdfe 33%, #b967ff 66%, #fffb96 100%)',
        backgroundSize: '100% 200%',
        animation: 'vaporwave-preview 5s ease-in-out infinite',
      };
    case 'matrix':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(180deg, rgba(0,30,0,0.95) 0%, rgba(0,60,0,0.9) 100%)',
        boxShadow: 'inset 0 0 15px rgba(0,255,0,0.4)',
        animation: 'matrix-preview 2s ease-in-out infinite',
      };
    case 'nightvision':
      return { 
        ...baseStyle, 
        background: 'radial-gradient(circle at center, rgba(0,255,0,0.35) 0%, rgba(0,120,0,0.5) 60%, rgba(0,40,0,0.7) 100%)',
        animation: 'nightvision-preview 3s ease-in-out infinite',
      };
    case 'thermal':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(180deg, #ff3300 0%, #ff8800 25%, #ffee00 50%, #44ff00 75%, #0066ff 100%)',
        backgroundSize: '100% 200%',
        animation: 'thermal-preview 4s ease-in-out infinite',
      };
    case 'sepia':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(135deg, rgba(140,90,40,0.7) 0%, rgba(200,160,100,0.6) 50%, rgba(100,60,20,0.7) 100%)',
        animation: 'sepia-preview 5s ease-in-out infinite',
      };
    case 'cyberpunk':
      return { 
        ...baseStyle, 
        background: 'linear-gradient(135deg, rgba(255,0,128,0.6) 0%, rgba(20,20,50,0.8) 50%, rgba(0,255,255,0.6) 100%)',
        animation: 'cyberpunk-preview 3s ease-in-out infinite',
      };
    default:
      return baseStyle;
  }
};

export function ThemesPanel() {
  const {
    colorSettings,
    updateColorSettings,
    colorPresets,
    applyColorPreset,
    effectSettings,
    setEffect,
    setEffectIntensity,
    toggleEffect,
    effects,
    renderIcon,
    resetAll,
  } = useThemes();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'effects' | 'colors'>('effects');
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [originalColorEnabled, setOriginalColorEnabled] = useState(false);
  
  // Track saved effect vs preview effect
  const [savedEffect, setSavedEffect] = useState<EffectType>(effectSettings.activeEffect);
  const [hasUnsavedEffect, setHasUnsavedEffect] = useState(false);
  
  // Use refs to track state
  const savedEffectRef = useRef<EffectType>(effectSettings.activeEffect);
  const selectedEffectRef = useRef<EffectType>(effectSettings.activeEffect);
  
  const currentEffect = effects.find(e => e.id === effectSettings.activeEffect);
  const isAnyActive = colorSettings.enabled || effectSettings.enabled;

  // Sync refs with state
  useEffect(() => {
    savedEffectRef.current = savedEffect;
  }, [savedEffect]);

  // Sync saved effect with actual effect settings on mount
  useEffect(() => {
    if (effectSettings.enabled && effectSettings.activeEffect !== 'none') {
      setSavedEffect(effectSettings.activeEffect);
      savedEffectRef.current = effectSettings.activeEffect;
      selectedEffectRef.current = effectSettings.activeEffect;
    }
  }, []);

  // Select effect - applies preview immediately on click
  const handleEffectSelect = useCallback((effectId: EffectType) => {
    selectedEffectRef.current = effectId;
    setEffect(effectId);
    setHasUnsavedEffect(effectId !== savedEffectRef.current);
  }, [setEffect]);

  // Save the current effect
  const handleSaveEffect = useCallback(() => {
    const currentEffect = effectSettings.activeEffect;
    setSavedEffect(currentEffect);
    savedEffectRef.current = currentEffect;
    selectedEffectRef.current = currentEffect;
    setHasUnsavedEffect(false);
  }, [effectSettings.activeEffect]);

  // Reset to none
  const handleResetEffect = useCallback(() => {
    setEffect('none');
    setSavedEffect('none');
    savedEffectRef.current = 'none';
    selectedEffectRef.current = 'none';
    setHasUnsavedEffect(false);
  }, [setEffect]);

  // Preview color on hover/tap
  const handleColorPreview = (color: string) => {
    setOriginalColorEnabled(colorSettings.enabled);
    setPreviewColor(color);
    updateColorSettings({ enabled: true, tintColor: color });
  };

  const handleColorPreviewEnd = () => {
    if (previewColor !== null && !originalColorEnabled) {
      updateColorSettings({ enabled: false });
    }
    setPreviewColor(null);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className="themes-panel-isolated"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          top: 80,
          right: 12,
          zIndex: 100000,
          height: 36,
          padding: '0 12px',
          borderRadius: 18,
          background: isAnyActive 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(0, 0, 0, 0.85)',
          border: isAnyActive ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)',
          color: isAnyActive ? '#000' : '#fff',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          isolation: 'isolate',
          filter: 'none',
          transform: 'translateZ(0)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}
        title="Themes & Effects"
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {effectSettings.enabled && currentEffect ? renderIcon(currentEffect.icon) : <Icons.palette />}
        </span>
        <span className="themes-btn-text">Themes</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="themes-panel themes-panel-isolated"
          style={{
            position: 'fixed',
            top: 126,
            right: 12,
            zIndex: 100000,
            width: 'min(90vw, 340px)',
            maxWidth: '100%',
            maxHeight: '70vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'rgba(0, 0, 0, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            // Isolate from parent effects
            isolation: 'isolate',
            transform: 'translateZ(0)',
            willChange: 'auto',
            filter: 'none',
            contain: 'layout style paint',
            boxSizing: 'border-box',
          }}
        >
          {/* Responsive Styles */}
          <style>{`
            /* Isolate themes panel from all effects */
            .themes-panel-isolated,
            .themes-panel-isolated * {
              filter: none !important;
              transform: none !important;
              animation: none !important;
              text-shadow: none !important;
            }
            .themes-panel-isolated .themes-effect-btn {
              transform: none !important;
            }
            .themes-panel-isolated .themes-effect-btn > div:first-child {
              animation: var(--preview-animation) !important;
            }
            /* Re-enable preview animations only for preview backgrounds */
            .themes-panel-isolated [data-preview-bg] {
              animation: var(--preview-animation) !important;
            }
            /* Smooth preview animations - no glitchy effects */
            @keyframes lsd-preview {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes invert-preview {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            @keyframes weed-preview {
              0%, 100% { opacity: 0.9; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.02); }
            }
            @keyframes drunk-preview {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-1deg); }
              75% { transform: rotate(1deg); }
            }
            @keyframes blur-preview {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 1; }
            }
            @keyframes glitch-preview {
              0%, 100% { opacity: 1; filter: hue-rotate(0deg); }
              33% { opacity: 0.9; filter: hue-rotate(60deg); }
              66% { opacity: 1; filter: hue-rotate(-60deg); }
            }
            @keyframes vaporwave-preview {
              0%, 100% { background-position: 0% 0%; }
              50% { background-position: 0% 100%; }
            }
            @keyframes matrix-preview {
              0%, 100% { box-shadow: inset 0 0 15px rgba(0,255,0,0.3); }
              50% { box-shadow: inset 0 0 25px rgba(0,255,0,0.6); }
            }
            @keyframes nightvision-preview {
              0%, 100% { opacity: 0.9; }
              50% { opacity: 1; }
            }
            @keyframes thermal-preview {
              0%, 100% { background-position: 0% 0%; }
              50% { background-position: 0% 100%; }
            }
            @keyframes sepia-preview {
              0%, 100% { opacity: 0.9; }
              50% { opacity: 1; }
            }
            @keyframes cyberpunk-preview {
              0%, 100% { 
                box-shadow: inset 0 0 15px rgba(255,0,128,0.4), inset 0 0 15px rgba(0,255,255,0.3);
              }
              50% { 
                box-shadow: inset 0 0 20px rgba(255,0,128,0.6), inset 0 0 20px rgba(0,255,255,0.5);
              }
            }
            /* Prevent overflow in all panel containers */
            .themes-panel {
              box-sizing: border-box !important;
            }
            .themes-panel > div {
              box-sizing: border-box !important;
              max-width: 100% !important;
            }
            .themes-panel * {
              box-sizing: border-box !important;
            }
            @media (min-width: 768px) {
              .themes-panel {
                width: 340px !important;
                max-height: 80vh !important;
                right: 20px !important;
                top: 130px !important;
              }
              .themes-btn-text {
                display: inline !important;
              }
              .themes-grid {
                grid-template-columns: repeat(4, 1fr) !important;
              }
              .themes-effect-btn {
                padding: 14px 6px 8px 6px !important;
                font-size: 10px !important;
                min-height: 80px !important;
              }
              .themes-effect-icon {
                font-size: 20px !important;
              }
            }
            @media (max-width: 767px) {
              .themes-panel {
                width: calc(100vw - 24px) !important;
                max-width: 320px !important;
                right: 12px !important;
              }
              .themes-btn-text {
                display: none !important;
              }
              .themes-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
              .themes-effect-btn {
                padding: 12px 4px 6px 4px !important;
                font-size: 9px !important;
                min-height: 65px !important;
              }
              .themes-effect-icon {
                font-size: 16px !important;
              }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.palette />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                Themes & Effects
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                color: '#fff', 
                cursor: 'pointer',
                width: 26,
                height: 26,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icons.close />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {(['effects', 'colors'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #fff' : '2px solid transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {tab === 'effects' ? <><Icons.effects /> Effects</> : <><Icons.colors /> Colors</>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: 12 }}>
            {activeTab === 'effects' && (
              <>
                {/* Current Effect Display */}
                {effectSettings.enabled && currentEffect && currentEffect.id !== 'none' && (
                  <div style={{
                    padding: '10px 12px',
                    marginBottom: 12,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{renderIcon(currentEffect.icon)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{currentEffect.name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>{currentEffect.description}</div>
                    </div>
                    <button
                      onClick={toggleEffect}
                      style={{
                        padding: '5px 10px',
                        fontSize: 10,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      Off
                    </button>
                  </div>
                )}

                {/* Intensity Slider */}
                {effectSettings.activeEffect !== 'none' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ 
                      fontSize: 10, 
                      color: 'rgba(255,255,255,0.6)', 
                      marginBottom: 6, 
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>Intensity</span>
                      <span style={{ color: '#fff' }}>{effectSettings.intensity}%</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={effectSettings.intensity}
                      onChange={e => setEffectIntensity(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#fff', height: 4 }}
                    />
                  </div>
                )}

                {/* Effects Grid */}
                <div 
                  className="themes-grid"
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: 6,
                  }}
                >
                  {effects.map(effect => {
                    const isActive = effectSettings.activeEffect === effect.id && effectSettings.enabled;
                    const isSaved = savedEffect === effect.id;
                    return (
                      <button
                        key={effect.id}
                        onClick={() => handleEffectSelect(effect.id)}
                        className="themes-effect-btn"
                        style={{
                          position: 'relative',
                          padding: '14px 4px 8px 4px',
                          fontSize: 9,
                          borderRadius: 8,
                          border: '2px solid',
                          borderColor: isActive ? '#fff' : isSaved ? 'rgba(0,255,0,0.5)' : 'rgba(255,255,255,0.2)',
                          background: 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 4,
                          transition: 'all 0.2s ease',
                          overflow: 'hidden',
                          minHeight: 70,
                        }}
                      >
                        {/* Effect Preview Background */}
                        <div style={getEffectPreviewStyle(effect.id)} />
                        
                        {/* Content overlay */}
                        <div style={{
                          position: 'relative',
                          zIndex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 3,
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        }}>
                          <span className="themes-effect-icon" style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                          }}>
                            {renderIcon(effect.icon)}
                          </span>
                          <span style={{ 
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 9,
                            letterSpacing: '0.3px',
                          }}>
                            {effect.name}
                          </span>
                        </div>

                        {/* Saved indicator */}
                        {isSaved && effect.id !== 'none' && (
                          <div style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#00ff00',
                            boxShadow: '0 0 6px #00ff00',
                          }} />
                        )}

                        {/* Currently previewing indicator */}
                        {isActive && !isSaved && effect.id !== 'none' && (
                          <div style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#ffaa00',
                            boxShadow: '0 0 6px #ffaa00',
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Save & Reset Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <button
                    onClick={handleSaveEffect}
                    disabled={!hasUnsavedEffect && effectSettings.activeEffect === savedEffect}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      background: hasUnsavedEffect ? 'linear-gradient(135deg, #00cc66 0%, #009944 100%)' : 'rgba(255,255,255,0.1)',
                      color: hasUnsavedEffect ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: hasUnsavedEffect ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Save Effect
                  </button>
                  <button
                    onClick={handleResetEffect}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: 11,
                      fontWeight: 500,
                      borderRadius: 8,
                      border: '1px solid rgba(255,100,100,0.4)',
                      background: 'rgba(255,50,50,0.1)',
                      color: '#ff6666',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icons.reset />
                    Reset
                  </button>
                </div>
              </>
            )}

            {activeTab === 'colors' && (
              <>
                {/* Enhanced ON/OFF Toggle with Glow */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: colorSettings.enabled 
                    ? `linear-gradient(145deg, ${colorSettings.tintColor}15, transparent)`
                    : 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(0,0,0,0.1))',
                  border: colorSettings.enabled 
                    ? `1px solid ${colorSettings.tintColor}40`
                    : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.3s ease',
                }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block' }}>Color Overlay</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                      {colorSettings.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    onClick={() => updateColorSettings({ enabled: !colorSettings.enabled })}
                    style={{
                      position: 'relative',
                      width: 52,
                      height: 28,
                      borderRadius: 14,
                      border: 'none',
                      background: colorSettings.enabled 
                        ? `linear-gradient(135deg, ${colorSettings.tintColor}, ${colorSettings.tintColor}aa)` 
                        : 'rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      padding: 0,
                      boxShadow: colorSettings.enabled 
                        ? `0 0 20px ${colorSettings.tintColor}50, inset 0 2px 4px rgba(255,255,255,0.2)` 
                        : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: colorSettings.enabled ? 26 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: colorSettings.enabled 
                          ? `0 2px 8px rgba(0,0,0,0.3), 0 0 10px ${colorSettings.tintColor}` 
                          : '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {colorSettings.enabled && (
                        <span style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: colorSettings.tintColor,
                          boxShadow: `0 0 6px ${colorSettings.tintColor}`,
                        }} />
                      )}
                    </span>
                  </button>
                </div>

                {/* Mode Selector - Enhanced */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    fontSize: 9, 
                    color: 'rgba(255,255,255,0.4)', 
                    marginBottom: 8, 
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>
                    Blend Mode
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 6,
                    padding: 4,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.2)',
                  }}>
                    {([
                      { mode: 'tint' as const, desc: 'Solid color blend' },
                      { mode: 'hue-shift' as const, desc: 'Rainbow shift' },
                      { mode: 'neon' as const, desc: 'Glowing neon' },
                      { mode: 'duotone' as const, desc: 'Two-tone gradient' },
                    ]).map(({ mode }) => (
                      <button
                        key={mode}
                        onClick={() => updateColorSettings({ mode })}
                        style={{
                          padding: '10px 4px',
                          fontSize: 9,
                          borderRadius: 8,
                          border: colorSettings.mode === mode ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                          background: colorSettings.mode === mode 
                            ? 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))' 
                            : 'transparent',
                          color: colorSettings.mode === mode ? '#fff' : 'rgba(255,255,255,0.6)',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: colorSettings.mode === mode 
                            ? '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
                            : 'none',
                        }}
                        onMouseOver={e => {
                          if (colorSettings.mode !== mode) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseOut={e => {
                          if (colorSettings.mode !== mode) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                          }
                        }}
                      >
                        <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {mode === 'tint' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                            </svg>
                          )}
                          {mode === 'hue-shift' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9"/>
                              <path d="M12 3v18M3 12h18" strokeOpacity="0.3"/>
                              <circle cx="12" cy="12" r="5" strokeDasharray="3 2"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            </svg>
                          )}
                          {mode === 'neon' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                              <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" strokeWidth="1.5"/>
                            </svg>
                          )}
                          {mode === 'duotone' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9"/>
                              <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" fillOpacity="0.4"/>
                            </svg>
                          )}
                        </span>
                        <span>{mode.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🎨 ULTRA IMPRESSIVE COLOR PICKER */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    fontSize: 9, 
                    color: 'rgba(255,255,255,0.4)', 
                    marginBottom: 8, 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor"/>
                      <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor"/>
                      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor"/>
                      <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor"/>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.14-.76-.4-1.06-.25-.3-.4-.67-.4-1.06 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/>
                    </svg>
                    {colorSettings.mode === 'tint' ? 'Tint Color' :
                     colorSettings.mode === 'hue-shift' ? 'Hue Shift Color' :
                     colorSettings.mode === 'neon' ? 'Neon Color' :
                     'Duotone Color'}
                  </label>
                  
                  {/* Main Color Picker Area */}
                  <div style={{ 
                    padding: '16px',
                    borderRadius: 20,
                    background: 'linear-gradient(165deg, rgba(255,255,255,0.05), rgba(0,0,0,0.35))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden',
                    margin: '0 auto 16px auto',
                    boxSizing: 'border-box',
                    width: 'calc(100% - 24px)',
                  }}>
                    {/* Animated background glow */}
                    <div style={{
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: colorSettings.mode === 'tint' ? colorSettings.tintColor :
                        colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                        colorSettings.mode === 'neon' ? colorSettings.neonColor :
                        colorSettings.duotoneColor,
                      filter: 'blur(60px)',
                      opacity: 0.15,
                      animation: 'ambient-float 6s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                    
                    {/* Color Spectrum Bar with Marker */}
                    <div style={{ marginBottom: 20, position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{
                        height: 40,
                        borderRadius: 12,
                        background: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.1)',
                        cursor: 'crosshair',
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const hue = Math.round(x * 360);
                        const color = `hsl(${hue}, 100%, 50%)`;
                        const tempEl = document.createElement('div');
                        tempEl.style.color = color;
                        document.body.appendChild(tempEl);
                        const computed = getComputedStyle(tempEl).color;
                        document.body.removeChild(tempEl);
                        const match = computed.match(/\d+/g);
                        if (match) {
                          const hex = '#' + match.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
                          const colorKey = 
                            colorSettings.mode === 'tint' ? 'tintColor' :
                            colorSettings.mode === 'hue-shift' ? 'hueShiftColor' :
                            colorSettings.mode === 'neon' ? 'neonColor' :
                            'duotoneColor';
                          updateColorSettings({ [colorKey]: hex, enabled: true });
                        }
                      }}
                      >
                        {/* Shimmer effect */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '200%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                          animation: 'spectrum-shimmer 4s ease-in-out infinite',
                          borderRadius: 12,
                        }} />
                        {/* Glass reflection */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)',
                          borderRadius: '12px 12px 0 0',
                          pointerEvents: 'none',
                        }} />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginTop: 6,
                        padding: '0 4px',
                      }}>
                        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>0°</span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>Click to pick hue</span>
                        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>360°</span>
                      </div>
                    </div>

                    {/* Saturation & Brightness 2D Picker */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 12,
                        position: 'relative',
                        cursor: 'crosshair',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)',
                        background: (() => {
                          const hex = colorSettings.mode === 'tint' ? colorSettings.tintColor :
                            colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                            colorSettings.mode === 'neon' ? colorSettings.neonColor :
                            colorSettings.duotoneColor;
                          // Extract hue from current color
                          const r = parseInt(hex.slice(1, 3), 16) / 255;
                          const g = parseInt(hex.slice(3, 5), 16) / 255;
                          const b = parseInt(hex.slice(5, 7), 16) / 255;
                          const max = Math.max(r, g, b), min = Math.min(r, g, b);
                          let h = 0;
                          if (max !== min) {
                            const d = max - min;
                            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                            else if (max === g) h = ((b - r) / d + 2) / 6;
                            else h = ((r - g) / d + 4) / 6;
                          }
                          return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${Math.round(h * 360)}, 100%, 50%))`;
                        })(),
                      }}
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                        const saturation = Math.round(x * 100);
                        const brightness = Math.round((1 - y) * 100);
                        // Get current hue
                        const hex = colorSettings.mode === 'tint' ? colorSettings.tintColor :
                          colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                          colorSettings.mode === 'neon' ? colorSettings.neonColor :
                          colorSettings.duotoneColor;
                        const r = parseInt(hex.slice(1, 3), 16) / 255;
                        const g = parseInt(hex.slice(3, 5), 16) / 255;
                        const b = parseInt(hex.slice(5, 7), 16) / 255;
                        const max = Math.max(r, g, b), min = Math.min(r, g, b);
                        let h = 0;
                        if (max !== min) {
                          const d = max - min;
                          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                          else if (max === g) h = ((b - r) / d + 2) / 6;
                          else h = ((r - g) / d + 4) / 6;
                        }
                        // HSB to RGB
                        const hue = h * 360;
                        const sat = saturation / 100;
                        const val = brightness / 100;
                        const c = val * sat;
                        const x2 = c * (1 - Math.abs((hue / 60) % 2 - 1));
                        const m = val - c;
                        let r2 = 0, g2 = 0, b2 = 0;
                        if (hue < 60) { r2 = c; g2 = x2; }
                        else if (hue < 120) { r2 = x2; g2 = c; }
                        else if (hue < 180) { g2 = c; b2 = x2; }
                        else if (hue < 240) { g2 = x2; b2 = c; }
                        else if (hue < 300) { r2 = x2; b2 = c; }
                        else { r2 = c; b2 = x2; }
                        const newHex = '#' + [r2 + m, g2 + m, b2 + m].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
                        const colorKey = 
                          colorSettings.mode === 'tint' ? 'tintColor' :
                          colorSettings.mode === 'hue-shift' ? 'hueShiftColor' :
                          colorSettings.mode === 'neon' ? 'neonColor' :
                          'duotoneColor';
                        updateColorSettings({ [colorKey]: newHex, enabled: true });
                      }}
                      >
                        {/* Crosshair indicator */}
                        <div style={{
                          position: 'absolute',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '2px solid white',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          top: '30%',
                          left: '70%',
                        }} />
                      </div>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block', textAlign: 'center' }}>
                        Saturation & Brightness
                      </span>
                    </div>

                    {/* Current Color Display & Picker */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 16, 
                      marginBottom: 20,
                      padding: 16,
                      borderRadius: 16,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}>
                      {/* Large Color Preview with Animated Border */}
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: 80,
                          height: 80,
                          borderRadius: 20,
                          padding: 3,
                          background: `conic-gradient(from 0deg, 
                            ${colorSettings.mode === 'tint' ? colorSettings.tintColor :
                              colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                              colorSettings.mode === 'neon' ? colorSettings.neonColor :
                              colorSettings.duotoneColor}, 
                            rgba(255,255,255,0.4), 
                            ${colorSettings.mode === 'tint' ? colorSettings.tintColor :
                              colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                              colorSettings.mode === 'neon' ? colorSettings.neonColor :
                              colorSettings.duotoneColor})`,
                          animation: 'border-spin 3s linear infinite',
                          boxShadow: `0 0 30px ${
                            colorSettings.mode === 'tint' ? colorSettings.tintColor :
                            colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                            colorSettings.mode === 'neon' ? colorSettings.neonColor :
                            colorSettings.duotoneColor
                          }40`,
                        }}>
                          <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 17,
                            background: '#0a0a0a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}>
                            <input
                              type="color"
                              value={
                                colorSettings.mode === 'tint' ? colorSettings.tintColor :
                                colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                                colorSettings.mode === 'neon' ? colorSettings.neonColor :
                                colorSettings.duotoneColor
                              }
                              onChange={e => {
                                const colorKey = 
                                  colorSettings.mode === 'tint' ? 'tintColor' :
                                  colorSettings.mode === 'hue-shift' ? 'hueShiftColor' :
                                  colorSettings.mode === 'neon' ? 'neonColor' :
                                  'duotoneColor';
                                updateColorSettings({ [colorKey]: e.target.value });
                              }}
                              style={{ 
                                width: 64, 
                                height: 64, 
                                border: 'none', 
                                borderRadius: 14, 
                                cursor: 'pointer',
                                background: 'transparent',
                              }}
                            />
                          </div>
                        </div>
                        {/* Outer glow */}
                        <div style={{
                          position: 'absolute',
                          top: -12,
                          left: -12,
                          right: -12,
                          bottom: -12,
                          borderRadius: 28,
                          background: `radial-gradient(circle, ${
                            colorSettings.mode === 'tint' ? colorSettings.tintColor :
                            colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                            colorSettings.mode === 'neon' ? colorSettings.neonColor :
                            colorSettings.duotoneColor
                          }60, transparent 70%)`,
                          filter: 'blur(16px)',
                          opacity: 0.5,
                          zIndex: -1,
                          animation: 'glow-breathe 2s ease-in-out infinite',
                        }} />
                      </div>
                      
                      {/* Hex Input & RGB Display */}
                      <div style={{ 
                        flex: 1, 
                        minWidth: 0,
                        overflow: 'hidden',
                      }}>
                        {/* Hex Input */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
                          border: `2px solid ${
                            colorSettings.mode === 'tint' ? colorSettings.tintColor :
                            colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                            colorSettings.mode === 'neon' ? colorSettings.neonColor :
                            colorSettings.duotoneColor
                          }40`,
                          marginBottom: 8,
                          boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                          boxSizing: 'border-box',
                          width: '100%',
                          minWidth: 0,
                        }}>
                          <span style={{ 
                            color: colorSettings.mode === 'tint' ? colorSettings.tintColor :
                              colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                              colorSettings.mode === 'neon' ? colorSettings.neonColor :
                              colorSettings.duotoneColor, 
                            fontSize: 18,
                            fontWeight: 800,
                            textShadow: `0 0 15px ${
                              colorSettings.mode === 'tint' ? colorSettings.tintColor :
                              colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                              colorSettings.mode === 'neon' ? colorSettings.neonColor :
                              colorSettings.duotoneColor
                            }`,
                          }}>#</span>
                          <input
                            type="text"
                            value={(
                              colorSettings.mode === 'tint' ? colorSettings.tintColor :
                              colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                              colorSettings.mode === 'neon' ? colorSettings.neonColor :
                              colorSettings.duotoneColor
                            ).replace('#', '')}
                            onChange={e => {
                              const colorKey = 
                                colorSettings.mode === 'tint' ? 'tintColor' :
                                colorSettings.mode === 'hue-shift' ? 'hueShiftColor' :
                                colorSettings.mode === 'neon' ? 'neonColor' :
                                'duotoneColor';
                              const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                              updateColorSettings({ [colorKey]: `#${value}` });
                            }}
                            maxLength={6}
                            style={{
                              minWidth: 0,
                              flex: 1,
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              fontSize: 16,
                              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                              fontWeight: 700,
                              letterSpacing: 2,
                              textTransform: 'uppercase',
                              outline: 'none',
                            }}
                          />
                          {/* Copy button */}
                          <button
                            onClick={() => {
                              const color = colorSettings.mode === 'tint' ? colorSettings.tintColor :
                                colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                                colorSettings.mode === 'neon' ? colorSettings.neonColor :
                                colorSettings.duotoneColor;
                              navigator.clipboard.writeText(color);
                            }}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: 'none',
                              background: 'rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.6)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        </div>
                        
                        {/* RGB Values Display */}
                        <div style={{ display: 'flex', gap: 4, boxSizing: 'border-box', width: '100%' }}>
                          {(() => {
                            const hex = colorSettings.mode === 'tint' ? colorSettings.tintColor :
                              colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                              colorSettings.mode === 'neon' ? colorSettings.neonColor :
                              colorSettings.duotoneColor;
                            const r = parseInt(hex.slice(1, 3), 16) || 0;
                            const g = parseInt(hex.slice(3, 5), 16) || 0;
                            const b = parseInt(hex.slice(5, 7), 16) || 0;
                            return [
                              { label: 'R', value: r, color: '#ff4444', gradient: 'linear-gradient(135deg, #ff4444, #ff6666)' },
                              { label: 'G', value: g, color: '#44ff44', gradient: 'linear-gradient(135deg, #44ff44, #66ff66)' },
                              { label: 'B', value: b, color: '#4488ff', gradient: 'linear-gradient(135deg, #4488ff, #66aaff)' },
                            ].map(({ label, value, color, gradient }) => (
                              <div key={label} style={{
                                flex: 1,
                                minWidth: 0,
                                padding: '6px 8px',
                                borderRadius: 8,
                                background: `${color}12`,
                                border: `1px solid ${color}25`,
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: `${(value / 255) * 100}%`,
                                  background: gradient,
                                  opacity: 0.15,
                                  transition: 'height 0.3s ease',
                                }} />
                                <span style={{ fontSize: 8, color: color, display: 'block', fontWeight: 700, position: 'relative' }}>{label}</span>
                                <span style={{ fontSize: 11, color: '#fff', fontFamily: 'monospace', fontWeight: 600, position: 'relative' }}>{value}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Quick Colors Grid - Enhanced */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 10,
                      }}>
                        <span style={{ 
                          fontSize: 9, 
                          color: 'rgba(255,255,255,0.4)', 
                          textTransform: 'uppercase', 
                          letterSpacing: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                          </svg>
                          Color Palette
                        </span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>20 colors</span>
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(10, 1fr)', 
                        gap: 5,
                        padding: 8,
                        borderRadius: 12,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxSizing: 'border-box',
                        width: '100%',
                      }}>
                        {[
                          '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
                          '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93',
                          '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4',
                          '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
                        ].map((color, i) => (
                          <button
                            key={color + i}
                            onClick={() => {
                              const colorKey = 
                                colorSettings.mode === 'tint' ? 'tintColor' :
                                colorSettings.mode === 'hue-shift' ? 'hueShiftColor' :
                                colorSettings.mode === 'neon' ? 'neonColor' :
                                'duotoneColor';
                              updateColorSettings({ [colorKey]: color, enabled: true });
                            }}
                            style={{
                              aspectRatio: '1',
                              borderRadius: 8,
                              border: '2px solid transparent',
                              background: color,
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: `0 3px 8px ${color}35`,
                              position: 'relative',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.25) translateY(-3px)';
                              e.currentTarget.style.zIndex = '10';
                              e.currentTarget.style.boxShadow = `0 8px 20px ${color}60`;
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.zIndex = '1';
                              e.currentTarget.style.boxShadow = `0 3px 8px ${color}35`;
                              e.currentTarget.style.borderColor = 'transparent';
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Neon Spectrum Bar - Enhanced */}
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 10,
                      }}>
                        <span style={{ 
                          fontSize: 9, 
                          color: 'rgba(255,255,255,0.4)', 
                          textTransform: 'uppercase', 
                          letterSpacing: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                          </svg>
                          Neon Glow
                        </span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>6 vibrant</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: 6, 
                        height: 36,
                        padding: 4,
                        borderRadius: 12,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxSizing: 'border-box',
                        width: '100%',
                      }}>
                        {[
                          { color: '#00FF87', name: 'Matrix' },
                          { color: '#FF00FF', name: 'Magenta' },
                          { color: '#00FFFF', name: 'Cyan' },
                          { color: '#FFFF00', name: 'Yellow' },
                          { color: '#FF3366', name: 'Hot Pink' },
                          { color: '#33FF99', name: 'Mint' },
                        ].map((swatch) => (
                          <button
                            key={swatch.color}
                            title={swatch.name}
                            onClick={() => {
                              const colorKey = 
                                colorSettings.mode === 'tint' ? 'tintColor' :
                                colorSettings.mode === 'hue-shift' ? 'hueShiftColor' :
                                colorSettings.mode === 'neon' ? 'neonColor' :
                                'duotoneColor';
                              updateColorSettings({ [colorKey]: swatch.color, enabled: true });
                            }}
                            style={{
                              flex: 1,
                              borderRadius: 8,
                              border: 'none',
                              background: `linear-gradient(180deg, ${swatch.color}ee, ${swatch.color}88)`,
                              cursor: 'pointer',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: `0 0 20px ${swatch.color}50, inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scaleY(1.5) scaleX(1.1)';
                              e.currentTarget.style.boxShadow = `0 0 35px ${swatch.color}80, 0 0 60px ${swatch.color}40`;
                              e.currentTarget.style.zIndex = '10';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                              e.currentTarget.style.boxShadow = `0 0 20px ${swatch.color}50, inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.2)`;
                              e.currentTarget.style.zIndex = '1';
                            }}
                          >
                            {/* Inner glow line */}
                            <div style={{
                              position: 'absolute',
                              top: 2,
                              left: '15%',
                              right: '15%',
                              height: 2,
                              borderRadius: 1,
                              background: 'rgba(255,255,255,0.5)',
                            }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CSS Animations for Color Picker */}
                  <style>{`
                    @keyframes border-spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                    @keyframes glow-breathe {
                      0%, 100% { opacity: 0.35; transform: scale(1); }
                      50% { opacity: 0.55; transform: scale(1.1); }
                    }
                    @keyframes spectrum-shimmer {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(50%); }
                    }
                    @keyframes swatch-pop {
                      0% { opacity: 0; transform: scale(0.5); }
                      100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes ambient-float {
                      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
                      25% { transform: translate(-20px, 10px) scale(1.1); opacity: 0.2; }
                      50% { transform: translate(10px, -15px) scale(0.95); opacity: 0.18; }
                      75% { transform: translate(-10px, 5px) scale(1.05); opacity: 0.22; }
                    }
                    @keyframes pulse-ring {
                      0% { transform: scale(0.95); opacity: 0.8; }
                      50% { transform: scale(1.05); opacity: 1; }
                      100% { transform: scale(0.95); opacity: 0.8; }
                    }
                  `}</style>
                </div>

                {/* Hue Rotate */}
                {colorSettings.mode === 'hue-shift' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Hue Rotate</span>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: '#fff',
                        background: `linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>{colorSettings.hueRotate}°</span>
                    </label>
                    <div style={{ position: 'relative', height: 20 }}>
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 0,
                        right: 0,
                        height: 4,
                        borderRadius: 2,
                        background: 'linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                      }} />
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={colorSettings.hueRotate}
                        onChange={e => updateColorSettings({ hueRotate: parseInt(e.target.value) })}
                        style={{ 
                          width: '100%', 
                          height: 20,
                          background: 'transparent',
                          cursor: 'pointer',
                          WebkitAppearance: 'none',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Intensity Slider with Glow */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Intensity</span>
                    <span style={{ 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#fff',
                      textShadow: colorSettings.enabled ? `0 0 10px ${colorSettings.tintColor}` : 'none',
                    }}>{colorSettings.intensity}%</span>
                  </label>
                  <div style={{ position: 'relative', height: 20 }}>
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 0,
                      width: `${colorSettings.intensity}%`,
                      height: 4,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, rgba(255,255,255,0.2), ${
                        colorSettings.mode === 'tint' ? colorSettings.tintColor :
                        colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                        colorSettings.mode === 'neon' ? colorSettings.neonColor :
                        colorSettings.duotoneColor
                      })`,
                      boxShadow: `0 0 10px ${
                        colorSettings.mode === 'tint' ? colorSettings.tintColor :
                        colorSettings.mode === 'hue-shift' ? colorSettings.hueShiftColor :
                        colorSettings.mode === 'neon' ? colorSettings.neonColor :
                        colorSettings.duotoneColor
                      }60`,
                      transition: 'width 0.1s ease',
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 0,
                      right: 0,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.1)',
                      zIndex: -1,
                    }} />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={colorSettings.intensity}
                      onChange={e => updateColorSettings({ intensity: parseInt(e.target.value) })}
                      style={{ 
                        width: '100%', 
                        height: 20,
                        background: 'transparent',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    />
                  </div>
                </div>

                {/* Enhanced Quick Presets */}
                <div style={{ 
                  padding: 12, 
                  borderRadius: 10, 
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.15))',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <label style={{ 
                    fontSize: 9, 
                    color: 'rgba(255,255,255,0.4)', 
                    marginBottom: 10, 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
                    </svg>
                    Theme Presets
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {colorPresets.map((preset, i) => (
                      <button
                        key={preset.name}
                        onClick={() => applyColorPreset(preset.name)}
                        onMouseEnter={() => preset.settings.tintColor && handleColorPreview(preset.settings.tintColor)}
                        onMouseLeave={handleColorPreviewEnd}
                        onTouchStart={() => preset.settings.tintColor && handleColorPreview(preset.settings.tintColor)}
                        onTouchEnd={handleColorPreviewEnd}
                        style={{
                          padding: '8px 6px',
                          fontSize: 9,
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: `linear-gradient(145deg, ${preset.settings.tintColor || '#333'}15, transparent)`,
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.borderColor = preset.settings.tintColor || '#fff';
                          e.currentTarget.style.boxShadow = `0 4px 15px ${preset.settings.tintColor || '#fff'}30`;
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: preset.settings.tintColor || '#fff',
                          boxShadow: `0 0 6px ${preset.settings.tintColor || '#fff'}`,
                        }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reset Button */}
            <button
              onClick={resetAll}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '8px 12px',
                fontSize: 11,
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icons.reset /> Reset All
            </button>
          </div>
        </div>
      )}
    </>
  );
}
