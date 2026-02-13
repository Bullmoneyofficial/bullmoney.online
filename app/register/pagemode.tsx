"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { gsap } from 'gsap';
import dynamic from 'next/dynamic';
import {
  Check, Mail, Hash, Lock,
  ArrowRight, ChevronLeft, ExternalLink, AlertCircle,
  Copy, Plus, Eye, EyeOff, FolderPlus, Loader2, ShieldCheck, Clock, User
} from 'lucide-react';

import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { persistSession } from '@/lib/sessionPersistence';

// --- IMPORT SEPARATE LOADER COMPONENT ---
import { MultiStepLoader} from "@/components/Mainpage/MultiStepLoader";

// --- 1. SUPABASE SETUP ---
const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ MISSING SUPABASE KEYS in .env.local file");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// --- UTILS: MOBILE DETECTION HOOK ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isTouch && (window.innerWidth <= 768 || isMobileUA));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

// --- 2. GLOBAL STYLES ---
const CursorStyles = () => (
  <style jsx global>{`
    .target-cursor-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
      mix-blend-mode: difference;
      will-change: transform;
    }
    .target-cursor-dot {
      width: 8px;
      height: 8px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
    }
    .target-cursor-corner {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid white;
      will-change: transform;
    }
    .corner-tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
    .corner-tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
    .corner-br { bottom: -6px; right: -6px; border-left: none; border-top: none; }
    .corner-bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }

    body.custom-cursor-active {
      cursor: none !important;
    }

    /* Input autofill styling for white bg */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #f5f5f7 inset !important;
        -webkit-text-fill-color: #1d1d1f !important;
        transition: background-color 5000s ease-in-out 0s;
    }

    /* Scroll lock */
    body.loader-lock {
        overflow: hidden !important;
        height: 100vh !important;
        width: 100vw !important;
    }

    /* Apple-style animations */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes checkPop {
      0% { transform: scale(0); }
      70% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .apple-card {
      animation: scaleIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
    .apple-fade-up {
      animation: fadeInUp 0.6s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
    .apple-btn {
      transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
    .apple-btn:hover {
      transform: scale(1.015);
    }
    .apple-btn:active {
      transform: scale(0.985);
    }
    .apple-input {
      transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
    .apple-input:focus {
      border-color: #1d1d1f !important;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06) !important;
    }
  `}</style>
);

// --- 3. DYNAMIC CURSOR COMPONENT (GLOBAL) ---
interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

