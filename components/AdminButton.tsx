"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

export function AdminButton() {
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminEmailEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || '';
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    if (!adminEmailEnv) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email?.toLowerCase();
        setIsAdmin(Boolean(adminEmailEnv) && email === adminEmailEnv);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const email = session?.user?.email?.toLowerCase();
        setIsAdmin(Boolean(adminEmailEnv) && email === adminEmailEnv);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [adminEmailEnv, supabase]);

  const openAdminPanel = () => {
    window.dispatchEvent(new CustomEvent('openAdminVIPPanel'));
  };

  // Don't show anything while loading or if not admin
  if (loading || !isAdmin) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={openAdminPanel}
      className={`fixed bottom-4 right-4 z-[99999] p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full transition-all group ${shouldSkipHeavyEffects ? '' : 'shadow-lg shadow-blue-500/30'}`}
      title="Open Admin Panel"
    >
      <Shield className="w-5 h-5 text-white" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Admin Panel
      </span>
      
      {/* Pulse effect */}
      {!shouldSkipHeavyEffects && (
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-500/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

export default AdminButton;
