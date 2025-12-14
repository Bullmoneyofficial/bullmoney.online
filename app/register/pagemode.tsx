"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { gsap } from 'gsap';
import dynamic from 'next/dynamic';
import { 
  Check, Mail, Hash, Lock, 
  ArrowRight, ChevronLeft, ExternalLink, AlertCircle,
  Copy, Plus, LogIn, Eye, EyeOff, HelpCircle, FolderPlus, Loader2
} from 'lucide-react';

import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

// --- IMPORT SEPARATE LOADER COMPONENT ---
// ADJUST THIS PATH:
import { MultiStepLoader } from "@/components/Mainpage/MultiStepLoader"; 

// --- 1. SUPABASE SETUP ---
const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ MISSING SUPABASE KEYS in .env.local file");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// --- UTILS: MOBILE DETECTION HOOK ---
// Kept here because the main Page Cursor uses it
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

// --- 2. INTERNAL CSS FOR GLOBAL CURSOR ---
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
                    const currentX = gsap.getProperty(corner, 'x') as number;
                    const currentY = gsap.getProperty(corner, 'y') as number;
                    const targetX = state.targetCornerPositions[i].x - cursorX;
                    const targetY = state.targetCornerPositions[i].y - cursorY;

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
                        corners.forEach((c, i) => gsap.to(c, { x: positions[i].x, y: positions[i].y, duration: 0.3, ease: 'power3.out' }));
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
        document.body.classList.remove('custom-cursor-active');
        window.removeEventListener('mousemove', moveCursor);
        window.removeEventListener('mousedown', handleDown);
        window.removeEventListener('mouseup', handleUp);
        
        if(stateRef.current.tickerFn) gsap.ticker.remove(stateRef.current.tickerFn);
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

const TargetCursor = dynamic(() => Promise.resolve(TargetCursorComponent), { 
  ssr: false 
});

// --- LOADING STATES DATA ---
const loadingStates = [
  { text: "INITIALIZING QUANTUM LINK" },
  { text: "SYNCING BLOCKCHAIN NODES" },
  { text: "VERIFYING BIOMETRIC HASH" },
  { text: "ENCRYPTING DATA STREAM" },
  { text: "ACCESS GRANTED // WELCOME" },
];

interface RegisterPageProps {
  onUnlock: () => void;
}

