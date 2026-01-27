"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createSupabaseClient } from '@/lib/supabase';

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
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const adminEmailEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || '';
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    let mounted = true;
    const evaluate = (email?: string | null) => {
      if (!mounted) return;
      setIsAdminAuthorized(Boolean(adminEmailEnv) && email?.toLowerCase() === adminEmailEnv);
    };

    const run = async () => {
      if (!adminEmailEnv) {
        setIsAdminAuthorized(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('Admin VIP auth error', error.message);
      evaluate(data?.session?.user?.email || null);
    };

    run();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user?.email || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [adminEmailEnv, supabase]);

  useEffect(() => {
    const handleOpen = () => {
      if (!isAdminAuthorized) return;
      setIsOpen(true);
      setHasOpened(true);
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleToggle = () => {
      if (!isAdminAuthorized) return;
      setIsOpen((prev) => !prev);
      setHasOpened(true);
    };

    window.addEventListener('openAdminVIPPanel', handleOpen);
    window.addEventListener('closeAdminVIPPanel', handleClose);
    window.addEventListener('toggleAdminVIPPanel', handleToggle);

    // Also support keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (!isAdminAuthorized) return;
        setIsOpen(prev => !prev);
        setHasOpened(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('openAdminVIPPanel', handleOpen);
      window.removeEventListener('closeAdminVIPPanel', handleClose);
      window.removeEventListener('toggleAdminVIPPanel', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminAuthorized]);

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
