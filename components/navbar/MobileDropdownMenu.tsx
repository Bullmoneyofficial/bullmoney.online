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
    if (!open) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -15, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className={cn(
            "lg:hidden fixed top-28 sm:top-32 left-3 right-3 z-[9999] rounded-2xl border-2 bg-black/90 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl menu-glass",
            isXMUser
              ? "border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.4),inset_0_0_30px_rgba(239,68,68,0.08)]"
              : "border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.4),inset_0_0_30px_rgba(59,130,246,0.08)]"
          )}
          style={{ 
            touchAction: 'auto',
            pointerEvents: 'auto'
          }}
        >
          <motion.div 
            className="flex flex-col gap-2.5 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Home */}
            <MenuItem delay={0.12} href="/" onClick={onClose} icon={<IconBuildingStore className="h-5 w-5 text-blue-400" stroke={1.5} />} label="Home" />

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
                onClick={() => { SoundEffects.click(); onClose(); }}
                className="relative flex items-center justify-center gap-3 w-full text-sm sm:text-base font-semibold text-blue-200 hover:text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-blue-500/8 hover:bg-blue-500/20 active:bg-blue-500/35 cursor-pointer transition-all duration-200 border border-blue-500/30 hover:border-blue-500/60"
              >
                <IconSparkles className="h-5 w-5 text-blue-400" stroke={1.5} />
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
                className={cn(
                  "w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold cursor-pointer px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 border",
                  isXMUser
                    ? "text-red-300 hover:text-red-100 bg-red-500/8 hover:bg-red-500/20 active:bg-red-500/35 font-bold border-red-500/30 hover:border-red-500/60"
                    : "text-blue-200 hover:text-white bg-blue-500/8 hover:bg-blue-500/20 active:bg-blue-500/35 border-blue-500/30 hover:border-blue-500/60"
                )}
                onClick={() => { SoundEffects.click(); onAffiliateClick(); onClose(); }}
              >
                <IconUsersGroup className={cn("h-5 w-5", isXMUser ? "text-red-400" : "text-blue-400")} stroke={1.5} />
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
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold text-blue-200 hover:text-white cursor-pointer px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-blue-500/8 hover:bg-blue-500/20 active:bg-blue-500/35 transition-all duration-200 border border-blue-500/30 hover:border-blue-500/60"
                onClick={() => { SoundEffects.click(); onFaqClick(); onClose(); }}
              >
                <IconHelp className="h-5 w-5 text-blue-400" stroke={1.5} />
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
                onClick={() => { SoundEffects.click(); onClose(); }}
                className={cn(
                  "relative w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 border",
                  hasReward ? "text-blue-300 font-bold bg-blue-500/20 border-blue-500/60 hover:bg-blue-500/30" : "text-blue-200 hover:text-white bg-blue-500/8 hover:bg-blue-500/20 active:bg-blue-500/35 border-blue-500/30 hover:border-blue-500/60"
                )}
              >
                <IconCreditCard className="h-5 w-5 text-blue-400" stroke={1.5} />
                {hasReward ? "Reward Unlocked!" : "Rewards Card"}
                <div className="absolute inset-0 opacity-0"><LoyaltyModal /></div>
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              className="h-px bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 my-1"
            />

            {/* Products */}
            <MenuItem delay={0.24} href="/products" onClick={onClose} icon={<IconBuildingStore className="h-5 w-5" stroke={1.5} />} label="Products" highlighted />

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
                onClick={() => { SoundEffects.click(); onClose(); onThemeClick(); }}
                className="w-full flex items-center justify-center gap-3 text-sm sm:text-base font-semibold text-blue-200 hover:text-white transition-all duration-200 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-blue-500/8 hover:bg-blue-500/20 active:bg-blue-500/35 border border-blue-500/30 hover:border-blue-500/60"
              >
                <IconPalette className="h-5 w-5 text-blue-400" stroke={1.5} />
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
                  onClick={() => { SoundEffects.click(); onClose(); onAdminClick(); }}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 py-2.5 sm:py-3 rounded-xl border px-4 sm:px-6",
                    isAdmin ? "text-blue-300 hover:text-blue-100 font-bold bg-blue-500/15 border-blue-500/40 hover:bg-blue-500/25 hover:border-blue-500/60" : "text-blue-200/70 hover:text-blue-300 bg-blue-500/8 border-blue-500/30 hover:bg-blue-500/15 hover:border-blue-500/50"
                  )}
                >
                  {isAdmin ? (
                    <><IconSettings className="h-5 w-5 text-blue-400" stroke={1.5} /> Admin Dashboard</>
                  ) : (
                    <><IconLock className="h-5 w-5 text-blue-400" stroke={1.5} /> Team Access</>
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

// Helper MenuItem component
const MenuItem = ({ delay, href, onClick, icon, label, highlighted = false }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="w-full"
  >
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        onClick={() => { SoundEffects.click(); onClick(); }}
        className={cn(
          "flex items-center justify-center gap-3 text-sm sm:text-base font-semibold w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 border",
          highlighted
            ? "text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] border-blue-400/40 hover:border-blue-300/60"
            : "text-blue-200 hover:text-white bg-blue-500/8 hover:bg-blue-500/20 active:bg-blue-500/35 border-blue-500/30 hover:border-blue-500/60"
        )}
      >
        {icon}
        {label}
      </Link>
    </motion.div>
  </motion.div>
);
