import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DashboardPreferences {
  quotes: {
    autoRefresh: boolean;
    notifications: boolean;
    soundEnabled: boolean;
    refreshInterval: number;
    category: 'all' | 'forex' | 'crypto' | 'stocks';
  };
  news: {
    autoRefresh: boolean;
    notifications: boolean;
    soundEnabled: boolean;
    refreshInterval: number;
    priority: 'all' | 'high' | 'breaking';
    pullInterval: number;
  };
  telegram: {
    autoRefresh: boolean;
    notifications: boolean;
    soundEnabled: boolean;
    refreshInterval: number;
    visibility: 'all' | 'vip' | 'free';
    enabledGroups: string[];
    notifyGroups: string[];
  };
  watchlist: string[];
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  quotes: {
    autoRefresh: true,
    notifications: false,
    soundEnabled: false,
    refreshInterval: 30000,
    category: 'all'
  },
  news: {
    autoRefresh: true,
    notifications: true,
    soundEnabled: true,
    refreshInterval: 60000,
    priority: 'all',
    pullInterval: 300000
  },
  telegram: {
    autoRefresh: true,
    notifications: true,
    soundEnabled: false,
    refreshInterval: 45000,
    visibility: 'all',
    enabledGroups: ['vip', 'free', 'signals'],
    notifyGroups: ['vip']
  },
  watchlist: []
};

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in, use localStorage as fallback
        const stored = localStorage.getItem('bullmoney_dashboard_prefs');
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/dashboard/preferences', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('bullmoney_dashboard_prefs');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Save preferences to API
  const savePreferences = useCallback(async (newPreferences: DashboardPreferences) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Always save to localStorage as backup
      localStorage.setItem('bullmoney_dashboard_prefs', JSON.stringify(newPreferences));
      
      if (!session) {
        setPreferences(newPreferences);
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/dashboard/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ preferences: newPreferences })
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        // If save fails, still update local state
        setPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Still update local state on error
      setPreferences(newPreferences);
    } finally {
      setIsSaving(false);
    }
  }, [supabase]);

  // Update specific section preferences
  const updateQuotesPrefs = useCallback((updates: Partial<DashboardPreferences['quotes']>) => {
    const newPrefs = {
      ...preferences,
      quotes: { ...preferences.quotes, ...updates }
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  const updateNewsPrefs = useCallback((updates: Partial<DashboardPreferences['news']>) => {
    const newPrefs = {
      ...preferences,
      news: { ...preferences.news, ...updates }
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  const updateTelegramPrefs = useCallback((updates: Partial<DashboardPreferences['telegram']>) => {
    const newPrefs = {
      ...preferences,
      telegram: { ...preferences.telegram, ...updates }
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  const updateWatchlist = useCallback((watchlist: string[]) => {
    const newPrefs = {
      ...preferences,
      watchlist
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    updateQuotesPrefs,
    updateNewsPrefs,
    updateTelegramPrefs,
    updateWatchlist,
    savePreferences,
    loadPreferences
  };
}
