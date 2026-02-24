import Home from 'lucide-react/dist/esm/icons/home';
import Users from 'lucide-react/dist/esm/icons/users';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

// ============================================================================
// StoreHeader constants
// ============================================================================

// Items with action: '#action:*' are intercepted by handleCategoryClick to open modals/toggles.
export const STORE_NAV_ITEMS = [
  { href: '/', label: 'Home', category: '' },
  { href: '/design', label: 'Design', category: '' },
  { href: '/games', label: 'Games', category: '' },
  { href: '#action:products', label: 'BULLMONEY VIP+', category: '' },
  { href: '#action:socials', label: 'Social', category: '' },
  { href: '#action:course', label: 'Course', category: '' },
  { href: '#action:livestream', label: 'Live Stream', category: '' },
  { href: '#action:faq', label: 'FAQ', category: '' },
  { href: '#action:themes', label: 'Themes', category: '' },
  { href: '#action:hub', label: 'Hub', category: '' },
  { href: '/store', label: 'Store', category: '' },
  { href: '/products', label: 'Products', category: '' },
  { href: '/store/gift-cards', label: 'Gift Cards', category: '' },
  { href: '/store?category=apparel', label: 'Apparel', category: 'apparel' },
  { href: '/store?category=accessories', label: 'Accessories', category: 'accessories' },
  { href: '/store?category=tech-gear', label: 'Tech & Gear', category: 'tech-gear' },
  { href: '/store?category=home-office', label: 'Home Office', category: 'home-office' },
  { href: '/store?category=drinkware', label: 'Drinkware', category: 'drinkware' },
  { href: '/store?category=limited-edition', label: 'Limited Edition', category: 'limited-edition' },
] as const;

export const STORE_CATEGORIES = [
  { value: '', label: 'All Products', href: '/store' },
  { value: 'apparel', label: 'Apparel', href: '/store?category=apparel' },
  { value: 'accessories', label: 'Accessories', href: '/store?category=accessories' },
  { value: 'tech-gear', label: 'Tech & Gear', href: '/store?category=tech-gear' },
  { value: 'home-office', label: 'Home Office', href: '/store?category=home-office' },
  { value: 'drinkware', label: 'Drinkware', href: '/store?category=drinkware' },
  { value: 'limited-edition', label: 'Limited Edition', href: '/store?category=limited-edition' },
] as const;

export const MAIN_NAV_BUTTONS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/recruit', label: 'Affiliates', icon: Users },
  { href: '/VIP', label: 'VIP', icon: Sparkles },
  { href: '/community', label: 'Community', icon: Calendar },
] as const;

export const MOBILE_MENU_LIST_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
} as const;

export const MOBILE_MENU_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

export const STOREHEADER_STORAGE_KEYS = {
  pagemodeForceLogin: 'bullmoney_pagemode_force_login',
  pagemodeLoginView: 'bullmoney_pagemode_login_view',
  pagemodeRedirectPath: 'bullmoney_pagemode_redirect_path',
  accountDrawerPending: 'bullmoney_store_open_account_drawer',

  storeShowUltimateHub: 'store_show_ultimate_hub',
  storeShowThemePicker: 'store_show_theme_picker',
  storeShowAudioWidget: 'store_show_audio_widget',
  storeShowDesignSections: 'store_show_design_sections',
} as const;
