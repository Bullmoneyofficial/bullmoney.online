'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, User, Home, LogOut, Users, HelpCircle, Calendar, Settings, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useProductsModalUI, useThemeSelectorModalUI, useAuthModalUI } from '@/contexts/UIStateContext';
import dynamic from 'next/dynamic';
import { StorePillNav } from './StorePillNav';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

// Lazy-load framer-motion — only needed when mobile menu is opened
const LazyMotionDiv = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.div })), { ssr: false });
const LazyAnimatePresence = dynamic(() => import('framer-motion').then(m => ({ default: m.AnimatePresence })), { ssr: false });

// Lazy load modals - same as main navbar
const AdminHubModal = dynamic(() => import('@/components/AdminHubModal'), { ssr: false });
const AccountManagerModal = dynamic(() => import('@/components/AccountManagerModal').then(mod => ({ default: mod.AccountManagerModal })), { ssr: false });

// Import lazy modal system from navbar (same as main site)
import { LazyAffiliateModal, LazyFaqModal } from '@/components/navbar/LazyModalSystem';
import { ProductsModal } from '@/components/ProductsModal';

// ============================================================================
// STORE HEADER - MODERN PILL NAVIGATION 
// Real store-style header with animated pill nav + cart/user actions
// ============================================================================

// Pill nav items for the store - including scroll-to functionality
const STORE_NAV_ITEMS = [
  { href: '/', label: 'Home', category: '' },
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

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [accountManagerModalOpen, setAccountManagerModalOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUltimateHub, setShowUltimateHub] = useState(false);
  const desktopMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openCart, getItemCount } = useCartStore();
  const { isAuthenticated, recruit, signOut } = useRecruitAuth();
  const { isAdmin } = useAdminAuth();
  const isDev = process.env.NODE_ENV === 'development';
  const [devAdminEnabled, setDevAdminEnabled] = useState(true);
  const effectiveAdmin = isDev && isAdmin && devAdminEnabled;
  const { open: openProductsModal } = useProductsModalUI();
  const { setIsOpen: setThemePickerModalOpen } = useThemeSelectorModalUI();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  const itemCount = getItemCount();
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (desktopMenuCloseTimer.current) {
        clearTimeout(desktopMenuCloseTimer.current);
      }
    };
  }, []);
  
  // Load Theme Picker preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always start OFF on page load
      setShowThemePicker(false);
      setThemePickerModalOpen(false);
    }
  }, [setThemePickerModalOpen]);

  // Load Ultimate Hub preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('store_show_ultimate_hub');
      // Default to false (hide) unless explicitly enabled
      setShowUltimateHub(stored === 'true');
      // Broadcast current state so listeners sync immediately on load
      const currentValue = stored === 'true';
      window.dispatchEvent(new CustomEvent('store_ultimate_hub_toggle', { detail: currentValue }));
      window.dispatchEvent(new Event('store_ultimate_hub_toggle'));
    }
  }, []);
  
  const toggleThemePicker = useCallback(() => {
    SoundEffects.click();
    setShowThemePicker(prev => {
      const newValue = !prev;
      setThemePickerModalOpen(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_theme_picker', String(newValue));
        window.dispatchEvent(new Event('store_theme_picker_toggle'));
      }
      return newValue;
    });
  }, [setThemePickerModalOpen]);

  const toggleUltimateHub = useCallback(() => {
    SoundEffects.click();
    setShowUltimateHub(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_ultimate_hub', String(newValue));
        window.dispatchEvent(new CustomEvent('store_ultimate_hub_toggle', { detail: newValue }));
        window.dispatchEvent(new Event('store_ultimate_hub_toggle'));
      }
      return newValue;
    });
  }, []);

  const desktopLinks = useMemo(() => {
    const links = [
      { label: 'Affiliates', onClick: () => setAffiliateModalOpen(true), variant: 'link' as const },
      { label: 'Products', onClick: () => openProductsModal(), variant: 'link' as const },
      { label: 'FAQ', onClick: () => setFaqModalOpen(true), variant: 'link' as const },
      { label: 'Themes', onClick: toggleThemePicker, isActive: showThemePicker, variant: 'toggle' as const },
      { label: 'Hub', onClick: toggleUltimateHub, isActive: showUltimateHub, variant: 'toggle' as const },
    ];

    return links;
  }, [openProductsModal, setAffiliateModalOpen, setFaqModalOpen, showThemePicker, showUltimateHub, toggleThemePicker, toggleUltimateHub]);

  const openDesktopMenu = useCallback(() => {
    if (desktopMenuCloseTimer.current) {
      clearTimeout(desktopMenuCloseTimer.current);
      desktopMenuCloseTimer.current = null;
    }
    setDesktopMenuOpen(true);
  }, []);

  const scheduleDesktopMenuClose = useCallback(() => {
    if (desktopMenuCloseTimer.current) {
      clearTimeout(desktopMenuCloseTimer.current);
    }
    desktopMenuCloseTimer.current = setTimeout(() => {
      setDesktopMenuOpen(false);
    }, 140);
  }, []);

  const handleLogout = useCallback(() => {
    SoundEffects.close();
    signOut();
    setMobileMenuOpen(false);
  }, [signOut]);
  
  // Handle user click - open auth modal or go to account
  const handleUserClick = useCallback(() => {
    SoundEffects.click();
    if (isAuthenticated && recruit) {
      router.push('/store/account');
    } else {
      setAuthModalOpen(true);
    }
  }, [isAuthenticated, recruit, router, setAuthModalOpen]);
  
  // Handle search click - scroll to search on store page
  const handleSearchClick = useCallback(() => {
    SoundEffects.click();
    router.push('/store');
  }, [router]);
  
  // Handle category click - navigate and scroll to products (only for store pages)
  const handleCategoryClick = useCallback((href: string) => {
    SoundEffects.tab();
    // Open auth modal for login instead of navigating
    if (href === '/login') {
      setAuthModalOpen(true);
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
  }, [router, setAuthModalOpen]);

  const handleOpenMobileMenu = useCallback(() => {
    SoundEffects.open();
    setMobileMenuOpen(true);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    SoundEffects.close();
    setMobileMenuOpen(false);
  }, []);

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
        baseColor="#000000"
        pillColor="#ffffff"
        hoveredPillTextColor="#000000"
        pillTextColor="#000000"
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
        isAuthenticated={isAuthenticated}
        userInitial={recruit?.email?.charAt(0) || 'U'}
        onMobileMenuClick={handleOpenMobileMenu}
        onDesktopMenuEnter={openDesktopMenu}
        onDesktopMenuLeave={scheduleDesktopMenuClose}
      />

      {/* Desktop Dropdown Menu - Apple-style */}
      {desktopMenuOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 hidden lg:block pointer-events-none"
          style={{
            top: '48px',
            zIndex: 480,
            background: 'rgba(15,15,15,0.08)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        />
      )}
      <div
        className={`fixed left-0 right-0 z-490 hidden lg:block transition-opacity ${desktopMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ top: '48px' }}
        onMouseEnter={openDesktopMenu}
        onMouseLeave={scheduleDesktopMenuClose}
      >
        <div style={{ background: 'rgb(255,255,255)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="max-w-[1200px] mx-auto px-10 py-10 grid grid-cols-3 gap-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'rgba(0,0,0,0.5)' }}>Shop</p>
              <div className="mt-5 space-y-3">
                {STORE_CATEGORIES.map(cat => (
                  <Link
                    key={cat.value}
                    href={cat.href}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="block text-2xl font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.9)' }}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'rgba(0,0,0,0.5)' }}>Quick Links</p>
              <div className="mt-5 space-y-3">
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    setAffiliateModalOpen(true);
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.9)' }}
                >
                  Affiliates
                </button>
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    openProductsModal();
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.9)' }}
                >
                  Products
                </button>
                <button
                  onClick={() => {
                    setDesktopMenuOpen(false);
                    setFaqModalOpen(true);
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.9)' }}
                >
                  FAQ
                </button>
                {isAuthenticated && recruit ? (
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      setAccountManagerModalOpen(true);
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.9)' }}
                  >
                    Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.9)' }}
                  >
                    Sign In
                  </button>
                )}
                <Link
                  href="/"
                  onClick={() => setDesktopMenuOpen(false)}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.9)' }}
                >
                  Back to Home
                </Link>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'rgba(0,0,0,0.5)' }}>Preferences</p>
              <div className="mt-5 space-y-3">
                <div className="max-w-[260px]">
                  <LanguageToggle variant="row" dropDirection="down" tone="light" />
                </div>
                {showThemePicker && (
                  <button
                    onClick={() => {
                      toggleThemePicker();
                      setDesktopMenuOpen(false);
                    }}
                    className="block text-left text-lg font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.85)' }}
                  >
                    Theme Picker
                  </button>
                )}
                <button
                  onClick={() => {
                    toggleUltimateHub();
                    setDesktopMenuOpen(false);
                  }}
                  className="block text-left text-lg font-medium tracking-tight transition-colors"
                  style={{ color: showUltimateHub ? 'rgb(0,0,0)' : 'rgba(0,0,0,0.85)' }}
                >
                  Ultimate Hub {showUltimateHub ? 'On' : 'Off'}
                </button>
                {effectiveAdmin && (
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      setAdminModalOpen(true);
                    }}
                    className="block text-left text-lg font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.85)' }}
                  >
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <LazyAnimatePresence>
        {mobileMenuOpen && (
          <>
            <LazyMotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseMobileMenu}
              className="fixed inset-0 z-600"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            />
            <LazyMotionDiv
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] z-700 p-4 flex flex-col overflow-y-auto"
              style={{ background: 'rgb(255,255,255)', borderLeft: '1px solid rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-medium" style={{ color: 'rgb(0,0,0)' }}>Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.05)', color: 'rgb(0,0,0)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Section */}
              {isAuthenticated && recruit ? (
                <div className="mb-6 space-y-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAccountManagerModalOpen(true);
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.95)' }}
                  >
                    Account
                  </button>
                  <Link
                    href="/recruit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.95)' }}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors"
                    style={{ color: 'rgba(0,0,0,0.95)' }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="mb-6 w-full text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                >
                  Sign In / Register
                </button>
              )}
              
              {/* Admin Button - Mobile, dev only */}
              {effectiveAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAdminModalOpen(true);
                  }}
                  className="mb-6 text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(113,46,165,0.95)' }}
                >
                  Admin Panel
                </button>
              )}
              
              {/* Toggles Section - Mobile */}
              <div className="space-y-4 mb-6">
                <LanguageToggle
                  variant="row"
                  dropDirection="down"
                  dropAlign="left"
                  rowDropdown="inline"
                  tone="light"
                />

                <button
                  onClick={toggleThemePicker}
                  className="w-full flex items-center justify-between text-left text-2xl font-medium tracking-tight"
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
                  className="w-full flex items-center justify-between text-left text-2xl font-medium tracking-tight"
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
              </div>
              
              {/* Site Features - Mobile */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAffiliateModalOpen(true);
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                >
                  Affiliates
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openProductsModal();
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                >
                  Products
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setFaqModalOpen(true);
                  }}
                  className="block text-left text-2xl font-medium tracking-tight transition-colors"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                >
                  FAQ
                </button>
              </div>

              {/* Back to Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-left text-2xl font-medium tracking-tight transition-colors"
                style={{ color: 'rgba(0,0,0,0.95)' }}
              >
                Back to Home
              </Link>

              {/* Shop Now Button - Mobile */}
              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 block text-left text-2xl font-medium tracking-tight transition-colors"
                style={{ color: 'rgba(0,0,0,0.95)' }}
              >
                Shop Now
              </Link>
            </LazyMotionDiv>
          </>
        )}
      </LazyAnimatePresence>
      
      {/* All Modals - Same as Main Site Navigation */}
      
      {/* Products Modal - Rendered once, controlled by context */}
      <ProductsModal />
      
      {/* Admin Hub Modal - dev only */}
      {effectiveAdmin && adminModalOpen && (
        <div style={{ zIndex: 800 }}>
          <AdminHubModal
            isOpen={adminModalOpen}
            onClose={() => setAdminModalOpen(false)}
          />
        </div>
      )}
      
      {/* Affiliate Modal - Using Lazy System */}
      <LazyAffiliateModal
        isOpen={affiliateModalOpen}
        onClose={() => setAffiliateModalOpen(false)}
      />
      
      {/* Account Manager Modal */}
      {isAuthenticated && recruit && accountManagerModalOpen && (
        <div style={{ zIndex: 800 }}>
          <AccountManagerModal
            isOpen={accountManagerModalOpen}
            onClose={() => setAccountManagerModalOpen(false)}
          />
        </div>
      )}
      
      {/* FAQ Modal - Using Lazy System */}
      <LazyFaqModal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
      />

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
            borderColor: devAdminEnabled ? '#a855f7' : '#666',
            background: devAdminEnabled ? 'rgba(168,85,247,0.15)' : 'rgba(50,50,50,0.9)',
            color: devAdminEnabled ? '#c084fc' : '#999',
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
  );
}
