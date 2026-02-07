'use client';

import React, { createContext, useContext, useCallback, ReactNode, useState, useEffect } from 'react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

// Extend sound types with trading/app-specific sounds
type SoundContextType = {
  isReady: boolean;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  sounds: {
    // Button & UI
    buttonClick: () => void;
    buttonHover: () => void;
    
    // Trading (MT5 style)
    orderOpen: () => void;
    orderClose: () => void;
    
    // Alerts
    success: () => void;
    error: () => void;
    warning: () => void;
    notification: () => void;
    telegram: () => void;
    
    // Admin
    adminAction: () => void;
    delete: () => void;
    
    // Modal
    modalOpen: () => void;
    modalClose: () => void;
    
    // Product
    addToCart: () => void;
    purchase: () => void;
    
    // Filter & Sort
    filterApply: () => void;
    sortChange: () => void;
    
    // Navigation
    navClick: () => void;
    menuOpen: () => void;
    menuClose: () => void;
    
    // Cookie/Promo
    cookieAccept: () => void;
    promoPopup: () => void;
    
    // 3D/Hero
    heroInteract: () => void;
  };
};

// Create context with undefined default
const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Provider component
interface SoundProviderProps {
  children: ReactNode;
  enabled?: boolean;
  volume?: number;
}

export function SoundProvider({ 
  children, 
  enabled = true, 
  volume = 0.4 
}: SoundProviderProps) {
  const [isReady, setIsReady] = useState(false);

  // Initialize on mount
  useEffect(() => {
    SoundEffects.setEnabled(enabled);
    SoundEffects.setVolume(volume);
    
    // Mark ready after first user interaction
    const markReady = () => {
      setIsReady(true);
    };
    
    document.addEventListener('click', markReady, { once: true });
    document.addEventListener('touchstart', markReady, { once: true });
    
    return () => {
      document.removeEventListener('click', markReady);
      document.removeEventListener('touchstart', markReady);
    };
  }, [enabled, volume]);

  // Update settings when props change
  useEffect(() => {
    SoundEffects.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    SoundEffects.setVolume(volume);
  }, [volume]);

  const setVolume = useCallback((vol: number) => {
    SoundEffects.setVolume(vol);
  }, []);

  const setEnabled = useCallback((en: boolean) => {
    SoundEffects.setEnabled(en);
  }, []);

  // Create sounds object mapping to SoundEffects
  const sounds: SoundContextType['sounds'] = {
    // Button & UI
    buttonClick: () => SoundEffects.click(),
    buttonHover: () => SoundEffects.hover(),
    
    // Trading (MT5 style)
    orderOpen: () => SoundEffects.mt5Entry(),
    orderClose: () => SoundEffects.confirm(),
    
    // Alerts
    success: () => SoundEffects.success(),
    error: () => SoundEffects.error(),
    warning: () => SoundEffects.error(),
    notification: () => SoundEffects.confirm(),
    telegram: () => SoundEffects.confirm(), // Telegram message alert
    
    // Admin
    adminAction: () => SoundEffects.click(),
    delete: () => SoundEffects.error(),
    
    // Modal
    modalOpen: () => SoundEffects.open(),
    modalClose: () => SoundEffects.close(),
    
    // Product
    addToCart: () => SoundEffects.success(),
    purchase: () => SoundEffects.success(),
    
    // Filter & Sort
    filterApply: () => SoundEffects.tab(),
    sortChange: () => SoundEffects.tab(),
    
    // Navigation
    navClick: () => SoundEffects.click(),
    menuOpen: () => SoundEffects.open(),
    menuClose: () => SoundEffects.close(),
    
    // Cookie/Promo
    cookieAccept: () => SoundEffects.confirm(),
    promoPopup: () => SoundEffects.open(),
    
    // 3D/Hero
    heroInteract: () => SoundEffects.swoosh(),
  };

  const value: SoundContextType = {
    isReady,
    setVolume,
    setEnabled,
    sounds,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

// Hook to use sound context
export function useSound() {
  const context = useContext(SoundContext);
  
  if (context === undefined) {
    // Return a no-op version with SoundEffects as fallback when used outside provider
    return {
      isReady: false,
      setVolume: (vol: number) => SoundEffects.setVolume(vol),
      setEnabled: (en: boolean) => SoundEffects.setEnabled(en),
      sounds: {
        buttonClick: () => SoundEffects.click(),
        buttonHover: () => SoundEffects.hover(),
        orderOpen: () => SoundEffects.mt5Entry(),
        orderClose: () => SoundEffects.confirm(),
        success: () => SoundEffects.success(),
        error: () => SoundEffects.error(),
        warning: () => SoundEffects.error(),
        notification: () => SoundEffects.confirm(),
        telegram: () => SoundEffects.confirm(),
        adminAction: () => SoundEffects.click(),
        delete: () => SoundEffects.error(),
        modalOpen: () => SoundEffects.open(),
        modalClose: () => SoundEffects.close(),
        addToCart: () => SoundEffects.success(),
        purchase: () => SoundEffects.success(),
        filterApply: () => SoundEffects.tab(),
        sortChange: () => SoundEffects.tab(),
        navClick: () => SoundEffects.click(),
        menuOpen: () => SoundEffects.open(),
        menuClose: () => SoundEffects.close(),
        cookieAccept: () => SoundEffects.confirm(),
        promoPopup: () => SoundEffects.open(),
        heroInteract: () => SoundEffects.swoosh(),
      },
    } as SoundContextType;
  }
  
  return context;
}

// HOC for adding sounds to any component's onClick
export function withClickSound<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  soundName: keyof SoundContextType['sounds'] = 'buttonClick'
) {
  return function WithClickSound(props: P & { onClick?: () => void }) {
    const { sounds } = useSound();
    
    const handleClick = () => {
      sounds[soundName]?.();
      props.onClick?.();
    };
    
    return <WrappedComponent {...props} onClick={handleClick} />;
  };
}