const TargetCursorComponent = memo(({
  targetSelector = 'button, a, input, [role="button"], .cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true
}: TargetCursorProps) => {
  const isMobile = useIsMobile();
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
  const spinTlRef = useRef<gsap.core.Timeline | null>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    isActive: false,
    activeStrength: { current: 0 },
    targetCornerPositions: null as { x: number; y: number }[] | null,
    tickerFn: null as (() => void) | null,
    activeTarget: null as Element | null
  });

  const moveCursor = useCallback((e: MouseEvent) => {
    if (cursorRef.current && !isMobile) {
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out', overwrite: 'auto' });
    }
  }, [isMobile]);

  const handleDown = useCallback(() => {
    const corners = cornersRef.current;
    if (dotRef.current && corners) {
      gsap.to(dotRef.current, { scale: 0.5, duration: 0.2 });
      gsap.to(corners, { scale: 1.2, borderColor: '#00ffff', duration: 0.2 });
    }
  }, []);

  const handleUp = useCallback(() => {
    const corners = cornersRef.current;
    if (dotRef.current && corners) {
      gsap.to(dotRef.current, { scale: 1, duration: 0.2 });
      gsap.to(corners, { scale: 1, borderColor: '#ffffff', duration: 0.2 });
    }
  }, []);

  useEffect(() => {
    if (!cursorRef.current || typeof window === 'undefined') return;

    if (hideDefaultCursor && !isMobile) {
      document.body.classList.add('custom-cursor-active');
    }

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner');

    let ctx = gsap.context(() => {});

    if (!isMobile) {
        ctx = gsap.context(() => {
            const corners = cornersRef.current!;

            gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

            spinTlRef.current = gsap.timeline({ repeat: -1 })
                .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

            window.addEventListener('mousemove', moveCursor, { passive: true });
            window.addEventListener('mousedown', handleDown);
            window.addEventListener('mouseup', handleUp);

            const tickerFn = () => {
                const state = stateRef.current;
                if (!state.targetCornerPositions || !cursorRef.current) return;

                const strength = state.activeStrength.current;
                if (strength === 0) {
                    if (stateRef.current.tickerFn) {
                        gsap.ticker.remove(stateRef.current.tickerFn);
                        stateRef.current.tickerFn = null;
                    }
                    return;
                }

                const cursorX = gsap.getProperty(cursor, 'x') as number;
                const cursorY = gsap.getProperty(cursor, 'y') as number;

                for(let i = 0; i < corners.length; i++) {
                    const corner = corners[i];
                    const targetPosition = state.targetCornerPositions[i];
                    if (!corner || !targetPosition) continue;
                    const currentX = gsap.getProperty(corner, 'x') as number;
                    const currentY = gsap.getProperty(corner, 'y') as number;
                    const targetX = targetPosition.x - cursorX;
                    const targetY = targetPosition.y - cursorY;

                    const finalX = currentX + (targetX - currentX) * strength;
                    const finalY = currentY + (targetY - currentY) * strength;

                    const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
                    gsap.to(corner, { x: finalX, y: finalY, duration: duration, ease: duration === 0 ? 'none' : 'power1.out', overwrite: 'auto' });
                }
            };
            stateRef.current.tickerFn = tickerFn;
            gsap.ticker.add(tickerFn);

            const handleHover = (e: MouseEvent) => {
                const target = (e.target as Element).closest(targetSelector);
                if (target && target !== stateRef.current.activeTarget) {
                    stateRef.current.activeTarget = target;
                    stateRef.current.isActive = true;
                    spinTlRef.current?.pause();
                    gsap.to(cursor, { rotation: 0, duration: 0.3 });

                    const rect = target.getBoundingClientRect();
                    const borderWidth = 3; const cornerSize = 12;

                    stateRef.current.targetCornerPositions = [
                        { x: rect.left - borderWidth, y: rect.top - borderWidth },
                        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
                        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
                        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
                    ];

                    gsap.to(stateRef.current.activeStrength, { current: 1, duration: hoverDuration, ease: 'power2.out' });

                    if (!stateRef.current.tickerFn) {
                        stateRef.current.tickerFn = tickerFn;
                        gsap.ticker.add(tickerFn);
                    }

                    const handleLeave = () => {
                        target.removeEventListener('mouseleave', handleLeave);
                        stateRef.current.activeTarget = null;
                        stateRef.current.isActive = false;
                        stateRef.current.targetCornerPositions = null;
                        gsap.to(stateRef.current.activeStrength, { current: 0, duration: 0.2, overwrite: true });

                         const positions = [
                          { x: -18, y: -18 },
                          { x: 6, y: -18 },
                          { x: 6, y: 6 },
                          { x: -18, y: 6 }
                        ];
                        corners.forEach((c, i) => {
                          const pos = positions[i];
                          if (c && pos) gsap.to(c, { x: pos.x, y: pos.y, duration: 0.3, ease: 'power3.out' });
                        });
                        spinTlRef.current?.restart();
                    };
                    target.addEventListener('mouseleave', handleLeave);
                }
            };
            window.addEventListener('mouseover', handleHover, { passive: true });
        });
    }

    return () => {
        const state = stateRef.current;
        document.body.classList.remove('custom-cursor-active');
        window.removeEventListener('mousemove', moveCursor);
        window.removeEventListener('mousedown', handleDown);
        window.removeEventListener('mouseup', handleUp);

        if(state.tickerFn) gsap.ticker.remove(state.tickerFn);
        ctx.revert();
    };
  }, [isMobile, hideDefaultCursor, spinDuration, targetSelector, hoverDuration, parallaxOn, moveCursor, handleDown, handleUp]);

  return (
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>
  );
});
TargetCursorComponent.displayName = "TargetCursorComponent";

const TargetCursor = dynamic(() => Promise.resolve(TargetCursorComponent), {
  ssr: false
});

// --- LOADING STATES DATA ---
const loadingStates = [
  { text: "INITIALIZING..." },
  { text: "RESTORING SESSION" },
  { text: "VERIFYING CREDENTIALS" },
  { text: "UNLOCKING DASHBOARD" },
  { text: "WELCOME BACK" },
];

interface RegisterPageProps {
  onUnlock: () => void;
}

