import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBuildingStore,
  IconUsersGroup,
  IconHelp,
  IconSettings,
  IconLock,
  IconUser,
} from '@tabler/icons-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
// SMART MOUNT: Only import lightweight trigger components - heavy modals mount via UIState
import { 
  useMobileMenu, 
  UI_Z_INDEX,
  useProductsModalUI,
} from '@/contexts/UIStateContext';
// UNIFIED SHIMMER SYSTEM - Import from single source
import { ShimmerBorder, ShimmerLine, ShimmerRadialGlow, ShimmerDot } from '@/components/ui/UnifiedShimmer';

interface MobileDropdownMenuProps {
  open: boolean;
  onClose: () => void;
  isXMUser: boolean;
  hasReward: boolean;
  isAdmin: boolean;
  showAccountManager: boolean;
  onAffiliateClick: () => void;
  onFaqClick: () => void;
  onAdminClick: () => void;
  onAccountManagerClick: () => void;
}

export const MobileDropdownMenu = memo(React.forwardRef<HTMLDivElement, MobileDropdownMenuProps>(
  (
    {
      open,
      onClose,
      isXMUser,
      hasReward,
      isAdmin,
      showAccountManager,
      onAffiliateClick,
      onFaqClick,
      onAdminClick,
      onAccountManagerClick,
    },
    ref
  ) => {
    const { setIsMobileMenuOpen } = useMobileMenu();
    
    // SMART MOUNT: Use centralized UI state for modals - they mount ONLY when opened
    const { setIsOpen: setProductsOpen } = useProductsModalUI();
    
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
    
    const handleAdminClick = useCallback(() => {
      SoundEffects.click();
      onAdminClick();
      onClose();
    }, [onAdminClick, onClose]);
    
    // SMART MOUNT: Trigger Products modal via UI state (not embedded component)
    const handleProductsClick = useCallback(() => {
      SoundEffects.click();
      // Close menu first, then open modal to avoid race conditions
      onClose();
      setTimeout(() => {
        setProductsOpen(true);
      }, 50);
    }, [setProductsOpen, onClose]);
    
    const handleAccountManagerClick = useCallback(() => {
      SoundEffects.click();
      onAccountManagerClick();
      onClose();
    }, [onAccountManagerClick, onClose]);
    
    // SMART MOUNT: Return null if shouldn't render (component fully unmounted)
    if (!shouldRender) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="lg:hidden fixed top-28 sm:top-32 left-3 right-3 rounded-2xl bg-black/98 p-5 sm:p-6 menu-glass overflow-hidden mobile-menu-optimized\"
          data-navbar
          style={{
            touchAction: 'auto',
            pointerEvents: 'auto',
            transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out',
            border: `2px solid rgba(${isXMUser ? '239, 68, 68' : '255, 255, 255'}, 0.5)`,
            boxShadow: `0 0 50px rgba(${isXMUser ? '239, 68, 68' : '255, 255, 255'}, 0.4), inset 0 0 30px rgba(${isXMUser ? '239, 68, 68' : '255, 255, 255'}, 0.08)`,
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

            {/* Affiliates */}
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
                onTouchStart={() => SoundEffects.click()}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold cursor-pointer px-4 sm:px-6 py-3 sm:py-4 min-h-[48px] rounded-xl transition-all duration-200"
                style={{
                  color: isXMUser ? 'rgb(252, 165, 165)' : 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)',
                  backgroundColor: isXMUser ? 'rgba(239, 68, 68, 0.08)' : 'rgba(var(--accent-rgb, 255, 255, 255), 0.08)',
                  border: isXMUser ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
                  fontWeight: isXMUser ? 'bold' : 'semibold'
                }}
                onClick={handleAffiliateClick}
              >
                <IconUsersGroup className="h-5 w-5" stroke={1.5} style={{ color: isXMUser ? '#f87171' : 'var(--accent-color, #ffffff)' }} />
                Affiliates
                {isXMUser && (
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 xm-pulse-indicator"
                  />
                )}
              </motion.button>
            </motion.div>

            {/* FAQ */}
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
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white cursor-pointer px-4 sm:px-6 py-3 sm:py-4 min-h-[48px] rounded-xl transition-all duration-200"
                style={{
                  color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.3)'
                }}
                onClick={handleFaqClick}
              >
                <IconHelp className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #ffffff)' }} />
                FAQ
              </motion.button>
            </motion.div>

            {showAccountManager && (
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
                  className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white cursor-pointer px-4 sm:px-6 py-3 sm:py-4 min-h-[48px] rounded-xl transition-all duration-200"
                  style={{
                    color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)',
                    backgroundColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.08)',
                    border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.3)'
                  }}
                  onClick={handleAccountManagerClick}
                >
                  <IconUser className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #ffffff)' }} />
                  Account Manager
                </motion.button>
              </motion.div>
            )}

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.20 }}
              className="h-px my-1"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(var(--accent-rgb, 255, 255, 255), 0.3), transparent)'
              }}
            />

            {/* Products - SMART MOUNT: Button triggers modal via UI state, not embedded */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onClick={handleProductsClick}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold px-4 sm:px-6 py-3 sm:py-4 min-h-[48px] rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)',
                  backgroundColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.08)',
                  border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
                }}
              >
                <IconBuildingStore className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #ffffff)' }} />
                <span>Products</span>
              </motion.button>
            </motion.div>

            {/* Admin */}
            {isAdmin && (
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
                  className="w-full flex items-center justify-center gap-3 text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 py-2.5 sm:py-3 min-h-[48px] rounded-xl px-4 sm:px-6"
                  style={{
                    color: 'var(--accent-color, #ffffff)',
                    backgroundColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.15)',
                    border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.4)',
                    fontWeight: 'bold'
                  }}
                >
                  <IconSettings className="h-5 w-5" stroke={1.5} style={{ color: 'var(--accent-color, #ffffff)' }} /> Admin Dashboard
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
        className="flex items-center justify-center gap-3 text-sm sm:text-base font-semibold w-full px-4 sm:px-6 py-3 sm:py-4 min-h-[48px] rounded-xl transition-all duration-200"
        style={{
          color: highlighted ? '#000000' : 'rgba(var(--accent-rgb, 255, 255, 255), 0.8)',
          backgroundColor: highlighted ? 'var(--accent-color, #ffffff)' : 'rgba(var(--accent-rgb, 255, 255, 255), 0.08)',
          border: highlighted ? '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.6)' : '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
          boxShadow: highlighted ? '0 0 30px rgba(var(--accent-rgb, 255, 255, 255), 0.5)' : 'none',
          textShadow: highlighted ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        <span style={{ 
          color: highlighted ? '#000000' : 'var(--accent-color, #ffffff)',
          filter: highlighted ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' : 'none'
        }}>{icon}</span>
        {label}
      </Link>
    </motion.div>
  </motion.div>
));

ThemedMenuItem.displayName = 'ThemedMenuItem';
