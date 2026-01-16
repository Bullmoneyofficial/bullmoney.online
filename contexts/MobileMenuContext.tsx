"use client";

/**
 * @deprecated This file is kept for backwards compatibility.
 * Please use UIStateContext instead for new code.
 *
 * The useMobileMenu hook and MobileMenuProvider are now re-exported
 * from UIStateContext which handles mutual exclusion between:
 * - Mobile menu
 * - Audio Widget
 * - Ultimate Control Panel
 * - All modals (Analysis, LiveStream, Products, Affiliate, Theme, Admin, FAQ)
 * - Footer
 * - ChartNews
 */

// Re-export everything from UIStateContext for backwards compatibility
export {
  useMobileMenu,
  UIStateProvider as MobileMenuProvider,
  useUIState,
  useAudioWidgetUI,
  useUltimatePanelUI,
  useNavbarModals,
  useFooterUI,
  useChartNewsUI,
  useAnalysisModalUI,
  useLiveStreamModalUI,
  useProductsModalUI,
  useAffiliateModalUI,
  useThemeSelectorModalUI,
  useAdminModalUI,
  useFaqModalUI,
  useAppsModalUI,
  useDisclaimerModalUI,
  useFooterModalsUI,
  UI_Z_INDEX,
  type UIComponentType,
  type NavbarModalType,
} from './UIStateContext';
