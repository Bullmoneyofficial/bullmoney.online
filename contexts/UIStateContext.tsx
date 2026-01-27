"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { trackUIStateChange, trackEvent, type AnalyticsEventData } from '@/lib/analytics';

/**
 * UIStateContext - Centralized UI state management with mutual exclusion
 *
 * This context ensures only ONE UI component can be fully open at a time.
 * When one component opens, others automatically close.
 *
 * Components managed:
 * - Mobile menu (navbar dropdown) - HIGHEST PRIORITY, appears on top of everything
 * - Audio Widget (main panel) - NOTE: Floating player/iframe stays alive for audio persistence
 * - Ultimate Control Panel
 * - Footer modal
 * - ChartNews modal
 * - Analysis modal
 * - LiveStream modal
 * - Products modal
 * - Affiliate modal
 * - Theme Selector modal
 * - Admin modal
 * - FAQ modal
 *
 * IMPORTANT: Audio Widget special handling:
 * - When other UI opens, the audio widget MENU closes but the floating player
 *   MINIMIZES (hides iframe behind pull tab) rather than unmounting.
 * - This preserves audio playback across UI state changes.
 */

// Z-Index hierarchy for all UI components (centralized for consistency)
export const UI_Z_INDEX = {
  // Base layers
  CONTENT: 1,
  FOOTER: 100,

  // Floating elements
  FLOATING_PLAYER_MINIMIZED: 2147483590, // Pull tab when minimized
  FLOATING_PLAYER: 2147483610,           // Full floating player
  ULTIMATE_PANEL: 2147483620,            // Control panel

  // Modals (standard layer)
  MODAL_BACKDROP: 99990,
  MODAL_CONTENT: 99999,

  // High priority modals
  CHARTNEWS: 9999999,
  AFFILIATE: 999999,
  PAGEMODE: 99999999,

  // Mobile menu - HIGHEST PRIORITY (appears on top of everything)
  MOBILE_MENU: 999999999,
  
  // Analysis Modal - Maximum z-index (same as LiveStreamModal)
  ANALYSIS_MODAL: 2147483647,
} as const;

// Define all UI component types that participate in mutual exclusion
export type UIComponentType =
  | 'mobileMenu'
  | 'audioWidget'
  | 'ultimatePanel'
  | 'ultimateHub'         // UltimateHub unified control center panel
  | 'footer'
  | 'chartnews'
  | 'analysisModal'
  | 'liveStreamModal'
  | 'productsModal'
  | 'servicesModal'
  | 'affiliateModal'
  | 'themeSelectorModal'
  | 'adminModal'
  | 'faqModal'
  | 'appsModal'           // Footer: Apps & Tools modal
  | 'disclaimerModal'     // Footer: Legal Disclaimer modal
  | 'pagemode'            // Registration/pagemode overlay
  | 'loaderv2'            // Multi-step loader overlay
  | 'authModal'           // Bull Feed: Auth/Login/Signup modal
  | 'bullFeedModal'       // Bull Feed: Main feed modal
  | 'postComposerModal'   // Bull Feed: Create post modal
  | 'heroSceneModal'      // Hero scene selector modal
  | 'discordStageModal'   // Discord Stage live stream modal
  | 'accountManagerModal'; // Account Manager modal

// Legacy type for backwards compatibility
export type NavbarModalType = 'admin' | 'faq' | 'affiliate' | 'themeSelector' | null;

interface UIStateContextType {
  // Current open states
  isMobileMenuOpen: boolean;
  isAudioWidgetOpen: boolean;
  isUltimatePanelOpen: boolean;
  isUltimateHubOpen: boolean;      // UltimateHub unified control center
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
  isAppsModalOpen: boolean;        // Footer: Apps & Tools modal
  isDisclaimerModalOpen: boolean;  // Footer: Legal Disclaimer modal
  isPagemodeOpen: boolean;         // Registration page overlay
  isLoaderv2Open: boolean;         // Multi-step loader overlay
  isAuthModalOpen: boolean;        // Bull Feed: Auth modal
  isBullFeedModalOpen: boolean;    // Bull Feed: Main feed
  isPostComposerModalOpen: boolean; // Bull Feed: Create post
  isHeroSceneModalOpen: boolean;   // Hero scene picker modal
  isDiscordStageModalOpen: boolean; // Discord Stage modal
  isAccountManagerModalOpen: boolean; // Account Manager modal
  isV2Unlocked: boolean;
  devSkipPageModeAndLoader: boolean; // Dev flag to skip pagemode and loader
  isWelcomeScreenActive: boolean;  // Welcome screen active - allows AudioWidget to show
  hasStartedPagemodeAudio: boolean; // Track if user entered pagemode flow - audio persists until content loads

  // Legacy: activeNavbarModal (maps to specific modal states)
  activeNavbarModal: NavbarModalType;

  // Check if any component is open
  isAnyOpen: boolean;

