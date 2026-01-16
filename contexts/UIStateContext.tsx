"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

/**
 * UIStateContext - Manages mutual exclusion between UI components
 * 
 * When one component opens, others automatically close to prevent UI overlap.
 * This includes:
 * - Mobile menu (navbar dropdown)
 * - Navbar modals (Admin, FAQ, Affiliate, Theme Selector)
 * - Audio Widget (main panel + floating player)
 * - Ultimate Control Panel
 * - Footer components
 * - ChartNews modal
 * 
 * This system ensures a clean and predictable user experience.
 */

// Define all UI component types that participate in mutual exclusion
export type UIComponentType = 
  | 'mobileMenu'
  | 'navbarModal'
  | 'audioWidget'
  | 'ultimatePanel'
  | 'footer'
  | 'chartnews';

// Specific navbar modal types for tracking which one is open
export type NavbarModalType = 'admin' | 'faq' | 'affiliate' | 'themeSelector' | null;

interface UIStateContextType {
  // Current open states
  isMobileMenuOpen: boolean;
  isAudioWidgetOpen: boolean;
  isUltimatePanelOpen: boolean;
  isFooterOpen: boolean;
  isChartNewsOpen: boolean;
  activeNavbarModal: NavbarModalType;
  
  // Check if any component is open
  isAnyOpen: boolean;
  
  // Setters with mutual exclusion
  setMobileMenuOpen: (open: boolean) => void;
  setAudioWidgetOpen: (open: boolean) => void;
  setUltimatePanelOpen: (open: boolean) => void;
  setNavbarModal: (modal: NavbarModalType) => void;
  setFooterOpen: (open: boolean) => void;
  setChartNewsOpen: (open: boolean) => void;
  
  // Convenience methods for navbar modals
  openAdminModal: () => void;
  openFaqModal: () => void;
  openAffiliateModal: () => void;
  openThemeSelectorModal: () => void;
  closeNavbarModal: () => void;
  
  // Close all UI components
  closeAll: () => void;
  
  // Check which component is currently active
  activeComponent: UIComponentType | null;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  // Core states
  const [isMobileMenuOpen, setIsMobileMenuOpenState] = useState(false);
  const [isAudioWidgetOpen, setIsAudioWidgetOpenState] = useState(false);
  const [isUltimatePanelOpen, setIsUltimatePanelOpenState] = useState(false);
  const [activeNavbarModal, setActiveNavbarModalState] = useState<NavbarModalType>(null);
  const [isFooterOpen, setIsFooterOpenState] = useState(false);
  const [isChartNewsOpen, setIsChartNewsOpenState] = useState(false);

  // Derived state: is any component currently open?
  const isAnyOpen = isMobileMenuOpen || isAudioWidgetOpen || isUltimatePanelOpen || activeNavbarModal !== null || isFooterOpen || isChartNewsOpen;
  
  // Derived state: which component is active?
  const activeComponent: UIComponentType | null = 
    isMobileMenuOpen ? 'mobileMenu' :
    activeNavbarModal !== null ? 'navbarModal' :
    isAudioWidgetOpen ? 'audioWidget' :
    isUltimatePanelOpen ? 'ultimatePanel' :
    isFooterOpen ? 'footer' :
    isChartNewsOpen ? 'chartnews' :
    null;

  // Closes all other components except the one specified
  const closeOthers = useCallback((except?: UIComponentType) => {
    if (except !== 'mobileMenu') setIsMobileMenuOpenState(false);
    if (except !== 'navbarModal') setActiveNavbarModalState(null);
    if (except !== 'audioWidget') setIsAudioWidgetOpenState(false);
    if (except !== 'ultimatePanel') setIsUltimatePanelOpenState(false);
    if (except !== 'footer') setIsFooterOpenState(false);
    if (except !== 'chartnews') setIsChartNewsOpenState(false);
  }, []);

  // Closes all components
  const closeAll = useCallback(() => {
    closeOthers();
  }, [closeOthers]);

  // --- Setters with built-in mutual exclusion ---

  const setMobileMenuOpen = useCallback((open: boolean) => {
    if (open) closeOthers('mobileMenu');
    setIsMobileMenuOpenState(open);
  }, [closeOthers]);

  const setAudioWidgetOpen = useCallback((open: boolean) => {
    if (open) closeOthers('audioWidget');
    setIsAudioWidgetOpenState(open);
  }, [closeOthers]);

