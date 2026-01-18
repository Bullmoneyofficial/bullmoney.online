"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVipStatusOptions {
  userId?: string;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface VipStatus {
  isVip: boolean;
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useVipStatus({
  userId,
  enabled = true,
  pollingInterval = 5000, // 5 seconds default
}: UseVipStatusOptions = {}): VipStatus {
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkVipStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setIsVip(false);
      return;
    }

    try {
      const response = await fetch(`/api/vip/status?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check VIP status');
      }

      const data = await response.json();
      setIsVip(data.isVip ?? false);
      setError(null);
      setLastChecked(new Date());
    } catch (err) {
      console.error('VIP status check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    // Initial check
    checkVipStatus();

    // Set up polling
    intervalRef.current = setInterval(checkVipStatus, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, enabled, pollingInterval, checkVipStatus]);

  return { isVip, loading, error, lastChecked };
}

// Hook to get the current user's VIP status from Supabase session
export function useCurrentUserVipStatus(pollingInterval = 5000) {
  const [userId, setUserId] = useState<string | undefined>();
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for Supabase session
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setUserId(data.user?.id);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();
  }, []);

  const vipStatus = useVipStatus({
    userId,
    enabled: !sessionLoading && !!userId,
    pollingInterval,
  });

  return {
    ...vipStatus,
    userId,
    sessionLoading,
  };
}

export default useVipStatus;
