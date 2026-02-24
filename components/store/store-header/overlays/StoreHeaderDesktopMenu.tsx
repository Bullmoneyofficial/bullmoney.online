'use client';

import React, { memo } from 'react';
import { createPortal } from 'react-dom';

import { STORE_CATEGORIES } from '../constants';
import { LanguageToggle } from '../lazy';

type RecruitLike = {
  email?: string | null;
} | null;

export type StoreHeaderDesktopMenuProps = {
  isMounted: boolean;
  isCasinoPage: boolean;
  desktopMenuOpen: boolean;
  shouldSkipHeavyEffects: boolean;

  isDesignPage: boolean;

  showThemePicker: boolean;
  showUltimateHub: boolean;
  showAudioWidget: boolean;
  showDesignSections: boolean;

  canOpenAdminHub: boolean;

  isAuthenticated: boolean;
  recruit: RecruitLike;

  openDesktopMenu: () => void;
  scheduleDesktopMenuClose: () => void;

  setDesktopMenuOpen: (next: boolean) => void;

  setAffiliateModalOpen: (next: boolean) => void;
  openProductsModal: () => void;
  openSocialsDrawer: () => void;
  openCourseDrawer: () => void;
  navigateToGames: () => void;
  handleHeroModeChange: (mode: 'design' | 'trader' | 'store') => void;
  setFaqModalOpen: (next: boolean) => void;

  openAccountDrawer: () => void;
  startPagemodeLogin: () => void;
  navigateToHome: () => void;
  navigateToStore: (target: string) => void;

  toggleThemePicker: () => void;
  toggleUltimateHub: () => void;
  toggleAudioWidget: () => void;
  toggleDesignSections: () => void;

  setAdminModalOpen: (next: boolean) => void;
};

export const StoreHeaderDesktopMenu = memo(function StoreHeaderDesktopMenu({
  isMounted,
  isCasinoPage,
  desktopMenuOpen,
  shouldSkipHeavyEffects,
  isDesignPage,
  showThemePicker,
  showUltimateHub,
  showAudioWidget,
  showDesignSections,
  canOpenAdminHub,
  isAuthenticated,
  recruit,
  openDesktopMenu,
  scheduleDesktopMenuClose,
  setDesktopMenuOpen,
  setAffiliateModalOpen,
  openProductsModal,
  openSocialsDrawer,
  openCourseDrawer,
  navigateToGames,
  handleHeroModeChange,
  setFaqModalOpen,
  openAccountDrawer,
  startPagemodeLogin,
  navigateToHome,
  navigateToStore,
  toggleThemePicker,
  toggleUltimateHub,
  toggleAudioWidget,
  toggleDesignSections,
  setAdminModalOpen,
}: StoreHeaderDesktopMenuProps) {
  if (!isMounted || typeof document === 'undefined' || isCasinoPage) return null;

  return (
    <>
      {desktopMenuOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 hidden lg:block z-899" onClick={() => setDesktopMenuOpen(false)} />
            <div
              className="fixed left-0 right-0 bottom-0 hidden lg:block pointer-events-none z-900"
              style={{
                top: '48px',
                background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.95)',
              }}
            />
          </>,
          document.documentElement
        )}

      {createPortal(
        <div
          className={`fixed left-0 right-0 z-950 hidden lg:block transition-opacity ${
            desktopMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            top: '48px',
            transform: desktopMenuOpen ? 'translateY(0)' : 'translateY(-4px)',
            transition: 'opacity 150ms ease-in-out, transform 180ms ease-in-out',
            willChange: 'opacity, transform',
            backgroundColor: '#ffffff',
            colorScheme: 'light' as const,
          }}
          onMouseEnter={openDesktopMenu}
          onMouseLeave={scheduleDesktopMenuClose}
        >
          <div style={{ background: '#ffffff', borderBottom: '1px solid #000000' }}>
            <div className="max-w-300 mx-auto px-10 py-10 grid grid-cols-3 gap-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>
                  Shop
                </p>
                <div className="mt-5 space-y-3">
                  {STORE_CATEGORIES.map((cat) => (
                    <a
                      key={cat.value}
                      href={cat.href}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateToStore(cat.href);
                      }}
                      className="block text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded"
                      style={{ color: '#000000' }}
                    >
                      {cat.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>
                  Quick Links
                </p>
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
                      openSocialsDrawer();
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000' }}
                  >
                    Social
                  </button>
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      openCourseDrawer();
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000' }}
                  >
                    Course
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
                  <button
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      handleHeroModeChange('design');
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                    style={{ color: '#000000' }}
                  >
                    Design Studio
                  </button>
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
                        openAccountDrawer();
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

                  <a
                    href="/"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToHome();
                    }}
                    className="block text-left text-2xl font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded"
                    style={{ color: '#000000' }}
                  >
                    Back to Home
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>
                  Preferences
                </p>
                <div className="mt-5 space-y-3">
                  <div className="max-w-65">
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

                  {canOpenAdminHub && (
                    <button
                      onClick={() => {
                        setDesktopMenuOpen(false);
                        setAdminModalOpen(true);
                      }}
                      className="block text-left text-lg font-medium tracking-tight transition-colors hover:bg-neutral-100 px-2 py-1 rounded w-full"
                      style={{ color: '#000000' }}
                    >
                      Admin Hub
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.documentElement
      )}
    </>
  );
});
