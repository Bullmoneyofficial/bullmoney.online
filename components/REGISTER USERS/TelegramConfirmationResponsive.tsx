"use client";

import React, { useState, useEffect } from 'react';
import { TelegramConfirmationScreen } from './TelegramConfirmationScreen';
import { TelegramConfirmationScreenDesktop } from './TelegramConfirmationScreenDesktop';

interface TelegramConfirmationResponsiveProps {
  onUnlock: () => void;
  onConfirmationClicked: () => void;
  isXM: boolean;
  neonIconClass: string;
}

const DESKTOP_BREAKPOINT = 1024; // lg breakpoint

export const TelegramConfirmationResponsive: React.FC<TelegramConfirmationResponsiveProps> = (props) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Initial check
    checkScreenSize();

    // Listen for resize
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Prevent hydration mismatch - render mobile first on server
  if (!mounted) {
    return <TelegramConfirmationScreen {...props} />;
  }

  return isDesktop ? (
    <TelegramConfirmationScreenDesktop {...props} />
  ) : (
    <TelegramConfirmationScreen {...props} />
  );
};

// Re-export the individual components for direct use if needed
export { TelegramConfirmationScreen } from './TelegramConfirmationScreen';
export { TelegramConfirmationScreenDesktop } from './TelegramConfirmationScreenDesktop';