  // Check if any MODAL is open (excludes mobile menu, audio widget, ultimate panel)
  isAnyModalOpen: boolean;

  // Setters with mutual exclusion
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
  setV2Unlocked: (unlocked: boolean) => void;
  setDevSkipPageModeAndLoader: (skip: boolean) => void;
  setWelcomeScreenActive: (active: boolean) => void;

  // Legacy: setNavbarModal (for backwards compatibility)
  setNavbarModal: (modal: NavbarModalType) => void;

  // Convenience methods for opening specific modals
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
  closeNavbarModal: () => void;

  // Close all UI components
  closeAll: () => void;

  // Close all modals but keep floating elements (audio widget pull tab, etc.)
  closeAllModals: () => void;

  // Check which component is currently active
  activeComponent: UIComponentType | null;

  // Signal for audio widget to minimize (not close) when other UI opens
  // This allows the iframe to stay alive behind the pull tab
  shouldMinimizeAudioWidget: boolean;

  // Signal that something is overlaying the floating player (for z-index management)
  hasOverlayingUI: boolean;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  // Core states - all UI components
  const [isMobileMenuOpen, setIsMobileMenuOpenState] = useState(false);
  const [isAudioWidgetOpen, setIsAudioWidgetOpenState] = useState(false);
  const [isUltimatePanelOpen, setIsUltimatePanelOpenState] = useState(false);
  const [isUltimateHubOpen, setIsUltimateHubOpenState] = useState(false);
  const [isFooterOpen, setIsFooterOpenState] = useState(false);
  const [isChartNewsOpen, setIsChartNewsOpenState] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpenState] = useState(false);
  const [isLiveStreamModalOpen, setIsLiveStreamModalOpenState] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpenState] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpenState] = useState(false);
  const [isAffiliateModalOpen, setIsAffiliateModalOpenState] = useState(false);
  const [isThemeSelectorModalOpen, setIsThemeSelectorModalOpenState] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpenState] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpenState] = useState(false);
  const [isAppsModalOpen, setIsAppsModalOpenState] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpenState] = useState(false);
  const [isPagemodeOpen, setIsPagemodeOpenState] = useState(false);
  const [isLoaderv2Open, setIsLoaderv2OpenState] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpenState] = useState(false);
  const [isBullFeedModalOpen, setIsBullFeedModalOpenState] = useState(false);
  const [isPostComposerModalOpen, setIsPostComposerModalOpenState] = useState(false);
  const [isHeroSceneModalOpen, setIsHeroSceneModalOpenState] = useState(false);
  const [isDiscordStageModalOpen, setIsDiscordStageModalOpenState] = useState(false);
  const [isAccountManagerModalOpen, setIsAccountManagerModalOpenState] = useState(false);
  const [isV2Unlocked, setIsV2UnlockedState] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('affiliate_unlock_complete') === 'true'
  );
  const [devSkipPageModeAndLoader, setDevSkipPageModeAndLoaderState] = useState(false);
  const [isWelcomeScreenActive, setIsWelcomeScreenActiveState] = useState(false);
  // Track if user has started audio in pagemode flow - persists through loader transition
  // Only resets when content loads (V2 unlocked)
  const [hasStartedPagemodeAudio, setHasStartedPagemodeAudioState] = useState(false);

  // Derived state: Legacy activeNavbarModal (maps to individual states)
  const activeNavbarModal: NavbarModalType =
    isAdminModalOpen ? 'admin' :
    isFaqModalOpen ? 'faq' :
    isAffiliateModalOpen ? 'affiliate' :
    isThemeSelectorModalOpen ? 'themeSelector' :
    null;

  // Derived state: is any modal open?
  const isAnyModalOpen = isFooterOpen || isChartNewsOpen || isAnalysisModalOpen ||
    isLiveStreamModalOpen || isProductsModalOpen || isServicesModalOpen || isAffiliateModalOpen ||
    isThemeSelectorModalOpen || isAdminModalOpen || isFaqModalOpen ||
    isAppsModalOpen || isDisclaimerModalOpen || isPagemodeOpen || isLoaderv2Open ||
    isAuthModalOpen || isBullFeedModalOpen || isPostComposerModalOpen || isHeroSceneModalOpen || isDiscordStageModalOpen ||
    isAccountManagerModalOpen;

  // Derived state: is any component currently open?
  const isAnyOpen = isMobileMenuOpen || isAudioWidgetOpen || isUltimatePanelOpen || isUltimateHubOpen || isAnyModalOpen;

  // Derived state: modals that DO NOT require audio widget to minimize
  // Discord Stage modal should keep audio widget visible so users can control Discord volume
  // Welcome screen should also keep audio widget visible so users can control music while viewing welcome
  const shouldNotMinimizeForThisModal = isDiscordStageModalOpen || isWelcomeScreenActive;

  // Derived state: should audio widget minimize (not unmount)?
  // True when any other UI component is open that would overlay the player
  // EXCEPTION: Audio widget stays visible during Discord Stage modal so users can control Discord volume
  // EXCEPTION: UltimateHub should NOT close/minimize audio widget - they can coexist
  // NOTE: ChartNews is explicitly included in isAnyModalOpen, so audio widget will minimize when ChartNews opens
  const shouldMinimizeAudioWidget = isMobileMenuOpen || isUltimatePanelOpen ||
    (isAnyModalOpen && !shouldNotMinimizeForThisModal);

  // Derived state: is there UI overlaying the floating player area?
  // UltimateHub doesn't overlay audio widget - they coexist on different sides of the screen
  const hasOverlayingUI = isMobileMenuOpen || (isAnyModalOpen && !shouldNotMinimizeForThisModal);

  // Derived state: which component is active?
  const activeComponent: UIComponentType | null =
    isMobileMenuOpen ? 'mobileMenu' :
    isAudioWidgetOpen ? 'audioWidget' :
    isUltimatePanelOpen ? 'ultimatePanel' :
    isUltimateHubOpen ? 'ultimateHub' :
    isPagemodeOpen ? 'pagemode' :
    isLoaderv2Open ? 'loaderv2' :
    isFooterOpen ? 'footer' :
    isChartNewsOpen ? 'chartnews' :
    isAnalysisModalOpen ? 'analysisModal' :
    isLiveStreamModalOpen ? 'liveStreamModal' :
    isProductsModalOpen ? 'productsModal' :
    isServicesModalOpen ? 'servicesModal' :
    isAffiliateModalOpen ? 'affiliateModal' :
    isThemeSelectorModalOpen ? 'themeSelectorModal' :
    isAdminModalOpen ? 'adminModal' :
    isFaqModalOpen ? 'faqModal' :
    isAppsModalOpen ? 'appsModal' :
    isDisclaimerModalOpen ? 'disclaimerModal' :
    isAuthModalOpen ? 'authModal' :
    isBullFeedModalOpen ? 'bullFeedModal' :
    isPostComposerModalOpen ? 'postComposerModal' :
    isHeroSceneModalOpen ? 'heroSceneModal' :
    isDiscordStageModalOpen ? 'discordStageModal' :
    isAccountManagerModalOpen ? 'accountManagerModal' :
    null;

  // Closes all other components except the one specified
  const closeOthers = useCallback((except?: UIComponentType) => {
    if (except !== 'mobileMenu') setIsMobileMenuOpenState(false);
    if (except !== 'audioWidget') setIsAudioWidgetOpenState(false);
    if (except !== 'ultimatePanel') setIsUltimatePanelOpenState(false);
    if (except !== 'ultimateHub') setIsUltimateHubOpenState(false);
    if (except !== 'footer') setIsFooterOpenState(false);
    if (except !== 'chartnews') setIsChartNewsOpenState(false);
    if (except !== 'analysisModal') setIsAnalysisModalOpenState(false);
    if (except !== 'liveStreamModal') setIsLiveStreamModalOpenState(false);
    if (except !== 'productsModal') setIsProductsModalOpenState(false);
    if (except !== 'servicesModal') setIsServicesModalOpenState(false);
    if (except !== 'affiliateModal') setIsAffiliateModalOpenState(false);
    if (except !== 'themeSelectorModal') setIsThemeSelectorModalOpenState(false);
    if (except !== 'adminModal') setIsAdminModalOpenState(false);
    if (except !== 'faqModal') setIsFaqModalOpenState(false);
    if (except !== 'appsModal') setIsAppsModalOpenState(false);
    if (except !== 'disclaimerModal') setIsDisclaimerModalOpenState(false);
    if (except !== 'pagemode') setIsPagemodeOpenState(false);
    if (except !== 'loaderv2') setIsLoaderv2OpenState(false);
    if (except !== 'authModal') setIsAuthModalOpenState(false);
    if (except !== 'bullFeedModal') setIsBullFeedModalOpenState(false);
    if (except !== 'postComposerModal') setIsPostComposerModalOpenState(false);
    if (except !== 'heroSceneModal') setIsHeroSceneModalOpenState(false);
    if (except !== 'discordStageModal') setIsDiscordStageModalOpenState(false);
    if (except !== 'accountManagerModal') setIsAccountManagerModalOpenState(false);
  }, []);

  // Closes all modals but preserves floating elements state
  const closeAllModals = useCallback(() => {
    setIsFooterOpenState(false);
    setIsChartNewsOpenState(false);
    setIsAnalysisModalOpenState(false);
    setIsLiveStreamModalOpenState(false);
    setIsProductsModalOpenState(false);
    setIsServicesModalOpenState(false);
    setIsAffiliateModalOpenState(false);
    setIsThemeSelectorModalOpenState(false);
    setIsAdminModalOpenState(false);
    setIsFaqModalOpenState(false);
    setIsAppsModalOpenState(false);
    setIsDisclaimerModalOpenState(false);
    setIsPagemodeOpenState(false);
    setIsLoaderv2OpenState(false);
    setIsAuthModalOpenState(false);
    setIsBullFeedModalOpenState(false);
    setIsPostComposerModalOpenState(false);
    setIsHeroSceneModalOpenState(false);
    setIsDiscordStageModalOpenState(false);
    setIsAccountManagerModalOpenState(false);
  }, []);

  // Closes all components
  const closeAll = useCallback(() => {
    closeOthers();
  }, [closeOthers]);

  // --- Setters with built-in mutual exclusion and analytics tracking ---

  const setMobileMenuOpen = useCallback((open: boolean) => {
    if (open) {
      // Mobile menu has highest priority - closes everything else
      closeOthers('mobileMenu');
      trackUIStateChange('mobileMenu', 'open');
    } else {
      trackUIStateChange('mobileMenu', 'close');
    }
    setIsMobileMenuOpenState(open);
  }, [closeOthers]);

  const setAudioWidgetOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('audioWidget');
      trackUIStateChange('audioWidget', 'open');
    } else {
      trackUIStateChange('audioWidget', 'close');
    }
    setIsAudioWidgetOpenState(open);
  }, [closeOthers]);

  const setUltimatePanelOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('ultimatePanel');
      trackUIStateChange('ultimatePanel', 'open');
    } else {
      trackUIStateChange('ultimatePanel', 'close');
    }
    setIsUltimatePanelOpenState(open);
  }, [closeOthers]);

  const setUltimateHubOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('ultimateHub');
      trackUIStateChange('ultimateHub', 'open');
    } else {
      trackUIStateChange('ultimateHub', 'close');
    }
    setIsUltimateHubOpenState(open);
  }, [closeOthers]);

  const setFooterOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('footer');
      trackUIStateChange('footer', 'open');
    } else {
      trackUIStateChange('footer', 'close');
    }
    setIsFooterOpenState(open);
  }, [closeOthers]);

  const setChartNewsOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('chartnews');
      trackUIStateChange('chartNews', 'open');
    } else {
      trackUIStateChange('chartNews', 'close');
    }
    setIsChartNewsOpenState(open);
  }, [closeOthers]);

  const setAnalysisModalOpen = useCallback((open: boolean) => {
    console.log('[UIStateContext] setAnalysisModalOpen called with:', open);
    if (open) {
      closeOthers('analysisModal');
      trackUIStateChange('analysisModal', 'open');
    } else {
      trackUIStateChange('analysisModal', 'close');
    }
    setIsAnalysisModalOpenState(open);
  }, [closeOthers]);

  const setLiveStreamModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('liveStreamModal');
      trackUIStateChange('liveStreamModal', 'open');
    } else {
      trackUIStateChange('liveStreamModal', 'close');
    }
    setIsLiveStreamModalOpenState(open);
  }, [closeOthers]);

  const setProductsModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('productsModal');
      trackUIStateChange('productsModal', 'open');
    } else {
      trackUIStateChange('productsModal', 'close');
    }
    setIsProductsModalOpenState(open);
  }, [closeOthers]);

  const setServicesModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('servicesModal');
      trackUIStateChange('servicesModal', 'open');
    } else {
      trackUIStateChange('servicesModal', 'close');
    }
    setIsServicesModalOpenState(open);
  }, [closeOthers]);

  const setAffiliateModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('affiliateModal');
      trackUIStateChange('affiliateModal', 'open');
    } else {
      trackUIStateChange('affiliateModal', 'close');
    }
    setIsAffiliateModalOpenState(open);
  }, [closeOthers]);

  const setThemeSelectorModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('themeSelectorModal');
      trackUIStateChange('themeSelectorModal', 'open');
    } else {
      trackUIStateChange('themeSelectorModal', 'close');
    }
    setIsThemeSelectorModalOpenState(open);
  }, [closeOthers]);

  const setAdminModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('adminModal');
      trackUIStateChange('adminModal', 'open');
    } else {
      trackUIStateChange('adminModal', 'close');
    }
    setIsAdminModalOpenState(open);
  }, [closeOthers]);

  const setFaqModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('faqModal');
      trackUIStateChange('faqModal', 'open');
    } else {
      trackUIStateChange('faqModal', 'close');
    }
    setIsFaqModalOpenState(open);
  }, [closeOthers]);

  const setAppsModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('appsModal');
      trackUIStateChange('appsModal', 'open');
    } else {
      trackUIStateChange('appsModal', 'close');
    }
    setIsAppsModalOpenState(open);
  }, [closeOthers]);

  const setDisclaimerModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('disclaimerModal');
      trackUIStateChange('disclaimerModal', 'open');
    } else {
      trackUIStateChange('disclaimerModal', 'close');
    }
    setIsDisclaimerModalOpenState(open);
  }, [closeOthers]);

  const setPagemodeOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('pagemode');
      trackUIStateChange('pagemode', 'open');
      // Mark that user has entered pagemode - audio should persist until content loads
      setHasStartedPagemodeAudioState(true);
    } else {
      trackUIStateChange('pagemode', 'close');
    }
    setIsPagemodeOpenState(open);
  }, [closeOthers]);

  const setLoaderv2Open = useCallback((open: boolean) => {
    if (open) {
      closeOthers('loaderv2');
      trackUIStateChange('loaderV2', 'open');
    } else {
      trackUIStateChange('loaderV2', 'close');
    }
    setIsLoaderv2OpenState(open);
  }, [closeOthers]);

  const setAuthModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('authModal');
      trackUIStateChange('authModal', 'open');
    } else {
      trackUIStateChange('authModal', 'close');
    }
    setIsAuthModalOpenState(open);
  }, [closeOthers]);

  const setBullFeedModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('bullFeedModal');
      trackUIStateChange('bullFeedModal', 'open');
    } else {
      trackUIStateChange('bullFeedModal', 'close');
    }
    setIsBullFeedModalOpenState(open);
  }, [closeOthers]);

  const setPostComposerModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('postComposerModal');
      trackUIStateChange('postComposerModal', 'open');
    } else {
      trackUIStateChange('postComposerModal', 'close');
    }
    setIsPostComposerModalOpenState(open);
  }, [closeOthers]);

  const setHeroSceneModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('heroSceneModal');
      trackUIStateChange('heroSceneModal', 'open');
    } else {
      trackUIStateChange('heroSceneModal', 'close');
    }
    setIsHeroSceneModalOpenState(open);
  }, [closeOthers]);

  const setDiscordStageModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('discordStageModal');
      trackUIStateChange('discordStageModal', 'open');
    } else {
      trackUIStateChange('discordStageModal', 'close');
    }
    setIsDiscordStageModalOpenState(open);
  }, [closeOthers]);

  const setAccountManagerModalOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('accountManagerModal');
      trackUIStateChange('accountManagerModal', 'open');
    } else {
      trackUIStateChange('accountManagerModal', 'close');
    }
    setIsAccountManagerModalOpenState(open);
  }, [closeOthers]);

  const setV2Unlocked = useCallback((unlocked: boolean) => {
    setIsV2UnlockedState(unlocked);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('affiliate_unlock_complete', String(unlocked));
    }
    // Reset pagemode audio tracking when content loads - audio widget handles itself now
    if (unlocked) {
      setHasStartedPagemodeAudioState(false);
    }
  }, []);

  const setDevSkipPageModeAndLoader = useCallback((skip: boolean) => {
    setDevSkipPageModeAndLoaderState(skip);
    if (skip) {
      console.log('[DevSkip] Skipping pagemode and loader - going directly to content');
    }
  }, []);

  // Legacy: setNavbarModal for backwards compatibility
  const setNavbarModal = useCallback((modal: NavbarModalType) => {
    // Close all navbar-type modals first
    setIsAdminModalOpenState(false);
    setIsFaqModalOpenState(false);
    setIsAffiliateModalOpenState(false);
    setIsThemeSelectorModalOpenState(false);

    if (modal !== null) {
      closeOthers(
        modal === 'admin' ? 'adminModal' :
        modal === 'faq' ? 'faqModal' :
        modal === 'affiliate' ? 'affiliateModal' :
        'themeSelectorModal'
      );

      switch (modal) {
        case 'admin':
          setIsAdminModalOpenState(true);
          break;
        case 'faq':
          setIsFaqModalOpenState(true);
          break;
        case 'affiliate':
          setIsAffiliateModalOpenState(true);
          break;
        case 'themeSelector':
          setIsThemeSelectorModalOpenState(true);
          break;
      }
    }
  }, [closeOthers]);

  // Convenience methods for opening specific modals
  const openAdminModal = useCallback(() => setAdminModalOpen(true), [setAdminModalOpen]);
  const openFaqModal = useCallback(() => setFaqModalOpen(true), [setFaqModalOpen]);
  const openAffiliateModal = useCallback(() => setAffiliateModalOpen(true), [setAffiliateModalOpen]);
  const openThemeSelectorModal = useCallback(() => setThemeSelectorModalOpen(true), [setThemeSelectorModalOpen]);
  const openAnalysisModal = useCallback(() => setAnalysisModalOpen(true), [setAnalysisModalOpen]);
  const openLiveStreamModal = useCallback(() => setLiveStreamModalOpen(true), [setLiveStreamModalOpen]);
  const openProductsModal = useCallback(() => setProductsModalOpen(true), [setProductsModalOpen]);
  const openServicesModal = useCallback(() => setServicesModalOpen(true), [setServicesModalOpen]);
  const openAuthModal = useCallback(() => setAuthModalOpen(true), [setAuthModalOpen]);
  const openBullFeedModal = useCallback(() => setBullFeedModalOpen(true), [setBullFeedModalOpen]);
  const openPostComposerModal = useCallback(() => setPostComposerModalOpen(true), [setPostComposerModalOpen]);
  const openHeroSceneModal = useCallback(() => setHeroSceneModalOpen(true), [setHeroSceneModalOpen]);
  const openDiscordStageModal = useCallback(() => setDiscordStageModalOpen(true), [setDiscordStageModalOpen]);
  const openAccountManagerModal = useCallback(() => setAccountManagerModalOpen(true), [setAccountManagerModalOpen]);
  const closeNavbarModal = useCallback(() => {
    setIsAdminModalOpenState(false);
    setIsFaqModalOpenState(false);
    setIsAffiliateModalOpenState(false);
    setIsThemeSelectorModalOpenState(false);
  }, []);

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

  // DESKTOP FIX: Add/remove body classes and data attributes for CSS targeting
  // This helps the desktop z-index fix CSS work properly
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const body = document.body;
    const html = document.documentElement;
    
    // Add data attributes for CSS targeting
    if (isAnyModalOpen) {
      body.classList.add('modal-open');
      body.setAttribute('data-modal-open', 'true');
      html.setAttribute('data-modal-open', 'true');
      // Prevent scroll when modal is open
      body.style.overflow = 'hidden';
    } else {
      body.classList.remove('modal-open');
      body.removeAttribute('data-modal-open');
      html.removeAttribute('data-modal-open');
      // Restore scroll
      body.style.overflow = '';
    }
    
    if (isMobileMenuOpen) {
      body.classList.add('menu-open');
      body.setAttribute('data-menu-open', 'true');
      html.setAttribute('data-menu-open', 'true');
    } else {
      body.classList.remove('menu-open');
      body.removeAttribute('data-menu-open');
      html.removeAttribute('data-menu-open');
    }
    
    // Set active component data attribute for debugging
    if (activeComponent) {
      body.setAttribute('data-active-ui', activeComponent);
    } else {
      body.removeAttribute('data-active-ui');
    }
    
    return () => {
      // Cleanup on unmount
      body.classList.remove('modal-open', 'menu-open');
      body.removeAttribute('data-modal-open');
      body.removeAttribute('data-menu-open');
      body.removeAttribute('data-active-ui');
      html.removeAttribute('data-modal-open');
      html.removeAttribute('data-menu-open');
      body.style.overflow = '';
    };
  }, [isAnyModalOpen, isMobileMenuOpen, activeComponent]);
  const value: UIStateContextType = {
    // States
    isMobileMenuOpen,
    isAudioWidgetOpen,
    isUltimatePanelOpen,
    isUltimateHubOpen,
    isFooterOpen,
    isChartNewsOpen,
    isAnalysisModalOpen,
    isLiveStreamModalOpen,
    isProductsModalOpen,
    isServicesModalOpen,
    isAffiliateModalOpen,
    isThemeSelectorModalOpen,
    isAdminModalOpen,
    isFaqModalOpen,
    isAppsModalOpen,
    isDisclaimerModalOpen,
    isPagemodeOpen,
    isLoaderv2Open,
    isAuthModalOpen,
    isBullFeedModalOpen,
    isPostComposerModalOpen,
    isHeroSceneModalOpen,
    isDiscordStageModalOpen,
    isAccountManagerModalOpen,
    isV2Unlocked,
    devSkipPageModeAndLoader,
    isWelcomeScreenActive,
    hasStartedPagemodeAudio,
    activeNavbarModal,
    isAnyOpen,
    isAnyModalOpen,
    activeComponent,
    shouldMinimizeAudioWidget,
    hasOverlayingUI,

    // Setters
    setMobileMenuOpen,
    setAudioWidgetOpen,
    setUltimatePanelOpen,
    setUltimateHubOpen,
    setFooterOpen,
    setChartNewsOpen,
    setAnalysisModalOpen,
    setLiveStreamModalOpen,
    setProductsModalOpen,
    setServicesModalOpen,
    setAffiliateModalOpen,
    setThemeSelectorModalOpen,
    setAdminModalOpen,
    setFaqModalOpen,
    setAppsModalOpen,
    setDisclaimerModalOpen,
    setPagemodeOpen,
    setLoaderv2Open,
    setAuthModalOpen,
    setBullFeedModalOpen,
    setPostComposerModalOpen,
    setHeroSceneModalOpen,
    setDiscordStageModalOpen,
    setAccountManagerModalOpen,
    setV2Unlocked,
    setDevSkipPageModeAndLoader,
    setWelcomeScreenActive: setIsWelcomeScreenActiveState,
    setNavbarModal,

    // Convenience methods
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    openAnalysisModal,
    openLiveStreamModal,
    openProductsModal,
    openServicesModal,
    openAuthModal,
    openBullFeedModal,
    openPostComposerModal,
    openHeroSceneModal,
    openDiscordStageModal,
    openAccountManagerModal,
    closeNavbarModal,
    closeAll,
    closeAllModals,
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
    shouldMinimizeAudioWidget,
    hasOverlayingUI,
    isPagemodeOpen,
    isLoaderv2Open,
    isV2Unlocked,
    isWelcomeScreenActive,
    hasStartedPagemodeAudio,
  } = useUIState();

  // IMPORTANT: We no longer return shouldHideFloatingPlayer that causes unmount.
  // Instead, we return shouldMinimizeAudioWidget which signals the floating player
  // to minimize (hide iframe behind pull tab) while keeping audio playing.

  // For backwards compatibility, keep the old name but with new behavior
  // shouldHideFloatingPlayer now means "minimize" not "unmount"
  const shouldHideFloatingPlayer = shouldMinimizeAudioWidget;

  // AUDIO PERSISTENCE STRATEGY:
  // 1. Welcome screen (step -1, -2): Show full AudioWidget (MainWidget + FloatingPlayer)
  // 2. Registration/Login (step 0+): Show minimized FloatingPlayer only (audio continues)
  // 3. Loader during pagemode flow: Keep FloatingPlayer mounted but hidden (audio continues!)
  // 4. Main content: Show full AudioWidget
  //
  // shouldHideAudioWidgetCompletely = true means the ENTIRE widget is hidden (iframe unmounts, audio stops)
  // shouldHideAudioWidgetCompletely = false means at least the FloatingPlayer shows (audio persists)
  //
  // CRITICAL: Audio must persist throughout the ENTIRE pagemode flow (welcome -> registration -> loader -> content)
  // hasStartedPagemodeAudio is set when pagemode opens and only cleared when V2 unlocks (content loads)
  // This ensures the iframe stays mounted even during the loader transition
  //
  // Logic:
  // - Hide completely ONLY if: (loader is open AND user never entered pagemode) OR (not unlocked AND not in pagemode/welcome AND never started pagemode audio)
  // - In other words: Keep showing (mounted) if user has started the pagemode flow at any point
  const isInPagemodeFlow = isPagemodeOpen || isWelcomeScreenActive || hasStartedPagemodeAudio;
  const shouldHideAudioWidgetCompletely = !isInPagemodeFlow && !isV2Unlocked;

  // NEW: shouldHideMainWidget - hides MainWidget (settings panel) but keeps FloatingPlayer for audio
  // During pagemode registration (not welcome screen), hide the settings but keep audio playing
  // Also hide during loader (but keep FloatingPlayer for audio persistence)
  const shouldHideMainWidget = (isPagemodeOpen && !isWelcomeScreenActive) || isLoaderv2Open;

  return {
    isAudioWidgetOpen,
    setAudioWidgetOpen,
    shouldHideFloatingPlayer,
    shouldMinimizeAudioWidget,
    hasOverlayingUI,
    isPagemodeOpen,
    isLoaderv2Open,
    isV2Unlocked,
    shouldHideAudioWidgetCompletely,
    shouldHideMainWidget,
    isWelcomeScreenActive,
  };
}

