// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import X from 'lucide-react/dist/esm/icons/x';
import User from 'lucide-react/dist/esm/icons/user';
import Home from 'lucide-react/dist/esm/icons/home';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Users from 'lucide-react/dist/esm/icons/users';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { useCartStore } from '@/stores/cart-store';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useProductsModalUI, useThemeSelectorModalUI, useStoreMenuUI, useUIState, useAudioWidgetUI, useLiveStreamModalUI } from '@/contexts/UIStateContext';
import dynamic from 'next/dynamic';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useHeroMode } from '@/hooks/useHeroMode';
import type { HeroMode } from '@/hooks/useHeroMode';

// Lazy-load framer-motion — only needed when mobile menu is opened
const LazyMotionDiv = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.div })), { ssr: false });
const LazyAnimatePresence = dynamic(() => import('framer-motion').then(m => ({ default: m.AnimatePresence })), { ssr: false });
const LazyMotionUl = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.ul })), { ssr: false });
const LazyMotionLi = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.li })), { ssr: false });
const LazyMotionButton = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.button })), { ssr: false });

// Lazy load modals - same as main navbar
const AdminHubModal = dynamic(() => import('@/components/AdminHubModal'), { ssr: false });
const SiteSearchOverlay = dynamic(() => import('@/components/SiteSearchOverlay'), { ssr: false });
const GamesManualModal = dynamic(() => import('@/components/GamesManualModal').then(m => ({ default: m.GamesManualModal })), { ssr: false });

// Import lazy modal system from navbar (same as main site)
import { LazyAffiliateModal, LazyFaqModal } from '@/components/navbar/LazyModalSystem';
// Heavy UI chunks — dynamic to keep StoreHeader light
const StorePillNav = dynamic(() => import('./StorePillNav').then(m => ({ default: m.StorePillNav })), { ssr: false, loading: () => null });
const LanguageToggle = dynamic(() => import('@/components/LanguageToggle').then(m => ({ default: m.LanguageToggle })), { ssr: false, loading: () => null });
const RewardsCardBanner = dynamic(() => import('@/components/RewardsCardBanner'), { ssr: false, loading: () => null });
const ProductsModal = dynamic(() => import('@/components/ProductsModal').then(m => ({ default: m.ProductsModal })), { ssr: false, loading: () => null });
const CartDrawer = dynamic(() => import('@/components/shop/CartDrawer').then(m => ({ default: m.CartDrawer })), { ssr: false, loading: () => null });
const LiveStreamModal = dynamic(() => import('@/components/LiveStreamModal'), { ssr: false, loading: () => null });

// ============================================================================
// STORE HEADER - MODERN PILL NAVIGATION 
// Real store-style header with animated pill nav + cart/user actions
// ============================================================================

// Pill nav items for the store - including scroll-to functionality
// Items with action: 'modal-*' are intercepted by handleCategoryClick to open modals instead of navigating
const STORE_NAV_ITEMS = [
  { href: '/', label: 'Home', category: '' },
  { href: '/design', label: 'Design', category: '' },
  { href: '#action:games', label: 'Games', category: '' },
  { href: '#action:products', label: 'BULLMONEY VIP+', category: '' },
  { href: '#action:livestream', label: 'Live Stream', category: '' },
  { href: '#action:faq', label: 'FAQ', category: '' },
  { href: '#action:themes', label: 'Themes', category: '' },
  { href: '#action:hub', label: 'Hub', category: '' },
  { href: '/store', label: 'All Products', category: '' },
  { href: '/store?category=apparel', label: 'Apparel', category: 'apparel' },
  { href: '/store?category=accessories', label: 'Accessories', category: 'accessories' },
  { href: '/store?category=tech-gear', label: 'Tech & Gear', category: 'tech-gear' },
  { href: '/store?category=home-office', label: 'Home Office', category: 'home-office' },
  { href: '/store?category=drinkware', label: 'Drinkware', category: 'drinkware' },
  { href: '/store?category=limited-edition', label: 'Limited Edition', category: 'limited-edition' },
];

// Store Categories for mobile menu (matches store page)
const STORE_CATEGORIES = [
  { value: '', label: 'All Products', href: '/store' },
  { value: 'apparel', label: 'Apparel', href: '/store?category=apparel' },
  { value: 'accessories', label: 'Accessories', href: '/store?category=accessories' },
  { value: 'tech-gear', label: 'Tech & Gear', href: '/store?category=tech-gear' },
  { value: 'home-office', label: 'Home Office', href: '/store?category=home-office' },
  { value: 'drinkware', label: 'Drinkware', href: '/store?category=drinkware' },
  { value: 'limited-edition', label: 'Limited Edition', href: '/store?category=limited-edition' },
];

// Main site navigation buttons for mobile menu
const MAIN_NAV_BUTTONS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/recruit', label: 'Affiliates', icon: Users },
  { href: '/VIP', label: 'VIP', icon: Sparkles },
  { href: '/community', label: 'Community', icon: Calendar },
];

const MOBILE_MENU_LIST_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const MOBILE_MENU_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

type StoreHeaderProps = {
  heroModeOverride?: HeroMode;
  onHeroModeChangeOverride?: (mode: HeroMode) => void;
};

