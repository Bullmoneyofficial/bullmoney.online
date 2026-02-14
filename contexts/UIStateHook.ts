"use client";

// ============================================================================
// UIStateHook — Lightweight entry point for useUIState consumers
// ============================================================================
// This file creates the UIStateContext object and exports the useUIState hook.
// Page components should import from HERE instead of UIStateContext.tsx to avoid
// pulling the full 1,595-line provider + analytics (443) + useSoundEffects (658)
// into their compile-time module graph.
//
// The UIStateProvider (in UIStateContext.tsx) imports the context from here.
// `import type` is used for TypeScript types — Turbopack strips these at compile
// time so they don't cause transitive module resolution.
// ============================================================================

import { createContext, useContext } from 'react';

// UI Z-Index hierarchy (re-exported so consumers don't need full file)
export const UI_Z_INDEX = {
  CONTENT: 1,
  FOOTER: 100,
  FLOATING_PLAYER_MINIMIZED: 2147483590,
  FLOATING_PLAYER: 2147483610,
  ULTIMATE_PANEL: 2147483620,
  MODAL_BACKDROP: 99990,
  MODAL_CONTENT: 99999,
  CHARTNEWS: 9999999,
  AFFILIATE: 999999,
  PAGEMODE: 99999998,
  MOBILE_MENU: 999999999,
  LEGAL_MODAL: 9999999999,
  ANALYSIS_MODAL: 2147483647,
} as const;

// Component types
export type UIComponentType =
  | 'mobileMenu' | 'audioWidget' | 'ultimatePanel' | 'ultimateHub'
  | 'footer' | 'chartnews' | 'analysisModal' | 'liveStreamModal'
  | 'productsModal' | 'courseDrawer' | 'socialsDrawer' | 'servicesModal'
  | 'affiliateModal' | 'themeSelectorModal' | 'adminModal' | 'faqModal'
  | 'appsModal' | 'disclaimerModal' | 'pagemode' | 'loaderv2'
  | 'authModal' | 'bullFeedModal' | 'postComposerModal' | 'heroSceneModal'
  | 'discordStageModal' | 'accountManagerModal' | 'bgPickerModal'
  | 'colorPickerModal' | 'splinePanelModal' | 'storeMobileMenu'
  | 'storeDesktopMenu' | 'storeDropdownMenu' | 'supportDrawer' | 'gamesDrawer';

export type NavbarModalType = 'admin' | 'faq' | 'affiliate' | 'themeSelector' | null;