export function useUltimatePanelUI() {
  const {
    isUltimatePanelOpen,
    setUltimatePanelOpen,
    isMobileMenuOpen,
    isAnyModalOpen,
  } = useUIState();

  // The panel should be hidden if mobile menu or any modal is open
  const shouldHide = isMobileMenuOpen || isAnyModalOpen;
  const shouldShow = isUltimatePanelOpen && !shouldHide;

  return {
    isUltimatePanelOpen,
    setUltimatePanelOpen,
    shouldShow,
    shouldHide,
  };
}

export function useUltimateHubUI() {
  const {
    isUltimateHubOpen,
    setUltimateHubOpen,
    isMobileMenuOpen,
    isUltimatePanelOpen,
    isAudioWidgetOpen,
    isAnyModalOpen,
    isPagemodeOpen,
    isLoaderv2Open,
  } = useUIState();

  // The hub should be hidden if any other UI element is open
  const shouldHide = isMobileMenuOpen || isUltimatePanelOpen || isAudioWidgetOpen || isAnyModalOpen || isPagemodeOpen || isLoaderv2Open;
  const shouldShow = isUltimateHubOpen && !shouldHide;

  return {
    isUltimateHubOpen,
    setUltimateHubOpen,
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
    openAnalysisModal,
    openAccountManagerModal,
    closeNavbarModal,
    isAdminModalOpen,
    isFaqModalOpen,
    isAffiliateModalOpen,
    isThemeSelectorModalOpen,
    isAnalysisModalOpen,
    isAccountManagerModalOpen,
  } = useUIState();

  return {
    activeNavbarModal,
    isAdminOpen: isAdminModalOpen,
    isFaqOpen: isFaqModalOpen,
    isAffiliateOpen: isAffiliateModalOpen,
    isThemeSelectorOpen: isThemeSelectorModalOpen,
    isAnalysisOpen: isAnalysisModalOpen,
    isAccountManagerOpen: isAccountManagerModalOpen,
    setNavbarModal,
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    openAnalysisModal,
    openAccountManagerModal,
    closeNavbarModal,
  };
}

