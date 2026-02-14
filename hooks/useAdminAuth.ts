'use client';

import { useState, useEffect, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { useStudio } from '@/context/StudioContext';

/**
 * Hook to check if user is authorized as admin
 * Checks against NEXT_PUBLIC_ADMIN_EMAIL env variable
 * Also checks localStorage for adminToken and bullmoney_session
 */
export function useAdminAuth() {
  const { state } = useStudio();
  const { userProfile } = state;
  
  // Admin visibility based on Supabase session email matching env
  const normalizeEmail = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .trim()
      .toLowerCase();
  const adminEmailEnv = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const readLocalAdminAuthorization = () => {
    if (typeof window === "undefined") return false;
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) return true;
      const raw = localStorage.getItem("bullmoney_session");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const email = normalizeEmail(parsed?.email);
      const isAdminFlag = Boolean(parsed?.isAdmin);
      if (isAdminFlag) return true;
      return Boolean(adminEmailEnv) && email === adminEmailEnv;
    } catch (err) {
      console.error("Admin session parse error", err);
      return false;
    }
  };

  const [pagemodeAdminAuthorized, setPagemodeAdminAuthorized] = useState(() => readLocalAdminAuthorization());

  useEffect(() => {
    let mounted = true;
    const evaluate = (email?: string | null) => {
      if (!mounted) return;
      setAdminAuthorized(Boolean(adminEmailEnv) && normalizeEmail(email) === adminEmailEnv);
    };
    const run = async () => {
      if (!adminEmailEnv) {
        setAdminAuthorized(false);
        setAdminChecked(true);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Auth session error", error.message);
      evaluate(data?.session?.user?.email || null);
      setAdminChecked(true);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user?.email || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [adminEmailEnv, supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const evaluate = () => {
      setPagemodeAdminAuthorized(readLocalAdminAuthorization());
    };

    evaluate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bullmoney_session" || e.key === "adminToken") evaluate();
    };
    const onSessionChange = () => evaluate();
    window.addEventListener("storage", onStorage);
    window.addEventListener("bullmoney_session_changed", onSessionChange);
    window.addEventListener("admin_token_changed", onSessionChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bullmoney_session_changed", onSessionChange);
      window.removeEventListener("admin_token_changed", onSessionChange);
    };
  }, []);

  const profileMatchesAdmin = useMemo(() => {
    if (!adminEmailEnv || !userProfile?.email) return false;
    return normalizeEmail(userProfile.email) === adminEmailEnv;
  }, [adminEmailEnv, userProfile?.email]);

  const isAdmin = state.isAdmin || profileMatchesAdmin || pagemodeAdminAuthorized || (adminChecked && adminAuthorized);

  return { isAdmin, adminChecked };
}