export default function RegisterPage({ onUnlock }: RegisterPageProps) {
  const PENDING_BROKER_RETURN_KEY = 'bullmoney_pending_broker_return';

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState(0);
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    mt5Number: '',
    password: '',
    referralCode: ''
  });

  const [referralAttribution, setReferralAttribution] = useState({
    affiliateId: '',
    affiliateName: '',
    affiliateEmail: '',
    affiliateCode: '',
    source: '',
    medium: '',
    campaign: '',
  });

  const deepLinkStepRef = useRef<number | null>(null);
  const deepLinkBrokerRef = useRef<'Vantage' | 'XM' | null>(null);

  // Extract referral code from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      const affCode = urlParams.get('aff_code');
      const affiliateCode = (refCode || affCode || '').trim();
      const brokerParam = (urlParams.get('broker') || urlParams.get('partner') || urlParams.get('aff_broker') || '').trim().toLowerCase();
      const quickStartParam = (urlParams.get('quick_start') || urlParams.get('fast') || '').trim().toLowerCase();
      const skipToParam = (urlParams.get('skip_to') || urlParams.get('go_to') || '').trim().toLowerCase();

      const deepLinkBroker: 'Vantage' | 'XM' | null =
        brokerParam === 'xm' ? 'XM' : brokerParam === 'vantage' ? 'Vantage' : null;
      const quickStartEnabled = ['1', 'true', 'yes'].includes(quickStartParam);
      const deepLinkStep =
        skipToParam === 'broker' || skipToParam === 'step1' ? 1 :
        skipToParam === 'mt5' || skipToParam === 'id' || skipToParam === 'verify' || skipToParam === 'step2' ? 2 :
        skipToParam === 'login' || skipToParam === 'auth' || skipToParam === 'step3' ? 3 :
        affiliateCode ? (quickStartEnabled ? 2 : 1) :
        null;

      if (deepLinkBroker) {
        deepLinkBrokerRef.current = deepLinkBroker;
        setActiveBroker(deepLinkBroker);
      }

      if (deepLinkStep !== null) {
        deepLinkStepRef.current = deepLinkStep;
        setStep((prev) => Math.max(prev, deepLinkStep));
      }

      const affiliateId = (urlParams.get('aff_id') || '').trim();
      const affiliateName = (urlParams.get('aff_name') || '').trim();
      const affiliateEmail = (urlParams.get('aff_email') || '').trim();
      const source = (urlParams.get('utm_source') || '').trim();
      const medium = (urlParams.get('utm_medium') || '').trim();
      const campaign = (urlParams.get('utm_campaign') || '').trim();
      let storedContext: any = null;

      try {
        const rawStoredContext = localStorage.getItem('bullmoney_referral_context');
        if (rawStoredContext) {
          storedContext = JSON.parse(rawStoredContext);
        }
      } catch {}

      const resolvedAffiliateCode = affiliateCode || String(storedContext?.affiliateCode || '').trim();
      const resolvedAffiliateId = affiliateId || String(storedContext?.affiliateId || '').trim();
      const resolvedAffiliateName = affiliateName || String(storedContext?.affiliateName || '').trim();
      const resolvedAffiliateEmail = affiliateEmail || String(storedContext?.affiliateEmail || '').trim();
      const resolvedSource = source || String(storedContext?.source || '').trim();
      const resolvedMedium = medium || String(storedContext?.medium || '').trim();
      const resolvedCampaign = campaign || String(storedContext?.campaign || '').trim();

      if (resolvedAffiliateCode) {
        console.log('[RegisterPage] 🎯 Referral attribution detected:', {
          affiliateCode: resolvedAffiliateCode,
          affiliateId: resolvedAffiliateId,
          affiliateName: resolvedAffiliateName,
          affiliateEmail: resolvedAffiliateEmail,
        });

        setFormData(prev => ({ ...prev, referralCode: resolvedAffiliateCode }));
        setReferralAttribution({
          affiliateId: resolvedAffiliateId,
          affiliateName: resolvedAffiliateName,
          affiliateEmail: resolvedAffiliateEmail,
          affiliateCode: resolvedAffiliateCode,
          source: resolvedSource,
          medium: resolvedMedium,
          campaign: resolvedCampaign,
        });

        try {
          localStorage.setItem('bullmoney_referral_context', JSON.stringify({
            affiliateId: resolvedAffiliateId,
            affiliateName: resolvedAffiliateName,
            affiliateEmail: resolvedAffiliateEmail,
            affiliateCode: resolvedAffiliateCode,
            source: resolvedSource,
            medium: resolvedMedium,
            campaign: resolvedCampaign,
            capturedAt: new Date().toISOString(),
          }));
        } catch {}

        const clickTrackKey = `bm_ref_click_tracked_${resolvedAffiliateCode}`;
        const hasQueryCode = Boolean(affiliateCode);
        if (hasQueryCode && !sessionStorage.getItem(clickTrackKey)) {
          fetch('/api/affiliate/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              affiliateCode: resolvedAffiliateCode,
              affiliateId: resolvedAffiliateId,
              source: resolvedSource || 'affiliate',
              medium: resolvedMedium || 'dashboard',
              campaign: resolvedCampaign || 'partner_link',
            }),
          })
            .then(() => sessionStorage.setItem(clickTrackKey, '1'))
            .catch((error) => console.error('[RegisterPage] Referral click track failed:', error));
        }
      }

      if (refCode) {
        console.log('[RegisterPage] 🎯 Referral code detected from URL:', refCode);
      }
    }
  }, []);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";

  // --- DRAFT SAVER ---
  useEffect(() => {
    if (step > 0 && step < 5 && (formData.email || formData.mt5Number)) {
        const draft = {
            step,
            formData,
            activeBroker,
            timestamp: Date.now()
        };
        localStorage.setItem("bullmoney_draft", JSON.stringify(draft));
    }
  }, [step, formData, activeBroker]);

  // --- INITIAL LOAD & AUTO-LOGIN CHECK ---
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const savedSession = localStorage.getItem("bullmoney_session");

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          const { data, error } = await supabase
            .from("recruits")
            .select("id")
            .eq("id", session.id)
            .maybeSingle();

          if (!error && data && mounted) {
             console.log("Session valid, auto-unlocking...");
             localStorage.removeItem("bullmoney_draft");

             setTimeout(() => {
                 onUnlock();
             }, 2500);
             return;
          }

          if(error || !data) {
             localStorage.removeItem("bullmoney_session");
          }
        } catch (e) {
          localStorage.removeItem("bullmoney_session");
        }
      }

      const savedDraft = localStorage.getItem("bullmoney_draft");
      if (savedDraft) {
          try {
              const draft = JSON.parse(savedDraft);
              if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                  if (mounted) {
                      setFormData(prev => ({
                        ...draft.formData,
                        referralCode: prev.referralCode || draft.formData?.referralCode || '',
                      }));
                      const restoredStep = Number.isFinite(Number(draft.step)) ? Number(draft.step) : 0;
                      const targetStep = deepLinkStepRef.current !== null
                        ? Math.max(restoredStep, deepLinkStepRef.current)
                        : restoredStep;
                      setStep(targetStep);
                      setActiveBroker(deepLinkBrokerRef.current || draft.activeBroker || 'Vantage');
                  }
              }
          } catch (e) {
              localStorage.removeItem("bullmoney_draft");
          }
      }

      if (mounted) {
        setTimeout(() => { setLoading(false); }, 1500);
      }
    };

    initSession();
    return () => { mounted = false; };
  }, [onUnlock]);

  // === SCROLL LOCK/UNLOCK ===
  useEffect(() => {
    if (loading) {
      document.body.classList.add("loader-lock");
    } else {
      document.body.classList.remove("loader-lock");
    }
    return () => {
      document.body.classList.remove("loader-lock");
    };
  }, [loading]);

  const handleBrokerSwitch = (newBroker: 'Vantage' | 'XM') => {
    if (activeBroker === newBroker) return;
    setActiveBroker(newBroker);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mt5Number' && !/^\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pass: string) => pass.length >= 6;
  const isValidMT5 = (id: string) => id.length >= 5;

  const handleNext = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    SoundEffects.click();

    if (step === 0) {
      setStep(1);
    }
    else if (step === 1) {
      setStep(2);
    }
    else if (step === 2) {
      if (!isValidMT5(formData.mt5Number)) {
        setSubmitError("Please enter a valid MT5 ID (min 5 digits).");
        return;
      }
      setStep(3);
    }
    else if (step === 3) {
      if (!isValidEmail(formData.email)) {
        setSubmitError("Please enter a valid email address.");
        return;
      }
      if (!isValidPassword(formData.password)) {
        setSubmitError("Password must be at least 6 characters.");
        return;
      }
      if (!acceptedTerms) {
        setSubmitError("You must agree to the Terms & Conditions.");
        return;
      }
      handleRegisterSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      SoundEffects.click();
      setStep(step - 1);
      setSubmitError(null);
    }
  };

  const toggleViewMode = () => {
    SoundEffects.tab();
    if (viewMode === 'register') {
      setViewMode('login');
      setStep(0);
    } else {
      setViewMode('register');
      setStep(0);
    }
    setSubmitError(null);
    setLoading(false);
    setShowPassword(false);
    setAcceptedTerms(false);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  const handleBrokerClick = () => {
    try {
      sessionStorage.setItem(PENDING_BROKER_RETURN_KEY, JSON.stringify({
        broker: activeBroker,
        createdAt: Date.now(),
      }));
    } catch {}

    const link = activeBroker === 'Vantage' ? "https://vigco.co/iQbe2u" : "https://affs.click/t5wni";
    window.open(link, '_blank');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resumeAfterBrokerReturn = () => {
      try {
        const payload = sessionStorage.getItem(PENDING_BROKER_RETURN_KEY);
        if (!payload) return;

        const parsed = JSON.parse(payload);
        const createdAt = Number(parsed?.createdAt || 0);
        const isFresh = createdAt > 0 && Date.now() - createdAt < 90 * 60 * 1000;

        if (parsed?.broker === 'Vantage' || parsed?.broker === 'XM') {
          setActiveBroker(parsed.broker);
        }

        sessionStorage.removeItem(PENDING_BROKER_RETURN_KEY);
        if (!isFresh) return;

        if (viewMode === 'register' && step <= 1) {
          setStep(2);
          setSubmitError(null);
        }
      } catch {
        sessionStorage.removeItem(PENDING_BROKER_RETURN_KEY);
      }
    };

    const onFocus = () => resumeAfterBrokerReturn();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumeAfterBrokerReturn();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [step, viewMode]);

  const handleRegisterSubmit = async () => {
    setStep(4);
    setSubmitError(null);

    try {
      const res = await fetch('/api/recruit-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          mt5_id: formData.mt5Number,
          referred_by_code: formData.referralCode || null,
          referral_attribution: formData.referralCode
            ? {
                affiliate_id: referralAttribution.affiliateId || null,
                affiliate_name: referralAttribution.affiliateName || null,
                affiliate_email: referralAttribution.affiliateEmail || null,
                affiliate_code: referralAttribution.affiliateCode || formData.referralCode,
                source: referralAttribution.source || 'affiliate',
                medium: referralAttribution.medium || 'dashboard',
                campaign: referralAttribution.campaign || 'partner_link',
              }
            : null,
          used_code: true,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result?.success || !result?.recruit) {
        if (res.status === 409) {
          throw new Error('This email is already registered. Please Login.');
        }
        throw new Error(result?.error || 'Connection failed. Please check your internet.');
      }

      const newUser = result.recruit;
      persistSession({
        recruitId: newUser.id,
        email: newUser.email,
        mt5Id: newUser.mt5_id || formData.mt5Number,
        isVip: newUser.is_vip === true,
        timestamp: Date.now(),
      });

      window.dispatchEvent(new Event('bullmoney_session_changed'));
      localStorage.removeItem("bullmoney_draft");

      setTimeout(() => {
        setStep(5);
      }, 1000);

    } catch (err: any) {
      console.error("Submission Error:", err);
      if (err.code === '23505') {
        setSubmitError("This email is already registered.");
      } else {
        setSubmitError(err.message || "Connection failed. Please check your internet.");
      }
      setStep(3);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/recruit-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const result = await res.json();
      if (!res.ok || !result?.success || !result?.recruit) {
        await new Promise(r => setTimeout(r, 800));
        throw new Error(result?.error || 'Invalid email or password.');
      }

      const recruit = result.recruit;
      persistSession({
        recruitId: recruit.id,
        email: recruit.email,
        mt5Id: recruit.mt5_id,
        isVip: recruit.is_vip === true,
        timestamp: Date.now(),
      });

      localStorage.setItem("bullmoney_telegram_confirmed", "true");
      window.dispatchEvent(new Event('bullmoney_session_changed'));

      setTimeout(() => {
        setLoading(false);
        onUnlock();
      }, 1000);

    } catch (err: any) {
      setLoading(false);
      setSubmitError(err.message || "Invalid credentials.");
    }
  };

  const getStepProps = (currentStep: number) => {
    return isVantage ? { number2: currentStep } : { number: currentStep };
  };

  // --- RENDER: SUCCESS (SCREEN 5) ---
  if (step === 5 && viewMode === 'register') {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-4 relative">
        <CursorStyles />
        <TargetCursor />

        <div className="apple-card bg-white border border-[#e5e5ea] p-8 md:p-12 rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.06)] text-center max-w-md w-full relative z-10">
          <div className="mx-auto w-20 h-20 relative mb-8">
            <div className="absolute inset-0 bg-[#34c759] rounded-full flex items-center justify-center" style={{ animation: 'checkPop 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards' }}>
              <Check className="w-10 h-10 text-white stroke-[3]" style={{ animation: 'fadeIn 0.3s ease-out 0.3s forwards', opacity: 0 }} />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-2 tracking-tight">You&apos;re In</h2>
          <p className="text-[#86868b] mb-10 text-sm md:text-base">
            Your free BullMoney access is now active.
          </p>

          <button
            onClick={onUnlock}
            className="apple-btn w-full py-4 bg-[#1d1d1f] text-white rounded-2xl font-semibold tracking-wide shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-[#333336] group flex items-center justify-center mb-4 cursor-target text-base"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
            className="apple-btn text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors flex items-center justify-center gap-2 mx-auto cursor-target"
          >
            <FolderPlus className="w-4 h-4" /> Join Free Telegram
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: LOADING (SCREEN 4 AFTER SUBMIT) ---
  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center relative">
        <Loader2 className="w-12 h-12 text-[#1d1d1f] animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Setting up your account...</h2>
      </div>
    );
  }

  // --- RENDER: MAIN INTERFACE ---
  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <CursorStyles />
      <TargetCursor
        targetSelector="button, a, input, [role='button'], .cursor-target"
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
      />

      {/* Loader overlay */}
      {loading && (
          <div className="fixed inset-0 z-[99999999] w-screen h-screen bg-[#fbfbfd]">
            <MultiStepLoader loadingStates={loadingStates} loading={loading} />
          </div>
      )}

      {/* Main content */}
      <div className={cn(
        "transition-opacity duration-700 w-full max-w-lg relative z-10",
        loading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>

        {/* Header */}
        <div className="mb-8 md:mb-10 text-center apple-fade-up">
          <h1 className="text-lg md:text-xl font-semibold text-[#86868b] tracking-[0.02em]">
            BULLMONEY
          </h1>
        </div>

        {/* ================= LOGIN VIEW ================= */}
        {viewMode === 'login' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full"
          >
            <div className="apple-card bg-white border border-[#e5e5ea] p-6 md:p-10 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-1 tracking-tight">Sign In</h2>
              <p className="text-[#86868b] mb-8 text-sm">Welcome back. Enter your credentials.</p>

              <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="on">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] w-5 h-5 group-focus-within:text-[#1d1d1f] transition-colors" />
                  <input
                    autoFocus
                    type="email"
                    name="email"
                    id="login-email"
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email"
                    className="apple-input w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-12 pr-4 py-3.5 md:py-4 text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:border-[#1d1d1f] cursor-target text-base"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] w-5 h-5 group-focus-within:text-[#1d1d1f] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="login-password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="apple-input w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-12 pr-12 py-3.5 md:py-4 text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:border-[#1d1d1f] cursor-target text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#1d1d1f] transition-colors cursor-target"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {submitError && (
                  <div className="text-[#ff3b30] text-sm bg-[#ff3b30]/5 p-3.5 rounded-xl flex items-center gap-2.5 border border-[#ff3b30]/15" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!loginEmail || !loginPassword}
                  className="apple-btn w-full py-3.5 md:py-4 bg-[#1d1d1f] text-white rounded-xl font-semibold tracking-wide shadow-[0_2px_12px_rgba(0,0,0,0.12)] hover:bg-[#333336] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none cursor-target text-base"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-[#e5e5ea]">
                <button onClick={toggleViewMode} className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-target">
                  Don&apos;t have an account? <span className="font-semibold text-[#1d1d1f]">Register</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ================= REGISTER FLOW ================= */
          <>
            {/* Progress dots for steps 1-3 */}
            {step >= 1 && step <= 3 && (
              <div className="flex justify-center gap-2.5 mb-6" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                      s <= step ? "bg-[#1d1d1f] w-6" : "bg-[#d2d2d7] w-2"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Broker tabs for step 1 */}
            {step === 1 && (
              <div className="flex justify-center mb-6" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                <div className="inline-flex bg-[#f5f5f7] rounded-full p-1 border border-[#e5e5ea]">
                  {(["Vantage", "XM"] as const).map((partner) => {
                    const isActive = activeBroker === partner;
                    return (
                      <button
                        key={partner}
                        onClick={() => handleBrokerSwitch(partner)}
                        className={cn(
                          "relative px-6 py-2 rounded-full font-medium transition-all duration-300 z-20 cursor-target text-sm",
                          isActive ? "text-white" : "text-[#86868b] hover:text-[#1d1d1f]"
                        )}
                      >
                        {partner}
                        {isActive && (
                          <motion.span
                            layoutId="tab-pill"
                            className="absolute inset-0 -z-10 rounded-full bg-[#1d1d1f] shadow-sm"
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* --- STEP 0: WELCOME GATE --- */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="apple-card bg-white border border-[#e5e5ea] p-8 md:p-12 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-center">

                    <div className="mb-8 flex justify-center">
                      <div className="h-16 w-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center border border-[#e5e5ea]">
                        <ShieldCheck className="w-8 h-8 text-[#1d1d1f]" />
                      </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-3 tracking-tight">Unlock Free Access</h2>
                    <p className="text-[#86868b] text-sm md:text-base mb-10 max-w-xs mx-auto leading-relaxed">
                      Get free trading setups and community access.
                      <br />
                      <span className="text-[#aeaeb2]">No payment. Takes about 2 minutes.</span>
                    </p>

                    <button
                      onClick={handleNext}
                      className="apple-btn w-full py-4 bg-[#1d1d1f] text-white rounded-2xl font-semibold text-base tracking-wide shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-[#333336] flex items-center justify-center cursor-target"
                    >
                      Get Started <ArrowRight className="w-5 h-5 ml-2" />
                    </button>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#aeaeb2]">
                        <Lock className="w-3 h-3" /> No credit card required
                      </div>

                      <button
                        onClick={toggleViewMode}
                        className="apple-btn w-full py-3.5 rounded-2xl text-sm font-semibold transition-all border border-[#e5e5ea] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]"
                      >
                        Already a member? Sign in
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 1: OPEN ACCOUNT --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <StepCard
                    {...getStepProps(1)}
                    title="Open Free Account"
                    actions={
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-center text-[#aeaeb2] flex items-center justify-center gap-1.5">
                          <Clock className="w-3 h-3" /> Takes about 1 minute
                        </p>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => copyCode(brokerCode)}
                            className="apple-btn inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold border border-[#e5e5ea] bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ebebed] transition-all cursor-target w-full justify-center"
                          >
                            {copied ? <Check className="h-4 w-4 text-[#34c759]" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : `Copy Code: ${brokerCode}`}
                          </button>

                          <button
                            onClick={handleBrokerClick}
                            className="apple-btn w-full py-3.5 rounded-xl font-semibold text-white bg-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-[#333336] transition-all flex items-center justify-center gap-2 cursor-target text-base"
                          >
                            <span>Open Free Account</span>
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={handleNext}
                          className="apple-btn w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-[#e5e5ea] text-[#1d1d1f] bg-white hover:bg-[#f5f5f7]"
                        >
                          I already have an account
                        </button>
                      </div>
                    }
                  >
                    <p className="text-sm md:text-[15px] leading-relaxed text-[#86868b] mb-5 text-center">
                      BullMoney works with regulated brokers. <br className="hidden md:block" />
                      This free account lets us verify your access.
                    </p>

                    {/* Visual card element */}
                    <div className="relative mx-auto w-full max-w-[260px] h-32 md:h-36 rounded-2xl border border-[#e5e5ea] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] mb-2 bg-[#f5f5f7]">
                      <IconPlusCorners />
                      <div className="absolute inset-0 p-2">
                        {isVantage ? <EvervaultCardRed text="VANTAGE" /> : <EvervaultCard text="X3R7P" />}
                      </div>
                    </div>
                  </StepCard>
                </motion.div>
              )}

              {/* --- STEP 2: VERIFY ID --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <StepCard
                    {...getStepProps(2)}
                    title="Enter Your Account ID"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.mt5Number}
                        className={cn(
                          "apple-btn w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-target text-base",
                          !formData.mt5Number
                            ? "bg-[#e5e5ea] text-[#aeaeb2] cursor-not-allowed"
                            : "bg-[#1d1d1f] text-white hover:bg-[#333336] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                        )}
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    }
                  >
                    <div className="space-y-4 pt-1">
                      <p className="text-[#86868b] text-sm leading-relaxed">
                        After opening your account, you&apos;ll receive an email with your trading ID (MT5 ID).
                      </p>

                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] w-5 h-5 group-focus-within:text-[#1d1d1f] transition-colors" />
                        <input
                          autoFocus
                          type="tel"
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="Enter MT5 ID (numbers only)"
                          className="apple-input w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-12 pr-4 py-4 text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:border-[#1d1d1f] cursor-target text-base"
                        />
                      </div>
                      <p className="text-xs text-[#aeaeb2] flex items-center gap-1.5"><Lock className="w-3 h-3"/> Used only to verify access</p>
                    </div>
                  </StepCard>
                  <button onClick={handleBack} className="apple-btn mt-5 flex items-center text-[#86868b] hover:text-[#1d1d1f] text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}

              {/* --- STEP 3: CREATE LOGIN --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <StepCard
                    {...getStepProps(3)}
                    title="Create Your Login"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.email || !formData.password || !acceptedTerms}
                        className={cn(
                          "apple-btn w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-target text-base",
                          (!formData.email || !formData.password || !acceptedTerms)
                            ? "bg-[#e5e5ea] text-[#aeaeb2] cursor-not-allowed"
                            : "bg-[#1d1d1f] text-white hover:bg-[#333336] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                        )}
                      >
                        Unlock My Access <ArrowRight className="w-4 h-4" />
                      </button>
                    }
                  >
                    <p className="text-[#86868b] text-xs md:text-sm mb-5">This lets you access <span className="text-[#1d1d1f] font-medium">setups</span>, tools, and the community.</p>
                    <div className="space-y-4">
                      <div>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] w-5 h-5 group-focus-within:text-[#1d1d1f] transition-colors" />
                          <input
                            autoFocus
                            type="email"
                            name="email"
                            autoComplete="username"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                            className="apple-input w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-12 pr-4 py-3.5 text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:border-[#1d1d1f] cursor-target text-base"
                          />
                        </div>
                        <p className="text-[10px] text-[#aeaeb2] mt-1.5 ml-1">We&apos;ll send your login details here.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] w-5 h-5 group-focus-within:text-[#1d1d1f] transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password (min 6 chars)"
                            className="apple-input w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-12 pr-12 py-3.5 text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:border-[#1d1d1f] cursor-target text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#1d1d1f] transition-colors cursor-target"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-[#aeaeb2] mt-1.5 ml-1">Must be at least 6 characters.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeaeb2] w-5 h-5 group-focus-within:text-[#1d1d1f] transition-colors" />
                          <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Referral Code (Optional)"
                            className="apple-input w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-12 pr-4 py-3.5 text-[#1d1d1f] placeholder-[#aeaeb2] focus:outline-none focus:border-[#1d1d1f] cursor-target text-base"
                          />
                        </div>
                        <p className="text-[10px] text-[#aeaeb2] mt-1.5 ml-1">Leave blank if you don&apos;t have one.</p>

                        {referralAttribution.affiliateCode && (
                          <div className="mt-2.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] p-3">
                            <p className="text-[10px] text-[#86868b] font-semibold">Referral auto-filled</p>
                            <div className="mt-1 grid grid-cols-1 gap-0.5 text-[10px] text-[#86868b]">
                              <p>Code: <span className="text-[#1d1d1f] font-medium">{referralAttribution.affiliateCode}</span></p>
                              {referralAttribution.affiliateName && (
                                <p>Affiliate: <span className="text-[#1d1d1f] font-medium">{referralAttribution.affiliateName}</span></p>
                              )}
                              {referralAttribution.affiliateEmail && (
                                <p>Email: <span className="text-[#1d1d1f] font-medium">{referralAttribution.affiliateEmail}</span></p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] cursor-pointer hover:bg-[#ebebed] transition-colors cursor-target"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all duration-200 shrink-0",
                          acceptedTerms
                            ? "bg-[#1d1d1f] border-[#1d1d1f]"
                            : "border-[#d2d2d7] bg-white"
                        )}>
                          {acceptedTerms && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-[#86868b] leading-relaxed">
                            I agree to the Terms of Service and understand this is educational content.
                          </p>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="flex items-center gap-2.5 text-[#ff3b30] bg-[#ff3b30]/5 p-3.5 rounded-xl border border-[#ff3b30]/15 mt-4" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{submitError}</span>
                      </div>
                    )}
                  </StepCard>

                  <button onClick={handleBack} className="apple-btn mt-5 flex items-center text-[#86868b] hover:text-[#1d1d1f] text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StepCard = memo(({ number, number2, title, children, actions, className }: any) => {
  const useAlt = typeof number2 === "number";
  const n = useAlt ? number2 : number;
  return (
    <div className={cn(
      "apple-card group relative overflow-hidden rounded-3xl p-6 md:p-8",
      "bg-white border border-[#e5e5ea]",
      "shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
      className
    )}>
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-medium text-[#86868b]">
          Step {n} of 3
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-4 tracking-tight">{title}</h3>
      <div className="flex-1">{children}</div>
      {actions && <div className="mt-6 md:mt-8 pt-6 border-t border-[#f0f0f0]">{actions}</div>}
    </div>
  );
});
StepCard.displayName = "StepCard";

function IconPlusCorners() {
  return (
    <>
      <Plus className="absolute h-4 w-4 -top-2 -left-2 text-[#d2d2d7]" />
      <Plus className="absolute h-4 w-4 -bottom-2 -left-2 text-[#d2d2d7]" />
      <Plus className="absolute h-4 w-4 -top-2 -right-2 text-[#d2d2d7]" />
      <Plus className="absolute h-4 w-4 -bottom-2 -right-2 text-[#d2d2d7]" />
    </>
  );
}

const characters = "BULLMONEY";
const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// --- XM Card (Blue/Green) ---
export const EvervaultCard = memo(({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  useEffect(() => { setRandomString(generateRandomString(1500)); }, []);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent" onMouseMove={onMouseMove}>
      <div className="group/card rounded-2xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10">
          <div className="relative h-28 w-28 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#1d1d1f]/5 blur-md" />
            <span className="relative z-20 font-bold text-xl md:text-2xl text-[#1d1d1f] select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
EvervaultCard.displayName = "EvervaultCard";

function CardPattern({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(200px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-linear-to-r from-[#86868b]/30 to-[#1d1d1f]/20 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-multiply group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-[#aeaeb2] font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}

// --- Vantage Card (Purple) ---
export const EvervaultCardRed = memo(({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  useEffect(() => { setRandomString(generateRandomString(1500)); }, []);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent" onMouseMove={onMouseMove}>
      <div className="group/card rounded-2xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
        <CardPatternRed mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10">
          <div className="relative h-28 w-28 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#1d1d1f]/5 blur-md" />
            <span className="relative z-20 font-bold text-xl md:text-2xl text-[#1d1d1f] select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
EvervaultCardRed.displayName = "EvervaultCardRed";

function CardPatternRed({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(200px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-linear-to-r from-[#86868b]/30 to-[#1d1d1f]/20 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-multiply group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-[#aeaeb2] font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}
