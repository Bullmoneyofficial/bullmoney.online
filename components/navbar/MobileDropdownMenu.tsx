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
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="lg:hidden fixed top-24 left-4 right-4 rounded-3xl overflow-hidden"
          data-navbar
          style={{
            touchAction: 'auto',
            pointerEvents: 'auto',
            position: 'fixed',
            isolation: 'isolate',
            zIndex: UI_Z_INDEX.MOBILE_MENU,
            maxWidth: '420px',
            margin: '0 auto',
            left: '50%',
            transform: 'translateX(-50%)',
            willChange: 'transform, opacity',
          }}
        >
          {/* Apple-style glass background with subtle white glow */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            }}
          />
          
          {/* Subtle top highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            }}
          />
          
          <motion.div 
            className="flex flex-col gap-2 w-full relative z-10 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Home */}
            <ThemedMenuItem delay={0.12} href="/" onClick={handleClose} icon={<IconBuildingStore className="h-5 w-5" strokeWidth={2} />} label="Home" />

            {/* Affiliates */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.3 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onTouchStart={() => SoundEffects.click()}
                className="w-full flex items-center gap-3 text-base font-medium cursor-pointer px-4 py-3.5 min-h-[52px] rounded-2xl transition-all duration-200"
                style={{
                  color: isXMUser ? 'rgb(252, 165, 165)' : '#ffffff',
                  backgroundColor: isXMUser ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: isXMUser ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onClick={handleAffiliateClick}
              >
                <IconUsersGroup className="h-5 w-5" strokeWidth={2} style={{ color: isXMUser ? '#f87171' : '#ffffff' }} />
                <span className="flex-1 text-left">Affiliates</span>
                {isXMUser && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </motion.button>
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.3 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onTouchStart={() => SoundEffects.click()}
                className="w-full flex items-center gap-3 text-base font-medium cursor-pointer px-4 py-3.5 min-h-[52px] rounded-2xl transition-all duration-200"
                style={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={handleFaqClick}
              >
                <IconHelp className="h-5 w-5" strokeWidth={2} style={{ color: '#ffffff' }} />
                <span className="flex-1 text-left">FAQ</span>
              </motion.button>
            </motion.div>

            {showAccountManager && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.3 }}
                className="w-full"
              >
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => SoundEffects.hover()}
                  onTouchStart={() => SoundEffects.click()}
                  className="w-full flex items-center gap-3 text-base font-medium cursor-pointer px-4 py-3.5 min-h-[52px] rounded-2xl transition-all duration-200"
                  style={{
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onClick={handleAccountManagerClick}
                >
                  <IconUser className="h-5 w-5" strokeWidth={2} style={{ color: '#ffffff' }} />
                  <span className="flex-1 text-left">Account Manager</span>
                </motion.button>
              </motion.div>
            )}

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.20 }}
              className="h-px my-2"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)'
              }}
            />

            {/* Products - SMART MOUNT: Button triggers modal via UI state, not embedded */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onClick={handleProductsClick}
                className="w-full flex items-center gap-3 text-base font-medium px-4 py-3.5 min-h-[52px] rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <IconBuildingStore className="h-5 w-5" strokeWidth={2} style={{ color: '#ffffff' }} />
                <span className="flex-1 text-left">Products</span>
              </motion.button>
            </motion.div>

            {/* Admin */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.3 }}
                className="w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => SoundEffects.hover()}
                  onTouchStart={() => SoundEffects.click()}
                  onClick={handleAdminClick}
                  className="w-full flex items-center gap-3 text-sm font-medium uppercase tracking-wide transition-all duration-200 px-4 py-3.5 min-h-[52px] rounded-2xl"
                  style={{
                    color: '#ffffff',
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
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="w-full"
  >
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => SoundEffects.hover()}
    >
      <Link
        href={href}
        onClick={() => { SoundEffects.click(); onClick(); }}
        onTouchStart={() => SoundEffects.click()}
        className="flex items-center gap-3 text-base font-medium w-full px-4 py-3.5 min-h-[52px] rounded-2xl transition-all duration-200"
        style={{
          color: highlighted ? '#000000' : '#ffffff',
          background: highlighted 
            ? '#ffffff' 
            : 'rgba(255, 255, 255, 0.05)',
          border: highlighted 
            ? '1px solid rgba(255, 255, 255, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: highlighted 
            ? '0 0 20px rgba(255, 255, 255, 0.3)' 
            : 'none',
        }}
      >
        <span style={{ 
          color: highlighted ? '#000000' : '#ffffff',
        }}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
      </Link>
    </motion.div>
  </motion.div>
));

ThemedMenuItem.displayName = 'ThemedMenuItem';
