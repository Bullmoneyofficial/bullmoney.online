'use client';

import { useEffect, useRef } from 'react';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// CURRENCY RATE SYNC
// Fetches live forex + crypto rates on mount and every 5 minutes.
// Rates are persisted in localStorage via Zustand so they survive refreshes.
// Falls back to static rates if the API is unavailable.
// ============================================================================

const REFRESH_INTERVAL = 60 * 1000; // 1 minute — live prices
const STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes — refetch if older

export function CurrencyRateSync() {
  const fetchLiveRates = useCurrencyLocaleStore((s) => s.fetchLiveRates);
  const liveRatesFetchedAt = useCurrencyLocaleStore((s) => s.liveRatesFetchedAt);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only fetch if rates are stale or never fetched
    const isStale = !liveRatesFetchedAt || Date.now() - liveRatesFetchedAt > STALE_THRESHOLD;

    if (isStale) {
      fetchLiveRates();
    }

    // Refresh on a regular interval
    intervalRef.current = setInterval(() => {
      fetchLiveRates();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);  

  return null; // Invisible — just keeps rates fresh
}
