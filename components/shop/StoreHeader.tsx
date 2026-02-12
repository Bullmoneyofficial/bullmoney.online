'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, User, ChevronLeft, Home, LogOut } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useProductsModalUI, useThemeSelectorModalUI } from '@/contexts/UIStateContext';
import TextType from '@/components/TextType';
import CountUp from '@/components/CountUp';

import dynamic from 'next/dynamic';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

const LazyFaqModal = dynamic(() => import('@/components/navbar/LazyModalSystem').then(mod => ({ default: mod.LazyFaqModal })), { ssr: false });

// ============================================================================
// STORE HEADER - NAVIGATION WITH PORTAL MOBILE MENU
// Uses React Portal to escape stacking context for mobile menu
// ============================================================================

// Core nav items shown in desktop and mobile menus
// Items with action property use button handlers instead of Link navigation
const NAV_LINKS: Array<{ href: string; label: string; action?: string }> = [
  { href: '/games', label: 'Games' },
  { href: '/store', label: 'Shop' },
  { href: '/store/account', label: 'Account' },
  { href: '/store?category=apparel', label: 'Apparel' },
  { href: '/store?category=accessories', label: 'Accessories' },
  { href: '/store?category=tech', label: 'Tech' },
  { href: '/store#print-design', label: 'Print & Design' },
  { href: '/store#digital-art', label: 'Digital Art' },
  // Main site utilities - these open modals/toggles
  { href: '#', label: 'Products', action: 'products' },
  { href: '#', label: 'FAQ', action: 'faq' },
  { href: '#', label: 'Themes', action: 'themes' },
  { href: '#', label: 'Hub', action: 'hub' },
];

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart, getItemCount } = useCartStore();
  const { isAuthenticated, recruit, signOut } = useRecruitAuth();
  const itemCount = getItemCount();
  const router = useRouter();
  const pathname = usePathname();
  const { open: openProductsModal } = useProductsModalUI();
  const { setIsOpen: setThemePickerModalOpen } = useThemeSelectorModalUI();
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [showUltimateHub, setShowUltimateHub] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

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
      if (pathname === '/') {
        window.dispatchEvent(new Event('bullmoney_force_pagemode'));
        return;
      }
    }
    router.push('/');
  }, [router, pathname]);
  
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setShowUltimateHub(localStorage.getItem('store_show_ultimate_hub') === 'true');
      setShowThemePicker(localStorage.getItem('store_show_theme_picker') === 'true');
    }
  }, []);

  const handleNavAction = (action: string) => {
    SoundEffects.click();
    if (action === 'products') {
      openProductsModal();
    } else if (action === 'faq') {
      setFaqModalOpen(true);
    } else if (action === 'themes') {
      const newValue = !showThemePicker;
      setShowThemePicker(newValue);
      setThemePickerModalOpen(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_theme_picker', String(newValue));
        window.dispatchEvent(new Event('store_theme_picker_toggle'));
      }
    } else if (action === 'hub') {
      const newValue = !showUltimateHub;
      setShowUltimateHub(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_ultimate_hub', String(newValue));
        window.dispatchEvent(new CustomEvent('store_ultimate_hub_toggle', { detail: newValue }));
        window.dispatchEvent(new Event('store_ultimate_hub_toggle'));
      }
    }
    setMobileMenuOpen(false);
  };
  
  // Determine if we're on a nested page (product detail, checkout, etc.)
  const isNestedPage = pathname !== '/store' && pathname.startsWith('/store');
  const isProductPage = pathname.includes('/store/product/');
  const isCheckoutPage = pathname.includes('/store/checkout');
  const isAdminPage = pathname.includes('/store/admin');

  const handleBack = () => {
    if (isCheckoutPage) {
      router.push('/store');
    } else if (isProductPage) {
      router.back();
    } else {
      router.push('/store');
    }
  };

  const handleLogout = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Store Header - Positioned below main navbar, high z-index above overlays */}
      <header className="fixed left-0 right-0 z-[960]" style={{ top: '64px' }}>
        {/* Desktop: top-20 (80px), Mobile: top-16 (64px) */}
        <style jsx>{`
          @media (min-width: 768px) {
            header {
              top: 80px !important;
            }
          }
        `}</style>
        {/* No blur - clean white background */}
        <div className="absolute inset-0 bg-white border-b border-black/10" />
        
        <nav className="relative max-w-[1800px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            {/* Back Button - Shown on nested pages */}
            {isNestedPage && !isAdminPage && (
              <motion.button
                onClick={handleBack}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-black/10 hover:border-black/20 active:scale-95 transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </motion.button>
            )}

            {/* Home Button - Go back to main site */}
            <Link 
              href="/"
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-black/10 hover:border-black/20 transition-colors"
              title="Back to Home"
            >
              <Home className="w-4 h-4 text-black" />
            </Link>
          </div>

          {/* Logo - Centered on mobile */}
          <Link href="/store" className="flex items-center gap-3 md:flex-none">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center">
              <img src="/bullmoney-logo.png" alt="BullMoney" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
            </div>
            <span className="text-lg md:text-xl font-light tracking-tight hidden sm:block text-black">
              <TextType text="Store" typingSpeed={25} showCursor={false} loop={false} as="span" />
            </span>
          </Link>

          {/* Right spacer for mobile centering */}
          <div className="flex-1 md:hidden" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              link.action ? (
                <button
                  key={link.label}
                  onClick={() => handleNavAction(link.action!)}
                  className="text-black hover:text-black transition-colors text-sm tracking-wide bg-transparent border-none cursor-pointer"
                >
                  <TextType text={link.label} typingSpeed={Math.max(10, 30 - link.label.length)} showCursor={false} loop={false} as="span" />
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-black hover:text-black transition-colors text-sm tracking-wide"
                >
                  <TextType text={link.label} typingSpeed={Math.max(10, 30 - link.label.length)} showCursor={false} loop={false} as="span" />
                </Link>
              )
            ))}
            <Link
              href="/store"
              className="h-10 px-5 flex items-center justify-center rounded-xl bg-white border border-black/10 text-black text-sm font-medium hover:border-black/20 transition-colors"
            >
              <TextType text="Shop Now" typingSpeed={18} showCursor={false} loop={false} as="span" />
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search - Desktop */}
            <Link 
              href="/store" 
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-black/10 hover:border-black/20 transition-colors"
            >
              <Search className="w-5 h-5 text-black" />
            </Link>

            {/* Account - Show user initial if authenticated */}
            {isAuthenticated && recruit ? (
              <Link 
                href="/recruit" 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-black/10 hover:border-black/20 transition-colors"
                title={recruit.email}
              >
                <span className="text-sm font-medium uppercase text-black">
                  {recruit.email.charAt(0)}
                </span>
              </Link>
            ) : (
              <button
                onClick={startPagemodeLogin}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-black/10 hover:border-black/20 transition-colors"
                title="Sign In"
                type="button"
              >
                <User className="w-5 h-5 text-black" />
              </button>
            )}

            {/* Cart Button */}
            <motion.button
              onClick={openCart}
              className="relative h-10 px-4 flex items-center gap-2 rounded-xl bg-white border border-black/10 text-black hover:border-black/20 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="w-5 h-5 text-black" />
              <AnimatePresence mode="wait">
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="text-sm font-medium"
                  >
                    <CountUp to={itemCount} from={0} duration={0.5} separator="" className="" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-black/10"
            >
              <Menu className="w-5 h-5 text-black" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Rendered via Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: [0.42, 0, 0.58, 1] }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-white/80"
                style={{ zIndex: 2147483648, willChange: 'opacity' }}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.22, ease: [0.42, 0, 0.58, 1] }}
                className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white border-l border-black/10 p-6 flex flex-col"
                style={{ zIndex: 2147483649, willChange: 'transform' }}
              >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-light text-black"><TextType text="Menu" typingSpeed={25} showCursor={false} loop={false} as="span" /></span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-black/10 active:border-black/20"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              {/* Account Section */}
              {isAuthenticated && recruit ? (
                <div className="mb-6 p-4 rounded-xl bg-white border border-black/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center">
                      <span className="text-lg font-medium uppercase text-black">
                        {recruit.email.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-black">{recruit.email}</p>
                      <p className="text-xs text-black/50">Member</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/recruit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg bg-white border border-black/10 text-sm text-black hover:border-black/20 transition-colors"
                    >
                      <User className="w-4 h-4 text-black" />
                      <TextType text="Profile" typingSpeed={20} showCursor={false} loop={false} as="span" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg bg-white border border-black/10 text-sm text-black hover:border-black/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-black" />
                      <TextType text="Logout" typingSpeed={20} showCursor={false} loop={false} as="span" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    startPagemodeLogin();
                  }}
                  className="mb-6 h-12 flex items-center justify-center gap-2 rounded-xl bg-white border border-black/10 text-sm font-medium text-black hover:border-black/20 transition-colors"
                  type="button"
                >
                  <User className="w-5 h-5 text-black" />
                  <TextType text="Sign In / Register" typingSpeed={12} showCursor={false} loop={false} as="span" />
                </button>
              )}
              
              <div className="space-y-1 flex-1">
                {NAV_LINKS.map((link) => (
                  link.action ? (
                    <button
                      key={link.label}
                      onClick={() => handleNavAction(link.action!)}
                      className="block w-full text-left py-3 px-4 rounded-xl text-black hover:bg-white hover:border-black/20 border border-transparent transition-colors"
                    >
                      <TextType text={link.label} typingSpeed={Math.max(10, 25 - link.label.length)} showCursor={false} loop={false} as="span" />
                    </button>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 px-4 rounded-xl text-black hover:bg-white hover:border-black/20 border border-transparent transition-colors"
                    >
                      <TextType text={link.label} typingSpeed={Math.max(10, 25 - link.label.length)} showCursor={false} loop={false} as="span" />
                    </Link>
                  )
                ))}
              </div>

              {/* Back to Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-black/10 text-black hover:border-black/20 transition-colors"
              >
                <Home className="w-4 h-4 text-black" />
                <TextType text="Back to Home" typingSpeed={15} showCursor={false} loop={false} as="span" />
              </Link>

              {/* Shop Now Button - Mobile */}
              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 w-full h-12 flex items-center justify-center rounded-xl bg-white border border-black/10 text-black font-medium hover:border-black/20 active:scale-[0.98] transition-all"
              >
                <TextType text="Shop Now" typingSpeed={18} showCursor={false} loop={false} as="span" />
              </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* FAQ Modal */}
      {faqModalOpen && (
        <LazyFaqModal isOpen={faqModalOpen} onClose={() => setFaqModalOpen(false)} />
      )}
    </>
  );
}