// Convenience hooks for individual modals
export function useFooterUI() {
  const { isFooterOpen, setFooterOpen } = useUIState();
  return { isFooterOpen, setFooterOpen };
}

export function useChartNewsUI() {
  const { isChartNewsOpen, setChartNewsOpen } = useUIState();
  return { isChartNewsOpen, setChartNewsOpen };
}

export function useAnalysisModalUI() {
  const { isAnalysisModalOpen, setAnalysisModalOpen, openAnalysisModal } = useUIState();
  return { isOpen: isAnalysisModalOpen, setIsOpen: setAnalysisModalOpen, open: openAnalysisModal };
}

export function useLiveStreamModalUI() {
  const { isLiveStreamModalOpen, setLiveStreamModalOpen, openLiveStreamModal } = useUIState();
  return { isOpen: isLiveStreamModalOpen, setIsOpen: setLiveStreamModalOpen, open: openLiveStreamModal };
}

export function useProductsModalUI() {
  const { isProductsModalOpen, setProductsModalOpen, openProductsModal } = useUIState();
  return { isOpen: isProductsModalOpen, setIsOpen: setProductsModalOpen, open: openProductsModal };
}

export function useServicesModalUI() {
  const { isServicesModalOpen, setServicesModalOpen, openServicesModal } = useUIState();
  return { isOpen: isServicesModalOpen, setIsOpen: setServicesModalOpen, open: openServicesModal };
}

