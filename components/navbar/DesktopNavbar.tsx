import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconBuildingStore,
  IconSparkles,
  IconUsersGroup,
  IconHelp,
  IconCreditCard,
  IconCalendarTime,
  IconSettings,
  IconLock,
} from '@tabler/icons-react';
import { Dock } from './Dock';
import ServicesModal from '@/components/ui/SeviceModal';
import { LoyaltyModal } from '@/components/LoyaltyCard';

interface DesktopNavbarProps {
  isXMUser: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasReward: boolean;
  dockRef: React.RefObject<HTMLDivElement>;
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange: (isHovered: boolean) => void;
  onAffiliateClick: () => void;
  onFaqClick: () => void;
  onThemeClick: () => void;
  onAdminClick: () => void;
  mounted: boolean;
}

export const DesktopNavbar = React.forwardRef<HTMLDivElement, DesktopNavbarProps>(
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
    },
    ref
  ) => {
    const safeThemeIcon = (
      <IconSparkles className="h-6 w-6 text-blue-400" stroke={1.5} />
    );

    const safeAdminIcon = isAdmin ? (
      <IconSettings className="h-5 w-5 text-blue-400" stroke={1.5} />
    ) : (
      <IconLock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" stroke={1.5} />
    );

    const safeLoyaltyIcon = hasReward ? (
      <IconCreditCard className="h-6 w-6 text-blue-400 animate-pulse" stroke={1.5} />
    ) : (
      <IconCreditCard className="h-6 w-6 text-blue-400" stroke={1.5} />
    );

    const desktopNavItems = [
      {
        icon: <IconBuildingStore className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Home",
        tips: ["Welcome to BullMoney!", "Explore our platform", "Check what's new"],
        href: "/",
      },
      {
        icon: <IconSparkles className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Setups",
        tips: ["Daily Trading Setups", "Crypto & Forex Analysis", "Premium Alerts"],
        triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><ServicesModal /></div>,
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
        icon: safeLoyaltyIcon,
        label: hasReward ? "REWARD!" : "Rewards",
        tips: hasReward ? ["REWARD UNLOCKED!", "Click to redeem", "10% OFF"] : ["Digital rewards card", "Earn points", "Get exclusive perks"],
        triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><LoyaltyModal /></div>,
        showShine: hasReward,
      },
      {
        icon: <IconCalendarTime className="h-6 w-6 text-blue-400" stroke={1.5} />,
        label: "Products",
        tips: ["Browse our products", "Find the best tools for you", "Check out our latest offers"],
        href: "/products",
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
        <div className="pointer-events-auto z-50 flex items-center justify-center h-23 w-23 overflow-hidden relative">
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
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-40">
          <Dock 
            items={desktopNavItems} 
            dockRef={dockRef}
            buttonRefs={buttonRefs}
            onHoverChange={onHoverChange}
            isXMUser={isXMUser}
          />
        </div>
      </div>
    );
  }
);

DesktopNavbar.displayName = 'DesktopNavbar';
