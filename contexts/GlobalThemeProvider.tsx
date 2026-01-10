"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ALL_THEMES, Theme } from '@/constants/theme-data';
import { userStorage } from '@/lib/smartStorage';

interface GlobalThemeContextType {
  activeThemeId: string;
  activeTheme: Theme | null;
  accentColor: string;
  setTheme: (themeId: string) => void;
}

const GlobalThemeContext = createContext<GlobalThemeContextType | undefined>(undefined);

export function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string>('t01');
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#3b82f6');

  // Load theme from storage on mount
  useEffect(() => {
    const savedTheme = userStorage.get('user_theme_id');
    if (savedTheme) {
      setActiveThemeId(savedTheme);
    }
  }, []);

  // Update active theme when ID changes
  useEffect(() => {
    const theme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0] || null;
    setActiveTheme(theme);
    setAccentColor(theme?.accentColor || '#3b82f6');

    // Apply theme filter globally
    if (typeof document !== 'undefined' && theme) {
      const root = document.documentElement;
      root.style.filter = theme.filter || 'none';
      root.style.setProperty('--accent-color', theme.accentColor || '#3b82f6');

      // Store in localStorage
      userStorage.set('user_theme_id', theme.id);
    }
  }, [activeThemeId]);

  const setTheme = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    userStorage.set('user_theme_id', themeId);
  }, []);

  return (
    <GlobalThemeContext.Provider
      value={{
        activeThemeId,
        activeTheme,
        accentColor,
        setTheme,
      }}
    >
      {children}
    </GlobalThemeContext.Provider>
  );
}

export function useGlobalTheme() {
  const context = useContext(GlobalThemeContext);
  if (!context) {
    throw new Error('useGlobalTheme must be used within GlobalThemeProvider');
  }
  return context;
}
