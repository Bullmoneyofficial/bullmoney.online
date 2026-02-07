"use client";

import { create } from 'zustand';

// =============================================================================
// Welcome Screen Controls Store
// Bridge between layout-level buttons and welcome screen components.
// Welcome screens write display state; layout buttons read it + fire actions.
// Buttons live at layout level (LayoutProviders → WelcomeScreenControls),
// panels (SplinePanel, ColorPicker, Toast) stay inside welcome screen portals.
// =============================================================================

export interface WelcomeControlsState {
  // Whether any welcome screen is currently visible
  isWelcomeActive: boolean;
  // 'mobile' or 'desktop' — so layout buttons can position differently
  welcomeVariant: 'mobile' | 'desktop';

  // Display state — synced FROM welcome screen components
  show3DOverlay: boolean;
  isFirstEverVisit: boolean;
  showGrayscale: boolean;
  colorMode: 'color' | 'grayscale' | 'custom';

  // Action counters — incremented by layout buttons, watched by welcome screens
  // Welcome screens useEffect on these to react to button presses.
  toggle3DAction: number;
  toggleColorPickerAction: number;
  toggleSplinePanelAction: number;

  // Setters (called by welcome screens to sync display state)
  setWelcomeActive: (v: boolean) => void;
  setWelcomeVariant: (v: 'mobile' | 'desktop') => void;
  setShow3DOverlay: (v: boolean) => void;
  setIsFirstEverVisit: (v: boolean) => void;
  setShowGrayscale: (v: boolean) => void;
  setColorMode: (v: 'color' | 'grayscale' | 'custom') => void;

  // Fires (called by layout buttons)
  fireToggle3D: () => void;
  fireToggleColorPicker: () => void;
  fireToggleSplinePanel: () => void;
}

export const useWelcomeControlsStore = create<WelcomeControlsState>((set) => ({
  isWelcomeActive: false,
  welcomeVariant: 'desktop',
  show3DOverlay: false,
  isFirstEverVisit: true,
  showGrayscale: true,
  colorMode: 'grayscale',

  toggle3DAction: 0,
  toggleColorPickerAction: 0,
  toggleSplinePanelAction: 0,

  setWelcomeActive: (v) => set({ isWelcomeActive: v }),
  setWelcomeVariant: (v) => set({ welcomeVariant: v }),
  setShow3DOverlay: (v) => set({ show3DOverlay: v }),
  setIsFirstEverVisit: (v) => set({ isFirstEverVisit: v }),
  setShowGrayscale: (v) => set({ showGrayscale: v }),
  setColorMode: (v) => set({ colorMode: v }),

  fireToggle3D: () => set((s) => ({ toggle3DAction: s.toggle3DAction + 1 })),
  fireToggleColorPicker: () => set((s) => ({ toggleColorPickerAction: s.toggleColorPickerAction + 1 })),
  fireToggleSplinePanel: () => set((s) => ({ toggleSplinePanelAction: s.toggleSplinePanelAction + 1 })),
}));
