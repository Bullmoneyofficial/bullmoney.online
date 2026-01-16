"use client";

/**
 * @deprecated This file is kept for backwards compatibility.
 * Please use UIStateContext instead for new code.
 * 
 * The useMobileMenu hook and MobileMenuProvider are now re-exported
 * from UIStateContext which handles mutual exclusion between:
 * - Mobile menu
 * - Navbar modals
 * - Audio Widget
 * - Ultimate Control Panel
 */

// Re-export everything from UIStateContext for backwards compatibility
export { 
  useMobileMenu, 
  UIStateProvider as MobileMenuProvider,
  useUIState,
  useAudioWidgetUI,
  useUltimatePanelUI,
  useNavbarModals,
  type UIComponentType,
  type NavbarModalType,
} from './UIStateContext';
