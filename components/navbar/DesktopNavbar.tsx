import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from '@tabler/icons-react';
import { Dock } from './Dock';
import { MinimizedDock } from './MinimizedDock';
import { LiveStreamModal } from '@/components/LiveStreamModal';
import { ProductsModal } from '@/components/ProductsModal';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import './DesktopNavbar.css';

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
  onAnalysisClick: () => void;
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
      onAnalysisClick,
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
        onClick: onAnalysisClick,
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
      <div ref={ref} className="hidden lg:flex w-full max-w-7xl mx-auto items-center justify-center h-24 relative">
        {/* Logo - fades out when minimized */}
        <div 
          className="desktop-navbar-logo absolute left-0 pointer-events-auto z-50 flex items-center justify-center h-23 w-23 overflow-hidden"
          style={{
            opacity: isScrollMinimized ? 0 : 1,
            transform: isScrollMinimized ? 'scale(0.8) translateZ(0)' : 'scale(1) translateZ(0)',
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            pointerEvents: isScrollMinimized ? 'none' : 'auto',
          }}
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
        </div>
        
        {/* Full Dock - centered, slides up and fades when minimizing */}
        <div 
          className="pointer-events-auto z-40"
          style={{
            opacity: isScrollMinimized ? 0 : 1,
            transform: isScrollMinimized 
              ? 'translateY(-20px) scale(0.9) translateZ(0)' 
              : 'translateY(0) scale(1) translateZ(0)',
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            pointerEvents: isScrollMinimized ? 'none' : 'auto',
          }}
        >
          <Dock 
            items={desktopNavItems} 
            dockRef={dockRef}
            buttonRefs={buttonRefs}
            onHoverChange={onHoverChange}
            isXMUser={isXMUser}
          />
        </div>

        {/* Minimized Dock - centered, slides in from below when minimizing */}
        <div 
          className="absolute pointer-events-auto z-40"
          style={{
            opacity: isScrollMinimized ? 1 : 0,
            transform: isScrollMinimized 
              ? 'translateY(0) scale(1) translateZ(0)' 
              : 'translateY(20px) scale(0.9) translateZ(0)',
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            pointerEvents: isScrollMinimized ? 'auto' : 'none',
          }}
        >
          <MinimizedDock 
            items={desktopNavItems}
            onExpandClick={() => {
              SoundEffects.click();
              onExpandClick?.();
            }}
            isXMUser={isXMUser}
          />
        </div>
      </div>
    );
  }
));

DesktopNavbar.displayName = 'DesktopNavbar';
