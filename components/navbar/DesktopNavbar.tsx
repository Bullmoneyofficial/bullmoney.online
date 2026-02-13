import React, { memo, useCallback, useState, useEffect } from 'react';
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
  IconPalette,
  IconSparkles,
  IconEye,
  IconEyeOff,
  IconMail,
} from '@tabler/icons-react';
import { PillDock } from './PillDock';
import { MinimizedDock } from './MinimizedDock';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useChartNewsUI, useProductsModalUI, useThemeSelectorModalUI } from '@/contexts/UIStateContext';
import { LanguageToggle } from '@/components/LanguageToggle';
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
    const { setIsOpen: setThemePickerModalOpen } = useThemeSelectorModalUI();
    
    // Toggle states for Theme Picker and Ultimate Hub - default OFF until user explicitly enables
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showUltimateHub, setShowUltimateHub] = useState(true);
    
    // Load toggle preferences from localStorage & sync theme picker modal
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('store_show_theme_picker');
        // Default to false on first load — only open when explicitly set to 'true'
        const themeValue = storedTheme === 'true';
        setShowThemePicker(themeValue);
        setThemePickerModalOpen(themeValue);
        const storedHub = localStorage.getItem('store_show_ultimate_hub');
        setShowUltimateHub(storedHub !== 'false');
      }
    }, [setThemePickerModalOpen]);
    
    // Listen for external toggle changes
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
      {
        icon: <IconMail className="h-6 w-6 text-white" stroke={1.5} />,
        label: "Newsletter",
        tips: ["Get updates", "Affiliate info", "Site highlights"],
        href: "/store/account",
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

        {/* 🌐 Language Toggle - Right of logo, fades with it */}
        <div
          className="absolute right-0 pointer-events-auto z-50 flex items-center h-16 pr-0"
          style={{
            opacity: isScrollMinimized ? 0 : 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isScrollMinimized ? 'none' : 'auto',
          }}
        >
          <LanguageToggle variant="pill" dropDirection="down" />
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

        {/* Toggle Buttons - bottom right, fade with dock */}
        <div
          className="absolute right-0 pointer-events-auto z-50 flex items-center gap-2"
          style={{
            top: '100%',
            marginTop: 8,
            opacity: isScrollMinimized ? 0 : 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isScrollMinimized ? 'none' : 'auto',
          }}
        >
          {/* Theme Picker Toggle */}
          <button
            onClick={toggleThemePicker}
            className="h-8 px-3 flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-semibold"
            style={showThemePicker 
              ? { background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)' }
              : { background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }
            }
            title={showThemePicker ? 'Theme Picker: ON' : 'Theme Picker: OFF'}
          >
            <IconPalette className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Themes</span>
            {showThemePicker ? <IconEye className="w-3 h-3" strokeWidth={2} /> : <IconEyeOff className="w-3 h-3" strokeWidth={2} />}
          </button>

          {/* Ultimate Hub Toggle */}
          <button
            onClick={toggleUltimateHub}
            className="h-8 px-3 flex items-center gap-2 rounded-lg transition-all duration-200 text-xs font-semibold"
            style={showUltimateHub 
              ? { background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)' }
              : { background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }
            }
            title={showUltimateHub ? 'Ultimate Hub: ON' : 'Ultimate Hub: OFF'}
          >
            <IconSparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Hub</span>
            {showUltimateHub ? <IconEye className="w-3 h-3" strokeWidth={2} /> : <IconEyeOff className="w-3 h-3" strokeWidth={2} />}
          </button>
        </div>
      </div>
    );
  }
));

DesktopNavbar.displayName = 'DesktopNavbar';