export function useAffiliateModalUI() {
  const { isAffiliateModalOpen, setAffiliateModalOpen, openAffiliateModal } = useUIState();
  return { isOpen: isAffiliateModalOpen, setIsOpen: setAffiliateModalOpen, open: openAffiliateModal };
}

export function useThemeSelectorModalUI() {
  const { isThemeSelectorModalOpen, setThemeSelectorModalOpen, openThemeSelectorModal } = useUIState();
  return { isOpen: isThemeSelectorModalOpen, setIsOpen: setThemeSelectorModalOpen, open: openThemeSelectorModal };
}

export function useAdminModalUI() {
  const { isAdminModalOpen, setAdminModalOpen, openAdminModal } = useUIState();
  return { isOpen: isAdminModalOpen, setIsOpen: setAdminModalOpen, open: openAdminModal };
}

export function useFaqModalUI() {
  const { isFaqModalOpen, setFaqModalOpen, openFaqModal } = useUIState();
  return { isOpen: isFaqModalOpen, setIsOpen: setFaqModalOpen, open: openFaqModal };
}

// Footer modal hooks
export function useAppsModalUI() {
  const { isAppsModalOpen, setAppsModalOpen } = useUIState();
  return { isOpen: isAppsModalOpen, setIsOpen: setAppsModalOpen };
}

