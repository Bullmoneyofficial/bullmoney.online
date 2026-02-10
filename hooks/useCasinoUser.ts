'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CasinoUser {
  id: number;
  username: string;
  balance: number;
  avatar: string;
  rank: number;
  unique_id: string;
  admin: number;
  ref_code: string;
  demo_balance?: number;
}

// Default guest user — casino is free-to-play, no login required
const GUEST_USER: CasinoUser = {
  id: 0,
  username: 'Guest',
  balance: 1000,
  avatar: '/casino-assets/images/profile.jpg',
  rank: 0,
  unique_id: 'guest',
  admin: 0,
  ref_code: '',
  demo_balance: 1000,
};

const GUEST_STORAGE_KEY = 'casino_guest_balance';

function loadGuestBalance(): number {
  if (typeof window === 'undefined') return GUEST_USER.balance;
  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) return parseFloat(stored);
  } catch {}
  return GUEST_USER.balance;
}

function saveGuestBalance(balance: number) {
  try { localStorage.setItem(GUEST_STORAGE_KEY, String(balance)); } catch {}
}

export function useCasinoUser() {
  const [user, setUser] = useState<CasinoUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/casino/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data?.data?.user) {
        setUser(data.data.user);
        setLoading(false);
        return;
      }
    } catch {}
    // No authenticated user — fall back to guest
    setUser({ ...GUEST_USER, balance: loadGuestBalance() });
    setLoading(false);
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const updateBalance = useCallback((newBalance: number) => {
    setUser(prev => {
      if (!prev) return null;
      // Persist guest balance to localStorage
      if (prev.id === 0) saveGuestBalance(newBalance);
      return { ...prev, balance: newBalance };
    });
  }, []);

  const logout = useCallback(async () => {
    try { await fetch('/api/casino/auth/logout', { credentials: 'include' }); } catch {}
    // Reset to guest
    saveGuestBalance(GUEST_USER.balance);
    setUser({ ...GUEST_USER });
  }, []);

  return { user, loading, fetchUser, updateBalance, logout };
}

export async function casinoPost(url: string, body?: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

export async function casinoGet(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  return res.json();
}
