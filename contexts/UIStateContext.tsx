"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
// ✅ LAZY: analytics (443 lines) and SoundEffects (658 lines) loaded on-demand via import()
// They're only used inside useCallback setters, never during initial render
type AnalyticsEventData = { component: string; action: string; [key: string]: any };
let _analytics: any = null;
let _soundEffects: any = null;

const getAnalytics = () => {
  if (!_analytics) {
    import('@/lib/analytics').then(mod => { _analytics = mod; });
  }
  return _analytics;
};
const getSoundEffects = () => {
  if (!_soundEffects) {
    import('@/app/hooks/useSoundEffects').then(mod => { _soundEffects = mod.SoundEffects; });
  }
  return _soundEffects;
};
// Import the shared context instance + types from the lightweight hook file
import { UIStateContext, useUIState, type UIStateContextType, type UIComponentType, type NavbarModalType, UI_Z_INDEX } from './UIStateHook';
// Re-export everything from the hook file so existing imports still work
export { useUIState, UIStateContext, UI_Z_INDEX, useProductsModalUI, useMobileMenu } from './UIStateHook';
export type { UIStateContextType, UIComponentType, NavbarModalType } from './UIStateHook';

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

// Types, constants, and context are now defined in UIStateHook.ts
// and imported at the top of this file. Re-exported for backwards compatibility.