export default function RegisterPage({ onUnlock }: RegisterPageProps) {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState(1); 
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
  
  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";

  // --- INITIAL LOAD & AUTO-LOGIN CHECK ---
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      setLoading(true);
      const savedSession = localStorage.getItem("bullmoney_session");

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // REAL DB CHECK
          const { data, error } = await supabase
            .from("recruits")
            .select("id")
            .eq("id", session.id)
            .maybeSingle();

          if (error) throw error;

          if (data && mounted) {
            setTimeout(() => { onUnlock(); }, 3500); 
            return; 
          } else {
            localStorage.removeItem("bullmoney_session");
          }
        } catch (e) {
          console.error("Session check failed:", e);
          localStorage.removeItem("bullmoney_session");
        }
      }

      if (mounted) {
        setTimeout(() => { setLoading(false); }, 4000);
      }
    };

    initSession();
    return () => { mounted = false; };
  }, [onUnlock]);

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

    if (step === 1) {
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
    if (step > 1) {
      setStep(step - 1);
      setSubmitError(null);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'register' ? 'login' : 'register');
    setSubmitError(null);
    setStep(1);
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
      // 1. Check if email exists
      const { data: existingUser } = await supabase
        .from("recruits")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email is already registered. Please Login.");
      }

      // 2. Insert new user
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

      // 3. Save Session
      if (newUser) {
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: newUser.id,
          email: formData.email,
          timestamp: Date.now()
        }));
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
        .select("id") 
        .eq("email", loginEmail)
        .eq("password", loginPassword) 
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!data) {
        await new Promise(r => setTimeout(r, 800));
        throw new Error("Invalid email or password.");
      }

      localStorage.setItem("bullmoney_session", JSON.stringify({
        id: data.id,
        email: loginEmail,
        timestamp: Date.now()
      }));

      setTimeout(() => {
        setLoading(false);
        onUnlock();
      }, 2000);

    } catch (err: any) {
      setLoading(false);
      setSubmitError(err.message || "Invalid credentials.");
    }
  };

  const getStepProps = (currentStep: number) => {
    return isVantage ? { number2: currentStep } : { number: currentStep };
  };

  // --- RENDER: SUCCESS (FREE TELEGRAM ACCESS) ---
  if (step === 5 && viewMode === 'register') {
    return (
      <div className="min-h-screen bg-[#010309] flex items-center justify-center p-4 relative">
        <CursorStyles />
        <TargetCursor />
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#010309] to-[#010309] gpu-accel" />
        
        <div className="bg-[#0A1120] border border-blue-500/20 p-8 rounded-2xl shadow-[0_0_50px_rgba(30,58,138,0.2)] text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-900 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-green-500 rounded-full scale-0 animate-[scale-up_0.5s_ease-out_forwards_0.2s] flex items-center justify-center">
              <Check className="w-12 h-12 text-white stroke-[3] opacity-0 animate-[fade-in_0.3s_ease-out_forwards_0.6s]" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Free Access Granted</h2>
          <p className="text-slate-400 mb-8">
            Your account is verified.<br/>
            <span className="text-blue-400 font-medium">Add the Telegram Folder</span> to access all groups.
          </p>
          
          <button 
            onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
            className="w-full py-4 bg-[#229ED9] hover:bg-[#1b8bc2] text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(34,158,217,0.3)] hover:shadow-[0_0_30px_rgba(34,158,217,0.5)] group flex items-center justify-center mb-4 cursor-target"
          >
            <FolderPlus className="w-5 h-5 mr-2 -ml-1 fill-white/10" />
            FREE ACCESS  
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={onUnlock}
            className="text-sm text-slate-500 hover:text-white transition-colors underline underline-offset-4 cursor-target"
          >
            Go to Dashboard
          </button>
        </div>
        <style jsx global>{`
          @keyframes scale-up { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
          @keyframes fade-in { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#010309] flex flex-col items-center justify-center relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-900/10 rounded-full blur-[60px] pointer-events-none" />
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Saving Credentials...</h2>
      </div>
    );
  }

  // --- RENDER: MAIN INTERFACE ---
  return (
    <div className="min-h-screen bg-[#010309] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <CursorStyles />
      <TargetCursor 
        targetSelector="button, a, input, [role='button'], .cursor-target"
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
      />

      <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1200} />
      
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-500",
        isVantage ? "via-purple-900" : "via-blue-900"
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 gpu-accel",
        isVantage ? "bg-purple-900/10" : "bg-blue-900/10"
      )} />

      <div className="w-full max-w-xl relative z-10">
        <div className="mb-8 text-center">
           <h1 className="text-2xl font-black text-white tracking-tight opacity-50">
            BULLMONEY <span className={cn("transition-colors duration-300", isVantage ? "text-purple-600" : "text-blue-600")}>FREE</span>
          </h1>
        </div>

        {/* ================= LOGIN VIEW ================= */}
        {viewMode === 'login' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
             <div className="bg-neutral-900/80 ring-1 ring-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Lock className="w-32 h-32 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Member Login</h2>
                <p className="text-slate-400 mb-6 relative z-10">Sign in to access the platform.</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
                   <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                      <input
                        autoFocus
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all cursor-target"
                      />
                    </div>

                   <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all cursor-target"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-target"
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
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-target"
                    >
                      LOGIN
                      <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-white/5 pt-4">
                  <button onClick={toggleViewMode} className="text-sm text-slate-500 hover:text-white transition-colors cursor-target">
                    Don't have a password? <span className="underline">Register Now</span>
                  </button>
                </div>
             </div>
          </motion.div>
        ) : (
          /* ================= REGISTER VIEW ================= */
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
                        "relative px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 cursor-target",
                        isActive ? "text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      )}
                    >
                      {partner}
                      {isActive && (
                        <motion.span
                          layoutId="tab-pill"
                          className={cn(
                            "absolute inset-0 -z-10 rounded-full",
                            partner === "Vantage"
                              ? "bg-gradient-to-r from-purple-500 to-violet-600 shadow-[0_0_25px_rgba(168,85,247,0.45)]"
                              : "bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_25px_rgba(56,189,248,0.45)]"
                          )}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepCard
                    {...getStepProps(1)}
                    title={`Open ${activeBroker} Account`}
                    className={isVantage 
                      ? "bg-gradient-to-br from-purple-950/40 via-slate-950 to-neutral-950"
                      : "bg-gradient-to-br from-sky-950/40 via-slate-950 to-neutral-950"
                    }
                    actions={
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            onClick={() => copyCode(brokerCode)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition cursor-target",
                              isVantage 
                                ? "text-purple-300 ring-purple-500/40 hover:bg-purple-500/10" 
                                : "text-sky-300 ring-sky-500/40 hover:bg-sky-500/10"
                            )}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy Code"}
                          </button>

                          <button
                            onClick={handleBrokerClick}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow transition cursor-target",
                              isVantage
                                ? "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-violet-600 hover:to-fuchsia-700"
                                : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                            )}
                          >
                            <span>Open {activeBroker} Account</span>
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <p className="text-[15px] leading-relaxed text-neutral-300 mb-4 text-center">
                      To unlock <span className="text-white font-bold">Free Telegram Access</span>, open a real account using code <strong className="text-white">{brokerCode}</strong>.
                    </p>
                    <div className="relative mx-auto w-full max-w-[320px] h-44 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                      <IconPlusCorners />
                      <div className="absolute inset-0 p-2">
                        {isVantage ? <EvervaultCardRed text="BULLMONEY" /> : <EvervaultCard text="X3R7P" />}
                      </div>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                        <motion.button 
                          onClick={handleNext} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                           "flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-widest border transition-all w-full cursor-target",
                           isVantage 
                            ? "bg-purple-500/10 border-purple-500/50 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:bg-purple-500/20"
                            : "bg-sky-500/10 border-sky-500/50 text-sky-100 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:bg-sky-500/20"
                          )}
                        >
                          NEXT STEP <ArrowRight className="w-3 h-3" />
                        </motion.button>
                        
                        <motion.button 
                          onClick={toggleViewMode} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-widest border transition-all w-full cursor-target",
                            isVantage 
                             ? "bg-purple-500/10 border-purple-500/50 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:bg-purple-500/20"
                             : "bg-sky-500/10 border-sky-500/50 text-sky-100 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:bg-sky-500/20"
                          )}
                        >
                          SKIP & LOGIN <LogIn className="w-3 h-3" />
                        </motion.button>
                    </div>
                  </StepCard>
                </motion.div>
              )}

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
                    title="Verify Account"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.mt5Number}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target",
                          !formData.mt5Number ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500" :
                          isVantage ? "bg-white text-purple-950 hover:bg-purple-50" : "bg-white text-blue-950 hover:bg-blue-50"
                        )}
                      >
                        Next Step <ArrowRight className="w-4 h-4" />
                      </button>
                    }
                  >
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                          <p className="text-slate-300 text-sm">Enter the MT5 ID you received.</p>
                          <div className="group relative">
                           <HelpCircle className="w-4 h-4 text-slate-500 hover:text-white cursor-help" />
                           <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-neutral-800 border border-white/10 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             Check your email from {activeBroker} for your login credentials.
                           </div>
                          </div>
                      </div>
                      
                      <div className="relative group">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                        <input
                          autoFocus
                          type="text"
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="e.g. 8839201"
                          className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target"
                        />
                      </div>
                    </div>
                  </StepCard>
                  <button onClick={handleBack} className="mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}

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
                    title="Create Access"
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.email || !formData.password || !acceptedTerms}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target",
                          (!formData.email || !formData.password || !acceptedTerms) ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500" :
                          isVantage ? "bg-white text-purple-950 hover:bg-purple-50" : "bg-white text-blue-950 hover:bg-blue-50"
                        )}
                      >
                        Complete Registration <ArrowRight className="w-4 h-4" />
                      </button>
                    }
                  >
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block ml-1">Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                          <input
                            autoFocus
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block ml-1">Set Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-target"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 ml-1">This will be your key to login later.</p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block ml-1">Referral Code (Optional)</label>
                        <div className="relative group">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                          <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Enter Code (e.g. bmt_justin)"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target"
                          />
                        </div>
                      </div>

                        <div 
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors cursor-target"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors",
                          acceptedTerms 
                            ? (isVantage ? "bg-purple-600 border-purple-600" : "bg-blue-600 border-blue-600") 
                            : "border-slate-500"
                        )}>
                          {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-300 leading-tight">
                            I agree to the <span className="text-white font-semibold">Terms of Service</span>.
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

                  <button onClick={handleBack} className="mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors cursor-target">
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
      "group relative overflow-hidden rounded-2xl p-6",
      "bg-neutral-900/80 ring-1 ring-white/10 backdrop-blur-md",
      "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_8px_40px_rgba(2,6,23,0.35)]",
      className
    )}>
      <div className={cn(
        "pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l blur-2xl",
        useRed ? "from-purple-500/15 via-violet-500/10 to-transparent" : "from-sky-500/15 via-blue-500/10 to-transparent"
      )} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="flex items-center justify-between mb-6">
        <span className={cn(
          "inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-1",
          useRed ? "text-purple-300/90 ring-purple-500/30 bg-purple-500/10" : "text-sky-300/90 ring-sky-500/30 bg-sky-500/10"
        )}>
          Step {n}
        </span>
        <span className="relative text-4xl font-black bg-clip-text text-transparent">
          <span className={cn("bg-gradient-to-br bg-clip-text text-transparent",
            useRed ? "from-purple-400 via-violet-500 to-fuchsia-400" : "from-sky-400 via-blue-500 to-indigo-400"
          )}>
            {n}
          </span>
          <span className={cn("pointer-events-none absolute inset-0 -z-10 blur-2xl bg-gradient-to-br",
            useRed ? "from-purple-500/40 via-violet-600/30 to-fuchsia-500/40" : "from-sky-500/40 via-blue-600/30 to-indigo-500/40"
          )} />
        </span>
      </div>
      <h3 className="text-2xl font-extrabold text-white mb-4">{title}</h3>
      <div className="flex-1">{children}</div>
      {actions && <div className="mt-8 pt-6 border-t border-white/10">{actions}</div>}
    </div>
  );
});

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
            <span className="relative z-20 font-extrabold text-3xl text-white select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

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
}

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
            <span className="relative z-20 font-extrabold text-3xl text-white select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

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