import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

export function useVipCheck(userId?: string, userEmail?: string) {
  // Initialize from localStorage synchronously for immediate VIP access
  const [isVip, setIsVip] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedSession = localStorage.getItem('bullmoney_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.is_vip === true) {
          console.log('[VIP Check] ✅ Initialized as VIP from localStorage');
          return true;
        }
      }
    } catch (e) {}
    return false;
  });
  const [loading, setLoading] = useState(true);
  
  const checkStatus = useCallback(async () => {
    // First, check localStorage for cached VIP status (instant access)
    let sessionEmail: string | null = null;
    let cachedVipStatus: boolean | null = null;
    
    try {
      const savedSession = localStorage.getItem('bullmoney_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        sessionEmail = session.email || null;
        cachedVipStatus = session.is_vip === true;
        
        console.log('[VIP Check] localStorage session:', { 
          email: sessionEmail, 
          is_vip: session.is_vip,
          cachedVipStatus 
        });
        
        // If we have a cached VIP status = true, use it immediately while still verifying via API
        if (cachedVipStatus) {
          console.log('[VIP Check] ✅ User is VIP from localStorage cache (verifying with API)');
          setIsVip(true);
        }
      }
    } catch (e) {
      console.error('[VIP Check] localStorage error:', e);
    }
    
    // Determine the email to use for API check
    const emailToCheck = userEmail || sessionEmail;
    
    if (!emailToCheck && !userId) {
      console.log('[VIP Check] No email or userId - using cached VIP status');
      setIsVip(cachedVipStatus || false);
      setLoading(false);
      return;
    }
    
    try {
      const params = emailToCheck 
        ? `email=${encodeURIComponent(emailToCheck)}` 
        : `userId=${userId}`;
      
      console.log('[VIP Check] Checking API with:', params);
      const res = await fetch(`/api/vip/status?${params}`, { cache: 'no-store' });
      const data = await res.json();
      const vipStatus = data.isVip === true;
      
      console.log('[VIP Check] API Response:', { isVip: vipStatus, data });
      
      setIsVip(vipStatus);
      
      // Update localStorage with latest VIP status
      try {
        const savedSession = localStorage.getItem('bullmoney_session');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          localStorage.setItem('bullmoney_session', JSON.stringify({
            ...session,
            is_vip: vipStatus
          }));
          console.log('[VIP Check] Updated localStorage is_vip:', vipStatus);
        }
      } catch {}
    } catch (error) {
      console.error('[VIP Check] API Error:', error);
      setIsVip(cachedVipStatus || false);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);
  
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'bullmoney_session' || event.key === 'bullmoney_pagemode_completed') {
        checkStatus();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [checkStatus]);
  
  return { isVip, loading };
}

// Exported for use in WelcomeScreenDesktop
export function useLivePrices() {
  const [prices, setPrices] = useState({ xauusd: '...', btcusd: '...' });
  
  useEffect(() => {
    let mounted = true;
    
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/prices/live?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data) {
          setPrices(prev => {
            if (prev.xauusd === data.xauusd && prev.btcusd === data.btcusd) return prev;
            return { xauusd: data.xauusd || prev.xauusd, btcusd: data.btcusd || prev.btcusd };
          });
        }
      } catch {}
    };

    const timeout = setTimeout(fetchPrices, 500);
    const interval = setInterval(fetchPrices, 6000);
    
    return () => { mounted = false; clearTimeout(timeout); clearInterval(interval); };
  }, []);
  
  return prices;
}

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  useEffect(() => {
    const checkAdmin = async () => {
      // First, always check localStorage for session (faster)
      const saved = localStorage.getItem('bullmoney_session');
      if (saved) {
        try {
          const sess = JSON.parse(saved);
          console.log('[useAdminCheck] Found localStorage session:', { id: sess?.id, email: sess?.email, is_vip: sess?.is_vip });
          if (sess?.id) setUserId(sess.id);
          if (sess?.email) setUserEmail(sess.email);
          setIsAdmin(sess?.email === 'mrbullmoney@gmail.com' || sess?.isAdmin);
        } catch (e) {
          console.error('[useAdminCheck] Error parsing session:', e);
        }
      }
      
      // Also check Supabase auth (may override if different)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email;
          console.log('[useAdminCheck] Found Supabase session:', { id: session.user.id, email });
          setIsAdmin(email === 'mrbullmoney@gmail.com');
          setUserId(session.user.id);
          setUserEmail(email);
        }
      } catch (e) {
        console.log('[useAdminCheck] Supabase auth check failed, using localStorage');
      }
    };
    
    checkAdmin();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.email) {
        setIsAdmin(session.user.email === 'mrbullmoney@gmail.com');
        setUserId(session.user.id);
        setUserEmail(session.user.email);
      }
    });
    
    // Check for admin token
    if (localStorage.getItem('adminToken')) setIsAdmin(true);
    
    return () => subscription?.unsubscribe();
  }, [supabase]);
  
  return { isAdmin, userId, userEmail };
}
