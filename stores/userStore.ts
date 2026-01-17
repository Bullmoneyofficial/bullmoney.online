"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, UserProfileUpdate } from '@/types/user';

// ============================================================================
// USER STORE - Authentication and User Profile State
// ============================================================================

export interface UserStore {
  // User state
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Session
  sessionId: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  logout: () => void;

  // Computed helpers
  isSmartMoney: () => boolean;
  isPro: () => boolean;
  getDisplayName: () => string;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionId: null,

      // Set user (login/refresh)
      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }),

      // Update profile fields
      updateUserProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Set session ID
      setSessionId: (sessionId) => set({ sessionId }),

      // Logout
      logout: () => set({
        user: null,
        isAuthenticated: false,
        sessionId: null,
      }),

      // Check if user qualifies as "Smart Money"
      isSmartMoney: () => {
        const { user } = get();
        return user?.is_smart_money ?? false;
      },

      // Check if user has Pro subscription
      isPro: () => {
        const { user } = get();
        return user?.subscription_tier === 'pro' || user?.subscription_tier === 'elite';
      },

      // Get display name with fallback
      getDisplayName: () => {
        const { user } = get();
        return user?.display_name || user?.username || 'Anonymous';
      },
    }),
    {
      name: 'bull-feed-user',
      partialize: (state) => ({
        // Only persist session-related data, not full user object
        sessionId: state.sessionId,
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useUser = () => useUserStore((state) => state.user);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useIsUserLoading = () => useUserStore((state) => state.isLoading);
