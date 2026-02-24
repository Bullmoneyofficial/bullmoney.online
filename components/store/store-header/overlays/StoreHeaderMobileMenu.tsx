'use client';

import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import X from 'lucide-react/dist/esm/icons/x';
import User from 'lucide-react/dist/esm/icons/user';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';

import { MOBILE_MENU_ITEM_VARIANTS, MOBILE_MENU_LIST_VARIANTS, STOREHEADER_STORAGE_KEYS } from '../constants';
import { LanguageToggle, LazyAnimatePresence, LazyMotionA, LazyMotionButton, LazyMotionDiv, LazyMotionLi, LazyMotionUl } from '../lazy';

type RecruitLike = {
  email?: string | null;
} | null;

export type StoreHeaderMobileMenuProps = {
  isMounted: boolean;
  open: boolean;
  shouldSkipHeavyEffects: boolean;

  isAuthenticated: boolean;
  recruit: RecruitLike;

  canOpenAdminHub: boolean;
  isDesignPage: boolean;

  showThemePicker: boolean;
  showUltimateHub: boolean;
  showAudioWidget: boolean;
  showDesignSections: boolean;

  manualDropdownOpen: boolean;

  setMobileMenuOpen: (next: boolean) => void;

  openAccountDrawer: () => void;
  startPagemodeLogin: (redirectPath?: string) => void;

  navigateToStore: (target: string) => void;
  navigateToHome: () => void;
  navigateToGames: () => void;

  openProductsModal: () => void;
  openSocialsDrawer: () => void;
  openCourseDrawer: () => void;

  setLiveStreamModalOpen: (next: boolean) => void;
  setFaqModalOpen: (next: boolean) => void;
  setAffiliateModalOpen: (next: boolean) => void;
  setAdminModalOpen: (next: boolean) => void;

  handleCloseMobileMenu: () => void;
  handleOpenMobileMenu: () => void;
  handleHeroModeChange: (mode: 'design' | 'trader' | 'store') => void;

  handleLogout: () => void;

  toggleThemePicker: () => void;
  toggleUltimateHub: () => void;
  toggleAudioWidget: () => void;
  toggleDesignSections: () => void;
};