// Context is now created in UIStateHook.ts — shared across provider and consumers

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
  const [isBgPickerModalOpen, setIsBgPickerModalOpenState] = useState(false);
  const [isColorPickerModalOpen, setIsColorPickerModalOpenState] = useState(false);
  const [isSplinePanelModalOpen, setIsSplinePanelModalOpenState] = useState(false);
  const [isStoreMobileMenuOpen, setIsStoreMobileMenuOpenState] = useState(false);
  const [isStoreDesktopMenuOpen, setIsStoreDesktopMenuOpenState] = useState(false);
  const [isStoreDropdownMenuOpen, setIsStoreDropdownMenuOpenState] = useState(false);
  const [isSupportDrawerOpen, setIsSupportDrawerOpenState] = useState(false);
  const [isGamesDrawerOpen, setIsGamesDrawerOpenState] = useState(false);
  const [isCourseDrawerOpen, setIsCourseDrawerOpenState] = useState(false);
  const [isSocialsDrawerOpen, setIsSocialsDrawerOpenState] = useState(false);
  const [isV2Unlocked, setIsV2UnlockedState] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('affiliate_unlock_complete') === 'true'
  );
  const [devSkipPageModeAndLoader, setDevSkipPageModeAndLoaderState] = useState(false);
  const [isWelcomeScreenActive, setIsWelcomeScreenActiveState] = useState(false);
  // Mobile navbar hidden on scroll - UltimateHub pill expands to full width
  const [isMobileNavbarHidden, setIsMobileNavbarHiddenState] = useState(false);
  const [shouldSkipHeavyEffects, setShouldSkipHeavyEffectsState] = useState(false);
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
    isAccountManagerModalOpen || isBgPickerModalOpen || isColorPickerModalOpen || isSplinePanelModalOpen ||
    isStoreMobileMenuOpen || isStoreDesktopMenuOpen || isStoreDropdownMenuOpen ||
    isSupportDrawerOpen || isGamesDrawerOpen || isCourseDrawerOpen || isSocialsDrawerOpen;

  // Derived state: is any component currently open?
  const isAnyOpen = isMobileMenuOpen || isAudioWidgetOpen || isUltimatePanelOpen || isUltimateHubOpen || isAnyModalOpen;

  // Derived state: modals that DO NOT require audio widget to minimize
  // Discord Stage modal should keep audio widget visible so users can control Discord volume
  // Welcome screen should also keep audio widget visible so users can control music while viewing welcome
  // Mobile menu should NOT minimize audio widget - it can coexist
  const shouldNotMinimizeForThisModal = isDiscordStageModalOpen || isWelcomeScreenActive || isMobileMenuOpen || isGamesDrawerOpen;

  // Viewport detection is required inside the provider because Next may hydrate on
  // the server first. Default to desktop to avoid SSR mismatches.
  const isDesktopViewport = typeof window === 'undefined'
    ? true
    : window.matchMedia('(min-width: 768px)').matches;

  // Derived state: should audio widget minimize (not unmount)?
  // True when any other UI component is open that would overlay the player
  // EXCEPTION: Audio widget stays visible during Discord Stage modal so users can control Discord volume
  // EXCEPTION: Audio widget stays visible during Mobile Menu/Navbar - they coexist
  // NOTE: ChartNews is explicitly included in isAnyModalOpen, so audio widget will minimize when ChartNews opens
  // Ultimate Hub overlays a large portion of the screen on mobile, so only minimize there
  const shouldMinimizeAudioWidget = (isAnyModalOpen && !shouldNotMinimizeForThisModal) || (!isDesktopViewport && isUltimateHubOpen);

  // Shared performance flag for animation/effect-heavy UI.
  // Skip heavy effects on mobile and for users who prefer reduced motion.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncValue = () => {
      setShouldSkipHeavyEffectsState(mobileQuery.matches || reducedMotionQuery.matches);
    };

    syncValue();

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', syncValue);
      reducedMotionQuery.addEventListener('change', syncValue);
    } else {
      mobileQuery.addListener(syncValue);
      reducedMotionQuery.addListener(syncValue);
    }

    return () => {
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', syncValue);
        reducedMotionQuery.removeEventListener('change', syncValue);
      } else {
        mobileQuery.removeListener(syncValue);
        reducedMotionQuery.removeListener(syncValue);
      }
    };
  }, []);

  // Derived state: is there UI overlaying the floating player area?
  // Mobile menu, Ultimate Hub, and Ultimate Panel don't overlay audio widget - they coexist
  const hasOverlayingUI = (isAnyModalOpen && !shouldNotMinimizeForThisModal) || isUltimateHubOpen;

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
    isCourseDrawerOpen ? 'courseDrawer' :
    isSocialsDrawerOpen ? 'socialsDrawer' :
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
    isBgPickerModalOpen ? 'bgPickerModal' :
    isColorPickerModalOpen ? 'colorPickerModal' :
    isSplinePanelModalOpen ? 'splinePanelModal' :
    isStoreMobileMenuOpen ? 'storeMobileMenu' :
    isStoreDesktopMenuOpen ? 'storeDesktopMenu' :
    isStoreDropdownMenuOpen ? 'storeDropdownMenu' :
    isSupportDrawerOpen ? 'supportDrawer' :
    isGamesDrawerOpen ? 'gamesDrawer' :
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
    if (except !== 'bgPickerModal') setIsBgPickerModalOpenState(false);
    if (except !== 'colorPickerModal') setIsColorPickerModalOpenState(false);
    if (except !== 'splinePanelModal') setIsSplinePanelModalOpenState(false);
    if (except !== 'storeMobileMenu') setIsStoreMobileMenuOpenState(false);
    if (except !== 'storeDesktopMenu') setIsStoreDesktopMenuOpenState(false);
    if (except !== 'storeDropdownMenu') setIsStoreDropdownMenuOpenState(false);
    if (except !== 'supportDrawer') setIsSupportDrawerOpenState(false);
    if (except !== 'gamesDrawer') setIsGamesDrawerOpenState(false);
    if (except !== 'courseDrawer') setIsCourseDrawerOpenState(false);
    if (except !== 'socialsDrawer') setIsSocialsDrawerOpenState(false);
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
    setIsBgPickerModalOpenState(false);
    setIsColorPickerModalOpenState(false);
    setIsSplinePanelModalOpenState(false);
    setIsStoreMobileMenuOpenState(false);
    setIsStoreDesktopMenuOpenState(false);
    setIsStoreDropdownMenuOpenState(false);
    setIsSupportDrawerOpenState(false);
    setIsGamesDrawerOpenState(false);
    setIsCourseDrawerOpenState(false);
    setIsSocialsDrawerOpenState(false);
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
      getAnalytics()?.trackUIStateChange('mobileMenu', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('mobileMenu', 'close');
      getSoundEffects()?.close();
    }
    setIsMobileMenuOpenState(open);
  }, [closeOthers]);

  const setAudioWidgetOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('audioWidget');
      getAnalytics()?.trackUIStateChange('audioWidget', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('audioWidget', 'close');
      getSoundEffects()?.close();
    }
    setIsAudioWidgetOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setUltimatePanelOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('ultimatePanel');
      getAnalytics()?.trackUIStateChange('ultimatePanel', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('ultimatePanel', 'close');
      getSoundEffects()?.close();
    }
    setIsUltimatePanelOpenState(open);
  }, [closeOthers]);

  const setUltimateHubOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('ultimateHub');
      getAnalytics()?.trackUIStateChange('ultimateHub', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('ultimateHub', 'close');
      getSoundEffects()?.close();
    }
    setIsUltimateHubOpenState(open);
  }, [closeOthers]);

  const setFooterOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('footer');
      getAnalytics()?.trackUIStateChange('footer', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('footer', 'close');
      getSoundEffects()?.close();
    }
    setIsFooterOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setChartNewsOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('chartnews');
      getAnalytics()?.trackUIStateChange('chartNews', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('chartNews', 'close');
      getSoundEffects()?.close();
    }
    setIsChartNewsOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setAnalysisModalOpen = useCallback((open: boolean) => {
    console.log('[UIStateContext] setAnalysisModalOpen called with:', open);
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('analysisModal');
      getAnalytics()?.trackUIStateChange('analysisModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('analysisModal', 'close');
      getSoundEffects()?.close();
    }
    setIsAnalysisModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setLiveStreamModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('liveStreamModal');
      getAnalytics()?.trackUIStateChange('liveStreamModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('liveStreamModal', 'close');
      getSoundEffects()?.close();
    }
    setIsLiveStreamModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setProductsModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('productsModal');
      getAnalytics()?.trackUIStateChange('productsModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('productsModal', 'close');
      getSoundEffects()?.close();
    }
    setIsProductsModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setServicesModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('servicesModal');
      getAnalytics()?.trackUIStateChange('servicesModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('servicesModal', 'close');
      getSoundEffects()?.close();
    }
    setIsServicesModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setAffiliateModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('affiliateModal');
      getAnalytics()?.trackUIStateChange('affiliateModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('affiliateModal', 'close');
      getSoundEffects()?.close();
    }
    setIsAffiliateModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setThemeSelectorModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('themeSelectorModal');
      getAnalytics()?.trackUIStateChange('themeSelectorModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('themeSelectorModal', 'close');
      getSoundEffects()?.close();
    }
    setIsThemeSelectorModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setAdminModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('adminModal');
      getAnalytics()?.trackUIStateChange('adminModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('adminModal', 'close');
      getSoundEffects()?.close();
    }
    setIsAdminModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setFaqModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('faqModal');
      getAnalytics()?.trackUIStateChange('faqModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('faqModal', 'close');
      getSoundEffects()?.close();
    }
    setIsFaqModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setAppsModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('appsModal');
      getAnalytics()?.trackUIStateChange('appsModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('appsModal', 'close');
      getSoundEffects()?.close();
    }
    setIsAppsModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setDisclaimerModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('disclaimerModal');
      getAnalytics()?.trackUIStateChange('disclaimerModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('disclaimerModal', 'close');
      getSoundEffects()?.close();
    }
    setIsDisclaimerModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setPagemodeOpen = useCallback((open: boolean) => {
    if (open) {
      closeOthers('pagemode');
      getAnalytics()?.trackUIStateChange('pagemode', 'open');
      // Mark that user has entered pagemode - audio should persist until content loads
      setHasStartedPagemodeAudioState(true);
    } else {
      getAnalytics()?.trackUIStateChange('pagemode', 'close');
    }
    setIsPagemodeOpenState(open);
  }, [closeOthers]);

  const setLoaderv2Open = useCallback((open: boolean) => {
    if (open) {
      closeOthers('loaderv2');
      getAnalytics()?.trackUIStateChange('loaderV2', 'open');
    } else {
      getAnalytics()?.trackUIStateChange('loaderV2', 'close');
    }
    setIsLoaderv2OpenState(open);
  }, [closeOthers]);

  const setAuthModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('authModal');
      getAnalytics()?.trackUIStateChange('authModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('authModal', 'close');
      getSoundEffects()?.close();
    }
    setIsAuthModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setBullFeedModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('bullFeedModal');
      getAnalytics()?.trackUIStateChange('bullFeedModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('bullFeedModal', 'close');
      getSoundEffects()?.close();
    }
    setIsBullFeedModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setPostComposerModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('postComposerModal');
      getAnalytics()?.trackUIStateChange('postComposerModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('postComposerModal', 'close');
      getSoundEffects()?.close();
    }
    setIsPostComposerModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setHeroSceneModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('heroSceneModal');
      getAnalytics()?.trackUIStateChange('heroSceneModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('heroSceneModal', 'close');
      getSoundEffects()?.close();
    }
    setIsHeroSceneModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setDiscordStageModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('discordStageModal');
      getAnalytics()?.trackUIStateChange('discordStageModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('discordStageModal', 'close');
      getSoundEffects()?.close();
    }
    setIsDiscordStageModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setAccountManagerModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('accountManagerModal');
      getAnalytics()?.trackUIStateChange('accountManagerModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('accountManagerModal', 'close');
      getSoundEffects()?.close();
    }
    setIsAccountManagerModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setBgPickerModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('bgPickerModal');
      getAnalytics()?.trackUIStateChange('bgPickerModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('bgPickerModal', 'close');
      getSoundEffects()?.close();
    }
    setIsBgPickerModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setColorPickerModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('colorPickerModal');
      getAnalytics()?.trackUIStateChange('colorPickerModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('colorPickerModal', 'close');
      getSoundEffects()?.close();
    }
    setIsColorPickerModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setSplinePanelModalOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('splinePanelModal');
      getAnalytics()?.trackUIStateChange('splinePanelModal', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('splinePanelModal', 'close');
      getSoundEffects()?.close();
    }
    setIsSplinePanelModalOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setStoreMobileMenuOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('storeMobileMenu');
      getAnalytics()?.trackUIStateChange('storeMobileMenu', 'open');
      // Sound handled by StoreHeader with RAF timing
    } else {
      getAnalytics()?.trackUIStateChange('storeMobileMenu', 'close');
    }
    setIsStoreMobileMenuOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setStoreDesktopMenuOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('storeDesktopMenu');
      getAnalytics()?.trackUIStateChange('storeDesktopMenu', 'open');
    } else {
      getAnalytics()?.trackUIStateChange('storeDesktopMenu', 'close');
    }
    setIsStoreDesktopMenuOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setStoreDropdownMenuOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('storeDropdownMenu');
      getAnalytics()?.trackUIStateChange('storeDropdownMenu', 'open');
    } else {
      getAnalytics()?.trackUIStateChange('storeDropdownMenu', 'close');
    }
    setIsStoreDropdownMenuOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setSupportDrawerOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('supportDrawer');
      getAnalytics()?.trackUIStateChange('supportDrawer', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('supportDrawer', 'close');
      getSoundEffects()?.close();
    }
    setIsSupportDrawerOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setGamesDrawerOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;
    
    if (open) {
      closeOthers('gamesDrawer');
      getAnalytics()?.trackUIStateChange('gamesDrawer', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('gamesDrawer', 'close');
      getSoundEffects()?.close();
    }
    setIsGamesDrawerOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setCourseDrawerOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;

    if (open) {
      closeOthers('courseDrawer');
      getAnalytics()?.trackUIStateChange('courseDrawer', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('courseDrawer', 'close');
      getSoundEffects()?.close();
    }
    setIsCourseDrawerOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

  const setSocialsDrawerOpen = useCallback((open: boolean) => {
    // Prevent opening when Ultimate Hub is active
    if (open && isUltimateHubOpen) return;

    if (open) {
      closeOthers('socialsDrawer');
      getAnalytics()?.trackUIStateChange('socialsDrawer', 'open');
      getSoundEffects()?.open();
    } else {
      getAnalytics()?.trackUIStateChange('socialsDrawer', 'close');
      getSoundEffects()?.close();
    }
    setIsSocialsDrawerOpenState(open);
  }, [closeOthers, isUltimateHubOpen]);

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
  const openBgPickerModal = useCallback(() => setBgPickerModalOpen(true), [setBgPickerModalOpen]);
  const openColorPickerModal = useCallback(() => setColorPickerModalOpen(true), [setColorPickerModalOpen]);
  const openSplinePanelModal = useCallback(() => setSplinePanelModalOpen(true), [setSplinePanelModalOpen]);
  const openStoreMobileMenu = useCallback(() => setStoreMobileMenuOpen(true), [setStoreMobileMenuOpen]);
  const openStoreDesktopMenu = useCallback(() => setStoreDesktopMenuOpen(true), [setStoreDesktopMenuOpen]);
  const openStoreDropdownMenu = useCallback(() => setStoreDropdownMenuOpen(true), [setStoreDropdownMenuOpen]);
  const openSupportDrawer = useCallback(() => setSupportDrawerOpen(true), [setSupportDrawerOpen]);
  const openGamesDrawer = useCallback(() => setGamesDrawerOpen(true), [setGamesDrawerOpen]);
  const openCourseDrawer = useCallback(() => setCourseDrawerOpen(true), [setCourseDrawerOpen]);
  const openSocialsDrawer = useCallback(() => setSocialsDrawerOpen(true), [setSocialsDrawerOpen]);
  const closeNavbarModal = useCallback(() => {
    setIsAdminModalOpenState(false);
    setIsFaqModalOpenState(false);
    setIsAffiliateModalOpenState(false);
    setIsThemeSelectorModalOpenState(false);
    setIsAccountManagerModalOpenState(false);
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
    isBgPickerModalOpen,
    isColorPickerModalOpen,
    isSplinePanelModalOpen,
    isStoreMobileMenuOpen,
    isStoreDesktopMenuOpen,
    isStoreDropdownMenuOpen,
    isSupportDrawerOpen,
    isGamesDrawerOpen,
    isCourseDrawerOpen,
    isSocialsDrawerOpen,
    isV2Unlocked,
    devSkipPageModeAndLoader,
    isWelcomeScreenActive,
    hasStartedPagemodeAudio,
    isMobileNavbarHidden,
    activeNavbarModal,
    isAnyOpen,
    isAnyModalOpen,
    activeComponent,
    shouldMinimizeAudioWidget,
    hasOverlayingUI,
    shouldSkipHeavyEffects,

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
    setBgPickerModalOpen,
    setColorPickerModalOpen,
    setSplinePanelModalOpen,
    setStoreMobileMenuOpen,
    setStoreDesktopMenuOpen,
    setStoreDropdownMenuOpen,
    setSupportDrawerOpen,
    setGamesDrawerOpen,
    setCourseDrawerOpen,
    setSocialsDrawerOpen,
    setV2Unlocked,
    setDevSkipPageModeAndLoader,
    setWelcomeScreenActive: setIsWelcomeScreenActiveState,
    setMobileNavbarHidden: setIsMobileNavbarHiddenState,
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
    openBgPickerModal,
    openColorPickerModal,
    openSplinePanelModal,
    openStoreMobileMenu,
    openStoreDesktopMenu,
    openStoreDropdownMenu,
    openSupportDrawer,
    openGamesDrawer,
    openCourseDrawer,
    openSocialsDrawer,
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

// useUIState, useMobileMenu, useProductsModalUI are now exported from UIStateHook.ts
// and re-exported from this file at the top via `export { ... } from './UIStateHook'`

// --- Convenience Hooks for Specific UI Components ---
// NOTE: These remain here for backwards compatibility. They could be moved to UIStateHook.ts
// if they appear in critical compile paths.

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
    isUltimateHubOpen,
  } = useUIState();

  // Viewport detection local to this hook (provider has its own instance)
  const isDesktopViewport = typeof window === 'undefined'
    ? true
    : window.matchMedia('(min-width: 768px)').matches;

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
  // 5. Store and games pages: Keep widget available
  //
  // shouldHideAudioWidgetCompletely = true means the ENTIRE widget is hidden (iframe unmounts, audio stops)
  // shouldHideAudioWidgetCompletely = false means at least the FloatingPlayer shows (audio persists)
  //
  // CRITICAL: Audio must persist throughout the ENTIRE pagemode flow (welcome -> registration -> loader -> content)
  // hasStartedPagemodeAudio is set when pagemode opens and only cleared when V2 unlocks (content loads)
  // This ensures the iframe stays mounted even during the loader transition
  //
  // Logic:
  // - Hide completely ONLY if mobile flow is not unlocked and user is not in pagemode/welcome flow
  // - Keep showing (mounted) on normal routes including store/games
  const isInPagemodeFlow = isPagemodeOpen || isWelcomeScreenActive || hasStartedPagemodeAudio;
  const shouldHideAudioWidgetCompletely = false;

  // NEW: shouldHideMainWidget - hides MainWidget (settings panel) but keeps FloatingPlayer for audio
  // During pagemode registration (not welcome screen), hide the settings but keep audio playing
  // Also hide during loader (but keep FloatingPlayer for audio persistence)
  // Keep MainWidget visible on store/games as requested
  const shouldHideMainWidget = (isPagemodeOpen && !isWelcomeScreenActive) || isLoaderv2Open || isUltimateHubOpen;

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
  const { isLiveStreamModalOpen, setLiveStreamModalOpen, openLiveStreamModal, shouldSkipHeavyEffects } = useUIState();
  return {
    isOpen: isLiveStreamModalOpen,
    setIsOpen: setLiveStreamModalOpen,
    open: openLiveStreamModal,
    shouldSkipHeavyEffects,
  };
}

// useProductsModalUI is now in UIStateHook.ts and re-exported at the top

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

export function useBgPickerModalUI() {
  const { isBgPickerModalOpen, setBgPickerModalOpen, openBgPickerModal } = useUIState();
  return { isOpen: isBgPickerModalOpen, setIsOpen: setBgPickerModalOpen, open: openBgPickerModal };
}

export function useColorPickerModalUI() {
  const { isColorPickerModalOpen, setColorPickerModalOpen, openColorPickerModal } = useUIState();
  return { isOpen: isColorPickerModalOpen, setIsOpen: setColorPickerModalOpen, open: openColorPickerModal };
}

export function useSplinePanelModalUI() {
  const { isSplinePanelModalOpen, setSplinePanelModalOpen, openSplinePanelModal } = useUIState();
  return { isOpen: isSplinePanelModalOpen, setIsOpen: setSplinePanelModalOpen, open: openSplinePanelModal };
}

// Store header menu hooks - centralized so back-navigation and mutual exclusion work correctly
export function useStoreMenuUI() {
  const {
    isStoreMobileMenuOpen,
    isStoreDesktopMenuOpen,
    isStoreDropdownMenuOpen,
    setStoreMobileMenuOpen,
    setStoreDesktopMenuOpen,
    setStoreDropdownMenuOpen,
    openStoreMobileMenu,
    openStoreDesktopMenu,
    openStoreDropdownMenu,
  } = useUIState();

  return {
    isMobileMenuOpen: isStoreMobileMenuOpen,
    isDesktopMenuOpen: isStoreDesktopMenuOpen,
    isDropdownMenuOpen: isStoreDropdownMenuOpen,
    setMobileMenuOpen: setStoreMobileMenuOpen,
    setDesktopMenuOpen: setStoreDesktopMenuOpen,
    setDropdownMenuOpen: setStoreDropdownMenuOpen,
    openMobileMenu: openStoreMobileMenu,
    openDesktopMenu: openStoreDesktopMenu,
    openDropdownMenu: openStoreDropdownMenu,
  };
}

// Support drawer hook - for floating support button & drawer
export function useSupportDrawerUI() {
  const { isSupportDrawerOpen, setSupportDrawerOpen, openSupportDrawer } = useUIState();
  return { isOpen: isSupportDrawerOpen, setIsOpen: setSupportDrawerOpen, open: openSupportDrawer };
}

// Games drawer hook - for games page drawer
export function useGamesDrawerUI() {
  const { isGamesDrawerOpen, setGamesDrawerOpen, openGamesDrawer } = useUIState();
  return { isOpen: isGamesDrawerOpen, setIsOpen: setGamesDrawerOpen, open: openGamesDrawer };
}

// Course drawer hook - for Trading Course drawer
export function useCourseDrawerUI() {
  const { isCourseDrawerOpen, setCourseDrawerOpen, openCourseDrawer } = useUIState();
  return { isOpen: isCourseDrawerOpen, setIsOpen: setCourseDrawerOpen, open: openCourseDrawer };
}

// Socials drawer hook - for Social (Ultimate Hub community) drawer
export function useSocialsDrawerUI() {
  const { isSocialsDrawerOpen, setSocialsDrawerOpen, openSocialsDrawer } = useUIState();
  return { isOpen: isSocialsDrawerOpen, setIsOpen: setSocialsDrawerOpen, open: openSocialsDrawer };
}
