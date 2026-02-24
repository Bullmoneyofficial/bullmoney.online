import type { BackgroundEffect } from './types';

// Load favorites and enabled effects from localStorage
export const loadBgPreferences = (): { favorites: BackgroundEffect[]; enabled: BackgroundEffect[] } => {
  if (typeof window === 'undefined') return { favorites: [], enabled: [] };
  try {
    const stored = localStorage.getItem('bg-preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[BGPrefs] Error loading:', e);
  }
  return { favorites: [], enabled: [] };
};

// Save preferences to localStorage
export const saveBgPreferences = (favorites: BackgroundEffect[], enabled: BackgroundEffect[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bg-preferences', JSON.stringify({ favorites, enabled }));
  } catch (e) {
    console.error('[BGPrefs] Error saving:', e);
  }
};

// Load color preferences from localStorage
export const loadColorPreferences = (): {
  mode: 'color' | 'grayscale' | 'custom';
  color: { h: number; s: number; l: number; a: number };
} => {
  if (typeof window === 'undefined') return { mode: 'color', color: { h: 0, s: 50, l: 50, a: 0.5 } };
  try {
    const stored = localStorage.getItem('color-preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[ColorPrefs] Error loading:', e);
  }
  return { mode: 'color', color: { h: 0, s: 50, l: 50, a: 0.5 } };
};

// Save color preferences to localStorage
export const saveColorPreferences = (
  mode: 'color' | 'grayscale' | 'custom',
  color: { h: number; s: number; l: number; a: number },
) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('color-preferences', JSON.stringify({ mode, color }));
  } catch (e) {
    console.error('[ColorPrefs] Error saving:', e);
  }
};
