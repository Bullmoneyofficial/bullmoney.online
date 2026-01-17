// Re-export all navbar components for easier imports
export { DesktopNavbar } from './DesktopNavbar';
export { Dock } from './Dock';
export { DockIcon } from './DockIcon';
export { MobileDropdownMenu } from './MobileDropdownMenu';
export { MobileStaticHelper } from './MobileStaticHelper';
export { MovingTradingTip } from './MovingTradingTip';
export { ThemeSelectorModal } from './ThemeSelectorModal';
export { 
  NAVBAR_THEME_FILTER_MAP, 
  NAVBAR_TRADING_TIPS, 
  MOBILE_HELPER_TIPS, 
  useRotatingIndex 
} from './navbar.utils';

// Lazy Modal System - optimized loading/unloading like ServicesModal
export {
  LazyAdminModal,
  LazyAffiliateModal,
  LazyFaqModal,
  LazyUltimatePanel,
  useModalFreeze,
  useViewportFreeze,
  FreezeZone,
  ModalLoadingSpinner,
} from './LazyModalSystem';
