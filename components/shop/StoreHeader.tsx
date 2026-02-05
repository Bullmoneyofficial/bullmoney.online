'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, User, ChevronLeft, Home, LogOut } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';

// ============================================================================
// STORE HEADER - NAVIGATION WITH PORTAL MOBILE MENU
// Uses React Portal to escape stacking context for mobile menu
// ============================================================================

const NAV_LINKS = [
  { href: '/store', label: 'Shop' },
  { href: '/store?category=apparel', label: 'Apparel' },
  { href: '/store?category=accessories', label: 'Accessories' },
  { href: '/store?category=tech', label: 'Tech' },
];

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart, getItemCount } = useCartStore();
  const { isAuthenticated, recruit, signOut } = useRecruitAuth();
  const itemCount = getItemCount();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
        {/* No blur - clean black background */}
        <div className="absolute inset-0 bg-black border-b border-white/5" />
        
        <nav className="relative max-w-[1800px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
          {/* Back Button - Shown on nested pages */}
          {isNestedPage && !isAdminPage && (
            <motion.button
              onClick={handleBack}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}

          {/* Home Button - Go back to main site */}
          <Link 
            href="/"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            title="Back to Home"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* Logo */}
          <Link href="/store" className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-white to-white/60 flex items-center justify-center">
              <span className="text-black font-bold text-base md:text-lg">B</span>
            </div>
            <span className="text-lg md:text-xl font-light tracking-tight hidden sm:block">
              Store
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/60 hover:text-white transition-colors text-sm tracking-wide"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/store"
              className="h-10 px-5 flex items-center justify-center rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Shop Now
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search - Desktop */}
            <Link 
              href="/store" 
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Account - Show user initial if authenticated */}
            {isAuthenticated && recruit ? (
              <Link 
                href="/recruit" 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                title={recruit.email}
              >
                <span className="text-sm font-medium uppercase">
                  {recruit.email.charAt(0)}
                </span>
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                title="Sign In"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Cart Button */}
            <motion.button
              onClick={openCart}
              className="relative h-10 px-4 flex items-center gap-2 rounded-xl bg-white text-black hover:bg-white/90 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence mode="wait">
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="text-sm font-medium"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white/5"
            >
              <Menu className="w-5 h-5" />
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
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/70"
                style={{ zIndex: 2147483648 }}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-black border-l border-white/10 p-6 flex flex-col"
                style={{ zIndex: 2147483649 }}
              >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-light">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Account Section */}
              {isAuthenticated && recruit ? (
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-lg font-medium uppercase">
                        {recruit.email.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{recruit.email}</p>
                      <p className="text-xs text-white/40">Member</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/recruit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 h-9 flex items-center justify-center gap-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-6 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Sign In / Register
                </Link>
              )}
              
              <div className="space-y-1 flex-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 rounded-xl text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Back to Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>

              {/* Shop Now Button - Mobile */}
              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 w-full h-12 flex items-center justify-center rounded-xl bg-white text-black font-medium hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Shop Now
              </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
