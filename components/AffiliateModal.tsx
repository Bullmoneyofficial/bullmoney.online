"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Volume2, Volume1, VolumeX, X, Palette, Sparkles, MessageCircle, Check, Mail, Hash, Lock, ArrowRight, ChevronLeft, ExternalLink, AlertCircle, Copy, Plus, Eye, EyeOff, FolderPlus, Loader2, ShieldCheck, Clock, User } from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js';
import { gsap } from 'gsap';

// --- CORE STATIC IMPORTS ---
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';
import { safeGetItem, safeSetItem } from '@/lib/localStorage';

// --- LOADER IMPORTS ---
import { MultiStepLoader } from "@/components/Mainpage/MultiStepLoaderAffiliate";
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2";
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock";

// --- PAGE CONTENT IMPORTS ---
import RecruitPage from "@/app/register/New"; 
import RegisterPage from "@/app/recruit/RecruitPage";
import Socials from "@/components/Mainpage/Socialsfooter";

// --- SUPABASE SETUP ---
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

// --- CSS FOR GLOBAL CURSOR & SCROLL LOCK ---
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
    
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #171717 inset !important;
        -webkit-text-fill-color: white !important;
        transition: background-color 5000s ease-in-out 0s;
    }

    body.loader-lock {
        overflow: hidden !important;
        height: 100vh !important;
        width: 100vw !important;
    }
  `}</style>
);

// --- DYNAMIC CURSOR COMPONENT ---
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
                    if (stateRef.current.tickerFn) gsap.ticker.remove(stateRef.current.tickerFn);
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
                    
                    if (!stateRef.current.tickerFn) gsap.ticker.add(stateRef.current.tickerFn!);

                    const handleLeave = () => {
                      gsap.to(stateRef.current.activeStrength, { current: 0, duration: hoverDuration, ease: 'power2.out' });
                      stateRef.current.activeTarget = null;
                      spinTlRef.current?.play();
                      target.removeEventListener('mouseleave', handleLeave);
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

// --- DYNAMIC IMPORTS ---
const Shopmain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
const AffiliateAdmin = dynamic(() => import("@/app/register/AffiliateAdmin"), { ssr: false });
const AffiliateRecruitsDashboard = dynamic(() => import("@/app/recruit/AffiliateRecruitsDashboard"), { ssr: false });

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.ThemeSelector), 
    { ssr: false }
);

// --- LOADING STATES DATA ---
const affiliateLoadingStates = [
  { text: "ESTABLISHING SECURE CONNECTION" },
  { text: "VERIFYING AFFILIATE PROTOCOLS" },
  { text: "SYNCING RECRUIT DATABASE" },
  { text: "DECRYPTING DASHBOARD ACCESS" },
  { text: "WELCOME, ADMIN" },
];

// --- FALLBACK THEME ---
const FALLBACK_THEME: Partial<Theme> = {
    id: 'default',
    name: 'Loading...',
    filter: 'none',
    mobileFilter: 'none',
};

// --- HELPER: GET THEME COLOR ---
const getThemeColor = (theme: Partial<Theme> | any) => {
    if (theme?.primaryColor) return theme.primaryColor;
    
    const colorMap: Record<string, string> = {
        't01': '#3b82f6',
        't02': '#22c55e',
        't03': '#ef4444',
        't04': '#a855f7',
        't05': '#eab308',
        't06': '#ec4899',
    };
    return colorMap[theme?.id] || '#3b82f6';
};

// --- FORM DATA INTERFACES ---
interface FormData {
  email: string;
  mt5Number: string;
  password: string;
  referralCode: string;
}

// --- StepCard Component ---
const StepCard = memo(({ number, number2, title, children, actions, className }: any) => {
  const useRed = typeof number2 === "number";
  const n = useRed ? number2 : number;
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-6 md:p-8",
      "bg-black/80 ring-2 ring-blue-500/30 backdrop-blur-xl",
      "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
      className
    )}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-10" />
      </div>
      
      <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l blur-2xl from-blue-500/20 via-blue-500/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-blue-500/10" />
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-2 text-blue-300/90 ring-blue-500/30 bg-black/60">
          Step {n} of 3
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4">{title}</h3>
      <div className="flex-1">{children}</div>
      {actions && <div className="mt-6 md:mt-8 pt-6 border-t border-blue-500/20">{actions}</div>}
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

// --- Card Components ---
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
}

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
      <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-blue-100/90 font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}

// =========================================
// MAIN AFFILIATE MODAL COMPONENT
// =========================================

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AffiliateModal({ isOpen, onClose }: AffiliateModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [step, setStep] = useState(0);
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    mt5Number: '',
    password: '',
    referralCode: ''
  });

  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";

  // Theme/audio state
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01');
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);

  // Initialize
  useEffect(() => {
    if (!isOpen) return;
    
    setIsClient(true);
    
    const storedTheme = safeGetItem('user_theme_id');
    const storedMute = safeGetItem('user_is_muted');
    const storedVol = safeGetItem('user_volume');
    
    if (storedTheme) setActiveThemeId(storedTheme);
    if (storedMute !== null) setIsMuted(storedMute === 'true');
    if (storedVol) setVolume(parseInt(storedVol));
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

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

    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!isValidMT5(formData.mt5Number)) {
        setSubmitError("Please enter a valid MT5 ID (min 5 digits).");
        return;
      }
      setStep(3);
    } else if (step === 3) {
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
    setStep(4);
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
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: newUser.id,
          email: formData.email,
          timestamp: Date.now()
        }));
      }

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

  const getStepProps = (currentStep: number) => {
    return isVantage ? { number2: currentStep } : { number: currentStep };
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // SUCCESS SCREEN (Step 5)
  if (step === 5) {
    return (
      <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8">
        <CursorStyles />
        <TargetCursor />
        
        <div className="bg-black/80 border-2 border-blue-500/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-blue-500 rounded-full scale-0 animate-[scale-up_0.5s_ease-out_forwards_0.2s] flex items-center justify-center">
              <Check className="w-12 h-12 text-white stroke-[3] opacity-0 animate-[fade-in_0.3s_ease-out_forwards_0.6s]" />
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">You&apos;re In 🚀</h2>
          <p className="text-blue-200/70 mb-8 text-sm md:text-base">
            Your free BullMoney access is now active.<br/>
          </p>
          
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-black border-2 border-blue-500/60 hover:border-blue-400 text-blue-400 rounded-xl font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] group flex items-center justify-center mb-4 cursor-target relative overflow-hidden"
          >
            <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-30 z-0" />
            <span className="relative z-10 flex items-center">
              Go to Dashboard  
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <button 
            onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
            className="text-sm text-blue-400/60 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 mx-auto cursor-target"
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

  // LOADING SCREEN (Step 4)
  if (step === 4) {
    return (
      <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-10" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-blue-300">Unlocking Platform...</h2>
        </div>
      </div>
    );
  }

  // MAIN FORM
  return (
    <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8">
      <CursorStyles />
      <TargetCursor 
        targetSelector="button, a, input, [role='button'], .cursor-target"
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
      />
      
      <div className="relative w-full max-w-2xl bg-black/95 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl shadow-black/50 overflow-hidden">
        
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[9999999] p-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 group"
          aria-label="Close modal"
        >
          <X size={18} className="sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="relative w-full h-full overflow-y-auto rounded-2xl sm:rounded-3xl">
          
          <div className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center justify-center">
            
            {/* Broker selector for step 1 */}
            {step === 1 && (
              <div className="flex justify-center gap-3 mb-8 w-full">
                {(["Vantage", "XM"] as const).map((partner) => {
                  const isActive = activeBroker === partner;
                  return (
                    <button
                      key={partner}
                      onClick={() => handleBrokerSwitch(partner)}
                      className={cn(
                        "relative px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 cursor-target text-sm md:text-base",
                        isActive ? "text-blue-300" : "bg-black/60 border-2 border-blue-500/20 text-blue-300/60 hover:border-blue-500/40"
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

            <div className="w-full max-w-xl">
              <AnimatePresence mode="wait">
                
                {/* STEP 0: ENTRY */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-black/80 ring-2 ring-blue-500/30 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] relative overflow-hidden text-center">
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        <span className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-10" />
                      </div>
                      
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Lock className="w-32 h-32 text-blue-400" />
                      </div>

                      <div className="mb-6 flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center border-2 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                          <ShieldCheck className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Unlock Free BullMoney Access</h2>
                      <p className="text-blue-200/70 text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed">
                        Get free trading setups and community access. <br/>
                        <span className="text-blue-300/40">No payment. Takes about 2 minutes.</span>
                      </p>

                      <motion.button 
                        onClick={handleNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 md:py-4 bg-black border-2 border-blue-500/60 hover:border-blue-400 text-blue-400 rounded-xl font-bold text-base md:text-lg tracking-wide transition-all shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] flex items-center justify-center cursor-target relative overflow-hidden"
                      >
                        <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-40 z-0" />
                        <span className="relative z-10 flex items-center">
                          Start Free Access <ArrowRight className="w-5 h-5 ml-2" />
                        </span>
                      </motion.button>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs text-blue-400/40">
                          <Lock className="w-3 h-3" /> No credit card required
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: OPEN ACCOUNT */}
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
                      title="Open Free Account"
                      className="bg-black/80"
                      actions={
                        <div className="flex flex-col gap-3 md:gap-4">
                          <p className="text-xs text-center text-blue-300/50 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> Takes about 1 minute • No deposit required
                          </p>
                          
                          <div className="flex flex-col items-center justify-center gap-3">
                            <button
                              onClick={() => copyCode(brokerCode)}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ring-2 ring-inset transition cursor-target w-full justify-center mb-1 text-blue-300 ring-blue-500/40 hover:bg-blue-500/10"
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copied ? "Copied" : `Copy Code: ${brokerCode}`}
                            </button>

                            <button
                              onClick={handleBrokerClick}
                              className="w-full py-3.5 rounded-xl font-bold text-blue-400 shadow transition flex items-center justify-center gap-2 cursor-target text-base bg-black border-2 border-blue-500/60 hover:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] relative overflow-hidden"
                            >
                              <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-30 z-0" />
                              <span className="relative z-10 flex items-center gap-2">
                                Open Free Account
                                <ExternalLink className="h-4 w-4" />
                              </span>
                            </button>
                          </div>
                          
                          <button 
                            onClick={handleNext}
                            className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 mt-1 border-blue-500/30 text-blue-300 bg-black/60 hover:bg-blue-950/30 hover:border-blue-500/50 cursor-target"
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
                      
                      <div className="relative mx-auto w-full max-w-[280px] h-32 md:h-40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl mb-2 opacity-80 hover:opacity-100 transition-opacity">
                        <IconPlusCorners />
                        <div className="absolute inset-0 p-2">
                          {isVantage ? <EvervaultCardRed text="VANTAGE" /> : <EvervaultCard text="X3R7P" />}
                        </div>
                      </div>
                    </StepCard>
                  </motion.div>
                )}

                {/* STEP 2: VERIFY ID */}
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
                              ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-blue-500/20 text-blue-300/50" 
                              : "bg-black border-2 border-blue-500/60 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                          )}
                        >
                          {formData.mt5Number && <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-30 z-0" />}
                          <span className="relative z-10 flex items-center gap-2">
                            Continue <ArrowRight className="w-4 h-4" />
                          </span>
                        </button>
                      }
                    >
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-slate-300 text-sm">After opening your account, you&apos;ll receive an email with your trading ID (MT5 ID).</p>
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

                {/* STEP 3: CREATE LOGIN */}
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
                              ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-blue-500/20 text-blue-300/50" 
                              : "bg-black border-2 border-blue-500/60 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                          )}
                        >
                          {(formData.email && formData.password && acceptedTerms) && <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-30 z-0" />}
                          <span className="relative z-10 flex items-center gap-2">
                            Unlock My Access <ArrowRight className="w-4 h-4" />
                          </span>
                        </button>
                      }
                    >
                      <p className="text-blue-200/60 text-xs md:text-sm mb-4">This lets you access <span className="text-blue-300 font-medium">setups</span>, tools, and the community.</p>
                      <div className="space-y-4 pt-1">
                        <div>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                            <input
                              autoFocus
                              type="email"
                              name="email"
                              autoComplete="username"
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
                              autoComplete="new-password"
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

                    <button onClick={handleBack} className="mt-4 flex items-center text-blue-300/50 hover:text-blue-300 text-sm mx-auto transition-colors cursor-target">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
