/**
 * UI Layer System - Unified Z-Index Management
 *
 * This file defines a consistent z-index layering system for the entire app.
 * All UI components should reference these constants to prevent overlap issues.
 */

export const UI_LAYERS = {
  // Base content layer
  CONTENT: 0,

  // Navigation layers
  NAV_SIDEBAR: 50,
  NAV_MOBILE_OVERLAY: 100,
  NAV_MOBILE_FAB: 110,

  // Scroll and progress indicators
  PROGRESS_BAR: 150,
  SCROLL_INDICATOR: 200,

  // Interactive UI elements
  PANELS_BOTTOM: 300,        // Swipeable bottom panels
  PANELS_SUPPORT: 310,       // Support panel (above control center)
  CONTROL_CENTER_BTN: 350,   // Main control button

  // Theme system
  THEME_LENS: 400,           // Global theme filter
  THEME_PICKER: 450,         // Quick theme picker overlay
  THEME_CONFIGURATOR: 500,   // Full theme configuration modal

  // Info and help
  INFO_PANEL: 550,           // Left info panel
  INFO_PEEKER: 560,          // Info panel edge indicator
  FAQ_OVERLAY: 600,          // FAQ modal

  // Modals and overlays
  MODAL_BACKDROP: 700,       // Generic modal backdrop
  MODAL_CONTENT: 710,        // Generic modal content

  // System UI
  NAVBAR: 800,               // Top navbar (always visible)
  ORIENTATION_WARNING: 900,  // Orientation lock screen

  // Special effects (non-interactive)
  PARTICLES: 1000,           // Particle effects
  CURSOR: 1100,              // Custom cursor trail

  // Navigation arrows (game-like UI)
  NAV_ARROWS: 250,           // Left/right page navigation arrows
} as const;

/**
 * Game-like UI Configuration
 * Defines visual styles for game-like interactions
 */
export const GAME_UI_CONFIG = {
  // Animation durations
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Haptic feedback patterns
  HAPTICS: {
    LIGHT: 10,
    MEDIUM: 15,
    STRONG: 25,
  },

  // Sound effects
  SOUNDS: {
    CLICK: { frequency: 800, duration: 50 },
    HOVER: { frequency: 600, duration: 30 },
    SWIPE: { frequency: 400, duration: 100 },
    SUCCESS: { frequency: 1200, duration: 150 },
    ERROR: { frequency: 200, duration: 200 },
  },

  // Visual feedback
  FEEDBACK: {
    SCALE_ACTIVE: 0.95,
    SCALE_HOVER: 1.05,
    GLOW_INTENSITY: '20px',
  },
} as const;

/**
 * Unified Layout Configuration
 * Same layout for both mobile and desktop
 */
export const UNIFIED_LAYOUT = {
  // Navigation position (always bottom-right)
  NAV: {
    position: 'fixed',
    bottom: '1.5rem',    // 6 in Tailwind
    right: '1.5rem',     // 6 in Tailwind
  },

  // Control buttons (always visible, unified)
  CONTROLS: {
    position: 'fixed',
    bottom: '1.25rem',   // 5 in Tailwind
    left: '1rem',        // 4 in Tailwind
    gap: '0.75rem',      // 3 in Tailwind
  },

  // Page indicator (center bottom)
  PAGE_INDICATOR: {
    position: 'fixed',
    bottom: '2rem',      // 8 in Tailwind
    left: '50%',
    transform: 'translateX(-50%)',
  },

  // Swipeable panels (always bottom)
  PANELS: {
    position: 'bottom',
    maxHeight: '75vh',
    minHeight: '60px',
  },
} as const;

export type UILayer = typeof UI_LAYERS[keyof typeof UI_LAYERS];
export type GameAnimation = keyof typeof GAME_UI_CONFIG.ANIMATIONS;
