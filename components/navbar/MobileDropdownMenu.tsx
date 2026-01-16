import React, { memo, useCallback, useMemo, useState } from 'react';
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
import { LiveStreamModal } from '@/components/LiveStreamModal';
import { AnalysisModal } from '@/components/AnalysisModal';
import { ProductsModal } from '@/components/ProductsModal';
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
    },
    ref
  ) => {
    const { activeTheme } = useGlobalTheme();
    
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
    
    if (!open) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -15, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="lg:hidden fixed top-28 sm:top-32 left-3 right-3 z-[9999] rounded-2xl bg-black/98 p-5 sm:p-6 backdrop-blur-2xl menu-glass overflow-hidden"
          style={{ 
            touchAction: 'auto',
            pointerEvents: 'auto',
            filter: themeFilter,
            transition: 'filter 0.5s ease-in-out',
            border: isXMUser 
              ? '2px solid rgba(239, 68, 68, 0.5)' 
              : '2px solid rgba(59, 130, 246, 0.5)',
            boxShadow: isXMUser
              ? '0 0 50px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(239, 68, 68, 0.08)'
              : '0 0 50px rgba(59, 130, 246, 0.4), inset 0 0 30px rgba(59, 130, 246, 0.08)'
          }}
        >
          {/* Shimmer Background - Using unified CSS shimmer class for performance */}
          <div 
            className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] z-0"
            style={{
              background: isXMUser 
                ? 'linear-gradient(to right, transparent, rgba(239, 68, 68, 0.3), transparent)'
                : 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.3), transparent)'
            }}
          />
          
          <motion.div 
            className="flex flex-col gap-2.5 w-full relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Home */}
            <ThemedMenuItem delay={0.12} href="/" onClick={handleClose} icon={<IconBuildingStore className="h-5 w-5" stroke={1.5} />} label="Home" />

            {/* Live Stream */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 }}
              className="w-full"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                className="relative flex items-center justify-center gap-3 w-full text-sm sm:text-base font-semibold hover:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  color: '#93c5fd',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <IconBroadcast className="h-5 w-5 pointer-events-none" stroke={1.5} style={{ color: '#60a5fa' }} />
                <span className="pointer-events-none">Live Stream</span>
                <div className="absolute inset-0 z-10"><LiveStreamModal /></div>
              </motion.div>
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
                  color: isXMUser ? 'rgb(252, 165, 165)' : '#93c5fd',
                  backgroundColor: isXMUser ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                  border: isXMUser ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                  fontWeight: isXMUser ? 'bold' : 'semibold'
                }}
                onClick={handleAffiliateClick}
              >
                <IconUsersGroup className="h-5 w-5" stroke={1.5} style={{ color: isXMUser ? '#f87171' : '#60a5fa' }} />
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
                  color: '#93c5fd',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
                onClick={handleFaqClick}
              >
                <IconHelp className="h-5 w-5" stroke={1.5} style={{ color: '#60a5fa' }} />
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
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                className="relative w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  color: '#93c5fd',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <IconChartLine className="h-5 w-5 pointer-events-none" stroke={1.5} style={{ color: '#60a5fa' }} />
                <span className="pointer-events-none">Analysis</span>
                <div className="absolute inset-0 z-10"><AnalysisModal /></div>
              </motion.div>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              className="h-px my-1"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.3), transparent)'
              }}
            />

            {/* Products */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.24 }}
              className="w-full"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => SoundEffects.hover()}
                className="relative w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  color: '#93c5fd',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <IconBuildingStore className="h-5 w-5 pointer-events-none" stroke={1.5} style={{ color: '#60a5fa' }} />
                <span className="pointer-events-none">Products</span>
                <div className="absolute inset-0 z-10"><ProductsModal /></div>
              </motion.div>
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
                  color: '#93c5fd',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <IconPalette className="h-5 w-5" stroke={1.5} style={{ color: '#60a5fa' }} />
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
                    color: isAdmin ? '#60a5fa' : '#93c5fd',
                    backgroundColor: isAdmin ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                    border: isAdmin ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: isAdmin ? 'bold' : 'normal'
                  }}
                >
                  {isAdmin ? (
                    <><IconSettings className="h-5 w-5" stroke={1.5} style={{ color: '#60a5fa' }} /> Admin Dashboard</>
                  ) : (
                    <><IconLock className="h-5 w-5" stroke={1.5} style={{ color: '#60a5fa' }} /> Team Access</>
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

// Helper MenuItem component with theme support
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
          color: highlighted ? '#000000' : '#93c5fd',
          backgroundColor: highlighted ? '#3b82f6' : 'rgba(59, 130, 246, 0.08)',
          border: highlighted ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: highlighted ? '0 0 30px rgba(59, 130, 246, 0.5)' : 'none',
          textShadow: highlighted ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        <span style={{ 
          color: highlighted ? '#000000' : '#60a5fa',
          filter: highlighted ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' : 'none'
        }}>{icon}</span>
        {label}
      </Link>
    </motion.div>
  </motion.div>
));

ThemedMenuItem.displayName = 'ThemedMenuItem';
