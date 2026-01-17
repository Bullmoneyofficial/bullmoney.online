"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

// Recruit profile matching the database schema
export interface RecruitProfile {
  id: string;
  created_at: string;
  email: string;
  mt5_id: string;
  affiliate_code: string | null;
  referred_by_code: string | null;
  social_handle: string | null;
  task_broker_verified: boolean;
  task_social_verified: boolean;
  status: 'Active' | 'Pending' | 'Suspended';
  commission_balance: number;
  total_referred_manual: number | null;
  used_code: boolean;
  image_url: string | null;
}

interface RecruitAuthState {
  recruit: RecruitProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface RecruitAuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  refreshRecruit: () => Promise<void>;
}

interface RecruitAuthContextValue extends RecruitAuthState, RecruitAuthActions {}

const RecruitAuthContext = createContext<RecruitAuthContextValue | undefined>(undefined);

const RECRUIT_STORAGE_KEY = 'bullmoney_recruit_auth';

export function RecruitAuthProvider({ children }: { children: React.ReactNode }) {
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseClient(), []);

  // Load saved session from localStorage
  useEffect(() => {
    const loadSavedSession = async () => {
      try {
        const saved = localStorage.getItem(RECRUIT_STORAGE_KEY);
        if (saved) {
          const { recruitId, email } = JSON.parse(saved);
          
          // Verify the session is still valid by fetching the recruit
          const { data, error } = await supabase
            .from('recruits')
            .select('*')
            .eq('id', recruitId)
            .eq('email', email)
            .single();

          if (!error && data) {
            setRecruit(transformRecruitData(data));
          } else {
            // Invalid session, clear it
            localStorage.removeItem(RECRUIT_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem(RECRUIT_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSession();
  }, [supabase]);

  // Transform database row to RecruitProfile
  const transformRecruitData = (data: any): RecruitProfile => ({
    id: data.id,
    created_at: data.created_at,
    email: data.email,
    mt5_id: data.mt5_id,
    affiliate_code: data.affiliate_code,
    referred_by_code: data.referred_by_code,
    social_handle: data.social_handle,
    task_broker_verified: data.task_broker_verified === true || data.task_broker_verified === 'true',
    task_social_verified: data.task_social_verified === true || data.task_social_verified === 'true',
    status: data.status || 'Pending',
    commission_balance: parseFloat(data.commission_balance) || 0,
    total_referred_manual: data.total_referred_manual,
    used_code: data.used_code === true || data.used_code === 'true',
    image_url: data.image_url,
  });

  // Sign in with email and password against recruits table
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Query the recruits table for matching email (case-insensitive) and password
      const { data, error } = await supabase
        .from('recruits')
        .select('*')
        .ilike('email', email.trim())  // Case-insensitive email match
        .eq('password', password)
        .single();

      if (error || !data) {
        console.error('Login error:', error, 'Email:', email.trim());
        return { success: false, error: 'Invalid email or password' };
      }

      const recruitProfile = transformRecruitData(data);
      setRecruit(recruitProfile);

      // Save session to localStorage
      localStorage.setItem(RECRUIT_STORAGE_KEY, JSON.stringify({
        recruitId: recruitProfile.id,
        email: recruitProfile.email,
      }));

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  // Sign out
  const signOut = useCallback(() => {
    setRecruit(null);
    localStorage.removeItem(RECRUIT_STORAGE_KEY);
  }, []);

  // Refresh recruit data
  const refreshRecruit = useCallback(async () => {
    if (!recruit) return;

    try {
      const { data, error } = await supabase
        .from('recruits')
        .select('*')
        .eq('id', recruit.id)
        .single();

      if (!error && data) {
        setRecruit(transformRecruitData(data));
      }
    } catch (error) {
      console.error('Error refreshing recruit:', error);
    }
  }, [recruit, supabase]);

  const value: RecruitAuthContextValue = useMemo(() => ({
    recruit,
    isAuthenticated: !!recruit,
    isLoading,
    signIn,
    signOut,
    refreshRecruit,
  }), [recruit, isLoading, signIn, signOut, refreshRecruit]);

  return (
    <RecruitAuthContext.Provider value={value}>
      {children}
    </RecruitAuthContext.Provider>
  );
}

export function useRecruitAuth(): RecruitAuthContextValue {
  const context = useContext(RecruitAuthContext);
  if (!context) {
    throw new Error('useRecruitAuth must be used within a RecruitAuthProvider');
  }
  return context;
}

// Hook that returns a function to check auth and optionally open auth modal
export function useRequireRecruitAuth() {
  const { isAuthenticated, recruit } = useRecruitAuth();

  const requireAuth = useCallback((openAuthModal?: () => void): boolean => {
    if (!isAuthenticated) {
      openAuthModal?.();
      return false;
    }
    return true;
  }, [isAuthenticated]);

  return { isAuthenticated, recruit, requireAuth };
}