  const setUltimatePanelOpen = useCallback((open: boolean) => {
    if (open) closeOthers('ultimatePanel');
    setIsUltimatePanelOpenState(open);
  }, [closeOthers]);

  const setNavbarModal = useCallback((modal: NavbarModalType) => {
    if (modal !== null) closeOthers('navbarModal');
    setActiveNavbarModalState(modal);
  }, [closeOthers]);

  const setFooterOpen = useCallback((open: boolean) => {
    if (open) closeOthers('footer');
    setIsFooterOpenState(open);
  }, [closeOthers]);

  const setChartNewsOpen = useCallback((open: boolean) => {
    if (open) closeOthers('chartnews');
    setIsChartNewsOpenState(open);
  }, [closeOthers]);

  // Convenience methods for opening specific navbar modals
  const openAdminModal = useCallback(() => setNavbarModal('admin'), [setNavbarModal]);
  const openFaqModal = useCallback(() => setNavbarModal('faq'), [setNavbarModal]);
  const openAffiliateModal = useCallback(() => setNavbarModal('affiliate'), [setNavbarModal]);
  const openThemeSelectorModal = useCallback(() => setNavbarModal('themeSelector'), [setNavbarModal]);
  const closeNavbarModal = useCallback(() => setNavbarModal(null), [setNavbarModal]);

  // Global escape key handler to close any open component
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAnyOpen) {
        closeAll();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isAnyOpen, closeAll]);

  const value: UIStateContextType = {
    // States
    isMobileMenuOpen,
    isAudioWidgetOpen,
    isUltimatePanelOpen,
    isFooterOpen,
    isChartNewsOpen,
    activeNavbarModal,
    isAnyOpen,
    activeComponent,
    
    // Setters
    setMobileMenuOpen,
    setAudioWidgetOpen,
    setUltimatePanelOpen,
    setNavbarModal,
    setFooterOpen,
    setChartNewsOpen,
    
    // Convenience methods
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    closeNavbarModal,
    closeAll,
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

// Main hook to access the context
export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

// --- Convenience Hooks for Specific UI Components ---

export function useMobileMenu() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIState();
  return { 
    isMobileMenuOpen, 
    setIsMobileMenuOpen: setMobileMenuOpen 
  };
}

export function useAudioWidgetUI() {
  const { 
    isAudioWidgetOpen, 
    setAudioWidgetOpen, 
    isMobileMenuOpen, 
    activeNavbarModal, 
    isUltimatePanelOpen,
    isFooterOpen,
    isChartNewsOpen
  } = useUIState();
  
  // The floating player should be hidden if any other managed UI component is open.
  const shouldHideFloatingPlayer = isMobileMenuOpen || activeNavbarModal !== null || isUltimatePanelOpen || isFooterOpen || isChartNewsOpen;
  
  return { 
    isAudioWidgetOpen, 
    setAudioWidgetOpen,
    shouldHideFloatingPlayer,
  };
}

export function useUltimatePanelUI() {
  const { 
    isUltimatePanelOpen, 
    setUltimatePanelOpen,
    ...uiState
  } = useUIState();
  
  // The panel should be hidden (and swipe disabled) if any other managed component is open.
  const shouldHide = uiState.isMobileMenuOpen || uiState.activeNavbarModal !== null || uiState.isAudioWidgetOpen || uiState.isFooterOpen || uiState.isChartNewsOpen;
  const shouldShow = isUltimatePanelOpen && !shouldHide;
  
  return { 
    isUltimatePanelOpen, 
    setUltimatePanelOpen,
    shouldShow,
    shouldHide,
  };
}

export function useNavbarModals() {
  const { 
    activeNavbarModal, 
    setNavbarModal,
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    closeNavbarModal,
  } = useUIState();
  
  return {
    activeNavbarModal,
    isAdminOpen: activeNavbarModal === 'admin',
    isFaqOpen: activeNavbarModal === 'faq',
    isAffiliateOpen: activeNavbarModal === 'affiliate',
    isThemeSelectorOpen: activeNavbarModal === 'themeSelector',
    setNavbarModal,
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    closeNavbarModal,
  };
}

// New convenience hooks
export function useFooterUI() {
  const { isFooterOpen, setFooterOpen } = useUIState();
  return { isFooterOpen, setFooterOpen };
}

export function useChartNewsUI() {
  const { isChartNewsOpen, setChartNewsOpen } = useUIState();
  return { isChartNewsOpen, setChartNewsOpen };
}
