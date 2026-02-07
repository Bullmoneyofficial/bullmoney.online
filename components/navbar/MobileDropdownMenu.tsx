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
  IconChartBar,
  IconShoppingBag,
  IconPalette,
  IconSparkles,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
// SMART MOUNT: Only import lightweight trigger components - heavy modals mount via UIState
import { 
  useMobileMenu, 
  UI_Z_INDEX,
  useProductsModalUI,
  useChartNewsUI,
  useThemeSelectorModalUI,
} from '@/contexts/UIStateContext';
// UNIFIED SHIMMER SYSTEM - Import from single source
import { ShimmerBorder, ShimmerLine, ShimmerRadialGlow, ShimmerDot } from '@/components/ui/UnifiedShimmer';
import { LanguageToggle } from '@/components/LanguageToggle';

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
    const { setChartNewsOpen } = useChartNewsUI();
    const { setIsOpen: setThemePickerModalOpen } = useThemeSelectorModalUI();
    
    // Toggle states for Theme Picker and Ultimate Hub - default ON for app pages
    const [showThemePicker, setShowThemePicker] = useState(true);
    const [showUltimateHub, setShowUltimateHub] = useState(true);
    
    // Load toggle preferences from localStorage & sync theme picker modal
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('store_show_theme_picker');
        // Default to true on app page unless explicitly set to 'false'
        const themeValue = storedTheme !== 'false';
        setShowThemePicker(themeValue);
        setThemePickerModalOpen(themeValue);
        // Ultimate Hub reads stored preference (default ON)
        const storedHub = localStorage.getItem('store_show_ultimate_hub');
        setShowUltimateHub(storedHub !== 'false');
      }
    }, [setThemePickerModalOpen]);
    
    // Listen for external toggle changes (e.g. from store header)
    useEffect(() => {
      const handleHubToggle = () => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('store_show_ultimate_hub');
          setShowUltimateHub(stored !== 'false');
        }
      };
      const handleThemeToggle = () => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('store_show_theme_picker');
          setShowThemePicker(stored === 'true');
        }
      };
      window.addEventListener('store_ultimate_hub_toggle', handleHubToggle);
      window.addEventListener('store_theme_picker_toggle', handleThemeToggle);
      return () => {
        window.removeEventListener('store_ultimate_hub_toggle', handleHubToggle);
        window.removeEventListener('store_theme_picker_toggle', handleThemeToggle);
      };
    }, []);
    
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
    
    // SMART MOUNT: Trigger Chart News modal via UI state
    const handleChartNewsClick = useCallback(() => {
      SoundEffects.click();
      // Close menu first, then open modal to avoid race conditions
      onClose();
      setTimeout(() => {
        setChartNewsOpen(true);
      }, 50);
    }, [setChartNewsOpen, onClose]);
    
    const handleAccountManagerClick = useCallback(() => {
      SoundEffects.click();
      onAccountManagerClick();
      onClose();
    }, [onAccountManagerClick, onClose]);
    
    const toggleThemePicker = useCallback(() => {
      const newValue = !showThemePicker;
      setShowThemePicker(newValue);
      setThemePickerModalOpen(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_theme_picker', String(newValue));
        window.dispatchEvent(new Event('store_theme_picker_toggle'));
      }
    }, [showThemePicker, setThemePickerModalOpen]);
    
    const toggleUltimateHub = useCallback(() => {
      const newValue = !showUltimateHub;
      setShowUltimateHub(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem('store_show_ultimate_hub', String(newValue));
        window.dispatchEvent(new CustomEvent('store_ultimate_hub_toggle', { detail: newValue }));
        window.dispatchEvent(new Event('store_ultimate_hub_toggle'));
      }
    }, [showUltimateHub]);
    
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
            width: '40%',
            maxWidth: '420px',
            minWidth: '180px',
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
            className="flex flex-col gap-0.5 w-full relative z-10 p-1.5"
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
                className="w-full flex items-center gap-2 text-sm font-medium cursor-pointer px-3 py-2 min-h-[36px] rounded-xl transition-all duration-200"
                style={{
                  color: isXMUser ? 'rgb(252, 165, 165)' : '#ffffff',
                  backgroundColor: isXMUser ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: isXMUser ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onClick={handleAffiliateClick}
              >
                <IconUsersGroup className="h-4 w-4" strokeWidth={2} style={{ color: isXMUser ? '#f87171' : '#ffffff' }} />
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
                className="w-full flex items-center gap-2 text-[13px] font-medium cursor-pointer px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200"
                style={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={handleFaqClick}
              >
                <IconHelp className="h-4 w-4" strokeWidth={2} style={{ color: '#ffffff' }} />
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
                  className="w-full flex items-center gap-2 text-[13px] font-medium cursor-pointer px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200"
                  style={{
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onClick={handleAccountManagerClick}
                >
                  <IconUser className="h-4 w-4" strokeWidth={2} style={{ color: '#ffffff' }} />
                  <span className="flex-1 text-left">Account Manager</span>
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
                className="w-full flex items-center gap-2 text-[13px] font-medium px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 cursor-pointer"
                style={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <IconBuildingStore className="h-4 w-4" strokeWidth={2} style={{ color: '#ffffff' }} />
                <span className="flex-1 text-left">Products</span>
              </motion.button>
            </motion.div>

            {/* Chart News - SMART MOUNT: Button triggers modal via UI state */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.3 }}
              className="w-full"
            >
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                onClick={handleChartNewsClick}
                className="w-full flex items-center gap-2 text-[13px] font-medium px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 cursor-pointer"
                style={{
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <IconChartBar className="h-4 w-4" strokeWidth={2} style={{ color: '#ffffff' }} />
                <span className="flex-1 text-left">Charts & News</span>
              </motion.button>
            </motion.div>

            {/* Store */}
            <ThemedMenuItem 
              delay={0.26} 
              href="/store" 
              onClick={handleClose} 
              icon={<IconShoppingBag className="h-5 w-5" strokeWidth={2} />} 
              label="Store" 
              highlighted={true}
            />

            {/* 🌐 Language Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27, duration: 0.3 }}
              className="w-full"
            >
              <LanguageToggle variant="row" dropDirection="down" />
            </motion.div>

            {/* Toggles Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="h-px my-0.5"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)'
              }}
            />

            {/* Toggles Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.29, duration: 0.3 }}
              className="w-full space-y-0.5"
            >
              <p className="text-[9px] px-2.5 mb-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Toggles</p>
              
              {/* Theme Picker Toggle */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleThemePicker}
                className="w-full flex items-center justify-between text-[13px] font-medium px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 cursor-pointer"
                style={showThemePicker 
                  ? { background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                <div className="flex items-center gap-2">
                  <IconPalette className="h-4 w-4" strokeWidth={2} />
                  <span>Themes</span>
                </div>
                {showThemePicker ? <IconEye className="h-4 w-4" strokeWidth={2} /> : <IconEyeOff className="h-4 w-4" strokeWidth={2} />}
              </motion.button>
              
              {/* Ultimate Hub Toggle */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleUltimateHub}
                className="w-full flex items-center justify-between text-[13px] font-medium px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200 cursor-pointer"
                style={showUltimateHub 
                  ? { background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                <div className="flex items-center gap-2">
                  <IconSparkles className="h-4 w-4" strokeWidth={2} />
                  <span>Ultimate Hub</span>
                </div>
                {showUltimateHub ? <IconEye className="h-4 w-4" strokeWidth={2} /> : <IconEyeOff className="h-4 w-4" strokeWidth={2} />}
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
                  className="w-full flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide transition-all duration-200 px-2.5 py-1.5 min-h-[32px] rounded-lg"
                  style={{
                    color: '#ffffff',
                    backgroundColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.15)',
                    border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.4)',
                    fontWeight: 'bold'
                  }}
                >
                  <IconSettings className="h-4 w-4" stroke={1.5} style={{ color: 'var(--accent-color, #ffffff)' }} /> Admin Dashboard
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
        className="flex items-center gap-2 text-[13px] font-medium w-full px-2.5 py-1.5 min-h-[32px] rounded-lg transition-all duration-200"
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