export function useDisclaimerModalUI() {
  const { isDisclaimerModalOpen, setDisclaimerModalOpen } = useUIState();
  return { isOpen: isDisclaimerModalOpen, setIsOpen: setDisclaimerModalOpen };
}

// Combined footer modals hook for convenience
export function useFooterModalsUI() {
  const {
    isAppsModalOpen,
    isDisclaimerModalOpen,
    setAppsModalOpen,
    setDisclaimerModalOpen,
  } = useUIState();

  return {
    isAppsOpen: isAppsModalOpen,
    isDisclaimerOpen: isDisclaimerModalOpen,
    setAppsOpen: setAppsModalOpen,
    setDisclaimerOpen: setDisclaimerModalOpen,
  };
}

// Bull Feed modal hooks
export function useAuthModalUI() {
  const { isAuthModalOpen, setAuthModalOpen, openAuthModal } = useUIState();
  return { isOpen: isAuthModalOpen, setIsOpen: setAuthModalOpen, open: openAuthModal };
}

export function useBullFeedModalUI() {
  const { isBullFeedModalOpen, setBullFeedModalOpen, openBullFeedModal } = useUIState();
  return { isOpen: isBullFeedModalOpen, setIsOpen: setBullFeedModalOpen, open: openBullFeedModal };
}

export function usePostComposerModalUI() {
  const { isPostComposerModalOpen, setPostComposerModalOpen, openPostComposerModal } = useUIState();
  return { isOpen: isPostComposerModalOpen, setIsOpen: setPostComposerModalOpen, open: openPostComposerModal };
}

export function useHeroSceneModalUI() {
  const { isHeroSceneModalOpen, setHeroSceneModalOpen, openHeroSceneModal } = useUIState();
  return { isOpen: isHeroSceneModalOpen, setIsOpen: setHeroSceneModalOpen, open: openHeroSceneModal };
}

export function useDiscordStageModalUI() {
  const { isDiscordStageModalOpen, setDiscordStageModalOpen, openDiscordStageModal } = useUIState();
  return { isOpen: isDiscordStageModalOpen, setIsOpen: setDiscordStageModalOpen, open: openDiscordStageModal };
}

