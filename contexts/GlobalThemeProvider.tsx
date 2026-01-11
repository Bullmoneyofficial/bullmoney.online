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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const savedTheme = userStorage.get('user_theme_id') || localStorage.getItem('bullmoney-theme') || localStorage.getItem('user_theme_id');
    if (savedTheme && ALL_THEMES.find(t => t.id === savedTheme)) {
      setActiveThemeId(savedTheme);
    }
    setIsInitialized(true);
  }, []);

  // Update active theme when ID changes and apply as overlay
  useEffect(() => {
    if (!isInitialized) return;
    
    const theme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0] || null;
    setActiveTheme(theme);
    setAccentColor(theme?.accentColor || '#3b82f6');

    // Apply theme as persistent overlay across website
    if (typeof document !== 'undefined' && theme) {
      const root = document.documentElement;
      
      // Apply filter overlay for theme effect
      if (theme.filter && theme.filter !== 'none') {
        root.style.filter = theme.filter;
      } else {
        root.style.filter = 'none';
      }
      
      // Set CSS variables for dynamic theming
      root.style.setProperty('--accent-color', theme.accentColor || '#3b82f6');
      root.style.setProperty('--theme-id', `'${theme.id}'`);
      
      // Apply theme overlay as data attribute for CSS selectors
      root.setAttribute('data-active-theme', theme.id);

      // Persist theme to multiple storage locations for reliability
      userStorage.set('user_theme_id', theme.id);
      localStorage.setItem('bullmoney-theme', theme.id);
      localStorage.setItem('user_theme_id', theme.id);
      
      // Also save to session storage as backup
      try {
        sessionStorage.setItem('current_theme_id', theme.id);
      } catch (e) {
        // Session storage might not be available
      }
    }
  }, [activeThemeId, isInitialized]);

  const setTheme = useCallback((themeId: string) => {
    if (ALL_THEMES.find(t => t.id === themeId)) {
      setActiveThemeId(themeId);
    }
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