export function StoreHeader({ heroModeOverride, onHeroModeChangeOverride }: StoreHeaderProps) {
  // Store menus managed via centralized UIState for proper mutual exclusion and back-nav reset
  const {
    isMobileMenuOpen: mobileMenuOpen,
    isDesktopMenuOpen: desktopMenuOpen,
    isDropdownMenuOpen: manualDropdownOpen,
    setMobileMenuOpen,
    setDesktopMenuOpen,
    setDropdownMenuOpen: setManualDropdownOpen,
  } = useStoreMenuUI();
  const { isUltimateHubOpen } = useUIState();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUltimateHub, setShowUltimateHub] = useState(false);
  const [showAudioWidget, setShowAudioWidget] = useState(true);
  const [audioWidgetPrefLoaded, setAudioWidgetPrefLoaded] = useState(false);
  const [gamesManualOpen, setGamesManualOpen] = useState(false);
  const [siteSearchOpen, setSiteSearchOpen] = useState(false);
  const [showDesignSections, setShowDesignSections] = useState(true);
  const desktopMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuToggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openCart, getItemCount, isOpen: isCartOpen } = useCartStore();
  const { isAuthenticated, recruit, signOut } = useRecruitAuth();
  const { isAdmin } = useAdminAuth();
  const isDev = process.env.NODE_ENV === 'development';
  const [devAdminEnabled, setDevAdminEnabled] = useState(true);
  const effectiveAdmin = isDev && isAdmin && devAdminEnabled;
  const canUseDevAdminShortcut = isDev;
  const { open: openProductsModal, isOpen: isProductsModalOpen } = useProductsModalUI();
  const { setIsOpen: setThemePickerModalOpen } = useThemeSelectorModalUI();
  const { setAudioWidgetOpen } = useAudioWidgetUI();
  const { isOpen: isLiveStreamModalOpen, setIsOpen: setLiveStreamModalOpen } = useLiveStreamModalUI();
  const itemCount = getItemCount();
  const router = useRouter();
  const pathname = usePathname();
  const { heroMode: hookHeroMode, setHeroMode: setHookHeroMode } = useHeroMode();
  const heroMode = heroModeOverride ?? hookHeroMode;
  const setHeroMode = onHeroModeChangeOverride ?? setHookHeroMode;
  const isAccountPage = pathname?.startsWith('/store/account');
  const isCasinoPage = pathname?.startsWith('/games');
  const isDesignPage = pathname?.startsWith('/design');
  const isHomePage = pathname === '/';
  // Show home button on non-home pages (store, games, etc.) so users can navigate back
  const showHomeButton = !isHomePage;
  const storeHeaderScrollYRef = useRef(0);

  const PAGEMODE_FORCE_LOGIN_KEY = 'bullmoney_pagemode_force_login';
  const PAGEMODE_LOGIN_VIEW_KEY = 'bullmoney_pagemode_login_view';
  const PAGEMODE_REDIRECT_PATH_KEY = 'bullmoney_pagemode_redirect_path';

  const startPagemodeLogin = useCallback(() => {
    SoundEffects.click();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PAGEMODE_FORCE_LOGIN_KEY, 'true');
        localStorage.setItem(PAGEMODE_LOGIN_VIEW_KEY, 'true');
        localStorage.setItem(PAGEMODE_REDIRECT_PATH_KEY, '/store/account');
      } catch {
        // Ignore storage errors and still navigate to pagemode.
      }
    }
    // If already on home page, dispatch event to trigger pagemode without navigation
    if (pathname === '/') {
      window.dispatchEvent(new Event('bullmoney_force_pagemode'));
    } else {
      router.push('/');
    }
  }, [router, pathname]);

  useEffect(() => {
    return () => {
      if (desktopMenuCloseTimer.current) {
        clearTimeout(desktopMenuCloseTimer.current);
      }
      if (menuToggleTimer.current) {
        clearTimeout(menuToggleTimer.current);
      }
    };
  }, []);

  // Close menus when pathname changes (e.g. back button navigation)
  // Store mobile/desktop/dropdown menus are managed via UIState and auto-close via closeOthers
  // Only local state needs manual reset here
  useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    setManualDropdownOpen(false);
    setGamesManualOpen(false);
    setSiteSearchOpen(false);
  }, [pathname]);  
  
  // Load Ultimate Hub preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('store_show_ultimate_hub');
      // Default to false (hide) unless explicitly enabled
      setShowUltimateHub(stored === 'true');
    }
  }, []);

  // Load Theme Picker preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('store_show_theme_picker');
      setShowThemePicker(stored === 'true');
    }
  }, []);

  // Persist and broadcast Ultimate Hub changes after render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('store_show_ultimate_hub', String(showUltimateHub));
    window.dispatchEvent(new CustomEvent('store_ultimate_hub_toggle', { detail: showUltimateHub }));
    window.dispatchEvent(new Event('store_ultimate_hub_toggle'));
  }, [showUltimateHub]);

  // Persist and broadcast Theme Picker changes after render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('store_show_theme_picker', String(showThemePicker));
    window.dispatchEvent(new CustomEvent('store_theme_picker_toggle', { detail: showThemePicker }));
    window.dispatchEvent(new Event('store_theme_picker_toggle'));
  }, [showThemePicker]);

  // Sync Theme Picker button state with external toggles (e.g. main navbar)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleThemeToggle = (event: Event) => {
      const detailValue = (event as CustomEvent<boolean>).detail;
      if (typeof detailValue === 'boolean') {
        setShowThemePicker(detailValue);
        return;
      }
      const stored = localStorage.getItem('store_show_theme_picker');
      setShowThemePicker(stored === 'true');
    };

    window.addEventListener('store_theme_picker_toggle', handleThemeToggle);
    return () => window.removeEventListener('store_theme_picker_toggle', handleThemeToggle);
  }, []);

  // Load Audio Widget preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('store_show_audio_widget');
      const shouldShow = stored !== 'false';
      // Default to true (visible) unless explicitly disabled
      setShowAudioWidget(shouldShow);
      setAudioWidgetOpen(shouldShow);
      setAudioWidgetPrefLoaded(true);
    }
  }, [setAudioWidgetOpen]);

  // Persist and broadcast Audio Widget changes after render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioWidgetPrefLoaded) return;
    localStorage.setItem('store_show_audio_widget', String(showAudioWidget));
    window.dispatchEvent(new CustomEvent('store_audio_widget_toggle', { detail: showAudioWidget }));
    window.dispatchEvent(new Event('store_audio_widget_toggle'));
  }, [showAudioWidget, audioWidgetPrefLoaded]);

  // Sync Audio button state with external toggles
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAudioToggle = (event: Event) => {
      const detailValue = (event as CustomEvent<boolean>).detail;
      if (typeof detailValue === 'boolean') {
        setShowAudioWidget(detailValue);
        return;
      }
      const stored = localStorage.getItem('store_show_audio_widget');
      setShowAudioWidget(stored !== 'false');
    };

    window.addEventListener('store_audio_widget_toggle', handleAudioToggle);
    return () => window.removeEventListener('store_audio_widget_toggle', handleAudioToggle);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const shouldLockBackgroundScroll = Boolean(
      mobileMenuOpen ||
      siteSearchOpen ||
      affiliateModalOpen ||
      faqModalOpen ||
      adminModalOpen ||
      gamesManualOpen ||
      isProductsModalOpen ||
      isCartOpen
    );

    const html = document.documentElement;
    const body = document.body;

    if (shouldLockBackgroundScroll) {
      if (body.getAttribute('data-storeheader-scroll-lock') !== 'true') {
        storeHeaderScrollYRef.current = window.scrollY || window.pageYOffset || 0;
      }

      body.setAttribute('data-storeheader-scroll-lock', 'true');
      html.setAttribute('data-storeheader-scroll-lock', 'true');

      body.style.position = 'fixed';
      body.style.top = `-${storeHeaderScrollYRef.current}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      return;
    }

    if (body.getAttribute('data-storeheader-scroll-lock') === 'true') {
      body.removeAttribute('data-storeheader-scroll-lock');
      html.removeAttribute('data-storeheader-scroll-lock');

      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';

      window.scrollTo(0, storeHeaderScrollYRef.current);
    }
  }, [
    mobileMenuOpen,
    siteSearchOpen,
    affiliateModalOpen,
    faqModalOpen,
    adminModalOpen,
    gamesManualOpen,
    isProductsModalOpen,
    isCartOpen,
  ]);

  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return;
      const html = document.documentElement;
      const body = document.body;
      if (body.getAttribute('data-storeheader-scroll-lock') !== 'true') return;

      body.removeAttribute('data-storeheader-scroll-lock');
      html.removeAttribute('data-storeheader-scroll-lock');

      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
    };
  }, []);

  // Load Design Sections preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('store_show_design_sections');
      // Default to true (sections visible) unless explicitly disabled
      const value = stored !== 'false';
      setShowDesignSections(value);
      window.dispatchEvent(new CustomEvent('store_design_sections_toggle', { detail: value }));
    }
  }, []);
  
  const applyThemePickerToggle = useCallback((nextValue?: boolean) => {
    setShowThemePicker(prev => {
      const newValue = typeof nextValue === 'boolean' ? nextValue : !prev;
      if (newValue && showUltimateHub) {
        setShowUltimateHub(false);
      }
      setThemePickerModalOpen(newValue);
      return newValue;
    });
  }, [setThemePickerModalOpen, showUltimateHub]);

  const toggleThemePicker = useCallback(() => {
    SoundEffects.click();
    if (desktopMenuOpen) {
      setDesktopMenuOpen(false);
      if (menuToggleTimer.current) {
        clearTimeout(menuToggleTimer.current);
      }
      menuToggleTimer.current = setTimeout(() => {
        applyThemePickerToggle();
      }, 180);
      return;
    }
    applyThemePickerToggle();
  }, [applyThemePickerToggle, desktopMenuOpen]);

  const applyUltimateHubToggle = useCallback((nextValue?: boolean) => {
    setShowUltimateHub(prev => {
      const newValue = typeof nextValue === 'boolean' ? nextValue : !prev;
      return newValue;
    });
  }, []);

  const toggleUltimateHub = useCallback(() => {
    SoundEffects.click();
    if (desktopMenuOpen) {
      setDesktopMenuOpen(false);
      if (menuToggleTimer.current) {
        clearTimeout(menuToggleTimer.current);
      }
      menuToggleTimer.current = setTimeout(() => {
        applyUltimateHubToggle();
      }, 180);
      return;
    }
    applyUltimateHubToggle();
  }, [applyUltimateHubToggle, desktopMenuOpen]);

  const applyAudioWidgetToggle = useCallback((nextValue?: boolean) => {
    setShowAudioWidget(prev => {
      const newValue = typeof nextValue === 'boolean' ? nextValue : !prev;
      setAudioWidgetOpen(newValue);
      return newValue;
    });
  }, [setAudioWidgetOpen]);

  const toggleAudioWidget = useCallback(() => {
    SoundEffects.click();
    if (desktopMenuOpen) {
      setDesktopMenuOpen(false);
      if (menuToggleTimer.current) {
        clearTimeout(menuToggleTimer.current);
      }
      menuToggleTimer.current = setTimeout(() => {
        applyAudioWidgetToggle();
      }, 180);
      return;
    }
    applyAudioWidgetToggle();
  }, [applyAudioWidgetToggle, desktopMenuOpen]);

  const toggleDesignSections = useCallback(() => {
    SoundEffects.click();
    setShowDesignSections(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_design_sections', String(newValue));
        window.dispatchEvent(new CustomEvent('store_design_sections_toggle', { detail: newValue }));
      }
      return newValue;
    });
  }, []);

  const navigateToGames = useCallback(() => {
    if (pathname?.startsWith('/games')) return;
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    setManualDropdownOpen(false);
    setSiteSearchOpen(false);
    router.push('/games');
    window.setTimeout(() => {
      if (!window.location.pathname.startsWith('/games')) {
        window.location.assign('/games');
      }
    }, 500);
  }, [pathname, router, setDesktopMenuOpen, setManualDropdownOpen, setMobileMenuOpen]);

  const desktopLinks = useMemo(() => {
    const links = [
      { label: 'Games', onClick: navigateToGames, variant: 'link' as const },
      { label: 'Affiliates', onClick: () => setAffiliateModalOpen(true), variant: 'link' as const },
      { label: 'BULLMONEY VIP+', onClick: () => openProductsModal(), variant: 'link' as const },
      { label: 'FAQ', onClick: () => setFaqModalOpen(true), variant: 'link' as const },
      { label: 'Themes', onClick: toggleThemePicker, isActive: showThemePicker, variant: 'toggle' as const },
      { label: 'Hub', onClick: toggleUltimateHub, isActive: showUltimateHub, variant: 'toggle' as const },
      { label: 'Audio', onClick: toggleAudioWidget, isActive: showAudioWidget, variant: 'toggle' as const },
      ...(isDesignPage ? [{ label: 'Sections', onClick: toggleDesignSections, isActive: showDesignSections, variant: 'toggle' as const }] : []),
    ];

    return links;
  }, [navigateToGames, openProductsModal, setAffiliateModalOpen, setFaqModalOpen, showThemePicker, showUltimateHub, showAudioWidget, toggleThemePicker, toggleUltimateHub, toggleAudioWidget, isDesignPage, showDesignSections, toggleDesignSections]);

  // Check if there's a canvas section in the viewport (below header)
  const isOverCanvasSection = useCallback(() => {
    if (typeof window === 'undefined') return false;
    // Check multiple points in the trigger zone area (48px to 200px down)
    const checkPoints = [
      [window.innerWidth / 2, 68],  // Center, just below header
      [window.innerWidth / 2, 150], // Center, mid-area
      [window.innerWidth / 4, 68],  // Left quarter
      [window.innerWidth * 0.75, 68], // Right quarter
    ];
    
    return checkPoints.some(([x, y]) => {
      const elementsUnderPoint = document.elementsFromPoint(x, y);
      return elementsUnderPoint.some(el => 
        el.tagName === 'CANVAS' ||
        el.closest('[data-canvas-section]') !== null ||
        el.closest('[data-spline-container]') !== null ||
        el.id === 'spline-container' ||
        el.classList.contains('spline-container')
      );
    });
  }, []);

  const openDesktopMenu = useCallback(() => {
    if (isUltimateHubOpen) return; // Never open desktop menu when Ultimate Hub is active
    if (isCasinoPage) return; // Disable hover menu on games pages
    if (isOverCanvasSection()) return; // Disable if cursor is over canvas sections
    if (desktopMenuCloseTimer.current) {
      clearTimeout(desktopMenuCloseTimer.current);
      desktopMenuCloseTimer.current = null;
    }
    setDesktopMenuOpen(true);
  }, [isUltimateHubOpen, isCasinoPage, isOverCanvasSection]);

  const scheduleDesktopMenuClose = useCallback(() => {
    if (desktopMenuCloseTimer.current) {
      clearTimeout(desktopMenuCloseTimer.current);
    }
    desktopMenuCloseTimer.current = setTimeout(() => {
      setDesktopMenuOpen(false);
    }, 250);
  }, []);

  const toggleDesktopMenu = useCallback(() => {
    if (isUltimateHubOpen) return; // Never toggle desktop menu when Ultimate Hub is active
    if (isCasinoPage) return; // Ignore toggle on games pages
    SoundEffects.click();
    setDesktopMenuOpen(!desktopMenuOpen);
  }, [isUltimateHubOpen, isCasinoPage, desktopMenuOpen, setDesktopMenuOpen]);

  // Ensure desktop menu stays closed on games pages
  useEffect(() => {
    if (isCasinoPage && desktopMenuOpen) {
      setDesktopMenuOpen(false);
    }
  }, [isCasinoPage, desktopMenuOpen]);

  const handleLogout = useCallback(() => {
    SoundEffects.close();
    signOut();
    setMobileMenuOpen(false);
  }, [signOut]);
  
  // Handle user click - always open pagemode login first, then redirect to /store/account
  const handleUserClick = useCallback(() => {
    SoundEffects.click();
    if (isAuthenticated) {
      router.push('/store/account');
      return;
    }
    startPagemodeLogin();
  }, [isAuthenticated, router, startPagemodeLogin]);
  
  // Handle search click - open site-wide search overlay
  const handleSearchClick = useCallback(() => {
    requestAnimationFrame(() => SoundEffects.click());
    setSiteSearchOpen(true);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut to open search
  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSiteSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleCmdK);
    return () => window.removeEventListener('keydown', handleCmdK);
  }, []);

  useEffect(() => {
    if (!canUseDevAdminShortcut || isCasinoPage) return;

    const handleAdminHubShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleAdminHubShortcut);
    return () => window.removeEventListener('keydown', handleAdminHubShortcut);
  }, [canUseDevAdminShortcut, isCasinoPage]);

  const handleRewardsClick = useCallback(() => {
    if (isAuthenticated && recruit) {
      SoundEffects.click();
      router.push('/store/account');
    } else {
      startPagemodeLogin();
    }
  }, [isAuthenticated, recruit, router, startPagemodeLogin]);
  
  // Handle category click - navigate and scroll to products (only for store pages)
  const handleCategoryClick = useCallback((href: string) => {
    SoundEffects.tab();
    // Open auth modal for login instead of navigating
    if (href === '/login') {
      startPagemodeLogin();
      return;
    }

    // Intercept action hrefs for modals/toggles
    if (href === '#action:products') {
      openProductsModal();
      return;
    }
    if (href === '#action:games' || href === '/games') {
      navigateToGames();
      return;
    }
    if (href === '#action:livestream') {
      setLiveStreamModalOpen(true);
      return;
    }
    if (href === '#action:faq') {
      setFaqModalOpen(true);
      return;
    }
    if (href === '#action:themes') {
      toggleThemePicker();
      return;
    }
    if (href === '#action:hub') {
      toggleUltimateHub();
      return;
    }
    
    router.push(href);
    // Only scroll to products grid for store category links
    if (href.startsWith('/store')) {
      setTimeout(() => {
        const productsGrid = document.querySelector('[data-products-grid]');
        if (productsGrid) {
          productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [router, startPagemodeLogin, navigateToGames, openProductsModal, setFaqModalOpen, toggleThemePicker, toggleUltimateHub]);


  const handleOpenMobileMenu = useCallback(() => {
    if (isUltimateHubOpen) return; // Never open mobile menu when Ultimate Hub is active
    setMobileMenuOpen(true);
    requestAnimationFrame(() => SoundEffects.open());
  }, [isUltimateHubOpen]);

  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => SoundEffects.close());
  }, []);

  const handleManualClick = useCallback(() => {
    if (isUltimateHubOpen) return; // Never open dropdown when Ultimate Hub is active
    SoundEffects.click();
    if (isCasinoPage) {
      // On games pages, manual button toggles inline dropdown
      setManualDropdownOpen(!manualDropdownOpen);
    }
  }, [isUltimateHubOpen, isCasinoPage, manualDropdownOpen, setManualDropdownOpen]);

  const handleHomeClick = useCallback(() => {
    SoundEffects.click();
    router.push('/');
  }, [router]);

  const handleThemeButtonClick = useCallback(() => {
    SoundEffects.click();
    applyThemePickerToggle(true);
  }, [applyThemePickerToggle]);

  const handleHeroModeChange = useCallback((mode: HeroMode) => {
    setHeroMode(mode);
    if (mode === 'design') {
      router.push('/design');
    } else if (mode === 'trader') {
      router.push('/'); // Redirect to app page (homepage)
    } else if (mode === 'store') {
      router.push('/store'); // Redirect to store page
    }
  }, [router, setHeroMode]);

  return (
    <>
      {/* Modern Pill Navigation Header */}
      <StorePillNav
        logo="/IMG_2921.PNG"
        logoAlt="Bullmoney Store"
        items={STORE_NAV_ITEMS}
        desktopLinks={desktopLinks}
        className="store-main-nav"
        ease="power2.easeOut"
        baseColor="#ffffff"
        pillColor="#f5f5f7"
        hoveredPillTextColor="#111111"
        pillTextColor="#111111"
        initialLoadAnimation={false}
        // Store-specific props
        cartCount={itemCount}
        onCartClick={openCart}
        onSearchClick={handleSearchClick}
        onUserClick={handleUserClick}
        onCategoryClick={handleCategoryClick}
        showSearch={true}
        showUser={true}
        showCart={true}
        // Games page specific props
        hideNavigation={isCasinoPage}
        showManualButton={isCasinoPage}
        onManualClick={handleManualClick}
        isAuthenticated={isAuthenticated}
        userInitial={recruit?.email?.charAt(0) || 'U'}
        // Home button for app navigation
        showHomeButton={showHomeButton}
        onHomeClick={handleHomeClick}
        showThemeButton={showThemePicker}
        onThemeClick={handleThemeButtonClick}
        onMobileMenuClick={handleOpenMobileMenu}
        onDesktopMenuEnter={isAccountPage || isCasinoPage ? undefined : openDesktopMenu}
        onDesktopMenuLeave={isAccountPage || isCasinoPage ? undefined : scheduleDesktopMenuClose}
        onDesktopMenuToggle={isCasinoPage ? undefined : toggleDesktopMenu}
        desktopMenuOpen={isCasinoPage ? false : desktopMenuOpen}
        // Hero mode toggle
        heroMode={heroMode}
        onHeroModeChange={handleHeroModeChange}
      />

      {!isCasinoPage && (
        <div data-apple-section className="hidden md:block" style={{ background: 'rgb(255,255,255)' }}>
          <RewardsCardBanner
            userEmail={recruit?.email || null}
            onOpenRewardsCard={handleRewardsClick}
          />
        </div>
      )}

      {/* Invisible Hover Trigger Strip - Smart detection avoids canvas sections */}
      {!isCasinoPage && !isAccountPage && (
        <div
          className="fixed left-0 right-0 hidden lg:block pointer-events-auto z-[895]"
          style={{
            top: '48px',
            // Minimal 5px activation zone - only opens when cursor touches the header edge
            height: '5px',
          }}
          onMouseEnter={openDesktopMenu}
          onMouseLeave={scheduleDesktopMenuClose}
        />
      )}

      {/* Desktop Dropdown Menu - Apple-style (disabled on games pages) */}
      {!isCasinoPage && desktopMenuOpen && (
        <>
          {/* Backdrop - click to close */}
          <div
            className="fixed inset-0 hidden lg:block z-[899]"
            onClick={() => setDesktopMenuOpen(false)}
          />
          <div
            className="fixed left-0 right-0 bottom-0 hidden lg:block pointer-events-none z-[900]"
            style={{
              top: '48px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
        </>
      )}
      {/* Desktop Dropdown Content — only rendered on non-casino pages to prevent
          invisible links from capturing clicks over the game area */}
      {!isCasinoPage && (
      <div
        className={`fixed left-0 right-0 z-[950] hidden lg:block transition-opacity ${desktopMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{
          top: '48px',
          transform: desktopMenuOpen ? 'translateY(0)' : 'translateY(-4px)',
          transition: 'opacity 150ms ease-in-out, transform 180ms ease-in-out',
          willChange: 'opacity, transform',
        }}
        onMouseEnter={openDesktopMenu}
        onMouseLeave={scheduleDesktopMenuClose}
        data-apple-section
      >
        <div style={{ background: '#ffffff', borderBottom: '1px solid #000000' }}>
          <div className="max-w-[1200px] mx-auto px-10 py-10 grid grid-cols-3 gap-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>Shop</p>
              <div className="mt-5 space-y-3">
                {STORE_CATEGORIES.map(cat => (
                  <Link
                    key={cat.value}
                    href={cat.href}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="block text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded"
                    style={{ color: '#000000' }}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>Quick Links</p>
              <div className="mt-5 space-y-3">
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    setAffiliateModalOpen(true);
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000' }}
                >
                  Affiliates
                </button>
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    openProductsModal();
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000' }}
                >
                  BULLMONEY VIP+
                </button>
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    navigateToGames();
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000' }}
                >
                  Games
                </button>
                <Link
                  href="/design"
                  onClick={() => setDesktopMenuOpen(false)}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded"
                  style={{ color: '#000000' }}
                >
                  Design Studio
                </Link>
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    setFaqModalOpen(true);
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000' }}
                >
                  FAQ
                </button>
                {isAuthenticated && recruit ? (
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      router.push('/store/account');
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000' }}
                  >
                    Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      startPagemodeLogin();
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000' }}
                  >
                    Sign In
                  </button>
                )}
                <Link
                  href="/"
                  onClick={() => setDesktopMenuOpen(false)}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded"
                  style={{ color: '#000000' }}
                >
                  Back to Home
                </Link>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>Preferences</p>
              <div className="mt-5 space-y-3">
                <div className="max-w-[260px]">
                  <LanguageToggle
                    variant="row"
                    dropDirection="down"
                    dropAlign="left"
                    rowDropdown="inline"
                    tone="light"
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() => {
                    toggleThemePicker();
                    setDesktopMenuOpen(false);
                  }}
                  className="block text-left text-lg font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000', fontWeight: showThemePicker ? 600 : 500 }}
                >
                  Theme Picker {showThemePicker ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => {
                    toggleUltimateHub();
                    setDesktopMenuOpen(false);
                  }}
                  className="block text-left text-lg font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000', fontWeight: showUltimateHub ? 600 : 500 }}
                >
                  Ultimate Hub {showUltimateHub ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => {
                    toggleAudioWidget();
                    setDesktopMenuOpen(false);
                  }}
                  className="block text-left text-lg font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                  style={{ color: '#000000', fontWeight: showAudioWidget ? 600 : 500 }}
                >
                  Audio Widget {showAudioWidget ? 'On' : 'Off'}
                </button>
                {isDesignPage && (
                  <button
                    onClick={() => {
                      toggleDesignSections();
                      setDesktopMenuOpen(false);
                    }}
                    className="block text-left text-lg font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000', fontWeight: showDesignSections ? 600 : 500 }}
                  >
                    Design Sections {showDesignSections ? 'On' : 'Off'}
                  </button>
                )}
                {effectiveAdmin && (
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      setAdminModalOpen(true);
                    }}
                    className="block text-left text-lg font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000' }}
                  >
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Manual Dropdown - Inline on Games Pages */}
      {isCasinoPage && manualDropdownOpen && (
        <>
          {/* Backdrop - click to close */}
          <div
            className="fixed inset-0 hidden lg:block z-[899]"
            onClick={() => setManualDropdownOpen(false)}
          />
          <div
            className="fixed left-0 right-0 bottom-0 hidden lg:block pointer-events-none z-[900]"
            style={{
              top: '48px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
        </>
      )}

      {isCasinoPage && (
        <>
          {/* Desktop Manual Dropdown */}
          <div
            className={`fixed left-0 right-0 z-[950] hidden lg:block transition-opacity ${manualDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{
              top: '48px',
              transform: manualDropdownOpen ? 'translateY(0)' : 'translateY(-4px)',
              transition: 'opacity 150ms ease-in-out, transform 180ms ease-in-out',
              willChange: 'opacity, transform',
            }}
            data-apple-section
          >
            <div style={{ background: '#ffffff', borderBottom: '1px solid #000000' }}>
              <div className="max-w-[1200px] mx-auto px-10 py-10 grid grid-cols-3 gap-10">
                {/* How to Play */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>How to Play</p>
                  <div className="mt-5 space-y-2 text-sm" style={{ color: '#000000' }}>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Browse available demo games</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Click any game to launch</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Start with virtual play money</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>No account required to play</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Use browser back to exit</span>
                    </p>
                  </div>
                </div>

                {/* Important Notice */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>Important Notice</p>
                  <div className="mt-5 space-y-3">
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>Demo Only</p>
                      <p className="text-xs" style={{ color: '#666666' }}>Virtual play money with no real value. This is NOT real gambling.</p>
                    </div>
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>18+ Only</p>
                      <p className="text-xs" style={{ color: '#666666' }}>Must be 18+ years old to access these entertainment games.</p>
                    </div>
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>Play Responsibly</p>
                      <p className="text-xs" style={{ color: '#666666' }}>Take breaks and remember this is just entertainment.</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>Support & Links</p>
                  <div className="mt-5 space-y-3">
                    <p className="text-sm" style={{ color: '#000000' }}>Your donations help us obtain gaming licenses and keep games free.</p>
                    <Link
                      href="/community"
                      onClick={() => setManualDropdownOpen(false)}
                      className="block text-lg font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-2 py-1 rounded"
                      style={{ color: '#000000' }}
                    >
                      → Community Page
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setManualDropdownOpen(false)}
                      className="block text-lg font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-2 py-1 rounded"
                      style={{ color: '#000000' }}
                    >
                      → Back to Main Site
                    </Link>
                    <button
                      onClick={() => setManualDropdownOpen(false)}
                      className="block text-left text-lg font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-2 py-1 rounded w-full"
                      style={{ color: '#000000' }}
                    >
                      Close Manual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Manual Dropdown */}
          <div
            className={`fixed left-0 right-0 z-[950] lg:hidden transition-all ${manualDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{
              top: '48px',
              transform: manualDropdownOpen ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 150ms ease-in-out, transform 180ms ease-in-out',
              willChange: 'opacity, transform',
            }}
          >
            <div style={{ background: '#ffffff', borderBottom: '1px solid #000000' }}>
              <div className="px-6 py-6 space-y-6">
                {/* How to Play */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#666666' }}>How to Play</p>
                  <div className="space-y-2 text-sm" style={{ color: '#000000' }}>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Browse available demo games</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Click any game to launch</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Start with virtual play money</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>No account required</span>
                    </p>
                  </div>
                </div>

                {/* Important Notice */}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#666666' }}>Important</p>
                  <div className="space-y-2">
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>Demo Only</p>
                      <p className="text-xs" style={{ color: '#666666' }}>Virtual play money with no real value.</p>
                    </div>
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>18+ Only</p>
                      <p className="text-xs" style={{ color: '#666666' }}>Must be 18+ to access.</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <Link
                    href="/community"
                    onClick={() => setManualDropdownOpen(false)}
                    className="block text-base font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-3 py-2 rounded mb-2"
                    style={{ color: '#000000' }}
                  >
                    → Community Page
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setManualDropdownOpen(false)}
                    className="block text-base font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-3 py-2 rounded mb-2"
                    style={{ color: '#000000' }}
                  >
                    → Back to Main Site
                  </Link>
                  <button
                    onClick={() => setManualDropdownOpen(false)}
                    className="block text-left w-full text-base font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-3 py-2 rounded"
                    style={{ color: '#000000' }}
                  >
                    Close Manual
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Menu */}
      <LazyAnimatePresence>
        {mobileMenuOpen && (
          <>
            <LazyMotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={handleCloseMobileMenu}
              className="fixed inset-0 z-[1200]"
              style={{ background: 'rgba(0,0,0,0.18)', willChange: 'opacity' }}
            />
            <LazyMotionDiv
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.14, ease: [0.25, 1, 0.5, 1] }}
              className="fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] z-[1300] p-4 flex flex-col overflow-y-auto overscroll-contain touch-pan-y"
              style={{
                background: 'rgb(255,255,255)',
                borderLeft: '1px solid rgba(0,0,0,0.1)',
                willChange: 'transform',
                WebkitOverflowScrolling: 'touch',
              }}
              data-apple-section
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-medium" style={{ color: 'rgb(0,0,0)' }}>Menu</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (isAuthenticated && recruit) {
                        router.push('/store/account');
                        return;
                      }
                      startPagemodeLogin();
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.05)', color: 'rgb(0,0,0)' }}
                    title={isAuthenticated ? 'Account' : 'Sign In / Register'}
                    aria-label={isAuthenticated ? 'Open account' : 'Sign in or register'}
                  >
                    <User className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCloseMobileMenu}
                    className="h-8 w-8 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.05)', color: 'rgb(0,0,0)' }}
                    aria-label="Close mobile menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Shop Button - Mobile (first) */}
              <Link
                href="/store"
                onClick={handleCloseMobileMenu}
                className="mb-3 block text-left text-base font-semibold tracking-tight transition-colors"
                style={{ color: 'rgba(0,0,0,0.95)' }}
              >
                Shop
              </Link>

              <div className="mb-3 border-b border-black/10 pb-2">
                <details className="group">
                  <summary className="cursor-pointer list-none py-2 text-base font-medium" style={{ color: 'rgba(0,0,0,0.95)' }}>
                    <span className="flex items-center justify-between">
                      <span>Shop Pages</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" style={{ color: 'rgba(0,0,0,0.55)' }} />
                    </span>
                  </summary>
                  <div className="space-y-1 pb-1 pl-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openProductsModal();
                      }}
                      className="block w-full py-1.5 text-left text-sm"
                      style={{ color: 'rgba(0,0,0,0.85)' }}
                    >
                      BULLMONEY VIP+
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLiveStreamModalOpen(true);
                      }}
                      className="block w-full py-1.5 text-left text-sm"
                      style={{ color: 'rgba(0,0,0,0.85)' }}
                    >
                      Live Stream
                    </button>
                    <Link
                      href="/design"
                      onClick={handleCloseMobileMenu}
                      className="block py-1.5 text-sm"
                      style={{ color: 'rgba(0,0,0,0.85)' }}
                    >
                      Design Page
                    </Link>
                  </div>
                </details>
              </div>

              <div className="mb-3 border-b border-black/10 pb-2">
                <details className="group">
                  <summary className="cursor-pointer list-none py-2 text-base font-medium" style={{ color: 'rgba(0,0,0,0.95)' }}>
                    <span className="flex items-center justify-between">
                      <span>About Us</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" style={{ color: 'rgba(0,0,0,0.55)' }} />
                    </span>
                  </summary>
                  <div className="space-y-1 pb-1 pl-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setFaqModalOpen(true);
                      }}
                      className="block w-full py-1.5 text-left text-sm"
                      style={{ color: 'rgba(0,0,0,0.85)' }}
                    >
                      FAQ
                    </button>
                    <Link
                      href="/"
                      onClick={handleCloseMobileMenu}
                      className="block py-1.5 text-sm"
                      style={{ color: 'rgba(0,0,0,0.85)' }}
                    >
                      Back to Home
                    </Link>
                  </div>
                </details>
              </div>

              {isAuthenticated && recruit && (
                <div className="mb-3 border-b border-black/10 pb-2">
                  <details className="group">
                    <summary className="cursor-pointer list-none py-2 text-base font-medium" style={{ color: 'rgba(0,0,0,0.95)' }}>
                      <span className="flex items-center justify-between">
                        <span>Account</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" style={{ color: 'rgba(0,0,0,0.55)' }} />
                      </span>
                    </summary>
                    <div className="space-y-1 pb-1 pl-2">
                      <Link
                        href="/recruit"
                        onClick={handleCloseMobileMenu}
                        className="block py-1.5 text-sm"
                        style={{ color: 'rgba(0,0,0,0.85)' }}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full py-1.5 text-left text-sm"
                        style={{ color: 'rgba(0,0,0,0.85)' }}
                      >
                        Logout
                      </button>
                    </div>
                  </details>
                </div>
              )}
              
              {/* Admin Button - Mobile, dev only */}
              {effectiveAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAdminModalOpen(true);
                  }}
                  className="mb-3 text-left text-sm font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(113,46,165,0.95)' }}
                >
                  Admin Panel
                </button>
              )}
              
              {/* Toggles Section - Mobile */}
              <div className="space-y-3 mb-4 border-b border-black/10 pb-3">
                <button
                  onClick={toggleThemePicker}
                  className="w-full flex items-center justify-between text-left text-base font-medium tracking-tight"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                  role="switch"
                  aria-checked={showThemePicker}
                >
                  <span>Themes</span>
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ background: showThemePicker ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.2)' }}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full transition-transform ${showThemePicker ? 'translate-x-5' : 'translate-x-1'}`}
                      style={{ background: showThemePicker ? 'rgb(255,255,255)' : 'rgb(0,0,0)' }}
                    />
                  </span>
                </button>

                <button
                  onClick={toggleUltimateHub}
                  className="w-full flex items-center justify-between text-left text-base font-medium tracking-tight"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                  role="switch"
                  aria-checked={showUltimateHub}
                >
                  <span>Hub</span>
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ background: showUltimateHub ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.2)' }}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full transition-transform ${showUltimateHub ? 'translate-x-5' : 'translate-x-1'}`}
                      style={{ background: showUltimateHub ? 'rgb(255,255,255)' : 'rgb(0,0,0)' }}
                    />
                  </span>
                </button>

                <button
                  onClick={toggleAudioWidget}
                  className="w-full flex items-center justify-between text-left text-base font-medium tracking-tight"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                  role="switch"
                  aria-checked={showAudioWidget}
                >
                  <span>Audio</span>
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ background: showAudioWidget ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.2)' }}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full transition-transform ${showAudioWidget ? 'translate-x-5' : 'translate-x-1'}`}
                      style={{ background: showAudioWidget ? 'rgb(255,255,255)' : 'rgb(0,0,0)' }}
                    />
                  </span>
                </button>

                {isDesignPage && (
                  <button
                    onClick={toggleDesignSections}
                    className="w-full flex items-center justify-between text-left text-base font-medium tracking-tight"
                    style={{ color: 'rgba(0,0,0,0.95)' }}
                    role="switch"
                    aria-checked={showDesignSections}
                  >
                    <span>Sections</span>
                    <span
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ background: showDesignSections ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.2)' }}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full transition-transform ${showDesignSections ? 'translate-x-5' : 'translate-x-1'}`}
                        style={{ background: showDesignSections ? 'rgb(255,255,255)' : 'rgb(0,0,0)' }}
                      />
                    </span>
                  </button>
                )}
              </div>
              
              {/* More - Mobile (animated list) */}
              <div className="mb-4 border-b border-black/10 pb-3">
                <LazyMotionUl
                  initial="hidden"
                  animate="show"
                  variants={MOBILE_MENU_LIST_VARIANTS}
                  className="space-y-1"
                >
                  <LazyMotionLi variants={MOBILE_MENU_ITEM_VARIANTS}>
                    <LazyMotionButton
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAffiliateModalOpen(true);
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold tracking-tight text-white"
                      style={{
                        backgroundImage: 'linear-gradient(110deg, rgb(10,25,63) 15%, rgb(18,53,116) 40%, rgb(30,84,186) 50%, rgb(18,53,116) 60%, rgb(10,25,63) 85%)',
                        backgroundSize: '240% 100%',
                        boxShadow: '0 0 0 1px rgba(30,84,186,0.35), 0 5px 14px rgba(10,25,63,0.28)',
                      }}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%'],
                      }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Affiliates
                    </LazyMotionButton>
                  </LazyMotionLi>
                  <LazyMotionLi variants={MOBILE_MENU_ITEM_VARIANTS}>
                    <LazyMotionButton
                      onClick={() => {
                        navigateToGames();
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold tracking-tight text-white"
                      style={{
                        backgroundImage: 'linear-gradient(110deg, rgb(8,22,56) 15%, rgb(14,44,102) 40%, rgb(25,74,170) 50%, rgb(14,44,102) 60%, rgb(8,22,56) 85%)',
                        backgroundSize: '240% 100%',
                        boxShadow: '0 0 0 1px rgba(25,74,170,0.35), 0 5px 14px rgba(8,22,56,0.28)',
                      }}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%'],
                      }}
                      transition={{ duration: 2.6, repeat: Infinity, repeatType: 'loop', ease: 'linear', delay: 0.16 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Games
                    </LazyMotionButton>
                  </LazyMotionLi>
                </LazyMotionUl>
              </div>

              <div className="mt-auto pt-2">
                <div className="border-t border-black/10 pt-3 pb-2">
                  <LanguageToggle
                    variant="row"
                    dropDirection="up"
                    dropAlign="left"
                    rowDropdown="inline"
                    tone="light"
                    className="w-full"
                  />
                </div>
              </div>

            </LazyMotionDiv>
          </>
        )}
      </LazyAnimatePresence>
      
      {/* All Modals - Rendered globally so they work on every page */}
      
      {/* Products Modal - Rendered once, controlled by context */}
      {isProductsModalOpen && <ProductsModal />}

      {/* Live Stream Modal - Rendered once, controlled by context */}
      {isLiveStreamModalOpen && <LiveStreamModal />}

      {/* Affiliate Modal - Using Lazy System */}
      <LazyAffiliateModal
        isOpen={affiliateModalOpen}
        onClose={() => setAffiliateModalOpen(false)}
      />
      
      {/* FAQ Modal - Using Lazy System */}
      <LazyFaqModal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
      />

      {/* Site-Wide Search Overlay */}
      <SiteSearchOverlay
        isOpen={siteSearchOpen}
        onClose={() => setSiteSearchOpen(false)}
      />

      {/* Cart Drawer - Always available wherever StoreHeader is rendered */}
      <CartDrawer />

      {/* Admin Hub Modal - dev only, store/home pages only */}
      {!isCasinoPage && (effectiveAdmin || canUseDevAdminShortcut) && adminModalOpen && (
        <div style={{ zIndex: 800 }}>
          <AdminHubModal
            isOpen={adminModalOpen}
            onClose={() => setAdminModalOpen(false)}
          />
        </div>
      )}

      {/* Games Manual Modal - Only for casino pages */}
      {isCasinoPage && (
        <GamesManualModal
          isOpen={gamesManualOpen}
          onClose={() => setGamesManualOpen(false)}
        />
      )}

      {/* Modals available everywhere */}
      {!isCasinoPage && (
        <>
          {/* DEV ONLY: Admin visibility toggle */}
          {isDev && isAdmin && (
            <button
              onClick={() => setDevAdminEnabled(prev => !prev)}
              style={{
                position: 'fixed',
                bottom: 12,
                left: 12,
                zIndex: 9999,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: devAdminEnabled ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)',
                background: devAdminEnabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
                color: devAdminEnabled ? '#111111' : 'rgba(0,0,0,0.6)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={devAdminEnabled ? 'Click to view as non-admin' : 'Click to restore admin view'}
            >
              <span style={{ fontSize: 13 }}>{devAdminEnabled ? '\ud83d\udee1\ufe0f' : '\ud83d\udc64'}</span>
              {devAdminEnabled ? 'Admin ON' : 'Admin OFF'}
            </button>
          )}
        </>
      )}
    </>
  );
}
