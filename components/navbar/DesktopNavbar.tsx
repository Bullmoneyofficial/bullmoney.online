import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconBuildingStore,
  IconUsersGroup,
  IconHelp,
  IconCalendarTime,
  IconSettings,
  IconLock,
  IconUser,
  IconChartBar,
  IconShoppingBag,
} from '@tabler/icons-react';
import { PillDock } from './PillDock';
import { MinimizedDock } from './MinimizedDock';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useChartNewsUI, useProductsModalUI } from '@/contexts/UIStateContext';
import './DesktopNavbar.css';

interface DesktopNavbarProps {
  isXMUser: boolean;
  isAdmin: boolean;
  hasReward: boolean;
  dockRef: React.RefObject<HTMLDivElement | null>;
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange: (isHovered: boolean) => void;
  onAffiliateClick: () => void;
  onFaqClick: () => void;
  onAdminClick: () => void;
  onAccountManagerClick: () => void;
  mounted: boolean;
  isScrollMinimized?: boolean;
  onExpandClick?: () => void;
  showAccountManager?: boolean;
}

export const DesktopNavbar = memo(React.forwardRef<HTMLDivElement, DesktopNavbarProps>(
  (
    {
      isXMUser,
      isAdmin,
      hasReward,
      dockRef,
      buttonRefs,
      onHoverChange,
      onAffiliateClick,
      onFaqClick,
      onAdminClick,
      onAccountManagerClick,
      mounted,
      isScrollMinimized = false,
      onExpandClick,
      showAccountManager = false,
    },
    ref
  ) => {
    const { setChartNewsOpen } = useChartNewsUI();
    const { open: openProductsModal } = useProductsModalUI();
    
    const handleChartNewsClick = useCallback(() => {
      SoundEffects.click();
      setChartNewsOpen(true);
    }, [setChartNewsOpen]);
    
    const handleProductsClick = useCallback(() => {
      SoundEffects.click();
      openProductsModal();
    }, [openProductsModal]);
    
    const safeAdminIcon = isAdmin ? (
      <IconSettings className="h-5 w-5 text-white" stroke={1.5} />
    ) : (
      <IconLock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" stroke={1.5} />
    );

    const desktopNavItems = [
      {
        icon: <IconBuildingStore className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Home",
        tips: ["Welcome to BullMoney!", "Explore our platform", "Check what's new"],
        href: "/",
      },
      {
        icon: isXMUser 
          ? <IconUsersGroup className="h-6 w-6 text-red-400" stroke={1.5} />
          : <IconUsersGroup className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Affiliates",
        tips: ["Join our affiliate program", "Earn commissions", "Grow with us"],
        onClick: onAffiliateClick,
        isXMHighlight: isXMUser,
      },
      {
        icon: <IconHelp className="h-6 w-6 text-white" stroke={1.5} />,
        label: "FAQ",
        tips: ["Got questions?", "Find your answers here", "Support center"],
        onClick: onFaqClick,
      },
      {
        icon: <IconCalendarTime className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Products",
        tips: ["Browse our products", "Find the best tools for you", "Check out our latest offers"],
        onClick: handleProductsClick,
      },
      {
        icon: <IconChartBar className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Charts & News",
        tips: ["Live market charts", "Real-time market news", "Professional trading tools"],
        onClick: handleChartNewsClick,
      },
      {
        icon: <IconShoppingBag className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Store",
        tips: ["Browse our merch", "Exclusive products", "Shop now"],
        href: "/store",
      },
    ];

    if (showAccountManager) {
      desktopNavItems.splice(4, 0, {
        icon: <IconUser className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Account Manager",
        tips: ["Manage your profile", "Update MT5 accounts", "Access VIP perks"],
        onClick: onAccountManagerClick,
      });
    }

    if (mounted && isAdmin) {
      desktopNavItems.push({
        icon: safeAdminIcon,
        label: "Dashboard",
        tips: ["Manage Site", "Logout", "View Orders"],
        onClick: onAdminClick,
      });
    }

    return (
      <div ref={ref} className="hidden lg:flex w-full max-w-7xl mx-auto items-center justify-center h-16 relative">
        {/* Logo - fades out when minimized */}
        <div 
          className="desktop-navbar-logo absolute left-0 pointer-events-auto z-50 flex items-center gap-3 h-16 overflow-visible pl-0 pr-4"
          style={{
            opacity: isScrollMinimized ? 0 : 1,
            transform: isScrollMinimized ? 'scale(0.9) translateZ(0)' : 'scale(1) translateZ(0)',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isScrollMinimized ? 'none' : 'auto',
            marginLeft: '0',
            width: 'auto',
          }}
        >
          <Link href="/" className="relative shrink-0 w-16 h-16 block">
            <Image
              src="/ONcc2l601.svg"
              alt="BullMoney"
              fill
              className="object-cover"
              priority
            />
          </Link>
          <Link href="/" className="shrink-0 text-2xl font-semibold tracking-wide" style={{
            color: '#ffffff',
            textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.05em'
          }}>
            bullmoney
          </Link>
        </div>
        
        {/* Full Dock - centered, slides up and fades when minimizing */}
        <div 
          className="pointer-events-auto z-40"
          style={{
            opacity: isScrollMinimized ? 0 : 1,
            transform: isScrollMinimized 
              ? 'translateY(-15px) scale(0.95) translateZ(0)' 
              : 'translateY(0) scale(1) translateZ(0)',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isScrollMinimized ? 'none' : 'auto',
          }}
        >
          <PillDock 
            items={desktopNavItems} 
            dockRef={dockRef}
            buttonRefs={buttonRefs}
            onHoverChange={onHoverChange}
            activeLabel={undefined}
          />
        </div>

        {/* Minimized Dock - centered, slides in from below when minimizing */}
        <div 
          className="absolute pointer-events-auto z-40"
          style={{
            opacity: isScrollMinimized ? 1 : 0,
            transform: isScrollMinimized 
              ? 'translateY(0) scale(1) translateZ(0)' 
              : 'translateY(15px) scale(0.95) translateZ(0)',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
