import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBuildingStore,
  IconSparkles,
  IconUsersGroup,
  IconHelp,
  IconCreditCard,
  IconPalette,
  IconSettings,
  IconLock,
} from '@tabler/icons-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import ServicesModal from '@/components/ui/SeviceModal';
import { LoyaltyModal } from '@/components/LoyaltyCard';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

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
}

export const MobileDropdownMenu = React.forwardRef<HTMLDivElement, MobileDropdownMenuProps>(
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
    },
    ref
  ) => {
    const { activeTheme, isMobile, accentColor } = useGlobalTheme();
    
    // Get theme filter for consistency with navbar
    const themeFilter = isMobile 
      ? (activeTheme?.mobileFilter || 'none') 
      : (activeTheme?.filter || 'none');
    
    if (!open) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -15, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="lg:hidden fixed top-28 sm:top-32 left-3 right-3 z-[9999] rounded-2xl bg-black/90 p-5 sm:p-6 backdrop-blur-2xl menu-glass"
          style={{ 
            touchAction: 'auto',
            pointerEvents: 'auto',
            filter: themeFilter,
            transition: 'filter 0.5s ease-in-out',
            border: isXMUser 
              ? '2px solid rgba(239, 68, 68, 0.5)' 
              : `2px solid var(--theme-accent-border, rgba(59, 130, 246, 0.5))`,
            boxShadow: isXMUser
              ? '0 0 50px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(239, 68, 68, 0.08)'
              : `0 0 50px var(--theme-accent-glow, rgba(59, 130, 246, 0.4)), inset 0 0 30px var(--theme-accent-subtle, rgba(59, 130, 246, 0.08))`
          }}
        >
          <motion.div 
            className="flex flex-col gap-2.5 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Home */}
            <ThemedMenuItem delay={0.12} href="/" onClick={onClose} icon={<IconBuildingStore className="h-5 w-5" stroke={1.5} />} label="Home" accentColor={accentColor} />

            {/* Setups */}
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
                onClick={() => { SoundEffects.click(); onClose(); }}
                onTouchStart={() => SoundEffects.click()}
                className="relative flex items-center justify-center gap-3 w-full text-sm sm:text-base font-semibold hover:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  color: `color-mix(in srgb, ${accentColor} 80%, white)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`
                }}
              >
                <IconSparkles className="h-5 w-5" stroke={1.5} style={{ color: accentColor }} />
                Setups
                <div className="absolute inset-0 opacity-0"><ServicesModal /></div>
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
                  color: isXMUser ? 'rgb(252, 165, 165)' : `color-mix(in srgb, ${accentColor} 80%, white)`,
                  backgroundColor: isXMUser ? 'rgba(239, 68, 68, 0.08)' : `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                  border: isXMUser ? '1px solid rgba(239, 68, 68, 0.3)' : `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
                  fontWeight: isXMUser ? 'bold' : 'semibold'
                }}
                onClick={() => { SoundEffects.click(); onAffiliateClick(); onClose(); }}
              >
                <IconUsersGroup className="h-5 w-5" stroke={1.5} style={{ color: isXMUser ? '#f87171' : accentColor }} />
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
                  color: `color-mix(in srgb, ${accentColor} 80%, white)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`
                }}
                onClick={() => { SoundEffects.click(); onFaqClick(); onClose(); }}
              >
                <IconHelp className="h-5 w-5" stroke={1.5} style={{ color: accentColor }} />
                FAQ
              </motion.button>
            </motion.div>

            {/* Rewards */}
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
                onClick={() => { SoundEffects.click(); onClose(); }}
                className="relative w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200"
                style={{
                  color: hasReward ? accentColor : `color-mix(in srgb, ${accentColor} 80%, white)`,
                  backgroundColor: hasReward ? `color-mix(in srgb, ${accentColor} 20%, transparent)` : `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                  border: hasReward ? `1px solid color-mix(in srgb, ${accentColor} 60%, transparent)` : `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
                  fontWeight: hasReward ? 'bold' : 'normal'
                }}
              >
                <IconCreditCard className="h-5 w-5" stroke={1.5} style={{ color: accentColor }} />
                {hasReward ? "Reward Unlocked!" : "Rewards Card"}
                <div className="absolute inset-0 opacity-0"><LoyaltyModal /></div>
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              className="h-px my-1"
              style={{
                background: `linear-gradient(to right, transparent, color-mix(in srgb, ${accentColor} 30%, transparent), transparent)`
              }}
            />

            {/* Products */}
            <ThemedMenuItem delay={0.24} href="/products" onClick={onClose} icon={<IconBuildingStore className="h-5 w-5" stroke={1.5} />} label="Products" highlighted accentColor={accentColor} />

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
                onClick={() => { SoundEffects.click(); onClose(); onThemeClick(); }}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold hover:text-white transition-all duration-200 px-4 sm:px-6 py-3 sm:py-4 rounded-xl"
                style={{
                  color: `color-mix(in srgb, ${accentColor} 80%, white)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`
                }}
              >
                <IconPalette className="h-5 w-5" stroke={1.5} style={{ color: accentColor }} />
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
                  onClick={() => { SoundEffects.click(); onClose(); onAdminClick(); }}
                  className="w-full flex items-center justify-center gap-3 text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 py-2.5 sm:py-3 rounded-xl px-4 sm:px-6"
                  style={{
                    color: isAdmin ? accentColor : `color-mix(in srgb, ${accentColor} 70%, white)`,
                    backgroundColor: isAdmin ? `color-mix(in srgb, ${accentColor} 15%, transparent)` : `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                    border: isAdmin ? `1px solid color-mix(in srgb, ${accentColor} 40%, transparent)` : `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
                    fontWeight: isAdmin ? 'bold' : 'normal'
                  }}
                >
                  {isAdmin ? (
                    <><IconSettings className="h-5 w-5" stroke={1.5} style={{ color: accentColor }} /> Admin Dashboard</>
                  ) : (
                    <><IconLock className="h-5 w-5" stroke={1.5} style={{ color: accentColor }} /> Team Access</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

MobileDropdownMenu.displayName = 'MobileDropdownMenu';

// Helper MenuItem component with theme support
const ThemedMenuItem = ({ delay, href, onClick, icon, label, highlighted = false, accentColor }: any) => (
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
          color: highlighted ? 'white' : `color-mix(in srgb, ${accentColor} 80%, white)`,
          backgroundColor: highlighted ? accentColor : `color-mix(in srgb, ${accentColor} 8%, transparent)`,
          border: highlighted ? `1px solid color-mix(in srgb, ${accentColor} 60%, white)` : `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
          boxShadow: highlighted ? `0 0 30px color-mix(in srgb, ${accentColor} 50%, transparent)` : 'none'
        }}
      >
        <span style={{ color: highlighted ? 'white' : accentColor }}>{icon}</span>
        {label}
      </Link>
    </motion.div>
  </motion.div>
);
