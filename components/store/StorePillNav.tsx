'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, User, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

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

export const StorePillNav: React.FC<StorePillNavProps> = ({
  logo = '/BULL.svg',
  logoAlt = 'Bullmoney',
  items = [],
  className = '',
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
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active href based on current pathname
  const getActiveHref = () => {
    if (!pathname || !items || items.length === 0) return '/store';
    
    // Check for exact matches first
    const exactMatch = items.find(item => item.href === pathname);
    if (exactMatch) return exactMatch.href;
    
    // Default to /store if on store page
    if (pathname.startsWith('/store')) return '/store';
    return '';
  };
  
  const activeHref = getActiveHref();

  const handleMobileMenuClick = () => {
    onMobileMenuClick?.();
  };

  // SSR fallback
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-500 bg-black/95 backdrop-blur-xl border-b border-white/5 h-16" />
    );
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-500 bg-black/95 backdrop-blur-xl border-b border-white/5 ${className}`}>
        <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
            <Link 
              href="/store" 
              className="relative flex-shrink-0 w-14 h-14 block hover:scale-105 transition-transform"
            >
              <img src={logo} alt={logoAlt} className="w-full h-full object-cover" />
            </Link>
            <Link href="/store" className="flex-shrink-0 text-xl font-semibold tracking-wide hidden sm:block" style={{
              color: '#ffffff',
              textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
              letterSpacing: '0.05em'
            }}>
              bullmoney
            </Link>
          </div>
          
          {/* Center: Pill Navigation (Desktop) */}
          <div className="hidden lg:flex items-center h-10 bg-black rounded-full border border-white/10">
            <ul className="flex items-stretch gap-0.5 h-full p-1">
              {items.map((item) => (
                <li key={item.href} className="flex h-full">
                  <Link
                    href={item.href}
                    className={`
                      flex items-center justify-center h-full px-4 rounded-full
                      text-xs font-semibold uppercase tracking-wide
                      transition-all duration-200
                      ${activeHref === item.href 
                        ? 'bg-white text-black' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                      }
                    `}
                    aria-label={item.ariaLabel || item.label}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {showSearch && (
              <button 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white" 
                onClick={onSearchClick}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            
            {/* User */}
            {showUser && (
              <button 
                className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                  isAuthenticated 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                }`}
                onClick={onUserClick}
                aria-label="Account"
              >
                {isAuthenticated ? (
                  <span className="text-sm font-medium uppercase">{userInitial}</span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
            )}
            
            {/* Cart */}
            {showCart && (
              <motion.button
                className="h-10 px-4 flex items-center gap-2 rounded-xl bg-white text-black hover:bg-white/90 transition-colors"
                onClick={onCartClick}
                whileTap={{ scale: 0.95 }}
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence mode="wait">
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="text-sm font-medium"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
            
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
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
};

export default StorePillNav;
