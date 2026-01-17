"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile, UserProfileUpdate, AuthState, AuthActions } from '@/types/user';

interface AuthContextValue extends AuthState, AuthActions {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseClient(), []);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        if (initialSession?.user) {
          const profile = await fetchUserProfile(initialSession.user.id);
          setUser(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession?.user) {
          const profile = await fetchUserProfile(newSession.user.id);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          const profile = await fetchUserProfile(newSession.user.id);
          setUser(profile);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  // Sign up with email, password, and username
  const signUp = useCallback(async (
    email: string,
    password: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        return { success: false, error: 'Username is already taken' };
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create account' };
      }

      // The trigger will auto-create the profile, but we can update with correct username
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Error updating profile username:', profileError);
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  // Sign in with email and password
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [supabase]);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
  }, [session, fetchUserProfile]);

  // Update user profile
  const updateProfile = useCallback(async (
    updates: UserProfileUpdate
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh the local user data
      await refreshUser();

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [session, supabase, refreshUser]);

  const value: AuthContextValue = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!session && !!user,
    signUp,
    signIn,
    signOut,
    refreshUser,
    updateProfile,
  }), [user, isLoading, session, signUp, signIn, signOut, refreshUser, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(): AuthContextValue & { requireAuth: () => boolean } {
  const auth = useAuth();

  const requireAuth = useCallback(() => {
    if (!auth.isAuthenticated) {
      // Could trigger auth modal here
      return false;
    }
    return true;
  }, [auth.isAuthenticated]);

  return { ...auth, requireAuth };
}
