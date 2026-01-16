import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBuildingStore,
  IconUsersGroup,
  IconHelp,
  IconCalendarTime,
  IconSettings,
  IconLock,
  IconBroadcast,
  IconChartLine,
  IconPalette,
  IconChevronDown,
} from '@tabler/icons-react';
import { Dock } from './Dock';
import { MinimizedDock } from './MinimizedDock';
import { LiveStreamModal } from '@/components/LiveStreamModal';
import { AnalysisModal } from '@/components/AnalysisModal';
import { ProductsModal } from '@/components/ProductsModal';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

interface DesktopNavbarProps {
  isXMUser: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasReward: boolean;
  dockRef: React.RefObject<HTMLDivElement | null>;
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange: (isHovered: boolean) => void;
  onAffiliateClick: () => void;
  onFaqClick: () => void;
  onThemeClick: () => void;
  onAdminClick: () => void;
  mounted: boolean;
  isScrollMinimized?: boolean;
  onExpandClick?: () => void;
}

export const DesktopNavbar = memo(React.forwardRef<HTMLDivElement, DesktopNavbarProps>(
  (
    {
      isXMUser,
      isAdmin,
      isAuthenticated,
      hasReward,
      dockRef,
      buttonRefs,
      onHoverChange,
      onAffiliateClick,
      onFaqClick,
      onThemeClick,
      onAdminClick,
      mounted,
      isScrollMinimized = false,
      onExpandClick,
    },
    ref
  ) => {
    const safeThemeIcon = (
      <IconPalette className="h-6 w-6 text-blue-400" stroke={1.5} />
    );

    const safeAdminIcon = isAdmin ? (
      <IconSettings className="h-5 w-5 text-blue-400" stroke={1.5} />
    ) : (
      <IconLock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" stroke={1.5} />
    );

    const desktopNavItems = [
      {
        icon: <IconBuildingStore className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Home",
        tips: ["Welcome to BullMoney!", "Explore our platform", "Check what's new"],
        href: "/",
      },
      {
        icon: <IconBroadcast className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Live",
        tips: ["Watch live streams", "Trading sessions", "Market updates"],
        triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><LiveStreamModal /></div>,
      },
      {
        icon: isXMUser 
          ? <IconUsersGroup className="h-6 w-6 text-red-400" stroke={1.5} />
          : <IconUsersGroup className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Affiliates",
        tips: ["Join our affiliate program", "Earn commissions", "Grow with us"],
        onClick: onAffiliateClick,
        isXMHighlight: isXMUser,
      },
      {
        icon: <IconHelp className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "FAQ",
        tips: ["Got questions?", "Find your answers here", "Support center"],
        onClick: onFaqClick,
      },
      {
        icon: <IconChartLine className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Analysis",
        tips: ["Trade analysis", "Market insights", "Expert breakdowns"],
        triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><AnalysisModal /></div>,
      },
      {
        icon: <IconCalendarTime className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Products",
        tips: ["Browse our products", "Find the best tools for you", "Check out our latest offers"],
        triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><ProductsModal /></div>,
      },
      {
        icon: safeThemeIcon,
        label: "Theme",
        tips: ["Customize your interface", "Multiple themes available", "Save your preferences"],
        onClick: onThemeClick,
      },
    ];

    if (mounted && (!isAuthenticated || isAdmin)) {
      desktopNavItems.push({
        icon: safeAdminIcon,
        label: isAdmin ? "Dashboard" : "Admin",
        tips: isAdmin ? ["Manage Site", "Logout", "View Orders"] : ["Team Access", "Admin Login"],
        onClick: onAdminClick,
        triggerComponent: undefined,
        href: undefined
      });
    }

    return (
      <div ref={ref} className="hidden lg:flex w-full max-w-7xl mx-auto items-center h-24 relative">
        {/* Logo - always visible */}
        <AnimatePresence mode="wait">
          {!isScrollMinimized && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.6, x: -20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.7, x: -15, filter: 'blur(4px)' }}
              transition={{ 
                type: 'spring', 
                damping: 28, 
                stiffness: 500,
                mass: 0.35,
                opacity: { duration: 0.1 },
                filter: { duration: 0.12 }
              }}
              className="pointer-events-auto z-50 flex items-center justify-center h-23 w-23 overflow-hidden relative"
              style={{ willChange: 'transform, opacity, filter' }}
            >
              <Link href="/" className="relative w-full h-full block">
                <Image
                  src="/BULL.svg"
                  alt="BullMoney"
                  fill
                  className="object-cover"
                  priority
                />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Full Dock - shown when not minimized */}
        <AnimatePresence mode="wait">
          {!isScrollMinimized ? (
            <motion.div 
              key="full-dock"
              initial={{ opacity: 0, y: -40, scale: 0.7, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, scale: 0.75, filter: 'blur(6px)' }}
              transition={{ 
                type: 'spring', 
                damping: 28, 
                stiffness: 500,
                mass: 0.4,
                opacity: { duration: 0.12 },
                filter: { duration: 0.15 }
              }}
              className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-40"
              style={{ willChange: 'transform, opacity, filter' }}
            >
              <Dock 
                items={desktopNavItems} 
                dockRef={dockRef}
                buttonRefs={buttonRefs}
                onHoverChange={onHoverChange}
                isXMUser={isXMUser}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="minimized-dock"
              initial={{ opacity: 0, y: 50, scale: 0.5, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 40, scale: 0.6, filter: 'blur(6px)' }}
              transition={{ 
                type: 'spring', 
                damping: 26, 
                stiffness: 550,
                mass: 0.35,
                opacity: { duration: 0.1 },
                filter: { duration: 0.12 }
              }}
              className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-40"
              style={{ willChange: 'transform, opacity, filter' }}
            >
              <MinimizedDock 
                items={desktopNavItems}
                onExpandClick={() => {
                  SoundEffects.click();
                  onExpandClick?.();
                }}
                isXMUser={isXMUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
));

DesktopNavbar.displayName = 'DesktopNavbar';
