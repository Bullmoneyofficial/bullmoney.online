import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBuildingStore,
  IconBroadcast,
  IconUsersGroup,
  IconHelp,
  IconChartLine,
  IconPalette,
  IconSettings,
  IconLock,
} from '@tabler/icons-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
// SMART MOUNT: Only import lightweight trigger components - heavy modals mount via UIState
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import { 
  useMobileMenu, 
  UI_Z_INDEX,
  useLiveStreamModalUI,
  useProductsModalUI,
  useAnalysisModalUI,
} from '@/contexts/UIStateContext';
// UNIFIED SHIMMER SYSTEM - Import from single source
import { ShimmerBorder, ShimmerLine, ShimmerRadialGlow, ShimmerDot } from '@/components/ui/UnifiedShimmer';

interface MobileDropdownMenuProps {
  open: boolean;
  onClose: () => void;
  isXMUser: boolean;
  hasReward: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  onAffiliateClick: () => void;
  onFaqClick: () => void;
  onAdminClick: () => void;
  onThemeClick: () => void;
  onAnalysisClick: () => void;
}

export const MobileDropdownMenu = memo(React.forwardRef<HTMLDivElement, MobileDropdownMenuProps>(
  (
    {
      open,
      onClose,
      isXMUser,
      hasReward,
      isAdmin,
      isAuthenticated,
      onAffiliateClick,
      onFaqClick,
      onAdminClick,
      onThemeClick,
      onAnalysisClick,
    },
    ref
  ) => {
    const { activeTheme } = useGlobalTheme();
    const { setIsMobileMenuOpen } = useMobileMenu();
    
    // SMART MOUNT: Use centralized UI state for modals - they mount ONLY when opened
    const { setIsOpen: setLiveStreamOpen } = useLiveStreamModalUI();
    const { setIsOpen: setProductsOpen } = useProductsModalUI();
    const { setIsOpen: setAnalysisOpen } = useAnalysisModalUI();
    
    // Track if component should render (delayed unmount for exit animation)
    const [shouldRender, setShouldRender] = useState(open);
    const unmountTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // SMART MOUNT: Delayed unmount for exit animations
    useEffect(() => {
      if (open) {
        if (unmountTimerRef.current) {
          clearTimeout(unmountTimerRef.current);
          unmountTimerRef.current = null;
        }
        setShouldRender(true);
        setIsMobileMenuOpen(true);
      } else {
        // Delay unmount for exit animation
        unmountTimerRef.current = setTimeout(() => {
          setShouldRender(false);
        }, 350);
        setIsMobileMenuOpen(false);
      }
      
      return () => {
        if (unmountTimerRef.current) {
          clearTimeout(unmountTimerRef.current);
        }
      };
    }, [open, setIsMobileMenuOpen]);
    
    // Get theme filter for consistency with navbar
    // Use mobileFilter for both mobile and desktop to ensure consistent theming
    const themeFilter = useMemo(() => activeTheme?.mobileFilter || 'none', [activeTheme?.mobileFilter]);
    
    const handleClose = useCallback(() => {
      SoundEffects.click();
      onClose();
    }, [onClose]);
    
    const handleAffiliateClick = useCallback(() => {
      SoundEffects.click();
      onAffiliateClick();
      onClose();
    }, [onAffiliateClick, onClose]);
    
    const handleFaqClick = useCallback(() => {
      SoundEffects.click();
      onFaqClick();
      onClose();
    }, [onFaqClick, onClose]);

    const handleAnalysisClick = useCallback(() => {
      console.log('[MobileDropdownMenu] handleAnalysisClick called');
      SoundEffects.click();
      // SMART MOUNT: Close menu first, then open modal to avoid race conditions
      onClose();
      // Use setTimeout to ensure menu close completes before modal opens
      setTimeout(() => {
        setAnalysisOpen(true);
      }, 50);
    }, [onClose, setAnalysisOpen]);
    
    const handleAdminClick = useCallback(() => {
      SoundEffects.click();
      onAdminClick();
      onClose();
    }, [onAdminClick, onClose]);
    
    const handleThemeClick = useCallback(() => {
      SoundEffects.click();
      onClose();
      onThemeClick();
    }, [onClose, onThemeClick]);
    
    // SMART MOUNT: Trigger LiveStream modal via UI state (not embedded component)
    const handleLiveStreamClick = useCallback(() => {
      SoundEffects.click();
      // Close menu first, then open modal to avoid race conditions
      onClose();
      setTimeout(() => {
        setLiveStreamOpen(true);
      }, 50);
    }, [setLiveStreamOpen, onClose]);
    
    // SMART MOUNT: Trigger Products modal via UI state (not embedded component)
    const handleProductsClick = useCallback(() => {
      SoundEffects.click();
      // Close menu first, then open modal to avoid race conditions
      onClose();
      setTimeout(() => {
        setProductsOpen(true);
      }, 50);
    }, [setProductsOpen, onClose]);
    
    // SMART MOUNT: Return null if shouldn't render (component fully unmounted)
    if (!shouldRender) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -15, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="lg:hidden fixed top-28 sm:top-32 left-3 right-3 rounded-2xl bg-black/98 p-5 sm:p-6 menu-glass overflow-hidden"
          data-theme-aware
          data-navbar
          style={{
            touchAction: 'auto',
            pointerEvents: 'auto',
            filter: themeFilter,
            transition: 'filter 0.5s ease-in-out, border-color 0.4s ease-out, box-shadow 0.4s ease-out',
            transitionDelay: '0.35s', // Navbar transitions last (bottom-to-top)
            border: `2px solid rgba(var(--accent-rgb, ${isXMUser ? '239, 68, 68' : '59, 130, 246'}), 0.5)`,
            boxShadow: `0 0 50px rgba(var(--accent-rgb, ${isXMUser ? '239, 68, 68' : '59, 130, 246'}), 0.4), inset 0 0 30px rgba(var(--accent-rgb, ${isXMUser ? '239, 68, 68' : '59, 130, 246'}), 0.08)`,
            position: 'fixed',
            isolation: 'isolate',
            // HIGHEST z-index - mobile menu appears on top of ALL other components
            zIndex: UI_Z_INDEX.MOBILE_MENU,
          }}
        >
          {/* UNIFIED SHIMMER SYSTEM - GPU accelerated border shimmer */}
          <ShimmerBorder color={isXMUser ? "red" : "blue"} intensity="medium" speed="normal" />
          
          {/* UNIFIED SHIMMER - Top line shimmer */}
          <ShimmerLine color={isXMUser ? "red" : "blue"} intensity="medium" speed="normal" />
          
          {/* UNIFIED SHIMMER - Radial glow background */}
          <ShimmerRadialGlow color={isXMUser ? "red" : "blue"} intensity="low" />
          
          <motion.div 
            className="flex flex-col gap-2.5 w-full relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Home */}
            <ThemedMenuItem delay={0.12} href="/" onClick={handleClose} icon={<IconBuildingStore className="h-5 w-5" stroke={1.5} />} label="Home" />

            {/* Live Stream - SMART MOUNT: Button triggers modal via UI state, not embedded */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onClick={handleLiveStreamClick}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)'
                }}
              >
                <IconBroadcast className="h-5 w-5" stroke={1.5} style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }} />
                <span>Live Stream</span>
              </motion.button>
            </motion.div>

            {/* Affiliates */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onTouchStart={() => SoundEffects.click()}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold cursor-pointer px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200"
                style={{
                  color: isXMUser ? 'rgb(252, 165, 165)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  backgroundColor: isXMUser ? 'rgba(239, 68, 68, 0.08)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                  border: isXMUser ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
                  fontWeight: isXMUser ? 'bold' : 'semibold'
                }}
                onClick={handleAffiliateClick}
              >
                <IconUsersGroup className="h-5 w-5" stroke={1.5} style={{ color: isXMUser ? '#f87171' : 'var(--accent-color, #60a5fa)' }} />
                Affiliates
                {isXMUser && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500"
                  />
                )}
              </motion.button>
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onTouchStart={() => SoundEffects.click()}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white cursor-pointer px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200"
                style={{
                  color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)'
                }}
                onClick={handleFaqClick}
              >
                <IconHelp className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #60a5fa)' }} />
                FAQ
              </motion.button>
            </motion.div>

            {/* Analysis */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.20 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onTouchStart={() => SoundEffects.click()}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white cursor-pointer px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200"
                style={{
                  color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)'
                }}
                onClick={handleAnalysisClick}
              >
                <IconChartLine className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #60a5fa)' }} />
                Analysis
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              className="h-px my-1"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(var(--accent-rgb, 59, 130, 246), 0.3), transparent)'
              }}
            />

            {/* Products - SMART MOUNT: Button triggers modal via UI state, not embedded */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.24 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onClick={handleProductsClick}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
                }}
              >
                <IconBuildingStore className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #60a5fa)' }} />
                <span>Products</span>
              </motion.button>
            </motion.div>

            {/* Theme */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.26 }}
              className="w-full"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onTouchStart={() => SoundEffects.click()}
                onClick={handleThemeClick}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white transition-all duration-200 px-4 sm:px-6 py-3 sm:py-4 rounded-xl"
                style={{
                  color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)'
                }}
              >
                <IconPalette className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #60a5fa)' }} />
                Theme
              </motion.button>
            </motion.div>

            {/* Admin */}
            {(!isAuthenticated || isAdmin) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28 }}
                className="w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => SoundEffects.hover()}
                  onTouchStart={() => SoundEffects.click()}
                  onClick={handleAdminClick}
                  className="w-full flex items-center justify-center gap-3 text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 py-2.5 sm:py-3 rounded-xl px-4 sm:px-6"
                  style={{
                    color: isAdmin ? 'var(--accent-color, #60a5fa)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                    backgroundColor: isAdmin ? 'rgba(var(--accent-rgb, 59, 130, 246), 0.15)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
                    border: isAdmin ? '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.4)' : '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
                    fontWeight: isAdmin ? 'bold' : 'normal'
                  }}
                >
                  {isAdmin ? (
                    <><IconSettings className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #60a5fa)' }} /> Admin Dashboard</>
                  ) : (
                    <><IconLock className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #60a5fa)' }} /> Team Access</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  })
);

MobileDropdownMenu.displayName = 'MobileDropdownMenu';

// Helper MenuItem component with theme support - USES UNIFIED SHIMMER COLORS
const ThemedMenuItem = memo(({ delay, href, onClick, icon, label, highlighted = false }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="w-full"
  >
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => SoundEffects.hover()}
    >
      <Link
        href={href}
        onClick={() => { SoundEffects.click(); onClick(); }}
        onTouchStart={() => SoundEffects.click()}
        className="flex items-center justify-center gap-3 text-sm sm:text-base font-semibold w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200"
        style={{
          color: highlighted ? '#000000' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
          backgroundColor: highlighted ? 'var(--accent-color, #3b82f6)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.08)',
          border: highlighted ? '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.6)' : '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
          boxShadow: highlighted ? '0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.5)' : 'none',
          textShadow: highlighted ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        <span style={{ 
          color: highlighted ? '#000000' : 'var(--accent-color, #60a5fa)',
          filter: highlighted ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' : 'none'
        }}>{icon}</span>
        {label}
      </Link>
    </motion.div>
  </motion.div>
));

ThemedMenuItem.displayName = 'ThemedMenuItem';
