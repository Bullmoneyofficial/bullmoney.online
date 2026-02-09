'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Search from 'lucide-react/dist/esm/icons/search';
import User from 'lucide-react/dist/esm/icons/user';
import Menu from 'lucide-react/dist/esm/icons/menu';
import dynamic from 'next/dynamic';

// Lazy-load framer-motion — only needed for cart badge animation
const LazyMotionButton = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.button })), { ssr: false });
const LazyMotionSpan = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.span })), { ssr: false });
const LazyAnimatePresence = dynamic(() => import('framer-motion').then(m => ({ default: m.AnimatePresence })), { ssr: false });

import type { HeroMode } from '@/hooks/useHeroMode';

// ============================================================================
// STORE PILL NAV - Simple, Reliable Store Navigation
// Modern store-style header with pill navigation
// ============================================================================

export type StorePillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export type StorePillNavLink = {
  label: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  isActive?: boolean;
  variant?: 'link' | 'toggle';
};

export interface StorePillNavProps {
  logo?: string;
  logoAlt?: string;
  items: StorePillNavItem[];
  desktopLinks?: StorePillNavLink[];
  className?: string;
  position?: 'fixed' | 'static';
  cartCount?: number;
  onCartClick?: () => void;
  onSearchClick?: () => void;
  onUserClick?: () => void;
  onCategoryClick?: (href: string) => void;
  showSearch?: boolean;
  showUser?: boolean;
  showCart?: boolean;
  isAuthenticated?: boolean;
  userInitial?: string;
  onMobileMenuClick?: () => void;
  onDesktopMenuEnter?: () => void;
  onDesktopMenuLeave?: () => void;
  // Hero mode toggle
  heroMode?: HeroMode;
  onHeroModeChange?: (mode: HeroMode) => void;
  onStoreButtonClick?: () => void;
  // Legacy props (ignored but kept for compatibility)
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  initialLoadAnimation?: boolean;
}

export const StorePillNav: React.FC<StorePillNavProps> = memo(({
  logo = '/BULL.svg',
  logoAlt = 'Bullmoney',
  desktopLinks = [],
  className = '',
  position = 'fixed',
  cartCount = 0,
  onCartClick,
  onSearchClick,
  onUserClick,
  showSearch = true,
  showUser = true,
  showCart = true,
  isAuthenticated = false,
  userInitial = 'U',
  onMobileMenuClick,
  onDesktopMenuEnter,
  onDesktopMenuLeave,
  heroMode,
  onHeroModeChange,
  onStoreButtonClick,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const handleMobileMenuClick = useCallback(() => {
    onMobileMenuClick?.();
  }, [onMobileMenuClick]);

  const headerClassName = position === 'fixed'
    ? `fixed top-0 left-0 right-0 z-500 ${className}`
    : `relative w-full ${className}`;

  // SSR fallback
  if (!mounted) {
    return (
      <header className={headerClassName} style={{ background: 'rgb(255,255,255)' }} />
    );
  }

  return (
    <>
      <header
        className={headerClassName}
        style={{ background: 'rgb(255,255,255)' }}
        data-apple-section
      >
        <nav
          className="w-full px-6 md:px-10 h-12 flex items-center justify-between gap-6"
          style={{ background: 'rgb(255,255,255)' }}
          data-apple-section
          onMouseEnter={onDesktopMenuEnter}
          onMouseLeave={onDesktopMenuLeave}
        >
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/store"
              className="relative shrink-0 w-8 h-8 block"
              aria-label="Bullmoney Store"
            >
              <img
                src={logo}
                alt={logoAlt}
                className="w-full h-full object-contain"
              />
            </Link>
            <Link href="/store" className="shrink-0 text-[13px] font-medium tracking-wide hidden sm:block" style={{ color: '#111111' }}>
              bullmoney
            </Link>
          </div>

          {/* Center: Simple Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 text-[12px] font-medium tracking-wide" style={{ color: 'rgba(0,0,0,0.85)' }}>
            {desktopLinks.map((link) => {
              const linkClass = `transition-colors text-black hover:text-white group-hover:text-white ${link.isActive ? '' : 'hover:opacity-100'}`;
              const pillClass = 'group h-8 px-4 rounded-full bg-white flex items-center gap-2 border border-black/10 transition-colors hover:bg-black hover:border-black';
              if (link.variant === 'toggle') {
                return (
                  <button
                    key={link.label}
                    onClick={link.onClick}
                    className={pillClass}
                    aria-label={link.ariaLabel || link.label}
                    role="switch"
                    aria-checked={!!link.isActive}
                  >
                    <span className={linkClass}>{link.label}</span>
                    <span
                      className="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
                      style={{ background: link.isActive ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.2)' }}
                    >
                      <span
                        className={`inline-block h-3 w-3 rounded-full transition-transform ${link.isActive ? 'translate-x-3' : 'translate-x-1'}`}
                        style={{ background: link.isActive ? 'rgb(255,255,255)' : 'rgb(0,0,0)' }}
                      />
                    </span>
                  </button>
                );
              }
              if (link.href) {
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`${pillClass} ${linkClass}`}
                    aria-label={link.ariaLabel || link.label}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className={`${pillClass} ${linkClass}`}
                  aria-label={link.ariaLabel || link.label}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Right: Hero Mode Toggle + Actions */}
          <div className="flex items-center gap-1.5">
            {/* Hero Mode Toggle - Store / Trader */}
            {heroMode && onHeroModeChange && (
              <div className="hidden sm:flex items-center h-8 rounded-full border border-black/10 bg-white overflow-hidden mr-1">
                <button
                  type="button"
                  onClick={() => onStoreButtonClick ? onStoreButtonClick() : onHeroModeChange?.('store')}
                  className={`px-3 h-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all ${
                    heroMode === 'store'
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Store
                </button>
                <button
                  type="button"
                  onClick={() => onHeroModeChange('trader')}
                  className={`px-3 h-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all ${
                    heroMode === 'trader'
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Trader
                </button>
              </div>
            )}

            {showSearch && (
              <button
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onSearchClick}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {showUser && (
              <button
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onUserClick}
                aria-label="Account"
              >
                {isAuthenticated ? (
                  <span className="text-[12px] font-semibold uppercase" style={{ color: '#111111' }}>{userInitial}</span>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>
            )}

            {showCart && (
              <LazyMotionButton
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-full transition-colors bg-white border border-black/10"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onCartClick}
                whileTap={{ scale: 0.95 }}
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <LazyAnimatePresence mode="wait">
                  {cartCount > 0 && (
                    <LazyMotionSpan
                      key={cartCount}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="text-[11px] font-semibold"
                      style={{ color: '#111111' }}
                    >
                      {cartCount}
                    </LazyMotionSpan>
                  )}
                </LazyAnimatePresence>
              </LazyMotionButton>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10"
              style={{ color: 'rgba(0,0,0,0.85)' }}
              onClick={handleMobileMenuClick}
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>
    </>
  );
});

StorePillNav.displayName = 'StorePillNav';

export default StorePillNav;