// The full type is defined here to avoid importing UIStateContext.tsx
export interface UIStateContextType {
  isMobileMenuOpen: boolean;
  isAudioWidgetOpen: boolean;
  isUltimatePanelOpen: boolean;
  isUltimateHubOpen: boolean;
  isFooterOpen: boolean;
  isChartNewsOpen: boolean;
  isAnalysisModalOpen: boolean;
  isLiveStreamModalOpen: boolean;
  isProductsModalOpen: boolean;
  isServicesModalOpen: boolean;
  isAffiliateModalOpen: boolean;
  isThemeSelectorModalOpen: boolean;
  isAdminModalOpen: boolean;
  isFaqModalOpen: boolean;
  isAppsModalOpen: boolean;
  isDisclaimerModalOpen: boolean;
  isPagemodeOpen: boolean;
  isLoaderv2Open: boolean;
  isAuthModalOpen: boolean;
  isBullFeedModalOpen: boolean;
  isPostComposerModalOpen: boolean;
  isHeroSceneModalOpen: boolean;
  isDiscordStageModalOpen: boolean;
  isAccountManagerModalOpen: boolean;
  isBgPickerModalOpen: boolean;
  isColorPickerModalOpen: boolean;
  isSplinePanelModalOpen: boolean;
  isStoreMobileMenuOpen: boolean;
  isStoreDesktopMenuOpen: boolean;
  isStoreDropdownMenuOpen: boolean;
  isSupportDrawerOpen: boolean;
  isGamesDrawerOpen: boolean;
  isCourseDrawerOpen: boolean;
  isSocialsDrawerOpen: boolean;
  isV2Unlocked: boolean;
  devSkipPageModeAndLoader: boolean;
  isWelcomeScreenActive: boolean;
  hasStartedPagemodeAudio: boolean;
  isMobileNavbarHidden: boolean;
  activeNavbarModal: NavbarModalType;
  isAnyOpen: boolean;
  isAnyModalOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setAudioWidgetOpen: (open: boolean) => void;
  setUltimatePanelOpen: (open: boolean) => void;
  setUltimateHubOpen: (open: boolean) => void;
  setFooterOpen: (open: boolean) => void;
  setChartNewsOpen: (open: boolean) => void;
  setAnalysisModalOpen: (open: boolean) => void;
  setLiveStreamModalOpen: (open: boolean) => void;
  setProductsModalOpen: (open: boolean) => void;
  setServicesModalOpen: (open: boolean) => void;
  setAffiliateModalOpen: (open: boolean) => void;
  setThemeSelectorModalOpen: (open: boolean) => void;
  setAdminModalOpen: (open: boolean) => void;
  setFaqModalOpen: (open: boolean) => void;
  setAppsModalOpen: (open: boolean) => void;
  setDisclaimerModalOpen: (open: boolean) => void;
  setPagemodeOpen: (open: boolean) => void;
  setLoaderv2Open: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setBullFeedModalOpen: (open: boolean) => void;
  setPostComposerModalOpen: (open: boolean) => void;
  setHeroSceneModalOpen: (open: boolean) => void;
  setDiscordStageModalOpen: (open: boolean) => void;
  setAccountManagerModalOpen: (open: boolean) => void;
  setBgPickerModalOpen: (open: boolean) => void;
  setColorPickerModalOpen: (open: boolean) => void;
  setSplinePanelModalOpen: (open: boolean) => void;
  setStoreMobileMenuOpen: (open: boolean) => void;
  setStoreDesktopMenuOpen: (open: boolean) => void;
  setStoreDropdownMenuOpen: (open: boolean) => void;
  setSupportDrawerOpen: (open: boolean) => void;
  setGamesDrawerOpen: (open: boolean) => void;
  setCourseDrawerOpen: (open: boolean) => void;
  setSocialsDrawerOpen: (open: boolean) => void;
  setV2Unlocked: (unlocked: boolean) => void;
  setDevSkipPageModeAndLoader: (skip: boolean) => void;
  setWelcomeScreenActive: (active: boolean) => void;
  setMobileNavbarHidden: (hidden: boolean) => void;
  setNavbarModal: (modal: NavbarModalType) => void;
  openAdminModal: () => void;
  openFaqModal: () => void;
  openAffiliateModal: () => void;
  openThemeSelectorModal: () => void;
  openAnalysisModal: () => void;
  openLiveStreamModal: () => void;
  openProductsModal: () => void;
  openServicesModal: () => void;
  openAuthModal: () => void;
  openBullFeedModal: () => void;
  openPostComposerModal: () => void;
  openHeroSceneModal: () => void;
  openDiscordStageModal: () => void;
  openAccountManagerModal: () => void;
  openBgPickerModal: () => void;
  openColorPickerModal: () => void;
  openSplinePanelModal: () => void;
  openStoreMobileMenu: () => void;
  openStoreDesktopMenu: () => void;
  openStoreDropdownMenu: () => void;
  openSupportDrawer: () => void;
  openGamesDrawer: () => void;
  openCourseDrawer: () => void;
  openSocialsDrawer: () => void;
  closeNavbarModal: () => void;
  closeAll: () => void;
  closeAllModals: () => void;
  activeComponent: UIComponentType | null;
  shouldMinimizeAudioWidget: boolean;
  hasOverlayingUI: boolean;
  shouldSkipHeavyEffects: boolean;
}

// Shared context instance — used by both the provider (UIStateContext.tsx) and all consumers
export const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// ── Base Hook ────────────────────────────────────────────────────────────────
export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

// ── Convenience Hooks ────────────────────────────────────────────────────────
// These are lightweight re-exports that avoid pulling in the full provider file

export function useProductsModalUI() {
  const { isProductsModalOpen, setProductsModalOpen, openProductsModal } = useUIState();
  return { isOpen: isProductsModalOpen, setIsOpen: setProductsModalOpen, open: openProductsModal };
}

export function useMobileMenu() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIState();
  return { isMobileMenuOpen, setIsMobileMenuOpen: setMobileMenuOpen };
}
