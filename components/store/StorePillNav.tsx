'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Search from 'lucide-react/dist/esm/icons/search';
import User from 'lucide-react/dist/esm/icons/user';
import Menu from 'lucide-react/dist/esm/icons/menu';
import Home from 'lucide-react/dist/esm/icons/home';
import Palette from 'lucide-react/dist/esm/icons/palette';
// No lazy framer-motion — buttons must respond instantly

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
  onDesktopMenuToggle?: () => void;
  desktopMenuOpen?: boolean;
  // Hero mode toggle
  heroMode?: HeroMode;
  onHeroModeChange?: (mode: HeroMode) => void;
  // Games page props
  hideNavigation?: boolean;
  showManualButton?: boolean;
  onManualClick?: () => void;
  // Home button (shown on app page / main page)
  showHomeButton?: boolean;
  onHomeClick?: () => void;
  showThemeButton?: boolean;
  onThemeClick?: () => void;
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
  onDesktopMenuToggle,
  desktopMenuOpen = false,
  heroMode,
  onHeroModeChange,
  hideNavigation = false,
  showManualButton = false,
  onManualClick,
  showHomeButton = false,
  onHomeClick,
  showThemeButton = false,
  onThemeClick,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const handleMobileMenuClick = useCallback(() => {
    onMobileMenuClick?.();
  }, [onMobileMenuClick]);

  const handleUserButtonClick = useCallback(() => {
    try {
      if (onUserClick) {
        onUserClick();
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bullmoney_open_account_drawer'));
      }
    } catch (error) {
      console.error('[StorePillNav] Account button handler failed:', error);
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new Event('bullmoney_open_account_drawer'));
        } catch {
          // no-op fallback
        }
      }
    }
  }, [onUserClick]);

  const headerClassName = position === 'fixed'
    ? `fixed top-0 left-0 right-0 z-[1000] ${className}`
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
              const isGames = link.label === 'Games';
              const linkClass = `transition-colors ${isGames ? 'text-white !text-white !hover:text-white !group-hover:text-white font-bold leading-tight' : 'text-black'} hover:text-white group-hover:text-white ${link.isActive ? '' : 'hover:opacity-100'}`;
              const pillClass = isGames
                ? 'group relative h-9 px-5 rounded-full flex items-center gap-2 border border-[#0a1a3a] bg-gradient-to-br from-[#6dc7ff] via-[#3a7bd5] to-[#004cbf] text-white transition-all transform-gpu shadow-[0_10px_0_#0a1a3a,0_18px_30px_rgba(0,50,120,0.28)] hover:shadow-[0_6px_0_#0a1a3a,0_12px_24px_rgba(0,50,120,0.24)] hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-[0_2px_0_#0a1a3a,0_6px_12px_rgba(0,50,120,0.22)]'
                : 'group h-8 px-4 rounded-full bg-white flex items-center gap-2 border border-black/10 transition-colors hover:bg-black hover:border-black';
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
                    {isGames && (
                      <span className="absolute inset-[-2px] rounded-full pointer-events-none games-border" aria-hidden />
                    )}
                    <span className="relative z-10">{link.label}</span>
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
            {/* Manual Button - Opens menu on games pages */}
            {showManualButton && (
              <button
                type="button"
                className="relative h-9 px-4 flex items-center gap-1.5 rounded-full transition-all bg-gradient-to-br from-[#6dc7ff] via-[#3a7bd5] to-[#004cbf] text-white border border-[#0a1a3a] transform-gpu shadow-[0_8px_0_#0a1a3a,0_14px_24px_rgba(0,50,120,0.22)] hover:-translate-y-[1px] hover:shadow-[0_6px_0_#0a1a3a,0_10px_18px_rgba(0,50,120,0.2)] active:translate-y-[2px] active:shadow-[0_2px_0_#0a1a3a,0_6px_12px_rgba(0,50,120,0.18)]"
                onClick={onManualClick}
                aria-label="Manual"
              >
                <span className="absolute inset-[-2px] rounded-full pointer-events-none games-border" aria-hidden />
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[12px] font-semibold hidden sm:inline relative z-10">Manual</span>
              </button>
            )}
            {/* Hero Mode Toggle - Store / Trader / Design */}
            {heroMode && onHeroModeChange && (
              <div className="hidden sm:flex items-center h-8 rounded-full border border-black/10 bg-white overflow-hidden mr-1">
                <button
                  type="button"
                  onClick={() => onHeroModeChange('store')}
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
                <button
                  type="button"
                  onClick={() => onHeroModeChange('design')}
                  className={`px-3 h-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all ${
                    heroMode === 'design'
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Design
                </button>
              </div>
            )}

            {/* Home Button */}
            {showHomeButton && (
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10 active:scale-95"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onHomeClick}
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </button>
            )}

            {/* Themes Button */}
            {showThemeButton && (
              <button
                type="button"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-full transition-colors bg-white border border-black/10 active:scale-95"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onThemeClick}
                aria-label="Themes"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-semibold" style={{ color: '#111111' }}>Themes</span>
              </button>
            )}

            {showSearch && (
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10 active:scale-95"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onSearchClick}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {showUser && (
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10 active:scale-95"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={handleUserButtonClick}
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
              <button
                type="button"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-full bg-white border border-black/10 active:scale-95 transition-transform duration-100"
                style={{ color: 'rgba(0,0,0,0.85)' }}
                onClick={onCartClick}
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: '#111111' }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop Menu Toggle */}
            {onDesktopMenuToggle && (
              <button
                type="button"
                className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-full transition-colors border border-black/10 ${
                  desktopMenuOpen ? 'bg-black text-white border-black' : 'bg-white text-black/85'
                }`}
                onClick={onDesktopMenuToggle}
                onMouseEnter={onDesktopMenuEnter}
                onMouseLeave={onDesktopMenuLeave}
                aria-label="Toggle menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-full transition-colors bg-white border border-black/10 active:scale-95"
              style={{ color: 'rgba(0,0,0,0.85)' }}
              onClick={handleMobileMenuClick}
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>

      <style jsx global>{`
        @keyframes games-border-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .games-border {
          background: linear-gradient(120deg, #6dc7ff, #3a7bd5, #004cbf, #3a7bd5, #6dc7ff);
          background-size: 200% 200%;
          animation: games-border-shimmer 3s linear infinite;
          padding: 2px;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.9;
        }
        .store-main-nav {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
      `}</style>
    </>
  );
});

StorePillNav.displayName = 'StorePillNav';

export default StorePillNav;
