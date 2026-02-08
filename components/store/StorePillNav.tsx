'use client';

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, User, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LanguageToggle } from '@/components/LanguageToggle';

// Lazy-load framer-motion — only needed for cart badge animation
const LazyMotionButton = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.button })), { ssr: false });
const LazyMotionSpan = dynamic(() => import('framer-motion').then(m => ({ default: m.motion.span })), { ssr: false });
const LazyAnimatePresence = dynamic(() => import('framer-motion').then(m => ({ default: m.AnimatePresence })), { ssr: false });

// ============================================================================
// STORE PILL NAV - Simple, Reliable Store Navigation
// Modern store-style header with pill navigation
// ============================================================================

export type StorePillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface StorePillNavProps {
  logo?: string;
  logoAlt?: string;
  items: StorePillNavItem[];
  className?: string;
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
  items = [],
  className = '',
  cartCount = 0,
  onCartClick,
  onSearchClick,
  onUserClick,
  onCategoryClick,
  showSearch = true,
  showUser = true,
  showCart = true,
  isAuthenticated = false,
  userInitial = 'U',
  onMobileMenuClick,
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active href based on current pathname (memoized)
  const activeHref = useMemo(() => {
    if (!pathname || !items || items.length === 0) return '/store';
    const exactMatch = items.find(item => item.href === pathname);
    if (exactMatch) return exactMatch.href;
    if (pathname.startsWith('/store')) return '/store';
    return '';
  }, [pathname, items]);

  const handleMobileMenuClick = useCallback(() => {
    onMobileMenuClick?.();
  }, [onMobileMenuClick]);

  // SSR fallback
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-500 h-16" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
    );
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-500 ${className}`} style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
            <Link 
              href="/store" 
              className="relative shrink-0 w-14 h-14 block hover:scale-105 transition-transform"
            >
              <img src={logo} alt={logoAlt} className="w-full h-full object-cover" />
            </Link>
            <Link href="/store" className="shrink-0 text-xl font-semibold tracking-wide hidden sm:block" style={{
              color: '#ffffff',
              textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
              letterSpacing: '0.05em'
            }}>
              bullmoney
            </Link>
          </div>
          
          {/* Center: Pill Navigation (Desktop) */}
          <div className="hidden lg:flex items-center h-10 rounded-full" style={{ background: 'rgb(0,0,0)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <ul className="flex items-stretch gap-0.5 h-full p-1">
              {items.map((item) => (
                <li key={item.href} className="flex h-full">
                  <button
                    onClick={() => onCategoryClick?.(item.href)}
                    className="flex items-center justify-center h-full px-4 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200"
                    style={activeHref === item.href 
                      ? { background: 'rgb(255,255,255)', color: 'rgb(0,0,0)' }
                      : { color: 'rgb(255,255,255)' }
                    }
                    aria-label={item.ariaLabel || item.label}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* 🌐 Language Toggle */}
            <LanguageToggle variant="icon" dropDirection="down" />
            
            {/* Search */}
            {showSearch && (
              <button 
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors" 
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgb(255,255,255)' }}
                onClick={onSearchClick}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            
            {/* User */}
            {showUser && (
              <button 
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
                style={isAuthenticated 
                  ? { background: 'rgba(255,255,255,0.15)', color: 'rgb(255,255,255)' }
                  : { background: 'rgba(255,255,255,0.12)', color: 'rgb(255,255,255)' }
                }
                onClick={onUserClick}
                aria-label="Account"
              >
                {isAuthenticated ? (
                  <span className="text-sm font-medium uppercase" style={{ color: 'rgb(255,255,255)' }}>{userInitial}</span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
            )}
            
            {/* Cart */}
            {showCart && (
              <LazyMotionButton
                className="h-10 px-4 flex items-center gap-2 rounded-xl transition-colors"
                style={{ background: 'rgb(255,255,255)', color: 'rgb(0,0,0)' }}
                onClick={onCartClick}
                whileTap={{ scale: 0.95 }}
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                <LazyAnimatePresence mode="wait">
                  {cartCount > 0 && (
                    <LazyMotionSpan
                      key={cartCount}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="text-sm font-medium"
                    >
                      {cartCount}
                    </LazyMotionSpan>
                  )}
                </LazyAnimatePresence>
              </LazyMotionButton>
            )}
            
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgb(255,255,255)' }}
              onClick={handleMobileMenuClick}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </header>
    </>
  );
});

StorePillNav.displayName = 'StorePillNav';

export default StorePillNav;
