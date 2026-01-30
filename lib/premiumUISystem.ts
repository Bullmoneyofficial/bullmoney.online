/**
 * Premium UI System - Unified White Shimmer Design System
 * 2025 Edition - Production Ready
 * 
 * This system provides consistent premium styling across the entire application.
 * All UI elements use this unified color palette, animation config, and glass effects.
 */

export const PREMIUM_THEME = {
  // Core gradients
  SHIMMER_GRADIENT: "conic-gradient(from 90deg at 50% 50%, #00000000 0%, var(--accent-color, #ffffff) 50%, #00000000 100%)",
  BLUE_GLOW: "0 0 20px rgba(var(--accent-rgb, 255, 255, 255), 0.4)",
  BLUE_GLOW_STRONG: "0 0 40px rgba(var(--accent-rgb, 255, 255, 255), 0.6)",
  GLASS_BG: "rgba(15, 23, 42, 0.6)", // slate-950 with transparency
  
  // Animation configs - SLOW animations for better performance
  ANIMATIONS: {
    SHIMMER: { duration: 10, repeat: Infinity, ease: "linear" },
    GLOW_PULSE: { duration: 8, repeat: Infinity, ease: "easeInOut" },
    HOVER: { duration: 0.3 },
    TAP: { duration: 0.15 },
  },
  
  // Border configs
  BORDERS: {
    THIN: "1px",
    MEDIUM: "1.5px",
    THICK: "2px",
  },
  
  // Colors
  COLORS: {
    PRIMARY_BLUE: "var(--accent-color, #ffffff)",
    SECONDARY_BLUE: "rgba(var(--accent-rgb, 255, 255, 255), 1)",
    ACCENT_BLUE: "rgba(var(--accent-rgb, 255, 255, 255), 0.7)",
    LIGHT_BLUE: "rgba(var(--accent-rgb, 255, 255, 255), 0.8)",
    DARK_BG: "#050505",
    PANEL_BG: "#0f172a",
    TEXT_PRIMARY: "#ffffff",
    TEXT_SECONDARY: "rgba(255, 255, 255, 0.6)",
    TEXT_TERTIARY: "rgba(255, 255, 255, 0.4)",
  },
} as const;

export const GLASS_STYLES = {
  backdrop: "",  // NO BLUR - removed for performance
  border: "border border-white/20",
  shadow: "shadow-lg shadow-white/10",
  gradient: "bg-gradient-to-br from-white/15 via-slate-950 to-neutral-950",
  gradientAlt: `bg-gradient-to-br from-white/10 via-neutral-950 to-black/80`,
} as const;

// Mobile-specific optimizations
export const MOBILE_OPTIMIZATIONS = {
  // Minimum tap target size (accessibility standard)
  MIN_TAP_TARGET: "44px",
  // Safe area padding
  SAFE_AREA_X: "env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px)",
  SAFE_AREA_Y: "env(safe-area-inset-top, 0px) env(safe-area-inset-bottom, 0px)",
  // Touch action optimization
  TOUCH_ACTION: "manipulation",
  // Tap highlight removal
  TAP_HIGHLIGHT: "transparent",
} as const;

// Z-index layers for proper stacking
export const Z_LAYERS = {
  // Backgrounds
  BACKGROUND: 0,
  CONTENT: 10,
  
  // UI Elements
  BUTTONS: 20,
  CARDS: 30,
  
  // Interactive
  OVERLAYS: 100,
  MODALS: 200,
  DROPDOWNS: 150,
  
  // Top level
  TOOLTIPS: 300,
  NOTIFICATIONS: 400,
} as const;
