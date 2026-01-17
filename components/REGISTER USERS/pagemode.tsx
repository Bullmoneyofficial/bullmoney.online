"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from 'react';
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

// --- UNIFIED SHIMMER SYSTEM ---
import { ShimmerLine, ShimmerBorder, ShimmerSpinner, ShimmerRadialGlow } from '@/components/ui/UnifiedShimmer';

// --- UI STATE CONTEXT ---
import { useUIState } from "@/contexts/UIStateContext";

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

// --- 2. INTERNAL CSS FOR SCROLL LOCK & SHIMMER ANIMATION ---
const GlobalStyles = () => (
  <style jsx global>{`
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
        height: 100vh !important;
        height: 100dvh !important; /* Dynamic viewport height for mobile Safari */
        width: 100vw !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
    }

    /* === SHIMMER ANIMATIONS - Using unified system from UnifiedShimmer.tsx === */
    /* These are fallback styles - prefer using ShimmerLine component directly */
    
    .shimmer-ltr {
      position: relative;
      overflow: hidden;
    }

    .shimmer-ltr::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(59, 130, 246, 0.15) 25%,
        rgba(59, 130, 246, 0.3) 50%,
        rgba(59, 130, 246, 0.15) 75%,
        transparent 100%
      );
      animation: unified-shimmer-ltr 2.5s ease-in-out infinite;
      pointer-events: none;
      z-index: 1;
      will-change: transform;
      transform: translateZ(0);
    }

    .shimmer-text {
      background: linear-gradient(
        90deg,
        #60a5fa 0%,
        #93c5fd 25%,
        #dbeafe 50%,
        #93c5fd 75%,
        #60a5fa 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer-text 3s ease-in-out infinite;
      will-change: background-position;
    }
    
    @keyframes shimmer-text {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    /* FPS-aware quality control integration */
    html.shimmer-quality-low .shimmer-ltr::before,
    html.shimmer-quality-disabled .shimmer-ltr::before {
      animation: none !important;
    }
    
    html.shimmer-quality-low .shimmer-text {
      animation-duration: 6s;
    }
    
    html.is-scrolling .shimmer-ltr::before {
      animation-play-state: paused;
    }

    /* === MOBILE VIEWPORT FIXES FOR SAFARI & IN-APP BROWSERS === */
    .register-container {
      min-height: 100vh;
      min-height: 100dvh; /* Dynamic viewport for iOS Safari */
      min-height: -webkit-fill-available;
      height: auto;
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    /* Fix for iOS Safari address bar */
    @supports (-webkit-touch-callout: none) {
      .register-container {
        min-height: -webkit-fill-available;
      }
    }

    /* Safe area insets for notched devices */
    .register-container {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }

    /* Fix viewport units on mobile */
    @supports (height: 100dvh) {
      .register-container {
        min-height: 100dvh;
      }
    }

    /* In-app browser fixes */
    .register-card {
      max-height: calc(100vh - 60px);
      max-height: calc(100dvh - 60px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Prevent zoom on input focus in iOS */
    @media screen and (max-width: 768px) {
      input, select, textarea {
        font-size: 16px !important;
      }
    }
  `}</style>
);

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

  const [formData, setFormData] = useState({
    email: '',
    mt5Number: '',
    password: '',
    referralCode: ''
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // --- UI STATE CONTEXT: Signal to minimize audio widget when pagemode is active ---
  const { setPagemodeOpen } = useUIState();
  
  // Use useLayoutEffect to set state BEFORE browser paint - ensures AudioWidget sees it on first render
  useLayoutEffect(() => {
    // Open the pagemode state to signal audio widget to hide
    // Use SYNCHRONOUS layout effect so AudioWidget sees this on initial render
    setPagemodeOpen(true);
    
    // Cleanup: close the pagemode state when component unmounts
    return () => {
      setPagemodeOpen(false);
    };
  }, [setPagemodeOpen]);
  
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

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
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
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: newUser.id,
          email: formData.email,
          mt5_id: formData.mt5Number, // Save MT5 ID for affiliate modal persistence
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
        .select("id, mt5_id") 
        .eq("email", loginEmail)
        .eq("password", loginPassword) 
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!data) {
        await new Promise(r => setTimeout(r, 800));
        throw new Error("Invalid email or password.");
      }

      // Save persistent session (both storage keys for compatibility)
      localStorage.setItem("bullmoney_session", JSON.stringify({
        id: data.id,
        email: loginEmail,
        mt5_id: data.mt5_id, // Save MT5 ID for affiliate modal persistence
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
      <div className="register-container bg-black flex items-center justify-center p-4 relative">
        <GlobalStyles />
        
        {/* Blue shimmer background - left to right */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 shimmer-ltr opacity-20" />
        </div>
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black gpu-accel" />
        
        <div className="register-card bg-black/80 border-2 border-blue-500/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          {/* Shimmer overlay effect */}
          <div className="absolute inset-0 shimmer-ltr opacity-10 pointer-events-none rounded-2xl" />
          
          <div className="mx-auto w-20 h-20 md:w-24 md:h-24 relative mb-5 md:mb-6 z-10">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-blue-500 rounded-full scale-0 animate-[scale-up_0.5s_ease-out_forwards_0.2s] flex items-center justify-center">
              <Check className="w-10 h-10 md:w-12 md:h-12 text-white stroke-[3] opacity-0 animate-[fade-in_0.3s_ease-out_forwards_0.6s]" />
            </div>
          </div>
          
          <h2 className="text-xl md:text-3xl font-bold shimmer-text mb-2 relative z-10">You&apos;re In 🚀</h2>
          <p className="text-blue-200/70 mb-6 md:mb-8 text-sm md:text-base relative z-10">
            Your free BullMoney access is now active.<br/>
          </p>
          
          <button 
            onClick={onUnlock}
            className="relative z-10 w-full py-3.5 md:py-4 bg-black border-2 border-blue-500/60 hover:border-blue-400 text-blue-400 rounded-xl font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] group flex items-center justify-center mb-4 cursor-target overflow-hidden"
          >
            <span className="relative z-20 flex items-center shimmer-text">
              Go to Dashboard  
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

           <button 
            onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
            className="relative z-10 text-sm text-blue-400/60 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 mx-auto cursor-target"
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
      <div className="register-container bg-black flex flex-col items-center justify-center relative">
        <GlobalStyles />
        {/* Blue shimmer background - left to right */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 shimmer-ltr opacity-30" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        <Loader2 className="w-14 h-14 md:w-16 md:h-16 text-blue-500 animate-spin mb-4" />
        <h2 className="text-lg md:text-xl font-bold shimmer-text">Unlocking Platform...</h2>
      </div>
    );
  }

  // --- RENDER: MAIN INTERFACE ---
  return (
    <div className="register-container bg-black flex flex-col items-center justify-center px-4 py-6 md:p-4 relative overflow-x-hidden font-sans">
      <GlobalStyles />
      
      {/* Blue shimmer background - left to right */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 shimmer-ltr opacity-10" />
      </div>
      
      {/* === FIX: HIGH Z-INDEX WRAPPER FOR LOADER === */}
      {/* This fixed container ensures the loader covers the entire viewport and overlays native browser bars. */}
      {loading && (
          <div 
             // CRITICAL: Fixed, full coverage, max z-index to overlay native browser UI
             className="fixed inset-0 z-[99999999] w-screen bg-black"
             style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}
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
          isVantage ? "via-purple-900" : "via-blue-900"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 gpu-accel",
          isVantage ? "bg-purple-900/10" : "bg-blue-900/10"
        )} />

        <div className="mb-5 md:mb-8 text-center">
           <h1 className="text-lg md:text-2xl font-black shimmer-text tracking-tight">
            BULLMONEY <span className="text-blue-500">FREE</span>
          </h1>
        </div>

        {/* ================= LOGIN VIEW ================= */}
        {viewMode === 'login' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
             <div className="register-card bg-black/80 ring-2 ring-blue-500/30 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] relative overflow-hidden">
                {/* Shimmer overlay effect */}
                <div className="absolute inset-0 shimmer-ltr opacity-10 pointer-events-none" />
                
                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 z-0">
                    <Lock className="w-24 h-24 md:w-32 md:h-32 text-blue-400" />
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold shimmer-text mb-2 relative z-10">Member Login</h2>
                <p className="text-blue-200/60 mb-5 md:mb-6 relative z-10 text-sm md:text-base">Sign in to access the platform.</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10" autoComplete="on">
                   <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        autoFocus
                        type="email"
                        name="email"
                        id="login-email"
                        autoComplete="username"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-black/60 border-2 border-blue-500/30 rounded-xl pl-10 pr-4 py-3 md:py-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-target text-base"
                      />
                    </div>

                   <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="login-password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-black/60 border-2 border-blue-500/30 rounded-xl pl-10 pr-12 py-3 md:py-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-target text-base"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/50 hover:text-blue-400 transition-colors cursor-target"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {submitError && (
                      <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!loginEmail || !loginPassword}
                      className="relative z-10 w-full py-3 md:py-4 bg-black border-2 border-blue-500/60 hover:border-blue-400 text-blue-400 rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-target text-base overflow-hidden"
                    >
                      <span className="relative z-20 flex items-center gap-2 shimmer-text">
                        LOGIN
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                </form>

                <div className="mt-5 md:mt-6 text-center border-t border-blue-500/20 pt-4">
                  <button onClick={toggleViewMode} className="text-sm text-blue-300/60 hover:text-blue-300 transition-colors cursor-target">
                    Don&apos;t have a password? <span className="underline text-blue-400">Register Now</span>
                  </button>
                </div>
             </div>
          </motion.div>
        ) : (
          /* ================= UNLOCK FLOW VIEW ================= */
          <>
            {step === 1 && (
              <div className="flex justify-center gap-2 md:gap-3 mb-6 md:mb-8">
                {(["Vantage", "XM"] as const).map((partner) => {
                  const isActive = activeBroker === partner;
                  return (
                    <button
                      key={partner}
                      onClick={() => handleBrokerSwitch(partner)}
                      className={cn(
                        "relative px-5 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 cursor-target text-sm md:text-base",
                        isActive ? "shimmer-text" : "bg-black/60 border-2 border-blue-500/20 text-blue-300/60 hover:border-blue-500/40"
                      )}
                    >
                      {partner}
                      {isActive && (
                        <motion.span
                          layoutId="tab-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-black border-2 border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.4)]"
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
                   <div className="register-card bg-black/80 ring-2 ring-blue-500/30 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] relative overflow-hidden text-center">
                      {/* Shimmer overlay effect */}
                      <div className="absolute inset-0 shimmer-ltr opacity-10 pointer-events-none" />
                      
                      <div className="absolute top-0 right-0 p-3 md:p-4 opacity-5 z-0">
                        <Lock className="w-24 h-24 md:w-32 md:h-32 text-blue-400" />
                      </div>

                      <div className="mb-5 md:mb-6 flex justify-center">
                         <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-black flex items-center justify-center border-2 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                            <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-blue-400" />
                         </div>
                      </div>

                      <h2 className="text-xl md:text-3xl font-extrabold shimmer-text mb-3 relative z-10">Unlock Free BullMoney Access</h2>
                      <p className="text-blue-200/70 text-sm md:text-base mb-6 md:mb-8 max-w-sm mx-auto leading-relaxed relative z-10">
                        Get free trading setups and community access. <br/>
                        <span className="text-blue-300/40">No payment. Takes about 2 minutes.</span>
                      </p>

                      <motion.button 
                        onClick={handleNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative z-10 w-full py-3 md:py-4 bg-black border-2 border-blue-500/60 hover:border-blue-400 text-blue-400 rounded-xl font-bold text-base md:text-lg tracking-wide transition-all shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] flex items-center justify-center cursor-target overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center shimmer-text">
                          Start Free Access <ArrowRight className="w-5 h-5 ml-2" />
                        </span>
                      </motion.button>
                      
                      <div className="mt-4 space-y-3 relative z-10">
                         <div className="flex items-center justify-center gap-2 text-xs text-blue-400/40">
                             <Lock className="w-3 h-3" /> No credit card required
                         </div>

                         {/* DYNAMIC BUTTON FOR EXISTING USERS */}
                         <motion.button 
                           onClick={toggleViewMode}
                           whileHover={{ scale: 1.01 }}
                           className="w-full py-3 rounded-lg text-sm font-semibold transition-all border-2 border-blue-500/20 mt-2 bg-black/60 text-blue-300/80 hover:bg-blue-950/30 hover:border-blue-500/40"
                         >
                            Already a member? Login here
                         </motion.button>
                      </div>
                   </div>
                 </motion.div>
              )}

              {/* --- SCREEN 2: OPEN ACCOUNT (Step 1) --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepCard
                    {...getStepProps(1)}
                    title="Open Free Account"
                    className="bg-black/80 register-card"
                    actions={
                      <div className="flex flex-col gap-2 md:gap-4">
                        <p className="text-xs text-center text-blue-300/50 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" /> Takes about 1 minute • No deposit required
                        </p>
                        
                        <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
                           {/* COPY CODE BUTTON */}
                          <button
                            onClick={() => copyCode(brokerCode)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 md:py-3 text-sm font-semibold ring-2 ring-inset transition cursor-target w-full justify-center mb-1 text-blue-300 ring-blue-500/40 hover:bg-blue-500/10"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="shimmer-text">{copied ? "Copied" : `Copy Code: ${brokerCode}`}</span>
                          </button>

                           {/* EXTERNAL LINK BUTTON */}
                          <button
                            onClick={handleBrokerClick}
                            className="w-full py-3 md:py-3.5 rounded-xl font-bold text-blue-400 shadow transition flex items-center justify-center gap-2 cursor-target text-base bg-black border-2 border-blue-500/60 hover:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] relative overflow-hidden"
                          >
                            <span className="relative z-10 flex items-center gap-2 shimmer-text">
                              Open Free Account
                              <ExternalLink className="h-4 w-4" />
                            </span>
                          </button>
                        </div>
                        
                        {/* DYNAMIC SECONDARY BUTTON FOR "ALREADY HAVE ACCOUNT" */}
                        <button 
                            onClick={handleNext}
                            className="w-full py-2.5 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 mt-1 border-blue-500/30 text-blue-300 bg-black/60 hover:bg-blue-950/30 hover:border-blue-500/50"
                        >
                            I already have an account
                        </button>
                      </div>
                    }
                  >
                    <p className="text-sm md:text-[15px] leading-relaxed text-blue-200/70 mb-4 text-center">
                      BullMoney works with regulated brokers. <br className="hidden md:block" />
                      This free account lets us verify your access.
                    </p>
                    
                    {/* VISUAL ELEMENT (CARD) */}
                    <div className="relative mx-auto w-full max-w-[240px] md:max-w-[280px] h-28 md:h-40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl mb-2 opacity-80 hover:opacity-100 transition-opacity">
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepCard
                    {...getStepProps(2)}
                    title="Confirm Your Account ID"
                    className="register-card"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.mt5Number}
                        className={cn(
                          "w-full py-3 md:py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target text-base relative overflow-hidden",
                          !formData.mt5Number 
                            ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-blue-500/20 text-blue-300/50" 
                            : "bg-black border-2 border-blue-500/60 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        )}
                      >
                        <span className={cn("relative z-10 flex items-center gap-2", formData.mt5Number && "shimmer-text")}>
                          Continue <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    }
                  >
                    <div className="space-y-3 md:space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                          <p className="text-slate-300 text-sm">After opening your account, you’ll receive an email with your trading ID (MT5 ID).</p>
                      </div>
                      
                      <div className="relative group">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                        <input
                          autoFocus
                          type="tel"
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="Enter MT5 ID (numbers only)"
                          className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3.5 md:py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target text-base"
                        />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3"/> Used only to verify access</p>
                    </div>
                  </StepCard>
                  <button onClick={handleBack} className="mt-3 md:mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}

              {/* --- SCREEN 4: CREATE LOGIN (Step 3) --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepCard
                    {...getStepProps(3)}
                    title="Create BullMoney Login"
                    className="register-card"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.email || !formData.password || !acceptedTerms}
                        className={cn(
                          "w-full py-3 md:py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target text-base relative overflow-hidden",
                          (!formData.email || !formData.password || !acceptedTerms) 
                            ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-blue-500/20 text-blue-300/50" 
                            : "bg-black border-2 border-blue-500/60 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        )}
                      >
                        <span className={cn("relative z-10 flex items-center gap-2", (formData.email && formData.password && acceptedTerms) && "shimmer-text")}>
                          Unlock My Access <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    }
                  >
                     <p className="text-blue-200/60 text-xs md:text-sm mb-3 md:mb-4">This lets you access <span className="shimmer-text font-medium">setups</span>, tools, and the community.</p>
                    <div className="space-y-3 md:space-y-4 pt-1">
                      <div>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            autoFocus
                            type="email"
                            name="email"
                            autoComplete="username" // Enables browser autofill
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                            className="w-full bg-black/60 border-2 border-blue-500/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-target text-base"
                          />
                        </div>
                        <p className="text-[10px] text-blue-300/40 mt-1 ml-1">We&apos;ll send your login details here.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password" // Enables browser to save this password
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password (min 6 chars)"
                            className="w-full bg-black/60 border-2 border-blue-500/30 rounded-lg pl-10 pr-12 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-target text-base"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/50 hover:text-blue-400 transition-colors cursor-target"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-blue-300/40 mt-1 ml-1">Must be at least 6 characters.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Referral Code (Optional)"
                            className="w-full bg-black/60 border-2 border-blue-500/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-target text-base"
                          />
                        </div>
                        <p className="text-[10px] text-blue-300/40 mt-1 ml-1">Leave blank if you don&apos;t have one.</p>
                      </div>

                        <div 
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        className="flex items-start gap-3 p-3 rounded-lg border-2 border-blue-500/20 bg-black/60 cursor-pointer hover:bg-blue-950/30 hover:border-blue-500/30 transition-colors cursor-target"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors shrink-0",
                          acceptedTerms 
                            ? "bg-blue-600 border-blue-600" 
                            : "border-blue-500/40"
                        )}>
                          {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-200/70 leading-tight">
                            I agree to the Terms of Service and understand this is educational content.
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

                  <button onClick={handleBack} className="mt-3 md:mt-4 flex items-center text-blue-300/50 hover:text-blue-300 text-sm mx-auto transition-colors cursor-target">
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

// --- SUB-COMPONENTS (MEMOIZED CARDS) ---

const StepCard = memo(({ number, number2, title, children, actions, className }: any) => {
  const useRed = typeof number2 === "number";
  const n = useRed ? number2 : number;
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-5 md:p-8",
      "bg-black/80 ring-2 ring-blue-500/30 backdrop-blur-xl",
      "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
      className
    )}>
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 shimmer-ltr opacity-10 pointer-events-none rounded-2xl" />
      
      <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l blur-2xl from-blue-500/20 via-blue-500/10 to-transparent z-0" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-blue-500/10 z-0" />
      <div className="flex items-center justify-between mb-3 md:mb-6 relative z-10">
        <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-2 text-blue-300/90 ring-blue-500/30 bg-black/60">
          <span className="shimmer-text">Step {n} of 3</span>
        </span>
      </div>
      <h3 className="text-lg md:text-2xl font-extrabold shimmer-text mb-3 md:mb-4 relative z-10">{title}</h3>
      <div className="flex-1 relative z-10">{children}</div>
      {actions && <div className="mt-5 md:mt-8 pt-5 md:pt-6 border-t border-blue-500/20 relative z-10">{actions}</div>}
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
      <motion.div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
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
      <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-600 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-violet-100/90 font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}
