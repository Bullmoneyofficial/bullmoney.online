'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// UNIFIED HERO MODE HOOK
// Shared state for Store/Trader hero toggle across all pages
// Uses localStorage + custom events for cross-component sync
// ============================================================================

export type HeroMode = 'store' | 'trader';

const HERO_MODE_KEY = 'hero_main_mode_v1';
const HERO_MODE_EVENT = 'hero_mode_change';

function readMode(): HeroMode {
  if (typeof window === 'undefined') return 'store';
  try {
    const stored = window.localStorage.getItem(HERO_MODE_KEY);
    if (stored === 'store' || stored === 'trader') return stored;
  } catch {}
  return 'store';
}

function writeMode(mode: HeroMode) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HERO_MODE_KEY, mode);
  } catch {}
}

export function useHeroMode() {
  const [mode, setMode] = useState<HeroMode>('store');

  // Read from localStorage on mount
  useEffect(() => {
    setMode(readMode());
  }, []);

  // Listen for changes from other components / pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<HeroMode>).detail;
      if (detail === 'store' || detail === 'trader') {
        setMode(detail);
      } else {
        setMode(readMode());
      }
    };
    window.addEventListener(HERO_MODE_EVENT, handler);
    return () => window.removeEventListener(HERO_MODE_EVENT, handler);
  }, []);

  const setHeroMode = useCallback((next: HeroMode) => {
    setMode(next);
    writeMode(next);
    // Broadcast to all listeners (other components on same page + StoreHeader)
    window.dispatchEvent(new CustomEvent(HERO_MODE_EVENT, { detail: next }));
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next: HeroMode = prev === 'store' ? 'trader' : 'store';
      writeMode(next);
      window.dispatchEvent(new CustomEvent(HERO_MODE_EVENT, { detail: next }));
      return next;
    });
  }, []);

  return { heroMode: mode, setHeroMode, toggleHeroMode: toggle } as const;
}