export const StoreHeaderMobileMenu = memo(function StoreHeaderMobileMenu({
  isMounted,
  open,
  shouldSkipHeavyEffects,
  isAuthenticated,
  recruit,
  canOpenAdminHub,
  isDesignPage,
  showThemePicker,
  showUltimateHub,
  showAudioWidget,
  showDesignSections,
  setMobileMenuOpen,
  openAccountDrawer,
  startPagemodeLogin,
  navigateToStore,
  navigateToHome,
  navigateToGames,
  openProductsModal,
  openSocialsDrawer,
  openCourseDrawer,
  setLiveStreamModalOpen,
  setFaqModalOpen,
  setAffiliateModalOpen,
  setAdminModalOpen,
  handleCloseMobileMenu,
  handleHeroModeChange,
  handleLogout,
  toggleThemePicker,
  toggleUltimateHub,
  toggleAudioWidget,
  toggleDesignSections,
}: StoreHeaderMobileMenuProps) {
  const content = (
    <LazyAnimatePresence>
      {open && (
        <>
          <LazyMotionDiv
            initial={shouldSkipHeavyEffects ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldSkipHeavyEffects ? undefined : { opacity: 0 }}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.1 }}
            onClick={handleCloseMobileMenu}
            className="fixed inset-0 z-[1200]"
            data-storeheader-lock-ui="true"
            style={{
              background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.18)',
              willChange: 'opacity',
            }}
          />
          <LazyMotionDiv
            initial={shouldSkipHeavyEffects ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={shouldSkipHeavyEffects ? undefined : { x: '100%' }}
            transition={
              shouldSkipHeavyEffects
                ? { duration: 0 }
                : { type: 'tween', duration: 0.14, ease: [0.25, 1, 0.5, 1] }
            }
            className="fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] z-[1300] p-4 flex flex-col overflow-y-auto overscroll-contain touch-pan-y"
            data-storeheader-lock-ui="true"
            style={{
              background: 'rgb(255,255,255)',
              backgroundColor: '#ffffff',
              colorScheme: 'light' as const,
              borderLeft: '1px solid rgba(0,0,0,0.1)',
              willChange: 'transform',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'none',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-medium" style={{ color: 'rgb(0,0,0)' }}>
                Menu
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isAuthenticated && recruit) {
                      openAccountDrawer();
                      return;
                    }
                    if (typeof window !== 'undefined') {
                      try {
                        localStorage.setItem(STOREHEADER_STORAGE_KEYS.accountDrawerPending, 'true');
                      } catch {
                        // Ignore storage errors
                      }
                    }
                    startPagemodeLogin('/store');
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

            {canOpenAdminHub && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAdminModalOpen(true);
                }}
                className="mb-3 w-full rounded-xl px-4 py-3 text-left text-base font-semibold tracking-tight"
                style={{ background: '#000000', color: '#ffffff' }}
              >
                Admin Hub
              </button>
            )}

            <a
              href="/store"
              onClick={(event) => {
                event.preventDefault();
                navigateToStore('/store');
              }}
              className="mb-3 block text-left text-base font-semibold tracking-tight transition-colors"
              style={{ color: 'rgba(0,0,0,0.95)' }}
            >
              Shop
            </a>

            <div className="mb-3 border-b border-black/10 pb-2">
              <details className="group">
                <summary
                  className="cursor-pointer list-none py-2 text-base font-medium"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                >
                  <span className="flex items-center justify-between">
                    <span>Shop Pages</span>
                    <ChevronDown
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      style={{ color: 'rgba(0,0,0,0.55)' }}
                    />
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
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleHeroModeChange('design');
                    }}
                    className="block w-full py-1.5 text-left text-sm"
                    style={{ color: 'rgba(0,0,0,0.85)' }}
                  >
                    Design Page
                  </button>
                </div>
              </details>
            </div>

            <div className="mb-3 border-b border-black/10 pb-2">
              <details className="group">
                <summary
                  className="cursor-pointer list-none py-2 text-base font-medium"
                  style={{ color: 'rgba(0,0,0,0.95)' }}
                >
                  <span className="flex items-center justify-between">
                    <span>About Us</span>
                    <ChevronDown
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      style={{ color: 'rgba(0,0,0,0.55)' }}
                    />
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
                  <a
                    href="/"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToHome();
                    }}
                    className="block py-1.5 text-sm"
                    style={{ color: 'rgba(0,0,0,0.85)' }}
                  >
                    Back to Home
                  </a>
                </div>
              </details>
            </div>

            {isAuthenticated && recruit && (
              <div className="mb-3 border-b border-black/10 pb-2">
                <details className="group">
                  <summary
                    className="cursor-pointer list-none py-2 text-base font-medium"
                    style={{ color: 'rgba(0,0,0,0.95)' }}
                  >
                    <span className="flex items-center justify-between">
                      <span>Account</span>
                      <ChevronDown
                        className="h-4 w-4 transition-transform group-open:rotate-180"
                        style={{ color: 'rgba(0,0,0,0.55)' }}
                      />
                    </span>
                  </summary>
                  <div className="space-y-1 pb-1 pl-2">
                    <button
                      onClick={openAccountDrawer}
                      className="block w-full py-1.5 text-left text-sm"
                      style={{ color: 'rgba(0,0,0,0.85)' }}
                    >
                      Profile
                    </button>
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

            {canOpenAdminHub && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAdminModalOpen(true);
                }}
                className="mb-3 text-left text-sm font-medium tracking-tight transition-colors"
                style={{ color: 'rgba(113,46,165,0.95)' }}
              >
                Admin Hub
              </button>
            )}

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
                    className={`inline-block h-5 w-5 rounded-full transition-transform ${
                      showThemePicker ? 'translate-x-5' : 'translate-x-1'
                    }`}
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
                    className={`inline-block h-5 w-5 rounded-full transition-transform ${
                      showUltimateHub ? 'translate-x-5' : 'translate-x-1'
                    }`}
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
                    className={`inline-block h-5 w-5 rounded-full transition-transform ${
                      showAudioWidget ? 'translate-x-5' : 'translate-x-1'
                    }`}
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
                    style={{
                      background: showDesignSections ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full transition-transform ${
                        showDesignSections ? 'translate-x-5' : 'translate-x-1'
                      }`}
                      style={{ background: showDesignSections ? 'rgb(255,255,255)' : 'rgb(0,0,0)' }}
                    />
                  </span>
                </button>
              )}
            </div>

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
                      openSocialsDrawer();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold tracking-tight text-white"
                    style={{
                      backgroundImage:
                        'linear-gradient(110deg, rgb(10,25,63) 15%, rgb(18,53,116) 40%, rgb(30,84,186) 50%, rgb(18,53,116) 60%, rgb(10,25,63) 85%)',
                      backgroundSize: '240% 100%',
                      boxShadow: '0 0 0 1px rgba(30,84,186,0.35), 0 5px 14px rgba(10,25,63,0.28)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Social
                  </LazyMotionButton>
                </LazyMotionLi>

                <LazyMotionLi variants={MOBILE_MENU_ITEM_VARIANTS}>
                  <LazyMotionButton
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openCourseDrawer();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold tracking-tight text-white"
                    style={{
                      backgroundImage:
                        'linear-gradient(110deg, rgb(10,25,63) 15%, rgb(18,53,116) 40%, rgb(30,84,186) 50%, rgb(18,53,116) 60%, rgb(10,25,63) 85%)',
                      backgroundSize: '240% 100%',
                      boxShadow: '0 0 0 1px rgba(30,84,186,0.35), 0 5px 14px rgba(10,25,63,0.28)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Course
                  </LazyMotionButton>
                </LazyMotionLi>

                <LazyMotionLi variants={MOBILE_MENU_ITEM_VARIANTS}>
                  <LazyMotionButton
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAffiliateModalOpen(true);
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold tracking-tight text-white"
                    style={{
                      backgroundImage:
                        'linear-gradient(110deg, rgb(10,25,63) 15%, rgb(18,53,116) 40%, rgb(30,84,186) 50%, rgb(18,53,116) 60%, rgb(10,25,63) 85%)',
                      backgroundSize: '240% 100%',
                      boxShadow: '0 0 0 1px rgba(30,84,186,0.35), 0 5px 14px rgba(10,25,63,0.28)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Affiliates
                  </LazyMotionButton>
                </LazyMotionLi>

                <LazyMotionLi variants={MOBILE_MENU_ITEM_VARIANTS}>
                  <LazyMotionA
                    href="/games"
                    onClick={(event) => {
                      event.preventDefault();
                      handleCloseMobileMenu();
                      navigateToGames();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold tracking-tight text-white"
                    style={{
                      backgroundImage:
                        'linear-gradient(110deg, rgb(8,22,56) 15%, rgb(14,44,102) 40%, rgb(25,74,170) 50%, rgb(14,44,102) 60%, rgb(8,22,56) 85%)',
                      backgroundSize: '240% 100%',
                      boxShadow: '0 0 0 1px rgba(25,74,170,0.35), 0 5px 14px rgba(8,22,56,0.28)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'linear',
                      delay: 0.16,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Games
                  </LazyMotionA>
                </LazyMotionLi>
              </LazyMotionUl>
            </div>

            <div className="mt-3 pt-2">
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
  );

  if (!isMounted) return content;

  if (typeof document !== 'undefined') {
    // Portal to <html> to avoid ancestor transforms breaking fixed positioning
    // This matches existing StoreHeader behavior.
    return createPortal(content, document.documentElement);
  }

  return content;
});
