"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ALL_THEMES, Theme } from '@/constants/theme-data';
import { userStorage } from '@/lib/smartStorage';

interface GlobalThemeContextType {
  activeThemeId: string;
  activeTheme: Theme | null;
  accentColor: string;
  setTheme: (themeId: string) => void;
  isXMUser: boolean;
  setIsXMUser: (value: boolean) => void;
  isAppLoading: boolean;
  setAppLoading: (isLoading: boolean) => void;
  isMobile: boolean;
}

const GlobalThemeContext = createContext<GlobalThemeContextType | undefined>(undefined);

export function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to BullMoney Blue (#3b82f6) - the signature theme
  const [activeThemeId, setActiveThemeId] = useState<string>('bullmoney-blue');
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#3b82f6');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isXMUser, setIsXMUserState] = useState(false);
  const [isAppLoading, setAppLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile state for responsive theme filters
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load theme and XM status from storage on mount
  useEffect(() => {
    // Try to load comprehensive theme settings first
    const savedThemeSettings = localStorage.getItem('bullmoney_theme_settings');
    let savedThemeId: string | null = null;
    
    if (savedThemeSettings) {
      try {
        const settings = JSON.parse(savedThemeSettings);
        if (settings.id && ALL_THEMES.find(t => t.id === settings.id)) {
          savedThemeId = settings.id;
          console.log('[Theme] Restored from saved settings:', settings.name);
        }
      } catch (e) {
        console.warn('[Theme] Failed to parse saved theme settings');
      }
    }
    
    // Fallback to simple theme ID storage
    if (!savedThemeId) {
      savedThemeId = userStorage.get('user_theme_id') || 
                     localStorage.getItem('bullmoney-theme') || 
                     localStorage.getItem('user_theme_id');
    }
    
    if (savedThemeId && ALL_THEMES.find(t => t.id === savedThemeId)) {
      setActiveThemeId(savedThemeId);
    }
    
    // Load XM user easter egg status
    const savedXMUser = localStorage.getItem('bullmoney_xm_user');
    if (savedXMUser === 'true') {
      setIsXMUserState(true);
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
      const body = document.body;
      
      // IMPORTANT: Don't apply filter to html/body as it breaks position:fixed
      // Instead, apply filter via CSS variable and let specific elements use it
      const themeFilter = isMobile ? theme.mobileFilter : theme.filter;
      
      // Remove direct filter from html/body to preserve fixed positioning
      root.style.filter = 'none';
      body.style.filter = 'none';
      
      // Set comprehensive CSS variables for dynamic theming across entire app
      const accentHex = theme.accentColor || '#3b82f6';
      root.style.setProperty('--accent-color', accentHex);
      root.style.setProperty('--theme-id', `'${theme.id}'`);
      root.style.setProperty('--theme-name', `'${theme.name}'`);
      root.style.setProperty('--theme-category', `'${theme.category}'`);
      
      // Set theme-specific color variables for UI components
      // Parse hex color for RGB values
      const hex = accentHex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 59;
      const g = parseInt(hex.substring(2, 4), 16) || 130;
      const b = parseInt(hex.substring(4, 6), 16) || 246;
      
      root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
      root.style.setProperty('--theme-accent-light', `rgba(${r}, ${g}, ${b}, 0.25)`);
      root.style.setProperty('--theme-accent-dark', `rgba(${r}, ${g}, ${b}, 0.5)`);
      root.style.setProperty('--theme-accent-glow', `rgba(${r}, ${g}, ${b}, 0.4)`);
      root.style.setProperty('--theme-accent-subtle', `rgba(${r}, ${g}, ${b}, 0.1)`);
      root.style.setProperty('--theme-accent-border', `rgba(${r}, ${g}, ${b}, 0.3)`);
      
      // Set theme filter as CSS variable for components that need direct access
      root.style.setProperty('--theme-filter', themeFilter || 'none');
      root.style.setProperty('--theme-filter-mobile', theme.mobileFilter || 'none');
      root.style.setProperty('--theme-filter-desktop', theme.filter || 'none');
      
      // Set background and illusion props if available
      if (theme.bgImage) {
        root.style.setProperty('--theme-bg-image', `url(${theme.bgImage})`);
        root.style.setProperty('--theme-bg-blend', theme.bgBlendMode || 'overlay');
        root.style.setProperty('--theme-bg-opacity', String(theme.bgOpacity || 0.3));
      } else {
        root.style.removeProperty('--theme-bg-image');
      }
      
      // Set illusion type for CSS-based effects
      root.style.setProperty('--theme-illusion', theme.illusion || 'NONE');
      root.style.setProperty('--theme-overlay', theme.overlay || 'NONE');
      root.style.setProperty('--theme-is-light', theme.isLight ? '1' : '0');
      
      // GLOBAL THEME OVERLAY v2.0: Set overlay opacity based on theme intensity
      // This controls the CSS ::before pseudo-element color overlay
      const overlayOpacity = theme.category === 'GLITCH' ? '0.3' : 
                            theme.category === 'SENTIMENT' ? '0.5' :
                            theme.isLight ? '0.4' : '0.6';
      root.style.setProperty('--theme-overlay-opacity', overlayOpacity);
      
      // Set light theme flag for inverted blend modes
      if (theme.isLight) {
        root.setAttribute('data-theme-light', 'true');
      } else {
        root.removeAttribute('data-theme-light');
      }
      
      // Apply theme overlay as data attribute for CSS selectors
      root.setAttribute('data-active-theme', theme.id);
      root.setAttribute('data-theme-category', theme.category || 'SPECIAL');
      root.setAttribute('data-theme-illusion', theme.illusion || 'NONE');
      body.setAttribute('data-theme', theme.id);
      
      // CRITICAL: Force repaint to ensure overlay updates across all fixed elements
      // This is necessary for Safari and older browsers
      root.style.setProperty('--theme-update-trigger', String(Date.now()));
      
      // Log theme change for debugging
      console.log('[GlobalTheme] Applied:', theme.name, '| Accent:', accentHex, '| Overlay:', overlayOpacity);

      // Persist theme to multiple storage locations for reliability
      const themeData = {
        id: theme.id,
        name: theme.name,
        accentColor: theme.accentColor,
        filter: theme.filter,
        mobileFilter: theme.mobileFilter,
        category: theme.category,
        savedAt: Date.now()
      };
      
      userStorage.set('user_theme_id', theme.id);
      localStorage.setItem('bullmoney-theme', theme.id);
      localStorage.setItem('user_theme_id', theme.id);
      localStorage.setItem('bullmoney-theme-data', JSON.stringify(themeData));
      
      // Also save to session storage as backup
      try {
        sessionStorage.setItem('current_theme_id', theme.id);
        sessionStorage.setItem('current_theme_data', JSON.stringify(themeData));
      } catch (e) {
        // Session storage might not be available
      }
      
      // Dispatch custom event for components that need to react to theme changes
      window.dispatchEvent(new CustomEvent('bullmoney-theme-change', { 
        detail: { theme, themeId: theme.id, accentColor: theme.accentColor } 
      }));
      
      // ═══════════════════════════════════════════════════════════════════════════
      // GLOBAL THEME OVERLAY v4.0 - Bottom-to-Top Transition System
      // This overlay covers EVERYTHING including Spline/Canvas elements
      // Theme changes animate from BOTTOM to TOP like a wave washing over the UI
      // Uses pointer-events: none to allow all interactions through
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Create or get the transition reveal overlay (animates bottom to top)
      let transitionOverlay = document.getElementById('theme-transition-reveal');
      if (!transitionOverlay) {
        transitionOverlay = document.createElement('div');
        transitionOverlay.id = 'theme-transition-reveal';
        document.body.appendChild(transitionOverlay);
      }
      
      // Trigger bottom-to-top transition animation
      Object.assign(transitionOverlay.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        height: '0%',
        zIndex: '9999999', // Above everything during transition
        pointerEvents: 'none',
        touchAction: 'none',
        userSelect: 'none',
        // Theme color with glow
        background: `linear-gradient(
          to top,
          rgba(${r}, ${g}, ${b}, 0.6) 0%,
          rgba(${r}, ${g}, ${b}, 0.4) 30%,
          rgba(${r}, ${g}, ${b}, 0.2) 60%,
          rgba(${r}, ${g}, ${b}, 0.05) 90%,
          transparent 100%
        )`,
        boxShadow: `0 -20px 60px rgba(${r}, ${g}, ${b}, 0.4), 0 -10px 30px rgba(${r}, ${g}, ${b}, 0.3)`,
        transform: 'translateZ(0)',
        willChange: 'height',
        transition: 'none', // Will be animated via keyframes
      });
      
      // Trigger the bottom-to-top animation
      transitionOverlay.animate([
        { height: '0%', opacity: 1 },
        { height: '100%', opacity: 1 },
        { height: '100%', opacity: 0 }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });
      
      // Dispatch event for components to animate their theme changes bottom-to-top
      window.dispatchEvent(new CustomEvent('theme-transition-start', {
        detail: { 
          themeId: theme.id, 
          accentColor: theme.accentColor,
          rgb: { r, g, b },
          direction: 'bottom-to-top'
        }
      }));
      
      let overlay = document.getElementById('theme-global-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'theme-global-overlay';
        // Insert as first child of body to be behind modals but cover content
        document.body.insertBefore(overlay, document.body.firstChild);
      }
      
      // Apply overlay styles - covers everything, passes through all events
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '999999', // Above everything including Spline
        pointerEvents: 'none', // CRITICAL: Pass through ALL interactions
        touchAction: 'none', // Don't capture touch events
        userSelect: 'none',
        webkitUserSelect: 'none',
        // Color tint using theme accent
        background: `radial-gradient(
          ellipse at 50% 30%,
          rgba(${r}, ${g}, ${b}, 0.12) 0%,
          rgba(${r}, ${g}, ${b}, 0.06) 30%,
          rgba(${r}, ${g}, ${b}, 0.03) 60%,
          transparent 100%
        )`,
        // Blend mode for natural color mixing
        mixBlendMode: theme.isLight ? 'multiply' : 'screen',
        opacity: overlayOpacity,
        transition: 'opacity 0.5s ease, background 0.5s ease',
        // GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'opacity',
        // Prevent scroll interference
        overflow: 'visible',
        contain: 'layout style',
      });
      
      // Add a second overlay for edge glow effect
      let edgeGlow = document.getElementById('theme-edge-glow');
      if (!edgeGlow) {
        edgeGlow = document.createElement('div');
        edgeGlow.id = 'theme-edge-glow';
        document.body.insertBefore(edgeGlow, document.body.firstChild);
      }
      
      Object.assign(edgeGlow.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '999998',
        pointerEvents: 'none',
        touchAction: 'none',
        userSelect: 'none',
        // Vignette-style edge glow
        boxShadow: `inset 0 0 150px rgba(${r}, ${g}, ${b}, 0.15), 
                    inset 0 0 80px rgba(${r}, ${g}, ${b}, 0.1),
                    inset 0 0 40px rgba(${r}, ${g}, ${b}, 0.05)`,
        opacity: theme.isLight ? '0.3' : '0.5',
        transition: 'box-shadow 0.5s ease, opacity 0.5s ease',
        transform: 'translateZ(0)',
        overflow: 'visible',
        contain: 'layout style',
      });
    }
  }, [activeThemeId, isInitialized, isMobile]);

  const setTheme = useCallback((themeId: string) => {
    if (ALL_THEMES.find(t => t.id === themeId)) {
      setActiveThemeId(themeId);
    }
  }, []);

  // XM User setter with localStorage persistence
  const setIsXMUser = useCallback((value: boolean) => {
    setIsXMUserState(value);
    if (value) {
      localStorage.setItem('bullmoney_xm_user', 'true');
      // Apply XM red theme CSS variable
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-xm-user', 'true');
        document.documentElement.style.setProperty('--xm-accent', '#ef4444');
      }
    } else {
      localStorage.removeItem('bullmoney_xm_user');
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-xm-user');
        document.documentElement.style.removeProperty('--xm-accent');
      }
    }
  }, []);

  // Apply XM user styling on initialization
  useEffect(() => {
    if (isInitialized && isXMUser && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-xm-user', 'true');
      document.documentElement.style.setProperty('--xm-accent', '#ef4444');
    }
  }, [isInitialized, isXMUser]);

  return (
    <GlobalThemeContext.Provider
      value={{
        activeThemeId,
        activeTheme,
        accentColor,
        setTheme,
        isXMUser,
        setIsXMUser,
        isAppLoading,
        setAppLoading,
        isMobile,
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
