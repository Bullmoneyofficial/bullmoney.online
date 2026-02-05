'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Home, LogOut, Users, HelpCircle, Calendar, Settings, Eye, EyeOff, Palette, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useProductsModalUI, useThemeSelectorModalUI } from '@/contexts/UIStateContext';
import dynamic from 'next/dynamic';
import { StorePillNav } from './StorePillNav';

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

// Pill nav items for the store
const STORE_NAV_ITEMS = [
  { href: '/store', label: 'All Products' },
  { href: '/store?category=apparel', label: 'Apparel' },
  { href: '/store?category=accessories', label: 'Accessories' },
  { href: '/store?category=tech-gear', label: 'Tech' },
  { href: '/store?category=limited-edition', label: 'Limited' },
  { href: '/', label: 'Home' },
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
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [accountManagerModalOpen, setAccountManagerModalOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUltimateHub, setShowUltimateHub] = useState(true);
  const { openCart, getItemCount } = useCartStore();
  const { isAuthenticated, recruit, signOut } = useRecruitAuth();
  const { isAdmin } = useAdminAuth();
  const { open: openProductsModal } = useProductsModalUI();
  const { setIsOpen: setThemePickerModalOpen } = useThemeSelectorModalUI();
  const itemCount = getItemCount();
  const router = useRouter();
  
  // Load Theme Picker preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('store_show_theme_picker');
      // Default to false (hidden) unless explicitly set to true
      const shouldShow = stored === 'true';
      setShowThemePicker(shouldShow);
      setThemePickerModalOpen(shouldShow); // Sync with modal state
      if (shouldShow) {
        window.dispatchEvent(new Event('store_theme_picker_toggle'));
      }
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
  
  const toggleThemePicker = () => {
    const newValue = !showThemePicker;
    setShowThemePicker(newValue);
    setThemePickerModalOpen(newValue); // Actually control the modal
    if (typeof window !== 'undefined') {
      localStorage.setItem('store_show_theme_picker', String(newValue));
      window.dispatchEvent(new Event('store_theme_picker_toggle'));
    }
  };

  const toggleUltimateHub = () => {
    const newValue = !showUltimateHub;
    setShowUltimateHub(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('store_show_ultimate_hub', String(newValue));
      // Fire both CustomEvent (with detail) and plain Event for backward compatibility
      window.dispatchEvent(new CustomEvent('store_ultimate_hub_toggle', { detail: newValue }));
      window.dispatchEvent(new Event('store_ultimate_hub_toggle'));
    }
  };

  const handleLogout = () => {
    signOut();
    setMobileMenuOpen(false);
  };
  
  // Handle user click - navigate to profile or login
  const handleUserClick = () => {
    if (isAuthenticated && recruit) {
      router.push('/recruit');
    } else {
      router.push('/login');
    }
  };
  
  // Handle search click - scroll to search on store page
  const handleSearchClick = () => {
    router.push('/store');
  };

  return (
    <>
      {/* Modern Pill Navigation Header */}
      <StorePillNav
        logo="/ONcc2l601.svg"
        logoAlt="Bullmoney Store"
        items={STORE_NAV_ITEMS}
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
        showSearch={true}
        showUser={true}
        showCart={true}
        isAuthenticated={isAuthenticated}
        userInitial={recruit?.email?.charAt(0) || 'U'}
        onMobileMenuClick={() => setMobileMenuOpen(true)}
      />
      
      {/* Secondary Action Bar - Desktop only */}
      <div className="fixed top-[64px] left-0 right-0 z-[490] bg-black/80 backdrop-blur-sm border-b border-white/5 hidden lg:block">
        <div className="max-w-[1800px] mx-auto px-6 h-12 flex items-center justify-between">
          {/* Left: Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Picker Toggle */}
            <button
              onClick={toggleThemePicker}
              className={`h-8 px-3 flex items-center gap-2 rounded-lg transition-colors text-xs ${
                showThemePicker 
                  ? 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              title={showThemePicker ? 'Theme Picker: ON' : 'Theme Picker: OFF'}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Themes</span>
              {showThemePicker ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            {/* Ultimate Hub Toggle */}
            <button
              onClick={toggleUltimateHub}
              className={`h-8 px-3 flex items-center gap-2 rounded-lg transition-colors text-xs ${
                showUltimateHub 
                  ? 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              title={showUltimateHub ? 'Ultimate Hub: ON' : 'Ultimate Hub: OFF'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hub</span>
              {showUltimateHub ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
          
          {/* Right: Feature Links */}
          <div className="flex items-center gap-2">
            {/* Affiliates Button */}
            <button
              onClick={() => setAffiliateModalOpen(true)}
              className="h-8 px-3 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Affiliates</span>
            </button>
            
            {/* Products Button */}
            <button
              onClick={() => openProductsModal()}
              className="h-8 px-3 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Products</span>
            </button>
            
            {/* FAQ Button */}
            <button
              onClick={() => setFaqModalOpen(true)}
              className="h-8 px-3 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-xs"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQ</span>
            </button>
            
            {/* Account Manager - Desktop only, shown for authenticated users */}
            {isAuthenticated && recruit && (
              <button
                onClick={() => setAccountManagerModalOpen(true)}
                className="h-8 px-3 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-xs"
                title="Account Manager"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </button>
            )}
            
            {/* Admin Button - Desktop only, shown for admins */}
            {isAdmin && (
              <button
                onClick={() => setAdminModalOpen(true)}
                className="h-8 px-3 flex items-center gap-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all text-purple-300 text-xs"
                title="Admin Panel"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 z-[600]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-black border-l border-white/10 z-[700] p-4 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-light">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 active:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shop Categories */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-1">Shop Categories</h3>
                <div className="flex flex-wrap gap-1.5">
                  {STORE_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.value}
                      href={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium hover:bg-white/20 transition-colors border border-white/5"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Section */}
              {isAuthenticated && recruit ? (
                <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-sm font-medium uppercase">
                        {recruit.email.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{recruit.email}</p>
                      <p className="text-[10px] text-white/40">Member</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/recruit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 h-7 flex items-center justify-center gap-1.5 rounded-md bg-white/10 text-xs hover:bg-white/20 transition-colors"
                    >
                      <User className="w-3 h-3" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 h-7 flex items-center justify-center gap-1.5 rounded-md bg-white/10 text-xs hover:bg-white/20 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-3 h-9 flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/10 text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In / Register
                </Link>
              )}
              
              {/* Admin Button - Mobile */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAdminModalOpen(true);
                  }}
                  className="mb-2 h-8 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-xs font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                >
                  <Settings className="w-4 h-4 text-purple-300" />
                  Admin Panel
                </button>
              )}
              
              {/* Account Manager Button - Mobile (for authenticated users) */}
              {isAuthenticated && recruit && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAccountManagerModalOpen(true);
                  }}
                  className="mb-2 h-8 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-all"
                >
                  <User className="w-4 h-4" />
                  Account Manager
                </button>
              )}
              
              {/* Toggles Section - Mobile */}
              <div className="space-y-1 mb-3 pb-3 border-b border-white/10">
                <p className="text-[10px] text-white/40 px-3 mb-1 uppercase tracking-wider">Toggles</p>
                
                {/* Theme Picker Toggle */}
                <button
                  onClick={toggleThemePicker}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-colors ${
                    showThemePicker 
                      ? 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <span>Theme Picker</span>
                  </div>
                  {showThemePicker ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Ultimate Hub Toggle */}
                <button
                  onClick={toggleUltimateHub}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-colors ${
                    showUltimateHub 
                      ? 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Ultimate Hub</span>
                  </div>
                  {showUltimateHub ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Site Features - Mobile */}
              <div className="space-y-0.5 mb-3 pb-3 border-b border-white/10">
                <p className="text-[10px] text-white/40 px-3 mb-1 uppercase tracking-wider">Features</p>
                
                {/* Affiliates */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAffiliateModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Affiliates
                </button>
                
                {/* Products */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openProductsModal();
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Products
                </button>
                
                {/* FAQ */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setFaqModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </button>
              </div>
              
              {/* Main Site Navigation - Mobile */}
              <div className="space-y-0.5 mb-3 pb-3 border-b border-white/10">
                <p className="text-[10px] text-white/40 px-3 mb-1 uppercase tracking-wider">Site Navigation</p>
                {MAIN_NAV_BUTTONS.map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <Link
                      key={btn.href}
                      href={btn.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {btn.label}
                    </Link>
                  );
                })}
              </div>

              {/* Back to Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 w-full h-9 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Back to Home
              </Link>

              {/* Shop Now Button - Mobile */}
              <Link
                href="/store"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 w-full h-9 flex items-center justify-center rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Shop Now
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* All Modals - Same as Main Site Navigation */}
      
      {/* Products Modal - Rendered once, controlled by context */}
      <ProductsModal />
      
      {/* Admin Hub Modal */}
      {isAdmin && adminModalOpen && (
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
    </>
  );
}
