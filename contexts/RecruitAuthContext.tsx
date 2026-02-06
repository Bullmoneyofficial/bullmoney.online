"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { persistSession, loadSession, clearSession, syncSessionLayers } from '@/lib/sessionPersistence';

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
const PAGEMODE_SESSION_KEY = 'bullmoney_session'; // Also check pagemode login

export function RecruitAuthProvider({ children }: { children: React.ReactNode }) {
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseClient(), []);

  // Load saved session from ALL storage layers (localStorage, sessionStorage, cookie)
  // NEVER clear session on transient errors - only on explicit sign-out
  useEffect(() => {
    const loadSavedSession = async () => {
      try {
        // Use the redundant persistence layer to find session from any source
        const sessionData = loadSession();
        
        if (sessionData) {
          const { recruitId, email } = sessionData;
          console.log('[RecruitAuth] Session found, verifying...', email);
          
          // Verify the session is still valid by fetching the recruit
          const { data, error } = await supabase
            .from('recruits')
            .select('*')
            .eq('id', recruitId)
            .ilike('email', email)
            .single();

          if (!error && data) {
            const profile = transformRecruitData(data);
            setRecruit(profile);
            
            // Sync all storage layers to ensure redundancy
            persistSession({ recruitId: data.id, email: data.email });
            console.log('[RecruitAuth] Session verified & synced:', email);
          } else if (error) {
            // NEVER clear session on errors - user might just have network issues
            // They'll stay "logged in" with cached profile until next successful verify
            console.warn('[RecruitAuth] Verify failed (keeping session):', error.message);
            
            // Still set recruit from cached data so user isn't locked out
            // Create a minimal profile from cached session data
            setRecruit({
              id: recruitId,
              created_at: '',
              email: email,
              mt5_id: '',
              affiliate_code: null,
              referred_by_code: null,
              social_handle: null,
              task_broker_verified: false,
              task_social_verified: false,
              status: 'Active',
              commission_balance: 0,
              total_referred_manual: null,
              used_code: false,
              image_url: null,
            });
          } else if (!data) {
            // No data AND no error = user truly doesn't exist in DB
            // This is the ONLY case where we clear (user was deleted from DB)
            console.warn('[RecruitAuth] User not found in DB, clearing session');
            clearSession();
          }
        }
      } catch (error) {
        console.error('[RecruitAuth] Session load error (keeping session):', error);
        // DON'T clear session on unexpected errors - preserve user login
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSession();
    
    // Periodically sync session layers (every 5 minutes)
    const syncInterval = setInterval(() => {
      syncSessionLayers();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(syncInterval);
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
      // Query the recruits table for matching email (case-insensitive)
      // First find the user by email, then verify password
      const { data: recruits, error: fetchError } = await supabase
        .from('recruits')
        .select('*')
        .ilike('email', email.trim());  // Case-insensitive email match

      if (fetchError) {
        console.error('Login error:', fetchError, 'Email:', email.trim());
        return { success: false, error: 'Unable to connect. Please try again.' };
      }

      // Find matching recruit with correct password
      const data = recruits?.find(r => r.password === password);

      if (!data) {
        console.error('Login error: No matching credentials', 'Email:', email.trim());
        return { success: false, error: 'Invalid email or password' };
      }

      const recruitProfile = transformRecruitData(data);
      setRecruit(recruitProfile);

      // Save session to ALL storage layers (localStorage, sessionStorage, cookie)
      persistSession({
        recruitId: recruitProfile.id,
        email: recruitProfile.email,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  // Sign out - clear ALL storage layers
  const signOut = useCallback(() => {
    setRecruit(null);
    clearSession();
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
