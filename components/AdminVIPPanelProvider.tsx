"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lazy load the admin panel - only loads when opened
const AdminPanelVIP = dynamic(() => import('./AdminPanelVIP').then(mod => ({ default: mod.AdminPanel })), {
  ssr: false,
  loading: () => null,
});

/**
 * Global Admin VIP Panel Provider
 * 
 * Listens for 'openAdminVIPPanel' event to open the admin panel.
 * Add this component to your layout or root component.
 * 
 * Usage:
 * window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
 */
export function AdminVIPPanelProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setHasOpened(true);
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    window.addEventListener('openAdminVIPPanel', handleOpen);
    window.addEventListener('closeAdminVIPPanel', handleClose);

    // Also support keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setHasOpened(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('openAdminVIPPanel', handleOpen);
      window.removeEventListener('closeAdminVIPPanel', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Don't render anything until the panel has been opened at least once
  if (!hasOpened) return null;

  return <AdminPanelVIP isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

/**
 * Hook to control the Admin VIP Panel
 */
export function useAdminVIPPanel() {
  const open = () => {
    window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
  };

  const close = () => {
    window.dispatchEvent(new CustomEvent('closeAdminVIPPanel'));
  };

  const toggle = () => {
    // Send a toggle event - the provider will handle it
    window.dispatchEvent(new CustomEvent('toggleAdminVIPPanel'));
  };

  return { open, close, toggle };
}

export default AdminVIPPanelProvider;
