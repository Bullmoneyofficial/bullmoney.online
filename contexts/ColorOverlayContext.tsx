'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================================
// GLOBAL COLOR OVERLAY SYSTEM
// Transforms all whites/lights in the app to any color dynamically
// Uses CSS filters + blend modes for real-time color shifting
// ============================================================================

interface ColorOverlaySettings {
  enabled: boolean;
  tintColor: string; // hex color for tint
  intensity: number; // 0-100
  mode: 'tint' | 'hue-shift' | 'duotone' | 'neon';
  hueRotate: number; // 0-360 degrees
  saturation: number; // 0-200
  brightness: number; // 50-150
}

interface ColorOverlayContextType {
  settings: ColorOverlaySettings;
  updateSettings: (updates: Partial<ColorOverlaySettings>) => void;
  resetSettings: () => void;
  presets: { name: string; settings: Partial<ColorOverlaySettings> }[];
  applyPreset: (presetName: string) => void;
}

const DEFAULT_SETTINGS: ColorOverlaySettings = {
  enabled: false,
  tintColor: '#2997ff', // Apple blue
  intensity: 30,
  mode: 'tint',
  hueRotate: 0,
  saturation: 100,
  brightness: 100,
};

// Preset color themes
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
  { name: 'Hue Shift +60°', settings: { enabled: true, mode: 'hue-shift' as const, hueRotate: 60, intensity: 100 } },
  { name: 'Hue Shift +180°', settings: { enabled: true, mode: 'hue-shift' as const, hueRotate: 180, intensity: 100 } },
];

const ColorOverlayContext = createContext<ColorOverlayContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'bullmoney-color-overlay';

// Load settings from localStorage
const loadSettings = (): ColorOverlaySettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('[ColorOverlay] Error loading settings:', e);
  }
  return DEFAULT_SETTINGS;
};

// Save settings to localStorage
const saveSettings = (settings: ColorOverlaySettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[ColorOverlay] Error saving settings:', e);
  }
};

export function ColorOverlayProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ColorOverlaySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    if (mounted) {
      saveSettings(settings);
    }
  }, [settings, mounted]);

  // Apply global CSS filter to html element - this affects EVERYTHING including portals
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    // Create or get the style element
    let styleEl = document.getElementById('global-color-overlay-style') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'global-color-overlay-style';
      document.head.appendChild(styleEl);
    }

    if (!settings.enabled) {
      styleEl.textContent = '';
      return;
    }

    // Build CSS based on mode
    let css = '';
    
    if (settings.mode === 'hue-shift') {
      const filters: string[] = [];
      filters.push(`hue-rotate(${settings.hueRotate}deg)`);
      if (settings.saturation !== 100) filters.push(`saturate(${settings.saturation}%)`);
      if (settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
      css = `html { filter: ${filters.join(' ')} !important; }`;
    } else if (settings.mode === 'tint' || settings.mode === 'neon' || settings.mode === 'duotone') {
      // For tint modes, we use a pseudo-element on html
      const opacity = settings.mode === 'neon' ? settings.intensity / 100 * 0.5 : settings.intensity / 100;
      const blendMode = settings.mode === 'neon' ? 'screen' : 'color';
      const bgColor = settings.mode === 'duotone' 
        ? `linear-gradient(135deg, ${settings.tintColor}${Math.round(settings.intensity * 2.55).toString(16).padStart(2, '0')}, transparent)`
        : settings.tintColor;
      
      // Additional filters
      const filters: string[] = [];
      if (settings.saturation !== 100) filters.push(`saturate(${settings.saturation}%)`);
      if (settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
      const filterStr = filters.length > 0 ? `filter: ${filters.join(' ')} !important;` : '';
      
      css = `
        html { 
          ${filterStr}
        }
        html::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: ${bgColor};
          opacity: ${opacity};
          mix-blend-mode: ${blendMode};
          pointer-events: none;
          z-index: 2147483647;
        }
        ${settings.mode === 'neon' ? `
        html::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          box-shadow: inset 0 0 150px ${settings.tintColor}60;
          pointer-events: none;
          z-index: 2147483647;
        }
        ` : ''}
      `;
    }

    styleEl.textContent = css;

    return () => {
      // Cleanup on unmount
      if (styleEl && styleEl.parentNode) {
        styleEl.textContent = '';
      }
    };
  }, [mounted, settings]);

  const updateSettings = useCallback((updates: Partial<ColorOverlaySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = COLOR_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setSettings(prev => ({ ...prev, ...preset.settings }));
    }
  }, []);

  return (
    <ColorOverlayContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        presets: COLOR_PRESETS,
        applyPreset,
      }}
    >
      {/* Children rendered normally - CSS is injected into html element via style tag */}
      {children}
    </ColorOverlayContext.Provider>
  );
}

export function useColorOverlay() {
  const context = useContext(ColorOverlayContext);
  if (context === undefined) {
    throw new Error('useColorOverlay must be used within a ColorOverlayProvider');
  }
  return context;
}

// ============================================================================
// COLOR OVERLAY CONTROL PANEL COMPONENT
// ============================================================================

export function ColorOverlayPanel() {
  const { settings, updateSettings, resetSettings, presets, applyPreset } = useColorOverlay();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          top: 80,
          right: 20,
          zIndex: 100000,
          height: 40,
          padding: '0 16px',
          borderRadius: 20,
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: settings.enabled ? settings.tintColor : 'rgba(255, 255, 255, 0.9)',
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
        title="Color Overlay Settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
        </svg>
        <span>Colors</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 130,
            right: 20,
            zIndex: 100000,
            width: 300,
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.85)',
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
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                Global Color Overlay
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                Transform app colors in real-time
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 16 }}>
            {/* Enable Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#fff' }}>Enable Overlay</span>
              <button
                onClick={() => updateSettings({ enabled: !settings.enabled })}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  border: 'none',
                  background: settings.enabled ? '#2997ff' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: settings.enabled ? 22 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {/* Mode Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                Mode
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['tint', 'hue-shift', 'neon', 'duotone'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ mode })}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      fontSize: 11,
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: settings.mode === mode ? '#2997ff' : 'rgba(255,255,255,0.2)',
                      background: settings.mode === mode ? 'rgba(41,151,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker (for tint/neon/duotone modes) */}
            {settings.mode !== 'hue-shift' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                  Tint Color
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settings.tintColor}
                    onChange={e => updateSettings({ tintColor: e.target.value })}
                    style={{
                      width: 48,
                      height: 32,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                  />
                  <input
                    type="text"
                    value={settings.tintColor}
                    onChange={e => updateSettings({ tintColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Hue Rotate (for hue-shift mode) */}
            {settings.mode === 'hue-shift' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                  Hue Rotate: {settings.hueRotate}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={settings.hueRotate}
                  onChange={e => updateSettings({ hueRotate: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#2997ff' }}
                />
              </div>
            )}

            {/* Intensity */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                Intensity: {settings.intensity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.intensity}
                onChange={e => updateSettings({ intensity: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#2997ff' }}
              />
            </div>

            {/* Saturation */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                Saturation: {settings.saturation}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={settings.saturation}
                onChange={e => updateSettings({ saturation: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#2997ff' }}
              />
            </div>

            {/* Brightness */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                Brightness: {settings.brightness}%
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={settings.brightness}
                onChange={e => updateSettings({ brightness: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#2997ff' }}
              />
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>
                Quick Presets
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {presets.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.name)}
                    style={{
                      padding: '6px 10px',
                      fontSize: 11,
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetSettings}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </>
  );
}
