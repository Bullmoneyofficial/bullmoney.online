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
import { detectBrowser } from "@/lib/browserDetection";

// --- IMPORT SEPARATE LOADER COMPONENT ---
import { MultiStepLoader} from "@/components/Mainpage/MultiStepLoader"; 

// --- IMPORT LEGAL DISCLAIMER MODAL ---
import { LegalDisclaimerModal } from "@/components/Mainpage/footer/LegalDisclaimerModal"; 

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
      
      // Also check for in-app browsers that can't handle GSAP animations well
      const browserInfo = detectBrowser();
      const isInAppBrowser = browserInfo.isInAppBrowser;
      
      setIsMobile(isInAppBrowser || (isTouch && (window.innerWidth <= 768 || isMobileUA)));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

// --- 2. INTERNAL CSS FOR GLOBAL CURSOR & SCROLL LOCK ---
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
    
    /* Input autofill styling override */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #171717 inset !important;
        -webkit-text-fill-color: white !important;
        transition: background-color 5000s ease-in-out 0s;
    }

    /* === ADDED GLOBAL SCROLL LOCK CLASS === */
    body.loader-lock {
        overflow: hidden !important;
        height: 100vh !important; /* Locks height to viewport */
        width: 100vw !important;
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

    // DESKTOP LOGIC
    if (!isMobile) {
        ctx = gsap.context(() => {
            const corners = cornersRef.current!;

            gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

            spinTlRef.current = gsap.timeline({ repeat: -1 })
                .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

            window.addEventListener('mousemove', moveCursor, { passive: true });
            window.addEventListener('mousedown', handleDown);
            window.addEventListener('mouseup', handleUp);

            // Magnetic Ticker
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


            // Hover Events
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

    // --- CLEANUP FUNCTION ---
    return () => {
        // Copy ref value to local variable at start of cleanup
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
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState(0); 
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false); 
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms'); 

  const [formData, setFormData] = useState({
    email: '',
    mt5Number: '',
    password: '',
    referralCode: ''
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";

  // --- DRAFT SAVER (Auto-Save partial progress) ---
  useEffect(() => {
    // Only save if we have data and are not logged in
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
      // 1. Check for completed session
      const savedSession = localStorage.getItem("bullmoney_session");
      
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // Verify ID exists in Supabase (async)
          const { data, error } = await supabase
            .from("recruits")
            .select("id")
            .eq("id", session.id)
            .maybeSingle();

          if (!error && data && mounted) {
             console.log("Session valid, auto-unlocking...");
             // Clear any old drafts since we are logged in
             localStorage.removeItem("bullmoney_draft");
             
             // FORCE LOADER TO PLAY FOR 2.5s EVEN ON SUCCESS
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

      // 2. DRAFT RESTORE PATH: If no session, check for partial form data
      const savedDraft = localStorage.getItem("bullmoney_draft");
      if (savedDraft) {
          try {
              const draft = JSON.parse(savedDraft);
              // Only restore if less than 24 hours old
              if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                  if (mounted) {
                      setFormData(draft.formData);
                      setStep(draft.step);
                      setActiveBroker(draft.activeBroker || 'Vantage');
                  }
              }
          } catch (e) {
              localStorage.removeItem("bullmoney_draft");
          }
      }

      // 3. DONE LOADING (If no session was found)
      if (mounted) {
        // Allow the "Initializing" text to read before showing form
        setTimeout(() => { setLoading(false); }, 1500);
      }
    };

    initSession();
    return () => { mounted = false; };
  }, [onUnlock]);


  // === ADDED SCROLL LOCK/UNLOCK EFFECT ===
  useEffect(() => {
    if (loading) {
      document.body.classList.add("loader-lock");
    } else {
      document.body.classList.remove("loader-lock");
    }
    // Cleanup ensures scroll lock is removed on unmount
    return () => {
      document.body.classList.remove("loader-lock");
    };
  }, [loading]);
  // =======================================


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

    // INTRO -> STEP 1
    if (step === 0) {
      setStep(1);
    }
    // STEP 1 -> STEP 2
    else if (step === 1) {
      setStep(2);
    }
    // STEP 2 -> STEP 3
    else if (step === 2) {
      if (!isValidMT5(formData.mt5Number)) {
        setSubmitError("Please enter a valid MT5 ID (min 5 digits).");
        return;
      }
      setStep(3);
    }
    // STEP 3 -> SUBMIT
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
      setStep(step - 1);
      setSubmitError(null);
    }
  };

  const toggleViewMode = () => {
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

  // Robust clipboard copy with fallback for production environments
  const copyCode = async (code: string) => {
    if (!code) return;
    
    try {
      // Method 1: Try modern Clipboard API (works in HTTPS)
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1100);
          return;
        } catch (clipboardErr) {
          console.warn('Clipboard API failed, trying fallback:', clipboardErr);
        }
      }

      // Method 2: Fallback using textarea (works in most environments)
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;';
      document.body.appendChild(textarea);
      
      // iOS Safari specific handling
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, textarea.value.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      } else {
        setSubmitError('Failed to copy code. Please copy manually: ' + code);
        setTimeout(() => setSubmitError(null), 3000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setSubmitError('Failed to copy code. Please copy manually: ' + code);
      setTimeout(() => setSubmitError(null), 3000);
    }
  };

  const handleBrokerClick = () => {
    const link = activeBroker === 'Vantage' ? "https://vigco.co/iQbe2u" : "https://affs.click/t5wni";
    window.open(link, '_blank');
  };

  const handleRegisterSubmit = async () => {
    setStep(4); // Loading
    setSubmitError(null);

    try {
      const { data: existingUser } = await supabase
        .from("recruits")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email is already registered. Please Login.");
      }

      const insertPayload = {
        email: formData.email,
        mt5_id: formData.mt5Number,
        password: formData.password, 
        referred_by_code: formData.referralCode || null,
        used_code: true,
      };

      const { data: newUser, error } = await supabase
        .from("recruits")
        .insert([insertPayload])
        .select()
        .single();
      
      if (error) throw error;

      if (newUser) {
        // Save persistent session (both storage keys for compatibility)
        // Include is_vip status for auto-unlocking VIP content in UltimateHub
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: newUser.id,
          email: formData.email,
          is_vip: newUser.is_vip || false,
          timestamp: Date.now()
        }));
        
        // Also save to recruit auth storage key for immediate auth context detection
        localStorage.setItem("bullmoney_recruit_auth", JSON.stringify({
          recruitId: newUser.id,
          email: formData.email
        }));
        
        // Clear draft
        localStorage.removeItem("bullmoney_draft");
      }

      setTimeout(() => {
        setStep(5); // Success
      }, 1000);

    } catch (err: any) {
      console.error("Submission Error:", err);
      if (err.code === '23505') {
        setSubmitError("This email is already registered.");
      } else {
        setSubmitError(err.message || "Connection failed. Please check your internet.");
      }
      setStep(3); // Go back to auth step
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("recruits")
        .select("id, is_vip") 
        .eq("email", loginEmail)
        .eq("password", loginPassword) 
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!data) {
        await new Promise(r => setTimeout(r, 800));
        throw new Error("Invalid email or password.");
      }

      // Save persistent session (both storage keys for compatibility)
      // Include is_vip status for auto-unlocking VIP content in UltimateHub
      localStorage.setItem("bullmoney_session", JSON.stringify({
        id: data.id,
        email: loginEmail,
        is_vip: data.is_vip || false,
        timestamp: Date.now()
      }));
      
      // Also save to recruit auth storage key for immediate auth context detection
      localStorage.setItem("bullmoney_recruit_auth", JSON.stringify({
        recruitId: data.id,
        email: loginEmail
      }));

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
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
        <CursorStyles />
        <TargetCursor />
        
        {/* Blue shimmer background like navbar */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
        </div>
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-black to-black gpu-accel" />
        
        <div className="bg-black/80 border-2 border-white/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(255, 255, 255,0.3)] text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-white rounded-full scale-0 animate-[scale-up_0.5s_ease-out_forwards_0.2s] flex items-center justify-center">
              <Check className="w-12 h-12 text-white stroke-[3] opacity-0 animate-[fade-in_0.3s_ease-out_forwards_0.6s]" />
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">You&apos;re In 🚀</h2>
          <p className="text-white/70 mb-8 text-sm md:text-base">
            Your free BullMoney access is now active.<br/>
          </p>
          
          <button 
            onClick={onUnlock}
            className="w-full py-4 bg-black border-2 border-white/60 hover:border-white text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(255, 255, 255,0.4)] hover:shadow-[0_0_35px_rgba(255, 255, 255,0.6)] group flex items-center justify-center mb-4 cursor-target relative overflow-hidden"
          >
            {/* Blue shimmer on button */}
            <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />
            <span className="relative z-10 flex items-center">
              Go to Dashboard  
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

           <button 
            onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
            className="text-sm text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto cursor-target"
          >
            <FolderPlus className="w-4 h-4" /> Join Free Telegram
          </button>
        </div>
        <style jsx global>{`
          @keyframes scale-up { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
          @keyframes fade-in { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  // --- RENDER: LOADING (SCREEN 4 AFTER SUBMIT) ---
  if (step === 4) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
        {/* Blue shimmer background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
        <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Unlocking Platform...</h2>
      </div>
    );
  }

  // --- RENDER: MAIN INTERFACE ---
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <CursorStyles />
      <TargetCursor 
        targetSelector="button, a, input, [role='button'], .cursor-target"
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
      />
      
      {/* Blue shimmer background like navbar */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute inset-[-100%] animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-5" />
      </div>
      
      {/* === FIX: HIGH Z-INDEX WRAPPER FOR LOADER === */}
      {/* This fixed container ensures the loader covers the entire viewport and overlays native browser bars. */}
      {loading && (
          <div 
             // CRITICAL: Fixed, full coverage, max z-index to overlay native browser UI
             className="fixed inset-0 z-[99999999] w-screen h-screen bg-black"
             // We render the loader component inside this wrapper
          >
            <MultiStepLoader loadingStates={loadingStates} loading={loading}  />
          </div>
      )}
      {/* =========================================== */}

      {/* RENDER CONTENT ONLY IF NOT LOADING */}
      <div className={cn(
        // Opacity transition for a smooth reveal after loading is done
        "transition-opacity duration-500 w-full max-w-xl relative z-10",
        loading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>

        {/* Existing background elements */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-500",
          isVantage ? "via-white" : "via-white"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 gpu-accel",
          isVantage ? "bg-white/10" : "bg-white/10"
        )} />

        <div className="mb-6 md:mb-8 text-center">
           <h1 className="text-xl md:text-2xl font-black text-white/50 tracking-tight">
            BULLMONEY <span className="text-white">FREE</span>
          </h1>
        </div>

        {/* ================= LOGIN VIEW ================= */}
        {viewMode === 'login' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
             <div className="bg-black/80 ring-2 ring-white/30 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(255, 255, 255,0.2)] relative overflow-hidden">
                {/* Blue shimmer overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <span className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
                </div>
                
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Lock className="w-32 h-32 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Member Login</h2>
                <p className="text-white/60 mb-6 relative z-10 text-sm md:text-base">Sign in to access the platform.</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10" autoComplete="on">
                   <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                      <input
                        autoFocus
                        type="email"
                        name="email"
                        id="login-email"
                        autoComplete="username"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-black/60 border-2 border-white/30 rounded-xl pl-10 pr-4 py-3.5 md:py-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all cursor-target text-base"
                      />
                    </div>

                   <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="login-password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-black/60 border-2 border-white/30 rounded-xl pl-10 pr-12 py-3.5 md:py-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all cursor-target text-base"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-target"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {submitError && (
                      <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
                        <AlertCircle className="w-4 h-4" /> {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!loginEmail || !loginPassword}
                      className="w-full py-3.5 md:py-4 bg-black border-2 border-white/60 hover:border-white text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-target text-base relative overflow-hidden"
                    >
                      {/* Blue shimmer */}
                      <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />
                      <span className="relative z-10 flex items-center gap-2">
                        LOGIN
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-white/20 pt-4">
                  <button onClick={toggleViewMode} className="text-sm text-white/60 hover:text-white transition-colors cursor-target">
                    Don&apos;t have a password? <span className="underline text-white">Register Now</span>
                  </button>
                </div>
             </div>
          </motion.div>
        ) : (
          /* ================= UNLOCK FLOW VIEW ================= */
          <>
            {step === 1 && (
              <div className="flex justify-center gap-3 mb-8">
                {(["Vantage", "XM"] as const).map((partner) => {
                  const isActive = activeBroker === partner;
                  return (
                    <button
                      key={partner}
                      onClick={() => handleBrokerSwitch(partner)}
                      className={cn(
                        "relative px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 cursor-target text-sm md:text-base",
                        isActive ? "text-white" : "bg-black/60 border-2 border-white/20 text-white/60 hover:border-white/40"
                      )}
                    >
                      {partner}
                      {isActive && (
                        <motion.span
                          layoutId="tab-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-black border-2 border-white/60 shadow-[0_0_25px_rgba(255, 255, 255,0.4)]"
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
                
              {/* --- SCREEN 1: ENTRY GATE (Step 0) --- */}
              {step === 0 && (
                 <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                 >
                   <div className="bg-black/80 ring-2 ring-white/30 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(255, 255, 255,0.2)] relative overflow-hidden text-center">
                      {/* Blue shimmer overlay */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        <span className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
                      </div>
                      
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Lock className="w-32 h-32 text-white" />
                      </div>

                      <div className="mb-6 flex justify-center">
                         <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center border-2 border-white/40 shadow-[0_0_30px_rgba(255, 255, 255,0.3)]">
                            <ShieldCheck className="w-8 h-8 text-white" />
                         </div>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Unlock Free BullMoney Access</h2>
                      <p className="text-white/70 text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed">
                        Get free trading setups and community access. <br/>
                        <span className="text-white/40">No payment. Takes about 2 minutes.</span>
                      </p>

                      <motion.button 
                        onClick={handleNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 md:py-4 bg-black border-2 border-white/60 hover:border-white text-white rounded-xl font-bold text-base md:text-lg tracking-wide transition-all shadow-[0_0_25px_rgba(255, 255, 255,0.4)] hover:shadow-[0_0_35px_rgba(255, 255, 255,0.6)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-target text-base relative overflow-hidden"
                      >
                        Get Started
                      </motion.button>

                      <div className="flex flex-col items-center justify-center gap-3">
                           {/* COPY CODE BUTTON */}
                          <button
                            onClick={() => copyCode(brokerCode)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ring-2 ring-inset transition cursor-target w-full justify-center mb-1 text-white ring-white/40 hover:bg-white/10"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : `Copy Code: ${brokerCode}`}
                          </button>

                           {/* EXTERNAL LINK BUTTON */}
                          <button
                            onClick={handleBrokerClick}
                            className="w-full py-3.5 rounded-xl font-bold text-white shadow transition flex items-center justify-center gap-2 cursor-target text-base bg-black border-2 border-white/60 hover:border-white shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)] relative overflow-hidden"
                          >
                            <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />
                            <span className="relative z-10 flex items-center gap-2">
                              Open Free Account
                              <ExternalLink className="h-4 w-4" />
                            </span>
                          </button>
                        </div>
                        
                        {/* DYNAMIC SECONDARY BUTTON FOR "ALREADY HAVE ACCOUNT" */}
                        <button 
                            onClick={handleNext}
                            className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 mt-1 border-white/30 text-white bg-black/60 hover:bg-white/10/30 hover:border-white/50"
                        >
                            I already have an account
                        </button>
                      </div>
                    }
                  >
                    <p className="text-sm md:text-[15px] leading-relaxed text-white/70 mb-4 text-center">
                      BullMoney works with regulated brokers. <br className="hidden md:block" />
                      This free account lets us verify your access.
                    </p>
                    
                    {/* VISUAL ELEMENT (CARD) */}
                    <div className="relative mx-auto w-full max-w-[280px] h-32 md:h-40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl mb-2 opacity-80 hover:opacity-100 transition-opacity">
                      <IconPlusCorners />
                      <div className="absolute inset-0 p-2">
                        {isVantage ? <EvervaultCardRed text="VANTAGE" /> : <EvervaultCard text="X3R7P" />}
                      </div>
                    </div>

                  </StepCard>
                </motion.div>
              )}

              {/* --- SCREEN 3: VERIFY ID (Step 2) --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepCard
                    {...getStepProps(2)}
                    title="Confirm Your Account ID"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.mt5Number}
                        className={cn(
                          "w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target text-base relative overflow-hidden",
                          !formData.mt5Number 
                            ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-white/20 text-white/50" 
                            : "bg-black border-2 border-white/60 text-white shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:border-white hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)]"
                        )}
                      >
                        {formData.mt5Number && <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />}
                        <span className="relative z-10 flex items-center gap-2">
                          Continue <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    }
                  >
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                          <p className="text-slate-300 text-sm">After opening your account, you’ll receive an email with your trading ID (MT5 ID).</p>
                      </div>
                      
                      <div className="relative group">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                        <input
                          autoFocus
                          type="tel" // optimized for mobile number pad
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="Enter MT5 ID (numbers only)"
                          className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target text-base"
                        />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3"/> Used only to verify access</p>
                    </div>
                  </StepCard>
                  <button onClick={handleBack} className="mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}

              {/* --- SCREEN 4: CREATE LOGIN (Step 3) --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepCard
                    {...getStepProps(3)}
                    title="Create BullMoney Login"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.email || !formData.password || !acceptedTerms}
                        className={cn(
                          "w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target text-base relative overflow-hidden",
                          (!formData.email || !formData.password || !acceptedTerms) 
                            ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-white/20 text-white/50" 
                            : "bg-black border-2 border-white/60 text-white shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:border-white hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)]"
                        )}
                      >
                        {(formData.email && formData.password && acceptedTerms) && <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />}
                        <span className="relative z-10 flex items-center gap-2">
                          Unlock My Access <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    }
                  >
                     <p className="text-white/60 text-xs md:text-sm mb-4">This lets you access <span className="text-white font-medium">setups</span>, tools, and the community.</p>
                    <div className="space-y-4 pt-1">
                      <div>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                          <input
                            autoFocus
                            type="email"
                            name="email"
                            autoComplete="username" // Enables browser autofill
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                            className="w-full bg-black/60 border-2 border-white/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all cursor-target text-base"
                          />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 ml-1">We&apos;ll send your login details here.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password" // Enables browser to save this password
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password (min 6 chars)"
                            className="w-full bg-black/60 border-2 border-white/30 rounded-lg pl-10 pr-12 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all cursor-target text-base"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-target"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 ml-1">Must be at least 6 characters.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                          <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Referral Code (Optional)"
                            className="w-full bg-black/60 border-2 border-white/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all cursor-target text-base"
                          />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 ml-1">Leave blank if you don&apos;t have one.</p>
                      </div>

                        <div 
                        className="flex items-start gap-3 p-3 rounded-lg border-2 border-white/20 bg-black/60 cursor-pointer hover:bg-white/10/30 hover:border-white/30 transition-colors cursor-target"
                      >
                        <div 
                          onClick={() => setAcceptedTerms(!acceptedTerms)}
                          className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors shrink-0 cursor-pointer",
                          acceptedTerms 
                            ? "bg-white border-white" 
                            : "border-white/40"
                        )}>
                          {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/70 leading-tight">
                            I agree to the{' '}
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLegalModalTab('terms'); setIsLegalModalOpen(true); }}
                              className="text-white hover:text-white underline underline-offset-2 transition-colors"
                            >
                              Terms of Service
                            </button>
                            {', '}
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLegalModalTab('privacy'); setIsLegalModalOpen(true); }}
                              className="text-white hover:text-white underline underline-offset-2 transition-colors"
                            >
                              Privacy Policy
                            </button>
                            {', and '}
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLegalModalTab('disclaimer'); setIsLegalModalOpen(true); }}
                              className="text-white hover:text-white underline underline-offset-2 transition-colors"
                            >
                              Financial Disclaimer
                            </button>
                            . I understand this is educational content only and NOT financial advice.
                          </p>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/50 mt-4 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{submitError}</span>
                      </div>
                    )}
                  </StepCard>

                  <button onClick={handleBack} className="mt-4 flex items-center text-white/50 hover:text-white text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      
      {/* Legal Disclaimer Modal */}
      <LegalDisclaimerModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        initialTab={legalModalTab}
      />
    </div>
  );
}

// --- SUB-COMPONENTS (MEMOIZED CARDS) ---

const StepCard = memo(({ number, number2, title, children, actions, className }: any) => {
  const useRed = typeof number2 === "number";
  const n = useRed ? number2 : number;
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-6 md:p-8",
      "bg-black/80 ring-2 ring-white/30 backdrop-blur-xl",
      "shadow-[0_0_40px_rgba(255, 255, 255,0.2)]",
      className
    )}>
      {/* Blue shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
      </div>
      
      <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l blur-2xl from-white/20 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-2 text-white/90 ring-white/30 bg-black/60">
          Step {n} of 3
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4">{title}</h3>
      <div className="flex-1">{children}</div>
      {actions && <div className="mt-6 md:mt-8 pt-6 border-t border-white/20">{actions}</div>}
    </div>
  );
});
StepCard.displayName = "StepCard";

function IconPlusCorners() {
  return (
    <>
      <Plus className="absolute h-4 w-4 -top-2 -left-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -bottom-2 -left-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -top-2 -right-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -bottom-2 -right-2 text-white/70" />
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
      <div className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10">
          <div className="relative h-32 w-32 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
            <span className="relative z-20 font-extrabold text-2xl md:text-3xl text-white select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
EvervaultCard.displayName = "EvervaultCard";

function CardPattern({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-gradient-to-r from-white to-white opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-white font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
};

// --- Vantage Card (Red/Purple) ---
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
      <div className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
        <CardPatternRed mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10">
          <div className="relative h-32 w-32 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
            <span className="relative z-20 font-extrabold text-2xl md:text-3xl text-white select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
EvervaultCardRed.displayName = "EvervaultCardRed";

function CardPatternRed({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-gradient-to-r from-white to-white opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-white/90 font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}
